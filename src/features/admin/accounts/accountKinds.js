import { STAFF_ROLES } from '../../../app/roles.js';

/**
 * The three account screens. Each is one list over /api/admin/users with a
 * fixed role filter; staff covers three roles and gets a role sub-filter.
 */
export const ACCOUNT_KINDS = {
  staff: { roles: STAFF_ROLES, createRoles: STAFF_ROLES, navKey: 'nav.staff', createKey: 'accounts.create.staff' },
  students: { roles: ['student'], createRoles: ['student'], navKey: 'nav.students', createKey: 'accounts.create.students' },
  parents: { roles: ['parent'], createRoles: ['parent'], navKey: 'nav.parents', createKey: 'accounts.create.parents' }
};

export const kindForRole = (role) => (role === 'student' ? 'students' : role === 'parent' ? 'parents' : 'staff');
