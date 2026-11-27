/**
 * UrbanHeatBoard - Unified 3D Isometric / Accessible 2D City Grid wrapper.
 *
 * Defaults to the interactive 3D isometric board on WebGL-capable devices,
 * with a one-tap 2D/3D toggle for low-power devices or keyboard/accessible
 * workflows, and automatic 2D fallback when WebGL is unavailable (e.g. jsdom).
 */
import { useMemo, useRef, useState } from 'react';
import { Box, Eye, Hand, Paintbrush, RotateCcw, Wind } from 'lucide-react';
import { COLS, TILE_TYPES, stressBand } from './urbanHeatModel.js';
import { detectWebGLSupport } from './urbanHeat3DConstants.js';
import { UrbanHeatScene3D } from './UrbanHeatScene3D.jsx';

const deg = (v) => `${Number(v).toFixed(1)} °C`;

function nightColour(excess) {
  if (excess >= 2.5) return '#7f1d1d';
  if (excess >= 1.8) return '#dc2626';
  if (excess >= 1.2) return '#f97316';
  if (excess >= 0.6) return '#facc15';
  return '#22c55e';
}

function Grid2D({
  grid,
  heat,
  view,
  focus,
  marks,
  unreachable,
  onPaint,
  onStrokeStart,
  onInspect,
  inspected,
  nightRef
}) {
  const painting = useRef(false);
  const focusSet = useMemo(() => new Set(focus), [focus]);
  const markSet = useMemo(() => new Set(marks || []), [marks]);
  const unreachableSet = useMemo(() => new Set(unreachable || []), [unreachable]);

  return (
    <div
      className="uh-grid"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      onPointerLeave={() => { painting.current = false; }}
      onPointerUp={() => { painting.current = false; }}
      role="grid"
      aria-label="District map, 8 by 6 blocks"
    >
      {grid.map((code, i) => {
        const t = TILE_TYPES[code];
        const h = heat?.tiles[i];
        let bg = t.color;
        let label = null;
        if (view === 'day' && h) { bg = stressBand(h.feelsDay).color; label = Math.round(h.feelsDay); }
        if (view === 'night' && h) { bg = nightColour(h.airNight - nightRef); label = `+${Math.max(0, h.airNight - nightRef).toFixed(1)}`; }
        if (view === 'surface' && h) {
          bg = h.surfaceDay >= 50 ? '#7f1d1d' : h.surfaceDay >= 42 ? '#dc2626' : h.surfaceDay >= 36 ? '#f97316' : h.surfaceDay >= 32 ? '#facc15' : '#22c55e';
          label = Math.round(h.surfaceDay);
        }
        const cls = ['uh-tile'];
        if (focusSet.has(i)) cls.push('is-focus');
        if (markSet.has(i)) cls.push('is-marked');
        if (unreachableSet.has(i)) cls.push('is-cutoff');
        if (inspected === i) cls.push('is-inspected');
        if (view !== 'map') cls.push('is-heat');
        const desc = `${t.label}${h ? `, feels ${deg(h.feelsDay)} at 3 pm` : ''}${focusSet.has(i) ? ', focus area' : ''}${unreachableSet.has(i) ? ', cut off from the streets' : ''}`;
        return (
          <button
            key={i}
            type="button"
            className={cls.join(' ')}
            style={{ background: bg }}
            aria-label={desc}
            title={desc}
            onPointerDown={(e) => {
              e.preventDefault();
              painting.current = true;
              onStrokeStart?.();
              onPaint?.(i);
              onInspect?.(i);
            }}
            onPointerEnter={() => { if (painting.current) onPaint?.(i); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStrokeStart?.();
                onPaint?.(i);
                onInspect?.(i);
              }
            }}
          >
            <span className="uh-tile-emoji" aria-hidden="true">{t.emoji}</span>
            {label !== null && <span className="uh-tile-num">{label}</span>}
            {unreachableSet.has(i) && <span className="uh-tile-warn" aria-hidden="true">⚠️</span>}
          </button>
        );
      })}
    </div>
  );
}

