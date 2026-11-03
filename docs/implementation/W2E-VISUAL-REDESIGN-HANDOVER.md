# W2e dashboard visual redesign — design handover

3 October 2026. Visual design and frontend interaction work on the isolated W2e preview only. No application code under `src/`, no Firebase rules, auth, claims, backend routes, deployment configuration or data were changed. Nothing was committed.

## What was delivered

- Redesigned learner and coach preview: `tests/w2e-preview/index.html` (markup), `tests/w2e-preview/studio.css` (components), `tests/w2e-preview/studio.js` (interactions), `tests/w2e-preview/README.md` (run and regression notes).
- Reusable design tokens: `tests/w2e-preview/tokens.css`.
- Screenshots in `docs/implementation/screenshots/`: `w2e-learner-desktop.png`, `w2e-learner-desktop-full.png`, `w2e-learner-focus-desktop.png`, `w2e-pbl-studio-desktop.png`, `w2e-coach-desktop.png`, `w2e-coach-desktop-full.png`, `w2e-learner-mobile.png`, `w2e-learner-mobile-full.png`, `w2e-learner-mobile-menu.png`, `w2e-coach-mobile.png`.
- Local preview: `http://127.0.0.1:5175/tests/w2e-preview/index.html` (same isolated Vite config as the other previews; see the README).

## Brand system

Palette from the Canva brand kit as supplied: purple `#8250A0`, lime `#96D700`, navy `#003C69`, light blue `#9BD2FF`, grey `#D9DAD3`, magenta `#AE266C`, red `#AE3435`, white. The pale lavender swatch is `#CEAAEE`: this value already exists in the app's root tokens (`--brand-lavender` in `/index.html`, dated 2026-09-27 from the same kit), so it was reused rather than invented. The logo is the school-supplied Cloudinary asset referenced by `src/app/brand.js`, shown on a white badge in the navy sidebar exactly as `BrandMark.jsx` does, with a text fallback if the CDN is unavailable. No new logo was created.

Colour roles (all in `tokens.css`):

- Navy: headings, sidebar and structure, strong text, focus ring on light surfaces.
- Purple: primary buttons, selected segments and chips, active dots, links.
- Lime: progress ring and bars, the active-navigation mark, the hero highlight, the notice rule. Lime always carries navy text or is non-text.
- Light blue and lavender tints: hero, welcoming surfaces, review and request badges.
- Magenta: curiosity and workshop accents only.
- Red: overdue and error states only.

Status is never colour alone: every badge pairs an icon and a label (Request, Awaiting review, Overdue, Missing data, Achieved, Upcoming, Available). Derived tints and shades are documented in the token file as derivations, not kit swatches.

Typography matches the app: Plus Jakarta Sans for headings, Inter for text; 16px base, nothing below 13px. Spacing is a 4px scale; radii 8/12/16/24; two restrained shadows. Icons are inline SVG symbols that mirror the lucide shapes the app uses through `lucide-react`, so a React port can swap each `<use href="#i-name">` for the matching lucide component.

## Key design decisions

- One focal point. The welcome hero and the next-step card are the only large elements; everything else is compact or lives in the right rail. On a 1366×768 laptop the next-step title sits at roughly 470px, so the slider never pushes the task below the fold.
- The motivational slider is manual by default, with previous/next buttons, dot indicators, arrow/Home/End keys, pointer swipe, a polite live region, an optional auto-advance that pauses on hover and focus and is disabled under reduced motion. Focus view replaces it with one static sentence.
- Focus view removes decoration, gradients and optional cards while keeping navigation, the task, the progress ring and all coach entry points. Neither mode changes what a learner can open.
- Learner control over stimulation: Display preferences (sidebar) offer calm colours, reduce motion and three text sizes. They set `data-calm`, `data-motion="reduce"` and `data-text` on `<html>`, which remap tokens, so a React port needs no component changes to honour them.
- Programs get distinct art in one system: Sustainable Futures (lime and sky, leaf), Net Zero Microgrid (navy and sky energy line, bolt), Project Arachne (lavender and purple, robot icon; the program is the Sesame quadruped robotics project, not networks). Assigned, available and upcoming are separate badges; a class-code form sits beside a card explaining that offerings are school-controlled.
- Academic progress shows provider, source (`coach_recorded`), observation date and update date, and an explicit empty state for Edmentum. No live integration or grade is implied.
- Coach view leads with four summary tiles (requests, awaiting review, overdue, missing data), then requests, evidence, goals, progress (alphabetical, labelled "not ranked"), and academic observations in their own card. Preferences and interests sit in a lavender card marked "Learner-selected", apart from grades. A "Show" selector switches between the whole class and one learner, with an empty state for learners who have not shared preferences. A short card states what the view never does (no emotion scores, no inferred ability, no rankings).
- AI entry points are demonstration content only, labelled "Demonstration content · not generated" in the panel header. The panel shows context, an editable draft, Use / Discard / Back to my task. Nothing is sent, published or graded.
- Loading, empty, error and success states exist: a skeleton on first open of Academic Progress (no shimmer under reduced motion), empty states for requests and Edmentum, an error for an unrecognised class code, success for support requests, goal acknowledgement and the pod mission.

