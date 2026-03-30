/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare let self: ServiceWorkerGlobalScope;

// Cache name is tied to the build version – old caches are cleaned up on activate.
const CACHE = `app-${version}`;

// Assets safe to cache permanently: Vite-hashed build output + static files,
// but never version.json (must stay network-fresh).
const PRECACHE_ASSETS = [
	...build,
	...files.filter(
		(f) => !f.endsWith('/version.json')
	)
];
const PRECACHE_ASSET_SET = new Set(PRECACHE_ASSETS);

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
			// Do NOT skipWaiting here – the client controls activation via the update banner.
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then(async (keys) => {
				for (const key of keys) {
					if (key !== CACHE) {
						await caches.delete(key);
					}
				}
			})
			.then(() => self.clients.claim())
	);
});

self.addEventListener('message', (event) => {
	// Client sends this message after the user confirms the update.
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	const url = new URL(req.url);

	// Only handle GET requests from our own origin.
	if (req.method !== 'GET' || url.origin !== self.location.origin) return;

	// version.json: always network-fresh, never serve from cache.
	if (url.pathname === '/version.json') return;

	// Navigation requests (HTML): network-first so new deployments are always seen.
	if (req.mode === 'navigate') {
		event.respondWith(
			fetch(req).catch(() =>
				// Offline fallback: try the cached shell or a minimal response.
				caches
					.match(req)
					.then((cached) => cached ?? caches.match('/'))
					.then((r) => r ?? new Response('Offline', { status: 503 }))
			)
		);
		return;
	}

	// Hashed build assets: cache-first (they never change for a given hash).
	if (PRECACHE_ASSET_SET.has(url.pathname)) {
		event.respondWith(
			caches
				.match(req)
				.then((cached) => cached ?? fetch(req))
				.then((response) => {
					// Only cache successful network responses.
					// Chrome extensions generate internal URLs that cannot be cached.
					if (response.ok && !response.url.startsWith('chrome-extension://')) {
						caches.open(CACHE).then((c) => c.put(req, response.clone()));
					}
					return response;
				})
		);
		return;
	}

	// Everything else: network with stale-while-revalidate.
	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			const cached = await cache.match(req);
			const networkFetch = fetch(req).then((response) => {
				// Only cache successful responses to avoid persisting errors.
				if (response.ok) cache.put(req, response.clone());
				return response;
			});
			return cached ?? networkFetch;
		})
	);
});
