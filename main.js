const statusEl = document.getElementById('status');
const loginBtn = document.getElementById('login');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const nowEl = document.getElementById('now');

const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };
const disableControls = () => {
  if (loginBtn) loginBtn.disabled = true;
  if (playBtn) playBtn.disabled = true;
  if (pauseBtn) pauseBtn.disabled = true;
};

(async () => {
  let ensureAuth;
  let getAccessTokenSync;
  let initPlayer;
  let startPlayback;
  let pausePlayback;

  try {
    const authModule = await import('./auth.js');
    const playerModule = await import('./player.js');
    ensureAuth = authModule.ensureAuth;
    getAccessTokenSync = authModule.getAccessTokenSync;
    initPlayer = playerModule.initPlayer;
    startPlayback = playerModule.startPlayback;
    pausePlayback = playerModule.pause;
  } catch (error) {
    console.error('Failed to load app modules', error);
    setStatus('The app failed to load. Fix the errors in auth.js/player.js and reload.');
    disableControls();
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = false;
    loginBtn.addEventListener('click', async () => {
      try {
        await ensureAuth();
      } catch (error) {
        console.error('Spotify authentication failed', error);
        setStatus('Spotify login failed. See console for details.');
      }
    });
  }

  let activeDeviceId = null;
  let activePlayer = null;

  window.onSpotifyWebPlaybackSDKReady = async () => {
    try {
      const token = getAccessTokenSync();
      if (!token) {
        setStatus('Click “Log in with Spotify” first.');
        return;
      }

      setStatus('Initializing player…');
      const { deviceId, player } = await initPlayer(() => getAccessTokenSync());
      activeDeviceId = deviceId;
      activePlayer = player;
      setStatus(`Device ready: ${deviceId}`);

      const handleStateChange = (state) => {
        if (!nowEl) return;
        if (!state || !state.track_window || !state.track_window.current_track) {
          nowEl.textContent = '';
          return;
        }

        const { current_track: track } = state.track_window;
        const artists = (track.artists || []).map((artist) => artist.name).filter(Boolean).join(', ');
        const prefix = state.paused ? 'Paused' : 'Playing';
        nowEl.textContent = `${prefix}: ${track.name}${artists ? ` — ${artists}` : ''}`;
      };

      player.addListener('player_state_changed', handleStateChange);

      if (playBtn) {
        playBtn.disabled = false;
        playBtn.onclick = async () => {
          if (!activeDeviceId) return;
          setStatus('Starting playback…');
          try {
            await startPlayback(activeDeviceId, { uris: ['spotify:track:3n3Ppam7vgaVa1iaRUc9Lp'] });
            setStatus('Playback started.');
          } catch (error) {
            console.error('Failed to start playback', error);
            setStatus('Could not start playback. Ensure Spotify Premium is active and the player is online.');
          }
        };
      }

      if (pauseBtn) {
        pauseBtn.disabled = false;
        pauseBtn.onclick = async () => {
          if (!activePlayer) return;
          try {
            await pausePlayback(activePlayer);
            setStatus('Playback paused.');
          } catch (error) {
            console.error('Failed to pause playback', error);
            setStatus('Could not pause playback. See console for details.');
          }
        };
      }
    } catch (error) {
      console.error('Failed to initialize Spotify player', error);
      setStatus('Failed to initialize Spotify player. See console for details.');
      playBtn && (playBtn.disabled = true);
      pauseBtn && (pauseBtn.disabled = true);
    }
  };
})();
