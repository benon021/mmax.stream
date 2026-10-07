const API_KEY = "3c0c9ed9dc5ae2163e62aa7f288fa6de";
const BASE_URL = "https://api.themoviedb.org/3";

// ── Movies ──────────────────────────────────────────────
export const getPopularMovies = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const searchMovies = async (query) => {
  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return (data.results || []).filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );
};

// ── Trending ─────────────────────────────────────────────
export const getTrendingMovies = async (timeWindow = "day", page = 1) => {
  const res = await fetch(`${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}&language=en-US&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const getTrendingTV = async (timeWindow = "day", page = 1) => {
  const res = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const getTrendingAll = async (timeWindow = "day", page = 1) => {
  const res = await fetch(`${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US&page=${page}`);
  const data = await res.json();
  return data.results;
};

// ── What's Popular ───────────────────────────────────────
export const getPopularTV = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const getMoviesInTheatres = async () => {
  const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
};

export const getLatestMovies = async () => {
  const [nowPlaying, upcoming] = await Promise.all([
    getMoviesInTheatres(),
    getUpcomingMovies(),
  ]);

  const moviesById = new Map(
    [...(nowPlaying || []), ...(upcoming || [])].map((movie) => [movie.id, movie])
  );

  return [...moviesById.values()]
    .filter((movie) => movie.backdrop_path || movie.poster_path)
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
    .slice(0, 40);
};

export const getMoviesForRent = async () => {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_release_type=4&sort_by=popularity.desc`
  );
  const data = await res.json();
  return data.results;
};

// ── Free To Watch ────────────────────────────────────────
export const getFreeMovies = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`
  );
  const data = await res.json();
  return data.results;
};

export const getFreeTV = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=100&page=${page}`
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

export const getTopRatedTV = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&page=${page}`);
  const data = await res.json();
  return data.results;
};

export const getTopRatedMovies = async (page = 1) => {
  const res = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`);
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
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=videos,release_dates,content_ratings,credits,reviews,external_ids,recommendations,images&include_image_language=en,null&language=en-US`
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

export const getTrendingTVWithVideos = async (timeWindow = "day") => {
  const res = await fetch(`${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}&language=en-US`);
  const data = await res.json();

  const candidates = data.results.slice(0, 20);

  const detailedTV = await Promise.all(
    candidates.map(async (tv) => {
      const details = await getMovieDetails(tv.id, "tv");
      const videos = details.videos?.results || [];
      const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos[0];
      return {
        ...tv,
        tmdb_id: tv.id,
        youtube_key: trailer?.key || null,
        media_type: "tv"
      };
    })
  );

  const withTrailers = shuffleArray(detailedTV.filter((t) => t.youtube_key));
  return withTrailers.slice(0, 10);
};

export const getTopRatedTVWithVideos = async () => {
  const [topRatedRes, popularRes] = await Promise.all([
    fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`).catch(() => null),
    fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`).catch(() => null),
  ]);

  const topRatedData = topRatedRes ? await topRatedRes.json() : { results: [] };
  const popularData = popularRes ? await popularRes.json() : { results: [] };

  const allShows = [...(topRatedData.results || []), ...(popularData.results || [])];
  const uniqueShows = allShows
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .filter((t) => t.backdrop_path || t.poster_path)
    .slice(0, 25);

  const detailedTV = await Promise.all(
    uniqueShows.map(async (tv) => {
      try {
        const details = await getMovieDetails(tv.id, "tv");
        const videos = details.videos?.results || [];
        const trailer =
          videos.find((v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube") ||
          videos[0];
        return {
          ...tv,
          tmdb_id: tv.id,
          youtube_key: trailer?.key || null,
          media_type: "tv",
        };
      } catch {
        return {
          ...tv,
          tmdb_id: tv.id,
          youtube_key: null,
          media_type: "tv",
        };
      }
    })
  );

  const withTrailers = shuffleArray(detailedTV.filter((t) => t.youtube_key));
  const withoutTrailers = shuffleArray(detailedTV.filter((t) => !t.youtube_key));

  return [...withTrailers, ...withoutTrailers].slice(0, 15);
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

// ── Anime ───────────────────────────────────────────────
const ANIME_GENRE_ID = 16;
const JAPAN_LANG = "ja";

export const getPopularAnime = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${ANIME_GENRE_ID}&with_original_language=${JAPAN_LANG}&sort_by=popularity.desc&language=en-US&page=${page}`
  );
  const data = await res.json();
  return data.results;
};

export const getTrendingAnime = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&with_genres=${ANIME_GENRE_ID}&language=en-US&page=${page}`
  );
  const data = await res.json();
  // Filter for animation/anime manually if trending endpoint doesn't support with_genres
  return data.results.filter(item => item.genre_ids?.includes(ANIME_GENRE_ID));
};

export const getTopRatedAnime = async (page = 1) => {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${ANIME_GENRE_ID}&with_original_language=${JAPAN_LANG}&sort_by=vote_average.desc&vote_count.gte=100&language=en-US&page=${page}`
  );
  const data = await res.json();
  return data.results;
};

export const getTopRatedAnimeWithVideos = async () => {
  const [topRatedRes, popularRes] = await Promise.all([
    fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${ANIME_GENRE_ID}&with_original_language=${JAPAN_LANG}&sort_by=vote_average.desc&vote_count.gte=100&language=en-US&page=1`
    ).catch(() => null),
    fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${ANIME_GENRE_ID}&with_original_language=${JAPAN_LANG}&sort_by=popularity.desc&language=en-US&page=1`
    ).catch(() => null),
  ]);

  const topRatedData = topRatedRes ? await topRatedRes.json() : { results: [] };
  const popularData = popularRes ? await popularRes.json() : { results: [] };

  const allAnime = [...(topRatedData.results || []), ...(popularData.results || [])];
  const uniqueAnime = allAnime
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .filter((t) => t.backdrop_path || t.poster_path)
    .slice(0, 25);

  const detailedAnime = await Promise.all(
    uniqueAnime.map(async (anime) => {
      try {
        const details = await getMovieDetails(anime.id, "tv");
        const videos = details.videos?.results || [];
        const trailer =
          videos.find(
            (v) =>
              (v.type === "Trailer" || v.type === "Teaser") &&
              v.site === "YouTube" &&
              (v.name.toLowerCase().includes("english") || v.name.toLowerCase().includes("dub"))
          ) ||
          videos.find((v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube") ||
          videos[0];

        return {
          ...anime,
          tmdb_id: anime.id,
          youtube_key: trailer?.key || null,
          media_type: "tv",
        };
      } catch {
        return {
          ...anime,
          tmdb_id: anime.id,
          youtube_key: null,
          media_type: "tv",
        };
      }
    })
  );

  const withTrailers = shuffleArray(detailedAnime.filter((a) => a.youtube_key));
  const withoutTrailers = shuffleArray(detailedAnime.filter((a) => !a.youtube_key));

  return [...withTrailers, ...withoutTrailers].slice(0, 15);
};

export const getTrendingAnimeWithVideos = getTopRatedAnimeWithVideos;
export const getAnimeHeaderContent = getTopRatedAnimeWithVideos;