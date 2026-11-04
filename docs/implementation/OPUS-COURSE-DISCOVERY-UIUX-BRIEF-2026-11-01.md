# Opus handoff: competency-aware course discovery

1 November 2026 · WeLearn SPARK

## Latest user direction — UI ownership and visual baseline

**Explicit baseline supplied by the user:** https://dnd-master-73449.web.app/#/search

**This is an evolution of the existing search page, not a replacement design.** Keep that page's current colors, theme, typography, navigation, layout conventions and shared components. Extend the existing search engine and add compatible sections within that screen. Preserve the `#/search` entry point and existing search behavior while expanding its capabilities. Do not relocate discovery into a replacement My Courses experience as the primary implementation.

Add to the existing page:

1. A compact competency/goal context section, using existing component styles.
2. Explained course/program suggestions informed by confirmed competencies and the learner's search.
3. Integrated WeLearn/external source selection and compatible filters.
4. Source-aware result cards and course details that follow the current live card/detail patterns.
5. Existing goal/quest actions where supported, with honest external-provider and unavailable states.

First inspect the authenticated `#/search` page and map its existing sections/components; then propose the exact insertion points and implement additive changes. A read-only attempt on 1 November 2026 reached the sign-in screen, so its authenticated layout and exact palette were **not** verified in this session. Do not infer the search design from that sign-in screen or the rejected local prototype. Use an authorized signed-in view or obtain the necessary reference before visual implementation.

The user rejected the Codex course-discovery visual treatment because it does not match the live platform. They want **Opus 5.5 to handle UI/UX**. Treat the current discovery preview as a functional prototype, not an approved visual direction.

Before styling, inspect the actual live platform and its existing course/program screens, shared components, design tokens, typography, spacing, navigation, cards and interaction patterns. Match that established system. Do not introduce the prototype's off-white/green editorial theme, serif heading or new illustration style unless those are already present in the live platform or the user subsequently requests them. Source files alone do not establish the current deployed appearance.

Reuse the functional search, filtering, existing pathway API adapter, canonical quest choice and access checks where appropriate. Replace the prototype presentation as needed. Keep the distinction between fictional external preview records and real backend capabilities. Do not deploy this rejected prototype. If the live screen cannot be accessed, request the minimum visual reference needed instead of guessing its style.

The implemented prototype and its limits are documented in `COURSE-DISCOVERY-UI-2026-11-01.md`. The product requirements below still apply; this latest visual instruction takes precedence over any proposed aesthetic elsewhere in this brief.

## Assignment and intended experience

Extend the existing **Search for courses** experience at `#/search`, preserving the live page's style and colors. Integrate the competency pathway into the learner's search journey so learners can discover what to study next while browsing programs. Discovery must cover WeLearn programs, their courses/lessons/activities, and external learning opportunities.

The learner should be able to say: “I want to learn about this,” see relevant options, understand how each option connects to their goals and demonstrated competencies, and choose a manageable next step. The system may suggest useful preparation or extension work; the learner and coach retain the decision.

**Product direction:** course discovery is the main place for finding and choosing learning. Learning Goals remains the place for managing chosen goals, quests and coach assessments. Both screens use the same saved records and recommendation contracts. Avoid creating another independent goal system.

Deliver implemented responsive screens, reusable components, explicit backend contracts, accessible interaction, realistic test fixtures and a reviewable preview. Preserve existing work and the designated project environment. Do not deploy as part of this UI/UX assignment.

## Read the existing implementation first

All paths below are relative to `/Users/admin/Desktop/HearIsland`.

