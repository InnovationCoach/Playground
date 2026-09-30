import { TreePalm, Shield, CodeXml, Waves, Sun, FlaskConical, Microscope, Hexagon, Compass, BookOpen } from 'lucide-react';

/**
 * One line icon and colour tone per activity, replacing the emoji in the
 * activity labels. Tones are tints of the brand palette. `fg` is dark enough
 * for 4.5:1 contrast on `bg`.
 */
const ICONS = {
  phase1: { Icon: TreePalm, bg: '#f2fadf', fg: '#4a6a00' },
  bunker: { Icon: Shield, bg: '#eef6ff', fg: '#1d5a8f' },
  coding: { Icon: CodeXml, bg: '#f5eefa', fg: '#6e3f8b' },
  bangkok: { Icon: Waves, bg: '#e8f4ff', fg: '#004f8a' },
  solar: { Icon: Sun, bg: '#fff6e0', fg: '#8a5700' },
  so2: { Icon: FlaskConical, bg: '#fbeaf2', fg: '#9a1f5e' },
  plants: { Icon: Microscope, bg: '#f2fadf', fg: '#4a6a00' },
  hexgrid: { Icon: Hexagon, bg: '#eef0fb', fg: '#3b4a9a' },
  junior: { Icon: Compass, bg: '#fdf0e6', fg: '#9a4a0f' }
};

const FALLBACK = { Icon: BookOpen, bg: '#f0f1f6', fg: '#4b5670' };

export const activityIcon = (id) => ICONS[id] || FALLBACK;

export function ActivityIcon({ id, size = 46, iconSize = 22, radius = 12 }) {
  const { Icon, bg, fg } = activityIcon(id);
  return (
    <span aria-hidden="true" style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon size={iconSize} strokeWidth={1.9} />
    </span>
  );
}

/** "🌴 Activity 1: Urban Heat" → { kicker: 'Activity 1', title: 'Urban Heat' }. */
export function parseActivityLabel(label) {
  const noEmoji = String(label).replace(/^\S+\s+/u, '');
  const m = /^(Activity \d+):\s*(.*)$/.exec(noEmoji);
  return m ? { kicker: m[1], title: m[2] } : { kicker: '', title: noEmoji };
}
