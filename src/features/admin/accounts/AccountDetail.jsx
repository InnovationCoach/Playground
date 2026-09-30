import { useState } from 'react';
import {
  ArrowLeft, IdCard, Mail, School, Pencil, KeyRound, AtSign, Send, UserPlus, ShieldBan, ShieldCheck,
  Unlink, UserRound, History, ChevronLeft, ChevronRight, CircleCheck, CircleAlert, Link2, Clock
} from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { STAFF_ROLES } from '../../../app/roles.js';
import {
  getUser, getUserHistory, setUserRole, suspendUser, unsuspendUser, resendActivation,
  changeUserEmail, issueParentInvite, revokeParentLink
} from '../../../services/api/endpoints.js';
import { describeApiError } from '../../../services/api/apiClient.js';
import { useAsync } from '../ui/useAsync.js';
import { usePagedList } from '../ui/usePagedList.js';
import { pageRange } from '../ui/pagination.js';
import { Modal } from '../ui/Modal.jsx';
import { StatusBadge, RoleBadge, Alert, Field } from '../ui/bits.jsx';
import { Avatar } from '../../shell/Avatar.jsx';
import { AccountForm } from './AccountForm.jsx';
import { useReferenceData, localName } from './useReferenceData.js';

/**
 * One account: profile, linked parents/children, the admin actions the §6
 * matrix allows, and the server-written history. After every action the
 * record is re-read from the API, so what the screen shows is what the server
 * actually holds.
 */
