/**
 * Small rewards for the goals page: a confetti burst on a canvas laid over the
 * page, and a short buzz on phones that support it. Both are skipped for
 * people who ask the OS for reduced motion.
 */
const COLOURS = ['#96d700', '#8250a0', '#9bd2ff', '#ffc94d', '#ae266c', '#ffffff'];

const reduced = () => typeof window === 'undefined'
  || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function buzz(pattern = 12) {
  if (reduced()) return;
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

/** Burst from a point (viewport px), or from the top centre. `big` for finished goals. */
export function confetti({ x, y, big = false } = {}) {
  if (reduced() || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.className = 'gl-confetti';
  // Inline so it works on any page, not only where goals.css is loaded.
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3000';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const ox = x ?? window.innerWidth / 2;
  const oy = y ?? window.innerHeight * 0.3;
  const parts = Array.from({ length: big ? 160 : 60 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (big ? 7 : 4.5) * (0.4 + Math.random());
    return {
      x: ox, y: oy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (big ? 5 : 3),
      size: 5 + Math.random() * 6, rot: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.3,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)], round: Math.random() < 0.3
    };
  });

  const life = big ? 2200 : 1300;
  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - t / life);
    for (const p of parts) {
      p.vy += 0.18; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.colour;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < life) requestAnimationFrame(frame); else canvas.remove();
  }
  requestAnimationFrame(frame);
}

/** Confetti from the centre of an element, e.g. the button that was pressed. */
export function confettiFrom(el, opts = {}) {
  const r = el?.getBoundingClientRect?.();
  confetti(r ? { ...opts, x: r.left + r.width / 2, y: r.top + r.height / 2 } : opts);
}
