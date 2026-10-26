# Plan to end of November 2026

Written 2026-10-26. Deadline: 30 November 2026. Five weeks.

This plan covers what is left in the project notes. Each item has an owner, a decision gate where needed, and a done test. Dates assume the decisions in section 1 are made by 31 October. Every production step needs Mani's written go for that exact step (AGENTS.md).

## 1. Decisions needed first (by 31 October)
| # | Decision | Owner | Why it matters |
|---|---|---|---|
| D1 | Remove the under-13 consent requirement. Physical consent is kept at WeLearn, and staff enrol learners. **Done 2026-10-26** on `chore/remove-consent-gate`. **Confirmed by Mani in writing, 2026-10-26.** | Mani | The requirement is recorded in `docs/parent-engagement-contract.md` (D2, section 5) as Mani's decision. Removing it changes the contract, the Phase A prompt, the lms-plan and the review pack. See section 2. |
| D2 | Confirm `role: 'learner'` is a real value, and whether coaches may change `activeProgramId`. | Mani + Gemini | Both are open in the rules drift brief. |
| D3 | Canva: school-only integration needs Canva Enterprise, otherwise the app must pass Canva's public review. Which path? | Mani | Decides whether Canva ships in November or as an upload-link fallback. |
| D4 | Keep or delete the ~4,700 lines of unused React components. | Mani | Affects the bundle and what is reviewed. Default: delete what is not imported, after a list review. |
| D5 | Is the deploy freeze lifted? The freeze was set on 2026-09-30 "until every page is complete". | Mani | Gates the staging and live steps below. |

## 2. Consent (D1), done 2026-10-26
The gate is not enforced in code. No source file reads the consent fields. The requirement lives in:
- `docs/parent-engagement-contract.md` D2 and section 5
- `docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md` (consent gate paragraph, and the `consent` field in the data model)
- `docs/lms-plan.html` (Phase E, and the checklist row 7)
- `docs/review-pack/platform-status-review.html` (rows 3.x and E)
- `docs/backend-changelog.md` and `docs/data-contract.md`
- `src/app/i18n/messages.js`: `form.consentNote`, `parent.consentRequired` (both languages)

**Work:** update these to say that consent is recorded on paper by WeLearn, and that staff enrol learners. Keep the safeguarding rules that do not depend on consent (no speech-to-text or voice recording for under-13 learners, from the DonPBL safeguarding section). Remove the `consent` field only after Gemini confirms nothing reads it.
**Done when:** the Mani decision is in writing, the docs agree with each other, and `grep -ri consent src` shows only the copy that is intended.

## 3. Workstreams

### A. Release integration (Gemini + Claude), weeks 1–2
- Merge `feature/canva-polish` (`d63be6f`) and the UI work (`5a0b31d`, already in `backend/api-resilience`) into one release branch. Work from `backend/api-resilience` (`53f14ce`).
- Build, unit tests (522 today), emulator endpoint probe, rules tests.
- **Done when:** one release branch builds, all tests pass, and a written release note lists every changed file.

### B. Firestore rules (Gemini owns, Claude supplies the brief), weeks 1–3
- Follow `docs/RULES-DRIFT-FOR-GEMINI.md`: merge the two files, add rules tests, post the diff to Mani.
- **Done when:** the merged rules pass the emulator tests, Mani has reviewed the diff, and the live rules match the repo file after the go.

### C. Backend endpoints owed to the frontend (Gemini), weeks 1–3
- Coach Learners page: wire assignments, material requests and learner registration, then retire the old page (`#/coach/*` routing).
- Parent dashboard: `GET /api/parent/children` and the child progress endpoint, per `docs/PARENT-DASHBOARD-CONTRACT.md`.
- Messenger: deploy the class-chat and storage rules (after B).
- Media phase 2: coach resources at `classes/{classId}/resources`, per `docs/MEDIA-INTEGRATIONS-CONTRACT-FOR-GEMINI.md`.
- **Done when:** each endpoint has a test and the frontend uses it on the emulator. Mock data is removed from those screens.

### D. Frontend completion (Claude), weeks 1–4
- Remove the consent copy after D1 (section 2).
- PBL Studio educator-review backlog: teams, coach feedback, competency tracking. Prioritise coach feedback. Teams last, and only if time allows.
- Program toolkits: coach award screen for the badges that cannot be auto-awarded. Until it exists, the badges stay locked, not awarded.
- Plant Lab: show the activity on the coach dashboard.
- Learner notice: tell learners what parents can see before go-live (parent dashboard notes).
- Dead code: act on D4.
- **Done when:** every screen in the navigation works on the emulator with no mock-only path, and the Phase 0 pages pass the review pass in `docs/FRONTEND-PHASE-0-NOTES.md`.

