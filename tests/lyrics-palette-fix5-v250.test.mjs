// v250 palette fix session 3, item 9: gold hair highlights on brown hair must stay a palette colour (synthetic picture: brown hair, 5 % gold strands, face, navy background).
// MEASURED with the harness (PIL pictures, Lanczos): strands >= 6 px wide at 760 px are kept; 3 px strands and a dull light-brown highlight (#aa7d46, 6 px) were LOST. This test uses a box-averaged scene, where even 3 px survives, so it only guards the kept case. The real blonde portrait is still needed for the lost case.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto };')(detailFromFrames, HI);
const S = 768, hair = [92, 66, 44], gold = [222, 170, 70];
function scene(strandW) {
  const px = new Uint8Array(S * S * 3); for (let i = 0; i < S * S; i++) { px[i * 3] = 30; px[i * 3 + 1] = 45; px[i * 3 + 2] = 70; }
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < S && y < S) { const i = (y * S + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } };
  for (let y = 40; y < S; y++) for (let x = 120; x < 640; x++) set(x, y, hair);
  for (let y = 200; y < 500; y++) for (let x = 260; x < 500; x++) if (((x - 380) / 120) ** 2 + ((y - 350) / 150) ** 2 < 1) set(x, y, [215, 170, 150]);
  let seed = 5; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  const ln = 140, n = Math.floor(.05 * S * S / (strandW * ln));
  for (let k = 0; k < n; k++) { const x = 125 + rnd(510), y = 45 + rnd(600); if (x > 250 && x < 510 && y > 190 && y < 510) continue; for (let t = 0; t < ln; t++) for (let w = 0; w < strandW; w++) set(x + w + Math.round(t * 0), y + t, gold); }
  return px;
}
const down = (px, s) => { const f = S / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) t += px[((y * f + j) * S + x * f + i) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
function palette(strandW) { const px = scene(strandW), d = down(px, 32), f96 = down(px, 96), f192 = down(px, 192); d.hi = { frames: [f96], w: [1], eyeFrames: [f192] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]); return F.tintPaletteAuto(d); }
const isGold = c => { const h = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, ch = Math.hypot(c.a, c.b); return h > 55 && h < 90 && ch > .09 && c.L > .6; };
for (const w of [10, 16]) test(`v250: gold strands ${w} px wide (5 % of the picture) stay a palette colour next to the brown hair`, () => {
  const pal = palette(w); assert.ok(pal.some(isGold), 'a gold colour is in the palette'); assert.ok(pal.some(c => c.hair || (c.L < .45 && Math.hypot(c.a, c.b) < .08)), 'the brown hair is still there');
});
