// v279 (owner: "glass bar size should be applied even in landscape"; the liquid animation settings must reach the glass bar in landscape too)
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const C = fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8'), G = fs.readFileSync(new URL('../src/glidebar.js', import.meta.url), 'utf8');
const blk = C.slice(C.indexOf('/* ===== v279'));
test('v279: the landscape bar height follows Glass bar size over its whole range (no 90 px stop), capped to the screen', () => {
  assert.match(blk, /--lbar:clamp\(38px,calc\(58px \* var\(--tabk,1\)\),34vh\)/);
  assert.ok(C.lastIndexOf('--lbar:') > C.indexOf('/* ===== v279'), 'the v279 value is the last one (wins)');
});
test('v279: padding, icons and labels follow the slider in landscape (v281: the width is the full screen / the right half, see below)', () => {
  assert.match(blk, /padding:calc\(3px \* var\(--tabk,1\)\) calc\(10px \* var\(--tabk,1\)\)/);
  assert.match(blk, /svg\{width:clamp\(16px,calc\(24px \* var\(--tabk,1\)\),min\(52px,14vh\)\)/);
});
test('v279: the pill animation has no landscape switch: it reads the live Animation settings (A) and a short bar keeps its room (REF_BAR_H)', () => {
  assert.doesNotMatch(G, /orientation|matchMedia|innerWidth\s*>\s*innerHeight/);
  assert.match(G, /A\.pillSize/); assert.match(G, /A\.pillStretch/); assert.match(G, /A\.magnify/); assert.match(G, /rref = Math\.max\(rh, REF_BAR_H\)/);
});
test('v281: landscape bar is full width with nothing playing, the right half with a mini player; the pill follows the bar size (ResizeObserver)', () => {
  assert.match(blk, /\.tabbar\{left:auto;right:var\(--gr\);margin:0;width:calc\(100% - var\(--gl\) - var\(--gr\)\);transition:width/);
  assert.match(C, /#app:has\(#mini \.mini:not\(\.leaving\)\) \.tabbar\{left:auto;right:var\(--gr\);margin:0;width:calc\(50% - var\(--gr\) - 8px\)\}/);
  assert.match(G, /new ResizeObserver\(/); assert.match(G, /if \(ro\) ro\.disconnect\(\)/);
});
