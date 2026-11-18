# Equipment Asset Inventory: plan

Status: plan only. Nothing is built, nothing is deployed, and no production data was touched.
Branch: `feature/asset-inventory-plan` (from `release/pilot-candidate` @ 36a0752). Uncommitted until Mani says go.
Date: 2026-10-29. Pilot: 7 Dec 2026.

Goal: admins can quickly add every piece of school equipment in the WeLearn SPARK admin dashboard and save a photo with each item. Admins can also check items out to a coach or class and back in, and export the list.

---

## 1. Step 1 result: emulator test of image upload plus Firestore record

**Verdict: the approach works end to end on the emulators, but only with a new rule.** Today's `storage.rules` and `firestore.rules` have no path where an admin can write equipment photos or records. Both fall through to default deny, which the baseline run below shows. A temporary rule, used only on a scratch emulator, made all 15 checks pass. **The real rules are Gemini's to write and deploy.**

### How it was run
- The shared review emulator (8088/9099/9199) was **not** used. Other sessions use it, and it loads the repo's rules. Changing those rules would have affected their work.
- Instead, a separate emulator ran outside the repo, from the session scratchpad, with copies of the rules:
  - project `demo-asset-inventory-test`;
  - Firestore 8288, Auth 9299, Storage 9399, hub 4510, logging 4610.
  - The `demo-` prefix means it cannot reach any real Firebase service.
- The test script uses the app's own Firebase web SDK (`firebase@12.19.0`) in Node. The script refuses to run unless the project id starts with `demo-`. It creates two synthetic accounts on the Auth emulator: `admin.test@school.edu`, with claim `role: admin`, and `coach.test@school.edu`, with claim `role: coach`.
- Uploads run **one at a time**, so they cannot trigger the known Storage emulator hang on parallel cross-service checks. The rule also checks the role from the token claim, so it needs no cross-service `firestore.get` at all.
- This was not clicked through the app UI at `?emulators=1`. There is no Inventory screen yet, and the shared emulator does not have the rule. The UI pass belongs to the frontend build (section 2).

```bash
# scratch emulator (run from the scratchpad copy, not the repo)
firebase emulators:start --only firestore,auth,storage --project demo-asset-inventory-test --config firebase.json
# test
node asset-upload-test.cjs
```

The script, the scratch `firebase.json`, the rule diffs and the raw outputs are in the shared notes folder: `side-session-notes/local_d27fc0ea-…/asset-inventory-step1/`.

### Results

| Check | Repo rules today | Temp rule v1 | Temp rule v2 (`resource == null`) |
|---|---|---|---|
| Admin uploads PNG to `assets/{id}/photo.png` | refused (`storage/unauthorized`) | **pass**: 70 bytes, image/png | **pass** |
| `getDownloadURL` returns a URL | n/a | **pass** | **pass** |
| Download URL resolves to identical bytes | n/a | **pass**: HTTP 200, image/png, byte-identical | **pass** |
| Admin writes `assets/{id}` doc (with `photo.path` + `photo.url`) | refused (`permission-denied`) | **pass** | **pass** |
| Admin reads the doc back, fields match, server timestamp set | refused | **pass** | **pass** |
| Wrong type `application/pdf` refused | refused | **pass** | **pass** |
| Wrong type `image/svg+xml` refused (SVG can carry script) | refused | **pass** | **pass** |
| Oversize 6 MB JPEG refused (limit 5 MB) | refused | **pass** | **pass** |
| 4.9 MB JPEG accepted (limit edge) | refused | **pass**: 5,138,022 bytes | **pass** |
| Admin cannot overwrite an existing photo | refused | **FAIL: allowed** | **pass** |
| Coach can read the asset doc | refused | **pass** | **pass** |
| Coach can get the photo URL | n/a | **pass** | **pass** |
| Coach cannot upload a photo | refused | **pass** | **pass** |
| Coach cannot write the asset doc | refused | **pass** | **pass** |
| Signed-out user cannot read the asset doc | refused | **pass** | **pass** |
| **Total** | 7/12 (every allow case failed) | 14/15 | **15/15** |

### Finding for Gemini: `allow update: if false` did not stop an overwrite
With `allow create: if <admin, type, size>` and `allow update: if false`, the Storage emulator **allowed** re-uploading to an existing path. Adding `&& resource == null` to `create` fixed it.

