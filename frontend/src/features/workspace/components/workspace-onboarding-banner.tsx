import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import {
  useOnboardingStatus,
  useRequestOnboardingPortalLink,
} from '@/features/workspace/hooks/use-workspace';
import { Button } from '@/shared/components/ui/button';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

export function WorkspaceOnboardingBanner() {
  const { data: status, isLoading } = useOnboardingStatus();
  const requestLink = useRequestOnboardingPortalLink();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return null;
  }

  if (!status?.required) {
    return null;
  }

  const openOnboardingForm = async () => {
    await runFormMutation({
      setError,
      successMessage: 'Onboarding form opened in a new tab.',
      mutation: () => requestLink.mutateAsync(),
      onSuccess: (result) => {
        window.open(result.portalUrl, '_blank', 'noopener,noreferrer');
      },
    });
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div>
            <h3 className="font-medium text-amber-950 dark:text-amber-100">
              Complete your onboarding
            </h3>
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
              Fill personal details, address, bank information, and documents once. Progress:{' '}
              {status.progressPercent}%. You can open the secure form here anytime before submission
              — HR can also email you a link.
            </p>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 border-amber-300 hover:bg-amber-100 dark:border-amber-800"
          disabled={requestLink.isPending}
          onClick={() => void openOnboardingForm()}
        >
          {requestLink.isPending ? 'Opening…' : 'Open onboarding form'}
        </Button>
      </div>
    </div>
  );
}
