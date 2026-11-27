/* v289 (owner: "it's not like splitting and merging, it looks like it's just appearing"): LANDSCAPE glass bar <-> mini player, rebuilt.
   The whole move is now driven here, frame by frame (the CSS width slide is switched off while it runs), so the two pieces really come out of ONE shape:
   at the start the mini player and the bar touch and a full-height water bridge fills the space between them (it looks like the one wide bar),
   then they pull apart, the bridge thins to a neck, stretches and SNAPS, and the two ends spring back. Merging is the same backwards: two tips reach out,
   touch, the neck fattens until it is one bar again. Four styles (owner chooses): cell, stretch, drip, jelly.
   Pure parts (bridgePath, tipPath, timeline) are tested in Node; makeSplit only reads rectangles and writes styles. */

export const STYLES = ['cell', 'stretch', 'drip', 'jelly'];
export const SPLIT_NAMES = { cell: 'Cell split: pulls apart, a water neck snaps', stretch: 'Long stretch: a long water neck, then a big snap', drip: 'Drip: a drop swells out of the bar and lets go', jelly: 'Jelly pop: no water, a springy squish and pop', off: 'Off: a plain slide' };
/** Settings > Animation > Landscape mini player: { style, stretch 50..200 %, speed 50..200 % }. Anything broken falls back to the default. */
export const BS_DEF = { style: 'cell', stretch: 100, speed: 100, hide: 8, playHide: 0 };   // v318 (owner): playHide = seconds before it hides WHILE a song plays; 0 = never (default). v318b: a custom time (was on / off)
export const HIDE_OPTS = [0, 2, 5, 8, 15, 30, 60];   // v316: 2 s chip added (shortest)
// was:   // v291 / v292: quick picks (seconds) for how long the landscape mini player waits for a touch before it merges back into the bar (0 = never)
/* v292 (owner: "custom time for the disappearing of the mini player, never and any time from seconds to minutes"): any time from 3 s to 10 min (v316: from 2 s).
   The slider walks these steps: 3-60 s by 1 s, then by 5 s to 2 min, by 15 s to 5 min, by 30 s to 10 min. */
export const HIDE_MIN = 2, HIDE_MAX = 600;   // v316 (owner): the landscape mini player can hide after as little as 2 s
export const HIDE_STEPS = (() => { const a = []; for (let v = HIDE_MIN; v <= 60; v++) a.push(v); for (let v = 65; v <= 120; v += 5) a.push(v); for (let v = 135; v <= 300; v += 15) a.push(v); for (let v = 330; v <= 600; v += 30) a.push(v); return a; })();
/** Slider position of a time: the nearest step. */
export const hideStepOf = (sec, steps = HIDE_STEPS) => { let best = 0; steps.forEach((v, i) => { if (Math.abs(v - sec) < Math.abs(steps[best] - sec)) best = i; }); return best; };
/** v316 (owner): the top-right Settings button never hides sooner than 6 s. */
export const GEAR_MIN = 6, GEAR_STEPS = HIDE_STEPS.filter(v => v >= GEAR_MIN);
/** 0 -> "Never", 8 -> "8 s", 60 -> "1 min", 90 -> "1 min 30 s". */
export const fmtHide = sec => { sec = Math.round(+sec || 0); if (!sec) return 'Never'; if (sec < 60) return `${sec} s`; const m = Math.floor(sec / 60), r = sec % 60; return r ? `${m} min ${r} s` : `${m} min`; };
const cleanHide = h => { const n = typeof h === 'number' ? h : typeof h === 'string' && h.trim() !== '' ? +h : NaN; if (!Number.isFinite(n)) return BS_DEF.hide; const r = Math.round(n); return r === 0 ? 0 : r < 0 ? BS_DEF.hide : Math.max(HIDE_MIN, Math.min(HIDE_MAX, r)); };   // 0 = Never; a broken value = the default 8 s
/** v318b: 0 / missing / false = never while playing; true (v318 switch) = the Hide after time; a number = 2 s ... 10 min like Hide after. */
const cleanPlayHide = (p, hide) => { if (p === true) return hide === undefined ? BS_DEF.hide : cleanHide(hide) || BS_DEF.hide; if (p == null || p === false) return 0; const n = typeof p === 'number' ? p : typeof p === 'string' && p.trim() !== '' ? +p : NaN; return Number.isFinite(n) && n > 0 ? cleanHide(n) : 0; };
export function cleanBarSplit(o) {
  const v = o && typeof o === 'object' ? o : {}, num = (x, d) => { const n = Math.round(+x); return Number.isFinite(n) ? Math.max(50, Math.min(200, n)) : d; };
  return { style: STYLES.includes(v.style) || v.style === 'off' ? v.style : BS_DEF.style, stretch: num(v.stretch, 100), speed: num(v.speed, 100), hide: v.hide === undefined ? BS_DEF.hide : cleanHide(v.hide), playHide: cleanPlayHide(v.playHide, v.hide) };
}
export const REST_GAP = 16;                                   // px between player and bar at rest (CSS: 50% - 8 px each)
const K = .5523;                                              // cubic Bezier circle constant
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const r1 = v => Math.round(v * 10) / 10;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const bump = (p, end) => Math.pow(Math.sin(Math.PI * cl(p / end)), 2);

