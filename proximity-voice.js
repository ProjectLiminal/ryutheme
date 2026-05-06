(function () {
  'use strict';

  const STORAGE_KEY = 'ryuTheme';
  const STYLE_ID = 'ryu-proximity-voice-style';
  const HUD_ID = 'ryu-proximity-voice-hud';
  const SETTINGS_POLL_MS = 500;
  const TARGET_TICK_MS = 120;
  const SIGNAL_INTERVAL_MS = 2000;
  const REMOTE_STATE_TTL_MS = 7000;
  const CONNECT_GRACE_MS = 1500;
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ];

  let _settingsSig = '';
  let _lastVoiceStateSig = '';
  let _lastVoiceStateAt = 0;
  let _settingsTimer = null;
  let _targetTimer = null;
  let _relayUnsubscribe = null;
  let _audioUnlockBound = false;
  let _audioContext = null;
  let _localStream = null;
  let _localStreamPromise = null;
  let _deviceRefreshPromise = null;
  let _deviceAccessGranted = false;

  const _remoteVoiceStates = new Map();
  const _peerStates = new Map();
  const _deviceCache = {
    input: [{ value: 'default', label: 'Default Input' }],
    output: [{ value: 'default', label: 'Default Output' }],
    outputSupported: false,
    refreshedAt: 0
  };

  function loadTheme() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { return {}; }
  }

  function saveThemeKey(key, value) {
    const next = loadTheme();
    next[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function showToast(message, type) {
    if (globalThis.__ryuShowToast) globalThis.__ryuShowToast(message, type || 'success');
  }

  function getSettings() {
    const theme = loadTheme();
    const nearRadius = clamp(Number(theme.proximityVoiceNearRadius || 1400), 400, 4000);
    const farRadius = clamp(Number(theme.proximityVoiceFarRadius || 5200), nearRadius + 200, 9000);
    return {
      enabled: !theme.useDefault && !!theme.proximityVoiceOn,
      micMuted: !!theme.proximityVoiceMicMuted,
      volume: clamp(Number(theme.proximityVoiceVolume == null ? 100 : theme.proximityVoiceVolume), 0, 100) / 100,
      nearRadius: nearRadius,
      farRadius: farRadius,
      inputDeviceId: String(theme.proximityVoiceInputDeviceId || 'default'),
      outputDeviceId: String(theme.proximityVoiceOutputDeviceId || 'default')
    };
  }

  function getOwnClientId() {
    return String(globalThis.__ryuClientId || '');
  }

  function getCurrentRoom() {
    const room = globalThis.__ryuGetRoom ? globalThis.__ryuGetRoom() : '';
    return String(room || '').trim();
  }

  function getOwnGameName() {
    try {
      const Be = globalThis.__Be;
      const candidates = [
        Be && Be._6988,
        Be && Be._1059 && Be._1059._6988,
        globalThis.__ryuGetUsername && globalThis.__ryuGetUsername()
      ];
      for (let i = 0; i < candidates.length; i++) {
        const name = String(candidates[i] || '').trim();
        if (name) return name;
      }
    } catch (_) {}
    return '';
  }

  function getAudioContext() {
    if (_audioContext) return _audioContext;
    const AudioCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtor) return null;
    _audioContext = new AudioCtor();
    bindAudioUnlock();
    return _audioContext;
  }

  function bindAudioUnlock() {
    if (_audioUnlockBound) return;
    _audioUnlockBound = true;
    const unlock = function () {
      if (_audioContext && _audioContext.state === 'suspended') {
        _audioContext.resume().catch(function () {});
      }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (eventName) {
      window.addEventListener(eventName, unlock, { passive: true });
    });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '#' + HUD_ID + '{position:fixed;left:50%;bottom:52px;transform:translateX(-50%);z-index:100000;' +
      'display:none;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;' +
      'background:rgba(9,13,18,0.88);border:1px solid rgba(255,255,255,0.12);' +
      'box-shadow:0 10px 28px rgba(0,0,0,0.28);font-family:"Noto Sans",sans-serif;' +
      'font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;' +
      'color:rgba(255,255,255,0.92);pointer-events:none}' +
      '#' + HUD_ID + ' .ryu-vc-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 12px rgba(74,222,128,0.45)}' +
      '#' + HUD_ID + ' .ryu-vc-mic-muted{display:none;font-size:12px;line-height:1;color:#ef4444;filter:drop-shadow(0 0 8px rgba(239,68,68,0.3))}' +
      '#' + HUD_ID + '.ryu-vc-muted .ryu-vc-dot{background:#f59e0b;box-shadow:0 0 12px rgba(245,158,11,0.4)}' +
      '#' + HUD_ID + '.ryu-vc-muted .ryu-vc-mic-muted{display:block}' +
      '#' + HUD_ID + '.ryu-vc-off .ryu-vc-dot{background:#ef4444;box-shadow:0 0 12px rgba(239,68,68,0.35)}';
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureHud() {
    ensureStyle();
    let hud = document.getElementById(HUD_ID);
    if (hud) return hud;
    hud = document.createElement('div');
    hud.id = HUD_ID;
    hud.innerHTML = '<div class="ryu-vc-dot"></div><div class="ryu-vc-text">Voice Off</div><div class="ryu-vc-mic-muted">🎙̸</div>';
    document.body.appendChild(hud);
    return hud;
  }

  function positionHud() {
    const hud = ensureHud();
    const splitEl = document.getElementById('ryu-split-counter');
    if (splitEl && splitEl.style.display !== 'none') {
      const rect = splitEl.getBoundingClientRect();
      const bottom = Math.max(52, Math.round(window.innerHeight - rect.top + 8));
      hud.style.bottom = bottom + 'px';
      return;
    }
    hud.style.bottom = '52px';
  }

  function updateHud() {
    const settings = getSettings();
    const hud = ensureHud();
    const connectedPeers = Array.from(_peerStates.values()).filter(function (peerState) {
      return !!peerState.connected;
    }).length;
    const text = !settings.enabled
      ? 'Voice Off'
      : settings.micMuted
        ? ('Voice Muted' + (connectedPeers ? ' ' + connectedPeers : ''))
        : ('Voice ' + connectedPeers);
    hud.querySelector('.ryu-vc-text').textContent = text;
    hud.classList.toggle('ryu-vc-muted', settings.enabled && settings.micMuted);
    hud.classList.toggle('ryu-vc-off', !settings.enabled);
    hud.style.display = settings.enabled || connectedPeers ? 'inline-flex' : 'none';
    positionHud();
  }

  function buildVisiblePlayerGroups() {
    const ne = globalThis.__ne;
    if (!ne || !ne._2430 || typeof ne._2430.values !== 'function') return [];
    const groups = new Map();
    for (const cell of ne._2430.values()) {
      if (!cell || cell._9491) continue;
      const player = cell._2182 && cell._2182._1059;
      if (!player) continue;
      let group = groups.get(player);
      if (!group) {
        group = {
          name: String(player._6988 || cell._6988 || '').trim(),
          own: !!player._9710,
          totalWeight: 0,
          totalMass: 0,
          weightedX: 0,
          weightedY: 0
        };
        groups.set(player, group);
      }
      const weight = Math.max(1, Number(cell._7906 || cell._1904 || 1));
      group.totalWeight += weight;
      group.totalMass += Math.max(0, Number(cell._7906 || 0));
      group.weightedX += Number(cell._7847 || 0) * weight;
      group.weightedY += Number(cell._9202 || 0) * weight;
      if (!group.name) group.name = String(player._6988 || cell._6988 || '').trim();
      if (player._9710) group.own = true;
    }
    return Array.from(groups.values()).map(function (group) {
      const weight = group.totalWeight || 1;
      return {
        name: group.name,
        own: !!group.own,
        mass: group.totalMass,
        x: group.weightedX / weight,
        y: group.weightedY / weight
      };
    }).filter(function (group) {
      return group.own || !!group.name;
    });
  }

  function getOwnPlayerGroup() {
    const players = buildVisiblePlayerGroups();
    for (let i = 0; i < players.length; i++) {
      if (players[i].own) return players[i];
    }
    return null;
  }

  function buildRemoteNameIndex(room) {
    const uniqueByName = new Map();
    const duplicateNames = new Set();
    _remoteVoiceStates.forEach(function (remote, clientId) {
      if (!remote || !remote.enabled) return;
      if (remote.room !== room) return;
      if (Date.now() - remote.updatedAt > REMOTE_STATE_TTL_MS) return;
      const nameKey = normalizeName(remote.gameName);
      if (!nameKey) return;
      if (duplicateNames.has(nameKey)) return;
      if (uniqueByName.has(nameKey)) {
        uniqueByName.delete(nameKey);
        duplicateNames.add(nameKey);
        return;
      }
      uniqueByName.set(nameKey, clientId);
    });
    return uniqueByName;
  }

  function computeDistance(a, b) {
    const dx = Number(a.x || 0) - Number(b.x || 0);
    const dy = Number(a.y || 0) - Number(b.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getProximityTargets(settings) {
    const room = getCurrentRoom();
    const own = getOwnPlayerGroup();
    if (!room || !own) return [];
    const remoteNameIndex = buildRemoteNameIndex(room);
    const players = buildVisiblePlayerGroups();
    const targets = [];
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (!player || player.own) continue;
      const clientId = remoteNameIndex.get(normalizeName(player.name));
      if (!clientId || clientId === getOwnClientId()) continue;
      const distance = computeDistance(own, player);
      if (distance > settings.farRadius * 1.35) continue;
      targets.push({
        clientId: clientId,
        distance: distance,
        dx: player.x - own.x
      });
    }
    return targets;
  }

  async function refreshDeviceCache() {
    if (_deviceRefreshPromise) return _deviceRefreshPromise;
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return _deviceCache;
    _deviceRefreshPromise = navigator.mediaDevices.enumerateDevices().then(function (devices) {
      const inputs = [{ value: 'default', label: 'Default Input' }];
      const outputs = [{ value: 'default', label: 'Default Output' }];
      let outputSupported = false;
      devices.forEach(function (device, idx) {
        const label = String(device.label || '').trim() || (
          device.kind === 'audioinput' ? ('Microphone ' + (inputs.length)) :
          device.kind === 'audiooutput' ? ('Speaker ' + (outputs.length)) :
          ('Device ' + idx)
        );
        if (device.kind === 'audioinput') {
          inputs.push({ value: device.deviceId, label: label });
        } else if (device.kind === 'audiooutput') {
          outputs.push({ value: device.deviceId, label: label });
          outputSupported = true;
        }
      });
      _deviceCache.input = inputs;
      _deviceCache.output = outputs;
      _deviceCache.outputSupported = outputSupported;
      _deviceCache.refreshedAt = Date.now();
      return _deviceCache;
    }).catch(function () {
      return _deviceCache;
    }).finally(function () {
      _deviceRefreshPromise = null;
    });
    return _deviceRefreshPromise;
  }

  function getDeviceOptionsSnapshot(kind) {
    const list = kind === 'input' ? _deviceCache.input : _deviceCache.output;
    return list.map(function (item) {
      return { value: item.value, label: item.label };
    });
  }

  function relaySend(payload, useDirect) {
    if (!globalThis.__ryuRelaySendMessage) return false;
    return !!globalThis.__ryuRelaySendMessage(payload, !!useDirect);
  }

  function buildSignalPayload(type, extra) {
    return Object.assign({
      type: type,
      room: getCurrentRoom(),
      gameName: getOwnGameName()
    }, extra || {});
  }

  function sendVoiceState(force) {
    const settings = getSettings();
    const room = getCurrentRoom();
    if (!room || !globalThis.__ryuRelayReady) return;
    const sig = [
      settings.enabled ? 1 : 0,
      settings.micMuted ? 1 : 0,
      room,
      getOwnGameName(),
      !!_localStream,
      settings.inputDeviceId,
      settings.outputDeviceId
    ].join('|');
    const now = Date.now();
    if (!force && sig === _lastVoiceStateSig && now - _lastVoiceStateAt < SIGNAL_INTERVAL_MS) return;
    _lastVoiceStateSig = sig;
    _lastVoiceStateAt = now;
    relaySend(buildSignalPayload('voice_state', {
      enabled: settings.enabled,
      micMuted: settings.micMuted,
      canSpeak: !!_localStream
    }));
  }

  function getPeerState(clientId) {
    return _peerStates.get(clientId) || null;
  }

  function createAudioElement() {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.playsInline = true;
    audio.muted = false;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    return audio;
  }

  async function applyOutputDevice(audio) {
    if (!audio || typeof audio.setSinkId !== 'function') return;
    const outputDeviceId = getSettings().outputDeviceId;
    try {
      await audio.setSinkId(outputDeviceId === 'default' ? '' : outputDeviceId);
    } catch (err) {
      console.warn('[RyuVoice] sink selection failed', err);
    }
  }

  function teardownRemoteAudio(peerState) {
    if (!peerState || !peerState.audio) return;
    ['source', 'gain', 'lowpass', 'panner', 'destination'].forEach(function (key) {
      try {
        if (peerState.audio[key] && typeof peerState.audio[key].disconnect === 'function') {
          peerState.audio[key].disconnect();
        }
      } catch (_) {}
    });
    try {
      if (peerState.audio.audioEl) {
        peerState.audio.audioEl.pause();
        peerState.audio.audioEl.srcObject = null;
        if (peerState.audio.audioEl.parentNode) peerState.audio.audioEl.parentNode.removeChild(peerState.audio.audioEl);
      }
    } catch (_) {}
    peerState.audio = null;
  }

  async function ensureRemoteAudio(peerState, stream) {
    const ctx = getAudioContext();
    if (!ctx || !stream) return;
    if (peerState.audio && peerState.audio.stream === stream) return;
    teardownRemoteAudio(peerState);
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    const destination = ctx.createMediaStreamDestination();
    const audioEl = createAudioElement();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 18000;
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(lowpass);
    if (panner) {
      lowpass.connect(panner);
      panner.connect(destination);
    } else {
      lowpass.connect(destination);
    }
    audioEl.srcObject = destination.stream;
    await applyOutputDevice(audioEl);
    try { await audioEl.play(); } catch (_) {}
    peerState.audio = {
      stream: stream,
      source: source,
      gain: gain,
      lowpass: lowpass,
      panner: panner,
      destination: destination,
      audioEl: audioEl
    };
  }

  function attachLocalAudio(peerState) {
    if (!peerState || !peerState.pc) return false;
    const tracks = _localStream ? _localStream.getAudioTracks() : [];
    if (tracks.length) {
      if (!peerState.audioSender) {
        try {
          peerState.audioSender = peerState.pc.addTrack(tracks[0], _localStream);
          return true;
        } catch (_) {}
      }
      return false;
    }
    if (!peerState.audioSender) {
      try { peerState.pc.addTransceiver('audio', { direction: 'recvonly' }); } catch (_) {}
    }
    return false;
  }

  async function sendOffer(peerState) {
    if (!peerState || !peerState.pc || peerState.closed) return;
    try {
      peerState.makingOffer = true;
      const offer = await peerState.pc.createOffer();
      await peerState.pc.setLocalDescription(offer);
      relaySend(buildSignalPayload('voice_offer', {
        targetClientId: peerState.clientId,
        sdp: peerState.pc.localDescription
      }), true);
    } catch (err) {
      console.warn('[RyuVoice] offer failed', err);
    } finally {
      peerState.makingOffer = false;
    }
  }

  function closePeer(clientId) {
    const peerState = getPeerState(clientId);
    if (!peerState) return;
    peerState.closed = true;
    teardownRemoteAudio(peerState);
    try { if (peerState.pc) peerState.pc.close(); } catch (_) {}
    _peerStates.delete(clientId);
    updateHud();
  }

  function createPeer(clientId, initiator) {
    const existing = getPeerState(clientId);
    if (existing && !existing.closed) return existing;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const peerState = {
      clientId: clientId,
      pc: pc,
      initiator: !!initiator,
      connected: false,
      closed: false,
      makingOffer: false,
      audioSender: null,
      audio: null,
      distance: Infinity,
      dx: 0,
      closeAfter: 0
    };
    _peerStates.set(clientId, peerState);
    attachLocalAudio(peerState);
    pc.onicecandidate = function (event) {
      if (!event.candidate) return;
      relaySend(buildSignalPayload('voice_ice', {
        targetClientId: clientId,
        candidate: event.candidate
      }), true);
    };
    pc.ontrack = function (event) {
      const stream = event.streams && event.streams[0]
        ? event.streams[0]
        : new MediaStream(event.track ? [event.track] : []);
      ensureRemoteAudio(peerState, stream);
    };
    pc.onconnectionstatechange = function () {
      peerState.connected = pc.connectionState === 'connected';
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeer(clientId);
      } else if (pc.connectionState === 'disconnected') {
        peerState.closeAfter = Date.now() + 4000;
      }
      updateHud();
    };
    if (initiator) setTimeout(function () { sendOffer(peerState); }, 0);
    updateHud();
    return peerState;
  }

  async function handleVoiceOffer(msg) {
    const clientId = String(msg.clientId || '');
    if (!clientId || clientId === getOwnClientId()) return;
    const peerState = createPeer(clientId, false);
    try {
      await peerState.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await peerState.pc.createAnswer();
      await peerState.pc.setLocalDescription(answer);
      relaySend(buildSignalPayload('voice_answer', {
        targetClientId: clientId,
        sdp: peerState.pc.localDescription
      }), true);
    } catch (err) {
      console.warn('[RyuVoice] answer failed', err);
      closePeer(clientId);
    }
  }

  async function handleVoiceAnswer(msg) {
    const clientId = String(msg.clientId || '');
    const peerState = getPeerState(clientId);
    if (!peerState || !peerState.pc) return;
    try {
      await peerState.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    } catch (err) {
      console.warn('[RyuVoice] remote answer failed', err);
      closePeer(clientId);
    }
  }

  async function handleVoiceIce(msg) {
    const clientId = String(msg.clientId || '');
    const peerState = getPeerState(clientId);
    if (!peerState || !peerState.pc || !msg.candidate) return;
    try {
      await peerState.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
    } catch (err) {
      console.warn('[RyuVoice] ice failed', err);
    }
  }

  function closeAllPeers() {
    Array.from(_peerStates.keys()).forEach(closePeer);
  }

  function cleanupRemoteState(clientId) {
    _remoteVoiceStates.delete(clientId);
    closePeer(clientId);
  }

  function applyMicMute() {
    const settings = getSettings();
    if (_localStream) {
      _localStream.getAudioTracks().forEach(function (track) {
        track.enabled = !settings.micMuted;
      });
    }
    updateHud();
  }

  function buildUserMediaAudioConstraints() {
    const settings = getSettings();
    const audio = {
      channelCount: 1,
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false
    };
    if (settings.inputDeviceId && settings.inputDeviceId !== 'default') {
      audio.deviceId = { exact: settings.inputDeviceId };
    }
    return { audio: audio };
  }

  async function requestDeviceAccess(showSuccessToast, showErrorToast) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Your browser does not support microphone capture here.', 'error');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(buildUserMediaAudioConstraints());
      _deviceAccessGranted = true;
      releaseLocalStream();
      _localStream = stream;
      applyMicMute();
      await refreshDeviceCache();
      if (showSuccessToast) showToast('Microphone access granted.', 'success');
      _peerStates.forEach(function (peerState) {
        if (attachLocalAudio(peerState)) sendOffer(peerState);
      });
      sendVoiceState(true);
      return true;
    } catch (err) {
      console.warn('[RyuVoice] microphone unavailable', err);
      if (showErrorToast !== false) showToast('Microphone access was blocked or no device was available.', 'error');
      return false;
    }
  }

  async function ensureLocalStream() {
    if (_localStream) {
      applyMicMute();
      return _localStream;
    }
    if (_localStreamPromise) return _localStreamPromise;
    _localStreamPromise = requestDeviceAccess(false, false).then(function (ok) {
      return ok ? _localStream : null;
    }).finally(function () {
      _localStreamPromise = null;
      sendVoiceState(true);
    });
    return _localStreamPromise;
  }

  function releaseLocalStream() {
    if (!_localStream) return;
    _localStream.getTracks().forEach(function (track) {
      try { track.stop(); } catch (_) {}
    });
    _localStream = null;
  }

  async function refreshAllOutputDevices() {
    const tasks = [];
    _peerStates.forEach(function (peerState) {
      if (peerState.audio && peerState.audio.audioEl) {
        tasks.push(applyOutputDevice(peerState.audio.audioEl));
      }
    });
    await Promise.all(tasks);
  }

  function refreshPeerAudio() {
    const settings = getSettings();
    _peerStates.forEach(function (peerState) {
      if (!peerState.audio) return;
      const normalized = clamp((peerState.distance - settings.nearRadius) / Math.max(1, settings.farRadius - settings.nearRadius), 0, 1);
      const gainValue = settings.volume * Math.pow(1 - normalized, 1.6);
      const lowpassHz = 18000 - normalized * 14500;
      const panValue = clamp(peerState.dx / Math.max(1, settings.farRadius), -0.55, 0.55);
      peerState.audio.gain.gain.value = gainValue;
      peerState.audio.lowpass.frequency.value = clamp(lowpassHz, 3200, 18000);
      if (peerState.audio.panner) peerState.audio.panner.pan.value = panValue;
    });
  }

  function reconcileTargets() {
    const settings = getSettings();
    if (!settings.enabled || !globalThis.__ryuRelayReady || !getCurrentRoom()) {
      closeAllPeers();
      updateHud();
      return;
    }
    const targets = getProximityTargets(settings);
    const seen = new Set();
    targets.forEach(function (target) {
      seen.add(target.clientId);
      let peerState = getPeerState(target.clientId);
      if (!peerState) {
        peerState = createPeer(target.clientId, getOwnClientId() < target.clientId);
      }
      peerState.distance = target.distance;
      peerState.dx = target.dx;
      peerState.closeAfter = target.distance > settings.farRadius ? (Date.now() + CONNECT_GRACE_MS) : 0;
    });
    _peerStates.forEach(function (peerState, clientId) {
      if (!seen.has(clientId) && !peerState.closeAfter) {
        peerState.closeAfter = Date.now() + CONNECT_GRACE_MS;
      }
      if (peerState.closeAfter && Date.now() >= peerState.closeAfter) closePeer(clientId);
    });
    refreshPeerAudio();
    updateHud();
  }

  function pruneRemoteVoiceStates() {
    const now = Date.now();
    _remoteVoiceStates.forEach(function (remote, clientId) {
      if (!remote || now - remote.updatedAt > REMOTE_STATE_TTL_MS) cleanupRemoteState(clientId);
    });
  }

  function onRelayMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'leave' && msg.clientId) {
      cleanupRemoteState(String(msg.clientId));
      return;
    }
    if (String(msg.clientId || '') === getOwnClientId()) return;
    if (msg.type === 'voice_state') {
      _remoteVoiceStates.set(String(msg.clientId), {
        clientId: String(msg.clientId),
        room: String(msg.room || ''),
        gameName: String(msg.gameName || ''),
        enabled: !!msg.enabled,
        micMuted: !!msg.micMuted,
        canSpeak: !!msg.canSpeak,
        updatedAt: Date.now()
      });
      if (!msg.enabled) closePeer(String(msg.clientId));
      return;
    }
    if (String(msg.targetClientId || '') !== getOwnClientId()) return;
    if (msg.room && msg.room !== getCurrentRoom()) return;
    if (msg.type === 'voice_offer' && msg.sdp) {
      handleVoiceOffer(msg);
      return;
    }
    if (msg.type === 'voice_answer' && msg.sdp) {
      handleVoiceAnswer(msg);
      return;
    }
    if (msg.type === 'voice_ice' && msg.candidate) {
      handleVoiceIce(msg);
    }
  }

  async function refreshSettings(force) {
    const settings = getSettings();
    const sig = JSON.stringify(settings);
    if (sig === _settingsSig && !force) return;
    _settingsSig = sig;
    await refreshDeviceCache();
    if (settings.enabled) {
      getAudioContext();
      await ensureLocalStream();
      applyMicMute();
      await refreshAllOutputDevices();
      _peerStates.forEach(function (peerState) {
        if (attachLocalAudio(peerState)) sendOffer(peerState);
      });
    } else {
      releaseLocalStream();
      closeAllPeers();
    }
    sendVoiceState(true);
    updateHud();
  }

  function initRelaySubscription() {
    if (_relayUnsubscribe || !globalThis.__ryuRelaySubscribe) return;
    _relayUnsubscribe = globalThis.__ryuRelaySubscribe(onRelayMessage);
  }

  function startLoops() {
    if (!_settingsTimer) {
      _settingsTimer = setInterval(function () {
        refreshSettings(false);
        pruneRemoteVoiceStates();
        sendVoiceState(false);
      }, SETTINGS_POLL_MS);
    }
    if (!_targetTimer) {
      _targetTimer = setInterval(function () {
        reconcileTargets();
      }, TARGET_TICK_MS);
    }
  }

  function init() {
    ensureHud();
    initRelaySubscription();
    startLoops();
    refreshDeviceCache();
    refreshSettings(true);
    updateHud();
  }

  globalThis.__ryuVoiceRefreshSettings = function () {
    refreshSettings(true);
  };
  globalThis.__ryuVoiceRequestDeviceAccess = function () {
    return requestDeviceAccess(true, true);
  };
  globalThis.__ryuVoiceRefreshDevices = function () {
    return refreshDeviceCache().then(function () {
      showToast('Voice device list refreshed.', 'success');
      return {
        input: getDeviceOptionsSnapshot('input'),
        output: getDeviceOptionsSnapshot('output'),
        outputSupported: _deviceCache.outputSupported
      };
    });
  };
  globalThis.__ryuVoiceGetDeviceOptions = function () {
    return {
      input: getDeviceOptionsSnapshot('input'),
      output: getDeviceOptionsSnapshot('output'),
      outputSupported: _deviceCache.outputSupported,
      accessGranted: _deviceAccessGranted
    };
  };
  globalThis.__ryuVoiceSetInputDevice = function (deviceId) {
    saveThemeKey('proximityVoiceInputDeviceId', deviceId || 'default');
    releaseLocalStream();
    refreshSettings(true);
  };
  globalThis.__ryuVoiceSetOutputDevice = function (deviceId) {
    saveThemeKey('proximityVoiceOutputDeviceId', deviceId || 'default');
    refreshAllOutputDevices();
    refreshSettings(true);
  };
  globalThis.__ryuVoiceToggleMute = function () {
    const next = !getSettings().micMuted;
    saveThemeKey('proximityVoiceMicMuted', next);
    applyMicMute();
    sendVoiceState(true);
    refreshSettings(true);
    return next;
  };

  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', function () {
      refreshDeviceCache();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
