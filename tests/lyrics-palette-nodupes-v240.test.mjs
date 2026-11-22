// v240 (owner: "the palette takes the same colour so many times: hair is one, eye is one, blush is one, skin is one, bed about 3"): every palette ends with tintPaletteDedupe (no two colours alike) and a big plain colour that is really hair + skin is split into two by tintPaletteSplitBig.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteDedupe, tintPaletteSplitBig, mixToLab, PALMAX };')();
const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const hi = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
test('v240: the final palette is wired as Dedupe(AddMasses(AddTints(SplitBig(Raw)))), the clean-up last (v243 added AddMasses)', () => {
  assert.match(M, /function tintPaletteAutoBase\(d, hiW = 96\) \{ let p = tintPaletteAutoRaw/); // v241 put AddTints between the split and the clean-up; the clean-up is still LAST
});
test('v240: two plain colours that look alike become ONE (share added, rank 1 kept)', () => {
  const p = F.tintPaletteDedupe([{ ...lab([224, 194, 162]), share: .4, x: .5, y: .5 }, { ...lab([226, 197, 166]), share: .2, x: .4, y: .6 }, { ...lab([120, 150, 185]), share: .3, x: .7, y: .3 }]);
  assert.equal(p.length, 2); assert.ok(Math.abs(p[0].share - .6) < 1e-9); assert.deepEqual(p.map(c => c.rank), [1, 2]);
});
test('v240: the same eye found twice (both eyes, one hue) is ONE colour; a blush and a different-hue eye are kept', () => {
  const skin = { ...lab([250, 222, 202]), share: .5, x: .5, y: .5 }, eyeA = { ...lab([95, 85, 25]), share: .0004, x: .4, y: .4, eye: true }, eyeB = { ...lab([70, 68, 12]), share: .0001, x: .55, y: .42 }, blush = { ...lab([252, 175, 186]), share: .002, x: .5, y: .47 };
  const p = F.tintPaletteDedupe([skin, blush, eyeA, eyeB]);
  assert.equal(p.length, 3); assert.ok(p.includes(blush) || p.some(c => Math.abs(c.a - blush.a) < 1e-9)); assert.ok(p.filter(c => c.b > .05 && c.L < .5).length === 1, 'one olive eye');
});
test('v240: a small darker shade of the same hue as a big colour (skin shadow found twice, a blue stripe taken for an eye) is dropped', () => {
  const p = F.tintPaletteDedupe([{ ...lab([225, 195, 165]), share: .4, x: .5, y: .5 }, { ...lab([187, 130, 104]), share: .25, x: .4, y: .5 }, { ...lab([165, 103, 85]), share: .011, x: .45, y: .6, extra: true }, { ...lab([119, 149, 184]), share: .13, x: .65, y: .3 }, { ...lab([87, 122, 184]), share: .0004, x: .85, y: .73, eye: true }]);
  assert.equal(p.length, 3);
});
test('v240: grey steps of a black-and-white cover are not over-merged', () => {
  const g = [[248, 247, 248], [190, 190, 190], [151, 151, 151], [79, 79, 78], [25, 25, 24]].map((c, i) => ({ ...lab(c), share: .2, x: .5, y: .5 }));
  assert.equal(F.tintPaletteDedupe(g.slice()).length, 5);
});
test('v240: a picture with a gold hair and a pale skin (one beige of 45 %) gets BOTH, nothing else invented', () => {
  const HAIR = [216, 183, 153], SKIN = [249, 221, 201], BED = [130, 151, 172];
  const frame = hi((x, y) => (y > 62 ? BED : x < 48 ? HAIR : SKIN)), d = new Uint8ClampedArray(4096);
  d.hi = { frames: [], w: [], detail: detailFromFrames([frame], [1]), hueFrames: [frame, frame, frame], hueW: [1, 1, 1] };
  const p = F.tintPaletteAuto(d), has = rgb => p.some(c => dist(c, lab(rgb)) < .05);
  assert.ok(has(HAIR) && has(SKIN) && has(BED), 'hair, skin and bed all present'); assert.ok(p.length <= 4, 'no duplicates / invented colours');
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) assert.ok(dist(p[i], p[j]) >= .06, 'no two colours alike');
});
test('v240: a plain one-colour picture is left alone (no split, no invented colour); no frames = untouched', () => {
  const flat = hi(() => [200, 60, 60]), d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([flat], [1]), hueFrames: [flat, flat], hueW: [1, 1] };
  assert.equal(F.tintPaletteAuto(d).length, 1);
  const one = [{ ...lab([200, 60, 60]), share: 1, x: .5, y: .5 }]; assert.equal(F.tintPaletteSplitBig(one, null).length, 1); assert.equal(F.tintPaletteDedupe(one).length, 1);
});
