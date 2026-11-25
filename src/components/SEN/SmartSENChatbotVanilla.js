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
    this.voiceEnabled = false;
    this.isListening = false;
    this.recognition = null;
    this.pendingImage = null;

    // Try to find or create container
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = this.containerId;
      document.body.appendChild(this.container);
    }

    this.render();
    this.attachEventListeners();
    window.openSparkAssistant = () => this.open();
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
    let activity = 'learning-hub';
    let tab = 'overview';

    if (hash.includes('solar-car') || hash.includes('solar') || document.querySelector('.solar-car-container')) {
      activity = 'solar-car';
      tab = 'build';
    } else if (hash.includes('bunker') || document.querySelector('.bunker-container')) {
      activity = 'bunker';
      tab = 'build';
    } else if (hash.includes('urban-heat') || hash.includes('phase1') || document.querySelector('.heat-container')) {
      activity = 'urban-heat';
      tab = 'build';
    } else if (hash.includes('coding') || document.querySelector('.coding-container')) {
      activity = 'coding';
      tab = 'build';
    } else if (hash.includes('bangkok') || document.querySelector('.bangkok-container')) {
      activity = 'bangkok';
      tab = 'build';
    } else if (hash.includes('dashboard') || document.querySelector('.sd-root, .md-root')) {
      activity = 'student-dashboard';
      tab = 'My Quests';
    }

    // Active tab detection
    const activeTabEl = document.querySelector('.tab-btn.active, .nav-tab.active, [data-tab].active, button.active');
    if (activeTabEl && activity !== 'student-dashboard') {
      tab = (activeTabEl.textContent || activeTabEl.getAttribute('data-tab') || tab).trim().toLowerCase();
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
   * Format student dashboard context (PBL projects, term project, goals, checklist, strengths)
   * into readable plain-text lines for AI prompts.
   */
  formatDashboardContext(progress = {}) {
    const lines = [];
    if (progress.studentName) lines.push(`Student name: ${progress.studentName}`);
    if (progress.tab) lines.push(`Dashboard section: ${progress.tab}`);

    const courses = Array.isArray(progress.pblCourses) ? progress.pblCourses : [];
    if (courses.length > 0) {
      const courseLines = courses.map((c) => {
        const pct = Number.isFinite(c.progressPct) ? `${c.progressPct}%` : 'in progress';
        const stage = c.currentStage ? `Stage: ${c.currentStage}` : '';
        const next = c.nextStep ? `Next: ${c.nextStep}` : '';
        const task = c.nextTask ? `Task: ${c.nextTask}` : '';
        const ev = c.evidenceToCollect ? `Evidence: ${c.evidenceToCollect}` : '';
        return `- ${c.title} (${pct})${[stage, next, task, ev].filter(Boolean).join(' | ')}`;
      });
      lines.push(`Active PBL Projects:\n${courseLines.join('\n')}`);
    } else {
      lines.push('Active PBL Projects: None started yet.');
    }

    if (progress.termProject) {
      const tp = progress.termProject;
      const parts = [
        tp.currentPhase ? `Phase: ${tp.currentPhase}` : '',
        tp.hmw ? `HMW: "${tp.hmw}"` : '',
        tp.who ? `For: ${tp.who}` : '',
        `Evidence items: ${tp.evidenceCount || 0}`
      ].filter(Boolean);
      lines.push(`Term PBL Project: ${parts.join(' | ')}`);
    }

    const goals = Array.isArray(progress.goals) ? progress.goals : [];
    if (goals.length > 0) {
      const goalLines = goals.map((g) => {
        const status = g.done ? 'Done' : `${g.stepsDone || 0}/${g.stepsTotal || 0} steps`;
        const show = g.showHow ? ` (Show via: ${g.showHow})` : '';
        const next = g.nextStep ? ` -> Next step: "${g.nextStep}"` : '';
        return `- "${g.explore}" [${status}]${show}${next}`;
      });
      lines.push(`Student Goals:\n${goalLines.join('\n')}`);
    } else {
      lines.push('Student Goals: None set yet.');
    }

    if (progress.todayChecklist && progress.todayChecklist.total > 0) {
      const tc = progress.todayChecklist;
      const rem = (tc.remaining || []).length ? ` Remaining: ${tc.remaining.join('; ')}` : ' All done for today!';
      lines.push(`Today's Checklist: ${tc.completed}/${tc.total} done.${rem}`);
    }

    if (progress.focusSkill?.skill) {
      lines.push(`Focus Skill: ${progress.focusSkill.skill}${progress.focusSkill.habit ? ` (Habit: ${progress.focusSkill.habit})` : ''}`);
    }
    if (Array.isArray(progress.strengths) && progress.strengths.length > 0) {
      lines.push(`Strengths: ${progress.strengths.join(', ')}`);
    }
    if (progress.academic?.edmentumStatus === 'connected') {
      const ac = progress.academic;
      const bits = [
        Number.isFinite(ac.overallProgressPercent) ? `${ac.overallProgressPercent}% overall` : '',
        Number.isFinite(ac.averageCurrentGrade) ? `avg grade ${ac.averageCurrentGrade}%` : ''
      ].filter(Boolean);
      if (bits.length > 0) lines.push(`Academic Progress (Edmentum): ${bits.join(', ')}`);
    }
    if (Array.isArray(progress.coachFeedback) && progress.coachFeedback.length > 0) {
      const latest = progress.coachFeedback[0];
      const msg = latest.feedbackText ? `"${latest.feedbackText.slice(0, 140)}"` : (Number.isFinite(latest.rating) ? `Rated ${latest.rating}/5` : '');
      if (msg) lines.push(`Latest Coach Feedback (${latest.coachName || 'Coach'}): ${msg}`);
    }
    if (progress.nextRecommendedStep?.title) {
      lines.push(`Suggested Next Step: "${progress.nextRecommendedStep.title}" (${progress.nextRecommendedStep.source})`);
    }
    return lines.join('\n');
  }

  /**
   * Build a concise (< 800 chars, server-enforced limit) system instruction
   * giving Gemini a warm, natural learning-coach persona and live context.
   */
  buildCoachSystemPrompt(context, action = 'custom_question') {
    const { activity, tab, progress = {} } = context || {};
    const persona =
      'You are a warm, natural, supportive learning coach talking with a student. ' +
      'Respond conversationally in 2-4 concise sentences (avoid robotic templates or long lectures). ' +
      'Celebrate effort, reference their actual PBL project and personal goals when relevant, and end with one helpful next step or gentle question.';

    if (activity === 'student-dashboard') {
      const bits = [`Screen: Student Dashboard (${tab})`];
      if (progress.studentName) bits.push(`Student: ${progress.studentName}`);
      const c = progress.pblCourses?.[0];
      if (c) bits.push(`PBL: ${c.title}${Number.isFinite(c.progressPct) ? ` (${c.progressPct}%)` : ''}${c.nextStep ? `, next: ${c.nextStep}` : ''}`);
      if (progress.termProject?.hmw) bits.push(`Term HMW: ${progress.termProject.hmw}`);
      const g = progress.goals?.[0];
      if (g) bits.push(`Goal: ${g.explore}${g.nextStep ? ` (next: ${g.nextStep})` : ''}`);
      if (progress.focusSkill?.skill) bits.push(`Focus skill: ${progress.focusSkill.skill}`);
      return `${persona}\n${bits.join(' | ')}`.slice(0, 780);
    }

    return `${persona}\nActivity: ${activity} (Tab: ${tab}, Action: ${action}).`.slice(0, 780);
  }

  /**
   * Build a warm, context-aware welcome message when opening the assistant.
   */
  buildWelcomeMessage(context) {
    const { activity, tab, progress = {} } = context || {};
    if (activity === 'student-dashboard') {
      const greeting = progress.studentName ? `Hi ${progress.studentName}!` : 'Hi there!';
      const pbl = progress.pblCourses?.[0];
      const termHmw = progress.termProject?.hmw;
      const goals = progress.goals || [];
      const openGoals = goals.filter((g) => !g.done);

      const parts = [greeting, "I'm your Learning Coach."];
      if (pbl) {
        const pct = Number.isFinite(pbl.progressPct) ? ` (${pbl.progressPct}% through)` : '';
        parts.push(`I see you're working on "${pbl.title}"${pct}.`);
      } else if (termHmw) {
        parts.push(`I see your term project is "${termHmw}".`);
      }

      if (openGoals.length > 0) {
        parts.push(`You also have ${openGoals.length} active goal${openGoals.length > 1 ? 's' : ''} like "${openGoals[0].explore}".`);
      }

      parts.push('What would you like to brainstorm, unpack, or tackle together today?');
      return parts.join(' ');
    }

    return `Hi! I'm your Learning Coach. I see you're working on ${activity} (${tab}). What are you thinking through right now?`;
  }

  /**
   * Include the last few turns so follow-up questions feel natural.
   */
  recentHistoryText() {
    const recent = this.conversation.slice(-4);
    if (recent.length <= 1) return '';
    return recent
      .map((m) => `${m.sender === 'user' ? 'Student' : 'Coach'}: ${m.text}`)
      .join('\n');
  }

  /**
   * Return structured conversation history for multi-turn Gemini calls,
   * excluding the auto-generated welcome template so it does not bias
   * the student's first real question toward a program script.
   */
  getHistoryForApi(maxTurns = 8) {
    return this.conversation
      .filter((m) => !m.isWelcome && typeof m.text === 'string' && m.text.trim())
      .slice(-maxTurns)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));
  }

  /**
   * Build context-specific prompt for Gemini AI
   */
  buildContextPrompt(context, action, userQuestion = '') {
    const { activity, tab, progress } = context;
    const progressStr = JSON.stringify(progress || {}, null, 2);

    if (activity === 'student-dashboard') {
      const dashboardSummary = this.formatDashboardContext(progress);
      const history = this.recentHistoryText();
      const historyBlock = history ? `\nRecent chat:\n${history}\n` : '';

      const dashboardPrompts = {
        hint: `${dashboardSummary}\n\nGive the student one short, encouraging, concrete next micro-step (2-3 sentences) they can do right now for their active PBL project or today's goal checklist. Speak like a warm coach.`,
        explain: `${dashboardSummary}\n\nUnpack their current PBL stage/next step or focus skill in clear, friendly language (3-4 sentences), connecting it to why it matters and one of their strengths.`,
        example: `${dashboardSummary}\n\nShare a concrete, relatable example of what a good next step or piece of evidence looks like for their current PBL project or goal (3-4 sentences).`,
        encouragement: `${dashboardSummary}\n\nCelebrate their specific progress and strengths so far, and suggest one low-pressure win they can aim for next (2-3 sentences).`
      };

      if (action === 'custom_question') {
        return `${dashboardSummary}${historyBlock}\nThe student says: "${userQuestion}"\n\nReply naturally as their learning coach. Connect your answer to their actual PBL project, goals, or strengths when helpful, and ask at most one gentle follow-up question.`;
      }

      return dashboardPrompts[action] || dashboardPrompts.hint;
    }

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
      const history = this.recentHistoryText();
      const historyBlock = history ? `\nRecent chat:\n${history}\n` : '';
      return `Student is working on ${activity} activity (tab: '${tab}').
Their progress data: ${progressStr}.
${historyBlock}
They asked: "${userQuestion}"

Answer their question naturally as a supportive learning coach, referencing their current activity and choices.`;
    }

    return activityPrompts[action] || activityPrompts['hint'];
  }

  render() {
    this.container.innerHTML = `
      <div class="sen-chatbot-fab" id="sen-fab">
        <button class="sen-fab-button" id="sen-fab-btn" aria-label="Spark AI Assistant" title="Spark AI Assistant">
          <span class="sen-fab-icon">✨</span>
          <span class="sen-fab-label">Spark AI</span>
        </button>
      </div>

      <div class="sen-chatbot-modal hidden" id="sen-modal">
        <div class="sen-modal-content">
          <div class="sen-modal-header">
            <h2>✨ Spark AI Assistant</h2>
            <div class="sen-header-actions">
              <button type="button" class="sen-voice-toggle" id="sen-voice-toggle-btn" aria-pressed="false" title="Toggle Voice AI read-aloud">🔊 Voice Off</button>
              <button type="button" class="sen-close-btn" id="sen-close-btn" aria-label="Close">&times;</button>
            </div>
          </div>

          <div class="sen-conversation-area" id="sen-conversation">
            <!-- Messages will be added here -->
          </div>

          <div class="sen-quick-actions" id="sen-quick-actions">
            <button type="button" class="sen-action-btn" data-action="hint">💭 Hint</button>
            <button type="button" class="sen-action-btn" data-action="explain">📚 Explain</button>
            <button type="button" class="sen-action-btn" data-action="example">✨ Example</button>
            <button type="button" class="sen-action-btn" data-action="keep-trying">✋ Keep Trying</button>
          </div>

          <div class="sen-attachment-preview hidden" id="sen-attachment-preview">
            <img id="sen-attachment-thumb" alt="Attached screenshot preview" />
            <span class="sen-attachment-name" id="sen-attachment-name"></span>
            <button type="button" class="sen-attachment-remove" id="sen-attachment-remove" aria-label="Remove screenshot">&times;</button>
          </div>

          <div class="sen-input-area">
            <input type="file" id="sen-file-input" accept="image/png,image/jpeg,image/webp" hidden />
            <button type="button" class="sen-icon-btn" id="sen-attach-btn" title="Attach or paste a screenshot" aria-label="Attach screenshot">📎</button>
            <button type="button" class="sen-icon-btn" id="sen-mic-btn" title="Speak to Spark AI" aria-label="Voice input" aria-pressed="false">🎤</button>
            <input type="text" id="sen-input" placeholder="Ask Spark anything, paste a screenshot, or use mic..." />
            <button type="button" class="sen-send-btn" id="sen-send-btn">Send</button>
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

        .sen-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sen-voice-toggle {
          background: rgba(168, 85, 247, 0.18);
          border: 1px solid rgba(168, 85, 247, 0.4);
          color: #e9d5ff;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sen-voice-toggle.active {
          background: #a855f7;
          border-color: #c084fc;
          color: #ffffff;
        }

        .sen-attachment-preview {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 1rem;
          background: rgba(15, 23, 42, 0.55);
          border-top: 1px solid rgba(168, 85, 247, 0.25);
        }

        .sen-attachment-preview.hidden {
          display: none;
        }

        .sen-attachment-preview img {
          width: 44px;
          height: 44px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid rgba(168, 85, 247, 0.45);
        }

        .sen-attachment-name {
          flex: 1;
          font-size: 0.82rem;
          color: #e9d5ff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sen-attachment-remove {
          background: none;
          border: none;
          color: #fca5a5;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 0.25rem;
        }

        .sen-input-area {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.85rem 1rem;
          border-top: 1px solid rgba(168, 85, 247, 0.2);
        }

        .sen-icon-btn {
          background: rgba(168, 85, 247, 0.18);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #e9d5ff;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .sen-icon-btn:hover {
          background: rgba(168, 85, 247, 0.35);
        }

        .sen-icon-btn.listening {
          background: #dc2626;
          border-color: #f87171;
          color: #ffffff;
          animation: senPulse 1.2s infinite;
        }

        @keyframes senPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }

        #sen-modal .sen-input-area input#sen-input {
          flex: 1;
          min-width: 0;
          background: #ffffff !important;
          background-color: #ffffff !important;
          border: 1px solid rgba(168, 85, 247, 0.55) !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          caret-color: #111827 !important;
          padding: 0.6rem 0.9rem;
          border-radius: 8px;
          outline: none;
          font-size: 0.9rem;
        }

        #sen-modal .sen-input-area input#sen-input::placeholder {
          color: #6b7280 !important;
          -webkit-text-fill-color: #6b7280 !important;
          opacity: 1 !important;
        }

        #sen-modal .sen-input-area input#sen-input:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.3);
        }

        .sen-msg-image {
          display: block;
          max-width: 220px;
          max-height: 160px;
          border-radius: 8px;
          margin-bottom: 0.45rem;
          object-fit: cover;
        }

        .sen-speak-msg-btn {
          background: none;
          border: none;
          color: #c4b5fd;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.15rem 0.3rem;
          margin-top: 0.25rem;
          display: inline-block;
          opacity: 0.8;
        }

        .sen-speak-msg-btn:hover {
          opacity: 1;
        }

        .sen-send-btn {
          background: #a855f7;
          color: white;
          border: none;
          padding: 0.6rem 1.05rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          flex-shrink: 0;
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

    // Voice AI read-aloud toggle
    const voiceToggleBtn = document.getElementById('sen-voice-toggle-btn');
    if (voiceToggleBtn) {
      voiceToggleBtn.addEventListener('click', () => this.toggleVoiceOutput());
    }

    // Voice AI mic input
    const micBtn = document.getElementById('sen-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    // Screenshot / image attachment
    const attachBtn = document.getElementById('sen-attach-btn');
    const fileInput = document.getElementById('sen-file-input');
    const removeAttachmentBtn = document.getElementById('sen-attachment-remove');
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleImageFile(file);
        fileInput.value = '';
      });
    }
    if (removeAttachmentBtn) {
      removeAttachmentBtn.addEventListener('click', () => this.clearPendingImage());
    }

    // Quick action buttons
    document.querySelectorAll('.sen-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Send button & input (including paste-to-attach screenshot)
    document.getElementById('sen-send-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    const inputEl = document.getElementById('sen-input');
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
    inputEl.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            this.handleImageFile(file);
          }
          break;
        }
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
      this.addMessage(this.buildWelcomeMessage(context), 'assistant', { isWelcome: true });
    }
  }

  close() {
    this.isOpen = false;
    this.stopListening();
    this.stopSpeaking();
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
    const taskTitle = data?.taskTitle || context.progress?.pblCourses?.[0]?.title || context.activity;
    const message = `I noticed you've been working on ${taskTitle} for a while. Want to talk through your next step or try one of the quick options below?`;
    this.addMessage(message, 'assistant');
  }

  buildFallbackReply(context, action, userMessage = '') {
    const lower = String(userMessage || '').toLowerCase();
    if (action === 'custom_question' && lower) {
      if (/\b(where|find|open|set)\b.*\bgoal/i.test(lower)) {
        return 'You can set and track your goals in the Goal Setting section (#/goals) of your student dashboard. Open Goal Setting from the navigation menu to create academic or project-based goals.';
      }
      if (/\b(profile picture|avatar|photo|pfp)\b/i.test(lower)) {
        return 'You can change your profile picture by clicking your avatar in the top-right header bar or opening Settings (#/settings) to launch the Profile Editor.';
      }
    }

    if (context?.activity === 'student-dashboard') {
      const pbl = context.progress?.pblCourses?.[0];
      const goal = context.progress?.goals?.find((g) => !g.done);
      if (action === 'hint') {
        if (goal?.nextStep) return `A great tiny step right now: "${goal.nextStep}" for your goal "${goal.explore}". Want to break that down into a 5-minute start?`;
        if (pbl?.nextStep) return `For "${pbl.title}", your next step is "${pbl.nextStep}". What's one small thing you can try on that today?`;
        return `Pick just one small 5-minute step to start—which feels most doable right now: your PBL project or one of your goals?`;
      }
      if (action === 'explain') {
        if (pbl) return `In "${pbl.title}"${pbl.currentStage ? ` (${pbl.currentStage})` : ''}, the focus is on moving step by step from exploring the problem to collecting real evidence. Which part would you like to unpack together?`;
        return `Your dashboard brings together your PBL project and personal goals so you can take one steady step at a time. What part feels unclear right now?`;
      }
      if (action === 'example') {
        if (pbl) return `For "${pbl.title}", a strong piece of evidence can be as simple as a quick sketch, a 3-sentence reflection on what you tested, or a link to your prototype. Which of those fits your style best?`;
        return `For a goal step, even jotting down 3 questions you're curious about or sketching a rough idea counts as real progress. Which goal do you want to try that on?`;
      }
      if (action === 'keep-trying') {
        return `You're making real progress—showing up and checking in on your learning is a big deal. Pick one tiny win you can finish in the next 5 minutes, and I'm right here if you want to bounce ideas!`;
      }
      return `Great question! Let's look at ${pbl ? `"${pbl.title}"` : 'your current project'}${goal ? ` and your goal "${goal.explore}"` : ''}. What part are you thinking through right now?`;
    }

    if (action === 'keep-trying') return `Good start on your design! Keep testing different configurations to see what works best. You've got this!`;
    if (action === 'hint') return `Hint: Try evaluating your current choices against your goal metric to spot one quick improvement.`;
    if (action === 'explain') return `Let's break down how your current choices affect the outcome—which metric are you most curious about?`;
    if (action === 'example') return `Try comparing your current setup with one lighter or higher-efficiency swap to see how much changes.`;
    return `That's a great question about ${context.activity}! Try adjusting one choice at a time and see what changes.`;
  }

  async handleQuickAction(action) {
    const context = this.getActivityContext();
    const specs = {
      'keep-trying': {
        promptKey: 'encouragement',
        status: 'Generating encouragement...',
        success: 'Keep up the great work! 💪',
        userMsg: 'Can you give me some encouragement and a quick win based on my progress?'
      },
      hint: {
        promptKey: 'hint',
        status: 'Thinking of a helpful next step...',
        success: 'Smart hint ready!',
        userMsg: 'Can you give me a quick hint for my next step?'
      },
      explain: {
        promptKey: 'explain',
        status: 'Unpacking this with you...',
        success: 'Explanation ready!',
        userMsg: 'Can you explain what I should focus on right now?'
      },
      example: {
        promptKey: 'example',
        status: 'Putting together a concrete example...',
        success: 'Example provided!',
        userMsg: 'Can you share a concrete example of what good work looks like for my current step?'
      }
    };
    const spec = specs[action];
    if (!spec) return;

    this.setFeedback(spec.status);
    try {
      const isDashboard = context?.activity === 'student-dashboard';
      const prompt = this.buildContextPrompt(context, spec.promptKey);
      const responseText = await geminiApi.generateContextualResponse({
        message: isDashboard ? spec.userMsg : prompt,
        history: this.getHistoryForApi(),
        dashboardContext: context,
        activityContext: isDashboard ? '' : prompt,
        action
      });
      this.addMessage(responseText, 'assistant');
      if (this.voiceEnabled) this.speakText(responseText);
      this.setFeedback(spec.success, 'success');
      this.logInteraction(action, prompt, responseText);
    } catch {
      const fallback = this.buildFallbackReply(context, action);
      this.addMessage(fallback, 'assistant');
      if (this.voiceEnabled) this.speakText(fallback);
      this.setFeedback(spec.success, 'success');
    }
  }

  async sendMessage({ fromVoice = false } = {}) {
    const input = document.getElementById('sen-input');
    const rawText = input ? input.value.trim() : '';
    const attachedImage = this.pendingImage;

    if (!rawText && !attachedImage) return;

    const message = rawText || 'Please look at this screenshot and help me with it.';
    const history = this.getHistoryForApi();
    this.addMessage(message, 'user', {
      imagePreviewUrl: attachedImage?.previewUrl || null
    });
    if (input) input.value = '';
    this.clearPendingImage();

    const context = this.getActivityContext();
    this.setFeedback(attachedImage ? 'Analyzing your screenshot...' : 'Thinking...');

    try {
      const responseText = await geminiApi.generateContextualResponse({
        message,
        history,
        dashboardContext: context,
        activityContext: context?.activity === 'student-dashboard'
          ? ''
          : this.buildContextPrompt(context, 'custom_question', message),
        action: 'custom_question',
        image: attachedImage ? { base64: attachedImage.base64, mimeType: attachedImage.mimeType } : null
      });

      this.addMessage(responseText, 'assistant');
      if (this.voiceEnabled || fromVoice) {
        this.speakText(responseText);
      }
      this.setFeedback('Answer ready!', 'success');
      this.logInteraction('custom_question', message, responseText);
    } catch (error) {
      console.warn('[SmartSENChatbot] Tutor request failed:', error?.message || error);
      const reason = error?.message && !/failed to fetch/i.test(error.message)
        ? ` (${error.message})`
        : '';
      this.addMessage(
        `I couldn't reach the AI coach right now to answer your question${reason}. Please try sending it again in a moment!`,
        'assistant'
      );
      this.setFeedback('AI coach temporarily unavailable', 'error');
    }
  }

  addMessage(text, sender, meta = {}) {
    const conversation = document.getElementById('sen-conversation');
    if (!conversation) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `sen-message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'sen-message-bubble';

    if (meta.imagePreviewUrl) {
      const img = document.createElement('img');
      img.className = 'sen-msg-image';
      img.src = meta.imagePreviewUrl;
      img.alt = 'Attached screenshot';
      bubble.appendChild(img);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    bubble.appendChild(textSpan);

    if (sender === 'assistant' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'sen-speak-msg-btn';
      speakBtn.title = 'Read aloud';
      speakBtn.setAttribute('aria-label', 'Read message aloud');
      speakBtn.textContent = '🔊';
      speakBtn.addEventListener('click', () => this.speakText(text));
      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(speakBtn);
    }

    messageDiv.appendChild(bubble);
    conversation.appendChild(messageDiv);

    conversation.scrollTop = conversation.scrollHeight;
    this.conversation.push({ sender, text, ...meta });
  }

  toggleVoiceOutput() {
    this.voiceEnabled = !this.voiceEnabled;
    const btn = document.getElementById('sen-voice-toggle-btn');
    if (btn) {
      btn.classList.toggle('active', this.voiceEnabled);
      btn.setAttribute('aria-pressed', String(this.voiceEnabled));
      btn.textContent = this.voiceEnabled ? '🔊 Voice On' : '🔊 Voice Off';
    }
    if (!this.voiceEnabled) {
      this.stopSpeaking();
    } else {
      this.setFeedback('Voice AI read-aloud enabled', 'success');
    }
  }

  speakText(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const clean = String(text).replace(/[*_`#]/g, '').trim();
      if (!clean) return;
      const utterance = new window.SpeechSynthesisUtterance(clean);
      utterance.rate = 1.02;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speechSynthesis errors in restricted environments
    }
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    }
  }

  toggleVoiceInput() {
    if (this.isListening) {
      this.stopListening();
      return;
    }
    const Recognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!Recognition) {
      this.setFeedback('Voice input is not supported in this browser.', 'error');
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      this.recognition = recognition;
      this.isListening = true;

      const micBtn = document.getElementById('sen-mic-btn');
      if (micBtn) {
        micBtn.classList.add('listening');
        micBtn.setAttribute('aria-pressed', 'true');
      }
      this.setFeedback('Listening... speak your question');

      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const t = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) finalTranscript += t;
          else interim += t;
        }
        const input = document.getElementById('sen-input');
        if (input) input.value = (finalTranscript || interim).trim();
      };

      recognition.onerror = () => {
        this.stopListening();
        this.setFeedback('Could not hear clearly. Try again or type!', 'error');
      };

      recognition.onend = () => {
        const hadFinal = Boolean(finalTranscript.trim());
        this.stopListening();
        if (hadFinal) {
          this.sendMessage({ fromVoice: true });
        }
      };

      recognition.start();
    } catch {
      this.stopListening();
      this.setFeedback('Could not start microphone.', 'error');
    }
  }

  stopListening() {
    this.isListening = false;
    const micBtn = document.getElementById('sen-mic-btn');
    if (micBtn) {
      micBtn.classList.remove('listening');
      micBtn.setAttribute('aria-pressed', 'false');
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
  }

  async handleImageFile(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      this.setFeedback('Please choose a PNG, JPEG, or WebP screenshot.', 'error');
      return;
    }
    try {
      const prepared = await this.prepareImagePayload(file);
      this.pendingImage = prepared;
      const preview = document.getElementById('sen-attachment-preview');
      const thumb = document.getElementById('sen-attachment-thumb');
      const nameEl = document.getElementById('sen-attachment-name');
      if (thumb) thumb.src = prepared.previewUrl;
      if (nameEl) nameEl.textContent = file.name || 'Screenshot attached';
      if (preview) preview.classList.remove('hidden');
      this.setFeedback('Screenshot attached! Add a question or press Send.', 'success');
    } catch {
      this.setFeedback('Could not read that screenshot. Try another image.', 'error');
    }
  }

  prepareImagePayload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read_failed'));
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const img = new Image();
        img.onerror = () => {
          const [, base64 = ''] = dataUrl.split(',');
          resolve({ base64, mimeType: file.type || 'image/png', previewUrl: dataUrl, name: file.name });
        };
        img.onload = () => {
          const maxDim = 1400;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const [, base64 = ''] = dataUrl.split(',');
            resolve({ base64, mimeType: file.type || 'image/png', previewUrl: dataUrl, name: file.name });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedUrl = canvas.toDataURL(outMime, 0.85);
          const [, base64 = ''] = compressedUrl.split(',');
          resolve({ base64, mimeType: outMime, previewUrl: compressedUrl, name: file.name });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  clearPendingImage() {
    this.pendingImage = null;
    const preview = document.getElementById('sen-attachment-preview');
    const thumb = document.getElementById('sen-attachment-thumb');
    const nameEl = document.getElementById('sen-attachment-name');
    if (preview) preview.classList.add('hidden');
    if (thumb) thumb.removeAttribute('src');
    if (nameEl) nameEl.textContent = '';
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
