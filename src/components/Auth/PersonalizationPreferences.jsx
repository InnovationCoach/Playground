import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './PersonalizationPreferences.css';

export function PersonalizationPreferences({ learningPath, onComplete }) {
  const [preferences, setPreferences] = useState({
    fontSize: 'medium',
    dyslexiaMode: false,
    highContrast: false,
    reduceAnimations: false,
    difficultyLevel: 'beginner',
    learningPace: 'self-paced',
    language: 'en'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { preferences });
      console.log('Preferences saved:', preferences);
      onComplete();
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Use defaults without saving
    onComplete();
  };

  const pathEmoji = {
    climate: '🌍',
    coding: '🐍',
    sen: '✨'
  };

  return (
    <div className="personalization-preferences">
      <div className="pref-header">
        <h2>{pathEmoji[learningPath]} Customize Your Experience</h2>
        <p>Make HearIsland work better for you. You can change these anytime in settings.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="pref-form">
        {/* Readability Section */}
        <div className="pref-section">
          <h3>👁️ Readability</h3>

          <div className="pref-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.dyslexiaMode}
                onChange={(e) => handleChange('dyslexiaMode', e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span>
                <strong>Dyslexia-Friendly Font</strong>
                <small>Uses OpenDyslexic font (easier to read for dyslexia)</small>
              </span>
            </label>
          </div>

          <div className="pref-option">
            <label htmlFor="fontSize">Font Size:</label>
            <div className="radio-group">
              {['small', 'medium', 'large'].map((size) => (
                <label key={size} className="radio-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size}
                    checked={preferences.fontSize === size}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span style={{fontSize: size === 'small' ? '0.9rem' : size === 'large' ? '1.1rem' : '1rem'}}>
                    {size === 'small' ? 'Small' : size === 'large' ? 'Large' : 'Medium'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pref-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => handleChange('highContrast', e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span>
                <strong>High Contrast Mode</strong>
                <small>Brighter colors for better visibility</small>
              </span>
            </label>
          </div>
        </div>

        {/* Motion Section */}
        <div className="pref-section">
          <h3>⚡ Motion & Animations</h3>

          <div className="pref-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.reduceAnimations}
                onChange={(e) => handleChange('reduceAnimations', e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              <span>
                <strong>Reduce Animations</strong>
                <small>Minimize motion to reduce eye strain or motion sickness</small>
              </span>
            </label>
          </div>
        </div>

        {/* Learning Preferences Section */}
        <div className="pref-section">
          <h3>🎓 Learning Preferences</h3>

          <div className="pref-option">
            <label htmlFor="difficulty">Difficulty Level:</label>
            <select
              id="difficulty"
              value={preferences.difficultyLevel}
              onChange={(e) => handleChange('difficultyLevel', e.target.value)}
            >
              <option value="beginner">
                Beginner (Extra guidance, slower pace, more hints)
              </option>
              <option value="intermediate">
                Intermediate (Balanced challenge and support)
              </option>
              <option value="expert">
                Expert (More challenging, less hand-holding)
              </option>
            </select>
          </div>

          <div className="pref-option">
            <label htmlFor="pace">Learning Pace:</label>
            <select
              id="pace"
              value={preferences.learningPace}
              onChange={(e) => handleChange('learningPace', e.target.value)}
            >
              <option value="self-paced">
                Self-Paced (No deadlines, learn at your own speed)
              </option>
              <option value="structured">
                Structured (Weekly goals and milestones)
              </option>
              <option value="social">
                Social (Group challenges and leaderboards)
              </option>
            </select>
          </div>
        </div>

        {/* Language Section */}
        <div className="pref-section">
          <h3>🌐 Language</h3>

          <div className="pref-option">
            <label htmlFor="language">Interface Language:</label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>
        </div>

        {/* Preview Section */}
        <div className="pref-section preview-section">
          <h3>👀 Preview</h3>
          <div className="preview-box" style={{
            fontSize: preferences.fontSize === 'large' ? '1.1rem' : preferences.fontSize === 'small' ? '0.9rem' : '1rem',
            fontFamily: preferences.dyslexiaMode ? "'OpenDyslexic', system-ui, sans-serif" : 'system-ui, sans-serif',
            filter: preferences.highContrast ? 'contrast(1.2)' : 'none'
          }}>
            <p>This is how your text will look with your current preferences.</p>
            <p>You can see the font size, style, and contrast all here.</p>
          </div>
        </div>
      </form>

      <div className="pref-footer">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary btn-large"
          aria-busy={loading}
        >
          {loading ? 'Saving preferences...' : 'Start Learning! 🚀'}
        </button>
        <button
          onClick={handleSkip}
          className="btn-secondary"
          disabled={loading}
        >
          Use Defaults & Continue
        </button>
      </div>
    </div>
  );
}
