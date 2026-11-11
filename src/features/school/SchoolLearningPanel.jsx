import { ProgramMediaEditor } from './programs/ProgramMediaEditor.jsx';
import { LearningMedia } from './media/LearningMedia.jsx';
import { MEDIA_ACCEPT, MEDIA_HINT, learningMediaType, validateMediaFiles } from './media/mediaSpec.js';
import { ProgramDetailsEditor } from './programs/ProgramDetailsEditor.jsx';
import { ProgramMaker } from './programs/ProgramMaker.jsx';
import { useActivityText } from '../activities/builder/activityMessages.js';
import { ActivityCoachTools, ActivityLesson } from '../activities/builder/ActivityEntry.jsx';
import { SimulationBuilder, SimulationLab } from './SimulationLab.jsx';
import { CompactLessonList } from './lessons/CompactLessonList.jsx';
import { CoachLessonEditor } from './lessons/CoachLessonEditor.jsx';
import { LearnerLessonView } from './lessons/LearnerLessonView.jsx';
import { emptyLesson, normalizeLesson } from './lessons/lessonModel.js';
import { useEffect, useState } from 'react';
import { auth, storage } from '../../firebase.js';
import { BookOpen, CalendarDays, Target, GraduationCap, RefreshCw, Sparkles, HeartHandshake } from 'lucide-react';
import { PROGRAM_CATALOGUE, programById } from '../pbl/content/programCatalogue.js';
import { useSchoolResource, schoolPath, mutateSchool, serviceMessage } from './useSchoolWorkspace.js';
import { QuestArea } from '../quest/QuestHome.jsx';
import { QuestSummary } from '../quest/QuestSummary.jsx';
import { LearnerPathway } from '../quest/LearnerPathway.jsx';
import { W2eCoachSupportPanel } from './W2eCoachSupportPanel.jsx';
import './schoolWorkspace.css';
import { CALENDAR_REFERENCE } from './calendarReference.js';
const areas = [
  ['home', 'Studio Home', Sparkles],
  ['programs', 'PBL Programs', BookOpen],
  ['goals', 'Learning Goals', Target],
  ['academic', 'Academic Progress', GraduationCap],
  ['calendar', 'School Calendar', CalendarDays]
];
// Tab names follow what each role actually sees in that area.
function areaLabel(id, role) {
  if (role === 'parent' && id === 'home') return 'Family overview';
  if (role === 'parent' && id === 'programs') return 'PBL Progress';
  if (id === 'home' && ['admin', 'supervisor', 'teacher', 'coach'].includes(role)) return 'Learner support';
  return areas.find(([areaId]) => areaId === id)?.[1];
}
const today = () => new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Bangkok'
});
const message = error => error && <p className="sw-error" role="alert">{serviceMessage(error)}</p>;
function Field({
  label,
  children
}) {
  return <label className="sw-field"><span>{label}</span>{children}</label>;
}
function Feedback({
  state
}) {
  return <>{message(state.error)}{state.success && <p className="sw-success" role="status">{state.success}</p>}</>;
}
function useMutation(onDone) {
  const [state, setState] = useState({
    busy: false,
    error: null,
    success: ''
  });
  async function run(task, success) {
    setState({
      busy: true,
      error: null,
      success: ''
    });
    try {
      const result = await task();
      setState({
        busy: false,
        error: null,
        success
      });
      onDone?.();
      return result;
    } catch (error) {
      setState({
        busy: false,
        error,
        success: ''
      });
      return null;
    }
  }
  return [state, run];
}
export function SchoolLearningPanel({
  initialArea = 'programs',
  hideTabs = false,
  classScope = 'all',
  learnerName = ''
}) {
  const context = useSchoolResource('/api/learning-context');
  const [schoolId, setSchoolId] = useState(''),
    [area, setArea] = useState(initialArea),
    [programChoice, setProgramChoice] = useState('');
  useEffect(() => setArea(initialArea), [initialArea]);
  const schools = context.data?.schools || [],
    school = schools.find(s => s.id === schoolId) || schools[0];
  const classes = (context.data?.classes || []).filter(c => c.schoolId === school?.id && (classScope === 'all' || c.id === classScope)),
    role = context.data?.role;
  return <section className="sw-panel gh-app" aria-label="School learning workspace">
    <header className="sw-heading"><div><span className="sw-kicker">WELEARN · SCHOOL LEARNING</span><h2>{areaLabel(area, role)}</h2></div><div className="sw-actions">{schools.length > 1 && <Field label="School"><select value={school?.id || ''} onChange={e => setSchoolId(e.target.value)}>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}<button className="gh-btn gh-btn-ghost" onClick={context.reload}><RefreshCw size={16} />Check access</button></div></header>
    {!hideTabs && <nav className="sw-tabs" aria-label="School learning sections">{areas.map(([id, , Icon]) => <button key={id} aria-current={area === id ? 'page' : undefined} onClick={() => setArea(id)}><Icon size={16} />{areaLabel(id, role)}</button>)}</nav>}
    {context.loading && <p role="status">Checking your school access…</p>}{message(context.error)}
    {!context.loading && !context.error && !school && <p>Your verified school membership needs checking. Ask the administrator to assign your school and classes.</p>}
    {school && !context.error && <div key={`${school.id}-${role}-${classScope}`}>
      <p className="sw-muted">{school.name} · {role === 'admin' ? 'School administration' : role === 'parent' ? 'Your linked children' : role === 'student' ? 'Your learning' : 'Your assigned classes'}</p>
      {area === 'home' && (role === 'parent' ? <ParentOverview school={school} onNavigate={setArea}/> : role === 'student' ? <QuestArea school={school} classes={classes} learnerName={learnerName} onNavigate={setArea} onJoined={context.reload} onChooseProgram={id => { setProgramChoice(id); setArea('programs'); }} /> : ['admin','supervisor','teacher','coach'].includes(role) ? <W2eCoachSupportPanel school={school} classes={classes} /> : null)}
      {area === 'programs' && (role==='parent' ? <ParentProgramProgress school={school}/> : <Programs school={school} classes={classes} role={role} onJoined={programId=>{setProgramChoice(programId||'');context.reload();}} initialProgram={programChoice} />)}
      {area === 'goals' && <Goals school={school} classes={classes} role={role} />}
      {area === 'academic' && <Academic school={school} classes={classes} role={role} />}
      {area === 'calendar' && <SchoolCalendar school={school} role={role} />}
    </div>}
  </section>;
}
function Programs({
  school,
  classes,
  role,
  onJoined,
  initialProgram = ''
}) {
  const {t}=useActivityText();
  const [creating,setCreating]=useState(false),[publishReviewed,setPublishReviewed]=useState(false);
  const offerings = useSchoolResource(schoolPath(school.id, 'program-offerings'),true);
  const [selected, setSelected] = useState(initialProgram || 'sustainable-futures'),
    [offeringId, setOfferingId] = useState(''),
    [code, setCode] = useState(''),
    [year, setYear] = useState('2026-2027'),
    [classId, setClassId] = useState(classes[0]?.id || '');
  const [justCreated,setJustCreated]=useState(null);
  const [state, run] = useMutation(offerings.reload),
    customPrograms = [...new Map((offerings.data?.items || []).filter(o => o.programDefinition).map(o => [o.programDefinition.id,o.programDefinition])).values()],
    catalogue = [...PROGRAM_CATALOGUE, ...customPrograms,...(justCreated&&!customPrograms.some(p=>p.id===justCreated.programId)?[justCreated.programDefinition]:[])],
    template = catalogue.find(p => p.id === selected) || PROGRAM_CATALOGUE[0],
    list = [...(offerings.data?.items || []),...(justCreated&&!offerings.error&&!(offerings.data?.items||[]).some(o=>o.id===justCreated.id)?[justCreated]:[])].filter(o => o.classIds.some(id => classes.some(c => c.id === id)));
  const options = list.filter(o => o.programId === selected),
    offering = options.find(o => o.id === offeringId) || options[0];
  useEffect(()=>setPublishReviewed(false),[offering?.id,offering?.revision]);
  const isStaff = ['teacher', 'coach', 'admin'].includes(role);
  return <div>
    {isStaff&&<section className="sw-card sw-create-program"><h3>{t('createProgram')}</h3><p>{t('programHint')}</p><button type="button" className="gh-btn gh-btn-primary" aria-expanded={creating} disabled={creating} onClick={()=>setCreating(true)}>{t(creating?'programCancel':'createProgram')}</button>{!classes.length&&<p role="status">{t('programNoClass')}</p>}</section>}
    <div className="sw-programs">{catalogue.map(p => <button key={p.id} className={selected === p.id ? 'sw-program sw-selected' : 'sw-program'} aria-pressed={selected === p.id} onClick={() => {
        setSelected(p.id);
        setOfferingId('');
      }}>{list.find(o=>o.programId===p.id)?.attachments?.find(a=>a.contentType?.startsWith('image/')&&a.url) && <img className="sw-program-poster" src={list.find(o=>o.programId===p.id).attachments.find(a=>a.contentType?.startsWith('image/')&&a.url).url} alt="" loading="lazy"/>}<span>Semester {p.semester}</span><strong>{p.title}</strong><small>{p.gradeBand}</small></button>)}</div>
    {isStaff && creating && <ProgramMaker school={school} classes={classes} onCancel={()=>setCreating(false)} onCreated={created=>{setJustCreated(created);setSelected(created.programId);setOfferingId(created.id);setCreating(false);offerings.reload();}}/>}
    {message(offerings.error)}{offerings.loading && <p role="status">Loading program enrollments…</p>}
    <h3>{template.title}</h3><p>{template.drivingQuestion}</p>{template.overview&&<p className="sw-preserve">{template.overview}</p>}<ol className="sw-milestones">{template.milestones.map(m => <li key={m.id}>{m.title}</li>)}</ol>
    {template.rubric.length > 0 && <details><summary>Assessment criteria</summary><ul>{template.rubric.map(r => <li key={r.title}>{r.title} · {r.weight}% · {r.standard}</li>)}</ul></details>}
    {selected === 'sustainable-futures' && <p><a href="#/pbl">Open existing Sustainable Futures Studio →</a><small className="sw-muted sw-block">Existing portfolios keep their original term identifier.</small></p>}
    {options.length > 1 && <Field label="School year offering"><select value={offering?.id || ''} onChange={e => setOfferingId(e.target.value)}>{options.map(o => <option key={o.id} value={o.id}>{o.yearId}</option>)}</select></Field>}
    {!offerings.loading && !offerings.error && !offering && <p className="sw-notice">{role === 'student' ? 'You have not joined this program. Ask your coach for its class code.' : 'No offering is assigned in this view. Create an offering for your assigned class to start adding lessons.'}</p>}
    {role === 'student' && <form className="sw-inline-form" onSubmit={async e => {
      e.preventDefault();
      const result = await run(() => mutateSchool('POST', '/api/program-enrollments/join', {
        code
      }), 'Program joined. Your enrollment has been saved.');
      if (result) { setSelected(result.programId || selected); setOfferingId(result.offeringId); onJoined(result.programId); }
    }}><Field label="Program class code"><input required maxLength={30} value={code} onChange={e => setCode(e.target.value)} autoComplete="off" /></Field><button disabled={state.busy} className="gh-btn gh-btn-primary">Join program</button></form>}
    {isStaff && !offering && <form className="sw-inline-form" onSubmit={e => {
      e.preventDefault();
      run(() => mutateSchool('POST', schoolPath(school.id, 'program-offerings'), {
        programId: selected,
        yearId: year,
        classIds: [classId]
      }), 'Offering created for the selected class.');
    }}><Field label="School year ID"><input required pattern="[A-Za-z0-9_-]+" value={year} onChange={e => setYear(e.target.value)} /></Field><ClassSelect classes={classes} value={classId} onChange={setClassId} /><button disabled={state.busy || !classId} className="gh-btn gh-btn-primary">Create offering</button></form>}
    <Feedback state={state} />
    {offering && <><p className="sw-muted">{offering.yearId} · Semester {offering.semester} · {offering.status}</p>{role === 'admin' && <OfferingClasses key={`classes-${offering.id}-${offering.revision}`} school={school} offering={offering} classes={classes} onSaved={offerings.reload} />}{isStaff && offering.status==='draft' && offering.programDefinition && <ProgramDetailsEditor key={`${offering.id}-${offering.revision}`} school={school} offering={offering} onSaved={offerings.reload}/>}{isStaff && offering.status==='draft' && <div className="sw-card"><p>Review the program lessons below. Publishing makes this program and its draft lessons available to enrolled students.</p><label><input type="checkbox" checked={publishReviewed} onChange={e=>setPublishReviewed(e.target.checked)}/> I reviewed the program, lesson instructions and activity safety.</label><button className="gh-btn gh-btn-primary" disabled={state.busy||!publishReviewed} onClick={()=>run(()=>mutateSchool('POST',`${schoolPath(school.id,'program-offerings')}/${offering.id}/publish`,{revision:offering.revision,safetyConfirmed:publishReviewed}),'Program published. Students can now join and open its lessons.')}>Publish program</button></div>}{isStaff && offering.status==='published' && <EnrollmentCode key={`codes-${offering.id}-${offering.revision}`} school={school} offering={offering} classes={classes} />}
      <section className="sw-program-resources" aria-label="Program resources"><h3>Program resources</h3><p className="sw-muted">Watch, explore and prepare for your lessons.</p><LearningMedia attachments={offering.attachments}/>{!offering.attachments?.length && <p>{isStaff ? 'Add a poster, video or slide deck for this program.' : 'Your coach will share program resources here.'}</p>}{isStaff && (role==='admin' || offering.createdBy===auth.currentUser?.uid) && <ProgramMediaEditor key={`media-${offering.id}-${offering.revision}`} school={school} offering={offering} onSaved={offerings.reload}/>}</section><Lessons key={`lessons-${offering.id}-${offering.revision}`} school={school} offering={offering} classes={classes} template={template} isStaff={isStaff} /><EvidenceReviews key={`evidence-${offering.id}`} school={school} offering={offering} role={role} /></>}
  </div>;
}
function ClassSelect({
  classes,
  value,
  onChange
}) {
  return <Field label="Class"><select required value={value} onChange={e => onChange(e.target.value)}><option value="">Choose a class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>;
}
function EnrollmentCode({
  school,
  offering,
  classes
}) {
  const choices = classes.filter(c => offering.classIds.includes(c.id)),
    [classId, setClassId] = useState(choices[0]?.id || ''),
    [issued, setIssued] = useState(null),
    [state, run] = useMutation();
  return <details className="sw-card"><summary>Enrollment code management</summary><form className="sw-inline-form" onSubmit={async e => {
      e.preventDefault();
      const result = await run(() => mutateSchool('POST', schoolPath(school.id, `program-offerings/${offering.id}/codes`), {
        classId,
        days: 30
      }), 'Code issued. It expires in 30 days.');
      if (result) setIssued(result);
    }}><ClassSelect classes={choices} value={classId} onChange={setClassId} /><button className="gh-btn gh-btn-primary" disabled={state.busy || !classId}>Issue class code</button></form><Feedback state={state} />{issued && <div><p>Class code: <strong>{issued.code}</strong></p><button className="gh-btn gh-btn-ghost" disabled={state.busy} onClick={async () => {
        const result = await run(() => mutateSchool('DELETE', schoolPath(school.id, `program-codes/${issued.id}`), {}), 'Code disabled.');
        if (result) setIssued(null);
      }}>Disable this code</button></div>}</details>;
}
function Lessons({
  school,
  offering,
  classes,
  template,
  isStaff
}) {
  const base = schoolPath(school.id, `program-offerings/${offering.id}/lessons`),
    lessons = useSchoolResource(base, true);
  const choices = classes.filter(c => offering.classIds.includes(c.id));
  const blank = emptyLesson(choices[0]?.id || '', template.milestones[0]?.id || '');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [draft, setDraft] = useState(blank),
    [editId, setEditId] = useState(null),
    [isAdding, setIsAdding] = useState(false),
    [previewLesson, setPreviewLesson] = useState(null),
    [state, run] = useMutation(lessons.reload);

  const startAddLesson = () => {
    setDraft(emptyLesson(choices[0]?.id || '', template.milestones[0]?.id || ''));
    setEditId(null);
    setMediaFiles([]);
    setIsAdding(true);
    setPreviewLesson(null);
  };

  const startEditLesson = lesson => {
    setDraft(normalizeLesson(lesson));
    setEditId(lesson.id);
    setMediaFiles([]);
    setIsAdding(true);
    setPreviewLesson(null);
  };

  const cancelEditor = () => {
    setDraft(blank);
    setEditId(null);
    setIsAdding(false);
    setMediaFiles([]);
  };

  const saveLesson = async e => {
    if (e && e.preventDefault) e.preventDefault();
    const result = await run(async () => {
      validateMediaFiles(mediaFiles, draft.attachments?.length || 0);
      const { attachments: existing = [], ...content } = draft;
      const saved = await mutateSchool(
        editId ? 'PATCH' : 'POST',
        editId ? `${base}/${editId}` : base,
        { ...content, ...(editId ? { attachments: existing.map(({ url, ...a }) => a) } : {}) }
      );
      const id = editId || saved.id;
      let revision = editId ? draft.revision + 1 : saved.revision;
      let attachments = existing.map(({ url, ...a }) => a);
      setEditId(id);
      setDraft({ ...content, attachments, revision });

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const path = `lessonMedia/${school.id}/${offering.id}/${id}/${auth.currentUser.uid}/${crypto.randomUUID()}`;
        try {
          const task = storage.ref(path).put(file, { contentType: learningMediaType(file) });
          await new Promise((resolve, reject) => task.on('state_changed', snap => setUploadProgress(`Uploading ${file.name}: ${Math.round(snap.bytesTransferred / snap.totalBytes * 100)}%`), reject, resolve));
        } catch (uploadErr) {
          if (uploadErr.code === 'storage/unauthorized') {
            throw new Error(`Upload denied for "${file.name}". Please ensure the file is under the 100 MB limit and your coach account is assigned to this class/school.`);
          }
          throw uploadErr;
        }
        const next = [...attachments, { path, name: file.name, contentType: learningMediaType(file), size: file.size }];
        await mutateSchool('PATCH', `${base}/${id}`, { ...content, attachments: next, revision });
        attachments = next;
        revision += 1;
        setDraft({ ...content, attachments, revision });
        setMediaFiles(files => files.slice(1));
      }
      return true;
    }, 'Lesson draft saved with its structured steps and media.');
    setUploadProgress('');
    if (result) {
      cancelEditor();
    }
  };

  return (
    <section className="sw-lessons">
      <div className="sw-lessons-header-bar">
        <h3>Program lessons</h3>
        {isStaff && !isAdding && !editId && (
          <button type="button" className="gh-btn gh-btn-primary" onClick={startAddLesson}>
            + Add a lesson
          </button>
        )}
      </div>

      {message(lessons.error)}
      {lessons.loading && <p role="status">Loading lessons…</p>}

      {/* Interactive Learner View Preview */}
      {previewLesson && (
        <div className="sw-preview-card sw-card">
          <div className="sw-preview-header">
            <h4>{isStaff ? 'Learner Preview' : 'Your lesson'}</h4>
            <button type="button" className="gh-btn gh-btn-ghost gh-btn-small" onClick={() => setPreviewLesson(null)}>
              Close preview
            </button>
          </div>
          <LearnerLessonView lesson={previewLesson} template={template} onClose={() => setPreviewLesson(null)} />
        </div>
      )}

      {/* 6-Section Coach Guided Authoring Editor */}
      {(isAdding || editId) && isStaff && (
        <CoachLessonEditor
          draft={draft}
          onChange={setDraft}
          onSave={saveLesson}
          onCancel={cancelEditor}
          choices={choices}
          template={template}
          busy={state.busy}
          isEdit={!!editId}
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          uploadProgress={uploadProgress}
        />
      )}

      {/* Compact Ordered Lesson List */}
      {!isAdding && !editId && (
        <CompactLessonList
          lessons={lessons.data?.items || []}
          template={template}
          isStaff={isStaff}
          onEdit={startEditLesson}
          onPublish={l => run(() => mutateSchool('POST', `${base}/${l.id}/publish`, { revision: l.revision }), 'Lesson published to the selected class.')}
          onPreview={l => setPreviewLesson(l)}
          busy={state.busy}
        />
      )}

      {/* Activities / Simulations Special Handlers */}
      {!isStaff && lessons.data?.items?.some(l => l.status === 'published' && !l.simulation) && (
        <section aria-label="Activities">
          {lessons.data?.items?.filter(l => l.status === 'published' && !l.simulation).map(l => (
            <details className="sw-card sw-lesson-resource-details" key={l.id}>
              <summary><strong>{l.title}</strong> · Resources & interactive work</summary>
              <p><strong>Learning outcome:</strong> {l.outcome}</p>
              <p className="sw-preserve">{l.instructions}</p>
              {l.attachments?.length > 0 && <LearningMedia attachments={l.attachments} />}
              {l.activity && <ActivityLesson lesson={l} uid={auth.currentUser?.uid} schoolId={school.id} offeringId={offering.id} />}
            </details>
          ))}
        </section>
      )}

      {!isStaff && lessons.data?.items?.some(l => l.status === 'published' && l.simulation) && (
        <section aria-label="Simulations">
          {lessons.data?.items?.filter(l => l.status === 'published' && l.simulation).map(l => (
            <details className="sw-card sw-lesson-resource-details" key={l.id}>
              <summary><strong>{l.title}</strong> · Resources & interactive work</summary>
              <p><strong>Learning outcome:</strong> {l.outcome}</p>
              <p className="sw-preserve">{l.instructions}</p>
              {l.attachments?.length > 0 && <LearningMedia attachments={l.attachments} />}
              <SimulationLab settings={l.simulation} />
            </details>
          ))}
        </section>
      )}

      {/* Hidden file input for staff file picking when not in expanded editor */}
      {isStaff && !isAdding && !editId && (
        <div style={{ display: 'none' }}>
          <input
            type="file"
            multiple
            accept={MEDIA_ACCEPT}
            onChange={e => {
              setMediaFiles(Array.from(e.target.files || []));
              startAddLesson();
            }}
          />
        </div>
      )}

      {isStaff && <ActivityCoachTools {...{school,offering,classes,template}} lessons={lessons.data?.items||[]} onSaved={lessons.reload}/>}

      <Feedback state={state} />
    </section>
  );
}
export function LessonMedia(props) { return <LearningMedia {...props}/>; }
// The learners API may return suspended or archived accounts; coaches should not pick them.
const isSelectableLearner = l => !['suspended', 'archived'].includes(l.status);
function LearnerSelect({
  learners,
  value,
  onChange
}) {
  return <Field label="Learner"><select required value={value} onChange={e => onChange(e.target.value)}><option value="">Choose a learner</option>{learners.map(l => <option key={l.id} value={l.id}>{l.displayName}</option>)}</select></Field>;
}
function Goals({
  school,
  classes,
  role
}) {
  const learners = useSchoolResource(schoolPath(school.id, 'learners'));
  const [learnerUid, setLearnerUid] = useState(''),
    [classId, setClassId] = useState(''),
    [target, setTarget] = useState(''),
    [domain, setDomain] = useState('pbl'),
    [dueDate, setDueDate] = useState(today());
  const isStaff = ['teacher', 'coach', 'admin'].includes(role),
    choices = (learners.data?.items || []).filter(l => isSelectableLearner(l) && (!isStaff || l.classIds.some(id => classes.some(c => c.id === id)))),
    selected = choices.find(l => l.id === learnerUid) || choices[0];
  const scopedClasses = classes.filter(c => selected?.classIds.includes(c.id)),
    selectedClass = scopedClasses.find(c => c.id === classId) || scopedClasses[0];
  const path = selected ? schoolPath(school.id, `learner-goals?learnerUid=${encodeURIComponent(selected.id)}${isStaff ? `&classId=${encodeURIComponent(selectedClass?.id || '')}` : ''}`) : null;
  const goals = useSchoolResource(path,true),
    [state, run] = useMutation(goals.reload);
  return <div>{message(learners.error)}{learners.loading && <p role="status">Loading learners…</p>}{choices.length > 0 && <LearnerSelect learners={choices} value={selected?.id || ''} onChange={v => {
      setLearnerUid(v);
      setClassId('');
    }} />}{!learners.loading && !learners.error && !choices.length && <p>No learners are available in your assigned scope.</p>}
    {role !== 'student' && selected && <QuestSummary key={`${selected.id}-${selectedClass?.id || ''}`} school={school} learner={selected} classId={isStaff ? selectedClass?.id : undefined} role={role} />}
    {role === 'student' && scopedClasses.length > 1 && <ClassSelect classes={scopedClasses} value={selectedClass?.id || ''} onChange={setClassId} />}
    {(isStaff || role === 'student') && selected && selectedClass && <LearnerPathway key={`${school.id}-${selected.id}-${selectedClass.id}-${role}`} school={school} learnerUid={selected.id} classId={selectedClass.id} role={role} onSaved={goals.reload} />}
    {isStaff && selected && <form className="sw-form" onSubmit={async e => {
      e.preventDefault();
      const result = await run(() => mutateSchool('POST', schoolPath(school.id, 'learner-goals'), {
        learnerUid: selected.id,
        classId: selectedClass?.id,
        target,
        domain,
        dueDate
      }), 'Goal assigned and saved.');
      if (result) setTarget('');
    }}><ClassSelect classes={scopedClasses} value={selectedClass?.id || ''} onChange={setClassId} /><Field label="Learning area"><select value={domain} onChange={e => setDomain(e.target.value)}><option value="pbl">PBL Studio</option><option value="steam">STEAM activities</option><option value="academic">Academic learning</option></select></Field><Field label="Measurable goal and evidence of success"><textarea required maxLength={1000} value={target} onChange={e => setTarget(e.target.value)} placeholder="For example: test two prototype designs and compare the recorded results." /></Field><Field label="Due date"><input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field><button className="gh-btn gh-btn-primary" disabled={state.busy || !selectedClass}>Assign goal</button></form>}
    {message(goals.error)}{goals.loading && <p role="status">Loading goals…</p>}{goals.data?.items.length === 0 && <p>No coach goals recorded for this learner yet.</p>}
    {(goals.data?.items || []).filter(g => role === 'parent' || g.source !== 'competency-pathway').map(g => <article className="sw-card" key={g.id}><small>{g.domain.toUpperCase()} · {g.dueDate ? `Due ${g.dueDate} · ` : ''}{g.state}</small><p>{g.target}</p><small>{g.acknowledged ? 'Learner acknowledged' : 'Awaiting learner acknowledgement'}</small>{isStaff && g.state !== 'archived' && <div className="sw-actions">{['active', 'achieved', 'archived'].filter(s => s !== g.state).map(s => <button className="gh-btn gh-btn-ghost" disabled={state.busy} key={s} onClick={() => run(() => mutateSchool('PATCH', schoolPath(school.id, `learner-goals/${g.id}`), {
          state: s,
          revision: g.revision
        }), `Goal ${s}.`)}>{s === 'achieved' ? 'Confirm achieved' : s === 'archived' ? 'Archive goal' : 'Reopen goal'}</button>)}</div>}{role === 'student' && !g.acknowledged && <button className="gh-btn gh-btn-ghost" disabled={state.busy} onClick={() => run(() => mutateSchool('PATCH', schoolPath(school.id, `learner-goals/${g.id}`), {
        revision: g.revision
      }), 'Goal acknowledged.')}>I understand this goal</button>}</article>)}<Feedback state={state} />
  </div>;
}
function Academic({
  school,
  classes,
  role
}) {
  const learners = useSchoolResource(schoolPath(school.id, 'learners')),
    [learnerUid, setLearnerUid] = useState(''),
    [classId, setClassId] = useState(''),
    [provider, setProvider] = useState('all'),
    [courseFilter, setCourseFilter] = useState('all');
  const isStaff = ['teacher', 'coach', 'admin'].includes(role),
    choices = (learners.data?.items || []).filter(l => isSelectableLearner(l) && (!isStaff || l.classIds.some(id => classes.some(c => c.id === id)))),
    selected = choices.find(l => l.id === learnerUid) || choices[0],
    scopedClasses = classes.filter(c => selected?.classIds.includes(c.id)),
    selectedClass = scopedClasses.find(c => c.id === classId) || scopedClasses[0];
  const records = useSchoolResource(selected ? schoolPath(school.id, `academic-progress?learnerUid=${encodeURIComponent(selected.id)}${isStaff ? `&classId=${encodeURIComponent(selectedClass?.id || '')}` : ''}`) : null);
  const [draft, setDraft] = useState({
      provider: 'cambrilearn',
      course: '',
      curriculum: '',
      completed: '0',
      total: '',
      dataAsOf: today()
    }),
    [state, run] = useMutation(records.reload);
  const courses = [...new Set((records.data?.items || []).filter(r => provider === 'all' || r.provider === provider).map(r => r.course))];
  const latest = new Map();
  (records.data?.items || []).forEach(r => {
    const key = JSON.stringify([r.provider, r.curriculum, r.course]);
    if (!latest.has(key)) latest.set(key, r);
  });
  return <div><p className="sw-notice">CambriLearn and Edmentum automatic connections: access pending. Records entered here are coach observations, not a live provider feed.</p>{message(learners.error)}{choices.length > 0 && <LearnerSelect learners={choices} value={selected?.id || ''} onChange={v => {
      setLearnerUid(v);
      setClassId('');
      setCourseFilter('all');
    }} />}
    <div className="sw-inline-form"><Field label="Curriculum provider"><select value={provider} onChange={e => {
          setProvider(e.target.value);
          setCourseFilter('all');
        }}><option value="all">All providers</option><option value="cambrilearn">CambriLearn</option><option value="edmentum">Edmentum</option></select></Field><Field label="Course"><select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}><option value="all">All courses</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}</select></Field></div>
    {message(records.error)}{records.loading && <p role="status">Loading academic records…</p>}{selected && !records.loading && !records.error && !(records.data?.items || []).length && <p>No academic observations recorded yet. Missing data is not zero progress.</p>}
    {[...latest.values()].filter(r => (provider === 'all' || r.provider === provider) && (courseFilter === 'all' || r.course === courseFilter)).map(r => <article className="sw-card" key={r.id}><small>{r.provider === 'cambrilearn' ? 'CambriLearn' : 'Edmentum'} · {r.curriculum}</small><h3>{r.course}</h3><p>{r.completed} of {r.total} units observed complete</p><progress value={r.completed} max={r.total} aria-label={`${r.course}: ${r.completed} of ${r.total} units`} /><p className="sw-muted">Source: {r.sourceMethod === 'coach_recorded' ? 'Coach-recorded observation' : r.sourceMethod} · Observed {r.dataAsOf} · Saved {r.importedAt?.slice(0, 10)}</p></article>)}
    {isStaff && selected && <details className="sw-card"><summary>Record a dated academic observation</summary><form className="sw-form" onSubmit={async e => {
        e.preventDefault();
        const result = await run(() => mutateSchool('POST', schoolPath(school.id, 'academic-progress'), {
          ...draft,
          learnerUid: selected.id,
          classId: selectedClass?.id
        }), 'Academic observation saved with its source and date.');
        if (result) setDraft({
          ...draft,
          course: '',
          curriculum: '',
          completed: '0',
          total: ''
        });
      }}><ClassSelect classes={scopedClasses} value={selectedClass?.id || ''} onChange={setClassId} /><Field label="Provider"><select value={draft.provider} onChange={e => setDraft({
            ...draft,
            provider: e.target.value
          })}><option value="cambrilearn">CambriLearn</option><option value="edmentum">Edmentum</option></select></Field>{[['curriculum', 'Curriculum / level'], ['course', 'Course']].map(([key, label]) => <Field key={key} label={label}><input required maxLength={200} value={draft[key]} onChange={e => setDraft({
            ...draft,
            [key]: e.target.value
          })} /></Field>)}{[['completed', 'Completed units'], ['total', 'Total units']].map(([key, label]) => <Field key={key} label={label}><input type="number" required min={key === 'total' ? 1 : 0} step={1} value={draft[key]} onChange={e => setDraft({
            ...draft,
            [key]: e.target.value
          })} /></Field>)}<Field label="Observation date"><input type="date" required value={draft.dataAsOf} onChange={e => setDraft({
            ...draft,
            dataAsOf: e.target.value
          })} /></Field><button disabled={state.busy || !selectedClass} className="gh-btn gh-btn-primary">Save observation</button></form></details>}<Feedback state={state} />
  </div>;
}
function SchoolCalendar({
  school,
  role
}) {
  const [month, setMonth] = useState(today().slice(0, 7)),
    [view, setView] = useState('year');
  const canManage = ['admin', 'teacher', 'coach'].includes(role);
  const year = Number(month.slice(0, 4)),
    index = Number(month.slice(5)) - 1;
  const from = view === 'year' ? `${year}-01-01` : `${month}-01`,
    to = view === 'year' ? `${year}-12-31` : `${month}-${String(new Date(year, index + 1, 0).getDate()).padStart(2, '0')}`;
  const base = schoolPath(school.id, 'calendar-events'),
    events = useSchoolResource(`${base}?from=${from}&to=${to}`, true);
  const blank = {
    title: '',
    startDate: today(),
    endDate: today(),
    allDay: true,
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
    category: 'School event',
    status: 'scheduled'
  };
  const [draft, setDraft] = useState(blank),
    [editId, setEditId] = useState(null),
    [confirmDelete, setConfirmDelete] = useState(null),
    [state, run] = useMutation(events.reload);
  const update = (key, value) => setDraft(d => ({
      ...d,
      [key]: value
    })),
    list = events.data?.items || [];
  return <div><div className="sw-inline-form"><Field label="Calendar month"><input type="month" required value={month} onChange={e => {
          if (e.target.value) setMonth(e.target.value);
        }} /></Field><Field label="View"><select value={view} onChange={e => setView(e.target.value)}><option value="year">Year</option><option value="agenda">Agenda</option><option value="month">Month</option></select></Field></div><p className="sw-muted">School timezone: {school.timezone}. Updates checked every 30 seconds. {canManage ? 'You can manage school events.' : 'School events are managed by coaches and the admin.'}</p>
    {role === 'admin' && <details className="sw-card"><summary>Review and import the school’s 2026–2027 calendar</summary><p>Confirm these supplied school dates before importing. Existing reference entries and admin edits will be preserved.</p><ul>{CALENDAR_REFERENCE.map(event => <li key={event.id}>{event.startDate}{event.endDate !== event.startDate ? ` – ${event.endDate}` : ''} · {event.title}</li>)}</ul><button disabled={state.busy} className="gh-btn gh-btn-primary" onClick={() => run(() => mutateSchool('POST', schoolPath(school.id, 'calendar-reference/import'), {
        confirmYear: '2026-2027'
      }), 'Reference calendar imported. Existing entries were preserved.')}>Confirm and import reference dates</button></details>}
    {message(events.error)}{events.loading && <p role="status">Loading school calendar…</p>}
    {view === 'year' && <div className="sw-year">{Array.from({length: 12}, (_, monthIndex) => {
      const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      return <section className="sw-year-month" key={prefix}><h3><button type="button" className="gh-btn gh-btn-ghost" onClick={() => { setMonth(prefix); setView('month'); }}>{new Date(Date.UTC(year, monthIndex, 1)).toLocaleString('en', {month: 'long', timeZone: 'UTC'})}</button></h3><div className="sw-year-grid" role="list" aria-label={`School calendar ${prefix}`}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <small key={day}>{day}</small>)}
        {Array.from({length: (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7}, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({length: new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()}, (_, i) => {
          const date = `${prefix}-${String(i + 1).padStart(2, '0')}`;
          const dayEvents = list.filter(event => event.startDate <= date && event.endDate >= date);
          return <button type="button" role="listitem" key={date} className={dayEvents.length ? 'sw-year-event' : ''} aria-label={`${date}${dayEvents.map(event => ` · ${event.title}${event.status === 'cancelled' ? ' (Cancelled)' : ''}`).join('')}`} onClick={() => {setMonth(prefix); setView('month');}}>{i + 1}{dayEvents.map(event => <span key={event.id}>{event.title}</span>)}</button>;
        })}
      </div></section>;
    })}</div>}
    {view === 'month' && <div className="sw-month-scroll"><div className="sw-month" role="list" aria-label={`School calendar ${month}`}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span className="sw-weekday" key={day}>{day}</span>)}{Array.from({
          length: (new Date(Date.UTC(year, index, 1)).getUTCDay() + 6) % 7
        }, (_, i) => <div key={`blank-${i}`} aria-hidden="true" />)}{Array.from({
          length: new Date(year, index + 1, 0).getDate()
        }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          return <div role="listitem" className="sw-day" key={day}><strong>{i + 1}</strong>{list.filter(e => e.startDate <= day && e.endDate >= day).map(e => <span key={e.id}>{e.status === 'cancelled' ? 'Cancelled: ' : ''}{e.title}</span>)}</div>;
        })}</div></div>}
    {!events.loading && !events.error && !list.length && <p>No school events recorded for this calendar range.</p>}
    <div className="sw-agenda">{list.map(event => <article className="sw-card" key={event.id}><small>{event.startDate}{event.endDate !== event.startDate ? ` – ${event.endDate}` : ''} · {event.allDay ? 'All day' : `${event.startTime}–${event.endTime}`} · {event.category}</small><h3>{event.title}{event.status === 'cancelled' ? ' · Cancelled' : ''}</h3>{event.location && <p>{event.location}</p>}{event.description && <p className="sw-preserve">{event.description}</p>}{canManage && <div className="sw-actions"><button className="gh-btn gh-btn-ghost" onClick={() => {
            setDraft(event);
            setEditId(event.id);
          }}>Edit event</button><button className="gh-btn gh-btn-ghost" onClick={() => setConfirmDelete(event)} disabled={state.busy}>Delete event</button></div>}</article>)}</div>
    {confirmDelete && <div className="sw-notice" role="alert"><p>Delete “{confirmDelete.title}” from the school calendar?</p><div className="sw-actions"><button className="gh-btn gh-btn-primary" disabled={state.busy} onClick={async () => {
          const result = await run(() => mutateSchool('DELETE', `${base}/${confirmDelete.id}`, {
            revision: confirmDelete.revision
          }), 'Event deleted.');
          if (result) setConfirmDelete(null);
        }}>Confirm delete</button><button className="gh-btn gh-btn-ghost" onClick={() => setConfirmDelete(null)}>Keep event</button></div></div>}
    {canManage && <details className="sw-card" open={!!editId}><summary>{editId ? 'Edit school event' : 'Add school event'}</summary><form className="sw-form" onSubmit={async e => {
        e.preventDefault();
        const result = await run(() => mutateSchool(editId ? 'PATCH' : 'POST', editId ? `${base}/${editId}` : base, draft), 'School event saved. All dashboards use this calendar.');
        if (result) {
          setMonth(draft.startDate.slice(0, 7));
          setDraft(blank);
          setEditId(null);
        }
      }}><Field label="Event title"><input required maxLength={200} value={draft.title} onChange={e => update('title', e.target.value)} /></Field><div className="sw-inline-form"><Field label="Start date"><input required type="date" value={draft.startDate} onChange={e => {
              update('startDate', e.target.value);
              if (e.target.value > draft.endDate) update('endDate', e.target.value);
            }} /></Field><Field label="End date"><input required type="date" min={draft.startDate} value={draft.endDate} onChange={e => update('endDate', e.target.value)} /></Field></div><label><input type="checkbox" checked={draft.allDay} onChange={e => update('allDay', e.target.checked)} /> All-day event</label>{!draft.allDay && <div className="sw-inline-form"><Field label="Start time"><input required type="time" value={draft.startTime} onChange={e => update('startTime', e.target.value)} /></Field><Field label="End time"><input required type="time" value={draft.endTime} onChange={e => update('endTime', e.target.value)} /></Field></div>}{[['location', 'Location'], ['category', 'Category']].map(([key, label]) => <Field key={key} label={label}><input maxLength={key === 'category' ? 80 : 200} value={draft[key]} onChange={e => update(key, e.target.value)} /></Field>)}<Field label="Description"><textarea maxLength={4000} rows={3} value={draft.description} onChange={e => update('description', e.target.value)} /></Field><Field label="Event status"><select value={draft.status} onChange={e => update('status', e.target.value)}><option value="scheduled">Scheduled</option><option value="cancelled">Cancelled</option></select></Field><div className="sw-actions"><button className="gh-btn gh-btn-primary" disabled={state.busy}>{state.busy ? 'Saving…' : 'Save event'}</button>{editId && <button type="button" className="gh-btn gh-btn-ghost" onClick={() => {
            setDraft(blank);
            setEditId(null);
          }}>Cancel edit</button>}</div></form></details>}<Feedback state={state} />
  </div>;
}
function EvidenceReviews({
  school,
  offering,
  role
}) {
  const base = schoolPath(school.id, `program-offerings/${offering.id}`),
    lessons = useSchoolResource(`${base}/lessons`,true),
    submissions = useSchoolResource(`${base}/submissions`, true),
    learners = useSchoolResource(schoolPath(school.id, 'learners'));
  const isStaff = ['teacher', 'coach', 'admin'].includes(role),
    [draft, setDraft] = useState({
      lessonId: '',
      body: '',
      link: '',
      submissionId: crypto.randomUUID()
    }),
    [reviewId, setReviewId] = useState(null),
    [feedback, setFeedback] = useState(''),
    [outcome, setOutcome] = useState('reviewed'),
    [state, run] = useMutation(submissions.reload);
  const published = (lessons.data?.items || []).filter(l => l.status === 'published'),
    list = submissions.data?.items || [],
    review = list.find(s => s.id === reviewId);
  return <section><h3>Lesson evidence & feedback</h3><p className="sw-muted">Written and linked evidence is saved per submission. Reviewed work is not automatically a milestone approval or rubric grade.</p>{message(submissions.error)}{isStaff && <p>{list.filter(s => s.status === 'submitted').length} {list.filter(s => s.status === 'submitted').length === 1 ? 'submission' : 'submissions'} awaiting review</p>}
    {role === 'student' && published.length > 0 && <details className="sw-card"><summary>Submit lesson evidence</summary><form className="sw-form" onSubmit={async e => {
        e.preventDefault();
        const result = await run(() => mutateSchool('POST', `${base}/submissions`, draft), 'Evidence submitted to your coach.');
        if (result) setDraft({
          lessonId: '',
          body: '',
          link: '',
          submissionId: crypto.randomUUID()
        });
      }}><Field label="Published lesson"><select required value={draft.lessonId} onChange={e => setDraft({
            ...draft,
            lessonId: e.target.value
          })}><option value="">Choose a lesson</option>{published.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field><Field label="Evidence and reflection"><textarea required rows={5} maxLength={5000} value={draft.body} onChange={e => setDraft({
            ...draft,
            body: e.target.value
          })} /></Field><Field label="Evidence link (optional HTTPS address)"><input type="url" value={draft.link} onChange={e => setDraft({
            ...draft,
            link: e.target.value
          })} /></Field><button className="gh-btn gh-btn-primary" disabled={state.busy}>Submit evidence</button></form></details>}
    {submissions.loading && <p role="status">Loading submissions…</p>}{!submissions.loading && !submissions.error && !list.length && <p>No lesson evidence has been submitted yet.</p>}
    {list.map(s => <article key={s.id} className="sw-card"><small>{learners.data?.items.find(l => l.id === s.learnerUid)?.displayName || 'Learner'} · {s.createdAt.slice(0, 10)} · {s.status.replaceAll('_', ' ')}</small><h4>{lessons.data?.items.find(l => l.id === s.lessonId)?.title || 'Lesson evidence'}</h4><p className="sw-preserve">{s.body}</p>{s.link && <a href={s.link} target="_blank" rel="noopener noreferrer">Open linked evidence →</a>}{s.feedback && <div className="sw-notice"><strong>Coach feedback</strong><p className="sw-preserve">{s.feedback}</p></div>}{isStaff && <button className="gh-btn gh-btn-ghost" onClick={() => {
        setReviewId(s.id);
        setFeedback(s.feedback || '');
        setOutcome('reviewed');
      }}>Review submission</button>}</article>)}
    {review && isStaff && <form className="sw-form sw-card" onSubmit={async e => {
      e.preventDefault();
      const result = await run(() => mutateSchool('POST', `${base}/submissions/${review.id}/review`, {
        feedback,
        status: outcome,
        revision: review.revision
      }), 'Feedback published to the learner.');
      if (result) {
        setReviewId(null);
        setFeedback('');
      }
    }}><h4>Review lesson evidence</h4><p className="sw-preserve">{review.body}</p><Field label="Constructive feedback"><textarea required rows={4} maxLength={4000} value={feedback} onChange={e => setFeedback(e.target.value)} /></Field><Field label="Review outcome"><select value={outcome} onChange={e => setOutcome(e.target.value)}><option value="reviewed">Reviewed</option><option value="revision_requested">Revision requested</option></select></Field><div className="sw-actions"><button className="gh-btn gh-btn-primary" disabled={state.busy}>Publish feedback</button><button type="button" className="gh-btn gh-btn-ghost" onClick={() => setReviewId(null)}>Cancel review</button></div></form>}<Feedback state={state} />
  </section>;
}
function OfferingClasses({
  school,
  offering,
  classes,
  onSaved
}) {
  const [selected, setSelected] = useState(offering.classIds),
    [state, run] = useMutation(onSaved);
  return <details className="sw-card"><summary>Assigned program classes</summary><p>Removing a class revokes its access to this offering. Existing evidence is preserved.</p><form className="sw-form" onSubmit={e => {
      e.preventDefault();
      run(() => mutateSchool('PATCH', schoolPath(school.id, `program-offerings/${offering.id}`), {
        classIds: selected,
        revision: offering.revision
      }), 'Program class assignments saved.');
    }}>{classes.map(c => <label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={e => setSelected(old => e.target.checked ? [...old, c.id] : old.filter(id => id !== c.id))} /> {c.name}</label>)}<button className="gh-btn gh-btn-primary" disabled={state.busy || !selected.length}>Save assigned classes</button></form><Feedback state={state} /></details>;
}

function ParentProgramProgress({school}) {
  const learners=useSchoolResource(schoolPath(school.id,'learners')),[learnerUid,setLearnerUid]=useState('');
  const choices=learners.data?.items||[],selected=choices.find(l=>l.id===learnerUid)||choices[0];
  const summaries=useSchoolResource(selected?schoolPath(school.id,`learner-program-summaries?learnerUid=${encodeURIComponent(selected.id)}`):null,true);
  return <section>{message(learners.error)}{selected && <LearnerSelect learners={choices} value={selected.id} onChange={setLearnerUid}/>}{message(summaries.error)}{summaries.loading&&<p role="status">Loading program summaries…</p>}{summaries.data?.items.length===0&&<p>No new semester program enrollment is recorded for this child yet.</p>}{(summaries.data?.items||[]).map(s=><article key={s.id} className="sw-card"><small>Semester {s.semester} · {s.yearId}</small><h3>{s.title}</h3><p>Lessons with submitted evidence: {s.lessonsSubmitted} · Published lessons: {s.publishedLessons}</p><p>Reviewed lessons: {s.lessonsReviewed} · Revisions requested: {s.revisionsRequested}</p><small>Lesson review describes coach feedback. It is not a milestone approval or rubric grade.</small></article>)}</section>;
}

function ParentOverview({school, onNavigate}) {
  return <section aria-label="Family overview">
    <h3>Your child's learning, in one place</h3>
    <p>Follow their project work, agreed goals and dated academic observations. Each area shows records for your linked children.</p>
    <div className="sw-actions">
      <button className="gh-btn gh-btn-primary" onClick={()=>onNavigate('goals')}>View agreed goals</button>
      <button className="gh-btn gh-btn-outline" onClick={()=>onNavigate('academic')}>View academic observations</button>
      <button className="gh-btn gh-btn-outline" onClick={()=>onNavigate('calendar')}>Upcoming school events</button>
    </div>
    <ParentProgramProgress school={school}/>
    <article className="sw-card"><h3>A conversation to try</h3><p>Ask your child: “What did you discover, and what would you like to try next?” Their coach can help explain the next learning step.</p></article>
  </section>;
}
