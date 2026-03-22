import { useUser } from "../contexts/UserContext";
import "../css/Footer.css";

function Footer() {
  const { user } = useUser();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Logo block */}
        <div className="footer-logo-block">
          <div>
            <div className="footer-logo-text">MMax◆<br />Stream</div>
            <span className="footer-logo-pill"></span>
          </div>
          <button className="footer-hi-btn">Hi {user.name}!</button>
        </div>

        {/* THE BASICS */}
        <div className="footer-col">
          <h4>THE BASICS</h4>
          <ul>
            <li><a href="#">About us</a></li>
            
          </ul>
        </div>

        {/* GET INVOLVED */}
        <div className="footer-col">
          <h4>GET INVOLVED</h4>
          <ul>
            <li><a href="#">Contribution Bible</a></li>
            
          </ul>
        </div>

        {/* COMMUNITY */}
        <div className="footer-col">
          <h4>COMMUNITY</h4>
          <ul>
            <li><a href="#">Guidelines</a></li>
          
          </ul>
        </div>

        {/* LEGAL */}
        <div className="footer-col">
          <h4>LEGAL</h4>
          <ul>
            <li><a href="#">Terms of Use</a></li>
            
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        Build by papsy.tech
      </div>
    </footer>
  );
}

export default Footer;
