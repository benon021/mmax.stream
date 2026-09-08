import { Link, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import "../css/Footer.css";
import brandLogo from "../assets/mmax-stream-logo.svg";

const FOOTER_LINKS = [
  { label: "Home", to: "/" },
  { label: "Movies", to: "/movies" },
  { label: "TV", to: "/tv-shows" },
  { label: "Anime", to: "/anime" },
  { label: "Favorites", to: "/favorites" },
  { label: "People", to: "/people" },
  { label: "Awards", to: "/awards" },
];

function Footer() {
  const { user } = useUser();
  const location = useLocation();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <img src={brandLogo} alt="MMAX.STREAM" className="footer-brand-logo" />
          <span className="footer-tagline">Your screen. Your story.</span>
          <span className="footer-user">Hi, {user.name}</span>
        </div>

        <nav className="footer-navigation" aria-label="Bottom navigation">
          {FOOTER_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`footer-nav-link ${location.pathname === item.to ? "active" : ""}`}
              aria-current={location.pathname === item.to ? "page" : undefined}
            >
              <span className="footer-nav-dot" aria-hidden="true"></span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <span>mmax.stream</span>
        <span>Built by papsy.tech</span>
      </div>
    </footer>
  );
}

export default Footer;
