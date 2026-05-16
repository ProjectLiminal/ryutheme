(function () {
  'use strict';

  // UPDATE THIS URL once deployed on railway
  const RELAY_URL  = 'wss://ryutheme-relay-production.up.railway.app/relay/';
  const RELAY_ROOM = 'global';

  // stable per-session identity
  let _clientId = sessionStorage.getItem('_ryuClientId');
  if (!_clientId) {
    _clientId = 'c-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    sessionStorage.setItem('_ryuClientId', _clientId);
  }

  let _relayWs      = null;
  let _relayReady   = false;
  let _relayRetries = 0;
  let _relayHb      = null;
  let _presenceTimer = null;
  let _lastPresenceSig = '';
  let _cmdFlushTimer = null;
  let _cmdSeq = 0;
  let _profileId = '';
  let _signedInAuthState = null;
  let _bridgeReqSeq = 0;
  let _authBootstrapPromise = null;
  let _accountId = '';
  let _deviceToken = '';
  let _accountInitPromise = null;
  let _pendingBadgeRequest = false;
  const _messageSubscribers = new Set();

  // queue for messages sent while disconnected — flushed on reconnect
  const _sendQueue = [];
  const QUEUE_MAX  = 30;
  const _cmdQueue = [];
  const CMD_QUEUE_MAX = 120;
  const CMD_SEND_INTERVAL_MS = 34;
  // Receiving-side text throttle only. Local clicks still use native commander
  // timing; this keeps remote text from stacking faster than the native fade.
  const CMD_TEXT_COOLDOWN_MS = 700;
  const _cmdTextCooldownByClient = Object.create(null);
  const RYU_BADGE_CONFIG = {
    TITLE_RYUTHEME_DM: {
      name: 'DM Badge',
      free: true
    },
    TITLE_RYUTHEME_TESTER: {
      name: 'Tester Badge',
      locked: true
    }
  };

  globalThis.__ryuUserColors   = globalThis.__ryuUserColors  || {};
  globalThis.__ryuPresenceInfo = {};
  globalThis.__ryuRelayReady   = false;
  globalThis.__ryuRelayBadgesByUser = globalThis.__ryuRelayBadgesByUser || {};
  globalThis.__ryuRelayBadgesByClient = globalThis.__ryuRelayBadgesByClient || {};
  globalThis.__ryuRelayBadgeVersion = globalThis.__ryuRelayBadgeVersion || 0;
  globalThis.__ryuRelayPresenceVersion = globalThis.__ryuRelayPresenceVersion || 0;
  globalThis.__ryuRelayChatMessages = Array.isArray(globalThis.__ryuRelayChatMessages) ? globalThis.__ryuRelayChatMessages : [];
  globalThis.__ryuRelayChatVersion = globalThis.__ryuRelayChatVersion || 0;
  globalThis.__ryuRelayChatSeen = globalThis.__ryuRelayChatSeen || {};
  globalThis.__ryuBadgeEntitlements = globalThis.__ryuBadgeEntitlements || {};
  Object.keys(RYU_BADGE_CONFIG).forEach(function(badgeId) {
    try {
      if (localStorage.getItem(getBadgeEntitlementStorageKey(badgeId)) === '1') {
        globalThis.__ryuBadgeEntitlements[badgeId] = true;
      }
    } catch (_) {}
  });

  // derives room id from the game ws url
  // e.g. "wss://na.ryuten.io/server-06/?" → "na-server-06"
  function getRoomId() {
    try {
      const ws = window._ryuWS;
      if (!ws) return null;
      const u      = new URL(ws.url);
      const region = u.hostname.split('.')[0];
      const server = u.pathname.replace(/\//g, '').replace(/[^a-z0-9-]/g, '');
      if (!region || !server) return null;
      return region + '-' + server;
    } catch (_) { return null; }
  }

  // username — cached to avoid guest name glitch
  let _cachedUsername = null;
  function getUsername() {
    const el      = document.getElementById('mame-trb-user-data-username');
    const current = el ? el.textContent.trim() : 'Unknown';
    const loggedIn = (function() { try { return globalThis.__Be._1059._4652 !== 0; } catch (_) { return false; } })();
    if (!loggedIn) { _cachedUsername = null; return current; }
    if (current && current !== 'Unknown' && !/^Guest\d+$/.test(current)) {
      _cachedUsername = current;
    }
    return _cachedUsername || current;
  }

  function getGameName() {
    try {
      const name = globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._6988;
      return String(name || '').trim();
    } catch (_) { return ''; }
  }

  function getGameTag() {
    try {
      const tag = globalThis.__Be && globalThis.__Be._1059 && globalThis.__Be._1059._9067;
      return String(tag || '').trim();
    } catch (_) { return ''; }
  }

  function getModeName() {
    try {
      const el = document.getElementById('mame-ssb-mode-selected');
      return String(el && el.textContent || '').trim();
    } catch (_) { return ''; }
  }

  function getOwnCountryFlagCode() {
    try {
      return String(globalThis.__ryuCountryFlagCode || '').trim().toUpperCase();
    } catch (_) { return ''; }
  }

  function getProfileId() {
    if (_profileId) return _profileId;
    try {
      var stored = localStorage.getItem('_ryuProfileId');
      if (stored && /^[a-z0-9-]{8,80}$/i.test(stored)) {
        _profileId = stored;
        return _profileId;
      }
    } catch (_) {}
    _profileId = 'p-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    try { localStorage.setItem('_ryuProfileId', _profileId); } catch (_) {}
    return _profileId;
  }

  function getRelayHttpBase() {
    return RELAY_URL.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:').replace(/\/relay\/?$/i, '');
  }

  const _bridgePending = new Map();

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'ryu-extension-bridge' || !data.type) return;

    if (data.type === 'ryu-auth-response' && data.payload && data.payload.id) {
      const pending = _bridgePending.get(data.payload.id);
      if (!pending) return;
      _bridgePending.delete(data.payload.id);
      if (data.payload.ok) pending.resolve(data.payload.result || null);
      else pending.reject(new Error(data.payload.error || 'Bridge auth request failed.'));
      return;
    }

    if (data.type === 'ryu-auth-state') {
      applySignedInAuthState(data.payload || null);
    }
  });

  function bridgeRequest(action, payload) {
    return new Promise(function(resolve, reject) {
      const id = 'ryu-auth-' + (++_bridgeReqSeq) + '-' + Date.now();
      const timeout = setTimeout(function() {
        _bridgePending.delete(id);
        reject(new Error('Timed out waiting for extension auth bridge.'));
      }, 15000);
      _bridgePending.set(id, {
        resolve: function(value) { clearTimeout(timeout); resolve(value); },
        reject: function(err) { clearTimeout(timeout); reject(err); }
      });
      window.postMessage({
        source: 'ryu-main',
        type: 'ryu-auth-request',
        id: id,
        action: action,
        payload: payload || null
      }, '*');
    });
  }

  function sanitizeSignedInAuthState(state) {
    const next = state && typeof state === 'object' ? state : {};
    const accountId = String(next.accountId || '').trim();
    const deviceToken = String(next.deviceToken || '').trim();
    const provider = String(next.provider || '').trim();
    if (!next.signedIn || provider !== 'google') return null;
    if (!/^acc_[a-f0-9]{24}$/i.test(accountId) || !/^dt_[a-f0-9]{48}$/i.test(deviceToken)) return null;
    return {
      signedIn: true,
      provider: 'google',
      accountId: accountId,
      deviceToken: deviceToken,
      email: String(next.email || '').trim(),
      name: String(next.name || '').trim(),
      picture: String(next.picture || '').trim(),
      googleSub: String(next.googleSub || '').trim(),
      displayName: String(next.displayName || '').trim()
    };
  }

  function clearBadgeAccountState() {
    globalThis.__ryuBadgeEntitlements = {};
    Object.keys(RYU_BADGE_CONFIG).forEach(function(badgeId) {
      try { localStorage.removeItem(getBadgeEntitlementStorageKey(badgeId)); } catch (_) {}
    });
    clearRelayBadge('', _clientId);
    applyOwnApprovedBadge('');
    dispatchBadgeEntitlementsChanged();
    if (globalThis.__ryuRefreshBadgeShop) globalThis.__ryuRefreshBadgeShop();
  }

  function getSignedInAuthState() {
    return _signedInAuthState;
  }

  function hasSignedInRelayAccount() {
    return !!(_signedInAuthState && _signedInAuthState.accountId && _signedInAuthState.deviceToken);
  }

  function getRelayAccountId() {
    return hasSignedInRelayAccount() ? _signedInAuthState.accountId : getAccountId();
  }

  function getRelayDeviceToken() {
    return hasSignedInRelayAccount() ? _signedInAuthState.deviceToken : getDeviceToken();
  }

  function sendJoin(force) {
    if (!_relayWs || _relayWs.readyState !== 1) return false;
    const user = getUsername();
    if (!user || user === 'Unknown') return false;
    const payload = {
      type: 'join',
      clientId: _clientId,
      accountId: getRelayAccountId(),
      deviceToken: getRelayDeviceToken(),
      profileId: getProfileId(),
      user: user,
      gameName: getGameName(),
      modeName: getModeName(),
      gameTag: getGameTag(),
      countryFlagCode: getOwnCountryFlagCode(),
      activeBadge: getOwnActiveBadge()
    };
    var _joinMM = globalThis.__ryuMMOwn;
    if (_joinMM && _joinMM.visible && _joinMM.point) {
      payload.mmX = Math.round(_joinMM.point.x * 10) / 10;
      payload.mmY = Math.round(_joinMM.point.y * 10) / 10;
    }
    var _joinWS = window._ryuWS;
    if (_joinWS && _joinWS.url && _joinWS.url.includes('ryuten.io')) {
      payload.serverUrl = _joinWS.url.split('?')[0] + '?';
    }
    const sig = 'join|' + payload.accountId + '|' + payload.user + '|' + payload.gameName + '|' + payload.gameTag + '|' + payload.countryFlagCode + '|' + payload.activeBadge;
    if (!force && sig === _lastPresenceSig) return true;
    _lastPresenceSig = sig;
    try {
      _relayWs.send(JSON.stringify(payload));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getPublicAuthState() {
    if (!hasSignedInRelayAccount()) {
      return {
        signedIn: false,
        provider: '',
        accountId: '',
        email: '',
        name: '',
        picture: '',
        googleSub: '',
        displayName: ''
      };
    }
    return Object.assign({}, _signedInAuthState);
  }

  function applySignedInAuthState(state) {
    const next = sanitizeSignedInAuthState(state);
    const prevAccountId = _signedInAuthState && _signedInAuthState.accountId ? _signedInAuthState.accountId : '';
    const nextAccountId = next && next.accountId ? next.accountId : '';
    _signedInAuthState = next;
    globalThis.__ryuAuthState = getPublicAuthState();
    globalThis.__ryuAccountId = getRelayAccountId();
    if (prevAccountId !== nextAccountId) {
      clearBadgeAccountState();
      _lastPresenceSig = '';
      if (_relayWs && _relayWs.readyState === 1) sendJoin(true);
    }
  }

  function ensureExtensionAuthState() {
    if (_authBootstrapPromise) return _authBootstrapPromise;
    _authBootstrapPromise = bridgeRequest('get_state').then(function(state) {
      applySignedInAuthState(state || null);
      return getPublicAuthState();
    }).catch(function(err) {
      console.warn('[RyuRelay] extension auth bootstrap failed', err);
      applySignedInAuthState(null);
      return getPublicAuthState();
    });
    return _authBootstrapPromise;
  }

  function getAccountId() {
    if (_accountId) return _accountId;
    try {
      var stored = localStorage.getItem('_ryuAccountId');
      if (stored && /^acc_[a-f0-9]{24}$/i.test(stored)) {
        _accountId = stored;
        return _accountId;
      }
    } catch (_) {}
    return '';
  }

  function getDeviceToken() {
    if (_deviceToken) return _deviceToken;
    try {
      var stored = localStorage.getItem('_ryuDeviceToken');
      if (stored && /^dt_[a-f0-9]{48}$/i.test(stored)) {
        _deviceToken = stored;
        return _deviceToken;
      }
    } catch (_) {}
    return '';
  }

  function setAnonymousAccount(accountId, deviceToken) {
    if (!/^acc_[a-f0-9]{24}$/i.test(String(accountId || ''))) return false;
    if (!/^dt_[a-f0-9]{48}$/i.test(String(deviceToken || ''))) return false;
    _accountId = String(accountId);
    _deviceToken = String(deviceToken);
    try {
      localStorage.setItem('_ryuAccountId', _accountId);
      localStorage.setItem('_ryuDeviceToken', _deviceToken);
    } catch (_) {}
    return true;
  }

  function ensureAnonymousAccount() {
    if (_accountInitPromise) return _accountInitPromise;
    _accountInitPromise = (async function() {
      try {
        const res = await fetch(getRelayHttpBase() + '/auth/anonymous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceToken: getDeviceToken() || ''
          })
        });
        if (!res.ok) throw new Error('Anonymous auth failed with status ' + res.status);
        const data = await res.json();
        if (!data || !data.ok) throw new Error((data && data.error) || 'Anonymous auth failed');
        if (!setAnonymousAccount(data.accountId, data.deviceToken)) {
          throw new Error('Anonymous auth returned invalid credentials');
        }
        globalThis.__ryuAccountId = _accountId;
        return {
          accountId: _accountId,
          deviceToken: _deviceToken,
          isNewAccount: !!data.isNewAccount
        };
      } catch (err) {
        console.warn('[RyuRelay] anonymous account bootstrap failed', err);
        return {
          accountId: getAccountId(),
          deviceToken: getDeviceToken(),
          isNewAccount: false
        };
      } finally {
        globalThis.__ryuAccountId = getAccountId();
      }
    })();
    return _accountInitPromise;
  }

  // raw send — queues if not ready
  function relaySend(obj) {
    const data = JSON.stringify(Object.assign({
      clientId: _clientId,
      accountId: getRelayAccountId() || undefined,
      deviceToken: getRelayDeviceToken() || undefined
    }, obj));
    if (_relayWs && _relayWs.readyState === 1) {
      try { _relayWs.send(data); return true; } catch (_) {}
    }
    // queue non-ping messages for when we reconnect
    if (obj.type !== 'ping' && obj.type !== 'join') {
      if (_sendQueue.length < QUEUE_MAX) _sendQueue.push(data);
    }
    return false;
  }

  function relaySendDirect(obj) {
    if (!_relayWs || _relayWs.readyState !== 1) return false;
    try {
      _relayWs.send(JSON.stringify(Object.assign({
        clientId: _clientId,
        accountId: getRelayAccountId() || undefined,
        deviceToken: getRelayDeviceToken() || undefined
      }, obj)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function notifyMessageSubscribers(msg) {
    _messageSubscribers.forEach(function(handler) {
      try { handler(msg); } catch (err) { console.warn('[RyuRelay] subscriber failed', err); }
    });
  }

  function getRelayChatKey(msg) {
    if (!msg || msg.type !== 'ryu_chat') return '';
    return [
      String(msg.clientId || '').trim(),
      String(msg.sentAt || '').trim(),
      String(msg.user || '').trim(),
      String(msg.text || '').trim()
    ].join('|');
  }

  function rememberRelayChatMessage(msg) {
    if (!msg || msg.type !== 'ryu_chat') return;
    var user = String(msg.user || '').trim();
    var text = String(msg.text || '').trim();
    if (!user || !text) return;
    var key = getRelayChatKey(msg);
    if (!key || globalThis.__ryuRelayChatSeen[key]) return;
    globalThis.__ryuRelayChatSeen[key] = 1;
    var list = globalThis.__ryuRelayChatMessages;
    list.push({
      type: 'ryu_chat',
      clientId: String(msg.clientId || '').trim(),
      user: user,
      text: text,
      sentAt: Number(msg.sentAt) || Date.now(),
      countryFlagCode: String(msg.countryFlagCode || '').trim().toUpperCase()
    });
    if (list.length > 120) {
      var removed = list.splice(0, list.length - 120);
      removed.forEach(function(entry) {
        var oldKey = getRelayChatKey(entry);
        if (oldKey) delete globalThis.__ryuRelayChatSeen[oldKey];
      });
    }
    globalThis.__ryuRelayChatVersion++;
  }

  function normalizeUser(user) {
    return String(user || '').trim().toLowerCase();
  }

  function isRyuBadgeId(badgeId) {
    return !!RYU_BADGE_CONFIG[badgeId];
  }

  function messageHasBadgeField(msg) {
    return !!msg && (
      Object.prototype.hasOwnProperty.call(msg, 'activeBadge') ||
      Object.prototype.hasOwnProperty.call(msg, 'badgeId')
    );
  }

  function getOwnActiveBadge() {
    var title = '';
    try {
      title = globalThis.__ryuPe && globalThis.__ryuPe._2874 ? globalThis.__ryuPe._2874.title : '';
    } catch (_) {}
    if (!title) {
      try {
        title = globalThis.__ryuBe && globalThis.__ryuBe._1059 ? globalThis.__ryuBe._1059._6302 : '';
      } catch (_) {}
    }
    if (!title) title = globalThis.__ryuCustomActiveTitle || '';
    if (!title) {
      try {
        title = localStorage.getItem('ryuActiveCustomBadge') || '';
      } catch (_) {}
    }
    return isRyuBadgeId(title) ? title : '';
  }

  function getBadgeEntitlementStorageKey(badgeId) {
    return 'ryuBadgeEntitled:' + badgeId;
  }

  function hasBadgeEntitlement(badgeId) {
    var config = RYU_BADGE_CONFIG[badgeId];
    return !!(config && globalThis.__ryuBadgeEntitlements[badgeId]);
  }

  function setBadgeEntitlement(badgeId, unlocked) {
    if (!isRyuBadgeId(badgeId)) return;
    globalThis.__ryuBadgeEntitlements[badgeId] = unlocked !== false;
    try { localStorage.setItem(getBadgeEntitlementStorageKey(badgeId), unlocked === false ? '0' : '1'); } catch (_) {}
    dispatchBadgeEntitlementsChanged();
  }

  function syncBadgeEntitlements(entitlements) {
    if (!Array.isArray(entitlements)) return;
    const owned = Object.create(null);
    entitlements.forEach(function(badgeId) {
      if (isRyuBadgeId(badgeId)) owned[badgeId] = true;
    });
    Object.keys(RYU_BADGE_CONFIG).forEach(function(badgeId) {
      setBadgeEntitlement(badgeId, !!owned[badgeId]);
    });
    dispatchBadgeEntitlementsChanged();
  }

  function dispatchBadgeEntitlementsChanged() {
    try {
      window.dispatchEvent(new CustomEvent('ryu-badge-entitlements-changed', {
        detail: {
          entitlements: Object.assign({}, globalThis.__ryuBadgeEntitlements || {}),
          activeBadge: getOwnActiveBadge()
        }
      }));
    } catch (_) {}
  }

  function setRelayBadge(user, clientId, badgeId) {
    if (!isRyuBadgeId(badgeId)) {
      clearRelayBadge(user, clientId);
      return;
    }
    var changed = false;
    if (user) {
      var uk = normalizeUser(user);
      if (globalThis.__ryuRelayBadgesByUser[uk] !== badgeId) {
        globalThis.__ryuRelayBadgesByUser[uk] = badgeId;
        changed = true;
      }
    }
    if (clientId) {
      if (globalThis.__ryuRelayBadgesByClient[clientId] !== badgeId) {
        globalThis.__ryuRelayBadgesByClient[clientId] = badgeId;
        changed = true;
      }
    }
    if (changed) {
      globalThis.__ryuRelayBadgeVersion++;
      if (globalThis.__ryuRegisterCustomBadgeTitles) globalThis.__ryuRegisterCustomBadgeTitles();
    }
  }

  function clearRelayBadge(user, clientId) {
    var changed = false;
    if (user) {
      var uk = normalizeUser(user);
      if (uk in globalThis.__ryuRelayBadgesByUser) {
        delete globalThis.__ryuRelayBadgesByUser[uk];
        changed = true;
      }
    }
    if (clientId) {
      if (clientId in globalThis.__ryuRelayBadgesByClient) {
        delete globalThis.__ryuRelayBadgesByClient[clientId];
        changed = true;
      }
    }
    if (changed) globalThis.__ryuRelayBadgeVersion++;
  }

  function applyPresenceIdentity(msg) {
    if (!msg || !msg.clientId) return;
    globalThis.__ryuPresenceInfo[msg.clientId] = globalThis.__ryuPresenceInfo[msg.clientId] || {};
    var info = globalThis.__ryuPresenceInfo[msg.clientId];
    var prevGameName = info.gameName || '';
    if (prevGameName && msg.gameName && prevGameName !== msg.gameName) {
      delete globalThis.__ryuRelayBadgesByUser[normalizeUser(prevGameName)];
    }
    if (msg.user) info.user = msg.user;
    if (msg.gameName) info.gameName = msg.gameName;
    if (msg.modeName) info.modeName = msg.modeName;
    if (msg.gameTag) info.gameTag = msg.gameTag;
    // The relay server verifies accountId against the DB and re-stamps it on the
    // message before broadcasting, so presence accountId is trustworthy.
    if (msg.accountId) info.accountId = msg.accountId;
    if (Object.prototype.hasOwnProperty.call(msg, 'countryFlagCode')) info.countryFlagCode = String(msg.countryFlagCode || '').trim().toUpperCase();
    // Minimap position (0-100 percent) — used to show off-screen relay users on map.
    if (typeof msg.mmX === 'number') info.mmX = msg.mmX;
    if (typeof msg.mmY === 'number') info.mmY = msg.mmY;
    // Game server URL — used by the Users Online panel join button.
    if (msg.serverUrl) info.serverUrl = msg.serverUrl;
    else if (msg.type === 'leave') info.serverUrl = '';
    globalThis.__ryuRelayPresenceVersion++;
  }

  function rememberRelayBadgeIdentity(msg) {
    if (!msg) return;
    if (!messageHasBadgeField(msg)) return;
    const badgeId = msg.activeBadge || msg.badgeId || '';
    if (isRyuBadgeId(badgeId)) {
      setRelayBadge(msg.user, msg.clientId, badgeId);
      if (msg.gameName) setRelayBadge(msg.gameName, msg.clientId, badgeId);
    } else {
      clearRelayBadge(msg.user, msg.clientId);
      if (msg.gameName) clearRelayBadge(msg.gameName, msg.clientId);
    }
  }

  function applyOwnApprovedBadge(badgeId) {
    if (!badgeId) {
      globalThis.__ryuCustomActiveTitle = '';
      if (globalThis.__ryuMe && typeof globalThis.__ryuMe._5518 === 'function') {
        try { globalThis.__ryuMe._5518(''); } catch (_) {}
      }
      if (globalThis.__ryuPe && globalThis.__ryuPe._2874) globalThis.__ryuPe._2874.title = '';
      if (globalThis.__ryuBe && globalThis.__ryuBe._1059) globalThis.__ryuBe._1059._6302 = '';
      try { localStorage.removeItem('ryuActiveCustomBadge'); } catch (_) {}
      dispatchBadgeEntitlementsChanged();
      return;
    }
    if (!isRyuBadgeId(badgeId)) return;
    setBadgeEntitlement(badgeId, true);
    if (globalThis.__ryuApplyApprovedBadgeTitle) {
      var prevSuppress = globalThis.__ryuSuppressBadgeToast;
      globalThis.__ryuSuppressBadgeToast = true;
      try {
        globalThis.__ryuApplyApprovedBadgeTitle(badgeId);
      } finally {
        globalThis.__ryuSuppressBadgeToast = prevSuppress;
      }
    } else {
      globalThis.__ryuCustomActiveTitle = badgeId;
    }
    try { localStorage.setItem('ryuActiveCustomBadge', badgeId); } catch (_) {}
    dispatchBadgeEntitlementsChanged();
  }

  function handleBadgeState(msg) {
    if (!msg || !msg.user) return;
    if (isRyuBadgeId(msg.badgeId)) {
      setRelayBadge(msg.user, msg.clientId, msg.badgeId);
      if (msg.gameName) setRelayBadge(msg.gameName, msg.clientId, msg.badgeId);
      if (msg.clientId === _clientId) {
        applyOwnApprovedBadge(msg.badgeId);
        sendPresence(true);
      }
    } else {
      clearRelayBadge(msg.user, msg.clientId);
      if (msg.gameName) clearRelayBadge(msg.gameName, msg.clientId);
      if (msg.clientId === _clientId) {
        applyOwnApprovedBadge('');
        sendPresence(true);
      }
    }
    if (globalThis.__ryuRefreshBadgeShop) globalThis.__ryuRefreshBadgeShop();
  }

  function handleBadgeResult(msg) {
    if (!msg) return;
    var shouldToastResult = _pendingBadgeRequest;
    _pendingBadgeRequest = false;
    if (msg.ok) {
      syncBadgeEntitlements(msg.entitlements);
      if (msg.badgeId && isRyuBadgeId(msg.badgeId)) setBadgeEntitlement(msg.badgeId, true);
      handleBadgeState({
        type: 'badge_state',
        user: msg.user || getUsername(),
        clientId: msg.clientId || _clientId,
        gameName: msg.gameName || getGameName(),
        badgeId: msg.badgeId || ''
      });
      if (shouldToastResult && globalThis.__ryuShowToast) {
        var confirmedMessage = String(msg.message || '').trim();
        if (!confirmedMessage) {
          var badgeName = (RYU_BADGE_CONFIG[msg.badgeId] && RYU_BADGE_CONFIG[msg.badgeId].name) || 'Badge';
          confirmedMessage = msg.badgeId ? (badgeName + ' Equipped') : 'Badge Unequipped';
        }
        globalThis.__ryuShowToast(confirmedMessage, 'success');
      }
      return;
    }
    if (globalThis.__ryuShowToast) {
      globalThis.__ryuShowToast(msg.error || 'Badge unlock failed.', 'error');
    }
    if (globalThis.__ryuRefreshBadgeShop) globalThis.__ryuRefreshBadgeShop();
  }

  function flushQueue() {
    while (_sendQueue.length) {
      const data = _sendQueue.shift();
      if (_relayWs && _relayWs.readyState === 1) {
        try { _relayWs.send(data); } catch (_) {}
      }
    }
  }

  function stopCmdFlush() {
    if (_cmdFlushTimer) {
      clearInterval(_cmdFlushTimer);
      _cmdFlushTimer = null;
    }
  }

  function flushCmdQueue() {
    if (!_relayWs || _relayWs.readyState !== 1) return;
    if (globalThis.__ryuCommanderSpamOn === false) {
      _cmdQueue.length = 0;
      stopCmdFlush();
      return;
    }
    const next = _cmdQueue.shift();
    if (!next) {
      stopCmdFlush();
      return;
    }
    relaySend(next);
    if (!_cmdQueue.length) stopCmdFlush();
  }

  function ensureCmdFlush() {
    if (_cmdFlushTimer) return;
    _cmdFlushTimer = setInterval(flushCmdQueue, CMD_SEND_INTERVAL_MS);
  }

  function shouldRenderCommanderText(clientId) {
    const key = clientId || 'unknown';
    const now = Date.now();
    const last = _cmdTextCooldownByClient[key] || 0;
    if (now - last < CMD_TEXT_COOLDOWN_MS) return false;
    _cmdTextCooldownByClient[key] = now;
    return true;
  }

  // apply snapshot data from server
  function applySnapshot(data, recent) {
    if (Array.isArray(data)) {
      for (const m of data) {
        if (m.user && m.clientId) {
          applyPresenceIdentity(m);
          rememberRelayBadgeIdentity(m);
        }
      }
    }
    // replay recent cmd/emote
    if (Array.isArray(recent)) {
      for (const m of recent) {
        if (m.type === 'cmd' && ((m.text && m.text.trim()) || m.imageUrl)) {
          if (m.clientId === _clientId) continue;
          // Sender spam state controls sender effects. Receiver setting can still
          // opt out locally, but it must not re-enable spam for a sender who disabled it.
          if (m.spamOn !== false && globalThis.__ryuCommanderSpamOn !== false && globalThis.__ryuCommanderPingLocal) globalThis.__ryuCommanderPingLocal(m.x, m.y);
          if (globalThis.__ryuRenderCmdText && shouldRenderCommanderText(m.clientId)) {
            globalThis.__ryuRenderCmdText(m.x, m.y, m.text || '', { imageUrl: m.imageUrl || '' });
          }
        }
        if (m.type === 'emote' && m.code) {
          if (globalThis.__ryuSpawnRemoteEmote) globalThis.__ryuSpawnRemoteEmote(m);
        }
        if (m.type === 'ryu_chat' && m.text && m.user) {
          rememberRelayChatMessage(m);
        }
      }
    }
  }

  // handle incoming relay messages
  function onMessage(evt) {
    let msg;
    try { msg = JSON.parse(evt.data); } catch (_) { return; }
    notifyMessageSubscribers(msg);

    if (msg.type === 'pong') return;

    if (msg.type === 'snapshot') {
      applySnapshot(msg.data, msg.recent);
      return;
    }

    if ((msg.type === 'join' || msg.type === 'presence') && msg.user && msg.clientId) {
      applyPresenceIdentity(msg);
      rememberRelayBadgeIdentity(msg);
      if (msg.clientId === _clientId && Array.isArray(msg.entitlements)) {
        syncBadgeEntitlements(msg.entitlements);
      }
    }
    if (msg.type === 'leave' && msg.clientId) {
      var presence = globalThis.__ryuPresenceInfo[msg.clientId];
      if (presence) {
        clearRelayBadge(presence.user, msg.clientId);
        clearRelayBadge(presence.gameName, msg.clientId);
      } else {
        clearRelayBadge('', msg.clientId);
      }
      delete globalThis.__ryuPresenceInfo[msg.clientId];
      globalThis.__ryuRelayPresenceVersion++;
    }

    if (msg.type === 'cmd' && ((msg.text && msg.text.trim()) || msg.imageUrl)) {
      if (msg.clientId === _clientId) return;
      // Sender spam state controls sender effects. Receiver setting can still
      // opt out locally, but it must not re-enable spam for a sender who disabled it.
      if (msg.spamOn !== false && globalThis.__ryuCommanderSpamOn !== false && globalThis.__ryuCommanderPingLocal) globalThis.__ryuCommanderPingLocal(msg.x, msg.y);
      if (globalThis.__ryuRenderCmdText && shouldRenderCommanderText(msg.clientId)) {
        globalThis.__ryuRenderCmdText(msg.x, msg.y, msg.text || '', { imageUrl: msg.imageUrl || '' });
      }
    }

    if (msg.type === 'emote' && msg.code) {
      if (msg.clientId !== _clientId && globalThis.__ryuSpawnRemoteEmote) {
        globalThis.__ryuSpawnRemoteEmote(msg);
      }
    }

    if (msg.type === 'kf_avatar' && msg.clientId !== _clientId && msg.user && msg.pic) {
      if (globalThis.__ryuKfAvatarMap) globalThis.__ryuKfAvatarMap[msg.user] = msg.pic;
    }

    if (msg.type === 'ryu_chat' && msg.text && msg.user) {
      rememberRelayChatMessage(msg);
    }

    if (msg.type === 'badge_state') {
      handleBadgeState(msg);
    }

    if (msg.type === 'badge_result' && msg.clientId === _clientId) {
      handleBadgeResult(msg);
    }

  }

  function connectRelay() {
    if (_relayWs && _relayWs.readyState <= 1) return;

    _relayWs    = new WebSocket(RELAY_URL + RELAY_ROOM);
    _relayReady = false;
    globalThis.__ryuRelayReady = false;

    _relayWs.addEventListener('open', function() {
      _relayReady = true;
      _relayRetries = 0;
      globalThis.__ryuRelayReady = true;
      console.log('[RyuRelay] connected');

      // heartbeat — app-level ping every 20s
      if (_relayHb) clearInterval(_relayHb);
      _relayHb = setInterval(function() {
        if (_relayWs && _relayWs.readyState === 1) {
          try { _relayWs.send(JSON.stringify({ type: 'ping' })); } catch (_) {}
        }
      }, 20000);

      // announce — wait for real username before sending
      function announce(isReannounce, attempts) {
        attempts = attempts || 0;
        const user = getUsername();
        if (!user || user === 'Unknown') {
          setTimeout(function() { announce(isReannounce, attempts + 1); }, 200);
          return;
        }
        const loggedIn = (function() { try { return globalThis.__Be._1059._4652 !== 0; } catch (_) { return false; } })();
        if (loggedIn && /^Guest\d+$/.test(user) && attempts < 40) {
          setTimeout(function() { announce(isReannounce, attempts + 1); }, 200);
          return;
        }
        Promise.allSettled([ensureAnonymousAccount(), ensureExtensionAuthState()]).finally(function() {
          sendJoin(true);
        });
        // broadcast kill feed avatar if set
        const _kfPic = globalThis.__ryuKfProfilePic;
        if (_kfPic) {
          try { _relayWs.send(JSON.stringify({ type: 'kf_avatar', clientId: _clientId, user: user, pic: _kfPic })); } catch (_) {}
        }
        // flush queued messages after join
        flushQueue();
        if (_cmdQueue.length) ensureCmdFlush();
        // re-announce once after 3s to catch anyone who joined slightly after
        if (!isReannounce) setTimeout(function() { announce(true, 0); }, 3000);
        if (!_presenceTimer) {
          _presenceTimer = setInterval(function() { sendPresence(true); }, 500);
        }
      }
      announce(false, 0);

    });

    _relayWs.addEventListener('message', onMessage);

    _relayWs.addEventListener('close', function() {
      _relayReady = false;
      globalThis.__ryuRelayReady = false;
      if (_relayHb) { clearInterval(_relayHb); _relayHb = null; }
      if (_presenceTimer) { clearInterval(_presenceTimer); _presenceTimer = null; }
      stopCmdFlush();
      _relayRetries++;
      // max 5s backoff — don't leave people waiting 30s
      const delay = Math.min(1000 * _relayRetries, 5000);
      console.log('[RyuRelay] disconnected, retry in', delay + 'ms');
      setTimeout(connectRelay, delay);
    });

    _relayWs.addEventListener('error', function() {
      _relayReady = false;
      globalThis.__ryuRelayReady = false;
      if (_relayHb) { clearInterval(_relayHb); _relayHb = null; }
      if (_presenceTimer) { clearInterval(_presenceTimer); _presenceTimer = null; }
      stopCmdFlush();
    });
  }

  function sendPresence(force) {
    if (!_relayWs || _relayWs.readyState !== 1) return false;
    const user = getUsername();
    if (!user || user === 'Unknown') return false;
    const payload = {
      type: 'presence',
      clientId: _clientId,
      accountId: getRelayAccountId(),
      deviceToken: getRelayDeviceToken(),
      profileId: getProfileId(),
      user,
      gameName: getGameName(),
      modeName: getModeName(),
      gameTag: getGameTag(),
      countryFlagCode: getOwnCountryFlagCode(),
      activeBadge: getOwnActiveBadge()
    };
    // Always include current minimap position so other clients can track us
    // even when we're off their viewport. __ryuMMOwn.point is 0-100 percent.
    var _mm = globalThis.__ryuMMOwn;
    if (_mm && _mm.visible && _mm.point) {
      payload.mmX = Math.round(_mm.point.x * 10) / 10;
      payload.mmY = Math.round(_mm.point.y * 10) / 10;
    }
    var _presWS = window._ryuWS;
    if (_presWS && _presWS.url && _presWS.url.includes('ryuten.io')) {
      payload.serverUrl = _presWS.url.split('?')[0] + '?';
    }
    const sig = payload.user + '|' + payload.gameName + '|' + payload.gameTag + '|' + payload.countryFlagCode + '|' + payload.activeBadge;
    if (!force && sig === _lastPresenceSig) return true;
    _lastPresenceSig = sig;
    try {
      _relayWs.send(JSON.stringify(payload));
      return true;
    } catch (_) {
      return false;
    }
  }

  // public api
  globalThis.__ryuGetRoom     = getRoomId;
  globalThis.__ryuGetUsername = getUsername;
  globalThis.__ryuClientId    = _clientId;
  globalThis.__ryuAccountId   = getRelayAccountId();
  globalThis.__ryuAuthState   = getPublicAuthState();
  globalThis.__ryuGetAuthState = function() {
    return getPublicAuthState();
  };
  globalThis.__ryuCanUseRelayPerk = function(perk) {
    if (perk === 'badges' || perk === 'proxVoice') return hasSignedInRelayAccount();
    return true;
  };
  globalThis.__ryuSignInWithGoogle = function() {
    return bridgeRequest('google_sign_in').then(function(state) {
      applySignedInAuthState(state || null);
      globalThis.__ryuAccountId = getRelayAccountId();
      return getPublicAuthState();
    });
  };
  globalThis.__ryuSignOut = function() {
    return bridgeRequest('sign_out').then(function(state) {
      applySignedInAuthState(state || null);
      globalThis.__ryuAccountId = getRelayAccountId();
      return getPublicAuthState();
    });
  };
  globalThis.__ryuSetDisplayName = function(displayName) {
    return bridgeRequest('set_display_name', { displayName: String(displayName || '').trim() }).then(function(state) {
      applySignedInAuthState(state || null);
      globalThis.__ryuAccountId = getRelayAccountId();
      return getPublicAuthState();
    });
  };
  globalThis.__ryuRelaySendMessage = function(obj, useDirect) {
    if (!obj || typeof obj !== 'object') return false;
    return useDirect ? relaySendDirect(obj) : relaySend(obj);
  };
  globalThis.__ryuRelaySubscribe = function(handler) {
    if (typeof handler !== 'function') return function() {};
    _messageSubscribers.add(handler);
    return function() {
      _messageSubscribers.delete(handler);
    };
  };
  globalThis.__ryuGetRelayBadgeForClient = function(client) {
    if (!client) return '';
    if (client._9710) {
      var ownBadge = getOwnActiveBadge();
      if (ownBadge) return ownBadge;
    }
    var version = globalThis.__ryuRelayBadgeVersion || 0;
    if (client._ryuRelayBadgeVersion === version) return client._ryuRelayBadge || '';
    var byUser = globalThis.__ryuRelayBadgesByUser[normalizeUser(client._6988)];
    var byClient = client._ryuRelayClientId ? globalThis.__ryuRelayBadgesByClient[client._ryuRelayClientId] : '';
    client._ryuRelayBadgeVersion = version;
    client._ryuRelayBadge = byUser || byClient || '';
    return client._ryuRelayBadge;
  };
  globalThis.__ryuGetRelayFlagForClient = function(client) {
    if (!client) return '';
    if (client._9710) return getOwnCountryFlagCode();
    var version = globalThis.__ryuRelayPresenceVersion || 0;
    if (client._ryuRelayFlagVersion === version) return client._ryuRelayFlagCode || '';
    var nameKey = normalizeUser(client._6988);
    var matchedClientId = '';
    if (nameKey) {
      var presenceInfo = globalThis.__ryuPresenceInfo || {};
      for (var cid in presenceInfo) {
        if (!Object.prototype.hasOwnProperty.call(presenceInfo, cid)) continue;
        var info = presenceInfo[cid];
        if (normalizeUser(info && info.gameName) === nameKey) {
          matchedClientId = cid;
          break;
        }
      }
    }
    client._ryuRelayClientId = matchedClientId || client._ryuRelayClientId || '';
    var byClientInfo = client._ryuRelayClientId ? globalThis.__ryuPresenceInfo[client._ryuRelayClientId] : null;
    client._ryuRelayFlagVersion = version;
    client._ryuRelayFlagCode = String(byClientInfo && byClientInfo.countryFlagCode || '').trim().toUpperCase();
    return client._ryuRelayFlagCode;
  };
  globalThis.__ryuHasBadgeEntitlement = hasBadgeEntitlement;
  globalThis.__ryuRequestBadgeEquip = function(badgeId, password) {
    if (badgeId && !isRyuBadgeId(badgeId)) return false;
    if (!hasSignedInRelayAccount()) {
      if (globalThis.__ryuShowToast) globalThis.__ryuShowToast('Sign in with Google to use Ryutheme badges.', 'error');
      return false;
    }
    const user = getUsername();
    const type = password ? 'badge_unlock' : 'badge_equip';
    const payload = { type, user, badgeId, profileId: getProfileId(), gameName: getGameName(), gameTag: getGameTag() };
    if (password) payload.password = password;
    if (!relaySendDirect(payload)) {
      if (globalThis.__ryuShowToast) globalThis.__ryuShowToast('Ryutheme relay is not connected yet.', 'error');
      return false;
    }
    _pendingBadgeRequest = true;
    return true;
  };

  Promise.allSettled([ensureAnonymousAccount(), ensureExtensionAuthState()]).then(function() {
    globalThis.__ryuAccountId = getRelayAccountId();
  });

  // commander text broadcast
  globalThis.__ryuRelaySend = function(x, y, text, imageUrl) {
    const user = getUsername();
    const payload = {
      type: 'cmd',
      user,
      x,
      y,
      text,
      imageUrl: imageUrl || '',
      spamOn: globalThis.__ryuCommanderSpamOn !== false,
      seq: ++_cmdSeq,
      sentAt: Date.now()
    };
    if (globalThis.__ryuCommanderSpamOn === false) {
      relaySend(payload);
      return;
    }
    if (_cmdQueue.length >= CMD_QUEUE_MAX) _cmdQueue.shift();
    _cmdQueue.push(payload);
    ensureCmdFlush();
  };

  // kill feed avatar broadcast
  globalThis.__ryuBroadcastKfAvatar = function() {
    const user = getUsername();
    const pic = globalThis.__ryuKfProfilePic;
    if (user && pic) relaySend({ type: 'kf_avatar', user, pic });
  };

  // emote broadcast
  globalThis.__ryuBroadcastEmote = function(code) {
    const user = getUsername();
    relaySend({
      type: 'emote',
      user,
      code,
      gameName: getGameName(),
      gameTag: getGameTag()
    });
  };

  globalThis.__ryuRelayChatSendText = function(text) {
    var nextText = String(text || '').replace(/\r/g, '').trim();
    if (!nextText) return false;
    const user = getUsername();
    if (!user || user === 'Unknown') return false;
    const msg = {
      type: 'ryu_chat',
      user: user,
      text: nextText.slice(0, 280),
      sentAt: Date.now(),
      clientId: _clientId,
      countryFlagCode: getOwnCountryFlagCode()
    };
    if (!relaySendDirect(msg)) {
      if (globalThis.__ryuShowToast) globalThis.__ryuShowToast('Ryutheme relay is not connected yet.', 'error');
      return false;
    }
    rememberRelayChatMessage(msg);
    notifyMessageSubscribers(msg);
    return true;
  };

  connectRelay();

})();
