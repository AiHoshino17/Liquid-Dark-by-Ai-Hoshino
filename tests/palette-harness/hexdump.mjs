import fs from 'node:fs';
const f = process.argv[2]; const r = JSON.parse(fs.readFileSync(f));
const lin = v => v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055;
function hex(L, a, b) { const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3; const c = [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s].map(v => Math.round(255 * lin(Math.max(0, Math.min(1, v))))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); }
for (const [n, o] of Object.entries(r)) { const p = o.pal; console.log('==', n); p.forEach((c, i) => console.log(i + 1, hex(c.L, c.a, c.b), (c.share * 100).toFixed(1) + '%', c.flags, c.x.toFixed(2), c.y.toFixed(2))); }
