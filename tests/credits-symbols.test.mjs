// Settings > About > Credits: "♥︎★ Ai Hoshino" (text ones first) and then a red heart and a black star on the right.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const rd = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the text heart and star come first, then the name, then the colour heart, then the black star', () => {
  const m = rd('src/main.js');
  const r = /row\('Credits', '([^']+)'\)/.exec(m); assert.ok(r, 'credits row found');
  const t = r[1];
  assert.ok(t.startsWith('♥\uFE0E★ Ai Hoshino '), 'text heart (♥︎), text star (★), then the name');
  const iHeart = t.indexOf('class="credheart"'), iStar = t.indexOf('class="credstar"');
  assert.ok(iHeart > 0 && iStar > iHeart, 'colour heart, then star');
  assert.match(t, /class="credheart"[^>]*>♥\uFE0F</, 'the colour heart uses the emoji form (♥️)');
  assert.match(t, /<img class="credstar"[^>]*src="data:image\/png;base64,/, 'the star is the picture (dark grey, transparent background)');
});

test('the heart is red and the star is the picture (sized in CSS)', () => {
  const c = rd('src/styles/app.css');
  assert.match(c, /\.credheart\{[^}]*color:#ff2d4a/);
  assert.match(c, /\.credstar\{[^}]*width:1\.1em/);
});
