import { useMemo, useState } from 'react';
import { Search, CalendarDays, Layers, Users, TriangleAlert, ArrowRight, School } from 'lucide-react';
import { PROGRAMS, PLATFORM_NOTES, SCHEDULE, shortAges } from './catalog.js';
import { programProgress } from './progress.js';
import { readLocalProgress } from './useProgramProgress.js';
import { ProgramIcon } from './ProgramIcon.jsx';
import { ProgramPoster } from './ProgramPoster.jsx';
import { coverFor } from './programMedia.js';
import { useClassPrograms } from './useClassPrograms.js';
import { hrefFor } from '../../../app/routes.js';

/**
 * The program library: every PBL program Don has written, as cards.
 *
 * Learners browse and open one; coaches also see how many content checks each
 * program has outstanding, so nothing reaches a class without someone having
 * read the warnings.
 */
export function ProgramLibrary({ uid, isCoach, classIds = [] }) {
  const { assigned, byProgram, classCovers } = useClassPrograms(classIds);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => PROGRAMS.filter((p) => !q
    || [p.title, p.theme, p.drivingQuestion, p.subtitle].some((t) => t?.toLowerCase().includes(q))), [q]);

  return (
    <div className="pg-library">
      <div className="pg-library-head">
        <div>
          <h2 className="pb-h2">Program library</h2>
          <p className="pb-lead">
            Each program fills one term: {SCHEDULE.weeksPerTerm} weeks of Design Thinking around a real problem
            that helps people, the environment or both. {isCoach
              ? 'Open one to see the session plans, teaching guide and anything to check before you run it.'
              : 'Open one to see what you will explore, build and show.'}
          </p>
        </div>
        <label className="gh-input-icon pg-search">
          <Search size={16} aria-hidden="true" />
          <input className="gh-input" type="search" placeholder="Search programs" value={query}
                 onChange={(e) => setQuery(e.target.value)} aria-label="Search programs" />
        </label>
      </div>

      {!isCoach && assigned.length > 0 && (
        <section className="pg-assigned" aria-label="Your class program">
          {assigned.map((c) => {
            const p = PROGRAMS.find((x) => x.id === c.programId);
            return (
              <a key={c.id} className="pg-assigned-card" data-tone={p.identity.tone} href={hrefFor.program(p.id)}>
                <span className="pg-card-icon"><ProgramIcon name={p.identity.icon} size={24} /></span>
                <span className="pb-grow">
                  <span className="pg-assigned-kicker"><School size={14} aria-hidden="true" />{c.name} is doing</span>
                  <strong>{p.title}</strong>
                </span>
                <span className="pg-card-go">Open<ArrowRight size={16} aria-hidden="true" /></span>
              </a>
            );
          })}
        </section>
      )}
      {!isCoach && classIds.length === 0 && (
        <p className="pb-note pg-platform-note" role="note">Join your class on Home to see the program your teacher chose for you.</p>
      )}

      {isCoach && PLATFORM_NOTES.length > 0 && (
        <div className="pb-note pg-platform-note" role="note">
          <TriangleAlert size={15} aria-hidden="true" />
          <span>All programs are drafts awaiting school review. {PLATFORM_NOTES.map((n) => n.text).join(' ')}</span>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="pb-empty">No program matches “{query}”.</p>
      ) : (
        <ul className="pg-grid">
          {shown.map((p) => <li key={p.id}><ProgramCard program={p} uid={uid} isCoach={isCoach} classNames={byProgram[p.id]} cover={coverFor(p, classCovers)} /></li>)}
        </ul>
      )}
    </div>
  );
}

function ProgramCard({ program: p, uid, isCoach, classNames, cover }) {
  const local = !isCoach ? readLocalProgress(uid, p) : null;
  const prog = local?.startedAt ? programProgress(local, p) : null;
  const blocking = p.issues.filter((i) => i.level === 'block').length;

  return (
    <a className="pg-card" data-tone={p.identity.tone} data-assigned={classNames ? true : undefined} href={hrefFor.program(p.id)}>
      <div className="pg-card-cover">
        <ProgramPoster program={p} cover={cover} />
        {p.sharesPhasesWith && <span className="pg-outline-tag">Outline only</span>}
      </div>
      {classNames && (
        <div className="pg-card-classes"><School size={14} aria-hidden="true" />{isCoach ? 'Running in ' : 'Your class: '}{classNames.join(', ')}</div>
      )}
      <div className="pg-card-body">
        <strong className="pg-card-title">{p.title}</strong>
        <span className="pg-card-theme">{p.theme}</span>
        <p className="pg-card-dq">{p.drivingQuestion}</p>
        <ul className="pg-meta" aria-label="Program facts">
          <li><CalendarDays size={14} aria-hidden="true" />{p.durationWeeks} weeks</li>
          <li><Layers size={14} aria-hidden="true" />{p.sessions.length} sessions</li>
          <li><Users size={14} aria-hidden="true" />{shortAges(p.targetAgeRange)}</li>
        </ul>
      </div>
      <div className="pg-card-foot">
        {prog ? (
          <span className="pg-card-progress">
            <span className="pb-meter" aria-hidden="true"><span style={{ width: `${prog.pct}%` }} /></span>
            {prog.done} of {prog.total} sessions done
          </span>
        ) : isCoach && p.issues.length > 0 ? (
          <span className={`gh-badge ${blocking ? 'gh-badge-suspended' : 'gh-badge-pending'}`}>
            {p.issues.length} {p.issues.length === 1 ? 'check' : 'checks'} to review
          </span>
        ) : (
          <span className="gh-badge gh-badge-pending">Draft</span>
        )}
        <span className="pg-card-go">Open<ArrowRight size={15} aria-hidden="true" /></span>
      </div>
    </a>
  );
}
