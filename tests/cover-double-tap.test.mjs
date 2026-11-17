import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v209/v210: double tap on Now Playing opens the album, set in Settings > Shortcuts', () => {
  assert.ok(M.includes("const albumNow = () => { const t = Native.current(); if (!t) return; closeNP(); push('album', t.albumId); };"));
  assert.ok(M.includes("const gestAct = g => {"));
  assert.ok(M.includes("data-act=\"gest-pick\" data-g=\"double\""));
  assert.ok(M.includes("case 'gest-set':"));
  assert.ok(M.includes("const GEST_DEF = { tap: 'cover', long: 'lyrics', double: 'album' };"));
});
