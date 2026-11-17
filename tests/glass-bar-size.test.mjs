import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('the size setting is called "Glass bar size" in Settings and in the Animation screen, never "Tab bar size"', () => {
  assert.ok(!/Tab bar size/.test(main), 'no "Tab bar size" label is left in src/main.js');
  assert.equal((main.match(/Glass bar size<(span|em)/g) || []).length, 1, 'one slider, in the Animation screen only (not in Display options)');
});

test('the Animation screen has its own Glass bar size slider that drives the same setting (tabPct) and keeps its % label in sync', () => {
  const anim = main.slice(main.indexOf('animation: () =>'), main.indexOf('lysize: () =>'));
  assert.ok(anim.indexOf('data-tabpct') < anim.indexOf('animchips') + anim.slice(anim.indexOf('animchips')).indexOf('</div></div>') + 12, 'the slider is inside the pinned .animdock, next to the test bar');
  assert.match(anim, /data-tabpct[^>]*value="\$\{set\.tabPct\}"/);
  assert.match(anim, /data-tabv>\$\{set\.tabPct\}%/);
  assert.match(main, /querySelectorAll\('\[data-tabv\]'\)/);
});

test('Glass bar size (tabPct) is in the settings export and comes back on import', async () => {
  const { buildExport, exportText, parseImport, mergeSettings, pickSettings } = await import('../src/settingsio.js');
  const ex = buildExport({ tabPct: 72 }, {}, '0.208.0', new Date());
  assert.equal(ex.settings.tabPct, 72, 'the export holds the glass bar size');
  const parsed = parseImport(exportText(ex));
  assert.equal(parsed.settings.tabPct, 72, 'the import reads it back');
  assert.equal(mergeSettings({ tabPct: 100 }, pickSettings(parsed.settings, ['tabPct'])).tabPct, 72, 'the import applies it');
});
