import { useState } from 'react';
import { COMPETENCIES, competencyById } from '../pbl/content/competencies.js';
import { useSchoolResource, schoolPath, mutateSchool, serviceMessage } from '../school/useSchoolWorkspace.js';
import './pathway.css';

export function LearnerPathway({ school, learnerUid, classId, role, onSaved }) {
  const base = schoolPath(school.id, `learners/${encodeURIComponent(learnerUid)}/pathway`);
  const suffix = `?classId=${encodeURIComponent(classId)}`;
  const resource = useSchoolResource(base + suffix);
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), [notice, setNotice] = useState('');
  const data = resource.data;
  async function save(path, body, message) {
    setBusy(true); setError(null); setNotice('');
    try {
      await mutateSchool('POST', path, body);
      setNotice(message); resource.reload(); onSaved?.(); return true;
    } catch (e) { setError(e); if (e.status === 409 && path.startsWith(base)) resource.reload(); return false; }
    finally { setBusy(false); }
  }
  return <section className="lp-panel" aria-label="Competency learning pathway">
    <header><span className="sw-kicker">MY LEARNING PATHWAY</span><h3>Build on what you can do</h3>
      <p>Choose a goal, work through its quest, and show your coach the evidence. Achievement comes from a coach’s assessment.</p>
      <p className="sw-muted">Pilot suggestions use published lessons and explicit competency rules. AI-generated suggestions are not enabled yet.</p>
    </header>
    {(resource.error || error) && <p className="sw-error" role="alert">{serviceMessage(resource.error || error)}</p>}
    {notice && <p className="sw-success" role="status">{notice}</p>}
    <button type="button" className="gh-btn gh-btn-ghost" disabled={busy || resource.loading} onClick={resource.reload}>Refresh pathway</button>
    {resource.loading && <p role="status">Loading achievements and next goals…</p>}
    {data && !resource.error && !resource.loading && <>
      <h4>Coach-confirmed achievements</h4>
      {data.achievements?.some(a => a.state === 'confirmed') ? <ul>{data.achievements.filter(a => a.state === 'confirmed').map(a => <li key={a.competencyId}>
        <strong>{competencyById(a.competencyId)?.title || a.competencyId}</strong><p>{competencyById(a.competencyId)?.statement}</p><small>{a.reason}</small>
      </li>)}</ul> : <p>No confirmed competencies yet. Reviewed work can help your coach establish your starting point.</p>}
      <h4>{role === 'student' ? 'Choose your next goal' : 'Suggested next goals for this learner'}</h4>
      {!data.recommendations?.length && <p>No suitable new quests are available in this class yet. Your coach can publish lessons with competency mappings, steps, success criteria and any required prior competencies.</p>}
      <div className="lp-options">{data.recommendations?.map(r => <article className="sw-card" key={r.id}>
        <h5>{r.title}</h5><p><strong>Goal:</strong> {r.goal}</p><p><strong>Why this suggestion:</strong> {r.reason}</p>
        <p><strong>Working toward:</strong> {r.competencies.map(c => c.title).join(', ')}</p>
        <details><summary>Quest steps and success criteria</summary><QuestDetails quest={r} /></details>
        {role === 'student' && <button type="button" className="gh-btn gh-btn-primary" disabled={busy} onClick={() => save(`${base}/choose${suffix}`, { recommendationId: r.id, revision: data.revision }, 'Your chosen goal and quest are saved.')}>Choose this quest: {r.title}</button>}
      </article>)}</div>
      <h4>Chosen quests</h4>
      {!data.quests?.length && <p>No quest chosen yet. You can choose when you are ready.</p>}
      {data.quests?.map(g => <article className="sw-card" key={g.id}>
        <h5>{g.quest.title}</h5><p>{g.target}</p><p><strong>{g.state === 'achieved' ? 'Competencies confirmed by your coach' : g.state === 'archived' ? 'Archived' : 'In progress — awaiting competency assessment'}</strong></p>
        <QuestDetails quest={g.quest} />
        {role === 'student' && g.state === 'active' && <QuestEvidence key={g.id} goal={g} school={school} busy={busy} onSubmit={save} />}
      </article>)}
      {role !== 'student' && <AssessmentForm data={data} busy={busy} onSave={body => save(`${base}/decisions${suffix}`, { ...body, revision: data.revision }, 'Assessment saved. The learner’s next suggestions have been updated.')} />}
    </>}
  </section>;
}

