import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Copy, Check, RefreshCw, Ban, Presentation, X, ExternalLink, Library, Users } from 'lucide-react';
import { PROGRAMS, programById } from '../pbl/programs/catalog.js';
import { LIBRARY_PROGRAMS } from '../pbl/programs/libraryProgramsData.js';
import { db, collection, getDocs } from '../../firebase.js';
import { hrefFor } from '../../app/routes.js';
import { loadClasses, issueCode, revokeCode, setClassProgram, explainError } from './classCodes.js';
import './classPanel.css';

export function cohortForClass(cls) {
  if (!cls) return 'WLS';
  const rawCohort = String(cls.cohort || cls.cohortId || '').toUpperCase();
  if (rawCohort.includes('WHS') || rawCohort.includes('HIGH') || rawCohort.includes('SENIOR')) {
    return 'WHS';
  }
  if (rawCohort.includes('WLS') || rawCohort.includes('LOW') || rawCohort.includes('JUNIOR')) {
    return 'WLS';
  }
  const str = `${cls.name || ''} ${cls.id || ''}`.toLowerCase();
  // Year 10, 11, 12, WPR 11, 12, etc. -> Higher Secondary (WHS, Ages 15-18)
  if (/\b(year\s*1[0-2]|yr\s*1[0-2]|1[0-2][a-z]?|higher|whs|senior)\b/i.test(str)) {
    return 'WHS';
  }
  // Default to Lower Secondary (WLS, Ages 11-14)
  return 'WLS';
}

/**
 * "My classes" on the coach dashboard: which PBL program each class runs and
 * the code learners use to join it. Generate, rotate and revoke all go
 * straight to Firestore under the rules in firestore.rules (classCodes).
 */
