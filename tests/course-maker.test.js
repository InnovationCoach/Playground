import { describe, it, expect, beforeEach, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import {
  validateCourseBasics,
  findInvalidCompetencyIds,
  isValidCompetencyId,
  checkCurriculumAlignment,
  VALID_STAGE_IDS
} from '../src/features/courses/maker/courseAlignmentValidator.js';

import {
  parseCourseContent,
  isSupportedFormat,
  SUPPORTED_IMPORT_FORMATS
} from '../src/features/courses/maker/courseImportParser.js';

import {
  listDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
  createNewDraft
} from '../src/features/courses/maker/courseDraftStore.js';

import {
  draftCourseOutline,
  draftSingleLesson
} from '../src/features/courses/maker/courseMakerAiService.js';

import {
  publishProgramToCatalog,
  convertUnitToProgram
} from '../src/features/coach/studio/pblTransferService.js';

import {
  getCustomPrograms,
  getCustomProgramById
} from '../src/features/coach/programs/customProgramsStore.js';

import { LIBRARY_PROGRAMS } from '../src/features/pbl/programs/libraryProgramsData.js';
import { COMPETENCIES } from '../src/features/pbl/content/competencies.js';

import { CourseMaker } from '../src/features/courses/maker/CourseMaker.jsx';
import { CourseBasicsStep } from '../src/features/courses/maker/CourseBasicsStep.jsx';
import { CourseResourcesStep } from '../src/features/courses/maker/CourseResourcesStep.jsx';
import { CourseOutlineStep } from '../src/features/courses/maker/CourseOutlineStep.jsx';
import { CourseLessonsStep } from '../src/features/courses/maker/CourseLessonsStep.jsx';
import { CourseAlignmentStep } from '../src/features/courses/maker/CourseAlignmentStep.jsx';
import { CoursesHub } from '../src/features/courses/CoursesHub.jsx';

// In-memory localStorage mock for node test environment
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true
});

describe('Course Maker — Curriculum Framework & Alignment Validator', () => {
  it('validates against real curriculum competencies and rejects invalid identifiers', () => {
    // Valid competencies from COMPETENCIES
    expect(isValidCompetencyId('sdl-01')).toBe(true);
    expect(isValidCompetencyId('ctps-01')).toBe(true);
    expect(isValidCompetencyId('ent-02')).toBe(true);

    // Fake / invalid competencies
    expect(isValidCompetencyId('fake-999')).toBe(false);
    expect(isValidCompetencyId('invented-competency')).toBe(false);

    const invalidList = findInvalidCompetencyIds(['sdl-01', 'invalid-xyz', 'ctps-02', 'fake-123']);
    expect(invalidList).toEqual(['invalid-xyz', 'fake-123']);
  });

  it('rejects course basics with missing title, zero duration, or invalid competencies', () => {
    const invalidCourse = {
      title: '',
      cohort: 'lower-secondary',
      durationWeeks: 0,
      objectives: [],
      competencies: ['fake-comp-id']
    };

    const result = validateCourseBasics(invalidCourse);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'title')).toBe(true);
    expect(result.errors.some((e) => e.field === 'durationWeeks')).toBe(true);
    expect(result.errors.some((e) => e.field === 'objectives')).toBe(true);
    expect(result.errors.some((e) => e.field === 'competencies')).toBe(true);
  });

  it('audits curriculum alignment and flags missing evidence and unassessed competencies', () => {
    const course = {
      title: 'Urban Heat Island Mitigation',
      cohort: 'lower-secondary',
      durationWeeks: 12,
      objectives: [
        'Investigate thermal properties of asphalt and garden soil',
        'Build automated shade deployment mechanism'
      ],
      competencies: ['sdl-01', 'ctps-01', 'ent-01'], // ent-01 is unassessed in milestones
      milestones: [
        {
          id: 'ms-1',
          phaseId: 'explore',
          title: 'Explore Stage',
          learningGoal: 'Investigate thermal properties of asphalt and garden soil',
          activities: ['Collect thermal sensor readings'],
          evidencePrompt: '', // Missing evidence requirement
          targetCompetencies: ['sdl-01'],
          isAiGenerated: true,
          approvedByCoach: false // Unapproved AI suggestion
        },
        {
          id: 'ms-2',
          phaseId: 'prototype',
          title: 'Prototype Stage',
          learningGoal: 'Build automated shade deployment mechanism',
          activities: ['Assemble servo-driven shade louvers'],
          evidencePrompt: 'Submit working bench prototype video',
          targetCompetencies: ['ctps-01'],
          isAiGenerated: false,
          approvedByCoach: true
        }
      ]
    };

    const report = checkCurriculumAlignment(course);
    expect(report.isValid).toBe(true); // Basic structure is valid, but has warnings
    expect(report.warnings.length).toBeGreaterThan(0);

    // Warnings must catch:
    // 1. Missing evidence prompt in milestone 1
    expect(report.warnings.some((w) => w.field.includes('evidence'))).toBe(true);
    // 2. Unapproved AI suggestion in milestone 1
    expect(report.warnings.some((w) => w.field.includes('approval'))).toBe(true);
    // 3. Unassessed competency (ent-01)
    expect(report.warnings.some((w) => w.field === 'competencies')).toBe(true);

    // Matrix coverage
    expect(report.stats.totalObjectives).toBe(2);
    expect(report.stats.coveredObjectives).toBe(2);
    expect(report.stats.alignmentPercentage).toBe(100);
    expect(report.stats.assessedCompetencies).toBe(2);
  });
});

