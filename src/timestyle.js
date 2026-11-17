/* v208+: "Playing bar time" setting (Settings > Display options).
   The two times under the Now Playing bar. The left one is always the time played; the right one is the choice.
     left  : 1:40            -1:54   (time left, the original look)
     total : 1:40             3:34   (whole song length)
   Owner's order: only these two. An older saved 'both' (a short-lived YouTube style) falls back to 'left'. */
import { mmss } from './data.js';

export const TIME_STYLE_DEF = 'left';
export const TIME_STYLES = {
  left: 'Time left (-1:54)',
  total: 'Song length (3:34)',
};
export const cleanTimeStyle = v => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(TIME_STYLES, v)) ? v : TIME_STYLE_DEF;

/** Texts for the left and right time, plus the plain "played of total" sentence for screen readers. */
export function timeTexts(pos, dur, style) {
  const d = Number.isFinite(dur) && dur > 0 ? dur : 0;
  const p = Math.min(d, Math.max(0, Number.isFinite(pos) ? pos : 0));
  const played = mmss(p), total = mmss(d), s = cleanTimeStyle(style);
  const tr = s === 'total' ? total : '-' + mmss(Math.max(0, d - p));
  return { tl: played, tr, played, total, aria: played + ' of ' + total };
}
