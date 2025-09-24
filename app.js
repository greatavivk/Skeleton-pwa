const COUNTDOWN_TARGET = new Date('2025-02-14T18:00:00Z');
const COUNTDOWN_START = new Date('2024-09-01T00:00:00Z');
const SPOTIFY_CLIENT_ID = '1bc3566e5b8f4ae1bbaafec8950f4c86';

const selectors = {
  tabButtons: document.querySelectorAll('.tab-nav__item'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  countdownCards: document.querySelectorAll('.flip-card'),
  countdownBreakdown: document.querySelector('#countdown-breakdown'),
  progressFill: document.querySelector('.progress__fill'),
  progressBar: document.querySelector('.progress__bar'),
  progressPercent: document.querySelector('#progress-percent'),
  progressElapsed: document.querySelector('#progress-elapsed'),
  countdownDetail: document.querySelector('#countdown-detail'),
  footerTimestamp: document.querySelector('#footer-timestamp'),
  spotifyStatus: document.querySelector('#spotify-status'),
  spotifyMessage: document.querySelector('#spotify-message'),
  spotifyTokenInput: document.querySelector('#spotify-token'),
  spotifyToggle: document.querySelector('#spotify-token-toggle'),
  spotifyConnect: document.querySelector('#spotify-connect'),
  spotifyStartAuth: document.querySelector('#spotify-start-auth'),
  spotifyRefresh: document.querySelector('#spotify-refresh'),
  spotifyResults: document.querySelector('#spotify-results'),
  spotifyNowPlaying: document.querySelector('#spotify-now-playing'),
  spotifyRecent: document.querySelector('#spotify-recent'),
  spotifySearchForm: document.querySelector('#spotify-search-form'),
  spotifySearchInput: document.querySelector('#spotify-search'),
  spotifyPrev: document.querySelector('#spotify-prev'),
  spotifyPlay: document.querySelector('#spotify-play'),
  spotifyPause: document.querySelector('#spotify-pause'),
  spotifyNext: document.querySelector('#spotify-next'),
  spotifyVolume: document.querySelector('#spotify-volume'),
  footerSpotifyStatus: document.querySelector('#footer-spotify-status'),
  youtubeKeyInput: document.querySelector('#youtube-key'),
  youtubeToggle: document.querySelector('#youtube-key-toggle'),
  youtubeConnect: document.querySelector('#youtube-connect'),
  youtubeMessage: document.querySelector('#youtube-message'),
  youtubeConnectedCard: document.querySelector('#youtube-connected'),
  youtubeSearchForm: document.querySelector('#youtube-search-form'),
  youtubeSearchInput: document.querySelector('#youtube-search'),
  youtubeSuggestions: document.querySelector('#youtube-suggestions'),
  youtubeResults: document.querySelector('#youtube-results'),
  youtubePlayerDetails: document.querySelector('#youtube-player-details'),
  youtubeHistoryCard: document.querySelector('#youtube-history-card'),
  youtubeHistoryList: document.querySelector('#youtube-history'),
  youtubeSearchMeta: document.querySelector('#youtube-search-meta'),
  footerYoutubeStatus: document.querySelector('#footer-youtube-status'),
};

const state = {
  countdownIntervalId: null,
  spotify: {
    token: null,
    profile: null,
    deviceId: null,
    lastSearch: null,
    recent: [],
  },
  youtube: {
    apiKey: null,
    history: [],
    suggestions: [],
    pendingVideo: null,
  },
  youtubePlayer: null,
};

init();

function init() {
  initTabs();
  initCountdown();
  initParticles();
  initSpotify();
  initYouTube();
  initFooter();
  parseSpotifyTokenFromHash();
}

// -------------------------
// Tab navigation
// -------------------------
function initTabs() {
  selectors.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('is-active')) return;
      const target = `${button.dataset.tab}-panel`;
      selectors.tabButtons.forEach((btn) => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-selected', 'false');
      });
      selectors.tabPanels.forEach((panel) => {
        panel.classList.remove('is-active');
        panel.hidden = true;
      });

      button.classList.add('is-active');
      button.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(target);
      if (panel) {
        panel.classList.add('is-active');
        panel.hidden = false;
      }
    });
  });
}