Production behaviour was not tested, because that is off limits. Production may treat the overwrite as `update`, but `resource == null` is harmless either way. The existing `messages/` and `evidence/` rules use the same `create` + `update: false` pattern without the guard. Their comment says files are "never overwritten", so it is worth Gemini re-checking them. That is outside this task, so nothing there was changed.

### Temporary rules used (emulator scratch copy only; NOT for deploy)
```
// storage.rules (inside match /b/{bucket}/o)
function isAssetAdmin() {
  return isAuthenticated() && request.auth.token.get('role', 'student') == 'admin';
}
match /assets/{assetId}/{filename} {
  allow read: if isAuthenticated()
    && request.auth.token.get('role', 'student') in ['admin', 'supervisor', 'coach', 'teacher'];
  allow create: if isAssetAdmin() && resource == null
    && request.resource.contentType.matches('image/(jpeg|png|webp)')
    && request.resource.size <= 5 * 1024 * 1024;
  allow update: if false;
  allow delete: if isAssetAdmin();
}

// firestore.rules (inside match /databases/{database}/documents)
match /assets/{assetId} {
  allow read: if isTeacher() || isAdminOrSupervisor();
  allow create, update, delete: if isAuthenticated() && request.auth.token.get('role', 'student') == 'admin';
}
```
These rules prove the path works. They are not the final design: they have no field validation and no loans rules. The final rules are in the Gemini contract in section 3.

---

## 2. Prompt for Claude (frontend): admin Inventory screen

> Paste this into a new Claude session once Mani has answered the open questions in section 4 and Gemini's rules are on the emulator.

```text
Build the admin "Equipment Inventory" screen for WeLearn SPARK. Repo: /Users/admin/Desktop/HearIsland.
Follow AGENTS.md: work in your own git worktree on feature/asset-inventory-ui (from release/pilot-candidate,
or whatever branch Mani names); never deploy, never touch production, commit only on Mani's written go.
Read docs/ASSET-INVENTORY-PLAN.md first: it holds the data contract (section 3) and Mani's answers (section 4).

Where it lives
- Admin console: src/features/admin/. Add src/features/admin/inventory/ with InventoryList.jsx,
  AssetForm.jsx, AssetDetail.jsx, LoanDialog.jsx, inventoryStore.js (data), imageCompress.js, csv.js.
- Route: #/admin/inventory (list), #/admin/inventory/new, #/admin/inventory/<assetId>.
  Add to parseRoute/hrefFor in src/app/routes.js next to 'materials', and a nav link under
  "Operations" in AdminConsole.jsx (icon: lucide Boxes or Archive).
- Permissions: extend consolePermissions() in src/app/roles.js with viewInventory (admin, supervisor),
  editInventory (admin), loanInventory (per Mani's answer). Hide controls the role cannot use; the rules
  are the real guard.
- Reuse DataTable, usePagedList, Modal, Alert from src/features/admin/ui/ and the admin.css tokens.
  Copy the list/filter pattern of materials/MaterialRequestsList.jsx.

Data
- Direct Firestore + Storage from the client through src/firebase.js (compat), rules-enforced; no server
  endpoint needed. Collection and fields exactly as in section 3 of the plan (assets/{assetId},
  assets/{assetId}/loans/{loanId}, Storage assets/{assetId}/{file}).
- Keep the store a thin module (list/subscribe, create, update, retire, uploadPhoto, checkOut, checkIn)
  so a mock version can back unit tests.
- New asset: generate the id client-side (doc(collection(...)).id), upload the photo to
  assets/{id}/<timestamp>.jpg FIRST (one upload at a time), then write the doc with photo.path and
  photo.url. On doc-write failure, delete the orphan photo. Replacing a photo = upload a new file name,
  update the doc, then delete the old file (paths are never overwritten).
- Check-out / check-in: one runTransaction that writes the loan doc and flips the asset's status and
  currentLoan together; refuse check-out when quantityAvailable is 0.

Screens
- List: search (name, asset tag, serial), filters for category, location, status (available, in_use,
  needs_repair, retired), toggle "show retired" (off by default). Thumbnail column, status chip,
  location, quantity available/total, current holder. Sort by name / updated. Empty and loading states.
- Add / edit form: name*, category* (fixed list + "other"), quantity* (>=1), asset tag, serial number,
  location* (fixed list editable by admin, or free text if Mani says one site), condition (new, good,
  fair, poor), status, purchase date, purchase value + currency (only if Mani keeps value fields),
  notes (500 chars). "Save and add another" keeps category and location for fast bulk entry.
- Photo: two buttons, "Take photo" (<input type="file" accept="image/*" capture="environment">) and
  "Choose file" (accept="image/jpeg,image/png,image/webp,image/heic"). Compress in the browser before
  upload: decode with createImageBitmap (imageOrientation: 'from-image') or an <img>, draw to a canvas
  with the long edge <= 1600 px, export image/jpeg at 0.8 quality; if still > 1.5 MB, step quality down
  to 0.6. This also strips EXIF/GPS. Show a preview, the final size, and a progress bar. Refuse non-images
  with a friendly message before uploading. Rules cap is 5 MB, image/jpeg|png|webp only.
- Detail: big photo, all fields, loan history (newest first), Check out / Check in / Edit / Retire.
- Check-out dialog: borrower type coach or class, pick from the existing roster (users with role coach;
  classes list), quantity, due date (optional), note. Check-in dialog: condition on return, note; if
  condition is poor, offer to set status needs_repair.
- CSV export: exports the current filtered list; columns per section 3; UTF-8 with BOM so Excel shows
  Chinese and Thai correctly; escape quotes, commas and newlines; neutralise formula injection (prefix
  cells starting with = + - @ with a single quote). Filename inventory-YYYY-MM-DD.csv.

Quality bars
- i18n: every string through useLocale().t with keys under 'inventory.*' added to en, zh and th in
  src/app/i18n/messages.js. No hard-coded English. Status/condition/category labels translated; stored
  values stay English codes.
- Light and dark mode via the existing admin.css custom properties; check contrast of status chips in both.
- Tablet first: works at 768x1024 portrait and 1024x768 landscape; tap targets >= 44 px; table collapses
  to cards under 720 px; the form is one column on tablet with the photo buttons at the top.
- Accessibility: labels on every input, focus moves to the dialog and back, errors announced via Alert.

Verify (on the emulators only, ?emulators=1, synthetic data)
- Unit tests: tests/inventory.test.js for csv.js (escaping, BOM, injection), imageCompress sizing maths,
  and status transitions. Add to test:unit in package.json.
- In the browser pane: sign in as an admin test account (emulator custom token), add 3 items with photos
  (one via file, one large photo to prove compression), edit one, check one out to a coach and back in,
  filter, export CSV, switch en/zh/th and light/dark, resize to tablet. Screenshot each.
- Sign in as a coach and a supervisor and confirm what each can and cannot do.
- Run npm run test:unit and npm run build. Report changed files, results and open questions, then end
  with the "To Gemini, from Claude" report.
```

