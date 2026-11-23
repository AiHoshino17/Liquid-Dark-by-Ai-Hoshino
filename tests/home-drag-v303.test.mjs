// v303 (owner: "remove the up and down arrows everywhere; drag and drop like the icon customization, and tell users"): Home quick buttons, sections and
// custom section items now use a drag handle (☰) with a one-line help; the arrows stay only as hidden buttons for TalkBack (like Up Next and playlists).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
test('v303 no visible arrows: every arrow button is .sr (TalkBack only) and comes with a drag handle', () => {
  const vis = [...M.matchAll(/<button class="([^"]*)"[^>]*data-act="(hs-up|hs-dn|hs-qup|hs-qdn|hs-cup|hs-cdn|q-up|q-down|pl-up|pl-down|tabmv)"/g)].filter(m => !/\bsr\b/.test(m[1]));
  assert.deepEqual(vis.map(m => m[2]), [], 'no arrow button is visible');
  assert.match(M, /const arrows = \(up, dn, k, i, n, label\) => `<button class="gbtn sm dh grip" data-drag="1"/);
  assert.match(M, /const ar = \(it, i\) => \{[^\n]*<button class="gbtn sm dh grip" data-drag="1"/);
});
test('v303 rows are draggable lists with a help line, and a drop reorders and saves', () => {
  assert.match(M, /data-dkind="hq" data-drow="\$\{i\}"/); assert.match(M, /data-dkind="hs" data-drow="\$\{i\}"/); assert.match(M, /data-dkind="hc" data-drow="\$\{i\}" data-p="\$\{pn\.id\}"/);
  assert.ok((M.match(/Hold ☰ and drag a row up or down, then let go\. It saves by itself\./g) || []).length >= 3);
  assert.match(M, /if \(kind === 'hq'\) \{ const k = h\.qb\[from\]; for \(let n = 0; n < Math\.abs\(to - from\); n\+\+\) h = moveQuick\(h, k, dir\); \}/);
  assert.match(M, /set\.home = h; applySettings\(\); renderSub\(true\); renderMain\(\);/);
  assert.match(M, /if \(kind !== 'q'\) \$\('#app'\)\.classList\.add\('dragmode'\)/, 'the bars fade while a row is dragged');
});
