import { useMemo, useRef, useState } from 'react';
import { ArrowRight, ImagePlus, Link2, Plus, Trash2, X, Award, Pencil, Check } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ProgramIcon } from '../pbl/programs/ProgramIcon.jsx';
import { portfolioSections, addEntry, removeEntry, setDetails, coverage, imageProblem, LIMITS, LAYOUTS } from './portfolioModel.js';
import { usePortfolio, uploadPortfolioImage, deletePortfolioImages } from './usePortfolio.js';
import '../pbl/programs/programs.css';
import './portfolio.css';

/**
 * My Portfolio on My Dashboard: one page per current PBL program, designed
 * from that program (its colours, icon and driving question) and divided into
 * sections by the competencies the program develops.
 */
export function PortfolioSlide({ uid, data, firstName }) {
  const courses = data.courses;
  const [chosen, setChosen] = useState(null);
  const course = courses.find((c) => c.program.id === chosen) || courses[0];
  if (data.state === 'loading') return <p className="sd-notice" role="status">Loading your programs…</p>;
  if (!course) return <div className="sd-empty"><Award size={25} aria-hidden="true" /><h4>Your portfolio starts with a program</h4><p>When you join a PBL program, its portfolio appears here, with a section for every competency it develops.</p><a className="sd-primary" href={hrefFor.courses()}>Find a program <ArrowRight size={16} /></a></div>;
  return <>
    {courses.length > 1 && <div className="sd-plan-tabs lh-tabs pf-programs" role="group" aria-label="Choose a program portfolio">{courses.map(({ program }) =>
      <button type="button" key={program.id} aria-pressed={program.id === course.program.id} onClick={() => setChosen(program.id)}>{program.identity?.short || program.title}</button>)}</div>}
    <ProgramPortfolio key={course.program.id} uid={uid} program={course.program} firstName={firstName} />
  </>;
}

function ProgramPortfolio({ uid, program, firstName }) {
  const { portfolio, apply, syncState } = usePortfolio(uid, program);
  const sections = useMemo(() => portfolioSections(program), [program]);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(null);
  const tally = coverage(portfolio, sections);
  const identity = program.identity || { icon: 'Compass', tone: 'purple', short: program.title };
  return <div className={`pf-page pf-layout-${portfolio.layout}`} data-tone={identity.tone}>
    <header className="pf-hero">
      <span className="pf-hero-art" aria-hidden="true"><ProgramIcon name={identity.icon} size={120} /></span>
      <div className="pf-hero-text">
        <span className="pf-kicker">{identity.short} · PBL portfolio</span>
        {editing ? <form className="pf-details" onSubmit={(e) => { e.preventDefault(); setEditing(false); }}>
          <label>Portfolio title<input maxLength={LIMITS.headline} value={portfolio.headline} placeholder={`${firstName ? `${firstName}’s` : 'My'} ${identity.short} portfolio`} onChange={(e) => apply((p) => setDetails(p, { headline: e.target.value }))} autoFocus /></label>
          <label>About my project<textarea rows={3} maxLength={LIMITS.about} value={portfolio.about} placeholder="What did you build or investigate, and why does it matter to you?" onChange={(e) => apply((p) => setDetails(p, { about: e.target.value }))} /></label>
          <fieldset><legend>Layout</legend>{LAYOUTS.map((l) => <label key={l.id} className="pf-radio"><input type="radio" name={`layout-${program.id}`} checked={portfolio.layout === l.id} onChange={() => apply((p) => setDetails(p, { layout: l.id }))} />{l.label}</label>)}</fieldset>
          <button type="submit" className="sd-primary"><Check size={16} /> Done</button>
        </form> : <>
          <h3>{portfolio.headline || `${firstName ? `${firstName}’s` : 'My'} ${identity.short} portfolio`}</h3>
          <p className="pf-question">{portfolio.about || program.drivingQuestion || program.title}</p>
          <div className="pf-hero-meta"><span><strong>{tally.pieces}</strong> {tally.pieces === 1 ? 'piece' : 'pieces'} of evidence</span><span><strong>{tally.filled}</strong> of {tally.total} {sections[0]?.kind === 'phase' ? 'phases' : 'competencies'} with evidence</span>
            <button type="button" className="pf-edit" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden="true" /> Customise</button></div>
        </>}
      </div>
    </header>
    {sections[0]?.kind === 'phase' && <p className="sd-caption">This program doesn’t list its competencies yet, so the portfolio is organised by phase.</p>}
    <nav className="pf-toc" aria-label="Portfolio sections">{sections.map((s) => {
      const n = portfolio.entries.filter((e) => e.sectionId === s.id).length;
      return <a key={s.id} href={`#pf-${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`pf-${s.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }} data-filled={n > 0 || undefined}><span>{s.code}</span>{s.title}<em>{n}</em></a>;
    })}</nav>
    {sections.map((section) => {
      const entries = portfolio.entries.filter((e) => e.sectionId === section.id);
      return <section key={section.id} id={`pf-${section.id}`} className="pf-section" aria-labelledby={`pf-h-${section.id}`}>
        <div className="pf-section-head">
          <span className="pf-code">{section.code}</span>
          <div><span className="sd-eyebrow">{section.domain || 'Program phase'}{section.phases.length && section.kind === 'competency' ? ` · built in ${section.phases.join(', ')}` : ''}</span>
            <h4 id={`pf-h-${section.id}`}>{section.title}</h4>{section.statement && <p>{section.statement}</p>}</div>
        </div>
        {section.prompts.length > 0 && <ul className="pf-prompts" aria-label="What this program asks you to collect">{section.prompts.map((p) => <li key={p.text}><span>Session {p.session}</span>{p.text}</li>)}</ul>}
        {entries.length > 0 && <div className="pf-entries">{entries.map((entry) => <EvidenceCard key={entry.id} entry={entry} onRemove={() => { if (window.confirm(`Remove “${entry.title}” from your portfolio?`)) { deletePortfolioImages(entry.images); apply((p) => removeEntry(p, entry.id)); } }} />)}</div>}
        {adding === section.id ? <EvidenceForm uid={uid} program={program} section={section} onCancel={() => setAdding(null)}
          onSave={(draft) => { const entry = { ...draft, sectionId: section.id }, check = addEntry(portfolio, entry); if (check.error) return check.error; apply((p) => addEntry(p, entry).portfolio || p); return null; }}
          onDone={() => setAdding(null)} />
          : <button type="button" className="pf-add" onClick={() => setAdding(section.id)}><Plus size={16} aria-hidden="true" /> Add evidence{entries.length ? '' : ' for this section'}</button>}
      </section>;
    })}
    <p className="sd-caption" role="status">{syncState === 'saving' ? 'Saving your portfolio…' : syncState === 'saved' ? 'Portfolio saved to your account · your coach can see it' : syncState === 'local-only' ? 'Saved on this device only · account sync is unavailable right now' : 'Evidence is what you choose to show. It is not a coach-verified mastery level.'}</p>
  </div>;
}

