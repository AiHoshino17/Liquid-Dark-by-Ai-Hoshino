import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('no long-press text selection (Copy / Select All) anywhere', () => {
  const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
  const java = readFileSync(new URL('../native-android/MainActivity.java', import.meta.url), 'utf8');
  assert.match(css, /\*\{-webkit-user-select:none;user-select:none/);
  assert.match(css, /input,textarea,select,\[contenteditable="true"\]\{-webkit-user-select:text/);
  assert.match(java, /web\.setOnLongClickListener\(v -> true\)/);
});
