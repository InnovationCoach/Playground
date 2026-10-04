import { useEffect, useRef, useState } from 'react';
import './sidebar.css';
import { House, BookOpen, Target, LayoutDashboard, Printer, Rocket, MessageCircle, Users } from 'lucide-react';
import { ACTIVITY_NAV } from '../../features/activities/activityHost.js';
import { ActivitySearch } from './ActivitySearch.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';

/**
 * Secondary navigation under the top bar, for students and coaches.
 *
 * Activities are found by search (ActivitySearch), not a button per activity
 * (there were twelve by Activity 8). Which links appear depends on role.
 */
const SEARCHABLE = ACTIVITY_NAV.filter((a) => a.id !== 'home');

export function TopNav({ role, view, onNavigate, onOpenGoals, onOpenCourses }) {
  const { t } = useLocale();

  return <SidebarFrame view={view}>
    <NavigationLinks role={role} view={view} onNavigate={onNavigate} onOpenGoals={onOpenGoals} onOpenCourses={onOpenCourses} t={t}/>
  </SidebarFrame>;
}

function NavigationLinks({ role, view, onNavigate, onOpenGoals, onOpenCourses, t }) {
  if (role === 'teacher' || role === 'coach' || role === 'admin' || role === 'supervisor') {
    return (
      <nav className="gh-subnav gh-sidebar-nav" aria-label={t('nav.primary')}>
        {role === 'admin' || role === 'supervisor' ? (
          <NavLink icon={LayoutDashboard} active={view === 'admin'} onClick={() => { window.location.hash = '#/admin/students'; }}>
            Admin Console
          </NavLink>
        ) : (
          <NavLink icon={LayoutDashboard} active={view === 'coach'} onClick={() => onNavigate('coach')}>
            {t('nav.coachDashboard')}
          </NavLink>
        )}
        <NavLink icon={Rocket} active={view === 'pbl'} onClick={() => { window.location.hash = '#/pbl'; }}>
          {t('nav.pblFramework')}
        </NavLink>
        <NavLink icon={Users} active={view === 'community'} onClick={() => { window.location.hash = '#/community'; }}>
          Community
        </NavLink>
        <NavLink icon={MessageCircle} active={view === 'messages'} onClick={() => { window.location.hash = '#/messages'; }}>
          Messages
        </NavLink>
        <NavLink icon={Printer} onClick={() => { window.location.hash = '#/primary-resources'; }}>
          {t('nav.primaryResources')}
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="gh-subnav gh-sidebar-nav" aria-label={t('nav.primary')}>
      <NavLink icon={House} active={view === 'home'} onClick={() => onNavigate('home')}>Private dashboard</NavLink>
      <NavLink icon={BookOpen} active={view === 'portfolio'} onClick={() => { window.location.hash = '#/portfolio'; }}>My portfolio</NavLink>
      <NavLink icon={BookOpen} active={view === 'courses'} onClick={onOpenCourses}>{t('nav.myCourses')}</NavLink>
      <NavLink icon={Rocket} active={view === 'pbl'} onClick={() => { window.location.hash = '#/pbl'; }}>{t('nav.pbl')}</NavLink>
      <NavLink icon={Users} active={view === 'community'} onClick={() => { window.location.hash = '#/community'; }}>
        Community
      </NavLink>
      <NavLink icon={MessageCircle} active={view === 'messages'} onClick={() => { window.location.hash = '#/messages'; }}>
        Messages
      </NavLink>
      <NavLink icon={Target} onClick={onOpenGoals}>{t('nav.goals')}</NavLink>
      <ActivitySearch items={SEARCHABLE} current={view} onNavigate={onNavigate} />
    </nav>
  );
}

function NavLink({ icon: Icon, active, onClick, children }) {
  return (
    <button type="button" className="gh-subnav-link" aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon size={17} strokeWidth={2} aria-hidden="true" />{children}
    </button>
  );
}

function SidebarFrame({ view, children }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  useEffect(() => {
    document.body.classList.add('gh-has-sidebar');
    return () => document.body.classList.remove('gh-has-sidebar');
  }, []);
  useEffect(() => { setOpen(false); }, [view]);
  return <>
    <button ref={toggle} type="button" className="gh-sidebar-toggle" aria-expanded={open} aria-controls="gh-sidebar" onClick={() => setOpen(value => !value)}>{open ? 'Close menu' : '☰ Menu'}</button>
    <aside id="gh-sidebar" className={`gh-sidebar${open ? ' is-open' : ''}`} onKeyDown={event => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    }} onClick={event => {
      if (event.target.closest('.gh-subnav-link')) setOpen(false);
    }}>
      <div className="gh-sidebar-heading"><span>YOUR SPACE</span><strong>Learn & explore</strong></div>
      {children}
      <p className="gh-sidebar-note">One small step. A world of possibilities.</p>
    </aside>
  </>;
}
