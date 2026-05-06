// ryutheme relay server - node.js
// deploy on railway, render, etc.
// npm install ws

const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3001;
const TESTER_PASSWORD = process.env.RYU_TESTER_BADGE_PASSWORD || '';
const BADGE_STATE_FILE = process.env.RYU_BADGE_STATE_FILE || path.join(__dirname, 'ryutheme-badges.json');
const BADGES = {
  DM: 'TITLE_RYUTHEME_DM',
  TESTER: 'TITLE_RYUTHEME_TESTER'
};
const VALID_BADGES = new Set(Object.values(BADGES));

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  res.writeHead(200);
  res.end('ryutheme relay');
});

const wss = new WebSocketServer({ server });

// rooms: roomId -> Map(sessionId -> session)
const rooms = new Map();

// recent message buffer per room - replayed to reconnecting clients
// stores last 20 cmd/emote messages, max 8s old
const recentBuffer = new Map(); // roomId -> [{ msg, ts }]
const BUFFER_MAX = 20;
const BUFFER_TTL = 8000;
const PRESENCE_TYPES = new Set(['join', 'presence']);
const BUFFERED_TYPES = new Set(['cmd', 'emote', 'kf_avatar']);
const BROADCAST_TYPES = new Set(['join', 'presence', 'cmd', 'emote', 'kf_avatar', 'voice_state']);
const TARGETED_TYPES = new Set(['voice_offer', 'voice_answer', 'voice_ice']);

let nextId = 0;
let badgeState = loadBadgeState();

function loadBadgeState() {
  try {
    return JSON.parse(fs.readFileSync(BADGE_STATE_FILE, 'utf8'));
  } catch (_) {
    return { entitlements: {}, active: {} };
  }
}

function saveBadgeState() {
  try {
    fs.writeFileSync(BADGE_STATE_FILE, JSON.stringify(badgeState, null, 2));
  } catch (err) {
    console.warn('[relay] failed to save badge state:', err.message);
  }
}

function normalizeUser(user) {
  return String(user || '').trim().toLowerCase();
}

function safeUser(user) {
  return String(user || '').trim().slice(0, 32);
}

function safeClientId(clientId) {
  return String(clientId || '').trim().replace(/[^\w-]/g, '').slice(0, 80);
}

function safeBadgeId(badgeId) {
  const id = String(badgeId || '').trim();
  return VALID_BADGES.has(id) ? id : '';
}

