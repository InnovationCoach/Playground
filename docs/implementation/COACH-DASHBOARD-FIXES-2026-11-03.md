# Coach dashboard fixes — 3 November 2026

## Result

Implemented the dashboard audit's core fixes in the local working tree. Production deployment and testing with real pilot participants have not occurred. Existing unrelated work was preserved.

## Changes

- Added an authenticated server route for administrator/coach student provisioning. It requires signed role and school/class scope intersected with the current profile, validates the selected class and school, fixes the role to student, and saves classIds, schoolIds, organization, age band, and audit event. It rechecks assignments in the transaction after the Auth calls.
- Removed browser-side secondary-session student creation and the shared default password. Students choose their own password through a Firebase password-reset setup link. The link is returned only to the authorized caller with no-store caching and is not stored or logged by this route. No email delivery is claimed.
- Added cleanup of newly created Auth accounts when setup or database writes fail. If deletion fails, the route attempts to disable the account and returns an explicit administrator-cleanup error. Auth and Firestore are separate services: a service outage affecting both deletion and disabling still needs administrator recovery.
- Added a scoped setup-link recovery endpoint and a pending-student action. Recovery is blocked once a password provider has been established or the account is disabled. Duplicate emails return a conflict rather than creating a second account.
- Added Add a student to the main workspace and connected both legacy registration buttons to the same dialog. Class selection is maintained when switching between overview and management tools.
- Removed demo-class and global roster fallbacks. Signed coach class claims are required; UI profile data cannot supply missing permissions. Failed main-workspace roster batches now produce explicit error/incomplete states rather than a successful empty roster.
- Escaped scalar text and quoted attributes in legacy HTML templates, switched notification messages to textContent, and protected CSV text against formula prefixes.
- Removed sample activity metrics, fabricated new-student telemetry, fabricated learner-review values, automatic five-star ratings, default recorded sessions, and account-creation dates presented as activity dates.
- Ratings now use a keyboard-accessible select, await the write, show save/error status, restore the previous value on failure, and load the coach's saved rating after refresh.
- Added work-context written feedback and feedback history beside the main learner review. A failed save preserves the draft, and retries reuse the same document ID. Feedback is not labeled as approval.
- Restricted feedback and notification writes to an assigned coach with a current matching profile and active class assignment. Authors cannot be forged or changed, ratings and text are validated, and recipients can change only notification read state. Reassignment/suspension stops assessment writes even with an older token.
- Legacy task and assignment creation now includes an assigned class. A failed task save no longer displays a locally fabricated success. Account listings respect the selected class.
- Updated academic navigation copy and labeled the fixed legacy portfolio term separately.
- Fixed the isolated preview's locale provider and fixture exports, and restricted its dependency entry scanning. All preview operations remain synthetic.

## Verification

- 37 targeted UI/model tests across coach workspace, roster/stats, lesson editor, school workspace, and program maker.
- 33 emulator-backed API tests across student provisioning and school workspace. These include real emulator password setup and sign-in, duplicates, restricted roles/classes, setup-link recovery, database-failure cleanup, and a coach reassigned during provisioning.
- 79 Firestore emulator tests, including feedback forgery, cross-class access, update validation, notification tampering, and reassignment/suspension.
- Production build passes. Vite reports that the compatibility registration helper's dynamic API-client import shares a chunk with existing static imports; this is a bundling notice, not a failed build.
- Browser checks at 1440 × 1000 and 390 × 844: learner review, student form, sample form submission/result, distinct empty/error/unassigned states, no page errors, and no mobile horizontal overflow. The main browser check blocked external requests and observed none.
- Tests used demo Firebase projects only. Existing locally installed dependency packages were reused through ignored workspace links; no package manifest or lockfile changes were made for this work.

Screenshots are in `docs/implementation/coach-dashboard-fixes-2026-11-03/`: desktop review/invite, mobile review/invite, and mobile setup result. These show sample identities only.

## Staging and pilot handoff

Deploy the backend, frontend, and Firestore rules together to staging, then run the participant journey with synthetic identities: create a student, privately deliver the setup link, set a password, sign in, confirm roster persistence, submit learning, and save/reload coach feedback. Confirm parent isolation through the parent portal separately.

The original broader pilot preparation still requires public-registration restrictions (including Firebase Auth service configuration, not just hiding the login link), a review of existing accounts, parent linking, approved participant email addresses, and production-environment verification. Those were not implemented by this coach-dashboard change. The older signup UI and administrative provisioning workflows remain separate follow-up work; this report does not declare the whole app pilot-ready.

School access must already be provisioned with signed school/class claims and matching profile assignments. Missing assignments deliberately block student creation. Email delivery remains manual; do not place setup links in shared documents, screenshots of real accounts, logs, or source control.

For rollback, restore this task's application/router/rule changes together from the reviewed diff. Preserve unrelated working-tree edits. Do not remove legitimate provisioned student accounts as part of code rollback; reconcile any failed setup explicitly using the audit record and account identifier.

Firebase's documented Admin setup-link mechanism: https://firebase.google.com/docs/auth/admin/email-action-links
