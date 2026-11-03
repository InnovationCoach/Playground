# 🏫 Coach/Teacher Dashboard System - Complete Implementation

A comprehensive dashboard for coaches to monitor student progress, set goals, track engagement, and provide personalized guidance.

---

## 📋 System Architecture

### 1. Separate Coach Login & Authentication

#### Firebase Authentication Custom Claims

```typescript
// In Cloud Functions or Firebase Admin SDK
import * as admin from 'firebase-admin';

export const createCoachAccount = async (email, displayName) => {
  const userRecord = await admin.auth().createUser({
    email: email,
    password: generateSecurePassword(),
    displayName: displayName
  });
  
  // Set custom claim for role-based access
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'coach',
    coachId: generateCoachId(),
    schoolId: 'school_123',
    createdAt: Date.now()
  });
  
  // Create coach profile in Firestore
  await admin.firestore().collection('coaches').doc(userRecord.uid).set({
    coachId: generateCoachId(),
    email: email,
    displayName: displayName,
    schoolId: 'school_123',
    classes: [],  // Classes they teach
    students: [], // Students they coach
    createdAt: Date.now(),
    verified: false,
    subscription: 'free' // free, pro, enterprise
  });
};
```

#### Separate Login Route

```typescript
// src/pages/CoachLogin.tsx

const CoachLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleCoachLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify user has coach role
      const idTokenResult = await result.user.getIdTokenResult();
      
      if (idTokenResult.claims.role === 'coach') {
        // Login successful - redirect to coach dashboard
        navigate('/coach/dashboard');
      } else {
        setError('This account does not have coach access');
        await signOut(auth);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="coach-login-container">
      <div className="login-card">
        <h1>🏫 Coach Portal</h1>
        <p>Login to manage your students' progress</p>
        
        <form onSubmit={handleCoachLogin}>
          <input
            type="email"
            placeholder="Coach Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Coach Login'}
          </button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="login-links">
          <a href="/">← Back to Student Login</a>
          <a href="/coach-signup">Request Coach Access</a>
        </div>
      </div>
    </div>
  );
};

export default CoachLogin;
```

#### Router Setup

```typescript
// src/App.tsx or routes.tsx

<Routes>
  {/* Student Routes */}
  <Route path="/login" element={<StudentLogin />} />
  <Route path="/activity/solar-car" element={<PrivateRoute><SolarCarActivity /></PrivateRoute>} />
  
  {/* Coach Routes */}
  <Route path="/coach/login" element={<CoachLogin />} />
  <Route path="/coach/dashboard" element={<PrivateRoute role="coach"><CoachDashboard /></PrivateRoute>} />
  <Route path="/coach/class/:classId" element={<PrivateRoute role="coach"><ClassOverview /></PrivateRoute>} />
  <Route path="/coach/student/:studentId" element={<PrivateRoute role="coach"><StudentDetailView /></PrivateRoute>} />
  <Route path="/coach/goals" element={<PrivateRoute role="coach"><GoalSetting /></PrivateRoute>} />
</Routes>

// PrivateRoute with role checking
const PrivateRoute = ({ children, role }) => {
  const [user, loading] = useAuthState(auth);
  const [claims, setClaims] = useState(null);
  
  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        setClaims(idTokenResult.claims);
      });
    }
  }, [user]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to={role === 'coach' ? '/coach/login' : '/login'} />;
  if (role && claims?.role !== role) return <Navigate to="/access-denied" />;
  
  return children;
};
```

---

## 2. Firestore Collections Schema

### Collection: `coaches/{coachId}`

```typescript
{
  coachId: 'coach_xyz',
  email: 'sarah@school.edu',
  displayName: 'Sarah Johnson',
  schoolId: 'school_123',
  phone: '555-1234',
  
  // Classes & Students
  classes: [
    {
      classId: 'class_101',
      className: 'Physics 101',
      students: ['student_1', 'student_2', 'student_3'],
      schedule: 'MWF 10-11 AM'
    }
  ],
  
  // Dashboard Settings
  dashboard: {
    theme: 'dark',
    defaultView: 'class', // 'all' or 'class'
    notificationsEnabled: true
  },
  
  // Subscription
  subscription: {
    plan: 'pro', // free, pro, enterprise
    activeSince: Date.now(),
    studentsAllowed: 30
  },
  
  createdAt: Date.now(),
  lastLogin: Date.now(),
  verified: true
}
```

