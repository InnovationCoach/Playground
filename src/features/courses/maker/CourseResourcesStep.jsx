import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Check, AlertTriangle, AlertCircle, Eye, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { parseCourseContent, isSupportedFormat, SUPPORTED_IMPORT_FORMATS } from './courseImportParser.js';

export function CourseResourcesStep({ course, onChange, onImportCourse }) {
  const [activeTab, setActiveTab] = useState('sources'); // 'sources' | 'import'
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [pasteImport, setPasteImport] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);

  const sources = course.sources || [];
  const totalChars = sources.reduce((n, s) => n + (s.text?.length || 0), 0);
  const MAX_CHARS = 30000;

  // Add source manually
  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;
    const s = {
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      text: newText.trim(),
      charCount: newText.trim().length,
      createdAt: new Date().toISOString()
    };
    onChange({ sources: [...sources, s] });
    setNewTitle('');
    setNewText('');
  };

  const handleRemoveSource = (id) => {
    onChange({ sources: sources.filter((s) => s.id !== id) });
  };

  // Upload file as source material
  const handleSourceFileUpload = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isSupportedFormat(file.name, file.type)) {
      alert(`Unsupported file format. Please upload text files (.txt, .md, .csv, .json).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const title = file.name.replace(/\.[^/.]+$/, '');
        const s = {
          id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title,
          text: text.slice(0, MAX_CHARS),
          charCount: text.length,
          fileName: file.name,
          createdAt: new Date().toISOString()
        };
        onChange({ sources: [...sources, s] });
      }
    };
    reader.readAsText(file);
  };

  // Process imported course file or pasted content
  const handleImportContent = (content, fileName = 'uploaded-file.json') => {
    setImportError(null);
    setImportResult(null);

    const result = parseCourseContent(content, fileName);
    if (!result.success) {
      setImportError(result.error);
      return;
    }
    setImportResult(result);
  };

  const handleImportFileUpload = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isSupportedFormat(file.name, file.type)) {
      setImportError(`Unsupported file: "${file.name}". Binary files (PDF, images, zip) are not readable. Please upload JSON, Markdown, CSV, or Text.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        handleImportContent(text, file.name);
      }
    };
    reader.onerror = () => {
      setImportError(`Could not read file "${file.name}". The file may be locked or corrupted.`);
    };
    reader.readAsText(file);
  };

  // Apply imported course to current draft
  const handleConfirmImport = () => {
    if (!importResult?.course) return;
    const imported = importResult.course;
    onImportCourse(imported);
    setImportResult(null);
    setPasteImport('');
  };

  return (
    <div className="cm-step cm-step-resources">
      <div className="cm-section-head">
        <h2 className="cm-section-title">Step 2 — Resources & Course Import</h2>
        <p className="cm-section-desc">
          Upload reference knowledge to ground AI drafting, or import a pre-existing syllabus or curriculum file.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="cm-tab-row" role="tablist">
        <button
          type="button"
          className={`cm-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          <FileText size={16} /> Source Materials ({sources.length})
        </button>
        <button
          type="button"
          className={`cm-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          <Upload size={16} /> Import Pre-existing Course
        </button>
      </div>

      {activeTab === 'sources' && (
        <div className="cm-sources-panel">
          <div className="cm-usage-bar">
            <span>Grounding Sources: <strong>{sources.length}</strong></span>
            <span>
              Characters: <strong>{totalChars.toLocaleString()}</strong> / {MAX_CHARS.toLocaleString()}
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="cm-empty-state">
              <FileText size={32} className="cm-empty-icon" />
              <h4>No source materials added yet</h4>
              <p>Add text excerpts, standards documents, or science articles below. AI will strictly ground its suggestions in these sources.</p>
            </div>
          ) : (
            <div className="cm-sources-list">
              {sources.map((s) => (
                <div key={s.id} className="cm-source-card">
                  <div className="cm-source-info">
                    <h4 className="cm-source-title">{s.title}</h4>
                    <span className="cm-source-meta">{s.charCount?.toLocaleString() || s.text.length} characters</span>
                    <p className="cm-source-preview">{s.text.slice(0, 160)}…</p>
                  </div>
                  <button
                    type="button"
                    className="cm-icon-btn cm-btn-danger"
                    onClick={() => handleRemoveSource(s.id)}
                    title="Remove source"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add source form */}
          <form onSubmit={handleAddSource} className="cm-add-source-form">
            <h4 className="cm-h4"><Plus size={16} /> Add Grounding Material</h4>
            <div className="cm-field">
              <label htmlFor="source-title-input" className="cm-label">Source Document Title</label>
              <input
                id="source-title-input"
                type="text"
                className="cm-input"
                placeholder="e.g. IPCC Urban Heat Island Mitigation Report or Lesson Standard"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="cm-field">
              <label htmlFor="source-text-input" className="cm-label">Document Text / Notes</label>
              <textarea
                id="source-text-input"
                className="cm-textarea"
                rows={5}
                placeholder="Paste reference text here. Factual claims in course milestones will be grounded in this material."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>
            <div className="cm-form-actions">
              <button
                type="submit"
                className="cm-btn cm-btn-secondary"
                disabled={!newTitle.trim() || !newText.trim() || totalChars + newText.length > MAX_CHARS}
              >
                Add Document to Sources
              </button>
              <button
                type="button"
                className="cm-btn cm-btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> Upload File (.txt, .md, .csv)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json"
                style={{ display: 'none' }}
                onChange={(e) => handleSourceFileUpload(e.target.files)}
              />
            </div>
          </form>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="cm-import-panel">
          <div className="cm-import-formats">
            <h4>Supported Course Formats:</h4>
            <div className="cm-format-chips">
              {SUPPORTED_IMPORT_FORMATS.map((f) => (
                <span key={f.ext} className="cm-format-chip">
                  <strong>{f.ext}</strong> — {f.label}
                </span>
              ))}
            </div>
            <p className="cm-hint">Binary formats (PDF, Word docx, scanned images) are unreadable. Save as Markdown, JSON, or Plain Text before importing.</p>
          </div>

          {/* Dropzone */}
          <div
            className={`cm-dropzone ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleImportFileUpload(e.dataTransfer.files);
            }}
            onClick={() => importFileInputRef.current?.click()}
          >
            <Upload size={32} />
            <p><strong>Click to upload</strong> or drag and drop course file here</p>
            <span className="cm-hint">JSON, Markdown, CSV, or Text</span>
            <input
              ref={importFileInputRef}
              type="file"
              accept=".json,.md,.csv,.txt"
              style={{ display: 'none' }}
              onChange={(e) => handleImportFileUpload(e.target.files)}
            />
          </div>

          <div className="cm-divider"><span>OR PASTE CONTENT</span></div>

          <div className="cm-field">
            <label htmlFor="paste-import-area" className="cm-label">Paste Raw JSON, Markdown, or CSV Course Content</label>
            <textarea
              id="paste-import-area"
              className="cm-textarea"
              rows={6}
              placeholder="Paste JSON course schema, Markdown syllabus with # headers, or CSV rows here…"
              value={pasteImport}
              onChange={(e) => setPasteImport(e.target.value)}
            />
            <button
              type="button"
              className="cm-btn cm-btn-secondary cm-btn-sm"
              disabled={!pasteImport.trim()}
              onClick={() => handleImportContent(pasteImport, 'pasted-course.txt')}
              style={{ marginTop: '0.5rem' }}
            >
              Parse Pasted Content
            </button>
          </div>

          {/* Import error state */}
          {importError && (
            <div className="cm-alert cm-alert-error" role="alert">
              <AlertCircle size={18} />
              <div>
                <strong>Import Failed:</strong>
                <p>{importError}</p>
              </div>
            </div>
          )}

          {/* Import Preview Modal / Confirmation Panel */}
          {importResult?.course && (
            <div className="cm-import-preview-box">
              <div className="cm-preview-header">
                <div>
                  <span className="cm-badge cm-badge-highlight">{importResult.format}</span>
                  <h3 className="cm-preview-title">{importResult.course.title}</h3>
                </div>
                <button
                  type="button"
                  className="cm-btn cm-btn-primary"
                  onClick={handleConfirmImport}
                >
                  <Check size={16} /> Confirm & Map into Course
                </button>
              </div>

              <div className="cm-preview-grid">
                <div>
                  <span className="cm-meta-label">Duration</span>
                  <strong>{importResult.course.durationWeeks} Weeks</strong>
                </div>
                <div>
                  <span className="cm-meta-label">Target Cohort</span>
                  <strong>{importResult.course.cohort} ({importResult.course.ageBand})</strong>
                </div>
                <div>
                  <span className="cm-meta-label">Objectives</span>
                  <strong>{(importResult.course.objectives || []).length} Objectives</strong>
                </div>
                <div>
                  <span className="cm-meta-label">Stages / Milestones</span>
                  <strong>{(importResult.course.milestones || []).length} Milestones</strong>
                </div>
              </div>

              {/* Sample Milestones list */}
              <div className="cm-preview-milestones">
                <h4>Detected Course Outline Preview:</h4>
                <ol className="cm-preview-list">
                  {(importResult.course.milestones || []).map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.title || `Stage ${idx + 1}`}</strong>: {m.learningGoal || m.activities?.[0] || 'No goal specified'}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
