module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    res.status(404).json({ error: 'YouTube API key not configured' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ key });
};
