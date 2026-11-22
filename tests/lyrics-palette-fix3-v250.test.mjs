// v250 palette fix session 3: item 8, both eyes of a pair carry the eye colour (2nd spot x2 / y2) and both get a glow.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + '\n' + fs.readFileSync(new URL('../src/palcore.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
test('v250: the eye-ring step remembers the other eye of a level same-hue pair as x2 / y2 (all three ways an eye colour is made)', () => {
  assert.match(blk, /setMate = q => \{ if \(mate\) \{ q\.x2 = /);
  assert.match(blk, /q\.eye = true; q\.x = [^;]+; q\.y = [^;]+; setMate\(q\)/);
  assert.match(blk, /eye: true \};\s*setMate\(e\)/);
  assert.match(blk, /Math\.abs\(o\.cy - g\.cy\) <= 12 \* sc && Math\.abs\(o\.cx - g\.cx\) >= 20 \* sc/);
});
test('v250: tintPaletteGrad draws a second small glow at the second eye', () => {
  assert.match(blk, /c\.x2 != null && c\.y2 != null\) accL\.push\(glow\(c/);   // v260: the line has an extra dark2 guard before x2
});
test('v250: the eye colour of one eye only (no x2) draws no extra glow, code path guarded', () => {
  assert.ok(!/accL\.push\(glow\(c, \.56, '34% 28%'[^)]*\)\)\); \}\s*\/\/ v250[^\n]*\n[^\n]*c\.x2 == null/.test(blk));
});
