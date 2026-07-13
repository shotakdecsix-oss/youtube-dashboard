// YouTube発見 — 最小限のサービスワーカー（オフライン時にアプリの外枠だけ表示できるようにする）
const CACHE_NAME = 'yt-hakken-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// アプリ本体(HTML)はネットワーク優先、失敗時のみキャッシュにフォールバック。
// YouTube/Claude/Google認証へのAPIリクエストはキャッシュ対象外（常にネットワークへ）。
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // 外部APIはそのまま素通し

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
