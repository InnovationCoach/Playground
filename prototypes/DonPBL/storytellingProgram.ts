/**
 * Don's PBL Program: Project "Genesis Engine": Creative IP & Cinematic Narrative
 * Branch: DonPBL
 * Location: prototypes/DonPBL/storytellingProgram.ts
 * 
 * Sourced from the official Project "Genesis Engine" Curriculum (200 Total Hours / 20 Weeks).
 * Formatted into standard WeLearn PblProgram architecture:
 * - 7 Design Thinking Phases (Explore -> Empathise -> Define -> Ideate -> Prototype -> Test -> Share)
 * - 24 Structured Workshop Sessions covering Character Psychology, World Logic, 
 *   Screenplay Formatting, Multi-Layer Sound Design, and Pitch Preview Production
 * - 3 Industry Deliverables:
 *   1. Comprehensive Creative IP Story Bible (Character sheets, system rules, asset breakdowns)
 *   2. Production-Ready 3-Scene Script formatted to industry standard
 *   3. Cinematic Pitch Preview / Micro-Short Film (visual assets, voice stems, multi-track foley & score)
 * - 4-Dimension Mastery Assessment Matrix (World Design Rigor, Formatting Precision, Pipeline Management, Sonic & Visual Continuity)
 */

import { PblProgram } from './programData';

export interface CharacterProfile {
  name: string;
  role: 'protagonist' | 'foil_rival' | 'mentor' | 'antagonist';
  externalWant: string; // The external goal
  internalNeed: string; // The internal emotional growth
  fatalFlaw: string;
  ghostWound: string; // Past trauma/event shaping worldview
  verbalFootprint: string; // Distinct dialect, cadence, subtext pattern
}

export interface WorldRule {
  systemName: string;
  operationalLaw: string;
  costOrLimitation: string; // Absolute boundary preventing cheap plot resolutions
  conflictEngine: string; // How this rule actively generates narrative problems
}

export interface StoryBeat {
  beatNumber: number;
  label: string;
  causalityType: 'therefore' | 'but'; // Enforces "Therefore / But" rather than "And then"
  summary: string;
  powerShift: string;
}

export const GENESIS_CHARACTERS_FIXTURE: CharacterProfile[] = [
  {
    name: 'Kaelen Vance',
    role: 'protagonist',
    externalWant: 'Extract the blackbox memory core from the sunken orbital relay to clear their mother’s treason conviction.',
    internalNeed: 'Acknowledge that systemic corruption cannot be solved by lone-wolf isolation; learn to trust co-conspirators.',
    fatalFlaw: 'Hyper-vigilant mistrust; assumes any shared information will be weaponized against them.',
    ghostWound: 'Watched their mentor sign an untraceable corporate ND-clause that erased their research and life’s work.',
    verbalFootprint: 'Abrupt, clipped telemetry jargon; uses technical diagnostics as a deflection shield against vulnerability.'
  },
  {
    name: 'Mira Solis',
    role: 'foil_rival',
    externalWant: 'Secure salvager guild jurisdiction over the orbital relay salvage zone for local district workers.',
    internalNeed: 'Accept that institutional rules and guild bylaws cannot protect against state-level corporate violence.',
    fatalFlaw: 'Rigid institutional dogmatism; believes procedural bureaucracy equals moral virtue.',
    ghostWound: 'Surviving a catastrophic decompression leak by following protocol, while teammates who improvised perished.',
    verbalFootprint: 'Incisive legal citations, weaponized politeness, deliberate pauses designed to force the other person to fill silence.'
  }
];

export const GENESIS_WORLD_RULES_FIXTURE: WorldRule[] = [
  {
    systemName: 'Atmospheric Scintillation Shields',
    operationalLaw: 'Kinetic barriers absorb hyper-velocity debris using superconducting plasma fields.',
    costOrLimitation: 'Shield emitters drain battery cells exponentially when deployed underwater or in heavy moisture; 45-second thermal cooldown.',
    conflictEngine: 'Characters must drop defensive shields to fire sonar salvos or navigate humid wreckage corridors.'
  },
  {
    systemName: 'Neural Echo Logging',
    operationalLaw: 'Synthetic cerebral implants record last 120 seconds of consciousness before bio-death.',
    costOrLimitation: 'Data degrades by 20% with every playback cycle; extraction causes acute neuro-sensory feedback in the handler.',
    conflictEngine: 'Information has an irreversible expiration date, forcing high-stakes decisions on when to review clues.'
  }
];

