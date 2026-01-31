import { useState } from 'react';
import CloseMatchSelector from './CloseMatchSelector.jsx';

export default function TrackReview({
  playlistName,
  sourcePlatform,
  targetPlatform,
  matchResults,
  onConfirm,
  onBack,
  loading,
}) {
  // Track user selections for items that need review.
  // Key = index in matchResults, value = selected track object or null (skip).
  const [selections, setSelections] = useState({});

  const matched = matchResults.filter((r) => r.status === 'matched');
  const needsReview = matchResults.filter((r) => r.status === 'needs_review');
  const noMatch = matchResults.filter((r) => r.status === 'no_match' || r.status === 'error');

  const handleSelect = (resultIndex, track) => {
    setSelections((prev) => ({ ...prev, [resultIndex]: track }));
  };

  const handleSkip = (resultIndex) => {
    setSelections((prev) => ({ ...prev, [resultIndex]: null }));
  };

  const handleConfirm = () => {
    // Build final track list: auto-matched + user selections
    const finalTracks = [];

    matchResults.forEach((result, idx) => {
      if (result.status === 'matched') {
        finalTracks.push(result.match);
      } else if (result.status === 'needs_review' && selections[idx]) {
        finalTracks.push(selections[idx]);
      }
      // skipped or no_match items are excluded
    });

    onConfirm(finalTracks);
  };

  const allReviewed = needsReview.every((_, i) => {
    const idx = matchResults.indexOf(needsReview[i]);
    return idx in selections;
  });

  const platformLabel = targetPlatform === 'spotify' ? 'Spotify' : 'Apple Music';

  return (
    <div className="track-review-container">
      <div className="review-header">
        <button onClick={onBack} className="btn btn-back">&larr; Back</button>
        <h2>Review Matches</h2>
        <p className="subtitle">
          Converting <strong>{playlistName}</strong> to {platformLabel}
        </p>
      </div>

      <div className="review-summary">
        <span className="badge badge-matched">{matched.length} matched</span>
        <span className="badge badge-review">{needsReview.length} need review</span>
        <span className="badge badge-nomatch">{noMatch.length} not found</span>
      </div>

      {/* Auto-matched tracks */}
      {matched.length > 0 && (
        <section className="review-section">
          <h3>Matched Tracks</h3>
          <ul className="track-list">
            {matched.map((r, i) => (
              <li key={i} className="track-item track-matched">
                {r.match.artwork && <img src={r.match.artwork} alt="" className="track-art" />}
                <div className="track-info">
                  <span className="track-title">{r.source.title}</span>
                  <span className="track-artist">{r.source.artist}</span>
                </div>
                <span className="match-icon">&#10003;</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Needs review */}
      {needsReview.length > 0 && (
        <section className="review-section">
          <h3>Select Correct Match</h3>
          <p className="section-desc">
            These tracks didn't have an exact match. Pick the best option or skip.
          </p>
          {needsReview.map((r) => {
            const idx = matchResults.indexOf(r);
            return (
              <CloseMatchSelector
                key={idx}
                source={r.source}
                alternatives={r.alternatives}
                selected={selections[idx]}
                onSelect={(track) => handleSelect(idx, track)}
                onSkip={() => handleSkip(idx)}
                isSkipped={selections[idx] === null}
              />
            );
          })}
        </section>
      )}

      {/* Not found */}
      {noMatch.length > 0 && (
        <section className="review-section">
          <h3>Not Found</h3>
          <ul className="track-list">
            {noMatch.map((r, i) => (
              <li key={i} className="track-item track-nomatch">
                <div className="track-info">
                  <span className="track-title">{r.source.title}</span>
                  <span className="track-artist">{r.source.artist}</span>
                </div>
                <span className="match-icon">&#10007;</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="review-actions">
        <button
          onClick={handleConfirm}
          className="btn btn-primary"
          disabled={loading || (!allReviewed && needsReview.length > 0)}
        >
          {loading ? 'Creating...' : `Create Playlist on ${platformLabel}`}
        </button>
        {!allReviewed && needsReview.length > 0 && (
          <p className="review-hint">Review all tracks above before continuing.</p>
        )}
      </div>
    </div>
  );
}
