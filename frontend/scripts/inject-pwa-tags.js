/**
 * Post-export step: makes the Expo web build installable as a PWA.
 *
 * - Copies /public (manifest.json, sw.js, icons) into dist with the right file names.
 * - Injects the manifest link, Apple/iOS meta tags and the service worker
 *   registration into dist/index.html.
 * - Fails the build if an installability requirement is missing.
 *
 * Usage: node scripts/inject-pwa-tags.js   (run from frontend/, after `expo export`)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found — run `npx expo export --platform web` first.');
  process.exit(1);
}

// 1. Copy static PWA assets into the export output.
fs.cpSync(publicDir, dist, { recursive: true, force: true });

const required = [
  'manifest.json',
  'sw.js',
  'icons/tuneit-icon.svg',
  'icons/tuneit-favicon-48.png',
  'icons/tuneit-apple-180.png',
  'icons/tuneit-192.png',
  'icons/tuneit-512.png',
  'icons/tuneit-maskable-512.png',
  'icons/tuneit-maskable.svg',
];
for (const file of required) {
  if (!fs.existsSync(path.join(dist, file))) {
    console.error(`Missing required PWA asset in dist: ${file}`);
    process.exit(1);
  }
}

// 1b. Expo emits its own default favicon.ico — replace it so the browser tab
// shows the TuneIt icon too.
fs.copyFileSync(path.join(publicDir, 'icons', 'tuneit-favicon-48.png'), path.join(dist, 'favicon.ico'));

// 2. Validate the manifest itself (browser install prompts need these fields).
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));
const manifestProblems = [];
if (!manifest.name || !manifest.short_name) manifestProblems.push('name / short_name');
if (!manifest.start_url || !manifest.scope) manifestProblems.push('start_url / scope');
if (!['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].includes(manifest.display)) manifestProblems.push('display (standalone)');
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.sizes === '192x192')) manifestProblems.push('192x192 icon');
if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.sizes === '512x512')) manifestProblems.push('512x512 icon');
if (manifestProblems.length) {
  console.error(`manifest.json is missing installability fields: ${manifestProblems.join(', ')}`);
  process.exit(1);
}

// 3. Inject tags into index.html.
let html = fs.readFileSync(indexPath, 'utf8');

const headTags = [
  '<link rel="manifest" href="/manifest.json" />',
  '<meta name="application-name" content="TuneIt" />',
  '<link rel="icon" type="image/png" sizes="48x48" href="/icons/tuneit-favicon-48.png" />',
  '<link rel="icon" type="image/png" sizes="192x192" href="/icons/tuneit-192.png" />',
  '<link rel="icon" type="image/png" sizes="512x512" href="/icons/tuneit-512.png" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="/icons/tuneit-apple-180.png" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="TuneIt" />',
  '<meta name="theme-color" content="#FF8615" />',
];

let changed = false;
const missing = headTags.filter((tag) => !html.includes(tag));
if (missing.length) {
  html = html.replace(/<\/head>/i, `  ${missing.join('\n  ')}\n</head>`);
  changed = true;
}

const swRegister =
  "<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});});}</script>";
if (!html.includes('serviceWorker.register')) {
  html = html.replace(/<\/body>/i, `  ${swRegister}\n</body>`);
  changed = true;
}

if (changed) fs.writeFileSync(indexPath, html);
console.log(changed ? 'PWA tags injected into dist/index.html' : 'PWA tags already present');

// 4. Report what the installed app will look like.
console.log(`PWA ready: ${manifest.name} (${manifest.display}) — install URL is the site root over HTTPS.`);
