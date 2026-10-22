/**
 * Built-in starter templates for MindRail Studio.
 * Conforms to docs/DATA_MODEL.md and Universal Template Library specifications.
 * 45 curated, schema-valid templates across 15 distinct categories (3 per category).
 */
import type { ProjectTemplate } from './models';
import { TECH_TEMPLATES } from './templates/techTemplates';
import { DESIGN_TEMPLATES } from './templates/designTemplates';
import { MEDIA_TEMPLATES } from './templates/mediaTemplates';
import { MARKETING_TEMPLATES } from './templates/marketingTemplates';
import { BUSINESS_EDU_TEMPLATES } from './templates/businessEduTemplates';

export const BUILT_IN_TEMPLATES: readonly ProjectTemplate[] = [
  ...TECH_TEMPLATES,
  ...DESIGN_TEMPLATES,
  ...MEDIA_TEMPLATES,
  ...MARKETING_TEMPLATES,
  ...BUSINESS_EDU_TEMPLATES,
];

export { TEMPLATE_CATEGORIES, type CategoryMeta } from './templates/templateCategories';
