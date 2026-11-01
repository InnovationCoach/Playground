export async function loadDashboardCourses() {
  window.__sparkCourseReads = (window.__sparkCourseReads || 0) + 1;
  const mode = new URLSearchParams(location.search).get('state');
  if (mode === 'loading') await new Promise(() => {});
  if (mode === 'error') throw new Error('Synthetic offline test');
  if (mode === 'empty') return { courses: [], warnings: [] };
  return { warnings: [], courses: [{
    program: { id: 'ecocool-smart-garden-2026', title: 'EcoCool: grow a cooler city', drivingQuestion: 'How might we help a school garden thrive with less water?', phases: [{ id: 'explore', title: 'Explore', sessions: [1,2,3,4].map(sessionNumber => ({ sessionNumber })) }, { id: 'define', title: 'Define', sessions: [5,6,7,8].map(sessionNumber => ({ sessionNumber })) }, { id: 'make', title: 'Make & test', sessions: Array.from({length:16}, (_,index) => ({sessionNumber:index+9})) }] },
    summary: { pct: 25, done: 6, total: 24, next: { title: 'Meet your garden’s hidden water needs', sessionNumber: 7, phaseId: 'define', activities: ['Compare the moisture needs of two garden plants'], evidenceToCollect: { prompt: 'A labelled sketch showing where your moisture sensor will go' } }, byPhase: { explore: {done:4,total:4,complete:true}, define: {done:2,total:4,complete:false}, make: {done:0,total:16,complete:false} } }, progressUnavailable: mode === 'stale'
  }] };
}
