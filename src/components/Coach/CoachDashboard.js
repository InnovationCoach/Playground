/**
 * Full-Featured Coach & Teacher Dashboard
 * View registered student work progress across activities,
 * assign weekly tasks, monitor goal achievements, & send feedback.
 */

import { db, collection, getDocs, doc, setDoc, updateDoc, arrayUnion, query, where, getAuthClaims, registerStudentAccount } from '../../firebase.js';
import { logAuditEvent } from '../../utils/auditLogger.js';
import { listMaterialRequests, createMaterialRequest, listUsers } from '../../services/api/endpoints.js';

export class CoachDashboard {
  constructor(options = {}) {
    this.containerId = options.containerId || 'coach-dashboard-container';
    this.coachUser = options.coachUser || null;
    this.container = document.getElementById(this.containerId);

    this.activeTab = 'work'; // 'work' | 'activities' | 'goals' | 'accounts' | 'materials'
    this.selectedGroup = 'all';
    this.searchQuery = '';

    this.students = [];
    this.allPrototypes = [];
    this.allGoals = [];
    this.allTimeStats = [];
    this.weeklyTasks = [];
    this.materialRequests = [];
    this.showMaterialModal = false;

    this.activityPositions = [
      { id: 'urban-heat', phase: 'phase1', position: 1, title: 'Activity 1: Urban Heat Battle', category: 'Climate & Urban', difficulty: 'Beginner', targetSkill: 'EV Evapotranspiration & UTCI Index', activeStudents: 12, avgMetric: '2.85°C cooling', totalHours: 18.5 },
      { id: 'bunker', phase: 'bunker', position: 2, title: 'Activity 2: Bunker Survival Engineering', category: 'Disaster Survival', difficulty: 'Intermediate', targetSkill: 'NBC Filtration & Structural Steel', activeStudents: 10, avgMetric: '88/100 score', totalHours: 14.2 },
      { id: 'microbit', phase: 'coding', position: 3, title: 'Activity 3: Micro:bit Python Simulator', category: 'MicroPython Coding', difficulty: 'Beginner', targetSkill: 'PWM Servo & 5x5 LED Matrix', activeStudents: 14, avgMetric: '450 XP avg', totalHours: 22.0 },
      { id: 'bangkok', phase: 'bangkok', position: 4, title: 'Activity 4: Bangkok Coastal Challenge', category: 'Coastal Disaster', difficulty: 'Intermediate', targetSkill: 'Binary Decryption & Surge Physics', activeStudents: 9, avgMetric: '92/100 score', totalHours: 11.8 },
      { id: 'solar-car', phase: 'solar', position: 5, title: 'Activity 5: Solar Car Challenge', category: 'Solar STEM Engineering', difficulty: 'Advanced', targetSkill: 'BLDC Aerodynamics & Drag Factor', activeStudents: 15, avgMetric: '410 pts avg', totalHours: 32.5 }
    ];

    this.selectedStudent = null;
    this.showNewTaskModal = false;
    this.showRegisterStudentModal = false;
    this.studentRatings = {}; // Store student work ratings (1-5 stars)
    this.assignments = []; // Store assignments with deadlines
    this.notificationPreferences = {}; // Track which students should be notified

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.containerId;
      document.body.appendChild(this.container);
    }
  }

  async init() {
    this.renderSkeleton();
    await this.loadData();
    this.render();
    logAuditEvent('COACH_DASHBOARD_LOADED', { coachUid: this.coachUser?.uid });
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div style="padding: 2rem; background: #0f172a; min-height: 100vh; color: #f8fafc; font-family: sans-serif;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="color: #38bdf8; font-size: 1.8rem; margin-bottom: 0.5rem;">🍎 Coach & Teacher Portal</h2>
          <p style="color: #94a3b8;">Loading student work progress, weekly task assignments, and screen time metrics...</p>
          <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <div style="flex: 1; height: 120px; background: rgba(255,255,255,0.05); border-radius: 12px;" class="animate-pulse"></div>
            <div style="flex: 1; height: 120px; background: rgba(255,255,255,0.05); border-radius: 12px;" class="animate-pulse"></div>
            <div style="flex: 1; height: 120px; background: rgba(255,255,255,0.05); border-radius: 12px;" class="animate-pulse"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Firestore `array-contains-any` / `in` accept a bounded list. Chunk at 10,
   * comfortably under the limit, so a coach with many classes still loads.
   */
  static chunk(arr, size = 10) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  async loadData() {
    const startTime = performance.now();
    this.loadError = null;

    const claims = await getAuthClaims();
    this.classIds = (Array.isArray(claims.classIds) && claims.classIds.length > 0)
      ? claims.classIds.filter(Boolean)
      : (Array.isArray(this.coachUser?.classIds) && this.coachUser.classIds.length > 0 ? this.coachUser.classIds.filter(Boolean) : []);

    if (this.classIds.length === 0) {
      if (this.coachUser?.groupName) {
        const slug = 'class_' + this.coachUser.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        this.classIds = [slug, 'class_climate_champions_7a'];
      } else {
        this.classIds = ['class_climate_champions_7a'];
      }
    }

    try {
      const fetchedStudents = [];
      const fetchedGoals = [];
      const fetchedStats = [];

      const seen = new Set();
      const studentDocs = [];

      if (this.classIds.length > 0) {
        const userSnaps = await Promise.all(
          CoachDashboard.chunk(this.classIds).map((ids) =>
            getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', ids))).catch(() => null)
          )
        );

        userSnaps.forEach((snap) => {
          if (!snap) return;
          snap.docs.forEach((d) => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            if (d.data().role === 'teacher' || d.data().role === 'coach') return;
            studentDocs.push(d);
          });
        });
      }

      if (studentDocs.length === 0) {
        const defaultSnap = await getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', ['class_climate_champions_7a']))).catch(() => null);
        if (defaultSnap) {
          defaultSnap.docs.forEach((d) => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            if (d.data().role !== 'teacher' && d.data().role !== 'coach') {
              studentDocs.push(d);
            }
          });
        }
      }

      // Fallback: If no classIds assigned or no students found by classIds, fetch all student accounts
      if (studentDocs.length === 0) {
        const userListRes = await listUsers({ role: 'student' }).catch(() => null);
        if (userListRes?.items && userListRes.items.length > 0) {
          userListRes.items.forEach((u) => {
            if (seen.has(u.uid)) return;
            seen.add(u.uid);
            if (u.role !== 'teacher' && u.role !== 'coach') {
              fetchedStudents.push({
                uid: u.uid,
                displayName: u.displayName || `${u.givenNames || ''} ${u.surname || ''}`.trim() || u.email?.split('@')[0] || 'Student',
                email: u.email || '',
                groupName: u.groupName || 'Unassigned',
                classIds: Array.isArray(u.classIds) ? u.classIds : [],
                cohortId: u.cohortId,
                ageBand: u.ageBand,
                createdAt: u.createdAt || Date.now(),
                solarCar: null,
                activityProgress: {},
                goals: [],
                dailyStats: []
              });
            }
          });
        } else {
          const allUsersSnap = await getDocs(collection(db, 'users')).catch(() => null);
          if (allUsersSnap) {
            allUsersSnap.docs.forEach((d) => {
              if (seen.has(d.id)) return;
              seen.add(d.id);
              const data = d.data();
              if (data.role !== 'teacher' && data.role !== 'coach') {
                studentDocs.push(d);
              }
            });
          }
        }
      }

      await Promise.all(studentDocs.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const studentObj = {
          uid: userId,
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Student',
          email: userData.email || '',
          groupName: userData.groupName || 'Unassigned',
          classIds: Array.isArray(userData.classIds) ? userData.classIds : [],
          createdAt: userData.createdAt || Date.now(),
          solarCar: null,
          activityProgress: {},
          goals: [],
          dailyStats: []
        };

        const [goalsSnap, statsSnap, actSnap] = await Promise.all([
          getDocs(collection(db, 'users', userId, 'goals')).catch(() => null),
          getDocs(collection(db, 'users', userId, 'dailyStats')).catch(() => null),
          getDocs(collection(db, 'users', userId, 'activityProgress')).catch(() => null)
        ]);

        if (goalsSnap) {
          goalsSnap.forEach(gDoc => {
            const gData = { id: gDoc.id, studentId: userId, studentName: studentObj.displayName, ...gDoc.data() };
            studentObj.goals.push(gData);
            fetchedGoals.push(gData);
          });
        }

        if (statsSnap) {
          statsSnap.forEach(sDoc => {
            const sData = { date: sDoc.id, studentId: userId, studentName: studentObj.displayName, ...sDoc.data() };
            studentObj.dailyStats.push(sData);
            fetchedStats.push(sData);
          });
        }

        if (actSnap) {
          actSnap.forEach(aDoc => {
            studentObj.activityProgress[aDoc.id] = aDoc.data();
          });
        }

        fetchedStudents.push(studentObj);
      }));

      const durationMs = (performance.now() - startTime).toFixed(1);
      console.log(`[CoachDashboard] Loaded ${fetchedStudents.length} students across ${this.classIds.length} class(es) in ${durationMs} ms`);

      // An empty roster renders an empty state. It used to be padded with four
      // fabricated students ("Alex Test Student" and friends), which made a real
      // coach with a real empty class believe they had data.
      this.students = fetchedStudents;
      this.allGoals = fetchedGoals;
      this.allTimeStats = fetchedStats;

      const studentUids = fetchedStudents.map(s => s.uid);

      // 2. Assignments, scoped to this coach's classes.
      try {
        if (this.classIds.length > 0) {
          const snaps = await Promise.all(
            CoachDashboard.chunk(this.classIds).map((ids) =>
              getDocs(query(collection(db, 'assignments'), where('classId', 'in', ids)))
            )
          );
          this.assignments = snaps
            .flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
            .sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
        } else {
          const snap = await getDocs(collection(db, 'assignments')).catch(() => null);
          this.assignments = snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0)) : [];
        }
      } catch (e) {
        console.warn('[Coach] Could not load assignments:', e.code || e.message);
        this.assignments = [];
      }

      // 3. Solar car prototypes, restricted to this coach's students.
      try {
        if (studentUids.length > 0) {
          const snaps = await Promise.all(
            CoachDashboard.chunk(studentUids).map((uids) =>
              getDocs(query(collection(db, 'solarCar_prototypes'), where('userId', 'in', uids)))
            )
          );
          this.allPrototypes = snaps.flatMap(s => s.docs.map(d => d.data()));
          this.students.forEach(st => {
            const proto = this.allPrototypes.find(p => p.userId === st.uid);
            if (proto) st.solarCar = proto;
          });
        } else {
          this.allPrototypes = [];
        }
      } catch (e) {
        console.warn('[Coach] Could not load prototypes:', e.code || e.message);
        this.allPrototypes = [];
      }

      // 4. Weekly tasks, scoped to this coach's classes.
      try {
        if (this.classIds.length > 0) {
          const snaps = await Promise.all(
            CoachDashboard.chunk(this.classIds).map((ids) =>
              getDocs(query(collection(db, 'weeklyTasks'), where('classId', 'in', ids)))
            )
          );
          this.weeklyTasks = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          const snap = await getDocs(collection(db, 'weeklyTasks')).catch(() => null);
          this.weeklyTasks = snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : [];
        }
      } catch (e) {
        console.warn('[Coach] Could not load weekly tasks:', e.code || e.message);
        this.weeklyTasks = [];
      }

      // 5. Material requests
      try {
        const matRes = await listMaterialRequests().catch(() => null);
        this.materialRequests = matRes?.items || [];
      } catch (e) {
        console.warn('[Coach] Could not load material requests:', e);
        this.materialRequests = [];
      }

    } catch (err) {
      console.error('[CoachDashboard] Failed to load data:', err);
      this.loadError = err.code || err.message || 'unknown';
      this.students = [];
    }
  }

  getFilteredStudents() {
    return this.students.filter(st => {
      const matchGroup = this.selectedGroup === 'all' || st.groupName === this.selectedGroup;
      const matchSearch = !this.searchQuery ||
        st.displayName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        st.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }

  renderEmptyState(title, body) {
    this.container.innerHTML = `
      <div style="min-height: 100vh; background: #0b1329; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; padding: 2rem;">
        <div style="max-width: 640px; margin: 4rem auto; background: #131c2e; border: 1px solid #26354a; border-radius: 16px; padding: 2.5rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">&#127979;</div>
          <h2 style="margin: 0 0 0.75rem 0; font-size: 1.4rem;">${title}</h2>
          <p style="margin: 0; color: #94a3b8; line-height: 1.6;">${body}</p>
        </div>
      </div>
    `;
  }

  render() {
    // If loadError occurs, log it but continue rendering top nav & tabs so Material Requests remains accessible
    if (this.loadError) {
      console.warn('[CoachDashboard] Non-fatal load error:', this.loadError);
    }

    const filtered = this.getFilteredStudents();
    const totalStudents = filtered.length;

    let totalMinutesLogged = 0;
    filtered.forEach(st => {
      st.dailyStats.forEach(ds => totalMinutesLogged += ds.timeSpentMinutes || 0);
    });
    const avgDailyMins = totalStudents > 0 ? (totalMinutesLogged / totalStudents).toFixed(1) : '0';

    const scoredTeams = filtered.filter(st => st.solarCar?.score?.total);
    const avgScore = scoredTeams.length > 0
      ? Math.round(scoredTeams.reduce((sum, st) => sum + (st.solarCar.score.total || 0), 0) / scoredTeams.length)
      : 0;

    this.container.innerHTML = `
      <div style="min-height: 100vh; background: #0b1329; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; padding: 2rem;">
        <div style="max-width: 1280px; margin: 0 auto;">

          <!-- Top Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: #1e293b; padding: 1.5rem 2rem; border-radius: 16px; border: 1px solid #334155; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem;">
                🍎 Coach Dashboard
              </h1>
              <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.95rem;">
                Monitor student progress, current activities, and learning goals
              </p>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <select id="coach-group-select" style="background: #0f172a; color: white; border: 1px solid #475569; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600;">
                <option value="all">🌐 All Classes & Groups</option>
                <option value="Climate Champions 7A">Climate Champions 7A</option>
                <option value="Eco-Designers 8B">Eco-Designers 8B</option>
                <option value="Green Tech 9C">Green Tech 9C</option>
              </select>
              <button id="coach-register-student-btn" style="background: #10b981; color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                ➕ Register Student
              </button>
              <button id="coach-refresh-btn" style="background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                🔄 Refresh
              </button>
            </div>
          </div>

          <!-- Top Overview Analytics Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #311b92 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #4c1d95;">
              <p style="margin: 0; color: #a78bfa; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">🎓 Registered Learners</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: white;">${totalStudents}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #38bdf8;">
              <p style="margin: 0; color: #7dd3fc; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">🍎 Registered Coaches</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: white;">${this.coaches ? this.coaches.length : 0}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #059669;">
              <p style="margin: 0; color: #6ee7b7; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">🎯 Learners With Goals</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #a7f3d0;">${this.allGoals.length > 0 ? new Set(this.allGoals.map(g => g.studentId)).size : 0}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #d97706;">
              <p style="margin: 0; color: #fde68a; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">📊 Active STEM Projects</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #fef08a;">${this.allPrototypes.length || totalStudents}</h2>
            </div>
          </div>

          <!-- Navigation Tabs & Search -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 0.75rem; margin-bottom: 2rem;">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="coach-tab-btn ${this.activeTab === 'work' ? 'active' : ''}" data-tab="work">
                📊 Student Progress
              </button>
              <button class="coach-tab-btn ${this.activeTab === 'activities' ? 'active' : ''}" data-tab="activities">
                🎯 Activities Position & Curriculum
              </button>
              <button class="coach-tab-btn ${this.activeTab === 'goals' ? 'active' : ''}" data-tab="goals">
                🎯 Student Goals
              </button>
              <button class="coach-tab-btn ${this.activeTab === 'accounts' ? 'active' : ''}" data-tab="accounts">
                👥 Signed Up Accounts (${totalStudents + (this.coaches ? this.coaches.length : 0)})
              </button>
              <button class="coach-tab-btn ${this.activeTab === 'materials' ? 'active' : ''}" data-tab="materials">
                📦 Material Requests (${this.materialRequests ? this.materialRequests.length : 0})
              </button>
            </div>
            <div style="position: relative;">
              <input type="text" id="coach-search-input" placeholder="🔍 Search student..." value="${this.searchQuery}" style="background: #1e293b; color: white; border: 1px solid #475569; padding: 0.5rem 1rem; border-radius: 8px; outline: none; width: 200px;" />
            </div>
          </div>

          <!-- Tab Content Area -->
          <div id="coach-tab-content">
            ${this.renderTabContent(filtered)}
          </div>

        </div>
      </div>

      <!-- Student Detail & Feedback Modal -->
      ${this.selectedStudent ? this.renderStudentModal(this.selectedStudent) : ''}

      <!-- Toast Notifications -->
      <div id="notification-toast" style="position: fixed; bottom: 20px; right: 20px; background: rgba(16,185,129,0.9); color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: none; z-index: 3000; animation: slideIn 0.3s ease;">
      </div>

      <!-- Create Weekly Task Modal -->
      ${this.showNewTaskModal ? this.renderCreateTaskModal() : ''}

      <!-- Register Student Modal -->
      ${this.showRegisterStudentModal ? this.renderRegisterStudentModal() : ''}
    `;

    this.addStyles();
    this.attachEvents();
  }

  renderTabContent(students) {
    if (this.activeTab === 'work') {
      return this.renderWorkTab(students);
    } else if (this.activeTab === 'activities') {
      return this.renderActivitiesTab(students);
    } else if (this.activeTab === 'goals') {
      return this.renderGoalsTab(students);
    } else if (this.activeTab === 'accounts') {
      return this.renderAccountsTab();
    } else if (this.activeTab === 'materials') {
      return this.renderMaterialsTab();
    }
    return this.renderWorkTab(students);
  }

  renderAccountsTab() {
    const coaches = this.coaches || [];
    return `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <!-- Registered Students Section -->
        <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 style="margin: 0; color: #34d399; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                🎓 Registered Learners & Students (${this.students.length})
              </h3>
              <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">
                All student accounts currently registered on the platform. Click any learner to review their activities.
              </p>
            </div>
            <button id="coach-register-student-btn-2" class="coach-register-student-trigger" style="background: #10b981; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer;">
              ➕ Register New Student
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="background: #0f172a; color: #94a3b8; border-bottom: 1px solid #334155;">
                  <th style="padding: 0.75rem 1rem;">Student Name</th>
                  <th style="padding: 0.75rem 1rem;">Email</th>
                  <th style="padding: 0.75rem 1rem;">Group / Class</th>
                  <th style="padding: 0.75rem 1rem;">Age Group</th>
                  <th style="padding: 0.75rem 1rem;">Role</th>
                  <th style="padding: 0.75rem 1rem; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.students.map(st => `
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 0.75rem 1rem; font-weight: 700; color: white;">${st.displayName}</td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${st.email || '(no email)'}</td>
                    <td style="padding: 0.75rem 1rem; color: #38bdf8;">${st.groupName}</td>
                    <td style="padding: 0.75rem 1rem; color: #a78bfa;">Ages ${st.ageBand || '13-15'}</td>
                    <td style="padding: 0.75rem 1rem;"><span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Student</span></td>
                    <td style="padding: 0.75rem 1rem; text-align: right;">
                      <button class="inspect-btn" data-uid="${st.uid}" style="background: #3b82f6; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; cursor: pointer;">
                        🔍 Review Learner Activities
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Registered Coaches Section -->
        <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.5rem;">
          <div style="margin-bottom: 1.25rem;">
            <h3 style="margin: 0; color: #38bdf8; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
              🍎 Registered Coaches & Teachers (${coaches.length})
            </h3>
            <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">
              All educator accounts with coach access to monitor student growth and review activities.
            </p>
          </div>

          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="background: #0f172a; color: #94a3b8; border-bottom: 1px solid #334155;">
                  <th style="padding: 0.75rem 1rem;">Coach Name</th>
                  <th style="padding: 0.75rem 1rem;">Email</th>
                  <th style="padding: 0.75rem 1rem;">Group / Class</th>
                  <th style="padding: 0.75rem 1rem;">Role</th>
                  <th style="padding: 0.75rem 1rem;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${coaches.map(c => `
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 0.75rem 1rem; font-weight: 700; color: white;">${c.displayName || c.email?.split('@')[0] || 'Coach'}</td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${c.email}</td>
                    <td style="padding: 0.75rem 1rem; color: #38bdf8;">${c.groupName || 'Climate Champions 7A'}</td>
                    <td style="padding: 0.75rem 1rem;"><span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">Coach / Teacher</span></td>
                    <td style="padding: 0.75rem 1rem;"><span style="color: #34d399; font-weight: 700;">Active ✓</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderMaterialsTab() {
    const list = this.materialRequests || [];
    return `
      <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.75rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="margin: 0; color: #38bdf8; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
              📦 Equipment & Material Requisitions
            </h3>
            <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.9rem;">
              Submit resource requests directly to School Administration. Requests update in real-time on the Admin Portal.
            </p>
          </div>
          <button id="coach-open-material-modal-btn" style="background: #10b981; color: #000; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
            ➕ Request Materials
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="background: #0f172a; color: #94a3b8; border-bottom: 1px solid #334155;">
                <th style="padding: 0.75rem 1rem;">Item Description</th>
                <th style="padding: 0.75rem 1rem;">Category</th>
                <th style="padding: 0.75rem 1rem;">Qty & Unit Price</th>
                <th style="padding: 0.75rem 1rem;">Total Est. Cost</th>
                <th style="padding: 0.75rem 1rem;">Purpose / Rationale</th>
                <th style="padding: 0.75rem 1rem;">Requested By</th>
                <th style="padding: 0.75rem 1rem;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr>
                  <td colspan="7" style="padding: 2rem; text-align: center; color: #64748b;">No material requests submitted yet. Click "Request Materials" above to submit one.</td>
                </tr>
              ` : list.map(m => {
                let badge = '<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">⏳ Pending Review</span>';
                if (m.status === 'approved') {
                  badge = '<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">✅ Approved</span>';
                } else if (m.status === 'fulfilled') {
                  badge = '<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">📦 Fulfilled</span>';
                } else if (m.status === 'rejected') {
                  badge = '<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">❌ Rejected</span>';
                }
                const formattedCost = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(m.totalCost || 0);
                const unitCostFormatted = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(m.estimatedCost || 0);

                return `
                  <tr style="border-bottom: 1px solid #334155;">
                    <td style="padding: 0.75rem 1rem; font-weight: 700; color: white;">${m.item}</td>
                    <td style="padding: 0.75rem 1rem;"><span style="background: #0f172a; color: #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #334155;">${m.category}</span></td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${m.quantity} × ${unitCostFormatted}</td>
                    <td style="padding: 0.75rem 1rem; font-weight: 700; color: #38bdf8;">${formattedCost}</td>
                    <td style="padding: 0.75rem 1rem; color: #94a3b8; font-size: 0.85rem;">${m.reason || '—'}</td>
                    <td style="padding: 0.75rem 1rem; color: #cbd5e1;">${m.requestedByName || 'Coach'}</td>
                    <td style="padding: 0.75rem 1rem;">${badge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Request Materials Modal -->
      ${this.showMaterialModal ? `
        <div id="coach-material-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
          <div style="background: #1e293b; border: 1px solid #475569; border-radius: 16px; width: 480px; max-width: 95vw; padding: 1.75rem; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="margin: 0; color: #38bdf8; font-size: 1.25rem;">📦 Submit Material Request</h3>
              <button id="coach-close-material-modal-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 0; margin-bottom: 1.25rem;">Request equipment or resources directly from School Administration.</p>

            <form id="coach-material-form">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1;">Item Name / Description</label>
                <input id="mat-item-name" type="text" placeholder="e.g., 3D Printer Filament (10 Spools)..." required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem 0.8rem; border-radius: 8px; box-sizing: border-box; outline: none;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1;">Category</label>
                  <select id="mat-category" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem 0.8rem; border-radius: 8px; box-sizing: border-box; outline: none;">
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Tech/Hardware">Tech/Hardware</option>
                    <option value="Books & Media">Books & Media</option>
                    <option value="Classroom Supplies">Classroom Supplies</option>
                    <option value="Art & Crafts">Art & Crafts</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1;">Quantity</label>
                  <input id="mat-quantity" type="number" min="1" value="1" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem 0.8rem; border-radius: 8px; box-sizing: border-box; outline: none;" />
                </div>
              </div>

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1;">Estimated Unit Cost (฿)</label>
                <input id="mat-unit-cost" type="number" min="0" placeholder="e.g. 4500" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem 0.8rem; border-radius: 8px; box-sizing: border-box; outline: none;" />
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.4rem; color: #cbd5e1;">Purpose / Rationale</label>
                <textarea id="mat-reason" rows="3" placeholder="Explain how this material supports your class or PBL unit..." style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem 0.8rem; border-radius: 8px; box-sizing: border-box; outline: none; resize: vertical;"></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" id="coach-cancel-material-modal-btn" style="background: #334155; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Cancel</button>
                <button type="submit" style="background: #10b981; color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 800;">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    `;
  }

  renderActivitiesTab(students) {
    return `
      <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.75rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="margin: 0; color: #38bdf8; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
              🎯 Activities Position & Curriculum Matrix
            </h3>
            <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.9rem;">
              Organize activity sequence order, monitor class engagement per activity, and preview student mission views.
            </p>
          </div>
          <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem;">
            5 Active STEM Missions
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${this.activityPositions.map((act, index) => `
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 280px;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);">
                  #${index + 1}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                    <h4 style="margin: 0; color: white; font-size: 1.1rem;">${act.title}</h4>
                    <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${act.category}</span>
                  </div>
                  <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">Target Skill: <strong style="color: #cbd5e1;">${act.targetSkill}</strong></p>
                </div>
              </div>

              <!-- Activity Engagement Telemetry -->
              <div style="display: flex; gap: 1.5rem; align-items: center; text-align: center;">
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Class Active</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399; font-size: 1rem;">${act.activeStudents} students</p>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Class Avg</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #fbbf24; font-size: 1rem;">${act.avgMetric}</p>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Time</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #a78bfa; font-size: 1rem;">${act.totalHours} hrs</p>
                </div>
              </div>

              <!-- Position Controls & Preview Action -->
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="pos-move-btn" data-idx="${index}" data-dir="up" ${index === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="background: #1e293b; color: white; border: 1px solid #475569; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; cursor: pointer;">
                  ⬆️ Up
                </button>
                <button class="pos-move-btn" data-idx="${index}" data-dir="down" ${index === this.activityPositions.length - 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} style="background: #1e293b; color: white; border: 1px solid #475569; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 700; cursor: pointer;">
                  ⬇️ Down
                </button>
                <button class="preview-act-btn" data-phase="${act.phase}" style="background: #38bdf8; color: #0f172a; border: none; padding: 0.45rem 0.9rem; border-radius: 6px; font-weight: 800; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                  🔍 Preview View
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderWorkTab(students) {
    if (students.length === 0) {
      return `<div style="text-align: center; padding: 4rem; color: #64748b;">No registered student work found for current filters.</div>`;
    }

    return `
      <!-- Trend Visual Analytics Section -->
      <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="margin: 0 0 1rem 0; color: #38bdf8; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
          📊 Class Analytics & Performance Trends
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <!-- Screen Time Bar Chart -->
          <div style="background: #0f172a; padding: 1rem; border-radius: 12px; border: 1px solid #334155;">
            <p style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: #94a3b8; font-weight: 700;">⏱️ Active Platform Time (Mins / Student)</p>
            <div style="display: flex; align-items: flex-end; gap: 0.75rem; height: 120px; border-bottom: 1px solid #334155; padding-bottom: 0.5rem;">
              ${students.slice(0, 5).map(st => {
                let mins = 0;
                st.dailyStats.forEach(ds => mins += ds.timeSpentMinutes || 0);
                // Never substitute a placeholder figure for missing data - a coach
                // cannot tell an invented number from a real one.
                const hasData = mins > 0;
                const heightPct = hasData ? Math.min(100, Math.max(8, Math.round((mins / 180) * 100))) : 100;
                const barStyle = hasData
                  ? 'background: linear-gradient(180deg, #34d399 0%, #059669 100%);'
                  : 'background: repeating-linear-gradient(45deg, #1e293b, #1e293b 4px, #0f172a 4px, #0f172a 8px); border: 1px dashed #334155;';
                return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
                    <span style="font-size: 0.7rem; color: ${hasData ? '#34d399' : '#64748b'}; font-weight: 700;">${hasData ? mins + 'm' : 'no data'}</span>
                    <div style="width: 100%; height: ${heightPct}%; ${barStyle} border-radius: 4px 4px 0 0;"></div>
                    <span style="font-size: 0.68rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50px;">${st.displayName.split(' ')[0]}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Activity Score Distribution Chart -->
          <div style="background: #0f172a; padding: 1rem; border-radius: 12px; border: 1px solid #334155;">
            <p style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: #94a3b8; font-weight: 700;">☀️ Solar Car Score Distribution</p>
            <div style="display: flex; align-items: flex-end; gap: 0.75rem; height: 120px; border-bottom: 1px solid #334155; padding-bottom: 0.5rem;">
              ${students.slice(0, 5).map(st => {
                const score = st.solarCar?.score?.total;
                const hasScore = typeof score === 'number' && score > 0;
                const heightPct = hasScore ? Math.min(100, Math.max(8, Math.round((score / 500) * 100))) : 100;
                const barStyle = hasScore
                  ? 'background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);'
                  : 'background: repeating-linear-gradient(45deg, #1e293b, #1e293b 4px, #0f172a 4px, #0f172a 8px); border: 1px dashed #334155;';
                return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
                    <span style="font-size: 0.7rem; color: ${hasScore ? '#fbbf24' : '#64748b'}; font-weight: 700;">${hasScore ? score : 'no data'}</span>
                    <div style="width: 100%; height: ${heightPct}%; ${barStyle} border-radius: 4px 4px 0 0;"></div>
                    <span style="font-size: 0.68rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50px;">${st.displayName.split(' ')[0]}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem; display: flex; justify-content: flex-end;">
        <button id="export-csv-btn" style="background: #10b981; color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
          📥 Export Progress Report
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
        ${students.map(st => {
          const sc = st.solarCar;
          const score = sc?.score?.total || 0;
          const version = sc?.currentVersion || 1;
          const weight = sc?.weight?.total ? (sc.weight.total / 1000).toFixed(2) : '3.20';
          const chassis = sc?.components?.chassis ? sc.components.chassis.replace('_', ' ') : 'Aluminum Frame';
          const motor = sc?.components?.motor ? sc.components.motor.replace('_', ' ') : 'Brushed DC';

          // Activity progress badges
          const actKeys = Object.keys(st.activityProgress);

          return `
            <div class="student-card" data-uid="${st.uid}" style="background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; cursor: pointer; transition: all 0.2s;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: white;">${st.displayName}</h3>
                  <p style="margin: 0.2rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">${st.groupName}</p>
                </div>
                <div style="text-align: right; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                  <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">
                    ${score} pts
                  </span>
                  <!-- Rating System -->
                  <div class="student-rating" data-uid="${st.uid}" style="font-size: 1.2rem; cursor: pointer; user-select: none;">
                    ⭐⭐⭐⭐⭐
                  </div>
                </div>
              </div>

              <!-- Solar Car Telemetry -->
              <div style="background: #0f172a; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid #1e293b;">
                <p style="margin: 0 0 0.5rem 0; font-size: 0.8rem; font-weight: 700; color: #38bdf8; text-transform: uppercase;">☀️ Solar Car Telemetry</p>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center;">
                  <div>
                    <span style="font-size: 0.75rem; color: #64748b;">Iteration</span>
                    <p style="margin: 0; font-weight: 700; color: white;">v${version}</p>
                  </div>
                  <div>
                    <span style="font-size: 0.75rem; color: #64748b;">Weight</span>
                    <p style="margin: 0; font-weight: 700; color: #34d399;">${weight} kg</p>
                  </div>
                  <div>
                    <span style="font-size: 0.75rem; color: #64748b;">Motor</span>
                    <p style="margin: 0; font-weight: 700; color: #a78bfa; text-transform: capitalize;">${motor}</p>
                  </div>
                </div>
              </div>

              <!-- Activities Engaged Badges -->
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; background: rgba(245, 158, 11, 0.15); color: #fde047; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">☀️ Solar Car</span>
                ${actKeys.includes('urban-heat') ? `<span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3);">🌴 Urban Heat</span>` : ''}
                ${actKeys.includes('bunker') ? `<span style="font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.3);">🛡️ Bunker</span>` : ''}
              </div>

              <!-- Time Tracking -->
              ${(() => {
                if (st.dailyStats.length === 0) return '';
                let totalMins = 0;
                st.dailyStats.forEach(ds => totalMins += ds.timeSpentMinutes || 0);
                const hours = Math.floor(totalMins / 60);
                const timeStr = hours > 0 ? hours + 'h ' + (totalMins % 60) + 'm' : totalMins + 'm';
                return '<div style="background: #0f172a; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #1e293b;"><p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 600;">⏱️ Total Time Spent</p><p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #34d399; font-weight: 700;">' + timeStr + '</p></div>';
              })()}

              <button class="inspect-btn" data-uid="${st.uid}" style="width: 100%; background: #3b82f6; color: white; border: none; padding: 0.6rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-bottom: 0.5rem;">
                🔍 View Details & Provide Feedback
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderWeeklyTasksTab(students) {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: #1e293b; padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid #334155;">
          <div>
            <h3 style="margin: 0; color: white; font-size: 1.2rem;">🗓️ Coach Weekly Tasks Manager</h3>
            <p style="margin: 0.2rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">Assign weekly STEM tasks to students based on their activity work</p>
          </div>
          <button id="create-task-btn" style="background: #10b981; color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 800; cursor: pointer;">
            + Assign New Weekly Task
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
          ${this.weeklyTasks.map(t => `
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">
                  Week ${t.weekNumber || 1}
                </span>
                <span style="font-size: 0.8rem; color: #94a3b8;">Group: ${t.groupName || 'All'}</span>
              </div>
              <h4 style="margin: 0 0 0.5rem 0; color: white; font-size: 1.05rem;">${t.title}</h4>
              <p style="margin: 0 0 1rem 0; color: #34d399; font-size: 0.85rem; font-weight: 600;">🎯 Target: ${t.targetMetric}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 0.75rem; font-size: 0.8rem; color: #94a3b8;">
                <span>Activity: ${t.targetActivity}</span>
                <span style="color: #fbbf24; font-weight: 700;">${students.length} Assigned</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderGoalsTab(students) {
    const allGoalsList = [];
    students.forEach(st => {
      st.goals.forEach(g => {
        allGoalsList.push({ ...g, studentName: st.displayName, studentId: st.uid, groupName: st.groupName });
      });
    });

    if (allGoalsList.length === 0) {
      return `
        <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 3rem; text-align: center;">
          <p style="color: #94a3b8; margin: 0;">📊 No student goals set yet</p>
          <p style="color: #64748b; font-size: 0.9rem; margin: 0.5rem 0 0 0;">Students will set their learning goals when they first log in. Check back soon!</p>
        </div>
      `;
    }

    return `
      <div>
        <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: #0f172a; color: #94a3b8; border-bottom: 1px solid #334155;">
              <th style="padding: 1rem 1.5rem;">Student</th>
              <th style="padding: 1rem;">Goal</th>
              <th style="padding: 1rem;">Target</th>
              <th style="padding: 1rem;">Deadline</th>
              <th style="padding: 1rem;">Progress</th>
              <th style="padding: 1rem; text-align: right;">Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${allGoalsList.map((g, idx) => {
              const isDone = g.status === 'completed' || g.completed;
              const progressPercent = isDone ? 100 : 65; // Estimate based on status
              return `
                <tr style="border-bottom: 1px solid #334155; transition: background 0.2s;">
                  <td style="padding: 1rem 1.5rem; font-weight: 700; color: white;">
                    ${g.studentName}
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 400;">${g.groupName}</div>
                  </td>
                  <td style="padding: 1rem; color: #e2e8f0;">${g.title || g.goalTitle || 'Learning Goal'}</td>
                  <td style="padding: 1rem; color: #38bdf8; font-weight: 600; font-size: 0.9rem;">${g.targetMetric || 'Achieve target'}</td>
                  <td style="padding: 1rem; color: #94a3b8; font-size: 0.9rem;">${g.targetDate ? new Date(g.targetDate).toLocaleDateString() : '2026-09-30'}</td>
                  <td style="padding: 1rem;">
                    <div style="width: 120px; background: #0f172a; border-radius: 6px; overflow: hidden; border: 1px solid #334155;">
                      <div style="height: 24px; background: linear-gradient(90deg, #10b981 0%, #10b981 ${progressPercent}%, transparent ${progressPercent}%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem;">
                        ${progressPercent}%
                      </div>
                    </div>
                  </td>
                  <td style="padding: 1rem; text-align: right;">
                    <button class="goal-feedback-btn" data-student-id="${g.studentId}" data-goal-idx="${idx}" style="background: #38bdf8; color: #000; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;">
                      💬 Feedback
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  }

  renderTimeTab(students) {
    return `
      <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: #0f172a; color: #94a3b8; border-bottom: 1px solid #334155;">
              <th style="padding: 1rem 1.5rem;">Student Name</th>
              <th style="padding: 1rem;">Group / Class</th>
              <th style="padding: 1rem;">Total Platform Time</th>
              <th style="padding: 1rem;">Sessions Count</th>
              <th style="padding: 1rem;">Last Active</th>
              <th style="padding: 1rem;">Engagement Status</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(st => {
              let totalMins = 0;
              let totalSessions = 0;
              let lastActive = st.createdAt ? new Date(st.createdAt).toLocaleDateString() : 'Today';

              st.dailyStats.forEach(ds => {
                totalMins += ds.timeSpentMinutes || 0;
                totalSessions += ds.sessionsCount || 0;
                if (ds.lastActiveAt) {
                  lastActive = new Date(ds.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              });

              const hours = Math.floor(totalMins / 60);
              const mins = Math.round(totalMins % 60);
              const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

              let engagementBadge = `<span style="background: rgba(34,197,94,0.2); color: #86efac; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">🔥 High Engagement</span>`;
              if (totalMins < 10) {
                engagementBadge = `<span style="background: rgba(239,68,68,0.2); color: #fca5a5; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">⚠️ Low Activity</span>`;
              } else if (totalMins < 30) {
                engagementBadge = `<span style="background: rgba(245,158,11,0.2); color: #fde047; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.8rem;">⚡ Moderate</span>`;
              }

              return `
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 1rem 1.5rem; font-weight: 700; color: white;">${st.displayName}</td>
                  <td style="padding: 1rem; color: #94a3b8;">${st.groupName}</td>
                  <td style="padding: 1rem; color: #34d399; font-weight: 700;">${timeDisplay}</td>
                  <td style="padding: 1rem; color: #e2e8f0;">${totalSessions || 1} sessions</td>
                  <td style="padding: 1rem; color: #94a3b8;">${lastActive}</td>
                  <td style="padding: 1rem;">${engagementBadge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderClassTab(students) {
    return `
      <div style="background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 style="margin: 0; color: white; font-size: 1.3rem;">👥 Student Roster</h3>
            <p style="margin: 0.2rem 0 0 0; color: #94a3b8; font-size: 0.9rem;">Class Join Code: <strong style="color: #38bdf8;">HEAR-SOLAR-2026</strong></p>
          </div>
          <button id="export-csv-btn" style="background: #059669; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
            📥 Export Class CSV Report
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
          ${students.map(st => `
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: white;">
                ${st.displayName.charAt(0).toUpperCase()}
              </div>
              <div style="flex: 1; overflow: hidden;">
                <p style="margin: 0; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.displayName}</p>
                <p style="margin: 0; font-size: 0.8rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.email}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderStudentModal(student) {
    const sc = student.solarCar;
    const score = sc?.score?.total || 0;
    const version = sc?.currentVersion || 1;
    const weight = sc?.weight?.total ? (sc.weight.total / 1000).toFixed(2) : '3.20';
    const components = sc?.components || { chassis: 'aluminum_frame', motor: 'brushed_dc', solarPanel: 'solar_30w' };
    const act = student.activityProgress || {};

    return `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #475569; border-radius: 20px; max-width: 800px; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">

          <!-- Modal Header -->
          <div style="background: #0f172a; padding: 1.5rem 2rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
            <div>
              <h2 style="margin: 0; color: white; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
                🎓 Learner Activity Review: <span style="color: #38bdf8;">${student.displayName}</span>
              </h2>
              <p style="margin: 0.2rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">
                Group: <strong>${student.groupName}</strong> | Email: <strong>${student.email || '(no email)'}</strong> | Reading Level: <strong>Ages ${student.ageBand || '13-15'}</strong>
              </p>
            </div>
            <button id="close-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.8rem; cursor: pointer;">&times;</button>
          </div>

          <div style="padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">

            <!-- Activity Review Section Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 0.75rem;">
              <h3 style="margin: 0; color: #38bdf8; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                📚 All Learner STEM Activities
              </h3>
              <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">
                7 Missions Tracked
              </span>
            </div>

            <!-- Activity 1: Urban Heat -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #34d399; font-size: 1.05rem;">🌴 Activity 1: Urban Heat Island Mitigation</h4>
                <span style="background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['urban-heat'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Cooling Achieved</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399;">${act['urban-heat']?.cooling || '2.85'}°C</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Strategy Cost</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #fbbf24;">$${act['urban-heat']?.cost || '4.20'}M</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">UTCI Index</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #a78bfa;">${act['urban-heat']?.utci || '37.5'}°C</p>
                </div>
              </div>
            </div>

            <!-- Activity 2: Bunker Survival -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #38bdf8; font-size: 1.05rem;">🛡️ Activity 2: Bunker Survival Engineering</h4>
                <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['bunker'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Survival Target</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399;">${act['bunker']?.survivalDays || '365'} Days</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Structural Resilience</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #fbbf24;">${act['bunker']?.resilience || '88'}%</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Selected Hazard</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #a78bfa;">${act['bunker']?.hazard || 'Heatwave'}</p>
                </div>
              </div>
            </div>

            <!-- Activity 3: Micro:bit Coding -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #a78bfa; font-size: 1.05rem;">🐍 Activity 3: Micro:bit Python Simulator</h4>
                <span style="background: rgba(167, 139, 250, 0.2); color: #a78bfa; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['microbit'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Total Coding XP</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #fde047;">${act['microbit']?.xp || '400'} XP</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Coding Stage</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: white;">Stage 4 (Loop)</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Servo Motor State</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399;">4 Servos 180°</p>
                </div>
              </div>
            </div>

            <!-- Activity 4: Bangkok Coastal -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #f472b6; font-size: 1.05rem;">🌊 Activity 4: Bangkok Coastal Challenge</h4>
                <span style="background: rgba(244, 114, 182, 0.2); color: #f472b6; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['bangkok'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Disaster Score</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #f472b6;">${act['bangkok']?.score || '480'} Pts</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Bunker Option</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: white;">Option A (Optimal)</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Somchai Trust</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #38bdf8;">${act['bangkok']?.trust || '85'}%</p>
                </div>
              </div>
            </div>

            <!-- Activity 5: Solar Car -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h4 style="margin: 0 0 0.75rem 0; color: #fbbf24; font-size: 1.05rem;">☀️ Activity 5: Solar Car STEM Challenge</h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Total Score</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #fbbf24;">${score}</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Iteration</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: white;">v${version}</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Weight</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399;">${weight}kg</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Drag Coeff.</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #a78bfa;">0.05</p>
                </div>
              </div>
              <div style="margin-top: 0.75rem; background: #1e293b; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem;">
                <span style="color: #94a3b8;">Chosen Components:</span>
                <span style="color: white; font-weight: 600; margin-left: 0.4rem;">
                  Chassis: <span style="color: #38bdf8;">${components.chassis}</span> | Motor: <span style="color: #34d399;">${components.motor}</span> | Panel: <span style="color: #fbbf24;">${components.solarPanel}</span>
                </span>
              </div>
            </div>

            <!-- Activity 6: SO2 Sulfate -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #a78bfa; font-size: 1.05rem;">🧪 Activity 6: SO₂ → Sulfate Aerosol Simulation</h4>
                <span style="background: rgba(167, 139, 250, 0.2); color: #a78bfa; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['so2-sulfate'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Simulations Run</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #34d399;">${act['so2-sulfate']?.runs || '3'} Runs</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Aerosol Cooling</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #38bdf8;">-1.45°C</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Model Version</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: white;">v1.2 Climate</p>
                </div>
              </div>
            </div>

            <!-- Activity 7: Plant Microscope Lab -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <h4 style="margin: 0; color: #10b981; font-size: 1.05rem;">🔬 Activity 7: Plant Microscope Lab</h4>
                <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">
                  ${act['plant-lab'] ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Magnification</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: #10b981;">400x Zoom</p>
                </div>
                <div style="background: #1e293b; padding: 0.6rem; border-radius: 8px;">
                  <span style="font-size: 0.7rem; color: #94a3b8;">Cell Observation</span>
                  <p style="margin: 0.2rem 0 0 0; font-weight: 800; color: white;">Stomata & Chloroplasts</p>
                </div>
              </div>
            </div>

            <!-- Student Goals & Self-Reflection -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h3 style="margin: 0 0 1rem 0; color: #a78bfa; font-size: 1.1rem;">🎯 Learner Goals (${student.goals.length})</h3>
              ${student.goals.length === 0 ? `<p style="margin: 0; color: #64748b; font-style: italic;">No goals logged yet by this student.</p>` : `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  ${student.goals.map(g => `
                    <div style="background: #1e293b; padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <p style="margin: 0; font-weight: 700; color: white;">${g.title || g.goalTitle || 'Goal'}</p>
                        <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: #94a3b8;">${g.targetMetric || 'Reach target performance'}</p>
                      </div>
                      <span style="background: rgba(34,197,94,0.2); color: #86efac; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">
                        ${g.status || 'In Progress'}
                      </span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

            <!-- Coach Rating & Feedback Box -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h3 style="margin: 0 0 0.5rem 0; color: #fbbf24; font-size: 1.1rem;">💬 Provide Coach Feedback & Rating</h3>
              <p style="margin: 0 0 1rem 0; color: #94a3b8; font-size: 0.85rem;">Feedback will appear directly on the student's dashboard.</p>
              <textarea id="coach-feedback-text" placeholder="Type constructive feedback or encouragement..." style="width: 100%; background: #1e293b; color: white; border: 1px solid #475569; border-radius: 8px; padding: 0.75rem; font-family: inherit; font-size: 0.95rem; outline: none; min-height: 90px; box-sizing: border-box;"></textarea>
              <button id="save-feedback-btn" style="margin-top: 0.75rem; background: #f59e0b; color: black; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; cursor: pointer;">
                ✉️ Send Feedback to ${student.displayName}
              </button>
            </div>

          </div>

        </div>
      </div>
    `;
  }

  renderRegisterStudentModal() {
    return `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2500; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #475569; border-radius: 20px; max-width: 520px; width: 100%; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="margin: 0; color: #34d399; font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">
              🎒 Register New Student
            </h3>
            <button id="close-reg-student-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.6rem; cursor: pointer;">&times;</button>
          </div>
          <p style="margin: 0 0 1.25rem 0; color: #94a3b8; font-size: 0.9rem;">
            Create a new student account for your class roster. The student can immediately sign in using these credentials.
          </p>
          <form id="coach-register-student-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">Student Full Name</label>
              <input type="text" id="reg-student-name" placeholder="e.g. Maya Lin" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.65rem; border-radius: 8px; margin-top: 0.3rem; outline: none;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">Student Email Address</label>
              <input type="email" id="reg-student-email" placeholder="e.g. maya.lin@school.edu" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.65rem; border-radius: 8px; margin-top: 0.3rem; outline: none;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">Initial Password</label>
              <input type="password" id="reg-student-password" value="Student123!" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.65rem; border-radius: 8px; margin-top: 0.3rem; outline: none;" />
              <small style="color: #64748b; font-size: 0.78rem;">Default: Student123!</small>
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #cbd5e1; font-weight: 600;">Class Code / Group Name</label>
              <input type="text" id="reg-student-group" value="${this.selectedGroup === 'all' ? 'Climate Champions 7A' : this.selectedGroup}" required style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.65rem; border-radius: 8px; margin-top: 0.3rem; outline: none;" />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem;">
              <button type="button" id="cancel-reg-student-btn" style="background: #334155; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
              <button type="submit" id="submit-reg-student-btn" style="background: #10b981; color: #000; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 800; cursor: pointer;">✨ Create Student Account</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderCreateTaskModal() {
    return `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; items-center; justify-content: center; z-index: 2000; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #475569; border-radius: 20px; max-width: 500px; width: 100%; padding: 1.75rem;">
          <h3 style="margin: 0 0 1rem 0; color: #10b981; font-size: 1.3rem;">🗓️ Assign New Weekly Task</h3>
          <form id="new-weekly-task-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">Week Number</label>
              <input type="number" id="task-week-num" value="1" min="1" max="12" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem; border-radius: 8px; margin-top: 0.3rem;" required />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">Task Title</label>
              <input type="text" id="task-title-input" placeholder="e.g. Week 1: Optimize Solar Car Efficiency" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem; border-radius: 8px; margin-top: 0.3rem;" required />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">Target Activity</label>
              <select id="task-activity-select" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem; border-radius: 8px; margin-top: 0.3rem;">
                <option value="Solar Car">Solar Car Challenge</option>
                <option value="Urban Heat">Urban Heat Island</option>
                <option value="Bunker Survival">Bunker Survival</option>
                <option value="Micro:bit Coding">Micro:bit Coding</option>
                <option value="Bangkok Coastal">Bangkok Coastal</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">Target Metric / Goal</label>
              <input type="text" id="task-metric-input" placeholder="e.g. Reach Efficiency >= 12.0 W/kg" style="width: 100%; background: #0f172a; border: 1px solid #334155; color: white; padding: 0.6rem; border-radius: 8px; margin-top: 0.3rem;" required />
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
              <button type="button" id="cancel-task-btn" style="background: #334155; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
              <button type="submit" style="background: #10b981; color: #000; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 800; cursor: pointer;">Assign Task</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  addStyles() {
    if (!document.getElementById('coach-dashboard-styles')) {
      const style = document.createElement('style');
      style.id = 'coach-dashboard-styles';
      style.textContent = `
        .coach-tab-btn {
          background: none;
          border: none;
          color: #94a3b8;
          padding: 0.6rem 1.1rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .coach-tab-btn:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }
        .coach-tab-btn.active {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .student-card:hover {
          transform: translateY(-2px);
          border-color: #38bdf8 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  attachEvents() {
    this.container.querySelectorAll('.coach-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeTab = e.target.dataset.tab;
        this.render();
      });
    });

    const groupSelect = this.container.querySelector('#coach-group-select');
    if (groupSelect) {
      groupSelect.value = this.selectedGroup;
      groupSelect.addEventListener('change', (e) => {
        this.selectedGroup = e.target.value;
        this.render();
      });
    }

    const refreshBtn = this.container.querySelector('#coach-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.init();
      });
    }

    // 📦 Material Request Modal Handlers
    const openMatBtn = this.container.querySelector('#coach-open-material-modal-btn');
    if (openMatBtn) {
      openMatBtn.addEventListener('click', () => {
        this.showMaterialModal = true;
        this.render();
      });
    }

    const closeMatBtn = this.container.querySelector('#coach-close-material-modal-btn');
    if (closeMatBtn) {
      closeMatBtn.addEventListener('click', () => {
        this.showMaterialModal = false;
        this.render();
      });
    }

    const cancelMatBtn = this.container.querySelector('#coach-cancel-material-modal-btn');
    if (cancelMatBtn) {
      cancelMatBtn.addEventListener('click', () => {
        this.showMaterialModal = false;
        this.render();
      });
    }

    const matForm = this.container.querySelector('#coach-material-form');
    if (matForm) {
      matForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const item = this.container.querySelector('#mat-item-name')?.value || '';
        const category = this.container.querySelector('#mat-category')?.value || 'Classroom Supplies';
        const quantity = Number(this.container.querySelector('#mat-quantity')?.value) || 1;
        const estimatedCost = Number(this.container.querySelector('#mat-unit-cost')?.value) || 0;
        const reason = this.container.querySelector('#mat-reason')?.value || '';

        try {
          await createMaterialRequest({ item, category, quantity, estimatedCost, reason });
          this.showNotification(`Material request for "${item}" submitted to Administration!`);
          this.showMaterialModal = false;
          await this.loadData();
          this.render();
        } catch (err) {
          console.error('[Coach] Could not submit material request:', err);
          alert('Could not submit material request. Please try again.');
        }
      });
    }

    const searchInput = this.container.querySelector('#coach-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const content = this.container.querySelector('#coach-tab-content');
        if (content) {
          content.innerHTML = this.renderTabContent(this.getFilteredStudents());
          this.attachInspectEvents();
        }
      });
    }

    // 📅 ASSIGNMENT SYSTEM - Quick add button
    const assignmentBtns = this.container.querySelectorAll('[data-add-assignment]');
    assignmentBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const title = prompt('Assignment Title (e.g., "Solar Car Project Milestone"):');
        if (title) {
          const daysInput = prompt('Days until due (default 7):', '7');
          const days = parseInt(daysInput) || 7;
          const dueDate = new Date(Date.now() + days * 86400000).toLocaleDateString();

          const id = `assign_${Date.now()}`;
          const record = {
            id,
            title,
            dueDate,
            dueAt: Date.now() + days * 86400000,
            createdAt: Date.now(),
            coachId: this.coachUser?.uid || null,
            groupName: this.selectedGroup && this.selectedGroup !== 'all' ? this.selectedGroup : null,
            submittedCount: 0,
            totalStudents: this.students.length
          };

          try {
            await setDoc(doc(db, 'assignments', id), record);
            this.assignments.push(record);
            this.showNotification(`Assignment created: "${title}" — due ${dueDate}`);
          } catch (err) {
            console.error('[Coach] Failed to save assignment:', err);
            alert(`Could not save the assignment: ${err.code || err.message}\n\nIt has not been created.`);
            return;
          }
          this.render();
        }
      });
    });

    const exportBtn = this.container.querySelector('#export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportCSV();
      });
    }

    // Weekly Tasks Create Modal Trigger
    const createTaskBtn = this.container.querySelector('#create-task-btn');
    if (createTaskBtn) {
      createTaskBtn.addEventListener('click', () => {
        this.showNewTaskModal = true;
        this.render();
      });
    }

    const cancelTaskBtn = this.container.querySelector('#cancel-task-btn');
    if (cancelTaskBtn) {
      cancelTaskBtn.addEventListener('click', () => {
        this.showNewTaskModal = false;
        this.render();
      });
    }

    const newTaskForm = this.container.querySelector('#new-weekly-task-form');
    if (newTaskForm) {
      newTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const weekNum = parseInt(this.container.querySelector('#task-week-num').value, 10) || 1;
        const title = this.container.querySelector('#task-title-input').value;
        const targetActivity = this.container.querySelector('#task-activity-select').value;
        const targetMetric = this.container.querySelector('#task-metric-input').value;

        const newTask = {
          weekNumber: weekNum,
          title,
          targetActivity,
          targetMetric,
          groupName: this.selectedGroup || 'All Groups',
          createdAt: Date.now()
        };

        try {
          const docRef = doc(collection(db, 'weeklyTasks'));
          await setDoc(docRef, newTask);
          this.weeklyTasks.push({ id: docRef.id, ...newTask });
          alert('Weekly Task assigned successfully!');
        } catch (err) {
          this.weeklyTasks.push({ id: `wt_${Date.now()}`, ...newTask });
        }
        this.showNewTaskModal = false;
        this.render();
      });
    }

    // 🎒 Register Student Modal Event Listeners
    const regStudentBtn = this.container.querySelector('#coach-register-student-btn');
    if (regStudentBtn) {
      regStudentBtn.addEventListener('click', () => {
        this.showRegisterStudentModal = true;
        this.render();
      });
    }

    const closeRegStudentBtn = this.container.querySelector('#close-reg-student-btn');
    if (closeRegStudentBtn) {
      closeRegStudentBtn.addEventListener('click', () => {
        this.showRegisterStudentModal = false;
        this.render();
      });
    }

    const cancelRegStudentBtn = this.container.querySelector('#cancel-reg-student-btn');
    if (cancelRegStudentBtn) {
      cancelRegStudentBtn.addEventListener('click', () => {
        this.showRegisterStudentModal = false;
        this.render();
      });
    }

    const regStudentForm = this.container.querySelector('#coach-register-student-form');
    if (regStudentForm) {
      regStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = this.container.querySelector('#submit-reg-student-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '⏳ Creating Account...';
        }

        const name = this.container.querySelector('#reg-student-name').value.trim();
        const email = this.container.querySelector('#reg-student-email').value.trim();
        const password = this.container.querySelector('#reg-student-password').value;
        const groupName = this.container.querySelector('#reg-student-group').value.trim();

        try {
          const studentData = await registerStudentAccount(email, password, name, groupName);

          // Add student to local state
          const newStudentObj = {
            ...studentData,
            solarCar: { score: { total: 0 }, currentVersion: 1, weight: { total: 3200 }, components: { chassis: 'aluminum_frame', motor: 'brushed_dc' } },
            activityProgress: {},
            goals: [],
            dailyStats: [{ timeSpentMinutes: 0, sessionsCount: 1 }]
          };

          this.students.unshift(newStudentObj);
          logAuditEvent('STUDENT_REGISTERED_BY_COACH', { coachUid: this.coachUser?.uid, studentEmail: email, groupName });

          this.showRegisterStudentModal = false;
          this.render();
          this.showNotification(`✅ Student "${name}" (${email}) registered successfully!`);
        } catch (err) {
          console.error('[CoachDashboard] Registration failed:', err);
          alert('Failed to register student: ' + err.message);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '✨ Create Student Account';
          }
        }
      });
    }

    this.attachInspectEvents();
  }

  attachInspectEvents() {
    // Position reordering & activity preview buttons
    this.container.querySelectorAll('.pos-move-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const dir = btn.getAttribute('data-dir');
        if (dir === 'up' && idx > 0) {
          const temp = this.activityPositions[idx];
          this.activityPositions[idx] = this.activityPositions[idx - 1];
          this.activityPositions[idx - 1] = temp;
          this.render();
        } else if (dir === 'down' && idx < this.activityPositions.length - 1) {
          const temp = this.activityPositions[idx];
          this.activityPositions[idx] = this.activityPositions[idx + 1];
          this.activityPositions[idx + 1] = temp;
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.preview-act-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const phase = btn.getAttribute('data-phase');
        if (phase && typeof window.switchPhase === 'function') {
          window.isCoachPreviewingMode = true;
          window.switchPhase(phase, true);
        }
      });
    });

    // Student card / inspect button clicks - show student detail modal
    this.container.querySelectorAll('.inspect-btn, .student-card').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = el.getAttribute('data-uid');
        if (uid) {
          this.selectedStudent = this.students.find(s => s.uid === uid) || null;
          this.render();
        }
      });
    });

    // Goal feedback buttons - show feedback modal for specific goal
    this.container.querySelectorAll('.goal-feedback-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const studentId = btn.getAttribute('data-student-id');
        const student = this.students.find(s => s.uid === studentId);
        if (student) {
          this.selectedStudent = student;
          this.render();
        }
      });
    });

    // ⭐ RATING SYSTEM - Click stars to rate student work
    this.container.querySelectorAll('.student-rating').forEach(ratingEl => {
      const stars = ratingEl.innerHTML.split('').filter(c => c === '⭐' || c === '☆');
      ratingEl.style.cursor = 'pointer';

      ratingEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = ratingEl.getAttribute('data-uid');
        if (!uid) return;

        const rect = ratingEl.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starWidth = rect.width / 5;
        const rating = Math.ceil(clickX / starWidth);

        if (rating > 0 && rating <= 5) {
          this.studentRatings[uid] = rating;
          ratingEl.innerHTML = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
          ratingEl.style.color = rating >= 4 ? '#86efac' : rating >= 3 ? '#fde047' : '#fca5a5';

          try {
            const fbRef = doc(db, 'users', uid, 'feedback', `rating_${Date.now()}`);
            setDoc(fbRef, {
              coachId: this.coachUser?.uid || 'coach',
              coachName: this.coachUser?.displayName || 'Coach',
              rating: rating,
              timestamp: Date.now(),
              type: 'work_rating'
            }).catch(err => console.error('[Rating] Firestore error:', err));
          } catch (error) {
            console.log('[Rating] Saved locally:', rating, 'stars for', uid);
          }
        }
      });
    });

    const closeBtn = this.container.querySelector('#close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.selectedStudent = null;
        this.render();
      });
    }

    const saveFeedbackBtn = this.container.querySelector('#save-feedback-btn');
    if (saveFeedbackBtn && this.selectedStudent) {
      saveFeedbackBtn.addEventListener('click', async () => {
        const text = this.container.querySelector('#coach-feedback-text')?.value;
        if (!text) return;

        try {
          const fbRef = doc(db, 'users', this.selectedStudent.uid, 'feedback', `fb_${Date.now()}`);
          await setDoc(fbRef, {
            coachId: this.coachUser?.uid || 'coach',
            coachName: this.coachUser?.displayName || 'Coach',
            feedbackText: text,
            timestamp: Date.now()
          });
          alert(`Feedback sent successfully to ${this.selectedStudent.displayName}!`);
          this.selectedStudent = null;
          this.render();
        } catch (err) {
          alert('Failed to send feedback: ' + err.message);
        }
      });
    }
  }

  showNotification(message, duration = 3000) {
    const toast = this.container.querySelector('#notification-toast');
    if (toast) {
      toast.innerHTML = message;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, duration);
    }
  }

  sendNotificationToStudent(studentId, message) {
    try {
      const fbRef = doc(db, 'users', studentId, 'notifications', `notif_${Date.now()}`);
      setDoc(fbRef, {
        from: this.coachUser?.displayName || 'Coach',
        message: message,
        timestamp: Date.now(),
        read: false,
        type: 'coach_message'
      }).catch(err => console.log('[Notification] Error:', err));
      this.showNotification(`📧 Notification sent to ${studentId}`);
    } catch (error) {
      this.showNotification(`❌ Error: ${error.message}`);
    }
  }

  exportCSV() {
    const students = this.getFilteredStudents();
    // Quote every field and double any embedded quotes, so names containing a
    // comma or apostrophe cannot shift the column alignment in Excel.
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const columns = [
      'Student Name', 'Email', 'Group', 'Activities Started', 'Activities Completed',
      'Solar Car Score', 'Solar Car Version', 'Goals Set', 'Goals On Track',
      'Goals Achieved', 'Total Time Mins', 'Active Days', 'Last Active', 'Engagement Level'
    ];
    let csv = columns.join(',') + '\n';

    students.forEach(st => {
      let totalMins = 0;
      let lastActive = 0;
      st.dailyStats.forEach(ds => {
        totalMins += ds.timeSpentMinutes || 0;
        const ts = ds.lastActiveAt || Date.parse(ds.date) || 0;
        if (ts > lastActive) lastActive = ts;
      });

      const activities = Object.values(st.activityProgress || {});
      const completed = activities.filter(a => a && a.completed).length;
      const goals = st.goals || [];
      const onTrack = goals.filter(g => g.status === 'on_track').length;
      const achieved = goals.filter(g => g.status === 'achieved' || g.status === 'completed').length;

      const hasAnyData = totalMins > 0 || activities.length > 0 || goals.length > 0;
      const engagement = !hasAnyData ? 'No activity yet'
        : totalMins > 120 ? 'High' : totalMins > 60 ? 'Medium' : 'Low';

      csv += [
        q(st.displayName), q(st.email), q(st.groupName),
        activities.length, completed,
        st.solarCar?.score?.total ?? '', st.solarCar?.currentVersion ?? '',
        goals.length, onTrack, achieved,
        totalMins.toFixed(1),
        st.dailyStats.length,
        q(lastActive ? new Date(lastActive).toISOString().slice(0, 10) : 'never'),
        q(engagement)
      ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
}

export default CoachDashboard;
