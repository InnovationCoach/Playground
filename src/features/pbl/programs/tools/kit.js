/**
 * Shared pieces for program toolkits: input cleaning, badge normalising, XP and
 * the week-to-session mapping. Pure functions, unit-tested with each toolkit.
 *
 * Don's program files spell a badge four different ways (title/xpReward/criteria,
 * title/xp/criteria, title/xpReward/unlockCriteria, name/xpAward/condition).
 * `normalizeBadges` reads them all into one shape and never edits the source.
 */

/** Points for finishing a session. The platform's number, not Don's (see the Checks tab). */
export const SESSION_XP = 150;

export const text = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trimStart().slice(0, max) : '');
export const int = (v, lo, hi) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : null);
export const num = (v, lo, hi) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : null);
export const pick = (v, allowed, fallback = null) => (allowed.includes(v) ? v : fallback);
export const bool = (v) => v === true;
export const round = (x, dp = 1) => { const k = 10 ** dp; return Math.round(x * k) / k; };
/** A list of ids, limited to the allowed ones, without repeats. */
export const idList = (v, allowed) => [...new Set((Array.isArray(v) ? v : []).filter((x) => allowed.includes(x)))];

export function normalizeBadges(list, icons = {}) {
  return list.map((b) => ({
    id: b.id,
    name: b.name || b.title,
    icon: b.icon || icons[b.id] || '🏅',
    xpAward: b.xpAward ?? b.xpReward ?? b.xp ?? 0,
    condition: b.condition || b.criteria || b.unlockCriteria || '',
    description: b.description || b.condition || b.criteria || b.unlockCriteria || ''
  }));
}

/**
 * Badges already saved on the progress document (a coach award, or an earlier
 * unlock) are kept; a tool adds a badge only when its own rule is met.
 */
export function makeEarnedBadges(badges, auto) {
  return function earnedBadges(progress) {
    const tools = progress?.tools || {};
    const known = new Set(badges.map((b) => b.id));
    const earned = new Set((Array.isArray(progress?.badges) ? progress.badges : []).filter((id) => known.has(id)));
    for (const b of badges) if (auto[b.id]?.(tools)) earned.add(b.id);
    return badges.filter((b) => earned.has(b.id)).map((b) => b.id);
  };
}

export function kitXp(progress, program, badges, earnedIds, sessionXp = SESSION_XP) {
  const done = program.sessions.filter((s) => progress?.sessions?.[s.sessionNumber]?.done).length;
  const earned = new Set(earnedIds);
  return done * sessionXp + badges.filter((b) => earned.has(b.id)).reduce((s, b) => s + b.xpAward, 0);
}

export function levelFor(xp, levels) {
  const i = levels.reduce((best, l, idx) => (xp >= l.minXp ? idx : best), 0);
  const cur = levels[i];
  const next = levels[i + 1] || null;
  return { ...cur, next, pct: next ? Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100) : 100 };
}

/** Every one of these programs runs 2 sessions a week for 12 weeks. */
export const weekSessions = (...weeks) => weeks.flatMap((w) => [w * 2 - 1, w * 2]);

/** { sessionNumber: toolId } from the tools' own `sessions` lists. */
export function sessionToolMap(tools) {
  const map = {};
  for (const t of tools) for (const n of t.sessions) if (!(n in map)) map[n] = t.id;
  return map;
}
