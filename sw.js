const CACHE_PREFIX = "rise-rep-";
const STATIC_CACHE = `${CACHE_PREFIX}static-v5`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v5`;
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./exercise-visuals.js",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/routine-poster.png",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/fonts/barlow-condensed-600.woff2",
  "./assets/fonts/barlow-condensed-700.woff2",
  "./assets/fonts/barlow-condensed-800.woff2",
  "./assets/fonts/barlow-condensed-900.woff2",
  "./assets/fonts/dm-sans-400-700.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        return (await caches.match(event.request)) || caches.match("./index.html");
      }
    })());
    return;
  }

  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    const network = fetch(event.request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
