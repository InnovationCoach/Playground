# Parent dashboard: backend contract for Gemini

The frontend for the parent dashboard is built and runs on the mock API (`src/services/api/mockBackend.js`). It needs one new endpoint from the backend. Nothing here changes Firestore rules: parents never read a child's documents directly. The backend reads them with the Admin SDK, after checking the link.

## Endpoint

`GET /api/parent/children/:uid/progress`

- Allowed for the `parent` claim only. Any other role gets `403 FORBIDDEN`.
- `:uid` must have an **active** `parentLinks` record with `parentUid == caller.uid`. Otherwise return `404 NOT_FOUND`, never 403, so the response doesn't confirm that a uid exists.
- If the child's consent is still `required`, return the body anyway. The page shows the consent notice from `/api/parent/children`.
- Error shape and codes as in §7 of `docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md`.

## Response body

Return exactly `buildChildProgress(input)` from `src/features/parent/childProgress.js`. Import it, or port it 1:1. The mock and the tests (`tests/parent-dashboard.test.js`) use the same function, so any port must pass those tests.

The `input` is built like this:

| Field | Source (all under `users/{childUid}`) |
| :-- | :-- |
| `child` | The same item `GET /api/parent/children` returns for this child: `{linkId, uid, publicId, givenNames, displayName, yearLevel, schoolName, cohortCode, status, consentStatus}` |
| `goalPlan` | The `goalPlan` field of `users/{uid}`. `null` if absent. |
| `pblProject` | `activityProgress/pbl-<TERM.id>`. `TERM` is in `src/features/pbl/content/pblModel.js`, currently `term-2026-t3`. |
| `activityDocs` | `{ 'solar-car': …, 'plant-lab': …, 'hex-grid': … }` from `activityProgress/<id>`. Leave a key out if its doc doesn't exist. |
| `edmentum` | `{ status: 'not_connected' }` until Edmentum is connected. After that: `{ status: 'connected', syncedAt, courses: [{ id, title, progressPercent?, averageScore?, lastActivityAt, recent: [{ title, scoreGiven, scoreMaximum, submittedAt }] }] }`, built from LTI 1.3 AGS results (line items + scores) stored per learner. |
| `confirmedCompetencies` | Optional. Competency ids a coach has confirmed. Leave it out until coach confirmation exists; the page then shows none as confirmed. |
| `now` | Server time. |

## Privacy (tested)

The function deliberately drops:
- the child's mood check-ins and notes
- the text of their evidence and AI logs
- their sparks/brainstorm text
- the strengths, supports, phrases and recharge choices from Goal setting
- dashboard personalisation

**Don't add any of these to the response.** The page tells parents they are private to the child.

Evidence **titles** are shared, as is the project question. The page lists what is shared and what isn't, under "What <name> shares with you".

## Cost

One request = one `users/{uid}` read, one `parentLinks` query, one PBL doc and up to three activity docs: about 6 reads, plus the Edmentum store once it exists. Cache it for 60 seconds per (parent, child) if needed.

## Not done yet (frontend notes)

- Conversation starters, recent-work lines, phase and competency names, and the shared/not-shared lists are English only. The page's own labels are in English, Chinese and Thai.
- Learners aren't yet told inside the app what their linked parents can see. Add a line on My Dashboard and the Goals page before go-live.
- The mock keeps the parent links you redeem in `localStorage` (`hearisland.mock.parentLinks.v1`), so a reload keeps the child linked. The real backend stores links in Firestore as already specified.
