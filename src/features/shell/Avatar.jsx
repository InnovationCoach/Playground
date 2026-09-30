/**
 * Initials avatar. The colour is picked from brand tints by a hash of the
 * seed (uid or email), so a person always gets the same colour.
 */
const TONES = [
  ['#f5eefa', '#6e3f8b'], ['#f2fadf', '#4a6a00'], ['#eef6ff', '#1d5a8f'],
  ['#fbeaf2', '#9a1f5e'], ['#fff6e0', '#8a5700'], ['#eef0fb', '#3b4a9a']
];

export function initials(name = '') {
  const parts = String(name).trim().split(/[\s@._-]+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, seed, size = 36 }) {
  let h = 0;
  for (const ch of String(seed || name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = TONES[h % TONES.length];
  return (
    <span className="gh-avatar" aria-hidden="true"
          style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.38) }}>
      {initials(name)}
    </span>
  );
}
