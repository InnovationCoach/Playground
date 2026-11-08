# WeLearn backend audit and external API integration contract

Date: 6 November 2026 (Asia/Bangkok)  
Audience: Mani and the WeLearn engineering team. Internal; do not use as a provider onboarding declaration.  
Decision: **Not ready for external academic-provider production integration.**

## 1. Scope, evidence and limits

This is an integration-focused source audit of the local working tree, not a penetration test, formal certification, exhaustive backend security review or verification of the deployed service. WeLearn is not currently a certified LMS, as confirmed by Mani. Edmentum is the academic content provider; WeLearn supplies the LMS experience.

Repository: InnovationCoach/Playground. Branch: `feature/coach-dashboard-ui-light-mode`. HEAD: `ae45762d8b77207eaa32d0613816375a0b69f721`. The working tree already contained substantial uncommitted changes, including backend changes. Findings apply to files read during this audit, not exclusively to that commit. The configured remote points to the expected repository but is spelled `https://github.com/InnovationCoach/Playground/`, whereas AGENTS.md requires `https://github.com/InnovationCoach/Playground.git`; it was not changed.

Reviewed in detail: Express route mounts and parsing, Firebase Functions entrypoint, LTI routes and signing helpers, OneRoster routes, Edmentum frontend service and tests, authentication helpers, school-scope helpers, academic-progress routes, Canva OAuth/export implementation, and selected outbound-service helpers. Other route families were inventoried, not exhaustively audited. Firestore and Storage rules require a separate dedicated audit; this report does not certify them. Secrets and credential files were not inspected. Deployed URLs, runtime environment, cloud IAM, licensed vendor accounts, and certification records were not tested.

No production calls, account creation, deployments, backend edits, permission changes, commits or pushes were performed. Gemini owns backend and rules implementation under AGENTS.md. Recommendations below are an implementation contract, not authorization to deploy or change permissions.

## 2. Current architecture and reusable foundations

`firebase.json` routes `/api/**` to the `api` HTTPS Function. `functions/index.js` wraps `server/app.js` with Node 22, region `us-central1`, 512 MiB memory and a 60-second request timeout. A successful bundle is not evidence that these exact settings are deployed.

The app uses Express, Firebase Authentication, Firestore Admin SDK and Storage. Common JSON parsing has an 8 MiB limit. CORS permits configured frontends, selected Firebase hosting domains and requests without an Origin header. CORS is not caller authentication. No common authentication middleware protects every route; security depends on each mounted router.

Useful existing foundations:

- `server/middleware/auth.js`: Firebase ID-token verification with revocation checking and a suspended-profile check, producing `req.caller`.
- `server/lib/schoolScope.js`: additional signed-claim/profile intersection and school/class/learner access checks. Use this pattern for human access to academic data after reviewing its suitability.
- `server/lib/errors.js`: structured error responses; the legacy AI middleware also emits a different string-error shape.
- `server/lib/audit.js`: server-side audit helper, not currently applied to LTI score ingress.
- `server/routes/school-workspace.js:1013`: scoped academic-progress reads and staff-recorded observations. This returns provider status `access_pending`, correctly distinguishing manual data from a connected provider.
- Canva implements real OAuth exchange logic, PKCE, encrypted stored tokens and refresh handling, but the gaps below prevent treating it as an approved universal integration template.

## 3. Existing API inventory

Paths below describe local code, **not approved URLs for vendors**. Do not give a vendor the current LTI endpoints as ready for use.