| File | Existing behavior and implication |
|---|---|
| `src/features/courses/MyCourses.jsx` | Existing course page and “Search programs & activities…” input. Currently the query filters activity metadata; the program cards remain unfiltered. Fix this mismatch when building unified search. Preserve class-joining behavior. |
| `src/features/school/ProgramCatalogueChooser.jsx` | Program definitions, custom program discovery from accessible offerings, enrollment indicators and class-code joining. Reuse the enrollment contract and distinction between a catalog definition and an available offering. |
| `src/features/pbl/content/programCatalogue.js` | Existing PBL definitions. Preserve real titles and content. |
| `src/features/quest/LearnerPathway.jsx` | First local competency pathway UI, learner quest choice, evidence submission and coach assessment. Reuse state/actions rather than copy the whole management panel into discovery. |
| `src/features/quest/pathwayModel.js` | Current deterministic eligibility rules. Reads explicit confirmed competency decisions and published lesson mappings. It is not an AI search engine. |
| `server/lib/learnerPathway.js` | Current saved achievement and quest API. Recommendations are limited to eligible published lessons in actively enrolled programs for one learner/class. It cannot currently search all programs or the internet. |
| `src/features/pbl/content/competencies.js` | Stable competency IDs and original framework statements. Display codes are not unique. |
| `src/features/school/SchoolLearningPanel.jsx` | Existing Learning Goals, programs, evidence and coach review integration. |
| `src/features/shell/ActivitySearch.jsx` | Compact top-bar activity navigation. Keep this working. It can offer a link to full course discovery without becoming the entire discovery page. |
| `src/features/admin/admin.css`, `src/styles/tokens.css` | Existing visual language and reusable controls. |
| `docs/implementation/COMPETENCY-PATHWAY-PILOT-2026-11-01.md` | Current implementation, verification, saved-record structure and limitations. |

Verify the designated checkout and preserve unrelated uncommitted work. No local preview or source file establishes what is deployed. Do not assume missing provider integrations or live AI functionality exist.

## Information architecture and screen layout

The structure below describes proposed content and behavior. Fit it into the existing live search page using additive sections; it is not authorization to replace the page's visual hierarchy, title, colors or navigation.

Suggested page title: **Find your next learning adventure**. Use “Search for courses” as the clear navigation/search label. Keep the tone appropriate for secondary learners: encouraging, calm and direct.

Desktop layout, top to bottom:

1. **Search header.** One search field with placeholder “Search a topic, skill, course or project…” and a visible Search action. Support ordinary topic searches and natural-language intent such as “I want to build a robot” or “What should I learn after this project?”
2. **Compact learning context.** Show the active goal or chosen focus and the relevant confirmed competencies. Allow “Choose a focus” or “Change focus.” A short summary expands to details; a long competency list must not dominate the screen. Use “No confirmed competencies yet” honestly when appropriate.
3. **Recommended for you.** Up to three suggestions tied to the current query/focus, with a short explanation and a next action. With no query, offer suitable next steps using available learner context. While searching, update this section in relation to the search; do not keep unrelated generic suggestions above the requested results.
4. **Results toolbar.** Source tabs **All / WeLearn / External**, result count when known, sort and filters. Make source differences visible even in All.
5. **Search results.** Consistent cards with clear titles, provider/source, level, availability and actions. Large result sets need pagination or load more with preserved state.

Mobile: search first, compact focus summary, recommendations, then results. Put filters in an accessible drawer/dialog. Keep the active filter summary and clear-all action visible. Do not require horizontal scrolling or a chat conversation to browse results.

Initial filters: topic/domain, competency focus, level/readiness, learning format, time commitment, language, cost and source. Show only supported filters with real metadata. Unknown price or duration remains unknown rather than being converted to free or short. Preserve query, filters and scroll position when returning from details.

## What each recommendation must communicate

Each suggestion answers:

- **What could I learn?** A clear course/program title and plain-language outcome.
- **Why this option?** A short, specific reason tied to the search, chosen goal, confirmed prerequisite or stated interest.
- **What would I work toward?** Target competencies and their original statements, available on expansion.
- **Am I prepared?** Explicit prerequisite status, including unmet or unknown requirements.
- **What will I do?** A short next action or a preview of the quest; show time and evidence expectations when actually known.
- **Where does it come from?** WeLearn or the named external provider, with source and verification status.

Example UI copy, using fictional course content rather than a claim about existing providers:

> **Investigate energy use at school**  
> WeLearn · Project-based learning  
> **Why this could fit:** Your coach confirmed Goal Setting. This lesson builds on that skill and matches your search for energy projects.  
> **Working toward:** Strategic Thinking  
> **Next step:** Compare two possible improvements and explain your priorities.  
> **Action:** View course

