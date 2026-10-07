import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../css/Landing.css";
import brandLogo from "../assets/mmax-stream-logo.svg";
import { getPopularMovies } from "../services/api";

const DEFAULT_POSTERS_COL1 = [
  "https://image.tmdb.org/t/p/w342/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "https://image.tmdb.org/t/p/w342/ijw98f8kS3NqfV9iYq5fB3QzX6Z.jpg",
  "https://image.tmdb.org/t/p/w342/9cxWwz2m5q75Wd99Lq1oB6t1d5m.jpg",
  "https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  "https://image.tmdb.org/t/p/w342/iADOJ8Zymht2JPMoy3R7xUMZ51f.jpg",
  "https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
];

const DEFAULT_POSTERS_COL2 = [
  "https://image.tmdb.org/t/p/w342/jwoaKyVqPgqR5X9xQ9a5y4e8b3b.jpg",
  "https://image.tmdb.org/t/p/w342/pjnD08FlMAIXsfOLKQbvmO0f0MD.jpg",
  "https://image.tmdb.org/t/p/w342/b33nnKl1GSFbao8l3fZkyRdfPQA.jpg",
  "https://image.tmdb.org/t/p/w342/7WsyChvgrmaOO0F7n7rlPBDqUvm.jpg",
  "https://image.tmdb.org/t/p/w342/8OhuLSlqJ0hT0bL02g8WkYm2h3H.jpg",
];

const DEFAULT_POSTERS_COL3 = [
  "https://image.tmdb.org/t/p/w342/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
  "https://image.tmdb.org/t/p/w342/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
  "https://image.tmdb.org/t/p/w342/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg",
  "https://image.tmdb.org/t/p/w342/hU1Q9YVzdYolferIA84GpH6i072.jpg",
  "https://image.tmdb.org/t/p/w342/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
];

const DEFAULT_MIDDLE_POOL = [
  "https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "https://image.tmdb.org/t/p/w342/r2J02Z2OpNTctfOSN2Ydgii51xQ.jpg",
  "https://image.tmdb.org/t/p/w342/saHpda7mgrPlvBwKYgCw9ZsNeNu.jpg",
  "https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
  "https://image.tmdb.org/t/p/w342/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
  "https://image.tmdb.org/t/p/w342/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
  "https://image.tmdb.org/t/p/w342/7IIBsTF7XKQIWaP392vvd6Te095.jpg",
  "https://image.tmdb.org/t/p/w342/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  "https://image.tmdb.org/t/p/w342/5KCVkau1HEl7ZzfPsKAPM0sMiKc.jpg",
  "https://image.tmdb.org/t/p/w342/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg",
  "https://image.tmdb.org/t/p/w342/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
  "https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
];

