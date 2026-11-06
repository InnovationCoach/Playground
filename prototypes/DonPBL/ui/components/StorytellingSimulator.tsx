import React, { useState, useEffect } from 'react';
import {
  X,
  Film,
  Volume2,
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Award,
  CheckCircle2,
  Sliders,
  Copy,
  Check,
  Flame,
  FolderPlus,
  Tv,
  Music,
  BookOpen,
  Calendar,
  Sparkles,
  Lock
} from 'lucide-react';
import {
  GENESIS_DELIVERABLES,
  GENESIS_12_WEEK_ROADMAP,
  GENESIS_SUCCESS_CHECKLIST,
  GENESIS_GAMIFICATION_BADGES
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
  // 4 Interactive Studio Tabs
  const [activeTab, setActiveTab] = useState<'bible' | 'screenplay' | 'animatic-audio' | 'roadmap-checklist'>('bible');

  // Phase 1 (Weeks 1–3): Story Bible, Character Mind, World Rules & "Therefore/But" Rollercoaster
  const [protagonistWant, setProtagonistWant] = useState<string>(
    'Recover the sunken orbital relay core to clear their family’s name.'
  );
  const [protagonistNeed, setProtagonistNeed] = useState<string>(
    'Stop trying to fix everything alone and learn to trust teammates.'
  );
  const [protagonistFlaw, setProtagonistFlaw] = useState<string>(
    'Flaw: Secretly expects everyone to betray them. Ghost: Watched a trusted mentor abandon the crew during a storm.'
  );
  const [foilBelief, setFoilBelief] = useState<string>(
    'Rival (Mira Solis): Believes strict guild rules must be obeyed no matter who gets left behind.'
  );
  const [systemRuleLaw, setSystemRuleLaw] = useState<string>(
    'Plasma shields deflect falling space debris and deep-sea pressure.'
  );
  const [systemRuleCost, setSystemRuleCost] = useState<string>(
    'Limit: Drains battery in 60 seconds underwater and needs a 45-second cooldown before restarting!'
  );
  const [selectedStoryStart, setSelectedStoryStart] = useState<number>(1);
  const [connectorMode, setConnectorMode] = useState<'therefore_but' | 'and_then'>('therefore_but');

  // Phase 2 (Weeks 4–6): 3-Scene Movie Script, Subtext & Action Verbs
  const [isSubtextAndVerbsActive, setIsSubtextAndVerbsActive] = useState<boolean>(false);
  const [scenePowerShift, setScenePowerShift] = useState<number>(30);

  // Phases 3 & 4 (Weeks 7–11): Storyboards, Animatic, Camera Moves, Foley Ducking & Color Grading
  const [isPlayingAnimatic, setIsPlayingAnimatic] = useState<boolean>(false);
  const [animaticFrameIndex, setAnimaticFrameIndex] = useState<number>(0);
  const [isDuckingActive, setIsDuckingActive] = useState<boolean>(true);
  const [dialogueVolume, setDialogueVolume] = useState<number>(90);
  const [ambianceVolume, setAmbianceVolume] = useState<number>(55);
  const [foleyVolume, setFoleyVolume] = useState<number>(75);
  const [musicScoreVolume, setMusicScoreVolume] = useState<number>(60);
  const [activeCameraEffect, setActiveCameraEffect] = useState<'push_in' | 'pan' | 'shake' | 'blur'>('push_in');
  const [colorGradeFilter, setColorGradeFilter] = useState<'amber_adventure' | 'cyber_teal' | 'noir_contrast'>('amber_adventure');

  // Tab 4: 12-Week Roadmap & 4-Point Success Checklist
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number>(0); // 0 = All 4 Phases
  const [checkedCriteria, setCheckedCriteria] = useState<number[]>([1, 2, 3, 4]);

  // Gamification State
  const [xpScore, setXpScore] = useState<number>(2150);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([
    'badge-genesis-mind',
    'badge-genesis-world-rules',
    'badge-genesis-story-bible'
  ]);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Storyboard Frames (Week 7: Wide Shots, Medium Shots, Close-Ups + Week 9 Animatic)
  const STORYBOARD_FRAMES = [
    {
      shotNumber: 1,
      type: 'WIDE SHOT (For Scale)',
      description: 'Sunken orbital relay tower glowing at the bottom of a dark canyon. Tiny floodlights show our hero approaching.',
      soundCue: 'Atmosphere: Deep underwater hum + distant metal creak'
    },
    {
      shotNumber: 2,
      type: 'MEDIUM SHOT (For Conversation)',
      description: 'KAELEN tries to fix a broken hydro-wrench. RIVAL MIRA steps into the light holding the guild rulebook seal.',
      soundCue: 'Foley: Wrench clanking + metallic footsteps'
    },
    {
      shotNumber: 3,
      type: 'CLOSE-UP (For Big Emotion)',
      description: 'Kaelen’s hand trembles over the shield battery switch—only 15 seconds of power left before the limit runs out!',
      soundCue: 'Sci-Fi Beep Foley + Music Ducking (-8 dB under voice track)'
    },
    {
      shotNumber: 4,
      type: 'TRACKING / SCREEN SHAKE (Climax)',
      description: 'The canyon wall shifts! Kaelen tosses the working tool to Mira—choosing teamwork (Need) over solo pride (Want).',
      soundCue: 'Foley: Rumbling rock + swelling heroic trailer music!'
    }
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
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

  const THREE_STORY_STARTS = [
    {
      id: 1,
      title: 'Start 1: Sudden Shield Blackout (Hits Hero’s Fear of Abandonment)',
      desc: 'During a routine salvage dive, the main dome shield fails for 45 seconds—forcing Kaelen to team up with Rival Mira or lose the relay forever.'
    },
    {
      id: 2,
      title: 'Start 2: The Stolen Memory Core',
      desc: 'Kaelen finds the relay already opened and a cryptic message left inside the broken tool locker.'
    },
    {
      id: 3,
      title: 'Start 3: The Guild Trial Countdown',
      desc: 'The city council announces the sunken sector will be sealed in 24 hours unless proof is brought to the surface.'
    }
  ];

  const ROLLERCOASTER_BEATS = [
    {
      beat: 'Plot Point 1 (The Adventure Begins)',
      connector: connectorMode === 'therefore_but' ? 'THEREFORE...' : 'And then...',
      detail: 'The sudden danger hits Kaelen’s biggest weakness, forcing them out of normal life into the sunken relay.'
    },
    {
      beat: 'The Midpoint (Hero Starts Fighting Back)',
      connector: connectorMode === 'therefore_but' ? 'BUT...' : 'And then...',
      detail: 'Kaelen discovers the shield’s 45-second cooldown limit and switches from hiding to leading a daring rescue plan!'
    },
    {
      beat: 'The Lowest Point (All Hope Seems Lost)',
      connector: connectorMode === 'therefore_but' ? 'THEREFORE...' : 'And then...',
      detail: 'The battery hits 0% and the exit floods—Kaelen’s lone-wolf Flaw has trapped both hero and rival.'
    },
    {
      beat: 'The Climax (The Final Showdown)',
      connector: connectorMode === 'therefore_but' ? 'THEREFORE!' : 'And then...',
      detail: 'Kaelen trusts Mira with the last power cell (choosing Need over Want) to blast open the hatch before time runs out!'
    }
  ];

  const rawObviousScript = `INT. SUNKEN ORBITAL RELAY - NIGHT

Kaelen is walking over to the broken hydro-wrench and looks at it sadly.

MIRA
Stop right there, Kaelen! I am your rival and my beliefs are the exact opposite of yours! You never follow the rules!

KAELEN
I am angry at you because I have a painful past memory of being betrayed! I want to get the memory core all by myself!

MIRA
If you do not trust me right now, we will both be trapped here!`;

  const proSubtextScript = `INT. SUNKEN ORBITAL RELAY - NIGHT

Black water drips onto sizzling coils.

Kaelen wrenches the cracked hydro-spanner against the hatch bolt. Sparks fly. The grip slips.

MIRA
(tapping her guild seal on the pipe)
Regulation spanners are locked in Bay Four. Signed out in pairs.

KAELEN
Bay Four is under thirty feet of kelp. Hand me the tape.

MIRA
Tape won't hold thirty atmospheres. Neither will one pair of hands.

Kaelen freezes. Stares at the cracked steel in his palm—then shoves the handle toward Mira.

KAELEN
On three. Don't let go.`;

  const currentScript = isSubtextAndVerbsActive ? proSubtextScript : rawObviousScript;
  const wordCount = currentScript.trim().split(/\s+/).length;
  const subtextScore = isSubtextAndVerbsActive ? 96 : 38;

  const handleToggleSubtextAndVerbs = () => {
    const next = !isSubtextAndVerbsActive;
    setIsSubtextAndVerbsActive(next);
    if (next) {
      setScenePowerShift(70);
      if (!unlockedBadgeIds.includes('badge-genesis-subtext')) {
        setUnlockedBadgeIds((prev) => [...prev, 'badge-genesis-subtext']);
        setXpScore((prev) => prev + 350);
      }
    } else {
      setScenePowerShift(30);
    }
  };

  const handleClaimBadge = (badgeId: string, xp: number) => {
    if (!unlockedBadgeIds.includes(badgeId)) {
      setUnlockedBadgeIds((prev) => [...prev, badgeId]);
      setXpScore((prev) => prev + xp);
    }
  };

  const toggleCriterion = (num: number) => {
    setCheckedCriteria((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleCopyUniversePackage = () => {
    const md = `# Project "Genesis Engine": Build Your Own Movie Universe!
**Time:** 12 Weeks (5 days a week, 2 hours a day = 120 Hours of Creation)

## 1. Your Universe Guide (Story Bible — Weeks 1–3)
* **Hero Want (Outside Goal):** ${protagonistWant}
* **Hero Need (Inside Growth):** ${protagonistNeed}
* **Hero Flaw & Ghost:** ${protagonistFlaw}
* **Opposite Rival:** ${foilBelief}
* **World Rule (How it works):** ${systemRuleLaw}
* **World Rule Limit:** ${systemRuleCost}
* **Selected Story Start (Inciting Incident):** ${THREE_STORY_STARTS.find((s) => s.id === selectedStoryStart)?.title}
* **Story Map Pacing:** Connected with "${connectorMode === 'therefore_but' ? 'Therefore... / But...' : 'And then...'}"

## 2. 3-Scene Movie Script Excerpt (Weeks 4–6)
\`\`\`fountain
${currentScript}
\`\`\`

## 3. Mini-Movie / Pitch Trailer Mix (Weeks 7–12)
* **Camera Move:** ${activeCameraEffect.toUpperCase()}
* **Color Grading Mood:** ${colorGradeFilter}
* **Sound List Levels:** Voices ${dialogueVolume}% | Atmosphere ${ambianceVolume}% | Foley ${foleyVolume}% | Music ${musicScoreVolume}%
* **Audio Ducking:** ${isDuckingActive ? 'Enabled (-8 dB so music never drowns out voices)' : 'Disabled'}
* **Success Checklist Met:** ${checkedCriteria.length}/4 Criteria
`;
    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const filteredWeeks =
    selectedPhaseFilter === 0
      ? GENESIS_12_WEEK_ROADMAP
      : GENESIS_12_WEEK_ROADMAP.filter((w) => w.phaseNumber === selectedPhaseFilter);

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
                  12 Weeks · 5 Days/Wk · 2 Hrs/Day = 120 Hours of Creation
                </span>
                <span className="text-stone-500">·</span>
                <span className="text-xs bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-stone-950" />
                  {xpScore} XP
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Project &ldquo;Genesis Engine&rdquo;: Build Your Own Movie Universe!
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
              <button
                onClick={() => setActiveTab('bible')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'bible'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                1. Story Bible (Wks 1–3)
              </button>
              <button
                onClick={() => setActiveTab('screenplay')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'screenplay'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                2. 3-Scene Script (Wks 4–6)
              </button>
              <button
                onClick={() => setActiveTab('animatic-audio')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'animatic-audio'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                3. Animatic &amp; Sound (Wks 7–11)
              </button>
              <button
                onClick={() => setActiveTab('roadmap-checklist')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'roadmap-checklist'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                4. 12-Wk Plan &amp; Checklist
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

        {/* Deliverables & Badges Strip */}
        <div className="bg-amber-50/70 px-6 py-2.5 border-b border-amber-100 flex flex-wrap items-center justify-between text-xs text-amber-950 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-stone-900">
              Final Deliverables: 1. Universe Guide (Story Bible) · 2. 3-Scene Movie Script · 3. Mini-Movie / Pitch Trailer
            </span>
            <span className="bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
              {unlockedBadgeIds.length}/{GENESIS_GAMIFICATION_BADGES.length} Badges
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUniversePackage}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded text-stone-800 font-medium transition-colors"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedNotification ? 'Copied Universe Package!' : 'Export Story Bible & Script'}
            </button>
            {onSaveToPortfolio && (
              <button
                onClick={() =>
                  onSaveToPortfolio(
                    'Project "Genesis Engine": Story Bible, 3-Scene Script & Trailer Plan',
                    `${protagonistWant} | ${systemRuleLaw} (${systemRuleCost})\n\n${currentScript}`
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

        {/* TAB 1: PHASE 1 — BUILDING YOUR WORLD (WEEKS 1–3) */}
        {activeTab === 'bible' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-700 leading-relaxed flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-bold flex items-center gap-1.5 text-stone-900 mb-1">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  Phase 1: Building Your World (Weeks 1–3) — Goal: Create unforgettable characters, invent the rules of your world, and map out your full story!
                </span>
                <span>
                  Week 1: Inside Your Character’s Mind (Want vs. Need, Flaw, Ghost, Rival &amp; 500-word Broken-Tool Argument) · Week 2: World Rules &amp; 3 Story Starts · Week 3: 15-Step Story Map (&ldquo;Therefore/But&rdquo;) &amp; Phase 1 Checkpoint!
                </span>
              </div>
            </div>

            {/* Week 1: Inside Your Character's Mind */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center font-bold">
                    W1
                  </span>
                  Week 1: Inside Your Character’s Mind (Want vs. Need, Flaw, Ghost &amp; Rival)
                </h3>
                <span className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                  Day 5 Milestone: 500-Word Broken-Tool Argument
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                    <span>Hero Personality Sheet</span>
                    <span className="text-[10px] uppercase font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                      Days 1–4
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      What do they WANT (Outside Goal)?
                    </label>
                    <textarea
                      rows={2}
                      value={protagonistWant}
                      onChange={(e) => setProtagonistWant(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      What do they NEED (How they must grow inside)?
                    </label>
                    <textarea
                      rows={2}
                      value={protagonistNeed}
                      onChange={(e) => setProtagonistNeed(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      &ldquo;Flaw&rdquo; (Weakness) &amp; &ldquo;Ghost&rdquo; (Painful Past Memory):
                    </label>
                    <textarea
                      rows={2}
                      value={protagonistFlaw}
                      onChange={(e) => setProtagonistFlaw(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-3">
                  <div className="font-bold text-stone-900 text-sm flex items-center justify-between">
                    <span>Opposite Rival &amp; 500-Word Argument</span>
                    <span className="text-[10px] uppercase font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                      Instant Drama
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Rival Whose Beliefs Are the Exact Opposite of Your Hero’s:
                    </label>
                    <textarea
                      rows={2}
                      value={foilBelief}
                      onChange={(e) => setFoilBelief(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded border border-amber-200 text-[11px] text-amber-950 space-y-1.5">
                    <span className="font-bold block">
                      Week 1 Day 5 Milestone — The Broken-Tool Argument:
                    </span>
                    <p>
                      Write a 500-word argument between your hero and their rival about something small (like a broken hydro-wrench). Show their deeper clash of beliefs <em>without</em> having them say it directly!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Week 2: World Rules & The Big Problem */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center font-bold">
                    W2
                  </span>
                  Week 2: World Rules Guide, Limits &amp; Three Ways Your Story Could Start
                </h3>
                <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                  Inciting Incident Spark
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    How Magic or Future Tech Works ( Plus Main Location &amp; Culture):
                  </label>
                  <textarea
                    rows={2}
                    value={systemRuleLaw}
                    onChange={(e) => setSystemRuleLaw(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    What Is the LIMIT? (Forces Your Hero Into Action!):
                  </label>
                  <textarea
                    rows={2}
                    value={systemRuleCost}
                    onChange={(e) => setSystemRuleCost(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800 font-medium focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-stone-800">
                  Day 5 Milestone: Write Three Different Ways Your Story Could Start — Pick the Most Exciting One!
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {THREE_STORY_STARTS.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStoryStart(st.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedStoryStart === st.id
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 text-stone-900'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center justify-between">
                        <span>{st.title}</span>
                        {selectedStoryStart === st.id && (
                          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600">{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Week 3: Mapping the Story & Locking Your Story Bible */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center font-bold">
                    W3
                  </span>
                  Week 3: Rollercoaster Story Map (&ldquo;Therefore...&rdquo; or &ldquo;But...&rdquo;) &amp; Phase 1 Checkpoint
                </h3>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setConnectorMode('therefore_but')}
                    className={`px-3 py-1 rounded font-semibold transition-colors ${
                      connectorMode === 'therefore_but'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    ✓ Use &ldquo;Therefore... / But...&rdquo;
                  </button>
                  <button
                    onClick={() => setConnectorMode('and_then')}
                    className={`px-3 py-1 rounded font-semibold transition-colors ${
                      connectorMode === 'and_then'
                        ? 'bg-rose-700 text-white'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    ✗ Test Weak &ldquo;And then...&rdquo;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {ROLLERCOASTER_BEATS.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                        Beat {idx + 1}
                      </span>
                      <h4 className="font-bold text-stone-900 mt-1.5">{item.beat}</h4>
                      <p className="text-[11px] text-stone-600 mt-1">{item.detail}</p>
                    </div>
                    <div
                      className={`text-[11px] font-mono font-bold px-2 py-1 rounded text-center ${
                        connectorMode === 'therefore_but'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {item.connector}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Week 3 Day 5 Milestone (Phase 1 Checkpoint):</strong> Character sheets, World Rules Guide, maps, and 15-step Story Map reviewed with peers &amp; mentors—Story Bible LOCKED!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHASE 2 — WRITING THE MOVIE SCRIPT (WEEKS 4–6) */}
        {activeTab === 'screenplay' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Week 4: Subtext &amp; Hidden Meaning</span>
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-700">{subtextScore}/100</div>
                <div className="text-[11px] text-stone-500">
                  {isSubtextAndVerbsActive
                    ? 'Subtext active: Real meaning hidden beneath the broken tool!'
                    : 'Too obvious: Characters state their feelings out loud.'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Week 6: Action Line Verb Power</span>
                  <Scissors className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-stone-900">{wordCount} words</div>
                <div className="text-[11px] text-stone-500">
                  {isSubtextAndVerbsActive
                    ? 'Extra words cut & weak verbs replaced with strong action words!'
                    : 'Contains weak verbs ("is walking", "looks at sadly").'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Week 5–6: 3-Scene Script Target</span>
                  <Sliders className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  8–10 Pages ({scenePowerShift > 50 ? 'Locked' : 'Draft 1'})
                </div>
                <div className="text-[11px] text-stone-500">
                  Scene 1 (Mood/Hero) · Scene 2 (Raise Stakes) · Scene 3 (Climax/Twist)
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-stone-900 block">
                  Weeks 4–6 Script Studio: Fix &ldquo;Too Obvious&rdquo; Dialogue + Supercharge Action Verbs
                </span>
                <span className="text-stone-600">
                  Action Lines show <em>only</em> what the audience can see and hear. Subtext hides the real meaning beneath the words!
                </span>
              </div>

              <button
                onClick={handleToggleSubtextAndVerbs}
                className={`px-4 py-2 rounded-lg font-bold transition-all shadow-xs flex items-center gap-2 ${
                  isSubtextAndVerbsActive
                    ? 'bg-amber-700 hover:bg-amber-800 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {isSubtextAndVerbsActive
                  ? 'Show Raw "Too Obvious" Draft'
                  : 'Apply Subtext & Supercharge Action Verbs'}
              </button>
            </div>

            <div className="bg-stone-900 rounded-xl p-6 font-mono text-xs text-stone-200 shadow-inner space-y-3 leading-relaxed border border-stone-800">
              <div className="text-[11px] text-stone-400 pb-2 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
                <span>HOLLYWOOD SCREENPLAY FORMAT: SCENE HEADINGS · ACTION LINES · CHARACTER LINES</span>
                <span className="text-amber-400 font-semibold">
                  {isSubtextAndVerbsActive
                    ? 'PHASE 2 CHECKPOINT: LOCKED FINAL SCRIPT'
                    : 'RAW DRAFT (NEEDS SUBTEXT & STRONG VERBS)'}
                </span>
              </div>

              <div className="whitespace-pre-wrap font-mono pl-4 border-l-2 border-amber-500/60 py-2">
                {currentScript}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHASES 3 & 4 — STORYBOARDS, ANIMATIC, SOUND MIXING & COLOR GRADING (WEEKS 7–11) */}
        {activeTab === 'animatic-audio' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-stone-950 rounded-2xl p-5 text-white border border-stone-800 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800 gap-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-white">
                    Mini-Movie / Pitch Trailer Timeline (30+ Storyboards → Final Art + Camera Moves)
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="font-mono text-amber-400">
                    Shot {STORYBOARD_FRAMES[animaticFrameIndex].shotNumber}/4
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingAnimatic(!isPlayingAnimatic)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors"
                  >
                    {isPlayingAnimatic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isPlayingAnimatic ? 'Pause Trailer' : 'Play Animatic / Trailer'}
                  </button>
                  <button
                    onClick={() => setAnimaticFrameIndex((prev) => (prev + 1) % STORYBOARD_FRAMES.length)}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-200 text-xs"
                  >
                    Next Shot
                  </button>
                  <button
                    onClick={() => setAnimaticFrameIndex(0)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 rounded text-stone-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 16:9 Viewport with Camera Moves & Week 11 Color Grading */}
              <div
                className={`relative aspect-video w-full max-h-64 rounded-xl overflow-hidden flex flex-col justify-between p-6 border border-stone-800 transition-all ${
                  colorGradeFilter === 'amber_adventure'
                    ? 'bg-gradient-to-br from-stone-900 via-amber-950/60 to-neutral-900'
                    : colorGradeFilter === 'cyber_teal'
                    ? 'bg-gradient-to-br from-slate-950 via-cyan-950/60 to-stone-900'
                    : 'bg-gradient-to-br from-neutral-950 via-stone-900 to-black'
                } ${activeCameraEffect === 'push_in' && isPlayingAnimatic ? 'scale-[1.02] duration-1000' : ''} ${
                  activeCameraEffect === 'shake' ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="bg-black/70 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded border border-amber-500/30">
                    {STORYBOARD_FRAMES[animaticFrameIndex].type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="bg-black/70 text-stone-300 font-mono text-[11px] px-2 py-0.5 rounded">
                      Camera: {activeCameraEffect.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-mono bg-black/70 text-emerald-300 px-2 py-0.5 rounded">
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                      <span>{isDuckingActive ? 'Ducking ON (-8 dB)' : 'No Ducking'}</span>
                    </div>
                  </div>
                </div>

                <div className="max-w-2xl bg-black/80 backdrop-blur-xs p-3.5 rounded-lg border border-stone-700/80">
                  <p className="text-sm font-medium text-white mb-1">
                    {STORYBOARD_FRAMES[animaticFrameIndex].description}
                  </p>
                  <p className="text-xs text-amber-300/90 font-mono">
                    Sound List: {STORYBOARD_FRAMES[animaticFrameIndex].soundCue}
                  </p>
                </div>
              </div>

              {/* Week 10 Camera Moves & Week 11 Color Grading Controls */}
              <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 pt-1 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-300">Week 10 Camera Moves:</span>
                  {[
                    { id: 'push_in', label: 'Zoom (Push-In)' },
                    { id: 'pan', label: 'Wide Pan' },
                    { id: 'shake', label: 'Screen Shake' },
                    { id: 'blur', label: 'Background Blur' }
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => setActiveCameraEffect(cam.id as 'push_in' | 'pan' | 'shake' | 'blur')}
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

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-300">Week 11 Color Grading:</span>
                  {[
                    { id: 'amber_adventure', label: 'Golden Cinema' },
                    { id: 'cyber_teal', label: 'Sci-Fi Teal' },
                    { id: 'noir_contrast', label: 'High-Contrast Noir' }
                  ].map((grade) => (
                    <button
                      key={grade.id}
                      onClick={() =>
                        setColorGradeFilter(grade.id as 'amber_adventure' | 'cyber_teal' | 'noir_contrast')
                      }
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        colorGradeFilter === grade.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {grade.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Week 9 Sound List & Week 10 Multi-Layer Sound Mixing (with Ducking) */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-700" />
                    Weeks 9–10 Sound List &amp; Multi-Layer Sound Mixing (Voices, Atmosphere, Foley &amp; Music Ducking)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Adjust volume levels (ducking) so the music never drowns out the voices! (Safeguarding: no voice capture for under-13s; older learners require prior school consent and recordings are never stored on the platform.)
                  </p>
                </div>

                <button
                  onClick={() => setIsDuckingActive(!isDuckingActive)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    isDuckingActive
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {isDuckingActive ? '✓ Audio Ducking Active (Music lowers under voices)' : 'Enable Audio Ducking'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>1. Voices</span>
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
                  <span className="text-[10px] text-stone-500 block">Clear, emotional character lines</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>2. Atmosphere</span>
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
                  <span className="text-[10px] text-stone-500 block">Background world ambiance</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>3. Sound Effects (Foley)</span>
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
                  <span className="text-[10px] text-stone-500 block">Footsteps, tools, sci-fi beeps</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>4. Music</span>
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
                    {isDuckingActive ? 'Ducked so voices stay clear' : 'Un-ducked music track'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 12-WEEK ROADMAP, 4-POINT SUCCESS CHECKLIST & BADGES */}
        {activeTab === 'roadmap-checklist' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Final Deliverables Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GENESIS_DELIVERABLES.map((deliv) => (
                <div
                  key={deliv.number}
                  className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      Deliverable #{deliv.number}
                    </span>
                    <span className="font-mono text-[11px] text-stone-600">
                      Target: Week {deliv.milestoneWeek}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{deliv.title}</h4>
                  <p className="text-stone-600 leading-relaxed">{deliv.description}</p>
                </div>
              ))}
            </div>

            {/* How Your Project is Scored (Success Checklist) */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    How Your Project is Scored (Success Checklist)
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    You aren&rsquo;t graded on personal artistic taste—you are rewarded for thinking, planning, and building like a true creative professional!
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded">
                  {checkedCriteria.length}/4 Ready for Grand Showcase
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {GENESIS_SUCCESS_CHECKLIST.map((item) => {
                  const isChecked = checkedCriteria.includes(item.number);
                  return (
                    <button
                      key={item.number}
                      onClick={() => toggleCriterion(item.number)}
                      className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-300 text-stone-900'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isChecked ? 'text-emerald-600' : 'text-stone-300'
                        }`}
                      />
                      <div className="space-y-1">
                        <div className="font-bold text-sm">
                          {item.number}. {item.title}
                        </div>
                        <p className="text-stone-700 font-medium">{item.question}</p>
                        <p className="text-[11px] text-stone-500">Evidence: {item.evidenceExample}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 12-Week Roadmap Browser */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  12-Week / 120-Hour Studio Roadmap (5 Days/Week, 2 Hours/Day)
                </h3>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 0, label: 'All 12 Weeks' },
                    { id: 1, label: 'Phase 1: World (Wks 1–3)' },
                    { id: 2, label: 'Phase 2: Script (Wks 4–6)' },
                    { id: 3, label: 'Phase 3: Art & Animatic (Wks 7–9)' },
                    { id: 4, label: 'Phase 4: Polish & Launch (Wks 10–12)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedPhaseFilter(tab.id)}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        selectedPhaseFilter === tab.id
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {filteredWeeks.map((wk) => (
                  <div
                    key={wk.week}
                    className={`p-4 rounded-xl border space-y-2 ${
                      wk.isPhaseCheckpoint
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-stone-50/70 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 text-sm">{wk.weekTitle}</span>
                      {wk.isPhaseCheckpoint && (
                        <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                          {wk.checkpointLabel}
                        </span>
                      )}
                    </div>
                    <p className="italic text-amber-900 font-medium">
                      Big Question: {wk.bigQuestion}
                    </p>
                    <p className="text-stone-700">{wk.days1To2}</p>
                    <p className="text-stone-700">{wk.days3To4}</p>
                    <p className="font-semibold text-stone-900 bg-white p-2 rounded border border-stone-200">
                      {wk.day5Milestone}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Showrunner Gamification Badges */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                Genesis Engine Showrunner Badges (Claim as You Hit Milestones!)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {GENESIS_GAMIFICATION_BADGES.map((b) => {
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
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-stone-900">{b.title}</span>
                          <span className="font-mono text-[11px] text-amber-800 font-bold">
                            +{b.xpReward} XP
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-500 block mb-1">
                          {b.phase}
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

        {/* Footer Bar */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">Grand Showcase Package:</span>
            <span className="font-mono text-amber-900 font-bold">
              1. Story Bible · 2. 3-Scene Movie Script (8–10p) · 3. Mini-Movie / Pitch Trailer
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
              onClick={handleCopyUniversePackage}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-semibold transition-colors shadow-2xs"
            >
              Export Universe Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
