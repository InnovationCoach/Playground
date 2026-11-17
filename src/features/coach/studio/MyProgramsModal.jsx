import { useEffect, useState } from 'react';
import { X, FolderOpen, Edit3, Eye, Plus, RefreshCw, Layers, Clock } from 'lucide-react';
import { listCoachPrograms } from './pblTransferService.js';

export function MyProgramsModal({ isOpen, onClose, coachUid, onSelectProgram, onCreateBlank }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'draft' | 'published'

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    listCoachPrograms(coachUid)
      .then((list) => {
        if (!cancelled) setPrograms(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, coachUid]);

  if (!isOpen) return null;

  const shown = programs.filter((p) => filter === 'all' || (p.status || 'published') === filter);

  return (
    <div className="re-modal-backdrop" role="dialog" aria-modal="true" aria-label="My Programs and Drafts">
      <div className="re-modal-shell re-library-shell">
        <header className="re-preview-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FolderOpen size={18} style={{ color: 'var(--cp-purple)' }} />
            <strong style={{ fontSize: '1rem', color: 'var(--cp-heading)' }}>My Programs & Drafts</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="re-quick-btn is-active"
              onClick={() => {
                onCreateBlank();
                onClose();
              }}
            >
              <Plus size={14} /> New Blank 8-Phase Program
            </button>
            <button type="button" className="re-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="re-library-filter-bar">
          {['all', 'draft', 'published'].map((f) => (
            <button
              key={f}
              type="button"
              className={`re-quick-btn ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${programs.length})` : f === 'draft' ? `Drafts (${programs.filter((p) => p.status === 'draft').length})` : `Published (${programs.filter((p) => p.status !== 'draft').length})`}
            </button>
          ))}
        </div>

        <div className="re-library-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--cp-text-muted)' }}>
              <RefreshCw size={20} className="spin" /> Loading your programs…
            </div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--cp-text-muted)' }}>
              <p>No {filter === 'all' ? '' : filter} programs found yet.</p>
              <button
                type="button"
                className="re-quick-btn is-active"
                onClick={() => {
                  onCreateBlank();
                  onClose();
                }}
              >
                <Plus size={14} /> Create Your First 8-Phase Program
              </button>
            </div>
          ) : (
            <div className="re-library-grid">
              {shown.map((p) => {
                const isDraft = p.status === 'draft';
                const cover = p.coverImage || p.identity?.cover;
                const phaseCount = Array.isArray(p.phases) ? p.phases.length : 8;
                const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recently';
                return (
                  <div key={p.id} className="re-saved-card">
                    <div className="re-saved-cover" data-tone={p.tone || p.identity?.tone || 'purple'}>
                      {cover ? (
                        <img src={cover} alt={p.title} />
                      ) : (
                        <span>{p.category || p.theme || 'PBL'}</span>
                      )}
                      <span className={`re-status-pill ${isDraft ? 'is-draft' : 'is-published'}`}>
                        {isDraft ? 'Draft' : 'Published'}
                      </span>
                    </div>
                    <div className="re-saved-body">
                      <strong>{p.title}</strong>
                      {p.subtitle && <p className="re-saved-sub">{p.subtitle}</p>}
                      <div className="re-saved-meta">
                        <span><Layers size={12} /> {phaseCount} phases</span>
                        <span><Clock size={12} /> {updated}</span>
                      </div>
                    </div>
                    <div className="re-saved-actions">
                      <button
                        type="button"
                        className="re-quick-btn is-active"
                        onClick={() => {
                          onSelectProgram(p);
                          onClose();
                        }}
                      >
                        <Edit3 size={13} /> Open & Edit
                      </button>
                      {!isDraft && (
                        <a
                          href={`#/pbl/program/${encodeURIComponent(p.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="re-quick-btn"
                          style={{ textDecoration: 'none' }}
                        >
                          <Eye size={13} /> View Live
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