Do not say a learner “needs” a course unless an explicit assignment or prerequisite makes it required. Prefer “Suggested next step,” “Useful preparation,” or “Optional stretch.” Do not display invented match percentages or imply that a language model has assessed mastery.

## Search relevance, readiness and availability

Keep these separate in both data and UI:

- **Relevant:** matches the learner's query or intent.
- **Suggested:** a reasonable option for their goal and available evidence.
- **Prerequisites confirmed:** every explicitly mapped prerequisite has a current confirmed decision.
- **Preparation needed:** specific recorded prerequisites are missing.
- **Readiness unknown:** prerequisite or mapping information is incomplete.
- **Available now / Already enrolled / Enrollment required / Ask your coach / Not currently offered:** actual access state.

A relevant course may be visible in normal search even when its prerequisites are unmet, with an honest explanation. It must not appear as a ready-to-start personalized next step. A catalog listing is not proof of enrollment or availability. Continue to exclude unknown framework IDs and preserve the original framework wording.

Eligibility is server-owned. The current pathway rules remain authoritative for existing eligible lesson choices. Extending discovery beyond enrollment requires a separate discovery result contract; do not broaden the existing choose endpoint or silently bypass its checks.

## Course/program details and actions

Use one detail view with source-specific actions. It should contain an overview, outcomes, linked competencies, prerequisites, delivery format, estimated effort, evidence/assessment expectations, provider and availability.

| State | Appropriate actions |
|---|---|
| Enrolled WeLearn program/course | Continue or Open course; choose an eligible quest through the existing server action. |
| Discoverable WeLearn program, not enrolled | View details; Join with class code when supported; Ask coach about enrollment. |
| Program with no available offering | Save interest or Ask coach; explain availability. |
| External option | View provider; Save for later; Add as a proposed learning goal / Request coach review when that workflow is supported. |

Choosing an already eligible internal quest saves the existing canonical goal and quest. Preserve its lesson revision, steps and evidence criteria. A proposed external learning goal needs a distinct pending-review state; it does not become an approved assessed quest by clicking a search result.

If Save, Request review or proposed-goal persistence is not implemented, document the contract and present a clear unavailable state in the real app. Preview controls may use labeled fixtures. Do not show a success message for an unsaved action.

## External learning discovery

External means learning outside WeLearn: courses, tutorials, projects, workshops and other useful resources. Clearly distinguish a full course from a short resource. Start with a school-reviewed external catalog, then support broader web discovery through a backend search service.

The learner should see a consistent search experience across sources. Broader web discovery can use an **Expand search to the web** action with clear loading/result states. Retain internal and reviewed external results if that service fails. Do not fetch the entire web on every keystroke.

External cards/details need:

- Exact provider and title, resource type and canonical HTTPS URL.
- A concise summary derived from retrieved provider/source content.
- Language, effort, level, cost/currency and account requirements when verified; otherwise “Not listed” or “Check provider.” Free course access and a paid certificate are distinct when the source establishes that distinction.
- Age/grade suitability when established, and unknown suitability when it is not.
- Last verification time and separate statuses for **link/metadata checked**, **school reviewed**, and **competency mapping reviewed**. Checking that a URL loads is not educational endorsement.
- A source-backed explanation of relevance. AI-inferred competency alignment is tentative until a coach reviews it; display “May support…” rather than “Meets this competency.”

AI must use retrieved catalog/search records. It must not invent provider URLs, prices, certificates, prerequisites or course availability. Resolve every recommendation to a real source record. Merge duplicates by canonical URL/provider record while retaining distinct offerings. Stale/dead links need a recovery state.

Open provider links in a new tab with a visible external-link indication. Opening, saving or enrolling externally does not award mastery or prove completion. Learners can later submit evidence to their coach through an approved assessment workflow. Course purchase and provider enrollment remain with the provider; this assignment does not add payments or automatic registrations.

Do not transmit learner identities, raw evidence, messages or private coach notes to search providers. Any model personalization context must use an approved server-side allow-list; authentication and learner/class scope remain server-enforced.

## Backend contracts to agree before connecting real data

The following are proposed additions, not existing endpoints. Opus may implement UI adapters and fixtures while documenting backend work separately.

