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
  return (
    <div className="tvshows-page">
      <TVHeroSection />

      <div className="section-content">
        <MovieRow title="Trending TV" tabs={trendingTabs} layout="grid" />
        <MovieRow title="What's Popular on TV" tabs={popularTabs} layout="grid" />
        <MovieRow
          title="Top Rated Shows"
          tabs={[{ label: "Top Rated", fetchFn: getTopRatedTV }]}
          layout="grid"
        />
      </div>
    </div>
  );
}

export default TVShows;
