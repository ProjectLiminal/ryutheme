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

  // queue for messages sent while disconnected — flushed on reconnect
  const _sendQueue = [];
  const QUEUE_MAX  = 30;

  globalThis.__ryuUserColors   = globalThis.__ryuUserColors  || {};
  globalThis.__ryuPresenceInfo = {};
  globalThis.__ryuRelayReady   = false;

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

  function flushQueue() {
    while (_sendQueue.length) {
      const data = _sendQueue.shift();
      if (_relayWs && _relayWs.readyState === 1) {
        try { _relayWs.send(data); } catch (_) {}
      }
    }
  }

  // apply snapshot data from server
  function applySnapshot(data, recent) {
    if (Array.isArray(data)) {
      for (const m of data) {
        if (m.user && m.clientId) {
          globalThis.__ryuPresenceInfo[m.clientId] = globalThis.__ryuPresenceInfo[m.clientId] || {};
          globalThis.__ryuPresenceInfo[m.clientId].user = m.user;
        }
        if (m.type === 'vc_presence' && m.user && globalThis.__ryuVCOnMessage) {
          try { globalThis.__ryuVCOnMessage(m); } catch (_) {}
        }
      }
    }
    // replay recent cmd/emote
    if (Array.isArray(recent)) {
      for (const m of recent) {
        if (m.clientId === _clientId) continue;
        if (m.type === 'cmd' && m.text && m.text.trim()) {
          if (globalThis.__ryuRenderCmdText) globalThis.__ryuRenderCmdText(m.x, m.y, m.text);
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

    if (msg.type === 'pong') return;

    if (msg.type === 'snapshot') {
      applySnapshot(msg.data, msg.recent);
      return;
    }

    if (msg.type === 'join' && msg.user && msg.clientId) {
      globalThis.__ryuPresenceInfo[msg.clientId] = globalThis.__ryuPresenceInfo[msg.clientId] || {};
      globalThis.__ryuPresenceInfo[msg.clientId].user = msg.user;
    }
    if (msg.type === 'leave' && msg.clientId) {
      delete globalThis.__ryuPresenceInfo[msg.clientId];
    }

    if (msg.type === 'cmd' && msg.text && msg.text.trim()) {
      if (msg.clientId === _clientId) return;
      if (globalThis.__ryuRenderCmdText) globalThis.__ryuRenderCmdText(msg.x, msg.y, msg.text);
    }

    if (msg.type === 'emote' && msg.user && msg.code) {
      if (msg.clientId !== _clientId && globalThis.__ryuSpawnRemoteEmote) {
        globalThis.__ryuSpawnRemoteEmote(msg.user, msg.code);
      }
    }

    // route everything to vc handler
    if (globalThis.__ryuVCOnMessage) {
      try { globalThis.__ryuVCOnMessage(msg); } catch (_) {}
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
        try { _relayWs.send(JSON.stringify({ type: 'join', clientId: _clientId, user: user })); } catch (_) {}
        // flush queued messages after join
        flushQueue();
        // re-announce once after 3s to catch anyone who joined slightly after
        if (!isReannounce) setTimeout(function() { announce(true, 0); }, 3000);
      }
      announce(false, 0);

      // ask who's in vc
      setTimeout(function() {
        if (globalThis.__ryuVC) globalThis.__ryuVC.whosin();
      }, 500);
    });

    _relayWs.addEventListener('message', onMessage);

    _relayWs.addEventListener('close', function() {
      _relayReady = false;
      globalThis.__ryuRelayReady = false;
      if (_relayHb) { clearInterval(_relayHb); _relayHb = null; }
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
    });
  }

  // public api
  globalThis.__ryuGetRoom     = getRoomId;
  globalThis.__ryuGetUsername = getUsername;
  globalThis.__ryuClientId    = _clientId;

  // generic send — used by voicechat.js and anything else
  globalThis.__ryuVCSend = function(msg) {
    return relaySend(msg);
  };

  // commander text broadcast
  globalThis.__ryuRelaySend = function(x, y, text) {
    const user = getUsername();
    relaySend({ type: 'cmd', user, x, y, text });
  };

  // emote broadcast
  globalThis.__ryuBroadcastEmote = function(code) {
    const user = getUsername();
    relaySend({ type: 'emote', user, code });
  };

  connectRelay();

})();