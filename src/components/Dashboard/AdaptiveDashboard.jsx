import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import BehaviorTracker from '../../utils/behaviorTracker.js';
import { SmartSENChatbot } from '../SEN/SmartSENChatbot.jsx';
import PathCard from './PathCard.jsx';
import './AdaptiveDashboard.css';

export function AdaptiveDashboard() {
  const [user, setUser] = useState(null);
  const [behaviorTracker, setBehaviorTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPathModal, setShowAddPathModal] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();

        // Ensure new schema fields exist
        if (!userData.learningPaths) {
          // Migrate old single-path to new multi-path
          const pathId = userData.learningPath || 'climate';
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            learningPaths: {
              [pathId]: {
                started: new Date(),
                progress: userData.stats?.completedChallenges || 0,
                completedChallenges: [],
                currentChallenge: null
              }
            }
          });
          userData.learningPaths = {
            [pathId]: {
              started: new Date(),
              progress: userData.stats?.completedChallenges || 0,
              completedChallenges: [],
              currentChallenge: null
            }
          };
        }

        if (!userData.behaviorAnalytics) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            behaviorAnalytics: {
              lastSessionTime: null,
              sessionsCount: 0,
              trackingEnabled: userData.preferences?.senSupport?.trackBehavior !== false,
              recentSessions: [],
              strugglesDetected: []
            }
          });
          userData.behaviorAnalytics = {
            lastSessionTime: null,
            sessionsCount: 0,
            trackingEnabled: userData.preferences?.senSupport?.trackBehavior !== false,
            recentSessions: [],
            strugglesDetected: []
          };
        }

        setUser(userData);

        // Initialize behavior tracker if SEN enabled
        if (userData.preferences?.senSupport?.enabled && userData.behaviorAnalytics?.trackingEnabled) {
          const tracker = new BehaviorTracker(auth.currentUser.uid);
          setBehaviorTracker(tracker);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load dashboard');
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * Add a new learning path
   */
  const handleAddPath = async (pathId) => {
    try {
      const updatedPaths = { ...user.learningPaths };
      updatedPaths[pathId] = {
        started: new Date(),
        progress: 0,
        completedChallenges: [],
        currentChallenge: null
      };

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { learningPaths: updatedPaths });

      setUser({ ...user, learningPaths: updatedPaths });
      setShowAddPathModal(false);
    } catch (err) {
      console.error('Error adding path:', err);
      setError('Failed to add path');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your learning space...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!user) {
    return <div className="dashboard-loading"><p>No user data</p></div>;
  }

  const isSENEnabled = user.preferences?.senSupport?.enabled;
  const learningPaths = user.learningPaths || {};
  const stats = user.stats || {};

  return (
    <div className={`adaptive-dashboard ${isSENEnabled ? 'sen-mode' : ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>Welcome back, {user.displayName}! 👋</h1>
          <p className={`tagline ${isSENEnabled ? 'sen' : ''}`}>
            {isSENEnabled
              ? '✨ Learning at your own pace'
              : '🚀 Ready to learn something new?'}
          </p>
        </div>

        <div className="header-stats">
          <div className="stat">
            <span className="stat-icon">⭐</span>
            <div className="stat-content">
              <span className="stat-value">{stats.totalPoints || 0}</span>
              <span className="stat-label">Points</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">🔥</span>
            <div className="stat-content">
              <span className="stat-value">{stats.currentStreak || 0}</span>
              <span className="stat-label">Streak</span>
            </div>
          </div>
          <div className="stat">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-value">{stats.completedChallenges || 0}</span>
              <span className="stat-label">Done</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Learning Paths Section */}
        <section className="learning-paths-section">
          <div className="section-header">
            <h2>📚 Your Learning Paths</h2>
            <p className="section-subtitle">
              {Object.keys(learningPaths).length === 0
                ? 'Start your first learning path'
                : 'Continue learning or add a new path'}
            </p>
          </div>

          {Object.keys(learningPaths).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>No paths yet</h3>
              <p>Start by choosing your first learning path below</p>
              <button
                className="btn-start"
                onClick={() => setShowAddPathModal(true)}
              >
                Choose Path →
              </button>
            </div>
          ) : (
            <div className="paths-grid">
              {Object.entries(learningPaths).map(([pathId, pathData]) => (
                <PathCard
                  key={pathId}
                  pathId={pathId}
                  pathData={pathData}
                  isSENEnabled={isSENEnabled}
                  onTaskStart={(taskId, taskTitle) => {
                    if (behaviorTracker) {
                      behaviorTracker.startTask(taskId, taskTitle);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Add New Path Button */}
        {Object.keys(learningPaths).length > 0 && (
          <div className="add-path-section">
            <button
              className="btn-add-path"
              onClick={() => setShowAddPathModal(true)}
            >
              + Add Another Path
            </button>
          </div>
        )}

        {/* Quick Stats */}
        {Object.keys(learningPaths).length > 0 && (
          <section className="quick-stats-section">
            <h3>📊 Your Stats</h3>
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-label">Learning Paths</span>
                <span className="stat-value">{Object.keys(learningPaths).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Completed</span>
                <span className="stat-value">{stats.completedChallenges || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Session Time This Week</span>
                <span className="stat-value">~2h</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Add Path Modal */}
      {showAddPathModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Choose a Learning Path</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddPathModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div
                className="path-option"
                onClick={() => {
                  if (!learningPaths.climate) handleAddPath('climate');
                  setShowAddPathModal(false);
                }}
                style={{
                  opacity: learningPaths.climate ? 0.5 : 1,
                  cursor: learningPaths.climate ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="path-icon">🌍</div>
                <h3>Climate Challenge</h3>
                <p>Urban heat, survival, resilience</p>
                {learningPaths.climate && <span className="in-progress">In Progress</span>}
              </div>

              <div
                className="path-option"
                onClick={() => {
                  if (!learningPaths.coding) handleAddPath('coding');
                  setShowAddPathModal(false);
                }}
                style={{
                  opacity: learningPaths.coding ? 0.5 : 1,
                  cursor: learningPaths.coding ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="path-icon">🐍</div>
                <h3>Coding & IoT</h3>
                <p>Python, Micro:bit, automation</p>
                {learningPaths.coding && <span className="in-progress">In Progress</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowAddPathModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart SEN Chatbot - Only if SEN mode enabled */}
      {isSENEnabled && behaviorTracker && (
        <SmartSENChatbot
          isEnabled={true}
          behaviorTracker={behaviorTracker}
          learningPath={Object.keys(learningPaths)[0]}
        />
      )}
    </div>
  );
}

export default AdaptiveDashboard;
