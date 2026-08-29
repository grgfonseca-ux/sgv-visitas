/**
 * SGV Biodiversité — Service Worker
 *
 * É ele que faz o app ABRIR sem internet. Sem Service Worker, o visitador
 * sem sinal veria a tela de erro do navegador e não chegaria nem ao formulário.
 *
 * Ao publicar uma versão nova do index.html, troque VERSAO — senão o
 * aparelho continua servindo a versão antiga do cache.
 */
const VERSAO = 'sgv-v4';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icone-192.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* Chamadas ao Apps Script NUNCA passam pelo cache: uma resposta de
     sincronização guardada faria o app achar que enviou o que não enviou. */
  if (url.indexOf('script.google.com') >= 0 || e.request.method !== 'GET') return;

  /* O resto é cache-first: o app abre instantaneamente e funciona offline.
     A rede só é consultada quando o arquivo não está no cache. */
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).then(r => {
      if (r && r.status === 200 && r.type === 'basic') {
        const copia = r.clone();
        caches.open(VERSAO).then(c => c.put(e.request, copia));
      }
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
