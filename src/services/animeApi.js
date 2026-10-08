import { getCachedAnime, setCachedAnime, getCachedEpisodes, setCachedEpisodes } from "./supabase";

// Service connecting MMAX to HiAnime API (Live Vercel backend with automatic fallbacks)
const PROD_ANIME_API = "https://mmax-anime-api.vercel.app/api/v2";
const PRIMARY_HIANIME_URL = import.meta.env.VITE_ANIME_API_URL || PROD_ANIME_API;

const searchCache = new Map();
const episodesCache = new Map();

/**
 * Perform search request with prioritized endpoint fallbacks
 */
async function fetchFromApi(endpoint, timeoutMs = 5000) {
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  // Endpoint order:
  // 1. PRIMARY_HIANIME_URL (defaults to live Vercel backend https://mmax-anime-api.vercel.app/api/v2)
  // 2. /api/v2 (proxied via vercel.json rewrite or vite dev server)
  // 3. Fallback direct to PROD_ANIME_API if PRIMARY was different
  // 4. http://localhost:5000/api/v2 ONLY when in local development
  const candidates = [
    PRIMARY_HIANIME_URL,
    "/api/v2",
    PROD_ANIME_API,
    isLocalDev ? "http://localhost:5000/api/v2" : null,
  ].filter((url, index, self) => url && self.indexOf(url) === index);

  for (const baseUrl of candidates) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return await res.json();
        }
      }
    } catch {
      // Continue to next available endpoint
    }
  }

  console.warn(`[AnimeAPI] Endpoint ${endpoint} unreachable across all sources.`);
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

    // Try Supabase database cache for instant loading
    const cloudCached = await getCachedAnime(clean);
    if (cloudCached && cloudCached.length > 0) {
      searchCache.set(cacheKey, cloudCached);
      return cloudCached;
    }

    const json = await fetchFromApi(`/search?keyword=${encodeURIComponent(clean)}`, 3500);
    const results = json?.data?.response || [];
    if (results.length > 0) {
      searchCache.set(cacheKey, results);
      setCachedAnime(clean, results);
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

  // Try Supabase database cache for instant loading
  const cloudCached = await getCachedEpisodes(animeId);
  if (cloudCached && cloudCached.length > 0) {
    episodesCache.set(animeId, cloudCached);
    return cloudCached;
  }

  const json = await fetchFromApi(`/episodes/${encodeURIComponent(animeId)}`, 4500);
  const list = json?.data || [];
  if (list.length > 0) {
    episodesCache.set(animeId, list);
    setCachedEpisodes(animeId, list);
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
