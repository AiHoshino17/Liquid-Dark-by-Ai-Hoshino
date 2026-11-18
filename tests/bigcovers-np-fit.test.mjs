import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('Bigger album covers: Now Playing cover is sized from the .art container, not the screen width', () => {
  const m = css.match(/html\[data-bigcovers="1"\] \.np \.art \.cover\{([^}]*)\}/);
  assert.ok(m, 'rule exists');
  assert.match(m[1], /width:min\(100cqw,100cqh\)/);
  assert.match(m[1], /aspect-ratio:1\/1/);
  assert.doesNotMatch(m[1], /96vw/);
});
