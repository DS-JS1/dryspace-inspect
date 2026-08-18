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

/* B6 — a request that hangs leaves the app sitting at "Uploading…" forever
   with nothing on screen to read and no way out. Every request now carries a
   deadline. A blown deadline aborts the request and surfaces as a temporary
   failure, which is what it usually is: a stalled connection, not a bad file. */
var TIMEOUT_MS = 60000;           /* metadata, folder creation, verification */
var UPLOAD_TIMEOUT_MS = 180000;   /* one 5 MiB chunk over a weak mobile connection */
/* A whole file, however many chunks it takes. Per-chunk deadlines cannot bound
   this on their own: a session that keeps answering promptly but never advances
   satisfies every one of them and still never finishes. */
var SESSION_TIMEOUT_MS = 900000;  /* 15 minutes */

/* Graph answers a chunk it did not commit with a 202 whose nextExpectedRanges
   points back at bytes already sent. Obeying that answer for ever is a livelock:
   each request succeeds well inside its deadline, the file never advances, and
   the app shows "Uploading…" indefinitely. Re-sending a chunk once or twice is
   legitimate; doing it for ever is not. A fake transport always advances, which
   is exactly why this survived every test the resumable path has ever had. */
var MAX_STALLS = 3;

function DSSharePoint(){}

/* Carries .offline so the queue's retry policy treats it as worth another go,
   and .timedOut so the UI can say what actually happened rather than "network". */
function timeoutError(ms){
  var e = new Error('timed out after ' + Math.round(ms / 1000) + 's');
  e.timedOut = true;
  e.offline = true;
  return e;
}

/* fetch with an abort deadline. The timer is cleared on settle, so a request
   that finishes cannot abort anything later. If the platform has no
   AbortController the call proceeds untimed rather than failing outright —
   losing the deadline is better than losing the upload. */
/* getToken() is awaited *before* the request is issued, so it sits outside the
   request's own deadline. A sign-in server that never answers would otherwise
   hang the upload with nothing sent and nothing on screen — the earliest and
   least visible stall in the whole chain. ds-auth carries its own deadline; this
   is the backstop for any token source that does not. */
function within(promise, ms){
  if(!ms) return Promise.resolve(promise);
  return new Promise(function(resolve, reject){
    var t = global.setTimeout(function(){ reject(timeoutError(ms)); }, ms);
    Promise.resolve(promise).then(
      function(v){ global.clearTimeout(t); resolve(v); },
      function(e){ global.clearTimeout(t); reject(e); });
  });
}

