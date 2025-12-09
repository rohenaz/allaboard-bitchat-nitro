import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyThemeModeWithAssets,
  clearTheme,
  fetchThemeByOrigin,
  type ThemeToken,
} from '@theme-token/sdk';
import { useTheme } from './theme';

const THEME_TOKEN_STORAGE_KEY = 'bitchat-theme-token';

interface ThemeTokenContextType {
  /** Currently active ThemeToken, or null for default */
  activeTheme: ThemeToken | null;
  /** Origin of active theme, or null */
  activeOrigin: string | null;
  /** Load and apply a theme by origin */
  loadTheme: (origin: string) => Promise<void>;
  /** Reset to default theme (clears ThemeToken) */
  resetTheme: () => void;
  /** Whether a theme is currently loading */
  isLoading: boolean;
  /** Error from last load attempt */
  error: Error | null;
}

const ThemeTokenContext = createContext<ThemeTokenContextType | undefined>(undefined);

export function ThemeTokenProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(THEME_TOKEN_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load persisted theme on mount
  useEffect(() => {
    const savedOrigin = localStorage.getItem(THEME_TOKEN_STORAGE_KEY);
    if (savedOrigin && !activeTheme) {
      loadThemeInternal(savedOrigin);
    }
  }, []);

  // Re-apply theme when light/dark mode changes
  useEffect(() => {
    if (activeTheme) {
      applyThemeModeWithAssets(activeTheme, resolvedTheme).catch(console.error);
    }
  }, [activeTheme, resolvedTheme]);

  const loadThemeInternal = async (origin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const published = await fetchThemeByOrigin(origin);
      if (!published) {
        throw new Error(`Theme not found: ${origin}`);
      }

      setActiveTheme(published.theme);
      setActiveOrigin(origin);
      localStorage.setItem(THEME_TOKEN_STORAGE_KEY, origin);

      // Apply immediately
      await applyThemeModeWithAssets(published.theme, resolvedTheme);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Failed to load theme:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheme = useCallback(async (origin: string) => {
    await loadThemeInternal(origin);
  }, [resolvedTheme]);

  const resetTheme = useCallback(() => {
    clearTheme();
    setActiveTheme(null);
    setActiveOrigin(null);
    localStorage.removeItem(THEME_TOKEN_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      activeTheme,
      activeOrigin,
      loadTheme,
      resetTheme,
      isLoading,
      error,
    }),
    [activeTheme, activeOrigin, loadTheme, resetTheme, isLoading, error]
  );

  return (
    <ThemeTokenContext.Provider value={value}>
      {children}
    </ThemeTokenContext.Provider>
  );
}

export function useThemeToken() {
  const context = useContext(ThemeTokenContext);
  if (context === undefined) {
    throw new Error('useThemeToken must be used within a ThemeTokenProvider');
  }
  return context;
}
