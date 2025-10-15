// PKCE auth for a static site (no backend, no secret)
const SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

const STORAGE_KEY = 'sp_client_id';
const DEFAULT_CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';

const storage = typeof localStorage !== 'undefined' ? localStorage : null;
const K = { access:'sp_access', exp:'sp_exp', refresh:'sp_refresh', verifier:'sp_verifier' };
let clientId = DEFAULT_CLIENT_ID;

const isPlaceholder = value => !value || value.toUpperCase().includes('YOUR_SPOTIFY_CLIENT_ID');

if (storage) {
  const stored = storage.getItem(STORAGE_KEY);
  if (stored && stored.trim() && !isPlaceholder(stored.trim())) {
    clientId = stored.trim();
  }
}

const clearStoredTokens = () => {
  storage?.removeItem(K.access);
  storage?.removeItem(K.exp);
  storage?.removeItem(K.refresh);
};

export function getClientId() {
  return clientId;
}

export function hasClientId() {
  return !isPlaceholder(clientId);
}

export function configureClientId(nextClientId) {
  const trimmed = (nextClientId || '').trim();
  if (!trimmed) {
    clientId = DEFAULT_CLIENT_ID;
    storage?.removeItem(STORAGE_KEY);
    clearStoredTokens();
    return false;
  }
  if (isPlaceholder(trimmed)) {
    clientId = DEFAULT_CLIENT_ID;
    storage?.removeItem(STORAGE_KEY);
    clearStoredTokens();
    return false;
  }
  const changed = clientId !== trimmed;
  clientId = trimmed;
  storage?.setItem(STORAGE_KEY, clientId);
  if (changed) {
    clearStoredTokens();
  }
  return true;
}

export function clearClientId() {
  configureClientId('');
}

// Redirect URI automatically matches the deployed origin, e.g. https://<project>.vercel.app/
const REDIRECT_URI = `${location.origin}/`;

// Storage keys
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

export async function ensureAuth() {
  if (!hasClientId()) {
    alert('Set your Spotify Client ID first.');
    return;
  }

  const clientId = getClientId();

  // Handle OAuth redirect
  const params = new URLSearchParams(location.search);
  if (params.has('code')) {
    await handleRedirect(params.get('code'));
    history.replaceState({}, '', REDIRECT_URI); // clean URL
  }

  const token = getAccessTokenSync();
  if (token) return token;

  const refresh = localStorage.getItem(K.refresh);
  if (refresh) {
    try { return await refreshToken(refresh); } catch {}
  }

  // Start login (PKCE)
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)));
  localStorage.setItem(K.verifier, verifier);
  const challenge = await sha256(verifier);

  const auth = new URL('https://accounts.spotify.com/authorize');
  auth.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state: b64url(crypto.getRandomValues(new Uint8Array(12)))
  }).toString();
  location.assign(auth.toString());
}

async function handleRedirect(code) {
  const verifier = localStorage.getItem(K.verifier);
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
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
    client_id: clientId
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
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
