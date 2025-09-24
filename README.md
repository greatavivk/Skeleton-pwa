# Skeleton PWA

Minimal static PWA shell prepared for Spotify Web Playback SDK + PKCE (no backend).
All files live in the repo root for easy static deploy (e.g., Vercel).

## What’s included
- `index.html` – UI + loads Web Playback SDK
- `auth.js` – PKCE auth (no secret); uses `location.origin` as redirect URI
- `player.js` – basic Web Playback SDK wiring
- `youtube.js` – front-end helper for YouTube Data API search (no channel ID needed)
- `manifest.webmanifest` – optional PWA metadata

## Deploy to Vercel
1. Import this GitHub repo into Vercel as a new project.
2. Framework preset: **Other** (static).
3. Build command: *(leave empty)*.
4. Output directory: `/` (repo root).
5. Deploy – you’ll get an HTTPS URL like `https://<project>.vercel.app/`.

## Wire Spotify (user will do this)
1. Create a Spotify Developer app.
2. Add **Redirect URI**: your exact Vercel URL with a trailing slash (e.g., `https://<project>.vercel.app/`).
3. Copy the **Client ID** and paste it into `auth.js` (replace `YOUR_SPOTIFY_CLIENT_ID`).
4. Redeploy (Vercel auto-deploys on push).
5. Open your app → **Log in with Spotify** → **Play sample** (must be a user gesture). Requires Spotify Premium.

## Enable YouTube search (optional)
1. Create a [YouTube Data API v3](https://console.cloud.google.com/apis/api/youtube.googleapis.com/) key and restrict it to your deployment origin.
2. Edit `youtube.js` and replace `YOUR_YOUTUBE_API_KEY` with the real key.
3. Redeploy. The YouTube section now lets you search for embeddable videos (opens on youtube.com). No channel ID or live metrics are required.

> **Security note:** keys placed in client-side code are visible to end users. Use a key with strict HTTP referrer restrictions or proxy the requests through a backend if you need to hide it completely.

## Notes
- Do not store a Client Secret in this repo. PKCE is secretless on the client.
- If you later use a custom domain, add that exact URL as a Redirect URI in Spotify too.
- Don’t cache `https://sdk.scdn.co/spotify-player.js` in any service worker.
