import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LearnerPathway } from '../../src/features/quest/LearnerPathway.jsx';
import { reviewExample } from './fixtureApi.js';
import '../../src/features/admin/admin.css';
import '../../src/features/school/schoolWorkspace.css';

function Preview() {
  const [role, setRole] = useState('student'), [version, setVersion] = useState(0);
  return <main className="gh-app" style={{ maxWidth: 1160, margin: 'auto', padding: 'clamp(12px, 3vw, 32px)', fontFamily: 'system-ui, sans-serif' }}>
    <aside style={{ padding: 16, background: '#fff3d4', borderRadius: 12 }}><strong>Sample preview · no Firebase or AI connection</strong><p>These records are fictional and reset when you reload this page.</p><p><a href="./discovery.html">Try the new course-discovery design →</a></p>
      <div className="sw-actions"><button className="gh-btn gh-btn-ghost" onClick={() => setRole('student')}>Learner view</button><button className="gh-btn gh-btn-ghost" onClick={() => setRole('coach')}>Coach view</button>
        {role === 'coach' && <button className="gh-btn gh-btn-ghost" onClick={() => { reviewExample(); setVersion(v => v + 1); }}>Make sample reviewed evidence available</button>}</div>
    </aside>
    <LearnerPathway key={`${role}-${version}`} school={{ id: 'sample-school' }} learnerUid="sample-learner" classId="sample-class" role={role} />
  </main>;
}
createRoot(document.getElementById('root')).render(<Preview />);
