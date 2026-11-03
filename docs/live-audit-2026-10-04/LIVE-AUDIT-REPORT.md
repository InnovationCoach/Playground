# Live platform audit - director's handover

**Date:** 4 October 2026, Asia/Bangkok  
**Target:** https://dnd-master-73449.web.app/  
**Recipients:** Claude (UX/UI and frontend), Gemini (Firebase, backend and deployment)  
**Recommendation:** Treat core school operations as blocked until live API routing and coach access are restored. Do not treat a successful static-site deployment as a working release.

## Executive assessment

The live frontend loads. Administrator, coach (on retry) and primary-student test accounts can sign in. Important workflows then fail: administrator lists return “Not found”, the school-learning workspace and calendar display `NOT_FOUND`, and the coach cannot obtain its assigned roster. These are operational failures before they are visual-design issues.

The strongest working areas observed were the clear sign-in form, recognisable navigation, static PBL framework and Junior Explorers activity structure. The weakest areas were service availability, actionable error recovery, trustworthy totals, and inconsistent styling across legacy and newer components.

**No production records were deliberately created, edited, deleted or submitted.** Login and navigation may produce normal application access/telemetry records. No emails, messages, invitations, password resets or deployments were triggered. Accounts were signed out after inspection. This report was prepared for handoff; it was not sent to coworkers externally.

## Evidence and scope

### Verified live

| Surface | Result | Evidence |
|---|---|---|
| Public sign-in | Loads; labelled fields, password visibility, language selection and recovery entry point | [Login](screenshots/01-login.png) |
| Administrator login | Successful | [Students](screenshots/04-admin-students.png) |
| Administrator students | “Could not load this list. Not found.” | [Students](screenshots/04-admin-students.png) |
| Administrator parents list | Same error observed after navigation | DOM inspection; no settled standalone screenshot cited |
| Administrator material requests | List fails; summary totals remain 0 and THB 0 | [Materials](screenshots/08-admin-materials.png) |
| Administrator school learning | `NOT_FOUND` replaces content | [Learning](screenshots/07-admin-learning.png) |
| Coach login | First attempt produced a connection error; retry succeeded | [Initial error](screenshots/02-coach-sign-in-error.png), [workspace](screenshots/09-coach-home.png) |
| Coach roster | Initially unavailable; later “verified coach and class access is missing” | [Roster](screenshots/09-coach-home.png), [access state](screenshots/11-coach-academic.png) |
| Coach academic section | Missing class access and `NOT_FOUND` | [Academic](screenshots/11-coach-academic.png) |
| Coach PBL framework | Loads static Sustainable Futures framework; unfinished term/theme label visible | [PBL](screenshots/10-coach-pbl.png) |
| Primary-student login | Successful, Penny Primary / Junior Explorers | [Primary home](screenshots/12-primary-account.png) |
| Primary activity | Hot Spots activity overview and task choices load | [Activity](screenshots/13-primary-activity.png) |
| Primary calendar | `NOT_FOUND` | [Primary home](screenshots/12-primary-account.png) |
| Secondary test account | Supplied Mia credentials rejected as not matching an account | [Login result](screenshots/03-student-sign-in-error.png) |
| Registration | Offers ages 13-15 and 16-18; states staff/parent accounts are school-created | [Registration](screenshots/14-registration.png) |

### Public HTTP checks

GET requests to `/api/learning-context`, `/api/admin/users` and `/api/parent/children` returned **404 with `text/html`**, not an API JSON response. Requests were unauthenticated and did not extract or reuse browser tokens. Authentication-protected API routes should ordinarily respond with an intentional JSON authentication error to such requests, not a Hosting missing-page response.

The root returned 200 HTML. A HEAD request to `/health` returned 404 HTML; this alone does not prove that no backend exists elsewhere. The public module asset was `/assets/index-DcAz3u3u.js`; the root response reported last modification on 3 October 2026 at 17:19:27 UTC. That does not establish its source commit or backend version. Local Git HEAD was `dbc57ab3fc6f228882c9b927deab92f67d2dcf6f`, with uncommitted work; it must not be assumed to identify the deployed build.

Local `firebase.json` contains no API rewrite, consistent with the live symptom. Confirm the actual deployment configuration before assigning a definitive infrastructure root cause.

### Not verified live

- Parent authenticated dashboard: no working parent credentials were supplied. The API route was checked publicly; that is not a parent-session audit.
- Secondary learner dashboard: supplied test credentials did not work. No account creation or password reset was used to bypass this.
- Persisted lessons, goals, submissions, calendar changes, payments, messages or enrollment.
- Deployed Firestore/Storage rules, claims contents, service account permissions, database edition, indexes and backend logs.
- Mobile layout, screen-reader behaviour, full keyboard coverage, measured contrast conformance and performance benchmarks.

Earlier local-preview findings are listed separately below. They are not presented as live-session observations.

## Prioritised findings

### LIVE-01 - P0 - API routes unavailable on the public origin
**Owner:** Gemini; Claude supports error states.

