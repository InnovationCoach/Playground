// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { AttendancePanel, LeavePanel, InventoryPanel, PilotHome } from '../src/features/admin/pilot/PilotOperations.jsx';
let host, root;
async function render(node) { await act(async () => root.render(node)); }
async function click(text) { await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === text).click()); }
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); schoolRequest.mockResolvedValue({ items: [] }); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); vi.useRealTimers(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
describe('Pilot operations screens', () => {
  it('shows unmarked attendance and correction controls only to administrators', async () => {
    schoolRequest.mockResolvedValue({ items: [{uid:'one',name:'Alex',status:'unmarked',note:''}] });
    await render(<AttendancePanel kind="students" canEdit={false}/>);
    expect(host.textContent).toContain('1 unmarked');
    expect(host.textContent).not.toContain('Edit');
    await render(<AttendancePanel kind="students" canEdit/>);
    await click('Edit');
    expect([...host.querySelectorAll('label')].find(l => l.textContent === 'Reason for change').querySelector('input').required).toBe(true);
  });
  it('keeps service errors visible instead of reporting empty attendance', async () => {
    schoolRequest.mockRejectedValue(new Error('Access unavailable'));
    await render(<AttendancePanel kind="staff" canEdit/>);
    expect(host.querySelector('[role=alert]').textContent).toBe('Access unavailable');
    expect(host.textContent).not.toContain('No records yet.');
  });
  it('shows pending leave and refreshes incoming requests automatically', async () => {
    vi.useFakeTimers();
    schoolRequest.mockResolvedValue({items:[{id:'req',name:'Coach Alex',startDate:'2026-11-10',endDate:'2026-11-11',status:'pending',reason:'Personal'}]});
    await render(<LeavePanel admin canEdit/>);
    expect(host.textContent).toContain('1 pending requests');
    await click('Approve');
    await act(async () => host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(schoolRequest).toHaveBeenCalledWith('PATCH','/api/pilot/leave/req',{body:{status:'approved',response:''}});
    const before = schoolRequest.mock.calls.length;
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    expect(schoolRequest.mock.calls.length).toBeGreaterThan(before);
  });
  it('lets coaches submit leave and see admin responses', async () => {
    schoolRequest.mockResolvedValue({items:[{id:'req',startDate:'2026-11-10',endDate:'2026-11-11',status:'approved',reason:'Personal',response:'Enjoy your day',updatedBy:{name:'Admin'},updatedAt:'2026-11-03T01:00:00Z'}]});
    await render(<LeavePanel/>);
    expect(host.textContent).toContain('Send request');
    expect(host.textContent).toContain('Enjoy your day');
    expect(host.textContent).not.toContain('Confirm decision');
  });
  it('shows low stock and limits adjustments to administrators', async () => {
    schoolRequest.mockResolvedValue({items:[{id:'kit',name:'Science kits',location:'Lab',quantity:1,minimum:2}]});
    await render(<InventoryPanel canEdit={false}/>);
    expect(host.textContent).toContain('Low stock');
    expect(host.textContent).not.toContain('Adjust stock');
    await render(<InventoryPanel canEdit/>);
    await click('Adjust stock');
    expect(host.textContent).toContain('Reason');
  });
  it('offers only the four pilot operation areas on the landing dashboard', async () => {
    await render(<PilotHome/>);
    expect([...host.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['#/admin/staff-attendance','#/admin/student-attendance','#/admin/leave','#/admin/inventory']);
  });
});