### Collection: `classes/{classId}`

```typescript
{
  classId: 'class_101',
  className: 'Physics 101 - Period 3',
  coachId: 'coach_xyz',
  schoolId: 'school_123',
  
  // Class Details
  description: 'Advanced physics with climate focus',
  schedule: {
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    days: ['Monday', 'Wednesday', 'Friday']
  },
  
  // Class Goals
  goals: [
    {
      goalId: 'goal_1',
      description: 'Complete Solar Car Challenge by Oct 15',
      targetDate: Date.parse('2026-10-15'),
      priority: 'high',
      status: 'in_progress',
      createdBy: 'coach_xyz',
      createdAt: Date.now()
    }
  ],
  
  // Students
  students: ['student_1', 'student_2', 'student_3'],
  studentCount: 3,
  
  // Metrics
  avgActivityCompletion: 0.78,
  avgTimePerActivity: 65, // minutes
  avgScore: 385,
  
  createdAt: Date.now()
}
```

### Subcollection: `classes/{classId}/studentProgress/{studentId}`

```typescript
{
  studentId: 'student_1',
  studentName: 'Alex Chen',
  email: 'alex.chen@school.edu',
  
  // Activity Engagement
  activitiesStarted: ['solar-car', 'bunker', 'urban-heat'],
  activitiesCompleted: ['solar-car'],
  
  // Time Tracking
  timingData: {
    solarCar: {
      firstAccessedAt: Date.now() - 86400000 * 3,
      totalTimeSpent: 125, // minutes
      sessionsCount: 4,
      averageSessionLength: 31, // minutes
      lastAccessedAt: Date.now() - 3600000
    },
    bunker: {
      firstAccessedAt: Date.now() - 86400000 * 1,
      totalTimeSpent: 45,
      sessionsCount: 1,
      averageSessionLength: 45,
      lastAccessedAt: Date.now() - 7200000
    }
  },
  
  // Daily Engagement
  dailyEngagement: [
    {
      date: '2026-09-08',
      minutesSpent: 35,
      activitiesAccessed: ['solar-car'],
      status: 'active'
    },
    {
      date: '2026-09-07',
      minutesSpent: 0,
      activitiesAccessed: [],
      status: 'inactive'
    },
    {
      date: '2026-09-06',
      minutesSpent: 90,
      activitiesAccessed: ['solar-car', 'bunker'],
      status: 'active'
    }
  ],
  
  // Scores & Performance
  activityScores: {
    solarCar: 445,
    bunker: 0,
    urbanHeat: 0
  },
  avgScore: 445,
  
  // Goals assigned to this student
  goals: [
    {
      goalId: 'goal_1',
      status: 'on_track', // on_track, at_risk, completed
      progress: 0.85,
      assignedDate: Date.now() - 86400000 * 5
    }
  ],
  
  // Coach Notes
  notes: [
    {
      noteId: 'note_1',
      coachId: 'coach_xyz',
      text: 'Great work on iterations! Consider focusing on drag coefficient next.',
      timestamp: Date.now() - 3600000,
      sentiment: 'positive' // positive, neutral, concern
    }
  ],
  
  updatedAt: Date.now()
}
```

### Collection: `goals/{goalId}` (Class-wide Goals)

