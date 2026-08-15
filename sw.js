const CACHE_PREFIX = "rise-rep-";
const STATIC_CACHE = `${CACHE_PREFIX}static-v6`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v6`;
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

  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

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

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || "Rise & Rep";
  const options = {
    body: payload.body || "Your morning quest is ready.",
    icon: payload.icon || "/assets/icon-192.png",
    badge: payload.badge || "/assets/icon-180.png",
    tag: payload.tag || "rise-and-rep-morning",
    renotify: true,
    data: { url: payload.url || "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        if ("navigate" in client) await client.navigate(destination);
        return client.focus();
      }
    }
    return clients.openWindow ? clients.openWindow(destination) : undefined;
  })());
});
