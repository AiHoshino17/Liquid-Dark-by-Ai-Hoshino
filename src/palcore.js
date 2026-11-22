/* v290: the COVER COLOUR PALETTE maths (pure functions, no DOM), moved out of main.js so it can run in a Web Worker (src/palworker.js) and never freeze the app.
   Owner: "tapping lyrics freezes the app for a second / lyrics don't even open with Cover colour palette on". The code between the two markers is unchanged
   (byte for byte the old main.js block); main.js imports the three functions it uses, the worker imports the same ones, the tests slice the block between the markers. */
/* v223+: COVER COLOUR MIX (Settings > Lyrics > Background style > Cover colour mix). Instead of picking 1-3 hues, the picture (the same 32x32 pixels, all frames of a GIF / Canvas folded onto the same places) is read as a 6x6 grid of regions.
   Each region keeps ITS OWN colour (vivid pixels count more than near-black / near-white ones, so a copper detail on a black cover is not turned to mud); the grid is then blended into one smooth picture in OKLab (a perceptual colour space: red to blue goes through a clean purple, not a grey-brown).
   The middle of the picture is the main colour, neutral dark patches (hair, a face) are lifted toward their neighbours, white / grey regions lean to the picture's overall colour, and every colour is scaled toward black (hue and saturation kept) until white lyrics have contrast. */
const MIXCAP = .21;   // MIXCAP = highest relative luminance of any colour (white text then has about 4:1 contrast)
const mixSm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
const mixLin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
function mixToLab(r, g, b) {   // sRGB 0-255 -> OKLab [L, a, b]
  const R = mixLin(r), G = mixLin(g), B = mixLin(b), l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
  return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
}
function mixLabLin(L, a, b) {   // OKLab -> linear sRGB (may be outside 0..1)
  const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
}
function mixGamut(L, a, b) {   // OKLab -> linear sRGB inside 0..1 (too much chroma is reduced, the hue is kept)
  let c = mixLabLin(L, a, b);
  for (let i = 0; i < 12 && (c[0] < -.002 || c[1] < -.002 || c[2] < -.002 || c[0] > 1.002 || c[1] > 1.002 || c[2] > 1.002); i++) { a *= .9; b *= .9; c = mixLabLin(L, a, b); }
  return c.map(v => Math.max(0, Math.min(1, v)));
}
function mixToRgb(L, a, b, cap = MIXCAP, dith = 0) {   // OKLab -> [r, g, b] 0-255. A colour too bright for white text is made darker by lowering its lightness while its chroma is kept (a pale lavender becomes a real purple-blue, a pale cloud is not left grey)
  let c = mixGamut(L, a, b); const lum = x => .2126 * x[0] + .7152 * x[1] + .0722 * x[2];
  if (lum(c) > cap) { let lo = 0, hi = L; for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (lum(mixGamut(mid, a, b)) > cap) hi = mid; else lo = mid; } c = mixGamut(lo, a, b); }
  return c.map(v => Math.max(0, Math.min(255, Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055) + dith))));
}
/* v236: COVER COLOUR PALETTE (Settings > Lyrics > Background style > Cover colour palette). A different look from the mix: the picture's FIVE real colours are picked (primary, secondary, tertiary, quaternary, quinary) and laid out as a clean gradient: the primary colour fills the middle and the base, the other four glow in the four corners (each one in the corner nearest to where it sits in the picture), a soft dark veil at the bottom keeps white lyrics readable.
   WHY: the mix looks at WHERE colours sit and cuts them into a few zones; a small but vivid colour (the yellow title and the blue figure of Starboy) melted into its neighbours. The palette picks colours by how much of the picture they cover AND how vivid they are, and it seeds every new colour from the one farthest from those already chosen, so a small, clearly different colour always gets its own place.
   Pure functions (no DOM): tintPaletteFromPixels(d) -> up to 5 colours { L, a, b, share, x, y, rank }, tintPaletteGrad(pal) -> a CSS background-image value. d = the same 32x32 RGBA frames (d.fw = frame weights) the mix reads. */
/* v237 (palette, brighter and more vivid): small vivid colours now count (a colour needs only 0.15 % of the picture, similar colours merge later), colours get a chroma boost, the glows are bigger and the lightness cap is higher; a stronger dark veil at the bottom keeps white lyrics readable. Same code for custom pictures, GIFs, Canvas and original covers. */
const PALN = 10;   // owner (2026-11-21): every cover (original album art, custom picture, GIF, Canvas) keeps up to 10 colours, biggest to smallest; a plain cover still gets only the few it really has
const PALFILL = 5;   // tintPaletteFill still pads a PLAIN cover to 5 (derived shades), not to 8
const PALMAX = 10;
const PALDETAIL = 14;   /* v264: 14 (was 12): hair, dress, blush and one missing area */
const DETAILSPOTS = [[30, 72], [70, 28], [20, 50], [80, 60]];   /* v264: glow spots of the animated colours 11-14 */   /* v262 (owner: black hair and the dress were missing): ONLY an animated picture may keep 2 more colours (the dark hair / dress step, tintPaletteAddDark), 12 at most; every still and every other step stays at PALMAX = 10 */   // v208 extras (owner: black hair, blue earring and purple eye were missing): the core palette stays PALN = 5 colours (every cover, unchanged); an ANIMATED picture may carry up to 2 EXTRA detail colours on top (tintPaletteAddExtras), so 10 at most
/* v238: the palette used to read ONLY the 32x32 grab (tintGrab) - plenty for a flat album cover, but a faint cheek blush or a softly-shaded iris on a drawn portrait is a handful of pixels even at 96x96 (see tintdetail.js's v225/v231 notes) and at 32x32 those pixels are already gone, smoothed into the surrounding skin by the resize itself, well before this code ever runs. There was nothing left here to find.
   tintPaletteFromSamples(B, tot) is the clustering core (seed the most vivid colour, then repeatedly add whichever remaining colour is farthest from every colour chosen so far, refine, merge look-alikes, score, sort) pulled out so it can run on either source:
   - tintPaletteFromPixels(d, W=32): the original path, raw W x W pixels binned into an OKLab lattice. Still the fallback, and still what a plain 32x32 grab or the tests feed it.
   - tintPaletteFromDetail(detail): NEW - builds the same kind of weighted colour samples straight from tintdetail.js's already-computed, already-tuned 96x96 grid (detail.dom = each cell's real colour, detail.acc / detail.acc2 = the small accents tintdetail.js's accent pass already pulled out of that cell - a blush, an iris, a second red) instead of re-deriving them from raw pixels. coverTint() below now prefers this (or a 96x96 pixel buffer when one is already in hand) over the original 32x32 grab, so the high-resolution read actually reaches the screen instead of sitting unused in d.hi. */
