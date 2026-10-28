import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { nav, site } from '../config/site.js';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-light">
            <Logo />
            <span className="brand-name">Westbourne<span>University</span></span>
          </div>
          <p className="footer-note">{site.disclaimer}</p>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            {nav.map((item) => (
              <li key={item.to}><Link to={item.to}>{item.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Contact</h2>
          <address>
            {site.address.map((line) => (<span key={line}>{line}<br /></span>))}
            <a href={`mailto:${site.email}`}>{site.email}</a><br />
            <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
          </address>
        </div>
        <div>
          <h2>Follow</h2>
          <ul>
            {site.social.map((s) => (
              <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container footer-base">
        <p>&copy; {new Date().getFullYear()} Westbourne University (demonstration site)</p>
      </div>
    </footer>
  );
}
