/* v231: DETAIL PASS for the cover colour mix (lyrics background) + smart frame picking for GIF / animated WebP / Canvas video.
   WHY: the old read was 32x32 pixels, then a 6x6 grid of AVERAGES. A faint blush (0.35% of a picture, hue 9 deg on skin of hue 38 deg) is 3 to 4 pixels there, mixed with skin and hair, and an average of blue stripes and orange hair is a muddy tan.
   v231 WHY (continued): v226's gates were tuned for a TINY, SHARP, isolated detail (a stray strand, an earring). Two things in real covers slipped through:
     1) a soft, airbrushed blush (or a painted iris with its own internal shading) is not a tiny sharp dot - it blends gradually into its surroundings (low contrast against the blurred neighbourhood, dC) and a shaded iris is not perfectly flat (std/sup expect a smooth patch). Measured against real art: a faint cheek blush can sit at dC ~0.014-0.03 and an iris at c ~0.013-0.05 with support as low as 3/8 - all previously rejected. dC0/c0/std/sup/lmin are loosened below to let these through; sh0/sh1 (how large the patch is allowed to be) are left alone on purpose - loosening them let whole swaths of ordinary hair/skin texture read as "accents" too (caught by the test suite), so the per-cell budget (cap) and the strong-mark path are still what keeps that noise out.
     2) two different SHADES of the same hue family close together (a bright coat red and a darker blood red - both "red") used to be swallowed into one accent slot, because a second accent only counted as distinct if it was a full 60 deg away in hue. It now only needs 30 deg, so a close-but-clearly-different second red can hold the cell's acc2 slot instead of losing out to the first.
   WHAT (pure functions, no DOM, so they run in Node tests and in the lab on real frames):
   - detailFromFrames(frames, weights): frames are HI x HI RGBA pictures (96x96). Per cell of a 6x6 grid it returns the DOMINANT colour (hue-aware: the biggest hue family of that cell, NOT an average of all pixels, so blue + orange do not become tan) and an ACCENT colour: small smooth areas whose hue / chroma differs from their surroundings (a blush on skin, a coloured earring, red lips), found by comparing every pixel with a blurred copy of its neighbourhood, so a tiny area is seen however small it is.
   - pickCandidates(n, cap) / pickKeyFrames(sigs, keep): which frames of a GIF to read, and how much each counts (short GIF = every frame; a long one = up to 40 spread over the whole run, then the most different ones, each weighted by how many frames it stands for, so a scene that lasts 80% of the GIF counts 80%).
   main.js uses these only to ADD detail: tintMeshFromPixels(d) with no detail behaves exactly as in v223. */
export const HI = 96;           // side of the detail picture (pixels)
export const CELLS = 16;        // the snapshot / accent grid (the v223 mesh is 6x6; v226: 16x16 = 6 px cells of the 96 px frame, finer than the 12x12 of v225, so a cheek or an earring keeps its own small place and the accent is spread over few neighbours instead of a big block)
export const ACC = { dC0: .017, dC1: .06, c0: .021, c1: .05, std: .045, sup: 6, lmin: .2, lmax: .97, gap0: 10, gap1: 24, sh0: .22, sh1: .45, strongDC: .09, strongC: .08, strongStd: .12, strongSup: 3, cap: .11 };   // v231: dC0/c0 (.025/.03 -> .017/.021) loosened so a faint, low-contrast blush or a softly-shaded iris clears the signal-strength gate; std (.035 -> .045) and sup (7 -> 6) loosened just enough for a shaded (not perfectly flat) iris, no further - pushing either past this (or loosening sh0/sh1, the how-big-can-the-patch-be test) let whole swaths of ordinary hair texture register as "accents" too, which the test suite's plain-face and stripe cases catch; lmin (.3 -> .2) lets a dark iris in low-key art through. sh0/sh1 and the strong* path are UNCHANGED - a real accent still has to stay a small, contained patch, which is what keeps hair/background noise out.
const NB = 12;                  // hue families (30 deg each) + 1 neutral bin
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const v = i / 255; LIN[i] = v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }
const sm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
const hueOf = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
export const hueGap = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };

