import { useMemo } from 'react';
import { Shield, Sparkles, Award } from 'lucide-react';
import { ARCHETYPES, computeArchetypeProfile } from './archetypes.js';

/**
 * Visual SVG Radar / Skill Hexagon for Teen Superpowers.
 * Shows progression across Builder, Visionary, Diplomat, and Strategist.
 */
export function ArchetypeRadar({ plan }) {
  const profile = useMemo(() => computeArchetypeProfile(plan), [plan]);
  const { scores, primary, level, totalXp, title } = profile;

  // Radar geometry: center at (100, 100), radius 70
  // Top: Visionary (0 deg: x=100, y=30)
  // Right: Builder (90 deg: x=170, y=100)
  // Bottom: Strategist (180 deg: x=100, y=170)
  // Left: Diplomat (270 deg: x=30, y=100)
  const center = 100;
  const maxR = 68;

  // Convert scores (0-100) to points
  const pVisionary = { x: center, y: center - (scores.visionary / 100) * maxR };
  const pBuilder = { x: center + (scores.builder / 100) * maxR, y: center };
  const pStrategist = { x: center, y: center + (scores.strategist / 100) * maxR };
  const pDiplomat = { x: center - (scores.diplomat / 100) * maxR, y: center };

  const polygonPoints = `${pVisionary.x},${pVisionary.y} ${pBuilder.x},${pBuilder.y} ${pStrategist.x},${pStrategist.y} ${pDiplomat.x},${pDiplomat.y}`;

  return (
    <div className="gl-card gl-archetype-card">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble" style={{ background: primary.accentGlow, color: primary.color }}>
            <Award size={18} aria-hidden="true" />
          </span>
          <div>
            <div className="gl-title-row">
              <h2>Skill Tree & Archetype</h2>
              <span className="gl-level-badge" style={{ borderColor: primary.color, color: primary.color }}>
                Level {level}
              </span>
            </div>
            <p className="gl-subtitle">{title} • {totalXp} XP</p>
          </div>
        </div>
      </div>

      <div className="gl-radar-layout">
        {/* SVG Radar Chart */}
        <div className="gl-radar-chart-wrap" aria-label="Skill radar chart">
          <svg viewBox="0 0 200 200" className="gl-radar-svg">
            {/* Background concentric reference grids */}
            {[0.25, 0.5, 0.75, 1.0].map((scale) => {
              const r = maxR * scale;
              const points = `${center},${center - r} ${center + r},${center} ${center},${center + r} ${center - r},${center}`;
              return (
                <polygon
                  key={scale}
                  points={points}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray={scale === 1 ? 'none' : '2,2'}
                />
              );
            })}

            {/* Axes lines */}
            <line x1={center} y1={center - maxR} x2={center} y2={center + maxR} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
            <line x1={center - maxR} y1={center} x2={center + maxR} y2={center} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />

            {/* Glowing filled user polygon */}
            <polygon
              points={polygonPoints}
              fill="rgba(163, 255, 32, 0.22)"
              stroke="#a3ff20"
              strokeWidth="2.5"
              className="gl-radar-polygon"
            />

            {/* Glowing vertices */}
            <circle cx={pVisionary.x} cy={pVisionary.y} r="4.5" fill="#a855f7" stroke="#fff" strokeWidth="1.5" />
            <circle cx={pBuilder.x} cy={pBuilder.y} r="4.5" fill="#06b6d4" stroke="#fff" strokeWidth="1.5" />
            <circle cx={pStrategist.x} cy={pStrategist.y} r="4.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
            <circle cx={pDiplomat.x} cy={pDiplomat.y} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />

            {/* Axis labels */}
            <text x={center} y={center - maxR - 8} textAnchor="middle" className="gl-radar-label">🎨 Visionary</text>
            <text x={center + maxR + 8} y={center + 4} textAnchor="start" className="gl-radar-label">🛠️ Builder</text>
            <text x={center} y={center + maxR + 15} textAnchor="middle" className="gl-radar-label">🧠 Strategist</text>
            <text x={center - maxR - 8} y={center + 4} textAnchor="end" className="gl-radar-label">🤝 Diplomat</text>
          </svg>
        </div>

        {/* Archetype Breakdown Pill Grid */}
        <div className="gl-archetype-stats">
          {ARCHETYPES.map((arch) => {
            const val = scores[arch.id];
            const isPrimary = arch.id === primary.id;
            return (
              <div key={arch.id} className={`gl-archetype-row ${isPrimary ? 'is-primary' : ''}`}>
                <div className="gl-arch-info">
                  <span className="gl-arch-icon">{arch.icon}</span>
                  <div>
                    <span className="gl-arch-name">{arch.name}</span>
                    {isPrimary && <span className="gl-primary-tag">Primary</span>}
                  </div>
                </div>
                <div className="gl-arch-meter">
                  <div className="gl-arch-bar">
                    <div
                      className="gl-arch-bar-fill"
                      style={{ width: `${val}%`, backgroundColor: arch.color }}
                    />
                  </div>
                  <span className="gl-arch-val">{val}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
