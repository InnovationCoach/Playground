/**
 * A round "microscope view" to draw in.
 *
 * Drawing what you see is how biologists recorded microscopy long before
 * cameras, and it asks for no writing at all. The circle matches what the
 * learner sees down the eyepiece, so she draws the view rather than a picture.
 *
 * Saved as a small JPEG data URL (240 px square, ~5-10 KB) on every stroke end,
 * so it fits inside the lab book's Firestore document.
 */
import { useEffect, useRef, useState } from 'react';

const SIZE = 240;
const BACKGROUND = '#fdfbe9'; // the warm white of a lit microscope field
const PENS = [
  { id: 'black', colour: '#1f2937', label: 'Black' },
  { id: 'green', colour: '#16a34a', label: 'Green' },
  { id: 'purple', colour: '#9333ea', label: 'Purple' },
  { id: 'brown', colour: '#a16207', label: 'Brown' },
  { id: 'red', colour: '#e11d48', label: 'Red' },
  { id: 'blue', colour: '#2563eb', label: 'Blue' }
];

function clear(ctx) {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

export function DrawPad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [pen, setPen] = useState(PENS[0]);
  const [eraser, setEraser] = useState(false);
  const [thick, setThick] = useState(false);

  const lastSaved = useRef(null);

  // Paint the stored drawing when the pad appears or another sample's drawing
  // is shown. Our own saves are skipped: the canvas already holds them, and an
  // async reload could paint over a stroke started a moment after lifting.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || (value && value === lastSaved.current)) return;
    clear(ctx);
    if (!value) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, SIZE, SIZE);
    img.src = value;
  }, [value]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE
    };
  };

  const stroke = (from, to) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip(); // keep ink inside the round view
    ctx.strokeStyle = eraser ? BACKGROUND : pen.colour;
    ctx.lineWidth = eraser ? 18 : thick ? 7 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    stroke(last.current, last.current);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = point(e);
    stroke(last.current, p);
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastSaved.current = canvasRef.current.toDataURL('image/jpeg', 0.7);
    onChange(lastSaved.current);
  };

  return (
    <div className="pl-draw">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="pl-canvas"
        aria-label="Drawing space. Draw what you see in the microscope."
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <div className="pl-pens">
        {PENS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pl-pen${!eraser && pen.id === p.id ? ' is-on' : ''}`}
            style={{ background: p.colour }}
            aria-label={`${p.label} pen`}
            aria-pressed={!eraser && pen.id === p.id}
            onClick={() => { setPen(p); setEraser(false); }}
          />
        ))}
        <button type="button" className={`pl-btn${thick ? ' is-on' : ''}`} aria-pressed={thick} onClick={() => setThick((t) => !t)}>
          {thick ? '✏️ Thick' : '✏️ Thin'}
        </button>
        <button type="button" className={`pl-btn${eraser ? ' is-on' : ''}`} aria-pressed={eraser} onClick={() => setEraser((x) => !x)}>
          🧽 Rubber
        </button>
        <button type="button" className="pl-btn ghost" onClick={() => {
          if (value && !window.confirm('Clear your drawing?')) return;
          clear(canvasRef.current.getContext('2d'));
          onChange(null);
        }}>🗑️ Clear</button>
      </div>
    </div>
  );
}
