import { useRef, useState } from 'react';
import {
  Brain, Lightbulb, Cpu, Megaphone, HeartHandshake, Mountain, ShieldCheck, Sparkles, Play, Copy, Check, ArrowRight, Users
} from 'lucide-react';
import { TERM } from '../pbl/content/pblModel.js';
import { hrefFor } from '../../app/routes.js';
import { VIDEO, WORRIES, SKILLS, PROMISES, AT_HOME } from './content.js';
import '../admin/admin.css';
import './futureSkills.css';

const ICONS = { Brain, Lightbulb, Cpu, Megaphone, HeartHandshake, Mountain, ShieldCheck };

/**
 * Future Skills (#/future-skills): why AI in education is an opportunity,
 * not a threat, and the seven skills WeLearn builds with it. Copy lives in
 * content.js, with the rules for keeping it true.
 */
export function FutureSkillsPage({ isPrimary }) {
  const [active, setActive] = useState(SKILLS[0].id);
  const skillsRef = useRef(null);

  const openSkill = (id) => {
    setActive(id);
    skillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="gh-app fs-page">
      <Hero onPick={openSkill} />
      <Worries />
      <section className="fs-section fs-skills" id="fs-skills" ref={skillsRef} aria-labelledby="fs-skills-h">
        <div className="fs-wrap">
          <div className="fs-section-head">
            <span className="fs-eyebrow">The 7 Future Skills</span>
            <h2 id="fs-skills-h">Seven skills AI can’t practise for you</h2>
            <p>Each one gets stronger when AI is used well. None of them can be done by AI on your behalf.</p>
          </div>
          <SkillExplorer active={active} setActive={setActive} isPrimary={isPrimary} />
        </div>
      </section>
      <Promises />
      <AtHome />
      <section className="fs-section fs-final" aria-labelledby="fs-final-h">
        <div className="fs-wrap fs-final-inner">
          <h2 id="fs-final-h">Start with one skill this week.</h2>
          <p>Pick the skill that excites you most, set one small goal, and build it into your term project.</p>
          <div className="fs-actions">
            <a className="gh-btn gh-btn-primary fs-btn-lg" href={hrefFor.goals()}>Set a goal<ArrowRight size={16} aria-hidden="true" /></a>
            <a className="gh-btn fs-btn-lg fs-btn-onDark" href={hrefFor.pbl()}>Open PBL Studio</a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero({ onPick }) {
  return (
    <section className="fs-hero" aria-labelledby="fs-hero-h">
      <div className="fs-wrap fs-hero-grid">
        <div className="fs-hero-copy">
          <span className="fs-eyebrow"><Sparkles size={14} aria-hidden="true" />{TERM.theme}</span>
          <h1 id="fs-hero-h">
            AI isn’t replacing our children’s thinking. <mark>It’s raising the bar for it.</mark>
          </h1>
          <p className="fs-lead">
            At WeLearn, learners use AI the way a scientist uses a microscope: to see further, test ideas faster and ask
            better questions. The thinking, the choices and the work stay theirs.
          </p>
          <div className="fs-actions">
            <a className="gh-btn gh-btn-accent fs-btn-lg" href="#fs-skills"
               onClick={(e) => { e.preventDefault(); onPick(SKILLS[0].id); }}>
              Explore the 7 skills<ArrowRight size={16} aria-hidden="true" />
            </a>
            <a className="gh-btn fs-btn-lg" href={hrefFor.pbl()}>Start your term project</a>
          </div>
          <ul className="fs-chips" aria-label="The seven skills">
            {SKILLS.map((s) => {
              const Icon = ICONS[s.icon];
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => onPick(s.id)}><Icon size={14} aria-hidden="true" />{s.name}</button>
                </li>
              );
            })}
          </ul>
        </div>
        <VideoFrame />
      </div>
    </section>
  );
}

/** Square video frame. Speech, so it starts on a click, with sound, not muted autoplay. */
function VideoFrame() {
  const [playing, setPlaying] = useState(false);
  const video = useRef(null);
  const start = () => {
    setPlaying(true);
    requestAnimationFrame(() => video.current?.play().catch(() => {}));
  };
  return (
    <figure className="fs-video">
      <div className="fs-video-frame">
        {playing ? (
          <video ref={video} src={VIDEO.src} poster={VIDEO.poster} controls playsInline preload="auto"
                 aria-label={`Video message from ${VIDEO.speaker}`} />
        ) : (
          <button type="button" className="fs-video-poster" onClick={start} aria-label={`Play the video message from ${VIDEO.speaker}, ${VIDEO.length}`}>
            <img src={VIDEO.poster} alt="" width="900" height="900" />
            <span className="fs-play"><Play size={26} aria-hidden="true" /></span>
            <span className="fs-video-tag">Watch · {VIDEO.length}</span>
          </button>
        )}
      </div>
      <figcaption>
        <strong>{VIDEO.speaker}</strong>
        <span>on why we build these skills with AI, not against it</span>
      </figcaption>
    </figure>
  );
}

/* ---------------- Is AI a threat? ---------------- */

