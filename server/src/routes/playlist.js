import { Router } from 'express';
import { parsePlaylistUrl } from '../utils/urlParser.js';
import * as spotifyService from '../services/spotifyService.js';
import * as appleMusicService from '../services/appleMusicService.js';
import { findMatches } from '../services/matchingService.js';

const router = Router();

/**
 * POST /api/playlist/parse
 * Body: { url: string }
 * Parses the URL, fetches the playlist, and returns track list.
 */
router.post('/parse', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const parsed = parsePlaylistUrl(url);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    let playlist;
    if (parsed.platform === 'spotify') {
      playlist = await spotifyService.getPlaylistTracks(parsed.id);
    } else {
      playlist = await appleMusicService.getPlaylistTracks(parsed.id, parsed.storefront);
    }

    return res.json({
      platform: parsed.platform,
      targetPlatform: parsed.platform === 'spotify' ? 'apple' : 'spotify',
      playlist,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/playlist/match
 * Body: { tracks: [...], targetPlatform: 'spotify' | 'apple' }
 * Searches the target platform for each track and returns match results.
 */
router.post('/match', async (req, res) => {
  const { tracks, targetPlatform } = req.body;
  if (!tracks || !targetPlatform) {
    return res.status(400).json({ error: 'tracks and targetPlatform are required' });
  }

  try {
    const results = await findMatches(tracks, targetPlatform);
    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/playlist/create
 * Body: { platform: 'spotify', name: string, trackIds: string[], accessToken: string }
 * Creates the playlist on the target platform.
 */
router.post('/create', async (req, res) => {
  const { platform, name, trackIds, accessToken } = req.body;
  if (!platform || !name || !trackIds?.length || !accessToken) {
    return res.status(400).json({ error: 'platform, name, trackIds, and accessToken are required' });
  }

  try {
    if (platform === 'spotify') {
      const result = await spotifyService.createPlaylist(accessToken, name, trackIds);
      return res.json(result);
    }

    // Apple Music playlist creation would go here
    // Requires MusicKit user token from the frontend
    return res.status(501).json({
      error: 'Apple Music playlist creation requires MusicKit JS on the frontend. See the Apple Music auth flow.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
