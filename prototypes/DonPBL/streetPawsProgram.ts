/**
 * StreetPaws — The Community Animal Rescue App
 * 12 Weeks | 2 Hours per Day (Monday–Friday) | 10 Hours per Week | 120 Hours Total
 * Framework: Design Thinking (Empathize, Define, Ideate, Prototype, Test & Pitch)
 *
 * Location: prototypes/DonPBL/streetPawsProgram.ts
 */

import type { PblProgram } from './programData';

export interface StreetPawsCoreFeature {
  number: number;
  id: string;
  title: string;
  description: string;
  sampleUxDetail: string;
}

export interface StreetPawsMtcCompetency {
  number: number;
  weLearnFutureSkill: string;
  lSecCodeAndName: string;
  uSecCodeAndName: string;
  eslICanGoal: string;
  portfolioArtifact: string;
  competencyIds: string[];
}

export interface StreetPawsDailyRoutineBlock {
  timeRange: string;
  duration: string;
  title: string;
  description: string;
}

export interface StreetPawsWeekPlan {
  week: number;
  curriculumPhase: string;
  mappedDesignPhase: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'share';
  title: string;
  drivingQuestion: string;
  targetCompetency: string;
  eslVocabulary: string[];
  monTueActivity: string;
  wedThuActivity: string;
  friCheckpoint: string;
  concreteExamples: string[];
  lSecDifferentiation: string;
  uSecDifferentiation: string;
}

export interface StreetPawsPitchSlide {
  slideNumber: number;
  title: string;
  description: string;
}

export interface StreetPawsEslPitchSpeaker {
  speakerNumber: number;
  title: string;
  duration: string;
  scriptTemplate: string[];
}

export interface StreetPawsRubricRow {
  number: number;
  competency: string;
  codes: string;
  emerging: string;
  developing: string;
  proficientTargetCredit: string;
  mastery: string;
}

export interface StreetPawsBadge {
  id: string;
  title: string;
  phase: string;
  criteria: string;
  xp: number;
}

export const STREETPAWS_CORE_FEATURES: StreetPawsCoreFeature[] = [
  {
    number: 1,
    id: 'food-donation-hub',
    title: '1. Food Donation Hub',
    description: 'Buy or donate pet food to local drop-off points.',
    sampleUxDetail: '"Buy 1 Bowl of Food for 15 THB" button + 🐶 Dog and 🐱 Cat filter buttons + local partner pet shop drop-off list (10% discount on donated food).'
  },
  {
    number: 2,
    id: 'volunteer-feeding-map',
    title: '2. Volunteer Feeding Map',
    description: 'A live map showing where street animals live and who is feeding them today.',
    sampleUxDetail: '📍 Red Pin = Hungry Pack (Not Fed Today — Click "I Will Feed Them") -> Upload Photo of Food Bowl -> 📍 Green Pin = Fed Today (e.g., Fed by Coach Donovan at 7:30 AM).'
  },
  {
    number: 3,
    id: 'sos-vet-medical-care',
    title: '3. SOS Vet & Medical Care',
    description: 'Report sick or injured animals and crowdfund vet bills.',
    sampleUxDetail: '3-Click Medical SOS: Big red camera button ("Take Photo of Sick Animal") + Automatic GPS Pin ("Share Location") + 3 injury icons (Broken Leg, Skin Problem, Hit by Car) + Vet Bill Progress Bar (e.g., Raised 1,200 / 2,000 THB for Lucky\'s leg surgery).'
  },
  {
    number: 4,
    id: 'adoption-matchmaker',
    title: '4. Adoption Matchmaker',
    description: 'Profiles of friendly street dogs and cats looking for a forever home.',
    sampleUxDetail: 'Profile cards (e.g., Somchai, 2 years old, Male — Gentle, quiet, loves belly rubs, Vaccinated ✅ | Sterilized ✅, Sukhumvit Soi 50) + [Button: Meet Somchai] & U-SEC Adoption Screening Questionnaire.'
  }
];

export const STREETPAWS_MTC_COMPETENCIES: StreetPawsMtcCompetency[] = [
  {
    number: 1,
    weLearnFutureSkill: 'Critical Thinking & Problem Solving',
    lSecCodeAndName: '2.1.1 Problem Identification (Clearly describe challenges and explain why they matter)',
    uSecCodeAndName: '2.1.1 Inquiry & Research Skills (Plan structured research, gather sources, form conclusions)',
    eslICanGoal: '"I can research the problems street animals face in our city and use real facts to explain why they need help."',
    portfolioArtifact: 'Street Animal Research Map & Empathy Report',
    competencyIds: ['ctps-01', 'ctps-09']
  },
  {
    number: 2,
    weLearnFutureSkill: 'Leadership & Collaboration',
    lSecCodeAndName: '3.1.1 Project Management (Create a clear plan, set goals, assign tasks by strength)',
    uSecCodeAndName: '3.1.5 Project Management (Create a clear plan, assign tasks, and monitor progress)',
    eslICanGoal: '"I can work with my team, choose a role, make a weekly plan, and finish my tasks on time."',
    portfolioArtifact: 'Team Charter & Kanban / Trello Task Board',
    competencyIds: ['lc-01', 'lc-05']
  },
  {
    number: 3,
    weLearnFutureSkill: 'Creative Thinking',
    lSecCodeAndName: '5.1.2 Creative Thinking (Brainstorm innovative ideas to solve problems)',
    uSecCodeAndName: '5.1.5 Technological Creativity (Experiment with digital tools to test ideas and drive innovation)',
    eslICanGoal: '"I can brainstorm creative app features and use digital tools (like Canva, Figma, or Glide) to build a working app prototype."',
    portfolioArtifact: 'Paper Wireframes & Interactive App Prototype',
    competencyIds: ['ct-02', 'ct-05']
  },
  {
    number: 4,
    weLearnFutureSkill: 'Entrepreneurship',
    lSecCodeAndName: '7.1.1 Impact Creation (Take meaningful action that helps others or improves the community)',
    uSecCodeAndName: '7.1.4 Sustainable Business Modeling (Design a model showing how a service delivers value and generates income/resources)',
    eslICanGoal: '"I can plan how our app will help real animals, work with local rescues, and manage food donations and money."',
    portfolioArtifact: 'App Impact Plan (L-SEC) / Business Model Canvas & Budget (U-SEC)',
    competencyIds: ['ent-01', 'ent-04']
  },
  {
    number: 5,
    weLearnFutureSkill: 'Self-Directed Learning',
    lSecCodeAndName: '1.1.2 Goal Setting (Create a step-by-step plan with deadlines and review progress)',
    uSecCodeAndName: '1.1.4 Reflection & Self-Assessment (Regularly evaluate strengths, challenges, and strategies to improve)',
    eslICanGoal: '"I can test my work, listen to feedback from users, fix mistakes, and reflect on how I improved."',
    portfolioArtifact: 'User Testing Feedback Log & Weekly Reflection Journal',
    competencyIds: ['sdl-02', 'sdl-04']
  },
  {
    number: 6,
    weLearnFutureSkill: 'Effective Communication',
    lSecCodeAndName: '4.1.2 Public Speaking (Speak clearly and confidently using voice, eye contact, and visuals)',
    uSecCodeAndName: '4.1.3 Visual Communication Design (Design slides, posters, or visuals using layout, contrast, and alignment)',
    eslICanGoal: '"I can design clear visual slides and speak confidently to pitch our app to an audience."',
    portfolioArtifact: 'Final App Pitch Deck, UI Poster & 10-Minute Live Pitch',
    competencyIds: ['ec-02', 'ec-03', 'ec-11']
  }
];

export const STREETPAWS_DAILY_ESL_ROUTINE: StreetPawsDailyRoutineBlock[] = [
  {
    timeRange: '0:00 – 0:15',
    duration: '15 mins',
    title: 'Daily Stand-Up & Word Wall',
    description: 'Learn 3 new English vocabulary words for the day. Teams stand up and answer: 1. What did I finish yesterday? 2. What will I do today? 3. Do I need help?'
  },
  {
    timeRange: '0:15 – 0:35',
    duration: '20 mins',
    title: 'Coach Mini-Lesson',
    description: 'Short visual demonstration by the coach showing today\'s example and tool.'
  },
  {
    timeRange: '0:35 – 1:40',
    duration: '65 mins',
    title: 'Studio Build Time',
    description: 'Hands-on teamwork. Coach circulates to check progress and practice spoken English.'
  },
  {
    timeRange: '1:40 – 2:00',
    duration: '20 mins',
    title: 'Show & Reflect',
    description: 'Teams upload a photo/screenshot of today\'s work to their portfolio and write 2–3 reflection sentences.'
  }
];

