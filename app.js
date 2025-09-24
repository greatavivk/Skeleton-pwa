const COUNTDOWN_TARGET = new Date('2025-02-14T18:00:00Z');
const COUNTDOWN_START = new Date('2024-09-01T00:00:00Z');

const SPOTIFY_CURATED = [
  {
    title: 'Chill Hits',
    subtitle: 'Feel-good pop and indie to soundtrack a cozy evening.',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
    accent: 'rgba(74, 214, 184, 0.55)',
  },
  {
    title: 'Lofi Beats',
    subtitle: 'Steady beats to help you unwind and focus.',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX2UXfvE4VhLZ',
    accent: 'rgba(96, 165, 250, 0.55)',
  },
  {
    title: 'Deep Focus',
    subtitle: 'Ambient and post-rock textures for deep work.',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
    accent: 'rgba(165, 180, 252, 0.55)',
  },
  {
    title: 'Peaceful Piano',
    subtitle: 'Gentle piano to keep things calm and centered.',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    accent: 'rgba(255, 255, 255, 0.45)',
  },
  {
    title: 'Blinding Lights',
    subtitle: 'The Weeknd • Dawn FM',
    url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    accent: 'rgba(255, 149, 128, 0.55)',
  },
  {
    title: 'As It Was',
    subtitle: 'Harry Styles • Harry’s House',
    url: 'https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7',
    accent: 'rgba(255, 212, 130, 0.55)',
  },
];

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
  spotifyLinkForm: document.querySelector('#spotify-link-form'),
  spotifyLinkInput: document.querySelector('#spotify-link'),
  spotifyEmbed: document.querySelector('#spotify-embed'),
  spotifyEmbedMeta: document.querySelector('#spotify-embed-meta'),
  spotifySearchForm: document.querySelector('#spotify-search-form'),
  spotifySearchInput: document.querySelector('#spotify-search'),
  spotifyResults: document.querySelector('#spotify-results'),
  spotifyRecent: document.querySelector('#spotify-recent'),
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
    recent: [],
    activeUrl: null,
  },
  youtube: {
    apiKey: null,
    history: [],
    suggestions: [],
    pendingVideo: null,
  },
  youtubePlayer: null,
  youtubePlayerReady: false,
};

init();

function init() {
  initTabs();
  initCountdown();
  initParticles();
  initSpotify();
  initYouTube();
  initFooter();
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
const SPOTIFY_HISTORY_KEY = 'spotifyRecentEmbeds';

function initSpotify() {
  setSpotifyStatus('ready', 'Pick a playlist or paste a link. No login needed.');
  loadSpotifyHistory();
  renderSpotifyResults(SPOTIFY_CURATED);

  selectors.spotifyLinkForm?.addEventListener('submit', handleSpotifyLinkSubmit);
  selectors.spotifySearchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSpotifySearchInput();
  });
  selectors.spotifySearchInput?.addEventListener('input', handleSpotifySearchInput);
}

function setSpotifyStatus(status, message = '') {
  if (!selectors.spotifyStatus) return;
  selectors.spotifyStatus.dataset.status = status;
  const text = status === 'success' ? 'Connected' : status === 'error' ? 'Error' : 'Ready';
  selectors.spotifyStatus.textContent = text;
  if (selectors.footerSpotifyStatus) {
    selectors.footerSpotifyStatus.textContent = text;
  }
  if (message) {
    const variant = status === 'error' ? 'error' : status === 'success' ? 'success' : 'info';
    showSpotifyMessage(message, variant);
  }
}

function showSpotifyMessage(text, variant = 'info') {
  if (!selectors.spotifyMessage) return;
  selectors.spotifyMessage.textContent = text;
  selectors.spotifyMessage.dataset.variant = variant;
}

