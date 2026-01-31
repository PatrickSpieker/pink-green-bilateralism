const API_BASE = '/api';

export async function parsePlaylist(url) {
  const res = await fetch(`${API_BASE}/playlist/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to parse playlist');
  return data;
}

export async function matchTracks(tracks, targetPlatform) {
  const res = await fetch(`${API_BASE}/playlist/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracks, targetPlatform }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to match tracks');
  return data;
}

export async function createPlaylist(platform, name, trackIds, accessToken) {
  const res = await fetch(`${API_BASE}/playlist/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, name, trackIds, accessToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create playlist');
  return data;
}

export function getSpotifyLoginUrl() {
  return `${API_BASE}/auth/spotify/login`;
}
