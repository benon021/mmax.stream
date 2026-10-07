import TVHeroSection from "../components/TVHeroSection";
import EndlessMediaGrid from "../components/EndlessMediaGrid";
import { getPopularTV } from "../services/api";
import "../css/TVShows.css";

function TVShows() {
  return (
    <div className="tvshows-page">
      <TVHeroSection />
      <EndlessMediaGrid fetchFn={getPopularTV} mediaType="tv" />
    </div>
  );
}

export default TVShows;
