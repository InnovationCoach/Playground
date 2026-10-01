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

  if (role === 'teacher') {
    return (
      <nav className="gh-subnav" aria-label={t('nav.primary')}>
        <NavLink icon={LayoutDashboard} active={view === 'coach'} onClick={() => onNavigate('coach')}>
          {t('nav.coachDashboard')}
        </NavLink>
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
    <nav className="gh-subnav" aria-label={t('nav.primary')}>
      <NavLink icon={House} active={view === 'home'} onClick={() => onNavigate('home')}>{t('nav.home')}</NavLink>
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
