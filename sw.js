// Tournée de nuit - fonctionnement hors ligne
// Change le numéro de version à chaque mise à jour de l'appli.
const PREFIXE = 'tournee-nuit-';
const VERSION = PREFIXE + 'v1';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // N'efface que les anciennes versions de CETTE appli (les autres applis ont leurs propres copies)
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIXE) && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Recherche d'adresse : toujours en direct, jamais en copie
  if (url.hostname === 'data.geopf.fr' || url.hostname === 'api-adresse.data.gouv.fr') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copie = r.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copie));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') {
        const copie = r.clone();
        caches.open(VERSION).then(c => c.put(req, copie));
      }
      return r;
    }))
  );
});