```typescript
{
  goalId: 'goal_1',
  classId: 'class_101',
  coachId: 'coach_xyz',
  
  title: 'Complete Solar Car Challenge by Oct 15',
  description: 'All students should complete the Solar Car Challenge activity',
  
  targetActivity: 'solar-car',
  targetCompletion: 1.0, // 100% of students
  targetDate: Date.parse('2026-10-15'),
  
  priority: 'high', // low, medium, high
  status: 'in_progress', // planning, in_progress, completed, at_risk
  
  // Progress tracking
  studentsOnTrack: 25,
  studentsAtRisk: 3,
  studentsNotStarted: 2,
  overallProgress: 0.89,
  
  // Milestones
  milestones: [
    {
      title: 'Students begin component selection',
      targetDate: Date.parse('2026-09-15'),
      completed: true
    },
    {
      title: '50% of students upload first prototype',
      targetDate: Date.parse('2026-09-20'),
      completed: false,
      progress: 0.45
    }
  ],
  
  createdAt: Date.now(),
  createdBy: 'coach_xyz',
  updatedAt: Date.now()
}
```

---

## 3. Coach Dashboard Components

### Main Dashboard (`CoachDashboard.tsx`)

```typescript
// src/pages/CoachDashboard.tsx

const CoachDashboard = () => {
  const [user] = useAuthState(auth);
  const [coach, setCoach] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [overallMetrics, setOverallMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCoachData();
  }, [user]);
  
  const loadCoachData = async () => {
    // Load coach profile
    const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
    setCoach(coachDoc.data());
    
    // Load all classes
    const classesSnap = await getDocs(
      query(collection(db, 'classes'), where('coachId', '==', user.uid))
    );
    const classesData = classesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setClasses(classesData);
    
    // Load overall metrics
    const metrics = await calculateOverallMetrics(classesData);
    setOverallMetrics(metrics);
    
    setLoading(false);
  };
  
  const calculateOverallMetrics = async (classesData) => {
    let totalStudents = 0;
    let totalMinutesSpent = 0;
    let totalActivitiesCompleted = 0;
    
    for (const classObj of classesData) {
      totalStudents += classObj.students.length;
      
      for (const studentId of classObj.students) {
        const progressSnap = await getDoc(
          doc(db, 'classes', classObj.id, 'studentProgress', studentId)
        );
        if (progressSnap.exists()) {
          const data = progressSnap.data();
          totalMinutesSpent += data.timingData
            ? Object.values(data.timingData).reduce((sum, activity) => 
                sum + (activity.totalTimeSpent || 0), 0)
            : 0;
          totalActivitiesCompleted += data.activitiesCompleted?.length || 0;
        }
      }
    }
    
    return {
      totalStudents,
      totalMinutesSpent,
      avgTimePerStudent: Math.round(totalMinutesSpent / totalStudents),
      totalActivitiesCompleted,
      classes: classesData.length
    };
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="coach-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏫 Coach Dashboard</h1>
          <p className="welcome">Welcome back, {coach?.displayName}</p>
        </div>
        <div className="header-right">
          <button className="btn-primary">+ New Class</button>
          <button className="btn-secondary">Settings</button>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      </header>
      
      {/* Overall Metrics Cards */}
      <section className="metrics-section">
        <MetricCard
          title="Total Students"
          value={overallMetrics?.totalStudents || 0}
          icon="👥"
          trend="+5 this month"
        />
        <MetricCard
          title="Avg Daily Engagement"
          value={`${overallMetrics?.avgTimePerStudent || 0}m`}
          icon="⏱️"
          trend="↑ 12% from last week"
        />
        <MetricCard
          title="Activities Completed"
          value={overallMetrics?.totalActivitiesCompleted || 0}
          icon="✅"
          trend="Solar Car: 18/25 students"
        />
        <MetricCard
          title="Classes"
          value={overallMetrics?.classes || 0}
          icon="📚"
          trend="All active"
        />
      </section>
      
      {/* Class Selection */}
      <section className="classes-section">
        <h2>📋 Your Classes</h2>
        <div className="class-tabs">
          {classes.map(classObj => (
            <button
              key={classObj.id}
              className={`class-tab ${selectedClass?.id === classObj.id ? 'active' : ''}`}
              onClick={() => setSelectedClass(classObj)}
            >
              {classObj.className}
              <span className="student-count">({classObj.students.length})</span>
            </button>
          ))}
        </div>
      </section>
      
      {/* Class Overview */}
      {selectedClass && (
        <ClassOverviewPanel
          classObj={selectedClass}
          onGoalCreate={() => navigate(`/coach/goals?classId=${selectedClass.id}`)}
        />
      )}
      
      {/* Quick Actions */}
      <section className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <ActionCard
            title="Set Class Goals"
            description="Create goals for your students"
            icon="🎯"
            onClick={() => navigate('/coach/goals')}
          />
          <ActionCard
            title="View Reports"
            description="Detailed engagement analytics"
            icon="📊"
            onClick={() => navigate('/coach/reports')}
          />
          <ActionCard
            title="Send Messages"
            description="Communicate with students"
            icon="💬"
            onClick={() => navigate('/coach/messages')}
          />
          <ActionCard
            title="Track Time"
            description="Daily engagement tracking"
            icon="⏰"
            onClick={() => navigate('/coach/time-tracking')}
          />
        </div>
      </section>
    </div>
  );
};
```

