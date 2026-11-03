# Backend handover review

2 October 2026. Reviewed Gemini's supplied report against current local source. No production records, permissions, or application code changed. No emulator tests run. Local findings do not establish the deployed rules or production account claims.

## Confirmed in local source

- Hosting configuration has no `/api/**` rewrite. The API client falls back to mocks after a network failure or 404. This supports the observed fixture-like material rows, but the exact deployed API response remains independently unverified by this review.
- Coach/learner class overlap is required by rules. Legacy coach seeding and emulator class identities need alignment, rather than assuming similarly named classes are interchangeable.
- Dormant assignment and weekly-task writers omit `classId`; class-scoped rules require it.
- PBL term projects provide phase, task, evidence, and update data suitable for a coach progress view. A review/approval model still needs an explicit contract.
- Academic LMS progress remains pending in the inspected frontend. Design a separate Academic section with truthful integration status until a verified feed exists.
- `/api/admin/users` is limited to admin/supervisor roles. It should not become a broadly accessible coach-roster fallback.

## Corrections and unresolved claims

1. **Production coach claims are unknown.** The report first asserts they were never assigned, then explicitly says their status is unknown. The live coach dashboard was reachable; current local role resolution depends on claims. Verify the actual production coach identity, claims, deployed revision, and learner memberships before declaring the cause or running a grant script.
2. **Do not select `this.classIds[0]` automatically for coursework.** A coach with several classes must explicitly select the intended permitted class. If assigning to multiple classes, define that behavior deliberately and validate all recipients.
3. **Role assignment is not a substitute for fixing the read path.** Confirm authoritative class IDs and expected learner membership first. Keep repairs narrowly scoped to the intended class.
4. **PBL readiness is not teacher approval or mastery.** `readiness()` returns counts for ten evidence/readiness checks and excludes the share phase from the phase-evidence requirement. Display “Readiness checks met” separately from phase tasks, completion, and coach assessment.
5. **Solar Car schemas differ.** Current `useSolarCarBuild.js` uses `version`, measured parts/panel/drive/track data, runs with seconds, reflection, and review. The handover's `currentVersion`/legacy score structure does not describe all current builds. Default runs exist even in an empty build, so presence of a runs array is not proof of participation or completion.
6. **Materials implementation is missing locally.** No material/billing route implementation was found in `server/` and `createApp()` mounts session, users, reference, and parent routers. Adding a Hosting rewrite alone will not implement `/api/admin/materials`. Gemini should confirm whether another branch/service contains it and provide the actual handler and authorization contract.
7. **Feedback, ratings, and notification writes are not adequately scoped.** See the focused security assessment. The statement that rules are “hardened” must be qualified.

## Immediate security issue

Local `firestore.rules` permits any authenticated user to create, update, or delete documents under another learner's `ratings`, `feedback`, and `notifications` subcollections. Read restrictions do not prevent blind writes. These rules also lack author binding and payload validation.

Assignment/task update rules check the old document's class, without protecting the new `classId`; a permitted writer can change the destination class. Validate destination membership and immutable ownership/class fields as appropriate.

Required validation before deployment: same-class coach succeeds; student/unrelated coach cannot forge feedback or ratings; unrelated accounts cannot edit/delete records; learner notification updates are restricted to intended read-state changes; assignment/task class reassignment is denied or explicitly authorized. Run these against emulators, never by corrupting production learner records.

## Dashboard design implications

The laptop coach view should have **Overview, PBL Studio, STEAM Activities, Academic Progress**. PBL needs phase tasks, readiness checks, latest evidence, last cloud update, and a learner review panel. STEAM needs activity-specific adapters rather than a universal legacy Solar Car score. Academic needs a separate provider/source and sync status. Never use missing access or device-only work as evidence that a learner did nothing.

## Follow-up needed from Gemini

- Read-only verification of the exact production test coach's claims and intended learner/class membership, with observation date and deployed revision.
- Actual deployed API target and response status for `/api/admin/materials`; implementation location if outside current `main`.
- A schema matrix derived from each active activity writer, distinguishing legacy seed data from current saved work.
- Proposed class-scoped coach read endpoints (or validated Firestore queries), and evidence-specific review records with author/learner/activity/term identifiers.
- Emulator proof for feedback/notification ownership restrictions and assignment/task destination-class protection.
- Academic provider decision and currently available integration contract.

Existing sample identities in the report are examples, not proof of production configuration. No production access changes should be made from them alone.

## Latest Gemini verification reviewed

The latest report correctly identifies the HearIsland workspace and configured project `dnd-master-73449`, explaining the earlier unrelated project as a tool default. Production coach claims remain explicitly unverified; conditional explanations and seed scripts do not establish account state. The proposed patches have not been applied in this checkout.

Further corrections needed before applying the supplied patch:

- Split update and delete rules. A delete has no new document, so requiring `request.resource.data.coachId` denies legitimate author deletes. Update should check old and new authors; delete should check the existing author and class relationship.
- Test overwrite denial with two coaches assigned to the SAME class. Existing `coachB()` belongs only to class B; denying its write to class-A student does not prove author isolation among co-teachers.
- API test coverage of `/api/me` proves local behavior, not production deployment. A deployed target and observed HTTP result are still needed.
- The active Solar Car route uses `SolarCarChallenge.jsx` and `useSolarCarBuild.js`, not the TSX component cited in the report. Read the current build document for the coach overview.
- Notifications and coursework destination-class protection are still absent from the latest proposed patch. Preserve these items in the backend work scope.

Correction to earlier reasoning: `src/app/roles.js` permits a legacy teacher/coach profile role to select the coach UI. Reaching the dashboard does NOT prove the Firebase token contains the necessary teacher/class claims. The signed claims still control Firestore access.
