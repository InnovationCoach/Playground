/**
 * Pure avatar model, presets, and sanitization helpers for the learner
 * Profile & Avatar Studio. Zero external image dependencies — everything
 * renders as crisp inline SVG + CSS.
 */

export const MAX_DISPLAY_NAME = 40;

export const AVATAR_BG_THEMES = [
  { id: 'aurora', label: 'Aurora', from: '#7c3aed', to: '#06b6d4', text: '#ffffff' },
  { id: 'sunset', label: 'Sunset', from: '#f97316', to: '#ec4899', text: '#ffffff' },
  { id: 'ocean', label: 'Ocean', from: '#0284c7', to: '#2dd4bf', text: '#ffffff' },
  { id: 'forest', label: 'Forest', from: '#16a34a', to: '#84cc16', text: '#ffffff' },
  { id: 'cosmic', label: 'Cosmic', from: '#1e1b4b', to: '#6d28d9', text: '#ffffff' },
  { id: 'berry', label: 'Berry', from: '#be185d', to: '#8b5cf6', text: '#ffffff' },
  { id: 'gold', label: 'Solar', from: '#f59e0b', to: '#ef4444', text: '#ffffff' },
  { id: 'pastel', label: 'Cloud', from: '#e0e7ff', to: '#fce7f3', text: '#312e81' }
];

export const AVATAR_CHARACTERS = [
  { id: 'bot', label: 'Spark Bot', color: '#a78bfa', ear: 'antenna' },
  { id: 'astro', label: 'Explorer', color: '#fde68a', ear: 'round' },
  { id: 'fox', label: 'Fox', color: '#fb923c', ear: 'pointed' },
  { id: 'owl', label: 'Owl', color: '#c4b5fd', ear: 'tuft' },
  { id: 'cat', label: 'Cat', color: '#f9a8d4', ear: 'pointed' },
  { id: 'blob', label: 'Slime', color: '#6ee7b7', ear: 'none' },
  { id: 'panda', label: 'Panda', color: '#f8fafc', ear: 'panda' }
];

export const AVATAR_HATS = [
  { id: 'none', label: 'None' },
  { id: 'cap', label: 'Cap' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'helmet', label: 'Visor' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'crown', label: 'Crown' },
  { id: 'flower', label: 'Sprout' }
];

export const AVATAR_EYES = [
  { id: 'happy', label: 'Happy' },
  { id: 'cool', label: 'Shades' },
  { id: 'curious', label: 'Curious' },
  { id: 'wink', label: 'Wink' },
  { id: 'starry', label: 'Starry' },
  { id: 'focused', label: 'Focused' }
];

export const AVATAR_ACCESSORIES = [
  { id: 'none', label: 'None', glyph: '' },
  { id: 'sparkles', label: 'Sparkles', glyph: '✨' },
  { id: 'bolt', label: 'Energy', glyph: '⚡' },
  { id: 'book', label: 'Scholar', glyph: '📘' },
  { id: 'rocket', label: 'Rocket', glyph: '🚀' },
  { id: 'leaf', label: 'Eco', glyph: '🌿' },
  { id: 'palette', label: 'Artist', glyph: '🎨' }
];

export const AVATAR_ICONS = [
  { id: 'rocket', label: 'Rocket', glyph: '🚀' },
  { id: 'planet', label: 'Planet', glyph: '🪐' },
  { id: 'robot', label: 'Robot', glyph: '🤖' },
  { id: 'owl', label: 'Owl', glyph: '🦉' },
  { id: 'fox', label: 'Fox', glyph: '🦊' },
  { id: 'dragon', label: 'Dragon', glyph: '🐉' },
  { id: 'microscope', label: 'Science', glyph: '🔬' },
  { id: 'palette', label: 'Art', glyph: '🎨' },
  { id: 'music', label: 'Music', glyph: '🎵' },
  { id: 'bolt', label: 'Spark', glyph: '⚡' },
  { id: 'leaf', label: 'Nature', glyph: '🌿' },
  { id: 'compass', label: 'Explorer', glyph: '🧭' },
  { id: 'gem', label: 'Gem', glyph: '💎' },
  { id: 'sparkles', label: 'Magic', glyph: '✨' },
  { id: 'trophy', label: 'Champion', glyph: '🏆' },
  { id: 'book', label: 'Reader', glyph: '📚' }
];

export const AVATAR_PATTERNS = [
  { id: 'solid', label: 'Clean' },
  { id: 'dots', label: 'Polka' },
  { id: 'stripes', label: 'Waves' },
  { id: 'stars', label: 'Starfield' },
  { id: 'grid', label: 'Pixel' }
];

export const AVATAR_RINGS = [
  { id: 'none', label: 'None', css: 'none' },
  { id: 'gold', label: 'Gold', css: '0 0 0 2.5px #f59e0b' },
  { id: 'rainbow', label: 'Prism', css: '0 0 0 2.5px #ec4899' },
  { id: 'neon', label: 'Cyan', css: '0 0 0 2.5px #06b6d4' },
  { id: 'mint', label: 'Mint', css: '0 0 0 2.5px #10b981' }
];

const hasId = (list, id) => list.some((item) => item.id === id);

export const DEFAULT_AVATAR_CONFIG = {
  mode: 'character',
  bg: 'aurora',
  character: 'bot',
  hat: 'none',
  eyes: 'happy',
  accessory: 'sparkles',
  icon: 'rocket',
  pattern: 'stars',
  ring: 'none'
};

export function sanitizeDisplayName(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_DISPLAY_NAME);
}

export function sanitizeAvatarConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const mode = ['character', 'icon', 'monogram'].includes(raw.mode) ? raw.mode : 'character';
  return {
    mode,
    bg: hasId(AVATAR_BG_THEMES, raw.bg) ? raw.bg : DEFAULT_AVATAR_CONFIG.bg,
    character: hasId(AVATAR_CHARACTERS, raw.character) ? raw.character : DEFAULT_AVATAR_CONFIG.character,
    hat: hasId(AVATAR_HATS, raw.hat) ? raw.hat : DEFAULT_AVATAR_CONFIG.hat,
    eyes: hasId(AVATAR_EYES, raw.eyes) ? raw.eyes : DEFAULT_AVATAR_CONFIG.eyes,
    accessory: hasId(AVATAR_ACCESSORIES, raw.accessory) ? raw.accessory : DEFAULT_AVATAR_CONFIG.accessory,
    icon: hasId(AVATAR_ICONS, raw.icon) ? raw.icon : DEFAULT_AVATAR_CONFIG.icon,
    pattern: hasId(AVATAR_PATTERNS, raw.pattern) ? raw.pattern : DEFAULT_AVATAR_CONFIG.pattern,
    ring: hasId(AVATAR_RINGS, raw.ring) ? raw.ring : DEFAULT_AVATAR_CONFIG.ring
  };
}

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)].id;

export function randomAvatarConfig(mode = 'character') {
  return {
    mode: ['character', 'icon', 'monogram'].includes(mode) ? mode : 'character',
    bg: pickRandom(AVATAR_BG_THEMES),
    character: pickRandom(AVATAR_CHARACTERS),
    hat: pickRandom(AVATAR_HATS),
    eyes: pickRandom(AVATAR_EYES),
    accessory: pickRandom(AVATAR_ACCESSORIES),
    icon: pickRandom(AVATAR_ICONS),
    pattern: pickRandom(AVATAR_PATTERNS),
    ring: pickRandom(AVATAR_RINGS)
  };
}
