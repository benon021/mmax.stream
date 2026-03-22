import MovieRow from "../components/MovieRow";
import {
  getPopularAnime,
  getTrendingAnime,
  getTopRatedAnime,
} from "../services/api";
import "../css/Anime.css";

import AnimeHeroSection from "../components/AnimeHeroSection";

// No dedicated AnimeHero for now, we'll use a standard layout or just rows
// Or we can repurposed TVHeroSection if we pass it anime content

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

      <div className="section-divider" />
      <MovieRow title="Trending Anime" tabs={trendingTabs} />
      
      <div className="section-divider" />
      <MovieRow title="Popular Anime" tabs={popularTabs} />
      
      <div className="section-divider" />
      <MovieRow
        title="Must Watch Classics"
        tabs={[{ label: "Top Rated", fetchFn: getTopRatedAnime }]}
      />
    </div>
  );
}

export default Anime;
