/**
 * Contextual Right Node Inspector Panel.
 * Live editing for node properties and workspace payloads.
 */
import { useState } from 'react';
import type { CanvasNode, EntityId, NodeColorToken } from '../domain/models';
import type {
  ArchitectureComponentKind,
  DevTaskPriority,
  DevTaskStatus,
  FlashcardConfidence,
  FreelanceNoteType,
  FreelanceStagePhase,
  FreelanceTaskPriority,
  FreelanceTaskStatus,
  MasteryLevel,
  ShotFramingType,
  ShotProductionStatus,
  WorkspaceNodePayload,
} from '../domain/workspaceTypes';
import { formatSecondsToTimecode } from '../domain/calculators';
import { createChecklistItem } from '../domain/factories';
import { Button } from '../design-system/components/Button';
import { Input, Select, Textarea } from '../design-system/components/FormControls';
import { CloseIcon, LockIcon, PlusIcon, TrashIcon, UnlockIcon } from '../design-system/components/Icons';
import { copyToClipboard } from '../utils/clipboard';
import styles from './NodeInspector.module.css';

export interface NodeInspectorProps {
  node: CanvasNode;
  onUpdateNode: (
    nodeId: EntityId,
    updates: {
      title?: string;
      description?: string;
      colorToken?: NodeColorToken;
      category?: string;
      locked?: boolean;
      payload?: WorkspaceNodePayload;
    },
    coalesceKey?: string
  ) => void;
  onCommitCoalesce?: () => void;
  onDeleteNode: (nodeId: EntityId) => void;
  onClose: () => void;
}

const COLOR_TOKENS: readonly { token: NodeColorToken; hex: string }[] = [
  { token: 'neutral', hex: '#7E8BA6' },
  { token: 'blue', hex: '#5E9EFF' },
  { token: 'purple', hex: '#A855F7' },
  { token: 'cyan', hex: '#06B6D4' },
  { token: 'emerald', hex: '#10B981' },
  { token: 'amber', hex: '#F59E0B' },
  { token: 'rose', hex: '#F43F5E' },
  { token: 'orange', hex: '#F97316' },
];

