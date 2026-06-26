import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateCandidate } from '@/features/recruitment/hooks/use-recruitment';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ROUTES } from '@/config/app.config';

export function CandidateCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCandidate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const candidate = await createMutation.mutateAsync({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      source: form.source || undefined,
    });
    navigate(ROUTES.recruitmentCandidateDetail(candidate.id));
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to={ROUTES.RECRUITMENT_CANDIDATES}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Candidates
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Add Candidate</h1>
        <p className="text-sm text-muted-foreground">Create a new applicant record in the recruitment pipeline.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">First Name</label>
            <Input required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Last Name</label>
            <Input required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <Input type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Source</label>
          <Input placeholder="LinkedIn, Referral, etc." value={form.source} onChange={(e) => updateField('source', e.target.value)} />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-destructive">Failed to create candidate. Check for duplicate email or phone.</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Candidate'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={ROUTES.RECRUITMENT_CANDIDATES}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
