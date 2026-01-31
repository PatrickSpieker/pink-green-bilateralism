export default function CloseMatchSelector({
  source,
  alternatives,
  selected,
  onSelect,
  onSkip,
  isSkipped,
}) {
  return (
    <div className={`close-match-selector ${isSkipped ? 'skipped' : ''}`}>
      <div className="source-track">
        <div className="track-info">
          <span className="track-title">{source.title}</span>
          <span className="track-artist">{source.artist}</span>
          <span className="track-album">{source.album}</span>
        </div>
      </div>

      <div className="alternatives-label">Possible matches:</div>

      <ul className="alternatives-list">
        {alternatives.map((alt, i) => {
          const isSelected = selected && (
            selected.spotifyId === alt.spotifyId ||
            selected.appleMusicId === alt.appleMusicId
          );

          return (
            <li
              key={i}
              className={`alternative-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(alt)}
            >
              {alt.artwork && <img src={alt.artwork} alt="" className="track-art-sm" />}
              <div className="track-info">
                <span className="track-title">{alt.title}</span>
                <span className="track-artist">{alt.artist}</span>
                <span className="track-album">{alt.album}</span>
              </div>
              {isSelected && <span className="selected-icon">&#10003;</span>}
            </li>
          );
        })}
      </ul>

      <button
        className={`btn btn-skip ${isSkipped ? 'active' : ''}`}
        onClick={onSkip}
      >
        {isSkipped ? 'Skipped' : 'Skip this track'}
      </button>
    </div>
  );
}
