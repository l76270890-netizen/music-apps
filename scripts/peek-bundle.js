// Dev helper: print bundle module IDs around a symbol, so you can find which
// __d(...,ID,[deps]) module contains it in the minified output.
const fs = require('fs');
const path = require('path');
const needle = process.argv[2];
if (!needle) {
  console.error('usage: node scripts/peek-bundle.js <search text>');
  process.exit(1);
}
const dir = path.join(__dirname, '..', 'frontend', 'dist', '_expo', 'static', 'js', 'web');
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(dir, file), 'utf8');
  let index = src.indexOf(needle);
  let count = 0;
  while (index !== -1 && count < 4) {
    // Find the __d( that owns this position and read its module id + deps.
    const start = src.lastIndexOf('__d(function', index);
    const tail = src.slice(index, index + 4000);
    const end = tail.search(/\},\d+,\[[^\]]*\]\);/);
    const header = end === -1 ? '(unterminated)' : tail.slice(end, end + 200).split(');')[0] + ');';
    console.log(`\n=== ${file} @${index}\n${header}`);
    index = src.indexOf(needle, index + 1);
    count += 1;
    void start;
  }
}