function handleSpotifyLinkSubmit(event) {
  event.preventDefault();
  const raw = selectors.spotifyLinkInput?.value.trim();
  if (!raw) {
    showSpotifyMessage('Paste a Spotify link to start playback.', 'error');
    return;
  }

  const normalized = normalizeSpotifyUrl(raw);
  if (!normalized) {
    showSpotifyMessage('That link is not a format Spotify embeds can load.', 'error');
    return;
  }

  selectors.spotifyLinkInput.value = normalized.displayUrl;
  loadSpotifyEmbed(normalized);
}

function handleSpotifySearchInput() {
  const query = selectors.spotifySearchInput?.value.trim().toLowerCase() ?? '';
  if (selectors.spotifySearchForm) {
    selectors.spotifySearchForm.classList.toggle('has-query', Boolean(query));
  }
  const matches = query
    ? SPOTIFY_CURATED.filter((item) =>
        [item.title, item.subtitle].some((field) => field.toLowerCase().includes(query))
      )
    : SPOTIFY_CURATED;
  renderSpotifyResults(matches);
}

function renderSpotifyResults(items) {
  const container = selectors.spotifyResults;
  if (!container) return;
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<p class="panel-card__note">No matches found. Try a different vibe.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const normalized = normalizeSpotifyUrl(item.url);
    if (!normalized) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spotify-tile';
    button.dataset.url = normalized.fullUrl;
    button.dataset.type = normalized.type;
    button.style.setProperty('--tile-accent', item.accent ?? defaultSpotifyAccent(normalized.type));
    if (state.spotify.activeUrl === normalized.fullUrl) {
      button.classList.add('is-active');
    }
    button.innerHTML = `
      <span class="spotify-tile__swatch"></span>
      <span class="spotify-tile__meta">
        <span class="spotify-tile__type">${formatSpotifyType(normalized.type)}</span>
        <span class="spotify-tile__title">${escapeHtml(item.title)}</span>
        <span class="spotify-tile__subtitle">${escapeHtml(item.subtitle)}</span>
      </span>
    `;
    button.setAttribute('aria-label', `${item.title} — ${formatSpotifyType(normalized.type)}`);
    button.addEventListener('click', () => {
      loadSpotifyEmbed(normalized, {
        title: item.title,
        subtitle: item.subtitle,
        accent: item.accent ?? defaultSpotifyAccent(normalized.type),
      });
    });
    fragment.appendChild(button);
  });

  container.appendChild(fragment);
  highlightActiveSpotifyTile();
}

function highlightActiveSpotifyTile() {
  const tiles = selectors.spotifyResults?.querySelectorAll('.spotify-tile');
  if (!tiles) return;
  tiles.forEach((tile) => {
    const normalized = normalizeSpotifyUrl(tile.dataset.url);
    const isActive = normalized && normalized.fullUrl === state.spotify.activeUrl;
    tile.classList.toggle('is-active', Boolean(isActive));
  });
}

async function loadSpotifyEmbed(entry, context = {}) {
  const container = selectors.spotifyEmbed;
  if (!container) return;

  const accentColor = context.accent ?? defaultSpotifyAccent(entry.type);
  container.style.setProperty('--tile-accent', accentColor);
  selectors.spotifyEmbedMeta?.style.setProperty('--tile-accent', accentColor);

  state.spotify.activeUrl = entry.fullUrl;
  container.innerHTML = `
    <iframe
      src="${entry.embedUrl}?utm_source=generator"
      title="Spotify player"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  `;
  container.classList.add('is-loaded');

  if (selectors.spotifyEmbedMeta) {
    selectors.spotifyEmbedMeta.innerHTML = '<div class="skeleton skeleton--line"></div>';
  }

  highlightActiveSpotifyTile();

  try {
    const meta = await fetchSpotifyOEmbed(entry.fullUrl);
    const details = {
      title: meta?.title ?? context.title ?? 'Spotify',
      subtitle: meta?.author_name ?? context.subtitle ?? formatSpotifyType(entry.type),
      thumbnail: meta?.thumbnail_url ?? '',
      accent: accentColor,
      type: entry.type,
      url: entry.fullUrl,
    };
    renderSpotifyMeta(details);
    recordSpotifyRecent(details);
    setSpotifyStatus('success', 'Spotify embed ready.');
  } catch (error) {
    const details = {
      title: context.title ?? 'Spotify',
      subtitle: context.subtitle ?? formatSpotifyType(entry.type),
      thumbnail: '',
      accent: accentColor,
      type: entry.type,
      url: entry.fullUrl,
    };
    renderSpotifyMeta(details, true);
    recordSpotifyRecent(details);
    showSpotifyMessage('Loaded the Spotify player, but metadata could not be fetched.', 'info');
    setSpotifyStatus('success');
  }
}

