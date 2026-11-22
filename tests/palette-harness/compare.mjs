// v250: before / after check over ALL pictures. usage: node compare.mjs pal_OLD.json pal_NEW.json   (both made by run.mjs with the same frames.json, one with the old code, one with the new)
// Prints every picture whose palette changed (colour or share). A palette change must be wanted: 0 changes on the owner's pictures except the one you target. (Session 3: a Tidy "accent stays" rule changed 4 of 25 and was reverted.)
import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync(process.argv[2])), b = JSON.parse(fs.readFileSync(process.argv[3]));
const k = c => [c.L, c.a, c.b].map(v => v.toFixed(3)).join(',') + '|' + (c.share * 100).toFixed(1);
let changed = 0; for (const n of Object.keys(a)) { if (a[n].pal.map(k).join(';') !== b[n].pal.map(k).join(';')) { changed++; console.log('CHANGED', n, a[n].pal.length, '->', b[n].pal.length); } }
console.log('pictures', Object.keys(a).length, 'changed', changed);
