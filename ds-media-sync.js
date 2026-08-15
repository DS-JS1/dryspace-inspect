/* Dryspace media sync — capture, naming, integrity and upload queueing.
   ---------------------------------------------------------------------------
   Deliberately standalone and free of any reference to the inspection form, so
   the job-update and silica-worksheet PWAs can use it unchanged. Nothing here
   touches the DOM or IndexedDB directly: the host app supplies storage and
   transport, this module supplies the logic.

   Phase A (this file): renditions, naming, hashing, state machine, queue.
   Phase B (pending an Entra app registration): the Graph transport that plugs
   into queue({transport}). The queue is written against an interface, not
   against Graph, so that work is additive rather than a rewrite. */
(function(global){
'use strict';

var DSMedia = {};

/* ═══════════════ naming ═══════════════
   SharePoint rejects a set of characters outright and silently mangles others.
   Getting this wrong surfaces as an upload that fails only for certain
   properties — the ones with a slash in the unit number, say — so it is worth
   being strict here rather than discovering it in a basement. */

var ILLEGAL = /["*:<>?\/\\|]/g;         /* rejected by SharePoint outright */
var CTRL = /[\x00-\x1f\x7f]/g;
/* Reserved device names, rejected as a whole segment on Windows-backed storage */
var RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

DSMedia.sanitiseSegment = function(s, maxLen){
  var out = String(s == null ? '' : s)
    .replace(CTRL, '')
    .replace(ILLEGAL, ' ')
    .replace(/[~$]/g, '')            /* a leading ~$ marks a temp file */
    .replace(/_vti_/gi, 'vti')       /* reserved by SharePoint anywhere in a name */
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')             /* cannot begin with a dot */
    .replace(/[.\s]+$/, '');         /* cannot end with a dot or space */
  if(RESERVED.test(out)) out = out + '_';
  if(maxLen && out.length > maxLen){
    out = out.slice(0, maxLen).replace(/[.\s]+$/, '');
  }
  return out;
};

/* Folder name is for humans browsing SharePoint, so it carries the address.
   The FULL path is capped well under SharePoint's ~400 character limit. */
DSMedia.folderName = function(job){
  job = job || {};
  var parts = [];
  var no    = DSMedia.sanitiseSegment(job.inspNo || '', 40);
  var who   = DSMedia.sanitiseSegment(job.client || '', 40);
  var where = DSMedia.sanitiseSegment(job.address || '', 80);
  if(no) parts.push(no);
  if(who) parts.push(who);      /* the client name makes a folder findable by
                                   the thing people actually remember */
  if(where) parts.push(where);
  return parts.join(' - ') || 'Unfiled';
};

/* A short, stable token identifying whose job this is, for filenames.
   PINNED on first use, like the folder: photos uploaded before the office has
   filled in the client name would otherwise be named differently from photos
   uploaded afterwards, for the same job.

   The client name is used rather than the address because it is a real field.
   A suburb would have to be parsed out of a free-text address, and
   "Unit 3/12 Marine Pde Kirra QLD 4225" has no reliable separator — guessing
   there produces filenames containing "QLD 4225". */
DSMedia.jobTag = function(job){
  if(job && job.mediaTag !== undefined && job.mediaTag !== null) return job.mediaTag;
  var t = DSMedia.sanitiseSegment(job && job.client || '', 24).replace(/\s+/g, '-');
  if(job) job.mediaTag = t;
  return t;
};

/* Filename carries the identifiers a person needs when the file has been
   separated from its folder — downloaded, emailed, or sitting in Teams. The
   folder still carries the full address; repeating that in every filename would
   push long paths towards SharePoint's limit for no extra clarity. */
DSMedia.fileName = function(job, mfid, seq, originalName, mime){
  job = job || {};
  var no = DSMedia.sanitiseSegment(job.inspNo || 'INS', 24) || 'INS';
  var tag = DSMedia.jobTag(job);
  var date = /^\d{4}-\d{2}-\d{2}$/.test(job.date || '') ? job.date : DSMedia.today();
  var field = DSMedia.sanitiseSegment(String(mfid || 'media').replace(/^m\./, '').replace(/\./g, '-'), 48);
  var n = String(seq == null ? 1 : seq);
  while(n.length < 3) n = '0' + n;
  var parts = [no];
  if(tag) parts.push(tag);            /* omitted entirely when not yet known */
  parts.push(date, field, n);
  return parts.join('_') + '.' + DSMedia.extFor(originalName, mime);
};

DSMedia.extFor = function(name, mime){
  var m = /\.([A-Za-z0-9]{1,5})$/.exec(String(name || ''));
  if(m) return m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  var t = String(mime || '').toLowerCase();
  if(t.indexOf('image/jpeg') === 0) return 'jpg';
  if(t.indexOf('image/png') === 0) return 'png';
  if(t.indexOf('image/heic') === 0) return 'heic';
  if(t.indexOf('video/quicktime') === 0) return 'mov';
  if(t.indexOf('video/mp4') === 0) return 'mp4';
  if(t.indexOf('application/pdf') === 0) return 'pdf';
  var slash = t.indexOf('/');
  return slash > -1 ? (t.slice(slash + 1).split(';')[0] || 'bin') : 'bin';
};

DSMedia.today = function(now){
  var d = now ? new Date(now) : new Date();
  var p = function(n){ return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

/* The folder is PINNED to the record the first time anything uploads. An
   inspector correcting a typo in the address afterwards would otherwise split
   one job's photos across two SharePoint folders, with nothing to indicate it
   had happened. Readability at creation, stability forever after. */
DSMedia.resolveFolder = function(job){
  if(job && job.mediaFolder) return job.mediaFolder;
  var f = DSMedia.folderName(job);
  if(job) job.mediaFolder = f;
  return f;
};

/* ═══════════════ integrity ═══════════════ */

/* Above this, hashing would pull the whole file into memory at once. Web Crypto
   has no streaming digest, so large video is recorded by size alone rather than
   risking an out-of-memory failure on an iPad mid-inspection. */
DSMedia.HASH_LIMIT = 64 * 1024 * 1024;

DSMedia.sha256Hex = function(blob){
  if(!blob) return Promise.resolve(null);
  if(blob.size > DSMedia.HASH_LIMIT) return Promise.resolve(null);
  if(!(global.crypto && global.crypto.subtle)) return Promise.resolve(null);
  return blob.arrayBuffer().then(function(buf){
    return global.crypto.subtle.digest('SHA-256', buf);
  }).then(function(d){
    var b = new Uint8Array(d), s = '';
    for(var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }).catch(function(){ return null; });
};

/* ═══════════════ renditions ═══════════════
   Three copies per photo, each with a distinct job:
     thumb    240px  — previews in the form
     report  1600px  — embedded in the emailed report, keeps it deliverable
     original       — untouched, the evidence copy that goes to SharePoint
   Non-images (video, PDF) have no derivatives: the file itself is the original,
   and duplicating it would double storage for nothing. */

DSMedia.isImage = function(type){ return String(type || '').indexOf('image/') === 0; };

DSMedia.makeRenditions = function(file, compress){
  var isImg = DSMedia.isImage(file.type);
  if(!isImg){
    return DSMedia.sha256Hex(file).then(function(h){
      return {original: file, report: file, thumb: null, type: file.type,
              reportSize: file.size, origSize: file.size, origHash: h, derived: false};
    });
  }
  return compress(file, 1600, 0.72).then(function(report){
    return compress(file, 240, 0.6).then(function(thumbBlob){
      return DSMedia.blobToDataURL(thumbBlob).then(function(thumb){
        return DSMedia.sha256Hex(file).then(function(h){
          return {original: file, report: report, thumb: thumb, type: 'image/jpeg',
                  reportSize: report.size, origSize: file.size, origHash: h, derived: true};
        });
      });
    });
  }).catch(function(){
    /* Compression failed — HEIC on a browser that cannot decode it, most likely.
       Keep the file rather than losing it; it simply travels undersized. */
    return DSMedia.sha256Hex(file).then(function(h){
      return {original: file, report: file, thumb: null, type: file.type,
              reportSize: file.size, origSize: file.size, origHash: h, derived: false};
    });
  });
};

DSMedia.blobToDataURL = function(b){
  return new Promise(function(res, rej){
    var r = new FileReader();
    r.onload = function(){ res(r.result); };
    r.onerror = rej;
    r.readAsDataURL(b);
  });
};

/* The untouched copy, wherever it lives. Non-image records never carried a
   separate original, so the stored blob IS the original for those. */
DSMedia.originalOf = function(rec){ return (rec && (rec.original || rec.blob)) || null; };

/* ═══════════════ upload state ═══════════════ */

DSMedia.STATES = ['local', 'queued', 'uploading', 'uploaded', 'failed', 'purged'];

var ALLOWED = {
  local:     ['queued'],
  queued:    ['uploading', 'local'],
  uploading: ['uploaded', 'failed'],
  failed:    ['queued', 'local'],
  uploaded:  ['purged'],
  purged:    []              /* terminal: the device copy is gone */
};

DSMedia.stateOf = function(rec){ return (rec && rec.up) || 'local'; };

DSMedia.canTransition = function(from, to){
  return !!(ALLOWED[from] && ALLOWED[from].indexOf(to) > -1);
};

DSMedia.setState = function(rec, to, extra){
  var from = DSMedia.stateOf(rec);
  if(from === to) return rec;
  if(!DSMedia.canTransition(from, to)){
    throw new Error('illegal media state change: ' + from + ' -> ' + to);
  }
  rec.up = to;
  rec.upAt = (extra && extra.at) || Date.now();
  if(to === 'failed') rec.upErr = (extra && extra.error) || 'unknown';
  if(to === 'uploaded' || to === 'queued') rec.upErr = null;
  return rec;
};

/* What a "Try again" control calls: clears the attempt count and the permanent
   flag so a held-back record re-enters the queue. Deliberately explicit — an
   upload that failed for a reason the queue cannot fix should not quietly
   resume on its own. */
DSMedia.requeue = function(rec){
  if(DSMedia.stateOf(rec) === 'failed') DSMedia.setState(rec, 'queued');
  rec.upTries = 0;
  rec.upRetryable = true;
  rec.upErr = null;
  return rec;
};

/* Only a verified remote copy makes a local original safe to remove. Size must
   match exactly, and the check must come from a fresh read of the item rather
   than the upload response, which can report success on a truncated write. */
DSMedia.isPurgeable = function(rec, graceMs){
  if(DSMedia.stateOf(rec) !== 'uploaded') return false;
  var r = rec.remote;
  if(!r || !r.itemId || !r.verifiedAt) return false;
  if(r.size !== rec.origSize) return false;
  if(graceMs && (Date.now() - r.verifiedAt) < graceMs) return false;
  return true;
};

/* ═══════════════ upload queue ═══════════════
   Serial by design. Several large photos uploading at once over a weak mobile
   connection is slower overall than one at a time and far more likely to fail,
   and a partially-uploaded set is harder to reason about than a shorter
   completed one. */

DSMedia.MAX_TRIES = 4;

DSMedia.backoffMs = function(tries){
  var base = Math.min(30000, 1000 * Math.pow(2, Math.max(0, tries - 1)));
  return base;
};

/* Distinguishes "try again later" from "this will never work". Retrying a 400
   forever burns battery and hides the real problem. */
DSMedia.isRetryable = function(err){
  if(!err) return false;
  if(err.offline) return true;
  var s = err.status;
  if(s === undefined || s === null) return true;   /* network failure */
  if(s === 408 || s === 429) return true;
  if(s >= 500) return true;
  return false;
};

DSMedia.createQueue = function(opts){
  opts = opts || {};
  var transport = opts.transport;
  var list = opts.list;                 /* () -> Promise<[rec]> */
  var save = opts.save;                 /* (rec) -> Promise */
  var meta = opts.meta || function(){ return {}; };
  var onChange = opts.onChange || function(){};
  var isOnline = opts.isOnline || function(){ return global.navigator ? global.navigator.onLine !== false : true; };
  var wait = opts.wait || function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

  var running = false, stopped = false, last = null;

  /* A permanently failed record (400, 403 — a bad name, a revoked token) is held
     back rather than retried. Nothing about trying again changes the outcome, and
     retrying it forever hides the real problem behind a spinner. It waits for
     DSMedia.requeue(), which is what a "Try again" control calls. */
  function pending(recs){
    return recs.filter(function(r){
      var s = DSMedia.stateOf(r);
      if(s === 'queued') return true;
      if(s === 'failed') return r.upRetryable !== false;
      return false;
    });
  }

  function attempt(rec){
    /* A previously failed record must be re-queued before it can go back in
       flight — 'failed' -> 'uploading' is not a legal move, and jumping it threw
       out of the loop, stranding the file after a single transient error. */
    if(DSMedia.stateOf(rec) === 'failed') DSMedia.setState(rec, 'queued');
    rec.upTries = (rec.upTries || 0) + 1;
    DSMedia.setState(rec, 'uploading');
    onChange(rec);
    return save(rec)
      .then(function(){ return transport.upload(rec, meta(rec)); })
      .then(function(remote){
        /* Never trust the upload response alone — read the item back. */
        return transport.verify(remote).then(function(fresh){
          var size = fresh && fresh.size;
          if(size !== rec.origSize){
            var e = new Error('size mismatch after upload: stored ' + size + ', expected ' + rec.origSize);
            e.status = 0;
            throw e;
          }
          rec.remote = {
            driveId: remote.driveId || null,
            itemId: remote.itemId,
            webUrl: remote.webUrl || null,
            path: remote.path || null,
            size: size,
            verifiedAt: Date.now()
          };
          DSMedia.setState(rec, 'uploaded');
          rec.upErr = null;
          return save(rec).then(function(){ onChange(rec); return rec; });
        });
      })
      .catch(function(err){
        DSMedia.setState(rec, 'failed', {error: (err && err.message) || String(err)});
        rec.upRetryable = DSMedia.isRetryable(err);
        return save(rec).then(function(){ onChange(rec, err); throw err; });
      });
  }

  function drain(){
    if(running) return last;
    running = true; stopped = false;
    last = (function loop(){
      if(stopped) return Promise.resolve('stopped');
      if(!isOnline()) return Promise.resolve('offline');
      return list().then(function(recs){
        var todo = pending(recs).filter(function(r){
          return (r.upTries || 0) < DSMedia.MAX_TRIES;
        });
        if(!todo.length) return 'done';
        var rec = todo[0];
        return attempt(rec).then(loop, function(){
          if(!rec.upRetryable) return loop();          /* permanent — move on */
          return wait(DSMedia.backoffMs(rec.upTries)).then(loop);
        });
      });
    })().catch(function(e){
      return 'error: ' + ((e && e.message) || e);
    }).then(function(r){ running = false; return r; });
    return last;
  }

  return {
    drain: drain,
    stop: function(){ stopped = true; },
    isRunning: function(){ return running; },
    pending: function(){ return list().then(function(rs){ return pending(rs).length; }); }
  };
};

/* ═══════════════ storage pressure ═══════════════
   Originals are large and accumulate until they are uploaded and reclaimed.
   Capture is NEVER blocked: an inspector standing in front of the evidence must
   always be able to photograph it. Running out of space is recoverable; an
   un-photographed defect is not. */

DSMedia.LEVELS = {notice: 0.70, warn: 0.85, urgent: 0.95};

DSMedia.pressure = function(usage, quota){
  if(!quota) return {level: 'unknown', ratio: 0};
  var ratio = usage / quota;
  var level = 'ok';
  if(ratio >= DSMedia.LEVELS.urgent) level = 'urgent';
  else if(ratio >= DSMedia.LEVELS.warn) level = 'warn';
  else if(ratio >= DSMedia.LEVELS.notice) level = 'notice';
  return {level: level, ratio: ratio};
};

DSMedia.pressureMessage = function(p, reclaimableBytes, fmt){
  fmt = fmt || function(n){ return Math.round(n / 1048576) + ' MB'; };
  var free = reclaimableBytes ? ' ' + fmt(reclaimableBytes) + ' can be freed by uploading and reclaiming.' : '';
  switch(p.level){
    case 'urgent': return 'Device storage is almost full.' + free + ' Photos will still save, but upload soon.';
    case 'warn':   return 'Device storage is filling up.' + free;
    case 'notice': return reclaimableBytes ? 'Uploaded photos are using space.' + free : '';
    default:       return '';
  }
};

global.DSMedia = DSMedia;
if(typeof module !== 'undefined' && module.exports) module.exports = DSMedia;

})(typeof self !== 'undefined' ? self : this);
