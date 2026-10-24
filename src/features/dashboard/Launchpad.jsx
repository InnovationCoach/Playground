import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Mic, MicOff, Search, LayoutGrid, GalleryHorizontal, CornerDownLeft, X, Undo2 } from 'lucide-react';
import { SECTION_LOOK, rankCommands, step } from './launchpad.js';
import { focus } from '../focus/focusStore.js';
import './launchpad.css';

/**
 * The top of My Dashboard: a dock with one tile per section (with a live
 * number on each), a stage that slides to the chosen section, and a "Where
 * to?" command bar that takes typing or speech.
 *
 * Speech uses the browser's Web Speech API. It is off until the learner taps
 * the mic and accepts a one-line notice (the browser's speech service hears
 * the request; WeLearn keeps nothing), and it listens for one phrase at a
 * time. The dashboard is secondary-only (ages 13+); primary learners never
 * reach it. Ctrl/⌘ K or "/" opens the same bar for keyboard users.
 */

const VOICE_OK_KEY = 'md_voice_ok_v1';
const readFlag = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const writeFlag = (k) => { try { localStorage.setItem(k, '1'); } catch { /* private mode */ } };

const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

/** One phrase of speech -> its alternatives, best first. */
function useVoice() {
  const [state, setState] = useState({ listening: false, heard: '', error: null });
  const rec = useRef(null);
  useEffect(() => () => rec.current?.abort(), []);

  const listen = useCallback((onFinal) => {
    if (!SR) return;
    rec.current?.abort();
    const r = new SR();
    r.lang = /^en/i.test(navigator.language) ? navigator.language : 'en-US';
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.continuous = false;
    let done = false;
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      setState((s) => ({ ...s, heard: res[0].transcript }));
      if (res.isFinal && !done) {
        done = true;
        onFinal(Array.from(res).map((a) => a.transcript));
      }
    };
    r.onerror = (e) => {
      const msg = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'The microphone is blocked for this site. Allow it in the browser, or type instead.'
        : e.error === 'no-speech' ? 'I did not hear anything. Tap the mic and try again.'
        : e.error === 'network' ? 'Speech needs an internet connection. You can type instead.'
        : e.error === 'aborted' ? null : 'Voice did not work this time. You can type instead.';
      setState((s) => ({ ...s, error: msg }));
    };
    r.onend = () => setState((s) => ({ ...s, listening: false }));
    rec.current = r;
    setState({ listening: true, heard: '', error: null });
    try { r.start(); } catch { setState({ listening: false, heard: '', error: 'Voice did not start. You can type instead.' }); }
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { supported: !!SR, ...state, listen, stop };
}

export function Launchpad({ sections, titles, stats, active, onActive, view, onView, renderSection }) {
  const [dir, setDir] = useState(1);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const dock = useRef(null);
  const noticeTimer = useRef(null);

  const go = useCallback((id, d) => {
    if (!id || id === active) return;
    setDir(d ?? (sections.indexOf(id) >= sections.indexOf(active) ? 1 : -1));
    onActive(id);
    if (view !== 'slides') onView('slides');
  }, [active, sections, onActive, view, onView]);

  const say = useCallback((text, undo) => {
    clearTimeout(noticeTimer.current);
    setNotice({ text, undo, at: Date.now() });
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // Keep the active tile in view in the dock.
  useEffect(() => {
    dock.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);

  // Ctrl/⌘ K anywhere on the dashboard, or "/" when not typing.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Carry out one ranked command. Returns a short line describing what happened. */
  const run = useCallback((cmd, heard) => {
    const prev = active;
    const prevView = view;
    const undo = () => { onActive(prev); onView(prevView); };
    const said = heard ? `“${heard}” → ` : '';
    if (cmd.kind === 'section') { go(cmd.id); say(`${said}${titles[cmd.id]}`, undo); return; }
    if (cmd.kind === 'page') { say(`${said}opening ${cmd.label}`); window.location.hash = cmd.href; return; }
    switch (cmd.id) {
      case 'next': go(step(sections, active, 1), 1); say(`${said}next`, undo); break;
      case 'prev': go(step(sections, active, -1), -1); say(`${said}previous`, undo); break;
      case 'grid': onView('grid'); say(`${said}showing everything`, undo); break;
      case 'slides': onView('slides'); say(`${said}one section at a time`, undo); break;
      case 'focus-start':
        if (sections.includes('focus')) go('focus');
        focus.start();
        say(`${said}focus block started`);
        break;
      case 'sound-play': focus.play(); say(`${said}playing focus sounds`); break;
      case 'sound-stop': focus.stop(); say(`${said}sounds stopped`); break;
      default: break;
    }
  }, [active, view, sections, titles, go, say, onActive, onView]);

  function onDockKey(e) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next = e.key === 'Home' ? sections[0] : e.key === 'End' ? sections.at(-1) : step(sections, active, d);
    go(next, d || (e.key === 'Home' ? -1 : 1));
    requestAnimationFrame(() => dock.current?.querySelector(`[data-id="${next}"]`)?.focus());
  }

  return (
    <div className="lp">
      <div className="lp-bar">
        <button type="button" className="lp-where" onClick={() => setPaletteOpen(true)}>
          <Search size={17} aria-hidden="true" />
          <span>Where to? Type or say it</span>
          <kbd aria-hidden="true">{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <div className="lp-views" role="group" aria-label="Layout">
          <button type="button" aria-pressed={view === 'slides'} onClick={() => onView('slides')} title="One section at a time">
            <GalleryHorizontal size={16} aria-hidden="true" /><span>Slides</span>
          </button>
          <button type="button" aria-pressed={view === 'grid'} onClick={() => onView('grid')} title="Everything at once">
            <LayoutGrid size={16} aria-hidden="true" /><span>Grid</span>
          </button>
        </div>
      </div>

      <div className="lp-dock" role="tablist" aria-label="Dashboard sections" ref={dock} onKeyDown={onDockKey}>
        {sections.map((id) => {
          const look = SECTION_LOOK[id] || { emoji: '•', tone: '#8250a0' };
          const on = view === 'slides' && id === active;
          return (
            <button key={id} type="button" role="tab" data-id={id} id={`lp-tab-${id}`} aria-selected={on} aria-controls="lp-stage"
                    tabIndex={id === active ? 0 : -1} className="lp-tile" style={{ '--tone': look.tone }} onClick={() => go(id)}>
              <span className="lp-tile-icon" aria-hidden="true">{look.emoji}</span>
              <span className="lp-tile-label">{titles[id]}</span>
              {stats[id] && <span className="lp-tile-stat">{stats[id]}</span>}
            </button>
          );
        })}
      </div>

      {view === 'slides' && sections.length > 0 && (
        <Stage id={active} dir={dir} title={titles[active]} index={sections.indexOf(active)} count={sections.length}
               onPrev={() => go(step(sections, active, -1), -1)} onNext={() => go(step(sections, active, 1), 1)}>
          {renderSection(active)}
        </Stage>
      )}

      {paletteOpen && (
        <Palette sections={sections} titles={titles} onClose={() => setPaletteOpen(false)}
                 onRun={(cmd, heard) => { setPaletteOpen(false); run(cmd, heard); }} />
      )}

      <div className="lp-notice-host" aria-live="polite">
        {notice && (
          <span className="lp-notice" key={notice.at}>
            {notice.text}
            {notice.undo && <button type="button" onClick={() => { notice.undo(); setNotice(null); }}><Undo2 size={14} aria-hidden="true" />Undo</button>}
          </span>
        )}
      </div>
    </div>
  );
}

function Stage({ id, dir, title, index, count, onPrev, onNext, children }) {
  const start = useRef(null);
  // Swipe on touch screens, but never while dragging a slider or typing.
  const onDown = (e) => {
    if (e.pointerType !== 'touch' || e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x; const dy = e.clientY - s.y;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) (dx < 0 ? onNext : onPrev)();
  };
  return (
    <section id="lp-stage" role="tabpanel" aria-labelledby={`lp-tab-${id}`} className="lp-stage" onPointerDown={onDown} onPointerUp={onUp}>
      <div className="lp-stage-head">
        <button type="button" className="lp-arrow" onClick={onPrev} aria-label="Previous section"><ChevronLeft size={20} aria-hidden="true" /></button>
        <div className="lp-stage-title">
          <span className="lp-stage-emoji" aria-hidden="true">{SECTION_LOOK[id]?.emoji}</span>
          <h2>{title}</h2>
          <span className="lp-count">{index + 1} of {count}</span>
        </div>
        <button type="button" className="lp-arrow" onClick={onNext} aria-label="Next section"><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <div className={`lp-slide ${dir < 0 ? 'from-left' : 'from-right'}`} key={id}>
        {children}
      </div>
    </section>
  );
}

const EXAMPLES = ['open focus', 'start focus', 'show my badges', 'next', 'go to PBL', 'stop the music'];

function Palette({ sections, titles, onClose, onRun }) {
  const [text, setText] = useState('');
  const [sel, setSel] = useState(0);
  const [voiceOk, setVoiceOk] = useState(() => readFlag(VOICE_OK_KEY));
  const [asking, setAsking] = useState(false);
  const [miss, setMiss] = useState(null);
  const voice = useVoice();
  const dialog = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const d = dialog.current;
    d?.showModal?.();
    input.current?.focus();
  }, []);

  // While typing: best matches; empty: every section, so the palette doubles as a menu.
  const results = text.trim()
    ? rankCommands(text, sections, titles).slice(0, 7)
    : sections.map((id) => ({ kind: 'section', id, label: titles[id], emoji: SECTION_LOOK[id]?.emoji }));
  useEffect(() => setSel(0), [text]);

  // Back to the text box when listening ends, so typing always works.
  useEffect(() => { if (!voice.listening) input.current?.focus(); }, [voice.listening]);

  function heard(alternatives) {
    for (const alt of alternatives) {
      const best = rankCommands(alt, sections, titles)[0];
      if (best) { onRun(best, alt.trim()); return; }
    }
    setText(alternatives[0] || '');
    setMiss(alternatives[0] ? `I heard “${alternatives[0]}” but could not find that. Try one of the examples below.` : null);
  }

  function mic() {
    setMiss(null);
    if (voice.listening) { voice.stop(); return; }
    if (!voiceOk) { setAsking(true); return; }
    voice.listen(heard);
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); onRun(results[sel]); }
  }

  return (
    <dialog ref={dialog} className="lp-palette" aria-label="Where to?" onClose={onClose}
            onClick={(e) => { if (e.target === dialog.current) onClose(); }}>
      <div className="lp-palette-inner">
        <div className="lp-search">
          <Search size={18} aria-hidden="true" />
          <input ref={input} value={text} onChange={(e) => { setText(e.target.value); setMiss(null); }} onKeyDown={onKey}
                 placeholder={voice.listening ? 'Listening…' : 'Where to? e.g. focus, badges, next, PBL'} aria-label="Where to?"
                 role="combobox" aria-expanded="true" aria-controls="lp-results" aria-activedescendant={results[sel] ? `lp-r-${sel}` : undefined} />
          {voice.supported && (
            <button type="button" className={voice.listening ? 'lp-mic is-on' : 'lp-mic'} onClick={mic}
                    aria-label={voice.listening ? 'Stop listening' : 'Say where to go'} aria-pressed={voice.listening}>
              {voice.listening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
            </button>
          )}
          <button type="button" className="lp-x" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </div>

        {voice.listening && (
          <div className="lp-listen" aria-live="polite">
            <span className="lp-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <span>{voice.heard ? `“${voice.heard}”` : 'Listening… say something like “open focus”'}</span>
          </div>
        )}
        {asking && (
          <div className="lp-consent" role="alertdialog" aria-label="Turn on voice commands">
            <p><strong>Voice commands</strong> use your browser&apos;s speech service (in Chrome, that is Google) to turn your words into text.
              WeLearn does not record or save what you say. It only listens after you tap the mic, for one request.</p>
            <div className="lp-consent-actions">
              <button type="button" className="gh-btn gh-btn-primary gh-btn-sm"
                      onClick={() => { writeFlag(VOICE_OK_KEY); setVoiceOk(true); setAsking(false); voice.listen(heard); }}>
                <Mic size={14} aria-hidden="true" />Turn on and listen
              </button>
              <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => { setAsking(false); input.current?.focus(); }}>Not now</button>
            </div>
          </div>
        )}
        {(voice.error || miss) && <p className="lp-error" role="status">{voice.error || miss}</p>}

        <ul className="lp-results" id="lp-results" role="listbox" aria-label="Places and actions">
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`} id={`lp-r-${i}`} role="option" aria-selected={i === sel}
                className={i === sel ? 'is-sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => onRun(r)}>
              <span className="lp-r-emoji" aria-hidden="true">{r.emoji || (r.kind === 'action' ? '⚡' : '•')}</span>
              <span className="lp-r-label">{r.label}</span>
              <span className="lp-r-kind">{r.kind === 'page' ? 'Page' : r.kind === 'action' ? 'Action' : 'Dashboard'}</span>
              {i === sel && <CornerDownLeft size={14} aria-hidden="true" className="lp-r-enter" />}
            </li>
          ))}
          {text.trim() && results.length === 0 && <li className="lp-none">Nothing matches “{text}”.</li>}
        </ul>

        <div className="lp-examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => <button key={ex} type="button" onClick={() => { setText(ex); input.current?.focus(); }}>{ex}</button>)}
        </div>
      </div>
    </dialog>
  );
}
