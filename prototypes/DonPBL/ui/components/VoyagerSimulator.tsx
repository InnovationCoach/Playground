import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Sun,
  Award,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Flame,
  FolderPlus,
  Users,
  Calendar,
  Wrench,
  BookOpen
} from 'lucide-react';
import {
  VOYAGER_TEAM_ROLES,
  VOYAGER_12_WEEK_SCHEDULE,
  VOYAGER_ACTIVITY_GUIDES,
  VOYAGER_WELEARN_MTC_RUBRIC,
  VOYAGER_MTC_REFLECTION_QUESTIONS,
  VOYAGER_GAMIFICATION_BADGES,
  simulateVoyagerRcSolar
} from '../pbl';

interface VoyagerSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const VoyagerSimulator: React.FC<VoyagerSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'cad-solar-lab' | 'roles-schedule' | 'guides-friday' | 'rubric-mtc'>('cad-solar-lab');

  // Tab 1: CAD Shell & Solar Charging Bay Simulation State
  const [truckLengthMm, setTruckLengthMm] = useState<number>(315);
  const [truckWidthMm, setTruckWidthMm] = useState<number>(165);
  const [shellWallThicknessMm, setShellWallThicknessMm] = useState<number>(2.8);
  const [wheelArchClearanceMm, setWheelArchClearanceMm] = useState<number>(12);
  const [infillPct, setInfillPct] = useState<number>(18);
  const [wallLoops, setWallLoops] = useState<number>(3);
  const [batteryType, setBatteryType] = useState<'li_ion_2s_2000mah' | 'lipo_2s_2200mah'>('li_ion_2s_2000mah');
  const [solarPanelWatts, setSolarPanelWatts] = useState<number>(25);
  const [solarRoofAngleDeg, setSolarRoofAngleDeg] = useState<number>(22);
  const [bayExtraClearanceCm, setBayExtraClearanceCm] = useState<number>(5);
  const [totalBudgetTHB, setTotalBudgetTHB] = useState<number>(2350);

  // Tab 2: Roles & 12-Week Schedule Filter
  const [selectedRoleId, setSelectedRoleId] = useState<string>(VOYAGER_TEAM_ROLES[0].id);
  const [selectedStageFilter, setSelectedStageFilter] = useState<number>(0);

  // Tab 3: Weekly Friday "Show, Tell, Reflect" Builder
  const [fridayStage, setFridayStage] = useState<string>('Stage 3: DIGITAL PROTOTYPE / CAD (Weeks 5–6)');
  const [fridayRole, setFridayRole] = useState<string>('Truck Builder & Body Designer');
  const [fridayGoal, setFridayGoal] = useState<string>(
    'turn our simple 3D blocks into a 2.8mm-thick Voyager truck shell with front grill airflow holes and wheel wells'
  );
  const [fridayCreated, setFridayCreated] = useState<string>(
    'I 3D-modeled and sliced the 2-piece Voyager truck body (18% infill, 3 wall loops) so it fits our 220mm x 220mm printer bed.'
  );
  const [fridayProblemFixed, setFridayProblemFixed] = useState<string>(
    'widening the front wheel arches by 10mm after our Wednesday Fit Check so the tires never rub when turning'
  );
  const [fridaySkillTag, setFridaySkillTag] = useState<string>(
    'Competency 2: Creativity & Design Innovation'
  );

  // Tab 4: Rubric & Gamification State
  const [selectedRubricScores, setSelectedRubricScores] = useState<Record<number, number>>({
    1: 3,
    2: 4,
    3: 3,
    4: 3,
    5: 4,
    6: 3,
    7: 4
  });
  const [xpScore, setXpScore] = useState<number>(2100);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([
    'badge-voyager-boxfit',
    'badge-voyager-cardboard',
    'badge-voyager-cad-shell'
  ]);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const simResult = useMemo(
    () =>
      simulateVoyagerRcSolar({
        truckLengthMm,
        truckWidthMm,
        shellWallThicknessMm,
        wheelArchClearanceMm,
        infillPct,
        wallLoops,
        batteryType,
        solarPanelWatts,
        solarRoofAngleDeg,
        bayExtraClearanceCm,
        totalBudgetTHB
      }),
    [
      truckLengthMm,
      truckWidthMm,
      shellWallThicknessMm,
      wheelArchClearanceMm,
      infillPct,
      wallLoops,
      batteryType,
      solarPanelWatts,
      solarRoofAngleDeg,
      bayExtraClearanceCm,
      totalBudgetTHB
    ]
  );

  if (!isOpen) return null;

  const activeRole =
    VOYAGER_TEAM_ROLES.find((r) => r.id === selectedRoleId) || VOYAGER_TEAM_ROLES[0];

  const filteredWeeks =
    selectedStageFilter === 0
      ? VOYAGER_12_WEEK_SCHEDULE
      : VOYAGER_12_WEEK_SCHEDULE.filter((w) => w.stageNumber === selectedStageFilter);

  const fridayEntryText = `1. SHOW (1 Photo/Screenshot): [Attached photo of Voyager CAD / 3D Print / Solar Bay]
2. TELL (2 Sentences): "This week in the ${fridayStage} stage, my goal as the ${fridayRole} was to answer our driving question by ${fridayGoal}. ${fridayCreated}"
3. REFLECT (1 Sentence + Skill Tag): "One problem I fixed (iterated) this week was ${fridayProblemFixed}, which helped me practice the WeLearn skill of ${fridaySkillTag}."`;

  const handleClaimBadge = (id: string, xp: number) => {
    if (!unlockedBadgeIds.includes(id)) {
      setUnlockedBadgeIds((prev) => [...prev, id]);
      setXpScore((prev) => prev + xp);
    }
  };

  const handleCopySummary = () => {
    const summary = `# Project Voyager: 3D-Printed RC Truck & Solar Charging Bay
## Guide A & Guide B Engineering Telemetry
- **Voyager Shell Dimensions:** ${truckLengthMm}mm L × ${truckWidthMm}mm W (${simResult.printBedSections}-piece split for 220×220mm bed)
- **Wall Thickness (Shelling):** ${shellWallThicknessMm}mm (${simResult.wallThicknessStatus})
- **Slicer Settings:** ${infillPct}% Infill, ${wallLoops} Wall Loops -> ${simResult.shellMassGrams}g (${simResult.estimatedPrintHours}h print time)
- **Wheel Arch Clearance ("No-Go Zones"):** ${wheelArchClearanceMm}mm (${simResult.wheelsRubFree ? 'Rub-Free' : 'WARNING: Tire Rub'})
- **Solar Charging Bay Interior (+${bayExtraClearanceCm}cm clearance):** ${simResult.bayInteriorLengthCm}cm L × ${simResult.bayInteriorWidthCm}cm W
- **Solar Roof Angle & Power:** ${solarRoofAngleDeg}° tilt (${simResult.solarAngleEfficiencyPct}% eff) -> ${simResult.effectiveSolarChargeWatts}W net charge
- **Driving Runtime vs. Solar Recharge:** ${simResult.drivingRuntimeMinutes} mins drive / ${simResult.solarChargeTimeMinutes} mins solar charge
- **Team Budget:** ${totalBudgetTHB} THB (${simResult.withinThbBudget ? 'Within Budget' : 'Over Budget'})
- **Week 6 Gate Design Review Status:** ${simResult.designReviewReady ? 'READY TO BUILD' : 'NEEDS REVISION'}

## Weekly Friday Portfolio Entry ("Show, Tell, Reflect")
${fridayEntryText}
`;
    navigator.clipboard.writeText(summary);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-900 via-teal-950 to-amber-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-amber-300">
                  12 Weeks · 10 Hrs/Wk · 120 Hours Total · 5 ESL Team Roles
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-xs bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-stone-950" />
                  {xpScore} XP
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Project Voyager: 3D-Printed RC Truck &amp; Solar Charging Bay Lab
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
              <button
                onClick={() => setActiveTab('cad-solar-lab')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'cad-solar-lab'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                1. 3D Shell &amp; Solar Bay Lab
              </button>
              <button
                onClick={() => setActiveTab('roles-schedule')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'roles-schedule'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                2. 5 Roles &amp; 12-Wk Plan
              </button>
              <button
                onClick={() => setActiveTab('guides-friday')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'guides-friday'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                3. Guides A/B &amp; Friday Log
              </button>
              <button
                onClick={() => setActiveTab('rubric-mtc')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'rubric-mtc'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                4. MTC Rubric &amp; 12 Qs
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status & Actions Banner */}
        <div className="bg-amber-50/70 px-6 py-2.5 border-b border-amber-100 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-stone-900">
              Gate Design Review:
            </span>
            <span
              className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                simResult.designReviewReady
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {simResult.designReviewReady
                ? '✓ PASS: 2.5–3mm Wall · No Tire Rub · +5cm Bay · 15°–30° Solar Roof'
                : '⚠ CHECK SPECS: Verify 2.5–3mm Wall, ≥8mm Wheel Arch, ≥5cm Bay & 15°–30° Roof'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded text-stone-800 font-medium transition-colors"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotification ? 'Copied Voyager Spec!' : 'Copy Spec & Friday Log'}
            </button>
            {onSaveToPortfolio && (
              <button
                onClick={() =>
                  onSaveToPortfolio(
                    'Project Voyager: 3D Shell, Solar Bay & Friday Log',
                    `${fridayEntryText}\n\nShell: ${truckLengthMm}x${truckWidthMm}mm (${shellWallThicknessMm}mm wall, ${simResult.printBedSections} sections) | Solar Bay: ${solarRoofAngleDeg}° roof (${simResult.effectiveSolarChargeWatts}W, ${simResult.solarChargeTimeMinutes}m charge)`
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Log to Evidence Portfolio
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: 3D SHELL & SOLAR BAY SIMULATOR */}
        {activeTab === 'cad-solar-lab' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium block">
                  Guide A: 3D Shell &amp; Bed Split
                </span>
                <div className="text-xl font-bold font-mono text-stone-900">
                  {simResult.shellMassGrams}g · {simResult.printBedSections} Part(s)
                </div>
                <span
                  className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    simResult.wallThicknessStatus === 'optimal_2.5_to_3mm'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {simResult.wallThicknessStatus === 'optimal_2.5_to_3mm'
                    ? `Optimal ${shellWallThicknessMm}mm Wall (${simResult.estimatedPrintHours}h print)`
                    : simResult.wallThicknessStatus === 'too_thin_cracks'
                    ? 'Too Thin (<2.5mm): Will Crack!'
                    : 'Too Thick (>3.0mm): Too Heavy!'}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium block">
                  Guide B: Solar Bay Interior (+{bayExtraClearanceCm}cm)
                </span>
                <div className="text-xl font-bold font-mono text-stone-900">
                  {simResult.bayInteriorLengthCm} × {simResult.bayInteriorWidthCm} cm
                </div>
                <span
                  className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    simResult.bayClearanceSafe && simResult.wheelsRubFree
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {simResult.bayClearanceSafe && simResult.wheelsRubFree
                    ? '✓ Easy Parking & Rub-Free Wheels'
                    : '⚠ Check ≥5cm Bay or ≥8mm Wheel Arch'}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium block">
                  Solar Roof ({solarRoofAngleDeg}°) &amp; Charge Time
                </span>
                <div className="text-xl font-bold font-mono text-amber-800">
                  {simResult.effectiveSolarChargeWatts} W → {simResult.solarChargeTimeMinutes} min
                </div>
                <span
                  className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    simResult.angleOptimal
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {simResult.angleOptimal
                    ? `✓ Optimal 15°–30° Sun Angle (${simResult.solarAngleEfficiencyPct}%)`
                    : `Outside 15°–30° Target (${simResult.solarAngleEfficiencyPct}%)`}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-medium block">
                  Track Drive Runtime &amp; Lap Time
                </span>
                <div className="text-xl font-bold font-mono text-teal-900">
                  {simResult.drivingRuntimeMinutes} min · {simResult.trackLapTimeSeconds}s/lap
                </div>
                <span className="text-[11px] text-stone-600 block">
                  Motor Draw: {simResult.avgMotorDrawWatts}W | Budget: {totalBudgetTHB} THB
                </span>
              </div>
            </div>

            {/* Interactive Controls Grid: Guide A (Truck Shell) & Guide B (Solar Bay) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Guide A Controls */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-teal-700" />
                    Guide A: Voyager RC Truck Shell &amp; Slicer Settings
                  </h3>
                  <span className="font-mono text-[11px] bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200">
                    Role 1 &amp; Role 2
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Step 4: Shell Wall Thickness (Target: 2.5mm to 3.0mm)</span>
                      <span className="font-mono text-teal-800">{shellWallThicknessMm.toFixed(1)} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="4.5"
                      step="0.1"
                      value={shellWallThicknessMm}
                      onChange={(e) => setShellWallThicknessMm(Number(e.target.value))}
                      className="w-full accent-teal-700"
                    />
                    <span className="text-[11px] text-stone-500">
                      Too thin (&lt;2.5mm) cracks over bumps; too thick (&gt;3.0mm) is too heavy for the motor!
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Step 3: "No-Go Zone" Wheel Well Clearance (≥8mm)</span>
                      <span className="font-mono text-teal-800">{wheelArchClearanceMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={wheelArchClearanceMm}
                      onChange={(e) => setWheelArchClearanceMm(Number(e.target.value))}
                      className="w-full accent-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Shell Length (mm)</span>
                        <span className="font-mono">{truckLengthMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="380"
                        step="5"
                        value={truckLengthMm}
                        onChange={(e) => setTruckLengthMm(Number(e.target.value))}
                        className="w-full accent-teal-700"
                      />
                      <span className="text-[10px] text-stone-500">
                        &gt;220mm splits into {simResult.printBedSections} pieces
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Slicer Infill (15%–20%)</span>
                        <span className="font-mono">{infillPct}% ({wallLoops} loops)</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        step="1"
                        value={infillPct}
                        onChange={(e) => setInfillPct(Number(e.target.value))}
                        className="w-full accent-teal-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Week 2 Battery Comparison Choice (Li-ion vs. LiPo):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBatteryType('li_ion_2s_2000mah')}
                        className={`p-2 rounded border text-left transition-colors ${
                          batteryType === 'li_ion_2s_2000mah'
                            ? 'bg-teal-50 border-teal-600 text-stone-900 font-semibold'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        2S 7.4V Li-ion (2000mAh) — Safest Metal Cell
                      </button>
                      <button
                        onClick={() => setBatteryType('lipo_2s_2200mah')}
                        className={`p-2 rounded border text-left transition-colors ${
                          batteryType === 'lipo_2s_2200mah'
                            ? 'bg-teal-50 border-teal-600 text-stone-900 font-semibold'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        2S 7.4V Hardcase LiPo (2200mAh)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guide B Controls */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-600" />
                    Guide B: Solar Charging Bay &amp; THB Budget
                  </h3>
                  <span className="font-mono text-[11px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    Role 3 &amp; Role 4
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Step 2: Slanted Solar Roof Angle (Target: 15° to 30°)</span>
                      <span className="font-mono text-amber-800">{solarRoofAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={solarRoofAngleDeg}
                      onChange={(e) => setSolarRoofAngleDeg(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                    <span className="text-[11px] text-stone-500">
                      Angles the roof panels toward the sun (15°–30° optimal).
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Step 1: Extra Parking Space on All Sides (Target: ≥5cm)</span>
                      <span className="font-mono text-amber-800">+{bayExtraClearanceCm} cm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={bayExtraClearanceCm}
                      onChange={(e) => setBayExtraClearanceCm(Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Solar Array Rating (W)</span>
                        <span className="font-mono">{solarPanelWatts} W</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="45"
                        step="5"
                        value={solarPanelWatts}
                        onChange={(e) => setSolarPanelWatts(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Team BOM Budget (THB)</span>
                        <span className="font-mono">{totalBudgetTHB} THB</span>
                      </div>
                      <input
                        type="range"
                        min="1500"
                        max="3500"
                        step="50"
                        value={totalBudgetTHB}
                        onChange={(e) => setTotalBudgetTHB(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-950 space-y-1">
                    <span className="font-bold block">
                      Daily 2-Hour Class Routine (ESL-Friendly Rhythm):
                    </span>
                    <p>
                      • <strong>0:00–0:15 (15m):</strong> Daily Stand-Up Check-In (&ldquo;What did I finish yesterday?&rdquo; / &ldquo;What am I building today?&rdquo;)
                      <br />• <strong>0:15–1:40 (85m):</strong> Hands-On Workshop &amp; CAD Time
                      <br />• <strong>1:40–2:00 (20m):</strong> Clean Up &amp; Progress Log (1 photo + 1–2 sentences)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 5 TEAM ROLES & 12-WEEK SCHEDULE */}
        {activeTab === 'roles-schedule' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 5 Team Roles Selector */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  5 Team Roles (Adapted for ESL Learners) &amp; Stage 1–5 Portfolio Evidence Checklist
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                {VOYAGER_TEAM_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRoleId === role.id
                        ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-mono text-[10px] opacity-80">
                      Role {role.roleNumber} · {role.leadSubtitle}
                    </div>
                    <div className="font-bold mt-0.5 leading-snug">{role.title}</div>
                  </button>
                ))}
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-3">
                <div>
                  <span className="font-bold text-stone-900 text-sm">
                    Role {activeRole.roleNumber}: {activeRole.title} ({activeRole.leadSubtitle})
                  </span>
                  <p className="text-stone-600 mt-0.5">{activeRole.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  {[
                    { label: 'Stage 1 (Wks 1–2)', text: activeRole.stagePortfolioEvidence.stage1Weeks1To2 },
                    { label: 'Stage 2 (Wks 3–4)', text: activeRole.stagePortfolioEvidence.stage2Weeks3To4 },
                    { label: 'Stage 3 (Wks 5–6)', text: activeRole.stagePortfolioEvidence.stage3Weeks5To6 },
                    { label: 'Stage 4 (Wks 7–9)', text: activeRole.stagePortfolioEvidence.stage4Weeks7To9 },
                    { label: 'Stage 5 (Wks 10–12)', text: activeRole.stagePortfolioEvidence.stage5Weeks10To12 }
                  ].map((st, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-stone-200 space-y-1">
                      <span className="font-mono font-bold text-[10px] text-teal-800 uppercase block">
                        {st.label}
                      </span>
                      <p className="text-[11px] text-stone-700 leading-relaxed">{st.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 12-Week Schedule by Stage */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  12-Week Schedule &amp; Role Deliverables by Design Thinking Stage
                </h3>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 0, label: 'All 12 Weeks' },
                    { id: 1, label: 'Stage 1 (Wks 1–2)' },
                    { id: 2, label: 'Stage 2 (Wks 3–4)' },
                    { id: 3, label: 'Stage 3 (Wks 5–6)' },
                    { id: 4, label: 'Stage 4 (Wks 7–9)' },
                    { id: 5, label: 'Stage 5 (Wks 10–12)' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStageFilter(st.id)}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        selectedStageFilter === st.id
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {filteredWeeks.map((wk) => (
                  <div
                    key={wk.week}
                    className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">{wk.weekTitle}</span>
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                        Stage {wk.stageNumber}
                      </span>
                    </div>
                    <p className="italic text-teal-900 font-medium">
                      Driving Question: &ldquo;{wk.weeklyDrivingQuestion}&rdquo;
                    </p>
                    <ul className="space-y-1 text-[11px] text-stone-700">
                      <li>• <strong>Truck Builder:</strong> {wk.roleTasks.truckBuilder}</li>
                      <li>• <strong>Power Specialist:</strong> {wk.roleTasks.powerSpecialist}</li>
                      <li>• <strong>Solar Architect:</strong> {wk.roleTasks.solarArchitect}</li>
                      <li>• <strong>Team Boss:</strong> {wk.roleTasks.teamBoss}</li>
                      <li>• <strong>Brand Creator:</strong> {wk.roleTasks.brandCreator}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP GUIDES A & B + WEEKLY FRIDAY "SHOW, TELL, REFLECT" BUILDER */}
        {activeTab === 'guides-friday' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {VOYAGER_ACTIVITY_GUIDES.map((g, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                      {g.guideTitle}
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">{g.weeksAndHours}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{g.activityTitle}</h4>
                  <ul className="space-y-1 text-stone-700 leading-relaxed">
                    {g.steps.map((st, sIdx) => (
                      <li key={sIdx}>• {st}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Weekly Friday Portfolio Habit ("Show, Tell, Reflect") Builder */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  Weekly Friday Portfolio Habit (&ldquo;Show, Tell, Reflect&rdquo; — Last 20 Mins of Friday Class)
                </h3>
                <p className="text-stone-600 mt-0.5">
                  Fill in the 3-step ESL-friendly template below to generate your Friday MTC Portfolio slide entry:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Design Thinking Stage:
                  </label>
                  <input
                    type="text"
                    value={fridayStage}
                    onChange={(e) => setFridayStage(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Your Team Role:
                  </label>
                  <input
                    type="text"
                    value={fridayRole}
                    onChange={(e) => setFridayRole(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    WeLearn Skill Tag from Rubric:
                  </label>
                  <input
                    type="text"
                    value={fridaySkillTag}
                    onChange={(e) => setFridaySkillTag(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    My Goal Was to Answer Our Driving Question By...:
                  </label>
                  <textarea
                    rows={2}
                    value={fridayGoal}
                    onChange={(e) => setFridayGoal(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    I Created / Built / Tested...:
                  </label>
                  <textarea
                    rows={2}
                    value={fridayCreated}
                    onChange={(e) => setFridayCreated(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    One Problem I Fixed (Iterated) This Week Was...:
                  </label>
                  <textarea
                    rows={2}
                    value={fridayProblemFixed}
                    onChange={(e) => setFridayProblemFixed(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-amber-300 font-mono text-[11px] text-stone-800 whitespace-pre-wrap">
                {fridayEntryText}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WELEARN & MTC 7-COMPETENCY RUBRIC, 12-QUESTION REFLECTION & BADGES */}
        {activeTab === 'rubric-mtc' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 7-Competency Rubric */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    6. WeLearn &amp; MTC Competency Assessment Rubric (ESL-Friendly: 1 Beginning → 4 Mastery)
                  </h3>
                  <p className="text-xs text-stone-600">
                    Click any level (1–4) to self-assess your growth across the 7 WeLearn Future Skills:
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {VOYAGER_WELEARN_MTC_RUBRIC.map((comp) => {
                  const currentLevel = selectedRubricScores[comp.competencyNumber] || 3;
                  return (
                    <div
                      key={comp.competencyNumber}
                      className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">
                          Competency {comp.competencyNumber}: {comp.title}{' '}
                          <span className="font-normal text-stone-600">({comp.subtitle})</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded">
                          Level {currentLevel}/4
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        {[
                          { lvl: 1, label: '1. Beginning (Need Help)', desc: comp.beginning1 },
                          { lvl: 2, label: '2. Developing (Getting There)', desc: comp.developing2 },
                          { lvl: 3, label: '3. Proficient (Job Done Well)', desc: comp.proficient3 },
                          { lvl: 4, label: '4. Mastery (Team Leader / Expert)', desc: comp.mastery4 }
                        ].map((cell) => (
                          <button
                            key={cell.lvl}
                            onClick={() =>
                              setSelectedRubricScores((prev) => ({
                                ...prev,
                                [comp.competencyNumber]: cell.lvl
                              }))
                            }
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              currentLevel === cell.lvl
                                ? 'bg-teal-900 text-white border-teal-900'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <div className="font-bold text-[11px] mb-1">{cell.label}</div>
                            <p className="text-[11px] opacity-90 leading-snug">{cell.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final 12-Question MTC Portfolio Reflection */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900">
                7.C Final 12-Question MTC Portfolio Reflection (Week 12)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {VOYAGER_MTC_REFLECTION_QUESTIONS.map((q) => (
                  <div
                    key={q.questionNumber}
                    className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-teal-800 font-bold">
                      <span>{q.partTitle}</span>
                      <span>Q{q.questionNumber}</span>
                    </div>
                    <div className="font-bold text-stone-900">
                      {q.questionNumber}. {q.topic}:
                    </div>
                    <p className="text-stone-700">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Voyager Gamification Badges */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                Project Voyager Engineering Badges ({unlockedBadgeIds.length}/{VOYAGER_GAMIFICATION_BADGES.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {VOYAGER_GAMIFICATION_BADGES.map((b) => {
                  const unlocked = unlockedBadgeIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                        unlocked
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{b.title}</span>
                          <span className="font-mono text-[11px] text-amber-800 font-bold">
                            +{b.xpReward} XP
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-500 block mb-1">
                          {b.stage}
                        </span>
                        <p className="text-[11px] text-stone-600">{b.unlockCriteria}</p>
                      </div>
                      <button
                        onClick={() => handleClaimBadge(b.id, b.xpReward)}
                        disabled={unlocked}
                        className={`w-full py-1 rounded font-semibold text-[11px] transition-colors ${
                          unlocked
                            ? 'bg-emerald-100 text-emerald-900 cursor-default'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {unlocked ? '✓ Badge Unlocked' : 'Claim Milestone Badge'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Voyager System Verdict:</span>
            <span className="font-mono text-teal-900 font-bold">
              {truckLengthMm}×{truckWidthMm}mm Shell ({shellWallThicknessMm}mm wall) · {solarRoofAngleDeg}° Solar Bay ({simResult.effectiveSolarChargeWatts}W)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md font-medium transition-colors"
            >
              Close Simulator
            </button>
            <button
              onClick={handleCopySummary}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold transition-colors shadow-2xs"
            >
              Export Voyager Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