/** The water bridge between the player's right end (xa, half height ra) and the bar's left end (xb, half height rb), centre line cy.
 *  wn = 1: a full-height bridge (with both round ends hidden it reads as one bar); wn -> 0: the ends become round again and the neck between them thins to nothing.
 *  Returns { d: filled shape, rim: top and bottom outline } in page coordinates. */
export function bridgePath(xa, xb, cy, ra, rb, wn) {
  const s = 1 - cl(wn), cxa = xa - ra, cxb = xb + rb, mx = (xa + xb) / 2, w = cl(wn) * Math.min(ra, rb) * 2;
  const half = sg => {   // sg = -1 top, +1 bottom
    const ya = cy + sg * ra, yb = cy + sg * rb, ym = cy + sg * w / 2;
    const c1 = [lerp(cxa + (mx - cxa) / 3, cxa + K * ra, s), ya], c2 = [lerp(cxa + 2 * (mx - cxa) / 3, xa, s), lerp(ya, cy + sg * K * ra, s)];
    const c3 = [lerp(cxb - 2 * (cxb - mx) / 3, xb, s), lerp(yb, cy + sg * K * rb, s)], c4 = [lerp(cxb - (cxb - mx) / 3, cxb - K * rb, s), yb];
    return { a: [cxa, ya], b: [cxb, yb], seg: `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(mx)} ${r1(ym)}C${r1(c3[0])} ${r1(c3[1])} ${r1(c4[0])} ${r1(c4[1])} ${r1(cxb)} ${r1(yb)}`,
      rev: `C${r1(c4[0])} ${r1(c4[1])} ${r1(c3[0])} ${r1(c3[1])} ${r1(mx)} ${r1(ym)}C${r1(c2[0])} ${r1(c2[1])} ${r1(c1[0])} ${r1(c1[1])} ${r1(cxa)} ${r1(ya)}` };
  };
  const T = half(-1), B = half(1), P = p => `${r1(p[0])} ${r1(p[1])}`;
  return { d: `M${P(T.a)}${T.seg}L${P(B.b)}${B.rev}Z`, rim: `M${P(T.a)}${T.seg}M${P(B.b)}${B.rev}` };
}

/** Two little tips sticking out of the round ends (len px each): right after a snap they pull back, before touching they reach out. */
export function tipPath(xa, xb, cy, ra, rb, len) {
  if (!(len > .3)) return null;
  const ph = 34 * Math.PI / 180, P = (x, y) => `${r1(x)} ${r1(y)}`;
  const ax = xa - ra + ra * Math.cos(ph), at = cy - ra * Math.sin(ph), ab = cy + ra * Math.sin(ph);
  const bx = xb + rb - rb * Math.cos(ph), bt = cy - rb * Math.sin(ph), bb = cy + rb * Math.sin(ph);
  const L = `M${P(ax, at)}Q${P(xa + 2 * len, cy)} ${P(ax, ab)}`, R = `M${P(bx, bb)}Q${P(xb - 2 * len, cy)} ${P(bx, bt)}`;
  return { d: `${L}A${r1(ra)} ${r1(ra)} 0 0 0 ${P(ax, at)}Z${R}A${r1(rb)} ${r1(rb)} 0 0 0 ${P(bx, bb)}Z`, rim: L + R };
}

/** One frame of a style. p = 0..1 through the move, dir = +1 split (music starts), -1 merge (music stops).
 *  Returns { g: gap between player and bar (px), bl: bar left override (px from xL) or null, mdx, msx, msy (player transform), op (player content), wn (bridge, null = apart), tip (px), bsy (bar squash) }. */
