import { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';

import routes from '../../data/routes';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const openSearch = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, [navigate]);

  return (
    <header className="site-header">
      <div className="site-header__inner page-shell">
        <Link className="wordmark" to="/" aria-label="Dhruv Doshi, home">
          <span className="wordmark__name">Dhruv Doshi</span>
        </Link>

        <nav className="site-navigation" id="site-navigation" aria-label="Primary navigation">
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {route.label}
            </NavLink>
          ))}
          <button className="site-search-link" type="button" onClick={() => navigate('/search')} aria-label="Search the site" aria-keyshortcuts="/">
            Search <kbd aria-hidden="true">/</kbd>
          </button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
