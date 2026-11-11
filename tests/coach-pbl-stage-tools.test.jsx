// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseYouTubeVideoUrl, generateStageMaterials } from '../src/features/coach/programs/stageMaterialsAi.js';
import { getVideoLibrary, saveProgramCustomization, getProgram } from '../src/services/pblService.js';
import { StudentStageViewer } from '../src/features/pbl/programs/StudentStageViewer.jsx';
import { StageEditorModal } from '../src/features/coach/programs/StageEditorModal.jsx';
import { cohortForClass } from '../src/features/coach/ClassProgramsPanel.jsx';

describe('Cohort Classification (WLS vs WHS)', () => {
  it('correctly classifies Lower Secondary (WLS) classes', () => {
    expect(cohortForClass({ name: 'Climate Champions 7A' })).toBe('WLS');
    expect(cohortForClass({ name: 'Lower Secondary A (Year 9)' })).toBe('WLS');
    expect(cohortForClass({ name: 'Year 8 STEAM' })).toBe('WLS');
    expect(cohortForClass({ cohortId: 'WLS', name: 'Makerspace' })).toBe('WLS');
  });

  it('correctly classifies Higher Secondary (WHS) classes', () => {
    expect(cohortForClass({ name: 'WPR Year 11 Climate' })).toBe('WHS');
    expect(cohortForClass({ name: 'Higher Secondary A (Year 12)' })).toBe('WHS');
    expect(cohortForClass({ name: 'Year 10 Robotics' })).toBe('WHS');
    expect(cohortForClass({ cohortId: 'WHS', name: 'Biotech Lab' })).toBe('WHS');
  });
});

