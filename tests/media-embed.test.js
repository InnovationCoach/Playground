import { describe, it, expect } from 'vitest';
import { embedFor } from '../src/features/pbl/engine/mediaEmbed.js';
import { newProject, addEvidence, hydrateProject } from '../src/features/pbl/engine/pblProject.js';
import { EVIDENCE_KINDS, TERM } from '../src/features/pbl/content/pblModel.js';

const CANVA_VIEW = 'https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/view?utm_content=DAG&utm_campaign=share';

describe('embedFor', () => {
  it('turns a Canva view link into Canva’s embed address', () => {
    expect(embedFor(CANVA_VIEW)).toEqual({ type: 'canva', provider: 'Canva', src: 'https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/view?embed' });
    expect(embedFor('https://canva.com/design/DAGabc12345/Xy_z-9876abc/watch').type).toBe('canva');
  });

  it('explains Canva links that cannot be shown', () => {
    expect(embedFor('https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/edit').hint).toMatch(/edit link/);
    expect(embedFor('https://canva.link/abc123').hint).toMatch(/canva\.link/);
    expect(embedFor('https://www.canva.com/templates/').hint).toBeTruthy();
    expect(embedFor('https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/edit').src).toBeUndefined();
  });

  it('shows Cloudinary images and videos, nothing else from Cloudinary', () => {
    expect(embedFor('https://res.cloudinary.com/welearn/image/upload/v1/portfolio/robot.jpg')).toMatchObject({ type: 'image', provider: 'Cloudinary' });
    expect(embedFor('https://res.cloudinary.com/welearn/video/upload/v1/demo.mp4')).toMatchObject({ type: 'video' });
    expect(embedFor('https://res.cloudinary.com/welearn/raw/upload/v1/file.pdf')).toBeNull();
  });

  it('embeds YouTube through youtube-nocookie only, with a valid id', () => {
    const want = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
    for (const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=3']) {
      expect(embedFor(u).src).toBe(want);
    }
    expect(embedFor('https://www.youtube.com/watch?v=bad"><script>')).toBeNull();
  });

  it('never embeds other sites, plain http, or non-URLs', () => {
    for (const u of ['https://example.com/a.png', 'http://www.canva.com/design/DAGabc12345/Xy_z-9876abc/view', 'javascript:alert(1)', 'https://evil.com/res.cloudinary.com/x/image/upload/a.png', 'https://www.canva.com.evil.com/design/DAGabc12345/Xy_z-9876abc/view', '', null]) {
      expect(embedFor(u)?.src).toBeUndefined();
    }
  });
});

describe('Canva design evidence', () => {
  const p = newProject(TERM.id);
  it('is an evidence type', () => expect(EVIDENCE_KINDS.map((k) => k.id)).toContain('design'));

  it('needs a Canva link that can be shown', () => {
    expect(addEvidence(p, { kind: 'design', title: 'Poster', link: '' }).error).toMatch(/share link/);
    expect(addEvidence(p, { kind: 'design', title: 'Poster', link: 'https://www.canva.com/design/DAGabc12345/Xy_z-9876abc/edit' }).error).toMatch(/edit link/);
    const ok = addEvidence(p, { kind: 'design', title: 'Poster', link: CANVA_VIEW, phase: 'ideate' });
    expect(ok.error).toBeUndefined();
    expect(hydrateProject(ok.project, TERM.id).evidence[0].kind).toBe('design');
  });

  it('other types keep links optional', () => {
    expect(addEvidence(p, { kind: 'media', title: 'Photo', link: 'https://example.com/photo.jpg' }).error).toBeUndefined();
  });
});
