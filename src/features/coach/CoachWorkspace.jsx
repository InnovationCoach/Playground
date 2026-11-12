import { LearnerFeedback } from './LearnerFeedback.jsx';
import { StudentSetupLink } from './StudentInviteDialog.jsx';
import { MediaImage } from '../media/MediaViewer.jsx';
import { useActivityText } from '../activities/builder/activityMessages.js';
import { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, GraduationCap, LayoutDashboard, Search, RefreshCw, ArrowUpRight, FileText, Users, ChevronRight, X, Sparkles, Clock, MessageSquare } from 'lucide-react';
import { auth, db, collection, getDocs, getDoc, doc, query, where, usingEmulators } from '../../firebase.js';
import { TERM, PHASES } from '../pbl/content/pblModel.js';
import { safeLink } from '../pbl/engine/pblProject.js';
import { activityProgress, dateLabel, projectProgress, STEAM_ACTIVITIES } from './progressModel.js';
import { isRosterLearner } from './learners/rosterFilter.js';
import '../admin/admin.css';
import './coachWorkspace.css';
import { CommunityFeed } from '../community/CommunityFeed.jsx';
import { SchoolLearningPanel } from '../school/SchoolLearningPanel.jsx';
import { FALLBACK_LEARNERS } from './fallbackLearners.js';
import { ProgramLibrary } from '../pbl/programs/ProgramLibrary.jsx';
import { SparkReviewDesk, SparkSafeguardingBanner } from '../sparkTutor/SparkReviewDesk.jsx';
import { useSparkSummaries } from '../sparkTutor/useSparkSummaries.js';
import { sparkTutorUiEnabled } from '../sparkTutor/sparkTutorModel.js';
import { LearnerSupervisionView } from './supervision/LearnerSupervisionView.jsx';

const SECTIONS = [['overview', 'Today', LayoutDashboard], ['supervision', 'Studio Supervision', Users], ['pbl', 'PBL programs', BookOpen], ['steam', 'STEAM Activities', FlaskConical], ['academic', 'Academic Progress', GraduationCap], ['goals', 'Learning Goals', FileText], ['calendar', 'School Calendar', LayoutDashboard], ['community', 'Posts for students', FileText]];
// The Spark Review Desk appears only where the companion is switched on.
const VISIBLE_SECTIONS = sparkTutorUiEnabled ? [...SECTIONS, ['spark', 'AI Companion', Sparkles]] : SECTIONS;
const describeError = err => err?.code === 'permission-denied'
  ? 'Your account could not read this class. Ask your administrator to check your coach claims and learner class assignments.'
  : 'Learning records could not be loaded. Check your connection and try again.';

