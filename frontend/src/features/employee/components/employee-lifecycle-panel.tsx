import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { EmployeeLifecycleProfile } from '@/features/employee/api/employee.api';
import { toUserFacingErrorMessage } from '@/shared/utils/user-facing-error.util';

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
  isSendingWelcome: boolean;
  isSendingOnboarding: boolean;
  isSendingPasswordReset: boolean;
  onSendWelcome: () => void;
  onSendOnboarding: () => void;
  onSendPasswordReset: () => void;
}

export function EmployeeLifecyclePanel({
  lifecycle,
  isSendingWelcome,
  isSendingOnboarding,
  isSendingPasswordReset,
  onSendWelcome,
  onSendOnboarding,
  onSendPasswordReset,
}: EmployeeLifecyclePanelProps) {
  const canSendWelcome = lifecycle.account.hasUserAccount;
  const canSendOnboarding = lifecycle.account.hasUserAccount && !lifecycle.onboarding.isComplete;
  const canSendPasswordReset = lifecycle.account.hasUserAccount;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Portal access & onboarding</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Login credentials</p>
              <DeliveryBadge status={lifecycle.account.email.deliveryStatus} />
              {lifecycle.account.isActivated ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-200">
                  Active account
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  Inactive account
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Default password is set at creation (welcome1). Employee can log in immediately — no
              activation step.
            </p>
            <p className="text-xs text-muted-foreground">
              Last sent: {formatSentAt(lifecycle.account.email.lastSentAt)}
              {lifecycle.account.email.sendCount > 0
                ? ` · ${lifecycle.account.email.sendCount} time(s)`
                : ''}
            </p>
            {lifecycle.account.email.lastError ? (
              <p className="text-xs text-destructive">
                {toUserFacingErrorMessage(
                  lifecycle.account.email.lastError,
                  'Welcome email could not be sent.',
                )}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendWelcome || isSendingWelcome}
            onClick={onSendWelcome}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSendingWelcome ? 'animate-spin' : ''}`} />
            {isSendingWelcome ? 'Sending…' : 'Resend login email'}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Onboarding form</p>
              <DeliveryBadge status={lifecycle.onboarding.email.deliveryStatus} />
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                {lifecycle.onboarding.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Progress: {lifecycle.onboarding.progressPercent}%. Employee can also open the form
              from their portal. One-time submission.
            </p>
            <p className="text-xs text-muted-foreground">
              Last sent: {formatSentAt(lifecycle.onboarding.email.lastSentAt)}
              {lifecycle.onboarding.email.sendCount > 0
                ? ` · ${lifecycle.onboarding.email.sendCount} time(s)`
                : ''}
            </p>
            {lifecycle.onboarding.email.lastError ? (
              <p className="text-xs text-destructive">
                {toUserFacingErrorMessage(
                  lifecycle.onboarding.email.lastError,
                  'Onboarding email could not be sent.',
                )}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendOnboarding || isSendingOnboarding}
            onClick={onSendOnboarding}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isSendingOnboarding ? 'animate-spin' : ''}`}
            />
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
              {lifecycle.passwordReset.email.sendCount > 0
                ? ` · ${lifecycle.passwordReset.email.sendCount} time(s)`
                : ''}
            </p>
            {lifecycle.passwordReset.email.lastError ? (
              <p className="text-xs text-destructive">
                {toUserFacingErrorMessage(
                  lifecycle.passwordReset.email.lastError,
                  'Password reset email could not be sent.',
                )}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSendPasswordReset || isSendingPasswordReset}
            onClick={onSendPasswordReset}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isSendingPasswordReset ? 'animate-spin' : ''}`}
            />
            {isSendingPasswordReset ? 'Sending…' : 'Send password reset'}
          </Button>
        </div>
      </div>
    </div>
  );
}
