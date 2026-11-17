// v119: Lyrics animation. Every value is a percent the user sets in Settings > Lyrics > Lyrics animation. The defaults are the built-in feel.
export const LYA_DEFS = [
  { k: 'glide', label: 'Glide speed', hint: 'How long a line takes to slide up. Lower = quicker, higher = slower and softer.', min: 30, max: 250, def: 100 },
  { k: 'fade', label: 'Fade speed', hint: 'How fast a line turns bright / dim.', min: 30, max: 250, def: 100 },
  { k: 'zoom', label: 'Playing line size', hint: 'How much the line that is playing grows.', min: 90, max: 125, def: 102 },
  { k: 'small', label: 'Other lines size', hint: 'How small the lines that are not playing are.', min: 80, max: 100, def: 94 },
  { k: 'dim', label: 'Other lines brightness', hint: 'How bright the lines that are not playing are.', min: 10, max: 100, def: 58 },
  { k: 'blur', label: 'Blur on far lines', hint: 'Lines get blurrier the further they are from the playing line. 0 = no blur.', min: 0, max: 200, def: 0 },
  { k: 'anchor', label: 'Playing line height', hint: 'Where the playing line rests on the screen. Low = near the top.', min: 5, max: 50, def: 16 },
  { k: 'stagger', label: 'Line-by-line ripple', hint: 'Lines below the playing one start sliding a tiny bit after each other (the Apple Music wave). 0 = every line moves together.', min: 0, max: 250, def: 100 },
  { k: 'soft', label: 'Glide softness', hint: 'Shape of the slide. Low = fast start and a quick stop, high = soft start and a long, gentle landing. Never overshoots or bounces.', min: 0, max: 100, def: 70 },
  { k: 'lead', label: 'Early start', hint: 'The next line starts to glide this much before its time stamp, so it is already there when the singer starts. 0 = exactly on the time stamp.', min: 0, max: 200, def: 25 },
  { k: 'gap', label: 'Space between lines', hint: 'Gap between two lyric lines.', min: 40, max: 180, def: 100 },
  { k: 'bgmove', label: 'Background motion', hint: 'How much the soft light behind the lyrics (Album cover colour style) drifts. 0 = the background stays completely still.', min: 0, max: 200, def: 100 },
];
const D = Object.fromEntries(LYA_DEFS.map(d => [d.k, d.def]));
export const LYA_PRESETS = {
  default: { ...D },
  smooth: { ...D, glide: 170, fade: 150, stagger: 140, soft: 90, lead: 40 },
  spotify: { ...D, glide: 90, fade: 90, zoom: 100, small: 100, dim: 40, stagger: 0, soft: 60, lead: 0, anchor: 30 },
  snappy: { ...D, glide: 55, fade: 60, stagger: 0, soft: 20, lead: 0 },
  blurry: { ...D, glide: 120, zoom: 105, small: 92, dim: 45, blur: 100 },
  still: { ...D, glide: 30, fade: 30, zoom: 100, small: 100, stagger: 0, bgmove: 0 },
};
export const cleanLya = o => { const r = {}; for (const d of LYA_DEFS) { const v = o && o[d.k] != null && o[d.k] !== '' && typeof o[d.k] !== 'boolean' && !Array.isArray(o[d.k]) ? Number(o[d.k]) : NaN; r[d.k] = Number.isFinite(v) ? Math.max(d.min, Math.min(d.max, v)) : d.def; } return r; };
// CSS variables the lyrics styles read (see app.css, "Apple Music style lyrics")
export const lyaVars = o => { const c = cleanLya(o); return {
  '--ly-glide': (c.glide / 100).toFixed(2), '--ly-fade': (c.fade / 100).toFixed(2), '--ly-zoom': (c.zoom / 100).toFixed(3), '--ly-small': (c.small / 100).toFixed(3),
  '--ly-op': (c.dim / 100).toFixed(2), '--ly-blur': (c.blur / 100 * .5).toFixed(2) + 'px',
  '--ly-ease': lyEase(c.soft), '--ly-gap': (c.gap / 100).toFixed(2), '--ly-bg': (c.bgmove / 100).toFixed(2) }; };
// the glide curve: ease-out-ish (low) to a soft ease-in-out (high). The last control point is (.2, 1): the line settles and never overshoots.
export const lyEase = soft => { const k = Math.max(0, Math.min(100, Number(soft))) / 100; return `cubic-bezier(${(.1 + .3 * k).toFixed(3)}, ${(.9 - .9 * k).toFixed(3)}, .2, 1)`; };
// milliseconds helpers used by main.js
export const lyStaggerMs = o => cleanLya(o).stagger * .45;   // 100% = 45 ms between neighbouring lines
export const lyLeadSec = o => cleanLya(o).lead * .01;        // 25% = 0.25 s early

