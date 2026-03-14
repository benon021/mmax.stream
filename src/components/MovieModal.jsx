import { useState, useEffect, useRef } from "react";
import "../css/MovieModal.css";
import { getSeasonDetails, getMovieDetails, getSimilarContent } from "../services/api";
import { getProgress, saveProgress } from "../services/progress";





const IMG_BASE_BACKDROP = "https://image.tmdb.org/t/p/original";

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
  const [resumeTime, setResumeTime] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState("Auto");
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);









  if (!currentMovie) return null;

  const title = currentMovie.title || currentMovie.name || "Unknown";
  const date = currentMovie.release_date || currentMovie.first_air_date || "";
  const year = date ? date.split("-")[0] : "";
  const votePercent = Math.round((currentMovie.vote_average || 0) * 10);

  // Detect if it's a TV show or Movie
  const isTV = currentMovie.media_type === "tv" || !!(currentMovie.name || currentMovie.first_air_date);


  const mediaType = isTV ? "tv" : "movie";

  // Fetch full details for TV shows to get number of seasons
  useEffect(() => {
    if (currentMovie.id) {
      // Check for resume progress
      const saved = getProgress(currentMovie.id);
      if (saved) {
        if (isTV) {
          setSelectedSeason(saved.season || 1);
          setSelectedEpisode(saved.episode || 1);
          setExpandedEpisode(saved.episode || 1);
        } else {
          setResumeTime(saved.progressPercent || 0);
        }

        // In a real player we'd use saved.time, here we simulate resumption
        console.log("Resuming from saved point:", saved);
      }

      // Fetch details
      if (isTV) {
        getMovieDetails(currentMovie.id, "tv")
          .then(setFullDetails)
          .catch(err => console.error("Failed to fetch TV details", err));
      }

      // Fetch similar content
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


  // Fetch episodes when season changes



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

  // Simulate progress saving when playing
  useEffect(() => {
    if (isPlaying && currentMovie.id) {
      const interval = setInterval(() => {
        // Mocking progress update
        // In a real app, this would come from the video player API
        const currentEp = episodes.find(e => e.episode_number === selectedEpisode);
        saveProgress(currentMovie.id, {
          id: currentMovie.id,
          season: selectedSeason,
          episode: selectedEpisode,
          episodeName: currentEp?.name || "Episode",
          progressPercent: 40, // hardcoded for demo
          timeString: "28 of 71m", // hardcoded for demo
          mediaType: mediaType,
          title: title,
          poster_path: currentMovie.poster_path,
          backdrop_path: currentMovie.backdrop_path,
          vote_average: currentMovie.vote_average,
          release_date: currentMovie.release_date || currentMovie.first_air_date
        });
      }, 5000); // Save every 5s
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentMovie, selectedSeason, selectedEpisode, episodes, mediaType, title]);


  // Use vidsrc.xyz as it's often more resilient with TMDB IDs
  const videoUrl = currentMovie.id
    ? (isTV
      ? `https://vidsrc.xyz/embed/tv/${currentMovie.id}/${selectedSeason}/${selectedEpisode}`
      : `https://vidsrc.xyz/embed/movie/${currentMovie.id}`)
    : "";

  const handlePlayStart = () => {
    setIsPlaying(true);
    setIsVideoLoading(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Keyboard Navigation
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "ArrowRight") {
        // Mock seek forward
        console.log("Seeking forward 10s...");
      } else if (e.code === "ArrowLeft") {
        // Mock seek backward
        console.log("Seeking backward 10s...");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused]);



  const handleEpisodeClick = (episodeNumber) => {
    if (expandedEpisode === episodeNumber) {
      // If already expanded, maybe just play it?
      setSelectedEpisode(episodeNumber);
      setIsPlaying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setExpandedEpisode(episodeNumber);
    }
  };


  const handleSeasonSelect = (seasonNum) => {
    setSelectedSeason(seasonNum);
    setIsSeasonOpen(false);
    setSelectedEpisode(1); // Reset to first episode of the new season
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setIsSeasonOpen(false);
    if (isSeasonOpen) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isSeasonOpen]);

  const handleRelatedClick = (item) => {
    setCurrentMovie(item);
    // Reset states for new movie
    setIsPlaying(false);
    setEpisodes([]);
    setSelectedSeason(1);
    setSelectedEpisode(1);
    setExpandedEpisode(1);
    setFullDetails(null);
    setResumeTime(0);

    // Scroll modal to top
    const modalEl = document.querySelector('.modal-overlay');
    if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
  };





  return (
    <div className={`modal-overlay ${lightsOff ? "lights-off-active" : ""}`} onClick={onClose}>
      <div
        className={`modal-content ${isTheaterMode ? "theater-mode" : ""} ${isPlaying ? "playing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-top-section">
          {isPlaying ? (
            <div className="player-container">
              {isVideoLoading && (
                <div className="premium-loader-overlay">
                  <div className="premium-spinner-wrap">
                    <div className="premium-spinner"></div>
                    <div className="premium-spinner-inner"></div>
                    <span className="premium-loading-text">PREMIUM CONTENT</span>
                  </div>
                </div>
              )}

              {isPaused && (
                <div className="pause-details-overlay">
                  <div className="pause-details-content">
                    <h2 className="pause-movie-title">{title}</h2>
                    <p className="pause-movie-overview">{currentMovie.overview?.slice(0, 180)}...</p>
                    <div className="pause-actions">
                      <button className="resume-btn" onClick={() => setIsPaused(false)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z" /></svg>
                        Resume Playing
                      </button>
                    </div>
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

              <div className="custom-player-overlay">
                <button
                  className="back-to-details-fancy"
                  onClick={() => setIsPlaying(false)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  <span>Return</span>
                </button>

                <div className="player-center-controls">
                  <button className="control-btn-premium" onClick={() => console.log("Reverse 10")}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M11 18V6l-8.5 6L11 18zm.5-6l8.5 6V6l-8.5 6z" />
                    </svg>
                  </button>
                  <button className="control-btn-premium main-play" onClick={togglePause}>
                    {isPaused ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><path d="M8 5v14l11-7z" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    )}
                  </button>
                  <button className="control-btn-premium" onClick={() => console.log("Forward 10")}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                    </svg>
                  </button>
                </div>

                <div className="player-right-controls">
                  <div className="quality-selector-wrap">
                    <button
                      className="quality-btn"
                      onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M15 21h-2v-2h2v2zm4-2h-2v2h2v-2zM7 21H5v-2h2v2zm4-2H9v2h2v-2zM21 21h-2v-2h2v2zM5 17H3v2h2v-2zm2-2H5v2h2v-2zm14 2h-2v2h2v-2zm2-2h-2v2h2v-2zM3 13h2v2H3v-2zm18 0h2v2h-2v-2zM5 11H3v2h2v-2zm14 0h2v2h-2v-2zM3 9h2v2H3V9zm18 0h2v2h-2V9zm-2-2H3v2h16V7zm2-2H3v2h18V5zm0-2H3v2h18V3z" />
                      </svg>
                      <span>{selectedQuality}</span>
                    </button>
                    {isQualityMenuOpen && (
                      <div className="quality-menu-fancy">
                        {["Auto", "4K", "1080p", "720p"].map(q => (
                          <div
                            key={q}
                            className={`quality-option ${selectedQuality === q ? "active" : ""}`}
                            onClick={() => { setSelectedQuality(q); setIsQualityMenuOpen(false); }}
                          >
                            {q}
                            {q === "4K" && <span className="ultra-tag">ULTRA</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
              <button className="big-play-btn" onClick={handlePlayStart}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
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
              <button
                className={`control-btn ${lightsOff ? "active" : ""}`}
                onClick={() => setLightsOff(!lightsOff)}
                title="Lights Off"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
                </svg>
              </button>
              <button
                className={`control-btn ${isTheaterMode ? "active" : ""}`}
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                title="Theater Mode"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                  <path d="M7 10h10v4H7z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="modal-meta">
            <span className="modal-year">{year}</span>
            <span className="modal-rating-pill">{votePercent}% Match</span>
            <span className="modal-quality">HD</span>
          </div>

            <div className="modal-actions">
              <button className="modal-btn play" onClick={handlePlayStart}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M6 4l15 8-15 8V4z" /></svg>
                Watch Now
              </button>
              <button className="modal-btn secondary">＋ My List</button>
            </div>



          <p className="modal-overview">{currentMovie.overview}</p>

          <div className="modal-extra">
            <p><span>Starring:</span> Liam Neeson, Ben Kingsley, Ralph Fiennes</p>
            <p><span>Genres:</span> Drama, Thriller, Action</p>
            <p><span>Movie Language:</span> {currentMovie.original_language?.toUpperCase()}</p>
          </div>


          {/* Episodes Section for TV Shows */}
          {isTV && (
            <div className="episodes-section">
              <div className="episodes-header">
                <h2 className="episodes-title">Episodes</h2>
                {(fullDetails?.number_of_seasons || 1) > 1 && (
                  <div className="season-custom-dropdown" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`season-trigger ${isSeasonOpen ? "open" : ""}`}
                      onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                    >
                      <span>Season {selectedSeason} ({episodes.length} EP)</span>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </button>

                    {isSeasonOpen && fullDetails && (
                      <div className="season-menu">
                        {[...Array(fullDetails.number_of_seasons)].map((_, i) => (

                          <div
                            key={i + 1}
                            className={`season-option ${selectedSeason === i + 1 ? "active" : ""}`}
                            onClick={() => handleSeasonSelect(i + 1)}
                          >
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
                    <div
                      key={ep.id}
                      className={`episode-card-accordion ${expandedEpisode === ep.episode_number ? "expanded" : ""} ${selectedEpisode === ep.episode_number ? "playing" : ""}`}
                      onClick={() => handleEpisodeClick(ep.episode_number)}
                    >
                      <div className="episode-header-row">
                        <div className="episode-number">{ep.episode_number}</div>
                        <h3 className="episode-name">{ep.name}</h3>
                        <span className="episode-runtime">{ep.runtime ? `${ep.runtime}m` : ""}</span>
                      </div>

                      <div className="episode-expandable-content">
                        <div className="episode-body">
                          <div className="episode-thumbnail-wrap">
                            <img
                              src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : `${IMG_BASE_BACKDROP}${currentMovie.backdrop_path}`}
                              alt={ep.name}
                              className="episode-thumbnail"
                            />
                            <div className="episode-play-overlay">

                              <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="episode-details">
                            <p className="episode-desc">{ep.overview || "No description available."}</p>
                            <button className="episode-play-inline-btn" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEpisode(ep.episode_number);
                              setIsPlaying(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
                              Play Episode
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

          {/* Related Content Section */}
          <div className="related-section">
            <h2 className="related-title">More Like This</h2>
            {loadingSimilar ? (
              <div className="related-loading">Loading related content...</div>
            ) : (
              <div className="related-grid">
                {similarContent.map((item) => (
                  <div key={item.id} className="related-card" onClick={() => handleRelatedClick(item)}>
                    <div className="related-poster-wrap">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title || item.name}
                        className="related-poster"
                      />
                      <div className="related-hover">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><path d="M8 5v14l11-7z" /></svg>
                      </div>
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

