# Second correction request for Gemini: `GEMINI BACKEND.md` §11 proposals

**Date:** 1 November 2026
**Prepared by:** Claude, reviewing Gemini's update against source at `codex/my-universe-prototype`
**Scope:** documentation only. Edit **only** `GEMINI BACKEND.md`. Don't change `firestore.rules`, tests or configuration.

## Accepted, with thanks
- **All 15 first-round corrections are applied correctly.**
- **Your storage-rules row is more accurate than my request.** `storage.rules` matches `/community`, `/messages`, `/solarCar` and `/canva-exports`. My correction #5 said "only `/community`", which was wrong.
- **The catalog contract matches `cosmosFixture.js` field for field.** The `facts` objects plus string normaliser, the version pinning and the asset hosting plan are all accepted in direction.

## Please fix (re-check each against source first)
1. **`request.resource.size()` doesn't exist in Firestore security rules.**
   - Rules can't measure total document size. `firestore.rules` never uses it, and as written the 64 KB cap does nothing.
   - Your test 9 (a 65 KB `locationId`) would be **accepted**, so the test would fail.
   - Replace this with per-field bounds: every ID string `is string && size() <= 64`, and each list `size() <= 100`.
   - State that rules can't check the type of each list element, and say where that check happens instead (client validation, or server cleanup later).
2. **`activeDestination` fields are read directly.** With `hasOnly([...])` a key may be absent, and reading a missing field is an error, so the write is **denied**. For example, a learner at galaxy level has no `planetId`.
   - Either use `.get('galaxyId', null)` and the same for each field,
   - or require all five keys to be present (`hasAll`), with `null` for unused levels.
   - Add a test for a save made at galaxy level.
3. **Test project ID.** The suite uses `dnd-master-73449-test`, which is derived from the live project name. The repo convention is `demo-hearisland-rules` (`tests/firestore-rules.test.js:37`), and the `demo-` prefix guarantees the tests only ever touch the emulator. Use it.
4. **`revision` isn't enforced as increasing.** §3.3 calls it "monotonically increasing", but the rule only checks `>= 0`. Either add an update rule `request.resource.data.revision > resource.data.revision` (and decide how `arrayUnion` merges interact with it), or drop the claim.
5. **Preferences don't match the explorer.**
   - The explorer's setting is a detail level, `'standard' | 'high'`.
   - Calm comes from the dashboard's existing preferences and isn't stored here.
   - Replace `calmDrift` and `preferredScale: compact|standard|expanded` with `detail: 'standard' | 'high'`, or remove `preferences` until there's a stored setting.
6. **One source for requirement text.** The §2.3 access response returns its own `requirementText` ("Requires verified competency in Atmospheric Sulfur Cycles"), which differs from the catalog's. The catalog should own requirement text. The server should return only `status`, the rule ID and verification state.
7. **Out-of-date statements.**
   - §12.1 #2 says the 3D packages aren't installed. They were installed for Stage B (`UNIVERSE.md` §13.6).
   - §12.2 still lists the device spike as a future stage. It's built, and it measured 60 fps on this Mac (§13.9).
8. **Unsupported numbers.**
   - "Proposed budgets to ensure 60 fps": a size budget can't guarantee a frame rate. Reword this.
   - The Cloud Functions cold-start figure "1.5–3s": label it unverified, or remove it.

When you finish:
- Add a dated "Corrections round 2" note to §13.
- Confirm documentation-only changes.
- Report the saved path, then stop.