---

## 3. Contract for Gemini (backend): behaviour, not a rules file

Gemini owns `firestore.rules`, `storage.rules`, `firestore.indexes.json`, rules tests and deploys. This section says **what** must be true. How to write it is Gemini's call.

### 3.1 Firestore: `assets/{assetId}`
| Field | Type | Notes |
|---|---|---|
| `name` | string, 1–120 | required |
| `category` | string | one of `electronics, robotics, lab, maker_tools, computers, av, sports, art, furniture, books, other` |
| `quantity` | int ≥ 1 | total owned |
| `quantityAvailable` | int, 0..quantity | kept in step with open loans |
| `assetTag` | string ≤ 40 or null | should be unique per site. Rules can't enforce that, so the client warns |
| `serial` | string ≤ 80 or null | |
| `location` | string ≤ 80 | |
| `siteId` | string | only if Mani says several sites (Q4); else omit |
| `condition` | `new, good, fair, poor` | |
| `status` | `available, in_use, needs_repair, retired` | |
| `purchaseDate` | string `YYYY-MM-DD` or null | |
| `purchaseValue` | number ≥ 0 or null | only if Mani keeps value fields (Q3) |
| `currency` | string (ISO 4217) or null | as above |
| `notes` | string ≤ 500 | |
| `photo` | map `{path, url, contentType, width, height, bytes}` or null | `path` must start with `assets/{assetId}/` |
| `currentLoan` | map `{loanId, borrowerType, borrowerId, borrowerName, dueDate}` or null | |
| `createdBy`, `updatedBy` | uid | must equal `request.auth.uid` on the write |
| `createdAt`, `updatedAt` | timestamp | must equal `request.time` |

Subcollection `assets/{assetId}/loans/{loanId}` (append-only history):
`{ borrowerType: 'coach'|'class', borrowerId, borrowerName, quantity, outAt, outBy, dueDate|null, note, inAt|null, inBy|null, returnCondition|null }`

