import React, { useState } from 'react';
import { X, Trash2, Check, PenTool } from 'lucide-react';
import './tinkerStudio.css';
import { buildSketchShape } from './combineUtils.js';

const PRESET_SKETCHES = {
  aero_chassis: [
    [-65, -20], [50, -24], [72, 0], [50, 24], [-65, 20]
  ],
  star_badge: [
    [0, -35], [10, -10], [35, -10], [15, 6], [24, 32],
    [0, 16], [-24, 32], [-15, 6], [-35, -10], [-10, -10]
  ],
  spoiler_fin: [
    [-30, 20], [-10, -25], [30, -25], [22, 20]
  ]
};

/**
 * Interactive 2D Sketch-to-3D Extrude pad: click to plot vertices on a millimeter grid
 * or load a starter profile, then extrude into a 3D mesh on the workplane.
 */
export function SketchTo3DModal({ onExtrude, onClose }) {
  const [points, setPoints] = useState(PRESET_SKETCHES.aero_chassis);
  const [name, setName] = useState('Custom Sketch Part');
  const [heightMm, setHeightMm] = useState(10);
  const [color, setColor] = useState('#7c3aed');
  const [isHole, setIsHole] = useState(false);

  const handleSvgClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 200 - 100;
    const ny = ((e.clientY - rect.top) / rect.height) * 140 - 70;
    const snappedX = Math.round(nx / 5) * 5;
    const snappedY = Math.round(ny / 5) * 5;
    setPoints((prev) => [...prev, [snappedX, snappedY]]);
  };

  const handleConfirm = () => {
    const shape = buildSketchShape(points, { name, heightMm, color, isHole });
    if (shape && onExtrude) {
      onExtrude(shape);
      onClose();
    }
  };

  const polyStr = points.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <div className="tks-modal-backdrop">
      <div className="tks-modal" role="dialog" aria-modal="true" aria-label="Sketch to 3D Model">
        <div className="tks-modal-head">
          <div>
            <h3><PenTool size={16} color="#a78bfa" /> Sketch to 3D Model</h3>
            <span className="tks-hint">
              Click on the 5 mm grid to plot points, or pick a starter profile, then extrude into 3D.
            </span>
          </div>
          <button type="button" className="tks-btn tks-btn--icon" onClick={onClose} aria-label="Close Sketch Pad">
            <X size={16} />
          </button>
        </div>

        {/* Starter Sketch Profiles */}
        <div className="tks-inline-wrap">
          <span className="tks-eyebrow" style={{ marginRight: 4 }}>Profiles</span>
          <button type="button" className="tks-chip" onClick={() => setPoints(PRESET_SKETCHES.aero_chassis)}>Aero Car Body</button>
          <button type="button" className="tks-chip" onClick={() => setPoints(PRESET_SKETCHES.spoiler_fin)}>Spoiler Fin</button>
          <button type="button" className="tks-chip" onClick={() => setPoints(PRESET_SKETCHES.star_badge)}>Star Badge</button>
          <button type="button" className="tks-btn tks-btn--sm tks-btn--danger" onClick={() => setPoints([])} style={{ marginLeft: 'auto' }}>
            <Trash2 size={12} /> Clear points
          </button>
        </div>

        {/* Interactive 2D Grid Canvas */}
        <svg viewBox="-100 -70 200 140" onClick={handleSvgClick} className="tks-sketch-pad">
          <defs>
            <pattern id="sketchGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-100" y="-70" width="200" height="140" fill="url(#sketchGrid)" />
          <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.6" />
          <line x1="0" y1="-70" x2="0" y2="70" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.6" />
          {points.length >= 3 && (
            <polygon points={polyStr} fill="rgba(124, 58, 237, 0.32)" stroke="#a78bfa" strokeWidth="1.2" />
          )}
          {points.length === 2 && (
            <polyline points={polyStr} fill="none" stroke="#a78bfa" strokeWidth="1.2" />
          )}
          {points.map(([px, py], idx) => (
            <circle key={idx} cx={px} cy={py} r="2.2" fill={idx === 0 ? '#10b981' : '#f59e0b'} />
          ))}
        </svg>

        {/* Extrude Settings */}
        <div className="tks-modal-foot">
          <input
            type="text"
            className="tks-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Part name"
            aria-label="Part name"
          />
          <label>
            Height <strong className="tks-num" style={{ color: '#38bdf8' }}>{heightMm} mm</strong>
            <input type="range" min={2} max={60} value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} />
          </label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="Part colour" aria-label="Part colour" />
          <label>
            <input type="checkbox" checked={isHole} onChange={(e) => setIsHole(e.target.checked)} />
            Hole cutter
          </label>
          <button
            type="button"
            className="tks-btn tks-btn--primary"
            disabled={points.length < 3}
            onClick={handleConfirm}
            style={{ marginLeft: 'auto' }}
          >
            <Check size={14} /> Extrude to 3D <span className="tks-count">{points.length} pts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