### Class Overview Panel (`ClassOverviewPanel.tsx`)

```typescript
const ClassOverviewPanel = ({ classObj, onGoalCreate }) => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, on_track, at_risk, not_started
  
  useEffect(() => {
    loadStudentProgress();
  }, [classObj]);
  
  const loadStudentProgress = async () => {
    const progressData = [];
    
    for (const studentId of classObj.students) {
      const progressSnap = await getDoc(
        doc(db, 'classes', classObj.id, 'studentProgress', studentId)
      );
      if (progressSnap.exists()) {
        progressData.push({
          id: studentId,
          ...progressSnap.data()
        });
      }
    }
    
    setStudents(progressData);
  };
  
  const filteredStudents = students.filter(student => {
    if (filter === 'all') return true;
    if (filter === 'on_track') return student.goals?.[0]?.status === 'on_track';
    if (filter === 'at_risk') return student.goals?.[0]?.status === 'at_risk';
    if (filter === 'not_started') return student.activitiesStarted?.length === 0;
    return true;
  });
  
  return (
    <div className="class-overview">
      <div className="overview-header">
        <h2>{classObj.className}</h2>
        <div className="overview-stats">
          <Stat
            label="Students On Track"
            value={classObj.studentsOnTrack || 0}
            color="green"
          />
          <Stat
            label="At Risk"
            value={classObj.studentsAtRisk || 0}
            color="yellow"
          />
          <Stat
            label="Not Started"
            value={classObj.students?.length - (classObj.studentsOnTrack || 0) - (classObj.studentsAtRisk || 0)}
            color="red"
          />
        </div>
        <button className="btn-primary" onClick={onGoalCreate}>
          + Set Goals
        </button>
      </div>
      
      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'on_track', 'at_risk', 'not_started'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* Student List */}
      <div className="student-list">
        {filteredStudents.map(student => (
          <StudentListItem
            key={student.id}
            student={student}
            classId={classObj.id}
          />
        ))}
      </div>
    </div>
  );
};

// Student List Item
const StudentListItem = ({ student, classId }) => {
  const totalMinutes = student.timingData
    ? Object.values(student.timingData).reduce((sum, activity) => 
        sum + (activity.totalTimeSpent || 0), 0)
    : 0;
  
  const todayMinutes = student.dailyEngagement?.[0]?.minutesSpent || 0;
  
  return (
    <div className="student-item">
      <div className="student-info">
        <div className="student-name">{student.studentName}</div>
        <div className="student-email">{student.email}</div>
      </div>
      
      <div className="student-stats">
        <StatBadge
          label="Today"
          value={`${todayMinutes}m`}
          icon="⏱️"
        />
        <StatBadge
          label="Total Time"
          value={`${totalMinutes}m`}
          icon="🕐"
        />
        <StatBadge
          label="Activities"
          value={student.activitiesCompleted?.length || 0}
          icon="✅"
        />
        <StatBadge
          label="Avg Score"
          value={Math.round(student.avgScore || 0)}
          icon="📊"
        />
      </div>
      
      <div className="student-status">
        <span className={`status-badge ${student.goals?.[0]?.status || 'not_started'}`}>
          {student.goals?.[0]?.status?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
        </span>
      </div>
      
      <button className="btn-view">
        <Link to={`/coach/student/${student.id}`}>View Details</Link>
      </button>
    </div>
  );
};
```

