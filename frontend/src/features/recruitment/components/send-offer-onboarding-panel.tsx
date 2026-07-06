import { useState } from 'react';
import { FileBadge } from 'lucide-react';
import type { OfferRecord } from '@/features/recruitment/api/recruitment.api';
import {
  useCreateOffer,
  useSendOfferWithOnboarding,
} from '@/features/recruitment/hooks/use-recruitment';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export interface SendOfferOnboardingPanelProps {
  candidateId: string;
  defaultDepartmentId?: string;
  defaultDesignationId?: string;
  offers: OfferRecord[];
  onSent?: () => void;
}

function defaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function defaultJoiningDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function SendOfferOnboardingPanel({
  candidateId,
  defaultDepartmentId = '',
  defaultDesignationId = '',
  offers,
  onSent,
}: SendOfferOnboardingPanelProps) {
  const createMutation = useCreateOffer();
  const sendMutation = useSendOfferWithOnboarding();
  const [error, setError] = useState<string | null>(null);
  const draftOffer = offers.find((offer) => offer.status === 'draft');
  const sentOffer = offers.find((offer) => offer.status === 'sent');
  const [form, setForm] = useState({
    departmentId: defaultDepartmentId,
    designationId: defaultDesignationId,
    salary: '',
    joiningDate: defaultJoiningDate(),
    expiryDate: defaultExpiryDate(),
  });

  async function handleSendOfferAndOnboarding() {
    setError(null);

    if (sentOffer) {
      return;
    }

    try {
      let offerId = draftOffer?.id;

      if (!offerId) {
        if (!form.departmentId || !form.designationId || !form.salary) {
          setError('Department, designation, and salary are required.');
          return;
        }

        const created = await createMutation.mutateAsync({
          candidateLeadId: candidateId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          salary: Number(form.salary),
          currency: 'INR',
          joiningDate: form.joiningDate,
          expiryDate: form.expiryDate,
        });
        offerId = created.id;
      }

      await sendMutation.mutateAsync(offerId);
      onSent?.();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to send offer and onboarding form.',
      );
    }
  }

  if (sentOffer) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-medium text-green-800">Offer and onboarding form already sent</p>
        <p className="mt-1 text-green-700">
          Waiting for the candidate to complete the onboarding form.
        </p>
        {sentOffer.documentUrl ? (
          <a
            href={sentOffer.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-primary hover:underline"
          >
            View offer letter
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileBadge className="h-4 w-4 text-primary" />
        <p className="font-medium">Send Offer & Onboarding Form</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Creates the offer letter, emails it to the candidate, and sends the onboarding portal link
        in one step.
      </p>

      {!draftOffer ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Department" required>
            <MasterDataSelect
              entityKey="department"
              value={form.departmentId}
              onChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
              required
            />
          </SelectField>
          <SelectField label="Designation" required>
            <MasterDataSelect
              entityKey="designation"
              value={form.designationId}
              onChange={(value) => setForm((prev) => ({ ...prev, designationId: value }))}
              required
            />
          </SelectField>
          <SelectField label="Annual CTC (INR)" htmlFor="offer-salary" required>
            <Input
              id="offer-salary"
              type="number"
              min={0}
              placeholder="600000"
              value={form.salary}
              onChange={(event) => setForm((prev) => ({ ...prev, salary: event.target.value }))}
            />
          </SelectField>
          <SelectField label="Joining Date" htmlFor="offer-joining" required>
            <Input
              id="offer-joining"
              type="date"
              value={form.joiningDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, joiningDate: event.target.value }))
              }
            />
          </SelectField>
          <SelectField label="Offer Expiry" htmlFor="offer-expiry" required>
            <Input
              id="offer-expiry"
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
            />
          </SelectField>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Draft offer v{draftOffer.version ?? 1} is ready to send.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        onClick={handleSendOfferAndOnboarding}
        disabled={createMutation.isPending || sendMutation.isPending}
      >
        {sendMutation.isPending ? 'Sending...' : 'Send Offer & Onboarding Form'}
      </Button>
    </div>
  );
}
