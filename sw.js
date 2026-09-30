// Swim Times offline support (used by the shared GitHub Pages copy only).
// The app opens instantly and shows the last schedules it downloaded, even with no signal.
// data.json and the page itself: network first, saved copy if offline. Icons: saved copy first.
const CACHE = 'swimtimes-v1';
const SHELL = ['./', 'index.html', 'data.json', 'manifest.webmanifest', 'icon-192.png', 'icon.png',
               'icon-maskable.png', 'apple-touch-icon.png', 'favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // the map comes from elsewhere
  const fresh = req.mode === 'navigate' || url.pathname.endsWith('/data.json') ||
                url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (fresh){
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
