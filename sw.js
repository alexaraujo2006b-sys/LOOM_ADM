const CACHE_NAME = 'teares-app-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icon.svg',
  // Adicionando os assets de CDN para suporte offline
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  // Adicionando assets do AISTUDIO CDN
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/react@^19.2.0/jsx-runtime',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  'https://aistudiocdn.com/idb-keyval@^6.2.2'
];

self.addEventListener('install', event => {
  // Realiza a pré-instalação de assets essenciais.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Armazenando assets essenciais em cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Service Worker: Falha ao armazenar assets essenciais durante a instalação', error);
      })
  );
});

self.addEventListener('activate', event => {
  // Limpa caches antigos.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);
    
    // Estratégia Cache-First: se o recurso estiver no cache, retorna ele.
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      // Se não estiver no cache, busca na rede.
      const networkResponse = await fetch(event.request);
      
      // Verifica se a resposta da rede é válida para cache.
      if (networkResponse && networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        await cache.put(event.request, responseToCache);
      }
      
      return networkResponse;
    } catch (error) {
      // A requisição de rede falhou (provavelmente offline).
      console.error('Service Worker: Falha na busca; usuário está offline', event.request.url, error);
      // Retorna uma resposta de erro genérica.
      return new Response('Erro de conexão de rede.', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  })());
});
