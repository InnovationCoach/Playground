# Local student live test — 4 October 2026

Tested the real app at `http://localhost:5173/?emulators=1` through its browser UI, signed in as the disposable emulator account `mia@school.edu` (Mia Chen). The frontend and API were running against the local Auth/Firestore emulators. Production data was not used.

## Passed live checks

- Student sign-in and dashboard access.
- Dashboard heading, accent and private personal goal saved successfully and persisted after refresh.
- Keyboard widget reordering and undo before saving.
- Portfolio navigation and return to private dashboard.
- Portfolio heading/introduction saved.
- Private written reflection preview, creation and persistence after refresh.
- Code project creation with assigned-coach audience.
- Coach audience preview includes the code project and excludes the private reflection and personal goal.
- All twelve school calendar months render; students have no event creation controls.
- Private goal widgets are absent from portfolio screens.
- Header contrast verified in the complete app after isolating legacy styles.

## Issues found and corrected

1. Requests without an options object crashed before reaching the API. Added an empty default object and a regression test.
2. The inline legacy hash router intercepted the new portfolio route and returned learners to Home. Added the private dashboard and portfolio routes to its React-owned screen list and tested both student and coach routing.
3. The legacy goals integration appended a private goals host to the document body when another screen was open. Removed that fallback, restricted auto-setup to a private host, and mounted the goals strip from the student dashboard. Added privacy regression tests.
4. Page-wide legacy header styles produced low contrast in learner surfaces. Scoped the new header styling to retain its accessible palette.
5. Emulator review learners and admins lacked signed school/class scope. Corrected their seed claims.

## Verification and limits

All 333 unit/interface tests passed before the final, visually verified CSS isolation change. The production build passed; the final build is rerun after the CSS change. Real file uploads, microphone recording, playback and actual cross-account sharing were not exercised in this browser session. No school events were seeded, so calendar checks covered rendering and read-only controls rather than event delivery.

The student remains signed in with test-only personalization and portfolio entries available for further manual testing. Screenshot: `output/student-live-test.jpg`.
