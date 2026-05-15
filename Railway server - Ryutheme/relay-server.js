// ryutheme relay server - node.js
// deploy on railway, render, etc.
// npm install ws

const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');

const PORT = process.env.PORT || 3001;
const GOOGLE_CLIENT_IDS = String(process.env.GOOGLE_CLIENT_IDS || '')
  .split(',')
  .map(function(value) { return String(value || '').trim(); })
  .filter(Boolean);
const googleAuthClient = new OAuth2Client();
const BADGE_CONFIG = {
  TITLE_RYUTHEME_DM: {
    name: 'RYUTHEME DM',
    free: true
  },
  TITLE_RYUTHEME_TESTER: {
    name: 'RYUTHEME Tester',
    passwordEnv: 'RYU_TESTER_BADGE_PASSWORD'
  }
};
const VALID_BADGES = new Set(Object.keys(BADGE_CONFIG));

function setCorsHeaders(req, res) {
  const origin = String((req && req.headers && req.headers.origin) || '').trim();
  const allowOrigin = origin === 'https://ryuten.io' ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      databaseConfigured: db.hasDatabase
    }));
    return;
  }

  if (req.method === 'POST' && req.url === '/auth/anonymous') {
    if (!db.hasDatabase) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Database is not configured.' }));
      return;
    }

    try {
      const body = await readJsonBody(req);
      const result = await findOrCreateAnonymousAccount(body && body.deviceToken);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        accountId: result.accountId,
        deviceToken: result.deviceToken,
        isNewAccount: result.isNewAccount
      }));
    } catch (err) {
      console.error('[relay] anonymous auth failed:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message || 'Anonymous auth failed.' }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/auth/google') {
    if (!db.hasDatabase) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Database is not configured.' }));
      return;
    }
    if (!GOOGLE_CLIENT_IDS.length) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Google sign-in is not configured on the server.' }));
      return;
    }

    try {
      const body = await readJsonBody(req);
      const result = await signInWithGoogle(body || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        provider: 'google',
        accountId: result.accountId,
        displayName: result.displayName || '',
        deviceToken: result.deviceToken,
        email: result.email,
        emailVerified: result.emailVerified,
        name: result.name,
        picture: result.picture,
        googleSub: result.googleSub,
        isNewAccount: result.isNewAccount
      }));
    } catch (err) {
      console.error('[relay] google auth failed:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message || 'Google sign-in failed.' }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/account/name') {
    if (!db.hasDatabase) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Database is not configured.' }));
      return;
    }
    try {
      const body = await readJsonBody(req);
      const accountId = safeAccountId(body && body.accountId);
      const deviceToken = String((body && body.deviceToken) || '').trim();
      const displayName = safeAccountName(body && body.displayName);
      if (!accountId || !deviceToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Missing accountId or deviceToken.' }));
        return;
      }
      if (!displayName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Display name cannot be empty.' }));
        return;
      }
      const auth = await authenticateAnonymousAccount(accountId, deviceToken);
      if (!auth) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Authentication failed.' }));
        return;
      }
      await db.query('UPDATE users SET display_name = $1 WHERE public_id = $2', [displayName, accountId]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, displayName }));
    } catch (err) {
      console.error('[relay] set display name failed:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message || 'Failed to set display name.' }));
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
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

// in-memory badge state for non-account sessions (pid:/user: identity keys)
// account-backed sessions (acc:) use the database instead
const memEntitlements = new Map(); // identityKey -> Set<badgeId>
const memActive = new Map();       // identityKey -> badgeId

function normalizeUser(user) {
  return String(user || '').trim().toLowerCase();
}

function safeUser(user) {
  return String(user || '').trim().slice(0, 32);
}

function safeDisplayName(name) {
  return String(name || '').trim().slice(0, 32);
}

function safeClientId(clientId) {
  return String(clientId || '').trim().replace(/[^\w-]/g, '').slice(0, 80);
}

function safeProfileId(profileId) {
  return String(profileId || '').trim().replace(/[^\w-]/g, '').slice(0, 80);
}

function safeAccountId(accountId) {
  const value = String(accountId || '').trim();
  return /^acc_[a-f0-9]{24}$/i.test(value) ? value : '';
}

function safeAccountName(name) {
  return String(name || '').trim().slice(0, 24);
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', function(chunk) {
      raw += chunk;
      if (raw.length > 1024 * 64) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', function() {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', function(err) {
      reject(err);
    });
  });
}

