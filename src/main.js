/* v291c (owner: "make a change so it builds a new APK"): build marker, no behaviour change. The app fingerprint (scripts/app-fingerprint.py) hashes src/, so this line gives GitHub a new app code and a fresh APK. */
import { makeSplit, cleanBarSplit, SPLIT_NAMES, HIDE_OPTS, HIDE_STEPS, hideStepOf, fmtHide, GEAR_MIN, GEAR_STEPS } from './lsplit.js';
import { tintPaletteAuto, tintPaletteFlat, tintPaletteGrad } from './palcore.js';
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
import { TAB_DEFS, cleanTabs, visibleTabs, toggleTab, cleanTabOrder, moveTab, DEF_ORDER, DEF_TABS, reorderShown, dropSlot } from './tabbar.js';
import { HI as DET_HI, detailFromFrames, detailAccumulator } from './tintdetail.js';   // v225: detail pass (faint blush, small accents) + smart GIF frame picking   // v224: customizable tab bar
import { packBlob, unpackBlob, isLegacy } from './blobsafe.js';
import { useMirror, mirrorPut, mirrorGet, mirrorHas, mirrorDel, mirrorKeys, mirrorUrlSync, mirrorSyncKeys, mirrorForget, mirrorSync, mirrorPathSync, mirrorTombed, mirrorUntomb } from './picmirror.js';
import { isPicFile, picType, describe as picDescribe, newPicId, isGif, fmtSize, idbBackend } from './plpics.js';
import { parseLrc, currentIndex, fillWords } from './lrc.js';
import { isPicFile as isBgFile, cleanDim, cleanFit, bgVars, idbBackend as bgBackend, BG_DIM_MIN, BG_DIM_MAX } from './bgmedia.js';   // v134: your own picture / GIF as the app background
import { buildSongInfo } from './songinfo.js';
import { buildExport, exportText, freeName, norm, nameKey } from './plexport.js';
import * as PX from './plforeign.js';   // playlists from / to other apps (M3U8, XSPF, CSV, Spotify ...)
import * as LIO from './listenio.js';     // listening data import / export
import * as SIO from './settingsio.js';
import * as ZR from './zipread.js';   // (PLAYLIST_WANT: playlist zips)   // open a .zip pick (Tempo backup, Spotify download)   // settings backup
import { zipFiles, safeName, stamp as dateStamp } from './transfer.js';
import { shouldCheck, changeText } from './autocheck.js';
import { scanView, feedPace } from './scanview.js';
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
const DEF = { contrast: false, motion: false, refract: true, albumInfo: true, bigCovers: false, redHover: true, anim: {}, tabs: { home: true, albums: true, library: true, search: true, settings: false }, tabOrder: ['home', 'albums', 'library', 'search', 'settings'], barSplit: { style: 'cell', stretch: 100, speed: 100, hide: 8 }, lyWordFade: true, lyWordSpeed: 100, gearHide: 0, lyHead: true, lyHeadArt: 'custom', artShow: 'all', scanShow: 'all', lyricApple: false, lyricSize: 'Medium', userName: '', npCover: 0, npImmersive: false, npTapOrig: true, home: null, tabSize: 'Medium', lyricStyle: 'classic', lyricBlur: false, lyricPal: false, timeStyle: 'left', bgDim: 40, bgFit: 'fill', lyAnim: {}, coverLyrics: true, autoplay: true, autoCheck: true, smartArtists: true, sort: {}, recent: [] };
const SHOW_OPTS = ['all', 'original', 'custom'];   // v309 (owner): Rescan art / Rescan library show all pictures, only the original covers, or only your own pictures / GIFs
let set = { ...DEF };
try { set = { ...DEF, ...JSON.parse(localStorage.getItem('lf.settings') || '{}') }; } catch {}
if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize; set.lyricPx = cleanLyPx(set.lyricPx, set.lyricSize);   // v148: free lyrics size (an older Small / Medium / Large keeps its size)
set.sort = cleanSortSet(set.sort); set.recent = cleanRecent(set.recent);   // T23 / T25
const osReduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };   // D9: the phone's own Reduce Motion counts too
let hwnReady = false;   // BUG-01: homeWithNames is a const declared further down; do not touch it before it exists
let setSaveT = 0;   // BUG-17: slider drags save lf.settings once after the finger pauses (applySettings(true)), not on every input frame
const saveSettingsNow = () => { clearTimeout(setSaveT); setSaveT = 0; try { localStorage.setItem('lf.settings', JSON.stringify(set)); } catch {} };
addEventListener('pagehide', () => { if (setSaveT) saveSettingsNow(); }); document.addEventListener('visibilitychange', () => { if (document.hidden && setSaveT) saveSettingsNow(); });
/* v304 (owner): the Settings button at the top right can fade away after a while (Settings > Look > "Settings button (top right)": Never, or 3 s - 10 min).
   It is always there again when the app is opened after being closed (the count starts at every app start). The Settings icon in the glass bar is not touched. */
function cleanGearHide(v) { const n = Math.round(+v); return Number.isFinite(n) && n > 0 ? Math.max(GEAR_MIN, Math.min(600, n)) : 0; }   /* v316 (owner): at least 6 s */
let gearT = 0, gearGone = false;
function gearArm() {
  clearTimeout(gearT); const sec = cleanGearHide(set.gearHide);
  if (!sec) { gearGone = false; document.documentElement.classList.remove('gear-off'); return; }
  if (gearGone) { document.documentElement.classList.add('gear-off'); return; }
  gearT = setTimeout(() => { gearGone = true; document.documentElement.classList.add('gear-off'); }, sec * 1000);
}
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
  h.dataset.lyapple = set.lyricStyle === 'cover' && set.lyricApple === true && set.lyricBlur !== true && !set.lyricBg ? '1' : '0';   // v294: Apple gradient
  h.dataset.lypal = set.lyricStyle === 'cover' && set.lyricApple !== true && set.lyricPal === true && set.lyricBlur !== true && !set.lyricBg ? '1' : '0';
  h.dataset.lyink = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   // v278: lyrics text colour, any background style
  h.dataset.lywf = set.lyWordFade === false ? '0' : '1';   // v286: Apple Music style word fade-in (Settings > Lyrics animation), on by default
  h.dataset.lybg = set.lyricStyle === 'cover' && set.lyricBlur !== true && set.lyricBg ? set.lyricBg : '';   // v277: 'home' = the Home background picture / GIF (or black); a Canvas shows instead when the song has one (v285: the 'custom' style was removed)   // Cover colour palette = style 'cover' + this flag
  h.dataset.lyrstyle = set.lyricStyle;   // v92: 'cover' = white lyrics on the album's colour
  h.style.setProperty('--lyric-size', cleanLyPx(set.lyricPx, set.lyricSize) + 'px');   // v148: free size in px (default Medium = 23)
  if (lazy) { clearTimeout(setSaveT); setSaveT = setTimeout(saveSettingsNow, 400); } else saveSettingsNow();
}
set.lyAnim = cleanLya(set.lyAnim);
set.bgDim = cleanDim(set.bgDim); set.bgFit = cleanFit(set.bgFit);
if (!['classic', 'cover'].includes(set.lyricStyle)) set.lyricStyle = DEF.lyricStyle;
delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur; set.lyricBg = set.lyricStyle === 'cover' && !set.lyricBlur && ['home', 'pic'].includes(set.lyricBg) ? set.lyricBg : ''; if (set.lyricBg) set.lyricPal = false; set.lyricInk = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   /* v278: lyrics text colour (auto = the style's own: red on classic, white on the others) */ /* v277 + v285: styles = classic, palette, blur, Home screen background (style 'cover' + lyricBg 'home') */   // 3 styles: classic, Cover colour palette, Cover blur. A saved plain 'cover' or the removed Cover colour mix becomes the palette
set.lyWordSpeed = Math.max(50, Math.min(200, Math.round(+set.lyWordSpeed) || 100));   // v299
set.gearHide = cleanGearHide(set.gearHide); gearArm();   // v304: the count starts at every app start
set.lyHeadArt = set.lyHeadArt === 'original' ? 'original' : 'custom';   // v307
set.artShow = SHOW_OPTS.includes(set.artShow) ? set.artShow : 'all'; set.scanShow = SHOW_OPTS.includes(set.scanShow) ? set.scanShow : 'all';   // v309
set.barSplit = cleanBarSplit(set.barSplit);   // v289: Settings > Animation > Landscape mini player
set.timeStyle = cleanTimeStyle(set.timeStyle);   // Settings > Playing bar time: a missing or corrupt saved value falls back to 'left'
if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize;   // Bug 14: a corrupt saved value must not become "undefined"
if (!['Small', 'Medium', 'Large'].includes(set.tabSize)) set.tabSize = DEF.tabSize;
if (!Number.isFinite(+set.tabPct)) set.tabPct = { Small: 85, Medium: 100, Large: 120 }[set.tabSize] || 100;   // v108: keep the size people had chosen before the slider
set.tabPct = Math.min(TAB_MAX, Math.max(TAB_MIN, Math.round(+set.tabPct)));
set.tabs = cleanTabs(set.tabs); set.tabOrder = cleanTabOrder(set.tabOrder);   // v224: which icons the tab bar shows; v284: in which order
set.home = cleanHome(set.home);   // v119: Home screen layout
set.userName = String(set.userName || '').slice(0, 24);   // v119: name for the Home greeting
set.npCover = +set.npCover > 0 ? Math.min(NPC_MAX, Math.max(NPC_MIN, Math.round(+set.npCover))) : 0;   // v119: 0 = automatic size
applySettings();
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applySettings); } catch {}

