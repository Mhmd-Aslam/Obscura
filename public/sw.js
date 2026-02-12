const CACHE_NAME = 'obscura-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/logo.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We use a more lenient approach: if some assets fail (like in dev), 
            // the SW still installs.
            return Promise.allSettled(
                ASSETS.map(asset => cache.add(asset))
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Network first, falling back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If we get a valid response, clone it and put it in the cache
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try the cache
                return caches.match(event.request);
            })
    );
});
