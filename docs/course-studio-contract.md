# Course Studio — Backend Contract (for Gemini 3.8)

> **Status:** proposed, not yet built. Written before any UI work, as agreed.
> **Owner of this contract:** UX/UI (Opus 5.5) proposes; Gemini 3.8 owns every route, prompt, schema validation and rule.
> Neither side changes a shape here without editing this file and flagging it in writing.

## 1. Purpose

Coaches build course material for their programmes inside Curriculum Studio:

- **Future Skills Milestones** — edit the milestones for the seven Future Skills.
- **Design Thinking PBL programmes** — generate and edit a programme from sources the coach supplies.
- **Course material** — slide decks, interactive quizzes, and narration scripts (the script is text in v1; video is deferred).

AI produces **drafts only**. A coach reviews and edits every draft. Nothing reaches a learner or parent until the coach publishes through the existing PBL publish path (`publishProgram`).

## 2. Rules that apply to every route

1. **Auth:** every route uses `requireAuth`. Only a user with role `coach` (or `admin`) may call them. The server checks that the coach is a member of the class or programme it names.
2. **Coach decides:** responses are drafts. Responses are never written to `pbl_programs` or to a learner document.
3. **Minimum data to the model.** The prompt builder must never include:
   - learner names, emails, or any identifier;
   - diagnosis labels (for example "ADHD", "dyslexia", "gifted", "2e");
   - free-text notes from learners or parents.

   Allowed learner context, only when the coach asks for a learner-tailored draft: consuming passions, strengths, and applied accommodations, as plain phrases.
4. **No invented facts.** Every factual claim in a slide or quiz must be supported by a supplied source. Otherwise it must be marked `ASSUMPTION` in the item. Never invent statistics, dates, or guarantees.
5. **Age:** all content is for learners aged **11–18**. Use `ageBand` (`11-13`, `14-16`, `17-18`) to set reading level. Never produce content that targets a private individual.
6. **Language:** British English. Terms: "programme", "coach", "learning centre". Never "teacher" or "school" in generated copy.
7. **Logging:** log counts, durations, the output type and the model name. Never log prompts, sources, or output text.

## 3. Endpoints

All responses use the existing error envelope from `server/app.js` (`sendError`).

### 3.1 `POST /api/course/generate`

Generate one draft. One call returns one output type.

**Request**
```ts
{
  type: 'milestones' | 'slides' | 'quiz' | 'script',
  programId?: string,            // required for 'slides' | 'quiz' | 'script' when the programme exists
  futureSkillId?: string,        // required for 'milestones' when editing one of the seven Future Skills
  phaseId?: 'explore' | 'empathise' | 'define' | 'ideate' | 'prototype' | 'test' | 'showcase' | 'reflect',
  ageBand: '11-13' | '14-16' | '17-18',
  sources: Array<{ id: string, title: string, text: string }>,   // coach-supplied; see limits
  learnerContext?: { consumingPassions: string[], strengths: string[], accommodations: string[] },
  instructions?: string,         // coach's own words, max 500 chars
  count?: number                 // quiz items or slides, see per-type limits
}
```

**Limits (enforced server-side)**

| Limit | Value | Error if exceeded |
|---|---|---|
| Total `sources[].text` | 30,000 characters | `413 SOURCES_TOO_LARGE` |
| `instructions` | 500 characters | `400 VALIDATION` |
| Sources per request | 10 | `400 VALIDATION` |
| Requests per coach | 20 per hour and 200 per day | `429 RATE_LIMITED` |

**Response (200)**
```ts
{
  draftId: string,               // stored in course_drafts/{draftId}, see §4
  type: string,
  output: SlideDeck | Quiz | NarrationScript | MilestoneSet,
  sourcesUsed: string[],         // source ids the model cited
  flags: Array<{ itemId: string, code: 'UNGROUNDED' | 'ASSUMPTION' | 'TOO_LONG' }>,
  model: string,
  generatedAt: string            // ISO 8601
}
```

**Output schemas**

```ts
// Future Skills milestones, aligned to the 8 stages in frameworks/welearn-dt
MilestoneSet = {
  milestones: Array<{
    id: string,                  // stable, e.g. "ms-define-1"
    phaseId: string,             // must be one of the 8 stage ids, including 'reflect'
    title: string,               // max 80 chars
    goal: string,                // max 240 chars
    sessions: string[],          // 1–4 items, each max 160 chars
    deliverables: string[],      // 1–4 items; multi-modal: video, link, bench, text
    coachCue: string,            // max 240 chars
    sourceRefs: string[]         // ids from sources[]; empty only if flags contain ASSUMPTION
  }>                             // 8 for a Future Skill, one per stage, in order
}

// Slide deck: max 12 slides
SlideDeck = {
  title: string,
  audience: string,              // e.g. "Year 9 learners, 11–13"
  slides: Array<{
    id: string,
    heading: string,             // max 80 chars
    bullets: string[],           // max 5 bullets, each max 15 words
    speakerNotes: string,        // max 400 chars
    visualHint: string,          // what the coach should show, max 160 chars
    altText: string,
    sourceRefs: string[]
  }>
}

// Interactive quiz: max 10 items. Every item has an explanation.
Quiz = {
  title: string,
  items: Array<{
    id: string,
    type: 'single' | 'multi' | 'true_false',
    prompt: string,              // max 240 chars
    options: string[],           // 2–4 options; true_false has exactly ["True","False"]
    answers: number[],           // indexes into options; single/true_false have one
    explanation: string,         // max 300 chars; always present
    difficulty: 1 | 2 | 3,
    phaseId: string,
    sourceRefs: string[]
  }>
}

// Narration script (text only in v1; reserved for the deferred video)
NarrationScript = {
  title: string,
  sections: Array<{ slideId: string, narration: string, durationSec: number }>  // narration max 90 words
}
```

