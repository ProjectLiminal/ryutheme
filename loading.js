(function () {
  'use strict';

  // Loading screen
  function injectLoadingScreen() {
    if (document.getElementById('ryu-loading-screen')) return;
    if (!document.body) { setTimeout(injectLoadingScreen, 100); return; }

    const style = document.createElement('style');
    style.id = 'ryu-loading-style';
    style.textContent = `
      #ryu-loading-screen {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: #000;
        overflow: hidden;
        font-family: 'Orbitron', sans-serif;
      }
      #ryu-loading-screen::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px);
        pointer-events: none;
        z-index: 10;
      }
      #ryu-ls-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%);
        z-index: 5;
        pointer-events: none;
      }
      #ryu-ls-glow {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 1200px; height: 700px;
        background: radial-gradient(ellipse, rgba(0,180,220,0.18) 0%, transparent 70%);
        z-index: 1;
        animation: ryu-ls-glow-pulse 3s ease-in-out infinite;
      }
      @keyframes ryu-ls-glow-pulse {
        0%,100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
        50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
      }
      #ryu-ls-grid {
        position: absolute;
        inset: 0;
        z-index: 2;
        opacity: 0.07;
        background-image: linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px);
        background-size: 60px 60px;
        animation: ryu-ls-grid-move 8s linear infinite;
      }
      @keyframes ryu-ls-grid-move {
        0%   { background-position: 0 0; }
        100% { background-position: 60px 60px; }
      }
      #ryu-ls-content {
        position: absolute;
        inset: 0;
        z-index: 6;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
      }
      #ryu-ls-showcase {
        position: relative;
        width: 1230px;
        height: 480px;
        margin-bottom: 40px;
        perspective: 1200px;
        opacity: 0;
        animation: ryu-ls-showcase-in 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
      }
      @keyframes ryu-ls-showcase-in {
        0%   { opacity: 0; transform: scale(0.88) translateY(30px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      #ryu-ls-lb {
        position: absolute;
        top: 0; right: 0;
        width: 315px;
        background: rgba(0,8,12,0.96);
        border: 1px solid rgba(34,211,238,0.3);
        box-shadow: 0 0 30px rgba(0,180,220,0.25), 0 0 60px rgba(0,150,200,0.1);
        animation: ryu-ls-lb-zoom 8s ease-in-out infinite;
        transform-origin: top right;
      }
      @keyframes ryu-ls-lb-zoom {
        0%,100% { transform: scale(1) rotateY(-4deg) rotateX(2deg); box-shadow: 0 0 30px rgba(0,180,220,0.25); }
        50%      { transform: scale(1.04) rotateY(-2deg) rotateX(1deg); box-shadow: 0 0 50px rgba(34,211,238,0.4); }
      }
      .ryu-ls-lb-header {
        background: rgba(0,12,18,0.99);
        border-bottom: 1px solid rgba(34,211,238,0.3);
        padding: 12px 0 8px;
        text-align: center;
      }
      .ryu-ls-lb-title {
        font-size: 16px;
        font-weight: 900;
        color: #fff;
        letter-spacing: 0.4em;
        text-shadow: 0 0 14px rgba(34,211,238,0.9), 0 0 30px rgba(34,211,238,0.5);
        display: block;
      }
      .ryu-ls-lb-sub {
        font-size: 9px;
        color: rgba(34,211,238,0.5);
        letter-spacing: 0.25em;
        display: block;
        margin-top: 3px;
      }
      .ryu-ls-lb-entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-bottom: 1px solid rgba(0,30,40,0.6);
        position: relative;
        animation: ryu-ls-entry-pulse 3s ease-in-out infinite;
      }
      .ryu-ls-lb-entry:nth-child(2) { animation-delay: 0.1s; }
      .ryu-ls-lb-entry:nth-child(3) { animation-delay: 0.2s; }
      .ryu-ls-lb-entry:nth-child(4) { animation-delay: 0.3s; }
      .ryu-ls-lb-entry:nth-child(5) { animation-delay: 0.4s; }
      @keyframes ryu-ls-entry-pulse {
        0%,100% { background: transparent; }
        50%      { background: rgba(0,40,60,0.3); }
      }
      .ryu-ls-lb-rank {
        width: 22px; height: 22px; min-width: 22px;
        border-radius: 50%;
        border: 1px solid;
        display: flex; align-items: center; justify-content: center;
        font-size: 9px; font-weight: 900;
        flex-shrink: 0;
      }
      .ryu-ls-lb-name {
        font-family: 'Titillium Web', sans-serif;
        font-size: 15px;
        font-weight: 600;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ryu-ls-lb-score {
        font-size: 11px;
        font-weight: 900;
        opacity: 0.8;
        flex-shrink: 0;
      }
      .ryu-ls-lb-bar {
        position: absolute;
        left: 0; top: 0; bottom: 0;
        opacity: 0.08;
        pointer-events: none;
        background: linear-gradient(90deg, currentColor, transparent);
      }
      #ryu-ls-chat {
        position: absolute;
        bottom: 0; left: 0;
        width: 360px;
        background: rgba(1,4,8,0.97);
        border: 1px solid rgba(34,211,238,0.25);
        box-shadow: 0 0 24px rgba(0,180,220,0.2);
        animation: ryu-ls-chat-zoom 7s ease-in-out 1s infinite;
        transform-origin: bottom left;
      }
      @keyframes ryu-ls-chat-zoom {
        0%,100% { transform: scale(1) rotateY(3deg) rotateX(-2deg); }
        50%      { transform: scale(1.03) rotateY(1deg) rotateX(-1deg); box-shadow: 0 0 40px rgba(34,211,238,0.35); }
      }
      .ryu-ls-chat-header {
        background: rgba(0,12,18,0.98);
        border-bottom: 1px solid rgba(34,211,238,0.4);
        padding: 7px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ryu-ls-chat-title {
        font-size: 10px;
        font-weight: 900;
        color: #22d3ee;
        letter-spacing: 0.3em;
        text-shadow: 0 0 10px rgba(34,211,238,0.8);
      }
      .ryu-ls-chat-dot {
        width: 6px; height: 6px;
        background: #22d3ee;
        border-radius: 50%;
        box-shadow: 0 0 4px #22d3ee;
        animation: ryu-ls-blink 1.5s ease-in-out infinite;
      }
      @keyframes ryu-ls-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
      .ryu-ls-chat-msg {
        padding: 7px 10px;
        border-bottom: 1px solid rgba(0,20,30,0.5);
        display: flex;
        gap: 6px;
        align-items: baseline;
        opacity: 0;
        animation: ryu-ls-msg-in 0.3s ease forwards;
      }
      .ryu-ls-chat-msg:nth-child(1) { animation-delay: 0.8s; }
      .ryu-ls-chat-msg:nth-child(2) { animation-delay: 1.2s; }
      .ryu-ls-chat-msg:nth-child(3) { animation-delay: 1.6s; }
      .ryu-ls-chat-msg:nth-child(4) { animation-delay: 2.0s; }
      .ryu-ls-chat-msg:nth-child(5) { animation-delay: 2.4s; }
      @keyframes ryu-ls-msg-in { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }
      .ryu-ls-msg-sender {
        font-family: 'Titillium Web', sans-serif;
        font-size: 13px; font-weight: 700;
        flex-shrink: 0;
        text-shadow: 0 0 6px currentColor;
      }
      .ryu-ls-msg-text {
        font-family: 'Titillium Web', sans-serif;
        font-size: 13px;
        color: rgba(180,220,230,0.8);
      }
      #ryu-ls-minimap {
        position: absolute;
        bottom: 0; right: 0;
        width: 180px; height: 180px;
        background: rgba(0,0,0,0.85);
        border: 1px solid rgba(34,211,238,0.22);
        overflow: hidden;
        animation: ryu-ls-mm-zoom 9s ease-in-out 0.5s infinite;
        transform-origin: bottom right;
      }
      @keyframes ryu-ls-mm-zoom {
        0%,100% { transform: scale(1); box-shadow: 0 0 16px rgba(0,180,220,0.2); }
        50%      { transform: scale(1.05); box-shadow: 0 0 28px rgba(34,211,238,0.35); }
      }
      .ryu-ls-mm-grid {
        position: absolute; inset: 0;
        background-image: linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.35) 1px, transparent 1px);
        background-size: 36px 36px;
      }
      .ryu-ls-mm-label {
        position: absolute;
        font-size: 10px; font-weight: 700;
        color: rgba(34,211,238,0.65);
        font-family: 'Orbitron', sans-serif;
      }
      .ryu-ls-mm-dot {
        position: absolute;
        width: 10px; height: 10px;
        background: #22d3ee; border-radius: 50%;
        box-shadow: 0 0 8px #22d3ee;
        top: 55%; left: 48%;
        animation: ryu-ls-dot-move 4s ease-in-out infinite;
      }
      @keyframes ryu-ls-dot-move {
        0%,100% { top:55%;left:48%; } 25% { top:40%;left:55%; }
        50% { top:48%;left:42%; } 75% { top:60%;left:52%; }
      }
      .ryu-ls-mm-sector {
        position: absolute;
        top: 46%; left: 38%;
        width: 36px; height: 36px;
        border: 1px solid rgba(34,211,238,0.55);
        background: rgba(0,180,220,0.15);
      }
      .ryu-ls-corner {
        position: absolute;
        width: 22px; height: 22px;
        border-color: rgba(34,211,238,0.5);
        border-style: solid;
        z-index: 2;
        animation: ryu-ls-corner-pulse 2s ease-in-out infinite;
      }
      @keyframes ryu-ls-corner-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      .ryu-ls-corner-tl { top:-8px;left:-8px;border-width:2px 0 0 2px; }
      .ryu-ls-corner-tr { top:-8px;right:-8px;border-width:2px 2px 0 0; }
      .ryu-ls-corner-bl { bottom:-8px;left:-8px;border-width:0 0 2px 2px; }
      .ryu-ls-corner-br { bottom:-8px;right:-8px;border-width:0 2px 2px 0; }
      .ryu-ls-sweep {
        position: absolute;
        left:0;right:0;height:2px;top:0;
        background: linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent);
        pointer-events: none; z-index: 3;
        animation: ryu-ls-sweep-move 3s linear infinite;
      }
      @keyframes ryu-ls-sweep-move { 0% { top:0;opacity:0.8; } 90% { opacity:0.8; } 100% { top:100%;opacity:0; } }
      #ryu-ls-title-wrap {
        text-align: center;
        opacity: 0;
        transform: translateY(20px);
        animation: ryu-ls-title-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.8s forwards;
      }
      @keyframes ryu-ls-title-in { to { opacity:1; transform:translateY(0); } }
      #ryu-ls-main-title {
        font-size: 78px; font-weight: 900;
        color: #ffffff;
        letter-spacing: 0.15em; line-height: 1;
        text-shadow: 0 0 30px rgba(34,211,238,1), 0 0 60px rgba(34,211,238,0.7), 0 0 100px rgba(0,180,220,0.4);
        display: block; margin-bottom: 12px;
      }
      #ryu-ls-tagline {
        font-size: 15px;
        font-weight: 700;
        color: rgba(34,211,238,0.85);
        letter-spacing: 0.3em;
        display: block; margin-top: 6px;
        text-shadow: 0 0 10px rgba(34,211,238,0.6);
      }
      #ryu-ls-bar-wrap {
        margin-top: 28px; width: 510px;
        opacity: 0;
        animation: ryu-ls-title-in 0.6s ease 1.2s forwards;
      }
      #ryu-ls-bar-label {
        display: flex; justify-content: space-between;
        font-size: 9px; color: rgba(34,211,238,0.45);
        letter-spacing: 0.2em; margin-bottom: 6px;
      }
      #ryu-ls-bar-track {
        height: 4px; background: rgba(0,80,100,0.5);
        border-radius: 2px; overflow: hidden; position: relative;
      }
      #ryu-ls-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #0099bb, #22d3ee);
        box-shadow: 0 0 8px rgba(34,211,238,0.8);
        border-radius: 2px; width: 0%;
        transition: width 0.1s linear;
      }
      #ryu-ls-bar-shine {
        position: absolute; top:0;bottom:0; width:60px;
        background: linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent);
        animation: ryu-ls-shine 1.5s ease-in-out infinite;
      }
      @keyframes ryu-ls-shine { 0% { left:-60px; } 100% { left:100%; } }
      #ryu-ls-version {
        position: absolute; bottom:18px; right:24px;
        font-size: 10px; color: rgba(34,211,238,0.82);
        letter-spacing: 0.2em; z-index: 6;
        padding: 4px 7px;
        background: rgba(0,12,18,0.55);
        border: 1px solid rgba(34,211,238,0.18);
        border-radius: 4px;
        text-shadow: 0 0 10px rgba(34,211,238,0.45);
      }
      #ryu-loading-screen.fade-out {
        animation: ryu-ls-fadeout 0.8s ease forwards;
        pointer-events: none;
      }
      @keyframes ryu-ls-fadeout { 0% { opacity:1; } 100% { opacity:0; } }
    `;
    document.head.appendChild(style);

    const gameBg = document.getElementById('ls-background');
    if (gameBg) gameBg.style.opacity = '0';

    const entries = [
      ['LILpyro',       '15.2k', 'rgba(252,153,66,1)',  '#fd9c33'],
      ['insectaugombo', '11.4k', 'rgba(80,200,120,1)',  '#50c878'],
      ['okRABowl',      '9.8k',  'rgba(100,180,255,1)', '#64b4ff'],
      ['AlfaceFria',    '8.1k',  'rgba(255,100,180,1)', '#ff64b4'],
      ['fiGSfaST',      '6.3k',  'rgba(200,100,255,1)', '#c864ff'],
    ];
    const msgs = [
      ['DeltaT',   '#22d3ee', 'W Extension'],
      ['zeus_lightning',  '#c864ff', 'Nice Tricksplit!'],
      ['Cart808s',      '#50c878', 'This is awesome'],
      ['HONEYdewBADGER',  '#64b4ff', 'Bro this theme goes crazy'],
      ['fiGSfaST',  '#fd9c33', 'Finally a good extension'],
    ];

    const screen = document.createElement('div');
    screen.id = 'ryu-loading-screen';
    screen.innerHTML = `
      <div id="ryu-ls-glow"></div>
      <div id="ryu-ls-grid"></div>
      <div id="ryu-ls-vignette"></div>
      <div id="ryu-ls-content">
        <div id="ryu-ls-showcase">
          <div class="ryu-ls-corner ryu-ls-corner-tl"></div>
          <div class="ryu-ls-corner ryu-ls-corner-tr"></div>
          <div class="ryu-ls-corner ryu-ls-corner-bl"></div>
          <div class="ryu-ls-corner ryu-ls-corner-br"></div>
          <div class="ryu-ls-sweep"></div>
          <div id="ryu-ls-lb">
            <div class="ryu-ls-lb-header">
              <span class="ryu-ls-lb-title">TOP 10</span>
              <span class="ryu-ls-lb-sub">LEADERBOARD</span>
            </div>
            ${entries.map(([name,score,color,hex],i) => `
              <div class="ryu-ls-lb-entry">
                <div class="ryu-ls-lb-bar" style="color:${hex};width:${90-i*14}%;"></div>
                <div class="ryu-ls-lb-rank" style="border-color:${color};color:${hex};background:rgba(0,0,0,0.3);">${i+1}</div>
                <span class="ryu-ls-lb-name" style="color:${hex};text-shadow:0 0 6px ${color};">${name}</span>
                <span class="ryu-ls-lb-score" style="color:${hex};">${score}</span>
              </div>`).join('')}
          </div>
          <div id="ryu-ls-chat">
            <div class="ryu-ls-chat-header">
              <span class="ryu-ls-chat-title">COMMS</span>
            </div>
            <div style="padding:4px 0;">
              ${msgs.map(([name,color,msg]) => `
                <div class="ryu-ls-chat-msg">
                  <span class="ryu-ls-msg-sender" style="color:${color};">${name}:</span>
                  <span class="ryu-ls-msg-text">${msg}</span>
                </div>`).join('')}
            </div>
          </div>
          <div id="ryu-ls-minimap">
            <div class="ryu-ls-mm-grid"></div>
            <span class="ryu-ls-mm-label" style="top:5px;left:16px;">A1</span>
            <span class="ryu-ls-mm-label" style="top:5px;left:52px;">B1</span>
            <span class="ryu-ls-mm-label" style="top:5px;left:88px;">C1</span>
            <span class="ryu-ls-mm-label" style="top:5px;left:124px;">D1</span>
            <span class="ryu-ls-mm-label" style="top:41px;left:16px;">A2</span>
            <span class="ryu-ls-mm-label" style="top:77px;left:16px;">A3</span>
            <div class="ryu-ls-mm-sector"></div>
            <div class="ryu-ls-mm-dot"></div>
          </div>
        </div>
        <div id="ryu-ls-title-wrap">
          <span id="ryu-ls-main-title">RYUTHEME</span>
          <span id="ryu-ls-tagline">version 1.3</span>
        </div>
        <div id="ryu-ls-bar-wrap">
          <div id="ryu-ls-bar-label">
            <span>LOADING</span>
            <span id="ryu-ls-pct">0%</span>
          </div>
          <div id="ryu-ls-bar-track">
            <div id="ryu-ls-bar-fill"></div>
            <div id="ryu-ls-bar-shine"></div>
          </div>
        </div>
      </div>
      <div id="ryu-ls-version">RYUTHEME v1.3</div>
    `;
    document.body.appendChild(screen);

    const fill = document.getElementById('ryu-ls-bar-fill');
    const pct  = document.getElementById('ryu-ls-pct');
    let progress = 0;
    const barInterval = setInterval(() => {
      progress += Math.random() * 4 + 1;
      if (progress > 95) progress = 95;
      fill.style.width = progress + '%';
      pct.textContent  = Math.floor(progress) + '%';
    }, 120);

    const observer = new MutationObserver(() => {
      const gameLoader = document.getElementById('loading-screen');
      if (!gameLoader || getComputedStyle(gameLoader).display === 'none') {
        observer.disconnect();
        clearInterval(barInterval);
        fill.style.width = '100%';
        pct.textContent  = '100%';
        setTimeout(() => {
          screen.classList.add('fade-out');
          setTimeout(() => {
            screen.remove();
            const s = document.getElementById('ryu-loading-style');
            if (s) s.remove();
          }, 800);
        }, 400);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style','class'] });
  }

  //  Shader interceptor — captures all GLSL source before game compiles it  
  (function() {
    const _origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, opts) {
      const ctx = _origGetContext.call(this, type, opts);
      if ((type === 'webgl2' || type === 'webgl') && ctx && !ctx.__ryuHooked) {
        ctx.__ryuHooked = true;
        const _origShaderSource = ctx.shaderSource.bind(ctx);
        ctx.shaderSource = function(shader, source) {
          if (!window.__ryuShaders) window.__ryuShaders = [];
          window.__ryuShaders.push(source);
          return _origShaderSource(shader, source);
        };
      }
      return ctx;
    };
  })();

  // ── Boot  
  // Runs strictly on actual game page — prevents flash on the main site
  if (window.location.pathname !== '/play/') return;

  function waitForGameLoader() {
    if (document.getElementById('loading-screen')) {
      injectLoadingScreen();
      return;
    }
    var _bootObserver = new MutationObserver(function () {
      if (document.getElementById('loading-screen')) {
        _bootObserver.disconnect();
        injectLoadingScreen();
      }
    });
    var target = document.body || document.documentElement;
    _bootObserver.observe(target, { childList: true, subtree: true });
  }

  if (document.body) waitForGameLoader();
  else document.addEventListener('DOMContentLoaded', waitForGameLoader);

})();
