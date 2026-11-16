/**
 * Don's PBL Program: Project Voyager: 3D-Printed RC Truck & Solar Charging Bay
 * Branch: DonPBL
 * Location: prototypes/DonPBL/voyagerProgram.ts
 *
 * Sourced from "Project Voyager: 3D-Printed RC Truck & Solar Charging Bay —
 * Complete 12-Week Design Thinking PBL Curriculum, Activity Guide & WeLearn/MTC Portfolio System":
 * - Duration: 12 Weeks (5 days per week, 2 hours per day = 10 hours/week, 120 Hours Total)
 * - Mission: Build a working Radio-Controlled (RC) truck using the Voyager model frame,
 *   design and 3D-print a custom truck body (shell), and engineer a solar-powered charging
 *   station (bay) to charge the truck's battery using sunlight.
 * - 5 Design Thinking Stages mapped into the 7 WeLearn Design Thinking Phases:
 *   1. Stage 1: EMPATHIZE & DEFINE (Weeks 1–2 | 20h) -> Explore (Week 1) & Empathise (Week 2)
 *   2. Stage 2: IDEATE & LOW-FI PROTOTYPE (Weeks 3–4 | 20h) -> Define (Weeks 3–4)
 *   3. Stage 3: DIGITAL PROTOTYPE / CAD (Weeks 5–6 | 20h) -> Ideate (Weeks 5–6)
 *   4. Stage 4: BUILD & INTEGRATE (Weeks 7–9 | 30h) -> Prototype (Weeks 7–9)
 *   5. Stage 5: TEST, ITERATE & SHOWCASE (Weeks 10–12 | 30h) -> Test (Weeks 10–11) & Share (Week 12)
 */

import type { PblProgram } from './programData';

export interface VoyagerTeamRole {
  roleNumber: 1 | 2 | 3 | 4 | 5;
  id: string;
  title: string;
  leadSubtitle: string;
  summary: string;
  stagePortfolioEvidence: {
    stage1Weeks1To2: string;
    stage2Weeks3To4: string;
    stage3Weeks5To6: string;
    stage4Weeks7To9: string;
    stage5Weeks10To12: string;
  };
}

export interface VoyagerWeekDeliverable {
  week: number;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  stageTitle: string;
  weekTitle: string;
  weeklyDrivingQuestion: string;
  roleTasks: {
    truckBuilder: string;
    powerSpecialist: string;
    solarArchitect: string;
    teamBoss: string;
    brandCreator: string;
  };
}

export interface VoyagerActivityGuideStep {
  guideId: 'guide-a-truck-shell' | 'guide-b-solar-bay';
  guideTitle: string;
  activityTitle: string;
  weeksAndHours: string;
  steps: string[];
}

export interface VoyagerWeLearnCompetencyRubric {
  competencyNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  subtitle: string;
  beginning1: string;
  developing2: string;
  proficient3: string;
  mastery4: string;
}

export interface VoyagerMtcReflectionQuestion {
  questionNumber: number;
  partTitle: string;
  topic: string;
  question: string;
}

export interface VoyagerGamificationBadge {
  id: string;
  title: string;
  stage: string;
  xpReward: number;
  unlockCriteria: string;
}

export const VOYAGER_TEAM_ROLES: VoyagerTeamRole[] = [
  {
    roleNumber: 1,
    id: 'role-truck-builder',
    title: 'Truck Builder & Body Designer',
    leadSubtitle: 'Mechanical Lead',
    summary:
      'Measures the Voyager RC frame, designs the custom 3D-printed truck body/shell, and builds the wheels, steering, and gears.',
    stagePortfolioEvidence: {
      stage1Weeks1To2:
        'Photo of Voyager frame measurement sheet & "No-Go Zones" diagram; 3 initial hand sketches of the truck shell.',
      stage2Weeks3To4:
        'Photo of cardboard prototype shell on the Voyager frame; Screenshot of 3D digital "ghost box" frame in CAD.',
      stage3Weeks5To6:
        'Screenshots of final 3D Voyager shell in CAD; Screenshot of sliced parts on 3D print bed; Week 6 Design Review notes.',
      stage4Weeks7To9:
        'Photos of assembled Voyager chassis; Time-lapse/photo of 3D printing shell; Photo of glued & sanded truck body mounted on frame.',
      stage5Weeks10To12:
        'Video of truck driving over bumps & turning; Before/After photos of shell fixes or wheel alignment upgrades.'
    }
  },
  {
    roleNumber: 2,
    id: 'role-power-specialist',
    title: 'Power & Wiring Specialist',
    leadSubtitle: 'Electrical Lead',
    summary:
      'Connects the battery, motor, speed controller (ESC), and radio receiver inside the truck. Keeps all wires safe and neat.',
    stagePortfolioEvidence: {
      stage1Weeks1To2:
        'Motor power test notes; Battery comparison chart (LiPo vs. Li-ion).',
      stage2Weeks3To4:
        'Hand-drawn wiring map; 3D layout map of electronics inside the frame.',
      stage3Weeks5To6:
        'CAD screenshot of battery/ESC protective holder; Final safety wiring diagram (truck + charger plug).',
      stage4Weeks7To9:
        'Video of workbench remote control test; Photo of clean wiring inside the truck; Photo of emergency ON/OFF switch.',
      stage5Weeks10To12:
        'Temperature & battery life data table; Final electrical schematic for portfolio.'
    }
  },
  {
    roleNumber: 3,
    id: 'role-solar-architect',
    title: 'Solar Bay Architect',
    leadSubtitle: 'Solar Lead',
    summary:
      'Designs and 3D-models the solar charging garage (bay), sets up the solar panels, and connects the solar charger.',
    stagePortfolioEvidence: {
      stage1Weeks1To2:
        'Sunlight test data table; 3 initial sketches of the Solar Charging Bay.',
      stage2Weeks3To4:
        'Solar panel math sheet; Screenshot of basic 3D Solar Bay base and pillars.',
      stage3Weeks5To6:
        'Screenshots of 3D Solar Bay roof angle; Solar wiring diagram (panels to charge controller).',
      stage4Weeks7To9:
        'Photos of Solar Bay frame assembly; Photo of solar panels mounted on roof; Photo of wired charge controller.',
      stage5Weeks10To12:
        'Photo of voltage screen charging in the sun; Graph of solar charging speed after roof tilt adjustments.'
    }
  },
  {
    roleNumber: 4,
    id: 'role-team-boss',
    title: 'Team Boss & Budget Manager',
    leadSubtitle: 'Project Manager',
    summary:
      'Tracks the 12-week schedule, counts parts (nuts, bolts, 3D filament), manages the budget in Thai Baht (THB), and checks workshop safety.',
    stagePortfolioEvidence: {
      stage1Weeks1To2:
        '12-week Gantt chart calendar; Workshop safety checklist; Starting THB budget sheet.',
      stage2Weeks3To4:
        'Kit parts inventory list & extra filament shopping list; Workshop tool & 3D printer check log.',
      stage3Weeks5To6:
        'Final Bill of Materials (BOM) in THB; 3D printer schedule chart; Safety Risk Matrix.',
      stage4Weeks7To9:
        'Photo of organized screw/part boxes; Updated THB spending receipt log; Signed electrical safety inspection sheet.',
      stage5Weeks10To12:
        'Track test lap time log; Final THB budget report (Planned vs. Actual).'
    }
  },
  {
    roleNumber: 5,
    id: 'role-brand-creator',
    title: 'Brand & Media Creator',
    leadSubtitle: 'Communications Lead',
    summary:
      'Designs the team logo, paints/decorates the 3D truck shell, takes photos/videos of the build, and creates the final presentation.',
    stagePortfolioEvidence: {
      stage1Weeks1To2:
        'Team name, logo, and style/color board.',
      stage2Weeks3To4:
        'Stage 1–2 Pitch Deck slides; Photos of cardboard prototyping & project update blog.',
      stage3Weeks5To6:
        '3D logo file on truck grill; Team shirt/badge design & Exhibition booth sketch.',
      stage4Weeks7To9:
        '"Day 1 of Build" hardware clip; Written or consented teammate problem-solving interviews (no under-13 voice/video capture); Photos of painted shell and bay with logos.',
      stage5Weeks10To12:
        'Final 2-minute highlight video; Showcase poster/flyer; Photo of team presenting at Showcase.'
    }
  }
];

