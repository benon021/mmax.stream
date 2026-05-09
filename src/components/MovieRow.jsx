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
 * @param {string}   layout      - "row" | "grid"
 */
function MovieRow({ title, tabs, layout = "row" }) {
  const [activeTab, setActiveTab] = useState(0);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const rowRef = useRef(null);
  const scrollRef = useRef(null);
  const loadMoreRef = useRef(null);

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

  // Reset state when tab changes
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
  }, [activeTab]);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    const fetchFn = tabs[activeTab]?.fetchFn;
    if (!fetchFn) return;

    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    const fetchData = () => {
      fetchFn(page)
        .then((data) => {
          if (!cancelled) {
            if (data && data.length > 0) {
              setMovies((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newMovies = data.filter((m) => !existingIds.has(m.id));
                return page === 1 ? data : [...prev, ...newMovies];
              });
              // TMDB typically returns 20 items per page. If we get less, we reached the end.
              setHasMore(data.length >= 20);
            } else {
              setHasMore(false);
            }
            setLoading(false);
            setLoadingMore(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoading(false);
            setLoadingMore(false);
          }
        });
    };

    fetchData();

    const isContinueWatching = title === "Continue Watching";
    if (isContinueWatching && page === 1) {
      window.addEventListener("progressUpdate", fetchData);
    }

    return () => {
      cancelled = true;
      if (isContinueWatching) {
        window.removeEventListener("progressUpdate", fetchData);
      }
    };
  }, [activeTab, tabs, isVisible, page, title]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (layout !== "grid" || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "100px" }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [layout, hasMore, loading, loadingMore]);

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
        className={layout === "grid" ? "movies-grid" : "movie-row-scroll"}
        onWheel={layout === "grid" ? null : handleWheel}
      >
        {loading ? (
          <SkeletonCards />
        ) : (
          <>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} variant={layout === "grid" ? "grid" : "row"} />
            ))}
            
            {/* Infinite Scroll Trigger */}
            {layout === "grid" && hasMore && (
              <div ref={loadMoreRef} className="infinite-scroll-trigger">
                {loadingMore ? <SkeletonCards count={4} /> : null}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default memo(MovieRow);
