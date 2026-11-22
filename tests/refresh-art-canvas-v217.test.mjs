// v217: Refresh art also reloads Canvas, waits for the saved pictures, and never touches the library scan or the owner's pictures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const S = readFileSync(new URL('../src/scanview.js', import.meta.url), 'utf8');
const body = name => { const i = M.indexOf(name); assert.ok(i > 0, name + ' exists'); return M.slice(i, i + 2600); };

test('refreshArtRun re-reads the picture files, reloads pictures, then Canvas, then the quiet folder check', () => {
  const b = body('async function refreshArtRun()');
  const a = b.indexOf('mirrorSync()'), c = b.indexOf('refreshAllPics(true)'), d = b.indexOf('await refreshExtraArt()'), f = b.indexOf('refreshItems()'), e = b.indexOf('loadLib(true, true, true)');
  assert.ok(a > 0 && c > a && d > c && f > d && e > f, 'order: mirrorSync, refreshAllPics, refreshExtraArt, fresh items, loadLib');
});
test('refreshExtraArt clears failed Canvas files, re-reads the Canvas list, reloads Canvas media and waits for the pictures', () => {
  const b = body('async function refreshExtraArt()');
  for (const s of ['cvBad.clear()', 'loadCanvasList(1)', 'video.cvmedia', 'img.cvmedia', 'covTint.clear()', 'picsMissing()', 'repaintPics()']) assert.ok(b.includes(s), s);
});
test('the library scan itself is unchanged: Refresh art still uses the quiet scan, the scan screen only shows when not quiet', () => {
  assert.ok(M.includes('if (!quiet) scanView.start(fx ?'));
  assert.ok(M.includes('r = await runScan(quiet, forceArt, fx);'));
});
test('Refresh art does not touch the owner-uploaded pictures (7 folders)', () => {
  const b = body('async function refreshExtraArt()') + body('async function refreshArtRun()');
  for (const s of ['splash', 'statban', 'applogo', 'updpic', 'bgallow', 'creditpic', 'notif']) assert.ok(!b.toLowerCase().includes(s), s + ' not used by Refresh art');
});

// v218: the pictures that fly in are the FRESH ones, one tile per place, in waves of 40, with a counter.
test('tiles are built after the reload (never copies of the old pictures) and the old sample helpers are gone', () => {
  assert.ok(!M.includes('sampleCustomPics') && !M.includes('rfCopies'));
  assert.ok(!M.includes('RF_WAVE') && !M.includes('rfWaves') && !M.includes('refreshShow'));   // v220: the old red-dot sheet is gone, Refresh art uses the library scan card
});
test('refreshItems counts every place: songs, albums, artists, genres, playlists, profile, background and Canvas', () => {
  const b = body('function refreshItems()');
  for (const s of ['spUrls.get(t.id) || alpUrls.get(t.albumId)', 'alpUrls.get(a.id)', 'albumTracks(a.id)', 'Song covers', 'Album covers', 'agUrls[n]', 'gpUrls', 'ppUrl.get', 'picsOf(pl_)', 'pfMedia', 'bgUrl', 'cvPath(t)']) assert.ok(b.includes(s), s);
});
test('the counter shows "N / TOTAL pictures and GIFs" and Refresh finished repeats the real total', () => {
  assert.ok(S.includes('/ ${n(t)} pictures and GIFs'));
  assert.ok(M.includes('pictures and GIFs reloaded'));
});
test('with thousands of places the card flies a sample but the counter reaches the real total', () => {
  const b = body('function artFly(');
  assert.ok(b.includes('k >= 1 ? total') && b.includes('Math.min(9000'));
});
// v220: Refresh art and Library > Rescan use the library scan card
test('Refresh art uses scanView (startArt / artUpdate / artFinish) and shows no toast on top of the card', () => {
  const b = body('async function refreshArtRun()');
  for (const x of ['scanView.startArt', 'scanView.artUpdate', 'scanView.artFinish', 'artFly(items)']) assert.ok(b.includes(x), x);
  assert.ok(M.includes('function refreshAllPics(silent = false)') && M.includes('if (!silent) toast('));
  for (const x of ['startArt(', 'artUpdate(', 'artFinish(', 'chip(p.covers[0], true)']) assert.ok(S.includes(x), x);
});
test('Library > Rescan opens the card at once, keeps it 2.6 s and feeds it the covers read from the music files; first scan is untouched', () => {
  assert.ok(M.includes("case 'rescan': loadLib(true, true, false, true)"));
  assert.ok(M.includes('{ instant: true, minMs: 2600, covers: libCovers() }'));
  assert.ok(S.includes('opts.instant ? 0 : SHOW_AFTER_MS') && S.includes('minUntil - Date.now()'));
  assert.ok(M.includes("const c = t && t.cover") && !M.slice(M.indexOf('function libCovers'), M.indexOf('async function runScan')).includes('spUrls'));   // never a custom picture
});

