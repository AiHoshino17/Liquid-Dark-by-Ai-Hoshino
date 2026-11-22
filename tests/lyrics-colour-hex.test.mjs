import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');

test('the per-song "Lyrics colour" picker is gone (JS, CSS, saved colours)', () => {
  assert.doesNotMatch(main, /lycolSheet|lyc-pick|tm-lycol|lycMap|lycSave|hexHS|hexHSV|hsvHex|lycDrag|lycSetHex|lycHSV|lf\.lycol|p\.sw\b|c\.sw\b/);
  assert.doesNotMatch(css, /\.lyc(row|wheel|knob|prev|bright|bk|hexbox|auto|hint)/);
  assert.match(main, /async function coverPal\(t\) \{ return coverTint\(trackAlbum\(t\), t\); \}/, 'Immersive Now Playing still takes the cover colour');
});

test('splash: a black splash cover is in index.html, shown before Home is drawn, removed at once when there is no picture', () => {
  const idx = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(idx.indexOf('id="lf-splash"') > -1 && idx.indexOf('id="lf-splash"') < idx.indexOf('id="app"'));
  assert.match(main, /if \(!splashPic\.src\) \{ splashHide\(\); return; \}/);
  assert.match(main, /splashReady\.then\(splashShow\);\s*\/\/ v208\+/);
  assert.equal((main.match(/splashReady\.then\(splashShow\)/g) || []).length, 1, 'only the early call, not one at the end of the file');
});
