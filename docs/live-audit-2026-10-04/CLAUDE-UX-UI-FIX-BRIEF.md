# Claude - UX/UI implementation brief

Read `LIVE-AUDIT-REPORT.md` in this folder first. Work from the real live findings, not only the polished W2e prototype. Do not deploy, change Firebase permissions, or replace failed API reads with sample data to disguise failures.

## First delivery

1. **LIVE-03:** Fix dark text on navy coach/calendar headers. Inspect global CSS interactions inside the complete app, including legacy styles. Use explicit scoped surface/foreground tokens; verify contrast and both themes.
2. **LIVE-04:** Make dashboard totals honest. Render loading, unavailable, verified empty and stale states separately. Material Requests must not display verified-looking zero totals after a failed load.
3. **LIVE-05:** Replace raw `NOT_FOUND` and generic connection messages with actionable role-appropriate recovery. Coordinate structured errors with Gemini. Keep support details accessible to admins without showing technical prose to learners.
4. Give route transitions a visible loading state. A temporary shell-only screen was observed while changing roles/routes; do not claim that as a permanent crash, but test it and prevent unexplained blank content.

## Second delivery

- Student: one next action in the initial laptop viewport, compact welcome/optional manual slider, Focus/Explore, visible coach access, and real name/task/events. Fix the local single-slide translation bug and remove all production-looking fixture content.
- Parent: a dedicated overview, one persistent child switcher, recent learning, next step, source/date, upcoming events and appropriate school contact. Parent Studio Home must not reuse the coach dashboard.
- Coach: compact support/review queue plus assigned roster. Keep academic and project evidence distinct. Replace hardcoded support metrics/preferences with verified data or explicit empty states.
- PBL: separate programme guide from current project work; provide the three approved semester offerings and consistent current/available/upcoming states. Confirm mapping with Gemini before altering legacy term identifiers.
- Primary: preserve read-aloud, large text and clear activity stages. Prioritise assigned/resumable work and reduce calendar visual bulk. Check sticky-header overlap interactively.
- Onboarding: explain the school-created under-13 account route. Do not invent consent policy or extend self-registration without the agreed backend design.

## Brand and accessibility

Use navy #003C69, purple #8250A0, selective lime #96D700, blue #9BD2FF and restrained neutral surfaces. Avoid excessive gradients and equal-weight cards. Preserve adolescent versus primary visual language. Test keyboard focus, dialog Escape/return, text enlargement, reduced motion, narrow layouts and contrast in the complete app. Aim for WCAG 2.2 AA; report tests actually performed rather than claiming certification.

## Required handback

Provide changed files, before/after screenshots from the integrated app, behavioural checks, API dependencies, remaining limitations and exact build/commit identity. Reference LIVE finding IDs. No feature is complete merely because the isolated preview renders.
