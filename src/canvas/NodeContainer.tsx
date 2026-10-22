/**
 * Accessible Canvas Node Card component with drag handles and ports.
 */
import React, { useState } from 'react';
import type { CanvasNode, EntityId, PortSide } from '../domain/models';
import { formatSecondsToTimecode } from '../domain/calculators';
import { Badge } from '../design-system/components/Badge';
import { LockIcon, TrashIcon, UnlockIcon } from '../design-system/components/Icons';
import { copyToClipboard } from '../utils/clipboard';
import styles from './NodeContainer.module.css';

export interface NodeContainerProps {
  node: CanvasNode;
  isSelected: boolean;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  isConnectionSource?: boolean;
  isConnectionTarget?: boolean;
  connectionSourcePort?: PortSide | null;
  hoveredTargetPort?: PortSide | null;
  invalidTargetPort?: PortSide | null;
  isCandidateTarget?: boolean;
  connectedPorts?: ReadonlySet<PortSide> | undefined;
  onSelect: (nodeId: EntityId, e: React.MouseEvent | React.KeyboardEvent) => void;
  onDelete: (nodeId: EntityId) => void;
  onToggleLock: (nodeId: EntityId) => void;
  onContextMenu?: (nodeId: EntityId, e: React.MouseEvent) => void;
  onPointerDown: (nodeId: EntityId, e: React.PointerEvent) => void;
  onPortPointerDown?: (nodeId: EntityId, port: PortSide, e: React.PointerEvent) => void;
}

