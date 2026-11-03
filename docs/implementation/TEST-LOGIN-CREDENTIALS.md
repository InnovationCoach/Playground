# HearIsland Test Account Login Information

**Password for all accounts:** `review123`  
**Local testing URL:** http://127.0.0.1:5173/?emulators=1  
**Live testing URL:** https://dnd-master-73449.web.app (after deployment)

---

## STUDENT ACCOUNTS (W2e / Year 9-12)

| Email | Name | Year | Class | Access | Status |
|-------|------|------|-------|--------|--------|
| **mia@school.edu** | Mia Chen | 9 | Climate Science | Studio Home, PBL Programs, Goals, Calendar | ✓ Active |
| **leo@school.edu** | Leo Martins | 9 | Climate Science | Studio Home, PBL Programs, Goals, Calendar | ✓ Active |
| **noor@school.edu** | Noor Haddad | 9 | Climate Science | Studio Home, PBL Programs, Goals, Calendar | ✓ Active |
| **tom@school.edu** | Tom Becker | 12 | Engineering | Studio Home, PBL Programs, Goals, Calendar | ✓ Active |
| **ines@school.edu** | Inès Dupont | 12 | Engineering | Studio Home, PBL Programs, Goals, Calendar | ✓ Active |

**Testing Tips for Students:**
- All students can see the W2e Studio Home dashboard (hero, slider, next-step, program chooser)
- Try checking task steps and submitting evidence
- Test the theme toggle (light/dark) in the header
- Send support requests to assigned coaches
- Join programs with class codes (if testing enrolment flow)

---

## COACH ACCOUNTS

| Email | Name | Assigned Classes | Access | Status |
|-------|------|-------------------|--------|--------|
| **coach.rivera@school.edu** | Sam Rivera | Year 9 Climate | Coach Dashboard, Roster, Evidence Review, Material Requests | ✓ Active |
| **coach.okafor@school.edu** | Ada Okafor | Year 12 Engineering | Coach Dashboard, Roster, Evidence Review, Material Requests | ✓ Active |

**Testing Tips for Coaches:**
- View assigned learners in roster (e.g., Sam sees Mia, Leo, Noor)
- Review learner submissions and goals
- Process support requests from students
- Manage material requisitions
- Check academic progress and observations

---

## ADMIN ACCOUNT

| Email | Name | Access | Status |
|-------|------|--------|--------|
| **admin.test@school.edu** | Admin Test | All - Users, Staff, Parents, Materials, Offerings, Calendar | ✓ Active |

**Testing Tips for Admins:**
- View and manage all student/staff/parent records
- Create and manage program offerings
- Issue and manage class codes
- Import/manage school calendar
- View material requests from coaches
- System-wide reporting and settings

---

## STAFF ACCOUNTS

| Email | Name | Role | Access | Status |
|-------|------|------|--------|--------|
| **supervisor.test@school.edu** | Supervisor Test | Supervisor | Staff Dashboard, Reporting, Program Management | ✓ Active |

---

## PARENT ACCOUNT

