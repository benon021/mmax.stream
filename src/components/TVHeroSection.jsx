import { useState, useEffect, useRef } from "react";
import "../css/HeroSection.css";
import MovieModal from "./MovieModal";
import { getTrendingTVWithVideos } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

function TVHeroSection() {
  const { isModalOpen } = useMovieContext();
  const [shows, setShows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-mute when modal opens
  useEffect(() => {
    if (isModalOpen) setIsMuted(true);
  }, [isModalOpen]);
  const [activePlayer, setActivePlayer] = useState(1);
  const [fade, setFade] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [apiReady, setApiReady] = useState(!!window.YT);

  const ytPlayer1 = useRef(null);
  const ytPlayer2 = useRef(null);
  const scriptLoaded = useRef(false);

  // Fetch TV content
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const trending = await getTrendingTVWithVideos("day");
        if (trending && trending.length > 0) {
          setShows(trending);
        }
      } catch (error) {
        console.error("Failed to fetch trending for TV hero:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrending();
  }, []);

  const currentShow = shows[currentIndex];

  // Load YouTube API
  useEffect(() => {
    if (scriptLoaded.current) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
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

  // Sync Mute State
  useEffect(() => {
    if (ytPlayer1.current?.setVolume) ytPlayer1.current[isMuted ? 'mute' : 'unMute']();
    if (ytPlayer2.current?.setVolume) ytPlayer2.current[isMuted ? 'mute' : 'unMute']();
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
          disablekb: 1
        },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) handleVideoEnd();
          }
        }
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
            onReady: () => { /* Ready */ }
          }
        });
      } else if (otherPlayer.current?.cueVideoById && nextVid) {
        otherPlayer.current.cueVideoById(nextVid);
      }
    }
  }, [currentIndex, shows, activePlayer, apiReady]);

  if (isLoading || shows.length === 0) {
    return <div className="hero-skeleton"></div>;
  }

  return (
    <section className="hero">
      <div className="hero-background">
        <div className={`hero-video-container ${activePlayer === 1 ? 'show-p1' : 'show-p2'} ${fade ? 'transitioning' : ''}`}>
          <div id="hero-yt-player-1" className="player-frame"></div>
          <div id="hero-yt-player-2" className="player-frame"></div>
          
          <img
            src={`${IMG_BASE_ORIGINAL}${currentShow.backdrop_path}`}
            alt={currentShow.name}
            className="hero-image fallback"
          />
        </div>
      </div>

      <div className="hero-vignette-top"></div>
      <div className="hero-vignette-bottom"></div>

      <div className={`hero-content ${fade ? "fade-out" : "fade-in"}`}>
        <div className="hero-series-type">
          <span className="brand-logo-small">m</span>
          <span className="series-text">mmax.stream series</span>
        </div>

        <h1 className="hero-title">{currentShow.name || currentShow.original_name}</h1>

        <p className="hero-synopsis">
          {currentShow.overview?.length > 150
            ? currentShow.overview.substring(0, 150) + "..."
            : currentShow.overview}
        </p>

        <div className="hero-actions">
          <button className="hero-btn play" onClick={() => setSelectedShow(currentShow)}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z" /></svg>
            <span>Play</span>
          </button>
          <button
            className="hero-btn more-info"
            onClick={() => setSelectedShow(currentShow)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
            <span>More Info</span>
          </button>
        </div>
      </div>

      <div className="hero-right-controls">
        <button className="mute-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <div className="maturity-badge-hero">16+</div>
      </div>

      {selectedShow && (
        <MovieModal 
          movie={selectedShow} 
          onClose={() => setSelectedShow(null)} 
        />
      )}
    </section>
  );
}

export default TVHeroSection;
