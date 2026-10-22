/**
 * Interactive Flashcard Study Mode Modal.
 * Conforms to docs/PRD.md and Section 5.B (Student Studio Study Mode).
 */
import { useCallback, useEffect, useState } from 'react';
import type { CanvasNode, EntityId } from '../../domain/models';
import type { FlashcardConfidence, StudentNodePayload } from '../../domain/workspaceTypes';
import { getCurrentIsoTimestamp } from '../../domain/factories';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { CloseIcon } from '../../design-system/components/Icons';
import styles from './FlashcardStudyModal.module.css';

export interface FlashcardStudyModalProps {
  isOpen: boolean;
  cards: readonly CanvasNode[];
  onClose: () => void;
  onUpdateCard: (nodeId: EntityId, payloadUpdates: Partial<StudentNodePayload>) => void;
}

export function FlashcardStudyModal({
  isOpen,
  cards,
  onClose,
  onUpdateCard,
}: FlashcardStudyModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<EntityId>>(new Set());

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsAnswerRevealed(false);
      setShowHint(false);
      setReviewedIds(new Set());
    }
  }, [isOpen]);

  const flashcardNodes = cards.filter((n) => n.payload.kind === 'student-flashcard');
  const currentCard = flashcardNodes[currentIndex];
  const total = flashcardNodes.length;

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop around
    }
    setIsAnswerRevealed(false);
    setShowHint(false);
  }, [currentIndex, total]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(total - 1);
    }
    setIsAnswerRevealed(false);
    setShowHint(false);
  }, [currentIndex, total]);

  const handleRate = useCallback(
    (confidence: FlashcardConfidence) => {
      if (!currentCard || currentCard.payload.kind !== 'student-flashcard') return;

      const payload = currentCard.payload;
      const now = getCurrentIsoTimestamp();
      onUpdateCard(currentCard.id, {
        lastConfidence: confidence,
        reviewCount: (payload.reviewCount || 0) + 1,
        lastReviewedAt: now,
      });

      setReviewedIds((prev) => new Set(prev).add(currentCard.id));
      handleNext();
    },
    [currentCard, handleNext, onUpdateCard]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Enter') {
        // Space / Enter toggles answer reveal
        if (!isAnswerRevealed) {
          e.preventDefault();
          setIsAnswerRevealed(true);
        }
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (isAnswerRevealed) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAnswerRevealed, handleNext, handlePrev, handleRate, onClose]);

  if (!isOpen) return null;

  if (total === 0) {
    return (
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Flashcard Study Mode">
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h3 className={styles.title}>Flashcard Study Deck</h3>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<CloseIcon size={16} />} />
          </div>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--mr-text-secondary)' }}>
            <p>No flashcard nodes found in this project.</p>
            <p style={{ fontSize: 'var(--mr-text-xs)' }}>
              Add Flashcard nodes from the creation palette to start practicing!
            </p>
            <Button variant="primary" size="md" onClick={onClose}>
              Back to Canvas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const payload = currentCard?.payload as Extract<StudentNodePayload, { kind: 'student-flashcard' }>;
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Flashcard Study Mode">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h3 className={styles.title}>Study Deck</h3>
            <Badge variant="blue">
              Card {currentIndex + 1} of {total}
            </Badge>
            <span style={{ fontSize: 11, color: 'var(--mr-text-muted)' }}>
              ({reviewedIds.size} reviewed this session)
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} icon={<CloseIcon size={16} />} aria-label="Close Study Mode" />
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBarTrack}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Card Stage */}
        <div className={styles.cardStage}>
          <div className={styles.cardSideLabel}>
            {isAnswerRevealed ? 'Back: Answer' : 'Front: Question'}
          </div>

          <div className={styles.cardText}>
            {isAnswerRevealed ? payload.backAnswer : payload.frontPrompt}
          </div>

          {!isAnswerRevealed && payload.hint && (
            <div>
              {showHint ? (
                <div className={styles.hintArea}>
                  <strong>Hint:</strong> {payload.hint}
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                    Show Hint
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isAnswerRevealed && (
            <div className={styles.revealActionRow}>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAnswerRevealed(true)}
              >
                Reveal Answer (Space)
              </Button>
            </div>
          )}
        </div>

        {/* Confidence Rating Buttons (Revealed on Answer) */}
        {isAnswerRevealed ? (
          <div className={styles.confidenceRow}>
            <span className={styles.confidenceTitle}>Rate your recall:</span>
            <div className={styles.ratingButtons}>
              <button
                type="button"
                className={`${styles.ratingBtn} ${styles.ratingAgain}`}
                onClick={() => handleRate('again')}
                title="Rate: Again (1)"
              >
                <span>Again</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Key [1]</span>
              </button>
              <button
                type="button"
                className={`${styles.ratingBtn} ${styles.ratingHard}`}
                onClick={() => handleRate('hard')}
                title="Rate: Hard (2)"
              >
                <span>Hard</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Key [2]</span>
              </button>
              <button
                type="button"
                className={`${styles.ratingBtn} ${styles.ratingGood}`}
                onClick={() => handleRate('good')}
                title="Rate: Good (3)"
              >
                <span>Good</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Key [3]</span>
              </button>
              <button
                type="button"
                className={`${styles.ratingBtn} ${styles.ratingEasy}`}
                onClick={() => handleRate('easy')}
                title="Rate: Easy (4)"
              >
                <span>Easy</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Key [4]</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'center' }}>
            <span className={styles.shortcutsHint}>
              Press [Space] to reveal &bull; [&larr; / &rarr;] to navigate
            </span>
          </div>
        )}

        {/* Footer Navigation */}
        <div className={styles.footer}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={handlePrev}>
              &larr; Prev
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNext}>
              Next &rarr;
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Exit Study Mode (Esc)
          </Button>
        </div>
      </div>
    </div>
  );
}
