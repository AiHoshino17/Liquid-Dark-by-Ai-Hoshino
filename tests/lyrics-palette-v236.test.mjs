// v236: lyrics background "Cover colour palette" (5 main colours, small yellow / blue kept) + the "whole lyrics blink at every line change" fix.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8'), CSS = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function(blk + ';return { tintPaletteFromPixels, tintPaletteGrad, tintPaletteFlat, tintPaletteFill, mixToLab };')();
const frame = fn => { const d = new Uint8ClampedArray(4096); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) d.set([...fn(x, y), 255], (y * 32 + x) * 4); return d; };
// a Starboy-like picture: red background, a yellow title strip (top), a deep-blue figure (middle), a near-black bottom
const starboy = frame((x, y) => (y < 5 ? [235, 190, 12] : y > 24 ? [18, 6, 14] : x > 11 && x < 21 && y > 10 && y < 24 ? [15, 33, 88] : [208, 12, 58]));
const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;

test('v236: palette picks the small yellow and the small blue, not only the big red and black', () => {
  const pal = F.tintPaletteFromPixels(starboy); assert.ok(pal.length >= 4 && pal.length <= 5);
  assert.ok(pal.some(c => hueOf(c) > 70 && hueOf(c) < 115 && c.L > .6), 'yellow is in the palette');
  assert.ok(pal.some(c => hueOf(c) > 235 && hueOf(c) < 280), 'blue is in the palette');
  assert.ok(pal.some(c => hueOf(c) < 40 || hueOf(c) > 340), 'red is in the palette');
});
test('v236: the primary colour is a vivid one (red), a big near-black area does not become primary', () => {
  const p = F.tintPaletteFromPixels(starboy)[0]; assert.ok(Math.hypot(p.a, p.b) > .1, 'primary has a real hue'); assert.ok(p.rank === 1);
  const last = F.tintPaletteFromPixels(starboy).at(-1); assert.ok(last.L < .25 && Math.hypot(last.a, last.b) < .06, 'near-black comes last');
});
test('v236: the same picture always gives the same palette and CSS', () => {
  assert.equal(F.tintPaletteGrad(F.tintPaletteFromPixels(starboy)), F.tintPaletteGrad(F.tintPaletteFromPixels(starboy)));
});
test('v236: the CSS has a veil, a centre glow, four corner glows and a base, balanced and with white-text-safe colours', () => {
  const g = F.tintPaletteGrad(F.tintPaletteFromPixels(starboy));
  { const n = (g.match(/radial-gradient\(/g) || []).length; assert.ok(n === 5 || n === 6, 'center + corners, plus ONE big dark-mass glow when the cover is mostly dark (v243): ' + n); } assert.equal((g.match(/linear-gradient\(/g) || []).length, 2);
  assert.equal((g.match(/\(/g) || []).length, (g.match(/\)/g) || []).length); assert.match(g, /^linear-gradient\(180deg,rgba\(0,0,0,0\) 38%/); assert.match(g, / at 50% 42%/);
  for (const m of g.matchAll(/rgb\((\d+),(\d+),(\d+)\)/g)) { const [r, gg, b] = m.slice(1).map(v => { v /= 255; return v <= .0393 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); assert.ok(.2126 * r + .7152 * gg + .0722 * b < .5, 'not too light'); }
  assert.match(g, /rgba\(0,0,0,\.66\) 100%\)/, 'v237: strong dark veil at the bottom keeps white lyrics readable');
});
test('v236: a one-colour or unreadable cover still gives 5 layers (missing colours are shades of the real ones)', () => {
  const one = F.tintPaletteFromPixels(frame(() => [40, 90, 200])); assert.equal(one.length, 1); assert.equal(F.tintPaletteFill(one).length, 5);
  assert.equal((F.tintPaletteGrad(one).match(/radial-gradient\(/g) || []).length, 5); assert.equal((F.tintPaletteGrad(F.tintPaletteFlat('#336699')).match(/radial-gradient\(/g) || []).length, 5);
  assert.deepEqual(F.tintPaletteFromPixels(new Uint8ClampedArray(4096)), []); assert.equal(F.tintPaletteGrad([]), '');
});
test('v236: every frame of a GIF counts (a colour only in the last frames is in the palette)', () => {
  const red = frame(() => [220, 30, 40]), blue = frame(() => [30, 50, 220]), list = [...Array(40).fill(red), ...Array(40).fill(blue)], d = new Uint8ClampedArray(list.length * 4096); list.forEach((f, i) => d.set(f, i * 4096));
  const pal = F.tintPaletteFromPixels(d); assert.ok(pal.some(c => hueOf(c) > 235 && hueOf(c) < 290) && pal.some(c => hueOf(c) < 40 || hueOf(c) > 340));
});
test('v236: the setting is wired (default off, switch in Background style, export label, CSS, exclusive with the mix)', () => {
  assert.match(M, /lyricStyle: 'classic', lyricBlur: false, lyricPal: false/); assert.match(M, /palette: 'Cover colour palette:/);
  assert.match(M, /set\.lyricPal = b\.dataset\.v === 'palette'/); assert.match(M, /h\.dataset\.lypal = set\.lyricStyle === 'cover' && set\.lyricApple !== true && set\.lyricPal === true && set\.lyricBlur !== true/);
  assert.equal((M.match(/set\.lyricPal = set\.lyricStyle === 'cover' && !set\.lyricBlur;/g) || []).length, 2);
  assert.match(M, /set\.lyricBlur = b\.dataset\.v === 'blur'/);   // Cover blur is the third, separate choice
  assert.match(CSS, /html\[data-lypal="1"\] \.lyr\{[^}]*var\(--lyr-pal/); assert.match(fs.readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'), /lyricPal: 'Lyrics: Cover colour palette'/);
  assert.match(M, /c\.pal = pl \|\| \[\]/);
});
test('v236 BLINK: the lyrics glide never switches off the fade / size transitions of the lines (only the slide)', () => {
  const body = M.slice(M.indexOf('function lyStop()'), M.indexOf('/* v148+: VIVID cover colours'));
  assert.doesNotMatch(body, /style\.transition = 'none'/); assert.match(CSS, /translate var\(--tt,calc\(\.7s \* var\(--ly-glide,1\)\)\)/);
  // run the real lyCenter on fake lines: the slide starts instant (--tt 0s) and ends released, no other transition is touched
  const mk = () => { const st = {}, hist = []; return { style: { setProperty: (k, v) => { st[k] = v; hist.push([k, v]); }, removeProperty: k => { delete st[k]; hist.push([k, null]); }, set transition(v) { hist.push(['transition', v]); } }, dataset: {}, classList: { contains: () => true }, st, hist, offsetTop: 0 }; };
  const lines = Array.from({ length: 12 }, (_, i) => { const n = mk(); n.dataset.li = i; n.offsetTop = i * 60; return n; }), bodyEl = { children: lines, clientHeight: 600, scrollHeight: 2000, scrollTop: 0, offsetHeight: 600 };
  const run = new Function('lines', 'bodyEl', `let lyMoved = []; const $ = () => bodyEl, set = { lyAnim: { anchor: 16 } }, document = { documentElement: { dataset: {} }, body: { offsetHeight: 1 } }, getComputedStyle = () => ({ translate: '0px 0px' });
    const lyAnchor = () => .16; ${body.slice(0, body.indexOf('/* v148+'))} lyCenter(lines[3], true, bodyEl); return lyMoved.length;`);   // v300: a short move (84 px) glides line by line; long ones are the block fade-in (tests/lyrics-jump-v300.test.mjs)
  assert.ok(run(lines, bodyEl) > 0);
  for (const n of lines.slice(1, 10)) { assert.ok(!n.hist.some(h => h[0] === 'transition'), 'no inline transition on a line'); const k = n.hist.filter(h => h[0] === '--tt'); assert.deepEqual(k.map(h => h[1]), ['0s', null]); assert.equal(n.st['--ty'], '0px'); }
});

test('v237: small vivid colours get their own place and the palette is brighter', () => {
  const d = new Uint8ClampedArray(4096); for (let i = 0; i < 1024; i++) { const o = i * 4, small = i < 12; [d[o], d[o + 1], d[o + 2], d[o + 3]] = small ? [20, 60, 230, 255] : [150, 20, 30, 255]; }
  const pal = F.tintPaletteFromPixels(d); assert.ok(pal.some(c => { const h = Math.atan2(c.b, c.a) * 180 / Math.PI; return Math.hypot(c.a, c.b) > .1 && h < -60 && h > -120; }), 'a blue patch of ~1 % is kept');
});
