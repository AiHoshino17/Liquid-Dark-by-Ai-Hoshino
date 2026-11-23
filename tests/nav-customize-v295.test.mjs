// v295 (owner): Customize navigation: hold an icon, drag it, drop; show / hide; reset. The order is saved (set.tabOrder, exported).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reorderShown, dropSlot, DEF_ORDER } from '../src/tabbar.js';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v295 reorderShown: moves among the shown icons, hidden ones keep their places', () => {
  const all = { home: true, albums: true, library: true, search: true, settings: true };
  assert.deepEqual(reorderShown(DEF_ORDER, all, 0, 3), ['albums', 'library', 'search', 'home', 'settings']);
  assert.deepEqual(reorderShown(DEF_ORDER, all, 4, 0), ['settings', 'home', 'albums', 'library', 'search']);
  const noAlb = { ...all, albums: false };   // shown: home library search settings
  assert.deepEqual(reorderShown(DEF_ORDER, noAlb, 0, 2), ['library', 'albums', 'search', 'home', 'settings']);
  assert.deepEqual(reorderShown(DEF_ORDER, all, 1, 1), DEF_ORDER); assert.deepEqual(reorderShown(DEF_ORDER, all, 9, 0), DEF_ORDER);
});
test('v295 dropSlot: the slot under the dragged icon centre, kept inside the bar', () => {
  assert.equal(dropSlot(10, 80, 5), 0); assert.equal(dropSlot(85, 80, 5), 1); assert.equal(dropSlot(-50, 80, 5), 0); assert.equal(dropSlot(900, 80, 5), 4);
});
test('v295 page wiring: Settings row, drag (hold 350 ms, lift, slide aside, drop saves), keys, reset, simple help text', () => {
  assert.match(M, /data-act="navcustom"/); assert.match(M, /case 'navcustom': push\('navcustom'\)/);
  assert.match(M, /Hold an icon until it lifts, slide it left or right, then let go\. It saves by itself\./);
  assert.match(M, /el\.classList\.add\('lift'\); bar\.classList\.add\('nvdrag'\);/); assert.match(M, /\}, 350\); \}, true\);/);
  assert.match(M, /if \(save && to !== from\) \{ set\.tabOrder = reorderShown\(set\.tabOrder, set\.tabs, from, to\); applySettings\(\); applyTabs\(\);/);
  assert.match(M, /\['ArrowLeft', 'ArrowRight'\]\.includes\(e\.key\)/);
  assert.match(M, /case 'navreset': set\.tabs = \{ \.\.\.DEF_TABS \}; set\.tabOrder = DEF_ORDER\.slice\(\);/);
});
