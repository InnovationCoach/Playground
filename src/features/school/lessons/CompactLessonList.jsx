import { normalizeLesson } from './lessonModel.js';
import { LearningMedia } from '../media/LearningMedia.jsx';
import { SimulationLab } from '../SimulationLab.jsx';
import { Clock, Eye, Edit3, ArrowUp, ArrowDown, Award, Send } from 'lucide-react';

export function CompactLessonList({
  lessons = [],
  template,
  isStaff,
  onEdit,
  onPublish,
  onPreview,
  busy = false
}) {
  if (!lessons.length) {
    return <p className="sw-empty-list">No lessons have been published for your class yet.</p>;
  }

  const normalizedLessons = lessons.map((l, index) => ({
    ...normalizeLesson(l),
    sequenceNumber: index + 1
  }));

  return (
    <div className="sw-compact-lessons" aria-label="Program lessons list">
      <div className="sw-compact-list-header">
        <span>#</span>
        <span>Lesson & Purpose</span>
        <span>Competencies</span>
        <span>Time</span>
        <span>Status</span>
        <span className="sw-align-right">Actions</span>
      </div>
      <ol className="sw-compact-list">
        {normalizedLessons.map((lesson, idx) => {
          const milestoneTitle = template?.milestones?.find(m => m.id === lesson.milestoneId)?.title || 'Milestone';

          return (
            <li key={lesson.id} className={`sw-compact-row sw-status-${lesson.status}`}>
              <div className="sw-compact-col-seq">
                <span className="sw-seq-badge">#{lesson.sequenceNumber}</span>
              </div>

              <div className="sw-compact-col-main">
                <small className="sw-compact-milestone">{milestoneTitle} · Version {lesson.revision || 1}</small>
                <h4 className="sw-compact-title">{lesson.title}</h4>
                {lesson.outcome && (
                  <p className="sw-compact-outcome">{lesson.outcome}</p>
                )}
              </div>

              <div className="sw-compact-col-comp">
                {lesson.competencies?.length > 0 ? (
                  <div className="sw-comp-chips-compact">
                    {lesson.competencies.slice(0, 3).map(c => (
                      <span key={c.id} className="sw-comp-pill" title={`${c.title}: ${c.statement}`}>
                        <Award size={11} aria-hidden="true" /> {c.code || c.id}
                      </span>
                    ))}
                    {lesson.competencies.length > 3 && (
                      <span className="sw-comp-more">+{lesson.competencies.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="sw-muted-small">—</span>
                )}
              </div>

              <div className="sw-compact-col-time">
                <span className="sw-time-pill">
                  <Clock size={12} aria-hidden="true" /> {lesson.estimatedMinutes}m
                </span>
              </div>

              <div className="sw-compact-col-status">
                <span className={`sw-state-badge ${lesson.status === 'published' ? 'published' : 'draft'}`}>
                  {lesson.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="sw-compact-col-actions sw-align-right">
                <button
                  type="button"
                  className="gh-btn gh-btn-ghost gh-btn-small"
                  onClick={() => onPreview?.(lesson)}
                  title={isStaff ? 'Preview learner view' : 'Open lesson'}
                  aria-label={`${isStaff ? 'Preview' : 'Open lesson:'} ${lesson.title}`}
                >
                  <Eye size={14} aria-hidden="true" /> {isStaff ? 'Preview' : 'Open lesson'}
                </button>

                {isStaff && lesson.status === 'draft' && (
                  <>
                    <button
                      type="button"
                      className="gh-btn gh-btn-ghost gh-btn-small"
                      disabled={busy}
                      onClick={() => onEdit?.(lesson)}
                      title="Edit lesson draft"
                      aria-label={`Edit ${lesson.title}`}
                    >
                      <Edit3 size={14} aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      className="gh-btn gh-btn-primary gh-btn-small"
                      disabled={busy}
                      onClick={() => onPublish?.(lesson)}
                      title="Publish lesson to learners"
                      aria-label={`Publish ${lesson.title}`}
                    >
                      <Send size={14} aria-hidden="true" /> Publish
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
