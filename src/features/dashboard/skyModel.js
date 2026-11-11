/**
 * "Your sky": a learner's goals drawn as constellations. Pure and record-driven:
 * one star per real goal step, lit only when that step is ticked or its goal is
 * marked done. Never points, levels or comparison. Positions come from the goal's
 * id, so a learner's sky keeps its shape from visit to visit.
 */
export const SKY = { width: 600, height: 260 };

function seeded(text) {
  let seed = 7;
  for (const ch of String(text)) seed = (seed * 31 + ch.codePointAt(0)) % 2147483647;
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

export function buildSky(goals = []) {
  const shown = goals.slice(0, 3);
  const stars = [], links = [];
  shown.forEach((goal, index) => {
    const random = seeded(goal.id);
    const steps = goal.steps?.length ? goal.steps : [{ id: 'start', text: goal.explore, done: !!goal.done }];
    const span = SKY.width / shown.length;
    const left = span * index + 36, usable = span - 72;
    steps.forEach((step, i) => {
      const x = steps.length === 1 ? left + usable / 2 : left + usable * (i / (steps.length - 1));
      const y = 60 + random() * (SKY.height - 120);
      stars.push({ id: `${goal.id}:${step.id}`, goalId: goal.id, x: Math.round(x), y: Math.round(y), text: step.text, goal: goal.explore, lit: !!step.done || !!goal.done });
      if (i > 0) {
        const from = stars[stars.length - 2], to = stars[stars.length - 1];
        links.push({ id: `${from.id}>${to.id}`, x1: from.x, y1: from.y, x2: to.x, y2: to.y, lit: from.lit && to.lit });
      }
    });
  });
  return { stars, links, lit: stars.filter((star) => star.lit) };
}
