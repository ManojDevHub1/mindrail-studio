/**
 * Accessible Interactive Study Timer Widget.
 * Conforms to Phase 5 Feature B and docs/PRD.md.
 */
import { useState } from 'react';
import { formatSecondsToTimecode } from '../../domain/calculators';
import { Button } from '../../design-system/components/Button';
import { PlayIcon } from '../../design-system/components/Icons';
import { useStudyTimer } from './useStudyTimer';
import styles from './StudyTimerWidget.module.css';

export interface StudyTimerWidgetProps {
  focusMinutes?: number | undefined;
  breakMinutes?: number | undefined;
  onSessionComplete?: ((mode: 'focus' | 'break', elapsedMinutes: number) => void) | undefined;
  className?: string | undefined;
}

export function StudyTimerWidget({
  focusMinutes = 25,
  breakMinutes = 5,
  onSessionComplete,
  className,
}: StudyTimerWidgetProps) {
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const {
    mode,
    status,
    remainingSeconds,
    completedSessions,
    start,
    pause,
    resume,
    reset,
    setMode,
  } = useStudyTimer({
    focusDurationMinutes: focusMinutes,
    breakDurationMinutes: breakMinutes,
    onSessionComplete,
    onAnnouncement: (msg) => setLiveAnnouncement(msg),
  });

  const formattedTime = formatSecondsToTimecode(remainingSeconds);

  return (
    <div
      className={`${styles.timerCard} ${className || ''}`}
      role="region"
      aria-label="Student Study Timer"
    >
      {/* Live Region for Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className={styles.visuallyHidden}>
        {liveAnnouncement}
      </div>

      {/* Mode Toggle: Focus vs Break */}
      <div className={styles.modeToggle} role="group" aria-label="Timer Mode">
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'focus' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('focus')}
          aria-pressed={mode === 'focus'}
        >
          Focus
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${mode === 'break' ? styles.modeBtnActive : ''}`}
          onClick={() => setMode('break')}
          aria-pressed={mode === 'break'}
        >
          Break
        </button>
      </div>

      {/* Digital Countdown Display */}
      <div
        className={`${styles.timeDisplay} ${
          status === 'running'
            ? styles.timeRunning
            : status === 'completed'
              ? styles.timeCompleted
              : ''
        }`}
        aria-label={`${formattedTime} remaining in ${mode} session`}
      >
        {formattedTime}
      </div>

      {/* Control Actions */}
      <div className={styles.controlsRow}>
        {status === 'idle' && (
          <Button
            variant="primary"
            size="sm"
            onClick={start}
            icon={<PlayIcon size={12} />}
            aria-label={`Start ${mode} timer`}
          >
            Start
          </Button>
        )}

        {status === 'running' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={pause}
            aria-label="Pause timer"
          >
            Pause
          </Button>
        )}

        {status === 'paused' && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={resume}
              aria-label="Resume timer"
            >
              Resume
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              aria-label="Reset timer"
            >
              Reset
            </Button>
          </>
        )}

        {status === 'completed' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (mode === 'focus') setMode('break');
              else setMode('focus');
            }}
          >
            {mode === 'focus' ? 'Take Break' : 'Focus Again'}
          </Button>
        )}

        {status !== 'idle' && status !== 'paused' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            title="Reset timer to beginning"
            aria-label="Reset timer"
          >
            &times;
          </Button>
        )}
      </div>

      {/* Session counter indicator */}
      {completedSessions > 0 && (
        <span className={styles.sessionsBadge} title="Completed focus sessions">
          ★ {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'}
        </span>
      )}
    </div>
  );
}
