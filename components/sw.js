
const CACHE_NAME = 'autogain-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/index.css',
  '/manifest.json',
  '/logo.png'
];

// Instalação: Cacheia apenas arquivos estáticos conhecidos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação: Limpa caches antigos e assume controle imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // REGRA DE OURO: Ignorar qualquer coisa que não seja GET (APIs de Trading usam POST)
  if (event.request.method !== 'GET') {
    return;
  }

  // REGRA DE SEGURANÇA: Ignorar qualquer requisição de API (proxies do Vite)
  const isApiRequest = 
    url.pathname.startsWith('/market_data') || 
    url.pathname.startsWith('/assets') || 
    url.pathname.startsWith('/balance') ||
    url.pathname.startsWith('/connect') ||
    url.pathname.startsWith('/switch_account') ||
    url.pathname.startsWith('/ping');

  if (isApiRequest) {
    return;
  }

  // Para assets estáticos (CSS, JS, Imagens), tenta o cache primeiro
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback silencioso para falhas de rede em assets não cacheados
        return new Response('Offline', { status: 408 });
      });
    })
  );
});