function EvidenceCard({ entry, onRemove }) {
  return <article className="pf-card">
    {entry.images.length > 0 && <div className={`pf-images pf-images-${Math.min(entry.images.length, 4)}`}>{entry.images.map((img) =>
      <a key={img.url} href={img.url} target="_blank" rel="noreferrer"><img src={img.url} alt={img.name || entry.title} loading="lazy" /></a>)}</div>}
    <div className="pf-card-body">
      <h5>{entry.title}</h5>
      {entry.note && <p>{entry.note}</p>}
      {entry.link && <a className="sd-link" href={entry.link} target="_blank" rel="noreferrer"><Link2 size={14} aria-hidden="true" /> Open link</a>}
      <div className="pf-card-foot"><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
        <button type="button" className="sd-text-button" onClick={onRemove} aria-label={`Remove ${entry.title}`}><Trash2 size={14} aria-hidden="true" /></button></div>
    </div>
  </article>;
}

function EvidenceForm({ uid, program, section, onSave, onCancel, onDone }) {
  const [d, setD] = useState({ title: '', note: '', link: '' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const input = useRef(null);
  function pick(list) {
    const next = [...files];
    for (const file of list) {
      const problem = imageProblem(file);
      if (problem) { setError(problem); continue; }
      if (next.length >= LIMITS.images) { setError(`Up to ${LIMITS.images} images per piece of evidence.`); break; }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles(next);
  }
  async function submit(event) {
    event.preventDefault();
    setError(null);
    if (!d.title.trim()) { setError('Give this evidence a short title.'); return; }
    const images = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        setBusy(`Uploading image ${i + 1} of ${files.length}…`);
        images.push(await uploadPortfolioImage(uid, program.id, files[i].file));
      }
    } catch (err) {
      setBusy(null);
      deletePortfolioImages(images);
      setError(`Your image couldn’t be uploaded (${err?.code || err?.message || 'network error'}). Your words are still here; try again.`);
      return;
    }
    setBusy(null);
    const problem = onSave({ ...d, images });
    if (problem) { deletePortfolioImages(images); setError(problem); return; }
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    onDone();
  }
  return <form className="pf-form" onSubmit={submit} aria-label={`New evidence for ${section.title}`}>
    <div className="pf-form-head"><strong>New evidence · {section.title}</strong><button type="button" className="sd-button" aria-label="Cancel" onClick={onCancel}><X size={16} /></button></div>
    {error && <p className="sd-notice" role="alert">{error}</p>}
    <label>Title<input maxLength={LIMITS.title} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. My first sensor prototype" autoFocus /></label>
    <label>What does this show?<textarea rows={3} maxLength={LIMITS.note} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder={`How this shows ${section.title.toLowerCase()}`} /></label>
    <div className="pf-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}>
      {files.map((f, i) => <span key={f.preview} className="pf-thumb"><img src={f.preview} alt={f.file.name} /><button type="button" aria-label={`Remove ${f.file.name}`} onClick={() => { URL.revokeObjectURL(f.preview); setFiles(files.filter((_, j) => j !== i)); }}><X size={12} /></button></span>)}
      {files.length < LIMITS.images && <button type="button" className="pf-upload" onClick={() => input.current?.click()}><ImagePlus size={20} aria-hidden="true" /><span>Add images<small>JPG, PNG, WebP or GIF · up to 10 MB · drop here</small></span></button>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
    </div>
    <label><span>Link <span className="sd-caption">(optional · video, doc or code)</span></span><input type="url" maxLength={LIMITS.link} value={d.link} onChange={(e) => setD({ ...d, link: e.target.value })} placeholder="https://" /></label>
    <div className="pf-form-actions"><button type="submit" className="sd-primary" disabled={!!busy}>{busy || 'Save evidence'}</button><button type="button" className="sd-text-button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
