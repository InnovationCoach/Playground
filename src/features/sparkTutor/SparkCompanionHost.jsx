import { useAuth } from '../../app/AuthProvider.jsx';
import { useHashRoute } from '../../app/useHashRoute.js';
import { parseRoute } from '../../app/routes.js';
import { isPrimaryProfile } from '../../auth.js';
import { SparkCompanion } from './SparkCompanion.jsx';
import { sparkTutorUiEnabled } from './sparkTutorModel.js';

/**
 * Puts "Ask Spark" on every screen of a signed-in secondary learner. Primary
 * learners get no AI chatbot (2026-09-25 primary plan), and staff, parents and
 * signed-out visitors never see it. Inside a PBL program the program becomes
 * the project Spark starts from.
 */
export function SparkCompanionHost() {
  const { status, role, profile } = useAuth();
  const [hash] = useHashRoute();
  if (!sparkTutorUiEnabled || status !== 'ready' || role !== 'student' || isPrimaryProfile(profile)) return null;
  const route = parseRoute(hash);
  const projectContext = route?.screen === 'pbl' && route.programId
    ? { projectId: route.programId, stage: route.section || null }
    : null;
  return <SparkCompanion learnerName={profile?.displayName?.split(' ')[0]} projectContext={projectContext} />;
}
