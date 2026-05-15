(function () {
  'use strict';
  globalThis.__ryuThemeRuntimePatch = 'emote-prewarm-shortmass-complete-sprite-2026-05-03';

  // capture ws so we can derive room id later
  const _origWS = window.WebSocket;

  const _SERVER_MAX = { '01': 16, '02': 16, '03': 128, '04': 64, '05': 16, '06': 16 };

  window.WebSocket = function (...args) {
    try {
      const rawUrl = String(args[0] || '');
      if (rawUrl.includes('ryuten.io/server') && window._ryuNextServerUrl) {
        args[0] = window._ryuNextServerUrl;
        window._ryuNextServerUrl = null;
      }
    } catch(e) {}
    const ws = new _origWS(...args);
    try {
      const url = String(args[0] || '');
      if (url.includes('ryuten.io')) {
        window._ryuWS = ws;
        const m = url.match(/server-(\d+)/);
        if (m) window._ryuSplitMax = _SERVER_MAX[m[1]] || 0;
      }
    } catch(e) {}
    return ws;
  };
  window.WebSocket.prototype = _origWS.prototype;

  // Auto-spectate a player by game name after joining their server.
  // Called from the Users Online join button in interface.js.
  globalThis.__ryuStartAutoSpec = function(gameName) {
    if (!gameName) return;
    window._ryuAutoSpecTarget = gameName;
    var attempts = 0;
    var maxAttempts = 30; // 15s at 500ms
    var timer = setInterval(function() {
      try {
        var target = window._ryuAutoSpecTarget;
        if (!target) { clearInterval(timer); return; }
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(timer);
          window._ryuAutoSpecTarget = null;
          return;
        }
        var ne = globalThis.__ryuNe;
        var me = globalThis.__ryuMe;
        if (!ne || !me || !ne._2430) return;
        for (var cell of ne._2430.values()) {
          var name = cell._2182 && cell._2182._1059 && cell._2182._1059._6988;
          if (name === target) {
            me._7857(cell._2182._1059._9782);
            clearInterval(timer);
            window._ryuAutoSpecTarget = null;
            return;
          }
        }
      } catch(e) {}
    }, 500);
  };

  // theme storage helpers
  const STORAGE_KEY = 'ryuTheme';
  let _themeCache = null;
  let _themeRawCache = null;
  function loadTheme() {
    if (_themeCache !== null) return _themeCache;
    try {
      _themeRawCache = localStorage.getItem(STORAGE_KEY);
      _themeCache = JSON.parse(_themeRawCache) || {};
    } catch {
      _themeRawCache = null;
      _themeCache = {};
    }
    return _themeCache;
  }
  function invalidateThemeCache() { _themeCache = null; _themeRawCache = null; }
  function saveTheme(t) {
    _themeCache = t;
    _themeRawCache = JSON.stringify(t);
    localStorage.setItem(STORAGE_KEY, _themeRawCache);
    syncFastThemeState(true);
    if (globalThis.__ryuRefreshMassSettings) globalThis.__ryuRefreshMassSettings(true);
  }
  globalThis.__ryuAgarMapDebugEnabled = !!globalThis.__ryuAgarMapDebugEnabled;

  function isRyuUiBlockingActive() {
    var csm = document.getElementById('custom-skin-menu');
    if (csm && csm.classList && csm.classList.contains('ryu-csm-active')) return true;
    if (document.querySelector('.ryu-csm-active')) return true;
    if (document.getElementById('ryu-settings-panel')) return true;
    if (document.getElementById('ryu-rename-modal')) return true;
    if (document.getElementById('ryu-shop-injected')) return true;
    if (document.getElementById('ryu-inv-injected')) return true;
    if (document.getElementById('ryu-gal-injected')) return true;
    if (document.getElementById('ryu-clip-editor')) return true;
    return false;
  }
  globalThis.__ryuUiBlockingActive = isRyuUiBlockingActive;

  function isMainMenuVisible() {
    var mm = document.getElementById('main-menu');
    if (!mm) return false;
    var cs = null;
    try { cs = getComputedStyle(mm); } catch (_) {}
    if (mm.style.display === 'none' || (cs && cs.display === 'none')) return false;
    if (mm.style.visibility === 'hidden' || (cs && cs.visibility === 'hidden')) return false;
    if (mm.style.opacity === '0' || (cs && cs.opacity === '0')) return false;
    return true;
  }

  function isRyuMenuOverlayVisible() {
    var menuUi = document.getElementById('ryu-menu-ui');
    if (menuUi && menuUi.classList && menuUi.classList.contains('ryu-menu-visible')) {
      var menuUiCs = null;
      try { menuUiCs = getComputedStyle(menuUi); } catch (_) {}
      if ((!menuUiCs || menuUiCs.display !== 'none') && (!menuUiCs || menuUiCs.opacity !== '0')) return true;
    }

    var menuBackdrop = document.getElementById('ryu-menu-backdrop');
    if (menuBackdrop && menuBackdrop.classList && menuBackdrop.classList.contains('ryu-menu-visible')) {
      var bdCs = null;
      try { bdCs = getComputedStyle(menuBackdrop); } catch (_) {}
      if ((!bdCs || bdCs.display !== 'none') && (!bdCs || bdCs.opacity !== '0')) return true;
    }

    return false;
  }

  // fast-path flags, refreshed every 250ms to avoid per-frame storage reads
  let _ft_useDefault  = false;
  let _ft_fontIndex   = 0;
  let _ft_massFont    = 0;
  let _ft_boldName    = false;
  let _ft_hideFlags   = false;
  let _ft_syncMass    = false;
  let _ft_shortMass   = false;
  let _ft_strokeOn    = false;
  let _ft_strokeColor = '#000000';
  let _ft_leftwardTag = true;
  let _ft_nameFill    = '#ffffff';
  let _ft_massFill    = '#ff69b4';
  let _ft_nameStrokeOn    = true;
  let _ft_massStrokeOn    = true;
  let _ft_nameStroke      = '#000000';
  let _ft_nameStrokeWidth = 4;
  let _ft_massStroke      = '#000000';
  let _ft_shortMassStroke = '#000000';
  let _ft_fontSig     = '';
  let _ft_hotkeyDisconnect = '';
  let _ft_hotkeyHideFlags = '';
  let _ft_hotkeyDangerOverlay = '';
  let _ft_hotkeyTeammateIndicator = '';
  let _ft_hotkeyMinimalMode = '';
  let _ft_hotkeyMuteMic = '';
  let _ft_hotkeyCelebrate = '';
  let _ft_hotkeyFastSpawn = '';
  let _ft_hotkeyInfernoMacro = '';
  let _ft_hotkeyTargetedFeed = '';
  let _ft_hotkeyFavoriteEmote = '';
  let _ft_favoriteEmoteCode = '';
  let _ft_pelletStyle = 0;
  let _ft_pelletEmojiOn = false;
  let _ft_pelletImgurOn = false;
  let _ft_pelletEmoji = '';
  let _ft_pelletImgur = '';
  let _ft_splitCounterOn = false;
  let _ft_dangerIndicatorOn = false;
  let _ft_teammateIndicatorOn = true;
  let _ft_dangerShowGreen = true;
  let _ft_dangerShowBlue = true;
  let _ft_dangerShowYellow = true;
  let _ft_dangerShowRed = true;
  let _ft_pelletColorOn = false;
  let _ft_rainbowPelletOn = false;
  let _ft_pelletColor = '#ff69b4';
  let _ft_pelletRgb = { r: 255, g: 105, b: 180 };
  let _ft_minimalModeOn = false;
  let _ft_agarMapDark = false;
  let _ft_mmHideLB = true;
  let _ft_mmHideChat = true;
  let _ft_mmHideMinimap = true;
  let _ft_mmHideEnemyNames = false;
  let _ft_mmHideOwnName = false;
  let _ft_sectorOverlayOn = false;
  let _ft_teamCellColorsOn = false;
  let _ft_teamCellColor = '#ff69b4';
  let _ft_teamCellRgb = { r: 255, g: 105, b: 180 };
  // Cached results of the per-frame-expensive DOM/CSS UI-blocking checks.
  // Refreshed every 250ms by syncFastThemeState — never called per-frame.
  let _ft_uiBlocking = false;
  let _ft_menuOverlay = false;

  function _parseHexRgb(hex) {
    let v = parseInt(String(hex || '#ff69b4').replace('#', ''), 16);
    if (!Number.isFinite(v)) v = 0xff69b4;
    return {
      r: (v >> 16) & 255,
      g: (v >> 8) & 255,
      b: v & 255
    };
  }

  // ── CoD-style kill feed ──────────────────────────────────────────────────
  const _KF_MAX = 6;
  const _KF_TTL = 5000;
  let _kfEl = null;
  const _kfAvatarMap = {};
  globalThis.__ryuKfAvatarMap = _kfAvatarMap;

  function _ryuKillFeedReposition() {
    const panel = document.getElementById('ryu-team-panel');
    if (panel) {
      const rect = panel.getBoundingClientRect();
      if (rect.bottom > 0) {
        const desiredTop = rect.bottom + 28;
        const maxTop = Math.max(24, window.innerHeight - 220);
        _kfEl.style.top = Math.min(desiredTop, maxTop) + 'px';
        _kfEl.style.left = '18px';
        _kfEl.style.right = '';
        _kfEl.style.bottom = '';
        return true;
      }
    }
    return false;
  }

  let _kfRepositionTimer = null;
  function _ryuKillFeedVisible() {
    return !!(
      globalThis.__ryuKillFeedOn &&
      !isRyuUiBlockingActive() &&
      !isRyuMenuOverlayVisible()
    );
  }
  function _ryuKillFeedApply() {
    if (!_kfEl) return;
    // Re-anchor to body if detached — game DOM operations can silently remove the element,
    // causing the feed to stop appearing even though rows are still being added to it.
    if (document.body && !document.body.contains(_kfEl)) {
      document.body.appendChild(_kfEl);
    }
    _kfEl.style.display = _ryuKillFeedVisible() ? 'flex' : 'none';
    if (_kfEl.style.display === 'none') return;
    if (!_ryuKillFeedReposition() && !_kfRepositionTimer) {
      _kfRepositionTimer = setInterval(function() {
        if (_ryuKillFeedReposition()) {
          clearInterval(_kfRepositionTimer);
          _kfRepositionTimer = null;
        }
      }, 500);
    }
  }
  setInterval(_ryuKillFeedApply, 200);

  function _kfAvatarEl(username) {
    const box = document.createElement('div');
    box.className = 'ryu-kf-av';
    const ownName = globalThis.__ryuGetUsername ? globalThis.__ryuGetUsername() : null;
    const pic = (username && ownName && username === ownName && globalThis.__ryuKfProfilePic)
      ? globalThis.__ryuKfProfilePic
      : (username && _kfAvatarMap[username]) || null;
    if (pic) {
      const img = document.createElement('img');
      img.src = pic;
      box.appendChild(img);
    } else {
      box.textContent = '?';
    }
    return box;
  }

  function _kfNameGroup(name, tag, side) {
    const wrap = document.createElement('span');
    wrap.className = 'ryu-kf-namegroup';
    if (tag) {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'ryu-kf-tag';
      tagSpan.textContent = '[' + tag + ']';
      wrap.appendChild(tagSpan);
    }
    const nameSpan = document.createElement('span');
    nameSpan.className = side === 'killer' ? 'ryu-kf-killer' : 'ryu-kf-victim';
    nameSpan.textContent = name || '?';
    wrap.appendChild(nameSpan);
    return wrap;
  }

  function _kfShowRow(killer, victim, isKill, killerTag, victimTag) {
    if (!_kfEl) return;
    const row = document.createElement('div');
    row.className = 'ryu-kf-row' + (isKill ? ' ryu-kf-row-kill' : '');
    const verb = document.createElement('span');
    verb.className = 'ryu-kf-verb';
    verb.textContent = isKill ? 'destroyed' : 'took some from';
    row.appendChild(_kfAvatarEl(killer));
    row.appendChild(_kfNameGroup(killer, killerTag, 'killer'));
    row.appendChild(verb);
    row.appendChild(_kfAvatarEl(victim));
    row.appendChild(_kfNameGroup(victim, victimTag, 'victim'));
    _kfEl.appendChild(row);
    if (_kfEl.children.length > _KF_MAX) _kfEl.removeChild(_kfEl.children[0]);
    setTimeout(function() {
      row.style.opacity = '0';
      setTimeout(function() { row.parentNode && row.parentNode.removeChild(row); }, 500);
    }, _KF_TTL);
  }

  function _ryuKillFeedInit() {
    if (_kfEl) return;
    const style = document.createElement('style');
    style.textContent = `
#ryu-kf{position:fixed;top:300px;left:18px;display:none;flex-direction:column;align-items:flex-start;gap:4px;z-index:9990;pointer-events:none;}
.ryu-kf-row{display:flex;align-items:center;gap:7px;background:rgba(10,10,10,0.88);padding:5px 14px 5px 8px;border-left:2px solid #333;border-radius:1px;font-family:'Geogrotesque Cyr','Titillium Web',sans-serif;font-size:15px;font-weight:600;letter-spacing:.3px;animation:ryu-kf-in .18s ease-out;transition:opacity .5s ease;}
.ryu-kf-row-kill{border-left-color:#666;}
.ryu-kf-namegroup{display:flex;align-items:center;gap:4px;}
.ryu-kf-tag{color:#bbb;font-size:12px;font-weight:600;}
.ryu-kf-killer{color:#fff;}
.ryu-kf-verb{color:#c0392b;font-size:13px;font-weight:700;letter-spacing:.5px;}
.ryu-kf-victim{color:#fff;}
.ryu-kf-av{width:24px;height:24px;border-radius:3px;background:#1c1c1c;border:1px solid #3a3a3a;display:flex;align-items:center;justify-content:center;font-size:10px;color:#555;overflow:hidden;flex-shrink:0;}
.ryu-kf-av img{width:100%;height:100%;object-fit:cover;}
@keyframes ryu-kf-in{from{transform:translateX(-30px);opacity:0;}to{transform:translateX(0);opacity:1;}}`;
    (document.head || document.documentElement).appendChild(style);
    _kfEl = document.createElement('div');
    _kfEl.id = 'ryu-kf';
    document.body.appendChild(_kfEl);
    _ryuKillFeedApply();

    globalThis.__ryuKillFeedHook = function(killer, victim, pctLoss, killerTag, victimTag) {
      // Only gate on the feature flag — NOT on transient UI state (menu open, panel open).
      // _ryuKillFeedApply already hides the container via display:none when UI is blocking,
      // so kills that fire during a brief menu flicker are still recorded and become visible
      // the moment the container is shown again, instead of being silently dropped forever.
      if (!globalThis.__ryuKillFeedOn) return;
      if (pctLoss < 65) return;
      _kfShowRow(killer, victim, true, killerTag, victimTag);
    };
  }
  // ─────────────────────────────────────────────────────────────────────────

  function _updateNameTint() {
    if (globalThis.__ryuNameTintLocked) return;
    const t = loadTheme();
    const hex = t.useDefault ? '#ffffff' : (t.color || '#ff69b4');
    const val = parseInt(hex.replace('#', ''), 16);
    globalThis.__ryuNameTint = val === 0 ? 0x010101 : val;
  }
  // OPT 3: only refresh fast theme flags when the stored theme actually changes,
  // instead of forcing a localStorage reparse every 250ms during gameplay.
  function syncFastThemeState(force) {
  if (!force) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === _themeRawCache && _themeCache !== null) return;
      _themeRawCache = raw;
      _themeCache = raw ? (JSON.parse(raw) || {}) : {};
    } catch {
      _themeRawCache = null;
      _themeCache = {};
    }
  }
  _updateNameTint();
  const t = loadTheme();
  _ft_useDefault  = !!t.useDefault;

  globalThis.__ryuHideNativeTag = !!t.leftwardTag;

  _ft_fontIndex   = t.fontIndex || 0;
  _ft_massFont    = t.massFont !== undefined ? t.massFont : _ft_fontIndex;
  _ft_boldName    = !!t.boldName;
  _ft_hideFlags   = !!t.hideFlags;
  _ft_syncMass    = !!t.syncMass;
  _ft_shortMass   = !!t.shortMass;
  _ft_strokeOn    = !!t.strokeOn;
  _ft_strokeColor = t.strokeColor || '#000000';
  _ft_leftwardTag = t.leftwardTag !== false;
  _ft_nameFill    = '#ffffff';
  _ft_massFill    = _ft_syncMass ? (t.color || '#ff69b4') : (t.massColor || '#ff69b4');
  _ft_nameStrokeOn    = t.nameStrokeOn !== false;
  _ft_massStrokeOn    = t.massStrokeOn !== false;
  _ft_nameStroke      = _ft_nameStrokeOn ? (t.nameStroke      || '#000000') : '';
  _ft_nameStrokeWidth = Math.min(Math.max(parseFloat(t.nameStrokeWidth || 4), 1), 10);
  _ft_massStroke      = _ft_massStrokeOn ? (t.massStroke      || '#000000') : '';
  _ft_shortMassStroke = t.shortMassStrokeOn === false ? '' : (t.shortMassStroke || '#000000');
  _ft_fontSig     = [
    _ft_fontIndex,
    _ft_massFont,
    _ft_boldName ? 1 : 0
  ].join('|');
  _ft_hotkeyDisconnect = t.hotkeyDisconnect || '';
  _ft_hotkeyHideFlags = t.hotkeyHideFlags || '';
  _ft_hotkeyDangerOverlay = t.hotkeyDangerOverlay || '';
  _ft_hotkeyTeammateIndicator = t.hotkeyTeammateIndicator || '';
  _ft_hotkeyMinimalMode = t.hotkeyMinimalMode || '';
  _ft_hotkeyMuteMic = t.hotkeyMuteMic || '';
  _ft_hotkeyCelebrate = t.hotkeyCelebrate || '';
  _ft_hotkeyFastSpawn = t.hotkeyFastSpawn || '';
  _ft_hotkeyInfernoMacro = t.hotkeyInfernoMacro || '';
  _ft_hotkeyTargetedFeed = t.hotkeyTargetedFeed || '';
  _ft_hotkeyFavoriteEmote = t.hotkeyFavoriteEmote || '';
  _ft_favoriteEmoteCode = t.favoriteEmoteCode || '';
  _ft_pelletEmojiOn = !!t.pelletEmojiOn;
  _ft_pelletImgurOn = !!t.pelletImgurOn;
  _ft_pelletStyle = t.useDefault ? 0 : (_ft_pelletImgurOn ? 2 : (_ft_pelletEmojiOn ? 1 : 0));
  _ft_pelletEmoji = t.pelletEmoji != null ? t.pelletEmoji : '';
  _ft_pelletImgur = t.pelletImgur || '';
  _ft_splitCounterOn = !t.useDefault && !!t.splitCounterOn;
  _ft_dangerIndicatorOn = !t.useDefault && !!t.dangerIndicatorOn;
  _ft_teammateIndicatorOn = t.useDefault ? false : t.teammateIndicatorOn !== false;
  _ft_dangerShowGreen = t.dangerShowGreen !== false;
  _ft_dangerShowBlue = t.dangerShowBlue !== false;
  _ft_dangerShowYellow = t.dangerShowYellow !== false;
  _ft_dangerShowRed = t.dangerShowRed !== false;
  _ft_pelletColorOn = !t.useDefault && !!t.pelletColorOn;
  _ft_rainbowPelletOn = !!t.rainbowPelletOn;
  _ft_pelletColor = t.pelletColor || '#ff69b4';
  _ft_pelletRgb = _parseHexRgb(_ft_pelletColor);
  _ft_minimalModeOn = !t.useDefault && !!t.minimalModeOn;
  _ft_agarMapDark = !!(t.agarDarkModeOn !== undefined ? t.agarDarkModeOn : t.agarMapDark);
  _ft_mmHideLB = t.mmHideLB !== false;
  _ft_mmHideChat = t.mmHideChat !== false;
  _ft_mmHideMinimap = t.mmHideMinimap !== false;
  _ft_mmHideEnemyNames = !!t.mmHideEnemyNames;
  _ft_mmHideOwnName = !!t.mmHideOwnName;
  _ft_sectorOverlayOn = !t.useDefault && !!t.sectorOverlayOn;
  _ft_teamCellColorsOn = !t.useDefault && !!t.teamCellColorsOn;
  _ft_teamCellColor = t.teamCellColor || '#ff69b4';
  _ft_teamCellRgb = _parseHexRgb(_ft_teamCellColor);
  globalThis.__ryuPelletStyle = _ft_pelletStyle;
  globalThis.__ryuPelletEmoji = _ft_pelletEmoji;
  globalThis.__ryuPelletImgur = _ft_pelletImgur;
  globalThis.__ryuRainbowFoodParticles = !t.useDefault && !!t.rainbowParticlesOn;
  globalThis.__ryuAgarMap = !t.useDefault && !!t.agarMapOn;
  globalThis.__ryuAgarMapDark = _ft_agarMapDark;
  globalThis.__ryuTeamCellColorsOn = _ft_teamCellColorsOn;
  globalThis.__ryuTeamCellColor = _ft_teamCellColor;
  // Keep kill feed flag live — without this it was only set once at startup and
  // never updated, so toggling the setting mid-session had no effect.
  globalThis.__ryuKillFeedOn = !t.useDefault && !!t.killFeedOn;
  _ft_uiBlocking = isRyuUiBlockingActive();
  _ft_menuOverlay = isRyuMenuOverlayVisible();
  }
  syncFastThemeState(true);
  setInterval(function() {
    syncFastThemeState(false);
  }, 250);
  // Override the ryuten-patched.js implementation so __ryuPatchedTheme() returns
  // the already-maintained _themeCache directly — zero localStorage reads in the
  // render path. syncFastThemeState refreshes _themeCache every 250ms; saveTheme
  // updates it synchronously, so atlas rebuilds triggered from settings always
  // see the correct fresh theme.
  globalThis.__ryuPatchedTheme = function() { return _themeCache !== null ? _themeCache : loadTheme(); };

  // set defaults for any missing keys
  let theme = loadTheme();
  if (theme.color       === undefined) theme.color       = '#ff69b4';
  if (theme.massColor   === undefined) theme.massColor   = '#ff69b4';
  if (theme.fontIndex   === undefined) theme.fontIndex   = 0;
  if (theme.massFont    === undefined) theme.massFont    = 0;
  if (theme.syncMass    === undefined) theme.syncMass    = false;
  if (theme.shortMass   === undefined) theme.shortMass   = false;
  if (theme.cursorOn    === undefined) theme.cursorOn    = false;
  if (theme.cursorIdx   === undefined) theme.cursorIdx   = 0;
  if (theme.useDefault  === undefined) theme.useDefault  = false;
  if (theme.boldName    === undefined) theme.boldName    = false;
  if (theme.hideFlags   === undefined) theme.hideFlags   = false;
  if (theme.leftwardTag === undefined) theme.leftwardTag = true;
  if (theme.lbColor       === undefined) theme.lbColor       = '#ffffff';
  if (theme.commanderText === undefined) theme.commanderText = '';
  if (theme.commanderImgur === undefined) theme.commanderImgur = '';
  if (theme.commanderSpamOn === undefined) theme.commanderSpamOn = true;
  if (theme.strokeOn      === undefined) theme.strokeOn      = false;
  if (theme.strokeColor   === undefined) theme.strokeColor   = '#000000';
  if (theme.nameStroke      === undefined) theme.nameStroke      = '#000000';
  if (theme.nameStrokeWidth === undefined) theme.nameStrokeWidth = 4;
  if (theme.massStroke      === undefined) theme.massStroke      = '#000000';
  if (theme.massStrokeWidth === undefined) theme.massStrokeWidth = 4;
  if (theme.shortMassStroke === undefined) theme.shortMassStroke = '#000000';
  if (theme.shortMassStrokeWidth === undefined) theme.shortMassStrokeWidth = 4;
  if (theme.nameStrokeOn      === undefined) theme.nameStrokeOn      = true;
  if (theme.massStrokeOn      === undefined) theme.massStrokeOn      = true;
  if (theme.shortMassStrokeOn === undefined) theme.shortMassStrokeOn = true;
  if (theme.minimapSize   === undefined) theme.minimapSize   = 280;
  if (theme.rainbowBorderOn    === undefined) theme.rainbowBorderOn    = false;
  if (theme.rainbowBorderSpeed === undefined) theme.rainbowBorderSpeed = 60;
  if (theme.rainbowGlowOn      === undefined) theme.rainbowGlowOn      = false;
  if (theme.rainbowGlowSpeed   === undefined) theme.rainbowGlowSpeed   = 60;
  if (theme.rainbowParticlesOn    === undefined) theme.rainbowParticlesOn    = false;
  if (theme.agarMapOn             === undefined) theme.agarMapOn             = false;
  if (theme.agarMapDark           === undefined) theme.agarMapDark           = false;
  if (theme.agarDarkModeOn        === undefined) theme.agarDarkModeOn        = !!theme.agarMapDark;
  if (theme.agarModeOn            === undefined) theme.agarModeOn            = false;
  if (theme.agarVirusModeOn       === undefined) theme.agarVirusModeOn       = false;
  if (theme.agarMapModeOn         === undefined) theme.agarMapModeOn         = false;
  if (theme.agarChatboxModeOn     === undefined) theme.agarChatboxModeOn     = false;
  if (theme.agarLeaderboardModeOn === undefined) theme.agarLeaderboardModeOn = false;
  if (theme.agarMinimapModeOn     === undefined) theme.agarMinimapModeOn     = false;
  if (theme.minimapPlusOn         === undefined) theme.minimapPlusOn         = true;
  if (theme.borderColor        === undefined) theme.borderColor        = '#ffffff';
  if (theme.glowColor          === undefined) theme.glowColor          = '#ffffff';
  if (theme.dangerIndicatorOn  === undefined) theme.dangerIndicatorOn  = false;
  if (theme.customVirus         === undefined) theme.customVirus         = false;
  if (theme.sphere3dOn          === undefined) theme.sphere3dOn          = false;

  // customVirus toggle poll — redraw orb atlas on change
  let _lastAgarVirus = null;
  setInterval(function() {
    const t = loadTheme();
    const cur = !!t.customVirus;
    if (_lastAgarVirus === null) { _lastAgarVirus = cur; return; }
    if (cur !== _lastAgarVirus) {
      _lastAgarVirus = cur;
      if (globalThis.__ryuOrbRenderer) {
        globalThis.__ryuIllOrbImg = null;
        globalThis.__ryuOrbRenderer._8191();
      }
    }
  }, 500);
  if (theme.splitCounterOn     === undefined) theme.splitCounterOn     = false;
  if (theme.teammateIndicatorOn === undefined) theme.teammateIndicatorOn = true;
  if (theme.sectorOverlayOn    === undefined) theme.sectorOverlayOn    = false;
  if (theme.sectorLabelColor   === undefined) theme.sectorLabelColor   = '#ffffff';
  if (theme.sectorGridColor    === undefined) theme.sectorGridColor    = '#b4b4b4';
  if (theme.sectorFont         === undefined) theme.sectorFont         = 0;
  if (theme.emotesOn           === undefined) theme.emotesOn           = true;
  if (theme.hotkeyEmote        === undefined) theme.hotkeyEmote        = 'RIGHTCLICK';
  if (theme.hotkeyHideFlags    === undefined) theme.hotkeyHideFlags    = '';
  if (theme.hotkeyDangerOverlay === undefined) theme.hotkeyDangerOverlay = '';
  if (theme.hotkeyTeammateIndicator === undefined) theme.hotkeyTeammateIndicator = '';
  if (theme.hotkeyMuteMic         === undefined) theme.hotkeyMuteMic         = '';
  if (theme.hotkeyCelebrate       === undefined) theme.hotkeyCelebrate       = '';
  if (theme.hotkeyFastSpawn       === undefined) theme.hotkeyFastSpawn       = '';
  if (theme.hotkeyInfernoMacro    === undefined) theme.hotkeyInfernoMacro    = '';
  if (theme.hotkeyTargetedFeed    === undefined) theme.hotkeyTargetedFeed    = '';
  if (theme.hotkeyFavoriteEmote   === undefined) theme.hotkeyFavoriteEmote   = '';
  if (theme.favoriteEmoteCode     === undefined) theme.favoriteEmoteCode     = '';
  if (theme.teamCellColorsOn   === undefined) theme.teamCellColorsOn   = false;
  if (theme.teamCellColor      === undefined) theme.teamCellColor      = '#ff69b4';
  if (theme.minimalModeOn       === undefined) theme.minimalModeOn       = false;
  if (theme.mmHideLB            === undefined) theme.mmHideLB            = true;
  if (theme.mmHideChat          === undefined) theme.mmHideChat          = true;
  if (theme.mmHideMinimap       === undefined) theme.mmHideMinimap       = true;
  if (theme.mmHideEnemyNames    === undefined) theme.mmHideEnemyNames    = false;
  if (theme.mmHideOwnName       === undefined) theme.mmHideOwnName       = false;
  if (theme.hotkeyMinimalMode   === undefined) theme.hotkeyMinimalMode   = '';
  if (theme.animSoftenOn       === undefined) theme.animSoftenOn       = false;
  if (theme.animSoftenVal      === undefined) theme.animSoftenVal      = 80;
  if (theme.dangerShowGreen    === undefined) theme.dangerShowGreen    = true;
  if (theme.dangerShowBlue     === undefined) theme.dangerShowBlue     = true;
  if (theme.dangerShowYellow   === undefined) theme.dangerShowYellow   = true;
  if (theme.dangerShowRed      === undefined) theme.dangerShowRed      = true;
  if (theme.chatboxThemeOn     === undefined) theme.chatboxThemeOn     = false;
  if (theme.chatboxStyle       === undefined) theme.chatboxStyle       = 0;
  if (theme.lbThemeOn          === undefined) theme.lbThemeOn          = true;
  if (theme.lbStyle            === undefined) theme.lbStyle            = 0;
  if (theme.minimapThemeOn     === undefined) theme.minimapThemeOn     = true;
  if (theme.minimapStyle       === undefined) theme.minimapStyle       = 1;
  if (theme.chatNameColor      === undefined) theme.chatNameColor      = null;
  if (theme.animatedSkinGifUrl   === undefined) theme.animatedSkinGifUrl   = '';
  if (theme.animatedSkinAlbumUrl === undefined) theme.animatedSkinAlbumUrl = '';
  if (theme.animatedSkinDelayMs  === undefined) theme.animatedSkinDelayMs  = 100;
  if (theme.pelletColorOn      === undefined) theme.pelletColorOn      = false;
  if (theme.pelletColor        === undefined) theme.pelletColor        = '#ff69b4';
  if (theme.rainbowPelletOn    === undefined) theme.rainbowPelletOn    = false;
  if (theme.pelletStyle        === undefined) theme.pelletStyle        = 0;
  if (theme.pelletEmojiOn      === undefined) theme.pelletEmojiOn      = theme.pelletStyle === 1;
  if (theme.pelletImgurOn      === undefined) theme.pelletImgurOn      = theme.pelletStyle === 2;
  if (theme.pelletEmoji        === undefined) theme.pelletEmoji        = '';
  if (theme.pelletImgur        === undefined) theme.pelletImgur        = '';
  theme.pelletStyle = theme.pelletImgurOn ? 2 : (theme.pelletEmojiOn ? 1 : 0);
  saveTheme(theme);
  try { localStorage.removeItem('ryuTeamColors'); } catch(e) {}
  globalThis.__ryuHideNativeTag = theme.leftwardTag !== false;
  globalThis.__ryuPelletStyle = theme.useDefault ? 0 : (theme.pelletImgurOn ? 2 : (theme.pelletEmojiOn ? 1 : 0));
  globalThis.__ryuPelletEmoji = theme.pelletEmoji != null ? theme.pelletEmoji : '';
  globalThis.__ryuPelletImgur = theme.pelletImgur || '';
  globalThis.__ryuRainbowFoodParticles = !theme.useDefault && !!theme.rainbowParticlesOn;
  globalThis.__ryuAgarMap = !theme.useDefault && !!theme.agarMapOn;
  globalThis.__ryuAgarMapDark = !!theme.agarDarkModeOn;
  globalThis.__ryuCommanderText = theme.commanderText || '';
  globalThis.__ryuCommanderImgur = String(theme.commanderImgur || '').trim();
  globalThis.__ryuCommanderMode = theme.commanderMode || 'text';
  globalThis.__ryuCommanderSpamOn = theme.commanderSpamOn !== false;
  globalThis.__ryuKillFeedOn = !theme.useDefault && !!theme.killFeedOn;
  globalThis.__ryuKfProfilePic = theme.kfAvatar || '';
  if (globalThis.__ryuBroadcastKfAvatar && globalThis.__ryuKfProfilePic) globalThis.__ryuBroadcastKfAvatar();
  _ryuKillFeedApply();

  function refreshLeftwardTagMap() {
    try {
      if (globalThis.__ryuLocalLeftwardSourcePatch) return;
      const ne = globalThis.__ne;
      if (!ne || !ne._2430) return;
      const teams = globalThis.__ryuPlayerTeams = globalThis.__ryuPlayerTeams || {};
      let changed = false;
      for (const cell of ne._2430.values()) {
        if (!cell || cell._9491 || !cell._2182 || !cell._2182._1059) continue;
        const player = cell._2182._1059;
        const name = String(player._6988 || '').trim();
        const tag = String(player._9067 || '').trim();
        if (!name) continue;
        const prevTag = String(teams[name] || '').trim();
        const nextTag = (tag && tag !== 'ITS-BOT-TEAM') ? tag : prevTag;
        if (teams[name] !== nextTag) {
          teams[name] = nextTag;
          changed = true;
        }
      }
      if (changed) _scheduleSingleAtlasClear();
    } catch (_) {}
  }
  let _leftwardTagMapTimer = null;
  function _startLeftwardTagMapRefresh() {
    if (_leftwardTagMapTimer !== null || globalThis.__ryuLocalLeftwardSourcePatch) return;
    _leftwardTagMapTimer = setInterval(function() {
      if (globalThis.__ryuLocalLeftwardSourcePatch) {
        clearInterval(_leftwardTagMapTimer);
        _leftwardTagMapTimer = null;
        return;
      }
      refreshLeftwardTagMap();
    }, 500);
  }
  _startLeftwardTagMapRefresh();

  // fonts
  const FONTS = [
    { label: 'Default',          value: 'Titillium Web',    style: 'normal' },
    { label: 'Orbitron',         value: 'Orbitron',         style: 'normal' },
    { label: 'Audiowide',        value: 'Audiowide',        style: 'normal' },
    { label: 'Oxanium',          value: 'Oxanium',          style: 'normal' },
    { label: 'Exo 2',            value: 'Exo 2',            style: 'italic' },
    { label: 'Quantico',         value: 'Quantico',         style: 'italic' },
    { label: 'Nova Square',      value: 'Nova Square',      style: 'normal' },
    { label: 'Bebas Neue',       value: 'Bebas Neue',       style: 'normal' },
    { label: 'Oswald',           value: 'Oswald',           style: 'italic' },
    { label: 'Russo One',        value: 'Russo One',        style: 'normal' },
    { label: 'Black Ops One',    value: 'Black Ops One',    style: 'normal' },
    { label: 'Teko',             value: 'Teko',             style: 'normal' },
    { label: 'Barlow Condensed', value: 'Barlow Condensed', style: 'italic' },
    { label: 'Boogaloo',         value: 'Boogaloo',         style: 'normal' },
    { label: 'Fredoka One',      value: 'Fredoka One',      style: 'normal' },
    { label: 'Permanent Marker', value: 'Permanent Marker', style: 'normal' },
    { label: 'Bangers',          value: 'Bangers',          style: 'normal' },
    { label: 'Righteous',        value: 'Righteous',        style: 'normal' },
    { label: 'Lilita One',       value: 'Lilita One',       style: 'normal' },
    { label: 'Press Start 2P',   value: 'Press Start 2P',   style: 'normal' },
    { label: 'Creepster',        value: 'Creepster',        style: 'normal' },
    { label: 'Abril Fatface',    value: 'Abril Fatface',    style: 'normal' },
    { label: 'Pacifico',         value: 'Pacifico',         style: 'normal' },
    { label: 'Lobster',          value: 'Lobster',          style: 'normal' },
    { label: 'Monoton',          value: 'Monoton',          style: 'normal' },
    { label: 'Faster One',       value: 'Faster One',       style: 'normal' },
    { label: 'Gugi',             value: 'Gugi',             style: 'normal' },
    { label: 'Silkscreen',       value: 'Silkscreen',       style: 'normal' },
    { label: 'VT323',            value: 'VT323',            style: 'normal' },
    { label: 'Geogrotesque Cyr', value: 'Geogrotesque Cyr', style: 'normal' },
  ];

  // cursors
  const CURSORS = [
    { label: 'Default',                    emoji: null                    },
    { label: '\uD83C\uDFAF Target',         emoji: '\uD83C\uDFAF'         },
    { label: '\u2694\uFE0F Sword',          emoji: '\u2694\uFE0F'         },
    { label: '\uD83D\uDC80 Skull',          emoji: '\uD83D\uDC80'         },
    { label: '\uD83D\uDD25 Fire',           emoji: '\uD83D\uDD25'         },
    { label: '\u2B50 Star',                 emoji: '\u2B50'                },
    { label: '\uD83D\uDC41\uFE0F Eye',      emoji: '\uD83D\uDC41\uFE0F'  },
    { label: '\uD83D\uDC8E Gem',            emoji: '\uD83D\uDC8E'         },
    { label: '\uD83E\uDE78 Blood',          emoji: '\uD83E\uDE78'         },
    { label: '\u26A1 Bolt',                 emoji: '\u26A1'                },
    { label: '\uD83C\uDF00 Vortex',         emoji: '\uD83C\uDF00'         },
    { label: '\uD83D\uDD79\uFE0F Joystick', emoji: '\uD83D\uDD79\uFE0F'  },
    { label: '\uD83C\uDF19 Moon',           emoji: '\uD83C\uDF19'         },
    { label: '\uD83C\uDF40 Clover',         emoji: '\uD83C\uDF40'         },
    { label: '\uD83E\uDD8B Butterfly',      emoji: '\uD83E\uDD8B'         },
    { label: '\uD83D\uDC09 Dragon',         emoji: '\uD83D\uDC09'         },
    { label: '\uD83C\uDF83 Pumpkin',        emoji: '\uD83C\uDF83'         },
    { label: '\uD83E\uDDE0 Evil Eye',       emoji: '\uD83E\uDDE0'         },
    { label: '\uD83E\uDE84 Wand',           emoji: '\uD83E\uDE84'         },
    { label: '\uD83D\uDD2E Crystal',        emoji: '\uD83D\uDD2E'         },
    { label: '\uD83D\uDDE1\uFE0F Dagger',   emoji: '\uD83D\uDDE1\uFE0F'  },
    { label: '\uD83E\uDD77 Ninja',          emoji: '\uD83E\uDD77'         },
    { label: '\uD83D\uDC7D Alien',          emoji: '\uD83D\uDC7D'         },
    { label: '\uD83E\uDD16 Robot',          emoji: '\uD83E\uDD16'         },
    { label: '\uD83C\uDF0A Wave',           emoji: '\uD83C\uDF0A'         },
    { label: '\uD83E\uDDCA Ice',            emoji: '\uD83E\uDDCA'         },
    { label: '\u2620\uFE0F Crossbones',     emoji: '\u2620\uFE0F'         },
  ];

  // load all google fonts up front
  function injectFonts() {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?'
      + 'family=Orbitron:wght@700&family=Audiowide&family=Oxanium:wght@700'
      + '&family=Exo+2:ital,wght@1,600&family=Quantico:ital,wght@1,700'
      + '&family=Nova+Square&family=Bebas+Neue&family=Oswald:ital,wght@1,600'
      + '&family=Russo+One&family=Black+Ops+One&family=Teko:wght@600'
      + '&family=Barlow+Condensed:ital,wght@1,700&family=Boogaloo'
      + '&family=Fredoka+One&family=Permanent+Marker&family=Bangers'
      + '&family=Righteous&family=Lilita+One'
      + '&family=Press+Start+2P&family=Creepster&family=Abril+Fatface'
      + '&family=Pacifico&family=Lobster&family=Monoton'
      + '&family=Faster+One&family=Gugi&family=Silkscreen&family=VT323'
      + '&display=swap';
    (document.head || document.documentElement).appendChild(link);
    // local Geogrotesque
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const geoStyle = document.createElement('style');
      geoStyle.textContent = '@font-face{font-family:"Geogrotesque Cyr";src:url("' + chrome.runtime.getURL('fonts/GeogrotesqueCyr-Regular.woff2') + '") format("woff2");font-weight:400;font-style:normal;}';
      (document.head || document.documentElement).appendChild(geoStyle);
    }
  }
  if (document.head) injectFonts();
  else document.addEventListener('DOMContentLoaded', injectFonts);
  if (document.body) _ryuKillFeedInit();
  else document.addEventListener('DOMContentLoaded', _ryuKillFeedInit);

  // patch fillText/strokeText to apply our font + color to names and mass
  let _lastFontStr = null, _lastFontSize = 20;
  function getFontSize(font) {
    if (font === _lastFontStr) return _lastFontSize;
    _lastFontStr = font;
    const m = font.match(/(\d+(?:\.\d+)?)px/);
    _lastFontSize = m ? parseFloat(m[1]) : 20;
    return _lastFontSize;
  }

  const _pendingLeftwardTags = [];
  const _recentPlayerNames = [];
  const INLINE_TAG_TTL = 180;
  const _styledFontCache = new Map();
  let _styledFontSig = '';
  let _teamCacheRef = null;
  let _teamTagSet = null;

  function _nowMs() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
  }

  function isTextHookPassthroughMode() {
    // hideFlags is intentionally excluded here — it only affects player name text, so
    // blocking the entire passthrough fast-path for food/mass/etc. would be wasteful.
    // Flag stripping is handled inline inside the passthrough block in fillText instead.
    return !!(
      globalThis.__ryuLocalLeftwardSourcePatch &&
      _ft_fontIndex === 0 &&
      _ft_massFont === 0 &&
      !_ft_boldName &&
      !_ft_syncMass &&
      !_ft_strokeOn &&
      _ft_nameFill === '#ffffff' &&
      _ft_massFill === '#ff69b4'
    );
  }

  function pruneInlineTagState(now) {
    for (let i = _pendingLeftwardTags.length - 1; i >= 0; i--) {
      if (now - _pendingLeftwardTags[i].ts > INLINE_TAG_TTL) _pendingLeftwardTags.splice(i, 1);
    }
    for (let i = _recentPlayerNames.length - 1; i >= 0; i--) {
      if (now - _recentPlayerNames[i].ts > INLINE_TAG_TTL) _recentPlayerNames.splice(i, 1);
    }
  }

  function stripFlagPrefix(text) {
    return String(text || '')
      .replace(/^[\uD83C][\uDDE0-\uDDFF][\uD83C][\uDDE0-\uDDFF]\s*/u, '')
      .replace(/^\s*\[[^\]]+\]\s*/u, '')
      .trim();
  }

  function hasVisibleTagPrefix(text) {
    return /^\s*\[[^\]]+\]\s+/u.test(String(text || ''));
  }

  function abbreviateMassText(text) {
    const raw = String(text || '').trim();
    if (!raw) return raw;
    const value = Number(raw);
    if (!Number.isFinite(value)) return raw;

    const abs = Math.abs(value);
    if (abs < 1000) return String(Math.round(value));

    const units = [
      { div: 1e12, suffix: 'T' },
      { div: 1e9, suffix: 'B' },
      { div: 1e6, suffix: 'M' },
      { div: 1e3, suffix: 'k' }
    ];

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (abs >= unit.div) {
        const scaled = value / unit.div;
        const rounded = Math.abs(scaled) >= 100 ? scaled.toFixed(0)
          : scaled.toFixed(1);
        return rounded.replace(/\.0$/, '') + unit.suffix;
      }
    }

    return String(Math.round(value));
  }

  function getLeftwardTagForName(text) {
    const cleanName = stripFlagPrefix(text);
    if (!cleanName) return '';
    const teams = globalThis.__ryuPlayerTeams;
    if (!teams) return '';
    const rawTag = teams[cleanName];
    const tag = String(rawTag || '').trim();
    return tag && tag !== 'ITS-BOT-TEAM' ? tag : '';
  }

  function getTeamTagSet() {
    const teams = globalThis.__ryuPlayerTeams;
    if (!teams) return null;
    if (_teamCacheRef === teams && _teamTagSet) return _teamTagSet;
    _teamCacheRef = teams;
    _teamTagSet = new Set();
    const vals = Object.values(teams);
    for (let i = 0; i < vals.length; i++) {
      const tag = String(vals[i] || '').trim();
      if (tag && tag !== 'ITS-BOT-TEAM') _teamTagSet.add(tag);
    }
    return _teamTagSet;
  }

  function isKnownLeftwardTag(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return false;
    const tags = getTeamTagSet();
    return !!(tags && tags.has(trimmed));
  }

  function isKnownLeftwardName(text) {
    const cleanName = stripFlagPrefix(text);
    if (!cleanName) return false;
    const teams = globalThis.__ryuPlayerTeams;
    return !!(teams && Object.prototype.hasOwnProperty.call(teams, cleanName));
  }

  let _suppressNextFillRect = false;
  let _lastTagRect = null; // {ctx, x, y, w, h} — last fillRect drawn, cleared retroactively if followed by tag fillText

  function patchContext(proto) {
    const originalFillText   = proto.fillText;
    const originalStrokeText = proto.strokeText;
    const originalFillRect   = proto.fillRect;
    const originalMeasureText = proto.measureText;

    function getStyledFont(size, isPlayerName) {
      if (_styledFontSig !== _ft_fontSig) {
        _styledFontSig = _ft_fontSig;
        _styledFontCache.clear();
      }
      const fontIdx = isPlayerName ? _ft_fontIndex : _ft_massFont;
      const key = (isPlayerName ? 'n' : 'm') + '|' + size + '|' + fontIdx + '|' + (_ft_boldName ? 1 : 0);
      const cached = _styledFontCache.get(key);
      if (cached) return cached;

      const weight = _ft_boldName ? '900' : '600';
      const fontDef = FONTS[fontIdx] || FONTS[0];
      const font = fontIdx > 0
        ? `${fontDef.style} ${weight} ${size * (isPlayerName ? 0.92 : 1)}px "${fontDef.value}", ${isPlayerName ? '"Twemoji Country Flags", ' : ''}sans-serif`
        : `${weight} ${size}px ${isPlayerName ? '"Twemoji Country Flags", ' : ''}"Titillium Web", sans-serif`;

      // Evict only the oldest entry instead of wiping all 80 at once — prevents a
      // burst of font re-setups on the very next frame after a full clear.
      if (_styledFontCache.size >= 80) _styledFontCache.delete(_styledFontCache.keys().next().value);
      _styledFontCache.set(key, font);
      return font;
    }

    // Reusable save/restore buffer — avoids a heap allocation on every text draw.
    // Safe because setStyledTextState/restoreStyledTextState calls are never re-entrant:
    // originalFillText and originalStrokeText are captured native refs that cannot
    // trigger our hooked versions, and clearInlineTagArtifacts always completes
    // before drawStyledText begins in every call site.
    const _prevStateBuffer = {
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 0,
      textBaseline: '', textAlign: '', shadowBlur: 0, shadowColor: ''
    };

    function setStyledTextState(ctx, size, isPlayerName) {
      _prevStateBuffer.font        = ctx.font;
      _prevStateBuffer.fillStyle   = ctx.fillStyle;
      _prevStateBuffer.strokeStyle = ctx.strokeStyle;
      _prevStateBuffer.lineWidth   = ctx.lineWidth;
      _prevStateBuffer.textBaseline = ctx.textBaseline;
      _prevStateBuffer.textAlign   = ctx.textAlign;
      _prevStateBuffer.shadowBlur  = ctx.shadowBlur;
      _prevStateBuffer.shadowColor = ctx.shadowColor;

      ctx.font = getStyledFont(size, isPlayerName);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = isPlayerName ? _ft_nameFill : _ft_massFill;

      return _prevStateBuffer;
    }

    function restoreStyledTextState(ctx, prev) {
      ctx.font = prev.font;
      ctx.fillStyle = prev.fillStyle;
      ctx.strokeStyle = prev.strokeStyle;
      ctx.lineWidth = prev.lineWidth;
      ctx.textBaseline = prev.textBaseline;
      ctx.textAlign = prev.textAlign;
      ctx.shadowBlur = prev.shadowBlur;
      ctx.shadowColor = prev.shadowColor;
    }

    function drawStyledText(ctx, text, x, y, size, isPlayerName, rest) {
      const prev = setStyledTextState(ctx, size, isPlayerName);
      const strokeColor = isPlayerName
        ? (_ft_nameStrokeOn ? _ft_nameStroke : '')
        : (_ft_massStrokeOn ? _ft_massStroke : '');
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isPlayerName
            ? Math.max(_ft_nameStrokeWidth, 1)
            : Math.max(size * 0.08, 2);
        ctx._ryuStroke = true;
        originalStrokeText.call(ctx, text, x, y, ...rest);
        ctx._ryuStroke = false;
      }
      originalFillText.call(ctx, text, x, y, ...rest);
      restoreStyledTextState(ctx, prev);
    }

    function getCombinedLeftwardText(text) {
      if (!_ft_leftwardTag) return null;
      if (globalThis.__ryuLocalLeftwardSourcePatch) return null;
      if (hasVisibleTagPrefix(text)) return null;
      const tag = getLeftwardTagForName(text);
      return tag ? ('[' + tag + '] ' + text) : null;
    }

    function measureStyledTextWidth(ctx, text, size, isPlayerName) {
      const prev = setStyledTextState(ctx, size, isPlayerName);
      const width = ctx.measureText(text).width;
      restoreStyledTextState(ctx, prev);
      return width;
    }

    // Lightweight measure used inside clearInlineTagArtifacts — only swaps font
    // because measureText accuracy depends solely on font, not fill/stroke/shadow.
    // Avoids the 8-property save/restore that setStyledTextState performs.
    function measureStyledTextWidthFast(ctx, text, size, isPlayerName) {
      const prevFont = ctx.font;
      ctx.font = getStyledFont(size, isPlayerName);
      const width = ctx.measureText(text).width;
      ctx.font = prevFont;
      return width;
    }

    function isLikelyNativeTagDraw(ctx, text, x, y) {
      const rect = _lastTagRect;
      if (!rect || rect.ctx !== ctx) return false;
      const trimmed = String(text).trim();
      if (!trimmed || trimmed.length > 16) return false;
      const size = getFontSize(ctx.font);
      const slackX = Math.max(size, rect.h * 0.75, 8);
      const slackY = Math.max(size * 0.8, rect.h, 8);
      const insideX = x >= rect.x - slackX && x <= rect.x + rect.w + slackX;
      const insideY = y >= rect.y - slackY && y <= rect.y + rect.h + slackY;
      const plausibleRect = rect.w >= Math.max(size * 0.8, 10)
        && rect.w <= Math.max(size * 10, 160)
        && rect.h >= Math.max(size * 0.35, 6)
        && rect.h <= Math.max(size * 2.5, 42);
      return insideX && insideY && plausibleRect;
    }

    function takePendingLeftwardTag(ctx, x, y, size, now) {
      pruneInlineTagState(now);
      for (let i = _pendingLeftwardTags.length - 1; i >= 0; i--) {
        const entry = _pendingLeftwardTags[i];
        if (entry.ctx !== ctx) continue;
        if (Math.abs(entry.x - x) > Math.max(size * 0.85, 16)) continue;
        if (Math.abs(entry.y - y) > Math.max(size * 1.4, 24)) continue;
        _pendingLeftwardTags.splice(i, 1);
        return entry;
      }
      return null;
    }

    function takeRecentPlayerName(ctx, x, y, size, now) {
      pruneInlineTagState(now);
      for (let i = _recentPlayerNames.length - 1; i >= 0; i--) {
        const entry = _recentPlayerNames[i];
        if (entry.ctx !== ctx) continue;
        if (Math.abs(entry.x - x) > Math.max(size * 0.85, 16)) continue;
        if (Math.abs(entry.y - y) > Math.max(size * 1.4, 24)) continue;
        _recentPlayerNames.splice(i, 1);
        return entry;
      }
      return null;
    }

    function clearInlineTagArtifacts(ctx, nameX, nameY, nameSize, currentText, combinedText, pendingTag) {
      // Use fast measure (font-only swap) — canvas measureText only reads the font
      // property, so the full 8-prop save/restore of measureStyledTextWidth is waste here.
      const nameWidth = measureStyledTextWidthFast(ctx, currentText, nameSize, true);
      const comboWidth = measureStyledTextWidthFast(ctx, combinedText, nameSize, true);
      let left = nameX - Math.max(nameWidth, comboWidth) / 2 - nameSize * 0.8;
      let top = nameY - nameSize;
      let right = nameX + Math.max(nameWidth, comboWidth) / 2 + nameSize * 0.8;
      let bottom = nameY + nameSize;

      if (pendingTag) {
        if (pendingTag.rect) {
          left = Math.min(left, pendingTag.rect.x - 4);
          top = Math.min(top, pendingTag.rect.y - 4);
          right = Math.max(right, pendingTag.rect.x + pendingTag.rect.w + 4);
          bottom = Math.max(bottom, pendingTag.rect.y + pendingTag.rect.h + 4);
        } else {
          const approxTagWidth = Math.max(nameSize, measureStyledTextWidthFast(ctx, pendingTag.text, Math.max(nameSize * 0.62, 10), true));
          left = Math.min(left, pendingTag.x - approxTagWidth);
          top = Math.min(top, pendingTag.y - nameSize * 0.8);
          right = Math.max(right, pendingTag.x + approxTagWidth);
          bottom = Math.max(bottom, pendingTag.y + nameSize * 0.8);
        }
      }

      ctx.clearRect(left, top, Math.max(right - left, 1), Math.max(bottom - top, 1));
    }

    proto.fillRect = function (x, y, w, h, ...rest) {
      if (isTextHookPassthroughMode()) {
        return originalFillRect.call(this, x, y, w, h, ...rest);
      }
      if (_suppressNextFillRect) {
        _suppressNextFillRect = false;
        return;
      }
      // record last rect in case it's a tag background (game draws rect then tag text)
      _lastTagRect = { ctx: this, x, y, w, h };
      return originalFillRect.call(this, x, y, w, h, ...rest);
    };

    proto.measureText = function(text, ...rest) {
      if (isTextHookPassthroughMode()) return originalMeasureText.call(this, text, ...rest);
      if (_ft_useDefault || !text) return originalMeasureText.call(this, text, ...rest);
      if (!_ft_leftwardTag || globalThis.__ryuLocalLeftwardSourcePatch) return originalMeasureText.call(this, text, ...rest);
      const combined = getCombinedLeftwardText(text);
      if (combined) return originalMeasureText.call(this, combined, ...rest);
      return originalMeasureText.call(this, text, ...rest);
    };

    proto.strokeText = function (text, x, y, ...rest) {
      if (isTextHookPassthroughMode()) {
        return originalStrokeText.call(this, text, x, y, ...rest);
      }
      if (globalThis.__ryuMassCanvasDraw) {
        return originalStrokeText.call(this, text, x, y, ...rest);
      }
      if (globalThis.__ryuNativeNameAtlasDraw || globalThis.__ryuNativeMassAtlasDraw) {
        return originalStrokeText.call(this, text, x, y, ...rest);
      }
      if (this._ryuStroke) return originalStrokeText.call(this, text, x, y, ...rest);
      if (_ft_useDefault) return originalStrokeText.call(this, text, x, y, ...rest);
      if (_ft_leftwardTag && !globalThis.__ryuLocalLeftwardSourcePatch) {
        const combined = getCombinedLeftwardText(text);
        if (combined) return;
        if (isKnownLeftwardTag(text)) return;
      }
      if (this.canvas.width === 1024 && this.canvas.height === 1024)
        return originalStrokeText.call(this, text, x, y, ...rest);
    };

    proto.fillText = function (text, x, y, ...rest) {
      if (isTextHookPassthroughMode()) {
        // Passthrough bypasses the full hook — but hideFlags still needs to strip
        // flags from direct name draws. The atlas handles this for sprite-based names;
        // this covers the fallback direct-draw path only (Twemoji font + leading flag).
        if (_ft_hideFlags && this.font.includes('Twemoji Country Flags')) {
          const s = String(text);
          const cp = s.codePointAt(0);
          if (cp >= 0x1F1E0 && cp <= 0x1F1FF)
            return originalFillText.call(this, s.replace(/[\u{1F1E0}-\u{1F1FF}]{2}\s*/gu, ''), x, y, ...rest);
        }
        return originalFillText.call(this, text, x, y, ...rest);
      }
      if (globalThis.__ryuMassCanvasDraw) {
        return originalFillText.call(this, text, x, y, ...rest);
      }
      if (globalThis.__ryuNativeNameAtlasDraw || globalThis.__ryuNativeMassAtlasDraw) {
        return originalFillText.call(this, text, x, y, ...rest);
      }
      if (_ft_useDefault)
        return originalFillText.call(this, text, x, y, ...rest);

      const isTwemoji = this.font.includes('Twemoji Country Flags');
      const trimmedText = String(text).trim();
      const isNumericText = trimmedText !== '' && !isNaN(Number(text));
      const sourcePatched = !!globalThis.__ryuLocalLeftwardSourcePatch;
      const shouldProcessLeftward = _ft_leftwardTag && !sourcePatched;
      const isKnownName = shouldProcessLeftward && isKnownLeftwardName(text);
      const isKnownTag = shouldProcessLeftward && isKnownLeftwardTag(text);
      const isPlayerName = (isTwemoji && !isNumericText) || (!isTwemoji && isKnownName && !isNumericText);
      const isMassText = isNumericText && !isKnownTag;
      const isAtlasCanvas = this.canvas.width === 1024 && this.canvas.height === 1024;

      if (isAtlasCanvas && !isKnownName && !isKnownTag && !isMassText)
        return originalFillText.call(this, text, x, y, ...rest);

      // suppress native team tag pill — game draws fillRect then fillText(tag)
      if (shouldProcessLeftward && !isTwemoji && globalThis.__ryuHideNativeTag && (isLikelyNativeTagDraw(this, text, x, y) || isKnownTag)) {
        const trimmed = String(text).trim();
        if (isKnownTag) {
          if (_lastTagRect && _lastTagRect.ctx === this) {
            this.clearRect(_lastTagRect.x, _lastTagRect.y, _lastTagRect.w, _lastTagRect.h);
          }
          _lastTagRect = null;
          return;
        }
        const now = _nowMs();
        const existingName = takeRecentPlayerName(this, x, y, getFontSize(this.font), now);
        if (shouldProcessLeftward && existingName) {
          if (_lastTagRect && _lastTagRect.ctx === this) {
            this.clearRect(_lastTagRect.x, _lastTagRect.y, _lastTagRect.w, _lastTagRect.h);
          }
          const combinedText = '[' + trimmed + '] ' + existingName.text;
          clearInlineTagArtifacts(this, existingName.x, existingName.y, existingName.size, existingName.renderedText, combinedText, { text: trimmed, x, y, rect: _lastTagRect });
          drawStyledText(this, combinedText, existingName.x, existingName.y, existingName.size, true, existingName.rest);
          _lastTagRect = null;
          return;
        }
        if (shouldProcessLeftward) {
          _pendingLeftwardTags.push({
            ctx: this,
            text: trimmed,
            x,
            y,
            rect: _lastTagRect ? { x: _lastTagRect.x, y: _lastTagRect.y, w: _lastTagRect.w, h: _lastTagRect.h } : null,
            ts: now
          });
          pruneInlineTagState(now);
        }
        _lastTagRect = null;
      }
      _lastTagRect = null;

      if (!isPlayerName && !isMassText)
        return originalFillText.call(this, text, x, y, ...rest);

      if (isPlayerName && _ft_hideFlags) {
        // Fast guard: codePointAt is O(1) — skip the regex entirely for names with no
        // leading regional indicator (the majority), avoiding a string alloc per frame.
        const s = String(text);
        const cp = s.codePointAt(0);
        if (cp >= 0x1F1E0 && cp <= 0x1F1FF)
          text = s.replace(/[\u{1F1E0}-\u{1F1FF}]{2}\s*/gu, '');
      }

      const size = getFontSize(this.font);
      if (isMassText) {
        if (_ft_shortMass) return;
        // fall through to drawStyledText so font/color/scale apply normally
      }
      if (isPlayerName && shouldProcessLeftward) {
        const now = _nowMs();
        const mappedTag = getLeftwardTagForName(text);
        const pendingTag = takePendingLeftwardTag(this, x, y, size, now);
        const resolvedTag = mappedTag || (pendingTag ? pendingTag.text : '');
        const renderedText = resolvedTag ? '[' + resolvedTag + '] ' + text : text;
        if (pendingTag) {
          clearInlineTagArtifacts(this, x, y, size, text, renderedText, pendingTag);
        }
        drawStyledText(this, renderedText, x, y, size, true, rest);
        if (!resolvedTag) {
          // rest is already a fresh array from the ...rest spread parameter — Array.from copy is redundant.
          _recentPlayerNames.push({ ctx: this, x, y, size, text, renderedText, rest, ts: now });
          pruneInlineTagState(now);
        }
        return;
      }

      drawStyledText(this, text, x, y, size, isPlayerName, rest);
    };
  }

  patchContext(CanvasRenderingContext2D.prototype);
  if (typeof OffscreenCanvasRenderingContext2D !== 'undefined')
    patchContext(OffscreenCanvasRenderingContext2D.prototype);

  // emoji cursor overlay
  let _cursorCanvas = null;
  let _mouseX = window.innerWidth / 2;
  let _mouseY = window.innerHeight / 2;
  document.addEventListener('mousemove', e => { _mouseX = e.clientX; _mouseY = e.clientY; }, true);

  // gif skin animator
