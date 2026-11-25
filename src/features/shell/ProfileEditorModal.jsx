import { useEffect, useState } from 'react';
import { Dices, X } from 'lucide-react';
import { saveUserProfile } from '../../auth.js';
import { Avatar } from './Avatar.jsx';
import {
  AVATAR_ACCESSORIES,
  AVATAR_BG_THEMES,
  AVATAR_CHARACTERS,
  AVATAR_EYES,
  AVATAR_HATS,
  AVATAR_ICONS,
  AVATAR_PATTERNS,
  AVATAR_RINGS,
  DEFAULT_AVATAR_CONFIG,
  MAX_DISPLAY_NAME,
  randomAvatarConfig,
  sanitizeAvatarConfig,
  sanitizeDisplayName
} from './avatarModel.js';
import './profileEditor.css';

function ChipGroup({ label, items, value, onChange, renderLead }) {
  return (
    <div className="pe-group">
      <span className="pe-group-label">{label}</span>
      <div className="pe-chips">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pe-chip"
            aria-pressed={value === item.id}
            onClick={() => onChange(item.id)}
          >
            {renderLead?.(item)}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Creative Profile & Avatar Studio modal: lets learners edit their display name
 * and design a custom Character SVG, Icon Badge, or Pattern Monogram avatar.
 */
export function ProfileEditorModal({ uid, initialName = '', initialAvatar = null, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(() => initialName || '');
  const [draft, setDraft] = useState(() => sanitizeAvatarConfig(initialAvatar) || { ...DEFAULT_AVATAR_CONFIG });
  const [useInitialsOnly, setUseInitialsOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const activeAvatar = useInitialsOnly ? null : draft;
  const previewName = sanitizeDisplayName(displayName) || initialName || 'Learner';

  const setField = (key, val) => {
    setUseInitialsOnly(false);
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  async function handleSave(e) {
    e.preventDefault();
    const clean = sanitizeDisplayName(displayName);
    if (!clean) {
      setError('Please enter a name for your profile.');
      return;
    }
    if (!uid) return;
    setSaving(true);
    setError('');
    try {
      await saveUserProfile(uid, { displayName: clean, avatar: activeAvatar });
      await onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Could not save your profile right now.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="pe-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pe-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <form className="pe-modal" onSubmit={handleSave}>
        <div className="pe-header">
          <h2 id="pe-title">Edit Profile &amp; Avatar</h2>
          <button type="button" className="pe-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="pe-body">
          <div className="pe-preview-card">
            <div className="pe-preview-left">
              <Avatar name={previewName} seed={uid} size={64} avatar={activeAvatar} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gh-text-3, #64748b)', marginBottom: 4 }}>
                  Profile Preview
                </div>
                <div className="pe-pill-preview">
                  <Avatar name={previewName} seed={uid} size={26} avatar={activeAvatar} />
                  <span>{previewName}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="pe-surprise-btn"
              onClick={() => {
                setUseInitialsOnly(false);
                setDraft(randomAvatarConfig(draft.mode));
              }}
            >
              <Dices size={16} aria-hidden="true" />
              Surprise Me!
            </button>
          </div>

          <div className="pe-field">
            <label htmlFor="pe-display-name">Your Profile Name</label>
            <input
              id="pe-display-name"
              type="text"
              maxLength={MAX_DISPLAY_NAME}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name or nickname"
            />
          </div>

          <div className="pe-tabs" role="tablist" aria-label="Avatar style">
            <button
              type="button"
              role="tab"
              className="pe-tab"
              aria-selected={!useInitialsOnly && draft.mode === 'character'}
              onClick={() => setField('mode', 'character')}
            >
              🎭 Character
            </button>
            <button
              type="button"
              role="tab"
              className="pe-tab"
              aria-selected={!useInitialsOnly && draft.mode === 'icon'}
              onClick={() => setField('mode', 'icon')}
            >
              ✨ Icons
            </button>
            <button
              type="button"
              role="tab"
              className="pe-tab"
              aria-selected={!useInitialsOnly && draft.mode === 'monogram'}
              onClick={() => setField('mode', 'monogram')}
            >
              🎨 Monogram
            </button>
          </div>

          {draft.mode === 'character' && (
            <>
              <ChipGroup
                label="Character"
                items={AVATAR_CHARACTERS}
                value={draft.character}
                onChange={(v) => setField('character', v)}
                renderLead={(c) => <span className="pe-swatch" style={{ background: c.color }} />}
              />
              <ChipGroup label="Expression" items={AVATAR_EYES} value={draft.eyes} onChange={(v) => setField('eyes', v)} />
              <ChipGroup label="Headgear" items={AVATAR_HATS} value={draft.hat} onChange={(v) => setField('hat', v)} />
              <ChipGroup
                label="Flair"
                items={AVATAR_ACCESSORIES}
                value={draft.accessory}
                onChange={(v) => setField('accessory', v)}
                renderLead={(a) => (a.glyph ? <span>{a.glyph}</span> : null)}
              />
            </>
          )}

          {draft.mode === 'icon' && (
            <div className="pe-group">
              <span className="pe-group-label">Choose an Icon</span>
              <div className="pe-icon-grid">
                {AVATAR_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    className="pe-icon-btn"
                    aria-pressed={!useInitialsOnly && draft.icon === icon.id}
                    onClick={() => setField('icon', icon.id)}
                  >
                    <span>{icon.glyph}</span>
                    <span>{icon.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {draft.mode === 'monogram' && (
            <ChipGroup
              label="Pattern"
              items={AVATAR_PATTERNS}
              value={draft.pattern}
              onChange={(v) => setField('pattern', v)}
            />
          )}

          <ChipGroup
            label="Color Theme"
            items={AVATAR_BG_THEMES}
            value={draft.bg}
            onChange={(v) => setField('bg', v)}
            renderLead={(t) => (
              <span className="pe-swatch" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
            )}
          />

          <ChipGroup
            label="Outer Ring"
            items={AVATAR_RINGS}
            value={draft.ring}
            onChange={(v) => setField('ring', v)}
          />

          {error && <p className="pe-error" role="alert">{error}</p>}
        </div>

        <div className="pe-footer">
          <button
            type="button"
            className="pe-btn-ghost"
            disabled={saving}
            onClick={() => setUseInitialsOnly(true)}
          >
            Classic Initials
          </button>
          <div className="pe-footer-actions">
            <button type="button" className="pe-btn-ghost" disabled={saving} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pe-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
