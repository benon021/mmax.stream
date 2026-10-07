import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import EndlessMediaGrid from "../components/EndlessMediaGrid";
import MovieCard from "../components/MovieCard";
import { getPopularMovies, searchMovies } from "../services/api";
import "../css/Home.css";

function Home() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const isSearchPage = Boolean(searchQuery);
  const [lastQuery, setLastQuery] = useState(searchQuery || "");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

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
    navigate("/movies", { replace: true });
  };

  const goBack = () => {
    navigate("/movies", { replace: true });
  };

  return (
    <div className="home">
      {!isSearchPage && <HeroSection onSearch={handleSearch} />}

      {/* Search results overlay */}
      {isSearchPage && (
        <div className="search-results-section">
          <div className="search-page-toolbar">
            <button className="search-back-btn" onClick={goBack} aria-label="Go back">
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
            <div className="search-page-heading">
              <span className="search-page-kicker">mmax.stream discovery</span>
              <h1>Search results</h1>
              <p>&ldquo;{lastQuery}&rdquo; {searching ? "• Searching" : `• ${searchResults?.length || 0} results`}</p>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                clearSearch();
              }}
              className="search-clear-inline"
              type="button"
            >
              ✕ Clear
            </button>
          </div>
          {searching && <div className="loading">Searching...</div>}
          {searchError && <div className="error-message">{searchError}</div>}
          {!searching && searchResults?.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>No results found.</p>
          )}
          <div className="movies-grid">
            {searchResults?.map((movie) => (
              <MovieCard key={movie.id} movie={movie} variant="grid" />
            ))}
          </div>
        </div>
      )}

      {/* Endless drag of movies (replaces categorized rows) */}
      {!isSearchPage && (
        <EndlessMediaGrid fetchFn={getPopularMovies} mediaType="movie" />
      )}
    </div>
  );
}

export default Home;