describe('Course Maker — Import Parser', () => {
  it('correctly imports an approved official course (EcoCool) from LIBRARY_PROGRAMS', () => {
    const approvedEcoCool = LIBRARY_PROGRAMS.find((p) => p.id === 'ecocool-smart-garden-2026');
    expect(approvedEcoCool).toBeDefined();

    const jsonStr = JSON.stringify(approvedEcoCool);
    const parsed = parseCourseContent(jsonStr, 'ecocool.json');

    expect(parsed.success).toBe(true);
    expect(parsed.format).toContain('WeLearn PBL Program');
    expect(parsed.course.title).toBe(approvedEcoCool.title);
    expect(parsed.course.milestones.length).toBe(approvedEcoCool.phases.length);
    expect(parsed.course.milestones[0].phaseId).toBe('explore');
    expect(parsed.course.milestones[0].activities.length).toBeGreaterThan(0);
    expect(parsed.course.milestones[0].deliverables.length).toBeGreaterThan(0);
  });

  it('imports a Markdown syllabus into structured milestones', () => {
    const md = `
# Drone Habitat Conservation Survey
Driving Question: How might we use autonomous drones to monitor mangrove restoration?

## Explore Stage
- Goal: Benchmark mangrove canopy density and tidal flood patterns.
- Activity: Deploy aerial mapping cameras over estuary zones.
- Evidence: Orthomosaic vegetation index map and flight log.
- Tools: DJI Mini, DroneDeploy, Python GIS.

## Prototype Stage
- Goal: Fabricate sensor payload mount.
- Activity: 3D print lightweight PETG gimbal bracket.
- Evidence: 3D CAD model and bench test footage.
    `.trim();

    const parsed = parseCourseContent(md, 'syllabus.md');
    expect(parsed.success).toBe(true);
    expect(parsed.format).toContain('Markdown');
    expect(parsed.course.title).toBe('Drone Habitat Conservation Survey');
    expect(parsed.course.milestones.length).toBe(2);
    expect(parsed.course.milestones[0].activities).toContain('Deploy aerial mapping cameras over estuary zones.');
    expect(parsed.course.milestones[0].deliverables).toContain('Orthomosaic vegetation index map and flight log.');
  });

  it('rejects unsupported binary files and corrupt JSON with actionable error messages', () => {
    const binaryAttempt = parseCourseContent(null, 'scanned-doc.pdf');
    expect(binaryAttempt.success).toBe(false);
    expect(binaryAttempt.code).toBe('UNSUPPORTED_BINARY');

    const corruptJson = parseCourseContent('{ "title": "Incomplete course", phases: [ }', 'bad.json');
    expect(corruptJson.success).toBe(false);
    expect(corruptJson.code).toBe('INVALID_JSON');
  });
});

