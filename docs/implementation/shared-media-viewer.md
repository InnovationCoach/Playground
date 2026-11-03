# Shared learning media viewer

Existing programme/lesson resources, portfolio evidence, community posts, message attachments and coach/activity drawings now use a shared viewer. No content records, uploads, access rules, or grades are migrated.

Images open in a native modal dialog with keyboard activation, Close/Escape, focus return, fit-to-screen and source-pixel-size views. The modal uses the same already-authorized URL, supports scrolling at original size, and reports image load failures.

Videos have native playback/seek/volume/fullscreen controls where supported, inline mobile playback, an explicit speed selector, optional supplied caption tracks, error messages and retry. Playback stops on unmount. There is no autoplay. Native MP4/WebM compatibility still depends on codecs; this change does not transcode unsupported recordings or fix Storage authorization failures.

Legacy media can be recognized by filename/URL extension when its MIME metadata is missing or generic. PDFs and presentations retain their existing file links. Branding images, crop controls and programme-selector thumbnails keep their existing navigation/editing behavior; content images use the viewer.

Unit/regression verification: run `./node_modules/.bin/vitest run tests/media-viewer.test.jsx tests/coach-lesson-editor.test.jsx tests/school-workspace-ui.test.jsx tests/personalization-ui.test.jsx tests/journey.test.jsx` and `npm run build`.

Isolated browser preview: run `npm start -- --host 127.0.0.1 --port 5175 --config tests/coach-preview/vite.config.js`, then open `/tests/media-preview/index.html` (shared component and intentional video-failure case) or `/tests/school-preview/index.html` (coach/student/admin/parent sample routes). These previews never establish production authentication, asset-read permissions or successful real video decoding.

Deploy only after validating real supported video playback, uploaded-image read access, and role/cohort permissions in the target environment. Existing production upload authorization failure remains a separate issue.

## Lesson organization

The existing structured lesson list and guided editor are preserved. Learner lesson actions now say Open lesson, and the learner panel says Your lesson. Full legacy briefs, lesson resources and interactive activity/simulation controls remain accessible in collapsed Resources & interactive work sections, rather than repeating long document blocks below the lesson list. No source content is removed or rewritten.
