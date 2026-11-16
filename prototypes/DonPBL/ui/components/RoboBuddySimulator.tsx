import React, { useState, useMemo } from 'react';
import {
  X,
  Cpu,
  Bot,
  Sliders,
  Heart,
  Bell,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Wrench,
  Sparkles,
  Sun,
  Hand
} from 'lucide-react';
import {
  ROBO_BUDDY_DELIVERABLES,
  ROBO_BUDDY_HARDWARE_TABLE,
  ROBO_BUDDY_WEEKLY_RHYTHM,
  ROBO_BUDDY_TEAM_ROLES,
  ROBO_BUDDY_12_WEEK_CURRICULUM,
  ROBO_BUDDY_PINOUT_GUIDE,
  ROBO_BUDDY_MTC_RUBRIC,
  ROBO_BUDDY_GAMIFICATION_BADGES,
  simulateRoboBuddyCompanion
} from '../pbl';

interface RoboBuddySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const RoboBuddySimulator: React.FC<RoboBuddySimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  const [activeTab, setActiveTab] = useState<'gait-tamagotchi' | 'hardware-pinout' | 'curriculum-roles' | 'rubric-badges'>('gait-tamagotchi');

  // Simulator controls
  const [hardwareVersion, setHardwareVersion] = useState<'microbit' | 'arduino-nano'>('microbit');
  const [leftHipAngleDeg, setLeftHipAngleDeg] = useState<number>(90);
  const [rightHipAngleDeg, setRightHipAngleDeg] = useState<number>(90);
  const [leftFootAngleDeg, setLeftFootAngleDeg] = useState<number>(90);
  const [rightFootAngleDeg, setRightFootAngleDeg] = useState<number>(90);
  const [servosCenteredBeforeAssembly, setServosCenteredBeforeAssembly] = useState<boolean>(true);
  const [batteryPackUsed, setBatteryPackUsed] = useState<'4xaa_6v_external' | 'usb_computer_only'>('4xaa_6v_external');
  const [rubberFootGripsAdded, setRubberFootGripsAdded] = useState<boolean>(true);
  const [cablesZipTied, setCablesZipTied] = useState<boolean>(true);

  // Tamagotchi & Smart Alarm controls
  const [hoursSinceLastFed, setHoursSinceLastFed] = useState<number>(2);
  const [hoursSinceLastPetted, setHoursSinceLastPetted] = useState<number>(2);
  const [touchPetEventsCount, setTouchPetEventsCount] = useState<number>(2);
  const [lightFeedEventsCount, setLightFeedEventsCount] = useState<number>(2);
  const [alarmTriggered, setAlarmTriggered] = useState<boolean>(false);
  const [dismissHeadTouches, setDismissHeadTouches] = useState<number>(3);
  const [ultrasonicWaveDistanceCm, setUltrasonicWaveDistanceCm] = useState<number>(12);

  // Week 10 40-Test Benchmark
  const [walkingTestsPassedOf20, setWalkingTestsPassedOf20] = useState<number>(18);
  const [alarmTestsPassedOf10, setAlarmTestsPassedOf10] = useState<number>(9);
  const [sensorCareTestsPassedOf10, setSensorCareTestsPassedOf10] = useState<number>(9);

  // Selected week in curriculum browser
  const [selectedWeek, setSelectedWeek] = useState<number>(7);
  const [claimedBadges, setClaimedBadges] = useState<string[]>([
    'badge-rb-90deg-whisperer',
    'badge-rb-bipedal-walker'
  ]);

  const sim = useMemo(
    () =>
      simulateRoboBuddyCompanion({
        hardwareVersion,
        leftHipAngleDeg,
        rightHipAngleDeg,
        leftFootAngleDeg,
        rightFootAngleDeg,
        servosCenteredBeforeAssembly,
        batteryPackUsed,
        rubberFootGripsAdded,
        cablesZipTied,
        hoursSinceLastFed,
        hoursSinceLastPetted,
        touchPetEventsCount,
        lightFeedEventsCount,
        alarmTriggered,
        dismissHeadTouches,
        ultrasonicWaveDistanceCm,
        walkingTestsPassedOf20,
        alarmTestsPassedOf10,
        sensorCareTestsPassedOf10
      }),
    [
      hardwareVersion,
      leftHipAngleDeg,
      rightHipAngleDeg,
      leftFootAngleDeg,
      rightFootAngleDeg,
      servosCenteredBeforeAssembly,
      batteryPackUsed,
      rubberFootGripsAdded,
      cablesZipTied,
      hoursSinceLastFed,
      hoursSinceLastPetted,
      touchPetEventsCount,
      lightFeedEventsCount,
      alarmTriggered,
      dismissHeadTouches,
      ultrasonicWaveDistanceCm,
      walkingTestsPassedOf20,
      alarmTestsPassedOf10,
      sensorCareTestsPassedOf10
    ]
  );

  if (!isOpen) return null;

  const currentWeekObj =
    ROBO_BUDDY_12_WEEK_CURRICULUM.find((w) => w.week === selectedWeek) ||
    ROBO_BUDDY_12_WEEK_CURRICULUM[0];

  const moodFaceAscii: Record<string, string> = {
    Happy: '( ^_^ )  ♥',
    Hungry: '( O_O )  🍔?',
    Sleepy: '( -_- )  zzZ',
    Bored: '( ._. )  ...',
    'Alarm Ringing': '⚡( !O! )⚡ BEEP!'
  };

  const toggleBadge = (id: string) => {
    setClaimedBadges((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleSaveEvidence = () => {
    if (!onSaveToPortfolio) return;
    const title = `Robo-Buddy Companion V2.0 Lab (${hardwareVersion === 'microbit' ? 'Version A: micro:bit V2' : 'Version B: Arduino Nano'})`;
    const summary = [
      `Hardware Track: ${hardwareVersion === 'microbit' ? 'Version A (BBC micro:bit V2 + INEX PROJECT:BIT)' : 'Version B (Arduino Nano + I/O Shield)'}`,
      `4-Servo Posture Trim: LH=${sim.leftHipAngleDeg}°, RH=${sim.rightHipAngleDeg}°, LF=${sim.leftFootAngleDeg}°, RF=${sim.rightFootAngleDeg}° (Stability: ${sim.postureStabilityScore}/100, Bench Test 1: ${sim.benchTest1Passed ? 'PASSED' : 'NEEDS TRIM'})`,
      `Tamagotchi Virtual Pet Brain: Mood=${sim.currentMood} | Hunger=${sim.hungerStat}/100, Happiness=${sim.happinessStat}/100, Energy=${sim.energyStat}/100 (Bench Test 2: ${sim.benchTest2Passed ? 'PASSED' : 'PENDING'})`,
      `Smart Alarm & Dismiss Rule: ${alarmTriggered ? (sim.alarmDismissed ? 'Triggered & Dismissed via Head Touch x3 / Wave <=15cm' : 'Ringing — awaiting 3 touches or <=15cm wave') : 'Standby'}`,
      `Week 10 40-Point Benchmark: ${sim.totalBenchmarkPassedOf40}/40 (${sim.benchmarkPassRatePct}%) — Walk ${sim.walkPassed}/20, Alarm ${sim.alarmPassed}/10, Sensor Care ${sim.sensorPassed}/10 | Prototype V2.0 Ready: ${sim.prototypeV2Ready ? 'YES' : 'NO'}`
    ].join('\n');
    onSaveToPortfolio(title, summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-indigo-950 text-white px-5 py-4 flex items-center justify-between gap-4 border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800/90 border border-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-800 text-indigo-200 border border-indigo-700">
                  12 Weeks • 120 Hours • 4-Servo Bipedal Desk Pet
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-100">
                  Version A (micro:bit) &amp; Version B (Arduino Nano)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight mt-0.5">
                Robo-Buddy Companion: 4-Servo Otto Gait, Tamagotchi Brain &amp; Smart Alarm Lab
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Robo-Buddy Simulator"
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 px-5 py-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('gait-tamagotchi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'gait-tamagotchi'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. 4-Servo Gait, Tamagotchi &amp; 40-Test Lab
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hardware-pinout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'hardware-pinout'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            2. Version A (micro:bit) vs. Version B (Nano) &amp; Pinouts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curriculum-roles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'curriculum-roles'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            3. 12-Week Daily Plan (Mon–Fri) &amp; 4 Team Roles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rubric-badges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'rubric-badges'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            4. 7-Skill MTC Rubric, 3 Deliverables &amp; 7 Badges
          </button>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-stone-50/60">
          {activeTab === 'gait-tamagotchi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: 4-Servo Calibration & Hardware Setup */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-indigo-600" />
                      Week 7: 4-Servo 90° Pre-Centering &amp; Posture Trim (±5°)
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        sim.benchTest1Passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      Bench Test 1: {sim.benchTest1Passed ? 'PASSED (5 Steps Stable)' : 'NEEDS CALIBRATION'}
                    </span>
                  </div>

                  {/* Hardware Track & Power Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Classroom Hardware Track
                      </label>
                      <select
                        value={hardwareVersion}
                        onChange={(e) => setHardwareVersion(e.target.value as 'microbit' | 'arduino-nano')}
                        className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800"
                      >
                        <option value="microbit">Version A: BBC micro:bit V2 + PROJECT:BIT</option>
                        <option value="arduino-nano">Version B: Arduino Nano + I/O Shield</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Servo Power Source (Safety Rule)
                      </label>
                      <select
                        value={batteryPackUsed}
                        onChange={(e) =>
                          setBatteryPackUsed(e.target.value as '4xaa_6v_external' | 'usb_computer_only')
                        }
                        className={`w-full text-xs border rounded-lg px-2.5 py-1.5 font-semibold ${
                          batteryPackUsed === '4xaa_6v_external'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                      >
                        <option value="4xaa_6v_external">4xAA (6V) External Battery Pack (Safe)</option>
                        <option value="usb_computer_only">Computer USB Cable Only (Brownout Risk!)</option>
                      </select>
                    </div>
                  </div>

                  {!sim.externalBatterySafe && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>USB Brownout Warning:</strong> Driving 4 SG90 servos simultaneously draws over 800mA–1.2A on step startup. Never power 4 servos from laptop USB alone—switch to the 4xAA (6V) battery pack!
                      </div>
                    </div>
                  )}

                  {/* 4 Servo Angle Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="flex justify-between text-xs font-semibold text-stone-700">
                        <span>Left Hip ({hardwareVersion === 'microbit' ? 'S1' : 'D2'})</span>
                        <span className="font-mono text-indigo-700">{sim.leftHipAngleDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={110}
                        value={leftHipAngleDeg}
                        onChange={(e) => setLeftHipAngleDeg(Number(e.target.value))}
                        className="w-full accent-indigo-600 mt-1"
                      />
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="flex justify-between text-xs font-semibold text-stone-700">
                        <span>Right Hip ({hardwareVersion === 'microbit' ? 'S2' : 'D3'})</span>
                        <span className="font-mono text-indigo-700">{sim.rightHipAngleDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={110}
                        value={rightHipAngleDeg}
                        onChange={(e) => setRightHipAngleDeg(Number(e.target.value))}
                        className="w-full accent-indigo-600 mt-1"
                      />
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="flex justify-between text-xs font-semibold text-stone-700">
                        <span>Left Foot ({hardwareVersion === 'microbit' ? 'S3' : 'D4'})</span>
                        <span className="font-mono text-indigo-700">{sim.leftFootAngleDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={110}
                        value={leftFootAngleDeg}
                        onChange={(e) => setLeftFootAngleDeg(Number(e.target.value))}
                        className="w-full accent-indigo-600 mt-1"
                      />
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="flex justify-between text-xs font-semibold text-stone-700">
                        <span>Right Foot ({hardwareVersion === 'microbit' ? 'S4' : 'D5'})</span>
                        <span className="font-mono text-indigo-700">{sim.rightFootAngleDeg}°</span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={110}
                        value={rightFootAngleDeg}
                        onChange={(e) => setRightFootAngleDeg(Number(e.target.value))}
                        className="w-full accent-indigo-600 mt-1"
                      />
                    </div>
                  </div>

                  {/* Checkboxes for 90° pre-centering & V2.0 mechanical upgrades */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <label className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={servosCenteredBeforeAssembly}
                        onChange={(e) => setServosCenteredBeforeAssembly(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-stone-800">90° Centered First</span>
                    </label>
                    <label className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rubberFootGripsAdded}
                        onChange={(e) => setRubberFootGripsAdded(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-stone-800">Rubber Foot Grips</span>
                    </label>
                    <label className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cablesZipTied}
                        onChange={(e) => setCablesZipTied(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-stone-800">Cables Zip-Tied</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200 rounded-lg px-3 py-2 text-xs">
                    <span className="font-semibold text-indigo-950">
                      Bipedal Posture Stability Score: {sim.postureStabilityScore}/100 (Total Trim Deviation: {sim.totalTrimDeviationDeg}°)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLeftHipAngleDeg(90);
                        setRightHipAngleDeg(90);
                        setLeftFootAngleDeg(90);
                        setRightFootAngleDeg(90);
                        setServosCenteredBeforeAssembly(true);
                        setBatteryPackUsed('4xaa_6v_external');
                      }}
                      className="text-[11px] font-bold text-indigo-700 hover:underline"
                    >
                      Auto-Center All to 90°
                    </button>
                  </div>
                </div>

                {/* Week 10 40-Point Reliability Benchmark Card */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Week 10: 40-Point Reliability Benchmark (Prototype V2.0)
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        sim.totalBenchmarkPassedOf40 >= 32
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sim.totalBenchmarkPassedOf40} / 40 Passed ({sim.benchmarkPassRatePct}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="font-semibold text-stone-700 mb-1">
                        Walking ({sim.walkPassed}/20)
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={walkingTestsPassedOf20}
                        onChange={(e) => setWalkingTestsPassedOf20(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="font-semibold text-stone-700 mb-1">
                        Alarm ({sim.alarmPassed}/10)
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={alarmTestsPassedOf10}
                        onChange={(e) => setAlarmTestsPassedOf10(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="font-semibold text-stone-700 mb-1">
                        Sensors ({sim.sensorPassed}/10)
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={sensorCareTestsPassedOf10}
                        onChange={(e) => setSensorCareTestsPassedOf10(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tamagotchi Virtual Pet Brain & Smart Alarm Lab */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" />
                      Week 3 &amp; 8: Tamagotchi Virtual Pet Brain (5-Mood State Machine)
                    </h3>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-900 text-white">
                      State: {sim.currentMood}
                    </span>
                  </div>

                  {/* Simulated OLED / 5x5 LED Face Screen */}
                  <div className="bg-stone-950 text-emerald-400 rounded-xl p-4 font-mono text-center border-2 border-stone-800 shadow-inner space-y-2">
                    <div className="text-[11px] uppercase tracking-widest text-stone-400">
                      {hardwareVersion === 'microbit'
                        ? 'BBC micro:bit 5x5 LED Matrix + Speaker'
                        : 'Arduino Nano 0.96" I2C OLED + D13 Buzzer'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-wider py-2 text-amber-300">
                      {moodFaceAscii[sim.currentMood]}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-stone-800">
                      <div>
                        <span className="text-stone-400">Hunger:</span>{' '}
                        <span className={sim.hungerStat >= 65 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {sim.hungerStat}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Happiness:</span>{' '}
                        <span className={sim.happinessStat <= 45 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {sim.happinessStat}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Energy:</span>{' '}
                        <span className={sim.energyStat <= 35 ? 'text-sky-400 font-bold' : 'text-emerald-400'}>
                          {sim.energyStat}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Care Actions */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-2">
                      <div className="flex justify-between font-semibold text-stone-800">
                        <span className="flex items-center gap-1">
                          <Hand className="w-3.5 h-3.5 text-indigo-600" />
                          Head Touch Pets
                        </span>
                        <span className="font-mono">{touchPetEventsCount}x</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTouchPetEventsCount((c) => Math.min(20, c + 1))}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors"
                        >
                          Pet Head Sensor (+15 Happy)
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-stone-600 pt-1">
                        <span>Hours since petted: {hoursSinceLastPetted}h</span>
                        <input
                          type="range"
                          min={0}
                          max={12}
                          value={hoursSinceLastPetted}
                          onChange={(e) => setHoursSinceLastPetted(Number(e.target.value))}
                          className="w-24 accent-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-2">
                      <div className="flex justify-between font-semibold text-stone-800">
                        <span className="flex items-center gap-1">
                          <Sun className="w-3.5 h-3.5 text-amber-600" />
                          Flashlight Feeds (LDR)
                        </span>
                        <span className="font-mono">{lightFeedEventsCount}x</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightFeedEventsCount((c) => Math.min(20, c + 1))}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md transition-colors"
                        >
                          Shine Flashlight (-20 Hunger)
                        </button>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-stone-600 pt-1">
                        <span>Hours since fed: {hoursSinceLastFed}h</span>
                        <input
                          type="range"
                          min={0}
                          max={12}
                          value={hoursSinceLastFed}
                          onChange={(e) => setHoursSinceLastFed(Number(e.target.value))}
                          className="w-24 accent-amber-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Week 9 Smart Alarm & Physical Dismiss Rule */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-700" />
                        Week 9: Smart Study/Wake-Up Alarm &amp; Dismiss Rule
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alarmTriggered}
                          onChange={(e) => setAlarmTriggered(e.target.checked)}
                          className="rounded text-amber-700"
                        />
                        Trigger Alarm Now
                      </label>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      <strong>Dismiss Rule:</strong> When the alarm rings, Robo-Buddy dances and chirps until the student pets the Head Touch Sensor <strong>3 times</strong> (current: <code className="font-mono">{dismissHeadTouches}</code>) OR waves a hand within <strong>&le; 15cm</strong> of the Ultrasonic Eyes (current: <code className="font-mono">{ultrasonicWaveDistanceCm}cm</code>).
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium text-amber-950">
                          <span>Head Touches to Dismiss</span>
                          <span className="font-mono font-bold">{dismissHeadTouches} / 3</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          value={dismissHeadTouches}
                          onChange={(e) => setDismissHeadTouches(Number(e.target.value))}
                          className="w-full accent-amber-700 mt-1"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-medium text-amber-950">
                          <span>Ultrasonic Hand Wave</span>
                          <span className="font-mono font-bold">{ultrasonicWaveDistanceCm} cm</span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={60}
                          value={ultrasonicWaveDistanceCm}
                          onChange={(e) => setUltrasonicWaveDistanceCm(Number(e.target.value))}
                          className="w-full accent-amber-700 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hardware-pinout' && (
            <div className="space-y-6">
              {/* Pinout Guides Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ROBO_BUDDY_PINOUT_GUIDE.map((ver) => (
                  <div
                    key={ver.versionId}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {ver.boardName}
                        </span>
                        <h3 className="text-sm font-bold text-stone-900 mt-1">{ver.versionTitle}</h3>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-950 flex items-start gap-2">
                      <BatteryCharging className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{ver.powerRuleWarning}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-500">
                            <th className="py-1.5 pr-2">Component</th>
                            <th className="py-1.5 px-2">Pin Assignment</th>
                            <th className="py-1.5 pl-2">Wiring / Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {ver.pins.map((p) => (
                            <tr key={p.component}>
                              <td className="py-1.5 pr-2 font-semibold text-stone-800">{p.component}</td>
                              <td className="py-1.5 px-2 font-mono text-indigo-700">{p.pinAssignment}</td>
                              <td className="py-1.5 pl-2 text-stone-600">{p.wireColorOrNote}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* 8-Row Hardware Comparison Table */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Complete 8-Subsystem Hardware Comparison (Version A micro:bit vs. Version B Arduino Nano)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                        <th className="p-2.5">Subsystem</th>
                        <th className="p-2.5">Version A: BBC micro:bit V2 + PROJECT:BIT</th>
                        <th className="p-2.5">Version B: Arduino Nano + I/O Shield</th>
                        <th className="p-2.5">Classroom Engineering Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {ROBO_BUDDY_HARDWARE_TABLE.map((row) => (
                        <tr key={row.componentCategory} className="hover:bg-stone-50/80">
                          <td className="p-2.5 font-bold text-stone-900">{row.componentCategory}</td>
                          <td className="p-2.5 text-stone-700">{row.versionAMicrobit}</td>
                          <td className="p-2.5 text-stone-700">{row.versionBArduinoNano}</td>
                          <td className="p-2.5 text-stone-600">{row.classroomNotes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum-roles' && (
            <div className="space-y-6">
              {/* Weekly Studio Rhythm (Mon-Fri) */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Weekly Studio Rhythm (Monday–Friday • 2 Hours/Day = 10 Hours/Week)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {ROBO_BUDDY_WEEKLY_RHYTHM.map((d) => (
                    <div
                      key={d.day}
                      className="bg-stone-50 rounded-lg border border-stone-200 p-3 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-800">{d.day}</span>
                          <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                            {d.durationHours}h
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-stone-900 mt-1">{d.focusTitle}</div>
                        <ul className="mt-2 space-y-1 text-[11px] text-stone-600">
                          {d.routineBreakdown.map((line) => (
                            <li key={line}>• {line}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-stone-200 text-[11px] font-medium text-emerald-800">
                        Check: {d.deliverableCheck}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 12-Week Interactive Daily Plan Browser */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    12-Week Curriculum &amp; Monday–Friday Daily Plan Browser
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {ROBO_BUDDY_12_WEEK_CURRICULUM.map((w) => (
                      <button
                        key={w.week}
                        type="button"
                        onClick={() => setSelectedWeek(w.week)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                          selectedWeek === w.week
                            ? 'bg-indigo-700 text-white'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        W{w.week}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono uppercase font-bold text-indigo-700">
                        {currentWeekObj.phaseName}
                      </span>
                      <h4 className="text-base font-bold text-stone-900">{currentWeekObj.title}</h4>
                    </div>
                    <span className="text-xs font-semibold bg-white border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg">
                      Portfolio Artifact: {currentWeekObj.portfolioArtifact}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 italic">
                    <strong>Driving Question:</strong> {currentWeekObj.drivingQuestion}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="font-bold text-indigo-800 mb-1">Monday (2h)</div>
                      <p className="text-stone-700 leading-relaxed">{currentWeekObj.mondayPlan}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="font-bold text-indigo-800 mb-1">Tuesday (2h)</div>
                      <p className="text-stone-700 leading-relaxed">{currentWeekObj.tuesdayPlan}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="font-bold text-indigo-800 mb-1">Wednesday (2h)</div>
                      <p className="text-stone-700 leading-relaxed">{currentWeekObj.wednesdayPlan}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <div className="font-bold text-indigo-800 mb-1">Thursday (2h)</div>
                      <p className="text-stone-700 leading-relaxed">{currentWeekObj.thursdayPlan}</p>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <div className="font-bold text-emerald-900 mb-1">Friday Milestone (2h)</div>
                      <p className="text-emerald-950 font-medium leading-relaxed">
                        {currentWeekObj.fridayMilestone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Student Team Roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {ROBO_BUDDY_TEAM_ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900">{role.roleTitle}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{role.subtitle}</p>
                      <ul className="mt-2.5 space-y-1.5 text-xs text-stone-700">
                        {role.coreResponsibilities.map((r) => (
                          <li key={r}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                      <strong className="text-stone-800">Portfolio Evidence:</strong> {role.weeklyPortfolioArtifact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rubric-badges' && (
            <div className="space-y-6">
              {/* 3 Core Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROBO_BUDDY_DELIVERABLES.map((deliv) => (
                  <div
                    key={deliv.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        Deliverable #{deliv.number}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">{deliv.title}</h4>
                    <p className="text-xs text-stone-600">{deliv.summary}</p>
                    <ul className="space-y-1 text-xs text-stone-700 pt-1">
                      {deliv.requirements.map((req) => (
                        <li key={req}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* 7-Skill WeLearn Future Skills & MTC Assessment Rubric */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-700" />
                  WeLearn 7 Future Skills &amp; MTC Competency Assessment Rubric
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                        <th className="p-2.5">WeLearn Future Skill (MTC Code)</th>
                        <th className="p-2.5">Emerging</th>
                        <th className="p-2.5">Foundational Credit</th>
                        <th className="p-2.5">Advanced Credit</th>
                        <th className="p-2.5">Required Portfolio Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {ROBO_BUDDY_MTC_RUBRIC.map((row) => (
                        <tr key={row.skillNumber} className="hover:bg-stone-50/80">
                          <td className="p-2.5 font-bold text-stone-900">
                            {row.skillNumber}. {row.weLearnFutureSkill}{' '}
                            <span className="font-mono text-[11px] text-indigo-700">
                              ({row.mtcCompetencyCode})
                            </span>
                          </td>
                          <td className="p-2.5 text-stone-600">{row.emerging}</td>
                          <td className="p-2.5 text-stone-800">{row.foundationalCredit}</td>
                          <td className="p-2.5 text-emerald-900 font-medium">{row.advancedCredit}</td>
                          <td className="p-2.5 text-indigo-900 font-medium">{row.portfolioEvidenceRequired}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7 Gamification Badges */}
              <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Robo-Buddy Studio Gamification Badges (Click to Claim / Verify)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ROBO_BUDDY_GAMIFICATION_BADGES.map((badge) => {
                    const isClaimed = claimedBadges.includes(badge.id);
                    return (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => toggleBadge(badge.id)}
                        className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          isClaimed
                            ? 'bg-indigo-950 text-white border-indigo-900 shadow-xs'
                            : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              +{badge.xpReward} XP
                            </span>
                            <span className="text-[10px] font-semibold">
                              {isClaimed ? '✓ Unlocked' : 'Click to Unlock'}
                            </span>
                          </div>
                          <div className="text-xs font-bold">{badge.title}</div>
                          <p
                            className={`text-[11px] mt-1 leading-snug ${
                              isClaimed ? 'text-indigo-200' : 'text-stone-600'
                            }`}
                          >
                            {badge.criteria}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-stone-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            <span className="font-semibold text-stone-900">Prototype V2.0 Status:</span>{' '}
            {sim.prototypeV2Ready ? (
              <span className="text-emerald-700 font-bold">
                READY FOR WEEK 12 PET ADOPTION FAIR ({sim.totalBenchmarkPassedOf40}/40 Benchmark • {sim.currentMood})
              </span>
            ) : (
              <span className="text-amber-800 font-semibold">
                In Calibration — Verify 90° centering, 4xAA battery, rubber foot grips &amp; &ge;32/40 benchmark trials
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSaveToPortfolio && (
              <button
                type="button"
                onClick={handleSaveEvidence}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white transition-colors"
              >
                Save Lab Snapshot to MTC Portfolio
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
