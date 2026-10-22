/**
 * Interactive Interstellar Ark & Exoplanet Civilization Simulator + Gamification Hub
 * Branch: DonPBL
 * Location: prototypes/DonPBL/ui/components/InterstellarArkSimulator.tsx
 *
 * Implements the simulation & gamification sandbox for "Engineering Humanity's Next Horizon":
 * - Tab 1: Goldilocks Exoplanet Reconnaissance & Centrifuge/Propulsion Configurator
 * - Tab 2: Digital Twin Vessel Builder & 500-Colonist Closed-Loop ECLSS Sandbox + 1,500 THB Physical Model Ledger
 * - Tab 3: Red-Team Stochastic Crisis & Constitutional Stress-Test Arena (40% Crop Blight, Bearing Seizure, Landing Strike)
 * - Tab 4: WeLearn 7 Future Skills MTC Rubric & 4-Pillar United Earth Exodus Council Pitch Builder
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
  { id: 'mat-pvc', name: 'PVC Axial Spine Pipe & Fittings (1m)', subsystem: 'Zero-G Reactor & Docking Spine', costTHB: 220, selected: true },
  { id: 'mat-eva', name: 'High-Density EVA Foam Sheets (x4)', subsystem: 'Counter-Rotating Centrifuge Rings', costTHB: 340, selected: true },
  { id: 'mat-cardboard', name: 'Double-Wall Corrugated Cardboard & Ribs', subsystem: 'Exoplanet Terrain Contours & Hull Bulkheads', costTHB: 180, selected: true },
  { id: 'mat-balsa', name: 'Balsa Wood Trusses & Dowel Struts', subsystem: 'Internal Deck Framing & Centrifuge Spokes', costTHB: 260, selected: true },
  { id: 'mat-pet', name: 'Recycled Clear PET Cutaway Windows', subsystem: 'Hydroponic Bay & Storm Shelter Cutaways', costTHB: 120, selected: true },
  { id: 'mat-markers', name: 'Color-Coded Zoning Pins & Acrylic Callouts', subsystem: 'Subsystem Labels (ECLSS, Airlocks, Drone Bays)', costTHB: 190, selected: true },
  { id: 'mat-led', name: 'Optional Coin-Cell LED Circadian Strip', subsystem: 'Biophilic Day/Night Dome Illumination', costTHB: 160, selected: false },
  { id: 'mat-motor', name: 'Optional Geared 5V DC Spin Demo Motor', subsystem: 'Motorized Centrifuge Rotation Rig', costTHB: 280, selected: false }
];

export const InterstellarArkSimulator: React.FC<InterstellarArkSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'exoplanet' | 'digital-twin' | 'crisis-arena' | 'mtc-rubric'>('exoplanet');
  const [buildMode, setBuildMode] = useState<'digital-twin' | 'physical-1500thb'>('digital-twin');

  // Tab 1 state: Exoplanet & Propulsion
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>(EXOPLANET_CANDIDATES[0].id);
  const [selectedPropulsionId, setSelectedPropulsionId] = useState<string>(ARK_PROPULSION_OPTIONS[0].id);

  // Tab 2 state: 500-Colonist ECLSS & Spatial Zoning parameters
  const [hydroponicAreaSqM, setHydroponicAreaSqM] = useState<number>(1650);
  const [algaeBioreactorLiters, setAlgaeBioreactorLiters] = useState<number>(3200);
  const [waterRecoveryEfficiencyPct, setWaterRecoveryEfficiencyPct] = useState<number>(98.5);
  const [restorativeSpacePct, setRestorativeSpacePct] = useState<number>(22);
  const [repairDroneBays, setRepairDroneBays] = useState<number>(6);
  const [thbMaterials, setThbMaterials] = useState<ThbMaterialItem[]>(INITIAL_THB_MATERIALS);

  // Tab 3 state: Red-Team Crisis & Constitutional Stress-Test
  const [selectedCrisisId, setSelectedCrisisId] = useState<string>(ARK_CRISIS_SCENARIOS[0].id);
  const [crisisActive, setCrisisActive] = useState<boolean>(false);
  const [engineeringMitigation, setEngineeringMitigation] = useState<'modular-quarantine' | 'drone-overdrive' | 'unprepared'>('modular-quarantine');
  const [constitutionalResponse, setConstitutionalResponse] = useState<'restorative-civic' | 'sunset-compact' | 'authoritarian-lockdown'>('restorative-civic');

  // Tab 4 state: 4-Pillar Pitch readiness & Gamification Badges
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

  // Compute effective shocks when a crisis is active in Tab 3
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
        : +18; // authoritarian lockdown worsens morale shock

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
    const title = `Interstellar Ark Digital Twin & ECLSS Report (${selectedPlanet.name})`;
    const notes = [
      `Destination Exoplanet: ${selectedPlanet.name} (${selectedPlanet.distanceLightYears} ly, ${selectedPlanet.surfaceGravityG}g, ${selectedPlanet.tidalLockingStatus})`,
      `Vessel Architecture: ${selectedPropulsion.name} (${selectedPropulsion.simulatedGravityG}g at ${selectedPropulsion.rotationRpm} RPM, ${selectedPropulsion.hullShieldingSpec})`,
      `500-Colonist Closed-Loop ECLSS: ${biosphereMetrics.dailyKcalProduced.toLocaleString()} / ${biosphereMetrics.targetDailyKcal.toLocaleString()} kcal/day (${biosphereMetrics.caloricSufficiencyPct}% caloric sufficiency), ${biosphereMetrics.oxygenSufficiencyPct}% O2 loop, ${biosphereMetrics.netWaterLoopPct}% water recovery, Morale ${biosphereMetrics.moraleScore}/100`,
      `Classroom Physical Model Budget: ${biosphereMetrics.prototypingCostTHB} / 1,500 THB (${biosphereMetrics.withinThbBudget ? 'Within Cap' : 'Over Cap'})`,
      `Red-Team Crisis Tested: ${selectedCrisis.title} | Mitigation: ${engineeringMitigation} | Constitutional Response: ${constitutionalResponse}`,
      `Gamification Progress: Level ${currentLevel.level} (${currentLevel.title}) • ${totalEarnedXP} XP • ${unlockedBadges.length}/7 Badges`
    ].join('\n');

    onSaveToPortfolio(title, notes);
    setSavedBanner(`Saved "${title}" to your Evidence Portfolio!`);
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
                  Interstellar Ark & Exoplanet Civilization Digital Twin Simulator
                </h2>
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                  Level {currentLevel.level}: {currentLevel.title} ({totalEarnedXP} XP)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineering Humanity&apos;s Next Horizon • 500-Colonist Closed-Loop ECLSS, 1,500 THB Scale Model Planner &amp; Red-Team Crisis Arena
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
              1. Goldilocks &amp; Propulsion
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
              2. Digital Twin ECLSS &amp; 1,500 THB Build
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
              3. Red-Team &amp; Constitutional Crisis Arena
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
              4. MTC 7 Future Skills &amp; Badges ({unlockedBadges.length}/7)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Save Digital Twin to Portfolio
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
          {/* TAB 1: GOLDILOCKS EXOPLANET & PROPULSION CONFIGURATOR */}
          {activeTab === 'exoplanet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exoplanet Selector */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                        Phase 1 (Weeks 1–2) • NASA Exoplanet Archive
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Select Target Goldilocks Exoplanet
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
                          onClick={() => setSelectedPlanetId(planet.id)}
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
                            Gravity: <strong>{planet.surfaceGravityG}g</strong> • Flux: <strong>{planet.stellarFluxEarthRatio}x Earth</strong>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {planet.tidalLockingStatus}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Planet Dossier Card */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-sm text-indigo-300">
                        Reconnaissance Dossier: {selectedPlanet.name} ({selectedPlanet.constellation})
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Radiation Hazard: {selectedPlanet.radiationHazardIndex}/10
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block">Star Type</span>
                        <span>{selectedPlanet.starType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Orbital Period</span>
                        <span>{selectedPlanet.orbitalPeriodDays} Earth days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Equilibrium Temp</span>
                        <span>{selectedPlanet.equilibriumTempC}°C</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <strong className="text-white">Terrain &amp; Atmosphere:</strong> {selectedPlanet.terrainAndAtmosphere}
                    </p>
                    <p className="text-emerald-300 leading-relaxed">
                      <strong>Colonization Advantage:</strong> {selectedPlanet.colonizationAdvantage}
                    </p>
                    <p className="text-amber-300 leading-relaxed">
                      <strong>Primary Engineering Challenge:</strong> {selectedPlanet.primaryEngineeringChallenge}
                    </p>
                  </div>
                </div>

                {/* Propulsion & Artificial Gravity Configurator */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-semibold">
                        Phase 3 (Weeks 5–6) • Vessel Architecture
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Propulsion &amp; Artificial Gravity Centrifuge
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
                              {opt.cruiseVelocityPercentC}% c
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1">
                            Ring Radius: <strong>{opt.ringRadiusMeters}m</strong> @ <strong>{opt.rotationRpm} RPM</strong> → <strong>{opt.simulatedGravityG}g</strong>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Shielding: {opt.hullShieldingSpec}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Physics & Human Factor Telemetry Box */}
                  <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 space-y-3 text-xs">
                    <div className="font-bold text-stone-900 flex items-center justify-between">
                      <span>Computed Multi-Generational Transit Telemetry</span>
                      <span className="font-mono text-indigo-700">
                        a_c = ω²r = {selectedPropulsion.simulatedGravityG}g
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block">Artificial Gravity</span>
                        <span className="text-sm font-bold text-stone-900">{selectedPropulsion.simulatedGravityG}g</span>
                        <span className="text-[10px] text-emerald-700 block">Prevents bone loss</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block">Centrifuge Spin</span>
                        <span className="text-sm font-bold text-stone-900">{selectedPropulsion.rotationRpm} RPM</span>
                        <span className="text-[10px] text-emerald-700 block">&lt; 3 RPM Coriolis safe</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block">Power Output</span>
                        <span className="text-sm font-bold text-stone-900">{selectedPropulsion.powerOutputGW} GW</span>
                        <span className="text-[10px] text-stone-600 block">ECLSS + Propulsion</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <span className="text-[10px] uppercase text-stone-500 block">Maintenance Load</span>
                        <span className="text-sm font-bold text-stone-900">{selectedPropulsion.maintenanceComplexity}</span>
                        <span className="text-[10px] text-stone-600 block">100-Yr Drone Spec</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL TWIN VESSEL BUILDER & 1,500 THB PHYSICAL MODEL PLANNER */}
          {activeTab === 'digital-twin' && (
            <div className="space-y-6">
              {/* Toggle between Digital Twin Simulation & 1,500 THB Physical Scale Model */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-indigo-600 font-semibold">
                    Dual-Fidelity Deliverable Framework (Weeks 3–4 &amp; 7–8)
                  </span>
                  <h3 className="text-sm font-bold text-stone-900">
                    Choose Prototyping Mode: Interactive Digital Twin vs. 1,500 THB Physical Scale Model
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
                    Digital Twin &amp; 500-Colonist ECLSS
                  </button>
                  <button
                    onClick={() => setBuildMode('physical-1500thb')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      buildMode === 'physical-1500thb'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    1,500 THB Physical Model &amp; Cutaway Planner
                  </button>
                </div>
              </div>

              {/* Live Telemetry Dashboard Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.caloricSufficiencyPct >= 100 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Daily Caloric Yield</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.caloricSufficiencyPct}%</span>
                  <span className="text-[11px] text-stone-600 block">
                    {biosphereMetrics.dailyKcalProduced.toLocaleString()} / 1.25M kcal
                  </span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.oxygenSufficiencyPct >= 100 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">O₂ / CO₂ Closed Loop</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.oxygenSufficiencyPct}%</span>
                  <span className="text-[11px] text-stone-600 block">500 Colonist Respiration</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.netWaterLoopPct >= 95 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Water Recovery</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.netWaterLoopPct}%</span>
                  <span className="text-[11px] text-stone-600 block">Target &ge; 95% ECLSS</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.moraleScore >= 65 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Crew Morale &amp; Safety</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.moraleScore} / 100</span>
                  <span className="text-[11px] text-stone-600 block">Spatial &amp; Civic Index</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${biosphereMetrics.withinThbBudget ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className="text-[11px] font-mono uppercase text-stone-500 block">Classroom Build Cost</span>
                  <span className="text-lg font-bold text-stone-900">{biosphereMetrics.prototypingCostTHB} THB</span>
                  <span className="text-[11px] text-stone-600 block">
                    Cap: 1,500 THB ({biosphereMetrics.withinThbBudget ? 'OK' : 'Over Cap!'})
                  </span>
                </div>
              </div>

              {buildMode === 'digital-twin' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ECLSS & Spatial Sliders */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      500-Colonist Closed-Loop ECLSS &amp; Spatial Zoning Controls
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>Aeroponic &amp; Hydroponic Crop Decks (m²)</span>
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
                          <span>Spirulina Algae Photobioreactor Volume (Liters)</span>
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
                          <span>ECLSS Vapor-Compression Water Recovery (%)</span>
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
                          <span>Communal Restorative &amp; Biophilic Park Allocation (%)</span>
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
                          <span>Automated Mid-Flight Repair Drone &amp; Foundry Bays</span>
                          <span className="font-mono font-bold">{repairDroneBays} Bays</span>
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

                  {/* 6-Sector Orthographic Cross-Section Digital Twin Map */}
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Digital Twin 6-Sector Spatial Zoning &amp; Cutaway Callouts
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Activity 5.2 &amp; 7.2
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Required Blueprint Callouts: Hydroponic Bays, Airlocks, Maintenance Corridors, Centrifuge Joints &amp; Command Modules.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase block">Sector 01 • Ring A/B</span>
                        <span className="font-bold text-white">Hydroponic &amp; Algae Biomes</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {hydroponicAreaSqM}m² vertical aeroponics + {algaeBioreactorLiters}L Spirulina reactors.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-sky-500/30">
                        <span className="font-mono text-[10px] text-sky-400 uppercase block">Sector 02 • Core Buffer</span>
                        <span className="font-bold text-white">ECLSS Water Shield &amp; Airlocks</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {waterRecoveryEfficiencyPct}% closed-loop distillation + concentric storm shelter.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30">
                        <span className="font-mono text-[10px] text-amber-400 uppercase block">Sector 03 • Axial Hub</span>
                        <span className="font-bold text-white">Centrifuge Joints &amp; Drone Bays</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {repairDroneBays} autonomous metal-sintering repair bays &amp; rotary pressure seals.
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/30">
                        <span className="font-mono text-[10px] text-purple-400 uppercase block">Sector 04 • Habitat Arc</span>
                        <span className="font-bold text-white">Residential &amp; Restorative Commons</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {restorativeSpacePct}% circadian park domes, medical bay, and acoustic micro-cabins.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 1,500 THB Low-Fidelity Physical Model & Cutaway Planner */
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-indigo-600" />
                        Week 8 Low-Fidelity Physical Scale Model &amp; Terrain Slice Planner (1,500 THB Cap)
                      </h4>
                      <p className="text-xs text-stone-600">
                        Select low-cost classroom materials to build your scale spacecraft, exoplanet terrain slice, and color-coded maintenance cutaways.
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      biosphereMetrics.withinThbBudget
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Total: {totalThbCost} / 1,500 THB
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
                            <div className="text-[11px] text-stone-500">Maps to: {item.subsystem}</div>
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

          {/* TAB 3: RED-TEAM STOCHASTIC CRISIS & CONSTITUTIONAL TRIAL ARENA */}
          {activeTab === 'crisis-arena' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crisis Selector */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-rose-600 font-semibold">
                        Phase 5 (Weeks 9–10) • Red-Team Stress-Testing
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Trigger a Stochastic Deep-Space or Landing Crisis
                      </h3>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  </div>

                  <div className="space-y-2.5">
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
                              Week {crisis.weekTrigger} • {crisis.severity}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">{crisis.summary}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Engineering & Constitutional Mitigation Controls */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-indigo-600 font-semibold">
                        Dual Engineering &amp; Legal Response
                      </span>
                      <h3 className="text-base font-bold text-stone-900">
                        Test Your Maintenance Protocol &amp; Colonial Charter
                      </h3>
                    </div>
                    <Scale className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-stone-800 block mb-1">
                        1. Engineering &amp; Maintenance Protocol (Activity 9.2):
                      </label>
                      <select
                        value={engineeringMitigation}
                        onChange={(e) => {
                          setEngineeringMitigation(e.target.value as 'modular-quarantine' | 'drone-overdrive' | 'unprepared');
                          setCrisisActive(true);
                        }}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-medium text-stone-900"
                      >
                        <option value="modular-quarantine">
                          Modular Sector Quarantine + Spirulina Photobioreactor Surge (+65% Backup O2/kcal)
                        </option>
                        <option value="drone-overdrive">
                          Autonomous Repair Drone Overdrive + Mid-Flight Spare Bearing Fabrication
                        </option>
                        <option value="unprepared">
                          No Redundancy / Single-Point Failure Exposed (Unmitigated Shock)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-800 block mb-1">
                        2. Colonial Charter Constitutional Framework (Activity 10.1 &amp; 10.2):
                      </label>
                      <select
                        value={constitutionalResponse}
                        onChange={(e) => {
                          setConstitutionalResponse(e.target.value as 'restorative-civic' | 'sunset-compact' | 'authoritarian-lockdown');
                          setCrisisActive(true);
                        }}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-medium text-stone-900"
                      >
                        <option value="restorative-civic">
                          Restorative Citizen Jury + Equal Caloric Solidarity &amp; Cross-Guild Rotation
                        </option>
                        <option value="sunset-compact">
                          Automatic 30-Day Transit Martial Law Sunset Clause + Transparent Ration Audit
                        </option>
                        <option value="authoritarian-lockdown">
                          Permanent Command Martial Lockdown (Risk of Authoritarian Collapse / Mutiny)
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setCrisisActive((prev) => !prev)}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${
                          crisisActive
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {crisisActive ? 'Crisis Simulation Active (Click to Reset to Nominal)' : 'Run Stochastic Crisis Stress-Test'}
                      </button>
                    </div>

                    {/* Crisis Outcome Report */}
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300">
                          Red-Team Survival Margin &amp; Constitutional Verdict
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          biosphereMetrics.isSelfSustaining && constitutionalResponse !== 'authoritarian-lockdown'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {biosphereMetrics.isSelfSustaining && constitutionalResponse !== 'authoritarian-lockdown'
                            ? 'SURVIVED & PEACEFULLY RESOLVED'
                            : 'ITERATION REQUIRED'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        <strong>Engineering Prompt:</strong> {selectedCrisis.engineeringPrompt}
                      </p>
                      <p className="text-slate-300 text-[11px]">
                        <strong>Constitutional Prompt:</strong> {selectedCrisis.constitutionalPrompt}
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                        <div className="bg-slate-950 p-2 rounded">
                          <span className="text-slate-400 block">Post-Shock Kcal</span>
                          <span className={biosphereMetrics.caloricSufficiencyPct >= 100 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {biosphereMetrics.caloricSufficiencyPct}%
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded">
                          <span className="text-slate-400 block">Water Loop</span>
                          <span className={biosphereMetrics.netWaterLoopPct >= 95 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {biosphereMetrics.netWaterLoopPct}%
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded">
                          <span className="text-slate-400 block">Civic Morale</span>
                          <span className={biosphereMetrics.moraleScore >= 65 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {biosphereMetrics.moraleScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WELEARN 7 FUTURE SKILLS MTC RUBRIC & GAMIFICATION BADGES */}
          {activeTab === 'mtc-rubric' && (
            <div className="space-y-6">
              {/* 4-Pillar Exodus Council Pitch Checklist & Badges */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Week 11–12 United Earth Exodus Council 4-Pillar Pitch Checklist
                    </h3>
                    <span className="text-xs font-mono text-indigo-700 font-semibold">
                      10-Min Pitch + 5-Min Q&amp;A
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { id: 'destination', label: '1. The Destination: Scientific justification of Goldilocks planet, terrain & adaptation strategy' },
                      { id: 'vessel', label: '2. The Vessel: Engineering walkthrough, spatial zoning for well-being & 100-year maintenance' },
                      { id: 'biosphere', label: '3. The Biosphere: Proof of closed-loop 500-colonist food production & resource sustainability' },
                      { id: 'society', label: '4. The New Society: Defense of political philosophy, governance & constitutional laws' }
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
                </div>

                {/* Unlockable Mission Badges */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      Mission Gamification Badges (Click to Claim / Verify)
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

              {/* WeLearn 7 Future Skills MTC Rubric Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">
                      Assessment Rubric: WeLearn 7 Future Skills Framework (Mastery Transcript Consortium Aligned)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluated on demonstrated evidence across the Evidence Folder and 15-Minute Showcase Pitch rather than traditional letter grades.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-700">
                        <th className="p-3 font-bold w-44">WeLearn Future Skill</th>
                        <th className="p-3 font-bold">Emerging (Developing Foundation)</th>
                        <th className="p-3 font-bold">Proficient (Meets Mastery Standard)</th>
                        <th className="p-3 font-bold">Advanced (Exceeds Mastery / Transferable)</th>
                        <th className="p-3 font-bold w-52">Project Evidence Required</th>
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
            <strong>Selected Mission:</strong> {selectedPlanet.name} • {selectedPropulsion.name}
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
