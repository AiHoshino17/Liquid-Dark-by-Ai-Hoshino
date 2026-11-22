// session 8 (owner: "eye colour missing" on blonde_bed and two_girls). The irises are dull olive (chroma .04-.07) on a pale face: little dark pupil, a small hue bin. Now a WEAK spot (dark pupil 4-10 % or a dull bin) counts when it has a level-ish partner (pair); a warm eye is only "a shade of a big colour" when its lightness is within .15 (was .25) of that colour, so a darker olive iris is kept while the pale gold hair spot is still not an eye.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto };')(detailFromFrames, HI);
const load = n => { const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/' + n + '-192.b64', import.meta.url), 'utf8'), 'base64');
  const down = s => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) t += rgb[((y * f + j) * 192 + x * f + i) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
  const d = down(32); d.hi = { frames: [down(96)], w: [1], eyeFrames: [down(192)] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]); return F.tintPaletteAuto(d); };
const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
for (const [n, minX, maxX] of [['blonde-bed', .35, .65], ['two-girls', .65, .85]]) test(n + ': an olive eye colour is in the palette, on the eye', () => {
  const eyes = load(n.replace('-', '_') === 'blonde_bed' ? 'blonde-bed' : 'two-girls').filter(c => c.eye);
  assert.equal(eyes.length, 1); const e = eyes[0];
  assert.ok(hue(e) > 60 && hue(e) < 125, 'olive hue ' + hue(e)); assert.ok(e.x > minX && e.x < maxX && e.y > .25 && e.y < .5, `on the eye ${e.x},${e.y}`);
});