export function toLabPlanes(d, S = HI) {   // RGBA -> OKLab planes (L, a, b) + alpha
  const n = S * S, L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), al = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4, R = LIN[d[o]], G = LIN[d[o + 1]], Bl = LIN[d[o + 2]];
    const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * Bl), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * Bl), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * Bl);
    L[i] = .2104542553 * l + .793617785 * m - .0040720468 * s; A[i] = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s; B[i] = .0259040371 * l + .7827717662 * m - .808675766 * s; al[i] = d[o + 3] / 255;
  }
  return { L, A, B, al };
}
function boxMean(p, S, r) {   // mean over a (2r+1) square, edges clamped (summed-area table)
  const W = S + 1, T = new Float64Array(W * W);
  for (let y = 0; y < S; y++) { let row = 0; for (let x = 0; x < S; x++) { row += p[y * S + x]; T[(y + 1) * W + x + 1] = T[y * W + x + 1] + row; } }
  const o = new Float32Array(S * S);
  for (let y = 0; y < S; y++) { const y0 = Math.max(0, y - r), y1 = Math.min(S - 1, y + r); for (let x = 0; x < S; x++) { const x0 = Math.max(0, x - r), x1 = Math.min(S - 1, x + r); o[y * S + x] = (T[(y1 + 1) * W + x1 + 1] - T[y0 * W + x1 + 1] - T[(y1 + 1) * W + x0] + T[y0 * W + x0]) / ((y1 - y0 + 1) * (x1 - x0 + 1)); } }
  return o;
}
export function detailAccumulator(S = HI, N = CELLS, dbg = null) {   // v230: the same detail pass, but frames are fed ONE AT A TIME (add) and the result is read at the end (done). Nothing is kept per frame, so a GIF of any length (thousands of frames) costs the same memory as one picture. dbg (optional Float32Array S*S): receives the accent strength of the first frame, for the lab / tests
  const NN = N * N, bw = new Float64Array(NN * (NB + 1)), bL = new Float64Array(NN * (NB + 1)), bA = new Float64Array(NN * (NB + 1)), bB = new Float64Array(NN * (NB + 1));
  const aw = new Float64Array(NN * NB), aL = new Float64Array(NN * NB), aA = new Float64Array(NN * NB), aB = new Float64Array(NN * NB), cnt = new Float64Array(NN), mL = new Float64Array(NN), mA = new Float64Array(NN), mB = new Float64Array(NN);
  const r = Math.max(4, Math.round(S / 9)), cell = x => Math.min(N - 1, Math.floor(x * N / S));
  let used = 0, fi = -1;
  const add = (d, weight) => {   // weight = how long / how much this frame counts (default 1)
    fi++;
    if (!d || d.length < S * S * 4) return;
    const wf = weight > 0 ? weight : 1; used++;
    const { L, A, B, al } = toLabPlanes(d, S), bgA = boxMean(A, S, r), bgB = boxMean(B, S, r);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = y * S + x; if (al[i] < .06) continue;
      const k = cell(y) * N + cell(x), l = L[i], a = A[i], b = B[i], c = Math.hypot(a, b); cnt[k] += wf * al[i]; mL[k] += wf * al[i] * l; mA[k] += wf * al[i] * a; mB[k] += wf * al[i] * b;   // the plain average colour of the cell = the snapshot
      const bin = c < .012 ? NB : Math.floor(hueOf(a, b) / (360 / NB)) % NB, j = k * (NB + 1) + bin;
      const wd = (.3 + Math.pow(c / .2, .8)) * (1 - sm(.93, .99, l)) * sm(.04, .15, l) * wf * al[i];   // area counts more than before (chroma only 0.8th power): a blue stripe next to orange hair is not outvoted
      bw[j] += wd; bL[j] += wd * l; bA[j] += wd * a; bB[j] += wd * b;
      // ACCENT: how far this pixel's colour is from its surroundings, only in smooth areas (an edge between two colours is not a detail)
      if (y < 1 || x < 1 || y >= S - 1 || x >= S - 1) continue;
      const dC = Math.hypot(a - bgA[i], b - bgB[i]); if (dC < ACC.dC0 || c < ACC.c0 || l < ACC.lmin || l > ACC.lmax) continue;
      let ma = 0, mb = 0, va = 0, vb = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = i + dy * S + dx; ma += A[q]; mb += B[q]; } ma /= 9; mb /= 9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = i + dy * S + dx; va += (A[q] - ma) ** 2; vb += (B[q] - mb) ** 2; }
      const std = Math.sqrt((va + vb) / 9); const strong = dC > ACC.strongDC && c > ACC.strongC;   // v226: a clearly coloured spot (a blue earring, red lips, a purple iris) is only 2-3 pixels wide at 96 px and its edge pixels are blended, so it gets looser edge / thin-line tests than a faint blush
      if (std > (strong ? ACC.strongStd : ACC.std)) continue;   // an edge, not an area
      let sup = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = i + dy * S + dx; if (Math.hypot(A[q] - a, B[q] - b) < .02 && Math.abs(L[q] - l) < .1) sup++; }
      if (sup < (strong ? ACC.strongSup : ACC.sup)) continue;
      if (strong) { const sm1 = q => Math.hypot(A[q] - a, B[q] - b) < .06 && Math.abs(L[q] - l) < .2; if (!((sm1(i - 1) || sm1(i + 1)) && (sm1(i - S) || sm1(i + S)))) continue; }   // a small spot must reach sideways AND up / down: a 1 px line (a strand, an outline) only reaches along itself   // a thin line (a hair strand, an outline) is not a coloured area: most of the 3 x 3 around it must be the same colour
      // SIZE: how much of the 13 x 13 window around it has this same colour? A blush is a few pixels (small share), a stripe or a shirt is a big share and is not an accent (the dominant colour of its cell already carries it)
      let same = 0, tot2 = 0; for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= S || xx >= S) continue; const q = yy * S + xx; tot2++; if (Math.hypot(A[q] - a, B[q] - b) < .02 && Math.abs(L[q] - l) < .12) same++; }
      const share = same / (tot2 || 1), bc = Math.hypot(bgA[i], bgB[i]), gap = bc > .025 ? Math.abs(((hueOf(a, b) - hueOf(bgA[i], bgB[i])) % 360 + 540) % 360 - 180) : 180;   // gap = how far its hue is from the surroundings' hue (in a neutral surround any colour counts)
      const s = sm(ACC.dC0, ACC.dC1, dC) * sm(ACC.c0, ACC.c1, c) * (1 - sm(ACC.sh0, ACC.sh1, share)) * sm(ACC.gap0, ACC.gap1, gap) * wf * al[i];
      if (dbg && fi === 0) dbg[i] = s;
      if (s > 0) { const q = k * NB + (Math.floor(hueOf(a, b) / (360 / NB)) % NB); aw[q] += s; aL[q] += s * l; aA[q] += s * a; aB[q] += s * b; }   // v226: strength is kept per hue family of the cell, so a cell can hold TWO accents (pink cheek + blue earring)
    }
  };
  const done = () => {
  const dom = { w: new Float64Array(NN), L: new Float64Array(NN), a: new Float64Array(NN), b: new Float64Array(NN), df: new Float64Array(NN) };
  const mk = () => ({ cov: new Float64Array(NN), L: new Float64Array(NN), a: new Float64Array(NN), b: new Float64Array(NN) }), acc = mk(), acc2 = mk();   // acc = the strongest accent of a cell, acc2 = the second one (a hue family at least 30 deg away from the first - v231, was 60: two reds 30-60 deg apart, like a coat and a stain, can now both hold a slot instead of one swallowing the other)
  for (let k = 0; k < NN; k++) {
    let tot = 0, best = -1, bv = 0; for (let q = 0; q <= NB; q++) tot += bw[k * (NB + 1) + q];
    for (let q = 0; q < NB; q++) { const v = bw[k * (NB + 1) + q] + .5 * (bw[k * (NB + 1) + (q + 1) % NB] + bw[k * (NB + 1) + (q + NB - 1) % NB]); if (v > bv) { bv = v; best = q; } }   // a hue family and its neighbours count together (one orange is not split in two)
    const nv = bw[k * (NB + 1) + NB];
    if (tot <= 0) continue;
    dom.w[k] = cnt[k];
    if (best >= 0 && bv > nv * .35) {   // the cell has a real colour family: its colour is the average of THAT family only
      let sw = 0, sl = 0, sa = 0, sb = 0; for (const q of [best, (best + 1) % NB, (best + NB - 1) % NB]) { const j = k * (NB + 1) + q; sw += bw[j]; sl += bL[j]; sa += bA[j]; sb += bB[j]; }
      dom.L[k] = sl / sw; dom.a[k] = sa / sw; dom.b[k] = sb / sw; dom.df[k] = Math.min(1, sw / tot);
    } else { const j = k * (NB + 1) + NB; dom.L[k] = bL[j] / (nv || 1); dom.a[k] = 0; dom.b[k] = 0; dom.df[k] = 0; }   // a grey / dark / white cell: no colour to report
    if (cnt[k] > 0) {
      const fam = q => { const o = k * NB; return aw[o + q] + .5 * (aw[o + (q + 1) % NB] + aw[o + (q + NB - 1) % NB]); };   // a hue family and its two neighbours count together
      const put = (T, q) => { let w = 0, l = 0, a = 0, b = 0; for (const z of [q, (q + 1) % NB, (q + NB - 1) % NB]) { const j = k * NB + z; w += aw[j]; l += aL[j]; a += aA[j]; b += aB[j]; } if (w > 0) { T.cov[k] = w / cnt[k]; T.L[k] = l / w; T.a[k] = a / w; T.b[k] = b / w; } };
      let b1 = -1, v1 = 0; for (let q = 0; q < NB; q++) { const v = fam(q); if (v > v1) { v1 = v; b1 = q; } }
      if (b1 >= 0) { put(acc, b1); let b2 = -1, v2 = 0; for (let q = 0; q < NB; q++) { const dq = Math.min((q - b1 + NB) % NB, (b1 - q + NB) % NB); if (dq < 1) continue; const v = fam(q); if (v > v2) { v2 = v; b2 = q; } } if (b2 >= 0) put(acc2, b2); }   // v231: a second accent only had to be 60 deg away (dq<2) to count as distinct; two reds 30-60 deg apart now can both hold a slot (dq<1)
    }
  }
  { const all = []; for (const T of [acc, acc2]) for (let k = 0; k < NN; k++) if (T.cov[k] > .01) all.push({ T, k, v: T.cov[k] * (.5 + Math.hypot(T.a[k], T.b[k]) / .15) });   // v226: a budget (ACC.cap of the cells, 11% = 28 of 256) so a busy picture (hair highlights, a rainbow background) cannot light up a whole third of the grid: only the strongest accents of the picture stay
    const keep = Math.max(4, Math.round(NN * ACC.cap)); if (all.length > keep) { all.sort((x, y) => y.v - x.v); for (let i = keep; i < all.length; i++) { const { T, k } = all[i]; T.cov[k] = 0; } } }
  const mean = { w: cnt, L: new Float64Array(NN), a: new Float64Array(NN), b: new Float64Array(NN) };
  for (let k = 0; k < NN; k++) if (cnt[k] > 0) { mean.L[k] = mL[k] / cnt[k]; mean.a[k] = mA[k] / cnt[k]; mean.b[k] = mB[k] / cnt[k]; }
  return used ? { n: N, dom, acc, acc2, mean } : null;
  };
  return { add, done };
}
export function detailFromFrames(frames, weights, S = HI, N = CELLS, dbg = null) {   // all the frames at once (a still picture, a Canvas video's few frames, the tests)
  const A = detailAccumulator(S, N, dbg); frames.forEach((d, i) => A.add(d, weights && weights[i])); return A.done();
}

