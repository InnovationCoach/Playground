/**
 * React entry point.
 *
 * Until now the project shipped react, react-dom and react-firebase-hooks as
 * dependencies while nothing ever called createRoot - the ~3,500 lines of
 * .jsx/.tsx under src/components were never in the bundle. React now actually
 * mounts, and owns the application shell: auth, navigation and the dashboards.
 *
 * The five activities remain legacy containers in index.html by design; see
 * features/activities/activityHost.js for why.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './app/AuthProvider.jsx';
import { App } from './app/App.jsx';
import { LocaleProvider } from './app/i18n/LocaleProvider.jsx';

const container = document.getElementById('react-root');

if (!container) {
  console.error('[Boot] #react-root is missing from index.html; the app cannot mount.');
} else {
  createRoot(container).render(
    <StrictMode>
      <LocaleProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LocaleProvider>
    </StrictMode>
  );
}