export function AccountDetail({ uid, perms, callerUid, onOpen, onBack, flash }) {
  const { t, locale, formatDate } = useLocale();
  const ref = useReferenceData();
  const record = useAsync(() => getUser(uid), [uid]);
  const [tab, setTab] = useState('details');
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(flash || null);
  const [historyKey, setHistoryKey] = useState(0);

  const user = record.data;
  const refresh = () => { record.reload(); setHistoryKey((k) => k + 1); };

  const back = (
    <button type="button" className="gh-crumb" onClick={onBack}>
      <ArrowLeft size={16} aria-hidden="true" />{t('common.back')}
    </button>
  );

  if (record.loading && !user) return <>{back}<div className="gh-card"><div className="gh-skel" style={{ width: '40%', height: '1.2rem' }} /></div></>;
  if (record.error) {
    return (
      <div>
        {back}
        <Alert type="error">{record.error.code === 'NOT_FOUND' ? t('account.notFound') : describeApiError(record.error, t)}</Alert>
      </div>
    );
  }

  const isSelf = user.uid === callerUid;
  const schoolNames = user.schoolIds.map((id) => ref.schools.find((s) => s.schoolId === id)?.name || id).join(', ');
  const classNames = user.classIds.map((id) => ref.classes.find((c) => c.classId === id)?.name || id).join(', ');
  const cohort = ref.cohorts.find((c) => c.cohortId === user.cohortId);
  const programmes = (user.programmeIds || []).map((id) => localName(ref.programmes.find((p) => p.programmeId === id)?.name, locale) || id).join(', ');
  const dash = <span className="gh-muted">—</span>;
  const when = (v) => (v ? formatDate(v, { dateStyle: 'medium', timeStyle: 'short' }) : dash);

  // Actions return the updated record; show it at once, then re-read so the
  // screen converges on what the server holds (and the history tab refreshes).
  const done = (message, updated) => {
    if (updated?.uid === user.uid) record.setData(updated);
    setDialog(null);
    setNotice({ type: 'success', text: message || t('account.done') });
    refresh();
  };

  const item = (label, value) => <div><dt>{label}</dt><dd>{value || dash}</dd></div>;

  return (
    <div>
      {back}

      <div className="gh-card">
        <div className="gh-profile">
          <Avatar name={user.displayName} seed={user.uid} size={64} />
          <div className="gh-profile-main">
            <h1>
              {user.salutation ? `${user.salutation} ` : ''}{user.displayName}
              <RoleBadge role={user.role} /><StatusBadge status={user.status} />
            </h1>
            <div className="gh-profile-meta">
              <span><IdCard size={15} aria-hidden="true" /><span className="gh-mono">{user.publicId}</span></span>
              <span><Mail size={15} aria-hidden="true" />{user.email}</span>
              {schoolNames && <span><School size={15} aria-hidden="true" />{schoolNames}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {notice && <Alert type={notice.type}>{notice.text}</Alert>}
        {user.consent?.status === 'required' && <Alert type="info">{t('form.consentNote')}</Alert>}
      </div>

      <div className="gh-tabs" role="tablist">
        <button type="button" role="tab" className="gh-tab" aria-selected={tab === 'details'} onClick={() => setTab('details')}>
          <UserRound size={16} aria-hidden="true" />{t('account.details')}
        </button>
        {perms.viewHistory && (
          <button type="button" role="tab" className="gh-tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
            <History size={16} aria-hidden="true" />{t('account.history')}
          </button>
        )}
      </div>

      {tab === 'history' ? (
        <HistoryList uid={user.uid} key={historyKey} />
      ) : (
        <div className="gh-detail-grid">
          <div>
            {dialog === 'edit' ? (
              <AccountForm
                kind={user.role === 'student' ? 'students' : user.role === 'parent' ? 'parents' : 'staff'}
                user={user}
                onCancel={() => setDialog(null)}
                onDone={(res) => done(null, res)}
              />
            ) : (
              <div className="gh-card">
                <div className="gh-card-head"><h3>{t('account.details')}</h3></div>
                <dl className="gh-dl">
                  {item(t('form.givenNames'), user.givenNames)}
                  {item(t('form.surname'), user.surname)}
                  {item(t('form.phone'), user.phone)}
                  {item(t('form.gender'), user.gender && t(`form.gender.${user.gender}`))}
                  {user.classIds.length > 0 && item(t('form.class'), classNames)}
                  {user.role === 'student' && (
                    <>
                      {item(t('form.cohort'), cohort && localName(cohort.name, locale))}
                      {item(t('form.ageBand'), user.ageBand === 'primary' ? t('form.ageBand.primary') : user.ageBand)}
                      {item(t('form.yearLevel'), user.yearLevel)}
                      {item(t('form.programmes'), programmes)}
                      {'dateOfBirth' in user && item(t('form.dateOfBirth'), user.dateOfBirth && formatDate(user.dateOfBirth))}
                    </>
                  )}
                  {item(t('account.lastSignIn'), user.auth?.lastSignInAt ? when(user.auth.lastSignInAt) : t('account.never'))}
                  {item(t('account.created'), `${formatDate(user.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}${user.createdBy?.name ? ` · ${user.createdBy.name}` : ''}`)}
                  {user.updatedAt && item(t('account.updated'), `${formatDate(user.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}${user.updatedBy?.name ? ` · ${user.updatedBy.name}` : ''}`)}
                </dl>
              </div>
            )}

            {(user.role === 'student' || user.role === 'parent') && (
              <div className="gh-card">
                <div className="gh-card-head"><h3>{user.role === 'parent' ? t('account.children') : t('account.parents')}</h3></div>
                {user.links?.length ? (
                  <ul className="gh-link-list">
                    {user.links.map((l) => (
                      <li key={l.linkId}>
                        <button type="button" className="gh-link-btn" onClick={() => onOpen(l.uid)}>
                          <Avatar name={l.displayName} seed={l.uid} size={34} />
                          <span style={{ minWidth: 0 }}>
                            <span className="gh-person-name" style={{ display: 'block' }}>{l.displayName}</span>
                            <span className="gh-mono">{l.publicId}</span>
                          </span>
                        </button>
                        {perms.editAccounts && (
                          <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setDialog({ type: 'revoke', linkId: l.linkId })}>
                            <Unlink size={15} aria-hidden="true" />{t('account.action.revokeLink')}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : <p className="gh-muted" style={{ margin: 0, fontSize: '0.9rem' }}>{t('common.none')}</p>}
              </div>
            )}
          </div>

          {perms.editAccounts && (
            <div className="gh-card">
              <div className="gh-card-head"><h3>{t('account.actions')}</h3></div>
              <div className="gh-actions">
                <Action icon={Pencil} onClick={() => setDialog('edit')}>{t('account.action.editDetails')}</Action>
                {STAFF_ROLES.includes(user.role) && !isSelf && (
                  <Action icon={KeyRound} onClick={() => setDialog('role')}>{t('account.action.changeRole')}</Action>
                )}
                <Action icon={AtSign} onClick={() => setDialog('email')}>{t('account.action.changeEmail')}</Action>
                {user.status === 'pending' && (
                  <ResendAction user={user} onDone={() => done(t('form.activationSent'))} onError={(text) => setNotice({ type: 'error', text })} />
                )}
                {user.role === 'student' && perms.issueParentInvite && (
                  <Action icon={UserPlus} onClick={() => setDialog('invite')}>{t('account.action.parentInvite')}</Action>
                )}
                {!isSelf && <div className="gh-action-sep" />}
                {!isSelf && (user.status === 'suspended' ? (
                  <Action icon={ShieldCheck} onClick={() => setDialog('unsuspend')}>{t('account.action.unsuspend')}</Action>
                ) : (
                  <Action icon={ShieldBan} danger onClick={() => setDialog('suspend')}>{t('account.action.suspend')}</Action>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {dialog === 'suspend' && <SuspendDialog user={user} onClose={() => setDialog(null)} onDone={(res) => done(null, res)} />}
      {dialog === 'unsuspend' && (
        <ConfirmDialog icon={ShieldCheck} title={t('account.unsuspend.title', { name: user.displayName })} body={t('account.unsuspend.body')}
                       confirmLabel={t('account.action.unsuspend')} run={() => unsuspendUser(user.uid)}
                       onClose={() => setDialog(null)} onDone={(res) => done(null, res)} />
      )}
      {dialog === 'role' && <RoleDialog user={user} onClose={() => setDialog(null)} onDone={(res) => done(null, res)} />}
      {dialog === 'email' && <EmailDialog user={user} onClose={() => setDialog(null)} onDone={(res) => done(null, res)} />}
      {dialog === 'invite' && <InviteDialog user={user} onClose={() => { setDialog(null); refresh(); }} />}
      {dialog?.type === 'revoke' && (
        <ConfirmDialog icon={Unlink} tone="red" title={t('account.revoke.title')} body={t('account.revoke.body')} danger
                       confirmLabel={t('account.action.revokeLink')} run={() => revokeParentLink(dialog.linkId)}
                       onClose={() => setDialog(null)} onDone={(res) => done(null, res)} />
      )}
    </div>
  );
}

function Action({ icon: Icon, danger, children, ...props }) {
  return (
    <button type="button" className={`gh-action${danger ? ' gh-danger' : ''}`} {...props}>
      <span className="gh-action-icon"><Icon size={16} aria-hidden="true" /></span>{children}
    </button>
  );
}

function ResendAction({ user, onDone, onError }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  return (
    <Action icon={Send} disabled={busy} onClick={async () => {
      setBusy(true);
      try { await resendActivation(user.uid); onDone(); } catch (err) { onError(describeApiError(err, t)); } finally { setBusy(false); }
    }}>{busy ? t('common.saving') : t('account.action.resend')}</Action>
  );
}

/** Shared shape for every confirm-then-call dialog: shows the server's error in place. */
function useSubmit(run, onDone) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true); setError(null);
    try { const res = await run(); onDone(res); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return { busy, error, errorText: error ? describeApiError(error, t) : null, submit };
}

function ConfirmDialog({ title, body, confirmLabel, run, onClose, onDone, danger, icon, tone }) {
  const { t } = useLocale();
  const s = useSubmit(run, onDone);
  return (
    <Modal title={title} icon={icon} tone={tone} onClose={onClose} footer={<>
      <button type="button" className="gh-btn" onClick={onClose}>{t('common.cancel')}</button>
      <button type="button" className={`gh-btn ${danger ? 'gh-btn-danger gh-solid' : 'gh-btn-accent'}`} disabled={s.busy} onClick={s.submit}>
        {s.busy ? t('common.saving') : confirmLabel}
      </button>
    </>}>
      <p>{body}</p>
      <Alert type="error">{s.errorText}</Alert>
    </Modal>
  );
}

function SuspendDialog({ user, onClose, onDone }) {
  const { t } = useLocale();
  const [reason, setReason] = useState('');
  const s = useSubmit(() => suspendUser(user.uid, reason.trim()), onDone);
  return (
    <Modal title={t('account.suspend.title', { name: user.displayName })} icon={ShieldBan} tone="red" onClose={onClose}>
      <form onSubmit={s.submit}>
        <p>{t('account.suspend.body')}</p>
        <Field id="f-reason" label={t('account.suspend.reason')} error={s.error?.field === 'reason' ? s.errorText : null}>
          {(a) => <textarea className="gh-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus {...a} />}
        </Field>
        {s.error?.field !== 'reason' && <div style={{ marginTop: '0.75rem' }}><Alert type="error">{s.errorText}</Alert></div>}
        <div className="gh-modal-foot">
          <button type="button" className="gh-btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="gh-btn gh-btn-danger gh-solid" disabled={s.busy || !reason.trim()}>
            {s.busy ? t('common.saving') : t('account.action.suspend')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoleDialog({ user, onClose, onDone }) {
  const { t } = useLocale();
  const [role, setRole] = useState(user.role);
  const s = useSubmit(() => setUserRole(user.uid, role), onDone);
  return (
    <Modal title={t('account.changeRole.title', { name: user.displayName })} icon={KeyRound} onClose={onClose}>
      <form onSubmit={s.submit}>
        <p>{t('account.changeRole.body')}</p>
        <Field id="f-newrole" label={t('form.role')}>
          {(a) => (
            <select className="gh-select" value={role} onChange={(e) => setRole(e.target.value)} {...a}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
            </select>
          )}
        </Field>
        <div style={{ marginTop: '0.75rem' }}><Alert type="error">{s.errorText}</Alert></div>
        <div className="gh-modal-foot">
          <button type="button" className="gh-btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="gh-btn gh-btn-accent" disabled={s.busy || role === user.role}>
            {s.busy ? t('common.saving') : t('account.action.changeRole')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EmailDialog({ user, onClose, onDone }) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const s = useSubmit(() => changeUserEmail(user.uid, email.trim().toLowerCase()), onDone);
  const fieldError = s.error?.field === 'newEmail' ? s.errorText : null;
  return (
    <Modal title={t('account.changeEmail.title', { name: user.displayName })} icon={AtSign} onClose={onClose}>
      <form onSubmit={s.submit} noValidate>
        <p>{t('account.changeEmail.body')}</p>
        <Field id="f-newemail" label={t('account.changeEmail.new')} error={fieldError}>
          {(a) => <input className="gh-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus {...a} />}
        </Field>
        {!fieldError && <div style={{ marginTop: '0.75rem' }}><Alert type="error">{s.errorText}</Alert></div>}
        <div className="gh-modal-foot">
          <button type="button" className="gh-btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="gh-btn gh-btn-accent" disabled={s.busy || !email.trim()}>
            {s.busy ? t('common.saving') : t('account.action.changeEmail')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** The plain code comes back exactly once (contract §7); it is never stored client-side. */
function InviteDialog({ user, onClose }) {
  const { t, formatDate } = useLocale();
  const [result, setResult] = useState(null);
  const s = useSubmit(() => issueParentInvite(user.uid), setResult);
  return (
    <Modal title={t('account.invite.title')} icon={UserPlus} onClose={onClose} footer={
      result
        ? <button type="button" className="gh-btn gh-btn-accent" onClick={onClose}>{t('common.close')}</button>
        : <>
            <button type="button" className="gh-btn" onClick={onClose}>{t('common.cancel')}</button>
            <button type="button" className="gh-btn gh-btn-accent" disabled={s.busy} onClick={s.submit}>
              {s.busy ? t('common.saving') : t('account.action.parentInvite')}
            </button>
          </>
    }>
      {result ? (
        <>
          <div className="gh-code" aria-label={t('parent.code')}>{result.code}</div>
          <p>{t('account.invite.body', { date: formatDate(result.expiresAt, { dateStyle: 'long' }) })}</p>
        </>
      ) : <p>{t('account.invite.intro', { name: user.displayName })}</p>}
      <Alert type="error">{s.errorText}</Alert>
    </Modal>
  );
}

/** Icon and colour for each audit action in the timeline. */
const ACTION_STYLE = {
  ACCOUNT_CREATED: [UserPlus, 'purple'],
  ACCOUNT_ACTIVATED: [CircleCheck, 'green'],
  ACTIVATION_EMAIL_SENT: [Send, 'blue'],
  ACTIVATION_EMAIL_RESENT: [Send, 'blue'],
  DETAILS_CHANGED: [Pencil, ''],
  ROLE_CHANGED: [KeyRound, 'purple'],
  ACCOUNT_SUSPENDED: [ShieldBan, 'red'],
  ACCOUNT_UNSUSPENDED: [ShieldCheck, 'green'],
  PARENT_INVITE_ISSUED: [UserPlus, 'blue'],
  PARENT_LINKED: [Link2, 'green'],
  PARENT_UNLINKED: [Unlink, 'amber'],
  EMAIL_CHANGE_REQUESTED: [AtSign, 'blue']
};

function HistoryList({ uid }) {
  const { t, formatDate } = useLocale();
  const list = usePagedList((q) => getUserHistory(uid, q), {}, { pageSize: 20 });
  const range = pageRange({ pageIndex: list.pageIndex, pageSize: list.pageSize, count: list.items.length, total: list.total });

  if (list.error) return <Alert type="error">{describeApiError(list.error, t)}</Alert>;
  if (list.loading && !list.items.length) return <div className="gh-card"><div className="gh-skel" style={{ width: '50%' }} /></div>;
  if (!list.items.length) return <div className="gh-card gh-table-state"><span className="gh-empty-icon"><Clock size={22} aria-hidden="true" /></span><p style={{ margin: 0 }}>{t('account.historyEmpty')}</p></div>;

  return (
    <div className="gh-card">
      <ol className="gh-timeline">
        {list.items.map((h) => {
          const [Icon, tone] = ACTION_STYLE[h.action] || [CircleAlert, ''];
          return (
            <li key={h.logId}>
              <span className={`gh-tl-icon${tone ? ` gh-tone-${tone}` : ''}`}><Icon size={15} aria-hidden="true" /></span>
              <div style={{ minWidth: 0 }}>
                <div className="gh-tl-title">{h.summary}</div>
                <div className="gh-tl-meta">{h.actorName}{h.details?.reason ? ` · “${h.details.reason}”` : ''}</div>
                {h.details?.before && h.details?.after && (
                  <div className="gh-tl-diff">
                    {Object.keys(h.details.after).map((k) => (
                      <div key={k}><strong>{k}</strong>: {fmt(h.details.before[k])} → {fmt(h.details.after[k])}</div>
                    ))}
                  </div>
                )}
              </div>
              <time dateTime={h.createdAt}>{formatDate(h.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</time>
            </li>
          );
        })}
      </ol>
      <div className="gh-pager" style={{ margin: '0 -1.35rem -1.25rem', borderRadius: '0 0 12px 12px' }}>
        <span>{t('table.displaying', range)}</span>
        <div className="gh-pager-controls">
          <button type="button" className="gh-btn gh-btn-sm" onClick={list.prev} disabled={!list.hasPrev} aria-label={t('table.previous')}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button type="button" className="gh-btn gh-btn-sm" onClick={list.next} disabled={!list.hasNext} aria-label={t('table.next')}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}

const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : Array.isArray(v) ? v.join(', ') || '—' : String(v));
