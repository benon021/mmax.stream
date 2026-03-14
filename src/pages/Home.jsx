import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import MovieRow from "../components/MovieRow";
import MovieCard from "../components/MovieCard";
import {
  getTrendingAll,
  getPopularMovies,
  getPopularTV,
  getMoviesInTheatres,
  getMoviesForRent,
  getFreeMovies,
  getFreeTV,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
} from "../services/api";
import { getAllProgress } from "../services/progress";
import "../css/Home.css";



// Section configs — focused categories for higher visibility
const trendingTodayConfig = [
  { label: "Today", fetchFn: () => getTrendingAll("day") },
];

const trendingWeekConfig = [
  { label: "This Week", fetchFn: () => getTrendingAll("week") },
];

const trendingMoviesConfig = [
  { label: "Movies", fetchFn: () => getTrendingAll("week").then(res => res.filter(m => m.media_type === "movie")) },
];

const trendingTVConfig = [
  { label: "TV Shows", fetchFn: () => getTrendingAll("week").then(res => res.filter(m => m.media_type === "tv")) },
];

const popularTabs = [
  { label: "Streaming", fetchFn: getPopularMovies },
  { label: "On TV", fetchFn: getPopularTV },
  { label: "For Rent", fetchFn: getMoviesForRent },
  { label: "In Theatres", fetchFn: getMoviesInTheatres },
];

const freeTabs = [
  { label: "Movies", fetchFn: getFreeMovies },
  { label: "TV", fetchFn: getFreeTV },
];

const continueWatchingTabs = [
  { label: "Recent", fetchFn: async () => getAllProgress() },
];


function Home() {
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = useCallback(async (query) => {
    if (!query) {
      setSearchResults(null);
      return;
    }
    setLastQuery(query);
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchMovies(query);
      setSearchResults(results || []);
    } catch {
      setSearchError("Failed to search. Please try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      handleSearch(q);
    } else {
      setSearchResults(null);
    }
  }, [searchParams, handleSearch]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSearchResults(null);
        setSearchParams({});
      }
    };
    if (searchResults !== null) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [searchResults, setSearchParams]);

  const clearSearch = () => {
    setSearchResults(null);
    setSearchParams({});
  };

  return (
    <div className="home" onClick={() => searchResults && clearSearch()}>
      <HeroSection onSearch={handleSearch} />

      {/* Search results overlay */}
      {searchResults !== null && (
        <div className="search-results-section" onClick={(e) => e.stopPropagation()}>
          <h2>
            Search results for &ldquo;{lastQuery}&rdquo;
            <button
              onClick={clearSearch}
              className="search-clear-inline"
            >
              ✕ Clear
            </button>
          </h2>
          {searching && <div className="loading">Searching...</div>}
          {searchError && <div className="error-message">{searchError}</div>}
          {!searching && searchResults.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No results found.</p>
          )}
          <div className="movies-grid">
            {searchResults.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Sections (hidden during search) */}
      {searchResults === null && (
        <>
          <MovieRow title="Continue Watching" tabs={continueWatchingTabs} />
          <div className="section-divider" />
          
          <MovieRow title="Trending Today" tabs={trendingTodayConfig} />
          <div className="section-divider" />
          
          <MovieRow title="Trending This Week" tabs={trendingWeekConfig} />
          <div className="section-divider" />

          <MovieRow title="Trending Movies" tabs={trendingMoviesConfig} />
          <div className="section-divider" />

          <MovieRow title="Trending TV Shows" tabs={trendingTVConfig} />
          <div className="section-divider" />

          <MovieRow title="What's Popular" tabs={popularTabs} />
          <div className="section-divider" />

          <MovieRow title="Free To Watch" tabs={freeTabs} />
          <div className="section-divider" />

          <MovieRow
            title="Upcoming Movies"
            tabs={[{ label: "Latest", fetchFn: getUpcomingMovies }]}
          />
          <div className="section-divider" />

          <MovieRow
            title="Top Rated"
            tabs={[{ label: "Movies", fetchFn: getTopRatedMovies }]}
          />
        </>
      )}
    </div>
  );
}

export default Home;
