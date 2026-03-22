import { useState, useEffect, useRef, memo } from "react";
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
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef(null);
  const scrollRef = useRef(null);

  const handleWheel = (event) => {
    const el = scrollRef.current;
    if (!el) return;

    // Only hijack vertical wheel scroll when the row can actually scroll horizontally.
    const canScrollHorizontally = el.scrollWidth > el.clientWidth;
    if (!canScrollHorizontally) return;

    // Use deltaY to drive horizontal scroll, like Netflix row scroll.
    if (Math.abs(event.deltaY) > 0) {
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    }
  };

  // Lazy-load rows when they enter the viewport to reduce startup work
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

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

    return () => {
      cancelled = true;
    };
  }, [activeTab, tabs, isVisible]);

  return (
    <section ref={rowRef} className="movie-row-section">
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

      <div
        ref={scrollRef}
        className="movie-row-scroll"
        onWheel={handleWheel}
      >
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

export default memo(MovieRow);