(function() {
  var _gifSlot = -1;
  var _gifRafId = null;
  var _gifFrames = [];
  var _gifFrameIdx = 0;
  var _gifLastTs = 0;
  var _gifUrl = '';

  function stopGifAnim() {
    _gifSlot = -1;
    if (_gifRafId) { cancelAnimationFrame(_gifRafId); _gifRafId = null; }
    _gifFrames = [];
    _gifFrameIdx = 0;
    _gifUrl = '';
  }

  async function loadGifFrames(url) {
    try {
      var resp = await fetch(url);
      var blob = await resp.blob();
      var decoder = new ImageDecoder({ data: blob.stream(), type: 'image/gif' });
      await decoder.tracks.ready;
      var track = decoder.tracks.selectedTrack;
      var frames = [];
      for (var i = 0; i < track.frameCount; i++) {
        var result = await decoder.decode({ frameIndex: i });
        frames.push({
          bitmap: result.image,
          duration: result.image.duration ? result.image.duration / 1000 : 100
        });
      }
      decoder.close();
      return frames;
    } catch(e) {
      return [];
    }
  }

  function startGifAnim(slot, url) {
    if (_gifSlot === slot && _gifUrl === url) return;
    stopGifAnim();
    _gifSlot = slot;
    _gifUrl = url;

    loadGifFrames(url).then(function(frames) {
      if (_gifSlot !== slot || _gifUrl !== url) return;
      if (!frames.length) return;
      _gifFrames = frames;
      _gifFrameIdx = 0;
      _gifLastTs = 0;

      function frame(ts) {
        if (_gifSlot !== slot || _gifUrl !== url) return;
        var ue = globalThis.__Ue;
        if (!ue || !ue._7839 || !ue._9354) { _gifRafId = requestAnimationFrame(frame); return; }

        var f = _gifFrames[_gifFrameIdx];
        if (!_gifLastTs || ts - _gifLastTs >= f.duration) {
          var ctx = ue._7839.getContext('2d');
          if (slot === 0) {
            ctx.clearRect(512, 0, 512, 512);
            ctx.save();
            ctx.beginPath();
            ctx.arc(768, 256, 240, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(f.bitmap, 528, 16, 480, 480);
            ctx.restore();
          } else {
            ctx.clearRect(0, 512, 512, 512);
            ctx.save();
            ctx.beginPath();
            ctx.arc(256, 768, 240, 0.5 * -Math.PI, 0.5 * Math.PI);
            ctx.closePath();
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(f.bitmap, 16, 528, 480, 480);
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(256, 528);
            ctx.lineTo(256, 1008);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(256, 768, 12, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
          }
          ue._9354.update();
          _gifFrameIdx = (_gifFrameIdx + 1) % _gifFrames.length;
          _gifLastTs = ts;
        }
        _gifRafId = requestAnimationFrame(frame);
      }
      _gifRafId = requestAnimationFrame(frame);
    });
  }

  setInterval(function() {
    var ue = globalThis.__Ue;
    if (!ue || !ue._3901) return;
    var u0 = ue._3901._9315 || '';
    var u1 = ue._3901._8053 || '';
    var isGif0 = u0.toLowerCase().includes('.gif');
    var isGif1 = u1.toLowerCase().includes('.gif');
    if (isGif0) startGifAnim(0, u0);
    else if (isGif1) startGifAnim(1, u1);
    else stopGifAnim();
  }, 1000);
})();

  // team cell colors: one shared color for current tag members, gated by toggle
  (function() {
    const _originalColors = new Map();

    function cellId(cell) {
      return cell && (cell._9782 || cell._6801 || cell._7847 + ':' + cell._9202);
    }

    function colorObj(cell) {
      if (cell && cell._2182 && cell._2182._6728) return cell._2182._6728;
      return cell && cell._6728;
    }

    function hasColorObj(obj) {
      return !!(obj &&
        Number.isFinite(obj._9568) &&
        Number.isFinite(obj._5294) &&
        Number.isFinite(obj._1754));
    }

    function ownerId(cell) {
      const owner = cell && cell._2182;
      const player = owner && owner._1059;
      return owner && owner._9782 ? 'o:' + owner._9782 :
        player && player._9782 ? 'p:' + player._9782 :
        player && player._6988 ? 'n:' + player._6988 :
        'c:' + cellId(cell);
    }

    function remember(cell) {
      const id = ownerId(cell);
      const color = colorObj(cell);
      if (!id || _originalColors.has(id) || !hasColorObj(color)) return;
      _originalColors.set(id, {
        r: color._9568,
        g: color._5294,
        b: color._1754
      });
    }

    function setRgb(cell, rgb) {
      const color = colorObj(cell);
      if (!hasColorObj(color)) return;
      if (typeof color._4659 === 'function') color._4659(rgb.r, rgb.g, rgb.b);
      else {
        color._9568 = rgb.r;
        color._5294 = rgb.g;
        color._1754 = rgb.b;
      }
    }

    function restoreCell(id, cell) {
      const prev = _originalColors.get(id);
      if (prev && cell) setRgb(cell, prev);
      _originalColors.delete(id);
    }

    function restoreAll(liveCells) {
      if (!_originalColors.size) return;
      for (const id of Array.from(_originalColors.keys())) {
        restoreCell(id, liveCells && liveCells.get(id));
      }
    }

    function currentTag() {
      const me = globalThis.__Be && globalThis.__Be._1059;
      const tag = me && String(me._9067 || '').trim();
      return tag && tag !== 'ITS-BOT-TEAM' ? tag : '';
    }

    function applyTeamCellColors() {
      const enabled = !!globalThis.__ryuTeamCellColorsOn;
      if (!enabled && !_originalColors.size) return;
      const ne = globalThis.__ne;
      const me = globalThis.__Be && globalThis.__Be._1059;
      if (!ne || !ne._2430) return;

      const liveCells = new Map();
      for (const cell of ne._2430.values()) {
        const id = ownerId(cell);
        if (id) liveCells.set(id, cell);
      }

      const tag = currentTag();
      if (!enabled || !tag) {
        restoreAll(liveCells);
        return;
      }

      const rgb = _parseHexRgb(globalThis.__ryuTeamCellColor || _ft_teamCellColor);
      const stillColored = new Set();
      for (const cell of ne._2430.values()) {
        if (!cell || cell._9491 || !cell._2182 || !cell._2182._1059) continue;
        if (me && cell._2182._1059 === me) {
          const ownId = ownerId(cell);
          if (ownId && _originalColors.has(ownId)) restoreCell(ownId, cell);
          continue;
        }
        const playerTag = String(cell._2182._1059._9067 || '').trim();
        const id = ownerId(cell);
        if (!id) continue;
        if (playerTag === tag) {
          remember(cell);
          setRgb(cell, rgb);
          stillColored.add(id);
        } else if (_originalColors.has(id)) {
          restoreCell(id, cell);
        }
      }

      for (const id of Array.from(_originalColors.keys())) {
        if (!stillColored.has(id)) restoreCell(id, liveCells.get(id));
      }
    }

    // Keep team-cell recolor work off the frame loop. Running this during the
    // game's hot render path caused noticeable hitching while splitting/zooming.
    // A light timer keeps colors updated without fighting the renderer.
    setInterval(applyTeamCellColors, 100);
    globalThis.__ryuRefreshTeamCellColors = applyTeamCellColors;
  })();

  function applyCursor(emoji) {
    if (_cursorCanvas) {
      if (_cursorCanvas._cleanup) _cursorCanvas._cleanup();
      _cursorCanvas.remove();
      _cursorCanvas = null;
    }
    if (document.body) document.body.style.cursor = '';
    document.documentElement.style.cursor = '';
    const s = document.getElementById('ryu-cursor-hide');
    if (s) s.textContent = '';
    if (!emoji) return;

    const styleTag = document.getElementById('ryu-cursor-hide') || document.createElement('style');
    styleTag.id = 'ryu-cursor-hide';
    styleTag.textContent = '* { cursor: none !important; }';
    document.head.appendChild(styleTag);

    const SIZE = 36;
    _cursorCanvas = document.createElement('canvas');
    _cursorCanvas.id     = 'ryu-cursor-canvas';
    _cursorCanvas.width  = SIZE * 2;
    _cursorCanvas.height = SIZE * 2;
    _cursorCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483647;will-change:transform;';
    document.body.appendChild(_cursorCanvas);

    const ctx = _cursorCanvas.getContext('2d');
    ctx.font         = SIZE + 'px serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText(emoji, SIZE, SIZE);

    function moveCursor(x, y) {
      _cursorCanvas.style.transform = `translate(${x - SIZE}px,${y - SIZE}px)`;
    }
    function onMouseMove(e)  { moveCursor(e.clientX, e.clientY); }
    function onMouseLeave()  { _cursorCanvas.style.opacity = '0'; }
    function onMouseEnter()  { _cursorCanvas.style.opacity = '1'; }

    document.addEventListener('mousemove',  onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    moveCursor(_mouseX, _mouseY);

    _cursorCanvas._cleanup = () => {
      document.removeEventListener('mousemove',  onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }

  globalThis.__ryuApplyCursor = function(emoji) {
    applyCursor(emoji || null);
  };

  function applyCursorOnLoad() {
    if (!document.body) { setTimeout(applyCursorOnLoad, 50); return; }
    const t = loadTheme();
    if (t.cursorOn && t.cursorIdx > 0) applyCursor(CURSORS[t.cursorIdx]?.emoji || null);
  }
  applyCursorOnLoad();

  // live tag changer — bypasses client-side alive check
  globalThis.__ryuSetTag = function(tag) {
    if (!globalThis.__We) return;
    globalThis.__We._6448 = tag;
    globalThis.__We._3767('team-change');
  };
  // mass font / stroke poll — runs every 500ms to detect theme changes that
  // a slow visible-tab fallback for external localStorage edits.
  let _lastMassFont = null;
  let _lastShortMass = null;
  let _lastMassStroke = null;
  let _lastShortMassStroke = null;
  // Shape-only key for short-mass stroke: toggle + width.  Stroke COLOR is
  // intentionally excluded here because it is applied as a runtime tint every
  // frame and does NOT require destroying/rebuilding the cached sprites.
  // Triggering __ryuRedrawMass for color-only changes is the main source of
  // unnecessary atlas destruction and per-frame flicker during color edits.
  let _lastShortMassStrokeShape = null;
  function refreshMassSettings(force) {
    const t = loadTheme();
    const cur = t.massFont !== undefined ? t.massFont : (t.fontIndex || 0);
    const shortMass = !!t.shortMass;
    const massStrokeOn = t.massStrokeOn !== false;
    const massStrokeColor = t.massStroke || '#000000';
    const massStrokeWidth = t.massStrokeWidth || 4;
    const massStrokeCustom = massStrokeOn && massStrokeColor.toLowerCase && massStrokeColor.toLowerCase() !== '#000000';
    const massStrokeWidthCustom = massStrokeOn && Number(massStrokeWidth) !== 4;
    const massFillBaked = !shortMass && (cur > 0 || massStrokeCustom || massStrokeWidthCustom);
    const massFill = t.syncMass ? (t.color || '#ff69b4') : (t.massColor || '#ff69b4');
    const massStroke = (massStrokeOn ? 'on' : 'off') + '|' + massStrokeColor + '|' + massStrokeWidth + (massFillBaked ? ('|' + massFill) : '');
    // Full key (includes color) — tracked to notice any change for the fast-flag refresh.
    const shortMassStroke = (t.shortMassStrokeOn === false ? 'off' : 'on') + '|' + (t.shortMassStroke || '#000000') + '|' + (t.shortMassStrokeWidth || 4);
    // Shape key — only the parts baked into cached textures (toggle + width).
    const shortMassStrokeShape = (t.shortMassStrokeOn === false ? 'off' : 'on') + '|' + (t.shortMassStrokeWidth || 4);
    if (_lastShortMass === null) _lastShortMass = shortMass;
    if (_lastMassFont === null) _lastMassFont = cur;
    if (_lastMassStroke === null) _lastMassStroke = massStroke;
    if (_lastShortMassStroke === null) _lastShortMassStroke = shortMassStroke;
    if (_lastShortMassStrokeShape === null) _lastShortMassStrokeShape = shortMassStrokeShape;
    if (cur !== _lastMassFont) {
      _lastMassFont = cur;
      if (window.__ryuRedrawFont) window.__ryuRedrawFont(cur);
    }
    if (shortMass !== _lastShortMass) {
      _lastShortMass = shortMass;
      if (window.__ryuRedrawFont) window.__ryuRedrawFont(cur);
      if (window.__ryuRedrawMass) window.__ryuRedrawMass();
    }
    // massStroke or short-mass stroke SHAPE changed → must rebuild cached sprites.
    // Anti-flicker fix: only rebuild the mass atlas when a baked shape changes
    // (font / toggle / stroke width / baked fill path). Color-only updates stay
    // on the live tint path so mass can recolor without destroying sprites.
    if (massStroke !== _lastMassStroke || shortMassStrokeShape !== _lastShortMassStrokeShape) {
      _lastMassStroke = massStroke;
      _lastShortMassStroke = shortMassStroke;
      _lastShortMassStrokeShape = shortMassStrokeShape;
      if (window.__ryuRedrawFont) window.__ryuRedrawFont(cur);
      if (window.__ryuRedrawMass) window.__ryuRedrawMass();
    } else if (shortMassStroke !== _lastShortMassStroke) {
      // Color-only change: update the tracked key so the next shape check stays
      // accurate, but do NOT call __ryuRedrawMass — the tint updates automatically.
      _lastShortMassStroke = shortMassStroke;
    }
  }
  globalThis.__ryuRefreshMassSettings = function(force) {
    invalidateThemeCache();
    refreshMassSettings(!!force);
  };
  window.addEventListener('storage', function(e) {
    if (!e || e.key === STORAGE_KEY) globalThis.__ryuRefreshMassSettings(false);
  });
  refreshMassSettings(true);
  setInterval(function() {
    if (document.hidden) return;
    syncFastThemeState(false);
    refreshMassSettings(false);
  }, 2000);

  // name font poll
  const NAME_FONTS = [
    'Titillium Web','Orbitron','Audiowide','Oxanium','Exo 2','Quantico',
    'Nova Square','Bebas Neue','Oswald','Russo One','Black Ops One','Teko',
    'Barlow Condensed','Boogaloo','Fredoka One','Permanent Marker','Bangers',
    'Righteous','Lilita One','Press Start 2P','Creepster','Abril Fatface',
    'Pacifico','Lobster','Monoton','Faster One','Gugi','Silkscreen','VT323'
  ];
  let _lastNameFont = null;
  let _lastUseDefault = null;
  let _lastLeftwardTagState = null;
  let _atlasClearTimer = null;
  let _patchedLeftwardAtlas = null;
  let _leftwardDecorTimer = null;

  function _patchLeftwardAtlasText() {
    if (globalThis.__ryuLocalLeftwardSourcePatch) return;
    var yt = globalThis.__Yt;
    if (!yt || typeof yt._4975 !== 'function') return;
    if (_patchedLeftwardAtlas === yt && yt._4975 && yt._4975._ryuLeftwardPatched) return;
    if (yt._4975 && yt._4975._ryuLeftwardPatched) {
      _patchedLeftwardAtlas = yt;
      return;
    }

    var original4975 = yt._4975;
    function patched4975(text) {
      var nextText = text;
      try {
        if (_ft_leftwardTag) {
          var combined = getCombinedLeftwardText(text);
          if (combined) nextText = ' ' + combined + ' ';
        }
      } catch (_) {}
      return original4975.apply(this, [nextText].concat(Array.prototype.slice.call(arguments, 1)));
    }

    patched4975._ryuLeftwardPatched = true;
    patched4975._ryuOriginal = original4975;
    yt._4975 = patched4975;
    _patchedLeftwardAtlas = yt;
  }

  function _hideNativeTagSpriteSiblings() {
    if (!_ft_leftwardTag || globalThis.__ryuLocalLeftwardSourcePatch) return;
    var yt = globalThis.__Yt;
    if (!yt || !yt._8662 || yt._8662.length === 0) return;
    var atlas = yt._8662[0];
    if (!atlas || !atlas._1327) return;

    function hideFromList(list) {
      if (!list || !list.forEach) return;
      list.forEach(function(entry) {
        try {
          var sprite = entry && entry._6548;
          var parent = sprite && sprite.parent;
          if (!parent || !parent.children || parent.children.length < 2) return;
          parent.children.forEach(function(child) {
            if (!child || child === sprite) return;
            if (child.children && child.children.length > 0) {
              child.visible = false;
              child.renderable = false;
            }
          });
        } catch (_) {}
      });
    }

    hideFromList(atlas._1327._3860);
    hideFromList(atlas._1327._9680);
  }

  function _scheduleLeftwardFallbackDecorations() {
    if (globalThis.__ryuLocalLeftwardSourcePatch) return;
    if (_leftwardDecorTimer !== null) {
      clearTimeout(_leftwardDecorTimer);
      _leftwardDecorTimer = null;
    }
    var attempts = 12;
    function run() {
      _leftwardDecorTimer = null;
      _patchLeftwardAtlasText();
      _hideNativeTagSpriteSiblings();
      if (globalThis.__ryuLocalLeftwardSourcePatch) return;
      var yt = globalThis.__Yt;
      var patched = !!(yt && yt._4975 && yt._4975._ryuLeftwardPatched);
      var ready = !!(yt && yt._8662 && yt._8662.length > 0 && yt._8662[0] && yt._8662[0]._1327);
      if ((patched && ready) || attempts-- <= 0) return;
      _leftwardDecorTimer = setTimeout(run, 250);
    }
    _leftwardDecorTimer = setTimeout(run, 50);
  }

  function _clearAtlas() {
    var yt = globalThis.__Yt;
    if (!yt) return false;
    var oldAtlases = Array.isArray(yt._8662) ? yt._8662.slice() : [];
    yt._8662 = [];
    yt._6656 = 0;
    oldAtlases.forEach(function(old) {
      if (!old) return;
      if (old._9720) old._9720.clear();
      // clear all cached name sprites so game re-renders with current font/text
      if (old._1327) {
        if (old._1327._3860) old._1327._3860.forEach(function(s) { if (s) s._6548 = null; });
        if (old._1327._9680) old._1327._9680.forEach(function(s) { if (s) s._6548 = null; });
      }
      if (typeof old._2984 === 'function') old._2984();
    });
    return true;
  }

  function _scheduleSingleAtlasClear() {
    if (_atlasClearTimer !== null) {
      clearTimeout(_atlasClearTimer);
      _atlasClearTimer = null;
    }
    _atlasClearTimer = setTimeout(function () {
      _atlasClearTimer = null;
      if (!_clearAtlas()) {
        _atlasClearTimer = setTimeout(function () {
          _atlasClearTimer = null;
          if (!_clearAtlas()) {
            _atlasClearTimer = setTimeout(function () {
              _atlasClearTimer = null;
              _clearAtlas();
              _scheduleLeftwardFallbackDecorations();
            }, 800);
          } else {
            _scheduleLeftwardFallbackDecorations();
          }
        }, 400);
      } else {
        _scheduleLeftwardFallbackDecorations();
      }
    }, 50);
  }

  // applies LeftWard Tags immediately so toggle changes do not flicker
  function _applyLeftwardTagState(enabled) {
    const next = !!enabled;
    invalidateThemeCache();
    _ft_leftwardTag = next;
    globalThis.__ryuHideNativeTag = next;
    _lastLeftwardTagState = next;
    _pendingLeftwardTags.length = 0;
    _recentPlayerNames.length = 0;
    _lastTagRect = null;
    if (_atlasClearTimer !== null) {
      clearTimeout(_atlasClearTimer);
      _atlasClearTimer = null;
    }
    if (_leftwardDecorTimer !== null) {
      clearTimeout(_leftwardDecorTimer);
      _leftwardDecorTimer = null;
    }
    _scheduleLeftwardFallbackDecorations();
  }

  function _applyHideFlagsState(enabled) {
    const next = !!enabled;
    invalidateThemeCache();
    _ft_hideFlags = next;
    _lastHideFlags = next;
    _pendingLeftwardTags.length = 0;
    _recentPlayerNames.length = 0;
    _lastTagRect = null;
    _scheduleLeftwardFallbackDecorations();
  }

  // wait for the game to build the atlas for the first time, then clear it
  // so it rebuilds with our font already set in __ryuNameFont
  function _startupAtlasClear() {
    var _t = loadTheme();
    if ((_t.fontIndex || 0) === 0 || !!_t.useDefault) return;
    var attempts = 0;
    function waitForAtlas() {
      var yt = globalThis.__Yt;
      if (yt && yt._8662 && yt._8662.length > 0) {
        _clearAtlas();
        _scheduleLeftwardFallbackDecorations();
        return;
      }
      if (attempts++ < 30) setTimeout(waitForAtlas, 200);
    }
    setTimeout(waitForAtlas, 200);
  }

  // exposed for manual redraw button in settings panel
  globalThis.__ryuForceAtlasClear = function() { _scheduleSingleAtlasClear(); };
  globalThis.__ryuRefreshNameSettings = function() {
    invalidateThemeCache();
    syncFastThemeState(false);
  };
  globalThis.__ryuApplyLeftwardTagState = _applyLeftwardTagState;
  globalThis.__ryuApplyHideFlagsState = _applyHideFlagsState;

  // OPT 4: use cached fast flags for atlas/font watching and poll less often.
  setInterval(function() {
    const cur = _ft_fontIndex;
    const useDefault = _ft_useDefault;
    const leftwardTag = _ft_leftwardTag;
    globalThis.__ryuHideNativeTag = leftwardTag;
    if (_lastNameFont === null) {
      globalThis.__ryuNameFont = NAME_FONTS[cur] || 'Titillium Web';
      _lastNameFont = cur;
      _lastUseDefault = useDefault;
      _lastLeftwardTagState = leftwardTag;
      if (cur > 0 && !useDefault) _startupAtlasClear();
      return;
    }
    // Anti-flicker fix: font / leftward-tag / default-mode changes update the
    // cached name-state inputs in place instead of forcing a full name-atlas
    // clear here. That keeps names visible while the renderer swaps to new
    // atlas entries instead of blinking off between refreshes.
    if (cur !== _lastNameFont || useDefault !== _lastUseDefault || leftwardTag !== _lastLeftwardTagState) {
      const leftwardChanged = leftwardTag !== _lastLeftwardTagState;
      _lastNameFont = cur;
      _lastUseDefault = useDefault;
      _lastLeftwardTagState = leftwardTag;
      globalThis.__ryuNameFont = NAME_FONTS[cur] || 'Titillium Web';
      if (leftwardChanged) {
        _pendingLeftwardTags.length = 0;
        _recentPlayerNames.length = 0;
        _lastTagRect = null;
        _scheduleLeftwardFallbackDecorations();
      }
    }
  }, 250);

  _scheduleLeftwardFallbackDecorations();

  // hide flags poll
  let _lastHideFlags = null;
  setInterval(function() {
    const cur = !!_ft_hideFlags;
    if (_lastHideFlags === null) { _lastHideFlags = cur; return; }
    // Hide-flags also avoids a hard name-atlas wipe now; only the small native
    // fallback text state is refreshed so toggling flags does not blink names.
    if (cur !== _lastHideFlags) {
      _lastHideFlags = cur;
      _scheduleSingleAtlasClear();
    }
  }, 500);

  // commander text poll
  let _lastCommanderText = null;
  let _lastCommanderImgur = null;
  let _lastCommanderMode = null;
  let _lastCommanderSpam = null;
  setInterval(function() {
    const t = loadTheme();
    const cur = t.commanderText || '';
    const img = String(t.commanderImgur || '').trim();
    const mode = t.commanderMode || 'text';
    const spam = t.commanderSpamOn !== false;
    if (_lastCommanderText === null) {
      globalThis.__ryuCommanderText = cur;
      globalThis.__ryuCommanderImgur = img;
      globalThis.__ryuCommanderMode = mode;
      globalThis.__ryuCommanderSpamOn = spam;
      _lastCommanderText = cur;
      _lastCommanderImgur = img;
      _lastCommanderMode = mode;
      _lastCommanderSpam = spam;
      return;
    }
    if (cur !== _lastCommanderText) {
      _lastCommanderText = cur;
      globalThis.__ryuCommanderText = cur;
    }
    if (img !== _lastCommanderImgur) {
      _lastCommanderImgur = img;
      globalThis.__ryuCommanderImgur = img;
    }
    if (mode !== _lastCommanderMode) {
      _lastCommanderMode = mode;
      globalThis.__ryuCommanderMode = mode;
    }
    if (spam !== _lastCommanderSpam) {
      _lastCommanderSpam = spam;
      globalThis.__ryuCommanderSpamOn = spam;
    }
  }, 500);

  // animation softening poll
  let _lastAnimSoften = null;
  setInterval(function() {
    const t = loadTheme();
    if (!t.animSoftenOn) {
      if (_lastAnimSoften !== null) {
        _lastAnimSoften = null;
        if (globalThis.__Q && globalThis.__Q.ELEMENT_ANIMATION_SOFTENING)
          globalThis.__Q.ELEMENT_ANIMATION_SOFTENING._5738 = 80;
      }
      return;
    }
    const cur = t.animSoftenVal ?? 80;
    if (cur !== _lastAnimSoften) {
      // only apply once __Q is ready — poll will retry
      if (globalThis.__Q && globalThis.__Q.ELEMENT_ANIMATION_SOFTENING) {
        globalThis.__Q.ELEMENT_ANIMATION_SOFTENING._5738 = cur;
        _lastAnimSoften = cur;
      }
    }
  }, 500);

  // ejected mass pellet color poll
  (function() {
    // maps pellet id → assigned rgb so we can re-apply every tick and beat renderer overwrites
    const _pelletColors = new Map();
    let _pelletTimer = null;

    function hueToRgb(hue) {
      return {
        r: Math.floor(127 * Math.sin(hue)     + 128),
        g: Math.floor(127 * Math.sin(hue + 2) + 128),
        b: Math.floor(127 * Math.sin(hue + 4) + 128)
      };
    }

    function applyRgb(cell, rgb) {
      cell._6728._9568 = rgb.r;
      cell._6728._5294 = rgb.g;
      cell._6728._1754 = rgb.b;
    }

    function tickPellets() {
      if (!globalThis.__ne || !globalThis.__ne._2430) return;

      const liveIds = _ft_rainbowPelletOn ? new Set() : null;
      const solidRgb = _ft_pelletRgb;

      for (const cell of globalThis.__ne._2430.values()) {
        if (cell._7926 !== 2) continue;

        const id = cell._9782;
        if (liveIds) liveIds.add(id);

        if (_ft_rainbowPelletOn) {
          // assign a unique random color on first sight, then re-apply every tick
          if (!_pelletColors.has(id)) {
            _pelletColors.set(id, hueToRgb(Math.random() * Math.PI * 2));
          }
          applyRgb(cell, _pelletColors.get(id));
        } else {
          // solid color — always apply so it persists even if native color fights back
          applyRgb(cell, solidRgb);
        }
      }

      // remove ids for pellets that no longer exist in the cell map
      if (liveIds) {
        for (const id of _pelletColors.keys()) {
          if (!liveIds.has(id)) _pelletColors.delete(id);
        }
      } else if (_pelletColors.size) {
        _pelletColors.clear();
      }
    }

    setInterval(function() {
      if (_ft_pelletColorOn) {
        if (_pelletTimer === null) {
          _pelletTimer = setInterval(tickPellets, 50);
          tickPellets();
        }
      } else {
        if (_pelletTimer !== null) {
          clearInterval(_pelletTimer);
          _pelletTimer = null;
        }
        if (_pelletColors.size) _pelletColors.clear();
      }
    }, 250);
  })();

  // chat name color broadcast poll
  let _lastBroadcastColor = null;
  setInterval(function() {
    const t = loadTheme();
    const color = t.chatNameColor || null;
    if (color === _lastBroadcastColor) return;
    _lastBroadcastColor = color;
    // update own entry in color map
    const myName = document.getElementById('mame-trb-user-data-username');
    if (myName && color) {
      globalThis.__ryuUserColors[myName.textContent.trim()] = color;
    }
    if (globalThis.__ryuBroadcastColor) globalThis.__ryuBroadcastColor();
    // re-colorize any already-visible messages
    document.querySelectorAll('.chbx-message-sender').forEach(function(el) {
      el._ryuColored = false;
    });
    document.querySelectorAll('.chbx-message').forEach(function(msgEl) {
      const senderEl = msgEl.querySelector('.chbx-message-sender');
      if (!senderEl) return;
      const name = senderEl.textContent.trim().replace(/:$/, '');
      const c = globalThis.__ryuUserColors[name] || null;
      if (!c) return;
      senderEl._ryuColored = true;
      senderEl.style.setProperty('color', c, 'important');
      senderEl.style.setProperty('text-shadow', '0 0 8px ' + c, 'important');
    });
  }, 500);


  // rainbow border + glow animation
  (function() {
    let _timer      = null;
    let _hue        = Math.random() * Math.PI * 2;
    let _lastBorder = -1;
    let _lastGlow   = -1;

    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

    function sineColor(hue) {
      const r = Math.floor(127 * Math.sin(hue)     + 128);
      const g = Math.floor(127 * Math.sin(hue + 2) + 128);
      const b = Math.floor(127 * Math.sin(hue + 4) + 128);
      return (r << 16) | (g << 8) | b;
    }

    function tick() {
      const t = loadTheme();
      if (t.useDefault || globalThis.__ryuAgarMap || (!t.rainbowBorderOn && !t.rainbowGlowOn)) {
        clearInterval(_timer); _timer = null; return;
      }
      // use whichever speed is faster if both are active
      let speed = 0;
      if (t.rainbowBorderOn) speed = Math.max(speed, clamp(Number(t.rainbowBorderSpeed) || 240, 5, 360));
      if (t.rainbowGlowOn)   speed = Math.max(speed, clamp(Number(t.rainbowGlowSpeed)   || 240, 5, 360));
      _hue += speed / 500;

      const color = sineColor(_hue);

      if (t.rainbowBorderOn && color !== _lastBorder) {
        _lastBorder = color;
        try {
          if (globalThis.__Q && globalThis.__Q.BORDER_COLOR) {
            globalThis.__Q.BORDER_COLOR._5738 = color;
            const ls = globalThis.__Q.BORDER_COLOR._8452 && globalThis.__Q.BORDER_COLOR._8452.get && globalThis.__Q.BORDER_COLOR._8452.get('change');
            if (ls) for (const l of ls) { try { l._5363(); } catch(_) {} }
          }
        } catch(_) {}
      }

      if (t.rainbowGlowOn && color !== _lastGlow) {
        _lastGlow = color;
        try {
          if (globalThis.__Q && globalThis.__Q.BORDER_GLOW_COLOR) {
            globalThis.__Q.BORDER_GLOW_COLOR._5738 = (0x64 << 24) | color;
            const ls = globalThis.__Q.BORDER_GLOW_COLOR._8452 && globalThis.__Q.BORDER_GLOW_COLOR._8452.get && globalThis.__Q.BORDER_GLOW_COLOR._8452.get('change');
            if (ls) for (const l of ls) { try { l._5363(); } catch(_) {} }
          }
        } catch(_) {}
      }
    }

    function ensureRunning() {
      const t = loadTheme();
      const active = !t.useDefault && !globalThis.__ryuAgarMap && (t.rainbowBorderOn || t.rainbowGlowOn);
      if (active) {
        if (!_timer) { _timer = setInterval(tick, 50); tick(); }
      } else {
        clearInterval(_timer); _timer = null;
      }
    }

    setInterval(ensureRunning, 500);
    ensureRunning();
  })();

  // Agar.io map controller: a simple state machine that snapshots the native
  // background once, swaps between two baked map textures, and restores the
  // original world background when Agar map is disabled.
  (function() {
    var LIGHT = {
      bgHex: '#ffffff',
      bgValue: 0xffffff,
      imageTint: 0xffffff,
      fine: 'rgba(0,0,0,0.14)',
      major: 'rgba(0,0,0,0.24)',
      border: 0xffffff
    };
    var DARK = {
      bgHex: '#101010',
      bgValue: 0x101010,
      imageTint: 0xffffff,
      fine: 'rgba(196,196,196,0.22)',
      major: 'rgba(196,196,196,0.22)',
      border: 0x101010
    };

    var _snapshot = null;
    var _appliedSig = '';
    var _dirty = true;
    var _urlCache = { light: '', dark: '' };
    var _lastDebug = null;
    var _mapThemeCacheRaw = null;
    var _mapThemeCache = null;
    var _styleId = 'ryu-agar-map-dark-surround-style';

    function ensureDarkSurroundStyle() {
      if (document.getElementById(_styleId)) return;
      var style = document.createElement('style');
      style.id = _styleId;
      style.textContent = [
        'html body.ryu-agar-map-dark-surround { background: #101010 !important; }',
        'html body.ryu-agar-map-dark-ui { background: #101010 !important; }',
        'body.ryu-agar-map-dark-surround::before { content: ""; position: fixed; inset: 0; background: #101010; pointer-events: none; z-index: -1; }',
        'body.ryu-agar-map-dark-surround > canvas { background: #101010 !important; }',
        'body.ryu-agar-map-dark-surround [class*="canvas"], body.ryu-agar-map-dark-surround [id*="canvas"] { background: #101010 !important; }',
        'body.ryu-agar-map-dark-surround #main-canvas { background: #101010 !important; }',
        'body.ryu-agar-map-dark-surround #huds { background: transparent !important; }',
        'body.ryu-agar-map-dark-ui #movement-stopped { color: rgba(255,255,255,0.96) !important; background: rgba(10,10,10,0.84) !important; border: 1px solid rgba(255,255,255,0.14) !important; box-shadow: 0 6px 24px rgba(0,0,0,0.24) !important; text-shadow: none !important; }'
      ].join('\n');
      (document.head || document.documentElement).appendChild(style);
    }

    function syncDarkSurround(state) {
      if (!document.body) return;
      ensureDarkSurroundStyle();
      var enabled = !!(state && state.on && !state.blocked && state.dark);
      document.body.classList.toggle('ryu-agar-map-dark-surround', enabled);
      document.body.classList.toggle('ryu-agar-map-dark-ui', enabled);
    }

    function emit(slot) {
      try {
        var ls = slot && slot._8452 && slot._8452.get && slot._8452.get('change');
        if (ls) for (var l of ls) { try { l._5363 ? l._5363() : l(slot._5738); } catch(_) {} }
      } catch(_) {}
    }

    function writeSlot(slot, value, rawOnly) {
      if (!slot) return false;
      try {
        if (!rawOnly && typeof slot._7531 === 'function') slot._7531(value);
      } catch(_) {}
      try {
        slot._5738 = value;
        emit(slot);
        return true;
      } catch(_) {}
      return false;
    }

    function readMapState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY) || '{}';
        if (raw !== _mapThemeCacheRaw) {
          _mapThemeCacheRaw = raw;
          _mapThemeCache = JSON.parse(raw) || {};
        }
        var t = _mapThemeCache || {};
        var darkMirror = localStorage.getItem('ryuAgarMapDark');
        if (darkMirror === '1' || darkMirror === '0') t.agarDarkModeOn = darkMirror === '1';
        var mapOn = !t.useDefault && !!t.agarModeOn && (!!t.agarMapOn || !!t.agarMapModeOn);
        var darkOn = !!(t.agarDarkModeOn !== undefined ? t.agarDarkModeOn : t.agarMapDark);
        globalThis.__ryuAgarMap = mapOn;
        globalThis.__ryuAgarMapDark = darkOn;
        return { on: mapOn, dark: darkOn, blocked: !!_ft_sectorOverlayOn, theme: t };
      } catch(_) {
        _mapThemeCacheRaw = null;
        _mapThemeCache = null;
        return {
          on: !!globalThis.__ryuAgarMap,
          dark: !!globalThis.__ryuAgarMapDark,
          blocked: !!_ft_sectorOverlayOn,
          theme: {}
        };
      }
    }

    function stateSignature(state) {
      if (!state.on || state.blocked) return 'off';
      return state.dark ? 'dark' : 'light';
    }

    function paletteFor(dark) {
      return dark ? DARK : LIGHT;
    }

    function renderGridUrl(dark) {
      var key = dark ? 'dark' : 'light';
      if (_urlCache[key]) return _urlCache[key];

      var palette = paletteFor(dark);
      var size = 2048;
      var cv = document.createElement('canvas');
      cv.width = size;
      cv.height = size;
      var ctx = cv.getContext('2d');

      ctx.fillStyle = palette.bgHex;
      ctx.fillRect(0, 0, size, size);

      var fine = size / 25;
      ctx.strokeStyle = palette.fine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i <= 25; i++) {
        var p = Math.round(i * fine) + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
      }
      ctx.stroke();

      var major = size / 5;
      ctx.strokeStyle = palette.major;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var j = 0; j <= 5; j++) {
        var q = Math.round(j * major) + 0.5;
        ctx.moveTo(q, 0);
        ctx.lineTo(q, size);
        ctx.moveTo(0, q);
        ctx.lineTo(size, q);
      }
      ctx.stroke();

      _urlCache[key] = cv.toDataURL('image/png');
      return _urlCache[key];
    }

    function snapshotNative(Q) {
      if (_snapshot) return;
      _snapshot = {
        backgroundUrl: Q.BACKGROUND_IMAGE_URL ? (Q.BACKGROUND_IMAGE_URL._5738 || '') : '',
        worldBackgroundImage: Q.WORLD_BACKGROUND_IMAGE ? !!Q.WORLD_BACKGROUND_IMAGE._5738 : false,
        backgroundColor: Q.BACKGROUND_COLOR ? Q.BACKGROUND_COLOR._5738 : undefined,
        backgroundImageColor: Q.BACKGROUND_IMAGE_COLOR ? Q.BACKGROUND_IMAGE_COLOR._5738 : undefined,
        borderColor: Q.BORDER_COLOR ? Q.BORDER_COLOR._5738 : undefined,
        borderGlowColor: Q.BORDER_GLOW_COLOR ? Q.BORDER_GLOW_COLOR._5738 : undefined,
        borderSize: Q.BORDER_SIZE ? Q.BORDER_SIZE._5738 : undefined
      };
    }

    function restoreNative(Q) {
      if (!_snapshot) return;
      if (Q.BACKGROUND_IMAGE_URL) writeSlot(Q.BACKGROUND_IMAGE_URL, _snapshot.backgroundUrl || '');
      if (Q.WORLD_BACKGROUND_IMAGE) writeSlot(Q.WORLD_BACKGROUND_IMAGE, !!_snapshot.worldBackgroundImage);
      if (Q.BACKGROUND_COLOR && _snapshot.backgroundColor !== undefined) writeSlot(Q.BACKGROUND_COLOR, _snapshot.backgroundColor, true);
      if (Q.BACKGROUND_IMAGE_COLOR && _snapshot.backgroundImageColor !== undefined) writeSlot(Q.BACKGROUND_IMAGE_COLOR, _snapshot.backgroundImageColor, true);
      if (Q.BORDER_COLOR && _snapshot.borderColor !== undefined) writeSlot(Q.BORDER_COLOR, _snapshot.borderColor);
      if (Q.BORDER_GLOW_COLOR && _snapshot.borderGlowColor !== undefined) writeSlot(Q.BORDER_GLOW_COLOR, _snapshot.borderGlowColor);
      if (Q.BORDER_SIZE && _snapshot.borderSize !== undefined) writeSlot(Q.BORDER_SIZE, _snapshot.borderSize);
      _snapshot = null;
      _appliedSig = '';
      syncDarkSurround({ on: false, dark: false, blocked: false });
    }

    function applyVariant(Q, state) {
      var palette = paletteFor(state.dark);

      snapshotNative(Q);

      // The patched renderer now owns the Agar map texture. While Agar map is
      // active we disable the native world background layer entirely so it
      // cannot bleed through or restore a mismatched grid during toggles.
      if (Q.BACKGROUND_IMAGE_URL) writeSlot(Q.BACKGROUND_IMAGE_URL, '');
      if (Q.WORLD_BACKGROUND_IMAGE) writeSlot(Q.WORLD_BACKGROUND_IMAGE, false);
      if (Q.BORDER_COLOR) writeSlot(Q.BORDER_COLOR, palette.border);
      if (Q.BORDER_GLOW_COLOR) writeSlot(Q.BORDER_GLOW_COLOR, 0x00ffffff);
      if (Q.BORDER_SIZE) writeSlot(Q.BORDER_SIZE, 0);

      _appliedSig = stateSignature(state);
      _lastDebug = {
        on: !!state.on,
        dark: !!state.dark,
        blocked: !!state.blocked,
        renderer: 'patched-texture-with-native-bg-suppressed',
        signature: _appliedSig,
        urlLength: 0,
        backgroundColor: Q.BACKGROUND_COLOR && Q.BACKGROUND_COLOR._5738,
        backgroundImageColor: Q.BACKGROUND_IMAGE_COLOR && Q.BACKGROUND_IMAGE_COLOR._5738,
        borderColor: Q.BORDER_COLOR && Q.BORDER_COLOR._5738,
        borderGlowColor: Q.BORDER_GLOW_COLOR && Q.BORDER_GLOW_COLOR._5738,
        worldBackgroundImage: Q.WORLD_BACKGROUND_IMAGE && Q.WORLD_BACKGROUND_IMAGE._5738
      };
      syncDarkSurround(state);
    }

    function syncAgarMapVisuals() {
      try {
        var Q = globalThis.__Q;
        if (!Q) return;

        var state = readMapState();
        if (state.blocked) {
          // World sectors also own the native background-image slots.
          // When sectors are active, do not restore the native background here
          // or it will stomp the sector grid between refresh intervals.
          syncDarkSurround(state);
          _dirty = false;
          return;
        }
        var desiredSig = stateSignature(state);

        if (desiredSig === 'off') {
          if (_snapshot || _appliedSig) restoreNative(Q);
          syncDarkSurround(state);
          _dirty = false;
          return;
        }

        if (!_dirty && desiredSig === _appliedSig) return;
        applyVariant(Q, state);
        _dirty = false;
      } catch(_) {}
    }

    globalThis.__ryuRefreshAgarMapBackground = function() {
      _dirty = true;
      syncAgarMapVisuals();
      setTimeout(syncAgarMapVisuals, 80);
    };

    globalThis.__ryuDebugAgarMapState = function() {
      var state = readMapState();
      var Q = globalThis.__Q;
      var dump = {
        stored: {
          useDefault: !!state.theme.useDefault,
          agarModeOn: !!state.theme.agarModeOn,
          agarMapOn: !!state.theme.agarMapOn,
          agarMapModeOn: !!state.theme.agarMapModeOn,
          agarDarkModeOn: !!(state.theme.agarDarkModeOn !== undefined ? state.theme.agarDarkModeOn : state.theme.agarMapDark),
          darkMirror: localStorage.getItem('ryuAgarMapDark')
        },
        runtime: {
          agarMap: !!state.on,
          agarMapDark: !!state.dark,
          sectorOverlayOn: !!state.blocked,
          appliedSignature: _appliedSig,
          dirty: !!_dirty,
          snapshotted: !!_snapshot
        },
        slots: Q ? {
          backgroundImageUrl: Q.BACKGROUND_IMAGE_URL && Q.BACKGROUND_IMAGE_URL._5738,
          worldBackgroundImage: Q.WORLD_BACKGROUND_IMAGE && Q.WORLD_BACKGROUND_IMAGE._5738,
          backgroundColor: Q.BACKGROUND_COLOR && Q.BACKGROUND_COLOR._5738,
          backgroundImageColor: Q.BACKGROUND_IMAGE_COLOR && Q.BACKGROUND_IMAGE_COLOR._5738,
          borderColor: Q.BORDER_COLOR && Q.BORDER_COLOR._5738,
          borderGlowColor: Q.BORDER_GLOW_COLOR && Q.BORDER_GLOW_COLOR._5738,
          borderSize: Q.BORDER_SIZE && Q.BORDER_SIZE._5738
        } : null,
        lastDebug: _lastDebug
      };
      console.log('[RyuTheme AgarMap state]', dump);
      return dump;
    };

    globalThis.__ryuDebugAgarMap = function(forceDark) {
      if (forceDark !== undefined) {
        var t = readMapState().theme || {};
        t.agarDarkModeOn = !!forceDark;
        t.agarMapDark = !!forceDark;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
        localStorage.setItem('ryuAgarMapDark', forceDark ? '1' : '0');
        invalidateThemeCache();
      }
      globalThis.__ryuRefreshAgarMapBackground();
      setTimeout(function() { console.log('[RyuTheme AgarMap]', _lastDebug); }, 60);
      return _lastDebug;
    };

    globalThis.__ryuTraceAgarMapToggle = function(enabled) {
      globalThis.__ryuAgarMapDebugEnabled = enabled !== false;
      console.log('[RyuTheme AgarMap trace]', globalThis.__ryuAgarMapDebugEnabled ? 'enabled' : 'disabled');
      return globalThis.__ryuAgarMapDebugEnabled;
    };

    setInterval(syncAgarMapVisuals, 400);
  })();

  // World sectors: native background image layer. This avoids screen-space
  // vibration and only rebuilds the image when the sector style changes.
  (function() {
    var _sectorOn = false;
    var _saved = null;
    var _url = '';
    var _sig = '';
    var _refreshTimer = null;

    function emit(slot) {
      try {
        var ls = slot && slot._8452 && slot._8452.get && slot._8452.get('change');
        if (ls) for (var l of ls) { try { l._5363 ? l._5363() : l(slot._5738); } catch(_) {} }
      } catch(_) {}
    }

    function sig(t) {
      return (t.sectorLabelColor || '#ffffff') + '|' + (t.sectorGridColor || '#b4b4b4') + '|' + (t.sectorFont || 0);
    }

    function buildUrl(t) {
      var labelColor = t.sectorLabelColor || '#ffffff';
      var gridColor = t.sectorGridColor || '#b4b4b4';
      var fontIdx = t.sectorFont || 0;
      var fontName = fontIdx > 0 && FONTS[fontIdx] ? FONTS[fontIdx].value : 'Noto Sans';
      var size = 2048;
      var cv = document.createElement('canvas');
      cv.width = size;
      cv.height = size;
      var ctx = cv.getContext('2d');
      var cell = size / 5;
      var letters = 'ABCDE';

      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      for (var i = 0; i <= 5; i++) {
        var p = Math.round(i * cell) + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
      }
      ctx.stroke();

      ctx.globalAlpha = 0.78;
      ctx.fillStyle = labelColor;
      ctx.font = '700 150px "' + fontName + '", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var c = 0; c < 5; c++) {
        for (var r = 0; r < 5; r++) {
          ctx.fillText(letters[c] + (r + 1), (c + 0.5) * cell, (r + 0.5) * cell);
        }
      }
      return cv.toDataURL('image/png');
    }

    function rememberCurrent(Q) {
      if (_saved) return;
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem('ryuSectorSavedBg') || 'null'); } catch(e) {}
      _saved = saved || {
        url: Q.BACKGROUND_IMAGE_URL._5738 || '',
        bgOn: !!Q.WORLD_BACKGROUND_IMAGE._5738,
        imgColor: Q.BACKGROUND_IMAGE_COLOR ? Q.BACKGROUND_IMAGE_COLOR._5738 : 0xffffff
      };
      try { localStorage.setItem('ryuSectorSavedBg', JSON.stringify(_saved)); } catch(e) {}
    }

    function applyGrid(force) {
      var t = loadTheme();
      var Q = globalThis.__Q;
      if (!Q || !Q.BACKGROUND_IMAGE_URL || !Q.WORLD_BACKGROUND_IMAGE) return false;
      rememberCurrent(Q);
      var nextSig = sig(t);
      if (force || nextSig !== _sig || !_url) {
        _url = buildUrl(t);
        _sig = nextSig;
      }
      if (Q.BACKGROUND_IMAGE_URL._5738 !== _url) {
        Q.BACKGROUND_IMAGE_URL._5738 = _url;
        emit(Q.BACKGROUND_IMAGE_URL);
      }
      if (Q.WORLD_BACKGROUND_IMAGE._5738 !== true) {
        Q.WORLD_BACKGROUND_IMAGE._5738 = true;
        emit(Q.WORLD_BACKGROUND_IMAGE);
      }
      // force white tint, renderer multiplies texture by BACKGROUND_IMAGE_COLOR
      if (Q.BACKGROUND_IMAGE_COLOR && Q.BACKGROUND_IMAGE_COLOR._5738 !== 0xffffff) {
        Q.BACKGROUND_IMAGE_COLOR._5738 = 0xffffff;
        emit(Q.BACKGROUND_IMAGE_COLOR);
      }
      _sectorOn = true;
      return true;
    }

    function restoreGrid() {
      var Q = globalThis.__Q;
      if (!Q || !Q.BACKGROUND_IMAGE_URL || !Q.WORLD_BACKGROUND_IMAGE || !_sectorOn) return;
      if (!_saved) {
        try { _saved = JSON.parse(localStorage.getItem('ryuSectorSavedBg') || 'null'); } catch(e) {}
      }
      Q.BACKGROUND_IMAGE_URL._5738 = (_saved && _saved.url) || '';
      Q.WORLD_BACKGROUND_IMAGE._5738 = _saved ? !!_saved.bgOn : false;
      if (Q.BACKGROUND_IMAGE_COLOR && _saved && _saved.imgColor !== undefined) {
        Q.BACKGROUND_IMAGE_COLOR._5738 = _saved.imgColor;
        emit(Q.BACKGROUND_IMAGE_COLOR);
      }
      emit(Q.BACKGROUND_IMAGE_URL);
      emit(Q.WORLD_BACKGROUND_IMAGE);
      if (globalThis.__ryuRefreshWorldBackground) globalThis.__ryuRefreshWorldBackground();
      try { localStorage.removeItem('ryuSectorSavedBg'); } catch(e) {}
      _saved = null;
      _sectorOn = false;
    }

    globalThis.__ryuRefreshSectorGrid = function() {
      if (_refreshTimer) clearTimeout(_refreshTimer);
      _refreshTimer = setTimeout(function() {
        _refreshTimer = null;
        try {
          invalidateThemeCache();
          var t = loadTheme();
          if (!t.useDefault && t.sectorOverlayOn) applyGrid(true);
        } catch(e) {}
      }, 80);
    };

    setInterval(function() {
      try {
        var old = document.getElementById('ryu-sector-overlay');
        if (old) old.remove();

        var t = loadTheme();
        var on = !t.useDefault && !!t.sectorOverlayOn;
        if (on) applyGrid(false);
        else restoreGrid();
      } catch(_) {}
    }, 500);
  })();

  // ---- GAMEPLAY TWEAKS ----

  // overlay canvas for danger indicators
  (function() {
    var _resizeBound = false;

    function positionOverlay(canvas, mc) {
      const rect = mc.getBoundingClientRect();
      canvas.style.left = rect.left + 'px';
      canvas.style.top  = rect.top  + 'px';
      if (canvas.width  !== rect.width)  canvas.width  = rect.width;
      if (canvas.height !== rect.height) canvas.height = rect.height;
    }

    function syncOverlay() {
      const canvas = document.getElementById('ryu-danger-overlay');
      const mc = document.getElementById('main-canvas');
      if (canvas && mc) positionOverlay(canvas, mc);
    }

    function createOverlay() {
      if (document.getElementById('ryu-danger-overlay')) return true;
      const mc = document.getElementById('main-canvas');
      if (!mc) return false;
      const canvas = document.createElement('canvas');
      canvas.id = 'ryu-danger-overlay';
      canvas.style.cssText = 'position:fixed;pointer-events:none;z-index:9998;';
      document.body.appendChild(canvas);
      positionOverlay(canvas, mc);
      if (!_resizeBound) {
        window.addEventListener('resize', syncOverlay, { passive: true });
        _resizeBound = true;
      }
      return true;
    }

    setInterval(function() {
      if (_ft_dangerIndicatorOn) {
        createOverlay();
      } else {
        const canvas = document.getElementById('ryu-danger-overlay');
        if (canvas) canvas.remove();
      }
    }, 500);
  })();

 // danger indicator
  (function() {
    const EAT_THRESHOLD = 1.35;
    const PI2 = Math.PI * 2;

    let _mc     = null;
    let _canvas = null;
    let _ctx    = null;
    let _rect   = null;
    let _dangerWasOn = false;
    let _cachedMyMaxRadius = 0;

    function refreshCache() {
      _mc     = document.getElementById('main-canvas');
      _canvas = document.getElementById('ryu-danger-overlay');
      if (!_mc || !_canvas) return;
      _ctx  = _canvas.getContext('2d');
      _rect = _mc.getBoundingClientRect();
      _canvas.style.left = _rect.left + 'px';
      _canvas.style.top  = _rect.top  + 'px';
      if (_canvas.width  !== _rect.width)  _canvas.width  = _rect.width;
      if (_canvas.height !== _rect.height) _canvas.height = _rect.height;
    }

    window.addEventListener('resize', refreshCache, { passive: true });

    function canEat(myRadius, theirRadius) {
      const myMass    = (myRadius * myRadius) / 100;
      const theirMass = (theirRadius * theirRadius) / 100;
      return myMass >= theirMass * EAT_THRESHOLD;
    }

    function drawFrame() {
      if (_ft_dangerIndicatorOn && (!_canvas || !_canvas.isConnected)) refreshCache();
      if (!_canvas || !_ctx || !_mc) return;

      if (isRyuUiBlockingActive() || !_ft_dangerIndicatorOn) {
        if (_dangerWasOn) {
          _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
          _dangerWasOn = false;
        }
        return;
      }
      _dangerWasOn = true;

      // sync canvas size without getBoundingClientRect every frame
      if (_canvas.width  !== _mc.width)  _canvas.width  = _mc.width;
      if (_canvas.height !== _mc.height) _canvas.height = _mc.height;

      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      const ne = globalThis.__ne;
      const Be = globalThis.__Be;
      const z  = globalThis.__z_;
      if (!ne || !Be || !z) return;

      const myPlayer = Be._1059;
      if (!myPlayer) return;

      const zoom   = z._4336;
      const camX   = z._3852._7847;
      const camY   = z._3852._9202;
      const cx     = _mc.width  / 2;
      const cy     = _mc.height / 2;
      const scaleX = _rect ? _rect.width  / _mc.width  : 1;
      const scaleY = _rect ? _rect.height / _mc.height : 1;

      // cache these so we're not hitting theme storage inside the cell loop
      const showBlue   = _ft_dangerShowBlue;
      const showGreen  = _ft_dangerShowGreen;
      const showRed    = _ft_dangerShowRed;
      const showYellow = _ft_dangerShowYellow;

      // Use previous frame's myMaxRadius for color decisions; update it this pass.
      // Single ne._2430 iteration handles both own-radius tracking and enemy drawing.
      const prevMax = _cachedMyMaxRadius;
      let newMax = 0;

      _ctx.lineWidth = 5;

      for (const cell of ne._2430.values()) {
        if (cell._9491) continue;
        if (cell._2182 && cell._2182._1059 === myPlayer) {
          if (cell._1904 > newMax) newMax = cell._1904;
          continue;
        }
        if (cell._7926 !== 1) continue;

        const theirR  = cell._1904;

        let color;
        if (prevMax === 0) {
          if (!showYellow) continue;
          color = 'rgba(255,255,0,1.0)';
        } else if (canEat(prevMax * 0.707, theirR)) {
          if (!showBlue) continue;
          color = 'rgba(80,140,255,1.0)';
        } else if (canEat(prevMax, theirR)) {
          if (!showGreen) continue;
          color = 'rgba(0,255,80,1.0)';
        } else if (canEat(theirR, prevMax)) {
          if (!showRed) continue;
          color = 'rgba(255,40,40,1.0)';
        } else {
          if (!showYellow) continue;
          color = 'rgba(255,200,0,1.0)';
        }

        const sx      = ((cell._7847 - camX) * zoom + cx) * scaleX;
        const sy      = ((cell._9202 - camY) * zoom + cy) * scaleY;
        const screenR = theirR * zoom * scaleY * 1.02;

        _ctx.beginPath();
        _ctx.arc(sx, sy, screenR, 0, PI2);
        _ctx.strokeStyle = color;
        _ctx.stroke();
      }

      _cachedMyMaxRadius = newMax;
    }

    function waitAndInit() {
      if (!globalThis.__ne || !globalThis.__z_ || !globalThis.__X_) {
        setTimeout(waitAndInit, 500); return;
      }
      if (!globalThis.__X_._1855 || !globalThis.__X_._1855.runners) {
        setTimeout(waitAndInit, 500); return;
      }
      if (!_ft_dangerIndicatorOn || !document.getElementById('ryu-danger-overlay')) {
        setTimeout(waitAndInit, 500); return;
      }
      refreshCache();
      globalThis.__X_._1855.runners.postrender.add({ postrender: drawFrame });
    }
    waitAndInit();
  })();

  // 3D sphere overlay — handled by worker filter patch on cell sprites directly

  // minimal mode — hides UI elements based on sub-options
  (function() {
    var _minimalActive = false;
    var _prevCSS = '';
    var _prevEnemy = null;
    var _prevOwn = null;
    var STYLE_ID = 'ryu-minimal-mode-style';

    function buildCSS() {
      var parts = [];
      if (_ft_mmHideLB) parts.push('#leaderboard{display:none!important;}');
      if (_ft_mmHideChat) parts.push('#chatbox{display:none!important;}');
      if (_ft_mmHideMinimap) parts.push('.huds-bottom-right{display:none!important;}.mame-brb-team{display:none!important;}.huds-bottom-left{display:none!important;}');
      return parts.join('');
    }

    function setNativeNameToggle(label, wantVisible) {
      var allRows = document.querySelectorAll('.sm-row');
      for (var i = 0; i < allRows.length; i++) {
        var ne = allRows[i].querySelector('.sm-setting-name');
        if (!ne || ne.textContent.trim() !== label) continue;
        var tog = allRows[i].querySelector('.sm-toggle');
        if (!tog) break;
        var isOn = !!tog.querySelector('.sm-toggle__slider--active');
        if (wantVisible && !isOn) tog.click();
        if (!wantVisible && isOn) tog.click();
        break;
      }
    }

    function ensureStyleLast(css) {
      var s = document.getElementById(STYLE_ID);
      if (s) s.remove();
      s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    }

    function removeStyle() {
      var s = document.getElementById(STYLE_ID);
      if (s) s.remove();
    }

    setInterval(function() {
      var on = _ft_minimalModeOn;
      if (on) {
        var css = buildCSS();
        if (css !== _prevCSS) { ensureStyleLast(css); _prevCSS = css; }
        var hideEnemy = _ft_mmHideEnemyNames;
        var hideOwn   = _ft_mmHideOwnName;
        if (_prevEnemy !== hideEnemy) { setNativeNameToggle("SHOW ENEMY'S USERNAME", !hideEnemy); _prevEnemy = hideEnemy; }
        if (_prevOwn   !== hideOwn)   { setNativeNameToggle('SHOW OWN USERNAME',     !hideOwn);   _prevOwn   = hideOwn; }
      } else {
        if (_minimalActive) {
          removeStyle();
          _prevCSS = '';
          if (_prevEnemy) { setNativeNameToggle("SHOW ENEMY'S USERNAME", true); _prevEnemy = null; }
          if (_prevOwn)   { setNativeNameToggle('SHOW OWN USERNAME',     true); _prevOwn   = null; }
        }
      }
      _minimalActive = on;
    }, 250);
  })();

  // emote overlay
  (function() {
    const DURATION_MS = 2200;
    const EXT_ORIGIN = (function() {
      try {
        var attrOrigin = document.documentElement.getAttribute('data-ryu-ext-origin');
        if (attrOrigin) return attrOrigin;
      } catch (_) {}
      try {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          var src = scripts[i] && scripts[i].src;
          var m = src && src.match(/^(chrome-extension:\/\/[^/]+)\//);
          if (m) return m[1];
        }
      } catch (_) {}
      return '';
    })();
    const LOTTIE_BASE = EXT_ORIGIN ? (EXT_ORIGIN + '/emotes/') : 'emotes/';
    const DEFAULT_EMOTES = [
      { code: '1f62d', type: 'lottie' },
      { code: '1f923', type: 'lottie' },
      { code: '1f600', type: 'lottie' },
      { code: '1f602', type: 'lottie' },
      { code: '1f60d', type: 'lottie' },
      { code: '1f603', type: 'lottie' },
      { code: '1f604', type: 'lottie' },
      { code: '1f606', type: 'lottie' },
      { code: '1f971', type: 'lottie' },
      { code: '1f624', type: 'lottie' },
      { code: '1f644', type: 'lottie' },
      { code: '1f628', type: 'lottie' },
      { code: '1f921', type: 'lottie' },
      { code: '1f525', type: 'lottie' },
      { code: '1f60e', type: 'lottie' },
      { code: '1f611', type: 'lottie' },
      { code: '1f97a', type: 'lottie' },
      { code: '1f60f', type: 'lottie' },
      { code: '1f621', type: 'lottie' },
      { code: '1f92c', type: 'lottie' },
      { code: '1f630', type: 'lottie' },
      { code: '1fae4', type: 'lottie' },
      { code: '1f92d', type: 'lottie' },
      { code: '1f914', type: 'lottie' },
      { code: '1f92a', type: 'lottie' },
      { code: '1f6a8', type: 'lottie' },
      { code: '1f4f8', type: 'lottie' },
      { code: '1f4a3', type: 'lottie' },
      { code: '231b',  type: 'lottie' },
      { code: '1faa4', type: 'lottie' },
      { code: '1f6ae', type: 'lottie' },
      { code: '1f3f3_fe0f', type: 'lottie' },
      { code: '1f5d1_fe0f', type: 'lottie' },
      { code: '1faf5', type: 'lottie' },
      { code: '1f480', type: 'lottie' },
      { code: '1f916', type: 'lottie' },
      { code: '1f4a9', type: 'lottie' },
      { code: '1f913', type: 'lottie' },
      { code: '1f978', type: 'lottie' },
      { code: '1f920', type: 'lottie' },
      { code: '1f922', type: 'lottie' },
      { code: '1f92e', type: 'lottie' },
      { code: '1f635_200d_1f4ab', type: 'lottie' },
      { code: '1f635', type: 'lottie' },
      { code: '1f976', type: 'lottie' },
      { code: '1f974', type: 'lottie' },
      { code: '1f629', type: 'lottie' },
      { url: 'https://i.imgur.com/BlJRyLY.gif', label: 'gif1', type: 'gif' },
      { url: 'https://i.imgur.com/QTvozwA.gif', label: 'gif2', type: 'gif' },
      { url: 'https://i.imgur.com/0CZFfzQ.gif', label: 'gif3', type: 'gif' },
      { url: 'https://i.imgur.com/uay3Qfn.gif', label: 'gif4', type: 'gif' },
      { url: 'https://i.imgur.com/GHq0FYF.gif', label: 'gif5', type: 'gif' },
      { url: 'https://i.imgur.com/IxYt6N9.gif', label: 'gif6', type: 'gif' },
      { url: 'https://i.imgur.com/QNR9zDv.gif', label: 'gif7', type: 'gif' },
      { url: 'https://i.imgur.com/87m71EC.gif', label: 'gif8', type: 'gif' }
    ].map(function(em) {
      if (!em.label && em.code) em.label = String.fromCodePoint(parseInt(em.code, 16));
      return em;
    });
    globalThis.__ryuDefaultEmotes = DEFAULT_EMOTES;

    // --- state ---
    let _emotes = [];
    let _lottie = null;
    let _picker = null;
    let _pickerWarmed = false;
    let _gifImgsLoaded = false;
    let _mc = null;

    // PIXI emote layer (world-space, no DOM layout cost)
    let _emoteLayer = null;

    // Lottie JSON fetch/cache
    const _lottieCache   = Object.create(null);
    const _lottiePending = Object.create(null);

    // Per-type PIXI texture cache: code / url / 'emoji:'+label → entry
    const _emoteTexCache   = Object.create(null);
    const _emoteTexPending = Object.create(null);

    // Active emotes (PIXI sprites in world space)
    const _activeEmotes    = [];
    const MAX_ACTIVE_EMOTES = 8;
    const EMOTE_CELL_RATIO  = 1.8;
    const EMOTE_TEX_SIZE        = 256;
    const LOTTIE_CAPTURE_FRAMES = 30;
    const LOTTIE_PLAYBACK_FPS   = 15;

    // --- helpers ---
    function loadLottie(cb) {
      if (_lottie) { cb(); return; }
      if (window.lottie) { _lottie = window.lottie; cb(); return; }
      var tries = 0;
      var poll = setInterval(function() {
        tries++;
        if (window.lottie) {
          clearInterval(poll);
          _lottie = window.lottie;
          cb();
        } else if (tries > 40) {
          clearInterval(poll);
        }
      }, 50);
    }

    function loadEmotes(cb) {
      if (_emotes.length) { cb(); return; }
      _emotes = DEFAULT_EMOTES.slice();
      cb();
    }

    function getBigCell() {
      const Be = globalThis.__Be;
      const ne = globalThis.__ne;
      if (!Be || !ne) return null;
      const myPlayer = Be._1059;
      if (!myPlayer) return null;
      let bigCell = null;
      for (const cell of ne._2430.values()) {
        if (cell._9491) continue;
        if (cell._2182 && cell._2182._1059 === myPlayer) {
          if (!bigCell || cell._1904 > bigCell._1904) bigCell = cell;
        }
      }
      return bigCell;
    }


    // --- Lottie JSON fetch/cache ---
    function getLottieData(code, cb) {
      if (_lottieCache[code]) { cb(_lottieCache[code]); return; }
      if (_lottiePending[code]) { _lottiePending[code].push(cb); return; }
      _lottiePending[code] = [cb];
      fetch(LOTTIE_BASE + code + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          _lottieCache[code] = data;
          var cbs = _lottiePending[code]; delete _lottiePending[code];
          for (var i = 0; i < cbs.length; i++) cbs[i](data);
        })
        .catch(function() {
          var cbs = _lottiePending[code]; delete _lottiePending[code];
          for (var i = 0; i < cbs.length; i++) cbs[i](null);
        });
    }

    // --- PIXI world-space emote layer ---

    function _tryBuildEmoteLayer() {
      if (_emoteLayer) return true;
      if (!globalThis.__ryuWorldLayer || !globalThis.__ryuPixi) return false;
      var runners = globalThis.__X_ && globalThis.__X_._1855 && globalThis.__X_._1855.runners;
      if (!runners || !runners.postrender) return false;
      _emoteLayer = new (globalThis.__ryuPixi.Container)();
      globalThis.__ryuWorldLayer.addChild(_emoteLayer);
      runners.postrender.add({ postrender: _emotePostRender });
      return true;
    }

    function _emotePostRender() {
      if (!_emoteLayer || !_activeEmotes.length) return;
      var now = performance.now();
      for (var i = _activeEmotes.length - 1; i >= 0; i--) {
        var e = _activeEmotes[i];
        if (e.dead) { _activeEmotes.splice(i, 1); continue; }
        // Refresh cellRef every frame so the emote survives splits and always
        // follows the player's biggest current piece rather than the locked spawn cell.
        if (e.refreshCell) {
          var fresh = e.refreshCell();
          if (fresh && !fresh._9491) e.cellRef = fresh;
        }
        var cell = e.cellRef;
        if (!cell || cell._9491) { _killEmote(e); _activeEmotes.splice(i, 1); continue; }
        var elapsed = now - e.startTime;
        if (elapsed >= DURATION_MS) { _killEmote(e); _activeEmotes.splice(i, 1); continue; }
        e.sprite.x = cell._7847;
        e.sprite.y = cell._9202;
        // Keep scale in sync — cell size changes after split/merge.
        e.sprite.scale.set((cell._1904 * EMOTE_CELL_RATIO) / EMOTE_TEX_SIZE);
        if (elapsed >= DURATION_MS - 300) {
          e.sprite.alpha = Math.max(0, 1 - (elapsed - (DURATION_MS - 300)) / 300);
        }
      }
    }

    function _killEmote(e) {
      if (e.dead) return;
      e.dead = true;
      if (e.frameTimer !== null) { clearInterval(e.frameTimer); e.frameTimer = null; }
      if (e.lottieTeardown) { try { e.lottieTeardown(); } catch (_) {} e.lottieTeardown = null; }
      if (e.sprite) {
        try {
          if (e.sprite.parent) e.sprite.parent.removeChild(e.sprite);
          e.sprite.destroy(false);
        } catch (_) {}
        e.sprite = null;
      }
    }

    function removeActive() {
      for (var i = 0; i < _activeEmotes.length; i++) _killEmote(_activeEmotes[i]);
      _activeEmotes.length = 0;
    }

    // --- PIXI texture builders (one-time per emote code/url, cached) ---

    function _buildEmojiTex(label, cb) {
      var key = 'emoji:' + label;
      if (_emoteTexCache[key]) { cb(_emoteTexCache[key]); return; }
      if (_emoteTexPending[key]) { _emoteTexPending[key].push(cb); return; }
      _emoteTexPending[key] = [cb];
      var sz = EMOTE_TEX_SIZE;
      var cvs = document.createElement('canvas');
      cvs.width = sz; cvs.height = sz;
      var ctx = cvs.getContext('2d');
      ctx.font         = Math.floor(sz * 0.7) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sz / 2, sz / 2);
      var tex = null;
      try { tex = globalThis.__ryuPixi.Sprite.from(cvs).texture; } catch (_) {}
      var entry = tex ? { type: 'emoji', tex: tex } : null;
      if (entry) _emoteTexCache[key] = entry;
      var cbs = _emoteTexPending[key]; delete _emoteTexPending[key];
      for (var i = 0; i < cbs.length; i++) cbs[i](entry);
    }

    function _buildGifTex(url, cb) {
      if (_emoteTexCache[url]) { cb(_emoteTexCache[url]); return; }
      if (_emoteTexPending[url]) { _emoteTexPending[url].push(cb); return; }
      _emoteTexPending[url] = [cb];
      var sz = EMOTE_TEX_SIZE;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        var cvs = document.createElement('canvas');
        cvs.width = sz; cvs.height = sz;
        cvs.getContext('2d').drawImage(img, 0, 0, sz, sz);
        var tex = null, baseTex = null;
        try {
          var spr = globalThis.__ryuPixi.Sprite.from(cvs);
          tex = spr.texture; baseTex = tex.baseTexture;
        } catch (_) {}
        var entry = tex ? { type: 'gif', tex: tex, baseTex: baseTex, canvas: cvs, img: img } : null;
        if (entry) _emoteTexCache[url] = entry;
        var cbs = _emoteTexPending[url]; delete _emoteTexPending[url];
        for (var i = 0; i < cbs.length; i++) cbs[i](entry);
      };
      img.onerror = function() {
        var cbs = _emoteTexPending[url]; delete _emoteTexPending[url];
        for (var i = 0; i < cbs.length; i++) cbs[i](null);
      };
      img.src = url;
    }

    function _finishLottieBuild(key, textures) {
      var entry = (textures && textures.length)
        ? { type: 'lottie', textures: textures, totalFrames: textures.length, fps: LOTTIE_PLAYBACK_FPS }
        : null;
      if (entry) _emoteTexCache[key] = entry;
      var cbs = _emoteTexPending[key]; delete _emoteTexPending[key];
      if (cbs) for (var i = 0; i < cbs.length; i++) cbs[i](entry);
    }

    function _startLottieChunkedBuild(key, data) {
      var sz = EMOTE_TEX_SIZE;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;left:-' + (sz + 20) + 'px;top:0;width:' + sz + 'px;height:' + sz + 'px;pointer-events:none;visibility:hidden;overflow:hidden;';
      document.body.appendChild(wrap);
      var anim = null;
      try {
        anim = _lottie.loadAnimation({
          container: wrap, renderer: 'canvas', loop: false, autoplay: false,
          animationData: data, rendererSettings: { clearCanvas: true }
        });
      } catch (_) {
        wrap.remove();
        _finishLottieBuild(key, null);
        return;
      }
      // Wait one tick for Lottie to create its internal canvas, then chunk.
      setTimeout(function() {
        var lottieCanvas = wrap.querySelector('canvas');
        var pixi = globalThis.__ryuPixi;
        if (!lottieCanvas || !pixi) {
          try { anim.destroy(); } catch (_) {}
          wrap.remove();
          _finishLottieBuild(key, null);
          return;
        }
        var RyuSprite = pixi.Sprite;
        var totalNative  = Math.max(1, Math.ceil(anim.totalFrames));
        var captureCount = Math.min(totalNative, LOTTIE_CAPTURE_FRAMES);
        var textures     = [];
        var captureIdx   = 0;

        function doSlice(deadline) {
          var t0 = performance.now();
          do {
            // Sample evenly across the native frame range.
            var frameNum = captureCount > 1
              ? Math.round(captureIdx * (totalNative - 1) / (captureCount - 1))
              : 0;
            try { anim.goToAndStop(frameNum, true); } catch (_) {}
            var fc = document.createElement('canvas');
            fc.width = sz; fc.height = sz;
            try { fc.getContext('2d').drawImage(lottieCanvas, 0, 0, sz, sz); } catch (_) {}
            try { textures.push(RyuSprite.from(fc).texture); } catch (_) {}
            captureIdx++;
          } while (captureIdx < captureCount &&
                   (deadline ? deadline.timeRemaining() >= 3 : performance.now() - t0 <= 10));
          if (captureIdx < captureCount) {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(doSlice, { timeout: 800 });
            } else {
              setTimeout(function() { doSlice(null); }, 8);
            }
          } else {
            try { anim.destroy(); } catch (_) {}
            wrap.remove();
            _finishLottieBuild(key, textures);
          }
        }

        if ('requestIdleCallback' in window) {
          requestIdleCallback(doSlice, { timeout: 800 });
        } else {
          setTimeout(function() { doSlice(null); }, 8);
        }
      }, 80);
    }

    function _buildLottieTex(code, data, cb) {
      var key = 'lottie:' + code;
      if (_emoteTexCache[key]) { cb(_emoteTexCache[key]); return; }
      if (_emoteTexPending[key]) { _emoteTexPending[key].push(cb); return; }
      _emoteTexPending[key] = [cb];
      _startLottieChunkedBuild(key, data);
    }

    // --- Prewarm queue (one emote at a time during idle time) ---
    var _prewarmQueue     = [];
    var _prewarmRunning   = false;

    function _schedulePrewarm() {
      if (_prewarmRunning || !_prewarmQueue.length) return;
      _prewarmRunning = true;
      if ('requestIdleCallback' in window) {
        requestIdleCallback(_runPrewarm, { timeout: 8000 });
      } else {
        setTimeout(_runPrewarm, 400);
      }
    }

    function _runPrewarm() {
      _prewarmRunning = false;
      var code = _prewarmQueue.shift();
      if (!code) return;
      var key = 'lottie:' + code;
      if (_emoteTexCache[key] || _emoteTexPending[key]) { _schedulePrewarm(); return; }
      loadLottie(function() {
        getLottieData(code, function(data) {
          if (data) {
            _buildLottieTex(code, data, function() { _schedulePrewarm(); });
          } else {
            _schedulePrewarm();
          }
        });
      });
    }

    function _queueLottiePrewarm() {
      var codes = [];
      // Favorite emote first.
      if (_ft_favoriteEmoteCode &&
          !_ft_favoriteEmoteCode.startsWith('http') &&
          !_ft_favoriteEmoteCode.startsWith('emoji:')) {
        codes.push(_ft_favoriteEmoteCode);
      }
      loadEmotes(function() {
        for (var i = 0; i < _emotes.length; i++) {
          var em = _emotes[i];
          if (em.type === 'lottie' && em.code) codes.push(em.code);
        }
        for (var j = 0; j < codes.length; j++) {
          var c = codes[j];
          var k = 'lottie:' + c;
          if (!_emoteTexCache[k] && !_emoteTexPending[k] && _prewarmQueue.indexOf(c) === -1) {
            _prewarmQueue.push(c);
          }
        }
        _schedulePrewarm();
      });
    }

    function _spawnPixiEmote(cellRef, texEntry, getCellFn) {
      if (!_tryBuildEmoteLayer()) return false;
      if (!cellRef || cellRef._9491) return false;
      var pixi = globalThis.__ryuPixi;
      if (!pixi) return false;
      var firstTex = texEntry.type === 'lottie' ? texEntry.textures[0] : texEntry.tex;
      if (!firstTex) return false;
      var spr = null;
      try { spr = new pixi.Sprite(firstTex); } catch (_) { return false; }
      spr.anchor.set(0.5, 0.5);
      spr.alpha = 1;
      spr.scale.set((cellRef._1904 * EMOTE_CELL_RATIO) / EMOTE_TEX_SIZE);
      spr.x = cellRef._7847;
      spr.y = cellRef._9202;
      _emoteLayer.addChild(spr);
      var e = {
        sprite: spr, startTime: performance.now(),
        cellRef: cellRef, refreshCell: getCellFn || null,
        dead: false, frameTimer: null, lottieTeardown: null
      };
      if (texEntry.type === 'lottie' && texEntry.textures.length > 1) {
        var fi = 0;
        var periodMs = Math.max(16, Math.round(1000 / texEntry.fps));
        e.frameTimer = setInterval(function() {
          if (e.dead) { clearInterval(e.frameTimer); e.frameTimer = null; return; }
          // Advance once per tick; stop at last frame (hold) so the animation
          // plays exactly once rather than looping during the emote lifetime.
          if (fi < texEntry.totalFrames - 1) {
            fi++;
            try { e.sprite.texture = texEntry.textures[fi]; } catch (_) {}
          }
        }, periodMs);
      } else if (texEntry.type === 'gif' && texEntry.baseTex) {
        // Copy current animated GIF frame to canvas + refresh GPU texture at
        // 10 fps — bounded cost, avoids per-frame GPU upload.
        e.frameTimer = setInterval(function() {
          if (e.dead) { clearInterval(e.frameTimer); e.frameTimer = null; return; }
          try {
            texEntry.canvas.getContext('2d').drawImage(texEntry.img, 0, 0, EMOTE_TEX_SIZE, EMOTE_TEX_SIZE);
            texEntry.baseTex.update();
          } catch (_) {}
        }, 100);
      }
      while (_activeEmotes.length >= MAX_ACTIVE_EMOTES) { _killEmote(_activeEmotes.shift()); }
      _activeEmotes.push(e);
      return true;
    }

    function spawnLottieEmote(code, getCellFn) {
      var cellRef = getCellFn();
      if (!cellRef) return;
      if (!_tryBuildEmoteLayer()) return;
      loadLottie(function() {
        getLottieData(code, function(data) {
          if (!data) return;
          _buildLottieTex(code, data, function(entry) {
            if (!entry) return;
            var c = (cellRef && !cellRef._9491) ? cellRef : getCellFn();
            _spawnPixiEmote(c, entry, getCellFn);
          });
        });
      });
    }

    function spawnEmojiEmote(label, getCellFn) {
      var cellRef = getCellFn();
      if (!cellRef) return;
      if (!_tryBuildEmoteLayer()) return;
      _buildEmojiTex(label, function(entry) {
        if (!entry) return;
        var c = (cellRef && !cellRef._9491) ? cellRef : getCellFn();
        _spawnPixiEmote(c, entry, getCellFn);
      });
    }

    function spawnGifEmote(url, getCellFn) {
      var cellRef = getCellFn();
      if (!cellRef) return;
      if (!_tryBuildEmoteLayer()) return;
      _buildGifTex(url, function(entry) {
        if (!entry) return;
        var c = (cellRef && !cellRef._9491) ? cellRef : getCellFn();
        _spawnPixiEmote(c, entry, getCellFn);
      });
    }

    function spawnEmote(code, getCellFn) {
      if (code.startsWith('http'))   return spawnGifEmote(code, getCellFn);
      if (code.startsWith('emoji:')) return spawnEmojiEmote(code.slice(6), getCellFn);
      spawnLottieEmote(code, getCellFn);
    }

    let _lastEmoteTime = 0;
    const EMOTE_COOLDOWN_MS = DURATION_MS;

    function triggerEmote(code) {
      if (isRyuUiBlockingActive()) return;
      const now = performance.now();
      if (now - _lastEmoteTime < EMOTE_COOLDOWN_MS) return;
      _lastEmoteTime = now;
      removeActive();
      if (globalThis.__ryuBroadcastEmote) globalThis.__ryuBroadcastEmote(code);
      spawnEmote(code, getBigCell);
    }

    globalThis.__ryuTriggerFavoriteEmote = function(code) {
      if (code) triggerEmote(code);
    };

    document.addEventListener('keydown', function(e) {
      if (e.repeat) return;
      if (!_ft_hotkeyFavoriteEmote || !_ft_favoriteEmoteCode) return;
      if (e.key.toUpperCase() !== _ft_hotkeyFavoriteEmote.toUpperCase()) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      triggerEmote(_ft_favoriteEmoteCode);
    }, true);

    globalThis.__ryuSpawnRemoteEmote = function(usernameOrMsg, code) {
      var msg = null;
      if (usernameOrMsg && typeof usernameOrMsg === 'object') {
        msg = usernameOrMsg;
        code = msg.code;
      }
      var username = msg ? String(msg.user || '').trim() : String(usernameOrMsg || '').trim();
      var clientId = msg ? String(msg.clientId || '').trim() : '';
      var accountId = msg ? String(msg.accountId || '').trim() : '';
      var gameName = msg ? String(msg.gameName || '').trim() : '';
      if (!code) return;
      function getPresenceByAccountId(id) {
        if (!id || !globalThis.__ryuPresenceInfo) return null;
        var presence = globalThis.__ryuPresenceInfo;
        for (var cid in presence) {
          if (!Object.prototype.hasOwnProperty.call(presence, cid)) continue;
          var info = presence[cid];
          if (info && String(info.accountId || '').trim() === id) return info;
        }
        return null;
      }
      function getRemoteCell() {
        const ne = globalThis.__ne;
        if (!ne || !ne._2430) return null;
        var expectedGameName = gameName;
        if (!expectedGameName && clientId && globalThis.__ryuPresenceInfo && globalThis.__ryuPresenceInfo[clientId]) {
          expectedGameName = String(globalThis.__ryuPresenceInfo[clientId].gameName || '').trim();
        }
        if (!expectedGameName && accountId) {
          var accountPresence = getPresenceByAccountId(accountId);
          if (accountPresence) expectedGameName = String(accountPresence.gameName || '').trim();
        }
        let best = null;
        for (const cell of ne._2430.values()) {
          if (cell._9491) continue;
          if (!cell._2182 || !cell._2182._1059) continue;
          var player = cell._2182._1059;
          var playerUser = String(player._4625 || '').trim();
          var playerGameName = String(player._6988 || '').trim();
          var matched =
            (expectedGameName && playerGameName === expectedGameName) ||
            (username && playerUser === username) ||
            (username && playerGameName === username);
          if (matched) {
            if (!best || cell._1904 > best._1904) best = cell;
          }
        }
        return best;
      }
      spawnEmote(code, getRemoteCell);
    };

    function _preloadGifs() {
      if (_gifImgsLoaded) return;
      _gifImgsLoaded = true;
      try {
        _picker.querySelectorAll('canvas[data-ryu-gif-url]').forEach(function(cvs) {
          var url = cvs.dataset.ryuGifUrl;
          var img = new Image();
          img.onload = function() {
            try {
              var ctx = cvs.getContext('2d');
              ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            } catch (_) {}
          };
          img.src = url;
        });
        _picker.querySelectorAll('canvas[data-ryu-emoji]').forEach(function(cvs) {
          try {
            var ctx = cvs.getContext('2d');
            ctx.font = '22px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cvs.dataset.ryuEmoji, 14, 14);
          } catch(_) {}
        });
      } catch (_) {}
    }

    function buildPicker() {
      if (_picker) return;
      _picker = document.createElement('div');
      _picker.id = 'ryu-emote-picker';
      _picker.style.cssText = [
        'position:fixed;z-index:99999;display:flex;',
        'left:0;top:0;pointer-events:none;',
        'transform:translate(-9999px,-9999px);',
        'background:rgba(13,17,23,0.95);',
        'border:1px solid rgba(255,255,255,0.08);',
        'border-radius:10px;padding:8px;gap:4px;',
        'flex-wrap:wrap;width:222px;',
        'box-shadow:0 4px 24px rgba(0,0,0,0.6);',
        'font-size:28px;line-height:1;'
      ].join('');

      _emotes.forEach(function(em) {
        const btn = document.createElement('span');
        const id = em.type === 'gif' ? em.url : em.code;

        if (em.type === 'gif') {
          const cvs = document.createElement('canvas');
          cvs.width = 28; cvs.height = 28;
          cvs.dataset.ryuGifUrl = em.url;
          cvs.style.cssText = 'width:28px;height:28px;vertical-align:middle;display:block;';
          btn.appendChild(cvs);
        } else {
          const cvs = document.createElement('canvas');
          cvs.width = 28; cvs.height = 28;
          cvs.style.cssText = 'width:28px;height:28px;display:block;';
          cvs.dataset.ryuEmoji = em.label;
          btn.appendChild(cvs);
        }

        btn.style.cssText = 'cursor:pointer;padding:4px;border-radius:6px;transition:background 0.1s;display:inline-block;';
        btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(255,255,255,0.1)'; });
        btn.addEventListener('mouseleave', function() { btn.style.background = ''; });
        btn.addEventListener('mousedown', function(e) {
          e.preventDefault();
          triggerEmote(id);
          hidePicker();
        });
        _picker.appendChild(btn);
      });

      document.body.appendChild(_picker);

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(function() { _preloadGifs(); }, { timeout: 2000 });
        window.requestIdleCallback(_queueLottiePrewarm, { timeout: 3000 });
      } else {
        setTimeout(_preloadGifs, 500);
        setTimeout(_queueLottiePrewarm, 1500);
      }
      document.addEventListener('mousedown', function(e) {
        if (_picker && _picker.style.pointerEvents !== 'none' && !_picker.contains(e.target)) {
          hidePicker();
        }
      }, false);
    }

    function showPicker(x, y) {
      loadEmotes(function() {
        if (!_picker) buildPicker();
        const pw = 222, ph = 110;
        const vw = window.innerWidth, vh = window.innerHeight;
        const px = Math.min(x, vw - pw - 8);
        const py = Math.min(y, vh - ph - 8);
        _picker.style.transform = 'translate(' + px + 'px,' + py + 'px)';
        _picker.style.pointerEvents = 'auto';
      });
    }

    function hidePicker() {
      if (_picker) {
        _picker.style.transform = 'translate(-9999px,-9999px)';
        _picker.style.pointerEvents = 'none';
      }
    }

    function initContextMenu() {
      const mc = document.getElementById('main-canvas');
      if (!mc) { setTimeout(initContextMenu, 500); return; }
      _mc = mc;

      function tryShow(x, y, skipChatCheck) {
        if (isRyuUiBlockingActive()) return;
        if (!skipChatCheck) {
          const cb = document.getElementById('chat-box');
          if (cb) {
            try {
              const r = cb.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 &&
                  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return;
            } catch (_) {}
          }
        }
        const t = loadTheme();
        if (t.useDefault || t.emotesOn === false) return;
        showPicker(x + 8, y + 8);
      }

      function getEmoteHotkey() {
        const t = loadTheme();
        const hk = t.hotkeyEmote;
        return hk === undefined ? 'RIGHTCLICK' : hk;
      }

      _mc.addEventListener('contextmenu', function(e) {
        if (getEmoteHotkey() !== 'RIGHTCLICK') return;
        e.preventDefault();
        tryShow(e.clientX, e.clientY, false);
      }, true);

      _mc.addEventListener('mousedown', function(e) {
        const hk = getEmoteHotkey();
        if (hk === 'RIGHTCLICK' || hk === '') return;
        const btnMap = { 'LEFTCLICK': 0, 'MIDDLECLICK': 1 };
        if (e.button !== (btnMap[hk] !== undefined ? btnMap[hk] : -1)) return;
        tryShow(e.clientX, e.clientY, false);
      }, true);

      document.addEventListener('keydown', function(e) {
        if (e.repeat) return;
        const hk = getEmoteHotkey();
        if (!hk || hk === 'RIGHTCLICK' || hk === 'LEFTCLICK' || hk === 'MIDDLECLICK') return;
        if (e.key.toUpperCase() !== hk.toUpperCase()) return;
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        var mm = document.getElementById('main-menu');
        if (!mm || mm.style.display !== 'none') return;
        e.stopPropagation();
        if (_picker && _picker.style.pointerEvents !== 'none') {
          hidePicker();
        } else {
          tryShow(window.innerWidth / 2, window.innerHeight / 2, true);
        }
      }, true);
    }

    function waitAndInit() {
      if (!document.getElementById('main-canvas')) { setTimeout(waitAndInit, 500); return; }
      initContextMenu();
      loadEmotes(function() {
        var run = function() { buildPicker(); };
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(run, { timeout: 1200 });
        } else {
          setTimeout(run, 150);
        }
      });
    }
    waitAndInit();
  })();

  (function() {
    // Teammate indicator — rendered as Pixi world-space sprites inside V_._4435 (same
    // container as native arrow indicators). Camera transform applied automatically by
    // Pixi; no manual zoom math, no separate compositing layer, no jitter.
    const INDICATOR_CELL_RATIO = 0.20; // sprite world-size = 20% of cell world-radius
    const INDICATOR_GAP_RATIO  = 0.12; // gap above cell top = 12% of cell world-radius
    const TRACK_SCAN_MS = 220;
    const EXT_ORIGIN = (function() {
      try {
        var attrOrigin = document.documentElement.getAttribute('data-ryu-ext-origin');
        if (attrOrigin) return attrOrigin;
      } catch (_) {}
      try {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          var src = scripts[i] && scripts[i].src;
          var m = src && src.match(/^(chrome-extension:\/\/[^/]+)\//);
          if (m) return m[1];
        }
      } catch (_) {}
      return '';
    })();
    const INDICATOR_SRC = EXT_ORIGIN ? (EXT_ORIGIN + '/assets/icons/teammate_indicator.png') : 'assets/icons/teammate_indicator.png';

    let _img = null;
    let _imgWhite = null;       // white-tinted canvas — source for the Pixi texture
    let _indicatorTex = null;   // shared PIXI.Texture (created once from _imgWhite)
    let _teamLayer = null;      // PIXI.Container added to the world layer
    let _postrenderBound = false;
    let _trackedPlayers = [];
    let _trackedByKey = new Map();
    let _lastTrackedScanAt = 0;
    const _seenKeys = new Set();

    function buildIndicatorBitmap() {
      if (!_img || !_img.naturalWidth || !_img.naturalHeight) return;
      const c = document.createElement('canvas');
      c.width = _img.naturalWidth;
      c.height = _img.naturalHeight;
      const ictx = c.getContext('2d');
      if (!ictx) return;
      ictx.drawImage(_img, 0, 0);
      ictx.globalCompositeOperation = 'source-in';
      ictx.fillStyle = '#ffffff';
      ictx.fillRect(0, 0, c.width, c.height);
      _imgWhite = c;
      tryBuildTex();
    }

    function tryBuildTex() {
      if (_indicatorTex || !_imgWhite || !globalThis.__ryuPixi) return;
      try { _indicatorTex = globalThis.__ryuPixi.Sprite.from(_imgWhite).texture; } catch (e) {}
    }

    function ensureIndicatorImage() {
      if (_img) return;
      _img = new Image();
      _img.onload = function() { buildIndicatorBitmap(); };
      _img.onerror = function() {};
      _img.src = INDICATOR_SRC;
    }

    function normalizeName(name) {
      return String(name || '').trim().toLowerCase();
    }

    function currentTag() {
      const me = globalThis.__Be && globalThis.__Be._1059;
      const tag = me && String(me._9067 || '').trim();
      return tag && tag !== 'ITS-BOT-TEAM' ? tag : '';
    }

    function _destroyEntrySprite(entry) {
      if (!entry._sprite) return;
      try {
        if (entry._sprite.parent) entry._sprite.parent.removeChild(entry._sprite);
        entry._sprite.destroy(false); // false = keep shared texture alive
      } catch (e) {}
      entry._sprite = null;
    }

    function collectTrackedPlayers(now, force) {
      if (!force && now - _lastTrackedScanAt < TRACK_SCAN_MS) return _trackedPlayers;
      _lastTrackedScanAt = now;

      const ne = globalThis.__ne;
      const me = globalThis.__Be && globalThis.__Be._1059;
      const localTag = currentTag();
      if (!ne || !ne._2430) {
        _trackedByKey.forEach(_destroyEntrySprite);
        _trackedPlayers.length = 0;
        _trackedByKey.clear();
        return _trackedPlayers;
      }

      _trackedPlayers.length = 0;
      _trackedByKey.forEach(function(entry) {
        entry._seen = false;
        entry.cell = null;
        entry.radius = 0;
      });

      for (const cell of ne._2430.values()) {
        if (!cell || cell._9491 || cell._7926 !== 1 || !cell._2182 || !cell._2182._1059) continue;
        const player = cell._2182._1059;
        if (me && player === me) continue;
        const name = String(player._6988 || '').trim();
        if (!name) continue;
        const playerTag = String(player._9067 || '').trim();
        const sameTag = !!localTag && playerTag === localTag;
        const nativeTeammate = !!(cell._5898 && cell._5898.isOwnerTeammate);
        if (!sameTag && !nativeTeammate) continue;
        const key = normalizeName(name);
        let existing = _trackedByKey.get(key);
        if (!existing) {
          existing = { key: key, cell: null, radius: 0, _seen: false, _sprite: null };
          _trackedByKey.set(key, existing);
        }
        existing._seen = true;
        if (!existing.cell || cell._1904 > existing.radius) {
          existing.cell = cell;
          existing.radius = cell._1904;
        }
      }

      _trackedByKey.forEach(function(entry, key) {
        if (!entry._seen || !entry.cell) {
          _destroyEntrySprite(entry);
          _trackedByKey.delete(key);
          return;
        }
        _trackedPlayers.push(entry);
      });

      if (_trackedPlayers.length > 1) {
        _trackedPlayers.sort(function(a, b) {
          return (a.cell && b.cell) ? (a.cell._9202 - b.cell._9202) : 0;
        });
      }
      return _trackedPlayers;
    }

    function drawFrame() {
      if (!_teamLayer) return;

      if (!_ft_teammateIndicatorOn || _ft_uiBlocking || _ft_menuOverlay) {
        _teamLayer.visible = false;
        return;
      }

      if (!_indicatorTex) { tryBuildTex(); if (!_indicatorTex) return; }

      const ne = globalThis.__ne;
      if (!ne || !ne._2430) { _teamLayer.visible = false; return; }

      _teamLayer.visible = true;

      const now = performance.now();
      const tracked = collectTrackedPlayers(now, false);
      const texW = _imgWhite ? _imgWhite.width : 64;
      const RyuSprite = globalThis.__ryuPixi.Sprite;
      _seenKeys.clear();

      for (let i = 0; i < tracked.length; i++) {
        const entry = tracked[i];
        const cell = entry.cell;
        if (!cell || cell._9491) continue;

        _seenKeys.add(entry.key);

        if (!entry._sprite) {
          const spr = new RyuSprite(_indicatorTex);
          spr.anchor.set(0.5, 1.0); // center-x, bottom-y — matches native arrow anchor
          spr.alpha = 0.95;
          _teamLayer.addChild(spr);
          entry._sprite = spr;
        }

        const spr = entry._sprite;
        spr.visible = true;
        // World-space scale: Pixi world container applies zoom automatically, so
        // this ratio stays proportional to the cell at every zoom level with zero cost.
        const worldSz = cell._1904 * INDICATOR_CELL_RATIO;
        spr.scale.set(worldSz / texW);
        spr.position.set(cell._7847, cell._9202 - cell._1904 - cell._1904 * INDICATOR_GAP_RATIO);
      }

      // Hide sprites for entries whose cells were not drawable this frame
      _trackedByKey.forEach(function(entry) {
        if (entry._sprite && !_seenKeys.has(entry.key)) entry._sprite.visible = false;
      });
    }

    function waitAndInit() {
      if (_postrenderBound) return;
      if (!globalThis.__ryuWorldLayer || !globalThis.__ryuPixi) { setTimeout(waitAndInit, 300); return; }
      var runners = globalThis.__X_ && globalThis.__X_._1855 && globalThis.__X_._1855.runners;
      if (!runners || !runners.postrender) { setTimeout(waitAndInit, 300); return; }
      var RyuContainer = globalThis.__ryuPixi.Container;
      _teamLayer = new RyuContainer();
      _teamLayer.visible = false;
      globalThis.__ryuWorldLayer.addChild(_teamLayer);
      _postrenderBound = true;
      runners.postrender.add({ postrender: drawFrame });
    }

    ensureIndicatorImage();
    waitAndInit();

    setInterval(function() {
      // Clean up any HTML canvas overlay left over from an older extension version
      var legacy = document.getElementById('ryu-teammate-overlay') ||
                   document.getElementById('ryu-teammate-indicator-wrap');
      if (legacy) legacy.remove();

      ensureIndicatorImage();
      tryBuildTex();

      if (!_ft_teammateIndicatorOn) {
        _trackedByKey.forEach(_destroyEntrySprite);
        _trackedPlayers.length = 0;
        _trackedByKey.clear();
        _lastTrackedScanAt = 0;
        if (_teamLayer) _teamLayer.visible = false;
      }
    }, 500);
  })();

  (function() {
    var _lastDefault = null;

    function stripAll() {
      ['ryu-lb-redesign-style', 'ryu-lb-style', 'ryu-chatbox-theme',
       'ryu-minimap-border-style', 'ryu-hud-indicator-style',
       'ryu-cursor-hide'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.remove();
      });
      ['ryu-lb-header', 'ryu-lb-resize', 'ryu-chbx-header',
       'ryu-resize-handle'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.remove();
      });
      if (globalThis.__ryuStripLB) globalThis.__ryuStripLB();
      var lb = document.getElementById('leaderboard');
      if (lb) lb.style.cssText = '';
      var chatbox = document.getElementById('chatbox');
      if (chatbox) chatbox.style.cssText = '';
      var mm = document.getElementById('minimap');
      var hud = document.querySelector('.huds-bottom-right');
      if (mm) { mm.style.width = ''; mm.style.height = ''; mm.style.imageRendering = ''; }
      if (hud) hud.style.width = '';
      if (window.__ryuApplyCursor) window.__ryuApplyCursor(null);
    }

    function restoreAll() {
    }




    setInterval(function() {
      var isDefault = !!loadTheme().useDefault;

      if (isDefault && _lastDefault !== true) {
        stripAll();
      } else if (!isDefault && _lastDefault === true) {
        restoreAll();
      }

      _lastDefault = isDefault;
    }, 500);

  if (loadTheme().useDefault) stripAll();
  })();

  /*
  // Freecam disabled for v1.4 while it is being reworked.
  // local freecam: camera-only detach while alive; gameplay/movement packets stay native.
  (function() {
    var _lastT = 0;
    var _movePatched = false;

    function isTextInputActive() {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    }

    function shouldIgnoreHotkeys() {
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return true;
      if (document.getElementById('ryu-settings-panel')) return true;
      if (document.getElementById('ryu-rename-modal')) return true;
      if (document.getElementById('ryu-shop-injected')) return true;
      if (document.getElementById('ryu-inv-injected')) return true;
      if (document.getElementById('ryu-gal-injected')) return true;
      if (document.getElementById('ryu-clip-editor')) return true;
      return false;
    }

    function getResolutionScale() {
      try {
        var Q = globalThis.__Q;
        return Q && Q.RESOLUTION ? (Q.RESOLUTION._5997() / 100) : 1;
      } catch (_) {
        return 1;
      }
    }

    function getMouseDelta() {
      var canvas = document.getElementById('main-canvas');
      var rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
      var left = rect ? rect.left : 0;
      var top = rect ? rect.top : 0;
      var width = rect && rect.width ? rect.width : window.innerWidth;
      var height = rect && rect.height ? rect.height : window.innerHeight;
      return {
        x: _mouseX - left - width / 2,
        y: _mouseY - top - height / 2,
        width: width,
        height: height
      };
    }

    function getMouseWorldFrom(centerX, centerY, z) {
      var d = getMouseDelta();
      var zoom = Math.max(z && z._4336 || 0.1, 0.02);
      var scale = (window.devicePixelRatio || 1) * getResolutionScale() / zoom;
      return {
        x: centerX + d.x * scale,
        y: centerY + d.y * scale,
        dx: d.x,
        dy: d.y,
        width: d.width,
        height: d.height
      };
    }

    function clampFreecam() {
      if (!globalThis.__ne || !globalThis.__ne._5142) return;
      var pad = globalThis.__ne._5142 * 0.05;
      var min = (65535 - globalThis.__ne._5142) / 2 - pad;
      var max = min + globalThis.__ne._5142 + pad * 2;
      globalThis.__ryuFreecamX = Math.max(min, Math.min(max, globalThis.__ryuFreecamX));
      globalThis.__ryuFreecamY = Math.max(min, Math.min(max, globalThis.__ryuFreecamY));
    }

    function ensureMovementPatch() {
      var Me = globalThis.__ryuMe;
      if (_movePatched || !Me || typeof Me._9701 !== 'function') return;
      var nativeMove = Me._9701;
      Me._9701 = function(playerIndex, x, y) {
        try {
          var Be = globalThis.__Be;
          var z = globalThis.__z_;
          var player = Be && Be._6881 && Be._9324;
          if (globalThis.__ryuFreecamOn && player && z && z._3852) {
            var aim = getMouseWorldFrom(player._7847, player._9202, z);
            return nativeMove.call(this, playerIndex, aim.x, aim.y);
          }
        } catch (_) {}
        return nativeMove.apply(this, arguments);
      };
      _movePatched = true;
    }

    function snapToPlayer(z) {
      var Be = globalThis.__Be;
      if (!z || !z._3852 || !Be || !Be._6881 || !Be._9324) return;
      globalThis.__ryuFreecamX = Be._9324._7847;
      globalThis.__ryuFreecamY = Be._9324._9202;
      z._3852._7847 = Be._9324._7847;
      z._3852._9202 = Be._9324._9202;
      if (z._8184) z._8184._5117(Be._9324._7847, Be._9324._9202);
    }

    function ensureFreecamStart() {
      var z = globalThis.__z_;
      if (!z || !z._3852) return false;
      globalThis.__ryuFreecamX = z._3852._7847;
      globalThis.__ryuFreecamY = z._3852._9202;
      _lastT = performance.now();
      return true;
    }

    function setFreecam(on) {
      var Be = globalThis.__Be;
      if (on) {
        if (!Be || !Be._6881 || shouldIgnoreHotkeys()) return false;
        ensureMovementPatch();
        if (!ensureFreecamStart()) return false;
        globalThis.__ryuFreecamOn = true;
        console.log('[RyuFreecam] on');
        return true;
      }
      if (globalThis.__ryuFreecamOn) console.log('[RyuFreecam] off');
      globalThis.__ryuFreecamOn = false;
      snapToPlayer(globalThis.__z_);
      return true;
    }

    globalThis.__ryuToggleFreecam = function(force) {
      var next = typeof force === 'boolean' ? force : !globalThis.__ryuFreecamOn;
      return setFreecam(next);
    };

    globalThis.__ryuApplyFreecam = function(z) {
      if (!globalThis.__ryuFreecamOn) return;
      var Be = globalThis.__Be;
      if (!z || !z._3852 || !Be || !Be._6881 || shouldIgnoreHotkeys()) {
        setFreecam(false);
        return;
      }
      ensureMovementPatch();

      var now = performance.now();
      var dt = _lastT ? Math.min((now - _lastT) / 1000, 0.05) : 0;
      _lastT = now;

      var target = getMouseWorldFrom(globalThis.__ryuFreecamX, globalThis.__ryuFreecamY, z);
      var dist = Math.sqrt(target.dx * target.dx + target.dy * target.dy);
      var deadZone = Math.max(18, Math.min(target.width, target.height) * 0.035);
      if (dist > deadZone) {
        var pull = (dist - deadZone) / dist;
        var follow = Math.min(1, dt * (60 / 18));
        globalThis.__ryuFreecamX += (target.x - globalThis.__ryuFreecamX) * follow * pull;
        globalThis.__ryuFreecamY += (target.y - globalThis.__ryuFreecamY) * follow * pull;
      }
      clampFreecam();

      z._3852._7847 = globalThis.__ryuFreecamX;
      z._3852._9202 = globalThis.__ryuFreecamY;
      if (z._8184) z._8184._5117(globalThis.__ryuFreecamX, globalThis.__ryuFreecamY);
    };

    document.addEventListener('keydown', function(e) {
      if (isTextInputActive()) return;
      var key = (e.key || '').toUpperCase();

      if (globalThis.__ryuFreecamOn && key === 'Q') {
        e.preventDefault();
        e.stopPropagation();
        setFreecam(false);
        return;
      }

      if (_ft_hotkeyFreecam && key === _ft_hotkeyFreecam.toUpperCase() && !shouldIgnoreHotkeys()) {
        e.preventDefault();
        e.stopPropagation();
        setFreecam(!globalThis.__ryuFreecamOn);
        return;
      }
    }, true);
  })();
  */

  // experimental animated skin pipeline
  // decode a GIF into regular PNG frames client-side, then rotate those frames
  // through the normal skin URL path to test whether rapid static swaps
  // propagate beyond the local client.
  (function() {
    var EXP_KEY = '__ryuGifSkinExperiment';
    var _state = {
      running: false,
      url: '',
      slot: 0,
      mode: 'single',
      frameUrls: [],
      frameDurations: [],
      frameCount: 0,
      rafId: 0,
      nextAt: 0,
      index: 0,
      originalSkin1: '',
      originalSkin2: '',
      persistTimer: 0
    };

    function getSkinState() {
      var skin1 = '';
      var skin2 = '';
      try {
        if (globalThis.__Ue && globalThis.__Ue._3901) {
          skin1 = globalThis.__Ue._3901._9315 || '';
          skin2 = globalThis.__Ue._3901._8053 || '';
        }
      } catch (_) {}
      return { skin1: skin1, skin2: skin2 };
    }

    function writeUserDataSkins(skin1, skin2) {
      try {
        var ud = JSON.parse(localStorage.getItem('user-data') || 'null');
        if (!Array.isArray(ud)) return;
        ud[2] = skin1 || '';
        ud[3] = skin2 || '';
        localStorage.setItem('user-data', JSON.stringify(ud));
      } catch (_) {}
    }

    function applySkinUrl(slot, url) {
      try {
        if (globalThis.__Be && typeof globalThis.__Be._2263 === 'function') globalThis.__Be._2263(slot, url);
        if (globalThis.__Ue && globalThis.__Ue._3901) {
          if (slot === 0) globalThis.__Ue._3901._9315 = url;
          if (slot === 1) globalThis.__Ue._3901._8053 = url;
        }
        if (globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._4221) {
          for (const unit of globalThis.__Be._1059._4221.values()) {
            if (!unit || unit._3090 !== slot) continue;
            unit._3661 = url || '';
          }
        }
      } catch (_) {}

      try {
        var orb1 = document.getElementById('ryu-orb-skin1');
        var orb2 = document.getElementById('ryu-orb-skin2');
        if (slot === 0 && orb1) orb1.style.backgroundImage = url ? 'url("' + url + '")' : '';
        if (slot === 1 && orb2) orb2.style.backgroundImage = url ? 'url("' + url + '")' : '';
      } catch (_) {}
    }

    function applyFrame(frameUrl) {
      if (_state.mode === 'both') {
        applySkinUrl(0, frameUrl);
        applySkinUrl(1, frameUrl);
      } else {
        applySkinUrl(_state.slot, frameUrl);
      }
    }

    function restoreOriginalSkins() {
      applySkinUrl(0, _state.originalSkin1 || '');
      applySkinUrl(1, _state.originalSkin2 || '');
      writeUserDataSkins(_state.originalSkin1 || '', _state.originalSkin2 || '');
    }

    function cleanupFrameUrls() {
      _state.frameUrls = [];
      _state.frameDurations = [];
      _state.frameCount = 0;
    }

    function stopExperiment(restoreOriginal) {
      if (_state.rafId) {
        cancelAnimationFrame(_state.rafId);
        _state.rafId = 0;
      }
      if (_state.persistTimer) {
        clearInterval(_state.persistTimer);
        _state.persistTimer = 0;
      }
      _state.running = false;
      _state.nextAt = 0;
      _state.index = 0;
      if (restoreOriginal !== false) restoreOriginalSkins();
      cleanupFrameUrls();
      console.log('[RyuGifSkin] stopped');
    }

    function normalizeFrameDelay(rawDurationUs, fallbackMs) {
      var ms = Number(rawDurationUs || 0) / 1000;
      if (!Number.isFinite(ms) || ms <= 0) ms = fallbackMs;
      return Math.max(40, Math.min(500, Math.round(ms)));
    }

    function guessMimeType(url, blob) {
      if (blob && blob.type) return blob.type;
      if (/\.webp(?:[?#].*)?$/i.test(url)) return 'image/webp';
      if (/\.png(?:[?#].*)?$/i.test(url)) return 'image/png';
      return 'image/gif';
    }

    async function decodeAnimatedFrames(url, opts) {
      opts = opts || {};
      if (typeof ImageDecoder === 'undefined') {
        throw new Error('ImageDecoder is not supported in this browser build.');
      }

      var response = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch GIF: HTTP ' + response.status);

      var blob = await response.blob();
      var mime = guessMimeType(url, blob);
      var bytes = await blob.arrayBuffer();
      var decoder = new ImageDecoder({ data: bytes, type: mime });
      await decoder.tracks.ready;
      var track = decoder.tracks && decoder.tracks.selectedTrack;
      var frameCount = track && track.frameCount ? track.frameCount : 1;
      var maxFrames = opts.maxFrames ? Math.max(1, parseInt(opts.maxFrames, 10)) : Math.min(frameCount, 48);
      var step = Math.max(1, Math.ceil(frameCount / maxFrames));
      var fallbackMs = Math.max(40, Math.min(250, Math.round(1000 / Math.max(1, parseInt(opts.fps || 8, 10)))));
      var frames = [];
      var delays = [];
      var maxDim = Math.max(96, Math.min(384, parseInt(opts.maxDimension || 256, 10) || 256));

      for (var i = 0; i < frameCount; i += step) {
        var decoded = await decoder.decode({ frameIndex: i, completeFramesOnly: true });
        var image = decoded.image;
        var srcWidth = image.displayWidth || image.codedWidth || image.visibleRect && image.visibleRect.width || 256;
        var srcHeight = image.displayHeight || image.codedHeight || image.visibleRect && image.visibleRect.height || 256;
        var scale = Math.min(1, maxDim / Math.max(srcWidth, srcHeight));
        var width = Math.max(1, Math.round(srcWidth * scale));
        var height = Math.max(1, Math.round(srcHeight * scale));
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d', { alpha: true });
        ctx.drawImage(image, 0, 0, width, height);
        frames.push(canvas.toDataURL('image/png'));
        delays.push(normalizeFrameDelay(image.duration, fallbackMs));
        if (typeof image.close === 'function') image.close();
      }
      if (typeof decoder.close === 'function') decoder.close();
      return { frames: frames, delays: delays, sourceFrameCount: frameCount };
    }

    function schedulePersist() {
      if (_state.persistTimer) clearInterval(_state.persistTimer);
      _state.persistTimer = setInterval(function() {
        try {
          var skin1 = '';
          var skin2 = '';
          if (globalThis.__Ue && globalThis.__Ue._3901) {
            skin1 = globalThis.__Ue._3901._9315 || '';
            skin2 = globalThis.__Ue._3901._8053 || '';
          }
          writeUserDataSkins(skin1, skin2);
        } catch (_) {}
      }, 1200);
    }

    function tick(now) {
      if (!_state.running || !_state.frameCount) return;
      if (!_state.nextAt) _state.nextAt = now;
      if (now >= _state.nextAt) {
        var url = _state.frameUrls[_state.index];
        applyFrame(url);
        _state.nextAt = now + (_state.frameDurations[_state.index] || 100);
        _state.index = (_state.index + 1) % _state.frameCount;
      }
      _state.rafId = requestAnimationFrame(tick);
    }

    async function startExperiment(url, options) {
      options = options || {};
      if (!url || typeof url !== 'string') throw new Error('Pass a GIF URL.');
      stopExperiment(false);

      var skinState = getSkinState();
      _state.originalSkin1 = skinState.skin1;
      _state.originalSkin2 = skinState.skin2;
      _state.url = url;
      _state.slot = options.slot === 1 ? 1 : 0;
      _state.mode = options.mode === 'both' ? 'both' : 'single';

      var decoded = await decodeAnimatedFrames(url, options);
      _state.frameUrls = decoded.frames;
      _state.frameDurations = decoded.delays;
      _state.frameCount = decoded.frames.length;
      _state.index = 0;
      _state.nextAt = 0;
      _state.running = true;
      schedulePersist();
      _state.rafId = requestAnimationFrame(tick);

      console.log('[RyuGifSkin] started', {
        url: url,
        slot: _state.slot,
        mode: _state.mode,
        frameCount: _state.frameCount,
        sourceFrameCount: decoded.sourceFrameCount
      });

      return {
        url: url,
        slot: _state.slot,
        mode: _state.mode,
        frameCount: _state.frameCount,
        sourceFrameCount: decoded.sourceFrameCount
      };
    }

    async function startFromAlbum(albumUrl, delayMs) {
      var match = albumUrl.match(/imgur\.com\/a\/([A-Za-z0-9]+)/);
      if (!match) throw new Error('Invalid imgur album URL');
      var id = match[1];
      var resp = await fetch('https://ryutheme-gif-skins.ryutheme.workers.dev/album?id=' + id);
      if (!resp.ok) throw new Error('Worker fetch failed: ' + resp.status);
      var data = await resp.json();
      if (!data.urls || !data.urls.length) throw new Error('No images found in album');
      stopExperiment(false);
      var skinState = getSkinState();
      _state.originalSkin1 = skinState.skin1;
      _state.originalSkin2 = skinState.skin2;
      _state.url = albumUrl;
      _state.slot = 0;
      _state.mode = 'both';
      var ms = Math.max(40, parseInt(delayMs, 10) || 100);
      _state.frameUrls = data.urls;
      _state.frameDurations = data.urls.map(function() { return ms; });
      _state.frameCount = data.urls.length;
      _state.index = 0;
      _state.nextAt = 0;
      // preload all frame images so texture cache has them before animation starts
      data.urls.forEach(function(u) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = u;
      });
      await new Promise(function(res) { setTimeout(res, 600); });
      _state.running = true;
      schedulePersist();
      _state.rafId = requestAnimationFrame(tick);
      console.log('[RyuGifSkin] album started', { frameCount: _state.frameCount, delayMs: ms });
      return { frameCount: _state.frameCount };
    }

    globalThis[EXP_KEY] = {
      start: startExperiment,
      startFromAlbum: startFromAlbum,
      stop: function() { stopExperiment(true); },
      status: function() {
        return {
          running: _state.running,
          url: _state.url,
          slot: _state.slot,
          mode: _state.mode,
          frameCount: _state.frameCount,
          originalSkin1: _state.originalSkin1,
          originalSkin2: _state.originalSkin2
        };
      },
      decode: decodeAnimatedFrames
    };
  })();
  // end experimental animated skin pipeline

  // spectate-mode probe for testing the native button while alive
  (function() {
    function safeCopy(obj, keys) {
      var out = {};
      if (!obj) return out;
      keys.forEach(function(key) {
        try {
          var val = obj[key];
          if (typeof val !== 'function') out[key] = val;
        } catch (_) {}
      });
      return out;
    }

    function getState(label) {
      var mm = document.getElementById('main-menu');
      var chat = document.querySelector('#chat-input');
      var spec = document.getElementById('mame-spectate-btn');
      var z = globalThis.__z_;
      var Be = globalThis.__Be;
      var myPlayer = Be && Be._1059;
      var cameraPos = z && z._3852 ? safeCopy(z._3852, ['_7847', '_9202']) : null;
      var cameraTarget = z && z._8184 ? safeCopy(z._8184, ['_7847', '_9202']) : null;

      return {
        label: label || '',
        time: new Date().toISOString(),
        mainMenuDisplay: mm ? window.getComputedStyle(mm).display : null,
        chatDisplay: chat ? window.getComputedStyle(chat).display : null,
        spectateButton: spec ? {
          disabled: !!spec.disabled,
          display: window.getComputedStyle(spec).display,
          opacity: window.getComputedStyle(spec).opacity,
          className: spec.className
        } : null,
        wsReadyState: globalThis._ryuWS ? globalThis._ryuWS.readyState : null,
        Be: Be ? safeCopy(Be, ['_6881', '_4167', '_7330', '_7522']) : null,
        myPlayer: myPlayer ? {
          name: myPlayer._6988,
          team: myPlayer._9067,
          playerCount: myPlayer._4221 && myPlayer._4221.size,
          isOwnClient: !!myPlayer._9710
        } : null,
        camera: z ? Object.assign(safeCopy(z, ['_7283', '_4336', '_5545']), {
          pos: cameraPos,
          target: cameraTarget
        }) : null
      };
    }

    globalThis.__ryuSpectateProbe = function(label) {
      var state = getState(label || 'probe');
      console.log('[RyuSpectateProbe]', state);
      return state;
    };

    globalThis.__ryuSpectateProbeClick = function() {
      var spec = document.getElementById('mame-spectate-btn');
      if (!spec) {
        console.warn('[RyuSpectateProbe] native spectate button not found');
        return null;
      }
      var before = getState('before native spectate click');
      console.log('[RyuSpectateProbe]', before);
      spec.click();
      [50, 250, 1000].forEach(function(delay) {
        setTimeout(function() {
          console.log('[RyuSpectateProbe]', getState('after native spectate click +' + delay + 'ms'));
        }, delay);
      });
      return before;
    };

    document.addEventListener('keydown', function(e) {
      if (!e.ctrlKey || !e.shiftKey || e.key.toUpperCase() !== 'P') return;
      if (isRyuUiBlockingActive()) return;
      e.preventDefault();
      e.stopPropagation();
      globalThis.__ryuSpectateProbe('manual hotkey');
    }, true);
  })();

  // disconnect hotkey
  // Mirrors the dc script logic: check chat is not displayed (in-game), then click current server to disconnect
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyDisconnect) return;
      // Match by key code — convert saved key (e.g. 'A') to keyCode
      var savedKey = _ft_hotkeyDisconnect.toUpperCase();
      var pressedKey = e.key.toUpperCase();
      if (pressedKey !== savedKey) return;
      if (isRyuUiBlockingActive()) return;
      // Only fire when in-game (chat input exists but is hidden)
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      // Click the active region button to disconnect (same as dc script)
      var currentServer = document.querySelector('.mame-ssb-region-option-active');
      if (currentServer) currentServer.click();
    } catch(err) {}
  }, false);

  // hide flags hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyHideFlags) return;
      if (e.key.toUpperCase() !== _ft_hotkeyHideFlags.toUpperCase()) return;
      if (isRyuUiBlockingActive()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      var t = loadTheme();
      t.hideFlags = !t.hideFlags;
      saveTheme(t);
      _themeCache = null;
      _applyHideFlagsState(!!t.hideFlags);
    } catch(err) {}
  }, false);

  // danger overlay hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyDangerOverlay) return;
      if (e.key.toUpperCase() !== _ft_hotkeyDangerOverlay.toUpperCase()) return;
      if (isRyuUiBlockingActive()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      var t = loadTheme();
      t.dangerIndicatorOn = !t.dangerIndicatorOn;
      saveTheme(t);
      _themeCache = null;
    } catch(err) {}
  }, false);

  // teammate indicator hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyTeammateIndicator) return;
      if (e.key.toUpperCase() !== _ft_hotkeyTeammateIndicator.toUpperCase()) return;
      if (isRyuUiBlockingActive()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      var t = loadTheme();
      t.teammateIndicatorOn = t.teammateIndicatorOn === false;
      saveTheme(t);
      _themeCache = null;
    } catch(err) {}
  }, false);

  // minimal mode hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyMinimalMode) return;
      if (e.key.toUpperCase() !== _ft_hotkeyMinimalMode.toUpperCase()) return;
      if (isRyuUiBlockingActive()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      var t = loadTheme();
      t.minimalModeOn = !t.minimalModeOn;
      saveTheme(t);
      _themeCache = null;
    } catch(err) {}
  }, false);

  // mute mic hotkey
  (function() {
    function mouseButton(label) {
      switch (String(label || '').toUpperCase()) {
        case 'LEFTCLICK': return 0;
        case 'MIDDLECLICK': return 1;
        case 'RIGHTCLICK': return 2;
        case 'MOUSE4': return 3;
        case 'MOUSE5': return 4;
        default: return -1;
      }
    }

    function canToggleMic() {
      if (isRyuUiBlockingActive()) return false;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return false;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return false;
      return true;
    }

    function toggleMicMute() {
      if (!globalThis.__ryuVoiceToggleMute) return;
      globalThis.__ryuVoiceToggleMute();
    }

    document.addEventListener('keydown', function(e) {
      try {
        if (!_ft_hotkeyMuteMic) return;
        if (mouseButton(_ft_hotkeyMuteMic) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyMuteMic.toUpperCase()) return;
        if (!canToggleMic()) return;
        e.preventDefault();
        e.stopPropagation();
        toggleMicMute();
      } catch (_) {}
    }, true);

    document.addEventListener('mousedown', function(e) {
      try {
        if (!_ft_hotkeyMuteMic) return;
        var btn = mouseButton(_ft_hotkeyMuteMic);
        if (btn < 0 || e.button !== btn) return;
        if (!canToggleMic()) return;
        e.preventDefault();
        e.stopPropagation();
        toggleMicMute();
      } catch (_) {}
    }, true);
  })();

  // fast spawn hotkey: spawn or respawn the other multibox unit, then
  // temporarily force it to move and macro-feed into the currently active unit.
  (function() {
    var _fastSpawnTimer = null;
    var _fastSpawnWaitTimer = null;
    var _fastSpawnLoopTimer = null;
    var _fastSpawnSlot = -1;
    var _fastSpawnMacroOn = false;
    var _fastSpawnStartedAt = 0;
    var _fastSpawnEnabled = false;
    var _fastSpawnTargetSlot = -1;
    var _fastSpawnPendingSpawn = false;
    var _fastSpawnPendingRespawn = false;
    var _fastSpawnLastLifeStamp = -1;
    var _fastSpawnHandledLifeStamp = -1;
    var _fastSpawnLastSpawnAttemptAt = 0;
    var _fastSpawnLastRespawnAttemptAt = 0;
    var _fastSpawnLastRefreshPulseAt = 0;
    var _fastSpawnSplitBurstDone = false;

    function isInGame() {
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      var mm = document.getElementById('main-menu');
      return !!(chatHidden && mm && mm.style.display === 'none');
    }

    function isTypingTarget() {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function mouseButton(label) {
      if (label === 'RIGHTCLICK') return 2;
      if (label === 'MIDDLECLICK') return 1;
      var m = /^MOUSE(\d+)$/i.exec(label || '');
      return m ? parseInt(m[1], 10) : -1;
    }

    function clearFastSpawnWait() {
      if (_fastSpawnWaitTimer) {
        clearInterval(_fastSpawnWaitTimer);
        _fastSpawnWaitTimer = null;
      }
    }

    function clearFastSpawnAction() {
      clearFastSpawnWait();
      if (_fastSpawnTimer) {
        clearInterval(_fastSpawnTimer);
        _fastSpawnTimer = null;
      }
      try {
        var Me = globalThis.__ryuMe;
        if (_fastSpawnMacroOn && Me && typeof Me._3605 === 'function' && _fastSpawnSlot >= 0) {
          Me._3605(_fastSpawnSlot, false);
        }
      } catch (_) {}
      _fastSpawnSlot = -1;
      _fastSpawnMacroOn = false;
      _fastSpawnStartedAt = 0;
      _fastSpawnPendingSpawn = false;
      _fastSpawnPendingRespawn = false;
      _fastSpawnLastRefreshPulseAt = 0;
      _fastSpawnSplitBurstDone = false;
    }

    function stopFastSpawn() {
      clearFastSpawnAction();
      if (_fastSpawnLoopTimer) {
        clearInterval(_fastSpawnLoopTimer);
        _fastSpawnLoopTimer = null;
      }
      _fastSpawnEnabled = false;
      _fastSpawnTargetSlot = -1;
      _fastSpawnLastLifeStamp = -1;
      _fastSpawnHandledLifeStamp = -1;
      _fastSpawnLastSpawnAttemptAt = 0;
      _fastSpawnLastRespawnAttemptAt = 0;
      _fastSpawnLastRefreshPulseAt = 0;
      globalThis.__ryuFastSpawnActive = false;
    }

    function getUnitPos(Be, idx) {
      try {
        var unit = Be && Be._6328 && Be._6328[idx];
        if (!unit) return null;
        return { x: unit._7847, y: unit._9202 };
      } catch (_) {}
      return null;
    }

    function getFeederSlot(Be, targetIdx) {
      if (!Be || !Number.isFinite(Be._8674) || Be._8674 < 2) return -1;
      if (Be._8674 === 2) return targetIdx === 0 ? 1 : 0;
      for (var i = 0; i < Be._8674; i++) {
        if (i !== targetIdx) return i;
      }
      return -1;
    }

    function keepTargetActive(targetIdx) {
      try {
        var Be = globalThis.__Be;
        if (!Be || !Be._7330 || !Be._7330[targetIdx]) return;
        if (Be._1393 !== targetIdx) Be._1393 = targetIdx;
      } catch (_) {}
    }

    function beginFastSpawnFeed(targetIdx, feederIdx) {
      var Me = globalThis.__ryuMe;
      var Be = globalThis.__Be;
      if (!Me || !Be || typeof Me._9701 !== 'function' || typeof Me._3605 !== 'function') return false;

      clearFastSpawnAction();
      _fastSpawnSlot = feederIdx;
      _fastSpawnStartedAt = performance.now();
      _fastSpawnPendingSpawn = false;
      _fastSpawnPendingRespawn = false;
      _fastSpawnLastRefreshPulseAt = 0;
      _fastSpawnSplitBurstDone = false;
      _fastSpawnHandledLifeStamp = (Be._1118 && typeof Be._1118[feederIdx] === 'number') ? Be._1118[feederIdx] : -1;
      _fastSpawnTimer = setInterval(function() {
        try {
          var MeLive = globalThis.__ryuMe;
          var BeLive = globalThis.__Be;
          if (!_fastSpawnEnabled || !MeLive || !BeLive || !isInGame()) {
            clearFastSpawnAction();
            return;
          }
          keepTargetActive(targetIdx);
          if (!BeLive._7330 || !BeLive._7330[targetIdx] || !BeLive._7330[feederIdx]) {
            clearFastSpawnAction();
            return;
          }
          if (performance.now() - _fastSpawnStartedAt > 6000) {
            clearFastSpawnAction();
            return;
          }
          var targetPos = getUnitPos(BeLive, targetIdx);
          if (!targetPos) return;
          if (!_fastSpawnSplitBurstDone && typeof MeLive._6441 === 'function') {
            try { MeLive._6441(feederIdx, 6); } catch (_) {}
            _fastSpawnSplitBurstDone = true;
          }
          MeLive._9701(feederIdx, targetPos.x, targetPos.y);
          if (!_fastSpawnMacroOn) {
            MeLive._3605(feederIdx, true);
            _fastSpawnMacroOn = true;
          }
          if (typeof MeLive._7700 === 'function') {
            var feederAge = NaN;
            try {
              if (BeLive._1118 && typeof BeLive._1118[feederIdx] === 'number') {
                feederAge = performance.now() - BeLive._1118[feederIdx];
              }
            } catch (_) {}
            var now = performance.now();
            if (
              Number.isFinite(feederAge) &&
              feederAge >= 1200 &&
              feederAge <= 9000 &&
              now - _fastSpawnLastRefreshPulseAt >= 1350
            ) {
              try { MeLive._7700(feederIdx); } catch (_) {}
              _fastSpawnLastRefreshPulseAt = now;
              _fastSpawnStartedAt = now;
              _fastSpawnSplitBurstDone = false;
              _fastSpawnHandledLifeStamp = -1;
              _fastSpawnLastLifeStamp = (BeLive._1118 && typeof BeLive._1118[feederIdx] === 'number')
                ? BeLive._1118[feederIdx]
                : -1;
            }
          }
        } catch (_) {
          clearFastSpawnAction();
        }
      }, 40);
      return true;
    }

    function runFastSpawnCycle() {
      var Me = globalThis.__ryuMe;
      var Be = globalThis.__Be;
      if (!_fastSpawnEnabled || !Me || !Be || !Be._7330 || Be._8674 < 2) return;
      if (isRyuUiBlockingActive() || !isInGame()) return;

      var targetIdx = (_fastSpawnTargetSlot >= 0 && Be._7330[_fastSpawnTargetSlot]) ? _fastSpawnTargetSlot : Be._1393;
      var feederIdx = getFeederSlot(Be, targetIdx);
      if (feederIdx < 0 || !Be._7330[targetIdx]) return;
      _fastSpawnTargetSlot = targetIdx;

      var lifeStamp = (Be._1118 && typeof Be._1118[feederIdx] === 'number') ? Be._1118[feederIdx] : -1;
      if (_fastSpawnPendingSpawn || _fastSpawnPendingRespawn) return;

      if (!Be._7330[feederIdx]) {
        if (performance.now() - _fastSpawnLastSpawnAttemptAt < 250) return;
        if (typeof Me._3807 !== 'function') return;
        _fastSpawnLastSpawnAttemptAt = performance.now();
        _fastSpawnPendingSpawn = true;
        Me._3807(feederIdx);
        var waitStartedAt = performance.now();
        _fastSpawnWaitTimer = setInterval(function() {
          var BeLive = globalThis.__Be;
          if (!_fastSpawnEnabled || !BeLive || !isInGame()) {
            clearFastSpawnWait();
            _fastSpawnPendingSpawn = false;
            return;
          }
          if (performance.now() - waitStartedAt > 5000) {
            clearFastSpawnWait();
            _fastSpawnPendingSpawn = false;
            return;
          }
          if (BeLive._7330 && BeLive._7330[feederIdx]) {
            clearFastSpawnWait();
            _fastSpawnPendingSpawn = false;
            _fastSpawnLastLifeStamp = (BeLive._1118 && typeof BeLive._1118[feederIdx] === 'number') ? BeLive._1118[feederIdx] : -1;
            _fastSpawnHandledLifeStamp = -1;
            setTimeout(function() {
              keepTargetActive(targetIdx);
              beginFastSpawnFeed(targetIdx, feederIdx);
            }, 55);
          }
        }, 40);
        return;
      }

      if (_fastSpawnSlot === feederIdx && _fastSpawnMacroOn && _fastSpawnLastLifeStamp === lifeStamp) return;
      if (lifeStamp >= 0 && _fastSpawnHandledLifeStamp === lifeStamp) return;

      var spawnAge = NaN;
      try {
        if (Be._1118 && typeof Be._1118[feederIdx] === 'number') {
          spawnAge = performance.now() - Be._1118[feederIdx];
        }
      } catch (_) {}

      if (Number.isFinite(spawnAge) && spawnAge >= 1000 && spawnAge <= 10000 && typeof Me._7700 === 'function') {
        if (performance.now() - _fastSpawnLastRespawnAttemptAt < 450) return;
        _fastSpawnLastRespawnAttemptAt = performance.now();
        _fastSpawnPendingRespawn = true;
        Me._7700(feederIdx);
        _fastSpawnLastLifeStamp = (Be._1118 && typeof Be._1118[feederIdx] === 'number') ? Be._1118[feederIdx] : -1;
        _fastSpawnHandledLifeStamp = -1;
        setTimeout(function() {
          _fastSpawnPendingRespawn = false;
          _fastSpawnLastLifeStamp = (globalThis.__Be && globalThis.__Be._1118 && typeof globalThis.__Be._1118[feederIdx] === 'number')
            ? globalThis.__Be._1118[feederIdx]
            : -1;
          keepTargetActive(targetIdx);
          beginFastSpawnFeed(targetIdx, feederIdx);
        }, 75);
        return;
      }

      _fastSpawnLastLifeStamp = lifeStamp;
      keepTargetActive(targetIdx);
      beginFastSpawnFeed(targetIdx, feederIdx);
    }

    function setFastSpawnEnabled(next) {
      next = !!next;
      if (!next) {
        stopFastSpawn();
        return false;
      }
      var Be = globalThis.__Be;
      if (!Be || !Be._7330 || Be._8674 < 2 || !isInGame() || isRyuUiBlockingActive()) return false;
      _fastSpawnEnabled = true;
      globalThis.__ryuFastSpawnActive = true;
      _fastSpawnTargetSlot = Be._1393;
      clearFastSpawnAction();
      if (_fastSpawnLoopTimer) clearInterval(_fastSpawnLoopTimer);
      _fastSpawnLoopTimer = setInterval(runFastSpawnCycle, 35);
      runFastSpawnCycle();
      return true;
    }

    function toggleFastSpawn() {
      return setFastSpawnEnabled(!_fastSpawnEnabled);
    }

    document.addEventListener('keydown', function(e) {
      try {
        if (!_ft_hotkeyFastSpawn) return;
        if (isTypingTarget()) return;
        if (mouseButton(_ft_hotkeyFastSpawn) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyFastSpawn.toUpperCase()) return;
        e.preventDefault();
        e.stopPropagation();
        toggleFastSpawn();
      } catch (_) {}
    }, true);

    document.addEventListener('mousedown', function(e) {
      try {
        if (!_ft_hotkeyFastSpawn) return;
        if (isTypingTarget()) return;
        var btn = mouseButton(_ft_hotkeyFastSpawn);
        if (btn < 0 || e.button !== btn) return;
        e.preventDefault();
        e.stopPropagation();
        toggleFastSpawn();
      } catch (_) {}
    }, true);

    window.addEventListener('beforeunload', stopFastSpawn);
    globalThis.__ryuFastSpawnActive = false;
    globalThis.__ryuFastSpawn = toggleFastSpawn;
    globalThis.__ryuSetFastSpawn = setFastSpawnEnabled;
    globalThis.__ryuStopFastSpawn = stopFastSpawn;
  })();

  // Inferno Macro: send a native split command to both bot slots at once.
  (function() {
    function isInGame() {
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      var mm = document.getElementById('main-menu');
      return !!(chatHidden && mm && mm.style.display === 'none');
    }

    function isTypingTarget() {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function mouseButton(label) {
      if (label === 'RIGHTCLICK') return 2;
      if (label === 'MIDDLECLICK') return 1;
      var m = /^MOUSE(\d+)$/i.exec(label || '');
      return m ? parseInt(m[1], 10) : -1;
    }

    function runInfernoMacro() {
      var Me = globalThis.__ryuMe;
      var Be = globalThis.__Be;
      if (!Me || !Be || typeof Me._6441 !== 'function') return false;
      if (!Be._7330 || Be._8674 < 1) return false;
      if (isRyuUiBlockingActive() || !isInGame()) return false;

      var sent = false;
      var maxSlots = Math.min(2, Number.isFinite(Be._8674) ? Be._8674 : 2);
      for (var i = 0; i < maxSlots; i++) {
        if (!Be._7330[i]) continue;
        try {
          Me._6441(i, 1);
          sent = true;
        } catch (_) {}
      }
      return sent;
    }

    document.addEventListener('keydown', function(e) {
      try {
        if (!_ft_hotkeyInfernoMacro) return;
        if (e.repeat || isTypingTarget()) return;
        if (mouseButton(_ft_hotkeyInfernoMacro) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyInfernoMacro.toUpperCase()) return;
        e.preventDefault();
        e.stopPropagation();
        runInfernoMacro();
      } catch (_) {}
    }, true);

    document.addEventListener('mousedown', function(e) {
      try {
        if (!_ft_hotkeyInfernoMacro) return;
        if (isTypingTarget()) return;
        var btn = mouseButton(_ft_hotkeyInfernoMacro);
        if (btn < 0 || e.button !== btn) return;
        e.preventDefault();
        e.stopPropagation();
        runInfernoMacro();
      } catch (_) {}
    }, true);

    globalThis.__ryuInfernoMacro = runInfernoMacro;
  })();

  // Targeted Feed: aim the other bot at the active bot and hold native macro eject.
  (function() {
    var _targetedFeedTimer = null;
    var _targetedFeedSlot = -1;
    var _targetedFeedTarget = -1;
    var _targetedFeedKeyDown = false;

    function isInGame() {
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      var mm = document.getElementById('main-menu');
      return !!(chatHidden && mm && mm.style.display === 'none');
    }

    function isTypingTarget() {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function mouseButton(label) {
      if (label === 'RIGHTCLICK') return 2;
      if (label === 'MIDDLECLICK') return 1;
      var m = /^MOUSE(\d+)$/i.exec(label || '');
      return m ? parseInt(m[1], 10) : -1;
    }

    function getUnitPos(Be, idx) {
      try {
        var unit = Be && Be._6328 && Be._6328[idx];
        if (!unit) return null;
        return { x: unit._7847, y: unit._9202 };
      } catch (_) {}
      return null;
    }

    function getFeedSlot(Be, targetIdx) {
      if (!Be || !Be._7330 || !Number.isFinite(Be._8674) || Be._8674 < 2) return -1;
      for (var i = 0; i < Math.min(2, Be._8674); i++) {
        if (i !== targetIdx && Be._7330[i]) return i;
      }
      for (var j = 0; j < Be._8674; j++) {
        if (j !== targetIdx && Be._7330[j]) return j;
      }
      return -1;
    }

    function stopTargetedFeed() {
      if (_targetedFeedTimer !== null) {
        clearInterval(_targetedFeedTimer);
        _targetedFeedTimer = null;
      }
      try {
        var Me = globalThis.__ryuMe;
        if (Me && typeof Me._3605 === 'function' && _targetedFeedSlot >= 0) {
          Me._3605(_targetedFeedSlot, false);
        }
      } catch (_) {}
      _targetedFeedSlot = -1;
      _targetedFeedTarget = -1;
      _targetedFeedKeyDown = false;
      globalThis.__ryuTargetedFeedActive = false;
    }

    function tickTargetedFeed() {
      var Me = globalThis.__ryuMe;
      var Be = globalThis.__Be;
      if (!Me || !Be || !Be._7330 || typeof Me._9701 !== 'function' || typeof Me._3605 !== 'function') {
        stopTargetedFeed();
        return false;
      }
      if (isRyuUiBlockingActive() || !isInGame()) {
        stopTargetedFeed();
        return false;
      }
      if (!Be._7330[_targetedFeedTarget] || !Be._7330[_targetedFeedSlot]) {
        stopTargetedFeed();
        return false;
      }
      var pos = getUnitPos(Be, _targetedFeedTarget);
      if (!pos) return false;
      try {
        Me._9701(_targetedFeedSlot, pos.x, pos.y);
        Me._3605(_targetedFeedSlot, true);
      } catch (_) {}
      return true;
    }

    function startTargetedFeed() {
      if (_targetedFeedTimer !== null) return true;
      var Be = globalThis.__Be;
      if (!Be || !Be._7330 || Be._8674 < 2 || isRyuUiBlockingActive() || !isInGame()) return false;
      var targetIdx = Be._1393;
      var feedIdx = getFeedSlot(Be, targetIdx);
      if (feedIdx < 0 || !Be._7330[targetIdx]) return false;
      _targetedFeedTarget = targetIdx;
      _targetedFeedSlot = feedIdx;
      globalThis.__ryuTargetedFeedActive = true;
      tickTargetedFeed();
      _targetedFeedTimer = setInterval(tickTargetedFeed, 35);
      return true;
    }

    document.addEventListener('keydown', function(e) {
      try {
        if (!_ft_hotkeyTargetedFeed) return;
        if (e.repeat || _targetedFeedKeyDown || isTypingTarget()) return;
        if (mouseButton(_ft_hotkeyTargetedFeed) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyTargetedFeed.toUpperCase()) return;
        e.preventDefault();
        e.stopPropagation();
        _targetedFeedKeyDown = true;
        startTargetedFeed();
      } catch (_) {}
    }, true);

    document.addEventListener('keyup', function(e) {
      try {
        if (!_ft_hotkeyTargetedFeed) return;
        if (mouseButton(_ft_hotkeyTargetedFeed) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyTargetedFeed.toUpperCase()) return;
        e.preventDefault();
        e.stopPropagation();
        stopTargetedFeed();
      } catch (_) {}
    }, true);

    document.addEventListener('mousedown', function(e) {
      try {
        if (!_ft_hotkeyTargetedFeed) return;
        if (isTypingTarget()) return;
        var btn = mouseButton(_ft_hotkeyTargetedFeed);
        if (btn < 0 || e.button !== btn) return;
        e.preventDefault();
        e.stopPropagation();
        startTargetedFeed();
      } catch (_) {}
    }, true);

    document.addEventListener('mouseup', function(e) {
      try {
        if (!_ft_hotkeyTargetedFeed) return;
        var btn = mouseButton(_ft_hotkeyTargetedFeed);
        if (btn < 0 || e.button !== btn) return;
        e.preventDefault();
        e.stopPropagation();
        stopTargetedFeed();
      } catch (_) {}
    }, true);

    window.addEventListener('blur', stopTargetedFeed);
    window.addEventListener('beforeunload', stopTargetedFeed);
    globalThis.__ryuTargetedFeedActive = false;
    globalThis.__ryuStartTargetedFeed = startTargetedFeed;
    globalThis.__ryuStopTargetedFeed = stopTargetedFeed;
  })();

  // celebrate hotkey: circle movement + hold native MACRO EJECT bind for 3 seconds
  (function() {
    var _celebrating = false;

    function isInGame() {
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      var mm = document.getElementById('main-menu');
      return !!(chatHidden && mm && mm.style.display === 'none');
    }

    function isTypingTarget() {
      var el = document.activeElement;
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function normalizeBindText(text) {
      return String(text || '')
        .replace(/keyboard$/i, '')
        .replace(/mouse$/i, '')
        .trim()
        .toUpperCase();
    }

    function getNativeMacroEjectBind() {
      var found = '';
      document.querySelectorAll('.sm-row').forEach(function(row) {
        if (found) return;
        var nameEl = row.querySelector('.sm-setting-name');
        if (!nameEl || nameEl.textContent.trim().toUpperCase() !== 'MACRO EJECT') return;
        var binds = row.querySelectorAll('.sm-control-input-box');
        for (var i = 0; i < binds.length; i++) {
          var val = normalizeBindText(binds[i].textContent);
          if (val && val !== '\u2014' && val !== '-') {
            found = val;
            break;
          }
        }
      });
      return found;
    }

    function keyInfo(label) {
      var key = String(label || '').toUpperCase();
      var map = {
        SPACE: { key: ' ', code: 'Space' },
        SHIFT: { key: 'Shift', code: 'ShiftLeft' },
        CTRL: { key: 'Control', code: 'ControlLeft' },
        CONTROL: { key: 'Control', code: 'ControlLeft' },
        ALT: { key: 'Alt', code: 'AltLeft' },
        TAB: { key: 'Tab', code: 'Tab' },
        ENTER: { key: 'Enter', code: 'Enter' }
      };
      if (map[key]) return map[key];
      if (/^[A-Z]$/.test(key)) return { key: key.toLowerCase(), code: 'Key' + key };
      if (/^[0-9]$/.test(key)) return { key: key, code: 'Digit' + key };
      return { key: key.length === 1 ? key.toLowerCase() : key, code: key };
    }

    function dispatchKey(label, type) {
      var info = keyInfo(label);
      var canvas = document.getElementById('main-canvas');
      [document, window, canvas].forEach(function(target) {
        if (!target) return;
        target.dispatchEvent(new KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          key: info.key,
          code: info.code
        }));
      });
    }

    function mouseButton(label) {
      if (label === 'RIGHTCLICK') return 2;
      if (label === 'MIDDLECLICK') return 1;
      var m = /^MOUSE(\d+)$/i.exec(label || '');
      return m ? parseInt(m[1], 10) : -1;
    }

    function dispatchMouseButton(label, type, x, y) {
      var btn = mouseButton(label);
      if (btn < 0) return;
      var canvas = document.getElementById('main-canvas');
      if (!canvas) return;
      canvas.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: btn,
        buttons: type === 'mouseup' ? 0 : (1 << btn),
        clientX: x,
        clientY: y
      }));
    }

    function dispatchCircleMove(canvas, x, y) {
      [canvas, document, window].forEach(function(target) {
        if (!target) return;
        target.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        }));
        try {
          target.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            clientX: x,
            clientY: y
          }));
        } catch(_) {}
      });
    }

    function startCelebrate() {
      if (_celebrating || isRyuUiBlockingActive() || !isInGame()) return;
      var canvas = document.getElementById('main-canvas');
      if (!canvas) return;
      var bind = getNativeMacroEjectBind();
      var isMouse = mouseButton(bind) >= 0;
      var rect = canvas.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var radius = Math.max(240, Math.min(rect.width, rect.height) * 0.42);
      var start = performance.now();
      _celebrating = true;

      if (bind) {
        if (isMouse) dispatchMouseButton(bind, 'mousedown', centerX, centerY);
        else dispatchKey(bind, 'keydown');
      }

      var timer = setInterval(function() {
        var elapsed = performance.now() - start;
        if (elapsed >= 3000 || !isInGame()) {
          clearInterval(timer);
          if (bind) {
            if (isMouse) dispatchMouseButton(bind, 'mouseup', _mouseX, _mouseY);
            else dispatchKey(bind, 'keyup');
          }
          _celebrating = false;
          return;
        }
        var a = elapsed / 1000 * Math.PI * 9;
        var x = centerX + Math.cos(a) * radius;
        var y = centerY + Math.sin(a) * radius;
        _mouseX = x;
        _mouseY = y;
        dispatchCircleMove(canvas, x, y);
      }, 16);
    }

    document.addEventListener('keydown', function(e) {
      try {
        if (!_ft_hotkeyCelebrate) return;
        if (isTypingTarget()) return;
        if (mouseButton(_ft_hotkeyCelebrate) >= 0) return;
        if ((e.key || '').toUpperCase() !== _ft_hotkeyCelebrate.toUpperCase()) return;
        e.preventDefault();
        e.stopPropagation();
        startCelebrate();
      } catch (_) {}
    }, true);

    document.addEventListener('mousedown', function(e) {
      try {
        if (!_ft_hotkeyCelebrate) return;
        if (isTypingTarget()) return;
        var btn = mouseButton(_ft_hotkeyCelebrate);
        if (btn < 0 || e.button !== btn) return;
        e.preventDefault();
        e.stopPropagation();
        startCelebrate();
      } catch (_) {}
    }, true);

    globalThis.__ryuCelebrate = startCelebrate;
  })();

  // split counter HUD
  (function() {
    var _splitEl = null;
    var _fastSpawnEl = null;
    var _mainMenuEl = null;
    var _lastVisible = false;
    var _lastText = '';
    var _lastFastSpawnVisible = false;

    function getSplitEl() {
      if (_splitEl && document.body.contains(_splitEl)) return _splitEl;
      _splitEl = document.createElement('div');
      _splitEl.id = 'ryu-split-counter';
      _splitEl.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:9999;font-family:"Noto Sans",sans-serif;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 16px;letter-spacing:2px;pointer-events:none;display:none;';
      document.body.appendChild(_splitEl);
      return _splitEl;
    }

    function getFastSpawnEl() {
      if (_fastSpawnEl && document.body.contains(_fastSpawnEl)) return _fastSpawnEl;
      _fastSpawnEl = document.createElement('div');
      _fastSpawnEl.id = 'ryu-fast-spawn-indicator';
      _fastSpawnEl.textContent = 'AUTO SPAWN ACTIVE';
      _fastSpawnEl.style.cssText = 'position:fixed;bottom:52px;left:50%;transform:translateX(-50%);z-index:9999;font-family:"Noto Sans",sans-serif;font-size:12px;font-weight:800;color:rgba(255,255,255,0.96);background:rgba(0,0,0,0.38);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:5px 14px;letter-spacing:2px;text-transform:uppercase;pointer-events:none;display:none;';
      document.body.appendChild(_fastSpawnEl);
      return _fastSpawnEl;
    }

    function setSplitVisible(el, visible) {
      if (_lastVisible === visible) return;
      _lastVisible = visible;
      if (el) el.style.display = visible ? 'block' : 'none';
    }

    function setFastSpawnVisible(el, visible) {
      if (_lastFastSpawnVisible === visible) return;
      _lastFastSpawnVisible = visible;
      if (el) el.style.display = visible ? 'block' : 'none';
    }

    function getOwnSplitCount(players) {
      var me = null;
      for (const p of players.values()) {
        if (p._2430 && p._2430.size > 0) me = p;
      }
      return me && me._2430 ? me._2430.size : 0;
    }

    setInterval(function() {
      try {
        var el = _splitEl;
        var fastEl = _fastSpawnEl;
        var fastSpawnOn = !!globalThis.__ryuFastSpawnActive;
        if (!_ft_splitCounterOn) {
          if (el) setSplitVisible(el, false);
          _lastText = '';
        }
        if (!_mainMenuEl || !_mainMenuEl.isConnected) _mainMenuEl = document.getElementById('main-menu');
        if (!_mainMenuEl || _mainMenuEl.style.display !== 'none') {
          if (el) setSplitVisible(el, false);
          if (fastEl) setFastSpawnVisible(fastEl, false);
          _lastText = '';
          return;
        }
        if (fastSpawnOn) {
          fastEl = getFastSpawnEl();
          setFastSpawnVisible(fastEl, true);
          // Position to the right of the split counter when it's visible,
          // otherwise fall back to centered above the HUD.
          var splitEl = _splitEl;
          if (splitEl && splitEl.style.display !== 'none') {
            var rect = splitEl.getBoundingClientRect();
            fastEl.style.left = (rect.right + 8) + 'px';
            fastEl.style.bottom = '12px';
            fastEl.style.transform = 'none';
          } else {
            fastEl.style.left = '50%';
            fastEl.style.bottom = '52px';
            fastEl.style.transform = 'translateX(-50%)';
          }
        } else if (fastEl) {
          setFastSpawnVisible(fastEl, false);
        }
        if (!_ft_splitCounterOn) return;
        var players = globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._4221;
        if (!players) {
          if (el) setSplitVisible(el, false);
          _lastText = '';
          return;
        }
        var cur = getOwnSplitCount(players);
        if (!cur) {
          if (el) setSplitVisible(el, false);
          _lastText = '';
          return;
        }
        var max = window._ryuSplitMax || '?';
        var text = cur + ' / ' + max;
        el = getSplitEl();
        setSplitVisible(el, true);
        if (text !== _lastText) {
          _lastText = text;
          el.textContent = text;
        }
      } catch(e) {}
    }, 125);
  })();

  // ── Viewport culling ─────────────────────────────────────────────────────
  // Pixi has no built-in culling — every entity in the scene graph is
  // processed by the renderer even when thousands of world units off-screen.
  // We hook into postrender and set visible=false on any entity whose
  // bounding circle lies entirely outside the camera viewport.  The flag is
  // read by Pixi at the start of the very next render call (~7ms later at
  // 145fps) so the one-frame delay is imperceptible.
  //
  // Toggle off if anything looks wrong: window.__ryuCulling = false
  (function() {
    var _on = true;
    window.__ryuCulling = true;
    Object.defineProperty(window, '__ryuCulling', {
      get: function() { return _on; },
      set: function(v) { _on = !!v; if (!v) _restoreAll(); }
    });

    // When culling is disabled, make sure everything is visible again.
    function _restoreAll() {
      var ne = globalThis.__ne;
      if (!ne) return;
      try {
        for (var cell of ne._2430.values()) {
          if (cell._7588) cell._7588.visible = true;
        }
      } catch (_) {}
    }

    function cullFrame() {
      if (!_on) return;
      var ne = globalThis.__ne;
      var z  = globalThis.__z_;
      var X  = globalThis.__X_;
      if (!ne || !z || !X) return;

      var zoom = z._4336;
      if (!zoom) return;

      var camX = z._3852._7847;
      var camY = z._3852._9202;

      // Viewport half-extents in world units.
      // X_._3473 / X_._3195 = internal render dimensions (already accounts for
      // devicePixelRatio and resolution scale), matching the world setTransform.
      // Add 5% margin so cells don't pop in at the exact viewport edge.
      var hw = (X._3473 / zoom) * 0.55;
      var hh = (X._3195 / zoom) * 0.55;
      var minX = camX - hw, maxX = camX + hw;
      var minY = camY - hh, maxY = camY + hh;

      try {
        for (var cell of ne._2430.values()) {
          var spr = cell._7588;
          if (!spr) continue;
          var r = cell._1904 || 0;
          spr.visible = (
            cell._7847 + r >= minX && cell._7847 - r <= maxX &&
            cell._9202 + r >= minY && cell._9202 - r <= maxY
          );
        }
      } catch (_) {}
    }

    function initCulling() {
      var X = globalThis.__X_;
      if (!X || !X._1855) { setTimeout(initCulling, 300); return; }
      var runners = X._1855.runners;
      if (!runners || !runners.postrender) { setTimeout(initCulling, 300); return; }
      runners.postrender.add({ postrender: cullFrame });
      console.log('[RyuTheme] Viewport culling active — window.__ryuCulling = false to disable');
    }
    setTimeout(initCulling, 2000);
  })();
  // ─────────────────────────────────────────────────────────────────────────

  console.log('%c' +
    ' ██████╗ ██╗   ██╗██╗   ██╗████████╗██╗  ██╗███████╗███╗   ███╗███████╗\n' +
    ' ██╔══██╗╚██╗ ██╔╝██║   ██║╚══██╔══╝██║  ██║██╔════╝████╗ ████║██╔════╝\n' +
    ' ██████╔╝ ╚████╔╝ ██║   ██║   ██║   ███████║█████╗  ██╔████╔██║█████╗  \n' +
    ' ██╔══██╗  ╚██╔╝  ██║   ██║   ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══╝  \n' +
    ' ██║  ██║   ██║   ╚██████╔╝   ██║   ██║  ██║███████╗██║ ╚═╝ ██║███████╗\n' +
    ' ╚═╝  ╚═╝   ╚═╝    ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝\n' +
    '                          Extension loaded.',
    'color:#22d3ee;font-family:monospace;font-size:11px;');
})();
