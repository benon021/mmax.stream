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
import Footer from "./components/Footer";

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

  const isLandingPage = location.pathname === "/";

  return (
    <UserProvider>
      <MovieProvider>
        <div className={`app-container ${isLandingPage ? "landing-mode" : ""}`}>
          <RefreshLoader />
          {!isLandingPage && <NavBar onSearch={handleSearch} isScrolled={isScrolled} isAtTop={isAtTop} />}
          
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

            {!isLandingPage && <Footer />}
          </PullToRefresh>
        </div>
      </MovieProvider>
    </UserProvider>
  );
}

export default App;
