// v221 second pass: landscape polish (detail pages, Library, sheets, picture cards). Portrait must stay exactly as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const tail = C.slice(C.lastIndexOf('v221 (second pass): LANDSCAPE polish'));

test('album, playlist, artist and genre pages are wrapped in .dwrap > .dhero + .dbody', () => {
  assert.equal((M.match(/class="dwrap"><div class="dhero">/g) || []).length, 4);
  assert.equal((M.match(/<div class="dbody">/g) || []).length, 4);
});
test('portrait: the wrappers are display:contents, so nothing moves', () => {
  assert.match(tail, /^\s*\.dwrap,\.dhero,\.dbody\{display:contents\}/m);
});
test('landscape block puts the hero left and the list right, Library in 2 columns, Sleep timer in 3', () => {
  assert.match(tail, /\.dwrap\{display:grid;grid-template-columns:minmax\(180px,30%\)/);
  assert.match(tail, /\.libgrid\{display:grid;grid-template-columns:repeat\(2/);
  assert.match(tail, /\.slgrid\{display:grid;grid-template-columns:repeat\(3/);
});
test('picture cards lie down sideways (notification / update card and Keep the music playing)', () => {
  assert.match(tail, /#lf-bgallow\{display:grid/);
  assert.match(tail, /#sheet \.sheetbox\.notifcard\.popcard,#lf-bgallow\{display:grid/);
});
test('Library rows and Sleep timer buttons keep their data-act hooks inside the new wrappers', () => {
  assert.match(M, /<div class="libgrid">.*data-act="lib"/s);
  assert.match(M, /<div class="slgrid">\$\{SLEEP_MINUTES\.map\(m => item\('sl-min'/);
});
