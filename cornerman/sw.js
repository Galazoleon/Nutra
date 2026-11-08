/* CornerMan service worker: caches the app shell so it opens offline.
   Bump VERSION whenever any shell file changes so phones pick up the update. */
const VERSION='cornerman-v1';
const FONTS='cornerman-fonts';
const SHELL=['./','index.html','styles.css','manifest.webmanifest',
  'js/data/sports.js','js/data/exercises.js','js/data/chains.js','js/engine.js','js/coach.js','js/store.js','js/app.js',
  'icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    })));
    return;
  }
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    /* Network first for the page so updates show up, cache when offline. */
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return r;})
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return;
  }
  /* Stale while revalidate for scripts, styles and icons. */
  e.respondWith(caches.open(VERSION).then(c=>c.match(req).then(hit=>{
    const net=fetch(req).then(r=>{if(r&&r.ok)c.put(req,r.clone());return r;}).catch(()=>hit);
    return hit||net;
  })));
});
