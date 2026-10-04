/**
 * Provider adapter interface for AI-drafted activities.
 *
 * Every provider module (server/lib/ai/gemini.js, anthropic.js, openai.js)
 * exports `createAdapter({ apiKey, model })` returning an object that matches
 * this interface. Keys are passed in per call from Secret Manager (school key)
 * or decrypted from KMS ciphertext in memory (personal key); adapters never
 * read keys from anywhere else and never log them.
 *
 * @typedef {Object} AdapterResult
 * @property {string} text            Raw model reply (expected to be JSON).
 * @property {{inputTokens:number, outputTokens:number}} usage
 * @property {string} model           Model actually used.
 *
 * @typedef {Object} ActivityAdapter
 * @property {'gemini'|'anthropic'|'openai'|'mock'} provider
 * @property {(prompt:{system:string,user:string}, options?:{maxOutputTokens?:number, signal?:AbortSignal}) => Promise<AdapterResult>} complete
 * @property {() => Promise<{ok:boolean, message?:string}>} testKey   One minimal call used when a coach connects a key.
 *
 * Errors: adapters throw Error objects with `code` set to one of
 *   AI_KEY_INVALID, AI_RATE_LIMITED, AI_UNAVAILABLE, AI_TIMEOUT, AI_BAD_OUTPUT
 * and a message that never contains the key.
 */

export const AI_ERROR_CODES = ['AI_KEY_INVALID', 'AI_RATE_LIMITED', 'AI_UNAVAILABLE', 'AI_TIMEOUT', 'AI_BAD_OUTPUT'];

/** Wrap a provider error so no key or request body leaks into messages or logs. */
export function aiError(code, message) {
  const error = new Error(message);
  error.code = AI_ERROR_CODES.includes(code) ? code : 'AI_UNAVAILABLE';
  return error;
}

/** Mask a key for display: only the last 4 characters. */
export function maskKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.length >= 8 ? `…${apiKey.slice(-4)}` : '…';
}

/**
 * Test double for unit and API tests. `replies` is a list of strings (or
 * functions of the prompt) returned in order; the last one repeats.
 */
export function createMockAdapter(replies = [], { usage = { inputTokens: 100, outputTokens: 400 } } = {}) {
  const calls = [];
  let i = 0;
  return {
    provider: 'mock',
    calls,
    async complete(prompt) {
      calls.push(prompt);
      const reply = replies[Math.min(i++, replies.length - 1)];
      if (reply instanceof Error) throw reply;
      return { text: typeof reply === 'function' ? reply(prompt) : String(reply ?? ''), usage, model: 'mock-model' };
    },
    async testKey() { return { ok: true }; }
  };
}
