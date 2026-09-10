import React from 'react';
import './PathCard.css';

export function PathCard({ pathId, pathData, isSENEnabled, onTaskStart }) {
  // Path configurations
  const pathConfigs = {
    climate: {
      icon: '🌍',
      title: 'Climate Challenge',
      description: 'Urban heat, survival, resilience',
      color: 'climate',
      challenges: [
        { id: 'climate-01', title: 'Urban Heat Crisis', difficulty: 'Beginner' },
        { id: 'climate-02', title: 'Bunker Survival', difficulty: 'Intermediate' },
        { id: 'climate-03', title: 'Bangkok Coastal', difficulty: 'Expert' }
      ]
    },
    coding: {
      icon: '🐍',
      title: 'Coding & IoT',
      description: 'Python, Micro:bit, automation',
      color: 'coding',
      challenges: [
        { id: 'coding-01', title: 'Variables & Logic', difficulty: 'Beginner' },
        { id: 'coding-02', title: 'Weather Station', difficulty: 'Intermediate' },
        { id: 'coding-03', title: 'Smart Garden', difficulty: 'Expert' }
      ]
    }
  };

  const config = pathConfigs[pathId];
  if (!config) return null;

  const progress = pathData.progress || 0;
  const completed = pathData.completedChallenges?.length || 0;

  return (
    <div className={`path-card path-${config.color} ${isSENEnabled ? 'sen-mode' : ''}`}>
      {/* Header */}
      <div className="path-header">
        <div className="path-icon">{config.icon}</div>
        <div className="path-info">
          <h3>{config.title}</h3>
          <p className="path-description">{config.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="path-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          <span>{progress}% Progress</span>
          <span className="completed-count">{completed} completed</span>
        </div>
      </div>

      {/* Challenges List */}
      <div className="path-challenges">
        <h4>Challenges</h4>
        <div className="challenges-list">
          {config.challenges.map((challenge, idx) => {
            const isCompleted = pathData.completedChallenges?.includes(challenge.id);
            const isCurrent = pathData.currentChallenge === challenge.id;

            return (
              <button
                key={challenge.id}
                className={`challenge-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => onTaskStart(challenge.id, challenge.title)}
                title={challenge.title}
              >
                <span className="challenge-status">
                  {isCompleted ? '✅' : isCurrent ? '🟡' : '⬜'}
                </span>
                <span className="challenge-title">{challenge.title}</span>
                <span className={`difficulty difficulty-${challenge.difficulty.toLowerCase()}`}>
                  {challenge.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <button className={`btn-launch btn-${config.color}`}>
        {progress === 0
          ? 'Start Path →'
          : progress === 100
          ? 'Review Path'
          : 'Continue →'}
      </button>

      {/* Stats */}
      <div className="path-stats">
        <div className="stat-mini">
          <span className="stat-icon">⏱</span>
          <span>~5h per path</span>
        </div>
        <div className="stat-mini">
          <span className="stat-icon">🎯</span>
          <span>{config.challenges.length} challenges</span>
        </div>
      </div>
    </div>
  );
}

export default PathCard;
