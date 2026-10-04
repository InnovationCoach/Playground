import { useEffect, useRef, useState } from 'react';
import './sidebar.css';
import { House, BookOpen, Target, LayoutDashboard, Printer, Rocket, MessageCircle, Users, Route, GalleryVerticalEnd, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { ACTIVITY_NAV } from '../../features/activities/activityHost.js';
import { ActivitySearch } from './ActivitySearch.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { useAuth } from '../../app/AuthProvider.jsx';
import { useLearnerAvatar } from './useLearnerAvatar.js';

/**
 * The side menu for students and staff (UX/UI plan: modern side menu).
 *
 * Desktop: a fixed panel that can collapse to an icon rail (remembered per
 * browser). Phones: a drawer opened from an icon button, with a backdrop and
 * Escape to close. Activities are found by search, not one button each.
 */
const SEARCHABLE = ACTIVITY_NAV.filter((a) => a.id !== 'home');
const COLLAPSE_KEY = 'gh.sidebar.collapsed';
const go = (hash) => () => { window.location.hash = hash; };

export function TopNav({ role, view, onNavigate, onOpenGoals, onOpenCourses }) {
  const { t } = useLocale();
  const groups = role === 'teacher' || role === 'coach' || role === 'admin' || role === 'supervisor'
    ? staffGroups({ role, view, onNavigate, t })
    : studentGroups({ view, onNavigate, onOpenGoals, onOpenCourses, t });
  return (
    <SidebarFrame view={view} role={role} t={t}>
      <nav className="hb-nav" aria-label={t('nav.primary')}>
        {groups.map((group) => (
          <div className="hb-group" key={group.id}>
            {group.label && <span className="hb-group-label">{group.label}</span>}
            {group.links.map((link) => <NavLink key={link.id} {...link} />)}
          </div>
        ))}
      </nav>
      {role === 'student' && <div className="hb-search"><ActivitySearch items={SEARCHABLE} current={view} onNavigate={onNavigate} /></div>}
    </SidebarFrame>
  );
}

function studentGroups({ view, onNavigate, onOpenGoals, onOpenCourses, t }) {
  return [
    { id: 'learn', label: t('nav.groupLearn'), links: [
      { id: 'home', icon: House, label: t('nav.home'), active: view === 'home', onClick: () => onNavigate('home') },
      { id: 'courses', icon: BookOpen, label: t('nav.myCourses'), active: view === 'courses', onClick: onOpenCourses },
      { id: 'pbl', icon: Rocket, label: t('nav.pbl'), active: view === 'pbl', onClick: go('#/pbl') },
      { id: 'goals', icon: Target, label: t('nav.goals'), onClick: onOpenGoals }
    ] },
    { id: 'create', label: t('nav.groupCreate'), links: [
      { id: 'journey', icon: Route, label: t('nav.portfolioMaker'), active: view === 'journey', onClick: go('#/journey') },
      { id: 'portfolio', icon: GalleryVerticalEnd, label: t('nav.showcase'), active: view === 'portfolio', onClick: go('#/portfolio') }
    ] },
    { id: 'connect', label: t('nav.groupConnect'), links: [
      { id: 'community', icon: Users, label: t('nav.community'), active: view === 'community', onClick: go('#/community') },
      { id: 'messages', icon: MessageCircle, label: t('nav.messages'), active: view === 'messages', onClick: go('#/messages') }
    ] }
  ];
}

function staffGroups({ role, view, onNavigate, t }) {
  const console = role === 'admin' || role === 'supervisor';
  return [
    { id: 'work', label: null, links: [
      console
        ? { id: 'admin', icon: LayoutDashboard, label: 'Admin Console', active: view === 'admin', onClick: go('#/admin/students') }
        : { id: 'coach', icon: LayoutDashboard, label: t('nav.coachDashboard'), active: view === 'coach', onClick: () => onNavigate('coach') },
      { id: 'pbl', icon: Rocket, label: t('nav.pblFramework'), active: view === 'pbl', onClick: go('#/pbl') },
      { id: 'resources', icon: Printer, label: t('nav.primaryResources'), onClick: go('#/primary-resources') }
    ] },
    { id: 'connect', label: t('nav.groupConnect'), links: [
      { id: 'community', icon: Users, label: t('nav.community'), active: view === 'community', onClick: go('#/community') },
      { id: 'messages', icon: MessageCircle, label: t('nav.messages'), active: view === 'messages', onClick: go('#/messages') }
    ] }
  ];
}

function NavLink({ icon: Icon, label, active, onClick }) {
  return (
    <button type="button" className="hb-link" aria-current={active ? 'page' : undefined} onClick={onClick} title={label}>
      <span className="hb-link-icon" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
      <span className="hb-link-label">{label}</span>
    </button>
  );
}

function ProfileCard({ role }) {
  const { user, profile } = useAuth();
  const name = profile?.displayName || user?.email?.split('@')[0] || '';
  const picture = useLearnerAvatar(role === 'student' ? user?.uid : null);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [picture]);
  const initials = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
  const detail = profile?.groupName || profile?.yearLevel || (role === 'student' ? '' : role);
  return (
    <a className="hb-profile" href={role === 'student' ? '#/home' : '#/settings'} aria-label={name ? `${name}, open my space` : 'Open my space'}>
      <span className="hb-avatar">
        {picture && !broken ? <img src={picture} alt="" onError={() => setBroken(true)} /> : <span aria-hidden="true">{initials}</span>}
      </span>
      <span className="hb-profile-text">
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </a>
  );
}

function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
}

function SidebarFrame({ view, role, t, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = useRef(null);
  useEffect(() => {
    document.body.classList.add('gh-has-sidebar');
    return () => document.body.classList.remove('gh-has-sidebar', 'gh-sidebar-collapsed');
  }, []);
  useEffect(() => {
    document.body.classList.toggle('gh-sidebar-collapsed', collapsed);
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsed]);
  useEffect(() => { setOpen(false); }, [view]);
  const close = () => { setOpen(false); toggle.current?.focus(); };
  return <>
    <button ref={toggle} type="button" className="hb-toggle" aria-expanded={open} aria-controls="gh-sidebar"
      aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')} onClick={() => setOpen((v) => !v)}>
      {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
    </button>
    {open && <div className="hb-scrim" aria-hidden="true" onClick={close} />}
    <aside id="gh-sidebar" className={`hb-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}
      onKeyDown={(event) => { if (event.key === 'Escape' && open) close(); }}
      onClick={(event) => { if (event.target.closest('.hb-link')) setOpen(false); }}>
      <div className="hb-top">
        <span className="hb-eyebrow">{t('nav.yourSpace')}</span>
        <button type="button" className="hb-collapse" aria-pressed={collapsed} onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')} title={collapsed ? t('nav.expand') : t('nav.collapse')}>
          {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
        </button>
      </div>
      <ProfileCard role={role} />
      {children}
      <p className="hb-note">One small step. A world of possibilities.</p>
    </aside>
  </>;
}
