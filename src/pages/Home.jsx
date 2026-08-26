/*  */import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  searchMovies,
} from "../services/api";
import { getAllProgress } from "../services/progress";
import "../css/Home.css";



// Tab configs — defined outside component so references are stable
const trendingTabs = [
  { label: "Today", fetchFn: (page) => getTrendingAll("day", page) },
  { label: "This Week", fetchFn: (page) => getTrendingAll("week", page) },
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
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("Trending");
  const isSearchPage = Boolean(searchParams.get("search"));

  const sections = [
    { id: "Continue Watching", label: "Continue Watching" },
    { id: "Trending", label: "Trending" },
    { id: "What's Popular", label: "What's Popular" },
    { id: "Free To Watch", label: "Free To Watch" },
    { id: "Top Rated", label: "Top Rated" },
  ];

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

      {/* Sections (hidden during search) */}
      {!isSearchPage && (
        <>
          <div className="top-sections-tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`section-tab-btn ${activeSection === section.id ? "active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="section-content">
            {activeSection === "Continue Watching" && (
              <MovieRow title="Continue Watching" tabs={continueWatchingTabs} layout="grid" />
            )}
            {activeSection === "Trending" && (
              <MovieRow title="Trending" tabs={trendingTabs} layout="grid" />
            )}
            {activeSection === "What's Popular" && (
              <MovieRow title="What's Popular" tabs={popularTabs} layout="grid" />
            )}
            {activeSection === "Free To Watch" && (
              <MovieRow title="Free To Watch" tabs={freeTabs} layout="grid" />
            )}
            {activeSection === "Top Rated" && (
              <MovieRow
                title="Top Rated"
                tabs={[{ label: "Movies", fetchFn: getTopRatedMovies }]}
                layout="grid"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
