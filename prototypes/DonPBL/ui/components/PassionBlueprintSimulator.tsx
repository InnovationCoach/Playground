import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Brain, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Award, 
  Layers, 
  Flame, 
  Compass, 
  Timer, 
  Mic, 
  Shuffle, 
  ChevronRight, 
  BookOpen, 
  ShieldCheck, 
  Check, 
  Copy,
  FolderPlus
} from 'lucide-react';
import { FRICTION_STRATEGIES } from '../pbl';
import type { FrictionStrategy } from '../pbl';

interface PassionBlueprintSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (blueprintTitle: string, blueprintSummary: string) => void;
}

export const PassionBlueprintSimulator: React.FC<PassionBlueprintSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  // Step navigation in the blueprint workflow
  const [activeStep, setActiveStep] = useState<'blueprint' | 'scaffold-sim' | 'boss-battles'>('blueprint');

  // Part 1: Deep Dives (Interests & Obsessions)
  const [rabbitHoleTopic, setRabbitHoleTopic] = useState<string>('Custom Retro Game Engine & Shaders');
  const [fixerUpperProblem, setFixerUpperProblem] = useState<string>('Kids get bored by static math drills; need tactile puzzle game');
  const [cultureCheckItem, setCultureCheckItem] = useState<string>('Celeste & Hollow Knight: tight movement physics and ambient chiptunes');
  const [saturdayVibe, setSaturdayVibe] = useState<string>('Uninterrupted 8 hours tinkering with pixel art, synth presets, and coffee');

  // Part 2: Toolkit & Creative Outlets
  const [selectedToolkit, setSelectedToolkit] = useState<'coding' | 'hands_on' | 'visual_art' | 'writing' | 'performance'>('coding');
  const [comfortZone, setComfortZone] = useState<string>('Writing game logic loops and testing character jump physics');
  const [stretchZone, setStretchZone] = useState<string>('Procedural 2D sound synthesis and custom level shaders');

  // Part 3: Learning Style & Support (2e Scaffolding)
  const [brainSpeedStuck, setBrainSpeedStuck] = useState<'checklists' | 'walk' | 'talking' | 'examples'>('checklists');
  const [activeFrictionPoint, setActiveFrictionPoint] = useState<string>('fric-perfectionism');
  const [dreamAudience, setDreamAudience] = useState<string>('Indie Game Dev Discord & younger school peers');

  // Quick-Fire Vibe Selections
  const [vibeOutput, setVibeOutput] = useState<'digital' | 'physical' | 'theoretical'>('digital');
  const [vibePace, setVibePace] = useState<'fast_experimental' | 'slow_deep'>('fast_experimental');
  const [vibeSocial, setVibeSocial] = useState<'solo_wolf' | 'crew_collab'>('solo_wolf');

  // Gamification & Simulation State
  const [xpScore, setXpScore] = useState<number>(1420);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([
    '🚀 Rabbit Hole Pioneer',
    '⚡ Hyperfocus Alchemist'
  ]);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Boss Battle interactive states
  const [uglyTimerActive, setUglyTimerActive] = useState<boolean>(false);
  const [uglyTimerSeconds, setUglyTimerSeconds] = useState<number>(900); // 15 mins (900s)
  const [activeMashup, setActiveMashup] = useState<string | null>(null);
  const [voiceRecordingSim, setVoiceRecordingSim] = useState<boolean>(false);
  const [voiceTextResult, setVoiceTextResult] = useState<string>('');

  // 15-Minute Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (uglyTimerActive && uglyTimerSeconds > 0) {
      interval = setInterval(() => {
        setUglyTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (uglyTimerSeconds === 0 && uglyTimerActive) {
      setUglyTimerActive(false);
      if (!unlockedBadges.includes('🛡️ Perfectionism Slayer')) {
        setUnlockedBadges((prev) => [...prev, '🛡️ Perfectionism Slayer']);
        setXpScore((prev) => prev + 500);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uglyTimerActive, uglyTimerSeconds, unlockedBadges]);

  if (!isOpen) return null;

  // Selected friction strategy lookup
  const currentFriction = FRICTION_STRATEGIES.find((f) => f.id === activeFrictionPoint) || FRICTION_STRATEGIES[0];

  // Derived Simulation Metrics
  const executiveFrictionScore = Math.max(12, Math.round(
    (activeFrictionPoint === 'fric-perfectionism' ? 82 : 75) - 
    (brainSpeedStuck === 'checklists' ? 38 : 28) -
    (vibePace === 'fast_experimental' ? 18 : 12)
  ));

  const autonomyAgencyScore = Math.min(100, Math.round(
    80 + (vibeSocial === 'solo_wolf' ? 12 : 8) + (selectedToolkit ? 6 : 0)
  ));

  const dopamineRetentionPct = Math.min(98, Math.round(
    55 + (activeMashup ? 24 : 0) + (brainSpeedStuck === 'checklists' ? 12 : 8)
  ));

  // Format timer MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Trigger Mashup Randomizer
  const handleRollMashup = () => {
    const mashups = [
      '🎵 Chiptune Synthesizer Audio Engine',
      '🤖 Sensory Haptic Feedback LED Indicators',
      '📖 Interactive Lore & Secret Branching Comic',
      '🌱 Biodegradable Recycled Packaging Shell',
      '🧠 Speedrun Mode with Ghost Runner Analytics'
    ];
    const picked = mashups[Math.floor(Math.random() * mashups.length)];
    setActiveMashup(picked);
    if (!unlockedBadges.includes('🎨 Mashup Alchemist')) {
      setUnlockedBadges((prev) => [...prev, '🎨 Mashup Alchemist']);
      setXpScore((prev) => prev + 350);
    }
  };

  // Trigger Tap-to-Choose / Teacher Scribe Card (Safeguarding: never record a child's voice)
  const handleToggleVoiceRecord = () => {
    if (!voiceRecordingSim) {
      setVoiceRecordingSim(true);
      setVoiceTextResult('Generating structured reflection from tap-to-choose cards...');
      setTimeout(() => {
        setVoiceTextResult(
          `"Tap-to-Choose & Teacher-Scribed Reflection: Selected cards [Stuck on Jump Physics] → [Switched to 20-Minute Micro-Sprint] → [Tuned Terminal Velocity]. Solved the floaty gravity curve without writing a long paragraph or recording voice audio!"`
        );
        setVoiceRecordingSim(false);
        if (!unlockedBadges.includes('🗂️ Visual Chronicler')) {
          setUnlockedBadges((prev) => [...prev, '🗂️ Visual Chronicler']);
          setXpScore((prev) => prev + 300);
        }
      }, 600);
    }
  };

  // Copy Markdown Blueprint
  const handleCopyMarkdown = () => {
    const md = `# The Passion Project Blueprint: ${rabbitHoleTopic}
**Creator Vibe:** ${vibeOutput.toUpperCase()} · ${vibePace.replace('_', ' ').toUpperCase()} · ${vibeSocial.replace('_', ' ').toUpperCase()}
**Target Audience:** ${dreamAudience}

## Part 1: The Deep Dives
* **Rabbit Hole:** ${rabbitHoleTopic}
* **The Fixer-Upper Problem:** ${fixerUpperProblem}
* **Culture Check Resonance:** ${cultureCheckItem}
* **Infinite Saturday Vibe:** ${saturdayVibe}

## Part 2: Toolkit & Scope
* **Primary Modality:** ${selectedToolkit}
* **80% Comfort Zone:** ${comfortZone}
* **20% Stretch Zone:** ${stretchZone}

## Part 3: 2e Neuro-Scaffolding
* **Primary Friction Point:** ${currentFriction.frictionPoint} (${currentFriction.studentQuote})
* **Active Defense Mechanism:** ${currentFriction.scaffoldingMechanism}
* **Brain Recovery Tool:** ${brainSpeedStuck}
* **Dopamine Retention Rate:** ${dopamineRetentionPct}%
`;
    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-700/60 rounded-lg text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-purple-200">
                  2e Neurodiversity & Autonomous PBL
                </span>
                <span className="text-purple-300">·</span>
                <span className="text-xs bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-950" />
                  {xpScore} XP
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                The Passion Project Blueprint Simulator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step navigation tabs */}
            <div className="flex items-center bg-purple-950/70 p-1 rounded-lg border border-purple-800 text-xs">
              <button
                onClick={() => setActiveStep('blueprint')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeStep === 'blueprint'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                1. Blueprint Diagnostics
              </button>
              <button
                onClick={() => setActiveStep('scaffold-sim')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeStep === 'scaffold-sim'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                2. Neuro-Scaffold Simulation
              </button>
              <button
                onClick={() => setActiveStep('boss-battles')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeStep === 'boss-battles'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                3. Friction Boss Battles
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-800/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header: Badges Bar */}
        <div className="bg-purple-50 px-6 py-2.5 border-b border-purple-100 flex flex-wrap items-center justify-between text-xs text-purple-900 gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-700" />
            <span className="font-semibold text-purple-950">Unlocked Badges ({unlockedBadges.length}/5):</span>
            <div className="flex flex-wrap gap-1.5">
              {unlockedBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-purple-200 text-purple-900 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded text-purple-800 font-medium transition-colors"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotification ? 'Copied Markdown!' : 'Export Blueprint MD'}
            </button>
            {onSaveToPortfolio && (
              <button
                onClick={() => onSaveToPortfolio(rabbitHoleTopic, fixerUpperProblem)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-medium transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Log to Evidence Portfolio
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Blueprint Diagnostics */}
        {activeStep === 'blueprint' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                <Brain className="w-4 h-4 text-amber-700" />
                Why This Works for Twice-Exceptional (2e) & Neurodivergent Learners:
              </span>
              Bullet points, brain dumps, or epic paragraphs are all welcome. We tap into your asynchronous hyperfocus strengths, de-risk executive functioning friction points, and grant total agency over your project vibe.
            </div>

            {/* Part 1: Deep Dives */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-mono text-xs flex items-center justify-center font-bold">1</span>
                Part 1: The Deep Dives (Interests & Obsessions)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    1. The Rabbit Hole (Hyperfocus & Obsessions):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    What could you talk about for hours, or spend days researching on YouTube/Reddit?
                  </p>
                  <input
                    type="text"
                    value={rabbitHoleTopic}
                    onChange={(e) => setRabbitHoleTopic(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    2. The Fixer-Upper (Real Problem to Solve):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    If you could fix one problem in the world, your community, or daily life, what is it?
                  </p>
                  <input
                    type="text"
                    value={fixerUpperProblem}
                    onChange={(e) => setFixerUpperProblem(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    3. The Culture Check (Media & Game Resonance):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    Favorite video games, books, anime, or artists? What specifically do you love?
                  </p>
                  <input
                    type="text"
                    value={cultureCheckItem}
                    onChange={(e) => setCultureCheckItem(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    4. Current Vibe (The Infinite Saturday):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    Free Saturday with zero responsibilities and infinite resources?
                  </p>
                  <input
                    type="text"
                    value={saturdayVibe}
                    onChange={(e) => setSaturdayVibe(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Part 2: Toolkit & 80/20 Rule */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-mono text-xs flex items-center justify-center font-bold">2</span>
                Part 2: Your Toolkit (Skills & Creative Outlets)
              </h3>

              <div>
                <label className="block font-semibold text-stone-800 text-xs mb-2">
                  5. How do you like to create? (Select Primary Modality):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { id: 'coding', label: '💻 Coding / Game Design' },
                    { id: 'hands_on', label: '🛠️ Hands-On / Robotics / LEGO' },
                    { id: 'visual_art', label: '🎨 Visual Arts / 3D' },
                    { id: 'writing', label: '✍️ Writing / Worldbuilding' },
                    { id: 'performance', label: '🎙️ Audio / Video / Music' }
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedToolkit(tool.id as any)}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                        selectedToolkit === tool.id
                          ? 'bg-purple-50 border-purple-600 text-purple-950 ring-1 ring-purple-600'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    6. The Comfort Zone (80% Foundation):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    What part feels easiest or most effortless for you?
                  </p>
                  <input
                    type="text"
                    value={comfortZone}
                    onChange={(e) => setComfortZone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    7. The Stretch Zone (20% Targeted Challenge):
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    What is ONE skill you'd love to learn or stretch into during this project?
                  </p>
                  <input
                    type="text"
                    value={stretchZone}
                    onChange={(e) => setStretchZone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick-Fire: Pick Your Vibe */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-700" />
                Quick-Fire: Pick Your Vibe (Honoring Learner Autonomy)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Vibe 1 */}
                <div className="bg-white p-3.5 rounded-lg border border-purple-200 space-y-2">
                  <span className="font-bold text-stone-900 block">I want to:</span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'physical', label: 'Build something physical' },
                      { id: 'digital', label: 'Design something digital' },
                      { id: 'theoretical', label: 'Solve a theoretical puzzle' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setVibeOutput(opt.id as any)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                          vibeOutput === opt.id
                            ? 'bg-purple-700 text-white font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe 2 */}
                <div className="bg-white p-3.5 rounded-lg border border-purple-200 space-y-2">
                  <span className="font-bold text-stone-900 block">My pace is:</span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'fast_experimental', label: 'Fast & experimental (trial & error)' },
                      { id: 'slow_deep', label: 'Slow, deep, and precise' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setVibePace(opt.id as any)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                          vibePace === opt.id
                            ? 'bg-purple-700 text-white font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe 3 */}
                <div className="bg-white p-3.5 rounded-lg border border-purple-200 space-y-2">
                  <span className="font-bold text-stone-900 block">I want to work:</span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'solo_wolf', label: 'Solo like a lone wolf' },
                      { id: 'crew_collab', label: 'Collaboratively with a partner/crew' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setVibeSocial(opt.id as any)}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                          vibeSocial === opt.id
                            ? 'bg-purple-700 text-white font-semibold'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Neuro-Scaffold Simulation */}
        {activeStep === 'scaffold-sim' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Live Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Executive Functioning Barrier</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {executiveFrictionScore}%
                </div>
                <div className="text-[11px] text-stone-500">
                  Reduced from 85% baseline via atomic micro-checklists.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Learner Autonomy & Agency</span>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-purple-700">
                  {autonomyAgencyScore}%
                </div>
                <div className="text-[11px] text-stone-500">
                  High-agency configuration: {vibePace.replace('_', ' ')} pace.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>12-Week Dopamine Retention</span>
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-700">
                  {dopamineRetentionPct}%
                </div>
                <div className="text-[11px] text-stone-500">
                  Protected against mid-project ADHD drop by novelty hacks.
                </div>
              </div>
            </div>

            {/* Active Friction Diagnostic & Scaffold Pairing */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-700" />
                  Active Friction Point & Neuro-Scaffolding Pair
                </h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded">
                  {currentFriction.frictionPoint}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {FRICTION_STRATEGIES.map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setActiveFrictionPoint(strat.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      activeFrictionPoint === strat.id
                        ? 'bg-purple-50 border-purple-600 text-purple-950 ring-1 ring-purple-600 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="font-bold text-stone-900 mb-1">{strat.frictionPoint}</div>
                    <div className="text-[11px] text-stone-500 italic">"{strat.studentQuote}"</div>
                  </button>
                ))}
              </div>

              {/* Scaffolding Solution Card */}
              <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-purple-950 block text-sm">
                      Recommended Defense: {currentFriction.scaffoldingMechanism}
                    </span>
                    <p className="text-purple-900 text-xs leading-relaxed">
                      Instead of fighting your brain chemistry with brute willpower, this protocol restructures the task boundary to keep cognitive inertia low.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <span className="font-semibold text-stone-800 block mb-1">
                      🤖 Tailored AI Co-Pilot Prompt:
                    </span>
                    <code className="text-[11px] text-purple-900 bg-purple-50 p-1.5 rounded block font-mono">
                      "{currentFriction.aiCopilotPrompt}"
                    </code>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <span className="font-semibold text-stone-800 block mb-1">
                      🎁 Dopamine Booster Reward:
                    </span>
                    <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      {currentFriction.dopamineBooster}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Kanban Micro-Sprint Backlog */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-700" />
                    Generated 20-Minute Micro-Sprint Backlog
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Tasks under 25 minutes each to eliminate procrastination and paralysis.
                  </p>
                </div>
                <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  WIP Limit: 2 Tasks Max
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { id: 'k1', phase: 'Explore', title: 'Rabbit Hole Mind Map', mins: 15, status: 'Done' },
                  { id: 'k2', phase: 'Empathise', title: '1-Page User Empathy Card', mins: 20, status: 'Done' },
                  { id: 'k3', phase: 'Define', title: '80/20 Scope Contract', mins: 20, status: 'In Progress' },
                  { id: 'k4', phase: 'Prototype', title: '15-Min Ugly First Draft', mins: 15, status: 'Up Next' }
                ].map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      task.status === 'Done'
                        ? 'bg-emerald-50/70 border-emerald-200 text-stone-800'
                        : task.status === 'In Progress'
                        ? 'bg-purple-50 border-purple-300 text-stone-900 ring-1 ring-purple-300'
                        : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-mono text-stone-400 mb-1">
                        <span>{task.phase}</span>
                        <span className="flex items-center gap-1 font-semibold text-stone-700">
                          <Timer className="w-3 h-3" />
                          {task.mins}m
                        </span>
                      </div>
                      <div className="font-bold text-xs text-stone-900">{task.title}</div>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-purple-800">
                      {task.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Friction Boss Battles */}
        {activeStep === 'boss-battles' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-950 leading-relaxed flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm block mb-0.5">
                  ⚔️ Gamified Friction Boss Battles
                </span>
                Beat the psychological traps that stall creative passion projects using live gamification mechanics.
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-lg text-purple-900">+{xpScore} XP</span>
              </div>
            </div>

            {/* Boss 1: The Perfectionism Demon */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-mono font-bold rounded">
                      BOSS 1
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">
                      The Perfectionism Demon (Blank Page Paralysis)
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Defeat the urge to make it perfect before starting. Challenge: Build the ugliest, crudest working prototype in 15 minutes!
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold font-mono text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                    {formatTimer(uglyTimerSeconds)}
                  </div>
                  <button
                    onClick={() => {
                      setUglyTimerActive(!uglyTimerActive);
                      if (!uglyTimerActive) setUglyTimerSeconds(900);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      uglyTimerActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                  >
                    {uglyTimerActive ? 'Pause Challenge' : 'Start 15-Min Sprint'}
                  </button>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1">
                <strong>Ugly Draft Rules:</strong> Stick figures, cardboard scraps, and taped wires are mandatory. Aesthetic polish is strictly forbidden during this sprint.
              </div>
            </div>

            {/* Boss 2: The Boredom Swamp */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded">
                      BOSS 2
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">
                      The Mid-Project Boredom Swamp (Novelty Drop)
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    When excitement drops at week 6, inject an unexpected secondary passion using the Mashup Twist generator!
                  </p>
                </div>

                <button
                  onClick={handleRollMashup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Roll Mashup Twist
                </button>
              </div>

              {activeMashup && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-amber-950 block">✨ Mashup Twist Injected:</span>
                  <div className="font-semibold text-purple-900 text-sm">{activeMashup}</div>
                  <p className="text-stone-600 text-[11px] pt-1">
                    Integrate this secondary feature into your current Alpha build to unlock +350 XP!
                  </p>
                </div>
              )}
            </div>

            {/* Boss 3: The Wall of Stare */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded">
                      BOSS 3
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">
                      The Wall of Stare (Writing / Brain Freeze)
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Hate typing long paragraphs? Use tap-to-choose reflection cards, annotated sketches, or a teacher-run scribe (never recording a learner&apos;s voice)!
                  </p>
                </div>

                <button
                  onClick={handleToggleVoiceRecord}
                  disabled={voiceRecordingSim}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors shadow-2xs ${
                    voiceRecordingSim ? 'bg-amber-600 animate-pulse' : 'bg-indigo-700 hover:bg-indigo-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {voiceRecordingSim ? 'Structuring Cards...' : 'Use Tap-to-Choose Cards'}
                </button>
              </div>

              {voiceTextResult && (
                <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-indigo-950 block">🗂️ Tap-to-Choose &amp; Scribe Output:</span>
                  <p className="text-stone-700 text-xs italic leading-relaxed">{voiceTextResult}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Selected Rabbit Hole:</span>
            <span className="font-mono text-purple-900 font-bold truncate max-w-xs">{rabbitHoleTopic}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md font-medium transition-colors"
            >
              Close Simulator
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md font-semibold transition-colors shadow-2xs"
            >
              Export Blueprint
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
