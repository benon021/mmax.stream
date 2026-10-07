import brandLogo from "../assets/mmax-stream-logo.svg";
import { useState, useEffect, useRef } from "react";
import "../css/HeroSection.css";
import MovieModal from "./MovieModal";
import { getTopRatedTVWithVideos, getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

const GENRE_MAP = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

function TVHeroSection() {
  const { isModalOpen } = useMovieContext();
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [activePlayer, setActivePlayer] = useState(1);
  const [fade, setFade] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
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

  // Fetch Top Rated TV content (shuffled at random)
  useEffect(() => {
    let cancelled = false;
    const loadTopRated = async () => {
      try {
        const topRated = await getTopRatedTVWithVideos();
        if (!cancelled && topRated && topRated.length > 0) {
          setShows(topRated);
        }
      } catch (error) {
        console.error("Failed to fetch top rated for TV hero:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadTopRated();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentShow = shows[currentIndex];

  // Fetch official title logo for the active featured show
  useEffect(() => {
    if (!currentShow?.id || logos[currentShow.id] !== undefined) return;

    let cancelled = false;
    getMovieDetails(currentShow.id, "tv")
      .then((data) => {
        if (cancelled) return;
        const logosList = data?.images?.logos || [];
        const enLogo = logosList.find((l) => l.iso_639_1 === "en");
        const chosen = enLogo || logosList[0];
        setLogos((prev) => ({
          ...prev,
          [currentShow.id]: chosen?.file_path ? `https://image.tmdb.org/t/p/w500${chosen.file_path}` : null,
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setLogos((prev) => ({ ...prev, [currentShow.id]: null }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentShow?.id, logos]);

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
    if (shows.length <= 1) return;
    setFade(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shows.length);
      setActivePlayer((prev) => (prev === 1 ? 2 : 1));
      setFade(false);
    }, 1000);
  };

  // Auto-advance rotation (25s timer like movie hero page or when video ends)
  useEffect(() => {
    if (shows.length <= 1) return;

    const timer = setTimeout(() => {
      handleVideoEnd();
    }, 25000);

    return () => clearTimeout(timer);
  }, [currentIndex, shows.length]);

  // Preload next backdrop images for seamless transition
  useEffect(() => {
    if (shows.length < 2) return;

    [1, 2, 3].forEach((offset) => {
      const show = shows[(currentIndex + offset) % shows.length];
      const imagePath = show?.backdrop_path || show?.poster_path;
      if (imagePath) new Image().src = `${IMG_BASE_ORIGINAL}${imagePath}`;
    });
  }, [shows, currentIndex]);

  // Sync Mute State
  useEffect(() => {
    if (ytPlayer1.current?.setVolume) ytPlayer1.current[isMuted ? "mute" : "unMute"]();
    if (ytPlayer2.current?.setVolume) ytPlayer2.current[isMuted ? "mute" : "unMute"]();
  }, [isMuted]);

  // Effect to manage players
  useEffect(() => {
    if (shows.length === 0 || !window.YT || !apiReady) return;

    const currentVid = shows[currentIndex]?.youtube_key;
    const nextIndex = (currentIndex + 1) % shows.length;
    const nextVid = shows[nextIndex]?.youtube_key;

    const playerToTarget = activePlayer === 1 ? ytPlayer1 : ytPlayer2;
    const otherPlayer = activePlayer === 1 ? ytPlayer2 : ytPlayer1;
    const targetDivId = activePlayer === 1 ? "hero-yt-player-1" : "hero-yt-player-2";
    const otherDivId = activePlayer === 1 ? "hero-yt-player-2" : "hero-yt-player-1";

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
          disablekb: 1,
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

    if (shows.length > 1) {
      if (!otherPlayer.current && nextVid) {
        otherPlayer.current = new window.YT.Player(otherDivId, {
          videoId: nextVid,
          playerVars: { autoplay: 0, controls: 0, mute: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
          events: {
            onReady: () => { /* Ready */ },
          },
        });
      } else if (otherPlayer.current?.cueVideoById && nextVid) {
        otherPlayer.current.cueVideoById(nextVid);
      }
    }
  }, [currentIndex, shows, activePlayer, apiReady]);

  if (isLoading || shows.length === 0 || !currentShow) {
    return <div className="hero-skeleton"></div>;
  }

  const title = currentShow.name || currentShow.original_name || "Featured Series";
  const genreLabel = GENRE_MAP[currentShow.genre_ids?.[0]] || "Drama";
  const yearLabel = (currentShow.first_air_date || "").split("-")[0] || "2024";
  const maturityLabel = currentShow.adult ? "18+" : (currentShow.vote_average >= 7.5 ? "TV-14" : "PG-13");
  const logoUrl = logos[currentShow.id];

  return (
    <section className="hero tv-hero home-hero" aria-label="Featured TV Shows">
      <div className="hero-background">
        <div className={`hero-video-container ${activePlayer === 1 ? "show-p1" : "show-p2"} ${fade ? "transitioning" : ""}`}>
          <div id="hero-yt-player-1" className="player-frame"></div>
          <div id="hero-yt-player-2" className="player-frame"></div>
          
          <img
            src={`${IMG_BASE_ORIGINAL}${currentShow.backdrop_path || currentShow.poster_path}`}
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
              onError={() => setLogos((prev) => ({ ...prev, [currentShow.id]: null }))}
            />
          ) : (
            <h1 className="hero-title">{title}</h1>
          )}
        </div>

        {/* Bullet-separated metadata row (Show • Genre • Year • TV-14) */}
        <div className="hero-netflix-meta">
          <span className="hero-meta-item">Series</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-meta-item">{genreLabel}</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-meta-item">{yearLabel}</span>
          <span className="hero-meta-bullet">•</span>
          <span className="hero-maturity-badge">{maturityLabel}</span>
        </div>

        <p className="hero-synopsis">
          {currentShow.overview?.length > 170
            ? `${currentShow.overview.substring(0, 170)}...`
            : currentShow.overview || "Discover the latest series now."}
        </p>

        <div className="hero-actions">
          <button 
            className="hero-btn play" 
            onClick={() => {
              setModalStartPlaying(true);
              setSelectedShow(currentShow);
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
              setSelectedShow(currentShow);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>More Info</span>
          </button>
        </div>
      </div>



      {selectedShow && (
        <MovieModal 
          movie={selectedShow} 
          onClose={() => setSelectedShow(null)} 
          initialPlaying={modalStartPlaying}
        />
      )}
    </section>
  );
}

export default TVHeroSection;
