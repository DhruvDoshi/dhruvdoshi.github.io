import { useEffect, useState } from 'react';

const getTheme = () => document.documentElement.dataset.theme || 'light';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Use ${nextTheme} mode`}
      title={`Use ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
    >
      <span className="theme-toggle__label">{nextTheme} mode</span>
    </button>
  );
};

export default ThemeToggle;
