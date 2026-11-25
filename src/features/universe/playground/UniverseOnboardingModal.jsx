import { useEffect, useRef, useState } from 'react';
import { Bot, Compass, Dna, Pause, Play, Rocket, Sparkles, Volume2, VolumeX, X, Zap } from 'lucide-react';

const INTRO_KEY = (uid) => `spark_universe_intro_seen_v1_${uid || 'guest'}`;

export function hasSeenUniverseIntro(uid) {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(INTRO_KEY(uid)) === '1';
  } catch {
    return false;
  }
}

export function markUniverseIntroSeen(uid) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(INTRO_KEY(uid), '1');
  } catch {
    // Ignore storage errors
  }
}

export const ONBOARDING_SCENES = [
  {
    id: 'explore',
    title: '1. Explore 3 Galaxies & 15 Exoplanets',
    icon: Compass,
    caption: 'Drag to orbit in 3D space, scroll to zoom, and click any galaxy, star system, or exoplanet to inspect and land on its surface.'
  },
  {
    id: 'goals',
    title: '2. Achieve Goals → Earn Universe Credits',
    icon: Sparkles,
    caption: 'Complete your SPARK learning goals to earn Credits. Spend Credits in the Feature Forge to build biodomes, solar arrays, and shields.'
  },
  {
    id: 'life-crew',
    title: '3. Discover Life & Govern Your AI Crew',
    icon: Dna,
    caption: 'Scan biomes for living organisms, grow Flora producers before Fauna, and assign your 4 AI NPC crew specialists to research or defense.'
  },
  {
    id: 'hazards-lab',
    title: '4. Survive Weekly Storms & Build Spaceships',
    icon: Rocket,
    caption: 'Every week, 3 random planets face storms or lab fires. Resolve crew dilemmas in your Captain’s Log and test spacecraft in the Research Lab!'
  }
];

export function UniverseOnboardingModal({ uid, credits = 100, motion = true, onOpenPlayground, onClose }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const headingRef = useRef(null);

  const scene = ONBOARDING_SCENES[sceneIdx];
  const Icon = scene.icon;
  const isFirst = sceneIdx === 0;
  const isLast = sceneIdx === ONBOARDING_SCENES.length - 1;

  useEffect(() => {
    if (!motion) setPlaying(false);
  }, [motion]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setSceneIdx((prev) => {
        if (prev >= ONBOARDING_SCENES.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (!voiceOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(`${scene.title}. ${scene.caption}`);
      utter.rate = 1.02;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speech synthesis errors
    }
    return () => {
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, [voiceOn, scene]);

  const finish = (openPlayground = false) => {
    try { window.speechSynthesis?.cancel(); } catch {}
    markUniverseIntroSeen(uid);
    if (openPlayground && onOpenPlayground) {
      onOpenPlayground();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="upg-onboard-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upg-onboard-title"
      onClick={(e) => { if (e.target === e.currentTarget) finish(false); }}
    >
      <div className="upg-onboard-modal">
        <div className="upg-head">
          <div className="upg-title-wrap">
            <Bot size={18} color="#96d700" aria-hidden="true" />
            <div>
              <h2 id="upg-onboard-title" ref={headingRef} tabIndex={-1}>Welcome to My Universe!</h2>
              <span className="upg-subtitle">Quick 4-step guide · move at your own pace</span>
            </div>
          </div>
          <button type="button" className="upg-close" onClick={() => finish(false)} aria-label="Close welcome guide">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="upg-body">
          <div className="upg-video-stage">
            <div className="upg-video-orbit">
              <Icon size={34} color="#96d700" aria-hidden="true" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#ffffff' }}>{scene.title}</h3>
            <p className="upg-muted" style={{ maxWidth: 460, fontSize: '0.86rem', color: '#d6e6ff' }}>
              {scene.caption}
            </p>
          </div>

          <div className="upg-video-progress" aria-hidden="true">
            <span style={{ width: `${((sceneIdx + 1) / ONBOARDING_SCENES.length) * 100}%` }} />
          </div>

          <div className="upg-video-controls">
            <div className="upg-badges">
              <button
                type="button"
                className="upg-btn"
                disabled={isFirst}
                onClick={() => { setPlaying(false); setSceneIdx((i) => Math.max(0, i - 1)); }}
              >
                Back
              </button>
              <button
                type="button"
                className="upg-btn"
                disabled={isLast}
                onClick={() => { setPlaying(false); setSceneIdx((i) => Math.min(ONBOARDING_SCENES.length - 1, i + 1)); }}
              >
                Next
              </button>
              <button type="button" className="upg-btn" onClick={() => {
                if (!playing && isLast) setSceneIdx(0);
                setPlaying((p) => !p);
              }}>
                {playing ? <><Pause size={14} aria-hidden="true" /> Pause</> : <><Play size={14} aria-hidden="true" /> Auto-play</>}
              </button>
              <button
                type="button"
                className="upg-btn"
                onClick={() => setVoiceOn((v) => !v)}
                aria-pressed={voiceOn}
              >
                {voiceOn ? <><Volume2 size={14} aria-hidden="true" /> Voice On</> : <><VolumeX size={14} aria-hidden="true" /> Voice Off</>}
              </button>
            </div>
            <div className="upg-badges">
              {ONBOARDING_SCENES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`upg-btn${i === sceneIdx ? ' upg-btn-primary' : ''}`}
                  onClick={() => { setPlaying(false); setSceneIdx(i); }}
                  aria-label={`Scene ${i + 1}: ${s.title}`}
                  aria-current={i === sceneIdx ? 'step' : undefined}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="upg-item-row" style={{ marginTop: 4, flexWrap: 'wrap' }}>
            <span className="upg-muted">
              <Zap size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
              Tip: Click <strong>Playground · {credits} Cr</strong> in the top bar anytime.
            </span>
            <div className="upg-badges">
              <button type="button" className="upg-btn" onClick={() => finish(false)}>
                Explore 3D First
              </button>
              {onOpenPlayground && (
                <button type="button" className="upg-btn upg-btn-primary" onClick={() => finish(true)}>
                  Open My Playground
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
