import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/**
 * Theme preference: 'light' | 'dark' | 'system'. Light is the default: the
 * legacy surfaces were dark-only and too dark for daily use; dark stays available.
 * Persisted to users/{uid}.themePreference
 * System mode follows prefers-color-scheme media query
 */
export function ThemeProvider({ children, userThemePreference }) {
  const [theme, setTheme] = useState(userThemePreference || 'light');
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  // The saved preference arrives after sign-in, once the profile has loaded;
  // follow it instead of keeping the value from first render.
  useEffect(() => {
    if (userThemePreference) setTheme(userThemePreference);
  }, [userThemePreference]);

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
