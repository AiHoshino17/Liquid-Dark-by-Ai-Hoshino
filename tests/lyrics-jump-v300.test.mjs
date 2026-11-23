// v300 (owner video: tapping a far lyric line, the lines flew over each other): a move of more than 150 px (about 3 lines) no longer slides line by line;
// every line is put in place at once and the whole block glides 28 px and fades in together, so nothing can cross. Short moves keep the line glide.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('v300 far jump = one block: no per-line slide, class lyjump, 28 px in the move direction', () => {
  assert.match(M, /if \(Math\.abs\(moved\) > 150\) \{[^\n]*\n    lyStop\(\); body\.style\.setProperty\('--lyj', \(Math\.sign\(moved\) \* 28\) \+ 'px'\); body\.classList\.remove\('lyjump'\);[^\n]*body\.classList\.add\('lyjump'\);\n[^\n]*return;\n  \}/);
  assert.ok(C.includes('.lyr-body.lyjump>.ln{animation:lyjb .42s cubic-bezier(.22,.8,.25,1) both}') && C.includes('@keyframes lyjb{from{opacity:0;translate:0 var(--lyj,24px)}}'));
  assert.ok(C.includes('html[data-motion="reduce"] .lyr-body.lyjump>.ln{animation:none}'));
});
test('v301 a tapped line is shown at once: no glide, no fade, no press wobble', () => {
  assert.match(M, /bd\.classList\.add\('lysnap'\); lyStop\(\); lyCenter\(le, false\); syncLyrics\(l\.t\);/);
  assert.ok(C.includes('.lyr-body.lysnap .ln,.lyr-body.lysnap .ln .w{transition:none!important;animation:none!important}'));
  assert.match(readFileSync(new URL('../src/jelly.js', import.meta.url), 'utf8'), /\.nvbar,\.lyr-body \.ln'\)/);
});