// -------------------------
// Countdown
// -------------------------
function initCountdown() {
  updateCountdown();
  state.countdownIntervalId = window.setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  let diff = COUNTDOWN_TARGET - now;
  const isPast = diff <= 0;
  if (isPast) {
    diff = 0;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const timeParts = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };

  selectors.countdownCards.forEach((card) => {
    const unit = card.dataset.unit;
    if (!unit) return;
    const value = unit === 'days' ? timeParts[unit] : timeParts[unit];
    updateFlipCard(card, value);
  });

  updateBreakdown(timeParts);
  updateProgress(now);
  updateCountdownDetail(timeParts, isPast);
}

function updateCountdownDetail(parts, isPast) {
  if (isPast) {
    selectors.countdownDetail.textContent = 'The wait is over — enjoy your time with Nelusik!';
    return;
  }

  selectors.countdownDetail.textContent = `${formatNumber(parts.days)} days, ${formatNumber(parts.hours)} hours, ${formatNumber(parts.minutes)} minutes, ${formatNumber(parts.seconds)} seconds remaining.`;
}

function updateBreakdown(parts) {
  const rows = selectors.countdownBreakdown?.querySelectorAll('.breakdown__value');
  if (!rows) return;
  const sequence = ['days', 'hours', 'minutes', 'seconds'];
  sequence.forEach((unit, index) => {
    const valueNode = rows[index];
    if (!valueNode) return;
    valueNode.textContent = formatNumber(parts[unit]);
  });
}

function updateProgress(now) {
  if (!selectors.progressFill || !selectors.progressBar) return;
  const totalDuration = COUNTDOWN_TARGET - COUNTDOWN_START;
  if (totalDuration <= 0) {
    selectors.progressFill.style.width = '100%';
    selectors.progressBar.setAttribute('aria-valuenow', '100');
    selectors.progressPercent.textContent = '100% complete';
    selectors.progressElapsed.textContent = 'Countdown target already passed';
    return;
  }
  const elapsed = now - COUNTDOWN_START;
  const percent = clamp((elapsed / totalDuration) * 100, 0, 100);

  selectors.progressFill.style.width = `${percent.toFixed(2)}%`;
  selectors.progressBar.setAttribute('aria-valuenow', percent.toFixed(2));
  selectors.progressPercent.textContent = `${percent.toFixed(1)}% complete`;

  const daysTotal = Math.max(Math.round(totalDuration / 86400000), 1);
  const daysElapsed = clamp(Math.round(elapsed / 86400000), 0, daysTotal);
  selectors.progressElapsed.textContent = `${daysElapsed} of ${daysTotal} days passed`;
}

function updateFlipCard(card, rawValue) {
  const formattedValue = rawValue.toString().padStart(2, '0');
  const top = card.querySelector('.flip-card__top');
  const bottom = card.querySelector('.flip-card__bottom');
  const front = card.querySelector('.flip-card__front');
  const back = card.querySelector('.flip-card__back');

  if (!card.dataset.value) {
    card.dataset.value = formattedValue;
    if (top) top.textContent = formattedValue;
    if (bottom) bottom.textContent = formattedValue;
    if (front) front.textContent = formattedValue;
    if (back) back.textContent = formattedValue;
    return;
  }

  if (card.dataset.value === formattedValue) return;

  const previousValue = card.dataset.value;
  if (front) front.textContent = previousValue;
  if (back) back.textContent = formattedValue;

  card.classList.remove('is-flipping');
  void card.offsetWidth;
  card.classList.add('is-flipping');

  window.setTimeout(() => {
    if (top) top.textContent = formattedValue;
    if (bottom) bottom.textContent = formattedValue;
    card.dataset.value = formattedValue;
  }, 650);
}

