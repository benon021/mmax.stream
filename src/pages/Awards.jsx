import { useState, useEffect } from "react";
import { getTopRatedMovies } from "../services/api";
import MovieCard from "../components/MovieCard";
import "../css/Awards.css";

function Awards() {
  const [awardsContent, setAwardsContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAwards = async () => {
      setLoading(true);
      try {
        const data = await getTopRatedMovies();
        setAwardsContent(data.slice(0, 18));
      } catch (error) {
        console.error("Failed to fetch awards content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAwards();
  }, []);

  return (
    <div className="awards-page">
      <div className="awards-hero-banner">
        <div className="awards-icon-wrap">
          <svg viewBox="0 0 24 24" fill="#ff7200" width="80" height="80">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </div>
        <h1 className="awards-title-premium">Cinematic Excellence</h1>
        <p className="awards-subtitle">A curated selection of award-winning masterpieces and top-rated classics.</p>
        <div className="gold-divider" />
      </div>

      <div className="awards-grid-premium">
        {awardsContent.map((movie) => (
          <div key={movie.id} className="award-card-wrap">
             <div className="award-badge-premium">🏆 TOP RATED</div>
             <MovieCard movie={movie} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="awards-loading-liquid">
           <div className="golden-spinner"></div>
           POLISHING STATUETTES...
        </div>
      )}
    </div>
  );
}

export default Awards;
