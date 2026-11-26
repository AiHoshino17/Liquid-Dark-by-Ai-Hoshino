// v316 (owner): the top-right Settings button hides after 6 s at the soonest; the landscape mini player can hide after 2 s.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { HIDE_STEPS, HIDE_OPTS, GEAR_MIN, GEAR_STEPS, hideStepOf, cleanBarSplit } from '../src/lsplit.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('Settings button: 6 s minimum (chips, slider, saved values)', () => {
  assert.equal(GEAR_MIN, 6); assert.equal(GEAR_STEPS[0], 6); assert.equal(GEAR_STEPS[GEAR_STEPS.length - 1], 600);
  assert.match(M, /const GEAR_OPTS = \[0, 6, 10, 30, 60\];/);
  assert.match(M, /Math\.max\(GEAR_MIN, Math\.min\(600, n\)\) : 0; \}/);
  const clean = new Function('GEAR_MIN', M.match(/function cleanGearHide\(v\) \{[^\n]*?\} /)[0] + '; return cleanGearHide;')(6);
  assert.equal(clean(3), 6); assert.equal(clean(5), 6); assert.equal(clean(0), 0); assert.equal(clean(30), 30);
  assert.match(M, /data-gearh min="0" max="\$\{GEAR_STEPS\.length - 1\}"/); assert.match(M, /const sec = GEAR_STEPS\[\+e\.target\.value\]/);
  assert.equal(hideStepOf(6, GEAR_STEPS), 0);
});
test('landscape mini player: 2 s minimum, 2 s chip', () => {
  assert.equal(HIDE_STEPS[0], 2); assert.ok(HIDE_OPTS.includes(2));
  assert.equal(cleanBarSplit({ hide: 2 }).hide, 2); assert.equal(cleanBarSplit({ hide: 1 }).hide, 2);
});
