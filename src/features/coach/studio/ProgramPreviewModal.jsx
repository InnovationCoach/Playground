import { useState } from 'react';
import { X, Eye, Compass, Layers, CheckCircle2, Wrench, Target, Clock } from 'lucide-react';
import { RichContentRenderer } from '../../pbl/programs/RichContentRenderer.jsx';

export function ProgramPreviewModal({ isOpen, onClose, unit, initialPhaseIndex = 0 }) {
  const [activeIdx, setActiveIdx] = useState(initialPhaseIndex);

  if (!isOpen || !unit) return null;

  const milestones = Array.isArray(unit.milestones) ? unit.milestones : [];
  const safeIdx = Math.min(activeIdx, Math.max(0, milestones.length - 1));
  const phase = milestones[safeIdx];

  return (
    <div className="re-modal-backdrop" role="dialog" aria-modal="true" aria-label="Student Program Preview">
      <div className="re-modal-shell re-preview-shell">
        {/* Top Preview Banner */}
        <header className="re-preview-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="re-preview-badge">
              <Eye size={14} aria-hidden="true" /> Student Experience Preview
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--cp-text-muted)' }}>
              {unit.status === 'published' ? 'Published view' : 'Draft preview — not yet visible to students'}
            </span>
          </div>
          <button type="button" className="re-modal-close" onClick={onClose} aria-label="Close preview">
            <X size={18} /> Close Preview
          </button>
        </header>

        <div className="re-preview-scroll">
          {/* Hero */}
          <section className="re-preview-hero" data-tone={unit.tone || 'purple'}>
            <div className="re-preview-hero-main">
              <div className="re-preview-kicker">
                <Compass size={14} aria-hidden="true" />
                <span>{unit.category || unit.theme || 'Learning Program'}</span>
                <span>·</span>
                <span>{milestones.length} Phases</span>
              </div>
              <h1>{unit.unitTitle || 'Untitled Learning Program'}</h1>
              {unit.subtitle && <p className="re-preview-subtitle">{unit.subtitle}</p>}
              {unit.drivingQuestion && (
                <div className="re-preview-dq">
                  <strong>Driving Question:</strong> “{unit.drivingQuestion}”
                </div>
              )}
              {unit.introduction && (
                <p className="re-preview-intro">{unit.introduction}</p>
              )}
              {Array.isArray(unit.tags) && unit.tags.length > 0 && (
                <div className="re-preview-tags">
                  {unit.tags.map((t) => (
                    <span key={t} className="re-preview-tag">#{t}</span>
                  ))}
                </div>
              )}
            </div>
            {unit.coverImage && (
              <div className="re-preview-cover">
                <img src={unit.coverImage} alt={`${unit.unitTitle || 'Program'} cover`} />
              </div>
            )}
          </section>

          {/* 8-Phase Navigation */}
          <nav className="re-preview-phases-nav" aria-label="Program Phases">
            {milestones.map((m, idx) => (
              <button
                key={m.id || idx}
                type="button"
                className={`re-preview-phase-tab ${safeIdx === idx ? 'is-active' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                <span className="re-preview-phase-num">{m.stageNumber || idx + 1}</span>
                <span className="re-preview-phase-info">
                  <strong>{m.title || `Phase ${idx + 1}`}</strong>
                  <small>Week {m.week || idx + 1} · {(m.contentBlocks || []).length} blocks</small>
                </span>
              </button>
            ))}
          </nav>

          {/* Active Phase Content */}
          {phase && (
            <article className="re-preview-phase-body">
              <div className="re-preview-phase-head">
                <div>
                  <span className="re-preview-phase-kicker">
                    <Layers size={13} aria-hidden="true" /> Stage {phase.stageNumber || safeIdx + 1} · {phase.stageName || 'Phase'}
                  </span>
                  <h2>{phase.title || `Phase ${safeIdx + 1}`}</h2>
                </div>
                <span className="re-preview-time-pill">
                  <Clock size={13} aria-hidden="true" /> Week {phase.week || safeIdx + 1} · {phase.durationMin || 90} min
                </span>
              </div>

              {phase.learningGoal && (
                <p className="re-preview-goal">{phase.learningGoal}</p>
              )}

              {/* Rich Content Blocks */}
              <RichContentRenderer blocks={phase.contentBlocks || []} />

              {/* Legacy/Structured Activities & Evidence */}
              {(Array.isArray(phase.activities) && phase.activities.length > 0) && (
                <div className="re-preview-structured-box">
                  <h3><CheckCircle2 size={15} aria-hidden="true" /> Key Milestone Tasks</h3>
                  <ul>
                    {phase.activities.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}

              {(Array.isArray(phase.makerSpaceTools) && phase.makerSpaceTools.length > 0) && (
                <div className="re-preview-tools-row">
                  <Wrench size={14} aria-hidden="true" />
                  <span>Tools:</span>
                  {phase.makerSpaceTools.map((tool, i) => (
                    <span key={i} className="rc-chip">{tool}</span>
                  ))}
                </div>
              )}

              {phase.evidencePrompt && (
                <div className="re-preview-evidence">
                  <Target size={15} aria-hidden="true" />
                  <span><strong>Evidence to Submit:</strong> {phase.evidencePrompt}</span>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
