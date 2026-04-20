/* interface.js — auto-deferred for Tampermonkey */
(function(){
  function __ryuRun(){
(function () {
  'use strict';


  const STORAGE_KEY  = 'ryuTheme';
  const TRB_STYLE_ID = 'ryu-trb-style';
  const TRB_PANEL_ID = 'ryu-trb-panel';

  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function isMainMenuVisible() {
    const mm = document.getElementById('main-menu');
    if (!mm) return false;
    const s = mm.style;
    if (s.display === 'none') return false;
    if (s.opacity === '0') return false;
    return true;
  }

  function waitForTRB(cb) {
    const el = document.querySelector('.mame-top-right-bar');
    if (el) { cb(el); return; }
    setTimeout(() => waitForTRB(cb), 300);
  }

  // Styles
  function injectTRBStyle() {
    if (document.getElementById(TRB_STYLE_ID)) return;
    // inject Noto Sans font if not already present
    if (!document.getElementById('ryu-inter-font')) {
      var link = document.createElement('link');
      link.id = 'ryu-inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800;900&display=swap';
      (document.head || document.documentElement).appendChild(link);
    }
    const style = document.createElement('style');
    style.id = TRB_STYLE_ID;
    style.textContent = `

      /* ── Hide native TRB ── */
      .mame-top-right-bar {
        display: none !important;
      }

      /* ── Hide native settings window entirely — kept off-screen so elements retain layout for event firing ── */
      .sm-partition {
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .layer__title {
        display: none !important;
      }
      .layer__bottom-btns {
        display: none !important;
      }

      /* ── Panel shell ── */
      #ryu-trb-panel {
        display: none !important;
      }

      #ryu-trb-panel.ryu-trb-visible {
        opacity: 1;
        pointer-events: all;
      }

      /* top red bar */
      #ryu-trb-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #22d3ee, rgba(232, 25, 44, 0.2));
        z-index: 10;
      }

      /* scanlines */
      #ryu-trb-panel::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          0deg, transparent, transparent 2px,
          rgba(0, 0, 0, 0.06) 2px, rgba(0, 0, 0, 0.06) 4px
        );
        pointer-events: none;
        z-index: 0;
      }

      #ryu-trb-panel > * {
        position: relative;
        z-index: 1;
      }

      /* ── Identity header ── */
      #ryu-trb-identity {
        padding: 24px 18px 20px;
        background: linear-gradient(180deg, rgba(232, 25, 44, 0.08) 0%, transparent 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      #ryu-trb-avatar {
        width: 68px;
        height: 68px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(232, 25, 44, 0.4) 0%, rgba(90, 0, 0, 0.85) 100%);
        border: 1px solid rgba(232, 25, 44, 0.4);
        box-shadow: 0 0 24px rgba(232, 25, 44, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Noto Sans', sans-serif;
        font-size: 26px;
        font-weight: 900;
        color: rgba(255, 210, 210, 0.92);
        flex-shrink: 0;
        letter-spacing: -1px;
      }

      #ryu-trb-id-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        min-width: 0;
        width: 100%;
      }

      #ryu-trb-username-display {
        font-family: 'Noto Sans', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        line-height: 1.2;
      }

      #ryu-trb-guest-label {
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.45);
        letter-spacing: 2.5px;
        text-transform: uppercase;
        text-align: center;
      }

      /* ── Stats grid ── */
      #ryu-trb-stats {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }

      #ryu-trb-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        margin-bottom: 12px;
      }

      .ryu-trb-sg {
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 7px;
        padding: 9px 11px;
        cursor: default;
        transition: background 0.15s, border-color 0.15s;
        position: relative;
        overflow: hidden;
      }
      .ryu-trb-sg::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.04);
      }
      .ryu-trb-sg:hover {
        background: rgba(232, 25, 44, 0.08);
        border-color: rgba(232, 25, 44, 0.25);
      }

      .ryu-trb-sg-label {
        font-size: 8px;
        font-weight: 700;
        color: rgba(232, 25, 44, 0.85);
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 4px;
        font-family: 'Noto Sans', sans-serif;
      }

      .ryu-trb-sg-val {
        font-family: 'Noto Sans', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.65);
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.15s;
        line-height: 1.2;
      }
      .ryu-trb-sg:hover .ryu-trb-sg-val {
        color: rgba(255, 255, 255, 0.95);
      }

      /* ── Login button ── */
      #ryu-trb-login-btn {
        display: block;
        width: 100%;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        color: #fff;
        text-decoration: none;
        background: linear-gradient(135deg, #22d3ee 0%, #0891b2 100%);
        padding: 10px;
        border-radius: 7px;
        letter-spacing: 1px;
        text-transform: uppercase;
        box-shadow: 0 3px 16px rgba(232, 25, 44, 0.4);
        transition: all 0.15s;
        cursor: pointer;
        border: 1px solid rgba(232, 25, 44, 0.5);
        font-family: 'Noto Sans', sans-serif;
        position: relative;
        overflow: hidden;
      }
      #ryu-trb-login-btn::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        transition: left 0.4s;
      }
      #ryu-trb-login-btn:hover::before { left: 100%; }
      #ryu-trb-login-btn:hover {
        background: linear-gradient(135deg, #ff2438 0%, #d01525 100%);
        box-shadow: 0 3px 24px rgba(232, 25, 44, 0.6);
        transform: translateY(-1px);
      }

      /* ── Nav section ── */
      #ryu-trb-nav {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .ryu-trb-nav-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px 18px;
        cursor: pointer;
        transition: background 0.15s;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        position: relative;
      }
      .ryu-trb-nav-btn:last-child { border-bottom: none; }
      .ryu-trb-nav-btn:hover { background: rgba(232, 25, 44, 0.07); }

      /* left sweep */
      .ryu-trb-nav-btn::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 2px;
        background: #22d3ee;
        box-shadow: 0 0 10px rgba(232, 25, 44, 0.7);
        transform: scaleY(0);
        transform-origin: bottom;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ryu-trb-nav-btn:hover::before { transform: scaleY(1); }

      .ryu-trb-nav-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.35);
        letter-spacing: 1px;
        flex: 1;
        transition: color 0.15s;
        text-transform: uppercase;
      }
      .ryu-trb-nav-btn:hover .ryu-trb-nav-label {
        color: rgba(255, 255, 255, 0.95);
      }

      .ryu-trb-nav-arrow {
        font-size: 18px;
        color: rgba(255, 255, 255, 0.08);
        transition: color 0.15s, transform 0.15s;
        line-height: 1;
        font-weight: 300;
      }
      .ryu-trb-nav-btn:hover .ryu-trb-nav-arrow {
        color: rgba(232, 25, 44, 0.7);
        transform: translateX(3px);
      }

      /* NEW badge */
      .ryu-trb-new-badge {
        font-family: 'Noto Sans', sans-serif;
        font-size: 7px;
        font-weight: 900;
        background: #22d3ee;
        color: #fff;
        padding: 2px 6px;
        border-radius: 3px;
        letter-spacing: 1px;
        box-shadow: 0 0 8px rgba(232, 25, 44, 0.5);
      }

      /* ── Resize handle ── */
      #ryu-trb-resize {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 1.4em;
        height: 1.4em;
        cursor: nesw-resize;
        z-index: 200;
      }

    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // login check
  function ryuIsLoggedIn() {
    try { return (globalThis.__Be && globalThis.__Be._1059._4652 !== 0); } catch(e) { return true; }
  }

  function ryuSuppressNativeLoginNotif() {
    // hide the native 'please login first' notification immediately when it appears
    var attempts = 0;
    var poll = setInterval(function() {
      attempts++;
      var notifs = document.querySelectorAll('.notification');
      notifs.forEach(function(n) {
        if (n.textContent.toLowerCase().includes('login')) {
          n.style.setProperty('display', 'none', 'important');
        }
      });
      if (attempts > 20) clearInterval(poll);
    }, 50);
  }

  function ryuShowLoginPopup() {
    if (document.getElementById('ryu-login-popup')) return;
    ryuSuppressNativeLoginNotif();
    var overlay = document.createElement('div');
    overlay.id = 'ryu-login-popup';
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:999999;background:rgba(0,0,0,0.7);';
    var box = document.createElement('div');
    box.style.cssText = 'position:relative;background:rgba(13,17,23,0.97);border:1px solid rgba(34,211,238,0.35);border-radius:12px;padding:32px 40px;text-align:center;min-width:280px;box-shadow:0 0 30px rgba(34,211,238,0.15);backdrop-filter:blur(4px);';
    var closeBtn = document.createElement('div');
    closeBtn.textContent = '\u2715';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:14px;cursor:pointer;color:rgba(34,211,238,0.5);font-size:16px;line-height:1;';
    closeBtn.addEventListener('mouseover', function() { closeBtn.style.color='#22d3ee'; });
    closeBtn.addEventListener('mouseout',  function() { closeBtn.style.color='rgba(34,211,238,0.5)'; });
    closeBtn.addEventListener('click', function() { overlay.remove(); });
    var icon = document.createElement('div');
    icon.textContent = '\uD83D\uDD12';
    icon.style.cssText = 'font-size:36px;margin-bottom:12px;';
    var msg = document.createElement('div');
    msg.textContent = 'Please login to use this';
    msg.style.cssText = 'color:#ffffff;font-size:15px;font-family:"Titillium Web",sans-serif;font-weight:600;letter-spacing:0.5px;';
    box.appendChild(closeBtn);
    box.appendChild(icon);
    box.appendChild(msg);
    overlay.appendChild(box);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // panel DOM
  function buildPanel(nativeTRB) {
    if (document.getElementById(TRB_PANEL_ID)) return;

    const usernameEl  = nativeTRB.querySelector('#mame-trb-user-data-username');
    const levelEl     = nativeTRB.querySelector('#mame-trb-user-data-level');
    const rcEl        = nativeTRB.querySelector('#mame-trb-user-data-rc');
    const rpEl        = nativeTRB.querySelector('#mame-trb-user-data-rp');
    const rankEl      = nativeTRB.querySelector('#mame-trb-user-data-rank');
    const loginEl     = nativeTRB.querySelector('#login-button');

    const username   = usernameEl ? usernameEl.textContent.trim() : 'Guest';
    const level      = levelEl    ? levelEl.textContent.trim()    : 'LEVEL 0';
    const rc         = rcEl       ? rcEl.textContent.trim()       : '0 RC';
    const rp         = rpEl       ? rpEl.textContent.trim()       : '0 RP';
    const rank       = rankEl     ? rankEl.textContent.trim()     : 'UNRANKED';
    const loginHref  = loginEl    ? loginEl.getAttribute('href')  : 'https://account.ryuten.io';
    const isGuest    = !!loginEl;
    const avatarChar = username.charAt(0).toUpperCase();

    const panel = document.createElement('div');
    panel.id = TRB_PANEL_ID;
    panel.innerHTML = `

      <!-- Identity header -->
      <div id="ryu-trb-identity">
        <div id="ryu-trb-avatar">${avatarChar}</div>
        <div id="ryu-trb-id-info">
          <div id="ryu-trb-username-display">${username}</div>
          <div id="ryu-trb-guest-label">${isGuest ? 'Guest Account' : 'Player'}</div>
        </div>
      </div>

      <!-- Stats + login -->
      <div id="ryu-trb-stats">
        <div id="ryu-trb-stats-grid">
          <div class="ryu-trb-sg">
            <div class="ryu-trb-sg-label">Level</div>
            <div class="ryu-trb-sg-val" id="ryu-trb-val-level">${level}</div>
          </div>
          <div class="ryu-trb-sg">
            <div class="ryu-trb-sg-label">Rank</div>
            <div class="ryu-trb-sg-val" id="ryu-trb-val-rank">${rank}</div>
          </div>
          <div class="ryu-trb-sg">
            <div class="ryu-trb-sg-label">RC</div>
            <div class="ryu-trb-sg-val" id="ryu-trb-val-rc">${rc}</div>
          </div>
          <div class="ryu-trb-sg">
            <div class="ryu-trb-sg-label">RP</div>
            <div class="ryu-trb-sg-val" id="ryu-trb-val-rp">${rp}</div>
          </div>
        </div>
        ${isGuest ? `<a id="ryu-trb-login-btn" href="${loginHref}">Login</a>` : ''}
      </div>

      <!-- Nav -->
      <div id="ryu-trb-nav">
        <div class="ryu-trb-nav-btn" id="ryu-trb-btn-shop">
          <span class="ryu-trb-nav-label">Shop</span>
          <span class="ryu-trb-new-badge">NEW</span>
          <span class="ryu-trb-nav-arrow">›</span>
        </div>
        <div class="ryu-trb-nav-btn" id="ryu-trb-btn-inventory">
          <span class="ryu-trb-nav-label">Inventory</span>
          <span class="ryu-trb-nav-arrow">›</span>
        </div>
        <div class="ryu-trb-nav-btn" id="ryu-trb-btn-replays">
          <span class="ryu-trb-nav-label">Replays</span>
          <span class="ryu-trb-nav-arrow">›</span>
        </div>
        <div class="ryu-trb-nav-btn" id="ryu-trb-btn-settings">
          <span class="ryu-trb-nav-label">Settings</span>
          <span class="ryu-trb-nav-arrow">›</span>
        </div>
      </div>

    `;

    // Menu backdrop — dark rect behind the menu matching its exact bounds
    var backdrop = document.createElement('div');
    backdrop.id = 'ryu-menu-backdrop';
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    // Wire nav buttons
    function wireBtn(panelId, nativeId) {
      const pb = document.getElementById(panelId);
      const nb = document.getElementById(nativeId);
      if (pb && nb) pb.addEventListener('click', () => nb.click());
    }
    // shop and inventory require login
    (function() {
      var pb = document.getElementById('ryu-trb-btn-shop');
      var nb = document.getElementById('mame-trb-shop-btn');
      if (pb && nb) pb.addEventListener('click', function() {
        if (!ryuIsLoggedIn()) { ryuShowLoginPopup(); return; }
        nb.click();
      });
    })();
    (function() {
      var pb = document.getElementById('ryu-trb-btn-inventory');
      var nb = document.getElementById('mame-trb-inventory-btn');
      if (pb && nb) pb.addEventListener('click', function() {
        if (!ryuIsLoggedIn()) { ryuShowLoginPopup(); return; }
        nb.click();
      });
    })();
    wireBtn('ryu-trb-btn-replays',   'mame-trb-replays-btn');
    wireBtn('ryu-trb-btn-settings',  'mame-trb-settings-btn');

    // Resize handle
    injectResizeHandle(panel);

    // Live data sync
    setInterval(function () {
      if (loadTheme().useDefault) return;
      const nTRB = document.querySelector('.mame-top-right-bar');
      if (!nTRB) return;

      function syncText(sel, id) {
        const src  = nTRB.querySelector(sel);
        const dest = document.getElementById(id);
        if (src && dest && dest.textContent !== src.textContent.trim())
          dest.textContent = src.textContent.trim();
      }

      syncText('#mame-trb-user-data-username', 'ryu-trb-username-display');
      syncText('#mame-trb-user-data-level',    'ryu-trb-val-level');
      syncText('#mame-trb-user-data-rc',       'ryu-trb-val-rc');
      syncText('#mame-trb-user-data-rp',       'ryu-trb-val-rp');
      syncText('#mame-trb-user-data-rank',     'ryu-trb-val-rank');

      // sync avatar char
      const av = document.getElementById('ryu-trb-avatar');
      const un = document.getElementById('ryu-trb-username-display');
      if (av && un) {
        const ch = un.textContent.charAt(0).toUpperCase();
        if (av.textContent !== ch) av.textContent = ch;
      }
      // login state sync — update guest label + remove login btn when user logs in
      const loginStillPresent = !!nTRB.querySelector('#login-button');
      const guestLabel = document.getElementById('ryu-trb-guest-label');
      const loginBtnTRB = document.getElementById('ryu-trb-login-btn');
      if (guestLabel) {
        const expected = loginStillPresent ? 'Guest Account' : 'Player';
        if (guestLabel.textContent !== expected) guestLabel.textContent = expected;
      }
      if (!loginStillPresent && loginBtnTRB) loginBtnTRB.remove();
    }, 500);
  }

  // resize handle
  function injectResizeHandle(panel) {
    if (document.getElementById('ryu-trb-resize')) return;

    var handle = document.createElement('div');
    handle.id = 'ryu-trb-resize';
    // two diagonal tick marks matching the LB handle style
    handle.innerHTML =
      '<div id="ryu-trb-rh1" style="position:absolute;left:4px;bottom:7px;width:8px;height:1.5px;background:rgba(200,0,0,0.5);transform:rotate(45deg);border-radius:1px;transition:background 0.2s;"></div>' +
      '<div id="ryu-trb-rh2" style="position:absolute;left:4px;bottom:3px;width:5px;height:1.5px;background:rgba(200,0,0,0.5);transform:rotate(45deg);border-radius:1px;transition:background 0.2s;"></div>';
    panel.appendChild(handle);

    // panel is pinned right:0 top:0 — dragging left edge = resize width
    // dragging bottom = resize height
    var PANEL_MIN_W = 200, PANEL_MAX_W = 700;
    var PANEL_MIN_H = 320, PANEL_MAX_H = 900;
    var _resizing = false, _startX = 0, _startY = 0, _startW = 0, _startH = 0;

    handle.addEventListener('mousedown', function (e) {
      _resizing = true;
      _startX   = e.clientX;
      _startY   = e.clientY;
      _startW   = panel.offsetWidth;
      _startH   = panel.offsetHeight;
      document.body.style.userSelect = 'none';
      e.preventDefault();
      e.stopPropagation();
    });

    window.addEventListener('mousemove', function (e) {
      if (!_resizing) return;
      // dragging left = panel grows wider (invert dx because panel is right-pinned)
      var dx   = _startX - e.clientX;
      var newW = Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, _startW + dx));
      panel.style.setProperty('width', newW + 'px', 'important');
      // dragging down = panel grows taller
      var dy   = e.clientY - _startY;
      var newH = Math.min(PANEL_MAX_H, Math.max(PANEL_MIN_H, _startH + dy));
      panel.style.setProperty('min-height', newH + 'px', 'important');
    }, { passive: true });

    window.addEventListener('mouseup', function () {
      if (!_resizing) return;
      _resizing = false;
      document.body.style.userSelect = '';
    });

    handle.addEventListener('mouseover', function () {
      handle.querySelectorAll('div').forEach(function (d) {
        d.style.background = '#ff3333';
        d.style.boxShadow  = '0 0 4px rgba(255,0,0,0.8)';
      });
    });
    handle.addEventListener('mouseout', function () {
      if (_resizing) return;
      handle.querySelectorAll('div').forEach(function (d) {
        d.style.background = 'rgba(200,0,0,0.5)';
        d.style.boxShadow  = '';
      });
    });
  }

  // visibility
  function updatePanelVisibility() {
    const panel = document.getElementById(TRB_PANEL_ID);
    if (!panel) return;
    if (loadTheme().useDefault || !isMainMenuVisible()) {
      panel.classList.remove('ryu-trb-visible');
    } else {
      panel.classList.add('ryu-trb-visible');
    }
  }

  // strip / restore
  function stripTRB() {
    const panel = document.getElementById(TRB_PANEL_ID);
    const style = document.getElementById(TRB_STYLE_ID);
    if (panel) panel.remove();
    if (style) style.remove();
    const native = document.querySelector('.mame-top-right-bar');
    if (native) native.style.removeProperty('display');
  }

  function injectTRB() {
    injectTRBStyle();
    waitForTRB(buildPanel);
  }

  globalThis.__ryuInjectTRB = injectTRB;
  globalThis.__ryuStripTRB  = stripTRB;

  // mutation observer
  var _menuObserver = null;

  function startMenuObserver() {
    if (_menuObserver) return;
    var mm = document.getElementById('main-menu');
    if (!mm) { setTimeout(startMenuObserver, 300); return; }

    _menuObserver = new MutationObserver(function () {
      if (loadTheme().useDefault) return;
      updatePanelVisibility();
    });

    _menuObserver.observe(mm, { attributes: true, attributeFilter: ['style'] });
  }

  // useDefault watcher
  var _lastDefault = null;

  setInterval(function () {
    var isDefault = !!loadTheme().useDefault;
    if (isDefault && _lastDefault !== true) {
      stripTRB();
    } else if (!isDefault && _lastDefault === true) {
      injectTRB();
      startMenuObserver();
    }
    _lastDefault = isDefault;
  }, 500);

  // Boot
  function boot() {
    if (loadTheme().useDefault) return;
    injectTRB();
    // start observer once #main-menu exists in DOM
    startMenuObserver();
    // set initial visibility after panel is built
    setTimeout(updatePanelVisibility, 400);
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  // ORB OVERLAY
  // MENU UI
  const MENU_UI_ID    = 'ryu-menu-ui';
  const MENU_STYLE_ID = 'ryu-menu-style';

  function injectMenuStyle() {
    if (document.getElementById(MENU_STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = MENU_STYLE_ID;
    s.textContent = `

      /* ── Hide native main menu elements ── */
      .mame-bottom-left-bar,
      .main-menu-ryuten-logo,
      .discord-url,
      #build-info,
      #main-menu .user-data,
      #change-skin-0,
      #change-skin-1,
      #change-skin,
      #orb-display {
        display: none !important;
      }

      /* ── Hide native bottom-right-bar — replaced by ryu-team-box ── */
      .mame-bottom-right-bar {
        display: none !important;
      }

      /* ── Menu backdrop — covers game canvas behind the menu ── */
      #ryu-menu-backdrop {
        position: fixed;
        background: #0d1117;
        z-index: 9960;
        pointer-events: none;
        display: none;
        transition: opacity 0.22s ease;
        opacity: 0;
      }
      #ryu-menu-backdrop.ryu-menu-visible {
        display: block;
        opacity: 1;
      }

      /* ── Menu UI shell ── */
      #ryu-menu-ui {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9970;
        display: none;
        grid-template-columns: 360px 600px 340px;
        gap: 10px;
        font-family: 'Noto Sans', sans-serif;
        user-select: none;
        pointer-events: all;
      }

      #ryu-menu-ui.ryu-menu-visible {
        display: grid;
      }

      /* ── Shared box ── */
      .ryu-menu-box {
        background: #161b22;
        border: 1px solid rgba(255,255,255,0.05);
        position: relative;
        overflow: visible;
      }
      .ryu-menu-box::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #22d3ee, transparent);
        z-index: 1;
      }

      /* ── Section label ── */
      .ryu-menu-label {
        font-size: 9px; font-weight: 700; letter-spacing: 3px;
        color: rgba(255,255,255,0.3); text-transform: uppercase;
        padding: 12px 14px 8px;
        font-family: 'Noto Sans', sans-serif;
      }

      /* ── Col divider ── */
      .ryu-menu-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        margin: 0 14px;
      }

      /* ── LEFT: Region buttons ── */
      .ryu-region-group {
        display: flex; gap: 6px;
        padding: 0 14px 12px;
      }
      .ryu-region-btn {
        flex: 1; height: 34px;
        background: #1c2128;
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 8px;
        color: rgba(255,255,255,0.3);
        font-family: 'Noto Sans', sans-serif;
        font-size: 10px; font-weight: 700; letter-spacing: 2px;
        cursor: pointer; outline: none;
        transition: all 0.15s;
      }
      .ryu-region-btn:hover {
        border-color: rgba(34,211,238,0.4); color: #fff;
      }
      .ryu-region-btn.ryu-region-active {
        background: rgba(34,211,238,0.15);
        border-color: #22d3ee; color: #fff;
        box-shadow: 0 0 10px rgba(34,211,238,0.2);
        text-shadow: 0 0 8px rgba(34,211,238,0.5);
      }

      /* ── LEFT: Mode list ── */
      .ryu-mode-list { padding: 4px 0 8px; flex: 1; display: flex; flex-direction: column; }
      .ryu-mode-item {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px; cursor: pointer;
        transition: background 0.15s;
        border-left: 2px solid transparent;
        flex: 1;
      }
      .ryu-mode-item:hover {
        background: rgba(34,211,238,0.05);
        border-left-color: rgba(34,211,238,0.35);
      }
      .ryu-mode-item.ryu-mode-active {
        background: rgba(34,211,238,0.09);
        border-left-color: #22d3ee;
      }
      .ryu-mode-arrow {
        font-size: 10px; color: rgba(34,211,238,0.5);
        font-family: 'Noto Sans', sans-serif;
      }
      .ryu-mode-name {
        font-size: 12px; font-weight: 600;
        color: rgba(255,255,255,0.45);
        flex: 1; transition: color 0.15s; letter-spacing: 0.3px;
      }
      .ryu-mode-item:hover .ryu-mode-name,
      .ryu-mode-item.ryu-mode-active .ryu-mode-name { color: #fff; }
      .ryu-mode-count {
        font-size: 11px; font-weight: 700; letter-spacing: 1px;
        color: rgba(34,211,238,0.4);
        font-family: 'Noto Sans', sans-serif;
      }
      .ryu-mode-item.ryu-mode-active .ryu-mode-count { color: #22d3ee; }

      /* ── CENTER: Orb section ── */
      .ryu-orb-section {
        padding: 18px 16px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      /* Profile badge */
      .ryu-orb-profile-badge {
        display: flex; align-items: center; gap: 7px;
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.5);
        border-left: 3px solid #22d3ee;
        padding: 5px 18px;
        box-shadow: 0 0 12px rgba(34,211,238,0.2);
        pointer-events: none;
      }
      .ryu-orb-profile-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #22d3ee; box-shadow: 0 0 6px #22d3ee;
        animation: ryu-orb-dot-blink 1.8s ease-in-out infinite;
        flex-shrink: 0;
      }
      @keyframes ryu-orb-dot-blink { 0%,100%{opacity:1;} 50%{opacity:0.2;} }
      .ryu-orb-profile-text {
        font-family: 'Noto Sans', sans-serif;
        font-size: 10px; font-weight: 900; letter-spacing: 4px;
        color: #fff; text-shadow: 0 0 8px rgba(34,211,238,0.4);
      }

      /* Dual orb row */
      .ryu-orb-dual-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 40px;
        flex-shrink: 0;
      }

      /* Each individual orb wrapper */
      .ryu-orb-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      /* Slot label above each orb */
      .ryu-orb-slot-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 13px; font-weight: 600; letter-spacing: 2px;
        color: rgba(34,211,238,0.75);
        text-transform: uppercase;
      }

      /* The orb circle — full circle, single skin */
      .ryu-orb-circle {
        position: relative;
        width: 202px; height: 202px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow:
          0 0 0 3px #22d3ee,
          0 0 20px rgba(34,211,238,0.65),
          0 0 50px rgba(34,211,238,0.18);
        flex-shrink: 0;
        background-color: #111;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
      .ryu-orb-center {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%,-50%);
        width: 16px; height: 16px; border-radius: 50%;
        border: 1.5px solid rgba(34,211,238,0.7);
        box-shadow: 0 0 10px rgba(34,211,238,0.5);
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
      }
      .ryu-orb-center::after {
        content: '';
        width: 6px; height: 6px; border-radius: 50%;
        background: #22d3ee; box-shadow: 0 0 6px #22d3ee;
      }
      .ryu-orb-notch { position: absolute; background: #22d3ee; box-shadow: 0 0 6px #22d3ee; pointer-events: none; }
      .ryu-orb-notch.t { top:-1px; left:50%; transform:translateX(-50%); width:3px; height:10px; }
      .ryu-orb-notch.b { bottom:-1px; left:50%; transform:translateX(-50%); width:3px; height:10px; }
      .ryu-orb-notch.l { left:-1px; top:50%; transform:translateY(-50%); width:10px; height:3px; }
      .ryu-orb-notch.r { right:-1px; top:50%; transform:translateY(-50%); width:10px; height:3px; }

      /* Change Skins button */
      #ryu-change-skins-btn {
        height: 36px; padding: 0 32px;
        background: rgba(34,211,238,0.1);
        border: 1px solid rgba(34,211,238,0.4);
        border-radius: 8px;
        cursor: pointer; outline: none;
        font-family: 'Noto Sans', sans-serif;
        font-size: 9px; font-weight: 700; letter-spacing: 3px;
        color: rgba(34,211,238,0.8);
        transition: all 0.15s;
        display: flex; align-items: center; gap: 8px;
      }
      #ryu-change-skins-btn:hover {
        background: rgba(34,211,238,0.2);
        border-color: #22d3ee; color: #fff;
        box-shadow: 0 0 14px rgba(34,211,238,0.3);
        text-shadow: 0 0 8px rgba(34,211,238,0.6);
      }

      /* ── CENTER: Input fields ── */
      .ryu-inputs-section {
        padding: 12px 14px 14px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .ryu-input-row { display: flex; gap: 8px; }
      .ryu-input-wrap { position: relative; flex: 1; min-width: 0; }
      .ryu-input-icon {
        position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
        color: rgba(255,255,255,0.18); font-size: 13px; pointer-events: none;
      }
      .ryu-field {
        width: 100%; height: 38px; padding: 0 10px 0 32px;
        background: #1c2128;
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 8px;
        color: #f0f0f0;
        font-family: 'Noto Sans', sans-serif; font-size: 13px; font-weight: 600;
        letter-spacing: 0.5px; outline: none;
        transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .ryu-field:focus {
        border-color: rgba(34,211,238,0.5);
        box-shadow: 0 0 8px rgba(34,211,238,0.1);
      }
      .ryu-field::placeholder { color: rgba(255,255,255,0.18); }

      /* ── CENTER: Play row ── */
      .ryu-play-row { display: flex; gap: 8px; }
      .ryu-play-btn {
        flex: 1; height: 42px;
        background: #22d3ee;
        border: none;
        border-radius: 8px;
        color: #0d1117;
        font-family: 'Noto Sans', sans-serif; font-size: 11px; font-weight: 800;
        letter-spacing: 2px; cursor: pointer; outline: none;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        box-shadow: 0 4px 20px rgba(34,211,238,0.3);
        transition: all 0.15s; position: relative; overflow: hidden;
      }
      .ryu-play-btn::before {
        content: ''; position: absolute; top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        transition: left 0.4s;
      }
      .ryu-play-btn:hover::before { left: 100%; }
      .ryu-play-btn:hover {
        box-shadow: 0 4px 28px rgba(34,211,238,0.6);
        transform: translateY(-1px);
      }
      .ryu-spec-btn {
        width: 42px; height: 42px;
        background: #1c2128; border: 1px solid rgba(255,255,255,0.07);
        border-radius: 8px;
        color: rgba(255,255,255,0.35); font-size: 15px;
        cursor: pointer; outline: none;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s;
        font-family: 'Noto Sans', sans-serif; font-weight: 700; letter-spacing: 1px;
      }
      .ryu-spec-btn:hover {
        border-color: rgba(34,211,238,0.4); color: #fff;
      }

      /* ── CENTER: Settings button ── */
      .ryu-settings-row { display: flex; }
      #ryu-open-settings-btn {
        flex: 1; height: 42px;
        background: transparent;
        border: 1px solid rgba(34,211,238,0.2);
        border-radius: 8px;
        color: rgba(34,211,238,0.6);
        font-family: 'Noto Sans', sans-serif; font-size: 11px; font-weight: 700;
        letter-spacing: 2px; cursor: pointer; outline: none;
        display: flex; align-items: center; justify-content: flex-start;
        padding-left: 212px; gap: 8px;
        transition: all 0.15s;
      }
      #ryu-open-settings-btn:hover {
        background: rgba(34,211,238,0.07);
        border-color: rgba(34,211,238,0.5);
        color: #22d3ee;
      }

      /* ── RIGHT: Account panel — Command HQ ── */
      #ryu-menu-right-account {
        display: flex; flex-direction: column; flex: 1;
      }
      .ryu-acct-hero {
        margin: 0 14px;
        background: linear-gradient(135deg, rgba(34,211,238,0.06) 0%, transparent 100%);
        border: 1px solid rgba(34,211,238,0.15);
        border-bottom: none;
        overflow: hidden;
        display: flex; align-items: center; gap: 16px;
        padding: 20px 18px; position: relative;
      }
      .ryu-acct-hero::after {
        content: ''; position: absolute; inset: 0;
        background: repeating-linear-gradient(
          0deg, transparent, transparent 3px,
          rgba(34,211,238,0.018) 3px, rgba(34,211,238,0.018) 4px
        );
        pointer-events: none;
      }
      .ryu-acct-avatar {
        width: 80px; height: 80px; border-radius: 50%;
        background: rgba(34,211,238,0.12);
        border: 2px solid rgba(34,211,238,0.6);
        box-shadow: 0 0 20px rgba(34,211,238,0.25);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Noto Sans', sans-serif; font-size: 32px; font-weight: 900;
        color: #ffffff; flex-shrink: 0; position: relative; z-index: 1;
      }
      .ryu-acct-id {
        flex: 1; min-width: 0; position: relative; z-index: 1;
      }
      .ryu-acct-name {
        font-family: 'Noto Sans', sans-serif;
        font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 0.5px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px;
      }
      .ryu-acct-tag {
        font-size: 9px; font-weight: 600;
        color: rgba(34,211,238,0.8); letter-spacing: 3px; text-transform: uppercase;
      }
      .ryu-acct-stats {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 1px; margin: 0 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-top: none;
      }
      .ryu-acct-stat {
        background: #161b22; padding: 13px 14px;
        display: flex; flex-direction: column; gap: 4px;
      }
      .ryu-acct-stat-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 8px; font-weight: 700; letter-spacing: 2px;
        color: rgba(34,211,238,0.75); text-transform: uppercase;
      }
      .ryu-acct-stat-val {
        font-family: 'Noto Sans', sans-serif;
        font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.9);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ryu-acct-actions {
        padding: 14px 14px 10px; display: flex; flex-direction: column; gap: 8px;
      }
      .ryu-acct-btn {
        height: 40px;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center; gap: 9px;
        font-family: 'Noto Sans', sans-serif; font-size: 12px; font-weight: 700;
        letter-spacing: 1.5px; cursor: pointer; border: none; outline: none;
        text-transform: uppercase; text-decoration: none; transition: all 0.15s;
      }
      .ryu-acct-btn.primary {
        background: #22d3ee; color: #0d1117;
        box-shadow: 0 2px 14px rgba(34,211,238,0.3);
      }
      .ryu-acct-btn.primary:hover { filter: brightness(1.08); box-shadow: 0 2px 22px rgba(34,211,238,0.45); transform: translateY(-1px); }
      .ryu-acct-btn.secondary {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.45);
      }
      .ryu-acct-btn.secondary:hover {
        background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.35); color: rgba(255,255,255,0.9);
      }

      /* ── TEAM BOX — below the main menu panel ── */
      /* ── TEAM BOX — Design 3: Operator Roster ── */
      #ryu-team-box {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        width: 1320px;
        max-width: 96vw;
        box-sizing: border-box;
        z-index: 9969;
        display: none;
        background: #0d1117;
        border: 1px solid rgba(255,255,255,0.05);
        border-top: 1px solid rgba(34,211,238,0.35);
        box-shadow: 0 0 30px rgba(0,0,0,0.6);
        font-family: 'Noto Sans', sans-serif;
        user-select: none;
        pointer-events: all;
        transition: opacity 0.22s ease;
        opacity: 0;
        height: 96px;
        align-items: center;
        padding: 0 14px;
        gap: 10px;
      }
      #ryu-team-box.ryu-team-visible {
        display: flex;
        opacity: 1;
      }
      #ryu-team-box-label {
        font-family: 'Noto Sans', sans-serif;
        font-size: 13px; font-weight: 700; letter-spacing: 3px;
        color: rgba(34,211,238,0.75);
        padding: 0 22px;
        border-right: 1px solid rgba(255,255,255,0.06);
        height: 100%; display: flex; align-items: center;
        white-space: nowrap; flex-shrink: 0;
      }
      #ryu-team-players {
        display: flex; flex: 1; align-items: center;
        gap: 10px; height: 100%;
      }
      .ryu-team-card {
        flex: 1;
        display: flex; align-items: center; gap: 14px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
        padding: 0 16px;
        height: 68px;
        position: relative; overflow: hidden;
        min-width: 0;
      }
      .ryu-team-card::before {
        content: '';
        position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
        background: transparent;
        transition: background 0.2s;
      }
      .ryu-team-card.filled::before {
        background: #22d3ee;
        box-shadow: 0 0 8px rgba(34,211,238,0.6);
      }
      /* Split orb container */
      .ryu-team-card-skin {
        width: 50px; height: 50px;
        border-radius: 50%; flex-shrink: 0;
        border: 2px solid rgba(34,211,238,0.4);
        box-shadow: 0 0 12px rgba(34,211,238,0.18);
        position: relative; overflow: hidden;
        background: #1c2128;
        cursor: pointer;
      }
      .ryu-team-card.empty .ryu-team-card-skin {
        border: 1.5px dashed rgba(255,255,255,0.1);
        box-shadow: none; background: transparent; cursor: default;
      }
      /* Left half — skin 1 */
      .ryu-team-orb-left {
        position: absolute; left: 0; top: 0; width: 50%; height: 100%;
        background-size: 200% 100%; background-position: left center;
        background-repeat: no-repeat; background-color: #111;
      }
      /* Right half — skin 2 */
      .ryu-team-orb-right {
        position: absolute; right: 0; top: 0; width: 50%; height: 100%;
        background-size: 200% 100%; background-position: right center;
        background-repeat: no-repeat; background-color: #111;
      }
      /* Split line */
      .ryu-team-orb-split {
        position: absolute; left: 50%; top: 5%; height: 90%; width: 1px;
        background: linear-gradient(180deg, transparent, rgba(34,211,238,0.5) 20%, rgba(34,211,238,0.5) 80%, transparent);
        transform: translateX(-50%);
        pointer-events: none;
      }
      /* Hover highlight overlay */
      .ryu-team-card-skin::after {
        content: '';
        position: absolute; inset: 0; border-radius: 50%;
        background: rgba(255,255,255,0);
        transition: background 0.18s ease;
        pointer-events: none;
      }
      .ryu-team-card.filled .ryu-team-card-skin:hover::after {
        background: rgba(255,255,255,0.12);
      }
      /* Click checkmark indicator */
      .ryu-team-copy-arrow {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: 22px; color: #22d3ee;
        text-shadow: 0 0 12px rgba(34,211,238,1), 0 0 4px #fff;
        font-weight: 900;
        pointer-events: none;
        transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
        opacity: 0; z-index: 10;
      }
      .ryu-team-copy-arrow.pop {
        transform: translate(-50%, -50%) scale(1.3);
        opacity: 1;
      }
      /* Skins Copied toast */
      .ryu-team-copy-toast {
        position: fixed;
        left: 50%; bottom: 60px;
        transform: translateX(-50%) translateY(14px);
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.5);
        border-left: 4px solid #22d3ee;
        padding: 11px 24px;
        font-family: 'Noto Sans', sans-serif;
        font-size: 10px; font-weight: 700; letter-spacing: 3px;
        color: #fff;
        box-shadow: 0 0 20px rgba(34,211,238,0.25), 0 8px 32px rgba(0,0,0,0.8);
        opacity: 0; pointer-events: none; z-index: 99999;
        white-space: nowrap; display: flex; align-items: center; gap: 10px;
        transition: opacity 200ms ease, transform 200ms ease;
      }
      .ryu-team-copy-toast.show {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }
      .ryu-team-copy-toast-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #22d3ee; box-shadow: 0 0 8px #22d3ee; flex-shrink: 0;
      }
      .ryu-team-card-info { min-width: 0; flex: 1; }
      .ryu-team-card-slot {
        font-family: 'Noto Sans', sans-serif;
        font-size: 10px; font-weight: 700; letter-spacing: 2px;
        color: rgba(34,211,238,0.6); margin-bottom: 5px;
        text-transform: uppercase;
      }
      .ryu-team-card.empty .ryu-team-card-slot { color: rgba(255,255,255,0.18); }
      .ryu-team-card-name {
        font-family: 'Noto Sans', sans-serif;
        font-size: 19px; font-weight: 700;
        color: rgba(255,255,255,0.88);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        letter-spacing: 0.4px;
      }
      .ryu-team-card.empty .ryu-team-card-name {
        color: rgba(255,255,255,0.18); font-style: normal;
      }

      /* ── RIGHT: Build info ── */
      .ryu-build-info {
        margin-top: auto; padding: 10px 14px;
        font-size: 9px; letter-spacing: 2px;
        color: rgba(255,255,255,0.12);
        font-family: 'Noto Sans', sans-serif;
        border-top: 1px solid rgba(255,255,255,0.04);
        text-align: center;
      }

      

    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function buildMenuUI() {
    if (document.getElementById(MENU_UI_ID)) return;

    // live data from native
    var activeRegionEl = document.querySelector('.mame-ssb-region-option-active');
    var activeRegion   = activeRegionEl ? activeRegionEl.textContent.trim() : 'NA';

    var activeModeEl   = document.getElementById('mame-ssb-mode-selected');
    var activeMode     = activeModeEl ? activeModeEl.textContent.trim() : '';

    var versionEl      = document.getElementById('client-version');
    var version        = versionEl ? versionEl.textContent.trim() : '0.18.7';

    var discordEl      = document.querySelector('.discord-url');
    var discordHref    = discordEl ? discordEl.getAttribute('href') : 'https://discord.gg/ASaWQErHH7';

    // account data from native TRB
    var nTRB        = document.querySelector('.mame-top-right-bar');
    var usernameEl  = nTRB ? nTRB.querySelector('#mame-trb-user-data-username') : null;
    var levelEl     = nTRB ? nTRB.querySelector('#mame-trb-user-data-level')    : null;
    var rcEl        = nTRB ? nTRB.querySelector('#mame-trb-user-data-rc')       : null;
    var rpEl        = nTRB ? nTRB.querySelector('#mame-trb-user-data-rp')       : null;
    var rankEl      = nTRB ? nTRB.querySelector('#mame-trb-user-data-rank')     : null;
    var loginEl     = nTRB ? nTRB.querySelector('#login-button')                : null;
    var username    = usernameEl ? usernameEl.textContent.trim() : 'Guest';
    var level       = levelEl    ? levelEl.textContent.trim()    : 'LEVEL 0';
    var rc          = rcEl       ? rcEl.textContent.trim()       : '0 RC';
    var rp          = rpEl       ? rpEl.textContent.trim()       : '0 RP';
    var rank        = rankEl     ? rankEl.textContent.trim()     : 'UNRANKED';
    var loginHref   = loginEl    ? loginEl.getAttribute('href')  : 'https://account.ryuten.io';
    var isGuest     = !!loginEl;
    var avatarChar  = username.charAt(0).toUpperCase();

    // mode list from native
    var modeItems = document.querySelectorAll('.mame-ssb-ms-item');
    var modeHTML  = '';
    var sibInfo   = document.getElementById('mame-sib-players-info');
    var sibText   = sibInfo ? sibInfo.textContent.trim() : '';
    modeItems.forEach(function (item) {
      var nameEl  = item.querySelector('.mame-ssb-ms-item-mode-name');
      var countEl = item.querySelector('.mame-ssb-ms-item-player-count div');
      var name    = nameEl  ? nameEl.textContent.trim()  : '';
      var count   = countEl ? countEl.textContent.trim() : '00';
      var isActive = activeMode && name.toUpperCase() === activeMode.toUpperCase();
      var countDisplay = isActive && sibText
        ? sibText
        : 'Players: ' + parseInt(count, 10);
      modeHTML += [
        '<div class="ryu-mode-item' + (isActive ? ' ryu-mode-active' : '') + '" data-mode="' + name + '">',
          '<span class="ryu-mode-arrow">›</span>',
          '<span class="ryu-mode-name">' + name + '</span>',
          '<span class="ryu-mode-count" id="ryu-mode-count-' + name.replace(/\s/g,'') + '">' + countDisplay + '</span>',
        '</div>'
      ].join('');
    });

    // region buttons
    var regions    = ['NA', 'EU', 'AS'];
    var regionHTML = regions.map(function (r) {
      var active = r === activeRegion ? ' ryu-region-active' : '';
      return '<button class="ryu-region-btn' + active + '" data-region="' + r + '">' + r + '</button>';
    }).join('');

    // assemble panel
    var panel = document.createElement('div');
    panel.id  = MENU_UI_ID;

    panel.innerHTML = [



      // LEFT column
      '<div class="ryu-menu-box" id="ryu-menu-left" style="display:flex;flex-direction:column;">',
        '<div class="ryu-menu-label">Select Region</div>',
        '<div class="ryu-region-group">' + regionHTML + '</div>',
        '<div class="ryu-menu-divider"></div>',
        '<div class="ryu-menu-label">Select Mode</div>',
        '<div class="ryu-mode-list">' + modeHTML + '</div>',

      '</div>',

      // CENTER column
      '<div class="ryu-menu-box" id="ryu-menu-center" style="display:flex;flex-direction:column;">',



        // Dual orb display — two separate full orbs, one per skin slot
        '<div class="ryu-orb-section" id="ryu-orb-section-placeholder">',
          '<div class="ryu-orb-profile-badge">',
            '<div class="ryu-orb-profile-dot"></div>',
            '<div class="ryu-orb-profile-text">PROFILE 1</div>',
          '</div>',
          '<div class="ryu-orb-dual-row">',
            '<div class="ryu-orb-slot">',
              '<div class="ryu-orb-slot-label">Skin <span style="font-family:Arial,sans-serif;font-weight:700;">1</span></div>',
              '<div class="ryu-orb-circle" id="ryu-orb-skin1">',
              '</div>',
            '</div>',
            '<div class="ryu-orb-slot">',
              '<div class="ryu-orb-slot-label">Skin <span style="font-family:Arial,sans-serif;font-weight:700;">2</span></div>',
              '<div class="ryu-orb-circle" id="ryu-orb-skin2">',
              '</div>',
            '</div>',
          '</div>',
          '<button id="ryu-change-skins-btn">⧉ &nbsp; CHANGE SKINS</button>',
        '</div>',

        // Inputs
        '<div class="ryu-inputs-section">',
          '<div class="ryu-input-row">',
            '<div class="ryu-input-wrap">',
              '<span class="ryu-input-icon">🏷</span>',
              '<input class="ryu-field" id="ryu-tag-input" placeholder="Tag" maxlength="10" autocomplete="off">',
            '</div>',
            '<div class="ryu-input-wrap">',
              '<span class="ryu-input-icon">🔒</span>',
              '<input class="ryu-field" id="ryu-pin-input" placeholder="Pin" maxlength="5" autocomplete="off">',
            '</div>',
          '</div>',
          '<div class="ryu-play-row">',
            '<button class="ryu-play-btn" id="ryu-play-btn">▶ &nbsp; PLAY NOW</button>',
            '<button class="ryu-spec-btn" id="ryu-spec-btn">👁</button>',
          '</div>',
          '<div class="ryu-settings-row">',
            '<button id="ryu-open-settings-btn">⚙ &nbsp; SETTINGS</button>',
          '</div>',
        '</div>',

      '</div>',

      // RIGHT column — Command HQ account panel
      '<div class="ryu-menu-box" id="ryu-menu-right" style="display:flex;flex-direction:column;">',
        '<div class="ryu-menu-label">Account</div>',
        '<div id="ryu-menu-right-account">',
          '<div class="ryu-acct-hero">',
            '<div class="ryu-acct-avatar" id="ryu-menu-acct-avatar">' + avatarChar + '</div>',
            '<div class="ryu-acct-id">',
              '<div class="ryu-acct-name" id="ryu-menu-acct-name">' + username + '</div>',
              '<div class="ryu-acct-tag">' + (isGuest ? 'Guest Account' : 'Player') + '</div>',
            '</div>',
          '</div>',
          '<div class="ryu-acct-stats">',
            '<div class="ryu-acct-stat">',
              '<div class="ryu-acct-stat-label">Level</div>',
              '<div class="ryu-acct-stat-val" id="ryu-menu-acct-level">' + level + '</div>',
            '</div>',
            '<div class="ryu-acct-stat">',
              '<div class="ryu-acct-stat-label">Rank</div>',
              '<div class="ryu-acct-stat-val" id="ryu-menu-acct-rank">' + rank + '</div>',
            '</div>',
            '<div class="ryu-acct-stat">',
              '<div class="ryu-acct-stat-label">RC</div>',
              '<div class="ryu-acct-stat-val" id="ryu-menu-acct-rc">' + rc + '</div>',
            '</div>',
            '<div class="ryu-acct-stat">',
              '<div class="ryu-acct-stat-label">RP</div>',
              '<div class="ryu-acct-stat-val" id="ryu-menu-acct-rp">' + rp + '</div>',
            '</div>',
          '</div>',
          '<div class="ryu-acct-actions">',
            (isGuest ? '<a class="ryu-acct-btn primary" id="ryu-menu-acct-login" href="' + loginHref + '">⚡ LOGIN</a>' : ''),
            '<button class="ryu-acct-btn secondary" id="ryu-menu-acct-shop">🏪 SHOP</button>',
            '<button class="ryu-acct-btn secondary" id="ryu-menu-acct-inventory">📦 INVENTORY</button>',
            '<button class="ryu-acct-btn secondary" id="ryu-menu-acct-replays">▶ REPLAYS</button>',

          '</div>',
        '</div>',
        '<div class="ryu-build-info">BUILD ' + version + ' · RYUTEN.IO</div>',
      '</div>'

    ].join('');

    document.body.appendChild(panel);

    // load skin images from game state
    function loadSkinImages() {
      var skin1url = '', skin2url = '';
      try {
        var ue = window.__Ue;
        if (ue && ue._3901) {
          skin1url = ue._3901._9315 || '';
          skin2url = ue._3901._8053 || '';
        }
      } catch(e) {}
      // Fallback to DOM if __Ue not ready
      if (!skin1url) {
        document.querySelectorAll('.mame-brb-team-player-preview').forEach(function(el) {
          var bg = el.style.backgroundImage;
          if (el.style.display !== 'none' && bg) {
            var url = bg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
            if (!skin1url) skin1url = url;
            else if (!skin2url && url !== skin1url) skin2url = url;
          }
        });
      }
      var orb1 = document.getElementById('ryu-orb-skin1');
      var orb2 = document.getElementById('ryu-orb-skin2');
      if (orb1 && skin1url) orb1.style.backgroundImage = 'url("' + skin1url + '")';
      if (orb2 && skin2url) orb2.style.backgroundImage = 'url("' + skin2url + '")';
      else if (orb2 && skin1url) orb2.style.backgroundImage = 'url("' + skin1url + '")';
      panel._skin1url = skin1url;
      panel._skin2url = skin2url || skin1url;
    }
    loadSkinImages();
    setTimeout(loadSkinImages, 1000);

    // watch for skin changes
    setInterval(function() {
      try {
        var ue = window.__Ue;
        if (!ue || !ue._3901) return;
        var s1 = ue._3901._9315 || '';
        var s2 = ue._3901._8053 || '';
        if (s1 !== panel._skin1url || s2 !== panel._skin2url) {
          loadSkinImages();
        }
      } catch(e) {}
    }, 150);

    // change skins button
    var changeSkinsBtnEl = document.getElementById('ryu-change-skins-btn');
    if (changeSkinsBtnEl) {
      changeSkinsBtnEl.addEventListener('click', function () {
        // Pre-emptively add ryu-csm-active before native button click so native layer is already hidden when game opens it
        var csmEl = document.getElementById('custom-skin-menu');
        if (csmEl) csmEl.classList.add('ryu-csm-active');
        // Open the native custom skin menu
        var nativeSkinBtn1 = document.getElementById('change-skin-0');
        if (nativeSkinBtn1) nativeSkinBtn1.click();
        // Poll every frame until native skin grid is populated, then inject
        (function waitForSkins(attempts) {
          requestAnimationFrame(function() {
            var skins = document.querySelectorAll('.csm-skin-selector');
            if (skins.length > 0 || attempts <= 0) {
              injectCSMRedesign();
            } else {
              waitForSkins(attempts - 1);
            }
          });
        })(60);
      });
    }

    // region buttons
    panel.querySelectorAll('.ryu-region-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var region = btn.getAttribute('data-region');
        // Click the matching native region option
        document.querySelectorAll('.mame-ssb-region-option').forEach(function (opt) {
          if (opt.textContent.trim() === region) opt.click();
        });
        // Update active state on our buttons
        panel.querySelectorAll('.ryu-region-btn').forEach(function (b) {
          b.classList.toggle('ryu-region-active', b.getAttribute('data-region') === region);
        });
      });
    });

    // mode items
    panel.querySelectorAll('.ryu-mode-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var modeName = item.getAttribute('data-mode');
        // Click the matching native mode item
        document.querySelectorAll('.mame-ssb-ms-item').forEach(function (ni) {
          var nameEl = ni.querySelector('.mame-ssb-ms-item-mode-name');
          if (nameEl && nameEl.textContent.trim() === modeName) ni.click();
        });
        // Update active state
        panel.querySelectorAll('.ryu-mode-item').forEach(function (m) {
          m.classList.toggle('ryu-mode-active', m.getAttribute('data-mode') === modeName);
        });
      });
    });

    // tag/pin inputs
    var nativeTeam = document.getElementById('team-input');
    var nativePin  = document.getElementById('pin-input');
    var ryuTag     = document.getElementById('ryu-tag-input');
    var ryuPin     = document.getElementById('ryu-pin-input');

    // Dispatch the full event sequence the game needs to commit a value
    // Simulate a full native type-and-commit cycle on a hidden input:
    // focus → set value → input → change → blur
    // This is what the game listens for to commit the value to server state.
    function commitNativeInput(nativeEl, val) {
      nativeEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      nativeEl.value = val;
      nativeEl.dispatchEvent(new Event('input',  { bubbles: true }));
      nativeEl.dispatchEvent(new Event('change', { bubbles: true }));
      nativeEl.dispatchEvent(new FocusEvent('blur',   { bubbles: true }));
    }

    if (ryuTag && nativeTeam) {
      // Sync initial value
      ryuTag.value = nativeTeam.value;
      // Fire on every keystroke so value stays live
      ryuTag.addEventListener('input', function () {
        commitNativeInput(nativeTeam, ryuTag.value);
      });
      // Also commit on blur of our field (user finished typing)
      ryuTag.addEventListener('blur', function () {
        commitNativeInput(nativeTeam, ryuTag.value);
      });
    }
    if (ryuPin && nativePin) {
      ryuPin.value = nativePin.value;
      ryuPin.addEventListener('input', function () {
        commitNativeInput(nativePin, ryuPin.value);
      });
      ryuPin.addEventListener('blur', function () {
        commitNativeInput(nativePin, ryuPin.value);
      });
    }

    // play button
    var playBtn = document.getElementById('ryu-play-btn');
    var nativePlay = document.getElementById('mame-play-btn');
    if (playBtn && nativePlay) {
      playBtn.addEventListener('click', function () {
        // Re-commit both fields immediately before the game reads them at spawn
        if (ryuTag && nativeTeam) commitNativeInput(nativeTeam, ryuTag.value);
        if (ryuPin && nativePin)  commitNativeInput(nativePin,  ryuPin.value);
        nativePlay.click();
      });
    }

    // spectate button
    var specBtn = document.getElementById('ryu-spec-btn');
    var nativeSpec = document.getElementById('mame-spectate-btn');
    if (specBtn && nativeSpec) {
      specBtn.addEventListener('click', function () { nativeSpec.click(); });
    }

    // settings button
    var openSettingsBtn = document.getElementById('ryu-open-settings-btn');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', function () {
        openRyuSettings('GAMEPLAY');
      });
    }

    // sync mode player counts
    setInterval(function () {
      var modeEls = document.querySelectorAll('.mame-ssb-ms-item');
      var sibInfo = document.getElementById('mame-sib-players-info');
      var sibText = sibInfo ? sibInfo.textContent.trim() : '';
      var activeModeEl = document.getElementById('mame-ssb-mode-selected');
      var activeNow = activeModeEl ? activeModeEl.textContent.trim().toUpperCase() : '';
      modeEls.forEach(function (item) {
        var nameEl  = item.querySelector('.mame-ssb-ms-item-mode-name');
        var countEl = item.querySelector('.mame-ssb-ms-item-player-count div');
        if (!nameEl || !countEl) return;
        var name = nameEl.textContent.trim();
        var key  = name.replace(/\s/g, '');
        var el   = document.getElementById('ryu-mode-count-' + key);
        if (!el) return;
        var isActive = name.toUpperCase() === activeNow;
        var newText  = isActive && sibText
          ? sibText
          : 'Players: ' + parseInt(countEl.textContent.trim(), 10);
        if (el.textContent !== newText) el.textContent = newText;
      });
    }, 500);

    // sync right column account data
    setInterval(function () {
      var nTRB = document.querySelector('.mame-top-right-bar');
      if (!nTRB) return;
      function syncMenuAcct(sel, id) {
        var src  = nTRB.querySelector(sel);
        var dest = document.getElementById(id);
        if (src && dest && dest.textContent !== src.textContent.trim())
          dest.textContent = src.textContent.trim();
      }
      syncMenuAcct('#mame-trb-user-data-username', 'ryu-menu-acct-name');
      syncMenuAcct('#mame-trb-user-data-level',    'ryu-menu-acct-level');
      syncMenuAcct('#mame-trb-user-data-rc',       'ryu-menu-acct-rc');
      syncMenuAcct('#mame-trb-user-data-rp',       'ryu-menu-acct-rp');
      syncMenuAcct('#mame-trb-user-data-rank',     'ryu-menu-acct-rank');
      var av = document.getElementById('ryu-menu-acct-avatar');
      var nm = document.getElementById('ryu-menu-acct-name');
      if (av && nm) {
        var ch = nm.textContent.charAt(0).toUpperCase();
        if (av.textContent !== ch) av.textContent = ch;
      }
      // login state sync — update tag + remove login btn when user logs in mid-session
      var loginStillPresent = !!nTRB.querySelector('#login-button');
      var tagEl  = document.querySelector('#ryu-menu-right .ryu-acct-tag');
      var loginBtnEl = document.getElementById('ryu-menu-acct-login');
      if (tagEl) {
        var expectedTag = loginStillPresent ? 'Guest Account' : 'Player';
        if (tagEl.textContent !== expectedTag) tagEl.textContent = expectedTag;
      }
      if (!loginStillPresent && loginBtnEl) loginBtnEl.remove();
    }, 500);

    // presence list renderer — called by relay hooks
    // right column account buttons
    function wireAcctBtn(ourId, nativeId) {
      var ob = document.getElementById(ourId);
      var nb = document.getElementById(nativeId);
      if (ob && nb) ob.addEventListener('click', function () { nb.click(); });
    }
    var shopBtnEl = document.getElementById('ryu-menu-acct-shop');
    if (shopBtnEl) {
      shopBtnEl.addEventListener('click', function () {
        if (!ryuIsLoggedIn()) { ryuShowLoginPopup(); return; }
        // Hide our menu panel immediately before anything else
        var menuPanel = document.getElementById('ryu-menu-ui');
        var menuBackdrop = document.getElementById('ryu-menu-backdrop');
        if (menuPanel) menuPanel.style.setProperty('display', 'none', 'important');
        if (menuBackdrop) menuBackdrop.style.setProperty('display', 'none', 'important');
        // Immediately hide native shop children before game shows them
        var shopEl = document.getElementById('shop-menu');
        if (shopEl) {
          ['layer__title','shop-wallet','shop-container','layer__bottom-btns'].forEach(function(cls) {
            var el = shopEl.querySelector('.' + cls);
            if (el) el.style.setProperty('display', 'none', 'important');
          });
        }
        // Inject our UI first, then click native button
        injectShopRedesign();
        var nativeShopBtn = document.getElementById('mame-trb-shop-btn');
        if (nativeShopBtn) nativeShopBtn.click();
      });
    }
    wireAcctBtn('ryu-menu-acct-inventory', 'mame-trb-inventory-btn');
    var replaysBtnEl = document.getElementById('ryu-menu-acct-replays');
    if (replaysBtnEl) {
      replaysBtnEl.addEventListener('click', function () {
        var menuPanel = document.getElementById('ryu-menu-ui');
        var menuBackdrop = document.getElementById('ryu-menu-backdrop');
        if (menuPanel) menuPanel.style.setProperty('display', 'none', 'important');
        if (menuBackdrop) menuBackdrop.style.setProperty('display', 'none', 'important');
        // Click native first so entries populate
        var nativeBtn = document.getElementById('mame-trb-replays-btn');
        if (nativeBtn) nativeBtn.click();
        // Hide native content immediately
        var galEl = document.getElementById('gallery');
        if (galEl) {
          ['layer__title','gl-container-wrapper','layer__bottom-btns'].forEach(function(cls) {
            var el = galEl.querySelector('.' + cls);
            if (el) el.style.setProperty('opacity', '0', 'important');
          });
        }
        // Wait for entries to populate then inject our UI
        var attempts = 0;
        var poll = setInterval(function() {
          attempts++;
          if (document.querySelectorAll('.gl-entry').length > 0 || attempts > 20) {
            clearInterval(poll);
            injectReplaysRedesign();
          }
        }, 100);
      });
    }
    var inventoryBtnEl = document.getElementById('ryu-menu-acct-inventory');
    if (inventoryBtnEl) {
      inventoryBtnEl.addEventListener('click', function () {
        if (!ryuIsLoggedIn()) { ryuShowLoginPopup(); return; }
        var menuPanel = document.getElementById('ryu-menu-ui');
        var menuBackdrop = document.getElementById('ryu-menu-backdrop');
        if (menuPanel) menuPanel.style.setProperty('display', 'none', 'important');
        if (menuBackdrop) menuBackdrop.style.setProperty('display', 'none', 'important');
        var invEl = document.getElementById('inventory-menu');
        if (invEl) {
          ['layer__title','inventory-container','layer__bottom-btns'].forEach(function(cls) {
            var el = invEl.querySelector('.' + cls) || invEl.querySelector('#' + cls);
            if (el) el.style.setProperty('display', 'none', 'important');
          });
        }
        injectInventoryRedesign();
        var nativeInvBtn = document.getElementById('mame-trb-inventory-btn');
        if (nativeInvBtn) nativeInvBtn.click();
      });
    }

    // mirror main-menu transition
    var mm = document.getElementById('main-menu');
    if (mm) {
      function syncMenuUI() {
        var ms = mm.style;
        panel.style.opacity    = ms.opacity    || '';
        panel.style.transform  = 'translate(-50%, -50%)' + (ms.transform ? ' ' + ms.transform.replace('perspective(100px)', '').trim() : '');
        panel.style.transition = ms.transition || '';
        if (ms.display === 'none') {
          panel.classList.remove('ryu-menu-visible');
          // Hide backdrop
          var bd = document.getElementById('ryu-menu-backdrop');
          if (bd) bd.classList.remove('ryu-menu-visible');
        } else if (!loadTheme().useDefault) {
          panel.classList.add('ryu-menu-visible');
          // Position + show backdrop to cover game canvas behind menu
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              var bd = document.getElementById('ryu-menu-backdrop');
              var mu = document.getElementById('ryu-menu-ui');
              if (bd && mu) {
                var r = mu.getBoundingClientRect();
                if (r.height > 0) {
                  bd.style.left   = r.left   + 'px';
                  bd.style.top    = r.top    + 'px';
                  bd.style.width  = r.width  + 'px';
                  bd.style.height = r.height + 'px';
                  bd.style.opacity    = ms.opacity    || '';
                  bd.style.transition = ms.transition || '';
                  bd.classList.add('ryu-menu-visible');
                }
              }
            });
          });
          // Keep backdrop synced if viewport resizes (e.g. dev tools open/close)
          if (!window.__ryuBackdropResizeWired) {
            window.__ryuBackdropResizeWired = true;
            window.addEventListener('resize', function() {
              var bd2 = document.getElementById('ryu-menu-backdrop');
              var mu2 = document.getElementById('ryu-menu-ui');
              if (bd2 && mu2 && bd2.classList.contains('ryu-menu-visible')) {
                var r2 = mu2.getBoundingClientRect();
                if (r2.height > 0) {
                  bd2.style.left   = r2.left   + 'px';
                  bd2.style.top    = r2.top    + 'px';
                  bd2.style.width  = r2.width  + 'px';
                  bd2.style.height = r2.height + 'px';
                }
              }
            });
          }
        }

      }
      new MutationObserver(syncMenuUI).observe(mm, { attributes: true, attributeFilter: ['style'] });
      syncMenuUI();
    }

  }

  function stripMenuUI() {
    var panel = document.getElementById(MENU_UI_ID);
    var style = document.getElementById(MENU_STYLE_ID);
    var tb    = document.getElementById('ryu-team-box');
    var bd    = document.getElementById('ryu-menu-backdrop');
    if (panel) panel.remove();
    if (style) style.remove();
    if (tb)    tb.remove();
    if (bd)    bd.remove();
    // Restore native elements
    var toRestore = [
      document.querySelector('.mame-bottom-left-bar'),
      document.querySelector('.main-menu-ryuten-logo'),
      document.querySelector('.discord-url'),
      document.getElementById('build-info'),
      document.querySelector('#main-menu .user-data')
    ];
    toRestore.forEach(function (el) {
      if (el) el.style.removeProperty('display');
    });
  }

  function initMenuUI() {
    if (loadTheme().useDefault) return;
    injectMenuStyle();
    buildMenuUI();
  }

  globalThis.__ryuInitMenuUI  = initMenuUI;
  globalThis.__ryuStripMenuUI = stripMenuUI;

  // useDefault watcher
  var _menuUILastDefault = null;

  setInterval(function () {
    var isDefault = !!loadTheme().useDefault;
    if (isDefault && _menuUILastDefault !== true) {
      stripMenuUI();
    } else if (!isDefault && _menuUILastDefault === true) {
      initMenuUI();
    }
    _menuUILastDefault = isDefault;
  }, 500);

  // boot menu UI
  function tryInitMenuUI() {
    if (loadTheme().useDefault) return;
    if (document.querySelectorAll('.mame-ssb-ms-item').length === 0) {
      setTimeout(tryInitMenuUI, 300);
      return;
    }
    initMenuUI();
  }
  setTimeout(tryInitMenuUI, 800);

  // pre-inject overlay styles at boot
  injectCSMStyle();
  injectShopStyle();
  injectInventoryStyle();
  injectReplaysStyle();

  // team box
  // Does not depend on buildMenuUI. Boots as soon as #main-menu exists.
  (function initTeamBox() {
    var mm = document.getElementById('main-menu');
    if (!mm) { setTimeout(initTeamBox, 200); return; }

    // Build the DOM once
    var old = document.getElementById('ryu-team-box');
    if (old) old.remove();

    var tb = document.createElement('div');
    tb.id = 'ryu-team-box';

    var label = document.createElement('div');
    label.id = 'ryu-team-box-label';
    label.textContent = 'TEAM';
    tb.appendChild(label);

    var playersEl = document.createElement('div');
    playersEl.id = 'ryu-team-players';
    tb.appendChild(playersEl);

    document.body.appendChild(tb);

    // Refresh player cards from native DOM
    function refreshTeamBox() {
      var nativePlayers = document.querySelectorAll('.mame-brb-team-player');
      playersEl.innerHTML = '';
      for (var i = 0; i < 5; i++) {
        var card = document.createElement('div');
        var np = nativePlayers[i];
        var skin1 = '', skin2 = '', name = '';
        if (np) {
          var nameEl = np.querySelector('.mame-brb-team-player-username');
          name = nameEl ? nameEl.textContent.trim() : '';
          // Collect both skin URLs regardless of display state
          np.querySelectorAll('.mame-brb-team-player-preview').forEach(function(p) {
            var bg = p.style.backgroundImage;
            if (bg && bg !== 'none' && bg !== '') {
              var url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
              if (url && !skin1) skin1 = url;
              else if (url && !skin2 && url !== skin1) skin2 = url;
            }
          });
        }
        var filled = !!name;
        card.className = 'ryu-team-card' + (filled ? ' filled' : ' empty');

        // Split orb — left half skin1, right half skin2
        var skinDiv = document.createElement('div');
        skinDiv.className = 'ryu-team-card-skin';
        if (filled) {
          var leftHalf = document.createElement('div');
          leftHalf.className = 'ryu-team-orb-left';
          if (skin1) leftHalf.style.backgroundImage = 'url(' + skin1 + ')';

          var rightHalf = document.createElement('div');
          rightHalf.className = 'ryu-team-orb-right';
          if (skin2) rightHalf.style.backgroundImage = 'url(' + skin2 + ')';
          else if (skin1) rightHalf.style.backgroundImage = 'url(' + skin1 + ')';

          var splitLine = document.createElement('div');
          splitLine.className = 'ryu-team-orb-split';

          var arrow = document.createElement('div');
          arrow.className = 'ryu-team-copy-arrow';
          arrow.textContent = '✓';

          skinDiv.appendChild(leftHalf);
          skinDiv.appendChild(rightHalf);
          skinDiv.appendChild(splitLine);
          skinDiv.appendChild(arrow);

          // Click — copy both skin URLs to Copied Skins section + show toast
          (function(s1, s2, arrowEl) {
            skinDiv.addEventListener('click', function(e) {
              e.stopPropagation();
              // Add to _csmCopied
              [s1, s2].forEach(function(url) {
                if (url && _csmCopied.indexOf(url) === -1) {
                  _csmCopied.push(url);
                }
              });
              saveCopied();
              // Checkmark pop animation
              arrowEl.classList.add('pop');
              setTimeout(function() { arrowEl.classList.remove('pop'); }, 500);
              // Show "Skins Copied" toast
              showTeamCopyToast();
            });
          })(skin1, skin2, arrow);
        }

        var info = document.createElement('div');
        info.className = 'ryu-team-card-info';
        var slotDiv = document.createElement('div');
        slotDiv.className = 'ryu-team-card-slot';
        slotDiv.textContent = 'PLAYER ' + (i + 1);
        var nameDiv = document.createElement('div');
        nameDiv.className = 'ryu-team-card-name';
        nameDiv.textContent = filled ? (name || '—') : '—';
        info.appendChild(slotDiv);
        info.appendChild(nameDiv);
        card.appendChild(skinDiv);
        card.appendChild(info);
        playersEl.appendChild(card);
      }
    }

    // Skins Copied toast
    var _teamCopyToastTimer = null;
    function showTeamCopyToast() {
      var existing = document.getElementById('ryu-team-copy-toast');
      if (existing) existing.remove();
      if (_teamCopyToastTimer) clearTimeout(_teamCopyToastTimer);
      var toast = document.createElement('div');
      toast.id = 'ryu-team-copy-toast';
      toast.className = 'ryu-team-copy-toast';
      toast.innerHTML = '<div class="ryu-team-copy-toast-dot"></div>SKINS COPIED';
      document.body.appendChild(toast);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() { toast.classList.add('show'); });
      });
      _teamCopyToastTimer = setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 220);
      }, 1800);
    }

    // Position below #ryu-menu-ui
    function positionTeamBox() {
      var mu = document.getElementById('ryu-menu-ui');
      if (!mu) return;
      var r = mu.getBoundingClientRect();
      if (r.height > 0) {
        var boxH = tb.offsetHeight || 96;
        var desired = r.bottom + 6;
        var max = window.innerHeight - boxH - 4;
        tb.style.top = Math.min(desired, max) + 'px';
      }
    }

    // Watch #main-menu style directly — same source as the game
    new MutationObserver(function() {
      var ms = mm.style;
      if (loadTheme().useDefault) { tb.classList.remove('ryu-team-visible'); return; }
      if (ms.display === 'none') {
        tb.classList.remove('ryu-team-visible');
      } else {
        tb.style.opacity    = ms.opacity    || '';
        tb.style.transition = ms.transition || '';
        tb.classList.add('ryu-team-visible');
        // Position after two rAFs so #ryu-menu-ui has painted its display:grid state
        requestAnimationFrame(function() {
          requestAnimationFrame(function() { positionTeamBox(); });
        });
      }
    }).observe(mm, { attributes: true, attributeFilter: ['style'] });

    window.addEventListener('resize', positionTeamBox);
    setInterval(positionTeamBox, 500);
    refreshTeamBox();
    setInterval(refreshTeamBox, 1000);
  })();





  // CUSTOM SKIN MENU
  var CSM_STYLE_ID    = 'ryu-csm-style';
  var CSM_INJECTED_ID = 'ryu-csm-injected';
  var _csmActiveSlot  = 0;  // 0 = Skin I, 1 = Skin II
  var _csmFavs        = [];
  var _csmCopied      = [];       // persisted to localStorage['ryuCsmCopied']
  // Featured skins — curator-only, hardcoded, sourced from imgur album
  var _csmFeatured = [
    'https://i.imgur.com/gztpA4g.png',
    'https://i.imgur.com/MdbbiNv.png',
    'https://i.imgur.com/bRFVnnd.png',
    'https://i.imgur.com/qcnnWmT.png',
    'https://i.imgur.com/MIz2BYv.png',
    'https://i.imgur.com/axQb1dX.png',
    'https://i.imgur.com/BLUeJ5I.png',
    'https://i.imgur.com/jzR39ax.png',
    'https://i.imgur.com/ujnEuqJ.jpg',
    'https://i.imgur.com/rVHo8pO.png',
    'https://i.imgur.com/EsXORYN.png'
  ];
  // Per-slot selected URL — independent state for each slot.
  // Seeded from __Ue on open; updated on every SELECT action.
  var _csmSlotUrl     = ['', ''];
  try { _csmFavs   = JSON.parse(localStorage.getItem('ryuCsmFavs')   || '[]'); } catch(e) {}
  try { _csmCopied = JSON.parse(localStorage.getItem('ryuCsmCopied') || '[]'); } catch(e) {}
  var _csmPreloaded = {};

  function preloadCsmSkin(url) {
    if (!url) return Promise.resolve(false);
    if (_csmPreloaded[url]) return _csmPreloaded[url];
    _csmPreloaded[url] = new Promise(function(resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        if (img.decode) img.decode().then(function() { resolve(true); }).catch(function() { resolve(true); });
        else resolve(true);
      };
      img.onerror = function() { resolve(false); };
      img.src = url;
    });
    return _csmPreloaded[url];
  }

  function preloadFeaturedSkins() {
    _csmFeatured.forEach(function(url) { preloadCsmSkin(url); });
  }

  function applyCsmSkinToSlot(slot, url) {
    try {
      if (window.__Be) window.__Be._2263(slot, url);
      if (window.__Ue && window.__Ue._3901) {
        if (slot === 0) window.__Ue._3901._9315 = url;
        if (slot === 1) window.__Ue._3901._8053 = url;
      }
      try {
        var ud = JSON.parse(localStorage.getItem('user-data'));
        if (Array.isArray(ud)) {
          ud[slot === 0 ? 2 : 3] = url;
          localStorage.setItem('user-data', JSON.stringify(ud));
        }
      } catch(e2) {}
    } catch(e) { console.error('[CSM] skin apply failed', e); }
  }

  setTimeout(preloadFeaturedSkins, 1200);

  function saveFavs() {
    try { localStorage.setItem('ryuCsmFavs', JSON.stringify(_csmFavs)); } catch(e) {}
  }
  function saveCopied() {
    try { localStorage.setItem('ryuCsmCopied', JSON.stringify(_csmCopied)); } catch(e) {}
  }

  function injectCSMStyle() {
    if (document.getElementById(CSM_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = CSM_STYLE_ID;
    s.textContent = `
      /* ── Hide native CSM content permanently — visibility so layout is preserved ── */
      #custom-skin-menu .layer__title,
      #custom-skin-menu #csm-container,
      #custom-skin-menu .layer__bottom-btns,
      #custom-skin-menu #csm-url-input-box {
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* ── Make layer transparent so game shows through ── */
      #custom-skin-menu {
        background: transparent !important;
        pointer-events: none !important;
      }

      /* ── Centered window — uses flex on the layer itself to avoid transform conflict ── */
      #custom-skin-menu.ryu-csm-active {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: all !important;
      }

      /* ── Our injected UI is always visible on top ── */
      #ryu-csm-injected {
        visibility: visible !important;
      }

      #ryu-csm-injected {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.96) translateY(8px) !important;
        width: 1430px;
        height: 884px;
        max-width: 92vw;
        max-height: 92vh;
        display: flex; flex-direction: column;
        font-family: 'Noto Sans', sans-serif;
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.2);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.03),
          0 24px 80px rgba(0,0,0,0.9),
          0 0 60px rgba(34,211,238,0.08);
        overflow: hidden;
        flex-shrink: 0;
        opacity: 0;
        visibility: visible !important;
        transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
                    transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      #ryu-csm-injected.ryu-csm-visible {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) !important;
      }
      #ryu-csm-injected.ryu-csm-closing {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.97) !important;
        transition: opacity 140ms ease-in, transform 140ms ease-in;
      }

      /* Header */
      #ryu-csm-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 32px; height: 56px; flex-shrink: 0;
        background: #161b22;
        border-bottom: 1px solid rgba(34,211,238,0.15);
        position: relative;
      }
      #ryu-csm-header::after {
        content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, #22d3ee, transparent);
      }
      #ryu-csm-title {
        font-family: 'Noto Sans', sans-serif; font-size: 13px; font-weight: 900;
        letter-spacing: 5px; color: #fff;
        text-shadow: 0 0 16px rgba(34,211,238,0.4);
      }
      #ryu-csm-back-btn {
        height: 30px; padding: 0 16px;
        background: #1c2128; border: 1px solid rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.35);
        font-family: 'Noto Sans', sans-serif; font-size: 8px; font-weight: 700;
        letter-spacing: 2px; cursor: pointer; outline: none; transition: all 0.15s;
        display: flex; align-items: center; gap: 6px;
      }
      #ryu-csm-back-btn:hover { border-color: rgba(34,211,238,0.4); color: #fff; }

      /* Body */
      #ryu-csm-body { display: flex; flex: 1; min-height: 0; }

      /* Sidebar */
      #ryu-csm-sidebar {
        width: 200px; flex-shrink: 0;
        border-right: 1px solid rgba(255,255,255,0.05);
        display: flex; flex-direction: column; padding: 16px 0;
        background: #161b22;
      }
      .ryu-csm-sb-label {
        font-family: 'Noto Sans', sans-serif; font-size: 7px; font-weight: 700;
        letter-spacing: 2px; color: rgba(255,255,255,0.2);
        padding: 0 16px 8px;
      }
      .ryu-csm-sb-item {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 16px; cursor: pointer;
        transition: background 0.15s; border-left: 2px solid transparent;
        font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4);
      }
      .ryu-csm-sb-item:hover { background: rgba(34,211,238,0.05); border-left-color: rgba(34,211,238,0.3); color: #fff; }
      .ryu-csm-sb-item.active { background: rgba(34,211,238,0.09); border-left-color: #22d3ee; color: #fff; }
      .ryu-csm-sb-count {
        margin-left: auto; font-family: Arial, sans-serif;
        font-size: 12px; color: rgba(34,211,238,0.85); font-weight: 700;
      }
      .ryu-csm-sb-divider { height: 1px; background: rgba(255,255,255,0.04); margin: 10px 16px; }

      /* Slot buttons in sidebar */
      .ryu-csm-slot-btn {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 16px; cursor: pointer;
        transition: all 0.15s; border-left: 2px solid transparent;
        font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.35);
        position: relative;
      }
      .ryu-csm-slot-btn:hover { background: rgba(34,211,238,0.05); color: #fff; }
      .ryu-csm-slot-btn.active {
        background: rgba(34,211,238,0.1); border-left-color: #22d3ee; color: #fff;
      }
      .ryu-csm-slot-preview {
        width: 32px; height: 32px; border-radius: 50%;
        overflow: hidden; flex-shrink: 0;
        border: 1px solid rgba(255,255,255,0.1);
        background: #1c2128;
      }
      .ryu-csm-slot-preview img { width: 100%; height: 100%; object-fit: cover; }

      /* Main content */
      #ryu-csm-content { flex: 1; display: flex; flex-direction: column; min-height: 0; }

      /* Grid */
      #ryu-csm-grid-wrap {
        flex: 1; overflow-y: auto; padding: 16px 24px;
      }
      #ryu-csm-grid-wrap::-webkit-scrollbar { width: 5px; }
      #ryu-csm-grid-wrap::-webkit-scrollbar-track { background: #161b22; }
      #ryu-csm-grid-wrap::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 3px; }
      #ryu-csm-grid-wrap::-webkit-scrollbar-thumb:hover { background: #22d3ee; }

      #ryu-csm-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
      }

      /* Skin card */
      .ryu-csm-card-wrap {
        position: relative;
      }
      .ryu-csm-card {
        position: relative; aspect-ratio: 1;
        background: #161b22; border: 1px solid rgba(255,255,255,0.05);
        cursor: pointer; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        border-radius: 50%;
      }
      .ryu-csm-card:hover {
        border-color: rgba(34,211,238,0.5);
        box-shadow: 0 2px 16px rgba(0,0,0,0.5);
        transform: translateY(-2px);
      }
      .ryu-csm-card.slot0-active { border-color: #22d3ee; box-shadow: 0 0 14px rgba(34,211,238,0.4); }
      .ryu-csm-card.slot1-active { border-color: #22d3ee; box-shadow: 0 0 14px rgba(34,211,238,0.4); }

      .ryu-csm-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.15s; }
      .ryu-csm-card:hover img { transform: scale(1.06); }

      /* Hover overlay */
      .ryu-csm-card-overlay {
        position: absolute; inset: 0; background: rgba(0,0,0,0.82);
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        opacity: 0; transition: opacity 0.15s;
      }
      .ryu-csm-card:hover .ryu-csm-card-overlay { opacity: 1; }

      .ryu-csm-card-action {
        width: 78%; height: 28px;
        font-family: 'Noto Sans', sans-serif; font-size: 8px; font-weight: 700; letter-spacing: 1px;
        background: transparent; border: 1px solid rgba(255,255,255,0.18);
        color: rgba(255,255,255,0.65); cursor: pointer; outline: none; transition: all 0.15s;
      }
      .ryu-csm-card-action.sel { border-color: rgba(34,211,238,0.5); color: rgba(34,211,238,0.9); }
      .ryu-csm-card-action.sel:hover { background: rgba(34,211,238,0.2); color: #fff; border-color: #22d3ee; }
      .ryu-csm-card-action:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .ryu-csm-card-action.del:hover { background: rgba(200,0,0,0.15); border-color: rgba(200,0,0,0.5); color: #ff4444; }

      /* Active slot badge on card */
      .ryu-csm-card-badge {
        position: absolute; bottom: 0; left: 0; right: 0;
        font-family: 'Noto Sans', sans-serif; font-size: 7px; font-weight: 700; letter-spacing: 1px;
        color: #0d1117; text-align: center; padding: 4px 0;
        background: rgba(34,211,238,0.9);
      }

      /* Fav star */
      .ryu-csm-fav {
        position: absolute; top: 0px; right: 0px;
        width: 20px; height: 20px; border-radius: 50%;
        background: rgba(0,0,0,0.75);
        border: 1px solid rgba(34,211,238,0.6);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; cursor: pointer;
        color: rgba(34,211,238,0.7);
        transition: color 0.15s, background 0.15s, text-shadow 0.15s;
        z-index: 10;
      }
      .ryu-csm-fav:hover { background: rgba(0,0,0,0.95); color: #22d3ee; }
      .ryu-csm-fav.on { color: #ffd700 !important; border-color: rgba(255,215,0,0.6) !important; text-shadow: 0 0 8px rgba(255,215,0,0.8) !important; }

      /* Hide Pickr's own trigger button — we use our own swatch */
      .pcr-button { display: none !important; }

      /* Minus remove icon — Copied tab */
      .ryu-csm-minus {
        position: absolute; top: -6px; left: -6px;
        width: 20px; height: 20px; border-radius: 50%;
        background: #1c2128; border: 1px solid rgba(34,211,238,0.5);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 700; line-height: 1;
        color: rgba(34,211,238,0.8); cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        z-index: 5;
      }
      .ryu-csm-minus:hover {
        background: rgba(34,211,238,0.2); border-color: #22d3ee; color: #fff;
      }

      /* Card exit animation */
      .ryu-csm-card.ryu-csm-removing {
        opacity: 0;
        transform: scale(0.8);
        transition: opacity 160ms ease, transform 160ms ease;
        pointer-events: none;
      }

      /* Toast notification — bigger */
      .ryu-csm-toast {
        position: fixed;
        bottom: 44px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.5);
        border-left: 4px solid #22d3ee;
        padding: 13px 28px;
        font-family: 'Noto Sans', sans-serif;
        font-size: 11px; font-weight: 700; letter-spacing: 3px;
        color: #fff;
        box-shadow: 0 0 24px rgba(34,211,238,0.3), 0 10px 40px rgba(0,0,0,0.8);
        opacity: 0;
        transition: opacity 200ms ease, transform 200ms ease;
        pointer-events: none;
        z-index: 99999;
        white-space: nowrap;
        display: flex; align-items: center; gap: 12px;
      }
      .ryu-csm-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .ryu-csm-toast-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #22d3ee; box-shadow: 0 0 10px #22d3ee; flex-shrink: 0;
      }
      .ryu-csm-toast.fav { border-left-color: #ffd700; }
      .ryu-csm-toast.fav .ryu-csm-toast-dot { background: #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.8); }
      .ryu-csm-toast.unfav { border-left-color: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.1); }
      .ryu-csm-toast.unfav .ryu-csm-toast-dot { background: rgba(255,255,255,0.25); box-shadow: none; }
      .ryu-csm-toast.sel { border-left-color: #22d3ee; }
      .ryu-csm-toast.sel .ryu-csm-toast-dot { background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }
      .ryu-csm-toast.slot { border-left-color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.12); }
      .ryu-csm-toast.slot .ryu-csm-toast-dot { background: rgba(255,255,255,0.5); box-shadow: none; }

      /* Footer URL bar */
      #ryu-csm-footer {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 24px; flex-shrink: 0;
        background: #161b22; border-top: 1px solid rgba(255,255,255,0.04);
      }
      #ryu-csm-url-label {
        font-family: 'Noto Sans', sans-serif; font-size: 8px; letter-spacing: 2px;
        color: rgba(34,211,238,0.6); white-space: nowrap;
      }
      #ryu-csm-url-in {
        flex: 1; height: 34px; padding: 0 12px;
        background: #1c2128; border: 1px solid rgba(255,255,255,0.07);
        color: #f0f0f0; font-family: 'Noto Sans', sans-serif;
        font-size: 13px; font-weight: 600; outline: none; transition: border-color 0.15s;
      }
      #ryu-csm-url-in:focus { border-color: rgba(34,211,238,0.5); }
      #ryu-csm-url-in::placeholder { color: rgba(255,255,255,0.18); }
      #ryu-csm-url-add {
        height: 34px; padding: 0 18px;
        background: #22d3ee; border: none; color: #0d1117;
        font-family: 'Noto Sans', sans-serif; font-size: 8px; font-weight: 800; letter-spacing: 2px;
        cursor: pointer; outline: none; transition: all 0.15s;
        box-shadow: 0 2px 10px rgba(34,211,238,0.25);
      }
      #ryu-csm-url-add:hover { filter: brightness(1.08); box-shadow: 0 2px 18px rgba(34,211,238,0.4); }
      #ryu-csm-skin-count {
        font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 1px;
        color: rgba(255,255,255,0.6); font-weight: 700; white-space: nowrap;
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  // Helper — smoothly close the wrapper with animation, keep in DOM for instant reopen
  function closeCsmWrapper() {
    var ow = document.getElementById(CSM_INJECTED_ID);
    if (!ow) return;
    ow.classList.remove('ryu-csm-visible');
    ow.classList.add('ryu-csm-closing');
    setTimeout(function() {
      var el = document.getElementById(CSM_INJECTED_ID);
      if (el) {
        el.classList.remove('ryu-csm-closing');
      }
      var csmEl = document.getElementById('custom-skin-menu');
      if (csmEl) csmEl.classList.remove('ryu-csm-active');
    }, 155);
  }

  function injectCSMRedesign() {
    injectCSMStyle();

    var csmEl = document.getElementById('custom-skin-menu');
    if (!csmEl) return;
    csmEl.classList.add('ryu-csm-active');

    // If wrapper already exists from a previous open, just re-show it
    if (document.getElementById(CSM_INJECTED_ID)) {
      var ow = document.getElementById(CSM_INJECTED_ID);
      ow.classList.remove('ryu-csm-closing');
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          ow.classList.add('ryu-csm-visible');
        });
      });
      return;
    }

    // Seed per-slot URL state from live game data — only if not already tracked
    function getSkin1Url() {
      try { var ue = window.__Ue; if (ue && ue._3901) return ue._3901._9315 || ''; } catch(e) {}
      return '';
    }
    function getSkin2Url() {
      try { var ue = window.__Ue; if (ue && ue._3901) return ue._3901._8053 || ''; } catch(e) {}
      return '';
    }
    _csmSlotUrl[0] = getSkin1Url();
    _csmSlotUrl[1] = getSkin2Url();

    // Read all skin URLs from the native grid
    function getSkinUrls() {
      var urls = [];
      document.querySelectorAll('.csm-skin-selector').forEach(function(sel) {
        var img = sel.querySelector('.csm-skin-selector-image');
        if (img && img.src) urls.push(img.src);
      });
      return urls;
    }

    // Prune stale favorites — remove any entry that is neither in native storage nor featured
    (function pruneStaleFavs() {
      var liveUrls = getSkinUrls();
      var before = _csmFavs.length;
      _csmFavs = _csmFavs.filter(function(u) {
        return u && u.length > 0 &&
          (liveUrls.indexOf(u) !== -1 || _csmFeatured.indexOf(u) !== -1);
      });
      if (_csmFavs.length !== before) saveFavs();
    })();

    var _csmSection = 'all'; // 'all', 'favs', or 'copied'

    // build card
    function buildCard(url, context) {
      var ctx   = context || 'all';
      var isFav = _csmFavs.indexOf(url) !== -1;
      var isS0  = url === _csmSlotUrl[0];
      var isS1  = url === _csmSlotUrl[1];
      var cardCls = 'ryu-csm-card' + (isS0 ? ' slot0-active' : '') + (isS1 ? ' slot1-active' : '');

      var card = document.createElement('div');
      card.className = 'ryu-csm-card-wrap';

      var cardInner = document.createElement('div');
      cardInner.className = cardCls;

      var overlayBtns = '<button class="ryu-csm-card-action sel">✓ SELECT</button>';
      if (ctx === 'all') {
        overlayBtns += '<button class="ryu-csm-card-action del">✕ DELETE</button>';
      }

      cardInner.innerHTML =
        '<img src="' + url + '" crossorigin="anonymous">' +
        '<div class="ryu-csm-card-overlay">' + overlayBtns + '</div>' +
        (isS0 ? '<div class="ryu-csm-card-badge">SKIN I</div>' : '') +
        (isS1 && !isS0 ? '<div class="ryu-csm-card-badge">SKIN II</div>' : '');

      var favEl = null;
      if (ctx !== 'copied') {
        favEl = document.createElement('div');
        favEl.className = 'ryu-csm-fav' + (isFav ? ' on' : '');
        favEl.title = 'Favorite';
        favEl.textContent = '★';
        card.appendChild(favEl);
      }

      if (ctx === 'copied') {
        var minusEl = document.createElement('div');
        minusEl.className = 'ryu-csm-minus';
        minusEl.title = 'Remove';
        minusEl.textContent = '−';
        card.appendChild(minusEl);
      }

      card.appendChild(cardInner);
      // SELECT
      card.querySelector('.ryu-csm-card-action.sel').addEventListener('click', function(e) {
        e.stopPropagation();

        _csmSlotUrl[_csmActiveSlot] = url;

        try {
          if (window.__Be) window.__Be._2263(_csmActiveSlot, url);
          if (window.__Ue && window.__Ue._3901) {
            if (_csmActiveSlot === 0) window.__Ue._3901._9315 = url;
            if (_csmActiveSlot === 1) window.__Ue._3901._8053 = url;
          }
          // persist exactly like native SELECT — write to user-data[2] / user-data[3]
          try {
            var ud = JSON.parse(localStorage.getItem('user-data'));
            if (Array.isArray(ud)) {
              ud[_csmActiveSlot === 0 ? 2 : 3] = url;
              localStorage.setItem('user-data', JSON.stringify(ud));
            }
          } catch(e2) {}
        } catch(e) { console.error('[CSM] skin apply failed', e); }
        (function(slot, selectedUrl) {
          preloadCsmSkin(selectedUrl).then(function() {
            applyCsmSkinToSlot(slot, selectedUrl);
            setTimeout(function() { applyCsmSkinToSlot(slot, selectedUrl); }, 350);
            setTimeout(function() { applyCsmSkinToSlot(slot, selectedUrl); }, 900);
          });
        })(_csmActiveSlot, url);

        var grid = document.getElementById('ryu-csm-grid');
        if (grid) {
          var slotClass = _csmActiveSlot === 0 ? 'slot0-active' : 'slot1-active';
          var slotLabel = _csmActiveSlot === 0 ? 'SKIN I' : 'SKIN II';
          grid.querySelectorAll('.ryu-csm-card').forEach(function(c) {
            c.classList.remove(slotClass);
            c.querySelectorAll('.ryu-csm-card-badge').forEach(function(b) {
              if (b.textContent === slotLabel) b.remove();
            });
          });
          cardInner.classList.add(slotClass);
          var badgeEl = document.createElement('div');
          badgeEl.className = 'ryu-csm-card-badge';
          badgeEl.textContent = slotLabel;
          cardInner.appendChild(badgeEl);
        }

        var slotPreviewImg = document.querySelector('#ryu-csm-slot' + _csmActiveSlot + ' .ryu-csm-slot-preview img');
        if (slotPreviewImg) slotPreviewImg.src = url;

        var orbEl = document.getElementById(_csmActiveSlot === 0 ? 'ryu-orb-skin1' : 'ryu-orb-skin2');
        if (orbEl) orbEl.style.backgroundImage = 'url(' + url + ')';

        showCsmToast('SKIN ' + (_csmActiveSlot === 0 ? 'I' : 'II') + ' SELECTED', 'sel');
      });

      // DELETE
      if (ctx === 'all') {
        card.querySelector('.ryu-csm-card-action.del').addEventListener('click', function(e) {
          e.stopPropagation();

          // Confirmation popup
          var confirm = document.createElement('div');
          confirm.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;';
          confirm.innerHTML = '<div style="background:#0d1117;border:1px solid rgba(34,211,238,0.3);border-radius:10px;padding:28px 32px;display:flex;flex-direction:column;align-items:center;gap:16px;min-width:280px;">' +
            '<div style="font-family:\'Noto Sans\',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1px;">DELETE SKIN?</div>' +
            '<div style="font-family:\'Noto Sans\',sans-serif;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-align:center;">This will permanently remove the skin<br>from your collection.</div>' +
            '<div style="display:flex;gap:10px;margin-top:4px;">' +
              '<button id="ryu-del-cancel" style="height:36px;padding:0 20px;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.5);font-family:\'Noto Sans\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;cursor:pointer;">CANCEL</button>' +
              '<button id="ryu-del-confirm" style="height:36px;padding:0 20px;background:rgba(200,0,0,0.2);border:1px solid rgba(200,0,0,0.4);border-radius:6px;color:#ff4444;font-family:\'Noto Sans\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;cursor:pointer;">DELETE</button>' +
            '</div>' +
          '</div>';
          document.body.appendChild(confirm);

          confirm.querySelector('#ryu-del-cancel').addEventListener('click', function() { confirm.remove(); });
          confirm.addEventListener('click', function(ev) { if (ev.target === confirm || ev.target === confirm.firstElementChild) confirm.remove(); });
          function onDelEsc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', onDelEsc); confirm.remove(); } }
          document.addEventListener('keydown', onDelEsc);

          confirm.querySelector('#ryu-del-confirm').addEventListener('click', function() {
            confirm.remove();
            document.querySelectorAll('.csm-skin-selector').forEach(function(nSel) {
              var nImg = nSel.querySelector('.csm-skin-selector-image');
              if (nImg && nImg.src === url) {
                var delBtn = nSel.querySelectorAll('.csm-skin-selector-button')[2];
                if (delBtn) delBtn.click();
              }
            });
            card.style.transition = 'opacity 150ms ease, transform 150ms ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(function() {
              card.remove();
              var favIdx = _csmFavs.indexOf(url);
              if (favIdx !== -1) {
                _csmFavs.splice(favIdx, 1);
                saveFavs();
                var secFavsCount = document.querySelector('#ryu-csm-sec-favs .ryu-csm-sb-count');
                if (secFavsCount) secFavsCount.textContent = _csmFavs.length;
              }
              var countEl = document.getElementById('ryu-csm-skin-count');
              if (countEl) countEl.textContent = document.querySelectorAll('#ryu-csm-grid .ryu-csm-card').length + ' SKINS';
              var secAllCount = document.querySelector('#ryu-csm-sec-all .ryu-csm-sb-count');
              if (secAllCount) secAllCount.textContent = getSkinUrls().length;
            }, 150);
          });
        });
      }

      // FAV
      if (ctx !== 'copied') {
        favEl.addEventListener('click', function(e) {
          e.stopPropagation();
          var idx = _csmFavs.indexOf(url);
          var adding = idx === -1;
          if (adding) {
            _csmFavs.push(url);
            saveFavs();
            favEl.classList.add('on');
            var secFavsCount = document.querySelector('#ryu-csm-sec-favs .ryu-csm-sb-count');
            if (secFavsCount) secFavsCount.textContent = _csmFavs.length;
            showCsmToast('FAVORITED', 'fav');
          } else {
            _csmFavs.splice(idx, 1);
            saveFavs();
            var secFavsCount2 = document.querySelector('#ryu-csm-sec-favs .ryu-csm-sb-count');
            if (secFavsCount2) secFavsCount2.textContent = _csmFavs.length;
            if (ctx === 'favs') {
              card.classList.add('ryu-csm-removing');
              setTimeout(function() { card.remove(); }, 160);
              showCsmToast('UNFAVORITED', 'unfav');
            } else {
              favEl.classList.remove('on');
              showCsmToast('UNFAVORITED', 'unfav');
            }
          }
        });
      }

      // MINUS
      if (ctx === 'copied') {
        minusEl.addEventListener('click', function(e) {
          e.stopPropagation();
          var idx = _csmCopied.indexOf(url);
          if (idx !== -1) _csmCopied.splice(idx, 1);
          saveCopied();
          var secCopiedCount = document.querySelector('#ryu-csm-sec-copied .ryu-csm-sb-count');
          if (secCopiedCount) secCopiedCount.textContent = _csmCopied.length;
          card.classList.add('ryu-csm-removing');
          setTimeout(function() { card.remove(); }, 160);
          showCsmToast('REMOVED', 'unfav');
        });
      }

      return card;
    }

    // build UI
    var wrapper = document.createElement('div');
    wrapper.id = CSM_INJECTED_ID;

    function buildUI() {
      var urls        = getSkinUrls();
      var favUrls     = _csmFavs.filter(function(u) {
        if (!u || !u.length) return false;
        // keep if skin exists in native storage OR is a featured skin
        return urls.indexOf(u) !== -1 || _csmFeatured.indexOf(u) !== -1;
      });
      var copiedUrls  = _csmCopied.filter(function(u) { return u && u.length > 0; });
      var displayUrls = _csmSection === 'favs' ? favUrls
                      : _csmSection === 'copied' ? copiedUrls
                      : _csmSection === 'featured' ? _csmFeatured
                      : urls;

      wrapper.innerHTML = [
        '<div id="ryu-csm-header">',
          '<div id="ryu-csm-title">CUSTOM SKINS</div>',
          '<button id="ryu-csm-back-btn">← BACK [ESC]</button>',
        '</div>',
        '<div id="ryu-csm-body">',
          '<div id="ryu-csm-sidebar">',
            '<div class="ryu-csm-sb-label">SECTIONS</div>',
            '<div class="ryu-csm-sb-item' + (_csmSection === 'all' ? ' active' : '') + '" id="ryu-csm-sec-all">',
              'All Skins <span class="ryu-csm-sb-count">' + urls.length + '</span>',
            '</div>',
            '<div class="ryu-csm-sb-item' + (_csmSection === 'favs' ? ' active' : '') + '" id="ryu-csm-sec-favs">',
              '★ Favorites <span class="ryu-csm-sb-count">' + favUrls.length + '</span>',
            '</div>',
            '<div class="ryu-csm-sb-item' + (_csmSection === 'copied' ? ' active' : '') + '" id="ryu-csm-sec-copied">',
              '✓ Copied Skins <span class="ryu-csm-sb-count">' + copiedUrls.length + '</span>',
            '</div>',
            '<div class="ryu-csm-sb-item' + (_csmSection === 'featured' ? ' active' : '') + '" id="ryu-csm-sec-featured">',
              '◈ Featured <span class="ryu-csm-sb-count">' + _csmFeatured.length + '</span>',
            '</div>',
            '<div class="ryu-csm-sb-divider"></div>',
            '<div class="ryu-csm-sb-label">ACTIVE SLOT</div>',
            '<div class="ryu-csm-slot-btn' + (_csmActiveSlot === 0 ? ' active' : '') + '" id="ryu-csm-slot0">',
              '<div class="ryu-csm-slot-preview"><img src="' + (_csmSlotUrl[0] || '') + '"></div>',
              'Skin I',
            '</div>',
            '<div class="ryu-csm-slot-btn' + (_csmActiveSlot === 1 ? ' active' : '') + '" id="ryu-csm-slot1">',
              '<div class="ryu-csm-slot-preview"><img src="' + (_csmSlotUrl[1] || '') + '"></div>',
              'Skin II',
            '</div>',
            '<div class="ryu-csm-sb-divider"></div>',
            '<button id="ryu-csm-reset-backup-btn" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 16px;background:transparent;border:none;border-left:2px solid transparent;color:rgba(34,211,238,0.45);font-family:\'Noto Sans\',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;cursor:pointer;text-align:left;transition:background 0.15s,color 0.15s,border-left-color 0.15s;box-sizing:border-box;"><span style="font-size:13px;line-height:1;">↓</span>BACKUP SKINS</button>',
          '</div>',
          '<div id="ryu-csm-content">',
            '<div id="ryu-csm-grid-wrap"><div id="ryu-csm-grid"></div></div>',
            (_csmSection === 'featured'
              ? ''
              : '<div id="ryu-csm-footer">' +
                  '<div id="ryu-csm-url-label">ADD URL</div>' +
                  '<input id="ryu-csm-url-in" placeholder="https://i.imgur.com/example.png">' +
                  '<button id="ryu-csm-url-add">ADD</button>' +
                  '<div id="ryu-csm-skin-count">' + urls.length + ' SKINS</div>' +
                '</div>'
            ),
          '</div>',
        '</div>'
      ].join('');

      csmEl.appendChild(wrapper);

      // Populate grid
      var grid = document.getElementById('ryu-csm-grid');
      displayUrls.forEach(function(url) {
        grid.appendChild(buildCard(url, _csmSection));
      });

      wireUI();
    }

    // re-stamp badges on slot change
    function refreshCardBadges() {
      var grid = document.getElementById('ryu-csm-grid');
      if (!grid) return;
      grid.querySelectorAll('.ryu-csm-card').forEach(function(card) {
        var img = card.querySelector('img');
        if (!img) return;
        var cardUrl = img.src;

        card.classList.remove('slot0-active', 'slot1-active');
        card.querySelectorAll('.ryu-csm-card-badge').forEach(function(b) { b.remove(); });

        var isS0 = cardUrl === _csmSlotUrl[0];
        var isS1 = cardUrl === _csmSlotUrl[1];
        if (isS0) {
          card.classList.add('slot0-active');
          var b0 = document.createElement('div');
          b0.className = 'ryu-csm-card-badge';
          b0.textContent = 'SKIN I';
          card.appendChild(b0);
        }
        if (isS1 && !isS0) {
          card.classList.add('slot1-active');
          var b1 = document.createElement('div');
          b1.className = 'ryu-csm-card-badge';
          b1.textContent = 'SKIN II';
          card.appendChild(b1);
        }
      });
    }

    // Wire all sidebar/footer/back/ESC interactions
    function wireUI() {

      // Section tabs — only replace grid content, not full wrapper
      function switchSection(newSection) {
        if (_csmSection === newSection) return;
        _csmSection = newSection;

        // Update sidebar active states
        ['all','favs','copied','featured'].forEach(function(sec) {
          var el = document.getElementById('ryu-csm-sec-' + sec);
          if (el) el.classList.toggle('active', sec === newSection);
        });

        // Rebuild only the grid
        var urls       = getSkinUrls();
        var favUrls    = _csmFavs.filter(function(u) {
          return u && u.length > 0 && (urls.indexOf(u) !== -1 || _csmFeatured.indexOf(u) !== -1);
        });
        var copiedUrls = _csmCopied.filter(function(u) { return u && u.length > 0; });
        var displayUrls = newSection === 'favs' ? favUrls
                        : newSection === 'copied' ? copiedUrls
                        : newSection === 'featured' ? _csmFeatured
                        : urls;

        var grid = document.getElementById('ryu-csm-grid');
        if (grid) {
          grid.innerHTML = '';
          displayUrls.forEach(function(url) {
            grid.appendChild(buildCard(url, newSection));
          });
        }

        // Show/hide footer
        var footer = document.getElementById('ryu-csm-footer');
        if (footer) footer.style.display = newSection === 'featured' ? 'none' : '';

        // Update skin counts
        var secAllCount = document.querySelector('#ryu-csm-sec-all .ryu-csm-sb-count');
        if (secAllCount) secAllCount.textContent = urls.length;
        var secFavsCount = document.querySelector('#ryu-csm-sec-favs .ryu-csm-sb-count');
        if (secFavsCount) secFavsCount.textContent = favUrls.length;
        var secCopiedCount = document.querySelector('#ryu-csm-sec-copied .ryu-csm-sb-count');
        if (secCopiedCount) secCopiedCount.textContent = copiedUrls.length;
        var skinCount = document.getElementById('ryu-csm-skin-count');
        if (skinCount) skinCount.textContent = urls.length + ' SKINS';
      }

      var secAll     = document.getElementById('ryu-csm-sec-all');
      var secFavs    = document.getElementById('ryu-csm-sec-favs');
      var secCopied  = document.getElementById('ryu-csm-sec-copied');
      var secFeatured = document.getElementById('ryu-csm-sec-featured');
      if (secAll)      secAll.addEventListener('click',     function() { switchSection('all'); });
      if (secFavs)     secFavs.addEventListener('click',    function() { switchSection('favs'); });
      if (secCopied)   secCopied.addEventListener('click',  function() { switchSection('copied'); });
      if (secFeatured) secFeatured.addEventListener('click', function() { switchSection('featured'); });

      // Slot buttons — no rebuild, only update active styling + re-stamp badges + toast
      var slot0 = document.getElementById('ryu-csm-slot0');
      var slot1 = document.getElementById('ryu-csm-slot1');
      if (slot0) slot0.addEventListener('click', function() {
        if (_csmActiveSlot === 0) return;
        _csmActiveSlot = 0;
        slot0.classList.add('active');
        if (slot1) slot1.classList.remove('active');
        refreshCardBadges();
        showCsmToast('SKIN I ACTIVE', 'slot');
      });
      if (slot1) slot1.addEventListener('click', function() {
        if (_csmActiveSlot === 1) return;
        _csmActiveSlot = 1;
        slot1.classList.add('active');
        if (slot0) slot0.classList.remove('active');
        refreshCardBadges();
        showCsmToast('SKIN II ACTIVE', 'slot');
      });

      // Backup skins button
      var resetBackupBtn = document.getElementById('ryu-csm-reset-backup-btn');
      if (resetBackupBtn) {
        resetBackupBtn.addEventListener('mouseenter', function() {
          resetBackupBtn.style.background = 'rgba(34,211,238,0.06)';
          resetBackupBtn.style.color = '#22d3ee';
          resetBackupBtn.style.borderLeftColor = 'rgba(34,211,238,0.5)';
        });
        resetBackupBtn.addEventListener('mouseleave', function() {
          resetBackupBtn.style.background = 'transparent';
          resetBackupBtn.style.color = 'rgba(34,211,238,0.45)';
          resetBackupBtn.style.borderLeftColor = 'transparent';
        });
        resetBackupBtn.addEventListener('click', function() {
          var urls = getSkinUrls();
          var content = 'RyuTheme Skin Backup\n' + new Date().toLocaleString() + '\nSkin Count: ' + urls.length + '\n\n' + urls.join('\n');
          var blob = new Blob([content], { type: 'text/plain' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'ryutheme-skins-backup.txt';
          a.click();
          URL.revokeObjectURL(a.href);
          showCsmToast('BACKUP DOWNLOADED', 'sel');
        });
      }

      // Back button — smooth close animation then native back
      var backBtn = document.getElementById('ryu-csm-back-btn');
      if (backBtn) backBtn.addEventListener('click', function() {
        var nativeBack = document.getElementById('csm-back-button');
        if (nativeBack) nativeBack.click();
        closeCsmWrapper();
      });

      // ESC — watch display:none after menu was fully open; use smooth close
      if (csmEl._ryuObserver) csmEl._ryuObserver.disconnect();
      var _csmMenuOpen = false;
      var csmObserver = new MutationObserver(function() {
        var cs = csmEl.style;
        if (cs.display === 'flex' && cs.opacity === '1') _csmMenuOpen = true;
        if (_csmMenuOpen && cs.display === 'none') {
          _csmMenuOpen = false;
          closeCsmWrapper();
        }
      });
      csmEl._ryuObserver = csmObserver;
      csmObserver.observe(csmEl, { attributes: true, attributeFilter: ['style'] });

      // Add URL
      var urlIn  = document.getElementById('ryu-csm-url-in');
      var urlAdd = document.getElementById('ryu-csm-url-add');
      if (urlAdd && urlIn) {
        function doAddUrl() {
          var url = urlIn.value.trim();
          if (!url) return;
          urlIn.value = '';

          var nativeBox    = document.getElementById('csm-url-input-box');
          var nativeInput  = document.getElementById('csm-url-input');
          var nativeAddBtn = document.getElementById('csm-skin-add');
          if (!nativeInput || !nativeAddBtn) return;

          var skinsBefore = [];
          try { skinsBefore = JSON.parse(localStorage.getItem('custom-skin-urls') || '[]'); } catch(e) {}

          nativeAddBtn.click();
          setTimeout(function() {
            if (nativeBox) nativeBox.style.setProperty('display', 'flex', 'important');
            nativeInput.value = url;
            nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            setTimeout(function() {
              nativeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
              nativeInput.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', bubbles: true }));
              if (nativeBox) nativeBox.style.setProperty('display', 'none', 'important');
              var attempts = 0;
              var poll = setInterval(function() {
                attempts++;
                var skinsNow = [];
                try { skinsNow = JSON.parse(localStorage.getItem('custom-skin-urls') || '[]'); } catch(e) {}
                var newUrls = skinsNow.filter(function(u) { return skinsBefore.indexOf(u) === -1; });
                if (newUrls.length > 0 || attempts >= 20) {
                  clearInterval(poll);
                  if (newUrls.length === 0) return;
                  var currentGrid = document.getElementById('ryu-csm-grid');
                  if (!currentGrid) return;
                  newUrls.forEach(function(newUrl) {
                    var alreadyInGrid = false;
                    currentGrid.querySelectorAll('.ryu-csm-card img').forEach(function(img) {
                      if (img.src === newUrl) alreadyInGrid = true;
                    });
                    if (alreadyInGrid) return;
                    var newCard = buildCard(newUrl);
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'scale(0.8)';
                    newCard.style.transition = 'opacity 200ms ease, transform 200ms ease';
                    currentGrid.appendChild(newCard);
                    requestAnimationFrame(function() {
                      requestAnimationFrame(function() {
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'scale(1)';
                      });
                    });
                    var countEl = document.getElementById('ryu-csm-skin-count');
                    if (countEl) countEl.textContent = currentGrid.querySelectorAll('.ryu-csm-card').length + ' SKINS';
                    var secAllCount = document.querySelector('#ryu-csm-sec-all .ryu-csm-sb-count');
                    if (secAllCount) secAllCount.textContent = skinsNow.length;
                    showCsmToast('SKIN ADDED', 'sel');
                  });
                }
              }, 100);
            }, 150);
          }, 150);
        }
        urlAdd.addEventListener('click', doAddUrl);
        urlIn.addEventListener('keydown', function(e) { if (e.key === 'Enter') doAddUrl(); });
      }
    }

    buildUI();

    // backup modal
    var _backupModalDismissed = false;
    try { _backupModalDismissed = localStorage.getItem('ryuCsmBackupDismissed') === '1'; } catch(e) {}
    if (!window._csmBackupShown && !_backupModalDismissed) {
      window._csmBackupShown = true;
      var modal = document.createElement('div');
      modal.id = 'ryu-csm-backup-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML = [
        '<div style="background:#0d1117;border:1px solid rgba(34,211,238,0.25);border-radius:12px;padding:32px 28px;max-width:340px;width:90%;text-align:center;position:relative;">',
          '<button id="ryu-csm-backup-x" style="position:absolute;top:12px;right:14px;background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:16px;cursor:pointer;line-height:1;padding:0;font-family:sans-serif;">✕</button>',
          '<div style="color:#22d3ee;font-family:sans-serif;font-size:11px;letter-spacing:1px;font-weight:700;margin-bottom:12px;">SKIN BACKUP</div>',
          '<div style="color:rgba(255,255,255,0.75);font-family:sans-serif;font-size:13px;line-height:1.6;margin-bottom:20px;">It is recommended to back up your skins as a precaution.<br><br>You can also click <strong style="color:#22d3ee;">BACKUP SKINS</strong> in the sidebar at any time.</div>',
          '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;">',
            '<button id="ryu-csm-backup-yes" style="background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.35);color:#22d3ee;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;padding:10px 28px;border-radius:6px;cursor:pointer;">YES</button>',
          '</div>',
          '<div style="display:flex;justify-content:center;">',
            '<label id="ryu-csm-dna-label" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none;">',
              '<input type="checkbox" id="ryu-csm-backup-dna" style="width:14px;height:14px;accent-color:#22d3ee;cursor:pointer;">',
              '<span style="color:rgba(255,255,255,0.35);font-family:sans-serif;font-size:11px;letter-spacing:0.5px;">Do not show again</span>',
            '</label>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(modal);
      function closeModal() {
        var dna = document.getElementById('ryu-csm-backup-dna');
        if (dna && dna.checked) {
          try { localStorage.setItem('ryuCsmBackupDismissed', '1'); } catch(e) {}
        }
        if (modal.parentNode) modal.remove();
      }
      document.getElementById('ryu-csm-backup-x').addEventListener('click', closeModal);
      document.getElementById('ryu-csm-backup-yes').addEventListener('click', function() {
        var urls = getSkinUrls();
        var content = 'RyuTheme Skin Backup\n' + new Date().toLocaleString() + '\nSkin Count: ' + urls.length + '\n\n' + urls.join('\n');
        var blob = new Blob([content], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ryutheme-skins-backup.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        closeModal();
      });
    }

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var w = document.getElementById(CSM_INJECTED_ID);
        if (w) w.classList.add('ryu-csm-visible');
      });
    });
  }

  // Toast helper
  var _csmToastTimer = null;
  function showCsmToast(msg, type) {
    var existing = document.getElementById('ryu-csm-toast');
    if (existing) existing.remove();
    if (_csmToastTimer) clearTimeout(_csmToastTimer);
    injectCSMStyle();
    var toast = document.createElement('div');
    toast.id = 'ryu-csm-toast';
    toast.className = 'ryu-csm-toast' + (type ? ' ' + type : '');
    toast.innerHTML = '<div class="ryu-csm-toast-dot"></div>' + msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('show'); });
    });
    _csmToastTimer = setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 220);
    }, 1800);
  }
  globalThis.__ryuShowToast = showCsmToast;

  // SHOP MENU
  var SHOP_STYLE_ID    = 'ryu-shop-style';
  var SHOP_INJECTED_ID = 'ryu-shop-injected';
  var _shopMenuOpen    = false;

  function injectShopStyle() {
    if (document.getElementById(SHOP_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = SHOP_STYLE_ID;
    s.textContent = `
      /* ── Hide native shop content permanently ── */
      #shop-menu .layer__title,
      #shop-menu .shop-wallet,
      #shop-menu .shop-container,
      #shop-menu .layer__bottom-btns,
      #shop-menu .shop-wallet *,
      #shop-menu .shop-container * {
        display: none !important;
        visibility: hidden !important;
      }

      /* ── Make layer transparent ── */
      #shop-menu {
        background: transparent !important;
        pointer-events: none !important;
      }
      #shop-menu:has(#ryu-shop-injected) {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* ── Our injected UI is always visible on top ── */
      #ryu-shop-injected {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.97) !important;
        width: 1595px;
        height: 1015px;
        max-width: 92vw;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        font-family: 'Noto Sans', sans-serif;
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.2);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.9);
        overflow: hidden;
        flex-shrink: 0;
        opacity: 1;
        pointer-events: all;
        visibility: visible !important;
        transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      #ryu-shop-injected.ryu-shop-visible {
        transform: translate(-50%, -50%) scale(1) !important;
      }
      #ryu-shop-injected.ryu-shop-closing {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.97) !important;
        transition: opacity 140ms ease-in, transform 140ms ease-in;
      }

      /* ── Header ── */
      #ryu-shop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        height: 52px;
        background: #111820;
        border-bottom: 1px solid rgba(34,211,238,0.12);
        flex-shrink: 0;
      }
      #ryu-shop-header-left {
        display: flex;
        align-items: center;
        gap: 24px;
      }
      #ryu-shop-title {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 5px;
        color: #fff;
      }
      .ryu-shop-tab {
        padding: 5px 14px;
        color: rgba(255,255,255,0.3);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.15s;
        background: transparent;
        border: none;
        font-family: 'Noto Sans', sans-serif;
        text-transform: uppercase;
      }
      .ryu-shop-tab.ryu-shop-tab-active {
        background: rgba(34,211,238,0.12);
        color: #22d3ee;
      }
      .ryu-shop-tab:hover:not(.ryu-shop-tab-active) {
        color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.04);
      }
      #ryu-shop-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .ryu-shop-wallet {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .ryu-shop-wallet-rp {
        background: rgba(245,158,11,0.06);
        border: 1px solid rgba(245,158,11,0.25);
        color: rgba(255,255,255,0.7);
      }
      .ryu-shop-wallet-rp .ryu-shop-wallet-icon {
        font-size: 13px;
        font-weight: 900;
        color: #f59e0b;
        line-height: 1;
      }
      .ryu-shop-wallet-rc {
        background: rgba(34,211,238,0.06);
        border: 1px solid rgba(34,211,238,0.2);
        color: rgba(255,255,255,0.7);
      }
      .ryu-shop-wallet-rc .ryu-shop-wallet-icon {
        display: flex;
        align-items: center;
      }
      #ryu-shop-back-btn {
        padding: 5px 14px;
        border: 1px solid rgba(255,255,255,0.08);
        background: transparent;
        color: rgba(255,255,255,0.3);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 2px;
        cursor: pointer;
        font-family: 'Noto Sans', sans-serif;
        transition: all 0.15s;
      }
      #ryu-shop-back-btn:hover {
        border-color: rgba(34,211,238,0.3);
        color: rgba(255,255,255,0.7);
      }

      /* ── Grid ── */
      #ryu-shop-grid {
        flex: 1;
        overflow-y: auto;
        padding: 20px 28px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        align-content: start;
      }
      #ryu-shop-grid::-webkit-scrollbar { width: 3px; }
      #ryu-shop-grid::-webkit-scrollbar-track { background: transparent; }
      #ryu-shop-grid::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 2px; }

      /* ── Item card ── */
      .ryu-shop-card {
        background: #131a22;
        border: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .ryu-shop-card:hover {
        border-color: rgba(34,211,238,0.3);
        box-shadow: 0 0 12px rgba(34,211,238,0.06);
      }
      .ryu-shop-card.ryu-shop-card-equipped {
        border-color: rgba(34,211,238,0.45);
      }
      .ryu-shop-card-preview {
        height: 180px;
        background: #0d1117;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        flex-shrink: 0;
      }
      .ryu-shop-card-equipped-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: #22d3ee;
        color: #000;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1px;
        padding: 2px 6px;
      }
      .ryu-shop-card-info {
        padding: 10px 12px;
      }
      .ryu-shop-card-name {
        font-size: 13px;
        font-weight: 700;
        color: rgba(255,255,255,0.7);
        letter-spacing: 0.5px;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ryu-shop-card.ryu-shop-card-equipped .ryu-shop-card-name {
        color: #fff;
      }
      .ryu-shop-card-price {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .ryu-shop-price-symbol {
        font-size: 14px;
        font-weight: 900;
        color: #f59e0b;
        line-height: 1;
      }
      .ryu-shop-price-value {
        font-size: 13px;
        color: #f59e0b;
        font-weight: 700;
      }
      .ryu-shop-price-free {
        background: rgba(34,211,238,0.1);
        padding: 2px 8px;
        display: inline-block;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
        color: #22d3ee;
      }

      /* ── Footer ── */
      #ryu-shop-footer {
        height: 32px;
        background: #0a0d12;
        border-top: 1px solid rgba(34,211,238,0.08);
        display: flex;
        align-items: center;
        padding: 0 28px;
        flex-shrink: 0;
      }
      #ryu-shop-item-count {
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 2px;
        color: rgba(255,255,255,0.2);
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function closeShopWrapper(triggerNative) {
    var ow = document.getElementById(SHOP_INJECTED_ID);
    if (!ow) return;
    ow.classList.remove('ryu-shop-visible');
    ow.classList.add('ryu-shop-closing');
    if (triggerNative) {
      var nativeBack = document.getElementById('shop-back');
      if (nativeBack) nativeBack.click();
    }
    setTimeout(function() {
      var el = document.getElementById(SHOP_INJECTED_ID);
      if (el) el.remove();
      // Restore our menu panel
      var menuPanel = document.getElementById('ryu-menu-ui');
      var menuBackdrop = document.getElementById('ryu-menu-backdrop');
      if (menuPanel) menuPanel.style.removeProperty('display');
      if (menuBackdrop) menuBackdrop.style.removeProperty('display');
    }, 155);
  }

  function injectShopRedesign() {
    if (document.getElementById(SHOP_INJECTED_ID)) return;

    injectShopStyle();

    var shopEl = document.getElementById('shop-menu');
    if (!shopEl) return;

    // Read wallet balances from native DOM
    function getWalletRP() {
      var el = document.getElementById('shop-wallet-rp');
      return el ? el.textContent.trim() : '0';
    }
    function getWalletRC() {
      var el = document.getElementById('shop-wallet-rc');
      return el ? el.textContent.trim() : '0';
    }

    // Read items from native DOM
    function getShopItems() {
      var items = [];
      document.querySelectorAll('.shop-item').forEach(function(item) {
        var previewEl = item.querySelector('.shop-item-preview');
        var nameEl    = item.querySelector('.shop-item-name');
        var buyEl     = item.querySelector('.shop-item-buy');
        if (!previewEl || !nameEl) return;
        var bg        = previewEl.style.backgroundImage || '';
        var url       = bg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
        var name      = nameEl.textContent.trim();
        var priceText = buyEl ? buyEl.textContent.trim() : '';
        var priceNum  = priceText.replace(/[^0-9]/g, '');
        var isFree    = priceText.toUpperCase().indexOf('FREE') !== -1;
        items.push({ url: url, name: name, price: priceNum, isFree: isFree, nativeEl: item });
      });
      return items;
    }

    var _shopActiveTab = 'SHIELD';

    var wrapper = document.createElement('div');
    wrapper.id = SHOP_INJECTED_ID;

    function buildShopUI() {
      var rp    = getWalletRP();
      var rc    = getWalletRC();
      var items = getShopItems();
      var visibleItems = items.filter(function(it) {
        return it.nativeEl.style.display !== 'none';
      });

      wrapper.innerHTML =
        '<div id="ryu-shop-header">' +
          '<div id="ryu-shop-header-left">' +
            '<div id="ryu-shop-title">SHOP</div>' +
            '<div id="ryu-shop-tabs">' +
              ['SHIELD','TITLE','MISC'].map(function(cat) {
                return '<button class="ryu-shop-tab' + (cat === _shopActiveTab ? ' ryu-shop-tab-active' : '') + '" data-cat="' + cat + '">' + cat + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div id="ryu-shop-header-right">' +
            '<div class="ryu-shop-wallet ryu-shop-wallet-rp"><span class="ryu-shop-wallet-icon">$</span>' + rp + ' RP</div>' +
            '<div class="ryu-shop-wallet ryu-shop-wallet-rc">' +
              '<span class="ryu-shop-wallet-icon">' +
                '<svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                  '<rect x="0.5" y="0.5" width="12" height="8" rx="1" stroke="#22d3ee" stroke-width="0.8"/>' +
                  '<rect x="2" y="2" width="9" height="5" rx="0.5" stroke="rgba(34,211,238,0.4)" stroke-width="0.6"/>' +
                  '<circle cx="6.5" cy="4.5" r="1.2" stroke="#22d3ee" stroke-width="0.7"/>' +
                '</svg>' +
              '</span>' +
              rc + ' RC' +
            '</div>' +
            '<button id="ryu-shop-back-btn">← BACK [ESC]</button>' +
          '</div>' +
        '</div>' +
        '<div id="ryu-shop-grid">' +
          visibleItems.map(function(item) {
            var isEquipped = false; // native doesn't expose equipped state easily — skip for now
            return '<div class="ryu-shop-card' + (isEquipped ? ' ryu-shop-card-equipped' : '') + '">' +
              '<div class="ryu-shop-card-preview"' + (item.url ? ' style="background-image:url(\'' + item.url + '\')"' : '') + '>' +
                (isEquipped ? '<div class="ryu-shop-card-equipped-badge">EQUIPPED</div>' : '') +
              '</div>' +
              '<div class="ryu-shop-card-info">' +
                '<div class="ryu-shop-card-name">' + item.name + '</div>' +
                '<div class="ryu-shop-card-price">' +
                  (item.isFree
                    ? '<span class="ryu-shop-price-free">FREE</span>'
                    : '<span class="ryu-shop-price-symbol">$</span><span class="ryu-shop-price-value">' + Number(item.price).toLocaleString() + '</span>'
                  ) +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div id="ryu-shop-footer"><span id="ryu-shop-item-count">' + visibleItems.length + ' ITEMS</span></div>';

      document.body.appendChild(wrapper);
      // Make visible immediately
      wrapper.classList.add('ryu-shop-visible');
      wireShopUI();
    }

    function wireShopUI() {
      // Tab switching
      wrapper.querySelectorAll('.ryu-shop-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          _shopActiveTab = tab.getAttribute('data-cat');
          // Click native tab to filter items
          document.querySelectorAll('.shop-nb-item').forEach(function(nTab) {
            if (nTab.textContent.trim().toUpperCase() === _shopActiveTab) nTab.click();
          });
          // Rebuild after native updates display
          setTimeout(function() {
            wrapper.remove();
            buildShopUI();
          }, 80);
        });
      });

      // Item click — show confirmation then delegate to native buy button
      wrapper.querySelectorAll('.ryu-shop-card').forEach(function(card, idx) {
        card.addEventListener('click', function() {
          var items = getShopItems();
          var visibleItems = items.filter(function(it) { return it.nativeEl.style.display !== 'none'; });
          var nativeItem = visibleItems[idx];
          if (!nativeItem || !nativeItem.nativeEl) return;

          // Build confirmation overlay
          var existing = document.getElementById('ryu-shop-confirm');
          if (existing) existing.remove();

          var overlay = document.createElement('div');
          overlay.id = 'ryu-shop-confirm';
          overlay.style.cssText = 'position:absolute;inset:0;background:rgba(9,13,18,0.85);display:flex;align-items:center;justify-content:center;z-index:10;';

          var box = document.createElement('div');
          box.style.cssText = 'background:#111820;border:1px solid rgba(34,211,238,0.25);padding:28px 36px;display:flex;flex-direction:column;align-items:center;gap:16px;min-width:280px;';

          var itemName = nativeItem.name;
          var itemPrice = nativeItem.isFree ? 'FREE' : ('$ ' + Number(nativeItem.price).toLocaleString());

          box.innerHTML =
            '<div style="font-size:9px;font-weight:900;letter-spacing:4px;color:rgba(255,255,255,0.4);font-family:\'Noto Sans\',sans-serif;">CONFIRM PURCHASE</div>' +
            '<div style="font-size:14px;font-weight:700;color:#fff;font-family:\'Noto Sans\',sans-serif;text-align:center;">' + itemName + '</div>' +
            '<div style="font-size:11px;font-weight:700;color:#f59e0b;font-family:\'Noto Sans\',sans-serif;letter-spacing:1px;">' + itemPrice + '</div>' +
            '<div style="display:flex;gap:10px;margin-top:4px;">' +
              '<button id="ryu-shop-confirm-yes" style="padding:8px 28px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.4);color:#22d3ee;font-size:9px;font-weight:800;letter-spacing:2px;cursor:pointer;font-family:\'Noto Sans\',sans-serif;">YES</button>' +
              '<button id="ryu-shop-confirm-no" style="padding:8px 28px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);font-size:9px;font-weight:800;letter-spacing:2px;cursor:pointer;font-family:\'Noto Sans\',sans-serif;">NO</button>' +
            '</div>';

          overlay.appendChild(box);
          wrapper.appendChild(overlay);

          document.getElementById('ryu-shop-confirm-yes').addEventListener('click', function() {
            overlay.remove();
            var buyBtn = nativeItem.nativeEl.querySelector('.shop-item-buy');
            if (buyBtn) buyBtn.click();
          });
          document.getElementById('ryu-shop-confirm-no').addEventListener('click', function() {
            overlay.remove();
          });
        });
      });

      // Back button
      var backBtn = document.getElementById('ryu-shop-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          closeShopWrapper(true);
        });
      }

      // ESC key — fire our close immediately for instant animation, don't block game
      function onShopEsc(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', onShopEsc, true);
          closeShopWrapper(false);
        }
      }
      document.addEventListener('keydown', onShopEsc, true);
    }

    // Watch for native menu close
    var shopObserver = new MutationObserver(function() {
      var cs = window.getComputedStyle(shopEl);
      if (_shopMenuOpen && cs.display === 'none') {
        _shopMenuOpen = false;
        closeShopWrapper();
      }
    });
    shopObserver.observe(shopEl, { attributes: true, attributeFilter: ['style'] });
    _shopMenuOpen = true;

    buildShopUI();
  }

  // INVENTORY MENU
  var INV_STYLE_ID    = 'ryu-inv-style';
  var INV_INJECTED_ID = 'ryu-inv-injected';
  var _invMenuOpen    = false;

  function injectInventoryStyle() {
    if (document.getElementById(INV_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = INV_STYLE_ID;
    s.textContent = `
      #inventory-menu .layer__title,
      #inventory-menu .inventory-container,
      #inventory-menu .layer__bottom-btns {
        visibility: hidden !important;
        pointer-events: none !important;
      }
      #inventory-menu {
        background: transparent !important;
        pointer-events: none !important;
      }
      #ryu-inv-injected {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.97) !important;
        width: 1595px;
        height: 1015px;
        max-width: 92vw;
        max-height: 92vh;
        display: flex;
        flex-direction: column;
        font-family: 'Noto Sans', sans-serif;
        background: #0d1117;
        border: 1px solid rgba(34,211,238,0.2);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.9);
        overflow: hidden;
        flex-shrink: 0;
        opacity: 1;
        pointer-events: all;
        visibility: visible !important;
        transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 99999;
      }
      #ryu-inv-injected.ryu-inv-visible {
        transform: translate(-50%, -50%) scale(1) !important;
      }
      #ryu-inv-injected.ryu-inv-closing {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.97) !important;
        transition: opacity 140ms ease-in, transform 140ms ease-in;
      }
      #ryu-inv-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        height: 52px;
        background: #111820;
        border-bottom: 1px solid rgba(34,211,238,0.12);
        flex-shrink: 0;
      }
      #ryu-inv-header-left {
        display: flex;
        align-items: center;
        gap: 24px;
      }
      #ryu-inv-title {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 5px;
        color: #fff;
      }
      .ryu-inv-tab {
        padding: 5px 14px;
        color: rgba(255,255,255,0.3);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.15s;
        background: transparent;
        border: none;
        font-family: 'Noto Sans', sans-serif;
        text-transform: uppercase;
      }
      .ryu-inv-tab.ryu-inv-tab-active {
        background: rgba(34,211,238,0.12);
        color: #22d3ee;
      }
      .ryu-inv-tab:hover:not(.ryu-inv-tab-active) {
        color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.04);
      }
      #ryu-inv-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      #ryu-inv-count {
        background: rgba(34,211,238,0.06);
        border: 1px solid rgba(34,211,238,0.15);
        padding: 5px 12px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        color: rgba(255,255,255,0.5);
        font-family: 'Noto Sans', sans-serif;
      }
      #ryu-inv-back-btn {
        padding: 5px 14px;
        border: 1px solid rgba(255,255,255,0.08);
        background: transparent;
        color: rgba(255,255,255,0.3);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 2px;
        cursor: pointer;
        font-family: 'Noto Sans', sans-serif;
        transition: all 0.15s;
      }
      #ryu-inv-back-btn:hover {
        border-color: rgba(34,211,238,0.3);
        color: rgba(255,255,255,0.7);
      }
      #ryu-inv-grid {
        flex: 1;
        overflow-y: auto;
        padding: 20px 28px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        align-content: start;
      }
      #ryu-inv-grid::-webkit-scrollbar { width: 3px; }
      #ryu-inv-grid::-webkit-scrollbar-track { background: transparent; }
      #ryu-inv-grid::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 2px; }
      .ryu-inv-card {
        background: #131a22;
        border: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .ryu-inv-card:hover {
        border-color: rgba(34,211,238,0.3);
        box-shadow: 0 0 12px rgba(34,211,238,0.06);
      }
      .ryu-inv-card.ryu-inv-card-equipped {
        border-color: rgba(34,211,238,0.45);
      }
      .ryu-inv-card-preview {
        height: 180px;
        background: #0d1117;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        flex-shrink: 0;
      }
      .ryu-inv-card-equipped-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: #22d3ee;
        color: #000;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 1px;
        padding: 2px 6px;
      }
      .ryu-inv-card-info {
        padding: 10px 12px;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
      .ryu-inv-card-name {
        font-size: 13px;
        font-weight: 700;
        color: rgba(255,255,255,0.7);
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ryu-inv-card.ryu-inv-card-equipped .ryu-inv-card-name {
        color: #fff;
      }
      #ryu-inv-footer {
        height: 32px;
        background: #0a0d12;
        border-top: 1px solid rgba(34,211,238,0.08);
        display: flex;
        align-items: center;
        padding: 0 28px;
        flex-shrink: 0;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 2px;
        color: rgba(255,255,255,0.2);
        font-family: 'Noto Sans', sans-serif;
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  function closeInventoryWrapper() {
    var ow = document.getElementById(INV_INJECTED_ID);
    if (!ow) return;
    ow.classList.remove('ryu-inv-visible');
    ow.classList.add('ryu-inv-closing');
    var nativeBack = document.getElementById('inventory-back');
    if (nativeBack) nativeBack.click();
    setTimeout(function() {
      var el = document.getElementById(INV_INJECTED_ID);
      if (el) el.remove();
      var menuPanel = document.getElementById('ryu-menu-ui');
      var menuBackdrop = document.getElementById('ryu-menu-backdrop');
      if (menuPanel) menuPanel.style.removeProperty('display');
      if (menuBackdrop) menuBackdrop.style.removeProperty('display');
    }, 155);
  }

  function injectInventoryRedesign() {
    if (document.getElementById(INV_INJECTED_ID)) return;

    injectInventoryStyle();

    var invEl = document.getElementById('inventory-menu');
    if (!invEl) return;

    var _invActiveTab = 'SHIELD';

    function getInventoryItems() {
      var items = [];
      document.querySelectorAll('.inventory-item').forEach(function(item) {
        var previewEl = item.querySelector('.inventory-item-preview');
        var nameEl    = item.querySelector('.inventory-item-name');
        if (!previewEl || !nameEl) return;
        var bg  = previewEl.style.backgroundImage || '';
        var url = bg.replace(/url\(["']?/, '').replace(/["']?\)$/, '');
        var name = nameEl.textContent.trim();
        var isEquipped = item.classList.contains('inventory-item-active');
        items.push({ url: url, name: name, isEquipped: isEquipped, nativeEl: item });
      });
      return items;
    }

    function getVisibleItems() {
      return getInventoryItems().filter(function(it) {
        return it.nativeEl.style.display !== 'none';
      });
    }

    var wrapper = document.createElement('div');
    wrapper.id = INV_INJECTED_ID;

    function buildInvUI() {
      var visibleItems = getVisibleItems();

      wrapper.innerHTML =
        '<div id="ryu-inv-header">' +
          '<div id="ryu-inv-header-left">' +
            '<div id="ryu-inv-title">INVENTORY</div>' +
            '<div id="ryu-inv-tabs">' +
              ['SHIELD','TITLE','MISC'].map(function(cat) {
                return '<button class="ryu-inv-tab' + (cat === _invActiveTab ? ' ryu-inv-tab-active' : '') + '" data-cat="' + cat + '">' + cat + '</button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div id="ryu-inv-header-right">' +
            '<div id="ryu-inv-count">' + visibleItems.length + ' ITEMS</div>' +
            '<button id="ryu-inv-back-btn">← BACK [ESC]</button>' +
          '</div>' +
        '</div>' +
        '<div id="ryu-inv-grid">' +
          visibleItems.map(function(item) {
            return '<div class="ryu-inv-card' + (item.isEquipped ? ' ryu-inv-card-equipped' : '') + '">' +
              '<div class="ryu-inv-card-preview"' + (item.url ? ' style="background-image:url(\'' + item.url + '\')"' : '') + '>' +
                (item.isEquipped ? '<div class="ryu-inv-card-equipped-badge">EQUIPPED</div>' : '') +
              '</div>' +
              '<div class="ryu-inv-card-info">' +
                '<div class="ryu-inv-card-name">' + item.name + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div id="ryu-inv-footer">' + visibleItems.length + ' ITEMS OWNED</div>';

      document.body.appendChild(wrapper);
      wrapper.classList.add('ryu-inv-visible');
      wireInvUI();
    }

    function wireInvUI() {
      // Tab switching
      wrapper.querySelectorAll('.ryu-inv-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          _invActiveTab = tab.getAttribute('data-cat');
          document.querySelectorAll('.inventory-nb-item').forEach(function(nTab) {
            if (nTab.textContent.trim().toUpperCase() === _invActiveTab) nTab.click();
          });
          setTimeout(function() {
            var visibleItems = getVisibleItems();
            // Update tabs
            wrapper.querySelectorAll('.ryu-inv-tab').forEach(function(t) {
              t.classList.toggle('ryu-inv-tab-active', t.getAttribute('data-cat') === _invActiveTab);
            });
            // Update count
            var countEl = document.getElementById('ryu-inv-count');
            if (countEl) countEl.textContent = visibleItems.length + ' ITEMS';
            var footerEl = document.getElementById('ryu-inv-footer');
            if (footerEl) footerEl.textContent = visibleItems.length + ' ITEMS OWNED';
            // Rebuild grid only
            var grid = document.getElementById('ryu-inv-grid');
            if (grid) {
              grid.innerHTML = visibleItems.map(function(item) {
                return '<div class="ryu-inv-card' + (item.isEquipped ? ' ryu-inv-card-equipped' : '') + '">' +
                  '<div class="ryu-inv-card-preview"' + (item.url ? ' style="background-image:url(\'' + item.url + '\')"' : '') + '>' +
                    (item.isEquipped ? '<div class="ryu-inv-card-equipped-badge">EQUIPPED</div>' : '') +
                  '</div>' +
                  '<div class="ryu-inv-card-info">' +
                    '<div class="ryu-inv-card-name">' + item.name + '</div>' +
                  '</div>' +
                '</div>';
              }).join('');
              wireCardClicks();
            }
          }, 80);
        });
      });

      wireCardClicks();

      // Back button
      var backBtn = document.getElementById('ryu-inv-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          closeInventoryWrapper();
        });
      }

      // ESC
      function onInvEsc(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          document.removeEventListener('keydown', onInvEsc, true);
          closeInventoryWrapper();
        }
      }
      document.addEventListener('keydown', onInvEsc, true);
    }

    // hide native rename box via CSS — we use our own modal
    if (!document.getElementById('ryu-inv-rename-suppress')) {
      var suppressStyle = document.createElement('style');
      suppressStyle.id = 'ryu-inv-rename-suppress';
      suppressStyle.textContent = '#inventory-rename-box { display: none !important; }';
      (document.head || document.documentElement).appendChild(suppressStyle);
    }
    var renameBoxObserver = { disconnect: function() {}, observe: function() {} }; // no-op, CSS handles it

    function showRenameModal(onConfirm) {
      var existing = document.getElementById('ryu-rename-modal');
      if (existing) existing.remove();

      var overlay = document.createElement('div');
      overlay.id = 'ryu-rename-modal';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';

      overlay.innerHTML =
        '<div style="background:#0d1117;border:1px solid rgba(34,211,238,0.25);border-radius:10px;padding:28px 28px 22px;width:340px;box-shadow:0 0 40px rgba(34,211,238,0.08);">' +
          '<div style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:rgba(34,211,238,0.6);text-transform:uppercase;margin-bottom:16px;font-family:inherit;">Enter New Username</div>' +
          '<input id="ryu-rename-input" placeholder="username" autocomplete="off" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:10px 12px;color:#fff;font-size:14px;outline:none;margin-bottom:16px;">' +
          '<div style="display:flex;gap:8px;">' +
            '<button id="ryu-rename-cancel" style="flex:1;padding:9px;background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;cursor:pointer;letter-spacing:1px;">CANCEL</button>' +
            '<button id="ryu-rename-confirm" style="flex:1;padding:9px;background:#22d3ee;border:none;border-radius:6px;color:#000;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:1px;">CONFIRM</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      var inp = document.getElementById('ryu-rename-input');
      var confirmBtn = document.getElementById('ryu-rename-confirm');
      var cancelBtn  = document.getElementById('ryu-rename-cancel');

      inp.focus();

      function close() {
        renameBoxObserver.disconnect();
        overlay.remove();
        // restart observer for future clicks
        renameBoxObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
      }

      function confirm() {
        var val = inp.value.trim();
        if (!val) return;
        close();
        onConfirm(val);
      }

      confirmBtn.addEventListener('click', confirm);
      cancelBtn.addEventListener('click', close);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') confirm();
        if (e.key === 'Escape') close();
      });
    }

    function submitRename(value) {
      // click native item to open native box (which we suppress visually)
      var nativeInp = document.getElementById('inventory-rename-input');
      if (!nativeInp) return;
      nativeInp.focus();
      nativeInp.value = value;
      nativeInp.dispatchEvent(new Event('input', { bubbles: true }));
      // fire keydown Enter — this is what the game listens for
      nativeInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }

    function wireCardClicks() {
      wrapper.querySelectorAll('.ryu-inv-card').forEach(function(card, idx) {
        card.addEventListener('click', function() {
          var visibleItems = getVisibleItems();
          var item = visibleItems[idx];
          if (!item || !item.nativeEl) return;

          // rename card — intercept and show our modal instead
          if (item.name.toLowerCase().includes('rename')) {
            item.nativeEl.click(); // opens native box (suppressed) to get native input into DOM
            setTimeout(function() {
              showRenameModal(function(newName) {
                submitRename(newName);
              });
            }, 100);
            return;
          }

          item.nativeEl.click();
          // Update equipped badge
          setTimeout(function() {
            var updatedItems = getVisibleItems();
            wrapper.querySelectorAll('.ryu-inv-card').forEach(function(c, i) {
              var it = updatedItems[i];
              if (!it) return;
              c.classList.toggle('ryu-inv-card-equipped', it.isEquipped);
              var badge = c.querySelector('.ryu-inv-card-equipped-badge');
              if (it.isEquipped && !badge) {
                var preview = c.querySelector('.ryu-inv-card-preview');
                if (preview) {
                  var b = document.createElement('div');
                  b.className = 'ryu-inv-card-equipped-badge';
                  b.textContent = 'EQUIPPED';
                  preview.appendChild(b);
                }
              } else if (!it.isEquipped && badge) {
                badge.remove();
              }
            });
          }, 150);
        });
      });
    }

    // Watch for native menu close
    var invObserver = new MutationObserver(function() {
      var cs = window.getComputedStyle(invEl);
      if (_invMenuOpen && cs.display === 'none') {
        _invMenuOpen = false;
        closeInventoryWrapper();
      }
    });
    invObserver.observe(invEl, { attributes: true, attributeFilter: ['style'] });
    _invMenuOpen = true;

    buildInvUI();
  }

  // REPLAYS / GALLERY MENU — handled by replaysys.js
  // these stubs delegate to globals exposed by replaysys.js
  function injectReplaysStyle() {
    if (globalThis.injectReplaysStyle) globalThis.injectReplaysStyle();
  }
  function injectReplaysRedesign() {
    if (globalThis.injectReplaysRedesign) globalThis.injectReplaysRedesign();
  }

  // Custom Settings Panel
  var RYU_SP_ID = 'ryu-settings-panel';

  function injectSettingsPanelStyle() {
    if (document.getElementById('ryu-sp-style')) return;
    var s = document.createElement('style');
    s.id = 'ryu-sp-style';
    s.textContent = [
      '#ryu-settings-panel{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.18s ease;}',
      '#ryu-settings-panel.ryu-sp-open{opacity:1;pointer-events:all;}',
      '#ryu-sp-box{width:1100px;max-width:97vw;height:780px;max-height:94vh;background:rgba(13,17,23,0.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:1px solid rgba(34,211,238,0.18);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:scale(0.96) translateY(10px);transition:opacity 160ms cubic-bezier(0.16,1,0.3,1),transform 160ms cubic-bezier(0.16,1,0.3,1);}',
      '#ryu-settings-panel.ryu-sp-open #ryu-sp-box{opacity:1;transform:scale(1) translateY(0);}',
      '#ryu-settings-panel.ryu-sp-closing #ryu-sp-box{opacity:0;transform:scale(0.97) translateY(6px);transition:opacity 200ms ease-in,transform 200ms ease-in;}',
      '#ryu-settings-panel.ryu-sp-theme-mode{align-items:stretch;justify-content:flex-start;}',
      '#ryu-settings-panel.ryu-sp-theme-mode #ryu-sp-box{width:960px;max-width:68vw;height:100vh;max-height:100vh;border-radius:0;border:none;border-right:1px solid rgba(34,211,238,0.2);transform:translateX(-20px);}',
      '#ryu-settings-panel.ryu-sp-theme-mode.ryu-sp-open #ryu-sp-box{transform:translateX(0);}',
      '#ryu-sp-topbar{background:#0d1117;border-bottom:1px solid rgba(34,211,238,0.12);display:flex;align-items:center;height:56px;flex-shrink:0;padding:0 0 0 0;overflow:hidden;}',
      '#ryu-sp-topbar-tabs{display:flex;align-items:center;flex:1;min-width:0;overflow:hidden;}',
      '#ryu-sp-topbar-right{display:flex;align-items:center;flex-shrink:0;gap:4px;padding-right:8px;}',
      '#ryu-sp-logo{font-family:"Noto Sans",sans-serif;font-size:12px;font-weight:800;letter-spacing:4px;color:rgba(34,211,238,0.5);padding:0 14px;flex-shrink:0;}',
      '.ryu-sp-tab{height:100%;padding:0 14px;font-family:"Noto Sans",sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);border:none;border-bottom:2px solid transparent;background:transparent;cursor:pointer;outline:none;transition:all 0.12s;white-space:nowrap;flex-shrink:0;}',
      '.ryu-sp-tab:hover{color:rgba(255,255,255,0.65);}',
      '.ryu-sp-tab.ryu-sp-tab-active{color:#22d3ee;border-bottom-color:#22d3ee;}',
      '#ryu-sp-preview-btn{display:none;flex-shrink:0;}',
      '#ryu-settings-panel.ryu-sp-theme-mode #ryu-sp-preview-btn{display:flex;}',
      '#ryu-sp-close{flex-shrink:0;width:34px;height:34px;background:transparent;border:1px solid rgba(34,211,238,0.2);border-radius:6px;color:rgba(34,211,238,0.5);font-size:16px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;transition:all 0.12s;margin-left:6px;margin-right:8px;}',
      '#ryu-sp-close:hover{border-color:rgba(34,211,238,0.6);color:#22d3ee;}',
      '#ryu-sp-body{display:flex;flex:1;overflow:hidden;}',
      '#ryu-sp-sidebar{width:200px;flex-shrink:0;background:#090d12;border-right:1px solid rgba(255,255,255,0.05);overflow-y:auto;padding:12px 0;}',
      '#ryu-sp-sidebar::-webkit-scrollbar{width:3px;}',
      '#ryu-sp-sidebar::-webkit-scrollbar-thumb{background:rgba(34,211,238,0.15);border-radius:2px;}',
      '.ryu-sp-sec-group-title{font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:800;letter-spacing:3px;color:rgba(34,211,238,0.5);padding:14px 16px 8px;text-transform:uppercase;}',
      '.ryu-sp-sec-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-family:"Noto Sans",sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px;color:rgba(255,255,255,0.45);border-left:2px solid transparent;cursor:pointer;transition:all 0.12s;}',
      '.ryu-sp-sec-item:hover{color:rgba(255,255,255,0.65);background:rgba(255,255,255,0.03);}',
      '.ryu-sp-sec-item.ryu-sp-sec-active{color:#22d3ee;border-left-color:#22d3ee;background:rgba(34,211,238,0.05);}',
      '.ryu-sp-sec-arrow{font-size:9px;opacity:0.4;}',
      '#ryu-sp-content{flex:1;overflow-y:auto;padding:22px 28px;display:flex;flex-direction:column;gap:0;}',
      '#ryu-sp-content::-webkit-scrollbar{width:4px;}',
      '#ryu-sp-content::-webkit-scrollbar-thumb{background:rgba(34,211,238,0.15);border-radius:2px;}',
      '.ryu-sp-section-hdr{font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:800;letter-spacing:3px;color:rgba(34,211,238,0.6);padding:18px 0 9px;margin-top:6px;border-bottom:1px solid rgba(34,211,238,0.1);margin-bottom:2px;}',
      '.ryu-sp-section-hdr:first-child{padding-top:0;margin-top:0;}',
      '.ryu-sp-row{display:flex;align-items:center;padding:12px 0;gap:16px;min-height:48px;border-bottom:1px solid rgba(255,255,255,0.04);}',
      '.ryu-sp-label{flex:1;font-family:"Noto Sans",sans-serif;font-size:13px;font-weight:600;letter-spacing:0.5px;color:rgba(255,255,255,0.6);}',
      '.ryu-sp-ctrl{display:flex;align-items:center;gap:8px;flex-shrink:0;}',
      '.ryu-sp-swatch{width:38px;height:26px;border-radius:5px;border:1px solid rgba(255,255,255,0.15);cursor:pointer;flex-shrink:0;position:relative;}',
      '.ryu-sp-track{width:140px;height:4px;background:rgba(34,211,238,0.15);border-radius:2px;position:relative;cursor:pointer;flex-shrink:0;user-select:none;-webkit-user-select:none;}',
      '.ryu-sp-fill{height:100%;background:#22d3ee;border-radius:2px;position:relative;}',
      '.ryu-sp-thumb{width:14px;height:14px;background:#22d3ee;border-radius:50%;position:absolute;right:-7px;top:-5px;box-shadow:0 0 0 3px rgba(34,211,238,0.2);pointer-events:none;}',
      '.ryu-sp-val{font-family:"Noto Sans",sans-serif;font-size:12px;font-weight:700;color:#22d3ee;min-width:30px;text-align:right;}',
      '.ryu-sp-multi{display:flex;}',
      '.ryu-sp-mi{font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:6px 14px;border:1px solid rgba(34,211,238,0.2);color:rgba(255,255,255,0.3);cursor:pointer;transition:all 0.1s;background:transparent;outline:none;}',
      '.ryu-sp-mi:first-child{border-radius:5px 0 0 5px;}',
      '.ryu-sp-mi:last-child{border-radius:0 5px 5px 0;}',
      '.ryu-sp-mi:not(:first-child){border-left:none;}',
      '.ryu-sp-mi.ryu-sp-mi-active{background:rgba(34,211,238,0.15);color:#22d3ee;border-color:rgba(34,211,238,0.5);}',
      '.ryu-sp-toggle{width:42px;height:24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;position:relative;cursor:pointer;flex-shrink:0;transition:all 0.15s;}',
      '.ryu-sp-toggle.ryu-sp-toggle-on{background:rgba(34,211,238,0.2);border-color:rgba(34,211,238,0.5);}',
      '.ryu-sp-toggle-dot{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,0.25);position:absolute;top:3px;left:3px;transition:left 0.15s,background 0.15s;}',
      '.ryu-sp-toggle.ryu-sp-toggle-on .ryu-sp-toggle-dot{left:21px;background:#22d3ee;}',
      '.ryu-sp-input{background:rgba(255,255,255,0.04);border:1px solid rgba(34,211,238,0.2);border-radius:6px;color:rgba(255,255,255,0.7);font-family:"Noto Sans",sans-serif;font-size:12px;padding:6px 12px;width:200px;outline:none;transition:border-color 0.15s;}',
      '.ryu-sp-input:focus{border-color:rgba(34,211,238,0.5);}',
      '.ryu-sp-input::placeholder{color:rgba(255,255,255,0.2);}',
      '.pcr-button{display:none !important;width:0 !important;height:0 !important;overflow:hidden !important;position:absolute !important;pointer-events:none !important;}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  var RYU_SP_TABS = ['GAMEPLAY','GRAPHICS','THEME','CONTROLS','CHAT','HUDS','RYUTHEME'];
  var RYU_SP_TAB_ROWS = { 'GAMEPLAY':[0,20],'GRAPHICS':[21,25],'THEME':[26,50],'CONTROLS':[51,87],'CHAT':[88,97],'HUDS':[98,103] };
  var RYU_SP_SECTIONS = {
    'GAMEPLAY':  ['MOVEMENT','DISPLAY','CAMERA','REPLAY','ANIMATION','MISC'],
    'GRAPHICS':  ['QUALITY'],
    'THEME':     ['WORLD BORDER','ORB','ILL ORB','PARTICLE','BACKGROUND','MULTIBOX','CURSOR LINE'],
    'CONTROLS':  ['PLAYER','CAMERA ZOOM'],
    'CHAT':      ['QUICK CHAT'],
    'HUDS':      ['OVERLAYS'],
    'RYUTHEME':  ['COMMANDER','CURSOR','BORDER','GAMEPLAY TWEAKS','GAME COSMETICS','HOTKEYS','THEMES']
  };
  var RYU_SP_NATIVE_TAB = { 'GAMEPLAY':0,'GRAPHICS':1,'THEME':2,'CONTROLS':3,'CHAT':4,'HUDS':5 };
  var _spCurrentTab = 'GAMEPLAY';
  var _spCurrentSec = null;

  function openRyuSettings(tabName) {
    injectSettingsPanelStyle();
    var existing = document.getElementById(RYU_SP_ID);
    if (existing) existing.remove();
    var nativeBtn = document.getElementById('mame-trb-settings-btn');
    if (nativeBtn) nativeBtn.click();
    _spCurrentTab = tabName || 'GAMEPLAY';
    _spCurrentSec = null;
    var panel = document.createElement('div');
    panel.id = RYU_SP_ID;
    panel.innerHTML = buildSettingsPanelHTML();
    document.body.appendChild(panel);
    wireSettingsPanel(panel);

    // Apply theme mode immediately if opening on THEME or RYUTHEME
    if (_spCurrentTab === 'THEME' || _spCurrentTab === 'RYUTHEME') {
      panel.classList.add('ryu-sp-theme-mode');
    }

    // Watch #settings-menu — only start watching AFTER it is fully open (opacity:1)
    // Then close our panel instantly when it starts closing (opacity goes to 0)
    var _smLayer = document.getElementById('settings-menu');
    if (_smLayer) {
      var _smOpen = false;
      var _smObs = new MutationObserver(function() {
        if (!_smOpen && _smLayer.style.opacity === '1') {
          _smOpen = true;
          return;
        }
        if (_smOpen && _smLayer.style.opacity === '0') {
          _smObs.disconnect();
          closeRyuSettings();
        }
      });
      _smObs.observe(_smLayer, { attributes: true, attributeFilter: ['style'] });
    }
    if (RYU_SP_NATIVE_TAB[_spCurrentTab] !== undefined) {
      setTimeout(function() {
        var nt = document.querySelectorAll('.sm-category-selector');
        var idx = RYU_SP_NATIVE_TAB[_spCurrentTab];
        if (nt[idx]) nt[idx].click();
        renderSpContent(panel);
      }, 160);
    } else if (_spCurrentTab === 'RYUTHEME') {
      // Activate native THEME tab so right-side context is always correct
      setTimeout(function() {
        var nt = document.querySelectorAll('.sm-category-selector');
        if (nt[2]) nt[2].click();
        renderSpContent(panel);
      }, 160);
    } else {
      renderSpContent(panel);
    }
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { panel.classList.add('ryu-sp-open'); });
    });
  }

  function closeRyuSettings() {
    var panel = document.getElementById(RYU_SP_ID);
    if (!panel) return;
    panel.remove();
  }

  function buildSettingsPanelHTML() {
    var tabsHTML = RYU_SP_TABS.map(function(t) {
      return '<button class="ryu-sp-tab' + (t === _spCurrentTab ? ' ryu-sp-tab-active' : '') + '" data-tab="' + t + '">' + t + '</button>';
    }).join('');
    return '<div id="ryu-sp-box"><div id="ryu-sp-topbar"><span id="ryu-sp-logo">RYUTEN</span><div id="ryu-sp-topbar-tabs">' + tabsHTML + '</div><div id="ryu-sp-topbar-right"><button id="ryu-sp-preview-btn" title="Toggle transparency" style="flex-shrink:0;height:26px;padding:0 10px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:5px;color:rgba(34,211,238,0.6);font-family:\'Noto Sans\',sans-serif;font-size:8px;font-weight:700;letter-spacing:1px;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;">👁 PREVIEW</button><button id="ryu-sp-close">&#x2715;</button></div></div><div id="ryu-sp-body"><div id="ryu-sp-sidebar"></div><div id="ryu-sp-content"></div></div></div>';
  }

  function wireSettingsPanel(panel) {
    panel.querySelector('#ryu-sp-close').addEventListener('click', function() {
      var nativeBack = document.getElementById('sm-btn-back');
      if (nativeBack) nativeBack.click();
      closeRyuSettings();
    });

    // Preview toggle — makes panel semi-transparent to see game behind it
    var previewBtn = panel.querySelector('#ryu-sp-preview-btn');
    var _previewOn = false;
    var spBox = panel.querySelector('#ryu-sp-box');
    previewBtn.addEventListener('click', function() {
      _previewOn = !_previewOn;
      spBox.style.background = _previewOn
        ? 'rgba(13,17,23,0.25)'
        : 'rgba(13,17,23,0.92)';
      spBox.style.backdropFilter = _previewOn ? 'blur(0px)' : 'blur(4px)';
      spBox.style.webkitBackdropFilter = _previewOn ? 'blur(0px)' : 'blur(4px)';
      previewBtn.style.background = _previewOn
        ? 'rgba(34,211,238,0.2)'
        : 'rgba(34,211,238,0.08)';
      previewBtn.style.color = _previewOn ? '#22d3ee' : 'rgba(34,211,238,0.6)';
    });
    panel.querySelectorAll('.ryu-sp-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _spCurrentTab = btn.dataset.tab;
        _spCurrentSec = null;
        panel.querySelectorAll('.ryu-sp-tab').forEach(function(b) { b.classList.remove('ryu-sp-tab-active'); });
        btn.classList.add('ryu-sp-tab-active');
        // Theme mode — left-anchored panel showing live game on right
        if (_spCurrentTab === 'THEME' || _spCurrentTab === 'RYUTHEME') {
          panel.classList.add('ryu-sp-theme-mode');
        } else {
          panel.classList.remove('ryu-sp-theme-mode');
        }
        if (RYU_SP_NATIVE_TAB[_spCurrentTab] !== undefined) {
          var nt = document.querySelectorAll('.sm-category-selector');
          var idx = RYU_SP_NATIVE_TAB[_spCurrentTab];
          if (nt[idx]) nt[idx].click();
          setTimeout(function() { renderSpContent(panel); }, 80);
        } else if (_spCurrentTab === 'RYUTHEME') {
          // Always activate native THEME tab first so the right-side context is correct
          var nt2 = document.querySelectorAll('.sm-category-selector');
          if (nt2[2]) nt2[2].click();
          setTimeout(function() { renderSpContent(panel); }, 80);
        } else {
          renderSpContent(panel);
        }
      });
    });
  }

  function renderSpContent(panel) {
    var sections = RYU_SP_SECTIONS[_spCurrentTab] || [];
    if (!_spCurrentSec || sections.indexOf(_spCurrentSec) === -1) _spCurrentSec = sections[0] || null;
    var sidebar = panel.querySelector('#ryu-sp-sidebar');
    sidebar.innerHTML = '<div class="ryu-sp-sec-group-title">SECTIONS</div>' +
      sections.map(function(sec) {
        return '<div class="ryu-sp-sec-item' + (sec === _spCurrentSec ? ' ryu-sp-sec-active' : '') + '" data-sec="' + sec + '">' + sec + '<span class="ryu-sp-sec-arrow">&#x203A;</span></div>';
      }).join('');
    sidebar.querySelectorAll('.ryu-sp-sec-item').forEach(function(item) {
      item.addEventListener('click', function() {
        _spCurrentSec = item.dataset.sec;
        sidebar.querySelectorAll('.ryu-sp-sec-item').forEach(function(i) { i.classList.remove('ryu-sp-sec-active'); });
        item.classList.add('ryu-sp-sec-active');
        renderSpRows(panel);
      });
    });
    renderSpRows(panel);
  }

  function renderSpRows(panel) {
    var content = panel.querySelector('#ryu-sp-content');
    content.innerHTML = '';
    if (_spCurrentTab === 'RYUTHEME') { renderRyuThemeSection(content, _spCurrentSec); return; }
    var range = RYU_SP_TAB_ROWS[_spCurrentTab];
    if (!range) return;
    var allRows = document.querySelectorAll('.sm-row');
    var hdr = document.createElement('div');
    hdr.className = 'ryu-sp-section-hdr';
    hdr.textContent = _spCurrentSec || _spCurrentTab;
    content.appendChild(hdr);
    for (var i = range[0]; i <= range[1]; i++) {
      var nr = allRows[i];
      if (!nr) continue;
      var ne = nr.querySelector('.sm-setting-name');
      if (!ne) continue;
      var label = ne.textContent.trim();
      // Only show rows that belong to current section AND are currently visible in native DOM
      if (!rowBelongsToSection(label, _spCurrentSec, _spCurrentTab)) continue;
      if (window.getComputedStyle(nr).display === 'none') continue;
      var rowEl = buildNativeRow(nr, label);
      if (rowEl) content.appendChild(rowEl);
    }
    // ── Bottom action row — Reset + Import/Export ──────────────────
    if (_spCurrentTab === 'THEME') {
      var bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'display:flex;gap:8px;margin-top:20px;';

      var btnStyle = 'flex:1;height:30px;background:transparent;border:1px solid rgba(34,211,238,0.2);border-radius:6px;color:rgba(34,211,238,0.6);font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;cursor:pointer;transition:all 0.15s;white-space:nowrap;';
      var btnHoverOn  = function(b) { b.style.background = 'rgba(34,211,238,0.07)'; b.style.borderColor = 'rgba(34,211,238,0.5)'; b.style.color = '#22d3ee'; };
      var btnHoverOff = function(b) { b.style.background = 'transparent'; b.style.borderColor = 'rgba(34,211,238,0.2)'; b.style.color = 'rgba(34,211,238,0.6)'; };

      // Reset button — wires to native #sm-btn-reset
      var resetBtn = document.createElement('button');
      resetBtn.textContent = '↺  RESET';
      resetBtn.style.cssText = btnStyle;
      resetBtn.addEventListener('mouseenter', function() { btnHoverOn(resetBtn); });
      resetBtn.addEventListener('mouseleave', function() { btnHoverOff(resetBtn); });
      resetBtn.addEventListener('click', function() {
        var nativeReset = document.getElementById('sm-btn-reset');
        if (nativeReset) nativeReset.click();
      });

      // Import & Export button
      var ieBtn = document.createElement('button');
      ieBtn.textContent = '⇅  IMPORT & EXPORT';
      ieBtn.style.cssText = btnStyle;
      ieBtn.addEventListener('mouseenter', function() { btnHoverOn(ieBtn); });
      ieBtn.addEventListener('mouseleave', function() { btnHoverOff(ieBtn); });
      ieBtn.addEventListener('click', function() { openRyuImportExport(); });

      bottomRow.appendChild(resetBtn);
      bottomRow.appendChild(ieBtn);
      content.appendChild(bottomRow);
    }
  }

  // ── Custom Import & Export dialog ─────────────────────────────────────────
  function showThemeAppliedToast(name) {
    var existing = document.getElementById('ryu-theme-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'ryu-theme-toast';
    toast.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);z-index:999999;background:#0d1117;border:1px solid rgba(34,211,238,0.35);border-radius:10px;padding:12px 24px;display:flex;align-items:center;gap:10px;font-family:"Noto Sans",sans-serif;box-shadow:0 0 30px rgba(34,211,238,0.15);opacity:0;transition:opacity 0.2s,transform 0.2s;pointer-events:none;';
    var icon = document.createElement('span');
    icon.textContent = '\u2713';
    icon.style.cssText = 'font-size:16px;color:#22d3ee;font-weight:900;';
    var msg = document.createElement('span');
    msg.style.cssText = 'font-size:12px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.85);';
    msg.innerHTML = 'THEME APPLIED <span style="color:#22d3ee;">' + name + '</span>';
    toast.appendChild(icon);
    toast.appendChild(msg);
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 250);
    }, 2500);
  }

  function openRyuImportExport() {
    if (document.getElementById('ryu-imex-overlay')) return;
    var categories = ['Gameplay settings','Graphics settings','Theme settings','Controls settings','Chat settings','Huds settings'];
    var checked = categories.map(function() { return true; });
    var overlay = document.createElement('div');
    overlay.id = 'ryu-imex-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
    var box = document.createElement('div');
    box.style.cssText = 'background:#0d1117;border:1px solid rgba(34,211,238,0.25);border-radius:12px;min-width:320px;font-family:"Noto Sans",sans-serif;overflow:hidden;box-shadow:0 0 40px rgba(0,0,0,0.6);';
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(34,211,238,0.04);';
    var title = document.createElement('span');
    title.textContent = 'IMPORT & EXPORT';
    title.style.cssText = 'font-size:12px;font-weight:700;letter-spacing:2px;color:#22d3ee;';
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;cursor:pointer;padding:0;line-height:1;';
    closeBtn.addEventListener('click', function() { overlay.remove(); });
    header.appendChild(title);
    header.appendChild(closeBtn);
    var list = document.createElement('div');
    list.style.cssText = 'padding:16px 18px;display:flex;flex-direction:column;gap:10px;';
    categories.forEach(function(cat, idx) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;cursor:pointer;';
      var label = document.createElement('span');
      label.textContent = cat;
      label.style.cssText = 'font-size:12px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.5px;';
      var toggle = document.createElement('div');
      toggle.style.cssText = 'width:18px;height:18px;border-radius:4px;border:1px solid rgba(34,211,238,0.4);display:flex;align-items:center;justify-content:center;transition:all 0.15s;background:' + (checked[idx] ? 'rgba(34,211,238,0.2)' : 'transparent') + ';';
      var tick = document.createElement('span');
      tick.textContent = '✓';
      tick.style.cssText = 'font-size:11px;color:#22d3ee;display:' + (checked[idx] ? 'block' : 'none') + ';';
      toggle.appendChild(tick);
      row.appendChild(label);
      row.appendChild(toggle);
      row.addEventListener('click', function() {
        checked[idx] = !checked[idx];
        toggle.style.background = checked[idx] ? 'rgba(34,211,238,0.2)' : 'transparent';
        tick.style.display = checked[idx] ? 'block' : 'none';
      });
      list.appendChild(row);
    });
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;gap:8px;padding:14px 18px;border-top:1px solid rgba(255,255,255,0.06);';
    var importBtn = document.createElement('button');
    importBtn.textContent = 'IMPORT';
    importBtn.style.cssText = 'flex:1;height:36px;background:transparent;border:1px solid rgba(34,211,238,0.3);border-radius:7px;color:rgba(34,211,238,0.7);font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all 0.15s;';
    importBtn.addEventListener('mouseenter', function() { importBtn.style.background = 'rgba(34,211,238,0.08)'; importBtn.style.color = '#22d3ee'; });
    importBtn.addEventListener('mouseleave', function() { importBtn.style.background = 'transparent'; importBtn.style.color = 'rgba(34,211,238,0.7)'; });
    importBtn.addEventListener('click', function() {
      overlay.remove();
      // Temporarily remove visibility:hidden from sm-partition so game fully initializes settings
      var smStyle = document.getElementById('ryu-trb-style');
      var origText = smStyle ? smStyle.textContent : '';
      if (smStyle) {
        smStyle.textContent = origText.replace(
          'visibility: hidden !important;',
          ''
        );
      }
      var nativeSettingsBtn = document.getElementById('mame-trb-settings-btn');
      if (nativeSettingsBtn) nativeSettingsBtn.click();
      var smLayer = document.getElementById('settings-menu');
      var attempts = 0;
      var poll = setInterval(function() {
        attempts++;
        var isOpen = smLayer && smLayer.style.opacity === '1';
        if (isOpen || attempts > 25) {
          clearInterval(poll);
          syncNativeCheckboxes(checked);
          var nativeImport = document.getElementById('import-settings-button');
          if (nativeImport) nativeImport.click();
          setTimeout(function() {
            var backBtn = document.getElementById('sm-btn-back');
            if (backBtn) backBtn.click();
            // Restore original style
            if (smStyle) smStyle.textContent = origText;
          }, 300);
        }
      }, 80);
    });
    var exportBtn = document.createElement('button');
    exportBtn.textContent = 'EXPORT';
    exportBtn.style.cssText = 'flex:1;height:36px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.4);border-radius:7px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all 0.15s;';
    exportBtn.addEventListener('mouseenter', function() { exportBtn.style.background = 'rgba(34,211,238,0.18)'; });
    exportBtn.addEventListener('mouseleave', function() { exportBtn.style.background = 'rgba(34,211,238,0.1)'; });
    exportBtn.addEventListener('click', function() {
      overlay.remove();
      // Temporarily remove visibility:hidden from sm-partition so game fully initializes settings
      var smStyle = document.getElementById('ryu-trb-style');
      var origText = smStyle ? smStyle.textContent : '';
      if (smStyle) {
        smStyle.textContent = origText.replace(
          'visibility: hidden !important;',
          ''
        );
      }
      var nativeSettingsBtn = document.getElementById('mame-trb-settings-btn');
      if (nativeSettingsBtn) nativeSettingsBtn.click();
      var smLayer = document.getElementById('settings-menu');
      var attempts = 0;
      var poll = setInterval(function() {
        attempts++;
        var isOpen = smLayer && smLayer.style.opacity === '1';
        if (isOpen || attempts > 25) {
          clearInterval(poll);
          syncNativeCheckboxes(checked);
          var nativeExport = document.getElementById('export-settings-button');
          if (nativeExport) nativeExport.click();
          setTimeout(function() {
            var backBtn = document.getElementById('sm-btn-back');
            if (backBtn) backBtn.click();
            // Restore original style
            if (smStyle) smStyle.textContent = origText;
          }, 300);
        }
      }, 80);
    });
    footer.appendChild(importBtn);
    footer.appendChild(exportBtn);
    box.appendChild(header);
    box.appendChild(list);
    box.appendChild(footer);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  }

  function syncNativeCheckboxes(checked) {
    var nativeMenu = document.getElementById('import-export-menu');
    var wasHidden = !nativeMenu || nativeMenu.style.display === 'none' || nativeMenu.style.display === '';
    if (nativeMenu && wasHidden) nativeMenu.style.display = 'flex';
    var nativeBoxes = document.querySelectorAll('#imex-menu-categories .dialog-box__checkbox');
    nativeBoxes.forEach(function(box, idx) {
      // checked = iconfont-checkbox, unchecked = iconfont-checkbox-outline
      var isChecked = box.classList.contains('iconfont-checkbox');
      if (checked[idx] && !isChecked) box.click();
      if (!checked[idx] && isChecked) box.click();
    });
    if (nativeMenu && wasHidden) nativeMenu.style.display = 'none';
  }

  function rowBelongsToSection(label, sec, tab) {
    if (!sec) return true;
    var map = {
      'GAMEPLAY': {
        'MOVEMENT':['STOP MOVEMENT ON MENU OPEN'],
        'DISPLAY':['SHOW OWN USERNAME',"SHOW ENEMY'S USERNAME",'SHOW OWN ENERGY',"SHOW ENEMY'S ENERGY",'SHOW TEAM NAME',"SHOW TEAMMATES' CUSTOM SKINS",'SHOW OWN CUSTOM SKIN','SHOW SHIELDS','ORB OVERLAP HIGHLIGHTING'],
        'CAMERA':['CAMERA MOVEMENT SPEED','CAMERA ZOOM SPEED','CAMERA AUTO ZOOM'],
        'REPLAY':['INSTANT REPLAY','INSTANT REPLAY CLIP LENGTH'],
        'ANIMATION':['ELEMENT ANIMATION SOFTENING'],
        'MISC':['AUTO SWITCH ACTIVE PLAYER UNIT','ACTIVE PLAYER UNIT ARROW INDICATOR','CURSOR LINES','WORLD BACKGROUND','COMMANDER']
      },
      'GRAPHICS':{ 'QUALITY':['RESOLUTION','ANTIALIASING','ORB SHADOW','GLOBAL TEXTURE QUALITY','BACKGROUND IMAGE QUALITY'] },
      'THEME':{
        'WORLD BORDER':['BORDER COLOR','BORDER SIZE','BORDER GLOW COLOR','BORDER GLOW SIZE'],
        'ORB':['ORB SHADOW INTENSITY','ORB STYLE','ORB TRANSPARENCY','ORB COLORING','ORB TINT COLOR','OWN ORB COLORING','CUSTOM OWN ORB COLOR'],
        'ILL ORB':['ILL ORB BASE COLOR','ILL ORB BORDER COLOR','ILL ORB GLOW COLOR','ILL ORB GLOW SIZE'],
        'PARTICLE':['PARTICLE COLOR','PARTICLE GLOW COLOR','PARTICLE GLOW SIZE'],
        'BACKGROUND':['BACKGROUND COLOR','BACKGROUND IMAGE URL','BACKGROUND IMAGE COLOR'],
        'MULTIBOX':['ACTIVE PLAYER UNIT ACCENT COLOR','INACTIVE PLAYER UNIT ACCENT COLOR'],
        'CURSOR LINE':['CURSOR LINE COLOR','CURSOR LINE THICKNESS']
      },
      'CONTROLS':{
        'PLAYER':['SELECT PLAYER TO SPECTATE','SPLIT','SPLIT 2X','SPLIT 3X','SPLIT 4X','SPLIT 6X','EJECT','MACRO EJECT','COMMANDER','RESPAWN','SWITCH ACTIVE PLAYER UNIT','CHANGE SPECTATE MODE','STOP MOVEMENT','TOGGLE OWN USERNAME','TOGGLE ENEMY USERNAME','TOGGLE OWN ENERGY','TOGGLE ENEMY ENERGY',"TOGGLE TEAMMATES' CUSTOM SKINS",'TOGGLE OWN CUSTOM SKIN','GLOBAL CHANNEL','TEAM CHANNEL','SAVE INSTANT REPLAY'],
        'CAMERA ZOOM':['CAMERA ZOOM LEVEL 1','CAMERA ZOOM LEVEL 2','CAMERA ZOOM LEVEL 3','CAMERA ZOOM LEVEL 4','CAMERA ZOOM LEVEL 5']
      },
      'CHAT':{ 'QUICK CHAT':['QUICK CHAT 1 MESSAGE','QUICK CHAT 2 MESSAGE','QUICK CHAT 3 MESSAGE','QUICK CHAT 4 MESSAGE','QUICK CHAT 5 MESSAGE','QUICK CHAT 6 MESSAGE','QUICK CHAT 7 MESSAGE','QUICK CHAT 8 MESSAGE','QUICK CHAT 9 MESSAGE','QUICK CHAT 10 MESSAGE'] },
      'HUDS':{ 'OVERLAYS':['SHOW TEAM LIST','SHOW LEADERBOARD','SHOW CHAT BOX','SHOW KILL FEED','SHOW METRICS','SHOW MINIMAP'] }
    };
    var tm = map[tab];
    if (!tm || !tm[sec]) return true;
    return tm[sec].indexOf(label) !== -1;
  }

  function buildNativeRow(nativeRow, label) {
    var row = document.createElement('div');
    row.className = 'ryu-sp-row';
    var lbl = document.createElement('div');
    lbl.className = 'ryu-sp-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    var ctrl = document.createElement('div');
    ctrl.className = 'ryu-sp-ctrl';

    var toggle   = nativeRow.querySelector('.sm-toggle');
    var rangeEl  = nativeRow.querySelector('.sm-range');
    var multi    = nativeRow.querySelector('.sm-multi-choice');
    var colorBox = nativeRow.querySelector('.sm-color-box');
    var inputBox = nativeRow.querySelector('.sm-input-box');
    var keybindAll   = nativeRow.querySelectorAll('.sm-control-input-box');
    var keybind      = keybindAll[0] || null;
    var keybindMouse = keybindAll[1] || null;

    if (toggle) {
      var isOn = !!toggle.querySelector('.sm-toggle__slider--active');
      var tog = document.createElement('div');
      tog.className = 'ryu-sp-toggle' + (isOn ? ' ryu-sp-toggle-on' : '');
      var dot = document.createElement('div');
      dot.className = 'ryu-sp-toggle-dot';
      tog.appendChild(dot);
      tog.addEventListener('click', function() {
        toggle.click();
        setTimeout(function() {
          tog.classList.toggle('ryu-sp-toggle-on', !!toggle.querySelector('.sm-toggle__slider--active'));
        }, 30);
      });
      ctrl.appendChild(tog);
    } else if (colorBox) {
      var preview = colorBox.querySelector('.sm-color-box__preview');
      var swatch = document.createElement('div');
      swatch.className = 'ryu-sp-swatch';
      swatch.style.background = preview ? preview.style.backgroundColor : '#888';
      swatch.style.cursor = 'pointer';
      swatch.style.position = 'relative';

      var qKeyMap = {
        'BORDER COLOR':                      'BORDER_COLOR',
        'BORDER GLOW COLOR':                 'BORDER_GLOW_COLOR',
        'ORB TINT COLOR':                    'ORB_TINT_COLOR',
        'CUSTOM OWN ORB COLOR':              'CUSTOM_OWN_ORB_COLOR',
        'ILL ORB BASE COLOR':                'ILL_ORB_BASE_COLOR',
        'ILL ORB BORDER COLOR':              'ILL_ORB_BORDER_COLOR',
        'ILL ORB GLOW COLOR':                'ILL_ORB_GLOW_COLOR',
        'PARTICLE COLOR':                    'PARTICLE_COLOR',
        'PARTICLE GLOW COLOR':               'PARTICLE_GLOW_COLOR',
        'BACKGROUND COLOR':                  'BACKGROUND_COLOR',
        'BACKGROUND IMAGE COLOR':            'BACKGROUND_IMAGE_COLOR',
        'ACTIVE PLAYER UNIT ACCENT COLOR':   'ACTIVE_PLAYER_UNIT_ACCENT_COLOR',
        'INACTIVE PLAYER UNIT ACCENT COLOR': 'INACTIVE_PLAYER_UNIT_ACCENT_COLOR',
        'CURSOR LINE COLOR':                 'CURSOR_LINE_COLOR'
      };
      var qKey = qKeyMap[label];

      // Settings that use ARGB format (alpha in high byte)
      var qArgbKeys = {
        'BORDER_GLOW_COLOR': true,
        'ILL_ORB_BASE_COLOR': true,
        'ILL_ORB_GLOW_COLOR': true,
        'PARTICLE_GLOW_COLOR': true
      };

      // Get initial color from __Q including alpha if applicable
      function getInitialHex() {
        if (qKey && globalThis.__Q && globalThis.__Q[qKey]) {
          var val = globalThis.__Q[qKey]._5738;
          if (typeof val === 'number') {
            if (qArgbKeys[qKey]) {
              var a = (val >>> 24) & 0xFF;
              var r = (val >>> 16) & 0xFF;
              var g = (val >>> 8)  & 0xFF;
              var b =  val         & 0xFF;
              return 'rgba(' + r + ',' + g + ',' + b + ',' + (a/255).toFixed(2) + ')';
            } else {
              return '#' + ('000000' + val.toString(16)).slice(-6);
            }
          }
        }
        if (preview && preview.style.backgroundColor) {
          var rgb = preview.style.backgroundColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            return '#' + rgb.slice(0,3).map(function(x) { return ('0'+parseInt(x).toString(16)).slice(-2); }).join('');
          }
        }
        return '#ffffff';
      }

      swatch.style.background = getInitialHex();

      var _pickrInstance = null;
      var _pickrReady = false;

      swatch.addEventListener('click', function(e) {
        e.stopPropagation();
        if (_pickrInstance && _pickrReady) {
          _pickrInstance.show();
          return;
        }
        if (_pickrReady) return; // already loading
        _pickrReady = true;

        // Load Pickr CSS once
        if (!document.getElementById('ryu-pickr-css')) {
          var pLink = document.createElement('link');
          pLink.id = 'ryu-pickr-css';
          pLink.rel = 'stylesheet';
          pLink.href = 'https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css';
          document.head.appendChild(pLink);
        }

        function createPickr() {
          var pickrEl = document.createElement('div');
          pickrEl.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;';
          document.getElementById(RYU_SP_ID).appendChild(pickrEl);

          _pickrInstance = window.Pickr.create({
            el: pickrEl,
            theme: 'nano',
            default: getInitialHex(),
            defaultRepresentation: 'HEXA',
            components: {
              preview: true,
              opacity: true,
              hue: true,
              interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: false,
                clear: false
              }
            }
          });

          _pickrInstance.on('change', function(color) {
            var rgba = color.toRGBA();
            var r = Math.round(rgba[0]);
            var g = Math.round(rgba[1]);
            var b = Math.round(rgba[2]);
            var a = Math.round(rgba[3] * 255);
            var hexInt;
            if (qKey && qArgbKeys[qKey]) {
              hexInt = ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
            } else {
              hexInt = (r << 16 | g << 8 | b) >>> 0;
            }
            swatch.style.background = 'rgba(' + r + ',' + g + ',' + b + ',' + rgba[3] + ')';
            if (qKey && globalThis.__Q && globalThis.__Q[qKey] && globalThis.__Q[qKey]._7531) {
              globalThis.__Q[qKey]._7531(hexInt);
            }
          });

          _pickrInstance.on('show', function() {
            var pcr = document.querySelector('.pcr-app.visible');
            if (pcr) {
              var sr = swatch.getBoundingClientRect();
              pcr.style.position = 'fixed';
              pcr.style.left = sr.left + 'px';
              pcr.style.top  = (sr.bottom + 6) + 'px';
              pcr.style.zIndex = '999999';
            }
          });

          _pickrInstance.show();
        }

        if (window.Pickr) {
          createPickr();
        } else {
          var script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js';
          script.onload = function() { createPickr(); };
          document.head.appendChild(script);
        }
      });

      ctrl.appendChild(swatch);
    } else if (rangeEl) {
      (function(re, nr) {
        var fillEl = re.querySelector('.sm-range__fill');
        var valEl  = nr.querySelector('.sm-range-value');
        var pct    = fillEl ? parseFloat(fillEl.style.width) || 0 : 0;
        var track  = document.createElement('div');
        track.className = 'ryu-sp-track';
        var fill = document.createElement('div');
        fill.className = 'ryu-sp-fill';
        fill.style.width = pct + '%';
        var thumb = document.createElement('div');
        thumb.className = 'ryu-sp-thumb';
        fill.appendChild(thumb);
        track.appendChild(fill);
        var valDisp = document.createElement('div');
        valDisp.className = 'ryu-sp-val';
        valDisp.textContent = valEl ? valEl.textContent.trim() : '0';
        var _drag = false;
        var _synthetic = false;
        function applyAt(clientX) {
          var trackRect = track.getBoundingClientRect();
          if (!trackRect.width) return;
          var p = Math.max(0, Math.min(1, (clientX - trackRect.left) / trackRect.width));
          var nativeRect = re.getBoundingClientRect();
          var nx = nativeRect.left + p * nativeRect.width;
          var ny = nativeRect.top + nativeRect.height / 2;
          _synthetic = true;
          re.dispatchEvent(new MouseEvent('mousedown', { bubbles: false, clientX: nx, clientY: ny }));
          re.dispatchEvent(new MouseEvent('mousemove', { bubbles: false, clientX: nx, clientY: ny }));
          _synthetic = false;
          // Always sync our visual from native — handles both smooth and stepped sliders
          requestAnimationFrame(function() {
            var uf = re.querySelector('.sm-range__fill');
            var uv = nr.querySelector('.sm-range-value');
            if (uf) fill.style.width = uf.style.width;
            if (uv) valDisp.textContent = uv.textContent.trim();
          });
        }
        track.addEventListener('mousedown', function(e) {
          _drag = true;
          applyAt(e.clientX);
          e.preventDefault();
        });
        track.addEventListener('dragstart', function(e) { e.preventDefault(); });
        window.addEventListener('mousemove', function(e) {
          if (!_drag || _synthetic) return;
          applyAt(e.clientX);
        });
        window.addEventListener('mouseup', function(e) {
          if (!_drag) return;
          _drag = false;
          var nativeRect = re.getBoundingClientRect();
          var trackRect  = track.getBoundingClientRect();
          var p = Math.max(0, Math.min(1, (e.clientX - trackRect.left) / trackRect.width));
          var nx = nativeRect.left + p * nativeRect.width;
          var ny = nativeRect.top + nativeRect.height / 2;
          re.dispatchEvent(new MouseEvent('mouseup', { bubbles: false, clientX: nx, clientY: ny }));
        });
        ctrl.appendChild(track);
        ctrl.appendChild(valDisp);
      })(rangeEl, nativeRow);
    } else if (multi) {
      var items = multi.querySelectorAll('.sm-multi-choice__item');
      var wrap = document.createElement('div');
      wrap.className = 'ryu-sp-multi';
      items.forEach(function(item) {
        var btn = document.createElement('button');
        btn.className = 'ryu-sp-mi' + (item.classList.contains('sm-multi-choice__item--active') ? ' ryu-sp-mi-active' : '');
        btn.textContent = item.textContent.trim();
        btn.addEventListener('click', function() {
          item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          wrap.querySelectorAll('.ryu-sp-mi').forEach(function(b) { b.classList.remove('ryu-sp-mi-active'); });
          btn.classList.add('ryu-sp-mi-active');
        });
        wrap.appendChild(btn);
      });
      ctrl.appendChild(wrap);
    } else if (inputBox) {
      var nativeInp = inputBox.querySelector('input') || inputBox;
      var inp = document.createElement('input');
      inp.className = 'ryu-sp-input';
      inp.value = nativeInp.value || '';
      inp.placeholder = nativeInp.placeholder || '';
      inp.addEventListener('input', function() {
        nativeInp.value = inp.value;
        nativeInp.dispatchEvent(new Event('input',  { bubbles: true }));
        nativeInp.dispatchEvent(new Event('change', { bubbles: true }));
      });
      inp.addEventListener('blur', function() {
        nativeInp.value = inp.value;
        nativeInp.dispatchEvent(new Event('input',  { bubbles: true }));
        nativeInp.dispatchEvent(new Event('blur',   { bubbles: true }));
      });
      ctrl.appendChild(inp);
    } else if (keybind) {
      function makeKlBox(nativeBind, labelText, isMouse) {
        var bindSpan = nativeBind.querySelector('span');
        var MOUSE_LABELS = { 0: 'LEFT CLICK', 1: 'MIDDLE CLICK', 2: 'RIGHT CLICK', 3: 'MB4', 4: 'MB5' };

        var col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;';

        var lh = document.createElement('div');
        lh.textContent = labelText;
        lh.style.cssText = 'font-size:8px;font-weight:700;color:rgba(34,211,238,0.4);letter-spacing:1px;font-family:"Noto Sans",sans-serif;';
        col.appendChild(lh);

        var kl = document.createElement('div');
        kl.className = 'ryu-sp-val';
        kl.style.cssText = 'background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:4px;padding:3px 10px;min-width:60px;text-align:center;cursor:pointer;font-size:10px;transition:all 0.15s;';
        kl.textContent = (bindSpan ? bindSpan.textContent : nativeBind.textContent).replace(/keyboard$/i,'').replace(/mouse$/i,'').trim() || '\u2014';
        col.appendChild(kl);

        kl._ryuActive = false;

        kl.addEventListener('click', function() {
          if (kl._ryuActive) return;
          if (window.__ryuActiveKlCancel) window.__ryuActiveKlCancel();

          kl._ryuActive = true;
          var smStyle = document.getElementById('ryu-trb-style');
          var origText = smStyle ? smStyle.textContent : '';
          var fallbackTimer = null;

          function done() {
            if (!kl._ryuActive) return;
            kl._ryuActive = false;
            window.__ryuActiveKlCancel = null;
            if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
            nativeBind.removeEventListener('blur', onBlur);
            if (smStyle) smStyle.textContent = origText;
            kl.textContent = (bindSpan ? bindSpan.textContent : nativeBind.textContent).replace(/keyboard$/i,'').replace(/mouse$/i,'').trim() || '\u2014';
            kl.style.borderColor = 'rgba(34,211,238,0.2)';
            kl.style.background = 'rgba(34,211,238,0.08)';
          }

          window.__ryuActiveKlCancel = done;

          if (smStyle) smStyle.textContent = origText.replace('visibility: hidden !important;', '');

          nativeBind.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          nativeBind.focus();
          nativeBind.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
          nativeBind.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));

          kl.textContent = '...';
          kl.style.borderColor = '#22d3ee';
          kl.style.background = 'rgba(34,211,238,0.15)';

          if (isMouse) {
            function onMouseBind(e) {
              e.preventDefault();
              e.stopPropagation();
              document.removeEventListener('mousedown', onMouseBind, true);
              var display = MOUSE_LABELS[e.button] || ('MB' + e.button);
              nativeBind.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: e.button, buttons: e.buttons }));
              setTimeout(function() { done(); }, 80);
              kl.textContent = display;
              kl.style.borderColor = 'rgba(34,211,238,0.2)';
              kl.style.background = 'rgba(34,211,238,0.08)';
            }
            setTimeout(function() {
              document.addEventListener('mousedown', onMouseBind, true);
            }, 150);
            fallbackTimer = setTimeout(function() {
              document.removeEventListener('mousedown', onMouseBind, true);
              done();
            }, 10000);
          } else {
            function onKeydown(e) {
              nativeBind.removeEventListener('keydown', onKeydown, true);
              var pressedCode = e.code;
              var display = pressedCode.replace('Key','').replace('Digit','').replace('Arrow','').replace('Numpad','NUM');

              var conflict = null;
              document.querySelectorAll('.sm-row').forEach(function(row) {
                var nameEl = row.querySelector('.sm-setting-name');
                var bindEls = row.querySelectorAll('.sm-control-input-box');
                bindEls.forEach(function(bindEl) {
                  if (bindEl === nativeBind) return;
                  var bs = bindEl.querySelector('span');
                  var bindVal = (bs ? bs.textContent : bindEl.textContent).replace(/keyboard$/i,'').replace(/mouse$/i,'').trim().toUpperCase();
                  if (bindVal === display.toUpperCase() && bindVal !== 'NONE' && bindVal !== '') {
                    conflict = nameEl ? nameEl.textContent.trim() : 'another setting';
                  }
                });
              });

              if (conflict) {
                e.preventDefault();
                e.stopPropagation();
                done();
                var popup = document.createElement('div');
                popup.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
                var popBox = document.createElement('div');
                popBox.style.cssText = 'background:#0d1117;border:1px solid rgba(232,25,44,0.4);border-radius:10px;padding:22px 26px;max-width:340px;text-align:center;font-family:"Noto Sans",sans-serif;box-shadow:0 0 30px rgba(232,25,44,0.2);';
                var popIcon = document.createElement('div');
                popIcon.textContent = '⚠';
                popIcon.style.cssText = 'font-size:26px;margin-bottom:10px;color:#e8192c;';
                var popMsg = document.createElement('div');
                popMsg.style.cssText = 'font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.6;';
                popMsg.innerHTML = 'Hotkey <span style="color:#22d3ee;font-weight:700;">' + display + '</span> is already being used for<br><span style="color:#e8192c;font-weight:700;">' + conflict + '</span>!<br><span style="color:rgba(255,255,255,0.5);font-size:11px;">Please choose another key.</span>';
                var popOk = document.createElement('button');
                popOk.textContent = 'OK';
                popOk.style.cssText = 'margin-top:16px;padding:7px 28px;background:transparent;border:1px solid rgba(34,211,238,0.3);border-radius:6px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;';
                popOk.addEventListener('click', function() { popup.remove(); });
                popBox.appendChild(popIcon);
                popBox.appendChild(popMsg);
                popBox.appendChild(popOk);
                popup.appendChild(popBox);
                document.body.appendChild(popup);
                return;
              }

              kl.textContent = display;
              kl.style.borderColor = 'rgba(34,211,238,0.2)';
              kl.style.background = 'rgba(34,211,238,0.08)';
            }
            nativeBind.addEventListener('keydown', onKeydown, true);

            function onBlur() {
              nativeBind.removeEventListener('keydown', onKeydown, true);
              done();
            }
            nativeBind.addEventListener('blur', onBlur);

            fallbackTimer = setTimeout(function() {
              nativeBind.removeEventListener('keydown', onKeydown, true);
              done();
            }, 10000);
          }
        });

        return { col: col, kl: kl, nativeBind: nativeBind, bindSpan: bindSpan };
      }

      var kb = makeKlBox(keybind, 'KEYBOARD', false);
      var km = keybindMouse ? makeKlBox(keybindMouse, 'MOUSE', true) : null;

      function clearNativeBind(nativeBind, klEl, bindSpan) {
        var smStyle = document.getElementById('ryu-trb-style');
        var origText = smStyle ? smStyle.textContent : '';
        if (smStyle) smStyle.textContent = origText.replace('visibility: hidden !important;', '');
        nativeBind.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        nativeBind.focus();
        nativeBind.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
        nativeBind.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
        setTimeout(function() {
          nativeBind.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, code: 'Backspace', key: 'Backspace' }));
          setTimeout(function() {
            if (smStyle) smStyle.textContent = origText;
            klEl.textContent = (bindSpan ? bindSpan.textContent : nativeBind.textContent).replace(/keyboard$/i,'').replace(/mouse$/i,'').trim() || '\u2014';
          }, 80);
        }, 50);
      }

      // clear both keyboard and mouse binds
      var klClear = document.createElement('div');
      klClear.textContent = '\u2715';
      klClear.style.cssText = 'margin-left:5px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.3);font-size:10px;border-radius:3px;transition:all 0.15s;flex-shrink:0;align-self:flex-end;margin-bottom:2px;';
      klClear.addEventListener('mouseenter', function() { klClear.style.color = '#e8192c'; klClear.style.background = 'rgba(232,25,44,0.1)'; });
      klClear.addEventListener('mouseleave', function() { klClear.style.color = 'rgba(255,255,255,0.3)'; klClear.style.background = 'transparent'; });
      klClear.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.__ryuActiveKlCancel) window.__ryuActiveKlCancel();
        clearNativeBind(keybind, kb.kl, kb.bindSpan);
        if (km) setTimeout(function() { clearNativeBind(keybindMouse, km.kl, km.bindSpan); }, 200);
      });

      var klWrap = document.createElement('div');
      klWrap.style.cssText = 'display:flex;align-items:flex-end;gap:6px;';
      klWrap.appendChild(kb.col);
      if (km) klWrap.appendChild(km.col);
      klWrap.appendChild(klClear);
      ctrl.appendChild(klWrap);
    }

    row.appendChild(ctrl);
    return row;
  }

  function renderRyuThemeSection(content, sec) {
    function loadT() { try { return JSON.parse(localStorage.getItem('ryuTheme')) || {}; } catch(e) { return {}; } }
    function saveT(key, val) {
      var t = loadT(); t[key] = val;
      localStorage.setItem('ryuTheme', JSON.stringify(t));
      if (key === 'leftwardTag') {
        // apply LeftWard Tags immediately from settings instead of waiting for theme polls
        if (globalThis.__ryuApplyLeftwardTagState) {
          globalThis.__ryuApplyLeftwardTagState(!!val);
        } else {
          globalThis.__ryuHideNativeTag = !!val;
          if (globalThis.__ryuForceAtlasClear) globalThis.__ryuForceAtlasClear();
        }
      }
      if (key === 'pelletEmojiOn' || key === 'pelletImgurOn') {
        var pt = loadT();
        pt.pelletStyle = pt.pelletImgurOn ? 2 : (pt.pelletEmojiOn ? 1 : 0);
        localStorage.setItem('ryuTheme', JSON.stringify(pt));
        globalThis.__ryuPelletStyle = pt.pelletStyle;
      }
      if (key === 'pelletStyle') globalThis.__ryuPelletStyle = parseInt(val, 10) || 0;
      if (key === 'pelletEmoji') globalThis.__ryuPelletEmoji = val || '\uD83D\uDD25';
      if (key === 'pelletImgur') globalThis.__ryuPelletImgur = val || '';
      if (globalThis.__ryuRefreshAll) globalThis.__ryuRefreshAll();
    }

    var FONTS = [
      'Default','Orbitron','Audiowide','Oxanium','Exo 2','Quantico','Nova Square',
      'Bebas Neue','Oswald','Russo One','Black Ops One','Teko','Barlow Condensed',
      'Boogaloo','Fredoka One','Permanent Marker','Bangers','Righteous','Lilita One',
      'Press Start 2P','Creepster','Abril Fatface','Pacifico','Lobster','Monoton',
      'Faster One','Gugi','Silkscreen','VT323','Geogrotesque Cyr'
    ];
    var CURSORS = [
      'Default','🎯 Target','⚔️ Sword','💀 Skull','🔥 Fire','⭐ Star','👁️ Eye',
      '💎 Gem','🩸 Blood','⚡ Bolt','🌀 Vortex','🕹️ Joystick','🌙 Moon','🍀 Clover',
      '🦋 Butterfly','🐉 Dragon','🎃 Pumpkin','🧠 Brain','🪄 Wand','🔮 Crystal',
      '🗡️ Dagger','🥷 Ninja','👽 Alien','🤖 Robot','🌊 Wave','🧊 Ice','☠️ Crossbones'
    ];

    var hdr = document.createElement('div');
    hdr.className = 'ryu-sp-section-hdr';
    hdr.textContent = sec || 'RYUTHEME';
    content.appendChild(hdr);
    var t = loadT();

    // ── THEMES section — import .ryuset files as named presets (max 5) ────────
    if (sec === 'THEMES') {
      var PRESETS_KEY = 'ryuThemePresets';
      function loadPresets() { try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch(e) { return []; } }
      function savePresets(arr) { localStorage.setItem(PRESETS_KEY, JSON.stringify(arr)); }

      function buildThemesUI() {
        content.innerHTML = '';
        content.appendChild(hdr);
        var presets = loadPresets();

        // Load Theme button — file picker for .ryuset
        var topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;';

        var countLbl = document.createElement('div');
        countLbl.textContent = presets.length + ' / 5 THEMES';
        countLbl.style.cssText = 'font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-family:"Noto Sans",sans-serif;';

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ryuset';
        fileInput.style.cssText = 'display:none;';

        var loadThemeBtn = document.createElement('button');
        loadThemeBtn.textContent = '\u2191  LOAD THEME';
        loadThemeBtn.style.cssText = 'height:30px;padding:0 14px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);border-radius:6px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;cursor:pointer;transition:all 0.15s;white-space:nowrap;';
        loadThemeBtn.addEventListener('mouseenter', function() { loadThemeBtn.style.background = 'rgba(34,211,238,0.2)'; });
        loadThemeBtn.addEventListener('mouseleave', function() { loadThemeBtn.style.background = 'rgba(34,211,238,0.1)'; });
        loadThemeBtn.addEventListener('click', function() {
          if (loadPresets().length >= 5) {
            loadThemeBtn.textContent = 'MAX 5 THEMES';
            loadThemeBtn.style.borderColor = '#e8192c';
            loadThemeBtn.style.color = '#e8192c';
            setTimeout(function() {
              loadThemeBtn.textContent = '\u2191  LOAD THEME';
              loadThemeBtn.style.borderColor = 'rgba(34,211,238,0.3)';
              loadThemeBtn.style.color = '#22d3ee';
            }, 1500);
            return;
          }
          fileInput.value = '';
          fileInput.click();
        });

        fileInput.addEventListener('change', function() {
          var file = fileInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(e) {
            try {
              var parsed = JSON.parse(e.target.result);
              var settings = parsed.settings || parsed;
              var p = loadPresets();
              if (p.length >= 5) return;
              // Use filename without extension as preset name
              var name = file.name.replace(/\.ryuset$/i, '').trim() || ('Theme ' + (p.length + 1));
              // Deduplicate name
              var base = name, n = 1;
              while (p.some(function(x) { return x.name === name; })) { name = base + ' (' + (++n) + ')'; }
              p.push({ name: name, data: settings });
              savePresets(p);
              buildThemesUI();
            } catch(err) {
              loadThemeBtn.textContent = 'INVALID FILE';
              loadThemeBtn.style.borderColor = '#e8192c';
              loadThemeBtn.style.color = '#e8192c';
              setTimeout(function() {
                loadThemeBtn.textContent = '\u2191  LOAD THEME';
                loadThemeBtn.style.borderColor = 'rgba(34,211,238,0.3)';
                loadThemeBtn.style.color = '#22d3ee';
              }, 1500);
            }
          };
          reader.readAsText(file);
        });

        topRow.appendChild(countLbl);
        topRow.appendChild(fileInput);
        topRow.appendChild(loadThemeBtn);
        content.appendChild(topRow);

        // Preset list
        if (presets.length === 0) {
          var empty = document.createElement('div');
          empty.textContent = 'No themes loaded yet. Import a .ryuset file above.';
          empty.style.cssText = 'color:rgba(255,255,255,0.25);font-size:11px;font-family:"Noto Sans",sans-serif;text-align:center;padding:20px 0;';
          content.appendChild(empty);
        } else {
          presets.forEach(function(preset, idx) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:7px;margin-bottom:6px;';

            var nameLbl = document.createElement('div');
            nameLbl.textContent = preset.name;
            nameLbl.style.cssText = 'flex:1;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);font-family:"Noto Sans",sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

            var applyBtn = document.createElement('button');
            applyBtn.textContent = 'APPLY';
            applyBtn.style.cssText = 'height:26px;padding:0 10px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.25);border-radius:5px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;cursor:pointer;transition:all 0.15s;white-space:nowrap;';
            applyBtn.addEventListener('mouseenter', function() { applyBtn.style.background = 'rgba(34,211,238,0.2)'; });
            applyBtn.addEventListener('mouseleave', function() { applyBtn.style.background = 'rgba(34,211,238,0.1)'; });
            applyBtn.addEventListener('click', function() {
              // confirm popup
              var confirmOvr = document.createElement('div');
              confirmOvr.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
              var confirmBox = document.createElement('div');
              confirmBox.style.cssText = 'background:#0d1117;border:1px solid rgba(34,211,238,0.3);border-radius:10px;padding:24px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;min-width:280px;font-family:"Noto Sans",sans-serif;box-shadow:0 0 30px rgba(34,211,238,0.1);';
              confirmBox.innerHTML = '<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">Load Theme</div>' +
                '<div style="font-size:11px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.6;">Are you sure you want to load<br><span style="color:#22d3ee;font-weight:700;">' + preset.name + '</span>?<br><span style="font-size:10px;color:rgba(255,255,255,0.3);">Your current theme will be overwritten.</span></div>' +
                '<div style="display:flex;gap:10px;">' +
                '<button id="ryu-theme-cancel" style="height:32px;padding:0 20px;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:rgba(255,255,255,0.5);font-family:\'Noto Sans\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;cursor:pointer;">CANCEL</button>' +
                '<button id="ryu-theme-confirm" style="height:32px;padding:0 20px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.4);border-radius:6px;color:#22d3ee;font-family:\'Noto Sans\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;cursor:pointer;">LOAD</button>' +
                '</div>';
              confirmOvr.appendChild(confirmBox);
              document.body.appendChild(confirmOvr);
              confirmOvr.querySelector('#ryu-theme-cancel').addEventListener('click', function() { confirmOvr.remove(); });
              confirmOvr.addEventListener('click', function(ev) { if (ev.target === confirmOvr) confirmOvr.remove(); });
              confirmOvr.querySelector('#ryu-theme-confirm').addEventListener('click', function() {
                confirmOvr.remove();
                var yt = globalThis.__ryuYt;
                if (yt && typeof yt._3767 === 'function') {
                  var cats = new Set(['Gameplay','Graphics','Theme','Controls','Chat','Huds']);
                  var uObj = globalThis.__ryuU;
                  var origNotify = uObj ? uObj._1162 : null;
                  if (uObj) uObj._1162 = function() {};
                  yt._3767('import', [{ version: 3, settings: preset.data }, cats]);
                  if (uObj && origNotify) uObj._1162 = origNotify;
                  showThemeAppliedToast(preset.name);
                } else {
                  applyBtn.textContent = 'NOT READY';
                  applyBtn.style.borderColor = '#e8192c';
                  applyBtn.style.color = '#e8192c';
                  setTimeout(function() {
                    applyBtn.textContent = 'APPLY';
                    applyBtn.style.borderColor = 'rgba(34,211,238,0.25)';
                    applyBtn.style.color = '#22d3ee';
                  }, 1500);
                }
              });
            });

            // Rename button — toggles name label into editable input
            var renameBtn = document.createElement('div');
            renameBtn.textContent = '\u270e';
            renameBtn.title = 'Rename';
            renameBtn.style.cssText = 'width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.3);font-size:12px;border-radius:3px;transition:all 0.15s;flex-shrink:0;';
            renameBtn.addEventListener('mouseenter', function() { renameBtn.style.color = '#22d3ee'; renameBtn.style.background = 'rgba(34,211,238,0.1)'; });
            renameBtn.addEventListener('mouseleave', function() { renameBtn.style.color = 'rgba(255,255,255,0.3)'; renameBtn.style.background = 'transparent'; });
            renameBtn.addEventListener('click', function() {
              var inp = document.createElement('input');
              inp.value = preset.name;
              inp.style.cssText = 'flex:1;height:22px;background:#1c2128;border:1px solid rgba(34,211,238,0.4);border-radius:4px;color:rgba(255,255,255,0.9);font-family:"Noto Sans",sans-serif;font-size:11px;padding:0 7px;outline:none;min-width:0;';
              row.replaceChild(inp, nameLbl);
              inp.focus();
              inp.select();
              function commitRename() {
                var newName = inp.value.trim();
                if (newName && newName !== preset.name) {
                  var p = loadPresets();
                  if (!p.some(function(x, i) { return x.name === newName && i !== idx; })) {
                    p[idx].name = newName;
                    savePresets(p);
                    preset.name = newName;
                  }
                }
                nameLbl.textContent = preset.name;
                row.replaceChild(nameLbl, inp);
              }
              inp.addEventListener('blur', commitRename);
              inp.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
                if (e.key === 'Escape') { inp.value = preset.name; inp.blur(); }
              });
            });

            var delBtn = document.createElement('div');
            delBtn.textContent = '\u2715';
            delBtn.style.cssText = 'width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.3);font-size:10px;border-radius:3px;transition:all 0.15s;flex-shrink:0;';
            delBtn.addEventListener('mouseenter', function() { delBtn.style.color = '#e8192c'; delBtn.style.background = 'rgba(232,25,44,0.1)'; });
            delBtn.addEventListener('mouseleave', function() { delBtn.style.color = 'rgba(255,255,255,0.3)'; delBtn.style.background = 'transparent'; });
            delBtn.addEventListener('click', function() {
              var p = loadPresets();
              p.splice(idx, 1);
              savePresets(p);
              buildThemesUI();
            });

            row.appendChild(nameLbl);
            row.appendChild(applyBtn);
            row.appendChild(renameBtn);
            row.appendChild(delBtn);
            content.appendChild(row);
          });
        }

        // Warning + Save button row
        var warnRow = document.createElement('div');
        warnRow.style.cssText = 'margin-top:18px;display:flex;align-items:flex-start;gap:10px;';
        var warn = document.createElement('div');
        warn.textContent = '\u26a0  Save a copy of your current theme before applying a new one. Once overwritten, there\u2019s no undo.';
        warn.style.cssText = 'flex:1;font-size:10px;font-weight:600;color:rgba(255,255,255,0.25);font-family:"Noto Sans",sans-serif;line-height:1.6;letter-spacing:0.3px;';
        var saveNativeBtn = document.createElement('button');
        saveNativeBtn.textContent = 'SAVE';
        saveNativeBtn.style.cssText = 'height:26px;padding:0 12px;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.3);border-radius:5px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.15s;';
        saveNativeBtn.addEventListener('mouseenter', function() { saveNativeBtn.style.background = 'rgba(34,211,238,0.2)'; });
        saveNativeBtn.addEventListener('mouseleave', function() { saveNativeBtn.style.background = 'rgba(34,211,238,0.1)'; });
        saveNativeBtn.addEventListener('click', function() {
          var nativeExport = document.getElementById('export-settings-button');
          if (nativeExport) {
            nativeExport.click();
            saveNativeBtn.textContent = 'SAVED!';
            setTimeout(function() { saveNativeBtn.textContent = 'SAVE'; }, 1500);
          }
        });
        warnRow.appendChild(warn);
        warnRow.appendChild(saveNativeBtn);
        content.appendChild(warnRow);
      }

      buildThemesUI();
      return;
    }

    var defs = {
      'GAMEPLAY TWEAKS': [
        { label: 'GENERAL',            type: 'group' },
        { label: 'Animation Delay',    type: 'animSoften' },
        { label: 'Split Counter',      type: 'toggle',       key: 'splitCounterOn',  def: false },
        { label: 'World Sectors',      type: 'sectorExpand', key: 'sectorOverlayOn', def: false },
        { label: 'Emotes',             type: 'toggle', key: 'emotesOn',          def: true },
        { label: 'Agar.io Virus',      type: 'toggle', key: 'customVirus',       def: false },
        { label: 'Team Cell Colors',   type: 'teamColorExpand' },
        { label: 'DANGER',             type: 'group' },
        { label: 'Danger Indicators',  type: 'toggle', key: 'dangerIndicatorOn', def: false },
        { label: 'Green (eat them)',   type: 'toggle', key: 'dangerShowGreen',   def: true },
        { label: 'Blue (split kill)',  type: 'toggle', key: 'dangerShowBlue',    def: true },
        { label: 'Yellow (even)',      type: 'toggle', key: 'dangerShowYellow',  def: true },
        { label: 'Red (danger)',       type: 'toggle', key: 'dangerShowRed',     def: true }
      ],
      'COMMANDER': [
        { label: 'Ping Text',   type: 'text',   key: 'commanderText', def: '' },
        { label: 'Team Tag',    type: 'teamtag', key: 'teamTag',       def: '' }
      ],
      'CURSOR': [
        { label: 'Cursor Style', type: 'select', key: 'cursorIdx', def: 0, options: CURSORS }
      ],
      'GAME COSMETICS': [
        { label: 'CELL COSMETICS',     type: 'group' },
        { label: 'Name Color',         type: 'color',  key: 'color',            def: '#ff69b4' },
        { label: 'Name Font',          type: 'select', key: 'fontIndex',         def: 0, options: FONTS },
        { label: '',                   type: 'fontupdate' },
        { label: 'Hide Flags',         type: 'toggle', key: 'hideFlags',         def: false },
        { label: 'LeftWard Tags',      type: 'toggle', key: 'leftwardTag',       def: true },
        { label: 'Name Scale',         type: 'toggle', key: 'nameScaleOn',       def: false },
        { label: 'Name Size',          type: 'scaleslider', key: 'nameScale',    def: 100, min: 50, max: 300, step: 5 },
        { label: 'Mass Color',         type: 'color',  key: 'massColor',         def: '#ff69b4' },
        { label: 'Mass Font',          type: 'select', key: 'massFont',          def: 0, options: FONTS },
        { label: 'Mass Scale',         type: 'toggle', key: 'massScaleOn',       def: false },
        { label: 'Mass Size',          type: 'scaleslider', key: 'massScale',    def: 100, min: 50, max: 300, step: 5 },
        { label: 'CHATBOX',           type: 'group' },
        { label: 'Chatbox Theme',     type: 'toggle', key: 'chatboxThemeOn',  def: false },
        { label: 'Chat Name Color',   type: 'color',  key: 'chatNameColor',   def: '#9933ff' },
        { label: 'Chatbox Scale',     type: 'scale',  key: 'chatScale',       def: 50, min: 10, max: 100 },
        { label: 'LEADERBOARD',       type: 'group' },
        { label: 'Leaderboard Theme', type: 'toggle', key: 'lbThemeOn',  def: true },
        { label: 'Leaderboard Styles', type: 'select', key: 'lbStyle',   def: 0, options: ['RyuTheme', 'Agar.io LB'] },
        { label: 'LB Size',           type: 'cycle',  key: 'lbSize',     def: 'M', options: ['S', 'M', 'L'] },
        { label: 'MAP',               type: 'group' },
        { label: 'Agar.io Map',       type: 'toggle', key: 'agarMapOn',  def: false },
        { label: 'PELLETS',           type: 'group' },
        { label: 'Custom Color',      type: 'toggle', key: 'pelletColorOn',   def: false },
        { label: 'Pellet Color',      type: 'color',  key: 'pelletColor',     def: '#ff69b4' },
        { label: 'Rainbow Pellets',   type: 'toggle', key: 'rainbowPelletOn', def: false },
        { label: 'Pellet Skins',      type: 'pelletExpand' },
        { label: 'MAP PARTICLES',     type: 'group' },
        { label: 'Rainbow Map Dots',  type: 'toggle', key: 'rainbowParticlesOn',    def: false },
        { label: 'MINIMAP',           type: 'group' },
        { label: 'Minimap Theme',     type: 'toggle', key: 'minimapThemeOn',  def: true },
        { label: 'Minimap Style',     type: 'select', key: 'minimapStyle',    def: 1, options: ['Classic', 'Cyan', 'Agar.io'] },
        { label: 'Minimap Scale',     type: 'scale',  key: 'mmScale',         def: 50, min: 10, max: 100 },
        { label: 'OTHER',             type: 'group' },
        { label: 'Minimal Mode',      type: 'minimalExpand', key: 'minimalModeOn', def: false }
      ],
      'BORDER': [
        { label: 'Rainbow Border', type: 'toggle', key: 'rainbowBorderOn',   def: true },
        { label: 'Border Speed',   type: 'slider', key: 'rainbowBorderSpeed',def: 240, min: 10, max: 240 },
        { label: 'Rainbow Glow',   type: 'toggle', key: 'rainbowGlowOn',     def: true },
        { label: 'Glow Speed',     type: 'slider', key: 'rainbowGlowSpeed',  def: 240, min: 10, max: 240 }
      ],
      'HOTKEYS': [
        { label: 'Disconnect',     type: 'hotkey', key: 'hotkeyDisconnect',    def: '' },
        { label: 'Emote Panel',    type: 'hotkey', key: 'hotkeyEmote',         def: 'RIGHTCLICK' },
        { label: 'Danger Overlay', type: 'hotkey', key: 'hotkeyDangerOverlay', def: '' },
        { label: 'Minimal Mode',   type: 'hotkey', key: 'hotkeyMinimalMode',   def: '' },
        { label: 'Freecam',        type: 'hotkey', key: 'hotkeyFreecam',       def: '' }
      ]
    };

    (defs[sec] || []).forEach(function(def) {

      // group header
      if (def.type === 'group') {
        var grp = document.createElement('div');
        grp.style.cssText = 'font-family:"Noto Sans",sans-serif;font-size:9px;font-weight:800;letter-spacing:2.5px;color:rgba(34,211,238,0.45);padding:14px 0 6px;text-transform:uppercase;border-top:1px solid rgba(255,255,255,0.04);margin-top:4px;';
        grp.textContent = def.label;
        content.appendChild(grp);
        return;
      }

      // hotkey input row
      if (def.type === 'hotkey') {
        var hkRow = document.createElement('div');
        hkRow.className = 'ryu-sp-row';
        var hkLbl = document.createElement('div');
        hkLbl.className = 'ryu-sp-label';
        hkLbl.textContent = def.label;
        hkRow.appendChild(hkLbl);
        var hkCtrl = document.createElement('div');
        hkCtrl.className = 'ryu-sp-ctrl';

        var hkBox = document.createElement('div');
        var curKey = t[def.key] || def.def;
        hkBox.textContent = curKey || '\u2014';
        hkBox.title = 'Click then press a key';
        hkBox.style.cssText = 'background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:5px;padding:4px 14px;min-width:60px;text-align:center;cursor:pointer;font-size:11px;font-weight:700;color:rgba(34,211,238,0.8);letter-spacing:1px;font-family:"Noto Sans",sans-serif;user-select:none;transition:all 0.15s;';

        var _hkListening = false;

        hkBox.addEventListener('click', function() {
          if (_hkListening) return;
          _hkListening = true;
          hkBox.textContent = '...';
          hkBox.style.borderColor = '#22d3ee';
          hkBox.style.background = 'rgba(34,211,238,0.15)';

          function onKey(e) {
            e.preventDefault();
            e.stopPropagation();
            _hkListening = false;
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('mousedown', onMouse, true);

            var key = e.key.toUpperCase();
            if (key === 'ESCAPE') {
              hkBox.textContent = t[def.key] || def.def || '\u2014';
              hkBox.style.borderColor = 'rgba(34,211,238,0.2)';
              hkBox.style.background = 'rgba(34,211,238,0.08)';
              return;
            }

            // Check native CONTROLS keybinds for conflicts
            var conflict = null;
            document.querySelectorAll('.sm-row').forEach(function(row) {
              var nameEl = row.querySelector('.sm-setting-name');
              var bindEl = row.querySelector('.sm-control-input-box');
              if (!nameEl || !bindEl) return;
              var bindText = bindEl.textContent.trim().replace(/keyboard$/i, '').trim().toUpperCase();
              if (bindText === key) {
                conflict = nameEl.textContent.trim();
              }
            });

            // Also check our own RyuTheme hotkeys
            if (!conflict) {
              var ryuHotkeys = { hotkeyDisconnect: 'Disconnect', hotkeyEmote: 'Emote Panel', hotkeyDangerOverlay: 'Danger Overlay', hotkeyMinimalMode: 'Minimal Mode', hotkeyFreecam: 'Freecam' };
              var saved = loadT();
              Object.keys(ryuHotkeys).forEach(function(k) {
                if (k !== def.key && saved[k] && saved[k].toUpperCase() === key) {
                  conflict = 'RyuTheme: ' + ryuHotkeys[k];
                }
              });
            }

            if (conflict) {
              var popup = document.createElement('div');
              popup.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
              var popBox = document.createElement('div');
              popBox.style.cssText = 'background:#0d1117;border:1px solid rgba(232,25,44,0.4);border-radius:10px;padding:22px 26px;max-width:340px;text-align:center;font-family:"Noto Sans",sans-serif;box-shadow:0 0 30px rgba(232,25,44,0.2);';
              var popIcon = document.createElement('div');
              popIcon.textContent = '\u26a0';
              popIcon.style.cssText = 'font-size:26px;margin-bottom:10px;color:#e8192c;';
              var popMsg = document.createElement('div');
              popMsg.style.cssText = 'font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.6;';
              popMsg.innerHTML = 'Hotkey <span style="color:#22d3ee;font-weight:700;">' + key + '</span> is already being used for<br><span style="color:#e8192c;font-weight:700;">' + conflict + '</span>!<br><span style="color:rgba(255,255,255,0.5);font-size:11px;">Please choose another key.</span>';
              var popOk = document.createElement('button');
              popOk.textContent = 'OK';
              popOk.style.cssText = 'margin-top:16px;padding:7px 28px;background:transparent;border:1px solid rgba(34,211,238,0.3);border-radius:6px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;';
              popOk.addEventListener('click', function() { popup.remove(); });
              popBox.appendChild(popIcon);
              popBox.appendChild(popMsg);
              popBox.appendChild(popOk);
              popup.appendChild(popBox);
              document.body.appendChild(popup);
              hkBox.textContent = t[def.key] || def.def || '\u2014';
              hkBox.style.borderColor = 'rgba(34,211,238,0.2)';
              hkBox.style.background = 'rgba(34,211,238,0.08)';
              return;
            }

            saveT(def.key, key);
            t = loadT();
            hkBox.textContent = key;
            hkBox.style.borderColor = 'rgba(34,211,238,0.2)';
            hkBox.style.background = 'rgba(34,211,238,0.08)';
          }

          function onMouse(e) {
            // ignore left click (button 0) — that's used to dismiss listening
            if (e.button === 0) return;
            e.preventDefault();
            e.stopPropagation();
            _hkListening = false;
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('mousedown', onMouse, true);

            var mouseLabel = e.button === 2 ? 'RIGHTCLICK' : e.button === 1 ? 'MIDDLECLICK' : 'MOUSE' + e.button;
            saveT(def.key, mouseLabel);
            t = loadT();
            hkBox.textContent = mouseLabel;
            hkBox.style.borderColor = 'rgba(34,211,238,0.2)';
            hkBox.style.background = 'rgba(34,211,238,0.08)';
          }

          document.addEventListener('keydown', onKey, true);
          document.addEventListener('mousedown', onMouse, true);
        });

        hkCtrl.appendChild(hkBox);

        // Clear button — removes the saved hotkey
        var hkClear = document.createElement('div');
        hkClear.textContent = '\u2715';
        hkClear.style.cssText = 'margin-left:5px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.3);font-size:10px;border-radius:3px;transition:all 0.15s;flex-shrink:0;';
        hkClear.addEventListener('mouseenter', function() { hkClear.style.color = '#e8192c'; hkClear.style.background = 'rgba(232,25,44,0.1)'; });
        hkClear.addEventListener('mouseleave', function() { hkClear.style.color = 'rgba(255,255,255,0.3)'; hkClear.style.background = 'transparent'; });
        hkClear.addEventListener('click', function() {
          saveT(def.key, '');
          t = loadT();
          hkBox.textContent = '\u2014';
          hkBox.style.borderColor = 'rgba(34,211,238,0.2)';
          hkBox.style.background = 'rgba(34,211,238,0.08)';
        });

        var hkWrap = document.createElement('div');
        hkWrap.style.cssText = 'display:flex;align-items:center;';
        hkWrap.appendChild(hkBox);
        hkWrap.appendChild(hkClear);
        hkCtrl.appendChild(hkWrap);

        hkRow.appendChild(hkCtrl);
        content.appendChild(hkRow);
        return;
      }

      // animation delay — toggle + marker slider, mirrors popup.js implementation
      if (def.type === 'animSoften') {
        // toggle row
        var softenRow = document.createElement('div');
        softenRow.className = 'ryu-sp-row';
        var softenLbl = document.createElement('div');
        softenLbl.className = 'ryu-sp-label';
        softenLbl.textContent = 'Animation Delay';
        softenRow.appendChild(softenLbl);
        var softenCtrl = document.createElement('div');
        softenCtrl.className = 'ryu-sp-ctrl';
        var softenVal = t.animSoftenOn !== undefined ? !!t.animSoftenOn : false;
        var softenTog = document.createElement('div');
        softenTog.className = 'ryu-sp-toggle' + (softenVal ? ' ryu-sp-toggle-on' : '');
        var softenDot = document.createElement('div');
        softenDot.className = 'ryu-sp-toggle-dot';
        softenTog.appendChild(softenDot);
        softenTog.addEventListener('click', function() {
          var cur = softenTog.classList.contains('ryu-sp-toggle-on');
          softenTog.classList.toggle('ryu-sp-toggle-on', !cur);
          saveT('animSoftenOn', !cur);
          if (globalThis.__Q && globalThis.__Q.ELEMENT_ANIMATION_SOFTENING) {
            globalThis.__Q.ELEMENT_ANIMATION_SOFTENING._5738 = !cur
              ? (loadT().animSoftenVal ?? 80)
              : 80;
          }
        });
        softenCtrl.appendChild(softenTog);
        softenRow.appendChild(softenCtrl);
        content.appendChild(softenRow);

        // marker slider row — range 0-350, markers at native min (80) and max (300)
        var sliderWrap = document.createElement('div');
        sliderWrap.style.cssText = 'padding:4px 0 12px;';
        var sliderTop = document.createElement('div');
        sliderTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
        var sliderLbl = document.createElement('div');
        sliderLbl.className = 'ryu-sp-label';
        sliderLbl.style.fontSize = '11px';
        sliderLbl.textContent = 'Softening Value';
        var sliderValDisp = document.createElement('div');
        sliderValDisp.className = 'ryu-sp-val';
        var curSoftenVal = t.animSoftenVal !== undefined ? t.animSoftenVal : 80;
        sliderValDisp.textContent = curSoftenVal;
        sliderTop.appendChild(sliderLbl);
        sliderTop.appendChild(sliderValDisp);

        var trackWrap = document.createElement('div');
        trackWrap.style.cssText = 'position:relative;padding-bottom:18px;';

        var track = document.createElement('div');
        track.className = 'ryu-sp-track';
        track.style.width = '100%';
        var fill = document.createElement('div');
        fill.className = 'ryu-sp-fill';
        var pct = ((curSoftenVal - 0) / (350 - 0)) * 100;
        fill.style.width = pct + '%';
        var thumb = document.createElement('div');
        thumb.className = 'ryu-sp-thumb';
        fill.appendChild(thumb);
        track.appendChild(fill);

        // marker labels — 80 = game min, 300 = game max
        var markerWrap = document.createElement('div');
        markerWrap.style.cssText = 'position:relative;height:18px;margin-top:2px;';
        [{value:80,label:'80 — min'},{value:300,label:'300 — max'}].forEach(function(m) {
          var mpct = ((m.value - 0) / (350 - 0)) * 100;
          var tick = document.createElement('div');
          tick.style.cssText = 'position:absolute;left:' + mpct + '%;transform:translateX(-50%);top:0;width:1px;height:6px;background:rgba(255,255,255,0.2);';
          var markerLbl = document.createElement('div');
          markerLbl.style.cssText = 'position:absolute;left:' + mpct + '%;transform:translateX(-50%);top:8px;font-size:9px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,0.3);white-space:nowrap;font-family:"Noto Sans",sans-serif;';
          markerLbl.textContent = m.label;
          markerWrap.appendChild(tick);
          markerWrap.appendChild(markerLbl);
        });

        var _softenDrag = false;
        track.addEventListener('mousedown', function(e) {
          _softenDrag = true;
          applySoftenAt(e.clientX);
          e.preventDefault();
        });
        track.addEventListener('dragstart', function(e) { e.preventDefault(); });
        window.addEventListener('mousemove', function(e) { if (_softenDrag) applySoftenAt(e.clientX); });
        window.addEventListener('mouseup', function() { _softenDrag = false; });

        function applySoftenAt(clientX) {
          var r = track.getBoundingClientRect();
          if (!r.width) return;
          var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          var newVal = Math.round(0 + p * (350 - 0));
          fill.style.width = (p * 100) + '%';
          sliderValDisp.textContent = newVal;
          saveT('animSoftenVal', newVal);
          if (loadT().animSoftenOn && globalThis.__Q && globalThis.__Q.ELEMENT_ANIMATION_SOFTENING) {
            globalThis.__Q.ELEMENT_ANIMATION_SOFTENING._5738 = newVal;
          }
        }

        trackWrap.appendChild(track);
        trackWrap.appendChild(markerWrap);
        sliderWrap.appendChild(sliderTop);
        sliderWrap.appendChild(trackWrap);
        content.appendChild(sliderWrap);
        return; // skip normal row building below
      }

      if (def.type === 'sectorExpand') {
        var scOn = t[def.key] !== undefined ? !!t[def.key] : false;

        var scRow = document.createElement('div');
        scRow.className = 'ryu-sp-row';
        var scLbl = document.createElement('div');
        scLbl.className = 'ryu-sp-label';
        scLbl.textContent = 'World Sectors';
        scRow.appendChild(scLbl);
        var scCtrl = document.createElement('div');
        scCtrl.className = 'ryu-sp-ctrl';
        scCtrl.style.cssText = 'display:flex;align-items:center;gap:6px;';

        var scTog = document.createElement('div');
        scTog.className = 'ryu-sp-toggle' + (scOn ? ' ryu-sp-toggle-on' : '');
        var scDot = document.createElement('div');
        scDot.className = 'ryu-sp-toggle-dot';
        scTog.appendChild(scDot);
        scTog.addEventListener('click', function() {
          var cur = scTog.classList.contains('ryu-sp-toggle-on');
          scTog.classList.toggle('ryu-sp-toggle-on', !cur);
          saveT('sectorOverlayOn', !cur);
        });

        var scChev = document.createElement('div');
        scChev.style.cssText = 'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.35);font-size:9px;transition:transform 0.2s;flex-shrink:0;';
        scChev.textContent = '▼';

        scCtrl.appendChild(scTog);
        scCtrl.appendChild(scChev);
        scRow.appendChild(scCtrl);
        content.appendChild(scRow);

        // sub-panel
        var scSub = document.createElement('div');
        scSub.style.cssText = 'display:none;padding:2px 0 6px 8px;border-left:1px solid rgba(255,255,255,0.07);margin-left:4px;';

        // Sector Color
        (function() {
          var row = document.createElement('div');
          row.className = 'ryu-sp-row';
          row.style.cssText = 'padding:4px 0;min-height:28px;';
          var lbl = document.createElement('div');
          lbl.className = 'ryu-sp-label';
          lbl.style.fontSize = '11px';
          lbl.textContent = 'Sector Color';
          row.appendChild(lbl);
          var ctrl = document.createElement('div');
          ctrl.className = 'ryu-sp-ctrl';
          var swatch = document.createElement('div');
          swatch.className = 'ryu-sp-swatch';
          var curColor = t.sectorLabelColor || '#ffffff';
          swatch.style.background = curColor;
          swatch.style.position = 'relative';
          var colorIn = document.createElement('input');
          colorIn.type = 'color'; colorIn.value = curColor;
          colorIn.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
          swatch.appendChild(colorIn);
          swatch.addEventListener('click', function(e) { e.stopPropagation(); colorIn.click(); });
          colorIn.addEventListener('input', function() { swatch.style.background = colorIn.value; });
          colorIn.addEventListener('change', function() { swatch.style.background = colorIn.value; saveT('sectorLabelColor', colorIn.value); });
          ctrl.appendChild(swatch);
          row.appendChild(ctrl);
          scSub.appendChild(row);
        })();

        // Grid Color
        (function() {
          var row = document.createElement('div');
          row.className = 'ryu-sp-row';
          row.style.cssText = 'padding:4px 0;min-height:28px;';
          var lbl = document.createElement('div');
          lbl.className = 'ryu-sp-label';
          lbl.style.fontSize = '11px';
          lbl.textContent = 'Grid Color';
          row.appendChild(lbl);
          var ctrl = document.createElement('div');
          ctrl.className = 'ryu-sp-ctrl';
          var swatch = document.createElement('div');
          swatch.className = 'ryu-sp-swatch';
          var curColor = t.sectorGridColor || '#b4b4b4';
          swatch.style.background = curColor;
          swatch.style.position = 'relative';
          var colorIn = document.createElement('input');
          colorIn.type = 'color'; colorIn.value = curColor;
          colorIn.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
          swatch.appendChild(colorIn);
          swatch.addEventListener('click', function(e) { e.stopPropagation(); colorIn.click(); });
          colorIn.addEventListener('input', function() { swatch.style.background = colorIn.value; });
          colorIn.addEventListener('change', function() { swatch.style.background = colorIn.value; saveT('sectorGridColor', colorIn.value); });
          ctrl.appendChild(swatch);
          row.appendChild(ctrl);
          scSub.appendChild(row);
        })();

        // Sector Font
        (function() {
          var row = document.createElement('div');
          row.className = 'ryu-sp-row';
          row.style.cssText = 'padding:4px 0;min-height:28px;';
          var lbl = document.createElement('div');
          lbl.className = 'ryu-sp-label';
          lbl.style.fontSize = '11px';
          lbl.textContent = 'Sector Font';
          row.appendChild(lbl);
          var ctrl = document.createElement('div');
          ctrl.className = 'ryu-sp-ctrl';
          var curIdx = t.sectorFont || 0;
          var fdWrap = document.createElement('div');
          fdWrap.style.cssText = 'position:relative;';
          var fdBtn = document.createElement('div');
          var fdFontName = FONTS[curIdx] === 'Default' ? 'Noto Sans' : FONTS[curIdx];
          fdBtn.style.cssText = 'background:#1c2128;border:1px solid rgba(34,211,238,0.2);border-radius:5px;color:rgba(255,255,255,0.85);font-size:12px;padding:5px 28px 5px 8px;cursor:pointer;min-width:120px;position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          fdBtn.style.fontFamily = '"' + fdFontName + '", sans-serif';
          fdBtn.textContent = FONTS[curIdx];
          var fdChev = document.createElement('div');
          fdChev.style.cssText = 'position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(255,255,255,0.4);font-size:9px;';
          fdChev.textContent = '▾';
          fdBtn.appendChild(fdChev);
          var fdDrop = document.createElement('div');
          fdDrop.style.cssText = 'display:none;position:fixed;z-index:999999;background:#1c2128;border:1px solid rgba(34,211,238,0.2);border-radius:6px;overflow-y:auto;max-height:220px;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.6);';
          FONTS.forEach(function(opt, i) {
            var fi = document.createElement('div');
            var fFamily = opt === 'Default' ? '"Noto Sans", sans-serif' : '"' + opt + '", sans-serif';
            fi.style.cssText = 'padding:7px 10px;cursor:pointer;font-size:13px;color:rgba(255,255,255,0.8);white-space:nowrap;transition:background 0.1s;';
            fi.style.fontFamily = fFamily;
            fi.textContent = opt;
            if (i === curIdx) fi.style.color = '#22d3ee';
            fi.addEventListener('mouseenter', function() { fi.style.background = 'rgba(34,211,238,0.08)'; });
            fi.addEventListener('mouseleave', function() { fi.style.background = ''; });
            fi.addEventListener('click', function() {
              curIdx = i;
              fdBtn.style.fontFamily = fFamily;
              fdBtn.childNodes[0].textContent = opt;
              fdDrop.style.display = 'none';
              fdDrop.querySelectorAll('div').forEach(function(d) { d.style.color = 'rgba(255,255,255,0.8)'; });
              fi.style.color = '#22d3ee';
              saveT('sectorFont', i);
            });
            fdDrop.appendChild(fi);
          });
          fdBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = fdDrop.style.display !== 'none';
            document.querySelectorAll('.ryu-font-drop').forEach(function(d) { d.style.display = 'none'; });
            if (!isOpen) {
              fdDrop.style.display = 'block';
              var r = fdBtn.getBoundingClientRect();
              fdDrop.style.left = r.left + 'px';
              fdDrop.style.top = (r.bottom + 2) + 'px';
              fdDrop.style.width = Math.max(r.width, 160) + 'px';
            }
          });
          fdDrop.className = 'ryu-font-drop';
          document.addEventListener('click', function() { fdDrop.style.display = 'none'; });
          fdWrap.appendChild(fdBtn);
          document.body.appendChild(fdDrop);
          ctrl.appendChild(fdWrap);
          row.appendChild(ctrl);
          scSub.appendChild(row);
        })();

        content.appendChild(scSub);

        var _scOpen = false;
        scChev.addEventListener('click', function() {
          _scOpen = !_scOpen;
          scSub.style.display = _scOpen ? 'block' : 'none';
          scChev.style.transform = _scOpen ? 'rotate(180deg)' : '';
          scChev.style.color = _scOpen ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.35)';
        });

        return;
      }

      if (def.type === 'minimalExpand') {
        var mmOn = t[def.key] !== undefined ? !!t[def.key] : false;

        // main row
        var mmRow = document.createElement('div');
        mmRow.className = 'ryu-sp-row';
        var mmLbl = document.createElement('div');
        mmLbl.className = 'ryu-sp-label';
        mmLbl.textContent = 'Minimal Mode';
        mmRow.appendChild(mmLbl);
        var mmCtrl = document.createElement('div');
        mmCtrl.className = 'ryu-sp-ctrl';
        mmCtrl.style.cssText = 'display:flex;align-items:center;gap:6px;';

        var mmTog = document.createElement('div');
        mmTog.className = 'ryu-sp-toggle' + (mmOn ? ' ryu-sp-toggle-on' : '');
        var mmDot = document.createElement('div');
        mmDot.className = 'ryu-sp-toggle-dot';
        mmTog.appendChild(mmDot);
        mmTog.addEventListener('click', function() {
          var cur = mmTog.classList.contains('ryu-sp-toggle-on');
          mmTog.classList.toggle('ryu-sp-toggle-on', !cur);
          saveT('minimalModeOn', !cur);
        });

        var mmChev = document.createElement('div');
        mmChev.style.cssText = 'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.35);font-size:9px;transition:transform 0.2s;flex-shrink:0;';
        mmChev.textContent = '▼';

        mmCtrl.appendChild(mmTog);
        mmCtrl.appendChild(mmChev);
        mmRow.appendChild(mmCtrl);
        content.appendChild(mmRow);

        // sub-panel
        var mmSub = document.createElement('div');
        mmSub.style.cssText = 'display:none;padding:2px 0 6px 8px;border-left:1px solid rgba(255,255,255,0.07);margin-left:4px;';

        var mmSubDefs = [
          { label: 'Hide LB',           key: 'mmHideLB',           def: true },
          { label: 'Hide Chat',         key: 'mmHideChat',         def: true },
          { label: 'Hide Minimap',      key: 'mmHideMinimap',      def: true },
          { label: 'Hide enemy names',  key: 'mmHideEnemyNames',   def: false },
          { label: 'Hide own name',     key: 'mmHideOwnName',      def: false }
        ];

        mmSubDefs.forEach(function(sd) {
          var subVal = t[sd.key] !== undefined ? !!t[sd.key] : sd.def;
          var subRow = document.createElement('div');
          subRow.className = 'ryu-sp-row';
          subRow.style.cssText = 'padding:4px 0;min-height:28px;';
          var subLbl = document.createElement('div');
          subLbl.className = 'ryu-sp-label';
          subLbl.style.fontSize = '11px';
          subLbl.textContent = sd.label;
          subRow.appendChild(subLbl);
          var subCtrl = document.createElement('div');
          subCtrl.className = 'ryu-sp-ctrl';
          var subTog = document.createElement('div');
          subTog.className = 'ryu-sp-toggle' + (subVal ? ' ryu-sp-toggle-on' : '');
          var subDot = document.createElement('div');
          subDot.className = 'ryu-sp-toggle-dot';
          subTog.appendChild(subDot);
          subTog.addEventListener('click', function() {
            var cur = subTog.classList.contains('ryu-sp-toggle-on');
            subTog.classList.toggle('ryu-sp-toggle-on', !cur);
            saveT(sd.key, !cur);
          });
          subCtrl.appendChild(subTog);
          subRow.appendChild(subCtrl);
          mmSub.appendChild(subRow);
        });

        content.appendChild(mmSub);

        var _mmOpen = false;
        mmChev.addEventListener('click', function() {
          _mmOpen = !_mmOpen;
          mmSub.style.display = _mmOpen ? 'block' : 'none';
          mmChev.style.transform = _mmOpen ? 'rotate(180deg)' : '';
          mmChev.style.color = _mmOpen ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.35)';
        });

        return;
      }

      if (def.type === 'pelletExpand') {
        var pEmojiOn = t.pelletEmojiOn !== undefined ? !!t.pelletEmojiOn : t.pelletStyle === 1;
        var pImgurOn = t.pelletImgurOn !== undefined ? !!t.pelletImgurOn : t.pelletStyle === 2;
        if (pImgurOn) pEmojiOn = false;

        var pRow = document.createElement('div');
        pRow.className = 'ryu-sp-row';
        var pLbl = document.createElement('div');
        pLbl.className = 'ryu-sp-label';
        pLbl.textContent = 'Pellet Skins';
        pRow.appendChild(pLbl);
        var pCtrl = document.createElement('div');
        pCtrl.className = 'ryu-sp-ctrl';
        pCtrl.style.cssText = 'display:flex;align-items:center;gap:6px;';

        var pState = document.createElement('div');
        pState.style.cssText = 'font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:800;letter-spacing:1px;color:rgba(255,255,255,0.55);min-width:44px;text-align:right;text-transform:uppercase;';

        var pChev = document.createElement('div');
        pChev.style.cssText = 'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.35);font-size:9px;transition:transform 0.2s;flex-shrink:0;';
        pChev.textContent = '\u25BC';

        pCtrl.appendChild(pState);
        pCtrl.appendChild(pChev);
        pRow.appendChild(pCtrl);
        content.appendChild(pRow);

        var pSub = document.createElement('div');
        pSub.style.cssText = 'display:none;padding:2px 0 6px 8px;border-left:1px solid rgba(255,255,255,0.07);margin-left:4px;';

        function savePelletMode(mode) {
          var pt = loadT();
          pt.pelletEmojiOn = mode === 'emoji';
          pt.pelletImgurOn = mode === 'imgur';
          pt.pelletStyle = pt.pelletImgurOn ? 2 : (pt.pelletEmojiOn ? 1 : 0);
          localStorage.setItem('ryuTheme', JSON.stringify(pt));
          globalThis.__ryuPelletStyle = pt.pelletStyle;
          if (globalThis.__ryuRefreshAll) globalThis.__ryuRefreshAll();
          refreshPelletControls();
        }

        function makeToggleRow(label, mode) {
          var row = document.createElement('div');
          row.className = 'ryu-sp-row';
          row.style.cssText = 'padding:4px 0;min-height:28px;';
          var lbl = document.createElement('div');
          lbl.className = 'ryu-sp-label';
          lbl.style.fontSize = '11px';
          lbl.textContent = label;
          row.appendChild(lbl);
          var ctrl = document.createElement('div');
          ctrl.className = 'ryu-sp-ctrl';
          var tog = document.createElement('div');
          tog.className = 'ryu-sp-toggle';
          var dot = document.createElement('div');
          dot.className = 'ryu-sp-toggle-dot';
          tog.appendChild(dot);
          tog.addEventListener('click', function() {
            var on = tog.classList.contains('ryu-sp-toggle-on');
            savePelletMode(on ? 'default' : mode);
          });
          ctrl.appendChild(tog);
          row.appendChild(ctrl);
          pSub.appendChild(row);
          return tog;
        }

        var pEmojiTog = makeToggleRow('Use Emoji', 'emoji');
        var pImgurTog = makeToggleRow('Use Imgur Skin', 'imgur');

        function makeTextRow(label, key, def, placeholder, maxLength) {
          var row = document.createElement('div');
          row.className = 'ryu-sp-row';
          row.style.cssText = 'padding:4px 0;min-height:28px;';
          var lbl = document.createElement('div');
          lbl.className = 'ryu-sp-label';
          lbl.style.fontSize = '11px';
          lbl.textContent = label;
          row.appendChild(lbl);
          var ctrl = document.createElement('div');
          ctrl.className = 'ryu-sp-ctrl';
          var inp = document.createElement('input');
          inp.className = 'ryu-sp-input';
          inp.value = t[key] || def;
          if (maxLength) inp.maxLength = maxLength;
          inp.placeholder = placeholder;
          inp.addEventListener('input', function() { saveT(key, inp.value); });
          ctrl.appendChild(inp);
          row.appendChild(ctrl);
          pSub.appendChild(row);
        }

        makeTextRow('Emoji', 'pelletEmoji', '\uD83D\uDD25', 'Emoji...', 8);
        makeTextRow('Imgur Link', 'pelletImgur', '', 'https://i.imgur.com/qCpPCOk.png');

        function refreshPelletControls() {
          var pt = loadT();
          var emojiOn = !!pt.pelletEmojiOn;
          var imgurOn = !!pt.pelletImgurOn;
          pEmojiTog.classList.toggle('ryu-sp-toggle-on', emojiOn && !imgurOn);
          pImgurTog.classList.toggle('ryu-sp-toggle-on', imgurOn);
          pState.textContent = imgurOn ? 'Imgur' : (emojiOn ? 'Emoji' : 'Off');
          pState.style.color = imgurOn ? '#22d3ee' : (emojiOn ? 'rgba(34,211,238,0.72)' : 'rgba(255,255,255,0.35)');
        }

        refreshPelletControls();
        content.appendChild(pSub);

        var _pOpen = false;
        pChev.addEventListener('click', function() {
          _pOpen = !_pOpen;
          pSub.style.display = _pOpen ? 'block' : 'none';
          pChev.style.transform = _pOpen ? 'rotate(180deg)' : '';
          pChev.style.color = _pOpen ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.35)';
        });

        return;
      }

      if (def.type === 'teamColorExpand') {
        var tcColors = JSON.parse(localStorage.getItem('ryuTeamColors') || '{}');

        var tcRow = document.createElement('div');
        tcRow.className = 'ryu-sp-row';
        var tcLbl = document.createElement('div');
        tcLbl.className = 'ryu-sp-label';
        tcLbl.textContent = 'Team Cell Colors';
        tcRow.appendChild(tcLbl);
        var tcCtrl = document.createElement('div');
        tcCtrl.className = 'ryu-sp-ctrl';
        tcCtrl.style.cssText = 'display:flex;align-items:center;gap:6px;';

        var tcChev = document.createElement('div');
        tcChev.style.cssText = 'width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.35);font-size:9px;transition:transform 0.2s;flex-shrink:0;';
        tcChev.textContent = '▼';
        tcCtrl.appendChild(tcChev);
        tcRow.appendChild(tcCtrl);
        content.appendChild(tcRow);

        var tcSub = document.createElement('div');
        tcSub.style.cssText = 'display:none;padding:2px 0 6px 8px;border-left:1px solid rgba(255,255,255,0.07);margin-left:4px;';

        function buildTeamColorList() {
          tcSub.innerHTML = '';
          var myTag = window.__Be && window.__Be._1059 ? window.__Be._1059._9067 : '';
          var players = [];
          if (myTag && window.__ne && window.__ne._4221) {
            window.__ne._4221.forEach(function(v) {
              if (v._1059 && v._1059._9067 === myTag) {
                var name = v._1059._6988;
                if (name && players.indexOf(name) === -1) players.push(name);
              }
            });
          }

          if (players.length === 0) {
            var emptyRow = document.createElement('div');
            emptyRow.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.35);padding:4px 0;';
            emptyRow.textContent = 'No tag members found';
            tcSub.appendChild(emptyRow);
          } else {
            players.forEach(function(name) {
              var savedColor = tcColors[name] || '#ffffff';
              var pRow = document.createElement('div');
              pRow.className = 'ryu-sp-row';
              pRow.style.cssText = 'padding:4px 0;min-height:28px;';
              var pLbl = document.createElement('div');
              pLbl.className = 'ryu-sp-label';
              pLbl.style.fontSize = '11px';
              pLbl.textContent = name;
              pRow.appendChild(pLbl);
              var pCtrl = document.createElement('div');
              pCtrl.className = 'ryu-sp-ctrl';
              var pInput = document.createElement('input');
              pInput.type = 'color';
              pInput.value = savedColor;
              pInput.style.cssText = 'width:28px;height:20px;border:none;background:none;cursor:pointer;padding:0;';
              pInput.addEventListener('input', function() {
                tcColors[name] = pInput.value;
                localStorage.setItem('ryuTeamColors', JSON.stringify(tcColors));
                if (window.__ryuTeamColors) window.__ryuTeamColors[name] = pInput.value;
              });
              pCtrl.appendChild(pInput);
              pRow.appendChild(pCtrl);
              tcSub.appendChild(pRow);
            });
          }

          // refresh button
          var refRow = document.createElement('div');
          refRow.style.cssText = 'padding:4px 0;';
          var refBtn = document.createElement('div');
          refBtn.style.cssText = 'font-size:10px;color:rgba(34,211,238,0.7);cursor:pointer;';
          refBtn.textContent = '↺ Refresh members';
          refBtn.addEventListener('click', buildTeamColorList);
          refRow.appendChild(refBtn);
          tcSub.appendChild(refRow);
        }

        buildTeamColorList();
        content.appendChild(tcSub);

        var _tcOpen = false;
        tcChev.addEventListener('click', function() {
          _tcOpen = !_tcOpen;
          if (_tcOpen) buildTeamColorList();
          tcSub.style.display = _tcOpen ? 'block' : 'none';
          tcChev.style.transform = _tcOpen ? 'rotate(180deg)' : '';
          tcChev.style.color = _tcOpen ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.35)';
        });

        return;
      }
      var row = document.createElement('div');
      row.className = 'ryu-sp-row';
      var lbl = document.createElement('div');
      lbl.className = 'ryu-sp-label';
      lbl.textContent = def.label;
      row.appendChild(lbl);
      var ctrl = document.createElement('div');
      ctrl.className = 'ryu-sp-ctrl';

      if (def.type === 'toggle') {
        var val = t[def.key] !== undefined ? !!t[def.key] : def.def;
        var tog = document.createElement('div');
        tog.className = 'ryu-sp-toggle' + (val ? ' ryu-sp-toggle-on' : '');
        var dot = document.createElement('div');
        dot.className = 'ryu-sp-toggle-dot';
        tog.appendChild(dot);
        tog.addEventListener('click', function() {
          var cur = tog.classList.contains('ryu-sp-toggle-on');
          tog.classList.toggle('ryu-sp-toggle-on', !cur);
          saveT(def.key, !cur);
        });
        ctrl.appendChild(tog);

      } else if (def.type === 'color') {
        var curColor = t[def.key] || def.def;
        var swatch = document.createElement('div');
        swatch.className = 'ryu-sp-swatch';
        swatch.style.background = curColor;
        swatch.style.position = 'relative';
        var colorIn = document.createElement('input');
        colorIn.type = 'color'; colorIn.value = curColor;
        colorIn.style.cssText = 'position:absolute;opacity:0;width:0;height:0;pointer-events:none;';
        swatch.appendChild(colorIn);
        swatch.addEventListener('click', function(e) { e.stopPropagation(); colorIn.click(); });
        colorIn.addEventListener('input', function() {
          swatch.style.background = colorIn.value;
          saveT(def.key, colorIn.value);
          // Live updates for specific keys
          var hexInt = parseInt(colorIn.value.replace('#',''), 16);
          if (def.key === 'color') {
            globalThis.__ryuNameTint = hexInt === 0 ? 0x010101 : hexInt;
          } else if (def.key === 'massColor') {
            globalThis.__ryuMassTint = hexInt === 0 ? 0x010101 : hexInt;
          }
        });
        colorIn.addEventListener('change', function() {
          swatch.style.background = colorIn.value;
          saveT(def.key, colorIn.value);
        });
        ctrl.appendChild(swatch);

      } else if (def.type === 'text') {
        var inp = document.createElement('input');
        inp.className = 'ryu-sp-input';
        inp.value = t[def.key] || def.def;
        if (def.maxLength) inp.maxLength = def.maxLength;
        inp.placeholder = def.placeholder || 'Enter text...';
        inp.addEventListener('input', function() { saveT(def.key, inp.value); });
        ctrl.appendChild(inp);

      } else if (def.type === 'teamtag') {
        var ttWrap = document.createElement('div');
        ttWrap.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;';
        var ttInp = document.createElement('input');
        ttInp.className = 'ryu-sp-input';
        ttInp.style.flex = '1';
        ttInp.maxLength = 10;
        ttInp.placeholder = 'e.g. LOL';
        var _ryuTagEl = document.getElementById('ryu-tag-input');
        var _nativeTagEl = document.getElementById('team-input');
        ttInp.value = (_ryuTagEl && _ryuTagEl.value) || (_nativeTagEl && _nativeTagEl.value) || '';
        var ttBtn = document.createElement('button');
        ttBtn.textContent = 'Set';
        ttBtn.style.cssText = 'background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.25);border-radius:5px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:700;padding:4px 10px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px;';
        ttBtn.addEventListener('mouseenter', function() { ttBtn.style.background = 'rgba(34,211,238,0.16)'; });
        ttBtn.addEventListener('mouseleave', function() { ttBtn.style.background = 'rgba(34,211,238,0.08)'; });
        function applyTeamTag(val) {
          if (globalThis.__ryuSetTag) globalThis.__ryuSetTag(val);
          var nte = document.getElementById('team-input');
          var rte = document.getElementById('ryu-tag-input');
          if (nte) {
            nte.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            nte.value = val;
            nte.dispatchEvent(new Event('input',  { bubbles: true }));
            nte.dispatchEvent(new Event('change', { bubbles: true }));
            nte.dispatchEvent(new FocusEvent('blur',   { bubbles: true }));
          }
          if (rte) rte.value = val;
          ttBtn.textContent = '\u2713';
          setTimeout(function() { ttBtn.textContent = 'Set'; }, 1200);
        }
        ttBtn.addEventListener('click', function() { applyTeamTag(ttInp.value); });
        ttInp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); applyTeamTag(ttInp.value); }
        });
        ttWrap.appendChild(ttInp);
        ttWrap.appendChild(ttBtn);
        ctrl.appendChild(ttWrap);

      } else if (def.type === 'cycle') {
        var cycleVal = t[def.key] !== undefined ? t[def.key] : def.def;
        var cycleWrap = document.createElement('div');
        cycleWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
        var mkCycleBtn = function(symbol) {
          var b = document.createElement('button');
          b.textContent = symbol;
          b.style.cssText = 'background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.18);border-radius:4px;color:rgba(34,211,238,0.7);font-size:12px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;';
          return b;
        };
        var cyclePrev = mkCycleBtn('\u2039');
        var cycleNext = mkCycleBtn('\u203a');
        var cycleLbl = document.createElement('div');
        cycleLbl.style.cssText = 'font-family:"Noto Sans",sans-serif;font-size:11px;color:rgba(255,255,255,0.75);min-width:40px;text-align:center;';
        var _cycleIdx = def.options.indexOf(cycleVal);
        if (_cycleIdx < 0) _cycleIdx = 0;
        cycleLbl.textContent = def.options[_cycleIdx];
        function updateCycle(newIdx) {
          _cycleIdx = ((newIdx % def.options.length) + def.options.length) % def.options.length;
          cycleLbl.textContent = def.options[_cycleIdx];
          saveT(def.key, def.options[_cycleIdx]);
        }
        cyclePrev.addEventListener('click', function() { updateCycle(_cycleIdx - 1); });
        cycleNext.addEventListener('click', function() { updateCycle(_cycleIdx + 1); });
        cycleWrap.appendChild(cyclePrev);
        cycleWrap.appendChild(cycleLbl);
        cycleWrap.appendChild(cycleNext);
        ctrl.appendChild(cycleWrap);

      } else if (def.type === 'fontupdate') {
        var fuWrap = document.createElement('div');
        fuWrap.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;';
        var fuBtn = document.createElement('button');
        fuBtn.textContent = 'Update';
        fuBtn.style.cssText = 'background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.25);border-radius:5px;color:#22d3ee;font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:700;padding:4px 10px;cursor:pointer;flex-shrink:0;letter-spacing:0.5px;';
        fuBtn.addEventListener('mouseenter', function() { fuBtn.style.background = 'rgba(34,211,238,0.16)'; });
        fuBtn.addEventListener('mouseleave', function() { fuBtn.style.background = 'rgba(34,211,238,0.08)'; });
        fuBtn.addEventListener('click', function() {
          if (globalThis.__ryuForceAtlasClear) globalThis.__ryuForceAtlasClear();
          fuBtn.textContent = '✓ Done';
          setTimeout(function() { fuBtn.textContent = 'Update'; }, 1500);
        });
        var fuHint = document.createElement('span');
        fuHint.textContent = 'If some names didn\'t update, click this';
        fuHint.style.cssText = 'font-family:"Noto Sans",sans-serif;font-size:11px;color:rgba(255,255,255,0.75);line-height:1.3;';
        fuWrap.appendChild(fuBtn);
        fuWrap.appendChild(fuHint);
        ctrl.appendChild(fuWrap);

      } else if (def.type === 'select') {
        var curIdx = t[def.key] !== undefined ? t[def.key] : def.def;
        curIdx = parseInt(curIdx, 10);
        if (isNaN(curIdx) || curIdx < 0 || curIdx >= def.options.length) curIdx = def.def || 0;

        // font keys get a custom preview dropdown
        var isFontSelect = (def.key === 'fontIndex' || def.key === 'massFont');
        if (isFontSelect) {
          var GFONTS = ['Orbitron','Audiowide','Oxanium','Exo+2','Quantico','Nova+Square',
            'Bebas+Neue','Oswald','Russo+One','Black+Ops+One','Teko','Barlow+Condensed',
            'Boogaloo','Fredoka+One','Permanent+Marker','Bangers','Righteous','Lilita+One',
            'Press+Start+2P','Creepster','Abril+Fatface','Pacifico','Lobster','Monoton',
            'Faster+One','Gugi','Silkscreen','VT323'];
          // inject google fonts link once
          if (!document.getElementById('ryu-gfonts-link')) {
            var gfl = document.createElement('link');
            gfl.id = 'ryu-gfonts-link';
            gfl.rel = 'stylesheet';
            gfl.href = 'https://fonts.googleapis.com/css2?family=' + GFONTS.join('&family=') + '&display=swap';
            document.head.appendChild(gfl);
          }

          var fdWrap = document.createElement('div');
          fdWrap.style.cssText = 'position:relative;';

          var fdBtn = document.createElement('div');
          var fdFontName = def.options[curIdx] === 'Default' ? 'Noto Sans' : def.options[curIdx];
          fdBtn.style.cssText = 'background:#1c2128;border:1px solid rgba(34,211,238,0.2);border-radius:5px;color:rgba(255,255,255,0.85);font-size:12px;padding:5px 28px 5px 8px;cursor:pointer;min-width:140px;position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          fdBtn.style.fontFamily = '"' + fdFontName + '", sans-serif';
          fdBtn.textContent = def.options[curIdx];

          // chevron
          var fdChev = document.createElement('div');
          fdChev.style.cssText = 'position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;color:rgba(255,255,255,0.4);font-size:9px;';
          fdChev.textContent = '▾';
          fdBtn.appendChild(fdChev);

          var fdDrop = document.createElement('div');
          fdDrop.style.cssText = 'display:none;position:fixed;z-index:999999;background:#1c2128;border:1px solid rgba(34,211,238,0.2);border-radius:6px;overflow-y:auto;max-height:220px;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.6);';

          def.options.forEach(function(opt, i) {
            var fi = document.createElement('div');
            var fFamily = opt === 'Default' ? '"Noto Sans", sans-serif' : '"' + opt + '", sans-serif';
            fi.style.cssText = 'padding:7px 10px;cursor:pointer;font-size:13px;color:rgba(255,255,255,0.8);white-space:nowrap;transition:background 0.1s;';
            fi.style.fontFamily = fFamily;
            fi.textContent = opt;
            if (i === curIdx) fi.style.color = '#22d3ee';
            fi.addEventListener('mouseenter', function() { fi.style.background = 'rgba(34,211,238,0.08)'; });
            fi.addEventListener('mouseleave', function() { fi.style.background = ''; });
            fi.addEventListener('click', function() {
              curIdx = i;
              fdBtn.style.fontFamily = fFamily;
              fdBtn.childNodes[0].textContent = opt;
              fdDrop.style.display = 'none';
              fdDrop.querySelectorAll('div').forEach(function(d) { d.style.color = 'rgba(255,255,255,0.8)'; });
              fi.style.color = '#22d3ee';
              saveT(def.key, i);
              if (globalThis.__ryuRedrawName) globalThis.__ryuRedrawName();
            });
            fdDrop.appendChild(fi);
          });

          fdBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = fdDrop.style.display !== 'none';
            // close all other dropdowns
            document.querySelectorAll('.ryu-font-drop').forEach(function(d) { d.style.display = 'none'; });
            if (!isOpen) {
              fdDrop.style.display = 'block';
              var r = fdBtn.getBoundingClientRect();
              fdDrop.style.left = r.left + 'px';
              fdDrop.style.top = (r.bottom + 2) + 'px';
              fdDrop.style.width = Math.max(r.width, 180) + 'px';
            }
          });
          fdDrop.className = 'ryu-font-drop';
          document.addEventListener('click', function() { fdDrop.style.display = 'none'; });

          fdWrap.appendChild(fdBtn);
          document.body.appendChild(fdDrop);
          ctrl.appendChild(fdWrap);

        } else {
          // normal select for non-font options
          var sel = document.createElement('select');
          sel.style.cssText = 'background:#1c2128;border:1px solid rgba(34,211,238,0.2);border-radius:5px;color:rgba(255,255,255,0.7);font-family:"Noto Sans",sans-serif;font-size:11px;padding:5px 8px;outline:none;cursor:pointer;';
          def.options.forEach(function(opt, i) {
            var o = document.createElement('option');
            o.value = i;
            o.textContent = opt;
            if (i === curIdx) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener('change', function() {
            var idx = parseInt(sel.value);
            saveT(def.key, idx);
            if (def.key === 'cursorIdx' && window.__ryuApplyCursor) {
              var CURSOR_EMOJIS = [null,'🎯','⚔️','💀','🔥','⭐','👁️','💎','🩸','⚡','🌀','🕹️','🌙','🍀','🦋','🐉','🎃','🧠','🪄','🔮','🗡️','🥷','👽','🤖','🌊','🧊','☠️'];
              window.__ryuApplyCursor(idx > 0 ? (CURSOR_EMOJIS[idx] || null) : null);
            }
          });
          ctrl.appendChild(sel);
        }

      } else if (def.type === 'slider') {
        var curVal = t[def.key] !== undefined ? t[def.key] : def.def;
        var sliderWrap = document.createElement('div');
        sliderWrap.style.cssText = 'display:flex;align-items:center;gap:8px;';
        var track = document.createElement('div');
        track.className = 'ryu-sp-track';
        var pct = ((curVal - def.min) / (def.max - def.min)) * 100;
        var fill = document.createElement('div');
        fill.className = 'ryu-sp-fill';
        fill.style.width = pct + '%';
        var thumb = document.createElement('div');
        thumb.className = 'ryu-sp-thumb';
        fill.appendChild(thumb);
        track.appendChild(fill);
        var valDisp = document.createElement('div');
        valDisp.className = 'ryu-sp-val';
        valDisp.textContent = curVal;
        var _drag = false;
        track.addEventListener('mousedown', function(e) {
          _drag = true;
          applySlider(e.clientX);
          e.preventDefault();
        });
        track.addEventListener('dragstart', function(e) { e.preventDefault(); });
        window.addEventListener('mousemove', function(e) { if (_drag) applySlider(e.clientX); });
        window.addEventListener('mouseup',   function()  { _drag = false; });
        function applySlider(clientX) {
          var r = track.getBoundingClientRect();
          if (!r.width) return;
          var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          var newVal = Math.round(def.min + p * (def.max - def.min));
          fill.style.width = (p * 100) + '%';
          valDisp.textContent = newVal;
          saveT(def.key, newVal);
        }
        sliderWrap.appendChild(track);
        sliderWrap.appendChild(valDisp);
        ctrl.appendChild(sliderWrap);

      } else if (def.type === 'scaleslider') {
        var ssRaw = t[def.key] !== undefined ? t[def.key] : def.def;
        // stored as decimal (1.5) or integer (150) — normalise to integer pct
        var ssVal = ssRaw > 10 ? ssRaw : Math.round(ssRaw * 100);
        var ssWrap = document.createElement('div');
        ssWrap.style.cssText = 'display:flex;align-items:center;gap:8px;';
        var ssTrack = document.createElement('div');
        ssTrack.className = 'ryu-sp-track';
        var ssPct = ((ssVal - def.min) / (def.max - def.min)) * 100;
        var ssFill = document.createElement('div');
        ssFill.className = 'ryu-sp-fill';
        ssFill.style.width = ssPct + '%';
        var ssThumb = document.createElement('div');
        ssThumb.className = 'ryu-sp-thumb';
        ssFill.appendChild(ssThumb);
        ssTrack.appendChild(ssFill);
        var ssDisp = document.createElement('div');
        ssDisp.className = 'ryu-sp-val';
        ssDisp.textContent = ssVal + '%';
        var _ssDrag = false;
        ssTrack.addEventListener('mousedown', function(e) {
          _ssDrag = true;
          applySS(e.clientX);
          e.preventDefault();
        });
        ssTrack.addEventListener('dragstart', function(e) { e.preventDefault(); });
        window.addEventListener('mousemove', function(e) { if (_ssDrag) applySS(e.clientX); });
        window.addEventListener('mouseup',   function()  { _ssDrag = false; });
        function applySS(clientX) {
          var r = ssTrack.getBoundingClientRect();
          if (!r.width) return;
          var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          var steps = Math.round(p * (def.max - def.min) / def.step);
          var newVal = def.min + steps * def.step;
          newVal = Math.max(def.min, Math.min(def.max, newVal));
          ssFill.style.width = ((newVal - def.min) / (def.max - def.min) * 100) + '%';
          ssDisp.textContent = newVal + '%';
          // store as decimal multiplier e.g. 150 → 1.5
          saveT(def.key, newVal / 100);
        }
        ssWrap.appendChild(ssTrack);
        ssWrap.appendChild(ssDisp);
        ctrl.appendChild(ssWrap);

      } else if (def.type === 'scale') {
        var scaleVal = t[def.key] !== undefined ? t[def.key] : 50;
        var scaleWrap = document.createElement('div');
        scaleWrap.style.cssText = 'display:flex;align-items:center;gap:8px;min-width:160px;';

        var scaleTrack = document.createElement('div');
        scaleTrack.className = 'ryu-sp-track';
        scaleTrack.style.width = '120px';
        var scaleFill = document.createElement('div');
        scaleFill.className = 'ryu-sp-fill';
        scaleFill.style.width = scaleVal + '%';
        var scaleThumb = document.createElement('div');
        scaleThumb.className = 'ryu-sp-thumb';
        scaleFill.appendChild(scaleThumb);
        scaleTrack.appendChild(scaleFill);

        var scaleValDisp = document.createElement('div');
        scaleValDisp.className = 'ryu-sp-val';
        scaleValDisp.textContent = scaleVal;

        var _scaleDrag = false;
        scaleTrack.addEventListener('mousedown', function(e) {
          _scaleDrag = true;
          applyScaleAt(e.clientX);
          e.preventDefault();
        });
        scaleTrack.addEventListener('dragstart', function(e) { e.preventDefault(); });
        window.addEventListener('mousemove', function(e) { if (_scaleDrag) applyScaleAt(e.clientX); });
        window.addEventListener('mouseup', function() { _scaleDrag = false; });

        function applyScaleAt(clientX) {
          var r = scaleTrack.getBoundingClientRect();
          if (!r.width) return;
          var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          var newVal = Math.round(p * 100);
          scaleFill.style.width = newVal + '%';
          scaleValDisp.textContent = newVal;
          saveT(def.key, newVal);
        }

        scaleWrap.appendChild(scaleTrack);
        scaleWrap.appendChild(scaleValDisp);
        ctrl.appendChild(scaleWrap);
      }

      row.appendChild(ctrl);
      content.appendChild(row);
    });
  }

})();

  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',__ryuRun);
  } else {
    __ryuRun();
  }
})();
