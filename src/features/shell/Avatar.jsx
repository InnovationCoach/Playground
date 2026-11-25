import {
  AVATAR_ACCESSORIES,
  AVATAR_BG_THEMES,
  AVATAR_CHARACTERS,
  AVATAR_ICONS,
  AVATAR_RINGS,
  sanitizeAvatarConfig
} from './avatarModel.js';

/**
 * Initials + creative custom avatar renderer.
 * When `avatar` is omitted/null, falls back to a deterministic pastel initials badge.
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

function renderEyes(eyes) {
  switch (eyes) {
    case 'cool':
      return (
        <g>
          <rect x="20" y="29" width="10" height="6" rx="2" fill="#0f172a" />
          <rect x="34" y="29" width="10" height="6" rx="2" fill="#0f172a" />
          <line x1="30" y1="31" x2="34" y2="31" stroke="#0f172a" strokeWidth="2" />
          <path d="M26 41 Q32 45 38 41" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'wink':
      return (
        <g>
          <circle cx="25" cy="32" r="2.6" fill="#0f172a" />
          <path d="M35 32 Q38 29 41 32" fill="none" stroke="#0f172a" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M26 40 Q32 45 38 40" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'starry':
      return (
        <g>
          <text x="25" y="35" textAnchor="middle" fontSize="8" fill="#0f172a">★</text>
          <text x="39" y="35" textAnchor="middle" fontSize="8" fill="#0f172a">★</text>
          <path d="M25 40 Q32 46 39 40" fill="none" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'curious':
      return (
        <g>
          <circle cx="25" cy="32" r="3" fill="#0f172a" />
          <circle cx="39" cy="31" r="3.6" fill="#0f172a" />
          <circle cx="26" cy="31" r="1" fill="#fff" />
          <circle cx="40" cy="30" r="1.2" fill="#fff" />
          <circle cx="32" cy="41" r="2.2" fill="#1e293b" />
        </g>
      );
    case 'focused':
      return (
        <g>
          <line x1="21" y1="27" x2="29" y2="29" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="27" x2="35" y2="29" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="33" r="2.4" fill="#0f172a" />
          <circle cx="39" cy="33" r="2.4" fill="#0f172a" />
          <line x1="27" y1="41" x2="37" y2="41" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'happy':
    default:
      return (
        <g>
          <circle cx="25" cy="32" r="2.7" fill="#0f172a" />
          <circle cx="39" cy="32" r="2.7" fill="#0f172a" />
          <circle cx="26" cy="31" r="0.9" fill="#ffffff" />
          <circle cx="40" cy="31" r="0.9" fill="#ffffff" />
          <path d="M25 40 Q32 46 39 40" fill="none" stroke="#1e293b" strokeWidth="2.3" strokeLinecap="round" />
        </g>
      );
  }
}

function renderHat(hat) {
  switch (hat) {
    case 'cap':
      return (
        <g>
          <path d="M16 23 Q32 10 48 23 Z" fill="#2563eb" />
          <path d="M16 23 L53 24 Q49 27 32 25 Z" fill="#1d4ed8" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M16 24 Q32 8 48 24 Z" fill="#ef4444" />
          <rect x="15" y="21" width="34" height="5" rx="2.5" fill="#dc2626" />
          <circle cx="32" cy="11" r="3.5" fill="#fca5a5" />
        </g>
      );
    case 'helmet':
      return (
        <g>
          <circle cx="32" cy="33" r="21" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <path d="M18 22 Q32 14 46 22" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'wizard':
      return (
        <g>
          <polygon points="32,4 20,23 44,23" fill="#6d28d9" />
          <ellipse cx="32" cy="23" rx="18" ry="3.5" fill="#5b21b6" />
          <text x="32" y="18" textAnchor="middle" fontSize="7" fill="#fde047">★</text>
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M13 33 Q13 13 32 13 Q51 13 51 33" fill="none" stroke="#1e293b" strokeWidth="3.5" />
          <rect x="10" y="28" width="6" height="12" rx="3" fill="#ec4899" />
          <rect x="48" y="28" width="6" height="12" rx="3" fill="#ec4899" />
        </g>
      );
    case 'crown':
      return (
        <polygon points="18,22 21,11 27,17 32,9 37,17 43,11 46,22" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      );
    case 'flower':
      return (
        <g>
          <path d="M32 18 Q32 11 36 9" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="37" cy="9" rx="4" ry="2.2" fill="#22c55e" transform="rotate(-20 37 9)" />
          <ellipse cx="29" cy="11" rx="3.5" ry="2" fill="#4ade80" transform="rotate(25 29 11)" />
        </g>
      );
    default:
      return null;
  }
}

function renderEars(ear, color) {
  if (ear === 'pointed') {
    return (
      <g>
        <polygon points="16,25 18,12 27,20" fill={color} />
        <polygon points="48,25 46,12 37,20" fill={color} />
      </g>
    );
  }
  if (ear === 'panda') {
    return (
      <g>
        <circle cx="19" cy="19" r="6" fill="#0f172a" />
        <circle cx="45" cy="19" r="6" fill="#0f172a" />
      </g>
    );
  }
  if (ear === 'antenna') {
    return (
      <g>
        <line x1="32" y1="16" x2="32" y2="9" stroke="#e2e8f0" strokeWidth="2.4" />
        <circle cx="32" cy="8" r="3" fill="#fde047" />
      </g>
    );
  }
  if (ear === 'tuft') {
    return (
      <g>
        <polygon points="17,22 15,13 24,18" fill={color} />
        <polygon points="47,22 49,13 40,18" fill={color} />
      </g>
    );
  }
  if (ear === 'round') {
    return (
      <g>
        <circle cx="15" cy="34" r="4" fill={color} />
        <circle cx="49" cy="34" r="4" fill={color} />
      </g>
    );
  }
  return null;
}

function CharacterAvatar({ cfg, size, ringCss }) {
  const bg = AVATAR_BG_THEMES.find((t) => t.id === cfg.bg) || AVATAR_BG_THEMES[0];
  const char = AVATAR_CHARACTERS.find((c) => c.id === cfg.character) || AVATAR_CHARACTERS[0];
  const acc = AVATAR_ACCESSORIES.find((a) => a.id === cfg.accessory);
  const gradId = `av-grad-${cfg.bg}-${cfg.character}`;

  return (
    <span
      className="gh-avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        padding: 0,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${bg.from}, ${bg.to})`,
        boxShadow: ringCss !== 'none' ? ringCss : undefined
      }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bg.from} />
            <stop offset="100%" stopColor={bg.to} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill={`url(#${gradId})`} />
        {renderEars(char.ear, char.color)}
        {cfg.character === 'bot' ? (
          <rect x="16" y="18" width="32" height="30" rx="9" fill={char.color} />
        ) : (
          <circle cx="32" cy="34" r="16" fill={char.color} />
        )}
        {cfg.character === 'panda' && (
          <g opacity="0.2">
            <ellipse cx="25" cy="32" rx="5" ry="4" fill="#0f172a" />
            <ellipse cx="39" cy="32" rx="5" ry="4" fill="#0f172a" />
          </g>
        )}
        {cfg.character === 'fox' && (
          <path d="M18 39 Q32 49 46 39 Q43 50 32 50 Q21 50 18 39 Z" fill="#fff7ed" opacity="0.85" />
        )}
        {renderEyes(cfg.eyes)}
        {renderHat(cfg.hat)}
        {acc?.glyph && (
          <text x="51" y="55" textAnchor="middle" fontSize="13">
            {acc.glyph}
          </text>
        )}
      </svg>
    </span>
  );
}

function MonogramPattern({ pattern }) {
  if (pattern === 'dots') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.22 }}>
        <circle cx="14" cy="14" r="3" fill="#fff" />
        <circle cx="50" cy="16" r="2.5" fill="#fff" />
        <circle cx="16" cy="48" r="2.5" fill="#fff" />
        <circle cx="50" cy="50" r="3" fill="#fff" />
      </svg>
    );
  }
  if (pattern === 'stars') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <text x="12" y="18" fontSize="8" fill="#fff">✦</text>
        <text x="46" y="20" fontSize="7" fill="#fff">✦</text>
        <text x="44" y="52" fontSize="9" fill="#fff">✦</text>
      </svg>
    );
  }
  if (pattern === 'stripes') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <path d="M-4 20 Q16 10 32 20 T68 20" fill="none" stroke="#fff" strokeWidth="3" />
        <path d="M-4 46 Q16 36 32 46 T68 46" fill="none" stroke="#fff" strokeWidth="3" />
      </svg>
    );
  }
  if (pattern === 'grid') {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
        <path d="M20 0 V64 M44 0 V64 M0 20 H64 M0 44 H64" stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }
  return null;
}

export function Avatar({ name, seed, size = 36, avatar = null }) {
  const cfg = sanitizeAvatarConfig(avatar);
  if (cfg) {
    const bg = AVATAR_BG_THEMES.find((t) => t.id === cfg.bg) || AVATAR_BG_THEMES[0];
    const ringCss = AVATAR_RINGS.find((r) => r.id === cfg.ring)?.css || 'none';

    if (cfg.mode === 'character') {
      return <CharacterAvatar cfg={cfg} size={size} ringCss={ringCss} />;
    }

    if (cfg.mode === 'icon') {
      const icon = AVATAR_ICONS.find((i) => i.id === cfg.icon) || AVATAR_ICONS[0];
      return (
        <span
          className="gh-avatar"
          aria-hidden="true"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, ${bg.from}, ${bg.to})`,
            color: bg.text,
            fontSize: Math.round(size * 0.52),
            boxShadow: ringCss !== 'none' ? ringCss : undefined
          }}
        >
          {icon.glyph}
        </span>
      );
    }

    return (
      <span
        className="gh-avatar"
        aria-hidden="true"
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${bg.from}, ${bg.to})`,
          color: bg.text,
          fontSize: Math.round(size * 0.38),
          boxShadow: ringCss !== 'none' ? ringCss : undefined
        }}
      >
        <MonogramPattern pattern={cfg.pattern} />
        <span style={{ position: 'relative', zIndex: 1 }}>{initials(name)}</span>
      </span>
    );
  }

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
