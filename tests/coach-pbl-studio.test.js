// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { STUDENT_2E_PROFILES, UNIVERSAL_LEARNER, getLearnerById } from '../src/features/coach/studio/learnerProfiles.js';
import { DEFAULT_GROUNDING_SOURCES, calculateTotalTokens } from '../src/features/coach/studio/groundingSources.js';
import { PblUnitSchema } from '../src/features/coach/studio/pblUnitSchema.js';
import { generateGroundedUnitLocal } from '../src/features/coach/studio/pblSynthesizer.js';
import { convertUnitToProgram, publishAndTransferToStudent } from '../src/features/coach/studio/pblTransferService.js';
import { programById } from '../src/features/pbl/programs/catalog.js';
import { newProgress, setSubmission } from '../src/features/pbl/programs/progress.js';

describe('Coach AI PBL Authoring Studio', () => {
  it('offers the universal learner and no invented student profiles', () => {
    expect(STUDENT_2E_PROFILES).toEqual([UNIVERSAL_LEARNER]);
    expect(UNIVERSAL_LEARNER.isUniversal).toBe(true);
    expect(UNIVERSAL_LEARNER.appliedAccommodations.length).toBeGreaterThan(0);
    expect(getLearnerById('student-liam-chen')).toBe(UNIVERSAL_LEARNER);
  });

  it('calculates tokens across active grounding sources', () => {
    expect(DEFAULT_GROUNDING_SOURCES.length).toBeGreaterThanOrEqual(4);
    const initialTokens = calculateTotalTokens(DEFAULT_GROUNDING_SOURCES);
    expect(initialTokens).toBeGreaterThan(10000);

    const partial = DEFAULT_GROUNDING_SOURCES.map((s, idx) => ({ ...s, active: idx === 0 }));
    expect(calculateTotalTokens(partial)).toBe(DEFAULT_GROUNDING_SOURCES[0].tokenCount);
  });

  it('synthesizes a structured 8-stage PBL unit conforming to Zod schema', () => {
    const unit = generateGroundedUnitLocal({
      learner: UNIVERSAL_LEARNER,
      activeSources: DEFAULT_GROUNDING_SOURCES
    });

    const parsed = PblUnitSchema.safeParse(unit);
    expect(parsed.success).toBe(true);
    expect(unit.milestones.length).toBe(8);
    expect(unit.drivingQuestion).toContain('How might we');
    expect(unit.milestones[0].stageName).toBe('Curiosity & Inquiry');
    expect(unit.milestones[7].stageName).toBe('Showcase & Pitch');
    expect(unit.makerSpaceSpecs.length).toBeGreaterThan(0);
    expect(unit.coachCues.leadCoach).toBe('Coach Donovan');
  });

  it('transfers synthesized unit to student program and registers in dynamic catalog', async () => {
    const unit = generateGroundedUnitLocal({
      learner: UNIVERSAL_LEARNER,
      activeSources: DEFAULT_GROUNDING_SOURCES
    });

    const transferResult = await publishAndTransferToStudent(unit, 'student-1', 'coach-donovan');
    expect(transferResult.success).toBe(true);
    expect(transferResult.programId).toBe(unit.id);
    expect(transferResult.studentUrl).toContain(encodeURIComponent(unit.id));

    // Must now be resolvable by programById
    const resolved = programById(unit.id);
    expect(resolved).not.toBeNull();
    expect(resolved.title).toBe(unit.unitTitle);
    expect(resolved.drivingQuestion).toBe(unit.drivingQuestion);
    expect(resolved.phases.length).toBe(8);
  });

  it('supports multi-modal student submissions', () => {
    let prog = newProgress('test-prog');
    prog = setSubmission(prog, 1, 'video', 'https://youtu.be/demo-vid');
    prog = setSubmission(prog, 1, 'github', 'https://github.com/welearn/robotics');

    expect(prog.sessions[1].submissions.video.url).toBe('https://youtu.be/demo-vid');
    expect(prog.sessions[1].submissions.github.url).toBe('https://github.com/welearn/robotics');
    expect(Number.isFinite(prog.sessions[1].submissions.video.submittedAt)).toBe(true);
  });

  it('allows students to search and find transferred custom programs via searchCatalog', async () => {
    const { buildCatalog, searchCatalog } = await import('../src/features/courses/catalog.js');
    const { getCustomPrograms } = await import('../src/features/coach/programs/customProgramsStore.js');

    const unit = generateGroundedUnitLocal({
      learner: UNIVERSAL_LEARNER,
      activeSources: DEFAULT_GROUNDING_SOURCES,
      customFocus: 'Biomimetic Grip Design'
    });
    await publishAndTransferToStudent(unit, 'student-1', 'coach-donovan');

    const custom = Object.values(getCustomPrograms());
    const catalog = buildCatalog({
      activities: [],
      programs: custom,
      includePartners: false
    });

    // Search by word in title or description (e.g. 'Grip' or 'Biomimetic' or 'Rover')
    const results = searchCatalog(catalog, 'Grip');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain('Biomimetic');
    expect(results[0].source).toBe('program');
  });

  it('publishes program to open catalog without selecting a specific learner', async () => {
    const { publishProgramToCatalog } = await import('../src/features/coach/studio/pblTransferService.js');
    const { UNIVERSAL_LEARNER } = await import('../src/features/coach/studio/learnerProfiles.js');
    const unit = generateGroundedUnitLocal({
      learner: UNIVERSAL_LEARNER,
      activeSources: DEFAULT_GROUNDING_SOURCES,
      customFocus: 'Autonomous Mars Rover Telemetry'
    });

    const res = await publishProgramToCatalog(unit, 'coach-donovan');
    expect(res.success).toBe(true);
    expect(res.programId).toContain('pbl-open');
    expect(res.searchUrl).toContain('#/search');
    expect(res.studentUrl).toContain('#/pbl/programs');

    // Program resolves cleanly from library and catalog
    const resolved = programById(res.programId);
    expect(resolved).not.toBeNull();
    expect(resolved.title).toContain('Autonomous Mars Rover Telemetry');
    expect(resolved.visibility).toBe('centre');
    expect(resolved.status).toBe('published');
  });

  it('allows any learner to find published program on #/search and add/start it', async () => {
    const { buildCatalog, searchCatalog } = await import('../src/features/courses/catalog.js');
    const { getCustomPrograms } = await import('../src/features/coach/programs/customProgramsStore.js');
    const { addToMyCourse } = await import('../src/services/pblService.js');

    const custom = Object.values(getCustomPrograms());
    const catalog = buildCatalog({
      activities: [],
      programs: custom,
      includePartners: false
    });

    // Student searches for 'Mars' or 'Rover' or 'Telemetry'
    const results = searchCatalog(catalog, 'Mars Rover');
    expect(results.length).toBeGreaterThanOrEqual(1);
    const marsCourse = results.find((r) => r.title.includes('Mars Rover'));
    expect(marsCourse).toBeDefined();
    expect(marsCourse.source).toBe('program');

    // Any learner self-enrols in the course
    const studentUid = 'student-test-learner-99';
    const enrolRes = await addToMyCourse(marsCourse.id, studentUid);
    expect(enrolRes.success).toBe(true);
    expect(enrolRes.enrolmentId).toBe(`${studentUid}_${marsCourse.id}`);
  });
});
