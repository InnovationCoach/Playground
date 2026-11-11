import React from 'react';
import { createRoot } from 'react-dom/client';
import PblStudioApp from '../ui/PblStudioApp';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found in prototypes/DonPBL/demo/index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <PblStudioApp />
  </React.StrictMode>
);
