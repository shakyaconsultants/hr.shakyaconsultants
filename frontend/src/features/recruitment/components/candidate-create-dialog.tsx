import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCandidate } from '@/features/recruitment/hooks/use-recruitment';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { ROUTES } from '@/config/app.config';

export interface CandidateCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateCreateDialog({ open, onOpenChange }: CandidateCreateDialogProps) {
  const navigate = useNavigate();
  const createMutation = useCreateCandidate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
  });
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (createMutation.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Candidate created successfully.',
      mutation: () =>
        createMutation.mutateAsync({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          source: form.source || undefined,
        }),
      onSuccess: (candidate) => {
        onOpenChange(false);
        navigate(ROUTES.recruitmentCandidateDetail(candidate.id));
      },
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Candidate"
      description="Create a new applicant record in the recruitment pipeline."
      submitLabel="Create Candidate"
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <FormSection title={FORM_SECTIONS.BASIC} description="Applicant identity and contact details.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="First Name" htmlFor="candidate-first-name" required>
              <Input
                id="candidate-first-name"
                required
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
              />
            </SelectField>
            <SelectField label="Last Name" htmlFor="candidate-last-name" required>
              <Input
                id="candidate-last-name"
                required
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
              />
            </SelectField>
          </div>
          <SelectField label="Email" htmlFor="candidate-email" required>
            <Input
              id="candidate-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
          </SelectField>
          <SelectField label="Phone" htmlFor="candidate-phone">
            <Input id="candidate-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.ADDITIONAL}>
          <SelectField label="Source" htmlFor="candidate-source" hint="LinkedIn, referral, job board, etc.">
            <Input
              id="candidate-source"
              placeholder="LinkedIn, Referral, etc."
              value={form.source}
              onChange={(event) => updateField('source', event.target.value)}
            />
          </SelectField>
        </FormSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