export const VOYAGER_12_WEEK_SCHEDULE: VoyagerWeekDeliverable[] = [
  {
    week: 1,
    stageNumber: 1,
    stageTitle: 'Stage 1: EMPATHIZE & DEFINE (Weeks 1–2 | 20 Hours)',
    weekTitle: 'Week 1: Empathize (Explore & Measure)',
    weeklyDrivingQuestion:
      'How can we explore our Voyager frame, test our motor, and measure sunlight so we know what our truck and solar bay need to succeed?',
    roleTasks: {
      truckBuilder: 'Measure the Voyager frame (length, width, wheelbase, screw holes).',
      powerSpecialist: 'Test the RC motor and learn how much battery power it uses.',
      solarArchitect: 'Test small solar panels outdoors in the sun. Record sunlight data.',
      teamBoss: 'Create the 12-week team calendar and safety rules list.',
      brandCreator: 'Research cool off-road truck designs and create a team name and logo.'
    }
  },
  {
    week: 2,
    stageNumber: 1,
    stageTitle: 'Stage 1: EMPATHIZE & DEFINE (Weeks 1–2 | 20 Hours)',
    weekTitle: 'Week 2: Define (Set Rules, Sizes & Initial Sketches)',
    weeklyDrivingQuestion:
      'What are the exact size rules, safety limits, and budget goals we must follow so our custom truck shell and solar bay work safely?',
    roleTasks: {
      truckBuilder:
        'Define the "No-Go Zones" so wheels don’t rub. Sketch 3 ideas for the Voyager truck body/shell (cab, bed, fenders).',
      powerSpecialist: 'Compare RC batteries (LiPo vs. Li-ion) and pick the safest one.',
      solarArchitect: 'Sketch 3 ideas for the Solar Charging Bay (garage roof angle and size).',
      teamBoss: 'Set up the project budget sheet in Thai Baht (THB).',
      brandCreator: 'Make a color board and style guide for the truck shell and solar bay.'
    }
  },
  {
    week: 3,
    stageNumber: 2,
    stageTitle: 'Stage 2: IDEATE & LOW-FI PROTOTYPE (Weeks 3–4 | 20 Hours)',
    weekTitle: 'Week 3: Ideate & Cardboard Prototyping',
    weeklyDrivingQuestion:
      'How can we use fast cardboard models, simple wiring maps, and solar math to test our ideas before we spend time on the computer?',
    roleTasks: {
      truckBuilder:
        'Build a fast paper/cardboard test shell. Check gear ratios and how the shell will clip or screw onto the Voyager frame.',
      powerSpecialist: 'Draw a simple map showing how the motor, battery, and switch connect.',
      solarArchitect:
        'Measure the truck with the cardboard shell on. Calculate how many solar panels are needed on the bay roof to charge the battery.',
      teamBoss: 'Count all Voyager kit parts and list what extra 3D filament or parts to buy.',
      brandCreator: 'Create the Stage 1–2 slide deck and help the team practice speaking.'
    }
  },
  {
    week: 4,
    stageNumber: 2,
    stageTitle: 'Stage 2: IDEATE & LOW-FI PROTOTYPE (Weeks 3–4 | 20 Hours)',
    weekTitle: 'Week 4: Low-Fi Digital Prototyping (3D Block-Outs)',
    weeklyDrivingQuestion:
      'How can we build simple 3D digital blocks on the computer to make sure the frame, battery, shell, and solar bay will all fit together?',
    roleTasks: {
      truckBuilder:
        'Build a 3D digital block ("ghost box") of the Voyager frame in CAD to check mounting points.',
      powerSpecialist:
        'Make a 3D map showing where the battery, motor, and wires fit inside the frame.',
      solarArchitect: 'Create a 3D CAD model of the Solar Charging Bay base and pillars.',
      teamBoss: 'Check all tools and 3D printers in the workshop. Track part deliveries.',
      brandCreator:
        'Take photos of the team’s cardboard and 3D models and write a short project update.'
    }
  },
  {
    week: 5,
    stageNumber: 3,
    stageTitle: 'Stage 3: DIGITAL PROTOTYPE / CAD (Weeks 5–6 | 20 Hours)',
    weekTitle: 'Week 5: High-Detail 3D CAD Modeling',
    weeklyDrivingQuestion:
      'How can we turn our simple 3D blocks into detailed, strong, and cool-looking 3D models ready for the 3D printer?',
    roleTasks: {
      truckBuilder:
        '3D model the custom Voyager truck shell (front grill, cab, wheel arches, bed) with 2.5mm–3mm walls.',
      powerSpecialist:
        'Design 3D-printed holders/boxes to keep the battery and receiver safe from dirt.',
      solarArchitect:
        '3D model the solar roof on the bay so panels face the sun at the best angle (15°–30°).',
      teamBoss: 'Finalize the Bill of Materials (BOM) in THB and calculate 3D print times.',
      brandCreator:
        'Put the team logo into 3D so it can be printed right onto the truck grill and bay.'
    }
  },
  {
    week: 6,
    stageNumber: 3,
    stageTitle: 'Stage 3: DIGITAL PROTOTYPE / CAD (Weeks 5–6 | 20 Hours)',
    weekTitle: 'Week 6: Slicing & Gate Design Review',
    weeklyDrivingQuestion:
      'How do we prove our 3D designs, wiring plans, and budgets are 100% ready and safe before we start building for real?',
    roleTasks: {
      truckBuilder:
        'Slice the truck shell into pieces that fit on the 3D printer bed; present CAD at Design Review.',
      powerSpecialist:
        'Draw the final wiring diagram (truck + charging plug) and present safety rules.',
      solarArchitect:
        'Draw the solar wiring plan (panels to charge controller) and present at Design Review.',
      teamBoss: 'Create a 3D printing schedule so printers run smoothly during Stage 4.',
      brandCreator:
        'Design team shirts/badges and collect feedback from teachers at the Design Review.'
    }
  },
  {
    week: 7,
    stageNumber: 4,
    stageTitle: 'Stage 4: BUILD & INTEGRATE (Weeks 7–9 | 30 Hours)',
    weekTitle: 'Week 7: Chassis Assembly & First 3D Prints',
    weeklyDrivingQuestion:
      'How can we work safely and neatly in the workshop as we build our Voyager chassis, test our RC electronics, and start our first 3D prints?',
    roleTasks: {
      truckBuilder:
        'Assemble the Voyager chassis frame, axles, shocks, and wheels. Start 3D printing shell parts.',
      powerSpecialist:
        'Test the RC remote, steering servo, and motor on the workbench before installing.',
      solarArchitect:
        'Start 3D printing/laser cutting the Solar Charging Bay frame. Inspect solar panels.',
      teamBoss:
        'Run the daily safety check; organize boxes for small screws, nuts, and 3D prints.',
      brandCreator: 'Film "Day 1 of Building" videos and time-lapses of the 3D printers working.'
    }
  },
  {
    week: 8,
    stageNumber: 4,
    stageTitle: 'Stage 4: BUILD & INTEGRATE (Weeks 7–9 | 30 Hours)',
    weekTitle: 'Week 8: Sub-Assembly & Component Mounting',
    weeklyDrivingQuestion:
      'How can we carefully join our 3D-printed body pieces, mount our motor, and build our solar bay roof so every part is strong and solid?',
    roleTasks: {
      truckBuilder:
        'Glue/bolt the 3D-printed Voyager body panels together. Sand rough edges smooth.',
      powerSpecialist:
        'Mount the motor, speed controller (ESC), and steering servo onto the Voyager frame.',
      solarArchitect:
        'Build the Solar Charging Bay structure and attach the solar panels to the roof.',
      teamBoss: 'Count used screws and filament; make sure the team is on time with the schedule.',
      brandCreator:
        'Interview teammates about how they solved building problems (written notes or school-consented media; no under-13 audio/video capture).'
    }
  },
  {
    week: 9,
    stageNumber: 4,
    stageTitle: 'Stage 4: BUILD & INTEGRATE (Weeks 7–9 | 30 Hours)',
    weekTitle: 'Week 9: Final Integration & Painting',
    weeklyDrivingQuestion:
      'How do we bring the frame, painted 3D shell, wiring, and solar charger together into one complete, safe, and awesome-looking system?',
    roleTasks: {
      truckBuilder:
        'Attach the finished truck shell onto the Voyager frame. Check that wheels don’t rub when turning.',
      powerSpecialist:
        'Install the battery plug and an easy-reach ON/OFF safety switch. Keep wires tidy.',
      solarArchitect:
        'Wire the solar panels to the solar charge controller and battery charger inside the bay.',
      teamBoss: 'Check all electrical work for safety. Update the budget sheet in THB.',
      brandCreator:
        'Paint the truck shell and solar bay! Add team stickers, logos, and headlights.'
    }
  },
  {
    week: 10,
    stageNumber: 5,
    stageTitle: 'Stage 5: TEST, ITERATE & SHOWCASE (Weeks 10–12 | 30 Hours)',
    weekTitle: 'Week 10: Live Testing (Track & Sunlight)',
    weeklyDrivingQuestion:
      'What happens when we drive our Voyager truck over real bumps and plug it into the solar bay outside—and what data can we collect?',
    roleTasks: {
      truckBuilder:
        'First Drive Test! Check steering, suspension, and how well the 3D shell holds up over bumps.',
      powerSpecialist:
        'Check if the motor or battery gets hot during driving. Measure battery life.',
      solarArchitect:
        'First Solar Charge Test! Park the truck in the bay outside and check charging power.',
      teamBoss:
        'Run the test track safely. Use a stopwatch to record lap times and charging time.',
      brandCreator:
        'Take action photos and slow-motion videos of the truck driving and parking in the bay.'
    }
  },
  {
    week: 11,
    stageNumber: 5,
    stageTitle: 'Stage 5: TEST, ITERATE & SHOWCASE (Weeks 10–12 | 30 Hours)',
    weekTitle: 'Week 11: Iterate & Upgrade (Fix Problems)',
    weeklyDrivingQuestion:
      'How can we use our Week 10 test results to fix weak parts, drive smoother, and catch even more sunlight before Showcase Day?',
    roleTasks: {
      truckBuilder:
        'Fix any loose screws or weak 3D-printed shell parts. Adjust wheel alignment.',
      powerSpecialist:
        'Adjust remote control settings so the truck drives smoothly and saves battery power.',
      solarArchitect:
        'Tilt or turn the solar bay roof to catch the most sunlight and charge faster.',
      teamBoss:
        'Finish the final budget report in THB and check that all tools are returned.',
      brandCreator:
        'Make posters, flyers, and a 2-minute highlight video for the Showcase Booth.'
    }
  },
  {
    week: 12,
    stageNumber: 5,
    stageTitle: 'Stage 5: TEST, ITERATE & SHOWCASE (Weeks 10–12 | 30 Hours)',
    weekTitle: 'Week 12: Public Showcase Day',
    weeklyDrivingQuestion:
      'How can we proudly share our story, demonstrate our solar-powered RC truck live, and show visitors everything we learned?',
    roleTasks: {
      truckBuilder:
        'Showcase Day! Show guests how the Voyager chassis and 3D-printed shell work.',
      powerSpecialist:
        'Showcase Day! Demonstrate the RC controls and electrical safety system.',
      solarArchitect:
        'Showcase Day! Show live data of the Solar Bay charging the truck battery.',
      teamBoss:
        'Showcase Day! Manage the team table, schedule, and final project checklist.',
      brandCreator:
        'Showcase Day! Welcome visitors, present the team pitch, and hand out flyers.'
    }
  }
];

export const VOYAGER_ACTIVITY_GUIDES: VoyagerActivityGuideStep[] = [
  {
    guideId: 'guide-a-truck-shell',
    guideTitle: 'Guide A: Designing the Voyager RC Truck Body/Shell',
    activityTitle: 'Activity 1 (EMPATHIZE & DEFINE): The "Box-Fit" Measurement Challenge',
    weeksAndHours: 'Week 1–2 | 4 Hours',
    steps: [
      '1. Measure the Frame (using digital calipers or a ruler): Total Length (front bumper to back bumper), Total Width (outside of left wheel to outside of right wheel), Wheelbase (center of front wheel axle to center of back wheel axle), and Height (top of shock towers and battery box).',
      '2. Find the Mounting Posts: Measure the exact distance between the body clip posts or screw holes on the Voyager frame.',
      '3. Draw the "No-Go Zones": Push the suspension down and turn the front wheels left and right. Measure how much space the wheels need so they never rub against the 3D-printed fenders!'
    ]
  },
  {
    guideId: 'guide-a-truck-shell',
    guideTitle: 'Guide A: Designing the Voyager RC Truck Body/Shell',
    activityTitle: 'Activity 2 (IDEATE & LOW-FI PROTOTYPE): Paper & Cardboard Prototype Shell',
    weeksAndHours: 'Week 3 | 4 Hours',
    steps: [
      '1. Cut out a flat side view (profile) of your truck (hood, windshield, roof, truck bed) out of cardboard or foam board.',
      '2. Tape the sides together over the Voyager frame.',
      '3. Test Fit: Does the battery fit underneath? Can you reach the ON/OFF switch? Do the tires hit the cardboard when turning?',
      '4. Fix any size mistakes on your cardboard model and write down the new measurements.'
    ]
  },
  {
    guideId: 'guide-a-truck-shell',
    guideTitle: 'Guide A: Designing the Voyager RC Truck Body/Shell',
    activityTitle: 'Activity 3 (DIGITAL PROTOTYPE / CAD): 3D CAD Modeling the Voyager Shell',
    weeksAndHours: 'Weeks 4–5 | 12 Hours',
    steps: [
      'Step 1: Make the Inner Reference Box — Create a "ghost box" (transparent block) in Tinkercad, Fusion 360, or Blender matching the exact size of the Voyager frame and wheels.',
      'Step 2: Shape the Main Body — Create the Front Hood & Grill (leave small holes in the front grill for airflow to cool the motor), the Cab (windshield, roof, doors, windows), and the Rear Truck Bed (for holding extra tools or plugging into the solar bay).',
      'Step 3: Cut the Wheel Wells — Use cylinder shapes to cut out big arches over the front and back wheels so the suspension can bounce up and down freely.',
      'Step 4: Hollow the Inside (Shelling) — Make sure the body walls are 2.5mm to 3mm thick. If it is too thin, it will crack; if it is too thick, it will be too heavy for the motor!',
      'Step 5: Add Mounting Holes & Split for Printing — Add holes or brackets that line up with the Voyager frame mounts. If the truck shell is bigger than your 3D printer bed (e.g., larger than 220mm x 220mm), cut the 3D model into 2 or 3 parts (Front Hood, Middle Cab, Back Bed) and add alignment pins or screw tabs to bolt them together later.'
    ]
  },
  {
    guideId: 'guide-a-truck-shell',
    guideTitle: 'Guide A: Designing the Voyager RC Truck Body/Shell',
    activityTitle: 'Activity 4 (BUILD & INTEGRATE): 3D Printing, Joining & Finishing',
    weeksAndHours: 'Weeks 7–9 | 10 Hours',
    steps: [
      '1. Slice & Print: Use PLA or PETG filament (15%–20% infill, 3 wall loops for strength).',
      '2. Join the Sections: Use superglue (CA glue) or M3 bolts and nuts to connect the front cab and rear bed.',
      '3. Sand & Paint: Sand the layer lines smooth, spray with primer, and paint your team colors and sponsor logos!'
    ]
  },
  {
    guideId: 'guide-b-solar-bay',
    guideTitle: 'Guide B: Designing the Solar Charging Bay',
    activityTitle: 'Step 1 (DEFINE & IDEATE): Measure the Completed Truck',
    weeksAndHours: 'Week 3',
    steps: [
      'Measure how tall and wide the Voyager truck is with the new shell on it.',
      'Add 5cm of extra space on all sides so the driver can park inside the bay easily!'
    ]
  },
  {
    guideId: 'guide-b-solar-bay',
    guideTitle: 'Guide B: Designing the Solar Charging Bay',
    activityTitle: 'Step 2 (DIGITAL PROTOTYPE): Design the Bay Structure',
    weeksAndHours: 'Weeks 4–5',
    steps: [
      'Model a drive-in base plate with wheel stops (bumps that tell the driver when to stop).',
      'Model 4 corner pillars and a slanted roof frame that holds the solar panels at a 15° to 30° angle toward the sun.',
      'Include a side box on the bay wall to hold the solar charge controller and voltage screen.'
    ]
  },
  {
    guideId: 'guide-b-solar-bay',
    guideTitle: 'Guide B: Designing the Solar Charging Bay',
    activityTitle: 'Step 3 (BUILD & INTEGRATE): Wire the Charging Dock',
    weeksAndHours: 'Weeks 8–9',
    steps: [
      'Connect the solar panels on the roof to the solar charge controller.',
      'Make a magnetic or easy-plug charging cable that hangs inside the bay so the truck can plug in and charge right after driving.'
    ]
  }
];

