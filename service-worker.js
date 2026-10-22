
const CACHE_NAME = "hustle-city-shell-v1";
const HOME_URL = new URL("/", self.location.origin).href;

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(HOME_URL, {
          cache: "reload"
        });

        if (response.ok) {
          await cache.put(HOME_URL, response);
        }
      } catch (error) {
        // The first visit still works online.
        // Offline fallback becomes available after a successful cache.
      }
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("hustle-city-shell-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept game assets, APIs, or cross-origin requests.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.mode !== "navigate" ||
    url.pathname !== "/"
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(HOME_URL, response.clone());
        }

        return response;
      } catch (error) {
        const cached = await caches.match(HOME_URL);

        if (cached) return cached;

        return new Response(
          "Hustle City is offline. Reconnect to the internet and try again.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
