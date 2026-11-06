import React, { useState } from 'react';
import { 
  X, 
  BookmarkPlus, 
  AlertCircle, 
  Link as LinkIcon, 
  Code, 
  FileText, 
  Sparkles, 
  Tag, 
  Check 
} from 'lucide-react';
import { 
  CORE_COMPETENCIES, 
  COMPETENCY_DOMAINS, 
  safeLink, 
  validateAndAddEvidence
} from '../pbl';
import type {
  EvidenceItem,
  StudentProject
} from '../pbl';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StudentProject;
  onSaveEvidence: (updatedProject: StudentProject) => void;
  defaultPhase?: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveEvidence,
  defaultPhase = 'prototype'
}) => {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<any>(defaultPhase);
  const [kind, setKind] = useState<EvidenceItem['kind']>('note');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [aiAsked, setAiAsked] = useState('');
  const [aiKept, setAiKept] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleCompetency = (id: string) => {
    setSelectedCompetencies((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id].slice(0, 5)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputData: Partial<EvidenceItem> = {
      title,
      phase,
      kind,
      body,
      link: link.trim() || undefined,
      competencies: selectedCompetencies,
      ai: kind === 'ai' ? { asked: aiAsked, gave: body, kept: aiKept } : undefined
    };

    const result = validateAndAddEvidence(project, inputData);
    if (!result.success || !result.updatedProject) {
      setErrorMsg(result.error || 'Failed to validate evidence.');
      return;
    }

    onSaveEvidence(result.updatedProject);
    onClose();
  };

  const isLinkSafe = !link || Boolean(safeLink(link));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
              <span>Evidence Portfolio Logger</span>
              <span aria-hidden="true">·</span>
              <span>Tagged to WeLearn Competencies</span>
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Log New Learning Evidence
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Evidence Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Multi-Trial Thermal Cooling Curve under 100W Heat Lamp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Phase & Kind */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Project Phase
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="explore">1. Explore (STEAM Labs)</option>
                <option value="empathise">2. Empathise (User Interviews)</option>
                <option value="define">3. Define (Criteria & Targets)</option>
                <option value="ideate">4. Ideate & Plan (Sketches & Circuits)</option>
                <option value="prototype">5. Prototype (Physical Build & Code)</option>
                <option value="test">6. Test & Improve (Empirical Trials)</option>
                <option value="share">7. Showcase (Presentation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Evidence Kind
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="note">Observation or Lab Note</option>
                <option value="data">Data Table / Results</option>
                <option value="code">Physical Computing Code</option>
                <option value="ai">AI Co-Pilot Interaction Log</option>
                <option value="media">Photo / Video Evidence Link</option>
                <option value="feedback">Stakeholder Feedback</option>
                <option value="reflection">Reflective Analysis</option>
              </select>
            </div>
          </div>

          {/* Special fields for AI Log */}
          {kind === 'ai' && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-3">
              <div className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                WeLearn AI Provenance Rule: Using AI well is evidence, not cheating!
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                  1. What you asked AI (Your exact prompt) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Write a MicroPython function to deploy a servo canopy when temp exceeds 32C..."
                  value={aiAsked}
                  onChange={(e) => setAiAsked(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                  2. What you kept, altered, or rejected (Why did you make this choice?) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. We kept the servo angle calculations, but modified the delay and added a separate 5V power rail..."
                  value={aiKept}
                  onChange={(e) => setAiKept(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Main Body / Code Textarea */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              {kind === 'code' ? 'Code Body / Implementation Details *' : 'Description / Findings / Quotes *'}
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                kind === 'code'
                  ? '# Paste your MicroPython or MakeCode program here...'
                  : 'Describe what you discovered, measured, built, or reflected upon...'
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            />
          </div>

          {/* Link URL (with XSS validation check) */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
              External Link (Optional - must begin with http:// or https://)
            </label>
            <input
              type="text"
              placeholder="https://example.com/photo-or-sheet"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={`w-full text-xs p-2 bg-stone-50 border rounded-lg focus:outline-none focus:ring-2 ${
                !isLinkSafe
                  ? 'border-rose-400 focus:ring-rose-500 text-rose-700'
                  : 'border-stone-300 focus:ring-emerald-600'
              }`}
            />
            {!isLinkSafe && (
              <span className="text-[11px] text-rose-600 mt-1 block">
                Security violation: Only safe http:// or https:// links are permitted. Script protocols are blocked.
              </span>
            )}
          </div>

          {/* Competency Tagging */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              Tag School Competencies (Select up to 5)
            </label>
            <div className="border border-stone-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1.5 bg-stone-50">
              {CORE_COMPETENCIES.slice(0, 16).map((comp) => {
                const isSelected = selectedCompetencies.includes(comp.id);
                return (
                  <button
                    type="button"
                    key={comp.id}
                    onClick={() => handleToggleCompetency(comp.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-100/90 text-emerald-950 font-medium border border-emerald-300'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <span>
                      <span className="font-mono font-semibold text-emerald-800 mr-1.5">
                        [{comp.id}]
                      </span>
                      {comp.title}: {comp.statement.slice(0, 60)}...
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 flex items-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Evidence to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
