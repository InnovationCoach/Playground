# Growth Hub UX/UI and web-app enhancement plan

Prepared 4 October 2026. Status: plan approved by the project lead on 4 October 2026 (decisions in §9); not started. Owners: Claude (UX/UI and frontend), Gemini (Firebase, backend, deployment), project lead (decisions in §9).

**Sources analysed:** the Staff Testing Guide PDF (39 real screens, cited below as *T1–T39*), the Review Summary PDF, the Platform Status Review (28 Sep), the Project Summary (11 Sep), the Teen Quest design canvas, and the current codebase on `main`.

---

## 1. What the screens show today

The platform works and its core ideas are strong: a calm "one next step" student home (T3), honest data labels such as "Coach-recorded observation" and "missing is not zero" (T10, T25), a privacy-first sharing model (T13), clear Junior Explorers screens, keyboard support and three interface languages. The problems are mostly about **consistency, wayfinding and responsiveness**, not missing capability.

| # | Finding | Evidence | Why it matters |
|---|---|---|---|
| F1 | **Three visual languages coexist.** The new Growth Hub shell (plum/lime, Plus Jakarta Sans), the W2e studio (navy/purple), and legacy dark screens with emoji icons (coach Management tools, older activities, "📝 Your Notes", "🎟️ Join another class"). | T2, T28; Status Review 2.3–2.5 "Older design" | Feels like several products; erodes trust before a pilot. |
| F2 | **Navigation is nested and duplicated.** Students have a 7-item sidebar *and* a 5-tab bar inside a dashboard widget. PBL appears in three places (My Courses chooser, PBL Studio, PBL Programs tab). Goals appear in four (Goal setting wizard, goals strip, Learning Goals tab, private personal goals). The calendar is the fifth tab of a widget. | T2–T11, T14–T16 | Users cannot form a mental map; "where do I go to…?" is the first question in any test. |
| F3 | **Pages are very long.** The student dashboard stacks join-class, personalisation, the whole school panel, goals and notes. The coach PBL Studio tab runs about 2,700 px: programs, create-program form, codes, lessons, add-lesson form, evidence reviews and legacy portfolios. The calendar year view is a 12-month grid. | T2, T20–T23, T11, T34 | Key actions (Publish, Review) sit below the fold; coaches scroll instead of act. |
| F4 | **Labels do not always match purpose.** The admin "Studio Home" tab shows learner support requests; "Term 3, 2026 · Theme awaiting confirmation" is a placeholder; the coach headline "See the learning. Guide the next step." is white on a light background. | T32, T18 | Confusion and an accessibility failure on the coach's first screen. |
| F5 | **Empty and zero states read as failure.** "0 PBL project records", "Unavailable" tiles, "No posts yet". | T18, T31, T32, T17 | New schools see a broken-looking product on day one. |
| F6 | **Forms are long, raw and unforgiving.** Single-column lesson form with native selects and date inputs, no autosave, no inline validation, no preview. | T22, T24, T25, T35 | Lost work and slow lesson authoring, the coach's most frequent task. |
| F7 | **Nothing is real-time.** School data refreshes by 30-second polling. There is no notification centre: coaches only see help requests when they open a panel, and students only see feedback when they revisit a lesson. | `useSchoolWorkspace.js`; T5, T23, T32 | Help requests from learners can sit unseen. |
| F8 | **Heavy first load.** One 1.08 MB JavaScript bundle (309 KB gzip) plus 195 KB CSS, no route-level code splitting; a 2,962-line legacy `index.html` with 268 inline styles. | `npm run build` | Slow on school Wi-Fi and phones; the build warns on every run. |
| F9 | **Not an installable app.** No web manifest or service worker; activities need a live connection; on phones the menu collapses to a single "Menu" dropdown. | codebase; Teen Quest phone captures | Students mostly use phones; no home-screen presence, no offline field work. |
| F10 | **The engagement layer is built but off.** Teen Quest (levels, badges, streaks, squad goal) is on `main` but not deployed; there is no first-run onboarding and no "what changed since you were last here". | `/api/quest/me` returns 404 live | The motivation features teens need are not reaching them. |
| F11 | **Some admin lists show sample data.** The yellow "Test data" banner appears on Students, Billing and Materials. | T29–T31 | Admins cannot trust the numbers. |

---

## 2. Design principles

