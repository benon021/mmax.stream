// Service connecting MMAX to local HiAnime API (or custom hosted Vercel instance)
const PRIMARY_HIANIME_URL = import.meta.env.VITE_ANIME_API_URL || "/api/v2";
const FALLBACK_HIANIME_URL = "http://localhost:5000/api/v2";

const searchCache = new Map();
const episodesCache = new Map();

/**
 * Perform search request with proxy and direct localhost fallback
 */
async function fetchFromApi(endpoint, timeoutMs = 4000) {
  // Try proxy first (/api/v2/...), then fallback to direct localhost:5000
  try {
    const res = await fetch(`${PRIMARY_HIANIME_URL}${endpoint}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return await res.json();
  } catch {
    // Attempt fallback directly to port 5000
  }

  try {
    const res = await fetch(`${FALLBACK_HIANIME_URL}${endpoint}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`[AnimeAPI] Endpoint ${endpoint} unreachable:`, err.message);
  }

  return null;
}

/**
 * Find best matching anime from search results
 * @param {Array} results 
 * @param {string} searchTitle 
 * @returns {Object|null}
 */
export function findBestAnimeMatch(results, searchTitle) {
  if (!results || results.length === 0) return null;
  const target = searchTitle.trim().toLowerCase();

  // 1. Exact match on title or alternativeTitle
  const exact = results.find(
    (r) =>
      r.title?.trim().toLowerCase() === target ||
      r.alternativeTitle?.trim().toLowerCase() === target
  );
  if (exact) return exact;

  // 2. Exact match ignoring punctuation
  const cleanTarget = target.replace(/[^\w\s]/g, "").trim();
  const cleanMatch = results.find((r) => {
    const cleanR = (r.title || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
    return cleanR === cleanTarget;
  });
  if (cleanMatch) return cleanMatch;

  // 3. Starts with target or title contains target (prefer TV / ONA)
  const tvMatch = results.find(
    (r) =>
      (r.title?.toLowerCase().includes(target) || target.includes(r.title?.toLowerCase())) &&
      (r.type === "TV" || r.type === "ONA")
  );
  if (tvMatch) return tvMatch;

  // 4. Fallback to first result
  return results[0];
}

/**
 * Search anime on local HiAnime API
 * @param {string} title 
 * @param {number} [season=1]
 * @returns {Promise<Array>}
 */
export async function searchAnimeHiAnime(title, season = 1) {
  if (!title) return [];
  
  const querySearch = async (rawQuery) => {
    const clean = rawQuery
      .replace(/[^\w\s]/gi, " ")
      .trim()
      .replace(/\s+/g, " ");
    const cacheKey = clean.toLowerCase();
    if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

    const json = await fetchFromApi(`/search?keyword=${encodeURIComponent(clean)}`, 3500);
    const results = json?.data?.response || [];
    if (results.length > 0) {
      searchCache.set(cacheKey, results);
    }
    return results;
  };

  // 1. If season > 1, first try searching with season (e.g. "Attack on Titan Season 2")
  if (season > 1) {
    const seasonQuery = `${title} Season ${season}`;
    const seasonResults = await querySearch(seasonQuery);
    if (seasonResults && seasonResults.length > 0) return seasonResults;
  }

  // 2. Base title query
  return await querySearch(title);
}

/**
 * Fetch episode roster for an anime from local HiAnime API
 * @param {string} animeId 
 * @returns {Promise<Array>}
 */
export async function getHiAnimeEpisodes(animeId) {
  if (!animeId) return [];
  if (episodesCache.has(animeId)) return episodesCache.get(animeId);

  const json = await fetchFromApi(`/episodes/${encodeURIComponent(animeId)}`, 4500);
  const list = json?.data || [];
  if (list.length > 0) {
    episodesCache.set(animeId, list);
  }
  return list;
}

/**
 * Build direct anime stream embed URL for Sub or Dub
 * @param {Object} opts
 * @param {string} [opts.aniId]
 * @param {string} [opts.episodeId]
 * @param {"sub"|"dub"} [opts.audio]
 * @param {"4animo"|"flixera"} [opts.server]
 * @returns {string}
 */
export function getAnimeEmbedUrl({ aniId, episodeId, audio = "sub", server = "4animo" }) {
  const type = audio === "dub" ? "dub" : "sub";
  if (server === "flixera") {
    const target = aniId ? `ani/${aniId}` : episodeId;
    return `https://flixera.co/embed/${target}/${type}?autoplay=0&skipintro=0&skipoutro=0`;
  }
  // Default: 4Animo (HD)
  const target = aniId ? `ani/${aniId}` : episodeId;
  return `https://cdn.4animo.xyz/embed/hd-2/${target}/${type}?k=1&autoPlay=0&skipIntro=0&skipOutro=0`;
}
