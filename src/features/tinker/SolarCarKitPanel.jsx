import React from 'react';
import { Car, Plus } from 'lucide-react';
import { SOLAR_CAR_KITS, SOLAR_CAR_PARTS } from './solarCarKit.js';

export function SolarCarKitPanel({ onLoadKit, onAddPart }) {
  const categories = ['Chassis', 'Tires', 'Solar & Drive'];

  return (
    <>
      <div className="tks-section">
        <div>
          <h3 className="tks-heading">Solar Car Engineering Kits</h3>
          <span className="tks-hint">Loading a kit replaces what is on the bed.</span>
        </div>
        {Object.values(SOLAR_CAR_KITS).map((kit) => (
          <button
            key={kit.id}
            type="button"
            className="tks-kit"
            onClick={() => onLoadKit && onLoadKit(kit)}
          >
            <span className="tks-kit-icon" aria-hidden="true"><Car size={18} /></span>
            <span>
              <span className="tks-kit-name">{kit.name}</span>
              <span className="tks-kit-summary">{kit.summary}</span>
            </span>
          </button>
        ))}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="tks-section">
          <div className="tks-eyebrow"><span>Add {cat}</span></div>
          <div className="tks-inline-wrap">
            {SOLAR_CAR_PARTS.filter((p) => p.category === cat).map((part) => (
              <button
                key={part.name}
                type="button"
                className="tks-part"
                onClick={() => onAddPart && onAddPart(part)}
              >
                <Plus size={12} /> {part.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