export const STREETPAWS_12_WEEK_CURRICULUM: StreetPawsWeekPlan[] = [
  {
    week: 1,
    curriculumPhase: 'PHASE 1: EMPATHIZE (Weeks 1–2)',
    mappedDesignPhase: 'explore',
    title: 'Week 1: Life on the Streets (Understanding the Problem)',
    drivingQuestion: '"What dangers do street dogs and cats face every day in our neighborhoods, and who is currently trying to help them?"',
    targetCompetency: 'Critical Thinking (2.1.1)',
    eslVocabulary: ['Stray', 'shelter', 'malnutrition', 'territory', 'vaccination', 'volunteer', 'compassion'],
    monTueActivity: 'Watch short videos about street dogs/cats (e.g., Soi Dog Foundation / local Bangkok rescues). Create a "Day in the Life of a Street Dog" storyboard.',
    wedThuActivity: 'Safe neighbourhood observation walk (or Google Street View mapping) to spot where street animals gather, where they find water/food, and what dangers exist (traffic, sickness, heat).',
    friCheckpoint: 'Weekly Checkpoint: Present a 1-page visual "Street Animal Hazard Map."',
    concreteExamples: [
      'Example Problem Log: "Area: Behind the local market. Animals: 6 street dogs. Problem: Dirty water, plastic in food, 1 dog has a skin infection. Helpers: One street food vendor gives leftover rice at 8 PM."'
    ],
    lSecDifferentiation: 'Draw an illustrated map of 1 neighborhood zone and list 5 main dangers with simple sentences.',
    uSecDifferentiation: 'Research city-wide stray animal statistics, compare 3 existing rescue charities, and write a 1-page Inquiry Report with cited sources.'
  },
  {
    week: 2,
    curriculumPhase: 'PHASE 1: EMPATHIZE (Weeks 1–2)',
    mappedDesignPhase: 'empathise',
    title: 'Week 2: Talking to Helpers (User Interviews & Empathy)',
    drivingQuestion: '"Why is it hard for regular people to donate food, volunteer, or adopt a street animal right now?"',
    targetCompetency: 'Critical Thinking (2.1.1) & Effective Communication (4.1.5 U-SEC Empathetic Listening)',
    eslVocabulary: ['Interview', 'survey', 'donor', 'barrier', 'trust', 'veterinarian', 'foster'],
    monTueActivity: 'Write 5 simple interview questions in English for pet owners, animal lovers, or local feeders.',
    wedThuActivity: 'Survey at least 10 people (school staff, parents, classmates) and summarize their answers using charts.',
    friCheckpoint: 'Weekly Checkpoint: Build 2 Empathy Maps (1 for a "Busy Donor" and 1 for a "Street Animal Feeder").',
    concreteExamples: [
      'Example Interview Quote: "I want to donate dog food, but I don\'t know where to drop it off. I am afraid if I give money online, it won\'t go to the animals."'
    ],
    lSecDifferentiation: 'Use a fill-in-the-blank interview script and create a bar chart of results.',
    uSecDifferentiation: 'Conduct in-depth interviews with a local vet or rescue volunteer and write a data interpretation summary identifying key user barriers.'
  },
  {
    week: 3,
    curriculumPhase: 'PHASE 2: DEFINE (Weeks 3–4)',
    mappedDesignPhase: 'define',
    title: 'Week 3: User Personas & Problem Statements',
    drivingQuestion: '"Who are the exact users of our app, and what do they need the app to do in 3 clicks or less?"',
    targetCompetency: 'Leadership & Collaboration (3.1.1 / 3.1.5 Project Management)',
    eslVocabulary: ['Persona', 'profile', 'frustration', 'goal', 'feature', 'priority', 'teamwork'],
    monTueActivity: 'Form project teams of 3–4 learners. Assign roles: UI/Visual Designer, Map & Data Lead, Operations/Finance Lead, Communications/Pitch Lead. Sign a Team Contract.',
    wedThuActivity: 'Create 3 User Personas (The Food Donor, The Volunteer Feeder, The Adopter) and write a clear Problem Statement.',
    friCheckpoint: 'Weekly Checkpoint: Present Team Charter, Trello/Kanban board, and 3 User Persona cards.',
    concreteExamples: [
      'Example Persona: "Name: Auntie Mali (Age 45). Goal: Wants to feed 10 cats near the BTS station every Tuesday. Problem: When she gets sick, nobody feeds the cats because other volunteers don\'t know her schedule."',
      'ESL Problem Statement Frame: "[User Name] needs a way to [Action] because [Reason], so our app will [Solution]."'
    ],
    lSecDifferentiation: 'Complete 3 illustrated Persona Cards using sentence frames.',
    uSecDifferentiation: 'Build a full User Journey Map showing step-by-step how a user discovers, uses, and trusts the app.'
  },
  {
    week: 4,
    curriculumPhase: 'PHASE 2: DEFINE (Weeks 3–4)',
    mappedDesignPhase: 'define',
    title: 'Week 4: Mapping the 4 App Pillars (System Design)',
    drivingQuestion: '"How will our 4 app features—Food Donation, Feeding Map, Vet Care, and Adoption—work together safely?"',
    targetCompetency: 'Creative Thinking (5.1.2) & Critical Thinking (Systems Mapping 2.2.2 U-SEC)',
    eslVocabulary: ['Flowchart', 'menu', 'navigation', 'drop-off point', 'verify', 'emergency', 'adoption form'],
    monTueActivity: 'Brainstorm how each of the 4 pillars works in real life (e.g., Where does donated food go? How do we stop fake SOS reports?).',
    wedThuActivity: 'Draw an App Flowchart (Sitemap) showing what happens when a user clicks each button on the home screen.',
    friCheckpoint: 'Weekly Checkpoint: Wall walk of Team App Flowcharts with sticky-note feedback from classmates.',
    concreteExamples: [
      'Example Flowchart Logic (Feeding Map): Open App -> Click "Feed Map" -> See Red Pin (Hungry Pack - Not Fed Today) -> Click "I Will Feed Them" -> Upload Photo of Food Bowl -> Pin Turns Green (Fed Today!).'
    ],
    lSecDifferentiation: 'Create a color-coded poster flowchart with 8–10 main screens.',
    uSecDifferentiation: 'Create a digital logic flowchart (using FigJam, Miro, or Lucidchart) that includes safety rules, user verification, and vet clinic approval steps.'
  },
  {
    week: 5,
    curriculumPhase: 'PHASE 3: IDEATE (Weeks 5–6)',
    mappedDesignPhase: 'ideate',
    title: 'Week 5: App Branding & Paper Wireframing',
    drivingQuestion: '"How can we design app screens that are super easy to understand, even for people who don\'t read much text?"',
    targetCompetency: 'Creative Thinking (5.1.2 Creative Thinking) & Effective Communication (4.1.3 Visual Design)',
    eslVocabulary: ['Wireframe', 'icon', 'button', 'layout', 'logo', 'slogan', 'color palette', 'user-friendly'],
    monTueActivity: 'Design the App Name, Logo, Color Palette, and 1-sentence Slogan (e.g., "StreetPaws: Tap to Feed, Tap to Save").',
    wedThuActivity: 'Sketch Low-Fidelity Paper Wireframes (drawings on paper phone templates) for 6 core screens: 1. Home Screen, 2. Food Donation Store, 3. Live Feeding Map, 4. Vet SOS Report, 5. Adoption Tinder/Gallery, 6. Volunteer Profile.',
    friCheckpoint: 'Weekly Checkpoint: "Paper Phone Test"—partner with another team and ask them to "tap" the paper drawings to see if the buttons make sense.',
    concreteExamples: [
      'Example Screen Layout (SOS Medical Screen): Big red camera button at the top ("Take Photo of Sick Animal") + Automatic GPS Pin ("Share Location") + 3 simple icons for injury type (Broken Leg, Skin Problem, Hit by Car) + "Send to Nearest Vet" button.'
    ],
    lSecDifferentiation: 'Sketch 6 clean paper screens focusing on clear icons, big buttons, and short English labels.',
    uSecDifferentiation: 'Design a complete UI Style Guide (typography, color contrast rules, icon set) and 8–10 detailed wireframes with annotations.'
  },
  {
    week: 6,
    curriculumPhase: 'PHASE 3: IDEATE (Weeks 5–6)',
    mappedDesignPhase: 'ideate',
    title: 'Week 6: Real-World Operations, Budget & Sustainability',
    drivingQuestion: '"How will our app pay for animal food and vet bills, and how will we partner with real shops and clinics?"',
    targetCompetency: 'Entrepreneurship (7.1.1 Impact Creation L-SEC / 7.1.4 Sustainable Business Modeling & 7.1.5 Startup Financial Planning U-SEC)',
    eslVocabulary: ['Budget', 'expense', 'income', 'sponsor', 'partnership', 'receipt', 'transparent', 'sustainable'],
    monTueActivity: 'Calculate real costs in Thai Baht (THB): How much does a 10kg/15kg bag of dog food cost? How much is a rabies vaccine or sterilization?',
    wedThuActivity: 'Build a Community Impact & Budget Plan. Decide how the app gets resources (e.g., pet shop sponsors, 10–15 THB micro-donations, school food drives).',
    friCheckpoint: 'Weekly Checkpoint: Present the App Budget Table and Community Partner List.',
    concreteExamples: [
      '15kg Dog Food Bag = 600 THB (feeds 10 dogs for 5 days = 12 THB per dog/day).',
      'Basic Vet Check + Vaccine = 500 THB.',
      'App Feature: "Buy 1 Bowl of Food for 15 THB" button so students with small pocket money can still donate!'
    ],
    lSecDifferentiation: 'Create a simple Income & Expense Table for feeding and healing 10 neighborhood animals for 1 month (7.1.3 Basic Financial Literacy).',
    uSecDifferentiation: 'Complete a full Business Model Canvas and Startup Budget Spreadsheet showing partner commissions (e.g., local pet stores giving a 10% discount on donated food) and breakeven costs (7.1.4 & 7.1.5).'
  },
  {
    week: 7,
    curriculumPhase: 'PHASE 4: PROTOTYPE (Weeks 7–9)',
    mappedDesignPhase: 'prototype',
    title: 'Week 7: Building the Digital App Prototype (Part 1: Food & Map)',
    drivingQuestion: '"How do we turn our paper drawings into a clickable digital app for donating food and mapping feeding zones?"',
    targetCompetency: 'Creative Thinking (5.1.5 Technological Creativity)',
    eslVocabulary: ['Prototype', 'interactive', 'clickable', 'hyperlink', 'pin', 'schedule', 'drop-off'],
    monTueActivity: 'Set up the digital app builder (Teams can use Canva Mobile Prototype, Figma, Glide Apps, or Thunkable). Create the Home Screen and navigation bar.',
    wedThuActivity: 'Build Feature 1 (Food Donation) and Feature 2 (Volunteer Feeding Map) with clickable buttons and sample neighbourhood pins.',
    friCheckpoint: 'Weekly Checkpoint: Live demo of the first 2 clickable features on a phone or tablet.',
    concreteExamples: [
      'Example Volunteer Map Screen: Shows a map around the school with pins:',
      '📍 Pin A (Soi 4 Park): 4 Cats — Status: Needs Food Today (Click to Sign Up).',
      '📍 Pin B (Temple Gate): 3 Dogs — Status: Fed by Coach Donovan at 7:30 AM.'
    ],
    lSecDifferentiation: 'Build clickable mobile screens in Canva or Google Slides using button links between pages.',
    uSecDifferentiation: 'Build a functional no-code app in Glide (connected to a Google Sheet database) or an interactive Figma prototype with working form inputs.'
  },
  {
    week: 8,
    curriculumPhase: 'PHASE 4: PROTOTYPE (Weeks 7–9)',
    mappedDesignPhase: 'prototype',
    title: 'Week 8: Building the Digital App Prototype (Part 2: Medical SOS & Adoption)',
    drivingQuestion: '"How can our app help a sick animal get to a vet fast and help healthy animals find loving homes?"',
    targetCompetency: 'Creative Thinking (5.1.5 Technological Creativity) & Effective Communication (4.1.4 L-SEC Storytelling / 4.1.2 U-SEC Storytelling for Impact)',
    eslVocabulary: ['Adopt', 'personality', 'vaccinated', 'sterilized', 'urgent', 'fundraising', 'progress bar'],
    monTueActivity: 'Build Feature 3 (Medical SOS & Vet Crowdfunding)—create a report screen and a "Vet Bill Progress Bar" (e.g., Raised 1,200 / 2,000 THB for Lucky\'s leg surgery).',
    wedThuActivity: 'Build Feature 4 (Adoption Matchmaker)—write warm, engaging English stories for 4 real or realistic street animals looking for homes.',
    friCheckpoint: 'Weekly Checkpoint: All 4 app sections connected and clickable from start to finish.',
    concreteExamples: [
      'Example Adoption Profile (ESL Writing Frame): Name: Somchai (2 years old, Male) | Personality: Gentle, quiet, loves belly rubs, good with children | Health: Vaccinated ✅ | Sterilized ✅ | Story: "Somchai lived outside 7-Eleven on Sukhumvit Soi 50. He healed from a hurt paw and is ready for a safe home!" [Button: Meet Somchai]'
    ],
    lSecDifferentiation: 'Create 3 animal adoption profiles using descriptive adjectives and build the SOS report screen.',
    uSecDifferentiation: 'Include an Adoption Screening Questionnaire inside the app (to check if the adopter has a safe home) and a transparent Vet Receipt tracker.'
  },
  {
    week: 9,
    curriculumPhase: 'PHASE 4: PROTOTYPE (Weeks 7–9)',
    mappedDesignPhase: 'prototype',
    title: 'Week 9: Physical Touchpoint — The Smart Community Feeding & QR Station',
    drivingQuestion: '"How do people on the street discover our app and donate food safely in the real world?"',
    targetCompetency: 'Creative Thinking (5.1.3 Engineering Design)',
    eslVocabulary: ['Station', 'weather-proof', 'dispenser', 'QR code', 'hygiene', 'container', 'prototype'],
    monTueActivity: 'Design a physical Community Food Drop-Off Box or Weather-Proof Feeding Station that connects to the app via a QR Code.',
    wedThuActivity: 'Build a physical scale model or full-size prototype (using cardboard, PVC pipes, plastic bins, or 3D-printed parts) with a printed QR code sticker that opens the team\'s digital app prototype!',
    friCheckpoint: 'Weekly Checkpoint: Test scanning the QR code on the physical feeding station to open the app on a phone.',
    concreteExamples: [
      'Example Physical Prototype: A rain-proof PVC pipe feeder or a "Community Pet Food Donation Bin" placed at school/condo lobbies. A sign on the box says: "Scan QR Code to log food level or report an empty bowl on the StreetPaws App!"'
    ],
    lSecDifferentiation: 'Build a clean physical mockup of a donation box or shelter feeder with clear English signage and a working QR code link.',
    uSecDifferentiation: 'Incorporate 3D-printed/CAD parts or a simple circuit/sensor concept (e.g., an LED light or weight indicator showing when the food box is empty) (5.1.3 Engineering Design).'
  },
  {
    week: 10,
    curriculumPhase: 'PHASE 5: TEST & PITCH (Weeks 10–12)',
    mappedDesignPhase: 'test',
    title: 'Week 10: User Testing, Bug Fixing & Iteration',
    drivingQuestion: '"What confuses new users when they try our app, and how can we make it better?"',
    targetCompetency: 'Self-Directed Learning (1.1.2 Goal Setting L-SEC / 1.1.4 Reflection & Self-Assessment U-SEC)',
    eslVocabulary: ['Test', 'feedback', 'bug', 'confusing', 'improve', 'revise', 'version'],
    monTueActivity: 'Usability Testing Session: Invite 5 students or teachers from outside the class to try the app without help. Observe where they get stuck.',
    wedThuActivity: 'Record feedback in a Test & Fix Log and update the app screens (Version 2.0).',
    friCheckpoint: 'Weekly Checkpoint: Present "Before & After" screenshots showing at least 3 improvements based on user feedback.',
    concreteExamples: [
      'Example Iteration: "Before: Users didn\'t know if the food donation was for dogs or cats. Feedback: Add animal icons. After: Added a big 🐶 Dog and 🐱 Cat filter button at the top of the donation page."'
    ],
    lSecDifferentiation: 'Collect 5 feedback forms and fix 3 visual or text problems in the app.',
    uSecDifferentiation: 'Conduct structured usability tasks (measuring how many seconds it takes a user to report a sick animal), analyze the data, and write a self-assessment reflection on their design iterations.'
  },
  {
    week: 11,
    curriculumPhase: 'PHASE 5: TEST & PITCH (Weeks 10–12)',
    mappedDesignPhase: 'test',
    title: 'Week 11: Pitch Deck, Poster & Rehearsal',
    drivingQuestion: '"How can we tell a powerful story that convinces people to use and support our app?"',
    targetCompetency: 'Effective Communication (4.1.2 Public Speaking L-SEC / 4.1.3 Visual Communication Design U-SEC)',
    eslVocabulary: ['Pitch', 'audience', 'hook', 'demonstration', 'impact', 'confident', 'body language'],
    monTueActivity: 'Create the 8-Slide Pitch Deck and an Exhibition Poster showing the app screens, QR code, and physical feeding station.',
    wedThuActivity: 'Write cue cards using the Fill-in-the-Blank ESL Pitch Script. Practice pronunciation, eye contact, and passing the microphone smoothly between teammates.',
    friCheckpoint: 'Weekly Checkpoint: Dress rehearsal in front of peers using the Peer Feedback Rubric.',
    concreteExamples: [
      '8-Slide Pitch Deck + 4-Speaker ESL Pitch Script rehearsal with live tablet demo and physical QR station.'
    ],
    lSecDifferentiation: 'Deliver a clear, well-rehearsed team presentation using visual slides and cue cards (4.1.2).',
    uSecDifferentiation: 'Incorporate data visualizations, financial sustainability slides, and prepare for unscripted Q&A from judges (4.2.2 Persuasion & Influence / 4.2.3 Advanced Public Speaking).'
  },
  {
    week: 12,
    curriculumPhase: 'PHASE 5: TEST & PITCH (Weeks 10–12)',
    mappedDesignPhase: 'share',
    title: 'Week 12: The Grand "StreetPaws" App Launch & Showcase',
    drivingQuestion: '"How can our presentation inspire our school and community to take real action for street animals today?"',
    targetCompetency: 'All 6 Selected MTC Competencies (Portfolio Defense)',
    eslVocabulary: ['Showcase', 'portfolio', 'celebration', 'donation drive', 'community impact'],
    monTueActivity: 'Final booth setup, printing QR codes for guests to scan on their own phones, setting up the physical feeding/donation station models.',
    wedThuActivity: 'Wed: Live Showcase & Pitch Day! Teams deliver their 10-minute pitch and live app demo to coaches, parents, and community guests.',
    friCheckpoint: 'Thu–Fri: MTC Portfolio Curation & Celebration: Students upload their final artifacts to their WeLearn MTC Portfolio, complete their final self-reflection, and organize a real mini pet-food donation drive for a local shelter!',
    concreteExamples: [
      'Live QR Code scan by showcase guests + real mini pet-food donation drive for a local shelter.'
    ],
    lSecDifferentiation: 'Present interactive appscreens, physical QR feeder box, and complete all 6 MTC portfolio artifacts.',
    uSecDifferentiation: 'Defend the Business Model Canvas, THB unit economics, and usability iteration metrics during live judge Q&A.'
  }
];

