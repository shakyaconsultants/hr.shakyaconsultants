import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCandidate } from '@/features/recruitment/hooks/use-recruitment';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormLabel } from '@/shared/components/form-label';
import { Input } from '@/shared/components/ui/input';
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
    setError(null);
    try {
      const candidate = await createMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        source: form.source || undefined,
      });
      onOpenChange(false);
      navigate(ROUTES.recruitmentCandidateDetail(candidate.id));
    } catch {
      setError('Failed to create candidate. Check for duplicate email or phone.');
    }
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="candidate-first-name">First Name</FormLabel>
            <Input id="candidate-first-name" required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
          </div>
          <div>
            <FormLabel htmlFor="candidate-last-name">Last Name</FormLabel>
            <Input id="candidate-last-name" required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
          </div>
        </div>
        <div>
          <FormLabel htmlFor="candidate-email">Email</FormLabel>
          <Input id="candidate-email" type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} />
        </div>
        <div>
          <FormLabel htmlFor="candidate-phone">Phone</FormLabel>
          <Input id="candidate-phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div>
          <FormLabel htmlFor="candidate-source">Source</FormLabel>
          <Input id="candidate-source" placeholder="LinkedIn, Referral, etc." value={form.source} onChange={(e) => updateField('source', e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
