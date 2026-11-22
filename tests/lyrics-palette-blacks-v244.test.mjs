// v244 (owner: "Take My Breath: the black face is small so it still looks light"; "Blinding Lights: black ~5 % of the background vs 28 % in the cover"; "copper on Gasoline still reads red"): (1) a small dark-neutral colour (the face shade) gets its own visible dark glow, (2) the big dark mass falls off more flatly so the black keeps its strength, (3) a mid-tone colour stays on top of the big dark mass (copper was buried under it), (4) the thin-tint step accepts a warm metal up to 5 % of the picture.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteGrad, mixToLab };')();
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const radials = g => [...g.matchAll(/radial-gradient\((\d+)% (\d+)% at (\d+)% (\d+)%/g)].map(m => ({ w: +m[1], x: +m[3], y: +m[4] }));
const base = [{ ...lab([120, 60, 50]), share: .6, x: .5, y: .5 }, { ...lab([170, 90, 70]), share: .2, x: .3, y: .6 }];
test('v244: a small dark-neutral colour (the face shade of Take My Breath) gets its own dark glow at its place', () => {
  const face = { ...lab([58, 52, 46]), share: .06, x: .55, y: .47 };
  const g = F.tintPaletteGrad([...base, face]);
  const r = radials(g).find(q => q.x === 55 && q.y === 47);
  assert.ok(r, 'a glow sits at the face position (55 %, 47 %)'); assert.ok(r.w >= 30 && r.w <= 56, 'small glow: 30 to 56 % wide');
  const none = F.tintPaletteGrad([...base, { ...lab([58, 52, 46]), share: .3, x: .55, y: .47 }]);
  assert.ok(g.length > 0 && none.length > 0);
});
test('v244: a mid-tone colour (copper) is drawn above a big dark mass, so it is not buried', () => {
  const black = { ...lab([8, 8, 8]), share: .7, x: .5, y: .5 };
  const copper = { ...lab([150, 90, 60]), share: .05, x: .4, y: .6 };
  const g = F.tintPaletteGrad([{ ...lab([200, 80, 40]), share: .2, x: .5, y: .5 }, black, copper]);
  const rs = radials(g);
  const small = rs.findIndex(q => q.w <= 60), mass = rs.findIndex(q => q.x === 50 && q.y === 50 && q.w >= 110);
  assert.ok(small >= 0 && mass >= 0, 'a small copper glow and the dark mass glow are both present');
  assert.ok(small < mass, 'the copper glow is listed before (= drawn above) the dark mass');
});
test('v244: the dark mass falls off flatly (keeps its strength over the middle of the glow)', () => {
  assert.match(M, /rgb\(m, \.3, 1, \.88\) \+ ' 45%,'/); assert.match(M, /rgb\(m, \.3, 1, \.42\) \+ ' 75%,'/);
});
test('v244: the dark mass gate stays strict (a dark brown hair is not treated as black)', () => {
  assert.match(M, /dks = pal\.filter\(c => c\.L < \.2 && Math\.hypot\(c\.a, c\.b\) < \.09 && !c\.derived\)/);
});
test('v244: the thin-tint step accepts a warm metal up to 5 % of the picture (was 3 %)', () => {
  assert.match(M, /B\.n \/ B\.fr\.size >= 8 \* sc \* sc && B\.n \/ tot < \.05\)/);
});
