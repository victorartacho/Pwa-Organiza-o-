/* FOCO service worker — offline-first, auto-update.
   Bump CACHE quando trocar HTML/ícones para forçar atualização. */
const CACHE = 'foco-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Instala: pré-cacheia o app shell e ativa imediatamente
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
});

// Ativa: limpa caches antigos e assume controle das abas abertas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Busca: cache-first com fallback de rede; navegação offline cai no index
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // cacheia em runtime o que for do mesmo domínio e válido
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() =>
        // sem rede: se for navegação, serve o app
        req.mode === 'navigate' ? caches.match('./index.html') : undefined
      );
    })
  );
});
