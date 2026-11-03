# Preview controls obstructing the learner screen

Mani's screenshot shows the gold emulator demo panel covering most of `http://127.0.0.1:5196/service.html`. It is a fixed panel with an extreme z-index and `open` on initial render. GPT is fixing the preview layout directly in the **integration checkout**. No runtime/source writing is assigned to Opus for this item.

## Opus: independent browser QA

Use your actual browser against **5196** (integration), not your older 5195 checkout. Read `tests/universe-preview/service.jsx` and `service.html` in `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-integration` after GPT's current changes settle. Verify:

- Test controls start closed, live in normal document flow, and do not float over the page.
- A simple learner entry on the home page lets Mani choose a mission and start the synthetic learner preview without opening technical controls. It must use the existing local Auth flow only. Do not load or overwrite a reference draft.
- Opening a mission hides/collapses controls. Back/Next and the mission's close button remain reachable at desktop and 375px width.
- Technical actor/reference/coach controls remain available from the home page in the collapsed disclosure; they are not visible over learner content.
- If a plain reload needs sign-in, that is existing in-memory local Auth behavior. Do not change authentication/persistence.

Do not edit either runtime checkout. Save two screenshots (home and unobscured mission) plus a compact QA note under **your frontend checkout** `docs/implementation/captures/preview-overlay/` and `docs/implementation/MY-UNIVERSE-PREVIEW-OVERLAY-QA-2026-11-03.md`. Commit those evidence files only and report their paths/commit. This is local-only, no push/deploy. Let GPT know any failed behavior promptly.
