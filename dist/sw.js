'use strict';

const CACHE = 'tarif-market-v61';
const SHELL = [
  './', './index.html', './app.css', './app.js', './catalog.js',
  './oyun-modlari.html', './oyun-modlari.css', './oyun-modlari.js',
  './oyun.html', './oyun.css', './oyun.js',
  './super-market.html', './super-market.css?v=58', './super-market.js?v=58', './market-peyzaj.js',
  './teslimat.html', './teslimat.css', './teslimat.js?v=60', './bmw-araclari.js?v=60',
  './kurye-araclari.js', './yol-sahnesi.js', './three.min.js', './gltf-loader.js', './surus-textures.js',
  './assets/surus/motor-kokpit.png', './assets/surus/araba-kokpit.png',
  './assets/surus/korna-eli.png', './assets/surus/araba-eller-eldivensiz.png',
  './assets/surus/araba-korna-eli.png', './assets/surus/motor-eller.png',
  './assets/kelek.jpg', './assets/salep.jpg', './assets/erikli-su.jpg',
  './assets/app-icon-192.png', './assets/app-icon-512.png', './manifest.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('tarif-market-') && key !== CACHE).map(key => caches.delete(key)),
  )));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const delivery = fetch(request);
  event.waitUntil(delivery.then(response => {
    if (!response.ok) return;
    const copy = response.clone();
    return caches.open(CACHE).then(cache => cache.put(request, copy));
  }).catch(() => {}));

  event.respondWith(delivery.catch(async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await cache.match('./oyun-modlari.html')) || Response.error();
    return Response.error();
  }));
});
