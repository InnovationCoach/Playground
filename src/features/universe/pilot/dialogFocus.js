import { useEffect, useRef } from 'react';

const CANDIDATES = 'a[href], button, input, select, textarea, summary, [tabindex]';

function reachable(el) {
  if (el.disabled || el.tabIndex < 0 || el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  // Controls inside a closed <details> can't take focus; its own <summary> can.
  const closed = el.parentElement?.closest('details:not([open])');
  if (closed && !(el.tagName === 'SUMMARY' && el.parentElement === closed)) return false;
  if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkVisibilityCSS: true });
  const style = globalThis.getComputedStyle?.(el);
  return !style || (style.display !== 'none' && style.visibility !== 'hidden');
}

/** Controls Tab would visit inside `root`, in order, read fresh each time (contents change while the sheet is open). */
export function tabStops(root) {
  const seen = new Set();
  return [...root.querySelectorAll(CANDIDATES)].filter(reachable).filter((el) => {
    // A radio group is one stop: its checked radio, or its first when none is checked.
    if (el.type !== 'radio' || !el.name) return true;
    const group = el.form ? el.form.elements.namedItem(el.name) : null;
    const radios = group && group.length ? [...group] : [...root.querySelectorAll(`input[type="radio"][name="${el.name.replace(/["\\]/g, '\\$&')}"]`)];
    const stop = radios.find((r) => r.checked && reachable(r)) || radios.find(reachable);
    if (stop !== el || seen.has(el.name)) return false;
    seen.add(el.name);
    return true;
  });
}

/**
 * Modal focus for a sheet: Tab and Shift+Tab stay inside it, focus that lands outside it
 * returns to `startRef` (its heading), Escape closes it, and on
 * close focus returns to the control that opened it if that control is still on the page.
 * Returns the keydown handler for the dialog element.
 */
export function useDialogFocus(ref, onClose, startRef = null) {
  // Read on the first render, before any effect (such as focusing the sheet's heading) moves focus.
  const opener = useRef(undefined);
  if (opener.current === undefined) opener.current = typeof document === 'undefined' ? null : document.activeElement;
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    // Focus that lands outside the open sheet (a click behind it, or the explorer focusing its own
    // heading after the sheet mounted) comes back to the sheet's start, so Tab never reaches the page behind.
    const onFocusIn = (e) => {
      const root = ref.current;
      if (!root || !root.isConnected || root.contains(e.target)) return;
      (startRef?.current || tabStops(root)[0] || root).focus();
    };
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      const el = opener.current;
      if (el && el !== document.body && el.isConnected && typeof el.focus === 'function' && reachable(el)) el.focus();
    };
  }, []);
  return (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close.current?.(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const stops = tabStops(ref.current);
    e.stopPropagation();
    if (!stops.length) { e.preventDefault(); return; }
    const first = stops[0], last = stops[stops.length - 1], active = document.activeElement, at = stops.indexOf(active);
    // A focused control that isn't a stop of its own (an unchecked radio) moves normally.
    if (at === -1 && active !== ref.current && ref.current.contains(active) && active.tabIndex >= 0) return;
    if (e.shiftKey && at <= 0) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === -1 || at === stops.length - 1)) { e.preventDefault(); first.focus(); }
  };
}
