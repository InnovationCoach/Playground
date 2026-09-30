/**
 * "How to play" for Project Hex-Grid.
 *
 * Teaches the testing loop (predict → change one thing → run → read → share)
 * rather than the controls. The worked example is run through the model on the
 * page, so its numbers always match what the learner will see. Idea starters
 * pre-fill a hypothesis but never its direction: the learner still predicts.
 */
import { useEffect, useMemo, useState } from 'react';
import { ROLES, METRICS, starterCity, evaluateHypothesis, showMetric } from './hexGridModel.js';
import { IDEAS, WORKED_EXAMPLE } from './hexGridGuide.js';

const LOOP = [
  { icon: '🎭', title: 'Pick your role', where: 'Mission tab', text: 'You own one system of the city. Your numbers are shown first on the Build tab.' },
  { icon: '🗺️', title: 'Explore', where: 'Build tab', text: 'Click a hex to change it. Try the four map views. Open "How is this worked out?" on any number.' },
  { icon: '🔒', title: 'Lock a baseline', where: 'Test tab, step 1', text: 'Save the city as it is now. This is your "before".' },
  { icon: '💭', title: 'Predict', where: 'Test tab, step 2', text: 'Choose one number. Will it go up, go down or stay the same? Write WHY - that is your hypothesis.' },
  { icon: '✋', title: 'Change ONE thing', where: 'Build tab', text: 'Change one hex or one setting. The Test tab lists every change you made.' },
  { icon: '▶️', title: 'Run and read', where: 'Test tab, step 4', text: 'Supported or not? Both are real results. Then look at what moved for your teammates.' },
  { icon: '📣', title: 'Share and repeat', where: 'Lab log', text: 'Tell the teammates whose numbers moved. Put the city back, or lock a new baseline, and test your next idea.' }
];

const FAIR_TEST = [
  'Change one thing at a time - otherwise you cannot tell which change caused the result.',
  'Predict BEFORE you press Run. A guess made after seeing the answer is not a test.',
  '"Not supported" is a finding, not a failure. Write down what surprised you.',
  'Open the working. If a result depends on an ESTIMATE, research a better number.',
  'A model is not the real world. Check the "What this model leaves out" list on the Sources tab.'
];

function WorkedExample() {
  const ex = useMemo(() => {
    const base = starterCity();
    const res = evaluateHypothesis(base, WORKED_EXAMPLE.idea.apply(starterCity()), {
      metric: WORKED_EXAMPLE.idea.metric, expect: WORKED_EXAMPLE.prediction, role: WORKED_EXAMPLE.role
    });
    return res;
  }, []);
  const t = ex.target;
  const m = METRICS[t.id];
  return (
    <ol className="hx-worked">
      <li><b>Role:</b> {ROLES[WORKED_EXAMPLE.role].icon} {ROLES[WORKED_EXAMPLE.role].title}. Starting from the starter city, lock it as the baseline.</li>
      <li><b>Question:</b> What happens to <i>{m.label.toLowerCase()}</i> if the platforms are made of concrete instead of plastic?</li>
      <li><b>Hypothesis:</b> It will go up, because {WORKED_EXAMPLE.because.charAt(0).toLowerCase() + WORKED_EXAMPLE.because.slice(1)}</li>
      <li><b>Change one thing:</b> {ex.changes.join('; ')}.</li>
      <li><b>Result:</b> {showMetric(t.id, t.before)} → {showMetric(t.id, t.after)}. {ex.verdict === 'supported' ? 'Supported ✅' : 'Not supported'}.</li>
      <li><b>Read it:</b> over 100% means a platform is carrying more than its safe load. Open "How is this worked out?" to see why:
        the concrete shell itself weighs so much that there is less floating power left for the buildings.</li>
      <li><b>Next idea:</b> could deeper pontoons fix it? That is a new hypothesis - lock a new baseline and test it.</li>
    </ol>
  );
}

