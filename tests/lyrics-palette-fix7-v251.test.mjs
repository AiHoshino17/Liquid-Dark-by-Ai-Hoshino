// session 6: star-shaped violet / magenta eyes (Ai, c62 = p4) must be an eye colour with BOTH eyes circled. Before: no eye colour at all (pink-lavender skin, tinted eye white and a pale pink iris were all taken for skin).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto };')(detailFromFrames, HI);
const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/ai-star-eyes-192.b64', import.meta.url), 'utf8'), 'base64');
const down = s => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) t += rgb[((y * f + j) * 192 + x * f + i) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
const d = down(32); d.hi = { frames: [down(96)], w: [1], eyeFrames: [down(192)] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]);
const pal = F.tintPaletteAuto(d);
test('session 6: Ai star eyes give a violet / magenta eye colour with both eyes', () => {
  const e = pal.find(c => c.eye); assert.ok(e, 'an eye colour'); const h = (Math.atan2(e.b, e.a) * 180 / Math.PI + 360) % 360;
  assert.ok(h > 280 && h < 350, 'violet / magenta hue ' + h); assert.ok(e.x2 != null, 'second eye spot'); assert.ok(e.y > .5 && e.y < .7, 'eyes at face height: ' + e.y);
});
