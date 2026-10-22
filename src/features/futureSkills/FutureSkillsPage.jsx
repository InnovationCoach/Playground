import { useRef, useState } from 'react';
import {
  Brain, Lightbulb, Cpu, Megaphone, HeartHandshake, Mountain, ShieldCheck, Sparkles, Copy, Check, Compass, Bot, ChartLine
} from 'lucide-react';
import { TERM, PHASES, AI_PRINCIPLES } from '../pbl/content/pblModel.js';
import { SKILLS, GROWTH } from './content.js';
import '../admin/admin.css';
import './futureSkills.css';

const ICONS = { Brain, Lightbulb, Cpu, Megaphone, HeartHandshake, Mountain, ShieldCheck };
const phaseTitle = (id) => PHASES.find((p) => p.id === id)?.title || id;
const skillsFor = (phaseId) => SKILLS.filter((s) => s.phases.includes(phaseId));

const SECTIONS = [
  { id: 'fs-skills', label: 'The seven skills', icon: Sparkles },
  { id: 'fs-process', label: 'How you master them', icon: Compass },
  { id: 'fs-ai', label: 'Your AI ground rules', icon: Bot },
  { id: 'fs-growth', label: 'How you’ll know you’re growing', icon: ChartLine }
];

/**
 * Future Skills (#/future-skills), for learners only. Explains WeLearn's seven
 * Future Skills and how the design thinking phases and AI build them. It is an
 * explainer, not a landing page: no calls to action. The phases and AI rules
 * come from pblModel.js, so this page says what PBL Studio says.
 */
