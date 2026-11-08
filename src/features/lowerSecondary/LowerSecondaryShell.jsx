import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Briefcase, ChevronDown, Flower2, House, LogOut, Menu, Orbit, Settings } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { SparkGlyph } from '../spark/SparkMark.jsx';
import { useDashboardPrefs, useCloudProject } from '../dashboard/dashboardStore.js';
import { useLearningCourses } from '../dashboard/LearningHub.jsx';
import { useGoalPlan } from '../goals/useGoalPlan.js';
import { useQuest } from '../quest/useQuest.js';
import { useSchoolResource } from '../school/useSchoolWorkspace.js';
import { useLearnerAvatar } from '../shell/useLearnerAvatar.js';
import { firstNameOf, moreMenuItems, progressView, sectionHref } from './lowerSecondaryModel.js';
import { DashboardPage, PrimaryDashboardPage } from './DashboardPage.jsx';
import { LearningPage, PrimaryLearningPage } from './LearningPage.jsx';
import { PrimaryUniversePage, UniversePage } from './UniversePage.jsx';
import { PortfolioPage } from './PortfolioPage.jsx';
import './lowerSecondary.css';

const NAV = [
  { id: 'dashboard', label: 'My Dashboard', short: 'Dashboard', Icon: House },
  { id: 'learning', label: 'My Learning', short: 'Learning', Icon: BookOpen },
  { id: 'universe', label: 'My Universe', short: 'Universe', Icon: Orbit },
  { id: 'portfolio', label: 'My Portfolio', short: 'Portfolio', Icon: Briefcase }
];

/** A disclosure menu: Escape or a click outside closes it, and focus returns to its button. */
function Disclosure({ id, className = '', button, label, children }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    const onPointer = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [open]);
  const onBlur = (e) => { if (e.relatedTarget && !root.current?.contains(e.relatedTarget)) setOpen(false); };
  return <div className={`ls-disclosure ${className}`} ref={root} onBlur={onBlur}>
    <button type="button" ref={trigger} className="ls-disclosure-button" aria-expanded={open} aria-controls={id} aria-label={label} onClick={() => setOpen((v) => !v)}>{button}</button>
    {open && <div id={id} className="ls-menu" onClick={(e) => { if (e.target.closest('a, button')) setOpen(false); }}>{children}</div>}
  </div>;
}

