# Parent engagement — contract v2 (for Gemini 3.8)

> **Status:** decisions taken, not yet built.
> **Supersedes:** v1 of this file (commit 2fc6187), except where noted.
> **Builds on:** `docs/PARENT-DASHBOARD-CONTRACT.md`, `docs/data-contract.md`.
> **Owners:** Gemini owns routes, rules, indexes and scripts. UX/UI owns screens and the mock service.
> **Permissions:** the profile and evidence changes alter who can read child data. Mani approves before deploy (AGENTS.md).

## 0. Decisions

| # | Decision | Source |
|---|---|---|
| D1 | Parents may start a thread, one per child per coach. **Superseded by D7** (messaging moves to Teams). | Mani |
| D2 | **Superseded 2026-10-26.** No consent gate in the platform. WeLearn keeps physical consent and staff enrol learners. The earlier rule (consent under 15) is withdrawn. See §5. | Mani |
| D3 | Parents see evidence text, for transparency, with the exclusions in §4.1. | Mani |
| D4 | A learner can choose to share an evidence item with parents, default off. | Mani |
| D5 | Messages, threads and notification retention: agreed as drafted. | Mani |
| D6 | Safeguarding: flag only, no automatic blocking. | Mani |
| D7 | **Parent–coach messages do not live in WeLearn.** Parents use Microsoft Teams for messages. WeLearn shows a "Message the coach on Teams" link. | Mani |
| D9 | GPA is on a 4.0 scale. | School (confirmed by Mani) |
| D10 | Reflect is the final week (week 12). Learners reflect on how their Showcase went. Showcase is week 11. | Mani |
| D11 | Cohorts: the three level cohorts replace the old age bands. W2E and WPR move to a separate pathway field (see §6). | Proposed, Mani to confirm |
| D8 | The parent sees the child's **school ID, age, cohort, mentor, grades, GPA, badges, academic progress and a school summary.** Coaches maintain these in a student profile. | Mani |

## 1. Teams link (replaces the messaging design)

- No message store, routes or rules for parent–coach chat in WeLearn.
- The student profile holds the mentor's Teams contact link, set by the coach or admin. The parent page shows a button that opens it in a new tab.
- The link is a plain URL the coach provides. WeLearn does not embed Teams (Teams blocks embedding; it sends `X-Frame-Options: SAMEORIGIN`).
- Any tenant-level Teams policy is the school's to set.

## 2. Student profile (new)

### 2.1 Data

```ts
studentProfiles/{learnerUid} = {
  learnerUid: string,
  schoolStudentId: string,            // the school's ID number, max 32 characters
  dateOfBirth: string,                // YYYY-MM-DD, stored; the UI shows only the age
  cohort: 'primary' | 'lower-secondary' | 'higher-secondary',
  mentorUid: string,                  // a coach account
  mentorTeamsUrl?: string,            // https only, set by the mentor or admin
  academicProgress: {                 // set manually by a coach, never calculated
    percent: number,                  // 0–100, integer
    note?: string,                    // max 200 characters
    setBy: string,                    // coach uid
    setAt: number
  },
  grades: Array<{
    id: string,
    subject: string,                  // max 60 characters
    term: string,                     // e.g. "Term 3 2026"
    grade: string,                    // as the school reports it, max 10 characters
    comment?: string,                 // max 240 characters
    enteredBy: string, enteredAt: number
  }>,
  gpa?: { value: number, scale: 4.0, term: string, enteredBy: string, enteredAt: number },   // 4.0 scale, D9
  schoolSummary?: { text: string, updatedBy: string, updatedAt: number },   // max 500 characters
  updatedAt: number
}
```

- `badges` are not stored here. They come from the existing badge records, so they are never out of step with the platform.
- `age` is computed on read from `dateOfBirth`. It is never stored.

### 2.2 Who reads and writes

| Action | Learner | Parent (linked) | Mentor coach | Other coach | Admin |
|---|---|---|---|---|---|
| Read profile | Yes | Yes | Yes | Only their classes | Yes |
| Write academic progress, grades, GPA, summary | No | No | Yes | No | Yes |
| Write school ID, DOB, cohort, mentor | No | No | No | No | Yes |
| Write Teams link | No | No | Yes | No | Yes |

- Learners and parents never write to the profile.
- The school ID and date of birth are admin-only. The mentor can view them.
- Every write adds an `auditLogs` entry with the old and new value of the changed field.

### 2.3 Routes

