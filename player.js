export async function initPlayer(getTokenSync) {
  await waitFor(() => window.Spotify && window.Spotify.Player);

  const player = new Spotify.Player({
    name: 'Skeleton PWA Device',
    getOAuthToken: cb => cb(getTokenSync())
  });

  return await new Promise((resolve, reject) => {
    player.addListener('ready', ({ device_id }) => resolve({ deviceId: device_id, player }));
    player.addListener('initialization_error', e => reject(e));
    player.addListener('authentication_error', e => reject(e));
    player.addListener('account_error', e => reject(e));
    player.addListener('playback_error', e => reject(e));
    player.connect();
  });
}

export async function startPlayback(deviceId, body, getTokenSync) {
  const token = typeof getTokenSync === 'function' ? getTokenSync() : localStorage.getItem('sp_access');
  if (!token) {
    throw new Error('Missing Spotify session. Click “Log in with Spotify”.');
  }

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (res.status === 401) {
    throw new Error('Spotify session expired. Click “Log in with Spotify” again.');
  }
  if (res.status === 403) {
    throw new Error('Spotify Premium is required for playback.');
  }
  if (res.status === 404) {
    throw new Error('No active Spotify device. Open Spotify on any device, then try again.');
  }
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(message || `Spotify playback failed (${res.status}).`);
  }
}

export function pause(player) { player.pause(); }

function waitFor(check, interval = 100) {
  return new Promise(res => {
    const t = setInterval(() => { if (check()) { clearInterval(t); res(true); } }, interval);
  });
}
