// v254: tintPaletteMultiFrame, the last step for ANIMATED pictures. A two-scene animation (navy wall + olive jacket + pale-blue shirt + white pillow in scene A; olive jacket + brown plaid + white wall in scene B) must keep every big colour (olive, navy, pale blue, white, brown), shares add up to ~100 %, every colour remembers the frame it came from, and a STILL picture is untouched.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteMultiFrame, mixToLab };')(detailFromFrames, HI);
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const NAVY = '#3b4354', OLIVE = '#666849', BLUE = '#d7f2f7', WHITE = '#eceef0', BROWN = '#a78469', SKIN = '#f5d9c6', PLAID = '#d7af8e';
const scene = (s, t, A) => { const a = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = (y * s + x) * 4, u = x / s, v = y / s; let c; if (A) c = u < .5 ? (v < .55 ? NAVY : OLIVE) : (v < .45 ? WHITE : v < .85 ? BLUE : SKIN); else c = v < .5 ? OLIVE : (v < .8 ? (((x >> 2) + (y >> 3)) & 1 ? BROWN : PLAID) : WHITE); const [r, g, b] = hex(c); a[i] = r + (t % 3); a[i + 1] = g; a[i + 2] = b; a[i + 3] = 255; } return a; };
const anim = () => { const N = 24, d = new Uint8ClampedArray(N * 4096), hf = [], ef = []; for (let k = 0; k < N; k++) { const A = k < 12; d.set(scene(32, k, A), k * 4096); hf.push(scene(96, k, A)); ef.push(scene(192, k, A)); } d.fw = Array(N).fill(1); d.hi = { frames: [], w: [], hueFrames: hf, hueW: Array(N).fill(1), eyeFrames: ef }; d.hi.detail = detailFromFrames(hf, Array(N).fill(1)); return d; };
const dist = (c, h) => { const [r, g, b] = hex(h), [L, a, bb] = F.mixToLab(r, g, b); return Math.hypot(c.L - L, c.a - a, c.b - bb); };
test('v254: a two-scene animation keeps olive, navy, pale blue, white and brown (nothing blended away)', () => {
  const pal = F.tintPaletteAuto(anim()); assert.ok(pal.length >= 5 && pal.length <= 10);
  for (const [n, h] of [['navy', NAVY], ['olive', OLIVE], ['pale blue', BLUE], ['white', WHITE], ['brown', BROWN]]) assert.ok(pal.some(c => dist(c, h) < .035), n + ' is missing: ' + pal.map(c => c.L.toFixed(2)).join(' '));
});
test('v254: shares add up to about 100 % and are sorted biggest first; every colour has a frame (fi) and a spot', () => {
  const pal = F.tintPaletteAuto(anim()), sum = pal.reduce((s, c) => s + c.share, 0); assert.ok(Math.abs(sum - 1) < .02, 'sum ' + sum);
  for (let i = 1; i < pal.length; i++) assert.ok(pal[i - 1].share >= pal[i].share - 1e-9);
  for (const c of pal) { assert.ok(Number.isInteger(c.fi) && c.fi >= 0 && c.fi < 24, 'fi ' + c.fi); assert.ok(c.x >= 0 && c.x <= 1 && c.y >= 0 && c.y <= 1); }
});
test('v254: a colour that only exists in the 2nd scene is circled on a frame of that scene, a 1st-scene colour on a frame of the 1st', () => {
  const pal = F.tintPaletteAuto(anim()), pl = pal.find(c => dist(c, PLAID) < .04 || dist(c, BROWN) < .035), nv = pal.find(c => dist(c, NAVY) < .035);
  assert.ok(pl && nv); assert.ok(pl.fi >= 12, 'plaid on frame ' + pl.fi); assert.ok(nv.fi < 12, 'navy on frame ' + nv.fi);
});
test('v254: a STILL picture (1 frame) is untouched by the multi-frame step (no fi)', () => {
  const d = new Uint8ClampedArray(scene(32, 0, true)), f = scene(96, 0, true); d.hi = { frames: [f], w: [1], eyeFrames: [scene(192, 0, true)] }; d.hi.detail = detailFromFrames([f], [1]);
  const pal = F.tintPaletteAuto(d); assert.ok(pal.length >= 2); assert.ok(pal.every(c => c.fi === undefined));
});
test('v254: wiring: tintPaletteAuto ends with the multi-frame step for 2+ kept frames, harness has render_multi.py', () => {
  assert.match(M, /p = tintPaletteMultiFrame\(p, mf, hiW/);   // v260: now a `p = ...` line after `if (!mf) return p;` assert.ok(fs.existsSync(new URL('./palette-harness/render_multi.py', import.meta.url)));
});
