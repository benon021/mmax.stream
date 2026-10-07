import brandLogo from "../assets/mmax-stream-logo.svg";
import { useEffect, useRef, useState } from "react";
import "../css/HeroSection.css";
import MovieModal from "./MovieModal";
import { getLatestMovies, getMovieDetails } from "../services/api";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
};

function HeroSection() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalStartPlaying, setModalStartPlaying] = useState(false);
  const [logos, setLogos] = useState({});
  const transitionTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getLatestMovies()
      .then((latestMovies) => {
        if (!cancelled) setMovies(latestMovies || []);
      })
      .catch((error) => {
        console.error("Failed to fetch latest movies for hero:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch official title logo for the active featured movie
  const currentMovie = movies[currentIndex];

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

  useEffect(() => {
    if (movies.length < 2) return undefined;

    const timer = setInterval(() => {
      setPreviousIndex(currentIndex);
      setCurrentIndex((current) => (current + 1) % movies.length);
      setIsTransitioning(true);
      clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => {
        setPreviousIndex(null);
        setIsTransitioning(false);
      }, 700);
    }, 20000);

    return () => {
      clearInterval(timer);
      clearTimeout(transitionTimer.current);
    };
  }, [movies.length, currentIndex]);

  useEffect(() => {
    if (movies.length < 2) return;

    [1, 2, 3].forEach((offset) => {
      const movie = movies[(currentIndex + offset) % movies.length];
      const imagePath = movie?.backdrop_path || movie?.poster_path;
      if (imagePath) new Image().src = `${IMG_BASE_ORIGINAL}${imagePath}`;
    });
  }, [movies, currentIndex]);

  const previousMovie = previousIndex === null ? null : movies[previousIndex];

  if (isLoading || !currentMovie) {
    return (
      <div className="hero-skeleton">
        <div className="hero-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
        </div>
      </div>
    );
  }

  const title = currentMovie.title || currentMovie.name || currentMovie.original_title || "Latest movie";
  const imagePath = currentMovie.backdrop_path || currentMovie.poster_path;
  const isTV = Boolean(currentMovie.media_type === "tv" || currentMovie.name || currentMovie.first_air_date);
  const mediaTypeLabel = isTV ? "Show" : "Film";
  const genreLabel = GENRE_MAP[currentMovie.genre_ids?.[0]] || (isTV ? "Drama" : "Fantasy");
  const yearLabel = (currentMovie.release_date || currentMovie.first_air_date || "").split("-")[0] || "2024";
  const maturityLabel = currentMovie.adult ? "18+" : (currentMovie.vote_average >= 7.5 ? "TV-14" : "PG-13");
  const logoUrl = logos[currentMovie.id];
return (
    <section className="hero home-hero" aria-label="Latest movies">
      <div className="hero-background">
        <div className={`hero-image-container ${isTransitioning ? "is-transitioning" : ""}`}>
          {previousMovie && (
            <img
              src={`${IMG_BASE_ORIGINAL}${previousMovie.backdrop_path || previousMovie.poster_path}`}
              alt=""
              className="hero-image hero-image-previous"
            />
          )}
          <img src={`${IMG_BASE_ORIGINAL}${imagePath}`} alt="" className="hero-image hero-image-current" />
        </div>
      </div>

      {/* Netflix Directional Scrim Overlay */}
      <div className="hero-netflix-scrim-left" />
      <div className="hero-netflix-scrim-bottom" />
      <div className="hero-netflix-scrim-top" />

      <div className="hero-content">
        {/* Netflix Red Brand Kicker (matching reference) */}
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

        {/* Bullet-separated metadata row (Show • Fantasy • 2022 • TV-14) */}
        <div className="hero-netflix-meta">
          <span className="hero-meta-item">{mediaTypeLabel}</span>
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
            : currentMovie.overview || "Discover the latest movies now."}
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
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>More Info</span>
          </button>
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

export default HeroSection;
