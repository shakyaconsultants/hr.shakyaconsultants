import { Cloud, Globe, Mail, RefreshCw, Zap } from 'lucide-react';
import type { Connector, ConnectorProvider } from '@/features/integration/api/integration.api';
import { StatusBadge } from '@/features/integration/components/status-badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const PROVIDER_ICONS: Record<string, typeof Cloud> = {
  cloudinary: Cloud,
  smtp: Mail,
  rest_api: Globe,
  slack: Zap,
  google_calendar: RefreshCw,
};

const PROVIDER_LABELS: Record<string, string> = {
  cloudinary: 'Cloudinary',
  smtp: 'SMTP Email',
  rest_api: 'REST API',
  slack: 'Slack',
  google_calendar: 'Google Calendar',
};

interface ConnectorCardProps {
  connector: Connector;
  onTest?: (connector: Connector) => void;
  onToggle?: (connector: Connector, enabled: boolean) => void;
  onConfigure?: (connector: Connector) => void;
  isTesting?: boolean;
  isToggling?: boolean;
}

export function ConnectorCard({
  connector,
  onTest,
  onToggle,
  onConfigure,
  isTesting,
  isToggling,
}: ConnectorCardProps) {
  const Icon = PROVIDER_ICONS[connector.provider] ?? Globe;
  const label = PROVIDER_LABELS[connector.provider] ?? connector.provider;

  return (
    <div className={cn('rounded-lg border bg-card p-4', !connector.enabled && 'opacity-75')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="font-medium">{connector.name}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={connector.status} />
              {!connector.enabled ? <StatusBadge status="disabled" /> : null}
            </div>
            {connector.errorMessage ? (
              <p className="mt-2 text-xs text-destructive">{connector.errorMessage}</p>
            ) : null}
            {connector.lastTestedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last tested {new Date(connector.lastTestedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {onConfigure ? (
          <Button variant="outline" size="sm" onClick={() => onConfigure(connector)}>
            Configure
          </Button>
        ) : null}
        {onTest ? (
          <Button variant="outline" size="sm" disabled={isTesting} onClick={() => onTest(connector)}>
            {isTesting ? 'Testing…' : 'Test Connection'}
          </Button>
        ) : null}
        {onToggle ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={isToggling}
            onClick={() => onToggle(connector, !connector.enabled)}
          >
            {connector.enabled ? 'Disable' : 'Enable'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function providerLabel(provider: ConnectorProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}
