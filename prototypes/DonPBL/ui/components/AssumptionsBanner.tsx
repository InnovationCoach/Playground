import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, Clock, Users } from 'lucide-react';
import { SAMPLE_PROGRAM, SCHOOL_SCHEDULE_CONFIG, LEARNER_AGE_CONFIG } from '../pbl';

export const AssumptionsBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-amber-200 bg-amber-50/70 text-amber-900 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong className="font-semibold text-amber-950">Prototype Design Notice:</strong>{' '}
              PBL programs prepared for review on branch <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">DonPBL</code>.
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-medium text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Schedule Confirmed: {SCHOOL_SCHEDULE_CONFIG.weeksPerTerm} Wks/Term • {SCHOOL_SCHEDULE_CONFIG.dailyHours}h/Weekday ({SCHOOL_SCHEDULE_CONFIG.termTotalHours}h)
            </span>
            <span className="hidden md:inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-medium text-[11px]">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Cohorts Confirmed: {LEARNER_AGE_CONFIG.span}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 font-medium text-amber-950 hover:text-amber-800 underline underline-offset-2 shrink-0 transition-colors"
          >
            {isOpen ? 'Hide Details' : 'Review Operating Assumptions & Confirmations'}
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {SAMPLE_PROGRAM.assumptions.map((asmp) => {
              const isVerified = asmp.id === 'asmp-duration' || asmp.id === 'asmp-age';
              return (
                <div 
                  key={asmp.id} 
                  className={`p-2.5 rounded border shadow-2xs ${
                    isVerified ? 'bg-emerald-50/90 border-emerald-300' : 'bg-white/80 border-amber-200'
                  }`}
                >
                  <div className="font-semibold text-stone-900 mb-1 flex items-center justify-between">
                    <span>{asmp.domain}</span>
                    {isVerified ? (
                      <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">Provisional</span>
                    )}
                  </div>
                  <p className="text-stone-700 mb-2 leading-relaxed">{asmp.assumption}</p>
                  <div className={`pt-1.5 border-t ${isVerified ? 'border-emerald-200 text-emerald-950 font-medium' : 'border-amber-100 text-amber-900'}`}>
                    <span className="font-medium text-stone-900">{isVerified ? 'Verification: ' : 'Question for Don: '}</span>
                    {asmp.ownerVerificationNeeded}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
