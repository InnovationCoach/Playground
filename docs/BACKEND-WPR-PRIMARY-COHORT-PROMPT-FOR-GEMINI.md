# Backend contract: WeLearn Primary (WPR) cohort, Grades 1–5

**From:** Claude (frontend) · **For:** Gemini (backend owner) · **Date:** 2026-11-22
**Status:** frontend done locally, uncommitted. No deploys or production data changes without Mani's written go for each step.

## What the product needs

A third programme cohort beside WLS and WHS, placed by US grade:

| Code | cohortId | Name | Grades | Learning ageBand | `cohort` (legacy field) |
|---|---|---|---|---|---|
| **WPR** | `cohort-wpr` | WeLearn Primary | **1–5** | `primary` | `primary` |
| WLS | `cohort-wls` | WeLearn Lower Secondary | 6–8 | `13-15` | `lower-secondary` |
| WHS | `cohort-whs` | WeLearn Higher Secondary | 9–12 | `13-15`, `16-18` | `higher-secondary` |

The older age-based primary cohorts (`cohort-lower-primary` LPRI, `cohort-higher-primary` HPRI) stay **retired**: hidden from pickers but still readable on old accounts. The frontend shows their classes as WPR on the coach Classes tab.

## What the frontend now sends and expects

- **Coach "Add a student"** (`POST /api/coach/students`) can now send `gradeLevel` 1–5 with `cohortId: "cohort-wpr"` and `ageBand: "primary"`.
- **Admin account form** can send `cohortId: "cohort-wpr"`, `cohort: "primary"`, `ageBand: "primary"`, and `gradeLevel` 1–5 parsed from the year-level text.
- **Admin cohort list** (`GET /api/admin/cohorts`) is expected to **include** WPR. The client hides only LPRI/HPRI.
- The **coach dashboard** filters learners into WPR by `cohortId === 'cohort-wpr'`, then by `gradeLevel` 1–5.

## Server changes needed (all in Gemini's area)

Today every one of these rejects or hides WPR. They fail safely: a grade below 6 returns **400 "Grade level must be between 6 and 12."** and nothing is mis-filed.

1. `server/lib/schoolScope.js`: `cohortForGrade` and `validateGradeAndCohort` accept grades 1–12; 1–5 → `cohort-wpr`.
2. `server/routes/coach-students.js` (~line 50): same grade range and derivation; when the grade is 1–5, set `ageBand` to `primary`.
3. `server/routes/create-learner.js` (~line 55): same.
4. `server/routes/admin-users.js` (lines ~319, ~332–344, ~603): derive `cohort-wpr` for grades 1–5; set `cohort: 'primary'` and `ageBand: 'primary'`; add `cohort-wpr`/`wpr` to `COHORTS` (line 22) and to the built-in cohort check at line 332.
5. `server/routes/reference.js` (line 71): stop filtering out `WPR`/`cohort-wpr` (keep hiding LPRI/HPRI); return WPR with `ageBands: ['primary']` (the current mapping at lines 84/94 strips `primary`). Add WPR to the fallback list at lines 109–110.
6. **Class/grade consistency (recommended):** reject a learner whose grade-derived cohort doesn't match the class's `cohortId`. The coach dialog currently lets you pick Grade 3 for a WLS class.
7. **Firestore:** a `cohorts/cohort-wpr` document `{ code: 'WPR', name: { en: 'WeLearn Primary' }, grades: [1, 5], ageBands: ['primary'], status: 'active' }`. Emulator seed first (`scripts/seed-emulator.js`: add a WPR class and 1–2 primary learners). **Production only on Mani's written go.**
8. **Rules / AI:** check that `ageBand: 'primary'` still turns AI off by default and that nothing in `firestore.rules` assumes grade ≥ 6.

## Tests to update
`tests/school-cohorts.test.js` has server tests asserting `cohortForGrade(5) === null` and the 6–12 validation message. Those must change with item 1. The client-side tests for WPR are already in that file and in `tests/coach-cohort-filters.test.js`.

## Frontend files changed

Committed on branch `feature/coach-cohort-wpr`: the coach dashboard, class panel, invite dialog, `schoolCohorts.js` and tests. **Still uncommitted** in the main working folder: the admin-screen part (`useReferenceData.js`, `AccountForm.jsx`, `AccountList.jsx`, `mockBackend.js`, `tests/admin-wpr-cohort.test.js`), because it edits other uncommitted admin work it depends on.

- `src/utils/schoolCohorts.js`: WPR entry and `cohortForGrade` (grade-only; age placement unchanged)
- `src/features/coach/learners/learnerCohort.js`: WPR placement, filter options
- `src/features/coach/CoachWorkspace.jsx`: "WPR · Grade 1–5" in the class filter
- `src/features/coach/ClassProgramsPanel.jsx` + `classPanel.css`: WPR chip, amber badge, program fit (ages ~6–10)
- `src/features/coach/StudentInviteDialog.jsx`: Grades 1–5 and Primary age band
- `src/features/admin/accounts/useReferenceData.js`, `AccountForm.jsx`, `AccountList.jsx`: WPR offered with the `primary` band
- `src/services/api/mockBackend.js`: mock API mirrors the behaviour above
