import { useMemo, useState } from 'react';
import { KeyRound, Eye, EyeOff, Copy } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { createUser, updateUser } from '../../../services/api/endpoints.js';
import { describeApiError } from '../../../services/api/apiClient.js';
import { Field, Alert } from '../ui/bits.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ACCOUNT_KINDS } from './accountKinds.js';
import { useReferenceData, localName } from './useReferenceData.js';

const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ['female', 'male', 'nonbinary', 'prefer_not_to_say'];
const SALUTATIONS = ['', 'Mr', 'Ms', 'Mrs', 'Mx', 'Dr'];
// The API's field names, mapped to this form's inputs, so a server VALIDATION
// error lands under the right box.
const SERVER_FIELD = { schoolIds: 'schoolId', classIds: 'classId' };

/**
 * Create an account (`kind` given, no `user`) or edit an existing one's
 * profile (`user` given). Role, email and tenancy are not edited here - they
 * have their own audited endpoints, reached from the detail page.
 */
export function AccountForm({ kind, user, onDone, onCancel }) {
  const { t, locale } = useLocale();
  const ref = useReferenceData();
  const editing = !!user;
  const role0 = user?.role || ACCOUNT_KINDS[kind].createRoles[0];

  const [form, setForm] = useState(() => ({
    role: role0,
    salutation: user?.salutation || '',
    givenNames: user?.givenNames || '',
    surname: user?.surname || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    schoolId: user?.schoolIds?.[0] || '',
    classId: '',
    cohortId: user?.cohortId || '',
    ageBand: user?.ageBand || '',
    yearLevel: user?.yearLevel || '',
    programmeIds: user?.programmeIds || [],
    dateOfBirth: user?.dateOfBirth || ''
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isStudent = form.role === 'student';
  const cohort = ref.cohorts.find((c) => c.cohortId === form.cohortId);
  const ageBands = cohort?.ageBands || [];
  const classOptions = useMemo(() => ref.classes.filter((c) => (!form.schoolId || c.schoolId === form.schoolId)
    && (!isStudent || !form.cohortId || c.cohortId === form.cohortId)), [ref.classes, form.schoolId, form.cohortId, isStudent]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // A cohort's age bands differ (WPR is primary only), so a stale band is cleared.
      if (key === 'cohortId') {
        const bands = ref.cohorts.find((c) => c.cohortId === value)?.ageBands || [];
        if (!bands.includes(f.ageBand)) next.ageBand = bands.length === 1 ? bands[0] : '';
        next.classId = '';
      }
      if (key === 'schoolId') next.classId = '';
      return next;
    });
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 8; i += 1) p += chars.charAt(Math.floor(Math.random() * chars.length));
    const pass = `${p}!1`;
    setForm((f) => ({ ...f, password: pass }));
    setErrors((er) => ({ ...er, password: undefined }));
  };

  function validate() {
    const er = {};
    if (!form.givenNames.trim()) er.givenNames = t('common.required');
    if (!form.surname.trim()) er.surname = t('common.required');
    if (!editing && !EMAIL.test(form.email.trim())) er.email = t('form.invalidEmail');
    if (!editing && form.password.trim() && form.password.trim().length < 6) er.password = 'Password must be at least 6 characters.';
    if (form.phone.trim() && !E164.test(form.phone.trim())) er.phone = t('form.invalidPhone');
    if (!editing && !form.schoolId) er.schoolId = t('common.required');
    if (isStudent && !form.cohortId) er.cohortId = t('common.required');
    if (isStudent && !form.ageBand) er.ageBand = t('common.required');
    setErrors(er);
    return !Object.keys(er).length;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setBusy(true);
    const profile = {
      salutation: form.salutation || null,
      givenNames: form.givenNames.trim(),
      surname: form.surname.trim(),
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      ...(isStudent ? {
        cohortId: form.cohortId, ageBand: form.ageBand, yearLevel: form.yearLevel.trim() || null,
        programmeIds: form.programmeIds, dateOfBirth: form.dateOfBirth || null
      } : {})
    };
    try {
      const rawPassword = form.password.trim();
      const result = editing
        ? await updateUser(user.uid, profile)
        : await createUser({
          ...profile,
          role: form.role,
          email: form.email.trim().toLowerCase(),
          schoolIds: [form.schoolId],
          classIds: form.classId ? [form.classId] : [],
          password: rawPassword || undefined,
          sendActivation: !rawPassword
        });
      if (!editing && rawPassword) {
        setCreatedCredentials({
          user: result,
          password: rawPassword,
          email: form.email.trim().toLowerCase(),
          displayName: `${form.givenNames.trim()} ${form.surname.trim()}`,
          role: form.role
        });
      } else {
        onDone(result);
      }
    } catch (err) {
      if (err.code === 'VALIDATION' || err.code === 'CONFLICT') {
        const field = SERVER_FIELD[err.field] || err.field;
        if (field && field in form) { setErrors((er) => ({ ...er, [field]: describeApiError(err, t) })); return; }
      }
      setFormError(describeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  const input = (key, props = {}) => (a11y) => (
    <input className="gh-input" value={form[key]} onChange={set(key)} {...a11y} {...props} />
  );

  const programmesField = isStudent && ref.programmes.length > 0 && (
    <fieldset className="gh-span" style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend className="gh-label">{t('form.programmes')} <span className="gh-opt">({t('common.optional')})</span></legend>
      {ref.programmes.map((p) => (
        <label key={p.programmeId} className="gh-check">
          <input
            type="checkbox"
            checked={form.programmeIds.includes(p.programmeId)}
            onChange={(e) => setForm((f) => ({
              ...f,
              programmeIds: e.target.checked ? [...f.programmeIds, p.programmeId] : f.programmeIds.filter((x) => x !== p.programmeId)
            }))}
          />
          {localName(p.name, locale)}
        </label>
      ))}
    </fieldset>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="gh-card" aria-labelledby="gh-form-title">
      <div className="gh-card-head">
        <div>
          <h3 id="gh-form-title">{editing ? t('form.title.edit') : t(ACCOUNT_KINDS[kind].createKey)}</h3>
          {!editing && <p className="gh-card-desc">{t('form.activationNote')}</p>}
        </div>
      </div>
      <Alert type="error">{formError}</Alert>
      {ref.error && <Alert type="error">{describeApiError(ref.error, t)}</Alert>}

      <section className="gh-form-section" aria-labelledby="fs-person">
        <h4 id="fs-person">{t('form.section.person')}</h4>
        <p className="gh-section-desc">{t('form.section.personDesc')}</p>
        <div className="gh-form-grid">
          {!editing && ACCOUNT_KINDS[kind].createRoles.length > 1 && (
            <Field id="f-role" label={t('form.role')} error={errors.role}>
              {(a) => (
                <select className="gh-select" value={form.role} onChange={set('role')} {...a}>
                  {ACCOUNT_KINDS[kind].createRoles.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
                </select>
              )}
            </Field>
          )}
          {!isStudent && (
            <Field id="f-salutation" label={t('form.salutation')} optional>
              {(a) => (
                <select className="gh-select" value={form.salutation} onChange={set('salutation')} {...a}>
                  {SALUTATIONS.map((s) => <option key={s} value={s}>{s || '—'}</option>)}
                </select>
              )}
            </Field>
          )}
          <Field id="f-given" label={t('form.givenNames')} error={errors.givenNames}>{input('givenNames', { autoComplete: 'off', maxLength: 80 })}</Field>
          <Field id="f-surname" label={t('form.surname')} error={errors.surname}>{input('surname', { autoComplete: 'off', maxLength: 80 })}</Field>
          {!editing && (
            <Field id="f-email" label={t('form.email')} error={errors.email} span>{input('email', { type: 'email', autoComplete: 'off', placeholder: 'name@school.edu' })}</Field>
          )}
          {!editing && (
            <Field id="f-password" label={t('form.password')} hint={t('form.passwordHint')} error={errors.password} optional span>
              {(a) => (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      id="f-password"
                      className="gh-input"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min 6 characters, or click generate"
                      autoComplete="new-password"
                      {...a}
                    />
                    <button
                      type="button"
                      className="gh-btn gh-btn-sm gh-btn-ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '0.35rem', top: '50%', transform: 'translateY(-50%)', padding: '0.2rem 0.4rem', height: 'auto' }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="gh-btn gh-btn-sm gh-btn-outline"
                    onClick={generatePassword}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <KeyRound size={14} aria-hidden="true" style={{ marginRight: '0.3rem' }} />
                    {t('form.generatePassword')}
                  </button>
                </div>
              )}
            </Field>
          )}
          <Field id="f-phone" label={t('form.phone')} hint={t('form.phoneHint')} error={errors.phone} optional>{input('phone', { type: 'tel', inputMode: 'tel', placeholder: '+66812345678' })}</Field>
          <Field id="f-gender" label={t('form.gender')} optional>
            {(a) => (
              <select className="gh-select" value={form.gender} onChange={set('gender')} {...a}>
                <option value="">—</option>
                {GENDERS.map((g) => <option key={g} value={g}>{t(`form.gender.${g}`)}</option>)}
              </select>
            )}
          </Field>
          {isStudent && <Field id="f-dob" label={t('form.dateOfBirth')} optional>{input('dateOfBirth', { type: 'date' })}</Field>}
        </div>
      </section>

      {(!editing || isStudent) && (
        <section className="gh-form-section" aria-labelledby="fs-school">
          <h4 id="fs-school">{isStudent ? t('form.section.learning') : t('form.section.school')}</h4>
          <p className="gh-section-desc">{isStudent ? t('form.section.learningDesc') : t('form.section.schoolDesc')}</p>
          <div className="gh-form-grid">
            {!editing && (
              <Field id="f-school" label={t('form.school')} error={errors.schoolId}>
                {(a) => (
                  <select className="gh-select" value={form.schoolId} onChange={set('schoolId')} {...a}>
                    <option value="">{t('form.choose')}</option>
                    {ref.schools.map((s) => <option key={s.schoolId} value={s.schoolId}>{s.name}</option>)}
                  </select>
                )}
              </Field>
            )}
            {isStudent && (
              <>
                <Field id="f-cohort" label={t('form.cohort')} error={errors.cohortId}>
                  {(a) => (
                    <select className="gh-select" value={form.cohortId} onChange={set('cohortId')} {...a}>
                      <option value="">{t('form.choose')}</option>
                      {ref.cohorts.map((c) => <option key={c.cohortId} value={c.cohortId}>{localName(c.name, locale)}</option>)}
                    </select>
                  )}
                </Field>
                <Field id="f-age" label={t('form.ageBand')} error={errors.ageBand}>
                  {(a) => (
                    <select className="gh-select" value={form.ageBand} onChange={set('ageBand')} disabled={!ageBands.length} {...a}>
                      <option value="">{t('form.choose')}</option>
                      {ageBands.map((b) => <option key={b} value={b}>{b === 'primary' ? t('form.ageBand.primary') : b}</option>)}
                    </select>
                  )}
                </Field>
                <Field id="f-year" label={t('form.yearLevel')} optional>{input('yearLevel', { placeholder: 'Year 7' })}</Field>
                {!editing && (
                  <Field id="f-class" label={t('form.class')} optional>
                    {(a) => (
                      <select className="gh-select" value={form.classId} onChange={set('classId')} {...a}>
                        <option value="">—</option>
                        {classOptions.map((c) => <option key={c.classId} value={c.classId}>{c.name}</option>)}
                      </select>
                    )}
                  </Field>
                )}
                {programmesField}
              </>
            )}
          </div>
        </section>
      )}

      <div className="gh-form-foot">
        <button type="button" className="gh-btn" onClick={onCancel} disabled={busy}>{t('common.cancel')}</button>
        <button type="submit" className="gh-btn gh-btn-primary" disabled={busy}>
          {busy ? t('common.saving') : editing ? t('common.save') : t('form.create')}
        </button>
      </div>

      {createdCredentials && (
        <Modal title={t('form.createdCredentials.title')} onClose={() => onDone(createdCredentials.user)}>
          <p className="gh-modal-desc">{t('form.createdCredentials.body')}</p>
          <div style={{ background: 'var(--gh-bg-subtle, #f8fafc)', border: '1px solid var(--gh-border, #e2e8f0)', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '0.6rem', fontSize: '0.92rem' }}>
              <strong>{t('form.role')}:</strong> <span>{t(`role.${createdCredentials.role}`)}</span>
              <strong>{t('form.givenNames')}:</strong> <span>{createdCredentials.displayName}</span>
              <strong>{t('form.email')}:</strong> <span className="gh-mono">{createdCredentials.email}</span>
              <strong>{t('form.password')}:</strong> <span className="gh-mono" style={{ fontWeight: 600, color: 'var(--gh-primary, #2563eb)' }}>{createdCredentials.password}</span>
            </div>
          </div>
          <div className="gh-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="gh-btn gh-btn-outline"
              onClick={() => {
                const text = `WeLearn SPARK Login:\nRole: ${t(`role.${createdCredentials.role}`)}\nName: ${createdCredentials.displayName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${window.location.origin}/#/login`;
                navigator.clipboard?.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              <Copy size={15} style={{ marginRight: '0.35rem' }} />
              {copied ? t('form.copied') : t('form.copyCredentials')}
            </button>
            <button type="button" className="gh-btn gh-btn-primary" onClick={() => onDone(createdCredentials.user)}>
              {t('common.done')}
            </button>
          </div>
        </Modal>
      )}
    </form>
  );
}
