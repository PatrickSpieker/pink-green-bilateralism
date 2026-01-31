import { Router } from 'express';
import * as spotifyService from '../services/spotifyService.js';

const router = Router();

/**
 * GET /api/auth/spotify/login
 * Redirects the user to Spotify's authorization page.
 */
router.get('/spotify/login', (req, res) => {
  const scopes = 'playlist-modify-public playlist-modify-private';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    show_dialog: 'true',
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

/**
 * GET /api/auth/spotify/callback
 * Exchanges the authorization code for tokens, then redirects back to the client.
 */
router.get('/spotify/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(
      `${process.env.CLIENT_URL}/?auth_error=${encodeURIComponent(error)}`
    );
  }

  try {
    const tokens = await spotifyService.exchangeCode(code);
    // Pass the access token back to the client via URL fragment (not query)
    // so it doesn't get logged in server access logs.
    return res.redirect(
      `${process.env.CLIENT_URL}/?spotify_token=${tokens.access_token}`
    );
  } catch (err) {
    return res.redirect(
      `${process.env.CLIENT_URL}/?auth_error=${encodeURIComponent(err.message)}`
    );
  }
});

export default router;
