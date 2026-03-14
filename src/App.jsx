import { useState, useEffect } from "react";
import "./css/App.css";
import Favorites from "./pages/Favorites";
import Home from "./pages/Home";
import TVShows from "./pages/TVShows";
import { Routes, Route, useNavigate } from "react-router-dom";
import { MovieProvider } from "./contexts/MovieContext";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

function App() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (query) => {
    // NavBar search navigates to home and triggers search there
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <MovieProvider>
      <div className="app-wrapper">
        <NavBar onSearch={handleSearch} isScrolled={isScrolled} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/tv-shows" element={<TVShows />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </MovieProvider>
  );
}

export default App;
