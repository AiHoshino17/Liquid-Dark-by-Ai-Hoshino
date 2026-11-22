// v245 (owner: "Starboy only has yellow, red, blue, light blue and black"; "it takes the skin colour so many times and misses the black hair"): the last palette step merges same-family shades only when the picture stays as well represented, keeps small different-hue details, and makes the biggest plain colour the primary.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteConsolidate, mixToLab };')();
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const frame = fn => { const d = new Uint8ClampedArray(96 * 96 * 4); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) d.set([...fn(x, y), 255], (y * 96 + x) * 4); return d; };
const pc = (rgb, share, x = .5, y = .5, extra = {}) => ({ ...lab(rgb), share, x, y, ...extra });
test('v245: wired last in tintPaletteAuto', () => { assert.match(M, /tintPaletteAddCoverage\(tintPaletteConsolidate\(p, d, hiW\), fr, fw\)/); });
test('v245: two shades of one skin (same hue, close chroma) become one colour when the picture is still covered', () => {
  const SKIN = [150, 120, 100], SHADOW = [146, 117, 97];   // a skin shadow: the same hue, a little darker
  const f = frame((x, y) => (x < 48 ? SKIN : SHADOW));
  const pal = [pc(SKIN, .5, .3, .5), pc(SHADOW, .45, .7, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.length, 1, 'the two skin shades are one colour');
  assert.ok(Math.abs(pal[0].share - .95) < .01, 'the share is kept (summed)');
});
test('v245: a real different object (black hair beside skin) is NOT merged into the skin', () => {
  const SKIN = [150, 120, 100], HAIR = [14, 14, 12];
  const f = frame((x, y) => (x < 40 ? HAIR : SKIN));
  const pal = [pc(SKIN, .6, .6, .5), pc(HAIR, .4, .2, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.length, 2, 'the black hair stays');
  assert.ok(pal.some(c => c.L < .25), 'a dark colour is still in the palette');
});
test('v245: two near-blacks of one picture become one black, two different-hue colours stay', () => {
  const B1 = [18, 10, 14], B2 = [12, 10, 18], RED = [200, 20, 50];   // two near-blacks
  const f = frame((x, y) => (x < 30 ? B1 : x < 60 ? B2 : RED));
  const pal = [pc(RED, .3, .8, .5), pc(B1, .35, .2, .5), pc(B2, .25, .5, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.filter(c => c.L < .25).length, 1, 'one black');
  assert.ok(pal.some(c => Math.hypot(c.a, c.b) > .15 && c.L > .4), 'the red stays');
});
test('v245: a small detail of another hue (a mauve iris) is kept; a tiny look-alike of a big colour is dropped', () => {
  const RED = [170, 60, 40], MAUVE = [150, 80, 110], BIG = [200, 40, 30];
  const f = frame((x, y) => (x < 4 ? MAUVE : BIG));
  const pal = [pc(BIG, .97, .5, .5), pc(MAUVE, .03, .05, .5), pc(RED, .005, .9, .9)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.ok(pal.some(c => hueOf(c) > 300 || hueOf(c) < 5 && Math.hypot(c.a, c.b) > .05 && c.share > .01), 'the mauve iris stays');
});
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
test('v245: the biggest plain colour becomes the primary when it covers a real part of the picture', () => {
  const RED = [220, 60, 60], BLACK = [12, 12, 12];
  const f = frame((x, y) => (x < 70 ? BLACK : RED));
  const pal = [pc(RED, .12, .5, .5), pc(BLACK, .7, .5, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal[0].L < .25, true, 'the black is rank 1');
  assert.equal(pal[0].rank, 1);
});
test('v245b: two colours of one hue family that cover the same part of the picture are one repeat and merge', () => {
  const R1 = [200, 40, 40], R2 = [192, 37, 40];
  const f = frame((x, y) => (x < 48 ? R1 : R2));
  const pal = [pc(R1, .5, .3, .5), pc(R2, .45, .7, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.length, 1, 'the two reds are one colour');
});
test('v245b: the repeat rule never removes a colour of another hue (a blush beside a red stays)', () => {
  const R = [200, 40, 40], BL = [230, 150, 170];
  const f = frame((x, y) => (x < 48 ? R : BL));
  const pal = [pc(R, .6, .3, .5), pc(BL, .4, .7, .5)];
  F.tintPaletteConsolidate(pal, { hi: { frames: [f], w: [1] } });
  assert.equal(pal.length, 2);
});
const F2 = new Function(blk + ';return { tintPaletteAddGaps, tintPaletteAuto, tintPaletteConsolidate, mixToLab };')();
test('v246: a mid-tone between two palette colours (hair brown between skin and dark) is added in its own colour', () => {
  const SKIN = [190, 160, 130], DARK = [40, 36, 30], HAIR = [100, 75, 50];
  const f = frame((x, y) => (x < 30 ? DARK : x < 60 ? HAIR : SKIN));
  const pal = [pc(SKIN, .5, .8, .5), pc(DARK, .2, .1, .5)];
  F2.tintPaletteAddGaps(pal, { hi: { frames: [f], w: [1] } }, 96);
  assert.ok(pal.some(c => c.gap && c.L > .3 && c.L < .5), 'a hair-brown colour was added');
});
test('v246: a gap colour survives the clean-up and the consolidate step', () => {
  const SKIN = [190, 160, 130], DARK = [40, 36, 30], HAIR = [100, 75, 50];
  const f = frame((x, y) => (x < 30 ? DARK : x < 60 ? HAIR : SKIN));
  const p = F2.tintPaletteAuto({ hi: { frames: [f], w: [1] } }, 96);
  assert.ok(p.some(c => c.L > .3 && c.L < .5 && Math.hypot(c.a, c.b) > .02), 'hair brown is still in the final palette');
});
test('v246: the steps run in order (gap step before the clean-up and consolidate)', () => {
  assert.match(M, /function tintPaletteAutoBase\(d, hiW = 96\) \{ let p = tintPaletteAutoRaw\(d, hiW\); p = tintPaletteSplitBig\(p, d, hiW\); p = tintPaletteAddTints\(p, d, hiW\); p = tintPaletteAddMasses\(p, d, hiW\); p = tintPaletteAddGaps\(p, d, hiW\); p = tintPaletteDedupe\(p\); const fr0 = /);
});
