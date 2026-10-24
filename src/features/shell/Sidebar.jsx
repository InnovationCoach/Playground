import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  House, Search, LayoutDashboard, BookOpen, Rocket, Target, Sparkles, Users, Printer, HeartHandshake,
  GraduationCap, CreditCard, PackageCheck, Settings, PanelLeftClose, Pin, X, Link2
} from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivitySearch } from './ActivitySearch.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { SparkGlyph } from '../spark/SparkMark.jsx';
import { hydratePlan, todayItems, checkedToday } from '../goals/goalPlan.js';
import { useFocus } from '../focus/focusStore.js';
import { remainingMs, fmt } from '../focus/focusModel.js';
import './sidebar.css';

/**
 * The main menu: a left sidebar for every role except primary learners
 * (Junior Explorers is their whole app). It replaces the old menu bar under
 * the header and, for admins and supervisors, the admin console's own side
 * menu, so there is one menu everywhere.
 *
 * Desktop, two modes (remembered per device):
 *   - auto (the default): rests as an icon rail and slides open over the
 *     page while the pointer or keyboard focus is in it, then tucks away;
 *   - pinned: always open, as before. "Expand menu" pins, "Collapse menu"
 *     goes back to auto. The [ key does the same.
 * Narrow screens: a drawer opened from the header's menu button.
 *
 * A highlight glides to the item under the pointer, and for learners two
 * items carry live badges: steps left today (Goal setting) and the focus
 * timer (My Dashboard).
 *
 * Items are links (href) where a route exists; the two legacy views (Coach
 * dashboard, Goal setting for primary) use onClick. `active` is the key of
 * the current screen, worked out by App.jsx.
 */
const SEARCHABLE = ACTIVITY_NAV.filter((a) => a.id !== 'home');
const COLLAPSED_KEY = 'hearisland.sidebar.collapsed.v1';

export function menuFor(role, { onOpenCourses, onOpenGoals, onNavigate } = {}) {
  const home = { key: 'spark', icon: House, label: 'nav.home', href: hrefFor.spark() };
  const settings = { key: 'settings', icon: Settings, label: 'nav.settings', href: hrefFor.settings() };
  if (role === 'parent') {
    return [{ items: [home, { key: 'parent', icon: HeartHandshake, label: 'parent.title', href: hrefFor.parent() }] }, { label: 'nav.account', items: [settings] }];
  }
  if (role === 'admin' || role === 'supervisor') {
    return [
      { items: [home] },
      { label: 'nav.people', items: [
        { key: 'admin:students', icon: GraduationCap, label: 'nav.students', href: hrefFor.list('students') },
        { key: 'admin:staff', icon: Users, label: 'nav.staff', href: hrefFor.list('staff') },
        { key: 'admin:parents', icon: HeartHandshake, label: 'nav.parents', href: hrefFor.list('parents') }
      ] },
      { label: 'nav.operations', items: [
        { key: 'admin:billing', icon: CreditCard, label: 'nav.financials', href: hrefFor.billing() },
        { key: 'admin:materials', icon: PackageCheck, label: 'nav.materials', href: hrefFor.materials() }
      ] },
      { label: 'nav.teaching', items: [
        { key: 'pbl', icon: Rocket, label: 'nav.pbl', href: hrefFor.pbl() },
        { key: 'resources', icon: Printer, label: 'nav.primaryResources', href: hrefFor.resources() }
      ] },
      { label: 'nav.account', items: [settings] }
    ];
  }
  if (role === 'teacher' || role === 'coach') {
    return [
      { items: [home, { key: 'coach', icon: LayoutDashboard, label: 'nav.coachDashboard', onClick: () => onNavigate('coach') }] },
      { label: 'nav.teaching', items: [
        { key: 'pbl', icon: Rocket, label: 'nav.pblFramework', href: hrefFor.pbl() },
        { key: 'resources', icon: Printer, label: 'nav.primaryResources', href: hrefFor.resources() }
      ] },
      { label: 'nav.together', items: [{ key: 'community', icon: Users, label: 'nav.community', href: hrefFor.community() }] },
      { label: 'nav.account', items: [settings] }
    ];
  }
  return [
    { items: [
      home,
      { key: 'homeSearch', icon: Search, label: 'nav.searchPrograms', href: hrefFor.homeSearch() },
      { key: 'dashboard', icon: LayoutDashboard, label: 'nav.myDashboard', href: hrefFor.dashboard() }
    ] },
    { label: 'nav.learning', items: [
      { key: 'courses', icon: BookOpen, label: 'nav.myCourses', onClick: onOpenCourses },
      { key: 'pbl', icon: Rocket, label: 'nav.pbl', href: hrefFor.pbl() },
      { key: 'goals', icon: Target, label: 'nav.goals', onClick: onOpenGoals },
      { key: 'futureSkills', icon: Sparkles, label: 'nav.futureSkills', href: hrefFor.futureSkills() }
    ] },
    { label: 'nav.together', items: [{ key: 'community', icon: Users, label: 'nav.community', href: hrefFor.community() }] },
    { label: 'nav.account', items: [settings] }
  ];
}

