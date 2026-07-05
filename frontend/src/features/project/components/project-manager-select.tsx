import { useMemo } from 'react';
import { useEmployee } from '@/features/employee/hooks/use-employees';
import { useProjectManagerEmployees } from '@/features/project/hooks/use-project-manager-employees';
import { cn } from '@/shared/utils/cn';

interface ProjectManagerSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** Keeps the current assignee visible when editing even if their designation changed. */
  includeEmployeeId?: string;
}

export function ProjectManagerSelect({
  value,
  onChange,
  className,
  placeholder = 'Select manager',
  includeEmployeeId,
}: ProjectManagerSelectProps) {
  const { data: managers, isLoading } = useProjectManagerEmployees();
  const preserveId = includeEmployeeId ?? value;
  const needsFallback = Boolean(preserveId) && !(managers ?? []).some((employee) => employee.id === preserveId);
  const { data: preservedEmployee } = useEmployee(needsFallback ? preserveId : '');

  const options = useMemo(() => {
    const list = managers ?? [];
    if (preservedEmployee && !list.some((employee) => employee.id === preservedEmployee.id)) {
      return [preservedEmployee, ...list];
    }
    return list;
  }, [managers, preservedEmployee]);

  return (
    <select
      className={cn('h-10 w-full rounded-md border bg-background px-3 text-sm', className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {isLoading ? <option disabled>Loading…</option> : null}
      {options.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.firstName} {employee.lastName}
          {employee.employeeNumber ? ` (${employee.employeeNumber})` : ''}
        </option>
      ))}
    </select>
  );
}
