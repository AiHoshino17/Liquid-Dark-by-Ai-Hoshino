/* v288 (owner picked "Water split" from 5 previews): LANDSCAPE only. When music starts, the mini player is pulled out of the left end of the wide glass bar:
   the bar's left edge slides right (CSS width transition, v281), the mini player shows only where the bar has left it, and a thin water neck joins
   the two, gets thinner, then snaps; two little tips pull back into the ends. When music stops it runs backwards: the bar flows back over the
   mini player (kept on screen as a "leaving" ghost until the bar is wide again), two tips reach out, touch, the neck thickens and they merge.
   Pure geometry here (neckGeom, tested in Node); the small DOM driver (makeSplit) only reads rectangles and writes styles. */

export const SNAP = 14;       // px of gap at which the neck snaps (the resting gap between player and bar is 16 px, so at rest there is no neck)
export const TIP = 9;         // px: how far a tip sticks out right after the snap / right before touching
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;

/** xL = right edge of the mini player, xR = left edge of the bar, cy = shared centre line, rL / rR = half heights. tip = 0..1 (tips after a snap / before touching).
 *  Returns null (nothing to draw) or { x, y, w, h, d, rim }: a box in the same coordinates and two SVG paths in box coordinates:
 *  d = the filled water shape, rim = just its two outer curves (the glass rim line). */
export function neckGeom(xL, xR, cy, rL, rR, tip = 0, snap = SNAP) {
  if (![xL, xR, cy, rL, rR].every(Number.isFinite) || rL <= 0 || rR <= 0) return null;
  const gap = xR - xL, rm = Math.min(rL, rR), cxL = xL - rL, cxR = xR + rR, top = cy - Math.max(rL, rR), H = 2 * Math.max(rL, rR);
  const box = { x: r1(cxL), y: r1(top), w: r1(cxR - cxL), h: r1(H) }, X = v => r1(v - box.x), Y = v => r1(v - box.y);
  if (gap >= 0 && gap < snap) {                                     // joined: a waist that gets thinner as the gap grows
    const k = gap / snap, waist = 2 * rm * .9 * Math.pow(1 - k, .75), th = (68 - 38 * k) * Math.PI / 180;
    const lt = [cxL + rL * Math.cos(th), cy - rL * Math.sin(th)], lb = [lt[0], cy + rL * Math.sin(th)];
    const rt = [cxR - rR * Math.cos(th), cy - rR * Math.sin(th)], rb = [rt[0], cy + rR * Math.sin(th)];
    const mx = (lt[0] + rt[0]) / 2, ct = (4 * (cy - waist / 2) - lt[1] - rt[1]) / 2, cb = (4 * (cy + waist / 2) - lb[1] - rb[1]) / 2;
    const P = p => `${X(p[0])} ${Y(p[1])}`;
    const d = `M${P(lt)}Q${X(mx)} ${Y(ct)} ${P(rt)}A${r1(rR)} ${r1(rR)} 0 0 0 ${P(rb)}Q${X(mx)} ${Y(cb)} ${P(lb)}A${r1(rL)} ${r1(rL)} 0 0 0 ${P(lt)}Z`;
    const rim = `M${P(lt)}Q${X(mx)} ${Y(ct)} ${P(rt)}M${P(rb)}Q${X(mx)} ${Y(cb)} ${P(lb)}`;
    return { ...box, d, rim, gap, joined: true };
  }
  const t = cl(tip); if (gap < 0 || t <= .02) return null;          // overlapping (the bar covers the player) or apart with no tips
  const len = TIP * t, ph = 32 * Math.PI / 180, P = (x, y) => `${X(x)} ${Y(y)}`;
  const la = [cxL + rL * Math.cos(ph), cy - rL * Math.sin(ph)], ra = [cxR - rR * Math.cos(ph), cy - rR * Math.sin(ph)];
  const tipL = `M${P(la[0], la[1])}Q${P(xL + len * 1.25, cy)} ${P(la[0], cy + rL * Math.sin(ph))}A${r1(rL)} ${r1(rL)} 0 0 0 ${P(la[0], la[1])}Z`;
  const tipR = `M${P(ra[0], ra[1])}A${r1(rR)} ${r1(rR)} 0 0 0 ${P(ra[0], cy + rR * Math.sin(ph))}Q${P(xR - len * 1.25, cy)} ${P(ra[0], ra[1])}Z`;
  const rim = `M${P(la[0], la[1])}Q${P(xL + len * 1.25, cy)} ${P(la[0], cy + rL * Math.sin(ph))}M${P(ra[0], cy + rR * Math.sin(ph))}Q${P(xR - len * 1.25, cy)} ${P(ra[0], ra[1])}`;
  return { ...box, d: tipL + tipR, rim, gap, joined: false };
}

