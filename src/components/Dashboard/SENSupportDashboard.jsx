import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './SENSupportDashboard.css';

export function SENSupportDashboard() {
  const [userStats, setUserStats] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [showTutor, setShowTutor] = useState(false);
  const [tutorMessage, setTutorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Load user data
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        setUserStats(userData?.stats || {});
        setDisplayName(userData?.displayName || 'Friend');

        // Load simplified challenges
        loadChallenges();

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const loadChallenges = () => {
    setChallenges([
      {
        id: 1,
        title: 'What is Climate Change?',
        type: 'read',
        status: 'completed',
        steps: [
          { label: '📖 Read a simple guide', completed: true },
          { label: '✏️ Answer questions', completed: true }
        ],
        completedDate: '3 days ago'
      },
      {
        id: 2,
        title: 'Design Your City',
        type: 'interactive',
        status: 'in-progress',
        progress: 66,
        steps: [
          { label: '🎮 Interactive builder', completed: true },
          { label: '💬 Tell me your ideas', completed: true },
          { label: '✅ Submit your design', completed: false }
        ]
      },
      {
        id: 3,
        title: 'City Temperature Challenge',
        type: 'explore',
        status: 'ready',
        steps: [
          { label: '📚 Explore data', completed: false },
          { label: '💭 Think about patterns', completed: false }
        ]
      }
    ]);
  };

  const handleTutorRequest = (type) => {
    setShowTutor(true);
    if (type === 'hint') {
      setTutorMessage('Here\'s a hint: Think about how the sun\'s heat reaches the Earth... 💭');
    } else if (type === 'explain') {
      setTutorMessage('Climate change is when Earth gets warmer over time. This happens because gases in the air trap heat from the sun, like a blanket. We call these "greenhouse gases". ☀️');
    } else if (type === 'example') {
      setTutorMessage('Example: Imagine if you left your car in the sun on a hot day. It gets super warm inside, right? That\'s similar to what\'s happening to our planet! 🚗');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading your learning space... ✨</div>;
  }

  return (
    <div className="sen-dashboard" data-path="sen">
      {/* Header with Greeting */}
      <div className="dashboard-header sen-header">
        <div className="header-content">
          <div className="greeting">
            <h1>Hello, {displayName}! 👋</h1>
            <p className="encouragement">You're doing GREAT! Keep going! 🌟</p>
          </div>

          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-emoji">⭐</span>
              <span>{userStats?.totalPoints || 0} Points</span>
            </div>
            <div className="quick-stat">
              <span className="stat-emoji">✅</span>
              <span>{userStats?.completedChallenges || 0} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Simplified and Large */}
      <div className="dashboard-content">
        <section className="sen-section">
          <h2>📖 Your Challenges</h2>
          <p className="section-hint">Click on any challenge to work on it. No rush! 💪</p>

          <div className="challenges-stack">
            {challenges.map((challenge) => (
              <div key={challenge.id} className={`challenge-block ${challenge.status}`}>
                {/* Status Badge */}
                <div className="challenge-status">
                  {challenge.status === 'completed' && '✅ Completed'}
                  {challenge.status === 'in-progress' && '🟡 In Progress'}
                  {challenge.status === 'ready' && '⬜ Ready to try'}
                </div>

                {/* Title and Icon */}
                <h3 className="challenge-title">{challenge.title}</h3>

                {/* Steps */}
                <div className="challenge-steps">
                  <p className="steps-label">Steps:</p>
                  {challenge.steps.map((step, idx) => (
                    <div key={idx} className={`step ${step.completed ? 'done' : ''}`}>
                      <span className="step-icon">{step.completed ? '✅' : '⬜'}</span>
                      <span className="step-text">{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {challenge.progress && (
                  <div className="challenge-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${challenge.progress}%` }}></div>
                    </div>
                    <span className="progress-text">{challenge.progress}% Complete</span>
                  </div>
                )}

                {/* Completed Date */}
                {challenge.completedDate && (
                  <small className="completed-date">Finished {challenge.completedDate}</small>
                )}

                {/* Action Button */}
                <button className={`btn-challenge ${challenge.status}`}>
                  {challenge.status === 'completed' && '🔄 Do Again'}
                  {challenge.status === 'in-progress' && 'Continue →'}
                  {challenge.status === 'ready' && 'Start Now →'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AI Tutor Section */}
        <section className="sen-section tutor-section">
          <h2>🤖 AI Learning Helper</h2>
          <p className="section-hint">Stuck? I can help you! Choose how I can help:</p>

          <div className="tutor-buttons">
            <button className="tutor-btn" onClick={() => handleTutorRequest('hint')}>
              Need a hint? 💭
            </button>
            <button className="tutor-btn" onClick={() => handleTutorRequest('explain')}>
              Explain it to me 📚
            </button>
            <button className="tutor-btn" onClick={() => handleTutorRequest('example')}>
              Show an example 📖
            </button>
          </div>

          {/* Tutor Message */}
          {showTutor && (
            <div className="tutor-message">
              <div className="message-content">
                <span className="tutor-icon">🤖</span>
                <div className="message-text">
                  <p>{tutorMessage}</p>
                  <button className="btn-listen">🔊 Listen</button>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowTutor(false)}>✕</button>
            </div>
          )}
        </section>

        {/* Achievements - Simple */}
        <section className="sen-section">
          <h2>🏅 Your Badges</h2>
          <p className="section-hint">Earn badges by completing challenges!</p>

          <div className="badges-row">
            <div className="badge-item earned">
              <span className="badge-icon">🌱</span>
              <span className="badge-name">First Step</span>
            </div>
            <div className="badge-item locked">
              <span className="badge-icon">🏔️</span>
              <span className="badge-name">Climate Expert</span>
              <span className="lock">🔒</span>
            </div>
            <div className="badge-item locked">
              <span className="badge-icon">🌍</span>
              <span className="badge-name">Planet Saver</span>
              <span className="lock">🔒</span>
            </div>
          </div>
        </section>

        {/* Encouraging Message */}
        <section className="sen-section motivation">
          <div className="motivation-box">
            <h3>💪 You've Got This!</h3>
            <p>
              Learning is like climbing a mountain. You don't need to rush.
              Every step forward is progress! Take your time and celebrate small wins.
            </p>
            <div className="motivation-tips">
              <p><strong>💡 Tips:</strong></p>
              <ul>
                <li>✓ Go at your own pace</li>
                <li>✓ Take breaks when you need them</li>
                <li>✓ Ask for help anytime</li>
                <li>✓ All learning styles are cool</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
