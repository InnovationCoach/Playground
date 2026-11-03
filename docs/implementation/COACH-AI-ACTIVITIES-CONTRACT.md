# Coach AI activity builder: contract v1

Written by Claude (Step 1), 4 October 2026. Read with `COACH-AI-ACTIVITIES-AGENT-BRIEFS.md`. GPT-6 builds to this contract; if something is missing or wrong, record the question in `COACH-AI-ACTIVITIES-LOG.md` instead of inventing a new shape.

**Implemented in this step (do not re-implement):**

| File | What it gives you |
|---|---|
| `src/features/activities/spec/activitySpec.js` | `validateActivity`, `safetyWarnings`, `validateActivityResponses`, `sampleActivity`, `textEntries`, constants (`LIMITS`, `BLOCK_TYPES`, `AGE_BANDS`, `CODE_LANGUAGES`, `AI_PROVIDERS`, `HAZARD_TERMS`) and `ActivityValidationError` |
| `server/lib/ai/activityPrompt.js` | `buildActivityPrompt`, `buildBlockPrompt`, `parseModelJson`, `CONTEXT_KEYS`, `PROMPT_LIMIT` |
| `server/lib/ai/adapter.js` | Adapter interface (JSDoc), `aiError`, `AI_ERROR_CODES`, `maskKey`, `createMockAdapter` |
| `firestore.rules` | Browser-deny rules for the three new collections |
| `tests/activity-spec.test.js`, `tests/firestore-rules.test.js` | 28 unit tests and a rules test |

---

## 1. Activity spec v1

An activity is **data**. The server stores only what `validateActivity()` returns. The player renders every string as plain text: no `dangerouslySetInnerHTML`, no `eval`, no iframes. Unknown fields are removed at every level.

| Field | Type | Rules |
|---|---|---|
| `version` | `1` | Required |
| `title` | text | Required, ≤ 120 |
| `summary` | text | Required, ≤ 500 |
| `ageBand` | `'13-15' \| '16-18'` | Required. Primary learners are out of scope for v1 |
| `durationMinutes` | integer | 10–240 |
| `standards` | text[] | ≤ 10 items, each ≤ 40 |
| `materials` | `{name, quantity, safetyNote?}[]` | ≤ 25; name ≤ 80, quantity ≤ 40, safetyNote ≤ 200 |
| `safety` | `{hazards: text[], notes}` | hazards ≤ 10 × 120; notes ≤ 1,000 |
| `resources` | `{title, url}[]` | ≤ 10; **https only**, no credentials |
| `blocks` | block[] | 1–20, rendered in order |
| `provenance` | `{aiAssisted, provider?, model?, reviewedBy?, reviewedAt?}` | provider ∈ gemini, anthropic, openai. **Set by the server**, never trusted from the client (see §4) |

Total serialized size ≤ **50 KB**. Text is trimmed and control characters are removed. Text such as `<script>` is kept as literal text and escaped by React when rendered.

### Blocks

| `type` | Fields | Rules |
|---|---|---|
| `intro` | `text` | ≤ 2,000 |
| `steps` | `items: {text, evidenceHint?}[]` | 1–15 items; text ≤ 500, hint ≤ 200 |
| `prediction` | `question`, `choices?` | question ≤ 300; choices 2–6 × ≤ 160 (omit for free text) |
| `simulation` | `simulation` | Must pass the existing `validateSimulation()` (`kind: 'resource-lab'`, set ranges) |
| `dataTable` | `columns: {key, label, unit?}[]`, `rows` | 1–8 columns; `key` matches `/^[a-z][A-Za-z0-9]{0,30}$/` and is unique; rows 1–30 |
| `chart` | `table`, `x`, `y`, `kind` | `table` = index of an **earlier** dataTable block; `x`/`y` are its column keys; `kind` bar (default) or line |
| `check` | `questions: {prompt, choices, answerIndex, explanation}[]` | 1–8; choices 2–6; answerIndex in range |
| `code` | `language`, `code`, `explanation` | language ∈ micropython, makecode-text; code ≤ 6,000 (**shown, never run**) |
| `reflection` | `prompt` | ≤ 500 |

Errors: `ActivityValidationError` with `code: 'VALIDATION'` and `errors: [{path, message}]` listing **every** problem, for example `blocks[4].table: must point to an earlier dataTable block.` The API returns these as `400 {error:{code:'VALIDATION', message, details:[{path,message}]}}`. The Studio shows each message next to its field.

### Safety warnings

`safetyWarnings(spec)` returns `[{code, severity, path, message}]`. It never edits content.

