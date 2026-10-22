import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { useHashRoute } from './useHashRoute.js';
import { parseRoute, hrefFor } from './routes.js';
import { CONSOLE_ROLES } from './roles.js';
import { AdminConsole } from '../features/admin/AdminConsole.jsx';
import { SettingsPage } from '../features/settings/SettingsPage.jsx';
import { MyCourses } from '../features/courses/MyCourses.jsx';
import { HomeSearch } from '../features/home/HomeSearch.jsx';
import { GoalsPage } from '../features/goals/GoalsPage.jsx';
import { FutureSkillsPage } from '../features/futureSkills/FutureSkillsPage.jsx';
import { DailyGoalsNotice } from '../features/goals/DailyGoalsNotice.jsx';
import { ParentPortal } from '../features/parent/ParentPortal.jsx';
import { Worksheet, TeacherGuide, PrimaryResources } from '../features/primary/print/PrintSheets.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { TopNav } from '../features/shell/TopNav.jsx';
import { Header } from '../features/shell/Header.jsx';
import { StudentDashboard } from '../features/student/StudentDashboard.jsx';
import { CoachDashboardHost } from '../features/coach/CoachDashboardHost.jsx';
import { showActivity, hideAllActivities, isLegacyActivity, isReactActivity, trackActivityOpen, ACTIVITY_NAV } from '../features/activities/activityHost.js';
import { SolarCarChallenge } from '../features/activities/solarCar/SolarCarChallenge.jsx';
import { So2SulfateSimulation } from '../features/activities/so2Sulfate/So2SulfateSimulation.jsx';
import { PlantMicroscopeLab } from '../features/activities/plantLab/PlantMicroscopeLab.jsx';
import { ProjectHexGrid } from '../features/activities/hexGrid/ProjectHexGrid.jsx';
import { JuniorExplorers } from '../features/primary/JuniorExplorers.jsx';
import { PblStudio } from '../features/pbl/PblStudio.jsx';
import { CommunityFeed } from '../features/community/CommunityFeed.jsx';
import { MessagesScreen } from '../features/messages/MessagesScreen.jsx';
import { AdminAuditView } from '../features/messages/AdminAuditView.jsx';
import { isPrimaryProfile } from '../auth.js';
import { API_BASE } from '../services/apiBase.js';
import { initializeSENGlobally } from '../integrations/senIntegration.js';
import { renderSENToggle } from '../components/SEN/SENPreferenceToggle.js';
import { createGoalSettingModal } from '../components/Goals/GoalSettingModal.js';
import { showGoalsPanel } from '../integrations/goalSettingIntegration.js';

const KNOWN_VIEWS = new Set(ACTIVITY_NAV.map((a) => a.id));

