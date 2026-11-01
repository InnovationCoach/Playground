/** Presentation preferences only. Learning records remain in their existing stores. */
export const SLIDES = [
  { id: 'daily', title: 'My Daily Learning Plan', short: 'Daily plan', eyebrow: 'YOUR SPACE. YOUR PACE.' },
  { id: 'goals', title: 'My Goals', short: 'Goals', eyebrow: 'SMALL STEPS. SOMETHING BIGGER.' },
  { id: 'progress', title: 'My Learning Progress', short: 'Progress', eyebrow: 'SEE WHAT YOU’RE BUILDING.' },
  { id: 'creative', title: 'My Creative Space', short: 'Creative space', eyebrow: 'A PLACE FOR UNFINISHED IDEAS.' },
  { id: 'universe', title: 'My Spark Universe', short: 'Universe', eyebrow: 'MAKE THIS FEEL LIKE YOU.' }
];
export const SLIDE_IDS = SLIDES.map((slide) => slide.id);
export const TOOL_SLIDES = { focus: 'creative', notes: 'creative', checkin: 'creative', badges: 'universe', picked: 'universe', skill: 'universe', readiness: 'progress' };
export function hydrateSlides(stored = {}) {
  const order = Array.isArray(stored.slideOrder) ? stored.slideOrder.filter((id) => SLIDE_IDS.includes(id)) : [];
  return {
    dashboardLayout: stored.dashboardLayout === 'grid' ? 'grid' : 'slides',
    slideOrder: [...new Set([...order, ...SLIDE_IDS])],
    slideTitles: Object.fromEntries(SLIDES.map((s) => [s.id,
      typeof stored.slideTitles?.[s.id] === 'string' && stored.slideTitles[s.id].trim()
        ? stored.slideTitles[s.id].trim().slice(0, 40) : s.title]))
  };
}
export function moveSlide(prefs, id, direction) {
  const order = [...hydrateSlides(prefs).slideOrder];
  const index = order.indexOf(id), target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return prefs;
  [order[index], order[target]] = [order[target], order[index]];
  return { ...prefs, slideOrder: order };
}
export function splitGoals(plan) {
  const completed = [], active = [];
  for (const goal of plan.goals) {
    (goal.done || (goal.steps.length > 0 && goal.steps.every((step) => step.done)) ? completed : active).push(goal);
  }
  return { completed, active };
}
