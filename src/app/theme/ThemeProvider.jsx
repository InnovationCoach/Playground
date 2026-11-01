import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/**
 * Theme preference: 'light' | 'dark' | 'system'
 * Persisted to users/{uid}.themePreference
 * System mode follows prefers-color-scheme media query
 */
export function ThemeProvider({ children, userThemePreference }) {
  const [theme, setTheme] = useState(userThemePreference || 'system');
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  // Determine effective theme (resolving 'system' against prefers-color-scheme)
  const effectiveTheme = theme === 'system'
    ? (systemDark ? 'dark' : 'light')
    : theme;

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', effectiveTheme);

    // Also set on body for legacy activity pages
    document.body.setAttribute('data-surface', effectiveTheme === 'dark' ? 'dark' : 'light');
  }, [effectiveTheme]);

  // Track OS colour-scheme changes so 'system' mode re-renders when the OS flips
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = (event) => setSystemDark(event.matches);

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const setUserTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