export const STREETPAWS_PITCH_SLIDES: StreetPawsPitchSlide[] = [
  {
    slideNumber: 1,
    title: 'Slide 1: Title & Hook',
    description: 'App Name, Logo, Team Members, and a real story of one local street animal.'
  },
  {
    slideNumber: 2,
    title: 'Slide 2: The Problem',
    description: 'Photos/map of street animals in our area + survey data from Week 2.'
  },
  {
    slideNumber: 3,
    title: 'Slide 3: Meet Our Users',
    description: 'The personas who want to help but need an easy tool.'
  },
  {
    slideNumber: 4,
    title: 'Slide 4: Introducing Our App',
    description: 'Overview of the 4 core features.'
  },
  {
    slideNumber: 5,
    title: 'Slide 5: Live App Demo!',
    description: 'Student shares screen or holds up tablet while a teammate clicks through Food Donation, Feeding Map, Vet SOS, and Adoption.'
  },
  {
    slideNumber: 6,
    title: 'Slide 6: Real-World QR Station & Budget',
    description: 'Show the physical feeding box/QR station and how a 15 THB donation works.'
  },
  {
    slideNumber: 7,
    title: 'Slide 7: User Testing & What We Improved',
    description: '"Before & After" screen showing how the team listened to feedback.'
  },
  {
    slideNumber: 8,
    title: 'Slide 8: Our Impact & Call to Action',
    description: 'QR code on screen for the audience to scan and try the app right now.'
  }
];