export function FutureSkillsPage({ isPrimary }) {
  const [skill, setSkill] = useState(SKILLS[0].id);
  const [phase, setPhase] = useState(PHASES[0].id);
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="gh-app fs-page">
      <section className="fs-intro" aria-labelledby="fs-title">
        <div className="fs-wrap fs-intro-grid">
          <div className="fs-intro-copy">
            <span className="fs-eyebrow"><Sparkles size={14} aria-hidden="true" />{TERM.theme}</span>
            <h1 id="fs-title">Your Future Skills</h1>
            <p className="fs-lead">
              At WeLearn you build seven skills that matter in a world full of AI. You don’t learn them from a textbook.
              You grow them by working on a real project, step by step, with the design thinking process, and with AI
              as your co-pilot.
            </p>
            <p className="fs-lead fs-lead-sm">
              AI can answer questions, write code and suggest ideas. It can’t decide what problem is worth solving,
              listen to the people it affects, or take responsibility for the result. That part is you, and these skills
              are how you get good at it.
            </p>
          </div>
          <nav className="fs-toc" aria-label="On this page">
            <span className="fs-toc-title">On this page</span>
            <ol>
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={(e) => { e.preventDefault(); jump(id); }}>
                    <Icon size={16} aria-hidden="true" />{label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <section className="fs-section" id="fs-skills" aria-labelledby="fs-skills-h">
        <div className="fs-wrap">
          <div className="fs-section-head">
            <span className="fs-eyebrow">1 · The seven skills</span>
            <h2 id="fs-skills-h">What you’re building</h2>
            <p>Pick a skill to see why it matters, what it looks like at your age, and a way to practise it with AI.</p>
          </div>
          <SkillExplorer active={skill} setActive={setSkill} isPrimary={isPrimary} onPhase={(id) => { setPhase(id); jump('fs-process'); }} />
        </div>
      </section>

      <section className="fs-section fs-alt" id="fs-process" aria-labelledby="fs-process-h">
        <div className="fs-wrap">
          <div className="fs-section-head">
            <span className="fs-eyebrow">2 · Design thinking</span>
            <h2 id="fs-process-h">How you master them</h2>
            <p>
              Your term project follows the same phases every time: {PHASES.map((p) => p.title).join(', ')}. Each phase
              trains different skills. Pick a phase to see what you do, which skills it builds, and how AI can help.
            </p>
          </div>
          <PhaseExplorer active={phase} setActive={setPhase} onSkill={(id) => { setSkill(id); jump('fs-skills'); }} />
        </div>
      </section>

      <section className="fs-section" id="fs-ai" aria-labelledby="fs-ai-h">
        <div className="fs-wrap">
          <div className="fs-section-head">
            <span className="fs-eyebrow">3 · Using AI well</span>
            <h2 id="fs-ai-h">Your AI ground rules</h2>
            <p>AI is your co-pilot, not your autopilot. These are the rules for using it at WeLearn. They are the same ones your coach uses.</p>
          </div>
          <ol className="fs-rules">
            {AI_PRINCIPLES.map((r) => (
              <li key={r.title}>
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </li>
            ))}
          </ol>
          <p className="fs-note">
            {isPrimary
              ? 'You use AI together with your coach, not on your own, and voice input is switched off.'
              : 'If you are under 13, you use AI together with your coach, not on your own, and voice input is switched off.'}
          </p>
        </div>
      </section>

      <section className="fs-section fs-alt" id="fs-growth" aria-labelledby="fs-growth-h">
        <div className="fs-wrap">
          <div className="fs-section-head">
            <span className="fs-eyebrow">4 · Your progress</span>
            <h2 id="fs-growth-h">How you’ll know you’re growing</h2>
            <p>Skills grow slowly, so it helps to see them. Here is where your progress shows up.</p>
          </div>
          <ul className="fs-growth">
            {GROWTH.map((g) => (
              <li key={g.title}><strong>{g.title}</strong><p>{g.body}</p></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ---------------- The seven skills ---------------- */

function useArrowTabs(items, activeId, setActive) {
  const refs = useRef([]);
  const index = Math.max(0, items.findIndex((x) => x.id === activeId));
  const onKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let next = null;
    if (step) next = (index + step + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(items[next].id);
    refs.current[next]?.focus();
  };
  return { refs, index, onKey };
}

function SkillExplorer({ active, setActive, isPrimary, onPhase }) {
  const { refs, index, onKey } = useArrowTabs(SKILLS, active, setActive);
  const skill = SKILLS[index];
  const Icon = ICONS[skill.icon];
  return (
    <div className="fs-explorer">
      <div className="fs-tabs" role="tablist" aria-label="Future skills" aria-orientation="vertical" onKeyDown={onKey}>
        {SKILLS.map((s, i) => {
          const TabIcon = ICONS[s.icon];
          const on = s.id === active;
          return (
            <button key={s.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`fs-tab-${s.id}`}
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
        <div className="fs-built">
          <span>You build it most in</span>
          <div className="fs-phase-chips">
            {skill.phases.map((id) => (
              <button key={id} type="button" className="fs-phase-chip" onClick={() => onPhase(id)}
                      aria-label={`${phaseTitle(id)} phase: show what you do there`}>
                {phaseTitle(id)}
              </button>
            ))}
          </div>
        </div>
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
        <span><Sparkles size={14} aria-hidden="true" />Practise it with AI</span>
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

/* ---------------- Design thinking phases ---------------- */

function PhaseExplorer({ active, setActive, onSkill }) {
  const { refs, index, onKey } = useArrowTabs(PHASES, active, setActive);
  const p = PHASES[index];
  const skills = skillsFor(p.id);
  return (
    <div className="fs-phases">
      <ol className="fs-stepper" role="tablist" aria-label="Design thinking phases" onKeyDown={onKey}>
        {PHASES.map((ph, i) => {
          const on = ph.id === active;
          return (
            <li key={ph.id} role="presentation">
              <button ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`fs-ph-${ph.id}`}
                      aria-selected={on} aria-controls="fs-phase-panel" tabIndex={on ? 0 : -1}
                      className={`fs-step${on ? ' on' : ''}${i < index ? ' done' : ''}`} onClick={() => setActive(ph.id)}>
                <span className="fs-step-n">{i + 1}</span>
                <span className="fs-step-text"><strong>{ph.title}</strong><small>Weeks {ph.weeks[0]}–{ph.weeks[1]}</small></span>
              </button>
            </li>
          );
        })}
      </ol>

      <article className="fs-phase" id="fs-phase-panel" role="tabpanel" aria-labelledby={`fs-ph-${p.id}`} key={p.id}>
        <div className="fs-phase-main">
          <span className="fs-panel-count">Phase {index + 1} of {PHASES.length} · Weeks {p.weeks[0]}–{p.weeks[1]}</span>
          <h3>{p.title}<span className="fs-phase-strap"> · {p.strap}</span></h3>
          <p className="fs-panel-why">{p.goal}</p>
          <div className="fs-phase-cols">
            <div>
              <h4>What you do</h4>
              <ul className="fs-list">{p.tasks.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h4>What you collect</h4>
              <ul className="fs-list">{p.evidence.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </div>
        <aside className="fs-phase-side">
          <h4>Skills you build here</h4>
          {skills.length ? (
            <div className="fs-phase-chips">
              {skills.map((s) => {
                const Icon = ICONS[s.icon];
                return (
                  <button key={s.id} type="button" className="fs-phase-chip" onClick={() => onSkill(s.id)}
                          aria-label={`${s.name}: show this skill`}>
                    <Icon size={14} aria-hidden="true" />{s.name}
                  </button>
                );
              })}
            </div>
          ) : <p className="fs-muted">All seven, a little at a time.</p>}
          <h4>How AI can help</h4>
          <ul className="fs-prompts">
            {p.ai.slice(0, 2).map((t) => <li key={t}>“{t}”</li>)}
          </ul>
        </aside>
      </article>
    </div>
  );
}
