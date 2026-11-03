Run `npx vite --config tests/pilot-preview/vite.config.js --host 127.0.0.1 --port 5188` and open `http://127.0.0.1:5188/tests/pilot-preview/`.

This isolated visual preview uses explicitly labeled sample records and rejects writes. Production components use the real authenticated service. For persistence and permission checks run:

`npx firebase emulators:exec --only firestore,auth --project demo-hearisland-local 'npx vitest run --config tests/api/vitest.api.config.js tests/api/pilot-operations.test.js'`

Component checks: `npx vitest run tests/pilot-operations-ui.test.jsx tests/growth-hub-phase0.test.js`.
