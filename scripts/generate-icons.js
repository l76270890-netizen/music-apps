/**
 * Generates the TuneIt app icon (and the PWA splash screen) from a single SVG
 * source, so every installed surface — Android/iOS launcher, PWA manifest,
 * favicon, splash — uses the exact same artwork.
 *
 *   node scripts/generate-icons.js            # use the pre-rendered source if present
 *   node scripts/generate-icons.js --render   # re-render assets/icon-source.svg first (needs sharp)
 *
 * Outputs (root frontend + frontend/ copy):
 *   assets/icon.png, adaptive-icon.png, splash-icon.png, favicon.png
 *   frontend/assets/images/tuneit-splash.png
 *   public/icons/tuneit-{192,512,maskable-512,apple-180,favicon-48}.png
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// The repo has two Expo roots (the repo root and frontend/); both ship the app,
// so every icon is written to each one.
const targets = [root, path.join(root, 'frontend')];
const outputPath = (target, file) => path.join(target, file.replace(/^frontend\//, ''));
const sourceSvg = path.join(root, 'assets', 'icon-source.svg');

/* Source art is a 1024x1024 SVG; these are the painted files that get written. */
const OUTPUTS = [
  // Expo / native app icon (Android launcher, iOS home screen).
  { file: 'assets/icon.png', size: 1024 },
  // Android adaptive icon foreground.
  { file: 'assets/adaptive-icon.png', size: 1024 },
  // Expo splash logo (centered on the splash background).
  { file: 'assets/splash-icon.png', size: 512 },
  // Browser tab icon.
  { file: 'assets/favicon.png', size: 48 },
  { file: 'frontend/assets/images/tuneit-splash.png', size: 512 },
  // Web app manifest.
  { file: 'public/icons/tuneit-192.png', size: 192 },
  { file: 'public/icons/tuneit-512.png', size: 512 },
  { file: 'public/icons/tuneit-maskable-512.png', size: 512 },
  // iOS "Add to Home Screen" needs an opaque 180x180 touch icon.
  { file: 'public/icons/tuneit-apple-180.png', size: 180 },
  // Legacy shortcut / favicon.
  { file: 'public/icons/tuneit-favicon-48.png', size: 48 },
];

/* SVG fallback for the PWA — browsers without SVG support use the PNGs.
 *
 * Artwork: dark glossy tile with an orange rounded frame, an orange vinyl record
 * behind a large orange music note, and orange equalizer bars on both sides.
 * Orange-on-dark only, so it stays readable at 48px. */
