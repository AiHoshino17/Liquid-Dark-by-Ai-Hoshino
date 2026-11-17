import test from 'node:test';
import assert from 'node:assert/strict';
import { LYA_DEFS, LYA_PRESETS, cleanLya, lyaVars } from '../src/lyanim.js';

test('defaults are the built-in feel', () => {
  const c = cleanLya({});
  for (const d of LYA_DEFS) assert.equal(c[d.k], d.def);
  const v = lyaVars({});
  assert.equal(v['--ly-glide'], '1.00'); assert.equal(v['--ly-zoom'], '1.020'); assert.equal(v['--ly-small'], '0.940'); assert.equal(v['--ly-blur'], '0.00px');
});
test('bad or out of range values are fixed', () => {
  const c = cleanLya({ glide: 99999, fade: -5, zoom: 'abc', blur: '', anchor: null });
  assert.equal(c.glide, 250); assert.equal(c.fade, 30); assert.equal(c.zoom, 102); assert.equal(c.blur, 0); assert.equal(c.anchor, 16);
  assert.deepEqual(cleanLya(null), cleanLya(undefined));
});
test('every preset is valid and complete', () => {
  for (const [n, p] of Object.entries(LYA_PRESETS)) assert.deepEqual(cleanLya(p), p, n);
  assert.deepEqual(LYA_PRESETS.default, cleanLya({}));
});

import { lyEase, lyStaggerMs, lyLeadSec } from '../src/lyanim.js';
import { readFileSync } from 'node:fs';
test('v2 smoothness options: ripple, softness, early start, line gap, background motion', () => {
  const c = cleanLya({});
  assert.equal(c.stagger, 100); assert.equal(c.soft, 70); assert.equal(c.lead, 25); assert.equal(c.gap, 100); assert.equal(c.bgmove, 100);
  const v = lyaVars({ gap: 150, bgmove: 0, soft: 100 });
  assert.equal(v['--ly-gap'], '1.50'); assert.equal(v['--ly-bg'], '0.00'); assert.equal(v['--ly-ease'], 'cubic-bezier(0.400, 0.000, .2, 1)');
  assert.equal(lyStaggerMs({}), 45); assert.equal(lyStaggerMs({ stagger: 0 }), 0); assert.equal(lyLeadSec({ lead: 0 }), 0);
  assert.ok(lyEase(70).endsWith('.2, 1)'), 'the curve ends flat: no overshoot');
  assert.equal(cleanLya({ stagger: 9999, soft: -4, lead: 'x', gap: 1, bgmove: 500 }).stagger, 250);
  assert.ok(LYA_PRESETS.spotify && LYA_PRESETS.spotify.stagger === 0);
});
test('lyrics lines glide with a smooth curve, not the bouncy spring', () => {
  const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  const rule = css.slice(css.indexOf('.ln.tap{opacity:calc(var(--ly-op'), css.indexOf('.ln.tap.cur{opacity:1;transform'));
  assert.ok(!rule.includes('var(--spring)'), 'no spring overshoot on lyric lines');
  assert.ok(rule.includes('var(--ly-ease') && rule.includes('var(--td,0ms)'));
});
