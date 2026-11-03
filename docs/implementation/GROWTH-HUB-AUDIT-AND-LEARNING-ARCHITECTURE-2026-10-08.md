# WeLearn Growth Hub: product audit and implementation plan

Date: 8 October 2026 · Asia/Bangkok
Source project: `/Users/admin/Desktop/HearIsland`
Production reference: https://dnd-master-73449.web.app

## Recommendation and scope

Make Growth Hub a competency-led learning workspace where every learner can answer: **What am I learning? What should I do next? What evidence should I submit? What feedback will help me improve?** Coaches should create these experiences through one consistent program builder.

Preserve existing programs, instructions, activities, simulations, evidence, feedback and learner identities. Improve their structure through compatible additions and reviewed migration. Booking is explicitly excluded. This is an audit and implementation proposal; it does not deploy changes or certify the entire live platform.

The assessment combines current source inspection, a fresh run of five targeted test suites, earlier authenticated coach observations and earlier local role previews. The supplied screenshots are reference material illustrating LMS capabilities, not instructions to implement every feature. A production student journey, all backend integrations and all authorization paths have not been exercised in this audit. Historical observations below require rechecking against the deployed revision.

## Audit findings

| Area | Evidence and current assessment | Required improvement | Priority |
|---|---|---|---|
| Program creation | `ProgramMaker.jsx` supports manual authoring, curriculum conversion, milestones, activities, simulations, class/year/semester and draft save. Its long form combines structure and lesson instructions. `programSpec.js` validates milestone links but its activity contract lacks competency, rubric and pathway fields. | Guided program workflow, reusable activity contract and explicit quality review before publish. | P1 |
| Lesson delivery | A six-section lesson editor and guided learner view exist. `LearnerLessonView.jsx` keeps completed steps and current position in component state; its `onComplete` parameter is unused. | Authoritative saved progress keyed to stable step IDs, learner and published version. Resume across sessions/devices. | P1 |
| Personalization | Learner preference and support-request APIs exist. `W2eLearnerStudio.jsx` still uses fixed three-step energy tasks and device-local display preferences; scaffold API templates are fixed energy examples. | Drive next work from the selected learner's actual assignments. Connect supported preferences; replace irrelevant templates with lesson-specific, reviewed scaffolds. | P1 |
| Competency alignment | Lessons store competency IDs and success criteria. `lessonBody()` accepts string IDs without resolving the framework, and silently slices some arrays/text. The earlier production framework view reported 16 source problems. | Framework owner resolves duplicates; immutable framework versions and stable IDs; reject unknown/ambiguous IDs and over-limit payloads rather than silently losing content. | P1 |
| Assessment | Submission and review APIs enforce useful scope/revision checks. Reviewed work is explicitly distinguished from milestone approval in the UI. Review currently records feedback and status, rather than criterion-level mastery decisions. | Rubric criteria, evidence attempts, reassessment and explicit coach mastery decisions. Preserve the distinction between submitted, reviewed, completed and mastered. | P1 |
| Media presentation | Shared image viewer and native video player are in local source, with keyboard/original-size/error behavior covered by targeted tests. Earlier local browser checks covered responsive image viewing. | Verify deployed image opening, actual MP4/WebM decoding, captions, seeking and signed-URL renewal with authorized roles. A visible player alone is insufficient proof. | P0/P1 |
| Media security | Current `storage.rules` message and school-submission evidence paths check signed-in status without conversation membership or tenant/submission ownership. The 7 October investigation documents synthetic outsider access probes. | Scope read/create/update/delete to membership and ownership or explicit staff moderation policy; validate type/size. Verify backend signed-URL endpoints independently. | P0 |
| Upload reliability | Earlier coach PNG upload failed with `storage/unauthorized`; prior investigation separates upload, preview and metadata save and identifies inconsistent format/size policies. | Reproduce the actual failing stage and repair scoped permissions; stage-specific errors, retry and orphan cleanup. Do not solve failures by making objects public. | P0 |
| Dashboards and roster | Earlier coach audit found ambiguous roster labels, class-filter uncertainty and repeated example metrics. Academic integrations were honestly marked pending. Current learner dashboard composes several separate feature areas. | One real-data dashboard per role; confirm class filter semantics; distinguish sample, unavailable, zero and real values. | P1 |
| Content organization | Earlier Hex-City lesson exposed a lengthy handover document. Local changes add a compact lesson list and collapsible resource section, preserving text. | Human-reviewed decomposition into meaningful tasks and roles; retain original brief for reference, separate coach-only technical notes explicitly. | P1 |
| Accessibility and mobile | Shared media work includes keyboard access and responsive checks. Full platform compliance has not been audited. | WCAG 2.2 AA as a delivery target: contrast, focus, dialogs, keyboard tasks, captions, reflow and understandable errors. | P1 |
| Collaboration, goals and portfolio | Goals, notes, community, messages, support and evidence features already exist. They need consistent links into the learning workflow. | Contextual support/feedback attached to lessons and evidence, with role-scoped visibility. Avoid rebuilding working feature areas. | P2 |