- `GET /api/student-profiles/:learnerUid` — caller must pass the read rule above. A parent without an active link gets `404 NOT_FOUND`.
- `PATCH /api/student-profiles/:learnerUid` — coach or admin only, with the field list in §2.2. Body validated per field.
- `GET /api/parent/children/:uid/progress` — adds a `profile` block (see §4).

### 2.4 Academic progress (manual)

- The coach sets a percent and an optional note. The system never fills this in from activity.
- The progress bar shows the percent, the note, "Set by <coach name> on <date>", and "Last updated" so parents can tell how fresh it is.
- If the coach has never set it, the bar is hidden, not shown as 0%.

## 3. Bell notifications (unchanged from v1, reduced)

- `users/{uid}/notifications/{id}` as in v1 §2.1.
- Event types now: `feedback` (coach feedback posted), `evidence_review`, `profile_updated` (grades, GPA or summary changed).
- No `message` type, since messages are on Teams.
- The bell shows an unread count. Titles contain no grades and no feedback text.

## 4. What a linked parent sees

Extends `GET /api/parent/children/:uid/progress`:

```ts
profile: {
  schoolStudentId: string,
  age: number,
  cohort: string,               // shown as the cohort name
  mentor: { name: string, teamsUrl?: string },
  academicProgress: { percent: number, note?: string, setBy: string, setAt: number } | null,
  grades: Array<{ subject, term, grade, comment? }>,
  gpa: { value, scale: 4.0, term } | null,
  badges: Array<{ id, title, earnedAt }>,
  schoolSummary: { text, updatedAt } | null
}
```

- `setBy` is the coach's display name, never an email.
- The response still excludes mood check-ins, notes, AI logs, strengths and supports from goal setting.
- Under-13 learners: `profile` is shown as normal. There is no consent gate (D2).

### 4.1 Evidence (D3, provisional)

Under D3, `pbl.evidence` includes the **text** of each item. Still excluded: mood check-ins, the child's private notes, AI conversation logs, and goal strengths and supports. §5 decides whether this is right.

## 5. Consent (D2)

- **Decision (2026-10-26, confirmed by Mani in writing):** no consent gate. Physical consent is kept at WeLearn, and staff enrol learners. Nothing in the platform checks a consent status, and no consent field is built.
- **Replaces:** the earlier rule that parental consent is required for every learner under 15 (Mani, deferred until real learners).
- **Still in force:** the safeguarding rules that do not depend on consent, such as no speech-to-text or voice recording for under-13 learners.
- Under-15 evidence text (D3): no consent-based restriction. The other D3 rules still apply.

## 6. Cohort structure (D11, proposed)

- **Level cohorts (replace the old age bands):** `primary` (6–11), `lower-secondary` (12–14), `higher-secondary` (15–18). These set the reading level and the safety guidance.
- **Pathway (new field, separate from cohort):** `pathway` on each learner and class, with values for the W2E and WPR programmes. A learner keeps one level cohort and may also have a pathway. This stops "W2E (secondary)" from implying an age range.
- **Why:** W2E spans both secondary cohorts and WPR is primary, so using them as age cohorts would repeat the problem this change fixes.
- **Migration:** the `cohorts` collection keeps its documents for now, as pathway records. Gemini to propose the rename; no live write until Mani approves.

## 6a. Reflect and Showcase (D10)

- Reflect: week 12, the last week. Learners reflect on how their Showcase went.
- Showcase: week 11, so `showcase: weeks [11, 11]` and `reflect: weeks [12, 12]`. The previous Showcase range [11, 12] overlapped Reflect.
- Gemini to update `frameworks/welearn-dt` to these values and note the change in the changelog.

## 6. Build order

1. **Mani:** answer §5 and approve the rules change for `studentProfiles` and the evidence visibility.
2. **Gemini:** collection, rules and indexes; routes; audit entries; profile block in the progress response; tests:
   - a parent without an active link gets 404 on the profile;
   - a coach outside the class cannot read or write the profile;
   - a learner cannot write the profile;
   - the privacy test still passes, with evidence text in the response only as D3 allows;
3. **UX/UI (me):** the profile card for parents, the coach profile editor with the progress bar and grade entry, the Teams button, the bell. Built on the mock first.
4. **Integration** on the emulator, then a preview build. No production deploy without Mani's written go.

## 7. Not in this version

- Messaging inside WeLearn (moved to Teams, D7).
- Edmentum time and grades (parked by Mani).
- Automatic progress percentages (the coach sets them, D8).
