import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  Sun, 
  Droplets, 
  Zap, 
  Activity, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Layers,
  Heart,
  TrendingUp,
  Sliders,
  DollarSign,
  Radio,
  Sparkles
} from 'lucide-react';
import { HEX_CITY_ROLES, CRISIS_SCENARIOS, CrisisScenario } from '../pbl';

interface HexCitySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HexCitySimulator: React.FC<HexCitySimulatorProps> = ({ isOpen, onClose }) => {
  // Environmental sliders
  const [waveHeight, setWaveHeight] = useState<number>(1.8); // meters (0.5 to 5.5m)
  const [solarIrradiance, setSolarIrradiance] = useState<number>(85); // % (10% to 100%)
  const [citizenPopulation, setCitizenPopulation] = useState<number>(2000); // 500 to 2500 citizens

  // Platform sub-states
  const [counterBallastActive, setCounterBallastActive] = useState<boolean>(false);
  const [emergencyCutoverActive, setEmergencyCutoverActive] = useState<boolean>(false);
  const [waterIsolationActive, setWaterIsolationActive] = useState<boolean>(false);
  const [selectedHexSector, setSelectedHexSector] = useState<string>('core');

  // Crisis mode
  const [activeCrisis, setActiveCrisis] = useState<CrisisScenario | null>(null);
  const [crisisResolved, setCrisisResolved] = useState<boolean>(false);

  // Gamification state
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(['🏛️ Master City Architect']);
  const [xpPoints, setXpPoints] = useState<number>(1250);

  // Derived real-time simulations
  const baseFreeboard = 45; // cm at 1:2500 model scale
  const currentFreeboard = Math.max(
    12,
    Math.round(baseFreeboard - (waveHeight * 5.2) + (counterBallastActive ? 4 : 0))
  );

  const solarGenMWh = Math.round((solarIrradiance / 100) * 58); // MWh/day
  const loadConsumptionMWh = emergencyCutoverActive ? 22 : 46; // MWh/day
  const netPowerDelta = solarGenMWh - loadConsumptionMWh;
  const batteryLevelPct = Math.min(100, Math.max(15, 60 + (netPowerDelta * 1.5)));

  const waterPurificationLiters = waterIsolationActive ? 280000 : 340000;
  const waterConsumptionLiters = citizenPopulation * 140; // 140 L/citizen/day
  const waterReserveDays = Math.max(2, Math.round(18 - (waterConsumptionLiters / 30000)));

  // Live calculated resilience score (0-100)
  const calculateResilienceScore = () => {
    let score = 70;
    if (currentFreeboard >= 25) score += 10;
    if (batteryLevelPct >= 40) score += 10;
    if (waterReserveDays >= 7) score += 10;
    if (activeCrisis && !crisisResolved) score -= 30;
    if (counterBallastActive) score += 5;
    if (emergencyCutoverActive) score += 5;
    return Math.min(100, Math.max(20, score));
  };

  const resilienceScore = calculateResilienceScore();
  const citizenHappiness = Math.min(
    100,
    Math.max(25, Math.round(resilienceScore * 0.9 + (emergencyCutoverActive ? -5 : 5)))
  );

  // Trigger Crisis
  const handleTriggerCrisis = (scenario: CrisisScenario) => {
    setActiveCrisis(scenario);
    setCrisisResolved(false);
  };

  // Solve Crisis
  const handleResolveCrisis = () => {
    if (!activeCrisis) return;

    if (activeCrisis.id === 'scenario-barge') setCounterBallastActive(true);
    if (activeCrisis.id === 'scenario-blackout') setEmergencyCutoverActive(true);
    if (activeCrisis.id === 'scenario-pathogen') setWaterIsolationActive(true);

    setCrisisResolved(true);
    if (!unlockedBadges.includes(activeCrisis.rewardBadge)) {
      setUnlockedBadges((prev) => [...prev, activeCrisis.rewardBadge]);
      setXpPoints((prev) => prev + 500);
    }
  };

