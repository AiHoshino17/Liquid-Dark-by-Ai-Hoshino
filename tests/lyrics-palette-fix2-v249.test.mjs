// v249 palette fix session 2: DropBlends (Starboy's orange edge colour) and the face check of the eye-ring step.
import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const M = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteDropBlends };')(() => null, 96);
const lab = (L, a, b, share, x = {}) => ({ L, a, b, share, ...x });
test('v249: a small colour on the line between two bigger colours is a blend and is dropped', () => {
  const red = lab(.55, .20, .08, .3), yel = lab(.85, .02, .17, .12), black = lab(.15, .02, 0, .5);
  const mid = lab((red.L + yel.L) / 2, (red.a + yel.a) / 2, (red.b + yel.b) / 2, .04);
  const blue = lab(.4, -.03, -.2, .1);
  const pal = F.tintPaletteDropBlends([black, red, yel, mid, blue]);
  assert.equal(pal.length, 4); assert.ok(!pal.includes(mid)); assert.ok(red.share > .3, 'its share went to the nearer colour');
});
test('v249: eye, cover (solid area), hair and a colour off the line are never dropped; palette order and rank 1 stay', () => {
  const red = lab(.55, .20, .08, .3), yel = lab(.85, .02, .17, .12), black = lab(.15, .02, 0, .5);
  const m = (x = {}) => lab((red.L + yel.L) / 2, (red.a + yel.a) / 2, (red.b + yel.b) / 2, .02, x);
  for (const k of [{ eye: true }, { cover: true }, { hair: true }]) assert.equal(F.tintPaletteDropBlends([black, { ...red }, { ...yel }, m(k)]).length, 4, JSON.stringify(k));
  const off = lab(.5, -.15, .1, .02); assert.equal(F.tintPaletteDropBlends([black, { ...red }, { ...yel }, off]).length, 4, 'a real different colour stays');
  assert.equal(F.tintPaletteDropBlends([black, { ...red }, { ...yel }]).length, 3, 'a 3-colour palette is untouched');
});
test('v249: the eye-ring step needs skin around the spot (not a hair strand) and a second eye level with the first', () => {
  assert.match(M, /\(g\.skin \|\| 0\) < \.18 && !\(g\.sp[^;]*g\.score = 0/);
  assert.match(M, /g\.fr\.size >= need && g\.score > 0/);
  assert.match(M, /Math\.abs\(g\.cy - \(have\.cy0 \?\? g\.cy\)\) > 12 \* sc/);
  assert.match(M, /skinN\+\+/);
});
