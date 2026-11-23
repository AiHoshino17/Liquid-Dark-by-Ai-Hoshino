// v294 (owner): new lyrics background "Apple gradient": soft drifting blobs of the picture's biggest colours (picture / GIF you set > original cover).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const C = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const IO = readFileSync(new URL('../src/settingsio.js', import.meta.url), 'utf8');
test('v294 style wiring: a 6th choice, its own setting (exported), key, data attribute', () => {
  assert.match(M, /apple: 'Apple gradient: soft, slowly moving colours taken from the picture or GIF you set for the song or album, else its original cover, white lyrics'/);
  assert.match(M, /lyricApple: false/); assert.match(IO, /lyricApple: 'Lyrics: Apple gradient'/);
  assert.match(M, /set\.lyricBg \|\| \(set\.lyricApple === true \? 'apple' : 'palette'\)/);
  assert.match(M, /set\.lyricApple = b\.dataset\.v === 'apple';/);
  assert.match(M, /h\.dataset\.lyapple = /);
});
test('v294 colours: the 4 biggest palette colours, mid lightness for white lyrics; layer added / removed with the style; old song colours cleared', () => {
  const src = M.slice(M.indexOf('const labHex ='), M.indexOf('function lyPaint('));
  const F = new Function(src + 'return { labHex, lyApColours };')();
  assert.equal(F.labHex(1, 0, 0), '#ffffff'); assert.equal(F.labHex(0, 0, 0), '#000000');
  const pal = [{ L: .9, a: .1, b: .05, share: .1 }, { L: .2, a: -.05, b: -.1, share: .5 }, { L: .5, a: 0, b: .1, share: .3 }];
  const out = F.lyApColours({ pal, a: '#111111', b: '#222222', c: '#333333' });
  assert.equal(out.length, 4); assert.ok(out.every(h => /^#[0-9a-f]{6}$/.test(h)));
  assert.deepEqual(F.lyApColours({ pal: [] }), ['#3a3a44', '#26262e', '#4a4a56', '#1c1c22']);
  assert.match(M, /lyBlurSync\(el, t\); lyBgSync\(el, t\); lyApSync\(el\);/);
  assert.match(M, /el\.innerHTML = `\$\{lyApHtml\(\)\}/);
  assert.match(M, /for \(const n of \['--ap1', '--ap2', '--ap3', '--ap4'\]\) el\.style\.removeProperty\(n\);/);
  assert.ok(C.includes('.lyr-apl{position:absolute;inset:0;overflow:hidden;z-index:-1') && C.includes('html[data-motion="reduce"] .lyr-apl i{animation:none}'));
});