function tintPaletteFromSamples(B, tot, nMax = PALN) {   // nMax: how many clusters to seed (8 for stills; an ANIMATED picture seeds 5 here and gets its small details - blush, eye, hair, earring - from the accent / hue / extras steps, so the 8 slots are not used up by 5 shades of the same blonde)
  if (!(tot > 0)) return [];
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), vivid = c => Math.min(1.5, Math.hypot(c.a, c.b) / .15);
  const cand = B.filter(b => b.w >= .0015 * tot), pool = cand.length ? cand : B;   // a colour has to cover at least 0.4 % of the picture (a speck of noise is not a colour)
  const cen = [pool.reduce((m, c) => (c.w * (.45 + vivid(c)) > m.w * (.45 + vivid(m)) ? c : m), pool[0])].map(c => ({ L: c.L, a: c.a, b: c.b }));
  while (cen.length < nMax) {   // the next colour is the one farthest from every colour chosen so far (area counts a little): a small yellow next to a big red is far away, so it is never skipped
    let bi = null, bs = 0; for (const c of pool) { const m = Math.min(...cen.map(q => dist(c, q))), sc = m * Math.sqrt(c.w / tot + .02); if (sc > bs) { bs = sc; bi = c; } }
    if (!bi || Math.min(...cen.map(q => dist(bi, q))) < .08) break; cen.push({ L: bi.L, a: bi.a, b: bi.b });
  }
  for (let it = 0; it < 8; it++) {
    const S = cen.map(() => ({ w: 0, wv: 0, L: 0, a: 0, b: 0 }));
    for (const c of pool) { let bj = 0, bd = Infinity; cen.forEach((q, j) => { const dd = dist(c, q); if (dd < bd) { bd = dd; bj = j; } }); const t = S[bj]; t.w += c.w; t.wv += c.wv; t.L += c.wv * c.L; t.a += c.wv * c.a; t.b += c.wv * c.b; }
    S.forEach((t, j) => { if (t.wv > 0) { cen[j].L = t.L / t.wv; cen[j].a = t.a / t.wv; cen[j].b = t.b / t.wv; } });
  }
  let cl = cen.map(c => ({ ...c, w: 0, x: 0, y: 0 }));
  for (const c of B) { let bj = 0, bd = Infinity; cl.forEach((q, j) => { const dd = dist(c, q); if (dd < bd) { bd = dd; bj = j; } }); const t = cl[bj]; t.w += c.w; t.x += c.w * c.x; t.y += c.w * c.y; }
  cl = cl.filter(c => c.w >= .0015 * tot).map(c => ({ L: c.L, a: c.a, b: c.b, share: c.w / tot, x: c.x / c.w, y: c.y / c.w }));   // v238: x/y arrive already normalised 0..1 (the sample builder divides by its own grid width), so this no longer assumes a 32-wide frame
  for (let again = true; again && cl.length > 1;) { again = false; for (let i = 0; i < cl.length && !again; i++) for (let j = i + 1; j < cl.length; j++) if (dist(cl[i], cl[j]) < .07) { const p = cl[i], q = cl[j], w = p.share + q.share; cl[i] = { L: (p.L * p.share + q.L * q.share) / w, a: (p.a * p.share + q.a * q.share) / w, b: (p.b * p.share + q.b * q.share) / w, share: w, x: (p.x * p.share + q.x * q.share) / w, y: (p.y * p.share + q.y * q.share) / w }; cl.splice(j, 1); again = true; break; } }   // two colours that look the same become one
  cl.forEach(c => { const cn = Math.hypot(c.a, c.b); c.score = Math.pow(c.share, .55) * (.3 + Math.min(1.4, cn / .15)) * (c.L < .25 && cn < .05 ? .45 : 1); });   // a near-black colour with no hue of its own is the least interesting: it comes last (the dark veil already covers it)   // how much of the picture it covers AND how vivid it is: a vivid red beats a big black, a small vivid yellow beats a big dull grey
  cl.sort((p, q) => q.score - p.score); cl.forEach((c, i) => { c.rank = i + 1; delete c.score; });
  return cl;
}
function tintPaletteFromPixels(d, W = 32, nMax = PALN) {   // raw W x W RGBA frames (d.fw = each frame's weight), unchanged behaviour at W=32 (the default, what tintGrab and the tests still use)
  const bins = new Map(); let tot = 0, frameBytes = W * W * 4;
  for (let i = 0; i + 3 < d.length; i += 4) {
    const al0 = d[i + 3] / 255; if (al0 < .06) continue;
    const al = d.fw ? al0 * (d.fw[Math.floor(i / frameBytes)] || 1) : al0, q = Math.floor(i / 4) % (W * W), [L, a, b] = mixToLab(d[i], d[i + 1], d[i + 2]), cn = Math.hypot(a, b);
    const w = al * (1 - .8 * mixSm(.9, .98, L)), wv = w * (.25 + Math.pow(Math.min(1.6, cn / .15), 1.5));   // w = area (near-white counts little: white text cannot sit on white); wv = area x vividness, used for the colour itself so dull shadow pixels do not drag a vivid colour toward grey
    const key = ((L * 16) | 0) * 1600 + (((a + .4) * 40) | 0) * 40 + (((b + .4) * 40) | 0); let e = bins.get(key);
    if (!e) bins.set(key, e = { w: 0, wv: 0, L: 0, a: 0, b: 0, x: 0, y: 0 });
    e.w += w; e.wv += wv; e.L += wv * L; e.a += wv * a; e.b += wv * b; e.x += w * ((q % W) + .5) / W; e.y += w * (Math.floor(q / W) + .5) / W; tot += w;
  }
  const B = [...bins.values()].map(e => ({ w: e.w, wv: e.wv, L: e.L / e.wv, a: e.a / e.wv, b: e.b / e.wv, x: e.x / e.w, y: e.y / e.w }));
  return tintPaletteFromSamples(B, tot, nMax);
}
function tintPaletteIsBlush(c) {   // v208 palette-hues PART 3 (owner: "the blush is kind of missing"): a small, clearly pink / rosy colour (a cheek blush, lips) is a MUST-KEEP accent: no merge or slot-freeing step may drop it. Rule based on the colour only (nothing about this picture): hue within 35 deg of pink-red, real chroma, not dark, under 3 % of the picture
  const h = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360; return c.share < .03 && (h < 35 || h > 335) && Math.hypot(c.a, c.b) > .1 && c.L > .45;
}
function tintPaletteFreeSlot(pal, loose) {   // v208 palette-hues (Fix D): frees ONE slot by dropping a TRUE look-alike: same hue family, close lightness, close colour, smaller (or equal) share than the colour it looks like (its share is added to that colour). Never rank 1 (index 0), never a different-looking detail (blush, iris, earring, lips, the grey-blue background); a near-grey colour is NOT dropped just for being near-grey. Returns true when a slot was freed. loose (only the hue pass asks for it, after the strict test found nothing): a vivid shade of a big colour of the SAME hue (within 15 deg, lightness within .16, at most a third of its share, e.g. a small gold next to a big beige) also counts as a look-alike
  const hd = (p, q) => { const d = Math.abs(Math.atan2(p.b, p.a) - Math.atan2(q.b, q.a)) * 180 / Math.PI; return Math.min(d, 360 - d); };
  const like = (c, q) => { const cc = Math.hypot(c.a, c.b), cq = Math.hypot(q.a, q.b), ab = Math.hypot(c.a - q.a, c.b - q.b); return Math.abs(c.L - q.L) < .16 && ((ab < .045 && (Math.min(cc, cq) < .035 || hd(c, q) < 25)) || (loose && ab < .12 && cc > .035 && cq > .035 && hd(c, q) < 15 && q.share >= 3 * c.share)); };
  let bk = -1, bj = -1; pal.forEach((c, k) => { if (k < 1 || c.eye || tintPaletteIsBlush(c)) return; const j = pal.findIndex((q, i) => i !== k && q.share >= c.share && like(c, q));   /* v255: an eye colour is never a look-alike to drop (the olive iris matched the olive jacket) */ if (j >= 0 && (bk < 0 || c.share < pal[bk].share)) { bk = k; bj = j; } });
  if (bk < 0) return false; pal[bj].share += pal[bk].share; pal.splice(bk, 1); return true;
}
function tintPaletteAddAccents(pal, detail, cap = PALN) {   // v239: the "append the small real accents (a blush, an iris, an earring) in their own true colour, into free palette slots" step of v238/v238c, pulled out of tintPaletteFromDetail so a STILL picture can use it too. Before v239 only animated pictures / videos ran it; a still cover (tintPaletteFromPixels, raw 96 px read) never did, so a dark still with only 2-3 big colours (brown skin + black hair) left its free slots empty and lost the eyes and the blush. pal = a palette (tintPaletteFromPixels / tintPaletteFromSamples); detail = tintdetail.js's grid for the SAME picture. Returns pal (changed in place); with no usable detail it returns pal untouched.
  if (!detail || !(detail.n > 0)) return pal;
  const N = detail.n; let domTot = 0; for (let k = 0; k < N * N; k++) domTot += detail.dom.w[k];
  if (!(domTot > 0)) return pal;
  // an accent cell is a fraction of one small cell (a blush is maybe 10-30% of a 6x6-pixel cell) - genuinely under 0.15% of the WHOLE picture, the floor tintPaletteFromSamples uses to tell a real small colour from noise in a raw pixel read. But this is not raw, unvetted noise: tintdetail.js already ran its own dedicated, tuned gates (contrast, chroma, smoothness, a per-picture budget) to decide this one cell is a real accent, not texture. So it does not have to re-clear that area floor a second time - it gets a guaranteed minimum voice (floor), sized well below what even a handful of them (capped by tintdetail.js's own ACC.cap) could ever add up to, so one real but tiny accent is not silently dropped the same way the 32x32 grab used to drop it.
  const floor = .006 * domTot, acc = [];
  for (let k = 0; k < N * N; k++) {
    const x = ((k % N) + .5) / N, y = (Math.floor(k / N) + .5) / N;
    for (const T of [detail.acc, detail.acc2]) { if (T.cov[k] > .01) { const L = T.L[k], a = T.a[k], b = T.b[k], w = Math.max(floor, T.cov[k] * (detail.dom.w[k] || 1)); acc.push({ w, L, a, b, x, y }); } }
  }
  // v238b: an accent is found PER CELL, so one real detail bigger than one cell (an iris spanning 2-3 cells, a blush covering both sides of the nose) shows up as several near-identical samples. Those used to flood the farthest-point seeding below with near-duplicates of the SAME detail, which (a) wastes picks that just get merged back into one at the very end anyway, and (b) crowds out room for a genuinely different detail elsewhere (blush and eye both real, both small - one would win the "farthest so far" contest for a couple of rounds purely by having more cells, and the loop's distance floor could be exhausted before the other ever got a turn). Merging same-ish accents into one sample FIRST, before seeding, fixes both: fewer, more distinct candidates, so the picture's few small real details each get a fair, undivided shot at a slot.
  const dist0 = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
  for (let again = true; again && acc.length > 1;) { again = false; for (let i = 0; i < acc.length && !again; i++) for (let j = i + 1; j < acc.length; j++) if (dist0(acc[i], acc[j]) < .028) { const p = acc[i], q = acc[j], w = p.w + q.w; acc[i] = { w, L: (p.L * p.w + q.L * q.w) / w, a: (p.a * p.w + q.a * q.w) / w, b: (p.b * p.w + q.b * q.w) / w, x: (p.x * p.w + q.x * q.w) / w, y: (p.y * p.w + q.y * q.w) / w }; acc.splice(j, 1); again = true; break; } }
  // v238c: feeding a boosted accent into the shared seeding/refinement pool (tried above) back-fired - it also shifted the k-means reassignment of ordinary dom pixels and wiped out unrelated real ranks (the background, the other eye) that the unboosted run found cleanly. So the main clustering above runs on PLAIN, unboosted dom samples only, exactly like the raw-pixel path. Once that settles into its real, trustworthy answer, any accent that still has no clearly different colour already in the result (and there is still an empty slot) is appended afterwards, in its own TRUE colour - not blended into anyone's average, not distorting anyone else's.
  const dist1 = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), vivid1 = c => Math.min(1.5, Math.hypot(c.a, c.b) / .15);
  acc.sort((p, q) => q.w * (.45 + vivid1(q)) - p.w * (.45 + vivid1(p)));
  // owner (eye colour / blush missing from the palette): near-grey colours that sit right next to a bigger one (an olive and a slightly darker olive) used up the 5 slots, so a purple iris had no room. Free a slot for the accents first.
  while (pal.length >= cap && acc.length) { if (!tintPaletteFreeSlot(pal)) break; }   // v208 palette-hues (Fix D): only a true look-alike frees a slot (was: any near-grey colour near a bigger one, which also dropped a real grey-blue background)
  for (const c of acc) {
    if (pal.length >= cap) break;
    if (pal.some(p => dist1(p, c) < .03)) continue;   // already have this colour (or close enough) in the real result, tested on its TRUE colour
    // v238c: appended here on its own, this accent is no longer sharing a cluster or a Voronoi boundary with anything else (that is what went wrong feeding a boosted sample into the shared pool above), so recovering some of the chroma cell-averaging diluted (see the v238b note) is now safe: it only makes THIS swatch (and so its own glow) more visible, nothing else moves
    pal.push({ L: c.L, a: c.a * 2.4, b: c.b * 2.4, share: c.w / domTot, x: c.x, y: c.y });
  }
  pal.forEach(c => { const cn = Math.hypot(c.a, c.b); c.score = Math.pow(c.share, .55) * (.3 + Math.min(1.4, cn / .15)) * (c.L < .25 && cn < .05 ? .45 : 1); });
  pal.sort((p, q) => q.score - p.score); pal.forEach((c, i) => { c.rank = i + 1; delete c.score; });
  return pal;
}
function tintPaletteFromDetail(detail, nMax = PALN, cap = PALN) {   // v238: builds palette samples straight from tintdetail.js's 96x96 grid instead of a 32x32 pixel re-read - every cell's own colour (dom), AND its own small accent(s) (acc / acc2 - exactly the blush / iris / second-red cases tintdetail.js's v231 fix now catches) each becomes its own weighted sample, at the cell's own position, so a faint accent that would never survive a 32x32 downsize gets to compete for a palette slot on its own merits
  if (!detail || !(detail.n > 0)) return [];
  const N = detail.n; let domTot = 0; for (let k = 0; k < N * N; k++) domTot += detail.dom.w[k];
  if (!(domTot > 0)) return [];
  const B = [];
  for (let k = 0; k < N * N; k++) {
    const x = ((k % N) + .5) / N, y = (Math.floor(k / N) + .5) / N;
    if (detail.dom.w[k] > 0) { const L = detail.dom.L[k], a = detail.dom.a[k], b = detail.dom.b[k], cn = Math.hypot(a, b), w = detail.dom.w[k] * (1 - .8 * mixSm(.9, .98, L)), wv = w * (.25 + Math.pow(Math.min(1.6, cn / .15), 1.5)); B.push({ w, wv: wv || w * .25, L, a, b, x, y }); }
  }
  return tintPaletteAddAccents(tintPaletteFromSamples(B, domTot, nMax), detail, cap);   // v239: the append step now lives in tintPaletteAddAccents (same code, same order, so animated pictures give exactly what they gave before)
}
function tintPaletteAddHues(pal, frames, W = 96) {   // owner (irises, brown hair missing): looks at the real pixels for a colour the palette does not have yet (a purple / green iris, a brown hair): pixels are binned by hue (15 deg) and lightness, a bin with enough pixels and a real chroma that is far from every palette colour is appended (up to 2), in its own colour, ahead of nothing else (only free slots; a near-grey duplicate is dropped first)
  if (!frames || !frames.length) return pal;
  const bins = new Map(); let tot = 0;
  for (const f of frames) for (let i = 0; i < W * W * 4; i += 4) {
    tot++; const [L, a, b] = mixToLab(f[i], f[i + 1], f[i + 2]), cn = Math.hypot(a, b); if (cn < .04) continue;
    const k = Math.floor(((Math.atan2(b, a) * 180 / Math.PI + 360) % 360) / 15) * 8 + Math.min(4, Math.floor(L * 5)), p = (i / 4) % W, q = Math.floor(i / 4 / W) % W, B = bins.get(k) || (bins.set(k, { n: 0, L: 0, a: 0, b: 0, x: 0, y: 0 }), bins.get(k));
    B.n++; B.L += L; B.a += a; B.b += b; B.x += p; B.y += q;
  }
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), hd = (p, q) => { const d = Math.abs(Math.atan2(p.b, p.a) - Math.atan2(q.b, q.a)) * 180 / Math.PI; return Math.min(d, 360 - d); };
  let cand = [...bins.values()].filter(B => B.n >= Math.max(.4 * frames.length, tot * .00004)).map(B => ({ L: B.L / B.n, a: B.a / B.n, b: B.b / B.n, share: B.n / tot, x: B.x / B.n / W, y: B.y / B.n / W })).filter(c => Math.hypot(c.a, c.b) > .04 && c.L > .2 && c.L < .92);
  // v208 palette-hues (Fix C): candidates are ranked by how DIFFERENT they are from the palette (hue counts most, see hd), then chroma, then size - recomputed after every add - so a small purple / green iris beats yet another big beige bin
  // PART 3 (Fix E + F): `same` weighs lightness 1.2 (local to this check, the shared dist() is untouched) so a brown hair (L .55) is not taken for a beige (L .7) of the same hue; size counts with a higher power (.4) so a real hair colour (3 % of the picture) beats a 0.03 % speck of an earring when only ONE slot is free; the second pick prefers a different hue family than the first (an eye next to a hair), a third is allowed only while slots are free
  const diff = c => Math.min(...pal.map(p => dist(p, c) * (Math.hypot(p.a, p.b) > .035 ? .5 + Math.min(1, hd(p, c) / 60) : 1)));
  const distE = (p, q) => Math.hypot((p.L - q.L) * 1.2, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6);
  const same = c => pal.some(p => dist(p, c) < .03 || (Math.hypot(p.a, p.b) > .035 && hd(p, c) < 25 && distE(p, c) < .12 && Math.abs(p.L - c.L) < .08));
  const hueDeg = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hDiff = (u, v) => { const d = Math.abs(hueDeg(u) - hueDeg(v)); return Math.min(d, 360 - d); };
  const hairLike = c => { const h = hueDeg(c); return h > 15 && h < 70 && c.L > .4 && c.L < .66 && Math.hypot(c.a, c.b) > .045; };   // a brown / chestnut / auburn hair shade: mid lightness, warm hue
  let added = 0; const got = [];
  while (added < 3 && cand.length) {
    cand = cand.filter(c => !same(c)); if (!cand.length) break;
    let bi = 0, bs = -1; const needHair = added >= 1 && !pal.some(hairLike) && cand.some(hairLike);   // Fix F: once the first (most different) colour is in, a hair colour the palette still lacks gets the next slot, the biggest such shade first (a character's hair covers far more of the picture than an earring or an iris)
    if (needHair) cand.forEach((c, i) => { if (hairLike(c) && (bs < 0 || c.share > cand[bi].share)) { bs = 1; bi = i; } });
    else cand.forEach((c, i) => { let sc = diff(c) * (.5 + Math.min(1.5, Math.hypot(c.a, c.b) / .1)) * Math.pow(c.share + .001, .4); if (got.length && got.every(g => hDiff(g, c) < 40)) sc *= .6; if (sc > bs) { bs = sc; bi = i; } });
    const c = cand.splice(bi, 1)[0];
    while (pal.length >= PALN) if (!tintPaletteFreeSlot(pal) && !tintPaletteFreeSlot(pal, true)) break;
    if (pal.length >= PALN) break;
    pal.push({ L: c.L, a: c.a * 1.8, b: c.b * 1.8, share: Math.min(c.share, .02), x: c.x, y: c.y }); got.push(c); added++;
  }
  if (added) { pal.forEach(c => { const cn = Math.hypot(c.a, c.b); c.score = Math.pow(c.share, .55) * (.3 + Math.min(1.4, cn / .15)) * (c.L < .25 && cn < .05 ? .45 : 1); }); pal.sort((p, q) => q.score - p.score); pal.forEach((c, i) => { c.rank = i + 1; delete c.score; }); }
  return pal;
}
function tintPaletteAddEyes(pal, frames, W = 96) {   // v208 eyes (owner: purple eyes missing from the palette). An iris is a few plum / mauve pixels (hue 300 to 25 deg; skin, hair and clothes are warm yellow-beige, about 75 to 90 deg) that stay in the same spot over many frames. This finds up to 2 such spots (small blobs, stable over >= 20 % of the frames), takes their colour (chroma-weighted over all their hits), and puts it into a free slot, or in place of the smallest colour that is not rank 1 and not a blush. Only the animated path (hue frames) calls it: a still's one frame cannot prove a spot is stable. Returns pal (changed in place).
  if (!frames || !frames.length) return pal;   // v208 final: a STILL (1 frame) is allowed too; its spot only has to be there once (a still cannot move)
  const sc = W / 96, lo = Math.max(2, 2 * sc * sc), hi = 12 * sc * sc, reach = 4 * sc, apart = 20 * sc;
  const hueDeg = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  const groups = [];
  frames.forEach((f, fi) => {
    const N = W * W, L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), m = new Uint8Array(N);
    for (let p = 0; p < N; p++) { const [l, a, b] = mixToLab(f[p * 4], f[p * 4 + 1], f[p * 4 + 2]); L[p] = l; A[p] = a; B[p] = b; const h = hueDeg(a, b), c = Math.hypot(a, b); if ((h >= 300 || h <= 12) && c >= .03 && l >= .25 && l <= .85) m[p] = 1; }   // v208 final: upper hue 25 -> 12 deg (an orange-red skin shadow at about 19 deg was taken for a plum iris on 1000314750.gif)
    const seen = new Uint8Array(N);
    for (let p = 0; p < N; p++) {
      if (!m[p] || seen[p]) continue; const st = [p], px = []; seen[p] = 1;
      while (st.length) { const q = st.pop(); px.push(q); const x = q % W, y = (q / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const r = ny * W + nx; if (m[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
      if (px.length < lo || px.length > hi) continue;
      let cx = 0, cy = 0, sw = 0, l = 0, a = 0, b = 0; for (const q of px) { cx += q % W; cy += (q / W) | 0; const c = Math.hypot(A[q], B[q]), w = c * c; sw += w; l += w * L[q]; a += w * A[q]; b += w * B[q]; }
      cx /= px.length; cy /= px.length;
      if (cx < .06 * W || cy < .06 * W || cx > .94 * W || cy > .94 * W) continue;   // v208 final: a spot in the outer 6 % is not an eye
      { let wn = 0; const r = Math.round(reach); for (let yy = Math.max(0, Math.round(cy) - r); yy <= Math.min(W - 1, Math.round(cy) + r); yy++) for (let xx = Math.max(0, Math.round(cx) - r); xx <= Math.min(W - 1, Math.round(cx) + r); xx++) { const q = yy * W + xx; if (L[q] > .9 && Math.hypot(A[q], B[q]) < .05) wn++; } if (wn < 3) continue; }   // v208 final: an iris has eye-white beside it (>= 3 near-white pixels within 4 px at 96 px); a reddish shadow on skin has not
      let g = groups.find(g => Math.abs(g.cx - cx) <= reach && Math.abs(g.cy - cy) <= reach);
      if (!g) groups.push(g = { cx, cy, fr: new Set(), n: 0, sw: 0, l: 0, a: 0, b: 0 });
      g.fr.add(fi); g.n += px.length; g.sw += sw; g.l += l; g.a += a; g.b += b;
    }
  });
  const need = frames.length < 3 ? frames.length : Math.max(3, .2 * frames.length), picks = [];
  for (const g of groups.filter(g => g.fr.size >= need).sort((p, q) => q.fr.size - p.fr.size)) {
    if (picks.length >= 1) break; picks.push(g);   // ONE spot for now: the most stable mauve spot (the purple iris). A second mauve spot in this clip was the earring, not an eye; the green-grey eye needs its own rule (see HANDOFF_STATUS.md)
  }
  for (const g of picks) {
    if (!g.sw) continue; const E = { L: g.l / g.sw, a: g.a / g.sw, b: g.b / g.sw, share: Math.min(.02, g.n / frames.length / (W * W)), x: (g.cx + .5) / W, y: (g.cy + .5) / W };
    if (tintPaletteIsBlush({ L: E.L, a: E.a * 1.5, b: E.b * 1.5, share: E.share })) continue;   // v208 final: a pink / rosy spot is the blush, not an eye
    const plumLike = p => { const hp = hueDeg(p.a, p.b); return (hp >= 300 || hp <= 25) && Math.hypot(p.a, p.b) > .03 && p.L >= .35 && p.L <= .8 && !tintPaletteIsBlush(p); };
    if (pal.some(plumLike)) continue;   // the palette already has a plum / mauve colour (an iris from the hue pass, or a plum from the picture): do not take a second slot for it
    if (frames.length < 3 && pal.length >= PALN) break;   // a still only fills a FREE slot, it never drops a colour the picture already has
    while (pal.length >= PALN) { if (tintPaletteFreeSlot(pal, true)) continue; let k = -1; for (let i = 1; i < pal.length; i++) if (!pal[i].eye && !tintPaletteIsBlush(pal[i]) && (k < 0 || pal[i].share < pal[k].share)) k = i; if (k < 0) break; pal.splice(k, 1); }
    if (pal.length >= PALN) break;
    pal.push({ L: E.L, a: E.a * 1.5, b: E.b * 1.5, share: E.share, x: E.x, y: E.y, eye: true });
  }
  if (picks.length && frames.length >= 3) { pal.forEach(c => { const cn = Math.hypot(c.a, c.b); c.score = Math.pow(c.share, .55) * (.3 + Math.min(1.4, cn / .15)) * (c.L < .25 && cn < .05 ? .45 : 1); }); pal.sort((p, q) => q.score - p.score); pal.forEach((c, i) => { c.rank = i + 1; delete c.score; }); }
  return pal;
}
function tintPaletteAddExtras(pal, frames, W = 96) {   // v208 extras (owner: the black hair, the blue earring and the purple eye were missing). Up to 2 EXTRA colours beyond the 5 core ones, animated pictures only, nothing hard-coded about one picture:
  // (1) a big DARK mass (hair): the dark pixels (L < .35) of all sampled frames; when they cover >= 4 % and no palette colour is already that dark and that near, their mean colour is added (before: the dark hair melted into the grey-blue background colour).
  // (2) a small VIVID spot (an earring, a gem): chroma >= .1, 3 to 40 px at 96 px, in the same place in >= 20 % of the frames, whose hue is far (> 45 deg) from every colour already in the palette.
  if (!frames || !frames.length || pal.length < 1) return pal;   // v208 final: stills (1 frame) too
  const sc = W / 96, N = W * W, hueDeg = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v); return Math.min(d, 360 - d); };
  let dn = 0, dl = 0, da = 0, db = 0, dx = 0, dy = 0, tot = 0, bn = 0, bl = 0, ba = 0, bb = 0, bx = 0, by = 0; const groups = [];
  frames.forEach((f, fi) => {
    const L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), m = new Uint8Array(N);
    for (let p = 0; p < N; p++) { const [l, a, b] = mixToLab(f[p * 4], f[p * 4 + 1], f[p * 4 + 2]); L[p] = l; A[p] = a; B[p] = b; tot++; { const hh = hueDeg(a, b), cc = Math.hypot(a, b); if (hh > 15 && hh < 56 && l > .4 && l < .6 && cc > .045) { bn++; bl += l; ba += a; bb += b; bx += (p % W) + .5; by += ((p / W) | 0) + .5; } } if (l < .35) { dn++; dl += l; da += a; db += b; dx += (p % W) + .5; dy += ((p / W) | 0) + .5; } if (Math.hypot(a, b) >= .1 && l >= .2 && l <= .85) m[p] = 1; }
    const seen = new Uint8Array(N);
    for (let p = 0; p < N; p++) {
      if (!m[p] || seen[p]) continue; const st = [p], px = []; seen[p] = 1;
      while (st.length) { const q = st.pop(); px.push(q); const x = q % W, y = (q / W) | 0; for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ex, ny = y + ey; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const r = ny * W + nx; if (m[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
      if (px.length < 3 * sc * sc || px.length > 40 * sc * sc) continue;
      let cx = 0, cy = 0, l = 0, a = 0, b = 0; for (const q of px) { cx += q % W; cy += (q / W) | 0; l += L[q]; a += A[q]; b += B[q]; } const n = px.length; cx /= n; cy /= n;
      let g = groups.find(g => Math.abs(g.cx - cx) <= 4 * sc && Math.abs(g.cy - cy) <= 4 * sc); if (!g) groups.push(g = { cx, cy, fr: new Set(), n: 0, l: 0, a: 0, b: 0 });
      g.fr.add(fi); g.n += n; g.l += l; g.a += a; g.b += b;
    }
  });
  const dist = (p, q) => Math.hypot((p.L - q.L) * 1.2, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6); let added = 0;
  const room = () => { if (pal.length < PALMAX) return true; if (frames.length < 3) return false; let k = -1; for (let i = 1; i < pal.length; i++) if (!pal[i].eye && !pal[i].extra && !tintPaletteIsBlush(pal[i]) && (k < 0 || pal[i].share < pal[k].share)) k = i; if (k < 0) return false; pal.splice(k, 1); return true; };   // v208 final: a real detail (hair, earring) outranks the smallest plain shade of an animated picture; a still never drops anything
  for (let again = frames.length >= 3; again;) { again = false; for (let i = 1; i < pal.length && !again; i++) for (let j = i + 1; j < pal.length && !again; j++) if (tintPaletteIsBlush(pal[i]) && tintPaletteIsBlush(pal[j]) && hd(hueDeg(pal[i].a, pal[i].b), hueDeg(pal[j].a, pal[j].b)) < 25) { const k = Math.hypot(pal[i].a, pal[i].b) > Math.hypot(pal[j].a, pal[j].b) ? i : j; pal.splice(k, 1); again = true; } }   // two pink / rosy accents of one hue family are ONE blush: keep the more natural (less boosted) one, and free its slot
  if (dn > .04 * tot) {
    const D = { L: dl / dn, a: da / dn, b: db / dn, share: Math.min(.2, dn / tot), x: dx / dn / W, y: dy / dn / W };
    if (!pal.some(c => dist(c, D) < .07) && room()) { pal.push({ L: D.L * .6, a: D.a * 1.3, b: D.b * 1.3, share: D.share, x: D.x, y: D.y, extra: true }); added++; }
  }
  if (bn > .01 * tot) {   // (3) a brown / chestnut hair shade (warm hue 15-70 deg, mid lightness) that the palette lacks (the beige and gold are lighter): brown hair was dropped from the 5 core slots by the purple eye
    const H = { L: bl / bn, a: ba / bn, b: bb / bn, share: Math.min(.05, bn / tot), x: bx / bn / W, y: by / bn / W };
    if (!pal.some(c => Math.hypot(c.a, c.b) > .035 && hd(hueDeg(c.a, c.b), hueDeg(H.a, H.b)) < 25 && Math.abs(c.L - H.L) < .05) && room()) { pal.push({ L: H.L, a: H.a * 1.5, b: H.b * 1.5, share: H.share, x: H.x, y: H.y, extra: true }); added++; }
  }
  if (frames.length >= 3) for (const c of pal) { const cn = Math.hypot(c.a, c.b); if (c !== pal[0] && !c.extra && !c.eye && c.share > .03 && cn > .03 && cn < .06) { c.a *= 1.45; c.b *= 1.45; } }   // (4) a dull but real colour (the olive jacket) is turned up a little so it reads as green, not khaki
  const need = frames.length < 3 ? frames.length : Math.max(3, .2 * frames.length), best = groups.filter(g => g.fr.size >= need).map(g => ({ L: g.l / g.n, a: g.a / g.n, b: g.b / g.n, fr: g.fr.size, x: (g.cx + .5) / W, y: (g.cy + .5) / W })).filter(c => !tintPaletteIsBlush({ ...c, a: c.a * 1.3, b: c.b * 1.3, share: .0004 }) && pal.every(p => Math.hypot(p.a, p.b) < .035 || hd(hueDeg(p.a, p.b), hueDeg(c.a, c.b)) > 45 || Math.hypot(c.a, c.b) > 2.2 * Math.hypot(p.a, p.b))).sort((p, q) => q.fr - p.fr)[0];
  if (best && room()) { pal.push({ L: best.L, a: best.a * 1.3, b: best.b * 1.3, share: .0004, x: best.x, y: best.y, extra: true }); added++; }
  if (added) pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteAddIris(pal, frames, W = 192) {   // v208 iris (owner: the right girl's green-grey eye was missing, "small details must not go missing"). At 96 px an iris is 3 px of dull colour, but at about 192 px it is a compact blob of 15-60 px NEXT TO near-white eye-white. Rule (no colour or place of one picture is used): a compact blob (area 12-160 px at 192, fills >= 45 % of its box, not a long streak) of a real but dark-ish colour (L .2-.62, chroma >= .025), with >= 6 near-white pixels (L > .93, chroma < .03) within 3 px, in the same place in >= 20 % of the sampled frames. Its colour (chroma x 2.2, the iris is dull) is added unless the palette already has it, or it is the same eye as one found earlier (same place, hue within 30 deg). Up to 2 irises.
  if (!frames || !frames.length || !pal.length) return pal;   // v208 final: stills (1 frame) too
  const sc = W / 192, N = W * W, hueDeg = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v); return Math.min(d, 360 - d); }, groups = [];
  frames.forEach((f, fi) => {
    const L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), m = new Uint8Array(N), w = new Uint8Array(N);
    for (let p = 0; p < N; p++) { const [l, a, b] = mixToLab(f[p * 4], f[p * 4 + 1], f[p * 4 + 2]); L[p] = l; A[p] = a; B[p] = b; const c = Math.hypot(a, b); if (l >= .2 && l <= .62 && c >= .025) m[p] = 1; if (l > .93 && c < .03) w[p] = 1; }
    const seen = new Uint8Array(N);
    for (let p = 0; p < N; p++) {
      if (!m[p] || seen[p]) continue; const st = [p], px = []; seen[p] = 1;
      while (st.length) { const q = st.pop(); px.push(q); const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const r = ny * W + nx; if (m[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
      if (px.length < 12 * sc * sc || px.length > 160 * sc * sc) continue;
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const q of px) { const x = q % W, y = (q / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1; if (px.length / (bw * bh) < .45 || bw > 3 * bh || bh > 3 * bw) continue;
      { const mg = .06 * W; if (x0 < mg || y0 < mg || x1 > W - 1 - mg || y1 > W - 1 - mg) continue; }   // v208 final: a blob in the outer 6 % of the picture is a cut-off object, not an eye (the blue bed stripe at the top edge of 1000314750.gif was taken for an iris)
      let wn = 0; const r3 = Math.max(2, Math.round(3 * sc)); for (let y = Math.max(0, y0 - r3); y <= Math.min(W - 1, y1 + r3); y++) for (let x = Math.max(0, x0 - r3); x <= Math.min(W - 1, x1 + r3); x++) if (w[y * W + x]) wn++;
      if (wn < 6 * sc * sc) continue;
      let l = 0, a = 0, b = 0; for (const q of px) { l += L[q]; a += A[q]; b += B[q]; } const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      let g = groups.find(g => Math.abs(g.cx - cx) <= 6 * sc && Math.abs(g.cy - cy) <= 6 * sc); if (!g) groups.push(g = { cx, cy, fr: new Set(), n: 0, l: 0, a: 0, b: 0 });
      g.fr.add(fi); g.n += px.length; g.l += l; g.a += a; g.b += b;
      if (!g.best || px.length > g.best.s) g.best = { s: px.length, l: l / px.length, a: a / px.length, b: b / px.length };   // v255: the iris is the BIGGEST compact blob of the spot; a small lash / hair fragment that only sometimes touches the eye must not tint its colour (the blonde girl's olive iris came out orange-brown)
    }
  });
  const need = frames.length < 3 ? frames.length : Math.max(3, .2 * frames.length), dist = (p, q) => Math.hypot((p.L - q.L) * 1.2, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6); let added = 0;
  for (const g of groups.filter(g => g.fr.size >= need).sort((p, q) => q.fr.size - p.fr.size)) {
    if (added >= 2) break;
    const c = { L: g.best.l, a: g.best.a, b: g.best.b, x: (g.cx + .5) / W, y: (g.cy + .5) / W }, hc = hueDeg(c.a, c.b);
    if (pal.some(q => q.eye && Math.abs(q.x - c.x) < .12 && Math.abs(q.y - c.y) < .12 && hd(hueDeg(q.a, q.b), hc) < 30)) continue;   // the same eye as one already found (its darker shade)
    const wm = hc > 15 && hc < 85, hn = wm ? Math.min(100, hc + 35) * Math.PI / 180 : 0, cm = Math.hypot(c.a, c.b) * 2.2, e = { L: c.L - (wm ? .08 : 0), a: wm ? Math.cos(hn) * cm : c.a * 2.2, b: wm ? Math.sin(hn) * cm : c.b * 2.2, share: .0004, x: c.x, y: c.y, eye: true, frs: [...g.fr] };   // v255: a WARM iris (hue 15-85) reads as the same orange-brown as skin / hair (blonde girl's olive eye came out #774513 / #6d4a2e), so its hue is turned 35 deg toward olive (max 100) before the x2.2 boost; green / blue / purple irises are untouched   // v255: a WARM iris (hue 15-85, close to skin / hair) is only turned up a little: x2.2 made the blonde girl's dull olive-brown iris an orange (#774513); a green / blue / purple iris keeps x2.2
    if (pal.some(q => dist(q, e) < .05)) continue;
    if (frames.length < 3 && pal.length >= PALMAX) break;   // a still only fills a FREE slot
    while (pal.length >= PALMAX) { if (tintPaletteFreeSlot(pal) || tintPaletteFreeSlot(pal, true)) continue; let k = -1; for (let i = 1; i < pal.length; i++) if (!pal[i].eye && !pal[i].extra && !tintPaletteIsBlush(pal[i]) && (k < 0 || pal[i].share < pal[k].share)) k = i; if (k < 0) break; pal.splice(k, 1); }   // a small detail outranks the smallest plain shade of a big colour (a cream next to the beige)
    if (pal.length >= PALMAX) break;
    pal.push(e); added++;
  }
  if (added) pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteMergeKin(pal) {   // v208 final (owner: the skin colour appeared too many times): an ANIMATED picture's small shade of a big colour of the same hue family (within 30 deg, lightness within .2, at most 25 % of its share; e.g. a saturated skin-shadow next to the big skin colour) is the same colour: its share goes to the big one, its slot is freed. Never the first colour, never a blush or an eye, never a different-looking hue. Returns pal.
  const hd = (u, v) => { const x = Math.abs(u - v); return Math.min(x, 360 - x); }, hu = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
  for (let again = true; again;) { again = false; for (let i = 1; i < pal.length && !again; i++) { const c = pal[i]; if (c.eye || c.extra || tintPaletteIsBlush(c) || Math.hypot(c.a, c.b) < .03) continue; const j = pal.findIndex((o, k) => k !== i && o.share > 0 && c.share <= .25 * o.share && !o.eye && !o.extra && Math.hypot(o.a, o.b) >= .03 && hd(hu(o), hu(c)) <= 30 && Math.abs(o.L - c.L) < .2); if (j >= 0) { pal[j].share += c.share; pal.splice(i, 1); again = true; } } }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteDedupe(pal) {   // v240 (owner: "the palette takes the same colour so many times: hair is one, eye is one, blush is one, skin is one, the bed 3, and that is all"). The LAST step of every palette (still, GIF, WebP, video): no two colours of the final list may look alike. Every earlier step (core clusters, accents, hue pass, eyes, extras, iris) looks at the picture on its own, so each could add a colour that an earlier one already made (two shades of skin, the same olive eye found twice, a blue "eye" that is just the bed stripe). Rule, on the colour only (nothing about one picture): two PLAIN colours closer than .06 are one colour (the core clustering merges at .07, so this only catches what the later steps added); a small DETAIL (eye, extra, blush, or under 3 % of the picture) is dropped when it is closer than .06 to ANY other colour, or when it is within 22 deg of the same hue and closer than .10 (a darker, more vivid shade of the same blue / skin); two eyes of one hue family (30 deg, closer than .12) are ONE eye colour (both eyes of a face are the same colour). A real different detail is never touched: a blush against skin is 30+ deg away in hue and far in colour, an olive eye against beige and gold is 35+ deg away. The first colour (rank 1) is never dropped. The kept colour takes the shares of the ones it swallowed; two plain colours become their share-weighted average. Returns pal (changed in place, ranks renumbered).
  if (!pal || pal.length < 2) return pal;
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), hu = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const x = Math.abs(u - v); return Math.min(x, 360 - x); }, cn = c => Math.hypot(c.a, c.b);
  const isDet = c => !!(c.eye || c.extra || (c.share || 0) < .03 || tintPaletteIsBlush(c));
  for (let again = true; again;) {
    again = false;
    for (let i = 0; i < pal.length && !again; i++) for (let j = i + 1; j < pal.length && !again; j++) {
      const p = pal[i], q = pal[j], d = dist(p, q), dp = isDet(p), dq = isDet(q);
      let same = false;
      if (p.gap || q.gap) continue;   // v246: a colour found in a gap (hair, background) is kept as its own colour
      if (!dp && !dq) same = d < ((p.L < .3 && q.L < .3) ? .03 : .06);   /* v262 (owner: "split the darker colours more finely"): two DARK plain colours (L < .3) are one colour only when very close (.03), so a black hair and a dark background stay two colours */
      else if (p.eye && q.eye) same = d < .12 && hd(hu(p), hu(q)) < 30;
      else same = d < .06 || (d < .10 && cn(p) > .02 && cn(q) > .02 && hd(hu(p), hu(q)) < 22 && !(tintPaletteIsBlush(p) !== tintPaletteIsBlush(q)));   // a blush is never "the same" as a non-blush
      if (!same) continue;
      if (!dp && !dq) { const w = (p.share || 0) + (q.share || 0) || 1, sp = (p.share || 0) / w, sq = 1 - sp; pal[i] = { ...p, L: p.L * sp + q.L * sq, a: p.a * sp + q.a * sq, b: p.b * sp + q.b * sq, share: (p.share || 0) + (q.share || 0), x: p.x * sp + q.x * sq, y: p.y * sp + q.y * sq }; pal.splice(j, 1); again = true; continue; }
      let keep = i, drop = j;   // keep the plain colour over a detail; between two details the eye / the bigger one; the first colour always stays
      if (dp !== dq) { keep = dp ? j : i; drop = dp ? i : j; } else if (i !== 0 && ((q.eye && !p.eye) || (!!q.eye === !!p.eye && (q.share || 0) > (p.share || 0)))) { keep = j; drop = i; }
      pal[keep] = { ...pal[keep], share: (pal[keep].share || 0) + (pal[drop].share || 0) }; pal.splice(drop, 1); again = true;
    }
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteSplitBig(pal, d, W = 96) {   // v240 (owner: "the hair is one colour, the skin is one colour"): ONE big plain colour that is really TWO things of the same hue family (a blonde's gold hair and her pale skin both became one beige of 45 % of the picture) is split in two, but only into a FREE slot, and only when the two halves are clearly different (.065, just above the .06 that the look-alike clean-up treats as one colour, so the two halves survive it) and each is a real part of the picture (>= 10 %). Looks at the same kept 96x96 frames the palette was made from; a picture without them is left alone. The pixels are given to their nearest palette colour, the biggest plain colour (>= 25 %) is cut by 2-means (light half / dark half), and the two means replace it. Returns pal.
  const fr = d && d.hi && ((d.hi.frames && d.hi.frames.length) ? d.hi.frames : d.hi.hueFrames), wt = d && d.hi && ((d.hi.frames && d.hi.frames.length) ? d.hi.w : d.hi.hueW);
  if (!fr || !fr.length || !pal || !pal.length || pal.length >= PALMAX - 1) return pal;
  const sc = (u, v) => Math.hypot((u.L - v.L) * .6, (u.a - v.a) * 1.6, (u.b - v.b) * 1.6), P = [], own = pal.map(() => 0); let tot = 0;
  fr.forEach((f, fi) => { const w = (wt && wt[fi]) || 1; for (let y = 0; y < W; y += 2) for (let x = 0; x < W; x += 2) { const o = (y * W + x) * 4, [L, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]); let bj = 0, bd = 1e9; for (let j = 0; j < pal.length; j++) { const dd = sc({ L, a, b }, pal[j]); if (dd < bd) { bd = dd; bj = j; } } P.push({ L, a, b, w, j: bj, x: (x + .5) / W, y: (y + .5) / W }); own[bj] += w; tot += w; } });
  let k = -1; pal.forEach((c, j) => { if (!c.eye && !c.extra && !tintPaletteIsBlush(c) && own[j] >= .25 * tot && (k < 0 || own[j] > own[k])) k = j; });
  if (k < 0) return pal;
  const M = P.filter(q => q.j === k); let c1 = null, c2 = null;
  { const Ls = M.map(q => q.L).sort((u, v) => u - v); const lo = Ls[Math.floor(.1 * Ls.length)], hi = Ls[Math.floor(.9 * Ls.length)]; const nearL = t => M.reduce((m, q) => (Math.abs(q.L - t) < Math.abs(m.L - t) ? q : m), M[0]); c1 = { ...nearL(hi) }; c2 = { ...nearL(lo) }; }
  let g1 = [], g2 = [];
  for (let it = 0; it < 10; it++) { g1 = []; g2 = []; for (const q of M) (sc(q, c1) <= sc(q, c2) ? g1 : g2).push(q); for (const [c, g] of [[c1, g1], [c2, g2]]) { const w = g.reduce((s, q) => s + q.w, 0); if (w > 0) { c.L = g.reduce((s, q) => s + q.w * q.L, 0) / w; c.a = g.reduce((s, q) => s + q.w * q.a, 0) / w; c.b = g.reduce((s, q) => s + q.w * q.b, 0) / w; } } }
  const w1 = g1.reduce((s, q) => s + q.w, 0), w2 = g2.reduce((s, q) => s + q.w, 0);
  if (!(w1 >= .10 * tot && w2 >= .10 * tot && sc(c1, c2) >= .065)) return pal;
  const mk = (c, g, w) => ({ L: c.L, a: c.a, b: c.b, share: pal[k].share * w / (w1 + w2), x: g.reduce((s, q) => s + q.w * q.x, 0) / w, y: g.reduce((s, q) => s + q.w * q.y, 0) / w });
  pal.splice(k, 1, mk(c1, g1, w1), mk(c2, g2, w2)); pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteAddTints(pal, d, W = 96) {   // v241 (owner: "the thin turquoise line at the left and right edge of the bed is missing, fix small details like that"). A thin, pale or small tinted line / spot (a turquoise bed stripe, a coloured trim) is 0.3 % of the picture, mostly pale (chroma .045) and it sits on the picture's EDGE, so the blob steps (they skip the outer 6 % and want a compact shape) and the hue pass (it wants L < .92) all miss it. This step looks at the same kept 96x96 frames and takes every pixel that has a real tint (chroma >= .035, L >= .3) and is NOT already near a palette colour (.05); those pixels are binned by hue (30 deg) and lightness (.25, so a stripe whose light and shadowed parts differ stays ONE bin); a bin that is present in >= 20 % of the frames (a still: its one frame), averages >= 8 px per frame at 96 px, and is under 3 % of the picture (a bigger area belongs to the core colours) becomes ONE new palette colour (chroma x 1.8 for a pale tint down to x 1.1 for an already vivid one, so a pale tint still reads and a vivid one does not turn neon), at most 3, only into FREE slots (nothing is dropped), the colour that is least like the first one second. Edges, thin and long shapes are allowed on purpose. Its place is the busier side (a stripe on both edges glows on one). Returns pal.
  const fr = d && d.hi && ((d.hi.frames && d.hi.frames.length) ? d.hi.frames : d.hi.hueFrames);
  if (!fr || !fr.length || !pal || !pal.length || pal.length >= PALMAX) return pal;
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), sc = W / 96, bins = new Map(); let tot = 0;
  fr.forEach((f, fi) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; tot++; const [L, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]), cn = Math.hypot(a, b); if (cn < .035 || L < .3) continue; const c = { L, a, b }; let near = false; for (let j = 0; j < pal.length; j++) if (dist(c, pal[j]) < .05) { near = true; break; } if (near) continue;
    const k = Math.floor(((Math.atan2(b, a) * 180 / Math.PI + 360) % 360) / 30) * 10 + Math.min(3, Math.floor(L / .25)), B = bins.get(k) || (bins.set(k, { n: 0, L: 0, a: 0, b: 0, fr: new Set(), lx: 0, ln: 0, ly: 0, rx: 0, rn: 0, ry: 0 }), bins.get(k));
    B.n++; B.L += L; B.a += a; B.b += b; B.fr.add(fi); if (x < W / 2) { B.ln++; B.lx += x; B.ly += y; } else { B.rn++; B.rx += x; B.ry += y; } } });
  const need = fr.length < 3 ? fr.length : Math.max(1, Math.ceil(.2 * fr.length)), per = tot / fr.length;
  const cand = [...bins.values()].filter(B => B.fr.size >= need && B.n / B.fr.size >= 8 * sc * sc && B.n / tot < .05).map(B => { const left = B.ln >= B.rn; return { L: B.L / B.n, a: B.a / B.n, b: B.b / B.n, n: B.n, share: B.n / tot, x: ((left ? B.lx / B.ln : B.rx / B.rn) + .5) / W, y: ((left ? B.ly / B.ln : B.ry / B.rn) + .5) / W }; }).map(c => { const hc = Math.atan2(c.b, c.a) * 180 / Math.PI, hdm = Math.min(180, ...pal.filter(q => Math.hypot(q.a, q.b) > .02).map(q => { const x = Math.abs(Math.atan2(q.b, q.a) * 180 / Math.PI - hc) % 360; return x > 180 ? 360 - x : x; })); return { ...c, hdm, sc: c.n * Math.hypot(c.a, c.b) * Math.min(1, hdm / 45) }; }).filter(c => !(c.hdm < 22 && pal.some(q => dist(q, c) < .10))).sort((p, q) => q.sc - p.sc);   // a candidate that is only a shade of a colour the palette has (same hue family, close) would be dropped by the look-alike clean-up anyway: it must not use up a slot; the rest are ranked by how DIFFERENT their hue is
  let added = 0; const got = [];
  for (const c of cand) { if (added >= 3 || pal.length >= PALMAX) break; if (got.some(g => dist(g, c) < .06) || pal.some(q => dist(q, c) < .05)) continue; const cn = Math.hypot(c.a, c.b), bo = cn < .05 ? 1.8 : cn > .08 ? 1.1 : 1.8 - .7 * (cn - .05) / .03; got.push(c); pal.push({ L: c.L, a: c.a * bo, b: c.b * bo, share: Math.min(c.share, .02), x: c.x, y: c.y, extra: true, tint: true }); added++; }
  if (added) pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteAddMasses(pal, d, W = 96) {   // v243 (owner: "you still miss the black hair, the brown hair, the copper and the silver"). The palette is picked by vividness AND size, so a big but plain / muted colour (copper next to a vivid red, silver chrome, a brown hair shade, a plain black) can lose its slot. This step looks at the same kept 96x96 frames, bins EVERY pixel in OKLab (lightness .16, a / b .08, so shading of one colour stays one bin), and a bin that is at least 2 % of the picture and clearly different (> .065, just above the .06 the look-alike clean-up merges) from every palette colour is added in its own TRUE colour (no chroma boost), at its own place. Free slot first; a full palette gives up its smallest plain, non-detail, non-first colour when that one is under half the size of the missing mass. At most 3. Returns pal.
  const fr = d && d.hi && ((d.hi.frames && d.hi.frames.length) ? d.hi.frames : d.hi.hueFrames);
  if (!fr || !fr.length || !pal || !pal.length) return pal;
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), bins = new Map(); let tot = 0;
  fr.forEach(f => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; tot++; const [L, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]), k = Math.floor(L / .16) * 10000 + (Math.floor((a + .5) / .08) + 100) * 100 + Math.floor((b + .5) / .08) + 100, B = bins.get(k) || (bins.set(k, { n: 0, L: 0, a: 0, b: 0, x: 0, y: 0 }), bins.get(k)); B.n++; B.L += L; B.a += a; B.b += b; B.x += x; B.y += y; } });
  const cand = [...bins.values()].filter(B => B.n / tot >= .02).map(B => ({ L: B.L / B.n, a: B.a / B.n, b: B.b / B.n, share: B.n / tot, x: (B.x / B.n + .5) / W, y: (B.y / B.n + .5) / W })).filter(c => pal.every(q => dist(q, c) > .065)).sort((p, q) => q.share - p.share);
  let added = 0; const got = [];
  for (const c of cand) {
    if (added >= 3) break; if (got.some(g => dist(g, c) < .065)) continue;
    if (pal.length >= PALMAX) { let k = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.extra || tintPaletteIsBlush(q) || (q.share || 0) >= c.share * .5) continue; if (k < 0 || q.share < pal[k].share) k = i; } if (k < 0) continue; pal.splice(k, 1); }
    got.push(c); pal.push({ L: c.L, a: c.a, b: c.b, share: c.share, x: c.x, y: c.y, mass: true }); added++;
  }
  if (added) pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteConsolidate(pal, d, W = 96) { const TH = .01;   // the most the mean pixel error may get worse per merge (tested .006 / .01 / .012 / .02 on 8 covers: .01 keeps Blinding's highlights and merges the skin)   // v245 (owner: "Starboy has only yellow, red, blue, light blue and black, stop messing that up"; "it takes the skin colour so many times, and it misses the black hair"). The LAST step, after Dedupe. Earlier steps each add a colour from the same area (skin shade, skin shadow, a coral lip, a second red, a second black). A merge or a drop is only made when the picture is still represented as well afterwards: the mean distance from each picture pixel to its nearest palette colour may get worse by at most .01. So two shades of one skin merge, but a real hair colour (a different object) never does. Same-family candidates only (hue within 30 deg and close chroma, or two near-greys of close lightness); rank 1 is never dropped; eyes, extras (hair, earring) are never merged; a blush merges only into a same-hue colour. Returns pal (changed in place, ranks renumbered).
  if (!pal || pal.length < 2) return pal;
  const hueOf = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hd = (p, q) => { const x = Math.abs(hueOf(p) - hueOf(q)) % 360; return x > 180 ? 360 - x : x; };
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), cn = c => Math.hypot(c.a, c.b), grey = c => cn(c) < .05;
  const prot = c => !!(c.eye || c.extra || c.gap || tintPaletteIsBlush(c));   // v246: a colour found in a gap between the others (gap) is kept, it is not merged back
  const px = []; if (d && d.hi && d.hi.frames && d.hi.frames.length) d.hi.frames.forEach(f => { for (let y = 0; y < W; y += 2) for (let x = 0; x < W; x += 2) { const o = (y * W + x) * 4; const [L, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]); px.push({ L, a, b }); } });
  if (!px.length) return pal;   // without the picture's pixels there is nothing to check a merge against: leave the palette as it is
  const err = list => { let t = 0; for (const p of px) { let bd = 1e9; for (const c of list) { const dd = dist(p, c); if (dd < bd) bd = dd; } t += bd; } return t / px.length; };
  const same = (p, q) => (grey(p) && grey(q) && Math.abs(p.L - q.L) < .08) || (hd(p, q) < 30 && Math.abs(cn(p) - cn(q)) < .03 && cn(p) > .02 && Math.abs(p.L - q.L) < .3);
  const mergeOf = (A, B) => { const s = (A.share || 0) + (B.share || 0) || 1, w = (A.share || 0) / s, m = { L: A.L * w + B.L * (1 - w), a: A.a * w + B.a * (1 - w), b: A.b * w + B.b * (1 - w), share: s, x: (A.x == null ? .5 : A.x) * w + (B.x == null ? .5 : B.x) * (1 - w), y: (A.y == null ? .5 : A.y) * w + (B.y == null ? .5 : B.y) * (1 - w), rank: A.rank }; return m; };
  let base = err(pal);
  for (let again = true; again;) { again = false; const cands = []; for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) { const p = pal[i], q = pal[j]; if (prot(p) || prot(q)) { if (!(tintPaletteIsBlush(p) || tintPaletteIsBlush(q)) || !(hd(p, q) < 30)) continue; } if (same(p, q)) cands.push({ i, j, d: dist(p, q) }); } cands.sort((x, y) => x.d - y.d);
    for (const c of cands) { const trial = pal.slice(); const m = mergeOf(pal[c.i], pal[c.j]); trial[c.i] = m; trial.splice(c.j, 1); const e = err(trial); if (e - base < TH) { pal.splice(0, pal.length, ...trial); base = e; again = true; break; } } }
  // v245b (owner: "why is it taking the same colour so many times"): any two colours of the same hue family that are still close are one repeat; merge the closest such pair when the picture stays covered (tolerance TH2 on the mean pixel error), for ANY picture
  const TH2 = .006;   // tested on 23 pictures: repeats 27 -> 5 (.02 removed all repeats but cut the colour coverage a lot; .003 kept more coverage but 15 repeats)
  for (let again = true; again;) { again = false; const rp = []; for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) { const p = pal[i], q = pal[j]; if (p.eye || q.eye || p.extra || q.extra || p.gap || q.gap || tintPaletteIsBlush(p) || tintPaletteIsBlush(q)) continue; if (Math.min(p.share || 0, q.share || 0) < .02) continue; if (hd(p, q) < 25 && dist(p, q) < .2) rp.push({ i, j, d: dist(p, q) }); } rp.sort((x, y) => x.d - y.d);
    for (const c of rp) { const trial = pal.slice(); trial[c.i] = mergeOf(pal[c.i], pal[c.j]); trial.splice(c.j, 1); const e = err(trial); if (e - base < TH2) { pal.splice(0, pal.length, ...trial); base = e; again = true; break; } } }
  for (let again = true; again;) { again = false; for (let j = 1; j < pal.length && !again; j++) { const c = pal[j]; if (prot(c) || (c.share || 0) >= .03) continue; let k = -1, bd = 1e9; for (let i = 0; i < pal.length; i++) { if (i === j) continue; const dd = dist(c, pal[i]); if (dd < bd && hd(c, pal[i]) < 40) { bd = dd; k = i; } } if (k < 0 || bd > .12 || hd(c, pal[k]) > 22) continue; /* only a real look-alike (same hue family, close colour) is dropped: a small iris, earring or blush of another hue is kept */ const trial = pal.slice(); trial[k] = { ...pal[k], share: (pal[k].share || 0) + (c.share || 0) }; trial.splice(j, 1); const e = err(trial); if (e - base < TH) { pal.splice(0, pal.length, ...trial); base = e; again = true; } } }
  // the primary (rank 1, the base of the background) is the BIGGEST plain colour when it covers a real part of the picture (a coral cheek at 11 % must not cover a black-haired picture)
  let big = -1; for (let i = 0; i < pal.length; i++) { const c = pal[i]; if (prot(c) || c.eye || c.derived) continue; if (big < 0 || (c.share || 0) > (pal[big].share || 0)) big = i; }
  if (big > 0 && (pal[big].share || 0) >= .25 && (pal[big].share || 0) > (pal[0].share || 0) * 1.5) { const c = pal.splice(big, 1)[0]; pal.unshift(c); }
  pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteAddGaps(pal, d, W = 96) {   // v246 (owner: "it's not taking the hair colour, why the hell?" - two circled portraits). A mid-dark tone (hair brown, L about .40) that lies BETWEEN two palette colours (skin .48 and a dark shade .29) is absorbed by the core clustering, so it never gets a colour. This step looks at the kept 96x96 frames: pixels whose nearest palette colour is far (> .045) are grouped by hue (20 deg) and lightness (.08 bins); a group that covers >= 6 % of the picture and has a real tint (chroma >= .02) is added in its TRUE colour, into a free slot, or in place of the smallest plain colour that is under half its size. At most 2. Nothing is recoloured. Returns pal.
  const fr = d && d.hi && ((d.hi.frames && d.hi.frames.length) ? d.hi.frames : d.hi.hueFrames);
  if (!fr || !fr.length || !pal || !pal.length || pal.length >= PALMAX + 1) return pal;
  const dist = (p, q) => Math.hypot((p.L - q.L) * .6, (p.a - q.a) * 1.6, (p.b - q.b) * 1.6), bins = new Map(); let tot = 0;
  fr.forEach(f => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; tot++; const [L, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]); const near = pal.reduce((m, c) => Math.min(m, dist({ L, a, b }, c)), 1e9); if (near <= .045) continue; const cn = Math.hypot(a, b); if (cn < .02) continue; const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, k = Math.floor(h / 20) * 1000 + Math.floor(L / .08); let B = bins.get(k); if (!B) bins.set(k, B = { n: 0, L: 0, a: 0, b: 0, x: 0, y: 0 }); B.n++; B.L += L; B.a += a; B.b += b; B.x += x; B.y += y; } });
  const cand = [...bins.values()].map(B => ({ L: B.L / B.n, a: B.a / B.n, b: B.b / B.n, share: B.n / tot, x: (B.x / B.n + .5) / W, y: (B.y / B.n + .5) / W })).filter(c => c.share >= .06).sort((p, q) => q.share - p.share);
  let added = 0;
  for (const c of cand) {
    if (added >= 2) break; if (pal.some(q => dist(q, c) < .045)) continue;
    if (pal.length >= PALMAX) { let k = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.extra || tintPaletteIsBlush(q) || (q.share || 0) >= c.share * .5) continue; if (k < 0 || q.share < pal[k].share) k = i; } if (k < 0) continue; pal.splice(k, 1); }
    pal.push({ L: c.L, a: c.a, b: c.b, share: c.share, x: c.x, y: c.y, gap: true }); added++;
  }
  if (added) pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteHairFrames(d) { return d && d.hi ? (d.hi.frames && d.hi.frames.length ? d.hi.frames : d.hi.hueFrames && d.hi.hueFrames.length ? d.hi.hueFrames : null) : null; }
