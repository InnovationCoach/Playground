# Coach Dashboard audit — live production

- **URL:** https://welearn.org/#/coach/dashboard
- **Date:** 2026-11-20, around 12:40–12:50 (Asia/Bangkok)
- **Accounts:** Mani (coach, `role: teacher`, school `school-wpr`); Yuri Na (student) used to check access control
- **Method:** real Chrome, live data. **Read-only.** I opened every tab, sub-section, filter, search, panel and dialog, and checked console errors and `/api/` responses. Nothing was saved: no student created, no join code generated, no program assigned, no feedback saved, no leave request sent, no post published, no theme saved. Those actions are marked *not exercised live*.

## Summary

| Area | Status |
|---|---|
| Access control (student opening the coach URL) | ✅ Works |
| Header: Program Maker / Program Library links | ✅ Work |
| Header: Dark mode toggle | ⚪ Not exercised (writes profile) |
| Learners → Today (KPIs, shortcut cards) | ✅ Works, ⚠️ wording/target issues |
| Learners → class filter | ❌ Cohort options broken (fixed locally); class names show raw IDs |
| Learners → search | ✅ Works |
| Learners → Review panel | ✅ Works, ⚠️ test data visible |
| Learners → Refresh records | ✅ Works |
| Learners → Add a student | ❌ Blocked: Class list is empty |
| Learners → Studio Supervision | ⚠️ Loads, but shows no stage when the roster shows one |
| Learners → PBL programs | ✅ Loads (16 programs), ⚠️ copy + duplicates |
| Learners → STEAM Activities | ✅ Works |
| Learners → Academic Progress | ⚠️ Empty: provider feeds pending + no assigned classes |
| Learners → Learning Goals | ❌ "No learners available in your assigned scope" |
| Learners → School Calendar | ✅ Loads (1 event) |
| Learners → Posts for students | ✅ Loads, ⚠️ test posts on prod |
| Learner Messages → Open Messages | ✅ Opens #/messages |
| Classes & join codes | ✅ Loads, ⚠️ each program listed twice in picker (fixed locally), no codes yet |
| Mission reviews | ❌ HTTP 403: class not in verified organization |
| Day-off requests | ✅ Lists requests, ⚠️ test data |
| Console errors | ✅ None during the session |

## Root cause behind most ❌ items

The dashboard gets its data from two sources, and they disagree:

1. **Roster (client, Firestore):** reads Mani's `classIds` claim → `class-wpr-11a`, `class_climate_champions_7a` → 11 learners. Works.
2. **Server "verified" assignments (`/api/…`):**
   - `GET /api/learning-context` → `{"role":"teacher","classes":[]}`. No classes.
   - `GET /api/coach/students/classes` → `{"items":[]}`. No classes.
   - `GET /api/coach/universe/submissions` → **403** `Class "class-wpr-11a" does not belong to your verified organization.`

So every feature that relies on the server's verified class assignments fails: Add a student, Learning Goals, Academic Progress and Mission reviews. The class records (or Mani's teacher assignment) are probably missing the `orgId`/`schoolId` link to `school-wpr`, or Mani's org membership isn't verified. **This is backend data or rules, so it belongs to Gemini.** A production data fix needs Mani's written go.

The same gap explains why class names show as raw IDs (`class-wpr-11a`, `class_climate_champions_7a`): the class documents don't seem to have a readable `name`.

---

## Detail by feature

### 1. Access control — ✅
- Signed in as a **student**, `#/coach/dashboard` rendered the student's own dashboard and made no coach API calls. Nothing leaked.
- ⚠️ Minor: the address bar keeps `#/coach/dashboard` while showing the student page. Better to redirect to the student route or show a "Coaches only" message.

### 2. Header
- **Personalized Program Maker** → `#/spark` ("AI PBL Authoring & Mentorship Studio"). ✅
- **Program Library** → `#/pbl/programs`. ✅
- **Dark Mode** — ⚪ not clicked, because it saves the theme to the coach's profile in production.
- ⚠️ Every page also has a hidden heading "Interactive Climate Resilience STEM Simulations" (a simulation component mounted off-screen). Screen readers will announce it on unrelated pages.

### 3. Learners tab → Today — ✅ with issues
Shows: Pending setup **0**, At-risk pacing **9**, Learners in view **11**, PBL project records **2**, Evidence entries **1**. The numbers agree with the roster (2 learners have records: Ping 0 entries, Yuri 1 entry).

