# Coach workspace first implementation

3 October 2026. Implemented locally; not deployed.

The coach landing screen now mounts a React progress workspace with Overview, PBL Studio, STEAM Activities, and Academic Progress. Class selection comes from refreshed signed claims. Roster reads remain scoped to those class IDs, without admin API/mock fallbacks or invented class assignments. Failed queries remain errors; missing coach/class claims have their own recovery guidance. Partial activity-record errors are disclosed and excluded from summaries.

PBL uses the existing current-term project model, phase task checks, evidence portfolio, learner question/criteria, and readiness checks. Readiness does not imply formal coach approval. STEAM reads current activityProgress records, retains numeric zero, counts actual timed Solar Car runs, and presents recorded activity outcomes without invented defaults. Academic shows Edmentum connection pending.

Existing registration, exports, feedback, and material tools remain accessible under Management tools. This legacy view is labeled with its known demonstration-data limitations. Its security/backend issues are still outstanding; this UI change does not remedy or deploy those rules.

Validation: production build passed; 291 unit tests passed, including four coach-data regression tests. Browser checks with isolated fixtures verified class scope, learner search followed by review, PBL evidence, zero scores, academic pending state, empty class, access denial, and unassigned coach. Responsive styles were added, but the browser viewport override stayed at 1280px, so narrow-screen behavior remains unverified. Main-app sign-in testing encountered a connection error; populated live-account behavior is not verified. Sample preview never connects to Firebase. Build still reports the existing large-bundle warning.

Remaining scope: backend evidence-linked reviews and coach sign-off; production class-claim verification; secure persisted management tools; external academic feed; separate SO₂ Filter Lab run collections; broader activity adapters; translation into Chinese/Thai; pagination/summary endpoints for large rosters. This first view is English.

Preview: `http://127.0.0.1:5174/tests/coach-preview/index.html`. See `tests/coach-preview/README.md` for reproduction. All preview identities and evidence are labeled samples.
