/**
 * Interactive Project Exodus Simulator: Spaceship, Recycling Loop, Space Emergency Game & New Planet Rulebook
 * Branch: DonPBL
 * Location: prototypes/DonPBL/ui/components/InterstellarArkSimulator.tsx
 *
 * Implements the simulation & gamification sandbox for "Project Exodus: Building Our New Home in Space":
 * - Tab 1: Week 1–2 & Week 5 — Goldilocks Planet Fact File & Spinning Fake-Gravity Spaceship
 * - Tab 2: Week 3 & Week 7–8 — 500-Person Food & Recycling Loop Map + Physical Model Supply Budget (in Thai Baht)
 * - Tab 3: Part 1 (The 6 Space Emergency Game Cards) & Part 2 (Interactive New Planet Rulebook Fill-in-the-Blank Worksheet)
 * - Tab 4: Week 11–12 — 4-Part Big Pitch Checklist, Badges & How You Will Grow: WeLearn Future Skills Guide
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Rocket,
  Globe,
  Sprout,
  ShieldAlert,
  Award,
  CheckCircle2,
  Sparkles,
  Zap,
  Layers,
  Scale,
  Activity,
  Compass,
  Users,
  Wrench
} from 'lucide-react';
import {
  EXOPLANET_CANDIDATES,
  ARK_PROPULSION_OPTIONS,
  ARK_CRISIS_SCENARIOS,
  ARK_WELEARN_MTC_RUBRIC,
  ARK_GAMIFICATION_LEVELS,
  ARK_GAMIFICATION_BADGES,
  simulateArkBiosphere
} from '../pbl';
import type {
  ExoplanetCandidate,
  ArkPropulsionOption,
  ArkCrisisScenario
} from '../pbl';

interface InterstellarArkSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (summaryTitle: string, summaryNotes: string) => void;
}

interface ThbMaterialItem {
  id: string;
  name: string;
  subsystem: string;
  costTHB: number;
  selected: boolean;
}

const INITIAL_THB_MATERIALS: ThbMaterialItem[] = [
  { id: 'mat-cardboard', name: 'Cardboard Boxes & Poster Sheets', subsystem: 'Spaceship Hull & New Planet Land Base', costTHB: 180, selected: true },
  { id: 'mat-foam', name: 'Foam Sheets & Blocks', subsystem: 'Spinning Fake-Gravity Ring & Landing Pods', costTHB: 260, selected: true },
  { id: 'mat-bottles', name: 'Clean Recycled Plastic Bottles', subsystem: 'Open "Cutaway" Windows & Hydroponic Water Tanks', costTHB: 120, selected: true },
  { id: 'mat-wood', name: 'Wood Sticks & Craft Dowels', subsystem: 'Room Framing, Bridges & Strong Landing Legs', costTHB: 190, selected: true },
  { id: 'mat-clay', name: 'Modeling Clay (Multi-Color)', subsystem: 'Planet Mountains, Muddy Land & Mini Space Farms', costTHB: 240, selected: true },
  { id: 'mat-wire', name: 'Craft Wire & Pipe Cleaners', subsystem: 'Water Recycling Pipes, Repair Robots & Solar Panels', costTHB: 160, selected: true },
  { id: 'mat-markers', name: 'Color-Coding Markers, Labels & Tape', subsystem: 'Clear Labels for Farms, Bedrooms, Repair Tunnels & Engines', costTHB: 160, selected: true },
  { id: 'mat-lights', name: 'Optional Mini LED Lights', subsystem: 'Sunrise/Sunset Sleep Lights & Greenhouse Glow', costTHB: 150, selected: false }
];

export const InterstellarArkSimulator: React.FC<InterstellarArkSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'exoplanet' | 'digital-twin' | 'crisis-arena' | 'mtc-rubric'>('exoplanet');
  const [buildMode, setBuildMode] = useState<'digital-twin' | 'physical-1500thb'>('digital-twin');

  // Tab 1 state: Goldilocks Planet & Spinning Fake-Gravity Ship
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(EXOPLANET_CANDIDATES[0].id);
  const [selectedPropulsionId, setSelectedPropulsionId] = useState<string>(ARK_PROPULSION_OPTIONS[0].id);

  // Tab 2 state: 500-Person Food & Recycling Loop Map + Thai Baht Model Budget
  const [hydroponicAreaSqM, setHydroponicAreaSqM] = useState<number>(1650);
  const [algaeBioreactorLiters, setAlgaeBioreactorLiters] = useState<number>(3200);
  const [waterRecoveryEfficiencyPct, setWaterRecoveryEfficiencyPct] = useState<number>(98.5);
  const [restorativeSpacePct, setRestorativeSpacePct] = useState<number>(22);
  const [repairDroneBays, setRepairDroneBays] = useState<number>(6);
  const [thbMaterials, setThbMaterials] = useState<ThbMaterialItem[]>(INITIAL_THB_MATERIALS);

  // Tab 3 state: Part 1 (The 6 Space Emergency Game Cards) & Part 2 (New Planet Rulebook Worksheet)
  const [selectedCrisisId, setSelectedCrisisId] = useState<string>(ARK_CRISIS_SCENARIOS[0].id);
  const [crisisActive, setCrisisActive] = useState<boolean>(false);
  const [engineeringMitigation, setEngineeringMitigation] = useState<'modular-quarantine' | 'drone-overdrive' | 'unprepared'>('modular-quarantine');
  const [constitutionalResponse, setConstitutionalResponse] = useState<'restorative-civic' | 'sunset-compact' | 'authoritarian-lockdown'>('restorative-civic');

  // Interactive Part 2: New Planet Rulebook Worksheet state
  const [rulebook, setRulebook] = useState({
    teamName: 'Starlight Pioneers',
    planetName: 'TRAPPIST-1e',
    townName: 'New Horizon Landing',
    mottoPromise1: 'help every neighbor stay safe and healthy',
    mottoPromise2: 'protect our new planet’s water, air, and nature',
    rightsBody: 'fresh hydroponic food, clean recycled water, a cozy bedroom, and kind doctor care',
    rightsMind: 'a welcoming school, quiet rest time, fun games in the park, and feeling safe',
    treatNeverAllowed: 'bully, exclude others, or waste shared water and food',
    treatAlwaysWith: 'kindness, patience, and fairness',
    chooseJobsBy: 'matching each person’s talents and interests with what the colony needs',
    messyJobsFairBy: 'taking turns on a weekly rotation schedule so everyone helps equally',
    shareResourcesHow: 'an equal daily share of fresh food, clean water, and electricity',
    runningLowPlan: 'share backup seed-vault rations fairly and fix the recycling loop together',
    leadersOnShip: 'the Flight Safety & Repair Crew',
    leadersOnShipWhy: 'they are trained to fix air leaks, engines, and life-support emergencies quickly',
    leadersOnPlanetBy: 'everyone voting for a 4-role Community Council',
    leaderTermLength: '12 months',
    replaceUnfairLeaderBy: 'holding a peaceful community vote to elect a fairer helper',
    natureLaw1: 'dump trash, pollute rivers, or waste clean water and electricity',
    recyclingRule: 'bring broken tools or old items to the 3D-printer repair workshop to be reused',
    alienLifeRule: 'leave them in peace, build fences to protect their homes, and study them gently',
    argumentTalkTo: 'our peaceful Community Mediators at the Park Peace Table',
    fixMistakeBy: 'helping the farm or water-recycling team repair what was wasted or broken',
    keepPeaceWay: 'taking deep breaths in the Cozy Relaxation Room and listening to each person’s side',
    signBuilder: 'Alex (Builder / Engineer)',
    signScientist: 'Maya (Planet Scientist)',
    signFarmer: 'Liam (Farm & Life-Support)',
    signLeader: 'Nok (Law & Community Leader)'
  });

  // Tab 4 state: 4-Part Big Pitch Checklist & Gamification Badges
  const [pillarsCompleted, setPillarsCompleted] = useState<Record<string, boolean>>({
    destination: true,
    vessel: true,
    biosphere: true,
    society: true
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([
    'badge-human-factor-empath',
    'badge-goldilocks-scout',
    'badge-eclss-charter-architect',
    'badge-centrifuge-zoning-master'
  ]);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const selectedPlanet: ExoplanetCandidate = useMemo(
    () => EXOPLANET_CANDIDATES.find((p) => p.id === selectedPlanetId) || EXOPLANET_CANDIDATES[0],
    [selectedPlanetId]
  );

  const selectedPropulsion: ArkPropulsionOption = useMemo(
    () => ARK_PROPULSION_OPTIONS.find((p) => p.id === selectedPropulsionId) || ARK_PROPULSION_OPTIONS[0],
    [selectedPropulsionId]
  );

  const selectedCrisis: ArkCrisisScenario = useMemo(
    () => ARK_CRISIS_SCENARIOS.find((c) => c.id === selectedCrisisId) || ARK_CRISIS_SCENARIOS[0],
    [selectedCrisisId]
  );

  const totalThbCost = useMemo(
    () => thbMaterials.filter((m) => m.selected).reduce((sum, item) => sum + item.costTHB, 0),
    [thbMaterials]
  );

  // Compute effective shocks when a Space Emergency Game Card is active in Tab 3
  const effectiveShocks = useMemo(() => {
    if (!crisisActive) {
      return { caloricShockPct: 0, waterShockPct: 0, moraleShockPts: 0 };
    }
    const engMultiplier =
      engineeringMitigation === 'modular-quarantine'
        ? 0.35
        : engineeringMitigation === 'drone-overdrive'
        ? 0.45
        : 1.0;

    const civicMoraleAdjustment =
      constitutionalResponse === 'restorative-civic'
        ? -12
        : constitutionalResponse === 'sunset-compact'
        ? -8
        : +18;

    return {
      caloricShockPct: Math.round(selectedCrisis.caloricShockPct * engMultiplier),
      waterShockPct: Math.round(selectedCrisis.waterLoopPenaltyPct * engMultiplier),
      moraleShockPts: Math.max(0, Math.round(selectedCrisis.moraleShockPts * 0.7 + civicMoraleAdjustment))
    };
  }, [crisisActive, selectedCrisis, engineeringMitigation, constitutionalResponse]);

  const biosphereMetrics = useMemo(
    () =>
      simulateArkBiosphere({
        colonistCount: 500,
        hydroponicAreaSqM,
        algaeBioreactorLiters,
        waterRecoveryEfficiencyPct,
        restorativeSpacePct,
        repairDroneBays,
        prototypingCostTHB: totalThbCost,
        caloricShockPct: effectiveShocks.caloricShockPct,
        waterShockPct: effectiveShocks.waterShockPct,
        moraleShockPts: effectiveShocks.moraleShockPts
      }),
    [
      hydroponicAreaSqM,
      algaeBioreactorLiters,
      waterRecoveryEfficiencyPct,
      restorativeSpacePct,
      repairDroneBays,
      totalThbCost,
      effectiveShocks
    ]
  );

  const totalEarnedXP = useMemo(() => {
    return ARK_GAMIFICATION_BADGES.filter((b) => unlockedBadges.includes(b.id)).reduce(
      (sum, b) => sum + b.xpAward,
      0
    );
  }, [unlockedBadges]);

  const currentLevel = useMemo(() => {
    let lvl = ARK_GAMIFICATION_LEVELS[0];
    for (const candidate of ARK_GAMIFICATION_LEVELS) {
      if (totalEarnedXP >= candidate.minXp) {
        lvl = candidate;
      }
    }
    return lvl;
  }, [totalEarnedXP]);

  if (!isOpen) return null;

  const toggleBadge = (badgeId: string) => {
    setUnlockedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const toggleMaterial = (matId: string) => {
    setThbMaterials((prev) =>
      prev.map((m) => (m.id === matId ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleSaveSimulation = () => {
    if (!onSaveToPortfolio) return;
    const title = `Project Exodus Plan & New Planet Rulebook (${selectedPlanet.name})`;
    const notes = [
      `Goldilocks Planet Fact File: ${selectedPlanet.name} (${selectedPlanet.distanceLightYears} light-years, ${selectedPlanet.surfaceGravityG}g gravity, ${selectedPlanet.terrainAndAtmosphere})`,
      `Spaceship & Fake Gravity: ${selectedPropulsion.name} (${selectedPropulsion.simulatedGravityG}g spinning ring, ${selectedPropulsion.hullShieldingSpec})`,
      `500-Person Food & Recycling Loop Map: ${biosphereMetrics.dailyKcalProduced.toLocaleString()} / ${biosphereMetrics.targetDailyKcal.toLocaleString()} kcal/day (${biosphereMetrics.caloricSufficiencyPct}% food), ${biosphereMetrics.oxygenSufficiencyPct}% fresh O2, ${biosphereMetrics.netWaterLoopPct}% water recycling, Happiness ${biosphereMetrics.moraleScore}/100`,
      `Classroom Physical Model Budget: ${biosphereMetrics.prototypingCostTHB} / 1,500 THB (${biosphereMetrics.withinThbBudget ? 'Within Budget' : 'Over Budget'})`,
      `Space Emergency Game Card Tested: ${selectedCrisis.title} -> Design Upgrade: ${selectedCrisis.recommendedProtocol}`,
      `New Planet Rulebook (${rulebook.townName} on ${rulebook.planetName}): "In our new home, we promise to always ${rulebook.mottoPromise1} and ${rulebook.mottoPromise2}." Signed by ${rulebook.signBuilder}, ${rulebook.signScientist}, ${rulebook.signFarmer}, ${rulebook.signLeader}.`,
      `WeLearn Future Skills Progress: Level ${currentLevel.level} (${currentLevel.title}) • ${totalEarnedXP} XP • ${unlockedBadges.length}/7 Badges`
    ].join('\n');

    onSaveToPortfolio(title, notes);
    setSavedBanner(`Saved "${title}" to your Digital Learning Folder!`);
    setTimeout(() => setSavedBanner(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Project Exodus: Building Our New Home in Space — Interactive Simulator
                </h2>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                  Level {currentLevel.level}: {currentLevel.title} ({totalEarnedXP} XP)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Goldilocks Planet Fact File • 500-Person Recycling Loop &amp; THB Model Budget • 6 Space Emergency Game Cards &amp; New Planet Rulebook
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close simulator modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation & Gamification Bar */}
        <div className="bg-slate-900 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('exoplanet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'exoplanet'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              1. Goldilocks Planet &amp; Fake Gravity
            </button>
            <button
              onClick={() => setActiveTab('digital-twin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'digital-twin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              2. Recycling Loop &amp; Physical Model (THB)
            </button>
            <button
              onClick={() => setActiveTab('crisis-arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'crisis-arena'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              3. Space Emergency Cards (1–6) &amp; Rulebook
            </button>
            <button
              onClick={() => setActiveTab('mtc-rubric')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'mtc-rubric'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              4. WeLearn Future Skills Guide &amp; Badges ({unlockedBadges.length}/7)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Save to Digital Learning Folder
              </button>
            )}
          </div>
        </div>

        {savedBanner && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {savedBanner}
            </span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50">
          {/* TAB 1: GOLDILOCKS PLANET FACT FILE & SPINNING FAKE-GRAVITY SPACESHIP */}
          {activeTab === 'exoplanet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goldilocks Planet Selector */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                        Phase 1 (Weeks 1–2) • Hunting for a Goldilocks Planet
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Pick Humanity&apos;s New Home &amp; Build Your Planet Fact File
                      </h3>
                    </div>
                    <Compass className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {EXOPLANET_CANDIDATES.map((planet) => {
                      const isSelected = planet.id === selectedPlanet.id;
                      return (
                        <button
                          key={planet.id}
                          onClick={() => {
                            setSelectedPlanetId(planet.id);
                            setRulebook((prev) => ({ ...prev, planetName: planet.name }));
                          }}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-stone-900">{planet.name}</span>
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                              {planet.distanceLightYears} ly
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1">
                            Gravity: <strong>{planet.surfaceGravityG}g</strong> • Sunlight: <strong>{planet.stellarFluxEarthRatio}x Earth</strong>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {planet.tidalLockingStatus}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Planet Fact File Card */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-sm text-indigo-300">
                        Planet Fact File: {selectedPlanet.name} ({selectedPlanet.constellation})
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Space Weather Danger: {selectedPlanet.radiationHazardIndex}/10
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block">Star Type</span>
                        <span>{selectedPlanet.starType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Year Length</span>
                        <span>{selectedPlanet.orbitalPeriodDays} Earth days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Avg Temp</span>
                        <span>{selectedPlanet.equilibriumTempC}°C</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">What the Land, Air &amp; Water Look Like:</strong> {selectedPlanet.terrainAndAtmosphere}
                    </p>
                    <p className="text-emerald-300 leading-relaxed">
                      <strong>Why This Planet Is a Great Choice:</strong> {selectedPlanet.colonizationAdvantage}
                    </p>
                    <p className="text-amber-300 leading-relaxed">
                      <strong>Dangers Waiting for Us:</strong> {selectedPlanet.primaryEngineeringChallenge}
                    </p>
                  </div>
                </div>

                {/* Spinning Fake Gravity & Spaceship Layout Configurator */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                        Week 1 &amp; Week 5 • Keeping People Healthy &amp; Spinning Fake Gravity
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        How Our Ship Moves Forward &amp; Makes Fake Gravity
                      </h3>
                    </div>
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>

                  <div className="space-y-2.5">
                    {ARK_PROPULSION_OPTIONS.map((opt) => {
                      const isSelected = opt.id === selectedPropulsion.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedPropulsionId(opt.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-stone-900">{opt.name}</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              ~{opt.estimatedTransitYears} Yr Trip
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1">
                            Spinning Ring: <strong>{opt.ringRadiusMeters}m wide</strong> @ <strong>{opt.rotationRpm} RPM</strong> → <strong>{opt.simulatedGravityG}g Fake Gravity</strong>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Protection: {opt.hullShieldingSpec}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Week 1 Human Needs Chart Summary Box */}
                  <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 space-y-3 text-xs">
                    <div className="font-bold text-stone-900 flex items-center justify-between">
                      <span>Week 1 Human Needs Chart (Bodies, Feelings &amp; Friendships)</span>
                      <span className="font-mono text-indigo-700">
                        Fake Gravity: {selectedPropulsion.simulatedGravityG}g
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">1. For Their Bodies</span>
                        <span className="text-xs font-semibold text-stone-900 block mt-0.5">Strong Bones &amp; Sleep</span>
                        <span className="text-[11px] text-stone-600 block mt-0.5">
                          {selectedPropulsion.simulatedGravityG}g spinning ring + radiation shields + sunrise/sunset lights.
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">2. For Their Feelings</span>
                        <span className="text-xs font-semibold text-stone-900 block mt-0.5">No Boredom or Sadness</span>
                        <span className="text-[11px] text-stone-600 block mt-0.5">
                          Cozy quiet rooms, nature parks, art &amp; music spaces (submarine/polar lessons).
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">3. For Friendships</span>
                        <span className="text-xs font-semibold text-stone-900 block mt-0.5">Welcoming Town</span>
                        <span className="text-[11px] text-stone-600 block mt-0.5">
                          Shared kitchens, schools, game parks, and fair rules so everyone gets along.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 500-PERSON RECYCLING LOOP MAP & PHYSICAL MODEL BUDGET (THB) */}
          {activeTab === 'digital-twin' && (
            <div className="space-y-6">
              {/* Toggle between Recycling Loop & Spaceship Rooms vs. Physical Model Budget */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-indigo-600 font-semibold">
                    Week 3, Week 5 &amp; Weeks 7–8 • Drawings, Plans &amp; Hands-On Models
                  </span>
                  <h3 className="text-sm font-bold text-stone-900">
                    Explore Your 500-Person Recycling Loop Map or Plan Your Physical Model Budget (in Thai Baht)
                  </h3>
                </div>
                <div className="inline-flex rounded-lg p-1 bg-stone-100 border border-stone-200 text-xs font-semibold">
                  <button
                    onClick={() => setBuildMode('digital-twin')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      buildMode === 'digital-twin'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    500-Person Farm &amp; Ship Neighborhoods
                  </button>
                  <button
                    onClick={() => setBuildMode('physical-1500thb')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      buildMode === 'physical-1500thb'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    Week 8 Physical Model Budget (Thai Baht)
                  </button>
                </div>
              </div>

              {/* Live Telemetry Dashboard Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.caloricSufficiencyPct >= 100 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Daily Food for 500</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.caloricSufficiencyPct}%</span>
                  <span className="text-[11px] text-stone-600 block">
                    Hydroponics &amp; Aeroponics
                  </span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.oxygenSufficiencyPct >= 100 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Fresh Oxygen Loop</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.oxygenSufficiencyPct}%</span>
                  <span className="text-[11px] text-stone-600 block">Plants Make Fresh Air</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.netWaterLoopPct >= 95 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Clean Water Loop</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.netWaterLoopPct}%</span>
                  <span className="text-[11px] text-stone-600 block">Dirty Water Cleaned</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.moraleScore >= 65 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Traveler Happiness</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.moraleScore} / 100</span>
                  <span className="text-[11px] text-stone-600 block">Parks &amp; Cozy Rooms</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.withinThbBudget ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Classroom Supply Cost</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.prototypingCostTHB} THB</span>
                  <span className="text-[11px] text-stone-600 block">
                    Budget: 1,500 THB ({biosphereMetrics.withinThbBudget ? 'OK!' : 'Over Budget!'})
                  </span>
                </div>
              </div>

              {buildMode === 'digital-twin' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Week 3 & Week 5–6 Sliders */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Test Your 500-Person Space Farm, Water Recycling &amp; Repair Stations
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Hydroponics (Water) &amp; Aeroponics (Mist) Farm Size (m²)</span>
                          <span className="font-mono font-bold">{hydroponicAreaSqM} m²</span>
                        </div>
                        <input
                          type="range"
                          min={800}
                          max={2400}
                          step={50}
                          value={hydroponicAreaSqM}
                          onChange={(e) => setHydroponicAreaSqM(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Backup Seed Vault &amp; Algae Plant Tanks (Liters)</span>
                          <span className="font-mono font-bold">{algaeBioreactorLiters} L</span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={6000}
                          step={200}
                          value={algaeBioreactorLiters}
                          onChange={(e) => setAlgaeBioreactorLiters(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Dirty Sink &amp; Shower Water Cleaning Machine (%)</span>
                          <span className="font-mono font-bold">{waterRecoveryEfficiencyPct}%</span>
                        </div>
                        <input
                          type="range"
                          min={85}
                          max={99.5}
                          step={0.5}
                          value={waterRecoveryEfficiencyPct}
                          onChange={(e) => setWaterRecoveryEfficiencyPct(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Parks, Schools, Art/Music &amp; Cozy Relaxation Rooms (%)</span>
                          <span className="font-mono font-bold">{restorativeSpacePct}%</span>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={35}
                          step={1}
                          value={restorativeSpacePct}
                          onChange={(e) => setRestorativeSpacePct(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Repair Robot Stations &amp; 3D Spare-Part Printers</span>
                          <span className="font-mono font-bold">{repairDroneBays} Stations</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={repairDroneBays}
                          onChange={(e) => setRepairDroneBays(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Week 3 Recycling Loop Map & Week 7 Blueprint Labels */}
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Recycling Loop Map &amp; Required Week 7 Drawing Labels
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Weeks 3, 5 &amp; 7
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Anyone looking at your Tinkercad/FreeCAD/Blender 3D model or paper blueprints should easily spot these labeled areas:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase block">Label 1 • Space Farms</span>
                        <span className="font-bold text-white">Hydroponics, Aeroponics &amp; Seed Vault</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {hydroponicAreaSqM}m² soil-free farms + food scraps turned into plant compost food + fresh oxygen for 500 people.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-sky-500/30">
                        <span className="font-mono text-[10px] text-sky-400 uppercase block">Label 2 • Water Recycling Loop</span>
                        <span className="font-bold text-white">Water Cleaner &amp; Backup Water Tank</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Cleans {waterRecoveryEfficiencyPct}% of dirty sink and shower water + backup drinking tank next to repair workshop.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30">
                        <span className="font-mono text-[10px] text-amber-400 uppercase block">Label 3 • Repair Tunnels &amp; Engines</span>
                        <span className="font-bold text-white">Repair Robots, 3D Printers &amp; Safety Doors</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {repairDroneBays} robot &amp; 3D-printer stations + emergency air-leak safety doors + spinning motor access.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/30">
                        <span className="font-mono text-[10px] text-purple-400 uppercase block">Label 4 • Living Quarters &amp; Town</span>
                        <span className="font-bold text-white">Bedrooms, Kitchens, Schools, Hospital &amp; Park</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {restorativeSpacePct}% welcoming town spaces with cozy relaxation rooms, exercise machines, and art/music areas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Week 8 Physical Model Supply Budget (in Thai Baht) */
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-indigo-600" />
                        Week 3 &amp; Week 8 Classroom Supply Budget (in Thai Baht) for Our Physical Model
                      </h4>
                      <p className="text-xs text-stone-600">
                        Gather simple craft and building materials like cardboard, foam, plastic bottles, wood sticks, clay, and wire—and add color coding or open &ldquo;cutaway&rdquo; windows!
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      biosphereMetrics.withinThbBudget
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Total Spent: {totalThbCost} / 1,500 THB
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {thbMaterials.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          item.selected
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleMaterial(item.id)}
                            className="mt-0.5 accent-indigo-600"
                          />
                          <div>
                            <div className="font-bold text-stone-900">{item.name}</div>
                            <div className="text-[11px] text-stone-500">Used for: {item.subsystem}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-stone-800">{item.costTHB} THB</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PART 1 (THE 6 SPACE EMERGENCY GAME CARDS) & PART 2 (NEW PLANET RULEBOOK WORKSHEET) */}
          {activeTab === 'crisis-arena' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Part 1: The 6 Space Emergency Game Cards */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-rose-600 font-semibold">
                        Part 1: The Space Emergency Game Cards (Week 9 Testing Activity)
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Draw a Surprise Card (15 Minutes to Solve &amp; Upgrade Your Model!)
                      </h3>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  </div>

                  <div className="space-y-2">
                    {ARK_CRISIS_SCENARIOS.map((crisis) => {
                      const isSelected = crisis.id === selectedCrisis.id;
                      return (
                        <button
                          key={crisis.id}
                          onClick={() => {
                            setSelectedCrisisId(crisis.id);
                            setCrisisActive(true);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-stone-900">{crisis.title}</span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                              {crisis.emergencyTypeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">{crisis.summary}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Card Challenge Box */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-amber-300">{selectedCrisis.title}</span>
                      <button
                        onClick={() => setCrisisActive((prev) => !prev)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                          crisisActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {crisisActive ? 'Card Active on Ship (Reset)' : 'Test Card on Our Ship'}
                      </button>
                    </div>
                    <p className="text-slate-200">
                      <strong>What Happened:</strong> {selectedCrisis.summary}
                    </p>
                    <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-indigo-300 uppercase text-[10px] font-mono">
                        Your Team Challenge (15-Minute Check):
                      </div>
                      <p className="text-slate-200">{selectedCrisis.engineeringPrompt}</p>
                      <p className="text-slate-200">{selectedCrisis.constitutionalPrompt}</p>
                      <p className="text-emerald-300 font-medium">{selectedCrisis.recommendedProtocol}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Ship Upgrade Applied:</label>
                        <select
                          value={engineeringMitigation}
                          onChange={(e) => {
                            setEngineeringMitigation(e.target.value as 'modular-quarantine' | 'drone-overdrive' | 'unprepared');
                            setCrisisActive(true);
                          }}
                          className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white text-[11px]"
                        >
                          <option value="modular-quarantine">Added Safety Doors, Backup Tank/Vault &amp; Cutaway Fix</option>
                          <option value="drone-overdrive">Added Repair Robot Station, 3D Printer &amp; Exercise Gym</option>
                          <option value="unprepared">Not Fixed Yet (Emergency Still Happening!)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Rulebook Response:</label>
                        <select
                          value={constitutionalResponse}
                          onChange={(e) => {
                            setConstitutionalResponse(e.target.value as 'restorative-civic' | 'sunset-compact' | 'authoritarian-lockdown');
                            setCrisisActive(true);
                          }}
                          className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white text-[11px]"
                        >
                          <option value="restorative-civic">Fair Sharing, Cozy Room Schedule &amp; Peaceful Talk</option>
                          <option value="sunset-compact">Temporary 3-Day Water-Saver Rule + Fair Team Vote</option>
                          <option value="authoritarian-lockdown">Unfair / Bossy Rules (People Get Upset!)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Part 2: The New Planet Rulebook Worksheet (Fill-in-the-Blank Template) */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 max-h-[680px] overflow-y-auto">
                  <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-stone-200">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-indigo-600 font-semibold">
                        Part 2: The New Planet Rulebook Worksheet (Weeks 4 &amp; 10)
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Fill-in-the-Blank Colony Rulebook Template
                      </h3>
                    </div>
                    <Scale className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Section 1 */}
                    <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <h4 className="font-bold text-stone-900">1. Our New Home&apos;s Identity</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-stone-600 block">Team Name:</label>
                          <input
                            type="text"
                            value={rulebook.teamName}
                            onChange={(e) => setRulebook({ ...rulebook, teamName: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-600 block">Goldilocks Planet:</label>
                          <input
                            type="text"
                            value={rulebook.planetName}
                            onChange={(e) => setRulebook({ ...rulebook, planetName: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-600 block">First Colony Town:</label>
                          <input
                            type="text"
                            value={rulebook.townName}
                            onChange={(e) => setRulebook({ ...rulebook, townName: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">
                          Our Colony Motto: &ldquo;In our new home, we promise to always...&rdquo;
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          <input
                            type="text"
                            value={rulebook.mottoPromise1}
                            onChange={(e) => setRulebook({ ...rulebook, mottoPromise1: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                          <input
                            type="text"
                            value={rulebook.mottoPromise2}
                            onChange={(e) => setRulebook({ ...rulebook, mottoPromise2: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <h4 className="font-bold text-stone-900">2. Basic Rights for Every Person</h4>
                      <div>
                        <label className="text-[11px] text-stone-600 block">For their body (food, water, shelter, doctor care): Every person gets...</label>
                        <input
                          type="text"
                          value={rulebook.rightsBody}
                          onChange={(e) => setRulebook({ ...rulebook, rightsBody: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">For their mind and feelings (school, rest, fun, safety): Every person has the right to...</label>
                        <input
                          type="text"
                          value={rulebook.rightsMind}
                          onChange={(e) => setRulebook({ ...rulebook, rightsMind: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-stone-600 block">Nobody is allowed to:</label>
                          <input
                            type="text"
                            value={rulebook.treatNeverAllowed}
                            onChange={(e) => setRulebook({ ...rulebook, treatNeverAllowed: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-600 block">Everyone must be treated with:</label>
                          <input
                            type="text"
                            value={rulebook.treatAlwaysWith}
                            onChange={(e) => setRulebook({ ...rulebook, treatAlwaysWith: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <h4 className="font-bold text-stone-900">3. Sharing Jobs and Resources</h4>
                      <div>
                        <label className="text-[11px] text-stone-600 block">How we choose jobs: People will pick their jobs by...</label>
                        <input
                          type="text"
                          value={rulebook.chooseJobsBy}
                          onChange={(e) => setRulebook({ ...rulebook, chooseJobsBy: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">Hard or messy jobs (like cleaning the compost or fixing pipes) will be done by...</label>
                        <input
                          type="text"
                          value={rulebook.messyJobsFairBy}
                          onChange={(e) => setRulebook({ ...rulebook, messyJobsFairBy: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">If we start running low on food, water, or electricity, we will...</label>
                        <input
                          type="text"
                          value={rulebook.runningLowPlan}
                          onChange={(e) => setRulebook({ ...rulebook, runningLowPlan: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <h4 className="font-bold text-stone-900">4. Choosing Our Leaders</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-stone-600 block">In charge while flying on the ship:</label>
                          <input
                            type="text"
                            value={rulebook.leadersOnShip}
                            onChange={(e) => setRulebook({ ...rulebook, leadersOnShip: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-600 block">Once we land, we choose leaders by:</label>
                          <input
                            type="text"
                            value={rulebook.leadersOnPlanetBy}
                            onChange={(e) => setRulebook({ ...rulebook, leadersOnPlanetBy: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">If a leader is being unfair or bossy, the community can replace them by...</label>
                        <input
                          type="text"
                          value={rulebook.replaceUnfairLeaderBy}
                          onChange={(e) => setRulebook({ ...rulebook, replaceUnfairLeaderBy: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Section 5 & 6 */}
                    <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                      <h4 className="font-bold text-stone-900">5. Protecting Nature &amp; 6. Solving Arguments Peacefully</h4>
                      <div>
                        <label className="text-[11px] text-stone-600 block">Our #1 Nature Law (against the law to):</label>
                        <input
                          type="text"
                          value={rulebook.natureLaw1}
                          onChange={(e) => setRulebook({ ...rulebook, natureLaw1: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">Protecting alien plants or animals: If we discover living plants, bugs, or animals, we will...</label>
                        <input
                          type="text"
                          value={rulebook.alienLifeRule}
                          onChange={(e) => setRulebook({ ...rulebook, alienLifeRule: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-stone-600 block">If someone breaks a rule (instead of being mean to them, they help fix their mistake by):</label>
                        <input
                          type="text"
                          value={rulebook.fixMistakeBy}
                          onChange={(e) => setRulebook({ ...rulebook, fixMistakeBy: e.target.value })}
                          className="w-full px-2 py-1 rounded border border-stone-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Section 7 */}
                    <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-200 space-y-2">
                      <h4 className="font-bold text-indigo-950">7. Official Colony Signatures</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={rulebook.signBuilder}
                          onChange={(e) => setRulebook({ ...rulebook, signBuilder: e.target.value })}
                          className="px-2 py-1 rounded border border-indigo-200 bg-white"
                          placeholder="Builder / Engineer Sign-off"
                        />
                        <input
                          type="text"
                          value={rulebook.signScientist}
                          onChange={(e) => setRulebook({ ...rulebook, signScientist: e.target.value })}
                          className="px-2 py-1 rounded border border-indigo-200 bg-white"
                          placeholder="Planet Scientist Sign-off"
                        />
                        <input
                          type="text"
                          value={rulebook.signFarmer}
                          onChange={(e) => setRulebook({ ...rulebook, signFarmer: e.target.value })}
                          className="px-2 py-1 rounded border border-indigo-200 bg-white"
                          placeholder="Farm & Life-Support Sign-off"
                        />
                        <input
                          type="text"
                          value={rulebook.signLeader}
                          onChange={(e) => setRulebook({ ...rulebook, signLeader: e.target.value })}
                          className="px-2 py-1 rounded border border-indigo-200 bg-white"
                          placeholder="Law & Community Leader Sign-off"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOW YOU WILL GROW: WELEARN FUTURE SKILLS GUIDE & SHOWCASE */}
          {activeTab === 'mtc-rubric' && (
            <div className="space-y-6">
              {/* Week 11–12 Big Pitch 4 Parts & What You Need to Hand In */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Week 11–12 Big Pitch (4 Story Parts) &amp; What You Need to Hand In
                    </h3>
                    <span className="text-xs font-mono text-indigo-700 font-semibold">
                      Space Launch Showcase
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'destination', label: 'Part 1: Why we chose our Goldilocks planet and how we will live on its land' },
                      { id: 'vessel', label: 'Part 2: How our spaceship is built, kept safe, and repaired' },
                      { id: 'biosphere', label: 'Part 3: How we grow food and recycle water for 500 people' },
                      { id: 'society', label: 'Part 4: How our new laws and government will work on the planet' }
                    ].map((pillar) => (
                      <label
                        key={pillar.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!pillarsCompleted[pillar.id]}
                          onChange={() =>
                            setPillarsCompleted((prev) => ({ ...prev, [pillar.id]: !prev[pillar.id] }))
                          }
                          className="accent-indigo-600"
                        />
                        <span className="font-medium text-stone-800">{pillar.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
                    <div className="font-bold text-indigo-950">What You Need to Hand In (Two Groups of Work):</div>
                    <p className="text-stone-700">
                      <strong>1. Hands-On Models:</strong> Your physical spaceship and planet terrain model, showing where people live, where food grows, and how engineers fix broken parts.
                    </p>
                    <p className="text-stone-700">
                      <strong>2. Drawings, Plans, and Rules:</strong> Your computer 3D models or paper blueprints, your Food and Recycling Loop Map, and your written New Planet Rulebook.
                    </p>
                  </div>
                </div>

                {/* Unlockable Mission Badges */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      Project Exodus Mission Badges (Click to Claim / Verify)
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {totalEarnedXP} XP Earned
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ARK_GAMIFICATION_BADGES.map((badge) => {
                      const unlocked = unlockedBadges.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => toggleBadge(badge.id)}
                          className={`text-left p-2.5 rounded-lg border transition-all ${
                            unlocked
                              ? 'border-amber-400 bg-amber-50/70 text-stone-900'
                              : 'border-stone-200 bg-stone-50 text-stone-500 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              {badge.icon} {badge.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                              +{badge.xpAward} XP
                            </span>
                          </div>
                          <p className="text-[11px] mt-1 leading-snug">{badge.condition}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* How You Will Grow: WeLearn Future Skills Guide Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">
                      How You Will Grow: WeLearn Future Skills Guide
                    </h3>
                    <p className="text-xs text-slate-400">
                      Instead of regular letter grades, we look at how you grow across seven big life skills during Project Exodus.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-700">
                        <th className="p-3 font-bold w-44">WeLearn Future Skill</th>
                        <th className="p-3 font-bold">Getting Started</th>
                        <th className="p-3 font-bold">Doing Great</th>
                        <th className="p-3 font-bold">Going Above and Beyond</th>
                        <th className="p-3 font-bold w-52">What You Hand In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {ARK_WELEARN_MTC_RUBRIC.map((row) => (
                        <tr key={row.domainId} className="hover:bg-stone-50/80">
                          <td className="p-3 font-bold text-stone-900 align-top">
                            {row.skillTitle}
                            <span className="block text-[10px] font-mono uppercase text-indigo-600 mt-0.5">
                              Domain: {row.domainId.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-stone-600 align-top">{row.emerging}</td>
                          <td className="p-3 text-stone-800 align-top bg-emerald-50/30">{row.proficient}</td>
                          <td className="p-3 text-indigo-950 align-top bg-indigo-50/30 font-medium">{row.advanced}</td>
                          <td className="p-3 text-stone-700 font-mono text-[11px] align-top">{row.evidenceRequired}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-stone-200 px-6 py-3 flex items-center justify-between text-xs text-stone-600">
          <div>
            <strong>Our New Home:</strong> {selectedPlanet.name} • {selectedPropulsion.name} • Town: {rulebook.townName}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
