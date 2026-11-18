// v214: the import preview keeps Import / Cancel above the long "not in your library" list (it used to be pushed below the fold).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v214: Import is placed before the missing-songs list and that list is collapsed', () => {
  const i = M.indexOf('<button data-act="plimport-ok">Import</button>');
  const j = M.indexOf('${already}${miss}');
  assert.ok(i > 0 && j > i, 'Import must come before the already/missing sections');
  assert.ok(M.includes('<details class="plmiss">'));
});
