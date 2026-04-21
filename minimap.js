// minimap UI

(function () {
  'use strict';

  const STORAGE_KEY = 'ryuTheme';
  const MM_SIZE = 180;
  const AGAR_MM_SIZE = 150;
  const COLS = 5;
  const LABELS = ['ABCDE', '12345'];
  const cellW = MM_SIZE / COLS;
  const cellH = MM_SIZE / COLS;

  let _hooked = false;
  let _smx = null;
  let _smy = null;
  const SMOOTH = 0.18;

  // storage
  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function getMinimapStyle(theme) {
    const style = parseInt(theme && theme.minimapStyle, 10);
    return Number.isFinite(style) ? style : 1;
  }

  function isAgarMinimap(theme) {
    return getMinimapStyle(theme) === 2;
  }

  function getMinimapSize(theme) {
    if (theme && theme.minimapDragSize) return theme.minimapDragSize;
    return isAgarMinimap(theme) ? AGAR_MM_SIZE : (theme.minimapSize || 280);
  }

  // resize the minimap canvas element
  function applyMinimapSize(size) {
    const mm = document.getElementById('minimap');
    const hud = document.querySelector('.huds-bottom-right');
    if (!mm) return;
    mm.style.width  = size + 'px';
    mm.style.height = size + 'px';
    mm.style.imageRendering = 'pixelated';
    if (hud) hud.style.width = size + 'px';
    if (typeof _buildStaticLayer === 'function') _buildStaticLayer();
  }

  // hook clearRect to inject our overlay after each native minimap draw
  let _buildStaticLayer = null;

  function hookMinimap() {
    const mm = document.getElementById('minimap');
    if (!mm || _hooked) return;
    const ctx = mm.getContext('2d');
    if (!ctx) return;
    _hooked = true;

    function getSharpScale() {
      const cssW = parseFloat(mm.style.width) || MM_SIZE;
      return cssW / MM_SIZE;
    }

    // cache grid + labels to offscreen canvas so we're not redrawing every frame
    let _staticLayer = null;
    _buildStaticLayer = function () {
      const sc = getSharpScale();
      const oc = document.createElement('canvas');
      oc.width  = MM_SIZE;
      oc.height = MM_SIZE;
      const octx = oc.getContext('2d');

      const _st = loadTheme();
      const minimapStyle = getMinimapStyle(_st);
      const isClassic = minimapStyle === 0;
      const isAgar = minimapStyle === 2;

      if (isAgar) {
        octx.strokeStyle = 'rgba(0,0,0,0.16)';
        octx.lineWidth = 0.45;
        octx.beginPath();
        for (var g = 24; g < MM_SIZE; g += 24) {
          octx.moveTo(g + 0.5, 0); octx.lineTo(g + 0.5, MM_SIZE);
          octx.moveTo(0, g + 0.5); octx.lineTo(MM_SIZE, g + 0.5);
        }
        octx.stroke();
      }

      octx.strokeStyle = isAgar ? 'rgba(0,0,0,0.24)' : (isClassic ? 'rgba(255,255,255,0.2)' : 'rgba(34,211,238,0.12)');
      octx.lineWidth = isAgar ? 0.55 : 0.5;
      octx.beginPath();
      for (var i = 1; i < COLS; i++) {
        const x = Math.round(i * cellW) + 0.5;
        const y = Math.round(i * cellH) + 0.5;
        octx.moveTo(x, 0); octx.lineTo(x, MM_SIZE);
        octx.moveTo(0, y); octx.lineTo(MM_SIZE, y);
      }
      octx.stroke();

      octx.save();
      octx.scale(1 / sc, 1 / sc);
      octx.font = isAgar
        ? "700 " + Math.round(10 * sc) + "px 'Titillium Web', sans-serif"
        : isClassic
        ? "bold " + Math.round(11 * sc) + "px 'Titillium Web', sans-serif"
        : "bold " + Math.round(9 * sc) + "px 'Orbitron', sans-serif";
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.lineWidth = isAgar ? Math.max(1, 1.2 * sc) : Math.max(1.5, 2 * sc);
      octx.strokeStyle = isAgar ? 'rgba(255,255,255,0.78)' : (isClassic ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.7)');
      for (var r = 0; r < COLS; r++) {
        for (var c = 0; c < COLS; c++) {
          octx.strokeText(LABELS[0][c] + LABELS[1][r], (c + 0.5) * cellW * sc, (r + 0.5) * cellH * sc);
        }
      }
      octx.fillStyle = isAgar ? 'rgba(80,94,104,0.5)' : (isClassic ? 'rgba(255,255,255,0.5)' : 'rgba(34,211,238,0.55)');
      for (var r = 0; r < COLS; r++) {
        for (var c = 0; c < COLS; c++) {
          octx.fillText(LABELS[0][c] + LABELS[1][r], (c + 0.5) * cellW * sc, (r + 0.5) * cellH * sc);
        }
      }
      octx.restore();
      _staticLayer = oc;
    };
    _buildStaticLayer();

    let _pendingOverlay = false;
    const origClearRect = ctx.clearRect.bind(ctx);
    ctx.clearRect = function (x, y, w, h) {
      origClearRect(x, y, w, h);
      if (x !== 0 || y !== 0) return;
      const _clearTheme = loadTheme();
      if (!_clearTheme.useDefault && _clearTheme.minimapThemeOn !== false && isAgarMinimap(_clearTheme)) {
        ctx.save();
        ctx.fillStyle = '#f3fafc';
        ctx.fillRect(0, 0, MM_SIZE, MM_SIZE);
        ctx.restore();
      }
      if (_pendingOverlay) return;
      _pendingOverlay = true;

      Promise.resolve().then(function () {
        _pendingOverlay = false;

        const _mt = loadTheme();
        if (_mt.useDefault || _mt.minimapThemeOn === false) return;

        const MAP_SIZE = globalThis.__ne ? globalThis.__ne._5142 : 22000;
        const OFFSET   = (65535 - MAP_SIZE) / 2;
        const scale    = MM_SIZE / MAP_SIZE;

        let playerRawMx = null, playerRawMy = null;
        let playerMx = null, playerMy = null;

        try {
          const players = globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._4221;
          if (players) {
            const player = [...players.values()].find(p => p._2430 && p._2430.size > 0);
            if (player) {
              const cell = [...player._2430.values()][0];
              playerRawMx = (cell._7847 - OFFSET) * scale;
              playerRawMy = (cell._9202 - OFFSET) * scale;
              if (_smx === null) { _smx = playerRawMx; _smy = playerRawMy; }
              else {
                _smx += (playerRawMx - _smx) * SMOOTH;
                _smy += (playerRawMy - _smy) * SMOOTH;
              }
              playerMx = _smx;
              playerMy = _smy;
            } else {
              _smx = null; _smy = null;
            }
          }
        } catch (e) {}

        const minimapStyle = getMinimapStyle(_mt);
        const isClassic = minimapStyle === 0;
        const isAgar = minimapStyle === 2;

        if (playerRawMx !== null) {
          const sx = Math.floor(playerRawMx / cellW) * cellW;
          const sy = Math.floor(playerRawMy / cellH) * cellH;
          if (isAgar) {
            ctx.fillStyle = 'rgba(255,214,0,0.23)';
            ctx.fillRect(sx, sy, cellW, cellH);
            ctx.strokeStyle = 'rgba(220,172,0,0.55)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, cellW - 1, cellH - 1);
          } else if (isClassic) {
            ctx.fillStyle = 'rgba(255,220,0,0.22)';
            ctx.fillRect(sx, sy, cellW, cellH);
          } else {
            ctx.fillStyle = 'rgba(34,211,238,0.07)';
            ctx.fillRect(sx, sy, cellW, cellH);
            ctx.strokeStyle = 'rgba(34,211,238,0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, cellW - 1, cellH - 1);
          }
        }

        if (_staticLayer) ctx.drawImage(_staticLayer, 0, 0);

        if (playerMx !== null) {
          const mx = playerMx;
          const my = playerMy;

          const name = (globalThis.__Be && globalThis.__Be._6988) || '';
          if (name) {
            const sc = getSharpScale();
            ctx.save();
            ctx.scale(1 / sc, 1 / sc);
            const smx = mx * sc;
            const smy = my * sc;
            ctx.font = isClassic
              ? "600 " + Math.round(12 * sc) + "px 'Titillium Web', sans-serif"
              : isAgar
              ? "700 " + Math.round(11 * sc) + "px 'Titillium Web', sans-serif"
              : "700 " + Math.round(10 * sc) + "px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.lineWidth = Math.max(2, 2.5 * sc);
            ctx.strokeStyle = isAgar ? 'rgba(255,255,255,0.95)' : (isClassic ? '#000000' : 'rgba(0,0,0,0.85)');
            ctx.strokeText(name, smx, smy - 5 * sc);
            ctx.fillStyle = isAgar ? '#303a40' : (isClassic ? '#ffffff' : '#22d3ee');
            ctx.fillText(name, smx, smy - 5 * sc);
            ctx.restore();
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(mx, my, 3, 0, Math.PI * 2);
          if (isAgar) {
            ctx.fillStyle = '#ffd600';
            ctx.strokeStyle = 'rgba(56,66,72,0.8)';
            ctx.lineWidth = 1.25;
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
          ctx.restore();
        }
      });
    };
  }

  // minimap border
  function injectMinimapStyle() {
    let el = document.getElementById('ryu-minimap-border-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'ryu-minimap-border-style';
      (document.head || document.documentElement).appendChild(el);
    }
    const _st = loadTheme();
    const minimapStyle = getMinimapStyle(_st);
    const isClassic = minimapStyle === 0;
    const isAgar = minimapStyle === 2;
    const mm = document.getElementById('minimap');
    const liveSize = mm ? parseFloat(mm.style.width) : 0;
    const sz = liveSize || getMinimapSize(_st);
    el.textContent = isAgar ? `
      #minimap {
        width: ${sz}px !important;
        height: ${sz}px !important;
        background: #f3fafc !important;
        border: 2px solid rgba(62,74,84,0.68) !important;
        border-radius: 4px !important;
        box-shadow: 0 3px 12px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.7) !important;
        box-sizing: border-box !important;
        image-rendering: auto !important;
      }
      .huds-bottom-right {
        width: ${sz}px !important;
      }
    ` : isClassic ? `
      #minimap {
        border-radius: 4px !important;
        box-sizing: border-box !important;
      }
    ` : `
      #minimap {
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 6px !important;
        box-sizing: border-box !important;
      }
    `;
  }
  globalThis.__ryuInjectMinimapStyle = injectMinimapStyle;

  // HUD indicators
  function injectHUDStyle() {
    let el = document.getElementById('ryu-hud-indicator-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'ryu-hud-indicator-style';
      (document.head || document.documentElement).appendChild(el);
    }
    const _st = loadTheme();
    const _isAgar = isAgarMinimap(_st);
    if (_isAgar) {
      el.textContent = `
        #anti-bot-status {
          font-family: 'Noto Sans', sans-serif !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.8px !important;
          color: rgba(35,180,90,0.92) !important;
          text-shadow: none !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 2px !important;
          margin-bottom: 1px !important;
        }
        #fps {
          font-family: 'Noto Sans', sans-serif !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.6px !important;
          color: rgba(30,30,30,0.82) !important;
          text-shadow: none !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 2px !important;
          margin-bottom: 1px !important;
          display: block !important;
        }
        #timer, #timer2, #timer3 {
          display: none !important;
        }
      `;
    } else {
      el.textContent = `
        #anti-bot-status {
          font-family: 'Noto Sans', sans-serif !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.8px !important;
          color: rgba(68,255,136,0.88) !important;
          text-shadow: 0 0 6px rgba(68,255,136,0.18) !important;
          background: transparent !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 0 2px !important;
          margin-bottom: 1px !important;
        }
        #fps {
          font-family: 'Noto Sans', sans-serif !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.6px !important;
          color: rgba(255,255,255,0.72) !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.85) !important;
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 2px !important;
          margin-bottom: 1px !important;
          display: block !important;
        }
        #timer, #timer2, #timer3 {
          display: none !important;
        }
      `;
    }
  }
  globalThis.__ryuInjectHUDStyle = injectHUDStyle;

  // strip all minimap styles and restore native state
  function _stripMinimapFull() {
    var mm = document.getElementById('minimap');
    var hud = document.querySelector('.huds-bottom-right');
    // unwrap the resize wrapper if present
    var wrap = document.getElementById('ryu-mm-wrap');
    if (wrap && mm && mm.parentNode === wrap) {
      wrap.parentNode.insertBefore(mm, wrap);
      wrap.remove();
    }
    var rh = document.getElementById('ryu-mm-resize-handle');
    if (rh) rh.remove();
    if (mm) { mm.style.width = ''; mm.style.height = ''; mm.style.imageRendering = ''; mm.style.transform = ''; mm.style.transformOrigin = ''; }
    if (hud) { hud.style.width = ''; hud.style.transform = ''; hud.style.transformOrigin = ''; }
    var wrap = document.getElementById('ryu-hud-indicator-wrap');
    if (wrap && hud) {
      ['anti-bot-status', 'fps', 'timer'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.style.transform = ''; el.style.transformOrigin = ''; hud.insertBefore(el, wrap); }
      });
      wrap.remove();
    }
    ['ryu-minimap-border-style', 'ryu-hud-indicator-style'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.remove();
    });
  }

  globalThis.__ryuStripMinimap = function () { _stripMinimapFull(); };

  // drag resize handle — top-left corner of the minimap canvas (Win11 style)
  function addMinimapResizeHandle() {
    var mm = document.getElementById('minimap');
    if (!mm || document.getElementById('ryu-mm-resize-handle')) return;

    // wrap the canvas so we can absolutely-position the handle relative to it
    var wrap = document.getElementById('ryu-mm-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ryu-mm-wrap';
      wrap.style.cssText = 'position:relative;display:block;line-height:0;';
      mm.parentNode.insertBefore(wrap, mm);
      wrap.appendChild(mm);
    }

    var handle = document.createElement('div');
    handle.id = 'ryu-mm-resize-handle';
    handle.title = 'Drag to resize minimap';
    handle.style.cssText =
      'position:absolute;top:0;left:0;width:20px;height:20px;cursor:nw-resize;' +
      'z-index:10001;display:flex;align-items:flex-start;justify-content:flex-start;' +
      'padding:3px;opacity:0.3;transition:opacity 0.15s;user-select:none;touch-action:none;pointer-events:all;';
    handle.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
      '<line x1="1" y1="11" x2="11" y2="1" stroke="rgba(80,80,80,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '<line x1="1" y1="6" x2="6" y2="1" stroke="rgba(80,80,80,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>';
    wrap.appendChild(handle);

    handle.addEventListener('mouseenter', function() { handle.style.opacity = '1'; });
    handle.addEventListener('mouseleave', function() { if (!handle._ryuDragging) handle.style.opacity = '0.3'; });

    function beginResize(e) {
      e.preventDefault();
      e.stopPropagation();
      handle._ryuDragging = true;
      handle.style.opacity = '1';
      if (handle.setPointerCapture && e.pointerId !== undefined) {
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      }

      var startX = e.clientX;
      var startY = e.clientY;
      var t0 = loadTheme();
      var startSize = getMinimapSize(t0);

      function onMove(ev) {
        if (ev.pointerId !== undefined && e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
        // top-left of bottom-right element: move left/up = bigger
        var dx = startX - ev.clientX;
        var dy = startY - ev.clientY;
        var delta = Math.round((dx + dy) / 2);
        var newSize = Math.max(100, Math.min(480, startSize + delta));
        applyMinimapSize(newSize);
        injectMinimapStyle();
      }

      function onUp(ev) {
        if (ev && ev.pointerId !== undefined && e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
        handle._ryuDragging = false;
        handle.style.opacity = '0.3';
        if (handle.releasePointerCapture && e.pointerId !== undefined) {
          try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        // persist
        var finalSize = parseFloat(mm.style.width) || getMinimapSize(loadTheme());
        try {
          var saved = loadTheme();
          saved.minimapDragSize = Math.round(finalSize);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (_) {}
      }

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    }

    handle.addEventListener('pointerdown', beginResize);
  }

  // scale the whole hud container so minimap + indicators move together
  function applyMMScale(val) {
    const hud = document.querySelector('.huds-bottom-right');
    if (!hud) return;
    const t = loadTheme();
    const s = isAgarMinimap(t) ? 1 : (0.2 + (val / 100) * 0.6);
    hud.style.transformOrigin = 'bottom right';
    hud.style.transform = 'scale(' + s.toFixed(3) + ')';
    // container handles scale — clear any individual transform on the canvas
    const mm = document.getElementById('minimap');
    if (mm) { mm.style.transform = ''; mm.style.transformOrigin = ''; }
    // group indicators into a wrapper so we can counter-scale them slightly
    var wrap = document.getElementById('ryu-hud-indicator-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ryu-hud-indicator-wrap';
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;';
      ['anti-bot-status', 'fps'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.parentNode === hud) { wrap.appendChild(el); }
      });
      // insert above minimap in the flex column
      var mmEl = document.getElementById('minimap');
      if (mmEl && mmEl.parentNode === hud) hud.insertBefore(wrap, mmEl);
      else hud.insertBefore(wrap, hud.firstChild);
    }
    // boost indicators ~30% relative to minimap
    const indicatorScale = isAgarMinimap(t) ? '1' : (1.3 / s).toFixed(3);
    wrap.style.transform = 'scale(' + indicatorScale + ')';
    wrap.style.transformOrigin = 'right bottom';
  }

  // apply everything
  function _applyFullMinimap(t) {
    hookMinimap();
    applyMinimapSize(getMinimapSize(t));
    injectMinimapStyle();
    injectHUDStyle();
    applyMMScale(t.mmScale || 50);
    setTimeout(addMinimapResizeHandle, 200);
  }

  // wait for minimap + game state before applying
  function waitAndInit() {
    const mm = document.getElementById('minimap');
    if (!mm || !globalThis.__ne) { setTimeout(waitAndInit, 500); return; }
    const t = loadTheme();
    if (!t.useDefault && t.minimapThemeOn !== false) _applyFullMinimap(t);
  }
  waitAndInit();

  // poll for size/toggle/scale changes
  let _lastSize = null;
  let _lastDefaultState = null;
  let _lastMmOn = null;
  let _lastMMScale = null;
  let _lastMmStyle = null;

  setInterval(function () {
    const t = loadTheme();
    const isDefault = !!t.useDefault;
    const mmOn = t.minimapThemeOn !== false;

    if (_lastDefaultState !== null && _lastDefaultState === true && !isDefault) {
      if (mmOn) _applyFullMinimap(t);
      else _stripMinimapFull();
    }
    _lastDefaultState = isDefault;

    if (_lastMmOn !== mmOn) {
      if (mmOn && !isDefault) _applyFullMinimap(t);
      else if (!mmOn) _stripMinimapFull();
    }
    _lastMmOn = mmOn;

    if (isDefault || !mmOn) return;

    const cur = getMinimapSize(t);
    if (_lastSize === null) { _lastSize = cur; return; }
    if (cur !== _lastSize) { _lastSize = cur; applyMinimapSize(cur); }

    const sc = t.mmScale || 50;
    if (sc !== _lastMMScale) { _lastMMScale = sc; applyMMScale(sc); }

    const mmStyle = getMinimapStyle(t);
    if (_lastMmStyle !== null && mmStyle !== _lastMmStyle) {
      applyMinimapSize(getMinimapSize(t));
      if (typeof _buildStaticLayer === 'function') _buildStaticLayer();
      injectMinimapStyle();
      injectHUDStyle();
      applyMMScale(sc);
    }
    _lastMmStyle = mmStyle;
  }, 500);

  console.log('[RyuTheme] MINIMAP LOADED.');
})();
