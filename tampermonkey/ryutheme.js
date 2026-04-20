(function () {
  'use strict';

  // capture ws so we can derive room id later
  const _origWS = window.WebSocket;

  const _SERVER_MAX = { '01': 16, '02': 16, '03': 128, '04': 64, '05': 16, '06': 16 };

  window.WebSocket = function (...args) {
    const ws = new _origWS(...args);
    window._ryuWS = ws;
    try {
      const m = args[0] && args[0].match(/server-(\d+)/);
      if (m) window._ryuSplitMax = _SERVER_MAX[m[1]] || 0;
    } catch(e) {}
    return ws;
  };
  window.WebSocket.prototype = _origWS.prototype;

  // theme storage helpers
  const STORAGE_KEY = 'ryuTheme';
  let _themeCache = null;
  function loadTheme() {
    if (_themeCache !== null) return _themeCache;
    try { _themeCache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { _themeCache = {}; }
    return _themeCache;
  }
  function invalidateThemeCache() { _themeCache = null; }
  function saveTheme(t) { _themeCache = t; localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

  // fast-path flags, refreshed every 250ms to avoid per-frame storage reads
  let _ft_useDefault  = false;
  let _ft_fontIndex   = 0;
  let _ft_massFont    = 0;
  let _ft_boldName    = false;
  let _ft_hideFlags   = false;
  let _ft_syncMass    = false;
  let _ft_strokeOn    = false;
  let _ft_strokeColor = '#000000';
  let _ft_leftwardTag = true;
  let _ft_hotkeyDisconnect = '';
  let _ft_hotkeyDangerOverlay = '';
  let _ft_hotkeyMinimalMode = '';
  let _ft_hotkeyFreecam = '';
  let _ft_pelletStyle = 0;
  let _ft_pelletEmojiOn = false;
  let _ft_pelletImgurOn = false;
  let _ft_pelletEmoji = '\uD83D\uDD25';
  let _ft_pelletImgur = '';

  function _updateNameTint() {
    if (globalThis.__ryuNameTintLocked) return;
    const t = loadTheme();
    const hex = t.useDefault ? '#ffffff' : (t.color || '#ff69b4');
    const val = parseInt(hex.replace('#', ''), 16);
    globalThis.__ryuNameTint = val === 0 ? 0x010101 : val;
  }
  setInterval(function() {
  _themeCache = null;
  _updateNameTint();
  const t = loadTheme();
  _ft_useDefault  = !!t.useDefault;

  globalThis.__ryuHideNativeTag = !!t.leftwardTag;

  _ft_fontIndex   = t.fontIndex || 0;
  _ft_massFont    = t.massFont !== undefined ? t.massFont : _ft_fontIndex;
  _ft_boldName    = !!t.boldName;
  _ft_hideFlags   = !!t.hideFlags;
  _ft_syncMass    = !!t.syncMass;
  _ft_strokeOn    = !!t.strokeOn;
  _ft_strokeColor = t.strokeColor || '#000000';
  _ft_leftwardTag = t.leftwardTag !== false;
  _ft_hotkeyDisconnect = t.hotkeyDisconnect || '';
  _ft_hotkeyDangerOverlay = t.hotkeyDangerOverlay || '';
  _ft_hotkeyMinimalMode = t.hotkeyMinimalMode || '';
  _ft_hotkeyFreecam = t.hotkeyFreecam || '';
  _ft_pelletEmojiOn = !!t.pelletEmojiOn;
  _ft_pelletImgurOn = !!t.pelletImgurOn;
  _ft_pelletStyle = t.useDefault ? 0 : (_ft_pelletImgurOn ? 2 : (_ft_pelletEmojiOn ? 1 : 0));
  _ft_pelletEmoji = t.pelletEmoji || '\uD83D\uDD25';
  _ft_pelletImgur = t.pelletImgur || '';
  globalThis.__ryuPelletStyle = _ft_pelletStyle;
  globalThis.__ryuPelletEmoji = _ft_pelletEmoji;
  globalThis.__ryuPelletImgur = _ft_pelletImgur;
  globalThis.__ryuRainbowFoodParticles = !t.useDefault && !!t.rainbowParticlesOn;
  globalThis.__ryuAgarMap = !t.useDefault && !!t.agarMapOn;
  globalThis.__ryuTeamColors = JSON.parse(localStorage.getItem('ryuTeamColors') || '{}');
}, 250);

  // set defaults for any missing keys
  let theme = loadTheme();
  if (theme.color       === undefined) theme.color       = '#ff69b4';
  if (theme.massColor   === undefined) theme.massColor   = '#ff69b4';
  if (theme.fontIndex   === undefined) theme.fontIndex   = 0;
  if (theme.massFont    === undefined) theme.massFont    = 0;
  if (theme.syncMass    === undefined) theme.syncMass    = false;
  if (theme.cursorOn    === undefined) theme.cursorOn    = false;
  if (theme.cursorIdx   === undefined) theme.cursorIdx   = 0;
  if (theme.useDefault  === undefined) theme.useDefault  = false;
  if (theme.boldName    === undefined) theme.boldName    = false;
  if (theme.hideFlags   === undefined) theme.hideFlags   = false;
  if (theme.leftwardTag === undefined) theme.leftwardTag = true;
  if (theme.lbColor       === undefined) theme.lbColor       = '#ffffff';
  if (theme.commanderText === undefined) theme.commanderText = '';
  if (theme.strokeOn      === undefined) theme.strokeOn      = false;
  if (theme.strokeColor   === undefined) theme.strokeColor   = '#000000';
  if (theme.minimapSize   === undefined) theme.minimapSize   = 280;
  if (theme.rainbowBorderOn    === undefined) theme.rainbowBorderOn    = false;
  if (theme.rainbowBorderSpeed === undefined) theme.rainbowBorderSpeed = 60;
  if (theme.rainbowGlowOn      === undefined) theme.rainbowGlowOn      = false;
  if (theme.rainbowGlowSpeed   === undefined) theme.rainbowGlowSpeed   = 60;
  if (theme.rainbowParticlesOn    === undefined) theme.rainbowParticlesOn    = false;
  if (theme.agarMapOn             === undefined) theme.agarMapOn             = false;
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
  if (theme.sectorOverlayOn    === undefined) theme.sectorOverlayOn    = false;
  if (theme.sectorLabelColor   === undefined) theme.sectorLabelColor   = '#ffffff';
  if (theme.sectorGridColor    === undefined) theme.sectorGridColor    = '#b4b4b4';
  if (theme.sectorFont         === undefined) theme.sectorFont         = 0;
  if (theme.emotesOn           === undefined) theme.emotesOn           = true;
  if (theme.hotkeyEmote        === undefined) theme.hotkeyEmote        = 'RIGHTCLICK';
  if (theme.hotkeyDangerOverlay === undefined) theme.hotkeyDangerOverlay = '';
  if (theme.minimalModeOn       === undefined) theme.minimalModeOn       = false;
  if (theme.mmHideLB            === undefined) theme.mmHideLB            = true;
  if (theme.mmHideChat          === undefined) theme.mmHideChat          = true;
  if (theme.mmHideMinimap       === undefined) theme.mmHideMinimap       = true;
  if (theme.mmHideEnemyNames    === undefined) theme.mmHideEnemyNames    = false;
  if (theme.mmHideOwnName       === undefined) theme.mmHideOwnName       = false;
  if (theme.hotkeyMinimalMode   === undefined) theme.hotkeyMinimalMode   = '';
  if (theme.hotkeyFreecam       === undefined) theme.hotkeyFreecam       = '';
  if (theme.animSoftenOn       === undefined) theme.animSoftenOn       = false;
  if (theme.animSoftenVal      === undefined) theme.animSoftenVal      = 80;
  if (theme.dangerShowGreen    === undefined) theme.dangerShowGreen    = true;
  if (theme.dangerShowBlue     === undefined) theme.dangerShowBlue     = true;
  if (theme.dangerShowYellow   === undefined) theme.dangerShowYellow   = true;
  if (theme.dangerShowRed      === undefined) theme.dangerShowRed      = true;
  if (theme.chatboxThemeOn     === undefined) theme.chatboxThemeOn     = false;
  if (theme.lbThemeOn          === undefined) theme.lbThemeOn          = true;
  if (theme.lbStyle            === undefined) theme.lbStyle            = 0;
  if (theme.minimapThemeOn     === undefined) theme.minimapThemeOn     = true;
  if (theme.minimapStyle       === undefined) theme.minimapStyle       = 1;
  if (theme.chatNameColor      === undefined) theme.chatNameColor      = null;
  if (theme.lbSize             === undefined) theme.lbSize             = 'M';
  if (theme.mmScale            === undefined) theme.mmScale            = 20;
  if (theme.chatScale          === undefined) theme.chatScale          = 40;
  if (theme.mmScale   < 10) theme.mmScale   = 20;
  if (theme.chatScale < 10) theme.chatScale = 40;
  if (theme.pelletColorOn      === undefined) theme.pelletColorOn      = false;
  if (theme.pelletColor        === undefined) theme.pelletColor        = '#ff69b4';
  if (theme.rainbowPelletOn    === undefined) theme.rainbowPelletOn    = false;
  if (theme.pelletStyle        === undefined) theme.pelletStyle        = 0;
  if (theme.pelletEmojiOn      === undefined) theme.pelletEmojiOn      = theme.pelletStyle === 1;
  if (theme.pelletImgurOn      === undefined) theme.pelletImgurOn      = theme.pelletStyle === 2;
  if (theme.pelletEmoji        === undefined) theme.pelletEmoji        = '\uD83D\uDD25';
  if (theme.pelletImgur        === undefined) theme.pelletImgur        = '';
  theme.pelletStyle = theme.pelletImgurOn ? 2 : (theme.pelletEmojiOn ? 1 : 0);
  saveTheme(theme);
  globalThis.__ryuHideNativeTag = theme.leftwardTag !== false;
  globalThis.__ryuPelletStyle = theme.useDefault ? 0 : (theme.pelletImgurOn ? 2 : (theme.pelletEmojiOn ? 1 : 0));
  globalThis.__ryuPelletEmoji = theme.pelletEmoji || '\uD83D\uDD25';
  globalThis.__ryuPelletImgur = theme.pelletImgur || '';
  globalThis.__ryuRainbowFoodParticles = !theme.useDefault && !!theme.rainbowParticlesOn;
  globalThis.__ryuAgarMap = !theme.useDefault && !!theme.agarMapOn;

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
    {
      var _extBase = document.documentElement.getAttribute('data-ryu-ext-origin') || '';
      if (_extBase) {
        const geoStyle = document.createElement('style');
        geoStyle.textContent = '@font-face{font-family:"Geogrotesque Cyr";src:url("' + _extBase + '/fonts/GeogrotesqueCyr-Regular.woff2") format("woff2");font-weight:400;font-style:normal;}';
        (document.head || document.documentElement).appendChild(geoStyle);
      }
    }
  }
  if (document.head) injectFonts();
  else document.addEventListener('DOMContentLoaded', injectFonts);

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

  function _nowMs() {
    return (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
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

  function getLeftwardTagForName(text) {
    const cleanName = stripFlagPrefix(text);
    if (!cleanName) return '';
    const teams = globalThis.__ryuPlayerTeams;
    if (!teams) return '';
    const rawTag = teams[cleanName];
    const tag = String(rawTag || '').trim();
    return tag && tag !== 'ITS-BOT-TEAM' ? tag : '';
  }

  function isKnownLeftwardTag(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return false;
    const teams = globalThis.__ryuPlayerTeams;
    if (!teams) return false;
    const vals = Object.values(teams);
    for (let i = 0; i < vals.length; i++) {
      const tag = String(vals[i] || '').trim();
      if (tag && tag !== 'ITS-BOT-TEAM' && tag === trimmed) return true;
    }
    return false;
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

    function setStyledTextState(ctx, size, isPlayerName) {
      const prev = {
        font: ctx.font,
        fillStyle: ctx.fillStyle,
        strokeStyle: ctx.strokeStyle,
        lineWidth: ctx.lineWidth,
        textBaseline: ctx.textBaseline,
        textAlign: ctx.textAlign,
        shadowBlur: ctx.shadowBlur,
        shadowColor: ctx.shadowColor
      };

      const weight = _ft_boldName ? '900' : '600';
      const fontIdx = isPlayerName ? _ft_fontIndex : _ft_massFont;
      const fontDef = FONTS[fontIdx] || FONTS[0];
      ctx.font = fontIdx > 0
        ? `${fontDef.style} ${weight} ${size * (isPlayerName ? 0.92 : 1)}px "${fontDef.value}", ${isPlayerName ? '"Twemoji Country Flags", ' : ''}sans-serif`
        : `${weight} ${size}px ${isPlayerName ? '"Twemoji Country Flags", ' : ''}"Titillium Web", sans-serif`;

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const t = loadTheme();
      ctx.fillStyle = isPlayerName
        ? '#ffffff'
        : (_ft_syncMass ? (t.color || '#ff69b4') : (t.massColor || '#ff69b4'));

      return prev;
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
      if (_ft_strokeOn && isPlayerName) {
        ctx.strokeStyle = _ft_strokeColor;
        ctx.lineWidth = Math.max(size * 0.08, 2);
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
      const nameWidth = measureStyledTextWidth(ctx, currentText, nameSize, true);
      const comboWidth = measureStyledTextWidth(ctx, combinedText, nameSize, true);
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
          const approxTagWidth = Math.max(nameSize, measureStyledTextWidth(ctx, pendingTag.text, Math.max(nameSize * 0.62, 10), true));
          left = Math.min(left, pendingTag.x - approxTagWidth);
          top = Math.min(top, pendingTag.y - nameSize * 0.8);
          right = Math.max(right, pendingTag.x + approxTagWidth);
          bottom = Math.max(bottom, pendingTag.y + nameSize * 0.8);
        }
      }

      ctx.clearRect(left, top, Math.max(right - left, 1), Math.max(bottom - top, 1));
    }

    proto.fillRect = function (x, y, w, h, ...rest) {
      if (_suppressNextFillRect) {
        _suppressNextFillRect = false;
        return;
      }
      // record last rect in case it's a tag background (game draws rect then tag text)
      _lastTagRect = { ctx: this, x, y, w, h };
      return originalFillRect.call(this, x, y, w, h, ...rest);
    };

    proto.measureText = function(text, ...rest) {
      if (_ft_useDefault || !text) return originalMeasureText.call(this, text, ...rest);
      const combined = getCombinedLeftwardText(text);
      if (combined) return originalMeasureText.call(this, combined, ...rest);
      return originalMeasureText.call(this, text, ...rest);
    };

    proto.strokeText = function (text, x, y, ...rest) {
      if (this._ryuStroke) return originalStrokeText.call(this, text, x, y, ...rest);
      if (_ft_useDefault) return originalStrokeText.call(this, text, x, y, ...rest);
      if (_ft_leftwardTag) {
        const combined = getCombinedLeftwardText(text);
        if (combined) return;
        if (isKnownLeftwardTag(text)) return;
      }
      if (this.canvas.width === 1024 && this.canvas.height === 1024)
        return originalStrokeText.call(this, text, x, y, ...rest);
    };

    proto.fillText = function (text, x, y, ...rest) {
      if (_ft_useDefault)
        return originalFillText.call(this, text, x, y, ...rest);

      const isTwemoji = this.font.includes('Twemoji Country Flags');
      const trimmedText = String(text).trim();
      const isNumericText = trimmedText !== '' && !isNaN(Number(text));
      const isKnownName = _ft_leftwardTag && isKnownLeftwardName(text);
      const isKnownTag = _ft_leftwardTag && isKnownLeftwardTag(text);
      const isPlayerName = (isTwemoji && !isNumericText) || (!isTwemoji && isKnownName && !isNumericText);
      const isEnergy = isTwemoji && isNumericText;
      const isAtlasCanvas = this.canvas.width === 1024 && this.canvas.height === 1024;
      const sourcePatched = !!globalThis.__ryuLocalLeftwardSourcePatch;

      if (isAtlasCanvas && !isKnownName && !isKnownTag)
        return originalFillText.call(this, text, x, y, ...rest);

      // suppress native team tag pill — game draws fillRect then fillText(tag)
      if (!sourcePatched && !isTwemoji && globalThis.__ryuHideNativeTag && (isLikelyNativeTagDraw(this, text, x, y) || isKnownTag)) {
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
        if (_ft_leftwardTag && existingName) {
          if (_lastTagRect && _lastTagRect.ctx === this) {
            this.clearRect(_lastTagRect.x, _lastTagRect.y, _lastTagRect.w, _lastTagRect.h);
          }
          const combinedText = '[' + trimmed + '] ' + existingName.text;
          clearInlineTagArtifacts(this, existingName.x, existingName.y, existingName.size, existingName.renderedText, combinedText, { text: trimmed, x, y, rect: _lastTagRect });
          drawStyledText(this, combinedText, existingName.x, existingName.y, existingName.size, true, existingName.rest);
          _lastTagRect = null;
          return;
        }
        if (_ft_leftwardTag) {
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

      if (!isPlayerName && !isEnergy)
        return originalFillText.call(this, text, x, y, ...rest);

      if (isPlayerName && _ft_hideFlags)
        text = text.replace(/[\u{1F1E0}-\u{1F1FF}]{2}\s*/gu, '');

      const size = getFontSize(this.font);
      if (isPlayerName && _ft_leftwardTag && !sourcePatched) {
        const mappedTag = getLeftwardTagForName(text);
        const pendingTag = takePendingLeftwardTag(this, x, y, size, _nowMs());
        const resolvedTag = mappedTag || (pendingTag ? pendingTag.text : '');
        const renderedText = resolvedTag ? '[' + resolvedTag + '] ' + text : text;
        if (pendingTag) {
          clearInlineTagArtifacts(this, x, y, size, text, renderedText, pendingTag);
        }
        drawStyledText(this, renderedText, x, y, size, true, rest);
        if (!resolvedTag) {
          const now = _nowMs();
          _recentPlayerNames.push({ ctx: this, x, y, size, text, renderedText, rest: Array.from(rest), ts: now });
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
  // mass font poll
  let _lastMassFont = null;
  setInterval(function() {
    const t = loadTheme();
    const cur = t.massFont !== undefined ? t.massFont : (t.fontIndex || 0);
    if (_lastMassFont === null) { _lastMassFont = cur; return; }
    if (cur !== _lastMassFont) {
      _lastMassFont = cur;
      if (window.__ryuRedrawFont) window.__ryuRedrawFont(cur);
    }
  }, 500);

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
    if (!_clearAtlas()) {
      _scheduleSingleAtlasClear();
    } else {
      _scheduleLeftwardFallbackDecorations();
    }
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
  globalThis.__ryuApplyLeftwardTagState = _applyLeftwardTagState;

  setInterval(function() {
    const t = loadTheme();
    const cur = t.fontIndex || 0;
    const useDefault = !!t.useDefault;
    const leftwardTag = t.leftwardTag !== false;
    globalThis.__ryuHideNativeTag = leftwardTag;
    if (_lastNameFont === null) {
      globalThis.__ryuNameFont = NAME_FONTS[cur] || 'Titillium Web';
      _lastNameFont = cur;
      _lastUseDefault = useDefault;
      _lastLeftwardTagState = leftwardTag;
      if (cur > 0 && !useDefault) _startupAtlasClear();
      return;
    }
    if (cur !== _lastNameFont || useDefault !== _lastUseDefault || leftwardTag !== _lastLeftwardTagState) {
      _lastNameFont = cur;
      _lastUseDefault = useDefault;
      _lastLeftwardTagState = leftwardTag;
      globalThis.__ryuNameFont = NAME_FONTS[cur] || 'Titillium Web';
      _scheduleSingleAtlasClear();
    }
  }, 100);

  _scheduleLeftwardFallbackDecorations();

  // hide flags poll
  let _lastHideFlags = null;
  setInterval(function() {
    const t = loadTheme();
    const cur = !!t.hideFlags;
    if (_lastHideFlags === null) { _lastHideFlags = cur; return; }
    if (cur !== _lastHideFlags) {
      _lastHideFlags = cur;
      _scheduleSingleAtlasClear();
    }
  }, 500);

  // commander text poll
  let _lastCommanderText = null;
  setInterval(function() {
    const t = loadTheme();
    const cur = t.commanderText || '';
    if (_lastCommanderText === null) {
      globalThis.__ryuCommanderText = cur;
      _lastCommanderText = cur;
      return;
    }
    if (cur !== _lastCommanderText) {
      _lastCommanderText = cur;
      globalThis.__ryuCommanderText = cur;
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

    function hexToRgb(hex) {
      const v = parseInt(hex.replace('#', ''), 16);
      return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    }

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

    setInterval(function() {
      const t = loadTheme();
      if (t.useDefault || !t.pelletColorOn) {
        _pelletColors.clear();
        return;
      }
      if (!globalThis.__ne || !globalThis.__ne._2430) return;

      const liveIds = new Set();

      for (const cell of globalThis.__ne._2430.values()) {
        if (cell._7926 !== 2) continue;

        const id = cell._9782;
        liveIds.add(id);

        if (t.rainbowPelletOn) {
          // assign a unique random color on first sight, then re-apply every tick
          if (!_pelletColors.has(id)) {
            _pelletColors.set(id, hueToRgb(Math.random() * Math.PI * 2));
          }
          applyRgb(cell, _pelletColors.get(id));
        } else {
          // solid color — always apply so it persists even if native color fights back
          applyRgb(cell, hexToRgb(t.pelletColor || '#ff69b4'));
        }
      }

      // remove ids for pellets that no longer exist in the cell map
      for (const id of _pelletColors.keys()) {
        if (!liveIds.has(id)) _pelletColors.delete(id);
      }
    }, 50);
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
      if (t.useDefault || (!t.rainbowBorderOn && !t.rainbowGlowOn)) {
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
      const active = !t.useDefault && (t.rainbowBorderOn || t.rainbowGlowOn);
      if (active) {
        if (!_timer) { _timer = setInterval(tick, 50); tick(); }
      } else {
        clearInterval(_timer); _timer = null;
      }
    }

    setInterval(ensureRunning, 500);
    ensureRunning();
  })();

  // ---- GAMEPLAY TWEAKS ----

  // overlay canvas for danger indicators
  (function() {
    function createOverlay() {
      if (document.getElementById('ryu-danger-overlay')) return true;
      const mc = document.getElementById('main-canvas');
      if (!mc) return false;
      const canvas = document.createElement('canvas');
      canvas.id = 'ryu-danger-overlay';
      canvas.style.cssText = 'position:fixed;pointer-events:none;z-index:9998;';
      document.body.appendChild(canvas);
      const rect = mc.getBoundingClientRect();
      canvas.style.left = rect.left + 'px';
      canvas.style.top  = rect.top  + 'px';
      canvas.width  = rect.width;
      canvas.height = rect.height;
      window.addEventListener('resize', () => {
        const r = mc.getBoundingClientRect();
        canvas.style.left = r.left + 'px';
        canvas.style.top  = r.top  + 'px';
        if (canvas.width  !== r.width)  canvas.width  = r.width;
        if (canvas.height !== r.height) canvas.height = r.height;
      });
      return true;
    }
    function waitAndCreate() {
      if (!createOverlay()) setTimeout(waitAndCreate, 500);
    }
    waitAndCreate();
  })();

 // danger indicator
  (function() {
    const EAT_THRESHOLD = 1.35;

    let _mc     = null;
    let _canvas = null;
    let _ctx    = null;
    let _rect   = null;

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
      if (!_canvas || !_ctx || !_mc) return;

      // sync canvas size without getBoundingClientRect every frame
      if (_canvas.width  !== _mc.width)  _canvas.width  = _mc.width;
      if (_canvas.height !== _mc.height) _canvas.height = _mc.height;

      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      const t = loadTheme();
      if (t.useDefault || !t.dangerIndicatorOn) return;

      const ne = globalThis.__ne;
      const Be = globalThis.__Be;
      const z  = globalThis.__z_;
      if (!ne || !Be || !z) return;

      const myPlayer = Be._1059;
      if (!myPlayer) return;

      let myMaxRadius = 0;
      for (const cell of ne._2430.values()) {
        if (cell._9491) continue;
        if (cell._2182 && cell._2182._1059 === myPlayer) {
          if (cell._1904 > myMaxRadius) myMaxRadius = cell._1904;
        }
      }

      const zoom   = z._4336;
      const camX   = z._3852._7847;
      const camY   = z._3852._9202;
      const cx     = _mc.width  / 2;
      const cy     = _mc.height / 2;
      const scaleX = _rect ? _rect.width  / _mc.width  : 1;
      const scaleY = _rect ? _rect.height / _mc.height : 1;

      // cache these so we're not hitting theme storage inside the cell loop
      const showBlue   = t.dangerShowBlue   !== false;
      const showGreen  = t.dangerShowGreen  !== false;
      const showRed    = t.dangerShowRed    !== false;
      const showYellow = t.dangerShowYellow !== false;

      _ctx.lineWidth = 5;

      for (const cell of ne._2430.values()) {
        if (cell._9491) continue;
        if (cell._2182 && cell._2182._1059 === myPlayer) continue;
        if (cell._7926 !== 1) continue;

        const theirR  = cell._1904;

        let color;
        if (myMaxRadius === 0) {
          if (!showYellow) continue;
          color = 'rgba(255,255,0,1.0)';
        } else if (canEat(myMaxRadius * 0.707, theirR)) {
          if (!showBlue) continue;
          color = 'rgba(80,140,255,1.0)';
        } else if (canEat(myMaxRadius, theirR)) {
          if (!showGreen) continue;
          color = 'rgba(0,255,80,1.0)';
        } else if (canEat(theirR, myMaxRadius)) {
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
        _ctx.arc(sx, sy, screenR, 0, Math.PI * 2);
        _ctx.strokeStyle = color;
        _ctx.stroke();
      }
    }

    function waitAndInit() {
      if (!globalThis.__ne || !globalThis.__z_ || !globalThis.__X_) {
        setTimeout(waitAndInit, 500); return;
      }
      if (!globalThis.__X_._1855 || !globalThis.__X_._1855.runners) {
        setTimeout(waitAndInit, 500); return;
      }
      if (!document.getElementById('ryu-danger-overlay')) {
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

    function buildCSS(t) {
      var parts = [];
      if (t.mmHideLB      !== false) parts.push('#leaderboard{display:none!important;}');
      if (t.mmHideChat    !== false) parts.push('#chatbox{display:none!important;}');
      if (t.mmHideMinimap !== false) parts.push('.huds-bottom-right{display:none!important;}#ryu-team-box{display:none!important;}#ryu-team-panel{display:none!important;}.mame-brb-team{display:none!important;}.huds-bottom-left{display:none!important;}');
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
      var t = loadTheme();
      var on = !!t.minimalModeOn;
      if (on) {
        var css = buildCSS(t);
        if (css !== _prevCSS) { ensureStyleLast(css); _prevCSS = css; }
        else ensureStyleLast(css);
        var hideEnemy = !!t.mmHideEnemyNames;
        var hideOwn   = !!t.mmHideOwnName;
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

    let _emotes = [];
    let _lottie = null;
    let _picker = null;
    let _activeEl = null;
    let _activeAnim = null;
    let _rafId = null;
    let _mc = null;

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

    function getCellScreen(cell) {
      const z = globalThis.__z_;
      if (!z || !_mc) return null;
      const rect = _mc.getBoundingClientRect();
      const zoom = z._4336;
      const camX = z._3852._7847;
      const camY = z._3852._9202;
      const cx = _mc.width / 2;
      const cy = _mc.height / 2;
      const scaleX = rect.width  / _mc.width;
      const scaleY = rect.height / _mc.height;
      return {
        x: rect.left + ((cell._7847 - camX) * zoom + cx) * scaleX,
        y: rect.top  + ((cell._9202 - camY) * zoom + cy) * scaleY,
        r: cell._1904 * zoom * scaleY
      };
    }

    function removeActive() {
      if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
      if (_activeAnim) { _activeAnim.destroy(); _activeAnim = null; }
      if (_activeEl) { _activeEl.remove(); _activeEl = null; }
    }

    function renderStaticEmoji(el, code) {
      el.textContent = String.fromCodePoint(parseInt(code, 16));
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontFamily = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      el.style.fontSize = '96px';
      el.style.lineHeight = '1';
      el.style.filter = 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))';
    }

    function spawnEmote(code, getCellFn) {
      const isGif = code.startsWith('http');

      function doSpawn() {
        const cell = getCellFn();
        if (!cell) return;

        const el = document.createElement('div');
        el.style.cssText = [
          'position:fixed;pointer-events:none;z-index:99998;',
          'width:160px;height:160px;',
          'transform:translate(-50%,-50%);',
          'transition:opacity 0.3s;opacity:1;'
        ].join('');
        document.body.appendChild(el);

        let anim = null;

        if (isGif) {
          const img = document.createElement('img');
          img.src = code;
          img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
          el.appendChild(img);
        } else {
          if (_lottie) {
            try {
              anim = _lottie.loadAnimation({
                container: el,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: LOTTIE_BASE + code + '.json'
              });
              anim.addEventListener('data_failed', function() {
                if (anim) { anim.destroy(); anim = null; }
                renderStaticEmoji(el, code);
              });
              _activeAnim = anim;
            } catch (_) {
              renderStaticEmoji(el, code);
            }
          } else {
            renderStaticEmoji(el, code);
          }
        }

        const start = performance.now();
        let rafId = null;

        function track() {
          const c = getCellFn();
          if (!c) { cleanup(); return; }
          const pos = getCellScreen(c);
          if (!pos) { cleanup(); return; }

          // clamp size: min 60px, max 200px, based on cell screen diameter
          const size = Math.max(60, Math.min(200, pos.r * 1.8));
          el.style.width  = size + 'px';
          el.style.height = size + 'px';
          el.style.left = pos.x + 'px';
          el.style.top  = (pos.y - pos.r - (size * 0.46)) + 'px';

          const elapsed = performance.now() - start;
          if (elapsed >= DURATION_MS - 300) el.style.opacity = '0';
          if (elapsed >= DURATION_MS) { cleanup(); return; }
          rafId = requestAnimationFrame(track);
        }

        function cleanup() {
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          if (anim) {
            anim.destroy();
            if (_activeAnim === anim) _activeAnim = null;
            anim = null;
          }
          el.remove();
        }

        track();
      }

      if (isGif) {
        doSpawn();
      } else {
        loadLottie(function() { doSpawn(); });
      }
    }

    function triggerEmote(code) {
      removeActive();
      // broadcast to relay so others see it
      if (globalThis.__ryuBroadcastEmote) globalThis.__ryuBroadcastEmote(code);
      spawnEmote(code, getBigCell);
    }

    // called by relay when another player triggers an emote
    globalThis.__ryuSpawnRemoteEmote = function(username, code) {
      const ne = globalThis.__ne;
      if (!ne) return;
      function getRemoteCell() {
        for (const cell of ne._2430.values()) {
          if (cell._9491) continue;
          if (cell._2182 && cell._2182._1059 && cell._2182._1059._6988 === username) {
            // find biggest cell for this player
            let big = null;
            for (const c2 of ne._2430.values()) {
              if (c2._9491) continue;
              if (c2._2182 && c2._2182._1059 === cell._2182._1059) {
                if (!big || c2._1904 > big._1904) big = c2;
              }
            }
            return big;
          }
        }
        return null;
      }
      spawnEmote(code, getRemoteCell);
    };

    function buildPicker() {
      if (_picker) return;
      _picker = document.createElement('div');
      _picker.id = 'ryu-emote-picker';
      _picker.style.cssText = [
        'position:fixed;z-index:99999;display:none;',
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
          const img = document.createElement('img');
          img.src = em.url;
          img.style.cssText = 'width:28px;height:28px;object-fit:contain;vertical-align:middle;border-radius:4px;';
          btn.appendChild(img);
        } else {
          btn.textContent = em.label;
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
      document.addEventListener('mousedown', function(e) {
        if (_picker && _picker.style.display !== 'none' && !_picker.contains(e.target)) {
          hidePicker();
        }
      }, true);
    }

    function showPicker(x, y) {
      loadEmotes(function() {
        if (!_picker) buildPicker();
        _picker.style.display = 'flex';
        const pw = 222, ph = 110;
        const vw = window.innerWidth, vh = window.innerHeight;
        _picker.style.left = Math.min(x, vw - pw - 8) + 'px';
        _picker.style.top  = Math.min(y, vh - ph - 8) + 'px';
      });
    }

    function hidePicker() {
      if (_picker) _picker.style.display = 'none';
    }

    function initContextMenu() {
      const mc = document.getElementById('main-canvas');
      if (!mc) { setTimeout(initContextMenu, 500); return; }
      _mc = mc;

      function tryShow(x, y, skipChatCheck) {
        if (!skipChatCheck) {
          const cb = document.getElementById('chat-box');
          if (cb && cb.contains(document.elementFromPoint(x, y))) return;
        }
        const t = loadTheme();
        if (t.useDefault || t.emotesOn === false) return;
        showPicker(x + 8, y + 8);
      }

      function getEmoteHotkey() {
        const t = loadTheme();
        const hk = t.hotkeyEmote;
        // undefined = first launch default RIGHTCLICK, empty string = user cleared it (disabled)
        return hk === undefined ? 'RIGHTCLICK' : hk;
      }

      // contextmenu fires for right-click — use when hotkey is RIGHTCLICK
      mc.addEventListener('contextmenu', function(e) {
        const hk = getEmoteHotkey();
        if (!hk || hk !== 'RIGHTCLICK') return;
        e.preventDefault();
        e.stopPropagation();
        tryShow(e.clientX, e.clientY);
      });

      // mouse buttons (middle, extra buttons)
      mc.addEventListener('mousedown', function(e) {
        if (e.button === 2) return; // handled by contextmenu above
        const hk = getEmoteHotkey();
        if (!hk) return;
        const btnLabel = e.button === 1 ? 'MIDDLECLICK' : 'MOUSE' + e.button;
        if (hk !== btnLabel) return;
        tryShow(e.clientX, e.clientY);
      });

      // keyboard hotkey
      document.addEventListener('keydown', function(e) {
        const hk = getEmoteHotkey();
        if (!hk || hk === 'RIGHTCLICK' || hk === 'MIDDLECLICK' || hk.startsWith('MOUSE')) return;
        if (e.key.toUpperCase() !== hk) return;
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT'|| tag === 'TEXTAREA' ) return;
        
        // only fire in-game, not when any ryu overlay is open
        var mm = document.getElementById('main-menu');
        if (!mm || mm.style.display !== 'none') return;
        if (document.getElementById('ryu-settings-panel')) return;
        if (document.getElementById('ryu-rename-modal')) return;
        if (document.getElementById('ryu-shop-injected')) return;
        if (document.getElementById('ryu-inv-injected')) return;
        if (document.getElementById('ryu-gal-injected')) return;
        if (document.getElementById('ryu-clip-editor')) return;
        e.stopPropagation();
        // toggle: close if already open, else show
        if (_picker && _picker.style.display !== 'none') {
          hidePicker();
        } else {
          tryShow(window.innerWidth / 2, window.innerHeight / 2, true);
        }
      }, true);
    }

    function waitAndInit() {
      if (!document.getElementById('main-canvas')) { setTimeout(waitAndInit, 500); return; }
      initContextMenu();
    }
    waitAndInit();
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
      // Only fire when in-game (chat input exists but is hidden)
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      if (document.getElementById('ryu-settings-panel')) return;
      if (document.getElementById('ryu-rename-modal')) return;
      if (document.getElementById('ryu-shop-injected')) return;
      if (document.getElementById('ryu-inv-injected')) return;
      if (document.getElementById('ryu-gal-injected')) return;
      if (document.getElementById('ryu-clip-editor')) return;
      // Click the active region button to disconnect (same as dc script)
      var currentServer = document.querySelector('.mame-ssb-region-option-active');
      if (currentServer) currentServer.click();
    } catch(err) {}
  }, false);

  // danger overlay hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyDangerOverlay) return;
      if (e.key.toUpperCase() !== _ft_hotkeyDangerOverlay.toUpperCase()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      if (document.getElementById('ryu-settings-panel')) return;
      if (document.getElementById('ryu-rename-modal')) return;
      if (document.getElementById('ryu-shop-injected')) return;
      if (document.getElementById('ryu-inv-injected')) return;
      if (document.getElementById('ryu-gal-injected')) return;
      if (document.getElementById('ryu-clip-editor')) return;
      var t = loadTheme();
      t.dangerIndicatorOn = !t.dangerIndicatorOn;
      saveTheme(t);
      _themeCache = null;
    } catch(err) {}
  }, false);

  // minimal mode hotkey
  document.addEventListener('keydown', function(e) {
    try {
      if (!_ft_hotkeyMinimalMode) return;
      if (e.key.toUpperCase() !== _ft_hotkeyMinimalMode.toUpperCase()) return;
      var chat = document.querySelector('#chat-input');
      var chatHidden = chat && window.getComputedStyle(chat).display === 'none';
      if (!chatHidden) return;
      var mm = document.getElementById('main-menu');
      if (!mm || mm.style.display !== 'none') return;
      if (document.getElementById('ryu-settings-panel')) return;
      if (document.getElementById('ryu-rename-modal')) return;
      if (document.getElementById('ryu-shop-injected')) return;
      if (document.getElementById('ryu-inv-injected')) return;
      if (document.getElementById('ryu-gal-injected')) return;
      if (document.getElementById('ryu-clip-editor')) return;
      var t = loadTheme();
      t.minimalModeOn = !t.minimalModeOn;
      saveTheme(t);
      _themeCache = null;
    } catch(err) {}
  }, false);

  // split counter HUD
  (function() {
    var _splitEl = null;

    function getSplitEl() {
      if (_splitEl && document.body.contains(_splitEl)) return _splitEl;
      _splitEl = document.createElement('div');
      _splitEl.id = 'ryu-split-counter';
      _splitEl.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:9999;font-family:"Noto Sans",sans-serif;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 16px;letter-spacing:2px;pointer-events:none;display:none;';
      document.body.appendChild(_splitEl);
      return _splitEl;
    }

    setInterval(function() {
      try {
        var t = loadTheme();
        var el = getSplitEl();
        if (!t.splitCounterOn) { el.style.display = 'none'; return; }
        var mm = document.getElementById('main-menu');
        if (!mm || mm.style.display !== 'none') { el.style.display = 'none'; return; }
        var players = globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._4221;
        if (!players) { el.style.display = 'none'; return; }
        var me = null;
        players.forEach(function(p) { if (p._2430 && p._2430.size > 0) me = p; });
        if (!me) { el.style.display = 'none'; return; }
        var cur = me._2430.size;
        var max = window._ryuSplitMax || '?';
        el.style.display = 'block';
        el.textContent = cur + ' / ' + max;
      } catch(e) {}
    }, 100);
  })();

  // world sector overlay — uses game background image slot
  (function() {
    var _sectorOn = false;
    var _savedUrl = null;
    var _savedBgOn = null;
    var _gridUrl = null;

    function buildGridUrl() {
      const theme = loadTheme();
      const labelColor = theme.sectorLabelColor || '#ffffff';
      const gridColor  = theme.sectorGridColor  || '#b4b4b4';
      const fontIdx    = theme.sectorFont || 0;
      const fontName   = fontIdx > 0 ? FONTS[fontIdx].value : 'Noto Sans';

      const size = 2048;
      const cv = document.createElement('canvas');
      cv.width = size; cv.height = size;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 6;
      const cell = size / 5;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
      }

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 160px "' + fontName + '", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lx = 'ABCDE', ly = '12345';
      for (let c = 0; c < 5; c++)
        for (let r = 0; r < 5; r++)
          ctx.fillText(lx[c] + ly[r], (c + 0.5) * cell, (r + 0.5) * cell);
      return cv.toDataURL('image/png');
    }

    var _intercepted = false;
    var _pendingUrl = null;
    var _currentUrl = null;
    var _applyTimer = null;

    function interceptBgUrl(Q) {
      if (_intercepted) return;
      if (!Q || !Q.BACKGROUND_IMAGE_URL) return;
      _intercepted = true;
      _currentUrl = Q.BACKGROUND_IMAGE_URL._5738 || '';

      Object.defineProperty(Q.BACKGROUND_IMAGE_URL, '_5738', {
        get: function() { return _currentUrl; },
        set: function(v) {
          // buffer rapid changes, only commit after 250ms of no changes
          _pendingUrl = v;
          if (_applyTimer) clearTimeout(_applyTimer);
          _applyTimer = setTimeout(function() {
            _applyTimer = null;
            if (_pendingUrl !== _currentUrl) {
              _currentUrl = _pendingUrl;
              // force game to re-read by triggering change event
              try {
                Q.BACKGROUND_IMAGE_URL._8452.get('change')?.forEach(fn => fn(_currentUrl));
              } catch(e) {}
            }
          }, 250);
        },
        configurable: true
      });
    }

    function applyUrlSmooth(url) {
      const Q = globalThis.__Q;
      if (!Q || !Q.BACKGROUND_IMAGE_URL) return;
      if (!_intercepted) interceptBgUrl(Q);
      const img = new Image();
      img.onload = function() {
        if (Q && Q.BACKGROUND_IMAGE_URL) Q.BACKGROUND_IMAGE_URL._5738 = url;
      };
      img.src = url;
    }

    function applyGrid() {
      const Q = globalThis.__Q;
      if (!Q || !Q.BACKGROUND_IMAGE_URL || !Q.WORLD_BACKGROUND_IMAGE) return false;
      if (!_intercepted) interceptBgUrl(Q);
      if (!_gridUrl) _gridUrl = buildGridUrl();
      const curUrl = Q.BACKGROUND_IMAGE_URL._5738 || '';
      if (!curUrl.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACAAA')) {
        _savedUrl  = curUrl;
        _savedBgOn = Q.WORLD_BACKGROUND_IMAGE._5738;
        try { localStorage.setItem('ryuSectorSavedBg', JSON.stringify({ url: _savedUrl, on: _savedBgOn })); } catch(e) {}
      } else {
        try {
          const s = JSON.parse(localStorage.getItem('ryuSectorSavedBg') || 'null');
          if (s) { _savedUrl = s.url; _savedBgOn = s.on; }
        } catch(e) {}
      }
      Q.WORLD_BACKGROUND_IMAGE._5738 = true;
      applyUrlSmooth(_gridUrl);
      return true;
    }

    function removeGrid() {
      const Q = globalThis.__Q;
      if (!Q || !Q.BACKGROUND_IMAGE_URL || !Q.WORLD_BACKGROUND_IMAGE) return;
      // load from storage if not in memory
      if (_savedUrl === null) {
        try {
          const s = JSON.parse(localStorage.getItem('ryuSectorSavedBg') || 'null');
          if (s) { _savedUrl = s.url; _savedBgOn = s.on; }
        } catch(e) {}
      }
      Q.BACKGROUND_IMAGE_URL._5738   = _savedUrl || '';
      Q.WORLD_BACKGROUND_IMAGE._5738 = _savedBgOn !== null ? _savedBgOn : false;
      try { localStorage.removeItem('ryuSectorSavedBg'); } catch(e) {}
      _savedUrl = null;
      _savedBgOn = null;
    }

    // remove old overlay canvas if present
    const old = document.getElementById('ryu-sector-overlay');
    if (old) old.remove();

    var _lastGridSettings = '';
    var _rebuildTimer = null;

    function scheduleRebuild() {
      if (_rebuildTimer) clearTimeout(_rebuildTimer);
      _rebuildTimer = setTimeout(function() {
        _rebuildTimer = null;
        _gridUrl = buildGridUrl();
        applyUrlSmooth(_gridUrl);
        _lastGridSettings = (function() {
          const t = loadTheme();
          return (t.sectorLabelColor||'') + (t.sectorGridColor||'') + (t.sectorFont||0);
        })();
      }, 300);
    }

    setInterval(function() {
      try {
        const t = loadTheme();
        const on = !!t.sectorOverlayOn;

        if (on && !_sectorOn) {
          if (applyGrid()) {
            _sectorOn = true;
            _lastGridSettings = (t.sectorLabelColor||'') + (t.sectorGridColor||'') + (t.sectorFont||0);
          }
        } else if (!on && _sectorOn) {
          removeGrid();
          _sectorOn = false;
        } else if (on && _sectorOn) {
          const Q = globalThis.__Q;
          const sig = (t.sectorLabelColor||'') + (t.sectorGridColor||'') + (t.sectorFont||0);
          var rebuilt = false;

          // rebuild grid if settings changed
          if (sig !== _lastGridSettings) {
            _lastGridSettings = sig;
            _gridUrl = buildGridUrl();
            rebuilt = true;
            applyUrlSmooth(_gridUrl);
          }

          // watch for native URL changes (only if we didn't just rebuild)
          if (!rebuilt && Q && Q.BACKGROUND_IMAGE_URL && _gridUrl) {
            const cur = Q.BACKGROUND_IMAGE_URL._5738 || '';
            if (cur !== _gridUrl) {
              _savedUrl = cur;
              try { localStorage.setItem('ryuSectorSavedBg', JSON.stringify({ url: _savedUrl, on: _savedBgOn })); } catch(e) {}
              applyUrlSmooth(_gridUrl);
            }
          }
        }
      } catch(e) {}
    }, 500);
  })();

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