export const STORYTELLING_PROGRAM: PblProgram = {
  id: 'storytelling-genesis-2026',
  title: 'Project Genesis Engine: Creative IP & Cinematic Narrative',
  subtitle: 'Engineering rich speculative fiction universes, industry-standard screenplays, and multi-track cinematic pitch previews through systematic story architecture.',
  status: 'provisional_prototype',
  theme: 'Cinematic Storytelling, Screenwriting & Digital Media Production',
  drivingQuestion: 'How can we systematically design a compelling original intellectual property (IP), screenplay, and cinematic pitch preview where world rules, psychological character flaws, and subtextual tension drive unforgettable storytelling?',
  realProblem: {
    type: 'both',
    summary: 'Modern commercial media is saturated with derivative, formulaic content driven by algorithmic tropes rather than psychological truth or structural rigor. Young creators struggle to bridge the gap between creative doodles and production-ready story architecture (industry screenplays, world logic, sound continuity).',
    peopleImpact: 'Teaches youth advanced psychological literacy, empathy across ideological divides, vocal performance, and professional creative pipeline management.',
    environmentalImpact: 'Investigates ecological fragility, climate migration, resource depletion, and regenerative futures through grounded speculative world-building.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 20,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Digital Audio Workstation (DAW): Audacity / GarageBand / Reaper (Multi-track mixing)',
      'USB Condenser Microphone / Lavalier mic with pop filter for scratch vocal tracks',
      'Studio monitor headphones for audio leveling and frequency balance'
    ],
    sensorsAndActuators: [
      'Audio & Video Equipment: USB sound card, digital drawing tablet / iPad with Apple Pencil',
      'Foley Sound Props: shoes, gravel trays, metallic latches, fabrics, liquids for practical sound effects'
    ],
    fabricationMaterials: [
      'Story Bible physical binder with transparent asset sleeve inserts',
      'Index cards for 15-Point Beat Sheet physical corkboard manipulation',
      'Storyboard thumbnail sheets (16:9 cinematic aspect ratio grid)'
    ],
    softwareAndTools: [
      'Screenplay Software: Highland 2 / WriterDuet / Fountain syntax editor',
      'Storyboarding & 2D Art: Krita / Procreate / Canva / Figma',
      'Video Timeline Editing: DaVinci Resolve / Premiere / CapCut (Timeline animatics & foley)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Creative Psychological Safety: Exploring character wounds ("The Ghost") requires emotional vulnerability; establish strict class norms of constructive, craft-focused feedback.',
      'Hearing Protection: Ensure master headphone volumes in DAW audio mixing are calibrated below 80 dB SPL during sound design sessions.'
    ],
    pedagogicalScaffolding: [
      'Cause-and-Effect Narrative Rigor: Forbid "And then..." plotting. Enforce South Park creators\' rule: every beat must connect via "Therefore..." or "But...".',
      'Subtext Over Exposition: Ban "on-the-nose" dialogue where characters state their feelings. Require weaponized subtext where people talk about tea or broken tools to mask grief or betrayal.',
      'Strict Screenplay Constraints: Enforce industry layout rules (sluglines, present-tense action only for what can be seen/heard; no internal monologue in action lines).',
      'Layered Sonic Architecture: Ensure students do not treat sound as an afterthought. Teach 4 distinct audio tracks: Dialogue, Room Atmosphere, Spot Foley, and Musical Textures.'
    ],
    aiEthicsRules: [
      'AI as Script Doctor & Table-Read Partner: AI may simulate table reads or suggest foil counter-arguments; students author core themes, world rules, and dialogue.',
      'Full Story Provenance: Document AI prompts used to explore plot bottlenecks or generate character name variations.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11 / Grades 4–6): Illustrated character trading cards, 6-panel comic strip layouts, classroom vocal radio plays with live kitchen-prop foley, and tactile beat card corkboards.',
      'Junior Secondary Track (Ages 12–14 / Grades 7–9): Interactive branching choice fiction (Twine / Ink), 3-scene screenplay with psychological subtext, and 2-track audio drama recordings with basic soundtrack scoring.',
      'Upper Secondary Track (Ages 15–17 / Grades 10–12): Industry-standard Fountain screenplay pipeline, 4-layer DAW sound engineering (dialogue, room tone, spot foley, music textures), locked 90-second animatic, and pitch bible presentation to studio judges.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-story-bible',
      metric: 'Story Bible Structural Completeness',
      target: '100% completion of Character Psychological Profiles (Want/Need/Ghost), World Rules, and 15-Point Beat Sheet',
      verificationMethod: 'Phase 1 Story Bible Portfolio Audit against industry showrunner rubric'
    },
    {
      id: 'metric-screenplay-precision',
      metric: 'Screenplay Industry Formatting Index',
      target: '≥ 95% compliance with Fountain/Hollywood formatting (sluglines, action verbs, subtext ratio)',
      verificationMethod: 'Peer table-read and script analysis audit'
    },
    {
      id: 'metric-audio-visual-sync',
      metric: 'Animatic Multi-Track Sonic Continuity',
      target: 'Locked 60–90 second animatic featuring 4 distinct audio layers with clean dialogue ducking',
      verificationMethod: 'Master timeline inspection in DAW/video editor'
    }
  ],
  assumptions: [
    {
      id: 'asmp-speculative-themes',
      domain: 'Narrative Content',
      assumption: 'School permits PG-13 dramatic themes (dystopian sci-fi, political intrigue, personal loss) within constructive boundaries.',
      ownerVerificationNeeded: 'Confirm school guidelines on dramatic creative writing.'
    },
    {
      id: 'asmp-daw-access',
      domain: 'Technical Software',
      assumption: 'Students have access to free multi-track audio software (Audacity/GarageBand) and video timeline tools.',
      ownerVerificationNeeded: 'Confirm computer lab software permissions for media editing.'
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Psychological Character & World Architecture',
      strap: 'Want vs Need, The Fatal Flaw & Systemic World Logic',
      weeks: [1, 3],
      goal: 'Construct the psychological bedrock of protagonists and foils, define operational world laws with inviolable costs, and establish the inciting incident.',
      tasks: [
        'Week 1: Map Protagonist Want (external goal) vs Need (internal growth) and Ghost/Wound.',
        'Week 1: Construct a Foil/Rival whose core values clash directly with the protagonist.',
        'Week 1 Milestone: Write a 500-word subtextual dialogue scene over a trivial object.',
        'Week 2: Draft the System Rules Document defining operational laws, costs, and limits.',
        'Week 3: Craft 3 distinct variations of the Inciting Incident forcing a point of no return.'
      ],
      evidence: [
        'Psychological Character Profile Sheets (Protagonist & Foil)',
        'System Rules World-Building Document',
        '500-Word Subtext Trivial Argument Script Excerpt',
        '3 Inciting Incident Variations Analysis'
      ],
      aiPromptStarters: [
        'Here is my protagonist: [Profile]. Help me design a philosophical foil character whose core virtues make them the worst possible partner.',
        'Analyze my speculative world rule: [Rule]. What are 3 unintended socio-economic consequences that create dramatic obstacles?'
      ],
      competencies: ['ct-01', 'ctps-01', 'sea-01'],
      stretchCompetencies: ['ec-01'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Psychological Character Mapping: Want vs. Need',
          durationMin: 50,
          learningGoal: 'Move beyond surface visual traits to engineer core psychological conflicts (Want vs Need).',
          activities: [
            'Deconstruct iconic film protagonists: Luke Skywalker, Chihiro, Walter White.',
            'Define Protagonist External Want vs Internal Need.',
            'Identify the "Ghost / Wound" (the past traumatic anchor shaping their flaw).'
          ],
          learnerChoices: {
            question: 'What is the nature of your protagonist\'s Ghost/Wound?',
            options: [
              { id: 'opt-ghost-betrayal', label: 'Institutional Betrayal', description: 'Let down by an authority or mentor.' },
              { id: 'opt-ghost-loss', label: 'Personal Tragic Loss', description: 'Grief driving desperate over-control.' },
              { id: 'opt-ghost-failure', label: 'Public Catastrophic Failure', description: 'Paralyzing fear of repeating a past disaster.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your Protagonist’s Want, Need, Flaw, and Ghost statement.',
            targetCompetencies: ['ct-01', 'sea-01']
          },
          reflectionPrompt: 'Why must a character NOT get what they want until they confront what they need?',
          teacherTips: 'Push back against characters whose only flaw is being "too clumsy" or "too caring"; flaws must hurt people they love.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'The Foil/Rival & The Subtext Argument',
          durationMin: 50,
          learningGoal: 'Design a philosophical foil and write a 500-word dialogue sequence driven entirely by subtext.',
          activities: [
            'Design the Foil: Mirror the protagonist’s flaw with opposing virtuosic convictions.',
            'Pick a trivial prop (a dented canteen, a loose bolt, a chess move).',
            'Write the 500-word scene: they can only argue about the object, never the ideology.'
          ],
          learnerChoices: {
            question: 'What trivial object will carry the emotional freight?',
            options: [
              { id: 'opt-obj-tool', label: 'Broken Survival Tool', description: 'Argue about repair ethics and self-reliance.' },
              { id: 'opt-obj-food', label: 'Ration / Luxury Food item', description: 'Argue about sacrifice vs immediate survival.' },
              { id: 'opt-obj-map', label: 'Torn Route Map / Coordinate', description: 'Argue about caution vs reckless progress.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload the 500-word subtextual dialogue scene.',
            targetCompetencies: ['ec-01', 'ctps-01']
          },
          reflectionPrompt: 'How did writing about a broken tool make the characters feel more human than a philosophical speech?',
          teacherTips: 'Tell students: if a character says "I hate you because you don’t trust me," delete the line immediately!'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: 'Systemic World-Building & The Cost of Power',
          durationMin: 50,
          learningGoal: 'Formulate rigid operational laws and costs for speculative technology or world elements.',
          activities: [
            'Brandon Sanderson’s Laws of Magic & Technology: Limitations are more interesting than powers.',
            'Draft 2 core System Rules with steep thermodynamic or psychological costs.',
            'Map the primary story hub (the architectural layout where scenes take place).'
          ],
          learnerChoices: {
            question: 'What type of limitation restricts your universe?',
            options: [
              { id: 'opt-cost-biological', label: 'Biological / Neural Strain', description: 'Usage degrades physical or mental stamina.' },
              { id: 'opt-cost-economic', label: 'Extreme Material Scarcity', description: 'Every activation consumes a rare fuel or currency.' },
              { id: 'opt-cost-ethical', label: 'Moral Paradox / Collateral', description: 'Every solution creates an equal systemic hazard.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 2 Inviolable System Rules and story hub spatial sketch.',
            targetCompetencies: ['ct-02', 'ctps-02']
          },
          reflectionPrompt: 'How does limiting your world’s technology prevent cheap deus-ex-machina plot resolutions?',
          teacherTips: 'Make sure world rules create friction for the protagonist specifically, not just general background lore.'
        },
        {
          sessionNumber: 4,
          week: 3,
          title: 'Problem Identification & Inciting Incident Triangulation',
          durationMin: 50,
          learningGoal: 'Craft 3 distinct variations of the Inciting Incident and evaluate dramatic impact.',
          activities: [
            'Analyze Status Quo vs Imminent Threat.',
            'Draft 3 variations of the Inciting Incident: The Personal Attack, The Systemic Collapse, The Moral Dilemma.',
            'Peer Pitch: Test which variation forces the most painful choice from the protagonist.'
          ],
          learnerChoices: {
            question: 'Which Inciting Incident variation creates the highest dramatic stakes?',
            options: [
              { id: 'opt-inc-dilemma', label: 'The Moral Dilemma', description: 'Save a stranger vs preserve personal safety.' },
              { id: 'opt-inc-loss', label: 'The Loss of Status Quo', description: 'Their sanctuary is breached, leaving no return.' },
              { id: 'opt-inc-secret', label: 'The Discovered Secret', description: 'A hidden truth shatters their worldview.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your 3 Inciting Incident variations and score their dramatic leverage.',
            targetCompetencies: ['ctps-03', 'ec-02']
          },
          reflectionPrompt: 'Why must the Inciting Incident feel like an intentional assault on the protagonist\'s specific psychological flaw?',
          teacherTips: 'If the protagonist can simply ignore the inciting event and go back to sleep, the stakes are not high enough.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Dramatic Structure & 15-Point Beat Sheet',
      strap: 'Causality Mapping & The "Therefore / But" Narrative Engine',
      weeks: [4, 5],
      goal: 'Pace the macro-narrative arc using a 15-point beat sheet driven by strict cause-and-effect relationships ("Therefore / But").',
      tasks: [
        'Study narrative progressions: Plot Point 1, The Midpoint, Plot Point 2 (All Is Lost), Climax.',
        'Eliminate episodic "And then..." sequences; re-link all beats via "Therefore..." or "But...".',
        'Map the complete 15-point story beat chart.',
        'Week 5 Milestone: Consolidate the unified digital Story Bible and pass peer review simulation.'
      ],
      evidence: [
        '15-Point Story Beat Chart with Therefore/But tags',
        'Consolidated Creative IP Story Bible PDF/Doc',
        'Phase 1 Story Bible Peer Review Critique Sheet'
      ],
      aiPromptStarters: [
        'Here is my beat sheet: [Beats]. Identify where the narrative falls into episodic "And then..." plotting and suggest causal "Therefore / But" bridges.',
        'Evaluate the Midpoint of my story: Does it successfully shift the protagonist from reactive defense to proactive pursuit?'
      ],
      competencies: ['ct-03', 'ctps-04', 'sdl-01'],
      stretchCompetencies: ['lc-01'],
      sessions: [
        {
          sessionNumber: 5,
          week: 4,
          title: 'The Midpoint Shift: Reactive to Proactive',
          durationMin: 50,
          learningGoal: 'Design a structural midpoint turning point where the protagonist shifts from surviving to attacking.',
          activities: [
            'Break down the Midpoint in classic cinema (e.g., The Matrix, Spirited Away, Dune).',
            'Contrast Part 1 (Protagonist reacting defensively) with Part 2 (Protagonist going on the offensive).',
            'Draft the false victory or false defeat that triggers the shift.'
          ],
          learnerChoices: {
            question: 'Is your story\'s midpoint a False Victory or False Defeat?',
            options: [
              { id: 'opt-mid-victory', label: 'False Victory', description: 'They achieve their Want, but realize it solves nothing.' },
              { id: 'opt-mid-defeat', label: 'False Defeat', description: 'Total loss of resources, forcing an internal rebirth.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Describe your story’s Midpoint sequence and the exact psychological shift it causes.',
            targetCompetencies: ['ct-03', 'ctps-04']
          },
          reflectionPrompt: 'Why does a passive protagonist who never takes proactive initiative bore the audience?',
          teacherTips: 'Help students identify the exact moment their character stops running and turns around to face the fire.'
        },
        {
          sessionNumber: 6,
          week: 4,
          title: 'The 15-Point Beat Sheet & Causality Matrix',
          durationMin: 50,
          learningGoal: 'Construct the comprehensive 15-point beat sheet using strict cause-and-effect connectors.',
          activities: [
            'Index Card Corkboard Workshop: Arrange 15 beats on a timeline.',
            'Causality Audit: Replace every "and then" with "therefore" (consequence) or "but" (obstacle).',
            'Identify Plot Point 2 ("All Is Lost" / The Dark Night of the Soul).'
          ],
          learnerChoices: {
            question: 'How do you want to visualize your 15 beats?',
            options: [
              { id: 'opt-vis-index', label: 'Tactile Physical Index Cards', description: 'Color-coded cards on table or wall.' },
              { id: 'opt-vis-digital', label: 'Digital Miro / Kanban Board', description: 'Virtual sticky notes with drag-and-drop causality arrows.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo or screenshot of your 15-Point Beat Sheet.',
            targetCompetencies: ['ctps-05', 'sdl-02']
          },
          reflectionPrompt: 'How does checking "Therefore / But" connections reveal plot holes before you write a single script page?',
          teacherTips: 'Be ruthless on causality: if beat 4 doesn’t happen as a direct result of beat 3, make them rewrite it.'
        },
        {
          sessionNumber: 7,
          week: 5,
          title: 'Story Bible Assembly & Universe Architecture',
          durationMin: 50,
          learningGoal: 'Compile character sheets, system rules, and beat sheets into an executive Creative IP Story Bible.',
          activities: [
            'Format the Story Bible into industry standard sections: Logline, Synopsis, Characters, World Rules, Season/Film Arc.',
            'Design an aesthetic title cover and moodboard styling.',
            'Conduct a self-audit against showrunner criteria.'
          ],
          learnerChoices: {
            question: 'What visual layout style fits your Story Bible?',
            options: [
              { id: 'opt-sty-classified', label: 'Classified Dossier / Sci-Fi Tablet', description: 'In-universe aesthetic with technical diagrams.' },
              { id: 'opt-sty-cinematic', label: 'Cinematic Pitch Lookbook', description: 'Wide cinematic imagery, bold typography.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload the assembled Creative IP Story Bible document.',
            targetCompetencies: ['ec-03', 'sdl-03']
          },
          reflectionPrompt: 'How does having an organized Story Bible make you feel like a professional showrunner?',
          teacherTips: 'Praise clean typography and layout hierarchy; presentation sells an IP.'
        },
        {
          sessionNumber: 8,
          week: 5,
          title: 'Story Bible Review Simulation & Phase 1 Gate',
          durationMin: 50,
          learningGoal: 'Defend story logic under peer review scrutiny and lock the narrative foundation.',
          activities: [
            'Peer Review Simulation: Swap Story Bibles with a partner acting as a studio executive.',
            'Red-Team Critique: Check for cliché concepts, plot armor, or unresolved rule contradictions.',
            'Phase 1 Gate Sign-off: Secure mentor approval to proceed to screenplay production.'
          ],
          learnerChoices: {
            question: 'What aspect of peer feedback will you incorporate?',
            options: [
              { id: 'opt-fb-world', label: 'Sharpen World Rule Clarity', description: 'Close loop holes in the speculative laws.' },
              { id: 'opt-fb-foil', label: 'Deepen Foil Character Friction', description: 'Raise the ideological stakes between leads.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Submit the completed Peer Review Critique Sheet and list changes made.',
            targetCompetencies: ['ctps-06', 'sea-02']
          },
          reflectionPrompt: 'What was it like having someone point out a logical flaw in your universe, and how did fixing it improve the story?',
          teacherTips: 'Model receiving critique gracefully; separating personal ego from the work is essential for writers.'
        }
      ]
    },
    {
      id: 'define',
      title: 'The Screenplay Blueprint & Scene Formatting',
      strap: 'Industry Standard Formatting, Sluglines & Power Shifts',
      weeks: [6, 7],
      goal: 'Translate visual action and subtextual behavior into strict industry screenplay conventions (Scene Headings, Action, Dialogue, Power Shifts).',
      tasks: [
        'Master standard elements: Scene Headings (INT./EXT. LOCATION - DAY), Action lines (seen/heard only), Character cues, Parentheticals.',
        'Map scene anatomy: Define who holds power at the start, and execute a clear power shift by the end.',
        'Week 6 Milestone: Write a 2-page sequence relying entirely on visual action with zero dialogue.',
        'Week 7 Milestone: Rewrite a dialogue sequence using subtext, reducing word count by 40% while increasing tension.'
      ],
      evidence: [
        '2-Page Silent Visual Action Screenplay Scene',
        'Subtext Dialogue Rewrite (40% word count reduction comparison)',
        'Scene Power-Shift Breakdown Diagram'
      ],
      aiPromptStarters: [
        'Check my screenplay action lines: Did I accidentally include internal thoughts or unfilmable emotions?',
        'Highlight on-the-nose lines in this scene and propose subtextual alternatives that weaponize subtext.'
      ],
      competencies: ['ec-04', 'ct-04', 'ctps-07'],
      stretchCompetencies: ['lc-02'],
      sessions: [
        {
          sessionNumber: 9,
          week: 6,
          title: 'Screenplay Formatting: Writing Only What Can Be Seen & Heard',
          durationMin: 50,
          learningGoal: 'Format a script according to Hollywood standards and eliminate unfilmable internal exposition.',
          activities: [
            'Fountain & Screenplay Syntax: Sluglines, Action paragraphs (max 3 lines), Character Cues.',
            'The "Camera Eye" Rule: If the camera cannot capture it and the mic cannot record it, delete it from action lines.',
            'Write the opening slugline and atmospheric action paragraph.'
          ],
          learnerChoices: {
            question: 'What opening scene environment best establishes your tone?',
            options: [
              { id: 'opt-env-claustro', label: 'Claustrophobic Interior', description: 'Tense, dim, tight quarters focusing on micro-sounds.' },
              { id: 'opt-env-expansive', label: 'Vast Desolate Exterior', description: 'Huge spatial scale highlighting character isolation.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload your formatted opening screenplay scene excerpt.',
            targetCompetencies: ['ec-04', 'ctps-07']
          },
          reflectionPrompt: 'Why does restricting action lines to only what can be seen and heard force you to become a better visual director?',
          teacherTips: 'Watch for phrases like "He remembers his childhood"; replace with "He stares at a scorched wooden toy in his palm."'
        },
        {
          sessionNumber: 10,
          week: 6,
          title: 'The Anatomy of a Scene: Executing the Power Shift',
          durationMin: 50,
          learningGoal: 'Structure every scene around a dynamic power shift between characters or environment.',
          activities: [
            'Identify Power Dynamic: Character A starts with 80% leverage; Character B has 20%.',
            'The Tipping Point: An action, revelation, or tactical shift flips the leverage.',
            'Write a 2-page sequence with zero dialogue that communicates this power shift purely through action.'
          ],
          learnerChoices: {
            question: 'What triggers the silent power shift in your scene?',
            options: [
              { id: 'opt-shift-physical', label: 'Physical Action / Concealment', description: 'Securing a weapon or slipping an access card.' },
              { id: 'opt-shift-discovery', label: 'Environmental Revelation', description: 'Noticing a detail the other character missed.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload the 2-Page Silent Visual Action sequence.',
            targetCompetencies: ['ct-04', 'ec-04']
          },
          reflectionPrompt: 'How did removing dialogue force you to use physical behavior and blocking to convey power?',
          teacherTips: 'Great cinema is visual first; dialogue should be the icing on the cake, not the cake itself.'
        },
        {
          sessionNumber: 11,
          week: 7,
          title: 'Dialogue Mechanics: Eliminating the On-the-Nose',
          durationMin: 50,
          learningGoal: 'Eliminate on-the-nose exposition and establish distinct character verbal footprints.',
          activities: [
            'On-the-Nose Autopsy: Read bad soap-opera scripts vs The Godfather or Succession.',
            'Distinct Verbal Footprints: Establish cadence, vocabulary, and defense mechanisms for each character.',
            'Execute the 40% Cut: Take an existing scene, cut word count by 40%, and watch dramatic tension spike.'
          ],
          learnerChoices: {
            question: 'How does your antagonist disguise their threats?',
            options: [
              { id: 'opt-threat-polite', label: 'Chilling Politeness & Hospitality', description: 'Smiling and offering tea while ruining lives.' },
              { id: 'opt-threat-bureaucracy', label: 'Impersonal Bureaucratic Inevitability', description: 'Treating cruelty as mundane administrative paperwork.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload the Before-and-After 40% dialogue reduction comparison.',
            targetCompetencies: ['ec-05', 'ctps-08']
          },
          reflectionPrompt: 'What happens in the silence between characters when words are kept sparse?',
          teacherTips: 'Characters should almost never say what they actually mean; they talk around the wound.'
        },
        {
          sessionNumber: 12,
          week: 7,
          title: '3-Scene Script Blueprint Formulation',
          durationMin: 50,
          learningGoal: 'Outline the precise 3-Scene Script to be produced: Scene 1 (Setup), Scene 2 (Rising Conflict), Scene 3 (Climax).',
          activities: [
            'Map the 3-Scene Script Arc (Target: 8–10 total pages).',
            'Scene 1: Visual tone, character introduction, world friction.',
            'Scene 2: Rising action, unexpected complication, ideological clash.',
            'Scene 3: High stakes confrontation and teased expanded universe.'
          ],
          learnerChoices: {
            question: 'Where will your 3-Scene Script culminate?',
            options: [
              { id: 'opt-climax-standoff', label: 'Ideological Standoff', description: 'Foil characters forced into an irreversible choice.' },
              { id: 'opt-climax-breach', label: 'Catastrophic System Breach', description: 'World rules collapse, requiring sacrifice.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit the 3-Scene Script Production Blueprint with sluglines and goals.',
            targetCompetencies: ['sdl-04', 'ctps-09']
          },
          reflectionPrompt: 'Why is mastering a self-contained 3-scene sequence better practice than attempting a sprawling 120-page screenplay?',
          teacherTips: 'Restricting scope to 3 scenes allows obsessive polish and ensures students actually finish.'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Script Drafting, Revision & Table Read',
      strap: 'First Draft Execution, Ruthless Polishing & Script Lock',
      weeks: [8, 10],
      goal: 'Draft the full 8–10 page first draft across Scenes 1, 2, and 3, polish evocative verbs, and lock the script via table-read simulation.',
      tasks: [
        'Week 8: Draft Scene 1 (visual tone, world state) and Scene 2 (rising action).',
        'Week 9: Draft Scene 3 (confrontation, twist) and Immediate Resolution.',
        'Week 9 Milestone: Complete the full First Draft of the 3-Scene Script (8–10 pages).',
        'Week 10: Ruthless editing: swap weak verbs for visceral descriptions.',
        'Week 10 Milestone: Table read simulation and lock the final script draft.'
      ],
      evidence: [
        'First Draft 3-Scene Script (8–10 pages)',
        'Table Read Simulation audio notes & marked revision pages',
        'Locked Final Screenplay Package'
      ],
      aiPromptStarters: [
        'Simulate a table read of this scene: Act as the Foil character and read these dialogue lines back to me with vocal inflection.',
        'Find any instances of weak passive verbs in this action line and suggest punchier cinematic alternatives.'
      ],
      competencies: ['ec-06', 'ctps-10', 'sdl-05'],
      stretchCompetencies: ['lc-03'],
      sessions: [
        {
          sessionNumber: 13,
          week: 8,
          title: 'Drafting Scenes 1 & 2: Establishing Tone and Complication',
          durationMin: 50,
          learningGoal: 'Maintain momentum and pacing when translating an outline into raw script pages.',
          activities: [
            'Sprint 1 (25 mins): Write Scene 1 pages (introductory visual beats and character entrance).',
            'Mid-Sprint Review: Check action line brevity and slugline transitions.',
            'Sprint 2 (25 mins): Write Scene 2 pages (the friction escalation).'
          ],
          learnerChoices: {
            question: 'What pacing rhythm dominates Scene 2?',
            options: [
              { id: 'opt-pace-rapid', label: 'Staccato / Rapid Tension', description: 'Short 1-line action sentences, quick exchanges.' },
              { id: 'opt-pace-slowburn', label: 'Simmering Slow-Burn', description: 'Deliberate pauses, sensory details, mounting dread.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload First Draft pages for Scenes 1 and 2 (4–5 pages).',
            targetCompetencies: ['ec-06', 'sdl-05']
          },
          reflectionPrompt: 'How did writing in sprints prevent you from second-guessing yourself during the first draft?',
          teacherTips: 'First draft goal is momentum; forbid students from rewriting page 1 ten times.'
        },
        {
          sessionNumber: 14,
          week: 9,
          title: 'Drafting Scene 3 & The Structural Climax Resolution',
          durationMin: 50,
          learningGoal: 'Craft a satisfying structural payoff that resolves the immediate scene conflict while teasing the broader world.',
          activities: [
            'Climax Construction: Bring the protagonist’s Want and Need into direct collision.',
            'The Moment of Choice: Force the protagonist to abandon their old flaw to survive.',
            'Resolution & World Expansion: The final closing image that answers the opening scene question.'
          ],
          learnerChoices: {
            question: 'How does your 3-Scene Script conclude?',
            options: [
              { id: 'opt-res-pyrrhic', label: 'Pyrrhic Victory', description: 'They win the objective but at an immense emotional cost.' },
              { id: 'opt-res-cliff', label: 'World-Altering Cliffhanger', description: 'The immediate crisis is solved, uncovering a vast mystery.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload the completed full First Draft (8–10 pages).',
            targetCompetencies: ['ctps-10', 'ec-06']
          },
          reflectionPrompt: 'Does the ending feel earned based on choices made in Scene 1, or did you rely on luck?',
          teacherTips: 'Check that the climax forces a genuine sacrifice; easy wins are unmemorable.'
        },
        {
          sessionNumber: 15,
          week: 10,
          title: 'Polishing Visceral Action Verbs',
          durationMin: 50,
          learningGoal: 'Ruthlessly edit action sequences by swapping out weak passive verbs for visceral cinematic language.',
          activities: [
            'Search & Destroy: Hunt down forms of "is walking", "seems to be", "begins to".',
            'Upgrade Verbs: Replace generic verbs ("runs", "looks") with evocative physical verbs ("scrambles", "scans", "drifts").',
            'Pacing Cadence: Format sentence lengths to match the tempo of the edit.'
          ],
          learnerChoices: {
            question: 'What sensory register will you emphasize in your action polish?',
            options: [
              { id: 'opt-sens-acoustic', label: 'Acoustic / Sonic Texture', description: 'Scraping metal, hiss of vacuum, ragged breathing.' },
              { id: 'opt-sens-kinetic', label: 'Kinetic Weight & Inertia', description: 'Staggering balance, heavy recoil, visceral impact.' }
            ]
          },
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Upload an excerpt showcasing your polished, high-impact action descriptions.',
            targetCompetencies: ['ec-06', 'ct-05']
          },
          reflectionPrompt: 'How does changing just three verbs alter how fast an action sequence reads?',
          teacherTips: 'Screenplays are poetry written in light and sound; every word must earn its real estate on the page.'
        },
        {
          sessionNumber: 16,
          week: 10,
          title: 'Table Read Simulation & Script Lock',
          durationMin: 50,
          learningGoal: 'Read the script aloud with peer voice actors to check cadence, eliminate clunky dialogue, and lock the script.',
          activities: [
            'Table Read Cast Assignment: Assign peers to read Protagonist, Foil, and Stage Directions.',
            'Live Read Performance: Listen for stumble spots, unnatural phrasing, and timing lulls.',
            'Script Lock Ceremony: Make final pencil revisions and officially lock the script for pre-production.'
          ],
          learnerChoices: {
            question: 'What was the #1 dialogue line that failed during the table read?',
            options: [
              { id: 'opt-fix-awkward', label: 'Tongue-Twister Phrasing', description: 'Actor struggled to say the line naturally.' },
              { id: 'opt-fix-obvious', label: 'Accidental Exposition', description: 'Line felt like an explanation to the audience rather than real speech.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload the locked Final Script Package with table read notes.',
            targetCompetencies: ['ec-06', 'sdl-06']
          },
          reflectionPrompt: 'Why does hearing your words spoken aloud by another person instantly expose flaws you couldn\'t see on the page?',
          teacherTips: 'Celebrate the Script Lock! No more major story rewrites after this session; production begins now.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Cinematic Storyboarding, Audio & Animatic Assembly',
      strap: '180° Rule, Asset Manifest, Multi-Track Audio & Timed Animatic',
      weeks: [11, 15],
      goal: 'Translate the locked script into a 30-frame storyboard, curate technical visual assets, record clean scratch vocal tracks, and assemble a locked animatic.',
      tasks: [
        'Week 11: Master framing standards (Wide, Medium, Close-up) and camera movement; draw 30-frame minimum storyboard respecting the 180° rule.',
        'Week 12: Build Technical Asset Manifest (character expressions, backgrounds, props with clean transparency layers).',
        'Week 13: Create Audio Cue Sheet across 4 layers (Dialogue, Atmosphere, Foley/SFX, Score).',
        'Week 14: Record clean scratch vocal tracks and apply basic EQ/compression processing.',
        'Week 15 Milestone: Assemble timed Production Animatic in video editor and lock the rough cut.'
      ],
      evidence: [
        '30-Frame Cinematic Storyboard sequence',
        'Production Asset Pack (character transparency sheets & backgrounds)',
        '4-Layer Audio Cue Sheet & recorded voiceover stems',
        'Locked Production Animatic Video/Export'
      ],
      aiPromptStarters: [
        'Here is my storyboard shot sequence: [Shots]. Am I accidentally crossing the 180-degree axis line between character A and B?',
        'Suggest 4 spot foley sounds to enhance the tension in a scene where [Event occurs].'
      ],
      competencies: ['ctps-11', 'ec-07', 'sdl-07'],
      stretchCompetencies: ['lc-04'],
      sessions: [
        {
          sessionNumber: 17,
          week: 11,
          title: 'Cinematic Framing, Camera Movement & The 180° Rule',
          durationMin: 50,
          learningGoal: 'Apply shot framing psychology (Wide, Medium, Close-up) and preserve spatial continuity via the 180° rule.',
          activities: [
            'Cinematic Grammar: Wide shot for isolation/scale, Medium for interaction, Close-up for interior crisis.',
            'The 180-Degree Rule: Draw the invisible axis between characters; keep the camera on one side to preserve screen direction.',
            'Sketch 6 initial keyframe thumbnails for Scene 1.'
          ],
          learnerChoices: {
            question: 'What camera angle will reveal your protagonist’s emotional climax?',
            options: [
              { id: 'opt-cam-dutch', label: 'Dutch Angle / Tilted Horizon', description: 'Conveys disorientation and psychological collapse.' },
              { id: 'opt-cam-extreme', label: 'Extreme Low-Angle Hero Shot', description: 'Conveys desperate defiance and sudden authority.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your 180-Degree Rule axis diagram and 6 keyframe thumbnails.',
            targetCompetencies: ['ct-06', 'ctps-11']
          },
          reflectionPrompt: 'What happens to the viewer\'s brain when a film accidentally breaks the 180-degree rule?',
          teacherTips: 'Use miniature toy figures or chess pieces on a table to physically demonstrate camera sightlines.'
        },
        {
          sessionNumber: 18,
          week: 12,
          title: 'The Production Asset Pack & Technical Breakdown',
          durationMin: 50,
          learningGoal: 'Curate a production asset manifest with transparent character layers and environment backdrops.',
          activities: [
            'Asset Manifest Inventory: List every character pose, variant expression, background, and foreground prop.',
            'Digital Layer Separation: Ensure character figures are separated onto transparent PNG layers for digital camera pans.',
            'Color Palette & Lighting Key: Define the master atmospheric tone.'
          ],
          learnerChoices: {
            question: 'What visual art pipeline are you deploying?',
            options: [
              { id: 'opt-pipe-2d', label: '2D Digital Illustration & Painting', description: 'Expressive hand-drawn character poses and painterly plates.' },
              { id: 'opt-pipe-hybrid', label: 'Hybrid Collage / Photo-Bashed Matte', description: 'Grounded architectural textures mixed with stylized linework.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your Production Asset Pack (Character sheets with transparency & background layouts).',
            targetCompetencies: ['ec-07', 'sdl-08']
          },
          reflectionPrompt: 'Why does separating character artwork from the background make video editing ten times faster?',
          teacherTips: 'Make sure canvas resolutions are set to at least 1920x1080 to prevent pixelation during digital pans.'
        },
        {
          sessionNumber: 19,
          week: 13,
          title: 'Audio Architecture: The 4-Layer Sound Landscape',
          durationMin: 50,
          learningGoal: 'Architect an industry-standard Audio Cue Sheet mapping Dialogue, Ambiance, Foley, and Score.',
          activities: [
            'The 4 Sonic Layers: (1) Voice, (2) Ambient room tone, (3) Practical Spot Foley, (4) Musical score.',
            'Audio Cue Sheet Construction: Map timestamps to specific sounds across the timeline.',
            'Foley Hunt: Plan how to record practical real-world sound effects using everyday objects.'
          ],
          learnerChoices: {
            question: 'What unexpected real-world object will generate your sci-fi sound effects?',
            options: [
              { id: 'opt-fol-kitchen', label: 'Kitchen Metal & Utensils', description: 'Reverberant clicks, airlock seals, metallic clangs.' },
              { id: 'opt-fol-fabric', label: 'Leather & Heavy Canvas', description: 'Movement foley, holster draws, heavy footsteps.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload the 4-Layer Audio Cue Sheet spreadsheet.',
            targetCompetencies: ['ctps-11', 'sdl-09']
          },
          reflectionPrompt: 'Why does an audience notice bad sound before they notice bad visuals?',
          teacherTips: 'Teach students to record 30 seconds of pure "room tone" before recording any dialogue; it is essential for clean audio edits.'
        },
        {
          sessionNumber: 20,
          week: 15,
          title: 'Production Animatic Assembly & Timeline Lock',
          durationMin: 50,
          learningGoal: 'Assemble storyboard frames and scratch audio into a synchronized timeline animatic and lock the edit.',
          activities: [
            'Timeline Import: Place storyboard images on video timeline in sync with voice tracks.',
            'Duration Tuning: Adjust shot lengths so every visual stays on screen long enough to read but short enough to maintain pacing.',
            'Animatic Screening & Review: Verify that story rhythm works before spending dozens of hours on final art.'
          ],
          learnerChoices: {
            question: 'What shot duration adjustment will you make to increase tension?',
            options: [
              { id: 'opt-cut-faster', label: 'Tighten Action Cuts', description: 'Cut shots to under 1.5 seconds during confrontation.' },
              { id: 'opt-cut-linger', label: 'Linger on Close-up', description: 'Hold on protagonist\'s eye expression for 4 full seconds.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload the exported Production Animatic video.',
            targetCompetencies: ['ec-07', 'ctps-12']
          },
          reflectionPrompt: 'How did watching the animatic with sound reveal pacing bugs that were invisible on paper?',
          teacherTips: 'An animatic is the ultimate safety net; fixing a pacing issue now takes 2 minutes instead of 2 days in post.'
        }
      ]
    },
    {
      id: 'test',
      title: 'Sound Design, Post-Production & Mixing Mastery',
      strap: 'Digital Camera Moves, Foley Ducking & Master Color Grading',
      weeks: [16, 18],
      goal: 'Integrate high-fidelity assets, animate digital camera moves, build immersive multi-layer foley landscapes with audio ducking, and master the final mix.',
      tasks: [
        'Week 16: Picture Lock: Swap storyboard frames for final high-fidelity art assets and program camera pans/tilts/shakes.',
        'Week 17: Multi-Layer Sound Mixing: Layer ambient textures, spot foley, and score with dialogue ducking.',
        'Week 18 Milestone: Final audio-visual mix-down, frequency balancing, color grading overlays, subtitles, and export master file.'
      ],
      evidence: [
        'Picture Lock editing timeline screenshot',
        'Multi-Track Audio Landscape with Ducking settings',
        'Master Render Micro-Short Film / Pitch Preview file'
      ],
      aiPromptStarters: [
        'How do I calculate sidechain compression (ducking) in my audio editor so the music lowers by 6 dB whenever dialogue plays?',
        'Recommend color grading lookup tables (LUTs) or tint palettes to evoke a cold, retro-futuristic dystopia.'
      ],
      competencies: ['ec-08', 'ctps-13', 'sdl-10'],
      stretchCompetencies: ['lc-05'],
      sessions: [
        {
          sessionNumber: 21,
          week: 16,
          title: 'High-Fidelity Asset Integration & Digital Camera Movement',
          durationMin: 50,
          learningGoal: 'Bring static 2D assets to life using software timeline keyframing (pans, tilts, camera shakes, depth-of-field).',
          activities: [
            'Digital Camera Language: Apply slow push-ins to indicate rising character panic.',
            'Camera Shake Keyframing: Add subtle jitter during kinetic impacts or explosions.',
            'Picture Lock: Freeze the visual timeline so sound designers can finalize audio against immovable timecodes.'
          ],
          learnerChoices: {
            question: 'What digital camera move will punctuate your scene\'s climax?',
            options: [
              { id: 'opt-move-push', label: 'Slow Dramatic Push-In', description: 'Gradual zoom into character eyes as realization hits.' },
              { id: 'opt-move-whip', label: 'Dynamic Whip Pan', description: 'Fast lateral motion transition connecting character to threat.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a 15-second screen recording showing your keyframed camera moves in action.',
            targetCompetencies: ['ec-08', 'ct-07']
          },
          reflectionPrompt: 'How does subtle camera motion make static 2D illustrations feel like a living cinematic shot?',
          teacherTips: 'Less is more with camera moves; avoid excessive zooms that cause motion sickness.'
        },
        {
          sessionNumber: 22,
          week: 18,
          title: 'Multi-Track Foley Mixing, Ducking & Master Color Grade',
          durationMin: 50,
          learningGoal: 'Master the audio mix using dialogue ducking and unify visual tone with a cohesive color grading wash.',
          activities: [
            'Audio Ducking: Configure musical tracks to automatically duck -6 dB to -10 dB whenever vocal tracks speak.',
            'Frequency Leveling: Ensure master dialogue peaks between -6 dB and -3 dB with zero red-line clipping.',
            'Unified Color Grading: Apply atmospheric color overlays and render out the definitive master file.'
          ],
          learnerChoices: {
            question: 'What color grading tone will unify your visual assets?',
            options: [
              { id: 'opt-col-cyan', label: 'Cyan / Amber Contrast', description: 'Cold industrial shadows with warm skin highlights.' },
              { id: 'opt-col-sepia', label: 'Monochrome Bleach Bypass', description: 'Desaturated, high-contrast gritty realism.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload the Master Render of the micro-short film/pitch preview.',
            targetCompetencies: ['ctps-13', 'ec-08']
          },
          reflectionPrompt: 'When you listen with your eyes closed, does the audio landscape tell a complete story on its own?',
          teacherTips: 'Check mix levels on both headphones and cheap phone speakers; dialogue must be intelligible everywhere.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Grand Showcase & Professional IP Pitch Simulation',
      strap: '5-Minute IP Pitch, Case Study Documentation & Industry Showcase',
      weeks: [19, 20],
      goal: 'Compile a professional online case study portfolio, rehearse a 5-minute verbal IP pitch to studio mentors, and celebrate at the Grand Showcase.',
      tasks: [
        'Week 19: Compile Case Study: initial character sketches, evolution files, script excerpts, and storyboard-to-screen comparisons.',
        'Week 20: Organize 5-minute verbal pitch: Core Concept, Character Psychology, World Rules, and Screening the Preview clip.',
        'Week 20 Milestone: Grand Showcase presentation to mentors, peers, and industry guests.'
      ],
      evidence: [
        'Online Portfolio Case Study document/link',
        '5-Minute Pitch Presentation deck & video recording',
        'Showcase Audience Feedback cards & Post-Mortem reflection'
      ],
      aiPromptStarters: [
        'Help me condense my 20-week story into a punchy 60-second verbal elevator pitch for a studio executive.',
        'What are 3 tough technical questions an animation director or showrunner might ask about my production pipeline?'
      ],
      competencies: ['ec-09', 'sdl-11', 'sea-03'],
      stretchCompetencies: ['ent-01'],
      sessions: [
        {
          sessionNumber: 23,
          week: 19,
          title: 'Case Study Documentation: Revealing the Creative Pipeline',
          durationMin: 50,
          learningGoal: 'Structure a professional case study documenting creative choices, technical hurdles, and iterative growth.',
          activities: [
            'Assemble the "Before vs After" gallery: rough thumbnails next to final rendered shots.',
            'Write the Technical Post-Mortem: "What broke, how we fixed it, and what we learned about the tools."',
            'Design clean portfolio display cards.'
          ],
          learnerChoices: {
            question: 'What production hurdle will lead your case study narrative?',
            options: [
              { id: 'opt-hurdle-audio', label: 'The Audio Mixing Challenge', description: 'How dialogue clarity was salvaged through foley modeling.' },
              { id: 'opt-hurdle-pacing', label: 'The Animatic Pacing Overhaul', description: 'How trimming 12 seconds saved the scene’s dramatic climax.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload the Case Study breakdown document.',
            targetCompetencies: ['sdl-11', 'ec-09']
          },
          reflectionPrompt: 'Why are creative directors more interested in how you solved problems than just seeing a pretty final image?',
          teacherTips: 'Celebrating mistakes and iterative pivots shows true engineering and creative maturity.'
        },
        {
          sessionNumber: 24,
          week: 20,
          title: 'The Grand Showcase & Studio Pitch Simulation',
          durationMin: 50,
          learningGoal: 'Deliver a compelling 5-minute verbal IP pitch and screen the final cinematic preview to an audience of mentors.',
          activities: [
            'Pitch Rehearsal: (1) The Logline, (2) Character Want vs Need, (3) World Rules, (4) Screen the Micro-Short Preview.',
            'Grand Showcase Screening: Live audience screening with mentor Q&A.',
            'Final Genesis Engine Certification: Celebrate 200 hours of professional storytelling mastery!'
          ],
          learnerChoices: {
            question: 'What is the future trajectory for your intellectual property?',
            options: [
              { id: 'opt-fut-pilot', label: 'Expand into Full Pilot Episode', description: 'Write full 30-page script and launch a webcomic.' },
              { id: 'opt-fut-game', label: 'Adapt into Interactive Game', description: 'Port world rules and characters into a playable prototype.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload the final Showcase Pitch video recording and audience evaluations.',
            targetCompetencies: ['ec-09', 'sea-03']
          },
          reflectionPrompt: 'Looking back over 20 weeks and 200 hours, what does it feel like to hold an entire universe of your own creation?',
          teacherTips: 'Award Genesis Showrunner Certificates to all students; emphasize that they have completed an actual studio pre-production cycle.'
        }
      ]
    }
  ]
};
