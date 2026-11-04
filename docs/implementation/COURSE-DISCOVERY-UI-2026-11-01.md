# Course discovery UI — implemented local design

1 November 2026 · WeLearn SPARK

## What changed

The secondary My Courses screen now opens a unified course-discovery experience. Primary learners retain their existing course page and class-code joining remains available for secondary learners without a class.

The new design includes topic search, topic chips, source filters (All / WeLearn / External), format filtering, a compact competency context, up to three explained suggestions, illustrated course cards and an accessible native-dialog detail panel. Desktop has a filter rail; mobile collapses it behind Filters. Search matches program titles as well as activity metadata, correcting the old activity-only behavior.

The visual direction uses the existing green/purple brand family, a quiet off-white background, editorial heading, lavender recommendation section and original lightweight SVG illustrations. There are no remote illustration/font dependencies.

## Real data versus preview

**Actual application:** uses real static program/activity definitions, accessible custom program definitions and the existing signed-in school/pathway APIs. Confirmed competencies are filtered by the current framework version. Only server-supplied eligible quest recommendations can invoke the existing canonical choose action. Selection is saved by the backend and reused in Learning Goals. School/profile access errors clear personalized content; switching accounts resets cached discovery state.

**Isolated design preview:** fictional learner competencies and three explicitly fictional external courses illustrate the intended discovery experience. A sample quest choice is stored only in component state and identified as a preview action. No provider links, enrollment, payments, Firebase requests or model calls occur. Reload resets the sample.

External search and live model-generated recommendations are not implemented. The real app displays an honest external-search unavailable state, with a route back to WeLearn results. Search is keyword-based; it does not claim semantic or natural-language AI search. The new UI copy is currently English. Further localization and a full accessibility audit remain follow-up work.

Program enrollment opens the existing program enrollment area; it does not bypass enrollment or promise a direct jump to the exact offering. Source details distinguish required enrollment from available activity navigation and eligible quests. There is no invented external save/proposal success flow.

## Main files

- `src/features/courses/CourseDiscovery.jsx`: reusable interface and detail dialog.
- `src/features/courses/discovery.css`: responsive visual system and original SVG artwork styling.
- `src/features/courses/discoveryModel.js`: normalized internal catalog, combined search/filtering and pathway adaptation.
- `src/features/courses/LiveCourseDiscovery.jsx`: signed-in context, real offerings/achievements/recommendations and canonical quest selection.
- `src/features/courses/MyCourses.jsx`: secondary-screen integration; original primary experience preserved.
- `tests/pathway-preview/discovery.html`, `discoveryPreview.jsx`, `discoveryFixtures.js`: isolated, labeled sample experience.

## Review and validation

Open `http://127.0.0.1:5190/tests/pathway-preview/discovery.html` while the preview server is running:

```sh
node_modules/.bin/vite --config tests/pathway-preview/vite.config.js
```

The earlier pathway preview links to this page as well.

- 507 unit tests passed across 29 files, including six new discovery tests for search, combined filters, external sample details, unavailable external search, failed quest saves and account-switch privacy.
- Production build passed. No live deployment was performed.
- Browser interaction checks passed: program title search, external filtering, modal opening/Escape, sample quest choice, desktop at 1440 px, mobile at 390 px, mobile filter expansion and absence of horizontal overflow.
- The isolated preview produced no browser errors or external requests.
- Screenshots are in `output/course-discovery-20261101/`: desktop, mobile, course-details and the in-app preview view.
- Existing unrelated workspace changes were preserved.

## Next iteration

Use `OPUS-COURSE-DISCOVERY-UIUX-BRIEF-2026-11-01.md` for the fuller product contract. Priorities are educator/user feedback on the interface, source-backed external catalog/search services, localization, multi-class focus selection, broader discovery eligibility outside current enrollment and constrained model ranking/explanations. These should reuse existing learner goals and server-owned achievement/eligibility rather than create duplicate systems.