Shortcut buttons all work: Open Supervision View → Studio Supervision; Explore PBL Programs / Follow the project journey → PBL programs; Look inside STEAM work → STEAM Activities; Academic learning → Academic Progress; Open Messages → `#/messages`.

⚠️ Needs attention:
- **"Follow the project journey — understand each learner's phase"** opens the *Program library*, not a per-learner phase view. The label promises something different.
- **"At-Risk Pacing → Explore PBL Programs"** sends the coach to the catalogue, not to the 9 learners who need a check-in.
- The heading "Pending Reviews & Setup" counts only setup, not reviews (0 even though feedback exists).
- The footer on every section says "SO₂ Filter Lab progress will be added separately", which is an internal note showing to coaches.
- "Legacy portfolio: Term 3, 2026" — "Legacy" is internal wording.

### 4. Class filter — ❌
- **WLS · Grade 6–8** and **WHS · Grade 9–12** snap back to "All" and the list doesn't change (confirmed with a real selection). Cause: `src/features/coach/CoachWorkspace.jsx:177` only keeps `classId` if it matches a class id, so `cohort:…` values fall back to `'all'`.
- Choosing either class keeps "11 of 11 learners". That may be correct (the API shows most learners belong to both classes), but you can't tell from the screen.
- Class options and learner subtitles show **raw IDs** (`class-wpr-11a, class_climate_champions_7a`). Subtitles also disagree for the same class: "Climate Champions", "Climate Champions 7A" and the raw ID.
- The API lists 15 learners (including archived ones such as Leo Boonmee); the dashboard correctly shows the 11 active ones.

### 5. Search — ✅
Typing "yuri" filtered to "1 of 11 learners"; clearing restored all 11.

### 6. Learner Review panel — ✅
Yuri Na opened with: readiness 0/10, all 7 phases with task counts (Explore 1/3), evidence portfolio (1), feedback history and a star rating (4/5). Close button works.

