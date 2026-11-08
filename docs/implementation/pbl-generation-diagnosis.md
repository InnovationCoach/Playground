# Personalized PBL generation diagnosis (2026-11-07)

## Status

Client hardening and transfer ordering implemented. No production requests, writes, deployments, authentication changes or backend edits. No captured failing HTTP response or real Gemini request was available; the exact provider failure remains unconfirmed. Existing unrelated working changes were preserved.

## Actual flow and findings

1. `CoachPblStudio.handleSynthesize` calls `pblSynthesizer` with learner, sources and customFocus. This screen currently sends default WLS / pbl_unit / 8 stages / en-GB / full, rather than collecting structure or explicit competency selections. This is separate from the school ProgramMaker conversion endpoint.
2. Browser POST `/api/pbl/synthesize` sends JSON containing learner, groundingContext, activeSources, customFocus, programme, unitType, duration, language and step, plus a Firebase ID token. `API_BASE` defaults to same origin. Vite proxies `/api` to port 3001; an overridden VITE_API_URL requires matching server FRONTEND_URL CORS configuration. CORS permits Authorization and Content-Type. Do not remove authentication or broaden allowed origins to fix errors.
3. `server/app.js` requires verified authentication and a teacher/coach/admin/supervisor role, then enforces draft limits (20/hour, 200/day). The route uses the global GEMINI_API_KEY and GEMINI_MODEL, **not** the school connector/SCHOOL_GEMINI_API_KEY. Configuring only the school connection does not configure this endpoint.
4. Concrete local configuration defect: app.js reads GEMINI_MODEL at module evaluation, before gemini-index.js or emulator-index.js executes dotenv.config(). A model specified only in .env is ignored. The fallback currently is `gemini-3.6-flash`; availability for the configured key has not been verified. A missing key becomes `dev-dummy-key`. Either model/key problem can land in the generic 500 AI_SERVICE_ERROR handler. Exporting the selected model before startup avoids the local load-order defect without changing backend code.
5. The provider request asks for JSON, up to 8192 output tokens, with one retry and a 45-second deadline. The function has a 60-second deadline. Server parses JSON, normalizes the unit, awaits an ai_usage audit write, and returns `{unit, sourcesUsed, ...}`. Audit-write latency is outside the AI deadline. The client now has a 60-second deadline and rejects malformed success responses instead of normalizing them into a placeholder course. Aborting the browser request does not cancel provider work already underway.
6. Generation only updates React state; it does not persist a course or deliver it to students. The coach reviews and explicitly publishes/transfers. Failed generation preserves the previous draft. Errors already render in the coach notice; the client now includes status/code and configuration guidance, and logs only status, code, endpoint and elapsed time.
7. `pblTransferService` converts the unit; `pblService.publishProgram` batches `pbl_programs/{id}`, direct `enrolments/{learnerId}_{programId}` and initial phaseProgress, or class assignments. Dashboard `dashboardCourses.js`, MyCourses and useAddedCourses read these cloud records. Open-catalog publishing without a learner/class does not directly enrol a student. Browser localStorage/BroadcastChannel is only same-device convenience, not cross-device delivery.
8. Transfer-layer local registration, active-program flags and notifications now occur after publishProgram resolves. **Remaining Gemini-owned service issue:** publishProgram itself writes an optimistic localStorage catalog entry before batch.commit; move that cache write after successful commit too. A failed database write can still leave that service-level cache entry. The new transport tests mock publishProgram and do not claim to test the real database or security rules.
9. Competency IDs in convertUnitToProgram are currently hard-coded (`sdl-01`, `ctps-01`, etc.). Selected NGS/Future Skills are not represented by a typed request or persisted mapping in this flow. Uploaded files are read as text in this studio; this is not the other ProgramMaker's PDF conversion service.

## Local setup and acceptance check

Use synthetic profiles only. Never use production credentials or data for testing persistence.

- Install repository dependencies using the existing lockfile and Node 22.
- Start `npm run emulators` (demo-hearisland-local; auth 9099, Firestore 8088, storage 9199).
- Set GEMINI_API_KEY in your private local environment, never a VITE variable or committed file. Select a Gemini model enabled for that key and export GEMINI_MODEL in the shell **before** starting the server. Do not paste the key into a diagnostic report. The key must be for authorized development usage.
- Run `npm run server:dev:emulator` in that shell. This entry refuses nonlocal emulator hosts/non-demo projects. Do not substitute the ordinary server entry.
- Run `npm start`; leave VITE_API_URL unset. Open `http://localhost:5173/?emulators=1` and verify the demo project/emulator connections. Use the existing synthetic emulator fixtures (`npm run seed:emulator` after emulators are running) and a fixture coach with the proper role. Localhost without emulator mode is unsafe.
- Generate a synthetic unit. In browser Network verify POST /api/pbl/synthesize, an Authorization header (do not copy its value), expected payload and HTTP 200 with a valid unit. If 401/403, verify the fixture's role and matching emulator project; if 500 AI_SERVICE_ERROR, inspect the existing server log for provider status and model/key configuration. If HTML/non-JSON, check the API proxy and server process.
- Review the draft and explicitly transfer to a synthetic learner. Verify the program and enrolment documents in the emulator UI. Sign in as that learner in a separate browser session with `?emulators=1`; verify dashboard/My Courses and opening the program. For open-catalog publish, verify search and separately add the course. A coach's local preview alone is not delivery evidence.
- Run `npx vitest run tests/pbl-generation-client.test.js tests/coach-pbl-studio.test.js` and `npm run build`.

This procedure is the real-provider acceptance check, not a claim that live AI generation or emulator delivery has been executed in this change.

## Smallest backend contract for Gemini

- Resolve model configuration inside createApp after environment loading. Validate missing keys explicitly (return a stable AI_NOT_CONFIGURED response for AI endpoints); remove dummy-key attempts. Confirm the desired model with the provider/key and make entrypoint logging match the actual selected model.
- Inject a model adapter through createApp options for tests. Cover valid output, malformed JSON, missing credentials, unsupported model, provider timeout and rate limit using the actual route, not copied middleware. Keep existing role checks intact.
- Validate payload types/enums/lengths before prompt construction, including customFocus (non-string currently reaches .slice), grounding sources and duration. Reject empty/non-object model JSON before normalization on the server as well.
- Bound audit-write latency; return safe provider error categories and a request ID. Log endpoint/model/status/request ID/duration only; no tokens, prompts, learner details or raw provider URLs containing credentials.
- Move publishProgram's optimistic cache write after batch.commit. Test failure leaves no new local course or success notification, and success creates a program + enrolment visible to a separate learner session. This service declares Gemini ownership in its header.
- Confirm cloud runtime key configuration separately: functions/index.js currently declares no secrets binding on api. No deployment/configuration action is authorized by this document.

## Smallest guided-chat increment (proposal)

Keep the existing draft preview and explicit publish step. Add a short coach prompt followed by structure controls (cohort, unit type, duration, language) and searchable competency chips. Reuse ProgramCompetencyPicker for the existing WeLearn catalog; add NGS only from an approved catalog, not invented IDs. Show a summary of selections before Generate.

Send `competencies: [{framework, id}]` alongside the existing structure fields. Gemini's server resolves approved IDs to titles/statements and adds them to the AI prompt, then validates returned milestone mappings. Persist the validated mapping through the shared unit schema and program conversion instead of hard-coded competency IDs. Unknown IDs should produce a clear 400 response. Do not ship a picker that the server silently ignores. A full conversational agent is unnecessary for this increment.
