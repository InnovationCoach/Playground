import { describe, it, expect } from 'vitest';
import { hydratePrefs } from '../src/features/dashboard/dashboardModel.js';
import { addPage, removePage, changePage, reorderTool } from '../src/features/dashboard/workspaceModel.js';
describe('personal dashboard migration', () => {
  it('preserves legacy visibility/order and validates stored styles and pages', () => {
    const p = hydratePrefs({ hidden: ['notes'], order: ['skill'], font: 'url(evil)', pages: [] });
    expect(p.pages[0].hidden).toEqual(['notes']); expect(p.pages[0].order[0]).toBe('skill'); expect(p.font).toBe('brand');
    expect(hydratePrefs({ pages: [{ order: ['ghost', 'notes', 'notes'], hidden: ['ghost'], sizes: { notes: 'giant' } }], activePage: 99 }).pages[0].sizes.notes).toBe('compact');
  });
  it('saves independent page sizes, order and visibility through round trip and deletion', () => {
    let p = addPage(hydratePrefs(null));
    p = changePage(p, s => ({ ...reorderTool(s, 'notes', 'focus'), hidden: ['skill'], sizes: { ...s.sizes, notes: 'wide' } }));
    p = hydratePrefs(JSON.parse(JSON.stringify(p)));
    expect(p.pages[0].hidden).toEqual([]); expect(p.pages[1].hidden).toEqual(['skill']);
    expect(p.pages[1].sizes.notes).toBe('wide'); expect(p.pages[1].order[0]).toBe('notes');
    expect(removePage(p).pages).toHaveLength(1);
    for (let i = 0; i < 10; i++) p = addPage(p);
    expect(p.pages).toHaveLength(5);
  });
});
