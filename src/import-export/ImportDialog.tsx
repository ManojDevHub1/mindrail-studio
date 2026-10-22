/**
 * Accessible Project Import Modal Dialog.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md and docs/UX_FLOWS.md (Flows 10 & 11).
 */
import React, { useRef, useState } from 'react';
import type { Project } from '../domain/models';
import { generateEntityId } from '../domain/factories';
import { getProject, saveProject } from '../persistence/projectRepository';
import { Button } from '../design-system/components/Button';
import { Dialog } from '../design-system/components/Dialog';
import { Badge } from '../design-system/components/Badge';
import { UploadIcon } from '../design-system/components/Icons';
import { validateProjectImport, type ValidationFailure, type ValidationSuccess } from './validateProjectImport';

export interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (project: Project) => void;
}

export function ImportDialog({ isOpen, onClose, onImportSuccess }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileText, setSelectedFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationSuccess | ValidationFailure | null>(null);
  const [idCollisionExists, setIdCollisionExists] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const resetState = () => {
    setSelectedFileText(null);
    setFileName('');
    setValidationResult(null);
    setIdCollisionExists(false);
    setIsProcessing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || '');
      setSelectedFileText(text);

      const result = validateProjectImport(text);
      setValidationResult(result);

      if (result.success) {
        // Check ID collision with existing IndexedDB project
        const existing = await getProject(result.project.id);
        setIdCollisionExists(existing !== null);
      } else {
        setIdCollisionExists(false);
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      setValidationResult({
        success: false,
        code: 'ERR_INVALID_JSON',
        message: 'Failed to read file from disk.',
      });
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleRecoverWithEdgeStripping = () => {
    if (!selectedFileText) return;
    const recovered = validateProjectImport(selectedFileText, { stripBrokenEdges: true });
    setValidationResult(recovered);
  };

  const handleConfirmImport = async (importAsNewCopy: boolean) => {
    if (!validationResult || !validationResult.success) return;

    let projectToSave = validationResult.project;

    if (importAsNewCopy || idCollisionExists) {
      if (importAsNewCopy) {
        projectToSave = {
          ...projectToSave,
          id: generateEntityId(),
          title: `${projectToSave.title} (Imported)`,
        };
      }
    }

    try {
      await saveProject(projectToSave);
      onImportSuccess(projectToSave);
      resetState();
      onClose();
    } catch {
      // Storage error
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Import MindRail Project"
      maxWidth={580}
      footer={
        validationResult && validationResult.success ? (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                resetState();
                onClose();
              }}
            >
              Cancel
            </Button>
            {idCollisionExists ? (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleConfirmImport(false)}
                >
                  Replace Existing Project
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleConfirmImport(true)}
                >
                  Import as New Copy
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleConfirmImport(false)}
              >
                Confirm Import
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            Close
          </Button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--mr-text-secondary)', fontSize: 'var(--mr-text-sm)', margin: 0 }}>
          Select a <code>.mindrail.json</code> file to restore your canvas, nodes, connections, and metadata.
        </p>

        {/* File Picker */}
        <div
          style={{
            border: '2px dashed var(--mr-border-default)',
            borderRadius: 'var(--mr-radius-md)',
            padding: 24,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'var(--mr-bg-surface-1)',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.mindrail.json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <UploadIcon size={28} style={{ color: 'var(--mr-accent-primary)', marginBottom: 8 }} />
          <p style={{ fontWeight: 600, color: 'var(--mr-text-primary)', margin: 0 }}>
            {fileName ? fileName : 'Choose .mindrail.json file or drag & drop'}
          </p>
          <span style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>
            Maximum file size: 10 MB
          </span>
        </div>

        {isProcessing && <p style={{ color: 'var(--mr-accent-primary)', margin: 0 }}>Validating file...</p>}

        {/* Validation Error Alert */}
        {validationResult && !validationResult.success && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 'var(--mr-radius-sm)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <strong style={{ color: 'var(--mr-color-danger)', fontSize: 'var(--mr-text-sm)' }}>
              Validation Failed: {validationResult.message}
            </strong>
            {validationResult.details && validationResult.details.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-secondary)' }}>
                {validationResult.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
            {validationResult.recoverableWithEdgeStripping && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRecoverWithEdgeStripping}
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
              >
                Import & Strip Broken Connections
              </Button>
            )}
          </div>
        )}

        {/* Validation Success Preview */}
        {validationResult && validationResult.success && (
          <div
            style={{
              backgroundColor: 'var(--mr-bg-surface-3)',
              border: '1px solid var(--mr-border-default)',
              borderRadius: 'var(--mr-radius-sm)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, color: 'var(--mr-text-primary)' }}>
                {validationResult.project.title}
              </h4>
              <Badge variant="blue">
                {validationResult.project.workspaceType.toUpperCase()}
              </Badge>
            </div>
            <div style={{ fontSize: 'var(--mr-text-xs)', color: 'var(--mr-text-muted)' }}>
              <span>{validationResult.project.nodes.length} Nodes</span> &bull;{' '}
              <span>{validationResult.project.edges.length} Connections</span> &bull;{' '}
              <span>Schema v{validationResult.project.schemaVersion}</span>
            </div>
            {validationResult.danglingEdgesRemoved > 0 && (
              <p style={{ color: 'var(--mr-color-warning)', fontSize: 'var(--mr-text-xs)', margin: 0 }}>
                Note: {validationResult.danglingEdgesRemoved} broken/dangling connection(s) were safely removed.
              </p>
            )}
            {idCollisionExists && (
              <div
                style={{
                  marginTop: 6,
                  padding: 8,
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  borderRadius: 'var(--mr-radius-xs)',
                  fontSize: 'var(--mr-text-xs)',
                  color: 'var(--mr-color-warning)',
                }}
              >
                A project with this ID already exists locally. Choose whether to replace it or import as a new copy.
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
