import { Check, BookOpen, FileEdit, Sparkles, Send } from 'lucide-react';

export const WIZARD_STEPS = [
  { id: 1, key: 'sources', number: '1', title: 'Sources', icon: BookOpen },
  { id: 2, key: 'brief', number: '2', title: 'Brief', icon: FileEdit },
  { id: 3, key: 'generate', number: '3', title: 'Generate & Review', icon: Sparkles },
  { id: 4, key: 'publish', number: '4', title: 'Publish', icon: Send }
];

export function StudioWizardProgress({
  currentStep = 1,
  onSelectStep,
  sourcesCount = 0,
  hasBrief = false,
  hasUnit = false,
  isPublished = false
}) {
  const getStepStatus = (stepId) => {
    if (stepId === 1) return sourcesCount > 0 ? `${sourcesCount} ready` : 'Attach docs';
    if (stepId === 2) return hasBrief ? 'Configured' : 'Define challenge';
    if (stepId === 3) return hasUnit ? 'Unit ready' : 'Generate draft';
    if (stepId === 4) return isPublished ? 'Live in catalog' : 'Assign & send';
    return '';
  };

  const isStepCompleted = (stepId) => {
    if (stepId === 1) return sourcesCount > 0 && currentStep > 1;
    if (stepId === 2) return hasBrief && currentStep > 2;
    if (stepId === 3) return hasUnit && currentStep > 3;
    if (stepId === 4) return isPublished;
    return false;
  };

  return (
    <nav className="cp-wizard-nav" aria-label="Curriculum Studio 4-Step Wizard">
      <div className="cp-wizard-track">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isDone = isStepCompleted(step.id);
          const Icon = step.icon;
          const statusText = getStepStatus(step.id);

          return (
            <div key={step.id} className="cp-wizard-step-wrap">
              <button
                type="button"
                className={`cp-wizard-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-completed' : ''}`}
                onClick={() => onSelectStep?.(step.id)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="cp-wizard-step-circle">
                  {isDone ? <Check size={14} /> : <span>{step.number}</span>}
                </span>
                <div className="cp-wizard-step-label-group">
                  <span className="cp-wizard-step-title">{step.title}</span>
                  <span className="cp-wizard-step-sub">{statusText}</span>
                </div>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`cp-wizard-connector ${currentStep > step.id ? 'is-filled' : ''}`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
