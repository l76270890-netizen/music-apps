/**
 * Local preview server for the exported web build (dist/).
 *
 *   npm run preview:web [-- --port 8080 --host 0.0.0.0]
 *
 * Serves like production does: SPA fallback to index.html, correct MIME types,
 * the PWA manifest/service-worker headers, and no-cache for sw.js and
 * manifest.json so a reinstall picks up new icons.
 *
 * Listening on 0.0.0.0 means you can open the printed LAN URL on a phone and
 * install it as a real app from there.
 */
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html not found — run `npm run build:web` first.');
  process.exit(1);
}

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};
const port = Number(argValue('--port', process.env.PORT || 8080));
const host = argValue('--host', '0.0.0.0');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const NO_CACHE = new Set(['/sw.js', '/manifest.json']);

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requested = decodeURIComponent(url.pathname);
  const filePath = path.join(dist, requested);

  // Never escape dist/.
  if (!filePath.startsWith(dist)) return send(res, 403, 'Forbidden');

  const serveFile = (target) => {
    const ext = path.extname(target).toLowerCase();
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': NO_CACHE.has(requested) ? 'no-cache' : 'public, max-age=3600',
    };
    if (requested === '/sw.js') headers['Service-Worker-Allowed'] = '/';
    // Browsers only register a service worker (and offer "Install app") on a
    // secure context: HTTPS, or any loopback host like localhost/127.0.0.1.
    // A phone opening http://192.168.x.x cannot install the PWA.
    res.writeHead(200, headers);
    fs.createReadStream(target).pipe(res);
  };

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return serveFile(filePath);

  // SPA fallback: Expo Router handles the routes client-side.
  serveFile(path.join(dist, 'index.html'));
});

// A bare IP on plain HTTP is not a secure context, so install prompts and the
// service worker won't work there. .local mDNS names get a self-signed cert on
// some phones; this note just makes the limitation obvious.
server.listen(port, host, () => {
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);

  console.log(`Serving dist/ on http://localhost:${port}`);
  for (const address of lan) console.log(`  LAN: http://${address}:${port}`);
  console.log('');
  console.log('Install works on https:// (or localhost). A bare LAN IP over http://');
  console.log('is not a secure context on phones, so the install prompt is hidden there.');
});
