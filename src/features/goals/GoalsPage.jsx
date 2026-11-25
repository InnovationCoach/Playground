import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Circle, Plus, Trash, Flag, Zap, Heart, MessageCircle, BatteryCharging,
  Cloud, CloudOff, Eye, RotateCcw, Check, Copy, ArrowRight, Compass,
  CheckCircle2, Award, GraduationCap, Rocket, Calendar, Clock, AlertTriangle,
  BookOpen, Edit3, Target, Bell, CheckSquare, Layers, Flame, Star
} from 'lucide-react';
import {
  GOAL_CATEGORIES, STEP_FREQUENCIES, STRENGTHS, SUPPORTS, FOCUS_SKILLS, PHRASES, RECHARGE, LIMITS,
  DEFAULT_NOTIFICATION_PREFS, touch, newId, goalSentence, todayItems, checkedToday, toggleToday,
  habitWeek, dayKey, categoryMeta, subtypeLabel, goalDeadlineStatus, computeGoalDashboardMetrics,
  planLevel, streak
} from './goalPlan.js';
import { useGoalPlan } from './useGoalPlan.js';
import {
  useAdventumAcademicContext,
  buildGoalRecommendations,
  GRADE_LEVEL_OPTIONS
} from './adventumGoalIntegration.js';
import { hrefFor } from '../../app/routes.js';
import { ArchetypeRadar } from './ArchetypeRadar.jsx';
import { DailyBountyBoard } from './DailyBountyBoard.jsx';
import { QuestEnergyBar } from './QuestEnergyBar.jsx';
import { playSfx } from './soundEffects.js';
import { triggerSparkParticles } from './confetti.js';
import { GoalFlow } from './GoalFlow.jsx';
import { GoalCoach } from './GoalCoach.jsx';
import { AcademicPlanner } from './AcademicPlanner.jsx';
import { confetti, buzz } from './celebrate.js';
import '../admin/admin.css';
import './goals.css';

const TABS = [
  { id: 'quests', label: 'My goals', Icon: Flag },
  { id: 'academic', label: 'Academic Goals', Icon: GraduationCap },
  { id: 'pbl', label: 'PBL Goals', Icon: Rocket },
  { id: 'today', label: 'Today’s Goals', Icon: Zap },
  { id: 'skills', label: 'How I like to work', Icon: Award },
  { id: 'toolkit', label: 'What helps me', Icon: Sparkles }
];

/**
 * Goal setting (#/goals). Redesigned Goal Dashboard & Intelligent Goal Setting:
 *   - Goal overview & progress indicators
 *   - Academic Goals (connected to Adventum / School Academic Profile)
 *   - Project-Based Learning (PBL) Goals
 *   - Today's Goals (Daily Academic, Daily PBL, Daily Habit, Overdue & Upcoming Deadlines)
 *   - Active vs Completed Goals filtering & Milestone tracking
 *   - Working Styles & Learning Toolkit + Notification Preferences
 */
