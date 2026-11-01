import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import { MyDashboard } from '../../src/features/dashboard/MyDashboard.jsx';
import { AccountList } from '../../src/features/admin/accounts/AccountList.jsx';
import { Sidebar } from '../../src/features/shell/Sidebar.jsx';
function Preview() {
  const [kind, setKind] = useState('students');
  const isAdmin = location.search.includes('admin=1');
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  return <LocaleProvider><div data-theme={dark ? 'dark' : 'light'}><div className="preview-bar">OFFLINE PREVIEW · All people, courses and progress are synthetic<button onClick={() => setDark(!dark)}>Toggle theme</button><button onClick={() => setOpen(!open)}>Menu</button></div><Sidebar role="student" active="dashboard" collapsed open={open} onClose={() => setOpen(false)} onToggleCollapsed={() => {}} onOpenCourses={() => { location.hash = '#/courses'; }} onOpenGoals={() => { location.hash = '#/goals'; }} onNavigate={(id) => { location.hash = `#/activity/${id}`; }} /><div className="preview-shell">{isAdmin ? <div className="gh-app"><nav>{["students", "staff", "parents"].map(k => <button key={k} onClick={() => setKind(k)}>{k}</button>)}</nav><AccountList kind={kind} perms={{ editAccounts: false }} onOpen={() => {}} /></div> : <MyDashboard uid={new URLSearchParams(location.search).get("learner") || "preview-student"} profile={{ displayName: 'Alex Rivera' }} classIds={['fixture-class']} onOpenActivity={(id) => { location.hash = `#/activity/${id}`; }} />}</div></div></LocaleProvider>;
}
createRoot(document.getElementById('root')).render(<Preview />);