export function NodeInspector({
  node,
  onUpdateNode,
  onCommitCoalesce,
  onDeleteNode,
  onClose,
}: NodeInspectorProps) {
  const [newSubtask, setNewSubtask] = useState('');
  const [newKeyTerm, setNewKeyTerm] = useState('');
  const [newSceneChecklistItem, setNewSceneChecklistItem] = useState('');
  const [newRevisionItem, setNewRevisionItem] = useState('');
  const [newFreelanceSubtask, setNewFreelanceSubtask] = useState('');
  const [newSignoffItem, setNewSignoffItem] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handlePayloadChange = (payloadUpdates: Partial<WorkspaceNodePayload>, coalesceKey?: string) => {
    onUpdateNode(
      node.id,
      {
        payload: { ...node.payload, ...payloadUpdates } as WorkspaceNodePayload,
      },
      coalesceKey
    );
  };

  const handleCopyCode = async (code: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const renderPayloadForm = () => {
    const p = node.payload;

    if (p.kind === 'dev-architecture') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Architecture Details</span>
          <Select
            label="Component Kind"
            value={p.componentKind}
            onChange={(e) => handlePayloadChange({ componentKind: e.target.value as ArchitectureComponentKind })}
          >
            <option value="service">Service (Backend Microservice)</option>
            <option value="database">Database (Storage)</option>
            <option value="queue">Queue (Message Broker)</option>
            <option value="client">Client (Frontend / App)</option>
            <option value="external-api">External Third-Party API</option>
            <option value="boundary">Boundary / Gateway</option>
          </Select>

          <Input
            label="Tech Stack"
            value={p.techStack}
            placeholder="e.g. Node.js / PostgreSQL / Redis"
            onChange={(e) => handlePayloadChange({ techStack: e.target.value }, `${node.id}:techStack`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Select
            label="Environment"
            value={p.environment || 'production'}
            onChange={(e) => handlePayloadChange({ environment: e.target.value as 'local' | 'staging' | 'production' })}
          >
            <option value="local">Local Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </Select>

          <Select
            label="Health Status"
            value={p.status}
            onChange={(e) => handlePayloadChange({ status: e.target.value as 'healthy' | 'planned' | 'deprecated' })}
          >
            <option value="healthy">Healthy / Active</option>
            <option value="planned">Planned</option>
            <option value="deprecated">Deprecated</option>
          </Select>

          <Input
            label="Endpoint URL Hint"
            value={p.endpointHint || ''}
            placeholder="https://api.example.com/v1"
            onChange={(e) => handlePayloadChange({ endpointHint: e.target.value }, `${node.id}:endpointHint`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'dev-code-snippet') {
      return (
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.sectionTitle}>Code Snippet</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopyCode(p.code)}
              title="Copy snippet code"
            >
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          <Input
            label="Language"
            value={p.language}
            placeholder="typescript, python, sql..."
            onChange={(e) => handlePayloadChange({ language: e.target.value }, `${node.id}:language`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Input
            label="File Path Hint"
            value={p.filePathHint || ''}
            placeholder="src/services/auth.ts"
            onChange={(e) => handlePayloadChange({ filePathHint: e.target.value }, `${node.id}:filePathHint`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Textarea
            label="Code Body"
            isCode
            rows={8}
            value={p.code}
            onChange={(e) => handlePayloadChange({ code: e.target.value }, `${node.id}:code`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'dev-task') {
      const subtasks = p.subtasks || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Task Tracking</span>
          <Select
            label="Issue Type"
            value={p.issueType}
            onChange={(e) => handlePayloadChange({ issueType: e.target.value as 'task' | 'bug' })}
          >
            <option value="task">Feature Task</option>
            <option value="bug">Bug Fix</option>
          </Select>

          <Select
            label="Status"
            value={p.status}
            onChange={(e) => handlePayloadChange({ status: e.target.value as DevTaskStatus })}
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </Select>

          <Select
            label="Priority"
            value={p.priority}
            onChange={(e) => handlePayloadChange({ priority: e.target.value as DevTaskPriority })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>

          <Input
            label="Estimate Points"
            type="number"
            min={0}
            max={100}
            value={p.estimatePoints ?? ''}
            placeholder="e.g. 1, 2, 3, 5, 8"
            onChange={(e) => {
              if (e.target.value.trim() === '') {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { estimatePoints: _removed, ...rest } = p;
                onUpdateNode(node.id, { payload: rest as WorkspaceNodePayload });
              } else {
                handlePayloadChange({ estimatePoints: Math.max(0, parseInt(e.target.value, 10) || 0) });
              }
            }}
          />

          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 'var(--mr-text-xs)', fontWeight: 600, color: 'var(--mr-text-muted)' }}>
              Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </span>
            <div className={styles.checklistContainer}>
              {subtasks.map((subtask) => (
                <div key={subtask.id} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        const updated = subtasks.map((s) =>
                          s.id === subtask.id ? { ...s, completed: !s.completed } : s
                        );
                        handlePayloadChange({ subtasks: updated });
                      }}
                    />
                    <span className={subtask.completed ? styles.completedText : ''}>{subtask.text}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = subtasks.filter((s) => s.id !== subtask.id);
                      handlePayloadChange({ subtasks: updated });
                    }}
                    title="Delete subtask"
                    aria-label={`Delete subtask ${subtask.text}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubtask.trim()) {
                    e.preventDefault();
                    handlePayloadChange({
                      subtasks: [...subtasks, createChecklistItem(newSubtask.trim())],
                    });
                    setNewSubtask('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newSubtask.trim()) {
                    handlePayloadChange({
                      subtasks: [...subtasks, createChecklistItem(newSubtask.trim())],
                    });
                    setNewSubtask('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (p.kind === 'dev-note') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Technical Note</span>
          <Textarea
            label="Markdown Body"
            rows={8}
            value={p.markdownBody}
            placeholder="Document architecture decisions, API specs, schemas..."
            onChange={(e) => handlePayloadChange({ markdownBody: e.target.value }, `${node.id}:markdownBody`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'video-scene') {
      const checklist = p.checklist || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Scene Planning</span>
          <div className={styles.row}>
            <Input
              label="Scene #"
              type="number"
              min={1}
              value={p.sceneNumber}
              onChange={(e) => handlePayloadChange({ sceneNumber: parseInt(e.target.value, 10) || 1 })}
            />
            <Input
              label={`Duration (sec: ${formatSecondsToTimecode(p.durationSeconds)})`}
              type="number"
              min={0}
              value={p.durationSeconds}
              onChange={(e) => handlePayloadChange({ durationSeconds: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            />
          </div>

          <Select
            label="Framing / Shot Angle"
            value={p.framing}
            onChange={(e) => handlePayloadChange({ framing: e.target.value as ShotFramingType })}
          >
            <option value="wide">Wide Shot</option>
            <option value="medium">Medium Shot</option>
            <option value="close-up">Close-Up</option>
            <option value="extreme-close-up">Extreme Close-Up</option>
            <option value="screen-recording">Screen Recording</option>
            <option value="b-roll">B-Roll Footage</option>
            <option value="motion-graphic">Motion Graphic</option>
          </Select>

          <Select
            label="Production Status"
            value={p.productionStatus}
            onChange={(e) => handlePayloadChange({ productionStatus: e.target.value as ShotProductionStatus })}
          >
            <option value="planned">Planned</option>
            <option value="scripted">Scripted</option>
            <option value="filmed">Filmed</option>
            <option value="edited">Edited</option>
          </Select>

          <Textarea
            label="Spoken Script"
            rows={3}
            value={p.scriptText}
            placeholder="Lines to speak in this scene..."
            onChange={(e) => handlePayloadChange({ scriptText: e.target.value }, `${node.id}:scriptText`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Textarea
            label="Voice-Over Notes"
            rows={2}
            value={p.voiceOverNotes}
            placeholder="Pacing, tone, inflection..."
            onChange={(e) => handlePayloadChange({ voiceOverNotes: e.target.value }, `${node.id}:voiceOverNotes`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Textarea
            label="Typography & Motion Notes"
            rows={2}
            value={p.typographyNotes}
            placeholder="On-screen subtitles, lower thirds, callout arrows..."
            onChange={(e) => handlePayloadChange({ typographyNotes: e.target.value }, `${node.id}:typographyNotes`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Textarea
            label="Transition & SFX Notes"
            rows={2}
            value={p.transitionAndSfxNotes}
            placeholder="Whoosh SFX, cross dissolve, glitch cut..."
            onChange={(e) => handlePayloadChange({ transitionAndSfxNotes: e.target.value }, `${node.id}:transitionAndSfxNotes`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 'var(--mr-text-xs)', fontWeight: 600, color: 'var(--mr-text-muted)' }}>
              Scene Production Checklist ({checklist.filter((i) => i.completed).length}/{checklist.length})
            </span>
            <div className={styles.checklistContainer}>
              {checklist.map((item) => (
                <div key={item.id} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = checklist.map((i) =>
                          i.id === item.id ? { ...i, completed: !i.completed } : i
                        );
                        handlePayloadChange({ checklist: updated });
                      }}
                    />
                    <span className={item.completed ? styles.completedText : ''}>{item.text}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = checklist.filter((i) => i.id !== item.id);
                      handlePayloadChange({ checklist: updated });
                    }}
                    title="Delete item"
                    aria-label={`Delete item ${item.text}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New scene task..."
                value={newSceneChecklistItem}
                onChange={(e) => setNewSceneChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSceneChecklistItem.trim()) {
                    e.preventDefault();
                    handlePayloadChange({
                      checklist: [...checklist, createChecklistItem(newSceneChecklistItem.trim())],
                    });
                    setNewSceneChecklistItem('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newSceneChecklistItem.trim()) {
                    handlePayloadChange({
                      checklist: [...checklist, createChecklistItem(newSceneChecklistItem.trim())],
                    });
                    setNewSceneChecklistItem('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (p.kind === 'video-script-beat') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Script Beat</span>
          <Select
            label="Beat Type"
            value={p.beatType}
            onChange={(e) =>
              handlePayloadChange({
                beatType: e.target.value as
                  | 'hook'
                  | 'intro'
                  | 'problem'
                  | 'main-point'
                  | 'demo'
                  | 'cta'
                  | 'outro',
              })
            }
          >
            <option value="hook">Hook (Catch Viewer Retention)</option>
            <option value="intro">Intro (Premise / Agenda)</option>
            <option value="problem">Problem Statement</option>
            <option value="main-point">Main Content Point</option>
            <option value="demo">Demo / Walkthrough</option>
            <option value="cta">Call to Action</option>
            <option value="outro">Outro / End Screen</option>
          </Select>

          <Input
            label="Target Duration (Seconds)"
            type="number"
            min={1}
            value={p.targetDurationSeconds}
            onChange={(e) => handlePayloadChange({ targetDurationSeconds: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          />

          <Textarea
            label="Script Text"
            rows={4}
            value={p.scriptText}
            placeholder="Spoken lines for this beat..."
            onChange={(e) => handlePayloadChange({ scriptText: e.target.value }, `${node.id}:scriptText`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'video-shot-item') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Shot List Item</span>
          <Input
            label="Shot Code"
            value={p.shotCode}
            placeholder="e.g. SH-01, BROLL-03"
            onChange={(e) => handlePayloadChange({ shotCode: e.target.value }, `${node.id}:shotCode`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Select
            label="Framing"
            value={p.framing}
            onChange={(e) => handlePayloadChange({ framing: e.target.value as ShotFramingType })}
          >
            <option value="wide">Wide Shot</option>
            <option value="medium">Medium Shot</option>
            <option value="close-up">Close-Up</option>
            <option value="extreme-close-up">Extreme Close-Up</option>
            <option value="screen-recording">Screen Recording</option>
            <option value="b-roll">B-Roll Footage</option>
            <option value="motion-graphic">Motion Graphic</option>
          </Select>

          <Input
            label="Location or Setup"
            value={p.locationOrSetup}
            placeholder="e.g. Studio Desk, Screen Share"
            onChange={(e) => handlePayloadChange({ locationOrSetup: e.target.value }, `${node.id}:locationOrSetup`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Input
            label="Audio Cue"
            value={p.audioCue}
            placeholder="e.g. Lapel Mic A, Background Music"
            onChange={(e) => handlePayloadChange({ audioCue: e.target.value }, `${node.id}:audioCue`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Select
            label="Status"
            value={p.status}
            onChange={(e) => handlePayloadChange({ status: e.target.value as ShotProductionStatus })}
          >
            <option value="planned">Planned</option>
            <option value="scripted">Scripted</option>
            <option value="filmed">Filmed</option>
            <option value="edited">Edited</option>
          </Select>
        </div>
      );
    }

    if (p.kind === 'video-note') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Video Production Note</span>
          <Select
            label="Note Category"
            value={p.noteCategory}
            onChange={(e) =>
              handlePayloadChange({
                noteCategory: e.target.value as 'voice-over' | 'typography' | 'sfx-transition' | 'general',
              })
            }
          >
            <option value="voice-over">Voice-Over</option>
            <option value="typography">Typography & Subtitles</option>
            <option value="sfx-transition">Sound Effects & Transitions</option>
            <option value="general">General Production Note</option>
          </Select>

          <Textarea
            label="Content"
            rows={4}
            value={p.content}
            placeholder="Note details..."
            onChange={(e) => handlePayloadChange({ content: e.target.value }, `${node.id}:content`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'student-concept') {
      const keyTerms = p.keyTerms || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Concept & Mastery</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={p.isRootTopic}
              onChange={(e) => handlePayloadChange({ isRootTopic: e.target.checked })}
            />
            <span>Mark as Central / Root Topic</span>
          </label>

          <Select
            label="Mastery Status"
            value={p.mastery}
            onChange={(e) => handlePayloadChange({ mastery: e.target.value as MasteryLevel })}
          >
            <option value="new">New Topic</option>
            <option value="learning">Actively Learning</option>
            <option value="reviewing">In Revision</option>
            <option value="mastered">Mastered</option>
          </Select>

          <Textarea
            label="Topic Summary"
            rows={4}
            value={p.summaryNotes}
            placeholder="Core ideas, formulas, principles..."
            onChange={(e) => handlePayloadChange({ summaryNotes: e.target.value }, `${node.id}:summaryNotes`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <div>
            <span style={{ fontSize: 'var(--mr-text-xs)', fontWeight: 600, color: 'var(--mr-text-muted)' }}>
              Key Terms ({keyTerms.length})
            </span>
            <div className={styles.tagList}>
              {keyTerms.map((term) => (
                <span key={term} className={styles.tagBadge}>
                  #{term}
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      handlePayloadChange({
                        keyTerms: keyTerms.filter((t) => t !== term),
                      });
                    }}
                    title={`Remove ${term}`}
                    aria-label={`Remove key term ${term}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New key term..."
                value={newKeyTerm}
                onChange={(e) => setNewKeyTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newKeyTerm.trim()) {
                    e.preventDefault();
                    if (!keyTerms.includes(newKeyTerm.trim())) {
                      handlePayloadChange({ keyTerms: [...keyTerms, newKeyTerm.trim()] });
                    }
                    setNewKeyTerm('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newKeyTerm.trim() && !keyTerms.includes(newKeyTerm.trim())) {
                    handlePayloadChange({ keyTerms: [...keyTerms, newKeyTerm.trim()] });
                    setNewKeyTerm('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (p.kind === 'student-flashcard') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Flashcard Details</span>
          <Textarea
            label="Front: Prompt / Question"
            rows={3}
            value={p.frontPrompt}
            placeholder="Prompt question..."
            onChange={(e) => handlePayloadChange({ frontPrompt: e.target.value }, `${node.id}:frontPrompt`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Textarea
            label="Back: Correct Answer"
            rows={3}
            value={p.backAnswer}
            placeholder="Detailed answer..."
            onChange={(e) => handlePayloadChange({ backAnswer: e.target.value }, `${node.id}:backAnswer`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Input
            label="Hint (Optional)"
            value={p.hint || ''}
            placeholder="Memory aid or clue..."
            onChange={(e) => handlePayloadChange({ hint: e.target.value }, `${node.id}:hint`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Select
            label="Recorded Confidence"
            value={p.lastConfidence}
            onChange={(e) => handlePayloadChange({ lastConfidence: e.target.value as FlashcardConfidence })}
          >
            <option value="unrated">Unrated</option>
            <option value="again">Again (Forgot)</option>
            <option value="hard">Hard (Struggled)</option>
            <option value="good">Good (Recalled)</option>
            <option value="easy">Easy (Instant)</option>
          </Select>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>
            <span>Reviewed {p.reviewCount} time(s)</span>
            {p.reviewCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePayloadChange({ reviewCount: 0, lastConfidence: 'unrated' })}
              >
                Reset Stats
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (p.kind === 'student-note') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Lecture & Study Note</span>
          <Input
            label="Topic Area"
            value={p.topicArea}
            placeholder="e.g. Chapter 3, Organic Chemistry"
            onChange={(e) => handlePayloadChange({ topicArea: e.target.value }, `${node.id}:topicArea`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Select
            label="Mastery Status"
            value={p.mastery}
            onChange={(e) => handlePayloadChange({ mastery: e.target.value as MasteryLevel })}
          >
            <option value="new">New Topic</option>
            <option value="learning">Actively Learning</option>
            <option value="reviewing">In Revision</option>
            <option value="mastered">Mastered</option>
          </Select>
          <Textarea
            label="Note Body (Markdown)"
            rows={6}
            value={p.markdownBody}
            placeholder="Enter lecture notes, definitions, formulas..."
            onChange={(e) => handlePayloadChange({ markdownBody: e.target.value }, `${node.id}:markdownBody`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'student-revision-block') {
      const items = p.items || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Revision Block</span>
          <Select
            label="Revision Priority"
            value={p.priority}
            onChange={(e) => handlePayloadChange({ priority: e.target.value as 'low' | 'medium' | 'high' })}
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </Select>

          <Input
            label="Goal / Exam Target Date"
            value={p.examOrGoalDate || ''}
            placeholder="e.g. 2026-11-15 or Friday 2PM"
            onChange={(e) => handlePayloadChange({ examOrGoalDate: e.target.value }, `${node.id}:examOrGoalDate`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 'var(--mr-text-xs)', fontWeight: 600, color: 'var(--mr-text-muted)' }}>
              Revision Tasks ({items.filter((i) => i.completed).length}/{items.length})
            </span>
            <div className={styles.checklistContainer}>
              {items.map((item) => (
                <div key={item.id} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = items.map((i) =>
                          i.id === item.id ? { ...i, completed: !i.completed } : i
                        );
                        handlePayloadChange({ items: updated });
                      }}
                    />
                    <span className={item.completed ? styles.completedText : ''}>{item.text}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = items.filter((i) => i.id !== item.id);
                      handlePayloadChange({ items: updated });
                    }}
                    title="Delete item"
                    aria-label={`Delete item ${item.text}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New revision task..."
                value={newRevisionItem}
                onChange={(e) => setNewRevisionItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRevisionItem.trim()) {
                    e.preventDefault();
                    handlePayloadChange({
                      items: [...items, createChecklistItem(newRevisionItem.trim())],
                    });
                    setNewRevisionItem('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newRevisionItem.trim()) {
                    handlePayloadChange({
                      items: [...items, createChecklistItem(newRevisionItem.trim())],
                    });
                    setNewRevisionItem('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Freelance & Business Studio Forms
    if (p.kind === 'freelance-task') {
      const subtasks = p.subtasks || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Task Details</span>
          <Select
            label="Status"
            value={p.status}
            onChange={(e) => handlePayloadChange({ status: e.target.value as FreelanceTaskStatus })}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Under Client Review</option>
            <option value="done">Completed &amp; Approved</option>
          </Select>

          <Select
            label="Priority"
            value={p.priority}
            onChange={(e) => handlePayloadChange({ priority: e.target.value as FreelanceTaskPriority })}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent / Blocker</option>
          </Select>

          <Input
            label="Due Date"
            value={p.dueDate || ''}
            placeholder="e.g. 2026-11-15 or Next Friday"
            onChange={(e) => handlePayloadChange({ dueDate: e.target.value }, `${node.id}:dueDate`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <div style={{ marginTop: 4 }}>
            <span className={styles.sectionTitle}>
              Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </span>
            <div className={styles.checklistContainer}>
              {subtasks.map((st) => (
                <div key={st.id} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => {
                        const updated = subtasks.map((item) =>
                          item.id === st.id ? { ...item, completed: !item.completed } : item
                        );
                        handlePayloadChange({ subtasks: updated });
                      }}
                    />
                    <span className={st.completed ? styles.completedText : ''}>{st.text}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = subtasks.filter((item) => item.id !== st.id);
                      handlePayloadChange({ subtasks: updated });
                    }}
                    title="Delete subtask"
                    aria-label={`Delete subtask ${st.text}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New subtask..."
                value={newFreelanceSubtask}
                onChange={(e) => setNewFreelanceSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFreelanceSubtask.trim()) {
                    e.preventDefault();
                    handlePayloadChange({
                      subtasks: [...subtasks, createChecklistItem(newFreelanceSubtask.trim())],
                    });
                    setNewFreelanceSubtask('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newFreelanceSubtask.trim()) {
                    handlePayloadChange({
                      subtasks: [...subtasks, createChecklistItem(newFreelanceSubtask.trim())],
                    });
                    setNewFreelanceSubtask('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (p.kind === 'freelance-stage') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Stage &amp; Milestone</span>
          <Select
            label="Project Phase"
            value={p.phase}
            onChange={(e) => handlePayloadChange({ phase: e.target.value as FreelanceStagePhase })}
          >
            <option value="brief">Brief &amp; Scoping</option>
            <option value="concept">Concept &amp; Moodboard</option>
            <option value="execution">Execution &amp; Production</option>
            <option value="review">Client Review &amp; Revisions</option>
            <option value="delivery">Final Handover &amp; Delivery</option>
          </Select>

          <Input
            label="Stage Number"
            type="number"
            min={1}
            max={50}
            value={p.stageNumber}
            onChange={(e) => handlePayloadChange({ stageNumber: parseInt(e.target.value, 10) || 1 })}
          />

          <Textarea
            label="Deliverable Summary"
            rows={3}
            value={p.deliverableSummary}
            placeholder="Key deliverables expected in this stage..."
            onChange={(e) =>
              handlePayloadChange({ deliverableSummary: e.target.value }, `${node.id}:deliverableSummary`)
            }
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'freelance-deliverable') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Deliverable Specifications</span>
          <Input
            label="Asset Format"
            value={p.format}
            placeholder="e.g. PDF, 4K ProRes, Figma Prototype"
            onChange={(e) => handlePayloadChange({ format: e.target.value }, `${node.id}:format`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Select
            label="Client Approval Status"
            value={p.clientApproved ? 'approved' : 'pending'}
            onChange={(e) => handlePayloadChange({ clientApproved: e.target.value === 'approved' })}
          >
            <option value="pending">Pending Client Review</option>
            <option value="approved">Approved by Client</option>
          </Select>

          <Textarea
            label="Review Notes &amp; Feedback"
            rows={3}
            value={p.reviewNotes || ''}
            placeholder="Client notes, requested revisions, or handover links..."
            onChange={(e) => handlePayloadChange({ reviewNotes: e.target.value }, `${node.id}:reviewNotes`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'freelance-note') {
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Creative Brief &amp; Notes</span>
          <Select
            label="Note Type"
            value={p.noteType}
            onChange={(e) => handlePayloadChange({ noteType: e.target.value as FreelanceNoteType })}
          >
            <option value="creative-brief">Creative Brief</option>
            <option value="client-feedback">Client Feedback</option>
            <option value="meeting">Meeting Minutes</option>
            <option value="guideline">Brand / Style Guideline</option>
          </Select>

          <Textarea
            label="Note Body (Markdown)"
            rows={5}
            value={p.markdownBody}
            placeholder="Enter notes, feedback, or brief details..."
            onChange={(e) => handlePayloadChange({ markdownBody: e.target.value }, `${node.id}:markdownBody`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>
      );
    }

    if (p.kind === 'freelance-review-item') {
      const checklist = p.checklist || [];
      return (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Review &amp; Sign-off</span>
          <Input
            label="Reviewer / Stakeholder"
            value={p.reviewer}
            placeholder="e.g. Primary Client Stakeholder"
            onChange={(e) => handlePayloadChange({ reviewer: e.target.value }, `${node.id}:reviewer`)}
            onBlur={() => onCommitCoalesce?.()}
          />

          <Select
            label="Sign-Off Decision"
            value={p.approved ? 'approved' : 'pending'}
            onChange={(e) => handlePayloadChange({ approved: e.target.value === 'approved' })}
          >
            <option value="pending">Changes Requested / Pending</option>
            <option value="approved">Approved / Sign-off Granted</option>
          </Select>

          <div style={{ marginTop: 4 }}>
            <span className={styles.sectionTitle}>
              Sign-Off Criteria ({checklist.filter((c) => c.completed).length}/{checklist.length})
            </span>
            <div className={styles.checklistContainer}>
              {checklist.map((item) => (
                <div key={item.id} className={styles.checklistItem}>
                  <label className={styles.checklistLabel}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {
                        const updated = checklist.map((c) =>
                          c.id === item.id ? { ...c, completed: !c.completed } : c
                        );
                        handlePayloadChange({ checklist: updated });
                      }}
                    />
                    <span className={item.completed ? styles.completedText : ''}>{item.text}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => {
                      const updated = checklist.filter((c) => c.id !== item.id);
                      handlePayloadChange({ checklist: updated });
                    }}
                    title="Delete criterion"
                    aria-label={`Delete criterion ${item.text}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.addItemRow}>
              <Input
                placeholder="New sign-off criterion..."
                value={newSignoffItem}
                onChange={(e) => setNewSignoffItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSignoffItem.trim()) {
                    e.preventDefault();
                    handlePayloadChange({
                      checklist: [...checklist, createChecklistItem(newSignoffItem.trim())],
                    });
                    setNewSignoffItem('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (newSignoffItem.trim()) {
                    handlePayloadChange({
                      checklist: [...checklist, createChecklistItem(newSignoffItem.trim())],
                    });
                    setNewSignoffItem('');
                  }
                }}
                icon={<PlusIcon size={14} />}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <aside className={styles.inspectorContainer} aria-label="Node Inspector">
      <div className={styles.header}>
        <h3 className={styles.title}>Properties</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close Inspector"
          icon={<CloseIcon size={16} />}
        />
      </div>

      <div className={styles.scrollableContent}>
        {/* Basic Properties */}
        <div className={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className={styles.sectionTitle} style={{ margin: 0 }}>General</span>
            <Button
              variant={node.locked ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onUpdateNode(node.id, { locked: !node.locked })}
              icon={node.locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
              title={node.locked ? 'Unlock node position' : 'Lock node position'}
              aria-label={node.locked ? 'Unlock node position' : 'Lock node position'}
              aria-pressed={node.locked}
            >
              {node.locked ? 'Position Locked' : 'Lock Position'}
            </Button>
          </div>
          <Input
            label="Title"
            value={node.title}
            onChange={(e) => onUpdateNode(node.id, { title: e.target.value }, `${node.id}:title`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Input
            label="Category"
            value={node.category || ''}
            placeholder="e.g. Ingress, Auth, Scene 1"
            onChange={(e) => onUpdateNode(node.id, { category: e.target.value }, `${node.id}:category`)}
            onBlur={() => onCommitCoalesce?.()}
          />
          <Textarea
            label="Description"
            rows={2}
            value={node.description}
            placeholder="Brief summary..."
            onChange={(e) => onUpdateNode(node.id, { description: e.target.value }, `${node.id}:description`)}
            onBlur={() => onCommitCoalesce?.()}
          />
        </div>

        {/* Semantic Color Token */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Color Accent</span>
          <div className={styles.colorPalette} role="radiogroup" aria-label="Node Accent Color">
            {COLOR_TOKENS.map(({ token, hex }) => (
              <button
                key={token}
                type="button"
                role="radio"
                aria-checked={node.colorToken === token}
                className={`${styles.colorSwatch} ${
                  node.colorToken === token ? styles.colorSwatchActive : ''
                }`}
                style={{ backgroundColor: hex }}
                title={`Color: ${token}`}
                onClick={() => onUpdateNode(node.id, { colorToken: token })}
              />
            ))}
          </div>
        </div>

        {/* Workspace-Specific Payload Form */}
        {renderPayloadForm()}
      </div>

      {/* Delete and Actions */}
      <div className={styles.actionsFooter}>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDeleteNode(node.id)}
          icon={<TrashIcon size={14} />}
        >
          Delete Node
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </aside>
  );
}
