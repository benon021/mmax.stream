import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "../css/Navbar.css";
import MovieCard from "./MovieCard";
import MovieModal from "./MovieModal";
import { searchMovies } from "../services/api";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Movies", to: "/movies" },
  { label: "TV Series", to: "/tv-shows" },
  { label: "Anime", to: "/anime" },
  { label: "Favourites", to: "/favorites" },
  { label: "People", to: "/people" },
  { label: "Awards", to: "/awards" },
];

import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

function NavBar({ onSearch, isScrolled, isAtTop }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchExpanding, setSearchExpanding] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "G";

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

  const handleLinkClick = () => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const openSearch = () => {
    setSearchExpanding(true);
    setTimeout(() => {
      setSearchOpen(true);
      setSearchExpanding(false);
    }, 400); 
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchExpanding(false);
  };

  return (
    <>
      <nav className={`navbar ${isAtTop ? "is-at-top" : !isScrolled ? "is-liquid" : "is-scrolled"} ${mobileMenuOpen ? "is-menu-open" : ""} ${searchExpanding ? "search-animating" : ""}`}>
        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          <span className="mmax-logo-combined">
            <span className="logo-m">m</span>
            <span className="logo-text">max.stream</span>
          </span>
        </Link>

        {/* ── Navigation Links (Desktop) ── */}
        <div className="navbar-links">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`nav-link ${isActive(item.to) ? "active-link" : ""}`}
              onClick={handleLinkClick}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ── Right Actions ── */}
        <div className="navbar-actions">
          <button
            className={`nav-action-btn search-trigger ${searchExpanding ? "is-active" : ""}`}
            onClick={openSearch}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          
          <button 
            className="nav-action-btn profile-trigger" 
            title={user.isAuthenticated ? `Profile: ${user.name}` : "Sign In"}
            onClick={() => navigate("/login")}
          >
            <div className="user-avatar">{userInitial}</div>
          </button>
          
          <button
            className={`hamburger ${mobileMenuOpen ? "is-active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <div className="hamburger-container">
              <span className="bar top"></span>
              <span className="bar middle"></span>
              <span className="bar bottom"></span>
            </div>
          </button>
        </div>

        {/* ── Mobile Nav Overlay ── */}
        <div className={`mobile-nav-overlay ${mobileMenuOpen ? "is-visible" : ""}`}>
          <div className="mobile-nav-header">
            <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
              <span className="mmax-logo-combined">
                <span className="logo-m">m</span>
                <span className="logo-text">max.stream</span>
              </span>
            </Link>
            <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="28" height="28">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="mobile-nav-content">
            <div className="mobile-nav-links-grid">
              {NAV_LINKS.map((item, index) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`mobile-nav-link ${isActive(item.to) ? "active" : ""}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={handleLinkClick}
                >
                  <span className="mobile-link-num">0{index + 1}</span>
                  <span className="mobile-link-text">{item.label}</span>
                  <svg className="mobile-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
            
            <div className="mobile-nav-footer">
              <p>© 2026 MMax.Stream • Premium Cinema</p>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-top-bar" onClick={(e) => e.stopPropagation()}>
            <form
              className="floating-search-bar"
              onSubmit={handleSubmit}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery("")}
                  title="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="search-cancel-btn"
                  onClick={closeSearch}
                  title="Close search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </form>
          </div>

          <div className="search-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-results-grid">
              {loading && <div className="search-loading">Searching...</div>}
              {!loading && results.length > 0 && (
                results.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    variant="grid"
                    onSelect={(m) => {
                      setSelectedMovie(m);
                      setSearchOpen(false);
                    }}
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