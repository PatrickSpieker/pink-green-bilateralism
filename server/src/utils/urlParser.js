/**
 * Detects the music platform and extracts the playlist ID from a URL.
 *
 * Supported formats:
 *   Spotify:     https://open.spotify.com/playlist/{id}?si=...
 *   Apple Music: https://music.apple.com/{country}/playlist/{name}/{id}
 */

export function parsePlaylistUrl(url) {
  try {
    const parsed = new URL(url.trim());

    // Spotify
    if (parsed.hostname === 'open.spotify.com') {
      const match = parsed.pathname.match(/^\/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        return { platform: 'spotify', id: match[1] };
      }
    }

    // Apple Music
    if (parsed.hostname === 'music.apple.com') {
      const match = parsed.pathname.match(
        /^\/([a-z]{2})\/playlist\/[^/]+\/(pl\.[a-zA-Z0-9-]+)/
      );
      if (match) {
        return { platform: 'apple', storefront: match[1], id: match[2] };
      }
    }

    return { error: 'Unsupported URL. Please paste a Spotify or Apple Music playlist link.' };
  } catch {
    return { error: 'Invalid URL format.' };
  }
}
