# Mission cannot scroll — independent Opus QA

Mani cannot scroll down in the current preview. GPT reproduced the layout defect in the actual 625×505 viewport: stage 363px, implicit wrapper grid row 1204px, dialog 1204px, body 998px with no overflow. The ancestor stage clips it and focus had scrolled that hidden ancestor 213px. The prior overlay QA's scrollIntoView checks did not establish that real wheel scrolling works.

GPT is fixing integration **only**, in `src/features/universe/pilot/pilot.css` plus the existing scroll-reset line in `PilotMissionSheet.jsx`. The wrapper now has `grid-template-rows: minmax(0,1fr)` and the bounded dialog is a single vertical scroll area. The header can scroll too on short screens. No hook order changes; preserve Mani's unsaved text and existing two-version conflict. No data/auth changes.

Opus assignment: **read-only source review and actual scroll QA**, not edits. Use a separate background tab at integration `http://127.0.0.1:5196/pilot.html?latency=0&as=ben&open=thalassa-wind-survey&route=guided&step=5&text=1` (synthetic in-memory preview). **Do not use or alter Mani's service.html tab/draft**, and do not save to the real local service. Confirm by real scroll/trackpad/wheel or PageDown/PageUp, not by setting scrollTop/scrollIntoView:

1. At 625×505 and 375×600, scroll down from the top until Back/Next or Review is visible; scroll back up to the title. Read scrollTop before/after. Dialog stays bounded to its wrapper; `.mx-stage.scrollTop` remains zero.
2. Expand “Evidence for this task”, scroll through the extra content, and reach the bottom controls. Close the drawer and check navigation/keyboard focus stays useful.
3. Check brief, work and review. Confirm no horizontal overflow and text/format changes remain intact.

Save two screenshots (top/bottom) and a compact QA note under **frontend checkout** `docs/implementation/captures/scroll-fix/` and `MY-UNIVERSE-SCROLL-FIX-QA-2026-11-03.md`. Commit evidence only. Report failures immediately; otherwise provide commit and release. No production action.
