# PBL Studio (2026-09-28)

The term-project section. Route `#/pbl` (tabs `#/pbl/<tab>`), code in `src/features/pbl/`.

## Model
- **One termly theme** (`content/pblModel.js` → `TERM`). The current theme "Sustainable Futures" is a
  placeholder and is labelled "theme to be confirmed" on the page until the school sets it.
- **Explore phase = the STEAM activities**, each aligned to NGSS with a 4-level three-dimensional
  rubric (SEP / DCI / CCC, plus ETS for design tasks) in `content/steamNgss.js`.
- **Design Thinking project phases**: Empathise → Define → Ideate and plan → Prototype → Test and
  improve → Showcase or present. Each phase lists tasks, evidence to collect, AI prompt starters, and
  the **school competencies** it is assessed on (`content/competencies.js`, generated from
  `WeLearn Academy.xlsx`, text verbatim).
- Learners log evidence (note, media link, code, data, feedback, AI log, reflection) tagged to
  competencies. An **AI log** requires "what I asked" and "what I kept/changed" - using AI well is
  evidence. End-of-term readiness checks: problem, criteria, evidence in every phase, code, AI log,
  data, feedback, reflection, format chosen.
- Saved at `users/{uid}/activityProgress/pbl-<termId>` (existing rules: owner writes, coach reads).
  Text and links only; uploads wait for Storage (Phase C).

## AI writes code (decided 2026-09-29)
Learners use AI to write the code for projects that help **people, the environment, or both**. Define
now requires the impact choice and how it will be measured, and this is a readiness check. The co-pilot
calls `POST /api/pbl-copilot`; the spec for Gemini is `docs/BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md`.
Until that endpoint is deployed, the co-pilot falls back to `/api/tutor` (hints only) and tells the
learner so. Any code block can be saved straight to the portfolio as code evidence.

## Open
- The school's real theme and term dates.
- Coach view of a learner's portfolio and competency scoring (the coach dashboard is legacy code).
- 16 problems in the competency spreadsheet (duplicate numbers, copied or swapped descriptions),
  listed on the Competencies tab for coaches and in `COMPETENCY_DATA_ISSUES`.
- NGSS PE titles are short paraphrases; teachers should check the full PE text on nextgenscience.org.
