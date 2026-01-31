import { useState, useEffect } from 'react';
import URLInput from './components/URLInput.jsx';
import TrackReview from './components/TrackReview.jsx';
import PlaylistCreated from './components/PlaylistCreated.jsx';
import { parsePlaylist, matchTracks, createPlaylist, getSpotifyLoginUrl } from './services/api.js';
import './App.css';

// Steps: input -> review -> auth -> creating -> done
const STEPS = { INPUT: 'input', REVIEW: 'review', DONE: 'done' };

export default function App() {
  const [step, setStep] = useState(STEPS.INPUT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Playlist data
  const [sourcePlatform, setSourcePlatform] = useState(null);
  const [targetPlatform, setTargetPlatform] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  const [matchResults, setMatchResults] = useState([]);

  // Auth
  const [spotifyToken, setSpotifyToken] = useState(null);

  // Result
  const [createdPlaylist, setCreatedPlaylist] = useState(null);

  // Check URL params for Spotify OAuth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('spotify_token');
    const authError = params.get('auth_error');

    if (token) {
      setSpotifyToken(token);
      // Clean the URL
      window.history.replaceState({}, '', '/');
    }
    if (authError) {
      setError(`Authentication failed: ${authError}`);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleUrlSubmit = async (url) => {
    setError(null);
    setLoading(true);

    try {
      // Step 1: Parse the playlist URL and fetch tracks
      const parseResult = await parsePlaylist(url);
      setSourcePlatform(parseResult.platform);
      setTargetPlatform(parseResult.targetPlatform);
      setPlaylistName(parseResult.playlist.name);

      // Step 2: Find matches on the target platform
      const matchResult = await matchTracks(
        parseResult.playlist.tracks,
        parseResult.targetPlatform
      );
      setMatchResults(matchResult.results);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (finalTracks) => {
    setError(null);

    // If targeting Spotify and not authenticated, redirect to Spotify login
    if (targetPlatform === 'spotify' && !spotifyToken) {
      // Save state to sessionStorage so we can resume after OAuth redirect
      sessionStorage.setItem(
        'pendingConversion',
        JSON.stringify({ playlistName, finalTracks, targetPlatform })
      );
      window.location.href = getSpotifyLoginUrl();
      return;
    }

    // If targeting Apple Music, we need MusicKit auth (handled separately)
    if (targetPlatform === 'apple') {
      setError(
        'Apple Music playlist creation requires MusicKit JS authentication. ' +
        'This feature requires an Apple Developer account to be configured.'
      );
      return;
    }

    setLoading(true);

    try {
      const trackIds = finalTracks.map((t) => t.spotifyId || t.appleMusicId);
      const result = await createPlaylist(
        targetPlatform,
        playlistName,
        trackIds,
        spotifyToken
      );
      setCreatedPlaylist(result);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resume after OAuth redirect
  useEffect(() => {
    if (spotifyToken && step === STEPS.INPUT) {
      const pending = sessionStorage.getItem('pendingConversion');
      if (pending) {
        sessionStorage.removeItem('pendingConversion');
        const { playlistName: name, finalTracks, targetPlatform: target } = JSON.parse(pending);
        setPlaylistName(name);
        setTargetPlatform(target);
        // Directly create the playlist
        (async () => {
          setLoading(true);
          try {
            const trackIds = finalTracks.map((t) => t.spotifyId || t.appleMusicId);
            const result = await createPlaylist(target, name, trackIds, spotifyToken);
            setCreatedPlaylist(result);
            setStep(STEPS.DONE);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [spotifyToken, step]);

  const handleReset = () => {
    setStep(STEPS.INPUT);
    setError(null);
    setSourcePlatform(null);
    setTargetPlatform(null);
    setPlaylistName('');
    setMatchResults([]);
    setCreatedPlaylist(null);
  };

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-dismiss">&times;</button>
        </div>
      )}

      {step === STEPS.INPUT && (
        <URLInput onSubmit={handleUrlSubmit} loading={loading} />
      )}

      {step === STEPS.REVIEW && (
        <TrackReview
          playlistName={playlistName}
          sourcePlatform={sourcePlatform}
          targetPlatform={targetPlatform}
          matchResults={matchResults}
          onConfirm={handleConfirm}
          onBack={handleReset}
          loading={loading}
        />
      )}

      {step === STEPS.DONE && createdPlaylist && (
        <PlaylistCreated
          playlistName={createdPlaylist.name}
          playlistUrl={createdPlaylist.url}
          platform={targetPlatform}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
