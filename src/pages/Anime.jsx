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
  return (
    <div className="anime-page">
      <AnimeHeroSection />

      <div className="section-content">
        <MovieRow title="Trending Anime" tabs={trendingTabs} layout="grid" />
        <MovieRow title="Popular Anime" tabs={popularTabs} layout="grid" />
        <MovieRow
          title="Must Watch Classics"
          tabs={[{ label: "Top Rated", fetchFn: getTopRatedAnime }]}
          layout="grid"
        />
      </div>
    </div>
  );
}

export default Anime;
