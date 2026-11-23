// Builds the single-file game: node build.js  ->  index.html
const fs = require('fs');
const path = require('path');
const r = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const three = r('vendor/three.min.js').replace(/^console\.warn\([^\n]*\),/, '0,'); // drop the deprecation warning
const game = ['src/core.js', 'src/products.js', 'src/store.js', 'src/cart.js', 'src/hazards.js', 'src/audio.js', 'src/game.js'].map(r).join('\n');
const html = r('src/template.html')
  .replace('/*__THREE__*/', () => three)
  .replace('/*__GAME__*/', () => game);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html written,', (html.length / 1024).toFixed(0), 'KB');