function svgMarkup({ maskable = false } = {}) {
  // Launcher masks crop to the inner circle, so the glyph is pulled in.
  const scale = maskable ? 0.8 : 1;
  const mid = 512;

  // Equalizer bars: [x, height], mirrored around the centre.
  const BAR_W = 30;
  const bars = [
    [132, 86], [186, 128], [240, 96], [294, 150],   // left, growing toward the note
    [700, 150], [754, 96], [808, 128], [862, 86],   // right, mirror image
  ]
    .map(([x, h]) => `<rect x="${x}" y="${512 - h / 2}" width="${BAR_W}" height="${h}" rx="15"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <linearGradient id="tile" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#2B2C34"/>
    <stop offset="0.55" stop-color="#1F2028"/>
    <stop offset="1" stop-color="#14151B"/>
  </linearGradient>
  <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFA64D"/>
    <stop offset="1" stop-color="#FF6A00"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.55">
    <stop offset="0" stop-color="#FF8616" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#FF8616" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="orange" x1="0" y1="0" x2="0.5" y2="1">
    <stop offset="0" stop-color="#FFA64D"/>
    <stop offset="0.5" stop-color="#FF8616"/>
    <stop offset="1" stop-color="#F06A00"/>
  </linearGradient>
</defs>
<rect width="1024" height="1024" fill="url(#tile)"/>
<!-- glossy sheen sweeping the top-left corner -->
<path d="M0 0 H1024 L0 620 Z" fill="#FFFFFF" fill-opacity="0.035"/>
<rect width="1024" height="1024" fill="url(#glow)"/>
<!-- orange rounded frame -->
<rect x="26" y="26" width="972" height="972" rx="190" fill="none" stroke="url(#frame)" stroke-width="30"/>
<g transform="translate(${mid} ${mid}) scale(${scale}) translate(${-mid} ${-mid})">
  <!-- vinyl record behind the note -->
  <circle cx="512" cy="512" r="250" fill="url(#orange)" fill-opacity="0.16"/>
  <circle cx="512" cy="512" r="250" fill="none" stroke="url(#orange)" stroke-opacity="0.55" stroke-width="6"/>
  <circle cx="512" cy="512" r="206" fill="none" stroke="#FF8616" stroke-opacity="0.28" stroke-width="3"/>
  <circle cx="512" cy="512" r="162" fill="none" stroke="#FF8616" stroke-opacity="0.2" stroke-width="3"/>
  <!-- equalizer bars -->
  <g fill="url(#orange)">${bars}</g>
  <!-- music note: two heads, stem, and a slanted beam -->
  <g fill="url(#orange)">
    <ellipse cx="438" cy="646" rx="58" ry="44" transform="rotate(-18 438 646)"/>
    <ellipse cx="600" cy="616" rx="58" ry="44" transform="rotate(-18 600 616)"/>
    <path d="M470 372 h38 v282 a19 19 0 0 1 -38 0 Z"/>
    <path d="M508 372 L612 348 v104 Q566 428 508 448 Z"/>
  </g>
  <!-- note head holes keep the shape reading as a quaver at small sizes -->
  <ellipse cx="438" cy="646" rx="20" ry="14" transform="rotate(-18 438 646)" fill="#1B1C22" fill-opacity="0.35"/>
  <ellipse cx="600" cy="616" rx="20" ry="14" transform="rotate(-18 600 616)" fill="#1B1C22" fill-opacity="0.35"/>
</g>
</svg>
`;
}

/* Adaptive foreground: the note and bars only, on transparency — the dark tile
 * and frame come from the icon itself, and the colour under it is set by the
 * <background> layer, so the glyph must not bring its own plate. */
function adaptiveForegroundSvg() {
  return svgMarkup({ maskable: true })
    .replace('<rect width="1024" height="1024" fill="url(#tile)"/>', '')
    .replace('<path d="M0 0 H1024 L0 620 Z" fill="#FFFFFF" fill-opacity="0.035"/>', '')
    .replace('<rect width="1024" height="1024" fill="url(#glow)"/>', '')
    .replace(/<rect x="26" y="26"[^>]*\/>/, '');
}

function svgMaskable() {
  // Maskable versions must fill the entire square (no transparent corners),
  // otherwise the launcher mask shows white/black wedges.
  return svgMarkup({ maskable: true });
}

/* Android shares one resource name per density, so the round launcher icon is
 * the same artwork with a circular mask cropped into the file. */
function roundedSvg(radiusRatio) {
  const r = Math.round(1024 * radiusRatio);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><clipPath id="c"><rect width="1024" height="1024" rx="${r}" ry="${r}"/></clipPath></defs>` +
    `<g clip-path="url(#c)">${svgMarkup().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g></svg>`;
}

/* Android launcher icons live in android/.../mipmap-<density>/ — expo prebuild
 * will not refresh them after the fact, so the generator writes them directly. */
const ANDROID_MIPMAPS = [
  { dir: 'mdpi', legacy: 48, adaptive: 108 },
  { dir: 'hdpi', legacy: 72, adaptive: 162 },
  { dir: 'xhdpi', legacy: 96, adaptive: 216 },
  { dir: 'xxhdpi', legacy: 144, adaptive: 324 },
  { dir: 'xxxhdpi', legacy: 192, adaptive: 432 },
];
// Adaptive icon layers are 108dp and launchers crop to the inner 72dp circle,
// so the artwork is scaled down inside a 72/108 = 66% safe area.
const ADAPTIVE_INSET = 72 / 108;

function writeSvgs() {
  fs.writeFileSync(sourceSvg, svgMarkup());
  for (const target of targets) {
    const dir = path.join(target, 'public', 'icons');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'tuneit-icon.svg'), svgMarkup());
    fs.writeFileSync(path.join(dir, 'tuneit-maskable.svg'), svgMaskable());
  }
  console.log('Wrote assets/icon-source.svg and public/icons/*.svg');
}

async function main() {
  writeSvgs();

  let sharp;
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    sharp = require('sharp');
  } catch {
    console.error('`sharp` is not installed. Run: npm i -D sharp');
    process.exit(1);
  }

  const base = Buffer.from(svgMarkup());
  const maskable = Buffer.from(svgMaskable());

  for (const target of targets) {
    for (const { file, size } of OUTPUTS) {
      const isMaskable = file.includes('maskable');
      const dest = outputPath(target, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });

      // Launchers apply their own mask, so every icon stays square and
      // full-bleed. Pre-rounding shows dark wedges inside a circle mask.
      const img = sharp(isMaskable ? maskable : base).resize(size, size);
      await img.png({ compressionLevel: 9 }).toFile(dest);
      console.log(`  ${path.relative(root, dest)} (${size}x${size})`);
    }
  }

  // Android native launcher resources (legacy square + round, adaptive layers).
  const androidApp = path.join(root, 'android', 'app', 'src', 'main', 'res');
  if (fs.existsSync(path.join(root, 'android', 'app'))) {
    for (const { dir, legacy } of ANDROID_MIPMAPS) {
      const mipmap = path.join(androidApp, `mipmap-${dir}`);
      fs.mkdirSync(mipmap, { recursive: true });
      await sharp(base).resize(legacy, legacy).png().toFile(path.join(mipmap, 'ic_launcher.png'));
      await sharp(Buffer.from(roundedSvg(0.5))).resize(legacy, legacy).png().toFile(path.join(mipmap, 'ic_launcher_round.png'));
      // Drop the stale .webp launchers: Android prefers .webp over .png in the
      // same mipmap folder, so leaving them is exactly why the old letter icon
      // kept showing up after a rebuild.
      for (const stale of ['ic_launcher.webp', 'ic_launcher_round.webp']) {
        fs.rmSync(path.join(mipmap, stale), { force: true });
      }
    }

    // Adaptive icon: solid accent background + inset foreground (API 26+).
    const adaptive = path.join(androidApp, 'mipmap-anydpi-v26');
    fs.mkdirSync(adaptive, { recursive: true });
    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/iconBackground"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
    fs.writeFileSync(path.join(adaptive, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(adaptive, 'ic_launcher_round.xml'), adaptiveXml);

    for (const { dir, adaptive: size } of ANDROID_MIPMAPS) {
      const mipmap = path.join(androidApp, `mipmap-${dir}`);
      fs.mkdirSync(mipmap, { recursive: true });
      // Foreground is the glyph on transparency, inside the 66% safe circle;
      // the solid colour comes from the <background> layer in the adaptive XML.
      await sharp(await sharp(Buffer.from(adaptiveForegroundSvg())).png().toBuffer())
        .resize(Math.round(size * ADAPTIVE_INSET), Math.round(size * ADAPTIVE_INSET))
        .extend({
          top: Math.round((size * (1 - ADAPTIVE_INSET)) / 2),
          bottom: Math.round((size * (1 - ADAPTIVE_INSET)) / 2),
          left: Math.round((size * (1 - ADAPTIVE_INSET)) / 2),
          right: Math.round((size * (1 - ADAPTIVE_INSET)) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(path.join(mipmap, 'ic_launcher_foreground.png'));
    }
    console.log('  android/.../mipmap-*: ic_launcher(.png/.webp removed), _round, adaptive layers');
  }

  console.log('TuneIt icons generated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