| Surface | Observed implementation | Readiness |
|---|---|---|
| `GET /api/lti/config` | Advertises LTI, Deep Linking and OneRoster compliance; returns configured/default identifiers | Claims exceed evidence |
| `GET /api/lti/jwks` | Public RSA JWK from a process-generated key | Prototype; unstable across instances |
| `GET, POST /api/lti/login_initiations` | Returns a JSON URL directed at a default Edmentum authorization endpoint | Incomplete/reversed platform flow |
| `POST /api/lti/token` | Signs a token after checking only grant type | Critical authentication gap |
| `GET /api/lti/ags/lineitems` | Three hard-coded assessment records | Fixture data |
| `POST /api/lti/ags/lineitems/:lineItemId/scores` | Writes to user score subcollection; silently falls back to memory | Critical authorization/integrity gap |
| `POST /api/lti/launch/:courseId` | Signs identity and role supplied in request body | Critical impersonation gap |
| `POST /api/lti/diagnostics` | Self-sign/verify and in-memory checks | Not interoperability or certification testing |
| `GET /api/oneroster/v1p1/users` | Reads up to 50 users with Admin SDK; otherwise returns fixtures | Critical unauthenticated data path |
| `GET /api/oneroster/v1p1/{classes,enrollments,courses}` | Static fixtures | Not a complete OneRoster implementation |
| `GET, POST /api/schools/:schoolId/academic-progress` | Scoped reads and manual staff observations | Existing internal workflow; not provider ingress |
| `GET /api/canva/oauth/start`, `/oauth/callback`, `/connection`; `POST /disconnect`, `/designs/:designId/export` | OAuth/export adapter; callback relies on stored state, other routes require claims | Implemented, further hardening required |
| Admin, coach, parent, school, pilot, quest and universe routes | Internal application APIs with differing role/scope checks | Do not expose wholesale as partner APIs |
| AI HTTP routes and callable `generateCoachCue` | Outbound Gemini requests | Separate data-sharing and authorization review needed |

No implemented LTI Deep Linking return handler or NRPS service was found in the reviewed backend. No generic external-provider webhook receiver, academic-provider adapter registry or complete external API specification was found. Canva's bundled OpenAPI file describes Canva, not WeLearn's public API.

## 4. Prioritized findings

Severity reflects impact if the reviewed code is publicly reachable with its configured backend privileges. Live exposure is unverified. Evidence paths are relative to the repository; line numbers refer to the audited snapshot.

### F01 — Critical: unauthenticated roster reads

Evidence: `server/app.js:135-136`; `server/routes/oneroster.js:117-142`.

The router has no authentication guard. `/users` queries the global `users` collection and returns identifiers, names and email addresses without school or partner scope. The 50-record limit limits a response, not access authorization. Static review establishes the data path; no real user records were fetched during this audit.

Required: disable this surface until a registered service identity, allowed-school scope, approved fields, pagination and audit logging exist. Returning fixtures on database errors must be limited to explicitly isolated demo environments. Choose and validate one supported OneRoster version; do not claim bidirectional 1.1/1.2 support from these read-only fixtures.

### F02 — Critical: score writes have no caller authorization

Evidence: `server/routes/lti.js:165-209`.

No bearer-token, scope, deployment, membership or line-item ownership check occurs before an Admin SDK write to `users/{userId}/edmentumScores/{lineItemId}`. A caller controls both identifiers and score values. Firestore client rules are not the authorization boundary for this Admin SDK write.

Required: validate a tool service token and its approved scopes; resolve the registered deployment, school, resource and learner server-side; reject unknown/cross-school mappings; commit the result and audit record durably before acknowledging it. Missing credentials must produce 401 and insufficient scope 403, with no write.

### F03 — Critical: arbitrary identity launches and unauthenticated token issuance

Evidence: `server/routes/lti.js:101-128`, `215-247`.

`/token` destructures but never verifies `client_assertion` or its type and accepts requested scopes without an allowlist. `/launch` signs request-supplied `uid`, teacher/coach role and target URL without verifying a WeLearn session, enrollment or entitlement.

Required: authenticate the learner/teacher, derive identity and role from trusted records, enforce licensed enrollment and registered destinations. Service-token issuance must validate registered tool assertions, signatures, issuer/subject/audience, expiration and replay identifier, and authorize only registered scopes. Human Firebase tokens and partner service tokens serve different audiences and must not be interchangeable.

