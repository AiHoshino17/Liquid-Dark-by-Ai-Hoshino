// palette fix session 4, item 11: the owner's REAL dark-haired portrait (tests/fixtures/yuki-192.b64, the anime girl with purple eyes). MEASURED: black hair 51 % (L .165) and a second dark tone, olive near-black strands 20 % (L .286), both kept; purple eye kept. Guard: never go back to ONE dark blob.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detailFromFrames, HI } from '../src/tintdetail.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto };')(detailFromFrames, HI);
const rgb = Buffer.from(fs.readFileSync(new URL('./fixtures/yuki-192.b64', import.meta.url), 'utf8'), 'base64');
const down = s => { const f = 192 / s, o = new Uint8ClampedArray(s * s * 4); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { for (let c = 0; c < 3; c++) { let t = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) t += rgb[((y * f + j) * 192 + x * f + i) * 3 + c]; o[(y * s + x) * 4 + c] = Math.round(t / (f * f)); } o[(y * s + x) * 4 + 3] = 255; } return o; };
const d = down(32); d.hi = { frames: [down(96)], w: [1], eyeFrames: [down(192)] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]);
const pal = F.tintPaletteAuto(d);
test('v251: dark-haired portrait keeps two separate dark tones (black hair + olive strands)', () => {
  const dk = pal.filter(c => c.L < .32).sort((a, b) => a.L - b.L);
  assert.ok(dk.length >= 2, 'two dark colours'); assert.ok(dk[dk.length - 1].L - dk[0].L >= .08, 'they differ in lightness by >= .08');
  assert.ok(dk[0].share >= .3, 'the black is the main colour');
});
test('v251: dark-haired portrait still has the purple eye colour and a skin tone', () => {
  assert.ok(!pal.some(c => c.eye && (c.share || 0) >= .03), 'session 7: an eye colour is never a 3 %+ colour (here the 3 % skin tone was wrongly adopted as the eye); the purple iris itself is only found at the finer sampling of the harness'); assert.ok(pal.some(c => c.L > .42 && c.L < .62 && Math.hypot(c.a, c.b) > .02), 'a skin colour');
});
