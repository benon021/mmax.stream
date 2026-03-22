import React, { useState, useEffect, useRef } from "react";
import "../css/PullToRefresh.css";

const PullToRefresh = ({ children, onRefresh }) => {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef(null);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0 || isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;

    if (diff > 0) {
      // Resistance effect
      const progress = Math.min(diff / 2, PULL_THRESHOLD + 20);
      setPullProgress(progress);
      
      if (progress > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullProgress >= PULL_THRESHOLD) {
      triggerRefresh();
    } else {
      setPullProgress(0);
    }
    setStartY(0);
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setPullProgress(PULL_THRESHOLD);
    
    // Simulate refresh or call onRefresh
    if (onRefresh) {
      onRefresh().then(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullProgress(0);
        }, 800);
      });
    } else {
      // Default behavior: reload page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="ptr-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`ptr-indicator ${isRefreshing ? "refreshing" : ""}`}
        style={{ 
          transform: `translateY(${pullProgress - 40}px)`,
          opacity: pullProgress / PULL_THRESHOLD 
        }}
      >
        <div className="ptr-icon-wrapper">
          <svg 
            className="ptr-spinner" 
            viewBox="0 0 24 24" 
            style={{ 
              transform: `rotate(${pullProgress * 4}deg)`,
              opacity: isRefreshing ? 1 : Math.min(pullProgress / PULL_THRESHOLD, 1)
            }}
          >
            <path 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm-6 8c0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z" 
            />
          </svg>
        </div>
      </div>
      <div 
        className="ptr-content"
        style={{ 
          transform: `translateY(${isRefreshing ? PULL_THRESHOLD : pullProgress}px)`,
          transition: isRefreshing || pullProgress === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
