import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Landing.css";
import brandLogo from "../assets/mmax-stream-logo.svg";

const HERO_BACKDROP_IMAGES = [
  "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "https://image.tmdb.org/t/p/original/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
  "https://image.tmdb.org/t/p/original/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
  "https://image.tmdb.org/t/p/original/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
  "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=2400&q=85",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=2400&q=85",
];

/* Small inline icon set kept local so this file has zero new deps */
const Icon = {
  Arrow: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  Star: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
    </svg>
  ),
  Play: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  ),
  ShieldCheck: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  NoAds: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 8 8" />
    </svg>
  ),
  Heart: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M12 20.5s-7.5-4.6-9.7-9.2C.7 7.7 2.4 4.6 5.6 4c2-.4 3.9.6 4.9 2.2C11.5 4.6 13.4 3.6 15.4 4c3.2.6 4.9 3.7 3.3 7.3-2.2 4.6-9.7 9.2-9.7 9.2Z" />
    </svg>
  ),
  Film: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" />
    </svg>
  ),
  Tv: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  ),
  Layers: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  ),
  Users: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16 8.3a3 3 0 1 1 3.6 2.9M17.5 13.6c2.6.5 4 2.3 4 5.4" />
    </svg>
  ),
  Download: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M12 4v11m0 0-4-4m4 4 4-4M4 19h16" />
    </svg>
  ),
  Bookmark: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M6 3h12v18l-6-4-6 4V3Z" />
    </svg>
  ),
  Servers: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </svg>
  ),
  PlayStore: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 3.6c-.3.3-.5.7-.5 1.2v14.4c0 .5.2.9.5 1.2l.1.1L13 12 4.1 3.5l-.1.1Z" />
      <path d="m13 12-9 9 8.6-5 2.2-1.3L13 12ZM16.8 9.2l-2.7-1.5L13 9l1.1 1.1 2.7-1.5v.6ZM13 15l1.1-1.1 2.7 1.5-3.5 2-.3-2.4Z" />
    </svg>
  ),
  Apple: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 12.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2.1-1.1 2.8-2.3.6-1 .9-1.9 1.1-2.4-.1 0-2.3-.9-2.3-3.6ZM14.4 5.4c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 1.9-.5 2.6-1.2Z" />
    </svg>
  ),
};

