import { useState, useRef, useEffect } from "react";
import "../css/MovieCard.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieModal from "./MovieModal";
import { getMovieDetails } from "../services/api";
import { getProgress } from "../services/progress";


const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_POSTER = "https://image.tmdb.org/t/p/w342";

function MovieCard({ movie, onSelect }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useMovieContext();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoKey, setVideoKey] = useState(null);
  const [localProgress, setLocalProgress] = useState(null);


  const cardRef = useRef(null);
  const hoverTimer = useRef(null);

  const favorite = isFavorite(movie.id);
  const title = movie.title || movie.name || "Unknown";
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? date.split("-")[0] : "";
  const mediaType = movie.media_type === "tv" || movie.name ? "TV" : "Movie";

  const imagePath = movie.backdrop_path
    ? `${IMG_BASE_BACKDROP}${movie.backdrop_path}`
    : movie.poster_path
      ? `${IMG_BASE_POSTER}${movie.poster_path}`
      : null;

  useEffect(() => {
    // Refresh progress on mount or movie change
    setLocalProgress(getProgress(movie.id));

    if (isHovered && !videoKey) {
      hoverTimer.current = setTimeout(async () => {
        try {
          const data = await getMovieDetails(movie.id, mediaType.toLowerCase());
          const trailer = data.videos?.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
          );
          if (trailer) setVideoKey(trailer.key);
        } catch (err) {
          console.error("Failed to fetch trailer", err);
        }
      }, 600);
    } else if (!isHovered) {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [isHovered, movie.id, mediaType, videoKey]);


  function onFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(movie);
    } else {
      setShowModal(true);
    }
  };

  // Exact Netflix hover data spoofing
  const votePercent = Math.round((movie.vote_average || 0) * 10);
  const maturityBadge = movie.adult ? "18" : "16"; // fallback

  return (
    <>
      <div
        className={`movie-card-wrapper ${isHovered ? "is-hovered" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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

            {/* Auto-playing Trailer Container */}
            {isHovered && videoKey && (
              <div className="hover-video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoKey}&rel=0&modestbranding=1`}
                  title="Trailer"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  tabIndex="-1"
                />
                {/* Gradient over video for title readability */}
                <div className="video-bottom-gradient"></div>
                {/* Absoluted title over video bottom - Hide when hovered to avoid duplication */}
                {!isHovered && <span className="video-title-floating">{title}</span>}

              </div>
            )}
          </div>

          <div className="netflix-hover-content">
            <div className="hover-actions-row">
              <div className="left-actions">
                <button className="nf-btn play" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <button className="nf-btn" onClick={onFavoriteClick} title="My List">
                  {favorite ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  )}
                </button>
                <button className="nf-btn" onClick={(e) => e.stopPropagation()} title="Remove">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                </button>
                <button
                  className={`nf-btn ${favorite ? "active" : ""}`}
                  onClick={onFavoriteClick}
                  title={favorite ? "Unlike" : "Like"}
                >
                  <svg viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
              <button className="nf-btn more-info-chevron" onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" /></svg>
              </button>
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





            <div className="hover-tags-row">
              Witty <span className="dot">•</span> Quirky <span className="dot">•</span> Action
            </div>
          </div>
        </div>
      </div>

      {showModal && !onSelect && (
        <MovieModal movie={movie} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export default MovieCard;