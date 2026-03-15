const API_KEY = "3c0c9ed9dc5ae2163e62aa7f288fa6de";
const BASE_URL = "https://api.themoviedb.org/3";

// ── Movies ──────────────────────────────────────────────
export const getPopularMovies = async () => {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US`);
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
  const res = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&language=en-US`);
  const data = await res.json();
  return data.results;
};

export const getTrendingTV = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getTrendingAll = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US`);
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
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,release_dates,content_ratings,credits,reviews,external_ids,recommendations&language=en-US`
  );
  return res.json();
};

export const getPopularPeople = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/person/popular?api_key=${API_KEY}&language=en-US&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const getPersonDetails = async (id) => {
  const res = await fetch(`${BASE_URL}/person/${id}?api_key=${API_KEY}&append_to_response=combined_credits,external_ids&language=en-US`);
  return res.json();
};

function shuffleArray(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const getTrendingWithVideos = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&language=en-US`);
  const data = await res.json();

  // Grab more items so we can reliably end up with 10 that have trailers
  const candidates = data.results.slice(0, 20);

  const detailedMovies = await Promise.all(
    candidates.map(async (movie) => {
      const details = await getMovieDetails(movie.id, "movie");
      const videos = details.videos?.results || [];
      const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos[0];
      return {
        ...movie,
        tmdb_id: movie.id,
        youtube_key: trailer?.key || null,
        media_type: "movie"
      };
    })
  );

  // Randomize order so each load shows a different sequence
  const withTrailers = shuffleArray(detailedMovies.filter((m) => m.youtube_key));
  return withTrailers.slice(0, 10);
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