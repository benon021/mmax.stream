import "../css/Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Logo block */}
        <div className="footer-logo-block">
          <div>
            <div className="footer-logo-text">THE<br />MOVIE<br />DB</div>
            <span className="footer-logo-pill">◆</span>
          </div>
          <button className="footer-hi-btn">Hi papsii!</button>
        </div>

        {/* THE BASICS */}
        <div className="footer-col">
          <h4>THE BASICS</h4>
          <ul>
            <li><a href="#">About TMDB</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">API Documentation</a></li>
            <li><a href="#">API for Business</a></li>
            <li><a href="#">System Status</a></li>
          </ul>
        </div>

        {/* GET INVOLVED */}
        <div className="footer-col">
          <h4>GET INVOLVED</h4>
          <ul>
            <li><a href="#">Contribution Bible</a></li>
            <li><a href="#">Add New Movie</a></li>
            <li><a href="#">Add New TV Show</a></li>
          </ul>
        </div>

        {/* COMMUNITY */}
        <div className="footer-col">
          <h4>COMMUNITY</h4>
          <ul>
            <li><a href="#">Guidelines</a></li>
            <li><a href="#">Discussions</a></li>
            <li><a href="#">Leaderboard</a></li>
            <li><a href="#">Support Forums</a></li>
          </ul>
        </div>

        {/* LEGAL */}
        <div className="footer-col">
          <h4>LEGAL</h4>
          <ul>
            <li><a href="#">Terms of Use</a></li>
            <li><a href="#">API Terms of Use</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">DMCA Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        Build 22aed24 [0183] · Powered by TMDB API
      </div>
    </footer>
  );
}

export default Footer;
