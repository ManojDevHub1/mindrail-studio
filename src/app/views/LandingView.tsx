/**
 * Public Landing View for MindRail Studio.
 * Introduces the central value proposition, interactive workspace showcase,
 * specialized workspaces, local-first privacy, and rapid project launch.
 */
import { useEffect, useState } from 'react';
import type { Project, WorkspaceType } from '../../domain/models';
import { createProject } from '../../domain/factories';
import { listProjects, saveProject } from '../../persistence/projectRepository';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import {
  BookOpenIcon,
  BriefcaseIcon,
  CheckIcon,
  CodeIcon,
  PlusIcon,
  UploadIcon,
  VideoIcon,
} from '../../design-system/components/Icons';
import { useToast } from '../../design-system/components/Toast';
import { ImportDialog } from '../../import-export/ImportDialog';
import { navigate } from '../router';
import styles from './LandingView.module.css';

export function LandingView() {
  const { showToast } = useToast();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    listProjects().then((all) => {
      setRecentProjects(all.slice(0, 4));
    });
  }, []);

  const handleLaunchWorkspace = async (wsType: WorkspaceType) => {
    const newProject = createProject(wsType);
    try {
      await saveProject(newProject);
      navigate(`/workspace/${wsType}/${newProject.id}`);
      showToast(`Created new ${wsType} workspace`, 'success');
    } catch {
      showToast('Failed to initialize local project', 'danger');
    }
  };

  return (
    <div className={styles.landingContainer}>
      {/* 1. Hero Section */}
      <section className={styles.hero} aria-label="Product introduction">
        <div className={styles.badge}>Private &bull; Local-First &bull; Zero Backend</div>
        <h1 className={styles.title}>Turn messy ideas into structured, visual work.</h1>
        <p className={styles.subtitle}>
          A private visual workspace for software architecture diagrams, video storyboards,
          and revision mind maps. Runs 100% locally in your browser with zero logins and zero subscriptions.
        </p>
        <div className={styles.heroActions}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/projects')}
            icon={<PlusIcon size={18} />}
          >
            Open Workspace
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/templates')}
          >
            Explore Templates &rarr;
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsImportDialogOpen(true)}
            icon={<UploadIcon size={18} />}
          >
            Import .mindrail.json
          </Button>
        </div>
      </section>

      {/* 2. Live Canvas Visual Showcase */}
      <section className={styles.showcaseSection} aria-label="Visual canvas preview">
        <div className={styles.previewWindow}>
          <div className={styles.windowBar}>
            <div className={styles.windowControls}>
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
            </div>
            <span className={styles.windowTitle}>mindrail-studio // active-canvas.preview</span>
            <div style={{ width: 48 }} />
          </div>

          <div className={styles.canvasStageMock}>
            {/* SVG Connecting Edges */}
            <svg className={styles.svgConnections} aria-hidden="true">
              <defs>
                <marker
                  id="preview-arrow"
                  markerHeight="6"
                  markerWidth="6"
                  orient="auto-start-reverse"
                  refX="9"
                  refY="5"
                  viewBox="0 0 10 10"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--mr-accent-primary)" />
                </marker>
              </defs>
              {/* Path 1: API Gateway -> Auth Service */}
              <path
                d="M 230 110 C 290 110, 290 190, 350 190"
                fill="none"
                stroke="var(--mr-accent-primary)"
                strokeWidth="2"
                markerEnd="url(#preview-arrow)"
              />
              {/* Path 2: Auth Service -> PostgreSQL */}
              <path
                d="M 570 190 C 630 190, 630 120, 690 120"
                fill="none"
                stroke="var(--mr-accent-primary)"
                strokeWidth="2"
                markerEnd="url(#preview-arrow)"
              />
              {/* Path 3: Auth Service -> Event Queue */}
              <path
                d="M 570 210 C 630 210, 630 280, 690 280"
                fill="none"
                stroke="var(--mr-node-amber-accent)"
                strokeWidth="2"
                strokeDasharray="4,4"
                markerEnd="url(#preview-arrow)"
              />
            </svg>

            {/* Node 1: Ingress Gateway */}
            <div
              className={styles.mockNode}
              style={{
                top: 60,
                left: 40,
                width: 190,
                borderTop: '3px solid var(--mr-node-cyan-accent)',
              }}
            >
              <div className={styles.mockNodeTitle}>
                <span>API Gateway</span>
                <Badge variant="cyan">Ingress</Badge>
              </div>
              <span className={styles.mockNodeDesc}>Public TLS reverse proxy</span>
              <div className={styles.mockNodeCode}>:443 &rarr; /api/v1/*</div>
            </div>

            {/* Node 2: Auth Microservice */}
            <div
              className={styles.mockNode}
              style={{
                top: 130,
                left: 350,
                width: 220,
                borderTop: '3px solid var(--mr-node-blue-accent)',
                boxShadow: '0 0 0 2px rgba(94, 158, 255, 0.35), var(--mr-shadow-md)',
              }}
            >
              <div className={styles.mockNodeTitle}>
                <span>Auth Service</span>
                <Badge variant="blue">Service</Badge>
              </div>
              <span className={styles.mockNodeDesc}>JWT token verification & RBAC</span>
              <div className={styles.mockNodeCode}>validateSession(req)</div>
            </div>

            {/* Node 3: Primary Database */}
            <div
              className={styles.mockNode}
              style={{
                top: 60,
                left: 690,
                width: 200,
                borderTop: '3px solid var(--mr-node-emerald-accent)',
              }}
            >
              <div className={styles.mockNodeTitle}>
                <span>User Database</span>
                <Badge variant="emerald">Storage</Badge>
              </div>
              <span className={styles.mockNodeDesc}>PostgreSQL 16 clustered</span>
              <div className={styles.mockNodeCode}>users, sessions, roles</div>
            </div>

            {/* Node 4: Event Queue */}
            <div
              className={styles.mockNode}
              style={{
                top: 230,
                left: 690,
                width: 200,
                borderTop: '3px solid var(--mr-node-amber-accent)',
              }}
            >
              <div className={styles.mockNodeTitle}>
                <span>Audit Queue</span>
                <Badge variant="amber">Queue</Badge>
              </div>
              <span className={styles.mockNodeDesc}>Redis Streams log topics</span>
              <div className={styles.mockNodeCode}>stream:auth:events</div>
            </div>

            {/* Miniature Canvas HUD */}
            <div className={styles.mockHud}>
              <span>100%</span>
              &bull;
              <span>4 nodes &bull; 3 connections</span>
              &bull;
              <span>Snap: 16px</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent Projects Strip (if any saved) */}
      {recentProjects.length > 0 && (
        <section className={styles.section} aria-label="Recent local projects">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Recent Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              View all ({recentProjects.length}) &rarr;
            </Button>
          </div>
          <div className={styles.recentGrid}>
            {recentProjects.map((p) => (
              <div
                key={p.id}
                className={styles.recentCard}
                onClick={() => navigate(`/workspace/${p.workspaceType}/${p.id}`)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/workspace/${p.workspaceType}/${p.id}`);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--mr-text-primary)' }}>{p.title}</span>
                  <Badge variant={p.workspaceType === 'developer' ? 'blue' : p.workspaceType === 'video' ? 'orange' : p.workspaceType === 'freelance' ? 'purple' : 'emerald'}>
                    {p.workspaceType.toUpperCase()}
                  </Badge>
                </div>
                <span style={{ fontSize: 12, color: 'var(--mr-text-muted)' }}>
                  {p.nodes.length} nodes &bull; Updated {new Date(p.metadata.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. How It Works 4-Step Flow */}
      <section className={styles.section} aria-label="How it works">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for Visual Thinkers</h2>
          <p className={styles.sectionSubtitle}>
            Four structured steps to turn complex ideas into durable, production-grade workflows.
          </p>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepHeading}>Spawn & Sketch</h3>
            <p className={styles.stepText}>
              Drop services, video scenes, or study topics onto an infinite 16px grid canvas using shortcut <code>N</code> or the left palette.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepHeading}>Connect Flows</h3>
            <p className={styles.stepText}>
              Draw directed bezier connections between port handles with pointer drag or the accessible <code>C</code> keyboard connection mode.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepHeading}>Refine & Edit</h3>
            <p className={styles.stepText}>
              Attach syntax-highlighted code snippets, scene timecodes, or flashcard answers in the contextual inspector with debounced undo history.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepHeading}>Own Your Data</h3>
            <p className={styles.stepText}>
              All changes autosave to browser IndexedDB. Export clean, portable <code>.mindrail.json</code> files anytime for version control.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Four Specialized Workspaces */}
      <section className={styles.section} aria-label="Specialized workspaces">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Four Specialized Workspaces</h2>
          <p className={styles.sectionSubtitle}>
            Tailored node types, properties, and metrics for developers, creators, students, and freelancers.
          </p>
        </div>
        <div className={styles.workspaceGrid}>
          {/* Developer Workspace Card */}
          <div
            className={styles.workspaceCard}
            onClick={() => handleLaunchWorkspace('developer')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLaunchWorkspace('developer');
            }}
          >
            <div>
              <div className={styles.cardTop}>
                <CodeIcon size={32} style={{ color: 'var(--mr-accent-primary)' }} />
                <Badge variant="blue">DEVELOPER</Badge>
              </div>
              <h3 className={styles.cardHeading}>Software Architecture &amp; Tasks</h3>
              <p className={styles.cardDescription}>
                Design system topology, microservices, databases, and message queues. Attach syntax-highlighted code snippets and track implementation tasks on the same canvas.
              </p>
            </div>
            <div>
              <ul className={styles.featuresList}>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Services, databases &amp; queue nodes</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Connected code snippet nodes</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Task status &amp; priority tags</li>
              </ul>
              <Button variant="primary" size="sm" style={{ width: '100%', marginTop: 16 }}>
                Open Developer Workspace
              </Button>
            </div>
          </div>

          {/* Video Creator Workspace Card */}
          <div
            className={styles.workspaceCard}
            onClick={() => handleLaunchWorkspace('video')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLaunchWorkspace('video');
            }}
          >
            <div>
              <div className={styles.cardTop}>
                <VideoIcon size={32} style={{ color: 'var(--mr-accent-video)' }} />
                <Badge variant="orange">VIDEO CREATOR</Badge>
              </div>
              <h3 className={styles.cardHeading}>Storyboard &amp; Video Pacing</h3>
              <p className={styles.cardDescription}>
                Plan YouTube videos, commercials, and courses. Structure hook and call-to-action beats, calculate total runtime, and organize visual framing cues.
              </p>
            </div>
            <div>
              <ul className={styles.featuresList}>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Scene cards with framing &amp; duration</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Spoken script &amp; voice-over cues</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Automatic timeline roll-up</li>
              </ul>
              <Button variant="secondary" size="sm" style={{ width: '100%', marginTop: 16 }}>
                Open Video Workspace
              </Button>
            </div>
          </div>

          {/* Student Workspace Card */}
          <div
            className={styles.workspaceCard}
            onClick={() => handleLaunchWorkspace('student')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLaunchWorkspace('student');
            }}
          >
            <div>
              <div className={styles.cardTop}>
                <BookOpenIcon size={32} style={{ color: 'var(--mr-accent-student)' }} />
                <Badge variant="emerald">STUDENT</Badge>
              </div>
              <h3 className={styles.cardHeading}>Mind Maps &amp; Flashcards</h3>
              <p className={styles.cardDescription}>
                Transform lecture notes into visual mind maps. Connect topics to spaced-repetition flashcards and track concept mastery locally without subscriptions.
              </p>
            </div>
            <div>
              <ul className={styles.featuresList}>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Hierarchical concept mind maps</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Interactive Q&amp;A flashcards</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Mastery breakdown &amp; checklists</li>
              </ul>
              <Button variant="secondary" size="sm" style={{ width: '100%', marginTop: 16 }}>
                Open Student Workspace
              </Button>
            </div>
          </div>

          {/* Freelance & Business Workspace Card */}
          <div
            className={styles.workspaceCard}
            onClick={() => handleLaunchWorkspace('freelance')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLaunchWorkspace('freelance');
            }}
          >
            <div>
              <div className={styles.cardTop}>
                <BriefcaseIcon size={32} style={{ color: 'var(--mr-node-purple-accent)' }} />
                <Badge variant="purple">FREELANCE &amp; BUSINESS</Badge>
              </div>
              <h3 className={styles.cardHeading}>Client Deliverables &amp; Milestones</h3>
              <p className={styles.cardDescription}>
                Structure client projects from creative brief to final delivery. Track milestone stages, deliverable assets, revision feedback, and client sign-offs.
              </p>
            </div>
            <div>
              <ul className={styles.featuresList}>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Milestone stages &amp; phase tracking</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Deliverable review &amp; approval statuses</li>
                <li><CheckIcon size={14} style={{ color: 'var(--mr-color-success)' }} /> Client feedback &amp; creative briefs</li>
              </ul>
              <Button variant="secondary" size="sm" style={{ width: '100%', marginTop: 16 }}>
                Open Freelance Workspace
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Local-First Architecture Guarantees */}
      <section className={styles.section} aria-label="Local-first guarantees">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built on Local-First Principles</h2>
          <p className={styles.sectionSubtitle}>
            No cloud lock-in, no telemetry, and complete offline sovereignty over your ideas.
          </p>
        </div>
        <div className={styles.guaranteesGrid}>
          <div className={styles.guaranteeItem}>
            <h3 className={styles.guaranteeTitle}>Zero Cloud Servers</h3>
            <p className={styles.guaranteeText}>
              MindRail Studio runs 100% in your browser. No databases, no backend API routes, and no external server downtime.
            </p>
          </div>

          <div className={styles.guaranteeItem}>
            <h3 className={styles.guaranteeTitle}>Zero User Accounts</h3>
            <p className={styles.guaranteeText}>
              No email registration, passwords, or OAuth walls. You open the application and immediately start creating.
            </p>
          </div>

          <div className={styles.guaranteeItem}>
            <h3 className={styles.guaranteeTitle}>Local Data Persistence</h3>
            <p className={styles.guaranteeText}>
              All projects are saved to browser IndexedDB. Export durable <code>.mindrail.json</code> files anytime for backups.
            </p>
          </div>

          <div className={styles.guaranteeItem}>
            <h3 className={styles.guaranteeTitle}>Zero Telemetry</h3>
            <p className={styles.guaranteeText}>
              No tracking cookies, marketing beacons, or remote behavioral analytics. Your ideas remain strictly private.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Bottom Final CTA Strip */}
      <section className={styles.finalCtaSection} aria-label="Get started">
        <div className={styles.finalCtaContent}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Start creating in seconds.</h2>
          <p className={styles.subtitle} style={{ marginBottom: 8 }}>
            No sign-up or credit card required. Everything runs directly on your machine.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/projects')}
              icon={<PlusIcon size={18} />}
            >
              Open Workspace
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/templates')}
            >
              Explore Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Import Modal */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={(imported) => {
          navigate(`/workspace/${imported.workspaceType}/${imported.id}`);
          showToast(`Imported project "${imported.title}"`, 'success');
        }}
      />
    </div>
  );
}
