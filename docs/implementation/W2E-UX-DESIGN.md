# W2e learning experience — design and backend handover

## Audience and objective
Design for learners aged 11–18 with varied strengths and support needs, supported by on-site coaches. Use a respectful adolescent visual language, predictable navigation, and optional depth. Do not infer diagnoses or abilities from interaction patterns. The prototype is isolated from Firebase and contains fictional records only.

## Interactive prototype
Open `/tests/w2e-preview/index.html` on the local preview server. The visual redesign (brand tokens, sidebar navigation, motivational slider, coach layout) is documented in `W2E-VISUAL-REDESIGN-HANDOVER.md`. Switch between learner and coach views. Try Focus view, optional pacing suggestions, support requests, evidence formats, editable example planning, and curiosity questions. All state resets on reload. Planning is prewritten, not connected to AI. Evidence formats demonstrate guidance; recording and uploads are not implemented.

## Learner navigation
Home prioritizes one next step, its purpose, materials, an approximate duration, and three manageable actions. PBL programs, academic progress, and goals remain separate destinations. The school calendar is visible without edit controls. Focus view hides optional discovery and calendar cards while retaining navigation, the current task, and coach support. Explore view restores them. Neither mode changes task eligibility. Use optional pacing language rather than emotional assessments. Do not enforce streaks, countdowns, competitive rankings, or noisy celebration.

Three semesters retain the agreed sequence: Sustainable Futures, Net Zero Microgrid, Project Arachne. School offerings and class-code enrollment remain authoritative. Avoid displaying enrolled progress from catalogue definitions.

## Coach connection
Support requests contain learner-selected language and an optional note. Display only to assigned school coaches and the requesting learner. Let coaches acknowledge, check in, and resolve. Do not convert elapsed time, editing, mouse movements, or tab switching into psychological conclusions. Show learner-selected preferences separately from measured academic performance. Coaching prompts are suggestions, not diagnoses. Existing PBL feedback stays distinct from provider academic progress.

## Proposed implementation sequence
1. Integrate the learning-home shell with actual assigned goals, published lessons, and calendar data. Display explicit empty, loading, stale, and unavailable states. Keep existing dashboard access during rollout.
2. Add private support requests and preferences with authenticated, school-scoped backend access and an agreed retention policy. Add polling or subscriptions only after permission and failure handling are verified.
3. Add multimodal evidence through private storage, validated file size/type, upload progress, deletion, transcripts/captions where appropriate, and equivalent rubric criteria. Coach review remains final.
4. Add a server-side AI planner that drafts editable steps from approved project content. Check materials, safety, age suitability, time estimates, and source references. A learner or coach accepts a draft explicitly. Never let model output directly publish lessons, alter grades, or change enrollment.
5. Add optional curated curiosity pathways and coach-approved collaboration inside assigned school groups. No public learner discovery or automated contact matching.

## Gemini Firebase/backend requirements
Suggested records (contract proposal, not deployed): `schools/{schoolId}/supportRequests/{id}` with learnerUid, classId, offeringId/lessonId when relevant, category, optional note, status, createdAt, acknowledgedAt, resolvedAt, assignedCoachUid and revision. Obtain all identity/scope fields from verified claims/current membership. Allow learners to create/read their own requests; assigned coaches to read and update workflow status; administrators only under explicit school policy. Parents must not automatically receive private notes or learning preferences. Deny direct browser writes if using the existing API-mediated architecture. Validate lengths and enum values, use server timestamps, prevent cross-class access, append minimal audit events, and define retention before production.

Preferences should be learner-selected, editable, and optional, including display mode and preferred evidence formats. A device-only display setting can avoid a cloud record; if synced, store per authenticated learner. Do not store diagnostic labels or inferred emotional scores. Pacing check-ins should remain ephemeral by default and must not determine grading or restrict access.

AI endpoints require authentication, per-user limits, minimum necessary inputs, reviewed model configuration and data handling, structured outputs with validation, and clear unavailable states. Do not send private support notes or diagnostic information as prompts by default. No AI feature is active in this prototype.

## Review and acceptance
Desktop primary; narrow-screen layout must retain access to every core action. Test keyboard-only navigation, dialog focus return/Escape, readable contrast, 200% zoom, screen-reader labels, and no overflow. Include learners and coaches in review: can a learner find the next step, ask for help, switch view, and return from exploration without assistance? Can a coach distinguish a help request from evidence awaiting feedback and dated provider observations? Measure task completion and clarity, not inferred mental health.

This proposal supplements `WORKSPACE-IMPLEMENTATION-REPORT.md`; it does not claim that new backend routes, file uploads, AI planning, or production deployment have been implemented.
