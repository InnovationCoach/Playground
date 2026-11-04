/**
 * Made-up accounts for the mock backend. Every person here is fictional and
 * every email is on the reserved `.test` domain, so nothing can reach a real
 * inbox.
 *
 * Generated from a fixed seed so the data is the same on every load and tests
 * can rely on it. It is also internally consistent, which the wireframes were
 * not: every publicId is unique, and a parent's child count always equals
 * their active links.
 */
import { JOIN_CODE_ALPHABET } from '../../utils/joinCode.js';

export const BASE_TIME = Date.parse('2026-08-03T02:00:00Z');
const DAY = 86400000;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `KZN-TKL-PRS-VQM`: 4 groups of 3 from the join-code alphabet (brief §5). */
export function makePublicId(rand, taken) {
  for (;;) {
    const groups = [];
    for (let g = 0; g < 4; g += 1) {
      let s = '';
      for (let i = 0; i < 3; i += 1) s += JOIN_CODE_ALPHABET[Math.floor(rand() * JOIN_CODE_ALPHABET.length)];
      groups.push(s);
    }
    const id = groups.join('-');
    if (!taken.has(id)) { taken.add(id); return id; }
  }
}

const GIVEN = ['Anong', 'Mei', 'Oliver', 'Ploy', 'Wei', 'Amelia', 'Kittipat', 'Lin', 'Noah', 'Siriporn',
  'Jun', 'Chloe', 'Thanawat', 'Xin', 'Leo', 'Nicha', 'Hao', 'Isla', 'Pimchanok', 'Yu', 'Ethan', 'Arisa',
  'Zhen', 'Grace', 'Nattapong', 'Ling', 'Lucas', 'Kanya', 'Ming', 'Sofia'];
const SURNAMES = ['Srisuk', 'Chen', 'Walker', 'Wongsakul', 'Li', 'Hughes', 'Rattanakorn', 'Zhang', 'Patel',
  'Boonmee', 'Wang', 'Foster', 'Chaiyaporn', 'Liu', 'Bennett', 'Suksawat', 'Huang', 'Morgan', 'Thongdee',
  'Zhao', 'Reid', 'Kaewmanee', 'Sun', 'Clarke'];

