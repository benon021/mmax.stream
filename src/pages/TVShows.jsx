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
  { label: "Today", fetchFn: () => getTrendingTV("day") },
  { label: "This Week", fetchFn: () => getTrendingTV("week") },
];

function TVShows() {
  return (
    <div className="tvshows-page">
      <TVHeroSection />

      <div className="section-divider" />
      <MovieRow title="Trending TV" tabs={trendingTabs} />
      <div className="section-divider" />
      <MovieRow title="What's Popular on TV" tabs={popularTabs} />
      <div className="section-divider" />
      <MovieRow
        title="Top Rated Shows"
        tabs={[{ label: "Top Rated", fetchFn: getTopRatedTV }]}
      />
    </div>
  );
}

export default TVShows;