Quiz rules: no negative marking; wrong answers must not be cruel or sarcastic; options must not overlap or repeat; the correct answer must not be always the same index.

### 3.2 `POST /api/course/revise`

Regenerate one item in an existing draft, with the coach's instruction.

**Request:** `{ draftId: string, itemId: string, instructions: string }`
**Response (200):** `{ draftId, itemId, item: object, flags: [...] }`
The item keeps its `id`. The server updates the draft and does not change other items.

### 3.3 `GET /api/course/drafts?programId=…`

List the coach's drafts for a programme. Returns metadata and status, not the full output unless `includeOutput=true`.

### 3.4 `POST /api/course/drafts/{draftId}/discard`

Mark a draft `discarded`. Discarded drafts are kept for 30 days, then deleted by a scheduled job (Gemini to propose).

## 4. Storage

New collection, owned by Gemini (rules and indexes are Gemini's):

```ts
course_drafts/{draftId} = {
  id: string,
  coachUid: string,
  programId?: string,
  futureSkillId?: string,
  type: 'milestones' | 'slides' | 'quiz' | 'script',
  status: 'draft' | 'published' | 'discarded',
  output: object,                // the schema in §3.1
  sourceIds: string[],           // ids only; source text is NOT stored here
  flags: object[],
  model: string,
  createdAt: number,
  updatedAt: number
}
```

**Rules (proposed, for Gemini to write):**
- A coach reads and writes only drafts where `coachUid == request.auth.uid`.
- Learners and parents have no read access to `course_drafts`.
- Publishing copies the approved output into `pbl_programs` through `publishProgram`. It does not copy the draft itself.

**Reusable source library:**

```ts
course_sources/{sourceId} = {
  id: string,
  coachUid: string,              // owner; only this coach reads or writes it
  title: string,                 // max 120 chars
  text: string,                  // max 30,000 characters, plain text
  kind: 'paste' | 'upload_text', // no binary uploads in v1
  createdAt: number,
  updatedAt: number,
  archived: boolean
}
```

- Sources are reused across drafts. A `generate` request names them by `sources[].id`. The server loads them, checks the coach owns them, and then applies the same limits as §3.1.
- Source text is not copied into `course_drafts`. Drafts store ids only.
- Before a source is saved, the server rejects text that looks like personal data (email addresses, phone numbers, or learner names from the class roster). This is a best-effort check; coaches are told not to paste learner records.
- Rules: a coach reads and writes only sources where `coachUid == request.auth.uid`.

## 5. Publish path (existing, unchanged)

`publishProgram(draft, { assignTo })` in `src/services/pblService.js`. The UI calls it only after the coach presses Publish. The publish button shows success only after the promise resolves, and shows an error with retry otherwise. Course Studio does not add a new publish route.

## 6. What the UI (Opus 5.5) will do with this

- Call `generate` per phase or per milestone, never for the whole programme at once.
- Show every item as an editable draft, with its flags and `sourcesUsed` ("Based on 3 sources").
- Label every AI output as AI-generated and let the coach dismiss or regenerate it.
- Show a quiet "Drafting is unavailable" state when the endpoint fails. No endpoint names in the UI.
- Never send learner names, emails, or diagnosis fields. The UI sends `learnerContext` only when the coach ticks "Tailor to this learner", and only the three fields above.

## 7. Decisions

1. **Stages: 8, not 7.** The PBL studio shows 8 stages, including Reflect, so `frameworks/welearn-dt` becomes 8 stages and `phaseId` accepts `reflect`. Gemini to update the framework document and the milestone schema. Mani to confirm the week range for Reflect (the current 7 phases run weeks 1–12, so Reflect needs a range too). This also closes audit item P1-6.
2. **Source library: yes.** Reusable `course_sources` collection, as in §4.
3. **Rate limit: 20 generations per coach per hour and 200 per day.** I chose these as a starting point; Gemini can tune them after the first week of use.
4. **Video: yes, later.** The video step takes `NarrationScript` as input. It gets its own contract when it is built.
5. **Model: a stronger model than the current default.** Gemini stays the primary provider, because it already runs the backend and the rules in this contract. Gemini to pick the model and test quiz quality against `gemini-3.6-flash`.
   - **GPT 6.1 as an option:** it would be a second AI vendor that receives content for learners aged 11–18. That needs Mani's approval and a data-processing agreement first. I have not checked GPT 6.1's availability or terms, so I make no claim about it here.

## 8. Acceptance checks (Gemini to run before the UI is wired)

- Each output type validates against its schema. Invalid model output is retried once, then returns `502 MODEL_UNAVAILABLE`.
- A prompt built from a test learner contains no name, email, or diagnosis label. Add a unit test that fails if one appears.
- `course_drafts` rules: coach A cannot read coach B's draft; a learner cannot read any draft.
- A request with more than 30,000 characters of sources returns `413` before any model call.
- `frameworks/welearn-dt` lists 8 stages including `reflect`, and milestone output rejects any other `phaseId`.
- `course_sources`: coach A cannot read, update or reference coach B's source (`generate` returns `403`).
