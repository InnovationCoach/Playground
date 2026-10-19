import React from 'react';
import { 
  X, 
  GitBranch, 
  Layers, 
  ShieldCheck, 
  HelpCircle, 
  Terminal, 
  FileText,
  ExternalLink
} from 'lucide-react';

interface IntegrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationDrawer: React.FC<IntegrationDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-stone-200 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-stone-900">
                PBL Studio Integration Architecture
              </h2>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="font-mono text-emerald-800">branch: DonPBL</span>
                <span aria-hidden="true">·</span>
                <span>Proposals & Isolated Prototypes</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 text-xs text-stone-700">
          {/* Branch Policy Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg">
            <div className="font-semibold text-emerald-950 flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Production Isolation Guarantee (AGENTS.md)
            </div>
            <p className="leading-relaxed text-emerald-900">
              Per strict project instructions: all prototype work is contained inside <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">prototypes/DonPBL/</code> on branch <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">DonPBL</code>. No changes have been made to live production routes, root dependencies, Firebase rules, or Firestore collections.
            </p>
          </div>

          {/* Component to File Mapping */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-stone-600" />
              Existing Code Mapping to WeLearn Playground
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  prototypes/DonPBL/programData.ts → src/features/pbl/content/pblModel.js
                </div>
                <p className="text-stone-600 mt-1">
                  Replaces the single placeholder <code className="font-mono">TERM</code> with a full 12-week program, 24 session plans, student choice trees, and explicit impact targets.
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  prototypes/DonPBL/engine.ts → src/features/pbl/engine/pblProject.js
                </div>
                <p className="text-stone-600 mt-1">
                  Harmonized with <code className="font-mono">safeLink</code>, <code className="font-mono">readiness</code> 8-point checks, and AI provenance validation.
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  Simulated Co-Pilot → docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md
                </div>
                <p className="text-stone-600 mt-1">
                  Direct client-side fallback implementation of the Gemini prompt rules (generates working code, device test steps, and explain-it-back challenge question).
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  Coach Review UI → src/features/pbl/PblStudio.jsx
                </div>
                <p className="text-stone-600 mt-1">
                  Supplies the missing Cohort Dashboard and Competency Assessment Matrix for facilitator reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Test & Verification Command */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-stone-600" />
              Automated Check Suite
            </h3>
            <div className="bg-stone-900 text-emerald-400 p-3 rounded font-mono text-[11px] space-y-1">
              <div># Run automated verification checks:</div>
              <div className="text-white">$ node prototypes/DonPBL/checks.js</div>
              <div className="text-stone-400">✓ safeLink security tests passed</div>
              <div className="text-stone-400">✓ Program schema & all 7 design thinking phases verified</div>
              <div className="text-stone-400">✓ WeLearn 7 Competency Domains verified</div>
              <div className="text-stone-400">✓ NGSS 3D Rubric dimensions and 4 levels verified</div>
              <div className="text-stone-400">✓ AI Co-Pilot pedagogical rules verified</div>
              <div className="text-stone-400">✓ 8-Point Showcase Readiness Audit logic verified</div>
            </div>
          </div>

          {/* Open Questions for Don */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              4 Open Questions for Don & School Leadership
            </h3>
            <ul className="space-y-2 list-disc list-inside text-stone-700 bg-amber-50/50 p-3 rounded border border-amber-200">
              <li>
                <strong className="text-stone-900">Learner Age Band:</strong> Is 12–15 (Grades 7–9) the confirmed cohort, or should we scaffold an introductory 9–11 track?
              </li>
              <li>
                <strong className="text-stone-900">Term Schedule:</strong> Does WeLearn operate on 8, 10, or 12 weeks for Term 3?
              </li>
              <li>
                <strong className="text-stone-900">Kit Inventory:</strong> Are BBC micro:bit V2 boards and capacitive sensors available in sufficient quantity?
              </li>
              <li>
                <strong className="text-stone-900">Backend Co-Pilot:</strong> What is the deployment roadmap for <code className="font-mono">POST /api/pbl-copilot</code>?
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Reference: <code className="font-mono">docs/DonPBL-HANDOVER.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-medium rounded-md hover:bg-stone-800 transition-colors text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
