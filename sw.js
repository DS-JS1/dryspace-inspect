/* Dryspace Site Inspections — service worker (offline caching)
   Bump CACHE_VERSION whenever any app file changes, so devices pick up the update. */
var CACHE_VERSION = 'ds-inspect-v1.2.1';
var APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(c){ return c.addAll(APP_FILES); })
      .then(function(){ return self.skipWaiting(); })
  );
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
