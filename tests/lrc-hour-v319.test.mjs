// v319 (bug sweep): LRC stamps past one hour ([h:mm:ss.xx]) and stamps with spaces ([ 00:01.00 ]) were left in the lyric text with the wrong time.
import test from 'node:test'; import assert from 'node:assert/strict';
import { parseLrc, toSec } from '../src/lrc.js';
test('[h:mm:ss.xx] stamps', () => {
  assert.equal(toSec('1:02:03.50'), 3723.5); assert.equal(toSec('1:62:03.50'), null); assert.equal(toSec('00:01:50'), 1.5);   // [mm:ss:xx] keeps its old meaning
  const r = parseLrc('[59:58.00]a\n[1:00:02.25]b\n[1:00:05.00]<1:00:05.00>wo<1:00:05.80>rd');
  assert.deepEqual(r.lines.map(l => [l.t, l.text]), [[3598, 'a'], [3602.25, 'b'], [3605, 'word']]);
  assert.deepEqual(r.lines[2].words.map(w => w.t), [3605, 3605.8]);
});
test('[ 00:01.00 ] with spaces', () => {
  assert.deepEqual(parseLrc('[ 00:01.00 ]x\n[00:02.00 ]y').lines.map(l => [l.t, l.text]), [[1, 'x'], [2, 'y']]);
});
