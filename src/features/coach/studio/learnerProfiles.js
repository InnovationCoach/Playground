/**
 * Student Profiles for WeLearn SPARK PBL Authoring Studio
 *
 * Universal Design for Learning (UDL) definition for centre-wide catalog authoring.
 * Conforms to WeLearn SPARK Phase 2 specifications.
 */

export const UNIVERSAL_LEARNER = {
  id: 'universal-all',
  name: 'All Learners (Open Course Catalog)',
  displayName: 'All Learners (Open Course Catalog)',
  avatar: '🌐',
  grade: 'Universal Design (Ages 12–18)',
  cohort: 'Open Centre-Wide',
  diagnosisTraits: 'Universal Design for Learning (UDL) · Multi-Modal MakerSpace',
  traitBadges: ['Open Catalog', 'Universal Design (UDL)', 'Multi-Modal'],
  consumingPassions: 'Autonomous Robotics, Computer Vision, Environmental Telemetry',
  executiveFunctionHurdles: 'Step-by-step milestone checklists & visual scaffolding',
  hurdleBadges: ['Step-by-Step Pacing', 'Visual Checklists'],
  appliedAccommodations: [
    'Universal milestone pacing with multi-modal choices',
    'Self-paced inquiry with MakerSpace tool bench guidance',
    'Open submission formats (Video pitch, GitHub firmware, or Physical prototype)'
  ],
  recommendedTools: ['Bambu Lab X1-C 3D Printer', 'micro:bit V2 / Raspberry Pi Pico', 'Digital Calipers', 'Electronics Bench'],
  isUniversal: true
};

export const STUDENT_2E_PROFILES = [
  UNIVERSAL_LEARNER
];

export const getLearnerById = (id) => UNIVERSAL_LEARNER;
