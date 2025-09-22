export async function initPlayer(getTokenSync, options = {}) {
  await waitFor(() => window.Spotify && window.Spotify.Player);

  const player = new Spotify.Player({
    name: 'Skeleton PWA Device',
    getOAuthToken: cb => cb(getTokenSync())
  });

  if (options.onStateChange) {
    player.addListener('player_state_changed', options.onStateChange);
  }
  if (options.onNotReady) {
    player.addListener('not_ready', options.onNotReady);
  }

  return await new Promise((resolve, reject) => {
    player.addListener('ready', ({ device_id }) => resolve({ deviceId: device_id, player }));
    player.addListener('initialization_error', e => reject(e));
    player.addListener('authentication_error', e => reject(e));
    player.addListener('account_error', e => reject(e));
    player.addListener('playback_error', e => reject(e));
    player.connect();
  });
}

export async function startPlayback(deviceId, body) {
  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('sp_access')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`Spotify playback failed: ${res.status}`);
  }
}

export async function transferPlayback(deviceId, play = false) {
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('sp_access')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ device_ids: [deviceId], play })
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Transfer playback failed: ${res.status}`);
  }
}

export function pause(player) {
  return player.pause();
}

export function resume(player) {
  return player.resume();
}

function waitFor(check, interval = 100) {
  return new Promise(res => {
    const t = setInterval(() => { if (check()) { clearInterval(t); res(true); } }, interval);
  });
}
