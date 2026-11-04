import { PROGRAM_CATALOGUE, programById } from '../../features/pbl/content/programCatalogue.js';
import { CALENDAR_REFERENCE } from '../../features/school/calendarReference.js';

let offeringsStore = [
  {
    id: 'offering-sustainable-futures',
    programId: 'sustainable-futures',
    title: 'Sustainable Futures',
    semester: 1,
    yearId: '2026-2027',
    classIds: ['class-wpr-11a', 'class-wpr-12a'],
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
    classIds: ['class-wpr-11a', 'class-wpr-12a'],
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
    classIds: ['class-wpr-11a', 'class-wpr-12a'],
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
    classId: 'class-wpr-11a',
    outcome: 'Identify campus energy consumption and waste patterns.',
    instructions: 'Conduct a baseline energy audit of selected campus spaces.',
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
    classId: 'class-wpr-11a',
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
    classId: 'class-wpr-11a',
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
    dueDate: '2026-10-15',
    state: 'active',
    target: 'Explain one energy estimate using evidence.',
    acknowledged: false,
    classId: 'class-wpr-11a',
    revision: 1,
    createdAt: new Date().toISOString()
  }
];

let academicStore = [
  {
    id: 'acad-1',
    provider: 'cambrilearn',
    course: 'Mathematics',
    curriculum: 'IGCSE Extended',
    completed: 12,
    total: 20,
    dataAsOf: '2026-10-01',
    sourceMethod: 'coach_recorded',
    classId: 'class-wpr-11a'
  }
];

let supportRequestsStore = [
  {
    id: 'req-demo-1',
    learnerUid: 'student-jordan',
    classId: 'class-wpr-11a',
    category: 'first_step',
    note: 'Audio explanation: how insulation changes energy demand.',
    status: 'submitted',
    revision: 1,
    createdAt: new Date().toISOString()
  }
];

export function handleSchoolFallback(method, path, body, callerRole = 'student') {
  if (method !== 'GET') return null;

  if (path.includes('/learning-context')) {
    return {
      role: callerRole || 'student',
      schools: [
        { id: 'school-main', name: 'WeLearn School Workspace', timezone: 'Asia/Bangkok' }
      ],
      classes: [
        { id: 'class-wpr-11a', name: 'Higher Secondary A', cohortId: 'cohort-higher-secondary', schoolId: 'school-main' },
        { id: 'class-wpr-12a', name: 'Higher Secondary B', cohortId: 'cohort-higher-secondary', schoolId: 'school-main' }
      ],
      providerStatus: { cambrilearn: 'access_pending', edmentum: 'access_pending', acellus: 'access_pending' }
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
    return { items: academicStore, providerStatus: { cambrilearn: 'access_pending', edmentum: 'access_pending', acellus: 'access_pending' } };
  }

  if (path.includes('/calendar-events') || path.includes('/calendar-reference')) {
    return { items: CALENDAR_REFERENCE || [] };
  }

  if (path.includes('/learners')) {
    return {
      items: [
        { id: 'student-alex', displayName: 'Alex', classIds: ['class-wpr-11a'] },
        { id: 'student-jordan', displayName: 'Jordan', classIds: ['class-wpr-11a'] }
      ]
    };
  }

  if (path.includes('/support-requests')) {
    return { items: supportRequestsStore };
  }

  if (path.includes('/learner-preferences')) {
    return {
      displayMode: 'explore',
      preferredEvidenceFormats: ['Written', 'Audio'],
      quietWorkspace: true,
      interests: ['Game design', 'Energy systems']
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
          lessonsSubmitted: 1,
          publishedLessons: 1,
          lessonsReviewed: 1,
          revisionsRequested: 0
        }
      ]
    };
  }

  return null;
}