**Reproduce:** Sign in as the supplied admin; open Students or School learning & calendar. Independently GET the public API routes listed above.

**Observed:** Administrative lists and school workspace fail. Public routes return HTML 404.

**Impact:** User management, family progress, lessons, goals and shared calendar cannot be relied on through the intended API path.

**Fix:** Identify the intended Cloud Run/Functions/other backend and deploy it with the correct project identity. Route `/api/**` to that service, preserving the path and middleware contract; place any SPA fallback after the API rule. Alternatively use a deliberate API origin and configure CORS correctly. Confirm the compiled API base and remove deployment ambiguity. Do not substitute mock responses or loosen authorization to make screens appear populated.

**Accept when:** Unauthenticated protected requests return JSON 401; valid authorized requests return scoped JSON data; forbidden requests return JSON 403. Every role's school context and permitted reads work on the live origin. API requests never return a static HTML page.

### LIVE-02 - P0 - Coach has no usable assigned roster
**Owner:** Gemini.

**Observed:** The coach first reports unavailable class records; after navigating back, it reports that verified coach/class access is missing. This is not evidence of an empty enrolled class.

**Fix:** Verify the account's signed role and class IDs, protected profile, school membership and actual class/student documents. Refresh its token after correcting assignments. The roster reads Firestore directly, while school workflows use the API; diagnose both paths. Verify queries and indexes using deployed rules. The local component enters the unassigned state when role is not teacher/coach or signed classIds is empty; the exact failing claim was not inspected.

**Accept when:** A known assigned learner appears; an unrelated learner does not; changing or revoking assignments updates access after token refresh. Missing assignment, denied access and network failure remain distinct states.

### LIVE-03 - P1 - Unreadable dark-on-dark headers
**Owner:** Claude.

**Observed:** The coach hero and school-calendar header have dark text/buttons on a dark blue surface. Screenshots 09 and 12 demonstrate the visual problem.

**Fix:** Inspect computed styles and legacy global `header`/heading rules. Scope legacy styling and give the new components explicit surface/foreground tokens. Use white or suitably contrasting text on navy, or return the cards to a light surface. Check hover, disabled and focus states too.

**Accept when:** Text contrast is measured at WCAG AA targets (4.5:1 normal text; 3:1 large text); controls remain readable in both themes and in the complete live shell. Isolated preview screenshots are insufficient.

### LIVE-04 - P1 - Failed records are displayed as zero totals
**Owner:** Claude, with Gemini's response contract.

**Observed:** Material Requests shows 0 Requests, 0 Items and THB 0 while its list says it could not load.

**Fix:** Distinguish loading, verified empty, unavailable and stale states in summary cards. Show “Unavailable” on initial failure. If retaining prior data, label it with the last successful update and an error notice.

**Accept when:** A forced API failure never produces fabricated zero totals; a successful empty response may show zero; a successful populated response shows verified totals.

### LIVE-05 - P1 - Error codes and generic recovery shift the burden to users
**Owner:** Claude + Gemini.

**Observed:** School learning shows bare `NOT_FOUND`; roster errors initially ask the user to check their connection. These messages do not identify a workable recovery path.

**Fix:** Map structured errors to role-appropriate messages. Example: “School learning is temporarily unavailable. Your work has not been changed.” Provide Retry, a last-updated indicator where relevant, and a school support route. Keep diagnostic codes/correlation IDs in expandable details or logs. Gemini must differentiate unauthenticated, forbidden, missing resource and unavailable service responses.

**Accept when:** Primary learners never see raw machine codes. Admins can obtain useful diagnostics. Retry does not imply that it repairs school assignments or backend deployment.

### LIVE-06 - P1 - Test-account coverage is incomplete
**Owner:** Gemini.

**Observed:** Admin and primary accounts work; coach works on retry; the supplied Mia credentials fail. Parent-session coverage is unavailable.

**Fix:** Provide a controlled role test matrix with working accounts, intended school/classes, linked children and expected records. Verify whether the secondary account exists, is disabled or has different credentials. Share credentials securely, not in this report. Do not reset real users or seed production blindly.

**Accept when:** Admin, coach, secondary, primary and parent roles can complete the agreed smoke tests with identifiable test records and no cross-role access.

### LIVE-07 - P2 - PBL entry point feels like a reference document
**Owner:** Claude; Gemini supplies authoritative offerings.

**Observed:** “PBL framework” opens a long Sustainable Futures explanation, a 12-week plan and competency tables. It also says “Term 3, 2026” and “theme to be confirmed.”

**Fix:** Separate **My programs / Current project** from **Programme guide**. Lead the working view with current milestone, next action, evidence awaiting feedback and coach context. Keep reference material available through progressive disclosure. Resolve the legacy term label through the agreed offering mapping; do not rewrite historical evidence IDs just for presentation.

**Accept when:** Sustainable Futures, Net Zero Microgrid and Project Arachne follow the agreed semester sequence through real offerings. Learners can find their current action without reading the entire framework. Published programs have approved titles and dates.

