import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateEmployee } from '@/features/employee/hooks/use-employees';
import { checkEmployeeEmailAvailability } from '@/features/employee/api/employee.api';
import { refreshEmployeeQueries } from '@/features/employee/employee-query-keys';
import { FormDialog } from '@/shared/components/form-dialog';
import { FormSection, FORM_SECTIONS } from '@/shared/components/form-section';
import { SelectField } from '@/shared/components/select-field';
import { MasterDataSelect } from '@/shared/components/master-data-select';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/ui/input';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { toastError, toastInfo, toastSuccess } from '@/shared/feedback/toast.store';
import { ROUTES } from '@/config/app.config';

const DEFAULT_TEMP_PASSWORD = 'welcome1';

export interface EmployeeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildSuccessMessage(result: {
  welcomeEmailSent?: boolean;
  welcomeEmailError?: string;
}): string {
  if (result.welcomeEmailSent) {
    return 'Employee created. Portal account is active and welcome email was sent.';
  }
  if (result.welcomeEmailError) {
    return `Employee created, but welcome email could not be sent: ${result.welcomeEmailError}`;
  }
  return 'Employee created with active portal account and onboarding form.';
}

export function EmployeeCreateDialog({ open, onOpenChange }: EmployeeCreateDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    temporaryPassword: DEFAULT_TEMP_PASSWORD,
  });
  const [error, setError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailCheckVersion = useRef(0);
  const submitLock = useRef(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setEmailHint(null);
      setEmailAvailable(null);
    }
  }

  useEffect(() => {
    const email = form.email.trim();
    if (!email || !email.includes('@')) {
      setEmailHint(null);
      setEmailAvailable(null);
      return;
    }

    const version = ++emailCheckVersion.current;
    const timer = window.setTimeout(() => {
      setIsCheckingEmail(true);
      void checkEmployeeEmailAvailability(email)
        .then((result) => {
          if (emailCheckVersion.current !== version) {
            return;
          }
          setEmailAvailable(result.available);
          setEmailHint(result.available ? 'Email is available.' : result.message);
          if (!result.available) {
            setError(result.message);
          } else if (error?.toLowerCase().includes('email')) {
            setError(null);
          }
        })
        .catch(() => {
          if (emailCheckVersion.current !== version) {
            return;
          }
          setEmailAvailable(null);
          setEmailHint(null);
        })
        .finally(() => {
          if (emailCheckVersion.current === version) {
            setIsCheckingEmail(false);
          }
        });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form.email]);

  async function handleSubmit() {
    if (submitLock.current || isSubmitting || createMutation.isPending) {
      return;
    }

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid work email address.');
      return;
    }

    if (emailAvailable === false) {
      setError(emailHint ?? 'This email cannot be used for a new employee.');
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      let latestAvailability;
      try {
        latestAvailability = await checkEmployeeEmailAvailability(trimmedEmail);
      } catch {
        setError('Could not verify email availability. Check your connection and try again.');
        return;
      }

      setEmailAvailable(latestAvailability.available);
      setEmailHint(latestAvailability.message);
      if (!latestAvailability.available) {
        setError(latestAvailability.message);
        return;
      }

      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: trimmedEmail,
        departmentId: form.departmentId,
        designationId: form.designationId,
        joinedAt: new Date(form.joinedAt),
        temporaryPassword: form.temporaryPassword.trim() || DEFAULT_TEMP_PASSWORD,
      };
      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      }
      if (form.branchId.trim()) {
        payload.branchId = form.branchId;
      }

      const employee = await createMutation.mutateAsync(payload);
      await refreshEmployeeQueries(queryClient, employee.id);

      if (employee.alreadyExists) {
        toastInfo('Employee already exists', employee.message ?? 'Opening their profile.');
      } else {
        const message = buildSuccessMessage(employee);
        if (employee.welcomeEmailSent) {
          toastSuccess(message);
        } else if (employee.welcomeEmailError) {
          toastInfo('Employee created', message);
        } else {
          toastSuccess(message);
        }
      }

      onOpenChange(false);
      navigate(ROUTES.employeeDetail(employee.id));
    } catch (mutationError) {
      const parsed = parseMutationError(mutationError);
      if (
        parsed.isConflict &&
        parsed.conflictEmployeeId &&
        (parsed.conflictReason === 'DUPLICATE_EMAIL' ||
          parsed.conflictReason === 'PORTAL_USER_LINKED' ||
          parsed.conflictReason === 'DUPLICATE_KEY')
      ) {
        toastInfo('Employee already exists', 'Opening their profile.');
        onOpenChange(false);
        navigate(ROUTES.employeeDetail(parsed.conflictEmployeeId));
        return;
      }

      if (parsed.preferInline) {
        setError(parsed.message);
        return;
      }

      toastError(parsed.title, parsed.description);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  const isBusy = isSubmitting || createMutation.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      description="Creates an active portal account, sends login credentials, and opens the onboarding form."
      submitLabel="Create Employee"
      pendingLabel="Creating employee…"
      isSubmitting={isBusy}
      submitDisabled={
        emailAvailable !== true ||
        isCheckingEmail ||
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.email.trim() ||
        !form.departmentId ||
        !form.designationId
      }
      onSubmit={handleSubmit}
      size="lg"
    >
      <div className="space-y-4">
        <FormSection
          title={FORM_SECTIONS.BASIC}
          description="Personal identity and contact details."
        >
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
              onChange={(event) => {
                updateField('email', event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              aria-invalid={Boolean(
                error?.toLowerCase().includes('email') || emailAvailable === false,
              )}
              className={
                error?.toLowerCase().includes('email') || emailAvailable === false
                  ? 'border-destructive'
                  : emailAvailable
                    ? 'border-emerald-500'
                    : undefined
              }
              required
            />
            {isCheckingEmail ? (
              <p className="text-sm text-muted-foreground">Checking email availability…</p>
            ) : emailHint ? (
              <p
                className={emailAvailable ? 'text-sm text-emerald-600' : 'text-sm text-destructive'}
              >
                {emailHint}
              </p>
            ) : null}
          </SelectField>
          <SelectField label="Phone" htmlFor="employee-phone">
            <Input
              id="employee-phone"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />
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

        <FormSection
          title={FORM_SECTIONS.BUSINESS}
          description="Employment start and portal access."
        >
          <SelectField label="Joining Date" htmlFor="employee-joined-at" required>
            <DatePicker
              id="employee-joined-at"
              value={form.joinedAt}
              onChange={(value) => updateField('joinedAt', value)}
              required
            />
          </SelectField>
          <SelectField
            label="Default Portal Password"
            htmlFor="employee-temp-password"
            hint="Active account is created with this password. Credentials are emailed to the employee."
            required
          >
            <Input
              id="employee-temp-password"
              type="text"
              value={form.temporaryPassword}
              onChange={(event) => updateField('temporaryPassword', event.target.value)}
              required
            />
          </SelectField>
        </FormSection>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Could not create employee</p>
            <p className="mt-1">{error}</p>
            {error.toLowerCase().includes('email') ? (
              <p className="mt-2 text-muted-foreground">
                Use a unique work email that is not your administrator login. Each employee needs
                their own email.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </FormDialog>
  );
}
