/**
 * Structured Markdown Storyboard & Study Guide Exporter.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md section 6 and Phase 5 Feature A.
 */
import type { Project } from '../domain/models';
import {
  calculateStudentSummary,
  calculateVideoSummary,
  formatSecondsToTimecode,
} from '../domain/calculators';
import { slugifyTitle } from './exportProjectJson';

/**
 * Escapes characters that could break Markdown headings or table pipes.
 */
function escapeMarkdownText(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/**
 * Generates an editorial Markdown storyboard from a Video Creator project.
 */
export function exportMarkdownStoryboard(project: Project): string {
  const summary = calculateVideoSummary(project.nodes);
  const runtimeFormatted = formatSecondsToTimecode(summary.totalRuntimeSeconds);
  const now = new Date().toISOString().split('T')[0];

  const lines: string[] = [];

  // Title and Header metadata
  lines.push(`# ${project.title}`);
  lines.push('');
  if (project.metadata.description) {
    lines.push(`> ${project.metadata.description}`);
    lines.push('>');
  }
  lines.push(`> **Workspace:** Video Creator`);
  lines.push(`> **Planned Total Runtime:** ${runtimeFormatted} (${summary.totalRuntimeSeconds}s)`);
  lines.push(
    `> **Summary:** ${summary.sceneCount} Scenes • ${summary.statusCounts.filmed} Filmed • ${summary.statusCounts.scripted} Scripted`
  );
  lines.push(`> **Exported:** ${now}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Collect and sort video scenes by sceneNumber
  const scenes = project.nodes
    .filter((n) => n.payload.kind === 'video-scene')
    .sort((a, b) => {
      const sA = (a.payload as { sceneNumber: number }).sceneNumber || 0;
      const sB = (b.payload as { sceneNumber: number }).sceneNumber || 0;
      return sA - sB;
    });

  if (scenes.length > 0) {
    lines.push('## Storyboard Scenes');
    lines.push('');

    for (const scene of scenes) {
      const p = scene.payload as Extract<typeof scene.payload, { kind: 'video-scene' }>;
      const timecode = formatSecondsToTimecode(p.durationSeconds);

      lines.push(`### Scene ${p.sceneNumber}: ${escapeMarkdownText(scene.title)}`);
      lines.push('');
      lines.push(`- **Planned Duration:** \`${timecode}\` (${p.durationSeconds}s)`);
      lines.push(`- **Framing / Camera Angle:** ${p.framing}`);
      lines.push(`- **Production Status:** \`${p.productionStatus}\``);
      if (scene.category) {
        lines.push(`- **Category / Act:** ${scene.category}`);
      }
      lines.push('');

      if (p.scriptText && p.scriptText.trim()) {
        lines.push('#### Spoken Dialogue');
        const scriptLines = p.scriptText.split('\n');
        for (const sLine of scriptLines) {
          lines.push(`> ${sLine}`);
        }
        lines.push('');
      }

      if (p.voiceOverNotes && p.voiceOverNotes.trim()) {
        lines.push(`**Voice-Over Cue:** ${p.voiceOverNotes}`);
        lines.push('');
      }

      if (p.typographyNotes && p.typographyNotes.trim()) {
        lines.push(`**Typography / Graphics:** ${p.typographyNotes}`);
        lines.push('');
      }

      if (p.transitionAndSfxNotes && p.transitionAndSfxNotes.trim()) {
        lines.push(`**Transition / SFX:** ${p.transitionAndSfxNotes}`);
        lines.push('');
      }

      if (p.checklist && p.checklist.length > 0) {
        lines.push('**Scene Tasks:**');
        for (const item of p.checklist) {
          lines.push(`- [${item.completed ? 'x' : ' '}] ${item.text}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  // Script Beats Section
  const scriptBeats = project.nodes.filter((n) => n.payload.kind === 'video-script-beat');
  if (scriptBeats.length > 0) {
    lines.push('## Script Beats & Hooks');
    lines.push('');
    for (const beat of scriptBeats) {
      const p = beat.payload as Extract<typeof beat.payload, { kind: 'video-script-beat' }>;
      lines.push(`### ${p.beatType.toUpperCase()}: ${escapeMarkdownText(beat.title)}`);
      lines.push(`- **Target Duration:** ${p.targetDurationSeconds}s`);
      if (p.scriptText) {
        lines.push('');
        lines.push(`> ${p.scriptText}`);
      }
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // Shot List Section
  const shots = project.nodes.filter((n) => n.payload.kind === 'video-shot-item');
  if (shots.length > 0) {
    lines.push('## Shot List');
    lines.push('');
    lines.push('| Shot Code | Framing | Location / Setup | Audio Cue | Status |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const shot of shots) {
      const p = shot.payload as Extract<typeof shot.payload, { kind: 'video-shot-item' }>;
      lines.push(
        `| **${escapeMarkdownText(p.shotCode || 'SHOT')}** | ${p.framing} | ${escapeMarkdownText(p.locationOrSetup || '-')} | ${escapeMarkdownText(p.audioCue || '-')} | \`${p.status}\` |`
      );
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Project Checklist
  if (project.checklist.length > 0) {
    lines.push('## Production Checklist');
    lines.push('');
    for (const item of project.checklist) {
      lines.push(`- [${item.completed ? 'x' : ' '}] ${item.text}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates an editorial Markdown study guide from a Student project.
 */
export function exportMarkdownStudyGuide(project: Project): string {
  const summary = calculateStudentSummary(project.nodes);
  const now = new Date().toISOString().split('T')[0];

  const lines: string[] = [];

  lines.push(`# ${project.title} — Study Guide`);
  lines.push('');
  if (project.metadata.description) {
    lines.push(`> ${project.metadata.description}`);
    lines.push('>');
  }
  lines.push(`> **Workspace:** Student Map`);
  lines.push(
    `> **Mastery:** ${summary.masteryPercentage}% (${summary.masteryCounts.mastered}/${summary.totalConcepts} Mastered)`
  );
  lines.push(`> **Flashcards Available:** ${summary.totalFlashcards}`);
  lines.push(`> **Exported:** ${now}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Concepts
  const concepts = project.nodes.filter((n) => n.payload.kind === 'student-concept');
  if (concepts.length > 0) {
    lines.push('## Core Concepts & Definitions');
    lines.push('');
    for (const concept of concepts) {
      const p = concept.payload as Extract<typeof concept.payload, { kind: 'student-concept' }>;
      lines.push(`### ${p.isRootTopic ? '⭐ ' : ''}${escapeMarkdownText(concept.title)}`);
      lines.push(`- **Mastery Status:** \`${p.mastery.toUpperCase()}\``);
      if (p.keyTerms.length > 0) {
        lines.push(`- **Key Terms:** ${p.keyTerms.map((t) => `\`#${t}\``).join(' ')}`);
      }
      if (p.summaryNotes) {
        lines.push('');
        lines.push(p.summaryNotes);
      }
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  // Flashcards
  const flashcards = project.nodes.filter((n) => n.payload.kind === 'student-flashcard');
  if (flashcards.length > 0) {
    lines.push('## Flashcard Practice Questions');
    lines.push('');
    flashcards.forEach((card, idx) => {
      const p = card.payload as Extract<typeof card.payload, { kind: 'student-flashcard' }>;
      lines.push(`### Card ${idx + 1}: ${escapeMarkdownText(card.title)}`);
      lines.push(`**Prompt / Question:**`);
      lines.push(`> ${p.frontPrompt || 'No question prompt set'}`);
      lines.push('');
      if (p.hint) {
        lines.push(`*Hint: ${p.hint}*`);
        lines.push('');
      }
      lines.push(`**Answer:**`);
      lines.push(`> ${p.backAnswer || 'No answer set'}`);
      lines.push('');
      lines.push(`*(Reviewed: ${p.reviewCount}x • Last Confidence: \`${p.lastConfidence}\`)*`);
      lines.push('');
    });
    lines.push('---');
    lines.push('');
  }

  // Revision tasks & project checklist
  if (project.checklist.length > 0) {
    lines.push('## Revision Checklist');
    lines.push('');
    for (const item of project.checklist) {
      lines.push(`- [${item.completed ? 'x' : ' '}] ${item.text}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Triggers native browser download of formatted Markdown.
 */
export function downloadMarkdownFile(project: Project): string {
  const content =
    project.workspaceType === 'video'
      ? exportMarkdownStoryboard(project)
      : exportMarkdownStudyGuide(project);

  const slug = slugifyTitle(project.title);
  const suffix = project.workspaceType === 'video' ? 'storyboard' : 'study-guide';
  const filename = `${slug}-${suffix}.md`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}
