/**
 * Seed Coach Test Data for Validation Scenarios
 */

import { db, doc, setDoc, collection, getDoc } from '../firebase.js';

export async function seedCoachTestData() {
  try {
    // 1. Coach Profile
    const coachUid = 'Yu1yDNMotcWD10hnxJigIQ64Oey1'; // coach.test@example.com
    await setDoc(doc(db, 'users', coachUid), {
      uid: coachUid,
      email: 'coach.test@example.com',
      displayName: 'Test Coach',
      role: 'teacher',
      groupName: 'Test Physics Class',
      schoolId: 'school_123',
      createdAt: Date.now()
    }, { merge: true });

    // 2. Class Record
    await setDoc(doc(db, 'classes', 'class_test_001'), {
      classId: 'class_test_001',
      className: 'Test Physics Class',
      coachId: coachUid,
      students: ['student_test_1', 'student_test_2', 'student_test_3'],
      studentCount: 3,
      avgActivityCompletion: 0.75,
      avgTimePerActivity: 65
    }, { merge: true });

    // 3. Test Student 1 (Alex Test Student)
    await setDoc(doc(db, 'users', 'student_test_1'), {
      uid: 'student_test_1',
      displayName: 'Alex Test Student',
      email: 'alex.test@school.edu',
      groupName: 'Test Physics Class',
      role: 'student',
      createdAt: Date.now() - 86400000 * 7
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_1', 'dailyStats', '2026-09-08'), {
      date: '2026-09-08',
      timeSpentMinutes: 35,
      sessionsCount: 2,
      lastActiveAt: Date.now() - 3600000
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_1', 'dailyStats', '2026-09-07'), {
      date: '2026-09-07',
      timeSpentMinutes: 60,
      sessionsCount: 3
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_1', 'dailyStats', '2026-09-06'), {
      date: '2026-09-06',
      timeSpentMinutes: 30,
      sessionsCount: 1
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_1', 'goals', 'goal_test_1'), {
      goalId: 'goal_test_1',
      title: 'Solar Car Efficiency Target',
      targetMetric: 'Reach 15.0 W/kg',
      status: 'on_track',
      progress: 0.85,
      targetDate: '2026-09-30'
    }, { merge: true });

    await setDoc(doc(db, 'solarCar_prototypes', 'student_test_1'), {
      userId: 'student_test_1',
      teamId: 'team_student_test_1',
      teamName: "Alex's Solar Car",
      currentVersion: 4,
      score: { total: 445, efficiency: 200, aerodynamics: 120, innovation: 75, speed: 50 },
      weight: { total: 2900 },
      components: { chassis: 'carbon_tube', motor: 'bldc', solarPanel: 'solar_30w', battery: 'li_poly_3s' },
      specs: { dragCoefficient: 0.04, aerodynamicRating: 'excellent' },
      images: [{ url: 'https://via.placeholder.com/300x200', timestamp: Date.now() }]
    }, { merge: true });

    // 4. Test Student 2 (Jordan Student)
    await setDoc(doc(db, 'users', 'student_test_2'), {
      uid: 'student_test_2',
      displayName: 'Jordan Student',
      email: 'jordan.test@school.edu',
      groupName: 'Test Physics Class',
      role: 'student',
      createdAt: Date.now() - 86400000 * 5
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_2', 'dailyStats', '2026-09-08'), {
      date: '2026-09-08',
      timeSpentMinutes: 45,
      sessionsCount: 2
    }, { merge: true });

    await setDoc(doc(db, 'solarCar_prototypes', 'student_test_2'), {
      userId: 'student_test_2',
      teamId: 'team_student_test_2',
      teamName: "Jordan's Solar Car",
      currentVersion: 3,
      score: { total: 380, efficiency: 170, aerodynamics: 110, innovation: 60, speed: 40 },
      weight: { total: 3100 },
      components: { chassis: 'aluminum_frame', motor: 'brushed_dc', solarPanel: 'solar_30w' }
    }, { merge: true });

    // 5. Test Student 3 (Taylor Student)
    await setDoc(doc(db, 'users', 'student_test_3'), {
      uid: 'student_test_3',
      displayName: 'Taylor Student',
      email: 'taylor.test@school.edu',
      groupName: 'Test Physics Class',
      role: 'student',
      createdAt: Date.now() - 86400000 * 3
    }, { merge: true });

    await setDoc(doc(db, 'users', 'student_test_3', 'dailyStats', '2026-09-08'), {
      date: '2026-09-08',
      timeSpentMinutes: 46,
      sessionsCount: 3
    }, { merge: true });

    await setDoc(doc(db, 'solarCar_prototypes', 'student_test_3'), {
      userId: 'student_test_3',
      teamId: 'team_student_test_3',
      teamName: "Taylor's Solar Car",
      currentVersion: 5,
      score: { total: 410, efficiency: 190, aerodynamics: 115, innovation: 65, speed: 40 },
      weight: { total: 3000 },
      components: { chassis: 'carbon_tube', motor: 'bldc', solarPanel: 'solar_30w' }
    }, { merge: true });

    console.log('[SeedTestData] Coach test data seeded successfully!');
  } catch (err) {
    console.error('[SeedTestData] Seeding error:', err);
  }
}