/** How much of the mini player is uncovered by the bar (0..1) -> how visible its cover / title / buttons are (they appear late, like the preview). */
export const contentOpacity = (miniLeft, miniWidth, barLeft) => { const v = cl((barLeft - miniLeft) / Math.max(1, miniWidth)); return r1(cl((v - .55) / .45)) };

/** Tips: after a snap they pull back over `ms`; while merging they grow as the gap closes to SNAP. */
export function tipAmount(gap, dir, msSinceSnap, ms) {
  if (gap < SNAP) return 0;
  if (dir > 0) return msSinceSnap < ms ? cl(1 - msSinceSnap / ms) : 0;   // splitting
  return cl(1 - (gap - SNAP) / 14);                                      // merging: reach out over the last 14 px
}

/** DOM driver. env: { app, bar: () => element, host: #mini, land: () => bool, reduced: () => bool, durK: () => number } */
export function makeSplit(env) {
  const NS = 'http://www.w3.org/2000/svg';
  let svg = null, fill = null, rim = null, raf = 0, until = 0, dir = 0, lastGap = null, snapAt = -1e9;
  const ensure = () => {
    if (svg && svg.isConnected) return;
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'lneck'); svg.setAttribute('aria-hidden', 'true');
    fill = document.createElementNS(NS, 'path'); fill.setAttribute('class', 'lneck-f');
    rim = document.createElementNS(NS, 'path'); rim.setAttribute('class', 'lneck-r');
    svg.append(fill, rim); env.app.appendChild(svg);
  };
  const clear = () => {
    if (svg) svg.style.display = 'none';
    env.host.querySelectorAll('.mini').forEach(m => { m.style.clipPath = ''; m.style.removeProperty('--lsop'); m.classList.remove('lsplit'); });
  };
  const frame = now => {
    raf = 0;
    const bar = env.bar(), mini = env.host.querySelector('.mini');
    if (!bar || !mini || !env.land()) { clear(); env.app.classList.remove('lmerge'); return; }
    const a = env.app.getBoundingClientRect(), b = bar.getBoundingClientRect(), m = mini.getBoundingClientRect();
    const xL = m.right - a.left, xR = b.left - a.left, cy = (m.top + m.bottom) / 2 - a.top, gap = xR - xL;
    if (lastGap != null && lastGap < SNAP && gap >= SNAP && dir > 0) snapAt = now;
    lastGap = gap;
    mini.classList.add('lsplit');
    const cover = Math.max(0, m.right - b.left);
    mini.style.clipPath = cover > 0 ? `inset(-12px ${Math.min(m.width, cover)}px -12px -12px)` : '';
    mini.style.setProperty('--lsop', contentOpacity(m.left, m.width, b.left));
    const g = neckGeom(xL, xR, cy, m.height / 2, b.height / 2, tipAmount(gap, dir, now - snapAt, 260 * env.durK()));
    ensure();
    if (g) {
      svg.style.display = ''; svg.style.left = g.x + 'px'; svg.style.top = g.y + 'px'; svg.style.width = g.w + 'px'; svg.style.height = g.h + 'px';   /* style, not attributes: the app's global svg rule (24 x 24) would win over attributes */
      svg.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`); fill.setAttribute('d', g.d); rim.setAttribute('d', g.rim);
    } else svg.style.display = 'none';
    if (now < until) raf = requestAnimationFrame(frame); else { clear(); lastGap = null; env.app.classList.remove('lmerge'); }
  };
  return {
    /** d = +1 music started (split), -1 music stopped (merge). */
    run(d) {
      if (!env.land() || env.reduced()) { clear(); return false; }
      dir = d; snapAt = -1e9; env.app.classList.toggle('lmerge', d < 0); /* merging: the bar starts slowly so the tips and the neck have time to show */ lastGap = null; until = performance.now() + (450 * env.durK() + 380);
      if (!raf) raf = requestAnimationFrame(frame);
      return true;
    },
    ms: () => 450 * env.durK() + 60,
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; until = 0; clear(); env.app.classList.remove('lmerge'); },
  };
}
