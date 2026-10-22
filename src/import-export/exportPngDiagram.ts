/**
 * High-Resolution PNG Architecture & Canvas Diagram Exporter.
 * Converts canonical SVG into crisp rasterized PNG via offscreen HTML5 Canvas.
 * Conforms to docs/IMPORT_EXPORT_SPEC.md section 6 and Phase 5 Feature A.
 */
import type { Project } from '../domain/models';
import { exportSvgDiagram, calculateDiagramBounds } from './exportSvgDiagram';
import { slugifyTitle } from './exportProjectJson';

export interface PngExportOptions {
  /** Pixel density scale multiplier for high-DPI rasterization. Default: 2 */
  scale?: number;
}

/**
 * Rasterizes a Project's canonical SVG diagram into a PNG Blob using offscreen canvas.
 */
export async function exportPngDiagramBlob(
  project: Project,
  options: PngExportOptions = {}
): Promise<Blob> {
  const scale = options.scale ?? 2;
  const svgString = exportSvgDiagram(project);
  const bounds = calculateDiagramBounds(project.nodes, 64);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PNG rasterization requires a browser window environment');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG into browser Image for PNG rasterization'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bounds.width * scale);
    canvas.height = Math.round(bounds.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not supported in this browser environment');
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill dark background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw SVG scaled
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert to Blob
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!pngBlob) {
      throw new Error('Failed to create PNG blob from canvas');
    }

    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Converts a Project's canonical SVG diagram into a downloadable PNG file.
 */
export async function downloadPngFile(
  project: Project,
  options: PngExportOptions = {}
): Promise<string> {
  const slug = slugifyTitle(project.title);
  const filename = `${slug}-architecture.png`;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return filename;
  }

  const pngBlob = await exportPngDiagramBlob(project, options);
  const pngUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement('a');
  link.href = pngUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(pngUrl);

  return filename;
}
