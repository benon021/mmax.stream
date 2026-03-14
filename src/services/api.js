const API_KEY = "3c0c9ed9dc5ae2163e62aa7f288fa6de";
const BASE_URL = "https://api.themoviedb.org/3";

// ── Movies ──────────────────────────────────────────────
export const getPopularMovies = async () => {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const searchMovies = async (query) => {
  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.results;
};

// ── Trending ─────────────────────────────────────────────
export const getTrendingMovies = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getTrendingTV = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getTrendingAll = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

// ── What's Popular ───────────────────────────────────────
export const getPopularTV = async () => {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getMoviesInTheatres = async () => {
  const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getMoviesForRent = async () => {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_release_type=4&sort_by=popularity.desc`
  );
  const data = await res.json();
  return data.results;
};

// ── Free To Watch ────────────────────────────────────────
export const getFreeMovies = async () => {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=100`
  );
  const data = await res.json();
  return data.results;
};

export const getFreeTV = async () => {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=100`
  );
  const data = await res.json();
  return data.results;
};

// ── TV Shows ─────────────────────────────────────────────
export const getAiringTodayTV = async () => {
  const res = await fetch(`${BASE_URL}/tv/airing_today?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getOnAirTV = async () => {
  const res = await fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getTopRatedTV = async () => {
  const res = await fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getTopRatedMovies = async () => {
  const res = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getUpcomingMovies = async () => {
  const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getMovieDetails = async (id, type = "movie") => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,release_dates,content_ratings`
  );
  return res.json();
};

export const getSeasonDetails = async (tvId, seasonNumber) => {
  const res = await fetch(
    `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`
  );
  return res.json();
};

export const getSimilarContent = async (id, type = "movie") => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`
  );
  const data = await res.json();
  return data.results;
};