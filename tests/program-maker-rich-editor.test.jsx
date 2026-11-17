// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createBlankEightPhaseUnit,
  createBlock,
  normalizeContentBlocks,
  sanitizeRichHtml,
  parseVideoSource,
  programToUnit
} from '../src/features/coach/studio/richContentModel.js';
import { convertUnitToProgram, saveProgramDraft } from '../src/features/coach/studio/pblTransferService.js';
import { normaliseContractProgram } from '../src/services/pblService.js';
import { coverFor } from '../src/features/pbl/programs/programMedia.js';
import { RichContentRenderer } from '../src/features/pbl/programs/RichContentRenderer.jsx';
import { RichPhaseEditor } from '../src/features/coach/studio/RichPhaseEditor.jsx';
import { ProgramPreviewModal } from '../src/features/coach/studio/ProgramPreviewModal.jsx';

describe('Program Maker Rich Content Model & Workflow', () => {
  let host;
  let root;

  beforeEach(() => {
    localStorage.clear();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    host?.remove();
  });

  it('creates a blank 8-phase program with customizable titles and descriptions', () => {
    const unit = createBlankEightPhaseUnit('coach-123');
    expect(unit.milestones).toHaveLength(8);
    expect(unit.status).toBe('draft');
    expect(unit.authorId).toBe('coach-123');
    expect(unit.milestones[0].stageNumber).toBe(1);
    expect(unit.milestones[7].stageNumber).toBe(8);
    expect(unit.milestones.every((m) => Array.isArray(m.contentBlocks))).toBe(true);
  });

  it('sanitizes rich text HTML while preserving safe formatting and links', () => {
    const dirty = '<p>Hello <strong>World</strong> <script>alert(1)</script><a href="javascript:evil()" onclick="steal()">bad</a> <a href="https://welearn.org">good</a></p>';
    const clean = sanitizeRichHtml(dirty);
    expect(clean).toContain('<strong>World</strong>');
    expect(clean).toContain('href="https://welearn.org"');
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('javascript:');
    expect(clean).not.toContain('onclick');
  });

  it('parses YouTube, Vimeo, and direct MP4/WebM video URLs', () => {
    expect(parseVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.embedUrl)
      .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(parseVideoSource('https://youtu.be/dQw4w9WgXcQ')?.provider).toBe('YouTube');
    expect(parseVideoSource('https://vimeo.com/123456789')?.embedUrl)
      .toBe('https://player.vimeo.com/video/123456789');
    expect(parseVideoSource('https://cdn.example.com/lesson.mp4')?.kind).toBe('video');
    expect(parseVideoSource('not-a-url')).toBeNull();
  });

  it('preserves cover image, metadata, and all 8 phases with rich blocks across draft -> reopen -> publish without duplicates', async () => {
    const unit = createBlankEightPhaseUnit('coach-1');
    const originalId = unit.id;
    unit.unitTitle = 'Solar Microgrid Lab';
    unit.subtitle = 'Hands-On Clean Energy Engineering';
    unit.introduction = 'Students design and test a community microgrid.';
    unit.coverImage = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    unit.category = 'Sustainability & Climate';
    unit.tags = ['solar', 'microgrid', 'engineering'];
    unit.tone = 'green';

    // Edit all 8 phases with different content block types
    unit.milestones[0].title = 'Phase 1: Energy Audit';
    unit.milestones[0].learningGoal = 'Measure campus energy usage.';
    unit.milestones[0].contentBlocks = [
      createBlock('heading', { level: 2, text: 'Welcome to Phase 1' }),
      createBlock('richtext', { html: '<p>Read the <strong>brief</strong> carefully.</p>' }),
      createBlock('video', { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Intro Video' }),
      createBlock('checklist', {
        title: 'Phase 1 Tasks',
        items: [{ id: 'c1', label: 'Inspect solar panel', required: true }]
      })
    ];
    unit.milestones[1].contentBlocks = [createBlock('image', { url: 'https://example.com/diagram.png', alt: 'Diagram' })];
    unit.milestones[2].contentBlocks = [createBlock('gallery', { title: 'Site Photos', items: [{ id: 'g1', url: 'https://example.com/1.jpg', alt: '1', caption: 'Roof' }] })];
    unit.milestones[3].contentBlocks = [createBlock('table', { headers: ['Part', 'Qty'], rows: [['Panel', '2']] })];
    unit.milestones[4].contentBlocks = [createBlock('activity', { title: 'Solder Busbars', durationMin: 60, instructions: 'Follow safety steps', materials: ['Iron', 'Solder'], deliverable: 'Tested array' })];
    unit.milestones[5].contentBlocks = [createBlock('list', { style: 'numbered', items: ['Measure voltage', 'Log current'] })];
    unit.milestones[6].contentBlocks = [createBlock('link', { title: 'NREL Data', url: 'https://www.nrel.gov', description: 'Solar irradiance maps' })];
    unit.milestones[7].contentBlocks = [
      createBlock('attachment', { fileName: 'Rubric.pdf', url: 'https://example.com/rubric.pdf', fileSize: 12000 }),
      createBlock('callout', { tone: 'tip', title: 'Pitch Tip', text: 'Show live telemetry!' }),
      createBlock('divider')
    ];

    // 1. Save as draft
    const draftRes = await saveProgramDraft(unit, 'coach-1');
    expect(draftRes.success).toBe(true);
    expect(draftRes.programId).toBe(originalId);
    expect(draftRes.program.status).toBe('draft');

    // 2. Reopen and edit without creating a duplicate ID
    const normalized = normaliseContractProgram(draftRes.program);
    expect(coverFor(normalized)?.url).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');

    const reopened = programToUnit(normalized);
    expect(reopened.id).toBe(originalId);
    expect(reopened.unitTitle).toBe('Solar Microgrid Lab');
    expect(reopened.subtitle).toBe('Hands-On Clean Energy Engineering');
    expect(reopened.introduction).toBe('Students design and test a community microgrid.');
    expect(reopened.coverImage).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    expect(reopened.milestones).toHaveLength(8);
    expect(reopened.milestones[0].contentBlocks).toHaveLength(4);
    expect(reopened.milestones[7].contentBlocks).toHaveLength(3);

    // 3. Publish
    const published = convertUnitToProgram(reopened, 'coach-1', { status: 'published' });
    expect(published.id).toBe(originalId);
    expect(published.status).toBe('published');
    expect(published.phases).toHaveLength(8);
    expect(published.phases[0].contentBlocks).toHaveLength(4);
  });

  it('renders RichContentRenderer blocks and toggles interactive checklists', () => {
    const blocks = normalizeContentBlocks([
      createBlock('heading', { level: 2, text: 'Stage Guide' }),
      createBlock('richtext', { html: '<p>Follow <em>every</em> step.</p>' }),
      createBlock('checklist', {
        id: 'chk-blk',
        title: 'Safety Checks',
        items: [{ id: 'item-1', label: 'Wear goggles', required: true }]
      }),
      createBlock('table', { headers: ['Metric', 'Target'], rows: [['Output', '12V']] }),
      createBlock('activity', { title: 'Build Frame', durationMin: 45, instructions: 'Assemble struts', materials: ['Wood'], deliverable: 'Frame photo' }),
      createBlock('link', { title: 'Docs', url: 'https://example.org', description: 'Reference' }),
      createBlock('attachment', { fileName: 'Guide.pdf', url: 'https://example.org/guide.pdf', fileSize: 2048 })
    ]);

    const onToggle = vi.fn();
    act(() => {
      root.render(<RichContentRenderer blocks={blocks} checkedMap={{}} onToggleCheck={onToggle} />);
    });

    expect(host.textContent).toContain('Stage Guide');
    expect(host.textContent).toContain('Safety Checks');
    expect(host.textContent).toContain('12V');
    expect(host.textContent).toContain('Build Frame');
    expect(host.textContent).toContain('Guide.pdf');

    const checkBtn = Array.from(host.querySelectorAll('button')).find((b) => b.textContent.includes('Wear goggles'));
    expect(checkBtn).toBeTruthy();
    act(() => {
      checkBtn.click();
    });
    expect(onToggle).toHaveBeenCalledWith('chk-blk:item-1');
  });

  it('renders RichPhaseEditor and allows adding and deleting blocks', () => {
    const unit = createBlankEightPhaseUnit('coach-1');
    let current = unit.milestones[0];
    const handleChange = vi.fn((patch) => {
      current = { ...current, ...patch };
    });

    act(() => {
      root.render(<RichPhaseEditor milestone={current} phaseIndex={0} onChangeMilestone={handleChange} />);
    });

    const headingBtn = Array.from(host.querySelectorAll('.re-insert-pill')).find((b) => b.textContent.includes('Heading'));
    expect(headingBtn).toBeTruthy();
    act(() => {
      headingBtn.click();
    });
    expect(handleChange).toHaveBeenCalled();
    expect(current.contentBlocks.length).toBe(1);
    expect(current.contentBlocks[0].type).toBe('heading');

    act(() => {
      root.render(<RichPhaseEditor milestone={current} phaseIndex={0} onChangeMilestone={handleChange} />);
    });
    const deleteBtn = host.querySelector('button[title="Delete block"]');
    expect(deleteBtn).toBeTruthy();
    act(() => {
      deleteBtn.click();
    });
    expect(current.contentBlocks.length).toBe(0);
  });

  it('renders ProgramPreviewModal with 8-phase navigation and cover image', () => {
    const unit = createBlankEightPhaseUnit('coach-1');
    unit.unitTitle = 'Ocean Robotics';
    unit.subtitle = 'Underwater ROV Challenge';
    unit.coverImage = 'https://example.com/rov.jpg';
    unit.milestones[0].contentBlocks = [createBlock('heading', { level: 2, text: 'Phase 1 Intro' })];
    unit.milestones[1].contentBlocks = [createBlock('heading', { level: 2, text: 'Phase 2 Research' })];

    act(() => {
      root.render(<ProgramPreviewModal isOpen onClose={vi.fn()} unit={unit} />);
    });

    expect(host.textContent).toContain('Ocean Robotics');
    expect(host.textContent).toContain('Underwater ROV Challenge');
    expect(host.textContent).toContain('Phase 1 Intro');

    const phase2Btn = Array.from(host.querySelectorAll('.re-preview-phase-tab')).find((b) => b.textContent.includes('Empathy & Research'));
    expect(phase2Btn).toBeTruthy();
    act(() => {
      phase2Btn.click();
    });
    expect(host.textContent).toContain('Phase 2 Research');
  });
});
