/**
 * AI Creator: fits a reviewed mission around one learner, without touching what
 * the mission teaches. Pure and unit-tested in tests/universe-creator.test.js.
 *
 * The adaptation is an overlay, never a copy of the mission. It only ever holds
 * a short hook, a time plan built from the route's own steps, and one of the
 * route's own help modes. The mission sheet keeps rendering the reviewed bundle,
 * so the question, steps, answers and rubric cannot differ from what was reviewed.
 */
import { INTERESTS } from '../../pbl/content/pblModel.js';

export const TIME_OPTIONS = [
  { minutes: 15, label: '15 minutes' }, { minutes: 30, label: '30 minutes' },
  { minutes: 45, label: '45 minutes' }, { minutes: 60, label: 'An hour' }
];

/** Each level maps to a help mode the mission sheet already has. */
export const SUPPORT_LEVELS = [
  { id: 'more', mode: 'guided', label: 'Show me how first', detail: 'You’ll see an example and sentence starters from the start.' },
  { id: 'less', mode: 'independent', label: 'Let me try first', detail: 'You’ll start with the full brief. Help is there whenever you ask.' }
];

export const MAX_HOOK = 240;

const HOOKS = {
  'Sport and fitness': 'Coaches plan around limits like this all the time: you can’t have everything, so you decide what matters most and back it up.',
  Music: 'Planning a tour works like this: every choice uses up something else, and you need to explain why yours is worth it.',
  Games: 'Think of it like a strategy game: every choice has a cost, and you win by knowing why you picked it.',
  Animals: 'Animals balance energy every day: what they spend and what they can get. You’ll be weighing up the same kind of choice.',
  Food: 'It’s like planning a big meal on a budget: you have to make the numbers work and still get what matters most.',
  Fashion: 'Designers choose between materials, cost and looks. You’ll make the same kind of choice here, with numbers to back it up.',
  Health: 'Good health choices use evidence, not guesses. You’ll look at the evidence here before you decide.',
  Environment: 'Real choices about the environment come down to this: looking at the evidence and being honest about what’s still unknown.',
  Transport: 'Anyone planning a route asks these questions: how long, how much fuel, and what if something changes?',
  'Art and design': 'Designers work within limits to find what works best. Here, the limits are real numbers.',
  Space: 'This is what real space planners do: check the numbers, then explain the choice.',
  Robots: 'Robot builders always trade off weight, power and time. You’ll be making the same kind of trade-off here.',
  Water: 'People who look after water supplies plan around what might change. You’ll do the same here.',
  'My community': 'Think of a choice your community has to make together: you’d want good reasons you can explain to everyone.'
};

/** Only missions whose release carries educator approval and authorised publication. */
export function isReviewedRelease(bundle) {
  const r = bundle?.reviewState;
  return bundle?.status === 'published' && r?.science === 'educator-approved' && r?.curriculum === 'educator-approved' && r?.publication === 'authorized';
}

export function reviewedRoutes(registry = []) {
  return registry.filter(isReviewedRelease).flatMap((bundle) => bundle.missions.flatMap((mission) => mission.routes.map((route) => ({
    key: `${mission.id}:${route.id}`, mission, route, planetId: mission.planetIds[0], label: `${mission.title}: ${route.name}`
  }))));
}

/** A route's planning time as words, for example "45 to 60 minutes". */
export function routeTime(route) {
  const [low, high] = route?.planningMinutes || [];
  if (!low) return '';
  return high && high !== low ? `${low} to ${high} minutes` : `${low} minutes`;
}

/** Split the route's own steps, in their own order, into sittings that fit the learner's time. */
export function buildSittings(route, minutes) {
  const [low = 5 * route.steps.length, high = low] = route.planningMinutes || [];
  const perStep = high / route.steps.length;
  const size = Math.max(1, Math.floor(minutes / perStep));
  const sittings = [];
  for (let i = 0; i < route.steps.length; i += size) {
    const steps = route.steps.slice(i, i + size);
    sittings.push({ number: sittings.length + 1, minutes: Math.min(minutes, Math.ceil(steps.length * perStep)), stepIds: steps.map((s) => s.id), stepTitles: steps.map((s) => s.title) });
  }
  return sittings;
}

/** A learner's choices plus the reviewed route give one plan. Returns null if a choice isn't on offer. */
export function adaptMission({ entry, interest, minutes, support }) {
  const level = SUPPORT_LEVELS.find((s) => s.id === support);
  if (!entry || !INTERESTS.includes(interest) || !TIME_OPTIONS.some((t) => t.minutes === minutes) || !level) return null;
  return {
    missionId: entry.mission.id, routeId: entry.route.id, planetId: entry.planetId,
    title: entry.mission.title, routeName: entry.route.name, drivingQuestion: entry.mission.drivingQuestion,
    interest, minutes, support, hook: HOOKS[interest], hookSource: 'template',
    sittings: buildSittings(entry.route, minutes),
    supportMode: entry.route.supportModes.includes(level.mode) ? level.mode : entry.route.supportModes[0],
    supportDetail: level.detail
  };
}

/** Plain sentence or two only: an AI hook may not carry links, markup, or numbers that could look like answers. */
export function acceptableHook(text) {
  if (typeof text !== 'string') return null;
  const hook = text.replace(/\s+/g, ' ').trim();
  if (!hook || hook.length > MAX_HOOK || /[<>{}[\]]|https?:|\d/.test(hook)) return null;
  return hook;
}

/**
 * Real AI wording, once the backend exists (docs/AI-CREATOR-BACKEND-CONTRACT.md).
 * It can only replace the hook. Off until VITE_UNIVERSE_CREATOR_AI is set, and any
 * failure or unacceptable reply keeps the reviewed template. No free text or
 * learner identity goes in the request body: only ids and choices from fixed lists.
 */
export async function withAiHook(plan, { enabled = import.meta.env?.VITE_UNIVERSE_CREATOR_AI === 'true', request } = {}) {
  if (!enabled || !plan || !request) return plan;
  try {
    const reply = await request({ missionId: plan.missionId, routeId: plan.routeId, interest: plan.interest, minutes: plan.minutes, support: plan.support });
    const hook = acceptableHook(reply?.hook);
    return hook ? { ...plan, hook, hookSource: 'ai' } : plan;
  } catch {
    return plan;
  }
}

/** Restore a plan saved on this device, dropping it if its mission or route is no longer reviewed. */
export function restorePlan(saved, routes) {
  if (!saved || typeof saved !== 'object') return null;
  const entry = routes.find((r) => r.mission.id === saved.missionId && r.route.id === saved.routeId);
  const plan = adaptMission({ entry, interest: saved.interest, minutes: saved.minutes, support: saved.support });
  const hook = saved.hookSource === 'ai' ? acceptableHook(saved.hook) : null;
  return plan && hook ? { ...plan, hook, hookSource: 'ai' } : plan;
}
