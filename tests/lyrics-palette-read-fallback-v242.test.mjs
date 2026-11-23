// v242: every picture the lyrics palette can come from (custom picture / GIF, original cover, Canvas still) goes through the SAME read (tintImagePx) and the SAME palette (tintPaletteAuto). When the direct read fails, a second read from a local blob runs, so the lyrics never fall back to one flat colour just because the canvas was tainted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const fn = (name, next) => { const a = M.indexOf('async function ' + name); const b = M.indexOf(next, a); return M.slice(a, b); };

test('tintImagePx: a failed direct read is retried from a local blob (never tainted)', () => {
  const src = fn('tintImagePx', 'function tintVideoPx');
  assert.match(src, /const d = await load\(src\); if \(d\) return d;/);
  assert.match(src, /fetch\(src\)/);
  assert.match(src, /URL\.createObjectURL\(await r\.blob\(\)\)/);
  assert.match(src, /URL\.revokeObjectURL/);
  assert.match(src, /\^blob:\|\^data:/, 'a blob / data source is not fetched again');
});
test('coverTint: one palette function serves every source (custom pic / GIF, original cover, Canvas)', () => {
  const a = M.indexOf('function coverTint'); const b = M.indexOf('/* v290 (owner', a); const src = M.slice(a, b);
  assert.match(src, /tintPixels\(S\)\.then\(async d => \{ let p = null, pl = null, g = ''; if \(d\) \{ try \{ p = tintFromPixels\(d\); \} catch \{\} if \(p\) \{ pr\.early = p;[^\n]*try \{ const r = await palAsync\(d\); pl = r\.pal;/);   // v290 / v293 (the main colour is handed out early, the palette is unchanged): the palette now comes from the Web Worker (same tintPaletteAuto)
  const t = M.slice(M.indexOf('async function tintPixels'), M.indexOf('function tintFromPixels'));
  assert.match(t, /tintVideoPx/); assert.match(t, /tintImagePx\(S\.still, S\.stillCustom\)/); assert.match(t, /tintImagePx\(S\.src, S\.custom\)/);
});