function formatNumber(value) {
  return Number(value).toString().padStart(2, '0');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// -------------------------
// Particle animation
// -------------------------
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  resize();
  const particles = Array.from({ length: 60 }, () => createParticle(canvas));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
  }

  function update() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.005;

      if (particle.life <= 0 || particle.y < -20 || particle.y > height + 20) {
        Object.assign(particle, createParticle(canvas));
        particle.y = height + Math.random() * 40;
      }

      ctx.beginPath();
      ctx.globalAlpha = clamp(particle.life, 0, 0.6);
      ctx.fillStyle = particle.color;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    window.requestAnimationFrame(update);
  }

  resize();
  window.addEventListener('resize', resize);
  update();
}

function createParticle(canvas) {
  const palette = ['rgba(74, 214, 184, 0.6)', 'rgba(74, 139, 255, 0.55)', 'rgba(200, 107, 250, 0.5)'];
  return {
    x: Math.random() * canvas.offsetWidth,
    y: Math.random() * canvas.offsetHeight,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -0.15 - Math.random() * 0.25,
    size: 1.5 + Math.random() * 1.8,
    life: 0.5 + Math.random() * 0.5,
    color: palette[Math.floor(Math.random() * palette.length)],
  };
}

// -------------------------
// Spotify integration
// -------------------------
function initSpotify() {
  const storedToken = window.localStorage?.getItem('spotifyAccessToken');
  if (storedToken) {
    state.spotify.token = storedToken;
    selectors.spotifyTokenInput.value = storedToken;
    setSpotifyStatus('connected', 'Token restored from secure local storage.');
    refreshSpotifyData();
  } else {
    setSpotifyStatus('disconnected', 'Paste a valid OAuth token to get started.');
  }

  selectors.spotifyToggle?.addEventListener('click', () => toggleMaskedInput(selectors.spotifyTokenInput, selectors.spotifyToggle));

  selectors.spotifyConnect?.addEventListener('click', () => {
    const token = selectors.spotifyTokenInput.value.trim();
    if (!token) {
      showSpotifyMessage('Please paste a valid OAuth token from Spotify.', 'error');
      return;
    }
    state.spotify.token = token;
    window.localStorage?.setItem('spotifyAccessToken', token);
    setSpotifyStatus('connected', 'Spotify linked successfully.');
    refreshSpotifyData();
  });

  selectors.spotifyStartAuth?.addEventListener('click', handleSpotifyAuthRequest);
  selectors.spotifyRefresh?.addEventListener('click', refreshSpotifyNowPlaying);
  selectors.spotifySearchForm?.addEventListener('submit', handleSpotifySearch);
  selectors.spotifyPrev?.addEventListener('click', () => sendSpotifyCommand('me/player/previous', 'POST'));
  selectors.spotifyPlay?.addEventListener('click', () => sendSpotifyCommand('me/player/play', 'PUT'));
  selectors.spotifyPause?.addEventListener('click', () => sendSpotifyCommand('me/player/pause', 'PUT'));
  selectors.spotifyNext?.addEventListener('click', () => sendSpotifyCommand('me/player/next', 'POST'));
  selectors.spotifyVolume?.addEventListener('change', (event) => {
    const value = Number(event.target.value ?? 50);
    sendSpotifyCommand(`me/player/volume?volume_percent=${value}`, 'PUT');
  });

  selectors.spotifySearchInput?.addEventListener('input', () => {
    const hasValue = selectors.spotifySearchInput.value.trim().length > 0;
    selectors.spotifySearchForm?.classList.toggle('has-query', hasValue);
  });

  updateConnectButtonState(selectors.spotifyTokenInput, selectors.spotifyConnect);
  selectors.spotifyTokenInput?.addEventListener('input', () => updateConnectButtonState(selectors.spotifyTokenInput, selectors.spotifyConnect));
}

function parseSpotifyTokenFromHash() {
  if (!window.location.hash) return;
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (accessToken) {
    window.location.hash = '';
    selectors.spotifyTokenInput.value = accessToken;
    state.spotify.token = accessToken;
    window.localStorage?.setItem('spotifyAccessToken', accessToken);
    setSpotifyStatus('connected', 'Spotify token received via redirect.');
    refreshSpotifyData();
  }
}