### LIVE-08 - P2 - Primary home has equal-weight choices and disconnected calendar styling
**Owner:** Claude.

**Observed:** Eight colourful activity cards compete equally; the calendar is a large, differently styled panel below. Read-aloud and large-text controls are positive features. The activity overview has clear stages and worksheet access.

**Fix:** Add a coach-assigned or resumable next activity above the library, preserve Explore all, and use a compact upcoming-events card. Keep age-appropriate visuals, but reduce competing border colours and align shared surfaces/spacing with the brand. Inspect sticky-header offsets; the full-page capture shows content beneath the header, which needs interactive verification before treating it as a persistent overlap defect.

**Accept when:** A learner can identify where to start, return to all activities and ask for help. The calendar unavailable state is compact and understandable. Primary styling remains distinct from the adolescent W2e experience.

### LIVE-09 - P2 - Registration leaves 11-12-year-old onboarding unclear
**Owner:** Claude + Gemini.

**Observed:** Self-registration only offers 13-15 and 16-18. The target W2e cohort includes ages 11-18. No account was created during this audit.

**Fix:** Do not simply open self-registration to younger children. Explain the school-provisioned route for under-13 learners and verify age-band, consent and assigned curriculum handling. Replace the broad claim that age sets AI reading level with wording matching actual implemented behaviour.

**Accept when:** An 11-12-year-old and their family know how to obtain an account; school-created accounts receive the right experience without falsifying age. Account creation and consent rules are enforced server-side.

## Conditional integration checks from local review

These require verification after live role access is restored; they are not additional confirmed live observations:

- Parent Studio Home currently branches to the coach panel in local `SchoolLearningPanel.jsx`. Build a dedicated linked-child overview. Never expose private support requests/preferences merely because a shared component renders them.
- Local `W2eLearnerStudio.jsx` hardcodes Alex, a microgrid task and events. The served bundle contains “Hi Alex”, but the secondary dashboard was not reached. Replace sample identity/task/calendar content with authorized records before enabling this route.
- Local motivational carousel can translate its only rendered slide out of view. Reproduce in the complete deployed student shell after account access is repaired.
- Local coach support summary values include constants. Audit all cards for fabricated totals and placeholder preferences.
- A localhost fallback string exists in the public bundle's legacy SEN integration, but App passes an explicit API endpoint locally. This is a configuration review item, not proof that a live request targets localhost.
- AI draft, upload and provider-sync features must state their real capability. Presence of controls or routes does not prove a live model, storage pipeline or provider connection.

## UX direction by role

**Student:** My next step, Continue, Ask my coach, then optional exploration. Keep Focus/Explore, learner-selected display preferences and equivalent evidence formats. Make assignment, draft, submitted, feedback and completed states explicit.

**Parent:** One persistent child switcher; recent success, current focus, upcoming events and a practical support suggestion. Distinguish PBL evidence from academic observations. Show source and date; avoid interpreting completion counts as grades. No coach-only controls or private support notes by default.

**Coach:** A compact queue of learner requests and evidence needing feedback, followed by assigned roster and domain filters. Preserve separate PBL, STEAM, Academic, Goals and Calendar sections. Use the learner's actual preferences only when permission and data support it.

**Admin:** Service status and setup gaps must be visible before operational actions. Calendar editing belongs here; program offerings, class codes and account assignments need clear confirmation and audit history.

## Release order and ownership

1. **Gemini:** restore backend routing; verify service identity and access; repair test-role assignments; return evidence of real JSON responses and scoped reads.
2. **Claude:** fix contrast and CSS conflicts; correct unavailable/zero states; improve recovery copy and route-loading behaviour. Can proceed using explicit fixtures while backend work is underway.
3. **Both:** integrate role-specific homes using agreed API contracts, preserving legacy evidence and class isolation.
4. **Both:** run role smoke tests against a staging deployment and repeat critical checks on the live origin after release.
5. **Director/QA:** accept only on live evidence. A build passing or screenshot looking polished is not a completed workflow.

## Required release evidence

- Frontend commit/build ID, backend revision, Firebase project and environment; no secrets.
- Successful admin list, assigned coach roster, secondary task, primary activity, linked-parent overview and calendar reads.
- Staging creation/reload checks for one lesson, goal, evidence record and admin event; invalid/expired/reused codes tested; do not use real learner data for destructive tests.
- Negative checks: student cannot edit school events; parent cannot see unrelated children/private coach notes; coach cannot access another school/class; role changes are enforced server-side.
- No raw HTML API responses, raw error codes in child-facing views, placeholder totals, or low-contrast headers.
- Keyboard, focus return, 200% zoom, reduced motion, laptop and narrow-screen review.
- Provider status honestly indicates pending access until verified. AI remains clearly labelled where it is only a demonstration.

See [Claude UX/UI task brief](CLAUDE-UX-UI-FIX-BRIEF.md) and [Gemini backend task brief](GEMINI-BACKEND-FIX-BRIEF.md).