async function fetchSpotifyOEmbed(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error('Unable to fetch Spotify metadata');
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function renderSpotifyMeta(details, isFallback = false) {
  const container = selectors.spotifyEmbedMeta;
  if (!container) return;
  const accent = details.accent ?? defaultSpotifyAccent(details.type);
  container.style.setProperty('--tile-accent', accent);

  container.innerHTML = `
    ${
      details.thumbnail
        ? `<img src="${details.thumbnail}" alt="${escapeHtml(details.title)} artwork" class="embed-meta__thumb" loading="lazy" />`
        : '<div class="embed-meta__thumb embed-meta__thumb--placeholder"></div>'
    }
    <div class="embed-meta__text">
      <span class="embed-meta__badge">${formatSpotifyType(details.type)}</span>
      <p class="embed-meta__title">${escapeHtml(details.title)}</p>
      <p class="embed-meta__subtitle">${escapeHtml(details.subtitle)}</p>
    </div>
  `;

  if (!details.thumbnail) {
    const placeholder = container.querySelector('.embed-meta__thumb--placeholder');
    placeholder?.style.setProperty('--tile-accent', accent);
  }
}

function recordSpotifyRecent(details) {
  if (!details?.url) return;
  const accent = details.accent ?? defaultSpotifyAccent(details.type);
  const history = state.spotify.recent.filter((entry) => entry.url !== details.url);
  history.unshift({
    title: details.title,
    subtitle: details.subtitle,
    url: details.url,
    type: details.type,
    accent,
  });
  state.spotify.recent = history.slice(0, 8);
  window.localStorage?.setItem(SPOTIFY_HISTORY_KEY, JSON.stringify(state.spotify.recent));
  renderSpotifyRecent();
  highlightActiveSpotifyTile();
}

function renderSpotifyRecent() {
  const list = selectors.spotifyRecent;
  if (!list) return;
  list.innerHTML = '';

  if (!state.spotify.recent.length) {
    list.innerHTML = '<li class="recent__empty">No listening history yet.</li>';
    return;
  }

  const fragment = document.createDocumentFragment();
  state.spotify.recent.forEach((entry) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recent__item';
    button.style.setProperty('--tile-accent', entry.accent ?? defaultSpotifyAccent(entry.type));
    button.classList.toggle('is-active', state.spotify.activeUrl === entry.url);
    button.innerHTML = `
      <span class="recent__title">${escapeHtml(entry.title)}</span>
      <span class="recent__meta">${formatSpotifyType(entry.type)} · ${escapeHtml(entry.subtitle)}</span>
    `;
    button.setAttribute('aria-label', `${entry.title} — ${formatSpotifyType(entry.type)}`);
    button.addEventListener('click', () => {
      const normalized = normalizeSpotifyUrl(entry.url);
      if (!normalized) return;
      loadSpotifyEmbed(normalized, entry);
    });
    li.appendChild(button);
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
}

function loadSpotifyHistory() {
  const stored = window.localStorage?.getItem(SPOTIFY_HISTORY_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        state.spotify.recent = parsed.filter((entry) => entry && entry.url && entry.title);
      }
    } catch (error) {
      state.spotify.recent = [];
    }
  }
  renderSpotifyRecent();
}

