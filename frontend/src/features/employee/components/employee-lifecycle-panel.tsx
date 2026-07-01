import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { EmployeeLifecycleProfile } from '@/features/employee/api/employee.api';

function formatSentAt(value: string | null): string {
  if (!value) {
    return 'Never sent';
  }
  return new Date(value).toLocaleString();
}

function DeliveryBadge({ status }: { status: 'never_sent' | 'sent' | 'failed' }) {
  const styles =
    status === 'sent'
      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      : status === 'failed'
        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
        : 'bg-muted text-muted-foreground';

  const label = status === 'sent' ? 'Sent' : status === 'failed' ? 'Failed' : 'Not sent';

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{label}</span>;
}

export interface EmployeeLifecyclePanelProps {
  lifecycle: EmployeeLifecycleProfile;
  isSendingActivation: boolean;
  isSendingOnboarding: boolean;
  isSendingPasswordReset: boolean;
  onSendActivation: () => void;
  onSendOnboarding: () => void;
  onSendPasswordReset: () => void;
}

export function EmployeeLifecyclePanel({
  lifecycle,
  isSendingActivation,
  isSendingOnboarding,
  isSendingPasswordReset,
  onSendActivation,
  onSendOnboarding,
  onSendPasswordReset,
}: EmployeeLifecyclePanelProps) {
  const canSendActivation = lifecycle.account.hasUserAccount && !lifecycle.account.isActivated;
  const canSendOnboarding = lifecycle.account.isActivated && !lifecycle.onboarding.isComplete;
  const canSendPasswordReset = lifecycle.account.hasUserAccount;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Account & onboarding emails</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Account activation</p>
              <DeliveryBadge status={lifecycle.account.email.deliveryStatus} />
              {lifecycle.account.isActivated ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-200">
                  Activated
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Pending activation
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last sent: {formatSentAt(lifecycle.account.email.lastSentAt)}
              {lifecycle.account.email.sendCount > 0 ? ` · ${lifecycle.account.email.sendCount} time(s)` : ''}
            </p>
            {lifecycle.account.email.lastError ? (
              <p className="text-xs text-destructive">Last error: {lifecycle.account.email.lastError}</p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendActivation || isSendingActivation}
            onClick={onSendActivation}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSendingActivation ? 'animate-spin' : ''}`} />
            {isSendingActivation ? 'Sending…' : 'Send activation email'}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Onboarding form</p>
              <DeliveryBadge status={lifecycle.onboarding.email.deliveryStatus} />
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{lifecycle.onboarding.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Progress: {lifecycle.onboarding.progressPercent}% · Last sent: {formatSentAt(lifecycle.onboarding.email.lastSentAt)}
              {lifecycle.onboarding.email.sendCount > 0 ? ` · ${lifecycle.onboarding.email.sendCount} time(s)` : ''}
            </p>
            {lifecycle.onboarding.email.lastError ? (
              <p className="text-xs text-destructive">Last error: {lifecycle.onboarding.email.lastError}</p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendOnboarding || isSendingOnboarding}
            onClick={onSendOnboarding}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSendingOnboarding ? 'animate-spin' : ''}`} />
            {isSendingOnboarding ? 'Sending…' : 'Send onboarding email'}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Password reset</p>
              <DeliveryBadge status={lifecycle.passwordReset.email.deliveryStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              Last sent: {formatSentAt(lifecycle.passwordReset.email.lastSentAt)}
              {lifecycle.passwordReset.email.sendCount > 0 ? ` · ${lifecycle.passwordReset.email.sendCount} time(s)` : ''}
            </p>
            {lifecycle.passwordReset.email.lastError ? (
              <p className="text-xs text-destructive">Last error: {lifecycle.passwordReset.email.lastError}</p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendPasswordReset || isSendingPasswordReset}
            onClick={onSendPasswordReset}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSendingPasswordReset ? 'animate-spin' : ''}`} />
            {isSendingPasswordReset ? 'Sending…' : 'Send password reset'}
          </Button>
        </div>
      </div>
    </div>
  );
}