1. **One next step.** Every screen leads with the single most useful action for that role. Everything else is one click away, not stacked below.
2. **One place for each thing.** Each concept (a program, a goal, a lesson, an event) has exactly one home and a stable address; other screens link to it.
3. **Calm by default, playful by choice.** Teen Quest energy where it motivates, Calm view always available, motion off under Reduce motion.
4. **Honest states.** Loading, empty, missing, stale, error and permission-denied always look different and say what to do next.
5. **Fast everywhere.** Usable in under 2.5 s on a mid-range phone on school Wi-Fi; works offline for field activities.
6. **Accessible and multilingual from the start.** WCAG 2.2 AA tested, not assumed; every new string goes into English, 中文 and ไทย.

---

## 3. Target information architecture

One app shell per role: a left sidebar on desktop, a bottom tab bar on phones, and a command palette everywhere. Every tab has its own URL, so the back button, bookmarks and shared links work.

| Role | Primary navigation (max 6) | What moves where |
|---|---|---|
| **Student** | **Home** (Quest Home by default; Calm Studio by choice) · **Learn** (My project, Lessons, STEAM activities, Courses) · **Goals** · **Portfolio** · **Community** (feed and messages) · Calendar as a "Coming up" panel and full page | My Courses, PBL Studio and PBL Programs merge into **Learn**. Goal setting wizard, coach goals, goals strip and private goals merge into **Goals**. Notes become a Portfolio entry type. |
| **Coach** | **Today** (intervention queue) · **Learners** · **Programs** (workspace with Lessons / Evidence / Codes / Settings sub-tabs) · **Calendar** · **Messages** | Overview becomes **Today**: needs review, help requests, goals due, upcoming events, each with its reason and date. Management tools content moves into Learners (progress, export) and a **Requests** sub-page (materials). |
| **Admin** | **People** · **Programs** · **Calendar** · **Operations** (billing, materials) · **Support** (learner support, audit) · **Settings** | "Studio Home" is renamed **Learner support**. Quest mode, portfolio audiences and school features move to **Settings**. |
| **Parent** | One page: child switcher, a **timeline** (lessons, feedback, goals, events), and a "This week at home" card | Tabs become sections on one scroll with sticky jump links. |

---

## 4. Workstreams

### A. Design system "Growth Hub UI" v1
- Single token source `src/styles/tokens.css`: colour (light and dark), type scale (Plus Jakarta Sans body; Unbounded for display numbers only), spacing, radius, elevation and motion, consumed by all screens through CSS variables. Retire the separate `--w-*`, `--gh-*`, `--lp-*` and `--q-*` sets by mapping them onto the shared tokens.
- React component set in `src/ui/`: Button, IconButton, Card, Tabs, Segmented control, Field, accessible Select and Combobox, DatePicker, Dialog, Drawer, Toast, EmptyState, Skeleton, Badge/Chip, Avatar, ProgressRing, Stepper, DataTable (sort, filter, sticky header, mobile cards), Timeline and CommandPalette.
- Lucide icons everywhere; remove emoji used as icons in staff and secondary screens (Junior Explorers keeps its playful illustrations).
- A small illustration set for empty states and onboarding (Sustainable Futures, energy, water and robotics motifs).
- A living component gallery at `#/ui` (admin-only) for review, with light/dark and RTL-safe checks.
- Stylesheet isolation: fix the leaks found while building Teen Quest (for example, `.lp-space button` overriding component buttons) by scoping legacy rules with `@layer legacy` and keeping new components in `@layer components`.

### B. Navigation and wayfinding
- Role app shells (§3) with a responsive sidebar and phone bottom tab bar; a "More" drawer for secondary items.
- **Command palette** (`⌘K` / `Ctrl K` / `/`), extending today's activity search to lessons, programs, learners (staff), events, settings and actions ("Create lesson", "Ask my coach", "Add event"). Recent items first. Results respect role scope via the API.
- Deep links for every tab and record (`#/learn/lessons/<id>`, `#/coach/programs/<offering>/evidence`), with the class and program context kept in the URL.
- Breadcrumbs on deep pages; a keyboard shortcut sheet (`?`); focus restored on back navigation.
- Calendar: default to **Agenda** (students, parents) and **Month** (staff); Year view on request; a "Coming up" widget on every home.

