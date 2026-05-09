(function () {
  'use strict';

  const RELAY_HTTP_BASE = 'https://ryutheme-relay-production.up.railway.app';
  const AUTH_STORAGE_KEY = 'ryuGoogleAuth';

  function getConfiguredGoogleClientId() {
    const oauth2 = chrome.runtime.getManifest().oauth2 || {};
    const clientId = String(oauth2.client_id || '').trim();
    if (!clientId || clientId.indexOf('YOUR_GOOGLE') === 0) return '';
    return clientId;
  }

  function getStoredAuthState() {
    return chrome.storage.local.get([AUTH_STORAGE_KEY]).then(function(result) {
      return sanitizeAuthState(result[AUTH_STORAGE_KEY] || null);
    });
  }

  function sanitizeAuthState(value) {
    const state = value && typeof value === 'object' ? value : {};
    const accountId = String(state.accountId || '').trim();
    const deviceToken = String(state.deviceToken || '').trim();
    const provider = String(state.provider || '').trim();
    if (!/^acc_[a-f0-9]{24}$/i.test(accountId) || !/^dt_[a-f0-9]{48}$/i.test(deviceToken) || provider !== 'google') {
      return { signedIn: false, provider: '', accountId: '', deviceToken: '', email: '', name: '', picture: '', googleSub: '', displayName: '' };
    }
    return {
      signedIn: true,
      provider: 'google',
      accountId: accountId,
      deviceToken: deviceToken,
      email: String(state.email || '').trim(),
      name: String(state.name || '').trim(),
      picture: String(state.picture || '').trim(),
      googleSub: String(state.googleSub || '').trim(),
      displayName: String(state.displayName || '').trim()
    };
  }

  function storeAuthState(state) {
    return chrome.storage.local.set({ [AUTH_STORAGE_KEY]: sanitizeAuthState(state) });
  }

  function clearAuthState() {
    return chrome.storage.local.remove([AUTH_STORAGE_KEY]);
  }

  async function getGoogleAccessTokenViaWebFlow() {
    const clientId = getConfiguredGoogleClientId();
    if (!clientId) {
      throw new Error('Google OAuth client ID is not configured in the extension manifest.');
    }
    const redirectUrl = chrome.identity.getRedirectURL();
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('prompt', 'select_account');
    const resultUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });
    if (!resultUrl) throw new Error('Google sign-in was cancelled.');
    const params = new URLSearchParams(new URL(resultUrl).hash.slice(1));
    const token = params.get('access_token');
    if (!token) throw new Error('Google sign-in did not return an access token.');
    return token;
  }

  async function clearGoogleTokenCache() {
    try {
      const result = await chrome.identity.getAuthToken({ interactive: false, scopes: ['openid', 'email', 'profile'] });
      const token = result && typeof result === 'object' ? result.token : result;
      if (token) {
        try { await chrome.identity.removeCachedAuthToken({ token: token }); } catch (_) {}
      }
    } catch (_) {}
    try { await chrome.identity.clearAllCachedAuthTokens(); } catch (_) {}
  }

  async function signInWithGoogle() {
    const accessToken = await getGoogleAccessTokenViaWebFlow();
    const response = await fetch(RELAY_HTTP_BASE + '/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: accessToken })
    });
    const data = await response.json().catch(function() { return null; });
    if (!response.ok || !data || !data.ok) {
      throw new Error((data && data.error) || ('Google sign-in failed with status ' + response.status));
    }

    const nextState = sanitizeAuthState({
      signedIn: true,
      provider: 'google',
      accountId: data.accountId,
      deviceToken: data.deviceToken,
      email: data.email,
      name: data.name,
      picture: data.picture,
      googleSub: data.googleSub,
      displayName: data.displayName || ''
    });
    await storeAuthState(nextState);
    return nextState;
  }

  async function setDisplayName(accountId, deviceToken, displayName) {
    const response = await fetch(RELAY_HTTP_BASE + '/account/name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, deviceToken, displayName })
    });
    const data = await response.json().catch(function() { return null; });
    if (!response.ok || !data || !data.ok) {
      throw new Error((data && data.error) || 'Failed to set display name.');
    }
    return String(data.displayName || '').trim();
  }

  async function signOut() {
    await clearGoogleTokenCache();
    await clearAuthState();
    return sanitizeAuthState(null);
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!message || message.channel !== 'ryu_auth') return;

    (async function() {
      if (message.action === 'get_state') {
        return getStoredAuthState();
      }
      if (message.action === 'google_sign_in') {
        return signInWithGoogle();
      }
      if (message.action === 'sign_out') {
        return signOut();
      }
      if (message.action === 'set_display_name') {
        return getStoredAuthState().then(async function(state) {
          if (!state || !state.signedIn || !state.accountId || !state.deviceToken) {
            throw new Error('Not signed in.');
          }
          const name = String((message.payload && message.payload.displayName) || '').trim();
          const displayName = await setDisplayName(state.accountId, state.deviceToken, name);
          const nextState = sanitizeAuthState(Object.assign({}, state, { displayName }));
          await storeAuthState(nextState);
          return nextState;
        });
      }
      throw new Error('Unknown auth action.');
    })().then(function(result) {
      sendResponse({ ok: true, result: result });
    }).catch(function(err) {
      sendResponse({ ok: false, error: err && err.message ? err.message : 'Unknown auth error.' });
    });

    return true;
  });
})();
