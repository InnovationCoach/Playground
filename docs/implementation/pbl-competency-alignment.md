# PBL competency alignment — implementation

8 October 2026. Local changes; not deployed.

- Program activities and simulations can select existing WeLearn PBL competencies by domain/search. Selected competencies survive conversion validation, program save and draft lesson creation.
- Client and server share stable-ID validation. Unknown IDs, duplicates and excessive selections are rejected; original framework wording and duplicate display codes remain unchanged.
- Lesson saves validate lesson and step mappings. Individual and program publication reject unknown competency mappings. Legacy lessons without mappings remain supported.
- This release does not infer mastery, rewrite curriculum, migrate saved content or persist lesson progress. These remain subsequent phases of the architecture plan.

Checks: competency contract, program maker/model, coach editor and school UI tests; API tests exercise save and publish validation against emulators. See the implementation response for actual run outcomes.
