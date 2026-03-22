import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Landing.css';

function Landing() {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <h1 className="animate-fade-up">MMax.Stream</h1>
          <p className="hero-tagline animate-fade-up delay-1">
            Where your favorite stories come to life. Ad-free. High speed. Pure cinema.
          </p>
          <Link to="/movies" className="cta-button animate-fade-up delay-2">
            Visit Movie Site
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="hero-background-blur"></div>
      </section>

      {/* Blog/Info Section */}
      <section className="landing-info">
        <div className="info-grid">
          <div className="info-card">
            <h3>Unlimited Entertainment</h3>
            <p>
              Dive into a vast library of the latest blockbusters, timeless classics, and trending TV shows. From Hollywood to Anime, we have it all.
            </p>
          </div>
          <div className="info-card">
            <h3>Premium Experience</h3>
            <p>
              Enjoy crystal clear 4K quality with no interruptions. Our optimized streaming technology ensures zero buffering on any device.
            </p>
          </div>
          <div className="info-card">
            <h3>For Every Device</h3>
            <p>
              Whether you're on your phone, tablet, or big-screen TV, MMax.Stream provides a seamless, immersive experience everywhere.
            </p>
          </div>
        </div>

        <div className="about-section">
          <h2>More than just a streaming site.</h2>
          <p>
            MMax.Stream was built by movie fans, for movie fans. We believe in the power of storytelling and the magic of cinema. Our goal is to provide a clean, user-friendly, and high-performance platform where you can discover new worlds and relive your favorites.
          </p>
          <div className="blog-posts">
            <div className="blog-post">
              <span className="post-date">March 20, 2026</span>
              <h4>The Future of Streaming: What's Next for MMax?</h4>
              <p>We're introducing new ways to discover content, including personalized AI recommendations and communal watch parties...</p>
            </div>
            <div className="blog-post">
              <span className="post-date">March 15, 2026</span>
              <h4>Top 10 Animes to Watch This Season</h4>
              <p>From the return of legendary series to brand new originals, this spring is packed with amazing anime. Check our top picks...</p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to start watching?</h2>
        <Link to="/movies" className="cta-button secondary">
          Explore the Library
        </Link>
      </section>
    </div>
  );
}

export default Landing;
