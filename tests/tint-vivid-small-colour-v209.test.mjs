import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const i = t => src.indexOf(t);
const code = src.slice(i('const rgb2hsl'), i('// v208+: EXACT')) + src.slice(i('const rgbHex'), i('/* v208+: the colour field follows')) + src.slice(i('function tintFromPixels'), i('function coverTint')) + ';return tintFromPixels;';
const tint = new Function(code)();
const px = (n, f) => { const d = new Uint8ClampedArray(n * 4); for (let k = 0; k < n; k++) { const c = f(k); d.set([...c, 255], k * 4); } return d; };
const hue = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return { r, g, b }; };
test('a small but vivid red area on a mostly white + black cover gives red, not a grey average (Echoes of Silence)', () => {
  const d = px(1024, k => k < 600 ? [235, 235, 232] : k < 900 ? [8, 8, 8] : [150, 20, 35]);
  const c = hue(tint(d).a);
  assert.ok(c.r > c.g * 2 && c.r > c.b * 2, 'red wins: ' + tint(d).a);
});
test('vivid red beats a larger area of dull brown skin (After Hours)', () => {
  const d = px(1024, k => k < 620 ? [96, 56, 31] : k < 900 ? [20, 14, 10] : [110, 14, 20]);
  const c = hue(tint(d).a);
  assert.ok(c.g < c.r * .45, 'reddish, not brown: ' + tint(d).a);
});
test('a plain red cover stays red and a grey cover still gets the neutral colour', () => {
  assert.ok(hue(tint(px(1024, () => [210, 10, 55])).a).r > 150);
  const g = hue(tint(px(1024, k => k % 2 ? [120, 120, 120] : [60, 60, 60])).a);
  assert.ok(Math.abs(g.r - g.b) < 30);
});
test('Blinding Lights (a real 32x32 crop of the cover): orange main colour, red jacket as the second (glow) colour', () => {
  const d = new Uint8ClampedArray(Buffer.from(readFileSync(new URL('./fixtures/blinding-lights-32.b64', import.meta.url), 'utf8'), 'base64'));
  const p = tint(d), a = hue(p.a), b = hue(p.b);
  assert.ok(a.r > a.g && a.g > a.b, 'main is orange: ' + p.a);
  assert.ok(b.r > b.g * 3, 'second is red: ' + p.b);
});
test('lyrics are not selectable and have no long-press menu', () => {
  const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  assert.match(css, /\.lyr,\.lyr \*\{[^}]*user-select:none/);
  assert.match(src, /\.grow\[data-act="genre"\], \.lyr'\)\)\) e\.preventDefault\(\)/);
});
