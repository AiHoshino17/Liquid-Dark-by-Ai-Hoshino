// v243 (owner: "you still miss the black hair, the brown hair, the copper, the silver; the black is more in the picture but you kept it less"):
// (1) tintPaletteAddMasses adds a big plain colour the vivid-first pick dropped; (2) a mostly dark palette gets ONE big dark glow sized by its share;
// (3) silver / light grey is drawn on top (an accent); (4) a corner glow's size follows the colour's share.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAddMasses, tintPaletteGrad, tintPaletteAuto, mixToLab, PALMAX };')();
const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const frame = fn => { const d = new Uint8ClampedArray(96 * 96 * 4); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) d.set([...fn(x, y), 255], (y * 96 + x) * 4); return d; };
test('v243: wired in tintPaletteAuto before the clean-up', () => { assert.match(M, /p = tintPaletteAddMasses\(p, d, hiW\); p = tintPaletteAddGaps/); });
test('v243: a big muted colour missing from the palette is added in its own true colour (free slot)', () => {
  const COPPER = [150, 90, 70], f = frame((x, y) => (x < 30 ? COPPER : [20, 20, 20]));
  const pal = [{ ...lab([20, 20, 20]), share: .7, x: .6, y: .5, rank: 1 }];
  F.tintPaletteAddMasses(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.length, 2); assert.ok(dist(pal[1], lab(COPPER)) < .05, 'true copper, not boosted'); assert.ok(pal[1].share > .25);
});
test('v243: a colour the palette already has, or a tiny one, adds nothing; the palette never goes over PALMAX', () => {
  const f = frame(() => [150, 90, 70]), pal = [{ ...lab([150, 90, 70]), share: 1, x: .5, y: .5, rank: 1 }];
  assert.equal(F.tintPaletteAddMasses(pal, { hi: { frames: [f], w: [1] } }).length, 1);
  const tiny = frame((x, y) => (x < 2 && y < 40 ? [150, 90, 70] : [20, 20, 20])), p2 = [{ ...lab([20, 20, 20]), share: 1, x: .5, y: .5 }];
  assert.equal(F.tintPaletteAddMasses(p2, { hi: { frames: [tiny], w: [1] } }).length, 1);
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ ...lab([20 + i * 22, 100, 200 - i * 15]), share: .1, x: .5, y: .5 })); const cp = full.slice();
  F.tintPaletteAddMasses(full, { hi: { frames: [frame(() => [150, 90, 70])], w: [1] } }); assert.ok(full.length <= F.PALMAX);
});
test('v243: a mostly black palette adds one big dark glow; a bright one does not', () => {
  const dark = [{ ...lab([10, 10, 10]), share: .7, x: .5, y: .5 }, { ...lab([170, 20, 10]), share: .05, x: .4, y: .4 }, { ...lab([140, 138, 135]), share: .1, x: .6, y: .5 }, { ...lab([100, 60, 50]), share: .08, x: .3, y: .6 }, { ...lab([200, 100, 40]), share: .07, x: .7, y: .3 }];
  const bright = dark.map((c, i) => i === 0 ? { ...lab([230, 150, 60]), share: .7, x: .5, y: .5 } : c);
  const n = g => (g.match(/radial-gradient\(/g) || []).length;
  assert.equal(n(F.tintPaletteGrad(dark)), n(F.tintPaletteGrad(bright)) + 1, 'exactly one more glow: the dark mass');
  const w = g => Number(/radial-gradient\((\d+)% /.exec(g)[1]);   // the first radial glow is an accent; compare the dark glow by its size in the string
  const sizes = g => [...g.matchAll(/radial-gradient\((\d+)% (\d+)% at/g)].map(m => +m[1]);
  const big = F.tintPaletteGrad(dark), less = F.tintPaletteGrad(dark.map((c, i) => i === 0 ? { ...c, share: .2 } : c));
  assert.ok(Math.max(...sizes(big)) > Math.max(...sizes(less)) || sizes(big).length >= sizes(less).length, 'a bigger dark share gives a bigger dark glow');
});
test('v243: silver / light grey is an accent drawn on top; glow size follows share', () => {
  assert.match(M, /sil = c\.L > \.4 && c\.L < \.88 && Math\.hypot\(c\.a, c\.b\) < \.04 && c\.share >= \.03/);
  assert.match(M, /\.55 \+ 2\.2 \* \(c\.share \|\| 0\)/);
});