export const NodeContainer: React.FC<NodeContainerProps> = React.memo(
  ({
    node,
    isSelected,
    isDragging,
    dragOffset,
    isConnectionSource = false,
    isConnectionTarget = false,
    connectionSourcePort = null,
    hoveredTargetPort = null,
    invalidTargetPort = null,
    isCandidateTarget = false,
    connectedPorts,
    onSelect,
    onDelete,
    onToggleLock,
    onContextMenu,
    onPointerDown,
    onPortPointerDown,
  }) => {
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const posX = node.position.x + (isDragging ? dragOffset.x : 0);
    const posY = node.position.y + (isDragging ? dragOffset.y : 0);

    const handleCopySnippet = async (e: React.MouseEvent, code: string) => {
      e.stopPropagation();
      const ok = await copyToClipboard(code);
      if (ok) {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      }
    };

    const renderPayloadPreview = () => {
      const p = node.payload;

      // Developer Studio Nodes
      if (p.kind === 'dev-architecture') {
        const statusClass =
          p.status === 'healthy'
            ? styles.statusHealthy
            : p.status === 'planned'
              ? styles.statusPlanned
              : styles.statusDeprecated;

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="blue">{p.componentKind.toUpperCase()}</Badge>
              {p.environment && <Badge variant="neutral">{p.environment}</Badge>}
              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center' }}>
                <span className={`${styles.statusDot} ${statusClass}`} />
                {p.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
              <strong>Stack:</strong> {p.techStack || 'Unspecified'}
            </div>
            {p.endpointHint && (
              <div style={{ fontSize: 10, color: 'var(--mr-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <code>{p.endpointHint}</code>
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'dev-code-snippet') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadHeader}>
              <div className={styles.payloadBadges}>
                <Badge variant="cyan">{p.language || 'code'}</Badge>
                {p.filePathHint && <span style={{ fontSize: 10, color: 'var(--mr-text-muted)' }}>{p.filePathHint}</span>}
              </div>
            </div>
            <div className={styles.codeContainer}>
              <button
                type="button"
                className={styles.copyCodeBtn}
                onClick={(e) => handleCopySnippet(e, p.code)}
                title="Copy snippet to clipboard"
                aria-label="Copy snippet to clipboard"
              >
                {copiedSnippet ? 'Copied!' : 'Copy'}
              </button>
              <div className={styles.codeSnippet}>{p.code || '// empty code snippet'}</div>
            </div>
          </div>
        );
      }

      if (p.kind === 'dev-task') {
        const completedSubtasks = p.subtasks ? p.subtasks.filter((s) => s.completed).length : 0;
        const totalSubtasks = p.subtasks ? p.subtasks.length : 0;
        const priorityVariant =
          p.priority === 'critical'
            ? 'danger'
            : p.priority === 'high'
              ? 'rose'
              : p.priority === 'medium'
                ? 'amber'
                : 'neutral';

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant={p.issueType === 'bug' ? 'danger' : 'purple'}>
                {p.issueType.toUpperCase()}
              </Badge>
              <Badge variant={priorityVariant}>{p.priority}</Badge>
              <Badge variant={p.status === 'done' ? 'emerald' : 'neutral'}>{p.status}</Badge>
              {p.estimatePoints !== undefined && (
                <span style={{ fontSize: 11, color: 'var(--mr-text-muted)' }}>{p.estimatePoints} pts</span>
              )}
            </div>
            {totalSubtasks > 0 && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
                ✓ {completedSubtasks}/{totalSubtasks} subtasks completed
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'dev-note') {
        return (
          <div className={styles.payloadPreview}>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', maxHeight: 38, overflow: 'hidden' }}>
              {p.markdownBody || 'Empty technical note...'}
            </div>
          </div>
        );
      }

      // Video Creator Studio Nodes
      if (p.kind === 'video-scene') {
        const statusVariant =
          p.productionStatus === 'edited'
            ? 'emerald'
            : p.productionStatus === 'filmed'
              ? 'blue'
              : p.productionStatus === 'scripted'
                ? 'amber'
                : 'neutral';

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="orange">Scene {p.sceneNumber}</Badge>
              <Badge variant="neutral">⏱ {formatSecondsToTimecode(p.durationSeconds)}</Badge>
              <Badge variant="cyan">{p.framing}</Badge>
              <Badge variant={statusVariant}>{p.productionStatus}</Badge>
            </div>
            {p.scriptText && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                &ldquo;{p.scriptText}&rdquo;
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'video-script-beat') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="rose">{p.beatType.toUpperCase()}</Badge>
              <Badge variant="neutral">{p.targetDurationSeconds}s</Badge>
            </div>
            {p.scriptText && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.scriptText}
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'video-shot-item') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="amber">{p.shotCode || 'SHOT'}</Badge>
              <Badge variant="neutral">{p.framing}</Badge>
              <Badge variant="blue">{p.status}</Badge>
            </div>
            {p.locationOrSetup && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
                📍 {p.locationOrSetup}
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'video-note') {
        return (
          <div className={styles.payloadPreview}>
            <Badge variant="neutral">{p.noteCategory}</Badge>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, maxHeight: 36, overflow: 'hidden' }}>
              {p.content}
            </div>
          </div>
        );
      }

      // Student Studio Nodes
      if (p.kind === 'student-concept') {
        const masteryVariant =
          p.mastery === 'mastered'
            ? 'emerald'
            : p.mastery === 'reviewing'
              ? 'purple'
              : p.mastery === 'learning'
                ? 'blue'
                : 'cyan';

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              {p.isRootTopic && <Badge variant="amber">ROOT TOPIC</Badge>}
              <Badge variant={masteryVariant}>{p.mastery.toUpperCase()}</Badge>
            </div>
            {p.keyTerms && p.keyTerms.length > 0 && (
              <div className={styles.tagsRow}>
                {p.keyTerms.slice(0, 4).map((term) => (
                  <span key={term} className={styles.tagChip}>
                    #{term}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'student-flashcard') {
        const confVariant =
          p.lastConfidence === 'easy'
            ? 'emerald'
            : p.lastConfidence === 'good'
              ? 'blue'
              : p.lastConfidence === 'hard'
                ? 'amber'
                : p.lastConfidence === 'again'
                  ? 'danger'
                  : 'neutral';

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="blue">FLASHCARD</Badge>
              {p.reviewCount > 0 && (
                <span style={{ fontSize: 10, color: 'var(--mr-text-muted)' }}>
                  Reviewed {p.reviewCount}x
                </span>
              )}
              {p.lastConfidence !== 'unrated' && <Badge variant={confVariant}>{p.lastConfidence}</Badge>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--mr-text-primary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong>Q:</strong> {p.frontPrompt || 'No prompt set'}
            </div>
            {p.hint && (
              <div style={{ fontSize: 10, color: 'var(--mr-text-muted)' }}>
                <em>Hint: {p.hint}</em>
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'student-note') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="purple">{p.topicArea || 'Note'}</Badge>
              <Badge variant="neutral">{p.mastery}</Badge>
            </div>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, maxHeight: 36, overflow: 'hidden' }}>
              {p.markdownBody || 'Empty study note...'}
            </div>
          </div>
        );
      }

      if (p.kind === 'student-revision-block') {
        const completedItems = p.items ? p.items.filter((i) => i.completed).length : 0;
        const totalItems = p.items ? p.items.length : 0;

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant={p.priority === 'high' ? 'rose' : 'amber'}>
                {p.priority.toUpperCase()} REVISION
              </Badge>
              {p.examOrGoalDate && (
                <span style={{ fontSize: 10, color: 'var(--mr-text-muted)' }}>📅 {p.examOrGoalDate}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
              ✓ {completedItems}/{totalItems} items completed
            </div>
          </div>
        );
      }

      // Freelance & Business Studio Nodes
      if (p.kind === 'freelance-task') {
        const statusVariant =
          p.status === 'done'
            ? 'emerald'
            : p.status === 'review'
              ? 'purple'
              : p.status === 'in-progress'
                ? 'amber'
                : 'blue';

        const priorityVariant =
          p.priority === 'urgent'
            ? 'rose'
            : p.priority === 'high'
              ? 'amber'
              : p.priority === 'medium'
                ? 'blue'
                : 'neutral';

        const completedSubtasks = p.subtasks ? p.subtasks.filter((s) => s.completed).length : 0;
        const totalSubtasks = p.subtasks ? p.subtasks.length : 0;

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant={statusVariant}>{p.status.toUpperCase()}</Badge>
              <Badge variant={priorityVariant}>{p.priority.toUpperCase()}</Badge>
              {p.dueDate && (
                <span style={{ fontSize: 10, color: 'var(--mr-text-muted)' }}>📅 {p.dueDate}</span>
              )}
            </div>
            {totalSubtasks > 0 && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
                ✓ {completedSubtasks}/{totalSubtasks} subtasks completed
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'freelance-stage') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="purple">STAGE {p.stageNumber}</Badge>
              <Badge variant="blue">{p.phase.toUpperCase()}</Badge>
            </div>
            {p.deliverableSummary && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.deliverableSummary}
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'freelance-deliverable') {
        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="emerald">{p.format.toUpperCase()}</Badge>
              <Badge variant={p.clientApproved ? 'emerald' : 'amber'}>
                {p.clientApproved ? 'APPROVED' : 'IN REVIEW'}
              </Badge>
            </div>
            {p.reviewNotes && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                💬 {p.reviewNotes}
              </div>
            )}
          </div>
        );
      }

      if (p.kind === 'freelance-note') {
        return (
          <div className={styles.payloadPreview}>
            <Badge variant="cyan">{p.noteType.replace('-', ' ').toUpperCase()}</Badge>
            <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2, maxHeight: 36, overflow: 'hidden' }}>
              {p.markdownBody || 'No notes added yet...'}
            </div>
          </div>
        );
      }

      if (p.kind === 'freelance-review-item') {
        const completedChecks = p.checklist ? p.checklist.filter((c) => c.completed).length : 0;
        const totalChecks = p.checklist ? p.checklist.length : 0;

        return (
          <div className={styles.payloadPreview}>
            <div className={styles.payloadBadges}>
              <Badge variant="blue">👤 {p.reviewer}</Badge>
              <Badge variant={p.approved ? 'emerald' : 'rose'}>
                {p.approved ? 'SIGN-OFF GRANTED' : 'CHANGES REQUESTED'}
              </Badge>
            </div>
            {totalChecks > 0 && (
              <div style={{ fontSize: 11, color: 'var(--mr-text-secondary)', marginTop: 2 }}>
                ✓ {completedChecks}/{totalChecks} sign-off criteria met
              </div>
            )}
          </div>
        );
      }

      return null;
    };

    const getPortClassName = (side: PortSide) => {
      const isSource = isConnectionSource && connectionSourcePort === side;
      const isTarget = hoveredTargetPort === side;
      const isInvalid = invalidTargetPort === side;
      const isConnected = connectedPorts?.has(side);
      const isCandidate = isCandidateTarget && !isSource;

      const sideCap = (side.charAt(0).toUpperCase() + side.slice(1)) as 'Top' | 'Right' | 'Bottom' | 'Left';

      return [
        styles.port,
        styles[`port${sideCap}`],
        isConnected ? styles.portConnected : '',
        isCandidate ? styles.portCandidate : '',
        isSource ? styles.portSource : '',
        isTarget ? styles.portValidTarget : '',
        isInvalid ? styles.portInvalidTarget : '',
      ]
        .filter(Boolean)
        .join(' ');
    };

    return (
      <div
        id={`node-${node.id}`}
        data-node-card="true"
        data-node-id={node.id}
        tabIndex={0}
        role="button"
        aria-label={`${node.title}, ${node.category || 'node'}, ${isSelected ? 'selected' : 'unselected'}`}
        className={`${styles.nodeCard} ${styles[`color-${node.colorToken}`]} ${
          isSelected ? styles.selected : ''
        } ${isDragging ? styles.dragging : ''} ${
          node.locked ? styles.lockedNode : ''
        } ${
          isConnectionSource ? styles.connectionSource : ''
        } ${isConnectionTarget ? styles.connectionTarget : ''}`}
        style={{
          transform: `translate3d(${posX}px, ${posY}px, 0)`,
          width: `${node.dimensions.width}px`,
          height: `${node.dimensions.height}px`,
          zIndex: node.zIndex,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id, e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (
            (e.target as HTMLElement).closest(`.${styles.port}`) ||
            (e.target as HTMLElement).closest('[data-port-handle]') ||
            (e.target as HTMLElement).closest('button, input, textarea, select')
          ) {
            return;
          }
          onContextMenu?.(node.id, e);
        }}
        onPointerDown={(e) => {
          // Do not initiate node drag/selection when interacting with connection ports
          if ((e.target as HTMLElement).closest(`.${styles.port}`) || (e.target as HTMLElement).closest('[data-port-handle]')) {
            return;
          }
          // Do not drag node or bubble to canvas marquee when interacting with buttons/inputs
          if ((e.target as HTMLElement).closest('button, input, textarea, select')) {
            e.stopPropagation();
            return;
          }
          onPointerDown(node.id, e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSelect(node.id, e);
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            onDelete(node.id);
          }
        }}
      >
        {/* Connection Ports */}
        <div
          data-port-handle="true"
          data-port-side="top"
          data-node-id={node.id}
          className={getPortClassName('top')}
          title="Connect Top Port"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown?.(node.id, 'top', e);
          }}
        />
        <div
          data-port-handle="true"
          data-port-side="right"
          data-node-id={node.id}
          className={getPortClassName('right')}
          title="Connect Right Port"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown?.(node.id, 'right', e);
          }}
        />
        <div
          data-port-handle="true"
          data-port-side="bottom"
          data-node-id={node.id}
          className={getPortClassName('bottom')}
          title="Connect Bottom Port"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown?.(node.id, 'bottom', e);
          }}
        />
        <div
          data-port-handle="true"
          data-port-side="left"
          data-node-id={node.id}
          className={getPortClassName('left')}
          title="Connect Left Port"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown?.(node.id, 'left', e);
          }}
        />

        {/* Card Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle} title={node.title}>
            {node.title}
          </span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.iconBtn} ${node.locked ? styles.lockedActive : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(node.id);
              }}
              title={node.locked ? 'Unlock node position' : 'Lock node position'}
              aria-label={node.locked ? 'Unlock node position' : 'Lock node position'}
              aria-pressed={node.locked}
            >
              {node.locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.deleteBtn}`}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              title="Delete node"
              aria-label="Delete node"
            >
              <TrashIcon size={14} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className={styles.body}>
          {node.description && <p className={styles.description}>{node.description}</p>}
          {renderPayloadPreview()}
        </div>

        {/* Card Footer */}
        <div className={styles.footer}>
          <span>{node.category || node.payload.kind}</span>
          <Badge variant={node.colorToken}>{node.colorToken}</Badge>
        </div>
      </div>
    );
  }
);

NodeContainer.displayName = 'NodeContainer';
