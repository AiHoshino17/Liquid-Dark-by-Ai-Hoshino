import fs from 'node:fs';
import { detailFromFrames, HI } from '/home/claude/w/src/tintdetail.js';
let M = fs.readFileSync('/home/claude/w/src/main.js', 'utf8');
const blk = M.slice(M.indexOf('/* v223+: COVER COLOUR MIX'), M.indexOf('/* v223+ end */'));
const F = new Function('detailFromFrames', 'DET_HI', blk + ';return { tintPaletteAuto };')(detailFromFrames, HI);
const fr = JSON.parse(fs.readFileSync('frames.json'));
for (const [n, o] of Object.entries(fr)) { const d = new Uint8ClampedArray(o.p32); d.hi = { frames: [new Uint8ClampedArray(o.p96)], w: [1], eyeFrames: [new Uint8ClampedArray(o.p192)] }; d.hi.detail = detailFromFrames(d.hi.frames, [1]); const pal = F.tintPaletteAuto(d); console.log(n.padEnd(11), pal.length, pal.filter(c => c.eye).map(c => `eye@${c.x.toFixed(2)},${c.y.toFixed(2)} L${c.L.toFixed(2)} h${((Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360).toFixed(0)} c${Math.hypot(c.a, c.b).toFixed(2)}`).join(' | ')); }
