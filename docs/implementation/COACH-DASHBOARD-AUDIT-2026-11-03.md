# Coach dashboard pilot audit — 3 November 2026

## Scope and result

Source review of the current working tree: CoachWorkspace, CoachDashboardHost, legacy CoachDashboard, student registration helper, school workspace integration, and existing coach tests. Existing uncommitted work was preserved. No application code, live accounts, data, or deployments were changed.

Recommendation: resolve the high-priority findings and verify the complete pilot journey before admitting a real student. This is a source audit, not a certification of deployed authorization or a completed visual/browser audit.

## Findings

### 1. High: student creation omits the assignment required by the roster

Evidence: `src/firebase.js:171` creates an Auth account using a secondary browser app, then writes user and student documents with groupName but without classIds, schoolId, or orgId. `src/features/coach/CoachWorkspace.jsx:62` discovers students using classIds. The registration form accepts a free-text group instead of a verified assigned class.

Impact: a newly created student can appear temporarily in legacy local state but disappear from the real class roster after refresh. Account creation and the two document writes are separate operations; failure can leave partial accounts. The helper itself does not require a verified coach caller; actual protection depends on external Auth settings and database rules, which were not tested in this audit.

Fix: create/invite through an authenticated server operation; authorize the caller and selected class; enforce student role, school membership, and coach assignment; implement retry/compensation for partial failures. Prefer invitations rather than coach-chosen passwords. Verify login remains available when public registration is disabled.

Acceptance: an authorized coach creates Anna in an assigned class; Anna appears after refresh; unauthorized roles and unrelated classes are rejected; failures do not strand accounts.

### 2. High: legacy management uses out-of-scope roster fallbacks

Evidence: `src/components/Coach/CoachDashboard.js:92–180` substitutes a hardcoded demo class when explicit scope is absent, then attempts an administrative user-list API and finally an unscoped users collection read.

Impact: absent assignments initiate broader reads rather than showing a blocked state. Whether those reads expose data depends on backend/rules enforcement; exposure was not demonstrated. The administrative list endpoint reviewed is restricted to admin/supervisor, so it is not a valid normal coach fallback.

Fix: require verified class scope; remove demo/global roster fallbacks; show an actionable unassigned state. Test an unassigned coach and a coach attempting another class through direct backend calls.

### 3. High: untrusted text is inserted as HTML in management tools

Evidence: `src/components/Coach/CoachDashboard.js:512–514` interpolates student names, email, and group into HTML templates. Similar interpolation occurs in goals and learner review. `showNotification` at line 1854 assigns messages to innerHTML, including a registration success message containing the submitted name.

Impact: markup in a stored or submitted field can become active HTML in a coach's browser. Exploitability depends on field write permissions and browser policy; no live exploit was attempted.

Fix: use React rendering or DOM textContent for text, and validated attributes/URLs. Add a regression check with HTML-like student names and goal titles, verifying they render literally and no injected element or event handler is created.

### 4. High: roster read failures become successful empty/partial results

Evidence: `src/features/coach/CoachWorkspace.jsx:62–80` catches each failed roster query, returns null, and ultimately commits state ready. Class-name lookup failures also fall back silently to IDs.

Impact: permission or connection errors can look like an empty class or an accurate smaller learner count. The existing per-learner recordError warning does not cover missing roster batches.

Fix: distinguish complete, partial, empty, and failed roster states. Include failed classes/batches in a visible warning, offer retry, and label totals as incomplete. Never label all failed batches as an empty class.

### 5. Medium: new accounts receive fabricated activity state in the UI

Evidence: `src/components/Coach/CoachDashboard.js:1698–1703` inserts a Solar Car prototype, weight, component choices, and one session into the new student's local state.

Impact: a real student's account can display work or engagement they did not record. This local state is not evidence of persisted activity.

Fix: initialize empty activity and session collections; show “No activity yet.” Verify zero work remains zero after creation and refresh.

### 6. Medium: ratings can look saved after a failed write

Evidence: `src/components/Coach/CoachDashboard.js:1799–1813` updates stars and local ratings before the write resolves; failures are only logged. studentRatings starts empty and no feedback read was found in loadData.

Impact: coaches can believe an assessment was saved, and ratings do not reliably reappear after reload.

Fix: show saving/saved/failed states, await persistence, restore the previous value on failure, reload saved feedback, and support keyboard rating selection. Tie assessments to the relevant work rather than only the student where the product requires this distinction.

### 7. Medium: coaching review is split between two interfaces

Evidence: `CoachDashboardHost.jsx` switches between the main workspace and legacy tools. `CoachWorkspace.jsx:132` explicitly says approval and written feedback are unavailable in the main evidence review.

Impact: coaches must leave the evidence they are reviewing to use feedback tools elsewhere. The main workspace has no direct Add student action.

Refinement: add a visible Add student/invite action, put feedback beside evidence with save status and history, and make the active class consistent across overview, management, and programs. Keep management tools available until their workflows are replaced and verified.

### 8. Low: dashboard text does not reflect the current academic integration

Evidence: the overview academic card says “Connection pending,” while selecting it mounts SchoolLearningPanel's Academic area. The page also mixes a fixed legacy TERM with school/program offerings.

Refinement: derive availability from the actual service state; label legacy portfolio term separately from current program year; use clear coach-oriented navigation and useful next actions for empty states.

## Development order

1. Secure student provisioning and class assignments; remove out-of-scope reads and unsafe HTML handling.
2. Make roster loading and saves truthful; remove fabricated activity state.
3. Unify student invitation, evidence review, feedback, and class context.
4. Refine navigation, academic status, empty states, mobile layout, and keyboard behavior.

## Verification status and required follow-up

Attempted targeted Vitest execution for coach roster, lesson editor, school workspace, and program maker UI. The node_modules directory is empty and the local Vitest executable is missing. The npx attempt produced no test results and was stopped. No tests are claimed as passing, and no dependencies were installed.

The existing `tests/coach-portal-audit.test.js` constructs example payloads and CSV text independently of production code; its success would not prove the actual workflows work. `tests/coach-roster-stats.test.js` covers student filtering and an explicitly scoped empty roster, but does not cover an unassigned coach's fallback queries or real account provisioning.

Before pilot approval: restore dependencies; run meaningful unit/UI tests and emulator-backed authorization tests; visually inspect desktop/mobile views; test Anna's creation, invitation/login, roster persistence, learning submission, coach feedback, parent isolation, and logout using synthetic identities. Verify deployed Auth settings and direct request restrictions separately. Do not delete existing accounts or deploy as part of this audit.
