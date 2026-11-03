// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeLesson, emptyStep, emptyLesson, flattenStepsInstructions } from '../src/features/school/lessons/lessonModel.js';
import { CompactLessonList } from '../src/features/school/lessons/CompactLessonList.jsx';
import { LearnerLessonView } from '../src/features/school/lessons/LearnerLessonView.jsx';
import { CoachLessonEditor } from '../src/features/school/lessons/CoachLessonEditor.jsx';

let host, root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Lesson Model and Normalization', () => {
  it('hydrates legacy instructions into a structured step without data loss', () => {
    const legacy = {
      title: 'Hex-City Thailand',
      outcome: 'Understand floating city constraints',
      instructions: 'Review Architecture, Energy, and Water/Waste requirements.',
      classId: 'class-1',
      milestoneId: 'explore'
    };

    const normalized = normalizeLesson(legacy);
    expect(normalized.title).toBe('Hex-City Thailand');
    expect(normalized.steps).toHaveLength(1);
    expect(normalized.steps[0].title).toBe('Lesson overview & instructions');
    expect(normalized.steps[0].instructions).toContain('Architecture, Energy');
    expect(normalized.estimatedMinutes).toBe(45);
  });

  it('preserves structured steps and resolves competency metadata', () => {
    const structured = {
      title: 'Solar Microgrid',
      outcome: 'Design solar circuit',
      competencyIds: ['sdl-01', 'ctps-01'],
      steps: [
        { id: 's1', order: 1, title: 'Check voltage', type: 'task', instructions: 'Use multimeter', durationMinutes: 20 },
        { id: 's2', order: 2, title: 'Record reflection', type: 'reflection', instructions: 'Write log', durationMinutes: 15 }
      ]
    };

    const normalized = normalizeLesson(structured);
    expect(normalized.steps).toHaveLength(2);
    expect(normalized.estimatedMinutes).toBe(35);
    expect(normalized.competencies.length).toBeGreaterThan(0);
    expect(normalized.competencies[0].id).toBe('sdl-01');
  });
});

describe('CompactLessonList Component', () => {
  const sampleLessons = [
    {
      id: 'l1',
      title: 'Hex-City: Design a resilient floating city',
      outcome: 'Identify interacting city constraints',
      status: 'published',
      revision: 2,
      milestoneId: 'explore',
      competencyIds: ['sdl-01', 'ctps-01'],
      steps: [
        { id: 's1', order: 1, title: 'Understand challenge', type: 'introduction', durationMinutes: 15 },
        { id: 's2', order: 2, title: 'Build model', type: 'task', durationMinutes: 30 }
      ]
    },
    {
      id: 'l2',
      title: 'Hex-City: Role investigations',
      outcome: 'Explore specialty roles',
      status: 'draft',
      revision: 1,
      milestoneId: 'experiment',
      competencyIds: [],
      instructions: 'Investigate architecture and energy.'
    }
  ];

  const template = {
    milestones: [
      { id: 'explore', title: 'Phase 1: Explore' },
      { id: 'experiment', title: 'Phase 2: Experiment' }
    ]
  };

  it('renders sequence numbers, titles, duration pills, and status badges', async () => {
    await act(async () => {
      root.render(
        <CompactLessonList
          lessons={sampleLessons}
          template={template}
          isStaff={true}
        />
      );
    });

    expect(host.textContent).toContain('Hex-City: Design a resilient floating city');
    expect(host.textContent).toContain('Hex-City: Role investigations');
    expect(host.textContent).toContain('#1');
    expect(host.textContent).toContain('#2');
    expect(host.textContent).toContain('45m');
    expect(host.textContent).toContain('Published');
    expect(host.textContent).toContain('Draft');
  });

  it('triggers onPreview and onEdit callbacks', async () => {
    const onPreview = vi.fn();
    const onEdit = vi.fn();

    await act(async () => {
      root.render(
        <CompactLessonList
          lessons={sampleLessons}
          template={template}
          isStaff={true}
          onPreview={onPreview}
          onEdit={onEdit}
        />
      );
    });

    const previewBtns = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Preview'));
    expect(previewBtns.length).toBe(2);
    await act(async () => {
      previewBtns[0].click();
    });
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }));

    const editBtns = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Edit'));
    expect(editBtns.length).toBe(1); // Only for draft lesson
    await act(async () => {
      editBtns[0].click();
    });
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'l2' }));
  });
});

describe('LearnerLessonView Component', () => {
  const lesson = {
    id: 'l1',
    title: 'Hex-City: Floating City Design',
    outcome: 'Design a resilient urban structure under environmental constraints',
    estimatedMinutes: 60,
    successCriteria: [
      'Identified constraints for buoyancy and power',
      'Selected a team role and agreed duties'
    ],
    steps: [
      { id: 'step-1', order: 1, title: 'Understand constraints', type: 'introduction', instructions: 'Read the brief and review Architecture and Energy roles.', durationMinutes: 20 },
      { id: 'step-2', order: 2, title: 'Build prototype', type: 'task', instructions: 'Construct the scale model in teams.', durationMinutes: 40 }
    ]
  };

  it('renders step progress navigation, active step content, and success criteria', async () => {
    await act(async () => {
      root.render(<LearnerLessonView lesson={lesson} />);
    });

    expect(host.textContent).toContain('Hex-City: Floating City Design');
    expect(host.textContent).toContain('What am I learning?');
    expect(host.textContent).toContain('Step 1: Understand constraints');
    expect(host.textContent).toContain('How will I know I have mastered it?');
    expect(host.textContent).toContain('Identified constraints for buoyancy and power');

    // Role cards extraction
    expect(host.textContent).toContain('Specialist roles for this activity');
    expect(host.textContent).toContain('Architecture Specialist');
    expect(host.textContent).toContain('Energy Specialist');
  });

  it('advances step when Complete Step is clicked', async () => {
    await act(async () => {
      root.render(<LearnerLessonView lesson={lesson} />);
    });

    const completeBtn = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Complete step 1'));
    expect(completeBtn).toBeTruthy();

    await act(async () => {
      completeBtn.click();
    });

    expect(host.textContent).toContain('Step 2: Build prototype');
  });
});

describe('CoachLessonEditor Component', () => {
  const draft = emptyLesson('class-1', 'm1');
  const template = { milestones: [{ id: 'm1', title: 'Phase 1' }] };
  const choices = [{ id: 'class-1', name: 'Class 9A' }];

  it('renders the 6-section navigation and switches sections smoothly', async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <CoachLessonEditor
          draft={draft}
          onChange={onChange}
          choices={choices}
          template={template}
        />
      );
    });

    expect(host.textContent).toContain('1. Overview');
    expect(host.textContent).toContain('2. Competencies');
    expect(host.textContent).toContain('3. Success Criteria');
    expect(host.textContent).toContain('4. Learning Steps');
    expect(host.textContent).toContain('5. Evidence & Feedback');
    expect(host.textContent).toContain('6. Preview & Publish');

    // Switch to Competencies section
    const compTab = [...host.querySelectorAll('button')].find(b => b.textContent.includes('2. Competencies'));
    await act(async () => {
      compTab.click();
    });
    expect(host.textContent).toContain('Select competencies from the approved WeLearn Academy framework');

    // Switch to Learning Steps
    const stepsTab = [...host.querySelectorAll('button')].find(b => b.textContent.includes('4. Learning Steps'));
    await act(async () => {
      stepsTab.click();
    });
    expect(host.textContent).toContain('Break the lesson into ordered blocks');
    expect(host.textContent).toContain('Add step');
  });
});
