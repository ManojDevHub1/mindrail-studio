/**
 * Real-time workspace metrics summary strip.
 * Conforms to Sections 3.E, 4.G, 5.E and docs/DATA_MODEL.md.
 */
import { useMemo } from 'react';
import type { CanvasEdge, CanvasNode, WorkspaceType } from '../domain/models';
import {
  calculateDeveloperSummary,
  calculateFreelanceSummary,
  calculateStudentSummary,
  calculateVideoSummary,
  formatSecondsToTimecode,
} from '../domain/calculators';
import { Button } from '../design-system/components/Button';
import { StudyTimerWidget } from './student/StudyTimerWidget';
import styles from './WorkspaceSummaryBar.module.css';

export interface WorkspaceSummaryBarProps {
  workspaceType: WorkspaceType;
  nodes: readonly CanvasNode[];
  edges: readonly CanvasEdge[];
  focusMinutes?: number | undefined;
  breakMinutes?: number | undefined;
  onOpenStudyMode?: (() => void) | undefined;
  onStudySessionComplete?: ((mode: 'focus' | 'break', elapsedMinutes: number) => void) | undefined;
}

export function WorkspaceSummaryBar({
  workspaceType,
  nodes,
  edges,
  focusMinutes = 25,
  breakMinutes = 5,
  onOpenStudyMode,
  onStudySessionComplete,
}: WorkspaceSummaryBarProps) {
  const devSummary = useMemo(() => calculateDeveloperSummary(nodes), [nodes]);
  const videoSummary = useMemo(() => calculateVideoSummary(nodes), [nodes]);
  const studentSummary = useMemo(() => calculateStudentSummary(nodes), [nodes]);
  const freelanceSummary = useMemo(() => calculateFreelanceSummary(nodes), [nodes]);

  // Derived counts
  const architectureNodesCount = useMemo(
    () => nodes.filter((n) => n.payload.kind === 'dev-architecture').length,
    [nodes]
  );
  const codeSnippetsCount = useMemo(
    () => nodes.filter((n) => n.payload.kind === 'dev-code-snippet').length,
    [nodes]
  );
  const scriptBeatsCount = useMemo(
    () => nodes.filter((n) => n.payload.kind === 'video-script-beat').length,
    [nodes]
  );
  const shotsCount = useMemo(
    () => nodes.filter((n) => n.payload.kind === 'video-shot-item').length,
    [nodes]
  );
  const flashcardsCount = useMemo(
    () => nodes.filter((n) => n.payload.kind === 'student-flashcard').length,
    [nodes]
  );

  return (
    <div className={styles.summaryBar} role="region" aria-label="Workspace metrics summary">
      <div className={styles.metricsGroup}>
        {workspaceType === 'developer' && (
          <>
            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotBlue}`} />
              <span>Components:</span>
              <span className={styles.metricValue}>{architectureNodesCount}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotPurple}`} />
              <span>Tasks:</span>
              <span className={styles.metricValue}>
                {devSummary.byStatus.done}/{devSummary.totalTasks} Done
              </span>
              {devSummary.totalTasks > 0 && (
                <span className={styles.progressBarMini}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${devSummary.completedPercentage}%`,
                      backgroundColor: 'var(--mr-node-purple-accent)',
                    }}
                  />
                </span>
              )}
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotAmber}`} />
              <span>In-Progress:</span>
              <span className={styles.metricValue}>{devSummary.byStatus['in-progress']}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotEmerald}`} />
              <span>Snippets:</span>
              <span className={styles.metricValue}>{codeSnippetsCount}</span>
            </div>

            <div className={styles.metricItem}>
              <span>Connections:</span>
              <span className={styles.metricValue}>{edges.length}</span>
            </div>
          </>
        )}

        {workspaceType === 'video' && (
          <>
            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotOrange}`} />
              <span>Total Planned Runtime:</span>
              <span className={styles.metricValue} style={{ color: 'var(--mr-node-orange-accent)' }}>
                {formatSecondsToTimecode(videoSummary.totalRuntimeSeconds)}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span>Scenes:</span>
              <span className={styles.metricValue}>{videoSummary.sceneCount}</span>
            </div>

            <div className={styles.metricItem}>
              <span>Script Beats:</span>
              <span className={styles.metricValue}>{scriptBeatsCount}</span>
            </div>

            <div className={styles.metricItem}>
              <span>Shots:</span>
              <span className={styles.metricValue}>{shotsCount}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotEmerald}`} />
              <span>Filmed:</span>
              <span className={styles.metricValue}>{videoSummary.statusCounts.filmed}</span>
            </div>
          </>
        )}

        {workspaceType === 'student' && (
          <>
            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotEmerald}`} />
              <span>Concepts:</span>
              <span className={styles.metricValue}>{studentSummary.totalConcepts}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotBlue}`} />
              <span>Flashcards:</span>
              <span className={styles.metricValue}>{studentSummary.totalFlashcards}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotPurple}`} />
              <span>Mastered:</span>
              <span className={styles.metricValue}>
                {studentSummary.masteryCounts.mastered}/{studentSummary.totalConcepts} (
                {studentSummary.masteryPercentage}%)
              </span>
              {studentSummary.totalConcepts > 0 && (
                <span className={styles.progressBarMini}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${studentSummary.masteryPercentage}%`,
                      backgroundColor: 'var(--mr-node-emerald-accent)',
                    }}
                  />
                </span>
              )}
            </div>
          </>
        )}

        {workspaceType === 'freelance' && (
          <>
            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotBlue}`} />
              <span>Tasks:</span>
              <span className={styles.metricValue}>
                {freelanceSummary.completedTasks}/{freelanceSummary.totalTasks} Done
              </span>
              {freelanceSummary.totalTasks > 0 && (
                <span className={styles.progressBarMini}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${freelanceSummary.completedPercentage}%`,
                      backgroundColor: 'var(--mr-node-blue-accent)',
                    }}
                  />
                </span>
              )}
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotAmber}`} />
              <span>In-Progress:</span>
              <span className={styles.metricValue}>{freelanceSummary.byStatus['in-progress']}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotPurple}`} />
              <span>Stages:</span>
              <span className={styles.metricValue}>{freelanceSummary.totalStages}</span>
            </div>

            <div className={styles.metricItem}>
              <span className={`${styles.metricDot} ${styles.dotEmerald}`} />
              <span>Deliverables:</span>
              <span className={styles.metricValue}>
                {freelanceSummary.approvedDeliverables}/{freelanceSummary.totalDeliverables} Approved
              </span>
            </div>
          </>
        )}
      </div>

      <div className={styles.actionsGroup}>
        {workspaceType === 'student' && (
          <>
            <StudyTimerWidget
              focusMinutes={focusMinutes}
              breakMinutes={breakMinutes}
              onSessionComplete={onStudySessionComplete}
            />
            {flashcardsCount > 0 && onOpenStudyMode && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenStudyMode}
                title="Start Interactive Flashcard Study Mode"
              >
                Study Flashcards ({flashcardsCount})
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
