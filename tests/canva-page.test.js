import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { checkViewLink } from '../src/features/canva/CanvaPage.jsx';

describe('Canva Studio link check', () => {
  it('accepts a Canva view link', () => {
    expect(checkViewLink('https://www.canva.com/design/DAGabc123XY/abcdef123456/view').ok).toBe(true);
  });

  it('refuses an edit link with a reason the learner can act on', () => {
    const r = checkViewLink('https://www.canva.com/design/DAGabc123XY/abcdef123456/edit');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Anyone with the link/);
  });

  it('refuses short links, other sites, and empty input', () => {
    expect(checkViewLink('https://canva.link/x').reason).toMatch(/Short/);
    expect(checkViewLink('https://example.com/design/a/b/view').ok).toBe(false);
    expect(checkViewLink('   ').reason).toMatch(/Paste/);
  });
});

describe('Canva Studio renders', () => {
  const render = async (props) => {
    globalThis.React = React;
    const mod = await import('../src/features/canva/CanvaPage.jsx');
    return renderToString(createElement(mod.CanvaPage, props));
  };

  it('shows connect and the starters for a learner', async () => {
    const html = await render({ uid: 'u1', role: 'student' });
    // Before the status check finishes the page shows Checking, not a connect button.
    expect(html).toContain('Checking');
    expect(html).not.toContain('Connect with Canva');
    expect(html).toContain('Start a design');
    expect(html).toContain('https://www.canva.com/create/presentations/');
    expect(html).not.toContain('For coaches');
  });

  it('shows the coach guide to coaches', async () => {
    const html = await render({ uid: 'c1', role: 'coach' });
    expect(html).toContain('For coaches');
  });

  it('has no native blocking dialogs or inline colour styles left', async () => {
    const src = (await import('node:fs')).readFileSync(new URL('../src/features/canva/CanvaPage.jsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/\balert\(|\bconfirm\(/);
    expect(src).not.toMatch(/style=\{\{/);
  });
});