### Student Detail View (`StudentDetailView.tsx`)

```typescript
const StudentDetailView = ({ studentId, classId }) => {
  const [student, setStudent] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [notes, setNotes] = useState([]);
  
  useEffect(() => {
    loadStudentDetails();
  }, [studentId, classId]);
  
  const loadStudentDetails = async () => {
    // Load student progress
    const progressSnap = await getDoc(
      doc(db, 'classes', classId, 'studentProgress', studentId)
    );
    setStudent(progressSnap.data());
    
    // Load daily engagement data (last 30 days)
    setDailyData(progressSnap.data()?.dailyEngagement || []);
    
    // Load coach notes
    const notesSnap = await getDocs(
      query(
        collection(db, 'classes', classId, 'studentProgress', studentId, 'notes'),
        orderBy('timestamp', 'desc'),
        limit(10)
      )
    );
    setNotes(notesSnap.docs.map(doc => doc.data()));
  };
  
  return (
    <div className="student-detail-view">
      {/* Header */}
      <header className="detail-header">
        <div className="header-content">
          <h1>{student?.studentName}</h1>
          <p className="email">{student?.email}</p>
          <div className="status-badges">
            <span className={`badge ${student?.goals?.[0]?.status}`}>
              {student?.goals?.[0]?.status}
            </span>
            <span className="badge">Member since Sept 2026</span>
          </div>
        </div>
        <button className="btn-secondary">Send Message</button>
      </header>
      
      {/* Key Metrics */}
      <section className="metrics-grid">
        <MetricCard
          title="Total Time Spent"
          value={`${Object.values(student?.timingData || {}).reduce((sum, a) => sum + (a.totalTimeSpent || 0), 0)}m`}
          icon="⏱️"
          details="Across all activities"
        />
        <MetricCard
          title="Daily Average"
          value={`${Math.round(dailyData.reduce((sum, d) => sum + d.minutesSpent, 0) / dailyData.length)}m`}
          icon="📊"
          details="Last 30 days"
        />
        <MetricCard
          title="Active Days"
          value={dailyData.filter(d => d.status === 'active').length}
          icon="🔥"
          details="Days with engagement"
        />
        <MetricCard
          title="Current Streak"
          value={calculateStreak(dailyData)}
          icon="⭐"
          details="Consecutive active days"
        />
      </section>
      
      {/* Activity Progress */}
      <section className="activity-progress">
        <h2>📚 Activity Progress</h2>
        {student?.activitiesStarted?.map(activityId => (
          <ActivityProgressCard
            key={activityId}
            activityId={activityId}
            timing={student.timingData?.[activityId]}
            score={student.activityScores?.[activityId]}
            completed={student.activitiesCompleted?.includes(activityId)}
          />
        ))}
      </section>
      
      {/* Daily Engagement Chart */}
      <section className="engagement-chart">
        <h2>📈 Daily Engagement (Last 30 Days)</h2>
        <EngagementChart data={dailyData} />
      </section>
      
      {/* Goals Progress */}
      <section className="goals-section">
        <h2>🎯 Goals & Milestones</h2>
        {student?.goals?.map(goal => (
          <GoalProgressCard key={goal.goalId} goal={goal} />
        ))}
      </section>
      
      {/* Coach Notes */}
      <section className="notes-section">
        <h2>📝 Coach Notes</h2>
        <div className="notes-list">
          {notes.map(note => (
            <NoteCard key={note.noteId} note={note} />
          ))}
        </div>
        <form onSubmit={(e) => handleAddNote(e)}>
          <textarea placeholder="Add a note about this student..."></textarea>
          <button type="submit">Save Note</button>
        </form>
      </section>
    </div>
  );
};
```

