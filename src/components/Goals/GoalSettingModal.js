/**
 * Goal Setting Modal
 * Helps first-time users set short-term project goals with SEN chatbot guidance
 */

export function createGoalSettingModal(userId = null) {
  const modal = document.createElement('div');
  modal.id = 'goal-setting-modal';
  modal.className = 'goal-setting-modal';
  modal.innerHTML = `
    <div class="goal-modal-overlay">
      <div class="goal-modal-content">
        <div class="goal-modal-header">
          <h2>🎯 Let's Set Your Learning Goals</h2>
          <p>Working with SEN Chatbot to plan your project</p>
        </div>

        <div class="goal-modal-body">
          <!-- Step 1: Learning Path Selection -->
          <div class="goal-step" id="goal-step-1">
            <h3>Step 1: What will you be learning?</h3>
            <div class="goal-options">
              <button class="goal-option-btn" data-path="climate">
                <span class="goal-emoji">🌍</span>
                <span class="goal-title">Climate & Sustainability</span>
              </button>
              <button class="goal-option-btn" data-path="coding">
                <span class="goal-emoji">🐍</span>
                <span class="goal-title">Coding & Programming</span>
              </button>
            </div>
          </div>

          <!-- Step 2: PBL Topic Selection -->
          <div class="goal-step hidden" id="goal-step-2">
            <h3>Step 2: Choose a Project-Based Learning Topic</h3>
            <div class="goal-topics">
              <div class="topic-list" id="topic-list"></div>
            </div>
          </div>

          <!-- Step 3: Goal Duration -->
          <div class="goal-step hidden" id="goal-step-3">
            <h3>Step 3: How long is your project?</h3>
            <div class="goal-durations">
              <button class="goal-duration-btn" data-days="7">
                <span class="duration-emoji">⚡</span>
                <span class="duration-label">1 Week</span>
              </button>
              <button class="goal-duration-btn" data-days="14">
                <span class="duration-emoji">🎯</span>
                <span class="duration-label">2 Weeks</span>
              </button>
              <button class="goal-duration-btn" data-days="30">
                <span class="duration-emoji">📅</span>
                <span class="duration-label">1 Month</span>
              </button>
            </div>
          </div>

          <!-- Step 4: Specific Goals -->
          <div class="goal-step hidden" id="goal-step-4">
            <h3>Step 4: What are your specific goals?</h3>
            <div class="goal-input-area">
              <input type="text" id="goal-input" placeholder="e.g., Build a climate model, Learn Python basics..." class="goal-input" />
              <button class="goal-add-btn" id="goal-add-btn">+ Add Goal</button>
            </div>
            <div class="goals-list" id="goals-list"></div>
          </div>

          <!-- SEN Chatbot Helper -->
          <div class="goal-chatbot-helper">
            <div class="helper-avatar">🤖</div>
            <div class="helper-message" id="helper-message">
              Click on a learning path to get started! I'll help you plan your goals.
            </div>
          </div>
        </div>

        <div class="goal-modal-footer">
          <button class="goal-btn-back" id="goal-btn-back" style="display:none;">← Back</button>
          <button class="goal-btn-next" id="goal-btn-next">Next →</button>
          <button class="goal-btn-finish" id="goal-btn-finish" style="display:none;">✨ Start Learning!</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  addGoalModalStyles();
  attachGoalEventHandlers(userId);

  return modal;
}

function addGoalModalStyles() {
  if (document.getElementById('goal-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'goal-modal-styles';
  style.textContent = `
    .goal-setting-modal {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    .goal-modal-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
    }

    .goal-modal-content {
      position: relative;
      background: linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    }

    .goal-modal-header {
      padding: 2rem;
      border-bottom: 2px solid rgba(168, 85, 247, 0.3);
      text-align: center;
    }

    .goal-modal-header h2 {
      color: #e9d5ff;
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
    }

    .goal-modal-header p {
      color: #a78bfa;
      margin: 0;
      font-size: 0.95rem;
    }

    .goal-modal-body {
      flex: 1;
      padding: 2rem;
      position: relative;
    }

    .goal-step {
      animation: slideIn 0.3s ease;
    }

    .goal-step.hidden {
      display: none;
    }

    .goal-step h3 {
      color: #e9d5ff;
      margin: 0 0 1.5rem 0;
      font-size: 1.2rem;
    }

    .goal-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .goal-option-btn {
      background: rgba(168, 85, 247, 0.15);
      border: 2px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #e9d5ff;
    }

    .goal-option-btn:hover {
      background: rgba(168, 85, 247, 0.3);
      border-color: #a855f7;
      transform: translateY(-2px);
    }

    .goal-emoji {
      font-size: 2.5rem;
    }

    .goal-title {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .goal-topics {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .topic-item {
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      color: #e9d5ff;
    }

    .topic-item:hover {
      background: rgba(168, 85, 247, 0.2);
      border-color: #a855f7;
    }

    .topic-item.selected {
      background: rgba(168, 85, 247, 0.3);
      border-color: #a855f7;
    }

    .goal-durations {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .goal-duration-btn {
      background: rgba(168, 85, 247, 0.15);
      border: 2px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      padding: 1.5rem 1rem;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #e9d5ff;
    }

    .goal-duration-btn:hover {
      background: rgba(168, 85, 247, 0.3);
      border-color: #a855f7;
    }

    .goal-duration-btn.selected {
      background: #a855f7;
      border-color: #a855f7;
    }

    .duration-emoji {
      font-size: 1.8rem;
    }

    .duration-label {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .goal-input-area {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .goal-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(168, 85, 247, 0.3);
      color: #e9d5ff;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .goal-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .goal-add-btn {
      background: #a855f7;
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .goal-add-btn:hover {
      background: #9333ea;
    }

    .goals-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .goal-item {
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #e9d5ff;
    }

    .goal-item-remove {
      background: none;
      border: none;
      color: #f87171;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .goal-chatbot-helper {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 8px;
      border-left: 4px solid #a855f7;
    }

    .helper-avatar {
      font-size: 1.8rem;
      flex-shrink: 0;
    }

    .helper-message {
      color: #e9d5ff;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .goal-modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(168, 85, 247, 0.2);
      background: rgba(0, 0, 0, 0.2);
    }

    .goal-btn-back,
    .goal-btn-next,
    .goal-btn-finish {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .goal-btn-back {
      background: transparent;
      color: #a78bfa;
      border: 1px solid #a78bfa;
    }

    .goal-btn-back:hover {
      background: rgba(168, 85, 247, 0.1);
    }

    .goal-btn-next,
    .goal-btn-finish {
      background: #a855f7;
      color: white;
    }

    .goal-btn-next:hover,
    .goal-btn-finish:hover {
      background: #9333ea;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  document.head.appendChild(style);
}

function attachGoalEventHandlers(userId = null) {
  const state = {
    currentStep: 1,
    selectedPath: null,
    selectedTopic: null,
    selectedDuration: null,
    goals: []
  };

  const topics = {
    climate: [
      '🌱 Urban Heat Island Mitigation',
      '🌊 Coastal Erosion Solutions',
      '♻️ Circular Economy Design',
      '🌦️ Climate Adaptation Strategies',
      '🏗️ Sustainable Building Design'
    ],
    coding: [
      '🐍 Python Basics & Fundamentals',
      '🤖 AI & Machine Learning Intro',
      '📊 Data Analysis & Visualization',
      '🌐 Web Development Basics',
      '📱 Mobile App Development'
    ]
  };

  // Path selection
  document.querySelectorAll('.goal-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedPath = btn.dataset.path;
      renderTopics(state, topics[state.selectedPath]);
      goToStep(state, 2);
      updateHelperMessage(state, 'Great! Now choose a project topic that interests you.');
    });
  });

  // Topic selection
  document.addEventListener('click', (e) => {
    if (e.target.closest('.topic-item')) {
      const item = e.target.closest('.topic-item');
      document.querySelectorAll('.topic-item').forEach(t => t.classList.remove('selected'));
      item.classList.add('selected');
      state.selectedTopic = item.textContent.trim();
      updateHelperMessage(state, `Excellent choice! How long do you want to work on "${state.selectedTopic}"?`);
    }
  });

  // Duration selection
  document.querySelectorAll('.goal-duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.goal-duration-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedDuration = btn.dataset.days;
      goToStep(state, 4);
      updateHelperMessage(state, `Perfect! Now let's set specific, measurable goals for your ${btn.textContent.trim().toLowerCase()}.`);
    });
  });

  // Add goal
  document.getElementById('goal-add-btn').addEventListener('click', () => {
    const input = document.getElementById('goal-input');
    const goal = input.value.trim();
    if (goal) {
      state.goals.push(goal);
      input.value = '';
      renderGoals(state);
    }
  });

  document.getElementById('goal-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('goal-add-btn').click();
    }
  });

  // Navigation
  document.getElementById('goal-btn-back').addEventListener('click', () => {
    goToStep(state, state.currentStep - 1);
  });

  document.getElementById('goal-btn-next').addEventListener('click', () => {
    if (state.currentStep === 1 && !state.selectedPath) {
      updateHelperMessage(state, '⚠️ Please select a learning path first.');
      return;
    }
    if (state.currentStep === 2 && !state.selectedTopic) {
      updateHelperMessage(state, '⚠️ Please select a topic first.');
      return;
    }
    if (state.currentStep === 3 && !state.selectedDuration) {
      updateHelperMessage(state, '⚠️ Please select a duration first.');
      return;
    }
    goToStep(state, state.currentStep + 1);
  });

  document.getElementById('goal-btn-finish').addEventListener('click', () => {
    if (state.goals.length === 0) {
      updateHelperMessage(state, '⚠️ Please add at least one goal.');
      return;
    }
    finishGoalSetting(state);
  });

  function renderTopics(state, topicsList) {
    const list = document.getElementById('topic-list');
    list.innerHTML = topicsList.map(topic =>
      `<div class="topic-item">${topic}</div>`
    ).join('');
  }

  function renderGoals(state) {
    const list = document.getElementById('goals-list');
    list.innerHTML = state.goals.map((goal, i) =>
      `<div class="goal-item">
        <span>✅ ${goal}</span>
        <button class="goal-item-remove" onclick="removeGoal(${i})">×</button>
      </div>`
    ).join('');
  }

  function goToStep(state, step) {
    document.querySelectorAll('.goal-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`goal-step-${step}`).classList.remove('hidden');

    const backBtn = document.getElementById('goal-btn-back');
    const nextBtn = document.getElementById('goal-btn-next');
    const finishBtn = document.getElementById('goal-btn-finish');

    backBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.style.display = step < 4 ? 'block' : 'none';
    finishBtn.style.display = step === 4 ? 'block' : 'none';

    state.currentStep = step;
  }

  function updateHelperMessage(state, message) {
    document.getElementById('helper-message').textContent = message;
  }

  function finishGoalSetting(state) {
    const goalData = {
      learningPath: state.selectedPath,
      topic: state.selectedTopic,
      durationDays: parseInt(state.selectedDuration),
      goals: state.goals,
      createdAt: new Date().toISOString(),
      completedGoals: []
    };

    // Save to localStorage safely
    try {
      if (userId) {
        localStorage.setItem(`userGoals_${userId}`, JSON.stringify(goalData));
      }
      localStorage.setItem('userGoals', JSON.stringify(goalData));
      console.log('[Goals] Goals saved to localStorage:', goalData);
    } catch (e) {
      console.warn('[Goals] Could not save goals to localStorage:', e.message);
    }

    // Close modal
    document.getElementById('goal-setting-modal').remove();

    // Show success message
    const success = document.createElement('div');
    success.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:1rem 2rem;border-radius:8px;font-weight:600;z-index:2001;animation:slideIn 0.3s ease;';
    success.textContent = '✨ Goals set! Let\'s get started!';
    document.body.appendChild(success);
    setTimeout(() => success.remove(), 3000);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('goalsSet', { detail: goalData }));
  }

  // Make removeGoal available globally
  window.removeGoal = (index) => {
    state.goals.splice(index, 1);
    renderGoals(state);
  };
}

export default { createGoalSettingModal };
