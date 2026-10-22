/**
 * Floating Canvas HUD Controls (Zoom, Fit View, Snap Grid, Stats).
 */
import { useEffect, useState } from 'react';
import { Button } from '../design-system/components/Button';
import {
  GridIcon,
  MapIcon,
  MaximizeIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../design-system/components/Icons';
import styles from './CanvasHud.module.css';

export interface CanvasHudProps {
  zoom: number;
  nodeCount: number;
  edgeCount: number;
  snapToGrid: boolean;
  isMinimapOpen?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  onToggleSnapGrid: () => void;
  onToggleMinimap?: () => void;
  onOpenShortcuts: () => void;
}

export function CanvasHud({
  zoom,
  nodeCount,
  edgeCount,
  snapToGrid,
  isMinimapOpen = false,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  onToggleSnapGrid,
  onToggleMinimap,
  onOpenShortcuts,
}: CanvasHudProps) {
  const zoomPercent = Math.round(zoom * 100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleFullscreenOrFit = () => {
    // 1. Reframe & Fit all nodes onto the canvas
    onFitView();

    // 2. Toggle real browser fullscreen if available
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  return (
    <div
      className={styles.hudContainer}
      role="toolbar"
      aria-label="Canvas camera controls"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Zoom Controls */}
      <div className={styles.hudGroup} onPointerDown={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          onPointerDown={(e) => e.stopPropagation()}
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom Out"
          icon={<ZoomOutIcon size={14} />}
        />
        <button
          type="button"
          onClick={onResetZoom}
          onPointerDown={(e) => e.stopPropagation()}
          className={styles.zoomLabel}
          title="Reset Zoom to 100% (Ctrl+0)"
          aria-label={`Current zoom ${zoomPercent}%, click to reset to 100%`}
        >
          <span className="tabular-nums">{zoomPercent}%</span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          onPointerDown={(e) => e.stopPropagation()}
          title="Zoom In (Ctrl++)"
          aria-label="Zoom In"
          icon={<ZoomInIcon size={14} />}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullscreenOrFit}
          onPointerDown={(e) => e.stopPropagation()}
          className={isFullscreen ? styles.activeControl : ''}
          title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fit to View / Fullscreen (Shift+1)'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fit to View / Fullscreen'}
          aria-pressed={isFullscreen}
          icon={<MaximizeIcon size={14} />}
        />
      </div>

      {/* Grid Snap & Helpers */}
      <div className={styles.hudGroup} onPointerDown={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSnapGrid}
          onPointerDown={(e) => e.stopPropagation()}
          className={snapToGrid ? styles.activeControl : ''}
          title={`Grid is ${snapToGrid ? 'Visible & Snapping ON' : 'Hidden & Snapping OFF'} (G)`}
          aria-label={`Toggle Canvas Grid (${snapToGrid ? 'enabled' : 'disabled'})`}
          aria-pressed={snapToGrid}
          icon={<GridIcon size={14} />}
        />
        {onToggleMinimap && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimap}
            onPointerDown={(e) => e.stopPropagation()}
            className={isMinimapOpen ? styles.activeControl : ''}
            title={`Minimap is ${isMinimapOpen ? 'visible' : 'hidden'} (M)`}
            aria-label={`Toggle minimap (${isMinimapOpen ? 'visible' : 'hidden'})`}
            aria-pressed={isMinimapOpen}
            icon={<MapIcon size={14} />}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenShortcuts}
          onPointerDown={(e) => e.stopPropagation()}
          title="Keyboard Shortcuts (?)"
          aria-label="View Keyboard Shortcuts"
        >
          ?
        </Button>
      </div>

      {/* Node & Edge Stats */}
      <div className={styles.statsPill} onPointerDown={(e) => e.stopPropagation()}>
        <span>
          <strong>{nodeCount}</strong> {nodeCount === 1 ? 'node' : 'nodes'}
        </span>
        &bull;
        <span>
          <strong>{edgeCount}</strong> {edgeCount === 1 ? 'connection' : 'connections'}
        </span>
      </div>
    </div>
  );
}
