/**
 * Accessible Custom Context Menu for Canvas Nodes.
 * Conforms to docs/ACCESSIBILITY.md and Phase 2/3 canvas standards.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CanvasNode, EntityId } from '../domain/models';
import {
  CopyIcon,
  LinkIcon,
  LockIcon,
  SearchIcon,
  TrashIcon,
  UnlockIcon,
} from '../design-system/components/Icons';
import styles from './CanvasContextMenu.module.css';

export interface CanvasContextMenuProps {
  targetNode: CanvasNode;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
  onInspectNode: (nodeId: EntityId) => void;
  onToggleLock: (nodeId: EntityId) => void;
  onDuplicateNode?: ((nodeId: EntityId) => void) | undefined;
  onStartConnection: (nodeId: EntityId) => void;
  onDeleteNode: (nodeId: EntityId) => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  targetNode,
  anchorPosition,
  onClose,
  onInspectNode,
  onToggleLock,
  onDuplicateNode,
  onStartConnection,
  onDeleteNode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: anchorPosition.x, y: anchorPosition.y });

  // Viewport edge collision clamping
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

    let x = anchorPosition.x;
    let y = anchorPosition.y;

    if (x + rect.width > winW - 12) {
      x = Math.max(12, winW - rect.width - 12);
    }
    if (y + rect.height > winH - 12) {
      y = Math.max(12, winH - rect.height - 12);
    }

    setAdjustedPos({ x, y });
  }, [anchorPosition]);

  // Click outside to dismiss & Keyboard navigation
  useEffect(() => {
    const handleDocumentPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []
      );
      if (items.length === 0) return;

      const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (activeIndex + 1) % items.length;
        items[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (activeIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on first menuitem
    const timer = setTimeout(() => {
      const firstBtn = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstBtn?.focus();
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: `${adjustedPos.x}px`, top: `${adjustedPos.y}px` }}
      role="menu"
      aria-label={`Node options for ${targetNode.title}`}
      tabIndex={-1}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={styles.menuHeader} title={targetNode.title}>
        {targetNode.title}
      </div>

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onInspectNode(targetNode.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            <SearchIcon size={14} />
          </span>
          <span>Inspect Node</span>
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onToggleLock(targetNode.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            {targetNode.locked ? <UnlockIcon size={14} /> : <LockIcon size={14} />}
          </span>
          <span>{targetNode.locked ? 'Unlock Position' : 'Lock Position'}</span>
        </span>
        <span className={styles.shortcutHint}>L</span>
      </button>

      {onDuplicateNode && (
        <button
          type="button"
          role="menuitem"
          className={styles.menuItem}
          onClick={() => {
            onDuplicateNode(targetNode.id);
            onClose();
          }}
        >
          <span className={styles.menuItemContent}>
            <span className={styles.menuItemIcon} aria-hidden="true">
              <CopyIcon size={14} />
            </span>
            <span>Duplicate Node</span>
          </span>
          <span className={styles.shortcutHint}>Ctrl+D</span>
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onStartConnection(targetNode.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            <LinkIcon size={14} />
          </span>
          <span>Start Connection</span>
        </span>
        <span className={styles.shortcutHint}>C</span>
      </button>

      <div className={styles.separator} role="separator" />

      <button
        type="button"
        role="menuitem"
        className={`${styles.menuItem} ${styles.dangerItem}`}
        onClick={() => {
          onDeleteNode(targetNode.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            <TrashIcon size={14} />
          </span>
          <span>Delete Node</span>
        </span>
        <span className={styles.shortcutHint}>Del</span>
      </button>
    </div>
  );
};