function timingSafeEquals(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function hasBadgeEntitlement(userKey, badgeId) {
  if (badgeId === BADGES.DM) return true;
  return !!(badgeState.entitlements[userKey] && badgeState.entitlements[userKey][badgeId]);
}

function grantBadgeEntitlement(userKey, badgeId) {
  badgeState.entitlements[userKey] = badgeState.entitlements[userKey] || {};
  badgeState.entitlements[userKey][badgeId] = true;
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function getBuffer(roomId) {
  if (!recentBuffer.has(roomId)) recentBuffer.set(roomId, []);
  return recentBuffer.get(roomId);
}

function pushBuffer(roomId, msg) {
  const buf = getBuffer(roomId);
  buf.push({ msg, ts: Date.now() });
  // trim old entries
  const now = Date.now();
  while (buf.length > BUFFER_MAX || (buf.length && now - buf[0].ts > BUFFER_TTL)) {
    buf.shift();
  }
}

function broadcast(room, sessionId, data) {
  for (const [id, s] of room) {
    if (id === sessionId) continue;
    if (s.ws.readyState === WebSocket.OPEN) {
      try { s.ws.send(data); } catch (_) {}
    }
  }
}

function sendTo(session, data) {
  if (session.ws.readyState === WebSocket.OPEN) {
    try { session.ws.send(typeof data === 'string' ? data : JSON.stringify(data)); } catch (_) {}
  }
}

function findSessionByClientId(room, clientId) {
  const safeId = safeClientId(clientId);
  if (!safeId) return null;
  for (const [, session] of room) {
    if (session && session.clientId === safeId) return session;
  }
  return null;
}

function sendBadgeReject(session, badgeId, error) {
  sendTo(session, {
    type: 'badge_result',
    ok: false,
    user: session.user,
    clientId: session.clientId,
    badgeId,
    error
  });
}

function approveBadge(room, sessionId, session, badgeId) {
  const user = safeUser(session.user);
  const userKey = normalizeUser(user);
  badgeState.active[userKey] = badgeId;
  saveBadgeState();

  sendTo(session, {
    type: 'badge_result',
    ok: true,
    user,
    clientId: session.clientId,
    badgeId
  });

  broadcast(room, sessionId, JSON.stringify({
    type: 'badge_state',
    user,
    clientId: session.clientId,
    badgeId
  }));
}

function handleBadgeEquip(room, sessionId, session, msg) {
  const badgeId = safeBadgeId(msg.badgeId);
  const userKey = normalizeUser(session.user);
  if (!badgeId || !userKey) return sendBadgeReject(session, badgeId, 'Badge equip failed.');
  if (!hasBadgeEntitlement(userKey, badgeId)) return sendBadgeReject(session, badgeId, 'Badge is locked.');
  approveBadge(room, sessionId, session, badgeId);
}

function handleBadgeUnlock(room, sessionId, session, msg) {
  const badgeId = safeBadgeId(msg.badgeId);
  const userKey = normalizeUser(session.user);
  if (badgeId !== BADGES.TESTER || !userKey) return sendBadgeReject(session, badgeId, 'Badge unlock failed.');
  if (!TESTER_PASSWORD) return sendBadgeReject(session, badgeId, 'Tester badge is not configured on the server.');
  if (!timingSafeEquals(msg.password, TESTER_PASSWORD)) return sendBadgeReject(session, badgeId, 'Incorrect badge password.');
  grantBadgeEntitlement(userKey, badgeId);
  approveBadge(room, sessionId, session, badgeId);
}

// dead connection cleanup — runs every 30s
// sends a ping, marks pingSent, closes if no pong comes back in next cycle
setInterval(function() {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    for (const [sessionId, s] of room) {
      if (s.ws.readyState !== WebSocket.OPEN) {
        room.delete(sessionId);
        continue;
      }
      // if last pong was >45s ago, assume dead
      if (now - s.lastPong > 45000) {
        console.log('[relay] dead connection cleaned:', s.user || sessionId);
        s.ws.terminate();
        room.delete(sessionId);
        // broadcast leave
        if (s.user) {
          broadcast(room, sessionId, JSON.stringify({ type: 'leave', user: s.user, clientId: s.clientId || null }));
        }
        continue;
      }
      // send native ws ping
      try { s.ws.ping(); } catch (_) {}
    }
    // clean empty rooms
    if (room.size === 0) rooms.delete(roomId);
  }
}, 30000);

// clean old buffer entries every 10s
setInterval(function() {
  const now = Date.now();
  for (const [roomId, buf] of recentBuffer) {
    while (buf.length && now - buf[0].ts > BUFFER_TTL) buf.shift();
    if (buf.length === 0) recentBuffer.delete(roomId);
  }
}, 10000);

wss.on('connection', function(ws, req) {
  // parse room from path: /relay/roomId
  const match = (req.url || '').match(/^\/relay\/([a-z0-9-]+)/);
  if (!match) { ws.close(1008, 'invalid room'); return; }

  const roomId = match[1];
  const sessionId = ++nextId;
  const room = getRoom(roomId);

  const session = {
    ws,
    roomId,
    user: null,
    clientId: null,
    gameName: '',
    gameTag: '',
    lastPong: Date.now()
  };

  room.set(sessionId, session);
  console.log('[relay] connect', sessionId, 'room:', roomId, 'clients:', room.size);

  // native pong handler — update lastPong
  ws.on('pong', function() {
    session.lastPong = Date.now();
  });

  // send snapshot of current room state to new joiner
  const snapshot = [];
  for (const [id, s] of room) {
    if (id === sessionId) continue;
    if (s.user) {
      snapshot.push({
        type: 'join',
        user: s.user,
        clientId: s.clientId || null,
        gameName: s.gameName || '',
        gameTag: s.gameTag || '',
        activeBadge: badgeState.active[normalizeUser(s.user)] || ''
      });
    }
  }

  // replay recent cmd/emote buffer so reconnecting clients don't miss recent events
  const buf = getBuffer(roomId);
  const now = Date.now();
  const freshBuf = buf.filter(function(b) { return now - b.ts <= BUFFER_TTL; });

  if (snapshot.length || freshBuf.length) {
    try {
      ws.send(JSON.stringify({
        type: 'snapshot',
        data: snapshot,
        recent: freshBuf.map(function(b) { return b.msg; })
      }));
    } catch (_) {}
  }

  ws.on('message', function(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }

    // update session state
    if (PRESENCE_TYPES.has(msg.type) && msg.user) {
      session.user = safeUser(msg.user);
      session.clientId = safeClientId(msg.clientId) || null;
      session.gameName = safeUser(msg.gameName);
      session.gameTag = safeUser(msg.gameTag);
      msg.user = session.user;
      msg.clientId = session.clientId;
      msg.gameName = session.gameName;
      msg.gameTag = session.gameTag;
      msg.activeBadge = badgeState.active[normalizeUser(session.user)] || '';
    }
    // buffer cmd and emote for replay
    if (BUFFERED_TYPES.has(msg.type)) {
      pushBuffer(roomId, msg);
    }

    // ping - respond with pong, don't broadcast
    if (msg.type === 'ping') {
      session.lastPong = Date.now();
      try { ws.send(JSON.stringify({ type: 'pong' })); } catch (_) {}
      return;
    }

    if (msg.type === 'badge_equip') {
      handleBadgeEquip(room, sessionId, session, msg);
      return;
    }

    if (msg.type === 'badge_unlock') {
      handleBadgeUnlock(room, sessionId, session, msg);
      return;
    }

    if (!BROADCAST_TYPES.has(msg.type) && !TARGETED_TYPES.has(msg.type)) {
      return;
    }

    if (TARGETED_TYPES.has(msg.type)) {
      const target = findSessionByClientId(room, msg.targetClientId);
      if (!target) return;
      sendTo(target, msg);
      return;
    }

    // broadcast known relay messages to the room
    broadcast(room, sessionId, JSON.stringify(msg));
  });

  ws.on('close', function() {
    room.delete(sessionId);
    console.log('[relay] disconnect', sessionId, 'room:', roomId, 'clients:', room.size);

    if (session.user) {
      broadcast(room, sessionId, JSON.stringify({
        type: 'leave',
        user: session.user,
        clientId: session.clientId || null
      }));
    }
    if (room.size === 0) rooms.delete(roomId);
  });

  ws.on('error', function(err) {
    console.error('[relay] ws error', sessionId, err.message);
    room.delete(sessionId);
  });
});

server.listen(PORT, function() {
  console.log('[relay] listening on port', PORT);
});
