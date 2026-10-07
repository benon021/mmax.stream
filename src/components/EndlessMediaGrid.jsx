import { useState, useEffect, useRef, useCallback } from "react";
import MovieCard from "./MovieCard";
import "../css/EndlessMediaGrid.css";

function SkeletonCard() {
  return (
    <div className="endless-skeleton-card">
      <div className="endless-skeleton-poster" />
    </div>
  );
}

export default function EndlessMediaGrid({ fetchFn, mediaType = "movie" }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const gridContainerRef = useRef(null);

  // Mouse drag-to-scroll state
  const isMouseDown = useRef(false);
  const startY = useRef(0);
  const scrollStart = useRef(0);
  const hasDragged = useRef(false);

  // Fetch items for current page
  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await fetchFn(page);
        if (cancelled) return;

        if (Array.isArray(data) && data.length > 0) {
          const valid = data.filter(
            (item) => item && (item.poster_path || item.backdrop_path)
          );

          setItems((prev) => {
            const seen = new Set(prev.map((i) => i.id));
            const newItems = valid
              .filter((i) => !seen.has(i.id))
              .map((i) => ({
                ...i,
                media_type: i.media_type || mediaType,
              }));
            return page === 1 ? newItems : [...prev, ...newItems];
          });

          if (data.length < 8) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load endless media page:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [fetchFn, page, mediaType]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      {
        rootMargin: "600px",
      }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Mouse drag-to-scroll handlers (for desktop drag experience)
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest("button, a, input, select, textarea")) return;

    isMouseDown.current = true;
    hasDragged.current = false;
    startY.current = e.clientY;
    scrollStart.current = window.scrollY;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown.current) return;
    const diff = e.clientY - startY.current;
    if (Math.abs(diff) > 6) {
      hasDragged.current = true;
      window.scrollTo(0, scrollStart.current - diff);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
    // Keep hasDragged true momentarily so click capture can suppress card opening
    setTimeout(() => {
      hasDragged.current = false;
    }, 60);
  }, []);

  const handleClickCapture = useCallback((e) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDown.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={gridContainerRef}
      className="endless-media-section"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClickCapture={handleClickCapture}
    >
      <div className="movies-grid">
        {items.map((item) => (
          <MovieCard key={item.id} movie={item} variant="grid" />
        ))}

        {loading && (
          Array.from({ length: 18 }).map((_, i) => (
            <SkeletonCard key={`init-${i}`} />
          ))
        )}

        {loadingMore && (
          Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={`more-${i}`} />
          ))
        )}
      </div>

      <div ref={sentinelRef} className="endless-sentinel" />
    </div>
  );
}
