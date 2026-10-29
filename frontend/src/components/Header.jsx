
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { nav, site } from '../config/site.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { configured, session } = useAuth();

  useEffect(() => setOpen(false), [pathname]);

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
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close menu' : 'Menu'}
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
