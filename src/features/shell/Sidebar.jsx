import { useEffect, useRef } from 'react';
import {
  House, Search, LayoutDashboard, BookOpen, Rocket, Target, Sparkles, Users, Printer, HeartHandshake,
  GraduationCap, CreditCard, PackageCheck, Settings, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivitySearch } from './ActivitySearch.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { SparkGlyph } from '../spark/SparkMark.jsx';
import './sidebar.css';

/**
 * The main menu: a left sidebar for every role except primary learners
 * (Junior Explorers is their whole app). It replaces the old menu bar under
 * the header and, for admins and supervisors, the admin console's own side
 * menu, so there is one menu everywhere.
 *
 * Desktop: always open, collapsible to icons (remembered per device).
 * Narrow screens: a drawer opened from the header's menu button.
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

export function Sidebar({ role, active, onNavigate, onOpenCourses, onOpenGoals, open, onClose, collapsed, onToggleCollapsed }) {
  const { t } = useLocale();
  const ref = useRef(null);
  const groups = menuFor(role, { onOpenCourses, onOpenGoals, onNavigate });
  const isStudent = role === 'student';

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
  };

  return (
    <>
      {open && <div className="gh-sidebar-scrim" onClick={onClose} aria-hidden="true" />}
      <nav ref={ref} id="gh-sidebar" className={`gh-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`} aria-label={t('nav.primary')}>
        <div className="gh-sidebar-top">
          <span className="gh-sidebar-brand"><SparkGlyph size={18} /><span>SPARK</span></span>
          <button type="button" className="gh-sidebar-close" onClick={onClose} aria-label={t('nav.closeMenu')}><X size={20} aria-hidden="true" /></button>
        </div>

        {isStudent && !collapsed && (
          <div className="gh-sidebar-search">
            <ActivitySearch items={SEARCHABLE} current={active} onNavigate={(id) => { onNavigate(id); onClose(); }} />
          </div>
        )}

        <div className="gh-sidebar-groups">
          {groups.map((g, i) => (
            <div key={g.label || i} className="gh-sidebar-group" role="group" aria-label={g.label ? t(g.label) : undefined}>
              {g.label && <div className="gh-sidebar-label">{t(g.label)}</div>}
              {g.items.map((item) => {
                const Icon = item.icon;
                const label = t(item.label);
                return (
                  <a key={item.key} href={item.href || '#'} className="gh-sidebar-link" onClick={pick(item)}
                     aria-current={active === item.key ? 'page' : undefined} title={collapsed ? label : undefined}>
                    <Icon size={19} strokeWidth={2} aria-hidden="true" />
                    <span className="gh-sidebar-text">{label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <button type="button" className="gh-sidebar-collapse" onClick={onToggleCollapsed} aria-pressed={!!collapsed}
                aria-label={collapsed ? t('nav.expand') : t('nav.collapse')} title={collapsed ? t('nav.expand') : t('nav.collapse')}>
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          <span className="gh-sidebar-text">{t('nav.collapse')}</span>
        </button>
      </nav>
    </>
  );
}

export function readCollapsed() {
  try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
}
export function writeCollapsed(value) {
  try { localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0'); } catch { /* storage unavailable */ }
}
