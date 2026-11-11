import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import { MyDashboard } from '../../src/features/dashboard/MyDashboard.jsx';
import { AccountList } from '../../src/features/admin/accounts/AccountList.jsx';
import { Sidebar } from '../../src/features/shell/Sidebar.jsx';
import { GoalsPage } from '../../src/features/goals/GoalsPage.jsx';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider.jsx';
const uid = new URLSearchParams(location.search).get('learner') || 'preview-student';
const page = (load, render) => React.lazy(() => load().then((m) => ({ default: () => render(m) })));
const PAGES = {
  search: page(() => import('../../src/features/home/HomeSearch.jsx'), (m) => <m.HomeSearch uid={uid} displayName="Alex Rivera" onOpenActivity={() => {}} classIds={['fixture-class']} />),
  courses: page(() => import('../../src/features/courses/MyCourses.jsx'), (m) => <div className="gh-app"><m.MyCourses onOpenActivity={() => {}} displayName="Alex Rivera" uid={uid} classIds={['fixture-class']} /></div>),
  discover: page(() => import('../../src/features/courses/LiveCourseDiscovery.jsx'), (m) => <m.LiveCourseDiscovery uid={uid} classIds={['fixture-class']} name="Alex Rivera" onOpenActivity={() => {}} />),
  skills: page(() => import('../../src/features/futureSkills/FutureSkillsPage.jsx'), (m) => <m.FutureSkillsPage />),
  pbl: page(() => import('../../src/features/pbl/PblStudio.jsx'), (m) => <div className="gh-app"><m.PblStudio uid={uid} role="student" tab={new URLSearchParams(location.search).get('tab')} classIds={['fixture-class']} onOpenActivity={() => {}} displayName="Alex Rivera" /></div>),
  community: page(() => import('../../src/features/community/CommunityFeed.jsx'), (m) => <div className="gh-app"><m.CommunityFeed /></div>),
  messages: page(() => import('../../src/features/messages/MessagesScreen.jsx'), (m) => <div className="gh-app"><m.MessagesScreen uid={uid} role="student" displayName="Alex Rivera" onOpen={() => {}} onBack={() => {}} /></div>),
  settings: page(() => import('../../src/features/settings/SettingsPage.jsx'), (m) => <div className="gh-app"><m.SettingsPage user={{ uid, email: 'student@example.test' }} profile={{ displayName: 'Alex Rivera', role: 'student' }} role="student" /></div>),
  canva: page(() => import('../../src/features/canva/CanvaPage.jsx'), (m) => <div className="gh-app"><m.CanvaPage uid={uid} role="student" profile={{ displayName: 'Alex Rivera' }} /></div>),
  journey: page(() => import('../../src/features/journey/JourneyPortfolio.jsx'), (m) => <div className="gh-app"><m.JourneyPortfolio uid={uid} profile={{ displayName: 'Alex Rivera' }} /></div>),
  space: page(() => import('../../src/features/student/StudentDashboard.jsx'), (m) => <m.StudentDashboard profile={{ displayName: 'Alex Rivera' }} uid={uid} onProfileChanged={() => {}} />),
  spark: page(() => import('../../src/features/spark/SparkHome.jsx'), (m) => <m.SparkHome uid={uid} role="student" displayName="Alex Rivera" navigate={() => {}} onOpenActivity={() => {}} />)
};
const OtherPage = PAGES[new URLSearchParams(location.search).get('view')];
function Preview() {
  const [kind, setKind] = useState('students');
  const isAdmin = location.search.includes('admin=1');
  const isGoals = location.search.includes('view=goals');
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  return <LocaleProvider><div data-theme={dark ? 'dark' : 'light'}><div className="preview-bar">OFFLINE PREVIEW · All people, courses and progress are synthetic<button onClick={() => setDark(!dark)}>Toggle theme</button><button onClick={() => setOpen(!open)}>Menu</button></div><Sidebar role="student" active="dashboard" collapsed open={open} onClose={() => setOpen(false)} onToggleCollapsed={() => {}} onOpenCourses={() => { location.hash = '#/courses'; }} onOpenGoals={() => { location.hash = '#/goals'; }} onNavigate={(id) => { location.hash = `#/activity/${id}`; }} /><div className="preview-shell">{OtherPage ? <ThemeProvider userThemePreference={new URLSearchParams(location.search).get('theme') || 'light'}><React.Suspense fallback={<p>Loading…</p>}><OtherPage /></React.Suspense></ThemeProvider> : isGoals ? <div className="gh-app"><GoalsPage uid={new URLSearchParams(location.search).get("learner") || "preview-student"} displayName="Alex Rivera" /></div> : isAdmin ? <div className="gh-app"><nav>{["students", "staff", "parents"].map(k => <button key={k} onClick={() => setKind(k)}>{k}</button>)}</nav><AccountList kind={kind} perms={{ editAccounts: false }} onOpen={() => {}} /></div> : <MyDashboard uid={new URLSearchParams(location.search).get("learner") || "preview-student"} profile={{ displayName: 'Alex Rivera' }} classIds={['fixture-class']} onOpenActivity={(id) => { location.hash = `#/activity/${id}`; }} />}</div></div></LocaleProvider>;
}
createRoot(document.getElementById('root')).render(<Preview />);
