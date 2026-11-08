import { PROGRAM_CATALOGUE, programById } from '../../features/pbl/content/programCatalogue.js';
import { CALENDAR_REFERENCE } from '../../features/school/calendarReference.js';

let offeringsStore = [
  {
    id: 'offering-sustainable-futures',
    programId: 'sustainable-futures',
    title: 'Sustainable Futures',
    semester: 1,
    yearId: '2026-2027',
    classIds: ['class_yr9_climate', 'class_yr12_eng', 'class-wpr-11a', 'class-wpr-12a'],
    status: 'published',
    revision: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offering-net-zero-microgrid',
    programId: 'net-zero-microgrid',
    title: 'District Net-Zero Resilient Microgrid',
    semester: 2,
    yearId: '2026-2027',
    classIds: ['class_yr9_climate', 'class_yr12_eng', 'class-wpr-11a', 'class-wpr-12a'],
    status: 'published',
    revision: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offering-project-arachne',
    programId: 'project-arachne',
    title: 'Project Arachne — Engineering the Sesame Quadruped',
    semester: 3,
    yearId: '2026-2027',
    classIds: ['class_yr9_climate', 'class_yr12_eng', 'class-wpr-11a', 'class-wpr-12a'],
    status: 'published',
    revision: 1,
    createdAt: new Date().toISOString()
  }
];

let lessonsStore = [
  {
    id: 'lesson-sf-1',
    offeringId: 'offering-sustainable-futures',
    programId: 'sustainable-futures',
    title: 'Campus Energy & Waste Audit',
    milestoneId: 'phase-1',
    status: 'published',
    revision: 1,
    classId: 'class_yr9_climate',
    outcome: 'Identify campus energy consumption and waste patterns.',
    instructions: 'Conduct a baseline energy audit of selected campus spaces.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-sf-2',
    offeringId: 'offering-sustainable-futures',
    programId: 'sustainable-futures',
    title: 'Passive Solar & Shading Design Test',
    milestoneId: 'phase-2',
    status: 'published',
    revision: 1,
    classId: 'class_yr9_climate',
    outcome: 'Model solar incident angles and test reflective shading materials.',
    instructions: 'Build a scale model of the southern-facing facade and record temperature drops.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-mg-1',
    offeringId: 'offering-net-zero-microgrid',
    programId: 'net-zero-microgrid',
    title: 'Find the campus energy hotspots',
    milestoneId: 'phase-1',
    status: 'published',
    revision: 1,
    classId: 'class_yr9_climate',
    outcome: 'Record 3 electricity users and estimate consumption.',
    instructions: 'Choose a room or outdoor space. Record three items using electricity.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lesson-pa-1',
    offeringId: 'offering-project-arachne',
    programId: 'project-arachne',
    title: 'Biomimetic Kinematics & Leg Design',
    milestoneId: 'phase-1',
    status: 'published',
    revision: 1,
    classId: 'class_yr12_eng',
    outcome: 'Design quadruped leg linkages for terrain stability.',
    instructions: 'Model 3-DOF linkage dimensions and test payload balance.',
    createdAt: new Date().toISOString()
  }
];

let goalsStore = [
  {
    id: 'goal-1',
    title: 'Explain one energy estimate using evidence.',
    domain: 'pbl',
    dueDate: '2026-11-20',
    state: 'active',
    target: 'Explain one energy estimate using recorded sensor evidence and thermal image logs.',
    acknowledged: true,
    classId: 'class_yr9_climate',
    revision: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'goal-2',
    title: 'Solar Car Sprint Challenge Trial',
    domain: 'steam',
    dueDate: '2026-11-25',
    state: 'active',
    target: 'Optimize drivetrain gear ratios to achieve sub-4.0s sprint time with under 250g chassis weight.',
    acknowledged: false,
    classId: 'class_yr9_climate',
    revision: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'goal-3',
    title: 'IGCSE Mathematics: Calculus & Rates of Change',
    domain: 'academic',
    dueDate: '2026-11-30',
    state: 'active',
    target: 'Complete Unit 4 rate of change problem sets and pass formative checkpoint.',
    acknowledged: true,
    classId: 'class_yr12_eng',
    revision: 1,
    createdAt: new Date().toISOString()
  }
];

