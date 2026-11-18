import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Check, AlertCircle, Info, ChevronDown, ChevronRight, Award } from 'lucide-react';
import { COMPETENCY_DOMAINS, COMPETENCIES, competencyById } from '../../pbl/content/competencies.js';
import { VALID_COHORTS, findInvalidCompetencyIds } from './courseAlignmentValidator.js';

export function CourseBasicsStep({ course, onChange }) {
  const [domainFilter, setDomainFilter] = useState('all');
  const [compSearch, setCompSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedCompetencyIds = course.competencies || [];
  const invalidCompetencyIds = useMemo(() => findInvalidCompetencyIds(selectedCompetencyIds), [selectedCompetencyIds]);

  const toggleCompetency = (id) => {
    const next = selectedCompetencyIds.includes(id)
      ? selectedCompetencyIds.filter((x) => x !== id)
      : [...selectedCompetencyIds, id];
    onChange({ competencies: next });
  };

  const filteredCompetencies = useMemo(() => {
    let list = COMPETENCIES;
    if (domainFilter !== 'all') {
      list = list.filter((c) => c.domain === domainFilter);
    }
    const q = compSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.statement.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [domainFilter, compSearch]);

  const objectives = Array.isArray(course.objectives) && course.objectives.length > 0
    ? course.objectives
    : [''];

  const updateObjective = (idx, value) => {
    const next = [...objectives];
    next[idx] = value;
    onChange({ objectives: next });
  };

  const addObjective = () => {
    onChange({ objectives: [...objectives, ''] });
  };

  const removeObjective = (idx) => {
    const next = objectives.filter((_, i) => i !== idx);
    onChange({ objectives: next.length > 0 ? next : [''] });
  };

  return (
    <div className="cm-step cm-step-basics">
      <div className="cm-section-head">
        <h2 className="cm-section-title">Step 1 — Course Basics</h2>
        <p className="cm-section-desc">
          Define core course parameters and align directly with the school’s official Competency Framework.
        </p>
      </div>

      <div className="cm-form-grid">
        {/* Title */}
        <div className="cm-field cm-field-full">
          <label htmlFor="course-title" className="cm-label">
            Course Title <span className="cm-req">*</span>
          </label>
          <input
            id="course-title"
            type="text"
            className="cm-input"
            placeholder="e.g. EcoCool: Smart Urban Heat & Community Garden Monitor"
            value={course.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={120}
          />
          <span className="cm-hint">A clear, descriptive title for coaches and learners (max 120 chars).</span>
        </div>

        {/* Cohort / Age level */}
        <div className="cm-field">
          <label htmlFor="course-cohort" className="cm-label">
            Target Learner Level / Age Band <span className="cm-req">*</span>
          </label>
          <select
            id="course-cohort"
            className="cm-select"
            value={course.cohort || 'lower-secondary'}
            onChange={(e) => {
              const cohort = e.target.value;
              const found = VALID_COHORTS.find((c) => c.id === cohort);
              onChange({ cohort, ageBand: found ? found.ageBand : '11-13' });
            }}
          >
            {VALID_COHORTS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="cm-field">
          <label htmlFor="course-duration" className="cm-label">
            Duration (Weeks) <span className="cm-req">*</span>
          </label>
          <input
            id="course-duration"
            type="number"
            min="1"
            max="36"
            className="cm-input"
            value={course.durationWeeks || 12}
            onChange={(e) => onChange({ durationWeeks: Math.max(1, parseInt(e.target.value, 10) || 12) })}
          />
        </div>
      </div>

      {/* Advanced / Optional settings toggle */}
      <div className="cm-optional-block">
        <button
          type="button"
          className="cm-optional-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Optional details (Theme & Driving Question)
        </button>

        {showAdvanced && (
          <div className="cm-optional-content">
            <div className="cm-field">
              <label htmlFor="course-theme" className="cm-label">Theme / Subject Area</label>
              <input
                id="course-theme"
                type="text"
                className="cm-input"
                placeholder="e.g. Climate & Urban Resilience"
                value={course.theme || ''}
                onChange={(e) => onChange({ theme: e.target.value })}
              />
            </div>
            <div className="cm-field">
              <label htmlFor="course-driving-q" className="cm-label">Driving Question</label>
              <textarea
                id="course-driving-q"
                className="cm-textarea"
                rows={2}
                placeholder="e.g. How might we use smart IoT sensors to combat urban heat islands in community gardens?"
                value={course.drivingQuestion || ''}
                onChange={(e) => onChange({ drivingQuestion: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Learning Objectives */}
      <div className="cm-section-block">
        <div className="cm-block-head">
          <h3 className="cm-block-title">Learning Objectives <span className="cm-req">*</span></h3>
          <span className="cm-badge">{objectives.filter(Boolean).length} defined</span>
        </div>
        <p className="cm-hint">State what learners will understand, demonstrate, or produce during this course.</p>

        <div className="cm-objectives-list">
          {objectives.map((obj, i) => (
            <div key={i} className="cm-obj-row">
              <span className="cm-obj-num">{i + 1}</span>
              <input
                type="text"
                className="cm-input cm-obj-input"
                placeholder={`Objective ${i + 1} (e.g. Investigate microclimate thermodynamics through sensor telemetry)`}
                value={obj}
                onChange={(e) => updateObjective(i, e.target.value)}
              />
              <button
                type="button"
                className="cm-icon-btn cm-btn-danger"
                onClick={() => removeObjective(i)}
                title="Remove objective"
                disabled={objectives.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="cm-btn cm-btn-secondary cm-btn-sm" onClick={addObjective}>
          <Plus size={14} /> Add Objective
        </button>
      </div>

      {/* Curriculum Framework Competencies */}
      <div className="cm-section-block">
        <div className="cm-block-head">
          <h3 className="cm-block-title">
            <Award size={18} className="cm-accent-icon" /> Target Curriculum Competencies <span className="cm-req">*</span>
          </h3>
          <span className="cm-badge cm-badge-highlight">
            {selectedCompetencyIds.length} Selected
          </span>
        </div>
        <p className="cm-hint">
          Select competencies from our official 7-domain framework. These drive alignment scoring and assessment rubrics.
        </p>

        {invalidCompetencyIds.length > 0 && (
          <div className="cm-alert cm-alert-error" role="alert">
            <AlertCircle size={16} />
            <span>
              Rejected invalid curriculum identifiers: <strong>{invalidCompetencyIds.join(', ')}</strong>.
              Please remove them to proceed.
            </span>
          </div>
        )}

        {/* Selected competencies tag cloud */}
        {selectedCompetencyIds.length > 0 && (
          <div className="cm-selected-tags" aria-label="Selected competencies">
            {selectedCompetencyIds.map((cId) => {
              const comp = competencyById(cId);
              return (
                <span key={cId} className="cm-comp-pill">
                  <strong>{comp?.code || cId}</strong>: {comp?.title || 'Unknown'}
                  <button
                    type="button"
                    className="cm-pill-remove"
                    onClick={() => toggleCompetency(cId)}
                    aria-label={`Remove ${comp?.title || cId}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Search & Domain Filter */}
        <div className="cm-comp-controls">
          <div className="cm-search-wrap">
            <Search size={15} className="cm-search-icon" />
            <input
              type="search"
              className="cm-input cm-comp-search"
              placeholder="Search competencies by code, title, or statement…"
              value={compSearch}
              onChange={(e) => setCompSearch(e.target.value)}
            />
          </div>

          <div className="cm-domain-tabs" role="tablist" aria-label="Competency Domains">
            <button
              type="button"
              className={`cm-domain-btn ${domainFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDomainFilter('all')}
            >
              All Domains
            </button>
            {COMPETENCY_DOMAINS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`cm-domain-btn ${domainFilter === durableDomainId(d.id) ? 'active' : ''}`}
                onClick={() => setDomainFilter(d.id)}
                title={d.title}
              >
                {d.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Competencies Grid */}
        <div className="cm-comp-grid">
          {filteredCompetencies.slice(0, 36).map((c) => {
            const isSelected = selectedCompetencyIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`cm-comp-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleCompetency(c.id)}
                aria-pressed={isSelected}
              >
                <div className="cm-comp-card-head">
                  <span className="cm-comp-code">{c.code}</span>
                  <span className={`cm-comp-level level-${c.level}`}>{c.level}</span>
                  {isSelected && <Check size={16} className="cm-check-icon" />}
                </div>
                <h4 className="cm-comp-title">{c.title}</h4>
                <p className="cm-comp-desc">{c.statement}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function durableDomainId(id) {
  return id;
}
