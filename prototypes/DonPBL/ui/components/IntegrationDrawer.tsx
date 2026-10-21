import React from 'react';
import {
  X,
  Layers,
  ShieldCheck,
  HelpCircle,
  Terminal,
  FileText
} from 'lucide-react';
import { COPILOT_DEPLOYMENT_CONFIG } from '../pbl';

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
              Per project instructions: all prototype work is contained inside <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">prototypes/DonPBL/</code> on branch <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">DonPBL</code>. No changes have been made to live production routes, root dependencies, Firebase rules, or Firestore collections.
            </p>
          </div>

          {/* Component to File Mapping */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-stone-600" />
              Proposed Mapping to WeLearn Playground
            </h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  prototypes/DonPBL/programRegistry.ts → src/features/pbl/content/pblModel.js
                </div>
                <p className="text-stone-600 mt-1">
                  Supplies 6 complete 12-week (120h) programs in <code className="font-mono">PROGRAM_REGISTRY</code> (plus 1 explicit stub program kept out of the active registry until its sessions are authored).
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  prototypes/DonPBL/store.ts → users/&#123;uid&#125;/activityProgress/pbl-&lt;programId&gt;
                </div>
                <p className="text-stone-600 mt-1">
                  Keys student projects by <code className="font-mono">(uid, pbl-&lt;programId&gt;)</code> and stores coach feedback in a separate coach-writable collection path so student and coach writes never collide.
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  prototypes/DonPBL/engine.ts → src/features/pbl/engine/pblProject.js
                </div>
                <p className="text-stone-600 mt-1">
                  Harmonized with <code className="font-mono">safeLink</code>, 8-point <code className="font-mono">evaluateReadiness</code> checks, <code className="font-mono">validateAndAddEvidence</code>, and unit economics/market simulation helpers.
                </p>
              </div>

              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded">
                <div className="font-semibold text-stone-900 font-mono text-[11px]">
                  AI Co-Pilot Status: {COPILOT_DEPLOYMENT_CONFIG.status}
                </div>
                <p className="text-stone-600 mt-1">
                  {COPILOT_DEPLOYMENT_CONFIG.note}
                </p>
              </div>
            </div>
          </div>

          {/* Test & Verification Command */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-stone-600" />
              Automated Check Suite & Standalone Demo
            </h3>
            <div className="bg-stone-900 text-emerald-400 p-3 rounded font-mono text-[11px] space-y-1">
              <div># Bundle & run real unit + data + store tests:</div>
              <div className="text-white">$ node prototypes/DonPBL/checks.mjs</div>
              <div className="mt-2"># Start self-contained demo on port 5180:</div>
              <div className="text-white">$ node_modules/.bin/vite --config prototypes/DonPBL/demo/vite.config.mjs</div>
            </div>
          </div>

          {/* Open Questions for Don */}
          <div>
            <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Items Needing Owner Confirmation (Don & School Leadership)
            </h3>
            <ul className="space-y-2 list-disc list-inside text-stone-700 bg-amber-50/50 p-3 rounded border border-amber-200">
              <li>
                <strong className="text-stone-900">Term Schedule:</strong> Confirm whether all cohorts operate on 12 weeks × 10 hours/week (120h/term) and whether sessions are 18 or 24 per term.
              </li>
              <li>
                <strong className="text-stone-900">Learner Age Band:</strong> Confirm target age bands (9–11, 12–14, 15–17) and safeguarding consent procedures for any media capture.
              </li>
              <li>
                <strong className="text-stone-900">Hardware Inventory:</strong> Confirm physical stock of BBC micro:bit V2, 5V pumps, capacitive soil sensors, Arduino UNO/Nano, ESP32, and LEGO Spike/Technic kits.
              </li>
              <li>
                <strong className="text-stone-900">Backend Co-Pilot:</strong> <code className="font-mono">POST /api/pbl-copilot</code> is currently <code className="font-mono">not_deployed</code>; confirm when backend deployment will be scheduled after the deploy freeze.
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
