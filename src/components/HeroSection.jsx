import { useEffect, useRef, useState } from "react";
import "../css/HeroSection.css";
import MovieModal from "./MovieModal";
import { getLatestMovies } from "../services/api";

const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

function HeroSection() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
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
      const imagePath = movie.backdrop_path || movie.poster_path;
      if (imagePath) new Image().src = `${IMG_BASE_ORIGINAL}${imagePath}`;
    });
  }, [movies, currentIndex]);

  const currentMovie = movies[currentIndex];
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

  const title = currentMovie.title || currentMovie.original_title || "Latest movie";
  const imagePath = currentMovie.backdrop_path || currentMovie.poster_path;

  const selectMovie = (index) => {
    if (index === currentIndex) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex(index);
    setIsTransitioning(true);
    clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setPreviousIndex(null);
      setIsTransitioning(false);
    }, 700);
  };

  return (
    <section className="hero" aria-label="Latest movies">
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

      <div className="hero-vignette-top"></div>
      <div className="hero-vignette-bottom"></div>

      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-synopsis">
          {currentMovie.overview?.length > 150
            ? `${currentMovie.overview.substring(0, 150)}...`
            : currentMovie.overview || "Discover the latest movies now."}
        </p>
        <div className="hero-actions">
          <button className="hero-btn play" onClick={() => setSelectedMovie(currentMovie)}>
            <span aria-hidden="true">▶</span>
            <span>Play</span>
          </button>
          <button className="hero-btn more-info" onClick={() => setSelectedMovie(currentMovie)}>
            <span aria-hidden="true">ⓘ</span>
            <span>More Info</span>
          </button>
        </div>
      </div>

      <div className="hero-right-controls">
        <div className="maturity-badge-hero">Latest</div>
      </div>

      <div className="hero-dots" aria-label="Choose featured movie">
        {movies.map((movie, index) => (
          <button
            type="button"
            key={movie.id}
            className={`hero-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => selectMovie(index)}
            aria-label={`Show ${movie.title || movie.original_title || "movie"}`}
            aria-current={index === currentIndex ? "true" : undefined}
          />
        ))}
      </div>

      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </section>
  );
}

export default HeroSection;