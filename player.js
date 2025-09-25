export async function initPlayer(getToken) {
  await waitFor(() => window.Spotify && window.Spotify.Player);

  const player = new Spotify.Player({
    name: 'Skeleton PWA Device',
    getOAuthToken: async cb => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Missing Spotify token');
        cb(token);
      } catch (err) {
        console.error('Failed to provide Spotify token', err);
      }
    }
  });

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out while connecting to Spotify.'));
    }, 15000);

    const wrapSuccess = fn => arg => {
      clearTimeout(timeout);
      fn(arg);
    };

    const wrapError = fn => arg => {
      clearTimeout(timeout);
      const error = arg instanceof Error
        ? arg
        : new Error(arg && arg.message ? arg.message : 'Spotify player error.');
      if (arg && typeof arg === 'object') {
        error.raw = arg;
      }
      fn(error);
    };

    player.addListener('ready', wrapSuccess(({ device_id }) => resolve({ deviceId: device_id, player })));
    player.addListener('initialization_error', wrapError(reject));
    player.addListener('authentication_error', wrapError(reject));
    player.addListener('account_error', wrapError(reject));
    player.addListener('playback_error', wrapError(reject));
    player.connect();
  });
}

export async function startPlayback(deviceId, body, getToken) {
  const token = await getToken();
  if (!token) throw new Error('Missing Spotify token');

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(text || `Spotify playback failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
}

export async function pause(player) {
  try {
    await player.pause();
  } catch (err) {
    console.error('Failed to pause Spotify playback', err);
    throw err;
  }
}

function waitFor(check, interval = 100, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const t = setInterval(() => {
      if (check()) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - start > timeout) {
        clearInterval(t);
        reject(new Error('Timed out waiting for Spotify SDK.'));
      }
    }, interval);
  });
}
