import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Search, SlidersHorizontal, X, Check, Compass, Globe2, Sparkles, BookOpen, Clock3, ShieldCheck, RotateCcw } from 'lucide-react';
import { filterDiscovery } from './discoveryModel.js';
import './discovery.css';

const TOPICS = ['All topics', 'Climate & energy', 'Robotics', 'Engineering', 'Coding', 'Living systems'];

export function CourseDiscovery({ items = [], recommendations = [], achievements = [], name, loading = false, error,
  recommendationError, onRetry, onChooseQuest, onOpenActivity, onOpenProgram, preview = false, externalAvailable = false }) {
  const [query, setQuery] = useState(''), [source, setSource] = useState('all'), [topic, setTopic] = useState('All topics');
  const [kind, setKind] = useState('All formats'), [detail, setDetail] = useState(null), [filtersOpen, setFiltersOpen] = useState(false);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [saveError, setSaveError] = useState('');
  const results = useMemo(() => filterDiscovery(items, { query, source, topic, kind }), [items, query, source, topic, kind]);
  const suggested = useMemo(() => filterDiscovery(recommendations, { query, source, topic, kind: 'All formats' }).slice(0, 3), [recommendations, query, source, topic]);
  const activeFilters = topic !== 'All topics' || kind !== 'All formats';
  function reset() { setQuery(''); setTopic('All topics'); setKind('All formats'); setSource('all'); }
  function open(item) { setDetail(item); setSaveError(''); }
  async function choose(item) {
    if (!onChooseQuest || busy) return;
    setBusy(true); setSaveError('');
    try { await onChooseQuest(item); setDetail(null); setNotice(preview ? 'Quest chosen in this sample preview.' : 'Your quest is saved. Find it in Learning Goals.'); }
    catch (e) { setSaveError(e.message || 'Your quest could not save. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="cd-page" aria-label="Course discovery">
    {preview && <div className="cd-preview"><span className="cd-live-dot" />DESIGN PREVIEW <span>Sample learner · fictional external courses · no live AI</span></div>}
    <div className="cd-breadcrumb">LEARNING / <strong>DISCOVER</strong><span className="cd-term"><span /> A little curiosity goes a long way</span></div>
    <header className="cd-hero">
      <div className="cd-hero-copy"><span className="cd-eyebrow">YOUR NEXT CHAPTER</span><h1>Follow your <em>curiosity.</em></h1>
        <p>Find a course that sparks something. Build on what you know.<br className="cd-desktop-break" /> Make your next step your own.</p></div>
      <div className="cd-hero-art" aria-hidden="true"><OrbitArt /></div>
    </header>
    <div className="cd-search-wrap"><Search size={22} aria-hidden="true" /><label className="cd-sr" htmlFor="cd-search">Search courses, programs and activities</label>
      <input id="cd-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="What would you like to learn?" />
      <span className="cd-search-hint">Topics, skills, programs…</span>
      <button type="button" className="cd-filter-button" aria-expanded={filtersOpen} aria-controls="cd-filters" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17} />Filters{activeFilters && <i />}</button>
    </div>
    <div className="cd-topic-row" aria-label="Explore a topic">{TOPICS.slice(0, 5).map(t => <button type="button" key={t} className={topic === t ? 'is-active' : ''} aria-pressed={topic === t} onClick={() => setTopic(t)}>{t === 'All topics' && <Compass size={14} />}{t}</button>)}</div>

    <section className="cd-recommend" aria-labelledby="cd-recommend-title">
      <div className="cd-recommend-head"><div><span className="cd-recommend-icon"><Sparkles size={20} /></span><div><h2 id="cd-recommend-title">A next step that fits <em>you.</em></h2><p>{name ? `${name.split(' ')[0]}, ` : ''}your goals and achievements help shape these suggestions.</p></div></div><span className="cd-method">{preview ? 'PERSONALIZATION PREVIEW' : 'COMPETENCY-BASED'}</span></div>
      <div className="cd-context"><span><ShieldCheck size={15} />YOUR FOUNDATION</span>{achievements.length ? achievements.slice(0, 3).map(a => <span className="cd-achievement" key={a.id}><Check size={12} />{a.title}</span>) : <p>Start exploring. Your coach can help identify your strengths.</p>}<small>{achievements.length ? 'Coach-confirmed' : 'No confirmed skills yet'}</small></div>
      {loading ? <p className="cd-soft-state" role="status">Finding your next steps…</p> : recommendationError ? <div className="cd-soft-state"><p>Your personalized suggestions couldn’t load. You can still explore courses below.</p><button onClick={onRetry} type="button">Try suggestions again <RotateCcw size={14} /></button></div> : suggested.length ? <div className="cd-suggestion-grid">{suggested.map((item, i) => <button type="button" key={item.id} className="cd-suggestion" onClick={() => open(item)}>
        <span className="cd-suggestion-number">0{i + 1}</span><span className="cd-suggestion-body"><span className="cd-mini-label">{item.source === 'external' ? 'EXPLORE FURTHER' : item.readiness === 'confirmed' ? 'BUILD ON YOUR STRENGTHS' : 'A PLACE TO START'}</span><strong>{item.title}</strong><span className="cd-suggestion-reason">{item.reason}</span><span className="cd-suggestion-link">Take a closer look <ArrowRight size={15} /></span></span>
      </button>)}</div> : <p className="cd-soft-state">{query || activeFilters || source !== 'all' ? 'No personalized suggestions match these filters. Explore the results below or try another topic.' : 'Your next recommendations will appear here when your coach publishes suitable mapped lessons.'}</p>}
      <p className="cd-recommend-foot"><span className="cd-tiny-star">✦</span> A suggestion is a starting point. You choose where to go.</p>
    </section>

    <div className="cd-explore-layout">
      <aside className={`cd-sidebar ${filtersOpen ? 'is-open' : ''}`} id="cd-filters" aria-label="Course filters"><div className="cd-sidebar-heading"><h2>Make it yours</h2><SlidersHorizontal size={16} /></div>
        <fieldset><legend>WHERE TO LOOK</legend>{[['all', 'Everywhere', Compass], ['welearn', 'WeLearn programs', BookOpen], ['external', 'Beyond WeLearn', Globe2]].map(([id, label, Icon]) => <label className="cd-source-option" key={id}><input type="radio" name="cd-source" checked={source === id} onChange={() => setSource(id)} /><Icon size={16} /><span>{label}</span>{source === id && <Check size={14} />}</label>)}</fieldset>
        <fieldset><legend>YOUR INTERESTS</legend>{TOPICS.slice(1).map(t => <label className="cd-topic-option" key={t}><input type="checkbox" checked={topic === t} onChange={() => setTopic(topic === t ? 'All topics' : t)} /><span>{t}</span></label>)}</fieldset>
        <label className="cd-format-label">LEARNING FORMAT<select value={kind} onChange={e => setKind(e.target.value)}>{['All formats', 'Program', 'Activity', 'Course', 'Quest'].map(t => <option key={t}>{t}</option>)}</select></label>
        {(activeFilters || query || source !== 'all') && <button type="button" className="cd-clear" onClick={reset}>Reset filters <RotateCcw size={13} /></button>}
        <div className="cd-coach-note"><span><Compass size={20} /></span><strong>You don’t need it all figured out.</strong><p>Try something new. Talk it through with your coach. Small steps count.</p></div>
      </aside>
      <section className="cd-results" aria-labelledby="cd-results-title"><div className="cd-results-heading"><div><span className="cd-eyebrow">ROOM TO EXPLORE</span><h2 id="cd-results-title">{query ? `Results for “${query}”` : source === 'external' ? 'Learning has no borders.' : 'Find your next possibility.'}</h2></div><span className="cd-result-count" role="status" aria-live="polite">{results.length} {results.length === 1 ? 'option' : 'options'}</span></div>
        <div className="cd-results-tabs" aria-label="Course sources">{[['all', 'All learning'], ['welearn', 'WeLearn'], ['external', 'External']].map(([id, label]) => <button type="button" key={id} onClick={() => setSource(id)} aria-pressed={source === id} className={source === id ? 'is-active' : ''}>{label}{id === 'external' && <ArrowUpRight size={13} />}</button>)}<span>{preview ? 'Sample external catalog' : 'Explore at your own pace'}</span></div>
        {error && <p className="cd-inline-message" role="alert">Your school catalog couldn’t load. Showing standard program information. <button type="button" onClick={onRetry}>Retry</button></p>}
        {source === 'external' && !externalAvailable && <div className="cd-empty"><Globe2 size={35} /><h3>There’s a wider world of learning.</h3><p>External course search isn’t available yet. Keep exploring WeLearn, or ask your coach for other options.</p><button type="button" className="cd-primary" onClick={() => setSource('welearn')}>Explore WeLearn <ArrowRight size={16} /></button></div>}
        {results.length ? <div className="cd-course-grid">{results.map(item => <CourseCard key={item.id} item={item} onOpen={() => open(item)} />)}</div> : (source !== 'external' || externalAvailable) && <div className="cd-empty"><Search size={32} /><h3>A different search could open a door.</h3><p>Try a broader topic or remove a filter.</p><button type="button" className="cd-primary" onClick={reset}>Show all learning <ArrowRight size={16} /></button></div>}
        <div className="cd-end-note"><span>✦</span> Curiosity doesn’t need a perfect plan.</div>
      </section>
    </div>
    {notice && <div className="cd-toast" role="status"><Check size={17} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {detail && <CourseDetails item={detail} busy={busy} error={saveError} preview={preview} onClose={() => { if (!busy) setDetail(null); }}
      onChoose={onChooseQuest && detail.recommendationId ? () => choose(detail) : null} onOpenActivity={onOpenActivity} onOpenProgram={onOpenProgram} />}
  </main>;
}

function CourseCard({ item, onOpen }) {
  return <article className="cd-course-card"><button type="button" onClick={onOpen} className="cd-card-image" aria-label={`View ${item.title}`} data-art={item.art}>
    <CourseArt type={item.art} /><span className="cd-card-kind">{item.kind}</span><span className="cd-card-image-arrow"><ArrowUpRight size={16} /></span>
  </button><div className="cd-card-content"><div className="cd-provider">{item.source === 'external' ? <Globe2 size={12} /> : <span className="cd-provider-mark">w.</span>}{item.provider}{item.sample && <span className="cd-sample-badge">SAMPLE</span>}</div>
    <h3><button type="button" onClick={onOpen}>{item.title}</button></h3><p className="cd-card-description">{item.description}</p>
    <div className="cd-card-meta"><span><BookOpen size={12} />{item.format || item.kind}</span>{item.duration && <span><Clock3 size={12} />{item.duration}</span>}</div>
    <div className="cd-card-bottom"><span>{item.readiness === 'confirmed' ? <><Check size={12} />Prerequisites confirmed</> : item.source === 'external' ? 'Check requirements' : item.availability}</span><button type="button" aria-label={`Details for ${item.title}`} onClick={onOpen}><ArrowRight size={17} /></button></div>
  </div></article>;
}

function CourseDetails({ item, busy, error, onClose, onChoose, onOpenActivity, onOpenProgram, preview }) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    ref.current.showModal();
    return () => opener?.focus?.();
  }, []);
  return <dialog ref={ref} className="cd-dialog" aria-labelledby="cd-detail-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="cd-detail-art" data-art={item.art}><CourseArt type={item.art} /><button type="button" className="cd-close-detail" aria-label="Close course details" disabled={busy} onClick={onClose}><X size={20} /></button><span className="cd-card-kind">{item.kind}</span></div>
    <div className="cd-detail-body"><span className="cd-provider">{item.source === 'external' ? <Globe2 size={14} /> : <BookOpen size={14} />}{item.provider}{item.sample && ' · Fictional example'}</span><h2 id="cd-detail-title">{item.title}</h2><p>{item.description}</p>
      {item.reason && <div className="cd-why"><Sparkles size={18} /><div><strong>Why this could fit</strong><p>{item.reason}</p></div></div>}
      <div className="cd-detail-facts"><span>FORMAT<strong>{item.format || item.kind}</strong></span><span>TIME<strong>{item.duration || 'Varies by activity'}</strong></span><span>READINESS<strong>{item.readiness === 'confirmed' ? 'Prerequisites confirmed' : item.readiness === 'explore' ? 'Foundational exploration' : 'Check with your coach'}</strong></span><span>ACCESS<strong>{item.source === 'external' ? item.cost || 'Check provider' : item.availability}</strong></span></div>
      {item.competencies?.length > 0 && <section><h3>What you’ll work toward</h3>{item.competencies.map(c => <div className="cd-competency" key={c.id}><ShieldCheck size={17} /><div><strong>{c.title}</strong><p>{c.statement}</p></div></div>)}</section>}
      {item.questSteps?.length > 0 && <section><h3>Your first steps</h3><ol>{item.questSteps.map(s => <li key={s.id}><strong>{s.title}</strong><p>{s.instructions}</p></li>)}</ol></section>}
      {item.milestones?.length > 0 && <section><h3>The learning journey</h3><ol>{item.milestones.map(m => <li key={m}>{m}</li>)}</ol></section>}
      {item.criteria?.length > 0 && <section><h3>How you can show your learning</h3><ul>{item.criteria.map(c => <li key={c}>{c}</li>)}</ul><p className="cd-detail-muted">Your coach reviews the evidence. Completing a course doesn’t automatically establish mastery.</p></section>}
      {item.source === 'external' && <div className="cd-external-note"><Globe2 size={18} /><p>{item.sample ? 'This fictional course demonstrates external discovery. Provider links and enrollment are unavailable in this preview.' : 'Learning takes place on the provider’s website. Check current requirements and costs before choosing.'}</p></div>}
      {error && <p role="alert" className="cd-save-error">{error}</p>}
      <div className="cd-detail-actions">{onChoose ? <button type="button" className="cd-primary" disabled={busy} onClick={onChoose}>{busy ? 'Saving your quest…' : 'Choose this quest'}<ArrowRight size={17} /></button> : item.activityId && onOpenActivity ? <button type="button" className="cd-primary" onClick={() => { onClose(); onOpenActivity(item.activityId); }}>Open activity<ArrowRight size={17} /></button> : item.programId && onOpenProgram ? <button type="button" className="cd-primary" onClick={() => { onClose(); onOpenProgram(item.programId); }}>Explore program enrollment<ArrowRight size={17} /></button> : item.canonicalUrl && /^https:\/\//.test(item.canonicalUrl) && !item.sample ? <a className="cd-primary" href={item.canonicalUrl} target="_blank" rel="noopener noreferrer">Visit provider<ArrowUpRight size={17} /></a> : <span className="cd-detail-muted">{preview ? 'Sample course · for design review' : 'Ask your coach about your next step.'}</span>}</div>
    </div>
  </dialog>;
}

function OrbitArt() {
  return <svg viewBox="0 0 280 200" fill="none"><ellipse cx="140" cy="100" rx="100" ry="42" transform="rotate(-30 140 100)" stroke="#bccbb6"/><ellipse cx="140" cy="100" rx="100" ry="42" transform="rotate(35 140 100)" stroke="#bccbb6"/><circle cx="140" cy="100" r="43" fill="#d5edb5"/><path d="m122 115 12-37 25 17-37 20Z" fill="#214d3a"/><path d="m134 78 6 27 19-10" stroke="#f6fff1"/><circle cx="225" cy="53" r="12" fill="#ddd1ed"/><path d="M222 53h6m-3-3v6" stroke="#684b85"/><circle cx="70" cy="155" r="8" fill="#b4d57f"/><path d="m72 37 4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z" fill="#6b536e"/></svg>;
}

function CourseArt({ type }) {
  if (type === 'robot') return <svg viewBox="0 0 300 160" fill="none" aria-hidden="true"><path d="M0 140h300M0 115h300M40 0v160M100 0v160M160 0v160M220 0v160M280 0v160" stroke="currentColor" opacity=".09"/><path d="m102 94-32 32-22-5m150-27 32 32 22-5M116 91l-13 43-23 10m104-53 13 43 23 10" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/><rect x="97" y="48" width="106" height="54" rx="17" fill="currentColor"/><rect x="113" y="59" width="74" height="29" rx="9" fill="#e6dff2"/><circle cx="132" cy="73" r="5" fill="currentColor"/><circle cx="169" cy="73" r="5" fill="currentColor"/><path d="M151 48V33m-15-1h30" stroke="currentColor" strokeWidth="4"/><circle cx="151" cy="28" r="6" fill="#b6d97c"/></svg>;
  if (type === 'solar') return <svg viewBox="0 0 300 160" fill="none" aria-hidden="true"><circle cx="229" cy="40" r="20" fill="#f6d675"/><path d="m75 67-21 60h151l-21-60H75Z" fill="currentColor"/><path d="M90 69 78 125m39-56-4 56m30-56 4 56m10-56 13 56M65 89h127M59 108h140" stroke="#b5d5c0" strokeWidth="2"/><path d="M119 129v17m26-17v17m-50 0h75" stroke="currentColor" strokeWidth="4"/><path d="M239 80h20m-10-10v20" stroke="#cf9e48"/><path d="M0 152c65-25 105-9 150-7s100-14 150 2" stroke="currentColor" opacity=".3"/></svg>;
  if (type === 'plant') return <svg viewBox="0 0 300 160" fill="none" aria-hidden="true"><circle cx="150" cy="80" r="64" stroke="currentColor" opacity=".12"/><circle cx="150" cy="80" r="47" stroke="currentColor" opacity=".12"/><path d="M150 132V53" stroke="currentColor" strokeWidth="4"/><path d="M151 86c-42 4-48-23-43-37 31 0 47 10 43 37Zm-1 21c43 3 52-27 46-44-32 1-49 17-46 44Z" fill="currentColor"/><path d="M121 66 150 88m31-6-30 23" stroke="#d0e6ad" strokeWidth="2"/><path d="M123 135h54" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
  if (type === 'science') return <svg viewBox="0 0 300 160" fill="none" aria-hidden="true"><circle cx="150" cy="85" r="55" stroke="currentColor" opacity=".14"/><path d="M131 35h38m-31 2v43l-32 49c-4 7 0 12 9 12h70c9 0 13-5 9-12l-32-49V37" stroke="currentColor" strokeWidth="4"/><path d="m123 109-12 21c-1 3 1 5 5 5h68c4 0 6-2 4-5l-12-21h-53Z" fill="currentColor"/><circle cx="150" cy="100" r="5" fill="currentColor"/><circle cx="159" cy="87" r="3" fill="currentColor"/><path d="M208 45v16m-8-8h16" stroke="currentColor" strokeWidth="2"/></svg>;
  return <svg viewBox="0 0 300 160" fill="none" aria-hidden="true"><circle cx="215" cy="41" r="22" fill="#f1d98c"/><path d="M0 128 79 53l82 75H0Z" fill="currentColor" opacity=".17"/><path d="m92 160 93-104 111 104H92Z" fill="currentColor" opacity=".3"/><path d="M0 136c51-24 95-25 144-3 48 22 103-17 156-3v30H0v-24Z" fill="currentColor"/><path d="M153 140c-2 10-26 12-24 20h30c-6-10 23-13 14-21" fill="#d9e7c4"/><path d="M42 105V70m-15 24 15-25 15 25H27Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/><path d="M245 124V93m-12 16 12-22 12 22h-24Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/></svg>;
}
