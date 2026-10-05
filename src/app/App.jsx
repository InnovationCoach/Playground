import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthProvider.jsx';
import { useHashRoute } from './useHashRoute.js';
import { parseRoute, hrefFor, isCoachWorkspaceRoute } from './routes.js';
import { CONSOLE_ROLES } from './roles.js';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { TopNav } from '../features/shell/TopNav.jsx';
import { Header } from '../features/shell/Header.jsx';
import { showActivity, hideAllActivities, isLegacyActivity, isReactActivity, trackActivityOpen, ACTIVITY_NAV } from '../features/activities/activityHost.js';
import { isPrimaryProfile } from '../auth.js';
import { API_BASE } from '../services/apiBase.js';

// Role- and screen-specific code loads on demand, so signing in downloads only
// the shell. Each screen becomes its own chunk (UX/UI plan, Sprint 1).
const named = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const AdminConsole = named(() => import('../features/admin/AdminConsole.jsx'), 'AdminConsole');
const SettingsPage = named(() => import('../features/settings/SettingsPage.jsx'), 'SettingsPage');
const MyCourses = named(() => import('../features/courses/MyCourses.jsx'), 'MyCourses');
const ParentPortal = named(() => import('../features/parent/ParentPortal.jsx'), 'ParentPortal');
const Worksheet = named(() => import('../features/primary/print/PrintSheets.jsx'), 'Worksheet');
const TeacherGuide = named(() => import('../features/primary/print/PrintSheets.jsx'), 'TeacherGuide');
const PrimaryResources = named(() => import('../features/primary/print/PrintSheets.jsx'), 'PrimaryResources');
const PortfolioEditor = named(() => import('../features/personalization/Personalization.jsx'), 'PortfolioEditor');
const PortfolioViewer = named(() => import('../features/personalization/Personalization.jsx'), 'PortfolioViewer');
const JourneyPortfolio = named(() => import('../features/journey/JourneyPortfolio.jsx'), 'JourneyPortfolio');
const StudentDashboard = named(() => import('../features/student/StudentDashboard.jsx'), 'StudentDashboard');
const CoachDashboardHost = named(() => import('../features/coach/CoachDashboardHost.jsx'), 'CoachDashboardHost');
const SchoolLearningPanel = named(() => import('../features/school/SchoolLearningPanel.jsx'), 'SchoolLearningPanel');
const SolarCarChallenge = named(() => import('../features/activities/solarCar/SolarCarChallenge.jsx'), 'SolarCarChallenge');
const So2SulfateSimulation = named(() => import('../features/activities/so2Sulfate/So2SulfateSimulation.jsx'), 'So2SulfateSimulation');
const PlantMicroscopeLab = named(() => import('../features/activities/plantLab/PlantMicroscopeLab.jsx'), 'PlantMicroscopeLab');
const ProjectHexGrid = named(() => import('../features/activities/hexGrid/ProjectHexGrid.jsx'), 'ProjectHexGrid');
const JuniorExplorers = named(() => import('../features/primary/JuniorExplorers.jsx'), 'JuniorExplorers');
const PblStudio = named(() => import('../features/pbl/PblStudio.jsx'), 'PblStudio');
const CommunityFeed = named(() => import('../features/community/CommunityFeed.jsx'), 'CommunityFeed');
const ConversationList = named(() => import('../features/messages/ConversationList.jsx'), 'ConversationList');
const ConversationView = named(() => import('../features/messages/ConversationView.jsx'), 'ConversationView');
const AdminAuditView = named(() => import('../features/messages/AdminAuditView.jsx'), 'AdminAuditView');
const StartConversationModal = named(() => import('../features/messages/StartConversationModal.jsx'), 'StartConversationModal');

// Legacy vanilla widgets are imperative; load them only when first needed.
const createGoalSettingModal = (uid) => import('../components/Goals/GoalSettingModal.js').then((m) => m.createGoalSettingModal(uid));

function ScreenLoading() {
  return (
    <div className="gh-app" style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
      <div className="gh-skel" style={{ width: 180, height: 10 }} role="status" aria-label="Loading" />
    </div>
  );
}

const KNOWN_VIEWS = new Set(ACTIVITY_NAV.map((a) => a.id));

