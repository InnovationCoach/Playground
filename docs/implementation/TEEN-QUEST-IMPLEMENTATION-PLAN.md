# Teen Quest experience: implementation plan

Prepared 4 October 2026. Status: plan, not started. Design reference: [Growth Hub Teen Quest Redesign canvas](https://claude.ai/artifact/7B9t5jefnEUEaGciW4au8c) (Quest Home desktop and phone, Quest Map, level-up moment, game rules).

## 1. Outcome

Secondary learners (age bands 13–15 and 16–18) get a game-like student experience: a level and XP, a gentle weekday streak, a "today's quest" drawn from their real PBL work, quick boosts, a Quest Map of the seven project stages, competency badges, and a cooperative class Squad Goal. It must keep the platform's existing promises: calm by default for those who want it, private personal goals, honest data, and no public ranking of children.

Out of scope: Junior Explorers (primary) keeps its own interface; coach and parent dashboards only gain read-only summaries; no leaderboards.

## 2. Start gate: after GPT finishes

Do not begin until all of these hold, so the quest work starts from a known, shared baseline:

1. GPT's feature work is complete and the user confirms it.
2. The whole working tree (GPT's changes, personalisation/portfolio, lesson media, operations routes, new sidebar) is reviewed and committed to `main`, or to an agreed release branch.
3. `npm run test:unit`, `npm run test:api` and `npm test` all pass, and `npm run build` succeeds. Record the counts.
4. Create `feature/teen-quest` from that commit. All quest work happens there; merge only through review.

## 3. Game rules (product decisions to keep)

1. XP rewards learning actions (evidence, reflections, feedback, completed tasks), never time on screen or raw clicks.
2. Coach-verified actions are worth more than self-reported ones. Self-reported XP has a daily cap.
3. Streaks count school weekdays only (Asia/Bangkok). Weekends and school holidays from the shared calendar never break a streak. Each 5-day streak earns a streak freeze (maximum 2 held).
4. No leaderboards or classmate comparisons. The only social mechanic is the class Squad Goal, which shows a total, never names.
5. Badges map to real competencies and NGSS-style skills from `CompetencyFramework.jsx`, so coaches can trust them.
6. Personal goals and private notes stay private. Learners choose whether badges and level show on their portfolio.
7. Every learner can switch to **Calm view** (the current Studio Home, without game elements) in Display preferences.

## 4. Current code this builds on

| Area | Today | Change |
|---|---|---|
| Studio Home | `src/features/school/W2eLearnerStudio.jsx` (389 lines): greeting, slider, next-step card, pacing, curiosity space, quest planner. Task steps are a hardcoded `STEPS` array. | Becomes the **Calm view**. Quest Home is a new sibling that reuses its modal, support and pacing pieces. |
| Student shell | `src/features/student/StudentDashboard.jsx`, `src/features/shell/TopNav.jsx`, new `sidebar.css` | Add Quest Home, Quest Map and Badges entries; bottom tab bar under 768px. |
| PBL progress | `src/features/pbl/engine/pblProject.js` / `usePblProject.js` store `users/{uid}/activityProgress/pbl-<termId>` (owner-writable) | Read as the source for "today's quest" and stage progress. Not trusted for XP (owner-writable). |
| Lessons and evidence | `server/routes/school-workspace.js`: lessons, submissions, reviews, learner goals | Server awards XP on submission, review, goal acknowledgement and confirmation. |
| Goal badges | `src/components/Goals/GoalsDashboard.js` writes `users/{uid}.goalBadges` from the browser and localStorage | Import once into the new ledger as legacy badges; the new system never trusts browser-written badges. |
| Personalisation | `server/routes/personalization.js`, `learnerSpaces/{uid}` (server-only) | Pattern to copy for authorization, revisions and tests. Profile themes unlocked by levels plug into its palettes. |

## 5. Data model (server-only)

All new collections are browser-denied in `firestore.rules` (like `learnerSpaces`) and served only through the API.

- `learnerQuest/{uid}`: `xp`, `level`, `streak {count, lastActiveDate, freezes}`, `badges [{id, earnedAt, sourceEventId}]`, `unlocks []`, `showOnPortfolio`, `revision`, `schemaVersion: 1`.
- `learnerQuest/{uid}/xpEvents/{eventId}`: append-only ledger. `eventId` = `<sourceType>:<sourceId>` so each event is idempotent (a retry or double click never awards twice). Fields: `type`, `xp`, `verified` (coach/server) or `self`, `sourceRef`, `classId`, `offeringId`, `createdAt`, `localDate`.
- `classes/{classId}/questSquad/current`: server-maintained `{goal, count, termId}`. Counts only, no learner identities.

The level table, badge catalogue and XP values live in code, so they are versioned and reviewable:
- `src/features/quest/content/levels.js`
- `src/features/quest/content/badges.js`: id, name, icon, competency, rule
- `server/lib/questRules.js`: XP values, caps, award rules shared by every route

### Starting XP values (tune during pilot)

| Event | XP | Verified by | Notes |
|---|---|---|---|
| PBL task step checked | 10 | self | Daily self-reported cap: 50 XP |
| Reflection saved (min. 40 characters) | 15 | self | Once per day |
| Evidence submitted for a published lesson | 40 | server | One award per submission |
| Coach publishes feedback on that evidence | +25 | coach | "Revision requested" also earns it: improving counts |
| Learner goal acknowledged | 10 | self | Once per goal |
| Goal confirmed achieved by coach | 80 | coach | |
| STEAM activity completed | 40 | server | Per activity, once |
| PBL stage cleared | 150 | coach | Requires the coach's milestone approval when that exists; until then, all stage tasks complete |

## 6. API

New router `server/routes/quest.js`, mounted in `server/app.js` beside the personalisation router, using the same verified-claims and school/class scope helpers (`server/lib/schoolScope.js`).

- `GET /api/quest/me`: the learner's quest state, today's quest, boosts, stage path and squad goal in one response.
- `POST /api/quest/events`: only the self-reported types (task step, reflection, goal acknowledgement). The server checks the source exists and belongs to the caller, applies caps, and is idempotent.
- `PATCH /api/quest/me`: `showOnPortfolio` and Calm view preference, with revision check.
- `GET /api/schools/:schoolId/learners/:uid/quest-summary`: assigned staff and linked parents get level, badges and recent verified events. No streak pressure for parents and no self-reported detail.
- Internal `awardXp(tx, uid, event)` in `server/lib/quest.js`, called inside the existing transactions in `school-workspace.js` for submission, review and goal confirmation, so the XP award and the learning event commit together.

Errors follow the existing `{error:{code,message}}` contract.

## 7. Frontend

New feature folder `src/features/quest/`:

| File | Purpose |
|---|---|
| `questModel.js` | Pure functions: level from XP, progress to next level, weekday streak with holidays and freezes, today's quest selection. Fully unit-tested. |
| `useQuest.js` | Loads `/api/quest/me`, posts self events, optimistic XP with rollback on error. |
| `QuestHome.jsx` | Player card, Today's quest, Quick boosts, stage path, badge shelf, Squad goal (canvas "After: Quest Home"). |
| `QuestMap.jsx` | Seven-stage trail with side quests, built on `ProjectJourney.jsx` and `programCatalogue.js` data (canvas "Quest Map"). |
| `BadgeCabinet.jsx` | All badges, earned and locked, with progress to the next. |
| `LevelUpModal.jsx` | Celebration with new badge and unlock; respects reduced motion. |
| `quest.css` | Tokens from the canvas: plum `#6e3f8b`, deep `#2a1240`, lime `#96d700`, flame `#ff9a4d`, light and dark values. |

Integration points:
- `StudentDashboard.jsx`: render `QuestHome` when quest mode is on and the learner hasn't chosen Calm view; otherwise the existing `W2eLearnerStudio`.
- Shell/sidebar: add Quest Home, Quest Map and Badges entries for secondary learners only; phone bottom tab bar below 768px.
- `index.html`: add the Unbounded display face (Plus Jakarta Sans stays the body face).
- Replace the hardcoded `STEPS` with today's quest from real PBL tasks and published lessons.
- Display preferences: add "Calm view (no game elements)" beside Calm colours and Reduce motion.
- Portfolio: optional badge strip when `showOnPortfolio` is on.
- Coach learner detail and parent overview: small read-only quest summary.

Rollout switch: `schools/{id}.features.questMode` (admin-controlled, default off), read through `/api/learning-context`, so the pilot class can get it before anyone else.

## 8. Delivery phases

| Phase | Scope | Exit gate |
|---|---|---|
| A · Foundation (week 1) | Rules, ledger, `questRules.js`, `quest.js` API, `questModel.js`, XP wired into submission/review/goal routes, legacy goal-badge import, feature flag off | Unit, API and rules tests pass: idempotency, caps, cross-learner denial, self cannot award coach-only types, weekend and holiday streaks |
| B · Quest Home (week 2) | `QuestHome`, `useQuest`, phone layout, Calm view toggle, real today's quest | Pilot account sees real data at 390, 1280 and 1440 px, light and dark; Calm view restores today's Studio Home exactly |
| C · Map and badges (week 3) | `QuestMap`, `BadgeCabinet`, `LevelUpModal`, badge catalogue tied to competencies, coach and parent summaries | Coach can see why each badge was earned; parent sees no self-reported detail |
| D · Squad and pilot (week 4) | Squad goal counter, admin flag for one class, supervised student pilot | Pilot findings recorded; XP values tuned; go/no-go for wider rollout |

## 9. Testing

- `tests/quest-model.test.js`: levels, progress, weekday streak across weekends, holidays and freezes, timezone day boundary, today's quest selection.
- `tests/api/quest.test.js`: emulator API tests for every endpoint and award path, retries, caps, revoked class access, parent and coach scope.
- `tests/firestore-rules.test.js`: direct browser reads and writes to `learnerQuest`, `xpEvents` and `questSquad` are denied for every role, including the owner.
- `tests/quest-ui.test.jsx`: rendering, keyboard access, progressbar labels, Calm view switch, reduced motion, error and empty states (new learner with 0 XP looks welcoming, not empty).
- Browser QA on the emulator stack with seeded learners at different levels; add seed data for XP, badges and a squad goal in `scripts/seed-emulator.js`.
- Accessibility: WCAG 2.2 AA contrast for every token pair, 44 px targets, no colour-only meaning, confetti off with reduced motion.

## 10. Supervised student pilot

After the team feedback round, run the pilot with students chosen across age groups (lower and upper secondary), under the project lead's guidance and supervision. Observe, rather than invent, success measures:

- Do learners find and start today's quest without help?
- Do they return on more school days than with Calm view?
- Does anyone feel pressure or anxiety from streaks or levels? Ask directly.
- Do coaches trust the badges, and are any XP values gamed?

Record task completion, confusion points and quotes before tuning XP values or widening the rollout.

## 11. Decisions needed from the project lead

1. Level names and the badge list (draft names in the canvas are placeholders).
2. Whether parents see levels or only badges (recommended: badges only).
3. Squad goal metric per class (evidence pieces is the proposed default).
4. Whether Calm view or Quest Home is the default for new learners (recommended: Quest Home, with Calm view one tap away).
5. Which class runs the pilot.

## 12. Risks

- **Gaming:** self-reported XP is capped and low value; meaningful XP needs a coach or server-verified event.
- **Pressure on some learners:** gentle streaks, Calm view, no comparisons, and the pilot explicitly asks about stress.
- **Conflicts with ongoing work:** start only after the start gate; keep changes inside `src/features/quest/`, `server/routes/quest.js` and `server/lib/quest*.js`, touching shared files only at the listed integration points.
- **Bundle size:** the build already warns about a large bundle; lazy-load the quest feature with `React.lazy`.
