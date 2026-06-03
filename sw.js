const CACHE_NAME = 'confeitaria-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Força a atualização imediata
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Tenta adicionar os assets ao cache de forma resiliente
            return Promise.allSettled(
                ASSETS.map(asset => cache.add(asset).catch(err => console.warn('Cache ignorado para:', asset)))
            );
        })
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// Interceptação de requisições (Fetch)
self.addEventListener('fetch', (e) => {
    // 1. IGNORAR protocolos não suportados (blob: do VS Code Live Preview, chrome-extension:, etc)
    if (!e.request.url.startsWith('http')) {
        return;
    }

    // 2. IGNORAR requisições do Firebase (para não travar a base de dados) e do VS Code Live Reload
    if (e.request.url.includes('firestore.googleapis.com') || 
        e.request.url.includes('vscode-livepreview')) {
        return;
    }

    // 3. ESTRATÉGIA OFFLINE: Retorna do cache se existir, senão busca da internet
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request).catch((err) => {
                console.warn('Tentativa de acesso offline falhou:', e.request.url);
            });
        })
    );
});