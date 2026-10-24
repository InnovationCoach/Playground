# Staff and account control — contract (for Gemini 3.8)

> **Status:** proposed by Mani's request. Not built.
> **Owner:** Gemini owns the server, claims, rules and audit log. UX/UI builds the owner page after the claim exists.

## 1. Who can do what

| Action | Owner (Mani) | Admin | Supervisor | Coach | Learner / Parent |
|---|---|---|---|---|---|
| Create a coach account | Yes | **No** | No | No | No |
| Suspend, unsuspend or remove a coach | Yes | No | No | No | No |
| Change a role to or from coach | Yes | No | No | No | No |
| Create a learner account | No | **No** | No | Yes, into their own classes | No |
| Remove a learner account | Yes | No | No | No (see §3) | No |
| Assign a coach to a class | Yes | No | No | Own classes only | No |
| View the staff and learner lists | Yes | Yes (read) | Yes (read) | Own classes | No |

Today: `POST /api/admin/users` (`server/routes/admin-users.js`) requires `role === 'admin'`, so any admin can create coaches. `create-learner` also allows `admin`. Both must change.

## 2. Owner identity

- The owner is one account, identified by a custom claim `owner: true`, set once by a script that Mani runs. Nothing in the app can grant it.
- The server checks `req.caller.owner === true` for owner-only routes. A role of `admin` alone does not pass.
- Rules: `owner` is not writable from the client. Only the Admin SDK sets it.

## 3. Removing students

- Owner: deletes a learner account. Requires a confirmation with the learner's name and class. Writes an audit entry.
- Coach: removes a learner from their own class only (unlink). The account and its records stay. Proposed; Mani to confirm.

## 4. Audit

Every create, suspend, remove, role change, claim change and class assignment writes `auditLogs` with: actor uid, action, target uid, time, before and after for changed fields. `auditLogs` stays append-only.

## 5. Owner page (UX/UI, after §2 exists)

- **Staff:** coaches list with status, class count, last sign-in. Actions: add coach, suspend, remove.
- **Learners:** read-only list by class, with remove (owner only).
- **Classes:** coach assignments per class.
- Every action asks for confirmation and shows the audit line afterwards.

## 6. Tests (Gemini)

- An admin without `owner` gets 403 on coach creation, coach suspend and coach role change.
- A coach gets 403 on learner removal of an account (unlink is allowed for their own class only).
- An admin gets 403 on learner creation through `create-learner`.
- Owner actions write an audit entry with before and after.
