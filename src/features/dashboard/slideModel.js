/** Presentation preferences only. Learning records remain in their existing stores. */
export const SLIDES = [
  { id: 'daily', title: 'My Quests', short: 'My Quests', eyebrow: 'WHAT TO DO NEXT' },
  { id: 'find', title: 'Find a Quest', short: 'Find a Quest', eyebrow: 'SOMETHING NEW TO TRY' },
  { id: 'progress', title: 'My Progress', short: 'My Progress', eyebrow: 'WHAT YOU HAVE DONE SO FAR' },
  { id: 'creative', title: 'My Creative Space', short: 'Creative space', eyebrow: 'A PLACE FOR UNFINISHED IDEAS' },
  { id: 'universe', title: 'My Universe', short: 'My Universe', eyebrow: 'PICK A MISSION' }
];
export const SLIDE_IDS = SLIDES.map((slide) => slide.id);
export const TOOL_SLIDES = { focus: 'creative', notes: 'creative', checkin: 'creative', badges: 'progress', picked: 'creative', skill: 'progress', readiness: 'progress' };
/** Former default titles: a saved copy of one of these is not a learner's own name. */
const RETIRED_TITLES = { daily: ['My Daily Learning Plan'], progress: ['My Learning Progress'], universe: ['My Spark Universe'] };
export function hydrateSlides(stored = {}) {
  // Retired slides (e.g. the old Goals slide, now part of Progress) drop out;
  // new slides join next to the slide they follow in the template.
  const order = [...new Set(Array.isArray(stored.slideOrder) ? stored.slideOrder.filter((id) => SLIDE_IDS.includes(id)) : [])];
  SLIDE_IDS.forEach((id, index) => {
    if (order.includes(id)) return;
    const before = SLIDE_IDS[index - 1];
    if (before && order.includes(before)) order.splice(order.indexOf(before) + 1, 0, id);
    else order.push(id);
  });
  return {
    dashboardLayout: stored.dashboardLayout === 'grid' ? 'grid' : 'slides',
    slideOrder: order,
    slideTitles: Object.fromEntries(SLIDES.map((s) => {
      const saved = typeof stored.slideTitles?.[s.id] === 'string' ? stored.slideTitles[s.id].trim() : '';
      return [s.id, saved && !(RETIRED_TITLES[s.id] || []).includes(saved) ? saved.slice(0, 40) : s.title];
    }))
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
