/**
 * One function per API route the frontend uses. Paths and bodies follow
 * docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md §7 exactly; the few additions the
 * frontend needs are listed in docs/FRONTEND-PHASE-0-NOTES.md and marked
 * "ADDITION" below.
 */
import { apiRequest } from './apiClient.js';

const enc = encodeURIComponent;

export const getMe = () => apiRequest('GET', '/api/me');

// Users. `role` may be a list (the staff screen asks for admin,supervisor,teacher)
// and is sent comma-separated. ADDITION: the contract shows a single role.
export const listUsers = (query) => apiRequest('GET', '/api/admin/users', { query });
export const getUser = (uid) => apiRequest('GET', `/api/admin/users/${enc(uid)}`);
export const createUser = (body) => apiRequest('POST', '/api/admin/users', { body });
export const updateUser = (uid, body) => apiRequest('PATCH', `/api/admin/users/${enc(uid)}`, { body });
export const setUserRole = (uid, role) => apiRequest('PUT', `/api/admin/users/${enc(uid)}/role`, { body: { role } });
export const setUserAssignments = (uid, body) => apiRequest('PUT', `/api/admin/users/${enc(uid)}/assignments`, { body });
export const suspendUser = (uid, reason) => apiRequest('POST', `/api/admin/users/${enc(uid)}/suspend`, { body: { reason } });
export const unsuspendUser = (uid) => apiRequest('POST', `/api/admin/users/${enc(uid)}/unsuspend`);
export const resendActivation = (uid) => apiRequest('POST', `/api/admin/users/${enc(uid)}/resend-activation`);
export const changeUserEmail = (uid, newEmail) => apiRequest('POST', `/api/admin/users/${enc(uid)}/change-email`, { body: { newEmail } });
export const getUserHistory = (uid, query) => apiRequest('GET', `/api/admin/users/${enc(uid)}/history`, { query });

// Reference data for forms.
export const listSchools = () => apiRequest('GET', '/api/admin/schools');
export const listClasses = (query) => apiRequest('GET', '/api/admin/classes', { query });
// ADDITION: cohorts and programmes are data (brief §5) but §7 has no read route.
export const listCohorts = () => apiRequest('GET', '/api/admin/cohorts');
export const listProgrammes = () => apiRequest('GET', '/api/admin/programmes');

// Parents.
export const issueParentInvite = (studentUid) => apiRequest('POST', `/api/students/${enc(studentUid)}/parent-invite`);
export const redeemParentCode = (code) => apiRequest('POST', '/api/parent/redeem', { body: { code } });
export const getParentChildren = () => apiRequest('GET', '/api/parent/children');
export const revokeParentLink = (linkId) => apiRequest('DELETE', `/api/admin/parent-links/${enc(linkId)}`);
