import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UniversePrototype } from '../../src/features/universe/UniversePrototype.jsx';
import '../../src/features/admin/admin.css';
import '../../src/features/dashboard/sparkBrand.css';

function Preview() {
  const [dark, setDark] = useState(false);
  return <div className="gh-app md-root sd-root universe-preview-shell" data-theme={dark ? 'dark' : 'light'}>
    <header className="universe-preview-top"><strong>WeLearn <b>SPARK</b><span style={{ marginLeft: 10, fontWeight: 400, fontSize: 11, color: 'var(--gh-text-2)' }}> / My Universe</span></strong><span>Your creative corner of SPARK</span><button onClick={() => setDark(!dark)}>{dark ? 'SPARK Daylight' : 'SPARK Night'}</button></header>
    <div className="universe-preview-content"><UniversePrototype uid="fictional-universe-preview"/></div>
  </div>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