function makePublicAccountId() {
  return 'acc_' + crypto.randomBytes(12).toString('hex');
}

function makeDeviceToken() {
  return 'dt_' + crypto.randomBytes(24).toString('hex');
}

function hashDeviceToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

async function findOrCreateAnonymousAccount(deviceToken) {
  const normalizedToken = String(deviceToken || '').trim();
  if (normalizedToken) {
    const tokenHash = hashDeviceToken(normalizedToken);
    const existing = await db.query(`
      SELECT users.public_id, users.display_name
      FROM devices
      INNER JOIN users ON users.id = devices.user_id
      WHERE devices.device_token_hash = $1
      LIMIT 1
    `, [tokenHash]);

    if (existing.rows[0]) {
      await db.query(`
        UPDATE devices
        SET last_seen_at = NOW()
        WHERE device_token_hash = $1
      `, [tokenHash]);

      return {
        accountId: existing.rows[0].public_id,
        displayName: String(existing.rows[0].display_name || '').trim(),
        deviceToken: normalizedToken,
        isNewAccount: false
      };
    }
  }

  const nextDeviceToken = makeDeviceToken();
  const nextDeviceTokenHash = hashDeviceToken(nextDeviceToken);
  const nextAccountId = makePublicAccountId();

  const insertedUser = await db.query(`
    INSERT INTO users (public_id)
    VALUES ($1)
    RETURNING id, public_id
  `, [nextAccountId]);

  await db.query(`
    INSERT INTO devices (user_id, device_token_hash)
    VALUES ($1, $2)
  `, [insertedUser.rows[0].id, nextDeviceTokenHash]);

  return {
    accountId: insertedUser.rows[0].public_id,
    displayName: '',
    deviceToken: nextDeviceToken,
    isNewAccount: true
  };
}

async function authenticateAnonymousAccount(accountId, deviceToken) {
  const safeId = safeAccountId(accountId);
  const normalizedToken = String(deviceToken || '').trim();
  if (!safeId || !normalizedToken || !db.hasDatabase) return null;

  const tokenHash = hashDeviceToken(normalizedToken);
  const result = await db.query(`
    SELECT users.public_id
    FROM devices
    INNER JOIN users ON users.id = devices.user_id
    WHERE users.public_id = $1
      AND devices.device_token_hash = $2
    LIMIT 1
  `, [safeId, tokenHash]);

  if (!result.rows[0]) return null;

  await db.query(`
    UPDATE devices
    SET last_seen_at = NOW()
    WHERE device_token_hash = $1
  `, [tokenHash]);

  return {
    accountId: result.rows[0].public_id
  };
}

async function fetchGoogleUserInfoFromAccessToken(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) throw new Error('Missing Google access token.');

  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  const payload = await response.json().catch(function() { return null; });
  if (!response.ok || !payload) {
    throw new Error((payload && payload.error_description) || (payload && payload.error) || 'Failed to fetch Google user profile.');
  }
  return payload;
}

async function verifyGoogleIdToken(idToken) {
  const token = String(idToken || '').trim();
  if (!token) throw new Error('Missing Google ID token.');

  const ticket = await googleAuthClient.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_IDS
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google ID token payload.');
  return payload;
}

