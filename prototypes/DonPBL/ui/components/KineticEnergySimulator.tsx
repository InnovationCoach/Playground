import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileCheck,
  MapPin,
  TrendingUp,
  Sliders,
  Activity,
  Users
} from 'lucide-react';
import {
  KINETIC_TRANSDUCER_OPTIONS,
  KINETIC_SITE_BOTTLENECKS,
  KINETIC_DELIVERABLES,
  KINETIC_WELEARN_SKILLS_TABLE,
  KINETIC_GAMIFICATION_BADGES,
  simulateKineticHarvesting
} from '../pbl';

interface KineticEnergySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const KineticEnergySimulator: React.FC<KineticEnergySimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'rectifier' | 'retrofit' | 'roi' | 'rubric'>('rectifier');

  // Shared engineering parameters
  const [selectedTransducerId, setSelectedTransducerId] = useState<string>(KINETIC_TRANSDUCER_OPTIONS[0].id);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(KINETIC_SITE_BOTTLENECKS[0].id);
  const [diodeType, setDiodeType] = useState<'schottky-1n5819' | 'silicon-1n4007'>('schottky-1n5819');
  const [capacitorMicrofarads, setCapacitorMicrofarads] = useState<number>(1000);
  const [tileCount, setTileCount] = useState<number>(KINETIC_SITE_BOTTLENECKS[0].recommendedTileCount);
  const [dailyFootstepsPerTile, setDailyFootstepsPerTile] = useState<number>(
    KINETIC_SITE_BOTTLENECKS[0].dailyFootstepsPerTile
  );
  const [surfaceTempDeltaC, setSurfaceTempDeltaC] = useState<number>(
    KINETIC_SITE_BOTTLENECKS[0].surfaceTempDeltaC
  );
  const [verticalDeflectionMm, setVerticalDeflectionMm] = useState<number>(
    KINETIC_TRANSDUCER_OPTIONS[0].verticalDeflectionMm
  );
  const [deploymentScale, setDeploymentScale] = useState<'prototype-1' | 'pilot-100' | 'city-10000'>('pilot-100');
  const [includeSmartSensorCoBenefit, setIncludeSmartSensorCoBenefit] = useState<boolean>(true);

  // Blueprint checklist state (Deliverable #2: 3-Panel A1/Arch D Sheet)
  const [checkedBlueprintItems, setCheckedBlueprintItems] = useState<Record<string, boolean>>({
    'p1-exploded': true,
    'p1-deflection': true,
    'p1-ip65': true,
    'p2-bridge': true,
    'p2-capacitor': true,
    'p2-telemetry': true,
    'p3-heatmap': true,
    'p3-routing': false,
    'p3-maintenance': false
  });

  // Pod roles state
  const [podLeadAssignments, setPodLeadAssignments] = useState<Record<string, string>>({
    mechanical: 'Mechanical & CAD Lead (Tile Suspension, <5mm Deflection, IP67 Gasket)',
    electrical: 'Electrical & Power Conditioning Lead (1N5819 Schottky Bridge, Supercapacitor, INA219)',
    urban: 'Urban Systems & Telemetry Lead (ToF Counter, OLED Watt-Meter, Honest ROI)'
  });

  // Claimed badges state
  const [claimedBadges, setClaimedBadges] = useState<string[]>([
    KINETIC_GAMIFICATION_BADGES[0]?.id || 'badge-human-watt',
    KINETIC_GAMIFICATION_BADGES[1]?.id || 'badge-lossless-rectifier'
  ]);

  const selectedTransducer = useMemo(
    () => KINETIC_TRANSDUCER_OPTIONS.find((t) => t.id === selectedTransducerId) || KINETIC_TRANSDUCER_OPTIONS[0],
    [selectedTransducerId]
  );

  const selectedSite = useMemo(
    () => KINETIC_SITE_BOTTLENECKS.find((s) => s.id === selectedSiteId) || KINETIC_SITE_BOTTLENECKS[0],
    [selectedSiteId]
  );

  const activeUnitCostUSD =
    deploymentScale === 'prototype-1'
      ? selectedTransducer.unitPrototypeBomUSD
      : deploymentScale === 'pilot-100'
      ? selectedTransducer.bulk100UnitCostUSD
      : selectedTransducer.bulk10000UnitCostUSD;

  // Compare Schottky vs Silicon side-by-side for Activity 2.2
  const schottkyResult = useMemo(
    () =>
      simulateKineticHarvesting({
        joulesPerStepRaw: selectedTransducer.joulesPerFootstepOrCycle,
        dailyFootstepsPerTile,
        tileCount,
        surfaceTempDeltaC,
        diodeType: 'schottky-1n5819',
        capacitorMicrofarads,
        verticalDeflectionMm,
        unitCostUSD: activeUnitCostUSD,
        deploymentScale,
        includeSmartSensorCoBenefit
      }),
    [
      selectedTransducer.joulesPerFootstepOrCycle,
      dailyFootstepsPerTile,
      tileCount,
      surfaceTempDeltaC,
      capacitorMicrofarads,
      verticalDeflectionMm,
      activeUnitCostUSD,
      deploymentScale,
      includeSmartSensorCoBenefit
    ]
  );

  const siliconResult = useMemo(
    () =>
      simulateKineticHarvesting({
        joulesPerStepRaw: selectedTransducer.joulesPerFootstepOrCycle,
        dailyFootstepsPerTile,
        tileCount,
        surfaceTempDeltaC,
        diodeType: 'silicon-1n4007',
        capacitorMicrofarads,
        verticalDeflectionMm,
        unitCostUSD: activeUnitCostUSD,
        deploymentScale,
        includeSmartSensorCoBenefit
      }),
    [
      selectedTransducer.joulesPerFootstepOrCycle,
      dailyFootstepsPerTile,
      tileCount,
      surfaceTempDeltaC,
      capacitorMicrofarads,
      verticalDeflectionMm,
      activeUnitCostUSD,
      deploymentScale,
      includeSmartSensorCoBenefit
    ]
  );

  const activeSim = diodeType === 'schottky-1n5819' ? schottkyResult : siliconResult;

  // Energy-only comparison (without smart sensor co-benefit) for Honest ROI contrast
  const energyOnlySim = useMemo(
    () =>
      simulateKineticHarvesting({
        joulesPerStepRaw: selectedTransducer.joulesPerFootstepOrCycle,
        dailyFootstepsPerTile,
        tileCount,
        surfaceTempDeltaC,
        diodeType,
        capacitorMicrofarads,
        verticalDeflectionMm,
        unitCostUSD: activeUnitCostUSD,
        deploymentScale,
        includeSmartSensorCoBenefit: false
      }),
    [
      selectedTransducer.joulesPerFootstepOrCycle,
      dailyFootstepsPerTile,
      tileCount,
      surfaceTempDeltaC,
      diodeType,
      capacitorMicrofarads,
      verticalDeflectionMm,
      activeUnitCostUSD,
      deploymentScale
    ]
  );

  if (!isOpen) return null;

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    const found = KINETIC_SITE_BOTTLENECKS.find((s) => s.id === siteId);
    if (found) {
      setDailyFootstepsPerTile(found.dailyFootstepsPerTile);
      setSurfaceTempDeltaC(found.surfaceTempDeltaC);
      setTileCount(found.recommendedTileCount);
    }
  };

  const handleTransducerChange = (id: string) => {
    setSelectedTransducerId(id);
    const found = KINETIC_TRANSDUCER_OPTIONS.find((t) => t.id === id);
    if (found) {
      setVerticalDeflectionMm(found.verticalDeflectionMm);
    }
  };

  const toggleBadge = (badgeId: string) => {
    setClaimedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const toggleBlueprintItem = (key: string) => {
    setCheckedBlueprintItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const blueprintCheckedCount = Object.values(checkedBlueprintItems).filter(Boolean).length;
  const totalXp = KINETIC_GAMIFICATION_BADGES.filter((b) => claimedBadges.includes(b.id)).reduce(
    (sum, b) => sum + b.xpAward,
    0
  );

  const handleSaveEvidence = () => {
    if (!onSaveToPortfolio) return;
    const title = `Kinetic & Smart Energy Lab: ${selectedSite.name} (${selectedTransducer.name})`;
    const summary = [
      `Site Bottleneck: ${selectedSite.name} (${dailyFootstepsPerTile.toLocaleString()} footsteps/tile/day across ${tileCount} tiles; ΔT=${surfaceTempDeltaC}°C).`,
      `Transducer & Mechanics: ${selectedTransducer.name} (${selectedTransducer.mechanism}) with ${verticalDeflectionMm}mm vertical deflection (${activeSim.adaTripFreeSafe ? 'PASSES <5mm ADA trip-free safety rule' : 'EXCEEDS 5mm trip-hazard limit'}).`,
      `Power Conditioning (Activity 2.2): ${diodeType === 'schottky-1n5819' ? '1N5819 Schottky Bridge (88% efficiency)' : '1N4007 Silicon Bridge (68% efficiency)'} -> ${activeSim.netJoulesPerStep} J/step; 50-step ${capacitorMicrofarads}uF capacitor reaches ${activeSim.capacitorVoltage50Steps}V (${activeSim.energy50StepsJoules} J).`,
      `Daily & Annual Harvest: ${activeSim.totalDailyJoules.toLocaleString()} J/day (${activeSim.totalDailyWattHours} Wh/day; ${activeSim.annualKwh} kWh/yr).`,
      `Honest ROI Audit (Activity 5.2): BOM @ ${deploymentScale} = $${activeUnitCostUSD}/tile ($${activeSim.totalHardwareCapexUSD} total CAPEX); Direct energy savings = $${activeSim.annualDirectEnergySavingsUSD}/yr; Batteryless IoT Sensor Co-Benefit = $${activeSim.annualSensorCoBenefitUSD}/yr -> Payback = ${activeSim.estimatedPaybackYears} yrs.`,
      `3-Panel A1 Blueprint Progress: ${blueprintCheckedCount}/9 callouts verified | XP Earned: ${totalXp} XP.`
    ].join('\n');

    onSaveToPortfolio(title, summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-6xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Smart Cities &amp; Adaptive Infrastructure: Kinetic &amp; Smart Energy Harvesting Lab
                </h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  12 Weeks · 120 Hours
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Piezoelectric &amp; Electromagnetic Floor Tiles · Peltier ΔT Harvesting · 1N5819 Schottky Bridge · Honest ROI &amp; 3-Panel A1 Blueprint
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-800 border border-stone-700 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>{totalXp} XP</span>
              <span className="text-stone-400">({claimedBadges.length}/{KINETIC_GAMIFICATION_BADGES.length} Badges)</span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close Kinetic Energy Simulator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 px-6 py-2 border-b border-stone-200 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('rectifier')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'rectifier'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1. Physics &amp; &quot;Lossless&quot; Rectifier Lab
          </button>

          <button
            onClick={() => setActiveTab('retrofit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'retrofit'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            2. Site Heatmap &amp; 3-Panel A1 Blueprint
          </button>

          <button
            onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'roi'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            3. 1,000-Step Stress Test &amp; &quot;Honest ROI&quot;
          </button>

          <button
            onClick={() => setActiveTab('rubric')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'rubric'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            4. 3 Core Deliverables, WeLearn Skills &amp; Badges
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/60">
          {/* TAB 1: PHYSICS OF AMBIENT ENERGY & LOSSLESS RECTIFIER LAB */}
          {activeTab === 'rectifier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Transducer & Bridge Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      Activity 1.1 &amp; 1.2: Select Harvester Transducer
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500">
                      BOM: ${selectedTransducer.unitPrototypeBomUSD} (1x)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {KINETIC_TRANSDUCER_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTransducerChange(t.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedTransducerId === t.id
                            ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{t.name}</span>
                          <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            {t.openCircuitPeakV}V peak · {t.joulesPerFootstepOrCycle} J/step
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">{t.bestUseCase}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity 2.2: Diode Rectifier Switcher */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                    Activity 2.2: The &quot;Lossless&quot; Rectifier Lab
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Piezoelectric &amp; electromagnetic harvesters output short AC voltage spikes. Compare a standard 1N4007 Silicon full-wave bridge against a low-drop 1N5819 Schottky bridge charging a <code className="font-mono bg-stone-100 px-1 rounded">{capacitorMicrofarads}µF</code> storage capacitor over 50 footsteps.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setDiodeType('schottky-1n5819')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        diodeType === 'schottky-1n5819'
                          ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-950">1N5819 Schottky Bridge</div>
                      <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                        ~0.25V drop/diode (88% eff.)
                      </div>
                      <div className="text-[11px] text-stone-600 mt-1">
                        Minimizes forward diode losses on low-current pulses.
                      </div>
                    </button>

                    <button
                      onClick={() => setDiodeType('silicon-1n4007')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        diodeType === 'silicon-1n4007'
                          ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-600'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-stone-900">1N4007 Silicon Bridge</div>
                      <div className="text-[11px] font-mono text-rose-700 mt-0.5">
                        ~0.70V drop/diode (68% eff.)
                      </div>
                      <div className="text-[11px] text-stone-600 mt-1">
                        High forward voltage drop wastes low-voltage energy.
                      </div>
                    </button>
                  </div>

                  {/* Mechanical Deflection, Capacitor & ΔT Sliders */}
                  <div className="pt-2 space-y-3 border-t border-stone-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">
                          Tile Mechanical Deflection (ADA Trip Limit &lt; 5.0 mm)
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            activeSim.adaTripFreeSafe ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {verticalDeflectionMm.toFixed(1)} mm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.0}
                        max={8.0}
                        step={0.5}
                        value={verticalDeflectionMm}
                        onChange={(e) => setVerticalDeflectionMm(parseFloat(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">
                          Storage Capacitor Bank (<code className="font-mono">µF</code>)
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          {capacitorMicrofarads.toLocaleString()} µF
                        </span>
                      </div>
                      <input
                        type="range"
                        min={470}
                        max={4700}
                        step={100}
                        value={capacitorMicrofarads}
                        onChange={(e) => setCapacitorMicrofarads(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">
                          Surface-to-Ambient Thermal Gradient (&Delta;T for Peltier)
                        </span>
                        <span className="font-mono font-bold text-amber-700">
                          {surfaceTempDeltaC.toFixed(1)} &deg;C
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={1}
                        value={surfaceTempDeltaC}
                        onChange={(e) => setSurfaceTempDeltaC(parseFloat(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Physics & 50-Step Capacitor Bench Results */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        50-Footstep Capacitor Charge Test (<code className="font-mono text-xs">C = {capacitorMicrofarads}µF, E = ½CV²</code>)
                      </h3>
                      <p className="text-xs text-stone-500">
                        Direct comparison between 1N5819 Schottky and 1N4007 Silicon bridges on {selectedTransducer.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        activeSim.adaTripFreeSafe
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {activeSim.adaTripFreeSafe ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ADA Trip-Free (&lt;5mm)
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Trip Hazard (&ge;5mm!)
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">
                          1N5819 Schottky Bridge
                        </span>
                        <span className="text-[11px] font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                          Efficiency: {schottkyResult.rectifierEfficiencyPct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="text-[11px] text-emerald-800">Net Energy / Step</div>
                          <div className="text-lg font-bold font-mono text-emerald-950">
                            {schottkyResult.netJoulesPerStep} J
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-emerald-800">50-Step Cap Voltage</div>
                          <div className="text-lg font-bold font-mono text-emerald-950">
                            {schottkyResult.capacitorVoltage50Steps} V
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-emerald-900 pt-1 border-t border-emerald-200/60">
                        Stored Energy (50 steps): <strong>{schottkyResult.energy50StepsJoules} J</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">
                          1N4007 Silicon Bridge
                        </span>
                        <span className="text-[11px] font-mono bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-semibold">
                          Efficiency: {siliconResult.rectifierEfficiencyPct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <div className="text-[11px] text-stone-600">Net Energy / Step</div>
                          <div className="text-lg font-bold font-mono text-stone-900">
                            {siliconResult.netJoulesPerStep} J
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-stone-600">50-Step Cap Voltage</div>
                          <div className="text-lg font-bold font-mono text-stone-900">
                            {siliconResult.capacitorVoltage50Steps} V
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-stone-700 pt-1 border-t border-stone-200">
                        Stored Energy (50 steps): <strong>{siliconResult.energy50StepsJoules} J</strong>
                      </div>
                    </div>
                  </div>

                  {/* Reality Check Box: Activity 1.1 Human Watt Challenge */}
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-700" />
                      Activity 1.1 Reality Check: The &quot;Human Watt&quot; Scale
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      One footstep generates <strong>{activeSim.netJoulesPerStep} Joules</strong> after bridge rectification.
                      To power a single <strong>5W LED bulb for 1 hour (18,000 Joules)</strong>, this tile needs{' '}
                      <strong className="font-mono underline">
                        {activeSim.netJoulesPerStep > 0
                          ? Math.ceil(18000 / activeSim.netJoulesPerStep).toLocaleString()
                          : '∞'}{' '}
                        footsteps
                      </strong>
                      . That is why kinetic tiles excel at powering <strong>ultra-low-power autonomous IoT sensors, e-ink signage, and emergency step-markers</strong> rather than replacing rooftop solar or grid HVAC!
                    </p>
                  </div>

                  {/* Transducer Engineering Spec Card */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        {selectedTransducer.mechanism} — {selectedTransducer.weatherproofIpRating}
                      </span>
                      <span className="text-xs font-mono text-stone-600">
                        I_sc: {selectedTransducer.shortCircuitCurrentMa} mA · V_oc: {selectedTransducer.openCircuitPeakV} V
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      <strong>Engineering Trade-off:</strong> {selectedTransducer.engineeringTradeoff}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SITE HEATMAP, DIGITAL TWIN RETROFIT & 3-PANEL A1 BLUEPRINT */}
          {activeTab === 'retrofit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Campus / Urban Bottleneck Selector */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Activity 1.3 &amp; 2.1: Campus Bottleneck Safari &amp; Footfall Log
                  </h3>

                  <div className="space-y-2">
                    {KINETIC_SITE_BOTTLENECKS.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => handleSiteChange(site.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedSiteId === site.id
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{site.name}</span>
                          <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {site.dailyFootstepsPerTile.toLocaleString()} steps/day
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-1">
                          Type: {site.locationType} · ΔT: {site.surfaceTempDeltaC}°C · {site.recommendedTileCount} tiles
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium mt-1">
                          Load Target: {site.targetLoadProfile}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Array Sizing Sliders */}
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">Number of Modular Tiles in Array</span>
                        <span className="font-mono font-bold text-stone-900">{tileCount} tiles</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={36}
                        step={1}
                        value={tileCount}
                        onChange={(e) => setTileCount(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">Daily Footsteps per Tile</span>
                        <span className="font-mono font-bold text-stone-900">
                          {dailyFootstepsPerTile.toLocaleString()} steps/day
                        </span>
                      </div>
                      <input
                        type="range"
                        min={500}
                        max={12000}
                        step={200}
                        value={dailyFootstepsPerTile}
                        onChange={(e) => setDailyFootstepsPerTile(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Live OLED Watt-Meter Telemetry Simulation (Activity 4.2) */}
                <div className="bg-stone-900 text-emerald-400 rounded-xl p-4 border border-stone-800 font-mono space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800 pb-1.5">
                    <span>SSD1306 OLED TELEMETRY (INA219 I2C)</span>
                    <span className="text-emerald-400">● LIVE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="text-[10px] text-stone-400">CAPACITOR BUS (50 STEPS)</div>
                      <div className="text-base font-bold text-white">
                        {activeSim.capacitorVoltage50Steps.toFixed(2)} V DC
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400">NET JOULES / FOOTSTEP</div>
                      <div className="text-base font-bold text-amber-300">
                        {activeSim.netJoulesPerStep.toFixed(3)} J
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400">DAILY ARRAY HARVEST</div>
                      <div className="text-base font-bold text-emerald-300">
                        {activeSim.totalDailyJoules.toLocaleString()} J ({activeSim.totalDailyWattHours} Wh)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-stone-400">ANNUAL ENERGY YIELD</div>
                      <div className="text-base font-bold text-sky-300">
                        {activeSim.annualKwh} kWh / yr
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Deliverable #2 — 3-Panel A1/Arch D Architectural & Electrical Blueprint Checklist */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        Deliverable #2: Full-Sheet A1/Arch D Architectural &amp; Electrical Blueprint
                      </h3>
                      <p className="text-xs text-stone-500">
                        Verify all 9 required engineering callouts across the 3 blueprint panels before Week 9 freeze
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {blueprintCheckedCount}/9 Callouts Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Panel 1 */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="text-xs font-bold text-stone-900">
                        Panel 1: Mechanical Exploded Isometric (1:2 Scale)
                      </div>
                      {[
                        {
                          key: 'p1-exploded',
                          label: 'Top wear plate, 35mm piezo brass discs / coil array & base frame dimensions in mm'
                        },
                        {
                          key: 'p1-deflection',
                          label: '3–5mm spring return travel stops & steel load-bearing stopper pillars'
                        },
                        {
                          key: 'p1-ip65',
                          label: 'IP66/IP67 perimeter weatherproof rubber gasket & non-slip top surface'
                        }
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedBlueprintItems[item.key]}
                            onChange={() => toggleBlueprintItem(item.key)}
                            className="mt-0.5 accent-emerald-600"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Panel 2 */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="text-xs font-bold text-stone-900">
                        Panel 2: Power Conditioning Schematic
                      </div>
                      {[
                        {
                          key: 'p2-bridge',
                          label: 'Full-wave 1N5819 Schottky bridge rectifier wiring per tile zone'
                        },
                        {
                          key: 'p2-capacitor',
                          label: 'Supercapacitor / LiFePO4 buffer & 3.3V/5V buck-boost regulator'
                        },
                        {
                          key: 'p2-telemetry',
                          label: 'INA219 I2C current/voltage sensor + ESP32/micro:bit + SSD1306 OLED bus'
                        }
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedBlueprintItems[item.key]}
                            onChange={() => toggleBlueprintItem(item.key)}
                            className="mt-0.5 accent-emerald-600"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Panel 3 */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="text-xs font-bold text-stone-900">
                        Panel 3: Architectural Site Plan (1:50 Scale)
                      </div>
                      {[
                        {
                          key: 'p3-heatmap',
                          label: `Pedestrian bottleneck overlay at ${selectedSite.name}`
                        },
                        {
                          key: 'p3-routing',
                          label: 'Sub-floor conduit routing to low-voltage civic load & accessibility ramp flush fit'
                        },
                        {
                          key: 'p3-maintenance',
                          label: 'Quick-release service hatch for 5-minute modular tile swap'
                        }
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedBlueprintItems[item.key]}
                            onChange={() => toggleBlueprintItem(item.key)}
                            className="mt-0.5 accent-emerald-600"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Studio Pod Roles Assignment */}
                  <div className="pt-3 border-t border-stone-200 space-y-2">
                    <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      3-Student Multidisciplinary Engineering Pod Roles
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {Object.entries(podLeadAssignments).map(([roleKey, desc]) => (
                        <div key={roleKey} className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-200/80">
                          <div className="font-bold uppercase text-[10px] text-indigo-700">{roleKey} lead</div>
                          <input
                            type="text"
                            value={desc}
                            onChange={(e) =>
                              setPodLeadAssignments((prev) => ({ ...prev, [roleKey]: e.target.value }))
                            }
                            className="mt-1 w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs text-stone-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 1,000-FOOTSTEP STRESS TEST & HONEST ROI FINANCIAL SIMULATOR */}
          {activeTab === 'roi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                    Activity 5.2: &quot;Honest ROI&quot; &amp; BOM Scale Simulator
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Civic decision-makers reject greenwashing. Calculate the true Bill of Materials (BOM) at 1, 100, and 10,000 units, compare against rooftop solar PV, and evaluate how <strong>batteryless foot-traffic telemetry</strong> transforms smart-tile economics.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Manufacturing Volume Tier (Economies of Scale)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'prototype-1', label: '1 Prototype' },
                          { id: 'pilot-100', label: '100 Pilot Tiles' },
                          { id: 'city-10000', label: '10,000 City OEM' }
                        ] as const
                      ).map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setDeploymentScale(tier.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            deploymentScale === tier.id
                              ? 'bg-sky-700 text-white border-sky-700'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSmartSensorCoBenefit}
                        onChange={(e) => setIncludeSmartSensorCoBenefit(e.target.checked)}
                        className="mt-0.5 accent-sky-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-sky-950">
                          Include Batteryless IoT Occupancy Sensor Co-Benefit (+$18/tile/yr value)
                        </div>
                        <p className="text-[11px] text-sky-800 mt-0.5">
                          Every footstep pulse acts as a self-powered pedestrian counter, eliminating manual battery swaps and trenching AC conduit in smart-building occupancy sensors.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Unit Economics &amp; Civic Payback Audit ({tileCount}-Tile Array @ {selectedSite.name})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Grid Tariff Benchmark: $0.18 / kWh · Total Array Hardware CAPEX: ${activeSim.totalHardwareCapexUSD.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                        activeSim.estimatedPaybackYears <= 5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : activeSim.estimatedPaybackYears <= 15
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      Payback: {activeSim.estimatedPaybackYears >= 999 ? '>999 yrs' : `${activeSim.estimatedPaybackYears} yrs`}
                    </span>
                  </div>

                  {/* BOM Scaling Table */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">1-Unit Hand-Built BOM</div>
                      <div className="text-base font-bold font-mono text-stone-900">
                        ${selectedTransducer.unitPrototypeBomUSD} / tile
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">100-Unit Campus Batch</div>
                      <div className="text-base font-bold font-mono text-emerald-800">
                        ${selectedTransducer.bulk100UnitCostUSD} / tile
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">10,000-Unit Civic OEM</div>
                      <div className="text-base font-bold font-mono text-sky-800">
                        ${selectedTransducer.bulk10000UnitCostUSD} / tile
                      </div>
                    </div>
                  </div>

                  {/* Payback Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                      <div className="text-xs font-bold text-rose-950">
                        Raw Grid Electricity Offset Only ($0.18/kWh)
                      </div>
                      <div className="text-2xl font-bold font-mono text-rose-900">
                        {energyOnlySim.estimatedPaybackYears >= 999
                          ? '> 999 yrs'
                          : `${energyOnlySim.estimatedPaybackYears} yrs`}
                      </div>
                      <p className="text-[11px] text-rose-800">
                        Annual Harvest: <strong>{activeSim.annualKwh} kWh/yr</strong> (${activeSim.annualDirectEnergySavingsUSD}/yr) across {tileCount} tiles. Pure electricity sales alone never justify kinetic floor tiles!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="text-xs font-bold text-emerald-950">
                        Combined Energy + Batteryless IoT Telemetry Value
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-900">
                        {activeSim.estimatedPaybackYears >= 999
                          ? '> 999 yrs'
                          : `${activeSim.estimatedPaybackYears} yrs`}
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Total Annual Value: <strong>${activeSim.totalAnnualValueUSD}/yr</strong> (${activeSim.annualSensorCoBenefitUSD}/yr avoided battery/wiring maintenance + localized LED pathway safety).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 3 CORE DELIVERABLES, WELEARN SKILLS & GAMIFICATION BADGES */}
          {activeTab === 'rubric' && (
            <div className="space-y-6">
              {/* 3 Core Deliverables */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  The 3 Mandatory Showcase Deliverables (Week 12 Smart City Expo)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {KINETIC_DELIVERABLES.map((deliv) => (
                    <div
                      key={deliv.number}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-bold">
                          Deliverable #{deliv.number}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900">{deliv.title}</h4>
                      </div>
                      <ul className="space-y-1 text-[11px] text-stone-700 border-t border-stone-200 pt-2">
                        {deliv.keyTechnicalCriteria.map((crit: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-stone-200/70">
                        Skills: {deliv.primarySkillsAssessed.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WeLearn 7 Future Skills Table */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  WeLearn 7 Future Skills Assessment Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="py-2 px-3 font-semibold">#</th>
                        <th className="py-2 px-3 font-semibold">WeLearn Future Skill</th>
                        <th className="py-2 px-3 font-semibold">Domain</th>
                        <th className="py-2 px-3 font-semibold">How Students Practice It in This Project</th>
                        <th className="py-2 px-3 font-semibold">Deliverable Anchor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {KINETIC_WELEARN_SKILLS_TABLE.map((row) => (
                        <tr key={row.skillNumber} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3 font-mono text-stone-500">{row.skillNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-900">{row.skillTitle}</td>
                          <td className="py-2.5 px-3 font-mono uppercase text-[11px] text-emerald-800">
                            {row.domainId}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">{row.howStudentsPractice}</td>
                          <td className="py-2.5 px-3 text-stone-600 font-medium">{row.deliverableAnchor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Claimable Gamification Badges */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900">
                    Kinetic &amp; Smart Energy Gamification Badges (Click to Claim/Toggle)
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded">
                    {totalXp} XP Earned
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {KINETIC_GAMIFICATION_BADGES.map((badge) => {
                    const isClaimed = claimedBadges.includes(badge.id);
                    return (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isClaimed
                            ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                            : 'border-stone-200 bg-stone-50/50 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">
                            {badge.icon} {badge.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-950">
                            +{badge.xpAward} XP
                          </span>
                        </div>
                        <div className="text-[10px] font-mono uppercase text-stone-500 mt-0.5">
                          Phase: {badge.unlockedAtPhase}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">{badge.condition}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-600 flex items-center gap-3">
            <span>
              <strong>Active Site:</strong> {selectedSite.name}
            </span>
            <span>·</span>
            <span>
              <strong>Net Harvest:</strong> {activeSim.netJoulesPerStep} J/step ({activeSim.totalDailyJoules.toLocaleString()} J/day)
            </span>
            <span>·</span>
            <span>
              <strong>Combined IoT ROI:</strong> {activeSim.estimatedPaybackYears} yrs
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveEvidence}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
              >
                Save Simulation Telemetry &amp; ROI to Portfolio
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
