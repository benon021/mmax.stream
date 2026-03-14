import MovieRow from "../components/MovieRow";
import {
  getPopularTV,
  getAiringTodayTV,
  getOnAirTV,
  getTopRatedTV,
  getTrendingTV,
} from "../services/api";
import "../css/TVShows.css";

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
      <div
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, #0d3b5e 100%)",
          padding: "2.5rem 2rem",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>TV Shows</h1>
        <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>
          Discover popular and trending TV shows from around the world.
        </p>
      </div>

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
