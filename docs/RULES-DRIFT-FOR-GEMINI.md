# Firestore rules drift: repo vs live (for Gemini)

Date: 2026-10-26. Owner: Gemini (rules, indexes, `server/`). This brief is a comparison only. Nothing here is a deploy instruction. Any rules deploy needs Mani's written go for that exact step (AGENTS.md).

## Sources
- **Repo:** `firestore.rules` on `backend/api-resilience` (`53f14ce`), 942 lines.
- **Live:** `~/Desktop/firestore-rules-live-backup-20261022.rules`, 659 lines. This is the copy taken on 2026-10-22. Confirm it is still the live version before acting on it. Re-pull the live rules first, because it may have changed since.

## Summary
The two files have drifted in both directions. Deploying the repo file as it stands would change live behaviour in two ways, so it should not be deployed as is.

## 1. Collections only in live (not in repo)
| Collection | Live rule | Risk if the repo file is deployed |
|---|---|---|
| `coachAiConnections/{uid}` | `allow read, write: if false` | Low. Without a match block the default is deny, so access is the same. |
| `learnerPortfolios/{uid}` | `if false` | Low. Same as above. |
| `portfolioAudienceGrants/{uid}` | `if false` | Low. |
| `learnerQuest/{uid}` (and subcollections) | `if false` | Low. |
| `learnerSpaces/{uid}` | `if false` | Low. |
| `classes/{classId}/questSquad/{docId}` | `if false` | Low. |
| `schools/{schoolId}/programOfferings/.../activityDrafts`, `schools/{schoolId}/aiUsage` | `if false` | Low, as long as nothing else matches those paths. |

All of these are server-only (Admin SDK). Dropping the live match blocks does not open them, but the file should keep them, so the rules say what they are. Add the blocks back as `if false` with the same comments.

## 2. Collections only in repo (not in live)
| Collection | Repo rule | Notes |
|---|---|---|
| `canvaConnections/{userId}` | `if false` | Server-only, matches the Canva token design. Needed for Canva. |
| `canvaOAuthStates/{stateId}` | `if false` | Server-only. Needed for Canva. |
| `enrolments/{enrolmentId}` | learner, coach or admin can read; writes are restricted | Needed for PBL enrolment. Review the write rules before deploy. |
| `sessions/{sessionId}` | read by owner, coach or admin; create only by owner | Check the update and delete rules. |
| `pbl_programs/{programId}` | coaches and admins read all; learners read published programs they can see | Needed for the DonPBL program library. Check that drafts are not readable by learners. |
| `phaseProgress/{phaseId}` (under `enrolments`) | read by the enrolled learner or their coach | Review the write rules. |
| `frameworks/{frameworkId}` | any signed-in user reads; teachers and admins write | Confirm frameworks hold no learner data. |

## 3. Changed rules on shared collections (review first)
**`users/{userId}`**
- **Create.** Live allows only `role == 'student'`. Repo allows `'student'` or `'learner'`. The repo version is looser. Check that `'learner'` is intentional, because it is a new value.
- **Update.** Repo adds a coach path: `isCoachOf(userId)` may change only `activeProgramId` and `updatedAt`. This is new permission. Confirm it is wanted and cannot change anything else, and add a rules test for it.
- **Update (owner).** Repo adds a check that `role` does not change. The live rules protect `role` through `affectedKeys()`. The repo version keeps that and adds the role check, which is stricter. Confirm the behaviour matches `requireClaims` in `server/middleware/auth.js`.

**Other shared collections.** Diff the remaining 33 match blocks that exist in both files. Most of the 353 changed lines are comments and wording, but check any change to `classes`, `goals`, `progress`, `messages` and `storage.rules`.

## 4. Things the rules do not enforce (for awareness)
- The `consent` field is protected from self-edit (`users` update), but no rule reads its value. Under the decision in the next section, that is correct.
- Under-13 voice-note limits are enforced in the app only (see `docs/DEPLOY-LIVE-MERGE-PROMPT-FOR-GEMINI.md`).

## Proposed steps (each needs its own written go)
1. Gemini: merge the two files on a branch. Keep every live block that is still needed, add the new blocks, and keep the live-only server-only blocks as `if false`.
2. Gemini: run the rules tests against the emulator (`npm test`, which uses `tests/firestore-rules.test.js`). Add tests for: coach can change `activeProgramId` only; learner cannot change `role`, `classIds` or `status`; `pbl_programs` drafts are hidden from learners; `canvaConnections` cannot be read from the client.
3. Gemini: diff the merged file against the re-pulled live rules and post the full diff to Mani.
4. Mani: written go to deploy the rules, separately from any code deploy.
5. After deploy: check the live rules match the repo file, and record the new backup.

## Open questions for Mani
- Is `role: 'learner'` a real value? If not, remove it from the create rule.
- Should coaches be able to change `activeProgramId`? The repo says yes; confirm.
- Re-pull the live rules: is the 2026-10-22 backup still the live version?
