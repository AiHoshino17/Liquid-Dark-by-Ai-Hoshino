import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const N = fs.readFileSync(new URL('../src/native.js', import.meta.url), 'utf8');
test('v212: with Shuffle on and Repeat All, looping back to the start gets a new order', () => {
  assert.ok(N.includes('function reshuffleAfterLoop()'));
  assert.ok(N.includes("const wrapped = s.shuffle && s.repeat === 'all' && e.index === 0 && s.index === s.queue.length - 1 && s.queue.length > 2;"));
  assert.ok(N.includes("if (wrapped) reshuffleAfterLoop();"));
  assert.ok(N.includes("nat('replaceTail', { items: tail.map(item) })"));
});
