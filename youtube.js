const API_BASE = 'https://www.googleapis.com/youtube/v3';
const STORAGE_KEY = 'nelusik_youtube_api_key_v1';
const REQUEST_TIMEOUT = 10000;

let apiKey = null;

function loadStoredKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      apiKey = stored;
    }
  } catch (error) {
    console.warn('Unable to access stored API key', error);
  }
  return apiKey;
}

export function initializeStoredKey() {
  return apiKey ?? loadStoredKey();
}

export function hasApiKey() {
  return Boolean(apiKey);
}

export function setApiKey(key) {
  apiKey = key?.trim() || null;
  try {
    if (apiKey) {
      localStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Unable to persist API key', error);
  }
  return apiKey;
}

export function clearApiKey() {
  apiKey = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear stored API key', error);
  }
}

function requireApiKey() {
  if (!apiKey) {
    throw new Error('Connect a YouTube Data API key first.');
  }
  return apiKey;
}

async function fetchWithTimeout(endpoint, params) {
  const url = `${API_BASE}/${endpoint}?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube API error (${response.status}): ${text || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('YouTube request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const DURATION_REGEX = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i;

function formatDuration(iso) {
  const match = DURATION_REGEX.exec(iso || '');
  if (!match) return '0:00';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const paddedMinutes = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const paddedSeconds = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`;
}

export async function searchVideos(query, maxResults = 12) {
  const key = requireApiKey();
  const safeResults = Math.max(1, Math.min(25, maxResults));
  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: String(safeResults),
    safeSearch: 'moderate',
    key
  });

  const searchData = await fetchWithTimeout('search', searchParams);
  const items = searchData.items || [];
  const videoIds = items
    .map((item) => item?.id?.videoId)
    .filter(Boolean);

  if (!videoIds.length) return [];

  const detailsParams = new URLSearchParams({
    part: 'contentDetails,snippet',
    id: videoIds.join(','),
    key
  });

  const detailsData = await fetchWithTimeout('videos', detailsParams);
  const detailsMap = new Map();
  for (const item of detailsData.items || []) {
    detailsMap.set(item.id, item);
  }

  return videoIds.map((id) => {
    const detail = detailsMap.get(id) || {};
    const snippet = detail.snippet || {};
    const thumbnail =
      snippet.thumbnails?.medium?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '';
    return {
      id,
      title: snippet.title || 'Untitled video',
      channel: snippet.channelTitle || 'Unknown channel',
      thumbnail,
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      duration: formatDuration(detail.contentDetails?.duration || 'PT0S')
    };
  });
}
