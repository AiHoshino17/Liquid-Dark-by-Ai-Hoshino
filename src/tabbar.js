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
/** The bar's icons for a setting, in bar order. */
export const visibleTabs = o => { const c = cleanTabs(o); return TAB_DEFS.filter(([k]) => c[k]); };
/** Flip one icon. Returns { tabs, ok }: ok is false (and nothing changes) when it would remove the last page icon or the key is unknown. */
export function toggleTab(o, k) {
  const c = cleanTabs(o); if (!TAB_DEFS.some(([x]) => x === k)) return { tabs: c, ok: false };
  const n = { ...c, [k]: !c[k] }; if (!PAGE_TABS.some(x => n[x])) return { tabs: c, ok: false };
  return { tabs: n, ok: true };
}