function fetchWithTimeout(doFetch, url, init, ms){
  init = init || {};
  if(!ms || typeof global.AbortController !== 'function') return doFetch(url, init);
  var ctl = new global.AbortController();
  init.signal = ctl.signal;
  var timer = null;
  function done(){ if(timer !== null){ global.clearTimeout(timer); timer = null; } }
  return new Promise(function(resolve, reject){
    timer = global.setTimeout(function(){
      timer = null;
      try { ctl.abort(); } catch(e){}
      reject(timeoutError(ms));
    }, ms);
    doFetch(url, init).then(resolve, reject);
  }).then(function(res){ done(); return res; },
          function(err){ done(); throw err; });
}

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

  var tagOf = opts.tagOf;                   /* (rec, meta) -> {path, fields} | null */
  /* Overridable so the tests can prove the deadline fires without waiting a
     minute for it. Production never sets these. */
  var timeoutMs = opts.timeoutMs === undefined ? TIMEOUT_MS : opts.timeoutMs;
  var uploadTimeoutMs = opts.uploadTimeoutMs === undefined ? UPLOAD_TIMEOUT_MS : opts.uploadTimeoutMs;
  var sessionTimeoutMs = opts.sessionTimeoutMs === undefined ? SESSION_TIMEOUT_MS : opts.sessionTimeoutMs;
  var nowMs = opts.now || function(){ return Date.now(); };

  var driveId = null;                       /* resolved once, then cached */
  var ensured = {};                         /* folder name -> Promise, so a batch
                                               of photos creates it only once */
  var tagged = {};                          /* folder path -> true, likewise */

  function call(url, init, ms){
    init = init || {};
    return within(getToken(), timeoutMs).then(function(token){
      init.headers = init.headers || {};
      init.headers.Authorization = 'Bearer ' + token;
      return fetchWithTimeout(doFetch, url, init, ms === undefined ? timeoutMs : ms)
        .catch(function(e){ throw (e && e.timedOut) ? e : netError(e); });
    }).then(function(res){
      if(res.ok) return res;
      return res.text().catch(function(){ return ''; }).then(function(body){
        throw httpError(res, body);
      });
    });
  }

  function json(url, init, ms){
    return call(url, init, ms).then(function(res){
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

  /* Writes the inspection's identity onto the folder as library columns, so the
     folder list IS the index — sortable, filterable, searchable — with nothing
     to generate and nothing that can drift out of step.

     Set at write time rather than reconciled afterwards: anything a scheduled
     job reconciles is a thing that can fail quietly and be discovered weeks
     later with folders missing.

     Failure here is deliberately survivable. The columns are a convenience; the
     photograph is evidence. If the columns do not exist on the library, or the
     write is refused, the upload carries on regardless. */
  function setFolderFields(path, fields){
    var keys = Object.keys(fields || {});
    if(!keys.length) return Promise.resolve(null);
    return drive().then(function(id){
      return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path));
    }).then(function(item){
      if(!item || !item.id) throw new Error('folder not found for tagging: ' + path);
      return json(GRAPH + '/drives/' + driveId + '/items/' + encodeURIComponent(item.id) +
                  '/listItem/fields', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(fields)
      });
    });
  }

  function tagFolder(rec, meta){
    if(!tagOf) return Promise.resolve(null);
    var tag;
    try { tag = tagOf(rec, meta); } catch(e){ return Promise.resolve(null); }
    if(!tag || !tag.path || !tag.fields) return Promise.resolve(null);
    if(tagged[tag.path]) return Promise.resolve(null);   /* once per batch */
    tagged[tag.path] = true;
    return setFolderFields(tag.path, tag.fields).catch(function(e){
      delete tagged[tag.path];                            /* let a later photo retry */
      console.warn('Folder columns not written — do they exist on the library? ' +
                   ((e && e.message) || e));
      return null;
    });
  }

  function simpleUpload(id, path, blob){
    return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path) + ':/content', {
      method: 'PUT',
      headers: {'Content-Type': blob.type || 'application/octet-stream'},
      body: blob
    }, uploadTimeoutMs);
  }

  /* Resumable, in the sense that Graph will accept the file in chunks. Note that
     the session URL is deliberately *not* persisted across attempts: a failed
     upload starts a fresh session from byte 0. Carrying it over would let a
     retry resume where it stopped, and is worth doing — but it is a change to
     what the record stores, so it belongs with the schema work, not here. */
  function sessionUpload(id, path, blob, onProgress){
    return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path) + ':/createUploadSession', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({item: {'@microsoft.graph.conflictBehavior': 'replace'}})
    }).then(function(sess){
      if(!sess || !sess.uploadUrl) throw new Error('no upload session returned');
      var total = blob.size;
      var deadline = nowMs() + sessionTimeoutMs;
      var furthest = 0, stalls = 0;
      function put(start){
        if(start >= total) throw new Error('upload session ended without a result');
        if(sessionTimeoutMs && nowMs() > deadline){
          var slow = new Error('upload did not finish within ' +
                               Math.round(sessionTimeoutMs / 1000) + 's — stopped at byte ' +
                               start + ' of ' + total);
          slow.timedOut = true;
          slow.offline = true;
          throw slow;
        }
        var end = Math.min(start + CHUNK, total);
        var slice = blob.slice(start, end);
        /* The chunk PUT does not go through call() — an upload session URL is
           pre-authorised and must not carry the bearer token. It still needs the
           deadline: this is the request most likely to hang on a phone. */
        return fetchWithTimeout(doFetch, sess.uploadUrl, {
          method: 'PUT',
          headers: {'Content-Range': 'bytes ' + start + '-' + (end - 1) + '/' + total},
          body: slice
        }, uploadTimeoutMs)
          .catch(function(e){ throw (e && e.timedOut) ? e : netError(e); })
          .then(function(res){
          if(res.status === 202){
            if(onProgress) onProgress(end / total);
            return res.json().catch(function(){ return null; }).then(function(next){
              var ranges = next && next.nextExpectedRanges;
              var resume = ranges && ranges.length ? parseInt(String(ranges[0]).split('-')[0], 10) : end;
              if(isNaN(resume)) resume = end;
              /* Forward progress is the thing being checked, not equality with
                 what we sent — Graph may legitimately commit less than a full
                 chunk and ask for the remainder. */
              if(resume > furthest){
                furthest = resume;
                stalls = 0;
              } else if(++stalls >= MAX_STALLS){
                /* No status, so the queue treats it as worth another go: a new
                   attempt opens a new session, which is the actual remedy. */
                var e = new Error('upload stopped advancing at byte ' + resume +
                                  ' of ' + total + ' after ' + stalls + ' attempts');
                e.stalled = true;
                throw e;
              }
              return put(resume);
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

  /* ═════ v1.4: the record travels the same way the photos do ═════
     Until now this transport could only push a photo. The draft — the actual
     baton — went out through the OS share sheet, which on a phone offers
     WhatsApp. These four are what let the record move through SharePoint
     instead: see what is there, fetch it, put it back, and file the old one. */

  /* An inspection folder that has never been used is empty, not broken. Graph
     says 404; the caller wants []. Any other failure is real and is thrown. */
  function listFolder(path){
    return drive().then(function(id){
      /* The library ROOT has no path, and Graph has no way to say "the empty
         path" in the root:/...: form - it rejects root::/children with a 400,
         "Resource not found for the segment 'root:'". Listing the root is a
         different URL shape, exactly as folder creation already knew.
         This is why "Take over an inspection from SharePoint" could not find
         anything: scanning starts by listing the library root. */
      var sel = '?select=id,name,size,eTag,lastModifiedDateTime,folder,file';
      var url = path
        ? GRAPH + '/drives/' + id + '/root:/' + encodePath(path) + ':/children' + sel
        : GRAPH + '/drives/' + id + '/root/children' + sel;
      return json(url);
    }).then(function(r){
      return ((r && r.value) || []).map(function(it){
        return {itemId: it.id, name: it.name, size: it.size,
                eTag: it.eTag || null,
                modifiedAt: it.lastModifiedDateTime || null,
                isFolder: !!it.folder};
      });
    }, function(err){
      if(err && err.status === 404) return [];
      throw err;
    });
  }

  function downloadItem(itemId){
    return drive().then(function(id){
      return call(GRAPH + '/drives/' + id + '/items/' + encodeURIComponent(itemId) + '/content',
                  {}, uploadTimeoutMs);
    }).then(function(res){ return res.blob(); });
  }

  /* A move within one library keeps the item id, so links already handed out
     still resolve (D9). It is also not a delete, which matters when field
     accounts are Contribute - No Delete. */
  function moveItem(itemId, toFolderPath, newName){
    return ensureFolder(toFolderPath).then(function(){
      return drive();
    }).then(function(id){
      return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(toFolderPath), null, timeoutMs)
        .then(function(dest){
          if(!dest || !dest.id) throw new Error('could not find ' + toFolderPath);
          var body = {parentReference: {id: dest.id}};
          if(newName) body.name = newName;
          return json(GRAPH + '/drives/' + id + '/items/' + encodeURIComponent(itemId), {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
          }, timeoutMs);
        });
    });
  }

  /* Small files only — a draft is tens of kilobytes. Deliberately not routed
     through the chunked path: a session for a 40 KB file is pure overhead, and
     the simple PUT is the one already proven in the field. */
  function uploadSmall(path, blob, conflict){
    return ensureFolder(path.split('/').slice(0, -1).join('/')).then(function(){
      return drive();
    }).then(function(id){
      return json(GRAPH + '/drives/' + id + '/root:/' + encodePath(path) +
                  ':/content?@microsoft.graph.conflictBehavior=' + (conflict || 'replace'), {
        method: 'PUT',
        headers: {'Content-Type': blob.type || 'application/json'},
        body: blob
      }, uploadTimeoutMs);
    }).then(function(item){
      if(!item || !item.id) throw new Error('upload returned no item id');
      return {itemId: item.id, name: item.name, size: item.size,
              eTag: item.eTag || null, webUrl: item.webUrl || null};
    });
  }

  return {
    /* Exposed for diagnostics — "can this device see the library at all?" is the
       first question worth answering when an upload fails. */
    resolveDrive: drive,

    list: listFolder,
    download: downloadItem,
    move: moveItem,
    putSmall: uploadSmall,
    ensureFolder: ensureFolder,

    /* Exposed so the columns can be refreshed at handover as well as on upload.
       Bypasses the once-per-batch cache tagFolder() uses, because a handover is
       a deliberate act at a point where the record has just changed — exactly
       when the folder's metadata is most likely to be stale. */
    setFields: setFolderFields,

    upload: function(rec, meta, onProgress){
      var blob = (global.DSMedia && global.DSMedia.originalOf(rec)) || rec.original || rec.blob;
      if(!blob) return Promise.reject(new Error('no original to upload'));
      var folder = folderOf(rec, meta);
      var name = nameOf(rec, meta);
      var path = folder + '/' + name;
      return ensureFolder(folder)
        .then(function(){ return tagFolder(rec, meta); })
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
DSSharePoint.TIMEOUT_MS = TIMEOUT_MS;
DSSharePoint.UPLOAD_TIMEOUT_MS = UPLOAD_TIMEOUT_MS;
DSSharePoint.SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MS;
DSSharePoint.MAX_STALLS = MAX_STALLS;

global.DSSharePoint = DSSharePoint;
if(typeof module !== 'undefined' && module.exports) module.exports = DSSharePoint;

})(typeof self !== 'undefined' ? self : this);