async function signInWithGoogle(authPayload) {
  let payload = null;
  const accessToken = authPayload && authPayload.accessToken;
  const idToken = authPayload && authPayload.idToken;

  if (accessToken) {
    payload = await fetchGoogleUserInfoFromAccessToken(accessToken);
  } else if (idToken) {
    payload = await verifyGoogleIdToken(idToken);
  } else {
    throw new Error('Missing Google token.');
  }

  const googleSub = String(payload.sub || '').trim();
  if (!googleSub) throw new Error('Google account is missing a subject identifier.');

  const email = String(payload.email || '').trim();
  const name = String(payload.name || '').trim();
  const picture = String(payload.picture || '').trim();
  const emailVerified = !!payload.email_verified;

  const existing = await db.query(`
    SELECT users.id, users.public_id, users.display_name
    FROM google_accounts
    INNER JOIN users ON users.id = google_accounts.user_id
    WHERE google_accounts.google_sub = $1
    LIMIT 1
  `, [googleSub]);

  let userId = 0;
  let accountId = '';
  let displayName = '';
  let isNewAccount = false;

  if (existing.rows[0]) {
    userId = Number(existing.rows[0].id);
    accountId = String(existing.rows[0].public_id || '');
    displayName = String(existing.rows[0].display_name || '').trim();
    await db.query(`
      UPDATE google_accounts
      SET email = $2,
          email_verified = $3,
          name = $4,
          picture = $5,
          updated_at = NOW()
      WHERE google_sub = $1
    `, [googleSub, email || null, emailVerified, name || null, picture || null]);
  } else {
    const nextAccountId = makePublicAccountId();
    const insertedUser = await db.query(`
      INSERT INTO users (public_id)
      VALUES ($1)
      RETURNING id, public_id
    `, [nextAccountId]);
    userId = Number(insertedUser.rows[0].id);
    accountId = String(insertedUser.rows[0].public_id || '');
    await db.query(`
      INSERT INTO google_accounts (user_id, google_sub, email, email_verified, name, picture)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, googleSub, email || null, emailVerified, name || null, picture || null]);
    isNewAccount = true;
  }

  const deviceToken = makeDeviceToken();
  const deviceTokenHash = hashDeviceToken(deviceToken);
  await db.query(`
    INSERT INTO devices (user_id, device_token_hash, last_seen_at)
    VALUES ($1, $2, NOW())
  `, [userId, deviceTokenHash]);

  return {
    provider: 'google',
    accountId,
    displayName,
    deviceToken,
    email,
    emailVerified,
    name,
    picture,
    googleSub,
    isNewAccount
  };
}

async function getUserIdByIdentityKey(identityKey) {
  if (!identityKey.startsWith('acc:') || !db.hasDatabase) return null;
  const publicId = identityKey.slice(4);
  const result = await db.query(
    'SELECT id FROM users WHERE public_id = $1 LIMIT 1',
    [publicId]
  );
  return result.rows[0] ? Number(result.rows[0].id) : null;
}

async function hasBadgeEntitlement(identityKey, badgeId) {
  if (identityKey.startsWith('acc:') && db.hasDatabase) {
    const userId = await getUserIdByIdentityKey(identityKey);
    if (!userId) return false;
    const result = await db.query(
      'SELECT 1 FROM badge_entitlements WHERE user_id = $1 AND badge_id = $2 LIMIT 1',
      [userId, badgeId]
    );
    return result.rows.length > 0;
  }
  const owned = memEntitlements.get(identityKey);
  return !!(owned && owned.has(badgeId));
}

async function grantBadgeEntitlement(identityKey, badgeId) {
  if (identityKey.startsWith('acc:') && db.hasDatabase) {
    const userId = await getUserIdByIdentityKey(identityKey);
    if (!userId) return;
    await db.query(
      'INSERT INTO badge_entitlements (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, badgeId]
    );
    return;
  }
  if (!memEntitlements.has(identityKey)) memEntitlements.set(identityKey, new Set());
  memEntitlements.get(identityKey).add(badgeId);
}

async function setActiveBadge(identityKey, badgeId) {
  if (identityKey.startsWith('acc:') && db.hasDatabase) {
    const userId = await getUserIdByIdentityKey(identityKey);
    if (!userId) return;
    if (badgeId) {
      await db.query(`
        INSERT INTO badge_active (user_id, badge_id, set_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO UPDATE SET badge_id = EXCLUDED.badge_id, set_at = NOW()
      `, [userId, badgeId]);
    } else {
      await db.query('DELETE FROM badge_active WHERE user_id = $1', [userId]);
    }
    return;
  }
  if (badgeId) memActive.set(identityKey, badgeId);
  else memActive.delete(identityKey);
}

async function getActiveBadge(identityKey) {
  if (identityKey.startsWith('acc:') && db.hasDatabase) {
    const userId = await getUserIdByIdentityKey(identityKey);
    if (!userId) return '';
    const result = await db.query(
      'SELECT badge_id FROM badge_active WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return result.rows[0] ? safeBadgeId(result.rows[0].badge_id) : '';
  }
  return safeBadgeId(memActive.get(identityKey) || '');
}

async function getBadgeEntitlements(identityKey) {
  if (identityKey.startsWith('acc:') && db.hasDatabase) {
    const userId = await getUserIdByIdentityKey(identityKey);
    if (!userId) return [];
    const result = await db.query(
      'SELECT badge_id FROM badge_entitlements WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(function(r) { return r.badge_id; }).filter(function(id) { return VALID_BADGES.has(id); });
  }
  const owned = memEntitlements.get(identityKey) || new Set();
  return [...owned].filter(function(id) { return VALID_BADGES.has(id); });
}

function getBadgeDisplayName(badgeId) {
  const config = BADGE_CONFIG[badgeId];
  if (config && config.name) return String(config.name);
  return String(badgeId || '')
    .replace(/^TITLE_/, '')
    .replace(/_/g, ' ')
    .trim();
}

function getIdentityKey(session, msg) {
  const accountId = safeAccountId((msg && msg.accountId) || session.accountId || '');
  if (accountId) return 'acc:' + accountId;
  const profileId = safeProfileId((msg && msg.profileId) || session.profileId || '');
  if (profileId) return 'pid:' + profileId;
  const userKey = normalizeUser((msg && msg.user) || session.user || '');
  if (userKey) return 'user:' + userKey;
  return '';
}

function hasSignedInRyuthemeAccount(session, msg) {
  const accountId = safeAccountId((msg && msg.accountId) || session.accountId || '');
  return !!accountId;
}

function canUseServerPerk(session, msg, perk) {
  if (perk === 'badges' || perk === 'proxVoice') {
    return hasSignedInRyuthemeAccount(session, msg);
  }
  return true;
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

function findSessionByClientId(room, clientId) {
  const safeId = safeClientId(clientId);
  if (!safeId) return null;
  for (const [, session] of room) {
    if (session && session.clientId === safeId) return session;
  }
  return null;
}

function sendTo(session, data) {
  if (session.ws.readyState === WebSocket.OPEN) {
    try { session.ws.send(typeof data === 'string' ? data : JSON.stringify(data)); } catch (_) {}
  }
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

async function approveBadge(room, sessionId, session, badgeId) {
  const user = safeUser(session.user);
  const identityKey = getIdentityKey(session);
  if (!identityKey) return sendBadgeReject(session, badgeId, 'Badge equip failed.');
  await setActiveBadge(identityKey, badgeId);
  session.activeBadge = badgeId;

  sendTo(session, {
    type: 'badge_result',
    ok: true,
    user,
    clientId: session.clientId,
    gameName: session.gameName || '',
    gameTag: session.gameTag || '',
    badgeId,
    message: badgeId ? `${getBadgeDisplayName(badgeId)} Equipped` : 'Badge Unequipped',
    entitlements: await getBadgeEntitlements(identityKey)
  });

  broadcast(room, sessionId, JSON.stringify({
    type: 'badge_state',
    user,
    clientId: session.clientId,
    gameName: session.gameName || '',
    gameTag: session.gameTag || '',
    badgeId
  }));
}

async function handleBadgeEquip(room, sessionId, session, msg) {
  if (msg.gameName !== undefined) session.gameName = safeDisplayName(msg.gameName);
  if (msg.gameTag !== undefined) session.gameTag = safeDisplayName(msg.gameTag);
  const rawBadgeId = String(msg.badgeId || '').trim();
  if (!canUseServerPerk(session, msg, 'badges')) {
    return sendBadgeReject(session, rawBadgeId, 'Sign in with a Ryutheme account to use badges.');
  }
  if (!rawBadgeId) return approveBadge(room, sessionId, session, '');
  const badgeId = safeBadgeId(rawBadgeId);
  const identityKey = getIdentityKey(session, msg);
  const config = badgeId ? BADGE_CONFIG[badgeId] : null;
  if (!badgeId || !identityKey) return sendBadgeReject(session, badgeId, 'Badge equip failed.');
  if (config && config.free && !await hasBadgeEntitlement(identityKey, badgeId)) {
    await grantBadgeEntitlement(identityKey, badgeId);
  }
  if (!await hasBadgeEntitlement(identityKey, badgeId)) return sendBadgeReject(session, badgeId, 'Badge is locked.');
  await approveBadge(room, sessionId, session, badgeId);
}

async function handleBadgeUnlock(room, sessionId, session, msg) {
  if (msg.gameName !== undefined) session.gameName = safeDisplayName(msg.gameName);
  if (msg.gameTag !== undefined) session.gameTag = safeDisplayName(msg.gameTag);
  const badgeId = safeBadgeId(msg.badgeId);
  if (!canUseServerPerk(session, msg, 'badges')) {
    return sendBadgeReject(session, badgeId, 'Sign in with a Ryutheme account to use badges.');
  }
  const identityKey = getIdentityKey(session, msg);
  const config = badgeId ? BADGE_CONFIG[badgeId] : null;
  if (!badgeId || !identityKey || !config || !config.passwordEnv) {
    return sendBadgeReject(session, badgeId, 'Badge unlock failed.');
  }
  const expectedPassword = process.env[config.passwordEnv] || '';
  if (!expectedPassword) return sendBadgeReject(session, badgeId, 'Badge is not configured on the server.');
  if (!timingSafeEquals(msg.password, expectedPassword)) return sendBadgeReject(session, badgeId, 'Incorrect badge password.');
  await grantBadgeEntitlement(identityKey, badgeId);
  await approveBadge(room, sessionId, session, badgeId);
}

// dead connection cleanup - runs every 30s
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
    accountId: '',
    profileId: '',
    identityKey: '',
    gameName: '',
    modeName: '',
    gameTag: '',
    activeBadge: '',
    clientId: null,
    lastPong: Date.now()
  };

  room.set(sessionId, session);
  console.log('[relay] connect', sessionId, 'room:', roomId, 'clients:', room.size);

  // native pong handler - update lastPong
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
        gameName: s.gameName || '',
        modeName: s.modeName || '',
        gameTag: s.gameTag || '',
        clientId: s.clientId || null,
        activeBadge: s.activeBadge || ''
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
    Promise.resolve().then(async function() {
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }

    if (PRESENCE_TYPES.has(msg.type) && db.hasDatabase) {
      const authenticated = await authenticateAnonymousAccount(msg.accountId, msg.deviceToken);
      if (authenticated && authenticated.accountId) {
        session.accountId = authenticated.accountId;
        msg.accountId = authenticated.accountId;
      } else {
        session.accountId = '';
        delete msg.accountId;
      }
    }

    // update session state
    if (PRESENCE_TYPES.has(msg.type) && msg.user) {
      session.user = safeUser(msg.user);
      session.clientId = safeClientId(msg.clientId) || null;
      session.profileId = safeProfileId(msg.profileId) || '';
      session.gameName = safeDisplayName(msg.gameName);
      session.modeName = safeDisplayName(msg.modeName);
      session.gameTag = safeDisplayName(msg.gameTag);
      msg.user = session.user;
      msg.clientId = session.clientId;
      if (session.accountId) msg.accountId = session.accountId;
      msg.profileId = session.profileId;
      msg.gameName = session.gameName;
      msg.modeName = session.modeName;
      msg.gameTag = session.gameTag;
      const identityKey = getIdentityKey(session, msg);
      session.identityKey = identityKey;
      const hasActiveBadgeField = Object.prototype.hasOwnProperty.call(msg, 'activeBadge');
      if (hasActiveBadgeField && identityKey) {
        const requestedBadge = safeBadgeId(msg.activeBadge);
        let activeBadge = '';
        if (requestedBadge && canUseServerPerk(session, msg, 'badges')) {
          const config = BADGE_CONFIG[requestedBadge];
          if (config && config.free && !await hasBadgeEntitlement(identityKey, requestedBadge)) {
            await grantBadgeEntitlement(identityKey, requestedBadge);
          }
          if (await hasBadgeEntitlement(identityKey, requestedBadge)) activeBadge = requestedBadge;
        } else {
          const storedActive = await getActiveBadge(identityKey);
          if (storedActive && await hasBadgeEntitlement(identityKey, storedActive)) activeBadge = storedActive;
        }
        await setActiveBadge(identityKey, activeBadge);
        session.activeBadge = activeBadge;
        msg.activeBadge = activeBadge;
      } else {
        const storedActive = identityKey ? await getActiveBadge(identityKey) : '';
        session.activeBadge = storedActive;
        msg.activeBadge = storedActive;
      }
      msg.entitlements = identityKey ? await getBadgeEntitlements(identityKey) : [];
      if (msg.type === 'join') {
        sendTo(session, {
          type: 'badge_result',
          ok: true,
          user: session.user,
          clientId: session.clientId,
          gameName: session.gameName || '',
          gameTag: session.gameTag || '',
          badgeId: msg.activeBadge,
          entitlements: msg.entitlements
        });
      }
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
      await handleBadgeEquip(room, sessionId, session, msg);
      return;
    }

    if (msg.type === 'badge_unlock') {
      await handleBadgeUnlock(room, sessionId, session, msg);
      return;
    }

    if (!BROADCAST_TYPES.has(msg.type) && !TARGETED_TYPES.has(msg.type)) {
      return;
    }

    if ((msg.type === 'voice_state' || msg.type === 'voice_offer' || msg.type === 'voice_answer' || msg.type === 'voice_ice')
      && !canUseServerPerk(session, msg, 'proxVoice')) {
      return;
    }

    if (TARGETED_TYPES.has(msg.type)) {
      const target = findSessionByClientId(room, msg.targetClientId);
      if (!target) return;
      if ((msg.type === 'voice_offer' || msg.type === 'voice_answer' || msg.type === 'voice_ice')
        && !canUseServerPerk(target, null, 'proxVoice')) {
        return;
      }
      sendTo(target, msg);
      return;
    }

    // broadcast known relay messages to the room
    broadcast(room, sessionId, JSON.stringify(msg));
    }).catch(function(err) {
      console.error('[relay] message handler failed', err.message);
    });
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

async function start() {
  try {
    if (db.hasDatabase) {
      await db.ensureSchema();
      console.log('[relay] database schema ready');
    } else {
      console.warn('[relay] DATABASE_URL is not configured yet; anonymous accounts are disabled');
    }
  } catch (err) {
    console.error('[relay] failed to initialize database schema:', err.message);
  }

  server.listen(PORT, function() {
    console.log('[relay] listening on port', PORT);
  });
}

start();
