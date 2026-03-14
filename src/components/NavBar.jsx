import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "../css/Navbar.css";
import MovieCard from "./MovieCard";
import { searchMovies } from "../services/api";

const NAV_LINKS = [
  { label: "Movies", to: "/" },
  { label: "TV Shows", to: "/tv-shows" },
  { label: "Favourites", to: "/favorites" },
  { label: "People", to: "/people" },
  { label: "Awards", to: null },
  { label: "More", to: null },
];

function NavBar({ onSearch, isScrolled }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const location = useLocation();

  const fetchResults = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMovies(q);
      setResults(data || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, searchOpen, fetchResults]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch && onSearch(query.trim());
      setSearchOpen(false);
    }
  };

  const isActive = (path) => path && location.pathname === path;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    if (searchOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [searchOpen]);

  return (
    <>
      <nav className={`navbar ${!isScrolled ? "is-liquid" : ""}`}>
        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo" onClick={() => setSearchOpen(false)}>
          <span className="logo-wordmark">REELIT</span>
          <span className="logo-dot" />
        </Link>

        {/* ── Nav Links (Netflix Smooth) ── */}
        <div className="navbar-links">
          {NAV_LINKS.map((item) => {
            const cls = `nav-link ${isActive(item.to) ? "active-link" : ""}`;

            return item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={cls}
                onClick={() => setSearchOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className={cls}
                style={{ cursor: "default" }}
              >
                {item.label}
              </span>
            );
          })}
        </div>

        {/* ── Right Actions ── */}
        <div className="navbar-actions">
          <button className="nav-action-btn" title="Add content">＋</button>
          <span className="lang-pill">EN</span>
          <button className="nav-action-btn" title="Notifications">🔔</button>
          <div className="user-avatar" title="papsii">P</div>
          <button
            className="nav-action-btn search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-container">
            <form
              className="floating-search-bar"
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search movies, series, tv shows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery("")}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </form>

            <div className="search-results-grid">
              {loading && <div className="search-loading">Searching...</div>}
              {!loading && results.length > 0 && (
                results.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onSelect={(m) => setSelectedMovie(m)}
                  />
                ))
              )}
              {!loading && query && results.length === 0 && (
                <div className="search-no-results">No results found for "{query}"</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </>
  );
}

export default NavBar;