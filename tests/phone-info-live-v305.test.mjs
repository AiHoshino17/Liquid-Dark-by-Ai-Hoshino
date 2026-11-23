// v305 (owner: "the live RAM / CPU data is wrong, especially on Oppo / OnePlus; look how real apps show it"): RAM from /proc/meminfo (MemTotal / MemAvailable,
// swap = zram + RAM expansion); CPU = every core's current speed against its max (apps may not read /proc/stat since Android 8, like DevCheck / CPU-Z); every 500 ms.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const M = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const J = readFileSync(new URL('../native-android/LiquidNative.java', import.meta.url), 'utf8');
const F = new Function(M.slice(M.indexOf('const NOMINAL_GB'), M.indexOf('let cpuPct = null')) + 'return { nominalGb, gbk, memOf, cpuLoad, ghz };')();
test('v305 native: /proc/meminfo + per-core scaling_cur_freq / cpuinfo_max_freq, braces balance', () => {
  assert.match(J, /new java\.io\.FileReader\("\/proc\/meminfo"\)/);
  for (const k of ['memTotalKb', 'memAvailKb', 'swapTotalKb', 'swapFreeKb', 'coreFreq', 'model']) assert.ok(J.includes(`"${k}"`), k);
  assert.match(J, /long cur = sysLong\(base \+ "cpufreq\/scaling_cur_freq"\);/); assert.match(J, /long max = sysLong\(base \+ "cpufreq\/cpuinfo_max_freq"\); if \(max <= 0\) max = sysLong\(base \+ "cpufreq\/scaling_max_freq"\);/);   // v306 layout
  assert.equal((J.match(/\{/g) || []).length, (J.match(/\}/g) || []).length);
});
test('v305 numbers: used = total - available, nominal size, load = average core speed share (asleep core = 0)', () => {
  assert.equal(F.nominalGb(11534336), 12); assert.equal(F.nominalGb(7.4 * 1048576), 8); assert.equal(F.nominalGb(3.6 * 1048576), 4);
  const m = F.memOf({ memTotalKb: 8e6, memAvailKb: 3e6, swapTotalKb: 4e6, swapFreeKb: 3e6 }); assert.equal(m.tot - m.av, 5e6);
  assert.deepEqual(F.memOf({ ramMb: 4096, availMb: 1024 }), { tot: 4194304, av: 1048576, swT: 0, swF: 0 }, 'falls back to ActivityManager');
  assert.equal(F.cpuLoad({ coreFreq: [{ cur: 1e6, max: 2e6 }, { cur: 0, max: 2e6 }, { cur: 2e6, max: 2e6 }] }), 50);
  assert.equal(F.cpuLoad({ coreFreq: [{ cur: -1, max: -1 }] }), null, 'hidden speeds = no number, not a wrong one');
  assert.equal(F.ghz(1804800), '1.80 GHz'); assert.equal(F.ghz(600000), '600 MHz'); assert.equal(F.ghz(0), 'asleep');
});
test('v305 live: every 500 ms, only while Phone info is open and the app is visible', () => {
  assert.match(M, /if \(document\.hidden \|\| ramBusy\) return; const top = stack\[stack\.length - 1\]; if \(!top \|\| top\.t !== 'phoneinfo' \|\| !document\.getElementById\('lf-dev'\)\) return;/);
  assert.match(M, /\.finally\(\(\) => \{ ramBusy = false; \}\); \}, 500\);/);
});
const G = new Function(M.slice(M.indexOf('const NOMINAL_GB'), M.indexOf('let cpuPct = null')) + 'return { cpuLoad, coreKind, battNowMa, THERMAL };')();
test('v306 wide support: fallbacks per core (cpuinfo_cur_freq, the cluster policy), online, cpu_capacity, time_in_state average', () => {
  assert.match(J, /if \(cur < 0\) cur = sysLong\(base \+ "cpufreq\/cpuinfo_cur_freq"\); if \(cur < 0 && pol != null\) cur = sysLong\(pol \+ "\/scaling_cur_freq"\);/);
  assert.match(J, /related_cpus/); assert.match(J, /affected_cpus/); assert.match(J, /"\/stats\/time_in_state"/); assert.match(J, /c\.put\("cap", sysLong\(base \+ "cpu_capacity"\)\)/);
  assert.match(J, /long on = i == 0 \? 1 : sysLong\(base \+ "online"\);/);
  assert.equal((J.match(/\{/g) || []).length, (J.match(/\}/g) || []).length);
  // cluster average wins over the instant speed; an off core counts as 0
  assert.equal(G.cpuLoad({ policies: [{ cpus: [0, 1], max: 2e6, avg: 1e6 }, { cpus: [2, 3], max: 2e6, avg: 2e6 }], coreFreq: [] }), 75);
  assert.equal(G.cpuLoad({ coreFreq: [{ cur: 2e6, max: 2e6 }, { cur: 2e6, max: 2e6, online: false }] }), 50);
  const d = { coreFreq: [{ cap: 325 }, { cap: 325 }, { cap: 822 }, { cap: 822 }, { cap: 1024 }] };
  assert.deepEqual([0, 2, 4].map(i => G.coreKind(d, i)), ['Eff', 'Perf', 'Prime']); assert.equal(G.coreKind({ coreFreq: [{ cap: 1 }, { cap: 1 }] }, 0), '', 'all the same: no label');
});
test('v306 battery + heat + app memory: public APIs, current in µA or mA, thermal names', () => {
  for (const k of ['battTemp', 'battMv', 'battPct', 'plugged', 'battNow', 'thermal', 'headroom', 'appPssKb']) assert.ok(J.includes(`"${k}"`), k);
  assert.match(J, /Build\.VERSION\.SDK_INT >= 33 \? getContext\(\)\.registerReceiver\(null, bf, Context\.RECEIVER_NOT_EXPORTED\) : getContext\(\)\.registerReceiver\(null, bf\)/);
  assert.match(J, /SDK_INT >= 29\) o\.put\("thermal"/); assert.match(J, /SDK_INT >= 30\) \{ float h = pm\.getThermalHeadroom\(10\)/);
  assert.equal(G.battNowMa({ battNow: -412000 }), -412); assert.equal(G.battNowMa({ battNow: 850 }), 850); assert.equal(G.battNowMa({}), null);
  assert.equal(G.THERMAL[0], 'Cool'); assert.equal(G.THERMAL.length, 7);
});
