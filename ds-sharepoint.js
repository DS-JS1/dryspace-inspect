/* Dryspace — SharePoint transport for ds-media-sync.
   ---------------------------------------------------------------------------
   Implements the {upload, verify} interface the upload queue is written
   against. Everything specific to Microsoft Graph lives here, so ds-media-sync
   stays storage-agnostic and a different destination later is a swap of this
   file rather than a rewrite.

   Takes getToken() rather than doing its own authentication, so the token
   source can be MSAL, a hand-rolled PKCE flow, or a stub in tests. */
(function(global){
'use strict';

var GRAPH = 'https://graph.microsoft.com/v1.0';

/* Graph requires resumable chunks to be a multiple of 320 KiB. 5 MiB is both a
   clean multiple and around Microsoft's recommended size — small enough that a
   dropped connection loses little, large enough to avoid per-chunk overhead. */
var CHUNK = 5 * 1024 * 1024;
var SIMPLE_MAX = 4 * 1024 * 1024;   /* above this, Graph wants a session */

function DSSharePoint(){}

/* Errors carry .status so the queue's retry policy can tell a flat tyre from a
   dead end: 5xx and 429 are worth retrying, 400 and 403 never are. */
function httpError(res, body){
  var e = new Error('Graph ' + res.status + ' ' + (res.statusText || '') +
                    (body ? ' — ' + String(body).slice(0, 300) : ''));
  e.status = res.status;
  if(res.status === 429){
    var ra = res.headers && res.headers.get && res.headers.get('Retry-After');
    if(ra) e.retryAfterMs = (parseInt(ra, 10) || 0) * 1000;
  }
  return e;
}

function netError(err){
  var e = new Error('network: ' + ((err && err.message) || err));
  e.offline = true;                 /* no status — the queue treats this as retryable */
  return e;
}

DSSharePoint.createTransport = function(opts){
  opts = opts || {};
  var getToken = opts.getToken;
  var host = opts.hostname;                 /* dryspacesolutions.sharepoint.com */
  var sitePath = opts.sitePath;             /* /sites/SiteInspections */
  var doFetch = opts.fetchImpl || (global.fetch && global.fetch.bind(global));
  var folderOf = opts.folderOf;             /* (rec, meta) -> folder name */
  var nameOf = opts.nameOf;                 /* (rec, meta) -> file name */

  var driveId = null;                       /* resolved once, then cached */
  var ensured = {};                         /* folder name -> Promise, so a batch
                                               of photos creates it only once */

  function call(url, init){
    init = init || {};
    return Promise.resolve(getToken()).then(function(token){
      init.headers = init.headers || {};
      init.headers.Authorization = 'Bearer ' + token;
      return doFetch(url, init).catch(function(e){ throw netError(e); });
    }).then(function(res){
      if(res.ok) return res;
      return res.text().catch(function(){ return ''; }).then(function(body){
        throw httpError(res, body);
      });
    });
  }

  function json(url, init){
    return call(url, init).then(function(res){
      return res.status === 204 ? null : res.json();
    });
  }

  /* Resolved at runtime rather than configured, so renaming the library in
     SharePoint cannot silently break uploads. */
  function drive(){
    if(driveId) return Promise.resolve(driveId);
    return json(GRAPH + '/sites/' + encodeURIComponent(host) + ':' + sitePath)
      .then(function(site){
        if(!site || !site.id) throw new Error('site not found: ' + host + sitePath);
        return json(GRAPH + '/sites/' + site.id + '/drive');
      })
      .then(function(d){
        if(!d || !d.id) throw new Error('default document library not found');
        driveId = d.id;
        return driveId;
      });
  }

  /* Graph does not create intermediate folders on upload; a missing folder is
     just a 404 at PUT time. Create it explicitly, treating "already exists" as
     success so concurrent photos do not fight over it. */
  /* Handles a nested path ("INS-2026-0142 - 12 Marine Pde/photos"), creating each level
     in turn — Graph will not create intermediate folders for you. */
  function ensureFolder(path){
    if(ensured[path]) return ensured[path];
    var segs = String(path).split('/').filter(Boolean);
    ensured[path] = drive().then(function(id){
      var chain = Promise.resolve(), sofar = '';
      segs.forEach(function(seg){
        chain = chain.then(function(){
          var parent = sofar;
          sofar = sofar ? sofar + '/' + seg : seg;
          var url = parent
            ? GRAPH + '/drives/' + id + '/root:/' + encodePath(parent) + ':/children'
            : GRAPH + '/drives/' + id + '/root/children';
          return json(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              name: seg,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'fail'
            })
          }).then(function(f){ return f; }, function(err){
            if(err && err.status === 409) return {name: seg, existed: true};
            throw err;
          });
        });
      });
      return chain;
    });
    /* A failed creation must not be cached, or every later photo inherits it. */
    ensured[path] = ensured[path].catch(function(e){ delete ensured[path]; throw e; });
    return ensured[path];
  }

  function encodePath(p){
    return String(p).split('/').map(encodeURIComponent).join('/');
  }

  function simpleUpload(id, path, blob){
    return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path) + ':/content', {
      method: 'PUT',
      headers: {'Content-Type': blob.type || 'application/octet-stream'},
      body: blob
    });
  }

  /* Resumable. The session URL is returned so a caller can persist it and pick
     a broken upload back up rather than starting the file again — which is the
     difference between finishing on the drive home and never finishing. */
  function sessionUpload(id, path, blob, onProgress){
    return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path) + ':/createUploadSession', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({item: {'@microsoft.graph.conflictBehavior': 'replace'}})
    }).then(function(sess){
      if(!sess || !sess.uploadUrl) throw new Error('no upload session returned');
      var total = blob.size;
      function put(start){
        if(start >= total) throw new Error('upload session ended without a result');
        var end = Math.min(start + CHUNK, total);
        var slice = blob.slice(start, end);
        return doFetch(sess.uploadUrl, {
          method: 'PUT',
          headers: {'Content-Range': 'bytes ' + start + '-' + (end - 1) + '/' + total},
          body: slice
        }).catch(function(e){ throw netError(e); }).then(function(res){
          if(res.status === 202){
            if(onProgress) onProgress(end / total);
            return res.json().catch(function(){ return null; }).then(function(next){
              var ranges = next && next.nextExpectedRanges;
              var resume = ranges && ranges.length ? parseInt(String(ranges[0]).split('-')[0], 10) : end;
              return put(isNaN(resume) ? end : resume);
            });
          }
          if(res.ok){
            if(onProgress) onProgress(1);
            return res.json();
          }
          return res.text().catch(function(){ return ''; }).then(function(b){
            throw httpError(res, b);
          });
        });
      }
      return put(0);
    });
  }

  return {
    /* Exposed for diagnostics — "can this device see the library at all?" is the
       first question worth answering when an upload fails. */
    resolveDrive: drive,

    upload: function(rec, meta, onProgress){
      var blob = (global.DSMedia && global.DSMedia.originalOf(rec)) || rec.original || rec.blob;
      if(!blob) return Promise.reject(new Error('no original to upload'));
      var folder = folderOf(rec, meta);
      var name = nameOf(rec, meta);
      var path = folder + '/' + name;
      return ensureFolder(folder)
        .then(function(){ return drive(); })
        .then(function(id){
          return blob.size > SIMPLE_MAX
            ? sessionUpload(id, path, blob, onProgress)
            : simpleUpload(id, path, blob);
        })
        .then(function(item){
          if(!item || !item.id) throw new Error('upload returned no item id');
          return {
            driveId: driveId,
            itemId: item.id,
            webUrl: item.webUrl || null,
            path: path,
            size: item.size
          };
        });
    },

    /* Deliberately a fresh read of the item rather than reuse of the upload
       response. An upload can report success on a truncated write; only reading
       the stored file back proves what is actually there. */
    verify: function(remote){
      if(!remote || !remote.itemId) return Promise.reject(new Error('nothing to verify'));
      return drive().then(function(id){
        return json(GRAPH + '/drives/' + (remote.driveId || id) + '/items/' +
                    encodeURIComponent(remote.itemId) + '?select=id,name,size,eTag,webUrl');
      }).then(function(item){
        if(!item || !item.id) throw new Error('item not found after upload');
        return {itemId: item.id, size: item.size, eTag: item.eTag || null,
                webUrl: item.webUrl || null, name: item.name};
      });
    }
  };
};

DSSharePoint.CHUNK = CHUNK;
DSSharePoint.SIMPLE_MAX = SIMPLE_MAX;

global.DSSharePoint = DSSharePoint;
if(typeof module !== 'undefined' && module.exports) module.exports = DSSharePoint;

})(typeof self !== 'undefined' ? self : this);