### C. Engagement
- **Teen Quest live**: pilot with one class (plan in `TEEN-QUEST-IMPLEMENTATION-PLAN.md`), then the next increments: badge strip on the portfolio, STEAM and stage-clear XP, and legacy badge import.
- **Notification centre** (bell): coach feedback published, goal set or due, lesson published, help request received or answered, event changed. Each item deep-links to its record; read/unread state; per-type preferences.
- **Web push** (Firebase Cloud Messaging), opt-in per person, for exactly three approved types: **New announcement**, **Due activity** (lesson, goal or event due soon) and **Message**. Everything else stays in the in-app notification centre. No streak or XP nagging; quiet hours follow the school timezone.
- **"Since you were last here"**: a short digest on each home screen.
- **First-run onboarding**: three skippable steps per role, replayable from Settings.
- **Coach kudos**: a one-tap reaction on evidence ("Great measurement") alongside written feedback.
- **Parent weekly digest** (approved; email in English): published feedback, agreed goals, due activities and next events in plain language. Parents can unsubscribe in one click.

### D. Advanced web-app capabilities
- **Installable PWA**: web manifest, icons, theme colours, and a service worker (vite-plugin-pwa / Workbox) with an offline shell.
- **Offline field work**: cache activities and worksheets; queue task ticks, reflections and evidence drafts offline and sync when back online, with a visible "Waiting to sync" state.
- **Real-time updates**: replace 30-second polling with Firestore `onSnapshot` listeners on small, server-written per-user projections (`inbox/{uid}/items`, `classFeeds/{classId}`) under narrow read rules. Full records stay behind the API.
- **Optimistic UI with Undo toasts** for ticks, acknowledgements, reactions and calendar edits.
- **Autosave drafts** (lessons, evidence, reflections, events) with a "Saved · 2s ago" indicator and conflict prompts that reuse the existing revision checks.
- **Lesson builder wizard**: Basics, Content and media, Simulation, Preview as student, Publish. Media uploads show progress, support drag and drop, and resume when interrupted.
- **Route-level code splitting** with `React.lazy` for activities, coach, admin and quest. Target: initial JS under 250 KB gzip (today 309 KB in one file).
- **Skeleton loading**, error boundaries per route with Retry, and the View Transitions API for page changes where supported.

### E. Content and clarity
- Rename mismatched labels (F4) and remove placeholders; fix the coach headline contrast.
- An empty-state pattern for every list: what this is, why it is empty, and the one action to take.
- Microcopy guide (plain language, active voice, no blame) and an i18n check: no new string without English, 中文 and ไทย.
- Split long staff pages: the Programs workspace uses sub-tabs, so Publish and Review are always above the fold.

### F. Quality: accessibility, performance and evidence
- WCAG 2.2 AA audit with axe in CI plus manual screen-reader passes (VoiceOver, NVDA).
- Performance budgets in CI (Lighthouse CI): LCP < 2.5 s and INP < 200 ms on a mid-range phone profile, CLS < 0.1.
- Visual regression: reuse the staff-guide capture scripts to screenshot every role's key screens on each pull request.
- Privacy-preserving product analytics: first-party events (screen viewed, task completed, help requested), aggregated per school, with no third-party trackers for minors.
- Usability rounds: staff (using the Staff Testing Guide), then supervised students by age group.

---

## 5. Roadmap

Two-week sprints, aligned to the school calendar (Semester 2 starts 11 January 2027).

| Sprint | Dates | Focus | Exit gate |
|---|---|---|---|
| 1 · Quick wins | 6–17 Oct | Coach headline contrast, label renames, empty states, admin lists on live data, emoji icons removed from new screens, code splitting, Teen Quest (Quest Home as the default teen home) switched on for the pilot class | Staff-guide round 1 shows no blockers; initial JS ≤ 250 KB gzip |
| 2 · Design system | 20–31 Oct | Tokens, core components, `#/ui` gallery, stylesheet layers | All new screens use shared tokens; gallery reviewed by the project lead |
| 3 · Navigation | 3–14 Nov | Role app shells, merged Learn and Goals, deep links, command palette, Agenda-first calendar | Testers find 5 named items without help in under 30 s each |
| 4 · Coach flow | 17–28 Nov | Coach **Today** queue, Programs workspace sub-tabs, lesson builder wizard, autosave | A coach publishes a lesson with media and reviews evidence without scrolling past the fold |
| 5 · Live and notified | 1–12 Dec | Notification centre (announcements, due activities, messages first), real-time projections, onboarding, "Since you were last here", parent weekly English digest | A help request reaches the coach within 5 s; nothing relies on 30 s polling |
| 6 · App on the phone | 5–16 Jan | PWA install, offline queue, background sync, opt-in web push for New announcement, Due activity and Message | Activity tasks and reflections survive airplane mode and sync later |
| 7 · Legacy retired | 19–30 Jan | Restyle activities and coach management tools into the design system | The "Older design" tag no longer applies to any screen |
| 8 · Prove it | 2–13 Feb | WCAG fixes, performance tuning, student usability round 2 | AA audit passes; budgets green in CI; pilot findings recorded |