export const VOYAGER_WELEARN_MTC_RUBRIC: VoyagerWeLearnCompetencyRubric[] = [
  {
    competencyNumber: 1,
    title: 'Critical Thinking & Problem Solving',
    subtitle: 'Fixing mistakes in the truck, wiring, or solar bay',
    beginning1: 'I wait for the teacher/coach to fix my broken 3D prints or wiring mistakes.',
    developing2: 'I can find what is broken (like a rubbing wheel or loose wire), but I need help to fix it.',
    proficient3: 'I test my part, find the problem, and fix it using data (calipers, multimeter, or test runs).',
    mastery4: 'I predict problems before they happen, test multiple solutions, and help teammates fix their designs.'
  },
  {
    competencyNumber: 2,
    title: 'Creativity & Design Innovation',
    subtitle: 'Ideating and designing the Voyager shell & solar bay',
    beginning1: 'I copy an existing design without changing it to fit the Voyager frame.',
    developing2: 'I make a simple 3D shell or bay, but it is missing key features (like airflow holes or mounting clips).',
    proficient3: 'I design and 3D-model a custom Voyager truck shell or solar bay that fits well and looks great.',
    mastery4: 'I create an original, high-performance 3D design that is strong, lightweight, and easy to 3D print and assemble.'
  },
  {
    competencyNumber: 3,
    title: 'Collaboration & Teamwork',
    subtitle: 'Working in roles & stand-up meetings',
    beginning1: 'I work alone and forget to share my measurements with my teammates.',
    developing2: 'I talk in team meetings, but sometimes my parts do not match my teammates’ parts.',
    proficient3: 'I share my measurements in Monday/Wednesday meetings so the frame, shell, wires, and bay fit together.',
    mastery4: 'I actively connect teammates, solve group disagreements, and make sure nobody falls behind schedule.'
  },
  {
    competencyNumber: 4,
    title: 'Communication & Storytelling',
    subtitle: 'Pitching, branding & explaining tech',
    beginning1: 'I have trouble explaining what my role is or how my part of the truck works.',
    developing2: 'I can explain my work using simple words, slides, or photos when the coach asks me.',
    proficient3: 'I clearly explain my engineering choices at the Week 6 Design Review and Week 12 Showcase.',
    mastery4: 'I confidently present technical data, lead the Q&A, and create professional videos/slides for the team.'
  },
  {
    competencyNumber: 5,
    title: 'Digital & Technical Literacy',
    subtitle: 'CAD, 3D printing, circuits & solar math',
    beginning1: 'I need step-by-step help to use Tinkercad/Fusion 360, the 3D printer, or wiring tools.',
    developing2: 'I can make basic 3D shapes or connect simple wires with a little bit of coaching.',
    proficient3: 'I independently use 3D CAD software, slice files for 3D printing, or wire the RC/solar circuits safely.',
    mastery4: 'I master advanced tools (custom CAD tolerances, multimeter diagnostics, solar efficiency math) and teach others.'
  },
  {
    competencyNumber: 6,
    title: 'Self-Direction & Project Management',
    subtitle: 'Time tracking, THB budget & safety',
    beginning1: 'I often forget my daily task, lose small screws/parts, or forget workshop safety rules.',
    developing2: 'I follow the daily schedule when reminded and keep my workbench mostly clean.',
    proficient3: 'I finish my weekly deliverables on time, follow all safety rules, and track our parts and THB budget.',
    mastery4: 'I manage my 120 hours independently, keep the inventory/THB budget organized, and lead safety checks.'
  },
  {
    competencyNumber: 7,
    title: 'Sustainability & Real-World Impact',
    subtitle: 'Clean solar energy & low-waste prototyping',
    beginning1: 'I waste 3D filament or do not understand how the solar panels charge the battery.',
    developing2: 'I understand that sunlight makes electricity, and I try not to waste materials in the lab.',
    proficient3: 'I build a working solar charging system or reduce plastic waste by prototyping with cardboard first.',
    mastery4: 'I calculate and optimize net solar energy (Solar In vs. Battery Out) and design parts for easy repair and recycling.'
  }
];

export const VOYAGER_MTC_REFLECTION_QUESTIONS: VoyagerMtcReflectionQuestion[] = [
  {
    questionNumber: 1,
    partTitle: 'Part 1: Empathize & Define (Understanding the Challenge)',
    topic: 'My Role',
    question: 'What was your main job on the team, and what parts of the Voyager truck or Solar Bay did you build?'
  },
  {
    questionNumber: 2,
    partTitle: 'Part 1: Empathize & Define (Understanding the Challenge)',
    topic: 'Project Goal',
    question: 'In your own words, how does your team’s RC truck and Solar Charging Bay work together?'
  },
  {
    questionNumber: 3,
    partTitle: 'Part 1: Empathize & Define (Understanding the Challenge)',
    topic: 'Measuring & Rules',
    question: 'Why was it important to measure the Voyager frame and test the solar panels in Week 1 before designing anything?'
  },
  {
    questionNumber: 4,
    partTitle: 'Part 2: Ideate & Prototype (From Cardboard to 3D CAD)',
    topic: 'Low-Fi to High-Fi',
    question: 'How did your truck shell or solar bay change from your paper sketch and cardboard model (Weeks 2–3) to your final 3D CAD model (Weeks 5–6)?'
  },
  {
    questionNumber: 5,
    partTitle: 'Part 2: Ideate & Prototype (From Cardboard to 3D CAD)',
    topic: 'Tools & Machines',
    question: 'Which tool or software (calipers, Tinkercad/Fusion 360, 3D printer, soldering/wiring, multimeter) did you get best at using?'
  },
  {
    questionNumber: 6,
    partTitle: 'Part 3: Build, Test & Iterate (Fixing Mistakes)',
    topic: 'Testing & Fixing (Iteration)',
    question: 'Describe one thing that broke, rubbed, did not fit, or did not work during Week 10 testing. How did you fix it in Week 11?'
  },
  {
    questionNumber: 7,
    partTitle: 'Part 3: Build, Test & Iterate (Fixing Mistakes)',
    topic: 'Time & Pacing',
    question: 'Look at your 12-week calendar. Which Design Thinking stage was the hardest to finish on time, and how did you catch up?'
  },
  {
    questionNumber: 8,
    partTitle: 'Part 4: WeLearn Future Skills & MTC Competency Claim',
    topic: 'Teamwork',
    question: 'Give one example of how you worked with a teammate during a Wednesday Fit Check so your parts fit together properly.'
  },
  {
    questionNumber: 9,
    partTitle: 'Part 4: WeLearn Future Skills & MTC Competency Claim',
    topic: 'Budget & Sustainability',
    question: 'How did your team save money (THB), avoid wasting 3D filament, or capture more solar energy?'
  },
  {
    questionNumber: 10,
    partTitle: 'Part 4: WeLearn Future Skills & MTC Competency Claim',
    topic: 'Communication',
    question: 'How did you prepare for the Week 12 Showcase to make sure visitors understood your project?'
  },
  {
    questionNumber: 11,
    partTitle: 'Part 4: WeLearn Future Skills & MTC Competency Claim',
    topic: 'Best Artifact & MTC Claim',
    question: 'Which photo, 3D model, or test result in your portfolio are you most proud of, and which two WeLearn/MTC skills did you reach "Proficient (3)" or "Mastery (4)" in?'
  },
  {
    questionNumber: 12,
    partTitle: 'Part 4: WeLearn Future Skills & MTC Competency Claim',
    topic: 'Next Iteration',
    question: 'If you had 2 more weeks and 500 THB more in your budget, what would you upgrade on your Voyager RC truck or Solar Charging Bay?'
  }
];

export const VOYAGER_GAMIFICATION_BADGES: VoyagerGamificationBadge[] = [
  {
    id: 'badge-voyager-boxfit',
    title: 'Box-Fit Caliper Scout',
    stage: 'Stage 1 (Weeks 1–2)',
    xpReward: 250,
    unlockCriteria: 'Measure the Voyager frame (Length, Width, Wheelbase, Height), map "No-Go Zones", and test solar panels in the sun.'
  },
  {
    id: 'badge-voyager-cardboard',
    title: 'Cardboard & Ghost-Box Architect',
    stage: 'Stage 2 (Weeks 3–4)',
    xpReward: 300,
    unlockCriteria: 'Test-fit a fast cardboard shell on the Voyager frame and model the 3D CAD "ghost box" + Solar Bay base (+5cm clearance).'
  },
  {
    id: 'badge-voyager-cad-shell',
    title: '2.5mm–3mm CAD Shell Master',
    stage: 'Stage 3 (Week 5)',
    xpReward: 400,
    unlockCriteria: 'Model the custom Voyager shell with front grill airflow holes, wheel wells, 2.5mm–3mm walls, and 15°–30° solar bay roof.'
  },
  {
    id: 'badge-voyager-gate-review',
    title: 'Week 6 Gate Design Reviewer',
    stage: 'Stage 3 (Week 6)',
    xpReward: 450,
    unlockCriteria: 'Slice the shell (15%–20% infill, 3 wall loops), present final RC & solar wiring diagrams, and lock the THB Bill of Materials.'
  },
  {
    id: 'badge-voyager-chassis',
    title: 'Voyager Chassis & Solar Integrator',
    stage: 'Stage 4 (Weeks 7–9)',
    xpReward: 500,
    unlockCriteria: 'Assemble the Voyager chassis, ESC, servo, ON/OFF safety switch, 3D-printed shell, and magnetic/easy-plug Solar Charging Bay.'
  },
  {
    id: 'badge-voyager-track-solar',
    title: 'Bump-Track & Sunlight Optimizer',
    stage: 'Stage 5 (Weeks 10–11)',
    xpReward: 550,
    unlockCriteria: 'Complete the First Drive Test and First Solar Charge Test, then iterate wheel alignment and solar roof tilt in Week 11.'
  },
  {
    id: 'badge-voyager-showcase',
    title: 'Project Voyager Showcase Champion',
    stage: 'Stage 5 (Week 12)',
    xpReward: 600,
    unlockCriteria: 'Demonstrate the solar-powered RC truck live at Public Showcase Day and complete the 12-Question MTC Portfolio Reflection!'
  }
];

