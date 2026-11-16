import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import {
  CREATOR_NAME,
  GAME_RULES,
  ORGANS,
  ORGAN_BY_ID,
  REDEMPTION_CARDS,
  answerRedemptionCard,
  beginExtraction,
  createInitialGameState,
  drawOrganCard,
  recordEdgeTouch,
  recordExtractionSuccess,
  skipRedemption
} from './surgeryModel.js';
import { playBuzzer, playCardFlip, playCircuitTest, playSuccessChime } from './surgeryAudio.js';
import { OrganInspector3D, SurgeryScene3D } from './SurgeryScene3D.jsx';
import { ExtractionPad } from './ExtractionPad.jsx';
import './surgery.css';

const storageKey = (uid) => `hearisland.surgery.v1:${uid || 'signed-out'}`;

function loadStats(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? JSON.parse(raw) : { gamesPlayed: 0, totalExtractions: 0, bestScore: 0 };
  } catch {
    return { gamesPlayed: 0, totalExtractions: 0, bestScore: 0 };
  }
}

function saveStats(uid, stats) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function SurgerySimulation({ uid }) {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'play'
  const [playerInputs, setPlayerInputs] = useState(['Surgeon 1', 'Surgeon 2']);
  const [targetScore, setTargetScore] = useState(GAME_RULES.defaultTargetScore);
  const [game, setGame] = useState(() => createInitialGameState({ playerNames: ['Surgeon 1', 'Surgeon 2'] }));
  const [muted, setMuted] = useState(false);
  const [circuitTested, setCircuitTested] = useState(false);
  const [testLedOn, setTestLedOn] = useState(false);

  const [identifyError, setIdentifyError] = useState('');
  const [showLocationHint, setShowLocationHint] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionOffset, setExtractionOffset] = useState({ x: 0, y: 0 });

  // Redemption flip-card local UI state
  const [selectedOption, setSelectedOption] = useState(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Modals
  const [showGuide, setShowGuide] = useState(false);
  const [guideOrganId, setGuideOrganId] = useState('brain');
  const [showDigestiveStl, setShowDigestiveStl] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [stats, setStats] = useState(() => loadStats(uid));

  useEffect(() => {
    setStats(loadStats(uid));
  }, [uid]);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const activeOrgan = game.activeOrganId ? ORGAN_BY_ID[game.activeOrganId] : null;
  const activeRedemption = useMemo(
    () => REDEMPTION_CARDS.find((c) => c.id === game.activeRedemptionId) || null,
    [game.activeRedemptionId]
  );

  const handleTestCircuit = () => {
    playCircuitTest(muted);
    setCircuitTested(true);
    setTestLedOn(true);
    setTimeout(() => setTestLedOn(false), 600);
  };

  const handleStartGame = () => {
    setGame(createInitialGameState({ playerNames: playerInputs, targetScore }));
    setIdentifyError('');
    setShowLocationHint(false);
    setExtractionProgress(0);
    setExtractionOffset({ x: 0, y: 0 });
    setSelectedOption(null);
    setCardFlipped(false);
    setScreen('play');
  };

  const handleDrawCard = () => {
    playCardFlip(muted);
    setIdentifyError('');
    setShowLocationHint(false);
    setExtractionProgress(0);
    setExtractionOffset({ x: 0, y: 0 });
    setGame((prev) => drawOrganCard(prev));
  };

  const handleSelectOrgan = useCallback((clickedId) => {
    if (game.phase !== 'identify' || !game.activeOrganId) return;
    if (clickedId === game.activeOrganId) {
      setIdentifyError('');
      setGame((prev) => beginExtraction(prev));
    } else {
      const wrongOrgan = ORGAN_BY_ID[clickedId];
      setIdentifyError(`That is the ${wrongOrgan?.name || 'other organ'}. Locate the ${ORGAN_BY_ID[game.activeOrganId]?.name}!`);
    }
  }, [game.phase, game.activeOrganId]);

  const handleProgressChange = useCallback((progress, offset) => {
    setExtractionProgress(progress);
    setExtractionOffset(offset);
  }, []);

  const handleExtractionSuccess = useCallback(() => {
    playSuccessChime(muted);
    setGame((prev) => {
      const next = recordExtractionSuccess(prev);
      const topScore = Math.max(...next.players.map((p) => p.score));
      const updated = {
        gamesPlayed: next.phase === 'finished' ? stats.gamesPlayed + 1 : stats.gamesPlayed,
        totalExtractions: stats.totalExtractions + 1,
        bestScore: Math.max(stats.bestScore, topScore)
      };
      setStats(updated);
      saveStats(uid, updated);
      return next;
    });
  }, [muted, stats, uid]);

  const handleEdgeTouch = useCallback(() => {
    playBuzzer(muted);
    setSelectedOption(null);
    setCardFlipped(false);
    setGame((prev) => recordEdgeTouch(prev));
  }, [muted]);

  const handleSubmitRedemption = (idx) => {
    if (cardFlipped) return;
    setSelectedOption(idx);
    setCardFlipped(true);
    playCardFlip(muted);
  };

  const handleFinishRedemption = () => {
    if (selectedOption === null) return;
    setGame((prev) => answerRedemptionCard(prev, selectedOption));
    setSelectedOption(null);
    setCardFlipped(false);
  };

  const handleSkipRedemption = () => {
    setGame((prev) => skipRedemption(prev));
    setSelectedOption(null);
    setCardFlipped(false);
  };

  const warningLedLit = testLedOn || game.warningActive;

  return (
    <div className="surg-root">
      {/* Header */}
      <header className="surg-header">
        <div className="surg-title-group">
          <div className="surg-badge">
            <Activity size={16} aria-hidden="true" />
            <span>STEAM · 3D Anatomy Lab</span>
          </div>
          <h1>Surgery: Precision Organ Extraction</h1>
          <p className="surg-creator">
            Created &amp; 3D-designed by <strong>{CREATOR_NAME}</strong> · WeLearn SPARK
          </p>
        </div>

        <div className="surg-header-actions">
          <div className={`surg-led-pill ${warningLedLit ? 'is-alarm' : 'is-ready'}`} role="status" aria-live="polite">
            <span className="surg-led-dot" aria-hidden="true" />
            <span>{warningLedLit ? 'BUZZER ALARM!' : 'Circuit Ready'}</span>
          </div>

          <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute buzzer' : 'Mute buzzer'}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{muted ? 'Muted' : 'Sound On'}</span>
          </button>

          <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setShowGuide(true)}>
            <BookOpen size={16} />
            <span>Anatomy Guide</span>
          </button>

          <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setShowManual(true)}>
            <FileText size={16} />
            <span>Game Manual</span>
          </button>

          {screen === 'play' && (
            <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setScreen('setup')}>
              <RotateCcw size={16} />
              <span>New Setup</span>
            </button>
          )}
        </div>
      </header>

      {/* Setup Screen */}
      {screen === 'setup' && (
        <main className="surg-setup-grid">
          <section className="surg-card">
            <h2>Pre-Surgery Setup</h2>
            <p className="surg-muted">
              Position the 7 organs inside the human body model, verify the low-voltage warning circuit, and add 1–4 players.
            </p>

            <div className="surg-field">
              <label>Players (Clockwise Turn Order)</label>
              <div className="surg-player-list">
                {playerInputs.map((name, idx) => (
                  <div key={idx} className="surg-player-row">
                    <input
                      type="text"
                      value={name}
                      maxLength={20}
                      onChange={(e) => {
                        const copy = [...playerInputs];
                        copy[idx] = e.target.value;
                        setPlayerInputs(copy);
                      }}
                      aria-label={`Player ${idx + 1} name`}
                    />
                    {playerInputs.length > 1 && (
                      <button
                        type="button"
                        className="surg-icon-btn"
                        onClick={() => setPlayerInputs(playerInputs.filter((_, i) => i !== idx))}
                        aria-label={`Remove player ${idx + 1}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {playerInputs.length < GAME_RULES.maxPlayers && (
                <button
                  type="button"
                  className="surg-btn surg-btn-outline"
                  onClick={() => setPlayerInputs([...playerInputs, `Surgeon ${playerInputs.length + 1}`])}
                >
                  <Plus size={15} />
                  <span>Add Player</span>
                </button>
              )}
            </div>

            <div className="surg-field">
              <label>Winning Target Score</label>
              <div className="surg-pill-group">
                {GAME_RULES.targetScoreOptions.map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    className={`surg-pill-btn ${targetScore === pts ? 'is-active' : ''}`}
                    onClick={() => setTargetScore(pts)}
                  >
                    {pts} pts {pts === 30 ? '(Official)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="surg-circuit-check">
              <div>
                <strong>Setup Step 5: Warning Circuit Check</strong>
                <p>Verify that the low-voltage buzzer and warning LED activate properly.</p>
              </div>
              <button type="button" className="surg-btn surg-btn-amber" onClick={handleTestCircuit}>
                <Zap size={16} />
                <span>{circuitTested ? 'Circuit Verified ✓' : 'Test Buzzer & LED'}</span>
              </button>
            </div>

            <button type="button" className="surg-btn surg-btn-primary surg-btn-lg" onClick={handleStartGame}>
              <Play size={18} />
              <span>Start Surgery Simulation</span>
            </button>

            <div className="surg-stats-strip">
              <span>Clean Extractions: <strong>{stats.totalExtractions}</strong></span>
              <span>Games Completed: <strong>{stats.gamesPlayed}</strong></span>
              <span>Best Score: <strong>{stats.bestScore} pts</strong></span>
            </div>
          </section>

          <section className="surg-card surg-preview-card">
            <div className="surg-preview-head">
              <h3>3D Human Body Model Preview</h3>
              <span>7 Removable Organs · Conductive Cavity Rings</span>
            </div>
            <SurgeryScene3D activeOrganId={null} phase="setup" warningActive={testLedOn} />
          </section>
        </main>
      )}

      {/* Active Game Workspace */}
      {screen === 'play' && (
        <main className="surg-play-grid">
          <section className="surg-stage-col">
            <SurgeryScene3D
              activeOrganId={game.activeOrganId}
              phase={game.phase}
              warningActive={warningLedLit}
              extractionProgress={extractionProgress}
              extractionOffset={extractionOffset}
              onSelectOrgan={handleSelectOrgan}
            />

            {game.phase === 'extract' && activeOrgan && (
              <ExtractionPad
                organ={activeOrgan}
                onProgressChange={handleProgressChange}
                onSuccess={handleExtractionSuccess}
                onEdgeTouch={handleEdgeTouch}
              />
            )}
          </section>

          <aside className="surg-console-col">
            {/* Scoreboard */}
            <section className="surg-card">
              <div className="surg-card-head">
                <h2>Scoreboard</h2>
                <span className="surg-target-tag">Goal: {game.targetScore} pts</span>
              </div>
              <div className="surg-scoreboard">
                {game.players.map((p, idx) => {
                  const isActive = idx === game.currentPlayerIndex && game.phase !== 'finished';
                  const pct = Math.max(0, Math.min(100, (p.score / game.targetScore) * 100));
                  return (
                    <div key={p.id} className={`surg-score-row ${isActive ? 'is-current' : ''}`}>
                      <div className="surg-score-top">
                        <span>{isActive ? '▶ ' : ''}{p.name}</span>
                        <strong>{p.score} pts</strong>
                      </div>
                      <div className="surg-progress-track">
                        <div className="surg-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Turn Action Panel */}
            <section className="surg-card surg-turn-card" aria-live="polite">
              {game.phase === 'finished' ? (
                <div className="surg-victory">
                  <Award size={36} className="surg-victory-icon" />
                  <h2>{game.players.find((p) => p.id === game.winnerId)?.name} Wins!</h2>
                  <p>Reached {game.targetScore} points with steady hands and anatomical mastery.</p>
                  <button type="button" className="surg-btn surg-btn-primary" onClick={handleStartGame}>
                    <RotateCcw size={16} />
                    <span>Play Again</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="surg-turn-banner">
                    <span>Turn {game.turnNumber}</span>
                    <strong>{currentPlayer.name}’s Turn</strong>
                  </div>

                  {game.lastResult && (
                    <div className={`surg-alert is-${game.lastResult.type}`}>
                      {game.lastResult.message}
                    </div>
                  )}

                  {(game.phase === 'draw' || game.phase === 'turn_result') && (
                    <div className="surg-step-box">
                      <h3>Step 1 — Draw an Organ Card</h3>
                      <p>Draw a card from the shuffled Organ Assignment deck to see your target organ.</p>
                      <button type="button" className="surg-btn surg-btn-primary surg-btn-lg" onClick={handleDrawCard}>
                        Draw Organ Card
                      </button>
                    </div>
                  )}

                  {game.phase === 'identify' && activeOrgan && (
                    <div className="surg-step-box">
                      <div className="surg-organ-card">
                        <div className="surg-organ-card-head">
                          <span className="surg-kicker">Organ Assignment Card</span>
                          <span className="surg-pts-badge">+{activeOrgan.points} pts</span>
                        </div>
                        <h3>{activeOrgan.name}</h3>
                        <p><strong>Function:</strong> {activeOrgan.function}</p>
                        <p className="surg-fun-fact"><strong>Fun Fact:</strong> {activeOrgan.funFact}</p>
                        {showLocationHint && (
                          <p className="surg-hint-box"><strong>Location Hint:</strong> {activeOrgan.location}</p>
                        )}
                      </div>

                      <p className="surg-instruction">
                        <strong>Step 2 — Identify:</strong> Click the <strong>{activeOrgan.name}</strong> inside the 3D Human Body Model to begin extraction.
                      </p>

                      {identifyError && <div className="surg-alert is-buzz">{identifyError}</div>}

                      <div className="surg-inline-actions">
                        <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setShowLocationHint((h) => !h)}>
                          <HelpCircle size={15} />
                          <span>{showLocationHint ? 'Hide Hint' : 'Location Hint'}</span>
                        </button>
                        <button type="button" className="surg-btn surg-btn-outline" onClick={() => handleSelectOrgan(activeOrgan.id)}>
                          <CheckCircle2 size={15} />
                          <span>Confirm {activeOrgan.name}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {game.phase === 'extract' && activeOrgan && (
                    <div className="surg-step-box">
                      <h3>Step 3 — Extract Carefully</h3>
                      <p>
                        Use the <strong>nonconductive plastic tweezers</strong> below the 3D model to lift the{' '}
                        <strong>{activeOrgan.name}</strong> (+{activeOrgan.points} pts) without touching the conductive edges!
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Recent Turn Log */}
            {game.history.length > 0 && (
              <section className="surg-card">
                <h3>Surgical Log</h3>
                <ul className="surg-history-list">
                  {game.history.slice(0, 5).map((item, idx) => (
                    <li key={`${item.turn}-${idx}`}>
                      <span>T{item.turn} · {item.playerName} ({item.organName})</span>
                      <strong className={item.delta >= 0 ? 'is-pos' : 'is-neg'}>
                        {item.delta >= 0 ? `+${item.delta}` : item.delta} pts
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </main>
      )}

      {/* Redemption Card Modal */}
      {game.phase === 'redemption' && activeRedemption && (
        <div className="surg-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="redemption-title">
          <div className="surg-modal surg-redemption-modal">
            <div className="surg-modal-head">
              <div>
                <span className="surg-kicker is-danger">Conductive Edge Touched (-5 pts)</span>
                <h2 id="redemption-title">Redemption Card Challenge</h2>
              </div>
            </div>
            <p className="surg-muted">
              Answer this anatomical question correctly to regain <strong>+3 points</strong> (net -2). A wrong answer costs{' '}
              <strong>2 extra points</strong> (total -7).
            </p>

            <div className={`surg-flip-card ${cardFlipped ? 'is-flipped' : ''}`}>
              <div className="surg-question-box">
                <h3>{activeRedemption.question}</h3>
                <div className="surg-options-list">
                  {activeRedemption.options.map((opt, idx) => {
                    const isChosen = selectedOption === idx;
                    const isCorrect = idx === activeRedemption.correctIndex;
                    let cls = 'surg-option-btn';
                    if (cardFlipped) {
                      if (isCorrect) cls += ' is-correct';
                      else if (isChosen) cls += ' is-wrong';
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={cls}
                        disabled={cardFlipped}
                        onClick={() => handleSubmitRedemption(idx)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {cardFlipped && (
                <div className="surg-answer-back">
                  <strong>Answer: {activeRedemption.answer}</strong>
                  <p>{activeRedemption.explanation}</p>
                  <button type="button" className="surg-btn surg-btn-primary" onClick={handleFinishRedemption}>
                    Continue Turn
                  </button>
                </div>
              )}
            </div>

            {!cardFlipped && (
              <div className="surg-modal-foot">
                <button type="button" className="surg-btn surg-btn-ghost" onClick={handleSkipRedemption}>
                  Skip Redemption (Keep -5 pts)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anatomy Learning Guide Modal */}
      {showGuide && (
        <div className="surg-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title">
          <div className="surg-modal surg-guide-modal">
            <div className="surg-modal-head">
              <div>
                <span className="surg-kicker">Anatomy Learning Guide</span>
                <h2 id="guide-title">The 7 Removable Organs</h2>
              </div>
              <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setShowGuide(false)}>
                Close
              </button>
            </div>

            <div className="surg-guide-body">
              <div className="surg-guide-tabs" role="tablist">
                {ORGANS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={guideOrganId === o.id && !showDigestiveStl}
                    className={`surg-tab-btn ${guideOrganId === o.id && !showDigestiveStl ? 'is-active' : ''}`}
                    onClick={() => {
                      setShowDigestiveStl(false);
                      setGuideOrganId(o.id);
                    }}
                  >
                    <span>{o.name}</span>
                    <small>{o.points} pts</small>
                  </button>
                ))}
                <button
                  type="button"
                  role="tab"
                  aria-selected={showDigestiveStl}
                  className={`surg-tab-btn ${showDigestiveStl ? 'is-active' : ''}`}
                  onClick={() => setShowDigestiveStl(true)}
                >
                  <span>Full Digestive 3D STL</span>
                  <small>CAD</small>
                </button>
              </div>

              <div className="surg-guide-detail">
                <OrganInspector3D organId={guideOrganId} showDigestiveStl={showDigestiveStl} />
                {showDigestiveStl ? (
                  <div className="surg-guide-info">
                    <h3>Digestive System (3D STL Model)</h3>
                    <p><strong>3D Component by:</strong> {CREATOR_NAME}</p>
                    <p>
                      This combined 3D CAD assembly shows how the stomach, small intestine, and large intestine fit together inside the abdominal cavity.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const gOrgan = ORGAN_BY_ID[guideOrganId];
                    return (
                      <div className="surg-guide-info">
                        <div className="surg-organ-card-head">
                          <h3>{gOrgan.name}</h3>
                          <span className="surg-pts-badge">{gOrgan.points} pts</span>
                        </div>
                        <p><strong>Location:</strong> {gOrgan.location}</p>
                        <p><strong>Function:</strong> {gOrgan.function}</p>
                        <p className="surg-fun-fact"><strong>Fun Fact:</strong> {gOrgan.funFact}</p>
                        {gOrgan.stlUrl && (
                          <p className="surg-stl-note">✓ Displaying {CREATOR_NAME}’s custom 3D `.stl` model</p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Manual Modal */}
      {showManual && (
        <div className="surg-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="manual-title">
          <div className="surg-modal surg-manual-modal">
            <div className="surg-modal-head">
              <div>
                <span className="surg-kicker">Official Game Manual · {CREATOR_NAME}</span>
                <h2 id="manual-title">How to Play Surgery</h2>
              </div>
              <button type="button" className="surg-btn surg-btn-ghost" onClick={() => setShowManual(false)}>
                Close
              </button>
            </div>

            <div className="surg-manual-content">
              <h3>Objective</h3>
              <p>
                Extract assigned 3D organs from the human body model without touching the conductive edges surrounding each cavity.
                Learn the 7 organs, their locations, and their functions. First player to reach <strong>30 points</strong> wins!
              </p>

              <h3>Turn Sequence</h3>
              <ol>
                <li><strong>Draw an Organ Card:</strong> Reveals the organ to extract, its function, and a fun fact.</li>
                <li><strong>Identify the Organ:</strong> Locate and select the assigned organ on the 3D Human Body Model.</li>
                <li><strong>Extract Carefully:</strong> Guide the organ out using the nonconductive plastic tweezers without touching the conductive edges.</li>
                <li><strong>Complete Extraction:</strong> Clean removal earns the organ’s points.</li>
                <li><strong>Warning Signal &amp; Redemption:</strong> Touching a conductive edge triggers the buzzer and warning light (-5 pts). Optionally draw a Redemption Card: answer right to regain +3 pts (net -2), or wrong to lose 2 extra pts (total -7). Negative scores can keep playing!</li>
              </ol>

              <h3>Scoring System</h3>
              <div className="surg-scoring-grid">
                {ORGANS.map((o) => (
                  <div key={o.id} className="surg-score-chip">
                    <span>{o.name}</span>
                    <strong>{o.points} pts</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