export const STREETPAWS_ESL_PITCH_SCRIPT: StreetPawsEslPitchSpeaker[] = [
  {
    speakerNumber: 1,
    title: 'Speaker 1: The Hook & The Problem',
    duration: '2 Minutes',
    scriptTemplate: [
      '"Good morning/afternoon everyone! We are Team [Team Name], and today we are proud to introduce [App Name].',
      'Every day on our way to school in [Neighborhood Name], we see street dogs and cats like [Name of Example Dog/Cat]. They face three big problems: [Problem 1, e.g., hunger], [Problem 2, e.g., sickness or traffic], and [Problem 3, e.g., no safe home].',
      'In Week 2, we interviewed [Number] people in our community. [Number]% said they want to help street animals, but they don\'t know where to donate food, who is already feeding the animals, or how to pay for a vet. That is why we built [App Name]."'
    ]
  },
  {
    speakerNumber: 2,
    title: 'Speaker 2: Live App Demo — Food Donation & Volunteer Feeding Map',
    duration: '2.5 Minutes',
    scriptTemplate: [
      '"Let me show you how [App Name] works! When you open our home screen, you see four simple buttons.',
      'First is our Food Donation Hub. If you don\'t have time to volunteer, you can tap here to donate just [Amount, e.g., 15 Baht] for one bowl of food, or drop off a bag of food at our partner shop, [Partner Name].',
      'Second is our Live Volunteer Feeding Map. Look at the pins on our map. A Red Pin means the animals at [Location] are hungry today. When a volunteer feeds them and takes a photo, the pin turns Green! This stops food waste and makes sure no animal is forgotten."'
    ]
  },
  {
    speakerNumber: 3,
    title: 'Speaker 3: Live App Demo — Medical SOS & Adoption Matchmaker',
    duration: '2.5 Minutes',
    scriptTemplate: [
      '"What happens if you see a hurt or sick animal? You tap our third feature: Medical SOS.',
      'In just three clicks, you take a photo, share your GPS location, and choose the problem. Our app sends an alert to [Local Rescue / Vet Clinic] and opens a transparent Vet Bill tracker so the community can help pay for the medicine together.',
      'Once an animal is healthy, they move to our fourth feature: Adoption Matchmaker. Here you can meet friendly animals like [Animal Name], read their story, check their vaccine status, and apply to give them a forever home."'
    ]
  },
  {
    speakerNumber: 4,
    title: 'Speaker 4: Physical QR Station, Testing & Call to Action',
    duration: '3 Minutes',
    scriptTemplate: [
      '"To connect our app to the real streets, we also built this Community QR Feeding Station (point to physical prototype). Anyone walking by can scan this QR code to check the animals or donate food in 10 seconds.',
      'In Week 10, we tested our app with [Number] users. They told us [share 1 piece of feedback], so we improved our design by [explain improvement].',
      'Please take out your phones right now and scan the QR code on the screen to try [App Name] for yourselves! Together, we can feed, heal, and adopt our street animals. Thank you! We are ready for your questions."'
    ]
  }
];

export const STREETPAWS_ASSESSMENT_RUBRIC: StreetPawsRubricRow[] = [
  {
    number: 1,
    competency: '1. Problem ID & Research',
    codes: '2.1.1',
    emerging: 'Recognizes that street animals need help, but struggles to explain specific problems or find facts.',
    developing: 'Identifies basic street animal problems and gathers a few facts from interviews or observation.',
    proficientTargetCredit: 'Clearly defines local street animal challenges using organized survey data, maps, and reliable sources.',
    mastery: 'Deeply analyzes root causes of stray animal issues and connects stakeholder needs directly to app features.'
  },
  {
    number: 2,
    competency: '2. Project Management',
    codes: '3.1.1 / 3.1.5',
    emerging: 'Works in the group, but needs frequent reminders from the coach to know what task to do next.',
    developing: 'Creates a basic team plan and completes assigned tasks with some reminders.',
    proficientTargetCredit: 'Creates a clear project timeline, assigns roles by team strengths, tracks tasks on the board, and meets weekly checkpoints.',
    mastery: 'Proactively leads team workflow, supports teammates who fall behind, and adapts the plan smoothly when challenges arise.'
  },
  {
    number: 3,
    competency: '3. Creative & Tech Design',
    codes: '5.1.2 / 5.1.5',
    emerging: 'Copies existing ideas or builds incomplete screens that are hard to navigate.',
    developing: 'Sketches creative app ideas and builds basic digital screens with coach guidance.',
    proficientTargetCredit: 'Brainstorms original features and uses digital tools + physical QR prototypes to build a working, user-friendly solution.',
    mastery: 'Combines creative UX design, interactive logic, and physical prototyping into a seamless, ready-to-launch product.'
  },
  {
    number: 4,
    competency: '4. Impact & Sustainability',
    codes: '7.1.1 / 7.1.4',
    emerging: 'Describes how the app helps animals generally, without a clear budget or real-world plan.',
    developing: 'Outlines a basic donation plan and simple food budget, but misses some real-world details.',
    proficientTargetCredit: 'Designs a realistic community impact model and budget showing exactly how food, volunteers, and vet funds are managed.',
    mastery: 'Creates a scalable, sustainable model with real local shelter/shop partnerships and transparent financial tracking.'
  },
  {
    number: 5,
    competency: '5. Goal Setting & Reflection',
    codes: '1.1.2 / 1.1.4',
    emerging: 'Completes some tasks, but struggles to reflect on mistakes or use feedback to improve the app.',
    developing: 'Collects user feedback and makes small changes when guided by the coach.',
    proficientTargetCredit: 'Sets clear weekly goals, tests the app with users, reflects honestly on weaknesses, and improves the prototype.',
    mastery: 'Continuously evaluates personal learning and user data to drive major iterative improvements across the whole project.'
  },
  {
    number: 6,
    competency: '6. Visuals & Public Speaking',
    codes: '4.1.2 / 4.1.3',
    emerging: 'Reads directly from notes with low volume; slides are crowded or unclear.',
    developing: 'Speaks with some clarity using basic slides, though some sections need more practice.',
    proficientTargetCredit: 'Designs clean, engaging visual slides and delivers a confident, clear pitch using good eye contact and body language.',
    mastery: 'Delivers a persuasive, emotional, and professional pitch tailored to the audience, handling Q&A with strong evidence.'
  }
];

export const STREETPAWS_GAMIFICATION_BADGES: StreetPawsBadge[] = [
  {
    id: 'streetpaws-hazard-scout',
    title: 'Street Animal Hazard Scout',
    phase: 'explore',
    criteria: 'Complete the "Day in the Life of a Street Dog" storyboard and 1-page Street Animal Hazard Map in Week 1.',
    xp: 150
  },
  {
    id: 'streetpaws-empathy-listener',
    title: 'Empathetic Helper Interviewer',
    phase: 'empathise',
    criteria: 'Survey at least 10 community members and build 2 Empathy Maps (Busy Donor & Street Animal Feeder) in Week 2.',
    xp: 175
  },
  {
    id: 'streetpaws-three-click-architect',
    title: '3-Click System Architect',
    phase: 'define',
    criteria: 'Create 3 User Personas (including Auntie Mali) and map all 4 App Pillars so any core action completes in 3 clicks or less.',
    xp: 200
  },
  {
    id: 'streetpaws-thb-impact-planner',
    title: '15-Baht Bowl Impact Economist',
    phase: 'ideate',
    criteria: 'Pass the Paper Phone Test on 6 wireframes and build a sustainable THB budget (600 THB/15kg bag = 12 THB/dog/day + 15 THB micro-donation button).',
    xp: 250
  },
  {
    id: 'streetpaws-qr-station-maker',
    title: 'Smart QR Feeding Station Maker',
    phase: 'prototype',
    criteria: 'Connect all 4 clickable app features (Food Hub, Red/Green Pin Map, Vet SOS, Somchai Adoption Profile) to a weather-proof physical QR Feeding Station.',
    xp: 300
  },
  {
    id: 'streetpaws-v2-bug-hunter',
    title: 'Version 2.0 Usability Iterater',
    phase: 'test',
    criteria: 'Test the prototype with 5 outside users, log a Test & Fix table, and present 3 "Before & After" screenshots (e.g., 🐶 Dog & 🐱 Cat filters).',
    xp: 275
  },
  {
    id: 'streetpaws-rescue-champion',
    title: 'StreetPaws Grand Showcase Champion',
    phase: 'share',
    criteria: 'Deliver the 8-Slide / 4-Speaker 10-Minute Live Pitch, defend all 6 MTC Portfolio Artifacts, and run the mini pet-food donation drive.',
    xp: 350
  }
];

