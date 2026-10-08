/**
 * Service for fetching community-verified Intro and End Credits timestamps
 * Powered by TheIntroDB (for Movies & TV Shows) and AniSkip (for Anime)
 */

const timestampCache = new Map();

/**
 * Format seconds into a friendly human-readable time string
 * e.g., 5430 -> "1h 30m 30s", 145 -> "02:25"
 */
export function formatTimestamp(seconds) {
  if (seconds == null || isNaN(seconds)) return null;
  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Fetch timestamps from TheIntroDB API (v3) using TMDb ID
 */
async function fetchTheIntroDb({ tmdbId, isTV = false, season = 1, episode = 1 }, timeoutMs = 4500) {
  if (!tmdbId) return null;
  const numId = parseInt(tmdbId, 10);
  if (isNaN(numId)) return null;

  try {
    let url = `https://api.theintrodb.org/v3/media?tmdb_id=${numId}`;
    if (isTV) {
      url += `&season=${season}&episode=${episode}`;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data) return null;

    const intro = data.intro?.[0]
      ? {
          start: data.intro[0].start_ms != null ? data.intro[0].start_ms / 1000 : 0,
          end: data.intro[0].end_ms != null ? data.intro[0].end_ms / 1000 : null,
          formattedStart: formatTimestamp(data.intro[0].start_ms != null ? data.intro[0].start_ms / 1000 : 0),
          formattedEnd: formatTimestamp(data.intro[0].end_ms != null ? data.intro[0].end_ms / 1000 : null),
        }
      : null;

    const credits = data.credits?.[0]
      ? {
          start: data.credits[0].start_ms != null ? data.credits[0].start_ms / 1000 : null,
          end: data.credits[0].end_ms != null ? data.credits[0].end_ms / 1000 : null,
          formattedStart: formatTimestamp(data.credits[0].start_ms != null ? data.credits[0].start_ms / 1000 : null),
          formattedEnd: formatTimestamp(data.credits[0].end_ms != null ? data.credits[0].end_ms / 1000 : null),
        }
      : null;

    const recap = data.recap?.[0]
      ? {
          start: data.recap[0].start_ms != null ? data.recap[0].start_ms / 1000 : 0,
          end: data.recap[0].end_ms != null ? data.recap[0].end_ms / 1000 : null,
          formattedStart: formatTimestamp(data.recap[0].start_ms != null ? data.recap[0].start_ms / 1000 : 0),
          formattedEnd: formatTimestamp(data.recap[0].end_ms != null ? data.recap[0].end_ms / 1000 : null),
        }
      : null;

    if (!intro && !credits && !recap) return null;

    return {
      intro,
      credits,
      recap,
      source: "TheIntroDB",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch timestamps from AniSkip API (v2) for Anime using MAL ID
 */
async function fetchAniSkip({ malId, episodeNumber = 1 }, timeoutMs = 4000) {
  if (!malId) return null;
  // If malId is formatted like "20/1" (anime/episode), extract the base numeric ID
  const cleanMalId = String(malId).split("/")[0].trim();
  const numMalId = parseInt(cleanMalId, 10);
  if (isNaN(numMalId)) return null;

  try {
    const url = `https://api.aniskip.com/v2/skip-times/${numMalId}/${episodeNumber}?types=op&types=ed&episodeLength=0`;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json?.found || !json?.results) return null;

    let intro = null;
    let credits = null;

    for (const item of json.results) {
      if (item.skipType === "op" && item.interval) {
        intro = {
          start: item.interval.startTime,
          end: item.interval.endTime,
          formattedStart: formatTimestamp(item.interval.startTime),
          formattedEnd: formatTimestamp(item.interval.endTime),
        };
      } else if (item.skipType === "ed" && item.interval) {
        credits = {
          start: item.interval.startTime,
          end: item.interval.endTime,
          formattedStart: formatTimestamp(item.interval.startTime),
          formattedEnd: formatTimestamp(item.interval.endTime),
        };
      }
    }

    if (!intro && !credits) return null;

    return {
      intro,
      credits,
      recap: null,
      source: "AniSkip",
    };
  } catch {
    return null;
  }
}

/**
 * Unified getter for Intro and End Credits timestamps
 */
export async function getMediaTimestamps({
  tmdbId,
  isTV = false,
  season = 1,
  episode = 1,
  malId = null,
  isAnime = false,
}) {
  const cacheKey = `${isAnime ? "anime" : isTV ? "tv" : "movie"}_${tmdbId}_${season}_${episode}_${malId || ""}`;
  if (timestampCache.has(cacheKey)) {
    return timestampCache.get(cacheKey);
  }

  let result = null;

  // 1. Try AniSkip first for anime with MAL ID
  if (isAnime && malId) {
    result = await fetchAniSkip({ malId, episodeNumber: episode });
  }

  // 2. Query TheIntroDB by TMDB ID (or as fallback for anime)
  if (!result && tmdbId) {
    result = await fetchTheIntroDb({ tmdbId, isTV, season, episode });
  }

  timestampCache.set(cacheKey, result);
  return result;
}
