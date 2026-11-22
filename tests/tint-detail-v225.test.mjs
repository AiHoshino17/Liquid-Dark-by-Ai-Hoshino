// v225: detail pass for the cover colour mix (faint blush / small accents), hue-aware cells, smart GIF frame picking.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HI, detailFromFrames, detailAccumulator, pickCandidates, pickKeyFrames, frameSig, toLabPlanes } from '../src/tintdetail.js';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));

const hi = f => { const d = new Uint8ClampedArray(HI * HI * 4); for (let y = 0; y < HI; y++) for (let x = 0; x < HI; x++) d.set([...f(x, y), 255], (y * HI + x) * 4); return d; };
const lo = h => { const o = new Uint8ClampedArray(4096), st = HI / 32; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const s = [0, 0, 0]; for (let j = 0; j < st; j++) for (let i = 0; i < st; i++) { const q = ((y * st + j) * HI + x * st + i) * 4; s[0] += h[q]; s[1] += h[q + 1]; s[2] += h[q + 2]; } o.set([s[0] / (st * st), s[1] / (st * st), s[2] / (st * st), 255], (y * 32 + x) * 4); } return o; };   // what the 32x32 grab sees: every 3x3 block averaged
const SKIN = [235, 192, 172], HAIR = [226, 170, 96], PINK = [244, 176, 186];
const face = (blush) => hi((x, y) => blush && x >= 40 && x < 44 && y >= 41 && y < 45 ? PINK : (x - 48) ** 2 + (y - 48) ** 2 < 34 * 34 ? SKIN : HAIR);   // a skin-coloured face on hair; the blush is 16 pixels = 0.17% of the picture
const dfr = (f, w, N = 6) => detailFromFrames(f, w, HI, N);   // the cell tests below use the 6x6 grid; the mesh uses the default 12x12 snapshot grid
const hueDeg = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
const at = (o, u, v, W = 30, H = 64) => { const i = (Math.min(H - 1, Math.floor(v * H)) * W + Math.min(W - 1, Math.floor(u * W))) * 4; return [o[i], o[i + 1], o[i + 2]]; };

