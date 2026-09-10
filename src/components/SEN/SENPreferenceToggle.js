/**
 * SEN Preference Toggle
 * Simple toggle for enabling/disabling SEN support
 */

export function renderSENToggle(containerId = 'sen-preference-toggle') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[SENToggle] Container not found: ${containerId}`);
    return;
  }

  let senEnabled = false;
  try {
    senEnabled = localStorage.getItem('senEnabled') === 'true';
  } catch (e) {
    console.warn('[SENToggle] localStorage unavailable');
  }

  container.innerHTML = `
    <div class="sen-preference-toggle">
      <label class="sen-toggle-label">
        <input
          type="checkbox"
          id="sen-toggle-checkbox"
          ${senEnabled ? 'checked' : ''}
          class="sen-toggle-input"
        />
        <span class="sen-toggle-switch"></span>
        <span class="sen-toggle-text">🤖 SEN Learning Support (Auto-help on struggling)</span>
      </label>
      <small class="sen-toggle-hint">Enables automatic hints when you're stuck</small>
    </div>
  `;

  addStyles();
  attachEventListeners();
}

function attachEventListeners() {
  const checkbox = document.getElementById('sen-toggle-checkbox');
  if (!checkbox) return;

  checkbox.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    try {
      localStorage.setItem('senEnabled', enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('[SENToggle] Could not save to localStorage');
    }

    // Update SEN system if user is logged in
    if (window.senIntegration) {
      window.senIntegration.setSenEnabled(enabled);
      const status = enabled ? 'enabled ✅' : 'disabled';
      console.log(`[SENToggle] SEN Support ${status}`);

      // Show feedback
      showToggleFeedback(enabled);
    }
  });
}

function showToggleFeedback(enabled) {
  const message = enabled
    ? '✅ SEN Support enabled! You\'ll get help when you need it.'
    : '⭕ SEN Support disabled';

  const feedback = document.createElement('div');
  feedback.className = 'sen-toggle-feedback';
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${enabled ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 3000);
}

function addStyles() {
  if (document.getElementById('sen-toggle-styles')) return;

  const style = document.createElement('style');
  style.id = 'sen-toggle-styles';
  style.textContent = `
    .sen-preference-toggle {
      padding: 1rem;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      margin: 1rem 0;
    }

    .sen-toggle-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
    }

    .sen-toggle-input {
      display: none;
    }

    .sen-toggle-switch {
      display: inline-block;
      width: 44px;
      height: 24px;
      background: #cbd5e1;
      border-radius: 12px;
      position: relative;
      transition: background 0.3s ease;
      flex-shrink: 0;
    }

    .sen-toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: left 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .sen-toggle-input:checked + .sen-toggle-switch {
      background: #a855f7;
    }

    .sen-toggle-input:checked + .sen-toggle-switch::after {
      left: 22px;
    }

    .sen-toggle-text {
      font-weight: 600;
      color: #e9d5ff;
      font-size: 0.95rem;
    }

    .sen-toggle-hint {
      display: block;
      margin-top: 0.5rem;
      color: #a78bfa;
      font-size: 0.85rem;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(style);
}

export default { renderSENToggle };
