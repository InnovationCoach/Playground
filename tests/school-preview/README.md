# Isolated school dashboard design preview

Run `npm start -- --host 127.0.0.1 --port 5175 --config tests/coach-preview/vite.config.js` from the repository root, then open `/tests/school-preview/index.html` on that server.

The preview loads SchoolLearningPanel with a development-only API adapter. It has no Firebase import, real accounts, or real saves. All records are samples and a persistent banner says so. Choose coach, student, admin, parent, or connection-error links. Form actions change only the page's in-memory sample records and reset on reload. Some deployment/provider operations are intentionally unavailable.

The production build uses `src/services/api/apiClient.js`; the preview alias is confined to the isolated Vite configuration and cannot replace it there. The older coach preview also uses this isolated adapter for its added school-workspace panels.

Actual security/persistence checks live in `tests/api/school-workspace.test.js` and require the Auth/Firestore emulators (`npm run test:api`). UI regression checks are in `tests/school-workspace-ui.test.jsx` (`npm run test:unit`). Preview screenshots do not establish production connectivity.
