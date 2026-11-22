// v248 palette fix session 1: Tidy, AddVivid, AddEyeRings exist and are wired (behaviour is checked with the harness in docs/PALETTE_FIX_PROGRESS.txt).
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v248: Tidy, AddVivid and AddEyeRings are wired (eye rings last, after relocate)', () => {
  assert.match(M, /tintPaletteRelocate\(tintPaletteFamilyCap\(tintPaletteDropBlends\(tintPaletteAddVivid\(p, fr, fw\)\)\), fr, fw\); if \(ef\) p = tintPaletteAddEyeRings\(p, ef, 192\)/);
  assert.match(M, /function tintPaletteTidy\(pal\)/);
});
