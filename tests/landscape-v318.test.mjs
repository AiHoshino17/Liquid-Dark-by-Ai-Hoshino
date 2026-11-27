// v318 (owner): the landscape Liquid glass / Lyrics animation pages were a mess (every card in one grid cell); the landscape mini player hid even while music played.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { cleanBarSplit, BS_DEF } from '../src/lsplit.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), C = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('landscape pages with a preview dock: float layout, no shared grid cell', () => {
  assert.match(C, /\.screen\.sub:has\(>\.animdock\)\{display:block\}/);
  assert.match(C, /\.screen\.sub:has\(>\.animdock\)>\.animdock\{float:left;width:44%;position:sticky;/);
  assert.match(C, /\.screen\.sub:has\(>\.animdock\)>:not\(\.top\):not\(\.animdock\)\{margin-left:calc\(44% \+ 24px\)/);
  assert.ok(!/\.screen\.sub:has\(>\.animdock\)>\.setcard\{grid-column:2;grid-row:2/.test(C));
});
test('v318b: Hide while playing is its own time (0 = never, default); the v318 on switch becomes the Hide after time', () => {
  assert.equal(BS_DEF.playHide, 0); assert.equal(cleanBarSplit({}).playHide, 0); assert.equal(cleanBarSplit({ playHide: 30 }).playHide, 30); assert.equal(cleanBarSplit({ playHide: 1 }).playHide, 2);
  assert.equal(cleanBarSplit({ playHide: true, hide: 15 }).playHide, 15); assert.equal(cleanBarSplit({ playHide: false }).playHide, 0); assert.equal(cleanBarSplit({ playHide: 'x' }).playHide, 0); assert.equal(cleanBarSplit({ playHide: 9999 }).playHide, 600);
  assert.match(M, /sec = Native\.state\.playing \? bs\.playHide : bs\.hide;/);
  assert.match(M, /case 'bsplayhide': set\.barSplit = cleanBarSplit\(\{ \.\.\.set\.barSplit, playHide: \+b\.dataset\.v \}\)/);
  assert.match(M, /data-act="bsplayhide" data-v="\$\{v\}"/); assert.match(M, /data-bsph="1"/); assert.match(M, /e\.target\.dataset\.bsph\) \{ const sec = HIDE_STEPS/);
});
