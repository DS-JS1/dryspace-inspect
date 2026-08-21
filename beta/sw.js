/* Dryspace Site Inspections — service worker (offline caching)
   Bump CACHE_VERSION whenever any app file changes, so devices pick up the update. */
var CACHE_VERSION = 'ds-inspect-v1.4.0-24';
var APP_FILES = [
  './',
  './index.html',
  './ds-media-sync.js',
  './ds-sharepoint.js',
  './ds-auth.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* v1.3 — deliberately NOT calling skipWaiting() here. A new build stays in the
   "waiting" state until the page asks for it, so the app can tell the user an
   update is ready rather than swapping code underneath them mid-inspection.
   Previously the new worker took control immediately while the open page was
   still running the old code. */
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_VERSION).then(function(c){ return c.addAll(APP_FILES); }));
});

/* The page sends this once the user taps "Update now". */
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_VERSION; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(resp){
        // opportunistically cache same-origin files and the Dryspace logo
        var url = e.request.url;
        if(resp.ok && (url.indexOf(self.location.origin) === 0 || url.indexOf('dryspace.com.au') !== -1)){
          var copy = resp.clone();
          caches.open(CACHE_VERSION).then(function(c){ c.put(e.request, copy); });
        }
        return resp;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