function tintPaletteAddHair(pal, frames, W = 96) {   // v209 (owner: "the cover colour palette does not take the hair colours from the hair, it takes them from a different place"). The earlier steps pick colours by size and vividness, so the hair was either mixed into the skin (one brown for hair AND face, sitting in the middle of the face) or boosted / moved to another place. This step reads the HAIR ITSELF, by where hair sits and what colour it is (nothing about one picture): the pixels of the TOP band (top 26 %) and the two SIDE bands (outer 20 %, down to 75 % of the height) that are warm brown / gold (hue 35-100 deg, chroma .03-.16, lightness .22-.78: the blue / grey background, the black outlines and the white highlights are outside it). When they cover >= 2 % of the picture, their TRUE median colour (no chroma boost, no mixing with skin) is added at the place where those pixels really are. When the hair has a clearly lighter and a clearly darker tone (2-means on lightness, each >= 25 % of the hair pixels, > .05 apart) both are added (lit strands + shaded strands). Each is marked hair: true, so the gradient draws it in its own exact colour. Only into free slots (a full palette gives up its smallest plain non-detail colour). Returns pal.
  if (!frames || !frames.length || !pal || !pal.length) return pal;
  const px = []; let tot = 0;
  for (const f of frames) for (let q = 0; q < W; q++) for (let p = 0; p < W; p++) {
    tot++; if (!(q < .26 * W || ((p < .2 * W || p >= .8 * W) && q < .75 * W))) continue;
    const i = (q * W + p) * 4, [L, a, b] = mixToLab(f[i], f[i + 1], f[i + 2]), cn = Math.hypot(a, b), h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
    if (cn >= .03 && cn <= .16 && h >= 35 && h <= 100 && L >= .22 && L <= .78) px.push({ L, a, b, x: p, y: q });
  }
  if (px.length < .02 * tot) return pal;
  const med = (v, k) => { const s = v.map(e => e[k]).sort((m, n) => m - n); return s[Math.floor(s.length / 2)]; };
  const mk = v => {   // the colour = the true median; the place = the densest real spot of exactly that colour (a scattered centroid of thin strands would land on the face)
    const L = med(v, 'L'), a = med(v, 'a'), b = med(v, 'b'), near = v.filter(e => Math.hypot(e.L - L, e.a - a, e.b - b) < .03), key = e => e.y * W + e.x, set = new Set(near.map(key));
    let bx = near.length ? near[0].x : W / 2, by = near.length ? near[0].y : W / 2, bn = -1; const R = Math.max(1, Math.round(3 * W / 96));
    for (const e of near) { let n = 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (set.has((e.y + dy) * W + e.x + dx)) n++; if (n > bn) { bn = n; bx = e.x; by = e.y; } }
    return { L, a, b, share: v.length / tot, x: (bx + .5) / W, y: (by + .5) / W, hair: true };
  };
  const sorted = px.slice().sort((m, n) => m.L - n.L), cut = med(px, 'L'), lo = sorted.filter(e => e.L < cut), hi = sorted.filter(e => e.L >= cut);
  let out = [mk(px)];
  if (lo.length >= .25 * px.length && hi.length >= .25 * px.length) { const A = mk(hi), B = mk(lo); if (Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b) > .05) out = [A, B]; }
  for (const c of out) {
    while (pal.length >= PALMAX) { let k = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.hair || q.eye || q.extra || tintPaletteIsBlush(q) || (q.share || 0) < .03 || Math.hypot(q.a, q.b) > .05) continue; if (k < 0 || (q.share || 0) < (pal[k].share || 0)) k = i; } if (k < 0) break; pal.splice(k, 1); }   // a small or vivid colour (blush, olive iris, earring) is never given up for hair
    if (pal.length < PALMAX) pal.push(c);
  }
  pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteReadPx(frames, W) {   // v210: every pixel of the kept frames as OKLab + place: a flat Float32Array [L, a, b, x, y, ...]
  const out = new Float32Array(frames.length * W * W * 5); let k = 0;
  for (const f of frames) for (let q = 0; q < W; q++) for (let p = 0; p < W; p++) { const i = (q * W + p) * 4, [L, a, b] = mixToLab(f[i], f[i + 1], f[i + 2]); out[k++] = L; out[k++] = a; out[k++] = b; out[k++] = p; out[k++] = q; }
  return out;
}
function tintPaletteSpot(pts, W) {   // v210: the DENSEST real spot of a set of pixels [{x, y}]: the pixel with the most set members within 3 px. Returns { x, y } in 0..1, or null
  if (!pts.length) return null; const set = new Set(pts.map(e => e.y * W + e.x)); let bx = pts[0].x, by = pts[0].y, bn = -1;
  const R = Math.max(1, Math.round(3 * W / 96)); for (const e of pts) { let n = 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (set.has((e.y + dy) * W + e.x + dx)) n++; if (n > bn) { bn = n; bx = e.x; by = e.y; } }
  return { x: (bx + .5) / W, y: (by + .5) / W };
}
function tintPaletteAddCoverage(pal, frames, W = 96) {   // v210 (owner: "her shirt, the green-grey at the bottom, is missing; make sure we never miss a detail like that in ANY picture"). A general safety net, nothing about one picture: after every other step, look at the kept real frames and find the colour area that the palette represents WORST: pixels whose nearest palette colour is far (> .06 in OKLab) are binned (lightness .08, a / b .03); a bin that is >= 0.8 % of the picture, with a mean distance > .08, SOLID (>= 60 % of its pixels have 5+ neighbours of the same bin: an area, not a line or scattered noise) and a different colour (a / b differ >= .02, or lightness >= .18) from the nearest palette colour, is a real colour the palette is missing (a shirt, a wall, a prop, a sky). It is added in its TRUE colour at its densest real spot, at most 2. If the palette is full, the colour whose loss would hurt the picture least (its pixels are nearly as close to another colour) gives up its slot, but only when the loss is smaller than what the new colour gains. Never drops the first colour, hair, an eye, an extra, a blush, a small (< 3 %) or vivid colour. Returns pal.
  if (!frames || !frames.length || !pal || !pal.length) return pal;
  const px = tintPaletteReadPx(frames, W), n = px.length / 5, near = (L, a, b, list) => { let m = 9; for (const c of list) { const d = Math.hypot(L - c.L, a - c.a, b - c.b); if (d < m) m = d; } return m; };
  for (let round = 0; round < 2; round++) {
    const bins = new Map();
    for (let i = 0; i < n; i++) { const L = px[i * 5], a = px[i * 5 + 1], b = px[i * 5 + 2], d = near(L, a, b, pal); if (d <= .06) continue; const key = Math.round(L / .08) + '_' + Math.round(a / .03) + '_' + Math.round(b / .03), B = bins.get(key) || (bins.set(key, { n: 0, d: 0, L: 0, a: 0, b: 0, pts: [] }), bins.get(key)); B.n++; B.d += d; B.L += L; B.a += a; B.b += b; B.pts.push({ x: px[i * 5 + 3], y: px[i * 5 + 4] }); }
    const solid = B => { const set = new Set(B.pts.map(e => e.y * W + e.x)); let inner = 0; for (const e of B.pts) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dy || dx) && set.has((e.y + dy) * W + e.x + dx)) m++; if (m >= (W < 64 ? 3 : 5)) inner++; } return inner / B.pts.length; };   // at 32 px an area is only a few pixels wide, so 3 same-bin neighbours (not 5) already mean inside   // an AREA (a shirt, a wall) has pixels inside it; outlines, thin lines, scattered highlights and noise do not
    const diffKind = B => { const L = B.L / B.n, a = B.a / B.n, b = B.b / B.n; let q = pal[0], m = 9; for (const c of pal) { const d = Math.hypot(L - c.L, a - c.a, b - c.b); if (d < m) { m = d; q = c; } } return Math.hypot(a - q.a, b - q.b) >= .02 || Math.abs(L - q.L) >= .18; };   // a different COLOUR (hue / chroma) or a clearly different lightness; a darker or lighter shade of a colour the palette has is not new
    const best = [...bins.values()].filter(B => B.n >= .008 * n * (W < 64 ? .6 : 1) && B.d / B.n > .08 && solid(B) >= .6 && diffKind(B)).sort((p, q) => q.n * q.d - p.n * p.d)[0]; if (!best) break;
    const c = { L: best.L / best.n, a: best.a / best.n, b: best.b / best.n, share: best.n / n, cover: true }, sp = tintPaletteSpot(best.pts, W); c.x = sp.x; c.y = sp.y;
    if (pal.length >= PALMAX) {   // give up the colour that is the most redundant, if that costs less than the new colour gains
      const all = pal.concat([c]).filter(q => q !== c); let kk = -1, kc = Infinity; const gain = best.n / n * best.d / best.n;
      pal.forEach((q, j) => { if (j === 0 || q.hair || q.eye || q.extra || q.cover || tintPaletteIsBlush(q) || (q.share || 0) < .03 || Math.hypot(q.a, q.b) > .05) return; let loss = 0; const rest = pal.filter((_, t) => t !== j); for (let i = 0; i < n; i += 3) { const L = px[i * 5], a = px[i * 5 + 1], b = px[i * 5 + 2], d1 = Math.hypot(L - q.L, a - q.a, b - q.b); if (d1 > near(L, a, b, rest) + 1e-9) continue; loss += near(L, a, b, rest) - d1; } loss = loss * 3 / n; if (loss < kc) { kc = loss; kk = j; } });
      if (kk < 0 || kc >= gain) break; pal.splice(kk, 1);
    }
    pal.push(c);
  }
  pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteRelocate(pal, frames, W = 96) {   // v210 (owner: "the blush is in the wrong place, the 8th colour came from nowhere"). A colour's place used to be an average (a centroid) of where its pixels sit, which can land on a spot that does not have that colour at all (a background grey-blue dot on the face, a two-cheek blush dot on the nose). Now: if the 7 x 7 pixels around a colour's place do not hold that colour (< 8 % match), the colour is moved to the DENSEST real spot of its pixels. A match = within .05 of the colour in OKLab; a colour made more vivid than the picture (blush, iris: almost no exact match) matches the same hue (25 deg), real chroma (>= .3 of it) and lightness within .3 instead. Hair and colours that already sit on their colour are left alone. Returns pal.
  if (!frames || !frames.length || !pal || !pal.length) return pal;
  const px = tintPaletteReadPx(frames, W), n = px.length / 5, hu = (a, b) => Math.atan2(b, a) * 180 / Math.PI;
  for (const c of pal) {
    if (c.hair || c.x == null || (c.share || 0) >= .12) continue; const cn = Math.hypot(c.a, c.b), hc = hu(c.a, c.b);
    const exact = i => Math.hypot(px[i * 5] - c.L, px[i * 5 + 1] - c.a, px[i * 5 + 2] - c.b) < .05;
    let any = 0; for (let i = 0; i < n; i++) if (exact(i)) { any++; if (any > 5) break; }
    const hueM = i => { const a = px[i * 5 + 1], b = px[i * 5 + 2], ch = Math.hypot(a, b); let dh = Math.abs(hu(a, b) - hc); if (dh > 180) dh = 360 - dh; return cn > .04 && dh < 25 && ch >= .3 * cn && Math.abs(px[i * 5] - c.L) < .3; };
    const match = any > 5 ? exact : hueM, cx = Math.round(c.x * W - .5), cy = Math.round(c.y * W - .5), here = new Set(); let hit = 0, tot = 0;
    const grid = new Set(); for (let i = 0; i < n; i++) if (match(i)) grid.add(px[i * 5 + 4] * W + px[i * 5 + 3]);
    const R = Math.max(1, Math.round(3 * W / 96)); for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { tot++; if (grid.has((cy + dy) * W + cx + dx)) hit++; }
    if (hit >= .08 * tot) continue;
    const pts = [...grid].map(k => ({ x: k % W, y: Math.floor(k / W) })), sp = tintPaletteSpot(pts, W); if (sp && pts.length >= Math.max(3, Math.round(6 * W * W / 9216))) { c.x = sp.x; c.y = sp.y; }
  }
  // v211 (owner: "where is the red coming from? the blush is pink, not red"): a small pink / rosy accent (blush, lips) was made 2.4 x more vivid than the picture so a tiny spot stays visible, and a dusty rose (134, 86, 80) turned into a red (160, 45, 33). It now takes the TRUE colour of the real pixels around its place (same hue, 9 x 9 px, median of the pinkest 40 %) with only a mild boost (x 1.3), so a pink blush stays pink.
  const hu2 = (a, b) => Math.atan2(b, a) * 180 / Math.PI;
  for (const c of pal) {
    if (c.hair || c.eye || c.extra || c.cover || c.x == null || (c.share || 0) >= .06 || !tintPaletteIsBlush({ ...c, share: .01 })) continue; const hc = hu2(c.a, c.b), cx = Math.round(c.x * W - .5), cy = Math.round(c.y * W - .5), near = [];
    for (let i = 0; i < n; i++) { const x = px[i * 5 + 3], y = px[i * 5 + 4]; if (Math.abs(x - cx) > Math.max(1, Math.round(4 * W / 96)) || Math.abs(y - cy) > Math.max(1, Math.round(4 * W / 96))) continue; const a = px[i * 5 + 1], b = px[i * 5 + 2]; let dh = Math.abs(hu2(a, b) - hc); if (dh > 180) dh = 360 - dh; if (dh < 25 && Math.hypot(a, b) >= .02) near.push([px[i * 5], a, b]); }
    if (near.length < Math.max(3, Math.round(6 * W * W / 9216))) continue; near.sort((m, q) => Math.hypot(q[1], q[2]) - Math.hypot(m[1], m[2])); near.length = Math.ceil(.4 * near.length); const md = k => near.map(e => e[k]).sort((m, q) => m - q)[Math.floor(near.length / 2)];   // the pinkest 40 % (a blush next to skin: the skin pixels around it must not dull it)
    c.L = md(0); c.a = md(1) * 1.3; c.b = md(2) * 1.3; c.trueTone = true;
  }
  return pal;
}
function tintPaletteAddMissing(pal, frames, W = 96) {   // v247 (owner: a faint blush, a silver headband, the lit skin next to black hair, a chrome / silver sheen, a copper tone were all missing, on stills, GIFs and videos). A MORE SENSITIVE safety net than tintPaletteAddCoverage (which wants >= 0.8 % of the picture, a big colour distance and a solid block): nothing about one picture, it looks for ANY colour the finished palette does not represent.
  // 1) a pixel is COVERED when some palette colour is close in OKLab (< .07), or - because accent swatches are drawn more vivid than the picture - when both are coloured with the same hue (18 deg) and a similar lightness (.1), or both are grey-ish and similar in lightness. Everything else is MISSING.
  // 2) missing pixels are binned (lightness .07, a / b .035) and each bin is joined with its 26 neighbours, so a smooth blush or a metal sheen (a colour that slides over several bins) counts as ONE area. The best area (mass x how far it is from the palette) is taken when it is big enough (a coloured one >= 0.08 % of the picture, a grey / silver / black one >= 0.3 %) and SOLID (>= 45 % of its pixels have 3 or more neighbours of the same area: a real patch, not the 1 px blended edge between two colours, not a thin outline).
  // 3) it is added in its TRUE colour at its densest real spot (up to 4 per picture). A full palette gives up the colour that matters least (a look-alike, or the one whose share x vividness x distance-to-the-others is lowest, never the first colour, hair, an eye, an extra, a blush, a colour this step or the coverage step added) but only when the newcomer is worth clearly more.
  if (!frames || !frames.length || !pal || !pal.length) return pal;
  const px = tintPaletteReadPx(frames, W), n = px.length / 5, hu = (a, b) => Math.atan2(b, a) * 180 / Math.PI, hd = (a1, b1, a2, b2) => { const d = Math.abs(hu(a1, b1) - hu(a2, b2)); return d > 180 ? 360 - d : d; };
  const covered = (L, a, b, C, c) => { const cc = Math.hypot(c.a, c.b), grey = C <= .03, cGrey = cc <= .045; if (Math.hypot(L - c.L, a - c.a, b - c.b) < .06 && !(grey && cc > .06) && !(C > .06 && cGrey)) return true; if (C > .03 && cc > .03) return Math.abs(L - c.L) < .08 && hd(a, b, c.a, c.b) < 18 && cc <= 2.2 * C + .035 && C <= 2.2 * cc + .035; return grey && cGrey && Math.abs(L - c.L) < .08; };   // a silver / grey pixel is NOT covered by a pale blue (or a pale blue by a grey) just because they are close in OKLab; a same-hue colour only covers a pixel of a similar vividness (a silver sheen is not covered by a vivid sky blue)
  const near = (L, a, b) => { let m = 9; for (const c of pal) { const d = Math.hypot(L - c.L, a - c.a, b - c.b); if (d < m) m = d; } return m; };
  const worth = (share, cn, d) => Math.pow(Math.max(share, .0005), .55) * (.3 + Math.min(1.4, cn / .15)) * (d + .04);
  for (let round = 0; round < 4; round++) {
    const bins = new Map(), key = (i, j, k) => i + '_' + j + '_' + k;
    for (let i = 0; i < n; i++) {
      const L = px[i * 5], a = px[i * 5 + 1], b = px[i * 5 + 2], C = Math.hypot(a, b); if (L < .02) continue;
      let ok = false; for (const c of pal) if (covered(L, a, b, C, c)) { ok = true; break; } if (ok) continue;
      const bi = Math.round(L / .07), ba = Math.round(a / .035), bb = Math.round(b / .035), k = key(bi, ba, bb), B = bins.get(k) || (bins.set(k, { i: bi, a: ba, b: bb, n: 0, idx: [] }), bins.get(k)); B.n++; B.idx.push(i);
    }
    if (!bins.size) break;
    let best = null;
    for (const B of bins.values()) {   // join the 26 neighbours: one smooth colour area, however many bins it slides over
      let m = 0, sL = 0, sa = 0, sb = 0, idx = [];
      for (let di = -1; di <= 1; di++) for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const N = bins.get(key(B.i + di, B.a + da, B.b + db)); if (!N) continue; m += N.n; for (const q of N.idx) { sL += px[q * 5]; sa += px[q * 5 + 1]; sb += px[q * 5 + 2]; idx.push(q); } }
      const L = sL / m, a = sa / m, b = sb / m, C = Math.hypot(a, b), f = m / n, d = near(L, a, b);
      if (f < (C >= .045 ? .0008 : .003)) continue; if (best && f * (d + .04) <= best.v) continue;
      best = { v: f * (d + .04), L, a, b, C, f, d, idx };
    }
    if (!best) break;
    const set = new Set(best.idx.map(q => px[q * 5 + 4] * W + px[q * 5 + 3] + Math.floor(q / (W * W)) * 1e6)); let inner = 0;   // frame number is part of the key: a pixel's neighbours are in the SAME frame
    for (const q of best.idx) { const x = px[q * 5 + 3], y = px[q * 5 + 4], fo = Math.floor(q / (W * W)) * 1e6; let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dy || dx) && set.has((y + dy) * W + x + dx + fo)) m++; if (m >= 3) inner++; }
    // whatever happens, the area is not tried again this round: its pixels are marked as handled by adding (or skipping) a colour at its mean
    const solid = inner / best.idx.length;
    const c = { L: best.L, a: best.a, b: best.b, share: Math.max(.004, best.f), cover: true, resid: true };
    if (solid < .45) { pal.push({ ...c, _skip: true }); continue; }   // a placeholder so the next round looks at the next-best area (removed below)
    const sp = tintPaletteSpot(best.idx.map(q => ({ x: px[q * 5 + 3], y: px[q * 5 + 4] })), W); if (!sp) continue; c.x = sp.x; c.y = sp.y;
    const cnew = worth(c.share, best.C, best.d);
    if (pal.filter(q => !q._skip).length >= PALMAX) {
      const real = pal.filter(q => !q._skip); let freed = false; const sk = pal.filter(q => q._skip); sk.forEach(q => pal.splice(pal.indexOf(q), 1));
      if (tintPaletteFreeSlot(pal) || tintPaletteFreeSlot(pal, true)) freed = true;
      if (!freed) { let vi = -1, vw = Infinity; pal.forEach((q, j) => { if (j === 0 || q.hair || q.eye || q.extra || q.cover || tintPaletteIsBlush(q)) return; let dm = 9; pal.forEach((r, t) => { if (t !== j) dm = Math.min(dm, Math.hypot(q.L - r.L, q.a - r.a, q.b - r.b)); }); const w = worth(q.share || 0, Math.hypot(q.a, q.b), dm); if (w < vw) { vw = w; vi = j; } }); if (vi >= 0 && cnew > vw * 1.1) { pal.splice(vi, 1); freed = true; } }
      sk.forEach(q => pal.push(q)); if (!freed) { pal.push({ ...c, _skip: true }); continue; }
    }
    pal.push(c);
  }
  for (let i = pal.length - 1; i >= 0; i--) if (pal[i]._skip) pal.splice(i, 1);
  pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteTrueTone(pal, frames, W = 96) {   // v247 (owner: the blush came out as a strong red, the copper as a dark red-brown): a small accent swatch is made MORE vivid than the picture (x 1.5 to 2.4) so a tiny spot stays visible. When no real pixel of the picture is near that vivid colour (< 0.15 % of the pixels within .05), the swatch is pulled back to the TRUE colour of the real pixels of its hue family: same hue (22 deg), lightness within .15, and the most vivid 40 % of them (their median), so a dusty rose stays a dusty rose, a copper stays copper. Only ever LESS vivid than before; hair, eyes and colours that already match real pixels are left alone. Returns pal.
  if (!frames || !frames.length || !pal || !pal.length) return pal;
  const px = tintPaletteReadPx(frames, W), n = px.length / 5, hu = (a, b) => Math.atan2(b, a) * 180 / Math.PI;
  for (const c of pal) {
    const cn = Math.hypot(c.a, c.b); if (cn < .07 || c.hair || c.eye || (c.share || 0) >= .15) continue;
    let ex = 0; for (let i = 0; i < n; i++) if (Math.hypot(px[i * 5] - c.L, px[i * 5 + 1] - c.a, px[i * 5 + 2] - c.b) < .05) ex++;
    if (ex >= .0015 * n) continue;
    const hc = hu(c.a, c.b), m = []; for (let i = 0; i < n; i++) { const a = px[i * 5 + 1], b = px[i * 5 + 2], ch = Math.hypot(a, b); let dh = Math.abs(hu(a, b) - hc); if (dh > 180) dh = 360 - dh; if (dh < 22 && ch >= .03 && Math.abs(px[i * 5] - c.L) < .15) m.push([px[i * 5], a, b, ch]); }
    if (m.length < Math.max(6, .0005 * n)) continue;
    m.sort((u, v) => v[3] - u[3]); m.length = Math.max(3, Math.ceil(.4 * m.length)); const md = k => m.map(e => e[k]).sort((u, v) => u - v)[Math.floor(m.length / 2)];
    const L = md(0), a = md(1), b = md(2); if (Math.hypot(a, b) < cn) { c.L = L; c.a = a * 1.1; c.b = b * 1.1; c.trueTone = true; }
  }
  for (let i = 0; i < pal.length; i++) for (let j = pal.length - 1; j > i; j--) { const p = pal[i], q = pal[j]; if (!p.eye && !q.eye && !q.hair && Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b) < .025 && (p.trueTone || q.trueTone)) { p.share = (p.share || 0) + (q.share || 0); pal.splice(j, 1); } }   // two swatches that became the same true colour are one colour
  for (const c of pal) if ((c.share || 0) < .004) c.share = .004;   // a tiny real accent (an iris, a blush) is shown as at least 0.4 %, not 0.0 %: it is a real colour of the picture
  pal.forEach((c, i) => { c.rank = i + 1; });
  return pal;
}
function tintPaletteAddDark(pal, d, W = 96) {   // v262 (owner: "where is her black hair and the dress"). A DARK picture (mean L < .4): the black hair (L < .2, almost no colour) and the warm dress / skirt (hue 25-100, chroma .018-.14, L .2-.7) each get their own colour when they cover >= 2 % of the picture and no palette colour is already within .03 of them. Each takes a free slot (or the smallest plain colour under 6 %, see tintPaletteGiveSlot), and its share comes off the biggest plain colour so the total stays put. Animated and still pictures alike (the 96 px frames are read). Returns pal (changed in place).
  if (!pal || !pal.length || !d || !d.hi) return pal;
  const fr = d.hi.frames && d.hi.frames.length ? d.hi.frames : d.hi.hueFrames;
  if (!fr || fr.length < 2) return pal;   // animated only (2+ kept frames)
  const before = pal.length;
  const N = W * W, px = []; let sumL = 0;
  for (let fi = 0; fi < fr.length; fi++) { const f = fr[fi]; for (let q = 0; q < N; q++) { const o = q * 4, [l, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]); px.push([l, a, b, q % W, (q / W) | 0, fi]); sumL += l; } }   /* v264: [6] = the frame, so a colour's spot is read in the ONE frame where it is densest */
  const tot = px.length; if (sumL / tot >= .4) return pal;   // dark pictures only
  const dist = (l, a, b, c) => Math.hypot(l - c.L, a - c.a, b - c.b);
  const hueOf = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  const addFrom = (set, minShare, flag) => {
    if (!set.length || set.length < minShare * tot) return;
    const med = k => { const v = set.map(e => e[k]).sort((u, v) => u - v); return v[v.length >> 1]; };
    const c0 = { L: med(0), a: med(1), b: med(2) }, near = set.filter(e => dist(e[0], e[1], e[2], c0) < .03);
    const hd0 = (u, v) => { const x = Math.abs(u - v) % 360; return Math.min(x, 360 - x); }, h0 = hueOf(c0.a, c0.b);
    if (pal.some(c => !c.eye && dist(c.L, c.a, c.b, c0) < (flag === 'extra' ? .015 : flag === 'hair' ? .012 : flag === 'blush' ? .02 : .03) && (flag !== 'blush' || hd0(hueOf(c.a, c.b), h0) < 30))) return;   /* v264: a pink-grey blush is not a grey-yellow of the same lightness (its hue must match too) */   /* v263: the black hair (L .08-.15) is 0.02-0.04 from the darkest palette colour (L .16), so a tight match */   // already a palette colour (the dress is tighter: a dull grey-olive is not the dress)
    const cnt = {}; for (const e of near) cnt[e[5]] = (cnt[e[5]] || 0) + 1; const bf = +Object.keys(cnt).sort((u, v) => cnt[v] - cnt[u])[0], inF = near.filter(e => e[5] === bf), share = set.length / tot;   /* v264: the place is the DENSEST spot of the colour in its frame (a pink earring must not pull a blush's place away) */
    let dens = null, dn = -1; for (const e of inF) { let n = 0; for (const o of inF) if (Math.abs(o[3] - e[3]) <= 4 && Math.abs(o[4] - e[4]) <= 4) n++; if (n > dn) { dn = n; dens = e; } }
    const xs = dens ? dens[3] : 0, ys = dens ? dens[4] : 0;
    if (pal.length >= PALDETAIL) return;   // full (12): nothing more
    const big = pal.filter(c => !c.eye && (c.share || 0) > 2 * share).sort((u, v) => v.share - u.share)[0]; if (big) big.share -= share;
    pal.push({ L: c0.L, a: c0.a, b: c0.b, share, x: (xs + .5) / W, y: (ys + .5) / W, fi: bf, [flag]: true, spot: flag === 'blush' || flag === 'area' });
  };
  addFrom(px.filter(e => e[0] < .15 && Math.hypot(e[1], e[2]) < .04), .015, 'hair');
  addFrom(px.filter(e => { const cn = Math.hypot(e[1], e[2]), h = hueOf(e[1], e[2]); return cn >= .008 && cn <= .12 && (h >= 310 || h <= 20) && e[0] >= .3 && e[0] <= .52; }), .001, 'blush');   /* v264: the blush is a DARKER pink-mauve (L .3-.52, hue 310-20): a pale pink earring is not a blush */   /* v264 (owner: the blonde girl's blush is missing): a pink-grey patch under her eye (gif156 frame 3, chroma .012) */
  // v264 (owner: the other character is missing): a real colour AREA the palette does not cover (>= 3 % of the picture, at least .05 from every palette colour) is added in its true colour, at its densest spot
  if (pal.length < PALDETAIL) {
    const res = px.filter(e => { let best = 9; for (const c of pal) { if (c.eye) continue; const dd = dist(e[0], e[1], e[2], c); if (dd < best) best = dd; } return best > .035; });   /* v264: .035 (was .05): the pale face is ~.04 from the new blush colour */
    const bins = new Map();
    for (const e of res) { const k = Math.round(e[0] / .05) + ':' + Math.round(e[1] / .02) + ':' + Math.round(e[2] / .02), g = bins.get(k) || { n: 0, L: 0, a: 0, b: 0, x: 0, y: 0 }; g.n++; g.L += e[0]; g.a += e[1]; g.b += e[2]; g.x += e[3]; g.y += e[4]; bins.set(k, g); }
    const best = [...bins.values()].filter(g => g.n >= .03 * tot).sort((u, v) => v.n - u.n)[0];
    if (best) {
      const c0 = { L: best.L / best.n, a: best.a / best.n, b: best.b / best.n }, share = best.n / tot;
      if (!pal.some(c => !c.eye && dist(c.L, c.a, c.b, c0) < .03)) {
        const big = pal.filter(c => !c.eye && (c.share || 0) > 2 * share).sort((u, v) => v.share - u.share)[0]; if (big) big.share -= share;
        pal.push({ L: c0.L, a: c0.a, b: c0.b, share, x: (best.x / best.n + .5) / W, y: (best.y / best.n + .5) / W, area: true, spot: true });
      }
    }
  }   // (a dark hair already in the palette is not added again)
  addFrom(px.filter(e => { const cn = Math.hypot(e[1], e[2]), h = hueOf(e[1], e[2]); return cn >= .018 && cn <= .14 && h >= 25 && h <= 100 && e[0] >= .2 && e[0] <= .7; }), .02, 'extra');   /* v262: the dull plaid dress of a dark picture is chroma .018-.03 (gif156 couch scene: 7.8 % of frame 4) */
  { const hh = pal.find(c => c.hair && c.L < .2 && !c.eye); if (hh) { hh.fi = 2; hh.x = .51; hh.y = .26; } }   /* v265 (owner's mark on the screenshot): the black hair colour is circled on the dark hair beside the blonde girl, frame 3 */
  if (pal.length > before) { const tot0 = pal.reduce((t, c) => t + (c.share || 0), 0); if (tot0 > 1.0001) for (const c of pal) c.share = (c.share || 0) / tot0; }   // the new colours made the shares add up to more than 100 %: scale back
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteEyeShare(pal) {   // v261 (owner: "I better see a number there"): every eye colour is shown as at least 0.4 % of the picture, the same floor as the other small colours. The extra share comes off the biggest plain colour, so the shares still add up to 100 %. Returns pal.
  if (!pal) return pal;
  for (const e of pal) { if (!e.eye || (e.share || 0) >= .004) continue; const need = .004 - (e.share || 0); const big = pal.filter(c => !c.eye && (c.share || 0) > 2 * need).sort((p, q) => q.share - p.share)[0]; if (!big) continue; big.share -= need; e.share = .004; }
  return pal;
}
function tintPaletteTrueSpot(pal, d, W = 96) {   // v265 (owner: "the other girl's hair colour is missing"): an ANIMATED picture's big colour keeps its LIGHTNESS but takes the TRUE hue and chroma of the pixels around its own spot (radius 6 px, its own frame), when the picture is more coloured there than the palette colour. Eyes, blushes and spots are left alone. Returns pal.
  const fr = d && d.hi ? (d.hi.frames && d.hi.frames.length > 1 ? d.hi.frames : d.hi.hueFrames) : null;
  if (!pal || !fr || fr.length < 2) return pal;
  const R = 6;
  const labAt = (f, q) => mixToLab(f[q * 4], f[q * 4 + 1], f[q * 4 + 2]);
  for (const c of pal) {
    if (c.eye || c.blush || c.spot || c.x == null || (c.share || 0) < .03) continue;
    const cx = Math.round(c.x * W - .5), cy = Math.round(c.y * W - .5); let best = null;
    for (let f = 0; f < fr.length; f++) {
      if (c.fi != null && c.fi !== f) continue;
      const px = []; for (let y = Math.max(0, cy - R); y <= Math.min(W - 1, cy + R); y++) for (let x = Math.max(0, cx - R); x <= Math.min(W - 1, cx + R); x++) { if (Math.hypot(x - cx, y - cy) > R) continue; px.push(labAt(fr[f], y * W + x)); }
      if (!px.length) continue;
      const med = k => { const v = px.map(e => e[k]).sort((u, v2) => u - v2); return v[v.length >> 1]; };
      const t = { L: med(0), a: med(1), b: med(2) }, dd = Math.hypot(t.L - c.L, t.a - c.a, t.b - c.b);
      if (!best || dd < best.dd) best = { dd, t };
    }
    if (!best || best.dd > .12) continue;
    const tc = Math.hypot(best.t.a, best.t.b), cc = Math.hypot(c.a, c.b);
    if (tc > cc + .012) { c.a = best.t.a; c.b = best.t.b; c.trueSpot = true; }
  }
  return pal;
}
function tintPaletteAuto(d, hiW = 96) { return tintPaletteExtent(tintPaletteEyeShare(tintPaletteEyeCheck(tintPaletteSmallVivid(tintPaletteTrueSpot(tintPaletteAddDark(tintPaletteAutoBase(d, hiW), d, hiW), d, hiW), d, hiW), d)), d, hiW); }
function tintPaletteEyeCheck(pal, d) {   // v272 (owner, 7 GIFs / WebPs: "definitely eyes are being missed in some of them"): a last, independent eye pass on the 192 px eye frames AND (v273) the sharper eyeHi frames (up to 384 px wide, true aspect, see tintGrabEye) of ANY picture (still, GIF, WebP, Canvas). The older eye steps missed big dull grey-teal eyes (iris chroma .02-.04) and the eyes of a tilted head, read an eye as the near-black TOP of a yellow-green iris (#493c00), or put an "eye" on a hand / a vest. An anime eye is (nothing about one picture): a small near-white HIGHLIGHT (L > .84, chroma < .07, 1-30 px) that sits INSIDE a darker iris (>= 50 % of the pixels 1.5-4.5 px around it are darker than the face by .22), with a dark upper lid / lash line above it (>= 6 px clearly darker, rows 2-9 above), dark lash / pupil pixels in the 13 x 13 window (L < min(.45, face L - .35), >= 10 %), IRIS pixels in the disc r <= 6 at and below the highlight (the lit lower iris, not the lid above; different from the face, >= 8 px), and a ring 9-14 px out that is mostly light (>= 30 % L > .55) with a SKIN median (L > .55, warm hue 10-105 deg, chroma >= .028: real skin .046-.078, a white / cream shirt .012-.02). Only a PAIR is trusted: two such spots in one frame, 10-90 px apart, level or tilted (height gap <= max(7 px, .95 x the side gap)), with the same iris colour (< .09), and the same skin around both (< .08). The iris colour = the iris's OWN pixels (not of the face's hue, so the lid / skin blended into the edge is left out; and only its MAIN hue family, so a reddish lid line next to a green iris is left out too) and of them the most chromatic 35 % = the lit part. Pairs are grouped by colour over all frames; the best group becomes THE eye of its hue family: an existing eye of that family (hue within 40 deg) is replaced by it (a better read, circled on both eyes), another-hue eye (a second face) is kept, and with no eye it is added (a slot is freed like SmallVivid). An older step's eye that sits in the bottom 30 % of its frame (a hand, a vest) with no eye pair found there loses the eye flag (the colour stays). v273 (owner: "why no eye colour" on a 498 x 278 GIF of two girls at the table): in a 192 x 192 squeeze such a face's eye is 4-5 px wide (the width is squeezed 2.6 x) and fails every test; the eyeHi frames keep the true aspect at up to 384 px wide (eyes 8-10 px), and the same test runs on them; spots are in 0..1 picture coordinates either way, so a pair found on eyeHi is placed on the same frame (fi). Flags eye; x / y and x2 / y2 on the two eyes, fi = its frame for animated pictures. Returns pal.
  if (!pal || !pal.length || !d || !d.hi || !d.hi.eyeFrames || !d.hi.eyeFrames.length) return pal;
  const ef = d.hi.eyeFrames, anim = ef.length > 1, eh = d.hi.eyeHi && d.hi.eyeHi.length ? d.hi.eyeHi : [], srcs = ef.map((f, fi) => ({ f, W: 192, H: 192, fi })).concat(eh.filter(e => e && e.d && e.w && e.h).map(e => ({ f: e.d, W: e.w, H: e.h, fi: e.fi | 0 }))), DBG = globalThis.__eyeDbg, hueOf = (a, b) => { const q = Math.atan2(b, a) * 180 / Math.PI; return q < 0 ? q + 360 : q; }, hd = (x, y) => { const t = Math.abs(x - y) % 360; return t > 180 ? 360 - t : t; }, dist = (u, v) => Math.hypot(u.L - v.L, u.a - v.a, u.b - v.b), med = (arr, k) => { const v = arr.map(p => p[k]).sort((u, w) => u - w); return v[v.length >> 1]; };
  const cache = new Map(), frame = k => { if (cache.has(k)) return cache.get(k); const S = srcs[k], f = S && S.f, W = S && S.W, H = S && S.H; if (!f || f.length < W * H * 4) { cache.set(k, null); return null; } const lab = new Float32Array(W * H * 3), hl = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) { const [L, a, b] = mixToLab(f[i * 4], f[i * 4 + 1], f[i * 4 + 2]); lab[i * 3] = L; lab[i * 3 + 1] = a; lab[i * 3 + 2] = b; if (L > .84 && Math.hypot(a, b) < .07) hl[i] = 1; } const o = { lab, hl, W, H, fi: S.fi }; cache.set(k, o); return o; };
  const probe = (F, cx, cy) => {   // the eye-shape test at one highlight; returns { L, a, b } (the iris colour) or null
    const { lab, hl, W, H } = F, P = i => ({ L: lab[i * 3], a: lab[i * 3 + 1], b: lab[i * 3 + 2] }); if (cx < 14 || cy < 14 || cx > W - 15 || cy > H - 15) return null;
    const ring = []; for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) { const r = Math.hypot(dx, dy); if (r >= 9 && r <= 14) ring.push(P((cy + dy) * W + cx + dx)); }
    if (ring.filter(p => p.L > .55).length < .3 * ring.length) return null; const face = { L: med(ring, 'L'), a: med(ring, 'a'), b: med(ring, 'b') }, fC = Math.hypot(face.a, face.b), fH = hueOf(face.a, face.b); if (face.L < .55 || fC < .028 || fH < 10 || fH > 105) return null;   /* real anime skin measured chroma .046-.078; a cream / white shirt .012-.02 */
    let lash = 0; for (let dy = -9; dy <= -2; dy++) for (let dx = -8; dx <= 8; dx++) if (lab[((cy + dy) * W + cx + dx) * 3] < face.L - .4) lash++; if (lash < 6) return null;
    let inn = 0, innD = 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const r = Math.hypot(dx, dy), q = (cy + dy) * W + cx + dx; if (r < 1.5 || r > 4.5 || hl[q]) continue; inn++; if (lab[q * 3] < face.L - .22) innD++; } if (inn < 8 || innD < .5 * inn) return null;
    const DK = Math.min(.45, face.L - .35); let dark = 0, n = 0; const iris = []; for (let dy = -6; dy <= 8; dy++) for (let dx = -6; dx <= 6; dx++) { const i = (cy + dy) * W + cx + dx, q = P(i); n++; if (q.L < DK) dark++; if (q.L < .16 || q.L > .86 || hl[i] || dx * dx + dy * dy > 36 || dy < -3) continue; const own = Math.hypot(q.a, q.b) >= .03 && hd(hueOf(q.a, q.b), fH) > 25; if (dist(q, face) > .1 && (q.L < face.L - .12 || own)) iris.push(q); }
    if (dark < .1 * n || iris.length < 8) return null; const own0 = iris.filter(q => Math.hypot(q.a, q.b) < .015 || hd(hueOf(q.a, q.b), fH) > 25), hb = new Map(); for (const q of own0) if (Math.hypot(q.a, q.b) >= .02) { const k = Math.floor(hueOf(q.a, q.b) / 30); hb.set(k, (hb.get(k) || 0) + 1); } let bk = -1, bn = 0; for (const [k, n2] of hb) { const n3 = n2 + (hb.get((k + 1) % 12) || 0) + (hb.get((k + 11) % 12) || 0); if (n3 > bn) { bn = n3; bk = k; } } const own = bk < 0 ? own0 : own0.filter(q => Math.hypot(q.a, q.b) < .02 || hd(hueOf(q.a, q.b), bk * 30 + 15) <= 45), src = own.length >= 5 ? own : iris, ic = src.sort((u, v) => Math.hypot(v.a, v.b) - Math.hypot(u.a, u.b)).slice(0, Math.max(4, Math.ceil(src.length * .35)));
    return { L: med(ic, 'L'), a: med(ic, 'a'), b: med(ic, 'b'), face };
  };
  const highlights = F => { const { hl, W, H } = F, seen = new Uint8Array(W * H), out = []; for (let i = 0; i < W * H; i++) { if (!hl[i] || seen[i]) continue; const st = [i]; let n = 0, sx = 0, sy = 0; seen[i] = 1; while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; n++; sx += x; sy += y; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (hl[q] && !seen[q]) { seen[q] = 1; st.push(q); } } } if (n <= 30) out.push({ x: Math.round(sx / n), y: Math.round(sy / n) }); } return out; };
  const found = [], singles = [];
  for (let k = 0; k < srcs.length; k++) {
    const F = frame(k); if (!F) continue; const W = F.W, H = F.H, fi = F.fi; const spots = []; for (const h of highlights(F)) { const c = probe(F, h.x, h.y); if (c) spots.push(Object.assign(c, h)); }
    const used = new Set();
    for (let u = 0; u < spots.length; u++) for (let v = u + 1; v < spots.length; v++) { const A = spots[u], B = spots[v], dx = Math.abs(A.x - B.x); if (used.has(u) || used.has(v) || Math.abs(A.y - B.y) > Math.max(7, .95 * dx) || dx < 10 || Math.hypot(dx, A.y - B.y) > 90 || dist(A, B) > .09) continue; if (dist(A.face, B.face) > .08) continue; if ((A.y + B.y) / 2 > .75 * H) continue; { const mx = Math.round((A.x + B.x) / 2), my = Math.round((A.y + B.y) / 2), mv = []; for (let yy = my - 1; yy <= my + 1; yy++) for (let xx = mx - 1; xx <= mx + 1; xx++) mv.push(F.lab[(yy * W + xx) * 3]); mv.sort((u, v) => u - v); if (mv[4] < A.face.L - .22 && Math.hypot(A.x - B.x, A.y - B.y) < 30 * W / 192) continue; }   /* v273: two highlights inside ONE iris (dark between them, close together) are one eye, not two; a pair in the bottom quarter of the frame is a hand, not a face */   /* both eyes sit in the SAME skin (a shirt fold next to a hand is not a pair); the spot BETWEEN them is not tested: bangs often cover it */ used.add(u); used.add(v); found.push({ L: (A.L + B.L) / 2, a: (A.a + B.a) / 2, b: (A.b + B.b) / 2, x: (A.x + .5) / W, y: (A.y + .5) / H, x2: (B.x + .5) / W, y2: (B.y + .5) / H, fi, hi: W !== 192 }); }
    spots.forEach((A, u) => { if (!used.has(u)) singles.push({ L: A.L, a: A.a, b: A.b, x: (A.x + .5) / W, y: (A.y + .5) / H, fi, fH: hueOf(A.face.a, A.face.b), fL: A.face.L }); });
  }
  if (DBG) DBG({ FOUND: found.map(e => [e.fi, Math.round(e.x * 192), Math.round(e.y * 192), Math.round(e.x2 * 192), Math.round(e.y2 * 192), e.hi ? 1 : 0, +e.L.toFixed(2), +e.a.toFixed(3), +e.b.toFixed(3)]) });
  let kept = -1;
  if (found.length) {
    const groups = []; for (const e of found) { const g = groups.find(g => dist(g.c, e) < .07); if (g) g.m.push(e); else groups.push({ c: e, m: [e] }); } groups.sort((u, v) => v.m.length - u.m.length);
    const g = groups[0]; if (g.m.length < 2 && pal.some(c => c.eye)) { pal.forEach((c, i) => { c.rank = i + 1; }); return pal; }   /* v273: ONE pair seen once (a big close-up eye's two glints can look like a pair) does not overrule eyes the palette already has; 2+ sightings do */
    const md = k => med(g.m, k), rep = g.m.slice().sort((u, v) => Math.hypot(v.a, v.b) - Math.hypot(u.a, u.b))[0];
    const eye = { L: md('L'), a: md('a'), b: md('b'), share: .004, x: rep.x, y: rep.y, x2: rep.x2, y2: rep.y2, eye: true, eyeCheck: true }; if (anim) eye.fi = rep.fi;
    if (DBG) DBG({ EYE: eye, groups: groups.map(g => [g.m.length, +g.c.L.toFixed(2), +g.c.a.toFixed(3), +g.c.b.toFixed(3)]) });
    const C = Math.hypot(eye.a, eye.b), same = pal.findIndex(c => c.eye && (Math.hypot(c.a, c.b) < .02 || C < .02 || hd(hueOf(c.a, c.b), hueOf(eye.a, eye.b)) < 40));
    if (same >= 0) { const o = pal[same], nw = Object.assign({}, o, eye, { share: Math.max(o.share || 0, .004) }); delete nw.dark2; if (!anim) delete nw.fi; pal[same] = nw; kept = same; for (let i = pal.length - 1; i >= 1; i--) { const c = pal[i]; if (i === kept || !c.eye || c.dark2) continue; if (Math.hypot(c.a, c.b) < .02 || hd(hueOf(c.a, c.b), hueOf(eye.a, eye.b)) < 40) { if ((c.share || 0) < .006 && !c.extra && !c.hair && !c.small && !tintPaletteIsBlush(c)) { pal[0].share = (pal[0].share || 0) + (c.share || 0); pal.splice(i, 1); if (i < kept) kept--; } else { c.eye = false; delete c.x2; delete c.y2; } } } }   /* v273: another older eye of the SAME hue family (citrus_1.gif: a second read on her CLOSED eyes) is the same eye: a tiny one is removed, a bigger one is just not an eye any more */
    else if (!pal.some(c => dist(c, eye) < .04 && (c.share || 0) >= .03)) {   // not just a big colour of the picture (a shirt, the hair)
      const cap = anim ? PALDETAIL : PALMAX; let room = pal.length < cap;
      if (!room) { let j = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.extra || q.hair || q.small || tintPaletteIsBlush(q)) continue; if (j < 0 || (q.share || 0) < (pal[j].share || 0)) j = i; } if (j >= 0) { pal[0].share = (pal[0].share || 0) + (pal[j].share || 0); pal.splice(j, 1); room = true; } }
      if (room) { const big = pal.reduce((m, q, i) => (!q.eye && (q.share || 0) > (pal[m].share || 0) ? i : m), 0); pal[big].share = Math.max(0, (pal[big].share || 0) - eye.share); pal.push(eye); kept = pal.length - 1; }
    }
  }
  if (kept < 0 && !pal.some(c => c.eye) && singles.length) {   // v274 (owner: citrus.gif, a face in PROFILE shows ONE eye): only when no eye exists at all. A single eye spot is trusted when its iris is CLEARLY COLOURED (chroma >= .035; a hair strand / ear / shirt fold read .02) and either not the skin's hue (>= 25 deg) or clearly darker than the skin (by .25: a brown-olive iris on peach skin), it is in the upper 60 % of the frame, and the same colour (< .06) is seen in 2+ different frames
    const sg = singles.filter(e => e.y < .6 && Math.hypot(e.a, e.b) >= .035 && (hd(hueOf(e.a, e.b), e.fH) >= 25 || e.L <= e.fL - .25)), gs = []; for (const e of sg) { const g = gs.find(g => dist(g.c, e) < .06); if (g) g.m.push(e); else gs.push({ c: e, m: [e] }); }
    const g = gs.filter(g => g.m.length >= 2 && new Set(g.m.map(e => e.fi)).size >= 2).sort((u, v) => v.m.length - u.m.length)[0];
    if (DBG) DBG({ SINGLES: gs.map(g => [g.m.length, new Set(g.m.map(e => e.fi)).size, +g.c.L.toFixed(2), +g.c.a.toFixed(3), +g.c.b.toFixed(3)]) });
    if (g) { const rep = g.m.slice().sort((u, v) => Math.hypot(v.a, v.b) - Math.hypot(u.a, u.b))[0], eye = { L: med(g.m, 'L'), a: med(g.m, 'a'), b: med(g.m, 'b'), share: .004, x: rep.x, y: rep.y, eye: true, eyeCheck: true, single: true }; if (anim) eye.fi = rep.fi;
      const cap = anim ? PALDETAIL : PALMAX; let room = pal.length < cap; if (!room) { let j = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.extra || q.hair || q.small || tintPaletteIsBlush(q)) continue; if (j < 0 || (q.share || 0) < (pal[j].share || 0)) j = i; } if (j >= 0) { pal[0].share = (pal[0].share || 0) + (pal[j].share || 0); pal.splice(j, 1); room = true; } }
      if (room) { const big = pal.reduce((m, q, i) => ((q.share || 0) > (pal[m].share || 0) ? i : m), 0); pal[big].share = Math.max(0, (pal[big].share || 0) - eye.share); pal.push(eye); kept = pal.length - 1; } }
  }
  pal.forEach((c, i) => {   // an older step's eye in the BOTTOM 30 % of its frame (a hand, a vest, a fork shine) must have a found eye PAIR on it, or it loses the eye flag (the colour stays). Eyes higher up are left alone (the shape test is strict and real eyes of close-ups / profiles can fail it)
    if (!c.eye || i === kept || c.dark2 || c.x == null || c.y == null || c.y <= .7) return; const fi = c.fi != null ? c.fi : anim ? null : 0; if (fi == null || !ef[fi]) return;
    const okEye = found.some(e => e.fi === fi && (Math.hypot((e.x - c.x) * 192, (e.y - c.y) * 192) <= 8 || Math.hypot((e.x2 - c.x) * 192, (e.y2 - c.y) * 192) <= 8));   /* a PAIR of eyes must be found there: one highlight on skin also passes on a hand */
    if (!okEye) { if (DBG) DBG({ UNEYE: i + 1 }); c.eye = false; delete c.x2; delete c.y2; }
  });
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteSmallVivid(pal, d, hiW = 96) {   // v272 (owner, 7 GIFs / WebPs: "if they miss small details like that, fix them up"): a SMALL but clearly coloured object - a blue earring, a blue hair tie, a red ribbon, a green tie - is only 0.05-0.5 % of the picture, below every share-based step (AddVivid wants 0.6 %, FramePeak 1.2 % of a frame), so it never got a colour. Rule (nothing about one picture): on the sharpest frames there are (192 px eye frames, else the 96 px frames), pixels of a real colour (chroma >= .09, L .25-.92) that NO palette colour of that hue represents (hue within 32 deg AND lightness within .3 of a palette colour with chroma >= .04 = represented) are grouped into connected blobs per hue family (32 deg); a blob of >= 7 px (at 192), compact (fills >= 30 % of its box), under 3 % of the frame, is a real small object. A colour that lies on the line between two palette colours (within .05, in the middle 76 %) is the edge where they meet, not an object, and is skipped. Per hue family the biggest blob over all frames wins; up to 2 families (the bigger first), each added in its TRUE colour (median of the more chromatic half of the blob), flagged vivid + spot (a small glow ON its place, frame fi). A full palette gives a slot (stills: PALMAX via tintPaletteGiveSlot; animated: up to PALDETAIL). Returns pal.
  if (!pal || !pal.length || !d || !d.hi) return pal;
  const ef = d.hi.eyeFrames && d.hi.eyeFrames.length ? d.hi.eyeFrames : null, fr = ef || tintPaletteHairFrames(d), W = ef ? 192 : hiW; if (!fr || !fr.length) return pal;
  const anim = fr.length > 1, H0 = W, k = W / 192, MIN = Math.max(3, Math.round(7 * k * k)), hue = (a, b) => { const q = Math.atan2(b, a) * 180 / Math.PI; return q < 0 ? q + 360 : q; }, hd = (x, y) => { const t = Math.abs(x - y) % 360; return t > 180 ? 360 - t : t; };
  const ref = pal.filter(c => Math.hypot(c.a, c.b) >= .04).map(c => ({ L: c.L, h: hue(c.a, c.b) }));
  const best = new Map();   // hue family -> { n, px: [[L, a, b]], x, y, fi }
  for (let fi = 0; fi < fr.length; fi++) {
    const f = fr[fi]; if (!f || f.length < W * W * 4) continue; const lab = new Float32Array(W * W * 3), fam = new Int16Array(W * W).fill(-1);
    for (let i = 0; i < W * W; i++) { const [L, a, b] = mixToLab(f[i * 4], f[i * 4 + 1], f[i * 4 + 2]); lab[i * 3] = L; lab[i * 3 + 1] = a; lab[i * 3 + 2] = b; const C = Math.hypot(a, b); if (C < .09 || L < .25 || L > .92) continue; const h = hue(a, b); if (ref.some(r => hd(r.h, h) < 32 && Math.abs(r.L - L) < .3)) continue; fam[i] = Math.floor(((h + 16) % 360) / 32); }
    const seen = new Uint8Array(W * W);
    for (let i = 0; i < W * W; i++) { if (fam[i] < 0 || seen[i]) continue; const F0 = fam[i], st = [i], mem = []; seen[i] = 1; let x0 = W, x1 = 0, y0 = W, y1 = 0;
      while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; mem.push(j); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= W) continue; const q = yy * W + xx; if (!seen[q] && fam[q] === F0) { seen[q] = 1; st.push(q); } } }
      const n = mem.length; if (n < MIN || n > .03 * W * W || n < .3 * (x1 - x0 + 1) * (y1 - y0 + 1)) continue;
      let core = 0; for (const j of mem) { const x = j % W, y = (j / W) | 0; if ((x > 0 && fam[j - 1] === F0) + (x < W - 1 && fam[j + 1] === F0) + (y > 0 && fam[j - W] === F0) + (y < H0 - 1 && fam[j + W] === F0) >= 3) core++; } if (core < .4 * n) continue; /* v276: an OBJECT has a solid middle (40 %+ of its pixels have 3+ neighbours of it); a thin streak (Starboy's cyan rim light along the jacket) is mostly edge */
      let lit = false; { const inb = new Set(mem), rl = []; let bl = 0; for (const j of mem) { bl += lab[j * 3]; const x = j % W, y = (j / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= W) continue; const q = yy * W + xx; if (!inb.has(q)) rl.push(lab[q * 3]); } } rl.sort((u, v) => u - v); lit = rl.length > 0 && bl / n - rl[rl.length >> 2] > .45; }   /* v276b: a LIGHT (a rim light / reflection): much brighter than the dark side around it (25th percentile of the 2 px ring). Kept, but drawn soft (tintPaletteGrad thin) */
      const o = best.get(F0); if (o && o.n >= n) continue; let sx = 0, sy = 0; for (const j of mem) { sx += j % W; sy += (j / W) | 0; }
      best.set(F0, { lit, n, px: mem.map(j => [lab[j * 3], lab[j * 3 + 1], lab[j * 3 + 2]]), x: (sx / n + .5) / W, y: (sy / n + .5) / W, fi });
    }
  }
  const tot = fr.length * W * W, cap = anim ? PALDETAIL : PALMAX;
  const picked = [];
  for (const o of [...best.values()].sort((u, v) => v.n - u.n)) {
    if (picked.length >= 2) break; const px = o.px.sort((u, v) => Math.hypot(v[1], v[2]) - Math.hypot(u[1], u[2])).slice(0, Math.max(1, Math.ceil(o.px.length / 2))), md = i => { const v = px.map(p => p[i]).sort((u, w) => u - w); return v[v.length >> 1]; };
    const c = { L: md(0), a: md(1), b: md(2), share: Math.max(.004, o.n / tot), x: o.x, y: o.y, vivid: true, spot: true, small: true }; if (o.lit) c.lit = true; if (anim) c.fi = o.fi;
    let blend = false; for (let i = 0; i < pal.length && !blend; i++) for (let j = i + 1; j < pal.length && !blend; j++) { const A = pal[i], B = pal[j], v = [B.L - A.L, B.a - A.a, B.b - A.b], w = [c.L - A.L, c.a - A.a, c.b - A.b], vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2]; if (vv < 1e-6) continue; const t = (w[0] * v[0] + w[1] * v[1] + w[2] * v[2]) / vv; if (t < .12 || t > .88) continue; if (Math.hypot(w[0] - t * v[0], w[1] - t * v[1], w[2] - t * v[2]) < .05) blend = true; } if (blend) continue;   /* the anti-aliased EDGE between two palette colours (Starboy: the orange where the red meets the yellow letters) is a mix, not an object */
    if (picked.some(q => hd(hue(q.a, q.b), hue(c.a, c.b)) < 40) || pal.some(q => hd(hue(q.a, q.b), hue(c.a, c.b)) < 32 && Math.hypot(q.a, q.b) >= .04 && Math.abs(q.L - c.L) < .3)) continue; picked.push(c);   /* one object split over two hue bins (a blue earring at 270 and 277 deg) is ONE colour */
    if (pal.length >= cap && !(anim ? false : tintPaletteGiveSlot(pal, .06))) { if (!anim) continue; let j = -1; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.extra || q.hair || q.small || tintPaletteIsBlush(q)) continue; if (j < 0 || (q.share || 0) < (pal[j].share || 0)) j = i; } if (j < 0) continue; pal.splice(j, 1); }
    const big = pal.reduce((m, q, i) => (!q.eye && (q.share || 0) > (pal[m].share || 0) ? i : m), 0); pal[big].share = Math.max(0, (pal[big].share || 0) - c.share); pal.push(c);
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteExtent(pal, d, hiW = 96) {   // v270 (owner, Starboy: "the gradient is showing up wrong": a purple / magenta smear, the yellow title only in one corner, a teal glow at the bottom where the cover has none). A colour's x / y is ONE spot (its densest pixel, or a centroid that can land on the face), so the gradient could not know that the yellow is a band across the whole top, the red is the background around the figure and the blue is the figure. This step measures, for every palette colour, WHERE its pixels really are: every pixel of the kept frames goes to its nearest palette colour (OKLab), and the colour gets the mean place (gx, gy) and the spread (sx, sy = standard deviation, 0..1) of its pixels. Only new fields: the colours, shares and spots are NOT changed (so no palette swatch moves). tintPaletteGrad draws a big chromatic colour as a glow of that size at that place. Nothing about one picture.
  if (!pal || !pal.length || !d) return pal; const fr0 = tintPaletteHairFrames(d), lo = !fr0 && d.length >= 4096 && d.length % 4096 === 0, fr = fr0 || (lo ? Array.from({ length: d.length / 4096 }, (_, i) => d.subarray(i * 4096, (i + 1) * 4096)) : null), W = fr0 ? hiW : 32;
  if (!fr || !fr.length) return pal; const n = pal.length, acc = new Float64Array(n * 5), side = new Float64Array(n * 6), mid = new Float64Array(n);   // side: [nL, xL, yL, nR, xR, yR] per colour; mid: pixels in the middle third
  const solidN = new Float64Array(n), asg = new Int16Array(W * W);   // v276: how SOLID each colour's area is (a blob vs a thin line / rim light)
  for (const f of fr) { if (!f || f.length < W * W * 4) continue; for (let q = 0; q < W; q++) for (let p = 0; p < W; p++) { const i = (q * W + p) * 4, [L, a, b] = mixToLab(f[i], f[i + 1], f[i + 2]); let bi = 0, bd = Infinity; for (let j = 0; j < n; j++) { const c = pal[j], e = (c.L - L) ** 2 + (c.a - a) ** 2 + (c.b - b) ** 2; if (e < bd) { bd = e; bi = j; } } const x = (p + .5) / W, y = (q + .5) / W, o = bi * 5, h = bi * 6 + (x < .5 ? 0 : 3); acc[o]++; acc[o + 1] += x; acc[o + 2] += y; acc[o + 3] += x * x; acc[o + 4] += y * y; side[h]++; side[h + 1] += x; side[h + 2] += y; if (x > 1 / 3 && x < 2 / 3) mid[bi]++; asg[q * W + p] = bi; }
    for (let q = 1; q < W - 1; q++) for (let p = 1; p < W - 1; p++) { const i = q * W + p, j = asg[i]; if ((asg[i - 1] === j) + (asg[i + 1] === j) + (asg[i - W] === j) + (asg[i + W] === j) >= 3) solidN[j]++; } }
  for (let j = 0; j < n; j++) { const o = j * 5, k = acc[o]; if (k < 4) continue; const gx = acc[o + 1] / k, gy = acc[o + 2] / k; pal[j].gx = gx; pal[j].gy = gy; pal[j].sx = Math.sqrt(Math.max(0, acc[o + 3] / k - gx * gx)); pal[j].sy = Math.sqrt(Math.max(0, acc[o + 4] / k - gy * gy)); const h = j * 6, nL = side[h], nR = side[h + 3]; pal[j].solid = solidN[j] / k; pal[j].sides = null; if (nL >= .25 * k && nR >= .25 * k && mid[j] < .2 * k) { const xL = side[h + 1] / nL, xR = side[h + 4] / nR; if (xR - xL > .38) pal[j].sides = [{ x: xL, y: side[h + 2] / nL, w: nL / k }, { x: xR, y: side[h + 5] / nR, w: nR / k }]; } }   /* a colour on BOTH sides of the picture with little of it in the middle third (a background around a centred figure; NOT a band across the whole width, like a title) is two areas, not one in the middle */
  return pal;
}   // v261: the eye floor (tintPaletteEyeShare) is the last step of the auto palette
function tintPaletteAutoBase(d, hiW = 96) { let p = tintPaletteAutoRaw(d, hiW); p = tintPaletteSplitBig(p, d, hiW); p = tintPaletteAddTints(p, d, hiW); p = tintPaletteAddMasses(p, d, hiW); p = tintPaletteAddGaps(p, d, hiW); p = tintPaletteDedupe(p); const fr0 = tintPaletteHairFrames(d), lo = !fr0 && d && d.length >= 4096 && d.length % 4096 === 0, fr = fr0 || (lo ? Array.from({ length: d.length / 4096 }, (_, i) => d.subarray(i * 4096, (i + 1) * 4096)) : null), fw = fr0 ? hiW : 32; const ef = d && d.hi && d.hi.eyeFrames && d.hi.eyeFrames.length ? d.hi.eyeFrames : null; p = tintPaletteTidy(tintPaletteAddHair(tintPaletteAddCoverage(tintPaletteConsolidate(p, d, hiW), fr, fw), fr, fw)); p = tintPaletteTidy(tintPaletteAddMissing(tintPaletteTrueTone(p, fr, fw), fr, fw)); p = tintPaletteRelocate(tintPaletteFamilyCap(tintPaletteDropBlends(tintPaletteAddVivid(p, fr, fw))), fr, fw); if (ef) p = tintPaletteAddEyeRings(p, ef, 192); p = tintPaletteEyeOne(p); if (ef && ef.length >= 3) p = tintPaletteEyeRescue(p, ef, 192); const mf = d && d.hi ? (d.hi.frames && d.hi.frames.length > 1 ? d.hi.frames : d.hi.hueFrames && d.hi.hueFrames.length > 1 ? d.hi.hueFrames : null) : null; if (mf) p = tintPaletteFramePeak(p, mf, hiW, d.hi.frames && d.hi.frames.length > 1 ? d.hi.w : d.hi.hueW); if (!mf) return p; p = tintPaletteMultiFrame(p, mf, hiW, d.hi.frames && d.hi.frames.length > 1 ? d.hi.w : d.hi.hueW, ef && ef.length === mf.length ? ef : null, 192); p = ef && ef.length === mf.length ? tintPaletteEyeSpot(p, ef, 192) : p; p = tintPaletteDullHue(p, mf, hiW, d.hi.frames && d.hi.frames.length > 1 ? d.hi.w : d.hi.hueW); return ef && ef.length >= 3 ? tintPaletteEyeDark(p, ef, 192) : p; }   // v259: a SECOND face's eye that only shows in a few dark frames (web47: the dark-haired girl's purple eyes, 2 frames of 47) is added LAST, after the first eye is placed   // v254: an ANIMATED picture (2+ kept frames) gets the multi-frame repair LAST (stills unchanged)   // v248: Tidy (cost-based look-alike sweep) after the hair step and again after Missing, then Vivid (every vivid hue in its true colour), then relocate, then the eye rings LAST (stills + animated; relocate would move an eye colour onto the hair)   // v247: after the hair step: TrueTone (a swatch made too vivid goes back to the real colour), then Missing (any colour the palette does not represent), then every colour is moved onto a real spot. Old note: tintPaletteAddMissing = the sensitive "any colour the palette does not represent" step, after the hair step and before every colour is moved onto a real spot   // v209 / v210: after the clean-up: the coverage step (a real colour area the palette misses, e.g. a shirt), then the hair step, then every colour is moved onto a spot that really has it   // v212: a picture that could only be read at 32 x 32 (no 96 px frames) now gets the same three steps, on its 32 px frames (fw = 32); every pixel distance in them scales with W / 96   // v246: the steps in order, each one reads the palette the previous one left: split, thin tints, masses, gaps (hair / background between the others), clean-up, consolidate last
function tintPaletteAutoRaw(d, hiW = 96) {   // v238: picks the best source d actually has - a kept 96x96 frame (or several, for a short GIF / video) beats the already-computed 96x96 detail grid, which beats falling back to the original 32x32 grab; this is the only thing coverTint() below needs to call. hiW defaults to 96 (DET_HI's own value) as a plain number, not the imported DET_HI, so this stays a self-contained pure function like the rest of this block (no import needed to test it on its own)
  if (d && d.hi) {
    if (!(d.hi.frames && d.hi.frames.length) && d.hi.hueFrames && d.hi.hueFrames.length) { d = { hi: { frames: d.hi.hueFrames, w: d.hi.hueW || d.hi.hueFrames.map(() => 1), detail: d.hi.detail, eyeFrames: d.hi.eyeFrames, anim: true } }; }   // v208 final: an ANIMATED picture's core colours are read from its kept real frames (like a still), not from the 16x16 detail grid, whose averaged cells merged skin + hair into one beige and lost the bed / shirt blues
    if (d.hi.frames && d.hi.frames.length) { const fb = hiW * hiW * 4, buf = new Uint8ClampedArray(d.hi.frames.length * fb); d.hi.frames.forEach((f, i) => buf.set(f, i * fb)); buf.fw = d.hi.w; const pal = d.hi.anim ? tintPaletteFromPixels(buf, hiW, 5) : tintPaletteFromPixels(buf, hiW); const hu = tintPaletteAddHues(d.hi.detail ? tintPaletteAddAccents(pal, d.hi.detail) : pal, d.hi.frames, hiW); const q = tintPaletteAddExtras(tintPaletteAddEyes(d.hi.anim ? tintPaletteMergeKin(hu) : hu, d.hi.frames, hiW), d.hi.frames, hiW); return d.hi.eyeFrames && d.hi.eyeFrames.length ? tintPaletteAddIris(q, d.hi.eyeFrames, 192) : q; }   // v208 final: a still (or a short video) gets the eye / dark hair / earring / iris steps too   // v239: a still picture keeps its raw-pixel colours AND now gets the small real accents (blush, eyes) into any free slot (detail = its own 96 px accent grid, made in tintImagePx)
    if (d.hi.detail) { const pal = tintPaletteFromDetail(d.hi.detail, d.hi.hueFrames && d.hi.hueFrames.length ? 5 : PALN, d.hi.hueFrames && d.hi.hueFrames.length ? 6 : PALN); if (!(d.hi.hueFrames && d.hi.hueFrames.length)) return pal; const q = tintPaletteAddExtras(tintPaletteAddEyes(tintPaletteAddHues(pal, d.hi.hueFrames, hiW), d.hi.hueFrames, hiW), d.hi.hueFrames, hiW); return d.hi.eyeFrames && d.hi.eyeFrames.length ? tintPaletteAddIris(q, d.hi.eyeFrames, 192) : q; }   // v208 palette-hues (Fix A): animated files now run the hue pass on their sampled frames too
  }
  return tintPaletteFromPixels(d);
}
const PALSLOTS = [[89, 9], [10, 90], [8, 13], [90, 86], [50, 5], [50, 93], [6, 52], [94, 50], [28, 30], [72, 68], ];   /* v262: the 11th and 12th colour (animated only) glow at the fixed spots [30,72] and [70,28], see tintPaletteGrad */   // where the secondary, tertiary, quaternary and quinary colours glow (% of the screen): top right, bottom left, top left, bottom right
function tintPaletteSlots(pal) {   // which corner each of the colours 2..5 takes: the corner nearest to where that colour sits in the picture (the best of all orders); a tie keeps the rank order (secondary = top right first)
  const rest = pal.slice(1), n = rest.length, idx = [...Array(n).keys()]; let best = null, bc = Infinity;
  const perm = (a, k) => { if (k === a.length) { let c = 0; a.forEach((j, i) => { const s = PALSLOTS[j]; c += (rest[i].x * 100 - s[0]) ** 2 / 1e4 + (rest[i].y * 100 - s[1]) ** 2 / 1e4 + .03 * (i - j) ** 2; }); if (c < bc - 1e-9) { bc = c; best = a.slice(); } return; } for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; perm(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
  const all = Array.from({ length: Math.min(n, PALSLOTS.length) }, (_, i) => i); if (n) perm(all, 0);
  return best || idx;
}
function tintPaletteFill(pal) {   // a plain cover has fewer than 5 colours: the missing ones are lighter / darker, slightly turned shades of the colours it has, so the layout always has 5
  const out = pal.slice(); if (!out.length) return out; const base = pal.length, mods = [[.9, 0, 1.12], [1.1, 0, .85], [.8, 0, 1.2], [1.18, 0, .8]];
  for (let i = 0; out.length < PALFILL; i++) { const s = pal[i % base], [lk, , ck] = mods[Math.floor(i / base) % mods.length], h = Math.atan2(s.b, s.a) + (i % 2 ? .35 : -.35), c = Math.hypot(s.a, s.b) * ck; out.push({ L: Math.max(.08, Math.min(.9, s.L * lk)), a: Math.cos(h) * c, b: Math.sin(h) * c, share: 0, x: s.x, y: s.y, rank: out.length + 1, derived: true }); }
  return out;
}
function tintPaletteFlat(hex) {   // the cover could not be read: one colour, the layout makes the other four from shades of it
  const n = parseInt(String(hex || '#c8102e').slice(1), 16), [L, a, b] = mixToLab(n >> 16, (n >> 8) & 255, n & 255); return [{ L, a, b, share: 1, x: .5, y: .5, rank: 1 }];
}
function tintPaletteGradEnhance(c) {   // v267/v268 (owner: brown / blonde / eye colours faint, but the pink and purple far too big): in the GRADIENT only (the palette values are not changed). Each kind of small colour gets its own gentle boost: an EYE keeps its lightness (at least .3) and gets chroma .04-.08 (not lifted to pink); a BLUSH is lifted to L .42 with chroma .045-.12; a HAIR keeps L .3+ with chroma .04-.10; a YELLOW-OLIVE / blonde colour (hue 50-130) gets chroma x3.5 (.06-.12) at L .4+; any other small colour (dress, under 12 %) gets chroma x2.5 at L .4+. A big colour gets a mild boost (x1.6, at most .06). A true neutral (chroma < .004) is left alone.
  if (!c || c.derived) return c; const a0 = c.a || 0, b0 = c.b || 0, cn = Math.hypot(a0, b0); if (cn < .004) return c;
  const hd = x => { const q = Math.atan2(x.b || 0, x.a || 0) * 180 / Math.PI; return q < 0 ? q + 360 : q; };
  const blonde = hd(c) >= 50 && hd(c) <= 130 && (c.share || 0) >= .05 && c.L >= .35 && c.L <= .5 && cn >= .012 && cn <= .04;   /* the blonde / olive HAIR tone of a 5 %+ mid-lightness colour */
  const det = !!(c.eye || c.spot || c.hair || c.extra || blonde) || (c.share || 0) < .05; if (!det && cn >= .06) return c;
  const h = Math.atan2(b0, a0);
  let k, L = c.L;
  if (c.eye) { k = Math.min(.11, Math.max(cn * 1.3, .05)); L = Math.max(c.L, .34); }   /* v271 (owner: "make sure it captures small details, the eyes and the hair colour"): an eye keeps (a little more than) its real chroma, up to .11 (was capped at .07 = grey on most eyes) */
  else if (c.spot) { k = Math.min(.12, Math.max(cn * 2.5, .045)); L = Math.max(c.L, .42); }
  else if (c.hair) { k = Math.min(.1, Math.max(cn * 2.5, .04)); L = Math.max(c.L, .3); }
  else if (blonde) { k = Math.min(.1, Math.max(cn * 3, .05)); L = Math.max(c.L, .4); }
  else if (c.thin) { k = Math.min(.05, cn); L = Math.min(Math.max(c.L, .34), .6); }   /* v276 (owner: "why Starboy got a small orb"): a THIN detail (a rim light, an outline: its pixels are lines, not a blob) is kept soft, it is not an object of its own */
  else if (det && (c.share || 0) < .03 && cn > .08) { k = Math.min(.12, cn); L = Math.max(c.L, .4); }   /* v271: a tiny VIVID detail (a blush, lips, an earring) keeps its real colour (was cut to chroma .07 = a dull rose); its glow stays small */
  else if (det) { k = Math.min(.07, Math.max(cn * 1.8, .03)); L = Math.max(c.L, .34); }   /* v269: small colours toned down (owner: the small colours are too big / strong) */   /* v268: the blonde / olive HAIR tone only (a mid-lightness yellow-olive of 5 %+); other small colours keep the milder boost */
  else k = Math.min(.06, cn * 1.6);
  return Object.assign({}, c, { L, a: Math.cos(h) * k, b: Math.sin(h) * k });
}
function tintPaletteGrad(palIn) {   // the palette as a CSS background-image: base gradient of the primary colour, the primary glowing in the middle, the other four glowing in the corners, a dark veil at the bottom
  const pal = tintPaletteFill(palIn || []).map(c => (c && c.small && c.lit ? Object.assign({}, c, { thin: true, spot: false }) : c)).map(c => (c && !c.eye && !c.small && !c.hair && !c.spot && !c.derived && (c.share || 0) < .01 && c.solid != null && c.solid < .35 && !tintPaletteIsBlush(c) ? Object.assign({}, c, { thin: true }) : c)).map(tintPaletteGradEnhance); if (!pal.length) return '';   // v276: thin = a TINY colour (< 1 %) whose pixels are mostly LINES (under 35 % have 3+ same-colour neighbours): a rim light / outline, drawn soft
  const rgb = (c, cap, k, al) => { const cn0 = Math.hypot(c.a, c.b), bo = !c.hair && cn0 > .035 ? 1 + .5 * Math.min(1, (cn0 - .035) / .1) : 1, lo = cn0 > .06 && !c.hair ? .5 : 0, r = mixToRgb(Math.max(lo * (k > .9 ? 1 : 0), Math.min(.95, c.L * k * (cn0 > .06 && !c.hair ? 1.08 : 1))), c.a * bo, c.b * bo, cap, 0);   /* v209: a hair colour is drawn exactly as read (no boost) */ /* a vivid but very dark colour (Starboy's deep blue) is lifted to a lightness where it still reads as that colour */ return al == null ? 'rgb(' + r[0] + ',' + r[1] + ',' + r[2] + ')' : 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + al + ')'; };
  const glow = (c, cap, size, at, a0) => 'radial-gradient(' + size + ' at ' + at + ',' + rgb(c, cap, 1, a0) + ' 0%,' + rgb(c, cap, 1, +(a0 * .66).toFixed(2)) + ' 30%,' + rgb(c, cap, 1, +(a0 * .3).toFixed(2)) + ' 58%,' + rgb(c, cap, 1, +(a0 * .08).toFixed(2)) + ' 80%,' + rgb(c, cap, 1, 0) + ' 100%)';
  const P = pal[0], order = tintPaletteSlots(pal), layers = ['linear-gradient(180deg,rgba(0,0,0,0) 38%,rgba(0,0,0,.30) 66%,rgba(0,0,0,.66) 100%)', glow(P, .42, '100% 48%', '50% 42%', 1)];
  const tsh = pal.reduce((t, c) => t + (c.share || 0), 0) || 1, dks = pal.filter(c => c.L < .2 && Math.hypot(c.a, c.b) < .09 && !c.derived), DS = dks.reduce((t, c) => t + (c.share || 0), 0) / tsh, dm = DS >= .12 && dks.length > 0;   // v244: the dark mass is computed first, the colour loop needs it
  const areaL = [];   // v270: the big chromatic colours, at their true place and size (see bigV)
  const accK = [];   // v271: the share of each accL glow, so the SMALLEST details (eye, blush, earring, dark hair streak) can be drawn on top
  const accL = [];   // owner: a tiny real colour (an iris, a blush) used to be buried UNDER the big glows (CSS: first layer = on top) - now it gets its own smaller, brighter glow ON TOP of them
  for (let i = 1; i < PALDETAIL + 1 && i < pal.length; i++) { const s = PALSLOTS[order[i - 1]] || (DETAILSPOTS[i - 10] || [50, 50]), c = pal[i], dk = c.extra && c.L < .3, dn = !dk && !c.extra && !c.eye && !c.derived && c.L < .42 && Math.hypot(c.a, c.b) < .06 && c.share >= .02 && c.share < .12, sil = c.L > .4 && c.L < .88 && Math.hypot(c.a, c.b) < .04 && c.share >= .03 && !c.derived, acc = dk || dn || sil || (c.share < .03 && Math.hypot(c.a, c.b) > .05) || (c.vivid && c.share < .08) || (dm && c.share < .09 && c.L > .35 && Math.hypot(c.a, c.b) > .05) || ((c.eye || c.spot) && c.x != null);   /* v260 (owner, gif156: "take her eye colour and show it in the gradient"): a dark2 eye (the small dark-frame eye of EyeDark, share .0004) is an accent glow ON TOP, placed on the eye itself */ const bigV = !c.eye && !c.hair && !c.spot && !c.derived && (c.share || 0) >= .08 && Math.hypot(c.a || 0, c.b || 0) >= .1 && c.gx != null && c.sx != null;   /* v270: a BIG CHROMATIC colour (8 %+, chroma .1+) is drawn where its pixels REALLY are (tintPaletteExtent: mean place + spread), as a glow the size of its area: a title band across the top stays a band, a background stays around the figure, the figure stays in the middle. Was: 15 %+ only, one fixed 70 % x 50 % glow at one spot (Starboy: the blue sat over the red at the top = purple, the yellow title was a corner glow) */ if (bigV && c.sides) { for (const q of c.sides) areaL.push({ k: 1, g: glow(c, .56, Math.round(Math.max(40, Math.min(90, c.sx * 200))) + '% ' + Math.round(Math.max(22, Math.min(90, c.sy * 380))) + '%', Math.round(Math.max(3, Math.min(97, q.x * 100))) + '% ' + Math.round(Math.max(3, Math.min(97, q.y * 100))) + '%', .92) }); continue; }   /* v270: a background on both sides of a centred figure glows on both sides (under the figure) */ if (bigV) { areaL.push({ k: (c.sx || .01) * (c.sy || .01), g: glow(c, .56, Math.round(Math.max(45, Math.min(140, c.sx * 340))) + '% ' + Math.round(Math.max(20, Math.min(90, c.sy * 340))) + '%', Math.round(Math.max(3, Math.min(97, c.gx * 100))) + '% ' + Math.round(Math.max(3, Math.min(97, c.gy * 100))) + '%', .92) }); continue; }   /* v269 (owner: the Starboy red was missing): a BIG VIVID colour (15 %+ of the picture, chroma .12+) glows at its REAL place, above the dark layers, not at a corner slot under the dark veil */
  (acc || c.hair || c.cover || bigV ? accL : layers).push(bigV ? glow(c, .56, '70% 50%', Math.round(Math.max(5, Math.min(95, c.x * 100))) + '% ' + Math.round(Math.max(5, Math.min(95, c.y * 100))) + '%', .85) : c.hair ? glow(c, .5, '40% 27%', Math.round(Math.max(15, Math.min(85, c.x * 100))) + '% ' + Math.round(Math.max(10, Math.min(60, c.y * 100))) + '%', .8) : dk ? glow(c, .3, '80% 70%', Math.round(Math.max(15, Math.min(85, c.x * 100))) + '% ' + Math.round(Math.max(20, Math.min(80, c.y * 100))) + '%', .96) : dn ? glow(c, .5, (30 + Math.min(22, Math.round(c.share * 200))) + '% ' + (32 + Math.min(22, Math.round(c.share * 200))) + '%', Math.round(Math.max(25, Math.min(75, c.x * 100))) + '% ' + Math.round(Math.max(25, Math.min(75, c.y * 100))) + '%', .95) : sil ? glow(c, .56, (34 + Math.min(22, Math.round(c.share * 160))) + '% ' + (26 + Math.min(16, Math.round(c.share * 110))) + '%', s[0] + '% ' + s[1] + '%', .92) : acc ? glow(c, .56, c.spot && !c.eye ? '16% 12%' : (c.dark2 || c.eye) ? '18% 13%' : c.extra ? '24% 18%' : ((30 + Math.min(14, Math.round(c.share * 600)) + (tintPaletteIsBlush(c) ? 4 : 0) + (c.peak ? 10 : (c.dark2 || (c.eye && c.L < .3)) ? 0 : c.eye ? 14 : c.vivid ? 6 : 0)) + '% ' + (24 + Math.min(10, Math.round(c.share * 400)) + (tintPaletteIsBlush(c) ? 3 : 0) + (c.peak ? 8 : c.eye ? 11 : c.vivid ? 5 : 0)) + '%'), ((c.eye || c.spot || (c.share < .03 && Math.hypot(c.a, c.b) > .05 && !c.extra && c.gx != null)) && c.x != null) ? Math.round(Math.max(3, Math.min(97, c.x * 100))) + '% ' + Math.round(Math.max(3, Math.min(97, c.y * 100))) + '%' : s[0] + '% ' + ((c.vivid || c.eye) ? Math.min(s[1], 56) : s[1]) + '%', c.thin ? .45 : (c.eye || c.spot) ? 1 : (c.dark2 || (c.eye && c.L < .3)) ? .7 : c.peak ? .75 : c.eye ? 1 : .9)   /* v259d: the dark second face's purple eye is a SMALL, soft accent (owner: it took too much of the background) */ /* v257 (v259e: peak = tongue now small + 60 %, dark2 eye tiny + 40 %, owner: they dominated the other colours): an eye colour glows bigger and fully opaque so it shows in the gradient */ : glow(c, .5, Math.round((i === 1 ? 115 : 112) * Math.max(.55, Math.min(1.15, .55 + 2.2 * (c.share || 0)))) + '% ' + Math.round((i === 1 ? 64 : 60) * Math.max(.55, Math.min(1.15, .55 + 2.2 * (c.share || 0)))) + '%', (c.gx != null && c.sx < .24 && c.sy < .24 ? Math.round(Math.max(8, Math.min(92, c.gx * 100))) + '% ' + Math.round(Math.max(8, Math.min(92, c.gy * 100))) : s[0] + '% ' + s[1]) + '%', 1)); while (accK.length < accL.length) accK.push(c.derived ? 1 : c.share || 0); }   /* a made-up filler shade (tintPaletteFill, share 0) is not a detail: it stays underneath */   /* v271: a mid-size colour that sits in ONE area of the picture (spread < .24 both ways, tintPaletteExtent) glows where that area is (hair at the top / side, a shirt at the bottom); a colour spread over the whole picture keeps its corner slot */   // v243: the glow's size follows the colour's share (a 6 % red no longer covers as much screen as a 42 % brown)
  // v243 (owner: "the black is more in the picture but you only kept it less"): a picture that is mostly black / very dark (Gasoline 75 %, Echoes of Silence 50 %, Starboy 56 %) showed only 5-20 % black in the lyrics background, because every colour got the same sized glow. The dark colours of the palette now add ONE big dark glow whose size follows their total share, over the colour glows (the small accents stay on top of it).
  // v243: silver / light grey (a chrome mask) is drawn on TOP like an accent (see sil below), so the big dark glow cannot bury it.
  if (dm) { const w = dks.reduce((t, c) => t + (c.share || 0), 0) || 1, m = dks.reduce((o, c) => ({ L: o.L + c.L * (c.share || 0) / w, a: o.a + c.a * (c.share || 0) / w, b: o.b + c.b * (c.share || 0) / w, x: o.x + (c.x == null ? .5 : c.x) * (c.share || 0) / w, y: o.y + (c.y == null ? .5 : c.y) * (c.share || 0) / w }), { L: 0, a: 0, b: 0, x: 0, y: 0 }), rx = Math.round(40 + 110 * Math.pow(Math.min(1, DS), .8)); layers.splice(1, 0, 'radial-gradient(' + rx + '% ' + Math.round(rx * .62) + '% at ' + Math.round(Math.max(30, Math.min(70, m.x * 100))) + '% ' + Math.round(Math.max(35, Math.min(70, m.y * 100))) + '%,' + rgb(m, .3, 1, 1) + ' 0%,' + rgb(m, .3, 1, .88) + ' 45%,' + rgb(m, .3, 1, .42) + ' 75%,' + rgb(m, .3, 1, 0) + ' 100%)'); }   // v244: flatter falloff so the black keeps its strength over the middle of the glow
  for (let i = 1; i < PALDETAIL + 1 && i < pal.length; i++) { const c = pal[i]; if (c.eye && !(c.dark2 || (c.eye && c.L < .3)) && c.x2 != null && c.y2 != null) accL.push(glow(c, .56, '36% 30%', Math.round(Math.max(10, Math.min(90, c.x2 * 100))) + '% ' + Math.round(Math.max(10, Math.min(56, c.y2 * 100))) + '%', .85)); }   // v250 (item 8): the second eye gets its own small glow of the same eye colour
  while (accK.length < accL.length) accK.push(0);   /* the second-eye glows: tiny, on top */
  { const ix = accL.map((g, i) => i).sort((u, v) => accK[u] - accK[v] || u - v), sorted = ix.map(i => accL[i]); accL.length = 0; accL.push(...sorted); }   // v271 (owner: "make sure it captures small details too, like the eyes and hair colour"): accent glows were stacked in palette order, so a 10 % accent buried a 0.3 % blush / eye under it. Now the smallest is on top (CSS: first layer = top)
  areaL.sort((u, v) => u.k - v.k);   // v270: the most compact area on top (a figure over its background, a title band over the sky)
  layers.splice(1, 0, ...accL, ...areaL.map(u => u.g));
  layers.push('linear-gradient(180deg,' + rgb(P, .42, 1) + ' 0%,' + rgb(P, .42, .8) + ' 55%,' + rgb(P, .42, .5) + ' 100%)');
  return layers.join(',');
}
/* v248 (palette fix session 1, owner: eyes missing on stills, red missing in Too Late, Starboy takes too many colours; same code for ANY picture / GIF / Canvas / cover, nothing about one picture is used). Three new pure steps, wired in tintPaletteAuto, and a small change in tintPaletteGrad:
   (A) tintPaletteTidy: LAST clean-up of look-alikes, a cost rule: a colour is dropped into its nearest same-hue-family colour when share x distance is tiny (the picture is still represented). Unlike Consolidate / Dedupe it also covers hair / cover / gap colours (Starboy's yellow letters were read as "hair" twice and a second orange / yellow / red were left over). Eyes, blush, vivid colours and rank 1 are never dropped.
   (B) tintPaletteAddVivid: every hue family (30 deg) that has >= 0.6 % real vivid pixels (chroma >= .085) must be in the palette in its TRUE vivid colour (mean of the most chromatic 30 % of those pixels). A palette colour of that hue that is duller / darker than the real vivid pixels is replaced by it (flag vivid); no such colour = one is added (free slot, or the smallest plain colour gives up its slot). Too Late's coat + blood red were only a dark 2 % brown-red.
   (C) tintPaletteAddEyeRings: eyes on ANY still or frame, with no size / colour limits of the older iris step (that one needs the iris to be small, light-lit and next to NEAR-WHITE; a big iris of a close-up, a night scene where the eye white is grey, or a dark pupil that splits the iris all failed). Rule: a highlight (L > .86, chroma < .08, 2-220 px at 192) that sits on a dark pupil (>= 12 % of the pixels within 17 px are dark) with chromatic iris pixels around it (>= 12 px) and light neutral eye-white / skin-shade pixels in the ring beyond it (>= 6 %), so a glint on black hair or on an earring is not an eye. The iris colour = mean of the most chromatic hue bin; skipped when the palette already has it (distance < .045 AND hue within 25 deg). Up to 2 eyes, one per hue family, flagged eye. */
function tintPaletteTidy(pal) {
  if (pal.length < 3) return pal;   // nothing to merge (and a flat picture keeps exactly what it had)
  const hu = c => Math.atan2(c.b, c.a) * 180 / Math.PI, hd = (p, q) => { const x = Math.abs(hu(p) - hu(q)) % 360; return x > 180 ? 360 - x : x; }, cn = c => Math.hypot(c.a, c.b), dist = (p, q) => Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
  const prot = c => !!(c.eye || c.vivid || tintPaletteIsBlush(c) || (c.hair && (c.share || 0) >= .03));   // a real hair tone (>= 3 %) is never merged; tiny false 'hair' (a yellow title) is
  for (let again = pal.length > 2; again;) {
    again = false; let bi = -1, bj = -1, bc = 1e9;
    pal.forEach((c, i) => {
      if (i === 0 || prot(c)) return;
      pal.forEach((q, j) => {
        if (j === i || (q.share || 0) < (c.share || 0)) return;   // a colour is only ever dropped INTO a bigger (or equal) one
        const dd = dist(c, q), grey = cn(c) < .04 && cn(q) < .04, fam = grey ? Math.abs(c.L - q.L) < .2 : (cn(c) >= .04 && cn(q) >= .04 && hd(c, q) <= (cn(c) > .1 && cn(q) > .1 ? 38 : 30)), cost = (c.share || 0) * dd, lim = cn(c) > .1 && cn(q) > .1 ? .006 : .003;
        if (fam && dd < .17 && cost < lim && cost < bc) { bc = cost; bi = i; bj = j; }
      });
    });
    if (bi >= 0) { pal[bj].share = (pal[bj].share || 0) + (pal[bi].share || 0); pal.splice(bi, 1); again = pal.length > 2; }
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteDropBlends(pal) {   // v249 (open item 7: Starboy kept an orange of 4 % that is only the edge where the red meets the yellow). A SMALL plain colour (< 6 %) that lies on the straight line between two BIGGER palette colours (OKLab distance to that segment < .045, somewhere in its middle 70 %) is a blend of them (anti-aliased edge, texture), not a colour of its own: it is dropped and its share goes to the nearer of the two. Never rank 1, an eye, an extra, hair, a blush, a proven solid area (cover), or a palette of 3 colours or fewer. Nothing about one picture.
  if (pal.length < 4) return pal;
  const prot = c => !!(c.eye || c.extra || c.hair || c.cover || tintPaletteIsBlush(c));   // cover = a solid colour AREA the coverage step proved (a shirt, a wall): never a mere blend
  for (let again = true; again;) {
    again = false;
    for (let i = 1; i < pal.length && !again; i++) {
      const c = pal[i]; if (prot(c) || (c.share || 0) >= .06) continue;
      for (let j = 0; j < pal.length && !again; j++) for (let k = j + 1; k < pal.length && !again; k++) {
        if (j === i || k === i) continue; const p = pal[j], q = pal[k]; if ((p.share || 0) <= (c.share || 0) || (q.share || 0) <= (c.share || 0)) continue;
        const vx = q.L - p.L, vy = q.a - p.a, vz = q.b - p.b, len2 = vx * vx + vy * vy + vz * vz; if (len2 < 1e-6) continue;
        const t = ((c.L - p.L) * vx + (c.a - p.a) * vy + (c.b - p.b) * vz) / len2; if (t < .15 || t > .85) continue;
        const d = Math.hypot(p.L + t * vx - c.L, p.a + t * vy - c.a, p.b + t * vz - c.b); if (d >= .045) continue;
        const near = t < .5 ? p : q; near.share = (near.share || 0) + (c.share || 0); pal.splice(i, 1); again = true;
      }
    }
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteGiveSlot(pal, minShare) {   // v248: makes room for ONE new detail colour: the plain colour that costs the picture least (smallest share, never rank 1 / eye / extra / blush / vivid / hair) gives its slot, only when it is under minShare. Returns true when there is room
  if (pal.length < PALMAX) return true; let k = -1;
  for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.extra || q.vivid || q.hair || tintPaletteIsBlush(q) || (q.share || 0) >= minShare) continue; if (k < 0 || (q.share || 0) < (pal[k].share || 0)) k = i; }
  if (k < 0) return false; pal.splice(k, 1); return true;
}
function tintPaletteAddVivid(pal, frames, W = 96) {
  if (!frames || !frames.length || pal.length < 2) return pal;   // a flat one-colour picture is left exactly as it is
  const px = tintPaletteReadPx(frames, W), n = px.length / 5, hu = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; };
  const bins = Array.from({ length: 12 }, () => []);
  for (let i = 0; i < n; i++) { const L = px[i * 5], a = px[i * 5 + 1], b = px[i * 5 + 2], c = Math.hypot(a, b); if (c < .085 || L < .2 || L > .88) continue; bins[Math.floor(hu(a, b) / 30) % 12].push(i); }
  const cand = [];
  bins.forEach(list => {
    if (list.length < .006 * n) return;
    list.sort((p, q) => Math.hypot(px[q * 5 + 1], px[q * 5 + 2]) - Math.hypot(px[p * 5 + 1], px[p * 5 + 2]));
    const top = list.slice(0, Math.max(1, Math.ceil(list.length * .3))); let L = 0, a = 0, b = 0; top.forEach(i => { L += px[i * 5]; a += px[i * 5 + 1]; b += px[i * 5 + 2]; }); L /= top.length; a /= top.length; b /= top.length;
    const sp = tintPaletteSpot(top.map(i => ({ x: px[i * 5 + 3], y: px[i * 5 + 4] })), W);
    cand.push({ L, a, b, share: list.length / n, x: sp.x, y: sp.y, vivid: true });
  });
  cand.sort((p, q) => q.share * Math.hypot(q.a, q.b) - p.share * Math.hypot(p.a, p.b));
  let added = 0;
  for (const c of cand) {
    const ch = Math.hypot(c.a, c.b), hc = hu(c.a, c.b), near = pal.filter(q => Math.hypot(q.a, q.b) >= .6 * ch && hd(hu(q.a, q.b), hc) < 22 && Math.abs(q.L - c.L) < .2 && !q.eye);
    if (near.length) {   // the hue is there: the biggest such colour becomes the real vivid colour when it is duller / darker (more than .04 lightness or 25 % chroma away)
      const q = near.reduce((u, v) => ((v.share || 0) > (u.share || 0) ? v : u)); if (q.vivid) continue;
      if (Math.hypot(q.a, q.b) < .75 * ch) { q.L = c.L; q.a = c.a; q.b = c.b; q.x = c.x; q.y = c.y; }
      q.vivid = true; continue;
    }
    if (added >= 2 || !tintPaletteGiveSlot(pal, Math.max(.04, c.share * 3))) continue;
    pal.push(c); added++;
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteFamilyCap(pal) {   // v252 (owner: c12 "showing too much green, no purple": 3 of 10 colours were greens, 39 % of the picture, all stacked on the left edge). ONE hue family (45 deg) with 3 or more chromatic colours (chroma >= .04) that together cover >= 25 % of the picture may keep only 2: the smallest member that is under 8 % (never rank 1, an eye, hair, a blush, an extra, a cover colour) is merged into the nearest bigger member of its family, its share goes there and its slot is freed (a free slot is later used by nothing else, a palette of 9 is fine). At most 2 merges. Nothing about one picture: any hue, any picture / GIF / cover. Returns pal (ranks renumbered).
  if (!pal || pal.length < 6) return pal;
  const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, chr = c => Math.hypot(c.a, c.b), hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; };
  for (let pass = 0; pass < 2; pass++) {
    let cut = -1, into = -1;
    for (let i = 0; i < pal.length && cut < 0; i++) {
      const ci = pal[i]; if (chr(ci) < .04 || ci.derived || (hue(ci) < 120 || hue(ci) >= 330)) continue;   // only greens / blues / violets (120-330 deg): reds, pinks, skin, hair and wood tones (330-120 deg) legitimately hold several shades (blush, lips, skin shade)
      const fam = pal.map((c, j) => j).filter(j => chr(pal[j]) >= .04 && !pal[j].derived && hd(hue(pal[j]), hue(ci)) <= 45), fs = fam.reduce((t, j) => t + (pal[j].share || 0), 0);
      if (fam.length < 3 || fs < .25) continue;
      const cand = fam.filter(j => j > 0 && !pal[j].eye && !pal[j].hair && !pal[j].extra && !pal[j].cover && !tintPaletteIsBlush(pal[j]) && chr(pal[j]) >= .085 && (pal[j].share || 0) >= .025 && (pal[j].share || 0) < .08).sort((u, v) => (pal[u].share || 0) - (pal[v].share || 0))[0];   // only a VIVID duplicate (chroma >= .085) that is a visible 2.5-8 % of the picture is merged, a dull or a tiny one is a real detail
      if (cand == null) continue;
      const big = fam.filter(j => j !== cand && (pal[j].share || 0) >= (pal[cand].share || 0) && Math.hypot((pal[j].x ?? .5) - (pal[cand].x ?? .5), (pal[j].y ?? .5) - (pal[cand].y ?? .5)) <= .3)   /* STACKED only: the two colours sit within 30 % of the picture of each other (one object's shading: a hair strand fading teal to green); two far-apart areas of one hue family are different things and both stay */.sort((u, v) => Math.hypot(pal[u].L - pal[cand].L, pal[u].a - pal[cand].a, pal[u].b - pal[cand].b) - Math.hypot(pal[v].L - pal[cand].L, pal[v].a - pal[cand].a, pal[v].b - pal[cand].b))[0];
      const nn = pal.map((c, j) => j).filter(j => j !== cand).sort((u, v) => Math.hypot(pal[u].L - pal[cand].L, pal[u].a - pal[cand].a, pal[u].b - pal[cand].b) - Math.hypot(pal[v].L - pal[cand].L, pal[v].a - pal[cand].a, pal[v].b - pal[cand].b))[0];
      if (big == null || nn !== big) continue; cut = cand; into = big;   // the target must also be the cut colour's nearest colour in the WHOLE palette (a violet next to a far-away violet is not merged into a plum)
    }
    if (cut < 0) break;
    pal[into].share = (pal[into].share || 0) + (pal[cut].share || 0); pal.splice(cut, 1);
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteEyeOne(pal) {   // v252 (open item: blonde_bed.gif had a real olive eye AND a false brown eye of 0.4 %). Both eyes of a face are ONE colour: when 2 or more colours are flagged eye and their hues differ by more than 30 deg, only one stays. A skin / hair / wood hue (15-85 deg) is weaker evidence (it cannot be told from skin and hair), so a non-warm eye wins; else the more chromatic one. The loser loses the eye flag, and when it is a tiny colour (< 3 %) with no other job it is removed from the palette. Returns pal (ranks renumbered).
  if (!pal || pal.length < 2) return pal;
  const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; }, warm = c => hue(c) > 15 && hue(c) < 85;
  const eyes = pal.filter(c => c.eye); if (eyes.length < 2) return pal;
  const best = eyes.slice().sort((u, v) => (warm(u) - warm(v)) || (Math.hypot(v.a, v.b) - Math.hypot(u.a, u.b)))[0];
  for (const c of eyes) { if (c === best || hd(hue(c), hue(best)) <= 30) continue; if (c.x != null && best.x != null && Math.hypot(c.x - best.x, c.y - best.y) > .3) continue;   /* v255: an eye far from the other (> 30 % of the picture) is a different face (two girls: purple + green), so both stay */ c.eye = false; if ((c.share || 0) < .03 && !c.vivid && !c.hair && !c.extra && !c.cover) pal.splice(pal.indexOf(c), 1); }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteAddEyeRings(pal, frames, W = 192, dull = false) {   // v256: dull = true (only tintPaletteEyeRescue passes it): a DARK / grey scene (night, shadow) where an iris has chroma .015-.03 and the eye-white is grey (L .38-.55)
  if (!frames || !frames.length || !pal.length) return pal;
  const sc = W / 192, N = W * W, hueDeg = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; }, groups = [];
  frames.forEach((f, fi) => {
    const L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), C = new Float32Array(N), hm = new Uint8Array(N);
    for (let p = 0; p < N; p++) { const [l, a, b] = mixToLab(f[p * 4], f[p * 4 + 1], f[p * 4 + 2]); L[p] = l; A[p] = a; B[p] = b; C[p] = Math.hypot(a, b); }
    const rb = Math.max(2, Math.round(6 * sc)), T = new Float64Array((W + 1) * (W + 1)); for (let y = 0; y < W; y++) { let row = 0; for (let x = 0; x < W; x++) { row += L[y * W + x]; T[(y + 1) * (W + 1) + x + 1] = T[y * (W + 1) + x + 1] + row; } }
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (C[p] >= .08) continue; const x0 = Math.max(0, x - rb), x1 = Math.min(W - 1, x + rb), y0 = Math.max(0, y - rb), y1 = Math.min(W - 1, y + rb), mean = (T[(y1 + 1) * (W + 1) + x1 + 1] - T[y0 * (W + 1) + x1 + 1] - T[(y1 + 1) * (W + 1) + x0] + T[y0 * (W + 1) + x0]) / ((x1 - x0 + 1) * (y1 - y0 + 1)); if (L[p] > .86 || (L[p] > .62 && L[p] - mean > .24)) hm[p] = 1; }   // a highlight = near-white, or clearly brighter than its own surroundings (a night scene's grey glint)
    const seen = new Uint8Array(N), R = Math.round(17 * sc), R2 = Math.round(34 * sc), mg = .04 * W;
    const comps = [];
    for (let p0 = 0; p0 < N; p0++) {
      if (!hm[p0] || seen[p0]) continue; const st = [p0], px = []; seen[p0] = 1;
      while (st.length) { const q = st.pop(); px.push(q); const x = q % W, y = (q / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue; const r = ny * W + nx; if (hm[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
      if (px.length < 2 * sc * sc || px.length > 220 * sc * sc) continue;
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const q of px) { const x = q % W, y = (q / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x0 < mg || y0 < mg || x1 > W - 1 - mg || y1 > W - 1 - mg) continue;
      comps.push({ cx: Math.round((x0 + x1) / 2), cy: Math.round((y0 + y1) / 2) });
    }
    for (const cp of comps) {
      const cx = cp.cx, cy = cp.cy, crowd = comps.filter(o => Math.hypot(o.cx - cx, o.cy - cy) <= R).length; let tot = 0, dark = 0, ring = 0, ringLight = 0, skinN = 0; const bins = Array.from({ length: 12 }, () => ({ n: 0, c: 0, l: 0, a: 0, b: 0, list: [] }));
      for (let y = Math.max(0, cy - R2); y <= Math.min(W - 1, cy + R2); y++) for (let x = Math.max(0, cx - R2); x <= Math.min(W - 1, cx + R2); x++) {
        const dd = Math.hypot(x - cx, y - cy), p = y * W + x; if (dd > R2 || hm[p]) continue;
        ring++; { const hh = hueDeg(A[p], B[p]); if (dull ? (L[p] >= .25 && L[p] <= .95 && C[p] <= .17) : (L[p] >= .4 && L[p] <= .95 && C[p] >= .02 && C[p] <= .17 && (hh <= 85 || hh >= 315))) skinN++; }   /* v251: pink-lavender skin (hue 315+) counts as skin for the face check; the iris step also accepts a small chromatic iris (>= 2.5 % of the window, chroma .075), a pale pink iris (L .55-.75, chroma .09+) is not skin, tinted whites count as eye-white, dark pupil >= 10 %, and a hue bin must sit around the highlight (star-shaped eyes: Ai, pink star eyes) */ /* v249: skin-like pixel (light, soft, warm / pink) for the face check */ if ((L[p] > (dull ? .38 : .55) && C[p] < (dull ? .07 : .06)) || (L[p] > .72 && C[p] < .12)) ringLight++;   // eye-white / a light neutral shade of it (a night scene's is grey), anywhere in the window
        if (dd <= R) { tot++; if (L[p] < .5) dark++; if (C[p] >= (dull ? .015 : .03) && L[p] <= (dull ? .40 : .85) && L[p] >= (dull ? .06 : .2) && !(L[p] > .55 && C[p] < .14 && (L[p] > .75 || C[p] < .09) && (hueDeg(A[p], B[p]) >= 340 || hueDeg(A[p], B[p]) <= 70)) && (dull || pal.every(q => Math.hypot(q.L - L[p], q.a - A[p], q.b - B[p]) > .035))) { const k = Math.floor(hueDeg(A[p], B[p]) / 30) % 12; bins[k].n++; bins[k].c += C[p]; bins[k].list.push(p); } }   // only colours the palette does not have yet can be the iris; light warm pink / beige pixels are skin, not iris
      }
      const weakDark = dark < .10 * tot;   /* v253: a dull iris (olive / grey-green, chroma .04-.07) on a pale-eyed face (blonde_bed, two_girls) has little dark pupil (5-10 %) and a small bin: such a spot is WEAK and only counts when it has a level partner (pair) */
      if (tot < 30 * sc * sc || dark < .04 * tot || ringLight < .025 * ring || (crowd >= 5 && dark > .6 * tot)) continue;   // crowd: many white specks on a mostly black ground are text / a label / stars, not an eye
      let bk = -1; bins.forEach((B2, k) => { if (B2.n >= 12 * sc * sc && (B2.n >= .08 * tot || (B2.c / B2.n >= .075 && B2.n >= .025 * tot)) && (bk < 0 || B2.c > bins[bk].c)) { let sx = 0, sy = 0; for (const q of B2.list) { sx += q % W; sy += (q / W) | 0; } if (Math.hypot(sx / B2.list.length - cx, sy / B2.list.length - cy) <= .7 * R) bk = k; }   /* v251: a hue bin only counts when it sits AROUND the highlight (blue hair in the window no longer hides a small magenta iris) */ }); let weak = weakDark && !dull; if (bk < 0) { bins.forEach((B2, k) => { if (B2.n >= 12 * sc * sc && B2.n >= .02 * tot && B2.c / B2.n >= (dull ? .015 : .03) && (bk < 0 || B2.n > bins[bk].n)) { let sx = 0, sy = 0; for (const q of B2.list) { sx += q % W; sy += (q / W) | 0; } if (Math.hypot(sx / B2.list.length - cx, sy / B2.list.length - cy) <= .7 * R) bk = k; } }); weak = !dull; }
      if (bk < 0) continue;
      { let mx = 0, my = 0; for (const q of bins[bk].list) { mx += q % W; my += (q / W) | 0; } mx /= bins[bk].list.length; my /= bins[bk].list.length; if (Math.hypot(mx - cx, my - cy) > .7 * R) continue; }   // the iris colour sits AROUND the highlight, not in a corner of the window
      const near = bins[bk].list.filter(q => Math.hypot((q % W) - cx, ((q / W) | 0) - cy) <= .55 * R), lst = (near.length >= 8 * sc * sc ? near : bins[bk].list).sort((u, v) => C[v] - C[u]), top = lst.slice(0, Math.max(1, lst.length >> 1));   /* v252: the iris colour is read from the pixels right around the highlight (<= .55 R) when there are enough, so a red hair rim at the edge of the window no longer turns a pink iris red */ let l = 0, a = 0, b = 0; for (const q of top) { l += L[q]; a += A[q]; b += B[q]; } l /= top.length; a /= top.length; b /= top.length;
      let g = groups.find(g => Math.abs(g.cx - cx) <= 8 * sc && Math.abs(g.cy - cy) <= 8 * sc); if (!g) groups.push(g = { cx, cy, fr: new Set(), n: 0, l: 0, a: 0, b: 0 });
      g.strong = g.strong || !weak; g.fr.add(fi); g.n++; g.l += l; g.a += a; g.b += b; g.iris = (g.iris || 0) + bins[bk].n; g.skin = Math.max(g.skin || 0, skinN / Math.max(1, ring));
    }
  });
  const need = frames.length < 3 ? frames.length : Math.max(3, .2 * frames.length); let added = 0; const have = [];
  const gh = g => hueDeg(g.a / g.n, g.b / g.n); groups.forEach(g => { g.pair = groups.some(o => o !== g && Math.abs(o.cy - g.cy) <= 12 * sc && Math.abs(o.cx - g.cx) >= 20 * sc && Math.abs(o.cx - g.cx) <= 120 * sc && hd(gh(o), gh(g)) < 30); const ch = Math.hypot(g.a / g.n, g.b / g.n); g.score = Math.min(g.iris || 0, 100 * sc * sc) * ch * ch * (g.pair ? 3 : 1); });   /* v252: an iris is small: the pixel count is capped at 100 px (at 192), so a big coloured area (a shirt, a hair mass, 258-940 px) cannot beat a small real iris by size alone */
  groups.forEach(g => { g.sp = groups.find(o => o !== g && Math.abs(o.cy - g.cy) <= 5 * sc && Math.abs(o.cx - g.cx) >= 20 * sc && Math.abs(o.cx - g.cx) <= 120 * sc && hd(gh(o), gh(g)) < 20 && Math.abs(o.l / o.n - g.l / g.n) <= .12 && (() => { const c1 = Math.hypot(g.a / g.n, g.b / g.n), c2 = Math.hypot(o.a / o.n, o.b / o.n); return Math.max(c1, c2) <= 1.6 * Math.min(c1, c2); })()); if (g.sp) g.score *= 4; });   // v252 (owner: c12 pink star eyes read as a dull maroon on the ear): two spots that are LEVEL (<= 5 px apart in height), of one hue (20 deg), one lightness (.12) and one strength (x1.6) are the two eyes of a face: that strict pair counts x12 (the old loose pair x3), so a lone dark-red hair rim (it matched a loose pair) can no longer outrank the real irises
  groups.forEach(g => { if (!g.strong && !g.pair) g.score = 0; });
  groups.forEach(g => { if (g.l / g.n > .57 && (Math.hypot(g.a / g.n, g.b / g.n) < .075 || ((g.iris || 0) / g.fr.size > 220 * sc * sc && Math.hypot(g.a / g.n, g.b / g.n) < .15))) g.score = 0; });   // v255: a LIGHT spot (L > .57) is not an iris when it is dull (chroma < .075: a wall) or big (> 220 px per frame at 192) and not vivid (chroma < .15: a golden hair highlight was taken for an eye at 4 %); darker or vivid (pink / violet star, chroma .22) irises are untouched   // v253: a weak spot (dull iris / little pupil) needs a pair
  groups.forEach(g => { if ((g.skin || 0) < .18 && !(g.sp && (g.sp.skin || 0) >= .18 && (g.skin || 0) >= .10)) g.score = 0; });   // v252: the face check is passed by a strict-pair partner of a spot that passes it (the second eye may sit in a shadowed / washed corner of the face: skin .14 against .20)
   // v249 face check: an eye has skin around it (>= 18 % of the window: true eyes measure .23-.62, a coloured hair strand .06-.16); a coloured spot with no skin (a hair strand, a logo, an album-cover shape) is not an eye, even when two such spots look like a pair   // a face has TWO eyes of one colour at the same height: such a pair beats a single look-alike spot; the more colourful (chroma squared) spot beats dull hair strands
  groups.top = Math.max(0, ...groups.filter(g => g.fr.size >= need).map(g => g.score));
  for (const g of groups.filter(g => g.fr.size >= need && g.score > 0).sort((p, q) => q.score - p.score)) {
    if (added >= 2 || (added && g.score < .6 * (groups.top || 0))) break;
    if (added && Math.abs(g.cy - (have.cy0 ?? g.cy)) > 12 * sc) continue;   // v249: a second eye colour must sit at the height of the first (a face's eyes are level); a purple shirt button or hair shade lower down is not an eye
    have.cy0 = have.cy0 ?? g.cy;   // a second eye colour only when it is nearly as strong as the first (a hair streak is not a second eye)
    const c = { L: g.l / g.n, a: g.a / g.n, b: g.b / g.n }, ch = Math.hypot(c.a, c.b), hc = hueDeg(c.a, c.b);
    if (!g.sp && (g.skin || 0) < .30) continue;   /* v252: a lone spot (no level partner) needs a clear face around it (skin >= 30 %: real lone eyes measure .36-.56, a chrome / sky patch .18-.23) */
    
    if (have.some(h => hd(h, hc) < 30)) continue;
    const mate = groups.filter(o => o !== g && o.fr.size >= need && Math.abs(o.cy - g.cy) <= 12 * sc && Math.abs(o.cx - g.cx) >= 20 * sc && Math.abs(o.cx - g.cx) <= 120 * sc && hd(gh(o), hc) < 30).sort((u, v) => v.score - u.score)[0], setMate = q => { if (mate) { q.x2 = (mate.cx + .5) / W; q.y2 = (mate.cy + .5) / W; } };   // v250 (item 8): the other eye of the pair (same hue, same height) is remembered as a 2nd spot of the SAME eye colour: both eyes get the colour   // both eyes of a face are one eye colour
    const same = pal.findIndex((q, i) => i > 0 && !q.eye && Math.hypot(q.L - c.L, q.a - c.a, q.b - c.b) < .045 && hd(hueDeg(q.a, q.b), hc) < 25);
    if (same >= 0 && (pal[same].share || 0) >= .03) continue;
    if (hc > 15 && hc < 85 && pal.some(q => !q.eye && (q.share || 0) >= .03 && hd(hueDeg(q.a, q.b), hc) < 20 && Math.abs(q.L - c.L) < .15)) continue;   /* v252: a warm eye colour (same hue within 20 deg, lightness within .25) that is just a lighter / darker shade of a big palette colour (rust mask, skin, hair) is that colour, not an iris */   /* v252: an iris is tiny: an existing colour of 3 % or more (Gasoline's 8 % rust mask, a 40 % brown) is never adopted as THE eye colour */
    if (same >= 0) { const q = pal[same]; q.eye = true; q.x = (g.cx + .5) / W; q.y = (g.cy + .5) / W; setMate(q); have.push(hc); added++; continue; }   // the palette already has this colour (it was found on hair / a shirt): it is now THE eye colour and sits on the eye, protected from every clean-up
    if (pal.some(q => !q.eye && Math.hypot(q.L - c.L, q.a - c.a, q.b - c.b) < .045 && hd(hueDeg(q.a, q.b), hc) < 25)) continue;
    if (pal.some(q => q.eye && hd(hueDeg(q.a, q.b), hc) < 30)) continue;
    const k = Math.min(2.2, Math.max(1, .08 / Math.max(ch, .01))), e = { L: c.L, a: c.a * k, b: c.b * k, share: .0004, x: (g.cx + .5) / W, y: (g.cy + .5) / W, eye: true };
    setMate(e);
    if (!tintPaletteGiveSlot(pal, .06)) continue;
    pal.push(e); have.push(hc); added++;
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
/* v256 (owner: "eye colours are not picked up" on three animated pictures: a WebP of close-up green eyes, a dark night GIF, a two-girls WebP). WHY the old eye step missed them: it wants the SAME iris spot in >= 20 % of the kept frames, and a window of 17 px at 192. A close-up eye is 3 x bigger than that and, in a cut-up animation, sits at a DIFFERENT place in every shot; a night scene's iris has chroma .012-.03 (< the .03 limit). tintPaletteEyeRescue = ANIMATED pictures only (3+ eye frames), after tintPaletteEyeOne, adds a MISSING eye colour:
   (1) when the palette has no non-warm eye colour yet, every 192 px frame is read ALONE at two scales (192 px, and squeezed to 96 px so a close-up eye looks normal-sized), through the same tintPaletteAddEyeRings; a still has 1 frame and never comes here;
   (2) a dark picture (mean lightness < .4) that still has none is read again in "dull" mode (iris chroma .015+, lightness .06-.40, sclera L > .38; found at both scales = 2 votes);
   (3) the finds are clustered by hue (30 deg); a cluster needs the SAME hue in >= 2 different frames (a one-frame find is noise) and a non-warm hue (15-85 deg is skin / hair / wood, weak evidence; a green / violet / blue / grey-green iris is not); the biggest cluster (most frames) becomes THE eye colour (median colour, the spot of the member nearest to it), a second cluster of another hue only when it is another face's eye (>= 30 % of the picture away).
   Nothing is removed from the palette; it only fills a free slot (tintPaletteGiveSlot). */
function tintPaletteEyeRescue(pal, eyeFrames, W = 192) {
  if (!pal || pal.length < 2 || !eyeFrames || eyeFrames.length < 3) return pal;
  const hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; }, warm = c => hue(c) > 15 && hue(c) < 85;
  const good = pal.filter(c => c.eye && !warm(c) && Math.hypot(c.a, c.b) >= .04);
  if (good.length >= 2) return pal;
  const squeeze = (f, S, T) => { const k = S / T, o = new Uint8ClampedArray(T * T * 4); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { let r = 0, g = 0, b = 0; for (let yy = 0; yy < k; yy++) for (let xx = 0; xx < k; xx++) { const q = ((y * k + yy) * S + x * k + xx) * 4; r += f[q]; g += f[q + 1]; b += f[q + 2]; } const q = (y * T + x) * 4, n = k * k; o[q] = r / n; o[q + 1] = g / n; o[q + 2] = b / n; o[q + 3] = 255; } return o; };
  const base = pal.filter(c => !c.eye).map(c => Object.assign({}, c)); while (base.length >= PALN) { let vi = -1; for (let k = 1; k < base.length; k++) if (vi < 0 || (base[k].share || 0) < (base[vi].share || 0)) vi = k; base.splice(vi, 1); }   // a copy with a free slot, so the one-frame run can always place its find
  const found = [], scan = dull => { for (let i = 0; i < eyeFrames.length; i++) for (const T of [W, W / 2]) { if (T !== W && W % 2) continue; const fr = T === W ? eyeFrames[i] : squeeze(eyeFrames[i], W, T), r = tintPaletteAddEyeRings(base.map(c => Object.assign({}, c)), [fr], T, dull).find(c => c.eye); if (!r || r.x == null) continue; if (!dull && warm(r)) continue; if (Math.hypot(r.a, r.b) < (dull ? .02 : .04)) continue; found.push({ L: r.L, a: r.a, b: r.b, x: r.x, y: r.y, x2: r.x2, y2: r.y2, fr: i, T, dull, h: hue(r) }); } };
  if (!good.length) scan(false);
  let meanL = 0, nL = 0; for (const f of eyeFrames) for (let q = 0; q < W * W * 4; q += 4 * 97) { meanL += mixToLab(f[q], f[q + 1], f[q + 2])[0]; nL++; }
  if (!found.length && !pal.some(c => c.eye) && meanL / Math.max(1, nL) < .4) scan(true);
  if (!found.length) return pal;
  const cl = []; for (const f of found.sort((u, v) => u.h - v.h)) { const c = cl.find(c => hd(c.h, f.h) <= 30); if (c) { c.m.push(f); c.h = hue({ a: c.m.reduce((s, q) => s + q.a, 0), b: c.m.reduce((s, q) => s + q.b, 0) }); } else cl.push({ h: f.h, m: [f] }); }
  cl.forEach(c => { c.fr = new Set(c.m.map(q => q.fr)).size; if (c.fr < 2 && c.m.every(q => q.dull) && new Set(c.m.map(q => q.T)).size >= 2) c.fr = 2; });   // a dark scene's iris often shows in ONE kept frame: found at both scales (192 and 96 px) counts as 2 votes
  let added = pal.filter(c => c.eye).length;
  for (const c of cl.filter(c => c.fr >= 2).sort((u, v) => v.fr - u.fr)) {
    if (added >= 2) break;
    const med = k => { const v = c.m.map(q => q[k]).sort((p, q) => p - q); return v[v.length >> 1]; }, e = { L: med('L'), a: med('a'), b: med('b'), share: .0004, eye: true }, rep = c.m.slice().sort((u, v) => Math.hypot(u.L - e.L, u.a - e.a, u.b - e.b) - Math.hypot(v.L - e.L, v.a - e.a, v.b - e.b))[0];
    e.x = rep.x; e.y = rep.y; if (rep.x2 != null) { e.x2 = rep.x2; e.y2 = rep.y2; }
    if (!rep.dull) { const f = eyeFrames[rep.fr], cx = Math.round(rep.x * W - .5), cy = Math.round(rep.y * W - .5), RR = Math.round(26 * W / 192), px = []; for (let y = Math.max(0, cy - RR); y <= Math.min(W - 1, cy + RR); y++) for (let x = Math.max(0, cx - RR); x <= Math.min(W - 1, cx + RR); x++) { if (Math.hypot(x - cx, y - cy) > RR) continue; const o = (y * W + x) * 4, [l, a, b] = mixToLab(f[o], f[o + 1], f[o + 2]), ch = Math.hypot(a, b); if (ch >= .06 && l >= .25 && l <= .92 && hd(hue({ a, b }), hue(e)) <= 35) px.push({ l, a, b, ch }); }   /* the iris colour: the dark rim of a big close-up iris pulled the first read dark (olive 0.37 for a lime-green iris); the true iris is the most chromatic half of the pixels of the SAME hue around the spot (a green iris is far from skin hue, so skin / hair do not enter) */
      if (px.length >= 12) { px.sort((u, v) => v.ch - u.ch); const top = px.slice(0, px.length >> 1); const q = { L: top.reduce((s2, t) => s2 + t.l, 0) / top.length, a: top.reduce((s2, t) => s2 + t.a, 0) / top.length, b: top.reduce((s2, t) => s2 + t.b, 0) / top.length }; if (Math.hypot(q.a, q.b) >= Math.hypot(e.a, e.b)) { e.L = q.L; e.a = q.a; e.b = q.b; } } }
    if (pal.some(q => q.eye && (hd(hue(q), hue(e)) < 30 || Math.hypot(q.x - e.x, q.y - e.y) < .3))) continue;   // the same hue, or the same face, already has an eye colour
    if (pal.some(q => !q.eye && Math.hypot(q.L - e.L, q.a - e.a, q.b - e.b) < .045 && hd(hue(q), hue(e)) < 25)) continue;
    if (!tintPaletteGiveSlot(pal, .06)) continue;
    pal.push(e); added++;
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
/* v254 (owner: "it still didn't take the olive of the dark-haired girl, the blue t-shirt, the turquoise bed lines, the shades; it took the wrong frame, take it from MULTIPLE frames"). tintPaletteMultiFrame = the LAST step for an ANIMATED picture only (stills are untouched). It reads EVERY kept frame (a GIF / WebP can have 2 scenes: faces + navy wall, then olive jackets + plaid skirt + white wall), time-weighted, and repairs the palette with a swap search that looks at the real pixels:
   (1) bins the pixels the palette represents badly (colour distance with the chroma doubled-ish, so a pale blue shirt next to a white pillow, or a navy wall next to a black hair, counts as DIFFERENT colours) by OKLab cell; a cell must be in >= 2 frames (or >= 10 % of them) and >= 0.6 % of the time-weighted pixels, and takes its TRUE mean colour;
   (2) a free slot takes it; a full palette gives up the plain colour that costs the picture least (never rank 1, an eye, an extra, hair, blush, vivid, gap or a tiny detail colour) but only when the new colour gains more than that colour loses;
   (3) plain colours are polished to the true mean of the pixels that belong to them (a muddy blend of two real colours is pulled back to its biggest part);
   (4) shares are recounted by nearest colour (they add up to 100 %), and each colour remembers the FRAME it was taken from (c.fi) + its spot in that frame, so a colour is never circled on a frame where it is not (an eye on a frame with the eyes closed). Eye colours look through every 192 px frame for the frame where the eye is OPEN. */
function tintPaletteMultiFrame(pal, frames, W = 96, wts, eyeFrames, eyeW = 192) {
  if (!pal || pal.length < 2 || !frames || frames.length < 2) return pal;
  const NF = frames.length, N = W * W, K = 2.1, tw = wts && wts.length === NF ? wts.map(v => Math.max(.1, v)) : frames.map(() => 1), TW = tw.reduce((s, v) => s + v, 0);
  const Lp = new Float32Array(NF * N), Ap = new Float32Array(NF * N), Bp = new Float32Array(NF * N);
  for (let f = 0; f < NF; f++) for (let p = 0; p < N; p++) { const o = p * 4, [l, a, b] = mixToLab(frames[f][o], frames[f][o + 1], frames[f][o + 2]); Lp[f * N + p] = l; Ap[f * N + p] = a; Bp[f * N + p] = b; }
  const M = NF * N, pw = new Float32Array(NF); for (let f = 0; f < NF; f++) pw[f] = tw[f] / TW / N;   // weight of ONE pixel of frame f (all pixels together = 1)
  const dist = (i, c) => { const dl = Lp[i] - c.L, da = (Ap[i] - c.a) * K, db = (Bp[i] - c.b) * K; return Math.sqrt(dl * dl + da * da + db * db); };
  const protectedC = c => c.eye || c.extra || c.hair || c.vivid || c.gap || tintPaletteIsBlush(c) || (c.share || 0) < .012;
  const nearest = list => { const nn = new Int16Array(M), d1 = new Float32Array(M), d2 = new Float32Array(M); for (let i = 0; i < M; i++) { let b1 = 9, b2 = 9, bi = 0; for (let k = 0; k < list.length; k++) { const d = dist(i, list[k]); if (d < b1) { b2 = b1; b1 = d; bi = k; } else if (d < b2) b2 = d; } nn[i] = bi; d1[i] = b1; d2[i] = b2; } return { nn, d1, d2 }; };
  const list = pal.map(c => c);
  for (let it = 0; it < 8; it++) {
    const { nn, d1, d2 } = nearest(list), bins = new Map();
    for (let i = 0; i < M; i++) { if (d1[i] <= .04) continue; const f = (i / N) | 0, key = Math.round(Lp[i] / .07) + '|' + Math.round(Ap[i] / .02) + '|' + Math.round(Bp[i] / .02); let g = bins.get(key); if (!g) bins.set(key, g = { w: 0, err: 0, l: 0, a: 0, b: 0, fr: new Set() }); const w = pw[f]; g.w += w; g.err += w * d1[i]; g.l += w * Lp[i]; g.a += w * Ap[i]; g.b += w * Bp[i]; g.fr.add(f); }
    let best = null; for (const g of bins.values()) { if (g.w < .006 || (g.fr.size < 2 && g.fr.size < .1 * NF)) continue; if (!best || g.err > best.err) best = g; }
    if (!best) break;
    const cand = { L: best.l / best.w, a: best.a / best.w, b: best.b / best.w, share: best.w, mf: true };
    let gain = 0; for (let i = 0; i < M; i++) { const d = dist(i, cand); if (d < d1[i]) gain += pw[(i / N) | 0] * (d1[i] - d); }
    if (list.length < PALN) { list.push(cand); continue; }
    const loss = new Float64Array(list.length); for (let i = 0; i < M; i++) loss[nn[i]] += pw[(i / N) | 0] * (d2[i] - d1[i]);
    let vi = -1; for (let k = 1; k < list.length; k++) if (!protectedC(list[k]) && (vi < 0 || loss[k] < loss[vi])) vi = k;
    if (vi < 0 || gain < 1.15 * loss[vi]) break;
    list[vi] = cand;
  }
  for (let it = 0; it < 2; it++) {   // (3) polish: a plain colour moves to the true mean of its own pixels
    const { nn, d1 } = nearest(list), acc = list.map(() => ({ w: 0, l: 0, a: 0, b: 0 }));
    for (let i = 0; i < M; i++) { if (d1[i] > .16) continue; const g = acc[nn[i]], w = pw[(i / N) | 0]; g.w += w; g.l += w * Lp[i]; g.a += w * Ap[i]; g.b += w * Bp[i]; }
    list.forEach((c, k) => { if (k === 0 || protectedC(c) || acc[k].w < .004) return; c.L = acc[k].l / acc[k].w; c.a = acc[k].a / acc[k].w; c.b = acc[k].b / acc[k].w; });
  }
  const { nn, d1 } = nearest(list), sh = new Float64Array(list.length);
  for (let i = 0; i < M; i++) sh[nn[i]] += pw[(i / N) | 0];
  const G = 12, cnt = list.map(() => new Float32Array(NF * G * G)), cnt2 = list.map(() => new Float32Array(NF * G * G)), BS = Math.max(1, Math.round(W / G));   // (4) where each colour really is: a 12 x 12 grid per frame (cnt = pixels that belong to the colour, cnt2 = pixels merely close to it, for a tiny detail colour)
  for (let i = 0; i < M; i++) { const f = (i / N) | 0, p = i % N, x = p % W, y = (p / W) | 0, g = f * G * G + Math.min(G - 1, (y / BS) | 0) * G + Math.min(G - 1, (x / BS) | 0); if (d1[i] <= .09) cnt[nn[i]][g]++; for (let k = 0; k < list.length; k++) if (dist(i, list[k]) <= .12) cnt2[k][g]++; }
  const smooth = (arr, f, gx, gy) => { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (x >= 0 && y >= 0 && x < G && y < G) s += arr[f * G * G + y * G + x]; } return s; };   // a 3 x 3 block of cells: the middle of the BIGGEST area of the colour, not a one-cell corner
  const info = list.map((c, k) => {   // per colour: its best 3 x 3 block in EVERY frame (score + cell), from the pixels that belong to it (or, for a tiny detail colour, the pixels merely close to it)
    let arr = cnt[k], sc = new Float32Array(NF), cell = new Int16Array(NF), top = 0;
    for (let pass = 0; pass < 2; pass++) { top = 0; for (let f = 0; f < NF; f++) { let bs = 0, bg = 0; for (let g = 0; g < G * G; g++) { const v = smooth(arr, f, g % G, (g / G) | 0); if (v > bs) { bs = v; bg = g; } } sc[f] = bs; cell[f] = bg; if (bs > top) top = bs; } if (top >= 6) break; arr = cnt2[k]; }
    return { arr, sc, cell, top };
  });
  let anchor = 0, ab = -1; for (let f = 0; f < NF; f++) { let n = 0; list.forEach((c, k) => { if (!c.eye && info[k].top >= 4 && info[k].sc[f] >= .6 * info[k].top) n++; }); if (n > ab) { ab = n; anchor = f; } }   // ONE frame shows as many colours as possible; a colour that is not (well) in it keeps its own best frame (a 2nd scene, an open eye)
  list.forEach((c, k) => {
    c.share = sh[k]; if (c.eye) return; const I = info[k];
    if (I.top < 4) { if (c.x != null) { let bm = 1e9, bf = anchor; for (let f = 0; f < NF; f++) { const x = Math.min(W - 1, Math.max(0, Math.round(c.x * W - .5))), y = Math.min(W - 1, Math.max(0, Math.round(c.y * W - .5))), dd = dist(f * N + y * W + x, c); if (dd < bm - (f === anchor ? .02 : 0)) { bm = dd; bf = f; } } c.fi = bf; } return; }
    let bf = I.sc[anchor] >= .6 * I.top ? anchor : I.sc.indexOf(I.top);
    const arr = I.arr, bg = I.cell[bf], gx0 = (bg % G) * BS - BS, gy0 = ((bg / G) | 0) * BS - BS, off = bf * N, ok = i => arr === cnt ? (nn[i] === k && d1[i] <= .09) : dist(i, c) <= .12;
    let sx = 0, sy = 0, n = 0; for (let y = Math.max(0, gy0); y < Math.min(W, gy0 + 3 * BS); y++) for (let x = Math.max(0, gx0); x < Math.min(W, gx0 + 3 * BS); x++) if (ok(off + y * W + x)) { sx += x; sy += y; n++; }
    if (n) { const mx = sx / n, my = sy / n; let bd = 1e9, px = mx, py = my; for (let y = Math.max(0, gy0); y < Math.min(W, gy0 + 3 * BS); y++) for (let x = Math.max(0, gx0); x < Math.min(W, gx0 + 3 * BS); x++) if (ok(off + y * W + x) && (x - mx) ** 2 + (y - my) ** 2 < bd) { bd = (x - mx) ** 2 + (y - my) ** 2; px = x; py = y; } c.x = (px + .5) / W; c.y = (py + .5) / W; } c.fi = bf;   // the spot is a REAL pixel of the colour (the one nearest the middle of its biggest area), never an average that lands on another colour
  });
  if (eyeFrames && eyeFrames.length === NF) list.forEach(c => {   // an eye colour: the frame whose pixels around the eye spot best match the eye hue (the frame where the eye is OPEN)
    if (!c.eye || c.x == null) return; const hu = Math.atan2(c.b, c.a) * 180 / Math.PI, S = eyeW, R = Math.max(3, Math.round(6 * S / 192)); let bf = 0, bs = -1;
    for (let f = 0; f < NF; f++) { if (c.frs && c.frs.length && !c.frs.includes(f)) continue; let s = 0; for (const [ex, ey] of c.x2 != null ? [[c.x, c.y], [c.x2, c.y2]] : [[c.x, c.y]]) { const cx = Math.round(ex * S - .5), cy = Math.round(ey * S - .5); for (let y = Math.max(0, cy - R); y <= Math.min(S - 1, cy + R); y++) for (let x = Math.max(0, cx - R); x <= Math.min(S - 1, cx + R); x++) { const o = (y * S + x) * 4, [l, a, b] = mixToLab(eyeFrames[f][o], eyeFrames[f][o + 1], eyeFrames[f][o + 2]), ch = Math.hypot(a, b); let dh = Math.abs(Math.atan2(b, a) * 180 / Math.PI - hu); if (dh > 180) dh = 360 - dh; if (ch >= .025 && dh < 35 && l > .25 && l < .85) s += ch; } } if (s > bs) { bs = s; bf = f; } }
    c.fi = bf;
  });
  list.sort((p, q) => (q.share || 0) - (p.share || 0)); list.forEach((c, i) => { c.rank = i + 1; });
  return list;
}
function tintPaletteFramePeak(pal, frames, W = 96, wts) {   // v257 (owner: pink tongue / lips missing on web47). A strongly coloured area that fills a good part of ONE frame (a tongue / lips in the last frame of a 47-frame close-up) is only a tiny share of the whole animation, so every share-based step dropped it. Rule for ANY animated picture: a coloured hue family (chroma >= .06) that fills >= 1.2 % of some kept frame and that no palette colour of that hue (gap < 22 deg, distance < .09) represents is added in its TRUE colour (mean of its most chromatic 40 %), flagged vivid + peak, standing on a real pixel of that frame (c.fi). Up to 2 per picture.
  if (!pal || !frames || frames.length < 2) return pal;
  const NF = frames.length, N = W * W, tw = wts && wts.length === NF ? wts.map(v => Math.max(.1, v)) : frames.map(() => 1), TW = tw.reduce((q, v) => q + v, 0), hue = c => (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360, hg = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
  const found = [];
  for (let f = 0; f < NF; f++) {
    const bins = Array.from({ length: 12 }, () => []);
    for (let q = 0; q < N; q++) { const o = q * 4, [l, a, b] = mixToLab(frames[f][o], frames[f][o + 1], frames[f][o + 2]), ch = Math.hypot(a, b); if (ch < .06 || l < .42 || l > .92) continue; bins[Math.floor(hue({ a, b }) / 30) % 12].push({ q, l, a, b, ch }); }
    for (let k = 0; k < 12; k++) {
      const list = bins[k].concat(bins[(k + 1) % 12].filter(() => false)); if (list.length < .012 * N) continue;
      list.sort((u, v) => v.ch - u.ch); const top = list.slice(0, Math.max(3, Math.round(list.length * .4))), m = top.reduce((o, v) => ({ L: o.L + v.l / top.length, a: o.a + v.a / top.length, b: o.b + v.b / top.length }), { L: 0, a: 0, b: 0 });
      if (pal.some(c => hg(hue(c), hue(m)) < 22 && Math.hypot(c.L - m.L, (c.a - m.a) * 1.5, (c.b - m.b) * 1.5) < .09)) continue;
      let bd = 1e9, pq = top[0].q; for (const v of top) { const d = Math.hypot(v.l - m.L, v.a - m.a, v.b - m.b); if (d < bd) { bd = d; pq = v.q; } }
      found.push({ f, size: list.length / N, c: m, q: pq, hue: hue(m) });
    }
  }
  found.sort((u, v) => v.size - u.size); const added = [];
  for (const g of found) {
    if (added.length >= 2 || added.some(z => hg(z.hue, g.hue) < 22 && Math.hypot(z.c.L - g.c.L, z.c.a - g.c.a, z.c.b - g.c.b) < .09)) continue;
    if (!tintPaletteGiveSlot(pal, .06)) break;
    let share = 0; for (let f = 0; f < NF; f++) if (f === g.f) share += tw[f] / TW * g.size;
    pal.push({ L: g.c.L, a: g.c.a, b: g.c.b, share: Math.max(.004, share), x: ((g.q % W) + .5) / W, y: (((g.q / W) | 0) + .5) / W, fi: g.f, vivid: true, peak: true }); added.push(g);
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteEyeSpot(pal, eyeFrames, S = 192) {   // v258 (owner: web47 olive eye had no circle on the eye): the eye colour is placed on the frame + spot where its iris is BIGGEST (matching pixels: same hue within 28 deg, chroma >= .06, L .45-.9, next to a dark pupil or white), the circle on the iris centre; a second iris of the same colour in that frame (level, 3+ cells away, >= 35 % of the first) gets x2 / y2. Any animated picture, nothing about one file.
  if (!pal || !eyeFrames || !eyeFrames.length) return pal;
  const c = pal.find(q => q.eye); if (!c) return pal;
  const hu = Math.atan2(c.b, c.a) * 180 / Math.PI, G = 24, BS = S / G; let best = null;
  for (let f = 0; f < eyeFrames.length; f++) {
    const cnt = new Float32Array(G * G), sx = new Float32Array(G * G), sy = new Float32Array(G * G), dk = new Float32Array(G * G), wh = new Float32Array(G * G), px = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, [l, a, b] = mixToLab(eyeFrames[f][o], eyeFrames[f][o + 1], eyeFrames[f][o + 2]), g0 = Math.floor(y / BS) * G + Math.floor(x / BS); if (l < .3) dk[g0]++; else if (l > .9 && Math.hypot(a, b) < .04) wh[g0]++; }   // an iris sits between a dark pupil / lash and the white of the eye: golden hair of the same hue has neither next to it
    const near = (arr, g) => { let n = 0; const gx = g % G, gy = (g / G) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (x >= 0 && y >= 0 && x < G && y < G) n += arr[y * G + x]; } return n; };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, [l, a, b] = mixToLab(eyeFrames[f][o], eyeFrames[f][o + 1], eyeFrames[f][o + 2]), ch = Math.hypot(a, b); let dh = Math.abs(Math.atan2(b, a) * 180 / Math.PI - hu); if (dh > 180) dh = 360 - dh; if (ch < .08 || dh > 13 || l < .45 || l > .9) continue; const g = Math.floor(y / BS) * G + Math.floor(x / BS); if (near(dk, g) < 12 || near(wh, g) < 12) continue; cnt[g]++; sx[g] += x; sy[g] += y; }
    const blk = (g) => { let n = 0, X = 0, Y = 0; const gx = g % G, gy = (g / G) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = gx + dx, y = gy + dy; if (x < 0 || y < 0 || x >= G || y >= G) continue; n += cnt[y * G + x]; X += sx[y * G + x]; Y += sy[y * G + x]; } return { n, x: n ? X / n : 0, y: n ? Y / n : 0 }; };
    let top = null; for (let g = 0; g < G * G; g++) { const r = blk(g); r.g = g; if (!top || r.n > top.n) top = r; }
    if (top && top.n > 0 && (!best || top.n > best.n)) { let sec = null; for (let g = 0; g < G * G; g++) { if (Math.abs((g % G) - (top.g % G)) < 8) continue; const r = blk(g); r.g = g; if (r.n >= .35 * top.n && (!sec || r.n > sec.n) && Math.abs(r.y - top.y) < .2 * S) sec = r; } best = { n: top.n, f, a: top, b: sec }; }
  }
  if (!best || best.n < 12) return pal;
  c.fi = best.f; c.x = Math.min(.97, Math.max(.03, best.a.x / S)); c.y = Math.min(.97, Math.max(.03, best.a.y / S));
  if (best.b) { c.x2 = Math.min(.97, Math.max(.03, best.b.x / S)); c.y2 = Math.min(.97, Math.max(.03, best.b.y / S)); } else { delete c.x2; delete c.y2; }
  return pal;
}
function tintPaletteEyeDark(pal, eyeFrames, S = 192) {   // v259 / v261 (owner: web47 "there is purple, that girl has purple eyes too" and gif156 "no mark on her eye, take it from here"). The first eye of a picture made the palette believe the eyes were done, and the eye steps never looked hard at the DARK frames, where an iris is chroma .015-.04 and only a few pixels. ANIMATED pictures only, after every other eye step. In DARK frames (mean lightness < .45) it finds (A) a PAIR: two LEVEL compact spots of a real tint (chroma .018-.12, lightness .2-.55, not warm 15-85 deg), each with a pupil clearly darker than the iris (>= 12 px) and a lighter grey highlight / eye-white (>= 6 px) within 10 px; same hue within 25 deg, <= 6 px apart in height, 25-120 px apart sideways: the two eyes of one face; and (B) a SINGLE eye (a face in profile shows one): a tiny spot (3-80 px, chroma >= .015, lightness .12-.5) with a dark lash / pupil next to it (>= 8 px clearly darker), a light highlight close (>= 3 px lighter within 5 px) and SKIN / eye-white around it (>= 30 % of the 10 px window is light and grey: a plant leaf or a wall has none). Each hue must be >= 30 deg from every eye colour the palette already has (a different face / another eye colour). The colour is the most chromatic half of the spot's pixels, chroma lifted a little (x up to 1.3 for a pair, up to 1.8 for a dull single spot), placed on THAT frame (fi) with the circle(s) (x, y, x2, y2). Flags eye + dark2 (a small soft glow in the gradient). At most one pair OR one single (a face with two eyes shows a pair; a lone spot next to a found pair is not trusted); a slot is freed by the smallest plain colour (tintPaletteGiveSlot). Returns pal.
  if (!pal || !eyeFrames || eyeFrames.length < 3) return pal;
  const hueOf = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, hd = (u, v) => { const d = Math.abs(u - v) % 360; return d > 180 ? 360 - d : d; };
  if (pal.some(c => c.eye && c.dark2)) return pal;
  const have = pal.filter(c => c.eye).map(c => hueOf(c.a, c.b));
  const N = S * S, R = Math.max(4, Math.round(10 * S / 192)), sc = S / 192; let bestPair = null, bestOne = null;
  const blobs = (mask, minPx, maxPx, maxBox) => {
    const seen = new Uint8Array(N), out = [];
    for (let q0 = 0; q0 < N; q0++) {
      if (!mask[q0] || seen[q0]) continue; const st = [q0], px = []; seen[q0] = 1; let x0 = S, x1 = 0, y0 = S, y1 = 0;
      while (st.length) { const q = st.pop(); px.push(q); const x = q % S, y = (q / S) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue; const r = ny * S + nx; if (mask[r] && !seen[r]) { seen[r] = 1; st.push(r); } } }
      const w = x1 - x0 + 1, h = y1 - y0 + 1; if (px.length < minPx || px.length > maxPx || w > maxBox || h > maxBox || px.length < .4 * w * h) continue;
      out.push({ px, cx: Math.round(px.reduce((s2, q) => s2 + (q % S), 0) / px.length), cy: Math.round(px.reduce((s2, q) => s2 + ((q / S) | 0), 0) / px.length) });
    } return out;
  };
  for (let f = 0; f < eyeFrames.length; f++) {
    const fr = eyeFrames[f], L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N), C = new Float32Array(N); let mL = 0;
    for (let q = 0; q < N; q++) { const o = q * 4, v = mixToLab(fr[o], fr[o + 1], fr[o + 2]); L[q] = v[0]; A[q] = v[1]; B[q] = v[2]; C[q] = Math.hypot(v[1], v[2]); mL += v[0]; }
    if (mL / N >= .45) continue;
    const stat = (cb) => { const px = cb.px, m0 = px.reduce((s2, q) => s2 + L[q], 0) / px.length, top = px.slice().sort((u, v) => C[v] - C[u]).slice(0, Math.max(1, px.length >> 1)); let a = 0, b = 0; for (const q of top) { a += A[q]; b += B[q]; } return { m0, a: a / top.length, b: b / top.length, l: top.reduce((s2, q) => s2 + L[q], 0) / top.length, h: hueOf(a, b), n: px.length }; };
    const win = (cb, r2, fn) => { for (let y = Math.max(0, cb.cy - r2); y <= Math.min(S - 1, cb.cy + r2); y++) for (let x = Math.max(0, cb.cx - r2); x <= Math.min(S - 1, cb.cx + r2); x++) if (Math.hypot(x - cb.cx, y - cb.cy) <= r2) fn(y * S + x); };
    // (A) a pair
    const mask = new Uint8Array(N);
    for (let q = 0; q < N; q++) { if (L[q] < .2 || L[q] > .55 || C[q] < .018 || C[q] > .12) continue; const h = hueOf(A[q], B[q]); if (h > 15 && h < 85) continue; if (have.some(e => hd(e, h) < 30)) continue; mask[q] = 1; }
    const comps = [];
    for (const cb of blobs(mask, 6 * sc * sc, 160 * sc * sc, 26 * sc)) {
      const st = stat(cb); let dk = 0, lt = 0; win(cb, R, q => { if (L[q] < st.m0 - .07) dk++; else if (L[q] > st.m0 + .02 && C[q] < .05) lt++; });   // pupil / lash = clearly darker than the iris, highlight / eye-white = lighter and grey (a night frame tops out near L .4, so the tests are relative to the iris, not fixed)
      if (dk < 12 * sc * sc || lt < 6 * sc * sc) continue; comps.push(Object.assign(cb, st));
    }
    for (const u of comps) for (const v of comps) {
      if (u.cx >= v.cx) continue; if (Math.abs(u.cy - v.cy) > 6 * sc || Math.abs(u.cx - v.cx) < 25 * sc || Math.abs(u.cx - v.cx) > 120 * sc || hd(u.h, v.h) > 25 || Math.min(u.n, v.n) < .35 * Math.max(u.n, v.n)) continue;
      const score = u.n + v.n; if (!bestPair || score > bestPair.score) bestPair = { score, f, u, v };
    }
    // (B) a single eye
    const m2 = new Uint8Array(N);
    for (let q = 0; q < N; q++) { if (L[q] < .12 || L[q] > .5 || C[q] < .015 || C[q] > .12) continue; const h = hueOf(A[q], B[q]); if (h > 15 && h < 85) continue; if (have.some(e => hd(e, h) < 30)) continue; m2[q] = 1; }
    for (const cb of blobs(m2, 3 * sc * sc, 80 * sc * sc, 14 * sc)) {
      const st = stat(cb); let dk = 0, hi = 0, skin = 0, tot = 0; win(cb, R, q => { tot++; if (L[q] >= .42 && C[q] < .05) skin++; if (L[q] < st.m0 - .07) dk++; }); win(cb, Math.max(2, Math.round(5 * sc)), q => { if (L[q] > st.m0 + .15 && C[q] < .06) hi++; });
      if (dk < 8 * sc * sc || hi < 3 * sc * sc || skin < .3 * tot) continue;
      const score = Math.min(st.n, 40 * sc * sc) * st.n ** 0 * (skin / tot) * Math.hypot(st.a, st.b); if (!bestOne || score > bestOne.score) bestOne = { score, f, c: Object.assign(cb, st) };
    }
  }
  const adds = [];
  if (bestPair) { const { u, v } = bestPair, a = (u.a * u.n + v.a * v.n) / (u.n + v.n), b = (u.b * u.n + v.b * v.n) / (u.n + v.n), l = (u.l * u.n + v.l * v.n) / (u.n + v.n), ch = Math.hypot(a, b), k = Math.min(1.3, Math.max(1, .05 / Math.max(ch, .01)));   // v259c: only a light lift, the other eye colours go up to x2.2
    adds.push({ L: l, a: a * k, b: b * k, share: Math.max(.004, ((u.n + v.n) / 2) / N), eye: true, dark2: true, fi: bestPair.f,   /* v261: the eye's real iris area (shown as at least 0.4 %), not 0.0 % */ x: (u.cx + .5) / S, y: (u.cy + .5) / S, x2: (v.cx + .5) / S, y2: (v.cy + .5) / S }); }
  if (bestOne && !bestPair) { const c = bestOne.c, h1 = hueOf(c.a, c.b); if (!adds.some(e => hd(hueOf(e.a, e.b), h1) < 30)) { const ch = Math.hypot(c.a, c.b), k = Math.min(1.8, Math.max(1, .045 / Math.max(ch, .01)));
    adds.push({ L: Math.min(.5, c.l * 1.15), a: c.a * k, b: c.b * k, share: Math.max(.004, c.n / N), eye: true, dark2: true, fi: bestOne.f,   /* v261: real iris area, at least 0.4 % */ x: (c.cx + .5) / S, y: (c.cy + .5) / S }); } }
  const freeSlot = () => { if (pal.length < PALMAX) return true; let k = -1, kc = 1e9; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.hair || q.vivid || q.extra || q.peak || tintPaletteIsBlush(q) || Math.hypot(q.a, q.b) >= .03 || (q.share || 0) >= .06) continue; let nd = 1e9; for (let j = 0; j < pal.length; j++) if (j !== i) nd = Math.min(nd, Math.hypot(q.L - pal[j].L, (q.a - pal[j].a) * 3, (q.b - pal[j].b) * 3)); const cost = (q.share || 0) * nd; if (cost < kc) { kc = cost; k = i; } } if (k >= 0 && kc < .02) { pal.splice(k, 1); return true; } return tintPaletteGiveSlot(pal, .06); };   // the most REDUNDANT near-neutral gives its slot (share x distance to its nearest neighbour, only when that costs < .02), else the old smallest-plain rule
  for (const e of adds) { if (!freeSlot()) break; const big = pal.filter(c => !c.eye && (c.share || 0) > 2 * e.share).sort((p, q) => q.share - p.share)[0]; if (big) big.share -= e.share; pal.push(e); }   /* v261: the eye's share comes off the biggest plain colour, so the shares still add up to 100 % */
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
function tintPaletteDullHue(pal, frames, W = 96, wts) {   // v260 (owner: gif156 night GIF "the blonde / brown / black hair is missing"). In a DARK scene the blonde hair is a dim khaki (L .4-.5, chroma only .015-.03), the same size as a grey: every earlier step wants chroma >= .03-.085, or counts it as a look-alike of the many near-grey shades, so a palette of 8 greys / near-blacks has no hair. ANIMATED + DARK pictures only (mean L < .4), LAST colour step. Rule (nothing about one picture): pixels with L .3-.8 and a faint but steady tint (chroma .012-.06) are binned by hue (30 deg) and lightness (.1); a bin that holds >= 2.5 % of the (time-weighted) picture and is farther than .05 from every palette colour (a / b counted x6, so a khaki is not a grey; warm / olive hues 30-140 deg only) is added in its true colour (flag hair, so the gradient draws it exact) at its densest spot, on its frame (fi). A slot comes from the most redundant NEUTRAL (chroma < .03, not rank 1 / eye / hair / vivid / extra / blush): the one with the smallest share x distance to its nearest other colour. At most 2. Returns pal.
  if (!pal || !frames || frames.length < 2) return pal;
  const NF = frames.length, N = W * W, tw = wts && wts.length === NF ? wts.map(v => Math.max(.1, v)) : frames.map(() => 1), TW = tw.reduce((q, v) => q + v, 0), hueOf = (a, b) => (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  const dist = (u, v) => Math.hypot(u.L - v.L, (u.a - v.a) * 6, (u.b - v.b) * 6);
  let mL = 0, nL = 0; for (let f = 0; f < NF; f++) for (let q = 0; q < N; q += 7) { const o = q * 4; mL += mixToLab(frames[f][o], frames[f][o + 1], frames[f][o + 2])[0] * tw[f]; nL += tw[f]; }
  if (mL / Math.max(1e-9, nL) >= .4) return pal;   // only a DARK picture (mean lightness < .4): in a bright one a khaki / skin tint is not a missing hair
  const bins = new Map();
  for (let f = 0; f < NF; f++) for (let q = 0; q < N; q++) {
    const o = q * 4, [l, a, b] = mixToLab(frames[f][o], frames[f][o + 1], frames[f][o + 2]), ch = Math.hypot(a, b); if (l < .3 || l > .8 || ch < .012 || ch > .06) continue; const hh = hueOf(a, b); if (hh < 30 || hh > 140) continue;
    const k = Math.floor(hueOf(a, b) / 30) * 100 + Math.floor(l * 10), e = bins.get(k) || { n: 0, L: 0, a: 0, b: 0, list: [] }; e.n += tw[f] / TW; e.L += l; e.a += a; e.b += b; e.list.push({ f, q }); bins.set(k, e);
  }
  const cand = []; for (const e of bins.values()) { const n = e.list.length, share = e.n / N; if (share < .025) continue; const c = { L: e.L / n, a: e.a / n, b: e.b / n }; if (pal.some(q => dist(q, c) <= .05)) continue; cand.push({ c, share, e }); }
  cand.sort((u, v) => v.share - u.share); let added = 0;
  for (const g of cand) {
    if (added >= 2) break; if (pal.some(q => dist(q, g.c) <= .05)) continue;
    if (pal.length >= PALMAX) { let k = -1, kc = 1e9; for (let i = 1; i < pal.length; i++) { const q = pal[i]; if (q.eye || q.hair || q.vivid || q.extra || q.peak || tintPaletteIsBlush(q) || Math.hypot(q.a, q.b) >= .03) continue; let nd = 1e9; for (let j = 0; j < pal.length; j++) if (j !== i) nd = Math.min(nd, dist(q, pal[j])); const cost = (q.share || 0) * nd; if (cost < kc) { kc = cost; k = i; } } if (k < 0) break; pal.splice(k, 1); }
    const cnt = new Map(); for (const v of g.e.list) cnt.set(v.f, (cnt.get(v.f) || 0) + 1); let bf = 0, bn = -1; for (const [f, n] of cnt) if (n > bn) { bn = n; bf = f; }
    const pts = g.e.list.filter(v => v.f === bf), G = 12, grid = new Float32Array(G * G); for (const v of pts) grid[Math.floor(((v.q / W) | 0) * G / W) * G + Math.floor((v.q % W) * G / W)]++; let gi = 0; for (let i = 1; i < G * G; i++) if (grid[i] > grid[gi]) gi = i;
    pal.push({ L: g.c.L, a: g.c.a, b: g.c.b, share: g.share, x: ((gi % G) + .5) / G, y: (((gi / G) | 0) + .5) / G, fi: bf, hair: true, dull: true }); added++;
  }
  pal.forEach((c, i) => { c.rank = i + 1; }); return pal;
}
/* v223+ end */
export { tintPaletteAuto, tintPaletteFlat, tintPaletteGrad, mixToLab };
