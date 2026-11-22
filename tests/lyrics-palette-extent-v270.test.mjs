// v270 (owner, Starboy screenshot: "the gradient is showing up wrong" - a purple / magenta smear, the yellow title only in a corner, a teal glow at the bottom). tintPaletteExtent measures where each colour's pixels really are (mean place + spread, and both sides for a background around a centred figure); tintPaletteGrad draws a big chromatic colour at that place and size. Palette colours / shares are NOT changed.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteExtent, tintPaletteGrad, mixToLab };')();
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const frame = fn => { const d = new Uint8ClampedArray(96 * 96 * 4); for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) d.set([...fn(x, y), 255], (y * 96 + x) * 4); return d; };
// a Starboy-like cover: a yellow title band (top), a red background on both sides, a blue figure in the middle, a near-black bottom
const Y = [231, 186, 14], R = [203, 12, 56], B = [14, 59, 160], K = [22, 6, 15];
const f = frame((x, y) => (y < 16 ? Y : y > 70 ? K : x > 30 && x < 66 ? B : R));
const mk = () => [{ ...lab(K), share: .26, x: .5, y: .85 }, { ...lab(R), share: .33, x: .5, y: .3 }, { ...lab(Y), share: .17, x: .5, y: .1 }, { ...lab(B), share: .24, x: .45, y: .2 }];
const d = Object.assign(new Uint8ClampedArray(4096 * 4), { hi: { frames: [f], w: [1] } });
test('v270: wired last in tintPaletteAuto', () => { assert.match(M, /function tintPaletteAuto\(d, hiW = 96\) \{ return tintPaletteExtent\(/); });
test('v270: the extent step adds place + spread and changes no colour or share', () => {
  const pal = mk(), before = JSON.stringify(pal.map(c => [c.L, c.a, c.b, c.share, c.x, c.y]));
  F.tintPaletteExtent(pal, d);
  assert.equal(JSON.stringify(pal.map(c => [c.L, c.a, c.b, c.share, c.x, c.y])), before);
  const yel = pal[2]; assert.ok(yel.gy < .12 && yel.sx > .25 && yel.sy < .06, 'yellow = a wide flat band at the top');
  assert.equal(yel.sides, null, 'a full-width band is NOT split in two');
  const red = pal[1]; assert.ok(red.sides && red.sides[0].x < .25 && red.sides[1].x > .75, 'the red background sits on both sides of the figure');
  const blue = pal[3]; assert.ok(Math.abs(blue.gx - .5) < .03 && blue.gy > .35 && blue.gy < .6, 'blue = the figure in the middle');
});
test('v270: the gradient draws the yellow as a top band, the red on both sides, the blue in the middle (no blue-over-red at the top)', () => {
  const g = F.tintPaletteGrad(F.tintPaletteExtent(mk(), d)), rg = g.split('radial-gradient(').slice(1);
  const at = rg.map(s => { const m = s.match(/^(\d+)% (\d+)% at (\d+)% (\d+)%,rgba\((\d+),(\d+),(\d+)/); return m && m.slice(1).map(Number); }).filter(Boolean);
  const yel = at.find(a => a[4] > 200 && a[5] > 150 && a[6] < 90); assert.ok(yel && yel[3] < 15 && yel[0] >= 80 && Math.abs(yel[2] - 50) < 5, 'yellow: wide, centred, at the top');
  const reds = at.filter(a => a[4] > 180 && a[5] < 40 && a[6] < 100); assert.ok(reds.some(a => a[2] < 25) && reds.some(a => a[2] > 75), 'red glows on the left AND the right');
  const blue = at.find(a => a[6] > 180 && a[4] < 60); assert.ok(blue && Math.abs(blue[2] - 50) < 6 && blue[3] > 30, 'blue glows in the middle, not at the top');
  assert.ok(g.indexOf(',rgba(' + yel.slice(4, 7).join(',')) < g.indexOf(',rgba(' + blue.slice(4, 7).join(',')) && g.indexOf(',rgba(' + blue.slice(4, 7).join(',')) < g.indexOf(',rgba(' + reds[0].slice(4, 7).join(',')), 'compact areas on top: band, then figure, then background');
});
test('v270: a palette without extent fields still makes a gradient (old path)', () => { assert.ok(F.tintPaletteGrad(mk()).startsWith('linear-gradient')); });
// v271 (owner: "fix it for all, custom GIFs and pictures, and make sure it captures small details too, like the eyes and hair colour")
const glows = g => g.split('radial-gradient(').slice(1).map(s => { const m = s.match(/^(\d+)% (\d+)% at (\d+)% (\d+)%,rgba\((\d+),(\d+),(\d+)/); return m && m.slice(1).map(Number); });
const busy = () => [{ ...lab([60, 55, 70]), share: .5, x: .5, y: .5 }, { ...lab([210, 160, 120]), share: .3, x: .3, y: .3, vivid: true }, { ...lab([200, 150, 110]), share: .15, x: .7, y: .2, vivid: true }, { ...lab([150, 60, 170]), share: .01, x: .42, y: .38, eye: true }, { ...lab([235, 80, 120]), share: .004, x: .55, y: .6, gx: .55, gy: .6, sx: .03, sy: .03 }];
test('v271: the smallest details (eye, blush) are drawn ON TOP of the bigger accent glows', () => {
  const at = glows(F.tintPaletteGrad(busy())), i = k => at.findIndex(a => a && Math.abs(a[2] - k[0]) <= 1 && Math.abs(a[3] - k[1]) <= 1);
  const eye = i([42, 38]), blush = i([55, 60]); assert.ok(eye > -1 && blush > -1, 'eye and blush glow at their own spots');
  const big = at.findIndex((a, j) => a && j !== eye && j !== blush && a[4] > 180 && a[5] > 120); assert.ok(big === -1 || (blush < big && eye < big), 'both are above the big accent glows');
});
test('v271: an eye keeps its real colour in the gradient (not greyed to chroma .07)', () => {
  const pal = busy(), g = F.tintPaletteGrad(pal), e = glows(g).find(a => a && a[2] === 42 && a[3] === 38); assert.ok(e, 'eye glow');
  assert.ok(e[6] - e[5] > 60 && e[4] - e[5] > 30, 'the eye glow is clearly purple, rgb ' + e.slice(4).join(','));
});
test('v271: a mid-size colour that sits in one area glows there, a spread-out one keeps its corner slot', () => {
  const pal = [{ ...lab([40, 40, 40]), share: .6, x: .5, y: .5, gx: .5, gy: .5, sx: .3, sy: .3 }, { ...lab([120, 90, 60]), share: .2, x: .2, y: .1, gx: .3, gy: .12, sx: .12, sy: .06 }, { ...lab([90, 110, 90]), share: .2, x: .5, y: .5, gx: .5, gy: .5, sx: .3, sy: .3 }];
  const at = glows(F.tintPaletteGrad(pal)); assert.ok(at.some(a => a && a[2] === 30 && a[3] === 12), 'the compact brown glows at its area (30 %, 12 %)');
});
// v276 (owner: "why Starboy got a small orb"): a TINY colour (< 1 %) whose pixels are thin LINES (a rim light) is drawn soft; a solid small object keeps its bright glow
test('v276: a thin rim-light colour is a soft glow, a solid small object is not', () => {
  const T = { ...lab([48, 191, 201]), share: .004, x: .81, y: .41, gx: .81, gy: .41, sx: .05, sy: .1 }, base = () => [{ ...lab(K), share: .6, x: .5, y: .8 }, { ...lab(R), share: .396, x: .5, y: .3 }];
  const al = g => { const m = g.match(/radial-gradient\(\d+% \d+% at 81% 41%,rgba\((\d+),(\d+),(\d+),([\d.]+)\)/); return m && m.slice(1).map(Number); };
  const thin = al(F.tintPaletteGrad([...base(), { ...T, solid: .19 }])), solid = al(F.tintPaletteGrad([...base(), { ...T, solid: .8 }]));
  assert.ok(thin && solid); assert.ok(thin[3] < solid[3], 'thin glow is fainter'); assert.ok(Math.abs(thin[1] - thin[0]) + Math.abs(thin[2] - thin[0]) < Math.abs(solid[1] - solid[0]) + Math.abs(solid[2] - solid[0]), 'and less vivid');
});
