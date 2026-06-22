/* ============================================================================
   ODYSSEY — SERVICE WORKER  ·  offline-first app shell, network-aware
   ----------------------------------------------------------------------------
   Strategy
     • Navigations (HTML)      → network-first, fall back to cached index.html
     • Same-origin static      → cache-first, then network (and cache the result)
     • Cross-origin (CDN/auth) → BYPASS the SW entirely (esm.sh, *.supabase.co,
                                 fonts, GSAP/Lenis/confetti, magic-link callbacks)
   Bump CACHE on every shippable change so old shells are evicted on activate.
   ========================================================================== */

const CACHE = 'odyssey-v9';   // bumped: removed Lenis smooth-scroll (native scroll — fixes scroll stall/jank)

/* Real app shell — every file the zero-build site needs to boot offline.
   Paths are relative to the SW scope (the site root), matching index.html and
   the ES-module import graph (app.js → engine/motion/cloud, cloud → config). */
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/engine.js',
  './js/motion.js',
  './js/cloud.js',
  './js/gate.js',
  './js/config.js',
  './js/vendor/supabase.umd.js',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

/* ---- Install: precache the shell, then take over ASAP ------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll is atomic — if one asset 404s the whole install fails, so we add
      // individually and tolerate misses (e.g. icons not yet rasterized).
      .then((cache) => Promise.all(
        SHELL.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[odyssey:sw] skip precache', url, err && err.message);
          })
        )
      ))
      .then(() => self.skipWaiting())
  );
});

/* ---- Activate: drop old caches, claim open clients --------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---- Helpers ----------------------------------------------------------- */
const isSameOrigin = (url) => url.origin === self.location.origin;

/* Never let the SW touch these — even though cross-origin requests already
   fail the same-origin check, we guard explicitly so the intent is obvious
   and survives future refactors. Supabase auth + magic-link callbacks and the
   esm.sh / supabase-js bundle MUST always hit the live network. */
function isBypass(url, request) {
  if (request.method !== 'GET') return true;                 // never cache POST/PUT/etc (Supabase writes)
  if (!isSameOrigin(url)) return true;                       // esm.sh, *.supabase.co, fonts, CDN libs
  if (url.search.includes('access_token') ||                 // OAuth/magic-link hash sometimes surfaced as query
      url.search.includes('refresh_token') ||
      url.search.includes('code=') ||
      url.pathname.includes('/auth/')) return true;           // any auth callback path
  return false;
}

/* ---- Fetch ------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin / auth / non-GET → do nothing, let the browser handle it.
  if (isBypass(url, request)) return;

  // Navigations → network-first, cache fallback (so a fresh deploy wins,
  // but the app still opens offline / on flaky mobile data).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // config.js holds the user's Supabase keys → network-first so edited keys
  // propagate immediately, but fall back to cache so the app still boots offline.
  if (url.pathname.endsWith('/js/config.js')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin static assets → cache-first, then network (and backfill cache).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        // Only cache clean, basic (same-origin) 200s.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});

/* Allow the page to trigger an immediate update (postMessage 'SKIP_WAITING'). */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
