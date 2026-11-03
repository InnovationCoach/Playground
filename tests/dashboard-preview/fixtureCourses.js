export async function loadDashboardCourses() {
  window.__sparkCourseReads = (window.__sparkCourseReads || 0) + 1;
  const mode = new URLSearchParams(location.search).get('state');
  if (mode === 'loading') await new Promise(() => {});
  if (mode === 'error') throw new Error('Synthetic offline test');
  if (mode === 'empty') return { courses: [], warnings: [] };
  return { warnings: [], courses: [{
    program: { identity: { icon: 'Sprout', tone: 'green', short: 'EcoCool' }, id: 'ecocool-smart-garden-2026', title: 'EcoCool: grow a cooler city', drivingQuestion: 'How might we help a school garden thrive with less water?', phases: [{ id: 'explore', title: 'Explore', competencies: ['ctps-01', 'sdl-01'], sessions: [1,2,3,4].map(sessionNumber => ({ sessionNumber, evidenceToCollect: sessionNumber === 2 ? { prompt: 'A photo of the garden bed with your notes on where water collects', targetCompetencies: ['ctps-01'] } : undefined })) }, { id: 'define', title: 'Define', competencies: ['ctps-02', 'lc-01'], sessions: [5,6,7,8].map(sessionNumber => ({ sessionNumber })) }, { id: 'make', title: 'Make & test', sessions: Array.from({length:16}, (_,index) => ({sessionNumber:index+9})) }] },
    summary: { pct: 25, done: 6, total: 24, next: { title: 'Meet your garden’s hidden water needs', sessionNumber: 7, phaseId: 'define', activities: ['Compare the moisture needs of two garden plants'], evidenceToCollect: { prompt: 'A labelled sketch showing where your moisture sensor will go' } }, byPhase: { explore: {done:4,total:4,complete:true}, define: {done:2,total:4,complete:false}, make: {done:0,total:16,complete:false} } }, progressUnavailable: mode === 'stale'
  }] };
}