⚠️ Needs attention:
- **Test data in a real learner's record:** evidence titled "Test evidence", and coach feedback "QA TEST feedback - Claude audit 2026-11-08". Yuri's student dashboard also has a note "QA TEST note - Claude audit / Persistence check". These came from an earlier audit writing to production and should be removed (needs Mani's go).
- Feedback shows the author as "Coach", not the coach's name.
- "Coach approval is not available in this view yet." Coaches can't approve here.
- Save feedback: ⚪ not exercised.

### 7. Refresh records — ✅
The "Loaded" timestamp moved from 12:40 to 12:44 and Firestore reads ran. ⚠️ `learning-context` and `learners` are each requested 2–4 times per load (duplicate fetches).

### 8. Add a student — ❌ blocked
The dialog opens, Cancel works, and the fields are labelled. **The Class dropdown has no options**, because `GET /api/coach/students/classes` returns `[]` (see root cause), so the Create button stays disabled. Coaches can't add students right now.
- ⚠️ Accessibility: no `role="dialog"`/`aria-modal` was found on the open dialog (it uses `<dialog>`; check it opens with `showModal()`).
- ⚠️ The grade list mixes "No grade specified (Primary / general)" with secondary-only grades, while the age band offers Primary 6–11.

### 9. Studio Supervision — ⚠️
Lists all 11 learners with passion/EF accommodation fields (all "None recorded").
- Shows **"No stage recorded yet"** for Ping and Yuri, while the roster and Review panel show both in **Explore**. The two views read different sources.
- "PBL milestone tracking not connected yet" and "0% 2e Grounded Accommodations" look unfinished.
- Open in Studio / Evaluate Work: ⚪ not exercised.

### 10. PBL programs — ✅ with issues
Loads the Program library with 16 programs.
- Copy conflicts: "Programs are written for ages 9–17" vs cards with "Ages 11–17" / "12–16", and the landing page's "11–18". Also "Under-13s need parental consent before they use the platform": the consent gate was removed in October, so update the copy.
- Two coach-made programs have **truncated titles** ("How can we create a bipe", "How can we encourage …"). Their titles were saved cut off.

### 11. STEAM Activities — ✅
11 learners; Maprang has 1 record, everyone else 0. ⚠️ Grammar: "1 activity records".

### 12. Academic Progress — ⚠️
Shows "CambriLearn and Edmentum automatic connections: access pending" plus provider and course filters, but **no learners or records**: the server returns no assigned classes for this coach.

### 13. Learning Goals — ❌
"No learners are available in your assigned scope." It contradicts the 11 learners shown everywhere else. Same root cause.

### 14. School Calendar — ✅
2026 year view (Asia/Bangkok), one event ("showcase", 31st of a month) and "You can manage school events". ⚠️ The header says "WPR International School · Your assigned classes" while the server says there are none.

### 15. Posts for students — ✅ with issues
The feed loads (4 posts). ⚠️ Test or empty content is live: a post reading "hu" (Akira), two "Coach Sam" posts with no text (one just a video player), and a generic welcome post. Posting: ⚪ not exercised.

### 16. Classes & join codes — ✅ with issues
Two classes, both with **no program and no join code** ("learners cannot join this class"). The cohort chips work (All 2 / WLS 1 / WHS 1).
- ❌ The **PBL program picker shows 26 options for 17 programs**. *Correction after reading the code:* these aren't duplicate records. Programs whose age range spans both cohorts (such as 11–16) were listed under both the WLS and the WHS group. **Fixed locally:** each program now appears once, under the class's own cohort or under "Other age bands".
- Raw class IDs are shown as names.
- Generate code / Assign program: ⚪ not exercised.

### 17. Mission reviews — ❌
`GET /api/coach/universe/submissions` → **403**: `Class "class-wpr-11a" does not belong to your verified organization.` The page handles the error well ("this isn't an empty queue" + Try again), but coaches can't review missions.

### 18. Day-off requests — ✅
Shows 2 approved requests with reviewer and response. ⚠️ Test data in production ("Reviewed by admin.test", "Coverage arranged with Coach Alex"). Mixed date formats (2026-11-18 vs 11/6/2026, 4:16:24 PM). Send request: ⚪ not exercised.

---

## Priority list

**P1: blocks coaches**
1. Server-verified class assignments are empty for the coach, so Add a student, Learning Goals, Academic Progress and Mission reviews (403) all fail. *Gemini: check that the class docs for `class-wpr-11a` / `class_climate_champions_7a` link to `school-wpr`/org, and check the coach's assignment. Production data change needs Mani's go.*
2. The cohort filter (WLS/WHS) doesn't work. *Fixed locally (not deployed): see Fixes below.*
3. The PBL program picker lists programs twice. *Fixed locally (not deployed): see Fixes below.*

**P2: wrong or confusing information**
4. Studio Supervision "No stage recorded" contradicts the roster's phase.
5. Class names show as raw IDs; learner subtitles are inconsistent.
6. Test data visible to coaches and learners: QA notes and feedback on Yuri Na, "Test evidence", "hu" and empty posts, admin.test leave records. *Clean-up needs Mani's go.*
7. Consent and age-range copy in the Program library is out of date.
8. Shortcut cards point to the catalogue instead of learner views.

**P3: polish**
9. Internal notes shown to coaches ("SO₂ Filter Lab…", "Legacy portfolio", "not connected yet").
10. Grammar ("1 activity records"), truncated program titles, mixed date formats, feedback author "Coach".
11. Hidden off-screen simulation heading on every page; check the invite dialog's modal semantics.
12. Duplicate API fetches on load.
13. A student opening the coach URL keeps the coach URL in the address bar.

## Not tested live (writes to production)
Dark mode save, Add a student submit, Generate join code, Assign program, Save feedback, Open in Studio / Evaluate Work, Approve/return missions (blocked by 403 anyway), Send leave request, Publish post, Manage calendar events. These should be checked on the emulators with seeded accounts.

## Fixes made after the audit (local only, not committed or deployed)

1. **Cohort filter:** `src/features/coach/CoachWorkspace.jsx` keeps the `cohort:` choice instead of resetting to All. The new `src/features/coach/learners/learnerCohort.js` works out each learner's cohort from `cohortId`, then the legacy `cohort` field, then `groupName`, then grade (not `yearLevel`, which mixes UK years and US grades). School-learning panels get `all` for a cohort choice because they have no cohort concept.
2. **Program picker:** `src/features/coach/ClassProgramsPanel.jsx` lists each program once, under the class's cohort when its age range overlaps (`programFitsCohort`), otherwise under "Other age bands".
3. **Tests:** `tests/coach-cohort-filters.test.js` (added to the `vitest.config.js` include list). Full suite: 107 files / 1517 tests pass; `npm run build` succeeds.
4. **Checked on emulators** (coach.rivera, 3 WLS learners): WLS stays selected and shows 3 of 3, WHS stays selected and shows 0. The picker shows 12 programs, 12 unique, in one group.
