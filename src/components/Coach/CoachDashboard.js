/**
 * Full-Featured Coach & Teacher Dashboard
 * View registered student work progress across activities,
 * assign weekly tasks, monitor goal achievements, & send feedback.
 */

import { db, collection, getDocs, doc, setDoc, updateDoc, arrayUnion } from '../../firebase.js';

export class CoachDashboard {
  constructor(options = {}) {
    this.containerId = options.containerId || 'coach-dashboard-container';
    this.coachUser = options.coachUser || null;
    this.container = document.getElementById(this.containerId);

    this.activeTab = 'work'; // 'work' | 'activities' | 'goals'
    this.selectedGroup = 'all';
    this.searchQuery = '';

    this.students = [];
    this.allPrototypes = [];
    this.allGoals = [];
    this.allTimeStats = [];
    this.weeklyTasks = [];

    this.activityPositions = [
      { id: 'urban-heat', phase: 'phase1', position: 1, title: 'Activity 1: Urban Heat Battle', category: 'Climate & Urban', difficulty: 'Beginner', targetSkill: 'EV Evapotranspiration & UTCI Index', activeStudents: 12, avgMetric: '2.85°C cooling', totalHours: 18.5 },
      { id: 'bunker', phase: 'bunker', position: 2, title: 'Activity 2: Bunker Survival Engineering', category: 'Disaster Survival', difficulty: 'Intermediate', targetSkill: 'NBC Filtration & Structural Steel', activeStudents: 10, avgMetric: '88/100 score', totalHours: 14.2 },
      { id: 'microbit', phase: 'coding', position: 3, title: 'Activity 3: Micro:bit Python Simulator', category: 'MicroPython Coding', difficulty: 'Beginner', targetSkill: 'PWM Servo & 5x5 LED Matrix', activeStudents: 14, avgMetric: '450 XP avg', totalHours: 22.0 },
      { id: 'bangkok', phase: 'bangkok', position: 4, title: 'Activity 4: Bangkok Coastal Challenge', category: 'Coastal Disaster', difficulty: 'Intermediate', targetSkill: 'Binary Decryption & Surge Physics', activeStudents: 9, avgMetric: '92/100 score', totalHours: 11.8 },
      { id: 'solar-car', phase: 'solar', position: 5, title: 'Activity 5: Solar Car Challenge', category: 'Solar STEM Engineering', difficulty: 'Advanced', targetSkill: 'BLDC Aerodynamics & Drag Factor', activeStudents: 15, avgMetric: '410 pts avg', totalHours: 32.5 }
    ];

    this.selectedStudent = null;
    this.showNewTaskModal = false;
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

  async loadData() {
    try {
      // 1. Fetch Students & nested data
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedStudents = [];
      const fetchedGoals = [];
      const fetchedStats = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (userData.role === 'teacher') continue;

        const userId = userDoc.id;
        const studentObj = {
          uid: userId,
          displayName: userData.displayName || userData.email?.split('@')[0] || 'Student',
          email: userData.email || '',
          groupName: userData.groupName || 'Climate Champions 7A',
          createdAt: userData.createdAt || Date.now(),
          solarCar: null,
          activityProgress: {},
          goals: [],
          dailyStats: []
        };

        // Fetch user goals
        try {
          const goalsSnap = await getDocs(collection(db, 'users', userId, 'goals'));
          goalsSnap.forEach(gDoc => {
            const gData = { id: gDoc.id, studentId: userId, studentName: studentObj.displayName, ...gDoc.data() };
            studentObj.goals.push(gData);
            fetchedGoals.push(gData);
          });
        } catch (e) {}

        // Fetch user daily stats
        try {
          const statsSnap = await getDocs(collection(db, 'users', userId, 'dailyStats'));
          statsSnap.forEach(sDoc => {
            const sData = { date: sDoc.id, studentId: userId, studentName: studentObj.displayName, ...sDoc.data() };
            studentObj.dailyStats.push(sData);
            fetchedStats.push(sData);
          });
        } catch (e) {}

        // Fetch activity progress
        try {
          const actSnap = await getDocs(collection(db, 'users', userId, 'activityProgress'));
          actSnap.forEach(aDoc => {
            studentObj.activityProgress[aDoc.id] = aDoc.data();
          });
        } catch (e) {}

        fetchedStudents.push(studentObj);
      }

      if (fetchedStudents.length === 0) {
        fetchedStudents.push(
          {
            uid: 'student_test_1',
            displayName: 'Alex Test Student',
            email: 'alex.test@school.edu',
            groupName: 'Climate Champions 7A',
            createdAt: Date.now() - 86400000 * 7,
            solarCar: { score: { total: 445 }, currentVersion: 4, weight: { total: 2900 }, components: { chassis: 'carbon_tube', motor: 'bldc' } },
            activityProgress: { 'urban-heat': true, 'bunker': true, 'solar-car': true },
            goals: [{ title: 'Solar Car Efficiency Target', targetMetric: 'Reach 15.0 W/kg', status: 'on_track' }],
            dailyStats: [{ timeSpentMinutes: 125, sessionsCount: 6 }]
          },
          {
            uid: 'student_test_2',
            displayName: 'Jordan Student',
            email: 'jordan.test@school.edu',
            groupName: 'Climate Champions 7A',
            createdAt: Date.now() - 86400000 * 5,
            solarCar: { score: { total: 380 }, currentVersion: 3, weight: { total: 3100 }, components: { chassis: 'aluminum_frame', motor: 'brushed_dc' } },
            activityProgress: { 'bunker': true, 'microbit': true },
            goals: [{ title: 'Bunker Survival Challenge', targetMetric: 'Survival score >= 80', status: 'completed' }],
            dailyStats: [{ timeSpentMinutes: 95, sessionsCount: 4 }]
          },
          {
            uid: 'student_test_3',
            displayName: 'Taylor Student',
            email: 'taylor.test@school.edu',
            groupName: 'Eco-Designers 8B',
            createdAt: Date.now() - 86400000 * 3,
            solarCar: { score: { total: 410 }, currentVersion: 5, weight: { total: 3000 }, components: { chassis: 'carbon_tube', motor: 'bldc' } },
            activityProgress: { 'urban-heat': true, 'bangkok': true },
            goals: [{ title: 'Bangkok Evacuation Decryption', targetMetric: 'Decode binary alert in < 3 mins', status: 'on_track' }],
            dailyStats: [{ timeSpentMinutes: 110, sessionsCount: 5 }]
          },
          {
            uid: 'student_test_4',
            displayName: 'Sam Climate Student',
            email: 'sam.climate@school.edu',
            groupName: 'Green Tech 9C',
            createdAt: Date.now() - 86400000 * 2,
            solarCar: { score: { total: 425 }, currentVersion: 3, weight: { total: 2950 }, components: { chassis: 'aluminum_frame', motor: 'bldc' } },
            activityProgress: { 'urban-heat': true, 'bunker': true, 'microbit': true, 'bangkok': true, 'solar-car': true },
            goals: [{ title: 'Master All 5 Missions', targetMetric: 'Complete 100% curriculum', status: 'on_track' }],
            dailyStats: [{ timeSpentMinutes: 160, sessionsCount: 8 }]
          }
        );
      }

      this.students = fetchedStudents;
      this.allGoals = fetchedGoals;
      this.allTimeStats = fetchedStats;

      // 2. Fetch Solar Car Prototypes
      try {
        const protoSnap = await getDocs(collection(db, 'solarCar_prototypes'));
        this.allPrototypes = protoSnap.docs.map(d => d.data());

        this.students.forEach(st => {
          const proto = this.allPrototypes.find(p => p.userId === st.uid);
          if (proto) st.solarCar = proto;
        });
      } catch (e) {}

      // 3. Fetch Weekly Tasks
      try {
        const tasksSnap = await getDocs(collection(db, 'weeklyTasks'));
        this.weeklyTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        this.weeklyTasks = [
          { id: 'wt_1', weekNumber: 1, title: 'Week 1: Solar Car Weight & Efficiency Goal', targetActivity: 'Solar Car', targetMetric: 'Efficiency >= 12.0 W/kg', groupName: 'All Groups', createdAt: Date.now() },
          { id: 'wt_2', weekNumber: 2, title: 'Week 2: Urban Heat Island Cooling Milestone', targetActivity: 'Urban Heat', targetMetric: 'Cooling Achieved >= 2.0°C', groupName: 'Climate Champions 7A', createdAt: Date.now() },
          { id: 'wt_3', weekNumber: 3, title: 'Week 3: Subterranean Bunker Survival Challenge', targetActivity: 'Bunker Survival', targetMetric: 'Survival Score >= 80/100', groupName: 'All Groups', createdAt: Date.now() }
        ];
      }

    } catch (err) {
      console.error('[CoachDashboard] Failed to load data:', err);
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

  render() {
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: #1e293b; padding: 1.5rem 2rem; border-radius: 16px; border: 1px solid #334155;">
            <div>
              <h1 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem;">
                🍎 Coach Dashboard
              </h1>
              <p style="margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.95rem;">
                Monitor student progress, current activities, and learning goals
              </p>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <select id="coach-group-select" style="background: #0f172a; color: white; border: 1px solid #475569; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600;">
                <option value="all">🌐 All Classes & Groups</option>
                <option value="Climate Champions 7A">Climate Champions 7A</option>
                <option value="Eco-Designers 8B">Eco-Designers 8B</option>
                <option value="Green Tech 9C">Green Tech 9C</option>
              </select>
              <button id="coach-refresh-btn" style="background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                🔄 Refresh
              </button>
            </div>
          </div>

          <!-- Top Overview Analytics Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #311b92 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #4c1d95;">
              <p style="margin: 0; color: #a78bfa; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">👥 Students</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: white;">${totalStudents}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #059669;">
              <p style="margin: 0; color: #6ee7b7; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">🎯 With Goals</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #a7f3d0;">${this.allGoals.length > 0 ? Math.ceil(this.allGoals.length / 2) : 0}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #d97706;">
              <p style="margin: 0; color: #fde68a; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">📊 Active Projects</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #fef08a;">${Object.keys(this.allPrototypes).length || 0}</h2>
            </div>
            <div style="background: linear-gradient(135deg, #7c2d12 0%, #b45309 100%); padding: 1.25rem; border-radius: 12px; border: 1px solid #ea580c;">
              <p style="margin: 0; color: #fed7aa; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">📅 Assignments</p>
              <h2 style="margin: 0.5rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #ffedd5;" id="assignment-count">0</h2>
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
    }
    return this.renderWorkTab(students); // Default to work tab
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

    return `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; items-center; justify-content: center; z-index: 2000; padding: 1rem;">
        <div style="background: #1e293b; border: 1px solid #475569; border-radius: 20px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">

          <!-- Modal Header -->
          <div style="background: #0f172a; padding: 1.5rem 2rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; sticky top: 0;">
            <div>
              <h2 style="margin: 0; color: white; font-size: 1.4rem;">${student.displayName}'s Activity Progress</h2>
              <p style="margin: 0.2rem 0 0 0; color: #94a3b8; font-size: 0.85rem;">Group: ${student.groupName} | Email: ${student.email}</p>
            </div>
            <button id="close-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 1.8rem; cursor: pointer;">&times;</button>
          </div>

          <div style="padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">

            <!-- Solar Car Specs -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h3 style="margin: 0 0 1rem 0; color: #38bdf8; font-size: 1.1rem;">☀️ Solar Car Telemetry & Specs</h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
                <div style="background: #1e293b; padding: 0.75rem; border-radius: 8px;">
                  <span style="font-size: 0.75rem; color: #94a3b8;">Total Score</span>
                  <p style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #fbbf24;">${score}</p>
                </div>
                <div style="background: #1e293b; padding: 0.75rem; border-radius: 8px;">
                  <span style="font-size: 0.75rem; color: #94a3b8;">Iterations</span>
                  <p style="margin: 0; font-size: 1.2rem; font-weight: 800; color: white;">v${version}</p>
                </div>
                <div style="background: #1e293b; padding: 0.75rem; border-radius: 8px;">
                  <span style="font-size: 0.75rem; color: #94a3b8;">Weight</span>
                  <p style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #34d399;">${weight}kg</p>
                </div>
                <div style="background: #1e293b; padding: 0.75rem; border-radius: 8px;">
                  <span style="font-size: 0.75rem; color: #94a3b8;">Drag Coeff.</span>
                  <p style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #a78bfa;">0.05</p>
                </div>
              </div>

              <div style="margin-top: 1rem; background: #1e293b; padding: 1rem; border-radius: 8px; font-size: 0.9rem;">
                <p style="margin: 0; color: #94a3b8;">Chosen Components:</p>
                <p style="margin: 0.2rem 0 0 0; color: white; font-weight: 600;">
                  Chassis: <span style="color: #38bdf8;">${components.chassis}</span> | Motor: <span style="color: #34d399;">${components.motor}</span> | Panel: <span style="color: #fbbf24;">${components.solarPanel}</span>
                </p>
              </div>
            </div>

            <!-- Student Goals & Self-Reflection -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h3 style="margin: 0 0 1rem 0; color: #a78bfa; font-size: 1.1rem;">🎯 Student Goals (${student.goals.length})</h3>
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

            <!-- Teacher Feedback Box -->
            <div style="background: #0f172a; padding: 1.25rem; border-radius: 12px; border: 1px solid #334155;">
              <h3 style="margin: 0 0 0.5rem 0; color: #fbbf24; font-size: 1.1rem;">💬 Provide Coach Feedback</h3>
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
      btn.addEventListener('click', () => {
        const title = prompt('Assignment Title (e.g., "Solar Car Project Milestone"):');
        if (title) {
          const daysInput = prompt('Days until due (default 7):', '7');
          const days = parseInt(daysInput) || 7;
          const dueDate = new Date(Date.now() + days * 86400000).toLocaleDateString();

          this.assignments.push({
            id: `assign_${Date.now()}`,
            title: title,
            dueDate: dueDate,
            createdAt: new Date().toLocaleDateString(),
            submittedCount: 0,
            totalStudents: this.students.length
          });

          alert(`✅ Assignment created: "${title}" due ${dueDate}`);
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
    let csv = 'Student Name,Email,Group,Solar Car Score,Version,Total Time Mins,Engagement Level\n';
    students.forEach(st => {
      let totalMins = 0;
      st.dailyStats.forEach(ds => totalMins += ds.timeSpentMinutes || 0);
      const score = st.solarCar?.score?.total || 0;
      const ver = st.solarCar?.currentVersion || 1;
      const engagement = totalMins > 120 ? 'High' : totalMins > 60 ? 'Medium' : 'Low';
      csv += `"${st.displayName}","${st.email}","${st.groupName}",${score},${ver},${totalMins.toFixed(1)},"${engagement}"\n`;
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
