import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Award, Bot, ChevronDown, ChevronUp, Coins, Compass, Dna, Eye, Flame, Rocket, ShieldAlert, Sparkles, Users, X, Zap
} from 'lucide-react';
import {
  CREW_TASKS,
  FEATURE_CATALOG,
  GOAL_REWARDS,
  SPECIES_CATALOG,
  assignCrewTask,
  buildFeature,
  buildHazardDilemma,
  claimPlanet,
  completeGoal,
  cultivateLife,
  fireRiskForRecord,
  generateCrewBriefing,
  getGoalEligibility,
  getNextMission,
  getPlanetRecord,
  hasProducerSpecies,
  isGoalClaimed,
  investigatePlanet,
  resolveHazardWithDilemma,
  runWeeklyUniverseEvent,
  saveSpaceshipProject,
  sendPlanetaryAid,
  starModifiersForClass,
  stewardForPlanet
} from './playgroundModel.js';
import { CREW_PERSONAS, QUICK_ASKS, fetchCrewAdvisorReply, personaById, personaForText, toCrewLine } from './crewAdvisor.js';
import { SpaceshipBuilderModal } from '../lab/SpaceshipBuilderModal.jsx';
import './playground.css';

const TABS = [
  { id: 'overview', label: 'Goals', icon: Award },
  { id: 'life', label: 'Life & Build', icon: Dna },
  { id: 'crew', label: 'AI Crew', icon: Bot },
  { id: 'creator', label: 'Co-Op & Events', icon: Zap }
];

const FEATURE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'habitat', label: 'Habitat' },
  { id: 'biosphere', label: 'Biosphere' },
  { id: 'science', label: 'Science' },
  { id: 'defense', label: 'Defense' }
];

/** Coloured initials badge for one crew member. */
export function CrewAvatar({ personaId, size = 'md' }) {
  const p = personaById(personaId);
  return (
    <span className={`upg-avatar is-${size}`} style={{ '--crew-color': p.color }} aria-hidden="true">
      {p.initials}
    </span>
  );
}

/** One line of crew dialogue: avatar, speaker name, speech bubble. */
export function CrewBubble({ speakerId, text, source }) {
  const p = personaById(speakerId);
  return (
    <div className="upg-bubble-row" style={{ '--crew-color': p.color }}>
      <CrewAvatar personaId={p.id} size="sm" />
      <div className="upg-bubble">
        <div className="upg-bubble-head">
          <strong>{p.name}</strong>
          <span className="upg-muted">{p.role}</span>
          {source && (
            <span className={`upg-source is-${source}`}>{source === 'gemini' ? 'Live AI' : 'Offline guide'}</span>
          )}
        </div>
        <p>{text}</p>
      </div>
    </div>
  );
}

