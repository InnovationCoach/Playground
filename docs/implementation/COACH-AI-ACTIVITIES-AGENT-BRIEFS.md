# Coach AI activity builder: agent briefs

Prepared 4 October 2026 for three agents working together:

| Agent | Role |
|---|---|
| **GPT-6** | Builder: implements the features phase by phase |
| **Claude** | Refiner: writes the shared contract first, then reviews, hardens and polishes every phase |
| **Gemini 3.6** | Firebase: cloud set-up (KMS, secrets, IAM, budgets), rules and index deploys, releases and smoke tests |

**Project-lead update, 5 October 2026:** GPT-6 owns contract decisions, feature implementation and refinement for Phase 2 onward. Claude is not required. Gemini 3.6 handles Firebase infrastructure/configuration and deployment only. The historical role assignments below remain as the original plan; this update supersedes them. No feature-builder production deploy or main merge is authorized by this update.

Goal: coaches build STEAM activities in their dashboard with AI assistance (the school's AI key by default, or their own key), review them, and publish them to their classes' student dashboards.

---

## 1. Order of work (who starts first)

| Step | Agent | Work | Starts when |
|---|---|---|---|
| 0 | **Gemini** | Clean `main`: fix and commit its pending work (CORS allow-list, `apiClient` sign-in guard), merge `feature/ux-sprint1`, deploy, report | Now |
| 1 | **Claude** | Write the shared contract on `feature/coach-activities-contract`: activity spec schema, `validateActivity()`, safety rules, API contract, tests. Merge to `main` | Step 0 merged |
| 2 | **GPT-6** | Phase 1: Activity Player and manual Activity Studio (no AI) | Step 1 merged |
| 2b | **Gemini** (in parallel) | Cloud KMS key ring and key, move the school Gemini key into Secret Manager, IAM, budget alerts | Step 1 merged |
| 3 | **Claude** | Review and refine Phase 1; merge | GPT-6 marks Phase 1 ready |
| 4 | **Gemini** | Deploy Phase 1 (rules, function, hosting); smoke test | Step 3 merged |
| 5 | **GPT-6** | Phase 2: AI generation with the school key, safety check, regenerate block, provenance | Step 3 merged |
| 6 | **Claude** → **Gemini** | Review → deploy Phase 2 | Phase 2 ready |
| 7 | **GPT-6** | Phase 3: coach's own key (Gemini, Claude, OpenAI adapters), rate limits, monthly caps, usage view | Step 2b done and Phase 2 merged |
| 8 | **Claude** → **Gemini** | Review → deploy Phase 3 | Phase 3 ready |

**Why this order:** Gemini goes first because `main` currently holds another agent's uncommitted changes, and nobody should branch from a dirty `main`. Claude writes the contract second so GPT-6 builds to a fixed schema and API instead of guessing; this prevents rework. Gemini's cloud set-up runs in parallel with Phase 1 because only Phase 3 needs it.

---

## 2. Shared context (all agents read this)

**Repository:** `/Users/admin/Desktop/HearIsland`. React 18 + Vite frontend, Express API deployed as Cloud Functions v2 `api` (`us-central1`), Firebase Auth, Firestore and Storage. Firebase project `dnd-master-73449`; launch domain `welearn.org`.

**Existing pieces to build on (do not duplicate):**
- Lesson pipeline: `server/routes/school-workspace.js`. Class-scoped drafts, `publish`, immutable published lessons, revision checks and audit events. Students see published lessons and submit evidence.
- Simulation starter: `src/features/school/simulationModel.js` (`validateSimulation`, `runSimulation`; one kind, `resource-lab`) and `src/features/school/SimulationLab.jsx`.
- Placeholder AI: `POST /schools/:id/ai-drafts` returns **hard-coded templates**, not AI output. Phase 2 replaces it.
- Teen Quest: `src/features/quest/*`, `server/lib/quest.js`. XP is awarded server-side on evidence and review; activities published as lessons earn XP automatically.
- Scope helpers: `server/lib/schoolScope.js` (`schoolCaller`, `assignedClass`, `staff`, `adminOnly`). Errors use `{error:{code,message}}`.
- Plans: `docs/implementation/UX-UI-ENHANCEMENT-PLAN.md` (navigation: **Learn** area, Programs workspace) and `TEEN-QUEST-IMPLEMENTATION-PLAN.md`.

**Non-negotiable rules:**
1. **AI output is data, never code.** AI returns an activity spec (JSON) that the server validates with `validateActivity()`. Our own player renders it as text. No `dangerouslySetInnerHTML`, no `eval`, no AI-written HTML/JS/CSS, no iframes. Links must be `https://`.
2. **A coach always reviews.** AI never publishes. Publishing an AI-assisted activity requires `safetyConfirmed: true` and records `provenance.reviewedBy`.
3. **No student data goes to any AI provider.** Prompts contain only the coach's request and program context (driving question, milestone title, class age band).
4. **API keys never reach the browser, Firestore plaintext, logs or reports.** Personal keys are envelope-encrypted with Cloud KMS; the school key lives in Secret Manager. The UI shows only the provider, model, status and last 4 characters.
5. **All new collections are browser-denied** in `firestore.rules`, with rules tests. Everything goes through the authorised API.
6. **Honest states and accessibility:** loading, empty, error and denied look different; WCAG 2.2 AA; keyboard operable; Reduce motion respected. **i18n:** every new UI string in English, 中文 and ไทย (ZH/TH marked for native review).
7. **Tests with every change:** unit (`npm run test:unit`), API with emulators (`npm run test:api`), rules (`npm test`), and `npm run build` (no chunk over 500 kB; lazy-load the new screens).

**Defaults for open decisions** (the project lead may change these; check §6 before starting):
- Keys: **the school key is the default; a coach's own key is optional.**
- Providers: **Gemini first** (Phase 2); Claude and OpenAI adapters in Phase 3.
- Approval: **coaches publish directly** after the safety confirmation; admins can unpublish.
- Media: **text and simulations only.** No AI-generated images in v1.

**Branches and handoffs:**
- One branch per phase: `feature/coach-activities-contract`, `-p1`, `-p2`, `-p3`. Never force-push; never rewrite `main`.
- Only one agent edits a branch at a time. GPT-6 builds, then marks it ready. Claude refines on the same branch, then merges. Gemini deploys from `main` only.
- Every handoff appends a dated entry to `docs/implementation/COACH-AI-ACTIVITIES-LOG.md`: agent, branch, commits, test counts, what's next, open issues.
- Stop any running Firebase emulators before running test suites (they start their own), and do not stop another agent's servers.

---

## 3. Contract summary (Claude writes the full version in Step 1)

**Activity spec v1** (`src/features/activities/spec/activitySpec.js`, shared by server and browser):

```js
{
  version: 1,
  title, summary,                       // plain text, length-limited
  ageBand: '13-15' | '16-18',           // primary is out of scope for v1
  durationMinutes,                      // 10-240
  standards: [string],                  // optional, e.g. NGSS codes
  materials: [{ name, quantity, safetyNote? }],
  safety: { hazards: [string], notes },
  blocks: [                             // 1-20 blocks, rendered in order
    { type: 'intro', text },
    { type: 'steps', items: [{ text, evidenceHint? }] },
    { type: 'prediction', question, choices?: [string] },
    { type: 'simulation', simulation },  // validated by validateSimulation()
    { type: 'dataTable', columns: [{ key, label, unit? }], rows },
    { type: 'chart', table: <block index>, x, y },
    { type: 'check', questions: [{ prompt, choices: [string], answerIndex, explanation }] },
    { type: 'code', language: 'micropython' | 'makecode-text', code, explanation },
    { type: 'reflection', prompt }
  ],
  provenance: { aiAssisted, provider?, model?, reviewedBy?, reviewedAt? }
}
```

**API (all under `/api`, Firebase bearer token, `{error:{code,message}}`):**
- `GET | PUT | DELETE /coach/ai-connection`: personal key connection (Phase 3). `PUT {provider, model, apiKey}` tests the key with one minimal call, encrypts it with KMS and stores `{provider, model, last4, status, ciphertext}`.
- `POST /schools/:sid/program-offerings/:oid/activity-drafts/generate` `{prompt, ageBand, durationMinutes, materials?, standards?, keySource: 'school'|'personal'}` → `{draftId, spec, warnings[], usage}` (Phase 2).
- `POST …/activity-drafts/:draftId/regenerate-block` `{blockIndex, instruction}` → `{spec, warnings[]}` (Phase 2).
- Lessons gain an optional `activity` field (validated). `POST …/lessons/:id/publish` requires `safetyConfirmed: true` when `activity.provenance.aiAssisted` is true.
- Safety check (server): hazard keywords, materials without safety notes, age-band mismatch, missing reflection. Returns `warnings[]`; it never silently edits content.

**Collections (browser-denied):** `coachAiConnections/{uid}`, `schools/{sid}/programOfferings/{oid}/activityDrafts/{id}` (expire after 7 days), `schools/{sid}/aiUsage/{yyyy-mm}`.

**Limits:** 10 generations per coach per hour; a monthly token cap per school (configurable; default 2 million); prompt ≤ 2,000 characters; spec ≤ 50 KB.

---

## 4. Prompts (paste one into each agent)

### 4.1 Gemini 3.6: start first (Step 0, then 2b, 4, 6, 8)

```text
You are the Firebase and deployment lead for WeLearn Growth Hub (repo /Users/admin/Desktop/HearIsland, project dnd-master-73449).
Read docs/implementation/COACH-AI-ACTIVITIES-AGENT-BRIEFS.md (sections 1-3) and docs/implementation/SPRINT-1-REPORT.md (on branch feature/ux-sprint1) before doing anything.

STEP 0 (now): make main clean so the other agents can branch from it.
1. In your uncommitted work on main:
   a. server/app.js: replace the allow-everything CORS callback with an allow-list from FRONTEND_URL
      (https://welearn.org, https://dnd-master-73449.web.app, https://dnd-master-73449.firebaseapp.com) plus http://localhost:5173 in development.
      Unknown origins → callback(null, false).
   b. src/services/api/apiClient.js: restore `if (!user) throw new ApiError({ code: 'UNAUTHENTICATED', status: 401 });` before getIdToken.
2. Run npm run test:unit, then commit.
3. Merge feature/ux-sprint1 into main (conflict expected only in StudentDashboard.jsx: keep both changes).
4. Run test:unit, test:api, npm test and build (stop emulators first). Deploy: firebase deploy --only functions:api,hosting.
5. Smoke test: /api/quest/me → 401 JSON; an unknown Origin gets no access-control-allow-origin header.
6. Write DEPLOYMENT-REPORT-<date>.md and append to COACH-AI-ACTIVITIES-LOG.md: "main clean at <sha>; Claude may start Step 1".

STEP 2b (after Claude merges the contract; parallel with GPT-6 Phase 1): cloud set-up for AI keys.
- Enable Cloud KMS and Secret Manager. Create key ring `growth-hub` (us-central1) and key `coach-ai-keys` (symmetric, 90-day rotation).
- Grant the `api` function's runtime service account ONLY roles/cloudkms.cryptoKeyEncrypterDecrypter on that one key, and roles/secretmanager.secretAccessor on the secret below.
- Move the school AI key into Secret Manager as `school-gemini-api-key`. Bind it to the function with defineSecret / secrets config. Remove it from plain environment variables.
- Expose KMS_KEY_NAME to the function. Never print key values in logs, reports or chat.
- Billing budget alerts at 50/90/100% for the project, and a separate alert on Generative Language API spend.
- Log the resource names (not values) in COACH-AI-ACTIVITIES-LOG.md.

STEPS 4, 6, 8 (each phase after Claude merges it to main):
- Deploy in this order: firestore rules (+indexes if changed) → functions:api → hosting.
- Smoke tests: new routes return 401 JSON unauthenticated; direct browser reads of coachAiConnections / activityDrafts / aiUsage are denied; an admin can still unpublish.
- Record function revision, hosting release, test counts and smoke outputs in a deployment report. Keep the previous release ID for rollback.
Do not write feature code. If a deploy needs a code change, note it in the log for GPT-6/Claude instead.
```

### 4.2 Claude: Step 1 (contract), then review after each GPT-6 phase

```text
You are the refiner and reviewer for the Coach AI Activity Builder in /Users/admin/Desktop/HearIsland.
Read docs/implementation/COACH-AI-ACTIVITIES-AGENT-BRIEFS.md fully.

STEP 1 (contract), after Gemini reports main is clean:
- Branch feature/coach-activities-contract from main.
- Implement src/features/activities/spec/activitySpec.js: the v1 schema, validateActivity(spec) (throws readable errors, strips unknown fields, enforces limits),
  safetyWarnings(spec) (hazard keywords, materials without safety notes, age-band mismatch, missing reflection), and a sample spec built from Sustainable Futures.
- Unit tests covering valid/invalid specs, limits, unsafe links, script-like text kept as plain text, and every safety rule.
- docs/implementation/COACH-AI-ACTIVITIES-CONTRACT.md: exact JSON shapes, API routes, error codes, collection fields, rate limits, the provider-adapter interface
  (generateSpec({prompt, context, key}) → {spec, usage}), and the AI prompt template (system instructions forcing JSON matching the schema, no student data).
- Add browser-deny rules + rules tests for the three new collections.
- Merge to main and log "contract ready; GPT-6 may start Phase 1".

REVIEW (after each GPT-6 phase is marked ready):
- Check security: keys never leave the server; KMS used correctly; no AI text rendered as HTML; prompt injection in coach prompts or AI output cannot change roles, scopes or publish without review; https-only links.
- Check privacy: no learner data in prompts; usage logs hold counts, not content.
- Check correctness: class scope on every route, revision checks, idempotent publishing, rate limits and caps, honest error states.
- Check UX: matches the design plan (Programs workspace, Learn area), EN/ZH/TH strings, WCAG 2.2 AA, keyboard flows, mobile at 390 px, lazy-loaded chunks.
- Fix issues directly on the phase branch with small commits. Run all suites + build. Verify in the browser as coach and student.
- Write a review summary in the log (findings, fixes, residual risks), merge to main, and hand off to Gemini.
```

### 4.3 GPT-6: builder (Phases 1, 2, 3)

```text
You are the feature builder for the Coach AI Activity Builder in /Users/admin/Desktop/HearIsland (React 18 + Vite, Express on Cloud Functions, Firestore).
Read docs/implementation/COACH-AI-ACTIVITIES-AGENT-BRIEFS.md and docs/implementation/COACH-AI-ACTIVITIES-CONTRACT.md before writing code.
Build exactly to the contract. If the contract is wrong or missing something, write the question in COACH-AI-ACTIVITIES-LOG.md instead of inventing a new shape.

PHASE 1: manual activities, no AI (branch feature/coach-activities-p1 from main):
- ActivityPlayer.jsx: renders every block type for students (steps with tick-boxes, prediction, simulation via SimulationLab, data table entry, chart, checks with
  explanations, code shown as text with a copy button, reflection). Responses are kept per learner and submitted as lesson evidence through the existing submissions API.
- ActivityStudio.jsx in the coach Programs/PBL area: create from a blank template or the sample; edit, reorder, add and delete blocks; live "Preview as student" (desktop + 390 px);
  save as a lesson draft with an `activity` field; publish to assigned classes through the existing publish route.
- Server: accept and validate lesson.activity with validateActivity(); published lessons stay immutable.
- Students see published activities in their lessons (and in today's quest when Teen Quest is on).
- Tests: unit (player, studio, validation errors shown to the coach), API (create/edit/publish with activity, wrong class denied, invalid spec rejected), rules.

PHASE 2: AI drafts with the school key (branch -p2, after Phase 1 is merged):
- server/lib/ai/gemini.js implementing the adapter interface; the key comes from Secret Manager (school-gemini-api-key).
- Replace the hard-coded /ai-drafts route with POST …/activity-drafts/generate and …/regenerate-block. Use the contract's prompt template.
  Parse JSON, run validateActivity, retry once with the validation errors, then return spec + safetyWarnings + usage.
- Studio: a "Describe your activity" form (topic, age band, minutes, kit, standards), generating state, warnings shown next to blocks, "Regenerate this block",
  a provenance badge "AI-assisted · reviewed by <coach>", and a required safety confirmation before publishing.
- Rate limit 10/hour per coach; monthly school cap in aiUsage; clear messages when limits are reached.
- Tests: mock the adapter. Cover invalid AI JSON, unsafe content warnings, the cap and the rate limit, publish blocked without safetyConfirmed, and no learner data in the prompt.

PHASE 3: the coach's own key (branch -p3, after Phase 2 is merged and Gemini's KMS set-up is logged):
- Settings › AI assistant: choose a provider (Gemini, Claude, OpenAI) and model, paste the key, Test & save, show the last 4 characters and status, Remove.
  The key is sent once over HTTPS and never stored in the browser.
- Server: PUT/GET/DELETE /api/coach/ai-connection. Test the key with one minimal call, encrypt it with Cloud KMS (KMS_KEY_NAME), store the ciphertext only. Decrypt per request in memory.
- Adapters server/lib/ai/anthropic.js and openai.js with the same interface; keySource 'personal' uses the coach's key, falling back to the school key only if the coach chooses.
- Usage view per coach (requests, tokens this month).
- Tests: the key never appears in any response, log or Firestore field except as ciphertext; a revoked key is handled; switching providers works.

For every phase: small commits; run test:unit, test:api, npm test and build; no chunk over 500 kB (lazy-load the studio and player);
EN/ZH/TH strings; then append "Phase N ready for Claude review" with test counts to COACH-AI-ACTIVITIES-LOG.md and stop. Do not deploy, do not edit firebase.json, and do not merge to main.
```

---

## 5. Definition of done (whole feature)

- A coach describes an activity, gets an AI draft in under 30 seconds, edits it, previews it as a student and publishes it to one class.
- A student in that class completes it on a phone, submits evidence and earns XP. A student in another class cannot see it.
- The coach's own key works for at least one provider, can be removed, and never appears outside KMS ciphertext.
- All suites pass, the deploy reports are recorded, and the staff testing guide gains an "AI activity" page.

## 6. Decisions the project lead can change

Change the defaults in §2 before Step 1 if needed: whose key, providers, direct publish vs admin approval, and whether AI images are allowed.
