import { useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { dayKey } from './goalPlan.js';

const DEFAULT_BOUNTIES = [
  { id: 'bounty_focus', title: 'Five focused minutes', desc: 'Work on one task for 5 minutes without switching tabs.', icon: '⏱️' },
  { id: 'bounty_spark', title: 'A new question', desc: 'Write down one new question or idea.', icon: '💡' },
  { id: 'bounty_recharge', title: 'A quick break', desc: 'Stand up, stretch or get some water for 3 minutes.', icon: '🚶' }
];

/** Quick wins: small things to tick off today, on top of a learner's plan. No points. */
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
      desc: 'A quick win of your own.',
      icon: '🎯'
    };
    claimBounty(e, newBounty);
    setCustomTitle('');
  }

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
            <span>Quick wins</span>
          </div>
          <span className="gl-bounty-subtitle">
            Small things you can do right now
          </span>
          <span className="gl-bounty-action-text">{isOpen ? 'Close' : 'Open'}</span>
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
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <span>I did this</span>
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
              placeholder="Or write a quick win of your own…"
              maxLength={100}
            />
            <button
              type="submit"
              className="gh-btn gh-btn-sm gh-btn-accent"
              disabled={!customTitle.trim()}
            >
              <Plus size={14} />
              <span>Add it</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
