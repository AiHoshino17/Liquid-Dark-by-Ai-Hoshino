// v250: runs the real palette code on an ANIMATED picture the way the app feeds it (all frames at 32 px, 24 kept at 96 / 192 px). usage: node --import <project>/tests/register.mjs run_anim.mjs <project> NAME
import fs from 'node:fs';
const root = process.argv[2] || '/home/claude/w', name = process.argv[3] || 'ai';
const { detailFromFrames, HI } = await import(root + '/src/tintdetail.js');
const M = fs.readFileSync(root + '/src/main.js', 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteGrad };')(detailFromFrames, HI);
const o = JSON.parse(fs.readFileSync('/home/claude/harness/anim_' + name + '.json'));
const d = new Uint8ClampedArray(o.p32.length * 4096); o.p32.forEach((f, i) => d.set(f, i * 4096)); d.fw = o.w;
const hf = o.p96.map(f => new Uint8ClampedArray(f));
d.hi = { frames: [], w: [], hueFrames: hf, hueW: o.kw, eyeFrames: o.p192.map(f => new Uint8ClampedArray(f)), eyeHi: (o.eyeHi || []).map(e => ({ d: new Uint8ClampedArray(e.d), w: e.w, h: e.h, fi: e.fi })) }; d.hi.detail = detailFromFrames(hf, o.kw);
const pal = F.tintPaletteAuto(d); let css = ''; try { css = F.tintPaletteGrad(pal); } catch (e) { css = 'ERR ' + e.message; }
const out = pal.map(c => ({ L: c.L, a: c.a, b: c.b, share: c.share, x: c.x, y: c.y, x2: c.x2, y2: c.y2, fi: c.fi, flags: ['eye', 'extra', 'hair', 'gap', 'cover', 'dn', 'vivid', 'mf'].filter(k => c[k]).join(',') }));
fs.writeFileSync('/home/claude/harness/animpal_' + name + '.json', JSON.stringify({ css, pal: out }));
console.log(name, pal.length, 'colours;', css.startsWith('ERR') ? css : 'gradient ok (' + css.length + ' chars)');
out.forEach((c, i) => console.log(i + 1, (c.share * 100).toFixed(2) + '%', c.flags, c.x == null ? '-' : c.x.toFixed(2) + ',' + c.y.toFixed(2), c.x2 != null ? '2nd ' + c.x2.toFixed(2) + ',' + c.y2.toFixed(2) : ''));
