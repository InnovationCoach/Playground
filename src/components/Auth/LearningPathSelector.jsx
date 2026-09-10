import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './LearningPathSelector.css';

export function LearningPathSelector({ onComplete }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paths = [
    {
      id: 'climate',
      title: '🌍 Climate Challenge',
      subtitle: 'Urban heat, survival, resilience',
      description: 'Learn environmental science through realistic simulations. Tackle climate scenarios and design solutions for a sustainable future.',
      color: 'emerald',
      icon: '🌍',
      outcomes: ['Understand climate systems', 'Design solutions', 'Think critically']
    },
    {
      id: 'coding',
      title: '🐍 Coding & IoT',
      subtitle: 'Python, Micro:bit, automation',
      description: 'Build real projects with code. Program robots, sensors, and connected systems. From beginner to advanced.',
      color: 'amber',
      icon: '💻',
      outcomes: ['Learn to code', 'Build projects', 'Problem solve']
    },
    {
      id: 'sen',
      title: '♿ SEN Support',
      subtitle: 'Adaptive & accessible learning',
      description: 'Personalized learning with built-in support. Extra help, adjusted pace, your way. Learn at your own speed.',
      color: 'purple',
      icon: '✨',
      outcomes: ['Learn comfortably', 'Get support', 'Succeed']
    }
  ];

  const handleSelectPath = async () => {
    if (!selectedPath) {
      setError('Please select a learning path');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        learningPath: selectedPath,
        'profile.pathSelectedAt': new Date().toISOString()
      });

      console.log(`User selected ${selectedPath} learning path`);
      onComplete(selectedPath);
    } catch (err) {
      console.error('Error selecting path:', err);
      setError('Failed to save your selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="learning-path-selector">
      <div className="selector-header">
        <h2>Welcome! Choose Your Learning Path</h2>
        <p>Select the path that interests you most. You can change this anytime in settings.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="path-options">
        {paths.map((path) => (
          <div
            key={path.id}
            className={`path-option path-${path.id} ${selectedPath === path.id ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPath(path.id);
              setError('');
            }}
            role="radio"
            aria-checked={selectedPath === path.id}
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedPath(path.id);
                setError('');
              }
            }}
          >
            <div className="path-icon">{path.icon}</div>
            <h3>{path.title}</h3>
            <p className="subtitle">{path.subtitle}</p>
            <p className="description">{path.description}</p>
            <ul className="outcomes">
              {path.outcomes.map((outcome, i) => (
                <li key={i}>✓ {outcome}</li>
              ))}
            </ul>
            {selectedPath === path.id && <div className="checkmark">✓</div>}
          </div>
        ))}
      </div>

      <div className="selector-footer">
        <button
          onClick={handleSelectPath}
          disabled={!selectedPath || loading}
          className="btn-primary btn-large"
          aria-busy={loading}
        >
          {loading ? 'Setting up your path...' : 'Continue'}
        </button>
        <p className="helper-text">This selection will personalize your dashboard and available challenges.</p>
      </div>
    </div>
  );
}
