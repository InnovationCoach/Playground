import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HelpCircle, Compass, Pause, Play, ChevronLeft, ChevronRight, SlidersHorizontal, Clock, Package, MapPin, Upload,
  PenLine, Mic, Camera, Video, Code, Focus, LayoutGrid, Calendar, ListChecks, BookOpen, BarChart3, Target, Lock,
  MessageCircle, CheckCircle2, Info, X, ArrowRight, Palette, Type
} from 'lucide-react';
import { useSchoolResource, schoolPath, mutateSchool, serviceMessage } from './useSchoolWorkspace.js';
import { ProgramCatalogueChooser } from './ProgramCatalogueChooser.jsx';
import './w2eStudio.css';

/**
 * W2e learner studio: the student's learning home inside the school panel.
 * Visual system ported from tests/w2e-preview (brand tokens, hero + slider,
 * one prominent next step, compact optional cards, information rail).
 *
 * The next step, pacing suggestions, curiosity questions and example plan are
 * labelled examples until published lessons drive them. Support requests and
 * calendar events use the real API; display preferences stay on the device.
 */
const SLIDES = [
  { quote: 'Big ideas begin with one small experiment.', text: 'Your next step takes about ten minutes.', action: 'next', label: 'Go to my next step', bg: 'var(--w-lime-100)',
    art: <svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="40" r="18" fill="none" stroke="#003C69" strokeWidth="3"/><circle cx="36" cy="40" r="7" fill="#96D700"/><path d="M36 10v8M14 40h6M52 40h6" stroke="#8250A0" strokeWidth="3" strokeLinecap="round"/><circle cx="54" cy="18" r="4" fill="#AE266C"/></svg> },
  { quote: 'Your questions belong here.', text: 'Curiosity space has no grades and no deadlines.', action: 'curiosity', label: 'Open curiosity space', bg: 'var(--w-magenta-100)',
    art: <svg viewBox="0 0 72 72" aria-hidden="true"><path d="M16 50 C 24 20, 48 20, 56 50" fill="none" stroke="#AE266C" strokeWidth="3" strokeLinecap="round"/><circle cx="16" cy="50" r="5" fill="#8250A0"/><circle cx="56" cy="50" r="5" fill="#8250A0"/><circle cx="36" cy="28" r="6" fill="#96D700"/><path d="M30 58h12" stroke="#003C69" strokeWidth="3" strokeLinecap="round"/></svg> },
  { quote: 'Try, notice, adjust. That is progress.', text: 'Pausing is allowed. Your checked steps stay with the task.', bg: 'var(--w-sky-100)',
    art: <svg viewBox="0 0 72 72" aria-hidden="true"><path d="M12 52 L28 36 L40 46 L60 20" fill="none" stroke="#003C69" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="28" cy="36" r="4" fill="#8250A0"/><circle cx="40" cy="46" r="4" fill="#AE266C"/><circle cx="60" cy="20" r="5" fill="#96D700"/><path d="M12 60h48" stroke="#9BD2FF" strokeWidth="3" strokeLinecap="round"/></svg> },
  { quote: 'There is more than one way to show what you know.', text: 'Write, record, photograph, or build a model.', action: 'evidence', label: 'See the evidence formats', bg: 'var(--w-purple-100)',
    art: <svg viewBox="0 0 72 72" aria-hidden="true"><rect x="12" y="38" width="14" height="22" rx="3" fill="#8250A0"/><rect x="29" y="26" width="14" height="34" rx="3" fill="#96D700"/><rect x="46" y="14" width="14" height="46" rx="3" fill="#003C69"/><circle cx="19" cy="24" r="5" fill="none" stroke="#AE266C" strokeWidth="3"/></svg> }
];

const STEPS = ['Choose a room or outdoor space.', 'Identify three things that use electricity.', 'Explain which might use the most energy, and why.'];

const PACING = [
  ['A small step', 'A small step is enough. Try identifying just one electricity user first, then stop or continue.'],
  ['Steady pace', 'Stay with the three-step campus investigation at your own pace.'],
  ['Ready to stretch', 'Optional stretch: estimate daily energy use for your space and explain your assumptions.'],
  ['Skip', 'No check-in needed. Your next step stays the same.']
];

