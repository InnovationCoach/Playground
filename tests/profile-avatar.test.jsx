// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/auth.js', () => ({
  saveUserProfile: vi.fn(async () => ({ displayName: 'Yuri', avatar: null }))
}));

import { saveUserProfile } from '../src/auth.js';
import { Avatar } from '../src/features/shell/Avatar.jsx';
import { ProfileEditorModal } from '../src/features/shell/ProfileEditorModal.jsx';
import {
  randomAvatarConfig,
  sanitizeAvatarConfig,
  sanitizeDisplayName
} from '../src/features/shell/avatarModel.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('avatarModel', () => {
  it('sanitizes display names and caps length', () => {
    expect(sanitizeDisplayName('  Yuri   Na  ')).toBe('Yuri Na');
    expect(sanitizeDisplayName('x'.repeat(60))).toHaveLength(40);
    expect(sanitizeDisplayName(null)).toBe('');
  });

  it('sanitizes unknown avatar fields to safe defaults', () => {
    const clean = sanitizeAvatarConfig({
      mode: 'character',
      bg: 'not-a-theme',
      character: 'fox',
      hat: 'invalid-hat',
      eyes: 'starry',
      accessory: 'rocket',
      icon: 'owl',
      pattern: 'grid',
      ring: 'gold'
    });
    expect(clean).toMatchObject({
      mode: 'character',
      bg: 'aurora',
      character: 'fox',
      hat: 'none',
      eyes: 'starry',
      accessory: 'rocket',
      ring: 'gold'
    });
    expect(sanitizeAvatarConfig(null)).toBeNull();
  });

  it('generates valid random avatar configs for each mode', () => {
    for (const mode of ['character', 'icon', 'monogram']) {
      const cfg = randomAvatarConfig(mode);
      expect(cfg.mode).toBe(mode);
      expect(sanitizeAvatarConfig(cfg)).toEqual(cfg);
    }
  });
});

describe('Avatar & ProfileEditorModal', () => {
  let host, root;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    saveUserProfile.mockClear();
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('renders initials fallback, character SVG, icon glyph, and monogram', async () => {
    await act(async () => {
      root.render(
        <div>
          <Avatar name="Yuri Na" seed="u1" />
          <Avatar name="Yuri Na" seed="u1" avatar={{ mode: 'character', character: 'bot', bg: 'aurora', hat: 'crown', eyes: 'happy', accessory: 'sparkles', ring: 'gold' }} />
          <Avatar name="Yuri Na" seed="u1" avatar={{ mode: 'icon', icon: 'rocket', bg: 'sunset', ring: 'none' }} />
          <Avatar name="Yuri Na" seed="u1" avatar={{ mode: 'monogram', pattern: 'stars', bg: 'ocean', ring: 'neon' }} />
        </div>
      );
    });

    expect(host.textContent).toContain('YN');
    expect(host.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
    expect(host.textContent).toContain('🚀');
  });

  it('edits display name and avatar and saves to profile', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn(async () => {});

    await act(async () => {
      root.render(
        <ProfileEditorModal
          uid="u1"
          initialName="Yuri Na"
          initialAvatar={null}
          onClose={onClose}
          onSaved={onSaved}
        />
      );
    });

    const input = host.querySelector('#pe-display-name');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Yuri Explorer');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const iconsTab = [...host.querySelectorAll('[role="tab"]')].find((b) => b.textContent.includes('Icons'));
    await act(async () => { iconsTab.click(); });

    const owlBtn = [...host.querySelectorAll('.pe-icon-btn')].find((b) => b.textContent.includes('Owl'));
    await act(async () => { owlBtn.click(); });

    const saveBtn = [...host.querySelectorAll('button[type="submit"]')][0];
    await act(async () => { saveBtn.click(); });

    expect(saveUserProfile).toHaveBeenCalledWith('u1', {
      displayName: 'Yuri Explorer',
      avatar: expect.objectContaining({ mode: 'icon', icon: 'owl' })
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
