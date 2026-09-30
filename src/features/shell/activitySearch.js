/**
 * Matching for the activity search in the top bar.
 *
 * Every word typed must appear somewhere in the activity's label, description
 * or keywords ("solar car", "chemistry", "micro"). A bare number finds that
 * activity ("6" → Activity 6), since that is how the class refers to them.
 * Label matches rank above keyword-only matches; otherwise teaching order is kept.
 */

const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s:]/gu, ' ');

/** "Activity 6: SO₂ → Sulfate" → 6 */
export const activityNumber = (label) => Number((label || '').match(/Activity\s+(\d+)/i)?.[1]) || null;

export function searchActivities(items, query) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return items;

  const scored = items.map((item, order) => {
    const label = norm(item.label);
    const hay = `${label} ${norm(item.description)} ${norm(item.keywords)}`;
    let score = 0;
    for (const w of words) {
      if (/^\d+$/.test(w)) {
        if (activityNumber(item.label) !== Number(w)) return null;
        score += 3;
      } else if (label.includes(w)) {
        score += 2;
      } else if (hay.includes(w)) {
        score += 1;
      } else {
        return null;
      }
    }
    return { item, score, order };
  }).filter(Boolean);

  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((x) => x.item);
}
