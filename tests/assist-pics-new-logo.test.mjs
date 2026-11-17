// The accessibility-card tutorial screenshots a4, a5, c1, c2 were retaken with the NEW app logo (the old logo is gone from them).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSIST_PICS, ASSIST_ALT } from '../src/assistpics.js';

function jpegSize(dataUri) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUri); assert.ok(m, 'a JPEG data URI');
  const b = Buffer.from(m[1], 'base64'); assert.equal(b[0], 0xff); assert.equal(b[1], 0xd8);
  let i = 2;
  while (i < b.length) {
    assert.equal(b[i], 0xff); const t = b[i + 1], len = b.readUInt16BE(i + 2);
    if (t >= 0xc0 && t <= 0xc3) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  assert.fail('no size marker');
}

test('the four retaken screenshots are valid 300 px wide JPEGs with an alt text', () => {
  for (const k of ['a4', 'a5', 'c1', 'c2']) {
    const s = jpegSize(ASSIST_PICS[k]);
    assert.equal(s.w, 300, k); assert.ok(s.h > 150 && s.h < 700, k + ' height ' + s.h);
    assert.ok(ASSIST_ALT[k], k + ' has an alt text');
  }
});

test('every step picture used by the cards still exists', () => {
  for (const k of ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2', 'c1', 'c2', 's1']) assert.ok(ASSIST_PICS[k], k);
});