export function GoalsPage({ uid, displayName, profile = null }) {
  const { plan, update, syncState, loaded } = useGoalPlan(uid);
  const academicContext = useAdventumAcademicContext(uid, profile);
  const [activeTab, setActiveTab] = useState('quests');
  const [coachRequest, setCoachRequest] = useState(null);
  const firstName = String(displayName || profile?.displayName || '').split(' ')[0];

  const set = (patch) => update((p) => touch({ ...p, version: 3 }, patch));
  const toggleIn = (key, id) =>
    update((p) =>
      touch({ ...p, version: 3 }, { [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] })
    );

  const metrics = useMemo(() => computeGoalDashboardMetrics(plan), [plan]);
  const todayList = useMemo(() => todayItems(plan), [plan]);
  const tickedToday = useMemo(() => checkedToday(plan), [plan]);
  const todayDoneCount = todayList.filter((i) => tickedToday.has(i.id)).length;
  const level = useMemo(() => planLevel(plan), [plan]);
  const streakDays = useMemo(() => streak(plan), [plan]);

  // Open the AI goal coach from anywhere on the page (hero, planner lanes, tabs).
  const openCoach = (preset = {}) => {
    const tab = preset.category === 'academic' ? 'academic' : preset.category === 'pbl' ? 'pbl' : 'quests';
    setActiveTab((cur) => (preset.category ? tab : ['quests', 'academic', 'pbl'].includes(cur) ? cur : 'quests'));
    setCoachRequest({ n: Date.now(), category: preset.category || null, subject: preset.subject || '' });
  };

  return (
    <div className="gh-page gl-page gl-teen">
      <GoalsHero
        firstName={firstName}
        metrics={metrics}
        todayDone={todayDoneCount}
        todayTotal={todayList.length}
        level={level}
        streakDays={streakDays}
        syncState={syncState}
        onSelectTab={setActiveTab}
        onOpenCoach={() => openCoach({})}
      />

      {/* Executive Goal Overview Bar */}
      <GoalOverviewStrip
        metrics={metrics}
        todayDone={todayDoneCount}
        todayTotal={todayList.length}
        academicContext={academicContext}
        plan={plan}
        onSelectTab={setActiveTab}
      />

      <nav className="gl-tabs" role="tablist" aria-label="Goal views">
        {TABS.map(({ id, label, Icon }) => {
          const badgeCount =
            id === 'academic'
              ? metrics.academicCount
              : id === 'pbl'
              ? metrics.pblCount
              : id === 'today'
              ? todayList.length - todayDoneCount
              : null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              className={`gl-tab ${activeTab === id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="gl-tab-icon"><Icon size={16} aria-hidden="true" /></span>
              <span className="gl-tab-text">{label}</span>
              {badgeCount > 0 && <span className="gl-tab-count">{badgeCount}</span>}
            </button>
          );
        })}
      </nav>

      <main className="gl-tab-content">
        {(activeTab === 'quests' || activeTab === 'academic' || activeTab === 'pbl') && (
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="gl-pane gl-pane-quests"
          >
            {activeTab === 'academic' && loaded && (
              <AcademicPlanner
                plan={plan}
                academicContext={academicContext}
                onOpenCoach={() => openCoach({ category: 'academic' })}
                onPlanSubject={(subject) => openCoach({ category: 'academic', subject })}
              />
            )}
            {loaded ? (
              <BigGoalsSection
                plan={plan}
                update={update}
                set={set}
                academicContext={academicContext}
                metrics={metrics}
                forcedCategory={activeTab === 'academic' ? 'academic' : activeTab === 'pbl' ? 'pbl' : null}
                onSwitchTab={setActiveTab}
                coachRequest={coachRequest}
                firstName={firstName}
              />
            ) : (
              <p role="status">Loading your goals…</p>
            )}
          </div>
        )}

        {activeTab === 'today' && (
          <div id="panel-today" role="tabpanel" aria-labelledby="tab-today" className="gl-pane gl-pane-today">
            <div className="gl-grid-two">
              <TodayCard
                plan={plan}
                update={update}
                metrics={metrics}
                onGoQuests={() => setActiveTab('quests')}
                onGoToolkit={() => setActiveTab('toolkit')}
              />
              <div className="gl-side-col">
                <UpcomingDeadlinesCard
                  metrics={metrics}
                  onOpenGoals={() => setActiveTab('quests')}
                />
                <FocusSkillCard plan={plan} set={set} />
                <QuickRechargeCard plan={plan} onGoToolkit={() => setActiveTab('toolkit')} />
              </div>
            </div>
            <DailyBountyBoard plan={plan} update={update} />
          </div>
        )}

        {activeTab === 'skills' && (
          <div id="panel-skills" role="tabpanel" aria-labelledby="tab-skills" className="gl-pane gl-pane-skills">
            <ArchetypeRadar plan={plan} />
          </div>
        )}

        {activeTab === 'toolkit' && (
          <div id="panel-toolkit" role="tabpanel" aria-labelledby="tab-toolkit" className="gl-pane gl-pane-toolkit">
            <ToolkitSection plan={plan} set={set} toggleIn={toggleIn} />
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================================
   HERO
   ========================================================================= */

function heroMessage({ metrics, todayDone, todayTotal }) {
  if (metrics.overdueGoals.length > 0) {
    const n = metrics.overdueGoals.length;
    return `${n} deadline${n === 1 ? ' has' : 's have'} slipped. Pick one small step to get back on track.`;
  }
  if (todayTotal > 0 && todayDone === todayTotal) return 'Everything for today is ticked off. Nice work.';
  if (todayTotal > 0) return `${todayTotal - todayDone} of ${todayTotal} actions left today. One at a time.`;
  if (metrics.activeCount === 0 && metrics.completedCount > 0) return 'Every goal is done. Ready for the next challenge?';
  if (metrics.activeCount === 0) return 'Start with one goal you actually care about.';
  return 'Break big targets into small daily actions and keep your momentum.';
}

function GoalsHero({ firstName, metrics, todayDone, todayTotal, level, streakDays, syncState, onSelectTab, onOpenCoach }) {
  const pct = Math.max(0, Math.min(100, metrics.overallProgressPct || 0));
  const r = 52;
  const circ = 2 * Math.PI * r;
  const todayLeft = Math.max(0, todayTotal - todayDone);

  return (
    <header className="gl-hero">
      <div className="gl-hero-art" aria-hidden="true">
        <span className="gl-hero-orb gl-hero-orb-a" />
        <span className="gl-hero-orb gl-hero-orb-b" />
        <span className="gl-hero-orb gl-hero-orb-c" />
        <span className="gl-hero-grid" />
      </div>

      <div className="gl-hero-main">
        <div className="gl-hero-topline">
          <span className="gl-hero-kicker">
            <Sparkles size={13} aria-hidden="true" /> Student goal center
          </span>
          <SyncBadge state={syncState} />
        </div>

        <h1>{firstName ? `${firstName}’s goals` : 'My goals'}</h1>
        <p className="gl-hero-lead">{heroMessage({ metrics, todayDone, todayTotal })}</p>

        <ul className="gl-hero-chips" aria-label="Your momentum">
          <li>
            <Star size={14} aria-hidden="true" />
            <span>Level {level.level} · {level.title}</span>
          </li>
          <li>
            <Flame size={14} aria-hidden="true" />
            <span>{streakDays > 0 ? `${streakDays}-day streak` : 'Start a streak today'}</span>
          </li>
          <li>
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>{metrics.completedSteps}/{metrics.totalSteps} milestones</span>
          </li>
        </ul>

        <div className="gl-hero-actions">
          <button type="button" className="gl-hero-btn gl-hero-btn-primary" onClick={() => onSelectTab('today')}>
            <Zap size={16} aria-hidden="true" />
            {todayTotal === 0 ? 'Plan today' : todayLeft > 0 ? `Today’s actions (${todayLeft} left)` : 'Review today'}
          </button>
          <button type="button" className="gl-hero-btn gl-hero-btn-coach" onClick={onOpenCoach}>
            <Sparkles size={16} aria-hidden="true" /> Set a goal with AI coach
          </button>
        </div>

        <p className="gl-hero-privacy">
          <Eye size={14} aria-hidden="true" /> Your coach can see this so they know what helps you. We never ask about a diagnosis.
        </p>
      </div>

      <div className="gl-hero-ring" role="img" aria-label={`Overall goal progress ${pct}%`}>
        <svg viewBox="0 0 128 128" aria-hidden="true">
          <defs>
            <linearGradient id="glHeroRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4f25a" />
              <stop offset="100%" stopColor="#5eead4" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={r} className="gl-hero-ring-track" />
          <circle
            cx="64"
            cy="64"
            r={r}
            className="gl-hero-ring-value"
            stroke="url(#glHeroRing)"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
          />
        </svg>
        <div className="gl-hero-ring-label">
          <strong>{pct}%</strong>
          <span>overall</span>
        </div>
        <p className="gl-hero-ring-sub">
          {metrics.activeCount} active · {metrics.completedCount} done
        </p>
      </div>
    </header>
  );
}

/* =========================================================================
   OVERVIEW & ADVENTUM PROFILE COMPONENTS
   ========================================================================= */

function SyncBadge({ state }) {
  if (state === 'local-only') {
    return (
      <span className="gl-tag gl-tag-warn" title="Only stored locally in your browser">
        <CloudOff size={13} aria-hidden="true" />
        <span>Local only</span>
      </span>
    );
  }
  if (state === 'saving') {
    return (
      <span className="gl-tag gl-tag-saving">
        <Cloud size={13} aria-hidden="true" />
        <span>Saving…</span>
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="gl-tag gl-tag-saved">
        <Check size={13} aria-hidden="true" />
        <span>Synced</span>
      </span>
    );
  }
  return null;
}

function GoalOverviewStrip({ metrics, todayDone, todayTotal, academicContext, plan, onSelectTab }) {
  const gradeDisplay =
    plan.academicProfile?.gradeLevel ||
    academicContext?.gradeLevel ||
    'Set grade level';

  return (
    <section className="gl-overview-strip" aria-label="Goal overview">
      <button type="button" className="gl-stat-tile" onClick={() => onSelectTab('quests')}>
        <div className="gl-stat-icon gl-bubble-purple"><Target size={18} aria-hidden="true" /></div>
        <div className="gl-stat-body">
          <span className="gl-stat-value">{metrics.activeCount} Active · {metrics.completedCount} Done</span>
          <span className="gl-stat-label">Total Goals ({metrics.overallProgressPct}% progress)</span>
        </div>
      </button>

      <button type="button" className="gl-stat-tile" onClick={() => onSelectTab('academic')}>
        <div className="gl-stat-icon gl-bubble-blue"><GraduationCap size={18} aria-hidden="true" /></div>
        <div className="gl-stat-body">
          <span className="gl-stat-value">{metrics.academicCount} Academic</span>
          <span className="gl-stat-label">{gradeDisplay}</span>
        </div>
      </button>

      <button type="button" className="gl-stat-tile" onClick={() => onSelectTab('pbl')}>
        <div className="gl-stat-icon gl-bubble-cyan"><Rocket size={18} aria-hidden="true" /></div>
        <div className="gl-stat-body">
          <span className="gl-stat-value">{metrics.pblCount} PBL Goals</span>
          <span className="gl-stat-label">{metrics.completedSteps}/{metrics.totalSteps} milestones done</span>
        </div>
      </button>

      <button type="button" className="gl-stat-tile" onClick={() => onSelectTab('today')}>
        <div className="gl-stat-icon gl-bubble-lime"><Zap size={18} aria-hidden="true" /></div>
        <div className="gl-stat-body">
          <span className="gl-stat-value">
            {todayTotal > 0 ? `${todayDone} of ${todayTotal} today` : 'Plan today'}
          </span>
          <span className="gl-stat-label">
            {metrics.overdueGoals.length > 0
              ? `${metrics.overdueGoals.length} overdue deadline${metrics.overdueGoals.length === 1 ? '' : 's'}`
              : metrics.approachingGoals.length > 0
              ? `${metrics.approachingGoals.length} upcoming deadline${metrics.approachingGoals.length === 1 ? '' : 's'}`
              : 'Daily actions & deadlines'}
          </span>
        </div>
      </button>
    </section>
  );
}

function AdventumAcademicBanner({ plan, set, academicContext, onSelectRecommendation }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const currentGrade = plan.academicProfile?.gradeLevel || academicContext?.gradeLevel || '';
  const currentGradDate = plan.academicProfile?.graduationDate || '';
  const currentPerfTarget = plan.academicProfile?.performanceTarget || '';

  const [draftGrade, setDraftGrade] = useState(currentGrade);
  const [draftGradDate, setDraftGradDate] = useState(currentGradDate);
  const [draftPerfTarget, setDraftPerfTarget] = useState(currentPerfTarget);

  const recommendations = useMemo(
    () =>
      buildGoalRecommendations({
        gradeLevel: currentGrade,
        subjects: academicContext?.subjects || [],
        academicProgress: academicContext?.overallAcademicProgress,
        coachGoals: academicContext?.coachGoals || [],
        pblProjects: academicContext?.pblProjects || [],
        existingGoals: plan.goals || []
      }),
    [currentGrade, academicContext, plan.goals]
  );

  const saveAcademicProfile = (e) => {
    e.preventDefault();
    set({
      academicProfile: {
        gradeLevel: draftGrade.trim(),
        graduationDate: draftGradDate.trim(),
        performanceTarget: draftPerfTarget.trim()
      }
    });
    setEditingProfile(false);
  };

  return (
    <section className="gl-card gl-adventum-card" aria-label="Academic Profile & Adventum Integration">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-blue">
            <GraduationCap size={18} aria-hidden="true" />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2>Academic Profile &amp; Adventum Sync</h2>
              <span
                className="gl-provider-pill"
                data-state={academicContext?.edmentumStatus?.state || 'unknown'}
              >
                Adventum / Edmentum: {academicContext?.edmentumStatus?.label || 'Checking…'}
              </span>
            </div>
            <p className="gl-subtitle">
              {academicContext?.subjects?.length > 0
                ? `Retrieved ${academicContext.subjects.length} subject${academicContext.subjects.length === 1 ? '' : 's'} from your academic record.`
                : `${academicContext?.edmentumStatus?.detail || 'Your academic profile helps tailor goal recommendations.'} You can also set your grade and subject targets manually below.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="gh-btn gh-btn-sm gh-btn-ghost"
          onClick={() => {
            setDraftGrade(currentGrade);
            setDraftGradDate(currentGradDate);
            setDraftPerfTarget(currentPerfTarget);
            setEditingProfile((v) => !v);
          }}
        >
          <Edit3 size={14} aria-hidden="true" />
          <span>{editingProfile ? 'Cancel' : 'Edit academic targets'}</span>
        </button>
      </div>

      {/* Summary pills for Grade, Graduation target, Overall Progress, and Connected Subjects */}
      <div className="gl-academic-meta-row">
        <div className="gl-academic-meta-item">
          <span className="gl-meta-kicker">Current Grade / Level</span>
          <strong>{currentGrade || 'Not set yet'}</strong>
        </div>
        <div className="gl-academic-meta-item">
          <span className="gl-meta-kicker">Graduation Target</span>
          <strong>{currentGradDate || 'Set graduation target'}</strong>
        </div>
        <div className="gl-academic-meta-item">
          <span className="gl-meta-kicker">Performance Target</span>
          <strong>
            {currentPerfTarget ||
              (academicContext?.overallAcademicProgress !== null
                ? `${academicContext.overallAcademicProgress}% observed progress`
                : academicContext?.gpa
                ? `GPA ${academicContext.gpa.value}/${academicContext.gpa.scale}`
                : 'On-track mastery')}
          </strong>
        </div>
        <div className="gl-academic-meta-item">
          <span className="gl-meta-kicker">Active Subjects &amp; Projects</span>
          <strong>
            {academicContext?.subjects?.length
              ? academicContext.subjects.map((s) => s.subject).join(', ')
              : `${academicContext?.pblProjects?.length || 0} PBL programs available`}
          </strong>
        </div>
      </div>

      {editingProfile && (
        <form className="gl-academic-profile-form" onSubmit={saveAcademicProfile}>
          <div className="gl-flow-context-grid">
            <div className="gl-field">
              <label htmlFor="gl-prof-grade" className="gl-field-label">Current Grade / Year Level</label>
              <select
                id="gl-prof-grade"
                className="gh-input gl-select"
                value={draftGrade}
                onChange={(e) => setDraftGrade(e.target.value)}
              >
                <option value="">Choose grade / year level</option>
                {GRADE_LEVEL_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="gl-field">
              <label htmlFor="gl-prof-grad" className="gl-field-label">Graduation Target &amp; Date</label>
              <input
                id="gl-prof-grad"
                className="gh-input"
                value={draftGradDate}
                maxLength={60}
                onChange={(e) => setDraftGradDate(e.target.value)}
                placeholder="e.g. June 2028 · Secondary Diploma"
              />
            </div>
            <div className="gl-field gl-field-full">
              <label htmlFor="gl-prof-perf" className="gl-field-label">Academic Performance Target</label>
              <input
                id="gl-prof-perf"
                className="gh-input"
                value={draftPerfTarget}
                maxLength={120}
                onChange={(e) => setDraftPerfTarget(e.target.value)}
                placeholder="e.g. Maintain 85%+ across STEM subjects and complete all Adventum units on schedule"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" className="gh-btn gh-btn-sm gh-btn-accent">
              <Check size={14} aria-hidden="true" /> Save academic profile
            </button>
          </div>
        </form>
      )}

      {/* Subject Progress Cards if retrieved from Adventum / Academic Snapshots */}
      {academicContext?.subjects?.length > 0 && (
        <div className="gl-adventum-subjects">
          <span className="gl-field-label">Connected Subjects &amp; Progress</span>
          <div className="gl-subject-cards-row">
            {academicContext.subjects.map((subj) => (
              <div key={subj.id} className="gl-subject-mini-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <strong>{subj.subject}</strong>
                  <span className="gl-subject-source">{subj.provider}</span>
                </div>
                {subj.progressPct !== null ? (
                  <>
                    <div className="gl-progress-track" style={{ height: 6, margin: '0.35rem 0' }}>
                      <div className="gl-progress-fill" style={{ width: `${subj.progressPct}%` }} />
                    </div>
                    <small>{subj.completedUnits} of {subj.totalUnits} units ({subj.progressPct}%)</small>
                  </>
                ) : subj.grade ? (
                  <small>Current Grade: <strong>{subj.grade}</strong> ({subj.term})</small>
                ) : (
                  <small>{subj.source}</small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Goals Tray */}
      {recommendations.length > 0 && (
        <div className="gl-recs-tray">
          <div className="gl-recs-header">
            <Sparkles size={14} aria-hidden="true" />
            <span>Recommended goals from your academic &amp; PBL profile</span>
          </div>
          <div className="gl-recs-grid">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="gl-rec-card">
                <div className="gl-rec-top">
                  <span className={`gl-cat-badge gl-cat-${rec.category}`}>
                    {rec.category === 'pbl' ? 'PBL' : 'Academic'}
                  </span>
                  {rec.subject && <span className="gl-rec-subj">{rec.subject}</span>}
                  {rec.projectTitle && <span className="gl-rec-subj">{rec.projectTitle}</span>}
                </div>
                <h4>{rec.explore}</h4>
                <p className="gl-rec-reason">{rec.reason}</p>
                <button
                  type="button"
                  className="gh-btn gh-btn-sm gh-btn-ghost gl-rec-use-btn"
                  onClick={() => onSelectRecommendation(rec)}
                >
                  <Plus size={13} aria-hidden="true" /> Use this goal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- TODAY VIEW ---------------- */

function TodayCard({ plan, update, metrics, onGoQuests, onGoToolkit }) {
  const items = todayItems(plan);
  const checked = checkedToday(plan);
  const done = items.filter((i) => checked.has(i.id)).length;
  const isAllComplete = items.length > 0 && done === items.length;
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <section className="gl-card gl-today-hero" id="gl-today">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-lime">
            <Zap size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Today’s Goals &amp; Actions</h2>
            <p className="gl-subtitle">{dateStr}</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className={`gl-meter-pill ${isAllComplete ? 'is-complete' : ''}`}>
            {done} of {items.length} done
          </span>
        )}
      </div>

      {/* Overdue Alert Banner in Today View */}
      {metrics?.overdueGoals?.length > 0 && (
        <div className="gl-deadline-banner is-overdue" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>
              {metrics.overdueGoals.length} overdue goal{metrics.overdueGoals.length === 1 ? '' : 's'} need attention
            </strong>
            <p>
              {metrics.overdueGoals.map((g) => `${g.explore} (Due ${g.targetDate})`).join(' · ')}
            </p>
          </div>
          <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={onGoQuests}>
            Update goals
          </button>
        </div>
      )}

      {items.length > 0 ? (
        <>
          <QuestEnergyBar
            current={done}
            total={items.length}
            title="Today’s Momentum Energy"
          />

          <ul className="gl-task-list">
            {items.map((it) => {
              const on = checked.has(it.id);
              const catLabel =
                it.category === 'pbl'
                  ? 'PBL Action'
                  : it.category === 'academic'
                  ? 'Academic Goal'
                  : it.kind === 'habit'
                  ? 'Daily habit'
                  : it.kind === 'recharge'
                  ? 'Break'
                  : 'Goal step';
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`gl-task-item ${on ? 'is-checked' : ''}`}
                    aria-pressed={on}
                    onClick={(e) => {
                      triggerSparkParticles(e.currentTarget, on ? 10 : 22);
                      playSfx(!on && done + 1 === items.length ? 'levelup' : 'step');
                      update((p) => toggleToday(p, it));
                    }}
                  >
                    <span className="gl-checkbox">
                      {on ? (
                        <CheckCircle2 size={22} className="gl-checked-icon" />
                      ) : (
                        <Circle size={22} className="gl-unchecked-icon" />
                      )}
                    </span>
                    <span className="gl-task-body">
                      <span className="gl-task-text">{it.text}</span>
                      <span className="gl-task-tag">
                        <span className={`gl-mini-cat gl-mini-cat-${it.category || it.kind || 'step'}`}>
                          {catLabel}
                        </span>
                        {it.kind === 'step' ? ` · Step for: ${it.goal}` : ''}
                        {it.subject ? ` (${it.subject})` : it.projectTitle ? ` (${it.projectTitle})` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {isAllComplete && (
            <div className="gl-celebration-banner">
              <Check size={20} aria-hidden="true" />
              <div>
                <strong>That’s everything for today.</strong>
                <p>Nice work. Take a break, or try something you enjoy.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="gl-empty-box">
          <Compass size={32} className="gl-empty-icon" aria-hidden="true" />
          <h3>Nothing here yet</h3>
          <p>Your list fills in from your Academic goals, PBL project actions, daily habit, and breaks.</p>
          <div className="gl-empty-actions">
            <button type="button" className="gh-btn gh-btn-sm gh-btn-accent" onClick={onGoQuests}>
              <Plus size={14} aria-hidden="true" />Set a goal
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={onGoToolkit}>
              Choose what helps me
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function UpcomingDeadlinesCard({ metrics, onOpenGoals }) {
  const upcoming = metrics?.upcomingDeadlines || [];
  return (
    <section className="gl-card gl-deadlines-card" aria-label="Upcoming deadlines">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-blue">
            <Calendar size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Upcoming Deadlines</h2>
            <p className="gl-subtitle">Target dates across Academic &amp; PBL goals</p>
          </div>
        </div>
      </div>
      {upcoming.length > 0 ? (
        <ul className="gl-deadlines-list">
          {upcoming.slice(0, 5).map(({ goal, deadline }) => (
            <li
              key={goal.id}
              className={`gl-deadline-item ${deadline.isOverdue ? 'is-overdue' : deadline.isApproaching ? 'is-soon' : ''}`}
            >
              <div className="gl-deadline-info">
                <span className={`gl-cat-badge gl-cat-${goal.category || 'academic'}`}>
                  {goal.category === 'pbl' ? 'PBL' : 'Academic'}
                </span>
                <strong>{goal.explore}</strong>
              </div>
              <span className="gl-deadline-pill">{deadline.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="gl-recharge-empty">
          <span>No target dates set yet. Add a target date to any goal to track deadlines here.</span>
          <button type="button" className="gl-link-action" onClick={onOpenGoals}>
            Manage goals →
          </button>
        </div>
      )}
    </section>
  );
}

function FocusSkillCard({ plan, set }) {
  const focus = plan.focus;
  const skill = FOCUS_SKILLS.find((s) => s.id === focus?.skill);
  const week = habitWeek(plan);
  const today = dayKey();

  const choose = (id) => {
    const s = FOCUS_SKILLS.find((x) => x.id === id);
    set({ focus: focus?.skill === id ? null : { skill: id, habit: s.habits[0], daysPerWeek: focus?.daysPerWeek || 5 } });
  };

  return (
    <section className="gl-card gl-focus-card" id="gl-focus">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-purple">
            <Zap size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>Daily habit</h2>
            <p className="gl-subtitle">One small thing to practise each day</p>
          </div>
        </div>
      </div>

      <div className="gl-chip-group" role="group" aria-label="Choose a skill to practise">
        {FOCUS_SKILLS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`gl-pill ${focus?.skill === s.id ? 'is-selected' : ''}`}
            aria-pressed={focus?.skill === s.id}
            onClick={() => choose(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {skill && (
        <div className="gl-focus-active-box">
          <div className="gl-field">
            <span className="gl-field-label">My habit</span>
            <div className="gl-chip-group gl-habit-options" role="group" aria-label="Suggested habits">
              {skill.habits.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`gl-pill gl-pill-subtle ${focus.habit === h ? 'is-selected' : ''}`}
                  aria-pressed={focus.habit === h}
                  onClick={() => set({ focus: { ...focus, habit: h } })}
                >
                  {h}
                </button>
              ))}
            </div>
            <input
              className="gh-input gl-habit-input"
              value={focus.habit}
              maxLength={LIMITS.text}
              aria-label="My own habit"
              onChange={(e) => set({ focus: { ...focus, habit: e.target.value } })}
              placeholder="Or write your own"
            />
          </div>

          <div className="gl-field">
            <span className="gl-field-label">Days each week</span>
            <div className="gl-chip-group" role="group" aria-label="Days per week target">
              {[3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`gl-pill gl-pill-num ${focus.daysPerWeek === n ? 'is-selected' : ''}`}
                  aria-pressed={focus.daysPerWeek === n}
                  onClick={() => set({ focus: { ...focus, daysPerWeek: n } })}
                >
                  {n} days
                </button>
              ))}
            </div>
          </div>

          <div className="gl-streak-tracker">
            <span className="gl-streak-title">The last 7 days</span>
            <div className="gl-dot-row">
              {week.days.map((d) => (
                <div key={d.day} className="gl-dot-col">
                  <span
                    className={`gl-dot ${d.done ? 'is-done' : ''} ${d.day === today ? 'is-today' : ''}`}
                    title={`${new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'long' })}: ${d.done ? 'Done' : 'Pending'}`}
                  >
                    {d.done ? '✓' : new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                  <span className="gl-dot-day">{new Date(`${d.day}T12:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                </div>
              ))}
            </div>
            <div className="gl-streak-stat">
              <strong>{week.count} of {week.target}</strong> days done this week
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function QuickRechargeCard({ plan, onGoToolkit }) {
  const topRecharge = plan.recharge[0];
  const item = RECHARGE.find((r) => r.id === topRecharge);

  return (
    <section className="gl-card gl-recharge-compact">
      <div className="gl-card-header">
        <div className="gl-card-title-group">
          <span className="gl-icon-bubble gl-bubble-cyan">
            <BatteryCharging size={18} aria-hidden="true" />
          </span>
          <div>
            <h2>My break</h2>
            <p className="gl-subtitle">What you do when you need a rest</p>
          </div>
        </div>
      </div>
      {item ? (
        <div className="gl-recharge-pill-active">
          <span>My break: <strong>{item.label}</strong></span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Change it →
          </button>
        </div>
      ) : (
        <div className="gl-recharge-empty">
          <span>You haven’t picked a break yet.</span>
          <button type="button" className="gl-link-action" onClick={onGoToolkit}>
            Choose one →
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------------- MY GOALS (OVERVIEW, ACADEMIC, PBL, ACTIVE, COMPLETED) ---------------- */

function BigGoalsSection({
  plan,
  update,
  set,
  academicContext,
  metrics,
  forcedCategory = null,
  onSwitchTab,
  coachRequest = null,
  firstName = ''
}) {
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState('coach'); // 'coach' | 'form'
  const [coachPreset, setCoachPreset] = useState(null);
  const composerRef = useRef(null);
  const lastRequest = useRef(coachRequest?.n || null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [saved, setSaved] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'academic' | 'pbl' | 'skills' | 'personal'

  const effectiveCategory = forcedCategory || (categoryFilter === 'all' ? null : categoryFilter);
  const maxAllowed = LIMITS.maxGoals || 12;
  const full = plan.goals.length >= maxAllowed;
  const editingGoal = editingGoalId ? plan.goals.find((g) => g.id === editingGoalId) : null;
  const showFlow = Boolean(editingGoal) || (!full && (adding || plan.goals.length === 0));

  const patchGoal = (id, fn) =>
    update((p) =>
      touch({ ...p, version: 3 }, { goals: p.goals.map((g) => (g.id === id ? { ...fn(g), updatedAt: Date.now() } : g)) })
    );

  const removeGoal = (id) =>
    update((p) => touch({ ...p, version: 3 }, { goals: p.goals.filter((g) => g.id !== id) }));

  const skillsCount = plan.goals.filter((g) => g.category === 'skills').length;
  const personalCount = plan.goals.filter((g) => g.category === 'personal').length;

  const filteredGoals = useMemo(() => {
    return plan.goals.filter((g) => {
      if (effectiveCategory) {
        // Legacy goals without a category appear under 'all' or 'academic' if no category was set
        const gCat = g.category || 'academic';
        if (gCat !== effectiveCategory) return false;
      }
      if (statusFilter === 'active' && g.done) return false;
      if (statusFilter === 'completed' && !g.done) return false;
      return true;
    });
  }, [plan.goals, effectiveCategory, statusFilter]);

  const handleSelectRecommendation = (rec) => {
    setSaved(null);
    setEditingGoalId(null);
    setSelectedRec(rec);
    setMode('form');
    setAdding(true);
  };

  const startCoach = (preset) => {
    setSaved(null);
    setEditingGoalId(null);
    setSelectedRec(null);
    setCoachPreset(preset);
    setMode('coach');
    setAdding(true);
  };

  useEffect(() => {
    if (!coachRequest || coachRequest.n === lastRequest.current) return;
    lastRequest.current = coachRequest.n;
    startCoach({ category: coachRequest.category, subject: coachRequest.subject });
    requestAnimationFrame(() => composerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
  }, [coachRequest]);

  const addGoal = (g) => {
    update((p) => touch({ ...p, version: 3 }, { goals: [...p.goals, g] }));
    setSaved(g.steps[0]?.text || g.explore);
    setAdding(false);
    setSelectedRec(null);
  };

  const closeComposer = plan.goals.length || editingGoal
    ? () => {
        setAdding(false);
        setEditingGoalId(null);
        setSelectedRec(null);
      }
    : null;

  return (
    <div className="gh-app gl-quests-layout" id="gl-goals">

      {saved && !showFlow && (
        <div className="gl-celebration-banner gl-flow-saved" role="status">
          <Check size={20} aria-hidden="true" />
          <div>
            <strong>Goal saved. {saved ? `Your first step: ${saved}` : ''}</strong>
            <p><a href={hrefFor.dashboard()}>Go to My Quests <ArrowRight size={14} aria-hidden="true" /></a></p>
          </div>
        </div>
      )}

      <div ref={composerRef} className="gl-composer-anchor" />
      {showFlow && mode === 'coach' && !editingGoal ? (
        <GoalCoach
          key={`coach-${coachRequest?.n || 0}-${coachPreset?.category || forcedCategory || ''}-${coachPreset?.subject || ''}`}
          firstName={firstName}
          academicContext={academicContext}
          supports={plan.supports}
          preset={coachPreset || (forcedCategory ? { category: forcedCategory } : null)}
          onCancel={closeComposer}
          onUseForm={(draft) => {
            setSelectedRec(draft.explore ? { id: `coach-${Date.now()}`, ...draft, category: draft.category || forcedCategory || 'academic' } : null);
            setMode('form');
          }}
          onSave={(g) => {
            addGoal(g);
            buzz([10, 40, 10]);
            confetti({ big: true });
            playSfx('levelup');
          }}
        />
      ) : showFlow ? (
        <GoalFlow
          key={editingGoal?.id || selectedRec?.id || forcedCategory || 'new'}
          supportsFirst={plan.supports}
          academicContext={academicContext}
          initialGoal={editingGoal}
          initialCategory={forcedCategory || selectedRec?.category || null}
          initialRecommendation={selectedRec}
          onCancel={closeComposer}
          onAdd={addGoal}
          onSaveEdit={(updatedGoal) => {
            update((p) =>
              touch(
                { ...p, version: 3 },
                { goals: p.goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)) }
              )
            );
            setSaved(updatedGoal.steps[0]?.text || updatedGoal.explore);
            setEditingGoalId(null);
            setAdding(false);
          }}
        />
      ) : (
        <div className="gl-quests-toolbar">
          <div className="gl-filter-row">
            {/* Category filter pills when on main Overview tab */}
            {!forcedCategory && (
              <div className="gl-chip-group" role="group" aria-label="Filter by category">
                {[
                  ['all', `All (${plan.goals.length})`],
                  ['academic', `Academic (${metrics.academicCount})`],
                  ['pbl', `PBL (${metrics.pblCount})`],
                  ['skills', skillsCount ? `Skills (${skillsCount})` : 'Skills'],
                  ['personal', personalCount ? `Personal (${personalCount})` : 'Personal']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`gl-pill ${categoryFilter === id ? 'is-selected' : ''}`}
                    aria-pressed={categoryFilter === id}
                    onClick={() => setCategoryFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Active / Completed status filter */}
            <div className="gl-chip-group" role="group" aria-label="Filter by status">
              {[
                ['all', 'All status'],
                ['active', `Active (${metrics.activeCount})`],
                ['completed', `Completed (${metrics.completedCount})`]
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`gl-pill gl-pill-subtle ${statusFilter === id ? 'is-selected' : ''}`}
                  aria-pressed={statusFilter === id}
                  onClick={() => setStatusFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!full && (
            <div className="gl-quests-top-actions">
              <button
                type="button"
                className="gh-btn gh-btn-accent"
                onClick={() => startCoach(forcedCategory ? { category: forcedCategory } : null)}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>
                  {forcedCategory === 'academic'
                    ? 'Set an Academic goal'
                    : forcedCategory === 'pbl'
                    ? 'Set a PBL goal'
                    : 'Set a new goal'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {filteredGoals.length > 0 ? (
        <div className="gl-quest-cards-grid">
          {filteredGoals.map((g) => (
            <QuestCard
              key={g.id}
              goal={g}
              patch={(fn) => patchGoal(g.id, fn)}
              onEdit={() => {
                setSaved(null);
                setEditingGoalId(g.id);
              }}
              remove={() => removeGoal(g.id)}
            />
          ))}
        </div>
      ) : (
        plan.goals.length > 0 && !showFlow && (
          <div className="gl-empty-box">
            <Layers size={28} className="gl-empty-icon" aria-hidden="true" />
            <h3>No matching goals in this view</h3>
            <p>Try switching the filter above or create a new {forcedCategory === 'pbl' ? 'PBL' : forcedCategory === 'academic' ? 'Academic' : ''} goal.</p>
            <div className="gl-empty-actions">
              <button
                type="button"
                className="gh-btn gh-btn-sm gh-btn-accent"
                onClick={() => {
                  setSaved(null);
                  setAdding(true);
                }}
              >
                <Plus size={14} aria-hidden="true" /> Add goal here
              </button>
              {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  type="button"
                  className="gh-btn gh-btn-sm gh-btn-ghost"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    onSwitchTab?.('quests');
                  }}
                >
                  Show all goals
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Adventum & Academic Profile Banner (below the goals so the coach and goal list come first) */}
      {(!forcedCategory || forcedCategory === 'academic') && (
        <AdventumAcademicBanner
          plan={plan}
          set={set}
          academicContext={academicContext}
          onSelectRecommendation={handleSelectRecommendation}
        />
      )}
      {full && (
        <p className="gl-capacity-note">
          You have reached the maximum of {maxAllowed} active goals. Finish or remove one to add another.
        </p>
      )}
    </div>
  );
}

function QuestCard({ goal, patch, onEdit, remove }) {
  const [newStepText, setNewStepText] = useState('');
  const [newStepFreq, setNewStepFreq] = useState('daily');
  const [confirming, setConfirming] = useState(false);

  const steps = Array.isArray(goal.steps) ? goal.steps : [];
  const doneCount = steps.filter((s) => s.done).length;
  const isGoalFinished = goal.done;
  const progressPct = isGoalFinished ? 100 : steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  const catMeta = categoryMeta(goal.category || 'academic');
  const subLabel = goal.goalType ? subtypeLabel(goal.goalType) : '';
  const deadline = goalDeadlineStatus(goal);

  function addStep(e) {
    e.preventDefault();
    if (!newStepText.trim()) return;
    patch((g) => ({
      ...g,
      steps: [
        ...g.steps,
        {
          id: newId('s'),
          text: newStepText.trim().slice(0, LIMITS.text),
          done: false,
          frequency: newStepFreq
        }
      ].slice(0, LIMITS.steps)
    }));
    setNewStepText('');
  }

  return (
    <article className={`gl-card gl-quest-card ${isGoalFinished ? 'is-completed-quest' : ''}`}>
      <div className="gl-quest-card-head">
        <div className="gl-quest-title-area">
          <div className="gl-quest-badges-row">
            <span className={`gl-quest-badge ${isGoalFinished ? 'is-done' : ''}`}>
              {isGoalFinished ? <Check size={14} aria-hidden="true" /> : <Flag size={14} aria-hidden="true" />}
              <span>{isGoalFinished ? 'Done' : goal.category ? catMeta.shortLabel : 'My goal'}</span>
            </span>
            {subLabel && <span className="gl-subtype-badge">{subLabel}</span>}
            {goal.subject && (
              <span className="gl-context-badge"><BookOpen size={12} aria-hidden="true" /> {goal.subject}</span>
            )}
            {goal.projectTitle && (
              <span className="gl-context-badge"><Rocket size={12} aria-hidden="true" /> {goal.projectTitle}</span>
            )}
            {deadline.hasDeadline && (
              <span
                className={`gl-deadline-badge ${
                  deadline.isOverdue ? 'is-overdue' : deadline.isApproaching ? 'is-soon' : ''
                }`}
              >
                <Clock size={12} aria-hidden="true" /> {deadline.label}
              </span>
            )}
          </div>

          <h3 className="gl-quest-sentence">{goal.source === 'coach' ? goal.explore : goalSentence(goal)}</h3>

          {goal.measurableOutcome && (
            <p className="gl-quest-outcome">
              <strong>Outcome:</strong> {goal.measurableOutcome}
            </p>
          )}
          {goal.graduationTarget && (
            <p className="gl-quest-outcome">
              <strong>Graduation Target:</strong> {goal.graduationTarget}
            </p>
          )}
        </div>
      </div>

      {/* Teen Quest energy bar & waypoint map (clicking a waypoint ticks that step) */}
      <QuestEnergyBar
        current={doneCount}
        total={steps.length || 1}
        steps={steps}
        title="Quest Charge & Waypoints"
        onToggleStep={(stepId) =>
          patch((g) => ({
            ...g,
            steps: g.steps.map((x) => (x.id === stepId ? { ...x, done: !x.done } : x))
          }))
        }
      />

      {/* Milestone Steps Checklist */}
      <div className="gl-quest-steps-wrapper">
        <div className="gl-steps-header">
          <span className="gl-steps-count">
            <strong>{doneCount} of {steps.length}</strong> steps done ({progressPct}%)
          </span>
        </div>

        <ul className="gl-quest-step-list">
          {steps.map((s) => (
            <li key={s.id} className="gl-step-row">
              <button
                type="button"
                className={`gl-step-check ${s.done ? 'is-done' : ''}`}
                aria-pressed={s.done}
                onClick={(e) => {
                  triggerSparkParticles(e.currentTarget, s.done ? 8 : 18);
                  playSfx(s.done ? 'step' : 'bounty');
                  patch((g) => ({
                    ...g,
                    steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x))
                  }));
                }}
              >
                {s.done ? <CheckCircle2 size={18} className="gl-check-icon" /> : <Circle size={18} />}
                <span className="gl-step-text">{s.text}</span>
                {s.frequency && (
                  <span className="gl-freq-tag">{s.frequency}</span>
                )}
              </button>
              <button
                type="button"
                className="gl-icon-btn gl-step-delete"
                aria-label={`Remove step: ${s.text}`}
                onClick={() => patch((g) => ({ ...g, steps: g.steps.filter((x) => x.id !== s.id) }))}
              >
                <Trash size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {!isGoalFinished && steps.length < LIMITS.steps && (
          <form className="gl-step-form" onSubmit={addStep}>
            <input
              className="gh-input gl-step-input"
              value={newStepText}
              maxLength={LIMITS.text}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add the next small step…"
              aria-label={`Add step to ${goal.explore}`}
            />
            <select
              className="gh-input gl-step-freq-select"
              value={newStepFreq}
              aria-label="Step frequency"
              onChange={(e) => setNewStepFreq(e.target.value)}
            >
              {STEP_FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>{f.id}</option>
              ))}
            </select>
            <button type="submit" className="gh-btn gh-btn-sm" disabled={!newStepText.trim()}>
              <Plus size={14} aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>
        )}
      </div>

      {/* Quest Actions: Finish/Reopen, Edit, Remove */}
      <div className="gl-quest-footer">
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`gh-btn gh-btn-sm ${isGoalFinished ? 'gh-btn-ghost' : 'gh-btn-accent'}`}
            onClick={(e) => {
              if (!isGoalFinished) {
                triggerSparkParticles(e.currentTarget, 35);
                playSfx('levelup');
              }
              patch((g) => ({ ...g, done: !g.done }));
            }}
          >
            {isGoalFinished ? (
              <>
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reopen this goal</span>
              </>
            ) : (
              <>
                <Check size={14} aria-hidden="true" />
                <span>I’ve finished this goal</span>
              </>
            )}
          </button>

          {onEdit && (
            <button
              type="button"
              className="gh-btn gh-btn-sm gh-btn-ghost"
              onClick={onEdit}
              aria-label={`Edit goal: ${goal.explore}`}
            >
              <Edit3 size={14} aria-hidden="true" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {confirming ? (
          <div className="gl-confirm-strip">
            <span>Remove this goal?</span>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-danger" onClick={remove}>
              Remove
            </button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="gl-delete-ghost" onClick={() => setConfirming(true)} aria-label="Remove goal">
            <Trash size={14} aria-hidden="true" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </article>
  );
}

/* ---------------- WHAT HELPS ME & NOTIFICATION PREFERENCES ---------------- */

function ToolkitSection({ plan, set, toggleIn }) {
  const [copiedPhrase, setCopiedPhrase] = useState(null);
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(plan.notificationPrefs || {}) };

  const togglePref = (key) => {
    set({
      notificationPrefs: {
        ...prefs,
        [key]: !prefs[key]
      }
    });
  };

  const copyPhrase = (text, id) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedPhrase(id);
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch {
      /* clipboard write denied in some contexts */
    }
  };

  return (
    <div className="gl-toolkit-grid">
      {/* 1. Strengths */}
      <section className="gl-card gl-toolkit-card" id="gl-strengths">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-purple">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What I’m good at</h2>
              <p className="gl-subtitle">What do you enjoy or find easy?</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.strengths.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Strengths">
          {STRENGTHS.map((it) => {
            const on = plan.strengths.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('strengths', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="gl-own-field">
          <label htmlFor="own-strength">Have another superpower?</label>
          <input
            id="own-strength"
            className="gh-input"
            value={plan.strengthsOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ strengthsOwn: e.target.value })}
            placeholder="e.g. 3D modeling, trivia, storytelling"
          />
        </div>
      </section>

      {/* 2. Supports */}
      <section className="gl-card gl-toolkit-card" id="gl-supports">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-lime">
              <Heart size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What helps me learn</h2>
              <p className="gl-subtitle">The tools and setup that make learning easier for you</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.supports.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Supports">
          {SUPPORTS.map((it) => {
            const on = plan.supports.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('supports', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="gl-own-field">
          <label htmlFor="own-support">Anything else that helps you thrive?</label>
          <input
            id="own-support"
            className="gh-input"
            value={plan.supportsOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ supportsOwn: e.target.value })}
            placeholder="e.g. sitting near a window, dark mode screen"
          />
        </div>
      </section>

      {/* 3. Phrases */}
      <section className="gl-card gl-toolkit-card" id="gl-phrases">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-blue">
              <MessageCircle size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Things I can say</h2>
              <p className="gl-subtitle">Words you can use when you need something</p>
            </div>
          </div>
        </div>

        <ul className="gl-phrase-cards">
          {PHRASES.map((p) => {
            const active = plan.phrases.includes(p.id);
            const isCopied = copiedPhrase === p.id;
            return (
              <li key={p.id}>
                <div className={`gl-phrase-card ${active ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className="gl-phrase-toggle"
                    aria-pressed={active}
                    onClick={() => toggleIn('phrases', p.id)}
                  >
                    <span className="gl-phrase-quote">“{p.text}”</span>
                  </button>
                  <button
                    type="button"
                    className="gl-phrase-copy-btn"
                    onClick={() => copyPhrase(p.text, p.id)}
                    title="Copy phrase to clipboard"
                  >
                    {isCopied ? <Check size={14} className="gl-copied-icon" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="gl-own-field">
          <label htmlFor="own-phrase">My own go-to phrase</label>
          <input
            id="own-phrase"
            className="gh-input"
            value={plan.phraseOwn || ''}
            maxLength={LIMITS.own}
            onChange={(e) => set({ phraseOwn: e.target.value })}
            placeholder="Write a sentence you feel comfortable using in class"
          />
        </div>
      </section>

      {/* 4. Vibe Reset (Recharge Plan) */}
      <section className="gl-card gl-toolkit-card" id="gl-recharge">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-cyan">
              <BatteryCharging size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>What I do for a break</h2>
              <p className="gl-subtitle">What helps you feel better after a hard day?</p>
            </div>
          </div>
          <span className="gl-counter-chip">{plan.recharge.length} picked</span>
        </div>

        <div className="gl-chip-group" role="group" aria-label="Recharge activities">
          {RECHARGE.map((it) => {
            const on = plan.recharge.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                className={`gl-pill ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() => toggleIn('recharge', it.id)}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Daily Notification Preferences */}
      <section className="gl-card gl-toolkit-card" id="gl-notifications">
        <div className="gl-card-header">
          <div className="gl-card-title-group">
            <span className="gl-icon-bubble gl-bubble-purple">
              <Bell size={18} aria-hidden="true" />
            </span>
            <div>
              <h2>Daily Goal Notifications</h2>
              <p className="gl-subtitle">Choose which reminders appear in your notification bell and daily check-in</p>
            </div>
          </div>
        </div>

        <div className="gl-notif-prefs-list" role="group" aria-label="Notification preferences">
          {[
            ['dailyReminder', 'Daily goal check-in & bell reminders', 'Show my uncompleted steps for today'],
            ['academicAlerts', 'Academic goal reminders', 'Include my subject and exam steps in daily reminders'],
            ['pblAlerts', 'PBL project action reminders', 'Include my project milestones and deliverables'],
            ['deadlineAlerts', 'Upcoming deadline & overdue alerts', 'Remind me when a goal target date is within 3 days or overdue']
          ].map(([key, title, desc]) => (
            <label key={key} className="gl-notif-pref-row">
              <input
                type="checkbox"
                checked={Boolean(prefs[key])}
                onChange={() => togglePref(key)}
              />
              <div>
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
