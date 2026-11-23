// v291 (owner): turning the phone sideways plays the split (wide bar first, then the player splits out); the landscape mini player merges back into the bar
// after 8 s without a touch (Settings: Never / 5 / 8 / 15 s), comes back on swipe up on the bar, a new song or play / pause; portrait never hides it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanBarSplit, HIDE_OPTS, BS_DEF, HIDE_MIN, HIDE_MAX, HIDE_STEPS, hideStepOf, fmtHide } from '../src/lsplit.js';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const L = readFileSync(new URL('../src/lsplit.js', import.meta.url), 'utf8');
test('v291 / v292 setting: Hide after = Never or any time 3 s - 10 min (default 8 s), quick picks + a custom slider, exported with barSplit', () => {
  assert.deepEqual(HIDE_OPTS, [0, 5, 8, 15, 30, 60]); assert.equal(BS_DEF.hide, 8);
  assert.equal(cleanBarSplit({}).hide, 8); assert.equal(cleanBarSplit({ hide: 0 }).hide, 0); assert.equal(cleanBarSplit({ hide: '15' }).hide, 15);
  assert.equal(cleanBarSplit({ hide: 99 }).hide, 99, 'v292: any time, not only the quick picks'); assert.equal(cleanBarSplit({ hide: 1 }).hide, HIDE_MIN); assert.equal(cleanBarSplit({ hide: 5000 }).hide, HIDE_MAX);
  for (const bad of ['x', null, true, -3, NaN, {}]) assert.equal(cleanBarSplit({ hide: bad }).hide, 8, `broken ${String(bad)} = the default`);
  assert.equal(HIDE_MIN, 3); assert.equal(HIDE_MAX, 600);
  assert.equal(HIDE_STEPS[0], 3); assert.equal(HIDE_STEPS[HIDE_STEPS.length - 1], 600); assert.ok(HIDE_STEPS.every((v, i) => !i || v > HIDE_STEPS[i - 1]), 'the slider only goes up');
  for (const v of [3, 8, 45, 60, 90, 120, 135, 300, 330, 600]) assert.ok(HIDE_STEPS.includes(v), `${v} s is on the slider`);
  assert.equal(HIDE_STEPS[hideStepOf(97)], 95); assert.equal(HIDE_STEPS[hideStepOf(8)], 8);
  assert.deepEqual([0, 8, 59, 60, 90, 600].map(fmtHide), ['Never', '8 s', '59 s', '1 min', '1 min 30 s', '10 min']);
  assert.match(M, /barSplit: \{ style: 'cell', stretch: 100, speed: 100, hide: 8 \}/);
  assert.match(M, /data-act="bshide" data-v="\$\{v\}">\$\{fmtHide\(v\)\}/);
  assert.match(M, /case 'bshide': set\.barSplit = cleanBarSplit\(\{ \.\.\.set\.barSplit, hide: \+b\.dataset\.v \}\)/);
  assert.match(M, /\$\{c\.hide \? `<div class="animrow"><b>Custom time<em data-bsv="hide2">/, 'the custom slider shows unless Never');
  assert.match(M, /e\.target\.dataset\.bsh\) \{ const sec = HIDE_STEPS\[\+e\.target\.value\] \|\| 8; set\.barSplit = cleanBarSplit\(\{ \.\.\.set\.barSplit, hide: sec \}\);/);
  assert.match(M, /miniIdleArm\(\); \}   \/\* v292: custom time slider \*\//, 'a new time restarts the count at once');
});
test('v291 idle hide: landscape only, a touch restarts it, not while Now Playing / lyrics cover it, music keeps playing', () => {
  assert.match(M, /if \(!sec \|\| !isLand\(\) \|\| !\$\('#mini \.mini:not\(\.leaving\):not\(\.away\)'\)\) return;\n  miniIdleT = setTimeout\(miniHide, sec \* 1000\);/);
  assert.match(M, /e\.target\.closest\('#mini \.mini'\)\) miniIdleArm\(\); \}, true\);/);
  assert.match(M, /m\.querySelector\(':focus-visible'\) \|\| \$\('#np\.open'\) \|\| \$\('#lyr\.open'\)/);
  assert.match(M, /let sp = false; try \{ sp = lsplitOf\(\)\.run\(-1, away\); \} catch \{\}/, 'merges back with the chosen animation');
  assert.ok(!/miniHide[\s\S]{0,400}Native\.pause/.test(M.slice(M.indexOf('function miniHide'), M.indexOf('function miniShow'))), 'hiding never pauses the music');
  assert.ok(C.includes('#mini .mini.away{display:none}'));
  assert.ok(C.includes('#app:has(#mini .mini:not(.leaving):not(.away)) .tabbar{left:auto;right:var(--gr)'), 'a hidden player gives the bar its full width');
});
test('v291 comes back: swipe up on the bar, a new song / play / pause (renderMini markup changes), portrait at once', () => {
  assert.match(M, /if \(dy < -26 && Math\.abs\(dy\) > Math\.abs\(dx\) \* 1\.3\) \{ on = false; try \{ window\.dispatchEvent\(new PointerEvent\('pointercancel', \{ isPrimary: true, pointerId: e\.pointerId \}\)\); \} catch \{\} miniShow\(\); \}/, 'the swipe cancels the bar press: no tab change');
  assert.match(M, /if \(el\._h === h\) return;   \/\/ identical markup/);
  assert.match(M, /const had = !!el\.querySelector\('\.mini:not\(\.leaving\):not\(\.away\)'\);/);
  assert.match(M, /if \(!e\.matches\) \{ if \(m\) \{ m\.classList\.remove\('away', 'leaving'\); m\.removeAttribute\('inert'\); \}/);
});
test('v291 rotate: wide bar held (#app.lrot), then the split with a short delay; Reduce Motion / Off = none', () => {
  assert.match(M, /matchMedia\(LAND_Q\)\.addEventListener\('change'/);
  assert.match(M, /lsplitOf\(\)\.run\(1, null, \{ delay: 450, first: \(\) => app\.classList\.remove\('lrot'\) \}\)/);
  assert.match(M, /if \(document\.documentElement\.dataset\.motion === 'reduce' \|\| cleanBarSplit\(set\.barSplit\)\.style === 'off'\) \{ miniIdleArm\(\); return; \}/);
  assert.ok(C.includes('#app.lrot .tabbar{width:calc(100% - var(--gl) - var(--gr))!important;transition:none!important}') && C.includes('#app.lrot #mini .mini{opacity:0!important}'));
  assert.match(L, /t0: performance\.now\(\) \+ \(\+opts\.delay \|\| 0\)/); assert.match(L, /if \(j\.first\) \{ const f = j\.first; j\.first = null;/);
});
