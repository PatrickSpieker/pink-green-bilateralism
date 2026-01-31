import { useState } from 'react';

export default function URLInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <div className="url-input-container">
      <h1>Playlist Converter</h1>
      <p className="subtitle">
        Convert playlists between Spotify and Apple Music
      </p>

      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Spotify or Apple Music playlist link..."
          className="url-input"
          disabled={loading}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
          {loading ? 'Loading...' : 'Convert'}
        </button>
      </form>

      <div className="supported-links">
        <p>Supported links:</p>
        <code>https://open.spotify.com/playlist/...</code>
        <code>https://music.apple.com/.../playlist/...</code>
      </div>
    </div>
  );
}
