import { useState, useEffect } from 'react';
import { useUpdateEmployee } from '@/features/employee/hooks/use-employees';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { DatePicker } from '@/shared/components/date-picker';
import { AsyncSearchSelect } from '@/shared/components/async-search-select';
import { Input } from '@/shared/components/ui/input';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';

export interface EmployeeEditDialogProps {
  employee: EmployeeRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'probation', label: 'Probation' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'on_leave', label: 'On Leave' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'archived', label: 'Archived' },
  { value: 'deleted', label: 'Deleted' },
];

export function EmployeeEditDialog({ employee, open, onOpenChange }: EmployeeEditDialogProps) {
  const updateMutation = useUpdateEmployee();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    branchId: '',
    joinedAt: '',
    employmentType: 'full_time',
    employmentStatus: 'active',
    status: 'active',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee && open) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        departmentId: employee.departmentId || '',
        designationId: employee.designationId || '',
        branchId: employee.branchId || '',
        joinedAt: employee.joinedAt ? new Date(employee.joinedAt).toISOString().slice(0, 10) : '',
        employmentType: employee.employmentType || 'full_time',
        employmentStatus: employee.employmentStatus || 'active',
        status: employee.status || 'active',
      });
    }
  }, [employee, open]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (updateMutation.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Employee updated successfully.',
      mutation: () =>
        updateMutation.mutateAsync({
          id: employee.id,
          payload: {
            ...form,
            joinedAt: form.joinedAt ? new Date(form.joinedAt) : undefined,
          },
        }),
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Employee Profile"
      description="Update employee record, details, and placements."
      submitLabel="Save Changes"
      isSubmitting={updateMutation.isPending}
      onSubmit={handleSubmit}
      size="lg"
    >
      <div className="space-y-4">
        <FormSection title={FORM_SECTIONS.BASIC} description="Personal identity and contact details.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="First Name" htmlFor="edit-employee-first-name" required>
              <Input
                id="edit-employee-first-name"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
              />
            </SelectField>
            <SelectField label="Last Name" htmlFor="edit-employee-last-name" required>
              <Input
                id="edit-employee-last-name"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
              />
            </SelectField>
          </div>
          <SelectField label="Email" htmlFor="edit-employee-email" required>
            <Input
              id="edit-employee-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </SelectField>
          <SelectField label="Phone" htmlFor="edit-employee-phone">
            <Input id="edit-employee-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.RELATIONSHIPS} description="Organizational placement.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Department" htmlFor="edit-employee-department" required>
              <MasterDataSelect
                id="edit-employee-department"
                entityKey="department"
                value={form.departmentId}
                onChange={(value) => updateField('departmentId', value)}
                required
              />
            </SelectField>
            <SelectField label="Designation" htmlFor="edit-employee-designation" required>
              <MasterDataSelect
                id="edit-employee-designation"
                entityKey="designation"
                value={form.designationId}
                onChange={(value) => updateField('designationId', value)}
                required
              />
            </SelectField>
          </div>
          <SelectField label="Branch" htmlFor="edit-employee-branch">
            <MasterDataSelect
              id="edit-employee-branch"
              entityKey="branch"
              value={form.branchId}
              onChange={(value) => updateField('branchId', value)}
            />
          </SelectField>
        </FormSection>

        <FormSection title={FORM_SECTIONS.BUSINESS} description="Employment parameters and lifecycle state.">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Employment Type" required>
              <AsyncSearchSelect
                value={form.employmentType}
                options={EMPLOYMENT_TYPE_OPTIONS}
                onChange={(next) => updateField('employmentType', next)}
                clearable={false}
              />
            </SelectField>
            <SelectField label="Employment Status" required>
              <AsyncSearchSelect
                value={form.employmentStatus}
                options={EMPLOYMENT_STATUS_OPTIONS}
                onChange={(next) => updateField('employmentStatus', next)}
                clearable={false}
              />
            </SelectField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Joining Date" htmlFor="edit-employee-joined-at" required>
              <DatePicker
                id="edit-employee-joined-at"
                value={form.joinedAt}
                onChange={(value) => updateField('joinedAt', value)}
                required
              />
            </SelectField>
            <SelectField label="Lifecycle Status" required>
              <AsyncSearchSelect
                value={form.status}
                options={STATUS_OPTIONS}
                onChange={(next) => updateField('status', next)}
                clearable={false}
              />
            </SelectField>
          </div>
        </FormSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </FormDialog>
  );
}
