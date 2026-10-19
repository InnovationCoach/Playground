import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  RotateCw, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Layers, 
  Cpu, 
  Radio, 
  Award,
  ChevronRight,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { BIOMIMETIC_TRACKS, BiomimeticTrack } from '../pbl';

interface BiomechanicsSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BiomechanicsSimulator: React.FC<BiomechanicsSimulatorProps> = ({ isOpen, onClose }) => {
  // Mechanism & Powertrain Controls
  const [motorRPM, setMotorRPM] = useState<number>(120); // 30 - 300 RPM
  const [gearRatio, setGearRatio] = useState<number>(40); // 1, 12, 40, 120
  const [terrainIncline, setTerrainIncline] = useState<number>(12); // -25 to +25 deg
  const [proportionalGainKp, setProportionalGainKp] = useState<number>(1.4); // 0.2 to 3.0
  const [selectedTrack, setSelectedTrack] = useState<string>('track-rescue');

  // Animation cycle
  const [animationTick, setAnimationTick] = useState<number>(0);
  const [isMotorRunning, setIsMotorRunning] = useState<boolean>(true);

  // Active Challenge / Trial Mode
  const [activeTrial, setActiveTrial] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState<boolean>(false);

  // Gamification State
  const [xpScore, setXpScore] = useState<number>(1850);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([
    '🦗 Klann Kinematics Wizard',
    '🐜 Mandible Torque Champion'
  ]);

  // Derived Physics Calculations
  const outputRPM = Math.round(motorRPM / (gearRatio / 12));
  const angularVelocityOmega = ((outputRPM * 2 * Math.PI) / 60).toFixed(2); // rad/s
  const motorTorqueNcm = Math.min(180, Math.round(4.2 * (gearRatio / 10) * 1.8)); // N*cm
  const mechanicalPowerWatts = ((Number(angularVelocityOmega) * (motorTorqueNcm / 100))).toFixed(2);

  // Grübler's criterion: DOF = 3(n-1) - 2*j1 - j2 (4-bar planar mechanism: n=4, j1=4 -> DOF=1)
  const mechanismDOF = 1;

  // IMU closed-loop tilt correction
  const tiltError = terrainIncline;
  const correctionEffort = Math.min(100, Math.round(Math.abs(tiltError) * proportionalGainKp * 3.5));
  const balancedChassisAngle = Math.max(-3, Math.min(3, Math.round(terrainIncline - (correctionEffort * 0.18))));

