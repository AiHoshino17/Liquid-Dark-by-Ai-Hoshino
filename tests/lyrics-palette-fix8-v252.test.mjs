// session 7 (owner: c12 = red-lit blue-haired girl with pink star eyes: "too much green, no purple / pink at all, the eyes and the ear are missing"). Before: the eye colour was a dull maroon taken from the red hair rim next to the ear (a lone spot beat the real irises on pixel count), 3 of 10 colours were greens (teal + bright green + dark green, stacked on the left edge, 39 % of the picture). Now: a LEVEL, matching pair of spots (the two irises) outranks a lone look-alike, the iris pixel count is capped, and one hue family may not stack 3 colours on one spot.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteGrad, tintPaletteFamilyCap };')(detailFromFrames, HI);
const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/c12-pink-eyes-192.b64', import.meta.url), 'utf8'), 'base64');
const down = s => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) t += rgb[((y * f + j) * 192 + x * f + i) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
const d = down(32); d.hi = { frames: [down(96)], w: [1], eyeFrames: [down(192)] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]);
const pal = F.tintPaletteAuto(d), hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
test('session 7: c12 eye colour is the pink iris (not the dark red hair rim) and both eyes are circled', () => {
  const e = pal.find(c => c.eye); assert.ok(e, 'an eye colour'); assert.ok((hue(e) > 325 || hue(e) < 12) && e.L > .5, 'pink, light: hue ' + hue(e) + ' L ' + e.L);
  assert.ok(e.x2 != null, 'second eye spot'); assert.ok(Math.abs(e.y - e.y2) < .04, 'the two eyes are level');
  assert.ok(e.y > .25 && e.y < .45 && Math.min(e.x, e.x2) > .3 && Math.max(e.x, e.x2) < .7, 'on the face: ' + [e.x, e.y, e.x2, e.y2]);
});
test('session 7: c12 keeps at most 2 greens (they were 3 stacked on the left edge)', () => {
  const g = pal.filter(c => Math.hypot(c.a, c.b) >= .04 && hue(c) >= 120 && hue(c) < 200); assert.ok(g.length <= 2, 'greens: ' + g.length);
  assert.ok(pal.some(c => Math.hypot(c.a, c.b) >= .085 && hue(c) >= 120 && hue(c) < 200), 'a vivid teal / green is still there');
});
test('session 7: tintPaletteFamilyCap only merges STACKED vivid duplicates of a big green / blue / violet family', () => {
  const mk = (L, a, b, share, x, y, o = {}) => ({ L, a, b, share, x, y, ...o });
  const far = [mk(.5, 0, 0, .3, .5, .5), mk(.6, -.12, .1, .12, .1, .1), mk(.6, -.1, 0, .05, .9, .9), mk(.6, -.11, .05, .04, .5, .1), mk(.3, .05, .02, .2, .5, .5), mk(.2, 0, 0, .1, .5, .5)];
  const before = far.length; assert.equal(F.tintPaletteFamilyCap(far.map(c => ({ ...c }))).length, before, 'far-apart colours of one hue family are all kept');
  const stack = [mk(.5, 0, 0, .3, .5, .5), mk(.45, -.12, .1, .3, .12, .5), mk(.6, -.1, 0, .05, .19, .59), mk(.6, -.11, .09, .04, .08, .51), mk(.3, .05, .02, .2, .5, .5), mk(.2, 0, 0, .1, .5, .5)];
  assert.equal(F.tintPaletteFamilyCap(stack).length, 5, 'the smaller of two stacked vivid look-alikes is merged');
});
test('session 7: wiring (FamilyCap after DropBlends, before Relocate; strict eye pair x12; iris count capped)', () => {
  assert.match(M, /tintPaletteRelocate\(tintPaletteFamilyCap\(tintPaletteDropBlends\(tintPaletteAddVivid\(p, fr, fw\)\)\), fr, fw\); if \(ef\) p = tintPaletteAddEyeRings/);
  assert.match(M, /Math\.min\(g\.iris \|\| 0, 100 \* sc \* sc\)/); assert.match(M, /if \(g\.sp\) g\.score \*= 4/);
});
test('session 7: no false eye - a big colour is never adopted as the eye, a lone spot needs a clear face', () => {
  assert.match(M, /same >= 0 && \(pal\[same\]\.share \|\| 0\) >= \.03\) continue/); assert.match(M, /if \(!g\.sp && \(g\.skin \|\| 0\) < \.30\) continue/);
  assert.match(M, /hd\(hueDeg\(q\.a, q\.b\), hc\) < 20 && Math\.abs\(q\.L - c\.L\) < \.15\)\) continue/);
  assert.ok(!pal.some(c => c.eye && (c.share || 0) >= .03), 'c12: no big colour flagged as the eye');
});
test('session 7: tintPaletteEyeOne keeps ONE eye colour (both eyes of a face are one colour; a non-warm one wins)', () => {
  const ev = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteEyeOne };')(detailFromFrames, HI);
  const mk = (L, a, b, share, o = {}) => ({ L, a, b, share, ...o });
  const pal2 = [mk(.3, 0, 0, .5), mk(.5, .02, .02, .3), mk(.45, -.01, .07, .004, { eye: true }), mk(.45, .07, .07, .004, { eye: true }), mk(.8, 0, 0, .2), mk(.2, 0, 0, .1)];
  const out = ev.tintPaletteEyeOne(pal2.map(c => ({ ...c })));
  assert.equal(out.filter(c => c.eye).length, 1, 'one eye colour'); assert.ok(out.find(c => c.eye).b > 0 && out.find(c => c.eye).a < 0, 'the olive (non-warm) one stays'); assert.equal(out.length, 5, 'the tiny false one is removed');
  const same = [mk(.3, 0, 0, .5), mk(.5, .02, .02, .3), mk(.55, .09, -.02, .004, { eye: true }), mk(.6, .1, -.03, .004, { eye: true }), mk(.8, 0, 0, .2), mk(.2, 0, 0, .1)];
  assert.equal(ev.tintPaletteEyeOne(same.map(c => ({ ...c }))).filter(c => c.eye).length, 2, 'two pink look-alikes (one hue) are both kept');
});