function VitalBar({ label, value }) {
  const low = value < 40;
  return (
    <div className="upg-vital">
      <div className="upg-stat-top"><span>{label}</span><strong className={low ? 'upg-val-warn' : ''}>{value}%</strong></div>
      <div className="upg-bar" role="meter" aria-label={`${label} ${value}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <span className={low ? 'is-warn' : ''} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const EFFECT_LABEL = {
  habitability: 'Hab',
  biodiversity: 'Bio',
  shielding: 'Shield',
  research: 'Research'
};

export function PlaygroundPanel({
  cosmos,
  state,
  onChange,
  onFlyToPlanet,
  onClose,
  peers = [],
  visitingPeer = null,
  onVisitPeer = null,
  onExitVisit = null,
  onSendCoopAid = null,
  motion = true
}) {
  const [tab, setTab] = useState('overview');
  const [featureCat, setFeatureCat] = useState('all');
  const [toast, setToast] = useState('');
  const [creditDelta, setCreditDelta] = useState(0);
  const [labOpen, setLabOpen] = useState(false);
  const [dilemmaChoice, setDilemmaChoice] = useState('ecological');
  const [logNote, setLogNote] = useState('');
  const [advisorQ, setAdvisorQ] = useState('');
  const [advisorThread, setAdvisorThread] = useState([]);
  const [advisorBusy, setAdvisorBusy] = useState(false);
  const [aidBusyPeerId, setAidBusyPeerId] = useState(null);
  // null = default for the tab (open on AI Crew, collapsed elsewhere); true/false = learner's choice.
  const [hazardOpen, setHazardOpen] = useState(null);
  const prevCreditsRef = useRef(state.credits);
  const drawerHeadingRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => {
    drawerHeadingRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const diff = state.credits - prevCreditsRef.current;
    prevCreditsRef.current = state.credits;
    if (!diff) return undefined;
    setCreditDelta(diff);
    const id = setTimeout(() => setCreditDelta(0), 2400);
    return () => clearTimeout(id);
  }, [state.credits]);

  useEffect(() => {
    if (labOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [labOpen, onClose]);

  const activePlanet = useMemo(
    () => cosmos.planetById(state.claimedPlanetId) || cosmos.planets[0],
    [cosmos, state.claimedPlanetId]
  );
  const activeSystem = useMemo(
    () => (activePlanet ? cosmos.systemById(activePlanet.systemId) : null),
    [cosmos, activePlanet]
  );
  const starMods = useMemo(() => starModifiersForClass(activeSystem?.starClass), [activeSystem?.starClass]);
  const record = getPlanetRecord(state, activePlanet?.id);
  const fireRisk = useMemo(() => fireRiskForRecord(record), [record]);
  const nextMission = useMemo(() => getNextMission(state, activePlanet), [state, activePlanet]);
  const hasProducer = useMemo(() => hasProducerSpecies(record), [record]);
  const goalClaimCounts = useMemo(() => {
    const counts = {};
    for (const g of state.completedGoals || []) {
      counts[g.goalId] = (counts[g.goalId] || 0) + 1;
    }
    return counts;
  }, [state.completedGoals]);
  const dilemmaOptions = useMemo(
    () => buildHazardDilemma(record.activeHazard, activePlanet?.name),
    [record.activeHazard, activePlanet?.name]
  );
  const briefings = useMemo(
    () => generateCrewBriefing(record, activePlanet?.name),
    [record, activePlanet?.name]
  );

  const notify = (msg) => {
    setToast(msg);
  };

  const handleClaim = (planetId) => {
    onChange(claimPlanet(state, planetId));
    const p = cosmos.planetById(planetId);
    notify(`Stewardship switched to ${p?.name || planetId}.`);
  };

  const handleGoal = (goal) => {
    if (isGoalClaimed(state, goal.id)) {
      notify(`"${goal.title}" credits are already claimed.`);
      return;
    }
    onChange(completeGoal(state, goal.id));
    notify(`+${goal.credits} Credits earned for "${goal.title}"!`);
  };

  const handleInvestigate = () => {
    const res = investigatePlanet(state, activePlanet);
    onChange(res.state);
    if (res.discovered) {
      notify(`Discovered ${res.discovered.name} (${res.discovered.stage}) on ${activePlanet.name}!`);
    } else {
      notify(`All native species on ${activePlanet.name} are cataloged (+5% Research).`);
    }
  };

  const handleCultivate = (species) => {
    const res = cultivateLife(state, activePlanet.id, species.id);
    if (!res.ok) {
      const msg = res.reason === 'insufficient-credits'
        ? 'Need 25 Credits to cultivate life.'
        : res.reason === 'needs-producer'
          ? 'Food-web rule: cultivate a Flora or Microbe producer before introducing Fauna!'
          : 'Already cultivated.';
      notify(msg);
      return;
    }
    onChange(res.state);
    notify(`Cultivated ${species.name} on ${activePlanet.name}!`);
  };

  const handleBuild = (feature) => {
    const res = buildFeature(state, activePlanet.id, feature.id, { starClass: activeSystem?.starClass });
    if (!res.ok) {
      notify(res.reason === 'insufficient-credits' ? `Need ${feature.cost} Credits for ${feature.name}.` : 'Feature already online.');
      return;
    }
    onChange(res.state);
    notify(`Built ${feature.name} on ${activePlanet.name}!`);
  };

  const handleWeeklyEvent = () => {
    const allIds = cosmos.planets.map((p) => p.id);
    const next = runWeeklyUniverseEvent(state, allIds);
    onChange(next);
    const names = next.weeklyBulletin.map((e) => cosmos.planetById(e.planetId)?.name || e.planetId).join(', ');
    notify(`Week ${next.week} Universe Event: 3 planets affected (${names}).`);
  };

  const handleResolveDilemma = () => {
    const res = resolveHazardWithDilemma(state, activePlanet.id, dilemmaChoice, logNote, activePlanet.name);
    if (!res.ok) {
      notify(res.reason === 'insufficient-credits' ? 'Not enough Credits for that engineering protocol.' : 'No active hazard.');
      return;
    }
    onChange(res.state);
    setLogNote('');
    notify(`Logged Captain's Decision: "${res.chosen.label}" on ${activePlanet.name}!`);
  };

  const askCrew = async (question) => {
    if (advisorBusy) return;
    const q = (question || '').trim() || 'What should our crew prioritize next?';
    setAdvisorBusy(true);
    try {
      const res = await fetchCrewAdvisorReply({
        planet: activePlanet,
        system: activeSystem,
        record,
        question: q
      });
      const line = toCrewLine(res.reply);
      setAdvisorThread((prev) => [
        { id: `${Date.now()}-${prev.length}`, question: q, speakerId: res.speakerId || line.speakerId, text: line.text, source: res.source },
        ...prev
      ].slice(0, 4));
      setAdvisorQ('');
    } finally {
      setAdvisorBusy(false);
    }
  };

  const handleAskAdvisor = (e) => {
    e.preventDefault();
    askCrew(advisorQ);
  };

  const changeTab = (id) => {
    setTab(id);
    setHazardOpen(null);
  };
  const hazardExpanded = hazardOpen ?? tab === 'crew';

  return (
    <aside
      className="upg-drawer"
      aria-label="My Universe Learner Playground"
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="upg-head">
        <div className="upg-title-wrap">
          <Sparkles size={18} color="#96d700" aria-hidden="true" />
          <div>
            <h2 ref={drawerHeadingRef} tabIndex={-1}>Learner Playground</h2>
            <span className="upg-subtitle">
              {cosmos.galaxies.length} galaxies · {cosmos.systems.length} systems · {cosmos.planets.length} exoplanets
            </span>
          </div>
        </div>
        <div className="upg-badges">
          <span className="upg-credit-pill" title="Universe Credits">
            <Coins size={14} aria-hidden="true" />
            {state.credits} Cr
            {creditDelta !== 0 && (
              <span className={`upg-credit-delta${creditDelta > 0 ? ' is-pos' : ' is-neg'}`} aria-live="polite">
                {creditDelta > 0 ? `+${creditDelta}` : creditDelta}
              </span>
            )}
          </span>
          <button type="button" className="upg-close" onClick={onClose} aria-label="Close playground">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="upg-tabs"
        role="tablist"
        aria-label="Playground sections"
        onKeyDown={(e) => {
          const idx = TABS.findIndex((t) => t.id === tab);
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextId = TABS[(idx + 1) % TABS.length].id;
            changeTab(nextId);
            tabRefs.current[nextId]?.focus?.();
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevId = TABS[(idx - 1 + TABS.length) % TABS.length].id;
            changeTab(prevId);
            tabRefs.current[prevId]?.focus?.();
          }
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`upg-tab-${id}`}
            ref={(el) => { tabRefs.current[id] = el; }}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`upg-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={`upg-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => changeTab(id)}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {toast && (
        <div className="upg-toast-bar" role="status">
          <span>{toast}</span>
          <button type="button" className="upg-toast-dismiss" onClick={() => setToast('')} aria-label="Dismiss notification">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div id={`upg-panel-${tab}`} className="upg-body" role="tabpanel" aria-labelledby={`upg-tab-${tab}`}>

        {record.activeHazard && dilemmaOptions && (
          <div className={`upg-alert${hazardExpanded ? '' : ' is-collapsed'}`} role="region" aria-label="Active planetary hazard">
            <h3>
              <AlertTriangle size={16} aria-hidden="true" />
              <span className="upg-alert-title">{record.activeHazard.name} on {activePlanet.name}</span>
              <button
                type="button"
                className="upg-alert-toggle"
                aria-expanded={hazardExpanded}
                aria-controls="upg-hazard-detail"
                onClick={() => setHazardOpen(!hazardExpanded)}
              >
                {hazardExpanded ? <>Hide <ChevronUp size={14} aria-hidden="true" /></> : <>Decide now <ChevronDown size={14} aria-hidden="true" /></>}
              </button>
            </h3>
            {hazardExpanded && (
              <div id="upg-hazard-detail" className="upg-alert-detail">
                <p className="upg-muted">{record.activeHazard.summary}</p>
                <div className="upg-list">
                  {dilemmaOptions.map((opt) => (
                    <label key={opt.id} className="upg-item" style={{ cursor: 'pointer', borderColor: dilemmaChoice === opt.id ? '#96d700' : undefined }}>
                      <div className="upg-item-row">
                        <span>
                          <input
                            type="radio"
                            name="upg-dilemma"
                            checked={dilemmaChoice === opt.id}
                            onChange={() => setDilemmaChoice(opt.id)}
                            style={{ marginRight: 6 }}
                          />
                          <strong>{opt.label}</strong>
                        </span>
                        <span className="upg-tag upg-speaker-tag"><CrewAvatar personaId={personaForText(opt.speaker).id} size="xs" />{opt.speaker}</span>
                      </div>
                      <p className="upg-muted">{opt.pitch}</p>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  className="upg-select"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Captain's Log: why did you choose this approach? (1–2 sentences)"
                  aria-label="Captain's Log reasoning"
                />
                <button type="button" className="upg-btn upg-btn-primary" onClick={handleResolveDilemma}>
                  Execute &amp; Log Decision
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'overview' && (
          <>
            {nextMission && (
              <section className="upg-card upg-focus-card" aria-label="Next recommended mission">
                <div className="upg-item-row">
                  <span className="upg-tag upg-tag-focus">{nextMission.badge}</span>
                  <span className="upg-muted" style={{ fontSize: '0.75rem' }}>Next Best Action</span>
                </div>
                <h3><span>{nextMission.title}</span></h3>
                <p className="upg-muted">{nextMission.summary}</p>
                <button
                  type="button"
                  className="upg-btn upg-btn-primary"
                  onClick={() => {
                    if (nextMission.actionType === 'scan') {
                      handleInvestigate();
                      changeTab('life');
                    } else if (nextMission.actionType === 'tab-life') {
                      changeTab('life');
                    } else if (nextMission.actionType === 'open-lab') {
                      setLabOpen(true);
                    } else if (nextMission.actionType === 'tab-creator') {
                      changeTab('creator');
                    } else if (nextMission.actionType === 'focus-hazard') {
                      changeTab('crew');
                    }
                  }}
                >
                  {nextMission.ctaLabel}
                </button>
              </section>
            )}

            <section className="upg-card">
              <h3>
                <span>Your Exoplanet ({activePlanet?.name})</span>
                {onFlyToPlanet && activePlanet && (
                  <button type="button" className="upg-btn" onClick={() => onFlyToPlanet(activePlanet.id)}>
                    <Rocket size={13} aria-hidden="true" /> {record.features.length > 0 ? 'Land & View 3D' : 'Fly in 3D'}
                  </button>
                )}
              </h3>
              <label className="upg-muted" htmlFor="upg-planet-select">
                Choose any of the {cosmos.planets.length} exoplanets to investigate and govern:
              </label>
              <select
                id="upg-planet-select"
                className="upg-select"
                value={activePlanet?.id || ''}
                onChange={(e) => handleClaim(e.target.value)}
              >
                {cosmos.planets.map((p) => {
                  const sys = cosmos.systemById(p.systemId);
                  const gal = sys ? cosmos.galaxyById(sys.galaxyId) : null;
                  const steward = stewardForPlanet(p.id, state, peers);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.kind}) — {gal?.name} / {sys?.name} · Steward: {steward}
                    </option>
                  );
                })}
              </select>
              <div className="upg-stats">
                {[
                  ['Habitability', record.habitability],
                  ['Biodiversity', record.biodiversity],
                  ['Shielding', record.shielding],
                  ['Research', record.research]
                ].map(([label, val]) => (
                  <div className="upg-stat" key={label}>
                    <div className="upg-stat-top"><span>{label}</span><strong>{val}%</strong></div>
                    <div className="upg-bar"><span style={{ width: `${val}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="upg-muted">
                <strong>{record.trait || activePlanet?.kind}</strong> · <strong>{starMods.label}</strong> (Solar ×{starMods.solarBonus}) · O₂ {record.atmosphere?.o2 ?? 12}% · CO₂ {record.atmosphere?.co2 ?? 28}% · Fire Risk: <strong>{fireRisk.level}</strong>
              </p>
            </section>

            <section className="upg-card">
              <h3><span>Achieve Goals → Earn Credits</span><span className="upg-tag">Week {state.week}</span></h3>
              <p className="upg-muted">
                Complete SPARK learning goals to earn Universe Credits for building exoplanet features.
                {(state.syncedSparkGoalIds?.length || 0) > 0 && (
                  <> ({state.syncedSparkGoalIds.length} SPARK goal{state.syncedSparkGoalIds.length > 1 ? 's' : ''} synced!)</>
                )}
              </p>
              <ul className="upg-list">
                {GOAL_REWARDS.map((goal) => {
                  const claimed = (goalClaimCounts[goal.id] || 0) > 0;
                  const eligibility = getGoalEligibility(state, goal.id);
                  return (
                    <li className="upg-item" key={goal.id}>
                      <div className="upg-item-row">
                        <strong>{goal.title}</strong>
                        <span className="upg-tag">+{goal.credits} Cr</span>
                      </div>
                      <p className="upg-muted">{goal.description}</p>
                      <div className="upg-item-row">
                        <button
                          type="button"
                          className={`upg-btn${claimed ? ' upg-btn-complete' : ' upg-btn-primary'}`}
                          disabled={claimed}
                          onClick={() => handleGoal(goal)}
                        >
                          {claimed ? 'Claimed ✓' : 'Claim Goal Credit'}
                        </button>
                        {!claimed && eligibility.progressLabel && (
                          <span className="upg-muted" style={{ fontSize: '0.76rem' }}>{eligibility.progressLabel}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        {tab === 'life' && (() => {
          const discovered = record.discoveredSpecies
            .map((sid) => SPECIES_CATALOG.find((x) => x.id === sid))
            .filter(Boolean);
          const producers = discovered.filter((sp) => sp.stage === 'Flora' || sp.stage === 'Microbe');
          const consumers = discovered.filter((sp) => sp.stage === 'Fauna');
          const filteredFeatures = featureCat === 'all'
            ? FEATURE_CATALOG
            : FEATURE_CATALOG.filter((f) => f.category === featureCat);

          const renderSpeciesCard = (sp) => {
            const cultivated = record.cultivatedSpecies.includes(sp.id);
            const blockedByTrophic = sp.stage === 'Fauna' && !hasProducer && !cultivated;
            const insufficient = !cultivated && state.credits < 25;
            return (
              <li className="upg-item" key={sp.id}>
                <div className="upg-item-row">
                  <strong>{sp.name}</strong>
                  <span className="upg-tag">{sp.stage}</span>
                </div>
                <p className="upg-muted">{sp.summary}</p>
                {blockedByTrophic && (
                  <p className="upg-trophic-note">Trophic rule: Cultivate a Flora or Microbe producer first.</p>
                )}
                <button
                  type="button"
                  className={`upg-btn${cultivated ? ' upg-btn-complete' : ''}`}
                  disabled={cultivated || insufficient || blockedByTrophic}
                  onClick={() => handleCultivate(sp)}
                >
                  {cultivated
                    ? 'Ecosystem Flourishing ✓'
                    : blockedByTrophic
                      ? 'Needs Producer First'
                      : insufficient
                        ? `Need ${25 - state.credits} more Cr`
                        : 'Cultivate Life (-25 Cr)'}
                </button>
              </li>
            );
          };

          return (
            <>
              <section className="upg-card upg-lab-hero">
                <h3>
                  <span>AI Research Lab: Spaceship Builder</span>
                  <span className="upg-tag">{(state.savedShips || []).length} saved</span>
                </h3>
                <p className="upg-muted">
                  Design, assemble, and physics-test an interplanetary craft with your AI Engineering Mentor.
                </p>
                <button type="button" className="upg-btn upg-btn-primary" onClick={() => setLabOpen(true)}>
                  <Rocket size={14} aria-hidden="true" /> Open Spaceship Builder
                </button>
              </section>

              <section className="upg-card">
                <h3>
                  <span>Investigate &amp; Develop Life</span>
                  <button type="button" className="upg-btn upg-btn-primary" onClick={handleInvestigate}>
                    <Compass size={14} aria-hidden="true" /> Scan for Life
                  </button>
                </h3>
                <p className="upg-muted">
                  Biome: <strong>{activePlanet?.kind}</strong> · {discovered.length} species discovered · Food web: <strong>{hasProducer ? 'Producers Active ✓' : 'Needs Producer'}</strong>
                </p>
                {discovered.length === 0 ? (
                  <ul className="upg-list">
                    <li className="upg-item"><p className="upg-muted">Run a biosignature scan to discover living things on {activePlanet?.name}.</p></li>
                  </ul>
                ) : (
                  <>
                    {producers.length > 0 && (
                      <div className="upg-trophic-group">
                        <span className="upg-trophic-label">Tier 1 · Producers (Flora &amp; Microbes)</span>
                        <ul className="upg-list">{producers.map(renderSpeciesCard)}</ul>
                      </div>
                    )}
                    {consumers.length > 0 && (
                      <div className="upg-trophic-group">
                        <span className="upg-trophic-label">Tier 2 · Consumers (Fauna)</span>
                        <ul className="upg-list">{consumers.map(renderSpeciesCard)}</ul>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="upg-card">
                <h3>
                  <span>Exoplanet Feature Forge</span>
                  <span className="upg-tag">{record.features.length}/{FEATURE_CATALOG.length} built</span>
                </h3>
                <div className="upg-filter-row" role="group" aria-label="Filter features by category">
                  {FEATURE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`upg-filter-chip${featureCat === cat.id ? ' is-active' : ''}`}
                      aria-pressed={featureCat === cat.id}
                      onClick={() => setFeatureCat(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <ul className="upg-list">
                  {filteredFeatures.map((f) => {
                    const built = record.features.includes(f.id);
                    const insufficient = !built && state.credits < f.cost;
                    return (
                      <li className="upg-item" key={f.id}>
                        <div className="upg-item-row">
                          <strong>{f.name}</strong>
                          <span className="upg-tag">{f.cost} Cr</span>
                        </div>
                        <p className="upg-muted">{f.summary}</p>
                        <div className="upg-effect-row">
                          {Object.entries(f.effects || {}).map(([k, v]) => {
                            const val = f.id === 'solar-float-array' && k === 'habitability'
                              ? Math.round(v * starMods.solarBonus)
                              : v;
                            return (
                              <span className="upg-effect-pill" key={k}>
                                +{val}% {EFFECT_LABEL[k] || k}
                              </span>
                            );
                          })}
                          {f.id === 'solar-float-array' && starMods.solarBonus !== 1 && (
                            <span className="upg-effect-pill is-star">Solar ×{starMods.solarBonus}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`upg-btn${built ? ' upg-btn-complete' : ' upg-btn-primary'}`}
                          disabled={built || insufficient}
                          onClick={() => handleBuild(f)}
                        >
                          {built
                            ? 'Installed ✓'
                            : insufficient
                              ? `Need ${f.cost - state.credits} more Cr`
                              : `Build Feature (${f.cost} Cr)`}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          );
        })()}

        {labOpen && (
          <SpaceshipBuilderModal
            planetName={activePlanet?.name}
            savedShips={state.savedShips || []}
            motion={motion}
            onSaveProject={(snap) => {
              onChange(saveSpaceshipProject(state, snap));
              notify(`Saved ${snap.name} (v${snap.version}) — ${snap.simulation.passed ? 'Passed Physics' : 'Needs Tuning'}.`);
            }}
            onClose={() => setLabOpen(false)}
          />
        )}

        {tab === 'crew' && (
          <>
            <section className="upg-card">
              <h3><span>AI Crew Briefings</span><Bot size={15} aria-hidden="true" /></h3>
              <ul className="upg-crew-strip" aria-label="Your crew">
                {CREW_PERSONAS.map((p) => (
                  <li key={p.id} style={{ '--crew-color': p.color }} title={p.focus}>
                    <CrewAvatar personaId={p.id} />
                    <span><strong>{p.short}</strong><small>{p.role}</small></span>
                  </li>
                ))}
              </ul>
              <div className="upg-thread">
                {briefings.map((msg, i) => {
                  const line = toCrewLine(msg);
                  return <CrewBubble key={i} speakerId={line.speakerId} text={line.text} />;
                })}
              </div>
              <div className="upg-quick-asks" role="group" aria-label="Quick questions for the crew">
                {QUICK_ASKS.filter((qa) => qa.id !== 'hazard' || record.activeHazard).map((qa) => (
                  <button
                    key={qa.id}
                    type="button"
                    className="upg-filter-chip"
                    disabled={advisorBusy}
                    onClick={() => askCrew(qa.question)}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAskAdvisor} className="upg-list" style={{ marginTop: 6 }}>
                <input
                  type="text"
                  className="upg-select"
                  value={advisorQ}
                  onChange={(e) => setAdvisorQ(e.target.value)}
                  placeholder="Or type your own question (e.g. How do we raise biodiversity safely?)"
                  aria-label="Ask AI Crew Advisor"
                />
                <button type="submit" className="upg-btn upg-btn-primary" disabled={advisorBusy}>
                  {advisorBusy ? 'Consulting Crew…' : 'Ask AI Crew Advisor'}
                </button>
              </form>
              {advisorThread.length > 0 && (
                <div className="upg-thread" aria-live="polite" aria-label="Crew replies">
                  {advisorThread.map((entry) => (
                    <div key={entry.id} className="upg-exchange">
                      <p className="upg-you-said"><span className="upg-sr">You asked: </span>{entry.question}</p>
                      <CrewBubble speakerId={entry.speakerId} text={entry.text} source={entry.source} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="upg-card">
              <h3><span>Govern Crew Assignments</span></h3>
              <ul className="upg-list">
                {record.crew.map((member) => {
                  const persona = personaById(member.id);
                  return (
                    <li className="upg-item upg-crew-card" key={member.id} style={{ '--crew-color': persona.color }}>
                      <div className="upg-item-row">
                        <span className="upg-crew-name">
                          <CrewAvatar personaId={member.id} />
                          <strong>{member.name}</strong>
                        </span>
                        <span className="upg-tag">{member.role}</span>
                      </div>
                      <div className="upg-vitals">
                        <VitalBar label="Morale" value={member.morale} />
                        <VitalBar label="Stamina" value={member.stamina} />
                      </div>
                      {member.stamina < 40 && (
                        <p className="upg-trophic-note">{persona.short} is tired — a Crew Rest shift restores stamina.</p>
                      )}
                      <select
                        aria-label={`Task for ${member.name}`}
                        className="upg-select"
                        value={member.task}
                        onChange={(e) => onChange(assignCrewTask(state, activePlanet.id, member.id, e.target.value))}
                      >
                        {CREW_TASKS.map((t) => (
                          <option key={t.id} value={t.id}>{t.label} — {t.summary}</option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="upg-card">
              <h3><span>Captain&apos;s Log</span><span className="upg-tag">{(state.captainsLog || []).length} entries</span></h3>
              <ul className="upg-list">
                {(!state.captainsLog || state.captainsLog.length === 0) && (
                  <li className="upg-item"><p className="upg-muted">No Captain&apos;s Log entries yet. Resolve a weekly hazard dilemma to record your scientific reasoning.</p></li>
                )}
                {(state.captainsLog || []).map((entry, idx) => (
                  <li className="upg-item" key={entry.id || `${entry.at || 'log'}-${idx}`}>
                    {entry.choiceLabel ? (
                      <>
                        <div className="upg-item-row">
                          <strong>Week {entry.week} · {entry.planetName}</strong>
                          <span className="upg-tag">{entry.hazardName}</span>
                        </div>
                        <p className="upg-muted"><strong>{entry.choiceLabel}</strong></p>
                        <p className="upg-muted">{entry.reasoning}</p>
                      </>
                    ) : (
                      <>
                        <div className="upg-item-row">
                          <strong>Classroom Co-Op · {cosmos.planetById(entry.planetId)?.name || entry.planetId || 'Outpost'}</strong>
                          <span className="upg-tag">Relief Pod</span>
                        </div>
                        <p className="upg-muted">{entry.note}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {tab === 'creator' && (
          <>
            <section className="upg-card" aria-label="Classroom Co-Op Planets">
              <h3>
                <span><Users size={15} aria-hidden="true" /> Classroom Co-Op · Privacy Mode</span>
                <span className="upg-tag">{peers.length} classmate{peers.length === 1 ? '' : 's'}</span>
              </h3>
              <p className="upg-muted">
                Privacy Mode active: classmates in your verified class appear by first name and initial only. Visit their exoplanets in 3D (read-only) or send an orbital relief pod (+10 Cr).
              </p>
              {visitingPeer && (
                <div className="upg-item" style={{ borderColor: '#96d700' }}>
                  <div className="upg-item-row">
                    <strong>Visiting {visitingPeer.stewardName}’s {cosmos.planetById(visitingPeer.planetId)?.name || visitingPeer.planetId}</strong>
                    <span className="upg-tag">Read-only 3D</span>
                  </div>
                  {onExitVisit && (
                    <button type="button" className="upg-btn upg-btn-primary" onClick={onExitVisit}>
                      Return to My Planet
                    </button>
                  )}
                </div>
              )}
              <ul className="upg-list">
                {peers.length === 0 && (
                  <li className="upg-item">
                    <p className="upg-muted">When classmates in your class open My Universe, their exoplanets appear here so you can visit in 3D and send co-op relief pods.</p>
                  </li>
                )}
                {peers.map((peer) => {
                  const pObj = cosmos.planetById(peer.claimedPlanetId);
                  const pName = pObj?.name || peer.claimedPlanetId;
                  const aidKey = `${peer.peerId}:${peer.claimedPlanetId}`;
                  const alreadyAided = (state.aidedThisWeek || []).includes(aidKey);
                  const isVisiting = visitingPeer?.peerId === peer.peerId;
                  const hab = peer.planet?.habitability ?? 35;
                  const featCount = (peer.planet?.features || []).length;
                  const hasPeerHazard = Boolean(peer.planet?.activeHazard);
                  return (
                    <li className="upg-item" key={peer.peerId}>
                      <div className="upg-item-row">
                        <strong>{peer.stewardName} · {pName}</strong>
                        <span className="upg-tag">{hasPeerHazard ? 'Hazard Active' : `${hab}% Hab`}</span>
                      </div>
                      <p className="upg-muted">
                        {featCount} feature{featCount === 1 ? '' : 's'} built · {(peer.unlockedFacilities || []).length} facilit{(peer.unlockedFacilities || []).length === 1 ? 'y' : 'ies'} unlocked
                        {peer.shipCount > 0 ? ` · ${peer.shipCount} spacecraft` : ''}
                      </p>
                      <div className="upg-item-row">
                        {onVisitPeer && (
                          <button
                            type="button"
                            className={`upg-btn${isVisiting ? ' upg-btn-complete' : ' upg-btn-primary'}`}
                            onClick={() => onVisitPeer(peer)}
                          >
                            <Eye size={13} aria-hidden="true" /> {isVisiting ? 'Visiting Now ✓' : `Visit ${pName} in 3D`}
                          </button>
                        )}
                        {onSendCoopAid && (
                          <button
                            type="button"
                            className={`upg-btn${alreadyAided ? ' upg-btn-complete' : ''}`}
                            disabled={alreadyAided || aidBusyPeerId === peer.peerId}
                            onClick={async () => {
                              setAidBusyPeerId(peer.peerId);
                              try {
                                const res = await onSendCoopAid(peer);
                                if (res?.ok) {
                                  notify(`Sent orbital relief pod to ${peer.stewardName}’s ${pName}! (+10 Co-Op Cr)`);
                                } else {
                                  notify(res?.error || 'Could not send relief pod right now.');
                                }
                              } finally {
                                setAidBusyPeerId(null);
                              }
                            }}
                          >
                            {alreadyAided ? 'Pod Sent ✓' : aidBusyPeerId === peer.peerId ? 'Sending…' : 'Send Relief Pod (+10 Cr)'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="upg-card">
              <h3>
                <span>Universe Creator: Weekly Events</span>
                <span className="upg-tag">Week {state.week}</span>
              </h3>
              <p className="upg-muted">
                Every week, the Universe Creator triggers random cosmic storms, lab fires, or radiation hazards across 3 random exoplanets.
              </p>
              <button type="button" className="upg-btn upg-btn-primary" onClick={handleWeeklyEvent}>
                <Flame size={14} aria-hidden="true" /> Simulate Next Week (3 Random Planets)
              </button>
              <ul className="upg-list">
                {state.weeklyBulletin.length === 0 && (
                  <li className="upg-item"><p className="upg-muted">No weekly events triggered yet. Click above to run the Universe Creator cycle.</p></li>
                )}
                {state.weeklyBulletin.map((ev) => {
                  const p = cosmos.planetById(ev.planetId);
                  const steward = stewardForPlanet(ev.planetId, state, peers);
                  const isOwn = state.claimedPlanetId === ev.planetId;
                  const aided = (state.aidedThisWeek || []).includes(ev.planetId);
                  return (
                    <li className="upg-item" key={ev.id}>
                      <div className="upg-item-row">
                        <strong><ShieldAlert size={14} aria-hidden="true" /> {p?.name || ev.planetId}: {ev.name}</strong>
                        <span className="upg-tag">-{ev.damage}% stability</span>
                      </div>
                      <p className="upg-muted">Steward: <strong>{steward}</strong> · {ev.summary}</p>
                      <div className="upg-item-row">
                        {onFlyToPlanet && (
                          <button type="button" className="upg-btn" onClick={() => onFlyToPlanet(ev.planetId)}>
                            Inspect {p?.name || ev.planetId}
                          </button>
                        )}
                        {!isOwn && (
                          <button
                            type="button"
                            className={`upg-btn${aided ? ' upg-btn-complete' : ' upg-btn-primary'}`}
                            disabled={aided}
                            onClick={() => {
                              const res = sendPlanetaryAid(state, ev.planetId);
                              if (res.ok) {
                                onChange(res.state);
                                notify(`Sent emergency aid to ${steward} on ${p?.name || ev.planetId}! (+10 Teamwork Cr)`);
                              }
                            }}
                          >
                            {aided ? 'Aid Sent ✓' : 'Send Aid (+10 Cr)'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
