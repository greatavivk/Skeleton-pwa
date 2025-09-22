# Skeleton PWA

Minimal static PWA shell prepared for Spotify Web Playback SDK + PKCE (no backend).
All files live in the repo root for easy static deploy (e.g., Vercel).

## What’s included
- `index.html` – UI + loads Web Playback SDK
- `auth.js` – PKCE auth (no secret); uses `location.origin` as redirect URI
- `player.js` – basic Web Playback SDK wiring
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

## Notes
- Do not store a Client Secret in this repo. PKCE is secretless on the client.
- If you later use a custom domain, add that exact URL as a Redirect URI in Spotify too.
- Don’t cache `https://sdk.scdn.co/spotify-player.js` in any service worker.