## Preserved prototype interactions

Learner/coach switching, Focus/Explore, pacing check-in, support requests appearing in the coach view with "Mark check-in complete", evidence-format guidance, the editable example quest plan, curiosity questions, PBL programs / academic / goals panels, pause state, the pod mission progress and the coach review-workflow dialog all still work. The sample request from Jordan is preloaded so the coach view is never empty on first load.

## Verification performed

- Browser checks in the desktop app's built-in browser at 1366×768 and 375×812, and headless Chrome at 390×844: `document.documentElement.scrollWidth` equals the viewport width in learner and coach views after the grid fix; no horizontal page scroll.
- Slider: arrow keys move slides, dots and count update, the live region announces "Slide 3 of 4: …", off-screen slides are `aria-hidden` with their controls removed from the tab order. With reduce motion on, the track transition is 0s and auto-advance is disabled.
- Focus view: slider and optional cards hidden; task, help button, navigation and the focus welcome visible.
- Dialogs: evidence and support dialogs open with focus inside, Escape closes, focus returns to the opener. The mobile drawer sets `inert` on the content, traps Tab, closes on Escape and returns focus to the menu button.
- Support request submitted from the learner view appears in the coach view; the tile count updates; the learner filter hides other learners' rows and shows the preferences empty state.
- Contrast computed for every token pair used for text and controls: all text pairs ≥ 5.3:1 (lowest: magenta on magenta tint 5.34:1; white on purple 5.83:1; navy on lime 6.49:1). The boundary token was darkened to 3.1:1 and the lime icon shade to 5:1 after the first pass.
- Larger text size at 1366 wide: no overflow.
- Console: no errors on load. The only 404 seen was a transient reload before `studio.js` existed.
- `vitest run` on `tests/school-workspace-ui.test.jsx`, `tests/school-api-client.test.js`, `tests/pbl.test.js`: 32 passed. `vite build`: succeeds with the pre-existing large-chunk warning. The preview is not in the build graph, so these confirm nothing else regressed.

## Not verified / limitations

- No screen reader session was run; semantics were checked through the accessibility tree and attributes only.
- 200% browser zoom was approximated with the "Larger" text size (20px base) at 1366 wide and the 390px layout, not a true 200% zoom pass in every browser.
- Touch swipe was tested through pointer events in Chrome, not on a physical device.
- Uploads, recording, transcripts, the class-code join and all AI panels are concept demonstrations; none call a service.
- The sticky notice stacks to three lines on narrow phones. It is deliberately unmissable; if it is too tall for a given device, shorten the copy rather than hide it.

## Integration requirements for Codex (application)

Component mapping for a React port (keep the markup roles and ARIA attributes):

- Shell: sidebar with six learner destinations, collapse state (`aria-expanded`, tooltips via `data-label`), mobile drawer (`inert` + focus trap). Coach destinations are in-page anchors.
- Home: hero (learner name, dated eyebrow, one sentence, "Continue my next step"), slider (content is static copy owned by the school, not per-learner data), next-step card bound to the current published lesson: title, purpose, duration, materials, three steps, progress, actions.
- Data the home needs from the existing API: `GET /learning-context`, current offering and lesson from `GET …/program-offerings/:offeringId/lessons`, learner goals (`GET …/learner-goals`), calendar events for the next 30 days (`GET …/calendar-events?from&to`), academic snapshots (`GET …/academic-progress?learnerUid`). Use the existing loading / empty / unavailable states; the skeleton and empty components in `studio.css` are ready to reuse.
- Pacing check-in is ephemeral UI state; do not persist it or send it to the server by default.
- Support requests: `supportRequests` contract from `W2E-UX-DESIGN.md`; the request item shows learner name, category, optional note, created time, and a resolve action.
- Display preferences: device-only by default (`localStorage` is acceptable in the app, not used in the preview); if synced, store per authenticated learner with `calm`, `motion`, `textSize` only. Never store diagnostic labels.
- Evidence formats: the dialog is the UI for the future multimodal upload. Required backend before enabling the real buttons: private Storage path per submission, server-validated size and MIME allowlist, upload progress and cancel, delete-own, optional transcript/caption job, and the same rubric criteria across formats. Coach review stays final.
- AI panel contract (server-side only, no browser keys):
  - `POST /api/ai/drafts` with `{ kind: 'plan' | 'rephrase' | 'deeper-question' | 'feedback-prompt', offeringId, lessonId?, submissionId?, learnerUid?, input: { text?: string } }`.
  - Response `{ draftId, kind, text, sources: [{ lessonId | rubricId }], createdAt, expiresAt }`; errors in the existing `{error:{code,message}}` shape plus an explicit `ai_unavailable` code the panel can show.
  - Server builds prompts only from approved lesson, rubric and catalogue content and the learner's own typed input; never from support notes, preferences or interaction telemetry.
  - Accepting a draft is a separate explicit action (`POST /api/ai/drafts/:draftId/accept` or simply attaching the edited text to the existing lesson-plan or feedback endpoints). Drafts never publish lessons, change grades, enrolment or goals.
  - Per-user rate limits, audit of `draftId` acceptance, and age-appropriate content checks as described in `W2E-UX-DESIGN.md`.
