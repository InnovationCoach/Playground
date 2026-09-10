import { db, doc, updateDoc, setDoc } from '../../firebase.js';

export function createGoalsDashboard(containerId = 'goals-dashboard', userId = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[GoalsDashboard] Container not found: ${containerId}`);
    return;
  }

  let goalData = null;
  try {
    const userScoped = userId ? localStorage.getItem(`userGoals_${userId}`) : null;
    const stored = userScoped || localStorage.getItem('userGoals');
    goalData = stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('[GoalsDashboard] Could not load goals from localStorage:', e.message);
  }

  if (!goalData) {
    container.innerHTML = `
      <div class="goals-empty-state">
        <div class="empty-icon">🎯</div>
        <h3>No goals set yet</h3>
        <p>Set your learning goals to get started on your project!</p>
      </div>
    `;
    addDashboardStyles();
    return;
  }

  const createdDate = new Date(goalData.createdAt);
  const durationMs = goalData.durationDays * 24 * 60 * 60 * 1000;
  const deadlineDate = new Date(createdDate.getTime() + durationMs);
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate - new Date()) / (24 * 60 * 60 * 1000)));
  const progressPercent = goalData.completedGoals.length > 0
    ? Math.round((goalData.completedGoals.length / goalData.goals.length) * 100)
    : 0;

  container.innerHTML = `
    <div class="goals-dashboard">
      <!-- Header -->
      <div class="goals-header">
        <div class="goals-title">
          <h2>🎯 Your Learning Project</h2>
          <p class="goals-topic">${goalData.topic}</p>
        </div>
        <div class="goals-timer">
          <div class="timer-value">${daysRemaining}d</div>
          <div class="timer-label">remaining</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="goals-progress-section">
        <div class="progress-info">
          <span class="progress-label">Progress</span>
          <span class="progress-percent">${progressPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-detail">${goalData.completedGoals.length} of ${goalData.goals.length} goals completed</div>
      </div>

      <!-- Goals List -->
      <div class="goals-list-section">
        <h3>📋 Your Goals</h3>
        <div class="goals-checklist" id="goals-checklist">
          ${goalData.goals.map((goal, idx) => `
            <div class="goal-checkbox-item" data-goal-index="${idx}">
              <input type="checkbox" class="goal-checkbox" id="goal-${idx}"
                ${goalData.completedGoals.includes(idx) ? 'checked' : ''} />
              <label for="goal-${idx}" class="goal-checkbox-label">${goal}</label>
              ${goalData.completedGoals.includes(idx) ? '<span class="goal-completed">✅</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Upcoming Milestones -->
      <div class="goals-milestones">
        <h3>📅 Timeline</h3>
        <div class="milestone-item">
          <div class="milestone-dot"></div>
          <div class="milestone-content">
            <div class="milestone-date">${createdDate.toLocaleDateString()}</div>
            <div class="milestone-label">Project Start</div>
          </div>
        </div>
        <div class="milestone-line"></div>
        <div class="milestone-item deadline">
          <div class="milestone-dot"></div>
          <div class="milestone-content">
            <div class="milestone-date">${deadlineDate.toLocaleDateString()}</div>
            <div class="milestone-label">Deadline</div>
          </div>
        </div>
      </div>

      <!-- Daily Reminder -->
      <div class="goals-reminder">
        <div class="reminder-icon">🔔</div>
        <div class="reminder-content">
          <h4>Daily Reminder</h4>
          <p>Keep tracking your progress. You're ${daysRemaining} days away from your deadline!</p>
          <button class="btn-snooze-reminder" id="btn-snooze-reminder">Snooze for 24h</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="goals-actions">
        <button class="btn-reset-goals" id="btn-reset-goals">Reset Goals</button>
      </div>
    </div>
  `;

  addDashboardStyles();
  attachDashboardEventHandlers(goalData, userId);
}

function attachDashboardEventHandlers(goalData, userId = null) {
  // Goal checkbox handling
  document.querySelectorAll('.goal-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const item = checkbox.closest('.goal-checkbox-item');
      const goalIndex = parseInt(item.dataset.goalIndex);

      if (checkbox.checked) {
        if (!goalData.completedGoals.includes(goalIndex)) {
          goalData.completedGoals.push(goalIndex);
        }
        item.classList.add('completed');
      } else {
        goalData.completedGoals = goalData.completedGoals.filter(i => i !== goalIndex);
        item.classList.remove('completed');
      }

      // Save updated goals to localStorage safely
      try {
        if (userId) localStorage.setItem(`userGoals_${userId}`, JSON.stringify(goalData));
        localStorage.setItem('userGoals', JSON.stringify(goalData));
        console.log('[Goals] Goals updated in localStorage:', goalData.completedGoals);
      } catch (e) {
        console.warn('[Goals] Could not save goals to localStorage:', e.message);
      }

      // Sync updated goals to Firestore
      if (userId && db) {
        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { goals: goalData, updatedAt: new Date().toISOString() }, { merge: true });
          console.log('[Goals] Goals synced to Firestore');
        } catch (err) {
          console.warn('[Goals] Error syncing goals to Firestore:', err.message);
        }
      }

      // Update progress
      updateDashboardProgress(goalData);
    });
  });

  // Snooze reminder
  document.getElementById('btn-snooze-reminder')?.addEventListener('click', () => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 1);
    try {
      if (userId) localStorage.setItem(`reminderSnoozedUntil_${userId}`, snoozeUntil.toISOString());
      localStorage.setItem('reminderSnoozedUntil', snoozeUntil.toISOString());
    } catch (e) {
      console.warn('[Goals] Could not save snooze time');
    }

    const btn = document.getElementById('btn-snooze-reminder');
    btn.textContent = '⏱️ Snoozed until tomorrow';
    btn.disabled = true;
  });

  // Reset goals
  document.getElementById('btn-reset-goals')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset your goals? This cannot be undone.')) {
      try {
        if (userId) {
          localStorage.removeItem(`userGoals_${userId}`);
          localStorage.removeItem(`firstTimeUser_${userId}`);
        }
        localStorage.removeItem('userGoals');
        localStorage.removeItem('firstTimeUser');
      } catch (e) {
        console.warn('[Goals] Could not clear goals from localStorage');
      }

      if (userId && db) {
        try {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { isFirstTimeUser: true, goals: null, updatedAt: new Date().toISOString() }, { merge: true });
          console.log('[Goals] Firestore user doc reset for new goal setup');
        } catch (err) {
          console.warn('[Goals] Error resetting Firestore user doc:', err.message);
        }
      }

      location.reload();
    }
  });
}

