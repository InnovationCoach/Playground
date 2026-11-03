import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, ArrowLeft, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { Alert } from '../ui/bits.jsx';
import {
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  createAsset,
  updateAsset
} from './inventoryStore.js';
import { compressAssetPhoto } from './imageCompress.js';

/**
 * Add / Edit Form for Equipment Assets.
 *
 * @param {object} props
 * @param {object} [props.asset] If provided, editing existing asset; otherwise creating
 * @param {function(): void} props.onCancel
 * @param {function(string): void} props.onDone Called with asset ID after save
 */
export function AssetForm({ asset = null, onCancel, onDone }) {
  const { t } = useLocale();
  const isEdit = Boolean(asset);

  // Form fields
  const [name, setName] = useState(asset?.name || '');
  const [category, setCategory] = useState(asset?.category || 'electronics');
  const [quantity, setQuantity] = useState(asset?.quantity || 1);
  const [assetTag, setAssetTag] = useState(asset?.assetTag || '');
  const [serial, setSerial] = useState(asset?.serial || '');
  const [location, setLocation] = useState(asset?.location || 'Maker Lab');
  const [condition, setCondition] = useState(asset?.condition || 'good');
  const [status, setStatus] = useState(asset?.status || 'available');
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '');
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue !== null && asset?.purchaseValue !== undefined ? asset.purchaseValue : '');
  const [currency, setCurrency] = useState(asset?.currency || 'USD');
  const [notes, setNotes] = useState(asset?.notes || '');

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(asset?.photo?.url || null);
  const [compressedMeta, setCompressedMeta] = useState(asset?.photo ? { bytes: asset.photo.bytes, width: asset.photo.width, height: asset.photo.height } : null);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successFlash, setSuccessFlash] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelected = async (file) => {
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const result = await compressAssetPhoto(file);
      setPhotoFile(file);
      setCompressedMeta({
        bytes: result.bytes,
        width: result.width,
        height: result.height
      });
      const previewUrl = URL.createObjectURL(result.blob);
      setPhotoPreview(previewUrl);
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setCompressing(false);
    }
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCompressedMeta(null);
  };

  const handleSubmit = async (saveAndAddAnother = false) => {
    if (!name.trim()) {
      setError(t('inventory.form.nameRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    const assetData = {
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      assetTag: assetTag.trim() || null,
      serial: serial.trim() || null,
      location: location.trim() || 'General Storage',
      condition,
      status,
      purchaseDate: purchaseDate || null,
      purchaseValue: purchaseValue !== '' ? Number(purchaseValue) : null,
      currency: currency.trim() || 'USD',
      notes: notes.trim()
    };

    try {
      let savedId;
      if (isEdit) {
        await updateAsset(asset.id, asset, assetData, photoFile, (pct) => setUploadProgress(pct));
        savedId = asset.id;
      } else {
        savedId = await createAsset(assetData, photoFile, (pct) => setUploadProgress(pct));
      }

      if (saveAndAddAnother) {
        setSuccessFlash(t('inventory.form.savedSuccessAddAnother', { name: assetData.name }));
        setName('');
        setAssetTag('');
        setSerial('');
        setNotes('');
        setPurchaseDate('');
        setPurchaseValue('');
        handleClearPhoto();
        setUploadProgress(null);
        setTimeout(() => setSuccessFlash(null), 4000);
      } else {
        onDone(savedId);
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="gh-inventory-form-container" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button type="button" className="gh-crumb" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={16} aria-hidden="true" /> {t('common.back')}
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
          {isEdit ? t('inventory.form.editTitle') : t('inventory.form.newTitle')}
        </h1>
        <div style={{ width: 60 }} />
      </div>

      {error && <Alert type="error" text={error} style={{ marginBottom: 16 }} />}
      {successFlash && <Alert type="success" text={successFlash} style={{ marginBottom: 16 }} />}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="gh-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Photo Section (Tablet-first at top) */}
        <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: 20 }}>
          <label className="gh-label" style={{ marginBottom: 8, display: 'block' }}>
            {t('inventory.photo')} ({t('common.optional')})
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {photoPreview ? (
              <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--card-border)', background: 'var(--surface-sunken)' }}>
                <img
                  src={photoPreview}
                  alt="Asset Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  title={t('common.delete')}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: 8, border: '2px dashed var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <ImageIcon size={32} strokeWidth={1.5} />
                <span style={{ fontSize: '0.75rem', marginTop: 4 }}>{t('inventory.noPhoto')}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Take Photo button */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="gh-btn gh-btn-plain"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={compressing || submitting}
                >
                  <Camera size={16} /> {t('inventory.takePhoto')}
                </button>

                {/* Choose File button */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="gh-btn gh-btn-plain"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing || submitting}
                >
                  <Upload size={16} /> {t('inventory.chooseFile')}
                </button>
              </div>

              {compressing && (
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} className="gh-spin" /> {t('inventory.compressingImage')}
                </div>
              )}

              {compressedMeta && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  JPEG {compressedMeta.width}×{compressedMeta.height} px • {formatFileSize(compressedMeta.bytes)}
                </div>
              )}

              {uploadProgress !== null && uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ width: '100%', height: 6, background: 'var(--surface-sunken)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--brand-green)', transition: 'width 0.2s ease' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="asset-name" className="gh-label">{t('inventory.name')} *</label>
            <input
              id="asset-name"
              type="text"
              required
              maxLength="120"
              className="gh-input"
              placeholder={t('inventory.form.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="asset-category" className="gh-label">{t('inventory.category')} *</label>
            <select
              id="asset-category"
              className="gh-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{t(`inventory.category.${cat}`)}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="asset-quantity" className="gh-label">{t('inventory.quantity')} *</label>
            <input
              id="asset-quantity"
              type="number"
              min="1"
              required
              className="gh-input"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>

          {/* Asset Tag */}
          <div>
            <label htmlFor="asset-tag" className="gh-label">{t('inventory.assetTag')}</label>
            <input
              id="asset-tag"
              type="text"
              maxLength="40"
              className="gh-input"
              placeholder="e.g. WL-ROB-0042"
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
            />
          </div>

          {/* Serial Number */}
          <div>
            <label htmlFor="asset-serial" className="gh-label">{t('inventory.serial')}</label>
            <input
              id="asset-serial"
              type="text"
              maxLength="80"
              className="gh-input"
              placeholder="e.g. SN12345678"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="asset-location" className="gh-label">{t('inventory.location')} *</label>
            <input
              id="asset-location"
              type="text"
              maxLength="80"
              required
              className="gh-input"
              placeholder="e.g. Maker Lab Shelf 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Condition */}
          <div>
            <label htmlFor="asset-condition" className="gh-label">{t('inventory.condition')}</label>
            <select
              id="asset-condition"
              className="gh-input"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {ASSET_CONDITIONS.map((c) => (
                <option key={c} value={c}>{t(`inventory.condition.${c}`)}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="asset-status" className="gh-label">{t('inventory.status')}</label>
            <select
              id="asset-status"
              className="gh-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`inventory.status.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* Purchase Date */}
          <div>
            <label htmlFor="asset-pdate" className="gh-label">{t('inventory.purchaseDate')}</label>
            <input
              id="asset-pdate"
              type="date"
              className="gh-input"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          {/* Purchase Value & Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
            <div>
              <label htmlFor="asset-pvalue" className="gh-label">{t('inventory.purchaseValue')}</label>
              <input
                id="asset-pvalue"
                type="number"
                step="0.01"
                min="0"
                className="gh-input"
                placeholder="0.00"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="asset-curr" className="gh-label">{t('inventory.currency')}</label>
              <input
                id="asset-curr"
                type="text"
                maxLength="5"
                className="gh-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="asset-notes" className="gh-label">{t('inventory.notes')}</label>
          <textarea
            id="asset-notes"
            className="gh-input"
            rows="3"
            maxLength="500"
            placeholder={t('inventory.form.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {notes.length}/500
          </div>
        </div>

        {/* Form Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: 20 }}>
          <button
            type="button"
            className="gh-btn gh-btn-plain"
            onClick={onCancel}
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>

          {!isEdit && (
            <button
              type="button"
              className="gh-btn gh-btn-plain"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              {t('inventory.form.saveAndAddAnother')}
            </button>
          )}

          <button
            type="submit"
            className="gh-btn gh-btn-primary"
            disabled={submitting}
          >
            {submitting ? t('common.saving') : isEdit ? t('common.save') : t('inventory.form.createButton')}
          </button>
        </div>
      </form>
    </div>
  );
}
