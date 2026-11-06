import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Trophy,
  Calculator,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Smartphone,
  ShieldCheck,
  Coins,
  Save,
  Play,
  RotateCcw,
  BookOpen,
  Clock
} from 'lucide-react';
import {
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS,
  ENTREPRENEURSHIP_PDF_ACTIVITIES,
  calculateUnitEconomics,
  simulateMarketStep
} from '../pbl';

interface EntrepreneurshipSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const EntrepreneurshipSimulator: React.FC<EntrepreneurshipSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'economics' | 'worksheets' | 'gamification'>('sandbox');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.id || 'preset-brass-pocket'
  );

  // Phase 4: Unit Economics state (Thai Baht)
  const [unitFloorCostTHB, setUnitFloorCostTHB] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.unitFloorCostTHB || 45
  );
  const [desiredGrossMarginPct, setDesiredGrossMarginPct] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.targetGrossMarginPct || 62.5
  );
  const [fixedStartupCapitalExpenseTHB, setFixedStartupCapitalExpenseTHB] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_SIM_DEFAULT_FIXED()
  );

  // Phase 1–5 Interactive Worksheet State (from PDF)
  const [whoBlank, setWhoBlank] = useState<string>('Middle school brass musicians');
  const [whatBlank, setWhatBlank] = useState<string>(
    'struggle to store maintenance tools and music sheets safely without crushing them'
  );
  const [whyBlank, setWhyBlank] = useState<string>(
    'standard instrument cases only fit the instrument body and lack small, soft pockets for extra items'
  );
  const [feasibilityScore, setFeasibilityScore] = useState<number>(5);
  const [desirabilityScore, setDesirabilityScore] = useState<number>(5);
  const [durabilityScore, setDurabilityScore] = useState<number>(4);
  const [catchphraseOldWay, setCatchphraseOldWay] = useState<string>('stuffing valve oil and sheets into tight instrument cases');
  const [catchphraseProductName, setCatchphraseProductName] = useState<string>('BrassGuard Soft Pocket');
  const [catchphraseMainBenefit, setCatchphraseMainBenefit] = useState<string>('instant clip-on padded tool storage');
  const [catchphraseMainProblem, setCatchphraseMainProblem] = useState<string>('dented brass parts or lost accessories');

  // Market Simulation state
  const [silentRuleCompliancePct, setSilentRuleCompliancePct] = useState<number>(92);
  const [unitsToProduceBatch, setUnitsToProduceBatch] = useState<number>(12);
  const [simWeek, setSimWeek] = useState<number>(1);
  const [marketState, setMarketState] = useState({
    cashReserveTHB: ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.starterCashTHB || 2500,
    unitsProduced: 10,
    unitsSold: 8,
    adoptersReached: 8,
    marketReputationScore: 78,
    latestRevenue: 960,
    latestCost: 450
  });

  const [earnedBadges, setEarnedBadges] = useState<string[]>([
    'badge-friction-hunter',
    'badge-unbiased-listener',
    'badge-silent-observer',
    'badge-unit-economics-master'
  ]);

  function ENTREPRENEURSHIP_SIMULATION_SIM_DEFAULT_FIXED() {
    return ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.fixedStartupExpenseTHB || 1200;
  }

  if (!isOpen) return null;

  const activePreset =
    ENTREPRENEURSHIP_SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) ||
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0];

  const economics = calculateUnitEconomics({
    unitFloorCostTHB,
    desiredGrossMarginPct,
    fixedStartupCapitalExpenseTHB
  });

  const problemStatementSentence = `${whoBlank} ${whatBlank} because ${whyBlank}.`;
  const catchphraseSentence = `Unlike ${catchphraseOldWay}, ${catchphraseProductName} gives you ${catchphraseMainBenefit} without ${catchphraseMainProblem}.`;
  const ideaTotalScore = feasibilityScore + desirabilityScore + durabilityScore;

  const handleSelectPreset = (presetId: string) => {
    const preset = ENTREPRENEURSHIP_SIMULATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setUnitFloorCostTHB(preset.unitFloorCostTHB);
    setDesiredGrossMarginPct(preset.targetGrossMarginPct);
    setFixedStartupCapitalExpenseTHB(preset.fixedStartupExpenseTHB);
    setSimWeek(1);
    setMarketState({
      cashReserveTHB: preset.starterCashTHB,
      unitsProduced: 0,
      unitsSold: 0,
      adoptersReached: 0,
      marketReputationScore: 70,
      latestRevenue: 0,
      latestCost: 0
    });
  };

  const handleRunWeeklyStep = () => {
    const silentFactor = silentRuleCompliancePct / 100;
    const effectiveDemand = Math.max(
      1,
      Math.round((activePreset?.simulatedMarketDemandWeekly || 10) * silentFactor)
    );
    const next = simulateMarketStep(
      {
        cashReserveTHB: marketState.cashReserveTHB,
        unitFloorCostTHB: economics.unitFloorCostTHB,
        retailPriceTHB: economics.retailPriceTHB,
        unitsProduced: marketState.unitsProduced,
        unitsSold: marketState.unitsSold,
        adoptersReached: marketState.adoptersReached,
        marketReputationScore: marketState.marketReputationScore
      },
      unitsToProduceBatch,
      effectiveDemand
    );
    setMarketState(next);
    setSimWeek((w) => w + 1);
  };

  const toggleBadge = (badgeId: string) => {
    setEarnedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const totalEarnedXP = ENTREPRENEURSHIP_BADGES.filter((b) =>
    earnedBadges.includes(b.id)
  ).reduce((sum, b) => sum + b.xpAward, 0);

  const currentLevel =
    [...ENTREPRENEURSHIP_LEVELS]
      .reverse()
      .find((lvl) => totalEarnedXP >= lvl.minXp) || ENTREPRENEURSHIP_LEVELS[0];

  const nextLevel = ENTREPRENEURSHIP_LEVELS.find((lvl) => lvl.minXp > totalEarnedXP);

  const reachedBreakEven = marketState.unitsSold >= economics.breakEvenUnits;

  const handleSaveSimulation = () => {
    if (!onSaveToPortfolio) return;
    const summary = [
      `Venture Preset: ${activePreset?.name} (${activePreset?.track.toUpperCase()} Track — ${activePreset?.category})`,
      `Phase 1 Problem Statement: "${problemStatementSentence}"`,
      `Phase 2 Idea Score: ${ideaTotalScore}/15 (Feasibility ${feasibilityScore}/5, Desirability ${desirabilityScore}/5, Durability ${durabilityScore}/5)`,
      `Phase 4 Final 4 Numbers (THB): Unit Cost = ฿${economics.unitFloorCostTHB} THB | Selling Price = ฿${economics.retailPriceTHB} THB | Profit per Unit = ฿${economics.unitContributionMarginTHB} THB (${economics.desiredGrossMarginPct}%) | Break-Even Units = ${economics.breakEvenUnits} units (One-Time Startup Costs: ฿${fixedStartupCapitalExpenseTHB} THB)`,
      `Phase 5 Catchphrase: "${catchphraseSentence}"`,
      `Market Sandbox (Week ${simWeek}): ${marketState.unitsSold}/${marketState.unitsProduced} units sold | Cash Reserve: ฿${marketState.cashReserveTHB.toFixed(0)} THB | First-25 Customers Reached: ${marketState.adoptersReached}/25 | Silent Rule Score: ${silentRuleCompliancePct}%`
    ].join('\n');

    onSaveToPortfolio(`${activePreset?.name} — Venture & THB Cost Sheet`, summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-6xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Entrepreneurship: Creating a Product — Venture & THB Economics Lab
                </h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700">
                  Level {currentLevel.level}: {currentLevel.title} ({totalEarnedXP} XP)
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Phase 1 Problem Diary & Interviews • Phase 2 Crazy 8s • Phase 3 Silent Rule & v1.1 • Phase 4 THB COGS & Break-Even • Phase 5 3-Minute Sales Pitch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 px-6 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              1. Phase 3 Silent Rule & First-25 Sandbox
            </button>
            <button
              onClick={() => setActiveTab('economics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'economics'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              2. Phase 4 Costs, Price & Break-Even (THB)
            </button>
            <button
              onClick={() => setActiveTab('worksheets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'worksheets'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              3. Phases 1–5 Activities, Crazy 8s & 3-Min Pitch
            </button>
            <button
              onClick={() => setActiveTab('gamification')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'gamification'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              4. Founder XP & Badges ({earnedBadges.length}/{ENTREPRENEURSHIP_BADGES.length})
            </button>
          </div>

          <span className="text-xs font-mono text-stone-600">
            Track:{' '}
            <strong className="text-emerald-800 uppercase">
              {activePreset?.track === 'physical' ? 'Option A: Physical Product' : 'Option B: Digital Solution'}
            </strong>
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">
          {activeTab === 'sandbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Preset Picker & Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    Choose Physical Product (Option A) or Digital Solution (Option B)
                  </label>
                  <div className="space-y-2">
                    {ENTREPRENEURSHIP_SIMULATION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedPresetId === preset.id
                            ? 'border-emerald-600 bg-emerald-50/60 text-stone-900 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            {preset.track === 'physical' ? (
                              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5 text-indigo-700" />
                            )}
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                            {preset.track}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Production & Silent Rule Sliders */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Phase 3 Silent Rule & Weekly Batch Controls
                  </h3>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700">Batch Units to Make / Provision</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {unitsToProduceBatch} units (฿
                        {unitsToProduceBatch * economics.unitFloorCostTHB} THB)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      value={unitsToProduceBatch}
                      onChange={(e) => setUnitsToProduceBatch(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700">Phase 3 Activity 2: "The Silent Rule" & Version 1.1 Score</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {silentRuleCompliancePct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={100}
                      value={silentRuleCompliancePct}
                      onChange={(e) => setSilentRuleCompliancePct(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Give your model to 3 classmates who have never seen it. Stay completely quiet (do not explain, help, or say sorry), then fix at least 2 things in Version 1.1.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleRunWeeklyStep}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Simulate Launch Week (Week {simWeek + 1})
                    </button>
                    <button
                      onClick={() => handleSelectPreset(selectedPresetId)}
                      className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100"
                      title="Reset market simulation"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Telemetry Output */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-emerald-700 font-semibold">
                        Week {simWeek} Launch Telemetry • {activePreset?.category}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 mt-0.5">
                        {activePreset?.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1">{activePreset?.description}</p>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                        reachedBreakEven
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {reachedBreakEven ? 'BREAK-EVEN ACHIEVED' : `BREAK-EVEN: ${economics.breakEvenUnits} UNITS`}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">Cash Reserve (THB)</div>
                      <div className="text-lg font-bold text-emerald-700 font-mono">
                        ฿{Math.round(marketState.cashReserveTHB).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">Units Sold / Made</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">
                        {marketState.unitsSold} / {marketState.unitsProduced}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">First 25 Customers</div>
                      <div className="text-lg font-bold text-indigo-700 font-mono">
                        {marketState.adoptersReached} / 25
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">User Test Score</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">
                        {marketState.marketReputationScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Common Frictions to Resolve in Version 1.1 */}
                  <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                    <div className="font-bold text-stone-800">
                      Phase 3 Activity 2 Mistakes Observed Under "The Silent Rule" (Fixed in Version 1.1):
                    </div>
                    <ul className="list-disc list-inside text-stone-600 space-y-1">
                      {activePreset?.commonFrictions.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Coach Advisory */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      reachedBreakEven
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    {reachedBreakEven ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs space-y-1">
                      <div className="font-bold">Phase 4 & 5 Readiness Check</div>
                      <p className="leading-relaxed">
                        {reachedBreakEven
                          ? `You have sold ${marketState.unitsSold} units, paying back your ฿${fixedStartupCapitalExpenseTHB} THB One-Time Startup Costs (${economics.breakEvenUnits} Break-Even Units) and reaching ${marketState.adoptersReached} of your first 25 customers!`
                          : `You need ${Math.max(0, economics.breakEvenUnits - marketState.unitsSold)} more unit sales to pay back your ฿${fixedStartupCapitalExpenseTHB} THB One-Time Startup Costs. Simulate another week or refine your Phase 4 pricing.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'economics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Phase 4: Calculating Costs and Prices (Thai Baht — THB)
                  </h3>
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px] text-stone-600 space-y-1">
                  <div>
                    <strong>Activity 1 Pack-Division Examples:</strong>
                  </div>
                  <div>• Physical Example: A 100 THB roll of strap makes 5 bags = <strong>20 THB per bag</strong> (+ bags, labels, stickers).</div>
                  <div>• Digital Example: A 350 THB monthly website fee shared by 50 users = <strong>7 THB per user</strong> (+ payment fees).</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>1. Unit Cost (Unit Floor Cost / COGS per 1 unit)</span>
                      <span className="font-mono font-bold">฿{unitFloorCostTHB} THB</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={600}
                      step={1}
                      value={unitFloorCostTHB}
                      onChange={(e) => setUnitFloorCostTHB(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Desired Profit Margin (Physical: 50%–65% | Digital: 70%–85%)</span>
                      <span className="font-mono font-bold">
                        {desiredGrossMarginPct}% ({(desiredGrossMarginPct / 100).toFixed(2)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={85}
                      step={2.5}
                      value={desiredGrossMarginPct}
                      onChange={(e) => setDesiredGrossMarginPct(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>One-Time Startup Costs (Scissors, Glue Guns, Domain Names, Software)</span>
                      <span className="font-mono font-bold">
                        ฿{fixedStartupCapitalExpenseTHB} THB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={5000}
                      step={50}
                      value={fixedStartupCapitalExpenseTHB}
                      onChange={(e) => setFixedStartupCapitalExpenseTHB(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Phase 4, Activity 2, Step 5: Your Final 4 Numbers Clearly Written Down
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="text-xs text-stone-500">1. Unit Cost (Unit Floor Cost)</div>
                    <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                      ฿{economics.unitFloorCostTHB} THB
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="text-xs text-stone-500">2. Selling Price (Retail Price)</div>
                    <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                      ฿{economics.retailPriceTHB} THB
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-xs text-emerald-800">3. Profit per Unit (Margin)</div>
                    <div className="text-xl font-bold text-emerald-900 font-mono mt-0.5">
                      ฿{economics.unitContributionMarginTHB} THB ({economics.actualMarginPct}%)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <div className="text-xs text-indigo-800">4. Break-Even Units</div>
                    <div className="text-xl font-bold text-indigo-900 font-mono mt-0.5">
                      {economics.breakEvenUnits} Units
                    </div>
                  </div>
                </div>
                <div className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-lg border border-stone-200 space-y-1.5 font-mono">
                  <div>
                    SellingPrice = UnitCost / (1 - DesiredProfitMargin) = {economics.unitFloorCostTHB} / (1 - {(desiredGrossMarginPct / 100).toFixed(2)}) = ฿{economics.retailPriceTHB} THB
                  </div>
                  <div>
                    Break-EvenUnits = One-TimeStartupCosts / (SellingPrice - UnitCost) = {fixedStartupCapitalExpenseTHB} / ({economics.retailPriceTHB} - {economics.unitFloorCostTHB}) = {economics.breakEvenUnits} units
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'worksheets' && (
            <div className="space-y-6">
              {/* Interactive Problem Statement, Crazy 8s Scorer & Catchphrase / 3-Min Pitch Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phase 1 Activity 3 & Phase 2 Activity 2 */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Phase 1, Activity 3: Writing the Problem Statement (Who / What / Why)
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Who (A specific group of people):</label>
                      <input
                        type="text"
                        value={whoBlank}
                        onChange={(e) => setWhoBlank(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">What (The clear problem):</label>
                      <input
                        type="text"
                        value={whatBlank}
                        onChange={(e) => setWhatBlank(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Why (The main cause):</label>
                      <input
                        type="text"
                        value={whyBlank}
                        onChange={(e) => setWhyBlank(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                      <span className="font-bold block mb-0.5">Combined 1-Sentence Problem Statement:</span>
                      <p className="italic">"{problemStatementSentence}"</p>
                      <span className="text-[10px] text-emerald-700 block mt-1">
                        Step 4 Check: Make sure you did NOT mention your product name here!
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 space-y-2.5 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-stone-700">
                      Phase 2, Activity 2: Choosing Your Best Idea (1–5 Scoring Chart)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                        <span className="font-semibold block">Feasibility (1–5)</span>
                        <span className="text-[10px] text-stone-500 block mb-1">Build in 1–2 wks?</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={feasibilityScore}
                          onChange={(e) => setFeasibilityScore(Math.min(5, Math.max(1, Number(e.target.value))))}
                          className="w-full px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                        />
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                        <span className="font-semibold block">Desirability (1–5)</span>
                        <span className="text-[10px] text-stone-500 block mb-1">Do people want it?</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={desirabilityScore}
                          onChange={(e) => setDesirabilityScore(Math.min(5, Math.max(1, Number(e.target.value))))}
                          className="w-full px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                        />
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                        <span className="font-semibold block">Durability (1–5)</span>
                        <span className="text-[10px] text-stone-500 block mb-1">Survives &gt;2 min use?</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={durabilityScore}
                          onChange={(e) => setDurabilityScore(Math.min(5, Math.max(1, Number(e.target.value))))}
                          className="w-full px-2 py-1 rounded border border-stone-300 font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-stone-900 text-white rounded-lg font-mono text-xs">
                      <span>Total Idea Score (out of 15):</span>
                      <span className="font-bold text-emerald-400">{ideaTotalScore} / 15</span>
                    </div>
                  </div>
                </div>

                {/* Phase 5 Activity 1 & Activity 2: Catchphrase & 4-Part 3-Minute Sales Pitch */}
                <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    Phase 5, Activity 1 & 2: Catchphrase & The 3-Minute Sales Pitch
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-stone-700 block mb-0.5">Old Way of Doing Things:</label>
                        <input
                          type="text"
                          value={catchphraseOldWay}
                          onChange={(e) => setCatchphraseOldWay(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 block mb-0.5">Your Product Name:</label>
                        <input
                          type="text"
                          value={catchphraseProductName}
                          onChange={(e) => setCatchphraseProductName(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 block mb-0.5">Main Benefit:</label>
                        <input
                          type="text"
                          value={catchphraseMainBenefit}
                          onChange={(e) => setCatchphraseMainBenefit(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-700 block mb-0.5">Main Problem Avoided:</label>
                        <input
                          type="text"
                          value={catchphraseMainProblem}
                          onChange={(e) => setCatchphraseMainProblem(e.target.value)}
                          className="w-full px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-950">
                      <span className="font-bold block mb-0.5">1-Sentence Catchphrase (Value Proposition):</span>
                      <p className="italic">"{catchphraseSentence}"</p>
                    </div>
                  </div>

                  {/* 4 Timed Parts of the 3-Minute Sales Pitch */}
                  <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
                    <div className="font-bold text-stone-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-700" />
                      The 3-Minute Sales Pitch (4 Timed Parts + &lt;20s Q&A):
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="text-stone-900">Part 1 (0:00–0:45) The Problem:</strong> Explain the main problem from your diary + read a real quote from someone you interviewed in Phase 1. (Reach Part 2 by 45s!)
                      </div>
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="text-stone-900">Part 2 (0:45–1:45) The Solution:</strong> Show your working model or click through your app screens. Explain the improvements made in Version 1.1 after Silent Rule user testing.
                      </div>
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="text-stone-900">Part 3 (1:45–2:30) The Money (Business Model):</strong> Show your 4 numbers in Thai Baht (THB): Unit Cost (฿{economics.unitFloorCostTHB}), Selling Price (฿{economics.retailPriceTHB}), Profit (฿{economics.unitContributionMarginTHB}), and Break-Even ({economics.breakEvenUnits} units).
                      </div>
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="text-stone-900">Part 4 (2:30–3:00) The Next Step:</strong> Say exactly what you need to start making the real product (e.g., "We need 1,500 THB for materials" or "We need 10 testers to try the app").
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete 5-Phase / 11-Activity Reference from the PDF */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Complete 5-Phase / 11-Activity Guide (From Attached PDF)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ENTREPRENEURSHIP_PDF_ACTIVITIES.map((act) => (
                    <div key={act.id} className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                      <div className="text-[10px] font-mono uppercase text-emerald-700 font-semibold">
                        {act.phaseTitle} • {act.timeAllocation}
                      </div>
                      <div className="font-bold text-stone-900">{act.activityTitle}</div>
                      <p className="text-[11px] text-stone-600">
                        <strong>Goal:</strong> {act.goal}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        <strong>Materials:</strong> {act.materials}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gamification' && (
            <div className="space-y-5">
              {/* Level Progress Bar */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Current Venture Rank
                    </span>
                  </div>
                  <div className="text-lg font-bold text-stone-900">
                    Level {currentLevel.level}: {currentLevel.title} ({totalEarnedXP} XP)
                  </div>
                  <p className="text-xs text-stone-600">
                    Unlocked Privilege:{' '}
                    <span className="font-semibold text-emerald-800">
                      {currentLevel.privilegeUnlocked}
                    </span>
                  </p>
                </div>

                {nextLevel && (
                  <div className="text-right">
                    <div className="text-xs text-stone-500">
                      Next Tier: <strong>Level {nextLevel.level} ({nextLevel.title})</strong>
                    </div>
                    <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                      {nextLevel.minXp - totalEarnedXP} XP needed to level up
                    </div>
                  </div>
                )}
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ENTREPRENEURSHIP_BADGES.map((badge) => {
                  const isEarned = earnedBadges.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => toggleBadge(badge.id)}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isEarned
                          ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                          : 'bg-white border-stone-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-900 text-white">
                            +{badge.xpAward} XP
                          </span>
                          <span className="text-[10px] font-semibold uppercase text-stone-500">
                            {badge.unlockedAtPhase}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 mt-1">
                          {badge.icon} {badge.name}
                        </h4>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {badge.condition}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] font-semibold">
                        <span className={isEarned ? 'text-emerald-800' : 'text-stone-400'}>
                          {isEarned ? 'Unlocked (Click to toggle)' : 'Locked (Click to award)'}
                        </span>
                        <ShieldCheck
                          className={`w-4 h-4 ${
                            isEarned ? 'text-emerald-600' : 'text-stone-300'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-6 py-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            Entrepreneurship: Creating a Product • 5 Phases & 11 Activities • Thai Baht (THB) Unit Economics
          </div>
          <div className="flex items-center gap-2">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveSimulation}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Venture & THB Cost Sheet to Portfolio
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Close Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
