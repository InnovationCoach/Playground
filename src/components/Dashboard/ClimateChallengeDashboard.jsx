import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './ClimateChallengeDashboard.css';

export function ClimateChallengeDashboard() {
  const [userStats, setUserStats] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [nextChallenge, setNextChallenge] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, challenges, leaderboard, stats

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Load user stats
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        setUserStats(userData?.stats || {});
        setLearningPath(userData?.learningPath);

        // Load leaderboard data (top 10)
        const leaderboardQuery = query(
          collection(db, 'leaderboards', 'climate', 'scores'),
          orderBy('points', 'desc'),
          limit(10)
        );
        const leaderboardSnap = await getDocs(leaderboardQuery);
        setLeaderboard(
          leaderboardSnap.docs.map((doc, idx) => ({
            rank: idx + 1,
            ...doc.data()
          }))
        );

        // Load achievements (mock data for now)
        loadAchievements();

        // Set next challenge
        setNextChallenge({
          id: 'urban-heat-2',
          title: 'Bunker Survival Design',
          difficulty: 'Intermediate',
          estimatedTime: '45 min',
          progress: 40,
          description: 'Can you design a bunker that survives extreme heat?'
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const loadAchievements = () => {
    setAchievements([
      { id: 1, name: '🌱 First Challenge', description: 'Complete your first challenge', unlocked: true },
      { id: 2, name: '🔥 Heat Master', description: 'Score 80+ on Urban Heat Challenge', unlocked: true },
      { id: 3, name: '🏆 Top 10', description: 'Reach top 10 on leaderboard', unlocked: false },
      { id: 4, name: '⚡ Speed Runner', description: 'Complete a challenge in under 10 minutes', unlocked: false }
    ]);
  };

  if (loading) {
    return <div className="dashboard-loading">Loading your climate dashboard...</div>;
  }

  return (
    <div className="climate-dashboard" data-path="climate">
      {/* Header */}
      <div className="dashboard-header climate-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🌍 Climate Challenge Hub</h1>
            <p>Learn environmental science through interactive simulations</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{userStats?.totalPoints || 0}</div>
              <div className="stat-label">Total Points</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats?.currentStreak || 0}</div>
              <div className="stat-label">Day Streak 🔥</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{userStats?.completedChallenges || 0}</div>
              <div className="stat-label">Challenges Done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          🎮 Challenges
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 My Stats
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            {/* Learning Path Progress */}
            <section className="dashboard-section">
              <h2>📚 Your Learning Path</h2>
              <div className="path-progress">
                <div className="path-item">
                  <div className="path-status completed">✅</div>
                  <div className="path-info">
                    <h3>Urban Heat Crisis</h3>
                    <p>Beginner • Completed 3 days ago</p>
                  </div>
                  <button className="btn-review">Review</button>
                </div>

                <div className="path-item active">
                  <div className="path-status in-progress">🟡</div>
                  <div className="path-info">
                    <h3>Bunker Survival Design</h3>
                    <p>Intermediate • Started 2 days ago</p>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '40%' }}></div>
                    </div>
                    <small>40% Complete</small>
                  </div>
                  <button className="btn-continue">Continue →</button>
                </div>

                <div className="path-item locked">
                  <div className="path-status locked">🔒</div>
                  <div className="path-info">
                    <h3>Bangkok Coastal Resilience</h3>
                    <p>Expert • Unlock after Bunker challenge</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recommended Next */}
            {nextChallenge && (
              <section className="dashboard-section">
                <h2>🎯 Continue Your Journey</h2>
                <div className="challenge-card featured">
                  <div className="challenge-icon">🏢</div>
                  <div className="challenge-info">
                    <h3>{nextChallenge.title}</h3>
                    <p className="challenge-desc">{nextChallenge.description}</p>
                    <div className="challenge-meta">
                      <span className="badge badge-difficulty">{nextChallenge.difficulty}</span>
                      <span className="badge badge-time">⏱ {nextChallenge.estimatedTime}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${nextChallenge.progress}%` }}></div>
                    </div>
                    <small>{nextChallenge.progress}% Complete</small>
                  </div>
                  <button className="btn-launch">Launch Challenge →</button>
                </div>
              </section>
            )}

            {/* Recent Achievements */}
            <section className="dashboard-section">
              <h2>🏅 Your Achievements</h2>
              <div className="achievements-grid">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{ach.name.split(' ')[0]}</div>
                    <h4>{ach.name}</h4>
                    <p>{ach.description}</p>
                    {!ach.unlocked && <div className="lock-badge">🔒</div>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <h2>🎮 All Challenges</h2>
              <div className="challenges-list">
                {[
                  { id: 1, title: 'Urban Heat Crisis', difficulty: 'Beginner', status: 'completed', score: 95 },
                  { id: 2, title: 'Bunker Survival Design', difficulty: 'Intermediate', status: 'in-progress', score: 72 },
                  { id: 3, title: 'Bangkok Coastal Resilience', difficulty: 'Expert', status: 'locked', score: null }
                ].map((challenge) => (
                  <div key={challenge.id} className={`challenge-list-item ${challenge.status}`}>
                    <div className="item-status">
                      {challenge.status === 'completed' && '✅'}
                      {challenge.status === 'in-progress' && '🟡'}
                      {challenge.status === 'locked' && '🔒'}
                    </div>
                    <div className="item-info">
                      <h4>{challenge.title}</h4>
                      <span className="badge">{challenge.difficulty}</span>
                    </div>
                    {challenge.score !== null && (
                      <div className="item-score">Score: {challenge.score}%</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <h2>🏆 Global Leaderboard</h2>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Challenges</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry) => (
                      <tr key={entry.rank} className={entry.userId === auth.currentUser?.uid ? 'current-user' : ''}>
                        <td className="rank-cell">
                          {entry.rank === 1 && '🥇'}
                          {entry.rank === 2 && '🥈'}
                          {entry.rank === 3 && '🥉'}
                          {entry.rank > 3 && entry.rank}
                        </td>
                        <td>{entry.displayName || 'Anonymous'}</td>
                        <td className="points-cell">{entry.points || 0}</td>
                        <td>{entry.challengesCompleted || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>
                        No scores yet. Be the first!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <h2>📈 Your Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card-large">
                  <h3>Total Points</h3>
                  <div className="stat-big">{userStats?.totalPoints || 0}</div>
                </div>
                <div className="stat-card-large">
                  <h3>Challenges Completed</h3>
                  <div className="stat-big">{userStats?.completedChallenges || 0}</div>
                </div>
                <div className="stat-card-large">
                  <h3>Current Streak</h3>
                  <div className="stat-big">{userStats?.currentStreak || 0} 🔥</div>
                </div>
                <div className="stat-card-large">
                  <h3>Avg. Score</h3>
                  <div className="stat-big">82%</div>
                </div>
              </div>

              <div className="stats-chart">
                <h3>Points This Week</h3>
                <div className="chart-placeholder">
                  <p>📊 Chart visualization coming soon</p>
                  <small>Mon: 120 | Tue: 150 | Wed: 95 | Thu: 200 | Fri: 180</small>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
