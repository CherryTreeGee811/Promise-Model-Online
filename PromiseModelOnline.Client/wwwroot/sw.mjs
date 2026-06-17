/** @type {string} */
const CACHE = 'pmo-v3';

/** @type {string[]} */
const PRECACHE = [
  '/dist/js/main.js',
  '/lib/css/bootstrap.min.css',
  '/lib/css/bootstrap-icons.min.css',
  '/lib/js/bootstrap.bundle.min.js',
  '/lib/js/signalr.min.js',
  '/lib/js/d3.min.js',
  '/lib/js/popper.min.js',
  '/lib/js/tippy-bundle.umd.min.js',
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

/** @type {string[]} */
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

self.addEventListener('install', /** @param {ExtendableEvent} event */ event => {
  event.waitUntil(caches.open(CACHE));
  self.skipWaiting();
});

self.addEventListener('activate', /** @param {ExtendableEvent} event */ event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/**
 * Check if a URL path belongs to the BFF (backend-for-frontend) and should bypass the cache.
 * @param {string} path - The URL pathname to check.
 * @returns {boolean} True if the path is a BFF endpoint.
 */
function isBffPath(path) {
  return BFF_PATHS.some(p => path === p || path.startsWith(p));
}

/**
 * Check if a URL path is a static asset that should be served from cache first.
 * @param {string} path - The URL pathname to check.
 * @returns {boolean} True if the path matches a static asset extension.
 */
function isStaticAsset(path) {
  return /\.(css|mjs|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/.test(path);
}

/**
 * Check if a URL path is an HTML template.
 * @param {string} path - The URL pathname to check.
 * @returns {boolean} True if the path starts with /templates/.
 */
function isTemplate(path) {
  return path.startsWith('/templates/');
}

/**
 * Network-first fetch strategy: try the network, fall back to cache.
 * @param {Request} request - The fetch request.
 * @returns {Promise<Response>} The response from network or cache.
 */
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
    return cached;
  }
}

/**
 * Cache-first fetch strategy: serve from cache if available, otherwise fetch and cache.
 * @param {Request} request - The fetch request.
 * @returns {Promise<Response>} The response from cache or network.
 */
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
    return;
  }
}

self.addEventListener('fetch', /** @param {FetchEvent} event */ event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const path = url.pathname;

  if (isBffPath(path)) {
    return;
  }

  if (isTemplate(path)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (path === '/' || path === '/index.html' || path === '/manifest.json') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(path) || request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match('/'))
    );
  }
});
