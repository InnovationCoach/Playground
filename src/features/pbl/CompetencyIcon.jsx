import { Brain, Heart, Lightbulb, MessageSquare, Rocket, Sparkles, Target, Users } from 'lucide-react';

const DOMAIN_ICONS = { sdl: Target, ctps: Brain, lc: Users, ec: MessageSquare, ct: Lightbulb, sea: Heart, ent: Rocket };

/** The icon for a competency's domain. Decorative: the words beside it carry the meaning. */
export function CompetencyIcon({ domain, size = 16 }) {
  const Icon = DOMAIN_ICONS[domain] || Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}
