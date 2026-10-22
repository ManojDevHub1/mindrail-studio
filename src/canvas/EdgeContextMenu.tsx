/**
 * Accessible Custom Context Menu for Canvas Connections/Edges.
 * Conforms to docs/ACCESSIBILITY.md and canvas interaction standards.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CanvasEdge, EdgeRoutingStyle, EntityId } from '../domain/models';
import {
  CheckIcon,
  LinkIcon,
  SearchIcon,
  TrashIcon,
} from '../design-system/components/Icons';
import styles from './CanvasContextMenu.module.css';

export interface EdgeContextMenuProps {
  targetEdge: CanvasEdge;
  sourceNodeTitle?: string | undefined;
  targetNodeTitle?: string | undefined;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
  onInspectEdge: (edgeId: EntityId) => void;
  onChangeRoutingStyle: (edgeId: EntityId, style: EdgeRoutingStyle) => void;
  onDeleteEdge: (edgeId: EntityId) => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  targetEdge,
  sourceNodeTitle = 'Source Node',
  targetNodeTitle = 'Target Node',
  anchorPosition,
  onClose,
  onInspectEdge,
  onChangeRoutingStyle,
  onDeleteEdge,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: anchorPosition.x, y: anchorPosition.y });

  // Clamping to visible viewport edges
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

  const connectionHeader = `${sourceNodeTitle} → ${targetNodeTitle}`;

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: `${adjustedPos.x}px`, top: `${adjustedPos.y}px` }}
      role="menu"
      aria-label={`Connection options for ${connectionHeader}`}
      tabIndex={-1}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={styles.menuHeader} title={connectionHeader}>
        {connectionHeader}
      </div>

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onInspectEdge(targetEdge.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            <SearchIcon size={14} />
          </span>
          <span>Inspect Connection</span>
        </span>
      </button>

      <div className={styles.separator} role="separator" />

      {/* Routing Style toggles */}
      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onChangeRoutingStyle(targetEdge.id, 'bezier');
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            {targetEdge.routingStyle === 'bezier' ? <CheckIcon size={14} /> : <LinkIcon size={14} />}
          </span>
          <span>Routing: Smooth Bezier</span>
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onChangeRoutingStyle(targetEdge.id, 'orthogonal');
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            {targetEdge.routingStyle === 'orthogonal' ? <CheckIcon size={14} /> : <LinkIcon size={14} />}
          </span>
          <span>Routing: Orthogonal</span>
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={styles.menuItem}
        onClick={() => {
          onChangeRoutingStyle(targetEdge.id, 'straight');
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            {targetEdge.routingStyle === 'straight' ? <CheckIcon size={14} /> : <LinkIcon size={14} />}
          </span>
          <span>Routing: Straight Line</span>
        </span>
      </button>

      <div className={styles.separator} role="separator" />

      {/* Delete Connection */}
      <button
        type="button"
        role="menuitem"
        className={`${styles.menuItem} ${styles.dangerItem}`}
        onClick={() => {
          onDeleteEdge(targetEdge.id);
          onClose();
        }}
      >
        <span className={styles.menuItemContent}>
          <span className={styles.menuItemIcon} aria-hidden="true">
            <TrashIcon size={14} />
          </span>
          <span>Delete Connection</span>
        </span>
        <span className={styles.shortcutHint}>Del</span>
      </button>
    </div>
  );
};
