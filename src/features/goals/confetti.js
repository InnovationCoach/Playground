/**
 * Lightweight, DOM-based particle burst animation.
 * Zero external libraries, automatically cleans up after itself.
 */

const COLORS = ['#a3ff20', '#c084fc', '#facc15', '#38bdf8', '#f43f5e', '#ec4899'];

export function triggerSparkParticles(originElement, count = 20) {
  if (typeof window === 'undefined' || !originElement) return;

  const rect = originElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const container = document.createElement('div');
  container.className = 'gl-particle-container';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';

  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 85;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 20; // Slight upward bias
    const size = 6 + Math.random() * 6;
    const duration = 600 + Math.random() * 400;

    p.className = 'gl-spark-particle';
    p.style.position = 'absolute';
    p.style.left = `${centerX}px`;
    p.style.top = `${centerY}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.backgroundColor = color;
    p.style.borderRadius = Math.random() > 0.4 ? '50%' : '3px';
    p.style.boxShadow = `0 0 8px ${color}`;
    p.style.transform = 'translate(-50%, -50%) scale(0.5)';
    p.style.transition = `all ${duration}ms cubic-bezier(0.12, 0.8, 0.32, 1)`;

    container.appendChild(p);

    // Trigger animation next tick
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(1) rotate(${Math.random() * 360}deg)`;
      p.style.opacity = '0';
    });
  }

  // Cleanup after animation
  setTimeout(() => {
    container.remove();
  }, 1100);
}
