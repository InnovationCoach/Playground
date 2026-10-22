import { useLocale } from '../../app/i18n/LocaleProvider.jsx';

/** "yesterday", "3 hours ago", in the interface language. Returns '' for a missing time. */
export function useRelativeTime() {
  const { locale } = useLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return (ms) => {
    if (!Number.isFinite(ms)) return '';
    const mins = Math.round((ms - Date.now()) / 60000);
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 14) return rtf.format(days, 'day');
    return rtf.format(Math.round(days / 7), 'week');
  };
}