export function timeline(style, p, dir, wide, sk = 1) {
  p = cl(p);
  if (style === 'jelly') {                                    // no water: the bar springs short with a jelly squish, the player pops in
    const e = dir > 0 ? back(p) : 1 - easeInOut(p);
    const w = Math.sin(Math.PI * 3 * p) * (1 - p) * .1;
    return { g: REST_GAP, bl: lerp(-wide, REST_GAP, e), mdx: 0, msx: cl(e, 0, 1.04), msy: cl(e, 0, 1.06), op: cl((e - .5) / .4), wn: null, tip: 0, bsy: 1 + w };
  }
  const c0 = style === 'stretch' ? { pk: 48, snap: 40, end: .8 } : style === 'drip' ? { pk: 22, snap: 20, end: .75 } : { pk: 20, snap: 22, end: .72 };
  const cfg = { ...c0, pk: c0.pk * sk, snap: Math.max(REST_GAP + 3, c0.snap * sk) };   // Stretch slider: a longer / shorter neck
  if (dir > 0) {
    if (style === 'drip') {                                   // a drop forms at the bar's left end as the bar slides back, swells into the player, then lets go
      const a = cl(p / .4), b = cl((p - .4) / .6), sx = a < 1 ? lerp(.14, .5, easeOut(a)) : lerp(.5, 1, back(b) > 1 ? 1 + (back(b) - 1) * .5 : back(b));
      const g = a < 1 ? 0 : REST_GAP * easeOut(b) + cfg.pk * bump(b, cfg.end);
      return { g, bl: a < 1 ? lerp(-wide, 0, easeInOut(a)) : null, mdx: 0, msx: sx, msy: lerp(.78, 1, cl(sx)), op: cl((b - .35) / .4), wn: b > .6 && g < cfg.snap ? -1 : Math.min(.6, 1 - g / cfg.snap), snap: cfg.snap, tip: 0, bsy: 1 };
    }
    const g = REST_GAP * easeInOut(p) + cfg.pk * bump(p, cfg.end) + 1.5 * Math.sin(Math.PI * 4 * p) * (p > cfg.end ? (1 - p) * 4 : 0);
    return { g, bl: null, mdx: style === 'stretch' ? -.25 * cfg.pk * bump(p, cfg.end) : 0, msx: 1, msy: 1, op: cl((p - .3) / .45), wn: p >= cfg.end * .7 && g < cfg.snap && g >= REST_GAP * .9 && p > .5 ? -1 : 1 - g / cfg.snap, snap: cfg.snap, tip: 0, bsy: 1 };
  }
  // merge: tips reach out, touch, the neck fattens into one bar
  const a = cl(p / .45), b = cl((p - .45) / .55), g = REST_GAP * (1 - easeInOut(a));
  return { g, bl: null, mdx: 0, msx: 1, msy: 1, op: cl(1 - p / .3), wn: a < 1 ? null : lerp(.06, 1, easeOut(b)), tip: a < 1 ? Math.min(g / 2, 5) * easeInOut(a) : 0, bsy: 1, snap: 0 };
}