function setSpotifyStatus(status, message = '') {
  selectors.spotifyStatus.dataset.status = status;
  selectors.spotifyStatus.textContent = status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Disconnected';
  selectors.footerSpotifyStatus.textContent = selectors.spotifyStatus.textContent;
  if (message) {
    const variant = status === 'error' ? 'error' : status === 'connected' ? 'success' : 'info';
    showSpotifyMessage(message, variant);
  }
}

function showSpotifyMessage(text, variant = 'info') {
  if (!selectors.spotifyMessage) return;
  selectors.spotifyMessage.textContent = text;
  selectors.spotifyMessage.dataset.variant = variant;
}

function updateConnectButtonState(input, button) {
  if (!input || !button) return;
  if (input.value.trim()) {
    button.classList.add('is-ready');
  } else {
    button.classList.remove('is-ready');
  }
}

function toggleMaskedInput(input, toggleButton) {
  if (!input || !toggleButton) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  toggleButton.textContent = isPassword ? 'Hide' : 'Show';
  toggleButton.setAttribute('aria-label', `${isPassword ? 'Hide' : 'Show'} token`);
}

async function handleSpotifyAuthRequest() {
  const redirectUri = window.location.origin.includes('http') ? `${window.location.origin}${window.location.pathname}` : 'https://developer.spotify.com/console/get-currently-playing/';
  const scope = encodeURIComponent('user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played');
  const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&show_dialog=true`;
  window.open(url, '_blank', 'noopener');
}

async function refreshSpotifyData() {
  await Promise.all([refreshSpotifyNowPlaying(), fetchSpotifyRecent()]);
}

async function refreshSpotifyNowPlaying() {
  const container = selectors.spotifyNowPlaying;
  if (!container) return;

  if (!state.spotify.token) {
    container.innerHTML = '<p class="panel-card__note">Connect to Spotify to see what is playing.</p>';
    return;
  }

  try {
    const data = await spotifyFetch('me/player/currently-playing');
    if (!data || !data.item) {
      container.innerHTML = '<p class="panel-card__note">Nothing is playing right now.</p>';
      return;
    }

    renderSpotifyNowPlaying(data);
  } catch (error) {
    handleSpotifyError(error);
  }
}

function renderSpotifyNowPlaying(data) {
  const container = selectors.spotifyNowPlaying;
  if (!container) return;
  const track = data.item;
  const artists = track.artists?.map((artist) => artist.name).join(', ');
  const cover = track.album?.images?.[0]?.url ?? '';

  container.innerHTML = `
    <img src="${cover}" alt="${track.name} artwork" class="now-playing__cover" />
    <div class="now-playing__meta">
      <h4 class="now-playing__title">${track.name}</h4>
      <p class="now-playing__artist">${artists}</p>
      <p class="panel-card__note">Device: ${data.device?.name ?? 'Unknown'}</p>
    </div>
  `;
}

async function handleSpotifySearch(event) {
  event.preventDefault();
  const query = selectors.spotifySearchInput.value.trim();
  if (!query) return;
  if (!state.spotify.token) {
    showSpotifyMessage('Connect to Spotify before searching.', 'error');
    return;
  }

  selectors.spotifyResults.innerHTML = '<div class="skeleton skeleton--tile"></div><div class="skeleton skeleton--tile"></div><div class="skeleton skeleton--tile"></div>';

  try {
    const response = await spotifyFetch(`search?type=track&limit=9&q=${encodeURIComponent(query)}`);
    const tracks = response?.tracks?.items ?? [];
    renderSpotifySearchResults(tracks);
    state.spotify.lastSearch = query;
  } catch (error) {
    handleSpotifyError(error);
  }
}

function renderSpotifySearchResults(tracks) {
  const container = selectors.spotifyResults;
  if (!container) return;
  if (!tracks.length) {
    container.innerHTML = '<p class="panel-card__note">No results found. Try another search term.</p>';
    return;
  }

  container.innerHTML = tracks
    .map((track) => {
      const cover = track.album?.images?.[1]?.url ?? '';
      const artists = track.artists?.map((artist) => artist.name).join(', ');
      return `
        <article class="track-card">
          <img src="${cover}" alt="${track.name} cover" class="track-card__cover" />
          <div class="track-card__meta">
            <h4 class="track-card__title">${track.name}</h4>
            <p class="track-card__subtitle">${artists}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

async function fetchSpotifyRecent() {
  if (!state.spotify.token) return;
  try {
    const response = await spotifyFetch('me/player/recently-played?limit=6');
    const items = response?.items ?? [];
    state.spotify.recent = items;
    renderSpotifyRecent(items);
  } catch (error) {
    handleSpotifyError(error);
  }
}

function renderSpotifyRecent(items) {
  const list = selectors.spotifyRecent;
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<li>No recent playback yet.</li>';
    return;
  }
  list.innerHTML = items
    .map((item) => {
      const track = item.track;
      const artists = track?.artists?.map((artist) => artist.name).join(', ');
      const playedAt = new Date(item.played_at).toLocaleString();
      return `
        <li>
          <strong>${track?.name ?? 'Unknown track'}</strong>
          <span>${artists}</span>
          <span>Played: ${playedAt}</span>
        </li>
      `;
    })
    .join('');
}

