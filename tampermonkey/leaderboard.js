/* leaderboard.js — auto-deferred for Tampermonkey */
(function(){
  function __ryuRun(){
// leaderboard UI

(function () {
  'use strict';

  const STYLE_ID  = 'ryu-lb-redesign-style';
  const HEADER_ID = 'ryu-lb-header';
  const STORAGE_KEY = 'ryuTheme';

  // storage
  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function getLBStyle(theme) {
    var v = theme && theme.lbStyle !== undefined ? theme.lbStyle : 0;
    v = parseInt(v, 10);
    return v === 1 ? 1 : 0;
  }

  // convert rgb string to rgba with given alpha
  function toRgba(colorStr, alpha) {
    if (!colorStr || colorStr === 'transparent') return null;
    var m = colorStr.match(/\d+/g);
    if (m && m.length >= 3) return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + alpha + ')';
    return null;
  }

  var _lbObserver = null;
  var _colorPollId = null;
  var _slimColorCache = {};
  var _stylingEntries = false;
  var _lbDragCss = '';
  var LB_ENTRY_FONT = '"Titillium Web","Noto Sans",Arial,sans-serif';

  function clearEnhancedEntry(entry, keepSlimInline) {
    var slimName = entry.querySelector('.ryu-lb-slim-name');
    if (slimName && !keepSlimInline) {
      while (slimName.firstChild) entry.insertBefore(slimName.firstChild, slimName);
      slimName.remove();
    }
    var slimRow = entry.querySelector('.ryu-lb-slim-row');
    if (slimRow) {
      while (slimRow.firstChild) entry.insertBefore(slimRow.firstChild, slimRow);
      slimRow.remove();
    }
    var fill = entry.querySelector('.ryu-lb-fill');
    if (fill) fill.remove();
    var nameBlock = entry.querySelector('.ryu-lb-name-block');
    if (nameBlock) {
      while (nameBlock.firstChild) entry.insertBefore(nameBlock.firstChild, nameBlock);
      nameBlock.remove();
    }
  }

  // inject TOP 10 header above entries
  function injectLBHeader() {
    var lb = document.getElementById('leaderboard');
    if (!lb) return;
    var header = document.getElementById(HEADER_ID);
    if (!header) {
      header = document.createElement('div');
      header.id = HEADER_ID;
      lb.insertBefore(header, lb.firstChild);
    }
    var _s = getLBStyle(loadTheme());
    if (_s === 1) {
      header.className = 'ryu-lb-header-agar';
      header.innerHTML = '<div class="ryu-lb-title">Leaderboard</div>';
    } else {
      header.className = 'ryu-lb-header-slim';
      header.innerHTML = '<div class="ryu-lb-title">RYUTHEME</div>';
    }
  }

  function styleAgarEntries(entries) {
    entries.forEach(function(entry, i) {
      clearEnhancedEntry(entry);

      var rankEl = entry.querySelector('.ryu-lb-rank');
      if (!rankEl) {
        rankEl = document.createElement('div');
        rankEl.className = 'ryu-lb-rank';
        entry.insertBefore(rankEl, entry.firstChild);
      }
      rankEl.textContent = (i + 1) + '.';
      rankEl.style.cssText = 'width:22px;min-width:22px;text-align:right;font-family:"Noto Sans",Arial,sans-serif;font-size:15px;font-weight:700;line-height:19px;color:rgba(255,255,255,0.92);text-shadow:0 1px 1px rgba(0,0,0,0.18);position:relative;z-index:2;';

      var teamEl = entry.querySelector('.leaderboard-team');
      var nickEl = entry.querySelector('.leaderboard-nick');
      var energyEl = entry.querySelector('.leaderboard-energy');
      var colorEl = entry.querySelector('.leaderboard-team-color');
      var nameText = nickEl ? nickEl.textContent.trim() : '';
      var unnamed = !nameText || /unnamed/i.test(nameText);

      entry.style.cssText = entry.style.opacity ? 'opacity:' + entry.style.opacity + ';' : '';
      entry.style.setProperty('display', 'flex', 'important');
      entry.style.setProperty('flex-direction', 'row', 'important');
      entry.style.setProperty('align-items', 'baseline', 'important');
      entry.style.setProperty('gap', '4px', 'important');
      entry.style.setProperty('padding', '0 12px', 'important');
      entry.style.setProperty('min-height', '19px', 'important');
      entry.style.setProperty('width', '100%', 'important');
      entry.style.setProperty('box-sizing', 'border-box', 'important');
      entry.style.setProperty('background', 'transparent', 'important');
      entry.style.setProperty('border', '0', 'important');
      entry.style.setProperty('overflow', 'hidden', 'important');

      if (teamEl) {
        var showTeam = teamEl.textContent.trim() !== '' && teamEl.style.display !== 'none';
        teamEl.style.cssText = showTeam
          ? 'display:inline !important;font-family:"Noto Sans",Arial,sans-serif;font-size:15px;font-weight:650;line-height:19px;color:rgba(255,255,255,0.88);text-shadow:0 1px 1px rgba(0,0,0,0.18);white-space:nowrap;'
          : 'display:none !important;';
      }

      if (nickEl) {
        nickEl.style.cssText = 'display:block !important;flex:1;min-width:0;font-family:"Noto Sans",Arial,sans-serif;font-size:15px;font-weight:650;line-height:19px;color:' + (unnamed ? 'rgba(255,145,145,0.95)' : 'rgba(255,255,255,0.94)') + ';text-shadow:0 1px 1px rgba(0,0,0,0.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      }

      if (energyEl) energyEl.style.cssText = 'display:none !important;';
      if (colorEl) colorEl.style.setProperty('display', 'none', 'important');
    });
  }

  // slim style — minimal Agar.io-style centered rows with RyuTheme color
  function styleSlimEntries(entries) {
    var slimSize = loadTheme().lbSize || 'M';
    var slimMetrics = {
      S: { rankCol: '22px', nameCol: '1fr', massCol: 'minmax(54px,max-content)', entryPad: '5px 5px 5px 0', minHeight: '28px', gap: '4px', energySize: '12px', energyLine: '16px', nameSize: '14px', nameLine: '18px', tagSize: '12px', tagLine: '16px' },
      M: { rankCol: '24px', nameCol: '1fr', massCol: 'minmax(62px,max-content)', entryPad: '6px 6px 6px 0', minHeight: '32px', gap: '4px', energySize: '13px', energyLine: '17px', nameSize: '16px', nameLine: '20px', tagSize: '14px', tagLine: '18px' },
      L: { rankCol: '26px', nameCol: '1fr', massCol: 'minmax(70px,max-content)', entryPad: '7px 7px 7px 0', minHeight: '35px', gap: '5px', energySize: '14px', energyLine: '18px', nameSize: '17px', nameLine: '21px', tagSize: '15px', tagLine: '19px' }
    };
    var sm = slimMetrics[slimSize] || slimMetrics.M;
    entries.forEach(function(entry, i) {
      clearEnhancedEntry(entry, true);
      var fill = entry.querySelector('.ryu-lb-fill');
      if (fill) fill.remove();

      var rankEl = entry.querySelector('.ryu-lb-rank');
      if (!rankEl) {
        rankEl = document.createElement('div');
        rankEl.className = 'ryu-lb-rank';
        entry.insertBefore(rankEl, entry.firstChild);
      }
      var rankText = (i + 1) + '.';
      if (rankEl.textContent !== rankText) rankEl.textContent = rankText;

      var nickEl   = entry.querySelector('.leaderboard-nick');
      var teamEl   = entry.querySelector('.leaderboard-team');
      var energyEl = entry.querySelector('.leaderboard-energy');
      var colorEl  = entry.querySelector('.leaderboard-team-color');
      var nameWrap = entry.querySelector('.ryu-lb-slim-name');
      if (!nameWrap) {
        nameWrap = document.createElement('div');
        nameWrap.className = 'ryu-lb-slim-name';
        rankEl.insertAdjacentElement('afterend', nameWrap);
      }

      // read team color for name color-coding, cache by name to avoid white flash on re-render
      var playerName = nickEl ? nickEl.textContent.trim() : null;
      var bg = colorEl ? colorEl.style.backgroundColor : '';
      if ((!bg || bg === 'transparent') && colorEl) bg = getComputedStyle(colorEl).backgroundColor;
      var hasColor = bg && bg !== '' && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
      if (hasColor && playerName) _slimColorCache[playerName] = bg;
      var nameColor = hasColor ? bg : (playerName && _slimColorCache[playerName]) || 'rgba(255,255,255,0.88)';
      var teamText = teamEl ? teamEl.textContent.trim() : '';
      var showTeam = !!(teamText && hasColor);

      entry.style.cssText = entry.style.opacity ? 'opacity:' + entry.style.opacity + ';' : '';
      entry.style.setProperty('display', 'grid', 'important');
      entry.style.setProperty('grid-template-columns', sm.rankCol + ' minmax(0,' + sm.nameCol + ') ' + sm.massCol, 'important');
      entry.style.setProperty('justify-content', 'stretch', 'important');
      entry.style.setProperty('align-items', 'center', 'important');
      entry.style.setProperty('column-gap', sm.gap, 'important');
      entry.style.setProperty('padding', sm.entryPad, 'important');
      entry.style.setProperty('min-height', sm.minHeight, 'important');
      entry.style.setProperty('width', '100%', 'important');
      entry.style.setProperty('box-sizing', 'border-box', 'important');
      entry.style.setProperty('background', 'transparent', 'important');
      entry.style.setProperty('border-bottom', '1px solid rgba(255,255,255,0.04)', 'important');
      entry.style.setProperty('overflow', 'hidden', 'important');

      rankEl.style.cssText =
        'grid-column:1;min-width:0;text-align:right;font-family:' + LB_ENTRY_FONT + ';' +
        'font-size:' + sm.tagSize + ';font-weight:800;line-height:' + sm.tagLine + ';color:rgba(255,255,255,0.86);text-shadow:none;';

      nameWrap.style.cssText =
        'grid-column:2;display:flex!important;align-items:center;gap:3px;min-width:0;width:100%;max-width:100%;' +
        'white-space:nowrap;overflow:hidden;';
      if (teamEl && teamEl.parentNode !== nameWrap) nameWrap.appendChild(teamEl);
      if (nickEl && nickEl.parentNode !== nameWrap) nameWrap.appendChild(nickEl);
      if (energyEl && energyEl.parentNode !== entry) entry.appendChild(energyEl);

      if (nickEl) {
        nickEl.style.cssText =
          'display:block!important;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
          'font-family:' + LB_ENTRY_FONT + ';font-size:' + sm.nameSize + ';font-weight:800;line-height:' + sm.nameLine + ';' +
          'text-shadow:none;letter-spacing:0.1px;';
        nickEl.style.setProperty('color', nameColor, 'important');
      }

      if (teamEl) {
        teamEl.style.cssText = showTeam
          ? 'display:block!important;flex:0 0 auto;min-width:0;white-space:nowrap;overflow:visible;text-overflow:clip;font-family:' + LB_ENTRY_FONT + ';font-size:' + sm.tagSize + ';font-weight:800;line-height:' + sm.tagLine + ';text-shadow:none;text-align:left;'
          : 'display:none!important;';
        if (showTeam) teamEl.style.setProperty('color', nameColor, 'important');
      }
      if (energyEl) {
        energyEl.style.cssText =
          'grid-column:3;display:block!important;justify-self:end;min-width:max-content;width:max-content;max-width:100%;white-space:nowrap;overflow:visible;text-overflow:clip;text-align:right;box-sizing:border-box;' +
          'font-family:' + LB_ENTRY_FONT + ';font-size:' + sm.energySize + ';font-weight:800;line-height:' + sm.energyLine + ';' +
          'color:rgba(255,255,255,0.52);text-shadow:none;letter-spacing:0;font-variant-numeric:tabular-nums;';
      }
      if (colorEl) colorEl.style.setProperty('display', 'none', 'important');
    });
  }

  // style each leaderboard entry with rank badge + accent color fill
  function styleEntries() {
    if (_stylingEntries) return;
    _stylingEntries = true;
    try {
    var t = loadTheme();
    if (t.useDefault || t.lbThemeOn === false) return;
    var entries = document.querySelectorAll('.leaderboard-entry');
    if (getLBStyle(t) === 1) {
      styleAgarEntries(entries);
      return;
    }
    styleSlimEntries(entries);
    return;
    entries.forEach(function (entry, i) {
      var nickEl  = entry.querySelector('.leaderboard-nick');
      var colorEl = entry.querySelector('.leaderboard-team-color');

      var bg = colorEl ? colorEl.style.backgroundColor : '';
      if ((!bg || bg === '' || bg === 'transparent') && colorEl) {
        bg = getComputedStyle(colorEl).backgroundColor;
      }
      var hasColor = bg && bg !== '' && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
      var accent = hasColor ? bg : null;

      var fill = entry.querySelector('.ryu-lb-fill');
      if (!fill) {
        fill = document.createElement('div');
        fill.className = 'ryu-lb-fill';
        entry.insertBefore(fill, entry.firstChild);
      }
      var pct = Math.max(15, 100 - i * 9);
      fill.style.cssText = accent
        ? 'position:absolute;left:0;top:0;bottom:0;width:' + pct + '%;background:linear-gradient(90deg,' + toRgba(accent, 0.07) + ',' + toRgba(accent, 0.16) + ');border-right:1px solid ' + toRgba(accent, 0.25) + ';pointer-events:none;z-index:0;'
        : 'position:absolute;left:0;top:0;bottom:0;width:' + pct + '%;background:linear-gradient(90deg,rgba(34,211,238,0.03),rgba(34,211,238,0.07));border-right:1px solid rgba(34,211,238,0.1);pointer-events:none;z-index:0;';

      var rankEl = entry.querySelector('.ryu-lb-rank');
      if (!rankEl) {
        rankEl = document.createElement('div');
        rankEl.className = 'ryu-lb-rank';
        entry.insertBefore(rankEl, fill.nextSibling);
      }
      var rankText = String(i + 1);
      if (rankEl.textContent !== rankText) rankEl.textContent = rankText;
      rankEl.style.cssText = accent
        ? 'width:20px;height:20px;min-width:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:"Noto Sans",sans-serif;font-size:9px;font-weight:800;position:relative;z-index:2;flex-shrink:0;border:1px solid ' + toRgba(accent, 0.5) + ';background:' + toRgba(accent, 0.12) + ';color:' + accent + ';'
        : 'width:20px;height:20px;min-width:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:"Noto Sans",sans-serif;font-size:9px;font-weight:800;position:relative;z-index:2;flex-shrink:0;border:1px solid rgba(34,211,238,0.2);background:transparent;color:rgba(34,211,238,0.5);';

      var nameBlock = entry.querySelector('.ryu-lb-name-block');
      var teamEl = entry.querySelector('.leaderboard-team');
      var nickEl = entry.querySelector('.leaderboard-nick');
      if (!nameBlock && (teamEl || nickEl)) {
        nameBlock = document.createElement('div');
        nameBlock.className = 'ryu-lb-name-block';
        rankEl.insertAdjacentElement('afterend', nameBlock);
        if (teamEl) nameBlock.appendChild(teamEl);
        if (nickEl) nameBlock.appendChild(nickEl);
      }

      if (teamEl) {
        var showTeam = teamEl.textContent.trim() !== '' && teamEl.style.display !== 'none';
        if (showTeam) {
          teamEl.style.setProperty('font-family', '"Noto Sans",sans-serif');
          teamEl.style.setProperty('font-size', '11px');
          teamEl.style.setProperty('font-weight', '800');
          teamEl.style.setProperty('letter-spacing', '0.5px');
          teamEl.style.setProperty('line-height', '1.1');
          teamEl.style.setProperty('white-space', 'nowrap');
          teamEl.style.setProperty('overflow', 'visible');
          teamEl.style.setProperty('text-overflow', 'clip');
          teamEl.style.setProperty('color', accent || 'rgba(34,211,238,0.9)');
          teamEl.style.setProperty('text-shadow', 'none');
        }
      }

      if (nickEl) {
        nickEl.style.setProperty('display', 'block', 'important');
        nickEl.style.setProperty('font-family', '"Noto Sans",sans-serif');
        nickEl.style.setProperty('font-size', i === 0 ? '16px' : '14px');
        nickEl.style.setProperty('font-weight', i === 0 ? '700' : '600');
        nickEl.style.setProperty('color', accent || '#ffffff');
        nickEl.style.setProperty('text-shadow', 'none');
        nickEl.style.setProperty('white-space', 'nowrap');
        nickEl.style.setProperty('overflow', 'hidden');
        nickEl.style.setProperty('text-overflow', 'ellipsis');
      }

      var energyEl = entry.querySelector('.leaderboard-energy');
      if (energyEl) {
        energyEl.style.cssText = 'display:block !important;font-family:"Noto Sans",sans-serif;font-size:10px;font-weight:800;flex-shrink:0;letter-spacing:0.3px;position:relative;z-index:2;margin-left:auto;padding-left:4px;color:' + (accent || 'rgba(34,211,238,0.5)') + ';text-shadow:none;';
      }

      if (colorEl) colorEl.style.setProperty('display', 'none', 'important');
    });
    } finally {
      _stylingEntries = false;
    }
  }

  // inject leaderboard styles
  function applyStyle() {
    var el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    if (getLBStyle(loadTheme()) !== 1) {
      el.textContent = `
        #leaderboard {
          background: rgba(9,13,18,0.90) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid rgba(34,211,238,0.14) !important;
          border-radius: 6px !important;
          overflow: hidden !important;
          padding: 0 !important;
          width: 285px !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18) !important;
        }
        #leaderboard::before { display: none !important; }
        #ryu-lb-header {
          padding: 9px 12px 8px !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          background: rgba(34,211,238,0.05) !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }
        .ryu-lb-title {
          font-family: 'Noto Sans', sans-serif !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          letter-spacing: 5px !important;
          color: #22d3ee !important;
          text-transform: uppercase !important;
          text-align: center !important;
          text-shadow: none !important;
          animation: none !important;
          display: block !important;
          width: 100% !important;
          padding-left: 5px !important;
        }
        .ryu-lb-title-sub, .ryu-lb-fill { display: none !important; }
        .leaderboard-entry {
          display: grid !important;
          grid-template-columns: 24px minmax(0,1fr) minmax(62px,max-content) !important;
          align-items: center !important;
          justify-content: stretch !important;
          column-gap: 4px !important;
          gap: 4px !important;
          padding: 6px 4px 6px 0 !important;
          min-height: 31px !important;
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          width: 100% !important;
          box-sizing: border-box !important;
          background: transparent !important;
          overflow: hidden !important;
          transition: background 0.1s !important;
        }
        .ryu-lb-rank {
          grid-column: 1 !important;
          min-width: 0 !important;
          text-align: right !important;
        }
        .ryu-lb-slim-name {
          grid-column: 2 !important;
          display: flex !important;
          align-items: center !important;
          gap: 3px !important;
          min-width: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }
        .leaderboard-nick {
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .leaderboard-team {
          min-width: 0 !important;
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
          text-align: left !important;
        }
        .leaderboard-entry:last-child { border-bottom: none !important; border-radius: 0 0 6px 6px !important; }
        .leaderboard-entry:hover { background: rgba(255,255,255,0.03) !important; }
        .leaderboard-energy {
          min-width: max-content !important;
          width: max-content !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          font-variant-numeric: tabular-nums !important;
        }
        .leaderboard-team-color, .leaderboard-energy { display: none !important; }
      `;
      return;
    }
    if (getLBStyle(loadTheme()) === 1) {
      el.textContent = `
        #leaderboard {
          background: rgba(92,101,104,0.66) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 2px !important;
          overflow: hidden !important;
          padding: 0 0 12px !important;
          width: 230px !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
          backdrop-filter: blur(1px) !important;
        }
        #leaderboard::before { display: none !important; }
        #ryu-lb-header {
          background: rgba(255,255,255,0.04) !important;
          border: 0 !important;
          padding: 12px 10px 9px !important;
          width: 100% !important;
          position: relative !important;
          z-index: 2 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          box-sizing: border-box !important;
        }
        .ryu-lb-title {
          font-family: "Noto Sans", Arial, sans-serif !important;
          font-size: 22px !important;
          font-weight: 500 !important;
          letter-spacing: 0.2px !important;
          color: rgba(255,255,255,0.96) !important;
          text-align: center !important;
          width: 100% !important;
          text-shadow: 0 1px 1px rgba(0,0,0,0.2) !important;
        }
        .ryu-lb-title-sub, .ryu-lb-fill { display: none !important; }
        .leaderboard-entry {
          display: flex !important;
          flex-direction: row !important;
          align-items: baseline !important;
          gap: 4px !important;
          padding: 0 12px !important;
          min-height: 19px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          background: transparent !important;
          border: 0 !important;
          overflow: hidden !important;
          color: rgba(255,255,255,0.94) !important;
        }
        .leaderboard-entry:hover { background: rgba(255,255,255,0.035) !important; }
        .leaderboard-team-color, .leaderboard-energy { display: none !important; }
      `;
      return;
    }
    el.textContent = `
      #leaderboard {
        background: rgba(9,13,18,0.88) !important;
        border: 1px solid rgba(34,211,238,0.18) !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        padding: 0 !important;
        width: 300px !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
      }
      #leaderboard::before { display: none !important; }
      #ryu-lb-header {
        background: rgba(34,211,238,0.04) !important;
        border-bottom: 1px solid rgba(34,211,238,0.1) !important;
        padding: 7px 14px 6px !important;
        width: 100% !important;
        position: relative !important;
        z-index: 2 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        border-radius: 8px 8px 0 0 !important;
      }
      .ryu-lb-title {
        font-family: 'Orbitron', sans-serif !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        color: #ffffff !important;
        letter-spacing: 5px !important;
        padding-left: 5px !important;
        text-shadow: none !important;
        animation: none !important;
        display: block !important;
        text-align: center !important;
        width: 100% !important;
      }
      .ryu-lb-title-sub {
        font-family: 'Noto Sans', sans-serif !important;
        font-size: 9px !important;
        color: rgba(34,211,238,0.45) !important;
        letter-spacing: 3px !important;
        padding-left: 3px !important;
        margin-top: 3px !important;
        font-weight: 700 !important;
        display: block !important;
        text-align: center !important;
        width: 100% !important;
        text-shadow: none !important;
      }
      .leaderboard-entry {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        gap: 7px !important;
        padding: 4px 10px 4px 8px !important;
        border-bottom: 1px solid rgba(34,211,238,0.06) !important;
        position: relative !important;
        overflow: hidden !important;
        background: transparent !important;
        min-height: 28px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        transition: background 0.12s !important;
      }
      .leaderboard-entry:last-child {
        border-bottom: none !important;
        border-radius: 0 0 8px 8px !important;
      }
      .leaderboard-entry:hover { background: rgba(34,211,238,0.03) !important; }
      .ryu-lb-name-block {
        flex: 1 !important;
        min-width: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        position: relative !important;
        z-index: 2 !important;
        overflow: visible !important;
      }
    `;
  }

  // per-resolution S/M/L size presets
  var LB_SIZES = {
    '2550p': {
      S: { width:'295px', entryPad:'4px 11px 4px 9px', gap:'7px', minHeight:'31px', nameSize:'15px', nameSizeTop:'17px', tagSize:'12px', energySize:'11px', rankSize:'10px', rankWH:'22px', headerPad:'8px 14px 7px' },
      M: { width:'312px', entryPad:'5px 12px 5px 10px', gap:'8px', minHeight:'33px', nameSize:'16px', nameSizeTop:'18px', tagSize:'13px', energySize:'12px', rankSize:'11px', rankWH:'23px', headerPad:'9px 16px 8px' },
      L: { width:'340px', entryPad:'6px 13px 6px 11px', gap:'9px', minHeight:'37px', nameSize:'18px', nameSizeTop:'20px', tagSize:'14px', energySize:'13px', rankSize:'12px', rankWH:'26px', headerPad:'10px 17px 9px' }
    },
    '1440p': {
      S: { width:'240px', entryPad:'3px 9px 3px 7px', gap:'6px', minHeight:'26px', nameSize:'12px', nameSizeTop:'14px', tagSize:'10px', energySize:'10px', rankSize:'9px', rankWH:'18px', headerPad:'6px 12px 5px' },
      M: { width:'265px', entryPad:'4px 10px 4px 8px', gap:'7px', minHeight:'29px', nameSize:'14px', nameSizeTop:'16px', tagSize:'11px', energySize:'11px', rankSize:'10px', rankWH:'20px', headerPad:'7px 14px 6px' },
      L: { width:'295px', entryPad:'5px 11px 5px 9px', gap:'8px', minHeight:'33px', nameSize:'16px', nameSizeTop:'18px', tagSize:'12px', energySize:'12px', rankSize:'11px', rankWH:'23px', headerPad:'9px 15px 8px' }
    },
    '1080p': {
      S: { width:'235px', entryPad:'3px 9px 3px 7px', gap:'6px', minHeight:'26px', nameSize:'12px', nameSizeTop:'14px', tagSize:'10px', energySize:'10px', rankSize:'9px', rankWH:'18px', headerPad:'6px 12px 5px' },
      M: { width:'260px', entryPad:'4px 10px 4px 8px', gap:'7px', minHeight:'29px', nameSize:'14px', nameSizeTop:'16px', tagSize:'11px', energySize:'11px', rankSize:'10px', rankWH:'20px', headerPad:'7px 13px 6px' },
      L: { width:'285px', entryPad:'5px 11px 5px 9px', gap:'7px', minHeight:'31px', nameSize:'16px', nameSizeTop:'18px', tagSize:'12px', energySize:'12px', rankSize:'11px', rankWH:'23px', headerPad:'8px 14px 7px' }
    }
  };

  function getResKey() {
    var h = window.screen.height;
    if (h <= 1080) return '1080p';
    if (h <= 1440) return '1440p';
    return '2550p';
  }

  function applyLBSize(val) {
    var lb = document.getElementById('leaderboard');
    if (!lb) return;
    var res = getResKey();
    var preset = (LB_SIZES[res] || LB_SIZES['1080p']);
    var s = preset[val] || preset['M'];
    lb.style.transform = '';
    lb.style.transformOrigin = '';
    var styleEl = document.getElementById('ryu-lb-size-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ryu-lb-size-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    var _curLBStyle = getLBStyle(loadTheme());
    if (_curLBStyle !== 1) {
      var slimSizes = {
        S: { width:'268px', headerPad:'8px 10px 7px', entryPad:'5px 5px 5px 0', minHeight:'28px', nameSize:'14px', tagSize:'12px', energySize:'12px', rankSize:'12px', rankCol:'22px', massCol:'minmax(54px,max-content)', gap:4, titleSize:'11px', titleSpacing:'4px' },
        M: { width:'301px', headerPad:'9px 10px 8px', entryPad:'6px 6px 6px 0', minHeight:'32px', nameSize:'16px', tagSize:'14px', energySize:'13px', rankSize:'14px', rankCol:'24px', massCol:'minmax(62px,max-content)', gap:4, titleSize:'12px', titleSpacing:'5px' },
        L: { width:'336px', headerPad:'10px 12px 9px', entryPad:'7px 7px 7px 0', minHeight:'35px', nameSize:'17px', tagSize:'15px', energySize:'14px', rankSize:'15px', rankCol:'26px', massCol:'minmax(70px,max-content)', gap:5, titleSize:'13px', titleSpacing:'6px' }
      };
      var sl = slimSizes[val] || slimSizes.M;
      styleEl.textContent =
        '#leaderboard{width:' + sl.width + '!important;transform:none!important;}' +
        '#ryu-lb-header{padding:' + sl.headerPad + '!important;}' +
        '.ryu-lb-title{font-size:' + sl.titleSize + '!important;letter-spacing:' + sl.titleSpacing + '!important;padding-left:' + sl.titleSpacing + '!important;}' +
        '.leaderboard-entry{grid-template-columns:' + sl.rankCol + ' minmax(0,1fr) ' + sl.massCol + '!important;padding:' + sl.entryPad + '!important;min-height:' + sl.minHeight + '!important;column-gap:' + sl.gap + 'px!important;gap:' + sl.gap + 'px!important;justify-content:stretch!important;}' +
        '.ryu-lb-slim-name{width:100%!important;max-width:100%!important;gap:3px!important;}' +
        '.ryu-lb-rank,.leaderboard-nick,.leaderboard-team,.leaderboard-energy{font-family:' + LB_ENTRY_FONT + '!important;}' +
        '.leaderboard-nick{font-size:' + sl.nameSize + '!important;line-height:' + Math.round(parseInt(sl.nameSize, 10) * 1.25) + 'px!important;}' +
        '.leaderboard-team{font-size:' + sl.tagSize + '!important;line-height:' + Math.round(parseInt(sl.tagSize, 10) * 1.25) + 'px!important;}' +
        '.leaderboard-energy{font-size:' + sl.energySize + '!important;line-height:' + Math.round(parseInt(sl.energySize, 10) * 1.35) + 'px!important;min-width:max-content!important;width:max-content!important;max-width:100%!important;font-variant-numeric:tabular-nums!important;}' +
        '.ryu-lb-rank{font-size:' + sl.rankSize + '!important;line-height:' + Math.round(parseInt(sl.rankSize, 10) * 1.25) + 'px!important;}';
      return;
    }
    if (_curLBStyle === 1) {
      var agarSizes = {
        S: { width:'212px', headerPad:'10px 9px 7px', titleSize:'20px', entryPad:'0 11px', minHeight:'18px', entrySize:'14px', lineHeight:'18px', rankWidth:'21px' },
        M: { width:'230px', headerPad:'12px 10px 9px', titleSize:'22px', entryPad:'0 12px', minHeight:'19px', entrySize:'15px', lineHeight:'19px', rankWidth:'22px' },
        L: { width:'250px', headerPad:'13px 12px 10px', titleSize:'24px', entryPad:'1px 14px', minHeight:'21px', entrySize:'16px', lineHeight:'21px', rankWidth:'24px' }
      };
      var a = agarSizes[val] || agarSizes.M;
      styleEl.textContent =
        '#leaderboard{width:' + a.width + '!important;transform:none!important;}' +
        '#ryu-lb-header{padding:' + a.headerPad + '!important;}' +
        '.ryu-lb-title{font-size:' + a.titleSize + '!important;}' +
        '.leaderboard-entry{padding:' + a.entryPad + '!important;min-height:' + a.minHeight + '!important;gap:4px!important;}' +
        '.ryu-lb-rank{width:' + a.rankWidth + '!important;min-width:' + a.rankWidth + '!important;font-size:' + a.entrySize + '!important;line-height:' + a.lineHeight + '!important;}' +
        '.leaderboard-nick,.leaderboard-team{font-size:' + a.entrySize + '!important;line-height:' + a.lineHeight + '!important;}';
      return;
    }
    styleEl.textContent =
      '#leaderboard{width:' + s.width + '!important;transform:none!important;}' +
      '#ryu-lb-header{padding:' + s.headerPad + '!important;}' +
      '.leaderboard-entry{padding:' + s.entryPad + '!important;gap:' + s.gap + '!important;min-height:' + s.minHeight + '!important;}' +
      '.leaderboard-nick{font-size:' + s.nameSize + '!important;}' +
      '.leaderboard-entry:first-child .leaderboard-nick{font-size:' + s.nameSizeTop + '!important;}' +
      '.leaderboard-team{font-size:' + s.tagSize + '!important;}' +
      '.leaderboard-energy{font-size:' + s.energySize + '!important;}' +
      '.ryu-lb-rank{width:' + s.rankWH + '!important;height:' + s.rankWH + '!important;min-width:' + s.rankWH + '!important;font-size:' + s.rankSize + '!important;}';
  }

  // inject a style that beats all !important size rules (last-in-source wins)
  function _getLBDragBaseHeight(isRyuStyle) {
    var size = loadTheme().lbSize || 'M';
    if (isRyuStyle) {
      return size === 'S' ? 258 : size === 'L' ? 338 : 300;
    }
    return size === 'S' ? 200 : size === 'L' ? 260 : 230;
  }

  function _getLBDragBaseWidth(isRyuStyle) {
    var size = loadTheme().lbSize || 'M';
    if (isRyuStyle) {
      return size === 'S' ? 268 : size === 'L' ? 336 : 301;
    }
    return size === 'S' ? 212 : size === 'L' ? 250 : 230;
  }

  function _ensureLBScaleWrap(lb) {
    if (!lb || !lb.parentNode) return null;
    var wrap = document.getElementById('ryu-lb-scale-wrap');
    if (wrap && lb.parentNode === wrap) return wrap;
    if (wrap && wrap.parentNode) wrap.remove();
    wrap = document.createElement('div');
    wrap.id = 'ryu-lb-scale-wrap';
    lb.parentNode.insertBefore(wrap, lb);
    wrap.appendChild(lb);
    return wrap;
  }

  function _setLBDragSize(w, h, dragState) {
    var ov = document.getElementById('ryu-lb-drag-override');
    if (ov) { ov.remove(); _lbDragCss = ''; }
    var isRyuStyle = dragState ? dragState.isRyuStyle : getLBStyle(loadTheme()) !== 1;
    var baseWidth = dragState ? dragState.baseWidth : _getLBDragBaseWidth(isRyuStyle);
    var baseHeight = dragState ? dragState.baseHeight : _getLBDragBaseHeight(isRyuStyle);
    var widthRatio = w ? w / baseWidth : 1;
    var heightRatio = h ? h / baseHeight : 1;
    var zoomRaw = (widthRatio + heightRatio) / 2;
    var zoom = Math.max(0.55, Math.min(1.45, Math.round(zoomRaw * 1000) / 1000));
    var lb = document.getElementById('leaderboard');
    if (!lb) return;
    var wrap = _ensureLBScaleWrap(lb);
    var naturalHeight = dragState && dragState.naturalHeight ? dragState.naturalHeight : (lb.offsetHeight || baseHeight);
    lb.dataset.ryuDragZoom = String(zoom);
    if (wrap) {
      wrap.style.display = 'block';
      wrap.style.position = 'relative';
      wrap.style.width = Math.round(baseWidth * zoom) + 'px';
      wrap.style.height = Math.round(naturalHeight * zoom) + 'px';
      wrap.style.overflow = 'visible';
    }
    lb.style.setProperty('width', baseWidth + 'px', 'important');
    lb.style.setProperty('min-width', '0', 'important');
    lb.style.setProperty('height', 'auto', 'important');
    lb.style.setProperty('max-height', 'none', 'important');
    lb.style.setProperty('overflow', 'hidden', 'important');
    lb.style.removeProperty('zoom');
    lb.style.setProperty('transform', 'scale(' + zoom + ')', 'important');
    lb.style.setProperty('transform-origin', 'top left', 'important');
  }

  // drag resize handle — bottom-left corner of leaderboard (Win11 style)
  function addLBResizeHandle() {
    var lb = document.getElementById('leaderboard');
    if (!lb || document.getElementById('ryu-lb-resize-handle')) return;

    if (getComputedStyle(lb).position === 'static') lb.style.position = 'relative';

    // restore any saved drag dimensions
    var t0 = loadTheme();
    if (t0.lbDragW || t0.lbDragH) _setLBDragSize(t0.lbDragW || lb.getBoundingClientRect().width, t0.lbDragH || null);

    var handle = document.createElement('div');
    handle.id = 'ryu-lb-resize-handle';
    handle.title = 'Drag to resize leaderboard';
    handle.style.cssText =
      'position:absolute;bottom:0;left:0;width:20px;height:20px;cursor:sw-resize;' +
      'z-index:10001;display:flex;align-items:flex-end;justify-content:flex-start;' +
      'padding:3px;opacity:0.3;transition:opacity 0.15s;user-select:none;touch-action:none;';
    handle.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
      '<line x1="1" y1="1" x2="11" y2="11" stroke="rgba(34,211,238,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '<line x1="1" y1="6" x2="6" y2="11" stroke="rgba(34,211,238,0.9)" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>';
    lb.appendChild(handle);

    handle.addEventListener('mouseenter', function() { handle.style.opacity = '1'; });
    handle.addEventListener('mouseleave', function() { if (!handle._ryuDragging) handle.style.opacity = '0.3'; });

    function beginResize(e) {
      e.preventDefault();
      e.stopPropagation();
      handle._ryuDragging = true;
      handle.style.opacity = '1';
      stopColorPoll();
      if (handle.setPointerCapture && e.pointerId !== undefined) {
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      }

      var rect = lb.getBoundingClientRect();
      var startX = e.clientX;
      var startY = e.clientY;
      var startZoom = parseFloat(lb.dataset.ryuDragZoom || '1') || 1;
      var isRyuStyle = getLBStyle(loadTheme()) !== 1;
      var baseWidth = _getLBDragBaseWidth(isRyuStyle);
      var baseHeight = _getLBDragBaseHeight(isRyuStyle);
      var dragState = { isRyuStyle: isRyuStyle, baseWidth: baseWidth, baseHeight: baseHeight, naturalHeight: lb.offsetHeight || baseHeight };
      var curW = baseWidth * startZoom;
      var curH = baseHeight * startZoom;
      var pendingW = curW;
      var pendingH = curH;
      var dragFrame = null;

      function scheduleResizeWrite() {
        if (dragFrame !== null) return;
        dragFrame = requestAnimationFrame(function() {
          dragFrame = null;
          _setLBDragSize(pendingW, pendingH, dragState);
        });
      }

      function onMove(ev) {
        if (ev.pointerId !== undefined && e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
        // bottom-left: left/down grow the whole leaderboard, right/up shrink it.
        var dxRatio = (startX - ev.clientX) / baseWidth;
        var dyRatio = (ev.clientY - startY) / baseHeight;
        var targetZoom = Math.max(0.55, Math.min(1.45, startZoom + ((dxRatio + dyRatio) / 2)));
        curW = baseWidth * targetZoom;
        curH = baseHeight * targetZoom;
        pendingW = curW;
        pendingH = curH;
        scheduleResizeWrite();
      }

      function onUp(ev) {
        if (ev && ev.pointerId !== undefined && e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
        handle._ryuDragging = false;
        handle.style.opacity = '0.3';
        startColorPoll();
        if (handle.releasePointerCapture && e.pointerId !== undefined) {
          try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        }
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        if (dragFrame !== null) {
          cancelAnimationFrame(dragFrame);
          dragFrame = null;
        }
        _setLBDragSize(curW, curH, dragState);
        try {
          var saved = loadTheme();
          saved.lbDragW = Math.round(curW);
          saved.lbDragH = Math.round(curH);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (_) {}
      }

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    }

    handle.addEventListener('pointerdown', beginResize);
  }

  // watch for new entries added on initial load
  function startLBObserver() {
    if (_lbObserver) return;
    var lb = document.getElementById('leaderboard');
    if (!lb) return;

    var _updateTimer = null;
    function scheduleUpdate() {
      if (getLBStyle(loadTheme()) !== 1) styleEntries();
      if (_updateTimer) return;
      _updateTimer = setTimeout(function() {
        _updateTimer = null;
        styleEntries();
      }, getLBStyle(loadTheme()) !== 1 ? 60 : 16);
    }

    // Watch structure + text, but never style attributes. Rank text is generated
    // by us, so ignore it to avoid scheduling a second pass for our own update.
    _lbObserver = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var target = mutations[i].target;
        var parent = target && target.parentElement;
        if (parent && parent.closest && parent.closest('.ryu-lb-rank')) continue;
        scheduleUpdate();
        break;
      }
    });
    _lbObserver.observe(lb, { childList: true, subtree: true, characterData: true });

    // Color changes are picked up by the lightweight poll below; per-node style
    // observers can feed back into our own display:none updates during load.
    function attachColorWatchers() {
      scheduleUpdate();
    }

    attachColorWatchers();
    setTimeout(attachColorWatchers, 1000);
  }

  // re-style on every tick — lets native color box be the source of truth
  function startColorPoll() {
    if (_colorPollId) return;
    _colorPollId = setInterval(function () {
      styleEntries();
    }, getLBStyle(loadTheme()) !== 1 ? 250 : 1000);
  }

  function stopColorPoll() {
    if (_colorPollId) { clearInterval(_colorPollId); _colorPollId = null; }
  }

  // init — wait for leaderboard element then apply everything
  function initLB() {
    var lb = document.getElementById('leaderboard');
    if (!lb) { setTimeout(initLB, 500); return; }
    applyStyle();
    injectLBHeader();
    applyLBSize(loadTheme().lbSize || 'M');
    styleEntries();
    startLBObserver();
    startColorPoll();
    requestAnimationFrame(function () { styleEntries(); });
    setTimeout(styleEntries, 120);
    setTimeout(styleEntries, 500);
    setTimeout(addLBResizeHandle, 150);
  }

  // strip all ryu lb styles and restore native state
  globalThis.__ryuStripLB = function () {
    if (_lbObserver) { _lbObserver.disconnect(); _lbObserver = null; }
    stopColorPoll();
    _slimColorCache = {};
    var rh = document.getElementById('ryu-lb-resize-handle');
    if (rh) rh.remove();
    ['ryu-lb-redesign-style', 'ryu-lb-style', 'ryu-lb-entry-style', 'ryu-lb-size-style', 'ryu-lb-drag-override'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.remove();
    });
    ['ryu-lb-header'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.remove();
    });
    var lb = document.getElementById('leaderboard');
    var scaleWrap = document.getElementById('ryu-lb-scale-wrap');
    if (scaleWrap && lb && lb.parentNode === scaleWrap) {
      scaleWrap.parentNode.insertBefore(lb, scaleWrap);
      scaleWrap.remove();
    }
    if (lb) { lb.style.transform = ''; lb.style.transformOrigin = ''; lb.style.zoom = ''; delete lb.dataset.ryuDragZoom; }
    document.querySelectorAll('.leaderboard-entry').forEach(function (entry) {
      var fill = entry.querySelector('.ryu-lb-fill'); if (fill) fill.remove();
      var rank = entry.querySelector('.ryu-lb-rank'); if (rank) rank.remove();
      var sn = entry.querySelector('.ryu-lb-slim-name');
      if (sn) { while (sn.firstChild) entry.insertBefore(sn.firstChild, sn); sn.remove(); }
      var sr = entry.querySelector('.ryu-lb-slim-row');
      if (sr) { while (sr.firstChild) entry.insertBefore(sr.firstChild, sr); sr.remove(); }
      var nb = entry.querySelector('.ryu-lb-name-block');
      if (nb) { while (nb.firstChild) entry.insertBefore(nb.firstChild, nb); nb.remove(); }
      ['leaderboard-nick', 'leaderboard-team', 'leaderboard-energy'].forEach(function (cls) {
        var el = entry.querySelector('.' + cls);
        if (el) el.style.cssText = '';
      });
      var ce = entry.querySelector('.leaderboard-team-color');
      if (ce) ce.style.removeProperty('display');
      var teamEl2 = entry.querySelector('.leaderboard-team');
      var hasTeam = ce && ce.style.backgroundColor && ce.style.backgroundColor !== '' &&
                    ce.style.backgroundColor !== 'transparent' && ce.style.backgroundColor !== 'rgba(0, 0, 0, 0)';
      if (teamEl2) teamEl2.style.display = hasTeam ? 'block' : 'none';
      entry.style.cssText = entry.style.opacity ? 'opacity:' + entry.style.opacity + ';' : '';
    });
    var lb = document.getElementById('leaderboard');
    if (lb) lb.style.cssText = '';
  };

  // poll for theme toggle + scale changes
  var _lastLBDefault = null;
  var _lastLBSize = null;
  var _lastLBStyle = null;
  setInterval(function () {
    var t = loadTheme();
    var off = !!t.useDefault || t.lbThemeOn === false;
    var style = getLBStyle(t);
    if (off !== _lastLBDefault) {
      _lastLBDefault = off;
      if (!off) {
        initLB();
      } else {
        globalThis.__ryuStripLB();
      }
    }
    if (!off) {
      if (style !== _lastLBStyle) {
        _lastLBStyle = style;
        globalThis.__ryuStripLB();
        initLB();
        return;
      }
      var sz = t.lbSize || 'M';
      if (sz !== _lastLBSize) { _lastLBSize = sz; applyLBSize(sz); }
    }
  }, 500);

  // boot
  var _t0 = loadTheme();
  if (!_t0.useDefault && _t0.lbThemeOn !== false) initLB();

  console.log('[RyuTheme] LB LOADED.');
})();

  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',__ryuRun);
  } else {
    __ryuRun();
  }
})();
