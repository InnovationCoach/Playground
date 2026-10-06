# Claude UX/UI refinement — private student profile space

## Ownership and scope

User authorized the feature build and a Claude UX/UI refinement on October 6, 2026. Functionality is implemented on `codex/student-profile-space`, in `/private/tmp/hear-island-student-space`, based on `5d0d247`. Gemini owns Firebase configuration and deployment. Do not deploy, edit Firebase settings, merge main or overwrite ongoing coach/backend work as part of refinement.

Act as a creative product designer and frontend designer. Refine this implemented private learning space into a confident, welcoming personal profile: a broad cover, an overlapping circular photo, clear learner identity, and easy controls directly on the image areas. Take familiar profile conventions from social sites while preserving the platform's calm learning identity. Keep the private dashboard separate from shareable portfolio content.

## Working functionality to preserve

- An always-visible cover placeholder and large photo/initials area, including before any image is uploaded.
- Add/change banner and photo actions on the images; detailed image controls collapsed under Image settings.
- Local crop dialog with zoom and horizontal/vertical sliders, keyboard support, focus containment, Escape cancellation, focus restoration and actionable failures.
- No upload before Use this crop. Cropped PNGs use the existing private `learnerMedia` upload/media-preview service. Display updates are previewed; the existing settings save persists only owned asset path/name references. No public download-token URLs or new executable/custom HTML settings.
- Profile output 640×640; cover output 1600×600. Still PNG output and responsive edge cropping are disclosed. Animated GIFs become a still image.
- Explicit Save, Undo and Discard; image removal; headings, interests, introductions, preset colors/backgrounds/layouts, keyboard and drag widget ordering. Private goals and support information do not enter portfolio previews.
- Existing portfolio appearance/settings and backend validation shapes.

## Files and local review

- `src/features/personalization/Personalization.jsx`: private profile surface, file validation, existing upload integration and saved/draft controls.
- `ImageCropDialog.jsx` and `imageCrop.js` in the same directory: accessible crop UI and bounded source geometry/native PNG preparation.
- `personalization.css`: cover/photo layout, responsive identity, crop dialog.
- `tests/personalization-ui.test.jsx`, `tests/profile-image-crop.test.js`: upload/cancel/failure/privacy and crop bounds.
- `tests/profile-space-preview/`: isolated design fixture. Run `npm exec -- vite --config tests/profile-space-preview/vite.config.js`, then open `http://127.0.0.1:5190/`. Add `?images=1` for example cover/avatar. Nothing in this fixture contacts production.

## Design refinement priorities

Refine typography, hierarchy and spacing, especially the private-space toolbar, name/heading relationship, and image controls at 375px. Keep the learner identity and next learning action easy to reach. Refine empty states and crop-dialog clarity; maintain visible focus and comfortable touch targets. Keep privacy language short and clear. Consider consolidating the two existing settings/save areas without losing undo or making image changes save automatically. Do not add a design framework or external tracking/dependencies solely for this surface.

Check widths 375px, 615px and 1440px, long names/headings, empty interests, both images missing, one image set, loading/service failure, upload failure, cancel, undo/discard, keyboard ordering and reduced-motion preferences. The new layout uses no animation.

Before completion run unit tests and production build; capture screenshots and report exact changes and remaining limits. If backend/cloud work is needed, describe it for Gemini rather than performing it.

## Evidence and limits

Feature build: 483 unit tests pass (26 files); production build passes. Local browser checked 375/615/1440 page widths without horizontal overflow, real canvas PNG preparation for photo/banner, keyboard crop changes and focus restoration. Screenshots: `docs/implementation/student-profile-space/`.

The design fixture simulates settings and upload URLs. Automated integration checks mock Storage/API responses. No real Storage upload, production settings save or deployment was performed. Signed image URL expiry handling remains the existing implementation; discarded uploaded previews are not automatically deleted from Storage. Language copy remains English as in the existing personalization UI. Native speaker review/localization can be a separate refinement task. Claude refinement itself has not yet run.