export const STREETPAWS_PROGRAM: PblProgram = {
  id: 'streetpaws-animal-rescue-2026',
  title: 'StreetPaws — The Community Animal Rescue App',
  version: '2026.1-Provisional',
  status: 'provisional_prototype',
  durationWeeks: 12,
  totalSessions: 24,
  theme: 'Mobile UX/UI Design, Community Animal Welfare, Social Entrepreneurship & Physical QR Touchpoints',
  ages: 'Ages 11–17 (L-SEC Lower Secondary & U-SEC Upper Secondary Differentiation)',
  hardwareSummary:
    'Canva Mobile Prototype / Figma / Glide Apps / Thunkable, Paper Phone Wireframe Templates, and Rain-Proof PVC / Cardboard / 3D-Printed Community QR Feeding Station',
  masterDrivingQuestion:
    'How can we design an easy-to-use mobile app that connects our community to feed, heal, and adopt street animals safely?',
  assumptions: [
    {
      id: 'asmp-streetpaws-schedule',
      category: 'Schedule',
      statement:
        '12-week term running 2 hours per weekday (Monday–Friday = 10 hours/week, 120 hours total) following the 4-part Daily 2-Hour ESL Class Routine (15m Daily Stand-Up & Word Wall, 20m Coach Mini-Lesson, 65m Studio Build Time, 20m Show & Reflect).',
      ownerVerificationNeeded:
        'Confirm neighbourhood observation walk boundaries (or Google Street View alternative) and local rescue / shelter partner contacts for Week 1 and Week 12.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-streetpaws-safeguarding',
      category: 'Safeguarding & Ethics',
      statement:
        'Learners never touch or approach unfamiliar street animals during Week 1 neighbourhood observation walks (safe distance or Google Street View only). Under-13 learners use written notes, screenshots, and tap-to-choose reflection cards (never under-13 voice/video recording or speech-to-text).',
      ownerVerificationNeeded:
        'Confirm school field-walk supervision protocol and local shelter drop-off coordination for the Week 12 mini pet-food donation drive.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: '1. Explore — Week 1: Life on the Streets (Understanding the Problem)',
      weeks: [1, 1],
      summary:
        'PHASE 1: EMPATHIZE (Week 1). Investigate the daily dangers street dogs and cats face in our neighborhoods (malnutrition, traffic, sickness, heat) and map who is currently trying to help them.',
      deliverables: [
        '"Day in the Life of a Street Dog" Storyboard (Mon–Tue)',
        'Neighbourhood Observation Walk / Google Street View Problem Log (Wed–Thu)',
        '1-Page Visual "Street Animal Hazard Map" (L-SEC) or 1-Page City Stray Statistics & Rescue Charity Inquiry Report (U-SEC) (Fri)'
      ],
      competencies: ['ctps-01', 'ctps-09'],
      stretchCompetencies: ['ctps-02'],
      tasks: [
        'Learn Week 1 ESL Vocabulary (Stray, shelter, malnutrition, territory, vaccination, volunteer, compassion) during Daily Stand-Up.',
        'Watch short videos about street dogs/cats (Soi Dog Foundation / local Bangkok rescues) and sketch a "Day in the Life of a Street Dog" storyboard.',
        'Conduct a safe neighbourhood observation walk (or Google Street View mapping) to log where street animals gather, find water/food, and face dangers.',
        'Present a 1-page visual "Street Animal Hazard Map" (L-SEC) or 1-page cited Inquiry Report comparing 3 rescue charities (U-SEC).'
      ],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Week 1 (Mon–Tue): Rescue Stories & "Day in the Life of a Street Dog" Storyboard',
          durationMinutes: 240,
          learningObjective:
            'Understand the daily challenges faced by street dogs and cats and illustrate their lived experience using key ESL vocabulary.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Learn Stray, shelter, malnutrition, territory, vaccination, volunteer, compassion.',
            '0:15–0:35 Coach Mini-Lesson: Watch short rescue videos (e.g., Soi Dog Foundation / local Bangkok rescues) and identify root causes of street animal suffering.',
            '0:35–1:40 Studio Build Time: Create a 6-panel "Day in the Life of a Street Dog" storyboard showing where animals sleep, search for food/water, and encounter hazards.',
            '1:40–2:00 Show & Reflect: Upload storyboard photo to portfolio and write 2–3 reflection sentences.'
          ],
          deliverable: '"Day in the Life of a Street Dog" Storyboard',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your "Day in the Life of a Street Dog" storyboard with 2–3 sentences describing the main dangers street animals face.',
            targetCompetencies: ['ctps-01', 'ctps-09']
          }
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Week 1 (Wed–Fri): Safe Neighbourhood Mapping & Street Animal Hazard Map Checkpoint',
          durationMinutes: 360,
          learningObjective:
            'Collect real-world observation data on neighbourhood street animal zones, hazards, and existing informal helpers.',
          activities: [
            'Wed–Thu: Conduct a safe neighbourhood observation walk (from a safe distance) or Google Street View audit to log animal gathering points, water/food sources, and hazards (traffic, sickness, heat).',
            'Record a structured Problem Log (e.g., "Area: Behind the local market. Animals: 6 street dogs. Problem: Dirty water, plastic in food, 1 dog has a skin infection. Helpers: One street food vendor gives leftover rice at 8 PM.").',
            'L-SEC Track: Draw an illustrated map of 1 neighborhood zone and list 5 main dangers with simple sentences.',
            'U-SEC Track: Research city-wide stray animal statistics, compare 3 existing rescue charities, and write a 1-page Inquiry Report with cited sources.',
            'Fri Weekly Checkpoint: Present the 1-page visual "Street Animal Hazard Map" to the class.'
          ],
          deliverable: '1-Page Visual Street Animal Hazard Map & Problem Log',
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your Street Animal Hazard Map and neighbourhood Problem Log (or U-SEC 1-page Inquiry Report).',
            targetCompetencies: ['ctps-01', 'ctps-09']
          }
        }
      ]
    },
    {
      id: 'empathise',
      title: '2. Empathise — Week 2: Talking to Helpers (User Interviews & Empathy)',
      weeks: [2, 2],
      summary:
        'PHASE 1: EMPATHIZE (Week 2). Interview pet owners, animal lovers, local feeders, and rescue volunteers to discover why it is hard for regular people to donate food, volunteer, or adopt right now.',
      deliverables: [
        '5-Question ESL Helper Interview Script (Mon–Tue)',
        'Community Survey Data Charts from >= 10 Respondents (Wed–Thu)',
        '2 Empathy Maps: "Busy Donor" & "Street Animal Feeder" (Fri)'
      ],
      competencies: ['ctps-01', 'ec-05'],
      stretchCompetencies: ['ctps-03'],
      tasks: [
        'Master Week 2 ESL Vocabulary: Interview, survey, donor, barrier, trust, veterinarian, foster.',
        'Write 5 simple interview questions in English for pet owners, animal lovers, or local feeders.',
        'Survey at least 10 people (school staff, parents, classmates) and summarize their answers using bar/pie charts.',
        'Build 2 Empathy Maps (1 for a "Busy Donor" and 1 for a "Street Animal Feeder") for the Friday Weekly Checkpoint.'
      ],
      sessions: [
        {
          sessionNumber: 3,
          week: 2,
          title: 'Week 2 (Mon–Tue): Designing the 5-Question Helper Interview & Survey',
          durationMinutes: 240,
          learningObjective:
            'Formulate empathetic, bias-free interview questions to uncover trust and logistical barriers to helping street animals.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Practice Interview, survey, donor, barrier, trust, veterinarian, foster.',
            '0:15–0:35 Coach Mini-Lesson: How to ask open questions and listen empathetically.',
            '0:35–1:40 Studio Build Time: Write 5 simple interview questions in English (L-SEC fill-in-the-blank interview script; U-SEC in-depth vet/rescue volunteer interview protocol).',
            '1:40–2:00 Show & Reflect: Practice interviewing a classmate and log your 5 questions.'
          ],
          deliverable: '5-Question Helper Interview Script',
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Save your 5 interview questions for pet owners, donors, and local street animal feeders.',
            targetCompetencies: ['ctps-01', 'ec-05']
          }
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Week 2 (Wed–Fri): Surveying 10+ Community Members & Building 2 Empathy Maps',
          durationMinutes: 360,
          learningObjective:
            'Synthesize survey responses from at least 10 people into visual charts and 2 stakeholder Empathy Maps.',
          activities: [
            'Wed–Thu: Survey at least 10 people (school staff, parents, classmates) and capture direct quotes (e.g., "I want to donate dog food, but I don\'t know where to drop it off. I am afraid if I give money online, it won\'t go to the animals.").',
            'Summarize survey answers using bar charts (L-SEC) or a data interpretation summary identifying key user barriers (U-SEC).',
            'Fri Weekly Checkpoint: Build and present 2 Empathy Maps — 1 for a "Busy Donor" and 1 for a "Street Animal Feeder".'
          ],
          deliverable: '10-Person Survey Charts & 2 Empathy Maps (Busy Donor & Street Animal Feeder)',
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload your 10+ survey chart summary, key interview quote, and 2 Empathy Maps.',
            targetCompetencies: ['ctps-01', 'ec-05', 'ctps-03']
          }
        }
      ]
    },
    {
      id: 'define',
      title: '3. Define — Weeks 3–4: User Personas, Problem Statements & 4 App Pillars',
      weeks: [3, 4],
      summary:
        'PHASE 2: DEFINE (Weeks 3–4). Form 3–4 student teams, assign the 4 StreetPaws roles, create 3 User Personas and ESL Problem Statements, and map the 4 App Pillars into a complete App Flowchart (Sitemap) following the 3-Click Rule.',
      deliverables: [
        'Signed Team Charter & Kanban / Trello Task Board with 4 Assigned Roles (Week 3)',
        '3 User Persona Cards (The Food Donor, The Volunteer Feeder e.g. Auntie Mali, The Adopter) & ESL Problem Statement (Week 3)',
        '4-Pillar App Flowchart / Sitemap with Red-to-Green Pin Logic & Safety Verification Rules (Week 4)'
      ],
      competencies: ['lc-01', 'lc-05', 'ct-02', 'ctps-06'],
      stretchCompetencies: ['ct-04'],
      tasks: [
        'Form teams of 3–4 learners, assign roles (UI/Visual Designer, Map & Data Lead, Operations/Finance Lead, Communications/Pitch Lead), and sign the Team Contract.',
        'Create 3 User Personas (The Food Donor, The Volunteer Feeder like Auntie Mali Age 45, The Adopter) and write a Problem Statement using: "[User Name] needs a way to [Action] because [Reason], so our app will [Solution]."',
        'Brainstorm how the 4 App Pillars (Food Donation, Feeding Map, Vet Care, Adoption) work safely in real life and stop fake SOS reports.',
        'Draw the App Flowchart (Sitemap) showing how any core user goal completes in 3 clicks or less and run the Friday Wall Walk critique.'
      ],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Week 3 (Mon–Tue): Team Roles, Team Contract & Kanban / Trello Board Setup',
          durationMinutes: 240,
          learningObjective:
            'Organize a 3–4 member app studio team with clear role accountability and a visible weekly Kanban task board.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Persona, profile, frustration, goal, feature, priority, teamwork.',
            'Assign the 4 team roles: 1. UI/Visual Designer, 2. Map & Data Lead, 3. Operations/Finance Lead, 4. Communications/Pitch Lead.',
            'Sign the Team Charter / Contract and set up the team Trello or classroom Kanban board.'
          ],
          deliverable: 'Signed Team Charter & Kanban / Trello Task Board',
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Record your team members, assigned 4 roles, and Kanban board setup.',
            targetCompetencies: ['lc-01', 'lc-05']
          }
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Week 3 (Wed–Fri): 3 User Personas (Auntie Mali) & ESL Problem Statement Checkpoint',
          durationMinutes: 360,
          learningObjective:
            'Define 3 concrete target user personas and synthesize an actionable problem statement requiring 3 clicks or less.',
          activities: [
            'Wed–Thu: Create 3 User Personas: (1) The Food Donor, (2) The Volunteer Feeder (e.g., Auntie Mali, Age 45, who feeds 10 cats near the BTS station every Tuesday), and (3) The Adopter.',
            'Write the ESL Problem Statement Frame: "[User Name] needs a way to [Action] because [Reason], so our app will [Solution]."',
            'L-SEC Track: Complete 3 illustrated Persona Cards using sentence frames.',
            'U-SEC Track: Build a full User Journey Map showing step-by-step how a user discovers, uses, and trusts the app.',
            'Fri Weekly Checkpoint: Present Team Charter, Kanban board, and 3 User Persona cards.'
          ],
          deliverable: '3 User Persona Cards & ESL Problem Statement',
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit your 3 User Personas and completed "[User Name] needs a way to..." Problem Statement.',
            targetCompetencies: ['lc-01', 'lc-05', 'ctps-09']
          }
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Week 4 (Mon–Tue): Real-World Rules for the 4 App Pillars & Safety Verification',
          durationMinutes: 240,
          learningObjective:
            'Design the real-world operational rules connecting Food Donation, Volunteer Feeding Map, SOS Vet Care, and Adoption safely.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Flowchart, menu, navigation, drop-off point, verify, emergency, adoption form.',
            'Brainstorm how each of the 4 pillars works in real life: Where does donated food go? How do we verify volunteers? How do we stop fake SOS reports?'
          ],
          deliverable: '4 App Pillars Operational & Safety Rules',
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Document how your team verifies real feeding/SOS reports and manages donated food safely.',
            targetCompetencies: ['ct-02', 'ctps-06']
          }
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Week 4 (Wed–Fri): App Flowchart (Sitemap) & Sticky-Note Wall Walk Checkpoint',
          durationMinutes: 360,
          learningObjective:
            'Map the complete screen-to-screen navigation logic (including Red-to-Green Feeding Map pins) and refine via peer critique.',
          activities: [
            'Wed–Thu: Draw the App Flowchart (Sitemap) showing what happens when a user clicks each button on the Home Screen (e.g., Open App -> Click "Feed Map" -> See Red Pin -> Click "I Will Feed Them" -> Upload Photo of Food Bowl -> Pin Turns Green!).',
            'L-SEC Track: Create a color-coded poster flowchart with 8–10 main screens.',
            'U-SEC Track: Create a digital logic flowchart (FigJam, Miro, or Lucidchart) including safety rules, user verification, and vet clinic approval steps.',
            'Fri Weekly Checkpoint: Wall walk of Team App Flowcharts with sticky-note feedback from classmates.'
          ],
          deliverable: 'Color-Coded Poster or Digital Logic App Flowchart (Sitemap)',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your App Flowchart (Sitemap) and summarize the sticky-note feedback from the Wall Walk.',
            targetCompetencies: ['ct-02', 'ctps-06']
          }
        }
      ]
    },
    {
      id: 'ideate',
      title: '4. Ideate — Weeks 5–6: App Branding, 6 Paper Wireframes & THB Sustainability Budget',
      weeks: [5, 6],
      summary:
        'PHASE 3: IDEATE (Weeks 5–6). Design the StreetPaws brand identity, sketch 6 low-fidelity paper phone wireframes for the "Paper Phone Test", and build a transparent Thai Baht (THB) Community Impact & Budget Plan.',
      deliverables: [
        'App Name, Logo, Color Palette & 1-Sentence Slogan ("StreetPaws: Tap to Feed, Tap to Save") (Week 5)',
        '6 Low-Fidelity Paper Wireframes + Partner "Paper Phone Test" Notes (Week 5)',
        'Thai Baht (THB) App Budget Table, "15 THB Bowl" Micro-Donation Model & Community Partner List / Business Model Canvas (Week 6)'
      ],
      competencies: ['ct-02', 'ec-03', 'ent-01', 'ent-04'],
      stretchCompetencies: ['ent-03', 'ent-05'],
      tasks: [
        'Design the App Name, Logo, Color Palette, and 1-sentence Slogan ("StreetPaws: Tap to Feed, Tap to Save").',
        'Sketch 6 Low-Fidelity Paper Wireframes (1. Home Screen, 2. Food Donation Store, 3. Live Feeding Map, 4. Vet SOS Report, 5. Adoption Tinder/Gallery, 6. Volunteer Profile) and run the "Paper Phone Test".',
        'Calculate real costs in Thai Baht (15kg Dog Food Bag = 600 THB = 12 THB/dog/day; Basic Vet Check + Vaccine = 500 THB; "Buy 1 Bowl of Food for 15 THB").',
        'Present the App Budget Table and Community Partner List (L-SEC Income & Expense Table; U-SEC Business Model Canvas & Startup Budget Spreadsheet with 10% pet store partner discount).'
      ],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Week 5 (Mon–Tue): App Branding, Logo, Color Palette & 1-Sentence Slogan',
          durationMinutes: 240,
          learningObjective:
            'Create an accessible, trustworthy visual brand identity and slogan for the community animal rescue app.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Wireframe, icon, button, layout, logo, slogan, color palette, user-friendly.',
            'Design the App Name, Logo, Color Palette, and 1-sentence Slogan (e.g., "StreetPaws: Tap to Feed, Tap to Save").',
            'U-SEC Extension: Define a complete UI Style Guide (typography, color contrast rules, and accessible icon set).'
          ],
          deliverable: 'App Brand Identity & UI Style Guide',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your App Name, Logo, Color Palette, and 1-sentence Slogan.',
            targetCompetencies: ['ct-02', 'ec-03']
          }
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Week 5 (Wed–Fri): Sketching 6 Core Paper Wireframes & "Paper Phone Test" Checkpoint',
          durationMinutes: 360,
          learningObjective:
            'Sketch icon-driven paper phone wireframes for all 6 core screens and validate button clarity with a partner team.',
          activities: [
            'Wed–Thu: Sketch Low-Fidelity Paper Wireframes on paper phone templates for 6 core screens: 1. Home Screen, 2. Food Donation Store, 3. Live Feeding Map, 4. Vet SOS Report (Big red camera button + Auto GPS Pin + Broken Leg / Skin Problem / Hit by Car icons + "Send to Nearest Vet"), 5. Adoption Tinder/Gallery, 6. Volunteer Profile.',
            'Fri Weekly Checkpoint: Run the "Paper Phone Test"—partner with another team and ask them to "tap" the paper drawings to see if every button makes sense without explanation.'
          ],
          deliverable: '6 Low-Fidelity Paper Wireframes & Paper Phone Test Log',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your 6 paper wireframes and note what buttons your partner team tapped during the Paper Phone Test.',
            targetCompetencies: ['ct-02', 'ec-03']
          }
        },
        {
          sessionNumber: 11,
          week: 6,
          title: 'Week 6 (Mon–Tue): Real-World Thai Baht (THB) Food & Vet Cost Calculations',
          durationMinutes: 240,
          learningObjective:
            'Calculate accurate daily and monthly feeding and veterinary costs in Thai Baht (THB) for neighbourhood street animals.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Budget, expense, income, sponsor, partnership, receipt, transparent, sustainable.',
            'Calculate real costs in Thai Baht (THB): 15kg Dog Food Bag = 600 THB (feeds 10 dogs for 5 days = 12 THB per dog/day); Basic Vet Check + Vaccine = 500 THB.',
            'Design the "Buy 1 Bowl of Food for 15 THB" micro-donation feature so students with small pocket money can donate.'
          ],
          deliverable: 'Thai Baht (THB) Unit Cost & 15-THB Bowl Calculation Sheet',
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Save your Thai Baht (THB) calculations for feeding and vaccinating 10 neighborhood animals for 1 month.',
            targetCompetencies: ['ent-01', 'ent-03', 'ent-04']
          }
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'Week 6 (Wed–Fri): Community Impact Budget Table, Partner List & Business Model Canvas',
          durationMinutes: 360,
          learningObjective:
            'Build a transparent financial sustainability model and local pet-shop/clinic partnership plan.',
          activities: [
            'Wed–Thu: Build the Community Impact & Budget Plan (pet shop sponsors, 15 THB micro-donations, school food drives).',
            'L-SEC Track: Create a simple Income & Expense Table for feeding and healing 10 neighborhood animals for 1 month (7.1.3 Basic Financial Literacy).',
            'U-SEC Track: Complete a full Business Model Canvas and Startup Budget Spreadsheet showing partner commissions (e.g., local pet stores giving a 10% discount on donated food) and breakeven costs (7.1.4 & 7.1.5).',
            'Fri Weekly Checkpoint: Present the App Budget Table and Community Partner List.'
          ],
          deliverable: 'App Budget Table, Community Partner List & Business Model Canvas',
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your 1-month Income & Expense Table (L-SEC) or Business Model Canvas & Breakeven Spreadsheet (U-SEC).',
            targetCompetencies: ['ent-01', 'ent-04', 'ent-05']
          }
        }
      ]
    },
    {
      id: 'prototype',
      title: '5. Prototype — Weeks 7–9: Clickable Digital App (4 Features) & Physical QR Feeding Station',
      weeks: [7, 9],
      summary:
        'PHASE 4: PROTOTYPE (Weeks 7–9). Build the clickable digital app in Canva, Figma, Glide, or Thunkable across all 4 core features (Food Donation, Volunteer Feeding Map, Medical SOS & Vet Crowdfunding, Adoption Matchmaker) and build a physical Weather-Proof Community Feeding / Donation Box connected via QR Code.',
      deliverables: [
        'Clickable Digital App Part 1: Home Screen, Food Donation Hub & Live Volunteer Feeding Map with Red/Green Pins (Week 7)',
        'Clickable Digital App Part 2: Medical SOS Vet Bill Progress Bar & 4 Animal Adoption Profiles (e.g., Somchai) (Week 8)',
        'Physical Smart Community Feeding / Food Drop-Off Station with Working QR Code Sticker (Week 9)'
      ],
      competencies: ['ct-05', 'ct-03', 'ec-02'],
      stretchCompetencies: ['ec-04'],
      tasks: [
        'Week 7: Set up Canva Mobile Prototype, Figma, Glide Apps, or Thunkable and build Feature 1 (Food Donation) & Feature 2 (Volunteer Feeding Map with Pin A Soi 4 Park & Pin B Temple Gate).',
        'Week 8: Build Feature 3 (Medical SOS & Vet Bill Progress Bar: Raised 1,200 / 2,000 THB for Lucky\'s leg surgery) & Feature 4 (Adoption Matchmaker profiles e.g., Somchai on Sukhumvit Soi 50).',
        'Week 9: Build a physical Weather-Proof Feeding Station or Community Pet Food Donation Bin (cardboard, PVC pipe, plastic bin, or 3D-printed parts) with a scannable QR code sticker that opens the digital app.',
        'Test scanning the physical QR code on a phone to verify seamless real-world-to-app connection.'
      ],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Week 7 (Mon–Tue): Setting Up the Digital App Builder, Home Screen & Navigation Bar',
          durationMinutes: 240,
          learningObjective:
            'Configure the digital prototyping environment (Canva, Figma, Glide, or Thunkable) and build the Home Screen navigation bar.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Prototype, interactive, clickable, hyperlink, pin, schedule, drop-off.',
            'Set up the digital app builder and create the Home Screen with 4 clear feature buttons and bottom navigation bar.'
          ],
          deliverable: 'Digital Home Screen & Navigation Bar',
          evidenceToCollect: {
            kind: 'code',
            prompt: 'Share a screenshot or link of your digital Home Screen and navigation bar.',
            targetCompetencies: ['ct-05']
          }
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Week 7 (Wed–Fri): Building Feature 1 (Food Donation) & Feature 2 (Volunteer Feeding Map)',
          durationMinutes: 360,
          learningObjective:
            'Build interactive screens for micro-donations and live red/green neighbourhood feeding pins.',
          activities: [
            'Wed–Thu: Build Feature 1 (Food Donation Hub) and Feature 2 (Volunteer Feeding Map) with sample neighbourhood pins: 📍 Pin A (Soi 4 Park): 4 Cats — Status: Needs Food Today (Click to Sign Up); 📍 Pin B (Temple Gate): 3 Dogs — Status: Fed by Coach Donovan at 7:30 AM.',
            'L-SEC Track: Build clickable mobile screens in Canva or Google Slides using button links between pages.',
            'U-SEC Track: Build a functional no-code app in Glide (connected to a Google Sheet database) or an interactive Figma prototype with working form inputs.',
            'Fri Weekly Checkpoint: Live demo of the first 2 clickable features on a phone or tablet.'
          ],
          deliverable: 'Clickable Feature 1 (Food Donation) & Feature 2 (Volunteer Feeding Map)',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload screenshots of your clickable Food Donation Hub and Volunteer Feeding Map with Pin A and Pin B.',
            targetCompetencies: ['ct-05']
          }
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Week 8 (Mon–Tue): Building Feature 3 — Medical SOS & Vet Crowdfunding Progress Bar',
          durationMinutes: 240,
          learningObjective:
            'Build the 3-click Medical SOS report screen and transparent Vet Bill crowdfunding tracker.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Adopt, personality, vaccinated, sterilized, urgent, fundraising, progress bar.',
            'Build Feature 3 (Medical SOS & Vet Crowdfunding): photo upload button, GPS location pin, injury selector, and "Vet Bill Progress Bar" (e.g., Raised 1,200 / 2,000 THB for Lucky\'s leg surgery) + U-SEC Vet Receipt tracker.'
          ],
          deliverable: 'Clickable Feature 3: Medical SOS & Vet Bill Progress Bar',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a screenshot of your Medical SOS screen and Vet Bill Progress Bar.',
            targetCompetencies: ['ct-05', 'ec-02']
          }
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Week 8 (Wed–Fri): Building Feature 4 — Adoption Matchmaker Profiles & Full 4-Pillar Link',
          durationMinutes: 360,
          learningObjective:
            'Write empathetic English adoption stories and link all 4 app features into a complete end-to-end prototype.',
          activities: [
            'Wed–Thu: Build Feature 4 (Adoption Matchmaker) using the ESL Writing Frame (e.g., Name: Somchai, 2 years old, Male | Personality: Gentle, quiet, loves belly rubs, good with children | Health: Vaccinated ✅ | Sterilized ✅ | Story: "Somchai lived outside 7-Eleven on Sukhumvit Soi 50. He healed from a hurt paw and is ready for a safe home!" [Button: Meet Somchai]).',
            'U-SEC Track: Add an Adoption Screening Questionnaire inside the app to verify the adopter has a safe home.',
            'Fri Weekly Checkpoint: All 4 app sections connected and clickable from start to finish.'
          ],
          deliverable: '4 Animal Adoption Profiles & Fully Connected 4-Feature App Prototype',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit your Adoption Matchmaker profiles (e.g., Somchai) and confirm all 4 app features are linked.',
            targetCompetencies: ['ct-05', 'ec-02', 'ec-04']
          }
        },
        {
          sessionNumber: 17,
          week: 9,
          title: 'Week 9 (Mon–Tue): Designing the Physical Community Food Drop-Off & QR Feeding Station',
          durationMinutes: 240,
          learningObjective:
            'Design a weather-proof physical community touchpoint that bridges street feeders/donors to the mobile app via QR code.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Station, weather-proof, dispenser, QR code, hygiene, container, prototype.',
            'Design a physical Community Food Drop-Off Box or rain-proof PVC pipe Feeding Station with clear English signage: "Scan QR Code to log food level or report an empty bowl on the StreetPaws App!"'
          ],
          deliverable: 'Physical QR Feeding / Donation Station Blueprint',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your design sketch or CAD plan for the physical Community Feeding & QR Station.',
            targetCompetencies: ['ct-03']
          }
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Week 9 (Wed–Fri): Building & Testing the Physical QR Station Prototype',
          durationMinutes: 360,
          learningObjective:
            'Construct the physical feeding/donation station prototype and verify instant mobile QR code launching.',
          activities: [
            'Wed–Thu: Build the physical scale model or full-size prototype (using cardboard, PVC pipes, plastic bins, or 3D-printed parts) and attach a printed QR code sticker linked to the team\'s digital app.',
            'U-SEC Track: Incorporate 3D-printed/CAD parts or a simple circuit/sensor concept (e.g., an LED light or weight indicator showing when the food box is empty).',
            'Fri Weekly Checkpoint: Test scanning the QR code on the physical feeding station to open the app on a phone.'
          ],
          deliverable: 'Physical Smart Community Feeding & QR Station Prototype',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of your physical feeding/donation station with its scannable QR code sticker.',
            targetCompetencies: ['ct-03', 'ct-05']
          }
        }
      ]
    },
    {
      id: 'test',
      title: '6. Test — Weeks 10–11: Usability Testing, Version 2.0 Iteration, 8-Slide Deck & Rehearsal',
      weeks: [10, 11],
      summary:
        'PHASE 5: TEST & PITCH (Weeks 10–11). Conduct unassisted usability testing with 5 outside students or teachers, log a Test & Fix Table, ship Version 2.0 with at least 3 "Before & After" improvements, and build/rehearse the 8-Slide Pitch Deck and 4-Speaker ESL Pitch Script.',
      deliverables: [
        '5-User Usability Test & Fix Log + Version 2.0 App with >= 3 "Before & After" Screenshots (Week 10)',
        '8-Slide Showcase Pitch Deck & Exhibition Poster (Week 11)',
        'Completed 4-Speaker Fill-in-the-Blank ESL Pitch Script Cue Cards & Peer Rehearsal Rubric (Week 11)'
      ],
      competencies: ['sdl-02', 'sdl-04', 'ec-02', 'ec-03', 'ec-11'],
      stretchCompetencies: ['ec-07', 'ec-08'],
      tasks: [
        'Week 10: Invite 5 students or teachers from outside the class to try the app without help and observe where they get stuck.',
        'Record feedback in a Test & Fix Log, update the app to Version 2.0, and present at least 3 "Before & After" screenshots (e.g., adding 🐶 Dog and 🐱 Cat filter buttons).',
        'Week 11: Create the 8-Slide Pitch Deck and an Exhibition Poster showing the app screens, QR code, and physical feeding station.',
        'Write cue cards using the 4-Speaker Fill-in-the-Blank ESL Pitch Script and complete Friday dress rehearsal.'
      ],
      sessions: [
        {
          sessionNumber: 19,
          week: 10,
          title: 'Week 10 (Mon–Tue): 5-User Unassisted Usability Testing Session',
          durationMinutes: 240,
          learningObjective:
            'Observe 5 real users outside the class attempting core app tasks without coaching to identify navigation friction.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Test, feedback, bug, confusing, improve, revise, version.',
            'Invite 5 students or teachers from outside the class to test the app without help.',
            'U-SEC Track: Measure how many seconds and clicks it takes each user to report a sick animal or log a feeding pin.'
          ],
          deliverable: '5-User Usability Observation Notes & Task Timing Log',
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Record observations from at least 5 outside testers showing where they succeeded or got confused.',
            targetCompetencies: ['sdl-02', 'sdl-04']
          }
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Week 10 (Wed–Fri): Test & Fix Log, Version 2.0 Upgrade & "Before & After" Checkpoint',
          durationMinutes: 360,
          learningObjective:
            'Translate user feedback into at least 3 concrete UI/UX improvements in Version 2.0.',
          activities: [
            'Wed–Thu: Record feedback in a Test & Fix Log and update the app screens to Version 2.0 (e.g., "Before: Users didn\'t know if the food donation was for dogs or cats. Feedback: Add animal icons. After: Added a big 🐶 Dog and 🐱 Cat filter button at the top of the donation page.").',
            'Fri Weekly Checkpoint: Present "Before & After" screenshots showing at least 3 improvements based on user feedback.'
          ],
          deliverable: 'Test & Fix Log + 3 "Before & After" Version 2.0 Screenshots',
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Upload your Test & Fix Log and 3 "Before & After" Version 2.0 improvement descriptions.',
            targetCompetencies: ['sdl-02', 'sdl-04']
          }
        },
        {
          sessionNumber: 21,
          week: 11,
          title: 'Week 11 (Mon–Tue): Building the 8-Slide Pitch Deck & Exhibition Poster',
          durationMinutes: 240,
          learningObjective:
            'Design a visually clear 8-Slide Pitch Deck and Exhibition Poster showcasing problem data, all 4 app features, QR station, and budget.',
          activities: [
            '0:00–0:15 Daily Stand-Up & Word Wall: Pitch, audience, hook, demonstration, impact, confident, body language.',
            'Build the 8-Slide Pitch Deck (Slides 1–8) and Exhibition Poster showing app screens, QR code, and physical feeding station.'
          ],
          deliverable: '8-Slide Pitch Deck & Exhibition Poster',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload your 8-Slide Pitch Deck outline and Exhibition Poster layout.',
            targetCompetencies: ['ec-03']
          }
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Week 11 (Wed–Fri): 4-Speaker ESL Pitch Script Cue Cards & Dress Rehearsal',
          durationMinutes: 360,
          learningObjective:
            'Rehearse a 10-minute 4-speaker team pitch with confident pronunciation, eye contact, and live app/QR demonstration.',
          activities: [
            'Wed–Thu: Write cue cards using the Fill-in-the-Blank ESL Pitch Script for Speakers 1–4 (2m Hook & Problem + 2.5m Food & Map Demo + 2.5m SOS & Adoption Demo + 3m Physical QR Station, Testing & Call to Action).',
            'Fri Weekly Checkpoint: Dress rehearsal in front of peers using the Peer Feedback Rubric (U-SEC prepares for unscripted judge Q&A).'
          ],
          deliverable: '4-Speaker ESL Pitch Cue Cards & Dress Rehearsal Feedback',
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Save your team\'s completed 4-Speaker ESL Pitch Script and peer rehearsal feedback.',
            targetCompetencies: ['ec-02', 'ec-11', 'ec-07', 'ec-08']
          }
        }
      ]
    },
    {
      id: 'share',
      title: '7. Share — Week 12: The Grand "StreetPaws" App Launch, Showcase & Pet-Food Drive',
      weeks: [12, 12],
      summary:
        'PHASE 5: TEST & PITCH (Week 12). Set up the exhibition booth and physical QR feeding station, deliver the 10-minute live pitch and app demo to coaches, parents, and community guests, curate all 6 WeLearn MTC Portfolio artifacts, and run a real mini pet-food donation drive for a local shelter.',
      deliverables: [
        'Exhibition Booth with Printable Guest QR Codes & Physical Feeding Station Model (Mon–Tue)',
        '10-Minute Live Showcase Pitch & Interactive App Demo (Wed)',
        'Curated WeLearn MTC Portfolio (All 6 Selected Competencies) & Mini Pet-Food Donation Drive (Thu–Fri)'
      ],
      competencies: ['ctps-01', 'lc-01', 'ct-05', 'ent-04', 'sdl-04', 'ec-11'],
      stretchCompetencies: ['ec-08', 'ent-07'],
      tasks: [
        'Mon–Tue: Final booth setup, printing QR codes for guests to scan on their own phones, and setting up the physical feeding/donation station models.',
        'Wed: Live Showcase & Pitch Day! Deliver the 10-minute pitch and live app demo to coaches, parents, and community guests.',
        'Thu–Fri: Upload all final artifacts to the WeLearn MTC Portfolio, complete final self-reflection across all 6 competencies, and organize a real mini pet-food donation drive for a local shelter.'
      ],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'Week 12 (Mon–Wed): Booth Setup & Live 10-Minute StreetPaws Showcase Pitch Day!',
          durationMinutes: 360,
          learningObjective:
            'Deliver a persuasive 10-minute live app demonstration and community pitch that inspires real action for street animals.',
          activities: [
            'Mon–Tue: Set up exhibition booth, print QR codes for guests to scan on their own phones, and stage the physical QR feeding/donation station.',
            'Wed: Deliver the 10-minute live showcase pitch (Speakers 1–4) and interactive tablet/phone demo to coaches, parents, and community guests.'
          ],
          deliverable: 'Live 10-Minute StreetPaws Showcase Pitch & Guest QR Demo',
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Log your Showcase Pitch Day summary, guest QR scan count, and judge/community feedback.',
            targetCompetencies: ['ec-02', 'ec-03', 'ec-11', 'ct-05']
          }
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Week 12 (Thu–Fri): WeLearn MTC Portfolio Defense & Mini Pet-Food Donation Drive',
          durationMinutes: 240,
          learningObjective:
            'Curate all 6 Foundational Credit portfolio artifacts, self-assess on the 4-tier MTC rubric, and complete a real pet-food donation drive.',
          activities: [
            'Thu–Fri: Upload all 6 final portfolio artifacts to the WeLearn MTC Portfolio (1. Street Animal Research Map & Empathy Report, 2. Team Charter & Kanban Board, 3. Paper Wireframes & Interactive App Prototype, 4. App Impact Plan / Business Model Canvas & Budget, 5. User Testing Feedback Log & Weekly Reflection Journal, 6. Final App Pitch Deck, UI Poster & 10-Minute Live Pitch).',
            'Complete final self-reflection and organize the real mini pet-food donation drive for a local shelter!'
          ],
          deliverable: 'Complete 6-Competency WeLearn MTC Portfolio & Shelter Pet-Food Donation Drive Log',
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your final 6-competency WeLearn MTC self-assessment and pet-food donation drive impact reflection.',
            targetCompetencies: ['ctps-01', 'lc-01', 'ct-05', 'ent-04', 'sdl-04', 'ec-11']
          }
        }
      ]
    }
  ]
};
