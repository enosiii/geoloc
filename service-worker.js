const CACHE_NAME = "geoloc-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "/assets/markers/01.png",
  "/assets/markers/02.png",
  "/assets/markers/03.png",
  "/assets/markers/04.png",
  "/assets/markers/05.png",
  "/assets/markers/06.png",
  "/assets/markers/07.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
  // Add paths to your avatar images and other assets here
];



// Install event - Caching essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE);
    })))
  );
});

// Fetch event - Serving cached resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
