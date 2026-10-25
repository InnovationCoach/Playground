import { useState } from 'react';
import { Zap, Volume2, VolumeX, Sparkles, Check, Lock, Trophy } from 'lucide-react';
import { playSfx, isSfxMuted, setSfxMuted } from './soundEffects.js';
import { triggerSparkParticles } from './confetti.js';

/**
 * Pulsing "Quest Energy Bar" & Tactical Node Progression.
 * Gamified replacement for standard boring progress bars.
 */
export function QuestEnergyBar({
  current = 0,
  total = 1,
  steps = [],
  onToggleStep,
  title = 'Quest Energy Meter'
}) {
  const [muted, setMuted] = useState(isSfxMuted());

  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isFull = pct === 100 && total > 0;

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSfxMuted(next);
    if (!next) {
      playSfx('step');
    }
  }

  function handleNodeClick(e, step, index, isCompleted, isNext) {
    if (!onToggleStep) return;

    // Trigger visual particles & audio feedback
    triggerSparkParticles(e.currentTarget, isFull ? 28 : 16);

    if (!isCompleted) {
      if (index === steps.length - 1 || current + 1 === total) {
        playSfx('milestone');
      } else {
        playSfx('step');
      }
    } else {
      playSfx('step');
    }

    onToggleStep(step.id);
  }

  return (
    <div className="gl-energy-module">
      {/* Top HUD: Title, Sound Toggle & Charge Stat */}
      <div className="gl-energy-hud">
        <div className="gl-energy-title-wrap">
          <span className={`gl-energy-bolt ${isFull ? 'is-overdrive' : ''}`}>
            <Zap size={15} aria-hidden="true" />
          </span>
          <span className="gl-energy-label">{title}</span>
        </div>

        <div className="gl-energy-hud-right">
          <button
            type="button"
            className="gl-sound-toggle-btn"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute game sound effects' : 'Mute game sound effects'}
            title={muted ? 'Sound FX Muted' : 'Sound FX Active'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span className="gl-sound-label">{muted ? 'Muted' : 'SFX'}</span>
          </button>

          <div className="gl-charge-badge">
            <span className="gl-charge-val">{pct}%</span>
            <span className="gl-charge-sub">CHARGED</span>
          </div>
        </div>
      </div>

      {/* Pulsing Energy Bar with glowing segments */}
      <div className="gl-energy-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="gl-energy-track">
          <div
            className={`gl-energy-fill ${isFull ? 'is-complete-glow' : ''}`}
            style={{ width: `${pct}%` }}
          >
            <div className="gl-energy-glow-edge" />
          </div>
        </div>

        {/* Energy Segment Cells (10 tick marks) */}
        <div className="gl-energy-segments" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`gl-energy-tick ${pct >= (i + 1) * 10 ? 'is-lit' : ''}`} />
          ))}
        </div>
      </div>

      {/* Tactical Node Progression Map */}
      {steps.length > 0 && (
        <div className="gl-node-map">
          <div className="gl-node-map-header">
            <span className="gl-node-map-title">Quest Waypoints</span>
            <span className="gl-node-map-count">{current} of {total} Clear</span>
          </div>

          <div className="gl-node-track">
            {steps.map((step, idx) => {
              const isCompleted = step.done;
              const isNext = !isCompleted && (idx === 0 || steps[idx - 1]?.done);
              const isFinal = idx === steps.length - 1;

              return (
                <div
                  key={step.id || idx}
                  className={`gl-node-item ${isCompleted ? 'is-cleared' : ''} ${isNext ? 'is-active' : ''} ${isFinal ? 'is-final' : ''}`}
                >
                  <button
                    type="button"
                    className="gl-node-button"
                    onClick={(e) => handleNodeClick(e, step, idx, isCompleted, isNext)}
                    aria-label={`Node ${idx + 1}: ${step.text}. Status: ${isCompleted ? 'Completed' : isNext ? 'Active' : 'Locked'}`}
                  >
                    <div className="gl-node-circle">
                      {isCompleted ? (
                        <Check size={14} className="gl-node-icon-check" />
                      ) : isFinal ? (
                        <Trophy size={14} className="gl-node-icon-trophy" />
                      ) : isNext ? (
                        <span className="gl-node-num">{idx + 1}</span>
                      ) : (
                        <Lock size={12} className="gl-node-icon-lock" />
                      )}
                    </div>
                    <span className="gl-node-name">{step.text}</span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div className={`gl-node-connector ${isCompleted ? 'is-filled' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
