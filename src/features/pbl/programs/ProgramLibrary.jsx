import { useMemo, useState, useEffect } from 'react';
import { Search, CalendarDays, Layers, Users, TriangleAlert, ArrowRight, School } from 'lucide-react';
import { PROGRAMS, getAllPrograms, normaliseProgram, programById, COACH_PLATFORM_NOTES, SCHEDULE, shortAges } from './catalog.js';
import { db, collection, getDocs } from '../../../firebase.js';
import { programProgress } from './progress.js';
import { readLocalProgress } from './useProgramProgress.js';
import { ProgramIcon } from './ProgramIcon.jsx';
import { ProgramPoster } from './ProgramPoster.jsx';
import { coverFor } from './programMedia.js';
import { useClassPrograms } from './useClassPrograms.js';
import { hrefFor } from '../../../app/routes.js';

/**
 * The program library: every PBL program Don has written and custom coach units, as cards.
 *
 * Learners browse and open one; coaches also see how many content checks each
 * program has outstanding, so nothing reaches a class without someone having
 * read the warnings.
 */
export function ProgramLibrary({ uid, isCoach, classIds = [] }) {
  const { assigned, byProgram, classCovers } = useClassPrograms(classIds);
  const [query, setQuery] = useState('');
  const [programsList, setProgramsList] = useState(() => getAllPrograms());

  useEffect(() => {
    let cancelled = false;
    const reload = () => {
      if (!cancelled) setProgramsList(getAllPrograms());
    };
    window.addEventListener('pbl-custom-programs-changed', reload);
    window.addEventListener('pbl-program-published', reload);

    async function fetchFromFirestore() {
      try {
        const snap = await getDocs(collection(db, 'pbl_programs'));
        if (cancelled || !snap) return;
        const remote = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data) remote.push(normaliseProgram({ id: d.id, ...data }));
        });
        if (remote.length > 0 && !cancelled) {
          setProgramsList(() => {
            const map = new Map();
            getAllPrograms().forEach((p) => map.set(p.id, p));
            remote.forEach((p) => {
              if (p && !map.has(p.id)) map.set(p.id, p);
            });
            return Array.from(map.values());
          });
        }
      } catch {
        // Non-fatal if offline
      }
    }
    fetchFromFirestore();

    return () => {
      cancelled = true;
      window.removeEventListener('pbl-custom-programs-changed', reload);
      window.removeEventListener('pbl-program-published', reload);
    };
  }, []);

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => programsList.filter((p) => (isCoach || p.status !== 'draft') && (!q
    || [p.title, p.theme, p.category, p.drivingQuestion, p.subtitle, ...(Array.isArray(p.tags) ? p.tags : [])].some((t) => t?.toLowerCase().includes(q)))), [programsList, q, isCoach]);

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
            const p = programsList.find((x) => x.id === c.programId) || programById(c.programId);
            if (!p) return null;
            return (
              <a key={c.id} className="pg-assigned-card" data-tone={p.identity?.tone || 'amber'} href={hrefFor.program(p.id)}>
                <span className="pg-card-icon"><ProgramIcon name={p.identity?.icon || 'Compass'} size={24} /></span>
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

      {isCoach && COACH_PLATFORM_NOTES.length > 0 && (
        <div className="pb-note pg-platform-note" role="note">
          <TriangleAlert size={15} aria-hidden="true" />
          <span>All programs are drafts awaiting coach review. {COACH_PLATFORM_NOTES.map((n) => n.text).join(' ')}</span>
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
  const issues = Array.isArray(p.issues) ? p.issues : [];
  const blocking = issues.filter((i) => i.level === 'block').length;
  const sessions = Array.isArray(p.sessions) ? p.sessions : [];
  const tone = p.identity?.tone || 'purple';
  const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean).slice(0, 3) : [];

  return (
    <a className="pg-card" data-tone={tone} data-assigned={classNames ? true : undefined} href={hrefFor.program(p.id)}>
      <div className="pg-card-cover">
        <ProgramPoster program={p} cover={cover} />
        {p.sharesPhasesWith && <span className="pg-outline-tag">Outline only</span>}
        {isCoach && p.status === 'draft' && <span className="pg-outline-tag">Draft</span>}
      </div>
      {classNames && (
        <div className="pg-card-classes"><School size={14} aria-hidden="true" />{isCoach ? 'Running in ' : 'Your class: '}{classNames.join(', ')}</div>
      )}
      <div className="pg-card-body">
        <strong className="pg-card-title">{p.title}</strong>
        <span className="pg-card-theme">{p.category || p.theme}</span>
        {p.subtitle && <p className="pg-card-dq" style={{ WebkitLineClamp: 2, fontWeight: 500 }}>{p.subtitle}</p>}
        <p className="pg-card-dq">{p.drivingQuestion}</p>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.2rem' }}>
            {tags.map((t) => (
              <span key={t} style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: 999, background: 'var(--gh-subtle)', color: 'var(--gh-text-2)' }}>#{t}</span>
            ))}
          </div>
        )}
        <ul className="pg-meta" aria-label="Program facts">
          <li><CalendarDays size={14} aria-hidden="true" />{p.durationWeeks || 12} weeks</li>
          <li><Layers size={14} aria-hidden="true" />{sessions.length} sessions</li>
          <li><Users size={14} aria-hidden="true" />{shortAges(p.targetAgeRange || p.ageBand || '11-16')}</li>
        </ul>
      </div>
      <div className="pg-card-foot">
        {prog ? (
          <span className="pg-card-progress">
            <span className="pb-meter" aria-hidden="true"><span style={{ width: `${prog.pct}%` }} /></span>
            {prog.done} of {prog.total} sessions done
          </span>
        ) : isCoach && issues.length > 0 ? (
          <span className={`gh-badge ${blocking ? 'gh-badge-suspended' : 'gh-badge-pending'}`}>
            {issues.length} {issues.length === 1 ? 'check' : 'checks'} to review
          </span>
        ) : (
          <span className="gh-badge gh-badge-pending">Draft</span>
        )}
        <span className="pg-card-go">Open<ArrowRight size={15} aria-hidden="true" /></span>
      </div>
    </a>
  );
}
