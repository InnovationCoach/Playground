import { House, BookOpen, Target, LayoutDashboard, Printer, Rocket, Users, Sparkles, HeartHandshake, Search } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { ACTIVITY_NAV } from '../../features/activities/activityHost.js';
import { ActivitySearch } from './ActivitySearch.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';

/**
 * Secondary navigation under the top bar. Every role's first item is Home,
 * which is SPARK Home (#/spark); primary learners have Junior Explorers
 * instead and no bar.
 *
 * Activities are found by search (ActivitySearch), not a button per activity
 * (there were twelve by Activity 8). Messages has no menu link: the screen
 * still works by address but is not part of the current product.
 */
const SEARCHABLE = ACTIVITY_NAV.filter((a) => a.id !== 'home');
const go = (href) => () => { window.location.hash = href; };

export function TopNav({ role, view, onNavigate, onOpenGoals, onOpenCourses, isPrimary = false }) {
  const { t } = useLocale();
  const home = <NavLink icon={House} active={view === 'spark'} onClick={go(hrefFor.spark())}>{t('nav.home')}</NavLink>;

  if (role === 'parent') {
    return (
      <nav className="gh-subnav" aria-label={t('nav.primary')}>
        {home}
        <NavLink icon={HeartHandshake} active={view === 'parent'} onClick={go(hrefFor.parent())}>{t('parent.title')}</NavLink>
      </nav>
    );
  }

  if (role === 'admin' || role === 'supervisor') {
    return (
      <nav className="gh-subnav" aria-label={t('nav.primary')}>
        {home}
        <NavLink icon={LayoutDashboard} active={view === 'admin'} onClick={go(hrefFor.list('students'))}>Admin Console</NavLink>
        <NavLink icon={Rocket} active={view === 'pbl'} onClick={go(hrefFor.pbl())}>{t('nav.pbl')}</NavLink>
        <NavLink icon={Printer} onClick={go(hrefFor.resources())}>{t('nav.primaryResources')}</NavLink>
      </nav>
    );
  }

  if (role === 'teacher' || role === 'coach') {
    return (
      <nav className="gh-subnav" aria-label={t('nav.primary')}>
        {home}
        <NavLink icon={LayoutDashboard} active={view === 'coach'} onClick={() => onNavigate('coach')}>{t('nav.coachDashboard')}</NavLink>
        <NavLink icon={Rocket} active={view === 'pbl'} onClick={go(hrefFor.pbl())}>{t('nav.pblFramework')}</NavLink>
        <NavLink icon={Users} active={view === 'community'} onClick={go(hrefFor.community())}>Community</NavLink>
        <NavLink icon={Printer} onClick={go(hrefFor.resources())}>{t('nav.primaryResources')}</NavLink>
      </nav>
    );
  }

  return (
    <nav className="gh-subnav" aria-label={t('nav.primary')}>
      {isPrimary
        ? <NavLink icon={House} active={view === 'home'} onClick={() => onNavigate('home')}>{t('nav.home')}</NavLink>
        : home}
      {!isPrimary && (
        <NavLink icon={Search} active={view === 'homeSearch'} onClick={go(hrefFor.homeSearch())}>{t('nav.searchPrograms')}</NavLink>
      )}
      {!isPrimary && (
        <NavLink icon={LayoutDashboard} active={view === 'dashboard'} onClick={go(hrefFor.dashboard())}>{t('nav.myDashboard')}</NavLink>
      )}
      <NavLink icon={BookOpen} active={view === 'courses'} onClick={onOpenCourses}>{t('nav.myCourses')}</NavLink>
      <NavLink icon={Rocket} active={view === 'pbl'} onClick={go(hrefFor.pbl())}>{t('nav.pbl')}</NavLink>
      <NavLink icon={Sparkles} active={view === 'futureSkills'} onClick={go(hrefFor.futureSkills())}>{t('nav.futureSkills')}</NavLink>
      <NavLink icon={Users} active={view === 'community'} onClick={go(hrefFor.community())}>Community</NavLink>
      <NavLink icon={Target} active={view === 'goals'} onClick={onOpenGoals}>{t('nav.goals')}</NavLink>
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
