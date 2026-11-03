// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityStudio, { blankActivity } from '../src/features/activities/builder/ActivityStudio.jsx';

vi.mock('../src/services/api/apiClient.js', () => ({
  schoolRequest: vi.fn().mockImplementation((method, path) => {
    if (path.endsWith('/activity-drafts')) {
      return Promise.resolve({ items: [] });
    }
    return Promise.resolve({});
  })
}));

describe('ActivityStudio Internal Navigation & Discard Safeguards', () => {
  const mockSchool = { id: 's1' };
  const mockOffering = { id: 'o1', classIds: ['c1'] };
  const mockClasses = [{ id: 'c1', name: 'Class 1' }];
  const mockTemplate = { milestones: [{ id: 'm1', title: 'Milestone 1' }] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts before clearing unsaved edits when Reset to Blank or Sample is clicked', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <ActivityStudio
        school={mockSchool}
        offering={mockOffering}
        classes={mockClasses}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    // Edit title to make the studio dirty
    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Unsaved Activity Title' } });

    // Click Blank Activity button
    const blankBtn = screen.getByText('Blank Activity');
    fireEvent.click(blankBtn);

    // Confirm dialog should have been triggered
    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes in this activity. Are you sure you want to discard them?');
    // Because confirm returned false, title should NOT have been cleared
    expect(titleInput.value).toBe('New Unsaved Activity Title');

    confirmSpy.mockRestore();
  });

  it('resets form when user confirms discard prompt', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ActivityStudio
        school={mockSchool}
        offering={mockOffering}
        classes={mockClasses}
        template={mockTemplate}
        onClose={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/Activity Title/i);
    fireEvent.change(titleInput, { target: { value: 'Unsaved Edits' } });

    const blankBtn = screen.getByText('Blank Activity');
    fireEvent.click(blankBtn);

    expect(confirmSpy).toHaveBeenCalled();
    // Because confirm returned true, title resets to empty
    expect(titleInput.value).toBe('');

    confirmSpy.mockRestore();
  });
});
