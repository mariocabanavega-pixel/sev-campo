/* SEV Campo: guarda la app en el teléfono para que abra sin internet.
   Abre siempre la copia guardada y, si hay internet, la actualiza en segundo plano
   (los cambios se ven la siguiente vez que se abre). Siempre pide la versión fresca
   al servidor (cache:'reload') para no quedarse con una copia vieja. */
const CACHE = 'sev-campo-v18';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARCHIVOS.map(u =>
    fetch(u, {cache: 'reload'}).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); })
  ))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const nav = req.mode === 'navigate', clave = nav ? './index.html' : req;
    const guardada = await c.match(clave, {ignoreSearch: true});
    const red = fetch(nav ? './index.html' : req, {cache: 'reload'}).then(r => {
      if (r && r.ok) c.put(clave, r.clone());
      return r;
    }).catch(() => null);
    if (guardada) { e.waitUntil(red); return guardada; }
    return (await red) || new Response('Sin conexión', {status: 503});
  }));
});
