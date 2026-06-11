const CACHE = 'marathon-v25';
const DATA_CACHE_KEY = new Request('./data.json', { cache: 'reload' });

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (!e.data || !e.data.type) return;
  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data.type === 'CLEAR_CACHES') {
    e.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
  }
});

function isDataJson(url) {
  return url.pathname.endsWith('data.json');
}

function isShellAsset(url) {
  const p = url.pathname;
  return p.endsWith('/index.html') || p.endsWith('/sw.js') ||
         p.endsWith('/manifest.json') || p.endsWith('/');
}

async function networkFirstData(request) {
  const force = request.headers.get('X-Force-Refresh') === '1';
  const cache = await caches.open(CACHE);
  if (force) await cache.delete(DATA_CACHE_KEY);

  try {
    const res = await fetch(new Request(request.url, {
      method: 'GET',
      headers: request.headers,
      cache: force ? 'reload' : 'no-store'
    }));
    if (res && res.ok) {
      await cache.put(DATA_CACHE_KEY, res.clone());
    }
    return res;
  } catch (err) {
    if (force) throw err;
    const cached = await cache.match(DATA_CACHE_KEY);
    if (cached) return cached;
    throw err;
  }
}

async function networkFirstShell(request) {
  const force = request.headers.get('X-Force-Refresh') === '1';
  try {
    const res = await fetch(new Request(request.url, {
      method: 'GET',
      headers: request.headers,
      cache: force ? 'reload' : 'no-store'
    }));
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isShellAsset(new URL(request.url))) {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (isDataJson(url)) {
    e.respondWith(networkFirstData(e.request));
    return;
  }
  if (isShellAsset(url) || url.pathname.endsWith('/sw.js')) {
    e.respondWith(networkFirstShell(e.request));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
