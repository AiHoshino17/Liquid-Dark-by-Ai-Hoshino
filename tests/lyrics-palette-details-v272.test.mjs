// v272 (owner, 7 GIFs / WebPs: "if they miss small details like that, fix them up too"; "definitely eyes are being missed in some of them"): tintPaletteSmallVivid (a small coloured object: an earring, a hair tie, a bow) and tintPaletteEyeCheck (an eye PAIR on the 192 px eye frames: grey-teal eyes, a tilted head, the iris's own colour).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteSmallVivid, tintPaletteEyeCheck, mixToLab };')();
const lab = rgb => { const [L, a, b] = F.mixToLab(...rgb); return { L, a, b }; };
const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
const SKIN = [240, 200, 175], SHIRT = [245, 243, 238];
const frame = fn => { const d = new Uint8ClampedArray(192 * 192 * 4); for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) d.set([...fn(x, y), 255], (y * 192 + x) * 4); return d; };
const eyeAt = (cx, cy, iris) => (x, y) => { if (y >= cy - 7 && y <= cy - 5 && Math.abs(x - cx) <= 8) return [30, 20, 20]; if ((x === cx || x === cx - 1) && (y === cy || y === cy - 1)) return [255, 255, 255]; if (Math.hypot(x - cx, y - cy - 1) <= 5) return iris; return null; };
const face = (eyes, base = SKIN) => frame((x, y) => { for (const e of eyes) { const c = e(x, y); if (c) return c; } return base; });
const pal0 = () => [{ ...lab(SKIN), share: .9, x: .5, y: .5 }, { ...lab([60, 40, 30]), share: .1, x: .5, y: .9 }];
test('v272: both new steps are wired at the end of tintPaletteAuto (before EyeShare / Extent)', () => { assert.match(M, /tintPaletteEyeShare\(tintPaletteEyeCheck\(tintPaletteSmallVivid\(tintPaletteTrueSpot\(/); });
test('v272: a small blue earring (0.1 % of the picture) gets its own true colour, on its spot', () => {
  const f = frame((x, y) => (x >= 120 && x < 126 && y >= 100 && y < 108 ? [60, 90, 230] : SKIN));
  const pal = F.tintPaletteSmallVivid(pal0(), { hi: { eyeFrames: [f] } }); const c = pal.find(q => q.small);
  assert.ok(c, 'added'); assert.ok(hue(c) > 240 && hue(c) < 300, 'blue'); assert.ok(Math.abs(c.x - 123 / 192) < .02 && Math.abs(c.y - 104 / 192) < .02, 'on the earring'); assert.ok(c.vivid && c.spot);
});
test('v272: noise (a few scattered pixels) and the blended edge between two palette colours are NOT added', () => {
  const noise = frame((x, y) => ((x * 7 + y * 13) % 97 === 0 ? [60, 90, 230] : SKIN));
  assert.ok(!F.tintPaletteSmallVivid(pal0(), { hi: { eyeFrames: [noise] } }).some(q => q.small), 'scattered pixels are not an object');
  const RED = [208, 12, 58], YEL = [235, 190, 12], mid = [222, 101, 35];
  const f = frame((x, y) => (y < 60 ? YEL : y < 63 ? mid : RED)), pal = [{ ...lab(RED), share: .6, x: .5, y: .7 }, { ...lab(YEL), share: .4, x: .5, y: .1 }];
  assert.ok(!F.tintPaletteSmallVivid(pal, { hi: { eyeFrames: [f] } }).some(q => q.small), 'the orange edge where red meets yellow is a blend');
});
test('v272: a level pair of grey-teal eyes is found, circled on both eyes, in the iris colour', () => {
  const f = face([eyeAt(76, 80, [70, 105, 105]), eyeAt(116, 80, [70, 105, 105])]);
  const pal = F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [f] } }), e = pal.find(q => q.eye);
  assert.ok(e, 'eye added'); assert.ok(hue(e) > 150 && hue(e) < 250, 'teal, hue ' + hue(e).toFixed(0));
  const xs = [e.x, e.x2].map(v => v * 192).sort((u, v) => u - v); assert.ok(Math.abs(xs[0] - 76) <= 1.5 && Math.abs(xs[1] - 116) <= 1.5, 'circles on both eyes ' + xs.join(','));
});
test('v272: a tilted head (second eye 20 px higher) is still a pair', () => {
  const f = face([eyeAt(76, 100, [70, 140, 60]), eyeAt(104, 80, [70, 140, 60])]);
  assert.ok(F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [f] } }).some(q => q.eye));
});
test('v272: the same "eye" shapes on a white shirt (not skin) are not eyes', () => {
  const f = face([eyeAt(76, 80, [70, 105, 105]), eyeAt(116, 80, [70, 105, 105])], SHIRT);
  assert.ok(!F.tintPaletteEyeCheck([{ ...lab(SHIRT), share: .9, x: .5, y: .5 }, { ...lab([60, 40, 30]), share: .1, x: .5, y: .9 }], { hi: { eyeFrames: [f] } }).some(q => q.eye));
});
test('v272: a found pair REPLACES an older eye of the same hue family (a better read, right spot); an older eye low in the frame with no pair there loses the eye flag', () => {
  const f = face([eyeAt(76, 80, [70, 140, 60]), eyeAt(116, 80, [70, 140, 60])]);
  const old = { ...lab([40, 75, 20]), share: .004, x: .2, y: .3, eye: true, fi: 0 }, pal = F.tintPaletteEyeCheck([...pal0(), old], { hi: { eyeFrames: [f, f] } });   // v273: seen in 2 frames (one sighting does not overrule an existing eye)
  const eyes = pal.filter(q => q.eye); assert.equal(eyes.length, 1); assert.ok(Math.abs(eyes[0].y - 80.5 / 192) < .02, 'moved onto the real eyes');
  const low = { ...lab([110, 100, 40]), share: .006, x: .3, y: .9, eye: true }, p2 = F.tintPaletteEyeCheck([...pal0(), low], { hi: { eyeFrames: [frame(() => SKIN)] } });
  assert.equal(p2.find(q => q.share === .006).eye, false, 'the "eye" on a hand at the bottom is not an eye any more');
});
// v273 (owner: "why no eye colour" on a 498 x 278 GIF): a sharp TRUE-ASPECT eye copy (tintGrabEye, up to 384 px wide) of every 2nd kept frame; tintPaletteEyeCheck also reads it
test('v273: GIF / WebP / video / still paths keep sharp true-aspect eye frames (eyeHi)', () => {
  assert.match(M, /function tintGrabEye\(el, MW = 384\)/);
  assert.match(M, /out\.hi\.eyeFrames = ef; out\.hi\.eyeHi = eh;/);
  assert.match(M, /j\.hi\.eyeFrames = ef; j\.hi\.eyeHi = eh;/);
  assert.match(M, /d\.hi\.eyeHi = \[e\]/);
});
test('v273: eyes too small for the 192 px square (a plain frame there) are found on the sharp eyeHi frame, placed in 0..1 picture coordinates', () => {
  const W = 384, H = 214, hi = new Uint8ClampedArray(W * H * 4), put = (x, y, c) => hi.set([...c, 255], (y * W + x) * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let c = SKIN; for (const [cx, cy] of [[160, 90], [200, 90]]) { const e = eyeAt(cx, cy, [70, 105, 105])(x, y); if (e) c = e; } put(x, y, c); }
  const plain = frame(() => SKIN), pal = F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [plain], eyeHi: [{ d: hi, w: W, h: H, fi: 0 }] } }), e = pal.find(q => q.eye);
  assert.ok(e, 'eye found on the sharp frame'); const xs = [e.x, e.x2].sort((u, v) => u - v);
  assert.ok(Math.abs(xs[0] - 160.5 / W) < .01 && Math.abs(xs[1] - 200.5 / W) < .01 && Math.abs(e.y - 90.5 / H) < .01, 'on both eyes');
});
test('v273: two glints inside ONE iris are not a pair of eyes', () => {
  const f = face([(x, y) => { if (y >= 63 && y <= 66 && Math.abs(x - 90) <= 14) return [30, 20, 20]; if ((x === 84 || x === 96) && (y === 72 || y === 73)) return [255, 255, 255]; if (Math.hypot(x - 90, y - 74) <= 10) return [70, 105, 105]; return null; }]);
  assert.ok(!F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [f] } }).some(q => q.eye));
});
// v274 (owner: citrus.gif profile face, one eye): a SINGLE eye is added only when the palette has no eye, seen in 2+ frames, upper 60 %, iris clearly coloured
test('v274: a profile face (one eye, 2 frames) gets an eye colour when there is none; once only, or on a palette with an eye, it does not', () => {
  const f = face([eyeAt(90, 70, [120, 95, 55])]);
  assert.ok(F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [f, f] } }).some(q => q.eye && q.single), 'two frames: eye');
  assert.ok(!F.tintPaletteEyeCheck(pal0(), { hi: { eyeFrames: [f] } }).some(q => q.eye), 'one frame: not trusted');
  const withEye = [...pal0(), { ...lab([40, 75, 20]), share: .004, x: .2, y: .3, eye: true }];
  assert.equal(F.tintPaletteEyeCheck(withEye, { hi: { eyeFrames: [f, f] } }).filter(q => q.eye).length, 1, 'an existing eye is not joined by a single');
});
// v276 (owner: Starboy "small orb"): a small bright LIGHT on a dark object (rim light) is flagged lit and drawn soft; a solid-middle check keeps thin streaks out
test('v276: a bright cyan light beside a dark object is flagged lit; a blue earring on skin is not', () => {
  const DARK = [25, 10, 20], CY = [80, 230, 235], BL = [60, 90, 230];
  const rim = frame((x, y) => (x >= 120 && x < 124 && y >= 90 && y < 102 ? CY : x >= 112 && x < 120 ? DARK : SKIN));
  const p1 = F.tintPaletteSmallVivid([{ ...lab(SKIN), share: .9, x: .5, y: .5 }, { ...lab(DARK), share: .1, x: .6, y: .5 }], { hi: { eyeFrames: [rim] } }).find(q => q.small);
  assert.ok(p1 && p1.lit, 'rim light: lit');
  const ear = frame((x, y) => (x >= 120 && x < 126 && y >= 100 && y < 108 ? BL : SKIN));
  const p2 = F.tintPaletteSmallVivid(pal0(), { hi: { eyeFrames: [ear] } }).find(q => q.small); assert.ok(p2 && !p2.lit, 'earring: an object');
});
