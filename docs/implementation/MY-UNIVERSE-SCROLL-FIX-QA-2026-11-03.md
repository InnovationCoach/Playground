# My Universe mission scroll fix: Opus read-only QA

3 November 2026 · Opus 5.5 · brief: root `docs/implementation/MY-UNIVERSE-SCROLL-FIX-QA-2026-11-03.md`.

**Result: pass.** The mission sheet now scrolls with a real mouse wheel and with keyboard focus at 625×505 and 375×600, in the brief, work and review views. The sheet stays inside its wrapper, `.mx-stage.scrollTop` stays 0, and there is no sideways overflow.

No failures to report. There are two small notes about the `pilot.html` preview badge, and one test-tool limitation (below).

Read-only: no runtime edits in either checkout. Mani's `service.html` tab and the local mission service weren't used. Nothing was pushed or deployed.

## What was tested

- **Fix:** integration `ccf9cae` "Fix mission sheet scrolling in constrained viewports". Testing started on GPT's uncommitted diff; the commit has the identical lines.
  - `pilot.css`: `.mx-mission-wrap:has(> .px-sheet) { grid-template-rows: minmax(0,1fr) }`, and the sheet becomes a single `overflow-y: auto` area with `max-height: 100%`.
  - `PilotMissionSheet.jsx`: the existing reset now targets `.px-sheet`. Hook order unchanged.
- **Source review:** the change matches the brief. The only `scrollTop` write in the pilot sheet is that reset; there's no `scrollIntoView` in pilot code. `:has()` needs Safari 15.4+, Chrome 105+ or Firefox 121+.
- **Page:** `http://127.0.0.1:5196/pilot.html?latency=0&as=ben&open=thalassa-wind-survey&route=guided&step=5&text=1` (synthetic, in memory), in my own background tab in Claude's in-app Chromium browser.
- **Scrolling method:** real mouse-wheel events and real Tab, Shift+Tab and Enter key presses. `scrollTop` was only read, never set.

## Results

| Check | 625×505 | 375×600 |
|---|---|---|
| Sheet bounded to wrapper | Sheet, wrapper and stage all span 101–505 px; content 881 px in a 402 px box | All span 160–600 px; content 1002 px in a 438 px box |
| Wheel down from title | 0 → 479.5 (max): Back and Next fully visible | 0 → 564 (max): Back and Next visible |
| Wheel back up | → 0, title visible | → 0, title visible |
| `.mx-stage.scrollTop` and document scroll | 0 throughout | 0 throughout |
| Horizontal overflow | none (`scrollWidth` = `innerWidth`; sheet `scrollWidth` = `clientWidth`) | none, including with the table and Written formats |
| Keyboard (Tab) | Focus moves Close → tabs → Save now → help → answer → Check → Hints → Reference → Full task → Evidence → Back → Next → All steps, then wraps to Close. The sheet scrolls to each one (0 → 310 → 480) and every focused control is in view. | n/a |
| "Evidence for this task" open (keyboard Enter) | Content grows to 1801 px; wheel reaches the true bottom (1399) with Back and Next visible; no sideways overflow despite the dataset table | n/a |
| Drawer closed (keyboard Enter) | Focus stays on its summary, in view; scroll range returns to 479; the next Tab goes to Back | n/a |
| Review view | n/a | Focus on the "Review and send" heading; wheel reaches the bottom (1118) with "Send for review" visible |
| Brief (Routes) view | n/a | Focus on the mission title at top 0; wheel 0 → 484.5 → 0 |
| Text and format kept | n/a | Practice answer `0.31`, table cell `12` and written text survived Work → Review → Work at the same step (5, part 2), with Written still selected. Switching back to Table showed `12` again. |

## Notes (not failures of this fix)

- **Preview badge (`pilot.html` only):** the fixed `.pv-bar` "SYNTHETIC PREVIEW · Ben" badge (z-index 2147483000) sits over the bottom of the sheet at 375×600.
  - It covers the right part of "All steps" and the lower 20 px of "Send for review".
  - Both still work where they aren't covered, and the button centres are clear.
  - It's not in `service.html` or the app. A bottom padding in the preview, or moving the badge, would clear it. That's GPT's call.
- **PageDown/PageUp: inconclusive in this tool.**
  - The key arrives with focus on the title (`key: "PageDown"`, not cancelled), but the sheet doesn't move.
  - A control scroller placed inside the same dialog also didn't move with the same key, so the test tool's simulated key doesn't trigger the browser's built-in scrolling.
  - This isn't evidence of a page defect. Mani can confirm with a real keyboard: click the title or plain text in the sheet, then press PageDown or Space.
- **Small scroll offsets after switching views:** the sheet sits at 13.5 px (Review) or 295 px (Work) rather than 0, because focus moves to that view's heading or current action after the reset. The focused heading is in view each time. This is expected.

## Captures (`captures/scroll-fix/`)

- `01-625x505-top.jpg`: title and tabs at the top.
- `02-625x505-bottom.jpg`: after wheel scrolling, Back and Next visible.
- `03-625x505-evidence-open-bottom.jpg`: evidence drawer open, scrolled to the bottom controls.
- `04-375x600-top.jpg` and `05-375x600-bottom.jpg`: the same at phone size, where the preview badge overlaps "All steps".

**Not covered:**
- **Safari:** WebDriver still refuses ("You must enable 'Allow remote automation' in the Developer section of Safari Settings"), even after Mani's change.
- **Touch:** real touch or trackpad momentum on hardware.
- **Physical phones:** the demo listens only on 127.0.0.1; see the overlay QA note.
