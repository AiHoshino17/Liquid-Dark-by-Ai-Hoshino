// v213: Exportify (Spotify) CSV: export writes the same header as the sample file, and an export imports back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildFiles, toExportify, EXPORTIFY_COLS, parseAny } from '../src/plforeign.js';
const SAMPLE = fs.readFileSync(new URL('./fixtures-ai-hoshino-exportify.csv', import.meta.url), 'utf8');
test('the Exportify header is the same as the sample file', () => {
  const header = SAMPLE.replace(/^\uFEFF/, '').split(/\r?\n/)[0];
  assert.equal(EXPORTIFY_COLS.join(','), header);
});
test('an Exportify export imports back with the same songs', () => {
  const pls = [{ name: 'Ai Hoshino', songs: [
    { id: '', path: '', title: 'P*RNSTAR', artist: 'Nessa Barrett', album: 'AFTERCARE', dur: 149 },
    { id: '', path: '', title: 'Heartless, Live, "Demo"', artist: 'The Weeknd, The Hills', album: 'After Hours', dur: 201 } ] }];
  const f = buildFiles('exportify', pls, new Date(2026, 10, 18));
  assert.equal(f.name, 'Ai Hoshino.csv');
  assert.equal(f.text.replace(/^\uFEFF/, '').split(/\r?\n/)[0], EXPORTIFY_COLS.join(','));
  const back = parseAny(f.text, f.name);
  assert.equal(back.length, 1);
  assert.deepEqual(back[0].songs.map(s => [s.title, s.artist, s.album]), pls[0].songs.map(s => [s.title, s.artist, s.album]));
});
test('several playlists export as one zip of .csv files', () => {
  const f = buildFiles('exportify', [{ name: 'A', songs: [] }, { name: 'B', songs: [] }], new Date());
  assert.equal(f.mime, 'application/zip');
  assert.deepEqual(f.files.map(x => x.name), ['A.csv', 'B.csv']);
});
test('the sample file imports as a playlist of one song', () => {
  const r = parseAny(SAMPLE, 'Ai_Hoshino_.csv');
  assert.equal(r[0].songs[0].title, 'P*RNSTAR');
});