let academicStore = [
  {
    id: 'acad-1',
    provider: 'cambrilearn',
    course: 'Mathematics (IGCSE Extended)',
    curriculum: 'Cambridge International',
    completed: 14,
    total: 20,
    dataAsOf: '2026-11-01',
    sourceMethod: 'coach_recorded',
    classId: 'class_yr9_climate'
  },
  {
    id: 'acad-2',
    provider: 'cambrilearn',
    course: 'Biology (IGCSE)',
    curriculum: 'Cambridge International',
    completed: 11,
    total: 16,
    dataAsOf: '2026-11-03',
    sourceMethod: 'coach_recorded',
    classId: 'class_yr9_climate'
  },
  {
    id: 'acad-3',
    provider: 'edmentum',
    course: 'AP Environmental Science',
    curriculum: 'Edmentum Courseware',
    completed: 8,
    total: 12,
    dataAsOf: '2026-11-04',
    sourceMethod: 'coach_recorded',
    classId: 'class_yr12_eng'
  },
  {
    id: 'acad-4',
    provider: 'edmentum',
    course: 'Physics: Mechanics & Kinematics',
    curriculum: 'Edmentum Courseware',
    completed: 15,
    total: 18,
    dataAsOf: '2026-11-05',
    sourceMethod: 'coach_recorded',
    classId: 'class_yr12_eng'
  }
];

let supportRequestsStore = [
  {
    id: 'req-demo-1',
    learnerUid: 'student-alex',
    classId: 'class_yr9_climate',
    category: 'first_step',
    note: 'Audio explanation: how insulation changes energy demand in passive housing.',
    status: 'submitted',
    revision: 1,
    createdAt: new Date().toISOString()
  }
];