function QuestDetails({ quest }) {
  return <><ol>{quest.steps.map(s => <li key={s.id}><strong>{s.title}</strong><p className="sw-preserve">{s.instructions}</p></li>)}</ol>
    <p><strong>Evidence should demonstrate:</strong></p><ul>{quest.successCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
    <p className="sw-muted">Submit your work for feedback. Submission or review alone does not confirm a competency.</p></>;
}

function QuestEvidence({ goal, school, busy, onSubmit }) {
  const [body, setBody] = useState(''), [link, setLink] = useState('');
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  return <form className="sw-form" onSubmit={async e => {
    e.preventDefault();
    const saved = await onSubmit(schoolPath(school.id, `program-offerings/${goal.quest.offeringId}/submissions`),
      { lessonId: goal.quest.lessonId, expectedLessonRevision: goal.quest.lessonRevision, body, link, submissionId }, 'Evidence submitted. Your coach can review it in PBL Programs, then assess the competency.');
    if (saved) { setBody(''); setLink(''); setSubmissionId(crypto.randomUUID()); }
  }}>
    <label>Evidence and reflection<textarea required maxLength={5000} rows={4} value={body} onChange={e => setBody(e.target.value)} /></label>
    <label>Evidence link (optional HTTPS address)<input type="url" maxLength={2000} value={link} onChange={e => setLink(e.target.value)} /></label>
    <button className="gh-btn gh-btn-primary" disabled={busy}>Submit quest evidence</button>
  </form>;
}

function AssessmentForm({ data, busy, onSave }) {
  const [state, setState] = useState('confirmed'), [evidenceKey, setEvidenceKey] = useState('');
  const [competencyId, setCompetencyId] = useState(''), [reason, setReason] = useState('');
  const evidence = data.evidence?.find(e => `${e.offeringId}:${e.submissionId}` === evidenceKey);
  const eligible = state === 'confirmed' ? (evidence?.competencyIds || []) : data.achievements.filter(a => a.state === 'confirmed').map(a => a.competencyId);
  return <form className="sw-form sw-card" aria-label="Assess competency" onSubmit={async e => {
    e.preventDefault();
    if (await onSave({ state, competencyId, reason, ...(state === 'confirmed' ? { offeringId: evidence.offeringId, submissionId: evidence.submissionId } : {}) })) { setReason(''); setCompetencyId(''); }
  }}>
    <h4>Assess a competency</h4><p>Review evidence in PBL Programs first. Confirm only the competency the work demonstrates. A reason is recorded with every decision; reopening keeps the assessment history.</p>
    <label>Decision<select value={state} onChange={e => { setState(e.target.value); setCompetencyId(''); }}><option value="confirmed">Confirm achieved</option><option value="reopened">Reopen for further evidence</option></select></label>
    {state === 'confirmed' && <label>Reviewed evidence<select required value={evidenceKey} onChange={e => { setEvidenceKey(e.target.value); setCompetencyId(''); }}><option value="">Choose reviewed evidence</option>{data.evidence?.map(e => <option key={`${e.offeringId}:${e.submissionId}`} value={`${e.offeringId}:${e.submissionId}`}>{e.title} · {e.submissionId}</option>)}</select></label>}
    <label>Competency<select required value={eligible.includes(competencyId) ? competencyId : ''} onChange={e => setCompetencyId(e.target.value)}><option value="">Choose a competency</option>{COMPETENCIES.filter(c => eligible.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.title} · {c.id}</option>)}</select></label>
    <label>Assessment reason<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
    <button className="gh-btn gh-btn-primary" disabled={busy || !eligible.includes(competencyId) || !reason.trim()}>Save competency decision</button>
  </form>;
}