### E. Canva (Claude + Mani), weeks 2–4
- Depends on D3.
- If Enterprise: wire the private integration and test connect, export and token refresh against a real Canva account (Mani's Canva Pro account is for testing only).
- If public: prepare the Canva review submission, and ship the link-based flow in the meantime (already built in `canva-polish`).
- **Done when:** connect, export and expired-token handling are verified against Canva, or the link-based fallback is the live path.

### F. Activities and content (Claude + Don), weeks 2–4
- DonPBL programs: confirm the six programs pass the catalogue checks, and that the program rules are deployed with B.
- Junior Explorers: keep the consent gate removed (D1). The under-13 speech-to-text rule stays.
- Solar car, SO₂, Hex-Grid: confirm the no-fabrication rules (figures tagged DATA, ESTIMATE or ASSUMPTION) and re-verify the USDA and EU animal figures noted as unverified.
- **Done when:** each activity has a checklist signed off by the content owner.

### G. Security, privacy and go-live (Mani), weeks 4–5
- Security test and privacy review (plan Phase F). Scope: auth, rules, the fail-closed `requireClaims` path, Canva tokens, API keys, rate limits, the under-15 data rules as decided in D1.
- Rotate any key that was committed (memory says the Gemini key was rotated on 2026-09-21; confirm nothing else is in git history).
- Gemini paid tier before any class uses the AI features (the free tier allows 5 requests per minute).
- Set `FRONTEND_URL` and the Canva variables for production.
- **Done when:** the review has no open high-severity findings, and Mani has signed the go.

### H. Staging and pilot (Mani + Gemini), weeks 4–5
- Staging: deploy to a Hosting preview channel, after Mani's go. Smoke-test the flows in section 4.
- Pilot: one class (Year 9 climate, or a class Mani chooses), for one week, before the other cohorts.
- **Done when:** the pilot class completes a full loop (enrol, a PBL programme, a coach review, a parent view) with no blocking defects.

## 4. Smoke test (run on staging, and again after each deploy)
1. Student signs in, searches, adds a course, starts a PBL programme.
2. Coach signs in, sees the Learners page from the backend, assigns a programme, reviews evidence.
3. Parent sees only the child's permitted view.
4. AI: one hint, one tutor reply, one design review. A 429 shows the retry message, not a crash.
5. Canva: connect (or the link fallback), check a link, open a starter.
6. Light and dark mode, and a phone-width check on the student home and Canva.

## 5. Calendar
| Week | Dates | Main work |
|---|---|---|
| 1 | 27 Oct – 2 Nov | Decisions D1–D5. Release branch (A). Rules merge starts (B). |
| 2 | 3 – 9 Nov | Rules tests and diff review (B). Backend endpoints (C). Canva path chosen (E). |
| 3 | 10 – 16 Nov | Endpoints wired (C). Frontend completion (D). Content checklists start (F). |
| 4 | 17 – 23 Nov | Staging deploy after go (H). Security test starts (G). Canva work finishes (E). |
| 5 | 24 – 30 Nov | Security findings fixed (G). Pilot class (H). Go-live decision by Mani. |

## 6. Risks
- **Gemini capacity:** B and C both sit with Gemini. If the backend is late, the frontend shows mock data and the pilot cannot start. Mitigation: decide D1 and D2 early, so Gemini is not blocked by them.
- **Canva:** D3 may take the Canva path out of November. Mitigation: the link-based flow is already built.
- **Quota:** the free-tier AI limit will fail under a full class. Mitigation: paid tier before the pilot.
- **Freeze:** if D5 is not lifted, staging and pilot slip. No other workstream is blocked by it.
- **Scope:** Edmentum LTI, the CRM-style wireframes and the Course Coordinator are out of scope for November unless Mani says otherwise.

## 7. Out of scope for November
- Edmentum courseware via LTI 1.3 (needs a deployed endpoint and a vendor contract).
- The agency CRM screens in the "EduBiz" wireframes.
- Parent consent workflows (removed under D1).
- Teams in PBL Studio, unless time remains after week 4.
