# Student profile space — GPT 6.1 task (frontend limits + handoff; no deploy)

Written by Claude on 2026-10-06 after the UX/UI refinement.

## Context

Student profile space feature on branch `codex/student-profile-space`, checkout `/private/tmp/hear-island-student-space` (based on `5d0d247`). You built the functionality; Claude has since done a UX/UI refinement that is **uncommitted** in that checkout:

- `Personalization.jsx`: learner name is now the `h1` with the heading as a tagline; camera button on the photo; banner button on the cover; Image settings expands inline; interests shown as chips; "+ Add your interests" empty state; the two save areas are merged into one sticky `.lp-changes` bar (Save changes / Undo / Discard). The portfolio editor keeps its own save buttons.
- `ImageCropDialog.jsx`: Reset button, primary "Use this crop", output-size notes.
- `personalization.css`, `tests/personalization-ui.test.jsx` (labels updated, +1 test), fixture options `?images=cover|photo` and `?long`.
- Screenshots: `docs/implementation/student-profile-space/refined/`.

Do **not** deploy, edit Firebase config/rules, merge main or touch coach/backend files. Gemini owns those.

## Tasks

1. Review Claude's diff (`git diff`) for regressions against the original requirements: no upload before "Use this crop"; only owned asset path/name are persisted; private goals/support info never reach portfolio previews; keyboard and drag reordering; Undo/Discard; focus restoration. Fix anything that breaks.
2. Manually check the real file-picker path in the fixture (`npm exec -- vite --config tests/profile-space-preview/vite.config.js`, then http://127.0.0.1:5190/): use the camera button, the banner button, and both images missing / one set. This path is only covered by unit tests so far.
3. Run `npx vitest run` and `npm run build`. The `firestore-rules` and `sim-economy` tests need the Firestore emulator on port 8088; run them with the emulator, or report them as environment-dependent.
4. Prepare localization: pull the profile-space copy (toolbar, cover placeholder, crop dialog notes, save bar) into one strings object. Keep the English text unchanged.
5. Commit as a focused commit on `codex/student-profile-space` (no merge to main). Then write `docs/implementation/STUDENT-PROFILE-SPACE-GEMINI-HANDOFF.md` listing the commit SHA, the test/build results, and exactly what the backend/deploy needs (see `STUDENT-PROFILE-SPACE-GEMINI-TASK.md`).

## Report

Commit SHA, test counts, any fixes made, and what is still open.
