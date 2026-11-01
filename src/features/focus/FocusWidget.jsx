import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, Headphones, Coffee, Target, X } from 'lucide-react';
import { SOUNDS, PRESETS, TIMERS, BREAK_MIN, isSilent, isPaused, remainingMs, progress, fmt } from './focusModel.js';
import { focus, useFocus } from './focusStore.js';
import { level, audioSupported } from './soundEngine.js';
import { dayKey } from '../goals/goalPlan.js';
import { useAuth } from '../../app/AuthProvider.jsx';
import { isPrimaryProfile } from '../../auth.js';
import { parseRoute, hrefFor } from '../../app/routes.js';
import './focus.css';

/** A glowing orb that breathes with the sound (Web Audio analyser). Still under reduced motion. */
function Orb({ playing, size = 'lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!playing || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf;
    let smooth = 0;
    const loop = () => {
      smooth = smooth * 0.85 + level() * 0.15;
      ref.current?.style.setProperty('--lvl', smooth.toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ref.current?.style.setProperty('--lvl', '0'); };
  }, [playing]);
  return <span ref={ref} className={`fs-orb fs-orb-${size}${playing ? ' is-on' : ''}`} aria-hidden="true" />;
}

/**
 * Focus sounds on My Dashboard: a mixer of generated sounds, ready-made mixes,
 * and a focus timer (15/25/45 minutes, then a 5-minute break). `focusOn` is
 * the learner's next unticked step from Goal setting, shown during a block.
 */
export function FocusWidget({ focusOn }) {
  const s = useFocus();
  const t = s.timer;
  const left = remainingMs(t, s.now);
  const frac = progress(t, s.now);
  const C = 2 * Math.PI * 46;
  const today = s.blocks[dayKey()] || 0;

  if (!audioSupported()) return <p className="fs-note">This browser cannot play generated sounds. Try Chrome, Edge, Firefox or Safari.</p>;

  return (
    <div className="fs-widget">
      <div className="fs-top">
        <div className="fs-timer" data-phase={t.phase}>
          <svg viewBox="0 0 104 104" aria-hidden="true">
            <circle cx="52" cy="52" r="46" className="fs-track" />
            <circle cx="52" cy="52" r="46" className="fs-fill" strokeDasharray={`${frac * C} ${C}`} />
          </svg>
          <Orb playing={s.playing} />
          <span className="fs-time" role="timer" aria-live="off">
            {fmt(left)}
            <small>{t.phase === 'focus' ? (isPaused(t) ? 'Paused' : 'Focus') : t.phase === 'break' ? 'Break' : `${t.minutes} min`}</small>
          </span>
        </div>

        <div className="fs-controls">
          {t.phase === 'idle' && (
            <>
              <div className="fs-seg" role="group" aria-label="Focus length">
                {TIMERS.map((m) => (
                  <button key={m} type="button" aria-pressed={t.minutes === m} onClick={() => focus.choose(m)}>{m} min</button>
                ))}
              </div>
              <button type="button" className="gh-btn gh-btn-primary fs-go" onClick={() => focus.start()}>
                <Play size={16} aria-hidden="true" />Start focus
              </button>
            </>
          )}
          {t.phase === 'focus' && (
            <>
              {focusOn && <p className="fs-on"><Target size={14} aria-hidden="true" /><span>Focus on: <strong>{focusOn}</strong></span></p>}
              <div className="fs-row">
                {isPaused(t)
                  ? <button type="button" className="gh-btn gh-btn-primary" onClick={focus.resume}><Play size={15} aria-hidden="true" />Resume</button>
                  : <button type="button" className="gh-btn" onClick={focus.pause}><Pause size={15} aria-hidden="true" />Pause</button>}
                <button type="button" className="gh-btn gh-btn-ghost" onClick={focus.reset}><RotateCcw size={15} aria-hidden="true" />End</button>
              </div>
            </>
          )}
          {t.phase === 'break' && (
            <>
              <p className="fs-on"><Coffee size={14} aria-hidden="true" /><span>Block done! Stand up, stretch, drink some water. {BREAK_MIN} minutes.</span></p>
              <button type="button" className="gh-btn gh-btn-ghost" onClick={focus.skipBreak}>Skip break</button>
            </>
          )}
          <span className="fs-blocks" aria-label={`${today} focus blocks finished today`}>
            {Array.from({ length: Math.max(4, today) }, (_, i) => <i key={i} className={i < today ? 'on' : ''} />)}
            <small>{today} today</small>
          </span>
        </div>
      </div>

      <div className="fs-presets" role="group" aria-label="Ready-made mixes">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className="fs-chip" onClick={() => focus.preset(p)}>{p.label}</button>
        ))}
      </div>

      <ul className="fs-mixer" aria-label="Sounds">
        {SOUNDS.map((snd) => {
          const v = s.mix[snd.id] || 0;
          return (
            <li key={snd.id} className={v ? 'fs-sound is-on' : 'fs-sound'}>
              <button type="button" className="fs-sound-btn" aria-pressed={!!v} onClick={() => focus.toggle(snd.id)}>
                <span className="fs-emoji" aria-hidden="true">{snd.emoji}</span>{snd.label}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={v} aria-label={`${snd.label} volume`} disabled={!v}
                     onChange={(e) => focus.level(snd.id, Number(e.target.value))} />
            </li>
          );
        })}
      </ul>

      <div className="fs-bottom">
        {s.playing
          ? <button type="button" className="gh-btn gh-btn-sm" onClick={focus.stop}><Square size={14} aria-hidden="true" />Stop sounds</button>
          : <button type="button" className="gh-btn gh-btn-sm" disabled={isSilent(s.mix)} onClick={focus.play}><Headphones size={14} aria-hidden="true" />Play sounds</button>}
        <label className="fs-volume"><Volume2 size={15} aria-hidden="true" />
          <input type="range" min="0" max="1" step="0.05" value={s.volume} aria-label="Volume" onChange={(e) => focus.volume(Number(e.target.value))} />
        </label>
      </div>
      <p className="fs-note">No lyrics on purpose: background words make reading and writing harder. Sounds keep playing on other pages.</p>
    </div>
  );
}

