import { useState } from "react";
import MovieRow from "../components/MovieRow";
import {
  getPopularAnime,
  getTrendingAnime,
  getTopRatedAnime,
} from "../services/api";
import "../css/Anime.css";

import AnimeHeroSection from "../components/AnimeHeroSection";

const popularTabs = [
  { label: "Popular", fetchFn: getPopularAnime },
  { label: "Top Rated", fetchFn: getTopRatedAnime },
];

const trendingTabs = [
  { label: "Trending This Week", fetchFn: getTrendingAnime },
];

function Anime() {
  const [activeSection, setActiveSection] = useState("Trending Anime");

  const sections = [
    { id: "Trending Anime", label: "Trending" },
    { id: "Popular Anime", label: "Popular" },
    { id: "Must Watch Classics", label: "Classics" },
  ];

  return (
    <div className="anime-page">
      <AnimeHeroSection />

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
        {activeSection === "Trending Anime" && (
          <MovieRow title="Trending Anime" tabs={trendingTabs} layout="grid" />
        )}
        {activeSection === "Popular Anime" && (
          <MovieRow title="Popular Anime" tabs={popularTabs} layout="grid" />
        )}
        {activeSection === "Must Watch Classics" && (
          <MovieRow
            title="Must Watch Classics"
            tabs={[{ label: "Top Rated", fetchFn: getTopRatedAnime }]}
            layout="grid"
          />
        )}
      </div>
    </div>
  );
}

export default Anime;