  const handleResetCrisis = () => {
    setActiveCrisis(null);
    setCrisisResolved(false);
    setCounterBallastActive(false);
    setEmergencyCutoverActive(false);
    setWaterIsolationActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-5xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
              <span>Hex-City Thailand Digital Twin</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-800 font-semibold">Scale 1:2500 Physics & Gamification Engine</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700">Chao Phraya / Gulf of Thailand</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              Modular Floating City Simulation Sandbox
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamification Bar (XP, Resilience, Citizen Happiness, Badges) */}
        <div className="bg-stone-900 text-stone-100 px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            {/* Resilience Gauge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold font-mono text-white text-xs">
                {resilienceScore}%
              </div>
              <div>
                <span className="font-semibold text-stone-200 block">City Resilience Rating</span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {resilienceScore >= 80 ? 'HIGH STABILITY' : resilienceScore >= 50 ? 'STRESSED' : 'CRITICAL BREACH'}
                </span>
              </div>
            </div>

            {/* Citizen Happiness */}
            <div className="flex items-center gap-2">
              <Heart className={`w-5 h-5 ${citizenHappiness >= 75 ? 'text-rose-400' : 'text-amber-400'}`} />
              <div>
                <span className="font-semibold text-stone-200 block">Citizen Survival & Morale</span>
                <span className="text-[10px] text-stone-400 font-mono">{citizenHappiness}% approval</span>
              </div>
            </div>

            {/* Turnkey BOQ Investment Tracker */}
            <div>
              <span className="text-stone-400 block text-[10px]">Turnkey BOQ Investment</span>
              <span className="font-mono font-bold text-amber-300">2,094,300,000 THB</span>
            </div>
          </div>