test('a blush (0.17% of the picture, hue far from the skin) is found as an accent in its cell; a plain face has none', () => {
  const k = 2 * 6 + 2, d = dfr([face(true)], [1]), p = dfr([face(false)], [1]);
  assert.ok(d.acc.cov[k] > .01, 'blush cell coverage ' + d.acc.cov[k]);
  const h = hueDeg(d.acc.a[k], d.acc.b[k]); assert.ok(h < 25 || h > 345, 'pink, not skin (38 deg): ' + h);
  for (let c = 0; c < 36; c++) assert.ok(p.acc.cov[c] < .004, 'no accent on a plain face, cell ' + c + ': ' + p.acc.cov[c]);
});
test('big flat areas are NOT accents: wide blue stripes on white', () => {
  const d = dfr([hi(x => (x >> 4) % 2 ? [255, 255, 255] : [125, 150, 185])], [1]);
  for (let c = 0; c < 36; c++) assert.ok(d.acc.cov[c] < .004, 'stripe accent cell ' + c + ': ' + d.acc.cov[c]);
});
test('thin lines are NOT accents (a 1 px coloured hair strand on skin)', () => {
  const d = dfr([hi((x, y) => x === 48 ? [200, 60, 90] : SKIN)], [1]); for (let c = 0; c < 36; c++) assert.ok(d.acc.cov[c] < .004, 'line accent: ' + d.acc.cov[c]);
});
test('dominant colour is the biggest hue family of the cell, not an average: blue + orange stays blue or orange, never grey-tan', () => {
  const d = dfr([hi((x, y) => (x % 8) < 5 ? [60, 95, 190] : [235, 140, 40])], [1]);
  for (let c = 0; c < 36; c++) { const ch = Math.hypot(d.dom.a[c], d.dom.b[c]), h = hueDeg(d.dom.a[c], d.dom.b[c]); assert.ok(ch > .08, 'strong colour, cell ' + c + ': ' + ch); assert.ok(Math.abs(h - 265) < 30 || Math.abs(h - 60) < 30, 'blue (~265) or orange (~60), got ' + h); }
});
test('GIF frame choice: all frames of a short GIF; up to 40 spread over the WHOLE run of a long one (3 minutes at 25 fps = 4500 frames)', () => {
  assert.deepEqual(pickCandidates(12, 40), Array.from({ length: 12 }, (_, i) => i)); assert.deepEqual(pickCandidates(0), []); assert.deepEqual(pickCandidates(1), [0]);
  const c = pickCandidates(4500, 40); assert.equal(c.length, 40); assert.ok(c[0] < 4500 / 40 && c[39] > 4500 - 4500 / 40, 'covers start and end: ' + c[0] + '..' + c[39]);
  assert.ok(c.every((v, i) => !i || v > c[i - 1]) && c.every(v => v >= 0 && v < 4500), 'increasing and in range');
});
test('key frames: two scenes of 30 and 10 frames -> two frames weighted 30 and 10; a still-looking GIF -> one frame; durations count', () => {
  const sc = (r, g, b) => frameSig(hi(() => [r, g, b])), A = sc(200, 40, 40), B = sc(40, 60, 200);
  const k = pickKeyFrames([...Array(30).fill(A), ...Array(10).fill(B)], 12); assert.equal(k.length, 2); assert.deepEqual(k.map(x => x.w).sort((x, y) => x - y), [10, 30]);
  assert.deepEqual(pickKeyFrames(Array(20).fill(A), 12).map(x => x.w), [20]);
  const kw = pickKeyFrames([A, A, B], 12, .02, [1, 1, 8]); assert.deepEqual(kw.map(x => x.w).sort((x, y) => x - y), [2, 8]);
  assert.deepEqual(pickKeyFrames([], 12), []); assert.equal(pickKeyFrames([A, B, A], 12).length, 2, 'two almost identical frames are one');
  const many = Array.from({ length: 40 }, (_, i) => sc(i * 6, 255 - i * 6, (i * 37) % 255)); assert.ok(pickKeyFrames(many, 12).length <= 12);
});
test('weights: a frame that stands for more of the animation counts more in the detail', () => {
  const a = face(true), b = face(false), k = 2 * 6 + 2;
  const heavy = dfr([a, b], [1, 9]), light = dfr([a, b], [9, 1]); assert.ok(light.acc.cov[k] > heavy.acc.cov[k] * 3, 'blush frame weight ' + light.acc.cov[k] + ' vs ' + heavy.acc.cov[k]);
});
test('safe on bad input: empty / short / transparent frames', () => {
  assert.equal(detailFromFrames([], []), null); assert.equal(detailFromFrames([new Uint8ClampedArray(10)], [1]), null);
  const t = detailFromFrames([new Uint8ClampedArray(HI * HI * 4)], [1]); assert.ok(t === null || t.acc.cov.every(v => v === 0));
  assert.equal(toLabPlanes(new Uint8ClampedArray(HI * HI * 4)).L.length, HI * HI);
});
test('wiring in src/main.js: 96 px grab with stepwise halving, EVERY frame of a GIF read (v230: no caps) and fed one at a time, frames carry their time on screen, stills and videos too, detail given to the mesh', () => {
  assert.match(M, /import \{ HI as DET_HI, detailFromFrames, detailAccumulator \} from '\.\/tintdetail\.js'/);
  assert.match(M, /function tintGrabHi\(el(, S = DET_HI)?\)[\s\S]*?while \(w > (S|DET_HI) \* 2/);   // v208: S = the side (96 for the detail pass, 192 for the iris check)
  assert.match(M, /for \(let i = 0; i < n; i\+\+\) \{\s*if \(stale && stale\(\)\) return null;/); assert.match(M, /image\.duration/);
  assert.match(M, /acc\.add\(tintGrabHi\(image\), w\)/); assert.match(M, /out\.hi = \{ frames: \[\], w: \[\], detail: acc\.done\(\) \}/);
  assert.match(M, /d\.hi = \{ frames: \[tintGrabHi\(im\)\], w: \[1\] \}/); assert.match(M, /acc\.add\(tintGrabHi\(v\), 1\)/); assert.match(M, /const nF = Math\.max\(7, Math\.ceil\(dur \* 4\)\)/);
  assert.match(M, /function tintFromPixels\(d\)/, 'the Auto picker is untouched');
});

// ---- v226: finer grid, second accent, soft accent, accent budget, lighter decode ----
import { ACC } from '../src/tintdetail.js';
test('v226: 16x16 grid by default; a cell can hold TWO accents of different hue (pink cheek + blue spot in one cell)', () => {
  const h = hi((x, y) => (x >= 40 && x < 45 && y >= 41 && y < 46) ? PINK : (x >= 46 && x < 51 && y >= 41 && y < 46) ? [90, 120, 235] : (x - 48) ** 2 + (y - 48) ** 2 < 34 * 34 ? SKIN : HAIR);
  const d = detailFromFrames([h], [1], HI, 8), k = 3 * 8 + 3;   // 8x8: 12 px cells, both spots in the same cell
  assert.equal(detailFromFrames([h], [1]).n, 16);
  assert.ok(d.acc2 && d.acc.cov[k] > .005 && d.acc2.cov[k] > .005, 'two accents: ' + d.acc.cov[k] + ' / ' + d.acc2.cov[k]);
  assert.ok(Math.abs(hueDeg(d.acc.a[k], d.acc.b[k]) - hueDeg(d.acc2.a[k], d.acc2.b[k])) > 60, 'different hues');
});
test('v226: a busy picture is capped (ACC.cap of the cells carry accents), a small clear one is not', () => {
  const noise = hi((x, y) => ((x >> 2) + (y >> 2)) % 3 === 0 ? [60, 160, 90] : ((x >> 2) * 7 + (y >> 2) * 3) % 5 === 0 ? [220, 60, 90] : SKIN);
  const d = detailFromFrames([noise], [1], HI, 16); let n = 0; for (const T of [d.acc, d.acc2]) for (let k = 0; k < 256; k++) if (T.cov[k] > .01) n++;
  assert.ok(n <= Math.round(256 * ACC.cap), 'budget kept: ' + n);
  const f = detailFromFrames([face(true)], [1], HI, 16); assert.ok(f.acc.cov.some(v => v > .01), 'the blush is still found on a calm picture');
});
test('v226: a 1 px line is not an accent even when strongly coloured (small spots must reach sideways AND up / down)', () => {
  const d = detailFromFrames([hi((x, y) => x === 48 ? [20, 60, 240] : SKIN)], [1], HI, 16); for (const T of [d.acc, d.acc2]) for (let k = 0; k < 256; k++) assert.ok(T.cov[k] < .004, 'line accent ' + T.cov[k]);
});
test('v226 wiring: canvases are re-used and released, the decoder and every frame are always closed (v230: huge files are no longer skipped)', () => {
  assert.match(M, /const tintHiCv = \{ a: null, b: null, f: null \}/); assert.match(M, /function tintHiFree\(\)/); assert.match(M, /finally \{ tintHiFree\(\); \}/);
  assert.match(M, /completeFramesOnly: true/); assert.match(M, /finally \{ image\.close\(\); \}/); assert.match(M, /finally \{ try \{ dec && dec\.close\(\); \} catch \{\} \}/); assert.doesNotMatch(M, /byteLength > 90e6/, 'v230: no file size limit'); assert.doesNotMatch(M, /pickCandidates|pickKeyFrames|> 3500/, 'v230: no frame cap, no time budget');
  assert.doesNotMatch(M.slice(M.indexOf('function tintGrabHi'), M.indexOf('function tintJoin')), /const c = document\.createElement\('canvas'\)/, 'no new canvas per frame');
});

test('v230: detailAccumulator (frames one at a time) gives exactly the same result as detailFromFrames (all at once), weights included', () => {
  const mk = (r, g, b) => { const d = new Uint8ClampedArray(HI * HI * 4); for (let i = 0; i < HI * HI; i++) d.set([r, g, b, 255], i * 4); return d; };
  const fr = [mk(200, 40, 40), mk(40, 40, 200), mk(40, 200, 60)], w = [1, 3, 2];
  const A = detailAccumulator(HI); fr.forEach((f, i) => A.add(f, w[i]));
  const x = A.done(), y = detailFromFrames(fr, w);
  assert.deepEqual(Array.from(x.mean.L), Array.from(y.mean.L)); assert.deepEqual(Array.from(x.mean.a), Array.from(y.mean.a)); assert.deepEqual(Array.from(x.dom.b), Array.from(y.dom.b));
  const B = detailAccumulator(HI); for (let i = 0; i < 3000; i++) B.add(fr[i % 3], 1); assert.ok(B.done(), 'a 3000-frame GIF is fed through without keeping any frame');
  assert.equal(detailAccumulator(HI).done(), null, 'no frame = no detail');
});
