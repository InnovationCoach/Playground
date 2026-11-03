# My Universe Phase 1 closure: Opus 5.5 response

2 November 2026 · Opus 5.5 (experience/3D owner) · assignment: the Opus section of `MY-UNIVERSE-PHASE1-CLOSURE-2026-11-02.md`.

Local commits only. Nothing was pushed, merged, deployed or run against production. Only the synthetic stand-in and fixture registry were used. No server, rules, config, package or shared source was written. The only shared change is GPT's commit `0a0bad9`, cherry-picked as assigned.

## 1. Base, branch and commits

- Checkout: `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend`
- Base: `0df3f2c` (`codex/universe-explorer-panel`, already merged to GitHub main via PR #9)
- Branch: `codex/universe-phase1-ui`

| Commit | What |
|---|---|
| `90a4e35` | Cherry-pick of GPT shared `0a0bad9`: `getSupportDescription`, `getMissionDecision`, presentation adapter 1.0.1. `getTableTemplate` is unchanged. |
| `63768f2` | F5–F8 and B10 for the learner and coach UI, with tests |
| this commit | This response and `captures/phase1/` |

The explorer panel and full-orbit camera behaviour from `bd832f3` are unchanged.

## 2. What changed

### F5: learner wording from the shared module
- The briefing's "Your decision" uses `getMissionDecision(mission)`. For wind, that is "Recommend Plan A, Plan B, or ask for more evidence…" instead of the authored decision text.
- The help-style text uses `getSupportDescription(mode)` instead of `route.supportPresentation`, so authoring instructions no longer reach learners. It is followed by "Either help style is an equal way to do this task."
- Content hashes are preserved: the shared suite (which checks all seven accepted checksums) passes 23/23.

### F6: focus containment in `PilotMissionSheet`
New file: `src/features/universe/pilot/dialogFocus.js`, with `useDialogFocus` and `tabStops`.

- **Tab containment:** Tab and Shift+Tab wrap inside the sheet. Stops are recomputed on every key press, so changes to the sheet's contents are always reflected.
- **What can't take focus:**
  - disabled controls
  - anything under `hidden`, `inert` or `aria-hidden`
  - anything inside a closed `<details>` (its own `<summary>` still can)
  - anything hidden by CSS
  - Each radio group counts as one stop.
- **Focus that escapes:** if focus lands outside the open sheet, it returns to the sheet heading.
  - **Bug found in a real browser:** with a deep-linked sheet, the explorer's mount effect took focus after the sheet did, so Shift+Tab reached the planet list behind the sheet. The guard above fixes this.
- **Escape** closes the sheet.
- **Focus on close:** focus returns to the opener only if it is still connected and focusable. The opener is read on the first render, before any effect moves focus.
- The same hook drives `MissionSignInNotice` (see F7).

### F7: learner UID and verified organization, failing closed
**Production wiring**
- `AuthProvider` adds `orgId` to its state, read only from the signed ID token's `orgId` claim (never the client-writable profile). It is reset to `null` while loading and when signed out.
- `App` passes `orgId` to `MyDashboard` and `CoachDashboardHost`.
- `MyDashboard` passes it to `SparkUniverse`.
- `SparkUniverse` passes `viewer={uid && orgId ? { uid, orgId } : null}` to the explorer.

**Client**
- The memoized default client is preserved.
- `client.withScope({ uid, orgId })` returns a client bound to that scope; components memoize it per scope.
- `scopedTokenProvider(auth)` returns no token in these cases (fail closed):
  - there is no full scope
  - `currentUser.uid` differs from the scope
  - the token's `orgId` claim differs from the scope
  - the current user changed while the token was being fetched
- When no token is returned, the request is never sent and the result is `unauthenticated`.

**Explorer**
- With no full scope it requests nothing.
- Opening a pilot mission shows `MissionSignInNotice` instead of the sheet.
- Access answers are stored with the scope that asked for them, and a different scope never reads them, even for one render.
- The sheet is keyed by scope, so old work, status and history disappear in the same render, and late replies to the old sheet are ignored.
- History is cleared on 401/403.

**Coach queue**
- With no full scope it shows "Mission reviews open once your school account is confirmed" and requests nothing.
- Otherwise the queue component is keyed by `uid|orgId`, so an account or organization change unmounts the old items, notes and in-flight replies in the same render.
- Each first-page load (tab change, refresh, conflict) starts a new request generation, and replies from older generations are ignored.
- A 401/403 on loading or reviewing clears every loaded item.

### B10: the draft is kept on submit
- The synthetic stand-in no longer deletes the draft when work is sent; the draft and its revision continue.
- **Revise rules:** revising a returned attempt continues from whichever is newer, with no conflict prompt.
  - **The account draft is kept** when it is already linked to that attempt or was saved after the attempt was sent. It is relinked if needed.
  - **Otherwise the attempt's evidence is used,** saved against the draft's revision, so there is no false `DRAFT_CONFLICT` and nothing newer is overwritten.
  - **Unsaved screen edits** in the same sheet always win.
- A returned attempt that already has a successor no longer shows "Revise and resend". The server would reject it anyway.
- The server draft schema is unchanged.

### F8: empty pages that have a continuation
- **Coach queue:** an empty page with a `nextCursor` says "Nothing for your current classes so far. The list isn't finished: load more to keep checking." and keeps Load more. "No mission work is waiting" appears only on a final empty page.
- **Learner history:** the same rule applies ("No attempts on this page yet. Older attempts may follow.").
- The synthetic queue now pages a bounded raw window of the organization's records and then filters by the coach's classes (B12 shape).

### Also fixed while checking
- On the review checklist, an empty written explanation said "Keep this explanation within 2,000 characters." It now says "Write your explanation for this part." (`missionSession.partStatus`; the shared message is unchanged).

## 3. Tests (run 2 November 2026 in this checkout at `63768f2`)

| Suite | Result |
|---|---|
| Universe and pilot, scratch include `tests/universe-*.test.js(x)` + coach + Thalassa | **11 files, 102/102 passed** (86 before this turn) |
| Committed `tests/universe-preview/vitest.config.js` | 8 files, 60/60 |
| Shared `node --test shared/universe/tests/contracts.test.js` | 23/23 |
| Root `vitest.config.js` (rules suites excluded: they need the emulator) | 42 files passed; 654 passed, 29 skipped. `sim-economy.test.js` fails with `ECONNREFUSED 127.0.0.1:8088` (needs an emulator); it fails identically on the base without these changes. |
| `npm run build` | Passed. `dist/assets/index-mdrmZvYu.js`. 0 matches for `shared/universe/fixtures`, `REFERENCE_ARTIFACTS`, `pilot-fixture-g03`, `synthetic-learner-amira`. |

**New acceptance cases**

- **Client:**
  - a scoped token is refused with no scope, a partial scope, another user, another `orgId` claim, no claim, or a user switch mid-request
  - a mismatched scope sends nothing, and the unscoped base sends nothing
- **Learner UI:**
  - F5 wording
  - F6:
    - Shift+Tab from the heading wraps to the last stop; Tab wraps to the close button
    - escaped focus returns to the sheet
    - a disabled Send button and closed drawers are skipped after the contents change
    - Escape closes the sheet
    - focus returns to a connected opener, and a removed opener is handled
  - F7:
    - no request and a sign-in notice until `orgId` arrives, then access and history load
    - same learner, organization change: the old draft text disappears in the same render, and the old organization's delayed draft and history replies never appear
    - production host: `SparkUniverse` passes `null` without the claim and `{ uid, orgId }` with it
  - B10:
    - save → send → draft kept at revision 1 → coach returns → reload → revise → save gives revision 2 linked to attempt 2, with no conflict
    - newer work saved after sending wins over the returned attempt and saves at the next revision
    - the superseded attempt shows no Revise button
- **Coach UI:**
  - no organization means no request
  - organization change: the old queue disappears in the same render, and a delayed reply from the old organization never lands
  - a slow reply from a tab the coach left is ignored
  - 401 on refresh and 403 on review clear the loaded items
  - F8: 21 newer records from another class, then older eligible work: the first page is empty but unfinished, and Load more reaches Ben

## 4. Browser checks (synthetic preview only, `tests/universe-preview/pilot.html` on Vite localhost:5195; no Firebase)

Captures are in `docs/implementation/captures/phase1/`.

| Check | Browser and viewport | Result |
|---|---|---|
| Phone | Claude desktop in-app browser (Chromium), mobile emulation 375×812 | Briefing, step 4 table, review checklist and coach queue. `scrollWidth` equals `innerWidth` (375); the wide wind table scrolls inside its own box. Files: `phone-375-*.jpg`. |
| iPad portrait and landscape | Headless Google Chrome 156.0.8078.74, window 768×1024 and 1024×768 | Work step with worked example; attempt history. Files: `ipad-768-work.png`, `ipad-1024-landscape-history.png`. |
| Desktop | Headless Chrome 156, 1440×900 and 1280×900 | Advanced journey step; coach queue. Files: `desktop-*.png`. |
| 200% zoom | Headless Chrome 156, 640×450 CSS px at device scale factor 2 (the layout a 1280×900 window has at 200% zoom) | Review view, no clipping. File: `zoom200-1280-review.png`. |
| Reduced motion | Headless Chrome 156 with `--force-prefers-reduced-motion` | The explorer renders `mx-root is-still` (camera motion off); without the flag it renders `mx-root`. The pilot sheet has no animations. File: `reduced-motion-3d-1280.png`. |
| Text mode | In-app browser, `text=1` | The mission opens and works in the text view, with the same sheet. |
| Keyboard | In-app browser, real key events | Shift+Tab from the heading wraps to "My attempts (1)" (last stop), and Tab from there reaches "Close mission". Focusing the explorer heading behind the sheet returns focus to the sheet heading. |

Headless Chrome enforces a minimum window width of about 500 px, so headless shots narrower than that are cropped. They were discarded, and the phone captures come from the in-app mobile emulation.

**Not done (human/device gate, not claimed):** physical touch devices, iOS/macOS Safari, VoiceOver/TalkBack/NVDA, real browser zoom (only the equivalent layout width was checked), and educator review of the wording.

## 5. Contract details for GPT and Gemini

1. **Organization claim (concrete case).** `server/lib/universe/auth.js` (pilot-backend `1e9f15c`, lines 116–155) accepts a membership-document organization when the ID token has no `orgId` claim. The frontend can only verify the claim, so a learner or coach whose organization comes only from membership sees "open once your school account is confirmed", and nothing is requested. This is fail closed by design. Decision needed: either guarantee an `orgId` claim for pilot accounts, or have the service return the resolved organization (for example in the `access` response) so the host can bind to it.
2. **B10 server behaviour assumed:** submit leaves the draft (including its `previousSubmissionId` and `revision`) untouched, and `updatedAt`/`createdAt` are ISO strings or Firestore timestamps (`timeMs` handles both). The revise rule compares the draft's `updatedAt` with the attempt's `createdAt`.
3. **Config include (Gemini J02 item 7):** no new test files were added. All new cases are in `tests/universe-pilot-client.test.js`, `tests/universe-pilot-session.test.js`, `tests/universe-pilot-ui.test.jsx` and `tests/coach-universe-submissions.test.jsx`, so adding the three pilot files to `tests/universe-preview/vitest.config.js` covers them.
4. **Integration touch points outside `features/universe`:** `src/app/AuthProvider.jsx` (adds `orgId`), `src/app/App.jsx`, `src/features/dashboard/MyDashboard.jsx`, `src/features/dashboard/SparkUniverse.jsx` and `src/features/coach/CoachDashboardHost.jsx`. Authentication and permissions are unchanged: `orgId` is read-only state from the existing claims call.

## 6. Reproduce

```bash
cd /Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend
git log --oneline -3 codex/universe-phase1-ui
./node_modules/.bin/vitest run --config tests/universe-preview/vitest.config.js
node --test shared/universe/tests/contracts.test.js
npm run build
./node_modules/.bin/vite --config tests/universe-preview/vite.config.js --port 5195 --strictPort
# then open http://localhost:5195/pilot.html?as=amira&open=thalassa-wind-survey
```

The writer turn for `pilot-frontend` is released after this commit. GPT integrates.

## 7. Follow-up: real local-service browser demonstration (commit `93847f6`)

### Entry
- `tests/universe-preview/service.html` and `service.jsx`, served by the existing preview Vite server at `http://localhost:5195/service.html`. No Vite config changes.
- **Safety guards:**
  - Refuses to run unless the host is `localhost` or `127.0.0.1`, before any Firebase module is imported.
  - Uses a named app with the hard-coded project `demo-universe-phase1` and a dummy key, Auth `initializeAuth` with `inMemoryPersistence`, and `connectAuthEmulator('http://127.0.0.1:9299')`.
  - Never imports `src/firebase.js`. Its in-app imports go through the existing offline alias to the stub.
- **What it drives:** the real explorer, `PilotMissionSheet`, `CoachUniverseSubmissions` and `createDefaultUniverseClient({ auth, baseUrl: 'http://127.0.0.1:3018' })`.
  - The client is memoized once per page; the screens bind it with `withScope`.
  - The scope (`uid`, `orgId`) is read only from the signed demo token's claims.
- **Test controls:** a separate panel labelled "EMULATOR DEMO CONTROLS · not part of the learner UI". It covers:
  - signing in as the learner, coach or other-organization admin
  - choosing a task (all three routes)
  - loading a labelled reference example into the server draft through the real adapter (GET the current revision → PUT with `expectedRevision` → GET to confirm)
  - opening the sheet or the coach queue
  - listing submissions
  - a cross-organization check
  - Fixtures are imported only by this entry.
- **Production build check:** 0 matches for `demo-universe-phase1`, `Synthetic-Pilot-Only`, `shared/universe/fixtures`, `REFERENCE_ARTIFACTS` and `pilot-fixture-g03`.

### Browser and device
The Claude desktop in-app browser on this Mac (Chromium-based; user agent `Claude/4.4212.0 Chrome/152.0.7977.167`; viewport 664×695 CSS px at DPR 2). Neither Safari nor the desktop Google Chrome app was used. There was no touch hardware or screen reader.

### What ran against the real local service (API `127.0.0.1:3018`, Auth emulator `127.0.0.1:9299`, actors seeded by GPT)

| Step | Result |
|---|---|
| Claims | Learner token: role `student`, org `phase1-demo-school`, classes `["phase1-demo-class"]`. Other admin: role `admin`, org `phase1-demo-other-school`, classes `[]`. |
| Reference example → server draft, all three tasks | Wind guided, journey advanced, journey guided: each `currentRevisionBefore: 0` → PUT 200 → reload revision 1, with every evidence part present. |
| **Wind** save → send | The sheet restored the server draft ("Saved to your account"; availability `in-review` from the service, allowed only because this explicit fixture entry sets `allowInReviewMissions`). Sent attempt 1 (`JtRyKOn0QQGbpdrvLHzu`). |
| Coach return | The queue showed only the learner's attempt. Returned with a note: POST review 200, audit record `ryXVFgHwCVHfJhLuVP52`. |
| Learner revise (draft kept) | After the send, the reopened sheet showed the service draft still saved (B10). "Revise and resend" autosaved against the kept draft revision; three PUTs, all 200, no `DRAFT_CONFLICT`. |
| Current-draft reload | Closing and reopening the sheet restored the edited recommendation and the revision link ("Send revised work for review"). |
| Resend → approve | Attempt 2 `HnviNXbtqLwLL4RfrQ78`, `previousSubmissionId: JtRyKOn0QQGbpdrvLHzu`, `previousCoachNote` carried. The approve response is `status: approved`, `submissionRevision: 2`, `outcome: {"type":"reviewed-only","grantIds":[],"messageKey":"universe.mission.reviewed","nextMissionIds":[]}`, audit `Jj6VlqZccXLFoWSMMUjC`. The learner and coach screens both show "A review records feedback only; it doesn’t open new places." |
| **Journey (advanced, `journey-mass-power`)** | The same flow: attempt 1 `jGikvhoiq94M1zggo1vG` returned (audit `ncicbwi5gGQMgmikQyDG`), revised and resent as attempt 2 `3PKDfXQpb4mG3BAAVD4j`, approved (audit `26azz1Vs3e5EGdGwTQms`), reviewed-only. Learner history shows attempt 2 reviewed, and attempt 1 with "You already sent a revision of this attempt" and no Revise button. |
| Other-organization rejection | As `phase1-demo-other`, `coachQueue` returned 0 items for submitted, returned and approved. A review of the learner's `3PKDfXQpb4mG3BAAVD4j` returned `403 FORBIDDEN` "Submission belongs to another organization." (request `c1d93c48-d78e-4cde-8969-6796e77e2b49`). |

**Captures:** `captures/service-demo/01`–`12` (wind 01–07, advanced journey 08–09, other-organization 10, guided journey 11, learner history 12).

### Real backend versus synthetic stand-in
- **Real local service and Auth emulator:** everything in the table above, including the adapter envelopes, contract header, CORS from `localhost:5195`, idempotency keys, availability, draft GET/PUT, submit, history, coach queue, review and organization denial.
- **Synthetic stand-in only** (`syntheticUniverseService.js`, unit/UI tests): F6 focus cases, F7 delayed replies and organization re-keying, 401/403 clearing, the F8 raw-window empty page, and the "newer work wins" B10 variant.

### Contract observations for GPT (no failures found)
- The draft PUT response carries both a flat ack (`draftId`, `revision`, `updatedAt`) and a full `draft`. The adapter accepts it; this is informational only.
- The coach card shows "Guided help" for the advanced journey because the reference example's `supportMode` is `guided`. This is consistent, but worth an educator glance.

**Not done:** student hardware, Safari, desktop Chrome, touch, screen reader. Mani noted that student hardware testing comes next.

## 8. F7.1: production host audit fix (commit `39e70d2`), separate from the demo

### Changes
- `src/auth.js`: `subscribeToAuth(callback, { tokens = false } = {})` keeps the `window.__hearIslandAuthReady` stale-session gate and its default `onAuthStateChanged` behaviour for other callers. With `tokens: true` it subscribes with `onIdTokenChanged`.
- `src/firebase.js`: an `onIdTokenChanged` compat wrapper, mirroring `onAuthStateChanged`. The compat SDK 10.8 loaded by `index.html` provides it.
- `src/app/AuthProvider.jsx` subscribes with `{ tokens: true }`. Behaviour:
  - **Generations:** every observer event increments a generation. Each `await` in the load path rechecks it before any state change or side effect (`logoutUser`, `startTimeTracking`, locale, theme, `localStorage`, `window.currentUserRole`). A delayed callback for account A therefore cannot restore A or sign out B, after an account switch or after sign-out.
  - **Claims source:** claims are read from the event's own user with a non-forced `getIdTokenResult()`, so there is no refresh loop. Previously they came from `getAuthClaims()` on the global `currentUser`.
  - **Same-user token event:** claims are re-read without a profile reload. `orgId` and `classIds` are updated or removed in place; if the organization claim disappears, `orgId` becomes `null` and the scoped screens close.
  - **Role change in the token:** the full fail-closed load path runs again (`loading`, `orgId: null`); it is not patched in place. Roles are never broadened beyond `resolveRole(claims, profile)`.
  - **`refreshProfile`:** applies the answer only if the same account (identity sequence and uid) is still signed in and ready.

### Tests (real `AuthProvider` with a controllable observer; delayed profile and claim reads)
- `tests/universe-auth-provider.test.jsx`, 8 cases:
  - the provider requests token events
  - delayed A after B: neither restores A nor signs out B (no `logoutUser`, no tracking for A)
  - delayed A after sign-out stays signed out
  - same-user organization change, organization removal, and an unchanged refresh (no profile reload, no state change)
  - role change takes the full path
  - an older slow claims read loses to a newer token
  - a delayed `refreshProfile` cannot overwrite B
  - a same-account `refreshProfile` applies
- `tests/universe-auth-subscribe.test.js`, 2 cases: the real `subscribeToAuth` waits for the stale-session gate, subscribes the requested observer, and never subscribes if cancelled first.
- Run against the pre-fix provider and `subscribeToAuth`, 9 of 10 fail. Some failures share one cause: the old provider read claims from the global `currentUser`, not the event's user.

### Checks after `39e70d2`

| Suite | Result |
|---|---|
| Scratch Universe include (now 13 files) | 112/112 |
| Committed `tests/universe-preview/vitest.config.js` | 60/60 |
| Shared contracts | 23/23 |
| Root vitest, excluding the two emulator rules suites | 42 files pass, 654 passed, 29 skipped. `sim-economy` fails only because it needs `127.0.0.1:8088`, as before. |
| `npm run build` | Passed (`index-DFoiJvSb.js`) |

**For integration (GPT):** please add `tests/universe-auth-provider.test.jsx` and `tests/universe-auth-subscribe.test.js` to the supported Universe test config. The config is not mine to edit.

**Not verified:** no browser run against the production host with a real token whose `orgId` claim changes mid-session (it would need a claim change on a live or emulated account through the real `index.html`). This is covered by the provider tests only.

The writer turn for `pilot-frontend` is released after the docs commit. GPT integrates. Nothing was pushed or deployed.

## 9. Final bounded UI check: legacy coach work and this Mac

### Legacy submissions are read-only
- `CoachUniverseSubmissions` no longer renders the decision form for a `legacyFormat: true` record, even while its `status` is `submitted`.
  - It shows: "Earlier reflection-only format: kept for reading only. It can’t be approved or returned in this pilot."
  - The reflection and the record's other details stay readable.
- `review()` also returns early for a legacy or non-submitted record, so no other path can send a review.
- Current-format records keep the same review behaviour.
- **Tests** (`tests/coach-universe-submissions.test.jsx`):
  - A legacy submitted card shows the wording and the reflection. It has no form, textarea, decision, "Return to learner" or "Record approval". No review POST is made, and the record stays `submitted` at revision 1.
  - With a current-format card on the same screen, the current card can still be returned through the service.
  - Against the previous card, both tests fail.

### This Mac: short real 3D sample with the existing `showMetrics`
- **Preview-only switch:** `?metrics=1` in `tests/universe-preview/service.html` passes the explorer's existing `showMetrics`. The control panel also gained "Open explorer only" (the explorer with no mission open).
- Nothing in `src` passes `showMetrics`; the learner app's default is `false`, and the production build contains no `metrics=1`.
- **Setup:** Claude desktop in-app browser (Chromium; `Claude/4.4212.0 Chrome/152.0.7977.167`), viewport 664×695 CSS px at DPR 2. WebGL renderer `ANGLE (Apple, ANGLE Metal Renderer: Apple M5)`. Vite dev server with high detail unless noted.
- **Signed in:** synthetic learner on the local Auth emulator.

| Moment | Overlay (FPS is the explorer's own rolling sample; "idle" means no frame rendered in the last 1.6 s) | Observed timing |
|---|---|---|
| Page load (`service.html`) | n/a | `domContentLoaded` 35 ms, 57 resources (dev server, warm cache) |
| Universe, after "Open explorer only" | idle · renders on demand · 13 draw calls · 540 tris · 8 geometries · 9 textures | 135 ms from click to canvas plus first counters |
| Select Lyra Spiral | idle · 15 calls · 796 tris · 9 geometries · 9 textures | — |
| Travel into Lyra Spiral | 62 → 60 fps · 3 calls · 0 tris (point stars) · 9 geometries · 6 textures | Panel heading changed at ~102 ms; travel 1.8 s |
| Galaxy level after travel | **still 60 fps 3+ s after arriving**, so the galaxy level keeps rendering frames rather than going idle | — |
| Visit Lyra Prime (system) | 52 → 60 fps · 22 calls · 16,638 tris · 19 geometries · 11 textures | Heading at ~101 ms |
| Select Thalassa at system level | idle · 24 calls · 16,894 tris · 20 geometries · 11 textures | — |
| Inspect Thalassa (planet) | 51 → 60 fps · 9 calls · 20,262 tris · 7 geometries · 6 textures | Heading at ~146 ms |
| Land on Thalassa (surface) | 48 → 60 fps · 43 calls · 85,410 tris · 46 geometries · 0 textures. Continuous by design (animated surface while motion is on). Standard detail: 43 calls · 34,914 tris at 60 fps. | Heading at ~257 ms. The lazy chunks (`ExplorerEnvironment.jsx` 45 ms, `environmentKit.jsx` 2 ms, `thalassaWindSurvey.js` 5 ms) were already warm from earlier visits. |

**Reading the sample**
- FPS dips to about 48–52 only during camera travel and recovers to 60.
- The counts are renderer counters (draw calls, triangles, geometries, textures), not memory in bytes.
- This is one M5 Mac in a Chromium-based in-app browser on a dev server. It is not a phone or tablet figure, and no device performance budget is claimed from it.
- **Observation for a later explorer turn (not changed here):** the galaxy and planet levels kept rendering at 60 fps after travel ended, while the universe and system-selection states went idle. If the on-demand loop is meant to stop there too, something at those levels keeps requesting frames.

**Captures:** `captures/service-demo/13-metrics-universe-idle.jpg` and `14-metrics-thalassa-surface.jpg`.

### Checks

| Suite | Result |
|---|---|
| Scratch Universe include | 13 files, 114/114 |
| Committed `tests/universe-preview/vitest.config.js` | 62/62 |
| Shared contracts | 23/23 |
| `npm run build` | Passed. 0 matches for fixtures, demo config or `metrics=1`. |

**Next:** physical student-device testing is the round Mani requested, and it was not done here. This check is complete, and the `pilot-frontend` writer turn is released. Nothing was pushed or deployed.