describe('Course Maker — Draft Store Persistence', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('saves, leaves, and reloads draft without data loss', () => {
    const newDraft = createNewDraft({
      title: 'Solar Hydrogen Electrolyser',
      cohort: 'higher-secondary',
      durationWeeks: 14,
      objectives: ['Measure electrolysis efficiency across proton exchange membranes'],
      competencies: ['sdl-01', 'ctps-01'],
      sources: [{ id: 'src-1', title: 'PEM Electrolysis Principles', text: 'PEM electrolysis operates at 80C.' }]
    });

    const saved = saveDraft(newDraft);
    expect(saved.id).toBeDefined();

    // Simulate leaving / closing app
    const loadedList = listDrafts();
    expect(loadedList.length).toBe(1);

    const reloaded = getDraft(saved.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded.title).toBe('Solar Hydrogen Electrolyser');
    expect(reloaded.sources.length).toBe(1);
    expect(reloaded.sources[0].title).toBe('PEM Electrolysis Principles');

    // Keeps drafts isolated from published programs
    const publishedPrograms = getCustomPrograms();
    expect(publishedPrograms[saved.id]).toBeUndefined();

    // Deleting draft
    deleteDraft(saved.id);
    expect(listDrafts().length).toBe(0);
  });
});

describe('Course Maker — Hybrid AI Drafting & Fault Tolerance', () => {
  it('generates a deterministic 8-stage outline using valid curriculum framework identifiers', async () => {
    const basics = {
      title: 'Microclimate Urban Cooling',
      theme: 'Urban Thermodynamics',
      drivingQuestion: 'How might we lower urban heat deltas?',
      objectives: ['Analyze heat islands', 'Deploy vegetative shade structures'],
      cohort: 'lower-secondary'
    };

    const sources = [
      { id: 'src-1', title: 'Urban Heat Island Guide', text: 'Asphalt retains radiative solar energy.' }
    ];

    const result = await draftCourseOutline({ courseBasics: basics, sources });
    expect(result.success).toBe(true);
    expect(result.milestones.length).toBe(8);

    // All milestones must use valid stages and framework competencies
    for (const m of result.milestones) {
      expect(VALID_STAGE_IDS).toContain(m.phaseId);
      expect(m.isAiGenerated).toBe(true);
      expect(m.approvedByCoach).toBe(false);
      expect(m.targetCompetencies.length).toBeGreaterThan(0);
      for (const cId of m.targetCompetencies) {
        expect(isValidCompetencyId(cId)).toBe(true);
      }
    }
  });

  it('drafts a single lesson without overwriting coach-approved work', async () => {
    const existingMilestone = {
      id: 'ms-prototype',
      phaseId: 'prototype',
      title: 'Coach Approved Fabrication Milestone',
      learningGoal: 'Assemble the solar tracker chassis',
      activities: ['Laser cut 4mm acrylic plates (Coach verified)'],
      makerSpaceTools: ['Laser Cutter'],
      approvedByCoach: true
    };

    const res = await draftSingleLesson({
      stageIndex: 4,
      courseBasics: { title: 'Solar Tracker', theme: 'Renewable Robotics' },
      existingMilestone
    });

    expect(res.success).toBe(true);
    expect(res.milestone.title).toBe('Coach Approved Fabrication Milestone');
    expect(res.milestone.activities.length).toBeGreaterThan(0);
    expect(res.milestone.isAiGenerated).toBe(true);
    expect(res.milestone.approvedByCoach).toBe(false);
  });
});

