export default function PlaylistCreated({ playlistName, playlistUrl, platform, onReset }) {
  const platformLabel = platform === 'spotify' ? 'Spotify' : 'Apple Music';

  return (
    <div className="playlist-created-container">
      <div className="success-icon">&#10003;</div>
      <h2>Playlist Created!</h2>
      <p>
        <strong>{playlistName}</strong> has been created on {platformLabel}.
      </p>
      <div className="created-actions">
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Open in {platformLabel}
        </a>
        <button onClick={onReset} className="btn btn-secondary">
          Convert Another Playlist
        </button>
      </div>
    </div>
  );
}
