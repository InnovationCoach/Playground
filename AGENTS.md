# DonPBL prototype branch: agent instructions

DO NOT CHANGE ANYTHING FROM LIVE PRODUCTION.

This checkout is for Don's PBL program prototypes only. These instructions apply
to every AI agent working in this checkout, including the colleague's Gemini agent.

- Before editing or committing, verify the branch is exactly `DonPBL` and the
  remote is `https://github.com/InnovationCoach/Playground.git` (a trailing slash
  or equivalent SSH URL is acceptable). Otherwise stop and report the mismatch.
- Commit and push only to `DonPBL`. Never push to `main`, another branch, or tags.
  Never merge into production, force-push, delete branches, or change GitHub settings.
- No deployments, Hosting previews, release actions, cloud provisioning, live
  database access, live account creation, migrations, seeding, or production secrets.
- Use synthetic fixtures by default. A localhost URL alone does not make Firebase
  safe: this repository includes live configuration. Read the handover before running.
- Keep prototypes under `prototypes/DonPBL/`. Do not edit shared application code,
  Firebase configuration, security rules, deployment files, root dependencies, or
  workflows. Describe proposed integration separately for the owner to review.
- Existing backend task prompts are reference material only; they do not authorize
  backend implementation or deployment for this prototype assignment.
- Before pushing, inspect the diff against `origin/main`, run relevant checks, and
  report changed files, demo steps, results, and remaining questions.

Read `docs/DonPBL-HANDOVER.md` for setup, scope, and the reusable agent prompt.
These are operating instructions, not GitHub permission enforcement.
