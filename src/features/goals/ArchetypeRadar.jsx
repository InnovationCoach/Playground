import { useMemo } from 'react';
import { Award } from 'lucide-react';
import { ARCHETYPES, computeArchetypeProfile } from './archetypes.js';

/**
 * The working styles a learner's own choices point to. Plain words only: these
 * come from what they picked, so they are never levels, scores or a test result.
 */
export function ArchetypeRadar({ plan }) {
  const { primary } = useMemo(() => computeArchetypeProfile(plan), [plan]);
  return (
    <div className="gl-card gl-archetype-card">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-purple"><Award size={18} aria-hidden="true" /></span>
          <div>
            <h2>How I like to work</h2>
            <p className="gl-subtitle">Based on what you’ve picked in your goals and in What helps me. It isn’t a test or a grade, and it can change.</p>
          </div>
        </div>
      </div>
      <ul className="gl-style-list">
        {ARCHETYPES.map((arch) => (
          <li key={arch.id} className="gl-style" data-primary={arch.id === primary.id || undefined}>
            <span className="gl-style-icon" aria-hidden="true">{arch.icon}</span>
            <div>
              <strong>{arch.name.replace(/^The /, '')}</strong>
              {arch.id === primary.id && <span className="gl-style-tag">Most like you right now</span>}
              <p>{arch.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
