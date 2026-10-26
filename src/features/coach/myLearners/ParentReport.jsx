import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, CircleAlert, Clock, Info, Check, Bot, Send } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { hrefFor } from '../../../app/routes.js';
import { Alert } from '../../admin/ui/bits.jsx';
import { useCoachRecords, saveReport, approveReport } from './coachRecordsStore.js';
import { buildReportDraft, defaultPeriod } from './myLearnersModel.js';
import { NotAvailable, DeviceStoreNote, Missions, useDay, useWhen } from './ui.jsx';

const TEXT_FIELDS = ['strengths', 'challenges', 'nextSteps', 'home', 'narrative', 'academic'];
const FLAG_ICON = { missing: CircleAlert, outdated: Clock, info: Info };

/**
 * Prepare Parent Report. The preview is built only from records in the chosen
 * period; the coach picks the evidence, edits the text and approves. Nothing
 * is sent from here: an approved report can be printed or saved as PDF.
 *
 * Private notes are never passed to buildReportDraft, so they cannot appear.
 */
export function ParentReport({ coachUser, learner, navigate, today }) {
  const { t } = useLocale();
  const day = useDay();
  const when = useWhen();
  const { records, update, saveError } = useCoachRecords(coachUser.uid, learner.uid);
  const [period, setPeriod] = useState(() => defaultPeriod(today));
  const [reportId, setReportId] = useState(null);
  const [text, setText] = useState(null);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState(null);

  const sharedNotes = records.notes.filter((n) => n.visibility === 'parent');
  const draft = useMemo(
    () => buildReportDraft(learner, { checkIns: records.checkIns, sharedNotes, assessments: records.assessments }, period),
    [learner, records, period] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const saved = records.reports.find((r) => r.id === reportId) || null;

  // A new period starts from the records again; an opened report keeps the coach's edits.
  useEffect(() => {
    if (reportId) return;
    setText({ ...draft.text, academic: '' });
    setSelected(draft.selectedEvidence);
  }, [draft, reportId]);

  if (!text || !selected) return null;

  const dirty = !saved || TEXT_FIELDS.some((k) => (saved.text?.[k] || '') !== (text[k] || ''))
    || saved.period.from !== period.from || saved.period.to !== period.to
    || JSON.stringify([...(saved.selectedEvidence || [])].sort()) !== JSON.stringify([...selected].sort());
  const approved = saved?.status === 'approved' && !dirty;
  const chosen = draft.evidenceOptions.filter((e) => selected.includes(e.key));

  const persist = () => {
    const res = update((r) => saveReport(r, { id: reportId, period, text, selectedEvidence: selected, sources: draft.sources }));
    if (res.ok) { setReportId(res.id); setMessage('saved'); }
    return res;
  };
  const approve = () => {
    if (!checked) { setMessage('confirmFirst'); return; }
    const res = dirty || !reportId ? persist() : { ok: true, id: reportId };
    if (!res.ok) return;
    const id = res.id || reportId;
    update((r) => approveReport(r, id));
    setReportId(id);
    setMessage('approved');
  };
  const openSaved = (r) => {
    setReportId(r.id);
    setPeriod(r.period);
    setText({ ...draft.text, ...r.text });
    setSelected(r.selectedEvidence || []);
    setChecked(false);
    setMessage(null);
  };
  const startNew = () => { setReportId(null); setChecked(false); setMessage(null); setPeriod(defaultPeriod(today)); };
  const insertSummary = () => setText((x) => ({ ...x, narrative: factualSummary(t, learner, draft, day) }));
  const print = () => {
    document.body.classList.add('ml-printing');
    const done = () => { document.body.classList.remove('ml-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };
  const setField = (k) => (e) => setText((x) => ({ ...x, [k]: e.target.value }));
  const toggle = (key) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  return (
    <div className="gh-page ml-page ml-report">
      <div className="ml-no-print">
        <a className="gh-crumb" href={hrefFor.coachLearner(learner.uid)}><ArrowLeft size={15} aria-hidden="true" />{learner.name}</a>
        <div className="gh-page-head">
          <div>
            <h1>{t('ml.report.title', { name: learner.name })}</h1>
            <p className="gh-sub">{t('ml.report.subtitle')}</p>
          </div>
          <span className={`ml-report-state ml-report-${approved ? 'approved' : 'draft'}`}>
            {approved ? <><Check size={14} aria-hidden="true" />{t('ml.report.approvedOn', { date: when(saved.approvedAt) })}</> : t('ml.report.draft')}
          </span>
        </div>
        {saveError && <Alert type="error">{t('ml.saveFailed')}</Alert>}

        <section className="gh-card ml-period" aria-labelledby="rp-period">
          <h2 className="ml-h2" id="rp-period">{t('ml.report.period')}</h2>
          <div className="ml-row">
            <label className="ml-date-field"><span className="gh-label">{t('ml.report.from')}</span>
              <input className="gh-input ml-date" type="date" value={period.from} max={period.to} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value || p.from }))} /></label>
            <label className="ml-date-field"><span className="gh-label">{t('ml.report.to')}</span>
              <input className="gh-input ml-date" type="date" value={period.to} min={period.from} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value || p.to }))} /></label>
            {reportId && <button type="button" className="gh-btn gh-btn-sm" onClick={startNew}>{t('ml.report.new')}</button>}
          </div>
          {records.reports.length > 0 && (
            <details className="ml-history">
              <summary>{t('ml.report.earlier', { count: records.reports.length })}</summary>
              <ul className="ml-list">
                {records.reports.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="gh-link-btn" onClick={() => openSaved(r)}>{day(r.period.from)} – {day(r.period.to)}</button>
                    <span className="ml-cell-sub"> · {r.status === 'approved' ? t('ml.report.approvedOn', { date: when(r.approvedAt) }) : t('ml.report.draftSaved', { date: when(r.updatedAt) })}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {draft.flags.length > 0 && (
          <section className="ml-flags" aria-labelledby="rp-flags">
            <h2 className="ml-h2" id="rp-flags">{t('ml.report.checkFirst')}</h2>
            <ul>
              {draft.flags.map((f) => {
                const Icon = FLAG_ICON[f.severity];
                return <li key={f.id} className={`ml-flag-${f.severity}`}><Icon size={15} aria-hidden="true" /><span className="ml-sr">{t(`ml.flagLevel.${f.severity}`)}: </span>{t(`ml.flag.${f.id}`, { date: day(f.day) })}</li>;
              })}
            </ul>
          </section>
        )}
      </div>

      <div className="ml-report-grid ml-no-print">
        <div className="ml-stack">
          <ReportSection title={t('ml.report.s.academic')}>
            <p><NotAvailable /> <span className="ml-cell-sub">{t('ml.academic.notConnected')}</span></p>
            <TextArea id="rp-academic" label={t('ml.report.academicNote')} value={text.academic} onChange={setField('academic')} optional />
          </ReportSection>

          <ReportSection title={t('ml.report.s.project')}>
            <ProjectFacts learner={learner} draft={draft} />
          </ReportSection>

          <ReportSection title={t('ml.report.s.evidence')}>
            {draft.evidenceOptions.length ? (
              <fieldset className="ml-ev-pick">
                <legend className="gh-hint">{t('ml.report.pickEvidence')}</legend>
                {draft.evidenceOptions.map((e) => (
                  <label key={e.key} className="gh-check ml-check">
                    <input type="checkbox" checked={selected.includes(e.key)} onChange={() => toggle(e.key)} />
                    <span>{e.title} <span className="ml-cell-sub">· {e.source === 'coach' ? t('ml.ev.byCoach') : t('ml.ev.byLearner')} · {when(e.at)}</span></span>
                  </label>
                ))}
              </fieldset>
            ) : <NotAvailable>{t('ml.report.noEvidence')}</NotAvailable>}
          </ReportSection>

          <ReportSection title={t('ml.report.s.competencies')}>
            <Competencies draft={draft} />
          </ReportSection>

          <ReportSection title={t('ml.report.s.words')}>
            <TextArea id="rp-strengths" label={t('ml.report.strengths')} value={text.strengths} onChange={setField('strengths')} empty={!draft.text.strengths} />
            <TextArea id="rp-challenges" label={t('ml.report.challenges')} value={text.challenges} onChange={setField('challenges')} empty={!draft.text.challenges} />
            <TextArea id="rp-next" label={t('ml.report.nextSteps')} value={text.nextSteps} onChange={setField('nextSteps')} empty={!draft.text.nextSteps} />
            <TextArea id="rp-home" label={t('ml.report.home')} value={text.home} onChange={setField('home')} empty={!draft.text.home} hint={t('ml.report.homeHint')} />
          </ReportSection>

          <ReportSection title={t('ml.report.s.summary')}>
            <TextArea id="rp-narrative" label={t('ml.report.narrative')} value={text.narrative} onChange={setField('narrative')} rows={5} />
            <div className="gh-btn-row">
              <button type="button" className="gh-btn gh-btn-sm" onClick={insertSummary}>{t('ml.report.insertSummary')}</button>
            </div>
            <p className="ml-source"><Bot size={13} aria-hidden="true" /> {t('ml.report.aiNotConnected')}</p>
          </ReportSection>
        </div>

        <aside className="gh-card ml-sources" aria-labelledby="rp-sources">
          <h2 className="ml-h2" id="rp-sources">{t('ml.report.sources')}</h2>
          <p className="ml-source">{t('ml.report.sourcesExplain')}</p>
          <SourceList learner={learner} records={records} draft={draft} day={day} when={when} />
        </aside>
      </div>

      <section className="gh-card ml-approve ml-no-print" aria-labelledby="rp-approve">
        <h2 className="ml-h2" id="rp-approve">{t('ml.report.reviewTitle')}</h2>
        {approved ? (
          <>
            <p>{t('ml.report.approvedBody')}</p>
            <div className="gh-btn-row">
              <button type="button" className="gh-btn gh-btn-primary" onClick={print}><Printer size={16} aria-hidden="true" />{t('ml.report.print')}</button>
            </div>
          </>
        ) : (
          <>
            <label className="gh-check ml-check"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />{t('ml.report.confirm')}</label>
            <div className="gh-btn-row">
              <button type="button" className="gh-btn gh-btn-primary" onClick={approve} aria-disabled={!checked}>{t('ml.report.approve')}</button>
              <button type="button" className="gh-btn" onClick={persist} disabled={!dirty && Boolean(reportId)}>{t('ml.report.saveDraft')}</button>
            </div>
          </>
        )}
        {message && <p className={message === 'confirmFirst' ? 'gh-field-error' : 'ml-saved'} role="status">{t(`ml.report.msg.${message}`)}</p>}
        <p className="ml-source"><Send size={13} aria-hidden="true" /> {t('ml.report.notSent')}</p>
        <DeviceStoreNote />
      </section>

      <PrintedReport learner={learner} period={period} text={text} chosen={chosen} draft={draft} day={day} when={when}
                     approvedAt={approved ? saved.approvedAt : null} coachName={coachUser.displayName} />
    </div>
  );
}

function ReportSection({ title, children }) {
  return <section className="gh-card"><h2 className="ml-h2">{title}</h2>{children}</section>;
}

function TextArea({ id, label, value, onChange, rows = 3, hint, empty, optional }) {
  const { t } = useLocale();
  return (
    <div className="ml-field">
      <label className="gh-label" htmlFor={id}>{label}{optional && <span className="gh-opt"> ({t('common.optional')})</span>}</label>
      <textarea id={id} className="gh-input" rows={rows} value={value} onChange={onChange} aria-describedby={hint || empty ? `${id}-hint` : undefined} />
      {(hint || empty) && <p className="gh-hint" id={`${id}-hint`}>{empty ? t('ml.report.noRecordForField') : hint}</p>}
    </div>
  );
}

function ProjectFacts({ learner, draft }) {
  const { t } = useLocale();
  const day = useDay();
  const f = draft.facts;
  return (
    <>
      <dl className="ml-dl">
        <div><dt>{t('ml.pbl.question')}</dt><dd>{f.projectTitle || <NotAvailable />}</dd></div>
        <div><dt>{t('ml.pbl.stage')}</dt><dd>{f.stage ? `${f.stage} · ${t('ml.report.tasks', { done: f.tasksDone, total: f.tasksTotal })}` : <NotAvailable />}</dd></div>
        {f.programs.map((p) => <div key={p.title}><dt>{t('ml.pbl.program')}</dt><dd>{p.title} · <Missions p={p} /></dd></div>)}
      </dl>
      <h3 className="ml-h3">{t('ml.ms.title')}</h3>
      {draft.milestones.length ? (
        <ul className="ml-list">
          {draft.milestones.map((m) => <li key={m.id}>{m.title} <span className={`ml-ms ml-ms-${m.state}`}>{t(`ml.ms.${m.state}`, { date: day(m.doneOn) })}</span> <span className="ml-cell-sub">· {t('ml.next.due', { date: day(m.dueOn) })}</span></li>)}
        </ul>
      ) : <NotAvailable>{t('ml.report.noMilestones')}</NotAvailable>}
      <p className="ml-source">{t('ml.report.completionNote', { name: learner.name.split(' ')[0] })}</p>
    </>
  );
}

function Competencies({ draft }) {
  const { t } = useLocale();
  const by = (lv) => draft.competencies.filter((c) => c.level === lv);
  if (!draft.competencies.length) return <NotAvailable>{t('ml.report.noCompetencies')}</NotAvailable>;
  return (
    <dl className="ml-dl">
      <div><dt>{t('ml.level.independent')}</dt><dd>{by('independent').map((c) => c.title).join(', ') || '—'}</dd></div>
      <div><dt>{t('ml.level.support')}</dt><dd>{by('support').map((c) => c.title).join(', ') || '—'}</dd></div>
      <div><dt>{t('ml.report.supportNeeded')}</dt><dd>{by('insufficient').map((c) => c.title).join(', ') || '—'}</dd></div>
    </dl>
  );
}

/** Every record the draft drew on, so the coach can check the text against it. */
function SourceList({ records, draft, day, when }) {
  const { t } = useLocale();
  const checkIns = records.checkIns.filter((c) => draft.sources.checkIns.includes(c.id));
  const notes = records.notes.filter((n) => draft.sources.sharedNotes.includes(n.id));
  return (
    <div className="ml-source-list">
      <h3 className="ml-h3">{t('ml.report.src.checkIns', { count: checkIns.length })}</h3>
      {checkIns.length ? checkIns.map((c) => (
        <div key={c.id} className="ml-src">
          <strong>{when(c.at)}</strong>
          {c.strength && <p><span className="ml-label-inline">{t('ml.ci.strength')}:</span> {c.strength}</p>}
          {c.challenge && <p><span className="ml-label-inline">{t('ml.ci.challenge')}:</span> {c.challenge}</p>}
          <p><span className="ml-label-inline">{t('ml.ci.nextAction')}:</span> {c.nextAction} ({day(c.followUpOn)})</p>
        </div>
      )) : <p className="ml-cell-sub">{t('ml.report.src.noCheckIns')}</p>}
      <h3 className="ml-h3">{t('ml.report.src.notes', { count: notes.length })}</h3>
      {notes.length ? notes.map((n) => <div key={n.id} className="ml-src"><strong>{when(n.at)}</strong><p>{n.text}</p></div>)
        : <p className="ml-cell-sub">{t('ml.report.src.noNotes')}</p>}
      <h3 className="ml-h3">{t('ml.report.src.assessments', { count: draft.competencies.length })}</h3>
      {draft.competencies.map((c) => <p key={c.id} className="ml-src">{c.title}: {t(`ml.level.${c.level}`)} <span className="ml-cell-sub">· {when(c.at)}</span></p>)}
      <p className="ml-source"><span className="ml-label-inline">{t('ml.report.src.private')}</span></p>
    </div>
  );
}

/** The factual summary: one sentence per fact the records hold, nothing else. */
function factualSummary(t, learner, draft, day) {
  const f = draft.facts;
  const first = learner.name.split(' ')[0];
  const out = [t('ml.sum.period', { name: first, from: day(draft.period.from), to: day(draft.period.to) })];
  if (f.projectTitle && f.stage) out.push(t('ml.sum.project', { name: first, project: f.projectTitle, stage: f.stage }));
  else if (f.projectTitle) out.push(t('ml.sum.projectOnly', { name: first, project: f.projectTitle }));
  if (f.milestonesTotal) out.push(t('ml.sum.milestones', { done: f.milestonesDone, total: f.milestonesTotal }));
  if (f.independent || f.withSupport) out.push(t('ml.sum.competencies', { independent: f.independent, support: f.withSupport }));
  out.push(t('ml.sum.academic'));
  return out.join(' ');
}

/** Print layout: only what the coach chose and wrote, plus the approval line. */
function PrintedReport({ learner, period, text, chosen, draft, day, when, approvedAt, coachName }) {
  const { t } = useLocale();
  const para = (s) => s.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>);
  const block = (label, value) => (value?.trim() ? <section><h3>{label}</h3>{para(value)}</section> : null);
  return (
    <article className="ml-print-only" aria-hidden="true">
      <h1>{t('ml.print.title', { name: learner.name })}</h1>
      <p>{day(period.from)} – {day(period.to)} · {t('ml.print.coach', { name: coachName })}</p>
      {block(t('ml.report.s.summary'), text.narrative)}
      <section><h3>{t('ml.report.s.academic')}</h3><p>{t('ml.print.academicNA')}</p>{para(text.academic || '')}</section>
      <section><h3>{t('ml.report.s.project')}</h3>
        {draft.facts.projectTitle && <p>{draft.facts.projectTitle}{draft.facts.stage ? ` · ${draft.facts.stage}` : ''}</p>}
        {draft.milestones.map((m) => <p key={m.id}>{m.title}: {t(`ml.ms.${m.state}`, { date: day(m.doneOn) })}</p>)}
      </section>
      {chosen.length > 0 && <section><h3>{t('ml.report.s.evidence')}</h3>{chosen.map((e) => <p key={e.key}>{e.title} ({when(e.at)}){e.link ? ` · ${e.link}` : ''}</p>)}</section>}
      {draft.competencies.length > 0 && <section><h3>{t('ml.report.s.competencies')}</h3>{draft.competencies.map((c) => <p key={c.id}>{c.title}: {t(`ml.level.${c.level}`)}</p>)}</section>}
      {block(t('ml.report.strengths'), text.strengths)}
      {block(t('ml.report.challenges'), text.challenges)}
      {block(t('ml.report.nextSteps'), text.nextSteps)}
      {block(t('ml.report.home'), text.home)}
      <p className="ml-print-foot">{approvedAt ? t('ml.print.approved', { date: when(approvedAt) }) : t('ml.print.notApproved')}</p>
    </article>
  );
}
