/* Static file server that mirrors production hosting for verifying the TuneIt PWA build.
 * Serves dist/ with the same content types / no-cache rules / SPA fallback used in production.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT) || 8123;

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const noCache = ['/sw.js', '/manifest.json'];

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let file = path.join(root, urlPath);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html'); // SPA fallback
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': mime[ext] || 'application/octet-stream' };
    if (noCache.includes(urlPath)) headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    if (urlPath === '/sw.js') headers['Service-Worker-Allowed'] = '/';
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(port, () => console.log(`TuneIt PWA preview: http://localhost:${port}`));
