// v217: Refresh art also reloads Canvas, waits for the saved pictures, and never touches the library scan or the owner's pictures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const body = name => { const i = M.indexOf(name); assert.ok(i > 0, name + ' exists'); return M.slice(i, i + 2600); };

test('refreshArtRun re-reads the picture files, reloads pictures, then Canvas, then the quiet folder check', () => {
  const b = body('async function refreshArtRun()');
  const a = b.indexOf('mirrorSync()'), c = b.indexOf('refreshAllPics()'), d = b.indexOf('await refreshExtraArt()'), f = b.indexOf('refreshItems()'), e = b.indexOf('loadLib(true, true, true)');
  assert.ok(a > 0 && c > a && d > c && f > d && e > f, 'order: mirrorSync, refreshAllPics, refreshExtraArt, fresh items, loadLib');
});
test('refreshExtraArt clears failed Canvas files, re-reads the Canvas list, reloads Canvas media and waits for the pictures', () => {
  const b = body('async function refreshExtraArt()');
  for (const s of ['cvBad.clear()', 'loadCanvasList(1)', 'video.cvmedia', 'img.cvmedia', 'covTint.clear()', 'picsMissing()', 'repaintPics()']) assert.ok(b.includes(s), s);
});
test('the library scan itself is unchanged: Refresh art still uses the quiet scan, the scan screen only shows when not quiet', () => {
  assert.ok(M.includes("if (!quiet) scanView.start();"));
  assert.ok(M.includes('r = await runScan(quiet, forceArt);'));
});
test('Refresh art does not touch the owner-uploaded pictures (7 folders)', () => {
  const b = body('async function refreshExtraArt()') + body('async function refreshArtRun()');
  for (const s of ['splash', 'statban', 'applogo', 'updpic', 'bgallow', 'creditpic', 'notif']) assert.ok(!b.toLowerCase().includes(s), s + ' not used by Refresh art');
});

// v218: the pictures that fly in are the FRESH ones, one tile per place, in waves of 40, with a counter.
test('tiles are built after the reload (never copies of the old pictures) and the old sample helpers are gone', () => {
  assert.ok(!M.includes('sampleCustomPics') && !M.includes('rfCopies'));
  assert.ok(M.includes('const RF_WAVE = 40, RF_MAX = 600;'));
});
test('refreshItems counts every place: songs, albums, artists, genres, playlists, profile, background and Canvas', () => {
  const b = body('function refreshItems()');
  for (const s of ['spUrls.get(t.id) || alpUrls.get(t.albumId)', 'alpUrls.keys()', 'agUrls[n]', 'gpUrls', 'ppUrl.get', 'pfMedia', 'bgUrl', 'cvPath(t)']) assert.ok(b.includes(s), s);
});
test('the counter shows "N of TOTAL pictures and GIFs" and Refresh finished repeats the real total', () => {
  assert.ok(M.includes('of ${total} pictures and GIFs'));
  assert.ok(M.includes('${items.length} pictures and GIFs reloaded'));
});
test('with thousands of places only RF_MAX tiles are flown but the counter reaches the real total', () => {
  assert.ok(M.includes('RF_MAX = 600'));
  assert.ok(M.includes('const fly = total > RF_MAX'));
  assert.ok(M.includes('w >= waves ? total'));
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
