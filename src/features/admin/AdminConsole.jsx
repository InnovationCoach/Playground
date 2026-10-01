import { useEffect, useRef, useState } from 'react';
import { Users, GraduationCap, HeartHandshake, Settings, FlaskConical, ArrowLeft, Printer, CreditCard, PackageCheck } from 'lucide-react';
import { Avatar } from '../shell/Avatar.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { consolePermissions } from '../../app/roles.js';
import { hrefFor } from '../../app/routes.js';
import { isMockApi } from '../../services/api/apiClient.js';
import { AccountList } from './accounts/AccountList.jsx';
import { AccountDetail } from './accounts/AccountDetail.jsx';
import { AccountForm } from './accounts/AccountForm.jsx';
import { clearReferenceCache } from './accounts/useReferenceData.js';
import { StudentBillingOverview } from './billing/StudentBillingOverview.jsx';
import { MaterialRequestsList } from './materials/MaterialRequestsList.jsx';
import { SettingsPage } from '../settings/SettingsPage.jsx';
import './admin.css';

const NAV = [
  { kind: 'students', icon: GraduationCap, key: 'nav.students' },
  { kind: 'staff', icon: Users, key: 'nav.staff' },
  { kind: 'parents', icon: HeartHandshake, key: 'nav.parents' }
];

/**
 * Admin console for `admin` and `supervisor` claims. Layout, role-aware
 * navigation and the account screens.
 */
export function AdminConsole({ route, role, user, profile, navigate }) {
  const { t } = useLocale();
  const perms = consolePermissions(role);
  const [flash, setFlash] = useState(null);
  const mainRef = useRef(null);
  const activeKind = route.kind;

  useEffect(() => () => clearReferenceCache(), []);

  // Move focus to the new screen's content
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [route.page, route.kind, route.uid]);

  // A flash message belongs to the screen it was raised for.
  useEffect(() => { if (route.page !== 'detail') setFlash(null); }, [route.page]);

  let body;
  if (route.screen === 'settings') {
    body = <SettingsPage user={user} profile={profile} embedded />;
  } else if (route.page === 'billing') {
    body = <StudentBillingOverview perms={perms} />;
  } else if (route.page === 'materials') {
    body = <MaterialRequestsList perms={perms} user={user} />;
  } else if (route.page === 'detail') {
    body = (
      <AccountDetail
        key={route.uid}
        uid={route.uid}
        perms={perms}
        callerUid={user.uid}
        flash={flash}
        onOpen={(uid) => navigate(hrefFor.detail(uid))}
        onBack={() => window.history.back()}
      />
    );
  } else if (route.page === 'create' && perms.editAccounts) {
    body = (
      <div className="gh-narrow" style={{ maxWidth: 820 }}>
      <a className="gh-crumb" href={hrefFor.list(route.kind)}><ArrowLeft size={16} aria-hidden="true" />{t(`nav.${route.kind}`)}</a>
      <AccountForm
        kind={route.kind}
        onCancel={() => navigate(hrefFor.list(route.kind))}
        onDone={(created) => {
          const a = created.activation;
          setFlash(a?.sent
            ? { type: 'success', text: `${t('form.created')} ${t('form.activationSent')}` }
            : { type: 'info', text: t('form.activationNotSent', { reason: t(`errors.${a?.reason}`) }) });
          navigate(hrefFor.detail(created.uid));
        }}
      />
      </div>
    );
  } else {
    body = (
      <AccountList
        kind={route.kind}
        perms={perms}
        onOpen={(uid) => navigate(hrefFor.detail(uid))}
        onCreate={() => navigate(hrefFor.create(route.kind))}
      />
    );
  }

  return (
    <div className="gh-shell">
      <nav className="gh-side" aria-label={t('nav.console')}>
        <div className="gh-side-label">{t('nav.people')}</div>
        {NAV.map((item) => (
          <a key={item.kind} href={hrefFor.list(item.kind)} className="gh-nav-link"
             aria-current={route.screen === 'admin' && route.page === 'list' && activeKind === item.kind ? 'page' : undefined}>
            <item.icon size={18} strokeWidth={2} aria-hidden="true" />{t(item.key)}
          </a>
        ))}
        <div className="gh-side-label">{t('nav.operations')}</div>
        <a href={hrefFor.billing()} className="gh-nav-link"
           aria-current={route.screen === 'admin' && route.page === 'billing' ? 'page' : undefined}>
          <CreditCard size={18} strokeWidth={2} aria-hidden="true" />{t('nav.financials')}
        </a>
        <a href={hrefFor.materials()} className="gh-nav-link"
           aria-current={route.screen === 'admin' && route.page === 'materials' ? 'page' : undefined}>
          <PackageCheck size={18} strokeWidth={2} aria-hidden="true" />{t('nav.materials')}
        </a>
        <div className="gh-side-label">{t('nav.teaching')}</div>
        <a href={hrefFor.resources()} className="gh-nav-link">
          <Printer size={18} strokeWidth={2} aria-hidden="true" />{t('nav.primaryResources')}
        </a>
        <div className="gh-side-label">{t('nav.account')}</div>
        <a href={hrefFor.settings()} className="gh-nav-link" aria-current={route.screen === 'settings' ? 'page' : undefined}>
          <Settings size={18} strokeWidth={2} aria-hidden="true" />{t('nav.settings')}
        </a>
        <div className="gh-side-foot">
          <Avatar name={profile?.displayName || user.email} seed={user.uid} size={34} />
          <div style={{ minWidth: 0 }}>
            <strong>{profile?.displayName || user.email}</strong>
            {t(`role.${role}`)}
          </div>
        </div>
      </nav>

      <main className="gh-main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
        {isMockApi && <div className="gh-banner" role="note"><FlaskConical size={16} aria-hidden="true" />{t('testData.banner')}</div>}
        {body}
      </main>
    </div>
  );
}
