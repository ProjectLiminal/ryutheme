/* profiles.js — auto-deferred for Tampermonkey */
(function(){
  function __ryuRun(){
(function () {
  'use strict';

  var PROFILE_STORAGE_KEY     = 'ryuProfiles';
  var ACTIVE_PROFILE_KEY      = 'ryuActiveProfile';
  var TOTAL_PROFILES          = 5;
  var PROFILE_NAV_STYLE_ID    = 'ryu-profile-nav-style';

  // Storage helpers  

  function loadProfiles() {
    try {
      var data = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
      if (Array.isArray(data) && data.length === TOTAL_PROFILES) return data;
    } catch (e) {}
    // First time — build defaults and immediately persist them
    var defaults = buildDefaultProfiles();
    saveProfiles(defaults);
    return defaults;
  }

  function buildDefaultProfiles() {
    var arr = [];
    for (var i = 0; i < TOTAL_PROFILES; i++) {
      arr.push({
        skin1: 'https://i.imgur.com/Du8bCMR.png',
        skin2: 'https://i.imgur.com/aXE1qVV.jpg',
        tag: '',
        pin: ''
      });
    }
    return arr;
  }

  function saveProfiles(profiles) {
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles)); } catch (e) {}
  }

  function loadActiveIndex() {
    try {
      var v = parseInt(localStorage.getItem(ACTIVE_PROFILE_KEY), 10);
      if (!isNaN(v) && v >= 0 && v < TOTAL_PROFILES) return v;
    } catch (e) {}
    return 0;
  }

  function saveActiveIndex(idx) {
    try { localStorage.setItem(ACTIVE_PROFILE_KEY, String(idx)); } catch (e) {}
  }

  //   commitNativeInput — mirrors the same helper in interface.js  
  // Re-declared here so profiles is fully self-contained.

  function commitNativeInput(nativeEl, val) {
    if (!nativeEl) return;
    nativeEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    nativeEl.value = val;
    nativeEl.dispatchEvent(new Event('input',  { bubbles: true }));
    nativeEl.dispatchEvent(new Event('change', { bubbles: true }));
    nativeEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  }

  //  Apply a profile's data to the live game state  

  function applyProfile(profile) {

    //   Skins  
    var skin1 = profile.skin1 || '';
    var skin2 = profile.skin2 || '';

    // Write to game internals
    try {
      if (window.__Ue && window.__Ue._3901) {
        window.__Ue._3901._9315 = skin1;
        window.__Ue._3901._8053 = skin2;
      }
      if (window.__Be && typeof window.__Be._2263 === 'function') {
        window.__Be._2263(0, skin1);
        window.__Be._2263(1, skin2);
      }
      // Persist to native user-data (indices 2 & 3)
      var ud = JSON.parse(localStorage.getItem('user-data'));
      if (Array.isArray(ud)) {
        ud[2] = skin1;
        ud[3] = skin2;
        localStorage.setItem('user-data', JSON.stringify(ud));
      }
    } catch (e) {}

    // Update our orb preview circles in the menu UI
    var orb1 = document.getElementById('ryu-orb-skin1');
    var orb2 = document.getElementById('ryu-orb-skin2');
    if (orb1) orb1.style.backgroundImage = skin1 ? 'url("' + skin1 + '")' : '';
    if (orb2) orb2.style.backgroundImage = (skin2 || skin1) ? 'url("' + (skin2 || skin1) + '")' : '';

    // Tag  
    var nativeTeam = document.getElementById('team-input');
    var ryuTag     = document.getElementById('ryu-tag-input');
    if (ryuTag)     ryuTag.value    = profile.tag || '';
    if (nativeTeam) commitNativeInput(nativeTeam, profile.tag || '');

    //  Pin  
    var nativePin = document.getElementById('pin-input');
    var ryuPin    = document.getElementById('ryu-pin-input');
    if (ryuPin)    ryuPin.value   = profile.pin || '';
    if (nativePin) commitNativeInput(nativePin, profile.pin || '');
  }

  //   Save the current UI state into the given profile slot  

  function captureCurrentState(profiles, idx) {
    var p = profiles[idx];

    // Skins — read from game internals first, fall back to orb display
    try {
      if (window.__Ue && window.__Ue._3901) {
        p.skin1 = window.__Ue._3901._9315 || '';
        p.skin2 = window.__Ue._3901._8053 || '';
      }
    } catch (e) {}

    // Tag & pin — read from our visible inputs
    var ryuTag = document.getElementById('ryu-tag-input');
    var ryuPin = document.getElementById('ryu-pin-input');
    if (ryuTag) p.tag = ryuTag.value || '';
    if (ryuPin) p.pin = ryuPin.value || '';

    return profiles;
  }

  //   Update the profile label text  

  function updateProfileLabel(idx) {
    var el = document.querySelector('.ryu-orb-profile-text');
    if (el) el.textContent = 'PROFILE ' + (idx + 1);
  }

  //   Inject the < > nav buttons and wire switching logic  

  function injectProfileNav() {
    if (document.getElementById('ryu-profile-prev-btn')) return;

    var badge = document.querySelector('.ryu-orb-profile-badge');
    if (!badge) return;

    injectProfileNavStyle();

    // Build prev button
    var prevBtn = document.createElement('button');
    prevBtn.id          = 'ryu-profile-prev-btn';
    prevBtn.className   = 'ryu-profile-nav-btn';
    prevBtn.textContent = '‹';
    prevBtn.title       = 'Previous Profile';

    // Build next button
    var nextBtn = document.createElement('button');
    nextBtn.id          = 'ryu-profile-next-btn';
    nextBtn.className   = 'ryu-profile-nav-btn';
    nextBtn.textContent = '›';
    nextBtn.title       = 'Next Profile';

    // Wrap the badge so we can lay them out in a flex row
    var navRow = document.createElement('div');
    navRow.id        = 'ryu-profile-nav-row';
    navRow.className = 'ryu-profile-nav-row';

    // Replace badge in DOM — insert navRow in its place, containing all three
    badge.parentNode.insertBefore(navRow, badge);
    navRow.appendChild(prevBtn);
    navRow.appendChild(badge);
    navRow.appendChild(nextBtn);

    //   Switch logic  
    function switchProfile(newIdx) {
      var profiles   = loadProfiles();
      var activeIdx  = loadActiveIndex();

      // Save current state into the outgoing profile before switching
      profiles = captureCurrentState(profiles, activeIdx);
      saveProfiles(profiles);

      // Clamp target index
      newIdx = Math.max(0, Math.min(TOTAL_PROFILES - 1, newIdx));
      if (newIdx === activeIdx) return;

      saveActiveIndex(newIdx);
      updateProfileLabel(newIdx);

      // Disable nav buttons momentarily to prevent rapid multi-click
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      _isSwitching = true;

      // Apply new profile with a brief delay so the game state is ready
      setTimeout(function () {
        var fresh = loadProfiles();
        applyProfile(fresh[newIdx]);
        prevBtn.disabled = false;
        nextBtn.disabled = false;
        updateNavState(newIdx);
        setTimeout(function() { _isSwitching = false; }, 400);
      }, 80);
    }

    function updateNavState(idx) {
      prevBtn.classList.toggle('ryu-profile-nav-disabled', idx <= 0);
      nextBtn.classList.toggle('ryu-profile-nav-disabled', idx >= TOTAL_PROFILES - 1);
    }

    prevBtn.addEventListener('click', function () {
      switchProfile(loadActiveIndex() - 1);
    });
    nextBtn.addEventListener('click', function () {
      switchProfile(loadActiveIndex() + 1);
    });

    //   Auto-save current tag/pin/skin into the active profile on changes  
    // So that if user edits tag while on Profile 2, it saves to Profile 2.
    var _isSwitching = false;

    function autoSave() {
      if (_isSwitching) return;
      var profiles  = loadProfiles();
      var activeIdx = loadActiveIndex();
      profiles = captureCurrentState(profiles, activeIdx);
      saveProfiles(profiles);
    }

    // Watch tag/pin inputs for changes
    var ryuTag = document.getElementById('ryu-tag-input');
    var ryuPin = document.getElementById('ryu-pin-input');
    if (ryuTag) ryuTag.addEventListener('input', autoSave);
    if (ryuPin) ryuPin.addEventListener('input', autoSave);

    // Watch skin changes via __Ue polling — saves whenever skin changes
    var _lastSkin1 = '';
    var _lastSkin2 = '';
    setInterval(function () {
      try {
        var ue = window.__Ue;
        if (!ue || !ue._3901) return;
        var s1 = ue._3901._9315 || '';
        var s2 = ue._3901._8053 || '';
        if (s1 !== _lastSkin1 || s2 !== _lastSkin2) {
          _lastSkin1 = s1;
          _lastSkin2 = s2;
          autoSave();
        }
      } catch (e) {}
    }, 300);

    // Set initial nav state
    var currentIdx = loadActiveIndex();
    updateProfileLabel(currentIdx);
    updateNavState(currentIdx);
  }

  // ── Styles  

  function injectProfileNavStyle() {
    if (document.getElementById(PROFILE_NAV_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = PROFILE_NAV_STYLE_ID;
    s.textContent = `
      /* Profile nav row — wraps < badge > */
      .ryu-profile-nav-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* Profile badge — remove pointer-events block since it's now part of a flex row */
      .ryu-orb-profile-badge {
        pointer-events: none;
      }

      /* Nav arrow buttons */
      .ryu-profile-nav-btn {
        width: 28px;
        height: 28px;
        background: transparent;
        border: 1px solid rgba(34,211,238,0.25);
        border-radius: 6px;
        color: rgba(34,211,238,0.6);
        font-family: 'Noto Sans', sans-serif;
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        outline: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
        flex-shrink: 0;
        padding: 0;
      }
      .ryu-profile-nav-btn:hover {
        background: rgba(34,211,238,0.1);
        border-color: #22d3ee;
        color: #fff;
        box-shadow: 0 0 10px rgba(34,211,238,0.25);
      }
      .ryu-profile-nav-btn:active {
        background: rgba(34,211,238,0.18);
        transform: scale(0.93);
      }
      .ryu-profile-nav-btn.ryu-profile-nav-disabled {
        opacity: 0.2;
        cursor: default;
        pointer-events: none;
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  // ── Boot — wait for the menu UI to exist then inject  

  function boot() {
    // Restore the active profile's data into game state on load
    var profiles  = loadProfiles();
    var activeIdx = loadActiveIndex();

    // Wait for game internals to be ready before applying skins
    function waitAndApply(attempts) {
      var ready = window.__Ue && window.__Ue._3901;
      if (ready || attempts <= 0) {
        applyProfile(profiles[activeIdx]);
      } else {
        setTimeout(function () { waitAndApply(attempts - 1); }, 300);
      }
    }
    waitAndApply(20);

    // Wait for the menu UI to be injected before adding nav buttons
    function waitForBadge(attempts) {
      var badge = document.querySelector('.ryu-orb-profile-badge');
      if (badge) {
        injectProfileNav();
      } else if (attempts > 0) {
        setTimeout(function () { waitForBadge(attempts - 1); }, 200);
      }
    }
    waitForBadge(30);
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

})();

  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',__ryuRun);
  } else {
    __ryuRun();
  }
})();
