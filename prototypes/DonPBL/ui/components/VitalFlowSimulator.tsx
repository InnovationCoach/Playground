import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileCheck,
  Sliders,
  Users,
  TrendingUp
} from 'lucide-react';
import {
  VITAL_FLOW_PUMP_OPTIONS,
  VITAL_FLOW_VALVE_OPTIONS,
  VITAL_FLOW_VASCULAR_PATHWAYS,
  VITAL_FLOW_DELIVERABLES,
  VITAL_FLOW_WELEARN_SKILLS_TABLE,
  VITAL_FLOW_GAMIFICATION_BADGES,
  simulateVitalFlowCirculation
} from '../pbl';

interface VitalFlowSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const VitalFlowSimulator: React.FC<VitalFlowSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'hemodynamics' | 'blueprint' | 'stress' | 'rubric'>('hemodynamics');

  // Shared hemodynamic & engineering parameters
  const [selectedPumpId, setSelectedPumpId] = useState<string>(VITAL_FLOW_PUMP_OPTIONS[1].id);
  const [selectedValveId, setSelectedValveId] = useState<string>(VITAL_FLOW_VALVE_OPTIONS[0].id);
  const [pumpCadenceBpm, setPumpCadenceBpm] = useState<number>(65);
  const [totalNetworkVolumeMl, setTotalNetworkVolumeMl] = useState<number>(420);
  const [lungStationConnected, setLungStationConnected] = useState<boolean>(true);
  const [sharp90DegreeBendCount, setSharp90DegreeBendCount] = useState<number>(2);
  const [jointSealQualityPct, setJointSealQualityPct] = useState<number>(92);
  const [prototypeVersion, setPrototypeVersion] = useState<'v1_baseline' | 'v2_upgraded'>('v2_upgraded');

  // Blueprint checklist state (Deliverable #2: Full-Scale Anatomical & Fluid Schematic)
  const [checkedBlueprintItems, setCheckedBlueprintItems] = useState<Record<string, boolean>>({
    'bp-aorta-vc': true,
    'bp-pulmonary-lung': true,
    'bp-brachial-fingers': true,
    'bp-femoral-toes': true,
    'bp-saphenous-return': true,
    'bp-valves': true,
    'bp-volume-math': true,
    'bp-pressure-drop': false,
    'bp-seal-qc': false
  });

  // Pod roles state
  const [podLeadAssignments, setPodLeadAssignments] = useState<Record<string, string>>({
    cardiopulmonary: 'Cardiopulmonary & Valve Lead (Manual Heart Pump, Check-Valves, Lung Station)',
    vascular: 'Vascular Routing & Capillary Lead (Aorta/Vena Cava Trunks, 20-Digit Straw Beds)',
    clinical: 'Seal QC & Clinical Telemetry Lead (Joint-Sealing Bootcamp, Reach/Leak/Flow Audits)'
  });

  // Claimed badges state
  const [claimedBadges, setClaimedBadges] = useState<string[]>([
    VITAL_FLOW_GAMIFICATION_BADGES[0]?.id || 'badge-ischemia-empathy',
    VITAL_FLOW_GAMIFICATION_BADGES[2]?.id || 'badge-phase-gate-brief'
  ]);

  const selectedPump = useMemo(
    () => VITAL_FLOW_PUMP_OPTIONS.find((p) => p.id === selectedPumpId) || VITAL_FLOW_PUMP_OPTIONS[0],
    [selectedPumpId]
  );

  const selectedValve = useMemo(
    () => VITAL_FLOW_VALVE_OPTIONS.find((v) => v.id === selectedValveId) || VITAL_FLOW_VALVE_OPTIONS[0],
    [selectedValveId]
  );

  // Prototype V1.0 Baseline vs V2.0 Upgraded comparison for Weeks 10-11 Stress Audits
  const v1Sim = useMemo(
    () =>
      simulateVitalFlowCirculation({
        strokeVolumeMl: selectedPump.strokeVolumeMl,
        pumpCadenceBpm,
        peakSystolicMmHg: selectedPump.peakSystolicMmHg,
        valveBackflowPreventionPct: Math.max(40, selectedValve.backflowPreventionPct - 12),
        valveForwardDropMmHg: selectedValve.forwardPressureDropMmHg,
        totalNetworkVolumeMl,
        lungStationConnected,
        sharp90DegreeBendCount: Math.max(6, sharp90DegreeBendCount + 4),
        jointSealQualityPct: Math.min(72, jointSealQualityPct),
        prototypeVersion: 'v1_baseline'
      }),
    [
      selectedPump.strokeVolumeMl,
      selectedPump.peakSystolicMmHg,
      pumpCadenceBpm,
      selectedValve.backflowPreventionPct,
      selectedValve.forwardPressureDropMmHg,
      totalNetworkVolumeMl,
      lungStationConnected,
      sharp90DegreeBendCount,
      jointSealQualityPct
    ]
  );

  const v2Sim = useMemo(
    () =>
      simulateVitalFlowCirculation({
        strokeVolumeMl: selectedPump.strokeVolumeMl,
        pumpCadenceBpm,
        peakSystolicMmHg: selectedPump.peakSystolicMmHg,
        valveBackflowPreventionPct: selectedValve.backflowPreventionPct,
        valveForwardDropMmHg: selectedValve.forwardPressureDropMmHg,
        totalNetworkVolumeMl,
        lungStationConnected,
        sharp90DegreeBendCount,
        jointSealQualityPct,
        prototypeVersion: 'v2_upgraded'
      }),
    [
      selectedPump.strokeVolumeMl,
      selectedPump.peakSystolicMmHg,
      pumpCadenceBpm,
      selectedValve.backflowPreventionPct,
      selectedValve.forwardPressureDropMmHg,
      totalNetworkVolumeMl,
      lungStationConnected,
      sharp90DegreeBendCount,
      jointSealQualityPct
    ]
  );

  const activeSim = prototypeVersion === 'v2_upgraded' ? v2Sim : v1Sim;

  if (!isOpen) return null;

  const toggleBadge = (badgeId: string) => {
    setClaimedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const toggleBlueprintItem = (key: string) => {
    setCheckedBlueprintItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const blueprintCheckedCount = Object.values(checkedBlueprintItems).filter(Boolean).length;
  const totalXp = VITAL_FLOW_GAMIFICATION_BADGES.filter((b) => claimedBadges.includes(b.id)).reduce(
    (sum, b) => sum + b.xpAward,
    0
  );

  const handleSaveEvidence = () => {
    if (!onSaveToPortfolio) return;
    const title = `Project Vital Flow Lab: ${selectedPump.name} + ${selectedValve.name}`;
    const summary = [
      `Pump & Check-Valve: ${selectedPump.name} (${selectedPump.strokeVolumeMl} mL/stroke, ${selectedPump.peakSystolicMmHg} mmHg) + ${selectedValve.name} (${selectedValve.backflowPreventionPct}% backflow prevention).`,
      `Closed-Loop Architecture: Total vascular volume = ${totalNetworkVolumeMl} mL (${activeSim.idealStrokesPerCycle} ideal strokes/cycle; ${activeSim.actualStrokesPerCycle} actual strokes/cycle @ ${pumpCadenceBpm} BPM); Lung-Oxygenation Station = ${lungStationConnected ? 'CONNECTED' : 'BYPASSED'}.`,
      `Reach Audit (Activity 5.1): ${activeSim.perfusedDigitsCount}/20 digits perfused (${activeSim.extremityReachPct}% extremity reach); Time-to-Reach Toes = ${activeSim.timeToReachToesSeconds}s; Distal toe perfusion pressure = ${activeSim.distalToePerfusionMmHg} mmHg.`,
      `Leak & Flow Audits (Activity 5.2 & 5.3): Structural "Aneurysm" Leaks = ${activeSim.aneurysmLeakCount} (Seal capacity ${activeSim.sealPressureCapacityMmHg} mmHg); Retrograde Backflow Mixing = ${activeSim.backflowMixingPct}%.`,
      `V1.0 -> V2.0 Iteration: V1.0 reached ${v1Sim.perfusedDigitsCount}/20 digits with ${v1Sim.aneurysmLeakCount} leaks vs. V2.0 reaching ${v2Sim.perfusedDigitsCount}/20 digits with ${v2Sim.aneurysmLeakCount} leaks (${activeSim.clinicalVerdict}).`,
      `Biomedical Blueprint Callouts: ${blueprintCheckedCount}/9 verified | XP Earned: ${totalXp} XP.`
    ].join('\n');

    onSaveToPortfolio(title, summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-6xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Project Vital Flow: External Circulatory Support &amp; Fluid Dynamics Lab
                </h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  12 Weeks · 120 Hours
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Manual Heart Pump · One-Way Check-Valves · Lung-Oxygenation Station · 20-Digit Finger &amp; Toe Capillary Perfusion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-800 border border-stone-700 px-3 py-1 rounded-full text-xs text-rose-300 font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>{totalXp} XP</span>
              <span className="text-stone-400">({claimedBadges.length}/{VITAL_FLOW_GAMIFICATION_BADGES.length} Badges)</span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              aria-label="Close Vital Flow Simulator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 px-6 py-2 border-b border-stone-200 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('hemodynamics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'hemodynamics'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            1. Pump, Check-Valve &amp; Hemodynamics Lab
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'blueprint'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            2. Anatomical Vascular Tree &amp; Blueprint
          </button>

          <button
            onClick={() => setActiveTab('stress')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'stress'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            3. Reach, &quot;Aneurysm&quot; Leak &amp; V1.0 vs V2.0 Audits
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
          {/* TAB 1: PUMP, CHECK-VALVE & HEMODYNAMICS LAB */}
          {activeTab === 'hemodynamics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Pump & Valve Selectors */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-rose-600" />
                      Activity 3.1: Select Manual Heart Pump Mechanism
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500">
                      BOM: {selectedPump.unitCostTHB} THB
                    </span>
                  </div>

                  <div className="space-y-2">
                    {VITAL_FLOW_PUMP_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPumpId(p.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedPumpId === p.id
                            ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-600'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{p.name}</span>
                          <span className="text-[11px] font-mono font-semibold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                            {p.strokeVolumeMl} mL · {p.peakSystolicMmHg} mmHg
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">{p.refillElasticityRating}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity 3.2: Check-Valve Selector */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Activity 3.2: One-Way Check-Valve Innovation
                  </h3>

                  <div className="space-y-2">
                    {VITAL_FLOW_VALVE_OPTIONS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedValveId(v.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedValveId === v.id
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{v.name}</span>
                          <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {v.backflowPreventionPct}% block
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Analogy: {v.clinicalAnalogy}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Cadence & Network Volume Sliders */}
                  <div className="pt-2 space-y-3 border-t border-stone-100">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">
                          Manual Pumping Cadence (Strokes / Min — BPM)
                        </span>
                        <span className="font-mono font-bold text-rose-700">
                          {pumpCadenceBpm} BPM
                        </span>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={120}
                        step={5}
                        value={pumpCadenceBpm}
                        onChange={(e) => setPumpCadenceBpm(parseInt(e.target.value, 10))}
                        className="w-full accent-rose-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-stone-700">
                          Total Tubing &amp; Lung Network Capacity (Activity 2.3)
                        </span>
                        <span className="font-mono font-bold text-stone-900">
                          {totalNetworkVolumeMl} mL
                        </span>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={800}
                        step={20}
                        value={totalNetworkVolumeMl}
                        onChange={(e) => setTotalNetworkVolumeMl(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Hemodynamic Bench Output */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Closed-Loop Hemodynamic Bench &amp; Extremity Perfusion Telemetry
                      </h3>
                      <p className="text-xs text-stone-500">
                        Activity 2.3 &amp; 5.1: Stroke Volume vs. Total Network Capacity &amp; Distal Toe Reach
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        activeSim.clinicalVerdict === 'viable_extremity_perfusion'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : activeSim.clinicalVerdict === 'partial_ischemia_warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {activeSim.clinicalVerdict === 'viable_extremity_perfusion' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          100% Extremity Perfusion
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {activeSim.clinicalVerdict.replace(/_/g, ' ').toUpperCase()}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                      <div className="text-[11px] text-rose-800">Net Forward Output</div>
                      <div className="text-lg font-bold font-mono text-rose-950">
                        {activeSim.netForwardFlowMlPerMin.toLocaleString()} mL/m
                      </div>
                      <div className="text-[10px] text-rose-700">
                        ({activeSim.effectiveStrokeMl} mL/stroke eff.)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-[11px] text-emerald-800">Digits Perfused</div>
                      <div className="text-lg font-bold font-mono text-emerald-950">
                        {activeSim.perfusedDigitsCount} / 20
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        ({activeSim.extremityReachPct}% finger/toe reach)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                      <div className="text-[11px] text-sky-800">Time to Reach Toes</div>
                      <div className="text-lg font-bold font-mono text-sky-950">
                        {activeSim.timeToReachToesSeconds >= 999 ? 'DRY' : `${activeSim.timeToReachToesSeconds} s`}
                      </div>
                      <div className="text-[10px] text-sky-700">
                        Distal P: {activeSim.distalToePerfusionMmHg} mmHg
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="text-[11px] text-amber-800">Strokes / Full Cycle</div>
                      <div className="text-lg font-bold font-mono text-amber-950">
                        {activeSim.actualStrokesPerCycle} strokes
                      </div>
                      <div className="text-[10px] text-amber-700">
                        (Ideal: {activeSim.idealStrokesPerCycle} strokes)
                      </div>
                    </div>
                  </div>

                  {/* Mandatory 3 Core Criteria Status */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        Week 3 Mandatory Closed-Loop Criteria Check
                      </span>
                      <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lungStationConnected}
                          onChange={(e) => setLungStationConnected(e.target.checked)}
                          className="accent-emerald-600"
                        />
                        <span>Lung-Oxygenation Station Connected in Series</span>
                      </label>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      <strong>Valve Fabrication Note ({selectedValve.name}):</strong> {selectedValve.fabricationNotes}
                    </p>
                  </div>

                  {/* Pump Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-xs font-bold text-emerald-800 mb-1">
                        Pump Strengths ({selectedPump.name})
                      </div>
                      <ul className="space-y-1 text-xs text-stone-700 list-disc pl-4">
                        {selectedPump.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-xs font-bold text-rose-800 mb-1">
                        Mechanical &amp; Seal Risks
                      </div>
                      <ul className="space-y-1 text-xs text-stone-700 list-disc pl-4">
                        {selectedPump.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANATOMICAL VASCULAR TREE & BLUEPRINT */}
          {activeTab === 'blueprint' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 5 Anatomical Vascular Zones (Page 19 Diagram) */}
              <div className="lg:col-span-6 space-y-3">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Activity 1.3 &amp; 3.3: Human Circulatory Pathways (Arteries &amp; Veins)
                  </h3>
                  <div className="space-y-2.5">
                    {VITAL_FLOW_VASCULAR_PATHWAYS.map((z) => (
                      <div key={z.id} className="p-3 rounded-lg border border-stone-200 bg-stone-50/70 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{z.zoneName}</span>
                          <span className="text-[11px] font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                            {z.distanceFromHeartCm} cm from heart
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-800">
                          <strong>Arterial (O2):</strong> {z.arterialPathway}
                        </div>
                        <div className="text-[11px] text-sky-800">
                          <strong>Venous (CO2):</strong> {z.venousReturnPathway}
                        </div>
                        <div className="text-[11px] text-stone-600">
                          <strong>Prototype Spec:</strong> {z.tubingSpec}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Deliverable #2 Blueprint Callouts & Pod Roles */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        Deliverable #2: Life-Size Biomedical Blueprint Checklist
                      </h3>
                      <p className="text-xs text-stone-500">
                        Verify all 9 anatomical &amp; fluid-dynamics callouts on your life-size body template
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {blueprintCheckedCount}/9 Verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        key: 'bp-aorta-vc',
                        label: 'Central Aortic Arch, Descending Aorta, Superior Vena Cava & Inferior Vena Cava trunks labeled'
                      },
                      {
                        key: 'bp-pulmonary-lung',
                        label: 'Pulmonary Artery & Pulmonary Veins routed through the 250mL Lung-Oxygenation Station'
                      },
                      {
                        key: 'bp-brachial-fingers',
                        label: 'Upper Limb: Subclavian -> Axillary -> Brachial -> Radial/Ulnar -> 10 Digital finger straw loops'
                      },
                      {
                        key: 'bp-femoral-toes',
                        label: 'Lower Limb: Common/Internal Iliac -> Femoral -> Anterior/Posterior Tibial & Peroneal -> Arcuate -> 10 Dorsal Digital toe straws'
                      },
                      {
                        key: 'bp-saphenous-return',
                        label: 'Venous Return: Palmar/Dorsal Digital -> Cephalic/Basilic/Median Cubital & Great/Small Saphenous veins'
                      },
                      {
                        key: 'bp-valves',
                        label: 'One-way check-valve coordinates & flow-direction arrows marked at pump & venous return junctions'
                      },
                      {
                        key: 'bp-volume-math',
                        label: 'Activity 2.3 Volumetric table (tube ID mm, length cm, total mL capacity vs. stroke volume)'
                      },
                      {
                        key: 'bp-pressure-drop',
                        label: 'Week 6 multi-branch pressure distribution & 1-to-5 straw bifurcation head-loss notes'
                      },
                      {
                        key: 'bp-seal-qc',
                        label: 'Numbered Junction IDs (#J1–#J24) with rubber-band collar & duct-tape cuff QC specs'
                      }
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-stone-50 text-xs text-stone-700 cursor-pointer"
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

                  {/* Pod Roles */}
                  <div className="pt-3 border-t border-stone-200 space-y-2">
                    <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Biomedical Maker Pod Roles
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {Object.entries(podLeadAssignments).map(([roleKey, desc]) => (
                        <div key={roleKey} className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-200/80 flex items-center gap-2">
                          <span className="font-bold uppercase text-[10px] text-indigo-700 w-28 shrink-0">
                            {roleKey}
                          </span>
                          <input
                            type="text"
                            value={desc}
                            onChange={(e) =>
                              setPodLeadAssignments((prev) => ({ ...prev, [roleKey]: e.target.value }))
                            }
                            className="w-full bg-white border border-stone-200 rounded px-2 py-1 text-xs text-stone-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRESS TESTING, ANEURYSM LEAK AUDIT & V1.0 VS V2.0 ITERATION */}
          {activeTab === 'stress' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                    Weeks 10–11: Stress Audits &amp; V2.0 Upgrade Controls
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Active Prototype Build Stage
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPrototypeVersion('v1_baseline')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          prototypeVersion === 'v1_baseline'
                            ? 'bg-amber-700 text-white border-amber-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        Week 9 Prototype V1.0
                      </button>
                      <button
                        onClick={() => setPrototypeVersion('v2_upgraded')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          prototypeVersion === 'v2_upgraded'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        Week 11 Prototype V2.0
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-700">
                        Sharp 90-Degree Tubing Bends (Activity 5.4 Geometry)
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        {sharp90DegreeBendCount} bends
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={16}
                      step={1}
                      value={sharp90DegreeBendCount}
                      onChange={(e) => setSharp90DegreeBendCount(parseInt(e.target.value, 10))}
                      className="w-full accent-sky-600"
                    />
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Replacing sharp 90° kinks with sweeping curves reduces hydraulic head loss to the toes.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-700">
                        Joint Seal Compression Quality (Activity 4.2 &amp; 5.2)
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {jointSealQualityPct}% ({activeSim.sealPressureCapacityMmHg} mmHg max)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      step={2}
                      value={jointSealQualityPct}
                      onChange={(e) => setJointSealQualityPct(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600"
                    />
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Stepped sleeve + doubled rubber-band collar + lapped duct-tape cuff prevents structural &quot;aneurysms&quot;.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-stone-900">
                    Deliverable #3: Empirical Stress Audit Comparison (Prototype V1.0 vs. Upgraded V2.0)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* V1.0 Card */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950">
                          Week 10 Audit: Prototype V1.0 (Baseline)
                        </span>
                        <span className="text-[11px] font-mono bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded font-semibold">
                          {v1Sim.perfusedDigitsCount}/20 Digits
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-amber-900 font-mono">
                        <div>• Reach Time to Toes: {v1Sim.timeToReachToesSeconds} s</div>
                        <div>• Distal Toe Pressure: {v1Sim.distalToePerfusionMmHg} mmHg</div>
                        <div>• Structural &quot;Aneurysm&quot; Leaks: {v1Sim.aneurysmLeakCount} joints</div>
                        <div>• Backflow Mixing Index: {v1Sim.backflowMixingPct}%</div>
                      </div>
                    </div>

                    {/* V2.0 Card */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">
                          Week 11 Re-Test: Prototype V2.0 (Upgraded)
                        </span>
                        <span className="text-[11px] font-mono bg-emerald-200/70 text-emerald-950 px-2 py-0.5 rounded font-semibold">
                          {v2Sim.perfusedDigitsCount}/20 Digits
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-emerald-900 font-mono">
                        <div>• Reach Time to Toes: {v2Sim.timeToReachToesSeconds} s</div>
                        <div>• Distal Toe Pressure: {v2Sim.distalToePerfusionMmHg} mmHg</div>
                        <div>• Structural &quot;Aneurysm&quot; Leaks: {v2Sim.aneurysmLeakCount} joints</div>
                        <div>• Backflow Mixing Index: {v2Sim.backflowMixingPct}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Activity 6.2 Biological Reflection Bridge */}
                  <div className="p-4 rounded-xl bg-stone-900 text-stone-100 space-y-2">
                    <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Activity 6.2 Medical Board &amp; Biological Debrief Bridge
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-300 pt-1">
                      <div className="p-2.5 rounded bg-stone-800 border border-stone-700">
                        <strong className="text-white block mb-0.5">Classroom Check-Valves → Heart Valves</strong>
                        Pinched straws and rubber flaps that leak backward mirror human mitral/aortic valve regurgitation and venous insufficiency.
                      </div>
                      <div className="p-2.5 rounded bg-stone-800 border border-stone-700">
                        <strong className="text-white block mb-0.5">Duct-Tape Cuffs → Living Endothelium</strong>
                        Duct tape creeps under wet pressure, whereas living arteries use smooth muscle, elastin fibers, and cellular self-repair.
                      </div>
                      <div className="p-2.5 rounded bg-stone-800 border border-stone-700">
                        <strong className="text-white block mb-0.5">2.5mm Straws → 8µm Capillaries</strong>
                        Plastic straws model parallel flow resistance, while real microscopic capillaries have single-cell walls for O2/CO2 diffusion.
                      </div>
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
                  The 3 Mandatory Showcase Deliverables (Week 12 Medical Board Defense)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {VITAL_FLOW_DELIVERABLES.map((deliv) => (
                    <div
                      key={deliv.number}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-800 font-bold">
                          {deliv.weeksCovered}
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
                      <div className="text-[11px] text-rose-800 font-medium pt-1 border-t border-stone-200/70">
                        Skills: {deliv.primarySkillsAssessed.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WeLearn 7 Future Skills Table */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  WeLearn 7 Future Skills Assessment Matrix (Project Vital Flow)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="py-2 px-3 font-semibold">#</th>
                        <th className="py-2 px-3 font-semibold">WeLearn Future Skill</th>
                        <th className="py-2 px-3 font-semibold">Competencies</th>
                        <th className="py-2 px-3 font-semibold">How Students Practice It in Project Vital Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {VITAL_FLOW_WELEARN_SKILLS_TABLE.map((row) => (
                        <tr key={row.skillNumber} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3 font-mono text-stone-500">{row.skillNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-stone-900">{row.skillTitle}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-800">
                            {row.competencyIds.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">{row.howStudentsPractice}</td>
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
                    Project Vital Flow Gamification Badges (Click to Claim/Toggle)
                  </h3>
                  <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded">
                    {totalXp} XP Earned
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {VITAL_FLOW_GAMIFICATION_BADGES.map((badge) => {
                    const isClaimed = claimedBadges.includes(badge.id);
                    return (
                      <button
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isClaimed
                            ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                            : 'border-stone-200 bg-stone-50/50 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">
                            {badge.icon} {badge.name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-950">
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
              <strong>Active Pump:</strong> {selectedPump.name}
            </span>
            <span>·</span>
            <span>
              <strong>Extremity Reach:</strong> {activeSim.perfusedDigitsCount}/20 digits ({activeSim.timeToReachToesSeconds}s to toes)
            </span>
            <span>·</span>
            <span>
              <strong>Aneurysm Leaks:</strong> {activeSim.aneurysmLeakCount}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveEvidence}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
              >
                Save Circulatory Audit &amp; Blueprint Data to Portfolio
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
