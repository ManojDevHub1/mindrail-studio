/**
 * Floating Selection Action Bar for bulk operations on multiple canvas nodes.
 * Displays selection count, quick recolor swatches, and bulk delete.
 */
import React from 'react';
import type { EntityId, NodeColorToken } from '../domain/models';
import { Button } from '../design-system/components/Button';
import { CloseIcon, TrashIcon } from '../design-system/components/Icons';
import styles from './SelectionActionBar.module.css';

export interface SelectionActionBarProps {
  selectedCount: number;
  selectedNodeIds: readonly EntityId[];
  onBulkRecolor: (nodeIds: readonly EntityId[], colorToken: NodeColorToken) => void;
  onBulkDelete: (nodeIds: readonly EntityId[]) => void;
  onClearSelection: () => void;
}

const BULK_COLOR_SWATCHES: readonly { token: NodeColorToken; hex: string }[] = [
  { token: 'neutral', hex: '#7E8BA6' },
  { token: 'blue', hex: '#5E9EFF' },
  { token: 'purple', hex: '#A855F7' },
  { token: 'cyan', hex: '#06B6D4' },
  { token: 'emerald', hex: '#10B981' },
  { token: 'amber', hex: '#F59E0B' },
  { token: 'rose', hex: '#F43F5E' },
  { token: 'orange', hex: '#F97316' },
];

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  selectedCount,
  selectedNodeIds,
  onBulkRecolor,
  onBulkDelete,
  onClearSelection,
}) => {
  if (selectedCount < 2) return null;

  return (
    <div
      className={styles.actionBarContainer}
      role="toolbar"
      aria-label="Multi-node selection bulk actions"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={styles.countPill}>
        <span className={styles.badgeCount}>{selectedCount}</span>
        <span>nodes selected</span>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Bulk Color Swatches */}
      <div className={styles.swatchGroup} role="group" aria-label="Bulk change color accent">
        {BULK_COLOR_SWATCHES.map(({ token, hex }) => (
          <button
            key={token}
            type="button"
            className={styles.colorSwatch}
            style={{ backgroundColor: hex }}
            title={`Set color to ${token} for ${selectedCount} nodes`}
            aria-label={`Color ${token}`}
            onClick={() => onBulkRecolor(selectedNodeIds, token)}
          />
        ))}
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Bulk Action Buttons */}
      <div className={styles.actionBtnGroup}>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onBulkDelete(selectedNodeIds)}
          title={`Delete ${selectedCount} nodes (Delete/Backspace)`}
          aria-label={`Delete ${selectedCount} selected nodes`}
          icon={<TrashIcon size={14} />}
        >
          Delete All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          title="Clear selection (Escape)"
          aria-label="Deselect all"
          icon={<CloseIcon size={14} />}
        />
      </div>
    </div>
  );
};
