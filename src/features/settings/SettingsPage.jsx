import { useState } from 'react';
import { Languages, LockKeyhole, UserRound, Sun, Moon, Monitor } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { LOCALES } from '../../app/i18n/messages.js';
import { changePassword, saveLocale, saveThemePreference } from '../../auth.js';
import { useTheme } from '../../app/theme/ThemeProvider.jsx';
import { Field, Alert } from '../admin/ui/bits.jsx';
import { Avatar } from '../shell/Avatar.jsx';
import '../admin/admin.css';

const MIN_PASSWORD = 8;

/**
 * Settings for every role: interface language and change password. Both are
 * real, not test data - language is saved to users/{uid}.locale and the
 * password change goes straight to Firebase Auth.
 */
export function SettingsPage({ user, profile, role, embedded }) {
  const { t } = useLocale();
  const name = profile?.displayName || user.email;
  const content = (
    <>
      <div className="gh-page-head">
        <div>
          <h1>{t('settings.title')}</h1>
          <p className="gh-sub">{t('settings.subtitle')}</p>
        </div>
      </div>
      <div className="gh-card">
        <CardHead icon={UserRound} title={t('settings.account')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <Avatar name={name} seed={user.uid} size={52} />
          <div style={{ minWidth: 0 }}>
            <div className="gh-person-name" style={{ fontSize: '1rem' }}>{name}</div>
            <div className="gh-person-sub">{user.email}</div>
            {role && <span className="gh-badge gh-badge-role" style={{ marginTop: '0.4rem' }}>{t(`role.${role}`)}</span>}
          </div>
        </div>
      </div>
      <ThemeCard uid={user.uid} />
      <LanguageCard uid={user.uid} />
      <PasswordCard />
    </>
  );
  return embedded ? <div className="gh-narrow">{content}</div> : <div className="gh-page gh-narrow">{content}</div>;
}

function CardHead({ icon: Icon, title, desc, id }) {
  return (
    <div className="gh-card-head" style={{ justifyContent: 'flex-start' }}>
      <span className="gh-action-icon" style={{ background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}><Icon size={17} aria-hidden="true" /></span>
      <div>
        <h3 id={id}>{title}</h3>
        {desc && <p className="gh-card-desc">{desc}</p>}
      </div>
    </div>
  );
}

function LanguageCard({ uid }) {
  const { t, locale, setLocale } = useLocale();
  const [notice, setNotice] = useState(null);

  async function choose(code) {
    if (code === locale) return;
    setLocale(code);
    setNotice(null);
    try {
      await saveLocale(uid, code);
      setNotice({ type: 'success', key: 'settings.languageSaved' });
    } catch (err) {
      console.warn('[Settings] Could not save locale:', err?.message);
      setNotice({ type: 'error', key: 'settings.languageSavedLocal' });
    }
  }

  return (
    <div className="gh-card">
      <CardHead icon={Languages} id="gh-lang-title" title={t('settings.language')} desc={t('settings.languageHint')} />
      <div className="gh-segmented" role="radiogroup" aria-labelledby="gh-lang-title">
        {LOCALES.map((l) => (
          <button key={l.code} type="button" role="radio" aria-checked={locale === l.code}
                  lang={l.code === 'zh' ? 'zh-Hans' : l.code} onClick={() => choose(l.code)}>
            {l.label}
          </button>
        ))}
      </div>
      {/* Keyed by message, so the text follows the language just chosen. */}
      {notice && <div style={{ marginTop: '1rem' }}><Alert type={notice.type}>{t(notice.key)}</Alert></div>}
    </div>
  );
}

function ThemeCard({ uid }) {
  const { t } = useLocale();
  const { theme, setUserTheme } = useTheme();
  const [notice, setNotice] = useState(null);

  async function choose(newTheme) {
    if (newTheme === theme) return;
    setUserTheme(newTheme);
    setNotice(null);
    try {
      await saveThemePreference(uid, newTheme);
      setNotice({ type: 'success', key: 'settings.themeSaved' });
    } catch (err) {
      console.warn('[Settings] Could not save theme:', err?.message);
      setNotice({ type: 'error', key: 'settings.themeSavedLocal' });
    }
  }

  return (
    <div className="gh-card">
      <CardHead icon={Monitor} id="gh-theme-title" title={t('settings.theme')} desc={t('settings.themeHint')} />
      <div className="gh-segmented" role="radiogroup" aria-labelledby="gh-theme-title">
        <button key="light" type="button" role="radio" aria-checked={theme === 'light'}
                onClick={() => choose('light')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Sun size={16} /> {t('settings.themeLight')}
        </button>
        <button key="dark" type="button" role="radio" aria-checked={theme === 'dark'}
                onClick={() => choose('dark')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Moon size={16} /> {t('settings.themeDark')}
        </button>
        <button key="system" type="button" role="radio" aria-checked={theme === 'system'}
                onClick={() => choose('system')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Monitor size={16} /> {t('settings.themeSystem')}
        </button>
      </div>
      {notice && <div style={{ marginTop: '1rem' }}><Alert type={notice.type}>{t(notice.key)}</Alert></div>}
    </div>
  );
}

function PasswordCard() {
  const { t } = useLocale();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  async function onSubmit(e) {
    e.preventDefault();
    setResult(null);
    const er = {};
    if (!form.current) er.current = t('common.required');
    if (form.next.length < MIN_PASSWORD) er.next = t('settings.passwordTooShort');
    else if (form.next === form.current) er.next = t('settings.passwordSame');
    if (form.confirm !== form.next) er.confirm = t('settings.passwordMismatch');
    setErrors(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    const res = await changePassword(form.current, form.next);
    setBusy(false);
    if (res.ok) {
      setForm({ current: '', next: '', confirm: '' });
      setResult({ type: 'success', key: 'settings.passwordChanged' });
    } else if (res.reason === 'wrong-password') {
      setErrors({ current: t('settings.wrongPassword') });
    } else if (res.reason === 'weak-password') {
      setErrors({ next: t('settings.weakPassword') });
    } else {
      setResult({ type: 'error', key: res.reason === 'too-many-requests' ? 'settings.tooManyAttempts' : 'common.error' });
    }
  }

  const pw = (k, autoComplete) => (a) => (
    <input className="gh-input" type="password" value={form[k]} onChange={set(k)} autoComplete={autoComplete} {...a} />
  );

  return (
    <form className="gh-card" onSubmit={onSubmit} noValidate aria-labelledby="gh-pw-title">
      <CardHead icon={LockKeyhole} id="gh-pw-title" title={t('settings.password')} desc={t('settings.passwordDesc')} />
      {result && <Alert type={result.type}>{t(result.key)}</Alert>}
      <div style={{ display: 'grid', gap: '1rem', maxWidth: 400 }}>
        <Field id="pw-current" label={t('settings.currentPassword')} error={errors.current}>{pw('current', 'current-password')}</Field>
        <Field id="pw-next" label={t('settings.newPassword')} hint={t('settings.passwordRules')} error={errors.next}>{pw('next', 'new-password')}</Field>
        <Field id="pw-confirm" label={t('settings.confirmPassword')} error={errors.confirm}>{pw('confirm', 'new-password')}</Field>
      </div>
      <div className="gh-form-foot" style={{ justifyContent: 'flex-start' }}>
        <button type="submit" className="gh-btn gh-btn-accent" disabled={busy}>
          {busy ? t('common.saving') : t('settings.changePassword')}
        </button>
      </div>
    </form>
  );
}