### F04 — High: key lifecycle and JWT validation are incomplete

Evidence: `server/lib/lti.js:13-52`, `104-120`.

Each process creates its own signing key but uses the same fixed key ID; JWKS caching lasts 24 hours. Cold starts/multiple instances can therefore publish different keys with the same ID. The verifier checks the signature but not expiration, audience, issuer or nonce. An expired signed token was accepted in an isolated check.

Required: managed persistent signing keys, distinct key IDs, rotation with overlap and consistent multi-instance JWKS. Use a maintained JWT/OIDC implementation with explicit algorithm and claim validation. Cache provider JWKS with controlled refresh; never accept arbitrary request-supplied key locations.

### F05 — High: incomplete OIDC and overstated capabilities

Evidence: `server/routes/lti.js:22-40`, `57-95`, `255-325`; `server/lib/lti.js:126-184`; `server/app.js:97-103`.

The login handler constructs an authorization request toward Edmentum even though WeLearn is intended to act as the platform. Generated state is timestamp-based, not stored or validated, and the launch nonce is independently generated rather than tied to a validated authorization transaction. No complete platform authorization flow, Deep Linking handler or NRPS service was found. The Express app configures JSON parsing, with no URL-encoded parser in the reviewed route path; standard form-encoded token requests therefore need explicit support. Platform-runtime parsing must also be verified in staging.

Required: implement the correct platform/tool exchange described in section 6. Replace compliance labels with an evidence-based capability/status record. Internal diagnostics must say what was tested and must not imply vendor connectivity or certification.

### F06 — High: score durability, validation and ordering

Evidence: `server/routes/lti.js:169-209`.

Persistence failure still returns 200 with `recorded`; the fallback is an unbounded process-local Map. Zero maximum scores are accepted and produce a non-finite percentage. Numeric, timestamp and enum validation is incomplete. Overwrites use only learner and line-item IDs, without a stale-event check or preserved attempt history.

Required: validate the agreed AGS schema, including valid progress-only updates where supported; derive percentages only for valid numeric scores and positive maxima. Preserve source timestamp separately from received time. Deduplicate delivery, handle late/corrected grades explicitly, and make writes atomic. Return a retryable error on failed durable persistence rather than fabricating success. No process-memory fallback for production grades.

### F07 — High: frontend simulates a successful provider connection

Evidence: `src/features/edmentum/edmentumService.js:77-89`, `101-171`, `177-213`; `tests/edmentum-lti.test.js`.

Defaults claim `connected: true` and `production_ready`. Course metadata/launch URLs and learner grades are hard-coded; grades live in browser localStorage. Failed launches return `success: true` with a mock token. There is no read in this service from the backend `edmentumScores` collection. Another academic-progress route instead reports `access_pending`.

Required: demo fixtures only in explicit demo mode. Derive connection status from server-side registration and successful verification. Show missing/stale data honestly. Use a single authorized academic-data read model with provenance. Never promote mock tokens or localStorage scores as provider evidence.

### F08 — High: Canva publishing lacks class authorization

Evidence: `server/routes/canva.js:269-420`.

A signed-in caller can request `publish: true` or `purpose: resource` and supply a class ID. The branch does not require a coach/admin role or verify membership of the selected class before uploading a class-folder asset. This proves a missing check in the upload path, not that a downstream classroom automatically displays the asset.

Required: check allowed staff role and current class/school scope before export/publish side effects. Keep private export permission separate from class publishing permission. Add cross-class and student-publish rejection tests.

### F09 — High: callable coaching cue lacks learner-scope authorization

Evidence: `functions/index.js:86-137` and subsequent submission update.

`generateCoachCue` checks staff role but reads an arbitrary supplied submission ID and its learner, optionally sends its content/name to Gemini, and updates that submission without checking the caller's school/class assignment. This is a source finding; the callable was not invoked.