async function sendSpotifyCommand(endpoint, method = 'POST') {
  if (!state.spotify.token) {
    showSpotifyMessage('Connect to Spotify first.', 'error');
    return;
  }
  try {
    await spotifyFetch(endpoint, { method });
    showSpotifyMessage('Command sent to Spotify.', 'success');
    refreshSpotifyNowPlaying();
  } catch (error) {
    handleSpotifyError(error);
  }
}

async function spotifyFetch(endpoint, options = {}) {
  if (!state.spotify.token) throw new Error('Missing token');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${state.spotify.token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    signal: controller.signal,
  }).catch((error) => {
    window.clearTimeout(timeout);
    throw error;
  });

  window.clearTimeout(timeout);

  if (response.status === 204) {
    setSpotifyStatus('connected');
    return null;
  }
  if (response.status === 401) {
    setSpotifyStatus('error', 'Token expired. Please reconnect.');
    window.localStorage?.removeItem('spotifyAccessToken');
    throw new Error('Spotify token expired');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message ?? 'Spotify request failed';
    throw new Error(message);
  }

  const data = await response.json();
  setSpotifyStatus('connected');
  return data;
}

function handleSpotifyError(error) {
  console.error(error);
  showSpotifyMessage(error.message ?? 'Something went wrong with Spotify.', 'error');
  setSpotifyStatus('error');
}

// -------------------------
// YouTube integration
// -------------------------
function initYouTube() {
  const storedKey = window.localStorage?.getItem('youtubeApiKey');
  const storedHistory = window.localStorage?.getItem('youtubeHistory');
  if (storedKey) {
    state.youtube.apiKey = storedKey;
    selectors.youtubeKeyInput.value = storedKey;
    activateYoutubeUI();
    selectors.youtubeMessage.textContent = 'API key restored from secure local storage.';
    selectors.youtubeMessage.dataset.variant = 'success';
  }

  if (storedHistory) {
    try {
      state.youtube.history = JSON.parse(storedHistory);
    } catch (error) {
      state.youtube.history = [];
    }
  }

  renderYoutubeHistory();

  selectors.youtubeToggle?.addEventListener('click', () => toggleMaskedInput(selectors.youtubeKeyInput, selectors.youtubeToggle));
  selectors.youtubeConnect?.addEventListener('click', connectYoutube);
  selectors.youtubeKeyInput?.addEventListener('input', () => updateConnectButtonState(selectors.youtubeKeyInput, selectors.youtubeConnect));
  selectors.youtubeSearchForm?.addEventListener('submit', handleYoutubeSearch);
  selectors.youtubeSearchInput?.addEventListener('input', populateYoutubeSuggestions);

  updateConnectButtonState(selectors.youtubeKeyInput, selectors.youtubeConnect);
}

