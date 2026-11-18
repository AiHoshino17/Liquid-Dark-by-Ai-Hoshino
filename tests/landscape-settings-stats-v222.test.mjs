// v222 third pass: landscape for Settings and Listening Stats (and the sheets / Animation pages). Portrait must stay exactly as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const L = readFileSync(new URL('../src/lstats.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const tail = C.slice(C.indexOf('v222 (third pass): LANDSCAPE for Settings'));

test('portrait: the new wrappers are display:contents, so nothing moves', () => {
  assert.match(tail, /^\.lsw,\.lshd,\.lsbd,\.setcols\{display:contents\}/m);
});
test('Settings is wrapped in .setcols (opened after the title bar, closed at the end) and flows in two columns sideways', () => {
  assert.equal((M.match(/<div class="setcols"><div class="profile">/g) || []).length, 1);
  assert.match(M, /<\/div><\/div><\/div>`;   \/\/ v222: \.setcols/);
  assert.match(tail, /\.setcols\{display:block;column-count:2/);
  assert.match(tail, /\.setcols \.setcard\{break-inside:avoid/);
  assert.match(tail, /\.setcols \.profile\{column-span:all/);
});
test('Listening Stats and View All use .lsw > .lshd (controls) + .lsbd (numbers); every opened wrapper is closed', () => {
  assert.equal((L.match(/class="lsw"><div class="lshd">/g) || []).length, 2);
  assert.equal((L.match(/<div class="lsbd">/g) || []).length, 2);
  assert.match(L, /Clear data…<\/button><\/div><\/div><\/div>`;/);
  assert.match(L, /Nothing listened to in this range\.<\/div>'}<\/div><\/div>`;/);
});
test('song / artist / album detail reuses .dwrap > .dhero + .dbody', () => {
  assert.match(L, /<div class="dwrap"><div class="dhero"><div class="detail-art">\$\{art\}/);
  assert.match(L, /<div class="dbody">\$\{A\.totalMs \? stats\(/);
  assert.match(L, /\$\{histRows\(mine\)\}<\/div>` : ''\}<\/div><\/div>`;/);
});
test('landscape CSS: left column for the Stats controls, Snapshot picture left, long sheets in two columns, Animation preview left', () => {
  assert.match(tail, /\.lsw\{display:grid;grid-template-columns:minmax\(210px,30%\)/);
  assert.match(tail, /#sheet #snapbox:has\(\.snapimg\)\{display:grid/);
  assert.match(C, /#sheet \.sheetbox:not\(\.notifcard\):has\(>\.row:nth-child\(n\+6\)\)\{display:grid;grid-template-columns:repeat\(2/);
  assert.match(C, /\.screen\.sub:has\(>\.animdock\)\{display:grid;grid-template-columns:minmax\(0,44%\)/);
  assert.match(C, /@media \(orientation:landscape\) and \(max-height:360px\)\{\s*\.lshd>h1\.large/);
});
test('every v222 landscape rule is inside a landscape media query (portrait CSS untouched)', () => {
  const after = C.slice(C.indexOf('/* ===== v222 (third pass)')).replace(/\/\*[\s\S]*?\*\//g, '');   // comments removed
  let depth = 0, inMedia = false, bad = [];
  for (const line of after.split('\n')) {
    if (/^@media/.test(line)) { inMedia = true; depth = 1; continue; }
    if (inMedia) { depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length; if (depth <= 0) inMedia = false; continue; }
    if (/^[.#:a-z]/i.test(line) && !/^\.lsw,\.lshd,\.lsbd,\.setcols\{display:contents\}/.test(line)) bad.push(line.slice(0, 60));
  }
  assert.deepEqual(bad, []);
});
