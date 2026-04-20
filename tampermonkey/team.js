/* team.js — auto-deferred for Tampermonkey */
(function(){
  function __ryuRun(){
// team panel UI

(function () {
  'use strict';

  const STYLE_ID  = 'ryu-team-style';
  const PANEL_ID  = 'ryu-team-panel';
  const STORAGE_KEY = 'ryuTheme';

  let _applied = false;
  let _observer = null;

  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function applyStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      #team-info { display: none !important; }

      #ryu-team-panel {
        position: fixed;
        top: 18px;
        left: 18px;
        z-index: 9999;
        width: 200px;
        font-family: 'Noto Sans', sans-serif;
        background: rgba(9,13,18,0.95);
        border: 1px solid rgba(34,211,238,0.15);
        border-radius: 6px;
        overflow: hidden;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.22s ease;
      }

      #ryu-team-panel.ryu-team-visible {
        opacity: 1;
      }

      #ryu-team-panel .ryu-t-header {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(34,211,238,0.1);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #ryu-team-panel .ryu-t-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #22d3ee;
        flex-shrink: 0;
      }

      #ryu-team-panel .ryu-t-title {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 3px;
        color: rgba(34,211,238,0.7);
      }

      #ryu-team-panel .ryu-t-entry {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 10px;
        border-bottom: 1px solid rgba(34,211,238,0.05);
      }

      #ryu-team-panel .ryu-t-entry:last-child {
        border-bottom: none;
      }

      #ryu-team-panel .ryu-t-name {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 130px;
      }

      #ryu-team-panel .ryu-t-mass {
        font-size: 11px;
        font-weight: 700;
        color: #22d3ee;
        flex-shrink: 0;
      }
    `;
    (document.head || document.documentElement).appendChild(el);
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
    const native = document.getElementById('team-info');
    if (native) native.style.removeProperty('display');
  }

  function isMainMenuVisible() {
    const mm = document.getElementById('main-menu');
    if (!mm) return false;
    if (mm.style.display === 'none') return false;
    if (mm.style.opacity === '0') return false;
    return true;
  }

  function isSettingsOpen() {
    const sp = document.getElementById('ryu-settings-panel');
    return sp ? sp.classList.contains('ryu-sp-open') : false;
  }

  function shouldShow() {
    return !isMainMenuVisible() && !isSettingsOpen();
  }

  function updateVisibility() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    if (shouldShow()) {
      panel.classList.add('ryu-team-visible');
    } else {
      panel.classList.remove('ryu-team-visible');
    }
  }

  let _menuObserver = null;
  let _settingsObserver = null;

  function startMenuObserver() {
    if (_menuObserver) return;
    const mm = document.getElementById('main-menu');
    if (!mm) { setTimeout(startMenuObserver, 300); return; }
    _menuObserver = new MutationObserver(function () {
      if (loadTheme().useDefault) return;
      updateVisibility();
    });
    _menuObserver.observe(mm, { attributes: true, attributeFilter: ['style'] });

    // also watch settings panel open/close
    const sp = document.getElementById('ryu-settings-panel');
    if (sp && !_settingsObserver) {
      _settingsObserver = new MutationObserver(updateVisibility);
      _settingsObserver.observe(sp, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function stopMenuObserver() {
    if (_menuObserver) { _menuObserver.disconnect(); _menuObserver = null; }
    if (_settingsObserver) { _settingsObserver.disconnect(); _settingsObserver = null; }
  }

  function buildPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      document.body.appendChild(panel);
    }

    const entries = [...document.querySelectorAll('.team-info-entry')]
      .filter(e => parseFloat(e.style.opacity) > 0);

    if (!entries.length) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = '';
    panel.innerHTML = `
      <div class="ryu-t-header">
        <div class="ryu-t-dot"></div>
        <span class="ryu-t-title">TEAM</span>
      </div>
      ${entries.map(e => {
        const name = e.querySelector('.team-info-nick')?.textContent || '';
        const mass = e.querySelector('.team-info-energy')?.textContent || '';
        return `
          <div class="ryu-t-entry">
            <span class="ryu-t-name">${name}</span>
            <span class="ryu-t-mass">${mass || '—'}</span>
          </div>`;
      }).join('')}
    `;
  }

  function startObserver() {
    if (_observer) return;
    const teamInfo = document.getElementById('team-info');
    if (!teamInfo) { setTimeout(startObserver, 500); return; }
    buildPanel();
    _observer = new MutationObserver(buildPanel);
    _observer.observe(teamInfo, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }

  function stopObserver() {
    if (_observer) { _observer.disconnect(); _observer = null; }
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
  }

  function applyAll() {
    if (_applied) return;
    _applied = true;
    applyStyle();
    startObserver();
    startMenuObserver();
    setTimeout(updateVisibility, 400);
  }

  function removeAll() {
    if (!_applied) return;
    _applied = false;
    removeStyle();
    stopObserver();
    stopMenuObserver();
  }

  let _lastOn = null;
  setInterval(function () {
    const t = loadTheme();
    const on = !t.useDefault;
    if (on !== _lastOn) {
      _lastOn = on;
      if (on) applyAll();
      else removeAll();
    }
  }, 500);

  console.log('[RyuTheme] TEAM PANEL LOADED.');
})();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',__ryuRun);
  } else {
    __ryuRun();
  }
})();