function Avatar({ url, name, size = 40 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const style = { width: size, height: size };
  if (url && !broken) return <img className="ls-avatar" style={style} src={url} alt="" onError={() => setBroken(true)} />;
  return <span className="ls-avatar ls-avatar-initial" style={style} aria-hidden="true">{(name || 'L').slice(0, 1).toUpperCase()}</span>;
}

export function LowerSecondaryShell(props) { return <Shell key={props.uid || 'signed-out'} {...props} />; }

function Shell({ uid, orgId = null, profile, classIds = [], isPrimary = false, section = 'dashboard', onOpenActivity, onJoined, onSignOut }) {
  const { t } = useLocale();
  const { prefs, update, syncState } = useDashboardPrefs(uid);
  const avatar = useLearnerAvatar(uid);
  const name = firstNameOf(profile);
  const calm = prefs.calm === true;
  const go = (href) => { window.location.hash = href; };
  const more = useMemo(() => moreMenuItems({ isPrimary, onOpenCourses: () => go(hrefFor.courses()), onOpenGoals: () => go(hrefFor.goals()) }), [isPrimary]);

  // A section change is a page change: tell keyboard and screen-reader users by moving focus.
  const heading = useRef(null), first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo?.({ top: 0 });
    heading.current?.querySelector('h1')?.focus();
  }, [section]);

  return <div className={`ls-shell${calm ? ' ls-calm' : ''}`} data-theme="light">
    <a className="ls-skip" href="#ls-main" onClick={(e) => { e.preventDefault(); document.getElementById('ls-main')?.focus(); }}>Skip to content</a>
    <header className="ls-top">
      <a className="ls-brand" href={sectionHref('dashboard')}><SparkGlyph size={26} /><span>WeLearn <b>Spark</b></span></a>
      <nav className="ls-nav" aria-label="Main">
        {NAV.map(({ id, label, short, Icon }) => <a key={id} href={sectionHref(id)} aria-current={section === id ? 'page' : undefined}>
          <Icon size={20} aria-hidden="true" /><span className="ls-nav-long">{label}</span><span className="ls-nav-short">{short}</span>
        </a>)}
        <Disclosure id="ls-more" className="ls-more" label="More" button={<><Menu size={20} aria-hidden="true" /><span>More</span><ChevronDown className="ls-chev" size={16} aria-hidden="true" /></>}>
          <ul>{more.map((item) => <li key={item.key}><a href={item.href || '#'} onClick={item.onClick ? (e) => { e.preventDefault(); item.onClick(); } : undefined}>{t(item.label)}</a></li>)}</ul>
        </Disclosure>
      </nav>
      <div className="ls-tools">
        <button type="button" className="ls-calm-toggle" role="switch" aria-checked={calm} onClick={() => update((state) => ({ ...state, calm: !calm }))}
                title={syncState === 'local-only' ? 'Saved on this device · account sync unavailable' : undefined}>
          <Flower2 size={18} aria-hidden="true" /><span>Calm mode</span><i aria-hidden="true" />
        </button>
        <Disclosure id="ls-account" className="ls-account" label="Account" button={<><Avatar url={avatar} name={profile?.displayName} /><ChevronDown className="ls-chev" size={16} aria-hidden="true" /></>}>
          <ul>
            {profile?.displayName && <li className="ls-menu-name">{profile.displayName}</li>}
            <li><a href={hrefFor.settings()}><Settings size={16} aria-hidden="true" />{t('nav.settings')}</a></li>
            {onSignOut && <li><button type="button" onClick={onSignOut}><LogOut size={16} aria-hidden="true" />Sign out</button></li>}
          </ul>
        </Disclosure>
      </div>
    </header>
    <main id="ls-main" className="ls-main" tabIndex={-1} ref={heading}>
      {isPrimary
        ? <PrimaryBody uid={uid} name={name} profile={profile} section={section} avatar={avatar} />
        : <SecondaryBody uid={uid} orgId={orgId} name={name} profile={profile} classIds={classIds} section={section} calm={calm} avatar={avatar} onOpenActivity={onOpenActivity} onJoined={onJoined} />}
    </main>
  </div>;
}

/**
 * The same account-scoped reads as My Dashboard, once, shared across sections so
 * that every section shows the same record. The server is the only source of XP
 * and badges, and they are only requested where the school switched them on.
 */
function SecondaryBody({ uid, orgId, name, profile, classIds, section, calm, avatar, onOpenActivity, onJoined }) {
  const goals = useGoalPlan(uid);
  const courses = useLearningCourses(uid, classIds, profile?.activeProgramId);
  const project = useCloudProject(uid);
  const context = useSchoolResource(uid ? '/api/learning-context' : null);
  const questEnabled = (context.data?.schools || []).some((school) => school.features?.questMode === true);
  const quest = useQuest(questEnabled);
  const progress = progressView({ questEnabled, schoolLoading: context.loading, schoolError: context.error, quest });
  const retryProgress = useCallback(() => { if (context.error) context.reload(); else quest.reload(); }, [context, quest]);
  const shared = { uid, name, profile, goals, courses, project, progress, retryProgress, quest: quest.data };
  if (section === 'learning') return <LearningPage {...shared} />;
  if (section === 'universe') return <UniversePage uid={uid} orgId={orgId} courses={courses} calm={calm} onOpenActivity={onOpenActivity} />;
  if (section === 'portfolio') return <PortfolioPage uid={uid} name={name} profile={profile} avatar={avatar} progress={progress} retryProgress={retryProgress} Avatar={Avatar} />;
  return <DashboardPage {...shared} classIds={classIds} onJoined={onJoined} />;
}

/**
 * A primary-classified account keeps every primary gate: Junior Explorers and
 * school learning, no secondary courses, quests, goals or activities. The layout
 * changes; what the account may reach does not.
 */
function PrimaryBody({ uid, name, profile, section, avatar }) {
  if (section === 'learning') return <PrimaryLearningPage uid={uid} profile={profile} />;
  if (section === 'universe') return <PrimaryUniversePage />;
  if (section === 'portfolio') return <PortfolioPage uid={uid} name={name} profile={profile} avatar={avatar} progress={{ state: 'off' }} Avatar={Avatar} primary />;
  return <PrimaryDashboardPage name={name} />;
}
