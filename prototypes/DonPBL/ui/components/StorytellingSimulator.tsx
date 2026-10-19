import React, { useState, useEffect } from 'react';
import { 
  X, 
  Film, 
  Clapperboard, 
  Sparkles, 
  Volume2, 
  Layers, 
  Scissors, 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Copy, 
  Check, 
  Flame, 
  FolderPlus, 
  Tv, 
  Eye, 
  Music, 
  ShieldAlert, 
  BookOpen
} from 'lucide-react';
import { 
  GENESIS_CHARACTERS_FIXTURE, 
  GENESIS_WORLD_RULES_FIXTURE,
  CharacterProfile,
  WorldRule
} from '../pbl';

interface StorytellingSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPortfolio?: (title: string, summary: string) => void;
}

export const StorytellingSimulator: React.FC<StorytellingSimulatorProps> = ({
  isOpen,
  onClose,
  onSaveToPortfolio
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'bible' | 'screenplay' | 'animatic-audio'>('bible');

  // Story Bible: Characters & Psychology State
  const [protagonistWant, setProtagonistWant] = useState<string>(
    'Extract the blackbox memory core from the sunken orbital relay to clear their mother’s treason conviction.'
  );
  const [protagonistNeed, setProtagonistNeed] = useState<string>(
    'Acknowledge that systemic corruption cannot be solved alone; learn to trust allies.'
  );
  const [protagonistFlaw, setProtagonistFlaw] = useState<string>(
    'Hyper-vigilant mistrust; assumes any shared information will be weaponized.'
  );
  const [foilBelief, setFoilBelief] = useState<string>(
    'Rigid institutional dogmatism; believes guild bylaws and procedural bureaucracy equal moral virtue.'
  );

  // World System Rules
  const [systemRuleLaw, setSystemRuleLaw] = useState<string>(
    'Kinetic plasma barriers absorb hyper-velocity debris using superconducting fields.'
  );
  const [systemRuleCost, setSystemRuleCost] = useState<string>(
    'Shield emitters drain battery cells exponentially when submerged; 45-second thermal cooldown.'
  );

  // Screenplay Subtext Simulator State
  const [is40PercentCutActive, setIs40PercentCutActive] = useState<boolean>(false);
  const [scenePowerShift, setScenePowerShift] = useState<number>(30); // 0 (Protagonist has power) to 100 (Foil has power)

  // Animatic & Audio Mixer Simulation State
  const [isPlayingAnimatic, setIsPlayingAnimatic] = useState<boolean>(false);
  const [animaticFrameIndex, setAnimaticFrameIndex] = useState<number>(0);
  const [isDuckingActive, setIsDuckingActive] = useState<boolean>(true);
  const [dialogueVolume, setDialogueVolume] = useState<number>(85); // 0-100
  const [foleyVolume, setFoleyVolume] = useState<number>(70); // 0-100
  const [ambianceVolume, setAmbianceVolume] = useState<number>(60); // 0-100
  const [musicScoreVolume, setMusicScoreVolume] = useState<number>(55); // 0-100
  const [activeCameraEffect, setActiveCameraEffect] = useState<'none' | 'push_in' | 'shake' | 'axis_180'>('push_in');

  // Gamification State
  const [xpScore, setXpScore] = useState<number>(1950);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([
    '🎭 Subtext Wordsmith',
    '🌌 Cosmic Lawmaker'
  ]);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Storyboard Frames Fixture
  const STORYBOARD_FRAMES = [
    {
      shotNumber: 1,
      type: 'EXT. WIDE SHOT',
      description: 'Sunken orbital relay hull submerged in dark bio-luminescent kelp trench. Floodlights beam into abyss.',
      soundCue: 'Distant hydraulic groans + low ocean drone'
    },
    {
      shotNumber: 2,
      type: 'INT. MEDIUM SHOT',
      description: 'KAELEN (17) pries open jammed airlock panel with hydraulic spreader. Breath fogging visor.',
      soundCue: 'Metal screech foley + ragged respirator breathing'
    },
    {
      shotNumber: 3,
      type: 'INT. CLOSE-UP',
      description: 'MIRA’s laser cutter ignites over Kaelen’s shoulder. Two flashlights cross in the murky haze.',
      soundCue: 'Plasma ignition buzz; music dips -8 dB (dialogue ducking)'
    },
    {
      shotNumber: 4,
      type: 'INT. DUTCH ANGLE',
      description: 'Kaelen steps back. Neither raises a weapon, but Kaelen’s hand hovers 2 inches above the release valve.',
      soundCue: 'Heartbeat pulse + tense string harmonics'
    }
  ];

  // Animatic Frame Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingAnimatic) {
      interval = setInterval(() => {
        setAnimaticFrameIndex((prev) => (prev + 1) % STORYBOARD_FRAMES.length);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAnimatic, STORYBOARD_FRAMES.length]);

  if (!isOpen) return null;

  // Screenplay text variations
  const onTheNoseScript = `INT. SUNKEN ORBITAL RELAY - NIGHT

Kaelen wrenches the maintenance hatch open.

MIRA
Stop right there, Kaelen! You can't take that memory core! I don't trust you because you always run away from your responsibilities!

KAELEN
I have to clear my mother's name! You only care about your stupid guild rules and you never cared about justice!

MIRA
The rules keep everyone safe! If you break them, the company will destroy this entire district!`;

  const subtextScript = `INT. SUNKEN ORBITAL RELAY - NIGHT

The airlock groans. Black ocean water drips onto sizzling plasma coils.

Kaelen wedges the carbon-fiber spreader into the core seam. Doesn't turn around.

KAELEN
Gasket is rated for thirty atmospheres. You're standing downwind.

Mira taps her guild seal against the bulkhead. Once. Twice. The metallic ping echoes.

MIRA
Form 40-B. Emergency salvage jurisdiction belongs to District Nine.

KAELEN
Form 40-B was ratified by magistrates currently serving life sentences.

Mira steps forward. Her flashlight beam cuts across Kaelen's knuckles.

MIRA
The seal is still valid. Even if the signature dried ten years ago.

Kaelen freezes. His grip tightens on the pry bar until tendons whiten.

KAELEN
Then call security. Or help me lift.`;

  const currentScript = is40PercentCutActive ? subtextScript : onTheNoseScript;
  const wordCount = currentScript.trim().split(/\\s+/).length;
  const subtextTensionIndex = is40PercentCutActive ? 94 : 42;

  // Trigger Subtext Cut & Gamification
  const handleToggleSubtextCut = () => {
    const nextState = !is40PercentCutActive;
    setIs40PercentCutActive(nextState);
    if (nextState) {
      if (!unlockedBadges.includes('🎭 Subtext Wordsmith')) {
        setUnlockedBadges((prev) => [...prev, '🎭 Subtext Wordsmith']);
      }
      setXpScore((prev) => prev + 400);
      setScenePowerShift(65);
    } else {
      setScenePowerShift(30);
    }
  };

  // Copy Screenplay & Story Bible
  const handleCopyBible = () => {
    const md = `# Project "Genesis Engine": Creative IP Story Bible
**Theme:** Cinematic Narrative, Screenwriting & Digital Media Production
**Format:** 20 Weeks / 200 Contact Hours

## 1. Character Architecture
* **Protagonist:** Kaelen Vance
  - **Want (External):** ${protagonistWant}
  - **Need (Internal):** ${protagonistNeed}
  - **Fatal Flaw:** ${protagonistFlaw}
* **Foil/Rival:** Mira Solis
  - **Core Clash:** ${foilBelief}

## 2. System World Rules (Operational Laws & Costs)
* **Law:** ${systemRuleLaw}
* **Cost & Limitation:** ${systemRuleCost}

## 3. Production Screenplay Excerpt (Scene 1)
\`\`\`fountain
${currentScript}
\`\`\`

## 4. Sonic Architecture
* Dialogue Level: ${dialogueVolume}%
* Music Ducking: ${isDuckingActive ? 'Active (-8 dB)' : 'Disabled'}
* Subtext Tension Index: ${subtextTensionIndex}/100
`;
    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-stone-900 via-neutral-900 to-amber-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-amber-300">
                  Project Genesis Engine · 200 Hours / 20 Weeks
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-xs bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-stone-950" />
                  {xpScore} XP
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Cinematic Narrative & Story Bible Simulator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex items-center bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
              <button
                onClick={() => setActiveTab('bible')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'bible'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                1. Story Bible & Rules
              </button>
              <button
                onClick={() => setActiveTab('screenplay')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'screenplay'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                2. Screenplay & Subtext
              </button>
              <button
                onClick={() => setActiveTab('animatic-audio')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'animatic-audio'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                3. Animatic & Foley Mixer
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

        {/* Badges & Actions Banner */}
        <div className="bg-amber-50/60 px-6 py-2.5 border-b border-amber-100 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-700" />
            <span className="font-semibold text-stone-900">Showrunner Badges ({unlockedBadges.length}/5):</span>
            <div className="flex flex-wrap gap-1.5">
              {unlockedBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-amber-200 text-stone-900 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBible}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded text-stone-800 font-medium transition-colors"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotification ? 'Copied Story Bible!' : 'Export Script MD'}
            </button>
            {onSaveToPortfolio && (
              <button
                onClick={() => onSaveToPortfolio('Genesis Engine: Story Bible & Script', currentScript)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Log to Evidence Portfolio
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: STORY BIBLE & SYSTEM RULES */}
        {activeTab === 'bible' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 leading-relaxed">
              <span className="font-bold flex items-center gap-1.5 text-stone-900 mb-1">
                <BookOpen className="w-4 h-4 text-amber-700" />
                Phase 1 Core Architecture: Character Psychology & Inviolable World Logic
              </span>
              Great stories do not start with plot; they start with characters whose internal flaws clash under the strict operational constraints of a world. Define Want vs. Need, the Fatal Flaw, and the technological costs.
            </div>

            {/* Character Psychology Grid */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center font-bold">1</span>
                  Character Psychology: Protagonist vs. Ideological Foil
                </h3>
                <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                  Subtext Generator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Protagonist */}
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                    <span>Protagonist: Kaelen Vance</span>
                    <span className="text-[10px] uppercase font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Lead</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">External Want (Concrete Plot Goal):</label>
                    <textarea
                      rows={2}
                      value={protagonistWant}
                      onChange={(e) => setProtagonistWant(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Internal Need (Emotional Growth):</label>
                    <textarea
                      rows={2}
                      value={protagonistNeed}
                      onChange={(e) => setProtagonistNeed(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Fatal Flaw & Ghost/Wound:</label>
                    <textarea
                      rows={2}
                      value={protagonistFlaw}
                      onChange={(e) => setProtagonistFlaw(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Foil/Rival */}
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                    <span>Foil / Rival: Mira Solis</span>
                    <span className="text-[10px] uppercase font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">Foil</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Conflicting Core Ideology:</label>
                    <textarea
                      rows={2}
                      value={foilBelief}
                      onChange={(e) => setFoilBelief(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
                    <span className="font-bold block">Why This Creates Natural Subtext:</span>
                    When two characters hold irreconcilable convictions, they never need to scream. A simple argument about who holds the tool or signs the log sheet carries the full weight of their worldview.
                  </div>
                </div>
              </div>
            </div>

            {/* World Logic & Cost of Power */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center font-bold">2</span>
                Systemic World-Building: Inviolable Operational Laws & Costs
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Speculative System Law (How it works):
                  </label>
                  <textarea
                    rows={3}
                    value={systemRuleLaw}
                    onChange={(e) => setSystemRuleLaw(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Inviolable Cost & Limitation (What prevents cheap plot resolutions):
                  </label>
                  <textarea
                    rows={3}
                    value={systemRuleCost}
                    onChange={(e) => setSystemRuleCost(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Airtight Rule Verification:</strong> Because shield deployment causes a 45-second thermal cooldown underwater, the characters cannot simply rely on force fields during the climax. Physical obstacle locked!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCREENPLAY & SUBTEXT */}
        {activeTab === 'screenplay' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Screenplay Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Subtext Tension Index</span>
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-700">
                  {subtextTensionIndex}/100
                </div>
                <div className="text-[11px] text-stone-500">
                  {is40PercentCutActive ? 'High tension: Characters talk around the wound.' : 'Low tension: On-the-nose exposition.'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Scene Word Count</span>
                  <Scissors className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-stone-900">
                  {wordCount} words
                </div>
                <div className="text-[11px] text-stone-500">
                  {is40PercentCutActive ? '40% reduction applied for maximum impact.' : 'Full raw first draft.'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Scene Power Shift</span>
                  <Sliders className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {scenePowerShift > 50 ? 'Foil (+65%)' : 'Protagonist (+70%)'}
                </div>
                <div className="text-[11px] text-stone-500">
                  Power transfers from Kaelen to Mira via legal leverage.
                </div>
              </div>
            </div>

            {/* Interactive Subtext Toggle Controls */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-stone-900 block">
                  Week 7 Milestone: The 40% Subtext Reduction Engine
                </span>
                <span className="text-stone-600">
                  Compare amateur "on-the-nose" exposition with professional subtextual dialogue.
                </span>
              </div>

              <button
                onClick={handleToggleSubtextCut}
                className={`px-4 py-2 rounded-lg font-bold transition-all shadow-xs flex items-center gap-2 ${
                  is40PercentCutActive
                    ? 'bg-amber-700 hover:bg-amber-800 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {is40PercentCutActive ? 'Reset to Raw Script' : 'Apply 40% Subtext Cut (-40% Words)'}
              </button>
            </div>

            {/* Screenplay Page Viewer */}
            <div className="bg-stone-900 rounded-xl p-6 font-mono text-xs text-stone-200 shadow-inner space-y-3 leading-relaxed border border-stone-800">
              <div className="text-[11px] text-stone-500 pb-2 border-b border-stone-800 flex items-center justify-between">
                <span>FORMAT: FOUNTAIN / HOLLYWOOD STANDARD (12PT COURIER)</span>
                <span className="text-amber-400 font-semibold">{is40PercentCutActive ? 'POLISHED SUBTEXT DRAFT' : 'RAW ON-THE-NOSE DRAFT'}</span>
              </div>

              <div className="whitespace-pre-wrap font-mono pl-4 border-l-2 border-amber-500/60 py-2">
                {currentScript}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANIMATIC & FOLEY MIXER */}
        {activeTab === 'animatic-audio' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Animatic 16:9 Player Viewport */}
            <div className="bg-stone-950 rounded-2xl p-5 text-white border border-stone-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-white">Cinematic Pitch Preview (16:9 Animatic)</span>
                  <span className="text-stone-600">·</span>
                  <span className="font-mono text-amber-400">Shot {STORYBOARD_FRAMES[animaticFrameIndex].shotNumber}/4</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingAnimatic(!isPlayingAnimatic)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors"
                  >
                    {isPlayingAnimatic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlayingAnimatic ? 'Pause Animatic' : 'Play Animatic'}
                  </button>
                  <button
                    onClick={() => setAnimaticFrameIndex(0)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulated 16:9 Cinematic Frame Canvas */}
              <div className={`relative aspect-video w-full max-h-72 bg-gradient-to-br from-stone-900 to-neutral-900 rounded-xl overflow-hidden flex flex-col justify-between p-6 border border-stone-800 transition-all ${
                activeCameraEffect === 'push_in' && isPlayingAnimatic ? 'scale-[1.02] duration-1000' : ''
              } ${activeCameraEffect === 'shake' ? 'animate-pulse' : ''}`}>
                
                {/* 180° Rule line overlay */}
                {activeCameraEffect === 'axis_180' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-full border-b-2 border-dashed border-red-500/70 relative">
                      <span className="absolute right-4 -top-5 text-[10px] font-mono text-red-400 bg-black/80 px-1 rounded">
                        180° Sightline Axis (Keep Camera on South Side)
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <span className="bg-black/70 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded border border-amber-500/30">
                    {STORYBOARD_FRAMES[animaticFrameIndex].type}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono bg-black/70 text-stone-300 px-2 py-0.5 rounded">
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                    <span>{isDuckingActive ? 'Ducking: -8 dB' : 'Normal'}</span>
                  </div>
                </div>

                <div className="max-w-xl bg-black/80 backdrop-blur-xs p-3.5 rounded-lg border border-stone-700/80">
                  <p className="text-sm font-medium text-white mb-1">
                    {STORYBOARD_FRAMES[animaticFrameIndex].description}
                  </p>
                  <p className="text-xs text-amber-300/90 font-mono">
                    🎵 Audio: {STORYBOARD_FRAMES[animaticFrameIndex].soundCue}
                  </p>
                </div>
              </div>

              {/* Camera Movement Selector */}
              <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 pt-1 gap-2">
                <span className="font-semibold text-stone-300">Camera Direction:</span>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'push_in', label: 'Push-In Zoom' },
                    { id: 'shake', label: 'Dynamic Shake' },
                    { id: 'axis_180', label: 'Show 180° Axis' },
                    { id: 'none', label: 'Static Lock' }
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => setActiveCameraEffect(cam.id as any)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeCameraEffect === cam.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4-Layer DAW Sound Landscape Mixer */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-700" />
                    4-Layer Audio Architecture & Sidechain Ducking Mixer
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Week 13–18 Audio Pipeline: Dialogue, Atmosphere, Foley, and Music ducking.
                  </p>
                </div>

                <button
                  onClick={() => setIsDuckingActive(!isDuckingActive)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    isDuckingActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {isDuckingActive ? '✓ Auto-Ducking ON (-8 dB)' : 'Auto-Ducking OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                {/* Layer 1: Dialogue */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>1. Vocal Stems</span>
                    <span className="font-mono text-amber-800">{dialogueVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dialogueVolume}
                    onChange={(e) => setDialogueVolume(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <span className="text-[10px] text-stone-500 block">Lead speech (-3 dB peak)</span>
                </div>

                {/* Layer 2: Atmosphere */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>2. Room Tone</span>
                    <span className="font-mono text-amber-800">{ambianceVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={ambianceVolume}
                    onChange={(e) => setAmbianceVolume(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <span className="text-[10px] text-stone-500 block">Ocean pressure drone</span>
                </div>

                {/* Layer 3: Foley */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>3. Spot Foley</span>
                    <span className="font-mono text-amber-800">{foleyVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={foleyVolume}
                    onChange={(e) => setFoleyVolume(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <span className="text-[10px] text-stone-500 block">Metal latch & laser hiss</span>
                </div>

                {/* Layer 4: Music Score */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>4. Score / Texture</span>
                    <span className="font-mono text-amber-800">{musicScoreVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicScoreVolume}
                    onChange={(e) => setMusicScoreVolume(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <span className="text-[10px] text-stone-500 block">
                    {isDuckingActive ? 'Ducked during voice (-8 dB)' : 'Steady output level'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Master Deliverable:</span>
            <span className="font-mono text-amber-900 font-bold truncate max-w-xs">
              3-Scene Screenplay + Pitch Animatic
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
              onClick={handleCopyBible}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold transition-colors shadow-2xs"
            >
              Export Story Package
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