Targeted verification on 8 October: **51/51 tests passed across media viewer, coach lesson editor, school workspace UI, personalization UI and journey tests.** The test environment emits unimplemented media pause/window scroll warnings. These tests cover selected behavior, not the whole LMS or live Firebase authorization. The current production build also succeeded (Vite, 1.14 seconds). No deployment was performed.

Relevant existing investigations: `STORAGE-UPLOAD-INVESTIGATION-2026-10-07.md`, `shared-media-viewer.md`, `ENTERPRISE-READINESS-AND-REAL-STUDENT-DATA-PLAN.md`, `PLATFORM-IMPLEMENTATION-PLAN.md`, `learner-personalization.md`. Use this plan to coordinate them, not to discard completed work.

## Standard learning structure

```text
Program definition and published version
  └─ Module / milestone
      └─ Lesson
          └─ Activity / guided step
              └─ Evidence attempt → feedback → competency decision

Program offering = published program + cohort/classes + dates + assigned staff
Learner pathway = offering + individual assignments + support + progression
```

Keep the existing milestone concept and IDs; display “Module / milestone” consistently until educators agree terminology. Activities and simulations become typed activities within lessons, not competing disconnected navigation structures. The platform can retain dedicated simulation screens, linked from their learning context.

Separate reusable curriculum from its delivery to a class. A learner's activity completion is different from competency mastery. Completing a video or ticking a task may satisfy a participation requirement; mastery requires the configured evidence and assessment decision.

### Program builder

| Stage | Coach decisions and outputs |
|---|---|
| 1. Program brief | Title, learner-facing overview, driving question, audience, duration and accessible cover. |
| 2. Outcomes and competencies | Observable outcomes linked to approved framework/version IDs; plain-language learner descriptions. |
| 3. Learning map | Ordered modules/milestones, lessons, duration, prerequisite relationships and schedule. |
| 4. Activities and resources | Reuse the lesson editor to add learn/practice/investigate/create/reflect/submit steps, media and simulations. |
| 5. Personalization and support | Core route, optional stretch work, supported alternatives, checkpoints and coach overrides with reasons. |
| 6. Evidence and assessment | Accepted formats, individual/team attribution, criteria, rubric levels, reviewer and reassessment policy. |
| 7. Delivery | Authorized classes/cohorts, responsible staff, dates, availability and resource access. |
| 8. Preview and publish | Student/mobile previews and actionable quality checks; publish an immutable version. |

Allow draft saves at every stage. Autosave must show saved/saving/failed/conflict states and use revisions to prevent overwriting another coach. Conversion and generated drafts require educator review; do not invent competency mappings or replace original text without a visible comparison.

Keep the existing six-section lesson editor inside stage 4. Align its labels to: Overview; Outcomes; Steps; Resources; Evidence and criteria; Preview. Avoid creating a second unrelated lesson workflow.

### Required activity contract

Every published activity needs a stable ID, title/type/order, parent lesson/version, learner outcome, instructions, estimated duration, resources, success criteria and a completion policy. Assessed activities additionally require competency references, evidence formats, rubric criteria and reviewer policy. Optional fields cover prerequisites, team roles, scaffolds, alternative evidence, stretch tasks and support links.

Use typed completion policies: learner acknowledgement, submitted evidence, coach approval or assessed threshold. Each type has an explicit meaning and validation. An unparsed string such as “rubric” cannot determine progression. Prerequisites reference stable activity/lesson IDs and reject missing references or cycles. Non-assessed introduction/resource steps do not require a rubric.

### Example: reorganizing Hex-City

Preserve the complete original handover as a reference. Create lessons such as Understand the challenge; Choose and investigate a team role; Develop a model; Test assumptions; Present and reflect. Within the role investigation, provide architecture, energy, food and water role cards derived from the existing brief. Each card states the question, task, resources and expected evidence. Coaches choose the appropriate depth and approved competency mapping; this outline is a proposed structure, not an automatic content rewrite or inferred curriculum alignment.