- Coach view: tiles come from counts of open support requests, submissions awaiting review, goals past due, and learners without an academic observation this term. Lists must stay alphabetical; do not add rank, average or comparison columns.

## Integration requirements for Gemini (Firebase and deployment)

- Nothing in this work touches `firestore.rules`, claims, Hosting or Functions. The preview is static and must not be deployed.
- Records implied by the design that are not yet in the implemented contract: `supportRequests` (already proposed in `W2E-UX-DESIGN.md`), optional `learnerPreferences` (display settings and preferred evidence formats; learner-writable, assigned-coach-readable, parent-denied), `aiDrafts` (server-written, owner-readable, short retention), and private evidence Storage with per-submission paths and no public read.
- AI endpoints need a server-held model key, rate limiting, logging without prompt content from private notes, and a documented unavailable state. No model configuration is included here.
- The school calendar remains admin-write only; the learner and coach views in this design are read-only by construction.

## Addendum, 4 October 2026: program chooser on the student home

Learners now see every PBL program on their home dashboard and can choose one.

- New `src/features/school/ProgramCatalogueChooser.jsx`: lists all `PROGRAM_CATALOGUE` entries with semester, grade band, driving question and milestone count; marks programs the learner is enrolled in from `GET /schools/:schoolId/program-offerings` (students only receive offerings they are active members of); "Open program" jumps to the Programs tab with that program selected; "Join with class code" posts to the existing `POST /program-enrollments/join` and reloads. No new endpoints, rules or data.
- `W2eLearnerStudio.jsx` renders the chooser in place of the static three-card block and accepts `onChooseProgram` / `onJoined`. `SchoolLearningPanel.jsx` routes the choice into `Programs` through a new `initialProgram` prop.
- Styles appended to `schoolWorkspace.css` (`.w2e-catalogue`, `.w2e-program-*`, `.w2e-pill-*`), using the same brand tints as the preview.
- Tests: `tests/program-chooser.test.jsx` (four cases) registered in `vitest.config.js` and `npm run test:unit`. The school preview's sample learner is now enrolled in Semester 1 only so both states are visible at `tests/school-preview/index.html?role=student`.
- Honest limitation: students cannot see which offerings their school has published until they join, because the offerings endpoint only returns their own memberships. The card therefore shows "Class code needed" rather than distinguishing "available" from "upcoming". A small read-only endpoint returning published offering titles for the learner's classes would allow that distinction.
- STEAM activities: the five "Interactive Climate Resilience STEM Simulations" activities are defined as the Explore phase of the current term (Sustainable Futures) in `pblModel.js` and `steamNgss.js`. The catalogue has no per-program activity mapping yet; Net Zero Microgrid and Project Arachne have milestones and rubrics only.

## Addendum, 4 October 2026: platform-wide light mode

The Growth Hub shell was already light, but every legacy surface (student, coach and parent dashboards, the activity hub, join panel, notes) read dark-only tokens from the root HTML regardless of the saved theme. Light mode now covers the whole platform and is the default.

