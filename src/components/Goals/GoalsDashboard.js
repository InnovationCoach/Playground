import { db, doc, updateDoc, setDoc } from '../../firebase.js';

export function createGoalsDashboard(containerId = 'goals-dashboard', userId = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[GoalsDashboard] Container not found: ${containerId}`);
    return;
  }

  let goalData = null;
  try {
    // No unscoped fallback: on a shared device it was the previous learner's goals.
    const stored = userId ? localStorage.getItem(`userGoals_${userId}`) : null;
    goalData = stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('[GoalsDashboard] Could not load goals from localStorage:', e.message);
  }

  if (!goalData) {
    container.innerHTML = `
      <div class="goals-empty-state" style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 1px solid #4338ca; border-radius: 16px; padding: 2rem; text-align: center; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">🎯</div>
        <h3 style="color: #c084fc; font-size: 1.4rem; margin: 0 0 0.5rem 0;">Set Your Learning & Project Goals</h3>
        <p style="color: #a5b4fc; max-width: 500px; margin: 0 auto 1.25rem auto; font-size: 0.95rem; line-height: 1.5;">
          Plan your project milestones with SEN AI Chatbot guidance to track daily STEM progress, deadlines, and learning achievements!
        </p>
        <button id="btn-open-goals-modal-empty" style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: white; border: none; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          ✨ Set Your Goals Now
        </button>
      </div>
    `;
    addDashboardStyles();
    document.getElementById('btn-open-goals-modal-empty')?.addEventListener('click', () => {
      if (typeof window.openGoalSettingWizard === 'function') {
        window.openGoalSettingWizard();
      }
    });
    return;
  }

  const createdDate = new Date(goalData.createdAt);
  const durationMs = (goalData.durationDays || 14) * 24 * 60 * 60 * 1000;
  const deadlineDate = new Date(createdDate.getTime() + durationMs);
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate - new Date()) / (24 * 60 * 60 * 1000)));
  const progressPercent = goalData.completedGoals.length > 0
    ? Math.round((goalData.completedGoals.length / goalData.goals.length) * 100)
    : 0;

  container.innerHTML = `
    <div class="goals-dashboard" style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 16px; padding: 1.75rem; color: white;">
      <!-- Header -->
      <div class="goals-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div class="goals-title">
          <h2 style="margin: 0; color: #e9d5ff; font-size: 1.5rem;">🎯 Your Learning Project Goals</h2>
          <p class="goals-topic" style="margin: 0.25rem 0 0 0; color: #a78bfa; font-weight: 600;">${goalData.topic || 'STEM Innovation Project'}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="btn-edit-goals-header" style="background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid #a855f7; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(168, 85, 247, 0.4)'" onmouseout="this.style.background='rgba(168, 85, 247, 0.25)'">
            ✏️ Set / Edit Goals
          </button>
          <div class="goals-timer" style="background: rgba(0,0,0,0.3); padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <div class="timer-value" style="font-size: 1.2rem; font-weight: 800; color: #34d399;">${daysRemaining}d</div>
            <div class="timer-label" style="font-size: 0.75rem; color: #94a3b8;">remaining</div>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="goals-progress-section" style="margin-bottom: 1.5rem;">
        <div class="progress-info" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #cbd5e1; font-weight: 600;">
          <span class="progress-label">Project Progress</span>
          <span class="progress-percent" style="color: #34d399; font-weight: 800;">${progressPercent}%</span>
        </div>
        <div class="progress-bar" style="width: 100%; height: 12px; background: rgba(0,0,0,0.4); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
          <div class="progress-fill" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%); transition: width 0.3s ease;"></div>
        </div>
        <div class="progress-detail" style="margin-top: 0.4rem; font-size: 0.8rem; color: #94a3b8;">${goalData.completedGoals.length} of ${goalData.goals.length} goals completed</div>
      </div>

      <!-- Goals List -->
      <div class="goals-list-section" style="margin-bottom: 1.5rem;">
        <h3 style="color: #e9d5ff; font-size: 1.1rem; margin: 0 0 1rem 0;">📋 Goal Checklist</h3>
        <div class="goals-checklist" id="goals-checklist" style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${goalData.goals.map((goal, idx) => `
            <div class="goal-checkbox-item ${goalData.completedGoals.includes(idx) ? 'completed' : ''}" data-goal-index="${idx}" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); padding: 0.75rem 1rem; border-radius: 10px; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;">
              <input type="checkbox" class="goal-checkbox" id="goal-${idx}"
                ${goalData.completedGoals.includes(idx) ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981;" />
              <label for="goal-${idx}" class="goal-checkbox-label" style="flex: 1; cursor: pointer; font-size: 0.95rem; color: ${goalData.completedGoals.includes(idx) ? '#94a3b8' : '#f8fafc'}; text-decoration: ${goalData.completedGoals.includes(idx) ? 'line-through' : 'none'};">${goal}</label>
              ${goalData.completedGoals.includes(idx) ? '<span class="goal-completed" style="color: #34d399; font-weight: 800;">✅ Done</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Daily Reminder Card -->
      <div class="goals-reminder" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
        <div class="reminder-icon" style="font-size: 2rem;">🔔</div>
        <div class="reminder-content" style="flex: 1;">
          <h4 style="margin: 0 0 0.25rem 0; color: #fbbf24; font-size: 1.1rem;">🔔 Daily Goal & Focus Reminder</h4>
          <p style="margin: 0 0 0.75rem 0; color: #fde68a; font-size: 0.9rem; line-height: 1.4;">
            Keep tracking your daily STEM learning! You have <strong>${daysRemaining} days remaining</strong> before your project deadline on ${deadlineDate.toLocaleDateString()}.
          </p>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn-snooze-reminder" id="btn-snooze-reminder" style="background: rgba(0,0,0,0.3); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.4); padding: 0.45rem 0.9rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
              ⏱️ Snooze 24h
            </button>
            <button id="btn-mark-daily-done" style="background: #f59e0b; color: black; border: none; padding: 0.45rem 0.9rem; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.85rem;">
              ✨ Mark Today's Learning Done
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="goals-actions" style="display: flex; justify-content: flex-end;">
        <button class="btn-reset-goals" id="btn-reset-goals" style="background: transparent; color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
          🔄 Reset Goals
        </button>
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

  // Edit / Set Goals from Header
  document.getElementById('btn-edit-goals-header')?.addEventListener('click', () => {
    if (typeof window.openGoalSettingWizard === 'function') {
      window.openGoalSettingWizard();
    }
  });

  // Mark Daily Learning Done
  document.getElementById('btn-mark-daily-done')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-mark-daily-done');
    if (btn) {
      btn.textContent = '🎉 Awesome Job! Today Completed';
      btn.style.background = '#10b981';
      btn.style.color = '#ffffff';
      btn.disabled = true;
    }
  });

  // Snooze reminder
  document.getElementById('btn-snooze-reminder')?.addEventListener('click', () => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 1);
    try {
      if (userId) localStorage.setItem(`reminderSnoozedUntil_${userId}`, snoozeUntil.toISOString());
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