**Discovery request:** query, selected school/class scope, source selection, supported filters and cursor. The server derives learner identity and permissions. Search intent can include an optional explicitly chosen goal/focus and allowed interest tags.

**Discovery response:** results, next cursor, known/unknown counts, source-specific availability/error states, and applied filters. Each normalized result should include:

```text
id, source (welearn | external), resourceType, title, summary
provider { id, name }, internalTarget OR canonicalUrl
outcomes, competencyMappings [{ competencyId, status, sourceReference }]
prerequisites, readiness { status, missingIds, reason }
availability, language, duration, level, cost { status, amount?, currency? }
verification { metadataCheckedAt?, schoolReviewedAt?, mappingReviewedAt? }
actions, provenance
```

**Recommendation response:** up to three result IDs, target competencies, explicit reason/basis, prerequisites and their status, source references, and generation method `rules | ai-assisted`. Keep the current pathway's eligible lesson choice identifiers separate from generic discovery IDs.

**Future saved actions:** saved resource, enrollment-interest/request and proposed external goal each need permission checks, revisions/idempotency, honest saved/error states and a return path to Learning Goals. Agree retention and audience for learner interests before persisting them.

## Behavior and accessibility requirements

- Ordinary search results should not wait for AI. Show recommendation loading independently; preserve usable results when AI/search sources fail.
- Keep a short input debounce, cancel stale requests and discard late responses for an earlier query, learner or school. Source/filter changes must not show another learner's cached suggestions.
- Include first visit, empty learner history, no matching results, unavailable internal data, unavailable external search, unavailable AI, missing prerequisite metadata, stale provider information, enrollment required, save failure and revoked-access states.
- With no confirmed history, offer clearly labeled foundational exploration and a way to choose interests. Do not invent a competency profile.
- Retain useful query/filter state on retry. Keep typed goal/evidence text after failed saves.
- Keyboard-operable cards, labeled controls, visible focus, accessible filter dialogs, announced result updates, reduced-motion support and readable contrast. Use buttons/links for actions rather than clickable non-interactive containers.
- Translate learner-facing strings through the existing localization system; preserve stable IDs and source terminology behind the UI.
- Use the existing brand palette and typography. Give search and the next useful action visual priority. Avoid excessive badges, gamification counters and duplicated navigation in this discovery screen.

## Delivery sequence and acceptance

**1. Reviewable UI prototype:** build the integrated screen and details using labeled fixtures covering internal/external sources, prepared/unprepared/unknown readiness and errors. Include desktop and 390 px mobile previews.

**2. Internal discovery:** search actual accessible program/course/activity metadata, filter program titles as well as activities, distinguish catalog visibility from enrollment, and connect existing eligible quest actions. Reuse current Learning Goals records.

**3. External discovery:** connect a reviewed external catalog, then the proposed broader-search adapter. Ground all results in provider/search records. Add persistence only when its approved backend contract exists.

**4. Model assistance:** integrate approved recommendation/ranking/explanation output. Show an AI label only for real model-assisted output; retain transparent rule-based fallback. Models cannot grant access, establish mastery or publish assessed quests.

Acceptance examples:

1. A learner searches a topic and receives matching program titles and activities, plus relevant next-step suggestions with reasons.
2. A coach-confirmed prerequisite makes a dependent internal lesson eligible; reopening it removes that readiness claim on refreshed results.
3. An unenrolled program can be discovered without presenting it as immediately accessible. Class-code joining still uses the existing backend.
4. An external option has a real provider URL, visible source, honest cost/metadata status and appropriately qualified competency alignment.
5. External search or AI failure preserves usable platform results and offers retry.
6. Choosing an eligible internal quest creates one canonical saved goal, survives refresh, and appears in Learning Goals. External proposals remain distinct pending coach review.
7. Changing learner/school/query while a response is pending cannot reveal stale private results. Client data cannot forge readiness or achievement.
8. Learners can complete search, filters, details and actions on mobile and with the keyboard. Browser back restores the search context.

Handoff report: changed files and components; screenshots; tested interactions; real versus fixture-backed capabilities; proposed/implemented API contracts; unresolved backend dependencies; and remaining work. Do not describe prototype external search or mocked AI as shipped functionality.
