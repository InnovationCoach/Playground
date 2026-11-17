import { useState } from 'react';
import { Image as ImageIcon, Upload, X, Tag, Plus, RefreshCw, Palette } from 'lucide-react';
import { PROGRAM_CATEGORIES, PROGRAM_TONES } from './richContentModel.js';
import { uploadProgramMediaFile } from './programMediaUpload.js';

export function ProgramCoverPanel({ unit, onUpdateField }) {
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!unit) return null;

  const tags = Array.isArray(unit.tags) ? unit.tags : [];

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const res = await uploadProgramMediaFile(file, { kind: 'image' });
      onUpdateField('coverImage', res.url);
    } catch (err) {
      setUploadError(err?.message || 'Could not upload cover image.');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onUpdateField('tags', [...tags, clean]);
    }
    setTagInput('');
  };

  const removeTag = (t) => {
    onUpdateField('tags', tags.filter((x) => x !== t));
  };

  return (
    <section className="cp-card re-cover-panel" aria-label="Program Cover and Visual Customization">
      <div className="cp-card-header">
        <h3 className="cp-card-title">
          <Palette size={16} /> Program Cover & Visual Identity
        </h3>
        <span className="cp-badge-pill">
          {unit.status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      <div className="re-cover-layout">
        {/* Left: Cover Upload & Live Card Preview */}
        <div className="re-cover-preview-col">
          <div className={`re-cover-box ${unit.coverImage ? 'has-img' : ''}`} data-tone={unit.tone || 'purple'}>
            {unit.coverImage ? (
              <>
                <img src={unit.coverImage} alt={`${unit.unitTitle || 'Program'} cover`} />
                <button
                  type="button"
                  className="re-cover-clear"
                  title="Remove cover image"
                  onClick={() => onUpdateField('coverImage', '')}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="re-cover-placeholder">
                <ImageIcon size={28} aria-hidden="true" />
                <span>No cover image yet</span>
                <small>16:9 recommended (JPG, PNG, WebP)</small>
              </div>
            )}
          </div>

          <div className="re-cover-upload-controls">
            <label className="re-upload-btn">
              {uploading ? <RefreshCw size={14} className="spin" /> : <Upload size={14} />}
              <span>{uploading ? 'Uploading…' : 'Upload Cover Image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => {
                  handleCoverUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <input
              type="url"
              className="cp-input"
              value={unit.coverImage || ''}
              onChange={(e) => onUpdateField('coverImage', e.target.value)}
              placeholder="Or paste cover image URL (https://...)"
              aria-label="Cover image URL"
            />
          </div>
          {uploadError && <p className="re-warn-text" role="alert">{uploadError}</p>}

          <div className="re-tone-row">
            <span className="cp-label">Card Accent Tone</span>
            <div className="re-tone-swatches">
              {PROGRAM_TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`re-tone-btn ${unit.tone === t.id ? 'is-active' : ''}`}
                  style={{ '--swatch': t.swatch }}
                  title={t.label}
                  aria-label={`Select ${t.label} tone`}
                  onClick={() => onUpdateField('tone', t.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Title, Subtitle, Introduction, Category, Tags */}
        <div className="re-cover-fields-col">
          <div className="re-two-col">
            <div className="re-field">
              <label htmlFor="pm-program-title">Program Title</label>
              <input
                id="pm-program-title"
                type="text"
                className="cp-input"
                value={unit.unitTitle || ''}
                onChange={(e) => onUpdateField('unitTitle', e.target.value)}
                placeholder="e.g. Solar Microgrid Engineering Lab"
              />
            </div>
            <div className="re-field">
              <label htmlFor="pm-program-category">Category</label>
              <select
                id="pm-program-category"
                className="cp-input"
                value={unit.category || PROGRAM_CATEGORIES[0]}
                onChange={(e) => {
                  onUpdateField('category', e.target.value);
                  onUpdateField('theme', e.target.value);
                }}
              >
                {PROGRAM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="re-field">
            <label htmlFor="pm-program-subtitle">Subtitle</label>
            <input
              id="pm-program-subtitle"
              type="text"
              className="cp-input"
              value={unit.subtitle || ''}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
              placeholder="e.g. 8-Week Hands-On Design Thinking & Clean Energy Challenge"
            />
          </div>

          <div className="re-field">
            <label htmlFor="pm-program-intro">Program Introduction</label>
            <textarea
              id="pm-program-intro"
              className="cp-input"
              rows={3}
              value={unit.introduction || ''}
              onChange={(e) => onUpdateField('introduction', e.target.value)}
              placeholder="Write an engaging introduction explaining why this program matters and what students will create..."
            />
          </div>

          <div className="re-field">
            <label htmlFor="pm-tag-input">Tags</label>
            <div className="re-tag-input-row">
              <input
                id="pm-tag-input"
                type="text"
                className="cp-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag (e.g. robotics, climate, 3d-printing) and press Enter"
              />
              <button type="button" className="re-quick-btn" onClick={addTag}>
                <Plus size={14} /> Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="re-tags-list">
                {tags.map((t) => (
                  <span key={t} className="re-tag-chip">
                    <Tag size={11} aria-hidden="true" />
                    <span>{t}</span>
                    <button type="button" aria-label={`Remove tag ${t}`} onClick={() => removeTag(t)}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
