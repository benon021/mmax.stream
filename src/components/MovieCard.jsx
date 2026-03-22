import { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import "../css/MovieCard.css";
import "../css/MovieCardRow.css";
import "../css/MovieCardGrid.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieModal from "./MovieModal";
import { getMovieDetails } from "../services/api";
import { getProgress } from "../services/progress";


const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_POSTER = "https://image.tmdb.org/t/p/w342";

function MovieCard({ movie, onSelect, variant = "row" }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localProgress, setLocalProgress] = useState(null);
  const [hoverBounds, setHoverBounds] = useState(null);

  const cardRef = useRef(null);
  const hoverEnterTimer = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverEnterTimer.current) clearTimeout(hoverEnterTimer.current);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setHoverBounds({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      });
    }

    // Increased delay as requested (400ms)
    hoverEnterTimer.current = setTimeout(() => setIsHovered(true), 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverEnterTimer.current) clearTimeout(hoverEnterTimer.current);
    setIsHovered(false);
    setHoverBounds(null);
  }, []);

  const favorite = useMemo(() => isFavorite(movie.id), [isFavorite, movie.id]);

  // Robust Metadata Fallbacks
  const title = movie.title || movie.name || movie.original_title || movie.original_name || "Untitled";
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? date.split("-")[0] : "Release TBD";
  const mediaType = movie.media_type === "tv" || movie.name ? "TV" : "Movie";

  const imagePath = useMemo(() => {
    if (movie.backdrop_path) return `${IMG_BASE_BACKDROP}${movie.backdrop_path}`;
    if (movie.poster_path) return `${IMG_BASE_POSTER}${movie.poster_path}`;
    return null;
  }, [movie.backdrop_path, movie.poster_path]);

  useEffect(() => {
    // Refresh progress on mount or movie change
    setLocalProgress(getProgress(movie.id));

    return () => {
      if (hoverEnterTimer.current) clearTimeout(hoverEnterTimer.current);
    };
  }, [movie.id]);

  // Keep hover active only while the cursor remains near the base card bounds.
  useEffect(() => {
    if (!isHovered || !hoverBounds) return;

    const handleWindowMouseMove = (event) => {
      const padding = 40; // allow some leeway
      const inside =
        event.clientX >= hoverBounds.left - padding &&
        event.clientX <= hoverBounds.right + padding &&
        event.clientY >= hoverBounds.top - padding &&
        event.clientY <= hoverBounds.bottom + padding;

      if (!inside) {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, [isHovered, hoverBounds]);

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

  // Exact Netflix hover data spoofing
  const votePercent = Math.round((movie.vote_average || 0) * 10);
  const maturityBadge = movie.adult ? "18" : "16"; // fallback
  const duration = movie.runtime
    ? `${movie.runtime}m`
    : movie.episode_run_time?.[0]
      ? `${movie.episode_run_time[0]}m`
      : "";

  return (
    <>
      <div
        className={`movie-card-wrapper variant-${variant} ${isHovered ? "is-hovered" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        ref={cardRef}
      >
        <div className="movie-card">
          <div className="movie-poster">
            {imagePath ? (
              <img src={imagePath} alt={title} loading="lazy" />
            ) : (
              <div className="poster-placeholder">🎬</div>
            )}

            {/* Persistent Progress Bar on Poster - only show if watched AND NOT hovered */}
            {localProgress && !isHovered && (
              <div className="persistent-progress-container">
                <div 
                  className="persistent-progress-fill" 
                  style={{ width: `${localProgress.progressPercent || 0}%` }}
                ></div>
              </div>
            )}




            {/* R Series Badge */}
            <div className="netflix-card-badge">
              <span className="r-logo-small">m</span>
            </div>

            {/* HD Badge - Top Right */}
            <div className="hd-badge">HD</div>

            {/* Hover Image Container */}
            {isHovered && imagePath && (
              <div className="hover-image-container">
                <img src={imagePath} alt={title} className="hover-backdrop-img" />
                <div className="video-bottom-gradient"></div>
                {!isHovered && <span className="video-title-floating">{title}</span>}
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

          <div className="netflix-hover-content">
            <div className="hover-actions-row">
              <div className="left-actions">
                <button className="nf-btn play" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <button
                  className={`nf-btn mylist ${favorite ? "active" : ""}`}
                  onClick={onFavoriteClick}
                  title={favorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  {favorite ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  )}
                </button>
              </div>
              <button className="nf-btn more-info-chevron" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" /></svg>
              </button>
            </div>

            <div className="hover-meta-row">
              {year && <span className="nf-year">{year}</span>}
              <span className={`nf-maturity-badge age-${maturityBadge}`}>{maturityBadge}+</span>
              {duration && <span className="nf-duration">{duration}</span>}
            </div>

            <div className="hover-tags-row">
              Witty <span className="dot">•</span> Quirky <span className="dot">•</span> Action
            </div>

            {mediaType === "TV" ? (
              <div className="hover-episode-info">
                <span className="episode-title">
                  {localProgress 
                    ? `S${localProgress.season}:E${localProgress.episode} "${localProgress.episodeName}"` 
                    : "Episode 1"
                  }
                </span>
                <div className="progress-row">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${localProgress?.progressPercent || 0}%`,
                        background: localProgress ? "#e50914" : "rgba(0,0,0,0.8)"
                      }}
                    ></div>
                  </div>
                  {localProgress && <span className="progress-text">{localProgress.timeString}</span>}
                </div>
              </div>
            ) : (
              <div className="hover-episode-info">
                <span className="episode-title">{title}</span>
                {localProgress && (
                  <div className="progress-row">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${localProgress.progressPercent || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{localProgress.timeString}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && !onSelect && (
        <MovieModal movie={movie} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default memo(MovieCard);