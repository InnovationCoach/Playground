# Deployment Plan: W2e Dashboard Live with akira@welearn.org Testing

**Objective:** Get release candidate 4d32122 live on dnd-master-73449.web.app with the W2e Studio Home dashboard rendering correctly for the akira@welearn.org student account.

**Timeline:** Single coherent deployment (Hosting + Cloud Run + Firestore provisioning).

---

## What akira@welearn.org will see when it's working

1. Sign in to https://dnd-master-73449.web.app with akira@welearn.org
2. Land on "Studio Home" tab (not PBL Programs)
3. See:
   - Greeting: "Hi [first name]. Start with one step."
   - Encouragement slider with four motivational slides
   - Next-step card: "Find the campus energy hotspots" (example Net Zero Microgrid task)
   - Progress ring showing 0/3 steps
   - Pacing suggestions (optional)
   - Curiosity space and quest planner cards
   - Information rail:
     - "My learning" links to other tabs
     - "Coming up" shows real school calendar events (or honest empty state)
     - "Your coach is nearby" button
4. Light theme by default; header toggle switches dark/light and persists
5. Support request sent from student appears in assigned coach's panel within seconds

---

## Deployment checklist (Gemini's work)

### Phase 1: Baseline and authentication

1. **Verify Firebase project and credentials**
   - `firebase login`
   - `firebase projects:list` → confirm dnd-master-73449 is default
   - `gcloud config get-value project` → should match

2. **Baseline the live site**
   - `curl -s https://dnd-master-73449.web.app/api/learning-context 2>&1 | head -50`
   - Expected: Hosting 404 HTML
   - Save output as `before-api-404.txt`

3. **Confirm Firestore/Storage rules match local**
   - `firebase firestore:indexes --project dnd-master-73449 --all --json > firestore-indexes-live.json`
   - `firebase rules:list --project dnd-master-73449` → save rule versions
   - Compare against local `firestore.rules` and `storage.rules`

### Phase 2: Provision test accounts with claims

1. **Verify Firebase Auth for akira@welearn.org**
   - `firebase auth:export users.json --project dnd-master-73449` (or console)
   - Confirm user exists and is NOT disabled
   - Note: UID will be needed for claims

2. **Set signed custom claims for akira@welearn.org**
   - Role: `student`
   - SchoolIds: `["school-wpr"]` (or the real school id in use)
   - ClassIds: `["class-wpr-11a"]` (must match a real class document)
   - ProfileFields: ensure `users/akira-uid` has matching protected fields:
     ```json
     { "role": "student", "schoolIds": ["school-wpr"], "classIds": ["class-wpr-11a"] }
     ```
   - **Do NOT sign claims that don't match real Firestore documents**

3. **Create/verify real documents in Firestore**
   - School: `schools/school-wpr` with at least `{ id, name, timezone }`
   - Class: `schools/school-wpr/classes/class-wpr-11a` with `{ id, name, schoolId, learnerIds }`
   - Confirm akira-uid is in `learnerIds` array

4. **Verify a coach is assigned to akira**
   - Coach user document must have signed `classIds: ["class-wpr-11a"]`
   - Learner document must reference coach (exact field depends on schema; check backend)
   - Test: sign in as coach, roster shows akira

### Phase 3: Create API offerings and class codes

1. **Create program offerings for the school**
   ```json
   POST /api/offerings (admin endpoint)
   {
     "programId": "net-zero-microgrid",
     "title": "District Net-Zero Resilient Microgrid",
     "semester": 1,
     "yearId": "2026-2027",
     "classIds": ["class-wpr-11a"],
     "status": "published"
   }
   ```
   - Repeat for "sustainable-futures" and "project-arachne" if needed
   - Note: offerings must exist before learner enrolment

2. **Issue class codes**
   ```json
   POST /api/schools/{schoolId}/program-offerings/{offeringId}/codes
   { "qty": 5, "expiresAt": "2026-12-31" }
   ```
   - Save codes for testing join flow

3. **Enrol akira in one offering (optional: test via UI instead)**
   ```json
   POST /api/schools/{schoolId}/enrol-offering
   { "offeringId": "offering-nzm", "classCode": "XXXX-YYYY" }
   ```

### Phase 4: Deploy the API and routing

1. **Build and push the Express API**
   - `docker build -t gcr.io/dnd-master-73449/hearisland-api:$(git rev-parse --short HEAD) server/`
   - `docker push gcr.io/dnd-master-73449/hearisland-api:...`
   - (Or use Cloud Build trigger if configured)

2. **Deploy to Cloud Run**
   - ```bash
     gcloud run deploy hearisland-api \
       --image gcr.io/dnd-master-73449/hearisland-api:SHA \
       --project dnd-master-73449 \
       --region us-central1 \
       --set-env-vars NODE_ENV=production,PORT=3001,FRONTEND_URL=https://dnd-master-73449.web.app,FIREBASE_STORAGE_BUCKET=dnd-master-73449.appspot.com,PARENT_INVITE_SECRET=\$PARENT_SECRET \
       --service-account hearisland-api@dnd-master-73449.iam.gserviceaccount.com \
       --allow-unauthenticated
     ```
   - Save the service URL: `https://hearisland-api-xxxxx-uc.a.run.app`
   - **Do NOT set GEMINI_API_KEY** unless the user approves AI drafts; the route must answer 501 gracefully if unset

