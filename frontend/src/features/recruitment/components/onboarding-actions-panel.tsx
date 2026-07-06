import { useState } from 'react';
import { ClipboardList, Link2 } from 'lucide-react';
import type { OfferRecord, OnboardingRecord } from '@/features/recruitment/api/recruitment.api';
import {
  useIssueOnboardingPortal,
  useStartOnboarding,
} from '@/features/recruitment/hooks/use-recruitment';
import {
  formatInterviewType,
  safeLocaleDate,
} from '@/features/recruitment/utils/recruitment-display.util';
import { SelectField } from '@/shared/components/select-field';
import { Select } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { runActionMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';

export interface OnboardingActionsPanelProps {
  candidateId: string;
  onboarding: OnboardingRecord | null | undefined;
  offers: OfferRecord[];
  hasEmployee: boolean;
}

export function OnboardingActionsPanel({
  candidateId,
  onboarding,
  offers,
  hasEmployee,
}: OnboardingActionsPanelProps) {
  const startMutation = useStartOnboarding();
  const portalMutation = useIssueOnboardingPortal();
  const [error, setError] = useState<string | null>(null);
  const acceptedOffers = offers.filter((offer) => offer.status === 'accepted');
  const [offerLetterId, setOfferLetterId] = useState(acceptedOffers[0]?.id ?? '');
  const [startDate, setStartDate] = useState(
    acceptedOffers[0]?.joiningDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const completedSections = onboarding?.completedSections ?? [];

  async function handleStartOnboarding() {
    if (!offerLetterId) {
      setError('Select an accepted offer to start onboarding.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Onboarding started. Joining instructions email sent.',
      mutation: () =>
        startMutation.mutateAsync({
          candidateId,
          payload: { offerLetterId, startDate: startDate || undefined },
        }),
    });
  }

  if (hasEmployee) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!onboarding ? (
        <div className="rounded-lg border border-dashed p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <p className="font-medium">Start Digital Onboarding</p>
          </div>
          {acceptedOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Mark an offer as accepted first, then start onboarding to send joining instructions.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Accepted Offer" required>
                  <Select
                    value={offerLetterId}
                    onChange={(event) => setOfferLetterId(event.target.value)}
                  >
                    {acceptedOffers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        Offer v{offer.version ?? 1} — join {safeLocaleDate(offer.joiningDate)}
                      </option>
                    ))}
                  </Select>
                </SelectField>
                <SelectField label="Start Date" htmlFor="onboarding-start-date">
                  <Input
                    id="onboarding-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </SelectField>
              </div>
              {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
              <Button
                className="mt-3"
                onClick={handleStartOnboarding}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? 'Starting...' : 'Start Onboarding'}
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Progress</span>
              <span>{onboarding.progressPercent ?? 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${onboarding.progressPercent ?? 0}%` }}
              />
            </div>
          </div>
          {onboarding.currentSection ? (
            <p className="text-sm">
              Current section:{' '}
              <span className="font-medium capitalize">
                {formatInterviewType(onboarding.currentSection)}
              </span>
            </p>
          ) : null}
          {completedSections.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {completedSections.map((section) => (
                <li
                  key={section}
                  className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm capitalize"
                >
                  {formatInterviewType(section)} ✓
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            variant="outline"
            disabled={portalMutation.isPending}
            onClick={() =>
              runActionMutation({
                successMessage: 'Onboarding portal link emailed to candidate',
                mutation: () => portalMutation.mutateAsync(candidateId),
              })
            }
          >
            <Link2 className="mr-2 h-4 w-4" />
            {portalMutation.isPending ? 'Sending...' : 'Send Onboarding Form Link'}
          </Button>
        </>
      )}
    </div>
  );
}
