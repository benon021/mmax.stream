import { useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import "../css/MovieRow.css";

function SkeletonCards({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="skeleton-card">
      <div className="skeleton-poster" />
      <div className="skeleton-info" />
    </div>
  ));
}

/**
 * MovieRow
 * @param {string}   title       - Section heading
 * @param {Array}    tabs        - Array of { label, fetchFn } objects
 */
function MovieRow({ title, tabs }) {
  const [activeTab, setActiveTab] = useState(0);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetchFn = tabs[activeTab]?.fetchFn;
    if (!fetchFn) return;

    fetchFn()
      .then((data) => {
        if (!cancelled) {
          setMovies(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTab, tabs]);

  return (
    <section className="movie-row-section">
      <div className="movie-row-header">
        <h2>{title}</h2>
        {tabs.length > 1 && (
          <div className="tab-filters">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                className={`tab-filter-btn ${i === activeTab ? "active" : ""}`}
                onClick={() => setActiveTab(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="movie-row-scroll">
        {loading ? (
          <SkeletonCards />
        ) : (
          movies.slice(0, 20).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))
        )}
      </div>
    </section>
  );
}

export default MovieRow;