### 3.2 Who may do what
| Action | admin | supervisor | coach/teacher | student/parent |
|---|---|---|---|---|
| Read assets, loans, photos | yes | yes (read-only) | yes (needed to see what exists), **unless Mani says no** | no |
| Create/edit/retire assets, upload/delete photos | yes | no | no; **Q2** may allow coaches to add items | no |
| Check out / check in | yes | no | **only if Mani agrees (Q1)**; then only to themselves or a class in their `classIds` claim | no |
| Hard-delete an asset | prefer no: use `status: retired`. If allowed, admin only | no | no | no |
| Delete or edit a loan record | no (history is append-only; check-in sets `inAt/inBy/returnCondition` once) | no | no | no |

Rule behaviour required:
- Role comes from the token claim (`request.auth.token.role`), as elsewhere. Avoid cross-service `firestore.get` in Storage rules: it is unnecessary here, and it is what hangs the Storage emulator.
- Field validation on create/update: allowed keys only, types and enums as in 3.1, `0 ≤ quantityAvailable ≤ quantity`, and `photo.path` prefix.
- Check-out and check-in must be **consistent**: a loan create/close and the asset's `quantityAvailable`/`status`/`currentLoan` change happen in one transaction. `getAfter()` on the asset when writing the loan, or the reverse, lets the rules refuse a loan that doesn't match the asset change.

### 3.3 Storage: `assets/{assetId}/{filename}`
- Read: admin, supervisor, coach/teacher (mirror Firestore read).
- Create: admin only (plus coaches if Q2 = yes), `contentType` matches `image/(jpeg|png|webp)`, `size ≤ 5 MB`, **and `resource == null`** (see the overwrite finding in section 1).
- Update: never. Delete: admin.
- No SVG and no HEIC on the server. The client converts HEIC/large photos to JPEG before upload.

### 3.4 Indexes (for the list filters)
Composite indexes on `assets`:
- `status ASC, name ASC`
- `category ASC, name ASC`
- `location ASC, name ASC`
- `category ASC, status ASC, name ASC`
- `updatedAt DESC`

Add `siteId` as the first field of each if several sites (Q4). Search by name, tag or serial is client-side over the loaded list. Fine for a school (< 5,000 items); revisit if larger.

### 3.5 Rules tests (`@firebase/rules-unit-testing`, emulator)
At least:
- admin create/update/read;
- supervisor read and write-denied;
- coach read and write-denied;
- student and signed-out denied;
- bad enum, extra field and negative quantity denied;
- `quantityAvailable > quantity` denied;
- `photo.path` for another asset denied;
- loan create without the matching asset update denied;
- loan edit after close denied, and loan delete denied.

Storage tests:
- jpeg/png/webp OK;
- pdf, svg and gif denied;
- size 5 MB + 1 byte denied;
- overwrite denied;
- coach upload denied;
- delete by admin OK.

The Node script from step 1 (`asset-upload-test.cjs` in the notes folder) can be reused as a smoke test.

### 3.6 Deploy steps (each needs Mani's written "go" for that exact step; never a bare `firebase deploy`)
1. Rules + tests merged on a backend branch, reviewed. Rules tests green on the emulator.
2. `firebase deploy --only firestore:indexes`: wait until the indexes are built.
3. `firebase deploy --only firestore:rules`.
4. `firebase deploy --only storage`.
5. Frontend hosting deploy (after the pilot deploy-freeze rules allow it).
6. Post-deploy smoke test with a **test admin account Mani names**: no production seeding. Admins enter real items themselves.

---

## 4. Open questions for Mani

1. **Who may check items out?** Admins only, or coaches too, and if so to themselves only or also to their classes?
2. **Can a coach add items?** For example, the maker-lab coach logging new kits. Or is adding admin-only?
3. **Value fields:** keep purchase date, purchase value and currency? Value data is sensitive-ish and makes the CSV a finance document. If kept, should supervisors see it?
4. **One school or several sites?** Several sites adds `siteId` to every item, index and filter, and to the rules if site admins should only see their site.
5. Smaller questions (defaults in brackets):
   - Do coaches need to read the inventory at all? [yes, read-only]
   - Should loans have due dates and an overdue badge? [optional due date, badge on]
   - Retire instead of delete? [retire only]
   - Is a 5 MB / JPEG-PNG-WebP photo limit OK? [yes]

---

## 5. Not done / not verified
- No UI built and no click-through in the app. Step 1 was SDK-level against a scratch emulator.
- Production Storage behaviour for overwrites was not tested (not allowed).
- Nothing committed or pushed. Repo rules files are unchanged.
