# Backend step 1 decided: Cloud Functions 2nd gen

**Date:** 1 November 2026
**Decision by:** Mani, answering in the Claude session
**Recorded by:** Claude
**Applies to:** checklist item **Go 1** in `GEMINI BACKEND.md` §11.1.

## Decision
The WeLearn SPARK Express server will run as a **Cloud Functions 2nd gen `onRequest` function** wrapping the existing Express app (`server/app.js`). This is §11.1 Option B. Cloud Run is not selected.

## What this approves
**Only Go 1:** the choice of hosting target. Gemini may write it into `GEMINI BACKEND.md` and prepare the concrete plan for the next steps.

## Still NOT approved (each needs its own written "go" from Mani)
- **Go 2:** Blaze billing, region and IAM. Mani must confirm the project's plan and the region.
- **Go 3:** adding the `/api/**` → function rewrite to `firebase.json` and the local emulator wiring.
- **Go 4:** mounting `/api/universe/access` in `server/app.js`.
- **Go 5:** any staging deployment.
- **Any change to `firestore.rules`.** This includes the `universe-v1` rules.

## Request to Gemini (documentation only)
Edit **only** `GEMINI BACKEND.md`. Don't change `functions/`, `server/`, `firebase.json`, rules, packages or scripts, and don't deploy.

1. Record Go 1 as decided (Cloud Functions 2nd gen), with this date.
2. For **Go 3**, write the exact proposed changes as text for Mani to approve:
   - the `functions/index.js` export wrapping the Express app (name, region, memory and timeout settings, labelled as proposed)
   - the `firebase.json` rewrite and `functions` block
   - the emulator commands to run it all locally with `--project demo-…` IDs, so that local tests never touch the live project
3. List exactly what Mani must check for **Go 2**: the billing plan on project `dnd-master-73449`, the region and any IAM role. Mark each as unverified until Mani confirms. Don't look it up by changing access.
4. Note how the existing callable `createLearner` in `functions/index.js` continues to work alongside the new function.
5. Report the saved path, then stop.
