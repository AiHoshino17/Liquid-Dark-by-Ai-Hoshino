// v224: customizable tab bar. Settings > Tab bar: each icon of the glass bar can be kept or removed, and a Settings icon can be added as a fifth one
// (drag the glass pill onto it and let go to open Settings). PURE: tested in Node (tests/tabbar-v224.test.mjs).
/** Every icon the bar can hold, in bar order: [key, label]. */
export const TAB_DEFS = [['home', 'Home'], ['albums', 'Albums'], ['library', 'Library'], ['search', 'Search'], ['settings', 'Settings']];
/** The four icons that open a page of the app. At least one of them always stays on (the Settings icon alone would leave no page to show). */
export const PAGE_TABS = ['home', 'albums', 'library', 'search'];
export const DEF_TABS = { home: true, albums: true, library: true, search: true, settings: false };
/** A saved value (missing, corrupt, imported from an older file) -> a full { home, albums, library, search, settings } of booleans with at least one page icon on. */
export function cleanTabs(o) {
  const src = o && typeof o === 'object' && !Array.isArray(o) ? o : {}, r = {};
  for (const [k] of TAB_DEFS) r[k] = typeof src[k] === 'boolean' ? src[k] : DEF_TABS[k];
  if (!PAGE_TABS.some(k => r[k])) r.home = true;
  return r;
}
/** v284 (owner: "give options to customize the positions of the icons"): the icons' order, left to right. A saved value (missing, corrupt, imported) -> every TAB_DEFS key exactly once: known keys keep their saved place, unknown / repeated ones are dropped, missing ones are added at the end in the default order. */
export const DEF_ORDER = TAB_DEFS.map(([k]) => k);
export function cleanTabOrder(a) {
  const out = []; if (Array.isArray(a)) for (const k of a) if (typeof k === 'string' && DEF_ORDER.includes(k) && !out.includes(k)) out.push(k);
  for (const k of DEF_ORDER) if (!out.includes(k)) out.push(k);
  return out;
}
/** Move one icon one place left (dir -1) or right (dir +1) in the order. Returns { order, ok }: ok is false at either end or for an unknown key. Never mutates the input. */
export function moveTab(a, k, dir) {
  const o = cleanTabOrder(a), i = o.indexOf(k), j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= o.length) return { order: o, ok: false };
  const n = o.slice(); [n[i], n[j]] = [n[j], n[i]]; return { order: n, ok: true };
}
/** The bar's icons for a setting, in the chosen order (default: bar order). */
export const visibleTabs = (o, order) => { const c = cleanTabs(o), lab = Object.fromEntries(TAB_DEFS); return cleanTabOrder(order).filter(k => c[k]).map(k => [k, lab[k]]); };
/** Flip one icon. Returns { tabs, ok }: ok is false (and nothing changes) when it would remove the last page icon or the key is unknown. */
export function toggleTab(o, k) {
  const c = cleanTabs(o); if (!TAB_DEFS.some(([x]) => x === k)) return { tabs: c, ok: false };
  const n = { ...c, [k]: !c[k] }; if (!PAGE_TABS.some(x => n[x])) return { tabs: c, ok: false };
  return { tabs: n, ok: true };
}
