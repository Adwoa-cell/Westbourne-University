
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { nav, site } from '../config/site.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const { pathname } = useLocation();
  const { configured, session } = useAuth();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label={`${site.name} home`}>
          <Logo />
          <span className="brand-name">
            Westbourne<span>University</span>
          </span>
        </Link>

        <button
          ref={menuButton}
          type="button"
          className="menu-toggle"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
          <span>{open ? 'Close' : 'Menu'}</span>
        </button>

        <nav
          id="primary-nav"
          className={`primary-nav${open ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}

          {configured && session ? (
            <NavLink to="/account">My Account</NavLink>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
