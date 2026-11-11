import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, GalleryHorizontal, Paintbrush, ListChecks, Compass, ChartNoAxesCombined, PenTool, Orbit, Sparkles, Wrench, Route } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { SLIDES } from './slideModel.js';
import { AllToolsPanel } from './AllToolsPanel.jsx';
import './dashboardDeck.css';
const SLIDE_ICONS = { daily: ListChecks, find: Compass, progress: ChartNoAxesCombined, creative: PenTool, universe: Orbit };

/**
 * The five dashboard sections, reached from the menu under the header. They are
 * destinations, not steps. Native touch/trackpad scrolling still works, and every
 * panel stays mounted to preserve drafts and audio when switching.
 */
export function DashboardDeck({ prefs, update, syncState, name, onPersonalise, renderSlide, active, onActive, stats = {} }) {
  const root = useRef(null), track = useRef(null), frame = useRef(null), toolsButton = useRef(null);
  const fromScroll = useRef(false);
  const [height, setHeight] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const currentActive = useRef(active);
  currentActive.current = active;
  const grid = prefs.dashboardLayout === 'grid';
  const orderKey = prefs.slideOrder.join('|');
  const titleFor = (id) => prefs.slideTitles[id]?.trim() || SLIDES.find((slide) => slide.id === id).title;
  const labelFor = (id) => { const template = SLIDES.find((slide) => slide.id === id); return titleFor(id) === template.title ? template.short : titleFor(id); };
  const measure = useCallback(() => {
    // The shell's place in the document, not on screen: a scrolled page must not make it taller.
    const top = (root.current?.getBoundingClientRect().top || 0) + window.scrollY;
    setHeight(Math.max(420, (window.visualViewport?.height || window.innerHeight) - top - 8));
    const header = document.querySelector('header.gh-topbar');
    const stuck = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? header.offsetHeight : 0;
    root.current?.style.setProperty('--sd-sticky-top', `${stuck}px`);
  }, []);
  const scrollToSlide = useCallback((id) => {
    const index = prefs.slideOrder.indexOf(id);
    if (index < 0 || !track.current) return;
    track.current.scrollTo({ left: index * track.current.clientWidth, behavior: 'instant' });
  }, [orderKey]);
  const go = useCallback((id) => {
    onActive(id);
    if (grid) document.getElementById(`dashboard-slide-${id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    else scrollToSlide(id);
  }, [grid, onActive, scrollToSlide]);

  useLayoutEffect(() => {
    measure();
    const resize = () => { measure(); scrollToSlide(active); };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, [measure, scrollToSlide, active]);
  useLayoutEffect(() => { if (!grid) scrollToSlide(active); }, [orderKey, grid]);
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
  // Fit-to-window view: the legacy body padding would otherwise let the page scroll and tuck the header under the top bar.
  useEffect(() => {
    if (grid) return undefined;
    document.body.classList.add('sd-fit-page');
    window.scrollTo(0, 0);
    return () => document.body.classList.remove('sd-fit-page');
  }, [grid]);
  // The button can't take focus until the modal panel is gone, so this waits for it to close.
  const toolsWereOpen = useRef(false);
  useEffect(() => {
    if (toolsWereOpen.current && !toolsOpen) toolsButton.current?.focus();
    toolsWereOpen.current = toolsOpen;
  }, [toolsOpen]);

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
    const activeIndex = prefs.slideOrder.indexOf(active);
    const target = event.key === 'ArrowRight' ? activeIndex + 1 : event.key === 'ArrowLeft' ? activeIndex - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? prefs.slideOrder.length - 1 : -1;
    if (target >= 0 && target < prefs.slideOrder.length) { event.preventDefault(); go(prefs.slideOrder[target]); }
  }
  return <section ref={root} className={`sd-shell ${grid ? 'sd-grid-mode' : 'sd-slide-mode'}`}
    style={{ height: grid ? undefined : height || 'calc(100dvh - 80px)' }} aria-label="Your learning dashboard" onKeyDown={onKey}>
    <div className="sd-top">
      <div><span className="sd-brand"><Sparkles size={16} strokeWidth={1.7} />We Learn <b>SPARK</b></span><h1>My Dashboard <span>· {name || 'Your space'}</span></h1></div>
      <div className="sd-top-actions"><span className="studio-avatar" aria-hidden="true">{(name || 'S').slice(0, 1).toUpperCase()}</span>
        <a className="sd-button sd-portfolio-link" href={hrefFor.journey()}><Route size={17} aria-hidden="true" /><span>Portfolio maker</span></a>
        <button className="sd-button" type="button" onClick={() => { if (grid) root.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); update((s) => ({ ...s, dashboardLayout: grid ? 'slides' : 'grid' })); }} aria-label={grid ? 'Switch to slide view' : 'Switch to grid view'}>{grid ? <GalleryHorizontal size={17} /> : <LayoutGrid size={17} />}<span>{grid ? 'Slide view' : 'Grid view'}</span></button>
        <button className="sd-button" type="button" onClick={onPersonalise}><Paintbrush size={17} /><span>Personalise</span></button>
      </div>
    </div>
    <div className="sd-menu">
      <nav className="sd-nav" aria-label="Dashboard sections">
        <ul>{prefs.slideOrder.map((id) => {
          const Icon = SLIDE_ICONS[id];
          return <li key={id}><button type="button" className="sd-nav-item" onClick={() => go(id)} aria-current={active === id ? 'page' : undefined} aria-controls={`dashboard-slide-${id}`}>
            <span className="sd-nav-icon"><Icon size={21} strokeWidth={1.9} aria-hidden="true" /></span>
            <span className="sd-nav-text"><strong>{labelFor(id)}</strong><small>{SLIDES.find((slide) => slide.id === id).about}</small></span>
            {stats[id] && <span className="sd-nav-stat" aria-label={stats[id].label}>{stats[id].text}</span>}
          </button></li>;
        })}</ul>
      </nav>
      <label className="sd-nav-chooser"><span>Go to</span>
        <select value={active} onChange={(event) => go(event.target.value)}>
          {prefs.slideOrder.map((id) => <option key={id} value={id}>{labelFor(id)}</option>)}
        </select>
      </label>
      <button type="button" ref={toolsButton} className="sd-tools-button" aria-haspopup="dialog" onClick={() => setToolsOpen(true)}><Wrench size={20} strokeWidth={1.8} aria-hidden="true" /><span>All tools</span></button>
    </div>
    <p className="sd-sr" aria-live="polite">{`Showing ${labelFor(active)}`}</p>
    <div className="sd-track" ref={track} onScroll={onScroll} tabIndex={grid ? undefined : 0} aria-label={grid ? 'Dashboard sections' : `${labelFor(active)} section`}>
      {prefs.slideOrder.map((id) => {
        const template = SLIDES.find((s) => s.id === id);
        return <section key={id} id={`dashboard-slide-${id}`} data-slide={id}
          className={`sd-slide sd-page-${id}`} role="group" aria-label={titleFor(id)}
          aria-hidden={!grid && active !== id ? true : undefined} inert={!grid && active !== id ? '' : undefined}>
          <div className="sd-slide-content"><div className="sd-eyebrow">{template.eyebrow}</div>
            <h2>{titleFor(id)}</h2>{renderSlide(id)}</div>
        </section>;
      })}
    </div>
    <div className="sd-save" role="status">{syncState === 'saving' ? 'Saving appearance…' : syncState === 'local-only' ? 'Appearance saved on this device · account sync unavailable' : ''}</div>
    {toolsOpen && <AllToolsPanel theme={prefs.theme} onClose={() => setToolsOpen(false)} />}
  </section>;
}
