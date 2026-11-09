/**
 * SYNTHETIC Edmentum sample catalogue.
 *
 * Made-up course entries for coach-side LTI diagnostics and tests only. They
 * are not a school's Edmentum enrolment, are never shown to learners or
 * parents, and must never be labelled "connected". Real course outlines arrive
 * through the reviewed import contract (G1).
 */
export const SYNTHETIC_EDMENTUM_COURSES = Object.freeze([
  {
    id: 'synthetic-edm-bio',
    code: 'SAMPLE-BIO',
    title: 'Sample course: Biology',
    subject: 'Science',
    targetLinkUri: 'https://example.invalid/edmentum/sample-bio',
    synthetic: true
  },
  {
    id: 'synthetic-edm-alg',
    code: 'SAMPLE-ALG',
    title: 'Sample course: Algebra II',
    subject: 'Mathematics',
    targetLinkUri: 'https://example.invalid/edmentum/sample-alg',
    synthetic: true
  }
]);
