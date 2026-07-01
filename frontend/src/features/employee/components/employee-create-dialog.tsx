import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee } from '@/features/employee/hooks/use-employees';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { ROUTES } from '@/config/app.config';

export interface EmployeeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeCreateDialog({ open, onOpenChange }: EmployeeCreateDialogProps) {
  const navigate = useNavigate();
  const createMutation = useCreateEmployee();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    branchId: '',
    joinedAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (createMutation.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Employee created successfully.',
      onNonInlineError: () => onOpenChange(false),
      mutation: () => {
        const payload: Record<string, unknown> = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId,
          designationId: form.designationId,
          joinedAt: new Date(form.joinedAt),
        };
        if (form.phone.trim()) {
          payload.phone = form.phone.trim();
        }
        if (form.branchId.trim()) {
          payload.branchId = form.branchId;
        }
        return createMutation.mutateAsync(payload);
      },
      onSuccess: (employee) => {
        onOpenChange(false);
        navigate(ROUTES.employeeDetail(employee.id));
      },
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      description="Create a new employee record without leaving the directory."
      submitLabel="Create Employee"
      isSubmitting={createMutation.isPending}
      onSubmit={handleSubmit}
      size="lg"
    >
      <div className="space-y-4">
        <FormSection title={FORM_SECTIONS.BASIC} description="Personal identity and contact details.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="First Name" htmlFor="employee-first-name" required>
              <Input
                id="employee-first-name"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
              />
            </SelectField>
            <SelectField label="Last Name" htmlFor="employee-last-name" required>
              <Input
                id="employee-last-name"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
              />
            </SelectField>
          </div>
          <SelectField label="Email" htmlFor="employee-email" required>
            <Input
              id="employee-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </SelectField>
          <SelectField label="Phone" htmlFor="employee-phone">
            <Input id="employee-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.RELATIONSHIPS} description="Organizational placement.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Department" htmlFor="employee-department" required>
              <MasterDataSelect
                id="employee-department"
                entityKey="department"
                value={form.departmentId}
                onChange={(value) => updateField('departmentId', value)}
                required
              />
            </SelectField>
            <SelectField label="Designation" htmlFor="employee-designation" required>
              <MasterDataSelect
                id="employee-designation"
                entityKey="designation"
                value={form.designationId}
                onChange={(value) => updateField('designationId', value)}
                required
              />
            </SelectField>
          </div>
          <SelectField label="Branch" htmlFor="employee-branch">
            <MasterDataSelect
              id="employee-branch"
              entityKey="branch"
              value={form.branchId}
              onChange={(value) => updateField('branchId', value)}
            />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.BUSINESS} description="Employment start date.">
          <SelectField label="Joining Date" htmlFor="employee-joined-at" required>
            <DatePicker
              id="employee-joined-at"
              value={form.joinedAt}
              onChange={(value) => updateField('joinedAt', value)}
              required
            />
          </SelectField>
        </FormSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