- `index.html`: a `:root[data-theme="light"]` block remaps the legacy semantic tokens (`--bg-dark`, `--card-bg`, `--card-border`, `--surface-*`, `--text-light`, `--text-muted`, `--link`) to the WeLearn light palette, sets `color-scheme`, and overrides the rules that hard-coded dark gradients and inputs (welcome hero, home hero, activity cards, stat boxes, coding playground chrome). The code editor stays dark for legibility. Activity simulations keep their own scene colours.
- Defaults: `ThemeProvider`, `main.jsx` and `AuthProvider` now fall back to `light` when a user has no saved `themePreference`. Saved `dark` and `system` choices are honoured unchanged.
- Quick switch: the shell header (`Header.jsx`) has a sun/moon button that toggles light and dark and saves to `users/{uid}.themePreference` through the existing `saveThemePreference`; Settings keeps the full light/dark/system choice. It is also shown signed out so the sign-in page can be switched.
- Tokenised hard-coded dark colours in `StudentDashboard.jsx` (note inputs), `joinPanel.css` and `juniorExplorers.css`. Legacy vanilla components under `src/components/` (coach dashboard, goals, SEN chatbot) still carry inline dark styles and are not covered; they need a separate pass if they remain in use.
- Fixed a pre-existing bug: `ThemeProvider` only read the preference on first render, so a saved theme never applied after sign-in. It now follows the loaded preference.
- Verified against the local emulators with the seeded test learner: sign-in page, courses, home dashboard and the goal-setting wizard render light; the header switch toggles dark and back; a switch to dark survives a reload; no console errors. Unit suite (307 tests) and `vite build` pass.
- Gemini: the `users` rules already allow the owner to write `themePreference` (Settings used it before); no rules change. Codex: nothing else to integrate.

## Addendum, 4 October 2026: compact goals strip with badges

The learner goals card on the student home was a full-height dark block. It is now a compact, theme-aware strip.

- `src/components/Goals/GoalsDashboard.js` rewritten (same export, same storage shape). Collapsed, the strip shows a progress ring, the topic, the next goal, days left and the due date, with Edit and Open. Open reveals the checklist, a one-line daily focus reminder (mark today done, snooze 24h) and Reset. The open/closed state is remembered per learner.
- Completing every goal awards a badge for that goal cycle (one per cycle, keyed on `createdAt`), shows a dismissible toast with a live region instead of a full-screen overlay, and switches the strip to a completed state with "Start new goals". That clears the goals, keeps the badges, and opens the wizard. Badges persist to `users/{uid}.goalBadges` (owner-writable under the existing rules) and localStorage, and are listed on the strip.
- Progress changes now also update the per-goal mirror in `users/{uid}/goals`, so coaches see achieved goals without waiting for a re-set. The mirror helper moved from the integration into the dashboard module and is imported back.
- The strip renders behind the first-time wizard so the home never shows a blank gap, and it re-renders when the wizard finishes an edit.
- Styles use brand tokens with `[data-theme="dark"]` overrides; no inline dark colours remain in this component.
- Tests: `tests/goals-dashboard.test.js` (four cases) registered in `vitest.config.js` and `npm run test:unit`.

## Addendum, 4 October 2026: preview design ported to the live Studio Home

The live student home (`W2eLearnerStudio.jsx`, the Studio Home tab inside the school panel) had copied the preview's flow but not its visual system. It now uses the same design.

- New `src/features/school/w2eStudio.css`: the preview tokens and components (hero with decorative shapes and highlight, slider, next-step card with progress ring and custom checklist, pacing chips, compact mini cards, information rail, dialogs, display preferences), with `[data-theme="dark"]` overrides so it works in both themes. No sidebar: inside the Growth Hub shell the panel tabs are the navigation.
- `W2eLearnerStudio.jsx` rewritten: slider with arrow keys, swipe, dots, optional auto-advance (off under reduced motion), live region; Focus view swaps the slider for one static sentence and hides optional cards; next step with chips, numbered steps, pause/resume and calm completion state; pacing with selected state; curiosity and example planner; evidence-format picker with per-format guidance and an honest "uploads are coming" note; support request unchanged in behaviour (real API) with a clearer confirmation; display preferences dialog with switches and text-size control. Dialogs close on Escape and return focus to their opener.
- The rail's "Coming up" now reads real school calendar events for the next 30 days (`GET …/calendar-events`), with loading, error and empty states; "My learning" links switch panel tabs through a new `onNavigate` prop. The learner's first name reaches the greeting through a `learnerName` prop (`StudentDashboard` → `SchoolLearningPanel` → studio). The student dashboard now opens on the Studio Home tab instead of PBL Programs.
- Still labelled as examples until published lessons drive them: the next-step task, pacing suggestions, curiosity questions and the example plan.
- Verified in the isolated school preview at 1366 and 375 wide: no horizontal overflow, no console errors; unit suite (311 tests) and `vite build` pass. The test `tests/w2e-learning-studio.test.jsx` was adjusted to count only task steps and the new "Curiosity space" label.
- Gemini: no backend or rules change. This ships with the next Hosting deploy of the current tree.
