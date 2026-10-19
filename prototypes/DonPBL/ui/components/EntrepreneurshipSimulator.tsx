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
  RotateCcw
} from 'lucide-react';
import {
  ENTREPRENEURSHIP_BADGES,
  ENTREPRENEURSHIP_LEVELS,
  ENTREPRENEURSHIP_SIMULATION_PRESETS,
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
  const [activeTab, setActiveTab] = useState<'sandbox' | 'economics' | 'gamification'>('sandbox');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.id || 'preset-solar-locker'
  );

  // Unit Economics state (Thai Baht)
  const [unitFloorCostTHB, setUnitFloorCostTHB] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.unitFloorCostTHB || 180
  );
  const [desiredGrossMarginPct, setDesiredGrossMarginPct] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.targetGrossMarginPct || 64
  );
  const [fixedStartupCapitalExpenseTHB, setFixedStartupCapitalExpenseTHB] = useState<number>(
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.fixedStartupExpenseTHB || 1500
  );

  // Market Simulation state
  const [silentRuleCompliancePct, setSilentRuleCompliancePct] = useState<number>(92);
  const [unitsToProduceBatch, setUnitsToProduceBatch] = useState<number>(12);
  const [simWeek, setSimWeek] = useState<number>(1);
  const [marketState, setMarketState] = useState({
    cashReserveTHB: ENTREPRENEURSHIP_SIMULATION_PRESETS[0]?.starterCashTHB || 5000,
    unitsProduced: 10,
    unitsSold: 8,
    adoptersReached: 8,
    marketReputationScore: 78,
    latestRevenue: 4000,
    latestCost: 1800
  });

  const [earnedBadges, setEarnedBadges] = useState<string[]>([
    'badge-friction-hunter',
    'badge-unbiased-listener',
    'badge-silent-observer',
    'badge-unit-economics-master'
  ]);

  if (!isOpen) return null;

  const activePreset =
    ENTREPRENEURSHIP_SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) ||
    ENTREPRENEURSHIP_SIMULATION_PRESETS[0];

  const economics = calculateUnitEconomics({
    unitFloorCostTHB,
    desiredGrossMarginPct,
    fixedStartupCapitalExpenseTHB
  });

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
      `Unit Floor Cost: ฿${economics.unitFloorCostTHB} THB | Retail Price: ฿${economics.retailPriceTHB} THB | Unit Contribution Margin: ฿${economics.unitContributionMarginTHB} THB (${economics.desiredGrossMarginPct}%)`,
      `Break-Even Target: ${economics.breakEvenUnits} units (Fixed Startup CapEx: ฿${fixedStartupCapitalExpenseTHB} THB)`,
      `Market Sandbox (Week ${simWeek}): ${marketState.unitsSold}/${marketState.unitsProduced} units sold | Cash Reserve: ฿${marketState.cashReserveTHB.toFixed(0)} THB | Adopters Reached: ${marketState.adoptersReached}/25`,
      `Silent Rule Compliance: ${silentRuleCompliancePct}% | Reputation Score: ${marketState.marketReputationScore}/100`,
      `Founder Gamification Rank: Level ${currentLevel.level} (${currentLevel.title} — ${totalEarnedXP} XP, ${earnedBadges.length} badges unlocked)`
    ].join('\n');

    onSaveToPortfolio(`${activePreset?.name} — Week ${simWeek} Telemetry`, summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Venture Lab: Product Creation Simulator & Startup Gamification
                </h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-300 border border-emerald-700">
                  Level {currentLevel.level}: {currentLevel.title} ({totalEarnedXP} XP)
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Simulate physical/digital product tracks, test "The Silent Rule" usability, model Thai Baht unit economics, and unlock founder badges.
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              1. Digital Twin Market Sandbox
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
              2. Unit Economics & Break-Even Lab (THB)
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
              3. Founder XP & Achievement Badges ({earnedBadges.length}/{ENTREPRENEURSHIP_BADGES.length})
            </button>
          </div>

          <span className="text-xs font-mono text-stone-600">
            Active Track:{' '}
            <strong className="text-emerald-800 uppercase">{activePreset?.track}</strong>
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
                    Select Venture Prototype Preset
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
                    Weekly Production & Silent-Rule Controls
                  </h3>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700">Batch Units to Produce / Provision</span>
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
                      <span className="text-stone-700">"The Silent Rule" Usability Score</span>
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
                      Session 11 Rule: Hand the prototype to the tester and remain 100% silent. Higher intuitive usability increases weekly customer conversion.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleRunWeeklyStep}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Simulate Next Market Week (Week {simWeek + 1})
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
                        Week {simWeek} Telemetry • {activePreset?.category}
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
                      <div className="text-[11px] text-stone-500">Cash Reserve</div>
                      <div className="text-lg font-bold text-emerald-700 font-mono">
                        ฿{Math.round(marketState.cashReserveTHB).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">Cumulative Sold</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">
                        {marketState.unitsSold} / {marketState.unitsProduced}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">25-Adopter Funnel</div>
                      <div className="text-lg font-bold text-indigo-700 font-mono">
                        {marketState.adoptersReached} / 25
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="text-[11px] text-stone-500">Market Reputation</div>
                      <div className="text-lg font-bold text-stone-900 font-mono">
                        {marketState.marketReputationScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Common Frictions to Resolve */}
                  <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                    <div className="font-bold text-stone-800">
                      Observed Silent-Rule Friction Points to Resolve:
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
                      <div className="font-bold">Venture Simulator Diagnostic</div>
                      <p className="leading-relaxed">
                        {reachedBreakEven
                          ? `Venture has sold ${marketState.unitsSold} units, surpassing the ${economics.breakEvenUnits}-unit break-even threshold and reaching ${marketState.adoptersReached} real-world adopters! Ready for the Session 16 3-Minute Angel Pitch.`
                          : `You need ${Math.max(0, economics.breakEvenUnits - marketState.unitsSold)} more unit sales to cover your ฿${fixedStartupCapitalExpenseTHB} THB startup capital expense. Run another weekly batch or improve Silent Rule usability to boost conversion.`}
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
                    Session 14: Unit Floor Cost & Margin Inputs (THB)
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Unit Floor Cost (Materials + Packaging + Compute per unit)</span>
                      <span className="font-mono font-bold">฿{unitFloorCostTHB} THB</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={600}
                      step={5}
                      value={unitFloorCostTHB}
                      onChange={(e) => setUnitFloorCostTHB(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Target Gross Margin (%)</span>
                      <span className="font-mono font-bold">{desiredGrossMarginPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={85}
                      step={5}
                      value={desiredGrossMarginPct}
                      onChange={(e) => setDesiredGrossMarginPct(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Fixed Startup Capital Expense (Tooling, Jigs, Domain, Samples)</span>
                      <span className="font-mono font-bold">
                        ฿{fixedStartupCapitalExpenseTHB} THB
                      </span>
                    </div>
                    <input
                      type="range"
                      min={300}
                      max={10000}
                      step={100}
                      value={fixedStartupCapitalExpenseTHB}
                      onChange={(e) => setFixedStartupCapitalExpenseTHB(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Calculated Unit Economics & Break-Even Output
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="text-xs text-stone-500">Recommended Retail Price</div>
                    <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                      ฿{economics.retailPriceTHB} THB
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-xs text-emerald-800">Contribution Margin / Unit</div>
                    <div className="text-xl font-bold text-emerald-900 font-mono mt-0.5">
                      ฿{economics.unitContributionMarginTHB} THB ({economics.desiredGrossMarginPct}%)
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <div className="text-xs text-indigo-800">Break-Even Sales Volume</div>
                    <div className="text-xl font-bold text-indigo-900 font-mono mt-0.5">
                      {economics.breakEvenUnits} Units
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="text-xs text-stone-500">Margin Target Status</div>
                    <div className="text-sm font-bold text-stone-900 mt-1 uppercase font-mono">
                      {economics.desiredGrossMarginPct >= 50
                        ? 'Healthy Startup Margin (≥50%)'
                        : 'Low Margin Warning (<50%)'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <strong>Formula Check:</strong> At ฿{economics.retailPriceTHB} THB retail price and ฿{economics.unitFloorCostTHB} THB floor cost, your team nets ฿{economics.unitContributionMarginTHB} THB per unit sold. You must sell <strong>{economics.breakEvenUnits} units</strong> to recover your ฿{fixedStartupCapitalExpenseTHB} THB initial setup costs.
                </p>
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
            All simulation telemetry runs 100% locally in-memory inside{' '}
            <code className="font-mono">prototypes/DonPBL/</code>.
          </div>
          <div className="flex items-center gap-2">
            {onSaveToPortfolio && (
              <button
                onClick={handleSaveSimulation}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Simulation & Unit Economics to Portfolio
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
