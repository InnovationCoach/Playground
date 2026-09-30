# Task prompt: PBL project co-pilot endpoint (`POST /api/pbl-copilot`)

You are the **backend engineer** on WeLearn (repo `/Users/admin/Desktop/HearIsland`). Claude owns the
frontend and has already built the screen that calls this endpoint
(`src/features/pbl/Copilot.jsx`, `src/services/geminiApi.js` → `pblCopilot`). Until this endpoint
exists the screen falls back to `/api/tutor` and tells the learner code writing is not switched on yet.

## Why
The school's decision (Mani, 2026-09-29): in PBL Studio, **AI writes code** for learners' projects, and
projects must **solve a real problem for people or the environment**. `/api/tutor` cannot do this: its
`TUTOR_RULES` in `server/safety.js` say "Never hand over … working code". Do **not** change the tutor.
The tutor is still right for the STEAM activities, where writing the code is the learning. Add a
separate endpoint with its own rules.

## Contract
`POST /api/pbl-copilot`, `requireAuth`, JSON body:

```json
{
  "message": "Write code that reads the soil sensor on pin0 and…",
  "phase": "prototype",            // explore|empathise|define|ideate|prototype|test|share
  "impact": "environment",         // people|environment|both|null
  "language": "micropython",       // micropython|makecode|python|arduino|lego
  "problem": { "hmw": "", "who": "", "criteria": "", "constraints": "", "impactMeasure": "" },
  "ageBand": "13-15"
}
```

Response `200`: `{ "reply": "<markdown text; code in ``` fences>", "blocked": false, "timestamp": "…" }`.
Errors: the existing `sendError` shape. Use `400` for an empty message or bad enum, `403` for a primary
account, `429` for the rate limit and `500` when the model fails. The client reads `error.message`, and
a `404` switches it to the fallback, so do not return 404 for any other reason.

## Rules for the model (system instruction)
Build it with the same machinery as the tutor. That means `SAFETY_SETTINGS`, the age-band guidance,
`wrapStudentInput` on the message *and* on every `problem` field (all of it is student text), and
`logConversation` / `flagForReview` with `endpoint: 'pbl-copilot'`. Then add these rules:

1. You are a project co-pilot for a school Design Thinking project that helps people or the environment.
2. **You may write complete, working code** for the learner's own project, in the requested language,
   for classroom kit: micro:bit V2 with sensors, servos, LEGO EV3/WeDo 2.0/Technic, laptops. Comment
   every line in plain language. Keep programs short (roughly under 80 lines). Split bigger jobs into steps.
3. After code, always add **"How to test it"** (2–4 steps on the real device) and **one question**
   asking the learner to explain a specific part back.
4. Help plan, research, break down tasks, debug (explain the error before fixing it), and suggest
   improvements that serve the stated impact and success criteria.
5. **Do not** write the learner's reflections, interview findings or empathy notes, and do not make
   their design decisions. Offer options and ask them to choose.
6. Safety of builds: nothing involving mains electricity, modifying or charging lithium batteries,
   heating elements, blades, projectiles, or anything that could hurt a person or animal. Use low
   voltage and classroom-safe parts only. Nothing that collects other people's personal data, images
   or location.
7. Keep the existing tutor rules on personal details, off-topic requests and the self-harm reply
   exactly as they are.

Include the `problem` fields and `impact` as labelled context. Suggested output budget: 1,500 tokens,
with `thinkingConfig: THINKING_OFF` (see the note in `server/app.js` about thinking tokens eating the
budget).

## Guards
- **Refuse primary accounts** (`ageBand` resolved from the *verified profile*, not the body): 403
  `AI_NOT_AVAILABLE`. AI stays off for primary until the consent work is done.
- Rate limit: 15 requests / minute / uid.
- Cap the message at the existing `MAX_STUDENT_INPUT`, and each problem field at 300 characters.

## Verify before reporting done
Against the emulators (`npm run server:dev:emulator`), signed in as `mia@school.edu`:
1. "Write MicroPython for a micro:bit that reads a soil moisture sensor on pin0 and shows a sad face
   when dry" returns commented, runnable code, a test section and one explain-back question.
2. "Write my reflection for this week" is declined politely, and the reply offers questions instead.
3. "How do I make it plug into the wall socket" is declined on safety grounds.
4. A primary account gets 403; an unauthenticated call gets 401.
5. The exchange appears in the conversation log with `endpoint: 'pbl-copilot'`.

Report in `docs/BACKEND-PBL-COPILOT-HANDOFF.md`, including any contract deviation.
