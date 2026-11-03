# Focused mission flow — Opus O03 / GPT content refinement

Mani's latest direction: focus on **NGSS, grades 6–11**. Set aside Edmentum alignment. Make missions engaging for twice-exceptional learners who may benefit from less text, predictable steps and optional support. This is educational accessibility work, not a medical intervention.

## Ownership and safe base

- Opus owns UI and UI tests in `/Users/admin/Desktop/HearIsland/output/my-universe/pilot-frontend`, starting at clean `805f75cfd96a9c2964c855fc7d2f2f4049d42aac`. Create `codex/universe-focus-flow` from that base. Do not edit root runtime or integration checkout.
- GPT owns shared learning design, NGSS review, integration, and verification in `output/my-universe/pilot-integration` (current `a854cf3`). Gemini is unavailable. No production action/push is requested.
- Preserve the Phase 1 exact identity, policy, evidence formats, required parts, old attempts, save/conflict/account boundaries, reviewed-only outcomes and immutable accepted bundle. Do not change accepted fixture bytes or server contract.

## O03 — implement now

Replace the dense mission sheet with a calm sequence. One active action and one response group at a time. Learner can go Back / Next without a correctness gate; no penalty, timer, streak or compulsory extra writing. Optional reference/example/hint is closed initially, including Guided help. Keep meaningful challenge and all accessible alternatives.

1. Briefing: short role + problem + decision, route cards. Put extended story, model limits and full sources behind clear disclosures. Recommended ranges are 6–8 and 9–11 for this pilot, not age locks. Do not change authored grade bands or imply NGSS specifies individual grades.
2. Work: split practice from notebook evidence. Do not render the whole prompt, multiple editors, examples and all hints together. One notebook part at a time. A part referenced by several steps remains one shared artifact; do not repeatedly demand its completion before progressing. Table: one row / useful calculation group at a time with optional full table. Diagram: one stage at a time (places, links, description), while text remains equal. Switching formats keeps both versions.
3. Use compact truthful save state. Keep actual failure/conflict actions accessible, and make unsaved-on-close consequences available at the point of closing/pause. Do not add localStorage or silently cache learner work. Cursor within authored step is UI-only; wire `activeStepId` must remain an existing authored step ID. Resume deterministically within that step; never promise exact sub-action persistence unless implemented.
4. Support choice should be small/optional, not a repeated paragraph. Student-facing labels should be calm and age-respectful. No diagnostic tracking or automatic lowering of task difficulty.
5. Review: only show the current small response/reflection or short checklist first, with full evidence available on demand. Preserve final explicit Send, required reflection and all shared validation. Clear route/scenario labels prevent the 69.4-day timing case from mixing with the independent 140-day mass case.
6. Keyboard focus moves to the current action heading on Next/Back; preserve modal trapping/return, labels, keyboard alternatives, reduced motion and responsive layout. No loss of typed work on toggles/navigation.

## Shared content interface (GPT will supply an immutable commit)

UI may import directly from `shared/universe/learningDesign.js`:

```js
getMissionLearningDesign(missionId, routeId, missionVersion, bundle.bundleContentSha256)
// null for unknown version/route/content hash. Otherwise:
// { presentationVersion, missionId, missionVersion, routeId,
//   recommendedGrades, objective, role, situation, decision,
//   routeNote, ngss: [{ code, scope, url }],
//   steps: { [authoredStepId]: { title, action, reference, practiceAction,
//     parts: { [partId]: { action, reference } } } } }
```

`notebookPartIds` is an optional subset of the authored step’s evidence parts. An empty array defers a shared notebook artifact until its later consolidation step; it never drops that required artifact. Use this to avoid repeating the same full table after every practice calculation. When omitted, use the original step evidencePartIds.

`reference` is optional short explanatory help. It is not an extra assessed requirement. Use this content in place of dense action copy; keep original prompt/evidence criterion available under “Full task” / “What your coach reviews”. Do not expose reference answers by default. Safely fall back to original content when no exact version mapping exists. No need to block initial layout work on delivery; import after GPT sends the commit. GPT does not own your UI files.

## Acceptance / handoff

Run full Universe UI suite and add meaningful checks for one active editor, separate practice/notebook, Back preserving answers, optional examples closed by default, no invented wire step IDs, accessible format alternatives, review/send and account switch. Preserve existing security/service tests. Use your local preview 5195; integration 5196 belongs to GPT/user. Report commit IDs, commands/results, screenshots and any limitations in a new `MY-UNIVERSE-OPUS55-O03-RESPONSE-2026-11-02.md`. Commit only owned UI/tests/doc files; release writer when done. Do not silently rewrite old Phase 1 closure reports.

Content interface clarification: the fourth lookup argument is the reviewed `bundle.bundleContentSha256`, which binds the release and all content without embedding a fixture-release identifier in the production UI graph. Always pass all four arguments. The accepted fixture remains unchanged.

## Lead review notes while O03 is being built

- R1: For practice cards, show the actual `stepDesign.action` (the operation/task). `practiceAction` is an optional short response label, not a replacement: “Enter the total number of hours” alone loses the instruction to add all five bands. Keep necessary inputs/formula reachable with an obvious reference. Do not assume the learner memorized the briefing.
- R2: The briefing’s NGSS disclosure should collect the unique standards across all routes, rather than borrowing only the first route’s MS standard for the advanced route too. Keep the scope qualifier for each.
- R3: Close guard must handle **more than one unsaved route**. Saving only the currently open route and immediately closing can discard work in another route. Either save all exact route drafts safely, or restrict “Save and close” to the case where it would leave no unsaved work; explain other pending work and offer Keep working / explicit discard. Test a delayed save + route switch, and closing from the Routes screen with pending work.
- R4: `doSave` must report whether the exact work currently in memory was saved, not merely whether a request succeeded. If Keep working is pressed during Save and close, then the learner edits before that delayed request returns, the old request must not close the mission and lose the newer edit. Return false when `latest.current[key] !== submitted`; test this delayed same-route edit case.
- R5: In focus mode the NotebookPart section’s `aria-labelledby` must resolve to an actual rendered element. The old h4 is replaced by a span, so give that span the corresponding ID or pass the action heading ID. Announce the newly shown table row when Next row changes it (heading focus or a short polite status), without reading the entire table.
- R6 (text-load polish): Guided focus-mode text editors still automatically show the full sentence-starter hint under the Add sentence starter button. Keep that extra hint closed/on request too. Practice cards need the operation plus one answer label; avoid a second paragraph that merely repeats the answer label/rounding. `practiceAction` may inform the input label or remain unused; showing the actual operation is the requirement. Keep necessary units/rounding in the real input label.
