import { describe, expect, it } from 'vitest';
import {
  CREATOR_NAME,
  GAME_RULES,
  ORGANS,
  ORGAN_BY_ID,
  REDEMPTION_CARDS,
  STL_MODELS,
  answerRedemptionCard,
  beginExtraction,
  createInitialGameState,
  drawOrganCard,
  recordEdgeTouch,
  recordExtractionSuccess,
  skipRedemption
} from '../src/features/activities/surgery/surgeryModel.js';
import { ACTIVITY_NAV } from '../src/features/activities/activityHost.js';

describe('Surgery 3D Anatomy simulation model', () => {
  it('credits Ana Isa Palazuelos and includes all 7 organs with official points and STL URLs', () => {
    expect(CREATOR_NAME).toBe('Ana Isa Palazuelos');
    expect(ORGANS).toHaveLength(7);
    expect(ORGAN_BY_ID.brain.points).toBe(4);
    expect(ORGAN_BY_ID.heart.points).toBe(3);
    expect(ORGAN_BY_ID.lungs.points).toBe(5);
    expect(ORGAN_BY_ID.liver.points).toBe(2);
    expect(ORGAN_BY_ID.stomach.points).toBe(2);
    expect(ORGAN_BY_ID.small_intestine.points).toBe(2);
    expect(ORGAN_BY_ID.large_intestine.points).toBe(5);

    expect(STL_MODELS.heart).toContain('heart_1_lr1glk.stl');
    expect(STL_MODELS.brain).toContain('Brain_ziynpj.stl');
    expect(STL_MODELS.digestive).toContain('Digestive_system_wyikfh.stl');
  });

  it('is registered in ACTIVITY_NAV for WeLearn SPARK navigation', () => {
    const entry = ACTIVITY_NAV.find((a) => a.id === 'surgery');
    expect(entry).toBeTruthy();
    expect(entry.label).toContain('Surgery');
  });

  it('awards organ points on clean extraction and advances turn clockwise', () => {
    let state = createInitialGameState({ playerNames: ['Ana', 'Leo'], targetScore: 30 });
    state = drawOrganCard(state, () => 0);
    expect(state.phase).toBe('identify');
    const organ = ORGAN_BY_ID[state.activeOrganId];

    state = beginExtraction(state);
    expect(state.phase).toBe('extract');

    state = recordExtractionSuccess(state);
    expect(state.phase).toBe('turn_result');
    expect(state.players[0].score).toBe(organ.points);
    expect(state.currentPlayerIndex).toBe(1);
  });

  it('applies -5 on conductive edge touch (allowing negative scores) and handles redemption +3 / -2', () => {
    let state = createInitialGameState({ playerNames: ['Ana', 'Leo'] });
    state = drawOrganCard(state, () => 0);
    state = beginExtraction(state);
    state = recordEdgeTouch(state, () => 0);

    expect(state.phase).toBe('redemption');
    expect(state.warningActive).toBe(true);
    expect(state.players[0].score).toBe(-5);

    const card = REDEMPTION_CARDS.find((c) => c.id === state.activeRedemptionId);
    const redeemed = answerRedemptionCard(state, card.correctIndex);
    expect(redeemed.players[0].score).toBe(-2);
    expect(redeemed.currentPlayerIndex).toBe(1);

    const wrongIndex = (card.correctIndex + 1) % card.options.length;
    const missed = answerRedemptionCard(state, wrongIndex);
    expect(missed.players[0].score).toBe(-7);
    expect(missed.currentPlayerIndex).toBe(1);

    const skipped = skipRedemption(state);
    expect(skipped.players[0].score).toBe(-5);
    expect(skipped.currentPlayerIndex).toBe(1);
  });

  it('declares a winner when reaching the 30-point target', () => {
    let state = createInitialGameState({ playerNames: ['Ana'], targetScore: GAME_RULES.defaultTargetScore });
    state = { ...state, players: [{ ...state.players[0], score: 28 }] };
    state = drawOrganCard(state, () => 0);
    state = beginExtraction(state);
    state = recordExtractionSuccess(state);

    expect(state.phase).toBe('finished');
    expect(state.winnerId).toBe(state.players[0].id);
  });
});
