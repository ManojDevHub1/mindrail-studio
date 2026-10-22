/**
 * Canonical Template Categories and metadata for the Universal Template Library.
 * Conforms to docs/DATA_MODEL.md and Phase 6 specifications.
 */
import type { TemplateCategory } from '../models';

export interface CategoryMeta {
  readonly id: TemplateCategory;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export const TEMPLATE_CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'web-dev',
    label: 'Web Development',
    description: 'Full-stack web apps, microservices, APIs, and cloud architecture',
    icon: '🌐',
  },
  {
    id: 'ui-ux',
    label: 'UI / UX Design',
    description: 'Design sprints, wireframes, user journeys, and component libraries',
    icon: '🎨',
  },
  {
    id: 'graphic-design',
    label: 'Graphic Design',
    description: 'Brand identity, visual kits, packaging, and vector style guides',
    icon: '✨',
  },
  {
    id: 'video-editing',
    label: 'Video Editing',
    description: 'YouTube pacing, TikTok shorts, documentary narrative, and shot lists',
    icon: '🎬',
  },
  {
    id: 'content-creation',
    label: 'Content Creation',
    description: 'Multi-platform repurposing, newsletters, and sponsorship engines',
    icon: '✍️',
  },
  {
    id: 'writing',
    label: 'Writing & Copy',
    description: 'Landing page copy, technical articles, and automated email sequences',
    icon: '📝',
  },
  {
    id: 'social-media',
    label: 'Social Media',
    description: 'Campaign calendars, crisis communication matrices, and influencer tracking',
    icon: '📱',
  },
  {
    id: 'digital-marketing',
    label: 'Digital Marketing',
    description: 'Paid ad funnels, B2B lead generation, and SEO topic clusters',
    icon: '📈',
  },
  {
    id: 'freelance-business',
    label: 'Freelance & Business',
    description: 'Client onboarding, milestone approvals, retainers, and pitch proposals',
    icon: '💼',
  },
  {
    id: 'photography',
    label: 'Photography',
    description: 'Commercial product shoots, event shot lists, and portrait retouching pipelines',
    icon: '📷',
  },
  {
    id: 'podcast-audio',
    label: 'Podcast & Audio',
    description: 'Episode production, narrative audio shows, and voiceover pipelines',
    icon: '🎙️',
  },
  {
    id: 'data-analytics',
    label: 'Data Analytics',
    description: 'ETL ingestion pipelines, executive KPI trees, and predictive models',
    icon: '📊',
  },
  {
    id: 'ai-automation',
    label: 'AI & Automation',
    description: 'RAG system architecture, autonomous agent flows, and no-code meshes',
    icon: '🤖',
  },
  {
    id: 'education-research',
    label: 'Education & Research',
    description: 'Academic literature synthesis, exam mind maps, and course curricula',
    icon: '🎓',
  },
  {
    id: 'product-startup',
    label: 'Product & Startup',
    description: 'Lean MVP roadmaps, customer discovery maps, and GTM launch loops',
    icon: '🚀',
  },
];