const PEEK_IN_MS = 120;
const PEEK_OUT_MS = 380;
const wideWithHover = () => typeof window !== 'undefined'
  && window.matchMedia?.('(min-width: 901px) and (hover: hover)').matches;

/**
 * Steps left on today's goal list, read from this device's copy of the plan.
 * Firebase is imported lazily so this module (and menuFor, which tests use)
 * still loads outside a browser.
 */
function useStepsLeft(enabled) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let auth = null;
    import('../../firebase.js').then((m) => { auth = m.auth; read(); }).catch(() => {});
    const read = () => {
      const uid = auth?.currentUser?.uid;
      if (!uid) return;
      // Same key as useGoalPlan.planStorageKey; that module imports Firebase, so it is not imported here.
      let plan = null;
      try { const raw = localStorage.getItem(`goalPlan_${uid}`); plan = raw ? hydratePlan(JSON.parse(raw)) : null; } catch { plan = null; }
      if (!plan) { setLeft(0); return; }
      const ticked = checkedToday(plan);
      setLeft(todayItems(plan).filter((i) => !ticked.has(i.id)).length);
    };
    read();
    const id = setInterval(read, 15000);
    window.addEventListener('hashchange', read);
    window.addEventListener('storage', read);
    window.addEventListener('focus', read);
    return () => {
      clearInterval(id);
      window.removeEventListener('hashchange', read);
      window.removeEventListener('storage', read);
      window.removeEventListener('focus', read);
    };
  }, [enabled]);
  return left;
}

