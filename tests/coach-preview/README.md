# Isolated coach dashboard preview

Run `npm start -- --config tests/coach-preview/vite.config.js --host 127.0.0.1 --port 5174` from the repository root, then open `http://127.0.0.1:5174/tests/coach-preview/index.html`.

This renders the actual coach workspace with fixture read adapters. It never contacts Firebase and is not part of the application entry or production build. The banner labels all records as samples. Links exercise populated, empty, denied, and unassigned states.

Manual regression sequence: select Climate Studio, search Mia, Review, expand evidence; clear search, switch STEAM, review Arun and verify zero score; switch Academic and verify pending integration; use banner links to verify distinct failure states. Check phone width, keyboard access, and class switching with an open review panel.
