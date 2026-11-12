// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SparkLandingPage } from '../src/features/landing/SparkLandingPage.jsx';
import { ContactAdminModal } from '../src/features/landing/ContactAdminModal.jsx';
import { parseRoute, hrefFor } from '../src/app/routes.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let host;

function mount(element) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(element));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  window.localStorage.clear();
});

describe('WeLearn SPARK Landing Page Routes', () => {
  it('parses #/landing and #/about correctly', () => {
    expect(parseRoute('#/landing')).toEqual({ screen: 'landing' });
    expect(parseRoute('#/about')).toEqual({ screen: 'landing' });
  });

  it('parses #/login and #/signin correctly', () => {
    expect(parseRoute('#/login')).toEqual({ screen: 'login' });
    expect(parseRoute('#/signin')).toEqual({ screen: 'login' });
  });

  it('generates correct hrefs for landing and login', () => {
    expect(hrefFor.landing()).toBe('#/landing');
    expect(hrefFor.login()).toBe('#/login');
  });
});

describe('SparkLandingPage Component', () => {
  it('renders marketing headline and key brand propositions', () => {
    const onSignIn = vi.fn();
    const dom = mount(<SparkLandingPage onSignIn={onSignIn} />);

    expect(dom.textContent).toContain('A grade gives a score');
    expect(dom.textContent).toContain('SPARK shows the work');
    expect(dom.textContent).toContain('Mastery Transcript Consortium');
    expect(dom.textContent).toContain('mastery.org');
  });

  it('highlights the three core pillars: AI, Mastery.org, and Academy Tracker', () => {
    const dom = mount(<SparkLandingPage onSignIn={vi.fn()} />);

    expect(dom.textContent).toContain('Socratic AI Integration');
    expect(dom.textContent).toContain('Mastery.org (MTC) Recognition');
    expect(dom.textContent).toContain('Academy Progress Tracker');
  });

  it('displays authentic student project evidence from welearnthailand.com/mtc', () => {
    const dom = mount(<SparkLandingPage onSignIn={vi.fn()} />);

    // Yuri's Solar Car
    expect(dom.textContent).toContain('Solar Car Engineering');
    expect(dom.textContent).toContain('How can we design and build an energy-efficient solar car');
    expect(dom.textContent).toContain('0.75 m/s');

    // Ana Isa's Anatomy Game
    expect(dom.textContent).toContain('Interactive Anatomy Game');
    expect(dom.textContent).toContain('human organ systems using digital fabrication');
    expect(dom.textContent).toContain('Blender');
  });

  it('calls onSignIn when Sign In buttons are clicked', () => {
    const onSignIn = vi.fn();
    const dom = mount(<SparkLandingPage onSignIn={onSignIn} />);

    const signInBtn = [...dom.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Sign In to SPARK')
    );
    expect(signInBtn).toBeTruthy();

    act(() => signInBtn.click());
    expect(onSignIn).toHaveBeenCalled();
  });

  it('opens and closes Contact Admin modal', () => {
    const dom = mount(<SparkLandingPage onSignIn={vi.fn()} />);

    // Modal initially closed
    expect(dom.querySelector('.spark-modal-overlay')).toBeNull();

    // Click Contact Admin button
    const contactBtn = [...dom.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Contact Admin')
    );
    act(() => contactBtn.click());

    expect(dom.querySelector('.spark-modal-overlay')).not.toBeNull();
    expect(dom.textContent).toContain('Connect with WeLearn SPARK Admin');

    // Click close button
    const closeBtn = dom.querySelector('.spark-modal-close');
    act(() => closeBtn.click());
    expect(dom.querySelector('.spark-modal-overlay')).toBeNull();
  });
});

describe('ContactAdminModal Form and Submission', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits inquiry and records in localStorage', () => {
    const onClose = vi.fn();
    const dom = mount(<ContactAdminModal isOpen={true} onClose={onClose} />);

    expect(dom.textContent).toContain('Connect with WeLearn SPARK Admin');

    const nameInput = dom.querySelector('#contact-name');
    const emailInput = dom.querySelector('#contact-email');
    const messageInput = dom.querySelector('#contact-message');

    const typeInput = (el, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const typeTextArea = (el, value) => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    act(() => {
      typeInput(nameInput, 'Jane Parent');
      typeInput(emailInput, 'jane@example.com');
      typeTextArea(messageInput, 'Inquiring about Grade 9 admissions and MTC pathway.');
    });

    const form = dom.querySelector('form');
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(dom.textContent).toContain('Message Sent to Admin!');
    const stored = JSON.parse(window.localStorage.getItem('welearn:inquiries') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('Jane Parent');
    expect(stored[0].email).toBe('jane@example.com');
  });
});
