import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, User, Users, AlertCircle } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Alert } from '../ui/bits.jsx';
import { checkOutAsset, checkInAsset, fetchBorrowerRoster, ASSET_CONDITIONS } from './inventoryStore.js';

/**
 * Check-Out and Check-In Dialog for Equipment Inventory.
 *
 * @param {object} props
 * @param {'checkout'|'checkin'} props.mode
 * @param {object} props.asset
 * @param {object} [props.loan] For checkin mode, the active loan being closed
 * @param {function(): void} props.onClose
 * @param {function(): void} props.onSuccess
 */
export function LoanDialog({ mode = 'checkout', asset, loan = null, onClose, onSuccess }) {
  const { t } = useLocale();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roster, setRoster] = useState({ coaches: [], classes: [] });

  // Checkout form fields
  const [borrowerType, setBorrowerType] = useState('coach');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');

  // Checkin form fields
  const [returnCondition, setReturnCondition] = useState(asset?.condition || 'good');
  const [checkinNote, setCheckinNote] = useState('');
  const [markNeedsRepair, setMarkNeedsRepair] = useState(false);

  useEffect(() => {
    if (mode === 'checkout') {
      fetchBorrowerRoster()
        .then((data) => {
          setRoster(data);
          if (data.coaches.length > 0) {
            setSelectedBorrowerId(data.coaches[0].uid);
          }
        })
        .catch((err) => {
          console.warn('[LoanDialog] Failed to fetch roster:', err);
        });
    }
  }, [mode]);

  // Adjust selection when switching borrower type
  useEffect(() => {
    if (borrowerType === 'coach' && roster.coaches.length > 0) {
      setSelectedBorrowerId(roster.coaches[0].uid);
    } else if (borrowerType === 'class' && roster.classes.length > 0) {
      setSelectedBorrowerId(roster.classes[0].id);
    }
  }, [borrowerType, roster]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'checkout') {
        const borrowerList = borrowerType === 'coach' ? roster.coaches : roster.classes;
        const selected = borrowerList.find((b) => (b.uid || b.id) === selectedBorrowerId);
        const borrowerName = selected ? (selected.name || selected.email) : 'Selected Borrower';

        await checkOutAsset(asset.id, {
          borrowerType,
          borrowerId: selectedBorrowerId,
          borrowerName,
          quantity: Number(quantity) || 1,
          dueDate: dueDate || null,
          note: checkoutNote
        });
      } else {
        const loanId = loan?.id || asset?.currentLoan?.loanId;
        if (!loanId) throw new Error('No active loan identifier found.');

        await checkInAsset(asset.id, loanId, {
          returnCondition,
          note: checkinNote,
          markNeedsRepair
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const isCheckout = mode === 'checkout';

  return (
    <Modal
      title={isCheckout ? t('inventory.loan.checkOutTitle') : t('inventory.loan.checkInTitle')}
      icon={isCheckout ? ArrowUpRight : ArrowDownLeft}
      tone={isCheckout ? 'primary' : 'success'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="gh-btn gh-btn-plain" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="loan-form"
            className={`gh-btn ${isCheckout ? 'gh-btn-primary' : 'gh-btn-primary'}`}
            disabled={loading}
          >
            {loading ? t('common.saving') : isCheckout ? t('inventory.loan.confirmCheckOut') : t('inventory.loan.confirmCheckIn')}
          </button>
        </div>
      }
    >
      <form id="loan-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert type="error" text={error} />}

        <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-light)' }}>{asset?.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {asset?.assetTag && <span style={{ marginRight: 12 }}>Tag: {asset.assetTag}</span>}
            <span>{t('inventory.quantityAvailable')}: <strong>{asset?.quantityAvailable}</strong> / {asset?.quantity}</span>
          </div>
        </div>

        {isCheckout ? (
          <>
            <div>
              <label className="gh-label">{t('inventory.loan.borrowerType')}</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className={`gh-btn ${borrowerType === 'coach' ? 'gh-btn-primary' : 'gh-btn-plain'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setBorrowerType('coach')}
                >
                  <User size={16} /> {t('inventory.loan.coach')}
                </button>
                <button
                  type="button"
                  className={`gh-btn ${borrowerType === 'class' ? 'gh-btn-primary' : 'gh-btn-plain'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => setBorrowerType('class')}
                >
                  <Users size={16} /> {t('inventory.loan.class')}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="borrower-select" className="gh-label">
                {borrowerType === 'coach' ? t('inventory.loan.selectCoach') : t('inventory.loan.selectClass')} *
              </label>
              <select
                id="borrower-select"
                className="gh-input"
                required
                value={selectedBorrowerId}
                onChange={(e) => setSelectedBorrowerId(e.target.value)}
              >
                {borrowerType === 'coach' ? (
                  roster.coaches.length > 0 ? (
                    roster.coaches.map((c) => (
                      <option key={c.uid} value={c.uid}>{c.name} ({c.email})</option>
                    ))
                  ) : (
                    <option value="">{t('common.loading')}</option>
                  )
                ) : (
                  roster.classes.length > 0 ? (
                    roster.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))
                  ) : (
                    <option value="">{t('common.loading')}</option>
                  )
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="loan-quantity" className="gh-label">{t('inventory.quantity')} *</label>
                <input
                  id="loan-quantity"
                  type="number"
                  min="1"
                  max={asset?.quantityAvailable || 1}
                  className="gh-input"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>
              <div>
                <label htmlFor="loan-duedate" className="gh-label">{t('inventory.loan.dueDate')} ({t('common.optional')})</label>
                <input
                  id="loan-duedate"
                  type="date"
                  className="gh-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="loan-notes" className="gh-label">{t('inventory.notes')}</label>
              <textarea
                id="loan-notes"
                className="gh-input"
                rows="2"
                maxLength="500"
                placeholder={t('inventory.loan.notePlaceholder')}
                value={checkoutNote}
                onChange={(e) => setCheckoutNote(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="return-condition" className="gh-label">{t('inventory.loan.returnCondition')} *</label>
              <select
                id="return-condition"
                className="gh-input"
                value={returnCondition}
                onChange={(e) => {
                  setReturnCondition(e.target.value);
                  if (e.target.value === 'poor') setMarkNeedsRepair(true);
                }}
              >
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{t(`inventory.condition.${c}`)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="mark-repair"
                checked={markNeedsRepair}
                onChange={(e) => setMarkNeedsRepair(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--brand-green)' }}
              />
              <label htmlFor="mark-repair" style={{ fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-light)' }}>
                {t('inventory.loan.markNeedsRepair')}
              </label>
            </div>

            <div>
              <label htmlFor="return-notes" className="gh-label">{t('inventory.loan.returnNotes')}</label>
              <textarea
                id="return-notes"
                className="gh-input"
                rows="2"
                maxLength="500"
                placeholder={t('inventory.loan.returnNotePlaceholder')}
                value={checkinNote}
                onChange={(e) => setCheckinNote(e.target.value)}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
