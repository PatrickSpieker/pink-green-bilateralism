import fetch from 'node-fetch';

const APPLE_API = 'https://api.music.apple.com/v1';
const ITUNES_API = 'https://itunes.apple.com';

/**
 * Build a developer token JWT for Apple Music API.
 * Requires APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY env vars.
 *
 * NOTE: This uses a simplified approach. For production, use a proper JWT library.
 * The token is a JWT signed with ES256 using your MusicKit private key.
 */
async function getDeveloperToken() {
  // Dynamic import so the app still works without this dependency
  // when only doing Apple Music → Spotify conversions via iTunes Search API
  const { default: jwt } = await import('jsonwebtoken');

  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!privateKey || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID) {
    throw new Error(
      'Apple Music API credentials not configured. ' +
      'Set APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY in .env'
    );
  }

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '1h',
    issuer: process.env.APPLE_TEAM_ID,
    header: {
      alg: 'ES256',
      kid: process.env.APPLE_KEY_ID,
    },
  });

  return token;
}

/**
 * Fetch tracks from an Apple Music playlist using the Apple Music API.
 */
export async function getPlaylistTracks(playlistId, storefront = 'us') {
  const token = await getDeveloperToken();

  const res = await fetch(
    `${APPLE_API}/catalog/${storefront}/playlists/${playlistId}?include=tracks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Failed to fetch Apple Music playlist');
  const data = await res.json();

  const playlist = data.data?.[0];
  if (!playlist) throw new Error('Apple Music playlist not found');

  const tracks = (playlist.relationships?.tracks?.data || []).map((t) => ({
    title: t.attributes.name,
    artist: t.attributes.artistName,
    album: t.attributes.albumName,
    durationMs: t.attributes.durationInMillis,
    appleMusicId: t.id,
    appleMusicUrl: t.attributes.url,
    artwork: t.attributes.artwork?.url
      ?.replace('{w}', '300')
      .replace('{h}', '300'),
  }));

  return {
    name: playlist.attributes.name,
    description: playlist.attributes.description?.standard || '',
    artwork: playlist.attributes.artwork?.url
      ?.replace('{w}', '300')
      .replace('{h}', '300'),
    tracks,
  };
}

/**
 * Search iTunes / Apple Music catalog for a track.
 * Uses the free iTunes Search API (no auth required).
 * Returns up to `limit` results.
 */
export async function searchTrack(title, artist, limit = 5) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const res = await fetch(
    `${ITUNES_API}/search?term=${query}&media=music&entity=song&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results || []).map((t) => ({
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    durationMs: t.trackTimeMillis,
    appleMusicId: String(t.trackId),
    appleMusicUrl: t.trackViewUrl,
    artwork: t.artworkUrl100?.replace('100x100', '300x300'),
  }));
}
