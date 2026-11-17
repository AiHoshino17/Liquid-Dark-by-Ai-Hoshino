// Settings > Display options > Playing bar time: the two times under the Now Playing bar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TIME_STYLES, TIME_STYLE_DEF, cleanTimeStyle, timeTexts } from '../src/timestyle.js';
import { GROUP_LABELS } from '../src/settingsio.js';
const rd = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the default is the original look: time played on the left, time left (with a minus) on the right', () => {
  assert.equal(TIME_STYLE_DEF, 'left');
  const t = timeTexts(100, 214, undefined);
  assert.equal(t.tl, '1:40'); assert.equal(t.tr, '-1:54');
});

test('song length style shows the whole song on the right', () => {
  const t = timeTexts(100, 214, 'total');
  assert.equal(t.tl, '1:40'); assert.equal(t.tr, '3:34');
});

test('there are only two choices: time left and song length (no YouTube style)', () => {
  assert.deepEqual(Object.keys(TIME_STYLES), ['left', 'total']);
  assert.equal(cleanTimeStyle('both'), 'left');   // an older saved value
  assert.equal(timeTexts(100, 214, 'both').tr, '-1:54');
});

test('the screen-reader sentence is "played of total" in every style', () => {
  for (const s of Object.keys(TIME_STYLES)) assert.equal(timeTexts(100, 214, s).aria, '1:40 of 3:34');
});

test('odd input never gives NaN or a negative time', () => {
  for (const s of Object.keys(TIME_STYLES)) for (const [p, d] of [[NaN, 0], [-5, 100], [500, 100], [10, NaN], [0, 0], [undefined, undefined]]) {
    const t = timeTexts(p, d, s);
    assert.ok(!/NaN|undefined/.test(t.tl + t.tr + t.aria), `${s} ${p} ${d}`);
  }
  assert.equal(timeTexts(500, 100, 'left').tr, '-0:00');   // past the end counts as the end
});

test('a missing or corrupt saved value falls back to the default', () => {
  for (const bad of [undefined, null, '', 'x', 5, {}, 'toString', '__proto__']) assert.equal(cleanTimeStyle(bad), 'left');
  for (const ok of Object.keys(TIME_STYLES)) assert.equal(cleanTimeStyle(ok), ok);
});

test('it is a real setting: default, saved-value check, import check, settings row, sheet, handlers, import label', () => {
  const m = rd('src/main.js');
  assert.match(m, /timeStyle: 'left'/);
  assert.match(m, /set\.timeStyle = cleanTimeStyle\(set\.timeStyle\)/);
  assert.equal((m.match(/set\.timeStyle = cleanTimeStyle\(set\.timeStyle\)/g) || []).length, 2, 'checked at start-up and after an import');
  assert.match(m, /data-act="timestyle"/);
  assert.match(m, /case 'timestyle':/);
  assert.match(m, /case 'timestyleset':/);
  assert.match(m, /timeTexts\(pos, dur, set\.timeStyle\)/);
  assert.ok(GROUP_LABELS.timeStyle, 'the import sheet has a plain name for it');
});

test('export and import carry the Playing bar time choice (round trip with the real settings code)', async () => {
  const { buildExport, exportText, parseImport, mergeSettings, groupDiffs, pickSettings, groupLabel } = await import('../src/settingsio.js');
  const DEF = { timeStyle: 'left', lyricStyle: 'classic', recent: [] };
  const mine = { ...DEF, timeStyle: 'total' };
  const file = exportText(buildExport(mine));
  assert.match(file, /"timeStyle": "total"/, 'it is in the exported file');
  const imp = parseImport(file, DEF);
  assert.equal(imp.settings.timeStyle, 'total', 'it passes the import check');
  assert.deepEqual(imp.dropped, [], 'nothing is dropped');
  // another phone that still has the default
  const rows = groupDiffs(DEF, imp.settings);
  assert.equal(rows.find(r => r.key === 'timeStyle').status, 'changed');
  assert.equal(groupLabel('timeStyle'), 'Playing bar time');
  const merged = mergeSettings(DEF, pickSettings(imp.settings, ['timeStyle']));
  assert.equal(merged.timeStyle, 'total');
  // a backup made before this setting existed leaves the current choice alone
  const old = parseImport(exportText(buildExport({ lyricStyle: 'cover' })), DEF);
  assert.equal(mergeSettings(mine, old.settings).timeStyle, 'total');
  // a wrong-kind value is dropped, and a value the app no longer offers is cleaned
  assert.deepEqual(parseImport(JSON.stringify({ kind: 'settings', version: 1, settings: { timeStyle: 7, lyricStyle: 'cover' } }), DEF).dropped, ['timeStyle']);
  assert.equal(cleanTimeStyle('both'), 'left');
});
