/**
 * Read-only quest summary for coaches, admins and linked parents.
 * The API decides what each role receives: parents get badges only, staff
 * also get the level, streak and recent coach-verified activity.
 */
import { Award, Flame } from 'lucide-react';
import { useSchoolResource } from '../school/useSchoolWorkspace.js';

const VERIFIED_LABELS = { evidence_submitted: 'Evidence submitted', evidence_reviewed: 'Coach feedback received', goal_achieved: 'Goal achieved' };

export function QuestSummary({ school, learner, classId, role }) {
  const enabled = school?.features?.questMode === true && learner?.id;
  const query = `schoolId=${encodeURIComponent(school?.id || '')}${classId ? `&classId=${encodeURIComponent(classId)}` : ''}`;
  const summary = useSchoolResource(enabled ? `/api/quest/learners/${encodeURIComponent(learner.id)}?${query}` : null);
  if (!enabled || summary.loading || summary.error || !summary.data) return null;
  const { level, streak, badges = [], recentVerified = [] } = summary.data;
  return <section className="sw-card" aria-label={`${learner.name || 'Learner'} quest progress`}>
    <small>QUEST PROGRESS{role === 'parent' ? ' · BADGES' : ''}</small>
    {level && <p><strong>Level {level.level} · {level.title}</strong> ({level.xp.toLocaleString('en-US')} XP){streak?.count ? <> · <Flame size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {streak.count}-day streak</> : null}</p>}
    {badges.length ? <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: '8px 0' }}>
      {badges.map(b => <li key={b.id} title={b.competency} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--gh-purple-50, #f5eefa)', fontSize: 13, fontWeight: 600 }}><Award size={14} aria-hidden="true" />{b.name}</li>)}
    </ul> : <p className="sw-muted">No badges earned yet.</p>}
    {recentVerified.length > 0 && <p className="sw-muted">Recent verified activity: {recentVerified.slice(0, 3).map(e => `${VERIFIED_LABELS[e.type] || e.type} (${e.createdAt.slice(0, 10)})`).join(' · ')}</p>}
  </section>;
}
