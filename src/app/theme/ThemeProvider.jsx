import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/**
 * Theme preference: 'light' | 'dark' | 'system'
 * Persisted to users/{uid}.themePreference
 * System mode follows prefers-color-scheme media query
 */
export function ThemeProvider({ children, userThemePreference }) {
  const [theme, setTheme] = useState(userThemePreference || 'system');

  // Determine effective theme (resolving 'system' against prefers-color-scheme)
  const effectiveTheme = theme === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', effectiveTheme);

    // Also set on body for legacy activity pages
    document.body.setAttribute('data-surface', effectiveTheme === 'dark' ? 'dark' : 'light');
  }, [effectiveTheme]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = () => {
      // Force re-render by toggling a dummy state (theme is already 'system')
      setTheme('system');
    };

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, [theme]);

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
