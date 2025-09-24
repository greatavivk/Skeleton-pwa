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
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      message = json.error?.message ? `${message}: ${json.error.message}` : message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${message}: ${text}`;
      } catch {}
    }
    throw new Error(`Spotify playback failed – ${message}`);
  }
}

export function pause(player) { return player.pause(); }

function waitFor(check, interval = 100) {
  return new Promise(res => {
    const t = setInterval(() => { if (check()) { clearInterval(t); res(true); } }, interval);
  });
}
