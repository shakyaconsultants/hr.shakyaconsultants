import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { useConvertCandidate } from '@/features/recruitment/hooks/use-recruitment';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { SelectField } from '@/shared/components/select-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';

const DEFAULT_TEMP_PASSWORD = 'welcome1';

export interface ConvertCandidatePanelProps {
  candidateId: string;
  defaultDepartmentId?: string;
  defaultDesignationId?: string;
  hasSentOffer: boolean;
}

export function ConvertCandidatePanel({
  candidateId,
  defaultDepartmentId = '',
  defaultDesignationId = '',
  hasSentOffer,
}: ConvertCandidatePanelProps) {
  const convertMutation = useConvertCandidate();
  const [error, setError] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);
  const [designationId, setDesignationId] = useState(defaultDesignationId);
  const [temporaryPassword, setTemporaryPassword] = useState(DEFAULT_TEMP_PASSWORD);

  async function handleConvert() {
    if (!departmentId || !designationId) {
      setError('Department and designation are required.');
      return;
    }

    await runFormMutation({
      setError,
      successMessage:
        'Employee created with active account. Login credentials emailed — onboarding can be completed in the employee portal.',
      mutation: () =>
        convertMutation.mutateAsync({
          candidateLeadId: candidateId,
          departmentId,
          designationId,
          temporaryPassword: temporaryPassword.trim() || DEFAULT_TEMP_PASSWORD,
        }),
    });
  }

  if (!hasSentOffer) {
    return (
      <p className="text-sm text-muted-foreground">
        Send the offer and onboarding form first, then convert the candidate to an employee.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <p className="font-medium">Convert to Employee</p>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Creates an active employee account with the default password and onboarding form. The
        employee completes onboarding once from their portal.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Department" required>
          <MasterDataSelect
            entityKey="department"
            value={departmentId}
            onChange={setDepartmentId}
            required
          />
        </SelectField>
        <SelectField label="Designation" required>
          <MasterDataSelect
            entityKey="designation"
            value={designationId}
            onChange={setDesignationId}
            required
          />
        </SelectField>
        <SelectField label="Portal Password" htmlFor="convert-temp-password">
          <Input
            id="convert-temp-password"
            value={temporaryPassword}
            onChange={(event) => setTemporaryPassword(event.target.value)}
          />
        </SelectField>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <Button
        className="mt-3"
        onClick={handleConvert}
        disabled={convertMutation.isPending || !departmentId || !designationId}
      >
        {convertMutation.isPending ? 'Converting...' : 'Convert & Create Employee Account'}
      </Button>
    </div>
  );
}
