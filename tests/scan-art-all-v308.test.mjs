// v308: Header cover chip works, preview shows the word fade-in, Refresh art + Rescan suck in EVERY picture (browser check: tests/scan-art-all-check.py)
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { feedPace } from '../src/scanview.js';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('feedPace (v310): every picture gets its turn and the pace never outruns the disc, even 10,000+', () => {
  for (const n of [1, 5, 20, 100, 500, 2000, 10000, 20000]) { const { gap, per, ms, life, cap } = feedPace(n); assert.ok(Math.ceil(n / per) * gap === ms && gap >= 40 && gap <= 280 && (n < 20 || ms >= 2600) && n / (ms / 1000) <= cap / life, `${n}: ${gap} ${per} ${ms}`); }
  assert.ok(feedPace(10000).ms < 200000); for (const n of [20, 2000, 10000]) assert.equal(feedPace(n).life, 0.95);   // v311: calm flight at every size
  assert.equal(feedPace(0).ms, 0);
});
test('Header cover chip lives in the Settings click switch (trackAction has no button)', () => {
  const tA = M.slice(M.indexOf('function trackAction('), M.indexOf('function trackAction(') + 4000);
  assert.ok(!tA.includes("case 'lyheadart'") && !/case 'lyh-fav'[^\n]*\bb\./.test(tA));
  assert.match(M, /case 'lyheadart': set\.lyHeadArt = b\.dataset\.v === 'original'[^\n]*\n\s*case 'artshow'/);
});
test('Lyrics animation preview uses word spans + --wp sweep', () => {
  assert.match(M, /lyPrevWords\(t\)/); assert.match(M, /function lyPrevSweep\(line\)/); assert.match(M, /lyCenter\(ls\[lyPrevI\], lyPrevI > 0, b\); lyPrevSweep\(ls\[lyPrevI\]\)/);
});
test('Refresh art flies every different picture; scan feeds every song cover (custom or original)', () => {
  assert.match(M, /scanView\.artUpdate\(\{ done, total, all: true/); assert.ok(!/fair sample/.test(M.slice(M.indexOf('function artFly'), M.indexOf('function artFly') + 900)));
  assert.match(M, /function libCovers\(show = set\.scanShow\) \{[^]*?spUrls\.get\(t\.id\) \|\| alpUrls\.get\(t\.albumId\)[^]*?t\.cover/);
  assert.match(M, /'Lyrics background'/);
});
test('v309 (owner): Rescan art / Rescan library can show all, original only or yours only; renamed; exported', () => {
  assert.match(M, /artShow: 'all', scanShow: 'all'/); assert.match(M, /const SHOW_OPTS = \['all', 'original', 'custom'\]/);
  assert.equal((M.match(/set\.artShow = SHOW_OPTS\.includes\(set\.artShow\)/g) || []).length, 2);   // start-up + import
  assert.match(M, /case 'artshow': case 'scanshow':/); assert.match(M, /<b>Rescan art<\/b>/); assert.ok(!M.includes('<b>Refresh art</b>'));
  assert.match(M, /show === 'original' \? o : show === 'custom' \? !o : true/);
  assert.match(M, /show === 'original' \|\| soHas\(t\) \? ''/); assert.match(M, /show !== 'custom' && t && t\.cover/);
  const IO = fs.readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'); assert.ok(IO.includes("artShow: 'Rescan art") && IO.includes("scanShow: 'Rescan library"));
});
test('v310: a full disc queues the picture (never skips it); cards wait for the queue; library = song + album covers', () => {
  const S = fs.readFileSync(new URL('../src/scanview.js', import.meta.url), 'utf8');
  assert.match(S, /if \(chips >= maxChips\) \{ if \(dup\) pend\.push\(src\); return; \}/); assert.match(S, /if \(pend\.length && el && el\.classList\.contains\('on'\) && !hiddenByUser\) chip\(pend\.shift\(\), true\)/);
  assert.match(S, /if \(pend\.length && !hiddenByUser\) \{ clearTimeout\(finT\); finT = setTimeout\(\(\) => this\.finish\(r\), 150\)/);
  assert.match(M, /scanView\.idle\(\)\.then/); assert.match(M, /for \(const al of albums\) \{ try \{ const c = show === 'original' \? '' : alpUrls\.get\(al\.id\)/);
  assert.ok(fs.readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8').includes('animation:sc-in var(--scd,.95s)'));
});
