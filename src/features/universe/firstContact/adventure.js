import { reducePlanet } from './planetExpeditions.js';
import { validGrade, signalChallenge } from './curriculum.js';
import { PARTS, missionById, available, RECIPES, canCraft } from './expeditions.js';
export const SITES = signalChallenge(6).sites;
export const REASONS = signalChallenge(6).reasons;
export const SHOP = Object.freeze([
  Object.freeze({ id: 'lens', name: 'Signal lens', price: 15, detail: 'Find a hidden beacon across the bay.' }),
  Object.freeze({ id: 'hull', name: 'Tideglass hull', price: 10, detail: 'Give your ship a violet finish.' }),
  Object.freeze({ id: 'rack', name: 'Cargo rack', price: 20, detail: 'Open a delivery run to the outer pier.' })
]);

const stages = ['shore', 'receiver', 'signal', 'reason'];
const values = [0, 5, 10];
const isSite = (id) => SITES.some(site => site.id === id);

export function newAdventure(grade=6) {
  return {
    planet:null,bases:{},baseChallengeIndex:null,planetChoice:null,planetFeedback:null,grade: validGrade(grade)?grade:6, support:'guided', notes:{}, stage: 'shore', receiver: null, signal: null, lastResult: null,
    bestScore: 0, translated: false, repaired: false, owned: [],
    visitedBeacon: false, delivered: false, fitted: [], completed: [], mission: null, missionFeedback: null,
    resources: { alloy: 0, crystal: 0, cell: 0 }, upgrades: []
  };
}

export function credits(state) {
  const spent = SHOP.filter(item => state.owned.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
  return state.bestScore + state.completed.length * 15 - spent;
}

export function reasonFromCard(reasonId, signalId, grade=6) {
  const reason = signalChallenge(grade).reasons.find(item => item.id === reasonId);
  if (!reason || !isSite(signalId)) return null;
  return {
    evidence: reason.evidence,
    reasoning: signalId === signalChallenge(grade).correct ? reason.reasoning : 0,
    method: 'card'
  };
}

function finish(state, review) {
  if (state.stage !== 'reason' || !state.receiver || !isSite(state.signal) ||
    !review || !['card', 'device-ai'].includes(review.method) ||
    !values.includes(review.evidence) || !values.includes(review.reasoning)) return state;
  const choice = state.signal === signalChallenge(state.grade).correct ? 10 : 0;
  const total = choice + review.evidence + review.reasoning;
  const bestScore = Math.max(state.bestScore, total);
  return {
    ...state, stage: 'reward', translated: true, bestScore,
    lastResult: { choice, ...review, total, gained: bestScore - state.bestScore, firstKey: !state.translated }
  };
}

/** This reducer is a visit-only game wallet. A server wallet would own its own ledger. */
export function play(state, action) {
  switch (action.type) {
    case 'set-grade':
      return ['shore','shop','flight','surface'].includes(state.stage) && validGrade(action.grade) ? {...state,grade:action.grade} : state;
    case 'set-support':
      return ['guided','independent','stretch'].includes(action.support) ? {...state,support:action.support} : state;
    case 'note':
      return state.stage==='expedition' && typeof action.text==='string' && action.text.length<=2000 ? {...state,notes:{...state.notes,[`${state.mission}:${state.grade}`]:action.text}} : state;
    case 'meet':
      return state.stage === 'shore' ? { ...state, stage: 'receiver' } : state;
    case 'place':
      return state.stage === 'receiver' && isSite(action.site)
        ? { ...state, receiver: action.site, stage: 'signal' } : state;
    case 'compare':
      return state.stage === 'signal' && isSite(action.site)
        ? { ...state, signal: action.site, stage: 'reason' } : state;
    case 'back': {
      const previous = stages[stages.indexOf(state.stage) - 1];
      return previous ? { ...state, stage: previous } : state;
    }
    case 'finish-card':
      return finish(state, reasonFromCard(action.reason, state.signal, state.grade));
    case 'finish-written':
      return finish(state, action.review?.method === 'device-ai' ? action.review : null);
    case 'practice':
      return state.stage === 'shop' ? { ...state, stage: 'signal' } : state;
    case 'revise':
      return state.stage === 'reward' ? { ...state, stage: 'signal' } : state;
    case 'next-reward':
      return state.stage === 'reward' ? { ...state, stage: state.repaired ? 'shop' : 'ship' } : state;
    case 'fit':
      return state.stage === 'ship' && PARTS.some(p => p.id === action.part) && !state.fitted.includes(action.part)
        ? { ...state, fitted: [...state.fitted, action.part] } : state;
    case 'build':
      return state.stage === 'ship' && state.translated && PARTS.every(p => state.fitted.includes(p.id)) ? { ...state, repaired: true, stage: 'flight' } : state;
    case 'open-mission': {
      const m = missionById(action.id,state.grade);
      return state.stage === 'shop' && m && available(m,state) ? { ...state, stage:'expedition', mission:m.id, missionFeedback:null } : state;
    }
    case 'answer-mission': {
      const m = missionById(state.mission,state.grade);
      if(state.stage !== 'expedition' || !m || !Number.isInteger(action.choice) || !m.options[action.choice]) return state;
      if(action.choice !== m.answer) return {...state, missionFeedback:'Try again. '+m.hint};
      if(state.completed.includes(m.id)) return {...state, missionFeedback:m.reason+' Already completed — no duplicate rewards.'};
      const resources = {...state.resources};
      for(const [k,v] of Object.entries(m.reward)) resources[k]+=v;
      return {...state, resources, completed:[...state.completed,m.id], missionFeedback:m.reason+' +15 XP and Star Credits. Materials added to your workshop.'};
    }
    case 'leave-mission': return state.stage === 'expedition' ? {...state, stage:'shop', mission:null, missionFeedback:null} : state;
    case 'craft': {
      const recipe = RECIPES.find(r=>r.id===action.id);
      if(state.stage !== 'shop' || !recipe || !canCraft(recipe,state)) return state;
      const resources={...state.resources};
      for(const [k,v] of Object.entries(recipe.cost)) resources[k]-=v;
      return {...state, resources, upgrades:[...state.upgrades,recipe.id]};
    }
    case 'buy': {
      if (state.stage !== 'shop' || !state.repaired || state.owned.includes(action.item)) return state;
      const item = SHOP.find(product => product.id === action.item);
      return item && credits(state) >= item.price ? { ...state, owned: [...state.owned, item.id] } : state;
    }
    case 'travel':
      return state.stage === 'shop' && (action.destination === 'beacon' && state.owned.includes('lens') ||
        action.destination === 'pier' && state.owned.includes('rack'))
        ? { ...state, stage: action.destination } : state;
    case 'finish-trip':
      if (state.stage === 'beacon') return { ...state, visitedBeacon: true, stage: 'shop' };
      if (state.stage === 'pier') return { ...state, delivered: true, stage: 'shop' };
      return state;
    case 'dock':
      return state.stage === 'beacon' || state.stage === 'pier' ? { ...state, stage: 'shop' } : state;
    default:
      return reducePlanet(state,action);
  }
}

export function nextTip(result) {
  if (result.choice < 10) return 'Check the site against every criterion. A higher mean may hide an unreliable reading.';
  if (result.evidence < 10) return 'Name both sites and include both readings so someone else can check your choice.';
  if (result.reasoning < 10) return 'Connect the measurements to the reliability and cost criteria.';
  return 'You compared the measurements and checked the design criteria.';
}