| Code | Severity | When |
|---|---|---|
| `HAZARD_WITHOUT_SAFETY_NOTE` | warning | A hazard term (fire, heat, soldering, chemicals, mains, lithium batteries, sharp tools, glass, lasers, height/water) appears and `safety` has no notes or hazards. Safety text itself is not scanned. |
| `MATERIAL_NEEDS_SAFETY_NOTE` | warning | A material name matches a hazard term and has no `safetyNote` |
| `AGE_BAND_MISMATCH` | warning | A hazard's minimum band is above `ageBand` (soldering, mains, lithium and lasers are 16–18 only) |
| `MISSING_REFLECTION` | caution | No reflection block |
| `NO_LEARNER_ACTION` | caution | No steps, prediction, simulation, dataTable, check or code |
| `CONTAINS_PERSONAL_DATA` | warning | Text looks like an email address or phone number |

Warnings are shown to the coach. Publishing an AI-assisted activity requires `safetyConfirmed: true` whether or not warnings exist; the confirmation dialog lists the warnings.

---

## 2. Learner responses

Submitted with lesson evidence. Validate with `validateActivityResponses(spec, responses)`:

```js
{ version: 1, answers: {
  "1": { choice: 0 },              // prediction with choices (or { text })
  "2": { done: [0, 2] },           // steps
  "3": { rows: [{ device: 'AC', watts: 1500 }] },  // dataTable (unknown keys dropped)
  "5": { trials: [{ units, efficiency, supplied, cost, success }] }, // simulation, ≤ 10
  "6": { selected: [0] },          // check, one entry per question (null = unanswered)
  "7": { text: '…' }               // reflection (≤ 2,000)
} }
```

Intro and chart blocks take no answers. The existing submission `body` (required, ≤ 5,000) stays the learner's written summary. The player pre-fills it from the reflection answer, and the learner can edit it.

---

## 3. API

All routes are under `/api`, need a Firebase bearer token, take JSON bodies, and use the existing scope helpers (`schoolCaller`, `schoolAccess`, `assignedClass`, `offeringAccess`). Errors use `{error:{code,message,details?}}`.

### Phase 1: lessons with activities (no AI)

