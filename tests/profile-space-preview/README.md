# Student profile space local review

Run from the isolated feature checkout:

```sh
npm exec -- vite --config tests/profile-space-preview/vite.config.js
```

Open `http://127.0.0.1:5190/` for the empty cover/photo state, or `http://127.0.0.1:5190/?images=1` for example images. Use `?images=cover` or `?images=photo` for a single image, and add `long` (for example `?long&images=cover`) for a long name and heading with empty introduction and interests. This fixture replaces the settings/upload service with in-memory state and temporary local URLs. It does not authenticate or connect to production; saves disappear on reload.

The Local crop verification controls create a synthetic PNG in the browser, then use the actual crop component and canvas encoder. Verify sliders, Escape/focus restoration, Cancel, and 640×640 photo or 1600×600 banner output. Photo/banner file selection on the profile itself uses the simulated upload service.

Screenshots are in `docs/implementation/student-profile-space/`. Refinement instructions are in `docs/implementation/STUDENT-PROFILE-SPACE-CLAUDE-HANDOFF.md`.

## Reviewed real file-picker path (2026-10-06)

Used the actual camera/banner buttons and browser file chooser with a local PNG, rather than the synthetic crop-test buttons:

- Empty profile: camera selection opens crop; Cancel returns focus to camera without changing images. Banner selection opens crop; Apply previews the banner; Undo removes it.
- `?images=cover`: camera selection and Apply add the photo; Discard restores the saved cover-only state.
- `?images=photo`: banner selection and Apply add the cover; Discard restores the saved photo-only state.
- Image settings starts collapsed in each scenario. The buttons now expand it before invoking their underlying file inputs, which fixes the failed selection observed with the collapsed inputs.
- Mobile 375 × 812: banner crop and controls fit without horizontal scrolling. Screenshot: `docs/implementation/student-profile-space/refined/review-mobile-real-banner-picker.jpg`.

These checks use the real chooser and canvas crop, but the fixture upload/save service is simulated. They do not verify production Storage, authentication, signed-URL renewal or persistence across reloads. During development hot updates the fixture logged a duplicate-createRoot warning; it was not a crop failure.