function updateDashboardProgress(goalData) {
  const progressPercent = goalData.completedGoals.length > 0
    ? Math.round((goalData.completedGoals.length / goalData.goals.length) * 100)
    : 0;

  const progressFill = document.querySelector('.progress-fill');
  const progressPercent_ = document.querySelector('.progress-percent');
  const progressDetail = document.querySelector('.progress-detail');

  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  if (progressPercent_) progressPercent_.textContent = `${progressPercent}%`;
  if (progressDetail) progressDetail.textContent = `${goalData.completedGoals.length} of ${goalData.goals.length} goals completed`;

  // Show celebration if all goals completed
  if (goalData.completedGoals.length === goalData.goals.length) {
    showCompletionCelebration();
  }
}

function showCompletionCelebration() {
  if (document.getElementById('goal-completion-celebration')) return;

  const celebration = document.createElement('div');
  celebration.id = 'goal-completion-celebration';
  celebration.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.75);
    z-index: 2001;
    animation: fadeIn 0.3s ease;
    backdrop-filter: blur(4px);
  `;
  celebration.innerHTML = `
    <div style="text-align: center; background: linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%);
                padding: 3rem; border-radius: 16px; color: #e9d5ff; border: 1px solid rgba(168, 85, 247, 0.5);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); max-width: 420px; width: 90%;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🎉✨</div>
      <h2 style="margin: 0 0 0.5rem 0; font-size: 2rem;">Congratulations!</h2>
      <p style="margin: 0; color: #a78bfa; font-size: 1.05rem; line-height: 1.5;">You've completed all your learning goals!</p>
      <button id="btn-close-celebration" style="margin-top: 1.5rem; padding: 0.75rem 2rem; background: #a855f7;
                     color: white; border: none; border-radius: 8px; font-weight: 600;
                     cursor: pointer; font-size: 1rem; transition: all 0.2s;"
                     onmouseover="this.style.background='#9333ea'" onmouseout="this.style.background='#a855f7'">
        Keep Learning 🚀
      </button>
    </div>
  `;
  document.body.appendChild(celebration);

  const dismissCelebration = () => {
    celebration.remove();
  };

  const closeBtn = celebration.querySelector('#btn-close-celebration');
  if (closeBtn) closeBtn.addEventListener('click', dismissCelebration);

  celebration.addEventListener('click', (e) => {
    if (e.target === celebration) dismissCelebration();
  });
}

function addDashboardStyles() {
  if (document.getElementById('goals-dashboard-styles')) return;

  const style = document.createElement('style');
  style.id = 'goals-dashboard-styles';
  style.textContent = `
    .goals-dashboard {
      background: linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%);
      border-radius: 16px;
      padding: 2rem;
      color: #e9d5ff;
    }

    .goals-empty-state {
      text-align: center;
      padding: 3rem 2rem;
      background: rgba(168, 85, 247, 0.1);
      border: 2px dashed rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      color: #a78bfa;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .goals-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid rgba(168, 85, 247, 0.3);
    }

    .goals-title h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
    }

    .goals-topic {
      color: #a78bfa;
      margin: 0;
      font-size: 0.95rem;
    }

    .goals-timer {
      text-align: center;
    }

    .timer-value {
      font-size: 2rem;
      font-weight: 700;
      color: #fbbf24;
    }

    .timer-label {
      color: #a78bfa;
      font-size: 0.85rem;
    }

    .goals-progress-section {
      margin-bottom: 2rem;
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 12px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .progress-label {
      font-weight: 600;
    }

    .progress-percent {
      font-size: 1.2rem;
      font-weight: 700;
      color: #10b981;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(168, 85, 247, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #a855f7, #ec4899);
      transition: width 0.3s ease;
    }

    .progress-detail {
      font-size: 0.85rem;
      color: #a78bfa;
    }

    .goals-list-section {
      margin-bottom: 2rem;
    }

    .goals-list-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .goals-checklist {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .goal-checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .goal-checkbox-item.completed {
      background: rgba(16, 185, 129, 0.1);
      border-color: #10b981;
    }

    .goal-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #a855f7;
    }

    .goal-checkbox-label {
      flex: 1;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .goal-checkbox-item.completed .goal-checkbox-label {
      text-decoration: line-through;
      color: #a78bfa;
    }

    .goal-completed {
      color: #10b981;
      font-weight: 600;
    }

    .goals-milestones {
      margin-bottom: 2rem;
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 12px;
    }

    .goals-milestones h3 {
      margin: 0 0 1.5rem 0;
    }

    .milestone-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .milestone-dot {
      width: 12px;
      height: 12px;
      background: #a855f7;
      border-radius: 50%;
      margin-top: 0.25rem;
      flex-shrink: 0;
    }

    .milestone-item.deadline .milestone-dot {
      background: #fbbf24;
    }

    .milestone-line {
      height: 20px;
      margin-left: 5px;
      border-left: 2px solid rgba(168, 85, 247, 0.3);
      margin-bottom: 0.5rem;
    }

    .milestone-date {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .milestone-label {
      color: #a78bfa;
      font-size: 0.85rem;
    }

    .goals-reminder {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-left: 4px solid #fbbf24;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .reminder-icon {
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .reminder-content h4 {
      margin: 0 0 0.25rem 0;
      color: #fbbf24;
    }

    .reminder-content p {
      margin: 0 0 1rem 0;
      color: #a78bfa;
      font-size: 0.9rem;
    }

    .btn-snooze-reminder {
      background: #fbbf24;
      color: #1e1b4b;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .btn-snooze-reminder:hover:not(:disabled) {
      background: #f59e0b;
    }

    .btn-snooze-reminder:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .goals-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-reset-goals {
      background: transparent;
      color: #f87171;
      border: 1px solid #f87171;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-reset-goals:hover {
      background: rgba(248, 113, 113, 0.1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  document.head.appendChild(style);
}

export default { createGoalsDashboard };
