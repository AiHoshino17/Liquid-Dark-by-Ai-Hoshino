// v260 (owner, gif156 night GIF: "take her eye colour and show it in the gradient"): the dark-frame eye colour
// (flags eye + dark2, share .0004) must be a visible glow ON the eye in the lyrics gradient, not a fallback slot glow.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteGrad };')(detailFromFrames, HI);
const load = (n, k) => { const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/' + n + '.b64', import.meta.url), 'utf8'), 'base64'), P = 192 * 192 * 3;
  const down = (j, s) => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) t += rgb[j * P + ((y * f + b) * 192 + x * f + a) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
  const d = new Uint8ClampedArray(k * 4096); for (let j = 0; j < k; j++) d.set(down(j, 32), j * 4096); d.fw = Array(k).fill(1);
  const hf = Array.from({ length: k }, (_, j) => down(j, 96)); d.hi = { frames: [], w: [], hueFrames: hf, hueW: Array(k).fill(1), eyeFrames: Array.from({ length: k }, (_, j) => down(j, 192)) }; d.hi.detail = detailFromFrames(hf, d.hi.hueW); return d; };
test('v260: the gif156 blonde girl\'s dark-frame eye is a palette colour placed on her eye in the gradient', () => {
  const pal = F.tintPaletteAuto(load('gif156-night-192x4', 4)), css = F.tintPaletteGrad(pal);
  const e = pal.find(c => c.eye && c.dark2); assert.ok(e, 'no dark2 eye colour');
  assert.ok(e.share >= .004, "eye share " + e.share);
  assert.ok(e.x > .3 && e.x < .42 && e.y > .54 && e.y < .66, `eye at ${e.x},${e.y}`);
  const at = `at ${Math.round(e.x * 100)}% ${Math.round(e.y * 100)}%`; assert.ok(css.includes(at), 'no glow on the eye: ' + at);
});
