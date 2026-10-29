import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Edit,
  Archive,
  Image as ImageIcon,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
  Hash
} from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { Alert } from '../ui/bits.jsx';
import { subscribeLoans, retireAsset, getAsset } from './inventoryStore.js';
import { LoanDialog } from './LoanDialog.jsx';
import { AssetForm } from './AssetForm.jsx';

/**
 * Detailed view of an Equipment Asset, including photo and full loan history.
 *
 * @param {object} props
 * @param {object} [props.asset]
 * @param {string} [props.assetId] If provided, loads asset by ID
 * @param {object} props.perms
 * @param {function(): void} props.onBack
 * @param {function(object): void} [props.onEdit]
 * @param {function(): void} [props.onRefresh]
 */
export function AssetDetail({ asset: propAsset = null, assetId = null, perms, onBack, onEdit, onRefresh }) {
  const { t, locale } = useLocale();

  const [asset, setAsset] = useState(propAsset);
  const [loadingAsset, setLoadingAsset] = useState(!propAsset && Boolean(assetId));
  const [editing, setEditing] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loanModalMode, setLoanModalMode] = useState(null); // 'checkout' | 'checkin' | null
  const [actionError, setActionError] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const targetAssetId = propAsset?.id || assetId;

  // Load asset by ID if not passed directly
  const loadAssetData = async () => {
    if (!targetAssetId) return;
    try {
      const doc = await getAsset(targetAssetId);
      setAsset(doc);
    } catch (err) {
      setActionError(err.message || 'Failed to load asset');
    } finally {
      setLoadingAsset(false);
    }
  };

  useEffect(() => {
    if (propAsset) {
      setAsset(propAsset);
    } else if (targetAssetId) {
      setLoadingAsset(true);
      loadAssetData();
    }
  }, [propAsset, targetAssetId]);

  useEffect(() => {
    if (!targetAssetId) return;
    setLoadingLoans(true);
    const unsub = subscribeLoans(
      targetAssetId,
      (items) => {
        setLoans(items);
        setLoadingLoans(false);
      },
      (err) => {
        setActionError(err.message || 'Failed to load loan history');
        setLoadingLoans(false);
      }
    );
    return () => unsub();
  }, [targetAssetId]);

  const handleRetire = async () => {
    if (!window.confirm(t('inventory.retireConfirm', { name: asset.name }))) {
      return;
    }
    setRetiring(true);
    setActionError(null);
    try {
      await retireAsset(asset.id);
      onRefresh();
    } catch (err) {
      setActionError(err.message || t('common.error'));
    } finally {
      setRetiring(false);
    }
  };

  const formatCurrency = (val, curr = 'USD') => {
    if (val === null || val === undefined || val === '') return '—';
    try {
      return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
        style: 'currency',
        currency: curr || 'USD'
      }).format(val);
    } catch {
      return `${val} ${curr}`;
    }
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = typeof val.toDate === 'function' ? val.toDate() : new Date(val);
      return d.toLocaleDateString(locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(val);
    }
  };

  if (editing && asset) {
    return (
      <div className="gh-narrow" style={{ maxWidth: 820, margin: '0 auto' }}>
        <button
          type="button"
          className="gh-crumb"
          onClick={() => setEditing(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px 0' }}
        >
          <ArrowLeft size={16} aria-hidden="true" /> {asset.name}
        </button>
        <AssetForm
          asset={asset}
          onCancel={() => setEditing(false)}
          onDone={async (updatedId) => {
            setEditing(false);
            await loadAssetData();
            if (onRefresh) onRefresh();
          }}
        />
      </div>
    );
  }

  if (loadingAsset || !asset) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 0' }}>
        <button
          type="button"
          className="gh-crumb"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} aria-hidden="true" /> {t('inventory.backToList')}
        </button>
        {loadingAsset ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <span className="gh-muted">{t('common.loading')}</span>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <Alert type="error">{actionError || 'Asset not found'}</Alert>
          </div>
        )}
      </div>
    );
  }

  const isRetired = asset.status === 'retired';
  const hasAvailable = (asset.quantityAvailable || 0) > 0 && !isRetired;
  const currentLoan = asset.currentLoan;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          type="button"
          className="gh-crumb"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} aria-hidden="true" /> {t('inventory.backToList')}
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {perms.loanInventory && hasAvailable && (
            <button
              type="button"
              className="gh-btn gh-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setLoanModalMode('checkout')}
            >
              <ArrowUpRight size={16} /> {t('inventory.loan.checkOutButton')}
            </button>
          )}

          {perms.loanInventory && currentLoan && !isRetired && (
            <button
              type="button"
              className="gh-btn gh-btn-plain"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setLoanModalMode('checkin')}
            >
              <ArrowDownLeft size={16} /> {t('inventory.loan.checkInButton')}
            </button>
          )}

          {perms.editInventory && (
            <button
              type="button"
              className="gh-btn gh-btn-plain"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => (onEdit ? onEdit(asset) : setEditing(true))}
            >
              <Edit size={16} /> {t('common.edit')}
            </button>
          )}

          {perms.editInventory && !isRetired && (
            <button
              type="button"
              className="gh-btn gh-btn-plain"
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-red)' }}
              onClick={handleRetire}
              disabled={retiring}
            >
              <Archive size={16} /> {retiring ? t('common.saving') : t('inventory.retireButton')}
            </button>
          )}
        </div>
      </div>

      {actionError && <Alert type="error" text={actionError} />}

      {/* Main Asset Header Card */}
      <div className="gh-card" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Big Photo Preview */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--card-border)', background: 'var(--surface-sunken)', minHeight: 240, maxHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {asset.photo?.url ? (
              <a href={asset.photo.url} target="_blank" rel="noopener noreferrer" title="View full image">
                <img
                  src={asset.photo.url}
                  alt={asset.name}
                  style={{ width: '100%', height: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
                />
              </a>
            ) : (
              <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 30 }}>
                <ImageIcon size={48} strokeWidth={1.2} />
                <span style={{ fontSize: '0.85rem' }}>{t('inventory.noPhoto')}</span>
              </div>
            )}
          </div>

          {/* Details & Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className={`gh-badge gh-badge-${asset.status}`}>
                  {t(`inventory.status.${asset.status}`)}
                </span>
                <span className="gh-badge gh-badge-plain">
                  {t(`inventory.category.${asset.category}`)}
                </span>
                <span className="gh-badge gh-badge-plain">
                  {t(`inventory.condition.${asset.condition}`)}
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--text-light)' }}>
                {asset.name}
              </h1>
            </div>

            {/* Current Loan Active Banner */}
            {currentLoan && (
              <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--brand-purple)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-lavender)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('inventory.currentlyOnLoan')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 2 }}>
                  {currentLoan.borrowerName} ({t(`inventory.loan.${currentLoan.borrowerType}`)})
                </div>
                {currentLoan.dueDate && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('inventory.loan.dueDate')}: {formatDate(currentLoan.dueDate)}
                  </div>
                )}
              </div>
            )}

            {/* Key Field Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.quantity')}</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
                  {asset.quantityAvailable} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {asset.quantity}</span>
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.location')}</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} color="var(--brand-green)" /> {asset.location || '—'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.assetTag')}</span>
                <span style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {asset.assetTag || '—'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.serial')}</span>
                <span style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {asset.serial || '—'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.purchaseDate')}</span>
                <span style={{ fontSize: '0.9rem' }}>{formatDate(asset.purchaseDate)}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{t('inventory.purchaseValue')}</span>
                <span style={{ fontSize: '0.9rem' }}>{formatCurrency(asset.purchaseValue, asset.currency)}</span>
              </div>
            </div>

            {asset.notes && (
              <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 6, fontSize: '0.9rem', color: 'var(--text-light)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>{t('inventory.notes')}:</span>
                {asset.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loan History Timeline / Table */}
      <div className="gh-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} /> {t('inventory.loanHistory')}
        </h2>

        {loadingLoans ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>{t('common.loading')}</div>
        ) : loans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>{t('inventory.noLoanHistory')}</div>
        ) : (
          <div className="gh-table-container">
            <table className="gh-table">
              <thead>
                <tr>
                  <th>{t('inventory.loan.borrower')}</th>
                  <th>{t('inventory.quantity')}</th>
                  <th>{t('inventory.loan.outDate')}</th>
                  <th>{t('inventory.loan.dueDate')}</th>
                  <th>{t('inventory.loan.returnDate')}</th>
                  <th>{t('inventory.condition')}</th>
                  <th>{t('inventory.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => {
                  const isOpen = !l.inAt;
                  return (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.borrowerName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t(`inventory.loan.${l.borrowerType}`)}
                        </div>
                      </td>
                      <td>{l.quantity}</td>
                      <td>{formatDate(l.outAt)}</td>
                      <td>{formatDate(l.dueDate)}</td>
                      <td>
                        {isOpen ? (
                          <span className="gh-badge gh-badge-in_use" style={{ fontSize: '0.75rem' }}>
                            {t('inventory.loan.open')}
                          </span>
                        ) : (
                          formatDate(l.inAt)
                        )}
                      </td>
                      <td>
                        {l.returnCondition ? (
                          <span className="gh-badge gh-badge-plain">
                            {t(`inventory.condition.${l.returnCondition}`)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ maxWidth: 200, fontSize: '0.85rem' }}>{l.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loan Checkout / Checkin Dialog */}
      {loanModalMode && (
        <LoanDialog
          mode={loanModalMode}
          asset={asset}
          loan={currentLoan}
          onClose={() => setLoanModalMode(null)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
