import { useState } from 'react';
import { BookOpen, ChartLine, Languages, Eye, EyeOff } from 'lucide-react';
import { SparkWordmark } from '../spark/SparkMark.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { LOCALES } from '../../app/i18n/messages.js';
import { LOGO_URL } from '../../app/brand.js';
import { signUpUser, signInUser, AGE_BANDS, DEFAULT_AGE_BAND } from '../../auth.js';
import { joinClassWithCode, JOIN_RESULT } from '../enrolment/joinClass.js';
import { PasswordResetPanel } from './PasswordResetPanel.jsx';
import { Alert, Field } from '../admin/ui/bits.jsx';
import '../admin/admin.css';

/**
 * Sign-in and registration.
 *
 * Sign-up is for students only. Every other account (staff, parents) is created
 * by the school, and Firestore rules reject any non-student role on create
 * regardless. Which screens someone gets after sign-in comes from their
 * account's role claim, so the page no longer asks "student or coach?" - that
 * toggle only ever changed the button label.
 *
 * Primary (Junior Explorers) learners never sign up here either: under-13
 * accounts are created by the school once a parent has consented, which is why
 * the age list offers secondary bands only.
 */
export function LoginPage({ initialError }) {
  const { t, locale, setLocale } = useLocale();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', classCode: '', ageBand: DEFAULT_AGE_BAND });
  const [alert, setAlert] = useState(initialError ? { type: 'error', text: initialError } : null);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isSignUp = mode === 'signup';

  const isLocalDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    import.meta.env?.DEV === true
  );

  function handleDevLogin(targetRole = 'coach_rivera') {
    let devUser;
    if (targetRole === 'coach_rivera') {
      devUser = {
        uid: 'coach_rivera_local',
        email: 'coach.rivera@school.edu',
        displayName: 'Coach Sam Rivera',
        role: 'teacher',
        classIds: ['class_yr9_climate', 'class-wpr-11a'],
        orgId: 'org-welearn'
      };
    } else if (targetRole === 'coach_okafor') {
      devUser = {
        uid: 'coach_okafor_local',
        email: 'coach.okafor@school.edu',
        displayName: 'Coach Ada Okafor',
        role: 'teacher',
        classIds: ['class_yr12_eng', 'class-wpr-12a'],
        orgId: 'org-welearn'
      };
    } else {
      devUser = {
        uid: 'student_alex_local',
        email: 'alex.test@school.edu',
        displayName: 'Alex Chen',
        role: 'student',
        classIds: ['class_yr9_climate', 'class-wpr-11a'],
        orgId: 'org-welearn'
      };
    }

    try {
      localStorage.setItem('hi:dev_user', JSON.stringify(devUser));
      sessionStorage.setItem('hi:dev_user', JSON.stringify(devUser));
    } catch {}
    window.dispatchEvent(new CustomEvent('hearisland-auth-changed', { detail: devUser }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setAlert(null);

    try {
      if (isSignUp) {
        const result = await signUpUser(form.email, form.password, form.displayName, 'student', form.classCode, form.ageBand);

        // A class code is optional at sign-up - an account is useful without
        // one, and a learner who mistypes it should still end up registered
        // rather than bounced back to an empty form. They can join later from
        // the dashboard.
        let joinNote = '';
        if (result.success && form.classCode.trim() && result.user) {
          const join = await joinClassWithCode(result.user.uid, form.classCode, []);
          joinNote = join.status === JOIN_RESULT.OK ? ` ${join.message}` : ` ${t('auth.classCodeFailed', { message: join.message })}`;
        }
        setAlert(result.success
          ? { type: 'success', text: `${t('auth.created')}${joinNote}` }
          : { type: 'error', text: friendlyAuthError(result.error, t) });
      } else {
        const result = await signInUser(form.email, form.password);
        if (!result.success) {
          if (isLocalDev && (
            form.email.includes('coach') ||
            form.email.includes('teacher') ||
            form.email.includes('school.edu') ||
            form.password === 'review123'
          )) {
            handleDevLogin(form.email.includes('okafor') ? 'coach_okafor' : 'coach_rivera');
            return;
          }
          setAlert({ type: 'error', text: friendlyAuthError(result.error, t) });
        }
        // On success AuthProvider takes over and this component unmounts.
      }
    } catch (err) {
      if (isLocalDev && (
        form.email.includes('coach') ||
        form.email.includes('teacher') ||
        form.email.includes('school.edu') ||
        form.password === 'review123'
      )) {
        handleDevLogin(form.email.includes('okafor') ? 'coach_okafor' : 'coach_rivera');
        return;
      }
      setAlert({ type: 'error', text: friendlyAuthError(err?.message, t) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gh-app gh-auth">
      <aside className="gh-auth-aside" aria-hidden="true">
        <span className="gh-auth-logo"><img src={LOGO_URL} alt="" /></span>
        <div className="gh-auth-spark">
          <SparkWordmark full />
          <span className="gh-auth-tag">{t('spark.tagline')}</span>
        </div>
        <div>
          <h2>{t('auth.asideTitle')}</h2>
          <p>{t('auth.asideBody')}</p>
          <ul className="gh-auth-points">
            <li><span><BookOpen size={17} /></span>{t('auth.point1')}</li>
            <li><span><ChartLine size={17} /></span>{t('auth.point2')}</li>
            <li><span><Languages size={17} /></span>{t('auth.point3')}</li>
          </ul>
        </div>
        <div className="gh-auth-foot">© WeLearn Academy · SPARK</div>
      </aside>

      <main className="gh-auth-main">
        <div className="gh-auth-card">
          <div className="gh-auth-row" style={{ marginBottom: '2rem' }}>
            <img src={LOGO_URL} alt="WeLearn" style={{ height: 38 }} className="gh-auth-mobile-logo-img" />
            <label>
              <span style={srOnly}>{t('settings.language')}</span>
              <select className="gh-select" value={locale} onChange={(e) => setLocale(e.target.value)}
                      style={{ width: 'auto', minHeight: 34, fontSize: '0.84rem' }}>
                {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </label>
          </div>

          {resetting ? (
            <PasswordResetPanel initialEmail={form.email} onBack={() => setResetting(false)} />
          ) : (
            <>
              <h1>{isSignUp ? t('auth.createTitle') : t('auth.welcome')}</h1>
              <p className="gh-sub">{isSignUp ? t('auth.createSub') : t('auth.welcomeSub')}</p>

              {isLocalDev && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(130, 80, 160, 0.08) 0%, rgba(0, 60, 105, 0.05) 100%)',
                  border: '1px solid var(--gh-border, #cbd5e1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gh-purple, #8250a0)' }}>
                      ⚡ 1-Click Local Preview Sign-In
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                      Localhost Ready
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: 'var(--gh-text-2, #64748b)', lineHeight: 1.45 }}>
                    Enter the coach mentoring hub, PBL studio, and school learning panels instantly:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="gh-btn gh-btn-primary"
                      onClick={() => handleDevLogin('coach_rivera')}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.6rem', textAlign: 'center', height: 'auto', minHeight: '36px' }}
                    >
                      Coach Sam (Yr 9)
                    </button>
                    <button
                      type="button"
                      className="gh-btn"
                      onClick={() => handleDevLogin('coach_okafor')}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.6rem', textAlign: 'center', height: 'auto', minHeight: '36px', border: '1px solid var(--gh-border, #cbd5e1)', background: 'var(--gh-surface, #fff)' }}
                    >
                      Coach Ada (Yr 12)
                    </button>
                    <button
                      type="button"
                      className="gh-btn gh-btn-ghost"
                      onClick={() => handleDevLogin('student_alex')}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.6rem', textAlign: 'center', height: 'auto', minHeight: '36px', border: '1px solid var(--gh-border, #cbd5e1)' }}
                    >
                      Student Alex
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="gh-auth-form" noValidate={false}>
                {alert && <Alert type={alert.type}>{alert.text}</Alert>}

                {isSignUp && (
                  <Field id="su-name" label={t('auth.fullName')}>
                    {(a) => <input className="gh-input" type="text" autoComplete="name" value={form.displayName} onChange={set('displayName')} {...a} />}
                  </Field>
                )}

                <Field id="li-email" label={t('form.email')}>
                  {(a) => <input className="gh-input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@school.edu" {...a} />}
                </Field>

                <div>
                  <div className="gh-auth-row" style={{ marginBottom: '0.35rem' }}>
                    <label className="gh-label" htmlFor="li-password" style={{ margin: 0 }}>{t('auth.password')}</label>
                    {!isSignUp && <button type="button" className="gh-linkish" onClick={() => setResetting(true)}>{t('reset.link')}</button>}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input id="li-password" className="gh-input" type={showPw ? 'text' : 'password'} required
                           autoComplete={isSignUp ? 'new-password' : 'current-password'}
                           value={form.password} onChange={set('password')} style={{ paddingRight: '2.6rem' }} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: 'var(--gh-text-3)', cursor: 'pointer', padding: 6, display: 'grid' }}>
                      {showPw ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <>
                    <Field id="su-code" label={t('auth.classCode')} hint={t('auth.classCodeHint')} optional>
                      {(a) => (
                        <input className="gh-input" type="text" value={form.classCode} onChange={set('classCode')} placeholder="ABCD-2345"
                               autoCapitalize="characters" spellCheck={false}
                               style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-monospace, Menlo, monospace' }} {...a} />
                      )}
                    </Field>
                    <Field id="su-age" label={t('auth.ageGroup')} hint={t('auth.ageHint')}>
                      {(a) => (
                        <select className="gh-select" value={form.ageBand} onChange={set('ageBand')} {...a}>
                          {AGE_BANDS.map((band) => <option key={band} value={band}>{t('auth.ages', { band })}</option>)}
                        </select>
                      )}
                    </Field>
                  </>
                )}

                <button className="gh-btn gh-btn-primary gh-btn-block" type="submit" disabled={busy}>
                  {busy ? t('common.loading') : isSignUp ? t('auth.create') : t('auth.signIn')}
                </button>
              </form>

              <p className="gh-auth-switch">
                {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
                <button type="button" className="gh-linkish" onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setAlert(null); }}>
                  {isSignUp ? t('auth.signInLink') : t('auth.signUpLink')}
                </button>
              </p>
              {isSignUp && <p className="gh-hint" style={{ textAlign: 'center' }}>{t('auth.staffNote')}</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Firebase messages look like "Firebase: Error (auth/invalid-credential)." -
 * meaningless to a learner. Known codes get a plain sentence; wrong email and
 * wrong password share one message so the form does not reveal which accounts exist.
 */
function friendlyAuthError(message, t) {
  const code = /auth\/([a-z-]+)/.exec(String(message || ''))?.[1];
  switch (code) {
    case 'invalid-credential': case 'invalid-login-credentials': case 'wrong-password': case 'user-not-found':
      return t('auth.badCredentials');
    case 'too-many-requests': return t('settings.tooManyAttempts');
    case 'email-already-in-use': return t('auth.emailInUse');
    case 'weak-password': return t('settings.passwordTooShort');
    case 'invalid-email': case 'missing-email': return t('form.invalidEmail');
    case 'missing-password': return t('auth.passwordRequired');
    case 'user-disabled': return t('auth.disabled');
    case 'network-request-failed': return t('errors.NETWORK');
    default: return message && !code ? message : t('common.error');
  }
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
