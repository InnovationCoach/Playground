import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './CodingIoTDashboard.css';

export function CodingIoTDashboard() {
  const [userStats, setUserStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects'); // projects, skills, code-review

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

        // Load projects (mock data for now)
        loadProjects();

        // Load skills
        loadSkills();

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const loadProjects = () => {
    setProjects([
      {
        id: 1,
        title: 'Weather Station',
        language: 'Python',
        description: 'Micro:bit weather monitoring with Firebase logging',
        progress: 80,
        status: 'in-progress',
        lastEdited: '2 hours ago',
        tags: ['Micro:bit', 'Sensors', 'Firebase']
      },
      {
        id: 2,
        title: 'Traffic Light Controller',
        language: 'Python',
        description: 'State machine logic with simulation',
        progress: 40,
        status: 'in-progress',
        lastEdited: 'Yesterday',
        tags: ['Logic', 'Simulation', 'IoT']
      },
      {
        id: 3,
        title: 'Smart Garden System',
        language: 'Python',
        description: 'Automated watering based on soil moisture',
        progress: 0,
        status: 'new',
        lastEdited: null,
        tags: ['IoT', 'Sensors', 'Automation']
      }
    ]);
  };

  const loadSkills = () => {
    setSkills([
      { id: 1, name: 'Variables & Logic', level: 100, status: 'mastered' },
      { id: 2, name: 'Loops & Conditionals', level: 75, status: 'in-progress' },
      { id: 3, name: 'Functions & Debugging', level: 0, status: 'locked' },
      { id: 4, name: 'Data Structures', level: 0, status: 'locked' },
      { id: 5, name: 'API Integration', level: 0, status: 'locked' }
    ]);
  };

  if (loading) {
    return <div className="dashboard-loading">Loading your code lab...</div>;
  }

  return (
    <div className="coding-dashboard" data-path="coding">
      {/* Header */}
      <div className="dashboard-header coding-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🐍 Code Lab</h1>
            <p>Build real projects with Python, Micro:bit, and IoT</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">Level 5</div>
              <div className="stat-label">Code Level</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12h</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📁 My Projects
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          🎓 Skill Track
        </button>
        <button
          className={`tab-btn ${activeTab === 'code-review' ? 'active' : ''}`}
          onClick={() => setActiveTab('code-review')}
        >
          📝 Code Review
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <div className="section-header">
                <h2>📁 Your Projects</h2>
                <button className="btn-new-project">+ New Project</button>
              </div>

              <div className="projects-list">
                {projects.map((project) => (
                  <div key={project.id} className={`project-card ${project.status}`}>
                    <div className="project-header">
                      <div className="project-title">
                        <h3>{project.title}</h3>
                        <span className="language-badge">{project.language}</span>
                      </div>
                      <div className="project-status">
                        {project.status === 'in-progress' && <span className="badge badge-progress">In Progress</span>}
                        {project.status === 'new' && <span className="badge badge-new">New</span>}
                      </div>
                    </div>

                    <p className="project-desc">{project.description}</p>

                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    {project.progress > 0 && (
                      <div className="project-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{project.progress}% Complete</span>
                      </div>
                    )}

                    <div className="project-footer">
                      <small className="last-edited">Last edited: {project.lastEdited || 'Not started'}</small>
                      <button className="btn-open">
                        {project.status === 'new' ? 'Start Project' : 'Continue'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Skills Track Tab */}
        {activeTab === 'skills' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <h2>🎓 Skill Progression Track</h2>
              <p className="section-subtitle">Master these skills step by step</p>

              <div className="skills-track">
                {skills.map((skill, idx) => (
                  <div key={skill.id} className={`skill-item ${skill.status}`}>
                    <div className="skill-number">{idx + 1}</div>

                    <div className="skill-info">
                      <h4>{skill.name}</h4>
                      {skill.status === 'mastered' && <span className="skill-badge mastered">✓ Mastered</span>}
                      {skill.status === 'in-progress' && <span className="skill-badge in-progress">In Progress</span>}
                      {skill.status === 'locked' && <span className="skill-badge locked">Locked</span>}
                    </div>

                    {skill.level > 0 && (
                      <div className="skill-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${skill.level}%` }}></div>
                        </div>
                        <span className="progress-percent">{skill.level}%</span>
                      </div>
                    )}

                    {skill.status === 'mastered' && (
                      <div className="skill-actions">
                        <button className="btn-badge">Earn Badge</button>
                      </div>
                    )}

                    {skill.status === 'in-progress' && (
                      <div className="skill-actions">
                        <button className="btn-continue">Continue</button>
                      </div>
                    )}

                    {skill.status === 'locked' && (
                      <div className="skill-actions">
                        <button className="btn-locked" disabled>Locked</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="skills-info">
                <h3>How Skills Work</h3>
                <ul>
                  <li>Complete projects to unlock new skills</li>
                  <li>Master a skill by reaching 100% progress</li>
                  <li>Earn badges for mastered skills</li>
                  <li>Skills unlock new advanced projects</li>
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* Code Review Tab */}
        {activeTab === 'code-review' && (
          <div className="tab-panel">
            <section className="dashboard-section">
              <h2>📝 Recent Code Reviews</h2>

              <div className="reviews-list">
                <div className="review-card">
                  <div className="review-header">
                    <h4>Weather Station - Sensor Integration</h4>
                    <span className="review-date">3 days ago</span>
                  </div>
                  <p className="review-feedback">
                    Great use of list comprehension! Consider adding error handling for sensor timeouts.
                  </p>
                  <div className="review-author">
                    <span className="avatar">👨‍🏫</span>
                    <span>Code Review by Instructor</span>
                  </div>
                  <button className="btn-view-feedback">View Full Feedback →</button>
                </div>

                <div className="review-card">
                  <div className="review-header">
                    <h4>Traffic Light - Logic Refactoring</h4>
                    <span className="review-date">1 week ago</span>
                  </div>
                  <p className="review-feedback">
                    Good implementation! The state machine is clean. Consider adding a reset function.
                  </p>
                  <div className="review-author">
                    <span className="avatar">👨‍💻</span>
                    <span>Peer Review by Jordan</span>
                  </div>
                  <button className="btn-view-feedback">View Full Feedback →</button>
                </div>

                <div className="review-empty">
                  <p>No code reviews yet. Submit a project for review!</p>
                  <button className="btn-submit">Submit for Review</button>
                </div>
              </div>
            </section>
          </div>
        )}

      </div>

      {/* Quick Stats */}
      <div className="dashboard-footer">
        <section className="dashboard-section">
          <h2>📊 Quick Stats</h2>
          <div className="stats-mini">
            <div className="stat-item">
              <span className="stat-icon">📝</span>
              <span className="stat-text">Lines of Code: 1,250</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🐛</span>
              <span className="stat-text">Bugs Fixed: 12</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-text">Code Quality: 8.5/10</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🎯</span>
              <span className="stat-text">Test Coverage: 65%</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