| Email | Name | Linked Child | Access | Status |
|-------|------|--------------|--------|--------|
| **parent.test@school.edu** | Parent Test | Mia Chen | Parent Portal (child's progress, upcoming events, coach contact) | ✓ Active |

**Testing Tips for Parents:**
- View assigned child's learning progress
- See upcoming calendar events
- Contact coach information
- View goals and activity summaries

---

## PRIMARY SCHOOL ACCOUNT (Junior Explorers / Year 3)

| Email | Name | Year | Status | Note |
|-------|------|------|--------|------|
| **primary.student@school.edu** | Penny Primary | 3 | Pending | Consent required - different interface for younger learners |

---

## SPECIAL TEST ACCOUNTS

| Email | Name | Status | Note |
|-------|------|--------|------|
| **suspended.student@school.edu** | Sam Suspended | Disabled | Tests suspended account behavior (login should fail) |

---

## Dashboard Access by Role

### Student W2e Dashboard Features
- ✓ Studio Home (hero, slider, next-step, program chooser, calendar, coach access)
- ✓ PBL Programs (with enrolment and class-code join)
- ✓ Learning Goals (with badges and cycles)
- ✓ Academic Progress
- ✓ School Calendar
- ✓ Support Requests
- ✓ Display Preferences (light/dark, text size, calm colors)

### Coach Dashboard Features
- ✓ Assigned Learner Roster
- ✓ Evidence Review (submissions from students)
- ✓ Learning Goals (view learner goals and progress)
- ✓ Academic Observations
- ✓ Material Requests (from requisition workflow)
- ✓ Support Request Inbox
- ✓ Calendar (class events)

### Admin Console Features
- ✓ Students List
- ✓ Staff List
- ✓ Parents List
- ✓ Program Offerings Management
- ✓ Class Codes (create, revoke, track)
- ✓ Materials Portal
- ✓ Calendar Management (create, import reference)
- ✓ System Settings

### Parent Portal Features
- ✓ Assigned Children Overview
- ✓ Child's Learning Progress
- ✓ Upcoming Events (from child's calendar)
- ✓ Coach Contact Info
- ✓ Recent Activity Summary

---

## Testing Workflow Example

**1. Student Flow (Mia)**
```
Sign in: mia@school.edu / review123
→ Home tab (Studio Home dashboard)
→ Check task steps → progress ring updates
→ Complete all steps → badge awarded
→ "My learning" → PBL Programs → view enrolled offerings
→ Ask my coach → support request sent
```

**2. Coach Flow (Sam Rivera)**
```
Sign in: coach.rivera@school.edu / review123
→ Coach Dashboard
→ Roster shows Mia, Leo, Noor
→ Support Requests shows Mia's request
→ Evidence Review shows learner submissions
→ Material Requests shows coach requisitions
```

**3. Admin Flow (Admin Test)**
```
Sign in: admin.test@school.edu / review123
→ Students list → find Mia
→ Staff management
→ Program Offerings → view/edit 3 programs
→ Class Codes → manage enrolment codes
→ Calendar → view/import events
```

---

## Quick Test Scenarios

### Scenario: Goal Completion & Badge Award
1. Sign in as **mia@school.edu**
2. Go to Home → Studio Home
3. Scroll to "My next step" card
4. Check all 3 task steps (1, 2, 3)
5. Progress ring updates to 3/3
6. Badge awarded → toast notification
7. "Start new goals" button appears

### Scenario: Support Request
1. Sign in as **mia@school.edu**
2. Click "Ask my coach"
3. Select request type (e.g., "Help me find the first step")
4. Add optional note
5. Submit
6. (In another browser) Sign in as **coach.rivera@school.edu**
7. Go to Support Requests
8. View Mia's request, mark as resolved

### Scenario: Program Enrolment
1. Sign in as **mia@school.edu**
2. Go to Home → PBL Programs tab
3. View 3 programs (Sustainable Futures enrolled, others available)
4. Click "Join program" on an available one
5. Enter class code (ask admin for a valid code)
6. Confirm → program added to learner's offerings

### Scenario: Theme Toggle
1. Sign in as **mia@school.edu**
2. Click sun/moon icon in header
3. Theme switches to dark
4. Reload page → dark theme persists (preference saved)
5. Click toggle again → switches back to light
6. Reload page → light theme persists

---

## Notes for Deployment Testing

When deployed to live (dnd-master-73449.web.app):
- Same accounts will be provisioned with signed Firebase claims
- New test account for akira@welearn.org will be added
- Real calendar events will populate "Coming up" rail
- Support requests will persist to Firestore (not emulator memory)
- Theme preferences save to users/{uid}.themePreference
- Goals and badges save to users/{uid}.goals, goalBadges, and mirrored subcollections

---

## Troubleshooting

**"Login failed" error:**
- Verify account exists in Firebase emulator (`firebase emulators:start`)
- Check password is exactly `review123`
- Emulator auth host should be http://127.0.0.1:9099

**"Service unavailable" on school routes:**
- Confirm dev server is running: `npm run emulators` + `npm run server:dev:emulator` + Vite dev
- Check API base is set correctly for emulator mode
- Fallback data should display if API is unreachable (dev/emulator mode only)

**"Not found" on program/calendar:**
- Firestore seed script must complete before sign-in
- Run `npm run seed:emulator` to populate test data
- Check seed output for any errors

**Theme toggle not persisting:**
- Ensure user is signed in (preference saves to Firestore profile)
- Reload → theme should match saved preference
- Check browser DevTools: Look for users/{uid}.themePreference in Firestore

