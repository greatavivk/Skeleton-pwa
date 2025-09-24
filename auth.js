// PKCE auth for a static site (no backend, no secret)
const SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// 👉 USER ACTION LATER: replace with the real Spotify Client ID after creating the Spotify app
const CLIENT_ID = '1bc3566e5b8f4ae1bbaafec8950f4c86';

// Redirect URI automatically matches the deployed origin, e.g. https://<project>.vercel.app/
const REDIRECT_URI = `${location.origin}/`;

// Storage keys
const K = {
  access: 'sp_access',
  exp: 'sp_exp',
  refresh: 'sp_refresh',
  verifier: 'sp_verifier',
  state: 'sp_state'
};
const now = () => Math.floor(Date.now() / 1000);

// Helpers
const b64url = a => btoa(String.fromCharCode(...new Uint8Array(a)))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const sha256 = async (txt) =>
  b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)));

export function getAccessTokenSync() {
  const t = localStorage.getItem(K.access);
  const e = Number(localStorage.getItem(K.exp) || 0);
  return t && now() < e - 30 ? t : null;
}

export async function ensureAuth({ interactive = true } = {}) {
  if (!CLIENT_ID || CLIENT_ID.includes('YOUR_SPOTIFY_CLIENT_ID')) {
    alert('Add your Spotify Client ID in auth.js first.');
    return null;
  }

  // Handle OAuth redirect
  const params = new URLSearchParams(location.search);
  if (params.has('error')) {
    const error = params.get('error');
    const description = params.get('error_description');
    history.replaceState({}, '', REDIRECT_URI);
    throw new Error(description || `Spotify auth error: ${error}`);
  }

  if (params.has('code')) {
    try {
      await handleRedirect(params);
    } finally {
      history.replaceState({}, '', REDIRECT_URI); // clean URL
    }
  }

  const token = getAccessTokenSync();
  if (token) return token;

  const refresh = localStorage.getItem(K.refresh);
  if (refresh) {
    try {
      return await refreshToken(refresh);
    } catch (err) {
      console.error('Spotify token refresh failed', err);
      clearStoredTokens();
    }
  }

  if (!interactive) return null;

  // Start login (PKCE)
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)));
  localStorage.setItem(K.verifier, verifier);
  const challenge = await sha256(verifier);

  const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  localStorage.setItem(K.state, state);

  const auth = new URL('https://accounts.spotify.com/authorize');
  auth.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state
  }).toString();
  location.assign(auth.toString());
  return null;
}

async function handleRedirect(params) {
  const verifier = localStorage.getItem(K.verifier);
  const expectedState = localStorage.getItem(K.state);
  localStorage.removeItem(K.verifier);
  localStorage.removeItem(K.state);
  if (!verifier) throw new Error('Missing PKCE verifier');

  const returnedState = params.get('state');
  if (expectedState && returnedState !== expectedState) {
    throw new Error('Spotify auth state verification failed');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.get('code'),
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body
  });
  if (!res.ok) throw new Error('Token exchange failed');
  const json = await res.json();
  storeTokens(json);
}

async function refreshToken(refresh) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: CLIENT_ID
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body
  });
  if (!res.ok) throw new Error('Refresh failed');
  const json = await res.json();
  storeTokens(json, true);
  return localStorage.getItem(K.access);
}

function storeTokens(json, isRefresh = false) {
  const { access_token, expires_in, refresh_token } = json;
  localStorage.setItem(K.access, access_token);
  localStorage.setItem(K.exp, String(now() + (expires_in || 3600)));
  if (!isRefresh && refresh_token) localStorage.setItem(K.refresh, refresh_token);
}

function clearStoredTokens() {
  Object.values(K).forEach(key => localStorage.removeItem(key));
}
