/**
 * Minimal Anthropic Messages API client for server-side generation.
 * The caller supplies the key from Secret Manager; it is never logged or echoed.
 */
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export async function generateClaudeText({ apiKey, model, prompt, maxTokens = 3500, temperature = 0.4, signal }) {
  if (!apiKey) {
    const err = new Error('Anthropic API key is not configured');
    err.status = 500;
    throw err;
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Anthropic API error ${res.status}: ${data?.error?.type || 'request failed'}`);
    err.status = res.status;
    throw err;
  }
  return (data.content || []).filter((block) => block.type === 'text').map((block) => block.text).join('');
}
