// ==UserScript==
// @name         RYUTHEME
// @namespace    https://ryutheme.io/
// @version      1.3
// @description  Theme customization for ryuten.io
// @author       RyuTheme Studio
// @match        https://ryuten.io/*
// @run-at       document-start
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/lottie-web@5/build/player/lottie.min.js
// @require      https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/pickr.min.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/ryuten-loader.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/loading.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/ryutheme-server.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/ryutheme.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/interface.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/replaysys.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/profiles.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/leaderboard.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/minimap.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/chatbox.js
// @require      https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey/team.js
// ==/UserScript==

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  // Base URL where your tampermonkey/ folder is hosted (same as the @require paths above).
  // Used to resolve emotes/ and fonts/ asset paths.
  const ASSETS_BASE = 'https://raw.githubusercontent.com/ProjectLiminal/ryutheme/main/tampermonkey';

  // ── SET EXT ORIGIN (emote system reads this) ────────────────────────────────
  document.documentElement.setAttribute('data-ryu-ext-origin', ASSETS_BASE);

  // ── INTERCEPT RYUTEN.JS ─────────────────────────────────────────────────────
  // Catches the game's <script src="ryuten.js"> before the browser loads it,
  // fetches the real source synchronously, patches it, and injects inline.
  (function () {
    var _sd = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    if (!_sd || !_sd.set) return;
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
      set: function (value) {
        if (
          typeof value === 'string' &&
          /ryuten\.js(?:[?#]|$)/.test(value) &&
          value.indexOf('ryu_original') === -1
        ) {
          var el = this;
          try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://ryuten.io/play/ryuten.js?ryu_original=1', false);
            xhr.send(null);
            if (xhr.status >= 200 && xhr.status < 400) {
              var src = xhr.responseText;
              if (globalThis.__ryuApplyReplacements) src = globalThis.__ryuApplyReplacements(src);
              el.text = src + '\n//# sourceURL=ryuten-patched.js';
              return;
            }
          } catch (e) {
            console.error('[RyuTheme] Intercept failed, loading original', e);
          }
        }
        _sd.set.call(this, value);
      },
      get: _sd.get,
      configurable: true
    });
  })();

})();