export function Sidebar({ role, active, onNavigate, onOpenCourses, onOpenGoals, open, onClose, collapsed, onToggleCollapsed }) {
  const { t } = useLocale();
  const ref = useRef(null);
  const groupsRef = useRef(null);
  const groups = menuFor(role, { onOpenCourses, onOpenGoals, onNavigate });
  const isStudent = role === 'student';

  // Auto mode: peek open while in use, tuck away after.
  const [peek, setPeek] = useState(false);
  const timer = useRef(null);
  const hovering = useRef(false);
  const auto = !!collapsed;
  const later = (fn, ms) => { clearTimeout(timer.current); timer.current = setTimeout(fn, ms); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (!auto) setPeek(false); }, [auto]);
  const onEnter = () => { hovering.current = true; if (auto && wideWithHover()) later(() => setPeek(true), PEEK_IN_MS); };
  const onLeave = () => {
    hovering.current = false;
    if (!auto) return;
    later(() => { if (!ref.current?.contains(document.activeElement) || !ref.current.matches(':focus-within')) setPeek(false); }, PEEK_OUT_MS);
  };
  const onFocusIn = () => { if (auto && window.matchMedia?.('(min-width: 901px)').matches) { clearTimeout(timer.current); setPeek(true); } };
  const onFocusOut = (e) => { if (auto && !ref.current?.contains(e.relatedTarget) && !hovering.current) later(() => setPeek(false), 60); };
  const showLabels = !auto || peek || open;

  // [ pins or unpins the menu (not while typing).
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === '[' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); onToggleCollapsed?.(); }
      if (e.key === 'Escape' && peek) { setPeek(false); document.activeElement?.blur?.(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onToggleCollapsed, peek]);

  // The gliding highlight follows the hovered item, and rests on the current one.
  const [hoverKey, setHoverKey] = useState(null);
  const [glow, setGlow] = useState(null);
  const placeGlow = useCallback(() => {
    const key = hoverKey || active;
    const el = key && groupsRef.current?.querySelector(`[data-key="${CSS.escape(key)}"]`);
    setGlow(el ? { top: el.offsetTop, height: el.offsetHeight, hover: !!hoverKey } : null);
  }, [hoverKey, active]);
  useLayoutEffect(placeGlow, [placeGlow, showLabels, collapsed]);

  // Live badges for learners.
  const stepsLeft = useStepsLeft(isStudent);
  const focusState = useFocus();
  const focusTime = isStudent && focusState.timer.phase !== 'idle' ? fmt(remainingMs(focusState.timer, focusState.now)) : null;
  const badgeFor = (key) => (key === 'goals' && stepsLeft ? String(stepsLeft) : key === 'dashboard' ? focusTime : null);

  // The page leaves room for the menu while it is on screen.
  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar', 'sidebar-collapsed');
  }, []);
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !!collapsed);
  }, [collapsed]);

  // Drawer: Escape closes it and focus moves into it when it opens.
  useEffect(() => {
    if (!open) return undefined;
    ref.current?.querySelector('a, button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const pick = (item) => (e) => {
    if (item.onClick) { e.preventDefault(); item.onClick(); }
    onClose();
    if (auto) { setPeek(false); e.currentTarget.blur(); }
  };

  return (
    <>
      {open && <div className="gh-sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <nav ref={ref} id="gh-sidebar" aria-label={t('nav.primary')}
           className={`gh-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}${peek ? ' is-peek' : ''}`}
           onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onFocusIn} onBlur={onFocusOut}>
        <div className="gh-sidebar-top">
          <span className="gh-sidebar-brand"><SparkGlyph size={18} /><span>SPARK</span></span>
          <button type="button" className="gh-sidebar-close" onClick={onClose} aria-label={t('nav.closeMenu')}><X size={20} aria-hidden="true" /></button>
        </div>

        {isStudent && showLabels && (
          <div className="gh-sidebar-search">
            <ActivitySearch items={SEARCHABLE} current={active} onNavigate={(id) => { onNavigate(id); onClose(); }} />
          </div>
        )}

        <div className="gh-sidebar-groups" ref={groupsRef} onMouseLeave={() => setHoverKey(null)}>
          {glow && <span className={`gh-sidebar-glow${glow.hover ? ' is-hover' : ''}`} aria-hidden="true"
                         style={{ transform: `translateY(${glow.top}px)`, height: glow.height }} />}
          {groups.map((g, i) => (
            <div key={g.label || i} className="gh-sidebar-group" role="group" aria-label={g.label ? t(g.label) : undefined}>
              {g.label && <div className="gh-sidebar-label">{t(g.label)}</div>}
              {g.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.label);
                const badge = badgeFor(item.key);
                return (
                  <a key={item.key} href={item.href || '#'} className="gh-sidebar-link" onClick={pick(item)} data-key={item.key}
                     onMouseEnter={() => setHoverKey(item.key)} onFocus={() => setHoverKey(item.key)} onBlur={() => setHoverKey(null)}
                     aria-current={active === item.key ? 'page' : undefined} title={showLabels ? undefined : label}>
                    <span className="gh-sidebar-icon"><Icon size={19} strokeWidth={2} aria-hidden="true" />
                      {badge && !showLabels && <i className="gh-sidebar-dot" aria-hidden="true" />}</span>
                    <span className="gh-sidebar-text">{label}</span>
                    {badge && showLabels && <span className="gh-sidebar-badge">{badge}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <button type="button" className="gh-sidebar-collapse" onClick={onToggleCollapsed} aria-pressed={!!collapsed}
                aria-label={collapsed ? t('nav.expand') : t('nav.collapse')} title={`${collapsed ? t('nav.expand') : t('nav.collapse')} ( [ )`}>
          <span className="gh-sidebar-icon">{collapsed ? <Pin size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}</span>
          <span className="gh-sidebar-text">{collapsed ? t('nav.expand') : t('nav.collapse')}</span>
          <kbd className="gh-sidebar-kbd" aria-hidden="true">[</kbd>
        </button>
      </nav>
    </>
  );
}

/** Auto-hide (collapsed) is the default; only an explicit "Expand menu" pins it open. */
export function readCollapsed() {
  try { return localStorage.getItem(COLLAPSED_KEY) !== '0'; } catch { return true; }
}
export function writeCollapsed(value) {
  try { localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0'); } catch { /* storage unavailable */ }
}
