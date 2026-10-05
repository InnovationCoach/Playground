# Phase 2 Firebase handoff for Gemini 3.6

The user authorized GPT to own the contract and feature implementation on 2026-10-05. Gemini 3.6 owns Firebase configuration and deployment. Claude review is no longer a prerequisite. Feature branch: `feature/coach-activities-p2`; checkout: `/private/tmp/hear-island-coach-p2`. Do not infer that this report authorizes merging or a production release: use the user's release instructions.

## Runtime configuration

1. Inspect the selected Firebase project, existing API function and deployment configuration before making changes. Preserve unrelated work.
2. Bind the existing school secret `school-gemini-api-key` to the API runtime with the appropriate Secret Manager permission. The feature reads `process.env['school-gemini-api-key']`. Do not expose it in browser configuration, responses, logs or screenshots. There is deliberately no fallback to plaintext `GEMINI_API_KEY`.
3. Configure `COACH_ACTIVITY_GEMINI_MODEL` on the server with an available, tested Gemini model supporting native JSON generation. The deployment agent's name/version is not a model ID. Confirm the selected model with official provider documentation and a controlled real request.
4. Preserve an API timeout above the overall 45-second inference deadline; the existing function timeout is 60 seconds. Validate hosting API rewrites and CORS against the intended origin.
5. Review existing server-only access rules for offering `activityDrafts`, school `aiUsage` and `programJoinAttempts`. This feature adds no direct browser writes or required composite indexes. Do not loosen rules to make a smoke test pass.

The feature builder did not edit `firebase.json`, the Firebase function entrypoint, rules, cloud secrets or project settings. Missing configuration returns `AI_NOT_CONFIGURED`, allowing manual creation without charging quota.

## Release checks

Run unit, API integration and rules suites using disposable emulators, plus the production build, from the integrated release branch. Resolve feature conflicts with the feature owner. Review amended contract §9 before changing request shapes or usage accounting.

Verify a provisioned coach can open Programs & activities, create a program for an assigned active class, issue a join code, generate a real school-key draft, edit it, regenerate one block, save it and publish only after safety confirmation. Confirm the published badge includes server-owned AI provenance. Check a student can join that program and submit activity evidence.

Verify unsigned users, students and unrelated coaches cannot generate or access drafts; invalid or private contact information is rejected before inference; missing configuration fails honestly; stale edits conflict; quota/throttling errors are readable. Verify usage for known completions and repairs, including invalid JSON. Never log raw prompts or learner data for verification.

The local preview uses an injected `local-mock` provider. It proves application flow, not real model performance, credential binding or production readiness. Perform a real provider smoke test before declaring AI live. Check rollback against the previous known release and report the release revision and smoke results to the user.

## Operational limits

School quota defaults to 2,000,000 tokens per UTC month. Each request reserves 116,000 tokens conservatively; uncertain dispatched billing or expired reservations consume that budget. Near-cap requests may be refused early. A coach has 10 generation/regeneration requests per rolling hour across schools. Drafts expire after seven days in the API; automatic storage pruning is not implemented. Contact-data detection is heuristic and does not identify every name or obfuscated personal detail. Personal coach keys belong to Phase 3 and are unavailable here.
