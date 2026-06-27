import { Link } from "react-router-dom";
import { FaUser, FaUsers, FaUserFriends, FaComments, FaArrowRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import Footer from "./Footer";

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [visibleStats, setVisibleStats] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleStats(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const featureRows = document.querySelectorAll('.feature-row');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    featureRows.forEach((row) => observer.observe(row));

    return () => {
      featureRows.forEach((row) => observer.unobserve(row));
    };
  }, []);

  const features = [
    {
      icon: <FaUser />,
      title: "Student Profiles",
      description: "Create and manage your professional student profile with ease.",
      align: "left",
    },
    {
      icon: <FaUsers />,
      title: "Student Directory",
      description: "Discover and connect with students across different departments.",
      align: "right",
    },
    {
      icon: <FaUserFriends />,
      title: "Connections",
      description: "Build your network by sending and accepting connection requests.",
      align: "left",
    },
    {
      icon: <FaComments />,
      title: "Real-time Messaging",
      description: "Stay connected with instant messaging and real-time updates.",
      align: "right",
    },
  ];

  const stats = [
    { value: 10000, label: "Students Connected" },
    { value: 50000, label: "Messages Sent" },
    { value: 25000, label: "Connections Created" },
  ];

  const Counter = ({ value, label }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (visibleStats) {
        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= value) {
            setCount(value);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
        return () => clearInterval(timer);
      }
    }, [visibleStats, value]);

    return (
      <div className="stat-item">
        <div className="stat-value">{count.toLocaleString()}+</div>
        <div className="stat-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="landing-page">
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-nav-container">
          <div className="landing-nav-brand">
            <span className="landing-nav-logo">Campus Hub</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">
              Login
            </Link>
            <Link to="/register" className="landing-nav-button">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Campus Hub</h1>
            <div className="hero-subtitle">
              <span>Connect.</span>
              <span>Collaborate.</span>
              <span>Grow.</span>
            </div>
            <p className="hero-description">
              Your all-in-one platform for student networking, collaboration, and communication.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="hero-button hero-button-primary">
                Get Started <FaArrowRight />
              </Link>
              <Link to="/login" className="hero-button hero-button-secondary">
                Login
              </Link>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="floating-card floating-card-1">
              <div className="floating-card-icon">
                <FaUser />
              </div>
              <div className="floating-card-content">
                <div className="floating-card-line"></div>
                <div className="floating-card-line short"></div>
              </div>
            </div>
            <div className="floating-card floating-card-2">
              <div className="floating-card-icon">
                <FaUserFriends />
              </div>
              <div className="floating-card-content">
                <div className="floating-card-line"></div>
                <div className="floating-card-line short"></div>
              </div>
            </div>
            <div className="floating-card floating-card-3">
              <div className="floating-card-icon">
                <FaComments />
              </div>
              <div className="floating-card-content">
                <div className="floating-card-line"></div>
                <div className="floating-card-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-container">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`feature-row feature-row-${feature.align}`}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="why-section" ref={statsRef}>
        <div className="why-container">
          <div className="why-left">
            <h2 className="why-title">Why Campus Hub?</h2>
          </div>
          <div className="why-right">
            <p className="why-description">
              Campus Hub brings students together in one unified platform. Whether you're looking for
              study partners, networking opportunities, or simply want to stay connected with your
              peers, Campus Hub makes it easy.
            </p>
            <div className="stats-grid">
              {stats.map((stat) => (
                <Counter key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Connect?</h2>
          <p className="cta-description">
            Join Campus Hub today and start building your academic network.
          </p>
          <Link to="/register" className="cta-button">
            Create Your Account <FaArrowRight />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