describe('Course Maker — End-to-End Verification with Real Course', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('executes full pipeline: enter -> align -> outline -> edit -> save -> preview -> publish -> learner access', async () => {
    // 1. Enter course basics
    const course = createNewDraft({
      title: 'EcoCool: Smart Urban Heat & Community Garden Monitor',
      cohort: 'lower-secondary',
      ageBand: '11-13',
      durationWeeks: 12,
      drivingQuestion: 'How might we use smart IoT sensors to combat urban heat islands in community gardens?',
      theme: 'Climate & Urban Resilience',
      objectives: [
        'Investigate urban heat islands and soil thermal inertia',
        'Deploy capacitive soil telemetry and automated microclimate shading'
      ],
      competencies: ['sdl-01', 'ctps-01', 'ct-03']
    });

    // 2. Map to curriculum framework
    const val = validateCourseBasics(course);
    expect(val.isValid).toBe(true);

    // 3. Generate outline
    const outline = await draftCourseOutline({ courseBasics: course, sources: [] });
    course.milestones = outline.milestones;
    expect(course.milestones.length).toBe(8);

    // 4. Edit a lesson and its assessment
    course.milestones[0].title = 'Microclimates & Soil Physics';
    course.milestones[0].evidencePrompt = 'Submit calibrated soil moisture CSV and thermal decay chart.';
    course.milestones[0].approvedByCoach = true;

    // 5. Save, leave, and reopen draft without data loss
    const savedDraft = saveDraft(course);
    expect(savedDraft.id).toBeDefined();

    const reopened = getDraft(savedDraft.id);
    expect(reopened.title).toBe('EcoCool: Smart Urban Heat & Community Garden Monitor');
    expect(reopened.milestones[0].title).toBe('Microclimates & Soil Physics');
    expect(reopened.milestones[0].approvedByCoach).toBe(true);

    // 6. Review alignment
    const alignment = checkCurriculumAlignment(reopened);
    expect(alignment.isValid).toBe(true);
    expect(alignment.stats.coveredObjectives).toBe(2);

    // 7. Preview learner experience (renders JSX to string without error)
    const learnerPreviewHtml = renderToString(
      createElement(CourseAlignmentStep, {
        course: reopened,
        onPublish: () => {},
        publishing: false,
        publishError: null,
        publishResult: null
      })
    );
    expect(learnerPreviewHtml).toContain('Curriculum Alignment Matrix');
    expect(learnerPreviewHtml).toContain('EcoCool');

    // 8. Publish course with correct permissions
    const coachUid = 'coach-donovan-123';
    const publishRes = await publishProgramToCatalog(
      {
        id: 'ecocool-smart-garden-published-2026',
        unitTitle: reopened.title,
        theme: reopened.theme,
        drivingQuestion: reopened.drivingQuestion,
        realProblem: {
          summary: reopened.drivingQuestion,
          peopleImpact: 'Protects crops and elders',
          environmentalImpact: 'Cuts irrigation waste'
        },
        targetLearner: { id: 'universal-all', name: 'All Learners', isUniversal: true },
        makerSpaceSpecs: [],
        coachCues: {
          leadCoach: 'Coach Donovan',
          initiationCue: 'Guide initial research',
          frustrationDeescalationCue: 'Scaffold sensor calibration',
          midCheckCue: 'Formative check',
          showcaseCue: 'Celebrate garden deployment'
        },
        milestones: reopened.milestones
      },
      coachUid
    );

    expect(publishRes.success).toBe(true);
    expect(publishRes.programId).toBe('ecocool-smart-garden-published-2026');

    // 9. Confirm course appears correctly for authorized learner in custom program store
    const storedProgram = getCustomProgramById('ecocool-smart-garden-published-2026');
    expect(storedProgram).not.toBeNull();
    expect(storedProgram.title).toBe('EcoCool: Smart Urban Heat & Community Garden Monitor');
    expect(storedProgram.authorId).toBe(coachUid);
    expect(storedProgram.status).toBe('published');
    expect(storedProgram.visibility).toBe('centre');
    expect(storedProgram.phases.length).toBe(8);
  });
});

describe('Course Maker & Courses Hub — UI Component Rendering', () => {
  it('renders CoursesHub for coach with dedicated My Courses, Create Course, and Import Course tabs', () => {
    const html = renderToString(
      createElement(CoursesHub, {
        role: 'teacher',
        coachUser: { uid: 'teacher-1', displayName: 'Coach Sara', role: 'teacher' },
        isPrimary: false,
        displayName: 'Coach Sara',
        uid: 'teacher-1'
      })
    );

    expect(html).toContain('Course Management &amp; Curriculum');
    expect(html).toContain('My Courses');
    expect(html).toContain('Create Course');
    expect(html).toContain('Import Course');
  });

  it('renders CourseMaker 5-step guided wizard', () => {
    const html = renderToString(
      createElement(CourseMaker, {
        coachUser: { uid: 'coach-1', displayName: 'Coach Donovan' }
      })
    );

    expect(html).toContain('Course Maker');
    expect(html).toContain('Step 1 — Course Basics');
    expect(html).toContain('Target Learner Level / Age Band');
    expect(html).toContain('Learning Objectives');
    expect(html).toContain('Save Draft');
    expect(html).toContain('Continue');
  });
});
