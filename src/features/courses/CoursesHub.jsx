import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, UploadCloud, FileEdit, Trash2, Clock, Sparkles } from 'lucide-react';
import { MyCourses } from './MyCourses.jsx';
import { CourseMaker } from './maker/CourseMaker.jsx';
import { listDrafts, deleteDraft } from './maker/courseDraftStore.js';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import './courses.css';

export function CoursesHub({
  role,
  coachUser,
  isPrimary,
  onOpenActivity,
  displayName,
  uid,
  classIds = [],
  onJoined,
  initialTab = 'my',
  initialDraftId = null
}) {
  const { t } = useLocale();
  const isCoach = role === 'teacher' || role === 'coach' || role === 'admin' || role === 'supervisor';

  // Sub-tabs: 'my' | 'create' | 'import' | 'drafts'
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDraftId, setSelectedDraftId] = useState(initialDraftId);
  const [drafts, setDrafts] = useState(() => listDrafts());

  useEffect(() => {
    const handleDraftsChanged = () => setDrafts(listDrafts());
    window.addEventListener('course-maker-drafts-changed', handleDraftsChanged);
    return () => window.removeEventListener('course-maker-drafts-changed', handleDraftsChanged);
  }, []);

  // For students, directly show My Courses without coach authoring chrome
  if (!isCoach) {
    return (
      <MyCourses
        isPrimary={isPrimary}
        onOpenActivity={onOpenActivity}
        displayName={displayName}
        uid={uid}
        classIds={classIds}
        onJoined={onJoined}
      />
    );
  }

  // Active Maker Mode (Create, Import, or Edit Draft)
  if (activeTab === 'create' || activeTab === 'import') {
    return (
      <CourseMaker
        coachUser={coachUser || { uid, displayName, role }}
        initialDraftId={selectedDraftId}
        initialMode={activeTab}
        onExit={() => {
          setSelectedDraftId(null);
          setActiveTab('my');
        }}
      />
    );
  }

  return (
    <div className="courses-hub-container">
      {/* Dedicated Coach Navigation Bar for Courses */}
      <header className="courses-hub-header">
        <div className="courses-hub-title-block">
          <h1 className="courses-hub-title">{t('courses.hubTitle', 'Course Management & Curriculum')}</h1>
          <p className="courses-hub-subtitle">
            {t('courses.hubSubtitle', 'Create, import, and oversee courses aligned with the WeLearn curriculum framework.')}
          </p>
        </div>

        <nav className="courses-hub-tabs" role="tablist" aria-label="Courses Navigation">
          <button
            type="button"
            className={`courses-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
            role="tab"
            aria-selected={activeTab === 'my'}
          >
            <BookOpen size={16} /> {t('nav.myCourses', 'My Courses')}
          </button>

          <button
            type="button"
            className={`courses-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setSelectedDraftId(null); setActiveTab('create'); }}
            role="tab"
            aria-selected={activeTab === 'create'}
          >
            <PlusCircle size={16} /> {t('nav.createCourse', 'Create Course')}
          </button>

          <button
            type="button"
            className={`courses-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => { setSelectedDraftId(null); setActiveTab('import'); }}
            role="tab"
            aria-selected={activeTab === 'import'}
          >
            <UploadCloud size={16} /> {t('nav.importCourse', 'Import Course')}
          </button>

          {drafts.length > 0 && (
            <button
              type="button"
              className={`courses-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
              role="tab"
              aria-selected={activeTab === 'drafts'}
            >
              <FileEdit size={16} /> {t('courses.drafts', 'Drafts')}
              <span className="courses-tab-count">{drafts.length}</span>
            </button>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="courses-hub-main">
        {activeTab === 'my' && (
          <MyCourses
            isPrimary={isPrimary}
            onOpenActivity={onOpenActivity}
            displayName={displayName}
            uid={uid}
            classIds={classIds}
            onJoined={onJoined}
          />
        )}

        {activeTab === 'drafts' && (
          <div className="courses-drafts-panel">
            <div className="courses-drafts-head">
              <h2>Saved In-Progress Course Drafts</h2>
              <p>These drafts are private to coaches and remain untouched until explicitly published.</p>
            </div>

            {drafts.length === 0 ? (
              <div className="cm-empty-state">
                <FileEdit size={32} className="cm-empty-icon" />
                <h4>No in-progress drafts</h4>
                <p>Click "Create Course" or "Import Course" above to start drafting a new curriculum-aligned course.</p>
              </div>
            ) : (
              <div className="courses-drafts-grid">
                {drafts.map((d) => (
                  <div key={d.id} className="course-draft-card">
                    <div className="draft-card-head">
                      <span className="draft-step-pill">Step {d.step || 1} of 5</span>
                      <span className="draft-time">
                        <Clock size={12} /> {new Date(d.updatedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="draft-title">{d.title || 'Untitled Course Draft'}</h3>
                    <p className="draft-desc">
                      {d.drivingQuestion || d.theme || 'In-progress curriculum unit'}
                    </p>

                    <div className="draft-meta">
                      <span>{d.cohort || 'lower-secondary'}</span>
                      <span>{(d.milestones || []).length} Milestones</span>
                      <span>{(d.competencies || []).length} Competencies</span>
                    </div>

                    <div className="draft-card-actions">
                      <button
                        type="button"
                        className="cm-btn cm-btn-primary cm-btn-sm"
                        onClick={() => {
                          setSelectedDraftId(d.id);
                          setActiveTab('create');
                        }}
                      >
                        <FileEdit size={14} /> Resume Draft
                      </button>
                      <button
                        type="button"
                        className="cm-icon-btn cm-btn-danger"
                        onClick={() => deleteDraft(d.id)}
                        title="Delete draft"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
