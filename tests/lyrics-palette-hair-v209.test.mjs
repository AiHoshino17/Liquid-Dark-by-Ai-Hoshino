// v209: the Cover colour palette reads the HAIR itself (top + side bands, warm brown/gold pixels), true colour, at its real place.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddHair, tintPaletteGrad, mixToRgb, PALMAX };')();
const pic = (S, fn) => { const d = new Uint8ClampedArray(S * S * 4); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) d.set([...fn(x, y), 255], (y * S + x) * 4); return d; };
const LIT = [112, 85, 58], SHADE = [66, 52, 36], SKIN = [150, 112, 90], WALL = [20, 45, 75];
const portrait = () => pic(HI, (x, y) => { if (x < 14 || x >= HI - 14) return y % 4 < 2 ? LIT : SHADE; if (y < 22) return (x + y) % 5 < 3 ? LIT : SHADE; return y > 60 && x > 30 && x < 66 ? SKIN : WALL; });
const still = fr => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [fr], w: [1], detail: detailFromFrames([fr], [1]) }; return d; };
test('v209 hair: wired as the LAST palette step and the gradient draws hair without a boost', () => {
  assert.match(M, /tintPaletteAddHair\(tintPaletteAddCoverage\(tintPaletteConsolidate\(p, d, hiW\), fr, fw\), fr, fw\)/);
  assert.match(M, /bo = !c\.hair && cn0 > \.035/);
});
test('v209 hair: the true lit and shaded hair colours are in the palette, at the top / sides where the hair is', () => {
  const p = F.tintPaletteAuto(still(portrait())), h = p.filter(c => c.hair);
  assert.equal(h.length, 2); assert.ok(p.length <= F.PALMAX);
  const near = (c, t) => { const r = F.mixToRgb(c.L, c.a, c.b, 1, 0); return Math.abs(r[0] - t[0]) < 6 && Math.abs(r[1] - t[1]) < 6 && Math.abs(r[2] - t[2]) < 6; };
  assert.ok(h.some(c => near(c, LIT)), 'lit hair exact'); assert.ok(h.some(c => near(c, SHADE)), 'shaded hair exact');
  assert.ok(h.every(c => c.y < .75), 'hair is not placed on the face / chin');
});
test('v209 hair: a picture with no hair (blue wall + skin) gets no hair colour; a flat picture stays one colour', () => {
  const nohair = pic(HI, (x, y) => y > 60 && x > 30 && x < 66 ? SKIN : WALL); assert.equal(F.tintPaletteAuto(still(nohair)).filter(c => c.hair).length, 0);
  assert.equal(F.tintPaletteAuto(still(pic(HI, () => [200, 60, 60]))).length, 1);
});
test('v209 hair: the gradient still builds', () => { assert.match(F.tintPaletteGrad(F.tintPaletteAuto(still(portrait()))), /radial-gradient/); });
test('v209 hair: a full palette never gives up a small vivid colour (blush / olive iris) for hair; the hair glow is a small accent', () => {
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ L: .5, a: .06 + .01 * i, b: .05, share: .02, x: .5, y: .5, rank: i + 1 }));
  const before = JSON.stringify(full.map(c => c.a)); F.tintPaletteAddHair(full, [portrait()], HI);
  assert.equal(JSON.stringify(full.map(c => c.a)), before); assert.equal(full.length, F.PALMAX);
  assert.match(M, /\(acc \|\| c\.hair \|\| c\.cover( \|\| bigV)? \? accL : layers\)\.push\((bigV \? glow\([^)]*\)[^:]*: )?c\.hair \? glow\(c, \.5, '40% 27%'/);   // v269 / v270: the big-vivid branch comes first; the hair glow is unchanged
});
test('v209 hair: the hair spot is a real hair pixel of that colour', () => {
  const h = F.tintPaletteAuto(still(portrait())).filter(c => c.hair); assert.ok(h.every(c => c.x < .15 || c.x > .85 || c.y < .24));
});
