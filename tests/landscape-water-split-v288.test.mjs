// v288 / v289: landscape, the mini player splits out of / merges back into the glass bar like water (owner: "it looks like it's just appearing" -> rebuilt),
// and (owner: "what if we can customize this too in the app") Settings > Animation > Landscape mini player: style, speed, stretch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bridgePath, tipPath, timeline, cleanBarSplit, STYLES, SPLIT_NAMES, REST_GAP, BS_DEF } from '../src/lsplit.js';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const lsp = readFileSync(new URL('../src/lsplit.js', import.meta.url), 'utf8');
const io = readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8');

test('v289 bridge: full = a straight bar (top edge flat), thin = round ends with a neck', () => {
  const full = bridgePath(400, 400, 300, 28, 28, 1), ys = [...full.rim.matchAll(/[CM]([\d. -]+)/g)].flatMap(m => m[1].trim().split(/\s+/).map(Number)).filter((v, i) => i % 2 === 1);
  assert.ok(ys.slice(0, 7).every(y => Math.abs(y - 272) < .2), 'full bridge: the top edge is one straight line (looks like one bar)');
  const thin = bridgePath(400, 420, 300, 28, 28, .1); assert.match(thin.d, /^M[\d.]+ 272C/); assert.ok(/ 297\.2C| 297\.2 /.test(thin.d) || /29[6-9]/.test(thin.d), 'the neck dips close to the centre line');
  assert.equal(tipPath(400, 416, 300, 28, 28, 0), null); assert.equal((tipPath(400, 416, 300, 28, 28, 4).d.match(/Z/g) || []).length, 2);
});
test('v289 timeline: split starts joined at gap 0, stretches past the snap, ends at the resting gap; merge ends as one bar', () => {
  for (const st of ['cell', 'stretch']) {
    const f0 = timeline(st, 0, 1, 390), fe = timeline(st, 1, 1, 390);
    assert.equal(Math.round(f0.g), 0); assert.ok(f0.wn >= .99, `${st}: starts as one bar`);
    let max = 0, snapped = false; for (let p = 0; p <= 1; p += .01) { const f = timeline(st, p, 1, 390); max = Math.max(max, f.g); if (f.wn <= 0) snapped = true; }
    assert.ok(snapped, `${st}: the neck snaps`); assert.ok(max > REST_GAP + 4, `${st}: it stretches past the rest gap (${max})`); assert.ok(Math.abs(fe.g - REST_GAP) < 1, `${st}: ends at the rest gap`);
    assert.ok(fe.op === 1 && f0.op === 0, 'the player content fades in');
  }
  assert.ok(timeline('stretch', .3, 1, 390).g > timeline('cell', .3, 1, 390).g, 'Long stretch stretches further');
  assert.ok(timeline('cell', .3, 1, 390, 2).g > timeline('cell', .3, 1, 390, 1).g, 'the Stretch slider stretches further');
  const d0 = timeline('drip', 0, 1, 390); assert.ok(d0.msx < .2 && d0.bl === -390, 'drip: a small drop at the wide bar\'s left end');
  const m1 = timeline('cell', 1, -1, 390); assert.equal(m1.g, 0); assert.equal(m1.wn, 1); assert.equal(m1.op, 0);
  const mt = timeline('cell', .3, -1, 390); assert.ok(mt.tip > 0 && mt.wn == null, 'merge: tips reach out before touching');
  const j = timeline('jelly', 1, 1, 390); assert.equal(j.wn, null); assert.equal(j.bl, REST_GAP);
});
test('v289 setting: cleanBarSplit, default, export / import, picker on the Animation page', () => {
  assert.deepEqual(cleanBarSplit(null), BS_DEF); assert.deepEqual(cleanBarSplit({ style: 'x', stretch: 999, speed: 'a' }), { style: 'cell', stretch: 200, speed: 100, hide: 8 });
  assert.equal(cleanBarSplit({ style: 'off' }).style, 'off'); assert.deepEqual(Object.keys(SPLIT_NAMES), [...STYLES, 'off']);
  assert.match(main, /barSplit: \{ style: 'cell', stretch: 100, speed: 100, hide: 8 \}/, 'a default key: exported and imported');
  assert.match(io, /barSplit: 'Landscape mini player: split and merge/);
  assert.match(main, /<div class="sethead">Landscape mini player<\/div><div class="setcard" id="bsplit">\$\{bsplitRows\(\)\}<\/div>/);
  assert.match(main, /case 'bsplitset': set\.barSplit = cleanBarSplit\(\{ \.\.\.set\.barSplit, style: b\.dataset\.v \}\)/);
  assert.match(main, /e\.target\.dataset\.bsk\) \{ set\.barSplit = cleanBarSplit/);
  assert.equal((main.match(/set\.barSplit = cleanBarSplit\(set\.barSplit\)/g) || []).length, 2, 'cleaned at start-up and on import');
});
test('v289 wiring: landscape only, Reduce Motion / Off = none, ghost removed when the merge ends, the code drives the bar', () => {
  assert.match(main, /LAND_Q = '\(orientation:landscape\) and \(max-height:520px\)'/);
  assert.match(lsp, /if \(!env\.land\(\) \|\| env\.reduced\(\) \|\| c\.style === 'off'\) \{ if \(opts\.first\) \{ try \{ opts\.first\(\); \} catch \{\} \} return false; \}/);
  assert.match(main, /lsplitOf\(\)\.run\(-1, \(\) => \{ const g = el\.querySelector\('\.mini\.leaving'\); if \(g\) g\.remove\(\); \}\)/);
  assert.match(lsp, /bar\.style\.transition = 'none'; bar\.style\.width = b\.width \+ 'px';/);
  assert.ok(css.includes('#app:has(#mini .mini:not(.leaving):not(.away)) .tabbar{left:auto;right:var(--gr)'));
  assert.ok(!css.includes('#app.lmerge'), 'the old CSS merge curve is gone');
  assert.ok(css.includes('.mini.lsplit>*{opacity:var(--lsop,1)}') && css.includes('.lneck{position:absolute;z-index:29;pointer-events:none'));
});
test('v288b the resting pill is centred on its icon (only the stretched extra width leans forward)', () => {
  const g = readFileSync(new URL('../src/glidebar.js', import.meta.url), 'utf8');
  assert.ok(g.includes('S.dir * 0.15 * Math.max(0, W - Math.max(Wb, tabW + 4))'));
  assert.ok(!g.includes('S.dir * 0.15 * (W - Wb)'));
});