export function App() {
  return (
    <Suspense fallback={<ScreenLoading />}>
      <AppScreens />
    </Suspense>
  );
}

function AppScreens() {
  const { status, user, profile, role, classIds, error, signOut, refreshProfile } = useAuth();
  const [hash, setHash, clearHash] = useHashRoute();
  const [view, setView] = useState('home');
  const [showStartConversation, setShowStartConversation] = useState(false);
  // Primary learners get Junior Explorers only: no secondary activities, no AI
  // chatbot and no goal-setting popup (see the 2026-09-25 primary plan).
  const isPrimary = role === 'student' && isPrimaryProfile(profile);

  const route = parseRoute(hash);
  const hashScreen = route?.screen || null;

  const coachUser = useMemo(() => ({
    uid: user?.uid,
    email: user?.email,
    displayName: profile?.displayName || user?.email?.split('@')[0] || 'Coach',
    classIds: classIds || profile?.classIds || [],
    role: profile?.role || role
  }), [user?.uid, user?.email, profile?.displayName, profile?.role, profile?.classIds, classIds, role]);

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

  // Legacy markup calls switchPhase() from ~30 inline onclick handlers. Rather
  // than rewrite that markup, the global becomes a thin shim onto React's
  // navigation. The original 100-line DOM-toggling switchPhase is gone.
  useEffect(() => {
    window.switchPhase = (next) => navigate(next);
    window.openGoalSettingWizard = () => createGoalSettingModal(user?.uid || null);
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

    import('../integrations/senIntegration.js').then(({ initializeSENGlobally }) => initializeSENGlobally({
      userId: user.uid,
      senEnabled: localStorage.getItem('senEnabled') === 'true',
      geminiEndpoint: `${API_BASE}/api`
    })).catch(() => { /* optional widget */ });
    import('../components/SEN/SENPreferenceToggle.js').then(({ renderSENToggle }) => renderSENToggle('sen-preference-toggle')).catch(() => { /* optional widget */ });
    import('../integrations/goalSettingIntegration.js').then(({ initializeGoalSettingForUser }) => initializeGoalSettingForUser(user.uid)).catch(() => { /* optional widget */ });
  }, [status, role, user, isPrimary]);

  // Students land on My Courses, the plan's student home. Once per sign-in, and
  // only when no other screen was asked for, so "Home" and deep links still work.
  const landedRef = useRef(null);
  useEffect(() => {
    if (status === 'signed-out') { landedRef.current = null; return; }
    if (status !== 'ready' || role !== 'student' || isPrimary || !user) return;
    if (landedRef.current === user.uid) return;
    landedRef.current = user.uid;
    if (!parseRoute(window.location.hash) && view === 'home') setHash(hrefFor.courses());
  }, [status, role, isPrimary, user, view, setHash]);

  // Coaches must never land on a student activity view.
  useEffect(() => {
    if (status === 'ready' && (role === 'teacher' || role === 'coach')) setView('coach');
    if (status === 'ready' && role === 'student' && view === 'coach') setView('home');
  }, [status, role, view]);

  // The new Growth Hub screens are light; the legacy activity pages are still
  // dark. The body colour follows, so overscroll and short pages match.
  const lightSurface = status !== 'ready' || CONSOLE_ROLES.includes(role) || role === 'parent'
    || ['settings', 'courses', 'resources', 'worksheet', 'guide', 'pbl'].includes(route?.screen);
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

  if (route?.screen === 'home' && role === 'student') {
    return <><Header {...headerProps}/><TopNav role={role} view="home" onNavigate={navigate} onOpenCourses={()=>setHash(hrefFor.courses())} onOpenGoals={()=>createGoalSettingModal(user.uid)}/><StudentDashboard profile={profile} uid={user.uid} onProfileChanged={refreshProfile}/></>;
  }

  if (route?.screen === 'programs' && role === 'student' && !isPrimary) {
    return <><Header {...headerProps}/><TopNav role={role} view="programs" onNavigate={navigate} onOpenCourses={()=>setHash(hrefFor.courses())} onOpenGoals={()=>createGoalSettingModal(user.uid)}/><div className="gh-app"><SchoolLearningPanel initialArea="programs" hideTabs/></div></>;
  }

  if (route?.screen === 'journey' && role === 'student' && !isPrimary) {
    return <><Header {...headerProps}/><TopNav role={role} view="journey" onNavigate={navigate} onOpenCourses={()=>setHash(hrefFor.courses())} onOpenGoals={()=>createGoalSettingModal(user.uid)}/><div className="gh-app"><JourneyPortfolio uid={user.uid} profile={profile} printView={route.print}/></div></>;
  }

  if (route?.screen === 'portfolio') {
    const owner = !route.uid || route.uid === user?.uid;
    return <><Header {...headerProps}/>{!isPrimary && <TopNav role={role} view="portfolio" onNavigate={navigate} onOpenCourses={()=>setHash(hrefFor.courses())} onOpenGoals={()=>createGoalSettingModal(user.uid)}/>}<div className="gh-app">{owner && role === 'student'
      ? <PortfolioEditor uid={user.uid}/>
      : route.uid ? <PortfolioViewer uid={route.uid} role={role}/>
      : <p>Select a learner portfolio link to view shared work.</p>}</div></>;
  }

  // Community Feed: accessible to all signed-in users (students, coaches, admins)
  if (route?.screen === 'community') {
    return (
      <>
        <Header {...headerProps} />
        {!isPrimary && (
          <TopNav
            role={role}
            view="community"
            onNavigate={navigate}
            onOpenCourses={() => setHash(hrefFor.courses())}
            onOpenGoals={() => createGoalSettingModal(user?.uid || null)}
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
            role={role}
            view="messages"
            onNavigate={navigate}
            onOpenCourses={() => setHash(hrefFor.courses())}
            onOpenGoals={() => createGoalSettingModal(user?.uid || null)}
          />
        )}
        {CONSOLE_ROLES.includes(role) ? (
          <div className="gh-app">
            <AdminAuditView />
          </div>
        ) : (
          <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
            {route.conversationId ? (
              <ConversationView conversationId={route.conversationId} onBack={() => setHash(hrefFor.messages())} />
            ) : (
              <>
                <div style={{ width: 300, borderRight: '1px solid var(--gh-border)' }}>
                  <ConversationList
                    onSelectConversation={(convId, userName) => setHash(hrefFor.messages(convId))}
                    onStartNew={() => setShowStartConversation(true)}
                    userRole={role}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gh-text-3)' }}>
                  Select a conversation to start
                </div>
              </>
            )}
            {(role === 'teacher' || role === 'coach' || role === 'admin') && (
              <StartConversationModal
                isOpen={showStartConversation}
                onClose={() => setShowStartConversation(false)}
                coachId={user?.uid}
                coachName={profile?.displayName || user?.email?.split('@')[0] || ''}
              />
            )}
          </div>
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
          <TopNav role={role} view="settings" onNavigate={navigate}
                  onOpenCourses={() => setHash(hrefFor.courses())}
                  onOpenGoals={() => createGoalSettingModal(user?.uid || null)} />
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
        <SchoolLearningPanel initialArea="calendar" hideTabs />
      </>
    );
  }

  return (
    <>
      <Header {...headerProps} />
      <TopNav
        role={role}
        view={route?.screen === 'courses' || route?.screen === 'pbl' || route?.screen === 'community' || route?.screen === 'messages' ? route.screen : view}
        onNavigate={navigate}
        onOpenCourses={() => setHash(hrefFor.courses())}
        onOpenGoals={() => createGoalSettingModal(user?.uid || null)}
      />

      {route?.screen === 'pbl' && (role === 'student' || role === 'teacher' || role === 'coach') ? (
        <div className="gh-app">
          <PblStudio uid={user?.uid} role={role} tab={route.tab} onOpenActivity={navigate} />
        </div>
      ) : role === 'student' && route?.screen === 'courses' ? (
        <div className="gh-app">
          <MyCourses isPrimary={isPrimary} onOpenActivity={navigate} displayName={profile?.displayName}
                     uid={user?.uid} classIds={profile?.classIds || []} onJoined={refreshProfile} />
        </div>
      ) : isCoachWorkspaceRoute(role, route) ? (
        <CoachDashboardHost coachUser={coachUser} />
      ) : (
        <>
          {role === 'student' && (route?.screen === 'home' || view === 'home') && (
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