## Learner and coach experience

Learner home should show one prominent **Continue learning** action, the actual next activity, its purpose/time, saved progress, feedback needing attention and an easy support request. The program overview shows a clear map with available, in progress, awaiting review, revision needed and completed states. Locked work explains its requirement. Always let learners revisit available work and their feedback.

The lesson workspace presents one manageable activity at a time, with outcome, instructions, resources, evidence action and success criteria together. Images open at fit/original size; video has working controls, captions where supplied and meaningful failure recovery. Give alternate evidence formats only when they assess the same outcome fairly.

Coach home prioritizes evidence awaiting review, unanswered support requests, learners needing follow-up and programs requiring preparation. The review workspace shows the submitted version, evidence, criteria, earlier attempts and private/public feedback boundaries. A coach can return work, assess criteria or approve mastery; each is a separate recorded action.

Personalization begins with learner choice and coach knowledge: interests, accessibility/display preferences, goals, previous evidence and demonstrated mastery. Provide supported pacing, smaller task segments and extension choices without labeling learners by fixed learning styles or inferring diagnoses. Keep sensitive accommodations private to authorized staff. Explain recommendations and allow a coach override. Begin with transparent rules; AI is optional draft assistance, not the authority for grading or placement.

## Architecture and data changes

Retain React/Vite, the existing API and Firebase where appropriate. Separate presentation, application services and storage through clear contracts; this does not require three deployments or a migration to microservices. Incrementally isolate curriculum, enrollment, learning progress, assessment, media and reporting modules. Consolidate duplicated legacy/direct-database flows behind those contracts after compatibility tests.

| Record/service | Change |
|---|---|
| Program/lesson versions | Immutable publish snapshots; draft revision checks; offering pins a version. Existing numeric revision is concurrency information, not proof of complete historical snapshots. |
| Framework versions | Stable IDs, display codes, definitions, retired aliases and reviewed mapping migration. Never use a duplicate display code as an identity. |
| Learner assignments | Explicit available/core/optional/support activities, release rules and coach overrides within an offering. |
| Learning progress | Stable step IDs, started/completed/resume timestamps and status; server authorization and idempotent updates. Merge concurrent device updates safely. |
| Evidence attempts | Preserve earlier submissions; version-bound evidence and team attribution; upload state and retry without duplicate submissions. |
| Assessment decisions | Criterion ratings, feedback, reviewer, evidence references, framework version and mastery decision history. Reopening a decision records a reason. |
| Media service | Private object metadata, tenant/owner checks, authorized temporary URLs, expiry/retry, accessible media metadata and cleanup policy. |
| Reporting | Derive distinct completion/submission/review/mastery measures from authoritative records. Start with bounded queries/aggregates; introduce a warehouse only when measured workload warrants it. |

Extend existing audit events and access checks. Frontend hiding is not authorization. Admin SDK routes must enforce scope because Storage rules do not govern those operations. Parent views should retain their current limited summaries unless a separate access policy authorizes more.

## Implementation sequence

Indicative effort assumes one developer with educator review and shared QA. Estimates need refinement after the data inventory; they are not delivery commitments.

| Phase | Work and owner | Exit criteria | Indicative effort |
|---|---|---|---|
| 0. Establish safe baseline | Developer/QA: record deployed revisions; inventory data and media; repair message/evidence authorization; reproduce upload failures; inspect all relevant API signed-URL paths. | Owner/participant/assigned-staff access succeeds; outsider/cross-school/revoked access fails for each operation. Real image/video upload-save-reload works. Backup and rollback exercised. | 1 sprint |
| 1. Standardize curriculum | Educator + developer: resolve framework issues; define contracts; versioning; migrate one program; guided builder and server publish validation. | Every pilot lesson has a navigable structure; assessed activities map to valid criteria/competencies; originals and evidence retained; draft unpublished to learners. | 1–2 sprints |
| 2. Deliver a persistent journey | Developer + QA: assignments/progress API, resume, live dashboard next activity, contextual evidence/feedback/support. | Close/reopen and second-device resume work; retries are idempotent; wrong learner/version denied; switching programs shows correct work. | 1–2 sprints |
| 3. Assess and personalize | Educator + developer: rubric review, mastery history, revision attempts, rule-based support/stretch routes and preference integration. | Submitted/reviewed/mastered stay distinct; next route has a reason; coach overrides audited; evidence alternatives meet the same criteria. | 1–2 sprints |
| 4. Improve delivery quality | Designer/developer/QA: shared visual patterns, mobile/accessibility review, honest reporting, pilot observation and measured tuning. | Representative learners/coaches finish key tasks; keyboard/mobile/media checks pass; metrics use real data; support and assessment remain accessible. | 1 sprint + pilot |

