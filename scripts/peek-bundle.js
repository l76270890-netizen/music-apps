// Dev helper: print the bundle module body that contains a symbol,
// with its module ID and dependencies, so you can trace why code isn't running.

const fs = require('fs');
const path = require('path');

const needle = process.argv[2];

if (!needle) {
  console.error('usage: node scripts/peek-bundle.js <search text> [context chars]');
  process.exit(1);
}

const context = Number(process.argv[3] || 1400);

const dir = path.join(
  __dirname,
  '..',
  'frontend',
  'dist',
  '_expo',
  'static',
  'js',
  'web'
);

if (!fs.existsSync(dir)) {
  console.error(`Bundle directory not found: ${dir}`);
  process.exit(1);
}

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8');

  let index = src.indexOf(needle);
  let count = 0;

  while (index !== -1 && count < 4) {
    const moduleStart = src.lastIndexOf('__d(function', index);

    // Module footer: },<id>,[deps]);
    const footerMatch = /},(\d+),\[([^\]]*)\]\)/g;
    footerMatch.lastIndex = Math.max(0, index);

    const footer = footerMatch.exec(src.slice(0, index + 200000));

    console.log(`\n=== ${file}`);
    console.log(
      `module id: ${footer ? footer[1] : '?'}  deps: ${footer ? footer[2] : '?'}`
    );

    console.log(
      src.slice(Math.max(moduleStart, index - context), index + context)
    );

    index = src.indexOf(needle, index + 1);
    count += 1;
  }
}