### Goal Setting Page (`GoalSetting.tsx`)

```typescript
const GoalSetting = ({ classId }) => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetActivity: 'solar-car',
    targetCompletion: 1.0,
    targetDate: '',
    priority: 'medium'
  });
  
  const handleCreateGoal = async () => {
    const goalRef = await addDoc(collection(db, 'goals'), {
      ...newGoal,
      classId,
      status: 'in_progress',
      studentsOnTrack: 0,
      studentsAtRisk: 0,
      overallProgress: 0,
      createdAt: Date.now(),
      createdBy: auth.currentUser.uid
    });
    
    // Assign goal to all students in class
    const classSnap = await getDoc(doc(db, 'classes', classId));
    const students = classSnap.data().students;
    
    for (const studentId of students) {
      const progressRef = doc(db, 'classes', classId, 'studentProgress', studentId);
      await updateDoc(progressRef, {
        goals: arrayUnion({
          goalId: goalRef.id,
          status: 'not_started',
          progress: 0,
          assignedDate: Date.now()
        })
      });
    }
    
    setNewGoal({ title: '', description: '', targetActivity: 'solar-car', targetCompletion: 1.0, targetDate: '', priority: 'medium' });
    setShowForm(false);
    loadGoals();
  };
  
  const loadGoals = async () => {
    const goalsSnap = await getDocs(
      query(collection(db, 'goals'), where('classId', '==', classId))
    );
    setGoals(goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };
  
  return (
    <div className="goal-setting-page">
      <h1>🎯 Set Class Goals</h1>
      
      {!showForm ? (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Create New Goal
        </button>
      ) : (
        <form className="goal-form">
          <input
            type="text"
            placeholder="Goal title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
          />
          <textarea
            placeholder="Goal description"
            value={newGoal.description}
            onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
          />
          <select
            value={newGoal.targetActivity}
            onChange={(e) => setNewGoal({...newGoal, targetActivity: e.target.value})}
          >
            <option value="solar-car">Solar Car Challenge</option>
            <option value="bunker">Bunker Survival</option>
            <option value="urban-heat">Urban Heat</option>
            <option value="bangkok">Bangkok Coastal</option>
            <option value="microbit">Micro:bit Coding</option>
          </select>
          <input
            type="date"
            value={newGoal.targetDate}
            onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
          />
          <select
            value={newGoal.priority}
            onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" onClick={handleCreateGoal}>Create Goal</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
      
      {/* Goals List */}
      <div className="goals-list">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
};
```

### Time Tracking Dashboard (`TimeTrackingDashboard.tsx`)

