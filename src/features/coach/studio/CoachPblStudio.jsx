import { useState, useEffect, useMemo } from 'react';

import { Sparkles, CheckCircle2, Users, Eye, Link2, BookOpen, ArrowRight } from 'lucide-react';

import { useCoachClasses, useClassLearners } from './useCoachStudioData.js';

import { LearnerSupervisionView } from '../supervision/LearnerSupervisionView.jsx';

import { getEvaluations } from '../evaluation/evaluationsStore.js';

import { EdmentumIntegrationConsole } from '../../edmentum/EdmentumIntegrationConsole.jsx';

import { hrefFor } from '../../../app/routes.js';


import './coachStudio.css';

/** Edmentum is parked for now (Mani). Flip to true when the integration is ready to show coaches. */
const SHOW_EDMENTUM = false;

export function CoachPblStudio({ coachUser, navigate, initialTab = 'supervision' }) {
  // Top-level Navigation Workspace Tab: 'supervision' | 'evaluation' | 'studio' | 'edmentum'
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);
  const [evalList, setEvalList] = useState(() => getEvaluations());
  const pendingCount = useMemo(() => evalList.filter((e) => e.status === 'pending').length, [evalList]);

  useEffect(() => {
    const onEvalsUpdated = () => setEvalList(getEvaluations());
    window.addEventListener('hearisland-evaluations-updated', onEvalsUpdated);
    return () => window.removeEventListener('hearisland-evaluations-updated', onEvalsUpdated);
  }, []);

  // Real classes and learners from Firestore. No sample learners: an empty class shows an empty state.
  const { classes: coachClasses } = useCoachClasses(coachUser);
  const { learners } = useClassLearners('all', { fallbackClassIds: coachClasses.map((c) => c.id) });

  return (
    <div className="cp-studio">
      {/* Top Studio Bar */}
      <header className="cp-header">
        <div className="cp-header-left">
          <span className="cp-brand-badge">
            <Sparkles size={14} /> SPARK Studio
          </span>
          <div>
            <h1 className="cp-title">Coach workspace</h1>
            <p className="cp-subtitle">
              Learners, reviews and course material in one place
            </p>
          </div>
        </div>

        <div className="cp-header-actions">
          <a href="#/courses" className="cp-btn-switch">
            <BookOpen size={15} /> Courses & Maker
          </a>
          <a href="#/coach/dashboard" className="cp-btn-switch">
            <Users size={15} /> Learner Roster
          </a>
          <a href={hrefFor.pbl('programs')} className="cp-btn-switch">
            <Eye size={15} /> Program Library
          </a>
        </div>
      </header>

      {/* Top Navigation Tabs */}
      <nav className="cp-top-nav-bar" aria-label="Coach Workspace Modes">
        <div className="cp-nav-tabs">
          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'supervision' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('supervision')}
          >
            <Users size={16} /> Learners
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'evaluation' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('evaluation')}
          >
            <CheckCircle2 size={16} /> Reviews
          </button>

          {SHOW_EDMENTUM && (
          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'edmentum' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('edmentum')}
          >
            <Link2 size={16} /> Edmentum LTI 1.3
            <span className="cp-tab-pill" style={{ color: '#7ee787', background: 'rgba(46, 160, 67, 0.15)' }}>
              LTI 1.3 Ready
            </span>
          </button>
          )}
        </div>
      </nav>

      {/* Tab 1: Learner Supervision */}
      {workspaceTab === 'supervision' && (
        <LearnerSupervisionView
          learners={learners}
          pendingEvals={pendingCount}
          onSelectLearnerForStudio={() => {
            window.location.hash = '#/courses/create';
          }}
          onGoToEvaluation={() => {
            window.location.hash = '#/coach/dashboard';
          }}
        />
      )}

      {/* Tab 2: Reviews (Evaluation Desk consolidated into My Learners -> Evidence) */}
      {workspaceTab === 'evaluation' && (
        <div className="cp-card" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--brand-primary, #6366f1)', margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 8px' }}>Reviews have moved</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Phase submissions and evidence reviews are handled in the <strong>My Learners → Evidence</strong> tab.
          </p>
          <a href="#/coach/dashboard" className="cp-btn cp-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Open My Learners Dashboard <ArrowRight size={16} />
          </a>
        </div>
      )}

      {/* Tab 3: Course authoring lives in the Courses workspace */}
      {workspaceTab === 'studio' && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15,23,42,0.6)', margin: '1rem 2rem', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem' }}>Course Maker is now located in the dedicated Courses workspace</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>Course authoring and curriculum import have been separated from learner supervision.</p>
          <a href="#/courses/create" className="cp-btn-switch" style={{ display: 'inline-flex' }}>
            <Sparkles size={15} /> Open Course Maker
          </a>
        </div>
      )}

      {/* Tab 4: Edmentum LTI 1.3 Advantage & Rostering Hub */}
      {SHOW_EDMENTUM && workspaceTab === 'edmentum' && (
        <EdmentumIntegrationConsole coachUser={coachUser} />
      )}
    </div>
  );
}
