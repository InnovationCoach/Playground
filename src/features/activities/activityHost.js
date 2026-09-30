/**
 * Bridge between the React shell and the legacy activity markup.
 *
 * The five activities still live as static containers in index.html, driven by
 * ~1,500 lines of inline script. They are deliberately NOT being ported to
 * React: Phase 2 replaces them with activities rendered from the Firestore
 * content model, so porting their internals now would be thrown away.
 *
 * React therefore owns the shell - auth, navigation, dashboards - and reaches
 * into these containers only to show or hide them. That is the whole contract.
 */

export const LEGACY_ACTIVITIES = [
  { id: 'home', containerId: 'home-container', label: '🏠 Home Portal' },
  { id: 'phase1', containerId: 'phase1-container', label: '🌴 Activity 1: Urban Heat',
    description: 'Cool a tropical city: trees, cool roofs and budgets.',
    keywords: 'urban heat island climate city temperature trees budget' },
  { id: 'bunker', containerId: 'bunker-container', label: '🛡️ Activity 2: Bunker Survival',
    description: 'Engineer a shelter that survives an extreme disaster.',
    keywords: 'bunker survival disaster shelter engineering heatwave flood' },
  { id: 'coding', containerId: 'coding-container', label: '🐍 Activity 3: Micro:bit Coding',
    description: 'Program a micro:bit in MicroPython.',
    keywords: 'microbit micro:bit coding python programming computer science' },
  { id: 'bangkok', containerId: 'bangkok-container', label: '🌊 Activity 4: Bangkok Coastal',
    description: 'Protect Bangkok\'s coast from rising seas.',
    keywords: 'bangkok coastal flood sea level mangrove climate' }
];

// Activity 5 (Solar Car) was the first to leave this list: it is now a real
// React activity under features/activities/solarCar, rendered by App.jsx. The
// remaining four still live in index.html - see the note above. Activity 6
// (SO₂ → Sulfate) was born in React and never had a legacy container.
export const REACT_ACTIVITIES = [
  { id: 'solar', label: '☀️ Activity 5: Solar Car',
    description: 'Measure your real model car and predict its speed.',
    keywords: 'solar car energy engineering gears speed physics stem' },
  { id: 'so2', label: '🧪 Activity 6: SO₂ → Sulfate',
    description: 'Model gold-nanoparticle catalysis of sulfur dioxide.',
    keywords: 'so2 sulfate sulfur chemistry catalysis gold nanoparticle acid rain' },
  { id: 'plants', label: '🔬 Activity 7: Plant Microscope Lab',
    description: 'Microscope experiments on plants - tap to record.',
    keywords: 'plants microscope biology cells leaf stomata sen' },
  { id: 'hexgrid', label: '⬡ Activity 8: Project Hex-Grid',
    description: 'Test hypotheses in a floating-city model of Bangkok.',
    keywords: 'hex grid floating city bangkok project pbl team hypothesis energy food waste' },
  // The primary (ages 6-11) section. Offered to every student while it is being
  // tested; primary-age accounts are sent straight there by App.jsx.
  { id: 'junior', label: '🧭 Junior Explorers',
    description: 'The primary section (ages 6-11): hands-on investigations.',
    keywords: 'junior explorers primary kids floating house plant young' }
];

/**
 * Everything the student navigation offers, in the order it is taught.
 *
 * Navigation must not care which activities have been ported yet - that is an
 * implementation detail of this file. Driving the nav off LEGACY_ACTIVITIES
 * directly meant porting an activity silently removed it from the menu.
 */
export const ACTIVITY_NAV = [
  ...LEGACY_ACTIVITIES.map(({ id, label, description, keywords }) => ({ id, label, description, keywords })),
  ...REACT_ACTIVITIES
];

const byId = new Map(LEGACY_ACTIVITIES.map((a) => [a.id, a]));

// index.html hides these with `.hidden`, and the old code fought its own CSS
// with `!important` inline styles. Toggling the class alone is enough now that
// nothing else writes to these elements.
export function hideAllActivities() {
  LEGACY_ACTIVITIES.forEach(({ containerId }) => {
    document.getElementById(containerId)?.classList.add('hidden');
  });
}

export function showActivity(id) {
  hideAllActivities();
  const activity = byId.get(id);
  if (!activity) return false;

  const el = document.getElementById(activity.containerId);
  if (!el) return false;

  el.classList.remove('hidden');

  // The legacy code tracks the open activity for its SEN engagement telemetry.
  try {
    window.senIntegration?.startActivity?.(activity.id, activity.label);
  } catch { /* telemetry must never break navigation */ }

  return true;
}

export function isLegacyActivity(id) {
  return byId.has(id);
}

export function isReactActivity(id) {
  return REACT_ACTIVITIES.some((a) => a.id === id);
}

/**
 * Record an activity opening for the SEN engagement telemetry.
 *
 * showActivity() does this for the legacy containers. A React activity is not a
 * container, so it calls this directly rather than duplicating the try/catch.
 */
export function trackActivityOpen(id) {
  const label = ACTIVITY_NAV.find((a) => a.id === id)?.label || id;
  try {
    window.senIntegration?.startActivity?.(id, label);
  } catch { /* telemetry must never break navigation */ }
}
