# Skeleton PWA

Minimal static PWA shell prepared for Spotify Web Playback SDK + PKCE (no backend).
All files live in the repo root for easy static deploy (e.g., Vercel).

## Features
- Polished glassmorphism UI with profile badge, now-playing card, and responsive layout.
- Shows the signed-in Spotify user (avatar, name, plan) as soon as authentication succeeds.
- Integrated search form to look up tracks and trigger playback on the embedded Web Playback SDK device.
- Playback controls (play, pause) plus live now-playing metadata pulled from player state.
- YouTube video search results and inline playback via the YouTube IFrame Player API.

## What’s included
- `index.html` – Complete UI, styles, Spotify SDK bootstrapper, auth-aware search + playback logic, plus YouTube search/player wiring.
- `auth.js` – PKCE auth (no secret); uses `location.origin` as redirect URI and caches tokens in `localStorage`.
- `player.js` – Web Playback SDK helpers (init, transfer playback, play/pause/resume via Web API).
- `manifest.webmanifest` – Optional PWA metadata.

## Deploy to Vercel
1. Import this GitHub repo into Vercel as a new project.
2. Framework preset: **Other** (static).
3. Build command: *(leave empty)*.
4. Output directory: `/` (repo root).
5. Deploy – you’ll get an HTTPS URL like `https://<project>.vercel.app/`.

## Wire Spotify (user will do this)
1. Create a Spotify Developer app.
2. Add **Redirect URI**: your exact Vercel URL with a trailing slash (e.g., `https://<project>.vercel.app/`).
3. (Optional) Replace the default Client ID in `auth.js` if you use a different Spotify app (this repo ships with `1bc3566e5b8f4ae1bbaafec8950f4c86`).
4. Redeploy (Vercel auto-deploys on push).
5. Open your app → **Log in with Spotify**. Once authenticated the header shows who’s signed in, search for a song, then press play (requires Spotify Premium).

## YouTube search & playback
- The YouTube player and search UI use the provided API key (`AIzaSyB2IQNm_zzPgXZ4L1b00g2p_bJM2FplSzc`). Replace it in `index.html` if you rotate keys or move to your own quota.
- Search results are limited to embeddable videos and play inside the inline IFrame player when you tap the play action.

## Notes
- Do not store a Client Secret in this repo. PKCE is secretless on the client.
- If you later use a custom domain, add that exact URL as a Redirect URI in Spotify too.
- Don’t cache `https://sdk.scdn.co/spotify-player.js` in any service worker.
