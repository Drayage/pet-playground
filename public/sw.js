const CACHE_VERSION = "pet-playground-v2";
const BASE_PATH = new URL("./", self.location.href).pathname;
const assetPath = (path) => `${BASE_PATH}${path.replace(/^\/+/, "")}`;
const BUILD_ASSETS = [];
const CARD_ART = Array.from({ length: 50 }, (_, index) => assetPath(`assets/card-art/${String(index).padStart(2, "0")}.jpg`));
const APP_SHELL = [
  BASE_PATH,
  assetPath("manifest.webmanifest"),
  assetPath("icons/icon-192.png"),
  assetPath("icons/icon-512.png"),
  assetPath("icons/icon-maskable-512.png"),
  assetPath("icons/apple-touch-icon.png"),
  ...BUILD_ASSETS.map(assetPath),
  ...CARD_ART,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(BASE_PATH, copy));
          return response;
        })
        .catch(() => caches.match(BASE_PATH)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached || network;
    }),
  );
});