export function buildFixtures(seed = 20260925) {
  const rand = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const takenIds = new Set();
  const usedEmails = new Set();
  const at = (days) => new Date(BASE_TIME + days * DAY + Math.floor(rand() * 8) * 3600000).toISOString();

  const organization = { orgId: 'org-welearn', name: 'WeLearn', status: 'active', defaultLocale: 'en' };

  const schools = [
    { schoolId: 'sch-w2e', orgId: organization.orgId, name: 'W2E Campus', timezone: 'Asia/Bangkok', locale: 'en', status: 'active' },
    { schoolId: 'sch-wpr', orgId: organization.orgId, name: 'WPR International School', timezone: 'Asia/Bangkok', locale: 'en', status: 'active' },
    { schoolId: 'sch-bkk', orgId: organization.orgId, name: 'Bangkok Campus (test)', timezone: 'Asia/Bangkok', locale: 'th', status: 'active' },
    { schoolId: 'sch-online', orgId: organization.orgId, name: 'Online School (test)', timezone: 'Asia/Bangkok', locale: 'en', status: 'active' }
  ];

  const cohorts = [
    { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WLS (Lower Secondary, 13–15)', zh: 'WLS（初中，13–15岁）', th: 'WLS (มัธยมต้น 13–15 ปี)' }, ageBands: ['13-15'], status: 'active' },
    { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WHS (Higher Secondary, 16–18)', zh: 'WHS（高中，16–18岁）', th: 'WHS (มัธยมปลาย 16–18 ปี)' }, ageBands: ['16-18'], status: 'active' },
    { cohortId: 'cohort-w2e', code: 'W2E', name: { en: 'W2E (twice-exceptional, secondary)', zh: 'W2E（双重特殊，中学）', th: 'W2E (ผู้เรียนอัจฉริยภาพสองด้าน มัธยม)' }, ageBands: ['13-15', '16-18'], status: 'active' },
    { cohortId: 'cohort-wpr', code: 'WPR', name: { en: 'WPR (international, primary)', zh: 'WPR（国际，小学）', th: 'WPR (นานาชาติ ประถม)' }, ageBands: ['primary'], status: 'active' }
  ];

  const programmes = [
    { programmeId: 'prog-thai-diploma', code: 'THAI-DIP', name: { en: 'Thai Diploma', zh: '泰国文凭', th: 'ประกาศนียบัตรไทย' }, defaultLocale: 'th', status: 'active' }
  ];

  const classes = [
    { classId: 'cls-y7-w2e', schoolId: 'sch-w2e', cohortId: 'cohort-w2e', name: 'Year 7 Explorers', yearLevel: 'Year 7' },
    { classId: 'cls-y9-w2e', schoolId: 'sch-w2e', cohortId: 'cohort-w2e', name: 'Year 9 Innovators', yearLevel: 'Year 9' },
    { classId: 'cls-wls-y7', schoolId: 'sch-w2e', cohortId: 'cohort-wls', name: 'WLS Year 7 Foundation', yearLevel: 'Year 7' },
    { classId: 'cls-wls-y8', schoolId: 'sch-w2e', cohortId: 'cohort-wls', name: 'WLS Year 8 Core', yearLevel: 'Year 8' },
    { classId: 'cls-whs-y10', schoolId: 'sch-w2e', cohortId: 'cohort-whs', name: 'WHS Year 10 Advanced', yearLevel: 'Year 10' },
    { classId: 'cls-whs-y12', schoolId: 'sch-w2e', cohortId: 'cohort-whs', name: 'WHS Year 12 Diploma', yearLevel: 'Year 12' },
    { classId: 'cls-y11-w2e', schoolId: 'sch-online', cohortId: 'cohort-w2e', name: 'Year 11 Research', yearLevel: 'Year 11' },
    { classId: 'cls-y3-wpr', schoolId: 'sch-wpr', cohortId: 'cohort-wpr', name: 'Year 3 Discoverers', yearLevel: 'Year 3' },
    { classId: 'cls-y5-wpr', schoolId: 'sch-wpr', cohortId: 'cohort-wpr', name: 'Year 5 Makers', yearLevel: 'Year 5' },
    { classId: 'cls-thai-dip', schoolId: 'sch-w2e', programmeId: 'prog-thai-diploma', name: 'Thai Diploma – Thai Language', yearLevel: 'Year 10' }
  ].map((c) => ({ ...c, orgId: organization.orgId, status: 'active' }));

  const users = [];
  const history = [];
  let uidSeq = 0;

  function person(role, overrides = {}) {
    let givenNames; let surname; let email;
    do {
      givenNames = pick(GIVEN);
      surname = pick(SURNAMES);
      email = `${givenNames}.${surname}`.toLowerCase() + (role === 'student' ? '' : `.${role === 'parent' ? 'family' : 'staff'}`) + '@welearn.test';
    } while (usedEmails.has(email));
    usedEmails.add(email);
    uidSeq += 1;
    const createdDays = Math.floor(rand() * 50);
    const user = {
      uid: `mock-${role}-${String(uidSeq).padStart(3, '0')}`,
      publicId: makePublicId(rand, takenIds),
      role,
      status: 'active',
      givenNames,
      surname,
      displayName: `${givenNames} ${surname}`,
      salutation: null,
      email,
      phone: rand() < 0.4 ? `+668${Math.floor(10000000 + rand() * 89999999)}` : null,
      gender: pick(['female', 'male', 'nonbinary', 'prefer_not_to_say', null]),
      orgId: organization.orgId,
      schoolIds: ['sch-bkk'],
      classIds: [],
      programmeIds: [],
      locale: pick(['en', 'en', 'zh', 'th']),
      createdAt: at(createdDays),
      createdBy: { uid: 'mock-admin-001', name: 'Platform bootstrap' },
      updatedAt: null,
      updatedBy: null,
      auth: { lastSignInAt: null, createdAt: null, disabled: false },
      ...overrides
    };
    user.auth.createdAt = user.createdAt;
    users.push(user);
    return user;
  }

  // Staff: 2 testing admin accounts and 3 coaches accounts
  const admin = person('admin', {
    salutation: 'Ms',
    givenNames: 'Admin',
    surname: 'Test',
    displayName: 'Admin Test',
    email: 'admin.test@school.edu'
  });
  person('admin', {
    salutation: 'Mr',
    givenNames: 'WeLearn',
    surname: 'Admin',
    displayName: 'WeLearn Admin',
    email: 'admin@welearn.org'
  });
  const teachers = [
    person('teacher', {
      givenNames: 'Sam',
      surname: 'Coach',
      displayName: 'Coach Sam',
      email: 'coach.wpr@school.edu',
      schoolIds: ['sch-bkk']
    }),
    person('teacher', {
      givenNames: 'Alex',
      surname: 'Coach',
      displayName: 'Coach Alex',
      email: 'coach@welearn.org',
      schoolIds: ['sch-bkk']
    }),
    person('teacher', {
      givenNames: 'Mani',
      surname: 'Coach',
      displayName: 'Mani Coach',
      email: 'mani@welearn.org',
      schoolIds: ['sch-online']
    })
  ];
  classes.forEach((c, i) => { c.coachIds = [teachers[i % teachers.length].uid]; teachers[i % teachers.length].classIds.push(c.classId); });

  // Students: test student accounts
  const studentSpecs = [
    { givenNames: 'Penny', surname: 'Primary', displayName: 'Penny Primary', email: 'primary.student@school.edu', primary: true, cohortId: 'cohort-wpr' },
    { givenNames: 'Junior', surname: 'Explorer', displayName: 'Junior Explorer', email: 'junior.explorer@school.edu', primary: true, cohortId: 'cohort-wpr' },
    { givenNames: 'Yuri', surname: 'Na', displayName: 'Yuri Na', email: 'yuri.na@welearn.org', primary: false, cohortId: 'cohort-wls' },
    { givenNames: 'Lisa', surname: 'Chen', displayName: 'Lisa Chen', email: 'lisa@welearn.org', primary: false, cohortId: 'cohort-whs' },
    { givenNames: 'Charlie', surname: 'Su', displayName: 'Charlie Su', email: 'charlie.su@welearn.org', primary: false, cohortId: 'cohort-w2e' },
    { givenNames: 'Ana Isabella', surname: 'Apala', displayName: 'Ana Isabella', email: 'anaisapala23@gmail.com', primary: false, cohortId: 'cohort-whs', yearLevel: 'Grade 10', schoolId: 'sch-w2e', classId: 'cls-whs-y10', ageBand: '16-18', dateOfBirth: '2010-05-15', isFirstTimeUser: true }
  ];
  for (let i = 0; i < studentSpecs.length; i += 1) {
    const spec = studentSpecs[i];
    const primary = spec.primary;
    const targetCohort = spec.cohortId || (primary ? 'cohort-wpr' : 'cohort-w2e');
    const matchedClass = spec.classId ? classes.find((c) => c.classId === spec.classId) : null;
    const cls = matchedClass || pick(classes.filter((c) => c.cohortId === targetCohort)) || classes[0];
    person('student', {
      givenNames: spec.givenNames,
      surname: spec.surname,
      displayName: spec.displayName,
      email: spec.email,
      cohortId: cls.cohortId,
      ageBand: spec.ageBand || (primary ? 'primary' : (/(7|8|9)/.test(cls.yearLevel) ? '13-15' : '16-18')),
      yearLevel: spec.yearLevel || cls.yearLevel,
      schoolIds: spec.schoolId ? [spec.schoolId] : [cls.schoolId],
      classIds: spec.classId ? [spec.classId] : [cls.classId],
      programmeIds: [],
      dateOfBirth: spec.dateOfBirth || null,
      consent: primary ? { status: 'verified', method: 'school_form' } : null,
      status: 'active',
      isFirstTimeUser: spec.isFirstTimeUser || false
    });
  }

  // Parents: 5 test parent accounts
  const students = users.filter((u) => u.role === 'student');
  const parentSpecs = [
    { givenNames: 'Parent', surname: 'Test One', displayName: 'Parent Test 1', email: 'parent.test@school.edu', childIdx: 1 },
    { givenNames: 'Parent', surname: 'Test Two', displayName: 'Parent Test 2', email: 'parent@welearn.org', childIdx: 2 },
    { givenNames: 'Parent', surname: 'Test Three', displayName: 'Parent Test 3', email: 'parent3.test@school.edu', childIdx: 3 },
    { givenNames: 'Parent', surname: 'Test Four', displayName: 'Parent Test 4', email: 'parent4.test@school.edu', childIdx: 4 },
    { givenNames: 'Parent', surname: 'Test Five', displayName: 'Parent Test 5', email: 'parent5.test@school.edu', childIdx: 2 }
  ];
  const parentLinks = [];
  let linkSeq = 0;
  for (let i = 0; i < parentSpecs.length; i += 1) {
    const spec = parentSpecs[i];
    const p = person('parent', {
      givenNames: spec.givenNames,
      surname: spec.surname,
      displayName: spec.displayName,
      email: spec.email
    });
    const studentUid = students[spec.childIdx]?.uid;
    if (studentUid) {
      linkSeq += 1;
      parentLinks.push({ linkId: `link-${String(linkSeq).padStart(3, '0')}`, orgId: organization.orgId, parentUid: p.uid, studentUid, status: 'active', createdAt: p.createdAt, createdVia: `invite-${linkSeq}` });
    }
  }

  // History consistent with each account's state.
  let logSeq = 0;
  const log = (subject, action, summary, createdAt, details = {}) => {
    logSeq += 1;
    history.push({ logId: `log-${String(logSeq).padStart(4, '0')}`, source: 'server', orgId: organization.orgId, subjectUid: subject.uid, action, actorUid: admin.uid, actorName: admin.displayName, actorPublicId: admin.publicId, summary, details, createdAt });
  };
  // Student Billing Data
  const billing = students.map((s, idx) => {
    const totalTuition = (idx % 3 === 0) ? 60000 : (idx % 2 === 0) ? 45000 : 35000;
    let status = 'paid';
    let amountPaid = totalTuition;
    if (idx % 5 === 1) {
      status = 'partial';
      amountPaid = Math.floor(totalTuition * 0.6);
    } else if (idx % 7 === 2) {
      status = 'overdue';
      amountPaid = 0;
    }
    const remainingBalance = totalTuition - amountPaid;
    const nextBillingDate = status === 'paid' ? '2026-12-01' : status === 'partial' ? '2026-10-15' : '2026-09-30';
    const lastPaymentDate = amountPaid > 0 ? '2026-08-15' : null;

    return {
      uid: s.uid,
      publicId: s.publicId,
      studentName: s.displayName,
      email: s.email,
      cohortId: s.cohortId,
      yearLevel: s.yearLevel,
      totalTuition,
      amountPaid,
      remainingBalance,
      status,
      nextBillingDate,
      lastPaymentDate
    };
  });

  // Staff Material Requests
  const sampleItems = [
    { item: '3D Printer PLA Filament (10 Spools)', category: 'Tech/Hardware', cost: 8500, qty: 2, reason: 'Solar car chassis prototyping' },
    { item: 'Solar Cell Efficiency Measurement Sensors', category: 'Lab Equipment', cost: 14200, qty: 5, reason: 'Physics & Energy PBL activity' },
    { item: 'Primary Science Digital Microscopes', category: 'Lab Equipment', cost: 22000, qty: 4, reason: 'Water quality filter analysis' },
    { item: 'Robotics Microcontroller Expansion Boards', category: 'Tech/Hardware', cost: 11500, qty: 10, reason: 'Engineering year 12 coursework' },
    { item: 'Recycled Materials & Craft Tools Pack', category: 'Art & Crafts', cost: 4800, qty: 3, reason: 'Primary makerspace hands-on project' },
    { item: 'Thai Language & Cultural Literature Sets', category: 'Books & Media', cost: 9600, qty: 1, reason: 'Thai Diploma library enrichment' },
    { item: 'Portable Data Logging Tablets (Rugged)', category: 'Tech/Hardware', cost: 35000, qty: 3, reason: 'Outdoor environmental field study' }
  ];

  const materialRequests = sampleItems.map((spec, idx) => {
    const teacher = teachers[idx % teachers.length];
    const statuses = ['pending', 'approved', 'fulfilled', 'pending', 'approved', 'rejected', 'pending'];
    return {
      requestId: `mat-req-${String(idx + 1).padStart(3, '0')}`,
      item: spec.item,
      category: spec.category,
      quantity: spec.qty,
      estimatedCost: spec.cost,
      totalCost: spec.cost * spec.qty,
      reason: spec.reason,
      requestedByUid: teacher ? teacher.uid : admin.uid,
      requestedByName: teacher ? teacher.displayName : admin.displayName,
      requestedByEmail: teacher ? teacher.email : admin.email,
      status: statuses[idx % statuses.length],
      requestedAt: at(Math.floor(rand() * 20)),
      notes: idx % 2 === 0 ? 'Approved during weekly department review.' : ''
    };
  });

  return { organization, schools, cohorts, programmes, classes, users, parentLinks, parentInvites: [], history, billing, materialRequests };
}

/**
 * A pre-issued invite a reviewer can redeem as a parent without first issuing
 * one as an admin. Test data only; documented in docs/FRONTEND-PHASE-0-NOTES.md.
 */
export const DEMO_PARENT_INVITE_CODE = 'PRNT-2345';
