# Student profile space local review

Run from the isolated feature checkout:

```sh
npm exec -- vite --config tests/profile-space-preview/vite.config.js
```

Open `http://127.0.0.1:5190/` for the empty cover/photo state, or `http://127.0.0.1:5190/?images=1` for example images. This fixture replaces the settings/upload service with in-memory state and temporary local URLs. It does not authenticate or connect to production; saves disappear on reload.

The Local crop verification controls create a synthetic PNG in the browser, then use the actual crop component and canvas encoder. Verify sliders, Escape/focus restoration, Cancel, and 640×640 photo or 1600×600 banner output. Photo/banner file selection on the profile itself uses the simulated upload service.

Screenshots are in `docs/implementation/student-profile-space/`. Refinement instructions are in `docs/implementation/STUDENT-PROFILE-SPACE-CLAUDE-HANDOFF.md`.
