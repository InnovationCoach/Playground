import { useState, useEffect, useMemo } from 'react';

import { Sparkles, CheckCircle2, Users, Eye, Link2 } from 'lucide-react';




import { LearnerSupervisionView } from '../supervision/LearnerSupervisionView.jsx';

import { EvaluationDeskView } from '../evaluation/EvaluationDeskView.jsx';

import { CourseStudioPanel } from './CourseStudioPanel.jsx';

import { getEvaluations } from '../evaluation/evaluationsStore.js';

import { EdmentumIntegrationConsole } from '../../edmentum/EdmentumIntegrationConsole.jsx';

import { hrefFor } from '../../../app/routes.js';


import './coachStudio.css';

/** Edmentum is parked for now (Mani). Flip to true when the integration is ready to show coaches. */
const SHOW_EDMENTUM = false;

export function CoachPblStudio({ coachUser, navigate, initialTab = 'supervision', learners = [] }) {
  // Top-level Navigation Workspace Tab: 'supervision' | 'evaluation' | 'studio'
  const [workspaceTab, setWorkspaceTab] = useState(initialTab);
  const [evalList, setEvalList] = useState(() => getEvaluations());
  const pendingCount = useMemo(() => evalList.filter((e) => e.status === 'pending').length, [evalList]);

  useEffect(() => {
    const onEvalsUpdated = () => setEvalList(getEvaluations());
    window.addEventListener('hearisland-evaluations-updated', onEvalsUpdated);
    return () => window.removeEventListener('hearisland-evaluations-updated', onEvalsUpdated);
  }, []);

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
            <span className="cp-tab-pill pill-amber">
              {pendingCount > 0 && <span className="cp-tab-pulse-dot" />}
              {pendingCount} Pending
            </span>
          </button>

          <button
            type="button"
            className={`cp-nav-tab ${workspaceTab === 'studio' ? 'active' : ''}`}
            onClick={() => setWorkspaceTab('studio')}
          >
            <Sparkles size={16} /> Course studio
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
            setWorkspaceTab('studio');
          }}
          onGoToEvaluation={() => {
            setWorkspaceTab('evaluation');
          }}
        />
      )}

      {/* Tab 2: Evaluation Desk */}
      {workspaceTab === 'evaluation' && (
        <EvaluationDeskView
          coachUser={coachUser}
          onOpenStudioWithLearner={() => {
            setWorkspaceTab('studio');
          }}
        />
      )}

      {/* Tab 3: Course studio, then the learner-tailored unit (only when a learner exists) */}
      {workspaceTab === 'studio' && <CourseStudioPanel />}
      {/* Tab 4: Edmentum LTI 1.3 Advantage & Rostering Hub */}
      {SHOW_EDMENTUM && workspaceTab === 'edmentum' && (
        <EdmentumIntegrationConsole coachUser={coachUser} />
      )}
    </div>
  );
}