export function ClassProgramsPanel({ coachUser }) {
  const classIds = coachUser?.classIds || [];
  const [classes, setClasses] = useState(null);
  const [presenting, setPresenting] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState(() => PROGRAMS);
  const [cohortFilter, setCohortFilter] = useState('all'); // 'all' | 'WLS' | 'WHS'

  const reload = useCallback(async () => {
    setClasses(await loadClasses(classIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIds.join('|')]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPblPrograms() {
      try {
        const snap = await getDocs(collection(db, 'pbl_programs'));
        const map = new Map();
        snap.forEach((d) => {
          const data = d.data();
          map.set(d.id, {
            id: d.id,
            title: data.title || d.id,
            identity: { short: (data.title || d.id).slice(0, 24) },
            source: data.source || 'studio',
            ageBand: data.ageBand || data.targetAgeRange || '11-16'
          });
        });

        // Add prototype PROGRAMS and LIBRARY_PROGRAMS if not already present
        for (const p of PROGRAMS) {
          if (!map.has(p.id)) map.set(p.id, p);
        }
        for (const p of LIBRARY_PROGRAMS) {
          if (!map.has(p.id)) {
            map.set(p.id, {
              id: p.id,
              title: p.title,
              identity: { short: p.title.slice(0, 24) },
              source: 'library',
              ageBand: p.ageBand || p.targetAgeRange || '11-16'
            });
          }
        }
        if (!cancelled) setAvailablePrograms(Array.from(map.values()));
      } catch (err) {
        console.warn('[ClassProgramsPanel] Could not load pbl_programs from Firestore:', err?.message);
      }
    }
    fetchPblPrograms();
    return () => { cancelled = true; };
  }, []);

  const patch = (id, next) => setClasses((list) => list.map((c) => (c.id === id ? { ...c, ...next } : c)));

  const classList = classes || [];
  const wlsCount = classList.filter((c) => cohortForClass(c) === 'WLS').length;
  const whsCount = classList.filter((c) => cohortForClass(c) === 'WHS').length;
  const filteredClasses = classList.filter((c) => cohortFilter === 'all' || cohortForClass(c) === cohortFilter);

  return (
    <section className="cp-panel" aria-labelledby="cp-title">
      <div className="cp-head">
        <div>
          <h2 id="cp-title"><Users size={20} aria-hidden="true" />My classes</h2>
          <p>Choose the PBL program each class runs, and give learners the code to join it.</p>
        </div>
        <a className="cp-btn cp-btn-ghost" href={hrefFor.pbl('programs')}><Library size={16} aria-hidden="true" />Program library</a>
      </div>

      {classes && classes.length > 0 && (
        <div className="cp-cohort-filter-bar" role="group" aria-label="Filter classes by cohort">
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gh-text-3)', textTransform: 'uppercase' }}>
            Cohort:
          </span>
          <button
            type="button"
            className={`cp-cohort-filter-btn ${cohortFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setCohortFilter('all')}
          >
            All Cohorts ({classes.length})
          </button>
          <button
            type="button"
            className={`cp-cohort-filter-btn ${cohortFilter === 'WLS' ? 'is-active' : ''}`}
            onClick={() => setCohortFilter('WLS')}
          >
            Lower Secondary &ldquo;WLS&rdquo; ({wlsCount}) · Ages 11–14
          </button>
          <button
            type="button"
            className={`cp-cohort-filter-btn ${cohortFilter === 'WHS' ? 'is-active' : ''}`}
            onClick={() => setCohortFilter('WHS')}
          >
            Higher Secondary &ldquo;WHS&rdquo; ({whsCount}) · Ages 15–18
          </button>
        </div>
      )}

      {classes === null ? (
        <p className="cp-muted" role="status">Loading your classes…</p>
      ) : classes.length === 0 ? (
        <p className="cp-muted">You have no classes assigned yet. Ask an administrator to add you to a class.</p>
      ) : filteredClasses.length === 0 ? (
        <p className="cp-muted">No classes found in this cohort filter.</p>
      ) : (
        <ul className="cp-list">
          {filteredClasses.map((c) => (
            <li key={c.id}>
              <ClassRow
                cls={c}
                uid={coachUser.uid}
                availablePrograms={availablePrograms}
                onChange={(next) => patch(c.id, next)}
                onPresent={() => setPresenting(c)}
              />
            </li>
          ))}
        </ul>
      )}

      {presenting && <PresentCode cls={presenting} onClose={() => setPresenting(null)} />}
    </section>
  );
}

function ClassRow({ cls, uid, availablePrograms = PROGRAMS, onChange, onPresent }) {
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const program = availablePrograms.find((p) => p.id === cls.programId) || programById(cls.programId);
  const cohort = cohortForClass(cls);
  const isWLS = cohort === 'WLS';

  if (cls.missing || cls.error) {
    return (
      <div className="cp-row cp-row-bad">
        <strong>{cls.id}</strong>
        <span className="cp-muted">{cls.missing ? 'This class no longer exists.' : 'This class could not be loaded.'}</span>
      </div>
    );
  }

  async function run(kind, fn, done) {
    setBusy(kind);
    setMessage(null);
    setConfirm(null);
    try {
      await fn();
      setMessage({ tone: 'ok', text: done });
    } catch (err) {
      setMessage({ tone: 'error', text: explainError(err) });
    } finally {
      setBusy(null);
    }
  }

  const generate = () => run('code', async () => onChange({ joinCode: await issueCode(cls, uid) }),
    cls.joinCode ? 'New code issued. The old code no longer works.' : 'Code issued. Learners can join now.');
  const revoke = () => run('code', async () => { await revokeCode(cls); onChange({ joinCode: null }); },
    'Code revoked. Nobody can join until you issue a new one.');
  const chooseProgram = (id) => run('program', async () => { await setClassProgram(cls, id); onChange({ programId: id || null }); },
    id ? `${cls.name} now runs ${(availablePrograms.find((p) => p.id === id) || programById(id))?.title || 'this program'}.` : 'Program removed from this class.');

  async function copy() {
    try {
      await navigator.clipboard.writeText(cls.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the code is on screen anyway */ }
  }

  return (
    <div className="cp-row">
      <div className="cp-class">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <strong>{cls.name}</strong>
          <span className={`cp-cohort-badge ${isWLS ? 'cp-cohort-wls' : 'cp-cohort-whs'}`}>
            {isWLS ? 'Lower Secondary · WLS (Ages 11–14)' : 'Higher Secondary · WHS (Ages 15–18)'}
          </span>
        </div>
        <label className="cp-field">
          <span>PBL program</span>
          <select value={cls.programId || ''} disabled={busy === 'program'} onChange={(e) => chooseProgram(e.target.value)}>
            <option value="">No program yet</option>
            <optgroup label="Lower Secondary (WLS) · Ages 11–14">
              {availablePrograms.filter((p) => !p.ageBand || p.ageBand.includes('11') || p.ageBand.includes('14') || p.targetAgeRange?.includes('11')).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.identity?.short}{p.source === 'studio' ? ' (Studio)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Higher Secondary (WHS) · Ages 15–18">
              {availablePrograms.filter((p) => p.ageBand?.includes('15') || p.ageBand?.includes('16') || p.ageBand?.includes('18') || p.targetAgeRange?.includes('15') || (!p.ageBand && !p.targetAgeRange)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.identity?.short}{p.source === 'studio' ? ' (Studio)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        {program && (
          <a className="cp-link" href={hrefFor.program(program.id)}>
            {program.title}<ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
        {cls.programId && !program && <span className="cp-warn">Assigned program “{cls.programId}” is not in the library.</span>}
      </div>

      <div className="cp-code">
        <span className="cp-code-label"><KeyRound size={14} aria-hidden="true" />Join code</span>
        {cls.joinCode ? (
          <>
            <span className="cp-code-value" aria-label={`Join code ${cls.joinCode.split('').join(' ')}`}>{cls.joinCode}</span>
            <div className="cp-actions">
              <button type="button" className="cp-btn" onClick={copy}>
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="cp-btn" onClick={onPresent}><Presentation size={15} aria-hidden="true" />Show to class</button>
              <button type="button" className="cp-btn" disabled={!!busy} onClick={() => setConfirm('rotate')}><RefreshCw size={15} aria-hidden="true" />New code</button>
              <button type="button" className="cp-btn cp-btn-danger" disabled={!!busy} onClick={() => setConfirm('revoke')}><Ban size={15} aria-hidden="true" />Revoke</button>
            </div>
          </>
        ) : (
          <>
            <span className="cp-muted">No code - learners cannot join this class.</span>
            <div className="cp-actions">
              <button type="button" className="cp-btn cp-btn-primary" disabled={!!busy} onClick={generate}>
                <KeyRound size={15} aria-hidden="true" />{busy === 'code' ? 'Generating…' : 'Generate code'}
              </button>
            </div>
          </>
        )}

        {confirm && (
          <div className="cp-confirm" role="alertdialog" aria-label="Confirm">
            <span>
              {confirm === 'rotate'
                ? `Replace ${cls.joinCode}? It stops working immediately. Learners already in the class stay in it.`
                : `Revoke ${cls.joinCode}? Nobody can join until you issue a new code. Learners already in the class stay in it.`}
            </span>
            <div className="cp-actions">
              <button type="button" className={`cp-btn ${confirm === 'revoke' ? 'cp-btn-danger' : 'cp-btn-primary'}`} onClick={confirm === 'rotate' ? generate : revoke}>
                {confirm === 'rotate' ? 'Replace code' : 'Revoke code'}
              </button>
              <button type="button" className="cp-btn cp-btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {message && <p className={`cp-msg cp-msg-${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</p>}
    </div>
  );
}

/** Full-screen code for the projector or whiteboard. */
function PresentCode({ cls, onClose }) {
  const program = programById(cls.programId);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cp-present" role="dialog" aria-modal="true" aria-label={`Join code for ${cls.name}`}>
      <button type="button" className="cp-present-close" onClick={onClose} aria-label="Close"><X size={28} aria-hidden="true" /></button>
      <p className="cp-present-kicker">Join {cls.name}</p>
      {program && <p className="cp-present-program">{program.title}</p>}
      <p className="cp-present-code">{cls.joinCode || 'No code'}</p>
      <ol className="cp-present-steps">
        <li>Sign in to WeLearn SPARK (new? type the code when you sign up)</li>
        <li>On Home, find <strong>Join your class</strong></li>
        <li>Type the code - capitals and the dash are optional</li>
      </ol>
    </div>
  );
}
