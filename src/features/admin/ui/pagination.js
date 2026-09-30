/**
 * Pure helpers for cursor-paginated lists (contract §7: `{items, nextPageToken, total}`).
 * Kept separate from the hook so they can be unit-tested without React.
 */

/** "Displaying 1–30 of 129". Zero rows gives from = 0, so it reads "0–0 of 0". */
export function pageRange({ pageIndex, pageSize, count, total }) {
  const from = count ? pageIndex * pageSize + 1 : 0;
  const to = count ? from + count - 1 : 0;
  return { from, to, total: Number.isFinite(total) ? total : to };
}

/**
 * Cursor tokens only go forward, so "Previous" needs the token that fetched
 * each earlier page. tokens[i] is the token for page i (page 0 has none).
 */
export function nextTokens(tokens, pageIndex, nextPageToken) {
  const copy = tokens.slice(0, pageIndex + 1);
  copy[pageIndex + 1] = nextPageToken;
  return copy;
}

/** Toggle a `sort` param: same field flips direction, a new field starts ascending. */
export function toggleSort(current, field) {
  if (current === field) return `-${field}`;
  return field;
}