// v219: 10,000+ places
test('restorePics reads the saved pictures 64 at a time, not all at once', () => {
  const b = body('async function restorePics(');
  assert.ok(b.includes('i += 64') && b.includes('all.slice(i, i + 64)'));
});
test('refreshExtraArt keeps waiting while pictures keep arriving (6 s without progress, 120 s at most) and shows the progress', () => {
  const b = body('async function refreshExtraArt()');
  assert.ok(b.includes('< 6000') && b.includes('< 120000') && b.includes('pictures and GIFs loaded'));
});

test('Refresh art flies pictures at the calm pace of the library scan (max 7 in the air, one every ~0.28 s)', () => {
  assert.ok(S.includes('FEED_MS = 280') && S.includes('ART_GAP = 260') && S.includes('maxChips = 7') && !S.includes('maxChips = 12'));
});

// v221: old Refresh art CSS removed; the scan card has a landscape layout
const CSS = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('the old Refresh art CSS (.rfstage / .rfcore / .rfw ...) is gone and lf-suck (the on-screen pop) stays', () => {
  for (const x of ['.rfstage', '.rfcore', '.rfcheck', '.rfw', 'rfsuck', 'rfwsuck', 'rfpulse', 'rfpop']) assert.ok(!CSS.includes(x), x);
  assert.ok(CSS.includes('@keyframes lf-suck'));
});
test('the scan card lies down in landscape (disc left, text right, safe-area padding)', () => {
  assert.ok(CSS.includes('@media (orientation:landscape) and (max-height:520px)'));
  assert.ok(CSS.includes('grid-template-columns:132px minmax(0,1fr)') && CSS.includes('env(safe-area-inset-top)'));
});

// v221: the whole app turns with the phone (landscape)
const INSTALL = readFileSync(new URL('../scripts/install-native.sh', import.meta.url), 'utf8');
const JAVA = readFileSync(new URL('../native-android/MainActivity.java', import.meta.url), 'utf8');
const TOK = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
test('the portrait lock is gone: the manifest gets fullUser + configChanges, and an old portrait lock is removed', () => {
  assert.ok(!INSTALL.includes('screenOrientation="portrait"'));
  assert.ok(INSTALL.includes('android:screenOrientation="fullUser"') && INSTALL.includes('android:configChanges="orientation|screenSize'));
  assert.ok(INSTALL.includes('(?!fullUser")'));
});
test('left and right insets travel from MainActivity to the page (--sal / --sar)', () => {
  assert.ok(JAVA.includes('insetLeft') && JAVA.includes('insetRight') && JAVA.includes('left:" + insetLeft'));
  assert.ok(M.includes("'--sal'") && M.includes("'--sar'") && TOK.includes('--sal:') && TOK.includes('--sar:'));
});
test('landscape layout: full width, bars side by side, Now Playing in two columns, 5 covers per row', () => {
  const L = CSS.slice(CSS.indexOf('v221: LANDSCAPE'));
  for (const x of ['@media (orientation:landscape) and (max-height:520px)', '#app{max-width:none}', '#app:has(#mini .mini:not(.leaving)) .tabbar', 'grid-template-columns:minmax(0,38%) minmax(0,1fr)', 'repeat(5,minmax(0,1fr))', '.np>.art{grid-column:1']) assert.ok(L.includes(x), x);
  assert.ok(!L.includes('--tabbar-h'), 'the portrait glass-bar-size slider is not used sideways');
});

test('Refresh art also flies the ORIGINAL covers (songs and albums without a custom picture)', () => {
  const b = body('function refreshItems()');
  assert.ok(b.includes('c || orig(t)') && b.includes("t.cover ? Native.fileUrl(t.cover)"));
});

const LN = readFileSync(new URL('../native-android/LiquidNative.java', import.meta.url), 'utf8');
test('forceArt re-reads EVERY file (Refresh art and the Rescan button); the automatic check stays incremental', () => {
  assert.equal((LN.match(/!forceArt && prev != null/g) || []).length, 2);
  assert.ok(M.includes("case 'rescan': loadLib(true, true, false, true)"));
  assert.ok(M.includes('const r = await runScan(true);'));   // autoCheck: no forceArt
});
