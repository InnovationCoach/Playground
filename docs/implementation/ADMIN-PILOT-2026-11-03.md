# Admin pilot — 3 November 2026

Implemented locally. Deployment has not been performed.

## Pilot scope

- Admin landing dashboard: staff/student attendance totals for today, pending coach leave count, inventory/low stock totals.
- Staff attendance and student attendance: choose a date, search names, mark present/absent/late/excused/unmarked, add a note, and record a required change reason. Every change retains before/after values, the administrator, and timestamp.
- Coach dashboard: expandable day-off request panel, date range and reason, request history, administrator response. Admin landing and request screens refresh requests every 30 seconds while open. Requests are saved in the shared service; they are not email or push notifications.
- Admin leave review: approve/reject a pending request, optional response; stale reviews are rejected and overlapping pending/approved requests cannot be submitted. Approved leave does not silently overwrite attendance.
- Inventory: add items with location, opening stock and minimum stock; search items, view low stock, record positive/negative adjustments with a required reason, and inspect movement history. Negative stock is rejected.
- Student/staff account tools and settings remain available. Primary resources, parents, billing, purchase requests, and school learning/calendar are removed from the pilot admin navigation. Existing billing/materials/learning URLs show the pilot home. Source modules and existing records are retained.

## Access and persistence

New workflows always call the authenticated live API (`/api/pilot`), including when legacy account tools use sample mode. Failures are shown explicitly. No sample records are seeded by these endpoints.

Verified token roles control access: administrators can edit; supervisors can view; teacher/coach claims can submit and view their own leave. Students, parents, and profile-only forged administrators are denied. All reads/writes are scoped to the caller's organization. New `pilotAttendance`, `pilotLeave`, `pilotLeaveLocks`, and `pilotInventory` collections and their history subcollections are server-only under the existing default-deny Firestore rules. Attendance is a daily register; missing records remain unmarked, with no assumed absences or scheduled workdays.

School dates use Asia/Bangkok. Record timestamps display in the viewer's local time. Attendance roster uses real organization user documents. Coaches need a signed teacher/coach claim for the new leave service.

The existing materials component was purchase-request management, not stock inventory, so stock tracking has a separate collection. Existing purchase-request data is not migrated or treated as stock.

## Pilot checks

1. Sign in as admin and open `#/admin`. Check totals against the real staff/student roster.
2. Open each attendance register; choose a date, edit a person with a correction reason, refresh, and inspect History.
3. Sign in as a coach, expand Day-off requests, submit a range/reason. Verify it appears in admin requests within 30 seconds, approve/reject it, and verify the response on the coach dashboard.
4. Add an inventory item, adjust stock up/down with reasons, inspect History, and confirm low stock appears at/below its minimum.
5. Use a supervisor account to confirm editing controls are unavailable.

## Verification

- Five API integration tests against local Auth/Firestore services: authorization, cross-organization isolation, persistent attendance/correction history, coach-to-admin leave review and duplicate prevention, inventory movements/history/negative stock.
- Six component tests: role-appropriate controls, required correction reason, service errors, periodic leave refresh, coach responses, low-stock display and pilot navigation cards.
- Existing Growth Hub phase 0 tests run alongside the component suite; route fallback expectation updated for the new pilot landing.
- Production build passes.
- Desktop/mobile visual fixture: `npx vite --config tests/pilot-preview/vite.config.js --host 127.0.0.1 --port 5188`, then open `/tests/pilot-preview/`. Fixtures are explicitly marked sample data and reject writes; real saving is covered by API integration tests. Screenshots are in `docs/implementation/admin-pilot/`.

## Before live pilot

Deploy both frontend and API changes through the existing hosting process, verify API routing/CORS for the target environment, and perform the above checks with actual pilot accounts. No live data or deployment was changed in this task.
