import { useEffect, useMemo, useState } from 'react';
import { Search, PackageCheck, Clock, CheckCircle2, XCircle, Plus, Boxes, Sparkles } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { listMaterialRequests, createMaterialRequest, updateMaterialRequest } from '../../../services/api/endpoints.js';
import { DataTable } from '../ui/DataTable.jsx';
import { usePagedList } from '../ui/usePagedList.js';
import { Alert } from '../ui/bits.jsx';
import { Avatar } from '../../shell/Avatar.jsx';

const CATEGORIES = ['Lab Equipment', 'Tech/Hardware', 'Books & Media', 'Classroom Supplies', 'Art & Crafts'];

export function MaterialRequestsList({ perms, user }) {
  const { t, locale } = useLocale();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form state
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newQty, setNewQty] = useState(1);
  const [newCost, setNewCost] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = useMemo(() => ({
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    q: q || undefined
  }), [categoryFilter, statusFilter, q]);

  const list = usePagedList(listMaterialRequests, query);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      style: 'currency',
      currency: 'THB',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await updateMaterialRequest(requestId, { status: newStatus });
      setFeedback({ type: 'success', text: `Material request marked as ${newStatus}.` });
      list.reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || t('common.error') });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setSubmitting(true);
    try {
      await createMaterialRequest({
        item: newItem.trim(),
        category: newCategory,
        quantity: Number(newQty) || 1,
        estimatedCost: Number(newCost) || 0,
        reason: newReason.trim()
      });
      setFeedback({ type: 'success', text: `Material request for "${newItem}" submitted successfully!` });
      setShowCreateModal(false);
      setNewItem('');
      setNewQty(1);
      setNewCost('');
      setNewReason('');
      list.reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'item',
      label: 'Item Requested',
      render: (m) => (
        <div>
          <strong style={{ fontSize: '0.95rem' }}>{m.item}</strong>
          <div style={{ marginTop: 2 }}>
            <span className="gh-badge gh-badge-plain">{m.category}</span>
          </div>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Qty & Unit Price',
      nowrap: true,
      render: (m) => (
        <div>
          <div>{m.quantity} × {formatCurrency(m.estimatedCost)}</div>
        </div>
      )
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      nowrap: true,
      render: (m) => <strong>{formatCurrency(m.totalCost)}</strong>
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (m) => (
        <div className="gh-person">
          <Avatar name={m.requestedByName} seed={m.requestedByUid} size={32} />
          <div>
            <div className="gh-person-name" style={{ fontSize: '0.88rem' }}>{m.requestedByName}</div>
            <div className="gh-person-sub">{m.requestedByEmail}</div>
          </div>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Purpose / Reason',
      render: (m) => <span className="gh-muted" style={{ fontSize: '0.85rem' }}>{m.reason || '—'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (m) => {
        if (m.status === 'fulfilled') {
          return <span className="gh-badge gh-badge-active"><CheckCircle2 size={13} style={{ marginRight: 4 }} />Fulfilled</span>;
        }
        if (m.status === 'approved') {
          return <span className="gh-badge gh-badge-pending" style={{ background: '#dcfce7', color: '#15803d' }}><CheckCircle2 size={13} style={{ marginRight: 4 }} />Approved</span>;
        }
        if (m.status === 'rejected') {
          return <span className="gh-badge gh-badge-suspended"><XCircle size={13} style={{ marginRight: 4 }} />Rejected</span>;
        }
        return <span className="gh-badge gh-badge-pending"><Clock size={13} style={{ marginRight: 4 }} />Pending Review</span>;
      }
    },
    ...(perms.editAccounts ? [{
      key: 'actions',
      label: 'Actions',
      nowrap: true,
      render: (m) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {m.status === 'pending' && (
            <>
              <button
                type="button"
                className="gh-btn gh-btn-sm"
                style={{ background: '#10b981', color: '#fff', border: 'none' }}
                onClick={() => handleUpdateStatus(m.requestId, 'approved')}
              >
                Approve
              </button>
              <button
                type="button"
                className="gh-btn gh-btn-sm"
                style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                onClick={() => handleUpdateStatus(m.requestId, 'rejected')}
              >
                Reject
              </button>
            </>
          )}
          {m.status === 'approved' && (
            <button
              type="button"
              className="gh-btn gh-btn-sm"
              style={{ background: '#3b82f6', color: '#fff', border: 'none' }}
              onClick={() => handleUpdateStatus(m.requestId, 'fulfilled')}
            >
              Fulfill Item
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  const summary = list.extra?.summary || {
    pendingCount: 0,
    approvedCount: 0,
    fulfilledCount: 0,
    totalEstimatedCost: 0
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
          placeholder="Search items, staff or purpose..."
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <label className="gh-fixed">
        <span style={srOnly}>Category</span>
        <select className="gh-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label className="gh-fixed">
        <span style={srOnly}>Status</span>
        <select className="gh-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
    </>
  );

  return (
    <section aria-labelledby="gh-materials-title">
      <div className="gh-page-head">
        <div>
          <h1 id="gh-materials-title">Material & Equipment Requests</h1>
          <p className="gh-sub">Review and fulfill resource requisitions submitted by teachers and staff.</p>
        </div>

        <button
          type="button"
          className="gh-btn gh-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={17} aria-hidden="true" />
          Submit New Request
        </button>
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
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Pending Review</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{summary.pendingCount} Requests</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Approved</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{summary.approvedCount} Items</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PackageCheck size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Fulfilled</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>{summary.fulfilledCount} Items</div>
          </div>
        </div>

        <div className="gh-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={24} />
          </div>
          <div>
            <div className="gh-muted" style={{ fontSize: '0.85rem' }}>Total Requisition Value</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7' }}>{formatCurrency(summary.totalEstimatedCost)}</div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        list={list}
        caption="Staff Material Requests"
        toolbar={toolbar}
      />

      {/* New Material Request Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="gh-card" style={{ width: 500, maxWidth: '90vw', margin: 'auto', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px' }}>Submit Material Request</h3>
            <p className="gh-sub" style={{ marginBottom: '20px' }}>Request new equipment, lab supplies or classroom resources.</p>

            <form onSubmit={handleCreateRequest}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Item Name / Description</label>
                <input
                  className="gh-input"
                  type="text"
                  placeholder="e.g. 3D Printer Filament, Microscopes..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                  <select
                    className="gh-select"
                    style={{ width: '100%' }}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Quantity</label>
                  <input
                    className="gh-input"
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Estimated Unit Cost (฿)</label>
                <input
                  className="gh-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 4500"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Purpose / Learning Unit</label>
                <textarea
                  className="gh-input"
                  rows="3"
                  placeholder="Explain how this material supports PBL coursework or activities..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  disabled={submitting || !newItem.trim()}
                >
                  {submitting ? t('common.saving') : 'Submit Request'}
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
