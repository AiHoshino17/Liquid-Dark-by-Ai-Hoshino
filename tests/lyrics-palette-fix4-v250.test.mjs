// v250 palette fix session 3, item 12: the palette code on ANIMATED input (all frames at 32 px + 24 kept at 96 / 192 px) does not throw and gives a palette + gradient.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteGrad };')(detailFromFrames, HI);
const pic = (s, t) => { const a = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const i = (y * s + x) * 4, bg = x < s / 2; a[i] = bg ? 200 : 30 + t; a[i + 1] = bg ? 60 : 40; a[i + 2] = bg ? 90 : 150; a[i + 3] = 255; } return a; };
test('v250: animated input (24 frames) gives a palette and a gradient without throwing', () => {
  const N = 24, d = new Uint8ClampedArray(N * 4096), hf = [], ef = [];
  for (let k = 0; k < N; k++) { d.set(pic(32, k), k * 4096); hf.push(pic(96, k)); ef.push(pic(192, k)); }
  d.fw = Array(N).fill(1); d.hi = { frames: [], w: [], hueFrames: hf, hueW: Array(N).fill(1), eyeFrames: ef }; d.hi.detail = detailFromFrames(hf, Array(N).fill(1));
  const pal = F.tintPaletteAuto(d); assert.ok(pal.length >= 2 && pal.length <= 10);
  assert.ok(pal.every(c => Number.isFinite(c.L) && Number.isFinite(c.a) && Number.isFinite(c.b)));
  const css = F.tintPaletteGrad(pal); assert.ok(typeof css === 'string' && css.includes('radial-gradient') && !/NaN/.test(css));
});
test('v250: the animated harness files exist (prep_anim.py, run_anim.mjs)', () => {
  for (const f of ['prep_anim.py', 'run_anim.mjs']) assert.ok(fs.existsSync(new URL('./palette-harness/' + f, import.meta.url)), f);
});
