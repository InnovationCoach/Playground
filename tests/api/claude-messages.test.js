import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateClaudeText } from '../../server/lib/ai/claudeMessages.js';

afterEach(() => vi.unstubAllGlobals());

describe('generateClaudeText', () => {
  it('sends the key in a header and returns the text blocks', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'text', text: '{"ok":' }, { type: 'text', text: 'true}' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const text = await generateClaudeText({ apiKey: 'test-key', model: 'claude-haiku-5-5', prompt: 'hi', maxTokens: 100 });
    expect(text).toBe('{"ok":true}');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('test-key');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'claude-haiku-5-5', max_tokens: 100 });
  });

  it('throws with the HTTP status and never the key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { type: 'authentication_error' } }), { status: 401 })));
    const err = await generateClaudeText({ apiKey: 'secret-key', model: 'm', prompt: 'x' }).catch((e) => e);
    expect(err.status).toBe(401);
    expect(err.message).not.toContain('secret-key');
  });

  it('refuses to call without a key', async () => {
    const err = await generateClaudeText({ apiKey: '', model: 'm', prompt: 'x' }).catch((e) => e);
    expect(err.status).toBe(500);
  });
});