Required: establish current learner/submission access before reading sensitive content, making an external AI request or updating records. Test unauthorized staff and suspended/reassigned users. Review the `VITE_GEMINI_API_KEY` fallback: a frontend-prefixed secret must not be the prescribed backend credential source; actual exposure was not investigated.

### F10 — Medium: external-service reliability and operational controls

Evidence: `server/routes/canva.js:135-158`, `300-354`; `server/canva/client.js`; `server/canva/storage.js`; `server/auth.js:76-98`.

Canva state consumption uses separate reads/updates instead of an atomic claim. Concurrent refresh requests can race. Individual fetches/downloads lack explicit abort deadlines and streamed size limits; a 60-second polling budget is already equal to the Function's request timeout before download/upload. Missing Cloudinary configuration returns a simulated URL. Legacy `requireAuth` lacks the revocation/profile checks used by `requireClaims` and permits an unverified identity when Admin initialization fails outside production.

Required: atomic state consumption and refresh coordination; bounded requests/downloads and validated destinations; asynchronous job processing for long exports; explicit unavailable status when credentials are missing; fail-closed authentication for integration routes in every non-demo environment. Review child-data sharing requirements; the Canva start handler currently comments that its age check was removed, so a helper's existence is not evidence of enforcement. Policy changes require Mani's approval.

## 5. Data ownership and proposed provider model

This section is a **proposal for Gemini**, not an existing schema or API promise.

| Data | Authoritative owner | WeLearn responsibility |
|---|---|---|
| Academic content, assessment definitions and source grades | Edmentum, within the licensed product | Retain licensed references, source IDs and provenance; do not infer permission to copy content |
| WeLearn identity, school/class access and local assignments | WeLearn | Validate every human request and provider-to-local mapping |
| Provider entitlement/account mapping | Agreed provisioning workflow | Store approved mapping and status; do not assume a local launch allocates a seat |
| Imported results | Provider source; WeLearn controlled mirror | Preserve original values, timestamps, corrections and import status |
| PBL work, coaching notes and local observations | WeLearn | Keep distinct from provider-verified grades |

Suggested server-only records: provider registrations (environment, school scope, client/deployment IDs, approved endpoints, allowed scopes and secret references); provider-user mappings; resource links tied to local offerings/lessons; normalized source-grade events; processed-event receipts; synchronization jobs and audit events. Names and indexes must be finalized by Gemini. Tokens and private keys must not be stored in browser-readable documents.

Use an opaque subject mapped by provider registration/deployment and school to a local learner. Do not assume LTI `sub`, SIS ID, Firebase UID and provider account ID are interchangeable. Define withdrawal, suspension, re-enrollment, duplicate account resolution and licence release behavior.

Existing `schools/{schoolId}/academicSnapshots` records have `sourceMethod: coach_recorded`, learner/class/provider/course/curriculum, completed/total units, `dataAsOf`, `recordedBy` and `importedAt`. Preserve this provenance. Do not silently convert observations to provider grades or equate activity completion with whole-course completion. Decide a controlled projection into the learner dashboard rather than maintaining three incompatible grade stores.

## 6. Proposed Edmentum LTI contract

Edmentum's published integration page supports the direction of lesson/course-structure access through an LTI 1.3 LMS. Product-specific support, custom-platform onboarding, certification requirements, licensed content, embedding and grade granularity remain unconfirmed.

Correct responsibilities:

| WeLearn platform supplies | Edmentum tool supplies |
|---|---|
| Approved issuer and platform authorization endpoint | Login-initiation endpoint |
| Platform-issued client ID and deployment ID | Registered redirect/launch destinations |
| Stable signing JWKS | Tool JWKS for tool-signed assertions/messages |
| OAuth service-token endpoint | Supported assertion parameters and requested scopes |
| Authorized AGS services, if implemented | Confirmed grade-return behavior |
| Deep Linking return endpoint, if implemented | Content-selection endpoint and supported resource granularity |

