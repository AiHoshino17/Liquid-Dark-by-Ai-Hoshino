// v208 extras (owner: black hair, blue earring, purple eye missing from the cover palette): an animated picture may carry up to 2 EXTRA detail colours (PALMAX = 7) on top of the 5 core ones: a big dark mass (hair) that the core palette merged into the background, and a small vivid spot (an earring) whose hue is far from every palette colour and that stays in place over many frames.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteAuto, tintPaletteAddExtras, tintPaletteGrad, tintPaletteAddIris, mixToLab, PALN, PALMAX, PALSLOTS };')();
const pic = fn => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...fn(x, y), 255], (y * HI + x) * 4); return d; };
const BEIGE = [230, 215, 160], WALL = [60, 70, 100], HAIR = [38, 34, 36], EAR = [60, 80, 230];
const scene = (ear = true, hair = true) => pic((x, y) => { if (ear && x >= 60 && x < 64 && y >= 60 && y < 64) return EAR; if (hair && x < 20) return HAIR; return y < 50 ? BEIGE : WALL; });
const animated = fr => { const d = new Uint8ClampedArray(4096); d.hi = { frames: [], w: [], detail: detailFromFrames([fr[0]], [1]), hueFrames: fr, hueW: fr.map(() => 1) }; return d; };
test('v208 extras: constants and wiring', () => {
  assert.equal(F.PALN, 10); assert.equal(F.PALMAX, 10); assert.equal(F.PALSLOTS.length, 10);
  assert.match(M, /tintPaletteAddExtras\(tintPaletteAddEyes\(/);
});
test('v208 extras: a dark hair mass and a vivid stable earring both reach the palette, max PALMAX', () => {
  const p = F.tintPaletteAuto(animated(Array.from({ length: 12 }, () => scene())));
  assert.ok(p.length <= F.PALMAX, 'max 10');
  assert.ok(p.some(c => c.L < .3 && Math.hypot(c.a, c.b) < .08 && c.x < .3), 'dark hair colour on the left');
  assert.ok(p.some(c => Math.hypot(c.a, c.b) > .15 && c.x > .55 && c.y > .55), 'blue earring where it sits');
  assert.ok(F.tintPaletteGrad(p).length > 100, 'gradient builds with the extra colours');
});
test('v208 extras: a spot that moves, or a plain picture, adds nothing', () => {
  const moving = Array.from({ length: 12 }, (_, i) => pic((x, y) => (x >= 10 + i * 5 && x < 14 + i * 5 && y >= 70 && y < 74) ? EAR : (y < 50 ? BEIGE : WALL)));
  const pal = [{ L: .8, a: 0, b: .03, share: .6, x: .5, y: .2, rank: 1 }]; F.tintPaletteAddExtras(pal, moving, HI);
  assert.equal(pal.length, 1);
  const flat = pic(() => [200, 60, 60]); assert.equal(F.tintPaletteAuto(animated(Array.from({ length: 6 }, () => flat))).length, 1);
});
test('v208 extras: a still never has more than PALN colours', () => {
  const d = scene(); const p = F.tintPaletteAuto({ hi: { frames: [d], w: [1], detail: detailFromFrames([d], [1]) } }); assert.ok(p.length <= F.PALN);
});

// iris: a small olive blob next to eye-white at 192 px, in the same place in every frame, is an eye colour; a blob with no white beside it, or one that moves, is not
const pic192 = fn => { const d = new Uint8ClampedArray(192 * 192 * 4); for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) d.set([...fn(x, y), 255], (y * 192 + x) * 4); return d; };
const OLIVE = [90, 95, 40], SKIN = [240, 205, 170], WHITE = [252, 252, 252];
const eyeFrame = (white = true, dx = 0) => pic192((x, y) => { if (x >= 140 + dx && x < 146 + dx && y >= 90 && y < 96) return OLIVE; if (white && x >= 146 + dx && x < 154 + dx && y >= 89 && y < 97) return WHITE; return SKIN; });
test('v208 iris: an olive blob beside eye-white that stays in place is added as an eye colour (and replaces the smallest shade when the palette is full)', () => {
  const pal = [{ L: .8, a: .01, b: .05, share: .8, x: .5, y: .5, rank: 1 }]; F.tintPaletteAddIris(pal, Array.from({ length: 10 }, () => eyeFrame()), 192);
  const e = pal.find(c => c.eye); assert.ok(e, 'iris added'); assert.ok(e.x > .7 && e.x < .78 && e.y > .45 && e.y < .5, 'placed on the iris'); assert.ok(e.L < .5, 'dark olive');
  const full = Array.from({ length: F.PALMAX }, (_, i) => ({ L: .8 - i * .05, a: .02 * i, b: .05 - .01 * i, share: .5 / (i + 1), x: .5, y: .5, rank: i + 1 })); F.tintPaletteAddIris(full, Array.from({ length: 10 }, () => eyeFrame()), 192);
  assert.ok(full.length <= F.PALMAX && full.some(c => c.eye), 'full palette: iris still gets in, never above PALMAX');
});
test('v208 iris: no white beside it, or a moving blob, is not an eye', () => {
  const a = [{ L: .8, a: .01, b: .05, share: .8, x: .5, y: .5, rank: 1 }]; F.tintPaletteAddIris(a, Array.from({ length: 10 }, () => eyeFrame(false)), 192); assert.equal(a.length, 1);
  const b = [{ L: .8, a: .01, b: .05, share: .8, x: .5, y: .5, rank: 1 }]; F.tintPaletteAddIris(b, Array.from({ length: 10 }, (_, i) => eyeFrame(true, -i * 9)), 192); assert.equal(b.length, 1);
});
