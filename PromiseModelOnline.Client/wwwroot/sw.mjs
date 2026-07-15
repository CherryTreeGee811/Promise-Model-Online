/** @type {string} */
const CACHE = 'pmo-v6';

const swSelf = /** @type {{ addEventListener: Function, skipWaiting: Function, clients: { claim: Function }, location: { origin: string } }} */ (/** @type {unknown} */ (self));

/** @type {boolean} */
let _cacheReady = false;

/** @type {string[]} */
const PRECACHE = [
  '/dist/js/main.js',
  '/css/site.css',
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
  '/templates/home.html',
  '/templates/navigation/anonymous.html',
  '/templates/navigation/authenticated.html'
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

swSelf.addEventListener('install', /** @param {{ waitUntil: (p: Promise<unknown>) => void }} event */ event => {
  // Activation must never be blocked — resolve immediately
  event.waitUntil(Promise.resolve());
  swSelf.skipWaiting();

  // Best-effort background precache — failures are logged but never block activation
  caches.open(CACHE).then(async cache => {
    await Promise.allSettled(
      PRECACHE.map(url =>
        fetch(url)
          .then(response => {
            if (response.ok) return cache.put(url, response);
          })
          .catch(() => {
            // Precache entry unavailable — skip
          })
      )
    );
  }).catch(error_ => {
    console.error('SW background precache failed:', error_);
  });
});

swSelf.addEventListener('activate', /** @param {{ waitUntil: (p: Promise<unknown>) => void }} event */ event => {
  // Activation must never be blocked — cache cleanup is best-effort
  event.waitUntil(Promise.resolve());
  swSelf.clients.claim();
  _cacheReady = true;

  // Best-effort background cache cleanup — failures never block activation
  caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).catch(() => {
    // Cache cleanup unavailable — skip
  });
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
  return /\.(css|mjs|js|png|jpg|jpeg|gif|ico|svg)$/.test(path);
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
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    try {
      const cached = await caches.match(request);
      if (cached) return cached;
    } catch {}
    try {
      const offline = await caches.match('/templates/error.html');
      if (offline) return offline;
    } catch {}
    return new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Cache-first fetch strategy: serve from cache if available, otherwise fetch and cache.
 * Returns null on complete failure so callers can decide the fallback.
 * @param {Request} request - The fetch request.
 * @returns {Promise<Response|null>} The response from cache or network, or null.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

swSelf.addEventListener('fetch', /** @param {{ request: Request, respondWith: (r: Response | Promise<Response>) => void, waitUntil: (p: Promise<unknown>) => void }} event */ event => {
  if (!_cacheReady) return;

  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== swSelf.location.origin) {
    return;
  }

  const path = url.pathname;

  if (isBffPath(path)) {
    return;
  }

  if (isStaticAsset(path)) {
    const responsePromise = cacheFirst(request)
      .then(r => r || new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }))
      .catch(() => new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }));
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise);
    return;
  }

  if (isTemplate(path)) {
    const responsePromise = networkFirst(request)
      .then(r => r || caches.match('/templates/error.html'))
      .then(r => r || new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }))
      .catch(() => new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }));
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise);
    return;
  }

  if (path === '/' || path === '/index.html' || path === '/manifest.json') {
    const responsePromise = networkFirst(request)
      .then(r => r || caches.match('/templates/error.html'))
      .then(r => r || new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }))
      .catch(() => new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }));
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise);
    return;
  }

  if (request.mode === 'navigate') {
    const responsePromise = networkFirst(request)
      .then(r => r || caches.match('/templates/error.html'))
      .then(r => r || new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }))
      .catch(() => new Response('', { status: 200, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }));
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise);
  }
});
