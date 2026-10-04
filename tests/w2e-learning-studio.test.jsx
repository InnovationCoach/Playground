// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx',()=>({useLocale:()=>({locale:'en'})}));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { W2eLearnerStudio } from '../src/features/school/W2eLearnerStudio.jsx';
import { W2eCoachSupportPanel } from '../src/features/school/W2eCoachSupportPanel.jsx';

let host, root;
const school = { id: 'school-one', name: 'Test School' };
const classes = [{ id: 'class-1', name: 'Class 11A' }];

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  schoolRequest.mockReset();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('W2E Learner Studio UI', () => {
  it('renders W2E hero card with 3 checkable steps and mode switches', async () => {
    await act(async () => {
      root.render(<W2eLearnerStudio school={school} classes={classes} />);
    });

    expect(host.textContent).toContain('Find the campus energy hotspots');
    expect(host.textContent).toContain('About 10 minutes');

    const checkboxes = host.querySelectorAll('.w2e-steps input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);

    // Default explore view shows curiosity space & pacing
    expect(host.textContent).toContain('How much would you like to take on?');
    expect(host.textContent).toContain('Curiosity space');

    // Switch to Focus mode
    const focusBtn = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Focus view'));
    expect(focusBtn).toBeTruthy();

    await act(async () => {
      focusBtn.click();
    });

    // W2E focus mode container applied
    expect(host.querySelector('.w2e-focus-mode')).toBeTruthy();
  });

  it('opens support request modal when "Ask my coach" is clicked', async () => {
    await act(async () => {
      root.render(<W2eLearnerStudio school={school} classes={classes} />);
    });

    const helpBtn = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Ask my coach'));
    expect(helpBtn).toBeTruthy();

    await act(async () => {
      helpBtn.click();
    });

    expect(host.textContent).toContain('What would help right now?');
    expect(host.querySelector('select')).toBeTruthy();
  });
});

describe('W2E Coach Support Panel UI', () => {
  it('renders coach support inbox and handles request status resolution', async () => {
    const mockRequests = {
      items: [
        {
          id: 'req-1',
          learnerUid: 'student-1',
          classId: 'class-1',
          category: 'first_step',
          note: 'Help me choose a room',
          status: 'submitted',
          revision: 1,
          createdAt: new Date().toISOString()
        }
      ]
    };

    schoolRequest.mockResolvedValue(mockRequests);

    await act(async () => {
      root.render(<W2eCoachSupportPanel school={school} classes={classes} />);
    });

    expect(host.textContent).toContain('Support learner steps');
    expect(host.textContent).toContain('Check in with learners (1 open)');
    expect(host.textContent).toContain('Help me choose a room');

    // Action buttons visible
    expect(host.textContent).toContain('Acknowledge');
    expect(host.textContent).toContain('Mark checked-in');
    expect(host.textContent).toContain('Mark resolved');
  });
});
