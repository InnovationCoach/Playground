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
