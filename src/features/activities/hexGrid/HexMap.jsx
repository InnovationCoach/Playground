/**
 * The floating city, drawn as pointy-top hexes in SVG.
 *
 * Overlays turn the same map into each role's view: what is where, how close
 * each platform is to its safe load, which homes sit next to a smelly plant,
 * and how far each home is from a transport hub.
 */
import { MODULES, NUISANCE, DIRS, hexKey, hexDistance } from './hexGridModel.js';

const R = 30; // px radius of one hex on screen
const SQ3 = Math.sqrt(3);

function corners(cx, cy) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/** Green → amber → red as a platform nears and passes its safe load. */
function loadColour(use) {
  if (!Number.isFinite(use) || use > 100) return '#dc2626';
  if (use > 85) return '#f97316';
  if (use > 60) return '#eab308';
  return '#16a34a';
}

export const OVERLAYS = {
  modules: 'What is where',
  load: 'Platform load (weight)',
  nuisance: 'Smell & noise near homes',
  walk: 'Walk to transport hub'
};

export function HexMap({ sim, selected, onSelect, overlay = 'modules', highlightRole }) {
  const byKey = new Map(sim.hexes.map((h) => [hexKey(h.q, h.r), h]));
  const hubs = sim.hexes.filter((h) => h.type === 'hub');

  const fillFor = (h) => {
    if (overlay === 'load') return h.type === 'open' ? '#1e293b' : loadColour(h.use);
    if (overlay === 'nuisance') {
      if (NUISANCE.has(h.type)) return '#a16207';
      if (h.type === 'housing') {
        const bad = DIRS.some(([dq, dr]) => NUISANCE.has(byKey.get(hexKey(h.q + dq, h.r + dr))?.type));
        return bad ? '#dc2626' : '#16a34a';
      }
      return '#1e293b';
    }
    if (overlay === 'walk') {
      if (h.type === 'hub') return '#ef4444';
      if (h.type !== 'housing') return '#1e293b';
      const d = hubs.length ? Math.min(...hubs.map((b) => hexDistance(h, b))) : Infinity;
      return d <= 1 ? '#16a34a' : d <= 2 ? '#eab308' : '#dc2626';
    }
    return MODULES[h.type].colour;
  };

  const label = (h) => {
    if (overlay === 'load' && h.type !== 'open') return Number.isFinite(h.use) ? `${Math.round(h.use)}%` : '!';
    return MODULES[h.type].icon;
  };

  const pts = sim.hexes.map((h) => ({ h, x: R * SQ3 * (h.q + h.r / 2), y: R * 1.5 * h.r }));
  const pad = R + 6;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;

  return (
    <svg
      className="hx-map"
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      role="group"
      aria-label="Floating city map. Choose a hex to change it."
    >
      <defs>
        <radialGradient id="hx-sea" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
      </defs>
      <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#hx-sea)" rx="18" />
      {pts.map(({ h, x, y }) => {
        const key = hexKey(h.q, h.r);
        const isSel = selected === key;
        const mine = highlightRole && MODULES[h.type].roles.includes(highlightRole);
        return (
          <g
            key={key}
            className={`hx-hex${isSel ? ' is-sel' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={isSel}
            aria-label={`Hex ${key}: ${MODULES[h.type].label}${h.type !== 'open' ? `, ${Math.round(h.use)}% of safe load` : ''}`}
            onClick={() => onSelect(key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(key); } }}
          >
            <polygon
              points={corners(x, y)}
              fill={fillFor(h)}
              fillOpacity={overlay === 'modules' && h.type === 'open' ? 0.5 : 0.9}
              stroke={isSel ? '#fde047' : mine && overlay === 'modules' ? '#f8fafc' : '#0f172a'}
              strokeWidth={isSel ? 3.5 : mine && overlay === 'modules' ? 2 : 1.5}
            />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={overlay === 'load' && h.type !== 'open' ? 11 : 17}
              fill="#fff" fontWeight="700" pointerEvents="none">
              {label(h)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