export function handleSchoolFallback(method, path, body, callerRole = 'student') {
  // Support mutations for dev/offline testing
  if (method === 'POST') {
    if (path.includes('/learner-goals')) {
      const newGoal = {
        id: `goal-${Date.now()}`,
        title: body?.target?.slice(0, 40) || 'New learning goal',
        domain: body?.domain || 'pbl',
        dueDate: body?.dueDate || '2026-12-01',
        state: 'active',
        target: body?.target || '',
        acknowledged: false,
        classId: body?.classId || 'class_yr9_climate',
        revision: 1,
        createdAt: new Date().toISOString()
      };
      goalsStore.push(newGoal);
      return newGoal;
    }

    if (path.includes('/academic-progress')) {
      const newEntry = {
        id: `acad-${Date.now()}`,
        provider: body?.provider || 'cambrilearn',
        course: body?.course || 'General Science',
        curriculum: body?.curriculum || 'Standard',
        completed: Number(body?.completed) || 0,
        total: Number(body?.total) || 10,
        dataAsOf: body?.dataAsOf || new Date().toISOString().slice(0, 10),
        sourceMethod: 'coach_recorded',
        classId: body?.classId || 'class_yr9_climate',
        importedAt: new Date().toISOString()
      };
      academicStore.push(newEntry);
      return newEntry;
    }

    if (path.includes('/program-offerings') && path.includes('/publish')) {
      const off = offeringsStore.find(o => path.includes(o.id));
      if (off) {
        off.status = 'published';
        off.revision = (off.revision || 1) + 1;
        return off;
      }
      return { status: 'published', revision: 2 };
    }

    if (path.includes('/program-offerings') && path.includes('/codes')) {
      return { id: `code-${Date.now()}`, code: 'SPARK-2026', days: 30 };
    }

    if (path.includes('/program-offerings') && !path.includes('/lessons')) {
      const newOff = {
        id: `offering-${Date.now()}`,
        programId: body?.programId || 'sustainable-futures',
        title: body?.programId || 'New Program Offering',
        semester: 1,
        yearId: body?.yearId || '2026-2027',
        classIds: body?.classIds || ['class_yr9_climate'],
        status: 'published',
        revision: 1,
        createdAt: new Date().toISOString()
      };
      offeringsStore.push(newOff);
      return newOff;
    }

    if (path.includes('/lessons') && path.includes('/publish')) {
      const lesson = lessonsStore.find(l => path.includes(l.id));
      if (lesson) {
        lesson.status = 'published';
        lesson.revision = (lesson.revision || 1) + 1;
        return lesson;
      }
      return { status: 'published', revision: 2 };
    }

    if (path.includes('/lessons')) {
      const newLesson = {
        id: `lesson-${Date.now()}`,
        title: body?.title || 'New Guided Lesson',
        outcome: body?.outcome || '',
        instructions: body?.instructions || '',
        status: 'draft',
        revision: 1,
        milestoneId: body?.milestoneId || 'phase-1',
        classId: body?.classId || 'class_yr9_climate',
        attachments: body?.attachments || [],
        createdAt: new Date().toISOString()
      };
      lessonsStore.push(newLesson);
      return newLesson;
    }

    return { success: true };
  }

  if (method === 'PATCH') {
    if (path.includes('/learner-goals/')) {
      const id = path.split('/').pop();
      const goal = goalsStore.find(g => g.id === id);
      if (goal) {
        if (body?.state) goal.state = body.state;
        if (body?.revision !== undefined) goal.revision = body.revision + 1;
        return goal;
      }
      return { id, ...body, revision: 2 };
    }

    if (path.includes('/lessons/')) {
      const id = path.split('/').pop();
      const lesson = lessonsStore.find(l => l.id === id);
      if (lesson) {
        Object.assign(lesson, body);
        lesson.revision = (lesson.revision || 1) + 1;
        return lesson;
      }
      return { id, ...body, revision: 2 };
    }

    return { success: true };
  }

  if (method === 'DELETE') {
    return { success: true };
  }

  // GET requests
  if (method === 'GET') {
    if (path.includes('/learning-context')) {
      const isStaff = ['teacher', 'coach', 'admin', 'supervisor'].includes(callerRole);
      return {
        role: isStaff ? 'teacher' : (callerRole || 'teacher'),
        schools: [
          { id: 'sch-bkk', name: 'Bangkok Campus (Main)', timezone: 'Asia/Bangkok' },
          { id: 'school-main', name: 'WeLearn School Workspace', timezone: 'Asia/Bangkok' }
        ],
        classes: [
          { id: 'class_yr9_climate', name: 'Lower Secondary A (Year 9)', cohortId: 'cohort-lower-secondary', schoolId: 'sch-bkk' },
          { id: 'class_yr12_eng', name: 'Higher Secondary A (Year 12)', cohortId: 'cohort-higher-secondary', schoolId: 'sch-bkk' },
          { id: 'class-wpr-11a', name: 'Higher Secondary A', cohortId: 'cohort-higher-secondary', schoolId: 'school-main' },
          { id: 'class-wpr-12a', name: 'Higher Secondary B', cohortId: 'cohort-higher-secondary', schoolId: 'school-main' }
        ],
        providerStatus: { cambrilearn: 'active', edmentum: 'active' }
      };
    }

    if (path.includes('/submissions')) {
      return { items: [] };
    }

    if (path.includes('/program-offerings') && !path.includes('/lessons') && !path.includes('/codes')) {
      return { items: offeringsStore };
    }

    if (path.includes('/lessons')) {
      return { items: lessonsStore };
    }

    if (path.includes('/learner-goals')) {
      return { items: goalsStore };
    }

    if (path.includes('/academic-progress')) {
      return { items: academicStore, providerStatus: { cambrilearn: 'active', edmentum: 'active' } };
    }

    if (path.includes('/calendar-events') || path.includes('/calendar-reference')) {
      return { items: CALENDAR_REFERENCE || [] };
    }

    if (path.includes('/learners')) {
      return {
        items: [
          { id: 'student-alex', displayName: 'Alex Chen', classIds: ['class_yr9_climate', 'class-wpr-11a'] },
          { id: 'student-jordan', displayName: 'Jordan Taylor', classIds: ['class_yr9_climate', 'class-wpr-11a'] },
          { id: 'student-mia', displayName: 'Mia Chen', classIds: ['class_yr9_climate', 'class-wpr-11a'] },
          { id: 'student-leo', displayName: 'Leo Martins', classIds: ['class_yr9_climate', 'class-wpr-11a'] },
          { id: 'student-noor', displayName: 'Noor Haddad', classIds: ['class_yr9_climate', 'class-wpr-11a'] },
          { id: 'student-tom', displayName: 'Tom Becker', classIds: ['class_yr12_eng', 'class-wpr-12a'] }
        ]
      };
    }

    if (path.includes('/support-requests')) {
      return { items: supportRequestsStore };
    }

    if (path.includes('/learner-preferences')) {
      return {
        displayMode: 'explore',
        preferredEvidenceFormats: ['Written', 'Audio', 'Visual CAD'],
        quietWorkspace: true,
        interests: ['Sustainable Energy', 'Robotics', 'Biomimicry']
      };
    }

    if (path.includes('/learner-program-summaries')) {
      return {
        items: [
          {
            id: 'summary-sf',
            programId: 'sustainable-futures',
            title: 'Sustainable Futures',
            semester: 1,
            yearId: '2026-2027',
            lessonsSubmitted: 2,
            publishedLessons: 2,
            lessonsReviewed: 2,
            revisionsRequested: 0
          }
        ]
      };
    }
  }

  return null;
}
