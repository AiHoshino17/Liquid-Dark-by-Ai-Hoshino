import { readFileSync } from 'node:fs';
const D = await import('/home/claude/w/src/tintdetail.js'); const HI = 96;
const load = f => { const b = readFileSync(f); const n = b.length / (HI * HI * 4); return Array.from({ length: n }, (_, i) => new Uint8ClampedArray(b.buffer.slice(b.byteOffset + i * HI * HI * 4, b.byteOffset + (i + 1) * HI * HI * 4))); };
const pics = ['bedgirl_crop', 'pair_crop', 'banner', 'c12', 'c13', 'c62', 'c63', 'p2'].map(n => [n, load('f_' + n + '.raw')]);
const ai = load('f_aigif.raw'); const sigs = ai.map(x => D.frameSig(x, HI)), k = D.pickKeyFrames(sigs, 12, .02); pics.push(['aigif', k.map(x => ai[x.i]), k.map(x => x.w)]);
const hit = (hd, x0, x1, y0, y1) => { let m = 0; for (const T of [hd.acc, hd.acc2]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m = Math.max(m, T.cov[y * hd.n + x]); return m > .01 ? 1 : 0; };
const run = o => { Object.assign(D.ACC, o); const r = {}; let tot = 0, edge = 0; for (const [n, f, w] of pics) { const hd = D.detailFromFrames(f, w || null, HI, 16); let c = 0; for (const T of [hd.acc, hd.acc2]) for (let k = 0; k < 256; k++) if (T.cov[k] > .01) { c++; const x = k % 16; if (x < 2 || x > 13) edge++; } r[n] = c; tot += c; if (n === 'bedgirl_crop') r.blush = hit(hd, 7, 8, 8, 9); if (n === 'pair_crop') { r.earring = hit(hd, 9, 10, 10, 11); r.eye = hit(hd, 5, 6, 2, 4); r.wall = hit(hd, 13, 15, 0, 6); } } r.tot = tot; r.edge = edge; return r; };
const base = { ...D.ACC }; const rows = {};
rows.base = run({});
for (const [name, o] of Object.entries({ sup6: { sup: 6 }, cap8: { cap: .08 }, cap14: { cap: .14 }, cap20: { cap: .2 }, nocap: { cap: 9 } })) { Object.assign(D.ACC, base); rows[name] = run(o); }
console.table(rows);
