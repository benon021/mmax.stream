import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * ── Anime & Episode Database Caching ──────────────────────────
 * Caches anime search results and episode manifests in Supabase
 * so anime loads instantly with zero scraper delay.
 */

export async function getCachedAnime(query) {
  if (!isSupabaseConfigured || !query) return null;
  try {
    const key = query.trim().toLowerCase();
    const { data, error } = await supabase
      .from("anime_search_cache")
      .select("results, updated_at")
      .eq("query", key)
      .maybeSingle();

    if (error || !data) return null;
    return data.results;
  } catch (err) {
    console.warn("[Supabase] Failed to fetch cached anime search:", err.message);
    return null;
  }
}

export async function setCachedAnime(query, results) {
  if (!isSupabaseConfigured || !query || !results?.length) return;
  try {
    const key = query.trim().toLowerCase();
    await supabase.from("anime_search_cache").upsert({
      query: key,
      results,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase] Failed to save anime search to cache:", err.message);
  }
}

export async function getCachedEpisodes(animeId) {
  if (!isSupabaseConfigured || !animeId) return null;
  try {
    const { data, error } = await supabase
      .from("anime_episodes_cache")
      .select("episodes, updated_at")
      .eq("anime_id", animeId)
      .maybeSingle();

    if (error || !data) return null;
    return data.episodes;
  } catch (err) {
    console.warn("[Supabase] Failed to fetch cached episodes:", err.message);
    return null;
  }
}

export async function setCachedEpisodes(animeId, episodes) {
  if (!isSupabaseConfigured || !animeId || !episodes?.length) return;
  try {
    await supabase.from("anime_episodes_cache").upsert({
      anime_id: animeId,
      episodes,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase] Failed to save episodes to cache:", err.message);
  }
}

/**
 * ── Cloud Watch Progress & Favorites ──────────────────────────
 */

export async function saveCloudWatchProgress(movieId, progressData) {
  if (!isSupabaseConfigured) return;
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || "anonymous";

    await supabase.from("watch_progress").upsert({
      user_id: userId,
      movie_id: String(movieId),
      progress: progressData,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Supabase] Failed to save cloud watch progress:", err.message);
  }
}

export async function loadCloudWatchProgress(movieId) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || "anonymous";

    const { data, error } = await supabase
      .from("watch_progress")
      .select("progress")
      .eq("user_id", userId)
      .eq("movie_id", String(movieId))
      .maybeSingle();

    if (error || !data) return null;
    return data.progress;
  } catch (err) {
    console.warn("[Supabase] Failed to load cloud watch progress:", err.message);
    return null;
  }
}
