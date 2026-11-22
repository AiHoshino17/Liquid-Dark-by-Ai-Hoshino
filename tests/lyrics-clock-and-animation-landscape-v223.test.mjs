// v223: (1) word-by-word lyrics no longer blink (the lyric clock never steps back a little); (2) the landscape Animation page: test bar keeps its width, the left column stays above the real bars.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), CSS = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const code = M.slice(M.indexOf('let lyClock ='), M.indexOf('function lyStart()'));
const mk = () => { const st = { pos: 0, playing: true }; let t = 0; const lyNow = new Function('Native', 'performance', code + ';return lyNow;')({ state: st }, { now: () => t }); return { st, lyNow, at: x => { t = x; } }; };
test('lyric clock: a player report that is a little behind the counted time does not move the clock back (no un-fade / re-fade of a word)', () => {
  const { st, lyNow, at } = mk(); at(0); st.pos = 10; let last = lyNow();
  const reports = [[100, 10.1], [200, 10.2], [300, 10.15], [400, 10.4], [500, 10.3], [600, 10.7]];   // 10.15 and 10.3 are behind what was already counted
  for (const [ms, p] of reports) { at(ms); st.pos = p; const v = lyNow(); assert.ok(v >= last - 1e-9, `stepped back at ${ms}: ${v} < ${last}`); last = v; }
});
test('lyric clock: a real seek back (> .8 s), a pause and a new song still go through at once', () => {
  const { st, lyNow, at } = mk(); at(0); st.pos = 50; lyNow(); at(200); st.pos = 50.2; lyNow();
  at(300); st.pos = 20; assert.equal(lyNow(), 20);   // seek back
  at(400); st.playing = false; st.pos = 19.9; const ps = lyNow(); assert.ok(ps >= 19.9 && ps <= 20.11, 'paused: no step back (v280), no jump ahead'); at(1400); assert.equal(lyNow(), ps, 'paused: frozen');
  st.playing = true; at(500); st.pos = 0; assert.ok(lyNow() < 1);   // new song
});
test('landscape Animation page CSS: the test bar is not caught by the real-bar rule, the left column ends above the real bars', () => {
  const tail = CSS.slice(CSS.indexOf('/* v222 (third pass, part 2)'));
  assert.match(tail, /#app:has\(#mini \.mini\) \.animdock \.tabbar\.demobar\{[^}]*width:100%/);
  assert.match(tail, /\.animdock\{[^}]*max-height:calc\(100vh - var\(--sat\) - var\(--lbar\) - 104px\)/);
});
test('v280: a split-second "not playing" report (buffering / audio focus) does not move the clock back = no blink', () => {
  const { st, lyNow, at } = mk(); at(0); st.pos = 30; let last = lyNow();
  for (const [ms, p, pl] of [[300, 30.3, true], [600, 30.45, false], [660, 30.45, true], [700, 30.5, true], [1000, 30.95, true]]) { at(ms); st.pos = p; st.playing = pl; const v = lyNow(); assert.ok(v >= last - 1e-9, `stepped back at ${ms}: ${v} < ${last}`); last = v; }
});
