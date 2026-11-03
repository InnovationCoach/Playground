/**
 * Server-only Gemini adapter. The caller supplies the key from Secret Manager.
 * No SDK dependency, credential discovery, provider error echoing or logging.
 * API reference: https://ai.google.dev/api/generate-content
 */
import { aiError } from './adapter.js';

const TIMEOUT_MS = 45_000;
const OUTPUT_LIMIT = 200_000;
const tokenCount = value => Number.isSafeInteger(value) && value >= 0;

function providerError(status) {
  if ([401, 403].includes(status)) return aiError('AI_KEY_INVALID', 'The AI connection was rejected.');
  if (status === 429) return aiError('AI_RATE_LIMITED', 'The AI provider is temporarily rate limited.');
  if ([408, 504].includes(status)) return aiError('AI_TIMEOUT', 'The AI provider timed out.');
  return aiError('AI_UNAVAILABLE', 'The AI provider is unavailable.');
}

export function createAdapter({ apiKey, model } = {}) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw aiError('AI_KEY_INVALID', 'An AI connection is required.');
  // Require explicit, server-configured model selection; no guessed default.
  if (typeof model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(model)) {
    throw aiError('AI_UNAVAILABLE', 'The AI model configuration is invalid.');
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  async function request(prompt, { maxOutputTokens = 8000, signal } = {}, json = true) {
    if (typeof prompt?.system !== 'string' || typeof prompt?.user !== 'string' || !prompt.user.trim()) {
      throw aiError('AI_BAD_OUTPUT', 'The activity prompt is invalid.');
    }
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 8000) {
      throw aiError('AI_UNAVAILABLE', 'The AI output limit is invalid.');
    }
    const controller = new AbortController();
    let timer;
    let onAbort;
    // The deadline includes receiving/parsing the response, not just headers.
    const stopped = new Promise((_, reject) => {
      onAbort = () => {
        controller.abort();
        reject(aiError('AI_TIMEOUT', 'The AI request was cancelled or timed out.'));
      };
      timer = setTimeout(onAbort, TIMEOUT_MS);
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
    const operation = async () => {
      if (controller.signal.aborted) throw aiError('AI_TIMEOUT', 'The AI request was cancelled.');
      const response = await fetch(endpoint, {
        method: 'POST',
        redirect: 'error', // Never forward a credential to a redirect destination.
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: [{ role: 'user', parts: [{ text: prompt.user }, ...(prompt.document ? [{inlineData: prompt.document}] : [])] }],
          generationConfig: { maxOutputTokens, ...(json ? { responseMimeType: 'application/json' } : {}) }
        })
      });
      if (!response.ok) throw providerError(response.status);
      const payload = await response.json();
      const candidate = payload?.candidates?.[0];
      if (payload?.promptFeedback?.blockReason || candidate?.finishReason !== 'STOP') {
        throw aiError('AI_BAD_OUTPUT', 'The AI provider did not complete an activity response.');
      }
      const parts = candidate.content?.parts;
      if (!Array.isArray(parts)) throw aiError('AI_BAD_OUTPUT', 'The AI response was empty.');
      // Thought/signature parts are not activity content.
      const text = parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('');
      if (!text.trim() || text.length > OUTPUT_LIMIT) throw aiError('AI_BAD_OUTPUT', 'The AI response was empty or too large.');
      const metadata = payload.usageMetadata;
      if (!tokenCount(metadata?.promptTokenCount) || !tokenCount(metadata?.totalTokenCount) || metadata.totalTokenCount < metadata.promptTokenCount) {
        throw aiError('AI_BAD_OUTPUT', 'The AI provider did not return valid usage counts.');
      }
      return {
        text,
        usage: { inputTokens: metadata.promptTokenCount, outputTokens: metadata.totalTokenCount - metadata.promptTokenCount },
        model
      };
    };
    try {
      return await Promise.race([stopped, operation()]);
    } catch (error) {
      if (['AI_KEY_INVALID', 'AI_RATE_LIMITED', 'AI_UNAVAILABLE', 'AI_TIMEOUT', 'AI_BAD_OUTPUT'].includes(error?.code)) throw error;
      // Do not attach raw provider/network errors or request bodies as causes.
      throw controller.signal.aborted
        ? aiError('AI_TIMEOUT', 'The AI request was cancelled or timed out.')
        : aiError('AI_UNAVAILABLE', 'The AI provider is unavailable.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  return {
    provider: 'gemini',
    complete: request,
    async testKey() {
      await request({ system: 'Reply with OK only.', user: 'Connection test.' }, { maxOutputTokens: 8 }, false);
      return { ok: true };
    }
  };
}
