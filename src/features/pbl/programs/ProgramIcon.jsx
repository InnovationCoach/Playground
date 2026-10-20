import { Store, Clapperboard, Sparkles, Hand, Building2, Sprout, Droplets, Compass } from 'lucide-react';

/** Icons are named in catalog.js so the catalogue stays plain data. */
const ICONS = { Store, Clapperboard, Sparkles, Hand, Building2, Sprout, Droplets, Compass };

export function ProgramIcon({ name, size = 20 }) {
  const Icon = ICONS[name] || Compass;
  return <Icon size={size} aria-hidden="true" />;
}