export const VOYAGER_PROGRAM: PblProgram = {
  id: 'project-voyager-rc-solar-2026',
  title: 'Project Voyager: 3D-Printed RC Truck & Solar Charging Bay',
  subtitle:
    'Complete 12-Week (120-Hour) Design Thinking PBL Curriculum: Build a working Voyager RC truck, 3D-print a custom 2.5mm–3mm shell, and engineer a 15°–30° Solar Charging Bay.',
  status: 'provisional_prototype',
  theme: 'Mechanical CAD, 3D Printing, RC Mechatronics & Solar Energy Engineering',
  drivingQuestion:
    'How might we build a working Radio-Controlled (RC) truck on the Voyager model frame, design and 3D-print a custom truck body (shell), and engineer a solar-powered charging bay to charge the truck’s battery using sunlight?',
  realProblem: {
    type: 'both',
    summary:
      'Electric vehicles and autonomous utility trucks only achieve true sustainability when paired with clean, renewable charging infrastructure and lightweight, repairable body shells. Teams of 5 students take on real engineering roles to measure the Voyager RC frame, prototype in cardboard and 3D CAD, 3D-print a custom shell, wire the ESC/servo/motor drivetrain, and build a solar-powered charging garage within a strict Thai Baht (THB) budget.',
    peopleImpact:
      'Equips ESL and multilingual learners with hands-on mechanical measurement, 3D CAD modeling, safe DC electrical wiring, solar power math, and structured daily team collaboration.',
    environmentalImpact:
      'Demonstrates zero-emission solar charging (Solar In vs. Battery Out) and low-waste additive manufacturing by testing fit with cardboard and "ghost boxes" before 3D printing.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17; ESL-Friendly)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Voyager RC model chassis frame (axles, shocks, wheels, transmission gears)',
      'RC Brushless/Brushed Motor, Electronic Speed Controller (ESC), Steering Servo, and 2.4GHz Radio Receiver + Transmitter',
      'Rechargeable 2S RC Battery (Li-ion vs. LiPo comparison) with easy-reach ON/OFF safety switch'
    ],
    sensorsAndActuators: [
      'Photovoltaic Solar Panels (15°–30° roof mount) + Solar Charge Controller + Digital Voltage/Current Screen',
      'Magnetic or easy-plug charging dock cable inside the Solar Charging Bay',
      'Digital calipers, rulers, multimeters, and stopwatches for test data collection'
    ],
    fabricationMaterials: [
      'PLA and PETG 3D printing filament (sliced at 15%–20% infill, 3 wall loops, 2.5mm–3mm shell thickness)',
      'Cardboard and foam board for Week 3 low-fi test shells and bay sizing (+5cm clearance on all sides)',
      'M3 bolts, nuts, body clip posts, CA superglue, sandpaper, primer, and team paint/stickers'
    ],
    softwareAndTools: [
      '3D CAD Software: Tinkercad, Autodesk Fusion 360, or Blender (for "ghost box" reference, truck shell, and solar bay)',
      '3D Printer Slicer (Cura / PrusaSlicer / Bambu Studio) for 220mm x 220mm bed splitting & print time estimation',
      'Thai Baht (THB) Bill of Materials (BOM) & 12-Week Gantt Chart Schedule'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Battery & Electrical Safety (Role 2 & Role 4): Compare LiPo vs. Li-ion chemistry in Week 2; always install an easy-reach ON/OFF safety switch, use protective 3D-printed battery/ESC holders, and never short-circuit terminals.',
      '3D Printer & Workshop Safety: Keep fingers clear of heated nozzles and build plates; wear safety glasses when cutting support material, sanding 3D prints, or using CA superglue.',
      'Under-13 Safeguarding & Consent Rule: For the Week 8 teammate interviews and Week 12 Final 12-Question MTC Portfolio Reflection, under-13 learners submit written notes, photos, or tap-to-choose cards (never under-13 voice/video recording or speech-to-text). Any audio/video recording of older learners requires prior school consent and must never be stored on the platform.'
    ],
    pedagogicalScaffolding: [
      'Daily 2-Hour Class Rhythm (10h/Week for ESL Focus): (1) 0:00–0:15 (15 mins) Daily Stand-Up Check-In ("What did I finish yesterday?" and "What am I building today?"), (2) 0:15–1:40 (85 mins) Hands-On Workshop & CAD Time, (3) 1:40–2:00 (20 mins) Clean Up & Progress Log (1 photo + 1–2 sentences).',
      'Weekly Team Checkpoints: Monday (First 20 mins) Goal Setting; Wednesday (20 mins) Mid-Week Fit Check between Truck Builder, Power Specialist, and Solar Architect; Friday (Last 30 mins) Show, Tell & Portfolio Upload ("Show, Tell, Reflect").',
      'Cardboard & Ghost-Box Before 3D Printing: Never allow a team to 3D print in Week 3—enforce the Week 3 cardboard shell fit-test and Week 4 CAD "ghost box" block-out so zero filament is wasted.',
      'Week 6 Gate Design Review: Teams must prove their 2.5mm–3mm shell thickness, >220mm bed splits, wiring safety diagram, 15°–30° solar roof angle, and THB budget before starting Stage 4 builds.'
    ],
    aiEthicsRules: [
      'Calipers & Sunlight Data First: Students must physically measure the Voyager frame with calipers and test real solar panels in the sun; AI may help check solar charging math or suggest CAD troubleshooting steps.',
      'Transparent AI Log: Record what was asked, what formula or suggestion AI provided, and how the team verified it on the physical Voyager chassis.'
    ],
    differentiationNotes: [
      'Primary / Emerging ESL Track (Ages 9–11): Pre-measured Voyager "ghost box" template in Tinkercad, color-coded plug-and-play wiring harnesses, and visual sentence starters for Friday "Show, Tell, Reflect" portfolio slides.',
      'Middle Secondary Track (Ages 12–14): Full caliper measurement of Voyager frame & No-Go Zones, 2-to-3 piece split shell in Tinkercad/Fusion 360 (2.5mm–3mm walls), and multimeter solar tilt angle testing (15°–30°).',
      'Upper Secondary Track (Ages 15–17): Parametric Fusion 360/Blender shell aesthetics with aerodynamic motor cooling ducts, custom M3 alignment tabs, net solar energy math (Solar In vs. Battery Out), and full THB BOM variance audit.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-voyager-boxfit-cad',
      metric: 'Guide A: "Box-Fit" Clearance & 2.5mm–3mm CAD Shell Integrity',
      target: 'Zero tire rub across full suspension/steering travel + 2.5mm–3.0mm shell wall thickness + clean 15%–20% infill / 3-wall-loop 3D print',
      verificationMethod: 'Wednesday Mid-Week Fit Check, Week 6 Gate Design Review slicer audit, and Week 10 bump-track test'
    },
    {
      id: 'metric-voyager-solar-bay',
      metric: 'Guide B: Solar Charging Bay Clearance & 15°–30° Roof Efficiency',
      target: 'Bay interior includes +5cm clearance on all sides + 15°–30° tilted solar roof + working magnetic/easy-plug dock charging the truck battery in sunlight',
      verificationMethod: 'Week 10 First Solar Charge Test & Week 11 roof-tilt voltage/current log'
    },
    {
      id: 'metric-voyager-budget-mtc',
      metric: 'THB Budget Compliance & 12-Question MTC Portfolio Completion',
      target: '100% of 5 roles log Stage 1–5 portfolio evidence, Friday "Show, Tell, Reflect" entries, final THB budget report, and 12-Question MTC Reflection',
      verificationMethod: 'Week 12 Public Showcase Day & WeLearn/MTC 7-Competency Rubric (Levels 1–4)'
    }
  ],
  assumptions: [
    {
      id: 'asmp-voyager-schedule',
      domain: '12-Week / 120-Hour Studio Schedule',
      assumption: 'Program runs for 12 weeks at 5 days per week, 2 hours per day (10 hours/week = 120 hours total) following the 15m/85m/20m daily ESL routine.',
      ownerVerificationNeeded: 'Confirm 5-day x 2-hour studio timetable and outdoor sunlight testing area with school coordinator.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-voyager-hardware',
      domain: 'Voyager RC Frame, 3D Printers & Solar Kit',
      assumption: 'Workshop provides Voyager RC chassis kits, 220mm x 220mm (or larger) FDM 3D printers with PLA/PETG filament, and low-voltage solar panels with charge controllers.',
      ownerVerificationNeeded: 'Confirm Voyager RC kit count, 3D printer bed dimensions, and THB team budget cap with lab manager.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Stage 1A: Empathize — Explore & Measure the Voyager Frame & Sunlight (Week 1)',
      strap: '5 Team Roles, Caliper "Box-Fit" Frame Measurements, Motor Power Test & Outdoor Sunlight Data',
      weeks: [1, 1],
      goal: 'Assign the 5 ESL-friendly team roles, measure the Voyager RC frame (Total Length, Width, Wheelbase, Height, Mounting Posts), test the RC motor power draw, and record outdoor solar panel data.',
      tasks: [
        'Choose your main 12-week role: (1) Truck Builder & Body Designer, (2) Power & Wiring Specialist, (3) Solar Bay Architect, (4) Team Boss & Budget Manager, or (5) Brand & Media Creator.',
        'Truck Builder (Guide A Activity 1 Part 1): Use digital calipers or a ruler to measure the Voyager frame (Total Length, Total Width, Wheelbase, Height, and Mounting Posts).',
        'Power Specialist: Test the RC motor and record how much battery power it uses.',
        'Solar Architect: Test small solar panels outdoors in the sun and record sunlight voltage/current data.',
        'Team Boss & Brand Creator: Create the 12-week team calendar and safety rules list; research off-road truck designs and create a team name and logo.'
      ],
      evidence: [
        'Voyager Frame Measurement Sheet (Total Length, Width, Wheelbase, Height, Mounting Posts)',
        'RC Motor Power Test Notes & Outdoor Sunlight Test Data Table',
        '12-Week Team Gantt Calendar & Workshop Safety Checklist',
        'Team Name, Logo & Off-Road Truck Research Board'
      ],
      aiPromptStarters: [
        'We measured our Voyager frame with calipers: Length = [X] mm, Width = [Y] mm, Wheelbase = [Z] mm. How do we make sure our custom truck shell fits without rubbing the tires?',
        'Our small solar panel produced [V] volts and [A] amps in outdoor sunlight today. How do we calculate how many watts it makes?'
      ],
      competencies: ['ctps-01', 'sdl-01', 'ct-01'],
      stretchCompetencies: ['ec-01'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Week 1 (Days 1–2): Team Roles, Daily Stand-Up Rhythm & Voyager Frame Measurement',
          durationMin: 300,
          learningGoal: 'Establish the 5 team roles, practice the 15-minute Daily Stand-Up Check-In, and measure the Voyager RC chassis frame.',
          activities: [
            'Monday Goal Setting (20 mins): Team Boss reads the Week 1 Driving Question: "How can we explore our Voyager frame, test our motor, and measure sunlight so we know what our truck and solar bay need to succeed?"',
            'Truck Builder & Body Designer (Guide A Activity 1): Measure Total Length (front to back bumper), Total Width (outside left wheel to outside right wheel), Wheelbase (center of front axle to back axle), Height (shock towers & battery box), and Mounting Posts.',
            'Team Boss & Brand Creator: Build the 12-week team calendar, workshop safety checklist, and initial team name/logo concepts.'
          ],
          learnerChoices: {
            question: 'Which of the 5 Project Voyager Team Roles are you leading for the 12-week project?',
            options: [
              { id: 'opt-role-1', label: 'Role 1: Truck Builder & Body Designer (Mechanical Lead)', description: 'Measures frame, models 3D shell, builds wheels/steering/gears.' },
              { id: 'opt-role-2', label: 'Role 2: Power & Wiring Specialist (Electrical Lead)', description: 'Connects battery, motor, ESC, receiver, and safety switches.' },
              { id: 'opt-role-3', label: 'Role 3: Solar Bay Architect (Solar Lead)', description: 'Models solar charging garage, sets up panels & charge controller.' },
              { id: 'opt-role-4-5', label: 'Role 4 (Team Boss / THB Budget) or Role 5 (Brand & Media)', description: 'Manages schedule/THB budget/safety or 3D logo/paint/media.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Voyager Frame Measurement Sheet (Length, Width, Wheelbase, Height, Mounting Posts) and 12-week team calendar.',
            targetCompetencies: ['ctps-01', 'sdl-01']
          },
          reflectionPrompt: 'Why was it important to measure the Voyager frame with calipers in Week 1 before sketching or 3D modeling anything?',
          teacherTips: 'Model the Daily 2-Hour Class Rhythm from Day 1: 15m Stand-Up Check-In, 85m Workshop/CAD, and 20m Clean Up & Progress Log.'
        },
        {
          sessionNumber: 2,
          week: 1,
          title: 'Week 1 (Days 3–5): RC Motor Power Benchmarking & Outdoor Sunlight Testing',
          durationMin: 300,
          learningGoal: 'Measure RC motor power consumption and test small solar panels outdoors in direct sunlight.',
          activities: [
            'Wednesday Mid-Week Fit Check (20 mins): Compare frame measurements with motor and solar panel dimensions.',
            'Power & Wiring Specialist: Test the RC motor on the bench and record voltage and current draw.',
            'Solar Bay Architect: Test small solar panels outdoors in the sun and record sunlight data in a table.',
            'Friday Show, Tell & Portfolio Upload (30 mins): Complete the Week 1 "Show, Tell, Reflect" entry.'
          ],
          learnerChoices: {
            question: 'What outdoor condition gave your solar panel the highest power reading this week?',
            options: [
              { id: 'opt-sun-direct', label: 'Direct Midday Sunlight (Tilted Toward Sun)', description: 'Highest voltage and current output when angled directly at the sun.' },
              { id: 'opt-sun-flat', label: 'Flat Horizontal Panel vs. Partial Cloud/Shade', description: 'Showed how much power drops when flat or shaded.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your Motor Power Test notes, Outdoor Sunlight Data Table, and Friday "Show, Tell, Reflect" entry.',
            targetCompetencies: ['ctps-02', 'ec-01']
          },
          reflectionPrompt: 'How did testing the motor and solar panels in Week 1 help your team understand how the truck and solar bay work together?',
          teacherTips: 'Remind students to use the 3-step Friday template: 1. SHOW (1 photo), 2. TELL (2 sentences), 3. REFLECT (1 sentence + skill tag).'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Stage 1B: Define — No-Go Zones, Battery Safety, THB Budget & Initial Sketches (Week 2)',
      strap: 'Wheel "No-Go Zones", LiPo vs. Li-ion Safety, THB Budget Sheet & 3 Shell/Bay Sketches',
      weeks: [2, 2],
      goal: 'Define exact building limits ("No-Go Zones" so wheels never rub, LiPo vs. Li-ion battery safety, and Thai Baht budget) and sketch 3 ideas each for the custom truck shell and Solar Charging Bay.',
      tasks: [
        'Truck Builder (Guide A Activity 1 Part 3): Push the suspension down and turn front wheels left/right to draw the "No-Go Zones" so tires never rub against 3D-printed fenders; sketch 3 ideas for the truck body/shell (cab, bed, fenders).',
        'Power Specialist: Compare RC batteries (LiPo vs. Li-ion) and pick the safest one for your team.',
        'Solar Architect: Sketch 3 ideas for the Solar Charging Bay (garage roof angle and size).',
        'Team Boss: Set up the project budget sheet in Thai Baht (THB).',
        'Brand Creator: Make a color board and style guide for the truck shell and solar bay.'
      ],
      evidence: [
        '"No-Go Zones" Wheel Clearance Diagram & 3 Initial Hand Sketches of the Truck Shell',
        'RC Battery Comparison Chart (LiPo vs. Li-ion Safety & Capacity)',
        '3 Initial Sketches of the Solar Charging Bay (Garage Roof Angle & Size)',
        'Starting Thai Baht (THB) Budget Sheet & Team Style/Color Board'
      ],
      aiPromptStarters: [
        'Compare a 2S Li-ion battery pack vs. a 2S LiPo battery pack for a school RC truck workshop: which is safer to charge from a solar bay and why?',
        'We are sketching 3 ideas for our Solar Charging Bay roof. What roof angle between 15° and 30° works best in Thailand sunlight?'
      ],
      competencies: ['ctps-03', 'ct-02', 'sdl-02'],
      stretchCompetencies: ['sea-01'],
      sessions: [
        {
          sessionNumber: 3,
          week: 2,
          title: 'Week 2 (Days 1–2): Drawing "No-Go Zones" & Comparing RC Batteries (LiPo vs. Li-ion)',
          durationMin: 300,
          learningGoal: 'Map suspension/steering "No-Go Zones" and select the safest rechargeable battery chemistry.',
          activities: [
            'Monday Goal Setting: Read the Week 2 Driving Question: "What are the exact size rules, safety limits, and budget goals we must follow so our custom truck shell and solar bay work safely?"',
            'Truck Builder: Compress the shocks and steer full left/right to draw the "No-Go Zones" on the measurement sheet.',
            'Power Specialist: Create the LiPo vs. Li-ion comparison chart (safety, voltage, charging rules) and select the safest battery.',
            'Team Boss: Set up the starting Thai Baht (THB) project budget sheet.'
          ],
          learnerChoices: {
            question: 'Which battery option did your Power Specialist choose for safe workshop and solar operation?',
            options: [
              { id: 'opt-bat-liion', label: '2S 7.4V Li-ion Pack with Built-In Protection', description: 'Sturdy metal cells, stable solar charging, and high thermal safety.' },
              { id: 'opt-bat-lipo', label: '2S 7.4V Hardcase LiPo with Low-Voltage Alarm', description: 'High burst current for steep bumps; requires strict LiPo bag & balance charger.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your "No-Go Zones" diagram, Battery Comparison Chart (LiPo vs. Li-ion), and starting THB budget sheet.',
            targetCompetencies: ['ctps-03', 'sdl-02']
          },
          reflectionPrompt: 'What happens during driving if you forget to push the suspension down and turn the wheels when measuring "No-Go Zones"?',
          teacherTips: 'Have students physically compress the Voyager shocks while turning the front wheels so they see how much arch space the tires actually need.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Week 2 (Days 3–5): Sketching 3 Truck Shells, 3 Solar Bays & Team Style Guide',
          durationMin: 300,
          learningGoal: 'Sketch 3 concepts for the Voyager truck shell and 3 concepts for the Solar Charging Bay, plus a team color/style board.',
          activities: [
            'Wednesday Mid-Week Fit Check: Verify that all 3 truck shell sketches respect the "No-Go Zones" and battery box height.',
            'Truck Builder & Solar Architect: Draw 3 initial hand sketches of the truck shell (cab, bed, fenders) and 3 initial sketches of the Solar Charging Bay (roof angle and size).',
            'Brand Creator: Complete the team color board and style guide.',
            'Friday Show, Tell & Portfolio Upload: Complete Stage 1 portfolio evidence checklist.'
          ],
          learnerChoices: {
            question: 'Which custom Voyager truck body style did your team vote to prototype in Week 3?',
            options: [
              { id: 'opt-style-utility', label: 'Off-Road Solar Utility Pickup', description: 'Open rear bed for easy solar charging plug access and tool carrying.' },
              { id: 'opt-style-rescue', label: 'Rugged Expedition Canopy Truck', description: 'High-clearance fenders, vented front grill, and sloped roof rack.' },
              { id: 'opt-style-cyber', label: 'Angled Futuristic Hauler', description: 'Flat geometric panels that are fast to prototype in cardboard and 3D CAD.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your 3 truck shell sketches, 3 Solar Charging Bay sketches, and team style/color board.',
            targetCompetencies: ['ct-02', 'ec-02']
          },
          reflectionPrompt: 'How did drawing 3 different sketches help your team combine the best ideas before cutting cardboard?',
          teacherTips: 'Check that every Stage 1 role artifact from Section 7.A of the guide is uploaded before moving to Stage 2.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Stage 2: Ideate & Low-Fi Prototype — Cardboard Shell & 3D Digital Block-Outs (Weeks 3–4)',
      strap: 'Paper/Cardboard Test Shell, Solar Panel Math, +5cm Bay Clearance & CAD "Ghost Box"',
      weeks: [3, 4],
      goal: 'Turn paper sketches into a fast cardboard test shell mounted on the Voyager frame, calculate solar bay sizing (+5cm clearance on all sides) and panel count, and build 3D digital block-outs ("ghost box") in CAD.',
      tasks: [
        'Week 3 (Guide A Activity 2): Build a fast paper/cardboard test shell (hood, windshield, roof, bed), tape over the Voyager frame, and test-fit battery access, ON/OFF switch reach, and tire turning clearance.',
        'Week 3 (Guide B Step 1): Measure the completed truck with the cardboard shell on and add 5cm of extra space on all sides so the driver can park inside the Solar Bay easily; calculate how many solar panels are needed.',
        'Week 3: Power Specialist draws a simple wiring map (motor, battery, switch); Team Boss counts kit parts and extra filament needed; Brand Creator prepares the Stage 1–2 slide deck.',
        'Week 4 (Guide A Activity 3 Step 1): Build a 3D digital block ("ghost box") of the Voyager frame in CAD to check mounting points.',
        'Week 4: Power Specialist makes a 3D layout map of electronics inside the frame; Solar Architect creates a 3D CAD model of the Solar Charging Bay base and pillars; Team Boss checks workshop tools & 3D printers.'
      ],
      evidence: [
        'Photo of Cardboard Prototype Shell Mounted on the Voyager Frame',
        'Hand-Drawn Wiring Map & Solar Panel Math Sheet (+5cm Bay Clearance)',
        'Kit Parts Inventory List, Extra Filament Shopping List & Stage 1–2 Pitch Deck Slides',
        'Screenshots of 3D Digital "Ghost Box" Frame, Electronics 3D Layout Map & Basic 3D Solar Bay Base/Pillars'
      ],
      aiPromptStarters: [
        'Our Voyager truck with the cardboard shell is [L] cm long and [W] cm wide. If we add 5cm of extra space on all sides, what are the minimum inside dimensions of our Solar Charging Bay?',
        'How do I create a transparent "ghost box" reference block in Tinkercad or Fusion 360 so I can model my truck shell around it without hitting the chassis?'
      ],
      competencies: ['ct-03', 'ctps-04', 'sdl-03'],
      stretchCompetencies: ['lc-01'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Week 3 (Days 1–2): Guide A Activity 2 — Paper & Cardboard Prototype Shell Fit-Test',
          durationMin: 300,
          learningGoal: 'Build a fast cardboard test shell over the Voyager frame and test battery fit, switch reach, and wheel clearance.',
          activities: [
            'Monday Goal Setting: Read the Week 3 Driving Question: "How can we use fast cardboard models, simple wiring maps, and solar math to test our ideas before we spend time on the computer?"',
            'Truck Builder (Guide A Activity 2): Cut out a flat side profile (hood, windshield, roof, bed) from cardboard, tape the sides over the Voyager frame, and run the 3-point Test Fit: (1) Does the battery fit underneath? (2) Can you reach the ON/OFF switch? (3) Do the tires hit the cardboard when turning?',
            'Power Specialist: Draw a simple wiring map showing how the motor, ESC, battery, and switch connect.'
          ],
          learnerChoices: {
            question: 'What size mistake did your cardboard test shell catch before you started 3D CAD?',
            options: [
              { id: 'opt-cb-wheel', label: 'Front Tires Rubbed the Cardboard Fender on Full Turn', description: 'Widened the wheel arch cutout by 10mm on the cardboard model.' },
              { id: 'opt-cb-switch', label: 'Hard to Reach the Battery or ON/OFF Switch', description: 'Added a side access notch and rear bed hatch to the measurements.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload a photo of your cardboard prototype shell on the Voyager frame and your hand-drawn wiring map.',
            targetCompetencies: ['ct-03', 'ctps-04']
          },
          reflectionPrompt: 'How much 3D printing time and plastic filament did your team save by finding size mistakes with cardboard first?',
          teacherTips: 'Insist that students trim and re-tape their cardboard shell until the wheels spin and turn 100% freely.'
        },
        {
          sessionNumber: 6,
          week: 3,
          title: 'Week 3 (Days 3–5): Guide B Step 1 — Measuring the Truck (+5cm Clearance) & Solar Math',
          durationMin: 300,
          learningGoal: 'Measure the truck with the cardboard shell on, add 5cm clearance on all sides for the Solar Bay, and calculate solar panel requirements.',
          activities: [
            'Wednesday Mid-Week Fit Check: Measure how tall and wide the Voyager truck is WITH the new cardboard shell on it.',
            'Solar Architect (Guide B Step 1): Add 5cm of extra space on all sides so the driver can park inside the bay easily, and calculate how many solar panels are needed on the bay roof to charge the battery.',
            'Team Boss & Brand Creator: Count all Voyager kit parts, list extra 3D filament to buy, and create the Stage 1–2 slide deck.'
          ],
          learnerChoices: {
            question: 'Why does Guide B require adding 5cm of extra space on all sides of the truck inside the Solar Charging Bay?',
            options: [
              { id: 'opt-bay-park', label: 'Easy RC Driving & Parking Without Crashing into Pillars', description: 'Gives the driver room to steer onto the base plate and hit the wheel stops cleanly.' },
              { id: 'opt-bay-cable', label: 'Room for the Hanging Charging Cable & Side Controller Box', description: 'Leaves space to plug in the magnetic/easy-plug charger safely.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit your Solar Panel Math Sheet (+5cm bay clearance dimensions), kit inventory list, and Stage 1–2 slides.',
            targetCompetencies: ['ctps-05', 'sdl-03']
          },
          reflectionPrompt: 'How did the Truck Builder and Solar Architect work together during Wednesday’s Fit Check so the truck will fit inside the bay?',
          teacherTips: 'Check that students add 5cm to BOTH the left and right sides (+10cm total width) and front/back!'
        },
        {
          sessionNumber: 7,
          week: 4,
          title: 'Week 4 (Days 1–2): 3D Digital Block-Outs — The Voyager CAD "Ghost Box"',
          durationMin: 300,
          learningGoal: 'Build a 3D digital block ("ghost box") of the Voyager frame and electronics layout in CAD.',
          activities: [
            'Monday Goal Setting: Read the Week 4 Driving Question: "How can we build simple 3D digital blocks on the computer to make sure the frame, battery, shell, and solar bay will all fit together?"',
            'Truck Builder (Guide A Activity 3 Step 1): Create the Inner Reference "Ghost Box" (transparent block) in Tinkercad, Fusion 360, or Blender matching the exact size of the Voyager frame, wheels, and mounting posts.',
            'Power Specialist: Make a 3D layout map showing where the battery, motor, ESC, and wires fit inside the frame.'
          ],
          learnerChoices: {
            question: 'Which 3D CAD software is your team using to model the Voyager "ghost box" and shell?',
            options: [
              { id: 'opt-cad-tinkercad', label: 'Tinkercad (Fast Block-Outs & Hole Cylinders)', description: 'Great for combining basic shapes and cutting wheel wells with hole cylinders.' },
              { id: 'opt-cad-fusion', label: 'Autodesk Fusion 360 (Parametric Sketches & Shelling)', description: 'Ideal for exact caliper dimensions and 2.5mm–3mm wall shelling.' },
              { id: 'opt-cad-blender', label: 'Blender (Mesh Modeling & Stylized Body Panels)', description: 'Great for custom off-road body curves and 3D team logos.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload screenshots of your 3D digital "ghost box" frame in CAD and your 3D electronics layout map.',
            targetCompetencies: ['ct-04', 'ctps-05']
          },
          reflectionPrompt: 'How does building a transparent "ghost box" of the Voyager frame in CAD stop you from making the truck shell too small?',
          teacherTips: 'Remind students to lock or group the transparent "ghost box" in CAD so they don’t accidentally resize the chassis dimensions.'
        },
        {
          sessionNumber: 8,
          week: 4,
          title: 'Week 4 (Days 3–5): 3D Solar Bay Base & Pillars Block-Out + Workshop Printer Check',
          durationMin: 300,
          learningGoal: 'Model the 3D Solar Charging Bay base and pillars in CAD and audit all workshop 3D printers and tools.',
          activities: [
            'Wednesday Mid-Week Fit Check: Place the truck "ghost box" inside the Solar Bay CAD file to verify the +5cm clearance on all sides.',
            'Solar Architect: Create the 3D CAD block-out of the Solar Charging Bay base plate and 4 corner pillars.',
            'Team Boss & Brand Creator: Check all workshop tools and 3D printers, track part deliveries, and write the Stage 2 project update blog with photos.'
          ],
          learnerChoices: {
            question: 'What did your Wednesday digital fit-check in CAD confirm?',
            options: [
              { id: 'opt-fit-bay', label: 'Truck Ghost Box Parks Inside Solar Bay Pillars with +5cm Clearance', description: 'Verified in 3D before modeling detailed roof angles.' },
              { id: 'opt-fit-mounts', label: 'Mounting Post Holes Line Up with Voyager Chassis Clips', description: 'Confirmed exact millimeter spacing in CAD.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit screenshots of your 3D Solar Bay base/pillars, 3D printer check log, and Stage 2 project update.',
            targetCompetencies: ['sdl-04', 'ec-03']
          },
          reflectionPrompt: 'How did your truck shell or solar bay change from your cardboard model in Week 3 to your 3D digital block-out in Week 4?',
          teacherTips: 'Verify that all Stage 2 portfolio evidence items are logged before beginning Stage 3 High-Detail CAD.'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Stage 3: Digital Prototype / CAD — High-Detail 3D Modeling, Slicing & Gate Design Review (Weeks 5–6)',
      strap: '2.5mm–3mm Shelling, Front Grill Airflow, >220mm Bed Split, 15°–30° Solar Roof & Week 6 Gate Review',
      weeks: [5, 6],
      goal: 'Model the detailed 3D Voyager truck shell (2.5mm–3mm thick walls, front grill airflow holes, wheel wells, and 2–3 piece split for 220mm x 220mm printer beds) and the 15°–30° tilted Solar Charging Bay, slice all files, and pass the Week 6 Gate Design Review!',
      tasks: [
        'Week 5 (Guide A Activity 3 Steps 2–5): Shape the Main Body (Front Hood & Grill with small airflow holes to cool the motor, Cab, Rear Truck Bed), cut Wheel Wells with cylinder shapes, hollow the inside (Shelling) to 2.5mm–3mm thick, and split into 2–3 parts with alignment pins/screw tabs if larger than 220mm x 220mm.',
        'Week 5 (Guide B Step 2): Model the Solar Bay drive-in base plate with wheel stops, 4 corner pillars, slanted roof frame at a 15°–30° angle toward the sun, and side box for the charge controller and voltage screen.',
        'Week 5: Power Specialist designs 3D-printed battery/receiver protective holders; Team Boss finalizes the Bill of Materials (BOM) in THB and print times; Brand Creator puts the team logo into 3D on the grill and bay.',
        'Week 6: Slice the truck shell (15%–20% infill, 3 wall loops), draw final truck & solar wiring diagrams, create the 3D printing schedule, and pass the Gate Design Review!'
      ],
      evidence: [
        'Screenshots of Final 3D Voyager Shell in CAD (2.5mm–3mm walls, grill airflow holes, wheel wells, mounting holes)',
        'CAD Screenshots of Battery/ESC Protective Holder, 15°–30° Solar Bay Roof & 3D Team Logo on Grill',
        'Screenshots of Sliced Parts on 3D Print Bed + 3D Printer Schedule Chart',
        'Final Truck & Solar Safety Wiring Diagrams, Final THB Bill of Materials (BOM) & Week 6 Design Review Notes'
      ],
      aiPromptStarters: [
        'Why does Guide A specify a shell wall thickness of 2.5mm to 3mm, and 15%–20% infill with 3 wall loops when slicing in PLA/PETG?',
        'Our truck shell is 320mm long, and our school 3D printer bed is 220mm x 220mm. Where is the strongest place to split the shell into 2 or 3 parts and add M3 screw tabs?'
      ],
      competencies: ['ct-05', 'ctps-06', 'sdl-05'],
      stretchCompetencies: ['ec-04'],
      sessions: [
        {
          sessionNumber: 9,
          week: 5,
          title: 'Week 5 (Days 1–2): Guide A Activity 3 — High-Detail 3D CAD Shell, Wheel Wells & 2.5mm–3mm Shelling',
          durationMin: 300,
          learningGoal: 'Model the Voyager Front Hood & Grill (with cooling holes), Cab, Rear Bed, Wheel Wells, and 2.5mm–3mm hollow walls.',
          activities: [
            'Monday Goal Setting: Read the Week 5 Driving Question: "How can we turn our simple 3D blocks into detailed, strong, and cool-looking 3D models ready for the 3D printer?"',
            'Truck Builder (Guide A Activity 3 Steps 2–4): Shape the Front Hood & Grill (with airflow holes to cool the motor), Cab, and Rear Bed; cut Wheel Wells with cylinders; hollow the inside (Shelling) so walls are 2.5mm to 3mm thick.',
            'Power Specialist: Design 3D-printed holders/boxes to keep the battery, ESC, and receiver safe from dirt.'
          ],
          learnerChoices: {
            question: 'How did you make sure your 3D truck shell is neither too fragile nor too heavy for the RC motor?',
            options: [
              { id: 'opt-wall-optimal', label: '2.5mm to 3.0mm Wall Thickness + Front Grill Airflow Holes', description: 'Strong enough to survive bumps without overloading the motor, plus airflow cooling.' },
              { id: 'opt-wall-split', label: '2–3 Piece Split (Front Hood, Cab, Rear Bed) with M3 Screw Tabs', description: 'Fits cleanly on a 220mm x 220mm 3D printer bed.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload CAD screenshots of your detailed Voyager truck shell (showing 2.5mm–3mm walls, grill holes, and wheel wells) and battery/ESC holder.',
            targetCompetencies: ['ct-05', 'ctps-06']
          },
          reflectionPrompt: 'What happens if your 3D-printed truck shell walls are thinner than 2.5mm, or thicker than 3mm?',
          teacherTips: 'Inspect every student’s CAD wall thickness with the ruler/section tool before they export STL files!'
        },
        {
          sessionNumber: 10,
          week: 5,
          title: 'Week 5 (Days 3–5): Guide B Step 2 — 15°–30° Solar Bay CAD, 3D Team Logo & THB BOM',
          durationMin: 300,
          learningGoal: 'Model the Solar Charging Bay (wheel stops, 4 pillars, 15°–30° slanted solar roof, controller box), add 3D logos, and finalize the THB BOM.',
          activities: [
            'Wednesday Mid-Week Fit Check: Verify mounting holes, >220mm split tabs, battery holder fit, and Solar Bay roof angle.',
            'Solar Architect (Guide B Step 2): Model the drive-in base plate with wheel stops, 4 corner pillars, slanted roof frame at a 15° to 30° angle toward the sun, and side box for the solar charge controller and voltage screen.',
            'Team Boss & Brand Creator: Finalize the Bill of Materials (BOM) in THB, calculate 3D print times, and put the team logo into 3D on the truck grill and bay.'
          ],
          learnerChoices: {
            question: 'What angle did your Solar Architect choose for the slanted Solar Charging Bay roof?',
            options: [
              { id: 'opt-ang-18', label: '15°–20° Low-Profile Solar Roof Tilt', description: 'Ideal for high overhead tropical sun with low wind resistance.' },
              { id: 'opt-ang-28', label: '25°–30° High-Capture Angled Solar Roof', description: 'Maximizes morning/afternoon sunlight capture and rain runoff.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit CAD screenshots of your 15°–30° Solar Bay roof, 3D team logo on the grill, and finalized THB Bill of Materials (BOM).',
            targetCompetencies: ['ct-05', 'sdl-05']
          },
          reflectionPrompt: 'Why does adding wheel stops on the Solar Bay base plate help the RC driver during charging?',
          teacherTips: 'Make sure the side box on the bay wall is sized to hold both the solar charge controller and the digital voltage screen.'
        },
        {
          sessionNumber: 11,
          week: 6,
          title: 'Week 6 (Days 1–2): 3D Slicing (15%–20% Infill, 3 Wall Loops) & Final Safety Wiring Diagrams',
          durationMin: 300,
          learningGoal: 'Slice all 3D models to fit the printer bed, draw final truck and solar wiring diagrams, and build the 3D printing schedule.',
          activities: [
            'Monday Goal Setting: Read the Week 6 Driving Question: "How do we prove our 3D designs, wiring plans, and budgets are 100% ready and safe before we start building for real?"',
            'Truck Builder (Guide A Activity 4 Step 1): Slice the truck shell pieces to fit on the 3D printer bed using PLA or PETG (15%–20% infill, 3 wall loops for strength).',
            'Power Specialist & Solar Architect: Draw the final wiring diagram (truck + charging plug) and solar wiring plan (panels to charge controller).',
            'Team Boss: Create a 3D printing schedule chart and Safety Risk Matrix so printers run smoothly during Stage 4.'
          ],
          learnerChoices: {
            question: 'How did your team slice the truck shell for the 3D printer?',
            options: [
              { id: 'opt-slice-pla', label: 'PLA Filament (15%–20% Infill, 3 Wall Loops)', description: 'Easy to print with crisp detail and low warping for custom shells.' },
              { id: 'opt-slice-petg', label: 'PETG Filament (15%–20% Infill, 3 Wall Loops)', description: 'Extra heat resistance for outdoor solar bay and high-flex fenders.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload screenshots of your sliced parts on the 3D print bed, final truck/solar wiring diagrams, and 3D printing schedule chart.',
            targetCompetencies: ['ctps-07', 'sdl-06']
          },
          reflectionPrompt: 'Why do we use 3 wall loops and 15%–20% infill instead of printing the shell 100% solid plastic?',
          teacherTips: 'Show students in the slicer how 100% infill triples the weight and print time, whereas 3 wall loops + 15%–20% infill is strong and lightweight!'
        },
        {
          sessionNumber: 12,
          week: 6,
          title: 'Week 6 (Days 3–5): Stage 3 Gate Design Review & Teacher Sign-Off',
          durationMin: 300,
          learningGoal: 'Present CAD models, sliced print files, wiring safety diagrams, and THB budgets at the Gate Design Review.',
          activities: [
            'Gate Design Review Presentation: Truck Builder presents CAD & slicer layout; Power Specialist presents truck wiring & battery safety rules; Solar Architect presents solar bay CAD & charge controller wiring; Team Boss presents THB BOM & print schedule.',
            'Brand Creator: Present team shirt/badge designs and exhibition booth sketch, and collect teacher feedback notes.',
            'Friday Show, Tell & Portfolio Upload: Complete all Stage 3 portfolio evidence items.'
          ],
          learnerChoices: {
            question: 'What feedback from the Week 6 Gate Design Review improved your build plan before Stage 4?',
            options: [
              { id: 'opt-dr-orient', label: 'Rotated Part Orientation on 3D Print Bed', description: 'Reduced support material and made screw tabs stronger.' },
              { id: 'opt-dr-switch', label: 'Moved Emergency ON/OFF Switch to Easier Reach', description: 'Made it safer to turn the truck off without removing the shell.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload your Week 6 Gate Design Review feedback notes, Safety Risk Matrix, and team booth/badge sketch.',
            targetCompetencies: ['ec-04', 'ctps-06']
          },
          reflectionPrompt: 'How did passing the Week 6 Gate Design Review give your team confidence before turning on the 3D printers?',
          teacherTips: 'Sign off on each team’s Safety Risk Matrix and slicer settings before unlocking Stage 4 3D printing.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Stage 4: Build & Integrate — 3D Printing, Voyager Chassis, Wiring & Solar Bay Assembly (Weeks 7–9)',
      strap: 'Voyager Chassis Build, Joining & Sanding 3D Shell, ESC/Servo Wiring & Magnetic/Easy-Plug Solar Dock',
      weeks: [7, 9],
      goal: '3D print all shell and bay parts, assemble the physical Voyager RC chassis (axles, shocks, wheels, motor, ESC, steering servo, ON/OFF safety switch), join/sand/paint the custom 3D truck shell, and build and wire the working Solar Charging Bay!',
      tasks: [
        'Week 7: Assemble the Voyager chassis frame, axles, shocks, and wheels; test RC remote, steering servo, and motor on the workbench; start 3D printing shell and Solar Bay parts; run daily safety checks and organize screw/part boxes.',
        'Week 8 (Guide A Activity 4 Step 2): Glue (CA superglue) or bolt (M3 bolts and nuts) the 3D-printed Voyager body panels together and sand rough edges smooth; mount motor, ESC, and steering servo onto the Voyager frame; build the Solar Charging Bay structure and attach solar panels to the roof.',
        'Week 9 (Guide A Activity 4 Step 3 & Guide B Step 3): Attach the finished truck shell onto the Voyager frame and verify wheels don’t rub when turning; install battery plug and easy-reach ON/OFF safety switch; wire solar panels to the solar charge controller and make a magnetic or easy-plug charging cable inside the bay; paint the shell and bay with team colors, stickers, logos, and headlights!'
      ],
      evidence: [
        'Week 7: Photos of Assembled Voyager Chassis, Workbench RC Remote Test Video &Organized Screw/Part Boxes',
        'Week 8: Time-Lapse/Photos of 3D Printing, Glued & Sanded Truck Body Panels & Solar Panels Mounted on Bay Roof',
        'Week 9: Photos of Clean Truck Wiring + Emergency ON/OFF Switch, Wired Solar Charge Controller + Magnetic/Easy-Plug Dock',
        'Week 9: Photos of Painted Voyager Truck Shell & Solar Bay with Logos + Signed Electrical Safety Inspection Sheet & Updated THB Receipt Log'
      ],
      aiPromptStarters: [
        'When we tested our steering servo on the workbench, turning left on the remote made the wheels turn right. How do we reverse the servo channel safely?',
        'What is the best step-by-step way to sand PLA/PETG layer lines and apply primer so our team paint and sponsor logos look smooth?'
      ],
      competencies: ['ctps-08', 'sdl-07', 'ec-05'],
      stretchCompetencies: ['lc-03'],
      sessions: [
        {
          sessionNumber: 13,
          week: 7,
          title: 'Week 7 (Days 1–2): Voyager Chassis Assembly (Axles, Shocks, Wheels) & Starting 3D Prints',
          durationMin: 300,
          learningGoal: 'Assemble the Voyager RC chassis frame, axles, shocks, and wheels safely and start the first 3D print jobs.',
          activities: [
            'Monday Goal Setting: Read the Week 7 Driving Question: "How can we work safely and neatly in the workshop as we build our Voyager chassis, test our RC electronics, and start our first 3D prints?"',
            'Truck Builder: Assemble the Voyager chassis frame, axles, shocks, and wheels, and start 3D printing the shell sections.',
            'Team Boss: Run the daily workshop safety check and organize labeled boxes for small screws, nuts, and 3D prints.'
          ],
          learnerChoices: {
            question: 'How is your team keeping small M3 screws, nuts, and 3D-printed parts organized during Week 7?',
            options: [
              { id: 'opt-org-trays', label: 'Labeled Compartment Screw Boxes & Role Trays', description: 'Every screw size and chassis sub-assembly has its own labeled slot.' },
              { id: 'opt-org-log', label: 'Daily 1:40–2:00 Clean-Up Checklist Sign-Off', description: 'Team Boss verifies all tools and parts are boxed before leaving.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your assembled Voyager chassis (axles, shocks, wheels), organized screw boxes, and first 3D prints starting.',
            targetCompetencies: ['sdl-07', 'ctps-08']
          },
          reflectionPrompt: 'Why does organizing small screws and nuts in labeled boxes make assembling the Voyager chassis twice as fast?',
          teacherTips: 'Check that shock absorbers and wheel hex nuts are tightened evenly so the chassis sits level.'
        },
        {
          sessionNumber: 14,
          week: 7,
          title: 'Week 7 (Days 3–5): Workbench RC Electronics Test & Solar Bay Frame Fabrication',
          durationMin: 300,
          learningGoal: 'Test the RC remote, steering servo, ESC, and motor on the workbench before mounting, and fabricate the Solar Bay frame.',
          activities: [
            'Wednesday Mid-Week Fit Check: Verify 3D print progress and test-fit the first printed brackets against the Voyager chassis.',
            'Power Specialist: Connect and test the RC remote, receiver, steering servo, ESC, and motor on the workbench before installing inside the truck.',
            'Solar Architect & Brand Creator: Start 3D printing/laser cutting the Solar Charging Bay frame, inspect solar panels, and film "Day 1 of Building" hardware clips and 3D printer time-lapses.'
          ],
          learnerChoices: {
            question: 'Why did the Power Specialist test the motor, ESC, and steering servo on the workbench BEFORE bolting them into the truck?',
            options: [
              { id: 'opt-bench-servo', label: 'Centers the Steering Servo Horn & Checks Motor Direction First', description: 'Prevents binding the steering linkage or wiring the motor backward.' },
              { id: 'opt-bench-bind', label: 'Confirms Radio Receiver Binding & ESC Calibration Safely', description: 'Ensures wheels are off the ground during initial radio test.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit your workbench RC remote control test video/photo and 3D printer time-lapse.',
            targetCompetencies: ['ctps-08', 'ec-05']
          },
          reflectionPrompt: 'What did your workbench electronics test confirm about how the ESC, motor, and steering servo respond to the remote?',
          teacherTips: 'Always test RC motors on the workbench with wheels detached or lifted on a stand so the truck cannot drive off the table!'
        },
        {
          sessionNumber: 15,
          week: 8,
          title: 'Week 8 (Days 1–2): Guide A Activity 4 — Joining 3D Body Panels & Mounting Drivetrain',
          durationMin: 300,
          learningGoal: 'Join the 3D-printed Voyager body sections with CA superglue or M3 bolts, sand smooth, and mount the motor, ESC, and servo.',
          activities: [
            'Monday Goal Setting: Read the Week 8 Driving Question: "How can we carefully join our 3D-printed body pieces, mount our motor, and build our solar bay roof so every part is strong and solid?"',
            'Truck Builder (Guide A Activity 4 Step 2): Glue (CA superglue) or bolt (M3 bolts and nuts) the 3D-printed Voyager body panels (Front Hood, Cab, Rear Bed) together and sand rough edges smooth.',
            'Power Specialist: Mount the motor, speed controller (ESC), and steering servo securely onto the Voyager frame.'
          ],
          learnerChoices: {
            question: 'How did your Truck Builder join the split 3D-printed shell sections together?',
            options: [
              { id: 'opt-join-bolts', label: 'M3 Bolts & Nuts Through Printed Alignment Tabs', description: 'Strong mechanical joint that can be unbolted for easy repair.' },
              { id: 'opt-join-ca', label: 'Alignment Pins + CA Superglue & Sanded Seam', description: 'Creates a smooth, flush one-piece body shell ready for primer.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your joined and sanded 3D truck body shell and the motor/ESC/servo mounted on the Voyager frame.',
            targetCompetencies: ['ctps-09', 'sdl-08']
          },
          reflectionPrompt: 'How did alignment pins or M3 screw tabs help keep your 3D-printed body pieces straight when joining them?',
          teacherTips: 'Supervise any CA superglue use and require safety glasses and ventilation during sanding.'
        },
        {
          sessionNumber: 16,
          week: 8,
          title: 'Week 8 (Days 3–5): Building the Solar Charging Bay Roof & Problem-Solving Logs',
          durationMin: 300,
          learningGoal: 'Assemble the Solar Charging Bay structure, attach the solar panels to the 15°–30° roof, and document problem solving.',
          activities: [
            'Wednesday Mid-Week Fit Check: Test-fit the joined truck shell over the mounted ESC and servo; test-park the chassis inside the Solar Bay pillars.',
            'Solar Architect: Build the Solar Charging Bay structure and attach the solar panels to the angled roof.',
            'Team Boss & Brand Creator: Count used screws and filament to stay on schedule; record teammate problem-solving interviews (written notes or school-consented video; no under-13 voice/video capture).'
          ],
          learnerChoices: {
            question: 'What building problem did your team solve during Week 8 sub-assembly?',
            options: [
              { id: 'opt-fix-wire', label: 'Routed ESC & Servo Wires Away from Spinning Drive Shaft', description: 'Used zip-ties and 3D-printed clips to keep wires safe and neat.' },
              { id: 'opt-fix-roof', label: 'Reinforced Solar Bay Corner Pillars Under Panel Weight', description: 'Added corner braces so the 15°–30° solar roof sits rock-solid.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit photos of the Solar Bay frame assembly with solar panels mounted on the roof and teammate problem-solving logs.',
            targetCompetencies: ['ec-06', 'sdl-08']
          },
          reflectionPrompt: 'How did your Wednesday Mid-Week Fit Check make sure the wires, shell, and solar bay roof all matched?',
          teacherTips: 'Check that no motor or servo wire can touch the spinning gears or axle shafts.'
        },
        {
          sessionNumber: 17,
          week: 9,
          title: 'Week 9 (Days 1–2): Guide B Step 3 — Wiring the Solar Charge Controller, Dock & ON/OFF Switch',
          durationMin: 300,
          learningGoal: 'Install the truck battery plug and easy-reach ON/OFF safety switch, and wire the solar panels to the charge controller and magnetic/easy-plug dock.',
          activities: [
            'Monday Goal Setting: Read the Week 9 Driving Question: "How do we bring the frame, painted 3D shell, wiring, and solar charger together into one complete, safe, and awesome-looking system?"',
            'Power Specialist: Install the battery plug and an easy-reach ON/OFF safety switch; keep all wires tidy.',
            'Solar Architect (Guide B Step 3): Wire the solar panels on the roof to the solar charge controller and battery charger inside the bay; make a magnetic or easy-plug charging cable that hangs inside the bay.',
            'Team Boss: Check all electrical work for safety, sign the electrical safety inspection sheet, and update the THB budget sheet.'
          ],
          learnerChoices: {
            question: 'What kind of charging dock cable did your team build inside the Solar Charging Bay?',
            options: [
              { id: 'opt-dock-mag', label: 'Magnetic Breakaway Charging Connector', description: 'Snaps onto the rear truck bed port and detaches safely if driven away.' },
              { id: 'opt-dock-plug', label: 'Color-Coded Easy-Plug Hanging Dock Cable', description: 'Keyed polarity plug hanging from the bay ceiling with voltage display.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your clean wiring inside the truck, emergency ON/OFF switch, wired solar charge controller, and signed electrical safety sheet.',
            targetCompetencies: ['ctps-09', 'sdl-09']
          },
          reflectionPrompt: 'Why must the Team Boss and Power Specialist inspect polarity (red positive / black negative) before plugging in the battery or solar panel?',
          teacherTips: 'Require a mandatory polarity and fuse/switch safety check before any battery is connected to the ESC or solar charger.'
        },
        {
          sessionNumber: 18,
          week: 9,
          title: 'Week 9 (Days 3–5): Final Shell Mounting, Painting, Team Logos & Headlights',
          durationMin: 300,
          learningGoal: 'Paint the truck shell and solar bay with team colors, logos, stickers, and headlights, and mount the shell on the Voyager frame.',
          activities: [
            'Truck Builder: Attach the finished truck shell onto the Voyager frame and verify that wheels don’t rub when turning or bouncing.',
            'Brand Creator (Guide A Activity 4 Step 3): Spray with primer, paint the truck shell and solar bay in team colors, and add team stickers, 3D logos, and headlights!',
            'Friday Show, Tell & Portfolio Upload: Complete all Stage 4 portfolio evidence items.'
          ],
          learnerChoices: {
            question: 'How did your team finish the visual branding of your Voyager RC truck and Solar Charging Bay?',
            options: [
              { id: 'opt-paint-team', label: 'Two-Tone Primer & Paint + 3D Printed Grill Logo', description: 'Custom team livery matching the Solar Charging Bay roof sign.' },
              { id: 'opt-paint-lights', label: 'High-Visibility Off-Road Stickers + LED Headlights', description: 'Ready for track testing and Showcase Day demonstrations.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your painted Voyager truck shell mounted on the frame and your completed Solar Charging Bay with team logos.',
            targetCompetencies: ['ec-07', 'ct-06']
          },
          reflectionPrompt: 'How did it feel to see the Voyager frame, painted 3D shell, wiring, and Solar Charging Bay come together into one working system?',
          teacherTips: 'Celebrate completing Stage 4 Build & Integrate! Next week the trucks hit the outdoor test track and sunlight.'
        }
      ]
    },
    {
      id: 'test',
      title: 'Stage 5A: Test & Iterate — Live Track Driving, Sunlight Charging & Upgrades (Weeks 10–11)',
      strap: 'First Drive Test Over Bumps, First Solar Charge Test, Lap Times & Week 11 Upgrades',
      weeks: [10, 11],
      goal: 'Drive the Voyager RC truck over real bumps on the test track, park in the Solar Charging Bay outside in the sun to measure charging power, log stopwatch lap times and motor/battery temperatures, and use Week 10 data to fix weak parts and optimize solar tilt in Week 11!',
      tasks: [
        'Week 10: First Drive Test! Drive the Voyager truck over real bumps and check steering, suspension, and how well the 3D shell holds up.',
        'Week 10: Check if the motor or battery gets hot during driving and measure battery life; run the test track safely with a stopwatch to record lap times.',
        'Week 10: First Solar Charge Test! Park the truck in the Solar Bay outside in the sun and record charging voltage, current, and charging time; take action photos and slow-motion videos.',
        'Week 11: Fix any loose screws or weak 3D-printed shell parts and adjust wheel alignment; adjust remote control settings so the truck drives smoothly and saves battery power.',
        'Week 11: Tilt or turn the solar bay roof to catch the most sunlight and charge faster; finish the final THB budget report (Planned vs. Actual); make posters, flyers, and a 2-minute highlight video for the Showcase Booth.'
      ],
      evidence: [
        'Week 10: Video/Photos of Truck Driving Over Bumps & Turning + Track Test Lap Time Log',
        'Week 10: Motor/Battery Temperature & Battery Life Data Table + Photo of Solar Bay Voltage Screen Charging in the Sun',
        'Week 11: Before/After Photos of Shell Fixes & Wheel Alignment Upgrades + Graph of Solar Charging Speed After Roof Tilt Adjustments',
        'Week 11: Final THB Budget Report (Planned vs. Actual), Final Electrical Schematic, Showcase Poster/Flyer & 2-Minute Highlight Video'
      ],
      aiPromptStarters: [
        'During our Week 10 First Drive Test, our truck pulled slightly to the left and the motor got warm after 8 minutes. What adjustments should we make in Week 11?',
        'Here are our solar charging watts at 15°, 22°, and 30° roof tilt angles: [paste data]. Help us graph the solar charging speed improvement!'
      ],
      competencies: ['ctps-10', 'ctps-11', 'sdl-10'],
      stretchCompetencies: ['ec-08'],
      sessions: [
        {
          sessionNumber: 19,
          week: 10,
          title: 'Week 10 (Days 1–2): First Drive Test — Bumps, Steering, Suspension & Lap Times',
          durationMin: 300,
          learningGoal: 'Run the First Drive Test over real bumps, measure stopwatch lap times, and check steering, suspension, shell durability, and motor/battery heat.',
          activities: [
            'Monday Goal Setting: Read the Week 10 Driving Question: "What happens when we drive our Voyager truck over real bumps and plug it into the solar bay outside—and what data can we collect?"',
            'Truck Builder: First Drive Test! Check steering, suspension, and how well the 3D shell holds up over bumps.',
            'Power Specialist & Team Boss: Check if the motor or battery gets hot during driving, measure battery life, and use a stopwatch to record test track lap times.'
          ],
          learnerChoices: {
            question: 'What did your team discover during the Week 10 First Drive Test over bumps?',
            options: [
              { id: 'opt-test-trim', label: 'Steering Trim / Wheel Alignment Needed Fine-Tuning', description: 'Noted slight drift on straightaways to fix in Week 11.' },
              { id: 'opt-test-mount', label: 'One Body Clip or Fender Bracket Rattled Over Bumps', description: 'Marked exact screw tab to reinforce with a thicker washer/bracket.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your Track Test Lap Time Log, Motor/Battery Temperature & Battery Life Data Table, and action photos/video of driving over bumps.',
            targetCompetencies: ['ctps-10', 'sdl-10']
          },
          reflectionPrompt: 'What happens when we drive our Voyager truck over real bumps, and why is real track data better than guessing?',
          teacherTips: 'Keep a clear safety barrier around the test track and have the Team Boss manage stopwatch timing.'
        },
        {
          sessionNumber: 20,
          week: 10,
          title: 'Week 10 (Days 3–5): First Solar Charge Test Outdoors in the Sun',
          durationMin: 300,
          learningGoal: 'Park the Voyager truck in the Solar Charging Bay outdoors in the sun and measure live solar charging voltage, current, and time.',
          activities: [
            'Wednesday Mid-Week Fit Check: Review track drive notes and inspect the charging dock plug before outdoor solar testing.',
            'Solar Architect: First Solar Charge Test! Park the truck in the bay outside in the sun and check charging power on the voltage/current screen.',
            'Brand Creator: Take action photos and slow-motion videos of the truck driving and parking in the Solar Charging Bay.'
          ],
          learnerChoices: {
            question: 'What data did your Solar Architect record during the First Solar Charge Test?',
            options: [
              { id: 'opt-sol-volts', label: 'Solar Panel Input Voltage (V) & Charging Current (A) Over Time', description: 'Photographed the voltage screen charging in the sun every 10 minutes.' },
              { id: 'opt-sol-park', label: 'Parking Clearance & Charging Plug Docking Speed', description: 'Timed how smoothly the driver parked against the wheel stops and plugged in.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Submit a photo of your voltage screen charging in the sun and your First Solar Charge Test data log.',
            targetCompetencies: ['ctps-11', 'ct-07']
          },
          reflectionPrompt: 'How well did your Solar Charging Bay charge the truck battery on the first try, and how can you catch even more sunlight next week?',
          teacherTips: 'Have students record both shaded/cloudy and direct-sun readings so they can explain real-world solar variability at Showcase Day.'
        },
        {
          sessionNumber: 21,
          week: 11,
          title: 'Week 11 (Days 1–2): Iterate & Upgrade — Fixing Shell/Alignment & Optimizing Solar Roof Tilt',
          durationMin: 300,
          learningGoal: 'Use Week 10 test results to fix loose screws or weak 3D shell parts, adjust wheel alignment and RC settings, and tilt the solar bay roof for faster charging.',
          activities: [
            'Monday Goal Setting: Read the Week 11 Driving Question: "How can we use our Week 10 test results to fix weak parts, drive smoother, and catch even more sunlight before Showcase Day?"',
            'Truck Builder: Fix any loose screws or weak 3D-printed shell parts and adjust wheel alignment.',
            'Power Specialist: Adjust remote control trim/throttle settings so the truck drives smoothly and saves battery power.',
            'Solar Architect: Tilt or turn the solar bay roof (15°–30°) to catch the most sunlight and graph the faster charging speed.'
          ],
          learnerChoices: {
            question: 'Which Week 11 iteration gave your team the biggest performance improvement?',
            options: [
              { id: 'opt-iter-solar', label: 'Tilting & Aiming the Solar Bay Roof Toward Peak Sun', description: 'Increased solar charging watts and shortened battery recharge time.' },
              { id: 'opt-iter-chassis', label: 'Wheel Alignment + RC Throttle Trim + Shell Reinforcement', description: 'Improved lap time over bumps and reduced motor current draw.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload Before/After photos of your shell/alignment upgrades and your Graph of Solar Charging Speed after roof tilt adjustments.',
            targetCompetencies: ['ctps-11', 'ctps-12']
          },
          reflectionPrompt: 'Describe one thing that broke, rubbed, did not fit, or did not work during Week 10 testing. How did you fix it in Week 11?',
          teacherTips: 'Emphasize that every real engineer iterates—Before/After photos of a fixed mistake earn Proficient (3) and Mastery (4) on the rubric!'
        },
        {
          sessionNumber: 22,
          week: 11,
          title: 'Week 11 (Days 3–5): Final THB Budget Report, Showcase Posters & 2-Minute Highlight Video',
          durationMin: 300,
          learningGoal: 'Complete the Final THB Budget Report (Planned vs. Actual), final electrical schematic, posters, flyers, and 2-minute highlight video.',
          activities: [
            'Team Boss: Finish the final budget report in Thai Baht (Planned vs. Actual THB) and check that all workshop tools are returned.',
            'Power Specialist: Finalize the clean electrical schematic for the team portfolio.',
            'Brand Creator: Make posters, flyers, and a 2-minute highlight video for the Showcase Booth.'
          ],
          learnerChoices: {
            question: 'What story does your team’s 2-minute highlight video and poster tell visitors?',
            options: [
              { id: 'opt-vid-evolution', label: 'From Calipers & Cardboard (Weeks 1–3) to 3D CAD & Solar Truck (Weeks 5–11)', description: 'Shows the complete 12-week engineering journey and Before/After fixes.' },
              { id: 'opt-vid-data', label: 'Live Track Action + Solar Charging Data & THB Budget Breakdown', description: 'Proves with numbers how the truck and Solar Bay work together.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Submit your Final THB Budget Report (Planned vs. Actual), Final Electrical Schematic, Showcase poster/flyer, and 2-minute highlight video.',
            targetCompetencies: ['ec-08', 'sdl-10']
          },
          reflectionPrompt: 'How did your team save money (THB), avoid wasting 3D filament, or capture more solar energy over the 11 weeks?',
          teacherTips: 'Verify that every team has their truck battery charged and their showcase table checklist ready for Week 12.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Stage 5B: Public Showcase Day & Final 12-Question MTC Portfolio Reflection (Week 12)',
      strap: 'Live RC & Solar Bay Demonstration, 7-Competency WeLearn/MTC Rubric & 12-Question MTC Reflection',
      weeks: [12, 12],
      goal: 'Proudly share your team’s story at Public Showcase Day, demonstrate your 3D-printed Voyager RC truck and live Solar Charging Bay data to visitors, and complete the Final 12-Question MTC Portfolio Reflection and 7-Competency WeLearn/MTC assessment!',
      tasks: [
        'Week 12 Public Showcase Day Role Demonstrations: Truck Builder shows how the Voyager chassis and 3D-printed shell work; Power Specialist demonstrates RC controls and electrical safety system; Solar Architect shows live data of the Solar Bay charging the truck battery; Team Boss manages the team table, schedule, and final project checklist; Brand Creator welcomes visitors, presents the team pitch, and hands out flyers.',
        'Complete the Final 12-Question MTC Portfolio Reflection across all 4 parts: Part 1 (Empathize & Define Q1–Q3), Part 2 (Ideate & Prototype Q4–Q5), Part 3 (Build, Test & Iterate Q6–Q7), and Part 4 (WeLearn Future Skills & MTC Competency Claim Q8–Q12).',
        'Self-assess and review coach ratings from Beginning (1) to Mastery (4) across the 7 WeLearn Future Skills & MTC Competencies.'
      ],
      evidence: [
        'Photos of Team Presenting & Live RC Truck / Solar Bay Demonstration at Week 12 Public Showcase Day',
        'Completed Role-by-Role Stage 1–5 MTC Digital Portfolio',
        'Completed Final 12-Question MTC Portfolio Reflection (Parts 1–4, Questions 1–12)',
        '7-Competency WeLearn & MTC Rubric Evaluation (Levels 1–4: Beginning to Mastery)'
      ],
      aiPromptStarters: [
        'Help our 5 team members practice a clear, ESL-friendly 3-minute Showcase Day pitch where each role explains their part of the Voyager RC truck and Solar Charging Bay!',
        'Ask me practice visitor Q&A questions to help me prepare for my Final 12-Question MTC Portfolio Reflection!'
      ],
      competencies: ['ec-09', 'sdl-11', 'sea-03'],
      stretchCompetencies: ['ent-01'],
      sessions: [
        {
          sessionNumber: 23,
          week: 12,
          title: 'Week 12 (Days 1–3): Public Showcase Day Rehearsal & Final 12-Question MTC Reflection',
          durationMin: 300,
          learningGoal: 'Rehearse each role’s Showcase Day demonstration and complete the Final 12-Question MTC Portfolio Reflection.',
          activities: [
            'Monday Goal Setting: Read the Week 12 Driving Question: "How can we proudly share our story, demonstrate our solar-powered RC truck live, and show visitors everything we learned?"',
            'Practice the 5-Role Showcase Booth flow: welcoming visitors, explaining the cardboard-to-CAD evolution, demonstrating the ON/OFF safety switch and RC controls, and showing live Solar Bay voltage data.',
            'Complete the Final 12-Question MTC Portfolio Reflection (Questions 1–12 across Parts 1–4; safeguarding note: under-13s complete written or illustrated reflections; older learners may use written or school-consented offline media).'
          ],
          learnerChoices: {
            question: 'Which two WeLearn/MTC competencies are you claiming at "Proficient (3)" or "Mastery (4)" in Question 11 of your reflection?',
            options: [
              { id: 'opt-mtc-cad-prob', label: 'Competency 1 (Problem Solving) & Competency 5 (Digital/CAD Literacy)', description: 'Used calipers, 3D CAD, and test data to build and fix the truck/bay.' },
              { id: 'opt-mtc-team-sust', label: 'Competency 3 (Collaboration) & Competency 7 (Sustainability/Solar)', description: 'Shared measurements in Fit Checks and optimized net solar charging.' },
              { id: 'opt-mtc-comm-pm', label: 'Competency 4 (Communication) & Competency 6 (Project Management/THB)', description: 'Led Showcase presentations and managed the 120 hours and THB budget.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your completed Final 12-Question MTC Portfolio Reflection (Questions 1–12) and self-selected WeLearn/MTC rubric levels.',
            targetCompetencies: ['sdl-11', 'ec-09']
          },
          reflectionPrompt: 'Question 12 (Next Iteration): If you had 2 more weeks and 500 THB more in your budget, what would you upgrade on your Voyager RC truck or Solar Charging Bay?',
          teacherTips: 'Give ESL learners the structured sentence frames from Section 7.B and 7.C so every student can articulate their technical growth with pride.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Week 12 (Days 4–5): Public Showcase Day — Live Voyager RC Truck & Solar Bay Expo!',
          durationMin: 300,
          learningGoal: 'Demonstrate the solar-powered Voyager RC truck live to the school community and celebrate 120 hours of engineering.',
          activities: [
            'Public Showcase Day Live Demonstration: (1) Truck Builder shows the Voyager chassis and 3D-printed shell, (2) Power Specialist demonstrates RC controls and electrical safety system, (3) Solar Architect shows live data of the Solar Bay charging the truck battery, (4) Team Boss manages the team table, schedule, and final checklist, (5) Brand Creator welcomes visitors, presents the team pitch, and hands out flyers.',
            'Final MTC Portfolio Sign-Off: Log visitor feedback and celebrate completing Project Voyager!'
          ],
          learnerChoices: {
            question: 'What was visitors’ favorite part of your live Public Showcase Day demonstration?',
            options: [
              { id: 'opt-show-drive', label: 'Driving the Custom 3D-Printed Voyager Truck Over the Obstacle Ramp', description: 'Showed off smooth suspension, zero tire rub, and tough 2.5mm–3mm shell.' },
              { id: 'opt-show-solar', label: 'Parking Against the Wheel Stops & Watching Live Solar Charging Watts', description: 'Demonstrated real sunlight charging the RC battery through the dock.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your team presenting at Public Showcase Day and visitor feedback notes.',
            targetCompetencies: ['ec-09', 'sea-03']
          },
          reflectionPrompt: 'How can we proudly share our story, demonstrate our solar-powered RC truck live, and show visitors everything we learned?',
          teacherTips: 'Award Project Voyager Showcase Certificates and celebrate how every role contributed to a complete mechanical, electrical, and solar engineering system!'
        }
      ]
    }
  ]
};