/* ---------- shell (built once) ---------- */
let TABS = visibleTabs(set.tabs, set.tabOrder);   // v224: [key, label] of the icons the bar shows now (Settings > Tab bar); the Settings icon is a fifth one
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
const gOf = a => { const u = a && a.id && alpUrls.get(a.id); return u && byAlbum(a.id) ? `url('${u}') center/contain no-repeat, ${PIC_BASE}` : a.g; };   // v155: the custom picture is a layer ON TOP of the original cover (a.g): while it loads, or if it cannot be shown, the original is seen, never a blank square
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
const gOfT = t => { if (soHas(t)) return trackAlbum(t).g; const u = t && t.id && spUrls.get(t.id); return u ? `url('${u}') center/contain no-repeat, ${PIC_BASE}` : gOf(trackAlbum(t)); };
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
const apicOf = n0 => { const n = apicKey(n0), v = apicMap()[n]; if (!v) return null; if (v.startsWith('gif:')) return agUrls[n] ? { g: `url('${agUrls[n]}') center/contain no-repeat, ${PIC_BASE}` } : null; if (v.startsWith('album:')) { const al = albums.find(x => x.id === v.slice(6)); return al ? { g: al.g } : null; } return { g: `url('${v}') center/contain no-repeat, ${PIC_BASE}` }; };
const artistCov = (n, cls = '') => { const t = artistTracks(n)[0], base = t ? trackAlbum(t) : NOALBUM, c = apicOf(n); return cov(c || base, cls); };   // v155: the artist photo / GIF is a layer over the first album's cover (itself a layer over the file cover)
let apicFor = '';
/* v149: genre pictures and GIFs. Own storage (so a genre and an artist with the same name never share a photo): lf.gpics = { genre: 1 } marks which genres have one, the file itself is kept untouched in IndexedDB (lf-genrepics): any size, GIFs keep moving. */
const gpMap = () => { try { return JSON.parse(localStorage.getItem('lf.gpics')) || {}; } catch { return {}; } };
const gpSave = m => { try { localStorage.setItem('lf.gpics', JSON.stringify(m)); return true; } catch { return false; } };
const gDb = kvDb('lf-genrepics'), gpUrls = {};
const gpSet = (n, blob) => { if (gpUrls[n]) { try { URL.revokeObjectURL(gpUrls[n]); } catch {} unwarm(gpUrls[n]); delete gpUrls[n]; } if (blob) gpUrls[n] = warmUrl(URL.createObjectURL(blob)); };
const genreCov = (n, cls = '') => { const t = genreTracks(n)[0], base = t ? trackAlbum(t) : NOALBUM; return gpUrls[n] ? cov({ g: `url('${gpUrls[n]}') center/contain no-repeat, ${PIC_BASE}` }, cls) : cov(base, cls); };
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
    const ar = (it, i) => { const a = `data-p="${pn.id}" data-t="${it.t}" data-v="${it.v}"`; return `<button class="gbtn sm dh grip" data-drag="1" aria-hidden="true" tabindex="-1">${I.grip}</button><button class="gbtn sm sr" data-act="hs-cup" ${a} ${i === 0 ? 'disabled' : ''} aria-label="Move up"><svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg></button><button class="gbtn sm sr" data-act="hs-cdn" ${a} ${i === n - 1 ? 'disabled' : ''} aria-label="Move down"><svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg></button>`; };
    const rows = pn.items.map((it, i) => { const [a, b] = what(it); return `<div class="setrow hsrow" data-dkind="hc" data-drow="${i}" data-p="${pn.id}"><div class="tx"><b>${a}</b><span>${b}</span><span class="hsacts"><button class="chip" data-act="hs-crm" data-p="${pn.id}" data-t="${it.t}" data-v="${it.v}">Remove</button></span></div>${ar(it, i)}</div>`; }).join('');
    const seg = cur => `<div class="hsseg">${[['album', 'Albums'], ['artist', 'Artists'], ['song', 'Songs']].map(([v, l]) => `<button class="chip ${cur === v ? 'sel' : ''}" data-act="hs-ctype" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `${top(title)}
    <div class="sethead">Name</div><div class="setcard"><div class="setrow"><input class="hsren" id="hscname" type="text" maxlength="30" value="${title}" autocomplete="off" aria-label="Section name"><button class="chip sel" data-act="hs-cname" data-p="${pn.id}">Save</button></div></div>
    <div class="sethead">In this section (${n})</div><div class="setcard">${rows && pn.items.length > 1 ? '<div class="setrow draghint"><span class="tabico" aria-hidden="true">${I.grip}</span><div class="tx"><span>Hold ☰ and drag a row up or down, then let go. It saves by itself.</span></div></div>' : ''}${rows || '<div class="setrow"><div class="tx"><span>Nothing here yet. Add albums, artists or songs below.</span></div></div>'}</div>
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
    const arrows = (up, dn, k, i, n, label) => `<button class="gbtn sm dh grip" data-drag="1" aria-hidden="true" tabindex="-1">${I.grip}</button><button class="gbtn sm sr" data-act="${up}" data-k="${k}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${label} up"><svg viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg></button><button class="gbtn sm sr" data-act="${dn}" data-k="${k}" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${label} down"><svg viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg></button>`;
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
    <div class="sethead">Quick buttons: order, names, show or hide</div><div class="setcard"><div class="setrow draghint"><span class="tabico" aria-hidden="true">${I.grip}</span><div class="tx"><span>Hold ☰ and drag a row up or down, then let go. It saves by itself.</span></div></div>${hc.qb.map((k, i) => { const def = QUICK.find(q => q[0] === k)[1]; return `<div class="setrow hsrow" data-dkind="hq" data-drow="${i}">${label('q', k, def, hc.qnames[k], hc.qhidden.includes(k) ? 'Hidden' : 'Shown')}${arrows('hs-qup', 'hs-qdn', k, i, hc.qb.length, def)}<button class="toggle ${hc.qhidden.includes(k) ? '' : 'on'}" data-act="hs-qtg" data-k="${k}" aria-label="Show ${def}"></button></div>`; }).join('')}</div>
    <div class="sethead">Time of day</div><div class="setcard">
      <div class="setrow"><div class="tx"><b>A different Home for each part of the day</b><span>Pick which sections show in the morning, afternoon, evening and night.</span></div><button class="toggle ${hc.tod ? 'on' : ''}" data-act="hs-tod" aria-label="Different Home by time of day"></button></div>
      ${hc.tod ? `<div class="setrow">${seg('hs-per', PERIODS.map(x => [x[0], x[1]]), editP)}</div><div class="setrow"><div class="tx"><span>Editing ${PERIODS.find(x => x[0] === editP)[1]} (${PERIODS.find(x => x[0] === editP)[2]}). The switches in Sections below change only this part of the day.${editP === nowP ? ' It is this part of the day now.' : ''}</span></div></div>` : ''}</div>
    <div class="sethead">Artist photos</div><div class="setcard"><div class="setrow"><div class="tx"><b>Change an artist photo</b><span>On Home, press and hold an artist in Your Top Artists, then choose your own photo, a GIF or an album cover. You can also do it from the artist screen with the Artist photo or GIF button.</span></div></div></div>
    <div class="sethead">Cards per row</div><div class="setcard"><div class="setrow">${seg('hs-count', COUNTS.map(n => [n, n]), hc.count)}</div></div>
    <div class="sethead">Card size</div><div class="setcard"><div class="setrow">${seg('hs-card', [['small', 'Small'], ['normal', 'Normal'], ['large', 'Large']], hc.card)}</div></div>
    <div class="sethead">Sections: show, hide, reorder, rename</div><div class="setcard"><div class="setrow draghint"><span class="tabico" aria-hidden="true">${I.grip}</span><div class="tx"><span>Hold ☰ and drag a row up or down, then let go. It saves by itself.</span></div></div>${hc.order.map((k, i) => { const nmx = info[k][0]; return `<div class="setrow hsrow" data-dkind="hs" data-drow="${i}">${label('s', k, nmx, hc.names[k], info[k][1], k.startsWith('pin:') ? (hc.pins.some(x => pinKey(x) === k && x.type === 'custom') ? `<button class="chip sel" data-act="hs-cedit" data-k="${k}">Edit items</button>` : '') + `<button class="chip" data-act="hs-pinrm" data-k="${k}">Remove</button>` : '')}${arrows('hs-up', 'hs-dn', k, i, hc.order.length, nmx)}<button class="toggle ${isHiddenFor(hc, k, editP) ? '' : 'on'}" data-act="hs-tg" data-k="${k}" aria-label="Show ${nmx}"></button></div>`; }).join('')}</div>
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
  widgets: () => {   // v296: moved off the main Settings page (it was 15 rows)
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Widgets</b><span style="width:44px"></span></div><div class="setcard">
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
      <button class="setrow" data-act="addwidget" data-kind="statsall" style="width:100%;text-align:left"><span class="tx"><b>Add Listening: Everything widget</b><span>Large: today, week, month, all time, streak, top song / artist / album, chart</span></span></button></div>`;
  },
  phoneinfo: () => {   // v296: Performance + Diagnostics, moved off the main Settings page
    const row = (t, d, c = '') => `<div class="setrow"><div class="tx"><b>${t}</b>${d ? `<span>${d}</span>` : ''}</div>${c}</div>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Phone info</b><span style="width:44px"></span></div>
    <div class="sethead">This phone</div><div class="setcard" id="lf-dev">${devRows(dev)}</div>
    <div class="setrow"><div class="tx"><span style="color:var(--text-2)">Live: refreshed every half second while this page is open. Android does not let apps read the whole phone's CPU %, so CPU shows how fast each core is running (averaged over the last half second where the phone allows it), like DevCheck and CPU-Z. Eff = efficiency cores, Perf = performance cores, Prime = the fastest core. A core the phone switches off or hides shows \"off\" or \"hidden\". RAM, battery and heat come from the system's own counters.</span></div></div>
    <div class="sethead">Diagnostics</div><div class="setcard">
      <button class="setrow" data-act="notiftest" style="width:100%;text-align:left"><span class="tx"><b>Notification test</b><span>Sends a sample media notification</span></span></button>
      <button class="setrow" data-act="copylog" style="width:100%;text-align:left"><span class="tx"><b>Copy log</b><span>Copies recent errors so you can paste them to an AI</span></span></button></div>`;
  },
  navcustom: () => {   // v295 (owner): drag-to-reorder icons, show / hide each, reset. Short, simple wording.
    const lab = Object.fromEntries(TAB_DEFS), c = cleanTabs(set.tabs), order = cleanTabOrder(set.tabOrder), shown = order.filter(k => c[k]);
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><div style="flex:1;min-width:0;margin-left:12px"><b style="font-size:1.25rem">Customize navigation</b><div style="color:var(--text-2);font-size:.9rem">Hold an icon, then drag it</div></div></div>
    <div class="nvbar tabbar-look" role="list" aria-label="Glass bar preview: hold an icon and drag it left or right">${shown.map((k, i) => `<button class="nvi" role="listitem" data-k="${k}" data-i="${i}" aria-label="${lab[k]}, position ${i + 1} of ${shown.length}. Arrow keys move it">${I[k]}<span>${lab[k]}</span></button>`).join('')}</div>
    <div class="setcard"><div class="setrow"><span class="tabico" aria-hidden="true">ⓘ</span><div class="tx"><span>Hold an icon until it lifts, slide it left or right, then let go. It saves by itself.</span></div></div></div>
    <div class="sethead">Icons</div><div class="setcard">
      ${order.map(k => `<div class="setrow"><span class="tabico" aria-hidden="true">${I[k]}</span><div class="tx"><b>${lab[k]}</b>${k === 'settings' ? '<span>The Settings button on each page stays either way.</span>' : ''}</div><button class="toggle ${c[k] ? 'on' : ''}" data-act="tabtg" data-k="${k}" aria-label="Show ${lab[k]} in the glass bar"></button></div>`).join('')}</div>
    <button class="setrow nvreset" data-act="navreset" style="width:100%;justify-content:center;margin-top:16px"><b>Reset to default</b></button>`;
  },
  animation: () => {
    const tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="tg" data-k="${k}"></button>`;
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Liquid glass &amp; animation</b><span style="width:44px"></span></div>
    <div class="animdock"><div class="demostage"><nav class="tabbar demobar" id="demobar" aria-label="Test bar">${tabsHtml('data-demo')}</nav></div>
      <div class="animdock-r"><span>Test bar: same glass and pill as the real one.</span>${tg('redHover', set.redHover !== false)}</div>
      <div class="animchips"><button class="chip" data-act="anim-preset" data-p="default">Default</button><button class="chip" data-act="anim-preset" data-p="watery">Watery</button><button class="chip" data-act="anim-preset" data-p="max">Max liquid</button><button class="chip" data-act="anim-preset" data-p="calm">Calm</button></div>
      <div class="animdock-s"><b>Glass bar size<em data-tabv>${set.tabPct}%</em></b><input type="range" data-tabpct min="${TAB_MIN}" max="${TAB_MAX}" step="1" value="${set.tabPct}" aria-label="Glass bar size"><span>The test bar above and the real glass bars keep this size.</span><button class="chip" data-act="tabreset" style="margin-top:8px">Reset</button></div></div>
    <div class="setcard">${ANIM_DEFS.map(d => `<div class="animrow"><b>${d.label}<em data-av="${d.k}">${Math.round(set.anim[d.k])}%</em></b><input type="range" data-ak="${d.k}" min="${d.min}" max="${d.max}" step="5" value="${set.anim[d.k]}" aria-label="${d.label}"></div>`).join('')}</div>
    <div class="sethead">Glass bar</div><div class="setcard">
      <button class="setrow" data-act="navcustom" style="width:100%;text-align:left"><span class="tabico" aria-hidden="true">${I.home}</span><span class="tx"><b>Customize navigation</b><span>Choose the glass bar icons and drag them into any order.</span></span>${I.chev}</button>
      <div class="setrow"><div class="tx"><b>Lens refraction</b><span>The tab bubble bends the picture behind its rim, like thick glass. Turn off if the bar feels slow.</span></div>${tg('refract', set.refract)}</div></div>
    <div class="sethead">Landscape mini player</div><div class="setcard" id="bsplit">${bsplitRows()}</div>`;
  },
  lysize: () => `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Lyrics size</b><span style="width:44px"></span></div>
    <div class="setcard"><div class="animrow"><b>Text size<em data-lypxv>${lyName(set.lyricPx)}</em></b><input type="range" data-lypx min="${LY_MIN}" max="${LY_MAX}" step="1" value="${set.lyricPx}" aria-label="Lyrics text size in pixels"><span style="display:block;color:var(--text-2);font-size:0.8125rem;margin-top:2px">Drag to choose your own size (${LY_MIN} to ${LY_MAX} px). Medium, the default, is ${LY_DEF} px.</span></div>
      <div class="setrow"><div class="tx"><p class="ln" style="margin:4px 0;color:var(--accent)">I\'ll risk it all for you</p><p class="ln" style="margin:4px 0;color:var(--accent);opacity:.6">I want you next to me</p></div></div>
      <button class="setrow" data-act="lysize-reset" style="width:100%;text-align:left"><span class="tx"><b>Reset to Medium</b><span>${LY_DEF} px</span></span></button></div>`,
  lyranim: () => {
    const sample = ['Under the lights, I open my heart', 'One step forward, the whole room sings', 'Stage lights, stay with me tonight', 'Every smile a promise I keep', 'Ruby red across the stage', 'Stay close, the music is ours', 'Hold the beat and never look away'];
    return `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Lyrics animation</b><span style="width:44px"></span></div>
    <div class="animdock"><div class="lyr lyprev"><div class="lyprevbody" aria-hidden="true">${sample.map((t, i) => `<p class="ln tap${i === 0 ? ' cur' : ''}" data-li="${i}" style="--d:${Math.min(5, i)}">${lyPrevWords(t)}</p>`).join('')}</div></div>
      <div class="animdock-r"><span>Live preview: it uses your Background style and moves like the real lyrics.</span></div>
      <div class="animchips"><button class="chip" data-act="lya-preset" data-p="default">Default</button><button class="chip" data-act="lya-preset" data-p="smooth">Smooth</button><button class="chip" data-act="lya-preset" data-p="snappy">Snappy</button><button class="chip" data-act="lya-preset" data-p="blurry">Blurry</button><button class="chip" data-act="lya-preset" data-p="still">Minimal</button></div></div>
    <div class="setcard"><div class="setrow"><div class="tx"><b>Word fade-in</b><span>Each word lights up as it is sung, smoothly from left to right (Apple Music style). Off = normal lyrics: the whole playing line lights up at once. Works with every text colour and background.</span></div><button class="toggle ${set.lyWordFade !== false ? 'on' : ''}" data-act="tg" data-k="lyWordFade" aria-label="Word fade-in"></button></div>${set.lyWordFade !== false ? `<div class="animrow"><b>Fade-in speed<em data-lwsv>${set.lyWordSpeed || 100}%</em></b><input type="range" data-lwspeed min="50" max="200" step="5" value="${set.lyWordSpeed || 100}" aria-label="Word fade-in speed"><span style="color:var(--text-2);font-size:.85rem">Higher = the words light up faster. For lyrics timed per word, their own timing is kept.</span></div>` : ''}</div>
    <div class="setcard">${LYA_DEFS.map(d => `<div class="animrow"><b>${d.label}<em data-lyv="${d.k}">${Math.round(set.lyAnim[d.k])}%</em></b><input type="range" data-lyk="${d.k}" min="${d.min}" max="${d.max}" step="1" value="${set.lyAnim[d.k]}" aria-label="${d.label}"><span style="display:block;color:var(--text-2);font-size:0.8125rem;margin-top:2px">${d.hint}</span></div>`).join('')}</div>`;
  },
  settings: (id) => {   // v287 (owner: "give settings a separate page"): id 'page' = Settings opened as its OWN page from the glass bar: no back arrow, a big title like Home / Albums; otherwise the usual screen with a back arrow
    const row = (t, d, right = '') => `<div class="setrow"><div class="tx"><b>${t}</b>${d ? `<span>${d}</span>` : ''}</div>${right}</div>`;
    const tg = (k, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="tg" data-k="${k}"></button>`;
    return `${id === 'page' ? '<h1 class="large setpage-h">Settings</h1>' : `<div class="top"><button class="gbtn" data-act="back">${I.back}</button><b style="font-size:1.25rem">Settings</b><span style="width:44px"></span></div>`}
    <div class="setcols"><div class="profile"><button class="pfmain" data-act="pfpick" aria-label="Choose profile picture, GIF or video"><span class="avatar">${pfHtml() || '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4.5 20c.9-4 4-6 7.5-6s6.6 2 7.5 6"/></svg>'}</span></button>
      ${set.userName && !nameEdit ? `<button class="tx pfnamebtn" data-act="nameedit" aria-label="Your name is ${escH(set.userName)}. Tap to change it"><b>${escH(set.userName)}</b><span>Tap your name to change it</span></button>`
        : `<span class="tx"><b>${set.userName ? 'Change your name' : 'Your name'}</b><span>Shown in the Home greeting. Tap the picture for a photo, GIF or video.</span><input class="pfname" id="pfname" type="text" maxlength="24" value="${escH(set.userName || '')}" placeholder="Type your name" autocomplete="given-name" autocapitalize="words" aria-label="Your name, shown in the Home greeting"><span class="pfbtns"><button class="chip sel" data-act="name-save">Save</button>${set.userName ? '<button class="chip" data-act="name-cancel">Cancel</button><button class="chip" data-act="name-rm">Remove name</button>' : ''}</span></span>`}${pfHtml() ? '<button class="chip" data-act="pfrm">Remove</button>' : ''}</div>
    <div class="sethead">Look</div><div class="setcard">
      <button class="setrow" data-act="bgopen" style="width:100%;text-align:left"><span class="tx"><b>Background picture or GIF</b><span>${bgUrl ? 'Your picture is on every screen.' : 'Use any picture or GIF, of any size, behind the whole app.'}</span></span>${I.chev}</button>
      ${row('Bigger album covers', 'Larger covers in album grids, the Home rows and Now Playing.', tg('bigCovers', set.bigCovers))}
      <div class="setrow" id="gearrow"><div class="tx" style="flex:1;min-width:0">${gearRows()}</div></div>
      <button class="setrow" data-act="animopen" style="width:100%;text-align:left"><span class="tx"><b>Liquid glass &amp; animation</b><span>Everything for the glass bar and the animations: icons and their order, glass bar size, wobble, lens, landscape mini player.</span></span>${I.chev}</button></div>
    <div class="sethead">Home</div><div class="setcard">
      <button class="setrow" data-act="homeopen" style="width:100%;text-align:left"><span class="tx"><b>Home screen</b><span>Choose which sections show, their order, card size and the greeting.</span></span>${I.chev}</button></div>
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
      <div class="setrow"><div class="tx"><b>Apple style header</b><span>Cover, song, a heart for Favourites and ⋯ for more, at the top of the lyrics. Off = the plain back arrow and title.</span></div><button class="toggle ${set.lyHead !== false ? 'on' : ''}" data-act="tg" data-k="lyHead" aria-label="Apple style header"></button></div>
      ${set.lyHead !== false ? `<div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Header cover</b><span>Which picture the header shows.</span><div class="hsseg gearseg"><button class="chip ${set.lyHeadArt !== 'original' ? 'sel' : ''}" data-act="lyheadart" data-v="custom">Your picture or GIF</button><button class="chip ${set.lyHeadArt === 'original' ? 'sel' : ''}" data-act="lyheadart" data-v="original">Original cover</button></div></div></div>` : ''}
      <button class="setrow" data-act="lyricsize" style="width:100%;text-align:left"><span class="tx"><b>Text size</b><span>Text size: ${lyName(cleanLyPx(set.lyricPx, set.lyricSize))}</span></span>${I.chev}</button>
      <button class="setrow" data-act="lyranimopen" style="width:100%;text-align:left"><span class="tx"><b>Lyrics animation</b><span>Glide, fade, size, brightness and blur of the lyric lines.</span></span>${I.chev}</button></div>
    <div class="sethead">Playback</div><div class="setcard">${row('Autoplay', 'Add similar songs from your library when the queue runs out.', tg('autoplay', set.autoplay))}
      <button class="setrow" data-act="eqopen" style="width:100%;text-align:left"><span class="tx"><b>Equalizer</b><span>Opens your phone's own equalizer: Dirac Audio Tuner on OnePlus, Real Sound Technology on OPPO and Realme, and the phone's own sound effects page on other phones (Samsung, Vivo...). Any sound effect changes the sound, so it is no longer bit-perfect.</span></span>${I.chev}</button>
      <button class="setrow" data-act="btopen" style="width:100%;text-align:left"><span class="tx"><b>Bluetooth devices</b><span>Opens Bluetooth settings. A device that connects shows up here.</span></span>${I.chev}</button>
      ${bt.length ? bt.map(d => row(escH(d.name), 'Connected' + (typeof d.battery === 'number' ? ' · Battery ' + d.battery + '%' : ''))).join('') : row('No device connected', '')}</div>
    <div class="sethead">Accessibility</div><div class="setcard">
      ${row('Motion', 'Reduce Motion turns glide and jelly into plain fades.', tg('motion', set.motion))}
      ${row('Increase Contrast', 'Increase color contrast between app foreground and background colors.', tg('contrast', set.contrast))}</div>
    <div class="sethead">Library</div><div class="setcard">
      ${row('Album details', 'Show the artist and song count under each album name. Turn off to see only covers and album names.', tg('albumInfo', set.albumInfo !== false))}
      ${row('Smart artist grouping', 'Merges different spellings of one artist (Lily Rose Depp / Lily-Rose Depp, The Weeknd / Weeknd) and lists each artist of a collab or feat. song on their own page instead of a combined name. Turn off to see artists exactly as tagged.', tg('smartArtists', set.smartArtists !== false))}${row('Check for new music automatically', 'Looks for added or removed songs when the app opens or comes back (at most every 10 minutes).', tg('autoCheck', set.autoCheck))}
      <button class="setrow" data-act="pickfolder" style="width:100%;text-align:left"><span class="tx"><b>Music folder</b><span>Choose or change the folder with your music (FLAC, MP3, AAC)</span></span></button>
      <button class="setrow" data-act="rescan" style="width:100%;text-align:left"><span class="tx"><b>Rescan library</b><span>Finds new songs. Every song and album cover flies into the disc while it runs.</span></span></button>
      <div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Covers shown while rescanning</b><span>Song and album covers only. All = your picture or GIF when a song or album has one, else the original.</span><div class="hsseg gearseg" style="margin-top:8px">${[['all', 'All'], ['original', 'Original only'], ['custom', 'Yours only']].map(([v, l]) => `<button class="chip ${set.scanShow === v ? 'sel' : ''}" data-act="scanshow" data-v="${v}">${l}</button>`).join('')}</div></div></div>
      <button class="setrow" data-act="refresh-art" style="width:100%;text-align:left"><span class="tx"><b>Rescan art</b><span>Reloads every picture and GIF you set (songs, albums, artists, genres, playlists, profile, backgrounds, Canvas) and re-checks the folder pictures of every song.</span></span></button>
      <div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Pictures shown while rescanning art</b><span>All = everything. Original only = the covers that came with your music. Yours only = every picture or GIF you uploaded, anywhere in the app.</span><div class="hsseg gearseg" style="margin-top:8px">${[['all', 'All'], ['original', 'Original only'], ['custom', 'Yours only']].map(([v, l]) => `<button class="chip ${set.artShow === v ? 'sel' : ''}" data-act="artshow" data-v="${v}">${l}</button>`).join('')}</div></div></div>
      <button class="setrow" data-act="stats-clear" style="width:100%;text-align:left"><span class="tx"><b>Clear play history</b><span>Empties Recently Played and Most Played. Favorites and playlists stay.</span></span></button></div>
    <div class="sethead">Backup &amp; transfer</div><div class="setcard">
      <button class="setrow" data-act="plexport" style="width:100%;text-align:left"><span class="tx"><b>Export playlists</b><span>Save playlists as a backup, M3U8, XSPF or CSV. Other players and Spotify / Apple Music transfer tools can read them.</span></span>${I.chev}</button>
      <button class="setrow" data-act="plimport" style="width:100%;text-align:left"><span class="tx"><b>Import playlists</b><span>From a Liquid backup or any app: M3U / M3U8, PLS, XSPF, CSV (Spotify, Apple Music, Soundiiz, Exportify) or Spotify's data download. Yours are kept.</span></span>${I.chev}</button>
      <button class="setrow" data-act="lsexport" style="width:100%;text-align:left"><span class="tx"><b>Export listening data</b><span>Your play history as a Liquid or Tempo backup, Last.fm CSV, scrobbler log, ListenBrainz, Spotify-style JSON or CSV.</span></span>${I.chev}</button>
      <button class="setrow" data-act="lsimport" style="width:100%;text-align:left"><span class="tx"><b>Import listening data</b><span>Liquid or Tempo backup, Last.fm, ListenBrainz, Spotify, YouTube Music, Apple Music, Maloja, .scrobbler.log, CSV; .zip files too. Adds to your history; nothing is counted twice.</span></span>${I.chev}</button>
      <button class="setrow" data-act="setexport" style="width:100%;text-align:left"><span class="tx"><b>Export settings</b><span>Every setting: lyric size and animation, liquid glass, tab bar, Home layout, background look, profile photo and the rest, in one file. Big pictures, GIFs and videos are not in it.</span></span>${I.chev}</button>
      <button class="setrow" data-act="setimport" style="width:100%;text-align:left"><span class="tx"><b>Import settings</b><span>Put a saved settings file back, e.g. after reinstalling the app.</span></span>${I.chev}</button></div>
    <div class="sethead">More</div><div class="setcard">
      <button class="setrow" data-act="setsub" data-sub="widgets" style="width:100%;text-align:left"><span class="tx"><b>Widgets</b><span>Add a Liquid Dark widget to your home screen.</span></span>${I.chev}</button>
      <button class="setrow" data-act="setsub" data-sub="phoneinfo" style="width:100%;text-align:left"><span class="tx"><b>Phone info and diagnostics</b><span>Processor, memory, notification test, copy log.</span></span>${I.chev}</button></div>
    <div class="sethead">About</div><div class="setcard"><div class="setrow" style="display:flex;align-items:center;gap:14px"><img id="lf-about-logo" alt="Liquid Dark app logo"${appLogoSrc() ? ` src="${appLogoSrc()}"` : ''} style="display:${appLogoSrc() ? 'block' : 'none'};width:48px;height:48px;object-fit:contain;border-radius:12px"><span class="tx"><b>Liquid Dark</b><span>Version ${APP_BUILD} (${APP_VERSION}) · code ${MY_CODE_ID || 'n/a'}</span></span></div><button class="setrow" data-act="updcheck" style="width:100%;text-align:left"><span class="tx"><b>Check for updates</b><span>Look for a newer build on GitHub now.</span></span>${I.chev}</button>${row('Credits', '♥︎★ Ai Hoshino <span class="credheart" aria-hidden="true">♥️</span><img class="credstar" alt="" aria-hidden="true" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAaC0lEQVR4nO19e3RURbrvr6r27t2dTtKdDkkIL3ll9BIQFIQZGCRwZS3gDnpGTzdHx3Mzl+WEZ2AQDwIy7vQZjzcuRXEQmCBenHE5Z24y3ovOrHu8iitxwBEQ5SIEhwETg0kIIc9+pF+7qu4f9A4NgjzSSMfxt1avdKe7q76q76vvVV9VA9/hO/QBJP74Dt8kKisrma7r1Hyt6zqtrKxkN5OmvxtIKXslvqSkRHW73ZaEt/vdauhPBBMpJQghcuvWrcVOp/OhcDj8PQDQNO1Ee3v7KytWrPifUkpKCBE3m9irhXKzCbha6LpOCCFiy5YtzzmdztXV1dU4fvw4AGDcuHHDp0+fPnvLli0jCSH/vbKyknk8Hn6TSf72wO12MykleeGFF6a8/vrrcvbs2VGr1WpkZWXxrKwsbrVaY26323j11VejzzzzTAEAkmgjUhn9gki32w1CiHQ6nYsaGhrkgQMHiMvlYjabjdpsNpqVlaVUV1dLv9+vZmdnLwQg0U/GlvJE6rpOPR6PeO65575HCHnwnXfekYQQBgBCCAghQAhBLBZj7733nmSMLdR1Pd3r9fJEg52qSHkGFBUVUQDS6XT+N5/PZz127JiwWq1EiPN2VkoJTdPIwYMHRTgczh02bNgCALKmpiblXdNUZwApKirixcXFVlVV3R988AFCoRCl9DzZhBBwzqEoCrq7u8mRI0egKMpSAKSmpiblvaGUZoCu64wQIqdNm/ZPkUhk1L59+7jNZqOJ0m8YBux2OwghUFWV1tTUcMMw7ty6descr9crUj1AS2kGABAAiNVqXXT48GHZ0dEBRTnnOcf1PoYMGYKHHnoI06dPh6IoaGpqkvX19UhLS1t6c0m/OqQsA3RdV7xer9i2bdtcwzC+X11dLS0WC5NSAjjHACEEcnJyoKoqCgoKMGLECHDOld27dwsp5ZyXXnppgsfj4am8ClKWAceOHZMAkJaWtryurg5NTU1S0zSYDDAhpYQQAlJKjBo1Cpqm4cSJE6K1tVWx2+0lN4X4a0BKMkBKSauqqvjzzz9fKISYvXv3bkEpZRd9BoQQBAIBSCkRi8UwePBguFwuRCIRtm/fPkkpfVjX9QEejydlXdKUZEBVVRUBAJfLtailpUU5fvy4sFqtSDS+wDk1FAqFIKWElBJpaWkYMmQIFEUhBw4c4D6fL2Po0KE/BYBUdUlTkQHE4/GIkpISByHk4QMHDkjOOSPkqwJMKUVPTw9isVivOzpq1ChYrVb4fD768ccfw2KxPDJjxgylqKiIIwWTjynHAF3XGQA5ZcqURd3d3Vn79+/nNpuNXCz9wLkVEI1GwTkHpRSGYSA3NxcDBgyAoih07969PBwO3/qTn/xkASFExttOKaRUNjSup3lHR4emKMrPPvroI+n3+2lGRsZX1I9pA2KxGMLhMDRNQywWg6ZpGDFiBE6fPo2zZ8/i6NGj8s4771wJ4N9xzq1NKaTUCigrK2OEEDl27NgfRaPR0R9++KGwWq30Ys/HhLkCwuEwTBVlGAZGjBgBm80GSin74IMPJCFk4osvvnhHKgZmqcYADoBomvYvn376Kc6cOQNVVb/iel6MxNjAMAw4nU4MGTIElFLU19eLuro66nA4VgFAVVXVDR/HtSBlGFBZWckIIfKFF16YTCmd8uGHHwpVVdnXTT6lFJxz+Hw+MMYuYNSoUaNAKYUQgu3du1cSQtzl5eVDqqqqeCrtFaQMISYcDkdpXV0dPv/880sGXhdDSoloNNr72rQL+fn5SE9Ph8ViIUePHuVtbW2WAQMGlAJAYWFhynhDKcGAeM6f//KXv7yFMbbg/fffl0KIS7qel0JXV9cFr4UQsNvtGDZsGDjnCIfDbM+ePVAUZeHSpUvTPR6PQIq4pCnBAMTpyM/PX9re3q7U1tZym832Fc/ncuD8q9u/nHMUFBSAMQZN08gnn3xihMPhARMmTHgYQMq4pDfdDZVSEkII13XdqSjKI++//74Mh8MsPT39igyQUoIxBp/PB8MwYO4TmGooLy8POTk5OHv2LDo7O8mBAwfk3XffXVJSUvIKgJTYtL/pK6CsrIwBkIMHD/6HWCzmOnz4MNc0jVxJ9yfCDMYSIaWEoigYNWoUDMOA1Wpl+/btEwDuGDdu3LRUcUlvOgMKCwulrutUVdXS/fv3o729nVyN6wmcXwGBQAChUAiU0q+4pMOGDYPVaoWiKGhubsZf//pXpKen/8uNHtfV4mYygLz44ouax+PhWVlZ9zHG7ty7dy/XNO1rXc+rbjwhJsjLy0MsFgOllL333nuCMTavvLx8cnyvwHLl1m4ckm0DCHCuiAo45+7V1tZe4G0UFhbK2tpa6fV6xcqVKyMbNmy4NTc391f79u0TLS0txGazXZX093YYj4YDgQAyMjIuUEXmChk6dCi++OIL2Gw21NXVob6+Xo4cOXLzjBkz/rPH4wnEaaa4tED2GiKv12sS1ncJMem/mg8lBi6mD11bW0uKiopQU1ODwsJCCQDXUo1WXl7uyM7OXmC328saGxvzf/WrX4loNEovDqiuOIA4A+bNm4fhw4cjGo32piWklLBYLPjyyy/xpz/9CRaLBdFoFE6nU/z85z+nLpfr41AoVPb222+/U1VVFb1CV70wbYc5B2fPnu0luLa2VgJAWVmZJIRccSAXMEBKSeJGEQDg9Xo5roHbbrebjRkzRh09evQtmqaxWCzmUhRleLxWM5cQMjISidiFEP8pHA7fQggZdPjwYezatUtEIhGqKMo1TT5wLhoOhUK4++67MWHChF5bEB8PLBYLGhsb8cc//hGqqgIAYrEYMjIyxIIFC+jIkSPBGPsbY6xdUZTPNE0Lcs7rAJwVQhBK6TFKaTgcDoesVmuTx+O5akbFabhgTsvKyngiY0jiBy/HsR07dgzSNI1yzl1Wq3UIpVQQQvIIIcMjkUgGpfS2SCSCSCRyK6XU6vf7BwMg5lZhMBhER0cHotEo2tra4Pf7EQgE0NTUxDs7O6mmaeRaJb93APEVMGLECMybNw/hcPgCBqiqiubmZrz11lu9eSXTPsRiMZGdnY1hw4ZRVVXhcDgwYMAA2Gw2ZGZmIi0tDYQQsxAgkp6e3so577ZarQ0Wi4VIKT9TVdXPGKuNRqNBAAiFQicdDkeosbExsnLlyrOXY4o510riP3Rdd40YMeIhTdMmxWIxFovFxhBCbKFQ6JZQKMQMw9AIIejp6UFXVxc452htbUUwGEQ4HEZraysIIWhvb0csFgPnXEYiEW4YRm8VG6UUhBDCGCOKojC73d67o3U9MCf51KlTaGlpQX5+PkKhUO/7mqahubkZFxdyKYoCRVGoz+fDoUOHhBBCSimlSSOlFIqiwGq1MkopsdlsmsPhGCqEGDpo0KCxiqLA5XLNczqdsFgsyMjIQNx+8Z6eHkNRlNDOnTubhBBdVqu1TlXVkN/v33P06NE3CCEhnBN+2VvEmpaWNjA3N/ddIcSYffv2ob29HW1tbQCAzs5OhMNhGIaBnp4eHpceCCFkXN+SuKSQ+OBIHEh8XDxxiX/7AlOiXS4XZs+eDZfL1Vs1cfz4cfz5z3/+2u9eKuVhCkXCQxqGIeN9yTjd0hwvYwyKosButzNKKex2O5xOJwghyMnJQVZWFqZOnQrO+f/r7OycvXr16nYAIGYp98svv/zbaDT6z88++2yktbWVKYoCswSNMUbiT4kpHZcj+lLPvwmY0a/FYsHw4cPhcDjQ1NSE5uZmMMYuSe+1tn+p58D5scZXuTSfc84lAMk5l5xz3HLLLfyxxx7TOOf/VlJSsqG6ulohAPDss8/aXS5X3WuvvTbg4MGDxOl09upvQshNndhrgSn1sVgMUkpQSmGxWL5Rmi9mlDmHlFJ0dHSI2bNn4/777z9aXFw8HgBRACA3Nzfb5/O5mpubqc1mk5zzpKqIbwrmYDVN6x38N03/pYTVpMNqteLs2bM0Go2a8ZekAOD3+6OqqsYsFktvuXd/RmKxVqrAXJ2EEJlYXUwBkOXLl5/RNO3zadOmiVAoJExJ+g7JgTn5QggxY8YMQin9EjgXN9HKykoKQAaDwY333HMPve+++0hPT4/4NqyEVIC5bRqJRERxcTErLCw0urq6ngZA3G43qMfj4bqu0+XLl796+vTpZfPmzZMLFy6knHOemGP/DtcOxhjC4TBUVeXLly+nU6ZMMZqamv5x1apVNbquE4/Hw3tF3HRHn3/++fsGDhy4s66uLmv79u1GIBBQbDbbJXedvsPlYabJBw0aZCxevFjJyspqamxs/PH69es/SjzF2SveHo+HV1RUqI8++uibx44dmz5s2LATa9asUQYNGmT4/X4wdtP3LvoFTJfT5/Nh7Nixsccff1xxOBx7jx8//oP169d/pOu6kpi0/IqSj9flG8XFxc6ioqI3AMx69dVX+ccff8wyMzNvimvXX2C6vj09PbKoqEg89NBDLBgMvvr222+XVlVVBS51fvmSVjbhtDnZsWPHNrvdvuiNN94w3n33XWa1WkniztN3OAezNpVzLu6//346a9YsdHZ2PrN06dK1wLmUvtfr/com92XdHDNH5PV6xUsvvbQiNzf3xZqaGlRWVgpCCFVV9aqrFr7toJQiEonAYrHwhQsXsrFjx/a0trauXLly5Y7KykrmdrvF5TLNV/IzSTxTKjZu3PjAwIEDf3vixIm0V155xQgGg98ZZ5wvkc/JyTEWLVqk5OfnN506derhdevW1VRUVKiLFi2Kfe33r9C+JIQIXdeV1atXv1FfXz9z9OjRJx5//HElLy8vFgwG/66NM6UUgUAAo0eP5mvXrlVycnKOHTt2bNrVTj5wDdVhZoNPPPHE0IKCglcppbO2bdsWq62tVdPT0/+ujLMZoAaDQTlt2jT+8MMPKz09Pbs+/fTT4s2bN/uu5bKQawp1zYYnTpyoLl68+Nfp6ekLf//734vq6mqSlpZGLs6cfhuRENnKe++9V86fP5+2tbU9u2TJkjXA5Y3t5XDNuQZd16m54bxt27YnMjIyntqzZw+qqqqEoihUUZRvrXE2I1tFUXhxcTEbP348WltbS1atWvXylYzt5XC9yR5SXV3NZs6caWzatOnh3Nzc7Z999pntlVde4ZFIhGma9q1jAmMMwWAQLpfLWLx4sZKfn99x+vTpBWvWrNkd1wwC11Gu0qdsm2kXnn766SlDhgz5321tbfkVFRVGS0uLkp6e/q3xkExjO2rUKGPJkiWKzWarbWxs/Od169Ydqq6uVmbOnGlcd9t9IWzRokUxXdeV9evX7z9y5MikrKysQ2vXrlVuu+02w+fzfSsSeYQQ+P1+OXnyZL569WpFUZR3Dh06VLRu3bpDuq73afKBJNXIm8Z55cqVzgkTJvzaYrEseO211/j+/fuZ1Wrtt4aZEIJIJII5c+bg3nvvRVdXV8XixYsXA+fH3Oc++k7mOSRa/4qKil84HI5/3bFjBz948CBLS0vrdzaBUopgMCjnzJkjHnjgAePMmTMbSktLn0vMECSjn6TuuEgpSVVVFfV4PHz79u2bpJQrn3rqKR6JRNj1Fl7dDJgVFtnZ2XzDhg2sq6trRWlp6WZd1y1erzeGJNaGJlVJE0JkbW2tlFLSurq6X1oslo6RI0fSaDQq+9PuWrzaTtx+++1MCHHi4MGDL+u6rpSVlSV18oEbUJ7u9XpFVVUVKS8vb1cU5T8KCgqIYRj9zh0SQojMzEyoqvq/fvOb34SBcwKW7H5uiJsSXwVECJHf1dV1rmyuHyJenjPgRvaR9DNiZvY0MzPTlZGRMfHUqVNQFKXf+aOMMdrU1IRIJDLV7XazsrIy7vV6k95P0iemqqqKAkBmZuZoznlGe3u7MGtG+wvi9Z60paVFGoYxatasWSPjxctJn6+kN2ieiNE0bUIgEKDd3d2iP3lAwPnq6fb2dhmJRCw2m200cGMOeN8w1cAYm3jq1KkL6vX7E+JxgOjo6ICqqrcD54Urqf0ku8H4hRuIRqMTTp48CUppvzTA5gVQn3/+OYQQPwDQexQrmUgqA3Rdp4QQuWPHjkGhUGhcY2MjVFW97HUzqQzTDtTV1SEcDk/ZuHGjLZ56SKpAJZUBpo5kjN3BObd1dHTw/maAE6GqKjlz5oyMRCJ5mZmZBcD5E6DJQlIZkJOT08sAn8+Hnp4e2R/1P9B7xJV0dXWJcDhMNE0bByTfECd1dszjmpTSOxsaGmAYRn+NwQCcM8ThcFiePXsWjLGJwHkhSxaSFojF73sTbrfbEo1Gx508eRKMsf47++dB6urqUFhYOAHABWeCk4GkrYCysjJCCJGzZ88uCIfDIxsbG6WiKP3SAJuIn8CkX3zxBUKh0Ljy8nJHsi+BTaYKogBgsVgmh8Nh2tXVxa/n4HUqwTwB2dLSIiKRyICBAweOBwCPx5O0eUu6hVQU5fb29vZ+G4BdjPhmvAiFQiCE3AUAY8aMSckVYO4Q3dbQ0IBkLtOLYZaAm38vd2w2WX3FYjE0NTVBVdXbkt1+UhggpSRer1c888wzGeFweFJdXR1uhP43JzwajcLv94uenh4jGAwafr9fxK+jSWp/Cf2S+vp6xGKxO8zMaLLaTpYXRADIvLy873V3d2c1NzdLVVWT6y/Hy79DoZAcPny4mDp1Khs4cCCVUqK5uRl79+7ljY2N1G63E8ZY0vagTUNcV1eHQCBw28yZM7MJIa1fd7fGtSApDKipqaEABKX0+6FQiPl8PkPTNCUZKyB+9yf8fr/MysoS8+fPZ3fffTdjjB2klP5WSplx6623Pjh16tSxNTU1ePfdd3kwGGRpaWkA+n7O2TTEbW1tPBQKpeXm5k4FsCuedu/zSkgKA0zfmDF2R2trK2KxGPpajmLe4RAKhaCqKp85cyabO3cuy8zMbOrq6vrFsmXLdiZ8/Nnt27eXzJ079xcTJ07M27Vrlzx8+LAA0FsW0xda4lfiyEAgQPLy8n4AYFeyArJkKE3idrsFAAghxjc0NAB9TFhRShGLxRAIBMTo0aPFY489xh588MGgqqrlf/nLX8YvW7Zsp5SS6Lqu6LquAIiVlJRsOXLkyESHw/HyI488QlasWMGGDBkiAoGANG9Xv+4Bxi8DaW5uBqX0ViB5AVmfV4D5G4+bN2/ODgaD36uvr7/uDKipbgKBgMzLyxNz585lkydPhmEYb5w4cWLdk08+eSLep0IIMQCYVWlE13Xm9XqbAJRs3Ljxf4wcOfLpxx57bOaePXvw9ttvGz6fj9lsNmL2cS2I54XoyZMn8f3vf/92Xdct8YubCPpYJZEMFUQBCIfDcVdbW1vm6dOnxbUywHQhe3p6oKoqnzt3Lps7dy5TFKW2s7NzfWlp6VvAuWq0eAXyxeWA0uv1Ggl1SfsAzNq6des/zZgx49kpU6YMefPNN/Hhhx9yzjkz76W7FhotFgtpaGiA3+8fPnTo0BEAjuu6ThLukbsu9FkFFRUVnWuI0h/EM6Diapd7olsZCoXE+PHjxYYNG9i9997bHo1GV7/55pt3lZaWvmX+gLPH4+Ff53kQQqR58FxKSZYuXfr7Q4cOTQRQ7na7o48//jgrKCgQfr9fXMshdDMz2t3dzeOZ0bvib/V5/vrcgKkLpZTjW1paIIS4qgxooneTn5/PV6xYQX/2s59Rp9P527/97W+TSkpKnq+qqgqZNZjXUgro9XoFIURWVlayjRs3tj7yyCPrmpubJ+Xk5PyfZcuW0UWLFlGHw2EEAgEze3tV9EYiEdnW1gZCyGTgvPD1BX1iACEEHo9HuN1uJoQYderUqSvWAJlRazAYlIqiGAsWLCBr1qxho0eP/qC9vX1WcXFxsdfr/SJuXElfCmDNxJmu68ratWuP/PSnP/0v3d3dP77jjjs+eeKJJ5T58+cTzjnv6em52miaNDU1AcAEJOmnEvtkA5588knq9XrF7Nmz830+38j6+npYLJZL6v9Et1JKyX/4wx+y+fPnKxkZGad8Pt8zS5Ys+TUA8TV6/roQV1mGWVKyYsWKXQD+uH379pVz5sz5xaRJk5xvvfWW/OSTT4SiKMy8Mv9SY2CM0YaGBoTD4YLVq1eneb3eYF8DsqTE7k6nc1AoFErr7OyUl8qAmlGs3+8XBQUFYtWqVczj8YQsFsvGgwcP3rFkyZKtUkppqpsbUQLo9XpFwn3RvKSk5PmTJ0+Oz87Ofq24uBilpaUsPz+f+3y+3ov7EmGWqnR3dyMcDpPx48cnha6kBGKxWKzTarVG7Ha7xefzXXA9JOccfr9f5uTkiAcffJDdddddkFK+19zcvGrt2rVHgN5fz+D4Bm40N1Va/EqGUwD+66ZNm7aPGTPm6YKCgunV1dXYvXs39/l81G639x48NA/naZomVVXFmTNnbjSpV0Y840ncbrdl586dzYsXL5aapsVcLpfIzs7mmZmZPC8vL/bAAw/Il19+Wf7ud7878tJLL/2j+X1d15UbmTW9GvoTblAn27dvX/z66683b9myRf7oRz+SLpcr5nA4eHZ2Nnc6ncJut0fWrl0rd+7c+QEAmoxKuT4P3u12s6qqKr558+aHHA7H6wcOHMD+/fvBOUdeXh7uuece5Ofn9wQCgec2bdr0b8eOHYsm+5BDX+F2u9kf/vAHLqXEsmXLsidNmvSEqqqLGxoabLt370ZXVxdsNhumT5+OsWPHoq2tbc6qVav+bzJOySRF+szTMZs2bfpxbm7uE6FQKDsWiyE9PV0ahvEfzc3NL6xfv/4kkLyjPTcCibSVl5cXDh48eAPnfEo4HCbxK/C/bG1tferRRx99J1nZ0KQhcTnqum6pqKhQJ06cqJr/iy/1lN+kv0gtYeLEiWpFRYWq63rvNfep9CtMF+BSv0hhRrE3g56+QNd1evF4LmZOMnCjJDKx3dRZpteHb9NYvsPF+P+cgnPIn5NfkwAAAABJRU5ErkJggg==">')}<div class="setrow lf-credit-box" style="flex-direction:column;align-items:stretch;justify-content:center;min-height:120px;border-radius:12px;margin:10px 14px;border:1px dashed rgba(255,255,255,.18);background:rgba(255,255,255,.03)"><span id="lf-credit-empty" style="display:${creditPic.src ? 'none' : 'block'};text-align:center;opacity:.6;font-size:0.8125rem">Your picture or GIF appears here</span><img id="lf-credit-gif-pic" alt="" src="${creditPic.src}" style="display:${creditPic.src ? 'block' : 'none'};width:100%;max-height:260px;object-fit:contain;border-radius:12px"></div></div></div>`;   // v222: .setcols = two columns sideways, display:contents in portrait
  },
};

/* v77: Bluetooth audio devices (connected list + a toast when one connects / leaves) */
let bt = [];
const btRefresh = () => { const top = stack[stack.length - 1]; if (top && (top.t === 'settings' || top.t === 'phoneinfo')) renderSub(true); };
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
/* v305 (owner: "the live RAM / CPU data is wrong, especially on Oppo / OnePlus"): RAM = /proc/meminfo (MemTotal / MemAvailable, swap = zram + RAM expansion),
   CPU = every core's current speed against its maximum (apps may not read the whole phone's CPU % since Android 8), this app's own CPU %. Read every 500 ms. */
const NOMINAL_GB = [1, 1.5, 2, 3, 4, 6, 8, 10, 12, 16, 18, 20, 24, 32, 48, 64];
const nominalGb = kb => { const g = kb / 1048576; return NOMINAL_GB.find(x => x >= g * .98) || Math.ceil(g); };
const gbk = kb => (kb / 1048576 >= 10 ? (kb / 1048576).toFixed(1) : (kb / 1048576).toFixed(2)).replace(/\.?0+$/, '') + ' GB';
const memOf = d => { if (!d) return null; if (d.memTotalKb > 0) return { tot: d.memTotalKb, av: d.memAvailKb > 0 ? d.memAvailKb : null, swT: d.swapTotalKb || 0, swF: d.swapFreeKb || 0 }; if (d.ramMb > 0) return { tot: d.ramMb * 1024, av: d.availMb > 0 ? d.availMb * 1024 : null, swT: 0, swF: 0 }; return null; };
const cpuLoad = d => {   // v306: the average speed of each core cluster over the last half second (time_in_state) when the phone shows it, else the speed right now; asleep / off = 0
  const cs = (d && d.coreFreq || []).filter(x => x && x.max > 0), pol = (d && d.policies || []).filter(p => p && p.max > 0 && p.cpus && p.cpus.length);
  if (pol.length && pol.some(p => p.avg > 0)) { let w = 0, n = 0; for (const p of pol) { const f = p.avg > 0 ? p.avg : p.cur > 0 ? p.cur : 0; w += Math.max(0, Math.min(1, f / p.max)) * p.cpus.length; n += p.cpus.length; } return n ? Math.round(w / n * 100) : null; }
  if (!cs.length) return null; return Math.round(cs.reduce((n, x) => n + (x.online === false ? 0 : Math.max(0, Math.min(1, (x.cur > 0 ? x.cur : 0) / x.max))), 0) / cs.length * 100); };
const coreKind = (d, i) => {   // v306: efficiency / performance / prime, from cpu_capacity (or the top speed when the phone hides it)
  const cs = d.coreFreq || [], v = cs.map(c => c.cap > 0 ? c.cap : c.max > 0 ? c.max : 0), mine = v[i]; if (!(mine > 0)) return '';
  const lv = [...new Set(v.filter(x => x > 0))].sort((a, b) => a - b); if (lv.length < 2) return '';
  const k = lv.indexOf(mine); return k === 0 ? 'Eff' : k === lv.length - 1 && v.filter(x => x === mine).length <= 2 ? 'Prime' : 'Perf'; };   // short: Eff = efficiency, Perf = performance, Prime = the fastest core(s)
const THERMAL = ['Cool', 'Light', 'Warm', 'Hot', 'Very hot', 'Emergency', 'Shutting down'];
const battNowMa = d => { const v = d.battNow; if (v == null) return null; return Math.abs(v) > 20000 ? Math.round(v / 1000) : Math.round(v); };   // most phones give µA, some (older Samsung and others) mA
const ghz = khz => khz > 0 ? (khz / 1e6 >= 1 ? (khz / 1e6).toFixed(2) + ' GHz' : Math.round(khz / 1000) + ' MHz') : 'asleep';
let cpuPct = null, cpuPrev = null;   // this app's own CPU %: the growth of its CPU time (cpuMs) per second / cores
const cpuUpdate = d => { const now = performance.now(); if (d && d.cpuMs != null) { if (cpuPrev && now > cpuPrev.t) cpuPct = Math.max(0, Math.min(100, (d.cpuMs - cpuPrev.ms) / ((now - cpuPrev.t) * Math.max(1, d.cores || 1)) * 100)); cpuPrev = { t: now, ms: d.cpuMs }; } };
const devBar = pct => `<span class="devbar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
function devRows(d) {
  const row = (t, v) => `<div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>${t}</b><span>${v}</span></div></div>`;
  if (!d || !(d.cores || d.ramMb || d.memTotalKb)) return row('Reading this phone…', '');
  const m = memOf(d), load = cpuLoad(d), cf = (d.coreFreq || []);
  let out = row('Phone', escH(d.model || 'Unknown')) + row('Processor', escH(d.processor || 'Unknown') + (d.abi ? ' · ' + escH(d.abi) : '') + (d.cores ? ' · ' + d.cores + ' cores' : ''));
  out += `<div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>CPU now</b><span id="lf-cpu">${load == null ? 'This phone hides its core speeds' : 'About ' + load + '% of full speed'}</span>${cf.length ? `<div class="devcores" id="lf-cores">${cf.map((c, i) => `<span class="devcore"><em>${coreKind(d, i) || 'Core'} ${i + 1}</em>${devBar(c.online === false ? 0 : c.max > 0 ? c.cur / c.max * 100 : 0)}<small title="${c.max > 0 ? 'max ' + ghz(c.max) : ''}">${c.online === false ? 'off' : c.cur < 0 ? 'hidden' : ghz(c.cur)}</small></span>`).join('')}</div>` : ''}</div></div>`;
  if (m) { const used = m.av != null ? m.tot - m.av : null, pct = used != null ? used / m.tot * 100 : 0;
    out += `<div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Memory (RAM)</b><span id="lf-ram">${used != null ? gbk(used) + ' used of ' + gbk(m.tot) + ' · ' + Math.round(pct) + '%' : gbk(m.tot) + ' usable'}</span>${used != null ? devBar(pct) : ''}<span>${nominalGb(m.tot)} GB phone${m.av != null ? ' · ' + gbk(m.av) + ' free now' : ''}</span>${m.swT > 0 ? `<span>Swap / RAM expansion: ${gbk(m.swT - m.swF)} used of ${gbk(m.swT)}</span>` : ''}</div></div>`; }
  if (d.battTemp != null && d.battTemp > -1000 || d.battNow != null) { const ma = battNowMa(d), t = d.battTemp > -1000 ? (d.battTemp / 10).toFixed(1) + ' °C' : '';
    out += row('Battery', [d.battPct >= 0 ? d.battPct + '%' : '', t, ma != null ? Math.abs(ma) + ' mA ' + (d.plugged ? 'charging' : 'in use') : '', d.battMv > 0 ? (d.battMv / 1000).toFixed(2) + ' V' : ''].filter(Boolean).join(' · ')); }
  if (d.thermal != null) out += row('Heat', (THERMAL[d.thermal] || 'Unknown') + (d.headroom > 0 ? ' · ' + Math.round(Math.min(1.5, d.headroom) * 100) + '% of the slow-down point' : ''));
  out += row('This app', `<em id="lf-app" style="font-style:normal">${d.cpuMs == null ? 'Not available here' : cpuPct == null ? 'Reading…' : 'CPU ' + (cpuPct < 10 ? cpuPct.toFixed(1) : Math.round(cpuPct)) + '%' + (d.appPssKb > 0 ? ' · ' + Math.round(d.appPssKb / 1024) + ' MB memory' : '') + (d.threads ? ' · ' + d.threads + ' threads' : '')}</em>`);
  return out;
}
let ramBusy = false;
setInterval(() => { if (document.hidden || ramBusy) return; const top = stack[stack.length - 1]; if (!top || top.t !== 'phoneinfo' || !document.getElementById('lf-dev')) return; ramBusy = true;
  Native.getDeviceInfo().then(d => { if (d) { dev = { ...dev, ...d }; cpuUpdate(dev); const box = document.getElementById('lf-dev'); if (box) box.innerHTML = devRows(dev); } }).catch(() => {}).finally(() => { ramBusy = false; }); }, 500);

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
let lyPrevT = 0, lyPrevI = 0, lyPrevRaf = 0;
/* v308 (owner): the preview shows the Apple word fade-in too: each word is a .w span with its start time (fillWords, the same timing and Fade-in speed as the real lyrics) */
const LYPREV_MS = 1800;
function lyPrevWords(text) {
  const [l] = fillWords([{ t: 0, text }, { t: LYPREV_MS / 1000 }], set.lyWordSpeed);
  return l.words ? l.words.map(w => `<span class="w" data-wt="${w.t}">${w.w}</span>`).join('') : text;
}
function lyPrevSweep(line) {   // the playing preview line: --wp 0..1 per word, the same formula as syncLyrics
  cancelAnimationFrame(lyPrevRaf); const ws = [...line.querySelectorAll('.w')]; if (!ws.length) return;
  ws.forEach(w => w.style.setProperty('--wp', 0)); const t0 = performance.now(), end = LYPREV_MS / 1000 - .1;
  const f = () => { if (!line.isConnected) return; const pos = (performance.now() - t0) / 1000;
    ws.forEach((w, k) => { const wt = +w.dataset.wt, e = Math.min(k + 1 < ws.length ? +ws[k + 1].dataset.wt : end, wt + 1.2), v = Math.max(0, Math.min(1, (pos - wt) / Math.max(.12, e - wt))); w.style.setProperty('--wp', Math.round(v * 100) / 100); });
    if (pos < end + .2) lyPrevRaf = requestAnimationFrame(f); };
  lyPrevRaf = requestAnimationFrame(f);
}
function lyPrevStart() {   // the Lyrics animation page: a small copy of the lyrics that moves line by line with the user's settings
  if (lyPrevT) { clearInterval(lyPrevT); lyPrevT = 0; }
  if (!$('.lyprevbody')) return;
  lyPrevI = 0; { const f0 = $('.lyprevbody .ln'); if (f0) lyPrevSweep(f0); }
  lyPrevT = setInterval(() => {
    const b = $('.lyprevbody'); if (!b) { clearInterval(lyPrevT); lyPrevT = 0; return; }
    const ls = b.children; if (!ls.length) return; lyPrevI = (lyPrevI + 1) % ls.length;   // BUG-25
    for (let k = 0; k < ls.length; k++) { ls[k].classList.toggle('cur', k === lyPrevI); ls[k].style.setProperty('--d', Math.min(5, Math.abs(k - lyPrevI))); }
    lyCenter(ls[lyPrevI], lyPrevI > 0, b); lyPrevSweep(ls[lyPrevI]);
  }, LYPREV_MS);
}
function renderSub(keep = false, back = false) {   // keep = same screen refreshed in place: no slide-in, scroll position stays. back = returning to the screen below: no slide-in, its saved scroll is put back
  try { barSync(); } catch {}   // v284: the lit icon follows the screen (Settings open = the Settings icon, back = the page underneath)
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
const openSettingsPage = () => { const top = stack[stack.length - 1]; if (top && top.t === 'settings' && top.id === 'page') return; rememberScroll(); stack = [{ t: 'settings', id: 'page' }]; renderSub(); };   // v287: Settings as its own page (the glass bar's Settings icon): it replaces the screens underneath, like switching to Home or Albums
const keepFocus = (root, fn) => {   // D2: a re-render must not drop the focused button
  const a = document.activeElement; let sel = '', k = 0;
  if (a && a !== document.body && root.contains(a)) { sel = a.id ? '#' + a.id : a.dataset && a.dataset.act ? `[data-act="${a.dataset.act}"]` : ''; if (sel) k = [...root.querySelectorAll(sel)].indexOf(a); }
  fn();
  if (sel) { const n = root.querySelectorAll(sel)[Math.max(0, k)]; if (n && n !== document.activeElement) n.focus({ preventScroll: true }); }
};
/* v288 (owner picked "Water split"): landscape only, the mini player splits out of / merges back into the wide glass bar like water. src/lsplit.js. */
const LAND_Q = '(orientation:landscape) and (max-height:520px)';
let lsplit = null, miniIdleT = 0;   // v291: miniIdleT = the landscape mini player's hide timer
const lsplitOf = () => lsplit || (lsplit = makeSplit({ app: $('#app'), bar: () => $('#tabs'), host: $('#mini'), land: () => { try { return matchMedia(LAND_Q).matches; } catch { return false; } },
  reduced: () => document.documentElement.dataset.motion === 'reduce', cfg: () => set.barSplit, durK: () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-k')); return Number.isFinite(v) && v > 0 ? v : 1; } }));
function renderMini() {
  const t = Native.current(), el = $('#mini'); try { $('#app').classList.toggle('has-mini', !!t); } catch {}   // BUG-268: no :has() needed
  const had = !!el.querySelector('.mini:not(.leaving):not(.away)');
  if (!t) {
    clearTimeout(miniIdleT);
    const m = el.querySelector('.mini:not(.leaving):not(.away)');
    if (m) { let sp = false; try { sp = lsplitOf().run(-1, () => { const g = el.querySelector('.mini.leaving'); if (g) g.remove(); }); } catch {}   // v288 / v289: keep a ghost on screen while it merges back into the bar; removed when the merge ends
      if (sp) { m.classList.add('leaving'); m.setAttribute('inert', ''); el._h = ''; return; } }
    if (el.querySelector('.mini.leaving') && !el.querySelector('.mini.away')) return;
    el.innerHTML = ''; el._h = ''; return;   // v291: a player hidden in landscape (merged into the bar) just goes
  }
  const a = trackAlbum(t), s = Native.state;
  const h = `<div class="mini"><button class="mini-open" data-act="open-np">${covT(t)}<span class="meta"><b>${t.title}</b><span>${t.trackArtist || a.artist}, ${a.title}</span></span></button>
    <button class="mb" data-act="pp">${s.playing ? I.pause : I.play}</button><button class="mb" data-act="next">${I.next}</button></div>`;
  if (el._h === h) return;   // identical markup (duplicate events) = no rebuild (and a hidden landscape player stays hidden)
  try { if (el.querySelector('.mini.leaving')) lsplitOf().stop(); } catch {}   // music back / a new song during a merge: drop that animation (the new player replaces it)
  el._h = h; keepFocus(el, () => { el.innerHTML = h; });
  if (!had) { try { lsplitOf().run(1); } catch {} }   // v288: music just started (or v291: a new song / play / pause brings a hidden landscape player back): split out of the bar
  miniIdleArm();
}
/* v291 (owner: "in landscape the mini player should disappear after 8 seconds if there is no touch on it, otherwise our animation is never used"):
   landscape only, Settings > Animation > Landscape mini player > Hide after (v292: Never or any time from 3 s to 10 min, default 8 s). No touch on the player for that long = it merges
   back into the glass bar (music keeps playing; the bar is wide). It comes back (splits out again) on a new song, play / pause, or a swipe UP on the glass bar.
   Turning the phone to portrait shows it again at once (portrait never hides it). */
const isLand = () => { try { return matchMedia(LAND_Q).matches; } catch { return false; } };
function miniIdleArm() {
  clearTimeout(miniIdleT); const sec = cleanBarSplit(set.barSplit).hide;
  if (!sec || !isLand() || !$('#mini .mini:not(.leaving):not(.away)')) return;
  miniIdleT = setTimeout(miniHide, sec * 1000);
}
function miniHide() {
  const el = $('#mini'), m = el && el.querySelector('.mini:not(.leaving):not(.away)'); if (!m || !isLand()) return;
  if (m.querySelector(':focus-visible') || $('#np.open') || $('#lyr.open')) { miniIdleArm(); return; }   // being used with a keyboard (a tapped button keeps plain focus, that does not count) or covered by Now Playing / lyrics: wait another round
  const away = () => { m.classList.remove('leaving'); m.classList.add('away'); m.setAttribute('inert', ''); try { $('#app').classList.add('mini-away'); } catch {} };
  let sp = false; try { sp = lsplitOf().run(-1, away); } catch {}
  if (sp) { m.classList.add('leaving'); m.setAttribute('inert', ''); } else away();
}
function miniShow() {
  const m = $('#mini .mini.away'); if (!m) return;
  m.classList.remove('away', 'leaving'); m.removeAttribute('inert'); try { $('#app').classList.remove('mini-away'); } catch {}
  if (isLand()) { try { lsplitOf().run(1); } catch {} }
  miniIdleArm();
}
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#mini .mini')) miniIdleArm(); }, true);   // a touch on the player starts the count again
document.addEventListener('focusin', e => { if (e.target.closest && e.target.closest('#mini .mini')) miniIdleArm(); });
{ let sx = 0, sy = 0, on = false;   // swipe UP on the glass bar = the hidden player comes back
  document.addEventListener('pointerdown', e => { on = !!(e.target.closest && e.target.closest('#tabs') && $('#mini .mini.away')); sx = e.clientX; sy = e.clientY; }, true);
  document.addEventListener('pointermove', e => { if (!on) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (dy < -26 && Math.abs(dy) > Math.abs(dx) * 1.3) { on = false; try { window.dispatchEvent(new PointerEvent('pointercancel', { isPrimary: true, pointerId: e.pointerId })); } catch {} miniShow(); } }, true);   // the swipe is not a tap: the bar's press is cancelled (no tab change)
  document.addEventListener('pointerup', () => { on = false; }, true); document.addEventListener('pointercancel', () => { on = false; }, true); }
/* v291 (owner: "when we flip to landscape it happens instantly, we can't see the animation"): turning the phone sideways with music playing now shows the wide
   glass bar for a moment, then the mini player splits out of it. The hold class (#app.lrot) keeps the bar wide and the player invisible until the first frame is drawn. */
try { matchMedia(LAND_Q).addEventListener('change', e => {
  const app = $('#app'), el = $('#mini'), m = el && el.querySelector('.mini');
  clearTimeout(miniIdleT); try { lsplitOf().stop(); } catch {}
  if (!e.matches) { if (m) { m.classList.remove('away', 'leaving'); m.removeAttribute('inert'); } app.classList.remove('mini-away', 'lrot'); return; }   // portrait: the player is always there
  if (!m || el.querySelector('.mini.leaving') || el.querySelector('.mini.away')) return;
  if (document.documentElement.dataset.motion === 'reduce' || cleanBarSplit(set.barSplit).style === 'off') { miniIdleArm(); return; }
  app.classList.add('lrot');
  requestAnimationFrame(() => requestAnimationFrame(() => {   // after the new (sideways) layout is in place
    let sp = false; try { sp = lsplitOf().run(1, null, { delay: 450, first: () => app.classList.remove('lrot') }); } catch {}
    if (!sp) app.classList.remove('lrot');
    miniIdleArm();
  }));
}); } catch {}
const tokenColour = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();   // colours live only in tokens.css
const hex6 = c => { c = String(c || '').trim(); const m = /^#([0-9a-f]{3})$/i.exec(c); if (m) c = '#' + [...m[1]].map(x => x + x).join(''); return /^#[0-9a-f]{6}$/i.test(c) ? c : '#000000'; };   // Bug 16: "#000" + "cc" = "#000cc" is not a colour: always 6 digits before the alpha is appended
const LYSTYLE = { classic: 'Black background, red lyrics (default)', apple: 'Apple gradient: soft, slowly moving colours taken from the picture or GIF you set for the song or album, else its original cover, white lyrics', palette: 'Cover colour palette: a colour gradient from the picture or GIF you set for the song or album, else its original cover, white lyrics', blur: 'Cover blur: a blurred version of the picture you set for the song or album (a GIF shows one still frame), else its original embedded cover, white lyrics', pic: 'Song picture: the picture or GIF you set for the song or album (else its cover), white lyrics', home: 'Home screen background: your Home picture / GIF (or plain black), white lyrics' };
const LYINK = { auto: 'Automatic: red on the black style, white on the others', white: 'White lyrics (with a soft dark shadow)', black: 'Black lyrics (with a soft light glow)' };   // v278
const lyStyleKey = () => set.lyricStyle === 'cover' ? (set.lyricBlur === true ? 'blur' : set.lyricBg || (set.lyricApple === true ? 'apple' : 'palette')) : 'classic';   // 'blur' is not a data-lyrstyle value, it is 'cover' plus set.lyricBlur   // only two styles: classic (black, red lyrics) and palette ('cover' + lyricPal)
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
/* v308 (owner): the scan shows EVERY song's and album's cover: the song's own picture / GIF, else its album's, else the original cover of the file ("show original" songs: the original). Song covers only. */
function libCovers(show = set.scanShow) {   // v309: 'all' | 'original' (only the covers in the music files) | 'custom' (only the song / album pictures and GIFs the user set)
  const out = [];
  for (const t of tracks) { try { const c = show === 'original' || soHas(t) ? '' : (spUrls.get(t.id) || alpUrls.get(t.albumId)); if (c) out.push(c); else if (show !== 'custom' && t && t.cover) out.push(Native.fileUrl(t.cover)); } catch {} }
  for (const al of albums) { try { const c = show === 'original' ? '' : alpUrls.get(al.id); if (c) out.push(c); else if (show !== 'custom') { const f = albumTracks(al.id).find(x => x.cover); if (f) out.push(Native.fileUrl(f.cover)); } } catch {} }   // v310 (owner): album covers too (yours, else the original)
  return out;   // v315 (owner): one fly-in for EVERY song and album, even when many share the same picture
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
function refreshItems(show = set.artShow) {   // v309: show = 'all' | 'original' (covers that came with the music) | 'custom' (pictures / GIFs the user uploaded)
  const out = [], add = (u, n) => { if (!u) return; const o = n === 'Song covers' || n === 'Album covers'; if (show === 'original' ? o : show === 'custom' ? !o : true) out.push({ u, n }); };
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
    if (set.lyricStyle === 'cover' && set.lyricBg === 'home' && bgUrl) add(bgUrl, 'Lyrics background');   // v308: the lyrics background (Home style shows the Home picture / GIF; Song picture style = the song pictures above)
    for (const t of tracks) { const cp = cvPath(t); if (cp) add(isVideo(cp) ? (t.cover ? Native.fileUrl(t.cover) : coverOfAny()) : Native.fileUrl(cp), 'Canvas'); }   // Canvas: one for each song that plays one (an MP4 shows the song's cover)
  } catch {}
  return out;
}
const coverOfAny = () => { try { const t = tracks.find(x => x.cover); return t ? Native.fileUrl(t.cover) : ''; } catch { return ''; } };
/* Counts up to the real total while the pictures are sucked into the disc (about 14 ms per place, 3.5 s ... 9 s in all). Every ~75 ms one of the places is flown in (a fair sample when there are thousands). */
function artFly(items) {   // v308 + v315 (owner): EVERY place flies in (a picture shared by 500 songs flies 500 times), not a sample
  return new Promise(res => {
    const total = items.length; if (!total) return res();
    const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const uniq = items;   // v315 (owner): every place flies in, even when many share the same picture (500 songs with one GIF = 500 fly-ins)
    const { gap, per, ms } = scanView.pace(uniq.length), t0 = Date.now(); let i = 0;   // v310: chip speed / room set for this many
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / Math.max(1, ms)), batch = uniq.slice(i, i + per); i += batch.length;
      const done = k >= 1 || i >= uniq.length ? total : Math.round(total * k);
      scanView.artUpdate({ done, total, all: true, covers: still ? [] : batch.map(x => x.u), name: batch.length ? batch[batch.length - 1].n : '' });
      if (i >= uniq.length) return scanView.idle().then(() => setTimeout(res, 400));   // v310: waits until the last queued picture is in
      setTimeout(tick, gap);
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
    scanView.artFinish({ title: 'Rescan art finished', count: items.length ? `${items.length.toLocaleString('en-US')} pictures and GIFs reloaded` : (set.artShow === 'original' ? 'No original covers found' : set.artShow === 'custom' ? 'No pictures or GIFs of yours found' : 'No pictures or GIFs found'), note: `${tracks.length.toLocaleString('en-US')} songs checked${picsMissing() ? ' · a few are still loading and will appear shortly' : ''}` });
  } catch (e) {
    scanView.artFinish({ title: 'Rescan art stopped', count: failMsg(e) });
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
    set.tabs = cleanTabs(set.tabs); set.tabOrder = cleanTabOrder(set.tabOrder); set.home = cleanHome(set.home); set.anim = (set.anim && typeof set.anim === 'object' && !Array.isArray(set.anim)) ? set.anim : {};   // BUG-431: clean the values applySettings() reads, so a bad imported value cannot throw halfway
    if (!Number.isFinite(+set.tabPct)) set.tabPct = 100; set.tabPct = Math.min(TAB_MAX, Math.max(TAB_MIN, Math.round(+set.tabPct)));
    set.npCover = +set.npCover > 0 ? Math.min(NPC_MAX, Math.max(NPC_MIN, Math.round(+set.npCover))) : 0;
    set.npImmersive = set.npImmersive === true; set.npTapOrig = set.npTapOrig !== false;
    set.lyAnim = cleanLya(set.lyAnim); set.bgDim = cleanDim(set.bgDim); set.bgFit = cleanFit(set.bgFit);
    if (!['classic', 'cover'].includes(set.lyricStyle)) set.lyricStyle = DEF.lyricStyle;
    set.artShow = SHOW_OPTS.includes(set.artShow) ? set.artShow : 'all'; set.scanShow = SHOW_OPTS.includes(set.scanShow) ? set.scanShow : 'all';   /* v309 */ delete set.lyricMix; set.lyricBlur = set.lyricStyle === 'cover' && set.lyricBlur === true; set.lyricPal = set.lyricStyle === 'cover' && !set.lyricBlur; set.lyricBg = set.lyricStyle === 'cover' && !set.lyricBlur && ['home', 'pic'].includes(set.lyricBg) ? set.lyricBg : ''; if (set.lyricBg) set.lyricPal = false; set.lyricInk = ['white', 'black'].includes(set.lyricInk) ? set.lyricInk : 'auto';   /* v278: lyrics text colour (auto = the style's own: red on classic, white on the others) */ /* v277 + v285: styles = classic, palette, blur, Home screen background (style 'cover' + lyricBg 'home') */   // 3 styles: classic, Cover colour palette, Cover blur. A saved plain 'cover' or the removed Cover colour mix becomes the palette
    set.timeStyle = cleanTimeStyle(set.timeStyle);
    set.barSplit = cleanBarSplit(set.barSplit);
    set.lyWordSpeed = Math.max(50, Math.min(200, Math.round(+set.lyWordSpeed) || 100));   // v299
    set.gearHide = cleanGearHide(set.gearHide); gearArm();   // v304
    if (!['Small', 'Medium', 'Large'].includes(set.lyricSize)) set.lyricSize = DEF.lyricSize; set.lyricPx = cleanLyPx(set.lyricPx, set.lyricSize);
    if (useExtras) for (const [k, v] of Object.entries(setPending.extras)) { try { localStorage.setItem(k, v); } catch {} }
    if (useExtras) { try { soCache = new Set(Object.keys(soMap())); } catch {} }   // v296: 'keep original cover' choices take effect at once
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
  renderNP(); refreshHome(); { const h = document.querySelector('#lyr .lyh-fav'), c = Native.current(); if (h && c) { h.classList.toggle('on', isFav(favs, c.id)); h.setAttribute('aria-pressed', String(isFav(favs, c.id))); } }   // v307
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
    case 'lyh-fav': { const c = Native.current(); if (c) favToggle(c.id); break; }   // v307; v308: favToggle itself lights #lyr .lyh-fav (the button `b` is not in scope here)
    case 'lyh-more': { const c = Native.current(); if (c) trackMenuSheet(c); break; }   // v307: the song menu that already exists (play next, add to playlist, album, artist ...)
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
  try { const st = Native.state; lyPrefetchList((st.queue || []).slice(st.index + 3)); } catch {}   // v293c: a jump from Up Next is prepared too
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
  /* v300 (owner: "tapping a line far away, the lyrics jump over each other"): a long jump (more than about half the screen) no longer slides every line
     across thousands of pixels (the staggered lines flew over each other). The lines come in from a short distance and fade in, as one block. */
  if (Math.abs(moved) > 150) {   // far (more than about 3 lines, e.g. a tapped line): every line is put in place at once and the WHOLE block glides in a short way and fades in (one piece: nothing can cross)
    lyStop(); body.style.setProperty('--lyj', (Math.sign(moved) * 28) + 'px'); body.classList.remove('lyjump'); void body.offsetWidth; body.classList.add('lyjump');
    clearTimeout(body._lj); body._lj = setTimeout(() => body.classList.remove('lyjump'), 480); return;
  }
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
function coverTint(a, t, onEarly) {   // v293: onEarly(c) = the song's main colours as soon as the pixels are read (the palette follows from the Web Worker)
  const S = tintSource(a, t), ck = S.ck, key = S.key;
  if (covTint.has(key)) return Promise.resolve(covTint.get(key));
  if (covTintPend.has(key)) { const pp = covTintPend.get(key); if (onEarly) { if (pp.early) { try { onEarly(pp.early); } catch {} } else (pp.ear || (pp.ear = [])).push(onEarly); } return pp; }
  const gs = String(a.g0 || a.g), vr = gs.match(/var\((--[\w-]+)\)/), hx = (gs.match(/#[0-9a-f]{6}/gi) || [vr && getComputedStyle(document.documentElement).getPropertyValue(vr[1]).trim().match(/^#[0-9a-f]{6}$/i)?.[0] || '#c8102e'])[0], n = parseInt(hx.slice(1), 16), fh = rgb2hsl(n >> 16, (n >> 8) & 255, n & 255), fb = palFrom(fh[0], fh[1], fh[1] < .12, fh[2]);
  const pr = new Promise(res => {
    const done = (c, pl, g) => { c.ck = ck; if (!c.pal) c.pal = pl || []; if (g && pl && c.pal === pl && !c.palGrad) c.palGrad = g;  let same = true; try { const N = tintSource(a, t); same = N.key === key && N.src === S.src; } catch {} if (same) covTint.set(key, c); covTintPend.delete(key); res(c); };   // the picture / Canvas changed while this was being read: it answers its caller but is not kept
    S.stale = () => { try { const N = tintSource(a, t); return N.key !== key || N.src !== S.src; } catch { return false; } };   // v230: a long GIF / video read stops when the song or picture has changed
    tintPixels(S).then(async d => { let p = null, pl = null, g = ''; if (d) { try { p = tintFromPixels(d); } catch {} if (p) { pr.early = p; for (const f of pr.ear || []) { try { f(p); } catch {} } pr.ear = null; } try { const r = await palAsync(d); pl = r.pal; g = r.grad; } catch {} } done(p || fb, pl, g); }, () => done(fb));   // v290: the palette is worked out in a Web Worker (palAsync): the app no longer freezes while it is read
  });
  if (onEarly) pr.ear = [onEarly];
  covTintPend.set(key, pr); return pr;
}
/* v290 (owner: "tapping lyrics freezes the app / lyrics don't even open with Cover colour palette on"): tintPaletteAuto + tintPaletteGrad took 1-4 s of
   main-thread time on a long GIF (16 s on a slow phone), so nothing on screen could move. They now run in a Web Worker (src/palworker.js, same code from
   src/palcore.js, same result). If a worker cannot start or fails, the old main-thread call is used (after a short pause so the screen can draw first). */
let palW = null, palWBad = false, palN = 0; const palWait = new Map();
const palMain = async d => { await new Promise(r => setTimeout(r, 60)); let pal = null, grad = ''; try { pal = tintPaletteAuto(d); } catch {} try { if (pal && pal.length) grad = tintPaletteGrad(pal); } catch {} return { pal, grad }; };
function palWorker() {
  if (palW || palWBad || typeof Worker === 'undefined') return palW;
  try {
    palW = new Worker(new URL('./palworker.js', import.meta.url), { type: 'module' });
    palW.onmessage = e => { const m = e.data || {}, r = palWait.get(m.id); if (r) { palWait.delete(m.id); r(m); } };
    palW.onerror = () => { palWBad = true; try { palW.terminate(); } catch {} palW = null; for (const [id, r] of palWait) { palWait.delete(id); r(null); } };   // every waiting read falls back to the main thread
  } catch { palWBad = true; palW = null; }
  return palW;
}
function palAsync(d) {
  const w = palWorker(); if (!w) return palMain(d);
  const id = ++palN;
  return new Promise(res => {
    const to = setTimeout(() => { if (palWait.delete(id)) palMain(d).then(res); }, 45000);   // a worker that never answers: do it here instead
    palWait.set(id, m => { clearTimeout(to); if (!m || (m.err && !m.pal)) palMain(d).then(res); else res({ pal: m.pal, grad: m.grad || '' }); });
    try { w.postMessage({ id, px: d, hi: d.hi || null, fw: d.fw || null }); } catch { palWait.delete(id); clearTimeout(to); palMain(d).then(res); }
  });
}
/* v290: the cover colour palette maths (the old "v223+: COVER COLOUR MIX" block) now lives in src/palcore.js; it runs in a Web Worker (src/palworker.js), see palAsync below. */
async function coverPal(t) { return coverTint(trackAlbum(t), t); }   // the cover's own colours (the per-song "Lyrics colour" picker was removed)
function setTintVars(el, p, k) { if (!el || !p) return; el.style.setProperty(k, p.a); el.style.setProperty(k + '2', p.b); el.style.setProperty(k + '3', p.c); }
function clearTintVars(el, k) { if (!el) return; for (const n of [k, k + '2', k + '3']) el.style.removeProperty(n); }
function lyStyleSheet() {
  $('#sheet').innerHTML = sheetHtml(`<b>Background style</b><p>Changes the lyrics page. (Now Playing takes the cover colour only with Immersive album cover.)</p>${Object.entries(LYSTYLE).map(([v, t]) => `<button class="row" data-act="lystyleset" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === lyStyleKey() ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
}
/* v289 (owner: "what if we can customize this too in the app"): Settings > Animation > Landscape mini player: how the mini player splits out of / merges into the glass bar in landscape. */
const GEAR_OPTS = [0, 6, 10, 30, 60];   // v316: 6 s is the shortest
const gearRows = () => { const g = cleanGearHide(set.gearHide);
  return `<b>Settings button (top right)<em data-gearv style="display:block;font-style:normal;font-size:.9rem;font-weight:600;color:var(--accent);margin-top:2px">${g ? 'Hides after ' + fmtHide(g) : 'Always shown'}</em></b><span>Let the Settings button fade away after a while. It is back every time you open the app. The Settings icon in the glass bar stays.</span>
    <div class="hsseg gearseg">${GEAR_OPTS.map(v => `<button class="chip ${g === v ? 'sel' : ''}" data-act="gearhide" data-v="${v}">${v ? fmtHide(v) : 'Never'}</button>`).join('')}</div>
    ${g ? `<input type="range" data-gearh min="0" max="${GEAR_STEPS.length - 1}" step="1" value="${hideStepOf(g, GEAR_STEPS)}" aria-label="Hide the Settings button after" aria-valuetext="${fmtHide(g)}" style="width:100%;margin-top:10px;accent-color:var(--accent)">` : ''}`; };
const bsplitRows = () => { const c = cleanBarSplit(set.barSplit), noW = c.style === 'off' || c.style === 'jelly';
  return `<button class="setrow" data-act="bsplit" style="width:100%;text-align:left"><span class="tx"><b>Split and merge</b><span>${SPLIT_NAMES[c.style]}</span></span>${I.chev}</button>
    ${c.style === 'off' ? '' : `<div class="animrow"><b>Speed<em data-bsv="speed">${c.speed}%</em></b><input type="range" data-bsk="speed" min="50" max="200" step="5" value="${c.speed}" aria-label="Split and merge speed"></div>`}
    ${noW ? '' : `<div class="animrow"><b>Stretch<em data-bsv="stretch">${c.stretch}%</em></b><input type="range" data-bsk="stretch" min="50" max="200" step="5" value="${c.stretch}" aria-label="How far the water neck stretches before it snaps"></div>`}
    <div class="setrow"><div class="tx" style="flex:1;min-width:0"><b>Hide after<em data-bsv="hide" style="float:right;font-style:normal;color:var(--accent)">${fmtHide(c.hide)}</em></b><span>Landscape: no touch on the mini player for this long and it merges back into the glass bar. Swipe up on the bar (or a new song, play or pause) brings it back.</span><div class="hsseg">${HIDE_OPTS.map(v => `<button class="chip ${c.hide === v ? 'sel' : ''}" data-act="bshide" data-v="${v}">${fmtHide(v)}</button>`).join('')}</div></div></div>
    ${c.hide ? `<div class="animrow"><b>Custom time<em data-bsv="hide2">${fmtHide(c.hide)}</em></b><input type="range" data-bsh="1" min="0" max="${HIDE_STEPS.length - 1}" step="1" value="${hideStepOf(c.hide)}" aria-label="Hide the landscape mini player after" aria-valuetext="${fmtHide(c.hide)}"></div>` : ''}
    <div class="setrow"><span class="tx"><span>Turn the phone sideways with a song playing to see it. Reduce Motion turns the animation off.</span></span></div>`; };
function bsplitSheet() {
  const c = cleanBarSplit(set.barSplit);
  $('#sheet').innerHTML = sheetHtml(`<b>Split and merge</b><p>Landscape: how the mini player leaves and rejoins the glass bar.</p>${Object.entries(SPLIT_NAMES).map(([v, t]) => `<button class="row" data-act="bsplitset" data-v="${v}"><span class="lbl" style="font-size:1.0625rem">${t}</span>${v === c.style ? '<span class="cnt" style="color:var(--accent)">✓</span>' : ''}</button>`).join('')}<div class="actions"><button data-act="sheet-close">Close</button></div>`);
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
/* v293 (owner: "switching song, the previous song's palette / blur stays 0.4-0.8 s, make it almost no time"): the still frame of a GIF / animated WebP is picked
   ONCE per picture and remembered (lyStillMem: address -> still data URL, '' = not animated). The next and previous songs are picked ahead (lyPrefetch), so the
   blur layer of the new song can be drawn already frozen, in the same frame as the song change. */
const lyStillMem = new Map(), lyStillRun = new Map();
function lyStillFromSrc(src) {   // -> data URL of the best frame, '' (not animated), or null (cannot tell here: no ImageDecoder) ; never throws
  if (!src) return Promise.resolve(null); if (lyStillMem.has(src)) return Promise.resolve(lyStillMem.get(src)); if (lyStillRun.has(src)) return lyStillRun.get(src);
  const pr = (async () => {
    try {
      const buf = await (await fetch(src)).arrayBuffer(), u = new Uint8Array(buf, 0, Math.min(buf.byteLength, 64)), gif = u[0] === 71 && u[1] === 73 && u[2] === 70;
      const anim = gif || (u[8] === 87 && u[9] === 69 && u[10] === 66 && u[11] === 80 && String.fromCharCode(...u).includes('ANIM'));
      if (!anim) { lyStillMem.set(src, ''); return ''; }
      if (!window.ImageDecoder) return null;
      const d = new ImageDecoder({ data: buf, type: gif ? 'image/gif' : 'image/webp' }); await d.tracks.ready; const n = d.tracks.selectedTrack.frameCount || 1, k = Math.min(24, n);
      let best = 0, bs = -1e9; for (const i of new Set(Array.from({ length: k }, (_, j) => Math.floor(j * n / k)))) { const f = (await d.decode({ frameIndex: i })).image; const sc = window.lyScore(f); f.close(); if (sc > bs) { bs = sc; best = i; } }
      const fr = (await d.decode({ frameIndex: best })).image, url = lyStill(fr, fr.displayWidth, fr.displayHeight); fr.close(); d.close();
      if (lyStillMem.size > 40) lyStillMem.delete(lyStillMem.keys().next().value); lyStillMem.set(src, url); return url;
    } catch { return null; } finally { lyStillRun.delete(src); }
  })();
  lyStillRun.set(src, pr); return pr;
}
async function lyPickStill(img) {
  const par = img.parentElement; let anim = par.classList.contains('lb-anim'), buf = null, gif = false;
  try { const m = await lyStillFromSrc(par.dataset.src || img.currentSrc || img.src); if (m) { par.classList.add('lb-anim'); return m; } if (m === '') return ''; } catch {}   // v293: the remembered / shared pick
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
/* v293c (owner: "do all 3"): Cover blur + Canvas video: the best moment (same 8-moment pick as lyFreezeV) is found AHEAD for the next / previous songs on a
   hidden video and kept as a still picture (lyStillMem, by video address), so the blur layer of the new song is drawn already frozen in the same frame. */
const lyVidRun = new Map();
function lyVidStillFromSrc(src) {
  if (!src) return Promise.resolve(null); if (lyStillMem.has(src)) return Promise.resolve(lyStillMem.get(src)); if (lyVidRun.has(src)) return lyVidRun.get(src);
  const pr = (async () => { const v = document.createElement('video'); try {
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = /^(blob:|data:)/.test(src) ? null : 'anonymous'; v.src = src;
    await new Promise((r, j) => { v.addEventListener('loadeddata', r, { once: true }); v.addEventListener('error', j, { once: true }); setTimeout(j, 15000); });
    const d = v.duration; if (!isFinite(d) || d <= 0) return null; let best = 0, bs = -1e9;
    for (let i = 0; i < 8; i++) { const t = d * (i + .5) / 8; await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = t; setTimeout(r, 3000); }); await new Promise(r => requestAnimationFrame(r)); const sc = window.lyScore(v);   /* exactly as lyFreezeV: wait one frame after the seek */ if (sc > bs) { bs = sc; best = t; } }
    await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = best; setTimeout(r, 3000); });
    const url = lyStill(v, v.videoWidth, v.videoHeight); if (lyStillMem.size > 40) lyStillMem.delete(lyStillMem.keys().next().value); lyStillMem.set(src, url); return url;
  } catch { return null; } finally { try { v.removeAttribute('src'); v.load(); } catch {} lyVidRun.delete(src); } })();
  lyVidRun.set(src, pr); return pr;
}
window.lyFreezeV = async v => {   // Canvas video: stops (no autoplay / loop), 8 moments are looked at, it rests on the best one; both layers rest on the same moment
  v.pause(); const par = v.parentElement; try {
    par._vt = par._vt || (async () => { const d = v.duration; if (!isFinite(d) || d <= 0) return 0; let best = 0, bs = -1e9;
      for (let i = 0; i < 8; i++) { const t = d * (i + .5) / 8; await new Promise(r => { v.addEventListener('seeked', r, { once: true }); v.currentTime = t; setTimeout(r, 3000); }); await new Promise(r => requestAnimationFrame(r)); const s = window.lyScore(v); if (s > bs) { bs = s; best = t; } } return best; })();
    const t = await par._vt; v.currentTime = t; v.pause();
  } catch {}
};
/* v285 (owner): the custom-picture lyrics style was removed; an old install's saved picture is deleted once. */
try { indexedDB.deleteDatabase('lf-lyrbg'); } catch {}
function lyBgSrc(t) {   // what the Home / Custom style shows behind the lyrics: the song's Canvas when it has one showing, else the custom picture (Custom style), else nothing (Home: the CSS paints the Home background or black)
  if (set.lyricStyle !== 'cover' || set.lyricBlur === true || !set.lyricBg) return null;
  try { const S = t && t.id ? tintSource(trackAlbum(t), t) : null; if (S && S.media && S.src) return { src: S.src, vid: !!S.vid, cv: true }; } catch {}
  if (set.lyricBg === 'pic') { try { const S = t && t.id ? tintSource(trackAlbum(t), t) : null; if (S && S.src) return { src: S.src, vid: false, cv: false }; } catch {} }   // v286 (owner): Song picture = the picture / GIF set for the song, else the album's, else the cover (the same order as everywhere), shown as it is
  return null;   // v285: Home style: the CSS paints the Home background or black
}
function lyBgHtml(t) {
  const s = lyBgSrc(t); if (!s) return ''; const e = E(s.src);
  return `<div class="lyr-bgl${s.cv ? ' lb-cv' : ''}" data-src="${e}" aria-hidden="true">${s.vid ? `<video src="${e}" autoplay loop muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto"></video>` : `<img src="${e}" alt="" decoding="async">`}</div>`;
}
/* v293c: Home / Song picture + Canvas video: the next / previous song's Canvas is loaded ahead on a hidden <video>; when that song comes, that very
   element (already showing its first frame) is moved into the lyrics layer, so the video is there in the same frame. */
const lyVidPre = new Map();
function lyVidPreload(src) {
  if (!src || lyVidPre.has(src)) return; try {
    const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', ''); v.src = src; v.load();
    if (lyVidPre.size > 4) { const k = lyVidPre.keys().next().value, o = lyVidPre.get(k); lyVidPre.delete(k); if (o && !o.isConnected) { try { o.removeAttribute('src'); o.load(); } catch {} } }
    lyVidPre.set(src, v);
  } catch {}
}
function lyBgAdopt(el) {   // swap the freshly written Canvas <video> for the one loaded ahead (same address), and play it
  const L = el && el.querySelector('.lyr-bgl'); const nv = L && L.querySelector('video'); if (!nv) return;
  const pv = lyVidPre.get(L.dataset.src || ''); if (!pv || pv === nv || pv.readyState < 2) return;
  pv.autoplay = true; nv.replaceWith(pv); lyVidPre.delete(L.dataset.src); try { pv.play().catch(() => {}); } catch {}
}
function lyBgSync(el, t) {   // adds, swaps or removes the Home / Custom picture layer so it always matches the style, the Canvas and the picture
  const cur = el.querySelector('.lyr-bgl'), s = lyBgSrc(t);
  if (!s) { if (cur) cur.remove(); return; } if (cur && cur.dataset.src === s.src) return;
  if (cur) cur.remove(); el.insertAdjacentHTML('afterbegin', lyBgHtml(t)); lyBgAdopt(el);
}
function lyBlurHtml(t) {
  if (set.lyricStyle !== 'cover' || set.lyricBlur !== true) return '';
  const s = lyBlurSrc(t); if (!s) return '<div class="lyr-blur" aria-hidden="true"></div>';
  const anim = s.vid || /\.(gif|webp|apng)(\?|#|$)/i.test(s.src), e = E(s.src);
  const vid = c => `<video${c} src="${e}" muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto" onloadeddata="lyFreezeV(this)"></video>`;   // no autoplay / loop: it stops, on its best moment
  const st = lyStillMem.get(s.src);   // v293: picked ahead (GIF, or v293c Canvas video): drawn frozen at once (no animated flash, no wait)
  if (st) return `<div class="lyr-blur lb-anim" data-src="${e}" aria-hidden="true"><img src="${st}" alt="" decoding="sync" data-fz="1"><img class="lb-d" src="${st}" alt="" decoding="sync" data-fz="1"></div>`;
  const img = c => `<img${c} src="${e}" alt="" decoding="async"${anim || /^blob:/i.test(s.src) ? ' onload="lyFreeze(this)"' : ''}>`;   // a picture you set can arrive as blob: (no .gif ending), so it is checked by its first bytes in lyFreeze
  return `<div class="lyr-blur${anim ? ' lb-anim' : ''}" data-src="${e}" aria-hidden="true">${s.vid ? vid('') + vid(' class="lb-d"') : img('') + img(' class="lb-d"')}</div>`;   // v208+: a second, lighter-blurred copy (.lb-d) sits on top of the heavy one so the cover's shapes / small details show
}
function lyBlurSync(el, t) {   // adds, swaps or removes the blur layer so it always matches the style and the picture
  const cur = el.querySelector('.lyr-blur');
  if (set.lyricStyle !== 'cover' || set.lyricBlur !== true) { if (cur) cur.remove(); return; }
  const s = lyBlurSrc(t); if (cur && (cur.dataset.src || '') === (s ? s.src : '')) return;
  if (cur) cur.remove(); el.insertAdjacentHTML('afterbegin', lyBlurHtml(t));
}
const lyBlank = el => { el.style.removeProperty('--lyr-pal'); for (const n of ['--lyr-bg', '--lyr-bg2', '--lyr-bg3']) el.style.setProperty(n, '#000'); for (const n of ['--ap1', '--ap2', '--ap3', '--ap4']) el.style.removeProperty(n); };   // v293: between songs (new colours not read yet): plain black, never the old song's colours and never the default red
/* v294 (owner): Apple gradient: Apple Music's lyrics background: a few big, very soft blobs of the picture's main colours, slowly drifting. Colours = the 4
   biggest colours of the same palette read (picture / GIF you set > original cover), brought to a mid lightness so white lyrics stay readable. */
const lyApOn = () => set.lyricStyle === 'cover' && set.lyricApple === true && set.lyricBlur !== true && !set.lyricBg;
const lyApHtml = () => lyApOn() ? '<div class="lyr-apl" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' : '';
function lyApSync(el) { const cur = el.querySelector('.lyr-apl'); if (!lyApOn()) { if (cur) cur.remove(); return; } if (!cur) el.insertAdjacentHTML('afterbegin', lyApHtml()); }
const labHex = (L, a, b) => { const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
  const g = x => { x = Math.max(0, Math.min(1, x)); return Math.round(255 * (x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055)); };
  return '#' + [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s].map(g).map(v => v.toString(16).padStart(2, '0')).join(''); };
function lyApColours(c) {   // -> 4 hex colours, biggest first
  const P = (c.pal || []).filter(q => q && Number.isFinite(q.L)).slice().sort((x, y) => (y.share || 0) - (x.share || 0)), out = [];
  for (const q of P) { if (out.length >= 4) break; const C = Math.hypot(q.a, q.b), k = C > .02 ? Math.min(1.25, .2 / C + 1) : 1; const L = Math.max(.38, Math.min(.7, q.L)); out.push(labHex(L, q.a * k, q.b * k)); }
  const base = [c.a, c.b, c.c].filter(Boolean); while (out.length < 4 && base.length) out.push(base[out.length % base.length]);
  return out.length ? out : ['#3a3a44', '#26262e', '#4a4a56', '#1c1c22'];
}
function lyPaint(el, c) {   // the cover colours of one song onto the lyrics page (--lyr-bg*, and --lyr-pal for Cover colour palette)
  setTintVars(el, c, '--lyr-bg');
  if (lyApOn()) { lyApColours(c).forEach((h, i) => el.style.setProperty('--ap' + (i + 1), h)); } let q = '';
  if (set.lyricBlur !== true && set.lyricPal === true) { try { q = c.palGrad || (c.palGrad = tintPaletteGrad(c.pal && c.pal.length ? c.pal : tintPaletteFlat(c.a))); } catch {} }   // v236: --lyr-pal = the palette gradient
  if (q) el.style.setProperty('--lyr-pal', q); else el.style.removeProperty('--lyr-pal');
}
/* v293: the colours already worked out for this song's picture (song change / reopen: no wait at all), or null. */
function coverTintNow(t) { try { const S = tintSource(trackAlbum(t), t); return covTint.get(S.key) || null; } catch { return null; } }
async function lyApplyTint(t) {
  const el = $('#lyr'); if (!el) return; const my = ++lyTintSeq;
  lyBlurSync(el, t); lyBgSync(el, t); lyApSync(el);
  if (set.lyricStyle === 'cover' && set.lyricBlur !== true && set.lyricBg) { el.style.removeProperty('--lyr-pal'); return; }   // v277: Home / Custom style: no cover colours to read
  if (set.lyricStyle !== 'cover') { clearTintVars(el, '--lyr-bg'); el.style.removeProperty('--lyr-pal'); return; }
  const now = coverTintNow(t); if (now) { lyPaint(el, now); return; }   // v293: ready: painted in this same frame
  if (el.dataset.lyTid !== String(t.id)) lyBlank(el);   // v293: never keep the PREVIOUS song's colours while the new ones are read
  const c = await coverTint(trackAlbum(t), t, p => { if (my === lyTintSeq && $('#lyr') && Native.current()?.id === t.id && !$('#lyr').style.getPropertyValue('--lyr-pal')) setTintVars($('#lyr'), p, '--lyr-bg'); });   // v293: the song's main colour first (a fraction of a second), the full palette right after
  if (my === lyTintSeq && $('#lyr') && Native.current()?.id === t.id) lyPaint($('#lyr'), c);
}
/* v293: the next and the previous song (play order) are read ahead a moment after a song starts, for Cover colour palette and Cover blur: their colours
   (Web Worker, cached) and their GIF still frame. So Next / Previous shows the new song's background in the same frame. */
let lyPreT2 = 0;
/* v293c (owner: "do all 3"): what is read ahead: the CURRENT song first (so lyrics opened after a jump are ready too), then the next two and the previous one
   (play order; Repeat All wraps). Opening Up Next also prepares the first songs listed there (a jump from that list). */
function lyNear(extra = 0) {
  const st = Native.state, q = st.queue || [], i = st.index; if (!q.length || i < 0) return [];
  const at = k => q[k] || (st.repeat === 'all' && q.length ? q[((k % q.length) + q.length) % q.length] : null);
  const out = [q[i], at(i + 1), at(i + 2), q[i - 1]]; for (let k = 3; k < 3 + extra; k++) out.push(at(i + k));
  return [...new Set(out.filter(Boolean))];
}
function lyPrepOne(n) {   // one song, for the lyrics style in use: colours (+ GIF / Canvas still for Cover blur), or its picture / Canvas (Song picture, Home)
  if (!n || set.lyricStyle !== 'cover') return;
  if (set.lyricBg && set.lyricBlur !== true) { const b = lyBgSrc(n); if (!b) return; if (b.vid) { lyVidPreload(b.src); return; } if (lyPicMem.has(b.src)) return;
    try { const im = new Image(); im.decoding = 'async'; im.src = b.src; if (im.decode) im.decode().catch(() => {}); if (lyPicMem.size > 12) lyPicMem.delete(lyPicMem.keys().next().value); lyPicMem.set(b.src, im); } catch {} return; }
  try { coverTint(trackAlbum(n), n).catch(() => {}); } catch {}
  if (set.lyricBlur === true) { const b = lyBlurSrc(n); if (b) (b.vid ? lyVidStillFromSrc : lyStillFromSrc)(b.src); }
}
let lyPreQ = 0;
function lyPrefetchList(list) { clearTimeout(lyPreQ); if (set.lyricStyle !== 'cover') return; lyPreQ = setTimeout(() => list.slice(0, 6).forEach((n, k) => setTimeout(() => lyPrepOne(n), k * 400)), 600); }   // Up Next: the songs you can jump to from there
const lyPicMem = new Map();   // v293b: Song picture style: the next / previous song's own picture, loaded and decoded ahead (kept referenced so it stays ready)
function lyPrefetch() {   // v293 / v293b / v293c: after a song starts (and when the lyrics open): see lyNear / lyPrepOne. Home style without a Canvas has nothing to prepare.
  clearTimeout(lyPreT2); if (set.lyricStyle !== 'cover') return;
  lyPreT2 = setTimeout(() => lyNear().forEach((n, k) => setTimeout(() => lyPrepOne(n), k * 300)), 250);
}
/* v307 (owner): Apple Music style lyrics header: the cover, song and artist, a heart (Favourites) and ⋯ (the song menu), over every lyrics background.
   Settings > Lyrics: "Apple style header" on / off (off = the old back arrow + title) and "Header cover": your picture / GIF or the original cover. */
const lyHeadArt = t => set.lyHeadArt === 'original' ? trackAlbum(t).g : gOfT(t);
function lyTopHtml(t) {
  const who = t.trackArtist || trackAlbum(t).artist;
  if (set.lyHead === false) return `<div class="lyr-top"><button class="gbtn" data-act="lyr-close">${I.back}</button><div class="lyr-t"><b>${t.title}</b><span>${who}</span></div><span style="width:44px"></span></div>`;
  return `<div class="lyr-top lyh"><button class="lyh-art" data-act="lyr-close" aria-label="Close lyrics"><span class="cover blk" style="--g:${lyHeadArt(t)}"></span></button><div class="lyr-t lyh-t"><b>${t.title}</b><span>${who}</span></div><button class="lyh-btn lyh-fav ${isFav(favs, t.id) ? 'on' : ''}" data-act="lyh-fav" aria-label="Favourite" aria-pressed="${isFav(favs, t.id)}">${I.heart}</button><button class="lyh-btn" data-act="lyh-more" aria-label="More options">${I.more || '⋯'}</button></div>`;
}
async function lyricsLoad() {
  const my = ++lyrSeq, t = Native.current(), el = $('#lyr'); if (!t || !el) return;
  lyr = null; lyrIdx = -1; lyrTid = t.id; lyLast = { v: 0, pl: false }; lyStop(); lyFollow(true); const lyReady = set.lyricStyle === 'cover' && !(set.lyricBg && set.lyricBlur !== true) && coverTintNow(t);
  if (lyReady) lyPaint(el, lyReady); else requestAnimationFrame(() => requestAnimationFrame(() => { if (my === lyrSeq) lyApplyTint(t); }));   // v290: the lyrics screen opens and draws FIRST, then the background is read; v293: colours already known = painted now, same frame
  if (!lyReady && el.dataset.lyTid !== String(t.id) && set.lyricStyle === 'cover' && !(set.lyricBg && set.lyricBlur !== true)) lyBlank(el);   // v293: the previous song's colours never stay
  el.dataset.lyTid = t.id; lyPrefetch();
    el.innerHTML = `${lyApHtml()}${lyBlurHtml(t)}${lyBgHtml(t)}${lyTopHtml(t)}<div class="lyr-body" id="lyrbody"><div class="empty">Loading lyrics…</div></div><button class="lyr-now" data-act="lyr-follow" aria-label="Follow the song">${I.lyrics}<span>Now</span></button>`; lyBgAdopt(el);   // v293c: a Canvas loaded ahead is used as it is
  let text = '';
  let lyFail = false;
  try { text = (await Native.getLyrics(t)).text || ''; } catch (e) { lyFail = true; try { console.warn('lyrics read failed', e); } catch {} }   // BUG-15
  if (my !== lyrSeq) return;
  lyr = parseLrc(text); if (lyr.synced && set.lyWordFade !== false) lyr = { ...lyr, lines: fillWords(lyr.lines, set.lyWordSpeed) };   // v298: line-timed lyrics get word timings, so the Apple word fade-in works for every synced song
  const body = $('#lyrbody'); if (!body) return;
  if (!lyr.lines.length) { body.innerHTML = lyFail ? '<div class="empty">Could not read the lyrics for this song.</div>' : '<div class="empty">No lyrics for this song.</div>'; return; }
  body.innerHTML = lyr.lines.map((l, i) => {
    const inner = l.words ? l.words.map(w => `<span class="w">${E(w.w)}</span>`).join('') : E(l.text);
    return l.t != null && lyr.synced ? `<p class="ln tap" role="button" tabindex="0" data-li="${i}" data-act="lyr-seek">${inner}</p>` : `<p class="ln" data-li="${i}">${inner}</p>`;
  }).join('');
  syncLyrics(lyNow()); lyStart();
}
let lwT = 0;   // v299: re-read the lyrics shortly after the fade-in speed changes
let lyWords = null, lyWd = -1, lyWp = null;   // v286: lyWp = the last --wp written per word of the playing line
function syncLyrics(pos) {
  if (!lyr || !lyr.synced || !$('#lyrbody')) return;
  const i = currentIndex(lyr.lines, pos);
  if (i !== lyrIdx) {
    const body = $('#lyrbody'), ls = body.children;
    lyrIdx = i; lyWords = null; lyWd = -1; lyWp = null;
    for (let k = 0; k < ls.length; k++) { const n = ls[k]; n.classList.toggle('cur', k === i); n.style.setProperty('--d', Math.min(5, Math.abs(k - i))); }   // --d = distance from the playing line (more distance = softer)
    const el = ls[i];
    if (el) { if (!lyBrowsing()) lyCenter(el, lyrIdx >= 1); }   // the user is scrolling to pick a line: only the highlight moves
  }
  const line = lyr.lines[lyrIdx];
  if (line && line.words) {
    if (!lyWords) lyWords = document.querySelectorAll(`#lyrbody [data-li="${lyrIdx}"] .w`);
    let c = 0; while (c < line.words.length && pos >= line.words[c].t) c++;
    if (c !== lyWd) { lyWd = c; lyWords.forEach((n, k) => n.classList.toggle('wd', k < c)); }
    if (set.lyWordFade !== false) {   // v286: word fade-in: each word's --wp (0..1) = how far its own time has run; lyNow never steps back, so a word never un-fades (no blink)
      const nx = lyr.lines[lyrIdx + 1], lineEnd = nx && nx.t != null ? nx.t : line.words[line.words.length - 1].t + 1;
      if (!lyWp || lyWp.length !== line.words.length) lyWp = line.words.map(() => -1);
      line.words.forEach((w, k) => { const end = Math.min(k + 1 < line.words.length ? line.words[k + 1].t : lineEnd, w.t + 1.2), dur = Math.max(.12, end - w.t), v = Math.max(0, Math.min(1, (pos - w.t) / dur)), q = Math.round(v * 100) / 100; if (q !== lyWp[k] && lyWords[k]) { lyWp[k] = q; lyWords[k].style.setProperty('--wp', q); } });
    }
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
    /* v224: tapping a line is a real seek: lyLast is reset so the hold does not keep the old, later time */ case 'lyr-seek': { const l = lyr && lyr.lines[+d.li]; if (l && l.t != null) { lyFollow(true); lyClock = { pos: l.t, at: performance.now(), pl: !!Native.state.playing }; lyLast = { v: l.t, pl: false }; Native.seek(l.t); const le = document.querySelector(`#lyrbody [data-li="${+d.li}"]`), bd = $('#lyrbody'); if (le && bd) { bd.classList.add('lysnap'); lyStop(); lyCenter(le, false); syncLyrics(l.t); requestAnimationFrame(() => requestAnimationFrame(() => bd.classList.remove('lysnap'))); } } break; }   // v301 (owner): a tapped line is shown AT ONCE: no slide, no fade, no press wobble
    default: return false;
  }
  return true;
}
on('onProgress', e => { if ($('#lyr')?.classList.contains('open') && !lyRaf) syncLyrics(e.pos); });
on('onSeek', ({ pos }) => { const p = +pos || 0; lyClock = { pos: p, at: performance.now(), pl: !!Native.state.playing }; lyLast = { v: p, pl: false }; });   // v280: a real seek (scrub bar, notification, headset) is never held back by the no-step-back clock
on('onTrackChanged', () => { if ($('#lyr')?.classList.contains('open') && Native.current()?.id !== lyrTid) lyricsLoad(); });
/* v290: with Cover colour palette / Cover blur on, the new song's colours are read a moment after it starts (in the Web Worker, cached), so tapping Lyrics shows them at once. */
on('onTrackChanged', () => { lyPrefetch(); });   // v293: this song + the next and previous ones (colours + GIF still), see lyPrefetch

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
  const cx = p.l * w, cy = p.t * h, pw = (p.r - p.l) * w, ph = (p.b - p.t) * h, k = Math.min(W / pw, H / ph), st = v.style;   /* v317 (owner: never crop): the whole picture fits (contain); baked-in black bars are still trimmed by the clip below */
  st.right = st.bottom = 'auto'; st.maxWidth = 'none'; st.objectFit = 'fill';
  st.width = (w * k).toFixed(2) + 'px'; st.height = (h * k).toFixed(2) + 'px';
  st.left = (W / 2 - (cx + pw / 2) * k).toFixed(2) + 'px'; st.top = (H / 2 - (cy + ph / 2) * k).toFixed(2) + 'px';
  st.clipPath = `inset(${(p.t * 100).toFixed(2)}% ${((1 - p.r) * 100).toFixed(2)}% ${((1 - p.b) * 100).toFixed(2)}% ${(p.l * 100).toFixed(2)}%)`;   // v317
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
  row.classList.add('dragging'); if (kind !== 'q') $('#app').classList.add('dragmode'); raf = requestAnimationFrame(tick);   // A5: bars fade out so the row is never under them
  const mv = ev => { if (ev.pointerId !== dragPid) return; y = ev.clientY; update(); };
  const up = ev => {
    if (ev.pointerId !== dragPid) return;   // BUG-096: a second finger lifting does not drop the row
    removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); cancelAnimationFrame(raf);
    const ok = ev.type === 'pointerup' && to !== from;
    row.classList.remove('dragging'); $('#app').classList.remove('dragmode'); row.style.transform = ''; mark(); dragBusy = false;
    if (kind === 'hq' || kind === 'hs' || kind === 'hc') {   // v303 (owner): Home quick buttons / sections / custom section items: drag and drop instead of arrows
      if (ok) { const dir = to > from ? 1 : -1; let h = set.home;
        if (kind === 'hq') { const k = h.qb[from]; for (let n = 0; n < Math.abs(to - from); n++) h = moveQuick(h, k, dir); }
        else if (kind === 'hs') { const k = h.order[from]; for (let n = 0; n < Math.abs(to - from); n++) h = moveSection(h, k, dir); }
        else { const pid = row.dataset.p, pn = (h.pins || []).find(x => x.id === pid), it = pn && pn.items[from]; if (it) for (let n = 0; n < Math.abs(to - from); n++) h = moveCustomItem(h, pid, it.t, it.v, dir); }
        set.home = h; applySettings(); renderSub(true); renderMain(); try { navigator.vibrate && navigator.vibrate(8); } catch {} }
      return;
    }
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
    case 'settings': if (TABS.some(t => t[0] === 'settings')) { openSettingsPage(); barLast = null; barSync(); } else push('settings'); break;   // v287: with a Settings icon in the bar, the gear opens the Settings PAGE (icon lit); without it, the usual screen on top
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
    case 'tabtg': { const r = toggleTab(set.tabs, d.k); if (!r.ok) { toast('Keep at least one of Home, Albums, Library or Search'); break; } set.tabs = r.tabs; applySettings(); applyTabs(); if (document.querySelector('.nvbar')) { renderSub(true); break; } b.classList.toggle('on', !!set.tabs[d.k]); b.setAttribute('aria-checked', set.tabs[d.k] ? 'true' : 'false'); break; }   // v224: Settings > Tab bar
    case 'tg': { const dflt = d.k === 'lyHead' || d.k === 'lyWordFade' || d.k === 'albumInfo' || d.k === 'smartArtists' || d.k === 'npTapOrig' || d.k === 'coverDouble'; set[d.k] = dflt ? set[d.k] === false : !set[d.k]; applySettings(); if (d.k === 'npImmersive') npApplyTint(Native.current()); b.classList.toggle('on', dflt ? set[d.k] !== false : !!set[d.k]); if (d.k === 'smartArtists') { stack = stack.filter(s => s.t !== 'artist' || artistInfo(s.id).count > 0); stack.forEach(s => { if (s.t === 'artist') s.id = unesc(artistName(E(s.id)) || E(s.id)); }); repaintAll(); toast(set.smartArtists !== false ? 'Smart artist grouping on' : 'Smart artist grouping off'); } break; }
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
    case 'lyheadart': set.lyHeadArt = b.dataset.v === 'original' ? 'original' : 'custom'; applySettings(); renderSub(true); break;   // v307; v308: moved into the Settings click switch (it sat in the song-menu switch, which only runs for song menu buttons, so the chip did nothing)
    case 'artshow': case 'scanshow': { const k = d.act === 'artshow' ? 'artShow' : 'scanShow'; set[k] = SHOW_OPTS.includes(d.v) ? d.v : 'all'; applySettings(); renderSub(true); break; }   // v309
    case 'gearhide': set.gearHide = cleanGearHide(+b.dataset.v); applySettings(); gearGone = false; gearArm(); { const el = document.querySelector('#gearrow .tx'); if (el) el.innerHTML = gearRows(); } break;   // v304
    case 'bsplit': bsplitSheet(); break;
    case 'bshide': set.barSplit = cleanBarSplit({ ...set.barSplit, hide: +b.dataset.v }); applySettings(); { const el = document.getElementById('bsplit'); if (el) el.innerHTML = bsplitRows(); } miniIdleArm(); break;   // v291
    case 'bsplitset': set.barSplit = cleanBarSplit({ ...set.barSplit, style: b.dataset.v }); applySettings(); closeSheet(); { const el = document.getElementById('bsplit'); if (el) el.innerHTML = bsplitRows(); } break;   // v289
    case 'timestyle': timeStyleSheet(); break;
    case 'timestyleset': set.timeStyle = cleanTimeStyle(b.dataset.v); applySettings(); closeSheet(); { const sp = document.querySelector('[data-act="timestyle"] .tx span'); if (sp) sp.textContent = TIME_STYLES[set.timeStyle]; } { const el = $('#tl'), er = $('#tr'), t = Native.current(); if (el && er) { const z = timeTexts(0, 0, set.timeStyle); el.textContent = z.tl; er.textContent = z.tr; scr.tl = scr.tr = ''; scr.sec = -1; if (t) paintScrub(scrubPos(), t.dur); } } break;
    case 'lystyleset': set.lyricStyle = b.dataset.v === 'classic' ? 'classic' : 'cover'; set.lyricBlur = b.dataset.v === 'blur'; set.lyricPal = b.dataset.v === 'palette'; set.lyricApple = b.dataset.v === 'apple'; set.lyricBg = ['home', 'pic'].includes(b.dataset.v) ? b.dataset.v : ''; applySettings(); closeSheet(); { const sp = document.querySelector('[data-act="lyricstyle"] .tx span'); if (sp) sp.textContent = LYSTYLE[lyStyleKey()]; } lyApplyTint(Native.current() || {}); npApplyTint(Native.current()); break;
    case 'nameedit': nameEdit = true; renderSub(true); nameFocus(); break;
    case 'name-save': nameSave(); break;
    case 'name-cancel': nameEdit = false; renderSub(true); break;
    case 'name-rm': set.userName = ''; nameEdit = false; applySettings(); refreshGreet(); renderSub(true); toast('Name removed'); break;
    case 'npreset': setNpCover(0, true); break;
    case 'navcustom': push('navcustom'); break;
    case 'setsub': push(d.sub); break;   // v296: Widgets / Phone info pages   // v295
    case 'navreset': set.tabs = { ...DEF_TABS }; set.tabOrder = DEF_ORDER.slice(); applySettings(); applyTabs(); renderSub(true); toast('Glass bar reset'); break;   // v295
    case 'tabmv': { const r = moveTab(set.tabOrder, d.k, +d.dir); if (!r.ok) break; set.tabOrder = r.order; applySettings(); applyTabs(); renderSub(true); break; }   // v284: icon order
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
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.bgdim !== undefined) { set.bgDim = cleanDim(e.target.value); applySettings(true); const v = document.querySelector('[data-bgdimv]'); if (v) v.textContent = set.bgDim + '%'; } else if (e.target.dataset && e.target.dataset.nprange !== undefined) setNpCover(+e.target.value); else if (e.target.dataset && e.target.dataset.tabpct !== undefined) setTabPct(+e.target.value); else if (e.target.id === 'hscq') { homeCQ = e.target.value; const top = stack[stack.length - 1], pn = top && set.home.pins.find(x => x.id === top.id && x.type === 'custom'), box = $('#hscres'); if (pn && box) box.innerHTML = custResults(pn); } else if (e.target.dataset && e.target.dataset.lypx !== undefined) { set.lyricPx = cleanLyPx(e.target.value, 'Medium'); applySettings(true); const v = document.querySelector('[data-lypxv]'); if (v) v.textContent = lyName(set.lyricPx); } else if (e.target.dataset && e.target.dataset.lyk) { set.lyAnim[e.target.dataset.lyk] = +e.target.value; set.lyAnim = cleanLya(set.lyAnim); applySettings(true); const em = document.querySelector(`[data-lyv="${e.target.dataset.lyk}"]`); if (em) em.textContent = Math.round(+e.target.value) + '%'; } else if (e.target.dataset && e.target.dataset.gearh != null) { const sec = GEAR_STEPS[+e.target.value] || 10; set.gearHide = cleanGearHide(sec); applySettings(true); gearGone = false; gearArm(); e.target.setAttribute('aria-valuetext', fmtHide(sec)); const em = document.querySelector('[data-gearv]'); if (em) em.textContent = 'Hides after ' + fmtHide(set.gearHide); document.querySelectorAll('#gearrow [data-act="gearhide"]').forEach(c => c.classList.toggle('sel', +c.dataset.v === set.gearHide)); }   /* v304 */ else if (e.target.dataset && e.target.dataset.lwspeed != null) { set.lyWordSpeed = Math.max(50, Math.min(200, Math.round(+e.target.value / 5) * 5 || 100)); applySettings(true); const em = document.querySelector('[data-lwsv]'); if (em) em.textContent = set.lyWordSpeed + '%'; document.querySelectorAll('.lyprevbody .ln').forEach(l => { l.innerHTML = lyPrevWords(l.textContent); }); { const c = $('.lyprevbody .ln.cur'); if (c) lyPrevSweep(c); }   /* v312: the preview follows the Fade-in speed slider at once */ clearTimeout(lwT); lwT = setTimeout(() => { if ($('#lyr.open')) lyricsLoad(); }, 350); }   /* v299: word fade-in speed */ else if (e.target.dataset && e.target.dataset.bsh) { const sec = HIDE_STEPS[+e.target.value] || 8; set.barSplit = cleanBarSplit({ ...set.barSplit, hide: sec }); applySettings(true); e.target.setAttribute('aria-valuetext', fmtHide(sec)); document.querySelectorAll('[data-bsv="hide"], [data-bsv="hide2"]').forEach(em => { em.textContent = fmtHide(sec); }); document.querySelectorAll('#bsplit [data-act="bshide"]').forEach(ch => ch.classList.toggle('sel', +ch.dataset.v === sec)); miniIdleArm(); }   /* v292: custom time slider */ else if (e.target.dataset && e.target.dataset.bsk) { set.barSplit = cleanBarSplit({ ...set.barSplit, [e.target.dataset.bsk]: +e.target.value }); applySettings(true); const em = document.querySelector(`[data-bsv="${e.target.dataset.bsk}"]`); if (em) em.textContent = set.barSplit[e.target.dataset.bsk] + '%'; } else if (e.target.dataset && e.target.dataset.ak) { set.anim[e.target.dataset.ak] = +e.target.value; applySettings(true); const em = document.querySelector(`[data-av="${e.target.dataset.ak}"]`); if (em) em.textContent = Math.round(+e.target.value) + '%'; } else if (e.target.id === 'q') { query = e.target.value; results(); clearTimeout(window.__rq); window.__rq = setTimeout(() => { if (query.trim().length >= 2) { set.recent = addRecent(set.recent, query); applySettings(); } }, 1500); } else if (e.target.id === 'pq') { pickN = 60; pickList(); } });

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
const barIdx = () => { const top = stack[stack.length - 1], si = TABS.findIndex(t => t[0] === 'settings'); return top && top.t === 'settings' && si >= 0 ? si : tabIdx(); };   // v284 (owner: "in Settings the Home icon is red, not the Settings icon"): with the Settings screen open and a Settings icon in the bar, that icon is the lit one
let barLast = null;
function barSync() { if (!bar) return; const i = barIdx(); if (i === barLast) return; barLast = i; try { bar.set(i, true); } catch {} }
const onBarPick = i => {
  const k = TABS[i] && TABS[i][0]; if (!k) return;
  if (k === 'settings') { openSettingsPage(); barLast = null; barSync(); return; }   // v287: its own page
  tab = k; stack = []; renderSub(); renderMain();
};
function buildBar() {
  const old = $('#tabs'), nav = old.cloneNode(false);   // a fresh <nav>: the old glide keeps its listeners on the old element
  if (bar) { try { bar.destroy(); } catch {} }
  nav.innerHTML = tabsHtml(); old.replaceWith(nav);
  bar = glide(nav, { selector: '.tab', initial: Math.max(0, barIdx()), onChange: onBarPick }); barLast = barIdx();
  if (barIdx() < 0) bar.set(-1, false);   // a page that has no icon in the bar (opened from a widget): no icon is lit
}
/** Settings > Tab bar changed (or an import): rebuild the bar; if the page on screen lost its icon, show the first icon's page. */
/* v295 (owner): Customize navigation drag: hold an icon (350 ms) -> it lifts (bigger, glowing glass), slide left / right -> the others slide aside,
   let go -> it drops there and the order is saved (set.tabOrder, exported). Arrow keys move a focused icon too. */
{ let nv = null;
  const end = save => { if (!nv) return; const { el, bar, items, from, to } = nv; clearTimeout(nv.t); nv = null;
    bar.classList.remove('nvdrag'); items.forEach(x => { x.style.transform = ''; x.classList.remove('lift'); });
    if (save && to !== from) { set.tabOrder = reorderShown(set.tabOrder, set.tabs, from, to); applySettings(); applyTabs(); renderSub(true); try { navigator.vibrate && navigator.vibrate(8); } catch {} } };
  document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.nvbar .nvi'); if (!el || e.button > 0) return;
    const bar = el.parentElement, items = [...bar.querySelectorAll('.nvi')], r0 = items[0].getBoundingClientRect(), slotW = items.length > 1 ? items[1].getBoundingClientRect().left - r0.left : r0.width;
    nv = { el, bar, items, from: +el.dataset.i, to: +el.dataset.i, x0: e.clientX, y0: e.clientY, left: r0.left, slotW, on: false, id: e.pointerId };
    nv.t = setTimeout(() => { if (!nv) return; nv.on = true; el.classList.add('lift'); bar.classList.add('nvdrag'); try { el.setPointerCapture(nv.id); } catch {} try { navigator.vibrate && navigator.vibrate(12); } catch {} }, 350); }, true);
  document.addEventListener('pointermove', e => { if (!nv) return; const dx = e.clientX - nv.x0;
    if (!nv.on) { if (Math.hypot(dx, e.clientY - nv.y0) > 10) end(false); return; }
    e.preventDefault(); const { el, items, from, slotW, left } = nv, n = items.length;
    const to = dropSlot(left + from * slotW + slotW / 2 + dx - left, slotW, n); nv.to = to;
    const v = Math.max(-1, Math.min(1, (e.clientX - (nv.lx ?? e.clientX)) / 14)); nv.lx = e.clientX; nv.sq = (nv.sq || 0) * .6 + Math.abs(v) * .4;   // v297: liquid stretch with speed
    el.style.transform = `translate(${dx}px,-12px) scale(${(1.14 + nv.sq * .12).toFixed(3)},${(1.14 - nv.sq * .08).toFixed(3)})`;
    items.forEach((x, i) => { if (x === el) return; let sh = 0; if (from < to && i > from && i <= to) sh = -slotW; if (from > to && i < from && i >= to) sh = slotW; x.style.transform = sh ? `translateX(${sh}px)` : ''; }); }, { passive: false, capture: true });
  document.addEventListener('pointerup', () => end(true), true); document.addEventListener('pointercancel', () => end(false), true);
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.nvbar')) e.preventDefault(); }, true);
  document.addEventListener('keydown', e => { const el = e.target.closest && e.target.closest('.nvbar .nvi'); if (!el || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const n = el.parentElement.querySelectorAll('.nvi').length, i = +el.dataset.i, j = i + (e.key === 'ArrowLeft' ? -1 : 1); if (j < 0 || j >= n) return; e.preventDefault();
    set.tabOrder = reorderShown(set.tabOrder, set.tabs, i, j); applySettings(); applyTabs(); renderSub(true); const nb = document.querySelector(`.nvbar .nvi[data-i="${j}"]`); if (nb) nb.focus(); }); }
function applyTabs() {
  TABS = visibleTabs(set.tabs, set.tabOrder);
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
if (!Native.isNative) window.__lf = { Native, libCovers, refreshItems, trackIds: () => tracks.map(t => t.id), scanDemo: us => { scanView.start({ instant: true, minMs: 2600, covers: us || libCovers() }); setTimeout(() => scanView.finish({ tracks }), 300); }, picDemo: (k, n, u) => { if (k === 'artist') { const m = apicMap(); m[n] = 'gif:' + n; localStorage.setItem('lf.apics', JSON.stringify(m)); agUrls[n] = u; } else if (k === 'genre') gpUrls[n] = u; else if (k === 'profile') pfSetUrl(u); else if (k === 'album') alpUrls.set(n, u); else if (k === 'bg') { document.documentElement.style.setProperty('--bgimg', `url("${u}")`); document.documentElement.dataset.bg = '1'; } else if (k === 'playlist') { if (!playlists.length) playlists.push({ id: newPid(), name: 'Road trip', ids: tracks.slice(0, 6).map(t => t.id) }); const id = 'demo-' + Date.now(); playlists[0].pics = [{ id, name: 'Demo' }]; ppUrl.set(id, u); return playlists[0].id; } }, demoNames: () => ({ album: albums[0] && albums[0].id, album2: albums[1] && albums[1].id, artist: albums[0] && albums[0].artist, genre: (albums.find(a => a.genre) || {}).genre }), flyDemo: async us => { scanView.startArt('Reloading pictures and GIFs', ''); await artFly(us.map(u => ({ u, n: 'Song pictures' }))); scanView.artFinish({}); }, artDemo: async () => { const it = refreshItems(); scanView.startArt('Reloading pictures and GIFs', ''); await artFly(it); scanView.artFinish({}); }, renderMini, queueSheet, miniHide, miniShow, hideSteps: HIDE_STEPS, palMainOnly: () => { palWBad = true; }, palWorkerOn: () => !!palW, demoPlay: () => Native.play(albumTracks('a5'), 0), demoStop: async () => { await Native.pause(); Native.state.index = -1; renderMini(); }, banDemo: src => { banPic = { src, stamp: 'demo' }; banShow(); }, bgAllowDemo, notifSheet, updSheet, updPicSet: src => { updPic = { ...updPic, src, stamp: 'demo' }; if (updSheetOpen()) updSheet(); }, go: k => { const i = TABS.findIndex(t => t[0] === k); bar.set(i); tab = k; stack = []; renderSub(); renderMain(); }, push, openNP: () => $('#np').classList.add('open'), setQuery: q => { query = q; const i = $('#q'); if (i) i.value = q; results(); }, lyTest: {   // v275: browser checks of the lyrics backgrounds (Cover colour palette / Cover blur) for every picture source: album cover, the song's own (embedded) picture, a picture / GIF you set for the album or the song, a Canvas video / GIF
    style: v => { set.lyricStyle = v === 'classic' ? 'classic' : 'cover'; set.lyricBlur = v === 'blur'; set.lyricPal = v === 'palette'; set.lyricApple = v === 'apple'; set.lyricBg = ['home', 'pic'].includes(v) ? v : ''; applySettings(); lyApplyTint(Native.current() || {}); },
    ink: v => { set.lyricInk = v; applySettings(); }, homeBg: u => { if (u) bgSetUrl(u); else bgSetMedia(null); },   // v277
    albumCover: u => { const t = Native.current(); if (t) { trackAlbum(t).cover = u || undefined; covTint.clear(); } },   // the cover read from the music file (embedded / album art)
    albumPic: (id, u) => { if (u) alpUrls.set(id, u); else alpUrls.delete(id); covTint.clear(); },
    songPic: (id, u) => { if (u) spUrls.set(id, u); else spUrls.delete(id); covTint.clear(); },
    canvas: (t, u) => { const p = '/demo/canvas/' + t.id + (/\.(mp4|webm)(\?|$)/i.test(u) ? '.mp4' : '.gif'); if (u) { canvasMap['t:' + t.id] = p; cvWeb.set(p, u); canvasOn = true; } else { delete canvasMap['t:' + t.id]; canvasOn = false; } covTint.clear(); },
    pal: () => [...covTint.values()].map(c => (c.pal || []).map(q => ({ L: +q.L.toFixed(3), C: +Math.hypot(q.a, q.b).toFixed(3), share: +(q.share || 0).toFixed(4), solid: q.solid == null ? null : +q.solid.toFixed(2), flags: Object.keys(q).filter(k => q[k] === true).join(',') }))),
    ready: id => { const t = (Native.state.queue || []).find(x => x.id === id); return !!(t && coverTintNow(t)); },   // v293: are this song's colours read ahead?
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
