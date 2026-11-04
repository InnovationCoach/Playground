# Competency goals and quests — first local implementation

1 November 2026 · Asia/Bangkok

## Delivered behavior

Learning Goals now contains a competency learning pathway for students and assigned coaches. Existing manual goals remain available. A coach records an explicit competency decision using reviewed evidence; the system offers up to three eligible published lessons as goals and quests; the learner chooses; the saved quest supplies instructions and success criteria; evidence uses the existing lesson-submission/review flow. A subsequent coach competency decision completes the linked goal when all its target competencies are confirmed. Reopening a competency reopens affected goals and retains the assessment history.

The suggestions use transparent rules, not a language model. The interface states this. No external AI provider receives learner information. Model-generated suggestions, interests-based ranking and broader academic-provider data are subsequent work.

## Suggestion and assessment rules

- Use stable framework IDs and framework version `welearn-source-2026-09-28`. Preserve school framework wording and known source issues.
- Consider only published offerings where the learner has an active membership in the selected class, and published lessons for that class.
- Require mapped target competencies, an outcome, instructed steps and success criteria.
- Confirm all explicitly authored prerequisite competencies before suggesting a dependent lesson. Advanced targets require explicit prerequisites. Free-text prior knowledge alone does not establish readiness. Foundational lessons without prerequisites are described as possible starting points, not proof of readiness.
- Exclude already confirmed targets and active chosen quests. Submission, review, XP and checklist ticks never establish mastery.
- Confirm a competency only from reviewed evidence belonging to this learner/class, mapped to that competency, with a submission revision matching the current lesson revision. This conservative restriction remains necessary until immutable published lesson versions are available.
- Store reviewer, reason, timestamp, framework version and evidence reference in an append-only decision history and current competency record.
- Use revision checks, transactional writes and deterministic quest IDs to prevent stale decisions and duplicate choices. Changes to a chosen lesson block new evidence submissions against the old version, preserving the learner's text and explaining the required coach check.

The coach lesson editor now supports explicit prerequisite competency selection. Save and publication validate those IDs and reject targets that are their own prerequisites.

## Data and access

Existing school-scoped API middleware checks signed claims against current profiles. Only the learner reads/chooses their own pathway; assigned coaches/admins may view and assess within the selected class. Parents continue to see goal summaries through the existing endpoint, without the nested pathway lesson content. Direct browser access to pathway state, current mastery and assessment history remains denied by the existing default-deny Firestore rules.

New records:

```text
schools/{schoolId}/learnerPathways/{learnerUid}/classes/{classId}
  mastery/{stableCompetencyId}
  decisions/{decisionId}

schools/{schoolId}/learnerGoals/{deterministicQuestGoalId}
```

New API routes, all requiring `?classId=...`:

```text
GET  /api/schools/:schoolId/learners/:learnerUid/pathway
POST /api/schools/:schoolId/learners/:learnerUid/pathway/choose
POST /api/schools/:schoolId/learners/:learnerUid/pathway/decisions
```

The pilot limits each relevant query to 100 records, detects overflow and returns a clear scope error instead of silently treating incomplete history as achievement data. Larger schools need pagination/aggregation before rollout. No new indexes, live database migration, XP awards or deployment were introduced. Evidence continues through the pre-existing evidence/XP service.

## Verification

- Full unit suite with the new suites included: 501 tests passed across 28 files.
- New recommendation and interface tests: 9 tests passed, including explicit prerequisites, advanced readiness, stale/unknown framework IDs, canonical choices, failed evidence retries and coach evidence selection.
- Scoped API suites: 46 tests passed across learner pathways, existing quests and school workspace. The pathway suite covers access denial, version-bound evidence, stale/concurrent requests, learner choice, submission/review/assessment, reopening and membership revocation. The final added stale-lesson case also passed on rerun.
- Direct-database access: 3 rule tests passed for student, coach and administrator clients.
- Production build passed. Browser checks passed at 1280 px and 390 px, including learner choice and coach assessment, no horizontal mobile overflow, no browser errors and no external data requests in the isolated preview.
- Screenshots: `output/competency-pathway-20261101/desktop.png` and `mobile.png`.

Tests used fictional records in local emulators. Existing unrelated workspace changes were preserved. Production credentials are expired; live Firestore edition/configuration, deployed code and real-account behavior are unverified. This work targets the existing local emulator/native document API; no production database was provisioned or changed.

## Review the sample

```sh
node_modules/.bin/vite --config tests/pathway-preview/vite.config.js
```

Open `http://127.0.0.1:5190/tests/pathway-preview/`. The preview uses fictional, in-memory records and makes no Firebase or model calls. Choose a quest in Learner view; switch to Coach view; make sample reviewed evidence available; record a competency decision. The sample-evidence button is a demonstration control, not the real review workflow. Reload resets the sample.

For the actual application, open School Learning → Learning Goals with a provisioned learner or assigned coach account. Publish assessable mapped lessons and enroll the learner through the existing workflow. Review submitted evidence under PBL Programs before confirming a competency in Learning Goals.

## Next development

1. Educator review of the pilot lesson mappings, prerequisites and evidence criteria; exercise the flow using designated test accounts.
2. Immutable published lesson/evidence versions, assessment criteria and history views, scalable queries and persistent per-step quest progress.
3. Optional learner interests and choice of focus, then constrained model assistance to rank/explain eligible goals or draft coach-reviewed quests. Preserve server-validated competencies/prerequisites and explicit coach assessment. AI must not assert mastery or publish automatically.
4. Restore production authentication, establish the deployed baseline/database edition, verify real-account access and review the exact release before deployment.