function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [heroIsVisible, setHeroIsVisible] = useState(true);

  const testimonials = [
    {
      name: "Aman Verma",
      role: "Movie Lover",
      avatar: "AV",
      text: "This is the best streaming site I've ever used. Super fast, no ads, and amazing quality.",
    },
    {
      name: "Sneha Iyer",
      role: "Anime Fan",
      avatar: "SI",
      text: "Huge collection of movies and anime. I love the smooth experience on all my devices.",
    },
    {
      name: "Rohit Sharma",
      role: "Regular Viewer",
      avatar: "RS",
      text: "Finally a site that works perfectly without signing up. Highly recommended!",
    },
  ];

  const faqs = [
    {
      question: "Is mmax.stream free to use?",
      answer:
        "Yes. mmax.stream is designed to give you a simple and accessible entertainment experience without unnecessary barriers.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "You can explore the platform without creating an account. Some future personalized features may require one.",
    },
    {
      question: "Is mmax.stream available on mobile?",
      answer:
        "Yes. The interface is responsive and designed to work across smartphones, tablets, laptops and larger displays.",
    },
    {
      question: "Why is a video sometimes not playing?",
      answer:
        "Playback can depend on your connection, browser and the availability of the selected content. Refreshing the page or trying another source may help.",
    },
  ];

  useEffect(() => {
    HERO_BACKDROP_IMAGES.forEach((imageSource) => {
      const image = new Image();
      image.src = imageSource;
    });

    const revealElements = document.querySelectorAll(".landing-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 },
    );

    revealElements.forEach((element) => observer.observe(element));

    const hero = document.querySelector(".landing-hero");
    const heroObserver = new IntersectionObserver(
      ([entry]) => setHeroIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );

    if (hero) heroObserver.observe(hero);

    return () => {
      observer.disconnect();
      heroObserver.disconnect();
    };
  }, []);

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="landing-container">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className={`landing-hero ${heroIsVisible ? "hero-is-visible" : "hero-is-static"}`}>
        <div className="hero-cinema-backdrop" aria-hidden="true">
          {HERO_BACKDROP_IMAGES.map((imageSource, index) => (
            <div
              className="backdrop-slide"
              key={imageSource}
              style={{
                backgroundImage: `url("${imageSource}")`,
                animationDelay: `${index * -6}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="hero-vignette"></div>
        <div className="hero-orange-glow"></div>
        <div className="hero-grid"></div>

        <div className="hero-content">
          <h1 className="animate-fade-up">
            <img src={brandLogo} alt="MMAX.STREAM" className="landing-brand-logo" />
          </h1>

          <p className="hero-tagline animate-fade-up delay-1">
            Where your favorite stories come to life.
            <br />
            <span>
              No ads. High speed. <strong>Just great cinema.</strong>
            </span>
          </p>

          <div className="hero-actions animate-fade-up delay-2">
            <Link to="/movies" className="cta-button primary">
              <span>Visit Movie Site</span>
              <Icon.Arrow width="20" height="20" />
            </Link>

          </div>

          <div className="hero-meta animate-fade-up delay-3">
            <div className="hero-meta-item">
              <strong>4K</strong>
              <span>Quality</span>
            </div>

            <div className="hero-meta-divider"></div>

            <div className="hero-meta-item">
              <strong>HD</strong>
              <span>Streaming</span>
            </div>

            <div className="hero-meta-divider"></div>

            <div className="hero-meta-item">
              <strong>∞</strong>
              <span>Stories</span>
            </div>
          </div>
        </div>

        <div className="hero-bottom-line"></div>

        <div className="hero-scroll-indicator" aria-hidden="true">
          <span>Scroll to explore</span>
          <span className="scroll-line"></span>
        </div>
      </section>

      {/* =====================================================
          WHY CHOOSE
      ====================================================== */}

      <section
        className="landing-section experience-section landing-reveal"
        id="discover"
      >
        <div className="section-header-centered">
          <div className="section-kicker">
            THE EXPERIENCE
          </div>

          <h2>
            Why choose <em>mmax.stream?</em>
          </h2>

          <p>
            A simple way to discover something good and settle in for a great
            watch.
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <Icon.NoAds width="22" height="22" />
            </div>
            <h3>No Ads</h3>
            <p>
              Stay immersed in your story without unnecessary interruptions.
            </p>
            <span className="benefit-number">01</span>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                width="22"
                height="22"
              >
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </div>
            <h3>Blazing Fast</h3>
            <p>
              Optimized browsing and playback built around a smooth experience.
            </p>
            <span className="benefit-number">02</span>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon benefit-icon-text">
              <span>4K</span>
            </div>
            <h3>Ultra HD Quality</h3>
            <p>
              Experience your favorite worlds with crisp and immersive quality.
            </p>
            <span className="benefit-number">03</span>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <Icon.ShieldCheck width="22" height="22" />
            </div>
            <h3>Start Watching</h3>
            <p>
              Open the site and start finding something to watch right away.
            </p>
            <span className="benefit-number">04</span>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                width="22"
                height="22"
              >
                <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8" />
                <path d="M20 4v4h-4" />
                <path d="M20 12a8 8 0 0 1-13.66 5.66L4 16" />
                <path d="M4 20v-4h4" />
              </svg>
            </div>
            <h3>Regular Updates</h3>
            <p>
              Keep discovering fresh movies, shows and anime as the library
              evolves.
            </p>
            <span className="benefit-number">05</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="stats-section landing-reveal">
        <div className="stats-inner">
          <div className="stat-item">
            <Icon.Film className="stat-icon" width="26" height="26" />
            <strong>10,000+</strong>
            <span>Movies</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <Icon.Tv className="stat-icon" width="26" height="26" />
            <strong>2,500+</strong>
            <span>TV Shows</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <Icon.Layers className="stat-icon" width="26" height="26" />
            <strong>50,000+</strong>
            <span>Episodes</span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <Icon.Users className="stat-icon" width="26" height="26" />
            <strong>1M+</strong>
            <span>Happy Users</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS
      ====================================================== */}

      <section className="landing-section testimonials-section landing-reveal">
        <div className="section-header-row">
          <div>
            <div className="section-kicker">
              COMMUNITY
            </div>

            <h2>
              What our users <em>say</em>
            </h2>
          </div>

          <div className="testimonial-controls">
            <button aria-label="Previous testimonial">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button aria-label="Next testimonial">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <div className="testimonial-top">
                <div className="testimonial-user">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>

                <div className="stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon.Star key={i} width="13" height="13" />
                  ))}
                </div>
              </div>

              <p>&ldquo;{testimonial.text}&rdquo;</p>
              <span className="quote-mark">&rdquo;</span>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================
          DEVICES
      ====================================================== */}

      <section className="devices-section landing-reveal">
        <div className="devices-content">
          <div className="section-kicker">
            EVERYWHERE YOU GO
          </div>

          <h2>
            Works on your
            <br />
            <em>favorite devices.</em>
          </h2>

          <p>
            Pick up where you left off. Enjoy the same clean experience across
            your phone, tablet, laptop, TV and desktop.
          </p>

          <Link to="/movies" className="text-link">
            Start exploring
            <Icon.Arrow width="16" height="16" />
          </Link>
        </div>

        <div className="devices-showcase">
          <div className="device device-phone">
            <div className="device-screen">
              <div className="fake-screen-content">
                <span>MMAX.</span>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>

          <div className="device device-tablet">
            <div className="device-screen">
              <div className="fake-screen-content">
                <span>MMAX.</span>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>

          <div className="device device-laptop">
            <div className="device-screen">
              <div className="fake-screen-content">
                <span>MMAX.STREAM</span>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
            <div className="laptop-base"></div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURE STRIP
      ====================================================== */}

      <section className="feature-strip landing-reveal">
        <div className="feature-strip-item">
          <span className="feature-strip-icon">
            <Icon.Download width="20" height="20" />
          </span>
          <div>
            <strong>Download & Watch</strong>
            <span>Save and watch offline</span>
          </div>
        </div>

        <div className="feature-strip-item">
          <span className="feature-strip-icon">
            <Icon.Bookmark width="20" height="20" />
          </span>
          <div>
            <strong>Watchlist</strong>
            <span>Save your favorites</span>
          </div>
        </div>

        <div className="feature-strip-item">
          <span className="feature-strip-icon">
            <Icon.Play width="18" height="18" />
          </span>
          <div>
            <strong>Continue Watching</strong>
            <span>Pick up where you left off</span>
          </div>
        </div>

        <div className="feature-strip-item">
          <span className="feature-strip-icon">
            <Icon.Servers width="20" height="20" />
          </span>
          <div>
            <strong>Multiple Servers</strong>
            <span>Always have options</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          NEWSLETTER
      ====================================================== */}

      <section className="newsletter-section landing-reveal">
        <div className="newsletter-copy">
          <div className="section-kicker">
            STAY IN THE LOOP
          </div>

          <h2>
            Stay <em>Updated.</em>
          </h2>

          <p>
            Subscribe to get notified about new releases, features and what's
            happening on mmax.stream.
          </p>
        </div>

        <form className="newsletter-form" onSubmit={handleSubscribe}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit">
            {subscribed ? "Subscribed ✓" : "Subscribe"}
          </button>
        </form>
      </section>

      {/* =====================================================
          TRUST BAR
      ====================================================== */}

      <section className="trust-section landing-reveal">
        <div className="trust-item">
          <span className="trust-icon safe">
            <Icon.ShieldCheck width="18" height="18" />
          </span>
          <div>
            <strong>100% Safe</strong>
            <span>No Malware</span>
          </div>
        </div>

        <div className="trust-item">
          <span className="trust-icon">
            <Icon.NoAds width="18" height="18" />
          </span>
          <div>
            <strong>No Ads</strong>
            <span>Experience</span>
          </div>
        </div>

        <div className="trust-item">
          <span className="trust-icon safe">
            <Icon.ShieldCheck width="18" height="18" />
          </span>
          <div>
            <strong>Secure & Trusted</strong>
            <span>Built for viewers</span>
          </div>
        </div>

        <div className="trust-item">
          <span className="trust-icon loved">
            <Icon.Heart width="18" height="18" />
          </span>
          <div>
            <strong>Loved by Millions</strong>
            <span>Worldwide</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ + APP
      ====================================================== */}

      <section className="faq-app-section landing-reveal">
        <div className="faq-panel">
          <div className="section-kicker">
            NEED HELP?
          </div>

          <h2>
            Frequently Asked <em>Questions</em>
          </h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                className={`faq-item ${openFaq === index ? "open" : ""}`}
                key={faq.question}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-plus">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>

                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-panel">
          <div className="section-kicker">
            ON THE WAY
          </div>

          <h2>
            Get the <em>MMAX app.</em>
          </h2>

          <p>Take the full mmax.stream experience with you wherever you go.</p>

          <div className="app-buttons">
            <button type="button" disabled>
              <span className="store-icon">
                <Icon.PlayStore width="20" height="20" />
              </span>
              <span>
                <small>AVAILABLE SOON ON</small>
                Google Play
              </span>
            </button>

            <button type="button" disabled>
              <span className="store-icon">
                <Icon.Apple width="18" height="18" />
              </span>
              <span>
                <small>AVAILABLE SOON ON</small>
                App Store
              </span>
            </button>
          </div>

          <div className="phone-preview">
            <div className="phone-preview-screen">
              <div className="phone-logo">MMAX.</div>
              <div className="phone-posters">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="phone-bars">
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="final-cta landing-reveal">
        <div className="final-cta-glow"></div>

        <div className="section-kicker">
          YOUR NEXT STORY AWAITS
        </div>

        <h2>
          Ready to start
          <br />
          <em>watching?</em>
        </h2>

        <p>
          Step into a world of stories, characters and unforgettable moments.
        </p>

        <Link to="/movies" className="cta-button primary">
          <span>Explore the Library</span>
          <Icon.Arrow width="20" height="20" />
        </Link>
      </section>
    </div>
  );
}

export default Landing;
