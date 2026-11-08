import { useMemo } from 'react';
import { CourseDiscovery } from './CourseDiscovery.jsx';
import { discoveryCatalog, pathwayDiscovery } from './discoveryModel.js';
import { confirmedIds } from '../quest/pathwayModel.js';
import { competencyById } from '../pbl/content/competencies.js';
import { useSchoolResource, schoolPath, mutateSchool } from '../school/useSchoolWorkspace.js';
import { hrefFor } from '../../app/routes.js';

export function LiveCourseDiscovery({ uid, classIds, name, onOpenActivity }) {
  return <LiveDiscoveryData key={uid || 'signed-out'} uid={uid} classIds={classIds} name={name} onOpenActivity={onOpenActivity} />;
}

function LiveDiscoveryData({ uid, classIds, name, onOpenActivity }) {
  const context = useSchoolResource(uid ? '/api/learning-context' : null);
  const activeClass = context.data?.classes?.find(c => classIds.includes(c.id));
  const schoolId = activeClass?.schoolId;
  const offerings = useSchoolResource(schoolId ? schoolPath(schoolId, 'program-offerings') : null);
  const base = schoolId && activeClass && uid ? schoolPath(schoolId, `learners/${encodeURIComponent(uid)}/pathway`) : null;
  const suffix = `?classId=${encodeURIComponent(activeClass?.id || '')}`;
  const pathway = useSchoolResource(base ? base + suffix : null);
  const items = useMemo(() => discoveryCatalog(offerings.data?.items || []), [offerings.data]);
  const recommendations = useMemo(() => pathwayDiscovery(pathway.data?.recommendations || [], offerings.data?.items || []), [pathway.data, offerings.data]);
  const achievements = useMemo(() => [...confirmedIds(pathway.data?.achievements || [])].map(id => ({ id, title: competencyById(id).title })), [pathway.data]);
  const denied = [context.error, offerings.error, pathway.error].some(e => [401, 403].includes(e?.status));
  return <CourseDiscovery key={`${uid}-${schoolId}-${activeClass?.id}-${denied ? 'revoked' : 'active'}`} name={name} items={denied ? discoveryCatalog() : items}
    recommendations={denied || pathway.error ? [] : recommendations} achievements={denied || pathway.error ? [] : achievements}
    loading={context.loading || pathway.loading} error={context.error || offerings.error} recommendationError={context.error || pathway.error}
    onRetry={() => { context.reload(); offerings.reload(); pathway.reload(); }} onOpenActivity={onOpenActivity}
    onOpenProgram={() => { window.location.hash = hrefFor.pbl('programs'); }}
    onChooseQuest={async item => {
      if (!base || denied) throw new Error('Your school access needs checking. Please refresh your access.');
      await mutateSchool('POST', `${base}/choose${suffix}`, { recommendationId: item.recommendationId, revision: pathway.data?.revision });
      pathway.reload();
    }} />;
}