export function UrbanHeatBoard({
  grid,
  heat,
  view = 'map',
  weatherId = 'breeze',
  focus = [],
  marks = [],
  unreachable = [],
  onPaint,
  onStrokeStart,
  onInspect,
  inspected = null,
  nightRef = 25
}) {
  const webglAvailable = useMemo(() => detectWebGLSupport(), []);
  const [renderMode, setRenderMode] = useState(() => (webglAvailable ? '3d' : '2d'));
  const [interactionMode, setInteractionMode] = useState('paint'); // 'paint' | 'orbit'
  const [showBreeze, setShowBreeze] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);
  const [hoveredTile, setHoveredTile] = useState(null);

  const is3D = webglAvailable && renderMode === '3d';
  const hoveredCode = hoveredTile !== null ? grid[hoveredTile] : null;
  const hoveredInfo = hoveredCode ? TILE_TYPES[hoveredCode] : null;
  const hoveredHeat = hoveredTile !== null ? heat?.tiles?.[hoveredTile] : null;

  return (
    <div className="uh-map-wrap">
      <div className="uh-compass">
        <span aria-hidden="true">N ↑</span>
        <span className="uh-breeze" aria-hidden="true">
          {weatherId === 'heatwave' ? '🔥 calm heatwave (1 m/s)' : '🌬️ sea breeze from the north-east ↙'}
        </span>
        <div className="uh-mode-switch">
          <button
            type="button"
            className={`uh-mode-btn ${is3D ? 'is-on' : ''}`}
            disabled={!webglAvailable}
            data-testid="uh-toggle-3d"
            aria-pressed={is3D}
            onClick={() => setRenderMode('3d')}
            title={webglAvailable ? 'Switch to 3D isometric view' : 'WebGL not supported on this device'}
          >
            <Box size={13} aria-hidden="true" /> 3D
          </button>
          <button
            type="button"
            className={`uh-mode-btn ${!is3D ? 'is-on' : ''}`}
            data-testid="uh-toggle-2d"
            aria-pressed={!is3D}
            onClick={() => setRenderMode('2d')}
            title="Switch to flat 2D grid view"
          >
            <Eye size={13} aria-hidden="true" /> 2D
          </button>
        </div>
      </div>

      {is3D ? (
        <div className={`uh-3d-stage ${view === 'night' ? 'is-night' : ''}`}>
          <UrbanHeatScene3D
            grid={grid}
            heat={heat}
            view={view}
            weatherId={weatherId}
            focus={focus}
            marks={marks}
            unreachable={unreachable}
            inspected={inspected}
            nightRef={nightRef}
            interactionMode={interactionMode}
            showBreeze={showBreeze}
            resetSignal={resetSignal}
            onHoverTile={setHoveredTile}
            onPaint={onPaint}
            onStrokeStart={onStrokeStart}
            onInspect={onInspect}
          />

          {/* Floating 3D Controls HUD */}
          <div className="uh-3d-hud" role="toolbar" aria-label="3D map controls">
            <button
              type="button"
              className={`uh-hud-btn ${interactionMode === 'paint' ? 'is-on' : ''}`}
              onClick={() => setInteractionMode('paint')}
              aria-pressed={interactionMode === 'paint'}
              title="Tap or drag to paint tiles"
            >
              <Paintbrush size={13} aria-hidden="true" /> Paint
            </button>
            <button
              type="button"
              className={`uh-hud-btn ${interactionMode === 'orbit' ? 'is-on' : ''}`}
              onClick={() => setInteractionMode('orbit')}
              aria-pressed={interactionMode === 'orbit'}
              title="Drag to rotate or pan the 3D city"
            >
              <Hand size={13} aria-hidden="true" /> Orbit
            </button>
            <button
              type="button"
              className={`uh-hud-btn ${showBreeze ? 'is-on' : ''}`}
              onClick={() => setShowBreeze((v) => !v)}
              aria-pressed={showBreeze}
              title="Toggle north-east sea breeze ribbons"
            >
              <Wind size={13} aria-hidden="true" /> Breeze
            </button>
            <button
              type="button"
              className="uh-hud-btn"
              onClick={() => setResetSignal((n) => n + 1)}
              title="Reset isometric camera angle"
            >
              <RotateCcw size={13} aria-hidden="true" />
            </button>
          </div>

          {/* Live Hover Pill (respects Predict stage: hides numbers when heat is null) */}
          {hoveredInfo && (
            <div className="uh-3d-tooltip" aria-live="polite">
              <span>{hoveredInfo.emoji} <b>{hoveredInfo.short}</b></span>
              {hoveredHeat && view === 'surface' && (
                <span className="uh-3d-temp">Ground {deg(hoveredHeat.surfaceDay)}</span>
              )}
              {hoveredHeat && view === 'day' && (
                <span className="uh-3d-temp">Feels {deg(hoveredHeat.feelsDay)}</span>
              )}
              {hoveredHeat && view === 'night' && (
                <span className="uh-3d-temp">3 am +{Math.max(0, hoveredHeat.airNight - nightRef).toFixed(1)} °C</span>
              )}
              {hoveredHeat && view === 'map' && (
                <span className="uh-3d-temp">Feels {deg(hoveredHeat.feelsDay)}</span>
              )}
            </div>
          )}

          <div className="uh-3d-hint" aria-hidden="true">
            {interactionMode === 'paint'
              ? 'Click/drag to paint · Right-drag or 2 fingers to orbit · Scroll to zoom'
              : 'Drag to orbit · Scroll/pinch to zoom · Switch to Paint to edit tiles'}
          </div>
        </div>
      ) : (
        <Grid2D
          grid={grid}
          heat={heat}
          view={view}
          focus={focus}
          marks={marks}
          unreachable={unreachable}
          onPaint={onPaint}
          onStrokeStart={onStrokeStart}
          onInspect={onInspect}
          inspected={inspected}
          nightRef={nightRef}
        />
      )}
    </div>
  );
}

export default UrbanHeatBoard;