Desired flow:

1. An authenticated, entitled learner selects a stored resource inside WeLearn. The server resolves identity, school/class context and approved tool registration.
2. WeLearn initiates login at Edmentum's registered initiation endpoint using scoped, short-lived hints.
3. Edmentum sends its OIDC authentication request to WeLearn's authorization endpoint. WeLearn validates client, redirect URI, session and transaction binding; returns the signed LTI ID token by the required form-post flow, preserving the tool's state and requested nonce.
4. Edmentum verifies the launch and serves the activity. An iframe or new window is selected according to verified vendor/browser support. A new window must not silently be presented as satisfying a requirement to remain embedded.
5. For grade return, Edmentum authenticates with its signed client assertion to WeLearn's token endpoint and receives a narrowly scoped service token.
6. WeLearn authorizes each AGS operation against the registered deployment, line item and learner, persists/audits the event, and exposes the result only through scoped application reads.

Deep Linking is optional until confirmed: authorized staff launch the tool's picker; WeLearn verifies the signed response and transaction, validates each destination and saves licensed resource references. It does not download proprietary course assets by default. Course-structure import and actual asset rehosting need separate vendor/licensing confirmation.

Keep all environment URLs and identifiers marked **TBD** until provisioned and verified. Defaults in code and the earlier PDF disagree and are not registration evidence. Passing an internal test does not make WeLearn certified.

## 7. Contract for other outsourced APIs

Use a provider adapter boundary rather than allowing each vendor to write arbitrary Firestore documents. For each provider agree on:

- Purpose, product/version, sandbox/live environments, data owner, approved schools and minimum required fields.
- Human OAuth versus service-to-service credentials, scopes, expiry, revocation and rotation. Secrets remain server-side, supplied through approved secret management.
- Exact endpoints, schemas, media types, pagination, timestamps, rate limits and error semantics. Produce a versioned WeLearn OpenAPI specification for custom REST interfaces; retain standard LTI payloads for LTI endpoints.
- Provider callbacks: authenticated signature/token checks, bounded request bodies, replay protection and durable event receipts before acknowledgement. Use raw-body preservation where the vendor's signing protocol requires it; the present byte-count capture is not that feature.
- Stable deduplication keys, retries with backoff/jitter, timeout budgets, reconciliation and dead-letter review. Never retry an unsafe side effect without an idempotency strategy. Reject invalid data rather than substituting fixtures.
- School/class authorization derived from registered credentials and mappings, not caller-supplied `schoolId` alone. Never provide vendors a broad Firebase Admin credential.
- Standard custom-API failures: 400 invalid data, 401 invalid credentials, 403 forbidden scope, 404 missing permitted resource, 409 conflict, 429 rate limit with retry guidance, and 503 temporary upstream/persistence failure. Standard endpoints must use their protocol-defined response format where it differs.
- Correlation IDs, provider/environment/status/latency metrics and audit records without tokens or unnecessary student content. Establish support ownership and revocation/incident procedures.
- Human-readable sync state: disconnected, setup pending, sandbox verified, active, degraded or revoked; display last successful sync and source date. These are proposed states, not current functionality.

## 8. Verification performed

| Check | Result | Limit |
|---|---|---|
| Source route/middleware inspection | Findings above | Does not establish cloud exposure |
| Direct isolated LTI handler probes | No-auth token issued with arbitrary scope; no-auth instructor launch accepted an unregistered destination; no-auth zero-maximum score acknowledged | No Express/cloud HTTP stack or real vendor exercised |
| JWT helper probe | Correctly signed expired token accepted | Demonstrates missing claim checks in helper |
| Roster failure-path probe | Returned three fixtures with HTTP 200 | Real database read path assessed statically only |
| Selected Vitest suites | 4 files, **34 tests passed** | Edmentum tests mostly validate local signing/fixtures; not conformance or negative authorization tests |
| Frontend production build | Passed; large-chunk warnings | No deployment, browser or vendor acceptance test |
| Functions entrypoint bundle | Passed using root-installed esbuild | Functions-local dependencies absent; not a clean deploy build |