One sprint means approximately two weeks for planning purposes. Security baseline precedes wider rollout; curriculum design can proceed in parallel without altering live learner access.

## Developer backlog and acceptance tests

1. **P0 Access policy:** update `storage.rules` and relevant media endpoints; test read/create/overwrite/delete for owner, participant, assigned staff, unrelated user, revoked user and cross-school user. Recheck existing live rule versions before release.
2. **P0 Upload lifecycle:** instrument upload → metadata save → URL → render; show the failing stage. Verify supplied PNG plus real supported MP4/WebM, oversized rejection and expired URLs. Keep private media private.
3. **P1 Progress persistence:** replace screen-only state in `LearnerLessonView.jsx` with saved progress and stable IDs. Verify reopening, second device, reordered draft, new published version and network retries.
4. **P1 Publish gate:** strengthen `lessonBody()` and `programSpec.js`; unknown competencies, duplicate step IDs, invalid prerequisites, incomplete assessed criteria and over-limit payloads produce actionable errors. Preview and publish must use the same interpretation.
5. **P1 Curriculum workflow:** evolve `ProgramMaker.jsx`; integrate the lesson editor, safe autosave and version preview. Test resumed drafts, concurrent edits, class scope, conversion provenance and failed publish.
6. **P1 Real learner home:** replace fixed task/scaffold content in `W2eLearnerStudio.jsx` with assigned work; integrate existing preference/support endpoints. Empty/unavailable data produces honest states, not unrelated energy tasks.
7. **P1 Assessment:** extend submission/review services and UI with criterion ratings, separate mastery decisions and attempt history. Test team attribution, reassessment, unauthorized marking and version-bound review.
8. **P1 Quality:** verify complete tasks on narrow mobile screens and with keyboard; audit focus/contrast/headings, dialog focus containment, video captions and errors. Document unresolved accessibility defects.
9. **P2 Reporting/navigation:** resolve roster semantics and sample metrics; contextualize goals/portfolio/messages; remove duplicate navigation after compatibility review.

## Content-preserving migration and release

Inventory program/lesson IDs, original text, attachments, submissions and feedback. Back up/export through authorized tooling. Produce a dry-run report and explicit old→new ID/version mappings. Keep original text and show unmapped competencies as needing review. Do not silently invent steps, truncate instructions, delete evidence or change learner ownership.

Pilot a single offering behind controlled availability. Compare counts and reference integrity before/after. Older evidence remains linked to the version that produced it. Rollback should restore the prior application and compatible reads without deleting new learner work. Expand only after live coach and student verification and an educator review of content quality.

Measure a baseline, then track successful program creation, learner ability to identify the next task, upload/save failure rate, support response time, assessment turnaround, retry/duplicate incidence and rubric-backed mastery. Do not equate XP, clicks or video watching with learning. Set numeric targets after observing the pilot, not from fabricated benchmarks.

## Standards and product references

The proposed design adapts useful patterns rather than copying a commercial interface:

- [TalentLMS features](https://www.talentlms.com/features): coherent learning paths, multimedia, assessment, roles and reporting inform the product baseline.
- [Canvas Mastery Paths](https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-use-Mastery-Paths-in-course-modules/ta-p/906): conditional coursework informs transparent differentiated routes; Growth Hub still needs its own evidence and progression contracts.
- [Moodle competencies](https://docs.moodle.org/503/en/Competencies): framework-linked learning plans and evidence review inform competency management.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): proposed AA accessibility target; no present compliance claim.
- [1EdTech LTI](https://www.1edtech.org/standards/lti): evaluate when connecting external learning tools. Adopt integrations only for confirmed use cases; do not add certification/import systems speculatively.
- [Firebase Storage rule conditions](https://firebase.google.com/docs/storage/security/rules-conditions): access must reflect identity and resource relationships, not only sign-in status.

Immediate next deliverable: a reviewed pilot program specification, scoped media access fix, and progress/assessment contracts. Those provide the foundation for a modern personalized experience while protecting the content already built.
