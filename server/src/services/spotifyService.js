import fetch from 'node-fetch';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

/**
 * Get a client-credentials access token (for reading public playlists / searching).
 */
export async function getClientToken() {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to get Spotify client token');
  return data.access_token;
}

/**
 * Exchange an authorization code for user tokens.
 */
export async function exchangeCode(code) {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to exchange Spotify code');
  return data; // { access_token, refresh_token, expires_in }
}

/**
 * Fetch all tracks from a Spotify playlist. Handles pagination.
 */
export async function getPlaylistTracks(playlistId, accessToken) {
  const token = accessToken || (await getClientToken());

  // Get playlist metadata first
  const metaRes = await fetch(`${SPOTIFY_API}/playlists/${playlistId}?fields=name,description,images`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Failed to fetch Spotify playlist');
  const meta = await metaRes.json();

  const tracks = [];
  let url = `${SPOTIFY_API}/playlists/${playlistId}/tracks?fields=items(track(id,name,artists(name),album(name,images),duration_ms,external_urls)),next&limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch Spotify playlist tracks');
    const data = await res.json();

    for (const item of data.items) {
      if (!item.track) continue; // skip deleted/unavailable tracks
      tracks.push({
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album.name,
        durationMs: item.track.duration_ms,
        spotifyId: item.track.id,
        spotifyUrl: item.track.external_urls?.spotify,
        artwork: item.track.album.images?.[0]?.url,
      });
    }

    url = data.next;
  }

  return {
    name: meta.name,
    description: meta.description,
    artwork: meta.images?.[0]?.url,
    tracks,
  };
}

/**
 * Search Spotify for a track. Returns up to `limit` results.
 */
export async function searchTrack(title, artist, limit = 5) {
  const token = await getClientToken();
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(
    `${SPOTIFY_API}/search?q=${query}&type=track&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();

  return (data.tracks?.items || []).map((t) => ({
    title: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    album: t.album.name,
    durationMs: t.duration_ms,
    spotifyId: t.id,
    spotifyUrl: t.external_urls?.spotify,
    artwork: t.album.images?.[0]?.url,
  }));
}

/**
 * Create a new playlist and add tracks to it.
 * Requires a user access token (OAuth authorization code flow).
 */
export async function createPlaylist(userAccessToken, name, trackIds) {
  // Get current user
  const meRes = await fetch(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  });
  if (!meRes.ok) throw new Error('Failed to get Spotify user profile');
  const me = await meRes.json();

  // Create playlist
  const createRes = await fetch(`${SPOTIFY_API}/users/${me.id}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: 'Converted with Playlist Converter',
      public: false,
    }),
  });
  if (!createRes.ok) throw new Error('Failed to create Spotify playlist');
  const playlist = await createRes.json();

  // Add tracks in batches of 100
  const uris = trackIds.map((id) => `spotify:track:${id}`);
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    const addRes = await fetch(`${SPOTIFY_API}/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: batch }),
    });
    if (!addRes.ok) throw new Error('Failed to add tracks to Spotify playlist');
  }

  return {
    id: playlist.id,
    url: playlist.external_urls.spotify,
    name: playlist.name,
  };
}
