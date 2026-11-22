// v247: tintPaletteAddMissing (any colour the palette does not represent: a faint blush, a silver sheen, a copper tone, lit skin next to black hair) and tintPaletteTrueTone (an over-vivid accent swatch goes back to the real colour). Pure functions, run on small synthetic 96x96 pictures.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAddMissing, tintPaletteTrueTone, tintPaletteAuto, mixToLab };')();
const HI = 96;
const pic = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const lab = c => F.mixToLab(...c);
const SKIN = [225, 170, 140], HAIR = [25, 22, 20], BLUSH = [212, 140, 140], SILVER = [190, 200, 208], BG = [60, 90, 70];
const base = (x, y) => y < 30 ? HAIR : x < 20 ? BG : SKIN;
const near = (pal, rgb, tol = .06) => { const t = lab(rgb); return pal.some(c => Math.hypot(c.L - t[0], c.a - t[1], c.b - t[2]) < tol); };

test('v247: wired into tintPaletteAuto, TrueTone before Missing, relocate last', () => {
  assert.match(M, /tintPaletteAddMissing\(tintPaletteTrueTone\(/);
});

test('v247: a soft blush patch (1.2 % of the picture) that the palette lacks gets its own pink colour; a palette that already has it gets nothing new', () => {
  const f = pic((x, y) => (x >= 40 && x < 52 && y >= 52 && y < 62) ? BLUSH : base(x, y));
  const pal = [HAIR, BG, SKIN].map((c, i) => { const l = lab(c); return { L: l[0], a: l[1], b: l[2], share: .3, x: .5, y: .5, rank: i + 1 }; });
  F.tintPaletteAddMissing(pal, [f], HI);
  assert.ok(near(pal, BLUSH, .03), 'blush colour added in its true colour');
  const n = pal.length; F.tintPaletteAddMissing(pal, [f], HI); assert.equal(pal.length, n, 'nothing more is added the second time');
});

test('v247: a silver / metal patch (1.5 %) is NOT covered by a pale blue swatch, it gets its own grey-silver colour', () => {
  const f = pic((x, y) => (x >= 60 && x < 76 && y >= 40 && y < 50) ? SILVER : base(x, y));
  const sky = lab([128, 191, 228]);
  const pal = [HAIR, BG, SKIN].map((c, i) => { const l = lab(c); return { L: l[0], a: l[1], b: l[2], share: .3, x: .5, y: .5, rank: i + 1 }; });
  pal.push({ L: sky[0], a: sky[1], b: sky[2], share: .05, x: .5, y: .1, rank: 4 });
  F.tintPaletteAddMissing(pal, [f], HI);
  assert.ok(near(pal, SILVER, .035), 'silver added');
});

test('v247: a 1 px blended edge between two colours is not turned into a colour (thin lines are not areas)', () => {
  const f = pic((x, y) => x === 48 ? [150, 100, 150] : (x < 48 ? [220, 60, 50] : [40, 60, 200]));
  const pal = [[220, 60, 50], [40, 60, 200]].map((c, i) => { const l = lab(c); return { L: l[0], a: l[1], b: l[2], share: .5, x: .5, y: .5, rank: i + 1 }; });
  F.tintPaletteAddMissing(pal, [f], HI); assert.equal(pal.length, 2);
});

test('v247: a full palette (10) drops its least useful colour for a clearly worth-more missing one, and never the first colour', () => {
  const f = pic((x, y) => (x >= 40 && x < 56 && y >= 52 && y < 64) ? BLUSH : base(x, y));
  const cols = [SKIN, HAIR, BG, [225, 172, 142], [226, 168, 138], [224, 171, 141], [24, 22, 20], [26, 21, 21], [62, 90, 70], [58, 92, 68]];
  const pal = cols.map((c, i) => { const l = lab(c); return { L: l[0], a: l[1], b: l[2], share: i < 3 ? .3 : .01, x: .5, y: .5, rank: i + 1 }; });
  const first = pal[0]; F.tintPaletteAddMissing(pal, [f], HI);
  assert.ok(pal.length <= 10); assert.equal(pal[0], first); assert.ok(near(pal, BLUSH, .03));
});

test('v247: TrueTone pulls an over-vivid blush swatch back to the real dusty rose (same hue, less vivid), leaves a swatch that matches real pixels alone', () => {
  const f = pic((x, y) => (x >= 40 && x < 52 && y >= 52 && y < 62) ? BLUSH : base(x, y));
  const b = lab(BLUSH), h = Math.atan2(b[2], b[1]), vivid = { L: b[0], a: Math.cos(h) * .17, b: Math.sin(h) * .17, share: .01, x: .45, y: .6, rank: 1 };
  const s = lab(SKIN), ok = { L: s[0], a: s[1], b: s[2], share: .5, x: .5, y: .5, rank: 2 };
  const before = Math.hypot(vivid.a, vivid.b); F.tintPaletteTrueTone([vivid, ok], [f], HI);
  assert.ok(Math.hypot(vivid.a, vivid.b) < before * .7, 'less vivid'); assert.ok(near([vivid], BLUSH, .05), 'now close to the real blush');
  assert.equal(Math.hypot(ok.a - s[1], ok.b - s[2]) < 1e-9, true);
});

test('v247: a tiny accent is never shown as less than 0.4 % (was 0.0 %)', () => {
  const l = lab(SKIN), pal = [{ L: l[0], a: l[1], b: l[2], share: .0003, x: .5, y: .5, rank: 1, eye: true }];
  F.tintPaletteTrueTone(pal, [pic(base)], HI); assert.ok(pal[0].share >= .004);
});