function Landing() {
  const [col1Posters, setCol1Posters] = useState(DEFAULT_POSTERS_COL1);
  const [col2Posters, setCol2Posters] = useState(DEFAULT_POSTERS_COL2);
  const [col3Posters, setCol3Posters] = useState(DEFAULT_POSTERS_COL3);
  const [middlePool, setMiddlePool] = useState(DEFAULT_MIDDLE_POOL);
  const [blinkingSlot, setBlinkingSlot] = useState(null);
  const poolIndexRef = useRef(0);
  const lastBlinkedSlotRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getPopularMovies(1), getPopularMovies(2)])
      .then(([page1, page2]) => {
        if (cancelled) return;
        const allMovies = [...(page1 || []), ...(page2 || [])];
        const uniquePosters = [];
        const seen = new Set();

        for (const m of allMovies) {
          if (m?.poster_path && !seen.has(m.poster_path)) {
            seen.add(m.poster_path);
            uniquePosters.push("https://image.tmdb.org/t/p/w342" + m.poster_path);
          }
        }

        if (uniquePosters.length >= 25) {
          setCol1Posters(uniquePosters.slice(0, 6));
          setCol3Posters(uniquePosters.slice(6, 12));
          setCol2Posters(uniquePosters.slice(12, 17));
          setMiddlePool(uniquePosters.slice(17));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Preload upcoming pool posters progressively (only 2 at a time) to prevent network choking
  useEffect(() => {
    if (!middlePool || middlePool.length === 0) return;
    const nextIdx = poolIndexRef.current % middlePool.length;
    const toPreload = [middlePool[nextIdx], middlePool[(nextIdx + 1) % middlePool.length]];
    toPreload.forEach((url) => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [middlePool, col2Posters]);

  // Periodic random, organic dissolve transition for middle column cards (no predictable order)
  useEffect(() => {
    if (!middlePool || middlePool.length === 0 || col2Posters.length === 0) return;

    let swapTimer = null;
    let endTimer = null;

    const runRandomDissolve = () => {
      // Pick a random card slot that wasn't the last one that transitioned
      const candidateSlots = col2Posters
        .map((_, idx) => idx)
        .filter((idx) => idx !== lastBlinkedSlotRef.current);
      const chosenSlot =
        candidateSlots.length > 0
          ? candidateSlots[Math.floor(Math.random() * candidateSlots.length)]
          : 0;

      lastBlinkedSlotRef.current = chosenSlot;
      setBlinkingSlot(chosenSlot);

      // Midpoint of smooth fade (600ms): swap image while fully dissolved
      swapTimer = setTimeout(() => {
        setCol2Posters((currentPosters) => {
          const next = [...currentPosters];
          const poolItem = middlePool[poolIndexRef.current % middlePool.length];
          poolIndexRef.current = (poolIndexRef.current + 1) % middlePool.length;
          next[chosenSlot] = poolItem;
          return next;
        });
      }, 600);

      // Transition complete (1300ms): smoothly return to visible
      endTimer = setTimeout(() => {
        setBlinkingSlot(null);
      }, 1300);
    };

    // Organic interval: 3.2 seconds
    const interval = setInterval(runRandomDissolve, 3200);

    return () => {
      clearInterval(interval);
      if (swapTimer) clearTimeout(swapTimer);
      if (endTimer) clearTimeout(endTimer);
    };
  }, [middlePool, col2Posters.length]);

  return (
    <div className="vidlink-landing-container">
      {/* Dot Grid Background */}
      <div className="vidlink-dot-grid" aria-hidden="true" />

      {/* Main Split Hero (100vh) */}
      <div className="vidlink-hero-stage">
        {/* Left Side: Information & CTAs */}
        <div className="vidlink-info-side">
          <div className="vidlink-brand-logo-row">
            <img src={brandLogo} alt="MMAX" className="vidlink-mmax-logo" />
          </div>

          <h1 className="vidlink-headline">
            Biggest and Fastest
            <span className="vidlink-headline-gradient"> Streaming Platform</span>
          </h1>

          <div className="vidlink-cta-row">
            <Link to="/movies" className="vidlink-btn-get-started">
              <span>GET STARTED &gt;</span>
            </Link>
          </div>
        </div>

        {/* Right Side: 3 Moving Columns (Col 1 UP, Col 2 STILL, Col 3 DOWN) */}
        <div className="vidlink-posters-side">
          {/* Top & Bottom Vignette Mask */}
          <div className="vidlink-posters-mask-top" />
          <div className="vidlink-posters-mask-bottom" />

          {/* Column 1: Moves UP */}
          <div className="vidlink-col-track col-move-up">
            <div className="vidlink-col-stream">
              {[...col1Posters, ...col1Posters].map((src, idx) => (
                <div key={"c1-" + idx} className="vidlink-poster-card">
                  <img src={src} alt="Movie poster" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: STILL (Static with smooth blink fade transition) */}
          <div className="vidlink-col-track col-still">
            <div className="vidlink-col-stream-still">
              {col2Posters.map((src, idx) => (
                <div
                  key={"c2-" + idx}
                  className={`vidlink-poster-card middle-card ${
                    blinkingSlot === idx ? "is-blinking" : ""
                  }`}
                >
                  <img src={src} alt="Featured movie poster" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Moves DOWN */}
          <div className="vidlink-col-track col-move-down">
            <div className="vidlink-col-stream">
              {[...col3Posters, ...col3Posters].map((src, idx) => (
                <div key={"c3-" + idx} className="vidlink-poster-card">
                  <img src={src} alt="Movie poster" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;