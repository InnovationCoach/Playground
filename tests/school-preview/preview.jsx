import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SchoolLearningPanel } from '../../src/features/school/SchoolLearningPanel.jsx';
import '../../src/features/admin/admin.css';
createRoot(document.getElementById('root')).render(<LocaleProvider><SchoolLearningPanel initialArea={new URLSearchParams(location.search).get('area') || 'programs'}/></LocaleProvider>);
