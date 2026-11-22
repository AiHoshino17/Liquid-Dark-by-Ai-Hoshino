import fs from 'node:fs';
const { detailFromFrames, HI } = await import((process.argv[2]||'/home/claude/w')+'/src/tintdetail.js');
const root = process.argv[2] || '/home/claude/w';
const M = fs.readFileSync(root + '/src/main.js', 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto, tintPaletteGrad };')(detailFromFrames, HI);
const fr = JSON.parse(fs.readFileSync('/home/claude/harness/frames.json'));
const res = {};
for (const [n, o] of Object.entries(fr)) {
  const d = new Uint8ClampedArray(o.p32); const f96 = new Uint8ClampedArray(o.p96), f192 = new Uint8ClampedArray(o.p192);
  d.hi = { frames: [f96], w: [1], eyeFrames: [f192] }; if (o.eyeHi) d.hi.eyeHi = [{ d: new Uint8ClampedArray(o.eyeHi.d), w: o.eyeHi.w, h: o.eyeHi.h, fi: 0 }]; d.hi.detail = detailFromFrames(d.hi.frames, [1]);
  const pal = F.tintPaletteAuto(d);
  let css=''; try{ css = F.tintPaletteGrad(pal); }catch(e){ css='ERR '+e.message; }
  res[n] = { css, pal: pal.map(c => ({ L: c.L, a: c.a, b: c.b, share: c.share, x: c.x, y: c.y, x2: c.x2, y2: c.y2, flags: ['eye','extra','hair','gap','cover','dn'].filter(k => c[k]).join(',') })) };
}
fs.writeFileSync('/home/claude/harness/pal_' + (process.argv[3] || 'out') + '.json', JSON.stringify(res));
for (const [n, p] of Object.entries(res)) { console.log(n, p.pal.length, String(p.css).slice(0,90)); }
