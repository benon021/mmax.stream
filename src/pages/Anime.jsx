import AnimeHeroSection from "../components/AnimeHeroSection";
import EndlessMediaGrid from "../components/EndlessMediaGrid";
import { getPopularAnime } from "../services/api";
import "../css/Anime.css";

function Anime() {
  return (
    <div className="anime-page">
      <AnimeHeroSection />
      <EndlessMediaGrid fetchFn={getPopularAnime} mediaType="tv" />
    </div>
  );
}

export default Anime;
