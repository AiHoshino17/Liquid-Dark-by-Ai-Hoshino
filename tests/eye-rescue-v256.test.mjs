// v256 (owner: "eye colours are not picked up" on 3 animated pictures). tintPaletteEyeRescue: ANIMATED pictures only. (a) a WebP of close-up green eyes (a different place in every shot, 3 x bigger than the 17 px eye window) must get a green / yellow-green eye colour, (b) a dark night GIF whose iris has chroma .015-.07 must get its violet eye colour, ON the eye, (c) a still (1 frame) and a plain animation with no eye get nothing from it, (d) wiring.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteEyeRescue };')(detailFromFrames, HI);
const load = (n, k) => { const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/' + n + '.b64', import.meta.url), 'utf8'), 'base64'), P = 192 * 192 * 3;
  const down = (j, s) => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) t += rgb[j * P + ((y * f + b) * 192 + x * f + a) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
  const d = new Uint8ClampedArray(k * 4096); for (let j = 0; j < k; j++) d.set(down(j, 32), j * 4096); d.fw = Array(k).fill(1);
  const hf = Array.from({ length: k }, (_, j) => down(j, 96)); d.hi = { frames: [], w: [], hueFrames: hf, hueW: Array(k).fill(1), eyeFrames: Array.from({ length: k }, (_, j) => down(j, 192)) }; d.hi.detail = detailFromFrames(hf, d.hi.hueW); return d; };
const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
test('v256: close-up green eyes (web47-eyes) get a green / yellow-green eye colour, lighter than the old dark olive', () => {
  const pal = F.tintPaletteAuto(load('web47-eyes-192x6', 6)), eyes = pal.filter(c => c.eye);
  assert.ok(eyes.length >= 1, 'no eye colour: ' + pal.map(c => c.L.toFixed(2)).join(' '));
  const e = eyes[0]; assert.ok(hue(e) > 90 && hue(e) < 135, 'green hue ' + hue(e)); assert.ok(Math.hypot(e.a, e.b) > .08, 'chroma ' + Math.hypot(e.a, e.b)); assert.ok(e.L > .6, 'L ' + e.L);
});
test('v256: the dark night GIF (gif156-night) gets its violet eye colour, on the dark-haired girl\'s eye (upper right), not on the subtitle', () => {
  const pal = F.tintPaletteAuto(load('gif156-night-192x4', 4)), eyes = pal.filter(c => c.eye);
  assert.ok(eyes.length >= 1 && eyes.length <= 2, 'eyes ' + eyes.length); const e = eyes.find(c => !c.dark2) || eyes[0];   // v260: the dark-frame eye (dark2, v259) is a second eye colour by design; the violet one is the first
  assert.ok(hue(e) > 270 && hue(e) < 340, 'violet hue ' + hue(e)); assert.ok(e.x > .55 && e.x < .8 && e.y > .12 && e.y < .4, `on the eye ${e.x},${e.y}`);
});
test('v256: a still (1 eye frame) and an animation with no eye in it get nothing from EyeRescue', () => {
  const d = load('gif156-night-192x4', 4), pal = [{ L: .3, a: 0, b: 0, share: .6 }, { L: .2, a: 0, b: 0, share: .4 }];
  assert.equal(F.tintPaletteEyeRescue(pal.map(c => ({ ...c })), [d.hi.eyeFrames[0]], 192).filter(c => c.eye).length, 0);
  assert.equal(F.tintPaletteEyeRescue(pal.map(c => ({ ...c })), [d.hi.eyeFrames[0], d.hi.eyeFrames[3], d.hi.eyeFrames[0]], 192).filter(c => c.eye).length, 0);   // 3 frames of the sofa / subtitle scene: no face, no eye
});
test('v256: wiring: tintPaletteAuto calls EyeRescue (3+ eye frames) after EyeOne and before MultiFrame; AddEyeRings has the dull mode', () => {
  assert.match(M, /p = tintPaletteEyeOne\(p\); if \(ef && ef\.length >= 3\) p = tintPaletteEyeRescue\(p, ef, 192\); const mf =/);
  assert.match(M, /function tintPaletteAddEyeRings\(pal, frames, W = 192, dull = false\)/);
});
