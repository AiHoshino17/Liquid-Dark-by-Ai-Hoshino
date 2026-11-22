// v288 (owner picked option 1 "Water split" from 5 previews): landscape, the mini player splits out of / merges back into the glass bar like water.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { neckGeom, contentOpacity, tipAmount, SNAP, TIP } from '../src/lsplit.js';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const lsp = readFileSync(new URL('../src/lsplit.js', import.meta.url), 'utf8');

test('v288 neck: joined while the gap is small, thinner as the gap grows, gone at the resting 16 px gap', () => {
  const waist = gap => { const g = neckGeom(400, 400 + gap, 300, 28, 29); assert.ok(g && g.joined, `joined at ${gap}`); const ys = [...g.d.matchAll(/Q[\d.]+ ([\d.-]+)/g)].map(m => +m[1]); return ys[1] - ys[0]; };
  assert.ok(waist(0) > waist(6) && waist(6) > waist(12), 'the neck thins as they pull apart');
  assert.equal(neckGeom(400, 416, 300, 28, 29), null, 'resting gap 16 px: no neck');
  assert.equal(neckGeom(400, 380, 300, 28, 29), null, 'overlapping (bar over the player): no neck');
  assert.ok(SNAP < 16, 'snaps before the resting gap');
});
test('v288 tips: after the snap they pull back; while merging they reach out; drawn only in the gap', () => {
  assert.equal(tipAmount(15, 1, 0, 260), 1); assert.equal(tipAmount(15, 1, 260, 260), 0); assert.ok(tipAmount(15, 1, 130, 260) > .4);
  assert.ok(tipAmount(16, -1, 0, 0) > tipAmount(30, -1, 0, 0)); assert.equal(tipAmount(SNAP - 1, -1, 0, 0), 0);
  const g = neckGeom(400, 416, 300, 28, 28, 1); assert.ok(g && !g.joined && (g.d.match(/Z/g) || []).length === 2, 'two tips');
  assert.ok(TIP * 1.25 / 2 * 2 < 16, 'the two tips never cross at rest');
  assert.equal(neckGeom(400, 416, 300, 28, 28, 0), null);
  assert.equal(neckGeom(NaN, 416, 300, 28, 28), null);
});
test('v288 the player content shows late, like the preview', () => {
  assert.equal(contentOpacity(24, 390, 24), 0); assert.equal(contentOpacity(24, 390, 24 + 390 * .5), 0); assert.equal(contentOpacity(24, 390, 430), 1);
});
test('v288 wiring: landscape only, not with Reduce Motion, a ghost while merging, music back replaces the ghost', () => {
  assert.match(main, /import \{ makeSplit \} from '\.\/lsplit\.js'/);
  assert.match(main, /LAND_Q = '\(orientation:landscape\) and \(max-height:520px\)'/);
  assert.match(main, /reduced: \(\) => document\.documentElement\.dataset\.motion === 'reduce'/);
  assert.match(main, /m\.classList\.add\('leaving'\); m\.setAttribute\('inert', ''\)/);
  assert.match(main, /if \(!had\) \{ try \{ lsplitOf\(\)\.run\(1\); \} catch \{\} \}/);
  assert.match(lsp, /if \(!env\.land\(\) \|\| env\.reduced\(\)\) \{ clear\(\); return false; \}/);
  assert.ok(css.includes('#app:has(#mini .mini:not(.leaving)) .tabbar{left:auto;right:var(--gr)'), 'a leaving ghost does not hold the bar short');
  assert.ok(css.includes('#app.lmerge .tabbar{transition-timing-function:cubic-bezier(.55,0,.3,1)}'), 'merge starts slowly so the neck shows');
  assert.ok(css.includes('.mini.lsplit>*{opacity:var(--lsop,1)}') && css.includes('.lneck{position:absolute;z-index:29;pointer-events:none'));
  assert.match(lsp, /svg\.style\.width = g\.w \+ 'px'/, 'size by style (the global svg rule is 24 x 24)');
});
test('v288b the resting pill is centred on its icon (only the stretched extra width leans forward)', () => {
  const g = readFileSync(new URL('../src/glidebar.js', import.meta.url), 'utf8');
  assert.ok(g.includes('S.dir * 0.15 * Math.max(0, W - Math.max(Wb, tabW + 4))'));
  assert.ok(!g.includes('S.dir * 0.15 * (W - Wb)'), 'the old lean (wide bar: 4-7 px off at rest) is gone');
  // the rest width is max(Wb, tabW + 4) when nothing is pressed, so the lean is 0 there
  const lean = (W, Wb, tabW) => 0.15 * Math.max(0, W - Math.max(Wb, tabW + 4));
  assert.equal(lean(198, 151, 194), 0); assert.ok(lean(260, 151, 194) > 0);
});
