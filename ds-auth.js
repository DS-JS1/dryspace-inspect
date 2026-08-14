/* Dryspace — Microsoft sign-in (OAuth 2.0 authorization code + PKCE).
   ---------------------------------------------------------------------------
   Hand-written rather than using MSAL, because this app's defining property is
   being self-contained: one tenant, one scope, one account per device. MSAL's
   value is in the cases we do not have.

   PKCE means there is no client secret anywhere, which is why the client and
   tenant ids can sit in a public repository. The secret is generated fresh on
   the device for each sign-in and never leaves it.

   Auth only ever matters when online — uploads are the only thing that needs a
   token — so a sign-in problem can never strand someone in a basement. */
(function(global){
'use strict';

var DSAuth = {};

var LOGIN = 'https://login.microsoftonline.com/';
/* Refresh a little early. A token that expires mid-upload fails the whole file,
   and a large photo can be in flight for minutes on a weak connection. */
var SKEW_MS = 5 * 60 * 1000;

function b64url(bytes){
  var s = '';
  var b = new Uint8Array(bytes);
  for(var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return global.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBytes(n){
  var a = new Uint8Array(n);
  global.crypto.getRandomValues(a);
  return a;
}

DSAuth.makeVerifier = function(){ return b64url(randomBytes(48)); };

DSAuth.challengeFor = function(verifier){
  var data = new global.TextEncoder().encode(verifier);
  return global.crypto.subtle.digest('SHA-256', data).then(b64url);
};

DSAuth.form = function(obj){
  return Object.keys(obj)
    .filter(function(k){ return obj[k] !== undefined && obj[k] !== null; })
    .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); })
    .join('&');
};

DSAuth.create = function(cfg){
  cfg = cfg || {};
  var clientId = cfg.clientId, tenantId = cfg.tenantId;
  var redirectUri = cfg.redirectUri;
  var scopes = cfg.scopes || 'https://graph.microsoft.com/Files.ReadWrite.All offline_access openid profile';
  var doFetch = cfg.fetchImpl || (global.fetch && global.fetch.bind(global));
  var store = cfg.storage || global.localStorage;
  var now = cfg.now || function(){ return Date.now(); };
  var KEY = 'ds-auth-' + (clientId || 'x');
  var PEND = KEY + '-pending';

  function read(k){
    try { var v = store.getItem(k); return v ? JSON.parse(v) : null; } catch(e){ return null; }
  }
  function write(k, v){
    try { v === null ? store.removeItem(k) : store.setItem(k, JSON.stringify(v)); } catch(e){}
  }

  function authority(){ return LOGIN + tenantId + '/oauth2/v2.0/'; }

  function tokenRequest(body){
    return doFetch(authority() + 'token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: DSAuth.form(body)
    }).then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(j){
        if(!res.ok){
          var e = new Error('sign-in failed: ' + (j.error_description || j.error || res.status));
          e.status = res.status;
          e.oauthError = j.error;
          throw e;
        }
        return j;
      });
    }, function(netErr){
      var e = new Error('network: ' + ((netErr && netErr.message) || netErr));
      e.offline = true;
      throw e;
    });
  }

  function persist(tok){
    var saved = {
      accessToken: tok.access_token,
      /* Entra rotates SPA refresh tokens on every use and they are short lived,
         so the NEW one must replace the old or the next refresh fails. */
      refreshToken: tok.refresh_token || (read(KEY) || {}).refreshToken || null,
      expiresAt: now() + ((tok.expires_in || 3600) * 1000),
      account: tok.account || (read(KEY) || {}).account || null
    };
    if(tok.id_token && !saved.account){
      try {
        var mid = tok.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        var claims = JSON.parse(global.atob(mid));
        saved.account = {username: claims.preferred_username || claims.upn || '', name: claims.name || ''};
      } catch(e){}
    }
    write(KEY, saved);
    return saved;
  }

  var inFlight = null;

  function refresh(){
    var cur = read(KEY);
    if(!cur || !cur.refreshToken){
      var e = new Error('not signed in');
      e.needsSignIn = true;
      return Promise.reject(e);
    }
    /* Concurrent uploads must not each spend the single-use refresh token. */
    if(inFlight) return inFlight;
    inFlight = tokenRequest({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: cur.refreshToken,
      scope: scopes
    }).then(function(tok){
      inFlight = null;
      return persist(tok).accessToken;
    }, function(err){
      inFlight = null;
      /* A rejected refresh token cannot be recovered from — clear it so the app
         asks for a fresh sign-in rather than retrying something already dead. */
      if(err && err.status >= 400 && err.status < 500 && !err.offline){
        write(KEY, null);
        err.needsSignIn = true;
      }
      throw err;
    });
    return inFlight;
  }

  return {
    isSignedIn: function(){
      var c = read(KEY);
      return !!(c && c.refreshToken);
    },
    account: function(){
      var c = read(KEY);
      return (c && c.account) || null;
    },

    /* Starts the redirect. The verifier stays on this device; only its hash
       travels, so an intercepted authorization code is useless on its own. */
    signIn: function(navigate){
      var verifier = DSAuth.makeVerifier();
      var state = b64url(randomBytes(16));
      write(PEND, {verifier: verifier, state: state, at: now()});
      return DSAuth.challengeFor(verifier).then(function(challenge){
        var url = authority() + 'authorize?' + DSAuth.form({
          client_id: clientId,
          response_type: 'code',
          redirect_uri: redirectUri,
          response_mode: 'query',
          scope: scopes,
          code_challenge: challenge,
          code_challenge_method: 'S256',
          state: state
        });
        (navigate || function(u){ global.location.assign(u); })(url);
        return url;
      });
    },

    /* Called on every start-up. Returns null when this is an ordinary launch. */
    handleRedirect: function(search, replaceUrl){
      var q = new global.URLSearchParams(search === undefined ? global.location.search : search);
      var code = q.get('code'), state = q.get('state'), err = q.get('error');
      if(!code && !err) return Promise.resolve(null);

      var pend = read(PEND);
      write(PEND, null);
      var clean = replaceUrl || function(){
        try { global.history.replaceState({}, '', global.location.pathname); } catch(e){}
      };
      clean();

      if(err){
        var e1 = new Error(q.get('error_description') || err);
        e1.oauthError = err;
        return Promise.reject(e1);
      }
      if(!pend || !pend.state || pend.state !== state){
        /* Mismatched state means this response does not belong to a sign-in
           this device started. Refuse it. */
        return Promise.reject(new Error('sign-in response did not match this device'));
      }
      return tokenRequest({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: pend.verifier,
        scope: scopes
      }).then(function(tok){ return persist(tok); });
    },

    /* What the SharePoint transport calls before every request. */
    getToken: function(){
      var c = read(KEY);
      if(!c){
        var e = new Error('not signed in');
        e.needsSignIn = true;
        return Promise.reject(e);
      }
      if(c.accessToken && c.expiresAt - SKEW_MS > now()) return Promise.resolve(c.accessToken);
      return refresh();
    },

    signOut: function(){
      write(KEY, null);
      write(PEND, null);
    }
  };
};

global.DSAuth = DSAuth;
if(typeof module !== 'undefined' && module.exports) module.exports = DSAuth;

})(typeof self !== 'undefined' ? self : this);
