# W2e learning studio — isolated design preview

Static prototype of the WeLearn W2e learner and coach dashboards. It is not part of the application entry or the production build, imports nothing from `src/`, and never contacts Firebase, an AI service, or a coach. Every record is a labelled sample and all state resets on reload.

## Run it

From the repository root, with the existing isolated preview server:

```bash
npm start -- --host 127.0.0.1 --port 5175 --config tests/coach-preview/vite.config.js
```

Then open `http://127.0.0.1:5175/tests/w2e-preview/index.html`. Any static server works too; the page only needs its own three files and Google Fonts (Inter and Plus Jakarta Sans, the same families the app loads in `/index.html`). Without the font CDN it falls back to system fonts; without the logo CDN it shows the WeLearn name.

## Files

| File | Purpose |
| --- | --- |
| `tokens.css` | Design tokens only: brand palette, derived tints, semantic colour roles, status roles, type, spacing, radii, shadows, layout, motion. Learner display preferences are `data-*` attributes on `<html>` that remap tokens. |
| `studio.css` | Components. Reads tokens only; no hard-coded colours except inside decorative SVG. |
| `index.html` | Markup for the shell, six learner destinations, the coach dashboard, dialogs, the AI panel and an inline icon sprite that mirrors the app's lucide icon set. |
| `studio.js` | Interactions: navigation, collapsible sidebar and mobile drawer, Focus/Explore, slider, pacing, dialogs, support requests, evidence formats, display preferences, AI demonstration panel, class-code demo, coach learner filter. |

## Manual regression sequence

1. Learner view: press Tab from the top; the skip link, notice, sidebar, Focus/Explore and the hero all receive a visible ring.
2. Slider: focus the previous/next buttons, use arrow keys, Home and End; the count and the live region update. Swipe works with touch. Auto-advance is off by default and unavailable when reduced motion is on.
3. Focus view hides the slider and optional cards; the task, progress ring, sidebar and all three coach entry points remain.
4. Tick all three steps; the ring fills and a calm completion message appears. Pause toggles to Resume.
5. Ask my coach: choose a request, add a note, submit. The learner sees a demo confirmation; the Coach prototype control shows the request with a Request label and the tile count rises.
6. Show my thinking: choose each format; the dropzone and record concept appear; Escape returns focus to the button.
7. PBL Studio: the three states, class-code demo (`SOLAR…` succeeds, anything else errors), portfolio and Arachne dialogs.
8. Academic Progress shows a skeleton on first open, then provider cards with source and dates; Edmentum shows the empty state.
9. Display preferences: calm colours, reduce motion and text size apply immediately; no horizontal overflow at the larger size.
10. Narrow width (≤860px): the menu button opens a drawer with focus trapped, Escape closes it and returns focus.
