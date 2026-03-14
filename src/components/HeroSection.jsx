import { useState, useEffect, useRef } from "react";
import "../css/HeroSection.css";
import { getTrendingMovies, getMovieDetails } from "../services/api";
import { useNavigate } from "react-router-dom";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

function HeroSection() {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const [detailsCache, setDetailsCache] = useState({});
  const [isMuted, setIsMuted] = useState(true);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchHeroMovies = async () => {
      try {
        const trending = await getTrendingMovies("day");
        const top5 = trending.slice(0, 5);
        setMovies(top5);
      } catch (err) {
        console.error("Failed to fetch hero movies", err);
      }
    };
    fetchHeroMovies();
  }, []);

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    if (currentMovie && !detailsCache[currentMovie.id]) {
      getMovieDetails(currentMovie.id, "movie").then(data => {
        setDetailsCache(prev => ({ ...prev, [currentMovie.id]: data }));
      });
    }
  }, [currentMovie, detailsCache]);

  // 8 second carousel
  useEffect(() => {
    if (movies.length === 0) return;

    timerRef.current = setInterval(() => {
      setFade(true); // Trigger fade out

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
        setFade(false); // Trigger fade in
      }, 500); // 500ms fade transition

    }, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [movies.length]);

  if (!currentMovie) return <div className="hero-skeleton"></div>;

  const details = detailsCache[currentMovie.id];

  // Find trailer
  const trailer = details?.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");

  // Find US rating
  const release = details?.release_dates?.results?.find(r => r.iso_3166_1 === "US");
  const maturityRate = release?.release_dates?.[0]?.certification || "16+";

  return (
    <section className="hero">
      <div className={`hero-background ${fade ? "fade-out" : "fade-in"}`}>
        {trailer && !fade ? (
          <div className="hero-video-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailer.key}&rel=0&modestbranding=1`}
              title="Netflix Hero Trailer"
              allow="autoplay; encrypted-media"
              className="hero-video"
            />
          </div>
        ) : (
          <img
            src={`${IMG_BASE_ORIGINAL}${currentMovie.backdrop_path}`}
            alt={currentMovie.title}
            className="hero-image"
          />
        )}
      </div>

      {/* Dark gradient from bottom for readability */}
      <div className="hero-vignette-top"></div>
      <div className="hero-vignette-bottom"></div>

      <div className={`hero-content ${fade ? "fade-out" : "fade-in"}`}>
        {/* MMAX Series logo */}
        <div className="hero-series-type">
          <span className="brand-logo-small">R</span>
          <span className="series-text">S E R I E S</span>
        </div>

        <h1 className="hero-title">{currentMovie.title || currentMovie.name}</h1>

        <p className="hero-synopsis">
          {currentMovie.overview?.length > 150
            ? currentMovie.overview.substring(0, 150) + "..."
            : currentMovie.overview}
        </p>

        <div className="hero-actions">
          <button className="hero-btn play">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M8 5v14l11-7z" /></svg>
            <span>Play</span>
          </button>
          <button className="hero-btn more-info">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
            <span>More Info</span>
          </button>
        </div>
      </div>

      <div className="hero-right-controls">
        <button className="mute-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <div className="maturity-badge-hero">
          {maturityRate}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
