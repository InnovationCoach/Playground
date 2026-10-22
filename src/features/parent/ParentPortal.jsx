import { useState } from 'react';
import { FlaskConical, UserPlus, School, GraduationCap, Layers, ChartLine, Users, ArrowRight } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { getParentChildren, redeemParentCode } from '../../services/api/endpoints.js';
import { describeApiError, isMockApi } from '../../services/api/apiClient.js';
import { useAsync } from '../admin/ui/useAsync.js';
import { Alert, Field, StatusBadge } from '../admin/ui/bits.jsx';
import { Avatar } from '../shell/Avatar.jsx';
import { hrefFor } from '../../app/routes.js';
import { ParentChildDashboard } from './ParentChildDashboard.jsx';
import '../admin/admin.css';

/**
 * Parent portal, first version: linked children (read-only) and linking a
 * child with a one-time invite code from the school. Parents are never linked
 * by typing an email (the wireframes' design), which let anyone attach
 * themselves to any child.
 *
 * Each child opens a progress dashboard at #/parent/:childUid
 * (ParentChildDashboard). Consent arrives in Phase E.
 */
export function ParentPortal({ childUid = null, navigate }) {
  if (childUid) return <ParentChildDashboard childUid={childUid} onBack={() => navigate(hrefFor.parent())} />;
  return <ChildList onOpen={(uid) => navigate(hrefFor.parentChild(uid))} />;
}

function ChildList({ onOpen }) {
  const { t } = useLocale();
  const children = useAsync(() => getParentChildren(), []);
  const [linkedName, setLinkedName] = useState(null);
  const items = children.data?.items || [];

  return (
    <div className="gh-page">
      {isMockApi && <div className="gh-banner" role="note"><FlaskConical size={16} aria-hidden="true" />{t('testData.banner')}</div>}
      <div className="gh-page-head">
        <div>
          <h1>{t('parent.title')}</h1>
          <p className="gh-sub">{t('parent.subtitle')}</p>
        </div>
      </div>

      {linkedName && <Alert type="success">{t('parent.linked', { name: linkedName })}</Alert>}

      {children.error ? (
        <Alert type="error">{describeApiError(children.error, t)}</Alert>
      ) : children.loading && !children.data ? (
        <div className="gh-card"><div className="gh-skel" style={{ width: '40%' }} /></div>
      ) : items.length ? (
        <ul className="gh-child-grid">
          {items.map((c) => <ChildCard key={c.uid} child={c} onOpen={() => onOpen(c.uid)} />)}
        </ul>
      ) : (
        <div className="gh-card gh-table-state">
          <span className="gh-empty-icon"><Users size={22} aria-hidden="true" /></span>
          <p style={{ margin: 0 }}>{t('parent.noChildren')}</p>
        </div>
      )}

      <LinkChildCard onLinked={(child) => { setLinkedName(child.givenNames || child.displayName); children.reload(); }} />
    </div>
  );
}

function ChildCard({ child, onOpen }) {
  const { t } = useLocale();
  const row = (Icon, label, value) => value && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
      <Icon size={16} aria-hidden="true" style={{ color: 'var(--gh-text-3)' }} />
      <span className="gh-muted" style={{ minWidth: 90 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
  return (
    <li className="gh-card" style={{ margin: 0 }}>
      <div className="gh-child-head">
        <Avatar name={child.displayName} seed={child.uid} size={48} />
        <div style={{ minWidth: 0 }}>
          <h3>{child.displayName}</h3>
          <div style={{ marginTop: '0.25rem' }}><StatusBadge status={child.status} /></div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {row(School, t('parent.school'), child.schoolName)}
        {row(GraduationCap, t('parent.yearLevel'), child.yearLevel)}
        {row(Layers, t('form.cohort'), child.cohortCode)}
      </div>
      {child.consentStatus === 'required' && <div style={{ marginTop: '1rem' }}><Alert type="info">{t('parent.consentRequired')}</Alert></div>}
      <button type="button" className="gh-btn gh-btn-primary" onClick={onOpen} style={{ marginTop: '1rem', width: '100%' }}>
        <ChartLine size={17} aria-hidden="true" />
        {t('parent.d.viewProgress', { name: child.givenNames || child.displayName })}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

function LinkChildCard({ onLinked }) {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await redeemParentCode(code.trim());
      setCode('');
      onLinked(res.child);
    } catch (err) {
      // Wrong, used and expired codes get one message on purpose: telling them
      // apart would help someone guessing codes.
      setError(err.code === 'NOT_FOUND' ? t('parent.codeInvalid') : describeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="gh-card" onSubmit={onSubmit} style={{ marginTop: '1.25rem' }} aria-labelledby="gh-link-title">
      <div className="gh-card-head" style={{ justifyContent: 'flex-start' }}>
        <span className="gh-action-icon" style={{ background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}><UserPlus size={17} aria-hidden="true" /></span>
        <div>
          <h3 id="gh-link-title">{t('parent.linkTitle')}</h3>
          <p className="gh-card-desc">{t('parent.linkBody')}</p>
        </div>
      </div>
      <div className="gh-link-form">
        <div>
          <Field id="invite-code" label={t('parent.code')} error={error}>
            {(a) => (
              <input className="gh-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345"
                     autoCapitalize="characters" autoComplete="off" spellCheck={false}
                     style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'ui-monospace, Menlo, monospace' }} {...a} />
            )}
          </Field>
        </div>
        <button type="submit" className="gh-btn gh-btn-primary" disabled={busy || !code.trim()} style={{ marginTop: '1.65rem' }}>
          {busy ? t('common.loading') : t('parent.link')}
        </button>
      </div>
    </form>
  );
}
