import { Link, NavLink } from 'react-router-dom';

import routes from '../../data/routes';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
