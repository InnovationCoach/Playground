import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({
  auth: {
    currentUser: {
      uid: 'real-user',
      getIdToken: async () => 'verified-token'
    }
  },
  getAuthClaims: async () => ({
    role: 'student'
  }),
  usingEmulators: false
}));
import { schoolRequest } from '../src/services/api/apiClient.js';
const response = (status, data, type = 'application/json') => ({
  status,
  ok: status >= 200 && status < 300,
  headers: {
    get: () => type
  },
  text: async () => typeof data === 'string' ? data : JSON.stringify(data)
});
describe('Live school requests never substitute sample responses', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());
  it('surfaces network failures on saves', async () => {
    fetch.mockRejectedValue(new Error('Offline'));
    await expect(schoolRequest('POST', '/api/schools/school/calendar-events', {
      body: {
        title: 'Real event'
      }
    })).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      status: 0
    });
  });
  it('preserves not found instead of falling back to mock data', async () => {
    fetch.mockResolvedValue(response(404, {}));
    await expect(schoolRequest('GET', '/api/me', {})).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404
    });
  });
  it('throws NOT_FOUND on school endpoints in production mode when 404 is returned', async () => {
    fetch.mockResolvedValue(response(404, '<html>Not Found</html>', 'text/html'));
    await expect(schoolRequest('GET', '/api/schools/school-main/program-offerings', {})).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404
    });
  });
  it('rejects the SPA HTML fallback even with status 200', async () => {
    fetch.mockResolvedValue(response(200, '<html>School app</html>', 'text/html'));
    await expect(schoolRequest('GET', '/api/me', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE'
    });
  });
  it('preserves backend scope and revision errors', async () => {
    fetch.mockResolvedValue(response(409, {
      error: {
        code: 'CONFLICT',
        message: 'This event changed.'
      }
    }));
    await expect(schoolRequest('PATCH', '/api/event', {
      body: {
        revision: 1
      }
    })).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'This event changed.'
    });
  });
  it('sends real bearer identity and returns valid JSON', async () => {
    fetch.mockResolvedValue(response(200, {
      items: []
    }));
    await expect(schoolRequest('GET', '/api/items', {})).resolves.toEqual({
      items: []
    });
    expect(fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
      headers: {
        Authorization: 'Bearer verified-token'
      }
    }));
  });
});
