/**
 * Phase 5 Automated Tests for Study Timer:
 * - Pure drift-free countdown timer hook (useStudyTimer.ts)
 * - Accessibility announcements and tab visibility handling
 * - Interactive StudyTimerWidget rendering and controls
 * - State management: non-destructive RECORD_STUDY_SESSION action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useStudyTimer } from '../useStudyTimer';
import { StudyTimerWidget } from '../StudyTimerWidget';
import { projectReducer } from '../../../state/projectReducer';
import type { ProjectEditorState } from '../../../state/projectReducer';
import { createProject } from '../../../domain/factories';

describe('Phase 5: Study Timer Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('useStudyTimer Hook', () => {
    it('initializes with default 25m focus mode and idle status', () => {
      const { result } = renderHook(() =>
        useStudyTimer({ focusDurationMinutes: 25, breakDurationMinutes: 5 })
      );

      expect(result.current.mode).toBe('focus');
      expect(result.current.status).toBe('idle');
      expect(result.current.remainingSeconds).toBe(25 * 60);
      expect(result.current.totalDurationSeconds).toBe(25 * 60);
      expect(result.current.completedSessions).toBe(0);
    });

    it('starts, counts down accurately, and pauses/resumes without drift', () => {
      const onAnnouncement = vi.fn();
      const { result } = renderHook(() =>
        useStudyTimer({
          focusDurationMinutes: 25,
          breakDurationMinutes: 5,
          onAnnouncement,
        })
      );

      // Start timer
      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe('running');
      expect(onAnnouncement).toHaveBeenCalledWith(
        expect.stringContaining('Started focus timer for 25 minutes.')
      );

      // Advance by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.remainingSeconds).toBe(25 * 60 - 10);

      // Pause timer
      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe('paused');
      const pausedRemaining = result.current.remainingSeconds;

      // Advance time while paused — remainingSeconds must NOT change
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.remainingSeconds).toBe(pausedRemaining);

      // Resume timer
      act(() => {
        result.current.resume();
      });

      expect(result.current.status).toBe('running');

      // Advance by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.remainingSeconds).toBe(pausedRemaining - 5);
    });

    it('triggers onSessionComplete and updates status when timer expires', () => {
      const onSessionComplete = vi.fn();
      const onAnnouncement = vi.fn();

      // Configure a 1-minute test timer
      const { result } = renderHook(() =>
        useStudyTimer({
          focusDurationMinutes: 1,
          breakDurationMinutes: 1,
          onSessionComplete,
          onAnnouncement,
        })
      );

      act(() => {
        result.current.start();
      });

      // Advance through full duration (60 seconds)
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.remainingSeconds).toBe(0);
      expect(result.current.completedSessions).toBe(1);
      expect(onSessionComplete).toHaveBeenCalledWith('focus', 1);
      expect(onAnnouncement).toHaveBeenCalledWith(
        expect.stringContaining('Focus session of 1 minutes complete! Time for a break.')
      );
    });

    it('switches between focus and break modes cleanly', () => {
      const { result } = renderHook(() =>
        useStudyTimer({ focusDurationMinutes: 25, breakDurationMinutes: 5 })
      );

      act(() => {
        result.current.setMode('break');
      });

      expect(result.current.mode).toBe('break');
      expect(result.current.remainingSeconds).toBe(5 * 60);
      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.setMode('focus');
      });

      expect(result.current.mode).toBe('focus');
      expect(result.current.remainingSeconds).toBe(25 * 60);
    });

    it('recalculates remaining time immediately on document visibilitychange', () => {
      const { result } = renderHook(() =>
        useStudyTimer({ focusDurationMinutes: 25, breakDurationMinutes: 5 })
      );

      act(() => {
        result.current.start();
      });

      // Advance by 15 seconds
      act(() => {
        vi.advanceTimersByTime(15000);
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current.remainingSeconds).toBe(25 * 60 - 15);
    });
  });

  describe('StudyTimerWidget UI Component', () => {
    it('renders mode switchers, digital readout, and accessible controls', () => {
      const handleComplete = vi.fn();
      render(
        <StudyTimerWidget
          focusMinutes={25}
          breakMinutes={5}
          onSessionComplete={handleComplete}
        />
      );

      expect(screen.getByRole('region', { name: /Student Study Timer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Focus$/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /^Break$/i })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('25:00')).toBeInTheDocument();

      // Start button is present
      const startBtn = screen.getByRole('button', { name: /Start focus timer/i });
      expect(startBtn).toBeInTheDocument();

      // Click Start
      fireEvent.click(startBtn);

      // Now Pause button is present
      expect(screen.getByRole('button', { name: /Pause timer/i })).toBeInTheDocument();
    });

    it('switches duration when user toggles Break mode in UI', () => {
      render(<StudyTimerWidget focusMinutes={25} breakMinutes={5} />);

      const breakBtn = screen.getByRole('button', { name: /^Break$/i });
      fireEvent.click(breakBtn);

      expect(breakBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('05:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start break timer/i })).toBeInTheDocument();
    });

    it('renders accessible live region for screen readers', () => {
      render(<StudyTimerWidget focusMinutes={25} breakMinutes={5} />);

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('State Management: RECORD_STUDY_SESSION Action', () => {
    it('records completed study session minutes into project metadata without polluting undo history', () => {
      const project = createProject('student', { title: 'Study Project' });
      const initialState: ProjectEditorState = {
        project: {
          ...project,
          metadata: {
            ...project.metadata,
            completedStudyMinutes: 50,
            completedStudySessions: 2,
          },
        },
        undoStack: [],
        redoStack: [],
        revision: 10,
      };

      const nextState = projectReducer(initialState, {
        type: 'RECORD_STUDY_SESSION',
        elapsedMinutes: 25,
      });

      expect(nextState.project.metadata.completedStudyMinutes).toBe(75);
      expect(nextState.project.metadata.completedStudySessions).toBe(3);
      expect(nextState.revision).toBe(11);
      // Study session metrics should not pollute undo stack
      expect(nextState.undoStack.length).toBe(0);
    });
  });
});
