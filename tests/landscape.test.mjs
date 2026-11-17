import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const rd = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('landscape: the install script no longer locks the app to portrait', () => {
  const s = rd('../scripts/install-native.sh');
  assert.ok(!s.includes('screenOrientation="portrait"'));
  assert.ok(s.includes('screenOrientation="fullUser"'));
  assert.ok(s.includes('configChanges'));
});

test('landscape: the manifest patch turns an old portrait lock into fullUser and keeps configChanges (no restart on rotate)', () => {
  const s = rd('../scripts/install-native.sh');
  const a = s.indexOf("m = 'android/app/src/main/AndroidManifest.xml'; s = open(m).read()\nif 'android:name=\".MainActivity\"' in s:");
  const b = s.indexOf('# v119 part 2');
  assert.ok(a > 0 && b > a, 'manifest block found');
  const dir = mkdtempSync(join(tmpdir(), 'lf-land-'));
  mkdirSync(join(dir, 'android/app/src/main'), { recursive: true });
  const mf = join(dir, 'android/app/src/main/AndroidManifest.xml');
  for (const start of ['android:name=".MainActivity" android:screenOrientation="portrait"', 'android:name=".MainActivity" android:configChanges="orientation"', 'android:name=".MainActivity"']) {
    writeFileSync(mf, `<manifest><application><activity ${start}></activity></application></manifest>`);
    const py = 'import re\n' + s.slice(a, b);
    try { execFileSync('python3', ['-I', '-c', py], { cwd: dir }); } catch (e) { assert.fail('python3 unavailable or patch failed: ' + e.message); }
    const out = readFileSync(mf, 'utf8');
    assert.ok(out.includes('android:screenOrientation="fullUser"'), out);
    assert.ok(!out.includes('"portrait"'), out);
    for (const k of ['orientation', 'screenSize', 'smallestScreenSize', 'screenLayout']) assert.match(out, new RegExp('configChanges="[^"]*\\b' + k + '\\b'), out);
  }
});

test('landscape: the build check wants fullUser + configChanges', () => {
  const s = rd('../scripts/verify-native-patches.py');
  assert.ok(s.includes('android:screenOrientation=\\"fullUser\\"') || s.includes("android:screenOrientation=\"fullUser\""));
  assert.ok(s.includes('android:configChanges'));
  assert.ok(!s.includes("'portrait lock'"));
});

test('landscape: left / right insets travel from MainActivity to the page', () => {
  const act = rd('../native-android/MainActivity.java'), nat = rd('../native-android/LiquidNative.java'), main = rd('../src/main.js'), tok = rd('../src/styles/tokens.css');
  assert.ok(act.includes('insetLeft') && act.includes('insetRight') && act.includes('left:" + insetLeft'));
  assert.ok(nat.includes('MainActivity.insetLeft') && nat.includes('MainActivity.insetRight'));
  assert.ok(main.includes("'--sal'") && main.includes("'--sar'"));
  assert.ok(tok.includes('--sal:') && tok.includes('--sar:'));
});

test('landscape: one media block holds the landscape rules, phones only, portrait untouched', () => {
  const css = rd('../src/styles/app.css');
  const i = css.indexOf('v209: LANDSCAPE');
  assert.ok(i > 0);
  const tail = css.slice(i);
  assert.ok(tail.includes('@media (orientation:landscape) and (max-height:560px){'));
  // the block is balanced and is the last thing in the file
  const open = (tail.match(/\{/g) || []).length, close = (tail.match(/\}/g) || []).length;
  assert.equal(open, close);
  assert.ok(!/orientation\s*:\s*portrait/.test(css), 'no portrait-only rule');
  for (const k of ['.np .art', '.tabbar', '.mini', '.lyr', '--sal', '--sar', '#sheet .sheetbox']) assert.ok(tail.includes(k), k);
});

test('landscape v217: popups scroll, use the --sat/--sab/--sal/--sar insets, and the Now Playing column is made by padding', () => {
  const css = rd('../src/styles/app.css'), as = rd('../src/assist.js');
  assert.ok(!css.includes('env(safe-area-inset-top)) 22px'), 'popcard / bgallow no longer use env() insets');
  assert.match(css, /notifcard\{[^}]*overflow-y:auto[^}]*max-height:calc\(100% - var\(--sat\)/);
  assert.match(css, /popcard\{[^}]*overflow-y:auto/);
  assert.match(css, /#lf-bgallow\{[^}]*overflow-y:auto/);
  const land = css.slice(css.indexOf('@media (orientation:landscape) and (max-height:560px){'));
  assert.ok(!land.includes('.np>*:not(.glow):not(.art):not(.grabbtn){margin-left'), 'no margin-left on every child');
  assert.ok(land.includes('min-height:32px'), 'close strip tap area');
  assert.ok(land.includes('max(calc(var(--sal) + 12px)'), 'sheet side gaps respect the cut-out');
  assert.ok(land.includes('.picklist,.qlist,.infobox{max-height:none'), 'no nested scroll in sheets');
  assert.ok(land.includes('max-height:340px') && land.includes('max-width:720px') && land.includes('max-height:420px'));
  assert.ok(as.includes('max(24px,var(--sal))'), 'assist cards respect the side insets');
});
