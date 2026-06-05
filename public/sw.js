// Kill-switch service worker.
// O SW antigo cacheava "/" em cima de respostas de deep-links e quebrava a
// navegação em browsers in-app (WhatsApp, Instagram, Messenger) no mobile.
// Este SW só limpa caches e se remove. Não força reload/navigate, porque isso
// causava loop de recarregamento no mobile e impedia os links de responderem.
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  await self.clients.claim();
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
  await self.registration.unregister();
})()));

// Não interceptar nenhum fetch — deixar o navegador agir normalmente.
self.addEventListener('fetch', () => {});
