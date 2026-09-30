import { useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { sendPasswordReset } from '../../auth.js';
import { Field } from '../admin/ui/bits.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Forgot your password?" Sends Firebase's reset email. The confirmation is
 * the same whether or not the address has an account (see sendPasswordReset),
 * so this screen cannot be used to discover who is enrolled.
 */
export function PasswordResetPanel({ initialEmail = '', onBack }) {
  const { t } = useLocale();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState({ busy: false, sentTo: null, error: null });

  async function onSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) { setState({ busy: false, sentTo: null, error: t('form.invalidEmail') }); return; }
    setState({ busy: true, sentTo: null, error: null });
    const res = await sendPasswordReset(value);
    if (res.ok) setState({ busy: false, sentTo: value, error: null });
    else setState({
      busy: false, sentTo: null,
      error: res.reason === 'invalid-email' ? t('form.invalidEmail')
        : res.reason === 'too-many-requests' ? t('settings.tooManyAttempts') : t('common.error')
    });
  }

  return (
    <div>
      <button type="button" className="gh-crumb" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />{t('reset.backToSignIn')}</button>
      {state.sentTo ? (
        <div role="status">
          <span className="gh-empty-icon" style={{ background: 'var(--gh-green-50)', color: 'var(--gh-green-text)', width: 52, height: 52 }}><MailCheck size={24} aria-hidden="true" /></span>
          <h1>{t('reset.checkInbox')}</h1>
          <p className="gh-sub">{t('reset.sent', { email: state.sentTo })}</p>
        </div>
      ) : (
        <>
          <h1>{t('reset.title')}</h1>
          <p className="gh-sub">{t('reset.body')}</p>
          <form onSubmit={onSubmit} noValidate className="gh-auth-form">
            <Field id="reset-email" label={t('form.email')} error={state.error}>
              {(a) => <input className="gh-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu" {...a} />}
            </Field>
            <button className="gh-btn gh-btn-primary gh-btn-block" type="submit" disabled={state.busy}>
              {state.busy ? t('common.loading') : t('reset.send')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
