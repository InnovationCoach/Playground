import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, GalleryHorizontal, Paintbrush, ListChecks, Compass, ChartNoAxesCombined, PenTool, Orbit, Sparkles } from 'lucide-react';
import { SLIDES } from './slideModel.js';
import './dashboardDeck.css';
const SLIDE_ICONS = { daily: ListChecks, find: Compass, progress: ChartNoAxesCombined, creative: PenTool, universe: Orbit };

/** Native touch/trackpad scrolling; every panel stays mounted to preserve drafts/audio. */
export function DashboardDeck({ prefs, update, syncState, name, onPersonalise, renderSlide, active, onActive, stats = {} }) {
  const root = useRef(null), track = useRef(null), frame = useRef(null);
  const reduced = useRef(false), fromScroll = useRef(false);
  const [height, setHeight] = useState(null);
  const currentActive = useRef(active);
  currentActive.current = active;
  const grid = prefs.dashboardLayout === 'grid';
  const orderKey = prefs.slideOrder.join('|');
  const activeIndex = prefs.slideOrder.indexOf(active);
  const titleFor = (id) => prefs.slideTitles[id]?.trim() || SLIDES.find((slide) => slide.id === id).title;
  const measure = useCallback(() => {
    const top = Math.max(0, root.current?.getBoundingClientRect().top || 0);
    setHeight(Math.max(420, (window.visualViewport?.height || window.innerHeight) - top - 8));
  }, []);
  const scrollToSlide = useCallback((id, animate = true) => {
    const index = prefs.slideOrder.indexOf(id);
    if (index < 0 || !track.current) return;
    track.current.scrollTo({ left: index * track.current.clientWidth,
      behavior: animate && !prefs.calm && !reduced.current ? 'smooth' : 'instant' });
  }, [orderKey, prefs.calm]);
  const go = useCallback((id) => {
    onActive(id);
    if (grid) document.getElementById(`dashboard-slide-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    else scrollToSlide(id);
  }, [grid, onActive, scrollToSlide]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { reduced.current = media.matches; };
    change(); media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useLayoutEffect(() => {
    measure();
    const resize = () => { measure(); scrollToSlide(active, false); };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, [measure, scrollToSlide, active]);
  useLayoutEffect(() => { if (!grid) scrollToSlide(active, false); }, [orderKey, grid]);
  useEffect(() => {
    if (fromScroll.current) { fromScroll.current = false; return; }
    if (!grid) scrollToSlide(active);
  }, [active, grid, scrollToSlide]);
  // Inner vertical scroll containers can absorb horizontal wheels on laptops.
  // Only deliberate horizontal gestures page the deck; vertical wheel and inputs stay native.
  useEffect(() => {
    const element = track.current;
    if (grid || !element) return;
    let accumulated = 0, lastEvent = 0, lastPage = 0;
    const wheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return;
      event.preventDefault();
      const now = Date.now();
      if (now - lastEvent > 180) accumulated = 0;
      lastEvent = now;
      accumulated += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      if (Math.abs(accumulated) < 40 || now - lastPage < 400) return;
      const index = prefs.slideOrder.indexOf(currentActive.current);
      const next = prefs.slideOrder[index + (accumulated > 0 ? 1 : -1)];
      accumulated = 0;
      if (next) { lastPage = now; onActive(next); scrollToSlide(next); }
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [grid, orderKey, scrollToSlide, onActive]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function onScroll() {
    if (grid) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      const id = prefs.slideOrder[Math.round(el.scrollLeft / Math.max(1, el.clientWidth))];
      if (id && id !== active) { fromScroll.current = true; onActive(id); }
    });
  }
  function onKey(event) {
    if (grid || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="tablist"]')) return;
    const target = event.key === 'ArrowRight' ? activeIndex + 1 : event.key === 'ArrowLeft' ? activeIndex - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? prefs.slideOrder.length - 1 : -1;
    if (target >= 0 && target < prefs.slideOrder.length) { event.preventDefault(); go(prefs.slideOrder[target]); }
  }
  return <section ref={root} className={`sd-shell ${grid ? 'sd-grid-mode' : 'sd-slide-mode'}`}
    style={{ height: grid ? undefined : height || 'calc(100dvh - 80px)' }} aria-label="Your learning dashboard" onKeyDown={onKey}>
    <div className="sd-top">
      <div><span className="sd-brand"><Sparkles size={16} strokeWidth={1.7} />We Learn <b>SPARK</b></span><h1>My Dashboard <span>· {name || 'Your space'}</span></h1></div>
      <div className="sd-top-actions"><span className="studio-avatar" aria-hidden="true">{(name || 'S').slice(0, 1).toUpperCase()}</span>
        <button className="sd-button" type="button" onClick={() => { if (grid) root.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); update((s) => ({ ...s, dashboardLayout: grid ? 'slides' : 'grid' })); }} aria-label={grid ? 'Switch to slide view' : 'Switch to grid view'}>{grid ? <GalleryHorizontal size={17} /> : <LayoutGrid size={17} />}<span>{grid ? 'Slide view' : 'Grid view'}</span></button>
        <button className="sd-button" type="button" onClick={onPersonalise}><Paintbrush size={17} /><span>Personalise</span></button>
      </div>
    </div>
    <div className="sd-track" ref={track} onScroll={onScroll} tabIndex={grid ? undefined : 0} aria-label="Learning slides. Use left and right arrows to navigate.">
      {prefs.slideOrder.map((id) => {
        const template = SLIDES.find((s) => s.id === id);
        return <section key={id} id={`dashboard-slide-${id}`} data-slide={id}
          className={`sd-slide sd-page-${id}`} role="group" aria-roledescription={grid ? undefined : 'slide'}
          aria-label={`${prefs.slideOrder.indexOf(id) + 1} of 5: ${titleFor(id)}`}
          aria-hidden={!grid && active !== id ? true : undefined} inert={!grid && active !== id ? '' : undefined}>
          <div className="sd-slide-content"><div className="sd-eyebrow">{template.eyebrow}</div>
            <h2>{titleFor(id)}</h2>{renderSlide(id)}</div>
        </section>;
      })}
    </div>
    <div className="sd-dock">
      <nav className="sd-indicators" aria-label="Choose a dashboard slide">{prefs.slideOrder.map((id, index) => {
        const Icon = SLIDE_ICONS[id], template = SLIDES.find((slide) => slide.id === id);
        return <button type="button" key={id} className="sd-indicator" onClick={() => go(id)} aria-label={stats[id] ? `${titleFor(id)}, ${stats[id].label}` : titleFor(id)} aria-current={active === id ? 'step' : undefined} aria-controls={`dashboard-slide-${id}`}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{titleFor(id) === template.title ? template.short : titleFor(id)}</span>{stats[id] && <span className="sd-indicator-stat" aria-hidden="true">{stats[id].text}</span>}<span className="sd-indicator-index" aria-hidden="true">{index + 1}</span></button>;
      })}</nav>
      <div className="sd-arrows"><button type="button" className="sd-button" disabled={activeIndex === 0} aria-label="Previous slide" onClick={() => go(prefs.slideOrder[activeIndex - 1])}><ChevronLeft size={19} /></button><span aria-live="polite" aria-atomic="true" className="sd-page-number">{activeIndex + 1} / 5</span><button type="button" className="sd-button" disabled={activeIndex === 4} aria-label="Next slide" onClick={() => go(prefs.slideOrder[activeIndex + 1])}><ChevronRight size={19} /></button></div>
    </div>
    <div className="sd-save" role="status">{syncState === 'saving' ? 'Saving appearance…' : syncState === 'saved' ? 'Appearance saved to your account' : syncState === 'local-only' ? 'Appearance saved on this device · account sync unavailable' : 'Your space, at your pace'}</div>
  </section>;
}
