// v241 (owner: "the thin turquoise line at the left and right edge of the bed is missing; fix small details like that; fix Canvas and everything else"): tintPaletteAddTints finds a thin / pale / edge tint into a FREE slot; a Canvas video keeps real frames like a GIF.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddTints, mixToLab, PALMAX };')();
const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const hi = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
const WHITE = [232, 238, 241], BLUE = [130, 151, 172], SKIN = [249, 221, 201], CYAN = [190, 240, 236];
const scene = hi((x, y) => (x < 2 || x > 93) && y > 8 && y < 60 ? CYAN : y > 66 ? BLUE : x < 48 ? WHITE : SKIN);   // 2 px pale turquoise stripes on BOTH edges
const still = () => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [scene], w: [1], detail: detailFromFrames([scene], [1]) }; return d; };
const anim = () => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([scene, scene], [1, 1]), hueFrames: [scene, scene, scene], hueW: [1, 1, 1] }; return d; };
test('v241: wired after the split, before the clean-up', () => {
  assert.match(M, /function tintPaletteAutoBase\(d, hiW = 96\) \{ let p = tintPaletteAutoRaw/); 
});
test('v241: a thin pale turquoise stripe on the left and right edge gets its own colour (still and animated)', () => {
  for (const mk of [still, anim]) { const p = F.tintPaletteAuto(mk()); assert.ok(p.some(c => { const h = hueOf(c); return h > 170 && h < 215 && Math.hypot(c.a, c.b) > .05; }), 'turquoise present'); assert.ok(p.length <= F.PALMAX); }
});
test('v241: no two colours alike after the tint step; the stripe does not replace anything (free slots only)', () => {
  const p = F.tintPaletteAuto(anim()); for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) assert.ok(dist(p[i], p[j]) >= .06);
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ ...lab([20 + i * 22, 100, 200 - i * 15]), share: .1, x: .5, y: .5 })); assert.equal(F.tintPaletteAddTints(full, still()).length, F.PALMAX);
});
test('v241: a picture with no off-palette tint gets nothing added; a shade of an existing colour is not added', () => {
  const flat = hi((x, y) => (y > 66 ? BLUE : x < 48 ? WHITE : SKIN)), d = new Uint8ClampedArray(4096); d.hi = { frames: [flat], w: [1], detail: detailFromFrames([flat], [1]) };
  assert.equal(F.tintPaletteAuto(d).length, 3);
  const shade = hi((x, y) => (x < 2 && y > 8 && y < 60 ? [138, 160, 181] : y > 66 ? BLUE : x < 48 ? WHITE : SKIN)), d2 = new Uint8ClampedArray(4096); d2.hi = { frames: [shade], w: [1], detail: detailFromFrames([shade], [1]) };
  assert.equal(F.tintPaletteAuto(d2).length, 3);
});
test('v241: a Canvas video keeps up to 24 real frames (96 px and 192 px) like a GIF, so it gets the same palette steps', () => {
  const V = M.slice(M.indexOf('function tintVideoPx('), M.indexOf('async function tintPixels('));
  assert.match(V, /hf = \[\], hw = \[\], ef = \[\]/); assert.match(V, /Math\.min\(nF, 24\)/); assert.match(V, /j\.hi\.hueFrames = hf; j\.hi\.hueW = hw; j\.hi\.eyeFrames = ef/); assert.match(V, /tintGrabHi\(v, 192\)/);
});
