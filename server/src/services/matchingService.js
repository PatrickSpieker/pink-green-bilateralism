import * as spotifyService from './spotifyService.js';
import * as appleMusicService from './appleMusicService.js';

/**
 * Normalize a string for comparison: lowercase, remove punctuation, extra spaces.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check how well two tracks match based on title and artist.
 * Returns a confidence score from 0 to 1.
 */
function matchConfidence(source, candidate) {
  const titleMatch = normalize(source.title) === normalize(candidate.title);
  const artistNorm = normalize(source.artist);
  const candidateArtistNorm = normalize(candidate.artist);
  const artistMatch =
    artistNorm === candidateArtistNorm ||
    candidateArtistNorm.includes(artistNorm) ||
    artistNorm.includes(candidateArtistNorm);

  if (titleMatch && artistMatch) return 1.0;
  if (titleMatch) return 0.7;
  if (artistMatch) return 0.4;
  return 0.1;
}

/**
 * For each source track, search the target platform and find matches.
 *
 * Returns an array of objects:
 * {
 *   source: { title, artist, album, ... },
 *   match: { ... } | null,          // best match if confidence >= threshold
 *   confidence: number,
 *   alternatives: [{ ... }, ...]     // up to 5 close matches
 * }
 */
export async function findMatches(sourceTracks, targetPlatform) {
  const searchFn =
    targetPlatform === 'spotify'
      ? spotifyService.searchTrack
      : appleMusicService.searchTrack;

  const CONFIDENCE_THRESHOLD = 0.9;

  const results = await Promise.all(
    sourceTracks.map(async (source) => {
      try {
        const candidates = await searchFn(source.title, source.artist, 5);

        if (candidates.length === 0) {
          return {
            source,
            match: null,
            confidence: 0,
            alternatives: [],
            status: 'no_match',
          };
        }

        // Score each candidate
        const scored = candidates.map((c) => ({
          ...c,
          confidence: matchConfidence(source, c),
        }));
        scored.sort((a, b) => b.confidence - a.confidence);

        const best = scored[0];

        if (best.confidence >= CONFIDENCE_THRESHOLD) {
          return {
            source,
            match: best,
            confidence: best.confidence,
            alternatives: scored.slice(1),
            status: 'matched',
          };
        }

        // No confident match — present all as alternatives for user to pick
        return {
          source,
          match: null,
          confidence: best.confidence,
          alternatives: scored,
          status: 'needs_review',
        };
      } catch {
        return {
          source,
          match: null,
          confidence: 0,
          alternatives: [],
          status: 'error',
        };
      }
    })
  );

  return results;
}
