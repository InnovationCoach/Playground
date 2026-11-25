import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, CalendarDays, Layers, Users, TriangleAlert, ArrowRight, School, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { getAllPrograms, normaliseProgram, programById, COACH_PLATFORM_NOTES, SCHEDULE, shortAges, BUILT_IN_PROGRAM_IDS } from './catalog.js';
import { isProgramTrashed, canRemoveProgram, trashProgram, restoreProgram, purgeExpiredPrograms, listTrashedPrograms, TRASH_DAYS } from '../../coach/programs/programTrash.js';
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
  const [programsList, setProgramsList] = useState(() => { purgeExpiredPrograms(); return getAllPrograms(); });
  const [remoteRaw, setRemoteRaw] = useState([]);
  const [view, setView] = useState('library'); // 'library' | 'trash'
  const [confirming, setConfirming] = useState(null);
  const [notice, setNotice] = useState(null);
  const [trashTick, setTrashTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const reload = () => {
      if (!cancelled) { setProgramsList(getAllPrograms()); setTrashTick((n) => n + 1); }
    };
    window.addEventListener('pbl-custom-programs-changed', reload);
    window.addEventListener('pbl-program-published', reload);

    async function fetchFromFirestore() {
      try {
        const snap = await getDocs(collection(db, 'pbl_programs'));
        if (cancelled || !snap) return;
        const remote = [];
        const raw = [];
        snap.forEach((d) => {
          const data = d.data();
          if (!data) return;
          raw.push({ id: d.id, ...data });
          if (!isProgramTrashed({ id: d.id, ...data })) remote.push(normaliseProgram({ id: d.id, ...data }));
        });
        if (!cancelled) setRemoteRaw(raw);
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
  const shown = useMemo(() => programsList.filter((p) => !isProgramTrashed(p) && (isCoach || p.status !== 'draft') && (!q
    || [p.title, p.theme, p.category, p.drivingQuestion, p.subtitle, ...(Array.isArray(p.tags) ? p.tags : [])].some((t) => t?.toLowerCase().includes(q)))), [programsList, q, isCoach]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trashed = useMemo(() => (isCoach ? listTrashedPrograms(remoteRaw).filter((t) => canRemoveProgram(t, uid, BUILT_IN_PROGRAM_IDS)) : []), [isCoach, remoteRaw, uid, trashTick, programsList]);

  const askRemove = useCallback((p) => {
    setNotice(null);
    setConfirming(p);
  }, []);

  const confirmRemove = async () => {
    const p = confirming;
    setConfirming(null);
    if (!p) return;
    const res = await trashProgram(p, uid);
    setRemoteRaw((list) => list.map((r) => (r.id === p.id ? { ...r, deletedAt: Date.now(), purgeAt: res.purgeAt } : r)));
    setProgramsList(getAllPrograms().filter((x) => !isProgramTrashed(x)));
    setNotice({ id: p.id, title: p.title, kind: 'trashed' });
  };

  const restore = async (id, title) => {
    const res = await restoreProgram(id);
    if (!res.ok) { setNotice({ id, title, kind: 'expired' }); return; }
    setRemoteRaw((list) => list.map((r) => (r.id === id ? { ...r, deletedAt: null, purgeAt: null } : r)));
    const back = programById(id);
    setProgramsList(() => {
      const map = new Map(programsList.map((x) => [x.id, x]));
      if (back) map.set(id, { ...back, deletedAt: null, purgeAt: null });
      getAllPrograms().forEach((x) => map.set(x.id, x));
      return [...map.values()];
    });
    setNotice({ id, title, kind: 'restored' });
  };

  if (isCoach && view === 'trash') {
    return (
      <div className="pg-library">
        <div className="pg-library-head">
          <div>
            <button type="button" className="gh-btn gh-btn-ghost pg-trash-back" onClick={() => setView('library')}>
              <ArrowLeft size={16} aria-hidden="true" />Program library
            </button>
            <h2 className="pb-h2">Trash</h2>
            <p className="pb-lead">Programs you removed stay here for {TRASH_DAYS} days. Restore one to put it back in the library; after {TRASH_DAYS} days SPARK removes it for good.</p>
          </div>
        </div>
        <Notice notice={notice} onUndo={restore} onClose={() => setNotice(null)} />
        {trashed.length === 0 ? (
          <p className="pb-empty">Trash is empty.</p>
        ) : (
          <ul className="pg-trash-list">
            {trashed.map((t) => (
              <li key={t.id} className="pg-trash-row">
                <span className="pb-grow">
                  <strong>{t.title}</strong>
                  <span className="pg-trash-when">
                    Removed {new Date(t.deletedAt).toLocaleDateString()} · {t.daysLeft === 1 ? 'Deleted for good tomorrow' : `Deleted for good in ${t.daysLeft} days`}
                  </span>
                </span>
                <button type="button" className="gh-btn" onClick={() => restore(t.id, t.title)}>
                  <RotateCcw size={15} aria-hidden="true" />Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

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
        <div className="pg-library-tools">
          <label className="gh-input-icon pg-search">
            <Search size={16} aria-hidden="true" />
            <input className="gh-input" type="search" placeholder="Search programs" value={query}
                   onChange={(e) => setQuery(e.target.value)} aria-label="Search programs" />
          </label>
          {isCoach && (
            <button type="button" className="gh-btn gh-btn-ghost pg-trash-open" onClick={() => { setNotice(null); setView('trash'); }}>
              <Trash2 size={16} aria-hidden="true" />Trash{trashed.length > 0 ? ` (${trashed.length})` : ''}
            </button>
          )}
        </div>
      </div>

      <Notice notice={notice} onUndo={restore} onClose={() => setNotice(null)} />

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
          {shown.map((p) => (
            <li key={p.id} className="pg-card-wrap">
              <ProgramCard program={p} uid={uid} isCoach={isCoach} classNames={byProgram[p.id]} cover={coverFor(p, classCovers)} />
              {isCoach && canRemoveProgram(p, uid, BUILT_IN_PROGRAM_IDS) && (
                <button type="button" className="pg-card-remove" onClick={() => askRemove(p)}
                        aria-label={`Remove ${p.title}`} title="Remove program">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <RemoveDialog program={confirming} runningIn={byProgram[confirming.id]}
                      onCancel={() => setConfirming(null)} onConfirm={confirmRemove} />
      )}
    </div>
  );
}

function Notice({ notice, onUndo, onClose }) {
  if (!notice) return null;
  const text = notice.kind === 'trashed'
    ? `“${notice.title}” moved to Trash. It will be deleted for good in ${TRASH_DAYS} days.`
    : notice.kind === 'restored'
      ? `“${notice.title}” is back in the library.`
      : `“${notice.title}” was already deleted for good and cannot be restored.`;
  return (
    <div className="pb-note pg-trash-notice" role="status">
      <span className="pb-grow">{text}</span>
      {notice.kind === 'trashed' && (
        <button type="button" className="gh-btn gh-btn-ghost" onClick={() => onUndo(notice.id, notice.title)}>Undo</button>
      )}
      <button type="button" className="gh-btn gh-btn-ghost" onClick={onClose} aria-label="Dismiss">✕</button>
    </div>
  );
}

/** Confirm before removing. A program a class is running cannot be removed until the class moves to another program. */
function RemoveDialog({ program, runningIn, onCancel, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && typeof d.showModal === 'function' && !d.open) d.showModal();
  }, []);
  const blocked = Array.isArray(runningIn) && runningIn.length > 0;
  return (
    <dialog ref={ref} className="pg-remove-dialog gh-app" aria-labelledby="pg-remove-title" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <div className="pg-remove-icon"><Trash2 size={20} aria-hidden="true" /></div>
      <h2 id="pg-remove-title">{blocked ? 'This program is running' : `Remove “${program.title}”?`}</h2>
      {blocked ? (
        <p>{runningIn.join(', ')} {runningIn.length === 1 ? 'is' : 'are'} doing this program. Choose another program for {runningIn.length === 1 ? 'that class' : 'those classes'} on your dashboard first, so learners do not lose their work.</p>
      ) : (
        <p>It moves to Trash and leaves the library for everyone. You can restore it from Trash for {TRASH_DAYS} days; after that SPARK deletes it for good.</p>
      )}
      <div className="pg-remove-foot">
        <button type="button" className="gh-btn" onClick={onCancel} autoFocus>{blocked ? 'OK' : 'Cancel'}</button>
        {!blocked && (
          <button type="button" className="gh-btn gh-btn-danger" onClick={onConfirm}>
            <Trash2 size={15} aria-hidden="true" />Move to Trash
          </button>
        )}
      </div>
    </dialog>
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
