import React, { useState, useEffect, useRef } from 'react';
import { auth, db, doc, updateDoc, setDoc, arrayUnion, increment } from '../../firebase.js';
import geminiApi from '../../services/geminiApi.js';
import './SmartSENChatbot.css';

export function SmartSENChatbot({
  isEnabled = true,
  currentTask = null,
  behaviorTracker = null,
  learningPath = 'climate'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [struggleDetected, setStruggleDetected] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!behaviorTracker || !isEnabled) return;

    const handleBehaviorChange = (eventType, data) => {
      if (eventType === 'struggle_detected' || eventType === 'passive_stuck') {
        setStruggleDetected(data);
        setTimeout(() => {
          if (!isOpen) {
            setAutoTriggered(true);
            setIsOpen(true);
            handleAutoTriggeredHelp(data);
          }
        }, 2000);
      }
    };

    behaviorTracker.onBehaviorChange(handleBehaviorChange);

    const interval = setInterval(() => {
      const struggle = behaviorTracker.checkForStruggles();
      if (struggle && !isOpen) {
        handleBehaviorChange('struggle_detected', struggle);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [behaviorTracker, isEnabled, isOpen]);

  /**
   * Extract activity, tab, and progress context dynamically
   */
  const getActivityContext = () => {
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

    return { activity, tab, progress, userId: auth.currentUser?.uid || 'anonymous' };
  };

  /**
   * Log interaction to Firestore
   */
  const logInteraction = async (buttonClicked, userPrompt = '', responseText = '') {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const context = getActivityContext();
    const activityId = context.activity || 'solar-car';

    try {
      const progressRef = doc(db, 'users', userId, 'activityProgress', activityId);
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
      console.warn('[SmartSENChatbot React] Firestore log notice:', err.message);
    }
  };

  /**
   * Build context-specific prompt
   */
  const buildContextPrompt = (context, action, userQuestion = '') => {
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
Give encouraging words + suggest what to try next based on their progress (e.g. test aerodynamics or optimize chassis weight).`
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
  };

  const handleAutoTriggeredHelp = async (struggle) => {
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `I noticed you've been working on "${struggle.taskTitle || 'this challenge'}" for a while. Would you like some tailored help based on your current choices?`,
      options: [
        { id: 1, label: '💭 Give me a hint', action: 'hint' },
        { id: 2, label: '📚 Explain the concept', action: 'explain' },
        { id: 3, label: '✨ Show me an example', action: 'example' },
        { id: 4, label: '✋ I\'m fine, let me keep trying', action: 'dismiss' }
      ]
    };

    setMessages([assistantMessage]);
  };

  const handleMessage = async (messageText, action = null) => {
    if (!messageText && !action) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText || `Clicked: ${action}`
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const context = getActivityContext();

    try {
      let response = '';

      if (action === 'dismiss') {
        const prompt = buildContextPrompt(context, 'encouragement');
        try {
          response = await geminiApi.generateContextualResponse(prompt, 'You are an encouraging STEM mentor.');
        } catch (e) {
          response = `Great! I'm here whenever you need help with your ${context.activity} design. You've got this! 💪`;
        }
        await logInteraction('keep-trying', prompt, response);
      } else if (action === 'hint') {
        const prompt = buildContextPrompt(context, 'hint');
        response = await geminiApi.generateContextualResponse(
          prompt,
          'You are a smart STEM learning assistant. Give a short, context-specific hint referencing the student\'s exact choices.'
        );
        await logInteraction('hint', prompt, response);
      } else if (action === 'explain') {
        const prompt = buildContextPrompt(context, 'explain');
        response = await geminiApi.generateContextualResponse(
          prompt,
          'You are a STEM tutor explaining mechanics using the student\'s exact data and choices.'
        );
        await logInteraction('explain', prompt, response);
      } else if (action === 'example') {
        const prompt = buildContextPrompt(context, 'example');
        response = await geminiApi.generateContextualResponse(
          prompt,
          'You are a STEM engineering assistant showing optimized comparisons based on the student\'s current choices.'
        );
        await logInteraction('example', prompt, response);
      } else if (messageText) {
        const prompt = buildContextPrompt(context, 'custom_question', messageText);
        response = await geminiApi.generateContextualResponse(
          prompt,
          'You are a smart STEM learning assistant. Answer the student\'s question specifically about their current activity and selections.'
        );
        await logInteraction('custom_question', messageText, response);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response,
        followUpOptions: getFollowUpOptions()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'assistant',
        content: `Sorry, I had trouble getting that. Let's focus on your ${context.activity} setup! Try asking for a hint or an example.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFollowUpOptions = () => {
    return [
      { id: 1, label: '❓ Ask another question', action: 'ask' },
      { id: 2, label: '💭 Context Hint', action: 'hint' },
      { id: 3, label: '✨ Show Example', action: 'example' }
    ];
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Chatbot Window */}
      {isOpen && (
        <div className={`smart-sen-chatbot ${autoTriggered ? 'auto-triggered' : ''}`}>
          <div className="chatbot-header">
            <div className="header-content">
              <h3>🤖 AI Learning Helper</h3>
              <p>I know what you're building! Ask me anything.</p>
            </div>
            <button
              className="close-btn"
              onClick={() => {
                setIsOpen(false);
                setAutoTriggered(false);
              }}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>

                  {/* Quick action buttons */}
                  {msg.options && (
                    <div className="message-options">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.id}
                          className="option-btn"
                          onClick={() => handleMessage(opt.label, opt.action)}
                          disabled={isLoading}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Follow-up options */}
                  {msg.followUpOptions && !msg.options && (
                    <div className="message-options compact">
                      {msg.followUpOptions.map((opt) => (
                        <button
                          key={opt.id}
                          className="option-btn small"
                          onClick={() => handleMessage(opt.label, opt.action)}
                          disabled={isLoading}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Bar inside chat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}>
            <button className="option-btn small" onClick={() => handleMessage('', 'hint')} disabled={isLoading}>💭 Hint</button>
            <button className="option-btn small" onClick={() => handleMessage('', 'explain')} disabled={isLoading}>📚 Explain</button>
            <button className="option-btn small" onClick={() => handleMessage('', 'example')} disabled={isLoading}>✨ Example</button>
            <button className="option-btn small" onClick={() => handleMessage('', 'dismiss')} disabled={isLoading}>✋ Keep Trying</button>
          </div>

          {/* Input Area */}
          <div className="chatbot-input">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (userInput.trim()) {
                handleMessage(userInput);
              }
            }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask another question..."
                disabled={isLoading}
                className="input-field"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading}
                className="send-btn"
              >
                📤
              </button>
            </form>
            <p className="help-hint">💡 Context-aware AI active for your current activity</p>
          </div>

          {/* Auto-trigger indicator */}
          {autoTriggered && (
            <div className="auto-trigger-indicator">
              <span>🎯 Opened automatically because I detected you might need help</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Chatbot Button */}
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          title="Open AI Helper"
          aria-label="Open AI Helper"
        >
          {struggleDetected ? (
            <span className="pulse">🤖 Help?</span>
          ) : (
            <span>🤖</span>
          )}
        </button>
      )}
    </>
  );
}

export default SmartSENChatbot;
