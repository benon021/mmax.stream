import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "../css/Navbar.css";
import MovieCard from "./MovieCard";
import MovieModal from "./MovieModal";
import { searchMovies } from "../services/api";
import brandLogo from "../assets/mmax-stream-logo.svg";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Movies", to: "/movies" },
  { label: "TV Series", to: "/tv-shows" },
  { label: "Anime", to: "/anime" },
  { label: "Favourites", to: "/favorites" },
  { label: "People", to: "/people" },
  { label: "Awards", to: "/awards" },
];

const MOBILE_CATEGORIES = [
  {
    id: "movies",
    label: "Movies",
    icon: "movies",
    subLinks: [
      { label: "Release Calendar", to: "/movies" },
      { label: "Top 250 Movies", to: "/movies" },
      { label: "Most Popular Movies", to: "/movies" },
      { label: "Browse Movies by Genre", to: "/movies" },
    ],
  },
  {
    id: "tv-shows",
    label: "TV shows",
    icon: "tv",
    subLinks: [
      { label: "What's on TV & Streaming", to: "/tv-shows" },
      { label: "Top 250 TV Shows", to: "/tv-shows" },
      { label: "Most Popular TV Shows", to: "/tv-shows" },
      { label: "Anime Series", to: "/anime" },
    ],
  },
  {
    id: "watch",
    label: "Watch",
    icon: "watch",
    subLinks: [
      { label: "What to Watch", to: "/movies" },
      { label: "Watchlist & Favourites", to: "/favorites" },
      { label: "Anime Hub", to: "/anime" },
      { label: "Home Showcase", to: "/" },
    ],
  },
  {
    id: "awards",
    label: "Awards & events",
    icon: "awards",
    subLinks: [
      { label: "Oscars", to: "/awards" },
      { label: "Golden Globes", to: "/awards" },
      { label: "Emmys", to: "/awards" },
      { label: "Awards Central", to: "/awards" },
    ],
  },
  {
    id: "celebs",
    label: "Celebs",
    icon: "celebs",
    subLinks: [
      { label: "Born Today", to: "/people" },
      { label: "Most Popular Celebs", to: "/people" },
      { label: "Celebrity News", to: "/people" },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: "community",
    subLinks: [
      { label: "Help Center", to: "/" },
      { label: "Contributor Zone", to: "/login" },
      { label: "User Profile", to: "/login" },
    ],
  },
];

function renderCategoryIcon(iconKey) {
  switch (iconKey) {
    case "movies":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="4" y1="6" x2="8" y2="6" />
          <line x1="4" y1="10" x2="8" y2="10" />
          <line x1="4" y1="14" x2="8" y2="14" />
          <line x1="4" y1="18" x2="8" y2="18" />
          <line x1="16" y1="6" x2="20" y2="6" />
          <line x1="16" y1="10" x2="20" y2="10" />
          <line x1="16" y1="14" x2="20" y2="14" />
          <line x1="16" y1="18" x2="20" y2="18" />
          <line x1="8" y1="2" x2="8" y2="22" />
          <line x1="16" y1="2" x2="16" y2="22" />
        </svg>
      );
    case "tv":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
          <rect x="2" y="5" width="20" height="13" rx="2" />
          <polyline points="7 21 8 18 16 18 17 21" strokeLinecap="round" />
        </svg>
      );
    case "watch":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
          <path d="M4 6v12a2 2 0 0 0 2 2h12" />
          <rect x="7" y="3" width="14" height="13" rx="2" />
          <polygon points="12,6.5 17,9.5 12,12.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "awards":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <polygon points="12,6 13.8,9.7 17.9,10.3 14.9,13.2 15.6,17.3 12,15.4 8.4,17.3 9.1,13.2 6.1,10.3 10.2,9.7" fill="#121212" />
        </svg>
      );
    case "celebs":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      );
    case "community":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    default:
      return null;
  }
}

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
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English (United States)");
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

  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Prevent body scroll chaining on iOS/mobile touch devices
    const preventScroll = (e) => {
      if (!e.target.closest(".mobile-nav-content") && !e.target.closest(".search-container") && !e.target.closest(".imdb-mobile-content")) {
        e.preventDefault();
      }
    };
    
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [mobileMenuOpen, searchOpen]);

  const handleLinkClick = () => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setLanguageOpen(false);
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
        <Link to="/" className="navbar-logo" onClick={handleLinkClick} tabIndex={-1}>
          <img src={brandLogo} alt="MMAX.STREAM" className="brand-logo-image" />
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
            aria-label="Search movies and shows"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          
          <button 
            className="nav-action-btn profile-trigger" 
            title={user.isAuthenticated ? `Profile: ${user.name}` : "Sign In"}
            aria-label={user.isAuthenticated ? `Profile: ${user.name}` : "Sign in"}
            onClick={() => navigate("/login")}
          >
            <div className="user-avatar">{userInitial}</div>
          </button>
          
          <button
            className={`hamburger ${mobileMenuOpen ? "is-active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <div className="hamburger-container">
              <span className="bar top"></span>
              <span className="bar middle"></span>
              <span className="bar bottom"></span>
            </div>
          </button>
        </div>

        {/* ── Mobile Nav Overlay (Phone IMDb Style) ── */}
        <div
          id="mobile-navigation"
          className={`mobile-nav-overlay ${mobileMenuOpen ? "is-visible" : ""}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="imdb-mobile-header">
            <button
              className="imdb-mobile-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="28" height="28">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          
          <div className="imdb-mobile-content">
            <div className="imdb-categories-list">
              {MOBILE_CATEGORIES.map((cat) => {
                const isOpen = expandedCategory === cat.id;
                return (
                  <div key={cat.id} className={`imdb-cat-item ${isOpen ? "is-expanded" : ""}`}>
                    <div
                      className="imdb-cat-row"
                      onClick={() => setExpandedCategory(isOpen ? null : cat.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedCategory(isOpen ? null : cat.id);
                        }
                      }}
                    >
                      <div className="imdb-cat-left">
                        <span className="imdb-cat-icon">{renderCategoryIcon(cat.icon)}</span>
                        <span className="imdb-cat-title">{cat.label}</span>
                      </div>
                      <span className={`imdb-cat-chevron ${isOpen ? "open" : ""}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>

                    {isOpen && (
                      <div className="imdb-cat-sublinks">
                        {cat.subLinks.map((sub, idx) => (
                          <Link
                            key={idx}
                            to={sub.to}
                            className={`imdb-sub-link ${location.pathname === sub.to ? "active" : ""}`}
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

            <div className="imdb-mobile-bottom-section">
              <div 
                className="imdb-pro-item" 
                onClick={() => { handleLinkClick(); navigate("/movies"); }}
                role="button"
                tabIndex={0}
              >
                <div className="imdb-pro-text">
                  <span className="imdb-pro-name">IMDbPro</span>
                  <span className="imdb-pro-desc">For industry professionals</span>
                </div>
                <span className="imdb-external-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>

              <div className="imdb-lang-item">
                <div
                  className="imdb-lang-trigger"
                  onClick={() => setLanguageOpen(!languageOpen)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="imdb-lang-text">
                    <span className="imdb-lang-label">LANGUAGE</span>
                    <span className="imdb-lang-selected">{selectedLanguage}</span>
                  </div>
                  <span className={`imdb-lang-arrow ${languageOpen ? "open" : ""}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </span>
                </div>

                {languageOpen && (
                  <div className="imdb-lang-dropdown">
                    {[
                      "English (United States)",
                      "Español (España)",
                      "Français (France)",
                      "Deutsch (Deutschland)",
                      "日本語 (Japanese)",
                      "Italiano (Italia)"
                    ].map((lang) => (
                      <div
                        key={lang}
                        className={`imdb-lang-option ${selectedLanguage === lang ? "active" : ""}`}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setLanguageOpen(false);
                        }}
                      >
                        {lang}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                <div className="search-no-results">No results found for &quot;{query}&quot;</div>
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