function normalizeSpotifyUrl(raw) {
  if (!raw) return null;
  let value = raw.trim();
  if (value.startsWith('spotify:')) {
    const parts = value.split(':').filter(Boolean);
    if (parts.length >= 3) {
      value = `https://open.spotify.com/${parts[1]}/${parts[2]}`;
    } else {
      return null;
    }
  }
  if (!/^https?:/i.test(value)) {
    value = `https://${value}`;
  }
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return null;
  }
  if (!url.hostname.includes('spotify.com')) return null;
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0]?.startsWith('intl')) {
    segments.shift();
  }
  if (segments[0] === 'embed' && segments.length >= 3) {
    segments.shift();
  }
  if (segments.length < 2) return null;
  const type = segments[0];
  const id = segments[1];
  const supported = ['track', 'album', 'playlist', 'artist', 'episode', 'show'];
  if (!supported.includes(type)) return null;
  const cleanUrl = `https://open.spotify.com/${type}/${id}`;
  return {
    type,
    id,
    fullUrl: cleanUrl,
    displayUrl: cleanUrl,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
  };
}

function formatSpotifyType(type) {
  switch (type) {
    case 'track':
      return 'Track';
    case 'album':
      return 'Album';
    case 'playlist':
      return 'Playlist';
    case 'artist':
      return 'Artist';
    case 'episode':
      return 'Episode';
    case 'show':
      return 'Podcast';
    default:
      return 'Spotify';
  }
}

function defaultSpotifyAccent(type) {
  switch (type) {
    case 'track':
      return 'rgba(255, 149, 128, 0.55)';
    case 'album':
      return 'rgba(96, 165, 250, 0.55)';
    case 'artist':
      return 'rgba(161, 102, 255, 0.55)';
    case 'episode':
    case 'show':
      return 'rgba(255, 212, 130, 0.55)';
    default:
      return 'rgba(74, 214, 184, 0.55)';
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateConnectButtonState(input, button) {
  if (!input || !button) return;
  button.classList.toggle('is-ready', Boolean(input.value.trim()));
}

function toggleMaskedInput(input, toggleButton) {
  if (!input || !toggleButton) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  toggleButton.textContent = isPassword ? 'Hide' : 'Show';
  toggleButton.setAttribute('aria-label', `${isPassword ? 'Hide' : 'Show'} key`);
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

  if (state.youtubePlayer && typeof state.youtubePlayer.loadVideoById === 'function' && state.youtubePlayerReady) {
    state.youtubePlayer.loadVideoById(video.id);
  } else if (state.youtubePlayer && typeof state.youtubePlayer.cueVideoById === 'function') {
    state.youtubePlayer.cueVideoById(video.id);
  } else if (window.YT && typeof window.YT.Player === 'function') {
    mountYoutubePlayer(video.id);
  }

  selectors.youtubePlayerDetails.innerHTML = `
    <strong>${video.title}</strong>
    <span>Channel: ${video.channelTitle}</span>
    <span>Duration: ${video.duration}</span>
    <span>Views: ${Number(video.views ?? 0).toLocaleString()}</span>
  `;
}

function mountYoutubePlayer(initialVideoId) {
  if (state.youtubePlayer || !document.getElementById('youtube-player')) return;
  if (!window.YT || typeof window.YT.Player !== 'function') return;

  state.youtubePlayerReady = false;
  state.youtubePlayer = new window.YT.Player('youtube-player', {
    videoId: initialVideoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onReady(event) {
        state.youtubePlayerReady = true;
        if (state.youtube.pendingVideo) {
          event.target.loadVideoById(state.youtube.pendingVideo.id);
        } else if (initialVideoId) {
          event.target.loadVideoById(initialVideoId);
        }
      },
    },
  });
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
  const pendingId = state.youtube.pendingVideo?.id;
  mountYoutubePlayer(pendingId);
};

