/**
 * Pure drift-free countdown timer hook for Student Studio.
 * Uses end timestamps to prevent timing drift across inactive browser tabs.
 * Conforms to Phase 5 Feature B and docs/PRD.md.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type StudyTimerMode = 'focus' | 'break';
export type StudyTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface UseStudyTimerOptions {
  focusDurationMinutes?: number | undefined;
  breakDurationMinutes?: number | undefined;
  onSessionComplete?: ((mode: StudyTimerMode, elapsedMinutes: number) => void) | undefined;
  onAnnouncement?: ((message: string) => void) | undefined;
}

export interface UseStudyTimerReturn {
  mode: StudyTimerMode;
  status: StudyTimerStatus;
  remainingSeconds: number;
  totalDurationSeconds: number;
  completedSessions: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setMode: (mode: StudyTimerMode) => void;
  setDurationMinutes: (minutes: number) => void;
}

export function useStudyTimer({
  focusDurationMinutes = 25,
  breakDurationMinutes = 5,
  onSessionComplete,
  onAnnouncement,
}: UseStudyTimerOptions = {}): UseStudyTimerReturn {
  const [mode, setModeState] = useState<StudyTimerMode>('focus');
  const [status, setStatus] = useState<StudyTimerStatus>('idle');
  const [completedSessions, setCompletedSessions] = useState(0);

  // Duration in seconds for current mode
  const currentDurationSeconds =
    (mode === 'focus' ? focusDurationMinutes : breakDurationMinutes) * 60;

  const [remainingSeconds, setRemainingSeconds] = useState(currentDurationSeconds);

  // References for timestamp tracking
  const endTimestampRef = useRef<number | null>(null);
  const remainingAtPauseRef = useRef<number>(currentDurationSeconds);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimerInterval = () => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleComplete = useCallback(() => {
    clearTimerInterval();
    endTimestampRef.current = null;
    setStatus('completed');
    setRemainingSeconds(0);

    if (mode === 'focus') {
      setCompletedSessions((prev) => prev + 1);
      onSessionComplete?.('focus', focusDurationMinutes);
      onAnnouncement?.(`Focus session of ${focusDurationMinutes} minutes complete! Time for a break.`);
    } else {
      onSessionComplete?.('break', breakDurationMinutes);
      onAnnouncement?.('Break complete! Ready to start another focus session.');
    }
  }, [breakDurationMinutes, focusDurationMinutes, mode, onAnnouncement, onSessionComplete]);

  // Tick function using wall-clock delta to prevent drift
  const tick = useCallback(() => {
    if (!endTimestampRef.current) return;

    const now = Date.now();
    const remainingMs = endTimestampRef.current - now;
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

    setRemainingSeconds(remaining);

    if (remaining <= 0) {
      handleComplete();
    }
  }, [handleComplete]);

  // Handle visibility changes (re-calculate on tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running' && endTimestampRef.current) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, tick]);

  const start = useCallback(() => {
    clearTimerInterval();
    const now = Date.now();
    const targetSeconds =
      remainingAtPauseRef.current > 0 ? remainingAtPauseRef.current : currentDurationSeconds;

    endTimestampRef.current = now + targetSeconds * 1000;
    setStatus('running');
    setRemainingSeconds(targetSeconds);

    onAnnouncement?.(`Started ${mode} timer for ${Math.ceil(targetSeconds / 60)} minutes.`);

    timerIntervalRef.current = setInterval(tick, 200);
  }, [currentDurationSeconds, mode, onAnnouncement, tick]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    clearTimerInterval();

    const now = Date.now();
    let currentRemaining = remainingSeconds;
    if (endTimestampRef.current) {
      currentRemaining = Math.max(0, Math.ceil((endTimestampRef.current - now) / 1000));
    }

    remainingAtPauseRef.current = currentRemaining;
    endTimestampRef.current = null;
    setStatus('paused');
    setRemainingSeconds(currentRemaining);

    onAnnouncement?.(`Paused timer with ${Math.ceil(currentRemaining / 60)} minutes remaining.`);
  }, [onAnnouncement, remainingSeconds, status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    start();
  }, [start, status]);

  const reset = useCallback(() => {
    clearTimerInterval();
    endTimestampRef.current = null;
    remainingAtPauseRef.current = currentDurationSeconds;
    setStatus('idle');
    setRemainingSeconds(currentDurationSeconds);

    onAnnouncement?.(`Reset timer to ${Math.round(currentDurationSeconds / 60)} minutes.`);
  }, [currentDurationSeconds, onAnnouncement]);

  const setMode = useCallback(
    (newMode: StudyTimerMode) => {
      clearTimerInterval();
      endTimestampRef.current = null;
      setModeState(newMode);
      setStatus('idle');
      const newDuration = (newMode === 'focus' ? focusDurationMinutes : breakDurationMinutes) * 60;
      remainingAtPauseRef.current = newDuration;
      setRemainingSeconds(newDuration);
    },
    [breakDurationMinutes, focusDurationMinutes]
  );

  const setDurationMinutes = useCallback((minutes: number) => {
    const validMinutes = Math.max(1, Math.min(180, minutes));
    const newSeconds = validMinutes * 60;
    remainingAtPauseRef.current = newSeconds;
    setRemainingSeconds(newSeconds);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, []);

  return {
    mode,
    status,
    remainingSeconds,
    totalDurationSeconds: currentDurationSeconds,
    completedSessions,
    start,
    pause,
    resume,
    reset,
    setMode,
    setDurationMinutes,
  };
}