/* ---- frames of an animated picture ---- */
export function pickCandidates(n, cap = 40) {   // which frame numbers to look at: all of a short GIF, up to cap spread evenly (middle of each slice) over a long one
  if (!(n > 0)) return [];
  if (n <= cap) return Array.from({ length: n }, (_, i) => i);
  return Array.from({ length: cap }, (_, i) => Math.min(n - 1, Math.floor((i + .5) * n / cap)));
}
export function frameSig(d, S = HI, g = 12) {   // a tiny fingerprint of a frame: g x g average colours (0..1)
  const o = new Float32Array(g * g * 3), cnt = new Float32Array(g * g), st = S / g;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const k = Math.floor(y / st) * g + Math.floor(x / st), i = (y * S + x) * 4; o[k * 3] += d[i]; o[k * 3 + 1] += d[i + 1]; o[k * 3 + 2] += d[i + 2]; cnt[k]++; }
  for (let k = 0; k < g * g; k++) for (let c = 0; c < 3; c++) o[k * 3 + c] /= (cnt[k] * 255) || 1;
  return o;
}
const sigDist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
export function pickKeyFrames(sigs, keep = 12, minGap = .02, wts = null) {   // wts (optional): how long each looked-at frame is on screen   // [{ i, w }]: the most different frames (farthest-point choice), w = how many of the looked-at frames each stands for (so the longest scene counts most)
  const n = sigs.length; if (!n) return [];
  const chosen = [0], dmin = sigs.map(s => sigDist(s, sigs[0]));
  while (chosen.length < keep) {
    let bi = -1, bd = 0; for (let i = 0; i < n; i++) if (dmin[i] > bd) { bd = dmin[i]; bi = i; }
    if (bi < 0 || bd < minGap) break;   // everything left is almost the same as a frame already chosen
    chosen.push(bi); for (let i = 0; i < n; i++) dmin[i] = Math.min(dmin[i], sigDist(sigs[i], sigs[bi]));
  }
  const w = chosen.map(() => 0); for (let i = 0; i < n; i++) { let bj = 0, bd = Infinity; chosen.forEach((c, j) => { const d = sigDist(sigs[i], sigs[c]); if (d < bd) { bd = d; bj = j; } }); w[bj] += wts && wts[i] > 0 ? wts[i] : 1; }
  return chosen.map((i, j) => ({ i, w: w[j] })).sort((x, y) => x.i - y.i);
}