export function CoachWorkspace({ coachUser, onAddStudent, rosterVersion = 0, initialClassId = 'all', onClassChange }) {
  const {t}=useActivityText();
  const [section, setSection] = useState('overview');
  const [classId, setClassId] = useState(initialClassId);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState({ state: 'loading', learners: [], classes: [] });

  useEffect(() => {
    let cancelled = false;
    const commit = value => { if (!cancelled) setData(value); };
    commit({ state: 'loading', learners: [], classes: [] });
    (async () => {
      try {
        if (!auth.currentUser) throw new Error('Sign-in required');
        let claims = {};
        try {
          const res = await auth.currentUser.getIdTokenResult(true);
          claims = res?.claims || {};
        } catch (tokenErr) {
          throw tokenErr;
        }

        const effectiveRole = claims.role;
        const claimIds = Array.isArray(claims.classIds) ? claims.classIds : [];
        const ids = [...new Set(claimIds.filter(id => typeof id === 'string' && id))];

        const isDevPreview = Boolean(import.meta.env?.DEV) && Boolean(usingEmulators) && typeof window !== 'undefined' && Boolean(window.sessionStorage?.getItem('hi:dev_user') || window.localStorage?.getItem('hi:dev_user'));

        if (!['teacher', 'coach'].includes(effectiveRole) || !ids.length) {
          if (isDevPreview) {
            commit({
              state: 'ready',
              learners: FALLBACK_LEARNERS,
              classes: [
                { id: 'class_yr9_climate', name: 'Lower Secondary A (Year 9)' },
                { id: 'class_yr12_eng', name: 'Higher Secondary A (Year 12)' },
                { id: 'class-wpr-11a', name: 'Higher Secondary A' },
                { id: 'class-wpr-12a', name: 'Higher Secondary B' }
              ],
              failedClassIds: [],
              updatedAt: Date.now()
            });
            return;
          }
          commit({ state: 'unassigned', learners: [], classes: [] });
          return;
        }
        let classes = (await Promise.all(ids.map(async id => {
          try {
            const snap = await getDoc(doc(db, 'classes', id));
            const exists = typeof snap?.exists === 'function' ? snap.exists() : !!snap?.exists;
            const cData = exists ? snap.data() : null;
            if (cData?.status === 'archived') return null;
            return { id, name: exists ? cData?.name || id : (id.includes('yr9') ? 'Lower Secondary A (Year 9)' : id.includes('11') ? 'Higher Secondary A' : id.includes('12') ? 'Higher Secondary B' : id) };
          } catch {
            return { id, name: id.includes('yr9') ? 'Lower Secondary A (Year 9)' : id.includes('11') ? 'Higher Secondary A' : id.includes('12') ? 'Higher Secondary B' : id };
          }
        }))).filter(Boolean);
        const activeIds = classes.map(c => c.id);
        if (!activeIds.length) {
          if (isDevPreview) {
            commit({
              state: 'ready',
              learners: FALLBACK_LEARNERS,
              classes: [
                { id: 'class_yr9_climate', name: 'Lower Secondary A (Year 9)' },
                { id: 'class_yr12_eng', name: 'Higher Secondary A (Year 12)' }
              ],
              failedClassIds: [],
              updatedAt: Date.now()
            });
            return;
          }
          commit({ state: 'unassigned', learners: [], classes: [] });
          return;
        }
        const failedBatches = [];
        const snapshots = await Promise.all(Array.from({ length: Math.ceil(activeIds.length / 10) }, (_, i) =>
          getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', activeIds.slice(i * 10, i * 10 + 10)))).catch(err => {
            failedBatches.push({ ids: activeIds.slice(i * 10, i * 10 + 10), error: err });
            return null;
          })));
        if (snapshots.every(snap => !snap)) {
          if (isDevPreview) {
            commit({
              state: 'ready',
              learners: FALLBACK_LEARNERS,
              classes: classes.length ? classes : [
                { id: 'class_yr9_climate', name: 'Lower Secondary A (Year 9)' },
                { id: 'class_yr12_eng', name: 'Higher Secondary A (Year 12)' }
              ],
              failedClassIds: [],
              updatedAt: Date.now()
            });
            return;
          }
          throw failedBatches[0]?.error || new Error('Roster unavailable');
        }
        const unique = new Map();
        snapshots.forEach(snap => {
          if (!snap) return;
          snap.docs.forEach(d => {
            const dData = d.data();
            if (isRosterLearner(dData)) unique.set(d.id, { ...dData, uid: d.id });
          });
        });
        let learners;
        if (unique.size === 0 && isDevPreview) {
          learners = FALLBACK_LEARNERS;
        } else {
          learners = await Promise.all([...unique.values()].map(async learner => {
            try {
              const snap = await getDocs(collection(db, 'users', learner.uid, 'activityProgress'));
              return { ...learner, records: Object.fromEntries(snap.docs.map(d => [d.id, d.data()])) };
            } catch (err) { return { ...learner, records: {}, recordError: describeError(err) }; }
          }));
          learners.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
        }
        commit({ state: 'ready', learners, classes, failedClassIds: failedBatches.flatMap(batch => batch.ids), updatedAt: Date.now() });
      } catch (err) {
        const isDevPreview = Boolean(import.meta.env?.DEV) && Boolean(usingEmulators) && typeof window !== 'undefined' && Boolean(window.sessionStorage?.getItem('hi:dev_user') || window.localStorage?.getItem('hi:dev_user'));
        if (isDevPreview) {
          commit({
            state: 'ready',
            learners: FALLBACK_LEARNERS,
            classes: [
              { id: 'class_yr9_climate', name: 'Lower Secondary A (Year 9)' },
              { id: 'class_yr12_eng', name: 'Higher Secondary A (Year 12)' },
              { id: 'class-wpr-11a', name: 'Higher Secondary A' },
              { id: 'class-wpr-12a', name: 'Higher Secondary B' }
            ],
            failedClassIds: [],
            updatedAt: Date.now()
          });
          return;
        }
        commit({ state: 'error', learners: [], classes: [], error: describeError(err) });
      }
    })();
    return () => { cancelled = true; };
  }, [coachUser?.uid, coachUser?.role, coachUser?.classIds, reload, rosterVersion]);

  // Loaded once for every tab so a safeguarding concern is never hidden on the desk.
  const spark = useSparkSummaries(sparkTutorUiEnabled);
  const scope = data.classes.some(c => c.id === classId) ? classId : 'all';
  const classLearners = data.learners.filter(l => scope === 'all' || (scope.startsWith('cohort:') ? l.cohortId === scope.slice(7) : l.classIds?.includes(scope)));
  const learners = classLearners.filter(l => `${l.displayName || ''} ${l.email || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = learners.find(l => l.uid === selectedId);
  const projects = classLearners.map(l => !l.recordError && projectProgress(l.records)).filter(Boolean);
  const unavailable = classLearners.filter(l => l.recordError).length;
  const pendingSetup = classLearners.filter(l => l.status === 'pending').length;
  const atRisk = classLearners.filter(l => !l.recordError && !projectProgress(l.records)).length;

  return <main className="gh-app cw-app"><div className="cw-page">
    <div className="cw-heading"><div><span className="cw-eyebrow">YOUR COACHING WORKSPACE</span><h1>See the learning. Guide the next step.</h1><p>PBL projects, STEAM investigations and academic learning, in one place.</p></div><div className="cw-tools">{onAddStudent && <button className="gh-btn gh-btn-primary" onClick={onAddStudent}>Add a student</button>}<button className="gh-btn gh-btn-ghost" onClick={() => { setSection('pbl'); setSelectedId(null); }}>{t('openPrograms')}</button><button className="gh-btn gh-btn-ghost" disabled={data.state === 'loading'} onClick={() => setReload(n => n + 1)}><RefreshCw size={16} /> Refresh records</button></div></div>
    <div className="cw-context"><div className="cw-class"><label htmlFor="cw-class">Class</label><select id="cw-class" className="gh-select" value={scope} onChange={e => { setClassId(e.target.value); onClassChange?.(e.target.value); setSelectedId(null); }}><option value="all">All · WLS · WHS</option><option value="cohort:cohort-wls">WLS · Grade 6–8</option><option value="cohort:cohort-whs">WHS · Grade 9–12</option>{data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><strong>Legacy portfolio: {TERM.label}</strong><span className="cw-muted">{` · ${TERM.theme}`}</span></div><span className="cw-updated">{data.updatedAt ? `Loaded ${dateLabel(data.updatedAt)}` : 'Cloud records'}</span></div>
    {section !== 'spark' && <SparkSafeguardingBanner summaries={spark} onOpen={() => { setSection('spark'); setSelectedId(null); }} />}
    <nav className="cw-sections" aria-label="Coach progress sections">{VISIBLE_SECTIONS.map(([id, label, Icon]) => <button key={id} aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setSelectedId(null); }}><Icon size={18} />{label}</button>)}</nav>
    {data.state === 'loading' && <Empty title="Loading your classes" text="Checking access and retrieving learner records." />}
    {data.state === 'unassigned' && <Empty title="Your coach class access needs checking" text="You are signed in, but verified coach and class access is missing. Ask an administrator to check your account’s class assignments."><button className="gh-btn gh-btn-primary" onClick={() => setReload(n => n + 1)}>Check access again</button><small>This checks your current access. It does not change permissions.</small></Empty>}
    {data.state === 'error' && <div role="alert"><Empty title="Class records are unavailable" text={data.error}><button className="gh-btn gh-btn-primary" onClick={() => setReload(n => n + 1)}>Try again</button></Empty></div>}
    {data.failedClassIds?.length > 0 && <p className="cw-warning" role="alert">Some class rosters could not be loaded. Learner totals and summaries are incomplete. Use Refresh records to try again.</p>}
    {section === 'community' && <CommunityFeed />}
    {section === 'spark' && <SparkReviewDesk summaries={spark} classes={data.classes} scope={scope} />}
    {section === 'supervision' && (
      <div style={{ marginTop: '1rem' }}>
        <LearnerSupervisionView
          learners={classLearners}
          submissions={[]}
          onSelectLearnerForStudio={learnerId => {
            window.location.hash = `#/spark?learner=${encodeURIComponent(learnerId)}`;
          }}
          onGoToEvaluation={learnerId => {
            window.location.hash = `#/spark?tab=eval&learner=${encodeURIComponent(learnerId)}`;
          }}
        />
      </div>
    )}
    {section === 'pbl' && <div style={{ marginTop: '1rem' }}><ProgramLibrary isCoach={true} classIds={data.classes.map(c => c.id)} /></div>}
    {['academic','goals','calendar'].includes(section) && <SchoolLearningPanel classScope={scope} hideTabs initialArea={section} />}
    {data.state === 'ready' && ['overview','steam'].includes(section) && <>
      {section === 'overview' && <>
        <div className="cw-today-grid" aria-label="Today focus areas">
          <div className="cw-today-card">
            <div>
              <h3><Clock size={16} /> Pending Reviews & Setup</h3>
              <p>Learners with onboarding setup pending or awaiting review.</p>
              <div className="cw-today-stat">
                <strong>{pendingSetup}</strong>
                <span>{pendingSetup === 1 ? 'learner setup pending' : 'learners setup pending'}</span>
              </div>
            </div>
            <div>
              {pendingSetup > 0 ? (
                <button className="gh-btn gh-btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={() => setSearch('Setup pending')}>
                  Filter Pending Learners
                </button>
              ) : (
                <button className="gh-btn gh-btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={() => setSection('supervision')}>
                  Open Supervision View
                </button>
              )}
            </div>
          </div>

          <div className="cw-today-card">
            <div>
              <h3><Sparkles size={16} /> At-Risk Pacing</h3>
              <p>Learners in this class scope without a current-term PBL project record.</p>
              <div className="cw-today-stat">
                <strong>{atRisk}</strong>
                <span>{atRisk === 1 ? 'learner needs check-in' : 'learners need check-in'}</span>
              </div>
            </div>
            <div>
              <button className="gh-btn gh-btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={() => setSection('pbl')}>
                Explore PBL Programs
              </button>
            </div>
          </div>

          <div className="cw-today-card">
            <div>
              <h3><MessageSquare size={16} /> Learner Messages</h3>
              <p>Communicate directly with learners, share guidance, and respond to questions.</p>
              <div className="cw-today-stat">
                <strong>Direct</strong>
                <span>Coach-to-student inbox</span>
              </div>
            </div>
            <div>
              <a href="#/messages" className="gh-btn gh-btn-ghost" style={{ width: '100%', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MessageSquare size={14} /> Open Messages
              </a>
            </div>
          </div>
        </div>

        <div className="cw-summary">
          <Stat icon={Users} label={data.failedClassIds?.length ? "Learners loaded (incomplete)" : "Learners in this view"} value={classLearners.length} caption="Assigned class roster" />
          <Stat icon={BookOpen} label="PBL project records" value={projects.length} caption="Current-term cloud records" emptyHint="None yet. Records appear once learners start in PBL Studio." />
          <Stat icon={FileText} label="Evidence entries" value={projects.reduce((n, p) => n + p.project.evidence.length, 0)} caption="Recorded evidence, not an approval count" emptyHint="None yet. Evidence appears here as learners add it." />
        </div>
        <div className="cw-domain-grid">
          {[['pbl', BookOpen, 'Follow the project journey', 'Understand each learner’s phase, task checks and evidence.', 'Open PBL programs'],
            ['steam', FlaskConical, 'Look inside STEAM work', 'Review recorded investigations and hands-on activity work.', 'Open STEAM Activities'],
            ['academic', GraduationCap, 'Academic learning', 'Review connected course and assessment records.', 'Open Academic Progress']].map(([id, Icon, title, text, action]) =>
            <button key={id} onClick={() => { setSection(id); }}><span className={`cw-domain-icon cw-${id}`}><Icon size={22} /></span><strong>{title}</strong><p>{text}</p><span>{action}<ArrowUpRight size={16} /></span></button>
          )}
        </div>
      </>}
      {unavailable > 0 && <p className="cw-warning" role="status">{unavailable} learner record sets could not be read. PBL summaries include only available records.</p>}
      <div className="cw-workspace"><section className="cw-roster"><div className="cw-roster-heading"><div><h2>{section === 'overview' ? 'Your learners' : section === 'pbl' ? 'Existing Sustainable Futures portfolios' : 'STEAM activity progress'}</h2><p>{learners.length} of {classLearners.length} learners · Select a learner to inspect work</p></div><label className="cw-search"><Search size={16} /><span className="cw-sr">Search learners</span><input type="search" placeholder="Search learners" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
        {!classLearners.length ? <Empty title={data.failedClassIds?.length ? 'Class roster is incomplete' : 'No learners found in this class scope'} text="If learners should already be here, ask your administrator to verify their class membership." /> : !learners.length ? <Empty title="No matching learners" text="Try another name or clear your search."><button className="gh-btn gh-btn-ghost" onClick={() => setSearch('')}>Clear search</button></Empty> : <div className="cw-table-scroll"><table><caption className="cw-sr">Learner progress for {TERM.label}</caption><thead><tr><th>Learner</th><th>{section === 'steam' ? 'STEAM records' : 'PBL phase'}</th><th>{section === 'steam' ? 'Recorded completion' : 'Evidence'}</th><th>Action</th></tr></thead><tbody>{learners.map(l => {
          const pbl = projectProgress(l.records), activities = STEAM_ACTIVITIES.filter(([id]) => l.records[id]);
          return <tr key={l.uid} className={selectedId === l.uid ? 'cw-selected' : ''}><td><strong>{l.displayName || l.email || 'Learner'}</strong>{l.status === 'pending' && <span className="cw-pill">Setup pending</span>}<small>{l.groupName || data.classes.filter(c => l.classIds?.includes(c.id)).map(c => c.name).join(', ')}</small></td><td>{l.recordError ? 'Unavailable' : section === 'steam' ? `${activities.length} activity records` : pbl ? PHASES.find(p => p.id === pbl.project.currentPhase)?.title : <span className="cw-muted">No current-term record</span>}</td><td>{l.recordError ? '—' : section === 'steam' ? `${activities.filter(([id]) => l.records[id].completed === true).length} marked complete` : pbl ? `${pbl.project.evidence.length} ${pbl.project.evidence.length === 1 ? "entry" : "entries"}` : '—'}</td><td><button className="cw-review" aria-label={`Review ${l.displayName || l.email || 'learner'}`} onClick={() => setSelectedId(l.uid)}>Review <ChevronRight size={15} /></button></td></tr>;
        })}</tbody></table></div>}
      </section><aside className="cw-inspector" aria-label="Learner work review">{selected ? <LearnerReview key={`${selected.uid}-${section}`} learner={selected} section={section} onClose={() => setSelectedId(null)} /> : <div className="cw-inspector-empty"><BookOpen size={28} /><h3>Start with a learner</h3><p>Select Review to see evidence alongside the class roster.</p><small>Progress checks describe recorded work. They do not replace your assessment.</small></div>}</aside></div>
    </>}
    <p className="cw-footnote">Only cloud-saved learning is visible here. Device-only work may not have synced yet. SO₂ Filter Lab progress will be added separately.</p>
  </div></main>;
}

function Empty({ title, text, children }) { return <div className="cw-empty" role="status"><Users size={28} /><h2>{title}</h2><p>{text}</p>{children}</div>; }
// A zero shows what to do next instead of looking like a failure.
function Stat({ icon: Icon, label, value, caption, emptyHint }) { return <div className="cw-stat"><div><Icon size={18} />{label}</div><strong>{value}</strong><small>{value === 0 && emptyHint ? emptyHint : caption}</small></div>; }

function LearnerReview({ learner, section, onClose }) {
  const pbl = projectProgress(learner.records);
  return <div><div className="cw-review-header"><div><span className="cw-eyebrow">LEARNER WORK</span><h2>{learner.displayName || learner.email || 'Learner'}</h2></div><button className="cw-close" aria-label="Close learner review" onClick={onClose}><X size={19} /></button></div>
    {learner.recordError ? <p role="alert" className="cw-warning">{learner.recordError}</p> : section === 'steam' ? <><p className="cw-muted">Completion appears only when explicitly recorded.</p>{STEAM_ACTIVITIES.map(([id, name]) => {
      const record = learner.records[id], status = activityProgress(id, record);
      return <section className="cw-activity" key={id}><h3>{name}</h3><span className="cw-pill">{status.status}</span><p>{status.detail}</p>{record && <><small>{dateLabel(record.updatedAt)}</small><ActivityEvidence id={id} record={record} /></>}</section>;
    })}</> : !pbl ? <Empty title="No current-term project record" text="Check whether this learner has started a project and synced it to the cloud." /> : <>
      <p className="cw-muted">{TERM.label} · {dateLabel(pbl.project.updatedAt)}</p><div className="cw-readiness"><strong>{pbl.readiness.done}/{pbl.readiness.total}</strong><span>Readiness checks met<small>Learner evidence checks, not coach approval</small></span></div>
      <h3 className="cw-section-title">Project phases</h3><ul className="cw-phase-list">{pbl.phases.map(p => <li key={p.id}><span>{p.title}{p.id === pbl.project.currentPhase && <small>Current phase</small>}</span><span>{p.tasksDone}/{p.tasksTotal} tasks<small>{p.evidenceCount} evidence · {p.complete ? 'Checks met' : 'Checks remaining'}</small></span></li>)}</ul>
      {pbl.project.problem.hmw && <section className="cw-problem"><h3>The learner’s question</h3><p>{pbl.project.problem.hmw}</p>{pbl.project.problem.criteria && <><strong>Success criteria</strong><p>{pbl.project.problem.criteria}</p></>}</section>}
      <h3 className="cw-section-title">Evidence portfolio · {pbl.project.evidence.length}</h3>{!pbl.project.evidence.length && <p className="cw-muted">No evidence entries recorded yet.</p>}
      {[...pbl.project.evidence].sort((a, b) => b.createdAt - a.createdAt).map(e => <details className="cw-evidence" key={e.id}><summary><strong>{e.title}</strong><small>{PHASES.find(p => p.id === e.phase)?.title} · {e.kind}</small></summary><small>{dateLabel(e.createdAt)}</small><p className="cw-evidence-body">{e.body || 'No written description.'}</p>{safeLink(e.link) && <a href={safeLink(e.link)} target="_blank" rel="noopener noreferrer">Open linked evidence <ArrowUpRight size={14} /></a>}{e.ai && <div><strong>AI reflection</strong><p>Asked: {e.ai.asked}</p><p>Received: {e.ai.gave}</p><p>Kept: {e.ai.kept}</p></div>}</details>)}
      <details className="cw-evidence"><summary>Readiness checklist</summary>{pbl.readiness.checks.map(c => <p key={c.id}>{c.ok ? 'Met' : 'Remaining'} · {c.label}</p>)}</details><p className="cw-footnote">Coach approval is not available in this view yet.</p>
    </>}
    {!learner.recordError && <LearnerFeedback learnerUid={learner.uid} workId={section === 'steam' ? 'steam-review' : `pbl-${TERM.id}`} />}
    {learner.status === 'pending' && <StudentSetupLink learnerUid={learner.uid} />}
  </div>;
}

function ActivityEvidence({ id, record }) {
  const hasValue = value => value !== null && value !== undefined && value !== '' && (typeof value === 'string' || typeof value === 'number');
  if (id === 'solar-car') return <div className="cw-work-details">
    {record.teamName && <p>Team: {record.teamName}</p>}
    {(Array.isArray(record.runs) ? record.runs : []).filter(r => Number(r.seconds) > 0).map((r, i) => <p key={r.id || i}>Timed run {i + 1}: {r.seconds} seconds</p>)}
    {(Array.isArray(record.parts) ? record.parts : []).filter(p => hasValue(p.grams)).map((p, i) => <p key={p.id || i}>{p.name || 'Part'}: {p.grams} g</p>)}
    {record.reflection && <><strong>Learner reflection</strong><p className="cw-evidence-body">{record.reflection}</p></>}
  </div>;
  if (id === 'plant-lab') return <div>{(Array.isArray(record.records) ? record.records : []).map((r, i) => <details className="cw-evidence" key={r.id || i}><summary>{r.title || `Lab entry ${i + 1}`}</summary>{r.stage && <p>Investigation stage: {r.stage}</p>}{r.hypothesis?.choice && <p>Hypothesis: {r.hypothesis.choice}</p>}{r.outcome?.words && <p className="cw-evidence-body">Conclusion: {r.outcome.words}</p>}{r.notes && <p className="cw-evidence-body">{r.notes}</p>}{/^data:image\/(png|jpeg|webp);base64,/.test(r.drawingDataUrl || '') && <MediaImage className="cw-drawing" src={r.drawingDataUrl} alt={`Learner drawing for ${r.title || 'lab entry'}`} />}{!r.notes && !r.drawingDataUrl && !r.outcome?.words && <p>Investigation saved. A written conclusion is not available yet.</p>}</details>)}</div>;
  const metrics = { cooling: 'Cooling (°C)', cost: 'Strategy cost', utci: 'UTCI (°C)', survivalDays: 'Survival days', resilience: 'Resilience (%)', hazard: 'Hazard', trust: 'Trust (%)', stage: 'Coding stage', magnification: 'Magnification' };
  return <div className="cw-work-details">{Object.entries(metrics).filter(([key]) => hasValue(record[key])).map(([key, label]) => <p key={key}>{label}: {record[key]}</p>)}{hasValue(record.notes) && <p className="cw-evidence-body">{record.notes}</p>}{hasValue(record.reflection) && <p className="cw-evidence-body">{record.reflection}</p>}{hasValue(record.codeSnippet) && <details><summary>Learner code</summary><pre>{record.codeSnippet}</pre></details>}</div>;
}
