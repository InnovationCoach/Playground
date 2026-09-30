import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { listUsers } from '../../../services/api/endpoints.js';
import { DataTable } from '../ui/DataTable.jsx';
import { usePagedList } from '../ui/usePagedList.js';
import { toggleSort } from '../ui/pagination.js';
import { StatusBadge, RoleBadge, Alert } from '../ui/bits.jsx';
import { Avatar } from '../../shell/Avatar.jsx';
import { ACCOUNT_KINDS } from './accountKinds.js';
import { useReferenceData, localName } from './useReferenceData.js';

/** Staff, students or parents: one screen, three configurations. */
export function AccountList({ kind, perms, onOpen, onCreate }) {
  const { t, locale, formatDate } = useLocale();
  const config = ACCOUNT_KINDS[kind];
  const ref = useReferenceData();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [sort, setSort] = useState('surname');

  // Reset filters when switching between staff / students / parents.
  useEffect(() => { setSearch(''); setQ(''); setStatus(''); setRole(''); setCohortId(''); setSort('surname'); }, [kind]);

  // Debounced: one request after typing pauses, not one per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = useMemo(() => ({
    role: role ? [role] : config.roles,
    status: status || undefined,
    cohortId: kind === 'students' ? cohortId || undefined : undefined,
    q: q || undefined,
    sort
  }), [role, config.roles, status, cohortId, kind, q, sort]);

  const list = usePagedList(listUsers, query);

  const cohortCode = (id) => ref.cohorts.find((c) => c.cohortId === id)?.code || '';
  const columns = [
    { key: 'name', label: t('accounts.col.name'), sortKey: 'surname', render: (u) => (
      <div className="gh-person">
        <Avatar name={u.displayName} seed={u.uid} size={36} />
        <div style={{ minWidth: 0 }}>
          <div className="gh-person-name">{u.givenNames} {u.surname}</div>
          <div className="gh-person-sub">{u.email}</div>
        </div>
      </div>
    ) },
    { key: 'publicId', label: t('accounts.col.id'), sortKey: 'publicId', mono: true },
    ...(kind === 'staff' ? [{ key: 'role', label: t('accounts.col.role'), sortKey: 'role', render: (u) => <RoleBadge role={u.role} /> }] : []),
    ...(kind === 'students' ? [
      { key: 'cohort', label: t('accounts.col.cohort'), render: (u) => <span className="gh-badge gh-badge-plain">{cohortCode(u.cohortId)}</span> },
      { key: 'yearLevel', label: t('accounts.col.yearLevel'), nowrap: true }
    ] : []),
    ...(kind === 'parents' ? [{ key: 'childCount', label: t('accounts.col.children') }] : []),
    { key: 'status', label: t('accounts.col.status'), sortKey: 'status', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'createdAt', label: t('accounts.col.created'), sortKey: 'createdAt', nowrap: true, render: (u) => <span className="gh-muted">{formatDate(u.createdAt)}</span> }
  ];

  const toolbar = (
    <>
      <label className="gh-grow gh-input-icon">
        <span style={srOnly}>{t('common.search')}</span>
        <Search size={17} aria-hidden="true" />
        <input className="gh-input" type="search" value={search}
               placeholder={t('accounts.searchPlaceholder')} onChange={(e) => setSearch(e.target.value)} />
      </label>
      {kind === 'staff' && (
        <label className="gh-fixed">
          <span style={srOnly}>{t('accounts.filterRole')}</span>
          <select className="gh-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{t('accounts.allRoles')}</option>
            {config.roles.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
          </select>
        </label>
      )}
      {kind === 'students' && (
        <label className="gh-fixed">
          <span style={srOnly}>{t('accounts.col.cohort')}</span>
          <select className="gh-select" value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
            <option value="">{t('accounts.allCohorts')}</option>
            {ref.cohorts.map((c) => <option key={c.cohortId} value={c.cohortId}>{localName(c.name, locale)}</option>)}
          </select>
        </label>
      )}
      <label className="gh-fixed">
        <span style={srOnly}>{t('accounts.filterStatus')}</span>
        <select className="gh-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('accounts.allStatuses')}</option>
          {['active', 'pending', 'suspended'].map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
      </label>
    </>
  );

  return (
    <section aria-labelledby="gh-list-title">
      <div className="gh-page-head">
        <div>
          <h1 id="gh-list-title">{t(config.navKey)}</h1>
          <p className="gh-sub">{t(`accounts.sub.${kind}`)}</p>
        </div>
        {perms.editAccounts && (
          <button type="button" className="gh-btn gh-btn-primary" onClick={onCreate}>
            <Plus size={17} aria-hidden="true" />{t(config.createKey)}
          </button>
        )}
      </div>

      {!perms.editAccounts && <Alert type="info">{t('accounts.readOnly')}</Alert>}

      <DataTable
        columns={columns}
        list={list}
        sort={sort}
        onSortChange={(field) => setSort((s) => toggleSort(s, field))}
        onRowClick={(u) => onOpen(u.uid)}
        caption={t(config.navKey)}
        toolbar={toolbar}
      />
    </section>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
