import { Link } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/Favorites.css";

function Favorites() {
  const { favorites } = useMovieContext();

  if (!favorites || favorites.length === 0) {
    return (
      <div className="favorites-empty">
        <div className="empty-icon">♥</div>
        <h2>No Favourite Movies Yet</h2>
        <p>
          Start adding movies and TV shows to your favourites and they will
          appear here!
        </p>
        <Link to="/" className="browse-btn">
          Browse Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h2>My Favourites ({favorites.length})</h2>
      <div className="movies-grid">
        {favorites.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  );
}

export default Favorites;
