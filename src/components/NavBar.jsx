import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "../css/Navbar.css";
import MovieCard from "./MovieCard";
import MovieModal from "./MovieModal";
import { searchMovies } from "../services/api";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { 
    label: "Movies", 
    to: "/",
    subItems: [
      { label: "Featured", to: "/?type=featured" },
      { label: "Popular", to: "/?type=popular" },
      { label: "Top Rated", to: "/?type=top_rated" },
      { label: "Upcoming", to: "/?type=upcoming" },
      { label: "Anime", to: "/?genre=anime" }
    ]
  },
  { 
    label: "TV Series", 
    to: "/tv-shows",
    subItems: [
      { label: "Popular", to: "/tv-shows?type=popular" },
      { label: "Airing Today", to: "/tv-shows?type=airing_today" },
      { label: "On the Air", to: "/tv-shows?type=on_the_air" },
      { label: "Top Rated", to: "/tv-shows?type=top_rated" }
    ]
  },
  { 
    label: "Genres", 
    to: null,
    subItems: [
      { label: "Action", to: "/?genre=action" },
      { label: "Adventure", to: "/?genre=adventure" },
      { label: "Animation", to: "/?genre=animation" },
      { label: "Comedy", to: "/?genre=comedy" },
      { label: "Crime", to: "/?genre=crime" },
      { label: "Documentary", to: "/?genre=documentary" },
      { label: "Drama", to: "/?genre=drama" },
      { label: "Family", to: "/?genre=family" }
    ]
  },
  { label: "Favourites", to: "/favorites" },
  { label: "People", to: "/people" },
  { label: "Awards", to: "/awards" },
  { label: "More", to: null },
];

function NavBar({ onSearch, isScrolled }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
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

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setExpandedSection(null);
    setSearchOpen(false);
  };

  const toggleSection = (label) => {
    setExpandedSection(expandedSection === label ? null : label);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className={`navbar ${!isScrolled ? "is-liquid" : ""}`}>
        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          <span className="mmax-logo-combined">
            <span className="logo-m">m</span>
            <span className="logo-text">max.stream</span>
          </span>
        </Link>

        {/* ── Hamburger Menu (Mobile) ── */}
        <button 
          className={`hamburger ${mobileMenuOpen ? "is-active" : ""}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>

        {/* ── Mobile Nav Overlay ── */}
        <div className={`navbar-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="mobile-menu-scroll">
            {/* Logo in Menu */}
            <div className="mobile-menu-branding">
              <span className="mmax-logo-combined">
                <span className="logo-m">m</span>
                <span className="logo-text">max.stream</span>
              </span>
            </div>

            {/* Search in Menu */}
            <div className="mobile-menu-search">
              <form onSubmit={handleSubmit} className="mobile-search-form">
                <input
                  type="text"
                  placeholder="Search movies, tv, people..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mobile-search-input"
                />
                <button type="submit" className="mobile-search-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </form>
            </div>

            <div className="mobile-links-container">
              {NAV_LINKS.map((item) => {
              const hasSub = item.subItems && item.subItems.length > 0;
              const isSectionExpanded = expandedSection === item.label;

              return (
                <div key={item.label} className="nav-item-wrap">
                  <div className="nav-main-link-row">
                    {item.to ? (
                      <Link
                        to={item.to}
                        className={`nav-link ${isActive(item.to) ? "active-link" : ""}`}
                        onClick={handleLinkClick}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="nav-link non-link" onClick={() => hasSub && toggleSection(item.label)}>
                        {item.label}
                      </span>
                    )}
                    
                    {hasSub && (
                      <button 
                        className={`sub-toggle-btn ${isSectionExpanded ? "is-rotated" : ""}`}
                        onClick={() => toggleSection(item.label)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    )}
                  </div>

                  {hasSub && isSectionExpanded && (
                    <div className="sub-menu-grid">
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.to}
                          className="sub-nav-link"
                          onClick={handleLinkClick}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
          <div className="search-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-logo-wrapper">
              <span className="navbar-logo">
                <span className="logo-m">m</span>
                <span className="logo-text">max.stream</span>
              </span>
            </div>
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
                placeholder="Search..."
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