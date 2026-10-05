# Phase 2 local review guide

Open `http://localhost:5186/?emulators=1`. This isolated preview leaves the existing preview on port 5173 untouched. It requires the temporary preview, API and emulator processes to remain running.

Disposable emulator accounts:

| Role | Email | Password |
|---|---|---|
| Coach | p2-coach@welearn.test | phase2review |
| Student | p2-student@welearn.test | phase2review |

1. As coach, open **Programs & activities**, then **Create your own program**. Enter a title and driving question, choose the assigned class/year/semester, and save.
2. Select the new program, issue a class join code, and copy it. These codes enroll authenticated students; they are not passwords or an authentication bypass.
3. Open the activity builder. Describe an activity using interests, age band, duration, kit materials and standards. Do not enter learner contact or support information.
4. Generate a draft. In this preview the badge says `local-mock`: every generated response is simulated. Edit fields, reorder blocks with buttons or Alt+Arrow keys, add a regeneration instruction, and regenerate a block. Confirm the other blocks remain intact.
5. Save the lesson draft. Publish it, read the safety review and explicitly confirm before completing publication. Saving or generation alone must not publish.
6. Sign in as student, open **Coach programs**, enter the join code and open the published lesson. Make a prediction, record table data and simulation trials, answer the knowledge check, reflect, and submit evidence.
7. Return as coach to review the submission. Also inspect mobile (375px), tablet (615px) and desktop (1440px), keyboard focus, editable AI text, draft resume and errors.

Use API tests for denied scopes, expired drafts, stale updates, concurrent reservations and provider fallback failures. These checks are simulated. Follow the Firebase handoff for a real Gemini request and live release verification.
