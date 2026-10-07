import brandLogo from "../assets/mmax-stream-logo.svg";
import { useState, useEffect, useRef } from "react";
import "../css/HeroSection.css";
import MovieModal from "./MovieModal";
import { getTopRatedAnimeWithVideos, getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

const GENRE_MAP = {
  16: "Animation",
  10759: "Action & Adventure",
  35: "Comedy",
  18: "Drama",
  10765: "Sci-Fi & Fantasy",
  9648: "Mystery",
  10751: "Family",
};

function AnimeHeroSection() {
  const { isModalOpen } = useMovieContext();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activePlayer, setActivePlayer] = useState(1);
  const [fade, setFade] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalStartPlaying, setModalStartPlaying] = useState(false);
  const [apiReady, setApiReady] = useState(!!window.YT);
  const [logos, setLogos] = useState({});

  const ytPlayer1 = useRef(null);
  const ytPlayer2 = useRef(null);
  const scriptLoaded = useRef(false);

  // Auto-mute when modal opens
  useEffect(() => {
    if (isModalOpen) setIsMuted(true);
  }, [isModalOpen]);

  // Fetch Top Rated Anime content (shuffled at random)
  useEffect(() => {
    let cancelled = false;
    const loadTopRated = async () => {
      try {
        const topRated = await getTopRatedAnimeWithVideos();
        if (!cancelled && topRated && topRated.length > 0) {
          setMovies(topRated);
        }
      } catch (error) {
        console.error("Failed to fetch top rated for anime hero:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadTopRated();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentMovie = movies[currentIndex];

  // Fetch official title logo for the active featured anime
  useEffect(() => {
    if (!currentMovie?.id || logos[currentMovie.id] !== undefined) return;

    let cancelled = false;
    const mediaType = currentMovie.media_type || (currentMovie.first_air_date ? "tv" : "movie");

    getMovieDetails(currentMovie.id, mediaType)
      .then((data) => {
        if (cancelled) return;
        const logosList = data?.images?.logos || [];
        const enLogo = logosList.find((l) => l.iso_639_1 === "en");
        const chosen = enLogo || logosList[0];
        setLogos((prev) => ({
          ...prev,
          [currentMovie.id]: chosen?.file_path ? `https://image.tmdb.org/t/p/w500${chosen.file_path}` : null,
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setLogos((prev) => ({ ...prev, [currentMovie.id]: null }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentMovie?.id, logos]);

  // Load YouTube API
  useEffect(() => {
    if (scriptLoaded.current) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    scriptLoaded.current = true;

    window.onYouTubeIframeAPIReady = () => setApiReady(true);
    if (window.YT && window.YT.Player) setApiReady(true);
  }, []);

  // Handle Video Transition Logic
  const handleVideoEnd = () => {
    if (movies.length <= 1) return;
    setFade(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
      setActivePlayer((prev) => (prev === 1 ? 2 : 1));
      setFade(false);
    }, 1000);
  };

  // Auto-advance rotation (25s timer like movie hero page or when video ends)
  useEffect(() => {
    if (movies.length <= 1) return;

    const timer = setTimeout(() => {
      handleVideoEnd();
    }, 25000);

    return () => clearTimeout(timer);
  }, [currentIndex, movies.length]);

  // Preload next backdrop images for seamless transition
  useEffect(() => {
    if (movies.length < 2) return;

    [1, 2, 3].forEach((offset) => {
      const movie = movies[(currentIndex + offset) % movies.length];
      const imagePath = movie?.backdrop_path || movie?.poster_path;
      if (imagePath) new Image().src = `${IMG_BASE_ORIGINAL}${imagePath}`;
    });
  }, [movies, currentIndex]);

  // Sync Mute State
  useEffect(() => {
    if (ytPlayer1.current?.setVolume) ytPlayer1.current[isMuted ? "mute" : "unMute"]();
    if (ytPlayer2.current?.setVolume) ytPlayer2.current[isMuted ? "mute" : "unMute"]();
  }, [isMuted]);

  useEffect(() => {
    if (movies.length === 0 || !window.YT || !apiReady) return;

    const currentVid = movies[currentIndex]?.youtube_key;
    const nextIndex = (currentIndex + 1) % movies.length;
    const nextVid = movies[nextIndex]?.youtube_key;

    const playerToTarget = activePlayer === 1 ? ytPlayer1 : ytPlayer2;
    const otherPlayer = activePlayer === 1 ? ytPlayer2 : ytPlayer1;
    const targetDivId = activePlayer === 1 ? "anime-hero-yt-1" : "anime-hero-yt-2";
    const otherDivId = activePlayer === 1 ? "anime-hero-yt-2" : "anime-hero-yt-1";

    if (!playerToTarget.current && currentVid) {
      playerToTarget.current = new window.YT.Player(targetDivId, {
        videoId: currentVid,
        playerVars: { 
          autoplay: 1, 
          controls: 0, 
          mute: isMuted ? 1 : 0, 
          modestbranding: 1, 
          rel: 0, 
          iv_load_policy: 3, 
          showinfo: 0, 
          disablekb: 1 
        },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) handleVideoEnd();
          },
        },
      });
    } else if (playerToTarget.current?.loadVideoById && currentVid) {
      playerToTarget.current.loadVideoById(currentVid);
      playerToTarget.current.playVideo();
    }

    if (movies.length > 1) {
      if (!otherPlayer.current && nextVid) {
        otherPlayer.current = new window.YT.Player(otherDivId, {
          videoId: nextVid,
          playerVars: { autoplay: 0, controls: 0, mute: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
        });
      } else if (otherPlayer.current?.cueVideoById && nextVid) {
        otherPlayer.current.cueVideoById(nextVid);
      }
    }
  }, [currentIndex, movies, activePlayer, apiReady]);

  if (isLoading || movies.length === 0 || !currentMovie) {
    return <div className="hero-skeleton"><div className="hero-content"><div className="skeleton-title"></div></div></div>;
  }

  const title = currentMovie.name || currentMovie.title || currentMovie.original_name || "Featured Anime";
  const genreLabel = GENRE_MAP[currentMovie.genre_ids?.[0]] || "Action Anime";
  const yearLabel = (currentMovie.first_air_date || currentMovie.release_date || "").split("-")[0] || "2024";
  const maturityLabel = currentMovie.adult ? "18+" : "TV-14";
  const logoUrl = logos[currentMovie.id];

  return (
    <section className="hero anime-hero home-hero" aria-label="Featured Anime">
      <div className="hero-background">
        <div className={`hero-video-container ${activePlayer === 1 ? "show-p1" : "show-p2"} ${fade ? "transitioning" : ""}`}>
          <div id="anime-hero-yt-1" className="player-frame"></div>
          <div id="anime-hero-yt-2" className="player-frame"></div>
          <img 
            src={`${IMG_BASE_ORIGINAL}${currentMovie.backdrop_path || currentMovie.poster_path}`} 
            alt={title} 
            className="hero-image fallback" 
          />
        </div>
      </div>

      {/* Netflix Directional Scrim Overlays */}
      <div className="hero-netflix-scrim-left" />
      <div className="hero-netflix-scrim-bottom" />
      <div className="hero-netflix-scrim-top" />

      <div className={`hero-content ${fade ? "fade-out" : "fade-in"}`}>
        {/* MMAX Brand Kicker */}
        <div className="hero-kicker-mmax">
          <img src={brandLogo} alt="MMAX" className="hero-kicker-mmax-logo" />
        </div>

        {/* Title Logo or Bold Title */}
        <div className="hero-title-area">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={title}
              className="hero-title-logo"
              onError={() => setLogos((prev) => ({ ...prev, [currentMovie.id]: null }))}
            />
          ) : (
            <h1 className="hero-title">{title}</h1>
          )}
        </div>

        {/* Bullet-separated metadata row (Anime • Genre • Year • TV-14) */}
        <div className="hero-netflix-meta">
          <span className="hero-meta-item">Anime</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-meta-item">{genreLabel}</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-meta-item">{yearLabel}</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-maturity-badge">{maturityLabel}</span>
        </div>

        <p className="hero-synopsis">
          {currentMovie.overview?.length > 170
            ? `${currentMovie.overview.substring(0, 170)}...`
            : currentMovie.overview || "Discover the latest anime now."}
        </p>

        <div className="hero-actions">
          <button 
            className="hero-btn play" 
            onClick={() => {
              setModalStartPlaying(true);
              setSelectedMovie(currentMovie);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play</span>
          </button>
          <button 
            className="hero-btn more-info" 
            onClick={() => {
              setModalStartPlaying(false);
              setSelectedMovie(currentMovie);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>More Info</span>
          </button>
        </div>
      </div>

      <div className="hero-right-controls">
        <button className="mute-btn" onClick={() => setIsMuted(!isMuted)} aria-label="Toggle mute">
          {isMuted ? "🔇" : "🔊"}
        </button>
        <div className="hero-netflix-pill-badge">
          <span className="hero-badge-icon" aria-hidden="true">📅</span>
          <span>Top 10 Today</span>
        </div>
      </div>

      {selectedMovie && (
        <MovieModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
          initialPlaying={modalStartPlaying}
        />
      )}
    </section>
  );
}

export default AnimeHeroSection;