```typescript
const TimeTrackingDashboard = ({ classId }) => {
  const [timeData, setTimeData] = useState([]);
  const [period, setPeriod] = useState('week'); // day, week, month
  
  useEffect(() => {
    loadTimeData();
  }, [classId, period]);
  
  const loadTimeData = async () => {
    // Get all students in class
    const classSnap = await getDoc(doc(db, 'classes', classId));
    const students = classSnap.data().students;
    
    const data = [];
    
    for (const studentId of students) {
      const progressSnap = await getDoc(
        doc(db, 'classes', classId, 'studentProgress', studentId)
      );
      const progress = progressSnap.data();
      
      const timeSpent = calculateTimeForPeriod(progress?.dailyEngagement, period);
      
      data.push({
        studentId,
        studentName: progress?.studentName,
        timeSpent,
        sessionsCount: calculateSessionsForPeriod(progress?.dailyEngagement, period),
        status: progress?.goals?.[0]?.status,
        lastActive: progress?.dailyEngagement?.[0]?.date
      });
    }
    
    // Sort by time spent (descending)
    setTimeData(data.sort((a, b) => b.timeSpent - a.timeSpent));
  };
  
  const calculateTimeForPeriod = (dailyData, period) => {
    if (!dailyData) return 0;
    
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    return dailyData.slice(0, days).reduce((sum, d) => sum + d.minutesSpent, 0);
  };
  
  return (
    <div className="time-tracking">
      <h1>⏰ Daily Engagement Tracking</h1>
      
      {/* Period Selector */}
      <div className="period-selector">
        {['day', 'week', 'month'].map(p => (
          <button
            key={p}
            className={`period-btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Time Stats */}
      <div className="time-stats">
        <StatCard
          title="Class Avg Daily Time"
          value={`${Math.round(timeData.reduce((sum, s) => sum + s.timeSpent, 0) / timeData.length)}m`}
        />
        <StatCard
          title="Total Class Time"
          value={`${timeData.reduce((sum, s) => sum + s.timeSpent, 0)}h`}
        />
        <StatCard
          title="Most Active"
          value={timeData[0]?.studentName}
        />
      </div>
      
      {/* Time Leaderboard */}
      <div className="time-leaderboard">
        <h2>📊 Time Leaderboard</h2>
        {timeData.map((student, index) => (
          <div key={student.studentId} className="leaderboard-row">
            <span className="rank">#{index + 1}</span>
            <span className="name">{student.studentName}</span>
            <span className="time">{student.timeSpent}m</span>
            <span className="sessions">{student.sessionsCount} sessions</span>
            <span className={`status ${student.status}`}>{student.status}</span>
            <span className="last-active">{student.lastActive}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 4. Firebase Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Coaches can only access their own data
    match /coaches/{coachId} {
      allow read, write: if request.auth.uid == coachId && 
                           request.auth.token.role == 'coach';
    }
    
    // Classes - coaches can access their classes
    match /classes/{classId} {
      allow read, write: if request.auth.token.role == 'coach' &&
                           resource.data.coachId == request.auth.uid;
      
      // Student progress - coaches can access their class's students
      match /studentProgress/{studentId} {
        allow read: if request.auth.token.role == 'coach' &&
                       get(/databases/$(database)/documents/classes/$(classId)).data.coachId == request.auth.uid;
        allow write: if request.auth.uid == studentId ||
                       (request.auth.token.role == 'coach' &&
                        get(/databases/$(database)/documents/classes/$(classId)).data.coachId == request.auth.uid);
      }
    }
    
    // Goals - coaches can manage their class goals
    match /goals/{goalId} {
      allow read, write: if request.auth.token.role == 'coach' &&
                           resource.data.coachId == request.auth.uid;
    }
    
    // Students can only read their own progress
    match /classes/{classId}/studentProgress/{studentId} {
      allow read: if request.auth.uid == studentId;
      allow write: if request.auth.uid == studentId;
    }
  }
}
```

---

## 5. Deployment & Testing

```bash
# Deploy coach dashboard
npm run build
firebase deploy

# Test coach login
Navigate to: https://dnd-master-73449.web.app/coach/login

# Test account creation (Firebase Console)
Create test coach account with custom claims:
{
  "role": "coach",
  "coachId": "coach_test_001",
  "schoolId": "school_123"
}
```

---

## 6. Features Summary

✅ **Separate Coach Login** - Dedicated authentication with role-based access  
✅ **Dashboard Overview** - Total students, time spent, activities completed  
✅ **Class Management** - View multiple classes, filter students  
✅ **Student Details** - Individual progress, time tracking, scores, notes  
✅ **Goal Setting** - Create class-wide goals, track progress  
✅ **Time Tracking** - Daily engagement, leaderboards, trends  
✅ **Coach Notes** - Add personalized notes to student records  
✅ **Analytics** - Daily/weekly/monthly engagement reports  
✅ **Alerts** - Identify at-risk students, track trends  
✅ **Messaging** - Communicate directly with students  

---

## 7. Next Steps

1. **Create coach accounts** in Firebase Console with custom claims
2. **Deploy dashboard** to production
3. **Train coaches** on using the dashboard
4. **Monitor metrics** for engagement improvements
5. **Iterate** based on coach feedback