describe('Stage Materials AI & Video Parsing', () => {
  it('parses standard YouTube watch URLs into privacy-preserving nocookie embeds', () => {
    const res = parseYouTubeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(res.valid).toBe(true);
    expect(res.type).toBe('video');
    expect(res.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(res.id).toBe('dQw4w9WgXcQ');
  });

  it('parses short youtu.be URLs', () => {
    const res = parseYouTubeVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(res.valid).toBe(true);
    expect(res.type).toBe('video');
    expect(res.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('parses YouTube playlist URLs', () => {
    const res = parseYouTubeVideoUrl('https://www.youtube.com/playlist?list=PL1234567890ABCDEF');
    expect(res.valid).toBe(true);
    expect(res.type).toBe('playlist');
    expect(res.embedUrl).toBe('https://www.youtube-nocookie.com/embed/videoseries?list=PL1234567890ABCDEF');
  });

  it('rejects invalid or non-YouTube URLs gracefully with helpful error', () => {
    const res = parseYouTubeVideoUrl('https://randomsite.com/video');
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Unsupported video platform/i);
  });

  it('generates structured slides, quiz, and practical activity', async () => {
    const stage = {
      id: 'phase-1',
      title: 'Biomimicry Aerodynamics',
      learningGoal: 'Investigate sharkskin riblets and air resistance',
      checklist: ['Research riblets', 'Build 3D wing model', 'Wind tunnel test']
    };
    const program = {
      title: 'Sharkskin Aerodynamics',
      drivingQuestion: 'How can nature inspire faster vehicles?',
      ageBand: '11-14'
    };

    const materials = await generateStageMaterials({ type: 'all', stage, program });
    expect(materials.slides).toBeDefined();
    expect(materials.slides.length).toBeGreaterThanOrEqual(4);
    expect(materials.slides[0].heading).toContain('Biomimicry Aerodynamics');

    expect(materials.quiz).toBeDefined();
    expect(materials.quiz.length).toBeGreaterThanOrEqual(3);
    expect(materials.quiz[0].explanation).toBeDefined();

    expect(materials.activity).toBeDefined();
    expect(materials.activity.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('supports refinements: simpler language, less text, and add a challenge', async () => {
    const stage = {
      id: 'phase-2',
      title: 'Wind Tunnel Testing',
      learningGoal: 'Measure drag telemetry'
    };

    const simpler = await generateStageMaterials({ type: 'slides', stage, refinement: 'simpler' });
    expect(simpler.slides[0].heading).toContain("Let's Explore");

    const challenge = await generateStageMaterials({ type: 'quiz', stage, refinement: 'add-challenge' });
    expect(challenge.quiz.length).toBe(4);
    expect(challenge.quiz[3].prompt).toContain('Extension Challenge');
  });
});

describe('PBL Customization & Video Library Services', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('extracts ordered video library across all stages', () => {
    const mockProgram = {
      id: 'test-prog',
      title: 'Test Program',
      phases: [
        {
          id: 'ph-1',
          title: 'Stage 1',
          weeks: [1, 2],
          videos: [
            { id: 'v1', title: 'Intro to Prototyping', embedUrl: 'https://youtube-nocookie.com/embed/1' }
          ]
        },
        {
          id: 'ph-2',
          title: 'Stage 2',
          weeks: [3, 4],
          videos: [
            { id: 'v2', title: 'Wind Tunnel Test', embedUrl: 'https://youtube-nocookie.com/embed/2' }
          ]
        }
      ]
    };

    const lib = getVideoLibrary(mockProgram);
    expect(lib.length).toBe(2);
    expect(lib[0].stageNumber).toBe(1);
    expect(lib[0].stageTitle).toBe('Stage 1');
    expect(lib[1].stageNumber).toBe(2);
  });

  it('saves program customizer to localStorage and allows getProgram to retrieve it', async () => {
    await saveProgramCustomization('entrepreneurship-product-creation-2026', (prog) => ({
      ...prog,
      phases: [{ id: 'phase-1', title: 'Customized Stage 1' }]
    }));

    const fetched = await getProgram('entrepreneurship-product-creation-2026');
    expect(fetched.status).toBe('found');
    expect(fetched.program.phases[0].title).toBe('Customized Stage 1');
  });

  it('supports cohort overrides separately from master template', async () => {
    await saveProgramCustomization(
      'entrepreneurship-product-creation-2026',
      { phases: [{ id: 'phase-1', title: 'Alpha Cohort Specific Stage' }] },
      { cohortId: 'cohort-alpha' }
    );

    // Master template
    const master = await getProgram('entrepreneurship-product-creation-2026');
    expect(master.program.cohortOverrides['cohort-alpha']).toBeDefined();

    // Cohort view
    const cohortAlpha = await getProgram('entrepreneurship-product-creation-2026', { cohortId: 'cohort-alpha' });
    expect(cohortAlpha.program.phases[0].title).toBe('Alpha Cohort Specific Stage');
  });
});

describe('StudentStageViewer and StageEditorModal UI', () => {
  let host, root;
  const flush = () => act(async () => { await Promise.resolve(); });

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    if (host) host.remove();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  const mockStage = {
    id: 'stage-1',
    title: 'Customer Discovery',
    weeks: [1, 2],
    learningGoal: 'Interview 5 potential users',
    instructions: 'Prepare your question script before conducting interviews.',
    checklist: [
      { id: 'c1', label: 'Write 5 unbiased questions', required: true },
      { id: 'c2', label: 'Record audio responses', required: false }
    ],
    videos: [
      {
        id: 'v1',
        title: 'Interview Techniques',
        embedUrl: 'https://www.youtube-nocookie.com/embed/abc',
        description: 'How to avoid leading questions'
      }
    ],
    slides: [
      {
        id: 's1',
        slideNumber: 1,
        heading: 'Customer Discovery 101',
        subheading: 'Listen without pitching',
        bullets: ['Ask open-ended questions', 'Observe non-verbal cues'],
        speakerNotes: 'Remind learners not to defend their idea yet.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'What makes a question biased?',
        options: [
          'It hints at the desired answer',
          'It is asked politely',
          'It is recorded in a notebook',
          'It takes 2 minutes to answer'
        ],
        correctIndex: 0,
        explanation: 'Leading questions skew user responses and produce false positives.'
      }
    ]
  };

  it('renders preview mode banner with simulation disclosure', async () => {
    await act(async () => {
      root.render(<StudentStageViewer stage={mockStage} isPreview={true} />);
    });
    await flush();

    const banner = host.querySelector('.pb-preview-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Coach Student Preview');
    expect(banner.textContent).toContain('read-only and will not write to student records');
  });

  it('allows interactive simulation of checklist in preview mode without mutations', async () => {
    await act(async () => {
      root.render(<StudentStageViewer stage={mockStage} isPreview={true} />);
    });
    await flush();

    const checkbox = host.querySelector('.pb-check-input');
    expect(checkbox.checked).toBe(false);

    await act(async () => {
      checkbox.click();
    });
    await flush();

    expect(checkbox.checked).toBe(true);
  });

  it('provides immediate explanatory feedback on formative quiz answers', async () => {
    await act(async () => {
      root.render(<StudentStageViewer stage={mockStage} isPreview={true} />);
    });
    await flush();

    // Click on quiz tab button
    const quizNavBtn = [...host.querySelectorAll('.pb-stage-nav-btn')].find((b) => b.textContent.includes('Concept Quiz'));
    expect(quizNavBtn).toBeDefined();

    await act(async () => {
      quizNavBtn.click();
    });
    await flush();

    // Select the first option
    const optionBtn = host.querySelector('.pb-quiz-option-btn');
    expect(optionBtn).not.toBeNull();

    await act(async () => {
      optionBtn.click();
    });
    await flush();

    expect(host.textContent).toContain('Correct!');
    expect(host.textContent).toContain('Leading questions skew user responses');
  });

  it('renders StageEditorModal with stage details and scope switch', async () => {
    const mockProgram = {
      id: 'entrepreneurship-2026',
      title: 'Teen Founder',
      phases: [mockStage]
    };

    await act(async () => {
      root.render(
        <StageEditorModal
          isOpen={true}
          onClose={vi.fn()}
          program={mockProgram}
          stageIndex={0}
        />
      );
    });
    await flush();

    expect(host.querySelector('.pb-modal-container')).not.toBeNull();
    expect(host.textContent).toContain('Stage Studio & Curriculum Editor');
    expect(host.textContent).toContain('Shared Program Template');
    expect(host.textContent).toContain('Details & Checklist');
    expect(host.textContent).toContain('Videos & Playlists');
    expect(host.textContent).toContain('AI Materials');
  });
});
