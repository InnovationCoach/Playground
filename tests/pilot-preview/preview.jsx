import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PilotHome, AttendancePanel, LeavePanel, InventoryPanel } from '../../src/features/admin/pilot/PilotOperations.jsx';
import '../../src/features/admin/admin.css';

function Preview() {
  const [page, setPage] = useState('home');
  return (
    <div className="gh-app">
      <div className="gh-banner" role="note" style={{ margin: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
        Visual preview fixture · Sample data only (writes disabled)
      </div>
      <header className="gh-subnav" style={{ position: 'static' }}>
        {[
          ['home', 'Overview'],
          ['staff', 'Staff attendance'],
          ['students', 'Student attendance'],
          ['leave', 'Day-off review (Admin)'],
          ['coach', 'Day-off request (Coach)'],
          ['inventory', 'Inventory']
        ].map(([p, label]) => (
          <button
            key={p}
            className={`gh-subnav-link ${page === p ? 'gh-btn-accent' : ''}`}
            style={page === p ? { background: 'var(--gh-purple)', color: '#fff', fontWeight: 600 } : {}}
            onClick={() => setPage(p)}
          >
            {label}
          </button>
        ))}
      </header>
      <main className="gh-main" style={{ margin: '0 auto', maxWidth: 1200, padding: '2rem 1.5rem 3rem' }}>
        {page === 'home' ? <PilotHome /> :
         page === 'leave' ? <LeavePanel admin canEdit /> :
         page === 'coach' ? <LeavePanel /> :
         page === 'inventory' ? <InventoryPanel canEdit /> :
         <AttendancePanel key={page} kind={page} canEdit />}
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<Preview />);
