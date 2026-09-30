import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';

export function StatusBadge({ status }) {
  const { t } = useLocale();
  const cls = { active: 'gh-badge-active', pending: 'gh-badge-pending', suspended: 'gh-badge-suspended' }[status] || '';
  return <span className={`gh-badge ${cls}`}>{t(`status.${status}`)}</span>;
}

export function RoleBadge({ role }) {
  const { t } = useLocale();
  return <span className="gh-badge gh-badge-role">{t(`role.${role}`)}</span>;
}

/** Label + control + hint + server-side field error, wired for screen readers. */
export function Field({ id, label, hint, error, optional, children, span }) {
  const { t } = useLocale();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={span ? 'gh-span' : undefined}>
      <label className="gh-label" htmlFor={id}>
        {label}{optional && <span className="gh-opt"> ({t('common.optional')})</span>}
      </label>
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {hint && !error && <p className="gh-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="gh-field-error" id={`${id}-err`} role="alert"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
    </div>
  );
}

const ALERT_ICON = { error: CircleAlert, success: CircleCheck, info: Info };

export function Alert({ type = 'info', children }) {
  if (!children) return null;
  const Icon = ALERT_ICON[type] || Info;
  return (
    <div className={`gh-alert gh-alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={17} aria-hidden="true" /><div>{children}</div>
    </div>
  );
}
