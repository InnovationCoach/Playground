import { useEffect, useMemo, useState } from 'react';
import { Search, DollarSign, AlertCircle, CheckCircle, Clock, CreditCard, PlusCircle } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { listBilling, recordPayment } from '../../../services/api/endpoints.js';
import { DataTable } from '../ui/DataTable.jsx';
import { usePagedList } from '../ui/usePagedList.js';
import { StatusBadge, Alert } from '../ui/bits.jsx';
import { Avatar } from '../../shell/Avatar.jsx';
import { useReferenceData, localName } from '../accounts/useReferenceData.js';

export function StudentBillingOverview({ perms }) {
  const { t, locale } = useLocale();
  const ref = useReferenceData();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [activePaymentUser, setActivePaymentUser] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = useMemo(() => ({
    status: statusFilter || undefined,
    cohortId: cohortId || undefined,
    q: q || undefined
  }), [statusFilter, cohortId, q]);

  const list = usePagedList(listBilling, query);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleOpenPaymentModal = (user) => {
    setActivePaymentUser(user);
    setPaymentAmount('');
    setNextDate(user.nextBillingDate || '2026-11-01');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activePaymentUser || !paymentAmount) return;
    setSubmitting(true);
    try {
      await recordPayment(activePaymentUser.uid, {
        amount: Number(paymentAmount),
        nextBillingDate: nextDate
      });
      setFeedback({ type: 'success', text: `Payment of ${formatCurrency(paymentAmount)} recorded for ${activePaymentUser.studentName}.` });
      setActivePaymentUser(null);
      list.reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  const cohortCode = (id) => ref.cohorts.find((c) => c.cohortId === id)?.code || '';

  const columns = [
    {
      key: 'name',
      label: t('accounts.col.name'),
      render: (u) => (
        <div className="gh-person">
          <Avatar name={u.studentName} seed={u.uid} size={36} />
          <div style={{ minWidth: 0 }}>
            <div className="gh-person-name">{u.studentName}</div>
            <div className="gh-person-sub">{u.email}</div>
          </div>
        </div>
      )
    },
    { key: 'publicId', label: t('accounts.col.id'), mono: true },
    {
      key: 'cohort',
      label: t('accounts.col.cohort'),
      render: (u) => <span className="gh-badge gh-badge-plain">{cohortCode(u.cohortId)}</span>
    },
    {
      key: 'totalTuition',
      label: 'Tuition Fee',
      render: (u) => <strong>{formatCurrency(u.totalTuition)}</strong>
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      render: (u) => <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(u.amountPaid)}</span>
    },
    {
      key: 'remainingBalance',
      label: 'Balance Due',
      render: (u) => (
        <span style={{ color: u.remainingBalance > 0 ? '#ef4444' : '#6b7280', fontWeight: u.remainingBalance > 0 ? 600 : 400 }}>
          {formatCurrency(u.remainingBalance)}
        </span>
      )
    },
    {
      key: 'status',
      label: t('accounts.col.status'),
      render: (u) => {
        if (u.status === 'paid') {
          return <span className="gh-badge gh-badge-active"><CheckCircle size={13} style={{ marginRight: 4 }} />Paid in Full</span>;
        }
        if (u.status === 'partial') {
          return <span className="gh-badge gh-badge-pending"><Clock size={13} style={{ marginRight: 4 }} />Partial ({Math.round((u.amountPaid / u.totalTuition) * 100)}%)</span>;
        }
        return <span className="gh-badge gh-badge-suspended"><AlertCircle size={13} style={{ marginRight: 4 }} />Overdue</span>;
      }
    },
    {
      key: 'nextBillingDate',
      label: 'Next Billing Cycle',
      nowrap: true,
      render: (u) => <span className="gh-muted">{u.nextBillingDate}</span>
    },
    ...(perms.editAccounts ? [{
      key: 'actions',
      label: '',
      render: (u) => (
        <button
          type="button"
          className="gh-btn gh-btn-sm"
          onClick={() => handleOpenPaymentModal(u)}
          disabled={u.remainingBalance === 0}
        >
          <CreditCard size={14} aria-hidden="true" style={{ marginRight: 4 }} />
          Record Payment
        </button>
      )
    }] : [])
  ];

  const summary = list.extra?.summary || {
    totalRevenue: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    paidCount: 0,
    totalStudents: 0
  };

  const toolbar = (
    <>
      <label className="gh-grow gh-input-icon">
        <span style={srOnly}>{t('common.search')}</span>
        <Search size={17} aria-hidden="true" />
        <input
          className="gh-input"
          type="search"
          value={search}
          placeholder="Search student, email or ID..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <label className="gh-fixed">
        <span style={srOnly}>{t('accounts.col.cohort')}</span>
        <select className="gh-select" value={cohortId} onChange={(e) => setCohortId(e.target.value)}>
          <option value="">{t('accounts.allCohorts')}</option>
          {ref.cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>{localName(c.name, locale)}</option>
          ))}
        </select>
      </label>

      <label className="gh-fixed">
        <span style={srOnly}>Payment Status</span>
        <select className="gh-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid in Full</option>
          <option value="partial">Partial Payment</option>
          <option value="overdue">Overdue</option>
        </select>
      </label>
    </>
  );

  return (
    <section aria-labelledby="gh-billing-title">
      <div className="gh-page-head">
        <div>
          <h1 id="gh-billing-title">Financial Situation & Student Billing</h1>
          <p className="gh-sub">Track tuition payments, outstanding balances, and billing schedules.</p>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.text}</Alert>}

      {/* KPI Cards Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Total Revenue Collected</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{formatCurrency(summary.totalRevenue)}</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Outstanding Balance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(summary.totalOutstanding)}</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Overdue Accounts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{summary.overdueCount} Students</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Paid in Full</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>{summary.paidCount} / {summary.totalStudents}</div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        list={list}
        caption="Student Financial Billing"
        toolbar={toolbar}
      />

      {/* Record Payment Modal */}
      {activePaymentUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyInCenter: 'center',
          zIndex: 999
        }}>
          <div className="gh-card" style={{ width: 440, maxWidth: '90vw', margin: 'auto', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Record Payment</h3>
            <p className="gh-sub" style={{ marginBottom: '20px' }}>
              Recording tuition payment for <strong>{activePaymentUser.studentName}</strong> (Balance: {formatCurrency(activePaymentUser.remainingBalance)}).
            </p>

            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Payment Amount (฿)</label>
                <input
                  className="gh-input"
                  type="number"
                  min="1"
                  max={activePaymentUser.remainingBalance}
                  placeholder={`Max: ${activePaymentUser.remainingBalance}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Next Billing Cycle Date</label>
                <input
                  className="gh-input"
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => setActivePaymentUser(null)}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  disabled={submitting || !paymentAmount}
                >
                  {submitting ? t('common.saving') : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
