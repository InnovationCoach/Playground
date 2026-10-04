/** Pure generation/repair pipeline; not exposed to HTTP until contract gates close. */
import { validateActivity, safetyWarnings, ActivityValidationError } from '../../../src/features/activities/spec/activitySpec.js';
import { buildActivityPrompt, buildBlockPrompt, parseModelJson } from './activityPrompt.js';
import { aiError } from './adapter.js';

function usageOf(result) {
  const usage = result?.usage;
  if (!usage || !['inputTokens', 'outputTokens'].every(k => Number.isSafeInteger(usage[k]) && usage[k] >= 0)) {
    throw aiError('AI_BAD_OUTPUT', 'The AI provider returned invalid usage counts.');
  }
  return usage;
}
function repairedPrompt(prompt, error) {
  const details = error instanceof ActivityValidationError
    ? error.errors.map(e => `${e.path}: ${e.message}`).join('\n')
    : 'Reply with one valid JSON object matching the requested schema.';
  return { ...prompt, user: `${prompt.user}\n\nRepair the previous response. Validation feedback:\n${details}` };
}
async function completeValidated({ adapter, prompt, validate, signal }) {
  const usage = { inputTokens: 0, outputTokens: 0 };
  let current = prompt;
  for (let attempt = 0; attempt < 2; attempt++) {
    // Provider failures are not validation repairs and must not trigger another call.
    const result = await adapter.complete(current, { maxOutputTokens: 8000, signal });
    const counts = usageOf(result);
    usage.inputTokens += counts.inputTokens;
    usage.outputTokens += counts.outputTokens;
    try {
      return { spec: validate(parseModelJson(result.text), result.model), usage, provider: adapter.provider, model: result.model };
    } catch (error) {
      if (!(error instanceof ActivityValidationError) && error?.code !== 'AI_BAD_OUTPUT') throw error;
      if (attempt === 1) throw aiError('AI_BAD_OUTPUT', 'The AI could not produce a valid activity after one repair.');
      current = repairedPrompt(prompt, error);
    }
  }
}
export async function generateActivity({ adapter, prompt, context, signal }) {
  const result = await completeValidated({
    adapter, signal, prompt: buildActivityPrompt({ prompt, context }),
    validate: (candidate, model) => validateActivity({ ...candidate, provenance: { aiAssisted: true, provider: adapter.provider, model } })
  });
  return { ...result, warnings: safetyWarnings(result.spec) };
}
export async function regenerateActivityBlock({ adapter, spec, blockIndex, instruction, signal }) {
  const clean = validateActivity(spec);
  if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 500) {
    const error = new Error('Describe the block change in 1–500 characters.');
    error.code = 'VALIDATION';
    throw error;
  }
  const prompt = buildBlockPrompt({ spec: clean, blockIndex, instruction });
  const result = await completeValidated({ adapter, signal, prompt, validate: (block, model) => {
    if (block?.type !== clean.blocks[blockIndex].type) throw aiError('AI_BAD_OUTPUT', 'The regenerated block must keep its type.');
    return validateActivity({
      ...clean, blocks: clean.blocks.map((old, i) => i === blockIndex ? block : old),
      provenance: { aiAssisted: true, provider: adapter.provider, model }
    });
  }});
  return { ...result, warnings: safetyWarnings(result.spec) };
}
