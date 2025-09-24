const API_KEY = 'YOUR_YOUTUBE_API_KEY';
const API_BASE = 'https://www.googleapis.com/youtube/v3';

function requireApiKey() {
  if (!API_KEY || API_KEY.includes('YOUR_YOUTUBE_API_KEY')) {
    throw new Error('Add your YouTube Data API key in youtube.js first.');
  }
  return API_KEY;
}

export async function searchVideos(query, maxResults = 12) {
  const key = requireApiKey();
  const params = new URLSearchParams({
    part: 'snippet',
    maxResults: String(maxResults),
    q: query,
    type: 'video',
    key,
    videoEmbeddable: 'true',
    safeSearch: 'moderate'
  });

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube search failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return (json.items || [])
    .map((item) => ({
      id: item?.id?.videoId,
      title: item?.snippet?.title || 'Untitled video',
      channelTitle: item?.snippet?.channelTitle || 'Unknown channel',
      thumbnail:
        item?.snippet?.thumbnails?.medium?.url ||
        item?.snippet?.thumbnails?.default?.url ||
        '',
      publishedAt: item?.snippet?.publishedAt
    }))
    .filter((video) => Boolean(video.id));
}
