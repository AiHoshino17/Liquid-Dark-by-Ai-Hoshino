// v298 (owner: "Apple Music's word-by-word fade-in isn't working"): line-timed lyrics get word timings so the fade-in runs for every synced song.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLrc, fillWords } from '../src/lrc.js';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v298 fillWords: words share the line time by length, start at the line, stay before the next line; word-timed lines unchanged', () => {
  const r = parseLrc('[00:10.00]Neon rivers running down\n[00:11.00]Hold on\n[00:20.00]Stay');
  const L = fillWords(r.lines);
  assert.equal(L[0].words[0].t, 10); assert.equal(L[0].words.map(w => w.w).join(''), 'Neon rivers running down');
  assert.ok(L[0].words.every((w, i, a) => !i || w.t > a[i - 1].t)); assert.ok(L[0].words.at(-1).t < 11, 'never past the next line');
  assert.equal(L[2].words.length, 1); assert.ok(L[0].autoWords);
  const wt = parseLrc('[00:01.00]<00:01.00>a <00:02.00>b'); assert.deepEqual(fillWords(wt.lines)[0].words, wt.lines[0].words);
  assert.deepEqual(fillWords([{ t: null, text: 'x', words: null }]), [{ t: null, text: 'x', words: null }]);
});
test('v298 wired: only with Word fade-in on and synced lyrics', () => {
  assert.match(M, /lyr = parseLrc\(text\); if \(lyr\.synced && set\.lyWordFade !== false\) lyr = \{ \.\.\.lyr, lines: fillWords\(lyr\.lines, set\.lyWordSpeed\) \};/);
});
test('v299 Fade-in speed: 50-200 % (default 100), faster = shorter, saved + exported, slider only while Word fade-in is on', () => {
  const r = parseLrc('[00:10.00]Neon rivers running down the avenue\n[00:30.00]x');
  const end = sp => fillWords(r.lines, sp)[0].words.at(-1).t;
  assert.ok(end(200) < end(100) && end(100) < end(50)); assert.equal(end('x'), end(100)); assert.equal(end(999), end(200));
  assert.match(M, /lyWordSpeed: 100/); assert.match(M, /fillWords\(lyr\.lines, set\.lyWordSpeed\)/);
  assert.equal((M.match(/set\.lyWordSpeed = Math\.max\(50, Math\.min\(200, Math\.round\(\+set\.lyWordSpeed\) \|\| 100\)\);/g) || []).length, 2, 'cleaned at start-up and on import');
  assert.match(M, /\$\{set\.lyWordFade !== false \? `<div class="animrow"><b>Fade-in speed/);
  assert.match(readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'), /lyWordSpeed: 'Lyrics: word fade-in speed'/);
});
