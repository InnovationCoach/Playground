import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Interactive Precision Extraction Channel for Step 3.
 * Synchronizes pointer/keyboard movement with the 3D organ lift & tweezers,
 * and detects contact with the conductive cavity edges.
 */
export function ExtractionPad({ organ, onProgressChange, onSuccess, onEdgeTouch }) {
  const padRef = useRef(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.86 });
  const [dragging, setDragging] = useState(false);
  const [clearance, setClearance] = useState(1);
  const finishedRef = useRef(false);

  // Reset when organ changes
  useEffect(() => {
    finishedRef.current = false;
    setPos({ x: 0.5, y: 0.86 });
    setDragging(false);
    setClearance(1);
    onProgressChange?.(0, { x: 0, y: 0 });
  }, [organ.id, onProgressChange]);

  // Curved surgical channel centerline x(y) so each extraction requires steady steering.
  const centerAtY = useCallback((y) => {
    const wave = organ.id === 'lungs' || organ.id === 'large_intestine' ? 0.11 : 0.07;
    return 0.5 + Math.sin((1 - y) * Math.PI * 1.8) * wave;
  }, [organ.id]);

  const evaluatePosition = useCallback((nx, ny) => {
    if (finishedRef.current) return;
    const clampedX = Math.max(0.05, Math.min(0.95, nx));
    const clampedY = Math.max(0.06, Math.min(0.92, ny));
    setPos({ x: clampedX, y: clampedY });

    const progress = Math.max(0, Math.min(1, (0.86 - clampedY) / 0.72));
    const center = centerAtY(clampedY);
    const dist = Math.abs(clampedX - center);
    const ratio = Math.max(0, 1 - dist / organ.corridorWidth);
    setClearance(ratio);

    onProgressChange?.(progress, { x: clampedX - center, y: 0.86 - clampedY });

    if (dist >= organ.corridorWidth) {
      finishedRef.current = true;
      setDragging(false);
      onEdgeTouch?.();
      return;
    }

    if (clampedY <= 0.14) {
      finishedRef.current = true;
      setDragging(false);
      onSuccess?.();
    }
  }, [centerAtY, onEdgeTouch, onProgressChange, onSuccess, organ.corridorWidth]);

  const handlePointerMove = (e) => {
    if (!dragging || finishedRef.current || !padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    evaluatePosition(nx, ny);
  };

  const handleKeyDown = (e) => {
    if (finishedRef.current) return;
    const step = 0.035;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      evaluatePosition(pos.x, pos.y - step);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      evaluatePosition(pos.x, pos.y + step);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      evaluatePosition(pos.x - step, pos.y);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      evaluatePosition(pos.x + step, pos.y);
    }
  };

  // Build SVG path for the safe extraction corridor
  const samples = 24;
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i <= samples; i += 1) {
    const y = 0.12 + (i / samples) * 0.76;
    const cx = centerAtY(y);
    leftPts.push(`${((cx - organ.corridorWidth) * 100).toFixed(2)},${(y * 100).toFixed(2)}`);
    rightPts.unshift(`${((cx + organ.corridorWidth) * 100).toFixed(2)},${(y * 100).toFixed(2)}`);
  }
  const corridorPolygon = [...leftPts, ...rightPts].join(' ');
  const leftWall = leftPts.join(' ');
  const rightWall = [...rightPts].reverse().join(' ');

  const statusTone = clearance < 0.28 ? 'danger' : clearance < 0.55 ? 'warn' : 'safe';

  return (
    <div className="surg-extract-panel">
      <div className="surg-extract-head">
        <span>
          <strong>Step 3: Extract {organ.name}</strong> — Drag (or use Arrow keys) into the Surgical Tray
        </span>
        <span className={`surg-clearance-pill is-${statusTone}`}>
          Clearance: {Math.round(clearance * 100)}%
        </span>
      </div>

      <div
        ref={padRef}
        className="surg-extract-pad"
        tabIndex={0}
        role="application"
        aria-label={`Precision extraction channel for ${organ.name}. Grab the organ handle or use arrow keys to guide it up into the surgical tray without touching the conductive edges.`}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="surg-extract-svg" aria-hidden="true">
          <rect x="0" y="0" width="100" height="100" fill="rgba(15, 23, 42, 0.85)" />
          <polygon points={corridorPolygon} fill="rgba(56, 189, 248, 0.12)" />
          <rect x="20" y="5" width="60" height="10" rx="2" fill="rgba(34, 197, 94, 0.22)" stroke="#22c55e" strokeWidth="0.8" />
          <text x="50" y="11.5" textAnchor="middle" fontSize="4.2" fill="#86efac" fontWeight="700">
            SURGICAL TRAY (DROP ZONE)
          </text>
          <polyline points={leftWall} fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
          <polyline points={rightWall} fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>

        <button
          type="button"
          className={`surg-tweezer-handle ${dragging ? 'is-grabbed' : ''} is-${statusTone}`}
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
          }}
          aria-label={`Plastic tweezers holding ${organ.name}`}
        >
          <span>✂️</span>
          <small>{dragging ? 'Steady…' : 'Hold & Drag'}</small>
        </button>
      </div>
    </div>
  );
}
