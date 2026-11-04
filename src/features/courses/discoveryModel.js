import { PROGRAM_CATALOGUE } from '../pbl/content/programCatalogue.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { parseActivityLabel } from '../shell/activityIcons.jsx';

const artFor = id => /arachne|robot|coding/.test(id) ? 'robot' : /plant/.test(id) ? 'plant' : /microgrid|solar/.test(id) ? 'solar' : /so2/.test(id) ? 'science' : 'landscape';
export function discoveryCatalog(offerings = []) {
  const custom = offerings.filter(o => o.programDefinition).map(o => o.programDefinition);
  const programs = [...new Map([...PROGRAM_CATALOGUE, ...custom].map(p => [p.id, p])).values()];
  return [
    ...programs.map(p => ({ id: `program:${p.id}`, programId: p.id, title: p.title, description: p.drivingQuestion, kind: 'Program',
      source: 'welearn', provider: 'WeLearn', art: artFor(p.id), level: p.gradeBand, format: 'Project-based learning',
      availability: offerings.some(o => o.programId === p.id) ? 'Enrolled offering' : 'Ask your coach about enrollment',
      topics: p.id === 'project-arachne' ? ['Robotics', 'Engineering'] : ['Climate & energy', 'Engineering'],
      milestones: p.milestones.map(m => m.title), readiness: 'unknown' })),
    ...ACTIVITY_NAV.filter(a => !['home', 'junior'].includes(a.id)).map(a => ({ id: `activity:${a.id}`, activityId: a.id,
      ...parseActivityLabel(a.label), description: a.description, keywords: a.keywords, kind: 'Activity', source: 'welearn', provider: 'WeLearn',
      art: artFor(a.id), format: 'Hands-on exploration', availability: 'Explore activity', readiness: 'unknown',
      topics: a.id === 'coding' ? ['Robotics', 'Coding'] : a.id === 'plants' ? ['Living systems'] : ['Climate & energy', 'Engineering'] }))
  ];
}
const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');
export function filterDiscovery(items, { query = '', source = 'all', topic = 'All topics', kind = 'All formats' } = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (source !== 'all' && item.source !== source || topic !== 'All topics' && !item.topics?.includes(topic) || kind !== 'All formats' && item.kind !== kind) return false;
    const hay = normalize([item.title, item.description, item.provider, item.kind, item.keywords, ...(item.topics || [])].join(' '));
    return words.every(w => hay.includes(w));
  });
}

export function pathwayDiscovery(recommendations = [], offerings = []) {
  const catalog = discoveryCatalog(offerings);
  return recommendations.map(r => ({ ...r, id: `quest:${r.id}`, recommendationId: r.id, source: 'welearn', provider: 'WeLearn', kind: 'Quest',
    description: r.goal, reason: r.reason, art: 'solar', format: 'Guided quest', topics: catalog.find(p => p.programId === offerings.find(o => o.id === r.offeringId)?.programId)?.topics || [], readiness: r.basis === 'confirmed-prerequisites' ? 'confirmed' : 'explore',
    availability: 'Available in your program', duration: r.estimatedMinutes ? `${r.estimatedMinutes} min` : null,
    competencies: r.competencies || [], questSteps: r.steps, criteria: r.successCriteria }));
}
