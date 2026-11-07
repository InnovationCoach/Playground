# Mission Builder: AI wording contract (for Gemini)

**Status:** proposed. Nothing here is implemented or deployed. `server/` is Gemini's area under `AGENTS.md`, so the front end ships without this endpoint and works without it.

## What exists today

Mission Builder in My Universe (`src/features/universe/builder/`) builds a plan from a reviewed mission:

| Part of the plan | Where it comes from |
| --- | --- |
| Hook (connects the mission to the learner's interest) | Written templates, one per interest. **This is the only part AI would replace.** |
| Time plan | The route's own steps and `planningMinutes`, split into sittings |
| Help level | The route's own `supportModes` (`guided`, `independent`) |

The mission sheet keeps rendering the reviewed bundle, so the driving question, steps, answers, rubric and evidence requirements can't change. That guarantee is in the design, and the model doesn't need to behave for it to hold.

No model is called today, so the interface says Mission Builder and makes no claim about AI. Once a hook really comes from this endpoint, the plan shows a line saying that sentence was written by AI.

## Proposed endpoint

`POST /api/universe/mission-builder/hook` (`requireAuth`, same pattern as `/api/explain`)

Request. Every field comes from a fixed list, so no free text reaches the model:

```json
{ "missionId": "thalassa-wind-survey", "routeId": "guided", "interest": "Music", "minutes": 30, "support": "more" }
```

Response:

```json
{ "hook": "One or two plain sentences, up to 240 characters." }
```

Server requirements:

1. Check `missionId` and `routeId` against a release that is published and educator-approved. Otherwise return 404.
2. Check `interest`, `minutes` and `support` against the same lists as `missionBuilder.js`. Otherwise return 400.
3. Don't send the learner's name, uid, class, goals or work to the model.
4. Don't send the model any answers, rubrics, worked examples or hints. The mission title and driving question are enough.
5. Tell the model to write for ages 11 to 17 in plain language, connect the interest to the mission, and include no facts, numbers or method hints.
6. Apply the usual per-user rate limit. Log failures without learner identifiers.

The client also checks every reply (`acceptableHook`): it rejects markup, links, digits and anything over 240 characters, and ignores every field except `hook`. Any failure keeps the written template, and the learner sees no error.

## Turning it on

1. Gemini ships the endpoint, tested against the emulators.
2. Pass `requestHook` to `MissionBuilder` in `SparkUniverse.jsx`, calling the endpoint through the existing API client.
3. Set `VITE_MISSION_BUILDER_AI=true` in the build.

Deploying any of this needs Mani's written go for that exact step.

## Review state

The pilot bundle records `status: "draft"`, `science` and `curriculum: "educator-pending"`, and `publication: "not-authorized"`. The front end now shows exactly that (`src/features/universe/pilot/pilotRegistry.js`): missions are labelled as still being checked, and Mission Builder stays locked. It unlocks by itself once a bundle that records a real educator review replaces this one.

`server/lib/universe/missions.js` is Gemini's area and wasn't changed. Please check it treats these missions the same way.
