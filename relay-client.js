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

  // raw send — queues if not ready
  function relaySend(obj) {
    const data = JSON.stringify(Object.assign({ clientId: _clientId }, obj));
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
      _relayWs.send(JSON.stringify(Object.assign({ clientId: _clientId }, obj)));
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
  }

  function setRelayBadge(user, clientId, badgeId) {
    if (!isRyuBadgeId(badgeId)) {
      clearRelayBadge(user, clientId);
      return;
    }
    if (user) globalThis.__ryuRelayBadgesByUser[normalizeUser(user)] = badgeId;
    if (clientId) globalThis.__ryuRelayBadgesByClient[clientId] = badgeId;
    globalThis.__ryuRelayBadgeVersion++;
    if (globalThis.__ryuRegisterCustomBadgeTitles) globalThis.__ryuRegisterCustomBadgeTitles();
  }

  function clearRelayBadge(user, clientId) {
    if (user) delete globalThis.__ryuRelayBadgesByUser[normalizeUser(user)];
    if (clientId) delete globalThis.__ryuRelayBadgesByClient[clientId];
    globalThis.__ryuRelayBadgeVersion++;
  }

  function applyPresenceIdentity(msg) {
    if (!msg || !msg.clientId) return;
    globalThis.__ryuPresenceInfo[msg.clientId] = globalThis.__ryuPresenceInfo[msg.clientId] || {};
    var prevGameName = globalThis.__ryuPresenceInfo[msg.clientId].gameName || '';
    if (prevGameName && msg.gameName && prevGameName !== msg.gameName) {
      delete globalThis.__ryuRelayBadgesByUser[normalizeUser(prevGameName)];
    }
    if (msg.user) globalThis.__ryuPresenceInfo[msg.clientId].user = msg.user;
    if (msg.gameName) globalThis.__ryuPresenceInfo[msg.clientId].gameName = msg.gameName;
    if (msg.gameTag) globalThis.__ryuPresenceInfo[msg.clientId].gameTag = msg.gameTag;
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
        if (m.clientId === _clientId) continue;
        if (m.type === 'cmd' && ((m.text && m.text.trim()) || m.imageUrl)) {
          // Sender spam state controls sender effects. Receiver setting can still
          // opt out locally, but it must not re-enable spam for a sender who disabled it.
          if (m.spamOn !== false && globalThis.__ryuCommanderSpamOn !== false && globalThis.__ryuCommanderPingLocal) globalThis.__ryuCommanderPingLocal(m.x, m.y);
          if (globalThis.__ryuRenderCmdText && shouldRenderCommanderText(m.clientId)) {
            globalThis.__ryuRenderCmdText(m.x, m.y, m.text || '', { imageUrl: m.imageUrl || '' });
          }
        }
        if (m.type === 'emote' && m.user && m.code) {
          if (globalThis.__ryuSpawnRemoteEmote) globalThis.__ryuSpawnRemoteEmote(m.user, m.code);
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

    if (msg.type === 'emote' && msg.user && msg.code) {
      if (msg.clientId !== _clientId && globalThis.__ryuSpawnRemoteEmote) {
        globalThis.__ryuSpawnRemoteEmote(msg.user, msg.code);
      }
    }

    if (msg.type === 'kf_avatar' && msg.clientId !== _clientId && msg.user && msg.pic) {
      if (globalThis.__ryuKfAvatarMap) globalThis.__ryuKfAvatarMap[msg.user] = msg.pic;
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
        try {
          _relayWs.send(JSON.stringify({
            type: 'join',
            clientId: _clientId,
            profileId: getProfileId(),
            user: user,
            gameName: getGameName(),
            gameTag: getGameTag(),
            activeBadge: getOwnActiveBadge()
          }));
        } catch (_) {}
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
          _presenceTimer = setInterval(function() { sendPresence(false); }, 2000);
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
      profileId: getProfileId(),
      user,
      gameName: getGameName(),
      gameTag: getGameTag(),
      activeBadge: getOwnActiveBadge()
    };
    const sig = payload.user + '|' + payload.gameName + '|' + payload.gameTag + '|' + payload.activeBadge;
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
  globalThis.__ryuHasBadgeEntitlement = hasBadgeEntitlement;
  globalThis.__ryuRequestBadgeEquip = function(badgeId, password) {
    if (badgeId && !isRyuBadgeId(badgeId)) return false;
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
    relaySend({ type: 'emote', user, code });
  };

  connectRelay();

})();
