/**
 * Keyboard Shortcuts Modal Dialog.
 * Conforms to docs/ACCESSIBILITY.md.
 */
import { Button } from '../design-system/components/Button';
import { Dialog } from '../design-system/components/Dialog';

export interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'N', desc: 'Add a new node to the active canvas' },
  { key: 'Marquee Drag', desc: 'Rectangular multi-selection on canvas background' },
  { key: 'Shift + Click', desc: 'Add or remove node from multi-selection' },
  { key: 'C', desc: 'Enter keyboard connection mode (Tab to cycle, Enter to connect)' },
  { key: 'M', desc: 'Toggle canvas minimap overview' },
  { key: 'Delete / Backspace', desc: 'Delete selected nodes or connection' },
  { key: 'Arrow Keys', desc: 'Nudge selected nodes by 16px grid step' },
  { key: 'Shift + Arrow Keys', desc: 'Nudge selected nodes by 64px major step' },
  { key: 'Alt + Arrow Keys', desc: 'Fine-tune selected nodes by 1px precision' },
  { key: 'Space + Drag', desc: 'Pan the infinite canvas' },
  { key: 'Ctrl / Cmd + S', desc: 'Force immediate local save to IndexedDB' },
  { key: 'Ctrl / Cmd + Z', desc: 'Undo last change' },
  { key: 'Ctrl / Cmd + Shift + Z', desc: 'Redo undone change' },
  { key: 'Shift + 1', desc: 'Fit all nodes to view' },
  { key: 'Ctrl / Cmd + 0', desc: 'Reset camera zoom to 100%' },
  { key: '?', desc: 'Open this keyboard shortcuts modal' },
  { key: 'Escape', desc: 'Dismiss dialogs, connection mode, or selection' },
];

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      maxWidth={520}
      footer={
        <Button variant="secondary" size="md" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SHORTCUTS.map((s) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid var(--mr-border-subtle)',
            }}
          >
            <span style={{ fontSize: 'var(--mr-text-sm)', color: 'var(--mr-text-secondary)' }}>
              {s.desc}
            </span>
            <kbd
              style={{
                backgroundColor: 'var(--mr-bg-surface-3)',
                border: '1px solid var(--mr-border-default)',
                borderRadius: 'var(--mr-radius-xs)',
                padding: '2px 8px',
                color: 'var(--mr-text-primary)',
                fontFamily: 'var(--mr-font-mono)',
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
