# My Universe preview overlay fix: Opus browser QA

3 November 2026 · Opus 5.5 · brief: `MY-UNIVERSE-PREVIEW-OVERLAY-FIX-2026-11-03.md`.

**Result: pass.** No failed behaviour to report to GPT.

Read-only for both runtime checkouts: no source, config or auth edits. Local only; nothing pushed or deployed.

## What was tested

- **Target:** `http://127.0.0.1:5196/service.html`, integration checkout `pilot-integration` at `d8bcd07`, with GPT's uncommitted changes to `tests/universe-preview/service.html` and `service.jsx` (diff sha256 prefix `b14543bfaaf6`).
- **Code read:** both files.
- **Browser:** Claude desktop in-app browser (Chromium).
  - **Desktop:** Mani's tab at 664–800 px.
  - **Phone:** a separate background tab with 375×812 mobile emulation, so Mani's tab wasn't disturbed.

## Results

| Check | Result |
|---|---|
| Test controls start closed and are in normal document flow | Pass. `<details class="sv-bar">` is closed on load, `position: static`, `z-index: auto`, and sits below the mission list and the "Local preview · fictional learner account" note. No `fixed` or `sticky` element on the home page (desktop and 375 px). While closed, none of its 13 controls is visible (`checkVisibility()` returns false for all). |
| Simple learner entry on home | Pass. "Choose a mission" shows three cards: Wind energy estimate, Journey timing, and Mass and power tradeoffs, each with suggested grades and challenge number. Tapping a card in a fresh tab signed the synthetic learner in through the existing local Auth emulator flow and opened the mission sheet directly; no technical controls were opened. The sheet showed the learner's own saved draft ("Saved · 2 Nov, 20:31"); no reference example was loaded (code: `startMission` never calls `loadExample`). |
| Opening a mission hides the controls | Pass. In both mission views `.sv-bar` is not rendered; the only fixed layer is the explorer's own `mx-root`. |
| Back/Next and Close reachable | Pass at desktop and at 375 px. Each scrolled into view, and `elementFromPoint` at its centre hit the button itself. Back → Step 8 of 9; Next → back to Step 9 of 9, with focus on the action heading. Close mission (44 px tall, 34 px wide at 375 px) returns to the explorer; Leave universe returns to "Choose a mission" with the controls still closed. |
| Technical controls still available from home | Pass. Opening the disclosure shows all 13 controls: three actors, Sign out, Task, Reference example, Load into server draft, Open mission sheet, Open explorer only, Open coach queue, List my submissions, Cross-organization check, and Home. Width stays 375 px with it open. |
| No sideways overflow at 375 px | Pass. `scrollWidth` equals `innerWidth` on home, the mission sheet, and with the disclosure open. |
| Reload or new tab | Starts signed out (in-memory Auth, unchanged); a mission card signs the learner back in. Expected behaviour. |

## Side effect to note

Back then Next marked the step position as changed, and the existing 1.2 s autosave sent one `PUT …/thalassa-wind-survey/draft` (200) for the synthetic learner on the local service. The content and final step were the same; only the draft revision and time changed ("Saved · 3 Nov, 08:55").

If another tab still had that wind draft open from before, its next save may show the normal two-version conflict.

This is existing focus-flow behaviour, not part of the overlay fix.

## Observations (not failures)

- The 375 px Close mission button is 34 × 44 px. That is the existing explorer control and was not changed by this fix.
- Closing a mission returns to the explorer (Galaxies), not straight home; "Leave universe" is the way home. This is existing explorer behaviour.

## Captures (`captures/preview-overlay/`)

- `01-phone-home-controls-closed.jpg`: 375 px home; the mission cards come first, then the closed "Test tools · local preview only".
- `02-desktop-mission-unobscured.jpg`: desktop mission sheet (Journey timing, opened by Mani); nothing over the content, Close visible.
- `03-phone-mission-unobscured.jpg`: 375 px wind mission sheet; Close, tabs and status visible, no test controls.

Not covered: Safari, physical phones, touch hardware, screen readers.

## Integrated lead acceptance

GPT accepted the local fix at `7384798`. Its exact patch SHA-256 is `b14543bfaaf69af1a7a80b432bc37a740c661e02caeb562c6674a125dc682dca`, matching the patch independently checked above. Opus evidence commit `82a58a3` was integrated as `55e2b2b`. Lead validation: JSX compilation passed, `git diff --check` passed, and the supported Universe interface suite passed **134/134** across 13 files. The lead also opened the wind mission from the new card, confirmed zero `.sv-bar` panels in the mission, and used Next successfully. No reference draft was loaded. This is a local preview fix; production source and deployment are unchanged.
