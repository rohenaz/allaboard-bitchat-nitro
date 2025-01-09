import { type FC, type ReactNode, createContext, useContext, useEffect, useState } from 'react';

const themes = [
  'gothicViolet',
  'midnightCrimson',
  'obsidianTeal',
  'sableGold',
  'forestEmerald',
  'dark',
  'dracula',
  'cyberpunk',
  'night',
  'synthwave',
  'forest',
  'luxury',
  'black',
] as const;

type Theme = typeof themes[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'gothicViolet';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { themes }; 