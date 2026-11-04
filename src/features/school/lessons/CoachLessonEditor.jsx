import { useState } from 'react';
import { LearnerLessonView } from './LearnerLessonView.jsx';
import { COMPETENCY_DOMAINS, COMPETENCIES } from '../../pbl/content/competencies.js';
import { STEP_TYPES, SUBMISSION_FORMATS, emptyStep } from './lessonModel.js';
import { LearningMedia as LessonMedia } from '../media/LearningMedia.jsx';
import { MEDIA_ACCEPT, MEDIA_HINT, validateMediaFiles } from '../media/mediaSpec.js';
import {
  BookOpen,
  Award,
  CheckSquare,
  ListOrdered,
  FileCheck,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview', title: '1. Overview', icon: BookOpen },
  { id: 'competencies', title: '2. Competencies', icon: Award },
  { id: 'criteria', title: '3. Success Criteria', icon: CheckSquare },
  { id: 'steps', title: '4. Learning Steps', icon: ListOrdered },
  { id: 'evidence', title: '5. Evidence & Feedback', icon: FileCheck },
  { id: 'preview', title: '6. Preview & Publish', icon: Eye }
];

export function CoachLessonEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  choices = [],
  template,
  busy = false,
  isEdit = false,
  mediaFiles = [],
  setMediaFiles,
  uploadProgress = ''
}) {
  const [currentSection, setCurrentSection] = useState('overview');
  const [newCriterion, setNewCriterion] = useState('');

  const update = (key, value) => onChange(d => ({ ...d, [key]: value }));

  // Competency toggling
  const selectedCompIds = draft.competencyIds || [];
  function toggleCompetency(id) {
    if (selectedCompIds.includes(id)) {
      update('competencyIds', selectedCompIds.filter(c => c !== id));
    } else {
      update('competencyIds', [...selectedCompIds, id]);
    }
  }

  // Criteria management
  function addCriterion() {
    if (!newCriterion.trim()) return;
    const current = draft.successCriteria || [];
    update('successCriteria', [...current, newCriterion.trim()]);
    setNewCriterion('');
  }

  function removeCriterion(idx) {
    const current = draft.successCriteria || [];
    update('successCriteria', current.filter((_, i) => i !== idx));
  }

  // Step management
  const steps = draft.steps || [];
  function addStep() {
    const nextOrder = steps.length + 1;
    update('steps', [...steps, emptyStep(nextOrder)]);
  }

  function updateStep(idx, key, val) {
    const next = [...steps];
    next[idx] = { ...next[idx], [key]: val };
    update('steps', next);
  }

  function removeStep(idx) {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    update('steps', next);
  }

  function moveStep(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const next = [...steps];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    update('steps', next.map((s, i) => ({ ...s, order: i + 1 })));
  }

  // Validation warnings for Section 6
  const validationWarnings = [];
  if (!draft.title?.trim()) validationWarnings.push('Lesson title is required.');
  if (!draft.classId) validationWarnings.push('Assigned class is required.');
  if (!draft.outcome?.trim()) validationWarnings.push('Learning outcome is required.');
  if (steps.length === 0) validationWarnings.push('At least one learning step is required.');
  const emptyStepCount = steps.filter(s => !s.instructions?.trim()).length;
  if (emptyStepCount > 0) validationWarnings.push(`${emptyStepCount} step(s) have empty instructions.`);

  return (
    <div className="sw-coach-editor sw-card">
      <header className="sw-editor-header">
        <div className="sw-editor-titles">
          <h3>{isEdit ? 'Edit Lesson Draft' : 'Add a Lesson (Guided Coach Flow)'}</h3>
          <p className="sw-muted">Structure learning steps, link school competencies, and preview before saving.</p>
        </div>

        {/* 6-Section Stepper / Nav */}
        <nav className="sw-editor-nav" aria-label="Editor sections">
          {SECTIONS.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = currentSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`sw-editor-nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentSection(sec.id)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <form className="sw-form sw-editor-form" onSubmit={onSave}>
        {/* SECTION 1: OVERVIEW */}
        {currentSection === 'overview' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Overview</legend>
            <div className="sw-field">
              <label>Lesson title *</label>
              <input
                required
                maxLength={200}
                placeholder="e.g. Hex-City Thailand: Design a resilient floating city"
                value={draft.title || ''}
                onChange={e => update('title', e.target.value)}
              />
            </div>

            <div className="sw-field-row">
              <div className="sw-field">
                <label>Assigned class *</label>
                <select
                  required
                  value={draft.classId || ''}
                  onChange={e => update('classId', e.target.value)}
                >
                  <option value="">Choose a class</option>
                  {choices.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="sw-field">
                <label>Program milestone *</label>
                <select
                  value={draft.milestoneId || template.milestones[0]?.id}
                  onChange={e => update('milestoneId', e.target.value)}
                >
                  {template.milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="sw-field">
                <label>Estimated effort (minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  value={draft.estimatedMinutes || 45}
                  onChange={e => update('estimatedMinutes', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="sw-field">
              <label>Learning outcome / purpose *</label>
              <textarea
                required
                rows={3}
                maxLength={1000}
                placeholder="What will learners understand or be able to do by the end of this lesson?"
                value={draft.outcome || ''}
                onChange={e => update('outcome', e.target.value)}
              />
            </div>

            <div className="sw-field">
              <label>Prerequisites / Prior knowledge (Optional)</label>
              <input
                maxLength={500}
                placeholder="e.g. Basic understanding of energy conversion; scale model rulers"
                value={draft.prerequisites || ''}
                onChange={e => update('prerequisites', e.target.value)}
              />
            </div>
            <div className="sw-field">
              <label htmlFor="lesson-prerequisite-competencies">Competencies needed before this lesson</label>
              <p className="sw-muted">Select the achievements needed for pathway suggestions. Free-text prior knowledge alone is not used to decide readiness. Advanced lessons need explicit competency prerequisites.</p>
              <select id="lesson-prerequisite-competencies" multiple size={6}
                value={draft.prerequisiteCompetencyIds || []}
                onChange={e => update('prerequisiteCompetencyIds', [...e.target.selectedOptions].map(o => o.value))}>
                {COMPETENCIES.filter(c => !selectedCompIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.title} · {c.id}</option>)}
              </select>
            </div>
          </fieldset>
        )}

        {/* SECTION 2: COMPETENCIES */}
        {currentSection === 'competencies' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Competencies</legend>
            <p className="sw-field-intro">
              Select competencies from the approved WeLearn Academy framework that this lesson introduces, practices, or assesses.
            </p>

            {selectedCompIds.length > 0 && (
              <div className="sw-selected-comps">
                <strong>Selected competencies ({selectedCompIds.length}):</strong>
                <div className="sw-selected-chips">
                  {selectedCompIds.map(id => {
                    const c = COMPETENCIES.find(item => item.id === id);
                    return (
                      <span key={id} className="sw-comp-chip active">
                        <strong>{c?.code || id}</strong> {c?.title || id}
                        <button type="button" onClick={() => toggleCompetency(id)} aria-label={`Remove ${id}`}>×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sw-domains-accordion">
              {COMPETENCY_DOMAINS.map(domain => {
                const domainComps = COMPETENCIES.filter(c => c.domain === domain.id);
                return (
                  <details key={domain.id} className="sw-domain-group">
                    <summary>
                      <strong>{domain.title}</strong> ({domainComps.length} competencies)
                    </summary>
                    <div className="sw-domain-comps-grid">
                      {domainComps.map(c => {
                        const isSelected = selectedCompIds.includes(c.id);
                        return (
                          <label key={c.id} className={`sw-comp-picker-item ${isSelected ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCompetency(c.id)}
                            />
                            <div>
                              <div className="sw-comp-picker-head">
                                <span className="sw-badge">{c.code || c.id}</span>
                                <strong>{c.title}</strong>
                              </div>
                              <p>{c.statement}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* SECTION 3: SUCCESS CRITERIA */}
        {currentSection === 'criteria' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Success criteria</legend>
            <p className="sw-field-intro">
              Observable evidence for each competency. Learners will see this checklist under "How will I know I have mastered it?".
            </p>

            <div className="sw-criteria-input-row">
              <input
                placeholder="e.g. Can calculate energy balance using the simulation model"
                value={newCriterion}
                onChange={e => setNewCriterion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCriterion(); } }}
              />
              <button type="button" className="gh-btn" onClick={addCriterion}>
                <Plus size={15} /> Add criterion
              </button>
            </div>

            <ul className="sw-criteria-list">
              {(draft.successCriteria || []).map((crit, idx) => (
                <li key={idx} className="sw-criteria-item">
                  <CheckCircle2 size={16} className="sw-crit-icon" />
                  <span>{crit}</span>
                  <button type="button" className="sw-btn-icon" onClick={() => removeCriterion(idx)} aria-label="Remove criterion">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
              {(!draft.successCriteria || draft.successCriteria.length === 0) && (
                <li className="sw-empty-hint">No criteria added yet. Add observable success points above.</li>
              )}
            </ul>
          </fieldset>
        )}

        {/* SECTION 4: LEARNING STEPS BUILDER */}
        {currentSection === 'steps' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Learning steps</legend>
            <div className="sw-steps-header">
              <p className="sw-field-intro">
                Break the lesson into ordered blocks: Introduction, Resources, Core Tasks, Practice, Reflection, or Submission.
              </p>
              <button type="button" className="gh-btn" onClick={addStep}>
                <Plus size={15} /> Add step
              </button>
            </div>

            <div className="sw-steps-builder-list">
              {steps.map((step, idx) => (
                <article key={step.id || idx} className="sw-step-edit-card">
                  <div className="sw-step-edit-top">
                    <span className="sw-seq-badge">#{idx + 1}</span>
                    <select
                      value={step.type || 'task'}
                      onChange={e => updateStep(idx, 'type', e.target.value)}
                      className="sw-step-type-select"
                    >
                      {STEP_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>

                    <input
                      required
                      placeholder="Step title (e.g. Choose team role)"
                      value={step.title || ''}
                      onChange={e => updateStep(idx, 'title', e.target.value)}
                      className="sw-step-title-input"
                    />

                    <div className="sw-step-duration-box">
                      <Clock size={13} />
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={step.durationMinutes || 15}
                        onChange={e => updateStep(idx, 'durationMinutes', Number(e.target.value))}
                        title="Estimated minutes"
                      />
                      <span>m</span>
                    </div>

                    <div className="sw-step-order-btns">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, -1)}
                        title="Move step up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === steps.length - 1}
                        onClick={() => moveStep(idx, 1)}
                        title="Move step down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={steps.length <= 1}
                        onClick={() => removeStep(idx)}
                        title="Delete step"
                        className="sw-delete-btn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="sw-step-edit-body">
                    <textarea
                      required
                      rows={3}
                      maxLength={5000}
                      placeholder="Specific action for the learner: What to read, build, calculate, or discuss..."
                      value={step.instructions || ''}
                      onChange={e => updateStep(idx, 'instructions', e.target.value)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </fieldset>
        )}

        {/* SECTION 5: EVIDENCE & FEEDBACK */}
        {currentSection === 'evidence' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Evidence & feedback</legend>
            <div className="sw-field-row">
              <div className="sw-field">
                <label>Submission mode</label>
                <select
                  value={draft.evidenceSpec?.type || 'individual'}
                  onChange={e => update('evidenceSpec', { ...draft.evidenceSpec, type: e.target.value })}
                >
                  <option value="individual">Individual Submission</option>
                  <option value="team">Team Project (Team artifact + individual reflection)</option>
                </select>
              </div>

              <div className="sw-field">
                <label>Review policy</label>
                <select
                  value={draft.evidenceSpec?.completionRule || 'rubric'}
                  onChange={e => update('evidenceSpec', { ...draft.evidenceSpec, completionRule: e.target.value })}
                >
                  <option value="rubric">Rubric evaluation (Competency mastery)</option>
                  <option value="completion">Completion check (Task finished)</option>
                </select>
              </div>
            </div>

            {/* Media attachments */}
            <div className="sw-field">
              <label>Posters, videos, and presentation slides (Max 100 MB per file)</label>
              <input
                type="file"
                multiple
                accept={MEDIA_ACCEPT}
                disabled={busy}
                onChange={e => {
                  const chosen = Array.from(e.target.files || []);
                  try {
                    validateMediaFiles(chosen, draft.attachments?.length || 0);
                    setMediaFiles?.(chosen);
                  } catch (err) {
                    alert(err.message);
                    e.target.value = '';
                  }
                }}
              />
              <small>{MEDIA_HINT}</small>
              {mediaFiles.length > 0 && <p className="sw-muted">{mediaFiles.map(f => f.name).join(', ')}</p>}
              {uploadProgress && <p role="status">{uploadProgress}</p>}
              <LessonMedia attachments={draft.attachments} />
              {draft.attachments?.map(a => (
                <button
                  key={a.path}
                  type="button"
                  disabled={busy}
                  className="gh-btn gh-btn-ghost gh-btn-small"
                  onClick={() => update('attachments', draft.attachments.filter(item => item.path !== a.path))}
                >
                  Remove {a.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* SECTION 6: PREVIEW & PUBLISH */}
        {currentSection === 'preview' && (
          <fieldset className="sw-section-pane">
            <legend className="sw-sr">Preview & publish</legend>
            <div className="sw-preview-banner">
              <strong>Learner Experience Preview</strong>
              <p className="sw-muted">This is how enrolled students will experience this lesson.</p>
            </div>

            {validationWarnings.length > 0 && (
              <div className="sw-warning-callout" role="alert">
                <AlertCircle size={16} />
                <div>
                  <strong>Please address before publishing:</strong>
                  <ul>
                    {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <div className="sw-preview-container">
              <LearnerLessonView lesson={draft} template={template} />
            </div>
          </fieldset>
        )}

        {/* PERSISTENT ACTIONS BAR */}
        <div className="sw-editor-actions-bar">
          <div className="sw-actions-left">
            <button
              type="button"
              className="gh-btn gh-btn-ghost"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel edit
            </button>
          </div>

          <div className="sw-actions-right">
            {currentSection !== 'preview' ? (
              <button
                type="button"
                className="gh-btn gh-btn-ghost"
                onClick={() => {
                  const currIdx = SECTIONS.findIndex(s => s.id === currentSection);
                  if (currIdx < SECTIONS.length - 1) setCurrentSection(SECTIONS[currIdx + 1].id);
                }}
              >
                Next section →
              </button>
            ) : null}

            <button
              type="submit"
              className="gh-btn gh-btn-primary"
              disabled={busy || !draft.classId || !draft.title}
            >
              {busy ? 'Saving draft…' : isEdit ? 'Save draft changes' : 'Save lesson draft'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
