import { useState } from 'react';
import { Sparkles, Zap, Flame, CheckCircle2, Plus, Clock, Gift, Award } from 'lucide-react';
import { playSfx } from './soundEffects.js';
import { triggerSparkParticles } from './confetti.js';
import { dayKey } from './goalPlan.js';

const DEFAULT_BOUNTIES = [
  { id: 'bounty_focus', title: '5-Minute Power Sprint', xp: 50, desc: 'Work on 1 task for 5 minutes with zero tab switching.', icon: '⚡' },
  { id: 'bounty_spark', title: 'Curiosity Spark', xp: 50, desc: 'Jot down 1 new question or idea in your notebook.', icon: '💡' },
  { id: 'bounty_recharge', title: 'Tactical Brain Reset', xp: 40, desc: 'Stand up, stretch or grab water for a 3-minute refresh.', icon: '🔋' }
];

/**
 * Micro-Action Bounty Board:
 * Rapid, 1-click daily quick-wins that provide immediate dopamine and XP juice.
 */
export function DailyBountyBoard({ plan, update }) {
  const today = dayKey();
  const [isOpen, setIsOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  // Daily claimed state stored on plan.days[today] with prefix 'bounty:'
  const claimedList = Array.isArray(plan.days?.[today])
    ? plan.days[today].filter((k) => k.startsWith('bounty:')).map((k) => k.replace('bounty:', ''))
    : [];

  const claimedSet = new Set(claimedList);

  function claimBounty(e, bounty) {
    if (claimedSet.has(bounty.id)) return;

    // Trigger feedback: juice!
    triggerSparkParticles(e.currentTarget, 24);
    playSfx('bounty');

    const bountyKey = `bounty:${bounty.id}`;
    update((prev) => {
      const prevDay = Array.isArray(prev.days?.[today]) ? prev.days[today] : [];
      return {
        ...prev,
        days: {
          ...prev.days,
          [today]: [...prevDay, bountyKey]
        },
        updatedAt: Date.now()
      };
    });
  }

  function addCustomBounty(e) {
    e.preventDefault();
    if (!customTitle.trim()) return;
    const newBounty = {
      id: `custom_${Date.now()}`,
      title: customTitle.trim(),
      xp: 50,
      desc: 'Custom teen quick-win completed today.',
      icon: '🎯'
    };
    claimBounty(e, newBounty);
    setCustomTitle('');
  }

  const completedToday = claimedList.length;

  return (
    <div className={`gl-bounty-board ${isOpen ? 'is-expanded' : ''}`}>
      <div className="gl-bounty-bar">
        <button
          type="button"
          className="gl-bounty-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <div className="gl-bounty-badge">
            <Gift size={16} aria-hidden="true" />
            <span>Daily Bounties</span>
            {completedToday > 0 && (
              <span className="gl-bounty-claimed-tag">{completedToday} Claimed</span>
            )}
          </div>
          <span className="gl-bounty-subtitle">
            {completedToday === DEFAULT_BOUNTIES.length
              ? '🎉 All daily bounties secured! (+140 XP)'
              : '⚡ Tap for 1-click micro quick-wins'}
          </span>
          <span className="gl-bounty-action-text">{isOpen ? 'Close' : 'Open Drawer'} →</span>
        </button>
      </div>

      {isOpen && (
        <div className="gl-bounty-drawer">
          <div className="gl-bounty-grid">
            {DEFAULT_BOUNTIES.map((b) => {
              const isClaimed = claimedSet.has(b.id);
              return (
                <div key={b.id} className={`gl-bounty-card ${isClaimed ? 'is-claimed' : ''}`}>
                  <div className="gl-bounty-top">
                    <span className="gl-bounty-icon">{b.icon}</span>
                    <span className="gl-bounty-xp">+{b.xp} XP</span>
                  </div>
                  <h4 className="gl-bounty-title">{b.title}</h4>
                  <p className="gl-bounty-desc">{b.desc}</p>
                  <button
                    type="button"
                    className={`gh-btn gh-btn-sm ${isClaimed ? 'gh-btn-ghost is-done' : 'gh-btn-accent'}`}
                    disabled={isClaimed}
                    onClick={(e) => claimBounty(e, b)}
                  >
                    {isClaimed ? (
                      <>
                        <CheckCircle2 size={14} className="gl-claimed-check" />
                        <span>Claimed</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Complete (+{b.xp} XP)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick custom bounty adder */}
          <form className="gl-bounty-custom-form" onSubmit={addCustomBounty}>
            <input
              type="text"
              className="gh-input gl-bounty-input"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Or write a 5-minute quick win you just crushed…"
              maxLength={100}
            />
            <button
              type="submit"
              className="gh-btn gh-btn-sm gh-btn-accent"
              disabled={!customTitle.trim()}
            >
              <Plus size={14} />
              <span>Log Quick-Win (+50 XP)</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
