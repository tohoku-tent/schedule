const CACHE_NAME = 'tohoku-tent-schedule-v12';
const URLS_TO_CACHE = [
  '/schedule/schedule.html'
];

self.addEventListener('install', function(event) {
  self.skipWaiting(); // 新しいSWをすぐ有効化
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', function(event) {
  // 古いバージョンのキャッシュを削除
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  // 自サイトのGETだけ扱う（Firebase等はブラウザに任せる）
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    // no-cache: 常にサーバーへ確認して最新版を取得。成功したらキャッシュも更新
    fetch(req, { cache: 'no-cache' }).then(function(res) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(req, clone); });
      return res;
    }).catch(function() {
      // オフライン時はキャッシュを使用
      return caches.match(req);
    })
  );
});
