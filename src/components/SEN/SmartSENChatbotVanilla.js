/**
 * Smart SEN Chatbot (Vanilla JS)
 * Activity-Aware and Progress-Tracking AI Learning Assistant
 */

import { db, doc, updateDoc, setDoc, arrayUnion, increment } from '../../firebase.js';
import geminiApi from '../../services/geminiApi.js';

export class SmartSENChatbot {
  constructor(options = {}) {
    this.userId = options.userId || 'anonymous';
    this.senEnabled = options.senEnabled || false;
    this.autoTrigger = options.autoTrigger !== false;
    this.containerId = options.containerId || 'sen-chatbot-container';

    this.isOpen = false;
    this.isAutoTriggered = false;
    this.conversation = [];
    this.currentTask = null;
    this.struggleData = null;

    // Try to find or create container
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.containerId;
      document.body.appendChild(this.container);
    }

    this.render();
    this.attachEventListeners();
  }

  /**
   * Dynamically detect current activity, current tab, and user progress from DOM/window
   */
  getActivityContext() {
    // 1. Check window global override if set by active component
    if (window.__CURRENT_ACTIVITY_CONTEXT__) {
      return window.__CURRENT_ACTIVITY_CONTEXT__;
    }

    const hash = window.location.hash || '';
    let activity = 'solar-car';
    let tab = 'build';

    if (hash.includes('solar-car') || hash.includes('solar') || document.querySelector('.solar-car-container')) {
      activity = 'solar-car';
    } else if (hash.includes('bunker') || document.querySelector('.bunker-container')) {
      activity = 'bunker';
    } else if (hash.includes('urban-heat') || hash.includes('phase1') || document.querySelector('.heat-container')) {
      activity = 'urban-heat';
    } else if (hash.includes('coding') || document.querySelector('.coding-container')) {
      activity = 'coding';
    } else if (hash.includes('bangkok') || document.querySelector('.bangkok-container')) {
      activity = 'bangkok';
    }

    // Active tab detection
    const activeTabEl = document.querySelector('.tab-btn.active, .nav-tab.active, [data-tab].active, button.active');
    if (activeTabEl) {
      tab = (activeTabEl.textContent || activeTabEl.getAttribute('data-tab') || 'build').trim().toLowerCase();
    }

    let progress = {};

    if (activity === 'solar-car') {
      const chassis = document.querySelector('#selected-chassis-name, [data-category="chassis"] .selected, #chassis-select')?.textContent || 'Aluminum Frame';
      const motor = document.querySelector('#selected-motor-name, [data-category="motor"] .selected, #motor-select')?.textContent || 'Brushed DC Motor';
      const battery = document.querySelector('#selected-battery-name, [data-category="battery"] .selected')?.textContent || 'Li-ion 2x18650';
      const solarPanel = document.querySelector('#selected-solar-name, [data-category="solarPanel"] .selected')?.textContent || '30W Top-Mounted';

      const weightText = document.querySelector('.total-weight, #total-weight, [data-metric="weight"]')?.textContent || '3200g';
      const powerText = document.querySelector('.power-output, #power-output, [data-metric="power"]')?.textContent || '30W';
      const ratioText = document.querySelector('.efficiency-ratio, #efficiency-ratio, [data-metric="ratio"]')?.textContent || '9.4 W/kg';
      const scoreText = document.querySelector('.total-score, #total-score')?.textContent || '72';

      progress = {
        activity: 'Solar Car Challenge',
        tab,
        componentsSelected: { chassis, motor, battery, solarPanel },
        totalWeight: weightText,
        powerOutput: powerText,
        efficiencyRatio: ratioText,
        totalScore: scoreText,
        iterationsCount: parseInt(localStorage.getItem('solar_car_iterations') || '1', 10)
      };
    } else if (activity === 'urban-heat') {
      const greenRoofs = document.querySelector('#green-roofs-slider, [data-slider="green-roofs"]')?.value || '30';
      const treeCanopy = document.querySelector('#tree-canopy-slider, [data-slider="tree-canopy"]')?.value || '25';
      const utci = document.querySelector('#utci-value, .utci-display')?.textContent || '38°C (Extreme Heat)';
      const cooling = document.querySelector('#cooling-achieved, .cooling-value')?.textContent || '1.8°C reduction';

      progress = {
        activity: 'Urban Heat Island Mitigation',
        tab,
        greenRoofs: `${greenRoofs}%`,
        treeCanopy: `${treeCanopy}%`,
        utciIndex: utci,
        coolingAchieved: cooling,
        iterationsCount: parseInt(localStorage.getItem('urban_heat_iterations') || '1', 10)
      };
    } else if (activity === 'bunker') {
      const hull = document.querySelector('#hull-select, [data-component="hull"]')?.value || 'Reinforced Steel';
      const airSystem = document.querySelector('#air-select, [data-component="air"]')?.value || 'HEPA Filter';
      const survivalScore = document.querySelector('#survival-score, .survival-score')?.textContent || '75/100';

      progress = {
        activity: 'Bunker Survival Challenge',
        tab,
        currentStage: 1,
        hull,
        airSystem,
        survivalScore,
        iterationsCount: parseInt(localStorage.getItem('bunker_iterations') || '1', 10)
      };
    } else {
      progress = {
        activity,
        tab,
        iterationsCount: 1
      };
    }

    return { activity, tab, progress, userId: this.userId };
  }

  /**
   * Log interaction to Firestore under users/{userId}/activityProgress/{activityId}
   */
  async logInteraction(buttonClicked, userPrompt = '', responseText = '') {
    if (!this.userId || this.userId === 'anonymous') return;
    const context = this.getActivityContext();
    const activityId = context.activity || 'solar-car';

    try {
      const progressRef = doc(db, 'users', this.userId, 'activityProgress', activityId);
      const logData = {
        lastHelpRequested: buttonClicked,
        helpRequestCount: increment(1),
        lastHelpAt: Date.now(),
        helpRequestHistory: arrayUnion({
          type: buttonClicked,
          topic: context.tab || 'build',
          timestamp: Date.now(),
          userPrompt: userPrompt || '',
          responseSnippet: responseText ? responseText.substring(0, 200) : ''
        })
      };

      await updateDoc(progressRef, logData).catch(async () => {
        await setDoc(progressRef, {
          activityId,
          createdAt: Date.now(),
          ...logData
        }, { merge: true });
      });
    } catch (err) {
      console.warn('[SmartSENChatbot] Firestore interaction log notice:', err.message);
    }
  }

  /**
   * Build context-specific prompt for Gemini AI
   */
  buildContextPrompt(context, action, userQuestion = '') {
    const { activity, tab, progress } = context;
    const progressStr = JSON.stringify(progress || {}, null, 2);

    const prompts = {
      'solar-car': {
        hint: `Student is on '${tab}' tab building a solar car.
Components: ${JSON.stringify(progress?.componentsSelected || {})}
Current weight: ${progress?.totalWeight || '3200g'}
Power output: ${progress?.powerOutput || '30W'}
Efficiency ratio: ${progress?.efficiencyRatio || '9.4 W/kg'}
Iterations: ${progress?.iterationsCount || 1}
Provide a SHORT, specific hint (1-2 sentences) referencing their exact chosen components (e.g. ${progress?.componentsSelected?.chassis || 'aluminum chassis'} + ${progress?.componentsSelected?.motor || 'brushed DC motor'}). Suggest a concrete swap like carbon fiber or BLDC motor to boost W/kg ratio.`,

        explain: `Explain efficiency ratio and mechanics using their specific data.
Their power output: ${progress?.powerOutput || '30W'}
Their total weight: ${progress?.totalWeight || '3.2kg'}
Their ratio: ${progress?.efficiencyRatio || '9.4 W/kg'}
Walk through their calculation: Power(W) ÷ Weight(kg) = Efficiency (W/kg). Show how top teams reach 15+ W/kg with carbon chassis + BLDC motor.`,

        example: `Show an optimized example similar to their CURRENT design:
Current setup: ${JSON.stringify(progress?.componentsSelected || {})} (${progress?.totalWeight || '3.2kg'}, ${progress?.efficiencyRatio || '9.4 W/kg'}).
Create a comparison showing 1-2 component swaps (e.g. aluminum 1800g → carbon 900g), showing weight drop and efficiency jump (e.g. 9.4 → 15.6 W/kg).`,

        encouragement: `They've done ${progress?.iterationsCount || 1} iterations on the '${tab}' tab of Solar Car activity.
Current efficiency ratio: ${progress?.efficiencyRatio || '9.4 W/kg'}.
Give encouraging words + suggest what to try next based on their progress (e.g., test aerodynamics or optimize chassis weight).`
      },

      'bunker': {
        hint: `Student is building bunker at Stage ${progress?.currentStage || 1}.
Hull: ${progress?.hull || 'Steel'}
Air scrubber: ${progress?.airSystem || 'Standard'}
Survival score: ${progress?.survivalScore || '75/100'}
Give specific hint to upgrade survival score.`,

        explain: `Explain bunker mechanics using their choices (Hull: ${progress?.hull}, Air: ${progress?.airSystem}, Score: ${progress?.survivalScore}).`,

        example: `Show an optimized bunker design improving on: Hull ${progress?.hull} and Air ${progress?.airSystem}.`,

        encouragement: `Encourage student on bunker Stage ${progress?.currentStage || 1} with score ${progress?.survivalScore}. Suggest next upgrade.`
      },

      'urban-heat': {
        hint: `Student mitigating heat in Townsville (tab: '${tab}').
Green roofs: ${progress?.greenRoofs || '30%'}
Tree canopy: ${progress?.treeCanopy || '25%'}
Cooling: ${progress?.coolingAchieved || '1.8°C reduction'}
Give a specific next optimization hint referencing their exact numbers.`,

        explain: `Explain urban heat cooling mechanics using their data (Green roofs ${progress?.greenRoofs}, Tree canopy ${progress?.treeCanopy}, UTCI ${progress?.utciIndex}).`,

        example: `Show an optimized heat mitigation setup improving on their ${progress?.greenRoofs} green roofs to achieve 3°C+ reduction.`,

        encouragement: `Encourage student with ${progress?.coolingAchieved} cooling achieved. Suggest next feature to add.`
      }
    };

    const activityPrompts = prompts[activity] || {
      hint: `Student is on '${tab}' tab in ${activity} activity. Progress: ${progressStr}. Provide a SHORT, specific hint (1-2 sentences) referencing their choices.`,
      explain: `Explain the mechanics of ${activity} using student's current state: ${progressStr}.`,
      example: `Show an optimized example design for ${activity} similar to: ${progressStr}.`,
      encouragement: `Encourage student in ${activity} on tab '${tab}'. Suggest next step based on: ${progressStr}.`
    };

    if (action === 'custom_question') {
      return `Student is working on ${activity} activity (tab: '${tab}').
Their progress data: ${progressStr}.

They asked: "${userQuestion}"

Answer their question specifically about their current activity and choices.
Reference their specific component selections or current metrics.
Do NOT give generic advice.`;
    }

    return activityPrompts[action] || activityPrompts['hint'];
  }

  render() {
    this.container.innerHTML = `
      <div class="sen-chatbot-fab" id="sen-fab">
        <button class="sen-fab-button" id="sen-fab-btn">
          <span class="sen-fab-icon">💬</span>
          <span class="sen-fab-label">Ask for Help</span>
        </button>
      </div>

      <div class="sen-chatbot-modal hidden" id="sen-modal">
        <div class="sen-modal-content">
          <div class="sen-modal-header">
            <h2>🤖 Smart Learning Assistant</h2>
            <button class="sen-close-btn" id="sen-close-btn">&times;</button>
          </div>

          <div class="sen-conversation-area" id="sen-conversation">
            <!-- Messages will be added here -->
          </div>

          <div class="sen-quick-actions" id="sen-quick-actions">
            <button class="sen-action-btn" data-action="hint">💭 Hint</button>
            <button class="sen-action-btn" data-action="explain">📚 Explain</button>
            <button class="sen-action-btn" data-action="example">✨ Example</button>
            <button class="sen-action-btn" data-action="keep-trying">✋ Keep Trying</button>
          </div>

          <div class="sen-input-area">
            <input type="text" id="sen-input" placeholder="Ask another question..." />
            <button class="sen-send-btn" id="sen-send-btn">Send</button>
          </div>

          <div class="sen-feedback" id="sen-feedback" style="display: none;"></div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    if (!document.getElementById('sen-chatbot-styles')) {
      const style = document.createElement('style');
      style.id = 'sen-chatbot-styles';
      style.textContent = `
        .sen-chatbot-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .sen-fab-button {
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
          transition: all 0.3s ease;
          position: relative;
        }

        .sen-fab-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
        }

        .sen-fab-label {
          position: absolute;
          bottom: -30px;
          white-space: nowrap;
          font-size: 12px;
          background: #1e293b;
          padding: 4px 8px;
          border-radius: 4px;
          display: none;
        }

        .sen-fab-button:hover .sen-fab-label {
          display: block;
        }

        .sen-chatbot-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-end;
          z-index: 1001;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .sen-chatbot-modal.hidden {
          display: none;
        }

        .sen-modal-content {
          background: linear-gradient(135deg, #1e1b4b 0%, #2e1065 100%);
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          max-height: 600px;
          box-shadow: 0 -5px 40px rgba(0, 0, 0, 0.3);
        }

        .sen-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        }

        .sen-modal-header h2 {
          margin: 0;
          color: #e9d5ff;
          font-size: 1.2rem;
        }

        .sen-close-btn {
          background: none;
          border: none;
          color: #a78bfa;
          font-size: 28px;
          cursor: pointer;
        }

        .sen-conversation-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sen-message {
          display: flex;
          gap: 0.5rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sen-message.user {
          justify-content: flex-end;
        }

        .sen-message-bubble {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          line-height: 1.5;
          font-size: 0.95rem;
          white-space: pre-line;
        }

        .sen-message.assistant .sen-message-bubble {
          background: rgba(168, 85, 247, 0.2);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #e9d5ff;
        }

        .sen-message.user .sen-message-bubble {
          background: #a855f7;
          color: white;
        }

        .sen-quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          padding: 1rem;
          border-top: 1px solid rgba(168, 85, 247, 0.2);
        }

        .sen-action-btn {
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #e9d5ff;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .sen-action-btn:hover {
          background: rgba(168, 85, 247, 0.3);
          border-color: rgba(168, 85, 247, 0.5);
        }

        .sen-input-area {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid rgba(168, 85, 247, 0.2);
        }

        .sen-input-area input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          outline: none;
          font-size: 0.9rem;
        }

        .sen-input-area input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .sen-input-area input:focus {
          border-color: #a855f7;
        }

        .sen-send-btn {
          background: #a855f7;
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .sen-send-btn:hover {
          background: #9333ea;
        }

        .sen-feedback {
          padding: 0.75rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border-top: 1px solid rgba(34, 197, 94, 0.3);
          color: #86efac;
          font-size: 0.85rem;
          border-radius: 0 0 16px 0;
        }

        @media (max-width: 640px) {
          .sen-modal-content {
            max-width: 100%;
            border-radius: 16px 16px 0 0;
          }

          .sen-quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  attachEventListeners() {
    // FAB button toggle
    document.getElementById('sen-fab-btn').addEventListener('click', () => {
      this.toggle();
    });

    // Close button
    document.getElementById('sen-close-btn').addEventListener('click', () => {
      this.close();
    });

    // Quick action buttons
    document.querySelectorAll('.sen-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Send button & input
    document.getElementById('sen-send-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('sen-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    document.getElementById('sen-modal').classList.remove('hidden');
    if (this.conversation.length === 0) {
      const context = this.getActivityContext();
      this.addMessage(`Hi! I'm your Smart Learning Assistant. I see you're working on ${context.activity} (Tab: ${context.tab}). How can I help you?`, 'assistant');
    }
  }

  close() {
    this.isOpen = false;
    document.getElementById('sen-modal').classList.add('hidden');
  }

  autoOpen(struggleData) {
    this.struggleData = struggleData;
    this.isAutoTriggered = true;

    setTimeout(() => {
      if (!this.isOpen) {
        this.open();
        this.showAutoTriggeredMessage(struggleData);
      }
    }, 2000);
  }

  showAutoTriggeredMessage(data) {
    const context = this.getActivityContext();
    const taskTitle = data?.taskTitle || context.activity;
    const message = `I noticed you've been working on ${taskTitle} for a while. Would you like some tailored help based on your current choices? Select a button below!`;
    this.addMessage(message, 'assistant');
  }

  async handleQuickAction(action) {
    const context = this.getActivityContext();

    if (action === 'keep-trying') {
      this.setFeedback('Generating encouragement...');
      try {
        const prompt = this.buildContextPrompt(context, 'encouragement');
        const responseText = await geminiApi.generateContextualResponse(prompt, 'You are an encouraging STEM mentor.');
        this.addMessage(responseText, 'assistant');
        this.setFeedback('Keep up the great work! 💪', 'success');
        this.logInteraction('keep-trying', prompt, responseText);
      } catch (err) {
        this.addMessage(`Good start on your design! Keep testing different configurations to see what gives the best efficiency. You've got this! 💪`, 'assistant');
        this.setFeedback('Encouragement ready!', 'success');
      }
      return;
    }

    if (action === 'hint') {
      await this.getHint(context);
    } else if (action === 'explain') {
      await this.getExplanation(context);
    } else if (action === 'example') {
      await this.getExample(context);
    }
  }

  async getHint(context) {
    this.setFeedback('Analyzing your activity context for a hint...');
    try {
      const prompt = this.buildContextPrompt(context, 'hint');
      const hintText = await geminiApi.generateContextualResponse(
        prompt,
        'You are a smart STEM learning assistant. Give a short, context-specific hint referencing the student\'s exact choices.'
      );
      this.addMessage(hintText, 'assistant');
      this.setFeedback('Smart hint ready!', 'success');
      this.logInteraction('hint', prompt, hintText);
    } catch (error) {
      this.addMessage(`Hint: Try evaluating your total chassis weight versus motor output to increase efficiency.`, 'assistant');
      this.setFeedback('Hint delivered', 'success');
    }
  }

  async getExplanation(context) {
    this.setFeedback('Calculating mechanics explanation based on your selections...');
    try {
      const prompt = this.buildContextPrompt(context, 'explain');
      const explainText = await geminiApi.generateContextualResponse(
        prompt,
        'You are a STEM tutor explaining mechanics using the student\'s exact data and choices.'
      );
      this.addMessage(explainText, 'assistant');
      this.setFeedback('Explanation ready!', 'success');
      this.logInteraction('explain', prompt, explainText);
    } catch (error) {
      this.addMessage(`Explanation: Efficiency is calculated as Power (W) divided by Weight (kg). Reducing chassis weight gives direct efficiency gains.`, 'assistant');
      this.setFeedback('Explanation delivered', 'success');
    }
  }

  async getExample(context) {
    this.setFeedback('Generating optimized example configuration...');
    try {
      const prompt = this.buildContextPrompt(context, 'example');
      const exampleText = await geminiApi.generateContextualResponse(
        prompt,
        'You are a STEM engineering assistant showing optimized comparisons based on the student\'s current choices.'
      );
      this.addMessage(exampleText, 'assistant');
      this.setFeedback('Example provided!', 'success');
      this.logInteraction('example', prompt, exampleText);
    } catch (error) {
      this.addMessage(`Example Optimization:\n- Swapped Aluminum Frame (1800g) → Carbon Fiber Tube (900g)\n- Swapped Brushed DC → BLDC Motor (350g, 75W)\n- Result: Saved 1000g and boosted efficiency ratio significantly!`, 'assistant');
      this.setFeedback('Example delivered', 'success');
    }
  }

  async sendMessage() {
    const input = document.getElementById('sen-input');
    const message = input.value.trim();

    if (!message) return;

    this.addMessage(message, 'user');
    input.value = '';

    const context = this.getActivityContext();
    this.setFeedback('Thinking about your design...');

    try {
      const prompt = this.buildContextPrompt(context, 'custom_question', message);
      const responseText = await geminiApi.generateContextualResponse(
        prompt,
        'You are a smart STEM learning assistant. Answer the student\'s question specifically about their current activity and selections.'
      );

      this.addMessage(responseText, 'assistant');
      this.setFeedback('Answer ready!', 'success');
      this.logInteraction('custom_question', message, responseText);
    } catch (error) {
      this.addMessage(`That's a great question about your ${context.activity} design! Try adjusting your component selections or testing your prototype to see immediate performance metrics.`, 'assistant');
      this.setFeedback('Answer ready', 'success');
    }
  }

  addMessage(text, sender) {
    const conversation = document.getElementById('sen-conversation');
    if (!conversation) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `sen-message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'sen-message-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    conversation.appendChild(messageDiv);

    conversation.scrollTop = conversation.scrollHeight;
    this.conversation.push({ sender, text });
  }

  setFeedback(message, type = 'info') {
    const feedback = document.getElementById('sen-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.style.display = 'block';

    if (type === 'error') {
      feedback.style.background = 'rgba(239, 68, 68, 0.1)';
      feedback.style.color = '#fca5a5';
      feedback.style.borderTopColor = 'rgba(239, 68, 68, 0.3)';
    } else if (type === 'success') {
      feedback.style.background = 'rgba(34, 197, 94, 0.1)';
      feedback.style.color = '#86efac';
      feedback.style.borderTopColor = 'rgba(34, 197, 94, 0.3)';
    }

    setTimeout(() => {
      if (feedback) feedback.style.display = 'none';
    }, 3000);
  }

  setCurrentTask(taskId, taskTitle) {
    this.currentTask = { id: taskId, title: taskTitle };
  }

  clear() {
    this.conversation = [];
    const conversation = document.getElementById('sen-conversation');
    if (conversation) conversation.innerHTML = '';
  }
}

export default SmartSENChatbot;
