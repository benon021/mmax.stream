import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../css/RefreshLoader.css";

const RefreshLoader = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loader on route change
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800); // 800ms animation

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="refresh-loader-container">
      <div className="refresh-loader-bar"></div>
      <div className="refresh-loader-spinner">
        <svg viewBox="0 0 50 50">
          <circle
            className="path"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
          ></circle>
        </svg>
      </div>
    </div>
  );
};

export default RefreshLoader;
