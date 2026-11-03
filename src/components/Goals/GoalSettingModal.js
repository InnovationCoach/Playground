import './goalSettingModal.css';

const prompts = [
  ['What would you love to explore?', 'Think about something you are curious about, a problem you want to solve, or something you would like to make.'],
  ['What would you like to try or get better at?', 'Describe a small step in your own words. What would progress look like for you? You can add more than one goal.'],
  ['When would you like to check in?', 'Choose a time to reflect on what you have tried. Your plan can change as you learn.']
];

export function createGoalSettingModal(userId = null) {
  document.getElementById('goal-setting-modal')?.dispatchEvent(new Event('closeGoalSetting'));
  const previousFocus = document.activeElement;
  const modal = document.createElement('div');
  modal.id = 'goal-setting-modal';
  modal.className = 'goal-setting-modal';
  modal.innerHTML = `
    <div class="goal-modal-overlay">
      <section class="goal-modal-content" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title" aria-describedby="goal-modal-description">
        <div class="goal-modal-header">
          <span class="goal-eyebrow">MY LEARNING JOURNAL</span>
          <button type="button" class="goal-modal-close" aria-label="Close goal setting">×</button>
          <h2 id="goal-modal-title">A little idea. A new beginning.</h2>
          <p id="goal-modal-description">A space for your ideas to grow.</p>
          <ol class="goal-progress" aria-label="Goal setting progress"><li><span>01</span> Explore</li><li><span>02</span> Plan</li><li><span>03</span> Review</li></ol>
        </div>
        <div class="goal-modal-body">
          <p class="goal-step-count"></p>
          <h3 class="goal-question" tabindex="-1"></h3>
          <p class="goal-guidance"></p>
          <div class="goal-tools">
            <button type="button" class="goal-read">Read prompt aloud</button>
            <div class="goal-voice"><button type="button" class="goal-dictate" aria-pressed="false"><span class="goal-mic" aria-hidden="true">♩</span><span class="goal-dictate-label">Use my voice</span></button><label class="goal-language"><span class="goal-sr-only">Voice language</span><select aria-label="Voice language"><option value="en-US">English</option><option value="th-TH">Thai</option></select></label></div>
          </div>
          <p class="goal-status" role="status" aria-live="polite"></p>
          <div class="goal-step" data-step="0">
            <label for="goal-topic">My idea or interest</label>
            <textarea id="goal-topic" rows="3" maxlength="300" placeholder="I wonder how… / I would love to make…"></textarea>
            <p class="goal-hint">Need a starting point? Try an idea, then make it your own.</p>
            <div class="goal-ideas"><button type="button" data-idea="climate">Care for our planet</button><button type="button" data-idea="coding">Create with code</button><button type="button" data-idea="art">Make art</button><button type="button" data-idea="custom">Something new</button></div>
          </div>
          <div class="goal-step" data-step="1" hidden>
            <label for="goal-input">A step I want to take</label>
            <textarea id="goal-input" rows="3" maxlength="500" placeholder="I want to try… / I will know I am making progress when…"></textarea>
            <button type="button" class="goal-add-btn">Add this goal</button>
            <ul class="goals-list" aria-label="My goals"></ul>
          </div>
          <div class="goal-step" data-step="2" hidden>
            <label for="goal-days">Check in after this many days</label>
            <input id="goal-days" type="number" min="1" max="365" value="14">
            <div class="goal-ideas"><button type="button" data-days="7">1 week</button><button type="button" data-days="14">2 weeks</button><button type="button" data-days="30">1 month</button></div>
            <div class="goal-review"><h4>My starting plan</h4><p class="goal-review-topic"></p><ul class="goal-review-list"></ul></div>
            <p class="goal-hint">Saved to your learning dashboard. This does not publish your goals to your portfolio.</p>
          </div>
          <p class="goal-voice-note"></p>
        </div>
        <div class="goal-modal-footer"><button type="button" class="goal-btn-back" hidden>Back</button><button type="button" class="goal-btn-later">Maybe later</button><button type="button" class="goal-btn-next">Continue</button></div>
      </section>
    </div>`;
  document.body.appendChild(modal);
  const $ = selector => modal.querySelector(selector);
  const state = { step: 0, path: 'custom', goals: [] };
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let speaking = false;
  let closed = false;
  let recognitionFailed = false;
  let voiceTimer;
  const oldOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const status = message => { $('.goal-status').textContent = message; };
  const stopVoice = () => {
    clearTimeout(voiceTimer);
    if (recognition) {
      const active = recognition;
      recognition = null;
      active.onresult = active.onerror = active.onend = null;
      active.abort();
    }
    $('.goal-dictate-label').textContent = 'Use my voice';
    $('.goal-dictate').setAttribute('aria-pressed', 'false');
    $('.goal-language select').disabled = false;
  };
  const stopReading = () => {
    if (speaking) window.speechSynthesis?.cancel();
    speaking = false;
    $('.goal-read').textContent = 'Read prompt aloud';
  };
  const close = () => {
    if (closed) return;
    closed = true;
    stopVoice();
    stopReading();
    observer.disconnect();
    document.removeEventListener('keydown', onKeydown);
    document.body.style.overflow = oldOverflow;
    modal.remove();
    if (previousFocus?.isConnected) previousFocus.focus();
  };
  const observer = new MutationObserver(() => { if (!modal.isConnected) close(); });
  observer.observe(document.body, { childList: true });
  function onKeydown(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button, input, textarea, select')].filter(el => !el.disabled && !el.hidden && !el.closest('[hidden]'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKeydown);
  modal.addEventListener('closeGoalSetting', close);
  $('.goal-modal-close').onclick = close;
  $('.goal-btn-later').onclick = close;
  $('.goal-modal-overlay').onclick = event => { if (event.target === event.currentTarget) close(); };

  function renderGoals() {
    $('.goals-list').replaceChildren();
    state.goals.forEach((goal, index) => {
      const row = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = goal;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove goal ${index + 1}`);
      remove.onclick = () => { state.goals.splice(index, 1); renderGoals(); $('#goal-input').focus(); status('Goal removed.'); };
      row.append(text, remove);
      $('.goals-list').append(row);
    });
  }
  function addGoal() {
    stopVoice();
    const value = $('#goal-input').value.trim();
    if (!value) { status('Describe a step you would like to take.'); $('#goal-input').focus(); return false; }
    if (state.goals.length >= 10) { status('Keep your starting plan to 10 goals or fewer.'); return false; }
    state.goals.push(value.slice(0, 500));
    $('#goal-input').value = '';
    renderGoals();
    status('Goal added. You can add another or continue.');
    $('#goal-input').focus();
    return true;
  }
  $('.goal-add-btn').onclick = addGoal;
  modal.querySelectorAll('[data-idea]').forEach(button => {
    button.onclick = () => {
      stopVoice();
      state.path = ['coding', 'climate'].includes(button.dataset.idea) ? button.dataset.idea : 'custom';
      $('#goal-topic').value = { climate: 'How could I help care for our planet?', coding: 'What could I create with code?', art: 'How could I express an idea through art?', custom: 'What is something new I would love to explore?' }[button.dataset.idea];
      $('#goal-topic').focus();
    };
  });
  $('#goal-topic').oninput = () => { state.path = 'custom'; };
  modal.querySelectorAll('[data-days]').forEach(button => { button.onclick = () => { $('#goal-days').value = button.dataset.days; }; });
  function renderStep(focus = true) {
    stopVoice(); stopReading(); status('');
    modal.querySelectorAll('.goal-step').forEach(el => { el.hidden = Number(el.dataset.step) !== state.step; });
    modal.querySelectorAll('.goal-progress li').forEach((el, index) => {
      if (index === state.step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      el.classList.toggle('goal-done', index < state.step);
    });
    $('.goal-step-count').textContent = `Step ${state.step + 1} of 3`;
    $('.goal-question').textContent = prompts[state.step][0];
    $('.goal-guidance').textContent = prompts[state.step][1];
    $('.goal-btn-back').hidden = state.step === 0;
    $('.goal-btn-next').textContent = state.step === 2 ? 'Save my goals' : 'Continue';
    $('.goal-voice').hidden = state.step === 2;
    $('.goal-voice-note').hidden = state.step === 2;
    if (state.step === 2) {
      $('.goal-review-topic').textContent = $('#goal-topic').value.trim();
      $('.goal-review-list').replaceChildren(...state.goals.map(goal => { const li = document.createElement('li'); li.textContent = goal; return li; }));
    }
    $('.goal-modal-body').scrollTop = 0;
    if (focus) $('.goal-question').focus();
  }
  $('.goal-btn-back').onclick = () => { state.step--; renderStep(); };
  $('.goal-btn-next').onclick = () => {
    stopVoice();
    if (state.step === 0 && !$('#goal-topic').value.trim()) { status('Share an idea or interest to begin.'); $('#goal-topic').focus(); return; }
    if (state.step === 1) {
      if ($('#goal-input').value.trim() && !addGoal()) return;
      if (!state.goals.length) { status('Add a goal in your own words to continue.'); $('#goal-input').focus(); return; }
    }
    if (state.step < 2) { state.step++; renderStep(); return; }
    const days = Number($('#goal-days').value);
    if (!Number.isInteger(days) || days < 1 || days > 365) { status('Choose a check-in between 1 and 365 days.'); $('#goal-days').focus(); return; }
    const goalData = { learningPath: state.path, topic: $('#goal-topic').value.trim(), durationDays: days, goals: [...state.goals], createdAt: new Date().toISOString(), completedGoals: [] };
    try { if (userId) localStorage.setItem(`userGoals_${userId}`, JSON.stringify(goalData)); } catch { /* Account sync is handled by the existing goalsSet listener. */ }
    close();
    window.dispatchEvent(new CustomEvent('goalsSet', { detail: goalData }));
  };
  $('.goal-dictate').disabled = !Recognition;
  $('.goal-voice-note').textContent = Recognition
    ? 'Optional voice typing uses your browser’s speech service. Review the text before saving.'
    : 'Voice typing is unavailable in this browser. You can type your answers or use your device’s dictation keyboard.';
  $('.goal-language').hidden = !Recognition;
  $('.goal-dictate').onclick = () => {
    if (recognition) { stopVoice(); status('Voice stopped. Review and edit your answer.'); return; }
    stopReading();
    recognitionFailed = false;
    const input = state.step === 0 ? $('#goal-topic') : $('#goal-input');
    const baseline = input.value.trim();
    let confirmed = '';
    try {
      const active = new Recognition();
      recognition = active;
      active.lang = $('.goal-language select').value;
      active.continuous = false;
      active.interimResults = true;
      active.onresult = event => {
        if (closed || recognition !== active) return;
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) confirmed += `${event.results[i][0].transcript} `;
          else interim += event.results[i][0].transcript;
        }
        input.value = [baseline, confirmed.trim(), interim].filter(Boolean).join(' ').slice(0, input.maxLength);
        if (state.step === 0) state.path = 'custom';
        status('Listening… Your words appear above.');
      };
      active.onerror = event => {
        recognitionFailed = true;
        const errors = { 'not-allowed': 'Microphone access was not allowed. You can enable it in browser settings or type your answer.', 'service-not-allowed': 'Voice recognition is unavailable here. Please type your answer.', 'no-speech': 'No speech was heard. Try again or type your answer.', 'audio-capture': 'No microphone is available. Please type your answer.', network: 'The speech service could not connect. Try again or type your answer.' };
        status(errors[event.error] || 'Voice input could not finish. You can try again or type your answer.');
        stopVoice();
      };
      active.onend = () => { if (recognition !== active) return; stopVoice(); if (!recognitionFailed) status('Voice finished. Review and edit your answer before saving.'); };
      active.start();
      $('.goal-dictate-label').textContent = 'Stop listening';
      $('.goal-dictate').setAttribute('aria-pressed', 'true');
      $('.goal-language select').disabled = true;
      status('Listening… Speak about your idea.');
      voiceTimer = setTimeout(() => { stopVoice(); status('Voice stopped after one minute. Review your answer or start again.'); }, 60000);
    } catch { stopVoice(); status('Voice input is unavailable here. Please type your answer.'); }
  };
  const canRead = !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
  $('.goal-read').disabled = !canRead;
  $('.goal-read').onclick = () => {
    if (speaking) { stopReading(); return; }
    stopVoice();
    const utterance = new window.SpeechSynthesisUtterance(prompts[state.step].join(' '));
    utterance.lang = 'en-US';
    speaking = true;
    $('.goal-read').textContent = 'Stop reading';
    utterance.onend = utterance.onerror = () => { speaking = false; if (!closed) $('.goal-read').textContent = 'Read prompt aloud'; };
    window.speechSynthesis.speak(utterance);
  };
  renderStep(false);
  $('.goal-modal-close').focus();
  return modal;
}

export default { createGoalSettingModal };
