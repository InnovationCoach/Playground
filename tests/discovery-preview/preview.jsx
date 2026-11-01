import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/i18n/LocaleProvider.jsx';
import { HomeSearch } from '../../src/features/home/HomeSearch.jsx';
import '../../src/features/admin/admin.css';

// SAMPLE ONLY: shows how the page looks once the confirmed-competency service
// (HANDOFF-SEARCH-DISCOVERY-BACKEND.md) exists. Never used by the real app.
const SAMPLE_COMPETENCIES = { status: 'ready', sample: true, confirmed: [
  { competencyId: 'sdl-01', decidedAt: '2026-10-20' },
  { competencyId: 'ctps-01', decidedAt: '2026-10-24' }
] };

function Preview() {
  const [connected, setConnected] = useState(new URLSearchParams(location.search).get('competencies') === 'sample');
  return <LocaleProvider>
    <div className="preview-bar">OFFLINE PREVIEW · fictional learner and records · no Firebase or AI calls
      <label><input type="checkbox" checked={connected} onChange={(e) => setConnected(e.target.checked)} /> Show sample confirmed competencies (future service)</label></div>
    <HomeSearch uid="preview-student" displayName="Alex Rivera" onOpenActivity={() => {}} initialQuery={new URLSearchParams(location.search).get('q') || ''}
                classIds={['fixture-class']} competencyContext={connected ? SAMPLE_COMPETENCIES : undefined} />
  </LocaleProvider>;
}
createRoot(document.getElementById('root')).render(<Preview />);