/**
 * Small floating player while sounds or a timer are running and the learner
 * is not on My Dashboard. Goes away when everything is stopped.
 */
export function FocusMiniPlayer({ dashboardHref, hidden, signedIn }) {
  const s = useFocus();
  // Sign-out ends the session: nothing should keep playing on the sign-in page.
  useEffect(() => { if (!signedIn) { focus.stop(); focus.reset(); } }, [signedIn]);
  const t = s.timer;
  const active = s.playing || t.phase !== 'idle';
  if (hidden || !active || !signedIn) return null;
  return (
    <div className="fs-mini" role="region" aria-label="Focus sounds">
      <Orb playing={s.playing} size="sm" />
      <a className="fs-mini-text" href={dashboardHref}>
        <strong>{t.phase === 'idle' ? 'Focus sounds' : t.phase === 'break' ? 'Break' : 'Focus'}</strong>
        <small>{t.phase === 'idle' ? (s.playing ? 'Playing' : '') : fmt(remainingMs(t, s.now))}</small>
      </a>
      {t.phase === 'focus' && (isPaused(t)
        ? <button type="button" className="fs-mini-btn" onClick={focus.resume} aria-label="Resume timer"><Play size={15} /></button>
        : <button type="button" className="fs-mini-btn" onClick={focus.pause} aria-label="Pause timer"><Pause size={15} /></button>)}
      <button type="button" className="fs-mini-btn" aria-label="Stop sounds and timer" onClick={() => { focus.stop(); focus.reset(); }}><X size={15} /></button>
    </div>
  );
}

const subscribeHash = (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); };

/**
 * Mounted next to <App /> (main.jsx) rather than inside it: App returns early
 * for several screens, and the player has to be on every one of them.
 */
export function FocusMiniHost() {
  const { user, role, profile } = useAuth();
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  const learner = role === 'student' && !isPrimaryProfile(profile);
  return (
    <FocusMiniPlayer dashboardHref={hrefFor.dashboard()} signedIn={!!user}
                     hidden={!learner || parseRoute(hash)?.screen === 'dashboard'} />
  );
}
