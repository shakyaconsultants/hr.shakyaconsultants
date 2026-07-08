import type { ComponentType, CSSProperties, ReactNode } from 'react';
import {
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Globe,
  Mail,
  Server,
} from 'lucide-react';
import type { ProjectKnowledgeBase, ProjectRecord } from '@/features/project/api/project.api';
import { Button } from '@/shared/components/ui/button';

interface ProjectDeploymentTabProps {
  project: ProjectRecord;
  knowledgeBase?: ProjectKnowledgeBase | null;
  showEnv: boolean;
  onToggleEnv: () => void;
  canViewEnv: boolean;
  onExportEnv: () => void;
}

function DeploymentCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function LinkValue({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 break-all text-primary hover:underline"
    >
      {label ?? href}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

function EmptyValue() {
  return <span className="text-muted-foreground">Not configured</span>;
}

export function ProjectDeploymentTab({
  project,
  knowledgeBase,
  showEnv,
  onToggleEnv,
  canViewEnv,
  onExportEnv,
}: ProjectDeploymentTabProps) {
  const repositoryUrl = knowledgeBase?.repositoryUrl ?? project.repositoryUrl;
  const deploymentGuide = knowledgeBase?.deploymentGuide;
  const productionUrl = project.productionUrl;
  const developmentUrl = project.stagingUrl;
  const envVariables = knowledgeBase?.envVariables;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DeploymentCard title="Repository" icon={GitBranch}>
        {repositoryUrl ? <LinkValue href={repositoryUrl} /> : <EmptyValue />}
      </DeploymentCard>

      <DeploymentCard title="Production URL" icon={Globe}>
        {productionUrl ? <LinkValue href={productionUrl} /> : <EmptyValue />}
      </DeploymentCard>

      <DeploymentCard title="Development URL" icon={Globe}>
        {developmentUrl ? <LinkValue href={developmentUrl} /> : <EmptyValue />}
      </DeploymentCard>

      <DeploymentCard title="Cloudflare Email" icon={Mail}>
        {knowledgeBase?.cloudflareEmail ? (
          <a
            href={`mailto:${knowledgeBase.cloudflareEmail}`}
            className="text-primary hover:underline"
          >
            {knowledgeBase.cloudflareEmail}
          </a>
        ) : (
          <EmptyValue />
        )}
      </DeploymentCard>

      <DeploymentCard title="Dev Hosting Platform" icon={Server}>
        {knowledgeBase?.devHostingPlatform ?? <EmptyValue />}
      </DeploymentCard>

      <DeploymentCard title="Prod Hosting Platform" icon={Cloud}>
        {knowledgeBase?.prodHostingPlatform ?? <EmptyValue />}
      </DeploymentCard>

      <DeploymentCard title="Deployment Guide" icon={FileText}>
        {deploymentGuide ? (
          <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
            {deploymentGuide}
          </p>
        ) : (
          <EmptyValue />
        )}
      </DeploymentCard>

      {canViewEnv ? (
        <section className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Environment Variables</h3>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onToggleEnv}>
                {showEnv ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                {showEnv ? 'Hide' : 'View'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExportEnv}
                disabled={!envVariables}
              >
                Export .env
              </Button>
            </div>
          </div>
          <pre
            className="max-h-56 overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed"
            style={!showEnv ? ({ WebkitTextSecurity: 'disc' } as CSSProperties) : undefined}
          >
            {envVariables ?? 'Not configured'}
          </pre>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground lg:col-span-2">
          Environment variables are only visible to project managers and admins.
        </p>
      )}
    </div>
  );
}
