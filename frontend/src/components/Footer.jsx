import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">Campus Hub</span>
            <p className="footer-tagline">Connect. Collaborate. Grow.</p>
          </div>
          
          <div className="footer-credit">
            <p className="footer-copyright">© 2026 Campus Hub</p>
            <p className="footer-developer">
              Designed & Developed by <strong>Nepthalem Ayele</strong>
            </p>
          </div>

          <div className="footer-social">
            <a
              href="https://github.com/nepthalema-cloud"
              className="footer-social-link"
              aria-label="GitHub Profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub />
            </a>
            <a
              href="#"
              className="footer-social-link"
              aria-label="LinkedIn Profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin />
            </a>
            <a
              href="mailto:nepthalema@gmail.com"
              className="footer-social-link"
              aria-label="Send Email"
            >
              <FaEnvelope />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