function Worries() {
  return (
    <section className="fs-section fs-worries" aria-labelledby="fs-worries-h">
      <div className="fs-wrap">
        <div className="fs-section-head">
          <span className="fs-eyebrow">Is AI a threat to learning?</span>
          <h2 id="fs-worries-h">Only if we use it badly.</h2>
          <p>Parents and teachers raise real worries about AI. Here is what we hear most, and what we do about it.</p>
        </div>
        <ul className="fs-worry-grid">
          {WORRIES.map((w) => (
            <li key={w.worry} className="fs-worry">
              <p className="fs-worry-q">{w.worry}</p>
              <p className="fs-worry-a">{w.answer}</p>
            </li>
          ))}
        </ul>
        <blockquote className="fs-quote">
          The goal isn’t to compete with AI. It’s to grow into the kind of person who knows what to do with it.
        </blockquote>
      </div>
    </section>
  );
}

/* ---------------- The seven skills ---------------- */

function SkillExplorer({ active, setActive, isPrimary }) {
  const index = Math.max(0, SKILLS.findIndex((s) => s.id === active));
  const skill = SKILLS[index];
  const Icon = ICONS[skill.icon];
  const tabs = useRef([]);

  const onKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let next = null;
    if (step) next = (index + step + SKILLS.length) % SKILLS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = SKILLS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(SKILLS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div className="fs-explorer">
      <div className="fs-tabs" role="tablist" aria-label="Future skills" aria-orientation="vertical" onKeyDown={onKey}>
        {SKILLS.map((s, i) => {
          const TabIcon = ICONS[s.icon];
          const on = s.id === active;
          return (
            <button key={s.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`fs-tab-${s.id}`}
                    aria-selected={on} aria-controls="fs-panel" tabIndex={on ? 0 : -1}
                    className={`fs-tab${on ? ' on' : ''}`} onClick={() => setActive(s.id)}>
              <span className="fs-tab-icon"><TabIcon size={18} aria-hidden="true" /></span>
              <span className="fs-tab-text"><strong>{s.name}</strong><small>{s.tagline}</small></span>
            </button>
          );
        })}
      </div>

      <article className="fs-panel" id="fs-panel" role="tabpanel" aria-labelledby={`fs-tab-${skill.id}`} key={skill.id}>
        <div className="fs-panel-head">
          <span className="fs-panel-icon"><Icon size={26} aria-hidden="true" /></span>
          <div>
            <span className="fs-panel-count">Skill {index + 1} of {SKILLS.length}</span>
            <h3>{skill.name}</h3>
            <p className="fs-panel-tag">{skill.tagline}</p>
          </div>
        </div>
        <p className="fs-panel-why">{skill.why}</p>
        <div className="fs-ages">
          <div><span className="fs-age">Ages 9–12</span><p>{skill.kids}</p></div>
          <div><span className="fs-age">Ages 13–17</span><p>{skill.teens}</p></div>
        </div>
        <TryIt text={skill.tryIt} isPrimary={isPrimary} />
        <a className="fs-where" href={skill.where.href()}>
          Practise it on WeLearn: <strong>{skill.where.label}</strong><ArrowRight size={15} aria-hidden="true" />
        </a>
      </article>
    </div>
  );
}

function TryIt({ text, isPrimary }) {
  const [copied, setCopied] = useState(false);
  const box = useRef(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(box.current);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };
  return (
    <div className="fs-try">
      <div className="fs-try-head">
        <span><Sparkles size={14} aria-hidden="true" />Try it with AI</span>
        <small>{isPrimary ? 'Do this one with your coach' : 'Ages 13+, or with your coach'}</small>
      </div>
      <p ref={box} className="fs-try-text">{text}</p>
      {!isPrimary && (
        <button type="button" className="gh-btn gh-btn-sm" onClick={copy} aria-live="polite">
          {copied ? <><Check size={14} aria-hidden="true" />Copied</> : <><Copy size={14} aria-hidden="true" />Copy prompt</>}
        </button>
      )}
    </div>
  );
}

/* ---------------- Promises ---------------- */

function Promises() {
  return (
    <section className="fs-section fs-promises" aria-labelledby="fs-promises-h">
      <div className="fs-wrap">
        <div className="fs-section-head">
          <span className="fs-eyebrow">How we use AI</span>
          <h2 id="fs-promises-h">Our promises</h2>
          <p>AI on WeLearn works under rules that put learners, and the people who care for them, first.</p>
        </div>
        <ul className="fs-promise-grid">
          {PROMISES.map((p) => (
            <li key={p.title}>
              <span className="fs-promise-icon"><Check size={16} aria-hidden="true" /></span>
              <strong>{p.title}</strong>
              <p>{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- At home ---------------- */

function AtHome() {
  return (
    <section className="fs-section fs-home" aria-labelledby="fs-home-h">
      <div className="fs-wrap">
        <div className="fs-section-head">
          <span className="fs-eyebrow"><Users size={14} aria-hidden="true" />For families</span>
          <h2 id="fs-home-h">Talk about it at dinner</h2>
          <p>Three questions that show you how your child is really using AI, and what they are learning from it.</p>
        </div>
        <ol className="fs-home-list">
          {AT_HOME.map((q) => <li key={q}>{q}</li>)}
        </ol>
      </div>
    </section>
  );
}
