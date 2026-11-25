// v307 (owner): Apple Music style lyrics header (cover, song, artist, heart = Favourites, ⋯ = the song menu), on / off, cover = yours or the original.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
test('v307 header: on by default, off = the old bar, cover yours or original, exported', () => {
  assert.match(M, /lyHead: true, lyHeadArt: 'custom',/);
  assert.match(M, /if \(set\.lyHead === false\) return `<div class="lyr-top"><button class="gbtn" data-act="lyr-close">/);
  assert.match(M, /const lyHeadArt = t => set\.lyHeadArt === 'original' \? trackAlbum\(t\)\.g : gOfT\(t\);/);
  assert.match(M, /\$\{lyTopHtml\(t\)\}<div class="lyr-body" id="lyrbody">/, 'the same header for every background (it sits above all of them)');
  assert.match(readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8'), /lyHead: 'Lyrics: Apple style header', lyHeadArt: /);
});
test('v307 heart = Favourites (kept in step), ⋯ = the existing song menu; readable with black text too', () => {
  assert.match(M, /case 'lyh-fav': \{ const c = Native\.current\(\); if \(c\) favToggle\(c\.id\);/);   // v308: favToggle lights the heart
  assert.match(M, /case 'lyh-more': \{ const c = Native\.current\(\); if \(c\) trackMenuSheet\(c\); break; \}/);
  assert.match(M, /const h = document\.querySelector\('#lyr \.lyh-fav'\), c = Native\.current\(\); if \(h && c\) \{ h\.classList\.toggle\('on'/);
  assert.ok(C.includes('html[data-lyink="black"] .lyh-t b{color:#000}') && C.includes('.lyh-fav.on{color:var(--accent)'));
});
