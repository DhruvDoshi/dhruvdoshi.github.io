import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import routes from '../../data/routes';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Link className="wordmark" to="/" aria-label="Dhruv Doshi, home" onClick={closeMenu}>
          <span className="wordmark__mark" aria-hidden="true">DD</span>
          <span className="wordmark__name">Dhruv Doshi</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          <span>{open ? 'Close' : 'Menu'}</span>
          <span className="menu-toggle__icon" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>

        <nav
          className={`site-navigation${open ? ' site-navigation--open' : ''}`}
          id="site-navigation"
          aria-label="Primary navigation"
        >
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              onClick={closeMenu}
            >
              {route.label}
            </NavLink>
          ))}
          <div className="site-navigation__actions">
            <ThemeToggle />
            <Link className="nav-contact" to="/contact" onClick={closeMenu}>Contact</Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