3. **Update firebase.json rewrites**
   ```json
   "rewrites": [
     {
       "source": "/api/**",
       "run": {
         "serviceId": "hearisland-api",
         "region": "us-central1"
       }
     },
     {
       "source": "**",
       "destination": "/index.html"
     }
   ]
   ```
   - **API rewrite must come before SPA fallback**
   - `firebase deploy --only hosting --project dnd-master-73449`

4. **Prove the routing with curl**
   ```bash
   # No token → 401 JSON
   curl -s https://dnd-master-73449.web.app/api/learning-context | jq .
   
   # Valid token → 200 JSON
   TOKEN=$(gcloud auth print-identity-token)
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://dnd-master-73449.web.app/api/learning-context | jq .
   
   # Unknown route → 404 JSON
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://dnd-master-73449.web.app/api/notaroute | jq .
   
   # / → HTML app shell
   curl -s https://dnd-master-73449.web.app/ | head -c 500
   ```
   - Save all outputs as proof

### Phase 5: Real calendar events (optional, required for "Coming up" to show data)

1. **Create calendar events for the school**
   ```json
   POST /api/schools/{schoolId}/calendar-events
   {
     "title": "Coach check-in",
     "date": "2026-10-06",
     "startTime": "10:00",
     "endTime": "10:30",
     "location": "Learning studio",
     "category": "review"
   }
   ```
   - Create 2-3 events in the next 30 days so akira sees them

2. **Or use the admin import tool**
   - `POST /api/admin/calendar-import`
   - Import the reference calendar from `src/features/school/calendarReference.js` (if approved)

### Phase 6: Smoke test on live

**Sign in as akira@welearn.org**

1. ✓ Sign-in page loads with light theme
2. ✓ Land on "Studio Home" tab (first tab)
3. ✓ Greeting shows first name: "Hi Akira..."
4. ✓ Slider renders with four encouragement slides (auto-advance off on first load)
5. ✓ Next-step card visible with progress ring 0/3
6. ✓ Tick two steps → progress ring updates to 2/3, no badge yet
7. ✓ Tick final step → progress ring 3/3, badge awarded (toast notification)
8. ✓ New goals button appears and opens goal wizard
9. ✓ Calendar "Coming up" shows real events or empty state (not "undefined")
10. ✓ "My learning" → PBL Programs → program chooser shows Enrolled/Available states
11. ✓ "My learning" → Academic Progress → loads without 404
12. ✓ Support request: "Ask my coach" → opens modal → submit → appears in coach panel immediately
13. ✓ Header light/dark toggle → switches theme → reload → theme persists
14. ✓ Browser console: no errors

**Sign in as assigned coach**

1. ✓ Roster shows akira in class-wpr-11a
2. ✓ Evidence review shows akira's submission from above
3. ✓ Support requests panel shows the submitted request
4. ✓ Resolve the request → updates status

**Narrow viewport (390px)**

1. ✓ Studio home: no horizontal scroll
2. ✓ All buttons clickable at mobile size
3. ✓ Slider swipe or arrow keys work
4. ✓ Program chooser grid collapses to 1 column

### Phase 7: Rollback and documentation

1. **Record the release**
   - Hosting release ID: `firebase deploy --only hosting --json | jq .hosting.release.name`
   - Cloud Run revision: `gcloud run revisions list --service=hearisland-api --region=us-central1 --project=dnd-master-73449`
   - Rules versions: `firebase rules:list --project dnd-master-73449`
   - Commit: `4d32122`

2. **Keep rollback ready**
   - Previous Hosting release ID: (record before new deploy)
   - Previous Cloud Run revision: (record before new deploy)
   - Rollback command (Cloud Run): `gcloud run deploy hearisland-api --region=us-central1 --revision=<PREV-REV> --traffic=<PREV-REV>=100`
   - Rollback command (Hosting): `firebase hosting:channels:deploy <PREVIOUS-RELEASE-ID> --only hosting`

3. **Write deployment report**
   - Include: git commit, Hosting release id, Cloud Run revision, curl evidence, smoke test results, rollback procedure
   - Save to `docs/implementation/DEPLOYMENT-REPORT-2026-10-04.md`
   - Do not include secrets or personal data

---

## Blockers to check before going live

- [ ] akira@welearn.org has signed claims (role, schoolIds, classIds) AND a Firestore profile with those fields
- [ ] Class `class-wpr-11a` exists in Firestore and has akira's uid in `learnerIds`
- [ ] School `school-wpr` exists in Firestore
- [ ] A coach user has `classIds: ["class-wpr-11a"]` and is linked to akira as an instructor
- [ ] Offerings are published (status = "published") before enrolment
- [ ] Firebase rules pass tests locally
- [ ] Production bundle has NO console errors on sample navigation
- [ ] Cloud Run service account has Firestore, Auth, and Storage permissions
- [ ] GEMINI_API_KEY is unset (or AI drafts are explicitly approved)
- [ ] Previous Hosting release and Cloud Run revision are saved for rollback

---

## If something fails

1. Check the Cloud Run logs: `gcloud run logs read hearisland-api --region=us-central1 --limit=50 --project=dnd-master-73449`
2. Check Firestore rules: `firebase firestore:get / --project dnd-master-73449` (verify rule syntax)
3. Confirm the learner/coach link: `firebase firestore:get /users/{uid} --project dnd-master-73449`
4. API token validity: `gcloud auth print-identity-token` and decode with `jq -R 'split(".") | .[1] | @base64d | fromjson'`
5. Do NOT widen rules or commit fake data to hide the failure; report exactly what's missing and stop.
