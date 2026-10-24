# Parent engagement — contract (for Gemini 3.8, with Mani's decisions marked)

> **Status:** proposed. Nothing here is built yet.
> **Scope:** three additions to the parent dashboard (`#/parent`):
> 1. Parents send messages to their child's coaches.
> 2. A bell icon with a notification list.
> 3. Parents see coach feedback, the child's PBL project, and evidence.
>
> **Builds on:** `docs/PARENT-DASHBOARD-CONTRACT.md` (progress endpoint), `docs/data-contract.md` (enrolments, phaseProgress, conversations).
> **Owners:** Gemini owns routes, rules, indexes and scripts. UX/UI owns screens and the mock service.
> **Permissions:** this changes who can read and write messages. AGENTS.md requires Mani's approval before any permission change ships.

## 0. Decisions needed before build

| # | Question | Recommended | Who decides |
|---|---|---|---|
| D1 | Can a parent start a conversation with a coach, or only reply? | Parent can start, one thread per child per coach | Mani |
| D2 | Can a parent message a coach about a child under 13 before consent is recorded? | No. Block until consent is recorded | Mani |
| D3 | Does a parent see the text of evidence (the child's own writing), or only titles? | Titles and coach feedback only in v1. Full evidence only when the child chooses to share it (D4) | Mani |
| D4 | Can a learner choose to share a piece of evidence with parents? | Yes, a per-item "Share with my parents" toggle, default off | Mani, with a learner-facing copy review |
| D5 | How long are parent-coach messages kept, and who can read them? | Kept with the class record. Coach and admin can read. Parents and learners see only their own thread | Mani |
| D6 | Are parent messages checked for safeguarding? | Flag-only: keyword and link flags go to the admin queue. No automatic blocking in v1 | Mani |

## 1. Parent → coach messaging

### 1.1 Who can do what

| Action | Parent | Coach | Learner | Admin |
|---|---|---|---|---|
| Start a thread about a linked child | Yes, after D1 | No (coach replies) | No | No |
| Reply in a thread | Yes | Yes | No | No |
| Read a thread | Own threads only | Threads for their classes | Never | Yes |
| Delete a message | No | No | No | Only with an audit entry |

Learners never see parent threads, and parents never see a child's messages to coaches.

### 1.2 Data

Reuse the existing `conversations/{convId}` collection with one new field:

```ts
conversations/{convId} = {
  // existing fields…
  kind: 'class' | 'parent-coach',          // new
  childUid?: string,                       // parent-coach only
  parentUid?: string,                      // parent-coach only
  participantIds: string[],                // includes parentUid, coachUid, never childUid
  coachUid?: string
}
```

Messages stay in `conversations/{convId}/messages/{msgId}` as now. Add:
- `senderRole: 'parent' | 'coach'`, so the UI can label senders without looking them up.
- Text only in v1. No attachments and no voice notes for parents.
- Maximum 1,000 characters per message.

### 1.3 Routes

- `POST /api/parent/threads` — body `{ childUid, coachUid, text }`. Creates the thread and the first message. Checks an **active** `parentLinks` record and that the coach teaches the child's class. Otherwise `404 NOT_FOUND`, never `403`, so it doesn't reveal whether the child exists (same rule as the progress endpoint).
- `POST /api/parent/threads/:convId/messages` — body `{ text }`. Parent must be a participant.
- `GET /api/parent/threads?childUid=…` — the parent's threads for one child.
- Coaches reuse the existing conversation routes for replies.

### 1.4 Rules

- Parents can read a conversation only if their uid is in `participantIds`.
- Parents can create a `parent-coach` conversation only through the route above, not directly. The route checks the link, so the rule must not allow direct creation by parents.
- The current rule "only coaches can create a conversation" must be widened to allow this case only. Gemini to write the exact rule; Mani approves it (D1).

### 1.5 Safeguarding (D6)

- Each message is checked on send for keywords and links. A match sets `flagged: true` and a `flagReasons` list. The message is still delivered.
- Flagged messages appear in the admin queue. No automatic blocking in v1.

## 2. Notifications (bell icon)

### 2.1 Data

```ts
users/{uid}/notifications/{notifId} = {
  type: 'message' | 'feedback' | 'evidence_review' | 'enrolment' | 'consent',
  title: string,                 // max 80 characters, no personal data
  body?: string,                 // max 160 characters, no evidence text, no feedback text
  link: string,                  // in-app route only, e.g. '#/parent/child/<uid>?tab=feedback'
  childUid?: string,             // parents only: which child it concerns
  createdAt: number,
  readAt: number | null
}
```

Rules:
- A user reads only their own notifications and can set `readAt`. Nobody else writes them except the server.
- Notifications carry **no sensitive content**. "New message from Coach Rivera" is fine. The message text is not.
- Keep 90 days, then delete (scheduled job).

### 2.2 Routes

- `GET /api/notifications?limit=20&cursor=…` — newest first, returns `{ items, unreadCount, nextCursor }`.
- `POST /api/notifications/:id/read`, and `POST /api/notifications/read-all`.
- The unread count may be read from a counter document `users/{uid}/meta/notifications` so the bell doesn't need a full query on every page.

### 2.3 Which events create a notification for a parent

| Event | Parent notified | Notes |
|---|---|---|
| Coach replies in a parent thread | Yes | Title only |
| Coach posts feedback on a linked child's phase | Yes | "New feedback on Define" |
| Child shares evidence (D4) | Yes | Only if shared |
| Child's consent status changes | Yes | Consent gate |

Push or email delivery is out of scope for v1.

## 3. Coach feedback, PBL project and evidence for parents

### 3.1 What parents see for a linked child

| Item | Source | Shown to parents |
|---|---|---|
| Coach feedback per phase | `enrolments/{id}/phaseProgress/{phaseId}.coachFeedback` (text, rating, coach name, date) | Yes. Coach-authored, so shown in full |
| PBL project: current phase, task progress, readiness | `activityProgress/pbl-<termId>` (existing progress contract) | Yes |
| Evidence titles, kinds and dates | `pblProject.evidence` | Yes |
| Evidence text, reflections, AI logs | Child's own writing | No (D3) |
| Evidence files or links | Child's submission | Only when the child shares it (D4) |
| Coach rating on evidence | `coachFeedback.rating` | Yes, as a number, with the rating scale shown |

### 3.2 Route

Extend `GET /api/parent/children/:uid/progress` (see `PARENT-DASHBOARD-CONTRACT.md`):

```ts
pbl: {
  // existing fields…
  coachFeedback: Array<{
    phaseId: string,
    text: string,              // max 1,000 characters, coach-authored
    rating?: number,
    coachName: string,         // display name, no email
    at: number
  }>,
  sharedEvidence: Array<{ title: string, kindLabel: string, link?: string, sharedAt: number }>
}
```

- `coachFeedback` is sorted newest first and limited to the latest 20 items.
- `sharedEvidence` contains only items the child has shared (D4). Empty by default.
- The same privacy test as today must still pass: no mood check-ins, notes, evidence text or AI logs in the response.

### 3.3 Learner side (for the copy review)

- Learners see a line on their dashboard: "Your parents can see your coach feedback and your project progress. You choose which evidence to share."
- Each evidence item has a "Share with my parents" toggle, default off.

## 4. Build order

1. **Mani:** decide D1–D6.
2. **Gemini:** rules change for `parent-coach` threads, notifications rules, the parent message routes, the notification writers, extended progress response, tests:
   - a parent cannot read a thread they are not in;
   - a parent cannot start a thread for an unlinked child (returns 404);
   - the privacy test still passes;
   - a child under 13 without consent gets no thread (if D2 says so).
3. **UX/UI (me):** parent message composer on the child page, bell icon with unread count and list, feedback and project tabs. Built on the mock first, then switched to the live endpoints.
4. **Integration tests on the emulator**, then a preview build. No production deploy without Mani's written go.

## 5. What is not in v1

- Attachments, voice notes or video from parents.
- Push notifications and email.
- Parents seeing evidence text or AI conversations.
- Group threads with several parents.
