import { useState } from 'react';
import { FileBadge } from 'lucide-react';
import type { OfferRecord } from '@/features/recruitment/api/recruitment.api';
import {
  useAcceptOffer,
  useCreateOffer,
  useRejectOffer,
  useSendOffer,
} from '@/features/recruitment/hooks/use-recruitment';
import { safeLocaleDate } from '@/features/recruitment/utils/recruitment-display.util';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { runActionMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';

export interface CreateOfferPanelProps {
  candidateId: string;
  defaultDepartmentId?: string;
  defaultDesignationId?: string;
  offers: OfferRecord[];
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

export function CreateOfferPanel({
  candidateId,
  defaultDepartmentId = '',
  defaultDesignationId = '',
  offers,
}: CreateOfferPanelProps) {
  const createMutation = useCreateOffer();
  const sendMutation = useSendOffer();
  const acceptMutation = useAcceptOffer();
  const rejectMutation = useRejectOffer();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    departmentId: defaultDepartmentId,
    designationId: defaultDesignationId,
    salary: '',
    joiningDate: defaultJoiningDate(),
    expiryDate: defaultExpiryDate(),
  });

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.departmentId || !form.designationId || !form.salary) {
      setError('Department, designation, and salary are required.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Offer draft created. Review and send to the candidate.',
      mutation: () =>
        createMutation.mutateAsync({
          candidateLeadId: candidateId,
          departmentId: form.departmentId,
          designationId: form.designationId,
          salary: Number(form.salary),
          currency: 'INR',
          joiningDate: form.joiningDate,
          expiryDate: form.expiryDate,
        }),
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="rounded-lg border border-dashed p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileBadge className="h-4 w-4 text-primary" />
          <p className="font-medium">Create Offer Letter</p>
        </div>
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
              required
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
              required
            />
          </SelectField>
          <SelectField label="Offer Expiry" htmlFor="offer-expiry" required>
            <Input
              id="offer-expiry"
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
              required
            />
          </SelectField>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="mt-3" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Offer Draft'}
        </Button>
      </form>

      {offers.length > 0 ? (
        <ul className="space-y-3">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded border p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">Offer v{offer.version ?? 1}</p>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {offer.status ?? 'draft'}
                </span>
              </div>
              {offer.joiningDate ? <p>Joining: {safeLocaleDate(offer.joiningDate)}</p> : null}
              {offer.documentUrl ? (
                <a
                  href={offer.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  View offer letter
                </a>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {offer.status === 'draft' ? (
                  <Button
                    size="sm"
                    disabled={sendMutation.isPending}
                    onClick={() =>
                      runActionMutation({
                        successMessage: 'Offer sent to candidate',
                        mutation: () => sendMutation.mutateAsync(offer.id),
                      })
                    }
                  >
                    Send Offer
                  </Button>
                ) : null}
                {offer.status === 'sent' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acceptMutation.isPending}
                      onClick={() =>
                        runActionMutation({
                          successMessage: 'Offer marked accepted',
                          mutation: () => acceptMutation.mutateAsync(offer.id),
                        })
                      }
                    >
                      Mark Accepted
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rejectMutation.isPending}
                      onClick={() =>
                        runActionMutation({
                          successMessage: 'Offer marked declined',
                          mutation: () => rejectMutation.mutateAsync(offer.id),
                        })
                      }
                    >
                      Mark Declined
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
