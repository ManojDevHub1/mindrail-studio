/**
 * Contextual Edge Inspector Panel.
 * Live editing for connection labels, routing style, stroke pattern, and semantics.
 */
import type {
  CanvasEdge,
  EdgeRoutingStyle,
  EdgeStrokePattern,
  EntityId,
} from '../domain/models';
import { Button } from '../design-system/components/Button';
import { Input, Select } from '../design-system/components/FormControls';
import { CloseIcon, TrashIcon } from '../design-system/components/Icons';
import styles from './EdgeInspector.module.css';

export interface EdgeInspectorProps {
  edge: CanvasEdge;
  sourceNodeTitle?: string | undefined;
  targetNodeTitle?: string | undefined;
  onUpdateEdge: (edgeId: EntityId, updates: Partial<CanvasEdge>) => void;
  onDeleteEdge: (edgeId: EntityId) => void;
  onClose: () => void;
}

export function EdgeInspector({
  edge,
  sourceNodeTitle = 'Source Node',
  targetNodeTitle = 'Target Node',
  onUpdateEdge,
  onDeleteEdge,
  onClose,
}: EdgeInspectorProps) {
  return (
    <aside className={styles.edgeInspectorContainer} aria-label="Connection Inspector">
      <div className={styles.header}>
        <h3 className={styles.title}>Connection</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close Inspector"
          icon={<CloseIcon size={16} />}
        />
      </div>

      <div className={styles.scrollableContent}>
        {/* Connection Endpoints */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Endpoints</span>
          <div className={styles.endpointsBox}>
            <div className={styles.endpointRow}>
              <span className={styles.endpointNodeName} title={sourceNodeTitle}>
                {sourceNodeTitle}
              </span>
              <span style={{ color: 'var(--mr-text-muted)' }}>({edge.sourcePort} port)</span>
            </div>
            <div className={styles.connectionArrow}>&darr;</div>
            <div className={styles.endpointRow}>
              <span className={styles.endpointNodeName} title={targetNodeTitle}>
                {targetNodeTitle}
              </span>
              <span style={{ color: 'var(--mr-text-muted)' }}>({edge.targetPort} port)</span>
            </div>
          </div>
        </div>

        {/* Semantics & Label */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Semantics</span>
          <Input
            label="Relationship Label"
            value={edge.label || ''}
            placeholder="e.g. Calls, Routes /api, Depends on, 1:N"
            onChange={(e) => onUpdateEdge(edge.id, { label: e.target.value })}
          />

          <Select
            label="Routing Style"
            value={edge.routingStyle}
            onChange={(e) =>
              onUpdateEdge(edge.id, { routingStyle: e.target.value as EdgeRoutingStyle })
            }
          >
            <option value="bezier">Smooth Bezier Curve</option>
            <option value="orthogonal">Orthogonal (Right-Angled)</option>
            <option value="straight">Straight Line</option>
          </Select>

          <Select
            label="Stroke Pattern"
            value={edge.strokePattern || 'solid'}
            onChange={(e) =>
              onUpdateEdge(edge.id, { strokePattern: e.target.value as EdgeStrokePattern })
            }
          >
            <option value="solid">Solid Line</option>
            <option value="dashed">Dashed Line</option>
            <option value="dotted">Dotted Line</option>
          </Select>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--mr-text-xs)',
              color: 'var(--mr-text-primary)',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              checked={edge.directed !== false}
              onChange={(e) => onUpdateEdge(edge.id, { directed: e.target.checked })}
            />
            <span>Directed Connection (Display Arrowhead)</span>
          </label>
        </div>
      </div>

      <div className={styles.actionsFooter}>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDeleteEdge(edge.id)}
          icon={<TrashIcon size={14} />}
        >
          Delete Connection
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </aside>
  );
}
