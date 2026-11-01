// Offline preview only: the dashboard preview's in-memory Firebase (which already
// stubs the search page's read calls). No network, no real accounts.
export * from '../dashboard-preview/fixtureFirebase.js';
export const registerStudentAccount = async () => { throw new Error('Not available in the offline preview'); };