The isolated probes imported only the LTI/roster routers and signing helper. They asserted `getApps().length === 0`; Firebase was never initialized, so no database access or provider traffic occurred. Synthetic IDs were used and no token values were logged. Grade persistence failed locally and the handler still returned `recorded`, confirming F06.

Commands used:

```sh
npx --no-install vitest run tests/edmentum-lti.test.js tests/api-resilience.test.js tests/canva-page.test.js tests/canva-section.test.js
npm run build -- --outDir /private/tmp/welearn-integration-audit-build
./node_modules/.bin/esbuild functions/index.js --bundle --platform=node --target=node22 --format=esm --outfile=/private/tmp/welearn-integration-audit-functions.mjs --packages=external
```

The first backend bundle attempt using `functions/node_modules/.bin/esbuild` could not run because that executable was absent. The root-installed tool succeeded. No dependencies were installed. Full emulator/API/rules suites, vendor staging tests, concurrency/load tests and clean-install deployment builds were not run. No code was fixed during this audit; passing builds do not resolve the findings.

## 9. Gemini handover and acceptance gates

1. **Containment proposal:** identify whether the affected code is deployed through an authorized read-only inspection; prepare disabling the LTI/OneRoster prototype routes and misleading connected state. Any production change and any authentication/permission change requires Mani's written approval under AGENTS.md. This document is not that approval.
2. **Vendor discovery:** obtain the answers in the companion provider brief and settle product, content delivery and certification requirements. Do not promise a four-week delivery date yet.
3. **Backend foundation:** implement registered/scoped service identities, persistent keys, mappings, durable grade events, audit records and negative-path tests; address Canva/callable cross-class authorization separately.
4. **Local verification:** emulator-only fixtures for two schools and multiple roles. Required rejection cases include missing/expired/replayed tokens, wrong audience/issuer, forged roles, unknown destinations, cross-school users and line items, unlicensed enrollment, revoked registration and suspended learners. Database failure must never produce a durable-success claim. Test duplicates, late/corrected grades, non-finite numbers and legitimate zero scores/progress-only updates.
5. **Protocol verification:** standard form bodies, OIDC state/nonce, tool assertion/JWKS rotation, multi-instance key consistency, AGS scopes/media types and supported Deep Linking. Run official diagnostics; pursue formal certification separately if required. Record exact versions/results.
6. **Vendor staging:** after approval for the exact environment step, one synthetic learner, one licensed test resource and a verified source grade visible through the scoped WeLearn read model. Demonstrate reconnect/retry and entitlement removal. No real learners until authorized.
7. **Pilot/release:** Mani reviews evidence, data-sharing terms, support/rollback plan and gives written approval for the exact deployment. Backend source changes remain Gemini-owned. Inspect the diff against `origin/main`, complete relevant tests/builds and provide changed files and trial instructions before any push.

## 10. References

Primary standards and vendor material checked during this conversation; these describe the standards/vendor statements, not proof of WeLearn implementation:

- [Edmentum integrations](https://www.edmentum.com/support/integrations/)
- [LTI 1.3 Core](https://www.imsglobal.org/spec/lti/v1p3)
- [LTI Advantage implementation guide](https://www.imsglobal.org/spec/lti/v1p3/impl/)
- [LTI certification guide](https://www.imsglobal.org/spec/lti/v1p3/cert)
- [Assignment and Grade Services](https://www.imsglobal.org/spec/lti-ags/v2p0)
- [Names and Role Provisioning Services](https://www.imsglobal.org/spec/lti-nrps/v2p0)
