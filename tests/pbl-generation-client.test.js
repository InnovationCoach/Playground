// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: vi.fn(), publish: vi.fn() }));
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { getIdToken: mocks.token } } }));
vi.mock('../src/services/pblService.js', () => ({ publishProgram: mocks.publish }));
import { synthesizeGroundedUnit } from '../src/features/coach/studio/pblSynthesizer.js';
import { publishAndTransferToStudent } from '../src/features/coach/studio/pblTransferService.js';
import { normalizePblUnit } from '../shared/pblUnitSchema.js';
const unit = () => normalizePblUnit({ unitTitle: 'Synthetic test course', drivingQuestion: 'How can we test water?' });
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  mocks.token.mockResolvedValue('test-token');
  mocks.publish.mockReset();
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('PBL generation transport', () => {
  it('sends the authenticated structure and only active grounding sources', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ unit: unit() }) });
    const result = await synthesizeGroundedUnit({ duration: '4 sessions', programme: 'primary', sources: [{ active: true, title: 'Skills', excerpt: 'Collaboration' }, { active: false, title: 'Excluded' }] });
    const [url, request] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/pbl\/synthesize$/);
    expect(request.headers.Authorization).toBe('Bearer test-token');
    expect(JSON.parse(request.body)).toMatchObject({ duration: '4 sessions', programme: 'primary', activeSources: ['Skills'], groundingContext: '[SOURCE: Skills]\nCollaboration', competencies: [] });
    expect(result.unitTitle).toBe('Synthetic test course');
  });
  it('sends approved WeLearn and NGS competencies in [{framework, id}] format and rejects unknown IDs', async () => {
    const unitWithComps = normalizePblUnit(
      { unitTitle: 'Competency mapped course', drivingQuestion: 'How can we test water?' },
      { competencies: [{ framework: 'welearn', id: 'sdl-01' }, { framework: 'ngs', id: 'MS-ETS1-1' }] }
    );
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ unit: unitWithComps }) });
    const result = await synthesizeGroundedUnit({
      programme: 'WLS',
      unitType: 'pbl_unit',
      duration: '8 stages',
      language: 'en-GB',
      competencies: [
        { framework: 'welearn', id: 'sdl-01' },
        { framework: 'ngs', id: 'MS-ETS1-1' }
      ]
    });
    const [, request] = fetch.mock.calls[0];
    expect(JSON.parse(request.body).competencies).toEqual([
      { framework: 'welearn', id: 'sdl-01' },
      { framework: 'ngs', id: 'MS-ETS1-1' }
    ]);
    expect(result.competencies.map((c) => c.id)).toEqual(['sdl-01', 'MS-ETS1-1']);

    fetch.mockClear();
    await expect(
      synthesizeGroundedUnit({ competencies: [{ framework: 'welearn', id: 'invented-id-99' }] })
    ).rejects.toThrow('Unknown or unapproved competency');
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([null, {}, { unit: {} }])('rejects malformed success responses instead of manufacturing a course: %j', async body => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => body });
    await expect(synthesizeGroundedUnit({})).rejects.toThrow('invalid course draft');
  });
  it('explains the generic server AI error without logging learner content', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Failed to synthesize unit via server AI', code: 'AI_SERVICE_ERROR' }) });
    await expect(synthesizeGroundedUnit({ learner: { name: 'PRIVATE' } })).rejects.toThrow('Gemini key and model');
    expect(JSON.stringify(console.warn.mock.calls)).not.toContain('PRIVATE');
  });
  it('validates focus before making a request', async () => {
    await expect(synthesizeGroundedUnit({ customFocus: 'x'.repeat(501) })).rejects.toThrow('500');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('stops a stalled request', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
    const result = expect(synthesizeGroundedUnit({})).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(60000);
    await result;
  });
  it('does not announce a direct transfer when persistence rejects', async () => {
    mocks.publish.mockRejectedValue(new Error('Database unavailable'));
    const listener = vi.fn();
    window.addEventListener('pbl-program-transferred', listener);
    await expect(publishAndTransferToStudent(unit(), 'synthetic-learner', 'synthetic-coach')).rejects.toThrow('Database unavailable');
    expect(localStorage.getItem('hearisland.activeProgram.synthetic-learner')).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('pbl-program-transferred', listener);
  });
});