          {/* Gamification Level & Badges */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-emerald-400">{xpPoints} XP</div>
              <div className="text-[10px] text-stone-400 uppercase font-mono">Level 4: Master Marine Architect</div>
            </div>

            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded border border-stone-700">
              {unlockedBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-stone-700 text-amber-200 border border-stone-600"
                  title="Achievement Unlocked"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Sandbox Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Environmental Physics Sliders & Crisis Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Environmental Sliders */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                Tropical Environment Physics Controls
              </h3>

              {/* Wave Height Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>Wave Height / Storm Surge (Gulf Swell)</span>
                  <span className="font-bold font-mono text-stone-900">{waveHeight} m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.5"
                  step="0.1"
                  value={waveHeight}
                  onChange={(e) => setWaveHeight(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                  <span>0.5m (Calm Delta)</span>
                  <span className="text-blue-800 font-medium">Freeboard: {currentFreeboard} cm</span>
                  <span>5.5m (Severe Typhoon)</span>
                </div>
              </div>

              {/* Solar Irradiance Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>Solar Irradiance / Monsoon Cloud Cover</span>
                  <span className="font-bold font-mono text-stone-900">{solarIrradiance}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={solarIrradiance}
                  onChange={(e) => setSolarIrradiance(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                  <span>10% (Monsoon Blackout)</span>
                  <span className="text-amber-800 font-medium">Gen: {solarGenMWh} MWh/day</span>
                  <span>100% (Direct Sun)</span>
                </div>
              </div>

              {/* Population Load */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>Citizen Population Load</span>
                  <span className="font-bold font-mono text-stone-900">{citizenPopulation} citizens</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="100"
                  value={citizenPopulation}
                  onChange={(e) => setCitizenPopulation(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            {/* Disaster Stress-Testing Challenge Mini-Game */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  Week 9 Disaster Stress-Testing Challenges
                </span>
                {activeCrisis && (
                  <button
                    onClick={handleResetCrisis}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                  >
                    Reset Crisis
                  </button>
                )}
              </div>

              {!activeCrisis ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-stone-600">
                    Test your floating city against the 3 official crisis scenarios from Week 9:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {CRISIS_SCENARIOS.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => handleTriggerCrisis(sc)}
                        className="text-left p-2.5 rounded bg-white hover:bg-amber-100/60 border border-amber-200 text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-stone-900 block">{sc.title}</span>
                          <span className="text-[10px] text-stone-500 line-clamp-1">{sc.description}</span>
                        </div>
                        <Play className="w-3.5 h-3.5 text-amber-700 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">{activeCrisis.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-100 text-rose-800">
                      {activeCrisis.severity}
                    </span>
                  </div>

                  <p className="text-stone-700 leading-relaxed text-[11px]">{activeCrisis.description}</p>

                  <div className="bg-stone-50 p-2 rounded border border-stone-200 text-[11px] space-y-1">
                    <div>
                      <strong className="text-stone-900">Required Manual Override:</strong>{' '}
                      <span className="text-stone-700">{activeCrisis.manualOverrideRequired}</span>
                    </div>
                  </div>

                  {!crisisResolved ? (
                    <button
                      onClick={handleResolveCrisis}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Execute Manual Emergency Override
                    </button>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 font-medium text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Crisis successfully mitigated! Achievement unlocked: <strong>{activeCrisis.rewardBadge}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Override Controls */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-800 block text-xs">
                Manual Analog Override Switches (Session 15-17):
              </span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counterBallastActive}
                    onChange={(e) => setCounterBallastActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Manual Counter-Ballast Water Trim Valves (Prevents Tipping)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyCutoverActive}
                    onChange={(e) => setEmergencyCutoverActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Manual Grid Cutover Switch (Sheds Farm Lights, Powers Clinic)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waterIsolationActive}
                    onChange={(e) => setWaterIsolationActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Mechanical Water Isolation Valve (Airlock Quarantine Active)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: 7-Hex Modular Cluster Visualizer & Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Visualizer Frame */}
            <div className="bg-stone-950 rounded-xl p-5 border border-stone-800 text-stone-200 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3 border-b border-stone-800 pb-2">
                <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  HEX-CITY CLUSTER DIGITAL TWIN (1:2500 Scale)
                </span>
                <span className="font-mono text-[11px] text-stone-500">
                  Flat-to-Flat: 120 cm (3.0 km Full)
                </span>
              </div>

              {/* Hexagonal Isometric Visual Map */}
              <div className="py-6 flex items-center justify-center relative min-h-[300px]">
                {/* Visual Water Wave Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* 7 Hexagons Arrangement (Center + 6 Surrounding) */}
                <div className="relative w-72 h-72 flex items-center justify-center">
                  {/* Central Core: Civic & Temple Hub */}
                  <button
                    onClick={() => setSelectedHexSector('core')}
                    className={`absolute w-20 h-24 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all z-20 ${
                      selectedHexSector === 'core'
                        ? 'bg-purple-900/90 border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105'
                        : 'bg-stone-900 border-purple-800/60 text-purple-300 hover:border-purple-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">CORE</span>
                    <span className="text-[9px] text-purple-200">Civic Sala</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 mt-1" />
                  </button>

                  {/* Hex 1: Top (Energy & Solar Grid) */}
                  <button
                    onClick={() => setSelectedHexSector('energy')}
                    className={`absolute top-0 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'energy'
                        ? 'bg-amber-900/90 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                        : 'bg-stone-900 border-amber-700/60 text-amber-300 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">ENERGY</span>
                    <span className="text-[9px] text-amber-200">150k Solar</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shadow-[0_0_6px_#f59e0b]" />
                  </button>

                  {/* Hex 2: Top-Right (Food & Agriculture) */}
                  <button
                    onClick={() => setSelectedHexSector('food')}
                    className={`absolute top-8 right-2 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'food'
                        ? 'bg-emerald-900/90 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
                        : 'bg-stone-900 border-emerald-700/60 text-emerald-300 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">AGRI</span>
                    <span className="text-[9px] text-emerald-200">1.2k Towers</span>
                    <span className={`w-2 h-2 rounded-full ${emergencyCutoverActive ? 'bg-stone-600' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'} mt-1`} />
                  </button>

                  {/* Hex 3: Bottom-Right (Water & Waste) */}
                  <button
                    onClick={() => setSelectedHexSector('water')}
                    className={`absolute bottom-8 right-2 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'water'
                        ? 'bg-blue-900/90 border-blue-400 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                        : 'bg-stone-900 border-blue-700/60 text-blue-300 hover:border-blue-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">WATER</span>
                    <span className="text-[9px] text-blue-200">Bio-Filters</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shadow-[0_0_6px_#3b82f6]" />
                  </button>

                  {/* Hex 4: Bottom (Living Pods A) */}
                  <button
                    onClick={() => setSelectedHexSector('living-a')}
                    className={`absolute bottom-0 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'living-a'
                        ? 'bg-stone-800 border-stone-300 text-white shadow-md scale-105'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">LIVING A</span>
                    <span className="text-[9px] text-stone-400">250 Pods</span>
                    <span className="w-2 h-2 rounded-full bg-stone-300 mt-1" />
                  </button>

                  {/* Hex 5: Bottom-Left (Living Pods B) */}
                  <button
                    onClick={() => setSelectedHexSector('living-b')}
                    className={`absolute bottom-8 left-2 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'living-b'
                        ? 'bg-stone-800 border-stone-300 text-white shadow-md scale-105'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">LIVING B</span>
                    <span className="text-[9px] text-stone-400">250 Pods</span>
                    <span className="w-2 h-2 rounded-full bg-stone-300 mt-1" />
                  </button>

                  {/* Hex 6: Top-Left (Medical Clinic & Biosecurity) */}
                  <button
                    onClick={() => setSelectedHexSector('clinic')}
                    className={`absolute top-8 left-2 w-20 h-22 flex flex-col items-center justify-center text-center p-1 rounded-lg border transition-all ${
                      selectedHexSector === 'clinic'
                        ? 'bg-red-900/90 border-red-400 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105'
                        : 'bg-stone-900 border-red-700/60 text-red-300 hover:border-red-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">CLINIC</span>
                    <span className="text-[9px] text-red-200">Airlock H</span>
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shadow-[0_0_6px_#ef4444]" />
                  </button>
                </div>
              </div>

              {/* Sector Detail Card */}
              <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-400 uppercase font-mono">
                    Sector Inspector: {selectedHexSector.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    3D Printed Shear Connector: LOCKED (0.4° flex)
                  </span>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  {selectedHexSector === 'energy' && 'Houses 150,000 marine monocrystalline panels and 40 MWh LiFePO4 battery storage banks low in hull caisson.'}
                  {selectedHexSector === 'food' && '1,200 multi-tier vertical farming towers and spirulina micro-algae photobioreactors producing 1.8 kg food/citizen daily.'}
                  {selectedHexSector === 'water' && 'Closed-loop multi-stage sand, gravel, and activated biochar filtration with continuous turbidity spectrometry.'}
                  {selectedHexSector === 'clinic' && 'Negative-pressure infectious disease isolation ward, sterile triage bay, and emergency airlift helipad.'}
                  {selectedHexSector === 'core' && 'Central civic community sala, cultural spiritual pavilion, and main emergency command post.'}
                  {(selectedHexSector === 'living-a' || selectedHexSector === 'living-b') && 'Modular living pods insulated with acoustic dampening foam to isolate from generator noise.'}
                </p>
              </div>
            </div>

            {/* Subsystem Live Telemetry Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Freeboard Margin</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{currentFreeboard} cm</span>
                <span className="text-[10px] text-emerald-700 block">≥25 cm required</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Solar Net Flow</span>
                <span className={`font-mono font-bold text-sm ${netPowerDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {netPowerDelta >= 0 ? `+${netPowerDelta}` : netPowerDelta} MWh/d
                </span>
                <span className="text-[10px] text-stone-400 block">LiFePO4: {batteryLevelPct}%</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Water Reserves</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{waterReserveDays} Days</span>
                <span className="text-[10px] text-blue-700 block">{waterPurificationLiters.toLocaleString()} L/d</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Catenary Tension</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {Math.round(42 + waveHeight * 8.5)} kN
                </span>
                <span className="text-[10px] text-stone-400 block">6 Corner Ports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <span>
            Hex-City Thailand Simulation Engine: Sourced from WeLearn 12-Week Modular Resilient Floating City PBL.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white font-medium rounded-md hover:bg-stone-800 transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
