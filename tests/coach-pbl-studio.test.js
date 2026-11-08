// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { STUDENT_2E_PROFILES, getLearnerById, UNIVERSAL_LEARNER } from '../src/features/coach/studio/learnerProfiles.js';
import { DEFAULT_GROUNDING_SOURCES, calculateTotalTokens } from '../src/features/coach/studio/groundingSources.js';
import { PblUnitSchema, normalizePblUnit } from '../src/features/coach/studio/pblUnitSchema.js';
import { convertUnitToProgram, publishAndTransferToStudent } from '../src/features/coach/studio/pblTransferService.js';
import { programById } from '../src/features/pbl/programs/catalog.js';
import { newProgress, setSubmission } from '../src/features/pbl/programs/progress.js';
import { STARTER_TEMPLATES } from '../src/features/coach/studio/starterTemplates.js';
import { fetchAndSummarizeUrl } from '../src/features/coach/studio/urlSummarizer.js';
import { generateExtraMaterials } from '../src/features/coach/studio/extraMaterialsGenerator.js';

describe('Coach AI PBL Authoring Studio', () => {
  it('loads rich UDL learner profile with traits, passions, and hurdles', () => {
    expect(STUDENT_2E_PROFILES.length).toBeGreaterThanOrEqual(1);
    const learner = getLearnerById('universal-all');
    expect(learner.name).toContain('All Learners');
    expect(learner.diagnosisTraits).toContain('Universal Design for Learning');
    expect(learner.consumingPassions).toContain('Autonomous Robotics');
    expect(learner.executiveFunctionHurdles).toContain('milestone checklists');
    expect(learner.appliedAccommodations.length).toBeGreaterThan(0);
  });

  it('calculates tokens across active grounding sources', () => {
    expect(DEFAULT_GROUNDING_SOURCES.length).toBeGreaterThanOrEqual(4);
    const initialTokens = calculateTotalTokens(DEFAULT_GROUNDING_SOURCES);
    expect(initialTokens).toBeGreaterThan(200);
    expect(initialTokens).toBeLessThan(5000);

    const partial = DEFAULT_GROUNDING_SOURCES.map((s, idx) => ({ ...s, active: idx === 0 }));
    expect(calculateTotalTokens(partial)).toBe(DEFAULT_GROUNDING_SOURCES[0].tokenCount);
  });

  it('synthesizes and normalizes a structured 8-stage PBL unit conforming to Zod schema', () => {
    const raw = {
      unitTitle: 'Autonomous Environmental Telemetry Rover',
      drivingQuestion: 'How might we design an autonomous rover to monitor habitat microclimates?',
      bigIdea: 'Environmental conservation powered by IoT and robotics.',
      makerSpaceSpecs: ['Bambu Lab X1-C 3D Printer', 'micro:bit V2'],
      coachCues: { leadCoach: 'Coach Donovan' }
    };
    const unit = normalizePblUnit(raw);

    const parsed = PblUnitSchema.safeParse(unit);
    expect(parsed.success).toBe(true);
    expect(unit.milestones.length).toBe(8);
    expect(unit.drivingQuestion).toContain('How might we');
    expect(unit.milestones[0].stageName).toBe('Curiosity & Exploration');
    expect(unit.milestones[7].stageName).toBe('Showcase & Public Expo');
    expect(unit.makerSpaceSpecs.length).toBeGreaterThan(0);
    expect(unit.coachCues.leadCoach).toBe('Coach Donovan');
  });

  it('transfers synthesized unit to student program and registers in dynamic catalog', async () => {
    const unit = normalizePblUnit({
      id: 'unit-biomimetic-grip-test',
      unitTitle: 'Biomimetic Soft Robotic Gripper',
      drivingQuestion: 'How might we build a robotic gripper inspired by nature?'
    });

    const transferResult = await publishAndTransferToStudent(unit, 'student-maya-patel', 'coach-donovan');
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

  it('manages coach evaluations desk with formative assessment and XP awards', async () => {
    const { createSubmission, approveSubmission } = await import('../src/features/coach/evaluation/evaluationsStore.js');
    const submission = await createSubmission({
      studentId: 'student-test-liam',
      studentName: 'Test Learner',
      evidence: {
        video: { url: 'https://youtube.com/watch?v=demo' },
        github: { repo: 'test-repo' },
        prototype: { assetTag: 'MS-PRUSA-04' }
      }
    });
    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('pending');

    const approved = await approveSubmission(submission.id, {
      feedback: 'Outstanding motor telemetry calibration!',
      xp: 100,
      coachName: 'Coach Donovan'
    });
    expect(approved.status).toBe('approved');
    expect(approved.xpAwarded).toBe(100);
    expect(approved.coachFeedback).toBe('Outstanding motor telemetry calibration!');
  });

  it('allows students to search and find transferred custom programs via searchCatalog', async () => {
    const { buildCatalog, searchCatalog } = await import('../src/features/courses/catalog.js');
    const { getCustomPrograms } = await import('../src/features/coach/programs/customProgramsStore.js');

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
    const unit = normalizePblUnit({
      unitTitle: 'Autonomous Mars Rover Telemetry',
      drivingQuestion: 'How might we build an autonomous rover for Martian telemetry?',
      customFocus: 'Autonomous Mars Rover Telemetry'
    });

    const res = await publishProgramToCatalog(unit, 'coach-donovan');
    expect(res.success).toBe(true);
    expect(res.programId).toContain('pbl-');
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

  it('does not write local cache or dispatch events when publishProgram batch.commit fails', async () => {
    const { publishProgram } = await import('../src/services/pblService.js');
    localStorage.removeItem('hearisland.custom_pbl_programs.v1');

    const failingDb = {
      collection: (colName) => ({
        doc: (docPath) => ({ id: docPath.split('/').pop(), path: `${colName}/${docPath}` })
      }),
      batch: () => ({
        set: () => {},
        update: () => {},
        delete: () => {},
        commit: async () => {
          throw new Error('PERMISSION_DENIED: Missing or insufficient permissions.');
        }
      })
    };

    const events = [];
    const onChanged = (e) => events.push(e.detail);
    window.addEventListener('pbl-custom-programs-changed', onChanged);

    const unit = normalizePblUnit({
      id: 'unit-failed-commit-001',
      unitTitle: 'Failed Commit Acoustic Sensor',
      drivingQuestion: 'How might we test atomic failure handling?'
    });
    const draft = convertUnitToProgram(unit, 'coach-donovan', 'student-maya-patel');

    try {
      await expect(
        publishProgram(draft, { assignTo: { learnerId: 'student-maya-patel' }, dbInstance: failingDb })
      ).rejects.toThrow(/Failed to publish program to Firestore/i);

      expect(localStorage.getItem('hearisland.custom_pbl_programs.v1')).toBeNull();
      expect(events).toHaveLength(0);
    } finally {
      window.removeEventListener('pbl-custom-programs-changed', onChanged);
    }
  });

  it('persists validated competency mappings and makes program + enrolment visible to a separate learner session after commit', async () => {
    const { publishProgram, getProgram } = await import('../src/services/pblService.js');
    const store = new Map();

    const memoryDb = {
      collection: (colName) => ({
        doc: (docPath) => {
          const fullPath = `${colName}/${docPath}`;
          return {
            id: docPath.split('/').pop(),
            path: fullPath,
            get: async () => ({
              id: docPath.split('/').pop(),
              exists: store.has(fullPath),
              data: () => store.get(fullPath) || null
            })
          };
        }
      }),
      batch: () => {
        const staged = [];
        return {
          set: (ref, data) => staged.push({ path: ref.path, data }),
          update: (ref, data) => staged.push({ path: ref.path, data }),
          delete: () => {},
          commit: async () => {
            for (const op of staged) {
              store.set(op.path, op.data);
            }
          }
        };
      }
    };

    const unit = normalizePblUnit({
      id: 'unit-ngs-welearn-mapped',
      unitTitle: 'Solar Desalination Micro-Grid',
      drivingQuestion: 'How might we desalinate brackish water using solar thermal robotics?',
      competencies: [
        { framework: 'welearn', id: 'ctps-04' },
        { framework: 'ngs', id: 'MS-ETS1-2' }
      ],
      milestones: [
        {
          stageNumber: 1,
          stageName: 'Curiosity & Exploration',
          title: 'Salinity Benchmarking',
          competencies: [
            { framework: 'welearn', id: 'ctps-04' },
            { framework: 'ngs', id: 'MS-ETS1-2' },
            { framework: 'ngs', id: 'INVENTED-ID-999' } // unapproved ID must be stripped
          ]
        }
      ]
    });

    expect(unit.milestones[0].competencies.map((c) => c.id)).toEqual(['ctps-04', 'MS-ETS1-2']);

    const draft = convertUnitToProgram(unit, 'coach-donovan', 'student-liam-chen');
    expect(draft.phases[0].competencies).toEqual(['ctps-04', 'MS-ETS1-2']);
    expect(draft.phases[0].sessions[0].evidenceToCollect.targetCompetencies).toEqual(['ctps-04', 'MS-ETS1-2']);

    const result = await publishProgram(draft, {
      assignTo: { learnerId: 'student-liam-chen', classId: 'class-robotics-a' },
      dbInstance: memoryDb
    });

    expect(result.programId).toBe('unit-ngs-welearn-mapped');
    expect(result.enrolmentIds).toEqual(['student-liam-chen_unit-ngs-welearn-mapped']);

    // Simulate a separate learner browser session with empty localStorage
    localStorage.clear();

    const enrolmentDoc = store.get('enrolments/student-liam-chen_unit-ngs-welearn-mapped');
    expect(enrolmentDoc).toBeDefined();
    expect(enrolmentDoc.learnerId).toBe('student-liam-chen');
    expect(enrolmentDoc.programId).toBe('unit-ngs-welearn-mapped');
    expect(enrolmentDoc.status).toBe('active');

    const phaseProgressDoc = store.get('enrolments/student-liam-chen_unit-ngs-welearn-mapped/phaseProgress/phase-1');
    expect(phaseProgressDoc).toBeDefined();
    expect(phaseProgressDoc.status).toBe('in_progress');

    const loaded = await getProgram('unit-ngs-welearn-mapped', { dbInstance: memoryDb });
    expect(loaded.status).toBe('found');
    expect(loaded.program.title).toBe('Solar Desalination Micro-Grid');
    expect(loaded.program.competencies.map((c) => c.id)).toEqual(['ctps-04', 'MS-ETS1-2']);
    expect(loaded.program.phases[0].competencies).toEqual(['ctps-04', 'MS-ETS1-2']);
  });

  it('provides rich starter templates with prefilled brief, cohort and competencies', () => {
    expect(STARTER_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const biomimicry = STARTER_TEMPLATES.find((t) => t.id === 'tpl-biomimicry');
    expect(biomimicry).toBeDefined();
    expect(biomimicry.brief.drivingQuestion).toContain('nature-inspired');
    expect(biomimicry.cohort).toBe('WLS');
    expect(biomimicry.competencies.length).toBeGreaterThanOrEqual(5);
    expect(biomimicry.source.title).toContain('Biomimicry Institute');
  });

  it('fetches and summarizes a pasted URL with title, excerpt and token estimate', async () => {
    const res = await fetchAndSummarizeUrl('https://biomimicry.org/what-is-biomimicry');
    expect(res.domain).toBe('biomimicry.org');
    expect(res.title).toContain('What Is Biomimicry');
    expect(res.summary).toContain('Biomimicry');
    expect(res.tokenCount).toBeGreaterThan(50);
  });

  it('rejects invalid URLs gracefully', async () => {
    await expect(fetchAndSummarizeUrl('not a url %%%')).rejects.toThrow(/valid web address/i);
  });

  it('generates 5 collateral extras from unit: slides, quiz, narration, jobsheet, parent summary', () => {
    const unit = normalizePblUnit({
      unitTitle: 'Passive Urban Cooling Canopy',
      drivingQuestion: 'How might nature cool our school campus?',
      realProblem: {
        peopleImpact: 'Protect students from heat stroke during sports',
        environmentalImpact: 'Reduce AC energy consumption by 40%'
      },
      makerSpaceSpecs: [
        { toolType: '3D Printer', specs: 'PLA filament', safetyGuidelines: 'Wear goggles' }
      ]
    });

    const extras = generateExtraMaterials(unit, []);
    expect(extras).not.toBeNull();

    // 1. Slides
    expect(extras.slides.length).toBeGreaterThanOrEqual(4);
    expect(extras.slides[0].heading).toBe('Passive Urban Cooling Canopy');

    // 2. Formative Quiz
    expect(extras.quizItems.length).toBeGreaterThanOrEqual(4);
    expect(extras.quizItems[0].prompt).toContain('driving question');
    expect(extras.quizItems[0].options[extras.quizItems[0].correctIndex]).toBe(unit.drivingQuestion);

    // 3. Narration Script
    expect(extras.narrationScript.length).toBeGreaterThanOrEqual(4);
    expect(extras.narrationScript[0].text).toContain('Passive Urban Cooling Canopy');

    // 4. MakerSpace Job Sheet
    expect(extras.jobSheet.requiredTools).toContain('3D Printer');
    expect(extras.jobSheet.safetyChecklist.length).toBeGreaterThanOrEqual(3);

    // 5. Parent Summary
    expect(extras.parentSummary.unitTitle).toBe('Passive Urban Cooling Canopy');
    expect(extras.parentSummary.homeConversationStarters.length).toBeGreaterThanOrEqual(3);
  });
});

