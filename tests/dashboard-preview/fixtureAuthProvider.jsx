const user = { uid: 'preview-student', email: 'student@example.test' };
const profile = { displayName: 'Alex Rivera', role: 'student', classIds: ['fixture-class'] };
export const AuthProvider = ({ children }) => children;
export const useAuth = () => ({ user, profile, role: 'student', isPrimary: false, orgId: null, classIds: ['fixture-class'], loading: false, ready: true, refreshProfile: () => {} });
