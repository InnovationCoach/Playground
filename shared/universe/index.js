// Production entry: keep fixtures out of this import graph.
export { API_CONTRACT_VERSION, CAPABILITIES, PUBLISHED_RELEASES, MAX_REQUEST_BYTES } from './constants.js';
export { canonicalStringify, getBundleHashInputs } from './canonical.js';
export { parseNumber, roundDecimal, checkNumber, displayAnswer } from './numbers.js';
export { resolveTask, validateEvidence, validateSubmission, validateDraft, validateReview } from './validation.js';
