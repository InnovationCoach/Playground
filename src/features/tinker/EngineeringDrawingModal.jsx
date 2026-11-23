import React from 'react';
import { X, Printer } from 'lucide-react';
import { computeEngineeringSpecs } from './solarCarKit.js';

/**
 * Orthographic 3-View Engineering Blueprint Sheet (Top Plan, Front Elevation, Side Elevation)
 * with millimeter dimension callouts and title block.
 */
export function EngineeringDrawingModal({ projectName, shapes, onClose }) {
  const specs = computeEngineeringSpecs(shapes);
  const solids = shapes.filter((s) => !s.isHole);

  const renderProjection = (title, mapRect, widthLabel, heightLabel) => (
    <div style={{ background: '#0b192e', border: '1px solid #38bdf8', borderRadius: '6px', padding: '0.45rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7dd3fc', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        <span>{widthLabel} × {heightLabel}</span>
      </div>
      <svg viewBox="-115 -65 230 130" style={{ width: '100%', height: '140px', background: '#071224', borderRadius: '4px' }}>
        <defs>
          <pattern id="bpGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="-115" y="-65" width="230" height="130" fill="url(#bpGrid)" />
        <line x1="-110" y1="0" x2="110" y2="0" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="3 2" strokeWidth="0.6" />
        <line x1="0" y1="-60" x2="0" y2="60" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="3 2" strokeWidth="0.6" />
        {solids.map((s) => {
          const r = mapRect(s);
          return (
            <rect
              key={s.id}
              x={r.x}
              y={r.y}
              width={Math.max(2, r.w)}
              height={Math.max(2, r.h)}
              fill="rgba(56, 189, 248, 0.14)"
              stroke="#e0f2fe"
              strokeWidth="0.9"
            />
          );
        })}
      </svg>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-label="Engineering Blueprint Drawing"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 23, 0.78)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 60,
        padding: '1rem'
      }}
    >
      <div style={{ width: 'min(860px, 100%)', background: '#0f172a', color: '#e2e8f0', border: '2px solid #38bdf8', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a5f', paddingBottom: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#e0f2fe' }}>📐 Engineering Drawing — {projectName}</h3>
            <span style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
              Orthographic Multi-View Projection (Units: mm • Scale 1:1)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" className="pt-chip" onClick={() => window.print()} style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Printer size={13} /> Print Sheet
            </button>
            <button type="button" className="pt-chip" onClick={onClose} aria-label="Close Blueprint">
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.65rem' }}>
          {renderProjection(
            'TOP VIEW (Plan)',
            (s) => ({ x: (s.x || 0) - (s.w || 10) / 2, y: (s.z || 0) - (s.d || 10) / 2, w: s.w || 10, h: s.d || 10 }),
            `${specs.lengthMm} mm`,
            `${specs.widthMm} mm`
          )}
          {renderProjection(
            'SIDE VIEW (Elevation)',
            (s) => ({ x: (s.x || 0) - (s.w || 10) / 2, y: -((s.y || 0) + (s.h || 10) / 2) + 25, w: s.w || 10, h: s.h || 10 }),
            `${specs.lengthMm} mm`,
            `${specs.heightMm} mm`
          )}
          {renderProjection(
            'FRONT VIEW (Profile)',
            (s) => ({ x: (s.z || 0) - (s.d || 10) / 2, y: -((s.y || 0) + (s.h || 10) / 2) + 25, w: s.d || 10, h: s.h || 10 }),
            `${specs.widthMm} mm`,
            `${specs.heightMm} mm`
          )}
        </div>

        {/* Engineering Title Block */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: '#0b192e', border: '1px solid #38bdf8', borderRadius: '6px', padding: '0.5rem', fontSize: '0.72rem' }}>
          <div><span style={{ color: '#7dd3fc' }}>Overall (L×W×H):</span><br /><strong>{specs.lengthMm} × {specs.widthMm} × {specs.heightMm} mm</strong></div>
          <div><span style={{ color: '#7dd3fc' }}>Solid Parts:</span><br /><strong>{specs.partCount} components</strong></div>
          <div><span style={{ color: '#7dd3fc' }}>Solar Array Area:</span><br /><strong>{specs.solarAreaCm2} cm²</strong></div>
          <div><span style={{ color: '#7dd3fc' }}>Print Bed Fit (200mm):</span><br /><strong style={{ color: specs.lengthMm <= 200 && specs.widthMm <= 200 ? '#34d399' : '#fbbf24' }}>{specs.lengthMm <= 200 && specs.widthMm <= 200 ? '✓ Fits 200×200 Bed' : '⚠ Split Needed'}</strong></div>
        </div>
      </div>
    </div>
  );
}