export function App() {
  const { status, user, profile, role, classIds, error, signOut, refreshProfile } = useAuth();
  const [hash, setHash, clearHash] = useHashRoute();
  const [view, setView] = useState('home');
  // Primary learners get Junior Explorers only: no secondary activities, no AI
  // chatbot and no goal-setting popup (see the 2026-09-25 primary plan).
  const isPrimary = role === 'student' && isPrimaryProfile(profile);

  const route = parseRoute(hash);
  const hashScreen = route?.screen || null;

  // Legacy auth code calls switchPhase('home') around sign-in and sign-out.
  // Only a signed-in navigation may clear a hash screen, or a deep link such as
  // #/admin/users/<uid> would be lost on the way through the login page.
  const signedInRef = useRef(false);
  signedInRef.current = status === 'ready';
  const hashScreenRef = useRef(null);
  hashScreenRef.current = hashScreen;

  const navigate = useCallback((requested) => {
    // Legacy code calls switchPhase('login') when signed out. Accepting it as
    // a view left a learner who signed back in on a blank page, because no
    // screen renders for 'login'. Only real views are accepted.
    const next = requested === 'coach' || KNOWN_VIEWS.has(requested) ? requested : 'home';
    setView(next);
    if (next === 'coach') setHash('#/coach/dashboard');
    // Leaving a hash screen (My Courses, Settings) for a view-state screen.
    else if (signedInRef.current && (parseRoute(window.location.hash) || hashScreenRef.current)) clearHash();
  }, [setHash, clearHash]);

  // "Goal setting": the full #/goals page for secondary learners; primary
  // learners (and anyone else) keep the original wizard.
  const openGoals = useCallback(() => {
    if (role === 'student' && !isPrimary) setHash(hrefFor.goals());
    else createGoalSettingModal(user?.uid || null);
  }, [role, isPrimary, setHash, user]);
  const openGoalsRef = useRef(openGoals);
  openGoalsRef.current = openGoals;

  // Legacy markup calls switchPhase() from ~30 inline onclick handlers. Rather
  // than rewrite that markup, the global becomes a thin shim onto React's
  // navigation. The original 100-line DOM-toggling switchPhase is gone.
  useEffect(() => {
    window.switchPhase = (next) => navigate(next);
    window.openGoalSettingWizard = () => openGoalsRef.current();
    return () => {
      delete window.switchPhase;
      delete window.openGoalSettingWizard;
    };
  }, [navigate, user]);

  // Show or hide the legacy activity containers to match the current view.
  useEffect(() => {
    // Hash screens (My Courses, Settings) replace the activity area entirely.
    if (status !== 'ready' || role !== 'student' || isPrimary || hashScreen) {
      hideAllActivities();
      return;
    }
    if (isLegacyActivity(view)) showActivity(view);
    else {
      // A React activity has no legacy container, so every one of them must be
      // hidden or Activity 5 would render underneath Activity 1's markup.
      hideAllActivities();
      if (isReactActivity(view)) trackActivityOpen(view);
    }
  }, [view, status, role, isPrimary, hashScreen]);

  // A coach landing on a deep link, or a student who tried one.
  useEffect(() => {
    if (status !== 'ready') return;
    if (hash.includes('/coach') && (role === 'teacher' || role === 'coach')) setView('coach');
  }, [hash, status, role]);

  // Student-only subsystems. These are imperative singletons from the vanilla
  // app; they are initialised once per signed-in student and are unaffected by
  // React re-renders.
  useEffect(() => {
    if (status !== 'ready' || role !== 'student' || !user || isPrimary) return;

    initializeSENGlobally({
      userId: user.uid,
      senEnabled: localStorage.getItem('senEnabled') === 'true',
      geminiEndpoint: `${API_BASE}/api`
    });

    try { renderSENToggle('sen-preference-toggle'); } catch { /* optional widget */ }
    // Goal setting no longer opens itself here: secondary learners get the
    // daily goals notification (DailyGoalsNotice) and the #/goals page instead.
  }, [status, role, user, isPrimary]);

  // Students land on My Courses, the plan's student home. Once per sign-in, and
  // only when no other screen was asked for, so "My Dashboard" and deep links still work.
  const landedRef = useRef(null);
  useEffect(() => {
    if (status === 'signed-out') { landedRef.current = null; return; }
    if (status !== 'ready' || role !== 'student' || isPrimary || !user) return;
    if (landedRef.current === user.uid) return;
    landedRef.current = user.uid;
    if (!parseRoute(window.location.hash) && view === 'home') setHash(hrefFor.courses());
  }, [status, role, isPrimary, user, view, setHash]);

  // "My Dashboard" keeps its goals panel (secondary learners only, as before).
  useEffect(() => {
    if (status !== 'ready' || role !== 'student' || isPrimary || !user || hashScreen || view !== 'home') return undefined;
    const t = setTimeout(() => { showGoalsPanel(user.uid).catch(() => {}); }, 0);
    return () => clearTimeout(t);
  }, [status, role, isPrimary, user, hashScreen, view]);

  // Coaches must never land on a student activity view.
  useEffect(() => {
    if (status === 'ready' && (role === 'teacher' || role === 'coach')) setView('coach');
    if (status === 'ready' && role === 'student' && view === 'coach') setView('home');
  }, [status, role, view]);

  // The new Growth Hub screens are light; the legacy activity pages are still
  // dark. The body colour follows, so overscroll and short pages match.
  const lightSurface = status !== 'ready' || CONSOLE_ROLES.includes(role) || role === 'parent'
    || ['settings', 'courses', 'resources', 'worksheet', 'guide', 'pbl', 'goals', 'messages', 'homeSearch', 'futureSkills'].includes(route?.screen);
  useEffect(() => {
    document.body.dataset.surface = lightSurface ? 'light' : 'dark';
  }, [lightSurface]);

  const headerProps = {
    email: user?.email,
    displayName: profile?.displayName,
    role,
    uid: user?.uid,
    onSignOut: signOut,
    onHome: () => {
      if (CONSOLE_ROLES.includes(role)) setHash(hrefFor.list('students'));
      else if (role === 'parent') setHash(hrefFor.parent());
      else navigate((role === 'teacher' || role === 'coach') ? 'coach' : 'home');
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="gh-app" style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div className="gh-skel" style={{ width: 180, height: 10 }} aria-label="Loading" />
        </div>
      </>
    );
  }

  if (status === 'signed-out') {
    return <LoginPage initialError={error} />;
  }

  // Printable primary material: open to every signed-in role (it is teaching
  // material, not data). Checked before the role branches so a primary learner
  // and a coach reach the same worksheet.
  if (route && ['resources', 'worksheet', 'guide'].includes(route.screen)) {
    return (
      <>
        <Header {...headerProps} />
        <div className="gh-app">
          {route.screen === 'worksheet' ? <Worksheet activityId={route.activityId} />
            : route.screen === 'guide' ? <TeacherGuide activityId={route.activityId} />
            : <PrimaryResources />}
        </div>
      </>
    );
  }

  // Community Feed: accessible to all signed-in users (students, coaches, admins)
  if (route?.screen === 'community') {
    return (
      <>
        <Header {...headerProps} />
        {!isPrimary && (
          <TopNav
            isPrimary={isPrimary}
            role={role}
            view="community"
            onNavigate={navigate}
            onOpenCourses={() => setHash(hrefFor.courses())}
            onOpenGoals={openGoals}
          />
        )}
        <div className="gh-app">
          <CommunityFeed />
        </div>
      </>
    );
  }

  // Private Messages (F3): accessible to all signed-in roles
  // Admins & Supervisors get the Admin Audit View; Coaches & Students get Conversations
  if (route?.screen === 'messages') {
    return (
      <>
        <Header {...headerProps} />
        {!isPrimary && (
          <TopNav
            isPrimary={isPrimary}
            role={role}
            view="messages"
            onNavigate={navigate}
            onOpenCourses={() => setHash(hrefFor.courses())}
            onOpenGoals={openGoals}
          />
        )}
        {CONSOLE_ROLES.includes(role) ? (
          <div className="gh-app">
            <AdminAuditView />
          </div>
        ) : (
          <MessagesScreen conversationId={route.conversationId} role={role} isPrimary={isPrimary} uid={user?.uid}
                          displayName={profile?.displayName || user?.email?.split('@')[0] || ''}
                          onOpen={(convId) => setHash(hrefFor.messages(convId))} onBack={() => setHash(hrefFor.messages())} />
        )}
      </>
    );
  }

  // Admin console: admin and supervisor claims only (resolveRole never takes
  // these from the profile document). Settings renders inside the console.
  if (CONSOLE_ROLES.includes(role)) {
    const consoleRoute = route?.screen === 'admin' || route?.screen === 'settings'
      ? route : { screen: 'admin', page: 'list', kind: 'students' };
    return (
      <>
        <Header {...headerProps} />
        <div className="gh-app">
          <AdminConsole route={consoleRoute} role={role} user={user} profile={profile} navigate={setHash} />
        </div>
      </>
    );
  }

  if (role === 'parent') {
    return (
      <>
        <Header {...headerProps} />
        <div className="gh-app">
          {route?.screen === 'settings'
            ? <SettingsPage user={user} profile={profile} role={role} />
            : <ParentPortal />}
        </div>
      </>
    );
  }

  if (route?.screen === 'settings') {
    return (
      <>
        <Header {...headerProps} />
        {!isPrimary && (
          <TopNav isPrimary={isPrimary} role={role} view="settings" onNavigate={navigate}
                  onOpenCourses={() => setHash(hrefFor.courses())}
                  onOpenGoals={openGoals} />
        )}
        <div className="gh-app">
          <SettingsPage user={user} profile={profile} role={role} />
        </div>
      </>
    );
  }

  if (isPrimary) {
    return (
      <>
        <Header {...headerProps} />
        <JuniorExplorers uid={user.uid} displayName={profile?.displayName} />
      </>
    );
  }

  return (
    <>
      <Header {...headerProps} />
      <TopNav
        isPrimary={isPrimary}
        role={role}
        view={['courses', 'pbl', 'community', 'messages', 'goals', 'homeSearch', 'futureSkills'].includes(route?.screen) ? route.screen : view}
        onNavigate={navigate}
        onOpenCourses={() => setHash(hrefFor.courses())}
        onOpenGoals={openGoals}
      />

      {role === 'student' && !isPrimary && user && route?.screen !== 'goals' && <DailyGoalsNotice uid={user.uid} />}

      {route?.screen === 'futureSkills' && role === 'student' ? (
        <FutureSkillsPage isPrimary={isPrimary} />
      ) : route?.screen === 'pbl' && (role === 'student' || role === 'teacher' || role === 'coach') ? (
        <div className="gh-app">
          <PblStudio uid={user?.uid} role={role} tab={route.tab} programId={route.programId} section={route.section}
                     classIds={role === 'student' ? (profile?.classIds || []) : (classIds || profile?.classIds || [])}
                     onOpenActivity={navigate} />
        </div>
      ) : role === 'student' && !isPrimary && route?.screen === 'homeSearch' ? (
        <HomeSearch uid={user?.uid} displayName={profile?.displayName} onOpenActivity={navigate} />
      ) : role === 'student' && !isPrimary && route?.screen === 'goals' ? (
        <div className="gh-app">
          <GoalsPage uid={user?.uid} displayName={profile?.displayName} />
        </div>
      ) : role === 'student' && route?.screen === 'courses' ? (
        <div className="gh-app">
          <MyCourses isPrimary={isPrimary} onOpenActivity={navigate} displayName={profile?.displayName}
                     uid={user?.uid} classIds={profile?.classIds || []} onJoined={refreshProfile} />
        </div>
      ) : (role === 'teacher' || role === 'coach') && !route?.screen ? (
        <CoachDashboardHost
          coachUser={{
            uid: user.uid,
            email: user.email,
            displayName: profile?.displayName || user.email?.split('@')[0] || 'Coach',
            classIds: classIds || profile?.classIds || [],
            role: profile?.role || role
          }}
        />
      ) : (
        <>
          {view === 'home' && (
            <StudentDashboard profile={profile} uid={user?.uid} onProfileChanged={refreshProfile} />
          )}
          {view === 'solar' && <SolarCarChallenge uid={user.uid} />}
          {view === 'so2' && <So2SulfateSimulation uid={user.uid} />}
          {view === 'plants' && <PlantMicroscopeLab uid={user.uid} />}
          {view === 'hexgrid' && <ProjectHexGrid uid={user.uid} />}
          {view === 'junior' && <JuniorExplorers uid={user.uid} displayName={profile?.displayName} />}
        </>
      )}
    </>
  );
}