const FORMATS = [
  ['Write', PenLine, 'List the three energy users, explain your estimate for the biggest one, and name one thing you are unsure about.'],
  ['Audio', Mic, 'Record one to three minutes. Say which space you chose, the three energy users, and why one probably uses the most.'],
  ['Photo', Camera, 'Add a photo or sketch with labels. A short caption can explain your estimate and your uncertainty.'],
  ['Video', Video, 'A short clip of the space with your voice-over works well. Keep other people out of shot.'],
  ['Code', Code, 'Share a spreadsheet, simulation or code that estimates energy use. Explain your assumptions in a comment.']
];

const reducedMotion = () => document.documentElement.dataset.motion === 'reduce' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isoDate = (d) => d.toISOString().slice(0, 10);

/** Accessible dialog: Escape closes, focus moves in and returns to the opener. */
function Modal({ title, icon: Icon, onClose, children, footer, labelId }) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const first = ref.current?.querySelector('select, textarea, input, button:not([data-close])') || ref.current?.querySelector('button');
    first?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [onClose]);
  return (
    <div className="w2e-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w2e-modal" role="dialog" aria-modal="true" aria-labelledby={labelId} ref={ref}>
        <div className="w2e-modal-body">
          <div className="w2e-modal-head">
            <h2 id={labelId}>{Icon && <Icon aria-hidden="true" />}{title}</h2>
            <button type="button" className="w2e-btn w2e-btn-icon w2e-close" data-close onClick={onClose} aria-label="Close dialog"><X aria-hidden="true" /></button>
          </div>
          {children}
        </div>
        {footer && <div className="w2e-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function W2eLearnerStudio({ school, classes, learnerName, onChooseProgram, onJoined, onNavigate }) {
  const [displayMode, setDisplayMode] = useState(() => localStorage.getItem(`w2e_display_mode_${school.id}`) || 'explore');
  const [calmColors, setCalmColors] = useState(false);
  const [textSize, setTextSize] = useState('normal');
  const [reduceMotion, setReduceMotion] = useState(false);

  const [slide, setSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [live, setLive] = useState('');
  const [checked, setChecked] = useState(STEPS.map(() => false));
  const [paused, setPaused] = useState(false);
  const [pacing, setPacing] = useState(-1);
  const [modal, setModal] = useState(null); // 'support' | 'evidence' | 'prefs' | 'curiosity' | 'planner'
  const [format, setFormat] = useState(null);
  const [formatNote, setFormatNote] = useState('');
  const [supportCategory, setSupportCategory] = useState('first_step');
  const [supportNote, setSupportNote] = useState('');
  const [supportStatus, setSupportStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const nextRef = useRef(null);
  const viewportRef = useRef(null);
  const swipeStart = useRef(null);

  const activeClass = classes[0];
  const isFocus = displayMode === 'focus';

  const today = new Date();
  const events = useSchoolResource(classes.length ? schoolPath(school.id, `calendar-events?from=${isoDate(today)}&to=${isoDate(new Date(today.getTime() + 30 * 86400000))}`) : null);
  const upcoming = (events.data?.items || []).filter((e) => e.status !== 'cancelled').sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 3);

  useEffect(() => { localStorage.setItem(`w2e_display_mode_${school.id}`, displayMode); }, [displayMode, school.id]);
  useEffect(() => {
    const root = document.documentElement;
    if (calmColors) root.setAttribute('data-calm', ''); else root.removeAttribute('data-calm');
    if (textSize !== 'normal') root.setAttribute('data-text', textSize); else root.removeAttribute('data-text');
    if (reduceMotion) root.setAttribute('data-motion', 'reduce'); else root.removeAttribute('data-motion');
    if (reduceMotion) setAutoplay(false);
  }, [calmColors, textSize, reduceMotion]);

  const goTo = useCallback((n, announce = true) => {
    const next = (n + SLIDES.length) % SLIDES.length;
    setSlide(next);
    if (announce) setLive(`Slide ${next + 1} of ${SLIDES.length}: ${SLIDES[next].quote}`);
  }, []);
  useEffect(() => {
    if (!autoplay || isFocus || reducedMotion()) return undefined;
    const t = setInterval(() => goTo(slide + 1, false), 7000);
    return () => clearInterval(t);
  }, [autoplay, slide, isFocus, goTo]);

  const focusNextStep = () => { nextRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); nextRef.current?.querySelector('h2')?.focus({ preventScroll: true }); };
  const slideAction = (action) => { if (action === 'next') focusNextStep(); if (action === 'curiosity') setModal('curiosity'); if (action === 'evidence') setModal('evidence'); };

  const done = checked.filter(Boolean).length;
  const toggleStep = (i) => { setPaused(false); setChecked((c) => c.map((v, j) => (j === i ? !v : v))); };
  useEffect(() => {
    if (done === STEPS.length) setTaskStatus({ kind: 'success', title: 'All three steps are ticked.', text: 'Show your thinking when you are ready. There is no timer, and you can untick a step to revisit it.' });
    else if (!paused) setTaskStatus(null);
  }, [done, paused]);

  const closeModal = useCallback(() => { setModal(null); setFormat(null); setFormatNote(''); setSupportStatus(null); }, []);

  async function handleSupportSubmit(e) {
    e.preventDefault();
    if (!activeClass) { setSupportStatus({ kind: 'error', text: 'Class enrollment is needed before a request can reach a coach.' }); return; }
    setSubmitting(true); setSupportStatus(null);
    try {
      await mutateSchool('POST', schoolPath(school.id, 'support-requests'), { classId: activeClass.id, category: supportCategory, note: supportNote });
      setSupportNote('');
      setModal(null);
      setTaskStatus({ kind: 'info', title: 'Request sent to your assigned coach.', text: 'Only your coach sees it. You can keep working or pause while you wait.' });
    } catch (err) {
      setSupportStatus({ kind: 'error', text: serviceMessage(err) || 'The request could not be sent.' });
    } finally { setSubmitting(false); }
  }

  const Status = ({ s }) => s ? (
    <div className={`w2e-status w2e-status-${s.kind}`} role="status">
      {s.kind === 'success' ? <CheckCircle2 aria-hidden="true" /> : s.kind === 'paused' ? <Pause aria-hidden="true" /> : <Info aria-hidden="true" />}
      <div>{s.title && <strong>{s.title}</strong>}{s.text}</div>
    </div>
  ) : null;

  const firstName = (learnerName || '').trim().split(/\s+/)[0];
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`w2e ${isFocus ? 'w2e-focus-mode' : ''}`} data-reduce={reduceMotion ? '' : undefined}>
      <div className="w2e-bar">
        <div className="w2e-bar-left">
          <div className="w2e-segmented" role="group" aria-label="Learning view">
            <button type="button" aria-pressed={isFocus} onClick={() => setDisplayMode('focus')}><Focus aria-hidden="true" />Focus view</button>
            <button type="button" aria-pressed={!isFocus} onClick={() => setDisplayMode('explore')}><LayoutGrid aria-hidden="true" />Explore view</button>
          </div>
        </div>
        <button type="button" className="w2e-btn w2e-btn-ghost w2e-btn-sm" onClick={() => setModal('prefs')}><SlidersHorizontal aria-hidden="true" />Display preferences</button>
      </div>

      <section className="w2e-hero" aria-labelledby="w2e-welcome">
        <svg className="w2e-hero-deco" viewBox="0 0 900 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          <circle cx="760" cy="60" r="90" fill="#9BD2FF" opacity=".45"/><circle cx="840" cy="210" r="46" fill="#CEAAEE" opacity=".6"/>
          <path d="M600 250 C 650 180, 700 320, 760 240 S 860 190, 900 230" fill="none" stroke="#96D700" strokeWidth="5" strokeLinecap="round" opacity=".8"/>
          <path d="M640 40 l 34 20 v 40 l -34 20 l -34 -20 v -40 z" fill="none" stroke="#8250A0" strokeWidth="3" opacity=".55"/><circle cx="585" cy="110" r="6" fill="#AE266C" opacity=".7"/>
        </svg>
        <div className="w2e-hero-text">
          <span className="w2e-eyebrow"><i aria-hidden="true" />{dateLabel}</span>
          <h1 id="w2e-welcome">{firstName ? `Hi ${firstName}. ` : ''}<span className="w2e-hl">Start with one step.</span></h1>
          <p className="w2e-lead">Your campus energy investigation is about ten minutes from its next milestone. Pick it up when you are ready.</p>
          <div className="w2e-actions">
            <button type="button" className="w2e-btn w2e-btn-primary" onClick={focusNextStep}>Continue my next step <ArrowRight aria-hidden="true" /></button>
            <button type="button" className="w2e-btn w2e-btn-ghost" onClick={() => setModal('support')}><MessageCircle aria-hidden="true" />Ask my coach</button>
          </div>
        </div>

        {isFocus ? (
          <div className="w2e-focus-welcome"><Focus aria-hidden="true" /><div><strong>Focus view is on.</strong> One task, your progress, and your coach. Everything else waits for you.</div></div>
        ) : (
          <section className="w2e-slider" role="region" aria-roledescription="carousel" aria-label="Encouragement"
                   onKeyDown={(e) => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(slide - 1); } if (e.key === 'ArrowRight') { e.preventDefault(); goTo(slide + 1); } }}>
            <div className="w2e-slider-head"><span className="w2e-eyebrow">A thought for today</span><span className="w2e-muted" aria-hidden="true">{slide + 1} / {SLIDES.length}</span></div>
            <div className="w2e-slider-viewport" ref={viewportRef}
                 onPointerDown={(e) => { swipeStart.current = e.clientX; }}
                 onPointerUp={(e) => { if (swipeStart.current === null) return; const dx = e.clientX - swipeStart.current; swipeStart.current = null; if (Math.abs(dx) > 40) goTo(slide + (dx < 0 ? 1 : -1)); }}>
              <div className="w2e-slider-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
                {SLIDES.map((s, i) => (
                  <div className="w2e-slide" key={s.quote} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} aria-hidden={i !== slide}>
                    <div className="w2e-slide-art" style={{ background: s.bg }}>{s.art}</div>
                    <div>
                      <blockquote>{s.quote}</blockquote>
                      <p>{s.text}</p>
                      {s.action && <button type="button" className="w2e-link" tabIndex={i === slide ? 0 : -1} onClick={() => slideAction(s.action)}>{s.label}</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w2e-slider-controls">
              <ul className="w2e-dots" aria-label="Choose a slide">
                {SLIDES.map((s, i) => <li key={s.quote}><button type="button" aria-label={`Slide ${i + 1}`} aria-current={i === slide ? 'true' : undefined} onClick={() => goTo(i)} /></li>)}
              </ul>
              <div className="w2e-slider-nav">
                <label className="w2e-autoplay"><input type="checkbox" checked={autoplay} disabled={reduceMotion || reducedMotion()} onChange={(e) => setAutoplay(e.target.checked)} />Auto-advance</label>
                <button type="button" className="w2e-btn w2e-btn-icon" aria-label="Previous slide" onClick={() => goTo(slide - 1)}><ChevronLeft aria-hidden="true" /></button>
                <button type="button" className="w2e-btn w2e-btn-icon" aria-label="Next slide" onClick={() => goTo(slide + 1)}><ChevronRight aria-hidden="true" /></button>
              </div>
            </div>
            <span className="w2e-sr" aria-live="polite">{live}</span>
          </section>
        )}
      </section>

      <div className="w2e-layout">
        <div className="w2e-stack">
          <section className="w2e-card w2e-next" aria-labelledby="w2e-next-title" ref={nextRef}>
            <svg className="w2e-next-deco" viewBox="0 0 260 260" aria-hidden="true"><circle cx="150" cy="150" r="110" fill="none" stroke="#9BD2FF" strokeWidth="2"/><circle cx="150" cy="150" r="80" fill="none" stroke="#CEAAEE" strokeWidth="2"/><circle cx="150" cy="150" r="50" fill="none" stroke="#96D700" strokeWidth="2"/><circle cx="230" cy="150" r="6" fill="#8250A0"/><circle cx="150" cy="70" r="5" fill="#AE266C"/></svg>
            <div className="w2e-next-head">
              <div>
                <span className="w2e-eyebrow"><i aria-hidden="true" />My next step · Net Zero Microgrid · Example task</span>
                <h2 id="w2e-next-title" tabIndex={-1}>Find the campus energy hotspots</h2>
              </div>
              <div className="w2e-ring" role="img" aria-label={`${done} of ${STEPS.length} steps done`} style={{ '--p': Math.round((done / STEPS.length) * 100) }}><span>{done}/{STEPS.length}</span></div>
            </div>
            <p className="w2e-purpose">Choose one space on campus. Record three things that use electricity, then explain which one probably uses the most and why. A photo, voice note, or short list can show your thinking.</p>
            <div className="w2e-meta">
              <span className="w2e-chip"><Clock aria-hidden="true" />About 10 minutes</span>
              <span className="w2e-chip"><Package aria-hidden="true" />Notebook or camera</span>
              <span className="w2e-chip"><MapPin aria-hidden="true" />Any room or outdoor space</span>
            </div>
            <ol className="w2e-steps" aria-label="Steps">
              {STEPS.map((text, i) => (
                <li key={text}><label><input type="checkbox" checked={checked[i]} onChange={() => toggleStep(i)} /><span><span className="w2e-step-num">{i + 1}</span> {text}</span></label></li>
              ))}
            </ol>
            <div className="w2e-actions">
              <button type="button" className="w2e-btn w2e-btn-primary" onClick={() => setModal('evidence')}><Upload aria-hidden="true" />Show my thinking</button>
              <button type="button" className="w2e-btn w2e-btn-secondary" onClick={() => setModal('support')}><MessageCircle aria-hidden="true" />Ask my coach</button>
              <button type="button" className="w2e-btn w2e-btn-ghost" aria-pressed={paused} onClick={() => {
                const next = !paused; setPaused(next);
                setTaskStatus(next ? { kind: 'paused', title: 'Paused.', text: 'Your ticked steps stay here while this page is open. Come back whenever you are ready.' } : null);
              }}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}{paused ? 'Resume' : 'Pause'}</button>
            </div>
            <Status s={taskStatus} />
          </section>

          <section className="w2e-card w2e-optional" aria-labelledby="w2e-pace">
            <div className="w2e-card-head"><h3 id="w2e-pace"><Compass aria-hidden="true" />How much would you like to take on?</h3><span className="w2e-badge w2e-badge-sample">Optional</span></div>
            <p className="w2e-muted">This only changes the suggestion below. You can choose any task at any time.</p>
            <div className="w2e-actions" role="group" aria-label="Pacing check-in">
              {PACING.map(([label], i) => <button type="button" key={label} className="w2e-choice" aria-pressed={pacing === i} onClick={() => setPacing(i)}>{label}{pacing === i && <CheckCircle2 aria-hidden="true" />}</button>)}
            </div>
            {pacing >= 0 && <Status s={{ kind: 'info', text: PACING[pacing][1] }} />}
          </section>

          <div className="w2e-minis w2e-optional">
            <section className="w2e-card w2e-mini w2e-mini-curiosity" aria-labelledby="w2e-cur">
              <svg className="w2e-mini-deco" viewBox="0 0 120 120" aria-hidden="true"><circle cx="80" cy="40" r="30" fill="#F9E6EF"/><path d="M50 90 C 60 60, 90 60, 100 90" fill="none" stroke="#AE266C" strokeWidth="3"/><circle cx="100" cy="90" r="5" fill="#8250A0"/></svg>
              <span className="w2e-eyebrow"><i aria-hidden="true" />Curiosity space</span>
              <h3 id="w2e-cur">How does a game use energy?</h3>
              <p>Graphics, computing and the electricity behind your favourite games. No grade, no deadline.</p>
              <div className="w2e-actions"><button type="button" className="w2e-btn w2e-btn-secondary w2e-btn-sm" onClick={() => setModal('curiosity')}><Compass aria-hidden="true" />Follow this question</button></div>
            </section>
            <section className="w2e-card w2e-mini w2e-mini-planner" aria-labelledby="w2e-plan">
              <svg className="w2e-mini-deco" viewBox="0 0 120 120" aria-hidden="true"><path d="M30 20 l 26 15 v 30 l -26 15 l -26 -15 v -30 z" fill="#E9F4FF"/><path d="M40 90 h 60" stroke="#96D700" strokeWidth="4" strokeLinecap="round"/><path d="M60 30 h 40" stroke="#8250A0" strokeWidth="3" strokeLinecap="round" opacity=".5"/></svg>
              <span className="w2e-eyebrow"><i aria-hidden="true" />Quest planner</span>
              <h3 id="w2e-plan">A big idea, a smaller start</h3>
              <p>Turn a question into five steps you can edit before you talk to your coach. The example is prewritten, not generated.</p>
              <div className="w2e-actions"><button type="button" className="w2e-btn w2e-btn-secondary w2e-btn-sm" onClick={() => setModal('planner')}>Try an example plan</button></div>
            </section>
          </div>

          {!isFocus && <ProgramCatalogueChooser school={school} onChooseProgram={onChooseProgram} onJoined={onJoined} />}
        </div>

        <aside className="w2e-rail" aria-label="Information">
          <section className="w2e-card" aria-labelledby="w2e-learn">
            <div className="w2e-card-head"><h3 id="w2e-learn"><ListChecks aria-hidden="true" />My learning</h3></div>
            <ul className="w2e-quick">
              <li><button type="button" onClick={() => onNavigate?.('programs')}><BookOpen aria-hidden="true" /><span>PBL programs<small>Enrolled and available offerings</small></span><ChevronRight className="w2e-chev" aria-hidden="true" /></button></li>
              <li><button type="button" onClick={() => onNavigate?.('academic')}><BarChart3 aria-hidden="true" /><span>Academic progress<small>Kept separate from PBL</small></span><ChevronRight className="w2e-chev" aria-hidden="true" /></button></li>
              <li><button type="button" onClick={() => onNavigate?.('goals')}><Target aria-hidden="true" /><span>My goals<small>Agreed with your coach</small></span><ChevronRight className="w2e-chev" aria-hidden="true" /></button></li>
            </ul>
          </section>
          <section className="w2e-card w2e-optional" aria-labelledby="w2e-up">
            <div className="w2e-card-head"><h3 id="w2e-up"><Calendar aria-hidden="true" />Coming up</h3><button type="button" className="w2e-link" onClick={() => onNavigate?.('calendar')}>All events</button></div>
            {events.loading && <p className="w2e-muted" role="status">Checking the school calendar…</p>}
            {events.error && <p className="w2e-muted" role="alert">{serviceMessage(events.error)}</p>}
            {!events.loading && !events.error && !upcoming.length && <p className="w2e-muted">Nothing scheduled in the next 30 days.</p>}
            {upcoming.length > 0 && (
              <ul className="w2e-events">
                {upcoming.map((e) => {
                  const d = new Date(`${e.startDate}T00:00:00`);
                  return (
                    <li className="w2e-event" key={e.id}>
                      <div className="w2e-date"><b>{d.getDate()}</b><small>{d.toLocaleDateString(undefined, { month: 'short' })}</small></div>
                      <div><strong>{e.title}</strong><small><span>{e.allDay ? 'All day' : `${e.startTime}–${e.endTime}`}{e.location ? ` · ${e.location}` : ''}</span>{e.category && <span className="w2e-badge w2e-badge-review">{e.category}</span>}</small></div>
                    </li>
                  );
                })}
              </ul>
            )}
            <span className="w2e-readonly"><Lock aria-hidden="true" />School admins manage events</span>
          </section>
          <section className="w2e-card w2e-card-tint" aria-labelledby="w2e-coach">
            <div className="w2e-card-head"><h3 id="w2e-coach"><MessageCircle aria-hidden="true" />Your coach is nearby</h3></div>
            <p>Ask for a first step, a different explanation, a break, or a conversation. Your request goes only to your assigned coach.</p>
            <button type="button" className="w2e-btn w2e-btn-dark" onClick={() => setModal('support')}><HelpCircle aria-hidden="true" />Choose support</button>
          </section>
        </aside>
      </div>

      {modal === 'support' && (
        <Modal title="What would help right now?" icon={MessageCircle} onClose={closeModal} labelId="w2e-support-title"
               footer={<><button type="button" className="w2e-btn w2e-btn-secondary" onClick={closeModal}>Cancel</button><button type="submit" form="w2e-support-form" className="w2e-btn w2e-btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button></>}>
          <p className="w2e-muted">Choose what you want your on-site coach to know. Only your assigned coach sees this.</p>
          <form id="w2e-support-form" onSubmit={handleSupportSubmit} style={{ display: 'grid', gap: 16 }}>
            <label className="w2e-field"><span>Your request</span>
              <select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)}>
                <option value="first_step">Help me find the first step</option>
                <option value="explain_different">Explain this a different way</option>
                <option value="need_break">I would like a break</option>
                <option value="private_talk">I would like to talk privately</option>
              </select>
            </label>
            <label className="w2e-field"><span>Add a note (optional)</span><textarea value={supportNote} onChange={(e) => setSupportNote(e.target.value)} maxLength={500} placeholder="Anything you want your coach to know." /></label>
            <Status s={supportStatus} />
          </form>
        </Modal>
      )}

      {modal === 'evidence' && (
        <Modal title="Show your thinking" icon={Upload} onClose={closeModal} labelId="w2e-evidence-title"
               footer={<><span className="w2e-left w2e-muted" style={{ fontSize: 14 }}>A coach gives feedback. Nothing here assigns a grade.</span><button type="button" className="w2e-btn w2e-btn-secondary" onClick={closeModal}>Back to my task</button></>}>
          <p className="w2e-muted">Use a format that works for you. Your coach reviews the same learning goal for every format.</p>
          <div className="w2e-formats" role="group" aria-label="Evidence format">
            {FORMATS.map(([label, Icon, guide]) => <button type="button" key={label} className="w2e-format" aria-pressed={format === label} onClick={() => { setFormat(label); setFormatNote(guide); }}><Icon aria-hidden="true" />{label}</button>)}
          </div>
          <Status s={{ kind: 'info', title: format ? `${format}: what to include` : '', text: format ? formatNote : 'Choose a format to see what to include.' }} />
          {format && <div className="w2e-dropzone"><Upload aria-hidden="true" /><strong>Uploads and recording are coming</strong><span>Written evidence and links can be submitted from the PBL Programs tab today.</span></div>}
        </Modal>
      )}

      {modal === 'prefs' && (
        <Modal title="Display preferences" icon={SlidersHorizontal} onClose={closeModal} labelId="w2e-prefs-title" footer={<button type="button" className="w2e-btn w2e-btn-primary" onClick={closeModal}>Done</button>}>
          <p className="w2e-muted">Yours to change any time. These settings only affect how the studio looks, never what you can access. They stay on this device.</p>
          <div className="w2e-toggle-row"><label htmlFor="w2e-calm"><span><Palette aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: -3 }} /> Calm colours</span><small>Fewer gradients and patterns</small></label><span className="w2e-switch"><input id="w2e-calm" type="checkbox" role="switch" checked={calmColors} onChange={(e) => setCalmColors(e.target.checked)} /></span></div>
          <div className="w2e-toggle-row"><label htmlFor="w2e-motion"><span><Pause aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: -3 }} /> Reduce motion</span><small>No transitions or sliding</small></label><span className="w2e-switch"><input id="w2e-motion" type="checkbox" role="switch" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} /></span></div>
          <div className="w2e-toggle-row"><span style={{ fontWeight: 600 }} id="w2e-text-label"><Type aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: -3 }} /> Text size</span>
            <div className="w2e-segmented" role="group" aria-labelledby="w2e-text-label">
              {[['normal', 'Default'], ['large', 'Large'], ['larger', 'Larger']].map(([v, l]) => <button type="button" key={v} aria-pressed={textSize === v} onClick={() => setTextSize(v)}>{l}</button>)}
            </div>
          </div>
        </Modal>
      )}

      {modal === 'curiosity' && (
        <Modal title="How does a game use energy?" icon={Compass} onClose={closeModal} labelId="w2e-cur-title" footer={<button type="button" className="w2e-btn w2e-btn-secondary" onClick={closeModal}>Back to my task</button>}>
          <p>Pick a question. You can return to your main project at any time.</p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}><li>What happens to power use when graphics settings change?</li><li>How could solar energy power a gaming device?</li><li>How does a game simulate a real microgrid?</li></ul>
          <p className="w2e-muted">Optional exploration. No score, no deadline.</p>
        </Modal>
      )}

      {modal === 'planner' && (
        <Modal title="Example quest: understand game energy use" icon={Compass} onClose={closeModal} labelId="w2e-plan-title" footer={<><button type="button" className="w2e-btn w2e-btn-secondary" onClick={closeModal}>Discard</button><button type="button" className="w2e-btn w2e-btn-primary" onClick={() => { closeModal(); setTaskStatus({ kind: 'info', title: 'Plan kept on this device.', text: 'Bring it to your next coach check-in. Plans are not submitted from here yet.' }); }}>Keep this plan</button></>}>
          <p className="w2e-muted">Prewritten example, not generated. Edit the steps before discussing them with your coach.</p>
          <label className="w2e-field"><span>Your plan</span><textarea defaultValue={'1. Choose one game or device.\n2. Find its power use or record an estimate.\n3. Calculate energy for one hour of play.\n4. Explain assumptions in your preferred format.\n5. Ask your coach what to investigate next.'} rows={7} /></label>
        </Modal>
      )}
    </div>
  );
}
