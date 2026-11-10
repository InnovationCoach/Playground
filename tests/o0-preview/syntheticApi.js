// SYNTHETIC stand-in for src/services/api/apiClient.js. The scenario comes from
// ?edmentum=<state>&launch=<ok|fail>; every value below is made up.
const params = new URLSearchParams(window.location.search);
const scenario = { edmentum: params.get('edmentum') || 'access_pending', launch: params.get('launch') || 'fail' };
export const isMockApi = true;
export async function schoolRequest(method, path) {
  await new Promise((r) => setTimeout(r, 50));
  if (path === '/api/learning-context') return { role: 'teacher', schools: [], classes: [], providerStatus: { edmentum: scenario.edmentum } };
  if (path === '/api/lti/config') return { registration: { issuer: 'http://127.0.0.1:3001', clientId: 'synthetic-client-id', deploymentId: 'synthetic-deployment', oidcAuthUrl: 'http://127.0.0.1:3001/api/lti/login_initiations', jwksUrl: 'http://127.0.0.1:3001/api/lti/jwks', accessTokenUrl: 'http://127.0.0.1:3001/api/lti/token', agsLineItemsUrl: 'http://127.0.0.1:3001/api/lti/ags/lineitems' } };
  if (path.startsWith('/api/lti/launch/')) {
    if (scenario.launch === 'ok') return { launchUrl: 'https://example.invalid/edmentum/sample-bio', id_token: 'synthetic.header.signature-0000000000000000000000000000000000', courseTitle: 'Sample course: Biology' };
    throw Object.assign(new Error('unreachable'), { code: 'UNAVAILABLE', status: 0 });
  }
  throw Object.assign(new Error('not found'), { code: 'NOT_FOUND', status: 404 });
}
export const apiRequest = schoolRequest;
