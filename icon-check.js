
const sharp = require('sharp');

const items = [
  ['public/icons/tuneit-maskable-512.png', 260, 24, 30, 'maskable 512'],
  ['public/icons/tuneit-512.png', 260, 300, 30, 'standard 512'],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 120, 600, 30, 'round'],
  ['public/icons/tuneit-192.png', 120, 600, 160, '192'],
  ['public/icons/tuneit-apple-180.png', 120, 600, 290, '180'],
  ['public/icons/tuneit-favicon-48.png', 48, 600, 420, '48'],
];

(async () => {
  const comps = [];
  for (const [file, size, left, top, label] of items) {
    comps.push({ input: await sharp(file).resize(size).toBuffer(), left, top });
    comps.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24"><text x="0" y="16" font-family="Arial" font-size="14" fill="#9AA0AE">${label}</text></svg>`
      ),
      left,
      top: top + size + 6,
    });
  }
  // Circle mask over the maskable icon, to prove the frame survives cropping.
  comps.push({
    input: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="500">' +
      '<circle cx="154" cy="160" r="130" fill="none" stroke="#FF8616" stroke-width="3"/>' +
      '</svg>'
    ),
    left: 0,
    top: 0,
  });
  await sharp({ create: { width: 760, height: 500, channels: 4, background: '#0E0F13' } })
    .composite(comps)
    .png()
    .toFile('icon-check.png');
  console.log('icon-check.png written');
})();
