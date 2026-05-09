import { useState } from "react";
import MovieRow from "../components/MovieRow";
import {
  getPopularTV,
  getAiringTodayTV,
  getOnAirTV,
  getTopRatedTV,
  getTrendingTV,
} from "../services/api";
import "../css/TVShows.css";

import TVHeroSection from "../components/TVHeroSection";

const popularTabs = [
  { label: "Popular", fetchFn: getPopularTV },
  { label: "Airing Today", fetchFn: getAiringTodayTV },
  { label: "On TV", fetchFn: getOnAirTV },
  { label: "Top Rated", fetchFn: getTopRatedTV },
];

const trendingTabs = [
  { label: "Today", fetchFn: (page) => getTrendingTV("day", page) },
  { label: "This Week", fetchFn: (page) => getTrendingTV("week", page) },
];

function TVShows() {
  const [activeSection, setActiveSection] = useState("Trending TV");

  const sections = [
    { id: "Trending TV", label: "Trending" },
    { id: "What's Popular on TV", label: "What's Popular" },
    { id: "Top Rated Shows", label: "Top Rated" },
  ];

  return (
    <div className="tvshows-page">
      <TVHeroSection />

      <div className="top-sections-tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`section-tab-btn ${activeSection === section.id ? "active" : ""}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="section-content">
        {activeSection === "Trending TV" && (
          <MovieRow title="Trending TV" tabs={trendingTabs} layout="grid" />
        )}
        {activeSection === "What's Popular on TV" && (
          <MovieRow title="What's Popular on TV" tabs={popularTabs} layout="grid" />
        )}
        {activeSection === "Top Rated Shows" && (
          <MovieRow
            title="Top Rated Shows"
            tabs={[{ label: "Top Rated", fetchFn: getTopRatedTV }]}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}

export default TVShows;
