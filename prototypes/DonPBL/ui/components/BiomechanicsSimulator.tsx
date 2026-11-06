import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  Radio,
  Award,
  Gauge,
  Calendar,
  Wrench,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import {
  BIOMIMETIC_TRACKS,
  BIOMECHANICS_60_DAY_SCHEDULE,
  BIOMECHANICS_OLDER_STUDENT_PILLARS,
  BIOMECHANICS_GAMIFICATION_BADGES
} from '../pbl';

interface BiomechanicsSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BiomechanicsSimulator: React.FC<BiomechanicsSimulatorProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'kinematics' | 'roadmap' | 'fmea' | 'pillars'>('kinematics');

  // Mechanism & Powertrain Controls (Phase 1–4)
  const [motorRPM, setMotorRPM] = useState<number>(120); // 30 - 300 RPM
  const [gearRatio, setGearRatio] = useState<number>(40); // 12, 24, 40, 120
  const [terrainIncline, setTerrainIncline] = useState<number>(12); // -25 to +25 deg
  const [proportionalGainKp, setProportionalGainKp] = useState<number>(1.4); // 0.2 to 3.0
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-rescue');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Phase 5 FMEA & Hardening Controls (Days 46–55)
  const [steelAxleUpgrade, setSteelAxleUpgrade] = useState<boolean>(true);
  const [watchdogEnabled, setWatchdogEnabled] = useState<boolean>(true);
  const [twistedWiringAndCaps, setTwistedWiringAndCaps] = useState<boolean>(true);
  const [repairKitPacked, setRepairKitPacked] = useState<boolean>(true);

  // Animation cycle
  const [animationTick, setAnimationTick] = useState<number>(0);
  const [isMotorRunning, setIsMotorRunning] = useState<boolean>(true);

  // Active Challenge / Trial Mode
  const [activeTrial, setActiveTrial] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState<boolean>(false);

  // Gamification State
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([
    'badge-nature-scout',
    'badge-powertrain-architect'
  ]);

  // Derived Physics Calculations (Day 12: τω = P_mech)
  const outputRPM = Math.round(motorRPM / (gearRatio / 12));
  const angularVelocityOmega = ((outputRPM * 2 * Math.PI) / 60).toFixed(2); // rad/s
  const motorTorqueNcm = Math.min(180, Math.round(4.2 * (gearRatio / 10) * 1.8)); // N*cm
  const mechanicalPowerWatts = (Number(angularVelocityOmega) * (motorTorqueNcm / 100)).toFixed(2);

  // Grübler's criterion (Day 3): DOF = 3(n-1) - 2*j1 - j2 (4-bar planar mechanism: n=4, j1=4 -> DOF=1)
  const mechanismDOF = 1;

  // IMU closed-loop tilt correction (Day 24 & Day 43)
  const tiltError = terrainIncline;
  const correctionEffort = Math.min(100, Math.round(Math.abs(tiltError) * proportionalGainKp * 3.5));
  const balancedChassisAngle = Math.max(-3, Math.min(3, Math.round(terrainIncline - correctionEffort * 0.18)));

  // Phase 5 Test Runs 1–5 vs Runs 6–10 comparison (Days 47–55)
  const run1To5SuccessRate = 52;
  const run6To10SuccessRate = Math.min(
    100,
    52 +
      (steelAxleUpgrade ? 20 : 0) +
      (watchdogEnabled ? 14 : 0) +
      (twistedWiringAndCaps ? 9 : 0) +
      (repairKitPacked ? 5 : 0)
  );

  const totalXp = BIOMECHANICS_GAMIFICATION_BADGES.filter((b) => unlockedBadgeIds.includes(b.id)).reduce(
    (sum, b) => sum + b.xp,
    1250
  );

  // Animated leg motion calculation
  useEffect(() => {
    if (!isOpen || !isMotorRunning) return;

    const interval = setInterval(() => {
      setAnimationTick((prev) => (prev + 1) % 360);
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, isMotorRunning]);

  if (!isOpen) return null;

  // 4-Bar Coupler curve parametric foot trajectory (Day 18 & Day 20)
  const crankAngleRad = (animationTick * Math.PI) / 180;
  const crankRadius = 24;
  const crankX = Math.cos(crankAngleRad) * crankRadius;
  const crankY = Math.sin(crankAngleRad) * crankRadius;

  const footX = 140 + crankX * 1.5 + Math.sin(crankAngleRad * 2) * 12;
  const footY = 160 + Math.abs(Math.sin(crankAngleRad)) * 38;

  const selectedTrack = BIOMIMETIC_TRACKS.find((t) => t.id === selectedTrackId) || BIOMIMETIC_TRACKS[0];
  const currentWeekSchedule =
    BIOMECHANICS_60_DAY_SCHEDULE.find((w) => w.week === selectedWeek) || BIOMECHANICS_60_DAY_SCHEDULE[0];

  const toggleBadge = (badgeId: string) => {
    setUnlockedBadgeIds((prev) => (prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]));
  };

  // Launch trial challenge
  const handleStartTrial = (trialId: string) => {
    setActiveTrial(trialId);
    setTrialSuccess(false);

    setTimeout(() => {
      if (trialId === 'trial-rubble' && gearRatio >= 40 && proportionalGainKp >= 1.0) {
        setTrialSuccess(true);
        if (!unlockedBadgeIds.includes('badge-alpha-builder')) {
          setUnlockedBadgeIds((prev) => [...prev, 'badge-alpha-builder']);
        }
      } else if (trialId === 'trial-baleen' && motorRPM >= 100) {
        setTrialSuccess(true);
        if (!unlockedBadgeIds.includes('badge-fmea-hardened')) {
          setUnlockedBadgeIds((prev) => [...prev, 'badge-fmea-hardened']);
        }
      } else {
        setTrialSuccess(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-6xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-0.5">
              <span>60-Day / 12-Week / 120-Hour Biomechanics Studio</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-800 font-semibold">LEGO Technic + Arduino Nano (ATmega328P)</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700">Real C/C++ (millis, attachInterrupt, P/PD)</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              Quantitative Biomechanics & Bio-Inspired Robotics Workbench
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamification & Physics Status Strip */}
        <div className="bg-stone-900 text-stone-100 px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold font-mono text-white text-xs">
                {outputRPM}
              </div>
              <div>
                <span className="font-semibold text-stone-200 block">Output Drivetrain Speed</span>
                <span className="text-[10px] text-stone-400 font-mono">ω = {angularVelocityOmega} rad/s</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-semibold text-stone-200 block">Day 12 Power (P_mech = τ·ω)</span>
                <span className="text-[10px] text-amber-300 font-mono">
                  {mechanicalPowerWatts} Watts ({motorTorqueNcm} N·cm)
                </span>
              </div>
            </div>

            <div>
              <span className="text-stone-400 block text-[10px]">Day 3 Grübler Criterion</span>
              <span className="font-mono font-bold text-emerald-400">DOF = {mechanismDOF} (4-Bar Walking Leg)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-emerald-400">{totalXp} XP</div>
              <div className="text-[10px] text-stone-400 uppercase font-mono">
                {unlockedBadgeIds.length}/{BIOMECHANICS_GAMIFICATION_BADGES.length} Studio Badges Unlocked
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-stone-100 border-b border-stone-200 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('kinematics')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'kinematics'
                ? 'bg-white text-emerald-900 border-stone-200'
                : 'bg-stone-100 text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            1. 4-Bar Linkage, Gearbox & C++ IMU Lab
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'roadmap'
                ? 'bg-white text-emerald-900 border-stone-200'
                : 'bg-stone-100 text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            2. 60-Day Schedule & 3 Robot Projects (Day 26)
          </button>
          <button
            onClick={() => setActiveTab('fmea')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'fmea'
                ? 'bg-white text-emerald-900 border-stone-200'
                : 'bg-stone-100 text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-700" />
            3. Phase 5 FMEA, Steel Rods & Runs 1–10 (Days 46–55)
          </button>
          <button
            onClick={() => setActiveTab('pillars')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'pillars'
                ? 'bg-white text-emerald-900 border-stone-200'
                : 'bg-stone-100 text-stone-600 border-transparent hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            4. Older-Student Pillars & 7 Studio Badges
          </button>
        </div>

        {/* Tab 1: Kinematics, Gearbox & C++ Lab */}
        {activeTab === 'kinematics' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Physics & Mechanism Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                  Phase 2 & 4 Electromechanical Powertrain Controls
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

                {/* Gear Ratio Selector (Days 11–15) */}
                <div>
                  <div className="text-xs text-stone-700 font-semibold mb-1.5">
                    Week 3 LEGO Technic Gear System (Days 11–15):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { ratio: 12, label: '12:1 Multi-Step Spur (Day 11)' },
                      { ratio: 40, label: '40:1 Planetary Joint (Day 13)' },
                      { ratio: 24, label: '24:1 Self-Locking Worm (Day 15)' },
                      { ratio: 120, label: '120:1 Heavy Crane / Hip (Day 14)' }
                    ].map((g) => (
                      <button
                        key={g.ratio}
                        onClick={() => setGearRatio(g.ratio)}
                        className={`p-1.5 text-xs rounded border text-left transition-colors font-mono ${
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
                    <span>Ramp / Rubble Tilt Angle (Day 1 & Day 24 MPU-6050)</span>
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
                    <span>Day 43 C++ P/PD Feedback Loop Gain (Kp)</span>
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
                    <span>3.0 (Oscillation)</span>
                  </div>
                </div>
              </div>

              {/* Bio-Robotics Mastery Trials Mini-Game */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    Obstacle Course Test Bench (Days 45–51)
                  </span>
                  {activeTrial && (
                    <button
                      onClick={() => {
                        setActiveTrial(null);
                        setTrialSuccess(false);
                      }}
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
                        <span className="font-bold text-stone-900 block">
                          Day 45 Alpha Sign-Off: Rocky Rubble Climb
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Requires ≥40:1 planetary/worm gear ratio & Kp ≥1.0
                        </span>
                      </div>
                      <Play className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    </button>

                    <button
                      onClick={() => handleStartTrial('trial-baleen')}
                      className="w-full text-left p-2.5 rounded bg-white hover:bg-amber-100/60 border border-amber-200 text-xs transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">
                          Day 51 Beta Lock-Down: High-Speed Sweep Endurance
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Requires ≥100 RPM with non-blocking millis() state machine
                        </span>
                      </div>
                      <Play className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">
                        {activeTrial === 'trial-rubble'
                          ? 'Day 45 Alpha Sign-Off: Rocky Rubble Climb'
                          : 'Day 51 Beta Lock-Down: High-Speed Sweep'}
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">Evaluated</span>
                    </div>

                    {trialSuccess ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-950 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Benchmark Passed! Gearbox delivered sufficient torque without stalling.</span>
                      </div>
                    ) : (
                      <div className="p-2 bg-rose-50 border border-rose-300 rounded text-rose-950 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Stall Warning! Increase Gear Ratio to ≥40:1 or tune Kp to ≥1.0.</span>
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
                    DAY 18 & 20 GRASHOF 4-BAR LINKAGE & PEN-TRACED COUPLER PATH
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
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#262626" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="300" height="240" fill="url(#grid)" />

                    {/* Ground Plane line reflecting terrain incline */}
                    <line
                      x1="20"
                      y1={210 - terrainIncline * 1.5}
                      x2="280"
                      y2={210 + terrainIncline * 1.5}
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
                        x="85"
                        y="60"
                        width="110"
                        height="36"
                        rx="4"
                        fill="#1c1917"
                        stroke="#a8a29e"
                        strokeWidth="2"
                      />
                      <text x="93" y="82" fill="#e7e5e4" fontSize="9.5" fontFamily="monospace">
                        TECHNIC FRAME ({balancedChassisAngle}°)
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

                    {/* Foot Endpoint with Pen-Trace Marker */}
                    <circle cx={footX} cy={footY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={footX + 8} y={footY + 4} fill="#10b981" fontSize="9" fontFamily="monospace">
                      PEN TRACE
                    </text>
                  </svg>
                </div>

                {/* Telemetry Stream Footer */}
                <div className="bg-stone-900 p-2.5 rounded-lg border border-stone-800 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-stone-300">
                  <span>MPU-6050 Tilt: {balancedChassisAngle}°</span>
                  <span>H-Bridge Current: {(0.32 + (gearRatio / 120) * 0.45).toFixed(2)} A</span>
                  <span>PWM Duty: {Math.round((motorRPM / 300) * 255)} / 255</span>
                  <span className="text-emerald-400">millis() Loop: Non-Blocking</span>
                </div>
              </div>

              {/* Subsystem Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-[11px] text-stone-500 block">Day 12 Mechanical Power</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">{mechanicalPowerWatts} W</span>
                  <span className="text-[10px] text-emerald-700 block">τω = P_mech</span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-[11px] text-stone-500 block">Gearbox Stall Margin</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {gearRatio >= 24 ? 'HIGH (Safe)' : 'LOW (Slip Risk)'}
                  </span>
                  <span className="text-[10px] text-stone-400 block">{motorTorqueNcm} N·cm torque</span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-[11px] text-stone-500 block">Day 43 P/PD Balance</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {Math.abs(balancedChassisAngle) <= 5 ? 'STABLE' : 'UNSTABLE'}
                  </span>
                  <span className="text-[10px] text-purple-700 block">Kp = {proportionalGainKp}</span>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <span className="text-[11px] text-stone-500 block">Day 3 & 18 Kinematics</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">DOF = 1</span>
                  <span className="text-[10px] text-stone-400 block">Grashof 4-Bar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 60-Day Schedule & 3 Robot Projects */}
        {activeTab === 'roadmap' && (
          <div className="p-6 space-y-6">
            {/* Day 26: 3 Engineering Projects */}
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5">
                Day 26: Choose Your Engineering Project (3-Student Teams: Systems Leader, Coding/Controls Engineer, Mechanical/Building Engineer)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {BIOMIMETIC_TRACKS.map((track) => {
                  const isSelected = track.id === selectedTrack.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrackId(track.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-600 shadow-xs'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold text-xs text-stone-900 mb-1">{track.title}</div>
                      <p className="text-[11px] text-emerald-800 font-medium mb-1.5">{track.biologicalModel}</p>
                      <p className="text-[11px] text-stone-600 mb-2">{track.engineeringBrief}</p>
                      <div className="text-[10px] font-mono text-stone-500 bg-white p-2 rounded border border-stone-200">
                        <div>
                          <strong className="text-stone-700">Mechanics:</strong> {track.kinematicMechanism}
                        </div>
                        <div className="mt-1">
                          <strong className="text-stone-700">Electronics:</strong> {track.sensorsAndActuators}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 12-Week / 60-Day Selector */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Complete 12-Week / 60-Day / 120-Hour Curriculum Browser
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Click any week (Weeks 1–12) to inspect all 5 daily 2-hour hands-on builds and coding labs.
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {BIOMECHANICS_60_DAY_SCHEDULE.map((w) => (
                    <button
                      key={w.week}
                      onClick={() => setSelectedWeek(w.week)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        selectedWeek === w.week
                          ? 'bg-stone-900 text-white font-bold'
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      W{w.week}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-stone-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5 mb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-emerald-700 font-semibold block">
                      {currentWeekSchedule.phaseLabel} ({currentWeekSchedule.hoursRange})
                    </span>
                    <h4 className="text-sm font-bold text-stone-900">{currentWeekSchedule.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700">
                    Days {currentWeekSchedule.days[0].day}–{currentWeekSchedule.days[currentWeekSchedule.days.length - 1].day}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentWeekSchedule.days.map((d) => (
                    <div
                      key={d.day}
                      className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-3 text-xs"
                    >
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-mono font-bold text-[11px] shrink-0">
                        Day {d.day}
                      </span>
                      <div>
                        <span className="font-bold text-stone-900 block">{d.title}</span>
                        <p className="text-stone-600 mt-0.5 leading-relaxed">{d.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Phase 5 FMEA, Steel Rods & Runs 1–10 */}
        {activeTab === 'fmea' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                  Phase 5 Hardening Upgrades (Days 48–55)
                </h3>
                <p className="text-xs text-stone-600">
                  After Test Runs 1–5 (Day 47), teams log broken axles, stripped gears, power drops, and sensor glare in
                  their Day 48 FMEA table, then apply mechanical and C++ upgrades for Test Runs 6–10 (Day 51).
                </p>

                <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-stone-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={steelAxleUpgrade}
                    onChange={(e) => setSteelAxleUpgrade(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Day 49: Replace Bending Plastic Axles with Strong Steel Rods & Physical Stops
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Eliminates axle bending under load and stops joints from bending too far (+20% reliability).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-stone-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchdogEnabled}
                    onChange={(e) => setWatchdogEnabled(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Day 50: Crash-Proof Coding (Watchdog Timers & Automatic Unstick Moves)
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Robot automatically unsticks itself on rocky ground and never freezes (+14% reliability).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-stone-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twistedWiringAndCaps}
                    onChange={(e) => setTwistedWiringAndCaps(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Day 40 & 52: Twisted Motor Wires, Capacitors & Protective Outer Shell
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Shields inner electronics from room-light glare, water splashes, and motor spikes (+9% reliability).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-stone-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repairKitPacked}
                    onChange={(e) => setRepairKitPacked(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Day 53–55: GitHub Code Upload, Field Repair Kit & Beta Release Lock-Down
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      Spare gears, backup pre-programmed Arduino Nano boards, and multimeter ready (+5% readiness).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 uppercase block">
                      Empirical 10-Run Obstacle Course Benchmark
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      Test Runs 1–5 (Day 47) vs. Test Runs 6–10 (Day 51)
                    </h4>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-stone-300">Day 47 Test Runs 1–5 (Plastic Axles / Pre-FMEA)</span>
                      <span className="font-mono font-bold text-amber-400">{run1To5SuccessRate}% Pass Rate</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${run1To5SuccessRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-stone-300">Day 51 Test Runs 6–10 (Upgraded Robot vs Phase 3 ERD)</span>
                      <span className="font-mono font-bold text-emerald-400">{run6To10SuccessRate}% Pass Rate</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${run6To10SuccessRate}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-lg border border-stone-800 text-xs space-y-1.5">
                  <div className="font-bold text-stone-200">Day 56 Science Poster Required 6 Sections:</div>
                  <ol className="list-decimal list-inside text-stone-400 space-y-0.5 text-[11px]">
                    <li>Project Summary & Real-World Problem</li>
                    <li>Nature Inspiration (Snake/Insect, Shark/Whale, or Chameleon/Gecko)</li>
                    <li>How It Moves (Linkages, Planetary/Worm Gears, τω = P_mech)</li>
                    <li>Wiring Diagram (Fritzing/KiCad Arduino Nano + H-Bridge + Sensors)</li>
                    <li>Test Graphs (Runs 1–5 vs Runs 6–10 Speed, Load & Battery Power)</li>
                    <li>How the Design Changed (FMEA Steel Rods, Watchdog Code & Protective Shell)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: What Makes This Program Special for Older Students & 7 Badges */}
        {activeTab === 'pillars' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-700" />
                What Makes This Program Special for Older Students
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BIOMECHANICS_OLDER_STUDENT_PILLARS.map((pillar) => (
                  <div key={pillar.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="font-bold text-sm text-stone-900">{pillar.title}</div>
                    <p className="text-xs text-stone-600 leading-relaxed">{pillar.description}</p>
                    <div className="pt-1 text-[11px] font-mono text-emerald-800 bg-emerald-50/70 px-2.5 py-1.5 rounded border border-emerald-200">
                      {pillar.keyToolsAndMath}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                60-Day Biomechanics & Bio-Robotics Gamification Badges (Click to Claim/Toggle)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {BIOMECHANICS_GAMIFICATION_BADGES.map((badge) => {
                  const unlocked = unlockedBadgeIds.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => toggleBadge(badge.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        unlocked
                          ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                          : 'bg-white border-stone-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-stone-900">{badge.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-amber-300">
                          +{badge.xp} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">{badge.criteria}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
          <span>
            Quantitative Biomechanics & Bio-Inspired Robotics • 12 Weeks / 60 Days / 120 Hours (Phase 1 to Phase 6)
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
