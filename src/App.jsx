import { useState, useEffect } from "react";
import "./css/App.css";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import TVShows from "./pages/TVShows";
import People from "./pages/People";
import Awards from "./pages/Awards";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { MovieProvider } from "./contexts/MovieContext";
import NavBar from "./components/NavBar";

import Landing from "./pages/Landing";
import Anime from "./pages/Anime";
import Login from "./pages/Login";
import { UserProvider } from "./contexts/UserContext";
import RefreshLoader from "./components/RefreshLoader";
import PullToRefresh from "./components/PullToRefresh";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setIsAtTop(window.scrollY === 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (query) => {
    navigate(`/movies?search=${encodeURIComponent(query)}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLandingPage = location.pathname === "/";
  const isSearchPage = location.pathname === "/movies" && Boolean(new URLSearchParams(location.search).get("search"));

  return (
    <UserProvider>
      <MovieProvider>
        <div className={`app-container ${isLandingPage ? "landing-mode" : ""} ${isSearchPage ? "search-page-mode" : ""}`}>
          <RefreshLoader />
          {!isLandingPage && !isSearchPage && <NavBar onSearch={handleSearch} isScrolled={isScrolled} isAtTop={isAtTop} />}
          
          <PullToRefresh>
            <main className="content-area">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/movies" element={<Home />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/tv-shows" element={<TVShows />} />
                <Route path="/anime" element={<Anime />} />
                <Route path="/people" element={<People />} />
                <Route path="/awards" element={<Awards />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>

          </PullToRefresh>
          {isScrolled && (
            <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
              <span aria-hidden="true">↑</span>
              <span>Top</span>
            </button>
          )}
        </div>
      </MovieProvider>
    </UserProvider>
  );
}

export default App;