function activateYoutubeUI() {
  selectors.youtubeConnectedCard.hidden = false;
  selectors.youtubeHistoryCard.hidden = false;
  selectors.footerYoutubeStatus.textContent = 'Online';
}

function connectYoutube() {
  const key = selectors.youtubeKeyInput.value.trim();
  if (!key) {
    selectors.youtubeMessage.textContent = 'Enter your API key before connecting.';
    selectors.youtubeMessage.dataset.variant = 'error';
    return;
  }
  state.youtube.apiKey = key;
  window.localStorage?.setItem('youtubeApiKey', key);
  selectors.youtubeMessage.textContent = 'YouTube API connected. Start searching!';
  selectors.youtubeMessage.dataset.variant = 'success';
  activateYoutubeUI();
}

function populateYoutubeSuggestions() {
  const input = selectors.youtubeSearchInput.value.trim();
  const datalist = selectors.youtubeSuggestions;
  if (!datalist) return;
  datalist.innerHTML = '';
  if (!input) {
    state.youtube.suggestions = state.youtube.history.slice(-5).map((entry) => entry.query);
  } else {
    state.youtube.suggestions = state.youtube.history
      .filter((entry) => entry.query.toLowerCase().includes(input.toLowerCase()))
      .slice(-5)
      .map((entry) => entry.query);
  }
  [...new Set(state.youtube.suggestions)].forEach((suggestion) => {
    const option = document.createElement('option');
    option.value = suggestion;
    datalist.appendChild(option);
  });

  if (selectors.youtubeConnect) {
    selectors.youtubeConnect.classList.toggle('is-ready', Boolean(selectors.youtubeKeyInput.value.trim()));
  }
}

async function handleYoutubeSearch(event) {
  event.preventDefault();
  if (!state.youtube.apiKey) {
    selectors.youtubeMessage.textContent = 'Connect a YouTube API key before searching.';
    selectors.youtubeMessage.dataset.variant = 'error';
    return;
  }

  const query = selectors.youtubeSearchInput.value.trim();
  if (!query) return;

  showYoutubeSkeleton();

  try {
    const searchResponse = await youtubeFetch('search', {
      part: 'snippet',
      type: 'video',
      maxResults: 9,
      q: query,
    });

    const videoIds = searchResponse.items.map((item) => item.id.videoId).join(',');
    let details = { items: [] };
    if (videoIds) {
      details = await youtubeFetch('videos', {
        part: 'contentDetails,statistics,snippet',
        id: videoIds,
      });
    }

    const mapped = mapYoutubeResults(searchResponse.items, details.items);
    renderYoutubeResults(mapped);
    selectors.youtubeSearchMeta.textContent = `Showing ${mapped.length} results for “${query}”.`;
    recordYoutubeHistory(query, mapped[0]);
  } catch (error) {
    selectors.youtubeResults.innerHTML = `<p class="panel-card__note">${error.message ?? 'Unable to load results right now.'}</p>`;
  }
}

function showYoutubeSkeleton() {
  selectors.youtubeResults.innerHTML = '<div class="skeleton skeleton--tile"></div><div class="skeleton skeleton--tile"></div><div class="skeleton skeleton--tile"></div>';
  selectors.youtubePlayerDetails.textContent = '';
}

