import { useState, useEffect, useRef } from "react";
import "../css/MovieModal.css";
import { getSeasonDetails, getMovieDetails, getSimilarContent } from "../services/api";
import { getProgress, saveProgress } from "../services/progress";

const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/original";

// Multi-server source list (Optimized for reliability)
const SOURCES = [
  { 
    id: "vidlink", 
    name: "Alpha", 
    type: "embed", 
    getUrl: (id, isTV, s, e) => isTV 
      ? `https://vidlink.pro/tv/${id}/${s}/${e}` 
      : `https://vidlink.pro/movie/${id}` 
  },
  { 
    id: "vidsrc", 
    name: "Beta", 
    type: "embed", 
    getUrl: (id, isTV, s, e) => isTV 
      ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` 
      : `https://vidsrc.xyz/embed/movie/${id}` 
  },
  { 
    id: "vidsrc_to", 
    name: "Gamma", 
    type: "embed", 
    getUrl: (id, isTV, s, e) => isTV 
      ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}` 
      : `https://vidsrc.to/embed/movie/${id}` 
  }
];

function MovieModal({ movie, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [fullDetails, setFullDetails] = useState(null);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [similarContent, setSimilarContent] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [expandedEpisode, setExpandedEpisode] = useState(1);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [forceLoaderOffset, setForceLoaderOffset] = useState(true);

  const containerRef = useRef(null);

  const isTV = currentMovie.media_type === "tv" || !!(currentMovie.name || currentMovie.first_air_date);
  const mediaType = isTV ? "tv" : "movie";
  const title = currentMovie.title || currentMovie.name || "Unknown";
  const date = currentMovie.release_date || currentMovie.first_air_date || "";
  const year = date ? date.split("-")[0] : "";
  const votePercent = Math.round((currentMovie.vote_average || 0) * 10);

  const currentSourceIndex = 0; // Defaulting for simple embed use

  // Fetch Logic
  useEffect(() => {
    if (currentMovie.id) {
      const saved = getProgress(currentMovie.id);
      if (saved) {
        if (isTV) {
          setSelectedSeason(saved.season || 1);
          setSelectedEpisode(saved.episode || 1);
          setExpandedEpisode(saved.episode || 1);
        }
      }

      if (isTV) {
        getMovieDetails(currentMovie.id, "tv")
          .then(setFullDetails)
          .catch(err => console.error("Failed to fetch TV details", err));
      }

      setLoadingSimilar(true);
      getSimilarContent(currentMovie.id, mediaType)
        .then(data => {
          setSimilarContent(data.slice(0, 12));
          setLoadingSimilar(false);
        })
        .catch(err => {
          console.error("Failed to fetch similar content", err);
          setLoadingSimilar(false);
        });
    }
  }, [isTV, currentMovie.id, mediaType]);

  useEffect(() => {
    if (isTV && currentMovie.id) {
      setLoadingEpisodes(true);
      getSeasonDetails(currentMovie.id, selectedSeason)
        .then((data) => {
          setEpisodes(data.episodes || []);
          setLoadingEpisodes(false);
        })
        .catch((err) => {
          console.error("Failed to fetch episodes", err);
          setLoadingEpisodes(false);
        });
    }
  }, [isTV, currentMovie.id, selectedSeason]);

  // Branded Loading Logic (Simulated 3s)
  useEffect(() => {
    if (isPlaying && forceLoaderOffset) {
      setLoadingPercentage(0);
      const startTime = Date.now();
      const durationTime = 3000;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.floor((elapsed / durationTime) * 100), 100);
        setLoadingPercentage(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setForceLoaderOffset(false);
            setIsVideoLoading(false);
          }, 300);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, forceLoaderOffset]);



  // Handle Video Source Change
  const currentSource = SOURCES[currentSourceIndex];
  const videoUrl = currentSource.getUrl(currentMovie.id, isTV, selectedSeason, selectedEpisode);


  return (
    <div className={`modal-overlay ${lightsOff ? "lights-off-active" : ""}`} onClick={onClose}>
      <div
        className={`modal-content ${isTheaterMode ? "theater-mode" : ""} ${isPlaying ? "playing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-top-section">
          {isPlaying ? (
            <div className="player-wrapper-outer liquid-crystal" ref={containerRef}>
              <div className="player-container">
                {forceLoaderOffset && (
                  <div className="premium-loader-overlay branded-loader">
                    <div className="branded-loader-content">
                      <div className="loader-logo-wrap">
                        <span className="loader-m">m</span>
                        <span className="loader-text">MAX.STREAM</span>
                      </div>
                      
                      <div className="circular-loader-wrap">
                        <svg className="circular-loader-svg" viewBox="0 0 100 100">
                          <circle className="circular-loader-bg" cx="50" cy="50" r="45" />
                          <circle 
                            className="circular-loader-fill" 
                            cx="50" cy="50" r="45" 
                            style={{ strokeDashoffset: 283 - (283 * loadingPercentage) / 100 }}
                          />
                        </svg>
                        <div className="loader-percentage">{loadingPercentage}%</div>
                      </div>
                      
                      <div className="loader-status-text">INITIALIZING SECURE STREAM...</div>
                    </div>
                  </div>
                )}

                <iframe
                    src={videoUrl}
                    title={title}
                    className={`movie-player-iframe ${isVideoLoading ? "is-loading" : "is-ready"}`}
                    allowFullScreen
                    frameBorder="0"
                    onLoad={() => setIsVideoLoading(false)}
                  ></iframe>

                  {/* Minimal Floating Return Button */}
                  {!isVideoLoading && (
                    <button className="floating-return-btn" onClick={() => setIsPlaying(false)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                      </svg>
                      Return
                    </button>
                  )}

              </div>
            </div>
          ) : (
            <div className="modal-backdrop-wrap">
              <img
                src={`${IMG_BASE_BACKDROP}${currentMovie.backdrop_path || currentMovie.poster_path}`}
                alt={title}
                className="modal-backdrop"
              />
              <div className="modal-fade" />
              <button className="big-play-btn liquid-btn-primary" onClick={handlePlayStart}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="50" height="50">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="modal-details-center">
          <div className="modal-header-flex">
            <h1 className="modal-title">{title}</h1>
            <div className="player-controls">
              <button className={`control-btn ${lightsOff ? "active" : ""}`} onClick={() => setLightsOff(!lightsOff)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
                </svg>
              </button>
              <button className={`control-btn ${isTheaterMode ? "active" : ""}`} onClick={() => setIsTheaterMode(!isTheaterMode)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /><path d="M7 10h10v4H7z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="modal-meta">
            <span className="modal-year">{year}</span>
            <span className="modal-rating-pill">{votePercent}% Match</span>
            <span className="modal-quality">ULTRA HD</span>
          </div>

          <div className="modal-actions">
            <button className="modal-btn play liquid-btn-primary" onClick={handlePlayStart}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 4l15 8-15 8V4z" /></svg>
              WATCH NOW
            </button>
            <button className="modal-btn secondary glass-btn">＋ MY LIST</button>
          </div>

          <p className="modal-overview">{currentMovie.overview}</p>

          <div className="modal-extra">
            <p><span>Starring:</span> Liam Neeson, Ben Kingsley, Ralph Fiennes</p>
            <p><span>Genres:</span> Drama, Thriller, Action</p>
            <p><span>Movie Language:</span> {currentMovie.original_language?.toUpperCase()}</p>
          </div>

          {isTV && (
            <div className="episodes-section">
              <div className="episodes-header">
                <h2 className="episodes-title">Episodes</h2>
                {(fullDetails?.number_of_seasons || 1) > 1 && (
                  <div className="season-custom-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button className={`season-trigger ${isSeasonOpen ? "open" : ""}`} onClick={() => setIsSeasonOpen(!isSeasonOpen)}>
                      <span>Season {selectedSeason}</span>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z" /></svg>
                    </button>
                    {isSeasonOpen && fullDetails && (
                      <div className="season-menu liquid-menu">
                        {[...Array(fullDetails.number_of_seasons)].map((_, i) => (
                          <div key={i + 1} className={`season-option ${selectedSeason === i + 1 ? "active" : ""}`} onClick={() => { setSelectedSeason(i+1); setIsSeasonOpen(false); setSelectedEpisode(1); }}>
                            Season {i + 1}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {loadingEpisodes ? (
                <div className="episodes-loading">Loading episodes...</div>
              ) : (
                <div className="episodes-list">
                  {episodes.map((ep) => (
                    <div key={ep.id} className={`episode-card-accordion ${expandedEpisode === ep.episode_number ? "expanded" : ""} ${selectedEpisode === ep.episode_number ? "playing" : ""}`} onClick={() => { if(expandedEpisode===ep.episode_number){ setSelectedEpisode(ep.episode_number); setIsPlaying(true); } else { setExpandedEpisode(ep.episode_number); }}}>
                      <div className="episode-header-row">
                        <div className="episode-number">{ep.episode_number}</div>
                        <h3 className="episode-name">{ep.name}</h3>
                        <span className="episode-runtime">{ep.runtime ? `${ep.runtime}m` : ""}</span>
                      </div>
                      <div className="episode-expandable-content">
                        <div className="episode-body">
                          <div className="episode-thumbnail-wrap">
                            <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : `${IMG_BASE_BACKDROP}${currentMovie.backdrop_path}`} alt={ep.name} className="episode-thumbnail" />
                            <div className="episode-play-overlay"><svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M8 5v14l11-7z" /></svg></div>
                          </div>
                          <div className="episode-details">
                            <p className="episode-desc">{ep.overview || "No description available."}</p>
                            <button className="episode-play-inline-btn liquid-btn" onClick={(e) => { e.stopPropagation(); setSelectedEpisode(ep.episode_number); setIsPlaying(true); }}>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
                              PLAY NOW
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="related-section">
            <h2 className="related-title">More Like This</h2>
            {loadingSimilar ? (
              <div className="related-loading">Loading...</div>
            ) : (
              <div className="related-grid">
                {similarContent.map((item) => (
                  <div key={item.id} className="related-card" onClick={() => { setCurrentMovie(item); setIsPlaying(false); setEpisodes([]); setSelectedSeason(1); setSelectedEpisode(1); document.querySelector('.modal-overlay').scrollTo({top:0, behavior:'smooth'}); }}>
                    <div className="related-poster-wrap">
                      <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} alt={item.title || item.name} className="related-poster" />
                      <div className="related-hover"><svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M8 5v14l11-7z" /></svg></div>
                    </div>
                    <div className="related-info">
                      <h4 className="related-name">{item.title || item.name}</h4>
                      <div className="related-meta">
                        <span className="related-year">{(item.release_date || item.first_air_date)?.split("-")[0]}</span>
                        <span className="related-rating">{Math.round((item.vote_average || 0) * 10)}% Match</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;

