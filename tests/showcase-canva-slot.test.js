import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { Showcase } from '../src/features/pbl/Showcase.jsx';
import { newProject } from '../src/features/pbl/engine/pblProject.js';

describe('Showcase Canva slot', () => {
  it('offers Open Canva and a disabled connect action when there is no Canva design', () => {
    globalThis.React = React;
    const project = { ...newProject('term-test'), evidence: [] };
    const html = renderToString(createElement(Showcase, { project, displayName: 'Test' }));
    expect(html).toContain('Make your showcase poster in Canva');
    expect(html).toContain('href="https://www.canva.com/create/"');
    expect(html).toContain('coming soon');
  });

  it('hides the slot once a Canva design is in the evidence', () => {
    globalThis.React = React;
    const project = { ...newProject('term-test'), evidence: [{ id: 'e1', phase: 'showcase', kind: 'design', title: 'Poster', link: 'https://www.canva.com/design/DAAAAAAAAA/abcdef123/view', createdAt: 1 }] };
    const html = renderToString(createElement(Showcase, { project, displayName: 'Test' }));
    expect(html).not.toContain('Make your showcase poster in Canva');
  });
});
