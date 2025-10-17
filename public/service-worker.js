// Service Worker for eVuka Rewards

const CACHE_NAME = "evuka-rewards-v1";
const OFFLINE_URL = "/offline.html";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching files");
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache");
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes("/api/")) {
    // For API requests, try network first, then fall back to offline handling
    event.respondWith(networkFirstWithOfflineFallback(event));
  } else {
    // For static assets, try cache first, then network
    event.respondWith(cacheFirstWithNetworkFallback(event));
  }
});

// Cache-first strategy for static assets
async function cacheFirstWithNetworkFallback(event) {
  try {
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, try network
    const networkResponse = await fetch(event.request);

    // Cache the network response for future
    if (networkResponse.ok && event.request.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // If both cache and network fail, show offline page
    console.log("Service Worker: Fetch failed; returning offline page", error);
    return caches.match(OFFLINE_URL);
  }
}

// Network-first strategy for API requests
async function networkFirstWithOfflineFallback(event) {
  try {
    // Try network first
    const networkResponse = await fetch(event.request);

    // For successful GET requests, update the cache
    if (networkResponse.ok && event.request.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If both network and cache fail, return a custom offline response for API
    return new Response(JSON.stringify({ error: "You are offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle background sync for offline receipt submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-receipts") {
    event.waitUntil(syncReceipts());
  }
});

// Function to sync receipts when back online
async function syncReceipts() {
  try {
    const db = await openDB();
    const receiptsToSync = await db.getAll("offline-receipts");

    for (const receipt of receiptsToSync) {
      try {
        // Attempt to send the receipt to the server
        const response = await fetch("/api/receipts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(receipt),
        });

        if (response.ok) {
          // If successful, remove from IndexedDB
          await db.delete("offline-receipts", receipt.id);
        }
      } catch (error) {
        console.error("Failed to sync receipt:", error);
      }
    }
  } catch (error) {
    console.error("Error during receipt sync:", error);
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("evuka-offline-db", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline-receipts")) {
        db.createObjectStore("offline-receipts", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Push notification event handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      url: data.url || "/",
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Handle notification click - open the app to the specific page
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data.url;

      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