  // Animated leg motion calculation
  useEffect(() => {
    if (!isOpen || !isMotorRunning) return;

    const interval = setInterval(() => {
      setAnimationTick((prev) => (prev + 1) % 360);
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, isMotorRunning]);

  if (!isOpen) return null;

  // 4-Bar Coupler curve parametric foot trajectory
  const crankAngleRad = (animationTick * Math.PI) / 180;
  const crankRadius = 24;
  const crankX = Math.cos(crankAngleRad) * crankRadius;
  const crankY = Math.sin(crankAngleRad) * crankRadius;

  // Foot endpoint coordinates for 4-bar linkage
  const footX = 140 + crankX * 1.5 + Math.sin(crankAngleRad * 2) * 12;
  const footY = 160 + Math.abs(Math.sin(crankAngleRad)) * 38;

  // Launch trial challenge
  const handleStartTrial = (trialId: string) => {
    setActiveTrial(trialId);
    setTrialSuccess(false);

    // Evaluate trial success conditions
    setTimeout(() => {
      if (trialId === 'trial-rubble' && gearRatio >= 40 && proportionalGainKp >= 1.0) {
        setTrialSuccess(true);
        if (!unlockedBadges.includes('🦎 Gecko Adhesion Master')) {
          setUnlockedBadges((prev) => [...prev, '🦎 Gecko Adhesion Master']);
          setXpScore((prev) => prev + 600);
        }
      } else if (trialId === 'trial-baleen' && motorRPM >= 100) {
        setTrialSuccess(true);
        if (!unlockedBadges.includes('🤖 FMEA Hardened Engineer')) {
          setUnlockedBadges((prev) => [...prev, '🤖 FMEA Hardened Engineer']);
          setXpScore((prev) => prev + 600);
        }
      } else {
        setTrialSuccess(false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-5xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
              <span>Quantitative Biomechanics Digital Twin</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-800 font-semibold">LEGO Technic + Arduino Nano Kinematics</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700">Non-Blocking C++ Closed-Loop</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              Biomimetic Linkage & Powertrain Simulation Workbench
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamification Status Strip */}
        <div className="bg-stone-900 text-stone-100 px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold font-mono text-white text-xs">
                {outputRPM}
              </div>
              <div>
                <span className="font-semibold text-stone-200 block">Output Drivetrain Speed</span>
                <span className="text-[10px] text-stone-400 font-mono">
                  ω = {angularVelocityOmega} rad/s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-semibold text-stone-200 block">Mechanical Power (P = τ·ω)</span>
                <span className="text-[10px] text-amber-300 font-mono">
                  {mechanicalPowerWatts} Watts ({motorTorqueNcm} N·cm)
                </span>
              </div>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px]">Grübler Criterion Mobility</span>
              <span className="font-mono font-bold text-emerald-400">DOF = {mechanismDOF} (Single Motor Drive)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-emerald-400">{xpScore} XP</div>
              <div className="text-[10px] text-stone-400 uppercase font-mono">Level 5: Systems Engineer</div>
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

        {/* Main Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Physics & Mechanism Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Mechanism & Powertrain Controls */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                Electromechanical Powertrain Controls
              </h3>

              {/* Motor RPM Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>DC Motor Input Speed (PWM)</span>
                  <span className="font-bold font-mono text-stone-900">{motorRPM} RPM</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={motorRPM}
                  onChange={(e) => setMotorRPM(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Gear Ratio Selector */}
              <div>
                <div className="text-xs text-stone-700 font-semibold mb-1.5">
                  Technic Gear Transmission Ratio:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { ratio: 12, label: '12:1 Spur' },
                    { ratio: 40, label: '40:1 Epicyclic' },
                    { ratio: 120, label: '120:1 High-Torque' },
                    { ratio: 24, label: '24:1 Worm (Lock)' }
                  ].map((g) => (
                    <button
                      key={g.ratio}
                      onClick={() => setGearRatio(g.ratio)}
                      className={`p-1.5 text-xs rounded border text-center transition-colors font-mono ${
                        gearRatio === g.ratio
                          ? 'bg-emerald-700 text-white font-bold border-emerald-800'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incline / Rubble Terrain Angle */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>Terrain Rubble Incline (Tilt Load)</span>
                  <span className="font-bold font-mono text-stone-900">{terrainIncline}°</span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  step="1"
                  value={terrainIncline}
                  onChange={(e) => setTerrainIncline(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Proportional Gain Kp Slider */}
              <div>
                <div className="flex justify-between text-xs text-stone-700 mb-1">
                  <span>Proportional Closed-Loop Gain (Kp)</span>
                  <span className="font-bold font-mono text-stone-900">{proportionalGainKp.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={proportionalGainKp}
                  onChange={(e) => setProportionalGainKp(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                  <span>0.2 (Sluggish)</span>
                  <span className="font-medium text-purple-800">Effort: {correctionEffort}% PWM</span>
                  <span>3.0 (Aggressive Oscillation)</span>
                </div>
              </div>
            </div>

            {/* Bio-Robotics Mastery Trials Mini-Game */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700" />
                  Engineering Benchmark Trials (Week 12-13)
                </span>
                {activeTrial && (
                  <button
                    onClick={() => { setActiveTrial(null); setTrialSuccess(false); }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                  >
                    Reset Trial
                  </button>
                )}
              </div>

              {!activeTrial ? (
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleStartTrial('trial-rubble')}
                    className="w-full text-left p-2.5 rounded bg-white hover:bg-amber-100/60 border border-amber-200 text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">Trial 1: Rubble Obstacle Course</span>
                      <span className="text-[10px] text-stone-500">Requires ≥40:1 ratio & Kp ≥1.0 to climb 15° rubble</span>
                    </div>
                    <Play className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  </button>

                  <button
                    onClick={() => handleStartTrial('trial-baleen')}
                    className="w-full text-left p-2.5 rounded bg-white hover:bg-amber-100/60 border border-amber-200 text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">Trial 2: High-Speed Vortex Endurance</span>
                      <span className="text-[10px] text-stone-500">Continuous 120 RPM reciprocating sweep without gear bind</span>
                    </div>
                    <Play className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">
                      {activeTrial === 'trial-rubble' ? 'Trial 1: Rubble Obstacle Climb' : 'Trial 2: Vortex Endurance'}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">Testing...</span>
                  </div>

                  {trialSuccess ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Benchmark Passed! Gearbox delivered sufficient torque without stalling.</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-50 border border-rose-300 rounded text-rose-950 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Stall Warning! Increase Gear Ratio to ≥40:1 or tune Kp to stabilize.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Kinematic Linkage Canvas & Telemetry (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-stone-950 rounded-xl p-5 border border-stone-800 text-stone-200 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-2 border-b border-stone-800 pb-2">
                <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  KINEMATIC COUPLER CURVE & 4-BAR GAIT SOLVER
                </span>
                <button
                  onClick={() => setIsMotorRunning(!isMotorRunning)}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                >
                  {isMotorRunning ? 'Pause Motion' : 'Run Motion'}
                </button>
              </div>

              {/* Linkage Canvas Drawing */}
              <div className="relative h-64 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 300 240">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#262626" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="300" height="240" fill="url(#grid)" />

                  {/* Ground Plane line reflecting terrain incline */}
                  <line
                    x1="20"
                    y1={210 - (terrainIncline * 1.5)}
                    x2="280"
                    y2={210 + (terrainIncline * 1.5)}
                    stroke="#525252"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* Coupler Curve Ellipse (Foot trajectory path) */}
                  <ellipse
                    cx="140"
                    cy="185"
                    rx="38"
                    ry="20"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />

                  {/* Robot Main Chassis Box */}
                  <g transform={`rotate(${balancedChassisAngle}, 140, 80)`}>
                    <rect
                      x="90"
                      y="60"
                      width="100"
                      height="36"
                      rx="4"
                      fill="#1c1917"
                      stroke="#a8a29e"
                      strokeWidth="2"
                    />
                    <text x="100" y="82" fill="#e7e5e4" fontSize="10" fontFamily="monospace">
                      CHASSIS ({balancedChassisAngle}°)
                    </text>
                  </g>

                  {/* Crank Link (Rotating from motor) */}
                  <line
                    x1="140"
                    y1="80"
                    x2={140 + crankX}
                    y2={80 + crankY}
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Connecting Coupler Link */}
                  <line
                    x1={140 + crankX}
                    y1={80 + crankY}
                    x2={footX}
                    y2={footY}
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Rocker Link */}
                  <line
                    x1="180"
                    y1="90"
                    x2={footX}
                    y2={footY}
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Joint Pivot Points */}
                  <circle cx="140" cy="80" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                  <circle cx={140 + crankX} cy={80 + crankY} r="3.5" fill="#f59e0b" />
                  <circle cx="180" cy="90" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />

                  {/* Foot Endpoint with Contact Sensor */}
                  <circle cx={footX} cy={footY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={footX + 8} y={footY + 4} fill="#10b981" fontSize="9" fontFamily="monospace">
                    FOOT
                  </text>
                </svg>
              </div>

              {/* Telemetry Stream Footer */}
              <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800 text-[11px] font-mono flex items-center justify-between text-stone-300">
                <span>MPU-6050 IMU Pitch: {balancedChassisAngle}°</span>
                <span>Motor Current: {(0.32 + (gearRatio / 120) * 0.45).toFixed(2)} A</span>
                <span>PWM Duty: {Math.round((motorRPM / 300) * 255)} / 255</span>
              </div>
            </div>

            {/* Subsystem Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Mechanical Power</span>
                <span className="font-mono font-bold text-stone-900 text-sm">{mechanicalPowerWatts} W</span>
                <span className="text-[10px] text-emerald-700 block">P = τ · ω verified</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Stall Margin</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {gearRatio >= 40 ? 'HIGH (Safe)' : 'LOW (Risk)'}
                </span>
                <span className="text-[10px] text-stone-400 block">{motorTorqueNcm} N·cm torque</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">IMU Balance Stability</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {Math.abs(balancedChassisAngle) <= 5 ? 'STABLE' : 'UNSTABLE'}
                </span>
                <span className="text-[10px] text-purple-700 block">Kp = {proportionalGainKp}</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Grübler Kinematics</span>
                <span className="font-mono font-bold text-stone-900 text-sm">DOF = 1</span>
                <span className="text-[10px] text-stone-400 block">Grashof Crank-Rocker</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <span>
            Quantitative Biomechanics: Sourced from WeLearn 140-Hour Biomimetic Robotics Curriculum.
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
