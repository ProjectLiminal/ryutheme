// chatbox UI

(function () {
  'use strict';

  const STYLE_ID  = 'ryu-chatbox-theme';
  const HEADER_ID = 'ryu-chbx-header';
  const STORAGE_KEY = 'ryuTheme';

  let _applied = false;
  let _msgObserver = null;

  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function getAvatarColorForUser(name) {
    const COLORS = [
      '#9933ff','#1177ee','#ff5511','#11bb55',
      '#ff33aa','#ffbb11','#11bbcc','#ff2233'
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return COLORS[Math.abs(h) % COLORS.length];
  }

  function colorizeMessage(msgEl) {
    const senderEl = msgEl.querySelector('.chbx-message-sender');
    if (!senderEl || senderEl._ryuColored) return;
    senderEl._ryuColored = true;
    const rawName = senderEl.textContent.trim().replace(/:$/, '');
    const name = rawName.replace(/^[\uD83C][\uDDE0-\uDDFF][\uD83C][\uDDE0-\uDDFF]\s*/u, '').trim();
    const customColor = globalThis.__ryuUserColors && globalThis.__ryuUserColors[name];
    const color = customColor || getAvatarColorForUser(name);
    senderEl.style.setProperty('color', color, 'important');
    senderEl.style.removeProperty('text-shadow');
  }

  function colorizeAllMessages() {
    document.querySelectorAll('.chbx-message').forEach(colorizeMessage);
  }

  function startObserver() {
    if (_msgObserver) return;
    const body = document.getElementById('chbx-body-content');
    if (!body) return;
    colorizeAllMessages();
    _msgObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('chbx-message')) {
            colorizeMessage(node);
            if (globalThis.__ryuApplyTimestamps) globalThis.__ryuApplyTimestamps();
          } else {
            node.querySelectorAll && node.querySelectorAll('.chbx-message').forEach(colorizeMessage);
            if (globalThis.__ryuApplyTimestamps) globalThis.__ryuApplyTimestamps();
          }
        });
      });
    });
    _msgObserver.observe(body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (_msgObserver) { _msgObserver.disconnect(); _msgObserver = null; }
    document.querySelectorAll('.chbx-message-sender').forEach(function (el) {
      el.style.removeProperty('color');
      el.style.removeProperty('text-shadow');
      el._ryuColored = false;
    });
  }

  function injectHeader() {
    if (document.getElementById(HEADER_ID)) return;
    const header = document.createElement('div');
    header.id = HEADER_ID;
    header.innerHTML = `
      <div class="ryu-header-inner">
        <div class="ryu-header-left">
          <div class="ryu-title">COMMS</div>
        </div>
        <div class="ryu-header-right">
          <div class="ryu-minimize-btn" id="ryu-minimize-btn">_</div>
        </div>
      </div>
      <div class="ryu-tabs">
        <div class="ryu-tab ryu-tab-active" data-ch="global">GLOBAL</div>
        <div class="ryu-tab" data-ch="team">TEAM</div>
        <div class="ryu-tab" data-ch="dm">DM</div>
      </div>
    `;
    const chatbox = document.getElementById('chatbox');
    if (chatbox) chatbox.insertBefore(header, chatbox.firstChild);

    const minBtn = document.getElementById('ryu-minimize-btn');
    const chbxBody = document.getElementById('chbx-body');
    if (minBtn && chbxBody) {
      minBtn.addEventListener('click', function () {
        const collapsed = chbxBody.style.display === 'none';
        chbxBody.style.display = collapsed ? '' : 'none';
        minBtn.textContent = collapsed ? '_' : '\u25a1';
      });
    }

    let _activeChannel = 'global';

    function setChannel(ch) {
      _activeChannel = ch;
      header.querySelectorAll('.ryu-tab').forEach(function (t) {
        t.classList.toggle('ryu-tab-active', t.getAttribute('data-ch') === ch);
      });
      if (ch === 'team') {
        var badge = document.getElementById('ryu-team-notif');
        if (badge) badge.remove();
      }
      if (ch === 'dm') {
        var dmBadge = document.getElementById('ryu-dm-notif');
        if (dmBadge) dmBadge.remove();
        if (globalThis.__ryuShowDMPanel) globalThis.__ryuShowDMPanel();
        return;
      }
      if (globalThis.__ryuHideDMPanel) globalThis.__ryuHideDMPanel();
      var switched = false;
      document.querySelectorAll('.chbx-dropup-list-item').forEach(function (item) {
        if (item.textContent.trim().toLowerCase() === ch) {
          item.click();
          switched = true;
        }
      });
      if (!switched) {
        var dropupSelected = document.querySelector('.chbx-dropup-selected');
        if (dropupSelected) {
          dropupSelected.click();
          setTimeout(function () {
            document.querySelectorAll('.chbx-dropup-list-item').forEach(function (item) {
              if (item.textContent.trim().toLowerCase() === ch) item.click();
            });
          }, 150);
        }
      }
    }

    header.querySelectorAll('.ryu-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        setChannel(tab.getAttribute('data-ch'));
      });
    });

    function watchTeamUnread() {
      var b = globalThis.__ryuB_;
      if (!b || !b._3295) { setTimeout(watchTeamUnread, 500); return; }
      var teamCh = b._3295.get('TEAM');
      if (!teamCh || !teamCh._6116 || !teamCh._6116._8203) { setTimeout(watchTeamUnread, 500); return; }
      new MutationObserver(function () {
        if (_activeChannel === 'team') return;
        var teamTab = header.querySelector('.ryu-tab[data-ch="team"]');
        if (!teamTab || document.getElementById('ryu-team-notif')) return;
        var badge = document.createElement('span');
        badge.id = 'ryu-team-notif';
        badge.className = 'ryu-tab-notif';
        badge.textContent = 'NEW';
        teamTab.appendChild(badge);
      }).observe(teamCh._6116._8203, { childList: true });
    }
    setTimeout(watchTeamUnread, 800);

  }

  function removeHeader() {
    const h = document.getElementById(HEADER_ID);
    if (h) h.remove();
  }

  function applyStyle() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = `
      @keyframes ryu-msg-in {
        from { opacity: 0; transform: translateX(-4px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* ── Chatbox container ── */
      #chatbox {
        position: fixed !important;
        left: 18px !important;
        bottom: 18px !important;
        width: 320px;
        font-size: 14px;
        height: auto !important;
        display: flex !important;
        flex-direction: column !important;
        z-index: 9999 !important;
        background: rgba(9,13,18,0.90) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      }

      /* ── Header ── */
      #ryu-chbx-header {
        flex-shrink: 0 !important;
        position: relative !important;
        border-radius: 8px 8px 0 0 !important;
        overflow: hidden !important;
      }
      .ryu-header-inner {
        background: rgba(34,211,238,0.05) !important;
        border-bottom: 1px solid rgba(34,211,238,0.12) !important;
        padding: 9px 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
      .ryu-header-inner::before { display: none !important; }
      .ryu-header-left { padding-left: 0 !important; }
      .ryu-title {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        color: rgba(34,211,238,0.9) !important;
        letter-spacing: 4px !important;
        text-shadow: 0 0 10px rgba(34,211,238,0.4) !important;
        text-transform: uppercase !important;
        animation: none !important;
      }
      .ryu-header-right {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .ryu-live-badge { display: none !important; }
      .ryu-live-dot   { display: none !important; }
      .ryu-live-text  { display: none !important; }
      .ryu-corner     { display: none !important; }
      .ryu-scanline   { display: none !important; }
      .ryu-minimize-btn {
        width: 22px !important; height: 22px !important;
        border-radius: 4px !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        background: transparent !important;
        color: rgba(34,211,238,0.45) !important;
        font-size: 11px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: all 0.15s !important;
      }
      .ryu-minimize-btn:hover {
        background: rgba(34,211,238,0.08) !important;
        color: #22d3ee !important;
      }

      /* ── Tabs ── */
      .ryu-tabs {
        display: flex !important;
        gap: 4px !important;
        background: transparent !important;
        padding: 0 10px 8px !important;
        flex-shrink: 0 !important;
        border-bottom: 1px solid rgba(34,211,238,0.1) !important;
      }
      .ryu-tab {
        padding: 4px 12px !important;
        border-radius: 4px !important;
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 9px !important;
        font-weight: 700 !important;
        letter-spacing: 1.5px !important;
        color: rgba(255,255,255,0.25) !important;
        cursor: pointer !important;
        border: none !important;
        text-transform: uppercase !important;
        transition: all 0.15s !important;
        text-shadow: none !important;
        background: transparent !important;
      }
      .ryu-tab:last-child { border-right: none !important; }
      .ryu-tab-active {
        background: rgba(34,211,238,0.12) !important;
        color: #22d3ee !important;
        text-shadow: none !important;
      }
      .ryu-tab-active::after { display: none !important; }
      .ryu-tab:hover:not(.ryu-tab-active) {
        background: rgba(34,211,238,0.06) !important;
        color: rgba(255,255,255,0.55) !important;
      }
      .ryu-tab-notif {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(180,30,30,0.85) !important;
        color: #fff !important;
        font-size: 7px !important;
        font-weight: 800 !important;
        border-radius: 4px !important;
        padding: 2px 5px !important;
        margin-left: 5px !important;
        letter-spacing: 0.08em !important;
        line-height: 1 !important;
        vertical-align: middle !important;
        text-transform: uppercase !important;
        border: 1px solid rgba(255,60,60,0.4) !important;
        box-shadow: 0 0 6px rgba(220,30,30,0.4) !important;
      }

      /* ── Message body ── */
      .chbx-body {
        background: transparent !important;
        border: none !important;
        position: relative !important;
        flex: none !important;
        height: 200px;
        overflow: hidden !important;
        overflow-y: auto !important;
      }
      .chbx-body::before { display: none !important; }
      .chbx-body::-webkit-scrollbar { width: 0px !important; display: none !important; }
      .chbx-body { scrollbar-width: none !important; }
      .chbx-body-scrollbar { background: transparent !important; width: 2px !important; }
      .chbx-body-scrollbar-slider { background: rgba(34,211,238,0.2) !important; border-radius: 2px !important; }

      /* ── Messages ── */
      .chbx-message {
        display: flex !important;
        align-items: baseline !important;
        gap: 6px !important;
        flex-wrap: wrap !important;
        padding: 7px 14px !important;
        border-bottom: 1px solid rgba(34,211,238,0.05) !important;
        position: relative !important;
        animation: ryu-msg-in 0.18s ease !important;
        line-height: 1.4 !important;
      }
      .chbx-message:hover { background: rgba(34,211,238,0.03) !important; }
      .chbx-message::before { display: none !important; }
      .chbx-message-time {
        display: inline !important;
        font-size: 12px !important;
        color: rgba(34,211,238,0.6) !important;
        letter-spacing: 0.5px !important;
        font-family: 'Noto Sans', sans-serif !important;
        flex-shrink: 0 !important;
      }
      .chbx-message-sender {
        font-size: 13px !important;
        font-weight: 700 !important;
        letter-spacing: 0.3px !important;
        display: inline !important;
        flex-shrink: 0 !important;
        font-family: 'Noto Sans', sans-serif !important;
      }
      .chbx-message-content {
        color: rgba(255,255,255,0.86) !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        display: inline !important;
        word-break: break-word !important;
        font-family: 'Noto Sans', sans-serif !important;
        opacity: 1 !important;
        filter: none !important;
      }

      /* ── Emoji bar ── */
      #ryu-emoji-bar {
        display: none !important;
        position: fixed !important;
        z-index: 99999 !important;
        align-items: center !important;
        gap: 2px !important;
        padding: 4px 6px !important;
      }
      #ryu-emoji-bar.ryu-emoji-visible {
        display: flex !important;
      }
      .ryu-emoji-btn {
        font-size: 18px !important;
        cursor: pointer !important;
        padding: 4px 6px !important;
        border-radius: 4px !important;
        border: none !important;
        background: transparent !important;
        line-height: 1 !important;
        transition: background 0.1s !important;
        user-select: none !important;
      }
      .ryu-emoji-btn:hover {
        background: rgba(34,211,238,0.1) !important;
      }

      /* ── Bottom bar ── */
      .chbx-bottom-bar {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 0.5em !important;
        padding: 0.3em 0.7em !important;
        background: rgba(9,13,18,0.95) !important;
        border-top: 1px solid rgba(34,211,238,0.1) !important;
        flex-shrink: 0 !important;
        position: relative !important;
        z-index: 10 !important;
      }
      .chbx-dropup { display: none !important; }
      .chbx-bottom-btn { color: rgba(34,211,238,0.5) !important; font-size: 13px !important; cursor: pointer !important; }
      .chbx-bottom-btn:hover { color: #22d3ee !important; text-shadow: none !important; }
      .chbx-dropup-arrow { display: none !important; }

      /* ── Chat input ── */
      #chat-input {
        background: rgba(9,13,18,0.85) !important;
        border: 1px solid rgba(34,211,238,0.18) !important;
        border-radius: 6px !important;
        color: rgba(255,255,255,0.85) !important;
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        padding: 7px 10px !important;
        outline: none !important;
        box-sizing: border-box !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
        caret-color: #22d3ee !important;
        letter-spacing: 0.2px !important;
      }
      #chat-input::placeholder {
        color: rgba(34,211,238,0.25) !important;
        font-style: normal !important;
        letter-spacing: 0.3px !important;
      }
      #chat-input:focus {
        border-color: rgba(34,211,238,0.45) !important;
        box-shadow: 0 0 0 2px rgba(34,211,238,0.07), 0 0 10px rgba(34,211,238,0.1) !important;
        background: rgba(9,13,18,0.95) !important;
      }



      /* ── Settings menu ── */
      #chbx-settings-menu {
        background: rgba(9,13,18,0.97) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 8px !important;
        box-shadow: none !important;
        font-family: 'Noto Sans', sans-serif !important;
        min-width: 220px !important;
        animation: none !important;
      }
      .chbxsm-title {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 9px !important; font-weight: 800 !important;
        color: rgba(34,211,238,0.8) !important;
        letter-spacing: 3px !important; text-shadow: none !important;
        border-bottom: 1px solid rgba(34,211,238,0.12) !important;
        padding: 10px 14px 8px !important; margin: 0 !important;
        text-transform: uppercase !important;
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        background: rgba(34,211,238,0.04) !important;
        border-radius: 8px 8px 0 0 !important;
      }
      .chbxsm-close { color: rgba(34,211,238,0.4) !important; cursor: pointer !important; transition: color 0.15s !important; }
      .chbxsm-close:hover { color: #22d3ee !important; text-shadow: none !important; }
      .chbxsm-body { padding: 4px 0 !important; }
      .chbxsm-label { color: rgba(255,255,255,0.55) !important; font-size: 12px !important; font-family: 'Noto Sans', sans-serif !important; }
      .chbxsm-checkbox {
        width: 14px !important; height: 14px !important;
        border: 1px solid rgba(34,211,238,0.25) !important;
        background: transparent !important; border-radius: 3px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        color: transparent !important; flex-shrink: 0 !important;
      }
      .iconfont-checkbox {
        color: #22d3ee !important; text-shadow: none !important;
        background: rgba(34,211,238,0.12) !important;
        border-color: rgba(34,211,238,0.5) !important;
      }
      .chbxsm-row {
        display: flex !important; align-items: center !important; gap: 10px !important;
        padding: 9px 14px !important;
        border-bottom: 1px solid rgba(34,211,238,0.06) !important;
        cursor: pointer !important; transition: background 0.15s !important;
      }
      .chbxsm-row::before { display: none !important; }
      .chbxsm-row:hover { background: rgba(34,211,238,0.04) !important; }
      .chbxsm-row:hover .chbxsm-label { color: rgba(255,255,255,0.8) !important; }

      /* ── Mute list ── */
      .chatbox-mute-list {
        background: rgba(9,13,18,0.97) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 8px !important;
        box-shadow: none !important; animation: none !important;
        min-width: 220px !important;
      }
      .chbxml-title {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 9px !important; font-weight: 800 !important;
        color: rgba(34,211,238,0.8) !important; letter-spacing: 3px !important;
        text-shadow: none !important;
        padding: 10px 14px 8px !important;
        border-bottom: 1px solid rgba(34,211,238,0.12) !important;
        background: rgba(34,211,238,0.04) !important;
        border-radius: 8px 8px 0 0 !important;
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        text-transform: uppercase !important;
      }
      .chbxml-close { color: rgba(34,211,238,0.4) !important; cursor: pointer !important; transition: color 0.15s !important; }
      .chbxml-close:hover { color: #22d3ee !important; text-shadow: none !important; }
      .chbxml-body { background: transparent !important; max-height: 200px !important; }
      .chbxml-body-content { padding: 4px 0 !important; }
      .chbxml-body-scrollbar { width: 2px !important; background: transparent !important; }
      .chbxml-body-scrollbar-slider { background: rgba(34,211,238,0.2) !important; border-radius: 2px !important; }
      .chbx-mute-list {
        background: rgba(9,13,18,0.97) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 8px !important; box-shadow: none !important;
      }
      .chbx-mute-list-title {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 9px !important; font-weight: 800 !important;
        color: rgba(34,211,238,0.8) !important; letter-spacing: 3px !important;
        text-shadow: none !important; padding-left: 8px !important;
      }
      .chbx-mute-list-item {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 12px !important; font-weight: 600 !important;
        color: rgba(255,255,255,0.55) !important; letter-spacing: 0.3px !important;
        padding: 8px 14px !important;
        border-bottom: 1px solid rgba(34,211,238,0.06) !important;
        transition: background 0.15s !important;
      }
      .chbx-mute-list-item::before { display: none !important; }
      .chbx-mute-list-item:hover { background: rgba(34,211,238,0.05) !important; color: rgba(255,255,255,0.8) !important; }

      /* ── Dropup ── */
      .chbx-dropup {
        background: rgba(9,13,18,0.85) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 4px !important; padding: 2px 8px !important;
      }
      .chbx-dropup-selected {
        color: #22d3ee !important; font-weight: 700 !important;
        letter-spacing: 1.5px !important; font-size: 9px !important;
        text-shadow: none !important; font-family: 'Noto Sans', sans-serif !important;
      }
      .chbx-dropup-list {
        background: rgba(9,13,18,0.98) !important;
        border: 1px solid rgba(34,211,238,0.2) !important;
        border-radius: 6px !important; box-shadow: none !important;
      }
      .chbx-dropup-list-item {
        color: rgba(34,211,238,0.6) !important;
        letter-spacing: 1.5px !important; font-size: 10px !important;
        padding: 6px 12px !important;
        border-bottom: 1px solid rgba(34,211,238,0.06) !important;
        text-transform: uppercase !important; font-family: 'Noto Sans', sans-serif !important;
      }
      .chbx-dropup-list-item:hover { background: rgba(34,211,238,0.06) !important; color: #22d3ee !important; }
    `;
  }

  function injectEmojiBar() {
    if (document.getElementById('ryu-emoji-bar')) return;
    const input = document.getElementById('chat-input');
    if (!input) { setTimeout(injectEmojiBar, 300); return; }

    const EMOJIS = ['😂','😭','😁','🤣','😍','😤','🥺','💀','🔥','💯'];

    const bar = document.createElement('div');
    bar.id = 'ryu-emoji-bar';
    bar.innerHTML = EMOJIS.map(function(e) {
      return '<button class="ryu-emoji-btn" data-emoji="' + e + '">' + e + '</button>';
    }).join('');
    document.body.appendChild(bar);

    function positionBar() {
      const r = input.getBoundingClientRect();
      bar.style.left = r.left + 'px';
      bar.style.width = r.width + 'px';
      bar.style.top = (r.top - bar.offsetHeight - 4) + 'px';
    }

    input.addEventListener('focus', function() {
      bar.classList.add('ryu-emoji-visible');
      positionBar();
    });

    new MutationObserver(function() {
      const r = input.getBoundingClientRect();
      if (r.width === 0 || window.getComputedStyle(input).display === 'none') {
        bar.classList.remove('ryu-emoji-visible');
      }
    }).observe(input, { attributes: true, attributeFilter: ['style'] });

    bar.querySelectorAll('.ryu-emoji-btn').forEach(function(btn) {
      btn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const emoji = btn.getAttribute('data-emoji');
        input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  function applyChatScale(val) {
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return;
    // skip the normal scale if user has set a drag zoom
    const t = loadTheme();
    if (t.chatDragW || t.chatDragH) return;
    const s = 0.3 + (val / 100) * 1.5;
    chatbox.style.zoom = '';
    chatbox.style.transformOrigin = 'bottom left';
    chatbox.style.transform = 'scale(' + s.toFixed(3) + ')';
    chatbox.dataset.ryuChatDragZoom = '';
  }

  function getChatDragBaseWidth() {
    return 320;
  }

  function getChatDragBaseHeight() {
    return 200;
  }

  function setChatDragSize(w, h) {
    let ov = document.getElementById('ryu-chat-drag-override');
    if (ov) ov.remove();
    const baseW = getChatDragBaseWidth();
    const baseH = getChatDragBaseHeight();
    const widthRatio = w ? w / baseW : 1;
    const heightRatio = h ? h / baseH : 1;
    const zoomRaw = (widthRatio + heightRatio) / 2;
    const zoom = Math.max(0.55, Math.min(1.45, Math.round(zoomRaw * 1000) / 1000));
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return;
    chatbox.dataset.ryuChatDragZoom = String(zoom);
    chatbox.style.width = baseW + 'px';
    chatbox.style.height = 'auto';
    chatbox.style.maxHeight = 'none';
    chatbox.style.overflow = 'hidden';
    chatbox.style.zoom = '';
    chatbox.style.transformOrigin = 'bottom left';
    chatbox.style.transform = 'scale(' + zoom + ')';
    const body = chatbox.querySelector('.chbx-body');
    if (body) body.style.height = baseH + 'px';
  }

  function addChatboxResizeHandle() {
    const chatbox = document.getElementById('chatbox');
    if (!chatbox || document.getElementById('ryu-chat-resize-handle')) return;

    // apply saved drag dimensions if present
    const t0 = loadTheme();
    if (t0.chatDragW || t0.chatDragH) setChatDragSize(t0.chatDragW || getChatDragBaseWidth(), t0.chatDragH || getChatDragBaseHeight());

    const handle = document.createElement('div');
    handle.id = 'ryu-chat-resize-handle';
    handle.title = 'Drag to resize chat';
    handle.style.cssText =
      'position:absolute;top:0;right:0;width:20px;height:20px;cursor:ne-resize;' +
      'z-index:10001;display:flex;align-items:flex-start;justify-content:flex-end;' +
      'padding:3px;opacity:0.3;transition:opacity 0.15s;user-select:none;';
    handle.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
      '<line x1="11" y1="11" x2="1" y2="1" stroke="rgba(34,211,238,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '<line x1="11" y1="6" x2="6" y2="1" stroke="rgba(34,211,238,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>';
    chatbox.appendChild(handle);

    handle.addEventListener('mouseenter', function() { handle.style.opacity = '1'; });
    handle.addEventListener('mouseleave', function() { if (!handle._ryuDragging) handle.style.opacity = '0.3'; });

    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handle._ryuDragging = true;
      handle.style.opacity = '1';

      const startX = e.clientX;
      const startY = e.clientY;
      const startZoom = parseFloat(chatbox.dataset.ryuChatDragZoom || chatbox.style.zoom || '1') || 1;
      const baseW = getChatDragBaseWidth();
      const baseH = getChatDragBaseHeight();
      let curW = baseW * startZoom;
      let curH = baseH * startZoom;
      let pendingW = curW;
      let pendingH = curH;
      let dragFrame = null;

      function scheduleResizeWrite() {
        if (dragFrame !== null) return;
        dragFrame = requestAnimationFrame(function() {
          dragFrame = null;
          setChatDragSize(pendingW, pendingH);
        });
      }

      function onMove(ev) {
        // top-right: right/up grow the whole chatbox, left/down shrink it.
        const dxRatio = (ev.clientX - startX) / baseW;
        const dyRatio = (startY - ev.clientY) / baseH;
        const targetZoom = Math.max(0.55, Math.min(1.45, startZoom + ((dxRatio + dyRatio) / 2)));
        curW = baseW * targetZoom;
        curH = baseH * targetZoom;
        pendingW = curW;
        pendingH = curH;
        scheduleResizeWrite();
      }

      function onUp() {
        handle._ryuDragging = false;
        handle.style.opacity = '0.3';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (dragFrame !== null) {
          cancelAnimationFrame(dragFrame);
          dragFrame = null;
        }
        setChatDragSize(curW, curH);
        try {
          const saved = loadTheme();
          saved.chatDragW = Math.round(curW);
          saved.chatDragH = Math.round(curH);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (_) {}
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function applyAll() {
    if (_applied) return;
    _applied = true;
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return;
    applyStyle();
    injectHeader();
    injectEmojiBar();
    (function () {
      const t = loadTheme();
      const myName = document.getElementById('mame-trb-user-data-username');
      if (myName && t.chatNameColor) {
        if (!globalThis.__ryuUserColors) globalThis.__ryuUserColors = {};
        globalThis.__ryuUserColors[myName.textContent.trim()] = t.chatNameColor;
      }
    })();
    applyChatScale(loadTheme().chatScale || 50);
    setTimeout(addChatboxResizeHandle, 150);

    // context menu
    (function () {
      const MENU_ID = 'ryu-chat-ctx-menu';

      function removeMenu() {
        const existing = document.getElementById(MENU_ID);
        if (existing) existing.remove();
      }

      function showMenu(e, msg) {
        removeMenu();

        const sender  = (msg.querySelector('.chbx-message-sender')  || {}).textContent || '';
        const content = (msg.querySelector('.chbx-message-content') || {}).textContent || '';
        const time    = (msg.querySelector('.chbx-message-time')    || {}).textContent || '';
        const cleanSender = sender.trim();
        const msgText = (time ? '(' + time.trim() + ') ' : '') + cleanSender + ': ' + content.trim();
        const myName = ((document.getElementById('mame-trb-user-data-username') || {}).textContent || '').trim();

        const options = [
          {
            icon: 'iconfont-copy',
            label: 'Copy message',
            action: function () { navigator.clipboard.writeText(msgText).catch(console.error); }
          },
          {
            icon: 'iconfont-copy-all',
            label: 'Copy all',
            action: function () {
              const all = Array.from(document.querySelectorAll('.chbx-message')).map(function (m) {
                const t = (m.querySelector('.chbx-message-time')    || {}).textContent || '';
                const s = (m.querySelector('.chbx-message-sender')  || {}).textContent || '';
                const c = (m.querySelector('.chbx-message-content') || {}).textContent || '';
                return (t ? '(' + t.trim() + ') ' : '') + s.trim() + ': ' + c.trim();
              }).join('\n');
              navigator.clipboard.writeText(all).catch(console.error);
            }
          }
        ];

        if (cleanSender && cleanSender !== myName) {
          options.push({
            icon: 'iconfont-mute',
            label: 'Mute ' + cleanSender,
            action: function () {
              if (globalThis.__ryuM_ && typeof globalThis.__ryuM_._7703 === 'function') {
                globalThis.__ryuM_._7703(cleanSender);
              }
            }
          });
          options.push({
            icon: 'iconfont-chat-bubble',
            label: 'Message ' + cleanSender,
            action: function () {
              const dmKey = '[DM] ' + cleanSender;
              if (globalThis.__ryuB_ && typeof globalThis.__ryuB_._6306 === 'function') {
                globalThis.__ryuB_._6306(dmKey);
              }
              if (globalThis.__ryuShowDMPanel) globalThis.__ryuShowDMPanel(dmKey);
            }
          });
        }

        const menu = document.createElement('div');
        menu.id = MENU_ID;
        menu.style.cssText = 'position:fixed;z-index:2147483647;background:rgba(9,13,18,0.97);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:4px 0;min-width:160px;box-shadow:0 4px 20px rgba(0,0,0,0.6);';

        options.forEach(function (opt) {
          const item = document.createElement('div');
          item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 14px;cursor:pointer;font-family:"Noto Sans",sans-serif;font-size:12px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:0.3px;transition:background 0.1s,color 0.1s;';
          item.innerHTML = '<i class="come-option-icon iconfont ' + opt.icon + '" style="font-size:13px;color:rgba(34,211,238,0.7);width:16px;text-align:center;"></i><span>' + opt.label + '</span>';
          item.addEventListener('mouseenter', function () { item.style.background = 'rgba(34,211,238,0.08)'; item.style.color = '#ffffff'; });
          item.addEventListener('mouseleave', function () { item.style.background = ''; item.style.color = 'rgba(255,255,255,0.75)'; });
          item.addEventListener('mousedown', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            removeMenu();
            opt.action();
          });
          menu.appendChild(item);
        });

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        menu.style.left = Math.min(e.clientX, vw - 180) + 'px';
        menu.style.top  = Math.min(e.clientY, vh - (options.length * 36 + 12)) + 'px';
        document.body.appendChild(menu);
        setTimeout(function () { document.addEventListener('mousedown', removeMenu, { once: true }); }, 0);
      }

      chatbox.addEventListener('contextmenu', function (e) {
        const msg = e.target.closest('.chbx-message');
        if (!msg) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showMenu(e, msg);
      }, true);
    })();

    (function () {
      if (document.getElementById('ryu-dm-panel')) return;

      const s = document.createElement('style');
      s.id = 'ryu-dm-style';
      s.textContent = `
        #ryu-dm-panel {
          display: none;
          position: fixed;
          background: rgba(9,13,18,0.97);
          border: 1px solid rgba(34,211,238,0.2);
          border-radius: 8px;
          overflow: hidden;
          flex-direction: column;
          z-index: 10000;
          font-family: 'Noto Sans', sans-serif;
        }
        #ryu-dm-panel.ryu-dm-open { display: flex; }
        #ryu-dm-inbox { flex: 1; overflow-y: auto; }
        .ryu-dm-contact {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; cursor: pointer;
          border-bottom: 1px solid rgba(34,211,238,0.12);
          transition: background 0.1s;
        }
        .ryu-dm-contact:hover { background: rgba(34,211,238,0.06); }
        .ryu-dm-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(34,211,238,0.12);
          border: 1px solid rgba(34,211,238,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #22d3ee;
          flex-shrink: 0; text-transform: uppercase;
        }
        .ryu-dm-contact-info { flex: 1; min-width: 0; }
        .ryu-dm-contact-name {
          font-size: 14px; font-weight: 700;
          color: rgba(255,255,255,0.92); letter-spacing: 0.3px;
        }
        .ryu-dm-contact-preview {
          font-size: 12px; color: rgba(255,255,255,0.4);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 3px;
        }
        .ryu-dm-empty {
          text-align: center; padding: 24px 14px;
          font-size: 11px; color: rgba(255,255,255,0.25);
        }
        #ryu-dm-inbox-hdr {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; flex-shrink: 0;
          border-bottom: 1px solid rgba(34,211,238,0.1);
          background: rgba(34,211,238,0.04);
        }
        #ryu-dm-inbox-back {
          color: rgba(34,211,238,0.6); cursor: pointer;
          font-size: 15px; line-height: 1; padding: 2px 4px;
          transition: color 0.1s; flex-shrink: 0;
        }
        #ryu-dm-inbox-back:hover { color: #22d3ee; }
        #ryu-dm-inbox-title {
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
        }
        #ryu-dm-convo { display: none; flex-direction: column; flex: 1; min-height: 0; }
        #ryu-dm-convo.ryu-dm-convo-open { display: flex; }
        #ryu-dm-convo-hdr {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; flex-shrink: 0;
          border-bottom: 1px solid rgba(34,211,238,0.1);
          background: rgba(34,211,238,0.04);
        }
        #ryu-dm-back {
          color: rgba(34,211,238,0.6); cursor: pointer;
          font-size: 15px; line-height: 1; padding: 2px 4px;
          transition: color 0.1s; flex-shrink: 0;
        }
        #ryu-dm-back:hover { color: #22d3ee; }
        #ryu-dm-convo-name {
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
        }
        #ryu-dm-messages {
          flex: 1; overflow-y: auto; padding: 8px 10px;
          display: flex; flex-direction: column; gap: 3px;
          min-height: 0;
        }
        .ryu-dm-msg { display: flex; flex-direction: column; max-width: 78%; }
        .ryu-dm-msg-mine { align-self: flex-end; align-items: flex-end; }
        .ryu-dm-msg-theirs { align-self: flex-start; align-items: flex-start; }
        .ryu-dm-bubble {
          padding: 6px 10px; font-size: 12px;
          line-height: 1.4; word-break: break-word; border-radius: 12px;
        }
        .ryu-dm-msg-mine .ryu-dm-bubble {
          background: rgba(34,211,238,0.18);
          border: 1px solid rgba(34,211,238,0.28);
          color: rgba(255,255,255,0.9);
          border-bottom-right-radius: 3px;
        }
        .ryu-dm-msg-theirs .ryu-dm-bubble {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          border-bottom-left-radius: 3px;
        }
        .ryu-dm-time {
          font-size: 9px; color: rgba(255,255,255,0.22);
          margin-top: 2px; padding: 0 2px;
        }
      `;
      document.head.appendChild(s);

      const panel = document.createElement('div');
      panel.id = 'ryu-dm-panel';
      panel.innerHTML = `
        <div id="ryu-dm-inbox-hdr">
          <div id="ryu-dm-inbox-back">&#8592;</div>
          <div id="ryu-dm-inbox-title">DMs</div>
        </div>
        <div id="ryu-dm-inbox"></div>
        <div id="ryu-dm-convo">
          <div id="ryu-dm-convo-hdr">
            <div id="ryu-dm-back">&#8592;</div>
            <div id="ryu-dm-convo-name"></div>
          </div>
          <div id="ryu-dm-messages"></div>
        </div>
      `;
      document.body.appendChild(panel);

      var _openDmKey = null;
      var _convoObserver = null;
      var _dmObservers = {};
      var _prevNativeChannel = 'GLOBAL';

      function positionPanel() {
        const cb = document.getElementById('chatbox');
        if (!cb) return;
        const r = cb.getBoundingClientRect();
        panel.style.left   = r.left + 'px';
        panel.style.top    = r.top + 'px';
        panel.style.width  = r.width + 'px';
        panel.style.height = r.height + 'px';
      }

      function renderInbox() {
        const inbox = document.getElementById('ryu-dm-inbox');
        if (!inbox) return;
        const b = globalThis.__ryuB_;
        if (!b || !b._3295) { inbox.innerHTML = '<div class="ryu-dm-empty">No DMs yet</div>'; return; }
        const dms = [];
        b._3295.forEach(function (ch, key) { if (key.startsWith('[DM]')) dms.push({ key: key, ch: ch }); });
        if (!dms.length) { inbox.innerHTML = '<div class="ryu-dm-empty">No DMs yet</div>'; return; }
        inbox.innerHTML = '';
        dms.forEach(function (dm) {
          const name = dm.key.replace('[DM] ', '');
          const msgs = dm.ch._6116._5727 || [];
          const last = msgs.length ? msgs[msgs.length - 1] : null;
          const preview = last ? last._4068 : '';
          const item = document.createElement('div');
          item.className = 'ryu-dm-contact';
          item.innerHTML =
            '<div class="ryu-dm-avatar">' + name.charAt(0) + '</div>' +
            '<div class="ryu-dm-contact-info">' +
              '<div class="ryu-dm-contact-name">' + name + '</div>' +
              '<div class="ryu-dm-contact-preview">' + preview + '</div>' +
            '</div>';
          item.addEventListener('click', function () { openConvo(dm.key); });
          inbox.appendChild(item);
        });
      }

      function renderMessages(dmKey) {
        const b = globalThis.__ryuB_;
        if (!b || !b._3295) return;
        const ch = b._3295.get(dmKey);
        if (!ch) return;
        const msgs = ch._6116._5727 || [];
        const container = document.getElementById('ryu-dm-messages');
        if (!container) return;
        const me = (globalThis.__Be && globalThis.__Be._6988) || '';
        const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
        const existing = container.children.length;
        for (var i = existing; i < msgs.length; i++) {
          const msg = msgs[i];
          const isMine = msg._9072 === me;
          const div = document.createElement('div');
          div.className = 'ryu-dm-msg ' + (isMine ? 'ryu-dm-msg-mine' : 'ryu-dm-msg-theirs');
          div.innerHTML =
            '<div class="ryu-dm-bubble">' + msg._4068 + '</div>' +
            '<div class="ryu-dm-time">' + msg._1998 + '</div>';
          container.appendChild(div);
        }
        if (atBottom) container.scrollTop = container.scrollHeight;
      }

      function openConvo(dmKey) {
        _openDmKey = dmKey;
        const name = dmKey.replace('[DM] ', '');
        const b = globalThis.__ryuB_;
        if (b) {
          if (typeof b._6306 === 'function') b._6306(dmKey);
          if (typeof b._1366 === 'function') b._1366(dmKey);
        }
        document.getElementById('ryu-dm-inbox').style.display = 'none';
        const convo = document.getElementById('ryu-dm-convo');
        convo.classList.add('ryu-dm-convo-open');
        document.getElementById('ryu-dm-convo-name').textContent = name;
        document.getElementById('ryu-dm-messages').innerHTML = '';
        renderMessages(dmKey);
        if (_convoObserver) _convoObserver.disconnect();
        if (b && b._3295) {
          const ch = b._3295.get(dmKey);
          if (ch && ch._6116 && ch._6116._8203) {
            _convoObserver = new MutationObserver(function () { renderMessages(dmKey); });
            _convoObserver.observe(ch._6116._8203, { childList: true });
          }
        }
        var badge = document.getElementById('ryu-dm-notif-' + name);
        if (badge) badge.remove();
        var globalDmBadge = document.getElementById('ryu-dm-notif');
        if (globalDmBadge) globalDmBadge.remove();
      }

      function backToInbox() {
        _openDmKey = null;
        if (_convoObserver) { _convoObserver.disconnect(); _convoObserver = null; }
        const b = globalThis.__ryuB_;
        if (b && typeof b._1366 === 'function') b._1366(_prevNativeChannel);
        document.getElementById('ryu-dm-inbox').style.display = '';
        document.getElementById('ryu-dm-convo').classList.remove('ryu-dm-convo-open');
        renderInbox();
      }

      document.getElementById('ryu-dm-inbox-back').addEventListener('click', function () {
        globalThis.__ryuHideDMPanel();
        var prevCh = (_prevNativeChannel || 'GLOBAL').toLowerCase();
        var prevTab = document.querySelector('.ryu-tab[data-ch="' + prevCh + '"]');
        if (prevTab) prevTab.click();
        else setChannel('global');
      });

      document.getElementById('ryu-dm-back').addEventListener('click', function () {
        if (_openDmKey) {
          backToInbox();
        } else {
          if (globalThis.__ryuHideDMPanel) globalThis.__ryuHideDMPanel();
          setChannel('global');
        }
      });

      function attachUnreadObserver(dmKey, ch) {
        if (_dmObservers[dmKey]) return;
        var obs = new MutationObserver(function () {
          var activeTab = document.querySelector('.ryu-tab.ryu-tab-active');
          var activeCh = activeTab ? activeTab.getAttribute('data-ch') : 'global';
          if (activeCh !== 'dm' || _openDmKey !== dmKey) {
            var dmTab = document.querySelector('.ryu-tab[data-ch="dm"]');
            if (dmTab && !document.getElementById('ryu-dm-notif')) {
              var b = document.createElement('span');
              b.id = 'ryu-dm-notif';
              b.className = 'ryu-tab-notif';
              b.textContent = 'NEW';
              dmTab.appendChild(b);
            }
          }
        });
        obs.observe(ch._6116._8203, { childList: true });
        _dmObservers[dmKey] = obs;
      }

      function hookB_() {
        const b = globalThis.__ryuB_;
        if (!b || !b._3295) return;
        b._3295.forEach(function (ch, key) {
          if (key.startsWith('[DM]')) attachUnreadObserver(key, ch);
        });
        const origSet = b._3295.set.bind(b._3295);
        b._3295.set = function (key, ch) {
          var result = origSet(key, ch);
          if (key.startsWith('[DM]')) {
            setTimeout(function () {
              attachUnreadObserver(key, ch);
              var activeTab = document.querySelector('.ryu-tab.ryu-tab-active');
              var activeCh = activeTab ? activeTab.getAttribute('data-ch') : 'global';
              if (activeCh !== 'dm') {
                var dmTab = document.querySelector('.ryu-tab[data-ch="dm"]');
                if (dmTab && !document.getElementById('ryu-dm-notif')) {
                  var badge = document.createElement('span');
                  badge.id = 'ryu-dm-notif';
                  badge.className = 'ryu-tab-notif';
                  badge.textContent = 'NEW';
                  dmTab.appendChild(badge);
                }
              }
            }, 0);
          }
          return result;
        };
      }

      function waitForB_() {
        if (globalThis.__ryuB_ && globalThis.__ryuB_._3295) hookB_();
        else setTimeout(waitForB_, 300);
      }
      waitForB_();

      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        if (!_openDmKey || !panel.classList.contains('ryu-dm-open')) return;
        if (globalThis.__ryuB_ && typeof globalThis.__ryuB_._6306 === 'function') {
          globalThis.__ryuB_._6306(_openDmKey);
        }
      }, true);

      globalThis.__ryuShowDMPanel = function (dmKey) {
        _prevNativeChannel = (globalThis.__ryuB_ && globalThis.__ryuB_._4756) || 'GLOBAL';
        document.querySelectorAll('.ryu-tab').forEach(function (t) {
          t.classList.toggle('ryu-tab-active', t.getAttribute('data-ch') === 'dm');
        });
        var dmBadge = document.getElementById('ryu-dm-notif');
        if (dmBadge) dmBadge.remove();
        positionPanel();
        panel.classList.add('ryu-dm-open');
        if (dmKey) openConvo(dmKey);
        else { backToInbox(); renderInbox(); }
      };
      globalThis.__ryuHideDMPanel = function () {
        panel.classList.remove('ryu-dm-open');
        if (_convoObserver) { _convoObserver.disconnect(); _convoObserver = null; }
        _openDmKey = null;
        const b = globalThis.__ryuB_;
        if (b && typeof b._1366 === 'function') {
          b._1366(_prevNativeChannel);
        }
      };
    })();

    setTimeout(startObserver, 500);

    (function () {
      function applyTimestamps() {
        var el = document.getElementById('chbxsm-hide-timestamps');
        if (!el) return;
        var hidden = el.classList.contains('iconfont-checkbox');
        document.querySelectorAll('.chbx-message-time').forEach(function (t) {
          t.style.setProperty('display', hidden ? 'none' : 'inline-block', 'important');
        });
      }
      new MutationObserver(function () {
        var el = document.getElementById('chbxsm-hide-timestamps');
        if (!el || el._ryuWired) return;
        el._ryuWired = true;
        el.addEventListener('click', function () {
          setTimeout(applyTimestamps, 0);
        });
      }).observe(document.body, { childList: true, subtree: true });
      globalThis.__ryuApplyTimestamps = applyTimestamps;
    })();
  }

  function removeAll() {
    if (!_applied) return;
    _applied = false;
    removeStyle();
    removeHeader();
    stopObserver();
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
      const rh = document.getElementById('ryu-chat-resize-handle');
      if (rh) rh.remove();
      const ov = document.getElementById('ryu-chat-drag-override');
      if (ov) ov.remove();
      chatbox.style.cssText = '';
      chatbox.style.transform = '';
      chatbox.style.transformOrigin = '';
      chatbox.style.zoom = '';
      delete chatbox.dataset.ryuChatDragZoom;
      const body = chatbox.querySelector('.chbx-body');
      if (body) body.style.height = '';
    }
  }

  let _lastChatboxOn = null;
  let _lastChatScale = null;
  setInterval(function () {
    const t = loadTheme();
    const on = !!t.chatboxThemeOn && !t.useDefault;
    if (on !== _lastChatboxOn) {
      _lastChatboxOn = on;
      if (on) applyAll();
      else removeAll();
    }
    if (on) {
      const sc = t.chatScale || 50;
      if (sc !== _lastChatScale) { _lastChatScale = sc; applyChatScale(sc); }
    }
  }, 500);

  console.log('[RyuTheme] CHATBOX LOADED.');
})();
