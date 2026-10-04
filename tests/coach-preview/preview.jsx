import React from 'react';
import { createRoot } from 'react-dom/client';
import { CoachWorkspace } from '../../src/features/coach/CoachWorkspace.jsx';

createRoot(document.getElementById('root')).render(<CoachWorkspace coachUser={{ uid: 'preview-coach' }} onManagement={() => alert('Existing management tools are available in the main app. This isolated preview only demonstrates progress tracking.')} />);
