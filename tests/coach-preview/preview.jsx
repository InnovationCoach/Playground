import React, { useState } from 'react';
import { StudentInviteDialog } from '../../src/features/coach/StudentInviteDialog.jsx';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import { CoachWorkspace } from '../../src/features/coach/CoachWorkspace.jsx';

function Preview() {
  const [invite, setInvite] = useState(false);
  return <LocaleProvider>
    {invite && <StudentInviteDialog onClose={() => setInvite(false)} />}
    <CoachWorkspace coachUser={{ uid: 'preview-coach' }} onAddStudent={() => setInvite(true)} onManagement={() => alert('Management tools are tested separately. This preview uses sample data only.')} />
  </LocaleProvider>;
}
createRoot(document.getElementById('root')).render(<Preview />);
