/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import type { FC } from 'react';
import { useTheme, themes } from '../../context/theme/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
}

export const ThemeSwitcher: FC<ThemeSwitcherProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const formatThemeName = (themeName: string) => {
    if (themeName.length <= 8) {
      return themeName.charAt(0).toUpperCase() + themeName.slice(1);
    }
    return themeName.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className={className}>
      <div className="dropdown dropdown-end">
        <button 
          className="btn btn-ghost btn-sm gap-1 normal-case"
        >
          <span className="hidden md:inline opacity-50">Theme:</span>
          <span>{formatThemeName(theme)}</span>
          <svg width="12px" height="12px" className="h-2 w-2 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
          </svg>
        </button>
        <ul className="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52">
          <li className="menu-title">
            <span className="text-xs font-semibold opacity-60">Custom Themes</span>
          </li>
          {themes.slice(0, 5).map((themeName) => (
            <li key={themeName}>
              <button
                type="button"
                className={theme === themeName ? 'active' : ''}
                onClick={() => setTheme(themeName)}
              >
                {formatThemeName(themeName)}
              </button>
            </li>
          ))}
          <li className="divider" />
          <li className="menu-title">
            <span className="text-xs font-semibold opacity-60">Stock Themes</span>
          </li>
          {themes.slice(5).map((themeName) => (
            <li key={themeName}>
              <button
                type="button"
                className={theme === themeName ? 'active' : ''}
                onClick={() => setTheme(themeName)}
              >
                {formatThemeName(themeName)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ThemeSwitcher; 