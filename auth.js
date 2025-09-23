// PKCE auth for a static site (no backend, no secret)
const SCOPES = [
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// 👉 USER ACTION LATER: replace with the real Spotify Client ID after creating the Spotify app.
// The value is loaded from config.js (ignored by git) when available.
let CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
let GOOGLE_API_KEY = '';
let configPromise;

async function loadConfig() {
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const mod = await import('./config.js');
        const candidates = [mod, mod.default, mod.config].filter(Boolean);
        for (const candidate of candidates) {
          if (typeof candidate.spotifyClientId === 'string' && candidate.spotifyClientId.trim()) {
            CLIENT_ID = candidate.spotifyClientId.trim();
          }
          if (typeof candidate.googleApiKey === 'string' && candidate.googleApiKey.trim()) {
            GOOGLE_API_KEY = candidate.googleApiKey.trim();
          }
        }
      } catch (error) {
        console.warn('Optional config.js not found; using placeholder values for secrets.', error);
      }
    })();
  }
  return configPromise;
}

export async function getGoogleApiKey() {
  await loadConfig();
  return GOOGLE_API_KEY;
}

// Redirect URI automatically matches the deployed origin, e.g. https://<project>.vercel.app/
const REDIRECT_URI = `${location.origin}/`;

// Storage keys
const K = { access:'sp_access', exp:'sp_exp', refresh:'sp_refresh', verifier:'sp_verifier' };
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
  await loadConfig();
  if (!CLIENT_ID || CLIENT_ID.includes('YOUR_SPOTIFY_CLIENT_ID')) {
    alert('Add your Spotify Client ID in config.js first (see config.example.js).');
    return;
  }

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
    client_id: CLIENT_ID,
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
  await loadConfig();
  const verifier = localStorage.getItem(K.verifier);
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
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
  await loadConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: CLIENT_ID
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
