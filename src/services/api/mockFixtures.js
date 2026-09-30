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
    { schoolId: 'sch-bkk', orgId: organization.orgId, name: 'Bangkok Campus (test)', timezone: 'Asia/Bangkok', locale: 'th', status: 'active' },
    { schoolId: 'sch-online', orgId: organization.orgId, name: 'Online School (test)', timezone: 'Asia/Bangkok', locale: 'en', status: 'active' }
  ];

  const cohorts = [
    { cohortId: 'cohort-w2e', code: 'W2E', name: { en: 'W2E (twice-exceptional, secondary)', zh: 'W2E（双重特殊，中学）', th: 'W2E (ผู้เรียนอัจฉริยภาพสองด้าน มัธยม)' }, ageBands: ['13-15', '16-18'], status: 'active' },
    { cohortId: 'cohort-wpr', code: 'WPR', name: { en: 'WPR (international, primary)', zh: 'WPR（国际，小学）', th: 'WPR (นานาชาติ ประถม)' }, ageBands: ['primary'], status: 'active' }
  ];

  const programmes = [
    { programmeId: 'prog-thai-diploma', code: 'THAI-DIP', name: { en: 'Thai Diploma', zh: '泰国文凭', th: 'ประกาศนียบัตรไทย' }, defaultLocale: 'th', status: 'active' }
  ];

  const classes = [
    { classId: 'cls-y7-w2e', schoolId: 'sch-bkk', cohortId: 'cohort-w2e', name: 'Year 7 Explorers', yearLevel: 'Year 7' },
    { classId: 'cls-y9-w2e', schoolId: 'sch-bkk', cohortId: 'cohort-w2e', name: 'Year 9 Innovators', yearLevel: 'Year 9' },
    { classId: 'cls-y11-w2e', schoolId: 'sch-online', cohortId: 'cohort-w2e', name: 'Year 11 Research', yearLevel: 'Year 11' },
    { classId: 'cls-y3-wpr', schoolId: 'sch-bkk', cohortId: 'cohort-wpr', name: 'Year 3 Discoverers', yearLevel: 'Year 3' },
    { classId: 'cls-y5-wpr', schoolId: 'sch-bkk', cohortId: 'cohort-wpr', name: 'Year 5 Makers', yearLevel: 'Year 5' },
    { classId: 'cls-thai-dip', schoolId: 'sch-bkk', programmeId: 'prog-thai-diploma', name: 'Thai Diploma – Thai Language', yearLevel: 'Year 10' }
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

  // Staff
  const admin = person('admin', { salutation: 'Ms' });
  person('supervisor', { schoolIds: ['sch-bkk'] });
  person('supervisor', { schoolIds: ['sch-online'] });
  const teachers = [];
  for (let i = 0; i < 8; i += 1) {
    const t = person('teacher', { schoolIds: [i < 6 ? 'sch-bkk' : 'sch-online'] });
    teachers.push(t);
  }
  classes.forEach((c, i) => { c.coachIds = [teachers[i % teachers.length].uid]; teachers[i % teachers.length].classIds.push(c.classId); });

  // Students: 129, the total the wireframes showed, so "Displaying 1–30 of 129" is exercised.
  for (let i = 0; i < 129; i += 1) {
    const primary = i % 3 === 0;
    const cls = primary ? pick(classes.filter((c) => c.cohortId === 'cohort-wpr')) : pick(classes.filter((c) => c.cohortId === 'cohort-w2e'));
    const consentVerified = !primary || rand() < 0.8;
    const s = person('student', {
      cohortId: cls.cohortId,
      ageBand: primary ? 'primary' : (/(7|9)/.test(cls.yearLevel) ? '13-15' : '16-18'),
      yearLevel: cls.yearLevel,
      schoolIds: [cls.schoolId],
      classIds: [cls.classId],
      programmeIds: rand() < 0.15 ? ['prog-thai-diploma'] : [],
      dateOfBirth: null,
      consent: primary ? { status: consentVerified ? 'verified' : 'required', method: consentVerified ? 'school_form' : null } : null
    });
    if (primary && !consentVerified) s.status = 'pending';
    else if (rand() < 0.05) s.status = 'pending';
    else if (rand() < 0.04) s.status = 'suspended';
  }

  // Parents, each linked to 1-2 students.
  const students = users.filter((u) => u.role === 'student');
  const parentLinks = [];
  let linkSeq = 0;
  for (let i = 0; i < 42; i += 1) {
    const p = person('parent');
    const n = rand() < 0.3 ? 2 : 1;
    const kids = new Set();
    while (kids.size < n) kids.add(pick(students).uid);
    kids.forEach((studentUid) => {
      linkSeq += 1;
      parentLinks.push({ linkId: `link-${String(linkSeq).padStart(3, '0')}`, orgId: organization.orgId, parentUid: p.uid, studentUid, status: 'active', createdAt: p.createdAt, createdVia: `invite-${linkSeq}` });
    });
  }

  // History consistent with each account's state.
  let logSeq = 0;
  const log = (subject, action, summary, createdAt, details = {}) => {
    logSeq += 1;
    history.push({ logId: `log-${String(logSeq).padStart(4, '0')}`, source: 'server', orgId: organization.orgId, subjectUid: subject.uid, action, actorUid: admin.uid, actorName: admin.displayName, actorPublicId: admin.publicId, summary, details, createdAt });
  };
  users.forEach((u) => {
    log(u, 'ACCOUNT_CREATED', `Account created as ${u.role}`, u.createdAt);
    log(u, 'ACTIVATION_EMAIL_SENT', `Activation email sent to ${u.email}`, u.createdAt);
    if (u.status !== 'pending') {
      const activated = new Date(Date.parse(u.createdAt) + DAY).toISOString();
      u.activatedAt = activated;
      u.auth.lastSignInAt = new Date(Date.parse(activated) + Math.floor(rand() * 20) * DAY).toISOString();
      log(u, 'ACCOUNT_ACTIVATED', 'Account activated', activated);
    }
    if (u.status === 'suspended') {
      u.suspendedAt = new Date(Date.parse(u.createdAt) + 5 * DAY).toISOString();
      u.suspendedBy = { uid: admin.uid, name: admin.displayName };
      u.auth.disabled = true;
      log(u, 'ACCOUNT_SUSPENDED', 'Account suspended', u.suspendedAt, { reason: 'Left the school (test data)' });
    }
  });

  return { organization, schools, cohorts, programmes, classes, users, parentLinks, parentInvites: [], history };
}

/**
 * A pre-issued invite a reviewer can redeem as a parent without first issuing
 * one as an admin. Test data only; documented in docs/FRONTEND-PHASE-0-NOTES.md.
 */
export const DEMO_PARENT_INVITE_CODE = 'PRNT-2345';
