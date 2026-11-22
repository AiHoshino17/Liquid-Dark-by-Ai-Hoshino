/* v290: the cover colour palette is worked out HERE, off the app's main thread (it can take seconds for a long GIF: the app froze, lyrics did not open).
   Same functions as before (src/palcore.js), same input, same result: { id, pal, grad } back to src/main.js palAsync. */
import { tintPaletteAuto, tintPaletteGrad } from './palcore.js';
self.onmessage = e => {
  const { id, px, hi, fw } = e.data || {};
  let pal = null, grad = '', err = '';
  try { const d = px; if (hi) d.hi = hi; if (fw) d.fw = fw; pal = tintPaletteAuto(d); } catch (x) { err = String(x && x.message || x); }
  try { if (pal && pal.length) grad = tintPaletteGrad(pal); } catch (x) { err = err || String(x && x.message || x); }
  self.postMessage({ id, pal, grad, err });
};
