// v224: (1) the glass pill's size / magnification are not capped by a short (landscape) bar; (2) Settings button shows a gear + the word "Settings";
// (3) customizable tab bar (Settings > Tab bar): keep / remove each icon, optional fifth Settings icon.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TAB_DEFS, PAGE_TABS, DEF_TABS, cleanTabs, visibleTabs, toggleTab } from '../src/tabbar.js';
import { fits, GROUP_LABELS } from '../src/settingsio.js';
const rd = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const M = rd('src/main.js'), G = rd('src/glidebar.js'), CSS = rd('src/styles/app.css'), IC = rd('src/icons.js'), A11 = rd('src/a11y.js');

test('cleanTabs: defaults, bad values, and at least one page icon always on', () => {
  assert.deepEqual(cleanTabs(undefined), DEF_TABS); assert.deepEqual(cleanTabs(null), DEF_TABS); assert.deepEqual(cleanTabs([1, 2]), DEF_TABS); assert.deepEqual(cleanTabs('x'), DEF_TABS);
  assert.deepEqual(cleanTabs({ albums: false, settings: true }), { home: true, albums: false, library: true, search: true, settings: true });
  assert.deepEqual(cleanTabs({ home: 'no', albums: 0, library: null, search: 1 }), DEF_TABS, 'only real booleans count');
  const none = cleanTabs({ home: false, albums: false, library: false, search: false, settings: true });
  assert.equal(none.home, true, 'Settings alone would leave no page: Home comes back'); assert.equal(none.settings, true);
});
test('visibleTabs: bar order, Settings is the fifth icon and off by default', () => {
  assert.deepEqual(visibleTabs().map(t => t[0]), ['home', 'albums', 'library', 'search']);
  assert.deepEqual(visibleTabs({ settings: true }).map(t => t[0]), ['home', 'albums', 'library', 'search', 'settings']);
  assert.deepEqual(visibleTabs({ home: false, library: false }).map(t => t[0]), ['albums', 'search']);
  assert.deepEqual(TAB_DEFS.map(t => t[0]), [...PAGE_TABS, 'settings']);
});
test('toggleTab: flips one icon, refuses to remove the last page icon, ignores unknown keys', () => {
  let t = DEF_TABS;
  for (const k of ['home', 'albums', 'library']) { const r = toggleTab(t, k); assert.equal(r.ok, true); t = r.tabs; assert.equal(t[k], false); }
  const last = toggleTab(t, 'search'); assert.equal(last.ok, false); assert.equal(last.tabs.search, true);
  assert.equal(toggleTab(t, 'settings').ok, true); assert.equal(toggleTab(t, 'nope').ok, false);
  assert.equal(toggleTab(DEF_TABS, 'home').tabs !== DEF_TABS, true, 'never mutates the input'); assert.equal(DEF_TABS.home, true);
});
test('settings backup: tabs is a known group with a plain label, and a wrong-kind value is dropped on import', () => {
  assert.ok(GROUP_LABELS.tabs); assert.equal(fits(DEF_TABS, { home: true }), true); assert.equal(fits(DEF_TABS, 'x'), false);
});
test('main.js wiring: default, start-up clean, live rebuild, Settings icon opens Settings and the pill springs back', () => {
  assert.match(M, /tabs: \{ home: true, albums: true, library: true, search: true, settings: false \}/);
  assert.match(M, /set\.tabs = cleanTabs\(set\.tabs\)/);
  assert.match(M, /case 'tabtg':/); assert.match(M, /function applyTabs\(\)/); assert.match(M, /function buildBar\(\)/);
  assert.match(M, /if \(k === 'settings'\) \{[^}]*push\('settings'\)[^}]*bar\.set\(tabIdx\(\), true\)/);
  assert.match(M, /data-act="tabtg"/); assert.match(A11, /act === 'tg' \|\| act === 'tabtg'/);
  assert.ok(!/const TABS = \[\['home'/.test(M), 'the tab list is no longer a fixed constant');
});
test('Settings button: gear icon + the word Settings (not three dots); track menus keep their three dots', () => {
  assert.match(M, /class="gbtn setbtn" data-act="settings" aria-label="Settings">\$\{I\.gear\}<span>Settings<\/span>/);
  assert.match(IC, /gear: F\(/); assert.match(IC, /I\.settings = I\.gear/);
  assert.match(M, /data-act="trackmenu" data-tm="\$\{t\.id\}">\$\{I\.more\}/);
});
test('glass pill: a short bar gets the same stretch / magnify room as a portrait bar (landscape sliders were nearly dead)', () => {
  assert.match(G, /const REF_BAR_H = 70/); assert.match(G, /rref = Math\.max\(rh, REF_BAR_H\)/);
  assert.match(G, /const ov = 0\.22 \* Math\.min\(1, pp\) \* Math\.min\(A\.pillSize, 3\) \* rref/);
  assert.match(G, /\(H - \(rh >= REF_BAR_H \? 10 : rh \* 0\.1\)\) \/ ch/);
  assert.match(G, /lens\.style\.visibility = i < 0 \? 'hidden' : ''/);
});
test('landscape bar follows Glass bar size (inside the landscape media block)', () => {
  const i = CSS.indexOf('/* ===== v224 (landscape)'), tail = CSS.slice(i);
  assert.ok(i > 0); assert.match(tail, /--lbar:clamp\(46px,calc\(58px \* var\(--tabk,1\)\),90px\)/);
  assert.match(tail, /@media \(orientation:landscape\) and \(max-height:520px\)\{[^]*html \.tabbar \.tab svg\{width:clamp\(18px,calc\(24px \* var\(--tabk,1\)\),38px\)/);
});
test('landscape mini player follows Glass bar size too, stays centred on the bar, and the five labels cannot collide', () => {
  const tail = CSS.slice(CSS.indexOf('/* ===== v224 (landscape)'));
  assert.match(tail, /--lmini:clamp\(46px,calc\(56px \* var\(--tabk,1\)\),84px\)/);
  assert.match(tail, /\.mini\{height:var\(--lmini\);bottom:calc\(max\(8px,var\(--sab\)\) \+ \(var\(--lbar\) - var\(--lmini\)\) \/ 2\)/);
  assert.match(tail, /\.75rem\);letter-spacing/); assert.match(tail, /max-width:780px\)/);
});

test('lyric clock stress (v224): jittery position reports (+-.3 s plus .6 s hiccups) never move the word-by-word clock back; a tapped line still seeks', () => {
  const code = M.slice(M.indexOf('let lyClock ='), M.indexOf('function lyStart()'));
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [period, jit, hic] of [[150, .1, 0], [150, .3, .02], [250, .25, .02], [500, .3, .05], [1000, .2, 0], [150, 0, .05]]) {
    const st = { pos: 0, playing: true }; let t = 0; const lyNow = new Function('Native', 'performance', code + ';return lyNow;')({ state: st }, { now: () => t });
    let truth = 10, last = -1, next = 0;
    for (t = 0; t < 120000; t += 16) {
      truth += .016; if (t >= next) { let lag = (rnd() - .5) * 2 * jit; if (rnd() < hic) lag -= .6; st.pos = Math.max(0, truth + lag); next = t + period; }
      const v = lyNow(); if (last >= 0) assert.ok(v >= last - 1e-9, `stepped back ${last - v} s (period ${period}, jitter ${jit})`); last = v;
    }
  }
  assert.match(M, /lyLast = \{ v: l\.t, pl: false \}; Native\.seek\(l\.t\)/);
});
test('every src/*.js file parses (a stray // comment once swallowed the rest of a line in main.js and no other test loads it)', async () => {
  const { execFileSync } = await import('node:child_process'), { readdirSync, mkdtempSync, writeFileSync } = await import('node:fs'), { tmpdir } = await import('node:os'), { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'lfsyn-'));
  for (const f of readdirSync(new URL('../src/', import.meta.url)).filter(n => n.endsWith('.js'))) {
    const tmp = join(dir, f.replace(/\.js$/, '.mjs')); writeFileSync(tmp, rd('src/' + f));
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }), f + ' has a syntax error');
  }
});
