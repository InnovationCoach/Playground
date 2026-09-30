import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALES, translate } from './messages.js';

const LocaleContext = createContext(null);

// Shared with the legacy src/utils/i18n.js toggle, so both halves of the app
// agree on the language without a second setting.
const STORAGE_KEY = 'appLanguage';
const SUPPORTED = LOCALES.map((l) => l.code);

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Current interface language. The device choice (localStorage) applies
 * immediately so the login screen is in the right language; once signed in,
 * the account's saved `locale` wins (see adoptAccountLocale).
 */
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private browsing */ }
  }, []);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, vars) => translate(locale, key, vars),
    formatDate: (value, opts) => formatDate(value, locale, opts)
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

const INTL_LOCALE = { en: 'en-GB', zh: 'zh-CN', th: 'th-TH' };

/**
 * Accepts ISO strings, Dates, and Firestore Timestamps in either shape: the
 * SDK object (toDate) or its JSON form ({_seconds, _nanoseconds}), which is
 * what the Admin SDK produces when a Timestamp is sent through res.json().
 */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && Number.isFinite(value._seconds ?? value.seconds)) {
    const secs = value._seconds ?? value.seconds;
    const nanos = value._nanoseconds ?? value.nanoseconds ?? 0;
    return new Date(secs * 1000 + Math.floor(nanos / 1e6));
  }
  return new Date(value);
}

function formatDate(value, locale, opts = { dateStyle: 'medium' }) {
  if (!value) return '';
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale] || 'en-GB', opts).format(date);
}