/** DOM driver. env: { app, bar: () => element, host: #mini, land: () => bool, reduced: () => bool, durK: () => number, cfg: () => cleanBarSplit(...) } */
export function makeSplit(env) {
  const NS = 'http://www.w3.org/2000/svg';
  let svg = null, fill = null, rim = null, raf = 0, job = null;
  const ensure = () => {
    if (svg && svg.isConnected) return;
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'lneck'); svg.setAttribute('aria-hidden', 'true');
    fill = document.createElementNS(NS, 'path'); fill.setAttribute('class', 'lneck-f'); rim = document.createElementNS(NS, 'path'); rim.setAttribute('class', 'lneck-r');
    svg.append(fill, rim); env.app.appendChild(svg);
  };
  const reset = () => {
    if (svg) svg.style.display = 'none';
    const bar = env.bar(); if (bar) ['transition', 'width', 'clipPath', 'transform'].forEach(k => { bar.style[k] = ''; });
    env.host.querySelectorAll('.mini').forEach(m => { ['clipPath', 'transform', 'transformOrigin', 'transition'].forEach(k => { m.style[k] = ''; }); m.style.removeProperty('--lsop'); m.classList.remove('lsplit'); });
  };
  const frame = now => {
    raf = 0; const j = job; if (!j) return;
    if (j.first) { const f = j.first; j.first = null; try { f(); } catch {} }   // v291: e.g. drop the "just turned sideways" hold class in the same frame the first shape is drawn
    const bar = env.bar(), mini = env.host.querySelector('.mini:not(.away)');
    if (!bar || !mini || !env.land()) { const done = j.done; job = null; reset(); if (done) { try { done(); } catch {} } return; }
    const p = cl((now - j.t0) / j.ms), f = timeline(j.style, p, j.dir, j.wide, j.sk);
    const { xL, barR, cy, rL, rR, a } = j;
    // the bar: its left edge (the gap after the player, or an override), its squash
    const bl = xL + (f.bl != null ? f.bl : f.g);
    bar.style.transition = 'none'; bar.style.width = Math.max(2 * rR, barR - bl) + 'px'; bar.style.transform = f.bsy !== 1 ? `scaleY(${r1(f.bsy * 100) / 100})` : '';
    // the player: grows / moves from its right end
    mini.classList.add('lsplit'); mini.style.transition = 'none'; mini.style.transformOrigin = j.style === 'jelly' ? '50% 50%' : '100% 50%';
    const mdx = f.bl != null && j.style === 'drip' ? bl - xL : f.mdx;
    mini.style.transform = `translateX(${r1(mdx)}px) scale(${r1(f.msx * 1000) / 1000},${r1(f.msy * 1000) / 1000})`;
    mini.style.setProperty('--lsop', r1(f.op));
    // water: joined (a bridge) until the gap reaches the snap distance; then two tips spring back
    const xa = xL + mdx, xb = bl, ra = rL * f.msy, rb = rR;
    let joined = f.wn != null && f.wn > 0 && !(j.dir > 0 && j.snapped);
    if (j.dir > 0 && f.wn != null && f.wn <= 0 && !j.snapped) { j.snapped = now; j.snapGap = f.g; }
    if (j.dir > 0 && j.snapped) joined = false;
    let shape = null;
    if (joined) shape = bridgePath(xa, xb, cy, ra, rb, f.wn);
    else { const len = j.dir > 0 && j.snapped ? (j.snapGap / 3.2) * Math.pow(Math.max(0, 1 - (now - j.snapped) / (200 * j.k)), 1.5) : f.tip; shape = tipPath(xa, xb, cy, ra, rb, len); }
    mini.style.clipPath = joined ? `inset(-14px ${r1(rL)}px -14px -14px)` : '';
    bar.style.clipPath = joined ? `inset(-60px -60px -60px ${r1(rR)}px)` : '';
    ensure();
    if (shape) {
      svg.style.display = ''; svg.style.left = (-a.left) + 'px'; svg.style.top = (-a.top) + 'px'; svg.style.width = innerWidth + 'px'; svg.style.height = innerHeight + 'px';   // style, not attributes: the app's global svg rule (24 x 24) would win
      svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`); fill.setAttribute('d', shape.d); rim.setAttribute('d', shape.rim);
    } else svg.style.display = 'none';
    if (p < 1) raf = requestAnimationFrame(frame);
    else { const done = j.done; job = null; reset(); if (done) done(); }
  };
  return {
    /** d = +1 music started (split), -1 music stopped (merge). done() runs at the end (merge: remove the ghost). Returns false when there is no animation. */
    run(d, done, opts = {}) {
      const c = cleanBarSplit(env.cfg && env.cfg());
      if (job && job.done) { const f = job.done; job.done = null; try { f(); } catch {} }
      if (raf) cancelAnimationFrame(raf); raf = 0; job = null; reset();
      if (!env.land() || env.reduced() || c.style === 'off') { if (opts.first) { try { opts.first(); } catch {} } return false; }
      const bar = env.bar(), mini = env.host.querySelector('.mini:not(.away)'); if (!bar || !mini) { if (opts.first) { try { opts.first(); } catch {} } return false; }
      const a = env.app.getBoundingClientRect(), m = mini.getBoundingClientRect(), b = bar.getBoundingClientRect(), k = env.durK() * 100 / c.speed;
      bar.style.transition = 'none'; bar.style.width = b.width + 'px';   // hold the bar where it is: from here on this code moves it, not the CSS slide
      const xL = m.right - a.left, wide = m.width;   // the bar starts / ends at the player's left edge (the wide bar)
      job = { first: opts.first || null, dir: d, style: c.style, sk: c.stretch / 100, t0: performance.now() + (+opts.delay || 0), ms: (c.style === 'stretch' ? 1300 : c.style === 'jelly' ? 700 : 1050) * k, k, xL, barR: b.right - a.left, cy: (m.top + m.bottom) / 2 - a.top, rL: m.height / 2, rR: b.height / 2, a: { left: 0, top: 0 }, wide, snapped: 0, done };
      raf = requestAnimationFrame(frame);
      return true;
    },
    ms: () => job ? job.ms + 80 : 0,
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; job = null; reset(); },
  };
}