async function youtubeFetch(endpoint, params) {
  const query = new URLSearchParams({ key: state.youtube.apiKey, ...params });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${query.toString()}`, {
    signal: controller.signal,
  }).catch((error) => {
    window.clearTimeout(timeout);
    throw error;
  });
  window.clearTimeout(timeout);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message ?? 'YouTube request failed.';
    throw new Error(message);
  }
  return response.json();
}

function mapYoutubeResults(items, details) {
  const detailMap = new Map();
  details.forEach((detail) => detailMap.set(detail.id, detail));
  return items.map((item) => {
    const id = item.id.videoId;
    const detail = detailMap.get(id);
    return {
      id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt,
      duration: formatIsoDuration(detail?.contentDetails?.duration),
      views: detail?.statistics?.viewCount,
    };
  });
}

function renderYoutubeResults(results) {
  if (!results.length) {
    selectors.youtubeResults.innerHTML = '<p class="panel-card__note">No videos found. Try another search term.</p>';
    return;
  }

  selectors.youtubeResults.innerHTML = results
    .map((video) => `
      <article class="video-card" data-video-id="${video.id}">
        <img src="${video.thumbnail}" alt="${video.title}" class="video-card__thumb" loading="lazy" />
        <div class="video-card__meta">
          <h4 class="video-card__title">${video.title}</h4>
          <p class="video-card__info">${video.channelTitle} · ${video.duration}</p>
        </div>
      </article>
    `)
    .join('');

  selectors.youtubeResults.querySelectorAll('.video-card').forEach((card) => {
    card.addEventListener('click', () => {
      const videoId = card.dataset.videoId;
      const video = results.find((entry) => entry.id === videoId);
      if (video) {
        playYoutubeVideo(video);
        recordYoutubeHistory(selectors.youtubeSearchInput.value.trim(), video);
      }
    });
  });

  const first = results[0];
  if (first) {
    playYoutubeVideo(first);
  }
}

function playYoutubeVideo(video) {
  if (!video?.id) return;
  state.youtube.pendingVideo = video;

  if (!state.youtubePlayer) {
    if (window.YT && typeof window.YT.Player === 'function') {
      state.youtubePlayer = new window.YT.Player('youtube-player', {
        videoId: video.id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
      });
    }
  } else {
    state.youtubePlayer.loadVideoById(video.id);
  }

  selectors.youtubePlayerDetails.innerHTML = `
    <strong>${video.title}</strong>
    <span>Channel: ${video.channelTitle}</span>
    <span>Duration: ${video.duration}</span>
    <span>Views: ${Number(video.views ?? 0).toLocaleString()}</span>
  `;
}

function recordYoutubeHistory(query, video) {
  if (!video) return;
  const entry = {
    query,
    title: video.title,
    id: video.id,
    viewedAt: new Date().toISOString(),
  };
  state.youtube.history.push(entry);
  if (state.youtube.history.length > 50) {
    state.youtube.history.shift();
  }
  window.localStorage?.setItem('youtubeHistory', JSON.stringify(state.youtube.history));
  renderYoutubeHistory();
}

function renderYoutubeHistory() {
  if (!selectors.youtubeHistoryList) return;
  if (!state.youtube.history.length) {
    selectors.youtubeHistoryList.innerHTML = '<li>No videos watched yet. Results you open will appear here.</li>';
    return;
  }

  selectors.youtubeHistoryList.innerHTML = state.youtube.history
    .slice()
    .reverse()
    .map((entry) => `
      <li>
        <span>${entry.title}</span>
        <span>${new Date(entry.viewedAt).toLocaleString()}</span>
      </li>
    `)
    .join('');
}

function formatIsoDuration(duration) {
  if (!duration) return 'Unknown';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  const [, h, m, s] = match;
  const hours = Number(h || 0);
  const minutes = Number(m || 0);
  const seconds = Number(s || 0);
  const parts = [];
  if (hours) parts.push(hours.toString().padStart(2, '0'));
  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(seconds.toString().padStart(2, '0'));
  return parts.join(':');
}

// -------------------------
// Footer helpers
// -------------------------
function initFooter() {
  if (selectors.footerTimestamp) {
    const now = new Date();
    selectors.footerTimestamp.textContent = `Last updated: ${now.toLocaleString()}`;
  }
}

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  if (state.youtube.pendingVideo) {
    playYoutubeVideo(state.youtube.pendingVideo);
  } else if (!state.youtubePlayer && document.getElementById('youtube-player')) {
    state.youtubePlayer = new window.YT.Player('youtube-player', {
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
    });
  }
};

