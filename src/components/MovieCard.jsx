import { useState, useEffect, useMemo, memo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import "../css/MovieCard.css";
import "../css/MovieCardRow.css";
import "../css/MovieCardGrid.css";
import "../css/MovieCardHoverPopover.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieModal from "./MovieModal";
import { getProgress, saveProgress } from "../services/progress";
import { getMovieDetails, getSeasonDetails } from "../services/api";

const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_POSTER = "https://image.tmdb.org/t/p/w342";

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

function MovieCard({ movie, onSelect, variant = "row" }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [showModal, setShowModal] = useState(false);
  const [localProgress, setLocalProgress] = useState(null);

  // Hover Popover States
  const [showPopover, setShowPopover] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [hoverDetails, setHoverDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [episodes, setEpisodes] = useState([]);

  const enterTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  const favorite = useMemo(() => isFavorite(movie.id), [isFavorite, movie.id]);

  // Robust Metadata Fallbacks
  const title = movie.title || movie.name || movie.original_title || movie.original_name || "Untitled";
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? date.split("-")[0] : "Release TBD";
  const mediaType = movie.media_type === "tv" || movie.mediaType === "tv" || movie.name ? "TV" : "Movie";

  const imagePath = useMemo(() => {
    if (variant === "grid" && movie.poster_path) return `${IMG_BASE_POSTER}${movie.poster_path}`;
    if (movie.backdrop_path) return `${IMG_BASE_BACKDROP}${movie.backdrop_path}`;
    if (movie.poster_path) return `${IMG_BASE_POSTER}${movie.poster_path}`;
    return null;
  }, [movie.backdrop_path, movie.poster_path, variant]);

  useEffect(() => {
    setLocalProgress(getProgress(movie.id));
  }, [movie.id]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const onFavoriteClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);
  }, [favorite, movie, removeFromFavorites, addToFavorites]);

  const handleCardClick = useCallback(() => {
    if (onSelect) {
      onSelect(movie);
    } else {
      setShowModal(true);
    }
  }, [onSelect, movie]);

  const handleMouseEnter = (e) => {
    if (window.innerWidth <= 768) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // Position must be measured immediately on enter
    const rect = e.currentTarget.getBoundingClientRect();
    
    enterTimeoutRef.current = setTimeout(() => {
      setHoverPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      setShowPopover(true);
      
      // Fetch details if not already loaded
      if (!hoverDetails && !loadingDetails) {
        setLoadingDetails(true);
        const type = movie.media_type === "tv" || movie.mediaType === "tv" || movie.name ? "tv" : "movie";
        getMovieDetails(movie.id, type)
          .then(data => {
            setHoverDetails(data);
            setLoadingDetails(false);

            // Fetch season episodes for TV shows
            if (type === "tv") {
              const currentSeason = (localProgress && localProgress.season) || 1;
              getSeasonDetails(movie.id, currentSeason)
                .then(seasonData => {
                  setEpisodes(seasonData.episodes || []);
                })
                .catch(err => {
                  console.error("Failed to fetch season episodes on hover", err);
                });
            }
          })
          .catch(err => {
            console.error("Failed to fetch hover details", err);
            setLoadingDetails(false);
          });
      }
    }, 450); // 450ms delay for intentional hover feel
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    
    leaveTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 200);
  };

  const handlePopoverMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 200);
  };

  const handleWatchNow = (e) => {
    e.stopPropagation();
    handleCardClick();
    setShowPopover(false);
  };

  const handleEpisodeClick = (e, epNumber) => {
    e.stopPropagation();
    const type = movie.media_type === "tv" || movie.mediaType === "tv" || movie.name ? "tv" : "movie";
    const currentSeason = (localProgress && localProgress.season) || 1;
    saveProgress(movie.id, {
      id: movie.id,
      title,
      poster_path: movie.poster_path,
      season: currentSeason,
      episode: epNumber,
      episodeName: episodes.find(ep => ep.episode_number === epNumber)?.name || `Episode ${epNumber}`,
      mediaType: type,
      progressPercent: 10,
      timeString: `S${currentSeason}:E${epNumber}`,
      timestamp: Date.now()
    });
    window.dispatchEvent(new Event("progressUpdate"));
    handleCardClick();
    setShowPopover(false);
  };



  const duration = movie.runtime
    ? `${movie.runtime}m`
    : movie.episode_run_time?.[0]
      ? `${movie.episode_run_time[0]}m`
      : "";

  // Dynamic positioning calculator: aligns to bottom corner by default, top corner if space restricted
  const getPopoverStyles = () => {
    if (!hoverPosition) return {};

    const popoverWidth = 320;
    const popoverHeight = 420; // estimated maximum height
    const viewportWidth = window.innerWidth;
    const margin = 16;

    // Horizontal positioning: default right, fallback left
    let leftPos = hoverPosition.left + hoverPosition.width + 12;
    if (leftPos + popoverWidth > viewportWidth - margin) {
      leftPos = hoverPosition.left - popoverWidth - 12;
    }
    leftPos = Math.max(margin, Math.min(leftPos, viewportWidth - popoverWidth - margin));

    // Vertical positioning: default bottom aligned, fallback top aligned
    let topPos = hoverPosition.top + hoverPosition.height - popoverHeight;
    const topViewportOffset = topPos - window.scrollY;
    if (topViewportOffset < margin) {
      topPos = hoverPosition.top; // align to top
    }

    return {
      top: topPos,
      left: leftPos,
    };
  };

  const popoverStyles = getPopoverStyles();

  return (
    <>
      <div
        className={`movie-card-wrapper variant-${variant}`}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
            event.preventDefault();
            handleCardClick();
          }
        }}
        tabIndex={0}
        aria-label={`Open details for ${title}`}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="movie-card">
          <div className="movie-poster">
            {imagePath ? (
              <img src={imagePath} alt={title} loading="lazy" />
            ) : (
              <div className="poster-placeholder">🎬</div>
            )}

            {localProgress && (
              <div className="persistent-progress-container">
                <div 
                  className="persistent-progress-fill" 
                  style={{ width: `${localProgress.progressPercent || 0}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* New: Grid Metadata (Visible on mobile/grids where hover is disabled) */}
          <div className="grid-meta-content">
            <h3 className="grid-movie-title">{title}</h3>
            <div className="grid-movie-info">
              {year && <span>{year}</span>}
              <span className="dot">•</span>
              {duration && <span>{duration}</span>}
            </div>
          </div>
        </div>
      </div>

      {showPopover && hoverPosition && createPortal(
        <div 
          className="movie-hover-popover"
          style={popoverStyles}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop Image Banner with Gradient overlay */}
          <div className="popover-banner">
            {movie.backdrop_path || movie.poster_path ? (
              <img 
                src={`${IMG_BASE_BACKDROP}${movie.backdrop_path || movie.poster_path}`} 
                alt={title} 
                className="popover-banner-img" 
              />
            ) : (
              <div className="popover-banner-placeholder">🎬</div>
            )}
            <div className="popover-banner-gradient" />
            <h3 className="hover-popover-title">{title}</h3>
          </div>

          <div className="popover-body">
            <div className="hover-popover-badges">
              <span className="popover-badge rating">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffb703" style={{ marginRight: '3px' }}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                {(hoverDetails?.vote_average || movie.vote_average || 7.5).toFixed(1)}
              </span>
              <span className="popover-badge hd">HD</span>
              
              {mediaType === "TV" ? (
                <>
                  <span className="popover-badge sub">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: '3px' }}>
                      <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1.5c0 .83-.67 1.5-1.5 1.5h-2C6.67 16 6 15.33 6 14.5v-5C6 8.67 6.67 8 7.5 8h2c.83 0 1.5.67 1.5 1.5V11zm7 0h-1.5v-.5h-2v3h2V13H18v1.5c0 .83-.67 1.5-1.5 1.5h-2c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5V11z"/>
                    </svg>
                    {hoverDetails?.number_of_episodes || movie.episode_count || 12}
                  </span>
                  <span className="popover-badge dub">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: '3px' }}>
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 2.93c-3.37-.5-6-3.37-6-6.93h2c0 2.76 2.24 5 5 5s5-2.24 5-5h2c0 3.56-2.63 6.43-6 6.93V21h-2v-4.07z"/>
                  </svg>
                    {Math.max(1, Math.round((hoverDetails?.number_of_episodes || movie.episode_count || 12) * 0.95))}
                  </span>
                </>
              ) : (
                <>
                  <span className="popover-badge sub">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: '3px' }}>
                      <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1.5c0 .83-.67 1.5-1.5 1.5h-2C6.67 16 6 15.33 6 14.5v-5C6 8.67 6.67 8 7.5 8h2c.83 0 1.5.67 1.5 1.5V11zm7 0h-1.5v-.5h-2v3h2V13H18v1.5c0 .83-.67 1.5-1.5 1.5h-2c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5V11z"/>
                    </svg>
                    SUB
                  </span>
                  <span className="popover-badge dub">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: '3px' }}>
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 2.93c-3.37-.5-6-3.37-6-6.93h2c0 2.76 2.24 5 5 5s5-2.24 5-5h2c0 3.56-2.63 6.43-6 6.93V21h-2v-4.07z"/>
                    </svg>
                    5.1
                  </span>
                </>
              )}
              
              <span className="popover-badge type">{mediaType}</span>
            </div>
            
            <p className="hover-popover-desc">
              {hoverDetails?.overview || movie.overview || "No description available."}
            </p>
            


            {/* Clickable Episode List */}
            {mediaType === "TV" && episodes.length > 0 && (
              <div className="popover-episodes-section">
                <div className="popover-episodes-label">Episodes (Season {(localProgress && localProgress.season) || 1}):</div>
                <div className="popover-episode-list">
                  {episodes.map(ep => (
                    <button 
                      key={ep.id}
                      className="popover-episode-btn"
                      onClick={(e) => handleEpisodeClick(e, ep.episode_number)}
                    >
                      {ep.episode_number}
                    </button>
                  ))}
                </div>
              </div>
            )}


            
            <div className="hover-popover-actions">
              <button className="popover-btn-watch" onClick={handleWatchNow}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginRight: '6px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch now
              </button>
              <button 
                className={`popover-btn-fav ${favorite ? 'active' : ''}`}
                onClick={onFavoriteClick}
                title={favorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                {favorite ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && !onSelect && (
        <MovieModal movie={movie} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default memo(MovieCard);