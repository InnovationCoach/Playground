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
import { MyDashboard } from '../features/dashboard/MyDashboard.jsx';
import { SparkHome } from '../features/spark/SparkHome.jsx';
import { DailyGoalsNotice } from '../features/goals/DailyGoalsNotice.jsx';
import { ParentPortal } from '../features/parent/ParentPortal.jsx';
import { Worksheet, TeacherGuide, PrimaryResources } from '../features/primary/print/PrintSheets.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { Sidebar, readCollapsed, writeCollapsed } from '../features/shell/Sidebar.jsx';
import { Header } from '../features/shell/Header.jsx';
import { StudentDashboard } from '../features/student/StudentDashboard.jsx';
import { CoachDashboardHost } from '../features/coach/CoachDashboardHost.jsx';
import { CoachPblStudio } from '../features/coach/studio/CoachPblStudio.jsx';
import { EdmentumIntegrationConsole } from '../features/edmentum/EdmentumIntegrationConsole.jsx';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  // Primary learners get Junior Explorers only: no secondary activities, no AI
  // chatbot and no goal-setting popup (see the 2026-09-25 primary plan).
  const isPrimary = role === 'student' && isPrimaryProfile(profile);

  const route = parseRoute(hash);
  useEffect(() => { setMenuOpen(false); }, [hash, view]);
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

  // Everyone except primary learners lands on SPARK Home (#/spark), once per
  // sign-in, unless the address they opened asked for a screen. The address is
  // read as it was when the page loaded or the user signed out: the legacy
  // router rewrites a coach's empty hash to #/coach/dashboard before this runs.
  const landedRef = useRef(null);
  const openedHashRef = useRef(window.location.hash);
  useEffect(() => {
    if (status === 'signed-out') { landedRef.current = null; openedHashRef.current = window.location.hash; return; }
    if (status !== 'ready' || !role || isPrimary || !user) return;
    if (landedRef.current === user.uid) return;
    landedRef.current = user.uid;
    if (!parseRoute(openedHashRef.current)) setHash(hrefFor.spark());
  }, [status, role, isPrimary, user, setHash]);

  // A secondary learner with no screen in the address (the logo, or the legacy
  // switchPhase('home')) goes back to SPARK Home. Activities keep their view.
  useEffect(() => {
    if (status !== 'ready' || role !== 'student' || isPrimary || hashScreen || view !== 'home') return;
    if (landedRef.current !== user?.uid) return; // let the sign-in landing run first
    if (parseRoute(window.location.hash)) return;
    setHash(hrefFor.spark());
  }, [status, role, isPrimary, hashScreen, view, user, setHash]);

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
    || ['settings', 'courses', 'resources', 'worksheet', 'guide', 'pbl', 'goals', 'messages', 'homeSearch', 'futureSkills', 'dashboard', 'spark'].includes(route?.screen);
  useEffect(() => {
    document.body.dataset.surface = lightSurface ? 'light' : 'dark';
  }, [lightSurface]);

  const headerProps = {
    email: user?.email,
    displayName: profile?.displayName,
    role,
    uid: user?.uid,
    onSignOut: signOut,
    // The logo is the persistent Home: SPARK Home for everyone but primary learners.
    onHome: () => {
      if (isPrimary) navigate('home');
      else setHash(hrefFor.spark());
    }
  };

  // Which menu item is the current screen (Sidebar.jsx keys).
  const activeKey = (() => {
    const s = route?.screen;
    if (s === 'admin') return ['list', 'detail', 'create'].includes(route.page) ? `admin:${route.kind || 'students'}` : `admin:${route.page}`;
    if (s === 'worksheet' || s === 'guide') return 'resources';
    if (s) return s;
    if (role === 'teacher' || role === 'coach') return 'coach';
    return view === 'home' ? null : view;
  })();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const sidebar = status === 'ready' && role && !isPrimary ? (
    <Sidebar role={role} active={activeKey} onNavigate={navigate} onOpenCourses={() => setHash(hrefFor.courses())}
             onOpenGoals={openGoals} open={menuOpen} onClose={closeMenu} collapsed={collapsed}
             onToggleCollapsed={() => setCollapsed((c) => { writeCollapsed(!c); return !c; })} />
  ) : null;
  if (sidebar) {
    headerProps.onMenu = () => setMenuOpen((o) => !o);
    headerProps.menuOpen = menuOpen;
  }

  const isCoachRole = role === 'teacher' || role === 'coach';
  const spark = isCoachRole ? (
    <CoachPblStudio
      coachUser={{
        uid: user?.uid,
        email: user?.email,
        displayName: profile?.displayName || user?.email?.split('@')[0] || 'Coach',
        classIds: classIds || profile?.classIds || [],
        role
      }}
      navigate={setHash}
    />
  ) : (
    <div className="gh-app">
      <SparkHome role={role} uid={user?.uid} displayName={profile?.displayName || user?.email?.split('@')[0] || ''}
                 navigate={setHash} onOpenActivity={navigate} />
    </div>
  );

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
        {sidebar}
        <div className="gh-app">
          {route.screen === 'worksheet' ? <Worksheet activityId={route.activityId} />
            : route.screen === 'guide' ? <TeacherGuide activityId={route.activityId} />
            : <PrimaryResources />}
        </div>
      </>
    );
  }

  // Community Feed: students, coaches and staff. Not parents: there is no parent
  // design for it, so a typed address shows their SPARK Home instead.
  if (route?.screen === 'community' && role !== 'parent') {
    return (
      <>
        <Header {...headerProps} />
        {sidebar}
        <div className="gh-app">
          <CommunityFeed />
        </div>
      </>
    );
  }

  // Private Messages (F3): students, coaches and staff (admins and supervisors
  // get the audit view). Not parents, as for Community. No menu links here
  // any more; the screen stays reachable by address.
  if (route?.screen === 'messages' && role !== 'parent') {
    return (
      <>
        <Header {...headerProps} />
        {sidebar}
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
    // SPARK Home, and PBL Studio in its read-only coach view (program library,
    // phases, rubrics, competencies), sit beside the console.
    const consoleNav = sidebar;
    if (route?.screen === 'pbl') {
      return (
        <>
          <Header {...headerProps} />
          {consoleNav}
          <div className="gh-app">
            <PblStudio uid={user?.uid} role={role} tab={route.tab} programId={route.programId} section={route.section}
                       classIds={[]} onOpenActivity={navigate} />
          </div>
        </>
      );
    }
    if (route?.screen !== 'admin' && route?.screen !== 'settings') {
      return <><Header {...headerProps} />{consoleNav}{spark}</>;
    }
    return (
      <>
        <Header {...headerProps} />
        {sidebar}
        <div className="gh-app">
          <AdminConsole route={route} role={role} user={user} profile={profile} navigate={setHash} embedded={Boolean(sidebar)} />
        </div>
      </>
    );
  }

  if (role === 'parent') {
    const parentView = route?.screen === 'settings' ? 'settings' : route?.screen === 'parent' ? 'parent' : 'spark';
    return (
      <>
        <Header {...headerProps} />
        {sidebar}
        {parentView === 'spark' ? spark : (
          <div className="gh-app">
            {parentView === 'settings'
              ? <SettingsPage user={user} profile={profile} role={role} />
              : <ParentPortal childUid={route.childUid} section={route.section} navigate={setHash} />}
          </div>
        )}
      </>
    );
  }

  if (route?.screen === 'settings') {
    return (
      <>
        <Header {...headerProps} />
        {sidebar}
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
      {sidebar}

      {/* Not on Goal setting or My Dashboard: both show today's checklist, and two copies of the plan on one screen would overwrite each other. */}
      {role === 'student' && !isPrimary && user && !['goals', 'dashboard', 'spark'].includes(route?.screen) && <DailyGoalsNotice uid={user.uid} />}

      {route?.screen === 'spark' ? spark
      : route?.screen === 'dashboard' && role === 'student' && !isPrimary ? (
        <MyDashboard uid={user?.uid} profile={profile} classIds={profile?.classIds || []} onJoined={refreshProfile}
                     onOpenActivity={navigate} />
      ) : route?.screen === 'futureSkills' && role === 'student' ? (
        <FutureSkillsPage isPrimary={isPrimary} />
      ) : route?.screen === 'pbl' && (role === 'student' || role === 'teacher' || role === 'coach') ? (
        <div className="gh-app">
          <PblStudio uid={user?.uid} role={role} tab={route.tab} programId={route.programId} section={route.section}
                     classIds={role === 'student' ? (profile?.classIds || []) : (classIds || profile?.classIds || [])}
                     onOpenActivity={navigate} displayName={profile?.displayName} />
        </div>
      ) : role === 'student' && !isPrimary && route?.screen === 'homeSearch' ? (
        <HomeSearch uid={user?.uid} displayName={profile?.displayName} onOpenActivity={navigate} initialQuery={route.q} />
      ) : role === 'student' && !isPrimary && route?.screen === 'goals' ? (
        <div className="gh-app">
          <GoalsPage uid={user?.uid} displayName={profile?.displayName} />
        </div>
      ) : role === 'student' && route?.screen === 'courses' ? (
        <div className="gh-app">
          <MyCourses isPrimary={isPrimary} onOpenActivity={navigate} displayName={profile?.displayName}
                     uid={user?.uid} classIds={profile?.classIds || []} onJoined={refreshProfile} />
        </div>
      ) : route?.screen === 'edmentum' ? (
        <div className="gh-app">
          <EdmentumIntegrationConsole
            coachUser={{
              uid: user?.uid,
              email: user?.email,
              displayName: profile?.displayName || user?.email?.split('@')[0] || 'Coach',
              role
            }}
          />
        </div>
      ) : (role === 'teacher' || role === 'coach') && (route?.screen === 'coach' || !route?.screen) ? (
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
