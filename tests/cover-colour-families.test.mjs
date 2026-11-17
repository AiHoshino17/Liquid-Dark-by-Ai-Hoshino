// Auto cover colour reads several colour families (main, second, third, dark tone), not one hue.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extract } from './extract.mjs';
const rgb2hsl = extract('src/main.js', 'rgb2hsl', {});
const rgbHex = extract('src/main.js', 'rgbHex', {});
const mixHex = extract('src/main.js', 'mixHex', { rgbHex });
const exactPal = extract('src/main.js', 'exactPal', { mixHex });
const tint = extract('src/main.js', 'tintFromPixels', { rgb2hsl, rgbHex, mixHex, exactPal, palFrom: () => ({ a: '#000000' }) });
const hue = h => rgb2hsl(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)))[0];
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return .299 * r + .587 * g + .114 * b; };
// 1024 px: 45% near-black, 20% red, 15% skin, 10% white border, 10% dark maroon
function cover() {
  const px = [], add = (n, c) => { for (let i = 0; i < n; i++) px.push(...c, 255); };
  add(460, [18, 20, 20]); add(205, [165, 40, 48]); add(155, [190, 135, 125]); add(102, [221, 226, 222]); add(102, [85, 30, 36]);
  return new Uint8ClampedArray(px);
}
test('a dark cover with red, skin, black and white gives red as the main colour, skin as another, and a dark tone', () => {
  const p = tint(cover());
  const h = hue(p.a); assert.ok(h < 15 || h > 340, 'main colour is red: ' + p.a);
  assert.ok([p.b, p.d].some(x => { const q = hue(x); return q < 30 || q > 340; }) && [p.b, p.d].some(x => lum(x) > 110), 'a lighter skin-like colour is among the 2nd / 3rd: ' + p.b + ' ' + p.d);
  assert.ok(lum(p.c) < 60, 'c is the dark tone: ' + p.c);
  assert.notEqual(p.a, p.b); assert.ok(p.d, 'a 3rd colour exists');
  assert.ok(p.sw.length >= 3, 'several colours are offered');
});
test('white text stays readable: no colour is lighter than the limit', () => {
  const p = tint(cover()); for (const x of [p.a, p.b, p.d]) assert.ok(lum(x) <= 151, x);
});
test('the 4th colour is passed to Now Playing and Lyrics (--np-bg4 / --lyr-bg4)', () => {
  const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  assert.match(M, /setProperty\(k \+ '4', p\.d\)/); assert.match(C, /--lyr-bg4/); assert.match(C, /--np-bg4/);
});
