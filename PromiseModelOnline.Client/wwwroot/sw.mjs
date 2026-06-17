const CACHE = 'pmo-v3';

const PRECACHE = [
  '/dist/js/main.js',
  '/lib/css/bootstrap.min.css',
  '/lib/css/bootstrap-icons.min.css',
  '/lib/js/bootstrap.bundle.min.js',
  '/lib/js/signalr.min.js',
  '/lib/js/d3.min.js',
  '/lib/js/tippy.umd.min.js',
  '/images/icon.svg',
  '/images/PromiseModelOnline_Logo_192x192.png',
  '/images/PromiseModelOnline_Logo_512x512.png',
  '/images/PromiseModelOnline_Logo_180x180.png',
  '/images/PromiseModelOnline_Logo_64x64.png',
  '/images/favicon.ico',
  '/manifest.json',
  '/templates/404.html',
  '/templates/error.html',
  '/templates/home.html'
];

const BFF_PATHS = [
  '/api/',
  '/hubs/',
  '/login',
  '/logout',
  '/signin-oidc',
  '/signout-callback-oidc',
  '/connect/',
  '/.well-known/',
  '/account/',
  '/signin-google'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(PRECACHE).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isBffPath(path) {
  return BFF_PATHS.some(p => path === p || path.startsWith(p));
}

function isStaticAsset(path) {
  return /\.(css|mjs|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/.test(path);
}

function isTemplate(path) {
  return path.startsWith('/templates/');
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(null, { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response(null, { status: 503 });
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const path = url.pathname;

  if (isBffPath(path)) {
    return;
  }

  if (path === '/manifest.json') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isStaticAsset(path)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isTemplate(path)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (path === '/' || path === '/index.html') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('/'))
    );
  }
});
