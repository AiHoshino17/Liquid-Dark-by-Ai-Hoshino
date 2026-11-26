// v304 (owner): the top-right Settings button can fade away after a chosen time (Never, or 3 s - 10 min); it is back at every app start; the glass bar's Settings icon is untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('v304 cleanGearHide: 0 = never, else 6-600 s (v316); broken = never', () => {
  const src = M.slice(M.indexOf('function cleanGearHide'), M.indexOf('\n', M.indexOf('function cleanGearHide')));
  const f = new Function('GEAR_MIN', src + 'return cleanGearHide;')(6);
  assert.deepEqual([0, 1, 5, 99, 5000, 'x', null, -4].map(f), [0, 6, 6, 99, 600, 0, 0, 0]);   // v316 (owner): 6 s at the soonest
});
test('v304 wired: default never, exported, count starts at app start, only .setbtn fades (not the glass bar icon)', () => {
  assert.match(M, /gearHide: 0,/); assert.match(readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'), /gearHide: 'Settings button \(top right\): hide after'/);
  assert.match(M, /set\.gearHide = cleanGearHide\(set\.gearHide\); gearArm\(\);   \/\/ v304: the count starts at every app start/);
  assert.ok(C.includes('html.gear-off .setbtn{opacity:0;transform:scale(.9);pointer-events:none}') && !/gear-off[^{]*\.tabbar/.test(C));
  assert.match(M, /case 'gearhide': set\.gearHide = cleanGearHide\(\+b\.dataset\.v\);/); assert.match(M, /e\.target\.dataset\.gearh != null/);
});