---

## 6. How we will know it worked

Measure a baseline in Sprint 1 with the Staff Testing Guide and first-party events, then compare after Sprints 3, 5 and 8. Do not invent targets before the baseline exists.

- **Wayfinding:** time and clicks to reach 5 named items per role; "where do I go" questions during testing.
- **Task success:** coach publishes a lesson; student submits evidence; admin adds an event; parent finds the next milestone.
- **Responsiveness:** median time from a help request to the coach seeing it; time from feedback to the student opening it.
- **Engagement (Teen Quest pilot):** school days active per learner per week, evidence submitted, Calm view opt-outs, and self-reported pressure (asked directly).
- **Performance:** LCP, INP and CLS from real devices; initial JS size.

---

## 7. Ownership

| Area | Claude | Gemini | Project lead |
|---|---|---|---|
| Design system, components, screens, navigation, onboarding, PWA front end | Build and test | Review hosting headers and caching | Approve visual direction |
| Real-time projections, notifications, web push | Front end, API contracts, tests | Firestore rules for projections, Cloud Messaging set-up, scheduled digests, deployment | Approve notification types |
| Performance and accessibility | Code splitting, budgets, axe in CI | Hosting compression and caching headers, CDN | Approve budgets |
| Content and translation | Microcopy, i18n keys | — | Native-speaker review (中文, ไทย) |
| Pilots and usability | Test scripts, capture, reports | Live accounts and data | Choose classes, supervise students |

---

## 8. Technical notes and constraints

- Keep React 18, Vite, Express, Firebase Auth, Firestore and Storage. No framework migration is needed for any item above.
- Real-time reads use new **projection** collections only (small, server-written, one per user or class) with explicit read rules and rules tests. Existing school records stay API-only.
- The service worker must never cache API responses that contain private learner data; cache the app shell, fonts and activity assets only. Offline queues are stored per user and cleared on sign-out.
- Web push needs explicit opt-in, a school-level switch and quiet hours; no push to primary learners.
- Each sprint ships behind school-level feature flags, like `questMode`, so a pilot class can try changes first.

## 9. Decisions

Approved by the project lead on 4 October 2026:

| Decision | Outcome |
|---|---|
| Merged navigation | **Approved.** My Courses, PBL Studio and PBL Programs merge into one **Learn** area. The goal-setting wizard, coach goals, goals strip and private goals merge into one **Goals** page. |
| Default home for teens | **Quest Home.** Calm Studio stays one tap away for anyone who prefers it. |
| Push notifications | **New announcement, Due activity, Message.** All other notifications are in-app only. |
| Parent weekly digest | **Yes, by email, in English.** |

Still open:

1. **Quiet hours for push.** Proposed default unless changed: no push between 21:00 and 07:00 school time (Asia/Bangkok), or on weekends and school holidays except Messages from staff.
2. **Pilot class** for Sprints 1–5 (proposed: WPR Year 11 Climate, the akira@welearn.org class).
3. **Native-speaker reviewers** for the Chinese and Thai interface text (the parent digest is English-only, but the app itself remains trilingual).

## 10. Risks

- **Change fatigue during the pilot:** ship navigation changes before students arrive in large numbers, behind flags, with a short "What's new" note.
- **Real-time cost and leaks:** projections stay small and scoped; rules tests cover every role.
- **Offline conflicts:** reuse revision checks; never silently overwrite; show "Your offline change needs a look".
- **Parallel agents editing the same files:** agree a branch per workstream and merge through review (this already caused stopped emulators and an uncommitted CORS change during the 4 Oct deployment).
