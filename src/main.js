import { applyA11y, rowLabel } from './a11y.js';
import { logLine, buildReport, copyText } from './log.js';
import './styles/tokens.css';
import './styles/app.css';
import { TIME_STYLES, cleanTimeStyle, timeTexts } from './timestyle.js';
import { albums, tracks, artists, widgetArtists, artistInfo, snapshotArtists, learnArtists, trackArtists, genres, playlists, byAlbum, albumTracks, mmss, quality, setLibrary, genreTracks, genreAlbums, artistTracks, folderEntries, recentAlbums, setPlaylists, plTracks, plPositions, savablePlaylists, unesc, setSmartArtists, smartArtists, artistVariants, artistName } from './data.js';
import { Native, on, store } from './native.js';
import { restoreSession } from './session.js';
import { I } from './icons.js';
import { glide } from './glidebar.js';
import { TAB_DEFS, cleanTabs, visibleTabs, toggleTab } from './tabbar.js';
import { HI as DET_HI, detailFromFrames, detailAccumulator } from './tintdetail.js';   // v225: detail pass (faint blush, small accents) + smart GIF frame picking   // v224: customizable tab bar
import { packBlob, unpackBlob, isLegacy } from './blobsafe.js';
import { useMirror, mirrorPut, mirrorGet, mirrorHas, mirrorDel, mirrorKeys, mirrorUrlSync, mirrorSyncKeys, mirrorForget, mirrorSync, mirrorPathSync, mirrorTombed, mirrorUntomb } from './picmirror.js';
import { isPicFile, picType, describe as picDescribe, newPicId, isGif, fmtSize, idbBackend } from './plpics.js';
import { parseLrc, currentIndex } from './lrc.js';
import { isPicFile as isBgFile, cleanDim, cleanFit, bgVars, idbBackend as bgBackend, BG_DIM_MIN, BG_DIM_MAX } from './bgmedia.js';   // v134: your own picture / GIF as the app background
import { buildSongInfo } from './songinfo.js';
import { buildExport, exportText, freeName, norm, nameKey } from './plexport.js';
import * as PX from './plforeign.js';   // playlists from / to other apps (M3U8, XSPF, CSV, Spotify ...)
import * as LIO from './listenio.js';     // listening data import / export
import * as SIO from './settingsio.js';
import * as ZR from './zipread.js';   // (PLAYLIST_WANT: playlist zips)   // open a .zip pick (Tempo backup, Spotify download)   // settings backup
import { zipFiles, safeName, stamp as dateStamp } from './transfer.js';
import { shouldCheck, changeText } from './autocheck.js';
import { scanView } from './scanview.js';
import { FAV_FILE, cleanFavs, isFav, toggleFav, favTracks } from './favorites.js';
import { SLEEP_MINUTES, SLEEP_MAX, cleanMinutes, parseSleepInput, pillText, setText } from './sleep.js';
import { emptyLoop, tapLoop, jumpTo, loopState, markPct } from './abloop.js';
import { SORT_OPTS, cleanSort, cleanSortSet, sortLabel, isLettered, sortTracks, sortAlbums, sortArtists, groupLetters, letterOf } from './sortlist.js';
import pkg from '../package.json';
import { addRecent, cleanRecent } from './recent.js';
import { greetingFor, pickK } from './greeting.js';
import { SECTIONS, COUNTS, PERIODS, QUICK, MAX_PINS, findPlaylist, findAlbum, findItem, withNames, cleanHome, moveSection, periodOf, pinKey, hiddenFor, isHiddenFor, setTod, toggleSectionFor, addPin, removePin, renameSection, renameQuick, toggleQuick, moveQuick, addCustom, addCustomItem, removeCustomItem, moveCustomItem } from './homecfg.js';
import { initLens } from './lens.js';
import { initJelly } from './jelly.js';
import { initLiquidUI } from './liquidui.js';
import { ANIM_DEFS, PRESETS, setAnim, glassVars } from './animcfg.js';
import { LYA_DEFS, LYA_PRESETS, cleanLya, lyaVars } from './lyanim.js';
import { LY_MIN, LY_MAX, LY_DEF, cleanLyPx, lyName } from './lysize.js';   // v148: free lyrics size   // v119: Lyrics animation settings
import { initLiquidGroups } from './liquidgroups.js';
import { moveIn, edgeSpeed } from './reorder.js';
import { fetchPopupPic, peekManifest, popFit, popupUrl, POPUP_POLL_MS } from './popup.js';
import { fetchUpdatePic, UPD_PIC_MIN_MS } from './updpic.js';
import { fetchCreditPic, CREDIT_POLL_MS, creditPicFailed } from './creditpic.js';
import { fetchBannerPic, BANNER_POLL_MS, bannerPicFailed } from './statbanpic.js';
import { startAssist, setAssistGate, setAssistDone, assistHoldsBg, assistBack, assistCardOpen } from './assist.js';
import { setLayerSync } from './cardlayer.js';
import { startBgAllow, bgAllowClose, bgAllowCheck, bgAllowHold, bgAllowDemo, setBgAllowGate, setBgAllowAfter } from './bgallow.js';
import { fetchSplashPic, splashLoad, splashSave, splashClear, SPLASH_POLL_MS, SPLASH_MIN_MS, SPLASH_CACHE_KEY } from './splashpic.js';
// v134: the splash picture (splash-pic/). v208+: shown inside an 80% x 80% box (80vw x 80vh) on a black screen, object-fit:contain: scaled to the uploaded picture's shape, never cropped, never stretched, centered. Last picture kept on the phone so it shows at once next launch.
let splashPic = { src: '', stamp: '' };
// v142: the saved picture lives in IndexedDB (any size). splashReady resolves once it has been read (the old small localStorage copy is dropped).
try { localStorage.removeItem(SPLASH_CACHE_KEY); } catch {}
const splashReady = (window.__lfSplashP || Promise.resolve(null)).then(e => (e && e.src ? (splashPic = { src: e.src, stamp: e.stamp }) : splashLoad().then(c => { if (c && !splashPic.src) splashPic = { src: URL.createObjectURL(c.blob), stamp: c.stamp }; }))).catch(() => {});   // v208: index.html already read + decoded the saved picture (window.__lfSplashP); this is only the fallback
function splashEl() {
  let o = document.getElementById('lf-splash');
  if (!o) {
    o = document.createElement('div'); o.id = 'lf-splash';
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;display:none;align-items:center;justify-content:center;transition:opacity .4s';
    o.innerHTML = '<img alt="" style="display:block;flex:none;width:80vw;height:80vh;object-fit:contain;object-position:center;opacity:0;transition:opacity .2s">';
    o.addEventListener('click', () => splashHide());
    document.body.appendChild(o);
  }
  return o;
}
function splashShow() {
  if (!splashPic.src) { splashHide(); return; }   // v208+: index.html already holds a black cover (so Home is never seen first); no saved picture = it is removed at once
  if (!document.body) return;
  const o = splashEl(), si = o.querySelector('img'); o.setAttribute('data-live', '1'); o.style.opacity = '1'; o.style.display = 'flex';
  if (si.getAttribute('src') !== splashPic.src) { window.__lfSplashAt = 0; si.style.opacity = '0'; si.src = splashPic.src; }   // v208: a picture that index.html already showed keeps its src and its start time
  const go = () => { si.style.opacity = '1'; if (!window.__lfSplashAt) window.__lfSplashAt = Date.now(); clearTimeout(o._t); o._t = setTimeout(splashHide, Math.max(0, SPLASH_MIN_MS - (Date.now() - window.__lfSplashAt))); };   // v208: at least 2 s of a fully visible picture, never a half-drawn one
  (si.decode ? si.decode() : Promise.resolve()).then(go, splashHide);
}
function splashHide() { const o = document.getElementById('lf-splash'); if (!o) return; o.setAttribute('data-live', '1'); o.style.opacity = '0'; setTimeout(() => { o.style.display = 'none'; }, 400); }
splashReady.then(splashShow);   // v208+: shown as soon as the saved picture is read, BEFORE the app draws Home (it used to be started at the very end of this file)
let splashBusy = false;
async function splashCheck() {
  await splashReady;
  if (document.hidden || splashBusy) return;
  splashBusy = true;
  try {
    const r = await fetchSplashPic(fetch, undefined, undefined, splashPic.stamp);
    if (r && !r.same) {
      const old = splashPic.src;
      splashPic = r.gone ? { src: '', stamp: '' } : { src: r.src, stamp: r.stamp };
      if (old && old.startsWith('blob:')) { try { URL.revokeObjectURL(old); } catch {} }
      if (r.gone) splashClear(); else splashSave(r.blob, r.stamp);   // v142: kept for the next launch, no size limit
    }
  } catch {} finally { splashBusy = false; }
}
// v134: the About > Credits picture (credit-gif-pic/). Looked at every second; the picture is downloaded only when its stamp changes.
let creditPic = { src: '', stamp: '', busy: false };
function creditPicShow() { const el = document.getElementById('lf-credit-gif-pic'), cap = document.getElementById('lf-credit-empty'); if (cap) cap.style.display = creditPic.src ? 'none' : 'block'; if (!el) return; if (creditPic.src) { if (el.getAttribute('src') !== creditPic.src) el.src = creditPic.src; el.style.display = 'block'; } else { el.removeAttribute('src'); el.style.display = 'none'; } }
async function creditPicCheck() {
  if (document.hidden || creditPic.busy) return;
  creditPic.busy = true;
  try {
    const r = await fetchCreditPic(fetch, undefined, undefined, creditPic.stamp);
    if (r && !r.same) {
      const old = creditPic.src;
      if (!r.gone) { const im = new Image(); im.src = r.src; try { await im.decode(); } catch { creditPicFailed(r.stamp); try { URL.revokeObjectURL(r.src); } catch {} return; } }   // v146: decode first, so the swap never flashes an empty frame
      creditPic = r.gone ? { src: '', stamp: '', busy: false } : { src: r.src, stamp: r.stamp, busy: false };
      creditPicShow();
      if (old) setTimeout(() => { try { URL.revokeObjectURL(old); } catch {} }, 1500);   // keep the old picture alive until the new one is on screen
    }
  } catch {} finally { creditPic.busy = false; }
}
// v146: the Home banner above Listening Stats (stats-banner-gif-pic/). Polled every second; downloaded only when its stamp changes; patched into the page in place (no Home re-render, no blink).
let banPic = { src: '', stamp: '' }, banBusy = false;
const banHtml = () => `<div class="statban glass${banPic.src ? ' pic' : ''}" id="lf-statban">${banPic.src ? `<img alt="" src="${banPic.src}">` : ''}</div>`;
function banShow() { const b = document.getElementById('lf-statban'); if (!b) return; const im = b.querySelector('img'); b.classList.toggle('pic', !!banPic.src); if (!banPic.src) { if (im) im.remove(); return; } if (!im) b.insertAdjacentHTML('afterbegin', `<img alt="" src="${banPic.src}">`); else if (im.getAttribute('src') !== banPic.src) im.src = banPic.src; }
async function banCheck() {
  if (document.hidden || banBusy) return;
  banBusy = true;
  try {
    const r = await fetchBannerPic(fetch, undefined, undefined, banPic.stamp);
    if (r && !r.same) {
      const old = banPic.src;
      if (!r.gone) { const im = new Image(); im.src = r.src; try { await im.decode(); } catch { bannerPicFailed(r.stamp); try { URL.revokeObjectURL(r.src); } catch {} return; } }
      banPic = r.gone ? { src: '', stamp: '' } : { src: r.src, stamp: r.stamp };
      banShow();
      if (old) setTimeout(() => { try { URL.revokeObjectURL(old); } catch {} }, 1500);
    }
  } catch {} finally { banBusy = false; }
}
import { startAppLogoWatcher, checkLatestAppLogo, appLogoSrc, syncAppLogo } from './applogo.js';
import { restoreGate, newFirstDraw, resetFirstDraw, deferFirstDraw } from './updgate.js';
import { checkUpdate, resetUpdateCache, UPDATE_POLL_MS, MY_CODE_ID, lastCheckConfirmed, getInstalledBuild, pendingUpdateIsInstalled, clearInstalledBuildCache } from './update.js';
import { initLStats } from './lstats.js';
import { startScrollHints } from './scrollhint.js';   // red "Scroll down ↓" on every scrolling sheet, card, list and page
import { picNames, picKey, picDrop, picAliases } from './artistpics.js';
import { artistKey } from './artistnames.js';
import { morphHtml } from './morph.js';
import { STATS_FILE, cleanStats, bump, mergePlays, recentList, topList, makeCounter } from './stats.js';
import { IDKEYS_FILE, cleanKeys, relinkIds } from './idrelink.js';

const APP_VERSION = pkg.version;
const APP_BUILD = String(pkg.version).split('.')[1] || pkg.version;   // 0.208.0 -> 208, the number the README, UPDATES and the workflow use
/* ---------- settings (persisted) ---------- */
const TAB_MIN = 40, TAB_MAX = 220, NPC_MIN = 40, NPC_MAX = 100;
const DEF = { contrast: false, motion: false, refract: true, albumInfo: true, bigCovers: false, redHover: true, anim: {}, tabs: { home: true, albums: true, library: true, search: true, settings: false }, lyricSize: 'Medium', userName: '', npCover: 0, npImmersive: false, npTapOrig: true, home: null, tabSize: 'Medium', lyricStyle: 'classic', lyricBlur: false, lyricPal: false, timeStyle: 'left', bgDim: 40, bgFit: 'fill', lyAnim: {}, coverLyrics: true, autoplay: true, autoCheck: true, smartArtists: true, sort: {}, recent: [] };
let set = { ...DEF };
try { set = { ...DEF, ...JSON.parse(localStorage.getItem('lf.settings') || '{}') }; } catch {}
if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize; set.lyricPx = cleanLyPx(set.lyricPx, set.lyricSize);   // v148: free lyrics size (an older Small / Medium / Large keeps its size)
set.sort = cleanSortSet(set.sort); set.recent = cleanRecent(set.recent);   // T23 / T25
const osReduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };   // D9: the phone's own Reduce Motion counts too
let hwnReady = false;   // BUG-01: homeWithNames is a const declared further down; do not touch it before it exists
let setSaveT = 0;   // BUG-17: slider drags save lf.settings once after the finger pauses (applySettings(true)), not on every input frame
const saveSettingsNow = () => { clearTimeout(setSaveT); setSaveT = 0; try { localStorage.setItem('lf.settings', JSON.stringify(set)); } catch {} };
addEventListener('pagehide', () => { if (setSaveT) saveSettingsNow(); }); document.addEventListener('visibilitychange', () => { if (document.hidden && setSaveT) saveSettingsNow(); });
function applySettings(lazy) {
  if (set.home && hwnReady) { const nh = homeWithNames(set.home); if (nh !== set.home) set.home = nh; }   // v162: readable names for pins / custom songs (returns the same object when nothing is missing)
  setSmartArtists(set.smartArtists !== false);   // Settings > Smart artist grouping (rebuilds the artist index only when the switch changed)
  const h = document.documentElement;
  h.dataset.contrast = set.contrast ? '1' : '0'; h.dataset.motion = (set.motion || osReduce()) ? 'reduce' : ''; h.dataset.refract = set.refract ? '1' : '0'; h.dataset.albuminfo = set.albumInfo === false ? '0' : '1'; h.dataset.bigcovers = set.bigCovers ? '1' : '0'; h.dataset.redhover = set.redHover === false ? '0' : '1'; set.anim = setAnim(set.anim); { const gv = glassVars(set.anim); for (const k in gv) h.style.setProperty(k, gv[k]); }   // v208: every liquid-glass CSS value comes from glassVars (capped, see animcfg.js)   // v157: every CSS spring (sheets, pages, toast, Now Playing, rows, buttons) follows Bounciness + Spring speed too   // v148 fix: CSS wobble follows Button squash / Bounciness / Spring speed
  { const k = set.tabPct / 100; h.style.setProperty('--tabk', k.toFixed(3)); h.style.setProperty('--tabbar-h', Math.round(78 * k) + 'px'); }   // v108: glass bar size (older name: tab bar) is a free slider (40% to 220%, or type any number; 100% = the old Medium)
  h.dataset.homecard = set.home.card;
  h.dataset.immersive = set.npImmersive ? '1' : '0';   // v148+: Now Playing with the album cover filling the whole screen
  h.dataset.npcover = set.npCover > 0 ? '1' : '0'; h.style.setProperty('--npk', ((set.npCover > 0 ? set.npCover : 100) / 100).toFixed(2));   // v119: Now Playing cover size
  { const lv = lyaVars(set.lyAnim); for (const k in lv) h.style.setProperty(k, lv[k]); h.dataset.lyblur = cleanLya(set.lyAnim).blur > 0 ? '1' : '0'; }   // v119: Lyrics animation
  { const bv = bgVars(set.bgDim, set.bgFit); for (const k in bv) h.style.setProperty(k, bv[k]); h.dataset.bgfit = cleanFit(set.bgFit); }   // v134: background picture dim + fit
  h.dataset.lyblur = set.lyricStyle === 'cover' && set.lyricBlur === true ? '1' : '0';   // Cover blur = style 'cover' + this flag (data-lyrstyle keeps only classic / cover)
  h.dataset.lypal = set.lyricStyle === 'cover' && set.lyricPal === true && set.lyricBlur !== true && !set.lyricBg ? '1' : '0';
  h.dataset.lyink = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   // v278: lyrics text colour, any background style
  h.dataset.lybg = set.lyricStyle === 'cover' && set.lyricBlur !== true && set.lyricBg ? set.lyricBg : '';   // v277: 'home' = the Home background picture / GIF (or black), 'custom' = your own lyrics picture / GIF for every song; a Canvas shows instead when the song has one   // Cover colour palette = style 'cover' + this flag
  h.dataset.lyrstyle = set.lyricStyle;   // v92: 'cover' = white lyrics on the album's colour
  h.style.setProperty('--lyric-size', cleanLyPx(set.lyricPx, set.lyricSize) + 'px');   // v148: free size in px (default Medium = 23)
  if (lazy) { clearTimeout(setSaveT); setSaveT = setTimeout(saveSettingsNow, 400); } else saveSettingsNow();
}
set.lyAnim = cleanLya(set.lyAnim);
set.bgDim = cleanDim(set.bgDim); set.bgFit = cleanFit(set.bgFit);
if (!['classic', 'cover'].includes(set.lyricStyle)) set.lyricStyle = DEF.lyricStyle;
delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur; set.lyricBg = set.lyricStyle === 'cover' && !set.lyricBlur && ['home', 'custom'].includes(set.lyricBg) ? set.lyricBg : ''; if (set.lyricBg) set.lyricPal = false; set.lyricInk = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   /* v278: lyrics text colour (auto = the style's own: red on classic, white on the others) */ /* v277: 5 styles: + Home screen background, Custom lyrics background (style 'cover' + lyricBg) */   // 3 styles: classic, Cover colour palette, Cover blur. A saved plain 'cover' or the removed Cover colour mix becomes the palette
set.timeStyle = cleanTimeStyle(set.timeStyle);   // Settings > Playing bar time: a missing or corrupt saved value falls back to 'left'
if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize;   // Bug 14: a corrupt saved value must not become "undefined"
if (!['Small', 'Medium', 'Large'].includes(set.tabSize)) set.tabSize = DEF.tabSize;
if (!Number.isFinite(+set.tabPct)) set.tabPct = { Small: 85, Medium: 100, Large: 120 }[set.tabSize] || 100;   // v108: keep the size people had chosen before the slider
set.tabPct = Math.min(TAB_MAX, Math.max(TAB_MIN, Math.round(+set.tabPct)));
set.tabs = cleanTabs(set.tabs);   // v224: which icons the tab bar shows
set.home = cleanHome(set.home);   // v119: Home screen layout
set.userName = String(set.userName || '').slice(0, 24);   // v119: name for the Home greeting
set.npCover = +set.npCover > 0 ? Math.min(NPC_MAX, Math.max(NPC_MIN, Math.round(+set.npCover))) : 0;   // v119: 0 = automatic size
applySettings();
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applySettings); } catch {}

/* ---------- shell (built once) ---------- */
let TABS = visibleTabs(set.tabs);   // v224: [key, label] of the icons the bar shows now (Settings > Tab bar); the Settings icon is a fifth one
const tabsHtml = (attr = 'data-tab') => TABS.map(([k, l]) => `<button class="tab" ${attr}="${k}" aria-label="${l}">${I[k]}<span>${l}</span></button>`).join('');
document.getElementById('app').innerHTML = `
  <div id="main" class="screen"></div><div id="sub"></div><div id="mini"></div>
  <nav class="tabbar" id="tabs" aria-label="Main">${tabsHtml()}</nav>
  <div class="np" id="np" role="dialog" aria-modal="true" aria-label="Now Playing"></div><div class="toast" id="toast" role="status" aria-live="polite"></div><div id="sheet"></div>`;
const $ = s => document.querySelector(s);
var lsx = null;   // listening statistics (initLStats, below)
let tab = TABS.some(t => t[0] === 'home') ? 'home' : TABS[0][0], stack = [],   // v224: the first icon of the bar when Home is removed
   query = '', plEdit = false;
let dragBusy = false;   // T12 part 2: true while a finger drags a row (the Up Next sheet is not rebuilt meanwhile)
const playFail = e => { logLine('W', 'playback:', e && e.message || e); toast('Could not do that: ' + (String((e && e.message) || e || 'player error').replace(/^Error: /, '').slice(0, 80))); };   // Bug 10: a plugin error is shown, not only logged
const toast = (msg, ms = 1800) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); };

/* ---------- helpers ---------- */
/* v145c: album picture or GIF. ONE per album, kept exactly as chosen in IndexedDB (lf-albumpics); lf.albpics only lists which albums have one. Shown in the library, Home and Now Playing; the listening stats and the yearly recap always use the original cover. */
const alpMap = () => { try { return JSON.parse(localStorage.getItem('lf.albpics')) || {}; } catch { return {}; } };
const alpSave = m => { try { localStorage.setItem('lf.albpics', JSON.stringify(m)); return true; } catch { return false; } };
/* v150: keep every custom picture decoded in memory (a few MB each, more RAM on purpose): shows instantly, never blank while it loads. */
useMirror(Native.pics);
Native.setCoverOverride(t => (t ? (soHas(t) ? '' : mirrorPathSync('lf-songpics:' + t.id) || mirrorPathSync('lf-albumpics:' + t.albumId)) : ''));   // v165: the song's own picture first, then its album's   // v152: songs started from now on show the custom album picture in the notification and on the lock screen too   // v150: second copy of custom pictures as plain files (Android)
const picKeep = new Set(), quickKeys = new Set(), warmed = new Map();
const warmUrl = u => { try { if (warmed.has(u)) return u; const im = new Image(); im.decoding = 'async'; im.onerror = () => { if (warmed.get(u) === im) { warmed.delete(u); picKeep.delete(im); } }; im.src = u; picKeep.add(im); warmed.set(u, im); if (im.decode) im.decode().catch(() => {}); } catch {} return u; };   // v166: a picture that failed to load is forgotten, so the next warm-up tries it again (it used to stay 'warmed' and broken)
const unwarm = u => { try { const im = warmed.get(u); if (im) { picKeep.delete(im); warmed.delete(u); im.onerror = null; im.src = ''; } } catch {} };   // BUG #7: a replaced / removed custom picture is forgotten here, so it is not kept decoded in RAM or decoded again on every resume (rewarmAll walks warmed)
/* v156: run like a game. Every picture is decoded AHEAD of time and kept: custom pictures at once, album covers in the background (a batch per tick, as many as the phone has cores),
   and everything is decoded again the moment the app comes back to the front (Android lets the web view drop decoded pictures while the app is away: that was the blank flash on reopening). */
const warmCores = () => Math.max(2, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4);
const warmChunks = (urls, again) => { let i = 0; const n = warmCores() * 8; const step = () => { const end = Math.min(urls.length, i + n); for (; i < end; i++) { const u = urls[i]; if (again) { const im = warmed.get(u); try { im && im.decode && im.decode().catch(() => {}); } catch {} } else warmUrl(u); } if (i < urls.length) setTimeout(step, 2); }; step(); };   // v166: bigger batches, shorter pause (RAM / CPU are not a concern)
/* v166: the covers Home needs FIRST (recent, most played, favourites, the queue's songs) are decoded the moment the songs arrive, before the rest of the library is warmed. */
function warmFirst() { try { const seen = new Set(), us = []; const add = ts => (ts || []).slice(0, 40).forEach(t => { const a = t && byAlbum(t.albumId), u = a && a.cover; if (u && !seen.has(u)) { seen.add(u); us.push(u); } });
  add(recentList(stats, tracks)); add(topList(stats, tracks)); add(favTracks(favs, tracks)); add(tracks); us.forEach(u => warmUrl(u)); } catch {} }
function warmCovers() { try { warmChunks(albums.map(a => a.cover).filter(Boolean), false); } catch {} }
function rewarmAll() { try { warmChunks([...warmed.keys()], true); } catch {} }
/* v156: a picked file is copied into memory first (a few ms), shown AT ONCE, and saved to the phone in the background: no more waiting for a big GIF to be written before it appears. */
const ownBlob = async f => { try { return new Blob([await f.arrayBuffer()], { type: f.type || '' }); } catch { return f; } };
/* v148: a still photo (profile picture, artist photo) is kept EXACTLY like a GIF: the original file's bytes, with no crop, no shrinking and no JPEG re-encode, so it stays as sharp as the file you chose
   (before, profile photos were cut to 256 px and artist photos to 512 px and saved as JPEG, which also flattened animated WebP / APNG). The square is cut by the screen (object-fit / background cover).
   The file is opened once only to make sure this phone can show it; an empty file type (some pickers give none) is filled in from the file name. */
const canShow = f => new Promise(res => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(true); }; im.onerror = () => { URL.revokeObjectURL(u); res(false); }; im.src = u; });
const keepOriginal = async f => { const b = await ownBlob(f); return b.type ? b : b.slice(0, b.size, picType(f)); };
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch {}   // v150: ask Android not to clear the saved pictures when it is short of space
const alpUrls = new Map();
/* v163: the player's cover is refreshed when a custom picture arrives (shortly after, once for a burst of them) */
let npArtT = 0;
const npSoon = () => { clearTimeout(npArtT); npArtT = setTimeout(() => { if (Native.current()) renderNP(); }, 60); };
const alpSet = (id, blob) => { const u = alpUrls.get(id); if (u) { try { URL.revokeObjectURL(u); } catch {} unwarm(u); alpUrls.delete(id); } if (blob) alpUrls.set(id, warmUrl(URL.createObjectURL(blob))); npSoon(); };
// v208+: a custom picture / GIF REPLACES the original completely. Nothing of the original is drawn under it (only a plain dark colour while it loads, or behind a transparent GIF).
const PIC_BASE = '#111';
const gOf = a => { const u = a && a.id && alpUrls.get(a.id); return u && byAlbum(a.id) ? `url('${u}') center/cover no-repeat, ${PIC_BASE}` : a.g; };   // v155: the custom picture is a layer ON TOP of the original cover (a.g): while it loads, or if it cannot be shown, the original is seen, never a blank square
const cov = (a, cls = '') => `<span class="cover blk ${cls}" style="--g:${gOf(a)}"></span>`;   // a span with .blk: block layout, but valid inside a button element (block divs are not)
/* v165: a SONG can have its own picture or GIF (one per song, kept like the album ones: IndexedDB + a file; lf.songpics lists which songs have one).
   It is a layer on top of the song's album picture (itself on top of the file cover), shown wherever that song is shown. Album screens keep showing the album picture. */
const spMap = () => { try { return JSON.parse(localStorage.getItem('lf.songpics')) || {}; } catch { return {}; } };
const spSave = m => { try { localStorage.setItem('lf.songpics', JSON.stringify(m)); return true; } catch { return false; } };
const spUrls = new Map();
const spSet = (id, blob) => { const u = spUrls.get(id); if (u) { try { URL.revokeObjectURL(u); } catch {} unwarm(u); spUrls.delete(id); } if (blob) spUrls.set(id, warmUrl(URL.createObjectURL(blob))); npSoon(); };
/* v208: "Back to original cover" for ONE song. lf.songorig lists songs that must show the cover from their own file, even when the album has a custom picture or GIF. */
const soMap = () => { try { return JSON.parse(localStorage.getItem('lf.songorig')) || {}; } catch { return {}; } };
let soCache = null;
const soIds = () => soCache || (soCache = new Set(Object.keys(soMap())));
const soSave = m => { try { localStorage.setItem('lf.songorig', JSON.stringify(m)); soCache = new Set(Object.keys(m)); return true; } catch { return false; } };
const soHas = t => !!(t && t.id && soIds().has(t.id));
const gOfT = t => { if (soHas(t)) return trackAlbum(t).g; const u = t && t.id && spUrls.get(t.id); return u ? `url('${u}') center/cover no-repeat, ${PIC_BASE}` : gOf(trackAlbum(t)); };
const covT = (t, cls = '') => `<span class="cover blk ${cls}" style="--g:${gOfT(t)}"></span>`;
const NOALBUM = { id: '', title: 'Unknown Album', artist: 'Unknown Artist', genre: '', year: '', g: 'var(--row-fill)' };   // B6: a song whose album vanished after a rescan
/* v118: custom artist photo. Stored on this phone only: lf.apics = { artistName: 'data:image/jpeg...' | 'album:<id>' }. */
const apicMap = () => { try { return JSON.parse(localStorage.getItem('lf.apics')) || {}; } catch { return {}; } };
const apicSave = m => { try { localStorage.setItem('lf.apics', JSON.stringify(m)); return true; } catch { return false; } };
/* v135: artist GIFs are stored untouched in their own IndexedDB (lf-artistgifs): any size, no 5 MB localStorage limit. lf.apics holds only the small marker 'gif:1'. */
const kvDb = name => { let p = null;
  const open = () => p || (p = new Promise((res, rej) => { const idb = globalThis.indexedDB; if (!idb) return rej(new Error('IndexedDB not available')); const r = idb.open(name, 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => { p = null; rej(r.error); }; }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('kv', mode), rq = fn(t.objectStore('kv')); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('aborted')); }));
  return {   // v150: the picture's BYTES are kept in IndexedDB AND as a plain file; either copy is enough, a missing one is made again from the other
    get: k => mirrorTombed(name + ':' + k) ? Promise.resolve(null) : tx('readonly', s => s.get(k)).catch(() => null).then(v => {
      const b = unpackBlob(v), K = name + ':' + k;
      if (b) { if (isLegacy(v)) packBlob(v).then(p => tx('readwrite', s => s.put(p, k))).catch(() => {}); mirrorHas(K).then(h => { if (!h) mirrorPut(K, b); }); return b; }
      return mirrorGet(K).then(m => { if (m) packBlob(m).then(p => tx('readwrite', s => s.put(p, k))).catch(() => {}); return m || null; });
    }),
    put: async (k, b) => { const [i, m] = await Promise.all([packBlob(b).then(v => tx('readwrite', s => s.put(v, k))).then(() => true, () => false), mirrorPut(name + ':' + k, b)]); if (!i && !m) throw new Error('save failed'); },
    del: k => { const nd = mirrorDel(name + ':' + k); return tx('readwrite', s => s.delete(k)).then(async r => { if (await nd) mirrorUntomb(name + ':' + k); return r; }); } }; };   // BUG-75
const agDb = kvDb('lf-artistgifs'), alDb = kvDb('lf-albumpics'), spDb = kvDb('lf-songpics');   // v145c: artist GIFs and album pictures, one file per artist / album
const agUrls = {};
const agSet = (n, blob) => { if (agUrls[n]) { try { URL.revokeObjectURL(agUrls[n]); } catch {} unwarm(agUrls[n]); delete agUrls[n]; } if (blob) agUrls[n] = warmUrl(URL.createObjectURL(blob)); };
const apicDropGif = n => { if (String(apicMap()[n] || '').startsWith('gif:')) { agDb.del(n).catch(() => {}); agSet(n, null); } apicDropOthers(n); };   // one photo at a time: a replaced GIF is deleted, not kept
/* Custom artist pictures are saved under ONE name per artist (the shown name). With Smart artist grouping on, the other spellings of the same artist count as the same artist:
   a picture saved under an old spelling is still shown, and setting / replacing / removing a picture clears every spelling, so nothing old is kept and a removed picture cannot come back. Off: exact names only (no variants). */
const apicId = s => smartArtists() ? artistKey(s) : String(s).trim().toLowerCase();   // v157: the same identity rule the artist list uses right now
const apicStored = () => [...Object.keys(apicMap()), ...Object.keys(agUrls), ...mirrorSyncKeys('lf-artistgifs:').map(k => k.slice('lf-artistgifs:'.length))];   // markers, loaded GIFs and GIF files whose marker was lost
const apicNames = n => { const o = picNames(n, artistVariants(n), unesc); for (const k of picAliases(apicStored(), n, apicId, unesc)) if (!o.includes(k)) o.push(k); return o; };   // v157: also every stored spelling of this artist, so grouping on / off can never hide a photo that Remove cannot reach
const apicKey = n => picKey(apicMap(), apicNames(n), n);
const apicGone = ks => { const m0 = apicMap(); let ch = false; for (const k of ks) { agDb.del(k).catch(() => {}); agSet(k, null); if (m0[k]) { delete m0[k]; ch = true; } } if (ch) apicSave(m0); };   // bytes deleted even when the list had lost the marker
const apicDropOthers = keep => apicGone(picDrop(apicNames(keep), keep));
/* v209: an album chosen as the artist photo shows its original cover, never the custom picture. */
const apicOf = n0 => { const n = apicKey(n0), v = apicMap()[n]; if (!v) return null; if (v.startsWith('gif:')) return agUrls[n] ? { g: `url('${agUrls[n]}') center/cover no-repeat, ${PIC_BASE}` } : null; if (v.startsWith('album:')) { const al = albums.find(x => x.id === v.slice(6)); return al ? { g: al.g } : null; } return { g: `url('${v}') center/cover no-repeat, ${PIC_BASE}` }; };
const artistCov = (n, cls = '') => { const t = artistTracks(n)[0], base = t ? trackAlbum(t) : NOALBUM, c = apicOf(n); return cov(c || base, cls); };   // v155: the artist photo / GIF is a layer over the first album's cover (itself a layer over the file cover)
let apicFor = '';
/* v149: genre pictures and GIFs. Own storage (so a genre and an artist with the same name never share a photo): lf.gpics = { genre: 1 } marks which genres have one, the file itself is kept untouched in IndexedDB (lf-genrepics): any size, GIFs keep moving. */
const gpMap = () => { try { return JSON.parse(localStorage.getItem('lf.gpics')) || {}; } catch { return {}; } };
const gpSave = m => { try { localStorage.setItem('lf.gpics', JSON.stringify(m)); return true; } catch { return false; } };
const gDb = kvDb('lf-genrepics'), gpUrls = {};
const gpSet = (n, blob) => { if (gpUrls[n]) { try { URL.revokeObjectURL(gpUrls[n]); } catch {} unwarm(gpUrls[n]); delete gpUrls[n]; } if (blob) gpUrls[n] = warmUrl(URL.createObjectURL(blob)); };
const genreCov = (n, cls = '') => { const t = genreTracks(n)[0], base = t ? trackAlbum(t) : NOALBUM; return gpUrls[n] ? cov({ g: `url('${gpUrls[n]}') center/cover no-repeat, ${PIC_BASE}` }, cls) : cov(base, cls); };
let gpFor = '';
const trackAlbum = t => byAlbum(t.albumId) || NOALBUM;
const snap = {};   // B2: the list a Recently / Most Played screen was BUILT from (data-i points into it)
const closeNP = () => $('#np').classList.remove('open');
const scroller = () => $('#sub .screen');
const E = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));   // dataset values arrive decoded: escape again to match the stored (escaped) names
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const has = (stored, q) => unesc(stored).toLowerCase().includes(q);   // search against the DECODED text (stored names are HTML-escaped)
const warn = msg => { toast(msg); return true; };   // a handler that shows a message has still handled the click
const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const actions = list => `<div class="actions"><button data-act="playall" data-list="${list}">${I.play}Play</button><button data-act="shuffleall" data-list="${list}">${I.shuffle}Shuffle</button></div>`;
const navRow = (act, id, icon, label, count) => `<button class="row" data-act="${act}" data-id="${id}"><span class="ic">${I[icon]}</span><span class="lbl" style="font-size:1.125rem">${label}</span>${count == null ? '' : `<span class="cnt">${count}</span>`}<span class="chev">${I.chev}</span></button>`;
/* v119: custom Home sections (your own mix of albums, artists and songs). Song cards play the songs of that section, in the order you set. */
const custTracks = pn => pn.items.filter(i => i.t === 'song').map(i => findItem(i, tracks, unesc)).filter(Boolean);   // v162: by id, else by the name kept with it (settings from another phone)
/* v162: readable names for every Home reference (a settings export carries them, so an imported Home still finds its playlists / songs / albums) */
const homeWithNames = h => withNames(h, {
  playlist: id => { const p = playlists.find(x => x.id === id); return p ? { name: unesc(p.name) } : null; },
  album: id => { const a = albums.find(x => x.id === id); return a ? { name: unesc(a.title), by: unesc(a.artist) } : null; },
  track: id => { const t = tracks.find(x => x.id === id); return t ? { name: unesc(t.title), by: unesc(t.trackArtist || '') } : null; },
});
hwnReady = true; if (set.home) { const nh0 = homeWithNames(set.home); if (nh0 !== set.home) set.home = nh0; }   // BUG-01
const listOf = key => {
  if (key === 'all') return tracks;
  if (key === 'songs') return sortedSongs();   // T23: the Songs screen plays in the order it shows
  if (key === 'fav') return favSorted();
  if (key === 'daily') return snap.daily || dailyPicks();
  if (key === 'because') return snap.because || [];
  if (key === 'forgot') return snap.forgot || [];
  if (key === 'favmix') return snap.favmix || [];
  if (key === 'newmix') return snap.newmix || [];
  if (key === 'recent') return snap.recent || recentList(stats, tracks);
  if (key === 'top') return snap.top || topList(stats, tracks);
  const c = key.indexOf(':'), k = key.slice(0, c), id = key.slice(c + 1);   // split on the FIRST colon only (names can contain ':')
  if (k === 'album') return albumTracks(id);
  if (k === 'cust') { const pn = set.home.pins.find(x => x.id === id && x.type === 'custom'); return pn ? custTracks(pn) : []; }
  if (k === 'pl') { const p = playlists.find(x => x.id === id); return p ? plTracks(p) : []; }
  if (k === 'artist') return artistTracks(E(id));
  if (k === 'genre') return genreTracks(E(id));
  if (k === 'folder') return folderEntries(E(id)).files;
  return tracks;
};
const aplay = id => { const c = Native.current(); return !!c && !!id && (c.albumId ?? (tracks.find(x => x.id === c.id) || {}).albumId) === id; };   // v149: is a song of this album playing now?
const albumCard = (a, L = '') => `<button class="card${L ? ' lsec' : ''}${aplay(a.id) ? ' aplay' : ''}"${L ? ` data-letter="${L}"` : ''} data-aid="${a.id}" data-act="album" data-id="${a.id}">${cov(a)}<span class="t blk">${a.title}</span><span class="s blk">${a.artist}</span></button>`;
const albumRow = (a, L = '', x = '') => `<button class="row arow${L ? ' lsec' : ''}${aplay(a.id) ? ' aplay' : ''}"${L ? ` data-letter="${L}"` : ''} data-aid="${a.id}" data-act="album" data-id="${a.id}">${cov(a, 'thumb')}<span class="meta"><b>${a.title}</b><span>${a.artist}${x ? ` · ${x}` : ''}</span></span></button>`;
const albumList = (as, f = a => albumRow(a)) => `<div class="alist">${as.map(f).join('')}</div>`;
const songRow = (t, list, i, { idx = false, note = null } = {}) => {
  const a = trackAlbum(t), cur = Native.current();
  return `<div class="songwrap"><button class="row song ${cur && cur.id === t.id ? 'playing' : ''}" data-tid="${t.id}" data-act="play" data-list="${list}" data-i="${i}">
    ${idx ? `<span class="idx">${i + 1}</span>` : `<span class="thumb cover" style="--g:${gOfT(t)}"></span>`}
    <span class="meta"><b>${t.title}${isFav(favs, t.id) ? ' <i class="favdot" aria-label="Favorite">♥</i>' : ''}</b><span>${t.trackArtist || a.artist}</span></span><span class="dur">${note ?? mmss(t.dur)}</span></button><button class="gbtn sm" aria-label="More options for ${t.title}" data-act="trackmenu" data-tm="${t.id}">${I.more}</button></div>`;
};
const header = ({ back, right = 'more' } = {}) => `<div class="top">
  ${back ? `<button class="gbtn" data-act="back">${I.back}</button>` : '<span></span>'}
  ${right === 'more' ? `<button class="gbtn setbtn" data-act="settings" aria-label="Settings">${I.gear}<span>Settings</span></button>` : right === 'plus' ? `<button class="gbtn" data-act="newpl">${I.plus}</button>` : right === 'plmenu' ? `<button class="gbtn" data-act="plmenu">${I.more}</button>` : '<span></span>'}</div>`;
const mosaic = (ts, cls = '') => {   // v165: four different pictures; a song with its own picture counts as its own square
  const seen = new Set(), cs = [];
  for (const t of ts) { const k = spUrls.has(t.id) || soHas(t) ? 's' + t.id : t.albumId; if (seen.has(k)) continue; seen.add(k); cs.push(t); if (cs.length === 4) break; }
  if (!cs.length) return `<span class="pl-mosaic blk ${cls}">${'<span class="cover blk" style="--g:var(--row-fill)"></span>'.repeat(4)}</span>`;
  while (cs.length < 4) cs.push(cs[cs.length % cs.length]);
  return `<span class="pl-mosaic blk ${cls}">${cs.map(t => covT(t)).join('')}</span>`;
};

/* ---------- v132: pictures and GIFs in a playlist (any size, stored untouched in IndexedDB; the first one is the cover). Logic + tests: plpics.js ---------- */
const ppStore = idbBackend(), ppUrl = new Map();   // ppUrl: picture id -> object URL (made once, revoked when the picture is removed)
let ppView = null;   // { pid, i }: the playlist and picture number open in the full-screen viewer
const picsOf = p => (p && Array.isArray(p.pics) ? p.pics : []);
const ppImg = (pic, cls = '') => ppUrl.has(pic.id) ? `<img class="${cls}" data-ppid="${pic.id}" src="${ppUrl.get(pic.id)}" alt="${E(pic.name)}" decoding="async" draggable="false">` : `<span class="pp-wait ${cls}" aria-hidden="true"></span>`;
const plArt = (p, ts, cls = '') => { const c = picsOf(p)[0]; return c && (ppUrl.has(c.id) || !ppBad.has(c.id)) ? `<span class="pl-mosaic blk pp-cover ${cls}">${ppImg(c)}</span>` : mosaic(ts, cls); };   // v208+: while the picture loads, a plain square (never the original mosaic under it)
let ppBusy = false;
const ppBad = new Set();   // pictures that could not be shown even from the database copy (this session): the playlist shows its mosaic instead
async function ppHeal(id) {   // v155: <img> failed (a file address that does not work, a half-written file): switch to the copy in IndexedDB, forget the broken file address
  if (!id || ppBad.has(id)) return;
  const u = ppUrl.get(id); ppUrl.delete(id);
  if (u && !String(u).startsWith('blob:')) { mirrorForget('lf-playlist-pics:' + id); quickKeys.delete('lf-playlist-pics:' + id); try { const b = await ppStore.get(id); if (b) { ppUrl.set(id, warmUrl(URL.createObjectURL(b))); repaintPics(); return; } } catch {} }
  ppBad.add(id); repaintPics();
}
document.addEventListener('error', e => { const i = e.target; if (i && i.tagName === 'IMG' && i.dataset && i.dataset.ppid) ppHeal(i.dataset.ppid); }, true);
async function ppEnsure(p, all = false) {   // load the pictures of a playlist (all) or just its cover from the saved copy, then repaint everything that shows them
  if (!p) return false; let got = false, miss = false;
  for (const pic of (all ? picsOf(p) : picsOf(p).slice(0, 1))) {
    if (ppUrl.has(pic.id) || ppBad.has(pic.id)) continue;
    try { const b = await ppStore.get(pic.id); if (b) { ppUrl.set(pic.id, warmUrl(URL.createObjectURL(b))); got = true; } else miss = true; } catch { miss = true; }
  }
  if (got) repaintPics();
  return miss;
}
/** v151: every playlist's pictures are loaded as soon as the playlists are known (not only when one is opened), and tried again (2 s, 5 s, 10 s) when one is not readable yet. */
async function ppEnsureAll(tries = 10) {
  await Promise.race([picsSynced.catch(() => {}), new Promise(r => setTimeout(r, 1200))]);   // v157: never held up for long by the phone's file list
  const miss = (await Promise.all(playlists.map(p => ppEnsure(p, true)))).some(Boolean);
  if (miss && tries > 1) setTimeout(() => ppEnsureAll(tries - 1), Math.min(10000, 1500 * (11 - tries)));
}
function ppAdd() {
  const p = curPl(); if (!p) return;
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif'; i.id = 'ppfile';
  i.onchange = () => ppAddFiles(p, [...(i.files || [])]);
  i.click();
}
async function ppAddFiles(p, files) {   // one picture per playlist: the new one REPLACES the old one (the old file is deleted, nothing is kept)
  if (ppBusy) return toast('Still saving the last picture');
  const f = files.find(isPicFile);
  if (!f) return toast(files.length ? 'That file is not a picture or GIF' : 'No picture chosen');
  ppBusy = true;
  const old = picsOf(p), id = newPicId(new Set(old.map(x => x.id)), Date.now().toString(36), 0);
  try {
    const b = await ownBlob(f); ppUrl.set(id, warmUrl(URL.createObjectURL(b)));   // v156: shown at once, saved right after
    p.pics = [picDescribe(f, id)]; repaintAll();
    // BUG-73: the busy flag stays set until this save has settled, so two saves cannot overlap; a failed save restores the old picture only if it is still the one this save replaced
    ppStore.put(id, b).then(() => { ppBusy = false; ppDrop(p, old.map(x => x.id)); savePl(); toast(old.length ? 'Picture replaced' : 'Picture set'); })
      .catch(() => { ppBusy = false; if (p.pics && p.pics[0] && p.pics[0].id === id) p.pics = old; ppUrl.delete(id); ppStore.del(id).catch(() => {}); savePl(); repaintAll(); toast('Could not save that picture (storage full?)'); });   // the old picture stays when the new one fails
    return;
  } catch { toast('Could not read that picture'); }
  ppBusy = false; savePl(); repaintAll();
}
function ppDrop(p, ids) { ids.forEach(id => { const u = ppUrl.get(id); if (u) { URL.revokeObjectURL(u); unwarm(u); ppUrl.delete(id); } ppStore.del(id).catch(() => {}); }); }
function ppOpen(pid, i) {
  const p = playlists.find(x => x.id === pid), pics = picsOf(p); if (!pics.length) return;
  i = (i + pics.length) % pics.length; ppView = { pid, i }; const c = pics[i];
  let v = $('#ppv'); if (!v) { $('#app').insertAdjacentHTML('beforeend', '<div class="ppv" id="ppv" role="dialog" aria-modal="true" aria-label="Playlist picture"></div>'); v = $('#ppv'); }
  v.innerHTML = `<div class="pp-stage" data-act="pp-close">${ppImg(c, 'pp-big')}</div>
    <div class="pp-bar"><div class="pp-cap"><b>${E(c.name)}</b><span>${i + 1} / ${pics.length}${c.size ? ' · ' + fmtSize(c.size) : ''}${isGif(c) ? ' · GIF' : ''}</span></div>
    <div class="pp-btns">${pics.length > 1 ? `<button class="gbtn" aria-label="Previous picture" data-act="pp-prev">‹</button><button class="gbtn" aria-label="Next picture" data-act="pp-next">›</button>` : ''}<button class="gbtn" aria-label="Remove this picture" data-act="pp-del">✕</button><button class="gbtn" aria-label="Close picture" data-act="pp-close">Done</button></div></div>`;
  if (!ppUrl.has(c.id)) ppEnsure({ pics: [c] }).then(() => { if (ppView && $('#ppv') && ppUrl.has(c.id)) ppOpen(ppView.pid, ppView.i); });
}
const ppClose = () => { ppView = null; const v = $('#ppv'); if (v) v.remove(); };

const loadingBox = () => '<div class="libload" role="status" aria-live="polite"><span class="libdots" aria-hidden="true"><i></i><i></i><i></i></span><span>Loading your music…</span></div>';
const emptyBox = () => Native.isNative && !tracks.length && libLoading ? loadingBox() : Native.isNative && !tracks.length ? `<div class="empty">No music yet. Pick the folder that holds your music (FLAC, MP3, AAC).</div><div class="actions"><button data-act="pickfolder">${I.folder}Choose music folder</button></div>` : '';

/* ---------- T23: sorting + A-Z index (rules in src/sortlist.js) ---------- */
const sortedSongs = () => sortTracks(tracks, set.sort.songs, trackAlbum);
const sortBar = list => `<button class="chip sortbtn" data-act="sortmenu" data-list="${list}">Sort: ${sortLabel(list, set.sort[list])}</button>`;
const sections = (items, letterFn, inner) => groupLetters(items, letterFn).map(([L, xs]) => `<section class="lsec" data-letter="${L}"><div class="letter">${L}</div>${inner(xs)}</section>`).join('');
const songsBody = () => { const m = set.sort.songs, rows = sortedSongs().map((t, i) => ({ t, i })), one = xs => xs.map(o => songRow(o.t, 'songs', o.i)).join('');
  if (isLettered(m)) return sections(rows, m === 'artist' ? o => letterOf(o.t.trackArtist || trackAlbum(o.t).artist, true) : o => letterOf(o.t.title), one);
  // BUG-7: Year / Date Added / Duration get section headers (no A-Z rail: those are not letters)
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], dm = d => (+d || 0) > 1e11 ? +d : (+d || 0) * 1000;
  const hf = m === 'year' ? o => String(+trackAlbum(o.t).year || 'No year') : m === 'added' ? o => { const d = dm(o.t.added); if (!d) return 'Unknown'; const x = new Date(d); return MON[x.getMonth()] + ' ' + x.getFullYear(); } : o => { const n = +o.t.dur || 0; return n >= 600 ? '10 min +' : n >= 300 ? '5 to 10 min' : n >= 180 ? '3 to 5 min' : 'Under 3 min'; };
  return sections(rows, hf, one); };
const hms = n => { n = Math.round(+n || 0); const h = Math.floor(n / 3600); return h ? `${h}:${String(Math.floor(n % 3600 / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}` : mmss(n); };
const albumsBody = () => { const m = set.sort.albums, f = m.split('_')[0], nOf = a => albumTracks(a.id).length, dOf = a => albumTracks(a.id).reduce((s, t) => s + (+t.dur || 0), 0), as = sortAlbums(albums, m, nOf, dOf);   // ONE continuous grid; the first album of each letter is the A-Z rail anchor
  // the value you sorted by is shown under the title (songs, length, year, date, composer)
  const extra = { songs: a => { const n = nOf(a); return `${n} ${n === 1 ? 'song' : 'songs'}`; }, dur: a => hms(dOf(a)), year: a => a.year || '', updated: a => a.added ? new Date(a.added).toLocaleDateString() : '', composer: a => a.composer || '' }[f];
  if (!isLettered(m)) return albumList(as, a => albumRow(a, '', extra ? extra(a) : ''));
  const lf = f === 'artist' ? a => letterOf(a.trackArtist || a.artist, true) : f === 'aartist' ? a => letterOf(a.artist, true) : f === 'composer' ? a => a.composer ? letterOf(a.composer) : '?' : a => letterOf(a.title), seen = new Set();
  return albumList(as, a => { const L = lf(a); const first = !seen.has(L); seen.add(L); return albumRow(a, first ? L : '', f === 'composer' ? extra(a) : ''); }); };
const artistsBody = () => { const m = set.sort.artists, row = a => `<button class="row grow" data-act="artist" data-id="${a}">${artistCov(a, 'thumb')}<span class="lbl" style="font-size:1.125rem">${a}</span><span class="cnt">${artistInfo(a).count}</span><span class="chev">${I.chev}</span></button>`, one = xs => xs.map(row).join('');
  if (!artists.length) return '<div class="empty">No artists yet.</div>';
  const names = sortArtists(artists, m, a => artistInfo(a).added); return isLettered(m) ? sections(names, a => letterOf(a, true), one) : one(names); };
function sortAction(act, d) {
  if (act === 'sortmenu') { const l = d.list, cur = set.sort[l];
    $('#sheet').innerHTML = sheetHtml(`<b>Sort ${l.charAt(0).toUpperCase() + l.slice(1)}</b>${SORT_OPTS[l].map(([v, t]) => `<button class="row" data-act="sortset" data-list="${l}" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === cur ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`); return true; }
  if (act === 'sortset') { set.sort[d.list] = cleanSort(d.list, d.v); applySettings(); closeSheet(); stack.length ? renderSub() : renderMain(); return true; }
  return false;
}
/* T25: Disc headers on albums with more than one disc */
const albumRows = (ts, id) => { const multi = new Set(ts.map(t => t.disc || 1)).size > 1;
  return ts.map((t, i) => (multi && (i === 0 || (t.disc || 1) !== (ts[i - 1].disc || 1)) ? `<div class="disc">Disc ${t.disc || 1}</div>` : '') + songRow(t, 'album:' + id, i, { idx: true })).join(''); };

const dayRng = (salt = 0) => { let s = Math.floor(Date.now() / 864e5) + 1 + salt * 7919; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const dailyPicks = () => { const r = dayRng(), a = tracks.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 30); };
/* v108: more on Home. Everything here is computed from the library, play counts and favorites (no network). */
const dayShuffle = (a, salt) => { const r = dayRng(salt); a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* v119: every hour has its own 210 messages (none shared with another hour). A new one is picked each time Home is built (never the same as last time) and when the hour changes; it stays put otherwise. */
let greetK = -1, greetH = -1, homePeriod = '', homeEditP = null, homeRen = null, homePinType = 'playlist', homeKeepGreet = false, homeTouchAt = 0, homeTimer = 0, apicHoldUntil = 0;   // homePeriod: the part of the day Home was built for; the rest is the Home screen settings page state
function greetPick() { const h = new Date().getHours(); let last = greetH === h ? greetK : -1; if (last < 0) { try { const o = JSON.parse(localStorage.getItem('lf.greetk') || '{}'); if (o.h === h) last = o.k; } catch {} } greetK = pickK(h, last); greetH = h; try { localStorage.setItem('lf.greetk', JSON.stringify({ h, k: greetK })); } catch {} }
const greet = fresh => { if (fresh || greetK < 0 || greetH !== new Date().getHours()) greetPick(); return greetingFor(greetH, set.userName, greetK); };
function refreshGreet() { document.querySelectorAll('.greetline').forEach(e => { const g = greet(); if (e.textContent !== g) e.textContent = g; }); }
setInterval(() => { if (!document.hidden) refreshGreet(); }, 30000);   // BUG-271: skip while hidden
/* v119: press and hold an artist card (Home Top Artists, Library) to change that artist's photo: your own picture or an album cover. */
{ let t = 0, x0 = 0, y0 = 0, card = null; const stop = () => { clearTimeout(t); t = 0; card = null; };
  document.addEventListener('pointerdown', e => { const c = e.target.closest && e.target.closest('.acard[data-act="artist"],.gtile[data-act="genre"],.grow[data-act="genre"]'); if (!c) return; card = c; x0 = e.clientX; y0 = e.clientY; clearTimeout(t); t = setTimeout(() => { if (!card) return; const id = card.dataset.id; stop(); apicHoldUntil = Date.now() + 700; if (c.dataset.act === 'genre') gpEdit(id); else apicEdit(id); }, 550); }, true);
  document.addEventListener('pointermove', e => { if (t && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) stop(); }, true);
  for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, stop, true);
  document.addEventListener('click', e => { if (Date.now() < apicHoldUntil) { e.stopPropagation(); e.preventDefault(); } }, true); }
/* v119: Home keeps itself up to date: after a song is counted, a heart is tapped or an artist photo changes, Home is rebuilt in place (same scroll spot, same greeting; it waits while you are touching the screen) */
document.addEventListener('pointerdown', () => { homeTouchAt = Date.now(); }, true);
function refreshHome(now) {
  if (tab !== 'home') return;
  clearTimeout(homeTimer);
  homeTimer = setTimeout(function go() {
    if (tab !== 'home') return;
    if (!now && !stack.length && Date.now() - homeTouchAt < 4000) { homeTimer = setTimeout(go, 2500); return; }
    const m = $('#main'); if (!m) return; const y = m.scrollTop;
    homeKeepGreet = true; try { morphHtml(m, screens.home()); } finally { homeKeepGreet = false; }   // v149: patched in place, Home no longer blinks on every refresh
    m.scrollTop = y;
  }, 800);
}
setInterval(() => { if (!document.hidden && tab === 'home' && !stack.length && set.home.tod && homePeriod && periodOf(new Date().getHours()) !== homePeriod) renderMain(); }, 30000);   // v119: a new part of the day builds its own Home
const artistsByPlays = () => { const m = new Map(); for (const t of tracks) { const st = stats[t.id]; if (!st) continue; for (const a of trackArtists(t)) m.set(a, (m.get(a) || 0) + st.plays); } return [...m].filter(([a]) => artistInfo(a).count > 0).sort((x, y) => y[1] - x[1]).map(x => x[0]); };
const artistCard = a => { return `<button class="card acard" data-act="artist" data-id="${a}">${artistCov(a)}<span class="t blk">${a}</span><span class="s blk">${pl(artistInfo(a).count, 'song')}</span></button>`; };
/* ---------- screens ---------- */
const screens = {
  home: () => { const rp = snap.recent = recentList(stats, tracks), tp = snap.top = topList(stats, tracks), fv = favTracks(favs, tracks), dy = snap.daily = dailyPicks();
    const sec = (t, body, more) => body ? `<div class="sechead"><h2 class="sec">${t}</h2>${more ? `<button class="seeall" data-act="lib" data-k="${more}">See All</button>` : ''}</div><div class="hscroll">${body}</div>` : '';   // v108: See All goes through "lib" (the old data-act=<name> had no handler)
    const sc = (ts, key) => ts.slice(0, set.home.count).map((t, i) => `<button class="card" data-act="play" data-list="${key}" data-i="${i}">${covT(t)}<span class="t blk">${t.title}</span><span class="s blk">${t.trackArtist || trackAlbum(t).artist}</span></button>`).join('');
    const top3 = artistsByPlays(), fav1 = top3[0];   // v108 sections
    const recentIds = new Set(rp.slice(0, 12).map(t => t.id));
    snap.because = fav1 ? dayShuffle(artistTracks(fav1).filter(t => !recentIds.has(t.id)), 1).slice(0, 20) : [];
    const month = Date.now() - 30 * 864e5;
    snap.forgot = dayShuffle(fv.filter(t => !stats[t.id] || stats[t.id].last < month), 2).slice(0, 20);
    const played = new Set(Object.keys(stats));
    const fresh = dayShuffle(albums.filter(a => { const ts = albumTracks(a.id); return ts.length && !ts.some(t => played.has(t.id)); }), 3).slice(0, 30);
    snap.fresh = fresh.map(a => a.id); snap.added = recentAlbums(30).map(a => a.id);
    /* v119: Apple Music style rows made from your own library: Heavy Rotation (albums played in the last 2 weeks), Favorites Mix, New Music Mix */
    const cut14 = Date.now() - 14 * 864e5, heavyList = []; for (const al of albums) { let n = 0; for (const t of albumTracks(al.id)) { const st = stats[t.id]; if (st && st.last >= cut14) n += st.plays; } if (n) heavyList.push([al, n]); }
    snap.favmix = dayShuffle(fv, 4).slice(0, 25); snap.newmix = dayShuffle(recentAlbums(12).flatMap(al => albumTracks(al.id)), 5).slice(0, 25);
    const hc = set.home, N = hc.count, T = (k, d) => hc.names[k] ? escH(hc.names[k]) : d;   // T: your own name for a section, or the normal one
    const plRow = playlists.length ? sec(T('playlists', 'Playlists'), playlists.slice(0, N).map(p => { const ts = plTracks(p); return `<button class="card" data-act="playlist" data-id="${p.id}">${plArt(p, ts)}<span class="t blk">${p.name}</span><span class="s blk">${pl(ts.length, 'song')}</span></button>`; }).join(''), 'playlists') : '';   // v119
    const last = rp[0], lastA = last && trackAlbum(last);
    const totalPlays = Object.values(stats).reduce((n, x) => n + (x && x.plays || 0), 0);
    const parts = {
      resume: last ? `<button class="resume" data-act="play" data-list="recent" data-i="0" aria-label="Continue ${escH(last.title)}">${covT(last)}<span class="rt"><em>${T('resume', 'Jump back in')}</em><b>${last.title}</b><span>${last.trackArtist || lastA.artist}</span></span><span class="rp">${I.play}</span></button>` : '',
      mystats: totalPlays || fv.length ? `<div class="mystats"><div><b>${totalPlays}</b><span>plays</span></div><div><b>${fv.length}</b><span>favorites</span></div><div><b>${playlists.length}</b><span>playlists</span></div>${fav1 ? `<div class="wide"><b>${fav1}</b><span>top artist</span></div>` : ''}</div>` : '',
      playlists: plRow,
      lstats: banHtml() + (lsx ? lsx.homeSection() : ''),
      daily: sec(T('daily', 'Recommended Today'), sc(dy, 'daily'), 'mix:daily'),
      heavy: heavyList.length ? sec(T('heavy', 'Heavy Rotation'), (snap.heavy = heavyList.sort((x, y) => y[1] - x[1]).map(x => x[0].id), heavyList).slice(0, N).map(x => albumCard(x[0])).join(''), 'alb:heavy') : '',
      favmix: snap.favmix.length ? sec(T('favmix', 'Favorites Mix'), sc(snap.favmix, 'favmix'), 'mix:favmix') : '',
      newmix: snap.newmix.length ? sec(T('newmix', 'New Music Mix'), sc(snap.newmix, 'newmix'), 'mix:newmix') : '',
      because: fav1 ? sec(T('because', 'Because You Listen To ' + fav1), sc(snap.because, 'because'), 'mix:because') : '',
      recent: sec(T('recent', 'Recently Played'), sc(rp, 'recent'), 'recentPlayed'),
      artists: sec(T('artists', 'Your Top Artists'), top3.slice(0, N).map(artistCard).join(''), 'artists'),
      top: sec(T('top', 'Most Played'), sc(tp, 'top'), 'topPlayed'),
      forgot: sec(T('forgot', 'Forgotten Favorites'), sc(snap.forgot, 'forgot'), 'mix:forgot'),
      fav: sec(T('fav', 'Favorites'), sc(fv, 'fav'), 'favorites'),
      discover: sec(T('discover', 'Discover Albums'), fresh.slice(0, N).map(a => albumCard(a)).join(''), 'alb:discover'),
      genres: genres.length > 1 ? `<div class="sechead"><h2 class="sec">${T('genres', 'Browse by Genre')}</h2><button class="seeall" data-act="lib" data-k="genres">See All</button></div><div class="genrechips">${genres.slice(0, 12).map(g => `<button class="chip" data-act="genre" data-id="${g.n}">${g.n}</button>`).join('')}</div>` : '',
      added: sec(T('added', 'Recently Added'), recentAlbums(N).map(a => albumCard(a)).join(''), 'alb:added')
    };
    /* v119: your own pinned sections (a playlist, an artist or an album) */
    const pinSec = (k, def, ts, list, act, id) => ts.length ? `<div class="sechead"><h2 class="sec">${T(k, def)}</h2><button class="seeall" data-act="${act}" data-id="${id}">See All</button></div><div class="hscroll">${sc(ts, list)}</div>` : '';
    for (const pn of hc.pins) {
      const k = pinKey(pn);
      if (pn.type === 'playlist') { const pp = findPlaylist(pn, playlists, unesc); parts[k] = pp ? pinSec(k, pp.name, plTracks(pp), 'pl:' + pp.id, 'playlist', pp.id) : ''; }
      else if (pn.type === 'custom') {   // v119: your own mix
        let si = 0; const seenA = new Set();
        const cards = pn.items.map(it => {
          if (it.t === 'album') { const a = findItem(it, albums, unesc); return a ? albumCard(a) : ''; }
          if (it.t === 'artist') { const nm = artistName(it.v); if (!nm || seenA.has(nm)) return ''; seenA.add(nm); return artistCard(nm); }   // an old spelling of a merged artist shows the artist under its current name
          const t = findItem(it, tracks, unesc); if (!t) return '';   // BUG-74: same name-aware lookup as the playable list
          return `<button class="card" data-act="play" data-list="cust:${pn.id}" data-i="${si++}">${covT(t)}<span class="t blk">${t.title}</span><span class="s blk">${t.trackArtist || trackAlbum(t).artist}</span></button>`;
        }).join('');
        parts[k] = cards ? sec(T(k, escH(pn.ref)), cards) : '';
      }
      else if (pn.type === 'artist') parts[k] = pinSec(k, artistName(pn.ref) || pn.ref, artistTracks(pn.ref), 'artist:' + pn.ref, 'artist', pn.ref);
      else { const al = findAlbum(pn, albums, unesc); parts[k] = al ? pinSec(k, al.title, albumTracks(al.id), 'album:' + al.id, 'album', al.id) : ''; }
    }
    /* v119: quick buttons: your order, your names, hide the ones you do not want */
    const QD = { shuffle: ['shuffleall', 'all', I.shuffle, true], mix: ['playall', 'daily', I.play, true], recent: ['playall', 'recent', I.recent, rp.length > 0], favs: ['shuffleall', 'fav', I.heart, fv.length > 0], top: ['playall', 'top', I.play, tp.length > 0] };
    const quickHtml = hc.qb.filter(k => !hc.qhidden.includes(k) && QD[k][3]).map(k => `<button class="chip" data-act="${QD[k][0]}" data-list="${QD[k][1]}">${QD[k][2]}${hc.qnames[k] ? escH(hc.qnames[k]) : QUICK.find(q => q[0] === k)[1]}</button>`).join('');
    homePeriod = periodOf(new Date().getHours());
    const hero = tracks.length ? `${hc.info ? `<p class="homesub">${pl(tracks.length, 'song')} · ${pl(albums.length, 'album')} · ${pl(artists.length, 'artist')}</p>` : ''}
      ${hc.quick && quickHtml ? `<div class="quick">${quickHtml}</div>` : ''}` : '';
    return `${header()}${hc.greet ? `<p class="greetline" aria-live="polite">${escH(greet(!homeKeepGreet))}</p>` : ''}${emptyBox()}${hero}
    ${hc.order.filter(k => !hiddenFor(hc, new Date().getHours()).includes(k)).map(k => parts[k] || '').join('')}`; },
  albums: () => `${header()}<h1 class="large">Albums</h1>${sortBar('albums')}${albumsBody()}`,
  library: () => `${header()}<h1 class="large">Library</h1>
    <div class="libgrid">${[['playlist', 'Playlists', 'playlists'], ['heart', 'Favorites', 'favorites'], ['recent', 'Recently Played', 'recentPlayed'], ['top', 'Most Played', 'topPlayed'], ['artist', 'Artists', 'artists'], ['album', 'Albums', 'albums'], ['song', 'Songs', 'songs'], ['genre', 'Genres', 'genres'], ['folder', 'Folders', 'folders']]
      .map(([ic, l, k]) => `<button class="row" data-act="lib" data-k="${k}"><span class="ic">${I[ic]}</span><span class="lbl">${l}</span><span class="chev">${I.chev}</span></button>`).join('')}</div>
    <h2 class="sec">Recently Added</h2><div class="hscroll">${recentAlbums(10).map(a => albumCard(a)).join('')}</div>`,
  search: () => `${header()}<h1 class="large">Search</h1>
    <label class="searchpill">${I.search}<input id="q" aria-label="Search" placeholder="Artists, Songs, Lyrics and more" autocomplete="off"></label>
    <div id="results"></div>`,
};
/* Lyrics can be very long now (no limit), so the decoded + lower-cased copy is made ONCE per song (not on every keystroke) and kept in a WeakMap
   (the track objects themselves stay clean, they are saved to disk). Re-made automatically if the song's lyric text changes. */
const lyCache = new WeakMap();
const lyOf = t => { const s = t.lyric || ''; let c = lyCache.get(t); if (!c || c.s !== s) { const dec = unesc(s); c = { s, dec, low: dec.toLowerCase() }; lyCache.set(t, c); } return c; };
function snip(t, q) { const { dec: s, low } = lyOf(t); let i = Math.max(0, low.indexOf(q)); if (i > 0 && low.length !== s.length) { let n = 0, k = 0; for (; k < s.length && n < i; k++) n += s[k].toLowerCase().length; i = k; } const a = Math.max(0, i - 30); return E((a ? '…' : '') + s.slice(a, a + 120) + (a + 120 < s.length ? '…' : '')); }   // B5: cut the DECODED text, escape afterwards; BUG #8: toLowerCase can change the length (U+0130), so the index found in `low` is mapped back into the decoded text
/* Search shows EVERY match. A long list is drawn in slices (one per frame) so a one-letter search never freezes the screen; a newer search cancels the old slices. */
let resTok = 0;
const RES_SLICE = 120;
const nextFrame = fn => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 16));
function results() {
  const q = query.trim().toLowerCase(), el = $('#results'); if (!el) return;
  const tok = ++resTok;   // a newer search cancels the slices of an older one
  if (!q) { const rc = set.recent; el.innerHTML = (rc.length ? `<div class="sechead"><h2 class="sec">Recent Searches</h2><button class="chip" data-act="recent-clear">Clear</button></div>${rc.map(x => `<button class="row" data-act="recent-q" data-q="${E(x)}"><span class="ic">${I.search}</span><span class="lbl" style="font-size:1.0625rem">${E(x)}</span></button>`).join('')}` : '') + `<h2 class="sec">Browse Library</h2><div class="genre-grid">${genres.map(g => `<button class="gtile${gpUrls[g.n] ? ' hasp' : ''}" style="--gc:var(${g.c})${gpUrls[g.n] ? `;--gpic:url('${gpUrls[g.n]}')` : ''}" data-act="genre" data-id="${g.n}">${g.n}<small>${pl(g.count, 'song')}</small></button>`).join('')}</div>`; return; }
  const A = artists.filter(a => has(a, q)), L = albums.filter(a => has(a.title + ' ' + a.artist, q)), PL = playlists.filter(p => has(p.name, q)), GN = genres.filter(g => has(g.n, q));
  const S = [], Ly = []; tracks.forEach((t, i) => { if (has(t.title, q)) S.push([t, i]); if (t.lyric && lyOf(t).low.includes(q)) Ly.push([t, i]); });   // B4: remember the index, no indexOf per result
  const secs = [];
  if (A.length) secs.push({ t: 'Artists', n: A.length, row: i => `<button class="row grow" data-act="artist" data-id="${A[i]}">${artistCov(A[i], 'thumb')}<span class="lbl" style="font-size:1.0625rem">${A[i]}</span><span class="chev">${I.chev}</span></button>` });
  if (L.length) secs.push({ t: 'Albums', n: L.length, wrap: true, row: i => albumRow(L[i]) });
  if (PL.length) secs.push({ t: 'Playlists', n: PL.length, row: i => { const p = PL[i]; return `<button class="row arow" data-act="playlist" data-id="${p.id}">${plArt(p, plTracks(p), 'thumb')}<span class="meta"><b>${p.name}</b><span>${pl(plTracks(p).length, 'song')}</span></span></button>`; } });   // v164: a playlist found in search shows its own picture, same as everywhere else
  if (GN.length) secs.push({ t: 'Genres', n: GN.length, row: i => `<button class="row grow" data-act="genre" data-id="${GN[i].n}">${genreCov(GN[i].n, 'thumb')}<span class="lbl" style="font-size:1.0625rem">${GN[i].n}</span><span class="cnt">${GN[i].count}</span><span class="chev">${I.chev}</span></button>` });   // v165: genres are searchable, each with its own picture
  if (S.length) secs.push({ t: 'Songs', n: S.length, row: i => songRow(S[i][0], 'all', S[i][1]) });
  if (Ly.length) secs.push({ t: 'Lyrics', n: Ly.length, row: i => { const [t, ix] = Ly[i]; return `<button class="row song" data-act="play" data-list="all" data-i="${ix}"><span class="thumb cover blk" style="--g:${gOfT(t)}"></span><span class="meta blk"><b>${t.title}</b><span>“${snip(t, q)}”</span></span></button>`; } });
  if (!secs.length) { el.innerHTML = `<div class="empty">No results for “${E(q)}”</div>`; return; }
  el.innerHTML = '';
  let si = 0, ri = 0, box = el;
  const step = () => {
    if (tok !== resTok || !el.isConnected) return;   // a newer search (or a new screen) took over
    let left = RES_SLICE;
    while (left > 0 && si < secs.length) {
      const sc = secs[si];
      if (ri === 0) { el.insertAdjacentHTML('beforeend', `<h2 class="sec">${sc.t}</h2>` + (sc.wrap ? '<div class="alist"></div>' : '')); box = sc.wrap ? el.lastElementChild : el; }
      const from = ri, to = Math.min(sc.n, ri + left); let html = '';
      for (let k = from; k < to; k++) html += sc.row(k);
      box.insertAdjacentHTML('beforeend', html); left -= to - from; ri = to;
      if (ri >= sc.n) { si++; ri = 0; }
    }
    if (si < secs.length) nextFrame(step);
  };
  step();
}
const sub = {
  album: id => { const a = byAlbum(id) || NOALBUM, ts = albumTracks(id);
    return `${header({ back: 1 })}<div class="dwrap"><div class="dhero"><div class="detail-art">${cov(a)}</div>
    <div class="detail-t"><b>${a.title}</b><div class="a">${a.artist}</div><div class="m">${[a.genre, a.year, ts[0] ? quality(ts[0]) : ''].filter(Boolean).join(' · ')}</div></div>
    <div class="actions"><button data-act="playall" data-list="album:${id}">${I.play}Play</button><button data-act="shuffleall" data-list="album:${id}">${I.shuffle}Shuffle</button></div>
    <div class="actions"><button data-act="alp-edit" data-id="${id}">Album picture or GIF</button></div></div>
    <div class="dbody">${albumRows(ts, id)}</div></div>`; },   // v221: .dwrap / .dhero / .dbody are display:contents in portrait (nothing changes); sideways the picture, title and buttons sit in a left column and the songs scroll on the right
  playlists: () => `${header({ back: 1, right: 'plus' })}<h1 class="large">Playlists</h1>${playlists.length ? `<div class="grid">${playlists.map(p => { const ts = plTracks(p); return `<button class="card" data-act="playlist" data-id="${p.id}">${plArt(p, ts)}<span class="t blk">${p.name}</span><span class="s blk">${pl(ts.length, 'song')}</span></button>`; }).join('')}</div>` : '<div class="empty">No playlists yet. Tap + to create one.</div>'}`,
  playlist: id => { const p = playlists.find(x => x.id === id); if (!p) return `${header({ back: 1 })}<div class="empty">Playlist not found.</div>`;
    const ts = plTracks(p);
    return `${header({ back: 1, right: 'plmenu' })}<div class="dwrap"><div class="dhero"><div class="detail-art">${plArt(p, ts)}</div><div class="detail-t"><b>${p.name}</b><div class="m">${pl(ts.length, 'song')}${plEdit ? ' · editing' : ''}</div></div>
    ${ts.length ? actions('pl:' + id) : ''}</div><div class="dbody">
    ${ts.length ? ts.map((t, i) => `<div class="plrow" data-dkind="pl" data-drow="${i}">${songRow(t, 'pl:' + id, i)}${plEdit ? `<div class="plctl"><button class="gbtn sm dh" data-drag="pl" aria-label="Drag to reorder">${I.grip}</button><button class="gbtn sm sr" aria-label="Move up" data-act="pl-up" data-i="${i}" ${i ? '' : 'disabled'}>↑</button><button class="gbtn sm sr" aria-label="Move down" data-act="pl-down" data-i="${i}" ${i < ts.length - 1 ? '' : 'disabled'}>↓</button><button class="gbtn sm" aria-label="Remove ${t.title} from playlist" data-act="pl-rm" data-i="${i}">✕</button></div>` : ''}</div>`).join('') : '<div class="empty">Empty playlist. Tap ⋯ then Add Songs.</div>'}</div></div>`; },
  favorites: () => { const ts = favSorted();
    return `${header({ back: 1 })}<h1 class="large">Favorites</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(ts.length, 'song')}</div></div>
    ${ts.length ? actions('fav') + '<div class="actions"><button data-act="fav-sort">Sort: ' + ({ new: 'Newest', title: 'Title', artist: 'Artist' }[favSort] || 'Newest') + '</button><button data-act="fav-clear">Unfavorite all</button></div>' + ts.map((t, i) => songRow(t, 'fav', i)).join('') : '<div class="empty">No favorites yet. Tap the heart on Now Playing, or ⋯ on any song.</div>'}`; },
  recentPlayed: () => { const ts = snap.recent = recentList(stats, tracks);
    return `${header({ back: 1 })}<h1 class="large">Recently Played</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(ts.length, 'song')}</div></div>
    ${ts.length ? actions('recent') + ts.map((t, i) => songRow(t, 'recent', i)).join('') : '<div class="empty">Nothing played yet. A song shows up here after you listen to it for 10 seconds.</div>'}`; },
  topPlayed: () => { const ts = snap.top = topList(stats, tracks);
    return `${header({ back: 1 })}<h1 class="large">Most Played</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(ts.length, 'song')}</div></div>
    ${ts.length ? actions('top') + ts.map((t, i) => songRow(t, 'top', i, { note: pl(stats[t.id].plays, 'play') })).join('') : '<div class="empty">Nothing played yet. Play counts start after 10 seconds of a song.</div>'}`; },
  mixAll: k => { const T = (key, d) => set.home.names[key] ? escH(set.home.names[key]) : d, ts = listOf(k), a1 = artistsByPlays()[0];
    const title = { daily: T('daily', 'Recommended Today'), favmix: T('favmix', 'Favorites Mix'), newmix: T('newmix', 'New Music Mix'), because: T('because', 'Because You Listen To ' + (a1 || '')), forgot: T('forgot', 'Forgotten Favorites') }[k] || 'Songs';   // v119: See All for every song row on Home
    return `${header({ back: 1 })}<h1 class="large">${title}</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(ts.length, 'song')}</div></div>
    ${ts.length ? actions(k) + ts.map((t, i) => songRow(t, k, i)).join('') : '<div class="empty">Nothing here yet.</div>'}`; },
  albHome: k => { const T = (key, d) => set.home.names[key] ? escH(set.home.names[key]) : d, ids = (k === 'heavy' ? snap.heavy : k === 'discover' ? snap.fresh : snap.added) || [], as = ids.map(id => albums.find(a => a.id === id)).filter(Boolean);
    const title = { heavy: T('heavy', 'Heavy Rotation'), discover: T('discover', 'Discover Albums'), added: T('added', 'Recently Added') }[k] || 'Albums';
    return `${header({ back: 1 })}<h1 class="large">${title}</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(as.length, 'album')}</div></div>${as.length ? albumList(as) : '<div class="empty">Nothing here yet.</div>'}`; },
  songs: () => `${header({ back: 1 })}<h1 class="large">Songs</h1>${sortBar('songs')}${songsBody()}`,
  artists: () => `${header({ back: 1 })}<h1 class="large">Artists</h1>${sortBar('artists')}${artistsBody()}`,
  genres: () => `${header({ back: 1 })}<h1 class="large">Genres</h1>${genres.length ? genres.map(g => `<button class="row grow" data-act="genre" data-id="${g.n}">${genreCov(g.n, 'thumb')}<span class="lbl" style="font-size:1.125rem">${g.n}</span><span class="cnt">${g.count}</span><span class="chev">${I.chev}</span></button>`).join('') : '<div class="empty">No genres yet.</div>'}`,
  genre: name => { const n = E(name), ts = genreTracks(n), as = genreAlbums(n);
    return `${header({ back: 1 })}<div class="dwrap"><div class="dhero"><div class="apic">${genreCov(n)}</div><h1 class="large">${n}</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(as.length, 'album')} · ${pl(ts.length, 'song')}</div></div>
    <div class="actions"><button data-act="gp-edit" data-id="${n}">Genre picture or GIF</button></div>
    ${ts.length ? actions('genre:' + n) : ''}</div><div class="dbody">${as.length ? `<h2 class="sec">Albums</h2>${albumList(as)}` : ''}
    <h2 class="sec">Songs</h2>${ts.map((t, i) => songRow(t, 'genre:' + n, i)).join('')}</div></div>`; },
  folder: path => { const p = E(path), { subs, files } = folderEntries(p);
    return `${header({ back: 1 })}<h1 class="large">${p ? p.split('/').pop() : 'Folders'}</h1>${p ? `<div class="detail-t" style="text-align:left"><div class="m">${p}</div></div>` : ''}
    ${subs.map(f => navRow('folder', f.path, 'folder', f.name, f.count)).join('')}
    ${files.length ? actions('folder:' + p) + files.map((t, i) => songRow(t, 'folder:' + p, i)).join('') : ''}
    ${!subs.length && !files.length ? '<div class="empty">No folders yet. Choose your music folder in Settings.</div>' : ''}`; },
  albumsAll: () => `${header({ back: 1 })}<h1 class="large">Albums</h1>${sortBar('albums')}${albumsBody()}`,
  artist: name => { const n = artistName(E(name)) || E(name), ts = artistTracks(n), ids = new Set(ts.map(t => t.albumId)), as = albums.filter(a => a.artist === n || ids.has(a.id)).sort((x, y) => (y.year || 0) - (x.year || 0));   // C3: albums they only feature on count too
    return `${header({ back: 1 })}<div class="dwrap"><div class="dhero"><div class="apic">${artistCov(n)}</div><h1 class="large">${n}</h1><div class="detail-t" style="text-align:left"><div class="m">${pl(as.length, 'album')} · ${pl(ts.length, 'song')}</div></div>
    <div class="actions"><button data-act="apic-edit" data-id="${n}">Artist photo or GIF</button></div>
    ${ts.length ? actions('artist:' + n) : ''}</div><div class="dbody">${as.length ? `<h2 class="sec">Albums</h2>${albumList(as)}` : ''}
    ${ts.length ? `<h2 class="sec">Songs</h2>${ts.map((t, i) => songRow(t, 'artist:' + n, i)).join('')}` : ''}</div></div>`; },
  homecustom: id => {   // v119: edit one of your own Home sections: name, items (order, remove) and a search to add albums, artists and songs
    const pn = set.home.pins.find(x => x.id === id && x.type === 'custom'), top = t => `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">${t}</b><span style="width:44px"></span></div>`;
    if (!pn) return top('Your section') + '<div class="empty">This section was removed.</div>';
    const k = pinKey(pn), title = set.home.names[k] ? escH(set.home.names[k]) : escH(pn.ref), n = pn.items.length;
    const what = it => { if (it.t === 'album') { const a = findItem(it, albums, unesc); return a ? [a.title, 'Album · ' + a.artist] : ['Missing album', 'Album']; } if (it.t === 'artist') return [artistName(it.v) || it.v, 'Artist · ' + pl(artistInfo(it.v).count, 'song')]; const t = tracks.find(x => x.id === it.v); return t ? [t.title, 'Song · ' + (t.trackArtist || trackAlbum(t).artist)] : ['Missing song', 'Song']; };
    const ar = (it, i) => { const a = `data-p="${pn.id}" data-t="${it.t}" data-v="${it.v}"`; return `<button class="gbtn sm" data-act="hs-cup" ${a} ${i === 0 ? 'disabled' : ''} aria-label="Move up"><svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg></button><button class="gbtn sm" data-act="hs-cdn" ${a} ${i === n - 1 ? 'disabled' : ''} aria-label="Move down"><svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg></button>`; };
    const rows = pn.items.map((it, i) => { const [a, b] = what(it); return `<div class="setrow hsrow"><div class="tx"><b>${a}</b><span>${b}</span><span class="hsacts"><button class="chip" data-act="hs-crm" data-p="${pn.id}" data-t="${it.t}" data-v="${it.v}">Remove</button></span></div>${ar(it, i)}</div>`; }).join('');
    const seg = cur => `<div class="hsseg">${[['album', 'Albums'], ['artist', 'Artists'], ['song', 'Songs']].map(([v, l]) => `<button class="chip ${cur === v ? 'sel' : ''}" data-act="hs-ctype" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `${top(title)}
    <div class="sethead">Name</div><div class="setcard"><div class="setrow"><input class="hsren" id="hscname" type="text" maxlength="30" value="${title}" autocomplete="off" aria-label="Section name"><button class="chip sel" data-act="hs-cname" data-p="${pn.id}">Save</button></div></div>
    <div class="sethead">In this section (${n})</div><div class="setcard">${rows || '<div class="setrow"><div class="tx"><span>Nothing here yet. Add albums, artists or songs below.</span></div></div>'}</div>
    <div class="sethead">Add to this section</div><div class="setcard"><div class="setrow">${seg(homeCType)}</div>
      <div class="setrow"><input class="hsren" id="hscq" type="search" value="${escH(homeCQ)}" placeholder="${homeCType === 'song' ? 'Search a song or artist' : 'Search'}" autocomplete="off" aria-label="Search to add"></div>
      <div id="hscres">${custResults(pn)}</div></div>`;
  },
  homeset: () => {
    const hc = set.home, tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="hs-opt" data-k="${k}" aria-label="${k}"></button>`;
    const nowP = periodOf(new Date().getHours()), editP = homeEditP || nowP, pinned = new Set(hc.pins.map(x => x.type + '|' + x.ref));
    const info = Object.fromEntries(SECTIONS.map(x => [x[0], [x[1], x[2]]]));
    for (const pn of hc.pins) {   // v119: a pinned section is named after the thing you pinned
      const k = pinKey(pn), pp = pn.type === 'playlist' ? findPlaylist(pn, playlists, unesc) : pn.type === 'album' ? findAlbum(pn, albums, unesc) : null;
      if (pn.type === 'custom') { info[k] = [escH(pn.ref), 'Your own section · ' + pl(pn.items.length, 'item')]; continue; }
      info[k] = [pn.type === 'playlist' ? (pp ? pp.name : 'Missing playlist') : pn.type === 'album' ? (pp ? pp.title : 'Missing album') : pn.ref, 'Your pinned ' + pn.type];
    }
    const seg = (act, opts, cur) => `<div class="hsseg">${opts.map(([v, l]) => `<button class="chip ${String(cur) === String(v) ? 'sel' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const arrows = (up, dn, k, i, n, label) => `<button class="gbtn sm" data-act="${up}" data-k="${k}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${label} up"><svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg></button><button class="gbtn sm" data-act="${dn}" data-k="${k}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${label} down"><svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg></button>`;
    /* one row: the name (yours or the normal one), small buttons for Rename (and Remove for pins); while renaming it turns into a text box */
    const label = (kind, k, def, custom, desc, extra = '') => homeRen && homeRen.kind === kind && homeRen.k === k
      ? `<div class="tx"><b>${def}</b><input class="hsren" id="hsren" type="text" maxlength="30" value="${escH(custom || '')}" placeholder="${def}" autocomplete="off" aria-label="New name for ${def}"><span class="hsacts"><button class="chip sel" data-act="hs-rensave">Save</button>${custom ? '<button class="chip" data-act="hs-renrm">Normal name</button>' : ''}<button class="chip" data-act="hs-rencancel">Cancel</button></span></div>`
      : `<div class="tx"><b>${custom ? escH(custom) : def}</b><span>${custom ? 'Normally: ' + def : desc}</span><span class="hsacts"><button class="chip" data-act="hs-ren" data-kind="${kind}" data-k="${k}">Rename</button>${extra}</span></div>`;
    const opts = { playlist: playlists.map(x => [x.id, x.name]), album: albums.map(x => [x.id, x.title + ' - ' + x.artist]), artist: artists.map(x => [x, x]) }[homePinType].filter(([v]) => !pinned.has(homePinType + '|' + v)).sort((x, y) => String(x[1]).localeCompare(String(y[1])));
    const pickRow = hc.pins.length >= MAX_PINS ? `<div class="setrow"><div class="tx"><span>You have ${MAX_PINS} pinned sections, the most there can be. Remove one to add another.</span></div></div>`
      : opts.length ? `<div class="setrow"><select class="hsren" id="hspin" aria-label="Choose what to pin">${opts.map(([v, l]) => `<option value="${escH(v)}">${l}</option>`).join('')}</select><button class="chip sel" data-act="hs-pinadd">Add</button></div>`
      : `<div class="setrow"><div class="tx"><span>Nothing left to pin here.</span></div></div>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Home screen</b><span style="width:44px"></span></div>
    <div class="sethead">Greeting and shortcuts</div><div class="setcard">
      <div class="setrow"><div class="tx"><b>Greeting</b><span>The hourly message with your name.</span></div>${tg('greet', hc.greet)}</div>
      <div class="setrow"><div class="tx"><b>Library counts</b><span>Songs, albums and artists under the greeting.</span></div>${tg('info', hc.info)}</div>
      <div class="setrow"><div class="tx"><b>Quick buttons</b><span>The row of buttons under the greeting.</span></div>${tg('quick', hc.quick)}</div></div>
    <div class="sethead">Quick buttons: order, names, show or hide</div><div class="setcard">${hc.qb.map((k, i) => { const def = QUICK.find(q => q[0] === k)[1]; return `<div class="setrow hsrow">${label('q', k, def, hc.qnames[k], hc.qhidden.includes(k) ? 'Hidden' : 'Shown')}${arrows('hs-qup', 'hs-qdn', k, i, hc.qb.length, def)}<button class="toggle ${hc.qhidden.includes(k) ? '' : 'on'}" data-act="hs-qtg" data-k="${k}" aria-label="Show ${def}"></button></div>`; }).join('')}</div>
    <div class="sethead">Time of day</div><div class="setcard">
      <div class="setrow"><div class="tx"><b>A different Home for each part of the day</b><span>Pick which sections show in the morning, afternoon, evening and night.</span></div><button class="toggle ${hc.tod ? 'on' : ''}" data-act="hs-tod" aria-label="Different Home by time of day"></button></div>
      ${hc.tod ? `<div class="setrow">${seg('hs-per', PERIODS.map(x => [x[0], x[1]]), editP)}</div><div class="setrow"><div class="tx"><span>Editing ${PERIODS.find(x => x[0] === editP)[1]} (${PERIODS.find(x => x[0] === editP)[2]}). The switches in Sections below change only this part of the day.${editP === nowP ? ' It is this part of the day now.' : ''}</span></div></div>` : ''}</div>
    <div class="sethead">Artist photos</div><div class="setcard"><div class="setrow"><div class="tx"><b>Change an artist photo</b><span>On Home, press and hold an artist in Your Top Artists, then choose your own photo, a GIF or an album cover. You can also do it from the artist screen with the Artist photo or GIF button.</span></div></div></div>
    <div class="sethead">Cards per row</div><div class="setcard"><div class="setrow">${seg('hs-count', COUNTS.map(n => [n, n]), hc.count)}</div></div>
    <div class="sethead">Card size</div><div class="setcard"><div class="setrow">${seg('hs-card', [['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']], hc.card)}</div></div>
    <div class="sethead">Sections: show, hide, reorder, rename</div><div class="setcard">${hc.order.map((k, i) => { const nmx = info[k][0]; return `<div class="setrow hsrow">${label('s', k, nmx, hc.names[k], info[k][1], k.startsWith('pin:') ? (hc.pins.some(x => pinKey(x) === k && x.type === 'custom') ? `<button class="chip sel" data-act="hs-cedit" data-k="${k}">Edit items</button>` : '') + `<button class="chip" data-act="hs-pinrm" data-k="${k}">Remove</button>` : '')}${arrows('hs-up', 'hs-dn', k, i, hc.order.length, nmx)}<button class="toggle ${isHiddenFor(hc, k, editP) ? '' : 'on'}" data-act="hs-tg" data-k="${k}" aria-label="Show ${nmx}"></button></div>`; }).join('')}</div>
    <div class="sethead">Your own sections</div><div class="setcard">
      <div class="setrow"><div class="tx"><b>Pin to Home</b><span>A playlist, an artist or an album gets its own row (up to ${MAX_PINS}). It shows in the Sections list above, where you can move, rename or hide it.</span></div></div>
      <div class="setrow">${seg('hs-pintype', [['playlist', 'Playlist'], ['artist', 'Artist'], ['album', 'Album']], homePinType)}</div>${pickRow}
      <div class="setrow"><div class="tx"><b>Create your own section</b><span>Give it a name, then fill it with any albums, artists and songs you like. It shows up in the Sections list above.</span></div></div>
      ${hc.pins.length >= MAX_PINS ? '' : `<div class="setrow"><input class="hsren" id="hscnew" type="text" maxlength="30" placeholder="Name, for example Gym songs" autocomplete="off" aria-label="Name of your new section"><button class="chip sel" data-act="hs-cnew">Create</button></div>`}</div>
    <div class="setcard"><button class="setrow" data-act="hs-reset" style="width:100%;text-align:left"><span class="tx"><b>Reset Home screen</b><span>Back to the original layout. Removes pinned sections and your own names.</span></span></button></div>`;
  },
  bgset: () => {
    const on = !!bgUrl, seg = (act, opts, cur) => `<div class="hsseg">${opts.map(([v, l]) => `<button class="chip ${String(cur) === String(v) ? 'sel' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Background</b><span style="width:44px"></span></div>
    <div class="sethead">Picture or GIF</div><div class="setcard">
      <div class="setrow"><div class="tx"><b>${on ? 'Your background' : 'No background yet'}</b><span>${on ? 'Shown behind Home, every tab, Settings, Now Playing and the lyrics.' : 'Choose any picture or GIF, of any size. It is kept exactly as it is, on this phone only.'}</span></div></div>
      ${on ? `<div class="setrow"><div class="bgprev" id="bgprev" aria-hidden="true"></div></div>` : ''}
      <button class="setrow" data-act="bgpick" style="width:100%;text-align:left"><span class="tx"><b>${on ? 'Choose another picture or GIF' : 'Choose a picture or GIF'}</b></span>${I.chev}</button>
      ${on ? `<button class="setrow" data-act="bgrm" style="width:100%;text-align:left"><span class="tx"><b>Back to default</b><span>Plain black. The picture file is deleted.</span></span></button>` : ''}</div>
    ${on ? `<div class="sethead">Look</div><div class="setcard">
      <div class="setrow">${seg('bgfit', [['fill', 'Fill screen'], ['fit', 'Fit whole picture']], cleanFit(set.bgFit))}</div>
      <div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Darken<span style="float:right;color:var(--text-2)" data-bgdimv>${set.bgDim}%</span></b><span>Makes text and buttons easier to read on a bright picture.</span><input type="range" data-bgdim min="${BG_DIM_MIN}" max="${BG_DIM_MAX}" step="1" value="${set.bgDim}" aria-label="Darken the background" style="width:100%;margin:10px 0 2px;accent-color:var(--accent);touch-action:pan-y"></div></div></div>` : ''}`;
  },
  animation: () => {
    const tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="tg" data-k="${k}"></button>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Animation</b><span style="width:44px"></span></div>
    <div class="animdock"><div class="demostage"><nav class="tabbar demobar" id="demobar" aria-label="Test bar">${tabsHtml('data-demo')}</nav></div>
      <div class="animdock-r"><span>Test bar: same glass and pill as the real one.</span>${tg('redHover', set.redHover !== false)}</div>
      <div class="animchips"><button class="chip" data-act="anim-preset" data-p="default">Default</button><button class="chip" data-act="anim-preset" data-p="watery">Watery</button><button class="chip" data-act="anim-preset" data-p="max">Max liquid</button><button class="chip" data-act="anim-preset" data-p="calm">Calm</button></div>
      <div class="animdock-s"><b>Glass bar size<em data-tabv>${set.tabPct}%</em></b><input type="range" data-tabpct min="${TAB_MIN}" max="${TAB_MAX}" step="1" value="${set.tabPct}" aria-label="Glass bar size"><span>The test bar above and the real glass bars keep this size.</span><button class="chip" data-act="tabreset" style="margin-top:8px">Reset</button></div></div>
    <div class="setcard">${ANIM_DEFS.map(d => `<div class="animrow"><b>${d.label}<em data-av="${d.k}">${Math.round(set.anim[d.k])}%</em></b><input type="range" data-ak="${d.k}" min="${d.min}" max="${d.max}" step="5" value="${set.anim[d.k]}" aria-label="${d.label}"></div>`).join('')}</div>`;
  },
  lysize: () => `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Lyrics size</b><span style="width:44px"></span></div>
    <div class="setcard"><div class="animrow"><b>Text size<em data-lypxv>${lyName(set.lyricPx)}</em></b><input type="range" data-lypx min="${LY_MIN}" max="${LY_MAX}" step="1" value="${set.lyricPx}" aria-label="Lyrics text size in pixels"><span style="display:block;color:var(--text-2);font-size:0.8125rem;margin-top:2px">Drag to choose your own size (${LY_MIN} to ${LY_MAX} px). Medium, the default, is ${LY_DEF} px.</span></div>
      <div class="setrow"><div class="tx"><p class="ln" style="margin:4px 0;color:var(--accent)">I\'ll risk it all for you</p><p class="ln" style="margin:4px 0;color:var(--accent);opacity:.6">I want you next to me</p></div></div>
      <button class="setrow" data-act="lysize-reset" style="width:100%;text-align:left"><span class="tx"><b>Reset to Medium</b><span>${LY_DEF} px</span></span></button></div>`,
  lyranim: () => {
    const sample = ['Under the lights, I open my heart', 'One step forward, the whole room sings', 'Stage lights, stay with me tonight', 'Every smile a promise I keep', 'Ruby red across the stage', 'Stay close, the music is ours', 'Hold the beat and never look away'];
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Lyrics animation</b><span style="width:44px"></span></div>
    <div class="animdock"><div class="lyr lyprev"><div class="lyprevbody" aria-hidden="true">${sample.map((t, i) => `<p class="ln tap${i === 0 ? ' cur' : ''}" data-li="${i}" style="--d:${Math.min(5, i)}">${t}</p>`).join('')}</div></div>
      <div class="animdock-r"><span>Live preview: it uses your Background style and moves like the real lyrics.</span></div>
      <div class="animchips"><button class="chip" data-act="lya-preset" data-p="default">Default</button><button class="chip" data-act="lya-preset" data-p="smooth">Smooth</button><button class="chip" data-act="lya-preset" data-p="snappy">Snappy</button><button class="chip" data-act="lya-preset" data-p="blurry">Blurry</button><button class="chip" data-act="lya-preset" data-p="still">Minimal</button></div></div>
    <div class="setcard">${LYA_DEFS.map(d => `<div class="animrow"><b>${d.label}<em data-lyv="${d.k}">${Math.round(set.lyAnim[d.k])}%</em></b><input type="range" data-lyk="${d.k}" min="${d.min}" max="${d.max}" step="1" value="${set.lyAnim[d.k]}" aria-label="${d.label}"><span style="display:block;color:var(--text-2);font-size:0.8125rem;margin-top:2px">${d.hint}</span></div>`).join('')}</div>`;
  },
  settings: () => {
    const row = (t, d, right = '') => `<div class="setrow"><div class="tx"><b>${t}</b>${d ? `<span>${d}</span>` : ''}</div>${right}</div>`;
    const tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="tg" data-k="${k}"></button>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Settings</b><span style="width:44px"></span></div>
    <div class="setcols"><div class="profile"><button class="pfmain" data-act="pfpick" aria-label="Choose profile picture, GIF or video"><span class="avatar">${pfHtml() || '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4.5 20c.9-4 4-6 7.5-6s6.6 2 7.5 6"/></svg>'}</span></button>
      ${set.userName && !nameEdit ? `<button class="tx pfnamebtn" data-act="nameedit" aria-label="Your name is ${escH(set.userName)}. Tap to change it"><b>${escH(set.userName)}</b><span>Tap your name to change it</span></button>`
        : `<span class="tx"><b>${set.userName ? 'Change your name' : 'Your name'}</b><span>Shown in the Home greeting. Tap the circle for a photo, GIF or video.</span><input class="pfname" id="pfname" type="text" maxlength="24" value="${escH(set.userName || '')}" placeholder="Type your name" autocomplete="given-name" autocapitalize="words" aria-label="Your name, shown in the Home greeting"><span class="pfbtns"><button class="chip sel" data-act="name-save">Save</button>${set.userName ? '<button class="chip" data-act="name-cancel">Cancel</button><button class="chip" data-act="name-rm">Remove name</button>' : ''}</span></span>`}${pfHtml() ? '<button class="chip" data-act="pfrm">Remove</button>' : ''}</div>
    <div class="sethead">Display</div><div class="setcard">
      ${row('Motion', 'Reduce Motion turns glide and jelly into plain fades.', tg('motion', set.motion))}
      ${row('Bigger album covers', 'Larger covers in album grids, the Home rows and Now Playing.', tg('bigCovers', set.bigCovers))}
      ${row('Increase Contrast', 'Increase color contrast between app foreground and background colors.', tg('contrast', set.contrast))}
      <button class="setrow" data-act="bgopen" style="width:100%;text-align:left"><span class="tx"><b>Background picture or GIF</b><span>${bgUrl ? 'Your picture is on every screen.' : 'Use any picture or GIF, of any size, behind the whole app.'}</span></span>${I.chev}</button></div>
    <div class="sethead">Tab bar</div><div class="setcard">
      <div class="setrow"><div class="tx"><span>Choose which icons the glass bar at the bottom shows. Add Settings as a fifth icon, then slide the glass bubble onto it and let go to open Settings. At least one of Home, Albums, Library or Search stays on.</span></div></div>
      ${TAB_DEFS.map(([k, l]) => `<div class="setrow"><span class="tabico" aria-hidden="true">${I[k]}</span><div class="tx"><b>${l}</b>${k === 'settings' ? '<span>Off by default. The Settings button at the top of each page stays either way.</span>' : ''}</div><button class="toggle ${set.tabs[k] ? 'on' : ''}" data-act="tabtg" data-k="${k}" aria-label="Show ${l} in the tab bar"></button></div>`).join('')}</div>
    <div class="sethead">Now Playing</div><div class="setcard">
      <div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Now Playing cover size<span style="float:right;color:var(--text-2)"><input type="number" data-npnum min="${NPC_MIN}" max="${NPC_MAX}" value="${set.npCover || 100}" inputmode="numeric" aria-label="Cover size in percent" style="width:58px;background:transparent;border:0;border-bottom:1px solid var(--text-2);color:inherit;text-align:right;font:inherit"> %</span></b><span>Size of the album cover while a song plays. ${set.npCover ? '' : 'Now: automatic.'}</span>
        <div class="npprev" aria-hidden="true"><div class="npprev-art"><span class="cover blk" style="--g:${(Native.current() ? gOfT(Native.current()) : 'linear-gradient(135deg,#3a4a5a,#10161c)')}"></span></div><i></i><i class="s"></i></div>
        <input type="range" data-nprange min="${NPC_MIN}" max="${NPC_MAX}" step="1" value="${set.npCover || 100}" aria-label="Now Playing cover size" style="width:100%;margin:10px 0 2px;accent-color:var(--accent);touch-action:pan-y"></div><button class="chip" data-act="npreset" style="margin-left:12px">Reset</button></div>
      ${row('Immersive album cover', 'Now Playing shows the album cover across the whole screen, fading into the cover\'s colour behind the song name and the controls (Apple Music style). Off = the cover sits in a rounded square.', tg('npImmersive', !!set.npImmersive))}
      <button class="setrow" data-act="timestyle" style="width:100%;text-align:left"><span class="tx"><b>Playing bar time</b><span>${TIME_STYLES[cleanTimeStyle(set.timeStyle)]}</span></span>${I.chev}</button></div>
    <div class="sethead">Shortcuts</div><div class="setcard">
      <div class="setrow"><div class="tx"><span>On Now Playing, the cover has three shortcuts. Tap = one tap. Press and hold = hold it for about half a second. Double tap = two quick taps. Choose what each one does, or Off. Album and Artist use the song that is playing.</span></div></div>
      <button class="setrow" data-act="gest-pick" data-g="tap" style="width:100%;text-align:left"><span class="tx"><b>Tap the cover</b><span>Now: ${GEST_LBL[gestAct('tap')]}</span></span>${I.chev}</button>
      <button class="setrow" data-act="gest-pick" data-g="long" style="width:100%;text-align:left"><span class="tx"><b>Press and hold the cover</b><span>Now: ${GEST_LBL[gestAct('long')]}</span></span>${I.chev}</button>
      <button class="setrow" data-act="gest-pick" data-g="double" style="width:100%;text-align:left"><span class="tx"><b>Double tap the cover</b><span>Now: ${GEST_LBL[gestAct('double')]}</span></span>${I.chev}</button>
      ${row('Tap cover shows original', 'On Now Playing, tapping the cover opens it full screen. On = it shows the original cover from the music file. Off = it shows only your own picture or GIF for that song or album (if you set one). Everywhere else, your own picture or GIF is always shown, even when tapped.', tg('npTapOrig', set.npTapOrig !== false))}
      <button class="setrow" data-act="gest-reset" style="width:100%;text-align:left"><span class="tx"><b>Reset shortcuts</b><span>Tap = full-screen cover, press and hold = lyrics, double tap = album.</span></span></button></div>
    <div class="sethead">Lyrics</div><div class="setcard">
      <button class="setrow" data-act="lyricstyle" style="width:100%;text-align:left"><span class="tx"><b>Background style</b><span>${LYSTYLE[lyStyleKey()]}</span></span>${I.chev}</button>
      <button class="setrow" data-act="lyricink" style="width:100%;text-align:left"><span class="tx"><b>Lyrics text colour</b><span>${LYINK[set.lyricInk] || LYINK.auto}</span></span>${I.chev}</button>
      <button class="setrow" data-act="lyricsize" style="width:100%;text-align:left"><span class="tx"><b>Text size</b><span>Text size: ${lyName(cleanLyPx(set.lyricPx, set.lyricSize))}</span></span>${I.chev}</button>
      <button class="setrow" data-act="lyranimopen" style="width:100%;text-align:left"><span class="tx"><b>Lyrics animation</b><span>Glide, fade, size, brightness and blur of the lyric lines.</span></span>${I.chev}</button></div>
    <div class="sethead">Home</div><div class="setcard">
      <button class="setrow" data-act="homeopen" style="width:100%;text-align:left"><span class="tx"><b>Home screen</b><span>Choose which sections show, their order, card size and the greeting.</span></span>${I.chev}</button></div>
    <div class="sethead">Animation</div><div class="setcard">
      ${row('Lens refraction', 'The tab bubble bends the picture behind its rim, like thick glass. Turn off if the bar feels slow.', tg('refract', set.refract))}
      <button class="setrow" data-act="animopen" style="width:100%;text-align:left"><span class="tx"><b>Liquid glass &amp; wobble</b><span>Open the animation studio: Glass bar size, liquid wobble and presets. The test bar stays pinned while you change them.</span></span>${I.chev}</button></div>
    <div class="sethead">Playback</div><div class="setcard">${row('Autoplay', 'Add similar songs from your library when the queue runs out.', tg('autoplay', set.autoplay))}
      <button class="setrow" data-act="eqopen" style="width:100%;text-align:left"><span class="tx"><b>Equalizer</b><span>Opens your phone's own equalizer: Dirac Audio Tuner on OnePlus, Real Sound Technology on OPPO and Realme, and the phone's own sound effects page on other phones (Samsung, Vivo...). Any sound effect changes the sound, so it is no longer bit-perfect.</span></span>${I.chev}</button></div>
    <div class="sethead">Bluetooth</div><div class="setcard">
      <button class="setrow" data-act="btopen" style="width:100%;text-align:left"><span class="tx"><b>Bluetooth devices</b><span>Opens Bluetooth settings. A device that connects shows up here.</span></span>${I.chev}</button>
      ${bt.length ? bt.map(d => row(escH(d.name), 'Connected' + (typeof d.battery === 'number' ? ' · Battery ' + d.battery + '%' : ''))).join('') : row('No device connected', '')}</div>
    <div class="sethead">Library</div><div class="setcard">
      ${row('Album details', 'Show the artist and song count under each album name. Turn off to see only covers and album names.', tg('albumInfo', set.albumInfo !== false))}
      ${row('Smart artist grouping', 'Merges different spellings of one artist (Lily Rose Depp / Lily-Rose Depp, The Weeknd / Weeknd) and lists each artist of a collab or feat. song on their own page instead of a combined name. Turn off to see artists exactly as tagged.', tg('smartArtists', set.smartArtists !== false))}${row('Check for new music automatically', 'Looks for added or removed songs when the app opens or comes back (at most every 10 minutes).', tg('autoCheck', set.autoCheck))}
      <button class="setrow" data-act="pickfolder" style="width:100%;text-align:left"><span class="tx"><b>Music folder</b><span>Choose or change the folder with your music (FLAC, MP3, AAC)</span></span></button>
      <button class="setrow" data-act="rescan" style="width:100%;text-align:left"><span class="tx"><b>Rescan library</b></span></button>
      <button class="setrow" data-act="refresh-art" style="width:100%;text-align:left"><span class="tx"><b>Refresh art</b><span>Reloads every picture and GIF you set (songs, albums, artists, genres, playlists, profile, background) and re-checks the folder pictures of every song.</span></span></button>
      <button class="setrow" data-act="stats-clear" style="width:100%;text-align:left"><span class="tx"><b>Clear play history</b><span>Empties Recently Played and Most Played. Favorites and playlists stay.</span></span></button></div>
    <div class="sethead">Backup &amp; transfer</div><div class="setcard">
      <button class="setrow" data-act="plexport" style="width:100%;text-align:left"><span class="tx"><b>Export playlists</b><span>Save playlists as a backup, M3U8, XSPF or CSV. Other players and Spotify / Apple Music transfer tools can read them.</span></span>${I.chev}</button>
      <button class="setrow" data-act="plimport" style="width:100%;text-align:left"><span class="tx"><b>Import playlists</b><span>From a Liquid backup or any app: M3U / M3U8, PLS, XSPF, CSV (Spotify, Apple Music, Soundiiz, Exportify) or Spotify's data download. Yours are kept.</span></span>${I.chev}</button>
      <button class="setrow" data-act="lsexport" style="width:100%;text-align:left"><span class="tx"><b>Export listening data</b><span>Your play history as a Liquid or Tempo backup, Last.fm CSV, scrobbler log, ListenBrainz, Spotify-style JSON or CSV.</span></span>${I.chev}</button>
      <button class="setrow" data-act="lsimport" style="width:100%;text-align:left"><span class="tx"><b>Import listening data</b><span>Liquid or Tempo backup, Last.fm, ListenBrainz, Spotify, YouTube Music, Apple Music, Maloja, .scrobbler.log, CSV; .zip files too. Adds to your history; nothing is counted twice.</span></span>${I.chev}</button>
      <button class="setrow" data-act="setexport" style="width:100%;text-align:left"><span class="tx"><b>Export settings</b><span>Every setting: lyric size and animation, liquid glass, tab bar, Home layout, background look, profile photo and the rest, in one file. Big pictures, GIFs and videos are not in it.</span></span>${I.chev}</button>
      <button class="setrow" data-act="setimport" style="width:100%;text-align:left"><span class="tx"><b>Import settings</b><span>Put a saved settings file back, e.g. after reinstalling the app.</span></span>${I.chev}</button></div>
    <div class="sethead">Performance</div><div class="setcard">${dev && (dev.cores || dev.ramMb) ? `${row('Processor', escH(dev.processor || 'Unknown') + (dev.abi ? ' · ' + escH(dev.abi) : ''))}${row('CPU threads', '<em id="lf-cpu" style="font-style:normal">' + cpuText(dev) + '</em>')}${row('Memory (RAM)', '<em id="lf-ram" style="font-style:normal">' + ramText(dev) + '</em>')}` : row('Reading this phone…', '')}</div>
    <div class="sethead">Widgets</div><div class="setcard">
      <button class="setrow" data-act="addwidget" data-kind="" style="width:100%;text-align:left"><span class="tx"><b>Add Now Playing widget</b><span>Song, artist and play / pause / next / previous</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="albums" style="width:100%;text-align:left"><span class="tx"><b>Add Albums widget</b><span>Album covers, tap to open Albums</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="artists" style="width:100%;text-align:left"><span class="tx"><b>Add Artists widget</b><span>Artist covers, tap to open Artists</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="shuffle" style="width:100%;text-align:left"><span class="tx"><b>Add Shuffle all widget</b><span>One tap shuffles your whole library</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="search" style="width:100%;text-align:left"><span class="tx"><b>Add Search widget</b><span>Jump straight to Search</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="favorites" style="width:100%;text-align:left"><span class="tx"><b>Add Favorites widget</b><span>Open your favorite songs</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="recent" style="width:100%;text-align:left"><span class="tx"><b>Add Recently Played widget</b><span>Open your recently played songs</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="playlists" style="width:100%;text-align:left"><span class="tx"><b>Add Playlists widget</b><span>Open your playlists</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="statsday" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: Today widget</b><span>Small: time listened today, songs, top artist, day / night</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="statsweek" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: This week widget</b><span>Wide: week total, songs, top artist and song, day / night</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="statsmonth" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: This month widget</b><span>Wide: month total, songs, top artist and song, day / night</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="nowplaying" style="width:100%;text-align:left"><span class="tx"><b>Add Now Playing (large) widget</b><span>Album cover, song, artist, album and play / pause / next / previous</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="genres" style="width:100%;text-align:left"><span class="tx"><b>Add Genres widget</b><span>Your top genres, tap one to open it</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="statsdaily" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: Daily widget</b><span>Large: today hour by hour, time vs yesterday, songs, top artist and song, day / night</span></span></button>
      <button class="setrow" data-act="addwidget" data-kind="statsall" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: Everything widget</b><span>Large: today, week, month, all time, streak, top song / artist / album, chart</span></span></button></div>
    <div class="sethead">Diagnostics</div><div class="setcard">
      <button class="setrow" data-act="notiftest" style="width:100%;text-align:left"><span class="tx"><b>Notification test</b><span>Sends a sample media notification</span></span></button>
      <button class="setrow" data-act="copylog" style="width:100%;text-align:left"><span class="tx"><b>Copy log</b><span>Copies recent errors so you can paste them to an AI</span></span></button></div>
    <div class="sethead">About</div><div class="setcard"><div class="setrow" style="display:flex;align-items:center;gap:14px"><img id="lf-about-logo" alt="Liquid Dark app logo"${appLogoSrc() ? ` src="${appLogoSrc()}"` : ''} style="display:${appLogoSrc() ? 'block' : 'none'};width:48px;height:48px;object-fit:contain;border-radius:12px"><span class="tx"><b>Liquid Dark</b><span>Version ${APP_BUILD} (${APP_VERSION}) · code ${MY_CODE_ID || 'n/a'}</span></span></div><button class="setrow" data-act="updcheck" style="width:100%;text-align:left"><span class="tx"><b>Check for updates</b><span>Look for a newer build on GitHub now.</span></span>${I.chev}</button>${row('Credits', '♥︎★ Ai Hoshino <span class="credheart" aria-hidden="true">♥️</span><img class="credstar" alt="" aria-hidden="true" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAaC0lEQVR4nO19e3RURbrvr6r27t2dTtKdDkkIL3ll9BIQFIQZGCRwZS3gDnpGTzdHx3Mzl+WEZ2AQDwIy7vQZjzcuRXEQmCBenHE5Z24y3ovOrHu8iitxwBEQ5SIEhwETg0kIIc9+pF+7qu4f9A4NgjzSSMfxt1avdKe7q76q76vvVV9VA9/hO/QBJP74Dt8kKisrma7r1Hyt6zqtrKxkN5OmvxtIKXslvqSkRHW73ZaEt/vdauhPBBMpJQghcuvWrcVOp/OhcDj8PQDQNO1Ee3v7KytWrPifUkpKCBE3m9irhXKzCbha6LpOCCFiy5YtzzmdztXV1dU4fvw4AGDcuHHDp0+fPnvLli0jCSH/vbKyknk8Hn6TSf72wO12MykleeGFF6a8/vrrcvbs2VGr1WpkZWXxrKwsbrVaY26323j11VejzzzzTAEAkmgjUhn9gki32w1CiHQ6nYsaGhrkgQMHiMvlYjabjdpsNpqVlaVUV1dLv9+vZmdnLwQg0U/GlvJE6rpOPR6PeO65575HCHnwnXfekYQQBgBCCAghQAhBLBZj7733nmSMLdR1Pd3r9fJEg52qSHkGFBUVUQDS6XT+N5/PZz127JiwWq1EiPN2VkoJTdPIwYMHRTgczh02bNgCALKmpiblXdNUZwApKirixcXFVlVV3R988AFCoRCl9DzZhBBwzqEoCrq7u8mRI0egKMpSAKSmpiblvaGUZoCu64wQIqdNm/ZPkUhk1L59+7jNZqOJ0m8YBux2OwghUFWV1tTUcMMw7ty6descr9crUj1AS2kGABAAiNVqXXT48GHZ0dEBRTnnOcf1PoYMGYKHHnoI06dPh6IoaGpqkvX19UhLS1t6c0m/OqQsA3RdV7xer9i2bdtcwzC+X11dLS0WC5NSAjjHACEEcnJyoKoqCgoKMGLECHDOld27dwsp5ZyXXnppgsfj4am8ClKWAceOHZMAkJaWtryurg5NTU1S0zSYDDAhpYQQAlJKjBo1Cpqm4cSJE6K1tVWx2+0lN4X4a0BKMkBKSauqqvjzzz9fKISYvXv3bkEpZRd9BoQQBAIBSCkRi8UwePBguFwuRCIRtm/fPkkpfVjX9QEejydlXdKUZEBVVRUBAJfLtailpUU5fvy4sFqtSDS+wDk1FAqFIKWElBJpaWkYMmQIFEUhBw4c4D6fL2Po0KE/BYBUdUlTkQHE4/GIkpISByHk4QMHDkjOOSPkqwJMKUVPTw9isVivOzpq1ChYrVb4fD768ccfw2KxPDJjxgylqKiIIwWTjynHAF3XGQA5ZcqURd3d3Vn79+/nNpuNXCz9wLkVEI1GwTkHpRSGYSA3NxcDBgyAoih07969PBwO3/qTn/xkASFExttOKaRUNjSup3lHR4emKMrPPvroI+n3+2lGRsZX1I9pA2KxGMLhMDRNQywWg6ZpGDFiBE6fPo2zZ8/i6NGj8s4771wJ4N9xzq1NKaTUCigrK2OEEDl27NgfRaPR0R9++KGwWq30Ys/HhLkCwuEwTBVlGAZGjBgBm80GSin74IMPJCFk4osvvnhHKgZmqcYADoBomvYvn376Kc6cOQNVVb/iel6MxNjAMAw4nU4MGTIElFLU19eLuro66nA4VgFAVVXVDR/HtSBlGFBZWckIIfKFF16YTCmd8uGHHwpVVdnXTT6lFJxz+Hw+MMYuYNSoUaNAKYUQgu3du1cSQtzl5eVDqqqqeCrtFaQMISYcDkdpXV0dPv/880sGXhdDSoloNNr72rQL+fn5SE9Ph8ViIUePHuVtbW2WAQMGlAJAYWFhynhDKcGAeM6f//KXv7yFMbbg/fffl0KIS7qel0JXV9cFr4UQsNvtGDZsGDjnCIfDbM+ePVAUZeHSpUvTPR6PQIq4pCnBAMTpyM/PX9re3q7U1tZym832Fc/ncuD8q9u/nHMUFBSAMQZN08gnn3xihMPhARMmTHgYQMq4pDfdDZVSEkII13XdqSjKI++//74Mh8MsPT39igyQUoIxBp/PB8MwYO4TmGooLy8POTk5OHv2LDo7O8mBAwfk3XffXVJSUvIKgJTYtL/pK6CsrIwBkIMHD/6HWCzmOnz4MNc0jVxJ9yfCDMYSIaWEoigYNWoUDMOA1Wpl+/btEwDuGDdu3LRUcUlvOgMKCwulrutUVdXS/fv3o729nVyN6wmcXwGBQAChUAiU0q+4pMOGDYPVaoWiKGhubsZf//pXpKen/8uNHtfV4mYygLz44ouax+PhWVlZ9zHG7ty7dy/XNO1rXc+rbjwhJsjLy0MsFgOllL333nuCMTavvLx8cnyvwHLl1m4ckm0DCHCuiAo45+7V1tZe4G0UFhbK2tpa6fV6xcqVKyMbNmy4NTc391f79u0TLS0txGazXZX093YYj4YDgQAyMjIuUEXmChk6dCi++OIL2Gw21NXVob6+Xo4cOXLzjBkz/rPH4wnEaaa4tED2GiKv12sS1ncJMem/mg8lBi6mD11bW0uKiopQU1ODwsJCCQDXUo1WXl7uyM7OXmC328saGxvzf/WrX4loNEovDqiuOIA4A+bNm4fhw4cjGo32piWklLBYLPjyyy/xpz/9CRaLBdFoFE6nU/z85z+nLpfr41AoVPb222+/U1VVFb1CV70wbYc5B2fPnu0luLa2VgJAWVmZJIRccSAXMEBKSeJGEQDg9Xo5roHbbrebjRkzRh09evQtmqaxWCzmUhRleLxWM5cQMjISidiFEP8pHA7fQggZdPjwYezatUtEIhGqKMo1TT5wLhoOhUK4++67MWHChF5bEB8PLBYLGhsb8cc//hGqqgIAYrEYMjIyxIIFC+jIkSPBGPsbY6xdUZTPNE0Lcs7rAJwVQhBK6TFKaTgcDoesVmuTx+O5akbFabhgTsvKyngiY0jiBy/HsR07dgzSNI1yzl1Wq3UIpVQQQvIIIcMjkUgGpfS2SCSCSCRyK6XU6vf7BwMg5lZhMBhER0cHotEo2tra4Pf7EQgE0NTUxDs7O6mmaeRaJb93APEVMGLECMybNw/hcPgCBqiqiubmZrz11lu9eSXTPsRiMZGdnY1hw4ZRVVXhcDgwYMAA2Gw2ZGZmIi0tDYQQsxAgkp6e3so577ZarQ0Wi4VIKT9TVdXPGKuNRqNBAAiFQicdDkeosbExsnLlyrOXY4o510riP3Rdd40YMeIhTdMmxWIxFovFxhBCbKFQ6JZQKMQMw9AIIejp6UFXVxc452htbUUwGEQ4HEZraysIIWhvb0csFgPnXEYiEW4YRm8VG6UUhBDCGCOKojC73d67o3U9MCf51KlTaGlpQX5+PkKhUO/7mqahubkZFxdyKYoCRVGoz+fDoUOHhBBCSimlSSOlFIqiwGq1MkopsdlsmsPhGCqEGDpo0KCxiqLA5XLNczqdsFgsyMjIQNx+8Z6eHkNRlNDOnTubhBBdVqu1TlXVkN/v33P06NE3CCEhnBN+2VvEmpaWNjA3N/ddIcSYffv2ob29HW1tbQCAzs5OhMNhGIaBnp4eHpceCCFkXN+SuKSQ+OBIHEh8XDxxiX/7AlOiXS4XZs+eDZfL1Vs1cfz4cfz5z3/+2u9eKuVhCkXCQxqGIeN9yTjd0hwvYwyKosButzNKKex2O5xOJwghyMnJQVZWFqZOnQrO+f/r7OycvXr16nYAIGYp98svv/zbaDT6z88++2yktbWVKYoCswSNMUbiT4kpHZcj+lLPvwmY0a/FYsHw4cPhcDjQ1NSE5uZmMMYuSe+1tn+p58D5scZXuTSfc84lAMk5l5xz3HLLLfyxxx7TOOf/VlJSsqG6ulohAPDss8/aXS5X3WuvvTbg4MGDxOl09upvQshNndhrgSn1sVgMUkpQSmGxWL5Rmi9mlDmHlFJ0dHSI2bNn4/777z9aXFw8HgBRACA3Nzfb5/O5mpubqc1mk5zzpKqIbwrmYDVN6x38N03/pYTVpMNqteLs2bM0Go2a8ZekAOD3+6OqqsYsFktvuXd/RmKxVqrAXJ2EEJlYXUwBkOXLl5/RNO3zadOmiVAoJExJ+g7JgTn5QggxY8YMQin9EjgXN9HKykoKQAaDwY333HMPve+++0hPT4/4NqyEVIC5bRqJRERxcTErLCw0urq6ngZA3G43qMfj4bqu0+XLl796+vTpZfPmzZMLFy6knHOemGP/DtcOxhjC4TBUVeXLly+nU6ZMMZqamv5x1apVNbquE4/Hw3tF3HRHn3/++fsGDhy4s66uLmv79u1GIBBQbDbbJXedvsPlYabJBw0aZCxevFjJyspqamxs/PH69es/SjzF2SveHo+HV1RUqI8++uibx44dmz5s2LATa9asUQYNGmT4/X4wdtP3LvoFTJfT5/Nh7Nixsccff1xxOBx7jx8//oP169d/pOu6kpi0/IqSj9flG8XFxc6ioqI3AMx69dVX+ccff8wyMzNvimvXX2C6vj09PbKoqEg89NBDLBgMvvr222+XVlVVBS51fvmSVjbhtDnZsWPHNrvdvuiNN94w3n33XWa1WkniztN3OAezNpVzLu6//346a9YsdHZ2PrN06dK1wLmUvtfr/com92XdHDNH5PV6xUsvvbQiNzf3xZqaGlRWVgpCCFVV9aqrFr7toJQiEonAYrHwhQsXsrFjx/a0trauXLly5Y7KykrmdrvF5TLNV/IzSTxTKjZu3PjAwIEDf3vixIm0V155xQgGg98ZZ5wvkc/JyTEWLVqk5OfnN506derhdevW1VRUVKiLFi2Kfe33r9C+JIQIXdeV1atXv1FfXz9z9OjRJx5//HElLy8vFgwG/66NM6UUgUAAo0eP5mvXrlVycnKOHTt2bNrVTj5wDdVhZoNPPPHE0IKCglcppbO2bdsWq62tVdPT0/+ujLMZoAaDQTlt2jT+8MMPKz09Pbs+/fTT4s2bN/uu5bKQawp1zYYnTpyoLl68+Nfp6ekLf//734vq6mqSlpZGLs6cfhuRENnKe++9V86fP5+2tbU9u2TJkjXA5Y3t5XDNuQZd16m54bxt27YnMjIyntqzZw+qqqqEoihUUZRvrXE2I1tFUXhxcTEbP348WltbS1atWvXylYzt5XC9yR5SXV3NZs6caWzatOnh3Nzc7Z999pntlVde4ZFIhGma9q1jAmMMwWAQLpfLWLx4sZKfn99x+vTpBWvWrNkd1wwC11Gu0qdsm2kXnn766SlDhgz5321tbfkVFRVGS0uLkp6e/q3xkExjO2rUKGPJkiWKzWarbWxs/Od169Ydqq6uVmbOnGlcd9t9IWzRokUxXdeV9evX7z9y5MikrKysQ2vXrlVuu+02w+fzfSsSeYQQ+P1+OXnyZL569WpFUZR3Dh06VLRu3bpDuq73afKBJNXIm8Z55cqVzgkTJvzaYrEseO211/j+/fuZ1Wrtt4aZEIJIJII5c+bg3nvvRVdXV8XixYsXA+fH3Oc++k7mOSRa/4qKil84HI5/3bFjBz948CBLS0vrdzaBUopgMCjnzJkjHnjgAePMmTMbSktLn0vMECSjn6TuuEgpSVVVFfV4PHz79u2bpJQrn3rqKR6JRNj1Fl7dDJgVFtnZ2XzDhg2sq6trRWlp6WZd1y1erzeGJNaGJlVJE0JkbW2tlFLSurq6X1oslo6RI0fSaDQq+9PuWrzaTtx+++1MCHHi4MGDL+u6rpSVlSV18oEbUJ7u9XpFVVUVKS8vb1cU5T8KCgqIYRj9zh0SQojMzEyoqvq/fvOb34SBcwKW7H5uiJsSXwVECJHf1dV1rmyuHyJenjPgRvaR9DNiZvY0MzPTlZGRMfHUqVNQFKXf+aOMMdrU1IRIJDLV7XazsrIy7vV6k95P0iemqqqKAkBmZuZoznlGe3u7MGtG+wvi9Z60paVFGoYxatasWSPjxctJn6+kN2ieiNE0bUIgEKDd3d2iP3lAwPnq6fb2dhmJRCw2m200cGMOeN8w1cAYm3jq1KkL6vX7E+JxgOjo6ICqqrcD54Urqf0ku8H4hRuIRqMTTp48CUppvzTA5gVQn3/+OYQQPwDQexQrmUgqA3Rdp4QQuWPHjkGhUGhcY2MjVFW97HUzqQzTDtTV1SEcDk/ZuHGjLZ56SKpAJZUBpo5kjN3BObd1dHTw/maAE6GqKjlz5oyMRCJ5mZmZBcD5E6DJQlIZkJOT08sAn8+Hnp4e2R/1P9B7xJV0dXWJcDhMNE0bByTfECd1dszjmpTSOxsaGmAYRn+NwQCcM8ThcFiePXsWjLGJwHkhSxaSFojF73sTbrfbEo1Gx508eRKMsf47++dB6urqUFhYOAHABWeCk4GkrYCysjJCCJGzZ88uCIfDIxsbG6WiKP3SAJuIn8CkX3zxBUKh0Ljy8nJHsi+BTaYKogBgsVgmh8Nh2tXVxa/n4HUqwTwB2dLSIiKRyICBAweOBwCPx5O0eUu6hVQU5fb29vZ+G4BdjPhmvAiFQiCE3AUAY8aMSckVYO4Q3dbQ0IBkLtOLYZaAm38vd2w2WX3FYjE0NTVBVdXbkt1+UhggpSRer1c888wzGeFweFJdXR1uhP43JzwajcLv94uenh4jGAwafr9fxK+jSWp/Cf2S+vp6xGKxO8zMaLLaTpYXRADIvLy873V3d2c1NzdLVVWT6y/Hy79DoZAcPny4mDp1Khs4cCCVUqK5uRl79+7ljY2N1G63E8ZY0vagTUNcV1eHQCBw28yZM7MJIa1fd7fGtSApDKipqaEABKX0+6FQiPl8PkPTNCUZKyB+9yf8fr/MysoS8+fPZ3fffTdjjB2klP5WSplx6623Pjh16tSxNTU1ePfdd3kwGGRpaWkA+n7O2TTEbW1tPBQKpeXm5k4FsCuedu/zSkgKA0zfmDF2R2trK2KxGPpajmLe4RAKhaCqKp85cyabO3cuy8zMbOrq6vrFsmXLdiZ8/Nnt27eXzJ079xcTJ07M27Vrlzx8+LAA0FsW0xda4lfiyEAgQPLy8n4AYFeyArJkKE3idrsFAAghxjc0NAB9TFhRShGLxRAIBMTo0aPFY489xh588MGgqqrlf/nLX8YvW7Zsp5SS6Lqu6LquAIiVlJRsOXLkyESHw/HyI488QlasWMGGDBkiAoGANG9Xv+4Bxi8DaW5uBqX0ViB5AVmfV4D5G4+bN2/ODgaD36uvr7/uDKipbgKBgMzLyxNz585lkydPhmEYb5w4cWLdk08+eSLep0IIMQCYVWlE13Xm9XqbAJRs3Ljxf4wcOfLpxx57bOaePXvw9ttvGz6fj9lsNmL2cS2I54XoyZMn8f3vf/92Xdct8YubCPpYJZEMFUQBCIfDcVdbW1vm6dOnxbUywHQhe3p6oKoqnzt3Lps7dy5TFKW2s7NzfWlp6VvAuWq0eAXyxeWA0uv1Ggl1SfsAzNq6des/zZgx49kpU6YMefPNN/Hhhx9yzjkz76W7FhotFgtpaGiA3+8fPnTo0BEAjuu6ThLukbsu9FkFFRUVnWuI0h/EM6Diapd7olsZCoXE+PHjxYYNG9i9997bHo1GV7/55pt3lZaWvmX+gLPH4+Ff53kQQqR58FxKSZYuXfr7Q4cOTQRQ7na7o48//jgrKCgQfr9fXMshdDMz2t3dzeOZ0bvib/V5/vrcgKkLpZTjW1paIIS4qgxooneTn5/PV6xYQX/2s59Rp9P527/97W+TSkpKnq+qqgqZNZjXUgro9XoFIURWVlayjRs3tj7yyCPrmpubJ+Xk5PyfZcuW0UWLFlGHw2EEAgEze3tV9EYiEdnW1gZCyGTgvPD1BX1iACEEHo9HuN1uJoQYderUqSvWAJlRazAYlIqiGAsWLCBr1qxho0eP/qC9vX1WcXFxsdfr/SJuXElfCmDNxJmu68ratWuP/PSnP/0v3d3dP77jjjs+eeKJJ5T58+cTzjnv6em52miaNDU1AcAEJOmnEvtkA5588knq9XrF7Nmz830+38j6+npYLJZL6v9Et1JKyX/4wx+y+fPnKxkZGad8Pt8zS5Ys+TUA8TV6/roQV1mGWVKyYsWKXQD+uH379pVz5sz5xaRJk5xvvfWW/OSTT4SiKMy8Mv9SY2CM0YaGBoTD4YLVq1eneb3eYF8DsqTE7k6nc1AoFErr7OyUl8qAmlGs3+8XBQUFYtWqVczj8YQsFsvGgwcP3rFkyZKtUkppqpsbUQLo9XpFwn3RvKSk5PmTJ0+Oz87Ofq24uBilpaUsPz+f+3y+3ov7EmGWqnR3dyMcDpPx48cnha6kBGKxWKzTarVG7Ha7xefzXXA9JOccfr9f5uTkiAcffJDdddddkFK+19zcvGrt2rVHgN5fz+D4Bm40N1Va/EqGUwD+66ZNm7aPGTPm6YKCgunV1dXYvXs39/l81G639x48NA/naZomVVXFmTNnbjSpV0Y840ncbrdl586dzYsXL5aapsVcLpfIzs7mmZmZPC8vL/bAAw/Il19+Wf7ud7878tJLL/2j+X1d15UbmTW9GvoTblAn27dvX/z66683b9myRf7oRz+SLpcr5nA4eHZ2Nnc6ncJut0fWrl0rd+7c+QEAmoxKuT4P3u12s6qqKr558+aHHA7H6wcOHMD+/fvBOUdeXh7uuece5Ofn9wQCgec2bdr0b8eOHYsm+5BDX+F2u9kf/vAHLqXEsmXLsidNmvSEqqqLGxoabLt370ZXVxdsNhumT5+OsWPHoq2tbc6qVav+bzJOySRF+szTMZs2bfpxbm7uE6FQKDsWiyE9PV0ahvEfzc3NL6xfv/4kkLyjPTcCibSVl5cXDh48eAPnfEo4HCbxK/C/bG1tferRRx99J1nZ0KQhcTnqum6pqKhQJ06cqJr/iy/1lN+kv0gtYeLEiWpFRYWq63rvNfep9CtMF+BSv0hhRrE3g56+QNd1evF4LmZOMnCjJDKx3dRZpteHb9NYvsPF+P+cgnPIn5NfkwAAAABJRU5ErkJggg==">')}<div class="setrow lf-credit-box" style="flex-direction:column;align-items:stretch;justify-content:center;min-height:120px;border-radius:12px;margin:10px 14px;border:1px dashed rgba(255,255,255,.18);background:rgba(255,255,255,.03)"><span id="lf-credit-empty" style="display:${creditPic.src ? 'none' : 'block'};text-align:center;opacity:.6;font-size:0.8125rem">Your picture or GIF appears here</span><img id="lf-credit-gif-pic" alt="" src="${creditPic.src}" style="display:${creditPic.src ? 'block' : 'none'};width:100%;max-height:260px;object-fit:contain;border-radius:12px"></div></div></div>`;   // v222: .setcols = two columns sideways, display:contents in portrait
  },
};

/* v77: Bluetooth audio devices (connected list + a toast when one connects / leaves) */
let bt = [];
const btRefresh = () => { const top = stack[stack.length - 1]; if (top && top.t === 'settings') renderSub(true); };
const escH = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const btPct = d => (d && typeof d.battery === 'number' ? d.battery : null);
const btBatHtml = p => (p == null ? '' : `<span class="btbat${p <= 20 ? ' low' : ''}" style="--p:${p}"><i></i></span><em>${p}%</em>`);
const btChipHtml = () => (bt.length ? `<div class="chip btchip" aria-label="Bluetooth: ${escH(bt[0].name)}${btPct(bt[0]) != null ? ', battery ' + btPct(bt[0]) + ' percent' : ''}">${I.bluetooth}<span class="btn">${escH(bt[0].name)}</span>${btBatHtml(btPct(bt[0]))}${bt.length > 1 ? `<em>+${bt.length - 1}</em>` : ''}</div>` : '');
let btTimer = 0;
function btBanner(name, change) {   // a glass pill slides in from the top when a Bluetooth device connects, then tucks away
  let el = $('#btbanner'); if (!el) { $('#app').insertAdjacentHTML('beforeend', '<div class="btbanner" id="btbanner" role="status"></div>'); el = $('#btbanner'); }
  const d = bt.find(x => x.name === name), p = change === 'disconnected' ? null : btPct(d);
  el.dataset.n = name; el.classList.toggle('off', change === 'disconnected');
  el.innerHTML = `<span class="bti">${I.bluetooth}</span><span class="btt"><b>${escH(name)}</b><small>${change === 'disconnected' ? 'Disconnected' : 'Connected'}${btBatHtml(p) ? ' ' + btBatHtml(p) : ''}</small></span>`;
  if (!el.classList.contains('show')) { void el.offsetWidth; el.classList.add('show'); }
  clearTimeout(btTimer); btTimer = setTimeout(() => el.classList.remove('show'), 3800);
}
on('onBluetooth', e => {
  bt = (e && e.devices) || [];
  if (e && e.change) btBanner(e.name, e.change);
  else { const el = $('#btbanner'); if (el && el.classList.contains('show') && el.dataset.n && !el.classList.contains('off')) btBanner(el.dataset.n, 'connected'); }   // the battery % arrived while the pill is still showing
  if (Native.current()) renderNP();
  btRefresh();
});
if (Native.isNative) Native.getBluetooth().then(r => { bt = (r && r.devices) || []; btRefresh(); }).catch(() => {});
let dev = null;   // CPU cores / processor / RAM, shown in Settings > Performance
Native.getDeviceInfo().then(d => { dev = d || {}; btRefresh(); }).catch(() => { dev = {}; });
const gb = mb => (mb >= 1024 ? (mb / 1024).toFixed(mb >= 10240 ? 0 : 1) + ' GB' : mb + ' MB');
// live RAM + CPU (Settings > Performance): current usage only, read again every 1000 ms while Settings is on top and the app is visible; only the two texts change, the screen is not rebuilt
const ramText = d => { if (!d || !d.ramMb) return 'Unknown'; if (!d.availMb) return gb(d.ramMb); return gb(Math.max(0, d.ramMb - d.availMb)); };
let cpuPct = null, cpuPrev = null;   // cpuMs = CPU time this app has used (all threads); usage = its growth per second / cores
const cpuUpdate = d => { const now = performance.now(); if (d && d.cpuMs != null) { if (cpuPrev && now > cpuPrev.t) cpuPct = Math.max(0, Math.min(100, (d.cpuMs - cpuPrev.ms) / ((now - cpuPrev.t) * Math.max(1, d.cores || 1)) * 100)); cpuPrev = { t: now, ms: d.cpuMs }; } };
const cpuText = d => !d || d.cpuMs == null ? 'Not available here' : cpuPct == null ? 'Reading…' : (cpuPct < 10 ? cpuPct.toFixed(1) : Math.round(cpuPct)) + '%' + (d.threads ? ' · ' + d.threads + ' threads' : '');
let ramBusy = false;
setInterval(() => { if (document.hidden || ramBusy) return; const top = stack[stack.length - 1]; if (!top || top.t !== 'settings' || !document.getElementById('lf-ram')) return; ramBusy = true; Native.getDeviceInfo().then(d => { if (d) { dev = { ...dev, ...d }; cpuUpdate(dev); const r = document.getElementById('lf-ram'), c = document.getElementById('lf-cpu'), t = ramText(dev), u = cpuText(dev); if (r && r.textContent !== t) r.textContent = t; if (c && c.textContent !== u) c.textContent = u; } }).catch(() => {}).finally(() => { ramBusy = false; }); }, 1000);

/* ---------- render ---------- */
function renderMain() { const m = $('#main'); m.innerHTML = screens[tab](); m.scrollTop = 0; m.style.display = stack.length ? 'none' : ''; if (tab === 'search') { results(); const q = $('#q'); q.value = query; } }
let mainY = 0;   // Bug 6: #main is display:none while a sub screen is open (the browser forgets its scroll), so its place is kept here
const pfp = () => { try { return localStorage.getItem('lf.profile') || ''; } catch { return ''; } };
const hasFlag = k => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };   // v166b: tiny 'a picture is saved' marks (lf.haspf / lf.hasbg) so a picture that failed to load once is retried, like every other picture
const setFlag = (k, on) => { try { if (on) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch {} };
/* v105: the profile picture can also be a GIF or a short video. Those are kept as the original file in IndexedDB (localStorage is too small); a plain photo is still cropped to a square and kept in localStorage. */
let pfQuick = false, bgQuick = false;   // v150: true while the picture on screen is the file shown on the first frame
let pfMedia = null;   // { type: 'gif' | 'video', url: blob: URL }
const pfDb = () => new Promise((res, rej) => { try { const r = indexedDB.open('lf-profile', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
const pfDbPut = async blob => { if (!blob) { const nd = mirrorDel('lf-profile:media'); return pfDbPut0(blob).then(async r => { if (await nd) mirrorUntomb('lf-profile:media'); return r; }); } const m = mirrorPut('lf-profile:media', blob), i = await packBlob(blob).then(pfDbPut0).then(() => true, () => false); if (!i && !(await m)) throw new Error('save failed'); };
const pfDbPut0 = blob => pfDb().then(db => new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); blob ? t.objectStore('kv').put(blob, 'media') : t.objectStore('kv').delete('media'); t.oncomplete = () => { db.close(); res(); }; t.onerror = () => { db.close(); rej(t.error); }; }));
const pfDbGet = () => mirrorTombed('lf-profile:media') ? Promise.resolve(null) : pfDbGet0().then(b => { if (b) { mirrorHas('lf-profile:media').then(h => { if (!h) mirrorPut('lf-profile:media', b); }); return b; } return mirrorGet('lf-profile:media'); });
const pfDbGet0 = () => pfDb().then(db => new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get('media'); q.onsuccess = () => { db.close(); res(unpackBlob(q.result) || null); }; q.onerror = () => { db.close(); rej(q.error); }; }));
/* BUG #10: ONE rule for "is this profile file a video", used at pick, save and restore. A picker that gives no MIME type gets one from the file name, and every video type
   the picker accepts has a file extension in picmirror.js, so the saved copy comes back as a video after a restart. */
const VIDEO_TYPES = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mov: 'video/quicktime', m4v: 'video/x-m4v', '3gp': 'video/3gpp' };
const videoTypeOf = f => f.type || VIDEO_TYPES[String((/\.([a-z0-9]+)$/i.exec(f.name || '') || [])[1] || '').toLowerCase()] || 'video/mp4';
const pfKindOfUrl = u => /\.(mp4|webm|mkv|mov|m4v|3gp)$/i.test(u) ? 'video' : 'gif';
function pfSetUrl(u) { pfMedia = { type: pfKindOfUrl(u), url: u }; }
function pfSetMedia(blob) {
  if (pfMedia) { try { URL.revokeObjectURL(pfMedia.url); } catch {} pfMedia = null; }
  if (blob) pfMedia = { type: blob.type.startsWith('video/') ? 'video' : 'gif', url: URL.createObjectURL(blob) };
}
const pfHtml = () => pfMedia
  ? (pfMedia.type === 'video' ? `<video src="${pfMedia.url}" autoplay loop muted playsinline disablepictureinpicture></video>` : `<img src="${pfMedia.url}" alt="">`)
  : (pfp() ? `<img src="${pfp()}" alt="">` : '');
const restorePf = () => pfDbGet().then(b => { if (b) { setFlag('lf.haspf', true); pfSetMedia(b); const top = stack[stack.length - 1]; if (top && top.t === 'settings') renderSub(true); } }).catch(() => {});
function pfPick() {   // choose a photo, GIF or video. v148: all three are kept exactly as they are (original bytes, no crop, no shrinking); GIFs and videos keep moving.
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif,video/*';
  i.onchange = () => {
    const f = i.files && i.files[0]; if (!f) return;
    if (f.type.startsWith('video/') || (!f.type && /\.(mp4|webm|mkv|mov|m4v|3gp)$/i.test(f.name || ''))) {   // BUG-447: empty type -> decided by the extension
      ownBlob(f).then(b => { if (!b.type) b = b.slice(0, b.size, videoTypeOf(f)); pfSetMedia(b); toast('Profile video set'); repaintAll(); pfDbPut(b).then(() => { setFlag('lf.haspf', true); try { localStorage.removeItem('lf.profile'); } catch {} }).catch(() => toast('Could not save that file (it will be gone after a restart)')); });
      return;
    }
    canShow(f).then(ok => ok ? keepOriginal(f) : null).then(b => {
      if (!b) { toast('Could not read that file'); return; }
      pfSetMedia(b); pfQuick = false; toast(/gif/i.test(b.type) ? 'Profile GIF set' : 'Profile picture set'); repaintAll();   // shown at once, saved right after; the old text copy goes only after the new file is safe
      pfDbPut(b).then(() => { setFlag('lf.haspf', true); try { localStorage.removeItem('lf.profile'); } catch {} }).catch(() => toast('Could not save that file (it will be gone after a restart)'));
    }).catch(() => toast('Could not read that file'));
  };
  i.click();
}
/* v134: background picture / GIF. The original file sits in IndexedDB (any size, GIFs keep moving); the page paints it as a CSS background on #app, Now Playing and the lyrics (see "v134" in app.css), so every screen shows the same picture and nothing is layered over a button. */
const bgDb = bgBackend();
let bgUrl = '';
function bgSetUrl(u) { const h = document.documentElement; h.style.setProperty('--bgimg', `url("${u}")`); h.dataset.bg = '1'; }
function bgSetMedia(blob) {
  const h = document.documentElement;
  if (bgUrl) { try { URL.revokeObjectURL(bgUrl); } catch {} bgUrl = ''; }
  if (blob) { bgUrl = URL.createObjectURL(blob); h.style.setProperty('--bgimg', `url("${bgUrl}")`); h.dataset.bg = '1'; }
  else { h.style.removeProperty('--bgimg'); delete h.dataset.bg; }
}
/* v150: bring every saved picture back after a restart. A picture that cannot be read right now is NOT forgotten: it is tried again (2 s, 4 s, 6 s later). When some come back, every place that shows them is repainted: Home, the lists, the mini player and Now Playing. */
/* v152: ONE routine repaints every place a picture can show: mini player, Now Playing, the screen on top, AND the tab screen hidden underneath (Home, Albums, Playlists ...), keeping each scroll place.
   Every picture change (set, replace, reset, restored after a restart) calls it, so a picture is the same everywhere at once. */
let repaintT = 0;
function repaintPics() { clearTimeout(repaintT); repaintT = setTimeout(() => { repaintAll(); pushWidgetCovers(); }, 30); }
/* v157: the Albums + Artists home screen widgets show the custom picture too. Sends { album title: file, artist name: file } (lower case); only when something changed. */
let wcSig = '', waSig = '';
async function pushWidgetCovers() {
  try {
    if (!Native.isNative || !albums.length) return;
    /* v166 (owner's order): the Albums + Artists home screen widgets always show the ORIGINAL covers from the music files, never custom pictures. An empty list clears every custom entry on the phone. */
    const wa0 = JSON.stringify(widgetArtists()); if (wa0 !== waSig) { waSig = wa0; Native.setWidgetArtists(JSON.parse(wa0)); } if (wcSig !== 'orig') { wcSig = 'orig'; Native.setWidgetCovers({ alb: {}, art: {} }); }
  } catch {}
}
function repaintAll() {
  try {
    renderMini(); markPlaying();
    if ($('#np') && $('#np').classList.contains('open') && Native.current()) renderNP();
    const top = stack[stack.length - 1], m = $('#main'), y = top ? mainY : m.scrollTop;
    renderMain(); if (top) mainY = y; else m.scrollTop = y;   // the tab screen is rebuilt even while a sub screen covers it
    if (top) renderSub(true);
  } catch {}
}
const picBusy = new Set(); let dbSeq = 0; const bkey = (db, k) => (db.__n || (db.__n = ++dbSeq)) + ':' + k;   // v157: keys being loaded right now (the early start and the file-list start never load one picture twice)
async function restorePics(keys, db, apply, tries = 12, prefix = '', mark = null, shown = null) {   // v157: 12 tries with a growing wait (2 s ... 10 s), then every resume of the app tries again (reloadMissingPics)
  let all = keys.filter(k => !quickKeys.has(prefix + ':' + k) && !(shown && shown(k)));   // BUG #76: a picture already on screen is not loaded again
  if (prefix) { try { (await mirrorKeys(prefix + ':')).map(k => k.slice(prefix.length + 1)).forEach(k => { if (!all.includes(k) && !quickKeys.has(prefix + ':' + k) && !(shown && shown(k))) all.push(k); }); } catch {} }   // pictures found as files even if the list in localStorage was lost
  all = all.filter(k => !picBusy.has(bkey(db, k))); all.forEach(k => picBusy.add(bkey(db, k)));
  const left = [];
  let got = false;
  for (let i = 0; i < all.length; i += 64) {   // v219: 64 at a time (thousands of pictures are never all read from the database at once)
    const r = await Promise.all(all.slice(i, i + 64).map(k => db.get(k).then(b => { if (b) { apply(k, b); if (mark && !keys.includes(k)) mark(k); return 1; } left.push(k); return 0; }).catch(() => { left.push(k); return 0; }).finally(() => picBusy.delete(bkey(db, k)))));
    if (r.some(Boolean)) got = true;
  }
  if (got) repaintPics();
  if (left.length && tries > 1) setTimeout(() => restorePics(left, db, apply, tries - 1, '', mark, shown), Math.min(10000, 2000 * (13 - tries)));
}
const bgSaved = () => hasFlag('lf.hasbg') || mirrorSyncKeys('lf-background:').length > 0, pfSaved = () => hasFlag('lf.haspf') || mirrorSyncKeys('lf-profile:').length > 0;
const restoreBg = () => bgDb.get().then(b => { if (b) { setFlag('lf.hasbg', true); bgSetMedia(b); const top = stack[stack.length - 1]; if (top && (top.t === 'settings' || top.t === 'bgset')) renderSub(true); } }).catch(() => {});
/* v150: FIRST FRAME. Every saved picture that has a file copy is shown straight from that file the moment the app starts (no database to wait for), then each file is checked in the background;
   a file that is missing is dropped and the picture is loaded from IndexedDB instead. Pictures without a file copy yet load from IndexedDB as before (and get their file copy then). */
const probeUrl = u => fetch(u, { cache: 'no-store' }).then(r => { try { r.body && r.body.cancel(); } catch {} return r.ok; }).catch(() => false);
function quickPics() {   // v151: the keys come from the saved FILES (quick list rebuilt by mirrorSync), not from small lists in localStorage that Android may lose. Safe to call again: a picture already shown is skipped.
  const go = (store, setUrl, again, mark, has) => mirrorSyncKeys(store + ':').forEach(mk => {
    const k = mk.slice(store.length + 1); if (!k || quickKeys.has(mk) || (has && has(k))) return;   // BUG #76: a picture already on screen (loaded from the database while the file list was slow) is not swapped to its file copy
    const u = mirrorUrlSync(mk); if (!u) return;
    setUrl(k, u); quickKeys.add(mk); warmUrl(u); if (mark) mark(k);
    probeUrl(u).then(ok => { if (ok) return; mirrorForget(mk); quickKeys.delete(mk); again(k); });
  });
  go('lf-albumpics', (k, u) => { alpUrls.set(k, u); npSoon(); }, k => { alpUrls.delete(k); restorePics([k], alDb, alpSet); }, k => { const m = alpMap(); if (!m[k]) { m[k] = 1; alpSave(m); } }, k => alpUrls.has(k));
  go('lf-songpics', (k, u) => { spUrls.set(k, u); npSoon(); }, k => { spUrls.delete(k); restorePics([k], spDb, spSet); }, k => { const m = spMap(); if (!m[k]) { m[k] = 1; spSave(m); } }, k => spUrls.has(k));
  go('lf-artistgifs', (k, u) => { agUrls[k] = u; }, k => { delete agUrls[k]; restorePics([k], agDb, agSet); }, k => { const m = apicMap(); if (!m[k]) { m[k] = 'gif:1'; apicSave(m); } }, k => !!agUrls[k]);
  go('lf-genrepics', (k, u) => { gpUrls[k] = u; }, k => { delete gpUrls[k]; restorePics([k], gDb, gpSet); }, k => { const m = gpMap(); if (!m[k]) { m[k] = 1; gpSave(m); } }, k => !!gpUrls[k]);
  go('lf-playlist-pics', (k, u) => ppUrl.set(k, u), k => { ppUrl.delete(k); }, null, k => ppUrl.has(k));   // a playlist cover that fails here is loaded again by ppEnsureAll
  const bu = !bgQuick && !bgUrl && mirrorUrlSync('lf-background:media'); if (bu) { bgSetUrl(bu); bgQuick = true; warmUrl(bu); probeUrl(bu).then(ok => { if (ok) return; mirrorForget('lf-background:media'); bgQuick = false; restoreBg(); }); }
  const pu = !pfQuick && !pfMedia && mirrorUrlSync('lf-profile:media'); if (pu) { pfSetUrl(pu); pfQuick = true; probeUrl(pu).then(ok => { if (ok) return; mirrorForget('lf-profile:media'); pfQuick = false; restorePf(); }); }
}
quickPics();
// v151: ONE phone call lists every saved picture file; whatever the first pass did not know about is shown the moment the list arrives (all pictures, any number)
const picsSynced = mirrorSync().then(ok => { if (!ok) return; const n = quickKeys.size; quickPics(); if (quickKeys.size !== n) repaintPics(); });
const loadAlbumPics = () => restorePics(Object.keys(alpMap()), alDb, alpSet, 12, 'lf-albumpics', k => { const m = alpMap(); m[k] = 1; alpSave(m); }, k => alpUrls.has(k));   // album pictures (IndexedDB copies for anything without a file yet)
const loadArtistGifs = () => restorePics(Object.entries(apicMap()).filter(([, v]) => String(v).startsWith('gif:')).map(([n]) => n), agDb, agSet, 12, 'lf-artistgifs', k => { const m = apicMap(); if (!m[k]) { m[k] = 'gif:1'; apicSave(m); } }, k => !!agUrls[k]);   // artist GIFs
const loadGenrePics = () => restorePics(Object.keys(gpMap()), gDb, gpSet, 12, 'lf-genrepics', k => { const m = gpMap(); m[k] = 1; gpSave(m); }, k => !!gpUrls[k]);   // genre pictures
const loadSongPics = () => restorePics(Object.keys(spMap()), spDb, spSet, 12, 'lf-songpics', k => { const m = spMap(); m[k] = 1; spSave(m); }, k => spUrls.has(k));   // v165: song pictures
const loadAllPics = () => { loadAlbumPics(); loadSongPics(); loadArtistGifs(); loadGenrePics(); };
/* Refresh art (the Settings button): every custom picture and GIF the app keeps (songs, albums, artists, genres, playlists) is dropped from
   memory and read again from its saved copy. A copy that is missing from the database is rebuilt from the file copy, and the other way round. */
/* BUG #75: Refresh art also reloads the profile picture and the background picture from their saved copies. A picture that is not saved is left alone,
   and one that cannot be read right now stays as it is (restoreBg / restorePf only replace it when a saved copy is found). */
function refreshProfileBg() {
  if (bgSaved()) { bgQuick = false; restoreBg(); }
  if (pfSaved()) { pfQuick = false; restorePf().then(() => repaintAll()); }
}
/* v213: Refresh art shows the sucking-in animation (CSS class on <html>, removed after the reload has had time to paint) */
function pulsePics() { const hr = document.documentElement; hr.classList.remove('pics-refreshing'); void hr.offsetWidth; hr.classList.add('pics-refreshing'); clearTimeout(pulsePics.t); pulsePics.t = setTimeout(() => hr.classList.remove('pics-refreshing'), 900); }
function refreshAllPics(silent = false) {
  for (const m of [alpUrls, spUrls, ppUrl]) { for (const u of m.values()) { try { URL.revokeObjectURL(u); } catch {} unwarm(u); } m.clear(); }
  for (const o of [agUrls, gpUrls]) for (const k of Object.keys(o)) { try { URL.revokeObjectURL(o[k]); } catch {} unwarm(o[k]); delete o[k]; }
  ppBad.clear(); quickKeys.clear();   // BUG #11: forget which pictures were shown from their saved file, otherwise restorePics() skips them and they stay blank
  loadAllPics();
  refreshProfileBg();   // BUG #75
  for (const p of playlists) ppEnsure(p, true).catch(() => {});
  npSoon(); repaintPics();
  if (!silent) toast('Pictures and GIFs refreshed');   // v220: Refresh art shows its own card, no toast on top of it
}
loadAllPics();   // v157: at once, from the lists already saved on this phone (the phone's file list is only needed for pictures we do not know about yet)
/* v157: a picture that did not come back is tried again every time the app returns to the front, and a playlist picture marked broken gets another chance */
function reloadMissingPics() { try { ppBad.clear(); loadAllPics(); ppEnsureAll(6).catch(() => {}); if (!bgQuick && !bgUrl && bgSaved()) restoreBg(); if (!pfQuick && !pfMedia && pfSaved()) restorePf(); } catch {} }   // v166b: background + profile are retried too
/* v164: artist photos saved before this version are text (a data address) in localStorage only: one copy, and Android can drop it. Each one is moved to the same two-copy storage the GIFs use (IndexedDB + a file);
   the text stays until the new copy is safely written, so nothing can be lost on the way. */
async function apicMigrate() {
  const ks = Object.keys(apicMap()).filter(k => String(apicMap()[k]).startsWith('data:')); if (!ks.length) return;
  for (const k of ks) {
    try {
      const v = apicMap()[k]; if (!String(v).startsWith('data:')) continue;
      const b = await (await fetch(v)).blob(); if (!b || !b.size) continue;
      await agDb.put(k, b);
      const m = apicMap(); if (m[k] !== v) continue;   // changed while saving: leave it
      m[k] = 'gif:1'; apicSave(m); agSet(k, b);
    } catch {}
  }
  repaintPics();
}
/* v166b: a profile photo saved before this version is text in localStorage only (one copy, Android can drop it). It is moved to the same two-copy storage as the GIF; the text is removed only after the new copy is written. */
async function pfMigrate() {
  const v = pfp(); if (!v || !v.startsWith('data:') || pfMedia) return;
  try {
    const b = await (await fetch(v)).blob(); if (!b || !b.size || pfp() !== v || pfMedia) return;
    await pfDbPut(b);
    if (pfp() !== v || pfMedia) return;   // changed while saving: leave it
    setFlag('lf.haspf', true); pfSetMedia(b); try { localStorage.removeItem('lf.profile'); } catch {}
    const top = stack[stack.length - 1]; if (top && top.t === 'settings') renderSub(true);
  } catch {}
}
/* v164: a picture that is saved but not on screen yet is tried again every 15 s (the first 10 minutes after the app comes to the front), not only 12 times in the first minute and then on the next resume. */
const picsMissing = () => { try {
  const sk = Object.keys(spMap()); if (sk.length) { const ids = new Set(tracks.map(t => t.id)); if (sk.some(k => ids.has(k) && !spUrls.has(k))) return true; }
  return Object.keys(alpMap()).some(k => byAlbum(k) && !alpUrls.has(k)) || Object.entries(apicMap()).some(([n, v]) => String(v).startsWith('gif:') && !agUrls[n]) || Object.keys(gpMap()).some(k => !gpUrls[k]) || playlists.some(p => { const c = picsOf(p)[0]; return c && !ppUrl.has(c.id); }) || (!bgQuick && !bgUrl && bgSaved()) || (!pfQuick && !pfMedia && pfSaved());
} catch { return false; } };
let picWatchN = 0, picWatchOn = false;
function picWatch() { if (picWatchOn) return; picWatchOn = true; picWatchN = 0; const tick = () => { if (++picWatchN > 40) { picWatchOn = false; return; } if (!document.hidden && picsMissing()) reloadMissingPics(); setTimeout(tick, 15000); }; setTimeout(tick, 15000); }
picWatch();
[2500, 6000].forEach(ms => setTimeout(() => { if (!document.hidden && picsMissing()) reloadMissingPics(); }, ms));   // v166: a picture still missing a few seconds after start is tried again at once, not after the first 15 s
document.addEventListener('visibilitychange', () => { if (!document.hidden) { reloadMissingPics(); picWatch(); } });
picsSynced.then(() => { loadAllPics(); apicMigrate(); });
/* BUG #76: a picture that is saved but NOT in the quick file list (no file copy yet, or the list was lost) is loaded from the database right at start-up (IndexedDB does not need the phone), not after the phone's file list (mirrorSync, queued behind other file jobs) has arrived. Pictures that the quick list already shows are skipped; the later file-list pass skips whatever is on screen (quickPics `has`, restorePics `shown`). */
const earlyPics = () => { try {
  restorePics(Object.keys(alpMap()).filter(k => !alpUrls.has(k)), alDb, alpSet, 12, '', null, k => alpUrls.has(k)); restorePics(Object.keys(spMap()).filter(k => !spUrls.has(k)), spDb, spSet, 12, '', null, k => spUrls.has(k));
  restorePics(Object.entries(apicMap()).filter(([n, v]) => String(v).startsWith('gif:') && !agUrls[n]).map(([n]) => n), agDb, agSet, 12, '', null, k => !!agUrls[k]); restorePics(Object.keys(gpMap()).filter(k => !gpUrls[k]), gDb, gpSet, 12, '', null, k => !!gpUrls[k]);
  if (!bgQuick && !bgUrl && bgSaved()) restoreBg(); if (!pfQuick && !pfMedia && pfSaved()) restorePf();
} catch {} };
earlyPics();
picsSynced.then(async () => { if (!bgQuick && !bgUrl) restoreBg(); if (!pfQuick && !pfMedia) await restorePf(); pfMigrate(); });
function bgPick() {   // any picture or GIF, any size: stored exactly as it is
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif';
  i.onchange = () => {
    const f = i.files && i.files[0]; if (!f) return;
    if (!isBgFile(f)) { toast('Please choose a picture or a GIF'); return; }
    const probe = new Image(), url = URL.createObjectURL(f);
    probe.onload = async () => { URL.revokeObjectURL(url); const b = await ownBlob(f); bgSetMedia(b); toast('Background set'); renderSub(true); bgDb.put(b).then(() => setFlag('lf.hasbg', true)).catch(() => toast('Could not save that file (it will be gone after a restart)')); };
    probe.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that picture'); };
    probe.src = url;
  };
  i.click();
}
let demoGlide = null;
function initDemoBar() {   // the Animation screen's test bar: the same glass bar + pill as the real tab bar (same glide code, same live sliders)
  if (demoGlide) { try { demoGlide.destroy(); } catch {} demoGlide = null; }
  const el = $('#demobar'); if (el) demoGlide = glide(el, { selector: '.tab', initial: 0 });
}
/* v119: the Artist photo sheet (Choose a photo / Use an album cover / Back to default). Opened from the artist screen and by pressing and holding an artist card on Home. */
/* v145c: ONE simple sheet for every custom picture: choose one (it replaces the old one and the old file is deleted) or go back to what it originally shows. */
function picSheet(title, has, pickAct, resetAct, backText, extra = '', forceBack = false) {
  $('#sheet').innerHTML = sheetHtml(`<b>${title}</b><button class="row" data-act="${pickAct}"><span class="lbl" style="font-size:1.0625rem">${has ? 'Choose another picture or GIF' : 'Choose a picture or GIF'}</span></button>${extra}${has || forceBack ? `<button class="row" data-act="${resetAct}"><span class="lbl" style="font-size:1.0625rem">Back to default</span><span class="s">${backText}</span></button>` : ''}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
}
let spFor = '';
function spEdit(id) {   // v208: besides "Back to default" (= the album's picture), a song can go back to ITS OWN original cover, even when the album has a custom picture or GIF
  spFor = id; const t = tracks.find(x => x.id === id), so = soIds().has(id), hasPic = !!spMap()[id], albPic = !!(t && alpUrls.get(t.albumId));
  const orig = !so && (hasPic || albPic) ? `<button class="row" data-act="sp-orig"><span class="lbl" style="font-size:1.0625rem">Back to original cover</span><span class="s">The cover from this song's own file</span></button>` : '';
  picSheet('Picture for ' + (t ? t.title : 'song'), hasPic || so, 'sp-pick', 'sp-reset', so ? 'Follow the album picture again' : 'The album picture it showed before', orig);
}
function closeIfStill(mine) { if (!mine || $('#sheet').firstElementChild === mine) closeSheet(); }   // BUG-79: close only the sheet the picker opened from
function spDone(msg, mine) { closeIfStill(mine); toast(msg); [...covTint.keys()].forEach(k => { if (k.startsWith(spFor + '|')) covTint.delete(k); }); repaintAll(); const t = tracks.find(x => x.id === spFor); if (t) Native.updateArtwork(t.albumId).catch(() => {}); }
function spPick() {   // any picture or GIF, any size, stored untouched; choosing again REPLACES it (same key)
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif';
  i.onchange = () => {
    const mine = $('#sheet').firstElementChild; const f = i.files && i.files[0]; if (!f) return; const id = spFor;
    if (!isPicFile(f)) { toast('Please choose a picture or a GIF'); return; }
    const probe = new Image(), url = URL.createObjectURL(f);
    probe.onload = async () => { URL.revokeObjectURL(url); const b = await ownBlob(f), prev = spMap()[id]; const m = spMap(); m[id] = 1; spSave(m); spOrigOff(id); spSet(id, b); spDone('Song picture set', mine); spDb.put(id, b).then(() => { const t = tracks.find(x => x.id === id); if (t) Native.updateArtwork(t.albumId).catch(() => {}); }, () => { const m2 = spMap(); if (prev) m2[id] = prev; else delete m2[id]; spSave(m2); spSet(id, null); repaintPics(); toast('Could not save that file'); }); };
    probe.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that picture'); };
    probe.src = url;
  };
  i.click();
}
function spOrigOff(id) { const o = soMap(); if (o[id]) { delete o[id]; soSave(o); } }
function spReset() { const id = spFor; spDb.del(id).catch(() => {}); spSet(id, null); const m = spMap(); delete m[id]; spSave(m); spOrigOff(id); spDone('Back to the album picture'); }
function spOrig() { const id = spFor; spDb.del(id).catch(() => {}); spSet(id, null); const m = spMap(); delete m[id]; spSave(m); const o = soMap(); o[id] = 1; soSave(o); spDone('Back to the song\'s original cover'); }   // v208: the song's own picture is deleted and the song is marked to show the cover from its file
let alpFor = '';
function alpEdit(id) { alpFor = id; const a = byAlbum(id), mine = alpSongsCustom(id).length; picSheet('Picture for ' + (a ? a.title : 'album'), !!alpMap()[id], 'alp-pick', 'alp-reset', mine ? 'The cover from the music files, for the album and for every song in it' : 'The cover from the music files', '', !!mine); }
function alpDone(msg, mine) { closeIfStill(mine); toast(msg); [...covTint.keys()].forEach(k => { if (k.startsWith(alpFor + '|')) covTint.delete(k); }); repaintAll(); pushWidgetCovers(); Native.updateArtwork(alpFor).catch(() => {}); }
function alpPick() {   // any picture or GIF, any size, stored untouched; choosing again REPLACES it (same key), nothing old is kept
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif';
  i.onchange = () => {
    const mine = $('#sheet').firstElementChild; const f = i.files && i.files[0]; if (!f) return; const id = alpFor;
    if (!isPicFile(f)) { toast('Please choose a picture or a GIF'); return; }
    const probe = new Image(), url = URL.createObjectURL(f);
    probe.onload = async () => { URL.revokeObjectURL(url); const b = await ownBlob(f); const m = alpMap(); m[id] = 1; alpSave(m); alpSet(id, b); alpDone('Album picture set', mine); alDb.put(id, b).then(() => { pushWidgetCovers(); Native.updateArtwork(id).catch(() => {}); }, () => { const m2 = alpMap(); delete m2[id]; alpSave(m2); alpSet(id, null); repaintPics(); toast('Could not save that file'); }); };   // v158: the lock screen / notification and the home screen widgets read the FILE copy (mirrorPathSync), which is only known once this save lands, so they are asked again here (not only right away in alpDone)
    probe.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that picture'); };
    probe.src = url;
  };
  i.click();
}
function alpSongsCustom(id) { const sm = spMap(), so = soIds(); return tracks.filter(t => t.albumId === id && (sm[t.id] || so.has(t.id))); }
function alpReset() {   // v208: Back to default on an ALBUM also clears the picture / GIF / "original" mark of every song in it, so every song shows the original cover again
  const id = alpFor; alDb.del(id).catch(() => {}); alpSet(id, null); const m = alpMap(); delete m[id]; alpSave(m);
  const songs = alpSongsCustom(id);
  if (songs.length) { const sm = spMap(), so = soMap(); for (const t of songs) { if (sm[t.id]) { spDb.del(t.id).catch(() => {}); spSet(t.id, null); delete sm[t.id]; } delete so[t.id]; [...covTint.keys()].forEach(k => { if (k.startsWith(t.id + '|')) covTint.delete(k); }); } spSave(sm); soSave(so); }
  alpDone('Back to the original cover');
}
function gpEdit(id) { gpFor = E(id); picSheet('Picture for ' + gpFor, !!gpMap()[gpFor], 'gp-pick', 'gp-reset', 'Back to default genre picture or GIF'); }
function gpDone(msg, mine) { closeIfStill(mine); toast(msg); repaintAll(); }
function gpPick() {   // any picture or GIF, any size, stored untouched; choosing again REPLACES it
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif';
  i.onchange = () => {
    const mine = $('#sheet').firstElementChild; const f = i.files && i.files[0]; if (!f) return; const n = gpFor;
    if (!isPicFile(f)) { toast('Please choose a picture or a GIF'); return; }
    const probe = new Image(), url = URL.createObjectURL(f);
    probe.onload = async () => { URL.revokeObjectURL(url); const b = await ownBlob(f); const m = gpMap(); m[n] = 1; gpSave(m); gpSet(n, b); gpDone('Genre picture set', mine); gDb.put(n, b).catch(() => { const m2 = gpMap(); delete m2[n]; gpSave(m2); gpSet(n, null); repaintPics(); toast('Could not save that file'); }); };
    probe.onerror = () => { URL.revokeObjectURL(url); toast('Could not read that picture'); };
    probe.src = url;
  };
  i.click();
}
function gpReset() { const n = gpFor; gDb.del(n).catch(() => {}); gpSet(n, null); const m = gpMap(); delete m[n]; gpSave(m); gpDone('Back to default genre picture'); }
const apicSheet = () => picSheet('Photo for ' + apicFor, !!apicMap()[apicKey(apicFor)], 'apic-pick', 'apic-reset', 'Back to default artist picture or GIF', `<button class="row" data-act="apic-albums"><span class="lbl" style="font-size:1.0625rem">Use an album cover</span><span class="s">Pick one from the albums in your library</span></button>`);   // v149: an artist photo can also be the cover of an album already in the library
function apicEdit(id) { apicFor = artistName(E(id)) || E(id); apicSheet(); }
function apicDone(msg, mine) { closeIfStill(mine); toast(msg); repaintAll(); pushWidgetCovers(); }   // v119: the Home Top Artists card gets the new photo too   // v158: the home screen Artists widget too
function apicSetBlob(n, b, mine) {   // v157 flow, v164: used for GIFs AND still photos. The old photo is only deleted AFTER the new one is safe; a failed save keeps it.
  const prev = apicMap()[n], m = apicMap(); m[n] = 'gif:1'; apicSave(m); agSet(n, b); apicDone('Artist photo set', mine); agDb.put(n, b).then(() => { apicDropOthers(n); pushWidgetCovers(); }).catch(() => { const m2 = apicMap(); if (prev) m2[n] = prev; else delete m2[n]; apicSave(m2); agSet(n, null); if (String(prev || '').startsWith('gif:')) agDb.get(n).then(o => { if (o) { agSet(n, o); repaintPics(); } }).catch(() => {}); repaintPics(); toast('Could not save that photo'); });
}
function apicPick() {   // v148: GIF and still photo are both kept exactly as they are (original bytes: any size, no crop, no shrinking, no re-encode); the screen cuts the square
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.gif';
  i.onchange = () => {
    const mine = $('#sheet').firstElementChild; const f = i.files && i.files[0]; if (!f) return; const nm = apicFor;
    const gif = f.type === 'image/gif' || /\.gif$/i.test(f.name || '');
    (gif ? Promise.resolve(true) : canShow(f)).then(ok => ok ? keepOriginal(f).then(b => apicSetBlob(nm, b, mine)) : toast('Could not read that file')).catch(() => toast('Could not read that file'));
  };
  i.click();
}
let homeCType = 'album', homeCQ = '';
function custResults(pn) {   // the add list of a custom section: matching albums / artists / songs that are not in it yet (25 at most)
  const q = homeCQ.trim().toLowerCase(), have = new Set(pn.items.map(i => i.t + '|' + i.v)); let rows = [];
  if (homeCType === 'album') rows = albums.filter(a => !have.has('album|' + a.id) && (!q || has(a.title, q) || has(a.artist, q))).slice().sort((x, y) => String(x.title).localeCompare(y.title)).slice(0, 25).map(a => ['album', a.id, a.title, a.artist]);
  else if (homeCType === 'artist') rows = artists.filter(a => !have.has('artist|' + a) && !pn.items.some(i => i.t === 'artist' && artistName(i.v) === a) && (!q || has(a, q))).slice().sort((x, y) => String(x).localeCompare(y)).slice(0, 25).map(a => ['artist', a, a, pl(artistInfo(a).count, 'song')]);
  else if (q) rows = tracks.filter(t => !have.has('song|' + t.id) && (has(t.title, q) || has(t.trackArtist || trackAlbum(t).artist, q))).slice(0, 25).map(t => ['song', t.id, t.title, t.trackArtist || trackAlbum(t).artist]);
  else return '<div class="setrow"><div class="tx"><span>Type a song or artist name to find songs.</span></div></div>';
  if (!rows.length) return '<div class="setrow"><div class="tx"><span>Nothing found.</span></div></div>';
  return rows.map(([t, v, a, b]) => `<div class="setrow hsrow"><div class="tx"><b>${a}</b><span>${b}</span></div><button class="chip sel" data-act="hs-cadd" data-p="${pn.id}" data-t="${t}" data-v="${v}">Add</button></div>`).join('');
}
let lyPrevT = 0, lyPrevI = 0;
function lyPrevStart() {   // the Lyrics animation page: a small copy of the lyrics that moves line by line with the user's settings
  if (lyPrevT) { clearInterval(lyPrevT); lyPrevT = 0; }
  if (!$('.lyprevbody')) return;
  lyPrevI = 0;
  lyPrevT = setInterval(() => {
    const b = $('.lyprevbody'); if (!b) { clearInterval(lyPrevT); lyPrevT = 0; return; }
    const ls = b.children; if (!ls.length) return; lyPrevI = (lyPrevI + 1) % ls.length;   // BUG-25
    for (let k = 0; k < ls.length; k++) { ls[k].classList.toggle('cur', k === lyPrevI); ls[k].style.setProperty('--d', Math.min(5, Math.abs(k - lyPrevI))); }
    lyCenter(ls[lyPrevI], lyPrevI > 0, b);
  }, 1800);
}
function renderSub(keep = false, back = false) {   // keep = same screen refreshed in place: no slide-in, scroll position stays. back = returning to the screen below: no slide-in, its saved scroll is put back
  const el = $('#sub'); const top = stack[stack.length - 1];
  const y = keep && $('#sub .screen') ? $('#sub .screen').scrollTop : back && top ? top.y || 0 : 0;
  $('#main').style.display = top ? 'none' : '';
  if (!top) { el.innerHTML = ''; if (back) $('#main').scrollTop = mainY; return; }
  // v145: the Credits picture and the About logo are the SAME DOM nodes before and after a rebuild: nothing is re-decoded and a GIF does not restart.
  const liveNodes = ['lf-credit-gif-pic', 'lf-about-logo'].map(id => document.getElementById(id)).filter(n => n && el.contains(n));
  const subHtml = `<div class="screen sub${keep || back ? ' still' : ''}">${sub[top.t](top.id)}</div>`;
  if (keep && ['lstats', 'lall', 'ldetail'].includes(top.t) && el.firstChild) morphHtml(el, subHtml);   // v149: the live refresh of the listening screens patches what changed, nothing blinks
  else el.innerHTML = subHtml;
  for (const old of liveNodes) { const fresh = document.getElementById(old.id); if (fresh && fresh !== old) fresh.replaceWith(old); }
  if (liveNodes.length) { creditPicShow(); syncAppLogo(); }
  if (keep || back) { const sc = $('#sub .screen'); if (sc) sc.scrollTop = y; }
  initDemoBar(); lyPrevStart();
}
const rememberScroll = () => { const top = stack[stack.length - 1], sc = top ? $('#sub .screen') : $('#main'); const y = sc ? sc.scrollTop : 0; if (top) top.y = y; else mainY = y; };
const push = (t, id) => { rememberScroll(); stack.push({ t, id }); renderSub(); };
const goBack = () => { stack.pop(); renderSub(false, true); };   // Bug 6
const keepFocus = (root, fn) => {   // D2: a re-render must not drop the focused button
  const a = document.activeElement; let sel = '', k = 0;
  if (a && a !== document.body && root.contains(a)) { sel = a.id ? '#' + a.id : a.dataset && a.dataset.act ? `[data-act="${a.dataset.act}"]` : ''; if (sel) k = [...root.querySelectorAll(sel)].indexOf(a); }
  fn();
  if (sel) { const n = root.querySelectorAll(sel)[Math.max(0, k)]; if (n && n !== document.activeElement) n.focus({ preventScroll: true }); }
};
function renderMini() {
  const t = Native.current(), el = $('#mini'); try { $('#app').classList.toggle('has-mini', !!t); } catch {}   // BUG-268: no :has() needed
  if (!t) { el.innerHTML = ''; el._h = ''; return; }
  const a = trackAlbum(t), s = Native.state;
  const h = `<div class="mini"><button class="mini-open" data-act="open-np">${covT(t)}<span class="meta"><b>${t.title}</b><span>${t.trackArtist || a.artist}, ${a.title}</span></span></button>
    <button class="mb" data-act="pp">${s.playing ? I.pause : I.play}</button><button class="mb" data-act="next">${I.next}</button></div>`;
  if (el._h === h) return; el._h = h; keepFocus(el, () => { el.innerHTML = h; });   // identical markup (duplicate events) = no rebuild
}
const tokenColour = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();   // colours live only in tokens.css
const hex6 = c => { c = String(c || '').trim(); const m = /^#([0-9a-f]{3})$/i.exec(c); if (m) c = '#' + [...m[1]].map(x => x + x).join(''); return /^#[0-9a-f]{6}$/i.test(c) ? c : '#000000'; };   // Bug 16: "#000" + "cc" = "#000cc" is not a colour: always 6 digits before the alpha is appended
const LYSTYLE = { classic: 'Black background, red lyrics (default)', palette: 'Cover colour palette: the 5 main colours (small yellow / blue kept), white lyrics', blur: 'Cover blur: the album picture itself, softly blurred, white lyrics', home: 'Home screen background: your Home picture / GIF (or plain black), white lyrics', custom: 'Custom lyrics background: one picture / GIF of your own for every song, white lyrics' };
const LYINK = { auto: 'Automatic: red on the black style, white on the others', white: 'White lyrics (with a soft dark shadow)', black: 'Black lyrics (with a soft light glow)' };   // v278
const lyStyleKey = () => set.lyricStyle === 'cover' ? (set.lyricBlur === true ? 'blur' : set.lyricBg || 'palette') : 'classic';   // 'blur' is not a data-lyrstyle value, it is 'cover' plus set.lyricBlur   // only two styles: classic (black, red lyrics) and palette ('cover' + lyricPal)
const hexA = (g, n, al) => hex6((String(g).match(/#[0-9a-f]{6}/gi) || [tokenColour('--accent'), tokenColour('--bg')])[n]) + al;
let npLate = false;
/* v163: while a finger is down anywhere the player is not rebuilt (the cover tap and the long press for lyrics need the same element).
   It is rebuilt a moment after the finger is up, if it was asked to change meanwhile. The lyrics code itself is not touched. */
let npPress = false, npPressT = 0;
const npUp = () => { clearTimeout(npPressT); npPress = false; if (npLate) setTimeout(() => { if (!npPress && npLate) { npLate = false; renderNP(); } }, 120); };
document.addEventListener('pointerdown', () => { npPress = true; clearTimeout(npPressT); npPressT = setTimeout(() => { npPress = false; }, 8000); }, true);
document.addEventListener('pointerup', npUp, true);
document.addEventListener('pointercancel', npUp, true);
document.addEventListener('lf-release', () => { if (npLate && !document.querySelector('[data-down]')) { npLate = false; renderNP(); } });
function renderNP() {
  const t = Native.current(), np = $('#np'); if (!t) return;
  if (npPress || np.querySelector('[data-down]')) { npLate = true; return; }   // a finger is down: rebuild after the release (v163: anywhere, not only on the button rows)
  const a = trackAlbum(t), s = Native.state;
  npApplyTint(t);
  const liveMedia = np.querySelector('.cvmedia');   // T10 leftover: keep the running Canvas element (a rebuilt <video> would restart from 0)
  np.style.setProperty('--np1', hexA(a.g, 1, 'cc')); np.style.setProperty('--np2', hexA(a.g, 1, '88'));
  const h = `<div class="glow"></div><button class="grabbtn" data-act="close-np" style="padding:10px 0;width:100%;background:none;height:auto;margin:0 0 10px;display:block"><span class="grab" style="margin:0 auto;display:block"></span></button>
    <div class="art" role="button" tabindex="0" aria-label="Album cover. Tap to see it full screen, press and hold for lyrics">${artHtml(t, a)}</div>
    <div class="titles"><div class="t"><b>${t.title}</b><span>${t.trackArtist || a.artist}, ${a.title}</span></div><button class="gbtn ${isFav(favs, t.id) ? 'fav' : ''}" data-act="fav" data-tm="${t.id}" aria-label="Favorite">${isFav(favs, t.id) ? I.heartFill : I.heart}</button><button class="gbtn" aria-label="More options for ${t.title}" data-act="trackmenu" data-tm="${t.id}">${I.more}</button></div>
    <div class="npmeta"><div class="chip green badge"><i></i>${quality(t)}</div>${btChipHtml()}</div>${sleepPillHtml()}
    <div class="scrub" id="scrub"><div class="rail"></div><div class="fill" id="fill"><i></i></div><i class="abm" id="abA"></i><i class="abm" id="abB"></i><div class="thumb" id="thumb"></div></div>
    <div class="times"><span id="tl">${timeTexts(0, 0, set.timeStyle).tl}</span><span id="tr">${timeTexts(0, 0, set.timeStyle).tr}</span></div>
    <div class="transport"><button class="sbtn ${s.shuffle ? 'on' : ''}" data-act="shuf">${I.shuffle}</button>
      <div class="cluster"><button data-act="prev">${I.prev}</button><button class="pp" data-act="pp">${s.playing ? I.pause : I.play}</button><button data-act="next">${I.next}</button></div>
      <button class="sbtn ${s.repeat !== 'off' ? 'on' : ''}" data-act="rep">${s.repeat === 'one' ? I.repeat1 : I.repeat}</button></div>
    <div class="bottom"><button data-act="lyrics">${I.lyrics}</button><button class="cvbtn ${canvasOn && cvPath(t) ? 'on' : ''}" data-act="canvas" title="Canvas">${I.canvas}</button><button class="slbtn ${Native.sleepState().active ? 'on' : ''}" data-act="sleep" title="Sleep timer" aria-label="Sleep timer">${I.sleep}</button><button class="abbtn ${loopState(ab) !== 'off' ? 'on' : ''}" data-act="abloop" title="A-B loop" aria-label="A-B loop">${{ off: 'A-B', a: 'A-', ab: 'A-B' }[loopState(ab)]}</button><button data-act="queue">${I.queue}</button></div>`;
  if (np._h === h) return; np._h = h; keepFocus(np, () => { np.innerHTML = h; });
  const fresh = np.querySelector('.cvmedia');
  if (liveMedia && fresh && liveMedia.getAttribute('src') === fresh.getAttribute('src') && liveMedia.tagName === fresh.tagName) fresh.replaceWith(liveMedia);
  scr.tl = scr.tr = scr.marks = ''; scr.sec = -1; scr.w = 0; progress(s.pos, t.dur);
  syncCanvas();
}
/* ---------- T12 part: A-B loop. One loop for the playing song (reset when the song changes); logic in abloop.js. ---------- */
let ab = emptyLoop('');
try { const sv = JSON.parse(localStorage.getItem('lf.abloop') || 'null'); if (sv && typeof sv.id === 'string') ab = { id: sv.id, a: typeof sv.a === 'number' ? sv.a : null, b: typeof sv.b === 'number' ? sv.b : null }; } catch {}   // BUG-8: loop survives a restart
const abSave = () => { try { localStorage.setItem('lf.abloop', JSON.stringify(ab)); } catch {} };
on('onTrackChanged', () => { const c = Native.current(); if (c && ab.id !== c.id) { ab = emptyLoop(c.id); abSave(); } });   // D2: the next handler renders once
let abLock = 0;   // v35: after a jump back, ignore progress events for 600 ms so the seek is not fired twice
on('onProgress', ({ pos }) => { const c = Native.current(), to = c && jumpTo(ab, c.id, pos); if (to != null && Date.now() > abLock) { abLock = Date.now() + 600; Native.seek(to, { loop: true }); } });
function abAction() {
  const c = Native.current(); if (!c) { toast('Play a song first'); return; }
  const r = tapLoop(ab, c.id, Native.pos()); ab = r.loop; abSave(); toast(r.msg); renderNP();
}
/* ---------- Position line (v56): smooth + cheap ----------
   Before: each player report (every 80 ms) rewrote width / left (layout), two text nodes and three aria attributes, and every
   text write woke the MutationObserver at the bottom of this file, which re-ran the WHOLE accessibility pass + syncModal.
   Now: a report only corrects a clock. One animation frame (only while Now Playing is open and playing) moves the fill and the
   knob with transform (no layout); text / aria are written only when they change. */
const scr = { pos: 0, at: 0, raf: 0, w: 0, drag: false, dpos: 0, tl: '', tr: '', marks: '', sec: -1 };
function abMarks(dur) {
  const m = markPct(ab, dur), key = m.join('|'); if (key === scr.marks) return; scr.marks = key;
  [['#abA', m[0]], ['#abB', m[1]]].forEach(([q, p]) => { const el = $(q); if (el) { el.style.display = p == null ? 'none' : 'block'; if (p != null) el.style.left = p + '%'; } });
}
function scrubPos() { return scr.drag ? scr.dpos : Native.state.playing ? scr.pos + Math.min(0.6, (performance.now() - scr.at) / 1000) : scr.pos; }
function paintScrub(pos, dur) {
  const f = $('#fill'), th = $('#thumb'); if (!f || !th) return;
  if (!scr.w) scr.w = $('#scrub').offsetWidth;
  pos = dur > 0 ? Math.min(dur, Math.max(0, pos)) : 0; const p = dur > 0 ? pos / dur : 0;
  f.firstElementChild.style.transform = `translate3d(${((p - 1) * 100).toFixed(3)}%,0,0)`;
  th.style.transform = `translate3d(${(p * scr.w).toFixed(2)}px,0,0)`;
  const { tl, tr, played, aria } = timeTexts(pos, dur, set.timeStyle);   // Settings > Playing bar time decides what the two texts say
  if (tl !== scr.tl) {
    scr.tl = tl; $('#tl').textContent = tl;
  }
  if (played !== scr.sec) {   // the screen-reader value follows the played second, whatever the style
    scr.sec = played;
    const sl = $('#scrub'); if (sl) { sl.setAttribute('aria-valuemax', String(Math.round(dur || 0))); sl.setAttribute('aria-valuenow', String(Math.round(pos))); sl.setAttribute('aria-valuetext', aria); }
  }
  if (tr !== scr.tr) { scr.tr = tr; $('#tr').textContent = tr; }
  abMarks(dur);
}
function scrubLoop() {
  scr.raf = 0;
  const np = $('#np'), t = Native.current(); if (!np || !t || document.hidden || !np.classList.contains('open')) return;
  paintScrub(scrubPos(), t.dur);
  if (Native.state.playing || scr.drag) scr.raf = requestAnimationFrame(scrubLoop);
}
const scrubKick = () => { if (!scr.raf) scr.raf = requestAnimationFrame(scrubLoop); };
function progress(pos, dur) {
  if (!$('#fill')) return;
  const now = performance.now(), playing = Native.state.playing, ahead = scr.pos + (playing ? Math.min(0.6, (now - scr.at) / 1000) : 0);
  // a small difference is just timing noise: blend toward the report so the knob never twitches back; a big one (seek, new song) jumps
  scr.pos = playing && Math.abs(pos - ahead) < 0.5 ? ahead + (pos - ahead) * 0.25 : pos; scr.at = now;
  paintScrub(scrubPos(), dur);
  if (playing) scrubKick();
}
window.addEventListener('resize', () => { scr.w = 0; });
function markPlaying() { const c = Native.current(); document.querySelectorAll('[data-tid]').forEach(r => r.classList.toggle('playing', !!c && r.dataset.tid === c.id));
  document.querySelectorAll('[data-aid]').forEach(r => r.classList.toggle('aplay', aplay(r.dataset.aid))); }   // v149: the album of the playing song turns red

on('onTrackChanged', () => { renderMini(); renderNP(); markPlaying(); });
on('onState', () => { renderMini(); renderNP(); });
on('onRepeatChanged', () => renderNP());
on('onProgress', ({ pos, dur }) => progress(pos, dur));
on('onSeek', ({ pos, dur }) => progress(pos, dur));

/* BUG #17: a sleep timer lost by a killed app is resumed only while there is a current song. After a kill the queue is put back by restoreSession() inside loadLib(), AFTER the first getSleepTimer() answer, so this runs at start-up AND again right after the queue is restored (a second run is harmless: the timer is then active, or the saved end time is gone). */
const sleepResume = () => Native.getSleepTimer().then(st => { try { const end = +localStorage.getItem('lf.sleepEnd') || 0, left = end - Date.now(); if (end && left <= 0) localStorage.removeItem('lf.sleepEnd'); else if (end && !(st && st.active) && Native.current()) Native.setSleepTimer({ minutes: Math.max(1, Math.ceil(left / 60000)), ms: Math.max(1000, Math.round(left)) }).catch(() => {}); } catch {} renderNP(); }).catch(() => {});   // BUG-9: resume a timer that a killed app lost
let sessionTried = false;
/* ---------- T18: scan with progress + automatic "new music" check ---------- */
let scanning = false, quietScan = false, lastCheck = 0, hasFolder = false;
on('onScanProgress', p => { if (scanning && !quietScan) scanView.update(p); });   // v101: the scan card (src/scanview.js) replaces the progress toast
const isBusy = e => e === 'busy' || (e && e.message === 'busy');
/* v220: Library > Rescan shows the SAME card as the first scan: it opens at once, stays at least 2.6 s, and the covers already read from the music files
   (embedded art / cover.jpg, never a picture the user set) are sucked into the disc while it runs, even when every song is unchanged and the scan itself is over in a blink. */
function libCovers(max = 400) {
  const seen = new Set(), out = [];
  for (const t of tracks) { const c = t && t.cover; if (c && !seen.has(c)) { seen.add(c); try { out.push(Native.fileUrl(c)); } catch {} } }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.slice(0, max);
}
async function runScan(quiet, forceArt = false, fx = false) {   // one scan at a time (Java also refuses a second one with 'busy')
  scanning = true; quietScan = quiet;
  if (!quiet) scanView.start(fx ? { instant: true, minMs: 2600, covers: libCovers() } : undefined);
  try { const r = await Native.scan({ forceArt }); hasFolder = true; if (!quiet) scanView.finish(r); return r; }
  catch (e) { if (!quiet) scanView.hide(); throw e; }
  finally { scanning = false; lastCheck = Date.now(); }
}
let allAsked = false;
// v211: order of the permission popups: All files access -> notifications card -> Accessibility card -> Allow restricted settings card -> Accessibility card again -> background card (10 s apart).
let allFilesDone = false; const assistLaunchAt = Date.now();
async function askAllFiles() {   // v106: opens Android's "All files access" screen when it is not allowed yet; after it is allowed, rescan so .lrc files from every folder are matched
  if (allAsked || !Native.isNative) return; allAsked = true;
  try { const s = await Native.allFilesStatus(); if (s && s.granted) return; const r = await Native.requestAllFiles(); if (r && r.granted) loadLib(true); } catch {}
}
let libLoading = !!Native.isNative;   // v149: (BUG start-up flash: true from the very first draw on Android, because renderMain() runs before loadLib() and used to show "No music yet" for ~2 s) true while the saved library is being read at start (the Home screen shows a quiet placeholder, not "No music yet")
var libTimerA = 0, libTimerB = 0;   // BUG-333: one pending start-up timer of each kind
async function loadLib(rescan, forceArt = false, quiet = false, fx = false) {
  if (!Native.isNative) return;
  if (scanning) { if (rescan) toast('A scan is already running'); return; }
  try {
    let r, applied = false;   // applied = the saved library is already on screen (do not build it a second time)
    if (rescan) {
      await Promise.all([loadFavs(), loadStats()]); await mergeNativePlays();
      r = await runScan(quiet, forceArt, fx);
    } else {
      // v149: read the saved library at the SAME time as favourites / stats / playlists (they used to run one after another BEFORE the library was even asked for)
      libLoading = true;
      const prep = Promise.all([loadFavs(), loadStats()]).then(mergeNativePlays).then(loadPlaylists).then(r => { ppEnsureAll().catch(() => {}); return r; });   // v157: playlist pictures load the moment the playlists are known
      prep.catch(() => {});
      r = await Native.getLibrary();   // v156: Home is drawn the moment the songs arrive; favourites / stats / playlists finish a moment later and update it
      hasFolder = !!r.hasFolder;
      if (r.tracks.length) { infoCache.clear(); setLibrary(r.tracks); applied = true; libLoading = false; warmFirst(); renderMain(); renderSub(); }
      await prep;
      // A saved library that is already there is NEVER rescanned with the big card. Only a folder that was never scanned (no cache file) shows it; a cache that exists but came back empty is re-checked quietly.
      if (!r.tracks.length && r.hasFolder) r = await runScan(r.cached !== false ? true : false);
    }
    libLoading = false; ppEnsureAll().catch(() => {});
    if (r.tracks.length) { if (!applied) { infoCache.clear(); setLibrary(r.tracks); } if (rescan) await loadPlaylists(); await relinkSaved(); if (rescan && !quiet && !scanView.shown) toast(`${tracks.length} songs`); } else { infoCache.clear(); setLibrary([]); if (rescan) await loadPlaylists(); if (rescan) toast('No music files found'); }
    renderMain(); renderSub(); pushWidgetCovers(); warmCovers();
  } catch (e) { libLoading = false; renderMain(); if (!isBusy(e)) toast('Library: ' + (e.message || e)); }
  if (!sessionTried) { sessionTried = true; await Promise.resolve(restoreSession()).catch(() => {}); sleepResume(); picsSynced.then(() => Native.updateArtwork()).catch(() => {}); }   // T8-rest: put the last queue back (paused) once the songs are known
  clearTimeout(libTimerA); libTimerA = setTimeout(() => bgAllowHold(askAllFiles().finally(() => { allFilesDone = true; setTimeout(() => startPopup().catch(() => {}), 400); })), 1500);                                   // v106: ask once per launch for "All files access" so .lrc files are found anywhere
  clearTimeout(libTimerB); libTimerB = setTimeout(autoCheck, 3000);                                     // T18: cheap check for new / removed files a moment after start
}
async function autoCheck() {
  if (!Native.isNative || !shouldCheck({ enabled: set.autoCheck, hasFolder, busy: scanning, now: Date.now(), last: lastCheck })) return;
  try {
    if (($('#sheet') || {}).innerHTML) return;   // BUG-15: a sheet is open (maybe a playlist action): check again later, no mid-tap swap
    const r = await runScan(true);
    const msg = changeText({ added: r.newSongs, removed: r.removed });
    if (msg || r.touched || r.added) {   // library really changed: swap it in without losing the scroll position
      const m = $('#main'), y1 = stack.length ? mainY : m.scrollTop;   // Bug 12: #main is display:none under a sub screen, so its place lives in mainY
      infoCache.clear(); setLibrary(r.tracks); await loadPlaylists(); await relinkSaved();
      renderMain(); renderSub(true);                                   // keep = no slide-in replay; renderSub puts the sub screen's scroll back itself
      if (stack.length) mainY = y1; else m.scrollTop = y1;
    }
    if (msg) toast(msg); else if (r.touched) toast('Library updated (changed lyrics or covers)');   // BUG-4
  } catch (e) { if (!isBusy(e)) logLine('W', 'autoCheck:', e && e.message || e); }
}

/* ---------- T16: Copy log (Settings > Diagnostics) ---------- */
async function copyLog() {
  let nat = ''; try { nat = (await Native.getNativeLog()).log || ''; } catch (e) { logLine('W', 'native log failed:', e && e.message || e); }
  const rep = buildReport({ native: nat, info: { native: Native.isNative, songs: tracks.length, albums: albums.length, playlists: playlists.length } });
  if (await copyText(rep)) return toast('Log copied. Paste it to the AI.');
  // clipboard blocked: show the text so it can be selected by hand
  $('#sheet').innerHTML = sheetHtml(`<b>Copy this log</b><p>Automatic copy did not work. Tap the text, Select all, Copy.</p><textarea class="logbox" readonly>${rep.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textarea><div class="actions"><button data-act="log-close">Close</button></div>`);
}

/* ---------- notification permission sheet (first launch) + test ---------- */
let nameEdit = false;   // v119: the name shows as plain text beside the picture; tapping it opens the editor
const nameFocus = () => setTimeout(() => { const i = document.getElementById('pfname'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 60);
function homeRenSave(v) { if (!homeRen) return; const i = document.getElementById('hsren'), val = v === undefined ? (i ? i.value : '') : v; set.home = homeRen.kind === 'q' ? renameQuick(set.home, homeRen.k, val) : renameSection(set.home, homeRen.k, val); homeRen = null; applySettings(); renderSub(true); renderMain(); toast(String(val).trim() ? 'Name saved' : 'Normal name back'); }   // v119: rename a Home section or quick button
function nameSave() { const i = document.getElementById('pfname'); set.userName = String(i ? i.value : set.userName || '').trim().slice(0, 24); nameEdit = false; applySettings(); refreshGreet(); renderSub(true); toast(set.userName ? 'Name saved' : 'Name removed'); }
let npcRaf = 0;
function setNpCover(v, reset) {   // v119: Now Playing cover size (percent of the biggest cover that fits; reset = automatic)
  set.npCover = reset ? 0 : Math.min(NPC_MAX, Math.max(NPC_MIN, Math.round(+v) || NPC_MAX)); applySettings(true);
  const k = set.npCover || 100;
  document.querySelectorAll('input[data-nprange]').forEach(i => { i.value = k; }); const nb = document.querySelector('input[data-npnum]'); if (nb && document.activeElement !== nb) nb.value = k;
  cancelAnimationFrame(npcRaf); npcRaf = requestAnimationFrame(() => dispatchEvent(new Event('resize')));   // Canvas clips re-fit to the new size
  const sp = nb && nb.closest('.tx') && nb.closest('.tx').querySelector(':scope > span'); if (sp) sp.textContent = 'Size of the album cover while a song plays. ' + (set.npCover ? '' : 'Now: automatic.');
}
let tabRaf = 0;
function setTabPct(v) {
  set.tabPct = Math.min(TAB_MAX, Math.max(TAB_MIN, Math.round(+v) || 100)); applySettings(true);
  document.querySelectorAll('input[data-tabpct]').forEach(i => { i.value = set.tabPct; }); document.querySelectorAll('[data-tabv]').forEach(e => { e.textContent = set.tabPct + '%'; }); const nb = document.querySelector('input[data-tabnum]'); if (nb && document.activeElement !== nb) nb.value = set.tabPct;
  cancelAnimationFrame(tabRaf); tabRaf = requestAnimationFrame(() => dispatchEvent(new Event('resize')));   // the glass pill re-measures itself on resize
}
let popBlob = '';   // v129: object URL of the picture in the open popup; revoked when the sheet closes
const freePopBlob = () => { if (popBlob) { try { URL.revokeObjectURL(popBlob); } catch {} popBlob = ''; } };
const closeSheet = () => { if (updPending && updSheetOpen()) return;   // v138: the update screen cannot be closed (back button, Escape, taps outside): only installing the update ends it
  try { const pcd = document.querySelector('#sheet .sheetbox.popcard:not([data-upd])'); if (pcd && pcd.querySelector('[data-act="notif-later"]')) localStorage.setItem('lf.notifAsked', '1'); } catch {}   // BUG-38: Back / dismiss counts as an answer, the card does not return on every resume
  const puShown = popUnseen && popUnseen.el && popUnseen.el.isConnected ? popUnseen : null;   // BUG-40: the person saw this popup and closed it before the update check ended: it counts as seen
  $('#sheet').innerHTML = ''; freePopBlob(); try { lsx && lsx.releaseSnap && lsx.releaseSnap(); } catch {}   // BUG-261
  if (popWaiting) { if (puShown) { try { localStorage.setItem('lf.popupSeen', puShown.id); localStorage.setItem('lf.popupStamp', puShown.stamp); } catch {} } popUnseen = null; popWaiting = false; setTimeout(() => startPopup().catch(() => {}), 400); } };   // BUG-07: the dead updWaiting branch was removed
/* v104: whatever the picture's shape or size, it is scaled to fit the popup space (never cropped or stretched); its real shape sets the corner rounding */
const popFitMemo = new Map();   // v145: src -> fitted shape. A card that is rebuilt with a picture already seen shows it at once (no opacity:0 frame).
function popImgHtml(src) {
  const f = popFitMemo.get(src);
  return `<img class="popimg" src="${src}" alt=""${f ? ` data-ready="1" style="--ar:${f.ar};--nw:${f.nw}"` : ''}>`;
}
function fitPopImg(el) {
  if (el.dataset.ready === '1') return;
  const go = () => { const f = popFit(el.naturalWidth, el.naturalHeight); if (!f) return el.remove(); popFitMemo.set(el.getAttribute('src'), f); el.style.setProperty('--ar', f.ar); el.style.setProperty('--nw', f.nw); el.dataset.ready = '1'; };
  if (el.complete && el.naturalWidth > 0) go(); else { el.onload = go; el.onerror = () => el.remove(); }
}
function popImgSwap(box, src) {   // v145: put a (new) picture into an open card without rebuilding the card
  const body = box.querySelector('.pbody'); if (!body) return;
  const cur = body.querySelector('.popimg'); if (cur) cur.remove();
  if (!src) return;
  body.insertAdjacentHTML('afterbegin', popImgHtml(src));
  const el = body.querySelector('.popimg'); if (el) fitPopImg(el);
}
// Do not consume a popup delivery until the downloaded image is genuinely decodable.
async function popupImageReady(pic) {
  if (!pic?.src) return false;
  const probe = new Image(); probe.src = pic.src;
  try {
    if (typeof probe.decode === 'function') await probe.decode();
    else await new Promise((resolve, reject) => { probe.onload = resolve; probe.onerror = reject; });
    return probe.naturalWidth > 0 && probe.naturalHeight > 0;
  } catch { return false; }
}
function notifSheet(pic, needPerm = true) {
  // The card is identified by its button set (data-sig). The picture is tracked separately (data-pic = its stable id: hash + upload stamp, never the blob URL,
  // which changes on every poll). v145: a picture that arrives (or changes) while the card is open is swapped into the SAME card, so the box never rebuilds.
  // Returns true when the card was built or its picture swapped (the caller then keeps its new picture URL).
  const sig = 'n|' + (needPerm ? 1 : 0), pid = pic ? pic.id : '';
  const open = document.querySelector('#sheet .sheetbox.popcard:not([data-upd])');
  if (open && open.dataset.sig === sig) {
    if (!pic || (open.dataset.pic || '') === pid) return false;   // a retry that found no picture never takes the picture off a card
    open.dataset.pic = pid; popImgSwap(open, pic ? pic.src : '');
    return true;
  }
  const img = pic ? popImgHtml(pic.src) : '';
  const still = !!open;   // a card was already on screen: swap its content without replaying the slide-in
  $('#sheet').innerHTML = `<div class="scrim nsc${still ? ' lf-still' : ''}"${needPerm ? '' : ' data-act="sheet-close"'}></div><div class="sheetbox notifcard popcard${still ? ' lf-still' : ''}" data-sig="${sig}" data-pic="${pid}" role="dialog" aria-modal="true"><div class="pbody">${img}<b>${needPerm ? 'Allow notifications?' : 'Liquid Dark'}</b>${needPerm ? '<p>Liquid Dark shows the song, \"Artist, Album\" and Prev / Play / Next on your lock screen and notification shade.</p>' : ''}</div>
    <div class="actions">${needPerm ? '<button data-act="notif-allow">Allow</button><button data-act="notif-later">Later</button>' : '<button data-act="sheet-close">OK</button>'}</div></div>`;
  const el = $('#sheet .popimg'); if (el) fitPopImg(el);
  return true;
}
/* v142: Android downloads in a persistent foreground service, even after the app task closes. The update screen and completion notification both offer Install when the APK is verified. */
let updPending = null, updAsked = 0, updBusy = false;
let updGateRestorePromise = Promise.resolve();
let updReady = '', updDownloading = '', updError = '', updErrorId = '', updPct = -1, updInstallError = '', updOpening = false;
const updFetchInFlight = new Set();
async function canInstall() { try { return !!(await Native.canInstallUpdates()).allowed; } catch { return true; } }
new MutationObserver(() => { if (updPending && !updSheetOpen()) updRefresh(true).catch(() => {}); }).observe($('#sheet'), { childList: true });   // v138: if anything ever replaces / empties the update screen, it is put back at once
const updSheetOpen = () => !!$('#sheet [data-upd]');   // the open sheet is the update popup itself (v138: marked with data-upd)
/* v138: MANDATORY UPDATE. Once a newer build is known, the app is locked behind the update screen: no Later / Not now, no closing it, and it comes back every time the app is opened until the new version is installed.
   The pending update is also remembered on the phone (lf.updGate), so closing the app, or opening it without internet, does not skip it. */
const UPD_GATE_KEY = 'lf.updGate';
// Native builds keep this tiny gate in the app's atomic filesDir JSON store, not
// localStorage. The latter may have been filled by the old base64 app-logo-pic cache.
async function updSetPending(u) {
  updPending = u;
  try {
    await store.set('updgate', u);
    try { localStorage.removeItem(UPD_GATE_KEY); } catch {}
  } catch (e) {
    // Keep a compatibility fallback, but make persistence failure visible.
    try { localStorage.setItem(UPD_GATE_KEY, JSON.stringify(u)); } catch {}
    toast('Could not save the update reminder. Keep Liquid Dark open until the update is installed.');
  }
}
function updRelease() {
  resetFirstDraw(updDraw);
  updPending = null; updReady = ''; updDownloading = ''; updError = ''; updErrorId = ''; updInstallError = '';
  store.set('updgate', null).catch(() => {});
  try { localStorage.removeItem(UPD_GATE_KEY); } catch {}
  closeSheet();
}
function updApplyStatus(u, status) {
  if (!status || !updPending || updPending.id !== u.id) return false;
  const before = `${updReady}|${updDownloading}|${updErrorId}|${updError}|${updPct}`;
  updPct = Number.isFinite(Number(status.pct)) ? Number(status.pct) : -1;
  if (status.status === 'ready' || status.ready) {
    updReady = u.id; updDownloading = ''; updError = ''; updErrorId = '';
  } else if (status.status === 'queued' || status.status === 'downloading' || status.downloading) {
    updReady = ''; updDownloading = u.id; updError = ''; updErrorId = '';
  } else if (status.status === 'failed') {
    updReady = ''; updDownloading = ''; updErrorId = u.id;
    updError = String(status.error || 'The update download failed. Tap Retry download.');
  } else {
    updReady = ''; updDownloading = '';
    if (updErrorId !== u.id) { updError = ''; updErrorId = ''; }
  }
  return before !== `${updReady}|${updDownloading}|${updErrorId}|${updError}|${updPct}`;
}
async function updReadStatus(u) {
  try { const s = await Native.getUpdateStatus(u.build, u.sha256); s._changed = updApplyStatus(u, s); return s; }
  catch (e) {
    updReady = ''; updDownloading = ''; updErrorId = u.id;
    updError = String(e && e.message ? e.message : e || 'Could not read update download status');
    return { status: 'failed', error: updError };
  }
}
async function updGateRestore() {
  const g = await restoreGate({ isNative: Native.isNative, store, ls: localStorage, key: UPD_GATE_KEY, myCodeId: MY_CODE_ID, getInstalledBuild, isInstalled: pendingUpdateIsInstalled });   // BUG-362: logic lives in updgate.js
  if (!g) return;
  if (updPending) return;   // BUG-10: a newer update stored by the first check must not be overwritten by the saved one
  updPending = g; updRefresh(true).catch(() => {}); fetchUpdate(g);
}
async function updRefresh(force = false) {   // v142: ready state is reconciled with the native persistent file, not a JS-only flag
  if (!updPending) return;
  const u = updPending;
  const installedBuild = await getInstalledBuild();
  if (!updPending || updPending.id !== u.id) return;
  if (pendingUpdateIsInstalled(u, MY_CODE_ID, installedBuild)) { updRelease(); return; }
  await updReadStatus(u);
  if (!updPending || updPending.id !== u.id) return;
  const ready = updReady === u.id, allowed = ready ? await canInstall() : true;
  if (!updPending || updPending.id !== u.id) return;
  if (ready && !allowed) updNeedAllow(); else updSheet();
}
async function fetchUpdate(u, retry = false) {   // v142: enqueue the Android foreground service; the download continues if the WebView or app task closes
  if (!u || updFetchInFlight.has(u.id)) return;
  updFetchInFlight.add(u.id);
  try {
    const status = await updReadStatus(u);
    if (retry && status.status === 'ready') { updRefresh().catch(() => {}); return; }   // BUG-05: a ready APK stays ready, no flash back to 0%
    if (!retry && (status.status === 'ready' || status.status === 'queued' || status.status === 'downloading' || status.downloading || status.status === 'failed')) {
      if ((status.status === 'ready' || status.status === 'failed') && (status._changed || !updSheetOpen())) updRefresh().catch(() => {});
      else if (updSheetOpen()) updUpdateProgressText();
      return;
    }
    if (!updPending || updPending.id !== u.id) return;   // BUG-04: an older operation must not start a download for a replaced update
    updReady = ''; updError = ''; updErrorId = ''; updInstallError = ''; updDownloading = u.id; updPct = 0;
    if (updPending && updPending.id === u.id && updSheetOpen()) updUpdateProgressText();
    await Native.downloadUpdate(u.url, u.build, u.sha256);
    if (!updPending || updPending.id !== u.id) return;
    // The native method only queues the persistent service; readiness is determined from its saved status.
    const after = await updReadStatus(u);
    if (after.status === 'ready' || after.status === 'failed') updRefresh().catch(() => {});
    else if (updPending && updPending.id === u.id) updUpdateProgressText();
  } catch (e) {
    if (!updPending || updPending.id !== u.id) return;   // BUG-04
    updReady = ''; updDownloading = ''; updErrorId = u.id;
    updError = String(e && e.message ? e.message : e || 'Could not start the update download');
    if (updPending && updPending.id === u.id) updRefresh().catch(() => {});
  } finally { updFetchInFlight.delete(u.id); }
}
async function startUpdateCheck() {
  if (!Native.isNative || updBusy || Date.now() - updAsked < 900) return;
  updAsked = Date.now();
  updBusy = true;
  try {
    let u = null;
    try { u = await checkUpdate(); } catch { u = null; }
    if (!u) {
      let ib = updPending ? await getInstalledBuild() : 1; if (!ib) ib = await getInstalledBuild(true);   // BUG-03: an unreadable installed build is "unknown", never proof that the app is current
      updBusy = false;
      if (updPending && lastCheckConfirmed() && ib > 0) updRelease();
      else popupResumeAfterUpdateCheck();
      return;
    }   // v138: GitHub itself says this app is up to date: the lock ends (offline / errors never end it)
    if (updPending) {   // checks remain at UPDATE_POLL_MS = 1000; a newer build is handed to the native service, which cancels the old request safely
      if (updPending.id === u.id) {
        updBusy = false;
        updPicLoad(); fetchUpdate(u); return;
      }
      await updSetPending(u); updReady = ''; updDownloading = ''; updError = ''; updErrorId = ''; updInstallError = '';
      updBusy = false;
      fetchUpdate(u); updRefresh(true).catch(() => {}); return;
    }
    await updSetPending(u);   // v138: no Later: the update screen opens at once; native gate is persisted before releasing the check lock
    updBusy = false;
    fetchUpdate(u);
    if (!updPending || updPending.id !== u.id) return;
    updRefresh(true).catch(() => {});   // the card itself waits for its picture (updCard -> updDeferFirstDraw), at most 20 s
  } catch {
    updBusy = false;
    popupResumeAfterUpdateCheck();
  }
}
/* v104: same look as the notification popup: black background, centered text, liquid glass buttons */
async function checkNow() {
  if (!Native.isNative) { toast('Updates are checked in the installed app'); return; }
  if (updBusy) { toast('An update check is already running'); return; }
  toast('Checking…');
  updBusy = true;
  try {
    resetUpdateCache();
    const u = await checkUpdate();
    if (!u) {
      updBusy = false;
      popupResumeAfterUpdateCheck();
      toast(lastCheckConfirmed() ? 'You are up to date' : 'Could not check for updates');
      return;
    }
    await updSetPending(u);
    updBusy = false;
    await updRefresh(true);
    await fetchUpdate(u, true);
  } catch {
    updBusy = false;
    popupResumeAfterUpdateCheck();
    toast('Could not check for updates');
  }
}
let updInstBusy = false;
async function updInstall() { if (updInstBusy) return; updInstBusy = true; try { await updInstall0(); } finally { updInstBusy = false; } }   // BUG-06: double taps
async function updInstall0() {   // v142: native verifies the persistent APK again immediately before Android's installer opens
  if (!updPending) { closeSheet(); return; }
  const u = updPending;
  if (!(await canInstall())) { updNeedAllow(); return; }
  if (updOpening) return;   // BUG-06: a double tap must not verify and launch the installer twice
  updOpening = true; if (updView === updSheet) updSheet();   // v145: "Opening the installer…" is part of the one shared update text
  try {
    const r = await Native.installDownloadedUpdate();
    updOpening = false;
    if (r && r.needsPermission) { updNeedAllow(); return; }
    updInstallError = '';
  } catch (e) {
    updOpening = false;
    const message = String(e && e.message ? e.message : e || 'Could not install the update');
    const status = await updReadStatus(u);
    if (status.status === 'failed') {
      // A missing/corrupt/unverifiable file is no longer treated as ready: immediately start a clean download.
      updInstallError = '';
      updSheet();
      fetchUpdate(u, true);
    } else {
      updInstallError = message;
      updSheet();
    }
  }
}
function updRetry() { if (updPending) fetchUpdate(updPending, true); }
/* v132: the update popups (progress / Install / Allow the install) show the picture or GIF from the GitHub folder update-popup-gif-pic/, in the same full-screen look as the notification popup. No picture there = the plain small popup as before. */
let updPic = { src: '', stamp: '', at: 0, busy: false }, updView = null, updPicP = Promise.resolve();
const updDraw = newFirstDraw();   // BUG-08 / BUG-362: first-draw state (updgate.js); its gen ignores a draw-wait that started before updRelease()
// v144 follow-up: like the notification popup, the update box first confirms its picture (downloaded AND decoded) and only then opens, with the picture already inside.
// The update is mandatory, so the wait is capped at 20 s: after that the plain box opens and a late picture is swapped into the same box.
function updDeferFirstDraw() {
  deferFirstDraw(updDraw, {
    pendingId: () => updPending && updPending.id,
    loadPicture: async () => {
      await updPicLoad();
      const src = updPic.src;
      if (!src) return;
      try { const im = new Image(); im.src = src; await im.decode(); if (!(im.naturalWidth > 0)) throw new Error('empty'); }
      catch { try { URL.revokeObjectURL(src); } catch {} if (updPic.src === src) updPic = { ...updPic, src: '' }; }   // broken picture: plain box (same stamp is not downloaded again)
    },
    stillPending: id => !!updPending && updPending.id === id,
    sheetOpen: () => updSheetOpen(),
    redraw: () => { if (updView) updView(); },
  });
}
function updCard(title, text, actions) {
  // v144: no blinking. If the update card is already open with the same picture, only the changed parts (title / text / buttons) are patched in place:
  // the picture element, the card and its slide-in animation are never rebuilt. A real rebuild (first open, or a new picture) replays no animation when a card was already showing.
  const box = document.querySelector('#sheet .sheetbox[data-upd]');
  if (!box && !updDraw.settled) { updDeferFirstDraw(); return; }   // first open: wait for the picture (max 20 s), then draw once
  const curImg = box && box.querySelector('.popimg');
  // v145: the card keeps its structure while it has a picture (or stays without one). A new / changed picture is swapped inside the same card.
  const sameShape = box && (updPic.src ? !!box.querySelector('.pbody') : !box.querySelector('.pbody'));
  if (box && sameShape) {
    if (updPic.src && (!curImg || curImg.getAttribute('src') !== updPic.src)) popImgSwap(box, updPic.src);
    // compare with what was last DRAWN (innerHTML read back is re-serialised and never matches exactly), so unchanged parts are not touched
    const b = box.querySelector(':scope > b, :scope .pbody > b'), p = box.querySelector(':scope > p, :scope .pbody > p'), a = box.querySelector(':scope > .actions');
    if (b && box._lt !== title) { b.innerHTML = title; box._lt = title; }
    if (p && box._lx !== text) { p.innerHTML = text; box._lx = text; }
    if (a && box._la !== actions) { a.innerHTML = actions; box._la = actions; }
    return;
  }
  const still = !!box;   // a card was already on screen: swap its content without the slide-in
  const img = updPic.src ? popImgHtml(updPic.src) : '';
  $('#sheet').innerHTML = `<div class="scrim nsc${still ? ' lf-still' : ''}"></div><div class="sheetbox notifcard${img ? ' popcard updcard' : ''}${still ? ' lf-still' : ''}" data-upd="1" role="dialog" aria-modal="true">${img ? `<div class="pbody">${img}<b>${title}</b><p>${text}</p></div>` : `<b>${title}</b><p>${text}</p>`}
    <div class="actions">${actions}</div></div>`;
  const nb = document.querySelector('#sheet .sheetbox[data-upd]'); if (nb) { nb._lt = title; nb._lx = text; nb._la = actions; }
  const el = $('#sheet .popimg'); if (el) fitPopImg(el);
}
function updPicLoad(force = false) {   // v134: looks at update-popup-gif-pic/latest.json every second (a tiny file; the picture is downloaded only when its stamp is new). Returns a promise. A NEW picture (or a deleted one) redraws an open update popup at once.
  if (!Native.isNative && !force) return Promise.resolve();
  if (updPic.busy) return updPicP;   // v134: a (big) picture is still downloading: callers can wait for that same download
  if (!force && Date.now() - updPic.at < UPD_PIC_MIN_MS) return Promise.resolve();
  updPic.busy = true; updPic.at = Date.now();
  return updPicP = fetchUpdatePic(fetch, undefined, undefined, updPic.stamp).then(r => {
    updPic.busy = false; if (!r || r.same) return;
    const old = updPic.src;
    updPic = r.gone ? { ...updPic, src: '', stamp: '', busy: false } : { ...updPic, src: r.src, stamp: r.stamp, busy: false };
    if (old) { try { URL.revokeObjectURL(old); } catch {} }
    if (updSheetOpen() && updView) updView();
  }).catch(() => { updPic.busy = false; });
}
function updNeedAllow() {   // v120: say it plainly: Android needs one permission switch before the install can start
  updView = updNeedAllow; updPicLoad();
  updCard('Allow the install, once', 'Android needs your permission before Liquid Dark can install a new version. Tap <b>Allow</b>, switch on <b>Allow from this source</b>, come back to Liquid Dark and tap <b>Install</b>. You only do this once.', '<button data-act="upd-allow">Allow</button>');
}
// v145: ONE writer for the update box text. Progress events and the 1 s poll only update updPct and then call updSheet(), which draws the same wording every time;
// updCard() patches only what really changed. The "Allow the install" card is never touched by progress, and the box no longer flips between 1 and 3 lines.
function updUpdateProgressText() { if (updSheetOpen() && updView === updSheet) updSheet(); }
function updSheet() {
  const ready = !!updPending && updReady === updPending.id;
  const failed = !!updPending && updErrorId === updPending.id;
  updView = updSheet; updPicLoad();
  const title = ready ? 'Update ready' : failed ? 'Download failed' : 'Update available';
  const text = ready
    ? (updOpening ? 'Opening the installer…' : updInstallError ? 'Could not open the installer: ' + E(updInstallError) + '. Tap Install to try again.' : 'The new version of Liquid Dark is downloaded and verified. Tap Install, then confirm on Android. Your music library and settings stay.')
    : failed
      ? (/different key/i.test(String(updError)) ? 'Update blocked: the new APK is signed with a different key than the installed app, so Android would refuse it. Retrying will not help. Build with the same signing key as this install, or export your settings, uninstall once and install the new APK.' : 'Download failed: ' + E(updError) + '. Check your connection, then tap Retry download.')
      : 'Downloading in the background' + (updPct >= 0 ? '… ' + updPct + '%.' : '…') + ' You can close Liquid Dark; the download will continue. Your music library and settings stay.';
  const actions = ready ? '<button data-act="upd-go">Install</button>' : failed ? '<button data-act="upd-retry">Retry download</button>' : '';
  updCard(title, text, actions);
}
/* v125: reliable popup delivery. Poll the latest manifest while foregrounded; serialize checks; only save "seen" after the image is decoded and rendered. */
let popRetryT = 0;
/** BUG-39: one retry path: capped at 44 tries, one timer at a time */
function popRetry() { if (popTries >= 44) return; const delay = popTries++ < 24 ? 5000 : 30000; clearTimeout(popRetryT); popRetryT = setTimeout(() => startPopup().catch(() => {}), delay); }
/* v208: "Allow notifications" card: while notifications are OFF it is shown every time the app is opened (cold start, or coming back after the app was away 10 s or more) until the person allows them.
   permShownOpen = already shown during this open; permTrip = the person is on the Android prompt / settings page (coming back from there is not a new open). Later / Back only hide it until the next open. */
let permShownOpen = false, permTrip = false, permHiddenAt = 0, permOff = false;
let notifChecked = false;
setBgAllowGate(() => permOff && !permShownOpen);   // v213: back to the old rule: ONLY the notification card holds the background card back (then 10 s). It never waits for the accessibility cards. v209: the background-activity card waits for the notification card (shown first), then 10 s more
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { permHiddenAt = Date.now(); return; }
  if (permTrip) { permTrip = false; if (!permHiddenAt || Date.now() - permHiddenAt < 10000) return; }   // back from the Android prompt / settings within 10 s: same open (v212: away longer = a NEW open, the card comes again)
  if (permHiddenAt && Date.now() - permHiddenAt >= 10000) permShownOpen = false;   // a new open: ask again if still off
});
let popWaiting = false, popUnseen = null, popTries = 0, popRun = false, popQueued = false, popTriedStamp = '';   // v129: popTriedStamp = the upload whose picture was already tried: the 1-second check does not retry it (the 5 s / 30 s retry timers do)
async function startPopup() {
  // Defer delivery until the saved update gate is restored and the current
  // update-manifest request has finished. updBusy matters because updPending
  // is assigned only AFTER the manifest request can take up to 20 seconds.
  if (popRun) { popQueued = true; return; }
  popRun = true;
  try {
    await updGateRestorePromise;
    if (updPending || updBusy) { popWaiting = true; return; }
    if (document.getElementById('lf-bgallow') || document.getElementById('lf-assist')) { setTimeout(() => startPopup().catch(() => {}), 1500); return; }   // never on top of the background card or an accessibility card (the accessibility card's close calls startPopup again)
    if (!allFilesDone && Date.now() - assistLaunchAt < 60000) { setTimeout(() => startPopup().catch(() => {}), 1500); return; }   // v210d: All files access comes first
    let granted = true, asked = false;
    try { granted = !!(await Native.notificationStatus()).granted; } catch {}
    if (updPending || updBusy) { popWaiting = true; return; }
    permOff = !granted; notifChecked = true;   // v211: the accessibility cards wait for the notification step   // v209: tells the background card whether the notification card is still due
    try { asked = !!localStorage.getItem('lf.notifAsked'); } catch {}
    // v129: decide from the tiny manifest FIRST; the picture is downloaded only when it is new to this person, and never while another sheet blocks the popup.
    const man = await peekManifest();
    if (updPending || updBusy) { popWaiting = true; return; }
    let seen = '', seenStamp = ''; try { seen = localStorage.getItem('lf.popupSeen') || ''; seenStamp = localStorage.getItem('lf.popupStamp') || ''; } catch {}
    const stampNew = man ? (man.stamp ? man.stamp !== seenStamp : true) : true;   // no stamp / no manifest: only the bytes can tell, so the picture is read
    const wantsPerm = !granted && !permShownOpen;   // v208: every open while notifications are off (was: once ever)
    if (!stampNew && !wantsPerm) return;   // already seen this upload, nothing to ask: no download at all
    popTriedStamp = man?.stamp || '';
    let pic = await fetchPopupPic(undefined, undefined, undefined, man);
    if (pic && !(await popupImageReady(pic))) {
      try { URL.revokeObjectURL(pic.src); } catch {}
      pic = null;
    }
    const fresh = !!pic && pic.id !== seen && !(!pic.stamp && seen.startsWith(pic.hash + '.'));   // BUG-35: no manifest stamp right now (outage / 429) must not make an already seen picture new
    if (updPending || updBusy) {
      if (pic) { try { URL.revokeObjectURL(pic.src); } catch {} }
      popWaiting = true;
      return;
    }
    // Retry network/decode failures: 5 s for 2 min, then 30 s for 10 min.
    if (!pic && man && popupUrl() && popTries < 44) {   // v208: retry only when a manifest (an upload) exists
      popRetry();
    }
    { const sh0 = $('#sheet'); if (sh0 && sh0.children.length && !sh0.querySelector('.sheetbox.popcard:not([data-upd])')) { if (pic) { try { URL.revokeObjectURL(pic.src); } catch {} } popWaiting = true; return; } }   // BUG-34: never replace another sheet the person is using; retry when it closes
    const needPerm = !granted;   // v130: notifications already on -> picture + OK only; off -> picture + Allow / Later
    // v208: the first time, the card shows once without a picture; after that only for an uploaded picture.
    let firstTime = false; try { firstTime = !localStorage.getItem('lf.popFirst'); } catch {}
    if (!pic && wantsPerm && man && popTries < 3) { popRetry(); return; }   // v208: a picture IS uploaded but slow: it gets about 10 s before the plain card shows
    if (!pic && !firstTime && !wantsPerm) return;
    if (pic && !fresh && !wantsPerm) { URL.revokeObjectURL(pic.src); return; }
    if (notifSheet(pic, needPerm)) { if (needPerm) permShownOpen = true; freePopBlob(); popBlob = pic ? pic.src : ''; if (!pic) { try { localStorage.setItem('lf.popFirst', '1'); } catch {} } }   // v208: the plain first-time card is shown once
    else if (pic) { try { URL.revokeObjectURL(pic.src); } catch {} }   // identical card already on screen: keep it, drop the duplicate download
    // The image was pre-decoded above. Confirm the actual sheet image too before persisting its stamp.
    const shown = $('#sheet .popimg');
    if (pic && shown) {
      try {
        if (typeof shown.decode === 'function') await shown.decode();
        else if (!shown.complete) await new Promise((resolve, reject) => { shown.onload = resolve; shown.onerror = reject; });
        if (shown.naturalWidth > 0 && shown.naturalHeight > 0) {
          // Decoding can finish in a microtask before the browser paints the
          // sheet. Wait two frames so an update arriving in that gap cannot
          // replace an unseen notification and still mark it as consumed.
          await new Promise(resolve => {
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(resolve));
            else setTimeout(resolve, 32);
          });
          if (updPending || !shown.isConnected || $('#sheet .popimg') !== shown) {
            popWaiting = true; popUnseen = null;
          } else if (updBusy) {
            // If a periodic update check began during the paint frames, keep
            // the visible popup unconsumed until that check resolves. If an
            // update is found, it will be shown first; otherwise consume this
            // already-visible popup without displaying it a second time.
            popWaiting = true; popUnseen = { el: shown, id: pic.id, stamp: pic.stamp || '' };
          } else {
            try { localStorage.setItem('lf.popupSeen', pic.id); localStorage.setItem('lf.popupStamp', pic.stamp || ''); } catch {}
          }
        } else {
          shown.remove();
          popRetry();
        }
      } catch {
        shown.remove();
        popRetry();
      }
    }
  } finally {
    popRun = false;
    if (popQueued) { popQueued = false; queueMicrotask(() => startPopup().catch(() => {})); }
  }
}
function popupResumeAfterUpdateCheck() {
  if (!popWaiting || updBusy || updPending) return;
  if (popUnseen && popUnseen.el?.isConnected && $('#sheet .popimg') === popUnseen.el) {
    try { localStorage.setItem('lf.popupSeen', popUnseen.id); localStorage.setItem('lf.popupStamp', popUnseen.stamp); } catch {}
    popUnseen = null; popWaiting = false;
    return;
  }
  popUnseen = null;
  if (popRun) { popQueued = true; return; }
  popWaiting = false;
  setTimeout(() => startPopup().catch(() => {}), 400);
}
/* Constant foreground checking: latest.json is tiny; the picture is downloaded only when its stamp changes. */
let popPeekBusy = false;
async function checkLatestPopup({ force = false } = {}) {
  if ((document.hidden && !force) || !popupUrl() || popPeekBusy) return;
  if (force) popTriedStamp = '';
  popPeekBusy = true;
  try {
    const m = await peekManifest();
    let st = ''; try { st = localStorage.getItem('lf.popupStamp') || ''; } catch {}
    if (m?.stamp && m.stamp !== st && m.stamp !== popTriedStamp) {
      popTries = 0;
      await startPopup();
    }
  } finally { popPeekBusy = false; }
}
// Check immediately at startup/resume and every second while visible.
setInterval(() => { checkLatestPopup().catch(() => {}); }, POPUP_POLL_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !plPending && !plBusy) { popTries = 0; popTriedStamp = ''; startPopup().catch(() => {}); checkLatestPopup().catch(() => {}); }
});
window.addEventListener('online', () => { if (!document.hidden) { popTries = 0; popTriedStamp = ''; checkLatestPopup().catch(() => {}); startUpdateCheck().catch(() => {}); } });
/** v208: Allow on the notification card. Android's own prompt first; when it cannot appear (Android 12 and older, or refused twice) it returns at once, so the app's Notifications page in Android settings is opened instead. */
async function notifAllow() {
  permTrip = true; const t0 = Date.now(); let r = { granted: false };
  try { r = (await Native.requestNotifications()) || r; } catch {}
  if (r.granted) { permTrip = false; toast('Notifications on'); return; }
  if (Date.now() - t0 < 700) {
    try { const o = await Native.openNotificationSettings(); if (o && o.ok === false) throw new Error('no settings'); toast('Switch on Notifications for Liquid Dark', 4000); }
    catch { permTrip = false; toast('Open Android Settings > Apps > Liquid Dark > Notifications', 4500); }
  } else { setTimeout(() => { permTrip = false; }, 2500); toast('Notifications are off'); }
}
async function notifTest() {
  try { let r = await Native.notificationStatus(); if (!r.granted) r = await Native.requestNotifications(); if (!r.granted) return toast('Notifications are off. Allow them in Android settings.'); await Native.notificationTest(); toast('Notification sent'); }
  catch (e) { toast(e === 'Android only' ? 'Notification test works on the phone only' : 'Notification: ' + (e.message || e)); }
}

/* ---------- T6: playlists (create, rename, delete, add / remove / reorder, persist) ---------- */
const sheetHtml = inner => `<div class="scrim" data-act="sheet-close"></div><div class="sheetbox" role="dialog" aria-modal="true">${inner}</div>`;
const curPl = () => { const top = stack[stack.length - 1]; return top && top.t === 'playlist' ? playlists.find(p => p.id === top.id) : null; };
const savePl = () => Native.savePlaylists({ playlists: savablePlaylists() }).then(() => true, () => { toast('Could not save playlists'); return false; });   // v208: resolves true / false, so an import can say whether it was really written to the app's own storage
/* v208: a playlist that is in memory but was never written (a save that failed, or an import that finished while this read was running) is KEPT and saved again, never replaced by the older file. */
async function loadPlaylists() { let unsaved = []; try { const r = await Native.getPlaylists(); if (r && Array.isArray(r.playlists)) { const mem = savablePlaylists(), inFile = new Set(r.playlists.map(p => p && String(p.id))); unsaved = Native.isNative ? mem.filter(p => !inFile.has(p.id)) : []; setPlaylists(r.playlists.concat(unsaved)); } } catch {} if (unsaved.length) savePl(); let trimmed = false; playlists.forEach(p => { if (picsOf(p).length > 1) { const extra = picsOf(p).slice(1); p.pics = picsOf(p).slice(0, 1); ppDrop(p, extra.map(x => x.id)); trimmed = true; } }); if (trimmed) savePl(); playlists.forEach(p => { ppEnsure(p).catch(() => {}); }); }   // v132: playlist covers (first picture). v145c: one picture per playlist, extra old ones are deleted load in the background

/* ---------- T17: export / import playlists (Settings > Playlists). Logic lives in plexport.js (tested). ---------- */
const aaOf = t => { const a = byAlbum(t.albumId) || {}; return { artist: a.artist, album: a.title }; };
const isCancel = e => e === 'cancelled' || (e && e.message === 'cancelled');
/** Sheet with one row per format. kind: 'pl' (playlists; pid = a single playlist, none = all) or 'ls' (listening data). */
let lsPeriod = 'all';   // v161: the period of the listening export (LIO.PERIODS)
function fmtSheet(kind, pid) {
  const F = kind === 'pl' ? PX.FORMATS : LIO.FORMATS, one = pid && playlists.find(p => p.id === pid);
  const title = kind === 'pl' ? (one ? 'Export “' + one.name + '”' : 'Export playlists') : 'Export listening data';
  const lead = kind === 'pl' ? 'Pick where the playlists are going.' : 'Pick the app or format the history is going to. Other apps only know plays (when, what, how long), so those formats hold plays; the Liquid backup holds everything.';
  const periods = kind === 'ls' ? `<div class="actions" style="flex-wrap:wrap">${LIO.PERIODS.map(x => `<button data-act="ls-period" data-p="${x.id}" class="${lsPeriod === x.id ? 'on' : ''}">${x.label}</button>`).join('')}</div>` : '';
  $('#sheet').innerHTML = sheetHtml(`<b>${title}</b><p>${lead}</p>${periods}${F.map(f => `<button class="row" data-act="${kind === 'pl' && !one ? 'xp-pick' : 'xp-go'}" data-k="${kind}" data-f="${f.id}"${one ? ` data-pid="${one.id}"` : ''}><span class="meta blk"><b>${f.label}</b><span>${f.note}</span></span></button>`).join('')}<div class="actions"><button data-act="sheet-close">Cancel</button></div>`);
}
/* v159: export several playlists at once: pick the playlists, then the format is written with only those. */
let xpFmt = 'json', xpSel = new Set();
function xpPickSheet(fmt) { xpFmt = fmt; xpSel = new Set(playlists.map(p => p.id)); renderXpPick(); }
function renderXpPick() {
  const F = PX.FORMATS.find(f => f.id === xpFmt) || { label: 'Export' }, all = xpSel.size === playlists.length;
  const rows = playlists.map(p => `<button class="row ${xpSel.has(p.id) ? 'on' : ''}" data-act="xp-tog" data-pid="${p.id}"><span class="meta blk"><b>${p.name}</b><span>${p.ids.length} ${p.ids.length === 1 ? 'song' : 'songs'}</span></span><span class="chk">${xpSel.has(p.id) ? '✓' : ''}</span></button>`).join('');
  $('#sheet').innerHTML = sheetHtml(`<b>Choose playlists</b><p>${escH(F.label)} · ${xpSel.size} of ${playlists.length} selected</p><div class="picklist">${rows}</div><div class="actions"><button data-act="xp-all">${all ? 'Clear' : 'Select all'}</button><button data-act="sheet-close">Cancel</button><button data-act="xp-pick-ok">Export</button></div>`);
}
async function saveOut(f) {   // f = { name, mime, text } or { name, mime, files:[{name,text}] } (zip)
  if (f.files) return Native.saveFile({ name: f.name, mime: f.mime, bytes: zipFiles(f.files) });
  return Native.saveFile({ name: f.name, mime: f.mime, text: f.text });
}
const failMsg = e => (e && e.message) || (typeof e === 'string' ? e : '') || 'unknown error';
async function exportPl(fmt = 'json', pid = '', ids = null) {   // ids (v159): an explicit set of playlists from the export picker
  const src = savablePlaylists().filter(p => ids ? ids.includes(p.id) : (!pid || p.id === pid));
  if (!src.length) return toast('No playlists to export');
  try {
    let left = 0;   // v159: songs that are not in this library any more are left out of the foreign formats (the Liquid backup keeps them)
    if (fmt === 'json') await Native.saveFile({ name: pid ? safeName(src[0].name, 'playlist') + '.json' : `liquid-dark-playlists-${dateStamp()}.json`, mime: 'application/json', text: exportText((() => { const ob = buildExport(src, tracks, aaOf); if (!pid && favs.length) ob.favorites = buildExport([{ name: 'Favorites', ids: favs }], tracks, aaOf).playlists[0].songs; return ob; })()) });   // BUG-14: favorites travel in the backup
    else { const out = PX.exportLists(src, tracks, aaOf); left = src.reduce((n, p) => n + p.ids.length, 0) - out.reduce((n, p) => n + p.songs.length, 0); await saveOut(PX.buildFiles(fmt, out)); }
    toast(`Exported ${pl(src.length, 'playlist')}` + (left > 0 ? ` · ${pl(left, 'song')} not in your library, left out` : ''), left > 0 ? 4200 : 2600);
  } catch (e) { if (!isCancel(e)) { logLine('W', 'export playlists failed:', failMsg(e)); toast('Export failed: ' + failMsg(e)); } }
}
let plPending = null;   // v159: the playlists waiting for the person's OK in the import preview
let plBusy = false;   // v214: a progress sheet is open (matching or importing): nothing may replace it
/* v220: Refresh art uses the SAME card as the library scan (src/scanview.js: disc, ring, bar, pictures sucked in). The pictures it sucks in are the user's OWN custom pictures / GIFs
   (the library scan shows the covers inside the music files; this one shows what the user uploaded). One tile for every place a custom picture, GIF or Canvas is used
   (the same file counts again for each song / place that shows it). The tiles are built AFTER the reload, so an old picture is never shown. */
let artRunning = false;
/* every place that shows a custom picture / GIF / Canvas right now (after the reload): [{ u: picture address, n: what it is }] */
function refreshItems() {
  const out = [], add = (u, n) => { if (u) out.push({ u, n }); };
  try {
    const orig = t => (t && t.cover ? Native.fileUrl(t.cover) : '');   // the cover that comes with the music file (embedded art / cover.jpg)
    for (const t of tracks) {   // every song: its own picture, else its album's picture (the same GIF counts again for each song), else the original cover of the file
      if (soHas(t)) { add(orig(t), 'Song covers'); continue; }
      const c = spUrls.get(t.id) || alpUrls.get(t.albumId); add(c || orig(t), c ? 'Song pictures' : 'Song covers');
    }
    for (const a of albums) { const c = alpUrls.get(a.id); if (c) add(c, 'Album pictures'); else { const f = albumTracks(a.id).find(x => x.cover); add(orig(f), 'Album covers'); } }   // the albums themselves: custom picture, else the original cover
    const am = apicMap(); for (const n of Object.keys(am)) { const v = String(am[n]); add(v.startsWith('gif:') ? agUrls[n] : v.startsWith('data:') ? v : '', 'Artist pictures'); }   // artists (GIF or photo)
    for (const k of Object.keys(gpUrls)) add(gpUrls[k], 'Genre pictures');   // genres
    for (const pl_ of playlists) for (const c of picsOf(pl_)) add(ppUrl.get(c.id), 'Playlist pictures');   // playlists (every picture of every playlist)
    if (pfMedia) add(pfMedia.type === 'video' ? coverOfAny() : pfMedia.url, 'Profile picture');   // profile picture (a video shows the first cover)
    if (bgUrl) add(bgUrl, 'Home background');   // background (Home and every screen)
    for (const t of tracks) { const cp = cvPath(t); if (cp) add(isVideo(cp) ? (t.cover ? Native.fileUrl(t.cover) : coverOfAny()) : Native.fileUrl(cp), 'Canvas'); }   // Canvas: one for each song that plays one (an MP4 shows the song's cover)
  } catch {}
  return out;
}
const coverOfAny = () => { try { const t = tracks.find(x => x.cover); return t ? Native.fileUrl(t.cover) : ''; } catch { return ''; } };
/* Counts up to the real total while the pictures are sucked into the disc (about 14 ms per place, 3.5 s ... 9 s in all). Every ~75 ms one of the places is flown in (a fair sample when there are thousands). */
function artFly(items) {
  return new Promise(res => {
    const total = items.length; if (!total) return res();
    const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const ms = Math.min(9000, Math.max(3500, total * 14)), t0 = Date.now(); let done = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / ms), want = k >= 1 ? total : Math.round(total * k), step = want - done;
      const it = items[Math.min(total - 1, done + Math.floor(step / 2))];
      done = want;
      scanView.artUpdate({ done, total, covers: still || !it ? [] : [it.u], name: it && it.n });
      if (k >= 1) return setTimeout(res, 700);
      setTimeout(tick, 75);
    };
    tick();
  });
}
/* v217: Refresh art also reloads what refreshAllPics() alone did not: Canvas clips / GIFs (list read again from the phone, files that failed get another chance),
   the colours taken from pictures, and it WAITS until the saved pictures are really back (see v219 below) before the pictures fly in. */
async function refreshExtraArt() {
  try { cvBad.clear(); await loadCanvasList(1); } catch {}
  try {
    document.querySelectorAll('video.cvmedia').forEach(v => { try { v.load(); v.play().catch(() => {}); } catch {} });
    document.querySelectorAll('img.cvmedia').forEach(i => { const u = i.getAttribute('src'); if (u) { i.src = ''; i.src = u; } });
  } catch {}
  try { covTint.clear(); } catch {}
  // v219: waits while pictures are still coming back: gives up after 6 s with no new picture, or 120 s in all (10,000+ pictures take a while); the overlay shows the progress
  const have = () => alpUrls.size + spUrls.size + Object.keys(agUrls).length + Object.keys(gpUrls).length + ppUrl.size;
  const t0 = Date.now(); let last = have(), lastAt = t0;
  while (picsMissing() && Date.now() - lastAt < 6000 && Date.now() - t0 < 120000) {
    await new Promise(r => setTimeout(r, 150));
    const n = have(); if (n !== last) { last = n; lastAt = Date.now(); scanView.artUpdate({ count: `${n} pictures and GIFs loaded…` }); }
  }
  repaintPics();
}
async function refreshArtRun() {
  if (artRunning || plBusy || scanning) return;
  artRunning = true;
  scanView.startArt('Reloading pictures and GIFs', 'Reading your saved pictures…');   // the library scan card, with your own pictures
  pulsePics();   // the pictures on screen are sucked in and pop back out (CSS)
  try {
    try { await mirrorSync(); } catch {}   // the list of saved picture files is read again first (a file that is gone is dropped, one that only exists as a file is found)
    refreshAllPics(true);
    await refreshExtraArt();   // waits until the saved pictures are really back
    const items = refreshItems();   // built AFTER the reload: only the fresh pictures are shown
    scanView.artUpdate({ done: 0, total: items.length, title: 'Reloading pictures and GIFs' });
    const lib = loadLib(true, true, true);   // quiet: no library scan screen; the folder pictures are re-checked while the pictures fly in
    await Promise.all([artFly(items).then(() => scanView.artUpdate({ title: 'Checking folder pictures', done: items.length, total: items.length })), lib]);
    scanView.artFinish({ title: 'Refresh finished', count: items.length ? `${items.length.toLocaleString('en-US')} pictures and GIFs reloaded` : 'No custom pictures or GIFs found', note: `${tracks.length.toLocaleString('en-US')} songs checked${picsMissing() ? ' · a few are still loading and will appear shortly' : ''}` });
  } catch (e) {
    scanView.artFinish({ title: 'Refresh stopped', count: failMsg(e) });
  } finally { artRunning = false; }
}
const plBusySheet = (title, sub, pct) => { plBusy = true; $('#sheet').innerHTML = sheetHtml(`<b>${title}</b><p>${sub}</p><div class="plbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${Math.max(4, Math.min(100, pct))}%"></i></div><div class="plspin" aria-hidden="true"></div>`); };
const plSummarySheet = rows => { plBusy = false; $('#sheet').innerHTML = sheetHtml(`<b>Import finished</b><p>What changed in your app:</p><div class="plstats">${rows.map(([k, v]) => `<div class="row"><span class="meta blk"><b>${v}</b><span>${k}</span></span></div>`).join('')}</div><div class="actions"><button data-act="sheet-close">Done</button></div>`); };
async function importPl() {
  if (!tracks.length) return toast('Choose your music folder first, then import');
  try {
    const r = await Native.openFiles({ multiple: true });
    const files = await ZR.expandFiles((r && r.files) || [], { want: ZR.PLAYLIST_WANT }).catch(e => { throw new Error(failMsg(e)); });   // v159: a .zip of playlists (several M3U8 / XSPF files) is opened here
    const imported = []; let skipped = 0;
    for (const f of files) { try { imported.push(...PX.parseAny(f.text, f.name)); } catch (e) { if (/newer/.test(e.message)) throw e; if (!f.zip) skipped++; } }   // a file inside a zip that is not a playlist is not an error
    const favIds = [];   // BUG-14: favorites stored in a Liquid backup .json
    for (const f of files) { if (/\.json$/i.test(f.name || '')) { try { const o = JSON.parse(f.text); if (o && Array.isArray(o.favorites)) favIds.push(...PX.planForeign([{ name: 'Favorites', songs: o.favorites }], tracks, aaOf, []).lists[0].ids); } catch {} } }
    if (!imported.length && favIds.length) { toast(`Favorites: ${addFavs(favIds)} added`, 3000); return; }
    if (!imported.length) throw new Error('No playlists found. Use .json, .m3u8, .xspf, .pls or .csv (or a .zip of them)');
    const have = savablePlaylists();
    const songCount = imported.reduce((n, p) => n + p.songs.length, 0);
    plBusySheet('Matching songs', `${imported.length} playlist${imported.length === 1 ? '' : 's'}, ${songCount} songs. Please wait.`, 35);
    await new Promise(res => setTimeout(res, 60));   // let the progress sheet paint before the matching runs
    const plan = PX.planForeign(imported, tracks, aaOf, have.map(p => p.name), have.map(p => ({ name: p.name, ids: p.ids })));
    plBusy = false;
    if (!plan.lists.length && favIds.length) { toast(`Favorites: ${addFavs(favIds)} added`, 3000); return; }
    if (!plan.lists.length) { toast(plan.already.length ? 'Nothing new: those playlists are already in the app' : 'Nothing to import', 3200); return; }
    plPending = { plan, skipped, favIds, targets: plan.lists.map(() => null) };   // targets[i]: id of the playlist this list is merged into, null = a new playlist
    plImportSheet();
  } catch (e) { if (!isCancel(e)) { logLine('W', 'import playlists failed:', failMsg(e)); toast('Import failed: ' + failMsg(e), 3200); } }
}
/** v159: the preview before anything is added: each list (tap it to choose new or merge), what is already in the app, the songs not in the library (can be saved to a file). */
function plImportSheet() {
  const { plan, skipped, targets } = plPending;
  const rows = plan.lists.map((l, i) => {
    const t = targets[i] && playlists.find(p => p.id === targets[i]);
    const where = targets[i] === 'skip' ? 'not imported' : t ? `merge into “${t.name}”` : `new playlist${l.name !== l.raw ? ` (as “${escH(l.name)}”)` : ''}`;
    return `<button class="row" data-act="plimport-pick" data-i="${i}"><span class="meta blk"><b>${escH(l.raw)}</b><span>${l.ids.length} of ${l.total} songs${l.missing ? ` · ${l.missing} not in your library` : ''} · ${where}</span></span></button>`;
  }).join('');
  const already = plan.already.length ? `<p>${plan.already.length} already in the app (same name and songs), left out: ${plan.already.map(a => escH(a.name)).join(', ')}.</p>` : '';
  const miss = plan.missing.length ? `<details class="plmiss"><summary>${plan.missing.length} not in your library (left out): tap to see</summary><div class="picklist">${plan.missing.slice(0, 8).map(m => `<div class="row"><span class="meta blk"><b>${escH(m.title)}</b><span>${escH(m.artist)}</span></span></div>`).join('')}${plan.missing.length > 8 ? `<div class="empty">and ${plan.missing.length - 8} more</div>` : ''}</div><div class="actions"><button data-act="plimport-missing">Save missing songs to a file</button></div></details>` : '';   // v214: collapsed, so the Import button is not pushed below the fold
  $('#sheet').innerHTML = sheetHtml(`<b>Import ${pl(plan.lists.length, 'playlist')}?</b><p>${plan.matched} of ${plan.total} songs matched in your library. Tap a playlist to choose where it goes. Nothing you have is changed except the playlists you merge into.</p><div class="picklist">${rows}</div><div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="plimport-ok">Import</button></div>${already}${miss}${skipped ? `<p>${pl(skipped, 'file')} skipped (not playlists).</p>` : ''}`);   // v214: Cancel / Import right under the list
}
/** v159: where one imported list goes: a new playlist, or merged into one that already exists. */
function plTargetSheet(i) {
  const { plan, targets } = plPending, cur = targets[i];
  const rows = [`<button class="row ${!cur ? 'on' : ''}" data-act="plimport-set" data-i="${i}" data-t=""><span class="lbl" style="font-size:1.0625rem">New playlist</span></button>`, `<button class="row ${cur === 'skip' ? 'on' : ''}" data-act="plimport-set" data-i="${i}" data-t="skip"><span class="lbl" style="font-size:1.0625rem">Don't import this one</span></button>`]
    .concat(playlists.map(p => `<button class="row ${cur === p.id ? 'on' : ''}" data-act="plimport-set" data-i="${i}" data-t="${p.id}"><span class="lbl" style="font-size:1.0625rem">Merge into ${p.name}</span><span class="cnt">${p.ids.length}</span></button>`)).join('');
  $('#sheet').innerHTML = sheetHtml(`<b>Where should “${escH(plan.lists[i].raw)}” go?</b><p>Merging adds its songs to the end of that playlist. Songs already in it are not repeated.</p><div class="picklist">${rows}</div><div class="actions"><button data-act="plimport-back">Back</button></div>`);
}
async function plImportOk() {
  if (!plPending) return;
  const { plan, targets, favIds } = plPending; plPending = null;
  plBusySheet('Importing playlists', `${plan.lists.length} playlist${plan.lists.length === 1 ? '' : 's'} · ${plan.matched} songs. Please wait.`, 50);
  const fAdded = favIds && favIds.length ? addFavs(favIds) : 0;
  const names = new Set(savablePlaylists().map(p => nameKey(p.name))), tag = Date.now().toString(36), used = new Set(playlists.map(p => p.id));
  let added = 0, merged = 0, mergedSongs = 0, left = 0;
  plan.lists.forEach((l, i) => {
    if (targets[i] === 'skip') { left++; return; }
    const t = targets[i] && playlists.find(p => p.id === targets[i]);
    if (!t && !l.ids.length) { left++; return; }   // BUG-A: a list with 0 matched songs is not added as an empty playlist
    if (t) { const m = PX.mergeIds(t.ids, l.ids); t.ids = m.ids; merged++; mergedSongs += m.added; return; }
    let id = 'p' + tag + i; while (used.has(id)) id += 'x'; used.add(id);
    playlists.push({ id, name: E(freeName(l.raw, names)), ids: l.ids }); added++;   // the final name is chosen now, so a list merged elsewhere does not take a number
  });
  const saved = await savePl();   // v208: the playlists are written into the app's own storage (playlists.json) BEFORE we say "Imported"; the import file is not needed afterwards
  renderMain(); renderSub();
  const parts = []; if (added) parts.push(pl(added, 'new playlist')); if (merged) parts.push(`${merged} merged (${mergedSongs} songs added)`); if (left) parts.push(`${left} not imported`);
  if (fAdded) parts.push(`${fAdded} favorites`);
  toast(saved ? `Imported ${parts.join(', ') || 'nothing'}` : `Imported ${parts.join(', ') || 'nothing'}, but they could not be saved yet. Please import again`, saved ? 3400 : 6000);
  plSummarySheet([['new playlists', added], ['merged into your playlists', merged ? `${merged} (${mergedSongs} songs added)` : 0], ['songs matched in your library', `${plan.matched} of ${plan.total}`], ['not in your library (left out)', plan.missing.length], ['not imported', left], ['favorites added', fAdded], ['saved to the app', saved ? 'yes' : 'NO: import again']]);   // v214: the numbers, after the save
}
async function saveMissing(missing) {
  try { await saveOut(PX.missingCsv(missing)); toast(`Saved ${pl(missing.length, 'song')} not in your library`); }
  catch (e) { if (!isCancel(e)) { logLine('W', 'save missing songs failed:', failMsg(e)); toast('Save failed: ' + failMsg(e), 3200); } }
  finally { if (plPending && !plBusy) plImportSheet(); }   // the preview comes back after the save picker
}

/* ---------- listening data: export / import (formats in listenio.js, tested) ---------- */
async function exportLs(fmt, period = 'all') {
  try {
    const r = await Native.getListens({ from: 0, to: Date.now() + 864e5 }), all = (r && r.segs) || [];
    if (!all.length) return toast('No listening history yet');
    const segs = LIO.inPeriod(all, period);   // v161: only the chosen period
    if (!segs.length) return toast('No listening in that period');
    const f = LIO.buildExport(fmt, segs, new Date(), set.userName || '');
    if (!f.count) return toast('Nothing to export yet: a play counts after 10 seconds of listening');
    await saveOut(f);
    toast((fmt === 'liquid' ? `Exported ${f.count.toLocaleString()} listening records` : `Exported ${pl(f.count, 'play')}`) + (period !== 'all' ? ` · ${LIO.PERIODS.find(x => x.id === period).label.toLowerCase()}` : ''));
  } catch (e) { if (!isCancel(e)) { logLine('W', 'export listening failed:', failMsg(e)); toast('Export failed: ' + failMsg(e), 3200); } }
}
/* v161: import is two steps: read + plan (nothing written), then the preview, then the write. */
let lsPending = null;
/** BUG-286: the existing history is needed to skip duplicates, so a failed read must stop the import (it used to look like an empty history and everything was counted twice). One retry, then an error. */
async function readImportHistory() {
  let err;
  for (let i = 0; i < 2; i++) { try { const r = await Native.getListens({ from: 0, to: Date.now() + 864e5 }); if (Array.isArray(r && r.segs)) return r.segs; } catch (e) { err = e; } }
  throw new Error('Could not read your listening history, so nothing was imported (it cannot be checked for duplicates). Nothing was changed, please try again.' + (err ? ' ' + failMsg(err) : ''));
}
async function importLs() {
  try {
    const r = await Native.openFiles({ multiple: true });
    const rows = [], seen = new Set(); let matched = 0, skipped = 0, fileRecords = 0, alreadyIn = 0;
    toast('Reading…', 6000);
    const files = await ZR.expandFiles((r && r.files) || []).catch(e => { throw new Error(failMsg(e)); });   // a .zip (Tempo backup, Spotify / ListenBrainz download) is opened here
    const zips = new Set(files.filter(f => f.zip).map(f => f.zip)), okZip = new Set();
    const haveKeys = LIO.playKeysOf(await readImportHistory());   // plays already in the history (by cleaned name too)
    for (const f of files) {
      try {
        const p = LIO.parseListens(f.text, f.name), plan = p.segs ? LIO.planLiquid(p.segs, tracks, aaOf) : LIO.planPlays(p.plays, tracks, aaOf, haveKeys);
        const c = LIO.countInHistory(p, haveKeys); fileRecords += c.total; alreadyIn += c.already;
        for (const x of plan.rows) rows.push(x); matched += plan.matched; seen.add(LIO.SOURCE_NAMES[p.format] || p.format); if (f.zip) okZip.add(f.zip);
      }
      catch (e) { if (/newer/.test(e.message)) throw e; if (!f.zip) skipped++; }   // a file inside a zip that is not listening data is not an error
    }
    for (const z of zips) if (!okZip.has(z)) skipped++;
    if (!rows.length && fileRecords) { toast('Nothing new: all of it was already in your history', 3600); return; }
    if (!rows.length) throw new Error('No listening history found. Supported: Liquid backup, Tempo backup, ListenBrainz, Last.fm (CSV / JSON), Spotify, Maloja, YouTube Music, Apple Music, .scrobbler.log, or a CSV with artist, track and date columns (.zip files too)');
    const toAdd = rows.filter(x => !haveKeys.has(LIO.playKey(x.s, x.t, x.a)));
    let first = Infinity, last = -Infinity; for (const x of rows) { if (x.s < first) first = x.s; if (x.s > last) last = x.s; }   // BUG-11: no spread of hundreds of thousands of arguments
    lsPending = { rows, matched, skipped, sources: [...seen], fileRecords, alreadyIn, toAdd: toAdd.length, first, last };
    lsImportSheet();
  } catch (e) { if (!isCancel(e)) { logLine('W', 'import listening failed:', failMsg(e)); toast('Import failed: ' + failMsg(e), 4200); } }
}
function lsImportSheet() {
  const p = lsPending, day = t => new Date(t).toLocaleDateString();
  $('#sheet').innerHTML = sheetHtml(`<b>Import listening data?</b><p>${p.sources.map(escH).join(', ')}${p.first ? ` · ${day(p.first)} to ${day(p.last)}` : ''}</p>
    <div class="picklist"><div class="row"><span class="meta blk"><b>${pl(p.fileRecords, 'record')} in the file</b><span>${pl(p.alreadyIn, 'record')} already in your history</span></span></div>
    <div class="row"><span class="meta blk"><b>${pl(p.toAdd, 'record')} to add</b><span>${p.matched.toLocaleString()} matched to songs in your library</span></span></div></div>
    ${p.skipped ? `<p>${pl(p.skipped, 'file')} skipped (not listening data).</p>` : ''}
    <p style="color:var(--text-2);font-size:0.875rem">Importing never removes anything you have, and a record is never counted twice.</p>
    <div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="ls-import-ok">Import</button></div>`);
}
async function lsImportOk() {
  if (!lsPending) return;
  const { rows, matched, skipped } = lsPending; lsPending = null;
  try {
    toast('Importing ' + rows.length.toLocaleString() + ' listens…', 6000);
    const fresh = [], have = new Set(tracks.map(t => t.id)); let statsSaveFailed = false;
    const applyBatch = list => {   // BUG-12: play counts follow every batch that was really stored, so a later failed batch cannot leave them stale
      const counted = list.filter(x => x.q && have.has(x.i)).sort((a, b) => a.s - b.s);
      for (const x of counted) { const c = stats[x.i]; stats[x.i] = { plays: (c ? c.plays : 0) + 1, last: Math.max(c ? c.last : 0, x.s) }; }
      return counted.length;
    };
    let changed = 0;
    try {
      for (let i = 0; i < rows.length; i += 1500) { const res = await Native.importListens(rows.slice(i, i + 1500)), add = (res && res.added) || []; for (const a of add) fresh.push(a); changed += applyBatch(add); }
    } finally {
      if (changed) { try { await saveUser(STATS_FILE, stats); } catch { statsSaveFailed = true; logLine('W', 'stats: could not save after import'); } }   // v208: waited for, so the play counts are on disk before "Imported" is shown
    }
    closeSheet(); lsx.dirty(); refreshHome(); renderSub(true);
    toast(LIO.summary(fresh.length, rows.length, matched) + (skipped ? ` · ${pl(skipped, 'file')} skipped` : '') + (statsSaveFailed ? ' · the play counts could not be saved, the history itself is saved' : ''), 5200);
  } catch (e) { if (!isCancel(e)) { logLine('W', 'import listening failed:', failMsg(e)); toast('Import failed: ' + failMsg(e), 4200); } }
}

/* ---------- settings: export / import (shape + rules in settingsio.js, tested) ---------- */
let setPending = null;
async function exportSettings() {
  const extras = {}; for (const k of SIO.EXTRA_KEYS) { try { const v = localStorage.getItem(k); if (v != null) extras[k] = v; } catch {} }
  try { /* v162: the Home layout travels with names, not only ids */ const ob = SIO.buildExport({ ...set, home: homeWithNames(set.home) }, extras, APP_VERSION); await Native.saveFile({ name: SIO.fileName(), mime: 'application/json', text: SIO.exportText(ob) }); toast('Settings exported · ' + pl(SIO.countValues(ob.settings) + Object.keys(ob.extras).length, 'value'), 3200); }
  catch (e) { if (!isCancel(e)) { logLine('W', 'export settings failed:', failMsg(e)); toast('Export failed: ' + failMsg(e), 3200); } }
}
let setPick = new Set();   // v161: the setting groups ticked in the import sheet
const currentExtras = () => { const o = {}; for (const k of SIO.EXTRA_KEYS) { try { const v = localStorage.getItem(k); if (v != null) o[k] = v; } catch {} } return o; };
async function importSettings() {
  try {
    const r = await Native.openFiles({ multiple: false }), f = r && r.files && r.files[0]; if (!f) return;
    setPending = SIO.parseImport(f.text, DEF); setPending.name = f.name;   // BUG-317: wrong-kind values are dropped (the default is used)
    setPick = new Set(SIO.groupDiffs(set, setPending.settings, setPending.extras, currentExtras()).filter(g => g.status !== 'same').map(g => g.key));   // the groups that change by default
    setImportSheet();
  } catch (e) { if (!isCancel(e)) { logLine('W', 'import settings failed:', failMsg(e)); toast('Import failed: ' + failMsg(e), 3200); } }
}
function setImportSheet() {
  const groups = SIO.groupDiffs(set, setPending.settings, setPending.extras, currentExtras());
  const label = k => k === SIO.EXTRAS_GROUP ? 'Canvas switch' : SIO.groupLabel(k);   // v208: plain names (liquid glass, lyrics animation, lens refraction)
  const word = { new: 'new', changed: 'will change', same: 'same as now' };
  const rows = groups.map(g => `<button class="row ${setPick.has(g.key) ? 'on' : ''}" data-act="set-tog" data-k="${g.key}"><span class="meta blk"><b>${escH(label(g.key))}</b><span>${word[g.status]} · ${g.values} ${g.values === 1 ? 'value' : 'values'}</span></span><span class="chk">${setPick.has(g.key) ? '✓' : ''}</span></button>`).join('');
  const n = groups.filter(g => setPick.has(g.key)).length, all = n === groups.length;
  $('#sheet').innerHTML = sheetHtml(`<b>Use these settings?</b><p>From “${escH(setPending.name)}”${setPending.appVersion ? ` (made in version ${escH(setPending.appVersion)})` : ''}. Tick what to bring in; everything else stays as it is. The app reloads after.</p><div class="picklist">${rows}</div><p style="color:var(--text-2);font-size:0.875rem">Not in a settings file: ${SIO.NOT_INCLUDED.join('; ')}.</p><div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="set-all">${all ? 'None' : 'All'}</button><button data-act="setimport-ok" ${n ? '' : 'disabled'}>Use ${n} selected</button></div>`);
}
function applyImportedSettings() {
  if (!setPending) return;
  try {
    const useExtras = setPick.has(SIO.EXTRAS_GROUP), picked = SIO.pickSettings(setPending.settings, [...setPick]);
    const merged = SIO.mergeSettings(set, picked);
    for (const k of Object.keys(set)) delete set[k];
    Object.assign(set, merged);
    set.tabs = cleanTabs(set.tabs); set.home = cleanHome(set.home); set.anim = (set.anim && typeof set.anim === 'object' && !Array.isArray(set.anim)) ? set.anim : {};   // BUG-431: clean the values applySettings() reads, so a bad imported value cannot throw halfway
    if (!Number.isFinite(+set.tabPct)) set.tabPct = 100; set.tabPct = Math.min(TAB_MAX, Math.max(TAB_MIN, Math.round(+set.tabPct)));
    set.npCover = +set.npCover > 0 ? Math.min(NPC_MAX, Math.max(NPC_MIN, Math.round(+set.npCover))) : 0;
    set.npImmersive = set.npImmersive === true; set.npTapOrig = set.npTapOrig !== false;
    set.lyAnim = cleanLya(set.lyAnim); set.bgDim = cleanDim(set.bgDim); set.bgFit = cleanFit(set.bgFit);
    if (!['classic', 'cover'].includes(set.lyricStyle)) set.lyricStyle = DEF.lyricStyle;
    delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur; set.lyricBg = set.lyricStyle === 'cover' && !set.lyricBlur && ['home', 'custom'].includes(set.lyricBg) ? set.lyricBg : ''; if (set.lyricBg) set.lyricPal = false; set.lyricInk = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   /* v278: lyrics text colour (auto = the style's own: red on classic, white on the others) */ /* v277: 5 styles: + Home screen background, Custom lyrics background (style 'cover' + lyricBg) */   // 3 styles: classic, Cover colour palette, Cover blur. A saved plain 'cover' or the removed Cover colour mix becomes the palette
    set.timeStyle = cleanTimeStyle(set.timeStyle);
    if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize; set.lyricPx = cleanLyPx(set.lyricPx, set.lyricSize);
    if (useExtras) for (const [k, v] of Object.entries(setPending.extras)) { try { localStorage.setItem(k, v); } catch {} }
    applySettings();   // writes lf.settings; the reload below re-runs the start-up checks on every value
    let wrote = false; try { wrote = localStorage.getItem('lf.settings') === JSON.stringify(set); } catch {}   // v208: read back: the settings are in the app's own storage, the import file is not needed afterwards
    if (!wrote) { saveSettingsNow(); try { wrote = localStorage.getItem('lf.settings') === JSON.stringify(set); } catch {} }
    if (!wrote) { toast('Could not save the settings on this phone. Please try again', 4200); return; }
    setPending = null; closeSheet(); toast('Settings imported');
    setTimeout(() => location.reload(), 500);
  } catch (e) { logLine('W', 'apply settings failed:', failMsg(e)); toast('Could not apply the settings'); }
}
function nameSheet(title, value, act) {
  $('#sheet').innerHTML = sheetHtml(`<b>${title}</b><div class="searchpill field"><input id="nm" aria-label="Playlist name" value="${value}" placeholder="Playlist name" autocomplete="off"></div>
    <div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="${act}">Save</button></div>`);
  setTimeout(() => { const i = $('#nm'); if (i) { i.focus(); i.select(); } }, 60);
}
function plMenuSheet() {
  const p = curPl(); if (!p) return;
  $('#sheet').innerHTML = sheetHtml(`<b>${p.name}</b><div style="height:12px"></div>
    <button class="row" data-act="pick-open"><span class="lbl" style="font-size:1.0625rem">Add Songs</span></button>
    <button class="row" data-act="pp-edit"><span class="lbl" style="font-size:1.0625rem">Playlist picture or GIF</span></button>
    <button class="row" data-act="pl-edit"><span class="lbl" style="font-size:1.0625rem">${plEdit ? 'Done Editing' : 'Edit Songs'}</span></button>
    <button class="row" data-act="pl-rename"><span class="lbl" style="font-size:1.0625rem">Rename</span></button>
    <button class="row" data-act="xp-pl"><span class="lbl" style="font-size:1.0625rem">Export this playlist</span></button>
    <button class="row" data-act="pl-del"><span class="lbl" style="font-size:1.0625rem;color:var(--accent)">Delete Playlist</span></button>`);
}
function pickSheet() {
  pickN = 60;
  $('#sheet').innerHTML = sheetHtml(`<b>Add Songs</b><div class="searchpill field"><input id="pq" aria-label="Search songs" placeholder="Search songs" autocomplete="off"></div><div class="picklist" id="picklist"></div>
    <div class="actions"><button data-act="pick-done">Done</button></div>`);
  pickList();
}
let apicAlbN = 60;
function apicAlbums() {   // BUG-19: the album cover picker shows 60 albums at a time, "Show more" adds 60
  const mine = new Set(artistTracks(apicFor).map(t => t.albumId)), list = albums.filter(a => mine.has(a.id)).concat(albums.filter(a => !mine.has(a.id)));
  $('#sheet').innerHTML = sheetHtml(`<b>Pick an album cover</b><div class="grid" style="max-height:55vh;overflow:auto;margin-top:10px">${list.slice(0, apicAlbN).map(a => `<button class="card" data-act="apic-album" data-id="${a.id}"><span class="cover blk" style="--g:${a && a.g}"></span><span class="t blk">${a.title}</span></button>`).join('')}${list.length > apicAlbN ? `<button class="card" data-act="apic-albums-more"><span class="t">Show more (${list.length - apicAlbN} left)</span></button>` : ''}</div><div class="actions"><button data-act="apic-back">Back</button><button data-act="sheet-close">Close</button></div>`);
}
let pickN = 60;   // B3: the picker shows 60 at a time, "Show more" adds 60
function pickList() {
  const p = curPl(), el = $('#picklist'); if (!p || !el) return;
  const q = ($('#pq')?.value || '').trim().toLowerCase(), have = new Set(p.ids);
  const all = tracks.filter(t => !q || has(t.title + ' ' + (t.trackArtist || '') + ' ' + trackAlbum(t).title + ' ' + trackAlbum(t).artist, q));
  const hits = all.slice(0, pickN), y = el.scrollTop;
  el.innerHTML = hits.length ? hits.map(t => { const a = trackAlbum(t); return `<button class="row song ${have.has(t.id) ? 'on' : ''}" data-act="pick-t" data-pid="${t.id}"><span class="thumb cover blk" style="--g:${gOfT(t)}"></span><span class="meta blk"><b>${t.title}</b><span>${t.trackArtist || a.artist}</span></span><span class="chk">${have.has(t.id) ? '✓' : '+'}</span></button>`; }).join('') + (all.length > pickN ? `<button class="row" data-act="pick-more"><span class="lbl" style="font-size:1.0625rem">Show more (${all.length - pickN} left)</span></button>` : '') : '<div class="empty">No songs found.</div>';
  el.scrollTop = y;
}
function plAction(act, d, b) {
  const p = curPl();
  switch (act) {
    case 'sheet-close': closeSheet(); break;
    case 'newpl': nameSheet('New Playlist', '', 'newpl-ok'); break;
    case 'newpl-ok': { const n = E(($('#nm').value || '').trim()); if (!n) return warn('Type a name'); const np = { id: newPid(), name: n, ids: [] }; playlists.push(np); savePl(); plEdit = false; push('playlist', np.id); pickSheet(); break; }
    case 'plmenu': plMenuSheet(); break;
    case 'pl-edit': plEdit = !plEdit; closeSheet(); renderSub(); break;
    case 'pl-rename': if (p) nameSheet('Rename Playlist', p.name, 'rename-ok'); break;
    case 'rename-ok': { const n = E(($('#nm').value || '').trim()); if (!n || !p) return warn('Type a name'); p.name = n; savePl(); closeSheet(); renderSub(); break; }
    case 'pl-del': if (p) $('#sheet').innerHTML = sheetHtml(`<b>Delete “${p.name}”?</b><p>The songs stay in your library.</p><div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="del-ok">Delete</button></div>`); break;
    case 'del-ok': if (p) { ppDrop(p, picsOf(p).map(x => x.id)); playlists.splice(playlists.indexOf(p), 1); savePl(); closeSheet(); goBack(); } break;
    case 'pick-open': pickSheet(); break;
    case 'pick-more': pickN += 60; pickList(); break;
    case 'pp-add': closeSheet(); ppAdd(); break;   // v132
    case 'pp-edit': { const q = curPl(); if (q) picSheet('Picture for ' + q.name, picsOf(q).length > 0, 'pp-add', 'pp-reset', 'Back to default playlist picture or GIF'); break; }   // v145c
    case 'pp-reset': { const q = curPl(); if (q) { ppDrop(q, picsOf(q).map(x => x.id)); q.pics = []; savePl(); closeSheet(); toast('Back to default playlist picture'); renderSub(true); } break; }
    case 'pp-open': if (p) ppOpen(p.id, +d.i); break;
    case 'pp-close': ppClose(); break;
    case 'pp-prev': case 'pp-next': if (ppView) ppOpen(ppView.pid, ppView.i + (act === 'pp-next' ? 1 : -1)); break;
    case 'pp-del': { const q = ppView && playlists.find(x => x.id === ppView.pid), c = q && picsOf(q)[ppView.i]; if (c) { q.pics = q.pics.filter(x => x.id !== c.id); ppDrop(q, [c.id]); savePl(); if (q.pics.length) ppOpen(q.id, Math.min(ppView.i, q.pics.length - 1)); else ppClose(); toast('Picture removed'); repaintAll(); } break; }
    case 'pp-rm': { if (!p) break; const c = picsOf(p)[+d.i]; if (c) { p.pics = p.pics.filter(x => x.id !== c.id); ppDrop(p, [c.id]); savePl(); repaintAll(); } break; }
    case 'pick-done': closeSheet(); renderSub(); break;
    case 'pick-t': { if (!p) break; const k = p.ids.indexOf(d.pid); if (k >= 0) p.ids.splice(k, 1); else p.ids.push(d.pid); savePl(); b.classList.toggle('on', k < 0); b.querySelector('.chk').textContent = k < 0 ? '✓' : '+'; break; }
    case 'pl-rm': case 'pl-up': case 'pl-down': {
      if (!p) break; const ts = plTracks(p), pos = plPositions(p), i = +d.i, t = ts[i]; if (!t) break;
      const k = pos[i];   // Bug 2: the real place in p.ids (indexOf would find the FIRST copy of a duplicated song)
      if (act === 'pl-rm') p.ids.splice(k, 1);
      else { const o = ts[act === 'pl-up' ? i - 1 : i + 1]; if (!o) break; const j = pos[act === 'pl-up' ? i - 1 : i + 1]; [p.ids[k], p.ids[j]] = [p.ids[j], p.ids[k]]; }
      savePl(); renderSub(true); break;
    }
    default: return false;
  }
  return true;
}

/* ---------- T19: favorites (ids in store 'favorites', newest first; logic in favorites.js) ---------- */
function addFavs(ids) { const have = new Set(favs), add = ids.filter((id, i) => !have.has(id) && ids.indexOf(id) === i); if (add.length) { favs = [...favs, ...add]; saveUser(FAV_FILE, favs).catch(() => toast('Could not save favorites')); refreshHome(); } return add.length; }
let favs = [], favSort = 'new';   // BUG-5: Favorites sort (newest / title / artist)
const favSorted = () => { const ts = favTracks(favs, tracks); return favSort === 'new' ? ts : sortTracks(ts, favSort, trackAlbum); };
// BUG-395: a saved file is written only after it was read (an unreadable file must never be replaced by the empty defaults)
const loadedOk = new Set();
const saveUser = (name, data) => loadedOk.has(name) ? store.set(name, data) : Promise.reject(new Error('not loaded: ' + name));
async function loadFavs() {   // BUG-11: favorites.bak is used only when the main file cannot be read (never after the user emptied it)
  try { favs = cleanFavs(await store.get(FAV_FILE)); loadedOk.add(FAV_FILE); if (favs.length) store.set(FAV_FILE + '-bak', favs).catch(() => {}); }
  catch { try { favs = cleanFavs(await store.get(FAV_FILE + '-bak')); loadedOk.add(FAV_FILE); } catch { favs = []; } }
}
function favToggle(id) {
  if (!id) return;
  const was = isFav(favs, id);
  favs = toggleFav(favs, id);
  saveUser(FAV_FILE, favs).catch(() => toast('Could not save favorites'));
  toast(was ? 'Removed from Favorites' : 'Added to Favorites');
  renderNP(); refreshHome();
  if (!was) { const h = document.querySelector('.np [data-act="fav"]'); if (h) { h.classList.add('popit'); setTimeout(() => h.classList.remove('popit'), 700); } }   // v54: the heart pops when you favourite
  const top = stack[stack.length - 1]; if (top && top.t === 'favorites') renderSub(true);
}

/* ---------- T20: Recently / Most Played. Count = 10 s of real listening or half the song (logic + tests in stats.js). Stored in store 'stats'. ---------- */
let stats = {}, statsGen = 0;   // BUG-103: statsGen counts clears; a take that started before one is dropped
const counter = makeCounter();
let statsReady = false;   // v145c: plays are only merged AFTER the saved play counts were read, so a play that arrives during start-up can never overwrite them
async function loadStats() { try { stats = cleanStats(await store.get(STATS_FILE)); loadedOk.add(STATS_FILE); } catch { stats = {}; } statsReady = loadedOk.has(STATS_FILE); }   // BUG-395: plays wait (and stay on the phone) until the saved counts were really read
/* v145: plays the Android plugin counted while the WebView was paused in the background (LiquidNative takePlays; merge logic + tests in stats.js). */
let mergingPlays = false, mergeAgain = false;
async function mergeNativePlays() {
  if (!Native.isNative || !statsReady) return;
  if (mergingPlays) { mergeAgain = true; return; }   // a play arrived while one take is running: take again right after, never skip it
  mergingPlays = true;
  try {
    do {
      mergeAgain = false;
      const gen = statsGen;
      const r = await Native.takePlays(), list = (r && Array.isArray(r.plays)) ? r.plays : [];
      if (gen !== statsGen) continue;   // BUG-103: plays taken before a clear are not merged back
      if (!list.length) continue;
      const m = mergePlays(stats, list);
      if (m.added) { stats = m.stats; refreshHome(); logLine('I', 'stats: ' + m.added + ' play(s) added'); }
      // The plays stay on the Android side until the saved play counts are really on disk; a failed save is tried again on the next take (mergePlays skips what is already counted).
      try { await saveUser(STATS_FILE, stats); await Native.ackPlays({ plays: list.map(p => ({ id: p.id, ts: p.ts })) }); }
      catch (e) { logLine('W', 'stats: could not save, plays kept for the next try:', e && e.message || e); break; }
    } while (mergeAgain);
  } catch (e) { logLine('W', 'stats: could not read plays:', e && e.message || e); }
  finally { mergingPlays = false; }
}
if (Native.isNative) {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { mergeNativePlays(); lsx.dirty(); refreshHome(); } });
  import('@capacitor/app').then(({ App }) => App.addListener('appStateChange', ({ isActive }) => { if (isActive) mergeNativePlays(); })).catch(() => {});
  on('onPlayCounted', () => { mergeNativePlays(); lsx.dirty(); });   // the service counted a play (10 s of real listening): Recently / Most Played update at once
}
/* Track ids are hashes of document URIs. If Android hands out different URIs after the music folder is picked again, saved favorites,
   play counts and playlist entries would point at nothing. relinkSaved() keeps each saved id's folder-relative path (store 'idkeys') and moves
   dead ids to the song with the same path (logic + tests in idrelink.js). Records saved before this fix have no path yet, so only future re-picks are covered. */
async function relinkSaved() {
  try {
    if (!tracks.length) return;
    const keys = cleanKeys(await store.get(IDKEYS_FILE).catch(() => null));
    const r = relinkIds({ favs, stats, playlists: savablePlaylists(), keys, pics: Object.keys(spMap()) }, tracks);
    if (r.favsChanged) { favs = r.favs; saveUser(FAV_FILE, favs).catch(() => logLine('W', 'relink: could not save favorites')); }
    if (r.statsChanged) { stats = r.stats; saveUser(STATS_FILE, stats).catch(() => logLine('W', 'relink: could not save stats')); }
    if (r.playlistsChanged) { setPlaylists(r.playlists); savePl(); }
    if (r.keysChanged) store.set(IDKEYS_FILE, r.keys).catch(() => logLine('W', 'relink: could not save id keys'));
    if (r.picMoves.length) await movePics(r.picMoves);
    if (r.moved) { logLine('I', 'relink: ' + r.moved + ' saved song(s) matched to their new ids by path'); refreshHome(); }
  } catch (e) { logLine('W', 'relink failed:', e && e.message || e); }
}
/* BUG-123: a custom song picture moves with its song when the song's id changes (see relinkIds). The picture is copied to the new id,
   the old copy is deleted. If the new song already has its own picture, nothing is changed. */
async function movePics(moves) {
  const m = spMap(); let changed = false;
  for (const [from, to] of moves) {
    if (!m[from] || m[to]) continue;
    const blob = await spDb.get(from).catch(() => null);
    if (!blob) continue;
    try { await spDb.put(to, blob); } catch { logLine('W', 'relink: could not move a song picture'); continue; }
    spDb.del(from).catch(() => {});
    spSet(from, null); spSet(to, blob);
    delete m[from]; m[to] = 1; changed = true;
  }
  if (changed) spSave(m);
}
function countPlay(id) {   // once per song play (not per tick), so the write is cheap
  stats = bump(stats, id, Date.now());
  saveUser(STATS_FILE, stats).catch(() => logLine('W', 'stats: could not save'));
  refreshHome();   // v119: Recently Played, Most Played and the rest update right away
}
on('onTrackChanged', () => { if (Native.isNative) return; const c = Native.current(); if (c) counter.track(c.id); });
on('onProgress', ({ pos, dur }) => { if (Native.isNative) return; const c = Native.current(); if (!c) return; counter.track(c.id); if (counter.tick(pos, dur)) countPlay(c.id); });   // browser demo only: in the Android app the service counts plays (ListenTracker), so a play is never counted twice
function statsAction(act) {
  switch (act) {
    case 'stats-clear': $('#sheet').innerHTML = sheetHtml(`<b>Clear play history?</b><p>Recently Played and Most Played will be empty. Favorites and playlists stay.</p><div class="actions"><button data-act="sheet-close">Cancel</button><button data-act="stats-clear-ok">Clear</button></div>`); break;
    case 'stats-clear-ok': statsGen++; stats = {}; saveUser(STATS_FILE, stats).catch(() => toast('Could not save')); if (Native.isNative) Native.ackPlays({ all: true }).catch(() => {}); closeSheet(); toast('Play history cleared'); renderSub(); break;
    default: return false;
  }
  return true;
}

/* ---------- T7: track menu (⋯ on every song row + Now Playing) ---------- */
let menuTid = null;
const menuTrack = () => tracks.find(x => x.id === menuTid);
function trackMenuSheet(t) {
  menuTid = t.id; const a = trackAlbum(t);
  const item = (act, label) => `<button class="row" data-act="${act}"><span class="lbl" style="font-size:1.0625rem">${label}</span></button>`;
  $('#sheet').innerHTML = sheetHtml(`<b>${t.title}</b><p>${t.trackArtist || a.artist}, ${a.title}</p>
    ${item('tm-fav', isFav(favs, t.id) ? 'Remove from Favorites' : 'Add to Favorites')}${item('tm-next', 'Play Next')}${item('tm-queue', 'Add to Queue')}${item('tm-addpl', 'Add to Playlist')}
    ${item('tm-album', 'Go to Album')}${item('tm-artist', 'Go to Artist')}${item('sp-edit', 'Song picture or GIF…')}${item('tm-canvas', 'Canvas…')}${item('tm-info', 'Song Info')}`);
}
function addPlSheet() {
  const rows = playlists.map(p => `<button class="row" data-act="tm-pl" data-plid="${p.id}">${plArt(p, plTracks(p), 'thumb')}<span class="lbl" style="font-size:1.0625rem">${p.name}</span><span class="cnt">${p.ids.length}</span></button>`).join('');
  const mk = `<button class="row" data-act="tm-newpl"><span class="lbl" style="font-size:1.0625rem;color:var(--accent)">+ New Playlist</span></button>`;   // create a playlist right here; the song is added to it
  $('#sheet').innerHTML = sheetHtml(`<b>Add to Playlist</b><div style="height:12px"></div>${mk}${rows || '<p>No playlists yet. Tap New Playlist to make one with this song.</p>'}<div class="actions"><button data-act="sheet-close">Cancel</button></div>`);
}
function trackAction(act, d) {
  const t = menuTrack();
  switch (act) {
    case 'trackmenu': { const x = tracks.find(y => y.id === d.tm); if (x) trackMenuSheet(x); break; }
    case 'tm-fav': if (t) { closeSheet(); favToggle(t.id); } break;
    case 'fav': favToggle(d.tm); break;
    case 'tm-next': if (!t) break; closeSheet(); Native.addNext(t).then(() => toast('Plays next')).catch(() => toast('Could not add song')); break;
    case 'tm-queue': if (!t) break; closeSheet(); Native.addToQueue(t).then(() => toast('Added to queue')).catch(() => toast('Could not add song')); break;
    case 'tm-addpl': addPlSheet(); break;
    case 'sp-edit': if (t) spEdit(t.id); break;
    case 'tm-newpl': if (t) nameSheet('New Playlist', '', 'tm-newpl-ok'); break;
    case 'tm-newpl-ok': { if (!t) break; const n = E(($('#nm').value || '').trim()); if (!n) return warn('Type a name'); playlists.push({ id: newPid(), name: n, ids: [t.id] }); savePl(); toast('Playlist created, song added'); closeSheet(); break; }
    case 'tm-pl': { const p = playlists.find(x => x.id === d.plid); if (!p || !t) break; if (p.ids.includes(t.id)) toast('Already in that playlist'); else { p.ids.push(t.id); savePl(); toast('Added to playlist'); } closeSheet(); break; }
    case 'tm-album': if (!t) break; closeSheet(); closeNP(); push('album', t.albumId); break;
    case 'tm-artist': { if (!t) break; const as = trackArtists(t);   // v54: every artist on the song (feat. included); one = go there, several = pick
      if (as.length <= 1) { closeSheet(); closeNP(); push('artist', unesc(as[0] || trackAlbum(t).artist)); break; }
      $('#sheet').innerHTML = sheetHtml(`<b>Go to Artist</b><p>${t.title}</p>${as.map(n => `<button class="row grow" data-act="tm-artist-go" data-id="${n}">${artistCov(n, 'thumb')}<span class="lbl" style="font-size:1.0625rem">${n}</span><span class="chev">${I.chev}</span></button>`).join('')}<div class="actions"><button data-act="sheet-close">Cancel</button></div>`); break; }
    case 'tm-artist-go': closeSheet(); closeNP(); push('artist', d.id); break;
    case 'tm-canvas': if (t) canvasSheet(t); break;
    case 'tm-info': if (t) songInfoSheet(t); break;
    case 'info-extra': if (infoData) { infoExtra = !infoExtra; paintInfo(infoData); } break;
    default: return false;
  }
  return true;
}

/* ---------- T8 (part 1): Up Next queue sheet ---------- */
function queueSheet() {   // v210: Spotify style Up Next: a now-playing card, where it plays from, and a summary of what is coming up
  const st = Native.state, q = st.queue, n = q.length, cur = q[st.index];
  const upList = q.slice(st.index + 1), secs = upList.reduce((x, t) => x + (t.dur || 0), 0);
  const qTime = v => { v = Math.round(v); const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60); return h ? `${h} hr ${m} min` : `${Math.max(1, m)} min`; };
  const head = cur ? `<div class="qnowcard">${cover_thumb(cur)}<span class="meta blk"><small>Now playing</small><b>${cur.title}</b><span>${cur.trackArtist || trackAlbum(cur).artist}</span></span></div><p class="qfrom">Playing from ${trackAlbum(cur).title}</p>` : '';
  const sum = upList.length ? `<div class="qsec">Next up</div><p class="qsum">${upList.length} song${upList.length === 1 ? '' : 's'} · ${qTime(secs)}</p>` : '';
  const up = upList.map((t, k) => {
    const i = st.index + 1 + k, a = trackAlbum(t);
    return `<div class="songwrap" data-dkind="q" data-drow="${i}"><button class="row song" data-act="q-play" data-qi="${i}"><span class="thumb cover" style="--g:${gOfT(t)}"></span><span class="meta blk"><b>${t.title}</b><span>${t.trackArtist || a.artist}</span></span></button><button class="gbtn sm dh" data-drag="q" aria-label="Drag to reorder">${I.grip}</button><button class="gbtn sm sr" aria-label="Move up" data-act="q-up" data-qi="${i}" ${k ? '' : 'disabled'}>↑</button><button class="gbtn sm sr" aria-label="Move down" data-act="q-down" data-qi="${i}" ${i < n - 1 ? '' : 'disabled'}>↓</button><button class="gbtn sm" aria-label="Remove ${t.title} from queue" data-act="q-rm" data-qi="${i}">✕</button></div>`;
  }).join('');
  const body = up || '<div class="empty">Nothing queued after this song. Press ⋯ on a song and choose Add to Queue.</div>';
  const ql = $('#sheet .qlist');
  if (ql) {   // A8: the sheet is already open: swap only the rows and the header, keep the entrance animation and the scroll position
    const box = $('#sheet .sheetbox'), y1 = ql.scrollTop, y2 = box ? box.scrollTop : 0, h = $('#qhead');
    ql.innerHTML = body; if (h) h.innerHTML = head + sum;
    ql.scrollTop = y1; if (box) box.scrollTop = y2; return;
  }
  $('#sheet').innerHTML = sheetHtml(`<b>Up Next</b><div id="qhead">${head}${sum}</div>
    <div class="qlist">${body}</div>
    <div class="actions"><button data-act="q-save">Save as playlist</button><button data-act="q-clear">Clear</button><button data-act="sheet-close">Close</button></div>`);
}
const cover_thumb = t => `<span class="thumb cover" style="--g:${gOfT(t)}"></span>`;
on('onQueue', () => { if (!dragBusy && $('#sheet .qlist')) queueSheet(); });   // keep an open Up Next sheet in step (shuffle, autoplay fill, edits)
function queueAction(act, d) {
  const st = Native.state, i = +d.qi;
  switch (act) {
    case 'queue': queueSheet(); break;
    case 'q-play': Native.play(st.queue, i, true).catch(playFail); closeSheet(); break;
    case 'q-up': if (i > st.index + 1) Native.moveItem(i, i - 1).then(queueSheet).catch(() => { toast('Could not change the queue'); queueSheet(); }); break;
    case 'q-down': if (i < st.queue.length - 1) Native.moveItem(i, i + 1).then(queueSheet).catch(() => { toast('Could not change the queue'); queueSheet(); }); break;
    case 'q-rm': if (i > st.index) Native.removeItem(i).then(queueSheet).catch(() => { toast('Could not change the queue'); queueSheet(); }); break;   // BUG #13: a failed remove now tells the user and refreshes the list, like q-up/q-down
    case 'q-clear': Native.clearQueue().then(() => { toast('Queue cleared'); closeSheet(); }).catch(() => toast('Could not clear the queue')); break;
    case 'q-save': nameSheet('Save Queue as Playlist', 'Up Next', 'q-save-ok'); break;
    case 'q-save-ok': {
      const n = E(($('#nm').value || '').trim()); if (!n) return warn('Type a name');
      const ids = Native.state.index < 0 ? [] : Native.state.queue.slice(Native.state.index).map(t => t.id);
      if (!ids.length) return warn('The queue is empty');   // BUG-14
      playlists.push({ id: newPid(), name: n, ids }); savePl(); closeSheet(); toast('Saved as playlist'); break;
    }
    default: return false;
  }
  return true;
}

/* ---------- T9: Lyrics view (synced line, word highlight, tap a line to seek) ---------- */
let lyr = null, lyrSeq = 0, lyrIdx = -1, lyrTid = null, lyFree = false;   // lyFree = the user scrolled: the red line keeps moving but the list is NOT pulled back (tap a line or "Now" to follow again)
/* Lyric clock. The player reports its position only every ~100 ms, so a line could show up to that late.
   We keep the last report and add the time since then (animation frame), so the line changes on the exact time stamp. */
let lyClock = { pos: 0, at: 0, pl: false }, lyRaf = 0;
let lyLast = { v: 0, pl: false };
function lyNow() {
  const s = Native.state, now = performance.now();
  if (s.pos !== lyClock.pos || !!s.playing !== lyClock.pl) lyClock = { pos: s.pos, at: now, pl: !!s.playing };
  const v = s.playing ? lyClock.pos + Math.min(0.5, (now - lyClock.at) / 1000) : lyClock.pos;
  /* v223: while playing, the clock never steps BACK by a little. Each new player report restarts the extrapolation from the reported position, which is often a bit behind what we had already counted; the clock then jumped back a few tenths of a second, a word that had faded in faded out and in again (the "blink every few seconds" in word-by-word lyrics). A real seek (more than .8 s) and pause / play still go through at once. */
  const hold = lyLast.pl && v < lyLast.v && lyLast.v - v < 1.2;   // v224: 1.2 s (was .8): a stress run with +-.3 s report jitter plus a .6 s hiccup stepped back up to 1.03 s   // v280 (owner: "lyrics are blinking every few seconds"): the hold no longer needs s.playing: a phone reports "not playing" for a split second now and then (buffering, audio focus, a notification refresh) and the clock then fell back to the last report, so the playing line / filled words stepped back and forward = a blink. A real seek resets lyLast (onSeek below, and tapping a line)
  if (!hold) lyLast = { v, pl: !!s.playing || lyLast.pl };   // v280: once playing, it stays 'was playing' through a short 'not playing' report; only a real seek (onSeek, a tapped line) or a new song (lyricsLoad) clears it
  return hold ? lyLast.v : v;
}
function lyStart() {
  if (lyRaf) return;
  const loop = () => { lyRaf = 0; if (!$('#lyr')?.classList.contains('open')) return; syncLyrics(lyNow()); lyRaf = requestAnimationFrame(loop); };
  lyRaf = requestAnimationFrame(loop);
}
function closeLyrics() { lyStop(); $('#lyr')?.classList.remove('open'); }
const lyBrowsing = () => lyFree;
function lyFollow(on) { lyFree = !on && !!(lyr && lyr.synced);   /* B7: only synced lyrics have a line to follow */ $('#lyr')?.classList.toggle('free', lyFree); }
/* v119: Apple Music style glide. The list scrolls instantly (native scroll, so finger browsing still works) and every line is shifted back by the same distance with the
   CSS `translate` property, then released: the browser slides each line to its place on the GPU. */
const lyAnchor = () => (set.lyAnim ? set.lyAnim.anchor : 16) / 100;   // the playing line sits this far down the lyrics area (small = near the top, no empty space above the lyrics)
let lyMoved = [];
function lyStop() { for (const n of lyMoved) { n.style.setProperty('--tt', '0s'); n.style.removeProperty('--ty'); n.style.removeProperty('--td'); } if (lyMoved.length) { void document.body.offsetHeight; for (const n of lyMoved) n.style.removeProperty('--tt'); } lyMoved = []; }   // v236: only the SLIDE (translate) is made instant, through --tt. Before, `transition = 'none'` switched off EVERY transition of the line for that flush: the fade / size change of a new playing line was swallowed and all lines snapped at once (the "whole lyrics blink" at every line change)
function lyCenter(el, smooth, body = $('#lyrbody')) {   // scrolls ONLY the lyrics body (scrollIntoView also scrolled #app and pushed the whole screen up)
  if (!body || !el) return;
  const max = Math.max(0, body.scrollHeight - body.clientHeight), top = Math.max(0, Math.min(max, el.offsetTop - body.clientHeight * lyAnchor())), prev = body.scrollTop;
  if (Math.abs(top - prev) < 2) return;
  if (!smooth || document.documentElement.dataset.motion === 'reduce') { lyStop(); body.scrollTop = top; return; }
  const all = body.children, i = Math.max(0, +el.dataset.li || 0), lo = Math.max(0, i - 4), hi = Math.min(all.length - 1, i + 14), win = [];
  for (let k = lo; k <= hi; k++) if (all[k] && all[k].classList.contains('ln')) win.push([all[k], k]);
  const inflight = win.map(([n]) => parseFloat((getComputedStyle(n).translate || '').split(' ')[1]) || 0);   // a glide that is still running carries on from where it is
  body.scrollTop = top;
  const moved = body.scrollTop - prev; if (!moved) return;
  win.forEach(([n], j) => { n.style.setProperty('--tt', '0s'); n.style.setProperty('--ty', (moved + inflight[j]).toFixed(1) + 'px'); });   // v236: the start position is set with a 0 s slide (--tt) and NO other transition is touched, so the class change just made (new playing line: fade, size) still animates in the same style pass
  void body.offsetHeight;   // the start position must be drawn once before the glide is released
  win.forEach(([n]) => { n.style.removeProperty('--tt'); n.style.setProperty('--ty', '0px'); });
  lyMoved = win.map(([n]) => n);
}
/* v148+: VIVID cover colours (Apple Music look). The old code averaged the whole picture and darkened it until it went dull. Now: the strongest hue of the cover is found (grey / near-black / near-white pixels are ignored), kept at high saturation and only darkened as far as white lyrics still read.
   Red cover = bright red, blue = bright blue, and so on. A second and third colour (the cover's second hue, or a nearby hue) make the soft glow. A grey / black cover gets a deep graphite, not flat grey. */
const covTint = new Map();
const cvWeb = new Map();   // v275: BROWSER DEMO ONLY (Native.fileUrl is empty there): Canvas file path -> URL, filled by __lf.lyTest.canvas so the lyrics styles can be checked with a Canvas in a browser
const rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; } return [h, s, l]; };
const hsl2hex = (h, s, l) => { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
const relLum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
function vivid(h, s, l, maxLum) {   // keep hue + saturation; lower only the lightness until white text has enough contrast (yellow / green end up a deep gold / green, red stays bright red)
  for (let i = 0; i < 60; i++) { const x = hsl2hex(h, s, l), n = parseInt(x.slice(1), 16); if (relLum(n >> 16, (n >> 8) & 255, n & 255) <= maxLum) return x; l -= .012; }
  return hsl2hex(h, s, l);
}
// v208+: EXACT colours (no boost, no darkening): Auto = the cover's own average colour; a picked colour = exactly that hex.
const rgbHex = (r, g, b) => '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const mixHex = (x, y, t) => { const a = parseInt(x.slice(1), 16), b = parseInt(y.slice(1), 16); return rgbHex((a >> 16) + ((b >> 16) - (a >> 16)) * t, (a >> 8 & 255) + ((b >> 8 & 255) - (a >> 8 & 255)) * t, (a & 255) + ((b & 255) - (a & 255)) * t); };
const exactPal = (a, b) => ({ a, b: b || mixHex(a, '#ffffff', .08), c: mixHex(a, '#000000', .55) });
function palFrom(h, s, neutral, avgL, minS = .78, mult = 1.25) {
  if (neutral) { const tinted = s >= .05; if (!tinted) h = 225; const k = tinted ? Math.max(.1, Math.min(.16, s)) : .1; const l = Math.max(.16, Math.min(.34, avgL * .55 + .1)); return { a: hsl2hex(h, k, l + .1), b: hsl2hex(h, k + .06, l + .02), c: hsl2hex(h, k + .02, Math.max(.07, l - .1)) }; }   // graphite: a soft lighter top, a deep bottom
  s = Math.max(minS, Math.min(1, s * mult));
  const dir = h > 40 && h < 110 ? -1 : 1;   // yellow / lime: the second colour goes toward orange, not toward a muddy olive
  return { a: vivid(h, s, .5, .24), b: vivid(h + 26 * dir, Math.min(1, s), .5, .22), c: vivid(h - 22, Math.min(1, s), .34, .1) };
}
/* v208+: the colour field follows what the screen SHOWS. Order: the Canvas (when it is on and playable) > the song's own picture > the album's picture > the original cover.
   An animated source (a Canvas video, a Canvas or custom GIF / animated WebP) is read over several frames and averaged, never from one frame, so the colour behind the picture matches the moving picture. */
const covTintPend = new Map();   // a colour read still running (one per key; a second caller waits for the same one). The 3 places that drop a changed picture's colour only touch ready colours: a read that finishes after its source changed is not kept (see done in coverTint)
function tintSource(a, t) {
  const so = soHas(t), sp = !so && t && spUrls.get(t.id), ap = !so && !sp && alpUrls.get(a.id), ck = so ? t.id + '|o' : sp ? t.id + '|s' : a.id + '|' + (ap ? 'c' : '');   // ck = the person's lyrics-colour key: stays the same whether or not a Canvas is showing
  const still = so ? a.cover : (sp || ap || a.cover), custom = !!(sp || ap);   // v165: the song's own picture first   // v152: the colour comes from the picture you set, when there is one
  let cp = ''; try { cp = t && canvasOn ? cvPath(t) : ''; if (cp && cvBad.has(cp)) cp = ''; } catch {}
  const url = cp ? (Native.fileUrl(cp) || (!Native.isNative && cvWeb.get(cp)) || '') : '';   // v275: the browser demo has no files: a test Canvas is given as a URL (cvWeb, set by __lf.lyTest)
  if (url) return { ck, key: ck + '~cv:' + cp, src: url, vid: isVideo(cp), media: true, still, stillCustom: custom };
  return { ck, key: ck, src: still, custom };
}
const tintCv = { c: null };
function tintGrab(el) { const c = tintCv.c || (tintCv.c = document.createElement('canvas')); c.width = c.height = 32; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(el, 0, 0, 32, 32); return x.getImageData(0, 0, 32, 32).data; }
const tintHiCv = { a: null, b: null, f: null };   // v226: the 96 px grab re-uses three canvases (before: 1 to 4 NEW canvases per frame, up to 40 frames of a long GIF = many big temporary bitmaps on a phone); tintHiFree() lets them go when the colour is done
const tintHiMk = () => document.createElement('canvas');
function tintHiFree() { for (const k of ['a', 'b', 'f', 'e']) { const c = tintHiCv[k]; if (c) { c.width = c.height = 0; tintHiCv[k] = null; } } }
function tintGrabEye(el, MW = 384) {   // v273: a SHARP copy for the eye pass that keeps the picture's TRUE aspect (tintGrabHi squeezes to a square: a 498 x 278 GIF loses 2.6 x of its width, a small face's eye is 4-5 px). Width up to MW (never upscaled past the source), height in proportion. Returns { d, w, h } or null for a small source (under 260 px wide: the 192 px eye frame already has every pixel).
  const sw = el.videoWidth || el.naturalWidth || el.displayWidth || el.width || 0, sh = el.videoHeight || el.naturalHeight || el.displayHeight || el.height || 0; if (sw < 260 || sh < 60) return null;
  const w = Math.min(MW, sw), h = Math.max(1, Math.round(sh * w / sw)); let src = el, cw = sw, ch = sh, flip = false;
  while (cw > w * 2) { cw = Math.ceil(cw / 2); ch = Math.ceil(ch / 2); const k = flip ? 'b' : 'a', c = tintHiCv[k] || (tintHiCv[k] = tintHiMk()); c.width = cw; c.height = ch; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, cw, ch); src = c; flip = !flip; }
  const c = tintHiCv.e || (tintHiCv.e = tintHiMk()); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h);
  const d = new Uint8ClampedArray(x.getImageData(0, 0, w, h).data); if (src !== el) { src.width = src.height = 2; } return { d, w, h };
}
function tintGrabHi(el, S = DET_HI) {   // v225: a 96x96 copy for the detail pass. A big picture is halved step by step (smoothed) instead of squeezed to 32 px in one go, which skips most pixels and loses small details (a faint blush is 3 pixels wide in a 600 px GIF)
  let w = el.videoWidth || el.naturalWidth || el.displayWidth || el.width || S, h = el.videoHeight || el.naturalHeight || el.displayHeight || el.height || S, src = el, flip = false;
  while (w > S * 2 || h > S * 2) { w = Math.max(S, Math.ceil(w / 2)); h = Math.max(S, Math.ceil(h / 2)); const k = flip ? 'b' : 'a', c = tintHiCv[k] || (tintHiCv[k] = tintHiMk()); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, w, h); src = c; flip = !flip; }
  const c = tintHiCv.f || (tintHiCv.f = tintHiMk()); c.width = c.height = S; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data; if (src !== el) { src.width = src.height = 2; }   // the big halved copy is emptied at once; the pixels are already read
  return d;
}
function tintJoin(list) { const o = new Uint8ClampedArray(list.length * 4096); list.forEach((d, i) => o.set(d, i * 4096)); if (list.hi) o.hi = list.hi; return o; }   // o.hi = { frames: [96x96 RGBA], w: [how much each frame counts] } rides along for the detail pass (v225)
async function tintDecodeFrames(src, stale) {   // GIF / animated WebP / APNG (needs the WebView's ImageDecoder; null = not possible, the first frame is used). v230: NO LIMITS. Every frame of the file is read, whatever its size or length (before: nothing over 90 MB, at most 40 frames, a 3.5 s time budget, then only the 12 most different frames), and every frame counts as long as it is on screen. Frames are fed one at a time into the detail accumulator (nothing is kept per frame except 32x32 pixels = 4 KB), so a very long GIF costs no more memory than a picture. stale() = the song / picture changed while this was reading: stop.
  try {
    if (typeof ImageDecoder === 'undefined') return null;
    const buf = await (await fetch(src)).arrayBuffer(), u = new Uint8Array(buf);
    const type = u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 ? 'image/gif' : u[0] === 0x52 && u[1] === 0x49 && u[2] === 0x46 && u[3] === 0x46 && u[8] === 0x57 ? 'image/webp' : u[0] === 0x89 && u[1] === 0x50 ? 'image/png' : '';
    if (!type || !(await ImageDecoder.isTypeSupported(type))) return null;
    let dec = null; try {
    dec = new ImageDecoder({ data: buf, type }); await dec.tracks.ready;
    const n = dec.tracks.selectedTrack.frameCount; if (!(n > 1)) return null;
    const acc = detailAccumulator(DET_HI), lo = [], fw = [], hf = [], hw = [], ef = [], eh = [], HN = 24, keep = new Set(Array.from({ length: Math.min(n, HN) }, (_, k) => Math.round(k * (n - 1) / Math.max(1, Math.min(n, HN) - 1))));   // v208 palette-hues: hf/hw = up to 24 evenly spread 96x96 frames (36 KB each) kept ONLY for the hue pass (irises / brown hair); all frames still go to the detail accumulator
    for (let i = 0; i < n; i++) {
      if (stale && stale()) return null;
      const { image } = await dec.decode({ frameIndex: i, completeFramesOnly: true }); const w = image.duration > 0 ? image.duration / 1e5 : 1;   // a frame's weight = its time on screen (1 = 100 ms; no time given = 1)
      try { lo.push(tintGrab(image)); fw.push(w); acc.add(tintGrabHi(image), w); if (keep.has(i)) { hf.push(new Uint8ClampedArray(tintGrabHi(image))); hw.push(w); ef.push(new Uint8ClampedArray(tintGrabHi(image, 192))); if ((ef.length - 1) % 2 === 0) { try { const e = tintGrabEye(image); if (e) { e.fi = ef.length - 1; eh.push(e); } } catch {} } } /* v273: every 2nd kept frame (up to 12) also gets a sharp true-aspect eye copy (tintGrabEye, about 330 KB each for a 498 x 278 GIF) */ } finally { image.close(); }   // a frame is always closed, even if reading it fails (VideoFrames hold decoder memory)
      if ((i & 7) === 7) await new Promise(r => setTimeout(r, 0));   // let the app breathe: a 5000-frame GIF must not freeze the screen
    }
    if (!lo.length) return null;
    const out = tintJoin(lo); out.fw = fw; out.hi = { frames: [], w: [], detail: acc.done() }; out.hi.hueFrames = hf; out.hi.hueW = hw; out.hi.eyeFrames = ef; out.hi.eyeHi = eh; return out;
    } finally { try { dec && dec.close(); } catch {} }   // the decoder is always closed
  } catch { return null; }
}
async function tintImagePx(src, multi, stale) {
  if (!src) return null;
  if (multi) { const f = await tintDecodeFrames(src, stale); if (f && f.length) return f; }
  const load = u => new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try { const d = tintGrab(im); try { d.hi = { frames: [tintGrabHi(im)], w: [1] }; try { d.hi.eyeFrames = [tintGrabHi(im, 192)]; } catch {} try { const e = tintGrabEye(im); if (e) { e.fi = 0; d.hi.eyeHi = [e]; } } catch {} try { d.hi.detail = detailFromFrames(d.hi.frames, [1]); } catch {} } catch {} res(d); } catch { res(null); } }; im.onerror = () => res(null); im.src = u; });
  const d = await load(src); if (d) return d;
  // v242: the direct read failed (a picture the WebView treats as cross-origin would taint the canvas, so the colours could not be read and the lyrics got ONE flat colour instead of the 5-colour palette). Second try: fetch the bytes and read them from a local blob, which is never tainted. Same code path for a custom picture / GIF, an original cover and a Canvas still.
  if (/^blob:|^data:/i.test(String(src))) return null;
  let u = ''; try { const r = await fetch(src); if (!r.ok) return null; u = URL.createObjectURL(await r.blob()); return await load(u); } catch { return null; } finally { if (u) { try { URL.revokeObjectURL(u); } catch {} } }
}
function tintVideoPx(src, stale) {   // a Canvas video: a frame every quarter second over its WHOLE length (at least 7), a hidden copy, the one on screen is not touched. v230: no cap on the count (was 7 / 10 / 12 frames) and the time allowed grows with the number of frames (was a fixed 9 s)
  return new Promise(res => {
    const v = document.createElement('video'), out = [], acc = detailAccumulator(DET_HI), hf = [], hw = [], ef = [], eh = []; let fin = false, plan = [], k = 0, to = 0, keep = new Set([0]);   // v241: hf / hw / ef = up to 24 evenly spread real frames (96 px, and 192 px for the iris pass), the same kept frames a GIF gives, so a Canvas video gets the same palette steps (hair / skin split, eyes, thin tints) instead of only the 16x16 detail grid
    const end = () => { if (fin) return; fin = true; clearTimeout(to); try { v.pause(); v.removeAttribute('src'); v.load(); } catch {} if (out.length) { const j = tintJoin(out); j.hi = { frames: [], w: [], detail: acc.done() }; if (hf.length) { j.hi.hueFrames = hf; j.hi.hueW = hw; j.hi.eyeFrames = ef; j.hi.eyeHi = eh; } res(j); } else res(null); };
    const grab = () => { try { out.push(tintGrab(v)); try { acc.add(tintGrabHi(v), 1); } catch {} try { if (keep.has(Math.max(0, k - 1))) { hf.push(new Uint8ClampedArray(tintGrabHi(v))); hw.push(1); ef.push(new Uint8ClampedArray(tintGrabHi(v, 192))); if ((ef.length - 1) % 2 === 0) { try { const e = tintGrabEye(v); if (e) { e.fi = ef.length - 1; eh.push(e); } } catch {} } } } catch {} return true; } catch { out.length = 0; end(); return false; } };   // a frame that cannot be read: give up, the picture's own colour is used instead
    const step = () => { if (k >= plan.length || (stale && stale())) return end(); try { v.currentTime = plan[k++]; } catch { end(); } };
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    v.addEventListener('error', end);
    v.addEventListener('loadeddata', () => { if (fin || plan.length) return; const dur = v.duration; if (!isFinite(dur) || dur < .4) { if (grab()) end(); return; } const nF = Math.max(7, Math.ceil(dur * 4)); plan = Array.from({ length: nF }, (_, i) => (.02 + .96 * i / (nF - 1)) * dur); keep = new Set(Array.from({ length: Math.min(nF, 24) }, (_, q) => Math.round(q * (nF - 1) / Math.max(1, Math.min(nF, 24) - 1)))); clearTimeout(to); to = setTimeout(end, 9000 + nF * 600); step(); });   // v230: 4 frames per second of video
    v.addEventListener('seeked', () => { if (!fin && grab()) step(); });
    to = setTimeout(end, 9000);
    v.src = src;
  });
}
async function tintPixels(S) {
  try {
    if (S.media) { const d = S.vid ? await tintVideoPx(S.src, S.stale) : await tintImagePx(S.src, true, S.stale); if (d) return d; return await tintImagePx(S.still, S.stillCustom); }   // the Canvas cannot be read: fall back to the picture under it
    return await tintImagePx(S.src, S.custom);
  } finally { tintHiFree(); }   // v226: the temporary 96 px canvases are released when the colour is done (a long GIF / video would otherwise keep them until the next cover)
}
function tintFromPixels(d) {
  const BN = 24, bw = new Array(BN).fill(0), bs = new Array(BN).fill(0), bx = new Array(BN).fill(0), by = new Array(BN).fill(0); let tot = 0, aL = 0, cnt = 0, sr = 0, sg = 0, sb = 0, viv = 0; const ew = new Array(BN).fill(0), er = new Array(BN).fill(0), eg = new Array(BN).fill(0), eb = new Array(BN).fill(0), en = new Array(BN).fill(0);
  for (let i = 0; i < d.length; i += 4) { const [h, sa, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]); aL += l; cnt++; sr += d[i]; sg += d[i + 1]; sb += d[i + 2];
    if (sa >= .35 && l >= .08 && l <= .93) viv++;   // v209: pixels with a real colour, however small the area (a red patch on a mostly white / black cover still counts)
    if (sa < .17 || l < .08 || l > .93) continue;   // grey, near black and near white say nothing about the colour
    const w = sa ** 5 * (1 - Math.abs(l - .5)), k = Math.floor(h / 15) % BN;   // v209: saturation to the 5th power: a small vivid patch (blood, red hair) beats a large dull area (skin, shadow)
     const w4 = w * sa * sa; er[k] += d[i] * w4; eg[k] += d[i + 1] * w4; eb[k] += d[i + 2] * w4; ew[k] += w4; en[k]++; bw[k] += w; bs[k] += w * sa; bx[k] += w * Math.cos(h * Math.PI / 180); by[k] += w * Math.sin(h * Math.PI / 180); tot += w; }   // v209: the hue's colour is the average WEIGHTED by vividness (saturation, 7th power in all), so a vivid red is not dragged to brown by the dull skin / shadow pixels of the same hue
  const hueOf = k => (Math.atan2(by[k], bx[k]) * 180 / Math.PI + 360) % 360;
  const sm = k => bw[k] + .6 * (bw[(k + 1) % BN] + bw[(k + BN - 1) % BN]);   // a hue and its neighbours count together
  let k1 = 0; for (let k = 1; k < BN; k++) if (sm(k) > sm(k1)) k1 = k;
  if (!tot || sm(k1) < .35 * (d.length / 4096) || viv / cnt < .012) {   // v209: was tot / cnt < .03, which sent covers with a small but real colour (Echoes of Silence: red hair on white and black) to a grey average
    return exactPal(rgbHex(sr / cnt, sg / cnt, sb / cnt)); }   // a grey / black cover: keeps the cover's own hue (Kiss Land = deep green, not a cold blue-grey); a truly colourless cover still gets the neutral graphite
  const h1 = hueOf(k1), s1 = bs[k1] / (bw[k1] || 1);
  let k2 = -1; for (let k = 0; k < BN; k++) { const dist = Math.min((k - k1 + BN) % BN, (k1 - k + BN) % BN); if (dist >= 2 && bw[k] > .15 * bw[k1] && (k2 < 0 || bw[k] > bw[k2])) k2 = k; }
  const avgOf = (k, one) => { let r = 0, g = 0, b = 0, n = 0; for (const j of one ? [k] : [k, (k + 1) % BN, (k + BN - 1) % BN]) { r += er[j]; g += eg[j]; b += eb[j]; n += ew[j]; } if (!n) return null; const x = rgbHex(r / n, g / n, b / n), [hh, ss, ll] = rgb2hsl(...[1, 3, 5].map(o => parseInt(x.slice(o, o + 2), 16))); return ll < .24 && ss > .2 ? hsl2hex(hh, ss, .24) : x; };   // v209: weighted by vividness; a very dark colour is lifted a little so it does not turn into plain black
  const p = exactPal(avgOf(k1) || palFrom(h1, s1, false, 0).a);
  if (k2 >= 0) { const x2 = avgOf(k2, true);   // v209: the second colour is that hue only (its neighbours would pull it back toward the main colour)
    if (x2) { const [h2, s2, l2] = rgb2hsl(...[1, 3, 5].map(o => parseInt(x2.slice(o, o + 2), 16))); p.b = l2 < .34 && s2 > .3 ? hsl2hex(h2, s2, .34) : x2; } }   // v209: the second colour (the glow in the lyrics background) is lifted a little when it is dark but vivid (Blinding Lights: the red jacket) so it shows   // the cover's own second colour
  return p;
}
function coverTint(a, t) {
  const S = tintSource(a, t), ck = S.ck, key = S.key;
  if (covTint.has(key)) return Promise.resolve(covTint.get(key));
  if (covTintPend.has(key)) return covTintPend.get(key);
  const gs = String(a.g0 || a.g), vr = gs.match(/var\((--[\w-]+)\)/), hx = (gs.match(/#[0-9a-f]{6}/gi) || [vr && getComputedStyle(document.documentElement).getPropertyValue(vr[1]).trim().match(/^#[0-9a-f]{6}$/i)?.[0] || '#c8102e'])[0], n = parseInt(hx.slice(1), 16), fh = rgb2hsl(n >> 16, (n >> 8) & 255, n & 255), fb = palFrom(fh[0], fh[1], fh[1] < .12, fh[2]);
  const pr = new Promise(res => {
    const done = (c, pl) => { c.ck = ck; if (!c.pal) c.pal = pl || [];  let same = true; try { const N = tintSource(a, t); same = N.key === key && N.src === S.src; } catch {} if (same) covTint.set(key, c); covTintPend.delete(key); res(c); };   // the picture / Canvas changed while this was being read: it answers its caller but is not kept
    S.stale = () => { try { const N = tintSource(a, t); return N.key !== key || N.src !== S.src; } catch { return false; } };   // v230: a long GIF / video read stops when the song or picture has changed
    tintPixels(S).then(d => { let p = null, pl = null; if (d) { try { pl = tintPaletteAuto(d); } catch {} try { p = tintFromPixels(d); } catch {} } done(p || fb, pl); }, () => done(fb));
  });
  covTintPend.set(key, pr); return pr;
}
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
async function coverPal(t) { return coverTint(trackAlbum(t), t); }   // the cover's own colours (the per-song "Lyrics colour" picker was removed)
function setTintVars(el, p, k) { if (!el || !p) return; el.style.setProperty(k, p.a); el.style.setProperty(k + '2', p.b); el.style.setProperty(k + '3', p.c); }
function clearTintVars(el, k) { if (!el) return; for (const n of [k, k + '2', k + '3']) el.style.removeProperty(n); }
function lyStyleSheet() {
  $('#sheet').innerHTML = sheetHtml(`<b>Background style</b><p>Changes the lyrics page. (Now Playing takes the cover colour only with Immersive album cover.)</p>${Object.entries(LYSTYLE).map(([v, t]) => `<button class="row" data-act="lystyleset" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === lyStyleKey() ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<button class="row" data-act="lbpick"><span class="lbl" style="font-size:1.0625rem">${lbUrl ? 'Change' : 'Choose'} the custom lyrics picture or GIF…</span></button>${lbUrl ? '<button class="row" data-act="lbrm"><span class="lbl" style="font-size:1.0625rem">Remove the custom lyrics picture</span></button>' : ''}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
}
function timeStyleSheet() {
  $('#sheet').innerHTML = sheetHtml(`<b>Playing bar time</b><p>The two times under the bar on Now Playing.</p>${Object.entries(TIME_STYLES).map(([v, t]) => `<button class="row" data-act="timestyleset" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === cleanTimeStyle(set.timeStyle) ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
}
/* v95: Now Playing takes the cover colour too (Apple Music style): top = the cover's main colour, fading darker to the bottom */
let npTintSeq = 0, lyTintSeq = 0;   // only the newest colour read may paint (a Canvas switched on / off while an older read was running)
async function npApplyTint(t) {
  const el = $('#np'); if (!el) return; const my = ++npTintSeq;
  if (!set.npImmersive || !t) { clearTintVars(el, '--np-bg'); return; }   // Now Playing takes the cover colour ONLY in Immersive mode; otherwise it stays black with the red accent
  const c = await coverPal(t); const cur = Native.current(); if (my === npTintSeq && $('#np') && cur && cur.id === t.id) setTintVars($('#np'), c, '--np-bg');
}
/* Cover blur (Settings > Lyrics > Background style > Cover blur): the picture the screen shows (Canvas video > the song's / album's own picture or GIF > the cover) is put behind the lyrics and blurred by the browser, so every colour and detail of it stays (a still picture, a GIF and a Canvas video all move / change with it). */
function lyBlurSrc(t) { try { if (!t || !t.id) return null; const S = tintSource(trackAlbum(t), t); return S && S.src ? { src: S.src, vid: !!S.vid } : null; } catch { return null; } }
// owner: Cover blur must NOT play a GIF / animated WebP / Canvas video, and the frame it stops on must show the small details (blush, eye colour). So several frames are looked at, each is scored (pink blush pixels, not too bright) and the best one is kept.
window.lyScore = el => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(el, 0, 0, 64, 64); const p = x.getImageData(0, 0, 64, 64).data; let pink = 0, L = 0; for (let j = 0; j < p.length; j += 4) { const R = p[j], G = p[j + 1], B = p[j + 2]; L += .3 * R + .59 * G + .11 * B; if (R > 140 && G > 80 && R - G > 22 && R - G < 95 && Math.abs(G - B) < 40) pink++; } L /= 4096; return pink / 20 - Math.max(0, L - 120) / 12; };
const lyStill = (src, w, h) => { const k = Math.min(1, 320 / Math.max(w, h, 1)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .92); };
async function lySample(img) {   // no ImageDecoder (older phone browser / WebView): the picture is hidden, left to play for ~3 s, a frame is looked at every 250 ms, the best one is kept (works for GIF, WebP and APNG in any browser)
  img.style.opacity = '0'; let best = '', bs = -1e9;
  for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 250)); try { const s = window.lyScore(img); if (s > bs) { bs = s; best = lyStill(img, img.naturalWidth, img.naturalHeight); } } catch {} }
  return best;
}
async function lyPickStill(img) {
  const par = img.parentElement; let anim = par.classList.contains('lb-anim'), buf = null, gif = false;
  try { const r = await fetch(img.currentSrc || img.src); buf = await r.arrayBuffer(); const u = new Uint8Array(buf, 0, Math.min(buf.byteLength, 64)); gif = u[0] === 71 && u[1] === 73 && u[2] === 70; anim = gif || (u[8] === 87 && u[9] === 69 && u[10] === 66 && u[11] === 80 && String.fromCharCode(...u).includes('ANIM')); if (anim) par.classList.add('lb-anim'); } catch {}   // by content, not by name: a still JPEG / PNG / still WebP is left alone
  if (!anim) return '';
  if (buf && window.ImageDecoder) { try {
    const d = new ImageDecoder({ data: buf, type: gif ? 'image/gif' : 'image/webp' }); await d.tracks.ready; const n = d.tracks.selectedTrack.frameCount || 1, k = Math.min(24, n);
    let best = 0, bs = -1e9; for (const i of new Set(Array.from({ length: k }, (_, j) => Math.floor(j * n / k)))) { const f = (await d.decode({ frameIndex: i })).image; const s = window.lyScore(f); f.close(); if (s > bs) { bs = s; best = i; } }
    const fr = (await d.decode({ frameIndex: best })).image, u = lyStill(fr, fr.displayWidth, fr.displayHeight); fr.close(); d.close(); return u;
  } catch {} }
  return lySample(img);
}
window.lyFreeze = async img => {   // both layers (base + detail) get the SAME still, picked once
  if (img.dataset.fz) return; img.dataset.fz = '1'; const par = img.parentElement;
  try { par._st = par._st || lyPickStill(img); const u = await par._st; if (u) img.src = u; } catch {} img.style.opacity = '';
};
window.lyFreezeV = async v => {   // Canvas video: stops (no autoplay / loop), 8 moments are looked at, it rests on the best one; both layers rest on the same moment
  v.pause(); const par = v.parentElement; try {
    par._vt = par._vt || (async () => { const d = v.duration; if (!isFinite(d) || d <= 0) return 0; let best = 0, bs = -1e9;
      for (let i = 0; i < 8; i++) { const t = d * (i + .5) / 8; await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = t; setTimeout(r, 3000); }); await new Promise(r => requestAnimationFrame(r)); const s = window.lyScore(v); if (s > bs) { bs = s; best = t; } } return best; })();
    const t = await par._vt; v.currentTime = t; v.pause();
  } catch {}
};
/* v277: CUSTOM LYRICS BACKGROUND (Settings > Lyrics > Background style > Custom lyrics background): one picture / GIF / animated WebP of your own, the same behind the lyrics of EVERY song (whatever picture the song or album has). Stored as the original file in its own IndexedDB ('lf-lyrbg', key 'media'), like the Home background. A song with a Canvas shows its Canvas video / GIF instead (as it is, not blurred). */
let lbUrl = '';
const lbDb = () => new Promise((res, rej) => { try { const r = indexedDB.open('lf-lyrbg', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
const lbDbPut = blob => lbDb().then(db => new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); blob ? t.objectStore('kv').put(blob, 'media') : t.objectStore('kv').delete('media'); t.oncomplete = () => { db.close(); res(true); }; t.onerror = () => { db.close(); rej(t.error); }; }));
const lbDbGet = () => lbDb().then(db => new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get('media'); q.onsuccess = () => { db.close(); res(q.result || null); }; q.onerror = () => { db.close(); rej(q.error); }; }));
function lbSet(blob) { if (lbUrl && lbUrl.startsWith('blob:')) { try { URL.revokeObjectURL(lbUrl); } catch {} } lbUrl = blob ? URL.createObjectURL(blob) : ''; }
function lbPick() {   // any picture or GIF, stored exactly as it is
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
  i.onchange = async () => { const f = i.files && i.files[0]; if (!f) return; try { const b = await ownBlob(f); lbSet(b); set.lyricStyle = 'cover'; set.lyricBlur = false; set.lyricPal = false; set.lyricBg = 'custom'; applySettings(); lyApplyTint(Native.current() || {}); toast('Lyrics picture set'); await lbDbPut(b); } catch { toast('Could not save that picture'); } };
  i.click();
}
lbDbGet().then(b => { if (b && !lbUrl) { lbSet(b); if ($('#lyr')?.classList.contains('open')) lyApplyTint(Native.current() || {}); } }).catch(() => {});
function lyBgSrc(t) {   // what the Home / Custom style shows behind the lyrics: the song's Canvas when it has one showing, else the custom picture (Custom style), else nothing (Home: the CSS paints the Home background or black)
  if (set.lyricStyle !== 'cover' || set.lyricBlur === true || !set.lyricBg) return null;
  try { const S = t && t.id ? tintSource(trackAlbum(t), t) : null; if (S && S.media && S.src) return { src: S.src, vid: !!S.vid, cv: true }; } catch {}
  return set.lyricBg === 'custom' && lbUrl ? { src: lbUrl, vid: false, cv: false } : null;
}
function lyBgHtml(t) {
  const s = lyBgSrc(t); if (!s) return ''; const e = E(s.src);
  return `<div class="lyr-bgl${s.cv ? ' lb-cv' : ''}" data-src="${e}" aria-hidden="true">${s.vid ? `<video src="${e}" autoplay loop muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto"></video>` : `<img src="${e}" alt="" decoding="async">`}</div>`;
}
function lyBgSync(el, t) {   // adds, swaps or removes the Home / Custom picture layer so it always matches the style, the Canvas and the picture
  const cur = el.querySelector('.lyr-bgl'), s = lyBgSrc(t);
  if (!s) { if (cur) cur.remove(); return; } if (cur && cur.dataset.src === s.src) return;
  if (cur) cur.remove(); el.insertAdjacentHTML('afterbegin', lyBgHtml(t));
}
function lyBlurHtml(t) {
  if (set.lyricStyle !== 'cover' || set.lyricBlur !== true) return '';
  const s = lyBlurSrc(t); if (!s) return '<div class="lyr-blur" aria-hidden="true"></div>';
  const anim = s.vid || /\.(gif|webp|apng)(\?|#|$)/i.test(s.src), e = E(s.src);
  const vid = c => `<video${c} src="${e}" muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto" onloadeddata="lyFreezeV(this)"></video>`;   // no autoplay / loop: it stops, on its best moment
  const img = c => `<img${c} src="${e}" alt="" decoding="async"${anim || /^blob:/i.test(s.src) ? ' onload="lyFreeze(this)"' : ''}>`;   // a picture you set can arrive as blob: (no .gif ending), so it is checked by its first bytes in lyFreeze
  return `<div class="lyr-blur${anim ? ' lb-anim' : ''}" data-src="${e}" aria-hidden="true">${s.vid ? vid('') + vid(' class="lb-d"') : img('') + img(' class="lb-d"')}</div>`;   // v208+: a second, lighter-blurred copy (.lb-d) sits on top of the heavy one so the cover's shapes / small details show
}
function lyBlurSync(el, t) {   // adds, swaps or removes the blur layer so it always matches the style and the picture
  const cur = el.querySelector('.lyr-blur');
  if (set.lyricStyle !== 'cover' || set.lyricBlur !== true) { if (cur) cur.remove(); return; }
  const s = lyBlurSrc(t); if (cur && (cur.dataset.src || '') === (s ? s.src : '')) return;
  if (cur) cur.remove(); el.insertAdjacentHTML('afterbegin', lyBlurHtml(t));
}
async function lyApplyTint(t) {
  const el = $('#lyr'); if (!el) return; const my = ++lyTintSeq;
  lyBlurSync(el, t); lyBgSync(el, t);
  if (set.lyricStyle === 'cover' && set.lyricBlur !== true && set.lyricBg) { el.style.removeProperty('--lyr-pal'); return; }   // v277: Home / Custom style: no cover colours to read
  if (set.lyricStyle !== 'cover') { clearTintVars(el, '--lyr-bg'); el.style.removeProperty('--lyr-pal'); return; }
  const c = await coverTint(trackAlbum(t), t);
  if (my === lyTintSeq && $('#lyr') && Native.current()?.id === t.id) {
    setTintVars($('#lyr'), c, '--lyr-bg'); let q = '';
    if (set.lyricBlur !== true && set.lyricPal === true) { try { q = c.palGrad || (c.palGrad = tintPaletteGrad(c.pal && c.pal.length ? c.pal : tintPaletteFlat(c.a))); } catch {} }   // v236: --lyr-pal = the 5-colour palette gradient
    if (q) $('#lyr').style.setProperty('--lyr-pal', q); else $('#lyr').style.removeProperty('--lyr-pal');
  }
}
async function lyricsLoad() {
  const my = ++lyrSeq, t = Native.current(), el = $('#lyr'); if (!t || !el) return;
  lyr = null; lyrIdx = -1; lyrTid = t.id; lyLast = { v: 0, pl: false }; lyStop(); lyFollow(true); lyApplyTint(t);
    el.innerHTML = `${lyBlurHtml(t)}${lyBgHtml(t)}<div class="lyr-top"><button class="gbtn" data-act="lyr-close">${I.back}</button><div class="lyr-t"><b>${t.title}</b><span>${t.trackArtist || trackAlbum(t).artist}</span></div><span style="width:44px"></span></div><div class="lyr-body" id="lyrbody"><div class="empty">Loading lyrics…</div></div><button class="lyr-now" data-act="lyr-follow" aria-label="Follow the song">${I.lyrics}<span>Now</span></button>`;
  let text = '';
  let lyFail = false;
  try { text = (await Native.getLyrics(t)).text || ''; } catch (e) { lyFail = true; try { console.warn('lyrics read failed', e); } catch {} }   // BUG-15
  if (my !== lyrSeq) return;
  lyr = parseLrc(text);
  const body = $('#lyrbody'); if (!body) return;
  if (!lyr.lines.length) { body.innerHTML = lyFail ? '<div class="empty">Could not read the lyrics for this song.</div>' : '<div class="empty">No lyrics for this song.</div>'; return; }
  body.innerHTML = lyr.lines.map((l, i) => {
    const inner = l.words ? l.words.map(w => `<span class="w">${E(w.w)}</span>`).join('') : E(l.text);
    return l.t != null && lyr.synced ? `<p class="ln tap" role="button" tabindex="0" data-li="${i}" data-act="lyr-seek">${inner}</p>` : `<p class="ln" data-li="${i}">${inner}</p>`;
  }).join('');
  syncLyrics(lyNow()); lyStart();
}
let lyWords = null, lyWd = -1;
function syncLyrics(pos) {
  if (!lyr || !lyr.synced || !$('#lyrbody')) return;
  const i = currentIndex(lyr.lines, pos);
  if (i !== lyrIdx) {
    const body = $('#lyrbody'), ls = body.children;
    lyrIdx = i; lyWords = null; lyWd = -1;
    for (let k = 0; k < ls.length; k++) { const n = ls[k]; n.classList.toggle('cur', k === i); n.style.setProperty('--d', Math.min(5, Math.abs(k - i))); }   // --d = distance from the playing line (more distance = softer)
    const el = ls[i];
    if (el) { if (!lyBrowsing()) lyCenter(el, lyrIdx >= 1); }   // the user is scrolling to pick a line: only the highlight moves
  }
  const line = lyr.lines[lyrIdx];
  if (line && line.words) {
    if (!lyWords) lyWords = document.querySelectorAll(`#lyrbody [data-li="${lyrIdx}"] .w`);
    let c = 0; while (c < line.words.length && pos >= line.words[c].t) c++;
    if (c !== lyWd) { lyWd = c; lyWords.forEach((n, k) => n.classList.toggle('wd', k < c)); }
  }
}
// a finger / wheel on the list = the user is browsing: stop following until they ask for it (no timer, nothing pulls the list back)
for (const ev of ['touchmove', 'wheel']) document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('#lyrbody')) { if (!lyFree) lyFollow(false); } }, { passive: true });
function lyricsAction(act, d) {
  switch (act) {
    case 'lyrics': if (!Native.current()) { toast('Play a song first'); break; }
      if (!$('#lyr')) $('#app').insertAdjacentHTML('beforeend', '<div class="lyr" id="lyr" role="dialog" aria-modal="true" aria-label="Lyrics"></div>');
      $('#lyr').classList.add('open'); lyricsLoad(); break;
    case 'lyr-close': closeLyrics(); break;
    case 'lyr-follow': { lyFollow(true); const el = document.querySelector(`#lyrbody [data-li="${lyrIdx}"]`); if (el) lyCenter(el, true); break; }
    /* v224: tapping a line is a real seek: lyLast is reset so the hold does not keep the old, later time */ case 'lyr-seek': { const l = lyr && lyr.lines[+d.li]; if (l && l.t != null) { lyFollow(true); lyClock = { pos: l.t, at: performance.now(), pl: !!Native.state.playing }; lyLast = { v: l.t, pl: false }; Native.seek(l.t); const le = document.querySelector(`#lyrbody [data-li="${+d.li}"]`); if (le) lyCenter(le, true); } break; }
    default: return false;
  }
  return true;
}
on('onProgress', e => { if ($('#lyr')?.classList.contains('open') && !lyRaf) syncLyrics(e.pos); });
on('onSeek', ({ pos }) => { const p = +pos || 0; lyClock = { pos: p, at: performance.now(), pl: !!Native.state.playing }; lyLast = { v: p, pl: false }; });   // v280: a real seek (scrub bar, notification, headset) is never held back by the no-step-back clock
on('onTrackChanged', () => { if ($('#lyr')?.classList.contains('open') && Native.current()?.id !== lyrTid) lyricsLoad(); });

/* v210: cover shortcuts. Three gestures on Now Playing (tap, press and hold, double tap), each with its own action. Defaults: tap = full-screen cover, hold = lyrics, double tap = album. Settings > Shortcuts. */
const GEST_LBL = { cover: 'Full-screen cover', lyrics: 'Lyrics', album: 'Go to the album', artist: 'Go to the artist', queue: 'Up Next queue', none: 'Off' };
const GEST_NAME = { tap: 'Tap the cover', long: 'Press and hold the cover', double: 'Double tap the cover' };
const GEST_DEF = { tap: 'cover', long: 'lyrics', double: 'album' };
const gestAct = g => { const v = set.gest && set.gest[g]; if (v) return v; if (g === 'long' && set.coverLyrics === false) return 'none'; if (g === 'double' && set.coverDouble === false) return 'none'; return GEST_DEF[g]; };
/* ---------- v90: album cover viewer + cover gestures. Tap the cover = black screen with only the cover. On Now Playing, press and hold = lyrics (Settings > Cover shortcuts). ---------- */
let cvvAt = 0;
function coverHtml(a) { return `<span class="cover blk" style="--g:${a && a.g}"></span>`; }   // v158: the full-screen cover viewer always shows the REAL (original / embedded) cover, never a custom picture/GIF layered on top (gOf() would add that layer; a.g is the plain cover, same rule as the listening stats and yearly recap)
function coverHtmlC(a) { return `<span class="cover blk" style="--g:${a && a._t ? gOfT(a._t) : gOf(a)}"></span>`; }   // v208: the viewer with the person's OWN picture / GIF (song picture first, then the album picture; no custom picture = the original cover, because gOf / gOfT fall back to it)
const viewHtml = a => (a && a._c ? coverHtmlC(a) : coverHtml(a));   // a._c = show the custom picture: album pages always; Now Playing only when Settings > Tap cover shows original is OFF
function openCover(a) {
  if (!a) return; cvvAt = performance.now();
  let v = $('#cvv');
  if (!v) { $('#app').insertAdjacentHTML('beforeend', '<button class="cvv" id="cvv" aria-label="Close album cover"></button>'); v = $('#cvv'); }
  v.innerHTML = viewHtml(a); v.dataset.np = a._np ? '1' : ''; v.dataset.cu = a._c ? '1' : ''; v.focus({ preventScroll: true });
}
function closeCover() { const v = $('#cvv'); if (v) { v.remove(); const b = $('#np .art'); if (b && $('#np').classList.contains('open')) b.focus({ preventScroll: true }); } }
document.addEventListener('click', e => { const v = e.target.closest && e.target.closest('#cvv'); if (v && performance.now() - cvvAt > 300) closeCover(); });
on('onTrackChanged', () => { const v = $('#cvv'); if (v && v.dataset.np === '1' && Native.current()) { const t = Native.current(); v.innerHTML = viewHtml({ ...trackAlbum(t), _t: t, _c: v.dataset.cu === '1' }); } });
{
  const ART = '.np .art, .detail-art';
  let g = null; const stop = () => { if (g) clearTimeout(g.t); g = null; };
  const show = art => { if (art.closest('.np')) { const t = Native.current(); if (t) openCover({ ...trackAlbum(t), _np: true, _t: t, _c: set.npTapOrig === false }); } else { const top = stack[stack.length - 1], al = top && top.t === 'album' ? byAlbum(top.id) : null; if (al) openCover({ ...al, _c: true }); else if (top && top.t === 'playlist' && picsOf(playlists.find(x => x.id === top.id)).length) ppOpen(top.id, 0); } };   // v132: a playlist cover with pictures opens the viewer
  document.addEventListener('pointerdown', e => {
    const art = e.target.closest && e.target.closest(ART); if (!art || (e.button || 0) > 0 || $('#cvv') || e.isPrimary === false) return;
    stop();   // BUG-16: a new touch cancels the old long-press timer
    g = { x: e.clientX, y: e.clientY, long: false, moved: false, t: 0, pid: e.pointerId };   // BUG-096: remember the finger
    if (art.closest('.np') && gestAct('long') !== 'none') g.t = setTimeout(() => { if (!g) return; g.long = true; try { navigator.vibrate && navigator.vibrate(18); } catch {} runGest(gestAct('long'), art); }, 450);
  });
  /* v209: double tap on Now Playing opens the album of the song that is playing. The first tap waits 300 ms; a second tap in that time opens the album instead. Settings > Cover shortcuts > Double tap the cover. */
  let npTap = null;
  const albumNow = () => { const t = Native.current(); if (!t) return; closeNP(); push('album', t.albumId); };
  const runGest = (act, art) => {   // v210: what a cover gesture does
    if (act === 'cover') return show(art);
    if (act === 'lyrics') return lyricsAction('lyrics');
    if (act === 'album') return albumNow();
    if (act === 'artist') { const t = Native.current(); if (!t) return; closeNP(); push('artist', unesc(trackAlbum(t).artist)); return; }
    if (act === 'queue') return queueSheet();
  };
  const tapCover = art => {   // v210: a single tap waits 300 ms only when a double tap action is set, so a second tap can cancel it
    if (!art.closest('.np')) { show(art); return; }
    if (npTap) { clearTimeout(npTap.s); npTap = null; if (gestAct('double') !== 'none') { try { navigator.vibrate && navigator.vibrate(12); } catch {} runGest(gestAct('double'), art); } return; }
    if (gestAct('double') === 'none') { if (gestAct('tap') !== 'none') runGest(gestAct('tap'), art); return; }
    npTap = { s: setTimeout(() => { npTap = null; if (gestAct('tap') !== 'none') runGest(gestAct('tap'), art); }, 300) };
  };
  document.addEventListener('pointermove', e => { if (g && e.pointerId === g.pid && !g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 10) { g.moved = true; clearTimeout(g.t); } });
  document.addEventListener('pointerup', e => { if (!g || e.pointerId !== g.pid) return; const k = g; stop(); if (k.long || k.moved) return; const art = e.target.closest && e.target.closest(ART); if (art) tapCover(art); });
  document.addEventListener('pointercancel', stop);
  document.addEventListener('contextmenu', e => { if (e.target.closest && (e.target.closest(ART) || e.target.closest('.acard, .gtile, .grow[data-act="genre"], .lyr'))) e.preventDefault(); });   // v209: lyrics too (no Copy / Select all bubble)   // BUG-278: genre tiles and rows too
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.np .art')) { e.preventDefault(); show(e.target); } });
}

/* T8 (part 2): Autoplay fill. When fewer than 3 songs are left after the current one, add up to 5 songs
   from the same artist or genre that are not already in the queue. Uses the existing addToQueue (works on both platforms). */
let fillBusy = false;
function autoFill() {
  const st = Native.state, q = st.queue;
  if (!set.autoplay || fillBusy || st.index < 0 || q.length - st.index - 1 >= 3) return;
  const a = trackAlbum(q[st.index]), inQ = new Set(q.map(t => t.id));
  const known = x => x && x !== 'Unknown' && x !== 'Unknown Artist';   // Bug 7: "Unknown" is a placeholder, not a real genre / artist
  const pool = tracks.filter(t => !inQ.has(t.id) && ((known(a.artist) && trackAlbum(t).artist === a.artist) || (known(a.genre) && trackAlbum(t).genre === a.genre)));
  const picks = shuffled(pool).slice(0, 5);
  if (!picks.length) return;
  fillBusy = true;
  (async () => { for (const t of picks) await Native.addToQueue(t); })().catch(e => logLine('W', 'autoplay fill:', e && e.message || e)).finally(() => { fillBusy = false; });   // BUG #14: one at a time, so each call's rollback snapshot is the queue the previous call left (overlapping calls restored stale queues)
}
on('onTrackChanged', autoFill);

/* ---------- T10: Canvas (own looping visual per song or album; NOT the repeat button) ---------- */
let canvasMap = {}, canvasOn = false, cvTrack = null, canvasBroken = false;
try { canvasOn = localStorage.getItem('lf.canvasOn') === '1'; } catch {}
const loadCanvasList = (tries = 4) => Native.getCanvas().then(r => { canvasMap = (r && r.map) || {}; canvasBroken = false; if (Native.current()) renderNP(); }).catch(e => { canvasBroken = true; logLine('W', 'canvas list unreadable:', e && e.message || e); if (tries > 1) setTimeout(() => loadCanvasList(tries - 1), 1500 * (5 - tries)); });   // v152: tried again (1.5 s, 3 s, 4.5 s) instead of staying blank for the whole session
loadCanvasList();
const resumeCanvas = () => { try { document.querySelectorAll('video.cvmedia').forEach(v => { if (v.paused) v.play().catch(() => {}); }); document.querySelectorAll('img.cvmedia').forEach(i => { if (!i.complete || !i.naturalWidth) { const u = i.src; i.src = ''; i.src = u; } }); } catch {} };   // Android pauses / drops web video while the app is away; MP4 Canvas plays again, a GIF that lost its frames is reloaded
document.addEventListener('visibilitychange', () => { if (!document.hidden) { resumeCanvas(); rewarmAll(); setTimeout(repaintPics, 250); } });
window.addEventListener('pageshow', () => rewarmAll());
addEventListener('pageshow', () => { resumeCanvas(); repaintPics(); });   // never save over a list that could not be read
const cvKey = (t, scope) => scope === 't' ? 't:' + t.id : 'a:' + t.albumId;
const cvPath = t => canvasMap['t:' + t.id] || canvasMap['a:' + t.albumId] || '';
const isVideo = p => /\.(mp4|webm)$/i.test(p);
const cvBad = new Set();   // Bug 15: Canvas files that failed to play (this session). Only THAT file falls back to the cover; Canvas itself stays on for other songs
function artHtml(t, a) {
  const p = canvasOn ? cvPath(t) : '';
  if (!p || cvBad.has(p)) return covT(t);
  const url = Native.fileUrl(p);
  const media = isVideo(p) ? `<video class="cvmedia" src="${url}" autoplay loop muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto"></video>` : `<img class="cvmedia" src="${url}" alt="">`;
  return `<div class="cover cvc" style="--g:${gOfT(t)}">${media}</div>`;
}
/* v56: Canvas fills the whole square. Many clips carry black bars INSIDE the picture (a 16:9 or 4:3 video with the bars baked in), and
   object-fit:cover cannot remove those. So we look at real frames, find the picture area (union over the first few seconds, so a dark
   scene never crops real content for good), then size + centre the media ourselves in px: the picture area covers the square.
   Setting the size in px also works on WebViews that ignore object-fit. If the frame cannot be read, plain cover sizing is used. */
const cvSize = v => v.tagName === 'VIDEO' ? [v.videoWidth, v.videoHeight] : [v.naturalWidth, v.naturalHeight];
function cvScan(v) {
  const [w, h] = cvSize(v); if (!w || !h || v._tainted) return;
  const cw = 96, ch = Math.max(8, Math.round(96 * h / w)), c = cvScan.c || (cvScan.c = document.createElement('canvas')); c.width = cw; c.height = ch;
  let d; try { const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(v, 0, 0, cw, ch); d = x.getImageData(0, 0, cw, ch).data; } catch { v._tainted = true; return; }
  const rows = new Array(ch).fill(0), cols = new Array(cw).fill(0);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = (y * cw + x) * 4; if (.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2] > 28) { rows[y]++; cols[x]++; } }
  let t = 0, b = ch - 1, l = 0, r = cw - 1;   // a row / column belongs to the picture when at least 2 % of its pixels are not black
  while (t < b && rows[t] < cw * .02) t++; while (b > t && rows[b] < cw * .02) b--;
  while (l < r && cols[l] < ch * .02) l++; while (r > l && cols[r] < ch * .02) r--;
  if (b - t < 2 || r - l < 2) return;   // an all-black frame says nothing
  const p = { t: t / ch, b: (b + 1) / ch, l: l / cw, r: (r + 1) / cw }, o = v._pic;
  v._pic = o ? { t: Math.min(o.t, p.t), b: Math.max(o.b, p.b), l: Math.min(o.l, p.l), r: Math.max(o.r, p.r) } : p;
}
function cvFit(v) {
  const box = v.parentElement, [w, h] = cvSize(v); if (!box || !w || !h) return;
  const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
  let p = v._pic || { t: 0, b: 1, l: 0, r: 1 };
  const side = (a, far) => { const m = far ? 1 - a : a; return m < .015 ? (far ? 1 : 0) : (far ? a - .008 : a + .008); };   // under 1.5 % is no bar; a real bar is cut with a hair of margin
  p = { t: side(p.t, 0), b: side(p.b, 1), l: side(p.l, 0), r: side(p.r, 1) };
  if (p.b - p.t < .35 || p.r - p.l < .35) p = { t: 0, b: 1, l: 0, r: 1 };   // a result that small is a wrong guess: show the whole frame
  const cx = p.l * w, cy = p.t * h, pw = (p.r - p.l) * w, ph = (p.b - p.t) * h, k = Math.max(W / pw, H / ph), st = v.style;
  st.right = st.bottom = 'auto'; st.maxWidth = 'none'; st.objectFit = 'fill';
  st.width = (w * k).toFixed(2) + 'px'; st.height = (h * k).toFixed(2) + 'px';
  st.left = (W / 2 - (cx + pw / 2) * k).toFixed(2) + 'px'; st.top = (H / 2 - (cy + ph / 2) * k).toFixed(2) + 'px';
}
function cvWire(v) {   // sizing: once per element (scan + fit), and again whenever the square changes size or the element moves into a new render
  if (!v._fit) {
    v._fit = true; let n = 0, last = 0; const go = () => { cvScan(v); cvFit(v); };
    if (v.tagName === 'IMG') { if (v.complete && v.naturalWidth) go(); else v.addEventListener('load', go); }
    else {
      v.addEventListener('loadedmetadata', () => cvFit(v)); v.addEventListener('loadeddata', go);
      v.addEventListener('timeupdate', () => { const now = performance.now(); if (n < 14 && now - last > 400) { n++; last = now; go(); } });   // the first ~6 s: more frames = a surer picture area
      if (v.readyState >= 2) go();
    }
    if (window.ResizeObserver) v._ro = new ResizeObserver(() => cvFit(v));
  }
  if (v._ro) { v._ro.disconnect(); if (v.parentElement) v._ro.observe(v.parentElement); }
  cvFit(v);
}
function syncCanvas() {
  const np = $('#np'), v = np.querySelector('.cvmedia');
  np.classList.toggle('hascv', !!v);
  if (!v) return;
  cvWire(v);
  if (v.tagName === 'IMG') { if (!v.dataset.w) { v.dataset.w = '1'; v.addEventListener('error', () => cvFail(v)); } return; }
  if (!v.dataset.w) {   // wire a new <video> once
    v.dataset.w = '1'; v.muted = true; v.defaultMuted = true; v.loop = true;
    v.addEventListener('error', () => cvFail(v));
    // Loops ANY length (4 minutes, 10 seconds, 2 seconds): `loop` does the work, the rest are backups for WebViews that stall at the end
    const again = () => { try { v.currentTime = 0; } catch {} if (Native.state.playing) v.play().catch(() => {}); };
    v.addEventListener('ended', again);
    v.addEventListener('timeupdate', () => { if (v.duration > 0.5 && isFinite(v.duration) && v.currentTime >= v.duration - 0.08 && Native.state.playing) again(); });
    v.addEventListener('pause', () => setTimeout(() => { if (v.isConnected && !v.ended && Native.state.playing && v.paused && !document.hidden) v.play().catch(() => {}); }, 60));   // a pause that nobody asked for (WebView hiccup)
    v.addEventListener('stalled', () => { if (Native.state.playing) v.play().catch(() => {}); });
    v.addEventListener('loadeddata', () => { if (Native.state.playing) v.play().catch(() => {}); });
  }
  if (Native.state.playing) v.play().catch(() => {}); else v.pause();
}
function cvFail(v) {   // the file cannot be shown: this file falls back to the cover (once, no error loop); Canvas stays on for every other song
  const src = v.getAttribute('src'), p = Object.values(canvasMap).find(x => Native.fileUrl(x) === src); if (!p || cvBad.has(p)) return; cvBad.add(p);
  logLine('W', 'canvas file not playable:', src); toast('This Canvas file cannot be played. Showing the cover.');
  renderNP();
}
function canvasSheet(t) {
  cvTrack = t;
  const hasT = !!canvasMap['t:' + t.id], hasA = !!canvasMap['a:' + t.albumId];
  const row = (act, scope, label) => `<button class="row" data-act="${act}" data-scope="${scope}"><span class="lbl" style="font-size:1.0625rem">${label}</span></button>`;
  $('#sheet').innerHTML = sheetHtml(`<b>Canvas</b><p>A short looping video or GIF shown instead of the cover while Canvas is on. The album cover stays the default.</p>
    ${row('cv-pick', 't', hasT ? 'Change for this song' : 'Add for this song')}
    ${row('cv-pick', 'a', hasA ? 'Change for the whole album' : 'Add for the whole album')}
    ${hasT ? row('cv-rm', 't', 'Remove for this song') : ''}
    ${hasA ? row('cv-rm', 'a', 'Remove for the whole album') : ''}
    <div class="actions"><button data-act="sheet-close">Cancel</button></div>`);
}
function canvasAction(act, d) {
  const cur = Native.current();
  switch (act) {
    case 'canvas': {
      if (!cur) { toast('Play a song first'); break; }
      if (!cvPath(cur)) { canvasSheet(cur); break; }          // nothing set yet: offer to add one
      if (cvBad.has(cvPath(cur))) { toast('That Canvas file cannot be played. Pick another one.', 2600); canvasSheet(cur); break; }   // Bug 15: say so instead of showing broken media
      canvasOn = !canvasOn; try { localStorage.setItem('lf.canvasOn', canvasOn ? '1' : '0'); } catch {}
      renderNP(); break;
    }
    case 'cv-pick': {
      const t = cvTrack, scope = d.scope; if (!t) break;
      if (canvasBroken) { toast('Canvas list could not be read. Restart the app.'); break; }
      Native.pickMedia().then(r => { const k = cvKey(t, scope), had = Object.prototype.hasOwnProperty.call(canvasMap, k), old = canvasMap[k]; canvasMap[k] = r.path; cvBad.delete(r.path); return Native.saveCanvas(canvasMap).catch(e => { if (had) canvasMap[k] = old; else delete canvasMap[k]; throw e; }); }).then(() => {
        canvasOn = true; try { localStorage.setItem('lf.canvasOn', '1'); } catch {}
        closeSheet(); toast('Canvas set'); renderNP();
      }).catch(e => { const m = (e && e.message) || e; if (m !== 'cancelled') toast('Could not add that file'); });
      break;
    }
    case 'cv-rm': {
      const t = cvTrack; if (!t) break;
      if (canvasBroken) { toast('Canvas list could not be read. Restart the app.'); break; }
      const k = cvKey(t, d.scope), old = canvasMap[k], had = Object.prototype.hasOwnProperty.call(canvasMap, k); delete canvasMap[k];
      Native.saveCanvas(canvasMap).then(() => { closeSheet(); toast('Canvas removed'); renderNP(); }).catch(() => { if (had) canvasMap[k] = old; toast('Could not remove'); });
      break;
    }
    default: return false;
  }
  return true;
}

/* ---------- T22: sleep timer. Runs in the Android service (works with the screen off); this is only the sheet + the countdown pill (logic in sleep.js). ---------- */
function sleepPillHtml() {
  const st = Native.sleepState(); if (!st.active) return '';
  return `<button class="chip sleeppill" data-act="sleep" aria-label="Sleep timer"><span class="sl-ic">${I.sleep}</span><span id="sleeptxt">${pillText(st, Date.now(), true)}</span></button>`;
}
// v149: the countdown shows milliseconds, so it is redrawn every animation frame (not once a second). The loop is a cheap no-op unless a timer is running and the page is visible.
function sleepTick() {
  if (!document.hidden) {
    const st = Native.sleepState();
    if (st.active && !st.endOfSong) {
      const now = Date.now(), el = $('#sleeptxt'), t = el && pillText(st, now, true); if (el && el.textContent !== t) el.textContent = t;
      const sh = $('#sleepsheettxt'); if (sh) { const x = 'Running: ' + pillText(st, now, true); if (sh.textContent !== x) sh.textContent = x; }   // the sheet counts down too
    }
  }
  requestAnimationFrame(sleepTick);
}
requestAnimationFrame(sleepTick);   // only touches the text, no re-render
on('onSleepTimer', e => { try { if (e.active && !e.endOfSong && e.endsInMs > 0) localStorage.setItem('lf.sleepEnd', String(Date.now() + e.endsInMs)); else localStorage.removeItem('lf.sleepEnd'); } catch {}   // BUG-9: remembered, so a restart can resume it
   if (e.fired) toast('Sleep timer: music stopped', 3500); renderNP(); const sh = $('#sheet'); if (sh && sh.querySelector('[data-act="sl-min"]')) sleepSheet(); });
function sleepSheet() {
  const st = Native.sleepState();
  const item = (act, label, extra = '') => `<button class="row" data-act="${act}" ${extra}><span class="lbl" style="font-size:1.0625rem">${label}</span></button>`;
  $('#sheet').innerHTML = sheetHtml(`<b>Sleep timer</b><p id="sleepsheettxt">${st.active ? 'Running: ' + pillText(st, Date.now(), true) : 'Fades the music out and stops it.'}</p>
    <div class="slgrid">${SLEEP_MINUTES.map(m => item('sl-min', m + ' minutes', `data-min="${m}"`)).join('')}${item('sl-song', 'End of this song')}</div>
    <div class="row" style="gap:10px;align-items:center"><span class="lbl" style="font-size:1.0625rem;flex:1">Custom</span><input type="text" id="slcustom" inputmode="text" autocomplete="off" placeholder="90 or 1:30" value="${cleanMinutes(set.sleepCustom) || ''}" aria-label="Custom sleep time: minutes, or hours and minutes" style="width:96px;background:transparent;border:0;border-bottom:1px solid var(--text-2);color:inherit;text-align:right;font:inherit;font-size:1.0625rem"><button class="chip" data-act="sl-custom">Start</button></div>
    <p id="slcustomhint" style="font-size:0.8125rem;color:var(--text-2);margin:0 0 6px">Type minutes (90) or hours:minutes (1:30). Up to 24 hours.</p>
    ${st.active ? item('sl-off', 'Turn off timer') : ''}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
}
function sleepAction(act, d) {
  switch (act) {
    case 'sleep': if (!Native.current()) { toast('Play a song first'); return true; } sleepSheet(); return true;
    case 'sl-min': { const m = cleanMinutes(+d.min); if (!m) return true; closeSheet(); Native.setSleepTimer({ minutes: m }).then(() => toast(setText(m, false))).catch(() => toast('Could not start the timer')); return true; }
    case 'sl-custom': { const m = parseSleepInput(($('#slcustom') || {}).value); if (!m) { const h = $('#slcustomhint'); if (h) { h.textContent = 'Type minutes (90) or hours:minutes (1:30), up to ' + SLEEP_MAX / 60 + ' hours.'; h.style.color = 'var(--accent)'; } return true; } set.sleepCustom = m; applySettings(); closeSheet(); Native.setSleepTimer({ minutes: m }).then(() => toast(setText(m, false))).catch(() => toast('Could not start the timer')); return true; }   // v148: custom timing
    case 'fav-sort': favSort = favSort === 'new' ? 'title' : favSort === 'title' ? 'artist' : 'new'; renderSub(true); return true;
    case 'fav-clear': if (favs.length) { favs = []; saveUser(FAV_FILE, favs).catch(() => toast('Could not save favorites')); renderNP(); refreshHome(); renderSub(true); toast('Favorites cleared'); } return true;
    case 'sl-song': closeSheet(); Native.setSleepTimer({ endOfSong: true }).then(() => toast(setText(0, true))).catch(() => toast('Could not start the timer')); return true;
    case 'sl-off': closeSheet(); Native.cancelSleepTimer().then(() => toast('Sleep timer off')).catch(() => toast('Could not turn the timer off')); return true;
  }
  return false;
}

/* ---------- T11: Song Info. Basic view by default; the Extra details toggle shows every tile. ---------- */
const infoCache = new Map(); let infoT = null, infoData = null, infoExtra = false;
async function songInfoSheet(t) {
  infoT = t; infoData = null; infoExtra = false;
  $('#sheet').innerHTML = sheetHtml(`<div class="infobox" id="infobox"><div class="empty">Reading file…</div></div>`);
  try {
    if (!infoCache.has(t.id)) infoCache.set(t.id, Native.getSongInfo(t).then(raw => buildSongInfo(raw, t)));
    const info = await infoCache.get(t.id);
    if (infoT !== t || !$('#infobox')) return;
    infoData = info; paintInfo(info);
  } catch (e) {
    infoCache.delete(t.id);
    if ($('#infobox')) $('#infobox').innerHTML = `<div class="empty">Could not read this file${e && e.message ? ': ' + E(e.message) : ''}.</div>`;
  }
}
const tileHtml = x => `<div class="itile${x.missing ? ' miss' : ''}"><span class="il">${E(x.label)}</span><span class="iv">${x.missing && x.value === '' ? 'missing' : E(x.value)}</span></div>`;
function paintInfo(info) {
  const b = info.basic, box = $('#infobox'); if (!box) return;
  const basic = [['Album', b.album], ['Artist', b.artist], ['Album artist', b.albumArtist], ['Year', b.year], ['Genre', b.genre], ['Track', b.track], ['Disc', b.disc], ['Length', b.length], ['Quality', b.quality]];
  box.innerHTML = `<b>${E(b.title)}</b>
    <div class="ibasic">${basic.filter(([, v]) => v).map(([l, v]) => `<div class="itile"><span class="il">${l}</span><span class="iv">${E(v)}</span></div>`).join('')}</div>
    <button class="ixtra ${infoExtra ? 'on' : ''}" data-act="info-extra">${infoExtra ? 'Hide extra details' : 'Extra details'}${info.problems && infoExtra ? ` · ${info.problems} to check` : ''}</button>
    ${infoExtra ? info.sections.map(s => `<div class="isec">${s.title}</div>${s.tiles.map(tileHtml).join('')}`).join('') : ''}`;
}

/* ---------- T12 part 2: drag handles (Up Next + playlist edit). Rows carry data-dkind + data-drow (their index); the arrows stay as hidden buttons for TalkBack. Helpers: reorder.js ---------- */
document.addEventListener('pointerdown', e => {
  const h = e.target.closest('[data-drag]'); if (!h || dragBusy) return;
  const row = h.closest('[data-drow]'); if (!row) return;
  e.preventDefault(); dragBusy = true; const dragPid = e.pointerId;   // BUG-096: only the finger that started the drag moves / drops it
  const kind = row.dataset.dkind, from = +row.dataset.drow, sc = kind === 'q' ? row.closest('.qlist') : scroller();
  const rx = row.getBoundingClientRect().left + 24, y0 = e.clientY, s0 = sc ? sc.scrollTop : 0;
  let y = y0, to = from, raf = 0;
  const mark = () => { document.querySelectorAll('.dropat').forEach(x => x.classList.remove('dropat', 'above', 'below')); const t = to !== from && document.querySelector(`[data-dkind="${kind}"][data-drow="${to}"]`); if (t) t.classList.add('dropat', to < from ? 'above' : 'below'); };
  const update = () => {
    row.style.transform = `translateY(${y - y0 + (sc ? sc.scrollTop - s0 : 0)}px)`;
    const hit = document.elementsFromPoint(rx, y).map(n => n.closest && n.closest(`[data-dkind="${kind}"]`)).find(n => n && n !== row);   // the dragged row has pointer-events:none
    if (hit) to = +hit.dataset.drow; mark();
  };
  const tick = () => { if (sc) { const r = sc.getBoundingClientRect(), v = edgeSpeed(y, Math.max(0, r.top), Math.min(innerHeight, r.bottom)); if (v) { sc.scrollTop += v; update(); } } raf = requestAnimationFrame(tick); };
  row.classList.add('dragging'); if (kind === 'pl') $('#app').classList.add('dragmode'); raf = requestAnimationFrame(tick);   // A5: bars fade out so the row is never under them
  const mv = ev => { if (ev.pointerId !== dragPid) return; y = ev.clientY; update(); };
  const up = ev => {
    if (ev.pointerId !== dragPid) return;   // BUG-096: a second finger lifting does not drop the row
    removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); cancelAnimationFrame(raf);
    const ok = ev.type === 'pointerup' && to !== from;
    row.classList.remove('dragging'); $('#app').classList.remove('dragmode'); row.style.transform = ''; mark(); dragBusy = false;
    if (kind === 'q') { if (ok) Native.moveItem(from, to).then(queueSheet).catch(queueSheet); else queueSheet(); }
    else if (ok) { const p = curPl(); if (p) { const ts = plTracks(p), pos = plPositions(p), a = ts[from], b = ts[to]; if (a && b) { p.ids = moveIn(p.ids, pos[from], pos[to]); savePl(); renderSub(true); } } }
  };
  addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
});

/* ---------- events ---------- */
/* ---------- Listening Statistics (history database in the playback service; UI in lstats.js) ---------- */
lsx = initLStats({ Native, escH, pl, I, unesc, snapshotArtists, learnArtists, tracks: () => tracks, trackAlbum, trackArtists, byAlbum, artistCov, header, push: (t, id) => push(t, id), rerender: () => { const top = stack[stack.length - 1]; if (top && ['lstats', 'lall', 'ldetail'].includes(top.t)) renderSub(true); }, refreshHome: () => refreshHome(true), toast, tokenColour, sheet: h => { $('#sheet').innerHTML = sheetHtml(h); }, closeSheet, stack: () => stack, tab: () => tab });
Object.assign(sub, lsx.screens);
for (const ev of ['onTrackChanged', 'onState']) on(ev, () => lsx.dirty());
const lib = { 'mix:daily': () => push('mixAll', 'daily'), 'mix:favmix': () => push('mixAll', 'favmix'), 'mix:newmix': () => push('mixAll', 'newmix'), 'mix:because': () => push('mixAll', 'because'), 'mix:forgot': () => push('mixAll', 'forgot'), 'alb:heavy': () => push('albHome', 'heavy'), 'alb:discover': () => push('albHome', 'discover'), 'alb:added': () => push('albHome', 'added'), playlists: () => push('playlists'), favorites: () => push('favorites'), recentPlayed: () => push('recentPlayed'), topPlayed: () => push('topPlayed'), artists: () => push('artists'), albums: () => push('albumsAll'), songs: () => push('songs'), genres: () => push('genres'), folders: () => push('folder', '') };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.closest('.tabbar')) return;
  const d = b.dataset;
  if (plAction(d.act, d, b)) return;
  if (trackAction(d.act, d)) return;
  if (statsAction(d.act)) return;
  if (lsx.action(d.act, d)) return;
  if (sleepAction(d.act, d)) return;
  if (sortAction(d.act, d)) return;
  if (b.closest('#results') && query.trim() && !d.act.startsWith('recent-')) { set.recent = addRecent(set.recent, query); applySettings(); }   // T25: a tapped result saves the search
  if (queueAction(d.act, d)) return;
  if (lyricsAction(d.act, d)) return;
  if (canvasAction(d.act, d)) return;
  switch (d.act) {
    case 'recent-q': { query = d.q; const qi = $('#q'); if (qi) qi.value = query; results(); break; }
    case 'recent-clear': set.recent = []; applySettings(); results(); break;
    case 'album': push('album', d.id); break;
    case 'playlist': plEdit = false; push('playlist', d.id); ppEnsure(playlists.find(x => x.id === d.id), true); break;
    case 'artist': push('artist', d.id); break;
    case 'genre': push('genre', d.id); break;
    case 'folder': push('folder', d.id); break;
    case 'lib': (lib[d.k] || (() => toast('Not available yet')))(); break;
    case 'back': plEdit = false; nameEdit = false; goBack(); break;
    case 'settings': push('settings'); break;
    case 'play': { const l = listOf(d.list); let pi = +d.i; if (d.tid && l[pi] && l[pi].id !== d.tid) { const j = l.findIndex(x => x.id === d.tid); if (j >= 0) pi = j; }   /* BUG-10: library swapped since the row was drawn */ Native.play(l, pi).catch(playFail); break; }
    case 'playall': Native.play(listOf(d.list), 0).catch(playFail); break;
    case 'shuffleall': Native.playShuffled(listOf(d.list)).catch(playFail); break;
    case 'open-np': if (Native.current()) renderNP(); $('#np').classList.add('open'); break;   // v163: the player shows the current custom picture / canvas when it opens
    case 'close-np': $('#np').classList.remove('open'); break;
    case 'pp': e.stopPropagation(); Promise.resolve(Native.state.playing ? Native.pause() : Native.resume()).catch(playFail); break;
    case 'next': e.stopPropagation(); Promise.resolve(Native.next()).catch(playFail); break;
    case 'prev': Promise.resolve(Native.prev()).catch(playFail); break;
    case 'shuf': Native.setShuffle(!Native.state.shuffle).catch(playFail); break;
    case 'rep': Native.setRepeat({ off: 'all', all: 'one', one: 'off' }[Native.state.repeat] || 'all').catch(playFail); break;
    case 'anim-preset': { set.anim = { ...(PRESETS[d.p] || PRESETS.default) }; applySettings(); for (const i of document.querySelectorAll('input[data-ak]')) { i.value = set.anim[i.dataset.ak]; const em = document.querySelector(`[data-av="${i.dataset.ak}"]`); if (em) em.textContent = Math.round(set.anim[i.dataset.ak]) + '%'; } break; }
    case 'tabtg': { const r = toggleTab(set.tabs, d.k); if (!r.ok) { toast('Keep at least one of Home, Albums, Library or Search'); break; } set.tabs = r.tabs; applySettings(); applyTabs(); b.classList.toggle('on', !!set.tabs[d.k]); b.setAttribute('aria-checked', set.tabs[d.k] ? 'true' : 'false'); break; }   // v224: Settings > Tab bar
    case 'tg': { const dflt = d.k === 'albumInfo' || d.k === 'smartArtists' || d.k === 'npTapOrig' || d.k === 'coverDouble'; set[d.k] = dflt ? set[d.k] === false : !set[d.k]; applySettings(); if (d.k === 'npImmersive') npApplyTint(Native.current()); b.classList.toggle('on', dflt ? set[d.k] !== false : !!set[d.k]); if (d.k === 'smartArtists') { stack = stack.filter(s => s.t !== 'artist' || artistInfo(s.id).count > 0); stack.forEach(s => { if (s.t === 'artist') s.id = unesc(artistName(E(s.id)) || E(s.id)); }); repaintAll(); toast(set.smartArtists !== false ? 'Smart artist grouping on' : 'Smart artist grouping off'); } break; }
    case 'abloop': abAction(); break;
    case 'apic-edit': apicEdit(d.id); break;
    case 'gp-edit': gpEdit(d.id); break;
    case 'gp-pick': gpPick(); break;
    case 'gp-reset': gpReset(); break;
    case 'alp-edit': alpEdit(d.id); break;
    case 'alp-pick': alpPick(); break;
    case 'sp-pick': spPick(); break;
    case 'sp-reset': spReset(); break;
    case 'sp-orig': spOrig(); break;
    case 'alp-reset': alpReset(); break;
    case 'apic-pick': apicPick(); break;
    case 'apic-albums': apicAlbN = 60; apicAlbums(); break;
    case 'apic-back': apicSheet(); break;
    case 'apic-albums-more': { const g = document.querySelector('#sheet .grid'), y = g ? g.scrollTop : 0; apicAlbN += 60; apicAlbums(); const g2 = document.querySelector('#sheet .grid'); if (g2) g2.scrollTop = y; } break;   // BUG-19: 60 album cards at a time
    case 'apic-album': { apicDropGif(apicFor); const m = apicMap(); m[apicFor] = 'album:' + d.id; apicSave(m); apicDone('Artist photo set'); } break;
    case 'apic-reset': { apicGone(picDrop(apicNames(apicFor), null)); apicDone('Back to default artist picture'); } break;
    case 'pfpick': pfPick(); break;
    case 'pfrm': try { localStorage.removeItem('lf.profile'); } catch {} pfSetMedia(null); pfDbPut(null).catch(() => {}); setFlag('lf.haspf', false); pfQuick = false; toast('Profile picture removed'); repaintAll(); break;
    case 'animopen': push('animation'); break;
    case 'lyranimopen': push('lyranim'); break;
    case 'lya-preset': { set.lyAnim = { ...(LYA_PRESETS[d.p] || LYA_PRESETS.default) }; applySettings(); for (const i of document.querySelectorAll('input[data-lyk]')) { i.value = set.lyAnim[i.dataset.lyk]; const em = document.querySelector(`[data-lyv="${i.dataset.lyk}"]`); if (em) em.textContent = Math.round(set.lyAnim[i.dataset.lyk]) + '%'; } break; }
    case 'homeopen': push('homeset'); break;
    case 'bgopen': push('bgset'); break;
    case 'gest-pick': { const g = d.g; $('#sheet').innerHTML = sheetHtml(`<b>${GEST_NAME[g]}</b><p>Choose what this does on Now Playing.</p>${Object.entries(GEST_LBL).map(([v, t]) => `<button class="row" data-act="gest-set" data-g="${g}" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}${gestAct(g) === v ? '  ✓' : ''}</span></button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`); break; }
    case 'gest-set': { set.gest = { ...(set.gest || {}), [d.g]: d.v }; applySettings(); closeSheet(); renderSub(true); break; }
    case 'gest-reset': { set.gest = { tap: 'cover', long: 'lyrics', double: 'album' }; applySettings(); renderSub(true); toast('Shortcuts reset'); break; }
    case 'bgpick': bgPick(); break;
    case 'bgrm': bgDb.del().catch(() => {}); setFlag('lf.hasbg', false); bgQuick = false; bgSetMedia(null); toast('Background removed'); renderSub(true); break;
    case 'bgfit': set.bgFit = cleanFit(d.v); applySettings(); renderSub(true); break;
    case 'hs-tg': set.home = toggleSectionFor(set.home, d.k, homeEditP || periodOf(new Date().getHours())); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-up': case 'hs-dn': set.home = moveSection(set.home, d.k, d.act === 'hs-up' ? -1 : 1); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-opt': set.home = { ...set.home, [d.k]: !set.home[d.k] }; applySettings(); b.classList.toggle('on', !!set.home[d.k]); renderMain(); break;
    case 'hs-tod': set.home = setTod(set.home, !set.home.tod); homeEditP = null; applySettings(); renderSub(true); renderMain(); break;
    case 'hs-per': homeEditP = d.v; renderSub(true); break;
    case 'hs-ren': homeRen = { kind: d.kind, k: d.k }; renderSub(true); setTimeout(() => { const i = $('#hsren'); if (i) { i.focus(); i.select(); } }, 60); break;
    case 'hs-rensave': homeRenSave(); break;
    case 'hs-renrm': homeRenSave(''); break;
    case 'hs-rencancel': homeRen = null; renderSub(true); break;
    case 'hs-pintype': homePinType = d.v; renderSub(true); break;
    case 'hs-pinadd': { const sel = $('#hspin'); if (!sel || !sel.value) { toast('Nothing to pin'); break; } const n0 = set.home.pins.length; set.home = addPin(set.home, homePinType, sel.value); applySettings(); renderSub(true); renderMain(); toast(set.home.pins.length > n0 ? 'Added to Home' : 'Could not add it'); break; }
    case 'hs-cnew': { const n0 = set.home.pins.length; set.home = addCustom(set.home, ($('#hscnew') || {}).value || ''); if (set.home.pins.length > n0) { homeCType = 'album'; homeCQ = ''; applySettings(); renderMain(); push('homecustom', set.home.pins[set.home.pins.length - 1].id); toast('Created. Now add things to it'); } else toast('You already have the most sections there can be'); break; }
    case 'hs-cedit': homeCType = 'album'; homeCQ = ''; push('homecustom', d.k.slice(4)); break;
    case 'hs-ctype': homeCType = d.v; homeCQ = ''; renderSub(true); break;
    case 'hs-cadd': { const n0 = (set.home.pins.find(x => x.id === d.p) || { items: [] }).items.length; set.home = addCustomItem(set.home, d.p, d.t, E(d.v)); applySettings(); renderSub(true); renderMain(); toast((set.home.pins.find(x => x.id === d.p) || { items: [] }).items.length > n0 ? 'Added' : 'Already in this section'); break; }
    case 'hs-crm': set.home = removeCustomItem(set.home, d.p, d.t, E(d.v)); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-cup': case 'hs-cdn': set.home = moveCustomItem(set.home, d.p, d.t, E(d.v), d.act === 'hs-cup' ? -1 : 1); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-cname': set.home = renameSection(set.home, 'pin:' + d.p, ($('#hscname') || {}).value || ''); applySettings(); renderSub(true); renderMain(); toast('Saved'); break;
    case 'hs-pinrm': set.home = removePin(set.home, d.k.slice(4)); homeRen = null; applySettings(); renderSub(true); renderMain(); toast('Section removed'); break;
    case 'hs-qtg': set.home = toggleQuick(set.home, d.k); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-qup': case 'hs-qdn': set.home = moveQuick(set.home, d.k, d.act === 'hs-qup' ? -1 : 1); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-count': set.home = cleanHome({ ...set.home, count: +d.v }); applySettings(); renderSub(true); renderMain(); break;
    case 'hs-card': set.home = cleanHome({ ...set.home, card: d.v }); applySettings(); renderSub(true); break;
    case 'hs-reset': set.home = cleanHome(null); homeEditP = null; homeRen = null; applySettings(); renderSub(true); renderMain(); toast('Home screen reset'); break;
    case 'btopen': Native.requestBluetooth().catch(() => {}).then(() => Native.openBluetooth()).then(() => toast('Opened Bluetooth settings', 2500)).catch(e => toast(String((e && e.message) || e).replace(/^Error: /, '') || 'Could not open Bluetooth', 3500)); break;
    case 'eqopen': Native.openEqualizer().then(r => { if (r && r.via === 'settings') toast(Native.equalizerHint(r.brand), 4500); }).catch(e => toast(String((e && e.message) || e).replace(/^Error: /, '') || 'Could not open the equalizer', 3500)); break;
    case 'lyricstyle': lyStyleSheet(); break;
    case 'lyricink': $('#sheet').innerHTML = sheetHtml(`<b>Lyrics text colour</b><p>The colour of the lyrics on every background style.</p>${Object.entries(LYINK).map(([v, t]) => `<button class="row" data-act="lyinkset" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === (set.lyricInk || 'auto') ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`); break;   // v278
    case 'lyinkset': set.lyricInk = ['white', 'black'].includes(b.dataset.v) ? b.dataset.v : 'auto'; applySettings(); closeSheet(); { const sp = document.querySelector('[data-act="lyricink"] .tx span'); if (sp) sp.textContent = LYINK[set.lyricInk]; } break;
    case 'lbpick': closeSheet(); lbPick(); break;   // v277: choose the custom lyrics picture / GIF
    case 'lbrm': lbSet(null); lbDbPut(null).catch(() => {}); toast('Lyrics picture removed'); closeSheet(); lyApplyTint(Native.current() || {}); break;
    case 'timestyle': timeStyleSheet(); break;
    case 'timestyleset': set.timeStyle = cleanTimeStyle(b.dataset.v); applySettings(); closeSheet(); { const sp = document.querySelector('[data-act="timestyle"] .tx span'); if (sp) sp.textContent = TIME_STYLES[set.timeStyle]; } { const el = $('#tl'), er = $('#tr'), t = Native.current(); if (el && er) { const z = timeTexts(0, 0, set.timeStyle); el.textContent = z.tl; er.textContent = z.tr; scr.tl = scr.tr = ''; scr.sec = -1; if (t) paintScrub(scrubPos(), t.dur); } } break;
    case 'lystyleset': set.lyricStyle = b.dataset.v === 'classic' ? 'classic' : 'cover'; set.lyricBlur = b.dataset.v === 'blur'; set.lyricPal = b.dataset.v === 'palette'; set.lyricBg = ['home', 'custom'].includes(b.dataset.v) ? b.dataset.v : ''; if (b.dataset.v === 'custom' && !lbUrl) { applySettings(); closeSheet(); lbPick(); break; } applySettings(); closeSheet(); { const sp = document.querySelector('[data-act="lyricstyle"] .tx span'); if (sp) sp.textContent = LYSTYLE[lyStyleKey()]; } lyApplyTint(Native.current() || {}); npApplyTint(Native.current()); break;
    case 'nameedit': nameEdit = true; renderSub(true); nameFocus(); break;
    case 'name-save': nameSave(); break;
    case 'name-cancel': nameEdit = false; renderSub(true); break;
    case 'name-rm': set.userName = ''; nameEdit = false; applySettings(); refreshGreet(); renderSub(true); toast('Name removed'); break;
    case 'npreset': setNpCover(0, true); break;
    case 'tabreset': setTabPct(100); { const i = document.querySelector('input[data-tabpct]'); if (i) i.value = 100; } break;
    case 'lyricsize': push('lysize'); break;   // v148: the size is a slider on its own screen
    case 'lysize-reset': set.lyricPx = LY_DEF; applySettings(); { const i = document.querySelector('input[data-lypx]'); if (i) i.value = LY_DEF; const v = document.querySelector('[data-lypxv]'); if (v) v.textContent = lyName(LY_DEF); } break;
    case 'updcheck': checkNow().catch(() => toast('Could not check. Are you online?')); break;
    case 'upd-go': updInstall().catch(() => {}); break;
    case 'upd-allow': Native.openInstallSettings().catch(() => toast('Open Settings > Apps > Liquid Dark > Install unknown apps')); break;
    case 'upd-retry': updRetry(); break;
        case 'addwidget': Native.addWidget(d.kind).then(r => { if (!r || !r.requested) toast('Long-press your home screen, tap Widgets, then pick Liquid Dark', 4500); }).catch(() => toast('Long-press your home screen, tap Widgets, then pick Liquid Dark', 4500)); break;
    case 'notiftest': notifTest(); break;
    case 'notif-later': try { localStorage.setItem('lf.notifAsked', '1'); } catch {} closeSheet(); break;
    case 'notif-allow': try { localStorage.setItem('lf.notifAsked', '1'); } catch {} closeSheet(); bgAllowHold(notifAllow()); break;   // v209: the background card waits for the Android prompt, then 10 s
    case 'plexport': fmtSheet('pl'); break;
    case 'xp-pl': { const q = curPl(); if (q) fmtSheet('pl', q.id); break; }
    case 'xp-go': closeSheet(); if (d.k === 'ls') exportLs(d.f, lsPeriod); else exportPl(d.f, d.pid || ''); break;
    case 'ls-period': lsPeriod = d.p; fmtSheet('ls'); break;
    case 'ls-import-ok': lsImportOk(); break;
    case 'set-tog': if (setPick.has(d.k)) setPick.delete(d.k); else setPick.add(d.k); setImportSheet(); break;
    case 'set-all': { const all = SIO.groupDiffs(set, setPending.settings, setPending.extras, currentExtras()).map(g => g.key); setPick = setPick.size === all.length ? new Set() : new Set(all); setImportSheet(); break; }
    case 'plimport': importPl(); break;
    case 'plimport-ok': plImportOk(); break;
    case 'plimport-pick': if (plPending) plTargetSheet(+d.i); break;
    case 'plimport-set': if (plPending) { plPending.targets[+d.i] = d.t || null; plImportSheet(); } break;
    case 'plimport-back': if (plPending) plImportSheet(); break;
    case 'plimport-missing': if (plPending) saveMissing(plPending.plan.missing); break;
    case 'xp-pick': xpPickSheet(d.f); break;
    case 'xp-tog': if (xpSel.has(d.pid)) xpSel.delete(d.pid); else xpSel.add(d.pid); renderXpPick(); break;
    case 'xp-all': xpSel = xpSel.size === playlists.length ? new Set() : new Set(playlists.map(p => p.id)); renderXpPick(); break;
    case 'xp-pick-ok': if (!xpSel.size) { toast('Pick at least one playlist'); break; } closeSheet(); exportPl(xpFmt, '', [...xpSel]); break;
    case 'lsexport': fmtSheet('ls'); break;
    case 'lsimport': importLs(); break;
    case 'setexport': exportSettings(); break;
    case 'setimport': importSettings(); break;
    case 'setimport-ok': applyImportedSettings(); break;
    case 'pickfolder': if (scanning) { toast('A scan is running. Try again in a moment.'); break; }   // T18: a running scan would write the OLD folder back into the cache
      Native.pickFolder().then(() => loadLib(true)).catch(() => {}); break;
    case 'rescan': loadLib(true, true, false, true); break;   // v221: forceArt = every file is read again (new embedded art, tags), not only the changed ones; the automatic check stays quick   // v220: the rescan card shows the covers flying in even on a fast rescan
    case 'refresh-art': if (scanning) { toast('A scan is running. Try again in a moment.'); break; } refreshArtRun(); break;   // v213: sucking-in animation while the pictures reload   // BUG-332: pictures and GIFs reloaded, folder art re-checked
    case 'copylog': copyLog(); break;
    case 'log-close': closeSheet(); break;
    case 'stub': toast(d.msg || 'Not built yet'); break;
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pfname') { nameSave(); return; } if (e.key === 'Enter' && e.target.id === 'hsren') { homeRenSave(); return; } if (e.key === 'Enter' && e.target.id === 'q') { set.recent = addRecent(set.recent, e.target.value); applySettings(); e.target.blur(); } });
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.npnum !== undefined) { setNpCover(+e.target.value); return; } if (e.target.dataset && e.target.dataset.tabnum !== undefined) { setTabPct(+e.target.value); e.target.value = set.tabPct; } });
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.bgdim !== undefined) { set.bgDim = cleanDim(e.target.value); applySettings(true); const v = document.querySelector('[data-bgdimv]'); if (v) v.textContent = set.bgDim + '%'; } else if (e.target.dataset && e.target.dataset.nprange !== undefined) setNpCover(+e.target.value); else if (e.target.dataset && e.target.dataset.tabpct !== undefined) setTabPct(+e.target.value); else if (e.target.id === 'hscq') { homeCQ = e.target.value; const top = stack[stack.length - 1], pn = top && set.home.pins.find(x => x.id === top.id && x.type === 'custom'), box = $('#hscres'); if (pn && box) box.innerHTML = custResults(pn); } else if (e.target.dataset && e.target.dataset.lypx !== undefined) { set.lyricPx = cleanLyPx(e.target.value, 'Medium'); applySettings(true); const v = document.querySelector('[data-lypxv]'); if (v) v.textContent = lyName(set.lyricPx); } else if (e.target.dataset && e.target.dataset.lyk) { set.lyAnim[e.target.dataset.lyk] = +e.target.value; set.lyAnim = cleanLya(set.lyAnim); applySettings(true); const em = document.querySelector(`[data-lyv="${e.target.dataset.lyk}"]`); if (em) em.textContent = Math.round(+e.target.value) + '%'; } else if (e.target.dataset && e.target.dataset.ak) { set.anim[e.target.dataset.ak] = +e.target.value; applySettings(true); const em = document.querySelector(`[data-av="${e.target.dataset.ak}"]`); if (em) em.textContent = Math.round(+e.target.value) + '%'; } else if (e.target.id === 'q') { query = e.target.value; results(); clearTimeout(window.__rq); window.__rq = setTimeout(() => { if (query.trim().length >= 2) { set.recent = addRecent(set.recent, query); applySettings(); } }, 1500); } else if (e.target.id === 'pq') { pickN = 60; pickList(); } });

/* scrubber drag (v56): the knob follows the finger and the song jumps ONCE, on release (no seek storm, no stale reports pulling the knob back) */
document.addEventListener('pointerdown', e => {
  const mk = e.target.closest && e.target.closest('.abm'), c0 = Native.current();   // BUG-13: drag the A / B marks on the bar
  if (mk && c0 && c0.dur > 0 && ab.id === c0.id && e.isPrimary !== false) {   // BUG #16: a second finger never starts a second drag
    const isA = mk.id === 'abA', key = isA ? 'a' : 'b', sc2 = $('#scrub'), pid2 = e.pointerId;   // BUG #16: only the finger that started the drag moves / ends it
    if (ab[key] != null && sc2) {
      e.preventDefault(); e.stopPropagation();
      const at2 = ev => { const r = sc2.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * c0.dur; };
      const mv2 = ev => { if (ev.pointerId !== pid2) return; let p = at2(ev); if (isA) { if (ab.b != null) p = Math.min(p, ab.b - 1); } else p = Math.max(p, (ab.a == null ? 0 : ab.a) + 1); ab = { ...ab, [key]: Math.max(0, p) }; paintScrub(scrubPos(), c0.dur); };
      const up2 = ev => { if (ev && ev.pointerId !== pid2) return; removeEventListener('pointermove', mv2); removeEventListener('pointerup', up2); removeEventListener('pointercancel', up2); abSave(); renderNP(); };
      addEventListener('pointermove', mv2); addEventListener('pointerup', up2); addEventListener('pointercancel', up2);
      return;
    }
  }
  const sc = e.target.closest('#scrub'), t = sc && Native.current(); if (!t || !(t.dur > 0) || e.button > 0 || e.isPrimary === false) return;   // BUG #16: ignore a second finger
  const pid = e.pointerId;   // BUG #16: only the finger that started the drag moves / ends it
  const at = ev => { const el = $('#scrub') || sc, r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * t.dur; };
  scr.drag = true; scr.dpos = at(e); scrubKick();
  const mv = ev => { if (ev.pointerId !== pid) return; scr.dpos = at(ev); scrubKick(); };
  const end = (go, ev) => {
    removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel);
    if (go) scr.dpos = at(ev);
    scr.drag = false;
    const c = Native.current();
    if (go && c && c.id === t.id) { Native.seek(scr.dpos); progress(scr.dpos, t.dur); } else progress(Native.state.pos, t.dur);
  };
  const up = ev => { if (ev.pointerId === pid) end(true, ev); }, cancel = ev => { if (ev.pointerId === pid) end(false, ev); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
});
document.addEventListener('keydown', e => {   // keyboard / TalkBack control of the position slider
  if (e.target.id !== 'scrub') return;
  const t = Native.current(); if (!t || !(t.dur > 0)) return;
  const pos = Native.pos(), to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? pos + 5 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? pos - 5 : e.key === 'Home' ? 0 : e.key === 'End' ? t.dur - 1 : null;
  if (to == null) return; e.preventDefault(); Native.seek(Math.max(0, Math.min(t.dur, to)));
});

/* edge-to-edge (v53): MainActivity draws the app under the status + navigation bar and tells us how tall they are */
if (Native.isNative) {
  const put = o => { if (!o) return; const st = document.documentElement.style; st.setProperty('--sat', (+o.top || 0) + 'px'); st.setProperty('--sab', (+o.bottom || 0) + 'px'); st.setProperty('--sal', (+o.left || 0) + 'px'); st.setProperty('--sar', (+o.right || 0) + 'px'); };   // v221: left / right bars (landscape)
  const ask = () => Native.insets().then(put).catch(() => {});
  ask(); [400, 1500, 4000].forEach(ms => setTimeout(ask, ms)); { let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(ask, 120); }); }   /* BUG-17: one native insets call after the resize burst */ window.addEventListener('lf-insets', e => put(e.detail));
}
/* tab bar */
initLens();   // L5: hidden SVG filter for the tab bubble
initJelly(); initLiquidUI();  // liquid press / stretch on buttons, chips, mini player
initLiquidGroups();  // the tab bar's liquid pill on the other button rows (transport, Now Playing bottom row, Play / Shuffle ...)
/* v224: the tab bar is built by buildBar() so Settings > Tab bar can add / remove icons live. The Settings icon is not a page: letting the pill go on it opens Settings and the pill springs back to the page that is still underneath. */
let bar = null;
const tabIdx = () => TABS.findIndex(t => t[0] === tab);
const onBarPick = i => {
  const k = TABS[i] && TABS[i][0]; if (!k) return;
  if (k === 'settings') { const top = stack[stack.length - 1]; if (!(top && top.t === 'settings')) push('settings'); bar.set(tabIdx(), true); return; }
  tab = k; stack = []; renderSub(); renderMain();
};
function buildBar() {
  const old = $('#tabs'), nav = old.cloneNode(false);   // a fresh <nav>: the old glide keeps its listeners on the old element
  if (bar) { try { bar.destroy(); } catch {} }
  nav.innerHTML = tabsHtml(); old.replaceWith(nav);
  bar = glide(nav, { selector: '.tab', initial: Math.max(0, tabIdx()), onChange: onBarPick });
  if (tabIdx() < 0) bar.set(-1, false);   // a page that has no icon in the bar (opened from a widget): no icon is lit
}
/** Settings > Tab bar changed (or an import): rebuild the bar; if the page on screen lost its icon, show the first icon's page. */
function applyTabs() {
  TABS = visibleTabs(set.tabs);
  if (!TABS.some(t => t[0] === tab)) { tab = TABS[0][0]; renderMain(); }
  buildBar();
}
buildBar();
if (Native.isNative) setLibrary([]);
renderMain();
if (Native.isNative) {
  sleepResume();
  Native.getSleepTimer().then(renderNP).catch(() => {});   // T22 timer state lives in the Android side
  loadLib(false);
}
updGateRestorePromise = updGateRestore().catch(() => {}); startAppLogoWatcher(); startPopup().catch(() => {}); creditPicCheck().catch(() => {}); splashCheck().catch(() => {}); setInterval(() => { splashCheck().catch(() => {}); }, SPLASH_POLL_MS); setInterval(() => { creditPicCheck().catch(() => {}); }, CREDIT_POLL_MS); setAssistDone(() => setTimeout(() => startPopup().catch(() => {}), 400)); setAssistGate(() => allFilesDone && notifChecked && !(permOff && !permShownOpen) && !document.querySelector('#sheet .popcard')); setBgAllowAfter(assistHoldsBg); startAssist(); startScrollHints(); startBgAllow(); banCheck(); setInterval(() => { banCheck().catch(() => {}); }, BANNER_POLL_MS); startUpdateCheck().catch(() => {}); setInterval(() => { if (!document.hidden) startUpdateCheck().catch(() => {}); }, UPDATE_POLL_MS);
// T4c step 2: Android Back button = close sheet > close Now Playing > go back one screen > minimise (never exits)
// T18: coming back to the app = maybe check for new music (autoCheck itself limits this to once per 10 minutes)
// v90: coming back to the app also re-reads the sleep timer (it may have fired while the app was away)
if (Native.isNative) import('@capacitor/app').then(({ App }) => { App.addListener('appStateChange', ({ isActive }) => { if (isActive) { clearInstalledBuildCache(); autoCheck(); checkLatestPopup({ force: true }).catch(() => {}); bgAllowCheck(); checkLatestAppLogo({ force: true }).catch(() => {}); startUpdateCheck().catch(() => {}); updRefresh().catch(() => {}); Native.getSleepTimer().then(renderNP).catch(() => {}); } }); return App.addListener('backButton', () => {
  if (bgAllowClose()) return;
  if (closeTop()) return;
  if (stack.length) { plEdit = false; goBack(); }
  else App.minimizeApp();
}); }).catch(() => {});
if (!Native.isNative) { Promise.all([loadPlaylists(), loadFavs(), loadStats()]).then(() => { renderMain(); renderSub(); }); restoreSession(); }   // browser: demo playlists unless saved ones exist
/* ---------- dialogs (D3/D4): the layer on top is the only one reachable; focus moves in and goes back; Escape closes the top layer ---------- */
function closeTop() {
  if (updPending && updSheetOpen()) return true;   // v138: the update screen swallows Back / Escape
  if (assistCardOpen()) return assistBack();   // v214: Back / Escape on an Accessibility card = Not now (this open only), as before it did nothing useful
  if (document.getElementById('lf-bgallow')) return bgAllowClose();   // v214: Escape closes the background card too (= Later)
  if ($('#ppv')) { ppClose(); return true; }   // v132
  if ($('#cvv')) { closeCover(); return true; }
  if ($('#lyr')?.classList.contains('open')) { closeLyrics(); return true; }
  if ($('#sheet').innerHTML) { closeSheet(); return true; }
  if ($('#np').classList.contains('open')) { closeNP(); return true; }
  return false;
}
const modal = { np: false, sheet: false, lyr: false, npFrom: null, sheetFrom: null };
function syncModal() {
  const sheet = !!$('#sheet').firstElementChild, lyr = !!$('#lyr')?.classList.contains('open'), np = $('#np').classList.contains('open');
  const card = !!document.getElementById('lf-bgallow') || !!document.getElementById('lf-assist');   // v214: a permission card covers the whole app
  const inertOf = (sel, v) => document.querySelectorAll(sel).forEach(n => { if ('inert' in n) n.inert = v; });
  inertOf('#main,#sub,#mini,#tabs', card || np || lyr || sheet); inertOf('#np', card || lyr || sheet); inertOf('#lyr', card || sheet); inertOf('#sheet', card);
  const ae = document.activeElement;
  if (np && !modal.np) modal.npFrom = ae; if (sheet && !modal.sheet) modal.sheetFrom = ae;
  const topSel = card ? '' : sheet ? '#sheet' : lyr ? '#lyr' : np ? '#np' : '';   // v214: while a card is open the card keeps focus
  if (topSel && !(ae && $(topSel).contains(ae))) {
    const tgt = sheet ? $('#sheet .sheetbox') : lyr ? $('#lyr .gbtn') : $('#np .grabbtn');
    if (tgt) { if (sheet) tgt.tabIndex = -1; tgt.focus({ preventScroll: true }); }
  }
  if (modal.sheet && !sheet) { const f = modal.sheetFrom; modal.sheetFrom = null; if (f && f.isConnected && !f.closest('[inert]')) f.focus({ preventScroll: true }); }
  if (modal.lyr && !lyr && np) { const b = $('#np [data-act="lyrics"]'); if (b) b.focus({ preventScroll: true }); }
  if (modal.np && !np) { const f = modal.npFrom; modal.npFrom = null; if (f && f.isConnected && !f.closest('[inert]')) f.focus({ preventScroll: true }); }
  modal.np = np; modal.sheet = sheet; modal.lyr = lyr;
}
setLayerSync(syncModal);   // v214: the permission cards ask for the same inert / focus rules
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && closeTop()) { e.preventDefault(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.act === 'lyr-seek') { e.preventDefault(); e.target.click(); }   // D8: lyric lines work from the keyboard
});
// T26: accessibility pass after every render (labels, switch roles, aria-hidden icons) + spoken announcement of song changes
{
  const live = document.createElement('div'); live.id = 'live'; live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status'); document.body.appendChild(live);
  let busy = 0; const run = () => { busy = 0; const s = Native.state; applyA11y(document.getElementById('app'), { playing: s.playing, repeat: s.repeat }); syncModal(); };
  const A11Y_NOISE = /^(?:lq-on|dropat|dropbefore|dropafter|dragging)$/;   // BUG-18: press / drag state classes do not change the accessibility tree
  const realClass = (v) => String(v || '').split(/\s+/).filter(c => c && !A11Y_NOISE.test(c)).sort().join(' ');
  new MutationObserver(muts => { if (!busy && muts.some(m => m.type === 'attributes' ? (!m.target.closest('#lyrbody') && realClass(m.oldValue) !== realClass(m.target.getAttribute('class'))) : !m.target.closest('#tl,#tr,#sleeptxt,#sleepsheettxt'))) busy = requestAnimationFrame(run); }).observe(document.getElementById('app'), { childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class'] });
  on('onTrackChanged', () => { const c = Native.current(); if (c) live.textContent = 'Now playing: ' + rowLabel(c.title, c.trackArtist || trackAlbum(c).artist); });
  run();
}
// test hooks for screenshots / debugging (harmless)
if (!Native.isNative) window.__lf = { Native, banDemo: src => { banPic = { src, stamp: 'demo' }; banShow(); }, bgAllowDemo, notifSheet, updSheet, updPicSet: src => { updPic = { ...updPic, src, stamp: 'demo' }; if (updSheetOpen()) updSheet(); }, go: k => { const i = TABS.findIndex(t => t[0] === k); bar.set(i); tab = k; stack = []; renderSub(); renderMain(); }, push, openNP: () => $('#np').classList.add('open'), setQuery: q => { query = q; const i = $('#q'); if (i) i.value = q; results(); }, lyTest: {   // v275: browser checks of the lyrics backgrounds (Cover colour palette / Cover blur) for every picture source: album cover, the song's own (embedded) picture, a picture / GIF you set for the album or the song, a Canvas video / GIF
    style: v => { set.lyricStyle = v === 'classic' ? 'classic' : 'cover'; set.lyricBlur = v === 'blur'; set.lyricPal = v === 'palette'; set.lyricBg = ['home', 'custom'].includes(v) ? v : ''; applySettings(); lyApplyTint(Native.current() || {}); },
    lyrPic: u => { lbUrl = u || ''; }, ink: v => { set.lyricInk = v; applySettings(); }, homeBg: u => { if (u) bgSetUrl(u); else bgSetMedia(null); },   // v277
    albumCover: u => { const t = Native.current(); if (t) { trackAlbum(t).cover = u || undefined; covTint.clear(); } },   // the cover read from the music file (embedded / album art)
    albumPic: (id, u) => { if (u) alpUrls.set(id, u); else alpUrls.delete(id); covTint.clear(); },
    songPic: (id, u) => { if (u) spUrls.set(id, u); else spUrls.delete(id); covTint.clear(); },
    canvas: (t, u) => { const p = '/demo/canvas/' + t.id + (/\.(mp4|webm)(\?|$)/i.test(u) ? '.mp4' : '.gif'); if (u) { canvasMap['t:' + t.id] = p; cvWeb.set(p, u); canvasOn = true; } else { delete canvasMap['t:' + t.id]; canvasOn = false; } covTint.clear(); },
    pal: () => [...covTint.values()].map(c => (c.pal || []).map(q => ({ L: +q.L.toFixed(3), C: +Math.hypot(q.a, q.b).toFixed(3), share: +(q.share || 0).toFixed(4), solid: q.solid == null ? null : +q.solid.toFixed(2), flags: Object.keys(q).filter(k => q[k] === true).join(',') }))),
    apply: () => lyApplyTint(Native.current() || {}), source: () => { const t = Native.current(); return t ? tintSource(trackAlbum(t), t) : null; } } };

/* liquid glass press: wobble + a light spot at the touch point, on every glass control */
(() => {
  const SEL = '.gbtn,.sbtn,.actions button,.np .bottom button,.cluster button,.mini .mb,.ixtra,.chip,.sortbtn,.toggle,.mini,.gtile,.searchpill,.profile .pfmain,.lssnap,.scanv-hide,.hsseg .chip,.seeall';   // v157: + Share snapshot, scan-progress hide, Home-section chips
  const LIST = '.row:not(.song),.setrow,.card,.lyr-now,.mini-open,.statban,.lshome,.lstop,.lscell,.resume,.lsempty';   // v54: list rows / cards wobble when TAPPED (a scroll that starts on a row must not shake it)
  const wobble = (host, x, y) => {
    const r = host.getBoundingClientRect();
    host.style.setProperty('--lx', (x - r.left) + 'px'); host.style.setProperty('--ly', (y - r.top) + 'px');
    host.classList.remove('lq-on'); void host.offsetWidth; host.classList.add('lq-on');
    clearTimeout(host._lq); host._lq = setTimeout(() => host.classList.remove('lq-on'), 700);
  };
  const reduced = () => document.documentElement.dataset.motion === 'reduce';
  document.addEventListener('pointerdown', e => {
    if (reduced()) return;
    const el = e.target.closest && e.target.closest(SEL); if (!el) return;
    wobble(el.matches('.cluster button') ? (el.closest('.cluster') || el) : el, e.clientX, e.clientY);
  }, { passive: true });
  let down = null;
  document.addEventListener('pointerdown', e => { const el = !reduced() && e.target.closest && !e.target.closest('.toggle,input,.scrub') && e.target.closest(LIST); down = el ? { el, x: e.clientX, y: e.clientY } : null; }, { passive: true });
  document.addEventListener('pointerup', e => { const d = down; down = null; if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10) wobble(d.el, e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('pointercancel', () => { down = null; }, { passive: true });
})();
// v107: a home screen widget tap opens the right screen (or shuffles everything)
const doLaunch = (k, n = 0) => {
  if (k === 'lstats') { const i = TABS.findIndex(x => x[0] === 'home'); closeTop(); bar.set(i); tab = 'home'; stack = []; renderSub(); renderMain(); lsx.fresh(); push('lstats'); return; }   // v145: a listening-stats widget was tapped
  if (k === 'genres' || k.startsWith('genre:')) {   // v148: the Genres widget (title = all genres, a chip = that genre)
    if (!tracks.length && n < 20) return setTimeout(() => doLaunch(k, n + 1), 500);   // the library is still loading
    const i = TABS.findIndex(x => x[0] === 'library'); closeTop(); bar.set(i); tab = 'library'; stack = []; renderSub(); renderMain(); push('genres');
    const raw = k.slice(6), g = raw && genres.find(x => x.n.toLowerCase() === E(raw).toLowerCase()); if (g) push('genre', unesc(g.n));   // matched case-insensitively, like the library groups them
    return;
  }
  if (k === 'shuffle') { if (!tracks.length && n < 20) return setTimeout(() => doLaunch(k, n + 1), 500); Native.playShuffled(listOf('songs')).catch(playFail); return; }
  const t = k === 'search' ? 'search' : k === 'albums' ? 'albums' : 'library', i = TABS.findIndex(x => x[0] === t);
  closeTop(); bar.set(i); tab = t; stack = []; renderSub(); renderMain();
  if (k === 'artists' || k === 'favorites') push(k); else if (k === 'recent') push('recentPlayed'); else if (k === 'playlists') push('playlists');
};
const checkLaunch = () => Native.getLaunch().then(r => { if (r && r.tab) doLaunch(r.tab); }).catch(() => {});
if (Native.isNative) { setTimeout(checkLaunch, 800); import('@capacitor/app').then(({ App }) => App.addListener('appStateChange', ({ isActive }) => { if (isActive) checkLaunch(); })).catch(() => {}); }

/** BUG-272: playlist ids never repeat (two creates in one millisecond / clock set back) */
function newPid() { let id; do id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); while (playlists.some(x => x.id === id)); return id; }
