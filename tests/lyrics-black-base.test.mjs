import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('dark covers keep their black as the lyrics background base', () => {
  assert.match(main, /p\.k = mixHex\(dark/);
  assert.match(main, /k \+ '5'/);
  assert.match(main, /k: null/);
  assert.match(css, /\.lyr\[style\*="--lyr-bg5"\]/);
});