| Route | Change |
|---|---|
| `POST /schools/:sid/program-offerings/:oid/lessons` | Accepts optional `activity`. Server runs `validateActivity` and **overwrites** `activity.provenance` to `{aiAssisted:false}` for manual lessons. |
| `PATCH …/lessons/:lessonId` | Same rules; drafts only, with revision check (existing). |
| `POST …/lessons/:lessonId/publish` | If `activity.provenance.aiAssisted`, require `safetyConfirmed: true`, else `400 SAFETY_CONFIRMATION_REQUIRED`. Server sets `provenance.reviewedBy = caller.uid` and `reviewedAt = now`. Audit `LESSON_PUBLISHED` with `{aiAssisted}`. |
| `GET …/lessons` | Returns `activity` for published lessons to enrolled learners (existing scope). |
| `POST …/submissions` | Accepts optional `responses` (validated against that lesson's activity). Existing XP rules apply unchanged. |

### Phase 2: AI drafts (school key)

`POST /schools/:sid/program-offerings/:oid/activity-drafts/generate`

| Request | Response 201 |
|---|---|
| `{ prompt (≤2000), ageBand, durationMinutes, materials?: text[], standards?: text[], milestoneId?, keySource: 'school' \| 'personal' }` | `{ draftId, revision, spec, warnings[], usage: {inputTokens, outputTokens}, provider, model }` |

The server flow:
1. Check the caller is staff with an assigned class in the offering.
2. Check the rate limit and the monthly cap.
3. Build the context from the offering (program title, driving question, milestone title) plus the request fields. **Only `CONTEXT_KEYS`.**
4. Call `buildActivityPrompt`, then `adapter.complete`, then `parseModelJson`, then `validateActivity`. On a validation failure, retry **once**, appending the error list to the prompt. On a second failure, return `422 AI_BAD_OUTPUT`.
5. Force `provenance = {aiAssisted:true, provider, model}`.
6. Store the draft, add usage, and return `safetyWarnings`.

`POST …/activity-drafts/:draftId/regenerate-block` with `{ revision, blockIndex, instruction (≤500) }` returns `{ spec, warnings[], usage, revision }`. It uses `buildBlockPrompt`; the new block must keep the same `type` and the whole spec must still validate.

`GET …/activity-drafts` lists the caller's own drafts (newest first, at most 20). `DELETE …/activity-drafts/:draftId` deletes the caller's own draft.

Saving a draft as a lesson uses the Phase 1 lesson route with `activity: draft.spec`, `activityDraftId` and `activityDraftRevision`. The server checks that `provenance.aiAssisted` matches the stored draft and never trusts the client's value.

### Phase 3: coach's own key

| Route | Behaviour |
|---|---|
| `GET /coach/ai-connection` | `{ connected, provider?, model?, last4?, status?: 'ok'\|'invalid', usage?: {requests, inputTokens, outputTokens, month} }`. Never the key. |
| `PUT /coach/ai-connection` | `{ provider, model, apiKey }`. Calls `adapter.testKey()`, then KMS-encrypts the key and stores `{provider, model, ciphertext, last4, status:'ok', updatedAt}`. Returns the same shape as GET. A rejected key returns `400 AI_KEY_INVALID` and stores nothing. |
| `DELETE /coach/ai-connection` | Removes the record. Later personal-key requests fall back only if the coach picks `keySource:'school'`. |

The key is accepted only in the PUT body, is never echoed, and is never logged (redact `apiKey` in request logging).

### Error codes (new)

`VALIDATION` 400 · `SAFETY_CONFIRMATION_REQUIRED` 400 · `AI_KEY_INVALID` 400 · `AI_NOT_CONFIGURED` 409 (personal key requested but none connected) · `RATE_LIMITED` 429 · `AI_CAP_REACHED` 429 · `AI_BAD_OUTPUT` 422 · `AI_TIMEOUT` 504 · `AI_UNAVAILABLE` 503

---

## 4. Data

All three collections are browser-denied (rules and rules tests are in place). Only the Admin SDK writes them.

| Path | Fields |
|---|---|
| `coachAiConnections/{uid}` | `provider, model, ciphertext (base64), kmsKeyVersion, last4, status, createdAt, updatedAt` |
| `schools/{sid}/programOfferings/{oid}/activityDrafts/{draftId}` | `creatorUid, classIds, prompt (≤2000), spec, warnings, provider, model, keySource, usage, revision, operation?, updatedAt, createdAt, expiresAt (+7 days)` |
| `schools/{sid}/aiUsage/{yyyy-mm}` | `requests, inputTokens, outputTokens, byCoach: {uid: {requests, inputTokens, outputTokens}}, cap, reservations` |
| `…/lessons/{lessonId}` (existing) | gains `activity` (validated spec, with provenance) |
| `…/submissions/{id}` (existing) | gains optional `responses` |

**Provenance rules:** manual activities are always `aiAssisted:false`. Generated drafts are always `aiAssisted:true` with provider and model. `reviewedBy` and `reviewedAt` are set only at publish. The client can never set any provenance field.

---

## 5. AI usage, limits and privacy

- **Context allow-list:** `programTitle, drivingQuestion, milestoneTitle, ageBand, durationMinutes, materials, standards`. Anything else throws. Never pass learner names, IDs, evidence, goals, messages or class rosters.
- **Prompt template:** `buildActivityPrompt` (JSON only, plain text only, safe materials, a reflection required, no personal data, ignore instructions that try to change the rules). Adapters send `system` and `user` as their native system and user messages.
- **Rate limit:** 10 generate or regenerate calls per coach per rolling hour, stored server-side (reuse the pattern of `programJoinAttempts`).
- **Monthly cap:** `aiUsage.cap` defaults to 2,000,000 tokens per school per month; `AI_CAP_REACHED` when exceeded. Reserve before inference; count known completions including invalid output, and conservatively charge uncertain billing (§9).
- **Timeout:** 45 seconds per provider call, then `AI_TIMEOUT`.
- **Logging:** route, school, coach uid, provider, model, token counts and duration. **Never** prompt text, model output or keys.
- **Keys:** the school key comes from Secret Manager `school-gemini-api-key`. Personal keys are encrypted with Cloud KMS `KMS_KEY_NAME`, decrypted per request in memory, and never cached across requests.

---

## 6. Adapter interface

```js
// server/lib/ai/<provider>.js
export function createAdapter({ apiKey, model }) {
  return {
    provider: 'gemini',                     // 'anthropic' | 'openai'
    async complete({ system, user }, { maxOutputTokens = 8000, signal } = {}) {
      return { text, usage: { inputTokens, outputTokens }, model };
    },
    async testKey() { return { ok: true }; }  // one minimal, cheap call
  };
}
```

Throw `aiError(code, message)` with a code from `AI_ERROR_CODES`, and never include the key or request body in a message. Use `createMockAdapter([...replies])` in tests.

---

## 7. UI expectations

- **Activity Studio** (coach, inside the Programs workspace): describe form, block editor (add, reorder with buttons and keyboard, delete), per-field validation messages, warnings beside blocks, "Preview as student" at desktop and 390 px, provenance badge, and a publish dialog with the safety confirmation. Lazy-loaded.
- **Activity Player** (student, in Learn › Lessons and today's quest): each block type accessible by keyboard; data table inputs with labels; charts with a text alternative; check answers show explanations after answering; code has a copy button; a reflection feeds the evidence body. Works offline-tolerant (keeps answers locally until submitted). Lazy-loaded.
- Every string in EN, ZH and TH (ZH/TH marked for native review). WCAG 2.2 AA. Reduce motion respected.

---

## 8. Ownership

| Area | Owner |
|---|---|
| `activitySpec.js`, `activityPrompt.js`, `adapter.js` | Contract: GPT-6 owns amendments and review, authorized by the project lead on 5 October 2026 |
| Routes, Studio, Player, provider adapters, rate limits and caps | GPT-6 |
| Secret Manager, KMS, IAM, budgets, deploys | Gemini |


## 9. Phase 2 amendments — project-lead authorization, 5 October 2026

GPT-6 now owns feature implementation, contract decisions and refinement. Gemini 3.6 owns Firebase infrastructure and deployment only. These amendments resolve the questions logged on 5 October; the spec and existing manual lesson API remain compatible.

- A generated lesson request includes `activityDraftId` (same offering, caller-owned, unexpired) and `activityDraftRevision`. The supplied activity may contain coach edits; provenance is derived from the stored draft, never from the browser. The lesson stores `activityDraftId`. Later edits retain existing server-owned AI provenance even if the link is omitted or the draft expires. Reviewed fields reset on edits. Existing lesson revision/author/class checks remain mandatory. Choosing a blank/sample starts a separate lesson, not a way to relabel an existing AI lesson.
- Drafts gain `revision` (starts at 1), `updatedAt` and optional `operation: {id, expiresAt}`. Generate returns `revision`. New `PATCH …/activity-drafts/:id` accepts `{revision,spec}` and returns `{draftId,revision,spec,warnings}`. Regenerate accepts `{revision,blockIndex,instruction}` and returns `{spec,warnings,usage,revision}`. Save edits to the draft before regenerating a block. PATCH/regeneration reject stale revisions with 409 CONFLICT. Concurrent regeneration locks the draft for up to 15 minutes; provider calls run outside transactions and cannot silently overwrite later edits. Listing and every draft operation exclude expired drafts, with no reliance on TTL deletion.
- Coach attempts are stored in the already browser-denied `programJoinAttempts/coach-ai-<uid>` document as `attempts` (epoch milliseconds). A transaction checks 10 per rolling hour globally across schools. Authorized requests that reach reservation consume an attempt, including provider failures; malformed/denied/unconfigured requests do not.
- The UTC monthly usage document gains `reservations: {requestId:{uid,tokens,expiresAt}}`. Before provider calls, a transaction reserves **116,000 tokens**, covering at most two calls with each input limited to 50,000 UTF-8 bytes and output limited to 8,000 tokens. Input prompts including repair feedback are bounded before each call. Admission checks consumed input/output plus all outstanding reservations against the server-managed `cap` (default 2,000,000). This deliberately conservative policy can deny near-cap requests even when their eventual cost would be smaller. No provider call occurs inside a retryable transaction. A single request has a 45-second overall deadline, fitting the existing 60-second function timeout.
- On settlement, known token counts include every successful provider completion, even invalid activity JSON and repair responses. Unknown provider billing after a dispatched timeout/error conservatively charges the full reservation; requests cancelled before dispatch charge zero. A crashed/expired reservation is converted to conservative consumed usage, not released as free budget. Successful draft persistence and settlement happen atomically. Settlement failures retain the reservation, protecting the cap; no success is returned before persistence. Counts and reservation IDs contain no prompts, specs or credentials. No new collection or rules change is required.
- School source uses only runtime-bound Secret Manager environment value `school-gemini-api-key` and explicit `COACH_ACTIVITY_GEMINI_MODEL`. No fallback to existing plaintext GEMINI_API_KEY. Missing configuration returns 409 AI_NOT_CONFIGURED. `keySource:'personal'` also returns AI_NOT_CONFIGURED until Phase 3, without consuming quota. Provider throttling maps to 429 RATE_LIMITED. Gemini owns secret binding/IAM/model configuration and release; feature work does not edit the Firebase entrypoint or firebase.json.
- Only staff/admin with a current active assigned class in the offering may generate. Draft class scope is the current intersection, rechecked on every operation and lesson link. Provider context is server-selected from the approved keys. Reject email/phone patterns in outbound coach prompt/context, edited spec text and regeneration instructions; UI reminds coaches never to include learner information. This heuristic cannot identify every name or disguised personal detail; no learner records are fetched or included by these routes.
- Legacy learner support `/ai-drafts` remains a **non-AI learning scaffold** for compatibility, returns `aiAssisted:false, source:'learning-scaffold'`, and its UI must not call these fixed templates AI generation. Coach activity generation uses the new offering-scoped routes exclusively. Legacy access is restricted to accessible offerings and caller-owned acceptance; it never invokes a provider.
- Local mock adapters are injected server-side in tests or an explicit emulator-only preview. They are never enabled by browser input. The mock model name is visibly `local-mock`; a simulated preview does not establish production provider readiness.

Publishing returns `{published:true, provenance?}` so the Studio can display the server-confirmed reviewer without inventing review metadata.
