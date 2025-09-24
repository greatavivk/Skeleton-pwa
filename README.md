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
3. Paste the **Client ID** into `auth.js` replacing `YOUR_SPOTIFY_CLIENT_ID`.
4. Redeploy. When you open the app, click **Log in with Spotify** and approve the scopes. Playback features require a Spotify Premium account.
5. Use the search bar to trigger playback on your Web Playback device.

## Enable YouTube search (optional)
1. Create a [YouTube Data API v3](https://console.cloud.google.com/apis/api/youtube.googleapis.com/) key and restrict it to the deployed origin (HTTP referrer restriction recommended).
2. Open the app, expand the **YouTube search** tab, paste the key into the secure field, and click **Connect**. The key is stored locally in `localStorage` only—you can clear it anytime via **Forget key**.
3. Start searching. Results include embedded playback, add-to-playlist controls, and history tracking—all powered by that local key.

> **Security note:** Because this is a static client, API keys and Spotify tokens live in the browser. Use scope and referrer restrictions and rotate keys if they are ever compromised.

## Operational tips
- Avoid storing Spotify Client Secrets here—PKCE is intentionally secretless.
- If you later map a custom domain, add that exact origin to the Spotify app settings and tighten your YouTube API referrer restrictions accordingly.
- The app intentionally avoids caching `https://sdk.scdn.co/spotify-player.js` in any service worker to comply with Spotify’s guidance.
