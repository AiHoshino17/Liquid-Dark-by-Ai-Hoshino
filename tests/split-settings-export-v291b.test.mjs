// v291b (owner: "the splitting settings are exported and imported too? u sure?"): Settings > Animation > Landscape mini player
// (Split and merge style, Speed, Stretch, Hide after) and the liquid glass sliders survive Export -> Import exactly, checked against the app's real defaults.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as SIO from '../src/settingsio.js';
import { cleanBarSplit } from '../src/lsplit.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const DEF = new Function(M.split('\n').find(l => l.startsWith('const DEF = ')).replace(/;\s*(\/\/.*)?$/, '') + '; return DEF;')();
test('v291b: every split / merge choice round-trips through Export -> Import unchanged', () => {
  for (const style of ['cell', 'stretch', 'drip', 'jelly', 'off']) for (const [speed, stretch, hide] of [[50, 200, 0], [140, 170, 15], [200, 50, 5], [100, 100, 8]]) {
    const mine = { style, speed, stretch, hide };
    const r = SIO.parseImport(SIO.exportText(SIO.buildExport({ ...DEF, barSplit: mine }, {}, '0.208.0')), DEF);
    assert.deepEqual(r.dropped, []);
    const got = SIO.mergeSettings({ ...DEF }, r.settings).barSplit;
    assert.deepEqual(got, mine); assert.deepEqual(cleanBarSplit(got), mine, 'the app keeps it after its own clean-up');
  }
});
test('v291b: the liquid glass sliders round-trip too', () => {
  const anim = { pillWobbleV: 420, pillWobbleH: 380, pillStretch: 550, pillSize: 300, magnify: 450, bounce: 250, speed: 180, jelly: 333, knob: 120, fringe: 600 };
  const r = SIO.parseImport(SIO.exportText(SIO.buildExport({ ...DEF, anim, tabPct: 160 }, {}, '')), DEF);
  const m = SIO.mergeSettings({ ...DEF }, r.settings); assert.deepEqual(m.anim, anim); assert.equal(m.tabPct, 160);
});
test('v291b: the export file names them for the import preview', () => { assert.match(SIO.groupLabel('barSplit'), /Landscape mini player/); });
