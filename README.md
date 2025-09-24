# Countdown to Nelusik PWA

A modern, single-page progressive web app that keeps the anticipation for December 19 front and center while offering secure Spotify playback and YouTube video discovery. Everything ships as static assets so you can deploy to any static host (Vercel, Netlify, GitHub Pages, …) in seconds.

## Experience highlights
- **Immersive countdown** – animated hero timer, flip-card digits, progress tracking, motivational prompts, and a calendar that keeps December 19 highlighted.
- **Spotify dashboard** – PKCE authentication, Web Playback SDK device setup, playback controls (play/pause/next/previous/volume), real-time track metadata, search with skeleton loaders, and a recent vibes list stored locally.
- **YouTube studio** – secure API-key entry with masking and forget option, search with embedded playback, playlist builder with clipboard export, full-screen player, viewing history, and autocomplete suggestions powered by your recent queries.
- **Personal sidebar** – quick stats, on-demand weather widget (no API key needed via Open-Meteo), calendar spotlight, and a memory card to keep inspiration nearby.

## File map
- `index.html` – complete UI, navigation, countdown logic, Spotify/YouTube/weather integrations.
- `auth.js` – Spotify PKCE helper (client-side only, no secret).
- `player.js` – Spotify Web Playback SDK bootstrap + helpers.
- `youtube.js` – resilient YouTube Data API helper with timeout handling and runtime API-key storage.
- `manifest.webmanifest` – optional PWA metadata.

## Deploy to Vercel (or any static host)
1. Import this repo into your host of choice as a static project.
2. No build command is required (all assets live in the repo root).
3. Deploy and note the HTTPS origin, e.g. `https://<project>.vercel.app/`.

## Wire up Spotify (required for playback)
1. Create a Spotify Developer application.
2. Add **Redirect URI**: your deployed origin with a trailing slash (e.g. `https://<project>.vercel.app/`).
3. The Nelusik deployment already ships with Client ID `1bc3566e5b8f4ae1bbaafec8950f4c86` in `auth.js`. If you spin up your own Spotify
   application, swap that value for your Client ID before redeploying.
4. Redeploy. When you open the app, click **Log in with Spotify** and approve the scopes. Playback features require a Spotify Premium account.
5. After Spotify redirects you back, the page finishes the login automatically and the **Spotify player** status pill changes to "Connected".
6. Use the search bar to trigger playback on your Web Playback device.

### Troubleshooting Spotify playback
- Premium is mandatory for the Web Playback SDK; free accounts can search but cannot play inside the browser.
- If the status pill stays on "Offline", click **Log in with Spotify** once more so the page can finish storing your token (no code copy/paste required).
- When you tap **Play track** the app now reports precise errors—follow the on-screen hint if it says your session expired or no device is active.
- Spotify sometimes needs an active device: open the Spotify app on your phone or desktop so the browser can hand off playback to that device.

## Enable YouTube search (optional)
1. Create a [YouTube Data API v3](https://console.cloud.google.com/apis/api/youtube.googleapis.com/) key and restrict it to the deployed origin (HTTP referrer restriction recommended).
2. Open the app, expand the **YouTube search** tab, paste the key into the secure field, and click **Connect**. The key is stored locally in `localStorage` only—you can clear it anytime via **Forget key**.
3. Start searching. Results include embedded playback, add-to-playlist controls, and history tracking—all powered by that local key.

> **Security note:** Because this is a static client, API keys and Spotify tokens live in the browser. Use scope and referrer restrictions and rotate keys if they are ever compromised.

## Operational tips
- Avoid storing Spotify Client Secrets here—PKCE is intentionally secretless.
- If you later map a custom domain, add that exact origin to the Spotify app settings and tighten your YouTube API referrer restrictions accordingly.
- The app intentionally avoids caching `https://sdk.scdn.co/spotify-player.js` in any service worker to comply with Spotify’s guidance.
