import { useState } from 'react';
import { KeyRound, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
      : status === 'failed'
        ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15'
        : 'bg-muted text-muted-foreground ring-1 ring-inset ring-border';

  const label = status === 'sent' ? 'Sent' : status === 'failed' ? 'Failed' : 'Not sent';

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>{label}</span>
  );
}

export interface EmployeeLifecyclePanelProps {
  lifecycle: EmployeeLifecycleProfile;
  isSendingWelcome: boolean;
  isSendingOnboarding: boolean;
  isSendingPasswordReset: boolean;
  isSettingPortalPassword: boolean;
  onSendWelcome: (temporaryPassword: string) => void;
  onSetPortalPassword: (password: string) => void;
  onSendOnboarding: () => void;
  onSendPasswordReset: () => void;
}

export function EmployeeLifecyclePanel({
  lifecycle,
  isSendingWelcome,
  isSendingOnboarding,
  isSendingPasswordReset,
  isSettingPortalPassword,
  onSendWelcome,
  onSetPortalPassword,
  onSendOnboarding,
  onSendPasswordReset,
}: EmployeeLifecyclePanelProps) {
  const [resendPassword, setResendPassword] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const canSendWelcome = resendPassword.trim().length >= 6 && !isSendingWelcome;
  const canSetPortalPassword = directPassword.trim().length >= 6 && !isSettingPortalPassword;
  const canSendOnboarding = lifecycle.account.hasUserAccount && !lifecycle.onboarding.isComplete;
  const canSendPasswordReset = lifecycle.account.hasUserAccount;

  return (
    <div className="erp-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4 text-secondary" />
        <h3 className="text-body-sm font-semibold">Portal access & onboarding</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-body-sm font-medium">Login credentials</p>
              <DeliveryBadge status={lifecycle.account.email.deliveryStatus} />
              {lifecycle.account.hasUserAccount && lifecycle.account.isActivated ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                  Active account
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/15">
                  {lifecycle.account.hasUserAccount ? 'Inactive account' : 'No portal account'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Portal password is set when the employee is created. Enter the password below to
              create or update the account and email it to the employee.
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 space-y-1">
              <span className="text-label-caps text-muted-foreground">Portal password to send</span>
              <Input
                value={resendPassword}
                placeholder="Same password used at employee creation"
                onChange={(event) => setResendPassword(event.target.value)}
              />
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={!canSendWelcome}
              onClick={() => onSendWelcome(resendPassword.trim())}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isSendingWelcome ? 'animate-spin' : ''}`}
              />
              {isSendingWelcome
                ? 'Sending…'
                : lifecycle.account.hasUserAccount
                  ? 'Resend login email'
                  : 'Send login email'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-secondary" />
              <p className="text-body-sm font-medium">Change portal password</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Set a new login password immediately. No email is sent — share the password with the
              employee directly.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 space-y-1">
              <span className="text-label-caps text-muted-foreground">New portal password</span>
              <Input
                value={directPassword}
                placeholder="At least 6 characters"
                onChange={(event) => setDirectPassword(event.target.value)}
              />
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={!canSetPortalPassword}
              onClick={() => onSetPortalPassword(directPassword.trim())}
            >
              <KeyRound
                className={`mr-1.5 h-3.5 w-3.5 ${isSettingPortalPassword ? 'animate-pulse' : ''}`}
              />
              {isSettingPortalPassword ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-body-sm font-medium">Onboarding form</p>
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

        <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-body-sm font-medium">Password reset</p>
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
