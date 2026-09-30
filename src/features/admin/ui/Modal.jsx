import { useEffect, useRef } from 'react';

/**
 * Accessible dialog: labelled, Escape closes, focus moves in on open and back
 * to the opener on close, Tab stays inside.
 */
export function Modal({ title, onClose, children, footer, icon: Icon, tone }) {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const focusables = () => node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (node.querySelector('[autofocus]') || focusables()[0] || node).focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const els = Array.from(focusables()).filter((el) => !el.disabled);
      if (!els.length) return;
      const first = els[0]; const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="gh-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gh-modal" role="dialog" aria-modal="true" aria-labelledby="gh-modal-title" ref={ref} tabIndex={-1}>
        {Icon && <div className={`gh-modal-icon${tone ? ` gh-tone-${tone}` : ''}`} aria-hidden="true"><Icon size={22} /></div>}
        <h2 id="gh-modal-title">{title}</h2>
        {children}
        {footer && <div className="gh-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
