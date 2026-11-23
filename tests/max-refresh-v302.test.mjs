// v302 (owner): the app asks for the screen's highest refresh rate (90 / 120 / 144 Hz ...), at start and every time it comes back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const J = readFileSync(new URL('../native-android/MainActivity.java', import.meta.url), 'utf8');
test('v302 highest refresh rate: same resolution, highest Hz, set on create and resume', () => {
  assert.match(J, /private void maxRefresh\(\) \{/);
  assert.match(J, /m\.getPhysicalWidth\(\) == cur\.getPhysicalWidth\(\) && m\.getPhysicalHeight\(\) == cur\.getPhysicalHeight\(\) && m\.getRefreshRate\(\) > best\.getRefreshRate\(\)/);
  assert.match(J, /lp\.preferredDisplayModeId = best\.getModeId\(\)/);
  assert.match(J, /lp\.preferredRefreshRate = best\.getRefreshRate\(\)/);
  assert.equal((J.match(/maxRefresh\(\);/g) || []).length, 2, 'onCreate + onResume');
  assert.equal((J.match(/\{/g) || []).length, (J.match(/\}/g) || []).length, 'braces balance');
});
