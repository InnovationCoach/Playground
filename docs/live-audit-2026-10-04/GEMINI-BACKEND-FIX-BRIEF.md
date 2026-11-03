# Gemini - backend, Firebase and deployment repair brief

Read `LIVE-AUDIT-REPORT.md` first. The public frontend is accessible and three supplied roles authenticated, but same-origin API routes return Hosting HTML 404. Restore a coherent release before expanding features.

## P0: routing and service identity

- Verify the actual frontend build, Firebase project, deployed backend service/revision and intended API base. Record identifiers without secrets.
- Public GET `/api/learning-context`, `/api/admin/users`, `/api/parent/children` returned 404 HTML. Local `firebase.json` has no API rewrite. Inspect actual deployed configuration, then route `/api/**` to the intended backend with correct path preservation and middleware order. Keep SPA fallback after API routing.
- Verify project/environment/service account, backend auth middleware and request logs. An unavailable service must not silently fall back to mock data.
- Return evidence: unauthenticated protected route = JSON 401; authorized scoped route = JSON 200; forbidden route = JSON 403. `/health` being absent at Hosting is not alone proof that no backend exists; document the real health endpoint.

## P0: coach and test-account scope

- Coach sign-in succeeded on retry, but the dashboard reported missing verified role/class access. Inspect signed role/classIds, protected profile and schoolIds, actual class records and learner membership. The roster uses direct Firestore while school context uses the API: validate both.
- After repairs, refresh the auth token and confirm an assigned learner is visible and an unrelated learner is not. Do not broaden rules to all authenticated users.
- Admin and primary credentials worked; supplied Mia credentials were rejected; parent credentials were unavailable. Provide a secure test matrix covering all roles, memberships, linked children and expected test records. Do not print passwords in the handover.

## Contracts and data integrity

- Define errors for unavailable service, missing assignment, permission denial and missing record. Give Claude a stable code/message/correlation-ID contract.
- Preserve school/class isolation, current membership checks, parent links and admin-only calendar writes. Verify deployed Firestore/Storage rules and required indexes; local tests alone are insufficient evidence of production readiness.
- Provide real learner name, current assigned task, calendar events, support metrics and preference data. Do not ship fixed Alex/task/event/summary values as live records.
- Return permission-filtered parent summaries; exclude unrelated children and private support/preference data unless explicit policy allows it.
- Confirm the Sustainable Futures legacy term mapping before assigning semester 1. Add Net Zero Microgrid and Project Arachne as school offerings; preserve historical evidence. Validate class-code expiry/revocation and idempotent enrollment.
- Keep CambriLearn/Edmentum access marked pending until an actual provider integration is approved and verified. Manual observations require source and observation dates.
- Verify AI routes against actual implementation. A static draft response is a demonstration, not model inference. Private uploads need Storage authorization, validation and lifecycle handling before the frontend promises recording/upload capability.

## Release and evidence

Deploy backend before the dependent frontend, with compatible contracts and a rollback plan. Run staging tests for role access, lessons/goals/evidence/calendar persistence, class-code negatives and revocation. After deployment, repeat public-origin smoke checks and provide backend revision, frontend build ID, project ID, test outcomes and remaining issues. Avoid destructive tests on real learner records.

Coordinate with Claude by issue ID: LIVE-01/02/06 are backend-first; LIVE-04/05/07/09 require shared contracts or content mapping. Do not mark the release complete while core read routes still fail.