export function HowToPlay({ project, update, go }) {
  const [role, setRole] = useState(project.role || 'infrastructure');

  useEffect(() => {
    if (!project.guideSeen) update((p) => ({ ...p, guideSeen: true }));
  }, [project.guideSeen, update]);

  const tryIdea = (idea) => {
    update((p) => ({
      ...p,
      draft: { metric: idea.metric, expect: 'increase', predicted: '', because: '', idea: idea.change }
    }));
    go('test');
  };

  return (
    <div className="hx-guide">
      <section className="hx-card hx-guide-intro">
        <h3>📖 How to play Project Hex-Grid</h3>
        <p>
          You are not trying to find the "right" city. You are testing ideas like a scientist: make a
          prediction, change <b>one</b> thing, and see what really happens - to your system <i>and</i> to your teammates'.
        </p>
      </section>

      <h3 className="hx-h">The testing loop</h3>
      <ol className="hx-loop">
        {LOOP.map((s, i) => (
          <li key={s.title}>
            <span className="hx-loop-n">{i + 1}</span>
            <span className="hx-loop-icon" aria-hidden="true">{s.icon}</span>
            <div>
              <b>{s.title}</b> <span className="hx-loop-where">{s.where}</span>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="hx-guide-2">
        <section className="hx-card">
          <h3>🔎 Reading the screen</h3>
          <ul className="hx-read">
            <li><span className="hx-dot good" /> Green edge - this number is healthy.</li>
            <li><span className="hx-dot ok" /> Amber edge - getting close to a problem.</li>
            <li><span className="hx-dot bad" /> Red edge - a problem for the city.</li>
            <li>🟨 The yellow box at the top lists warnings, marked with whose system they belong to.</li>
            <li><span className="hx-tag data">DATA ↗</span> a published figure - click it to open the source.</li>
            <li><span className="hx-tag est">ESTIMATE</span> a rough figure - research a better one!</li>
            <li><span className="hx-tag you">YOUR ASSUMPTION</span> a choice you made - including any GM idea.</li>
            <li>🗺️ Map views: <i>Platform load</i> shows which hexes might sink; <i>Smell & noise</i> shows unhappy homes; <i>Walk to hub</i> shows who lives too far from transport.</li>
          </ul>
        </section>

        <section className="hx-card">
          <h3>⚖️ Rules of a fair test</h3>
          <ol className="hx-rules">{FAIR_TEST.map((r) => <li key={r}>{r}</li>)}</ol>
        </section>
      </div>

      <section className="hx-card">
        <h3>🧪 Worked example</h3>
        <p className="hx-muted">These numbers are calculated by the model right now - you will get the same result if you try it.</p>
        <WorkedExample />
      </section>

      <section className="hx-card">
        <h3>💡 Idea starters</h3>
        <p className="hx-muted">
          Stuck? Pick an idea. "Try this idea" fills in the number to watch - you still decide which way it
          will go and why. Your own ideas are even better.
        </p>
        <div className="hx-seg hx-role-seg" role="tablist" aria-label="Role">
          {Object.entries(ROLES).map(([id, r]) => (
            <button key={id} type="button" role="tab" aria-selected={role === id} className={role === id ? 'is-on' : ''} onClick={() => setRole(id)}>
              {r.icon} {r.title.split(' & ')[0]}{id === project.role ? ' (you)' : ''}
            </button>
          ))}
        </div>
        <div className="hx-ideas">
          {IDEAS[role].map((idea) => (
            <div key={idea.change} className="hx-idea">
              <div className="hx-idea-change">✋ {idea.change}</div>
              <div className="hx-idea-watch">Watch: <b>{METRICS[idea.metric].label}</b></div>
              {idea.hint ? <div className="hx-hint">💭 {idea.hint}</div> : null}
              <button type="button" className="hx-btn go" onClick={() => tryIdea(idea)}>Try this idea →</button>
            </div>
          ))}
        </div>
      </section>

      <section className="hx-card">
        <h3>🤝 Playing as a team</h3>
        <ul>
          <li>Start each session with a 2-minute stand-up: everyone says the ONE idea they will test.</li>
          <li>When your result says "Your change also moved your teammates' numbers", go and tell them - that is the point of the project.</li>
          <li>Disagree? Turn it into a hypothesis and test it. The model settles it - or shows that it cannot, and you need more data.</li>
          <li>Emotional Wellbeing lead: check in on the team as well as the city. Nobody's idea is "wrong" before it is tested.</li>
          <li>Your lab log is your evidence. Paste its printout, or your portfolio link, into your evidence portfolio.</li>
        </ul>
        <button type="button" className="hx-btn go" onClick={() => go(project.role ? 'build' : 'mission')}>
          {project.role ? 'Start building →' : 'Pick your role →'}
        </button>
      </section>
    </div>
  );
}
